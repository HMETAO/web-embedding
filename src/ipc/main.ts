/**
 * @file 主进程 IPC 注册中心
 * @description 集中注册所有 IPC 处理器，职责单一：只负责路由
 * 业务逻辑委托给 service 层
 */

import { ipcMain, IpcMainInvokeEvent, IpcMainEvent } from 'electron'
import { IPCChannels } from './channels'
import { IPCRequestMap, IPCResponseMap } from './types'
import { viewService } from '../main/services/viewService'

// IPC 处理器类型定义
type IPCHandler<T extends keyof IPCRequestMap, R extends keyof IPCResponseMap> = (
  event: IpcMainInvokeEvent,
  request: IPCRequestMap[T]
) => Promise<IPCResponseMap[R]> | IPCResponseMap[R]

type IPCEventHandler<T extends keyof IPCRequestMap> = (
  event: IpcMainEvent,
  request: IPCRequestMap[T]
) => void

/**
 * IPC 路由器
 * 集中管理所有 IPC 通道的注册
 */
class IPCRouter {
  // IPC 路由器实现

  /**
   * 注册同步处理器（invoke/handle）
   */
  register<T extends keyof IPCRequestMap, R extends keyof IPCResponseMap>(
    channel: T,
    handler: IPCHandler<T, R>
  ): void {
    ipcMain.handle(channel as string, async (event, request: IPCRequestMap[T]) => {
      try {
        console.log(`[IPC] ${channel}`, request)
        const result = await handler(event, request)
        return { success: true, data: result }
      } catch (error) {
        console.error(`[IPC Error] ${channel}:`, error)
        return { success: false, error: (error as Error).message }
      }
    })
  }

  /**
   * 注册事件处理器（on/send）
   */
  on<T extends keyof IPCRequestMap>(channel: T, handler: IPCEventHandler<T>): void {
    ipcMain.on(channel as string, (event, request) => {
      console.log(`[IPC Event] ${channel}`, request)
      handler(event, request)
    })
  }

  /**
   * 初始化所有 IPC 通道
   */
  init(): void {
    this.registerBrowserViewHandlers()
    this.registerWindowHandlers()
    this.registerSystemHandlers()

    console.log('[IPC] 所有通道已注册')
  }

  /**
   * BrowserView 相关 IPC
   */
  private registerBrowserViewHandlers(): void {
    // 创建主视图
    this.on(IPCChannels.BrowserView.CREATE_PRIMARY, (_, { url, bounds }) => {
      viewService.createPrimaryView(url, bounds)
    })

    // 更新边界
    this.on(IPCChannels.BrowserView.UPDATE_BOUNDS, (_, { type, bounds }) => {
      viewService.updateBounds(type, bounds)
    })

    // 销毁次级视图
    this.on(IPCChannels.BrowserView.DESTROY_SECONDARY, () => {
      viewService.destroySecondaryView()
    })

    // 销毁所有视图
    this.on(IPCChannels.BrowserView.DESTROY_ALL, () => {
      viewService.destroyAllViews()
    })

    // 获取状态（使用 invoke/handle 模式）
    this.register(IPCChannels.BrowserView.GET_STATUS, async () => {
      return viewService.getIsSplit()
    })

    // 获取详细状态（使用 invoke/handle 模式）
    this.register(IPCChannels.BrowserView.GET_DETAILED_STATUS, async () => {
      return viewService.getSplitStatus()
    })

    // 更新分屏比例
    this.on(IPCChannels.BrowserView.UPDATE_SPLIT_RATIO, (_, { ratio }) => {
      viewService.updateSplitRatio(ratio)
    })

    // 显示覆盖层
    this.on(IPCChannels.BrowserView.SHOW_OVERLAY, () => {
      viewService.showOverlay()
    })

    // 隐藏覆盖层
    this.on(IPCChannels.BrowserView.HIDE_OVERLAY, () => {
      viewService.hideOverlay()
    })
  }

  private registerWindowHandlers(): void {
    // 预留窗口相关 IPC
  }

  private registerSystemHandlers(): void {
    // 预留系统相关 IPC
  }
}

// 导出单例
export const ipcRouter = new IPCRouter()

// 便捷函数
export function initIPC(): void {
  ipcRouter.init()
}
