/**
 * @file 分屏状态管理 Store
 * @description 使用 Zustand 管理分屏状态，使用新的 IPC 架构
 * 提供更简洁的 API 和更好的性能
 */

import { create } from 'zustand'
import { useEffect, useRef, useCallback } from 'react'
import { browserViewIPC } from '../ipc/browserView'

/**
 * 视图边界配置
 */
interface ViewBounds {
  x: number
  y: number
  width: number
  height: number
}

/**
 * 窗口尺寸状态
 */
interface WindowSize {
  width: number
  height: number
}

/**
 * 分屏状态接口
 */
interface SplitScreenState {
  // 状态
  isSplit: boolean
  primaryUrl: string | null
  isPrimaryViewCreated: boolean
  windowSize: WindowSize
  splitRatio: number // 分割比例 0.1-0.9

  // Actions - 修改状态的方法
  setIsSplit: (isSplit: boolean) => void
  setPrimaryUrl: (url: string | null) => void
  setIsPrimaryViewCreated: (created: boolean) => void
  setWindowSize: (size: WindowSize) => void
  setSplitRatio: (ratio: number) => void
}

/**
 * 创建分屏状态 Store
 * 使用 Zustand 的 create 函数创建全局状态管理
 */
export const useSplitScreenStore = create<SplitScreenState>((set) => ({
  // 初始状态
  isSplit: false,
  primaryUrl: null,
  isPrimaryViewCreated: false,
  windowSize: {
    width: window.innerWidth,
    height: window.innerHeight
  },
  splitRatio: 0.5, // 默认 50% 分割

  // Actions
  setIsSplit: (isSplit) => set({ isSplit }),
  setPrimaryUrl: (primaryUrl) => set({ primaryUrl }),
  setIsPrimaryViewCreated: (isPrimaryViewCreated) => set({ isPrimaryViewCreated }),
  setWindowSize: (windowSize) => set({ windowSize }),
  setSplitRatio: (splitRatio) => set({ splitRatio: Math.max(0.1, Math.min(0.9, splitRatio)) })
}))

/**
 * 分屏控制 Hook 返回类型
 */
interface UseSplitScreenReturn {
  isSplit: boolean
  primaryUrl: string | null
  isPrimaryViewCreated: boolean
  windowSize: WindowSize
  splitRatio: number
  primaryContainerRef: React.RefObject<HTMLDivElement | null>
  secondaryContainerRef: React.RefObject<HTMLDivElement | null>
  navigate: (url: string) => void
  goHome: () => void
  openSplit: () => void
  closeSplit: () => void
  updateSplitRatio: (ratio: number) => void
}

/**
 * 分屏控制 Hook
 * 封装 Zustand store 和 BrowserView 交互逻辑
 * @returns 分屏状态和操作函数
 */
