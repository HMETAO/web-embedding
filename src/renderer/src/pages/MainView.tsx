/**
 * @file 主视图组件
 * @description 应用程序主控制器，使用 useSplitScreen Hook 管理分屏状态
 * 使用 Flex 布局，为分割线提供独立空间
 * 拖动时通过 BrowserView 遮罩层减少闪烁视觉影响
 */

import { useState } from 'react'
import { useSplitScreen } from '@renderer/hooks/useSplitScreenStore'
import { browserViewIPC } from '@renderer/ipc/browserView'
import HomePage from '@renderer/pages/Home'
import { SplitDivider } from '@renderer/components/SplitDivider'

/**
 * 主视图组件
 * 通过 useSplitScreen Hook 获取所有分屏状态和操作函数
 * 使用 Flex 布局确保分割线有独立的 14px 空间
 * 拖动时显示 BrowserView 遮罩层覆盖两个视图
 */
function MainView(): React.JSX.Element {
  const {
    isSplit,
    primaryUrl,
    isPrimaryViewCreated,
    splitRatio,
    primaryContainerRef,
    secondaryContainerRef,
    navigate,
    goHome,
    closeSplit,
    updateSplitRatio
  } = useSplitScreen()

  // 拖动状态 - 用于控制是否启用 transition
  const [isDragging, setIsDragging] = useState(false)

  // 未加载主 URL 时显示首页
  if (!primaryUrl) {
    return <HomePage onNavigate={navigate} />
  }

  /**
   * 处理比例变化 - 同步更新
   */
  const handleRatioChange = (ratio: number): void => {
    updateSplitRatio(ratio)
  }

  /**
   * 处理拖动开始 - 显示遮罩层
   */
  const handleDragStart = (): void => {
    setIsDragging(true)
    // 显示 BrowserView 遮罩层
    browserViewIPC.showOverlay()
  }

  /**
   * 处理拖动结束 - 隐藏遮罩层
   */
  const handleDragEnd = (): void => {
    setIsDragging(false)
    // 隐藏 BrowserView 遮罩层
    browserViewIPC.hideOverlay()
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* 导航栏 */}
      <div className="h-10 bg-gray-800 flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={goHome}
            className="text-white hover:text-blue-300 transition-colors text-sm"
          >
            ← 返回首页
          </button>
          <span className="text-gray-400 text-sm">|</span>
          <span className="text-gray-300 text-sm truncate max-w-xs">
            {primaryUrl.replace(/^https?:\/\//, '')}
          </span>
        </div>
        {isSplit && (
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">分屏模式</span>
            <button
              onClick={closeSplit}
              className="text-xs px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
            >
              关闭分屏
            </button>
          </div>
        )}
      </div>

      {/* 分屏区域 - 使用 Flex 布局 */}
      <div className="flex-1 flex w-full overflow-hidden relative">
        {/* 主视图占位区域 */}
        <div
          ref={primaryContainerRef}
          className="h-full"
          style={{
            // 减去 7px 为分割线留出空间
            width: isSplit ? `calc(${splitRatio * 100}% - 7px)` : '100%',
            flexShrink: 0,
            backgroundColor: isPrimaryViewCreated ? 'transparent' : '#f3f4f6',
            // 关键：拖动时禁用 transition，避免闪烁
            transition: isDragging ? 'none' : 'width 0.3s ease-in-out'
          }}
        >
          {!isPrimaryViewCreated && (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <p>正在加载...</p>
            </div>
          )}
        </div>

        {/* 分割线（仅在分屏模式下显示）- 独立的 14px 空间 */}
        {isSplit && (
          <div
            className="h-full flex-shrink-0"
            style={{
              width: '14px',
              backgroundColor: 'transparent',
              position: 'relative'
            }}
          >
            <SplitDivider
              onRatioChange={handleRatioChange}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
          </div>
        )}

        {/* 次级视图占位区域 */}
        <div
          ref={secondaryContainerRef}
          className="h-full relative"
          style={{
            // 减去 7px 为分割线留出空间
            width: isSplit ? `calc(${(1 - splitRatio) * 100}% - 7px)` : '0%',
            flexShrink: 0,
            opacity: isSplit ? 1 : 0,
            overflow: 'hidden',
            // 🔥 关键修复：关闭分屏时立即隐藏背景，消除白屏闪烁
            backgroundColor: isSplit ? '#f3f4f6' : 'transparent',
            visibility: isSplit ? 'visible' : 'hidden',
            // 关键：拖动时禁用 transition，避免闪烁
            transition: isDragging ? 'none' : 'width 0.3s ease-in-out'
          }}
        >
          {isSplit && (
            <button
              onClick={closeSplit}
              className="absolute top-2 right-2 z-50 w-8 h-8 bg-gray-800 text-white rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors shadow-lg"
              title="关闭次级窗口"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default MainView
