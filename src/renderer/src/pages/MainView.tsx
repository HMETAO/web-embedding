/**
 * @file 主视图组件
 * @description 应用程序主控制器，使用 useSplitScreen Hook 管理分屏状态
 * 简洁的组件结构，通过自定义 Hook 封装所有复杂逻辑
 */

import { useSplitScreen } from '@renderer/hooks/useSplitScreenStore'
import HomePage from '@renderer/pages/Home'

/**
 * 主视图组件
 * 通过 useSplitScreen Hook 获取所有分屏状态和操作函数
 * UI 层与逻辑层分离，代码更清晰易读
 */
function MainView(): React.JSX.Element {
  const {
    isSplit,
    primaryUrl,
    isPrimaryViewCreated,
    primaryContainerRef,
    secondaryContainerRef,
    navigate,
    goHome,
    closeSplit
  } = useSplitScreen()

  // 未加载主 URL 时显示首页
  if (!primaryUrl) {
    return <HomePage onNavigate={navigate} />
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

      {/* 分屏区域 */}
      <div className="flex-1 flex w-full overflow-hidden">
        {/* 主视图占位区域 */}
        <div
          ref={primaryContainerRef}
          className="h-full transition-all duration-300 ease-in-out"
          style={{
            width: isSplit ? '50%' : '100%',
            flexShrink: 0,
            backgroundColor: isPrimaryViewCreated ? 'transparent' : '#f3f4f6'
          }}
        >
          {!isPrimaryViewCreated && (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <p>正在加载...</p>
            </div>
          )}
        </div>

        {/* 分割线 */}
        {isSplit && (
          <div className="h-full w-[2px] bg-gray-300 flex-shrink-0 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-gray-400 rounded-full" />
          </div>
        )}

        {/* 次级视图占位区域 */}
        <div
          ref={secondaryContainerRef}
          className="h-full transition-all duration-300 ease-in-out relative"
          style={{
            width: isSplit ? '50%' : '0%',
            flexShrink: 0,
            opacity: isSplit ? 1 : 0,
            overflow: 'hidden',
            backgroundColor: '#f3f4f6'
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
