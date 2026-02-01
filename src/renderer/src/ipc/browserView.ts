/**
 * @file 渲染端 BrowserView IPC 封装
 * @description 提供类型安全的 IPC 调用接口，使用新的 IPC 架构
 */

import { IPCChannels } from '../../../ipc/channels'
import { ViewBounds } from '../../../ipc/types'

// 使用 window.ipc 进行通信
const ipc = window.ipc

/**
 * IPC 调用响应结构
 */
interface IPCResponse<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * BrowserView IPC API
 * 封装所有与 BrowserView 相关的 IPC 调用
 */
export const browserViewIPC = {
  /**
   * 创建主 BrowserView
   * @param url - 要加载的 URL
   * @param bounds - 位置和大小
   */
  createPrimaryView(url: string, bounds: ViewBounds): void {
    ipc.send(IPCChannels.BrowserView.CREATE_PRIMARY, { url, bounds })
  },

  /**
   * 更新 BrowserView 边界
   * @param type - 视图类型 'primary' | 'secondary'
   * @param bounds - 新的位置和大小
   */
  updateBounds(type: 'primary' | 'secondary', bounds: ViewBounds): void {
    ipc.send(IPCChannels.BrowserView.UPDATE_BOUNDS, { type, bounds })
  },

  /**
   * 销毁次级 BrowserView
   */
  destroySecondaryView(): void {
    ipc.send(IPCChannels.BrowserView.DESTROY_SECONDARY)
  },

  /**
   * 销毁所有 BrowserView
   */
  destroyAllViews(): void {
    ipc.send(IPCChannels.BrowserView.DESTROY_ALL)
  },

  /**
   * 获取分屏状态
   * @returns 是否处于分屏模式
   */
  async getSplitStatus(): Promise<boolean> {
    const result = (await ipc.invoke(IPCChannels.BrowserView.GET_STATUS)) as IPCResponse<boolean>
    return result.success ? (result.data ?? false) : false
  },

  /**
   * 监听次级视图创建事件
   * @param callback - 回调函数
   * @returns 取消监听的函数
   */
  onSecondaryCreated(callback: (url: string) => void): () => void {
    return ipc.on(IPCChannels.BrowserView.SECONDARY_CREATED, (data) => {
      const { url } = data as { url: string }
      callback(url)
    })
  },

  /**
   * 监听导航拦截事件
   * @param callback - 回调函数
   * @returns 取消监听的函数
   */
  onNavigationBlocked(callback: (data: { fromUrl: string; toUrl: string }) => void): () => void {
    return ipc.on(IPCChannels.BrowserView.NAVIGATION_BLOCKED, (data) => {
      callback(data as { fromUrl: string; toUrl: string })
    })
  },

  /**
   * 更新分屏比例
   * @param ratio - 分割比例 0.1-0.9
   */
  updateSplitRatio(ratio: number): void {
    ipc.send(IPCChannels.BrowserView.UPDATE_SPLIT_RATIO, { ratio })
  },

  /**
   * 显示遮罩层
   */
  showOverlay(): void {
    ipc.send(IPCChannels.BrowserView.SHOW_OVERLAY)
  },

  /**
   * 隐藏遮罩层
   */
  hideOverlay(): void {
    ipc.send(IPCChannels.BrowserView.HIDE_OVERLAY)
  }
}