export function useSplitScreen(): UseSplitScreenReturn {
  // 从 Zustand store 获取状态
  const {
    isSplit,
    primaryUrl,
    isPrimaryViewCreated,
    windowSize,
    splitRatio,
    setIsSplit,
    setPrimaryUrl,
    setIsPrimaryViewCreated,
    setWindowSize,
    setSplitRatio
  } = useSplitScreenStore()

  // 创建 DOM 引用
  const primaryContainerRef = useRef<HTMLDivElement>(null)
  const secondaryContainerRef = useRef<HTMLDivElement>(null)

  /**
   * 获取元素边界
   */
  const getElementBounds = useCallback((element: HTMLElement | null): ViewBounds | null => {
    if (!element) return null
    const rect = element.getBoundingClientRect()
    return {
      x: Math.round(rect.left),
      y: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    }
  }, [])

  /**
   * 更新视图边界
   */
  const updateViewBounds = useCallback(() => {
    const primaryBounds = getElementBounds(primaryContainerRef.current)
    if (primaryBounds) {
      browserViewIPC.updateBounds('primary', primaryBounds)
    }

    if (isSplit && secondaryContainerRef.current) {
      const secondaryBounds = getElementBounds(secondaryContainerRef.current)
      if (secondaryBounds && secondaryBounds.width > 0) {
        browserViewIPC.updateBounds('secondary', secondaryBounds)
      }
    }
  }, [isSplit, getElementBounds])

  /**
   * 导航到 URL
   */
  const navigate = useCallback(
    (url: string) => {
      setPrimaryUrl(url)

      setTimeout(() => {
        if (!primaryContainerRef.current) return

        const bounds = getElementBounds(primaryContainerRef.current)
        if (!bounds) return

        browserViewIPC.createPrimaryView(url, bounds)
        setIsPrimaryViewCreated(true)
      }, 100)
    },
    [setPrimaryUrl, setIsPrimaryViewCreated, getElementBounds]
  )

  /**
   * 返回首页
   */
  const goHome = useCallback(() => {
    browserViewIPC.destroyAllViews()
    setPrimaryUrl(null)
    setIsSplit(false)
    setIsPrimaryViewCreated(false)
    setSplitRatio(0.5) // 重置分割比例
  }, [setPrimaryUrl, setIsSplit, setIsPrimaryViewCreated, setSplitRatio])

  /**
   * 开启分屏
   */
  const openSplit = useCallback(() => {
    setIsSplit(true)
  }, [setIsSplit])

  /**
   * 关闭分屏
   */
  const closeSplit = useCallback(() => {
    browserViewIPC.destroySecondaryView()
    setIsSplit(false)
    setSplitRatio(0.5) // 重置分割比例
    setTimeout(updateViewBounds, 50)
  }, [setIsSplit, setSplitRatio, updateViewBounds])

  /**
   * 更新分屏比例 - 同步更新，消除闪烁
   * 关键：不使用 requestAnimationFrame，立即同步更新 UI 和 BrowserView
   */
  const updateSplitRatio = useCallback(
    (ratio: number) => {
      // 限制比例范围
      const clampedRatio = Math.max(0.1, Math.min(0.9, ratio))

      // 先更新状态（触发 UI 重新渲染）
      setSplitRatio(clampedRatio)

      // 立即计算并更新 BrowserView 边界
      // 关键：不使用 requestAnimationFrame，确保与 UI 同步
      if (primaryContainerRef.current && secondaryContainerRef.current) {
        const containerWidth = window.innerWidth
        const containerHeight = window.innerHeight - 40 // 减去导航栏

        // 计算主视图边界
        const primaryWidth = Math.round(containerWidth * clampedRatio)
        const primaryBounds = {
          x: 0,
          y: 40,
          width: primaryWidth,
          height: containerHeight
        }
        browserViewIPC.updateBounds('primary', primaryBounds)

        // 计算次级视图边界
        const secondaryWidth = containerWidth - primaryWidth
        const secondaryBounds = {
          x: primaryWidth,
          y: 40,
          width: secondaryWidth,
          height: containerHeight
        }
        browserViewIPC.updateBounds('secondary', secondaryBounds)

        // 通知主进程更新分割比例
        browserViewIPC.updateSplitRatio(clampedRatio)
      }
    },
    [setSplitRatio]
  )

  /**
   * 监听窗口大小变化
   */
  useEffect(() => {
    const handleResize = (): void => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setWindowSize])

  /**
   * 窗口大小变化时更新视图
   */
  useEffect(() => {
    if (!isPrimaryViewCreated) return

    requestAnimationFrame(() => {
      updateViewBounds()
    })
  }, [windowSize, isSplit, isPrimaryViewCreated, updateViewBounds])

  /**
   * 分屏状态或比例变化时更新布局
   */
  useEffect(() => {
    if (!isPrimaryViewCreated) return

    const timer = setTimeout(() => {
      updateViewBounds()
    }, 350)

    return () => clearTimeout(timer)
  }, [isSplit, splitRatio, isPrimaryViewCreated, updateViewBounds])

  /**
   * 监听次级视图创建事件
   */
  useEffect(() => {
    if (!isPrimaryViewCreated) return

    const unsubscribe = browserViewIPC.onSecondaryCreated(() => {
      setIsSplit(true)
    })

    return () => unsubscribe()
  }, [isPrimaryViewCreated, setIsSplit])

  /**
   * 同步分屏状态
   * 主动查询主进程状态并同步本地状态
   */
  const syncSplitStatus = useCallback(async () => {
    if (!isPrimaryViewCreated) return

    try {
      const detailedStatus = await browserViewIPC.getDetailedSplitStatus()

      // 🔥 关键修复：如果主进程有次视图但本地状态没有，则同步
      if (detailedStatus.hasSecondaryView && !isSplit) {
        console.log('[useSplitScreen] 检测到状态不一致，同步分屏状态')
        setIsSplit(true)
      }

      // 🔥 关键修复：如果主进程没有次视图但本地状态有，则重置
      if (!detailedStatus.hasSecondaryView && isSplit) {
        console.log('[useSplitScreen] 检测到状态不一致，重置分屏状态')
        setIsSplit(false)
        setSplitRatio(0.5)
      }
    } catch (error) {
      console.warn('[useSplitScreen] 状态同步失败:', error)
    }
  }, [isPrimaryViewCreated, isSplit, setIsSplit, setSplitRatio])

  /**
   * 组件卸载时清理
   */
  useEffect(() => {
    return () => {
      browserViewIPC.destroyAllViews()
    }
  }, [])

  /**
   * 🔥 关键修复：组件挂载后同步状态
   */
  useEffect(() => {
    // 延迟同步，等待主进程状态稳定
    const timer = setTimeout(() => {
      syncSplitStatus()
    }, 500)

    return () => clearTimeout(timer)
  }, [syncSplitStatus])

  /**
   * 🔥 关键修复：窗口获得焦点时同步状态
   */
  useEffect(() => {
    const handleFocus = (): void => {
      syncSplitStatus()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [syncSplitStatus])

  /**
   * 🔥 关键修复：定期状态检查
   */
  useEffect(() => {
    if (!isPrimaryViewCreated) return

    // 每 5 秒检查一次状态
    const interval = setInterval(() => {
      syncSplitStatus()
    }, 5000)

    return () => clearInterval(interval)
  }, [isPrimaryViewCreated, syncSplitStatus])

  return {
    // 状态
    isSplit,
    primaryUrl,
    isPrimaryViewCreated,
    windowSize,
    splitRatio,

    // 引用
    primaryContainerRef,
    secondaryContainerRef,

    // 操作函数
    navigate,
    goHome,
    openSplit,
    closeSplit,
    updateSplitRatio
  }
}
