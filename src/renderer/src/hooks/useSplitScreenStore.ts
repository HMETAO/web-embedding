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

  // Actions - 修改状态的方法
  setIsSplit: (isSplit: boolean) => void
  setPrimaryUrl: (url: string | null) => void
  setIsPrimaryViewCreated: (created: boolean) => void
  setWindowSize: (size: WindowSize) => void
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

  // Actions
  setIsSplit: (isSplit) => set({ isSplit }),
  setPrimaryUrl: (primaryUrl) => set({ primaryUrl }),
  setIsPrimaryViewCreated: (isPrimaryViewCreated) => set({ isPrimaryViewCreated }),
  setWindowSize: (windowSize) => set({ windowSize })
}))

/**
 * 分屏控制 Hook 返回类型
 */
interface UseSplitScreenReturn {
  isSplit: boolean
  primaryUrl: string | null
  isPrimaryViewCreated: boolean
  windowSize: WindowSize
  primaryContainerRef: React.RefObject<HTMLDivElement | null>
  secondaryContainerRef: React.RefObject<HTMLDivElement | null>
  navigate: (url: string) => void
  goHome: () => void
  openSplit: () => void
  closeSplit: () => void
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
    setIsSplit,
    setPrimaryUrl,
    setIsPrimaryViewCreated,
    setWindowSize
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
  }, [setPrimaryUrl, setIsSplit, setIsPrimaryViewCreated])

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
    setTimeout(updateViewBounds, 50)
  }, [setIsSplit, updateViewBounds])

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
   * 分屏状态变化时更新布局
   */
  useEffect(() => {
    if (!isPrimaryViewCreated) return

    const timer = setTimeout(() => {
      updateViewBounds()
    }, 350)

    return () => clearTimeout(timer)
  }, [isSplit, isPrimaryViewCreated, updateViewBounds])

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
   * 组件卸载时清理
   */
  useEffect(() => {
    return () => {
      browserViewIPC.destroyAllViews()
    }
  }, [])

  return {
    // 状态
    isSplit,
    primaryUrl,
    isPrimaryViewCreated,
    windowSize,

    // 引用
    primaryContainerRef,
    secondaryContainerRef,

    // 操作函数
    navigate,
    goHome,
    openSplit,
    closeSplit
  }
}
