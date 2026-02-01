/**
 * @file 首页组件
 * @description 应用首页，提供URL输入框和常用网站快捷入口
 * 用户可通过输入网址或点击快捷图标进入分屏浏览模式
 */

import { useState } from 'react'
import { presetWebsites } from '@renderer/stores/config'

/**
 * 首页组件属性接口
 */
export interface HomePageProps {
  onNavigate: (url: string) => void // 导航回调函数，触发主窗口加载URL
}

/**
 * 首页组件
 * 显示应用标题、URL输入框和预设网站快捷入口
 * 用户输入URL或点击快捷入口后，通过onNavigate回调进入主视图
 */
function HomePage({ onNavigate }: HomePageProps): React.JSX.Element {
  // URL输入框的当前值
  const [inputUrl, setInputUrl] = useState('')

  /**
   * 处理表单提交事件
   * 自动补全URL协议头（https://），然后触发导航
   */
  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (inputUrl.trim()) {
      let url = inputUrl.trim()
      // 自动补全协议头
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url
      }
      onNavigate(url)
    }
  }

  /**
   * 处理快捷入口点击
   * 直接导航到预设网站URL
   */
  const handleQuickAccess = (url: string): void => {
    onNavigate(url)
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 应用标题区域 */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Web Embedding</h1>
        <p className="text-gray-600">智能分屏浏览器</p>
      </div>

      {/* URL输入框区域 */}
      <form onSubmit={handleSubmit} className="w-full max-w-2xl px-4 mb-12">
        <div className="relative">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="输入网址或搜索关键词..."
            className="w-full px-6 py-4 text-lg rounded-full border-2 border-gray-200 focus:border-blue-400 focus:outline-none shadow-lg transition-all"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
          >
            进入
          </button>
        </div>
      </form>

      {/* 快捷入口区域 */}
      <div className="w-full max-w-4xl px-4">
        <h2 className="text-lg font-medium text-gray-700 mb-4 text-center">常用网站</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {presetWebsites.map((site) => (
            <button
              key={site.id}
              onClick={() => handleQuickAccess(site.url)}
              className="flex flex-col items-center p-4 rounded-xl bg-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 group"
            >
              {/* 网站图标容器 */}
              <div className="w-12 h-12 mb-2 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden group-hover:bg-blue-50 transition-colors">
                <img
                  src={site.icon}
                  alt={site.name}
                  className="w-8 h-8 object-contain"
                  // 图标加载失败时显示默认图标
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src =
                      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23999"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>'
                  }}
                />
              </div>
              <span className="text-sm text-gray-700 font-medium">{site.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 底部提示信息 */}
      <div className="mt-12 text-center text-gray-500 text-sm max-w-lg px-4">
        <p>点击主窗口中的任意链接，将在右侧自动开启分屏显示</p>
      </div>
    </div>
  )
}

export default HomePage
