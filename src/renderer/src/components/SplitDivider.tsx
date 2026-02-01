/**
 * @file SplitDivider 可拖动分割线组件
 * @description 分屏模式下的可拖动分割线，支持调整两个视图的比例
 * 适配 Flex 布局，在独立的 14px 空间内显示
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'

/**
 * SplitDivider 组件属性
 */
interface SplitDividerProps {
  /** 比例变化回调 - 同步更新 BrowserView */
  onRatioChange: (ratio: number) => void
  /** 拖动开始回调 */
  onDragStart?: () => void
  /** 拖动结束回调 */
  onDragEnd?: () => void
}

/**
 * 分屏分割线组件
 * 在独立的 14px 空间内居中显示
 */
export function SplitDivider({
  onRatioChange,
  onDragStart,
  onDragEnd
}: SplitDividerProps): React.JSX.Element {
  // 拖动状态
  const [isDragging, setIsDragging] = useState(false)
  // 容器引用，用于计算拖动位置
  const containerRef = useRef<HTMLDivElement>(null)
  // 用于节流的引用
  const lastUpdateTime = useRef(0)

  /**
   * 处理鼠标按下事件 - 开始拖动
   */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent): void => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)
      onDragStart?.()
    },
    [onDragStart]
  )

  /**
   * 处理鼠标移动事件 - 同步更新比例
   * 关键：使用整个分屏区域的父容器计算，并添加节流避免闪烁
   */
  const handleMouseMove = useCallback(
    (e: MouseEvent): void => {
      if (!isDragging || !containerRef.current) return

      // 节流：每 16ms (~60fps) 更新一次，避免过于频繁的更新
      const now = Date.now()
      if (now - lastUpdateTime.current < 16) return
      lastUpdateTime.current = now

      // 获取 SplitDivider 的父容器（14px 宽度的 div）
      const dividerContainer = containerRef.current.parentElement
      if (!dividerContainer) return

      // 获取整个分屏区域的容器（flex 容器）
      const mainContainer = dividerContainer.parentElement
      if (!mainContainer) return

      const mainRect = mainContainer.getBoundingClientRect()
      const mainWidth = mainRect.width

      // 计算鼠标在整个分屏区域的位置
      const mouseX = e.clientX - mainRect.left

      // 计算新的比例（限制在 0.1-0.9 范围内）
      const newRatio = Math.max(0.1, Math.min(0.9, mouseX / mainWidth))

      // 同步更新
      onRatioChange(newRatio)
    },
    [isDragging, onRatioChange]
  )

  /**
   * 处理鼠标释放事件 - 结束拖动
   */
  const handleMouseUp = useCallback((): void => {
    setIsDragging(false)
    onDragEnd?.()
  }, [onDragEnd])

  /**
   * 处理双击事件 - 恢复默认比例 50%
   */
  const handleDoubleClick = useCallback((): void => {
    onRatioChange(0.5)
  }, [onRatioChange])

  /**
   * 添加全局鼠标事件监听
   */
  useEffect(() => {
    if (isDragging) {
      // 使用 capture 阶段确保事件被正确捕获
      document.addEventListener('mousemove', handleMouseMove, { capture: true })
      document.addEventListener('mouseup', handleMouseUp, { capture: true })
      // 防止拖动时选中文本
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'col-resize'
    } else {
      document.removeEventListener('mousemove', handleMouseMove, { capture: true })
      document.removeEventListener('mouseup', handleMouseUp, { capture: true })
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove, { capture: true })
      document.removeEventListener('mouseup', handleMouseUp, { capture: true })
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <div
      ref={containerRef}
      className="h-full w-full flex items-center justify-center cursor-col-resize"
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {/* 居中细线 */}
      <div
        className="h-full rounded-full"
        style={{
          width: isDragging ? '4px' : '2px',
          backgroundColor: isDragging ? '#3b82f6' : '#9ca3af',
          minWidth: '2px'
        }}
      />
    </div>
  )
}
