/**
 * @file 预加载脚本
 * @description 安全暴露 Electron API，提供通用的 IPC 通信接口
 */

import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

/**
 * IPC 回调函数类型
 */
type IPCCallback = (...args: unknown[]) => void

/**
 * 创建通用的 IPC API
 */
const ipcAPI = {
  /**
   * 发送事件（单向通信）
   */
  send: (channel: string, ...args: unknown[]): void => {
    ipcRenderer.send(channel, ...args)
  },

  /**
   * 调用并等待响应（双向通信）
   */
  invoke: async (channel: string, ...args: unknown[]): Promise<unknown> => {
    return ipcRenderer.invoke(channel, ...args)
  },

  /**
   * 监听事件
   * @returns 取消监听的函数
   */
  on: (channel: string, callback: IPCCallback): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, ...args: unknown[]): void => {
      callback(...args)
    }
    ipcRenderer.on(channel, handler)

    // 返回取消监听的函数
    return (): void => {
      ipcRenderer.removeListener(channel, handler)
    }
  }
}

// 根据上下文隔离状态选择暴露方式
if (process.contextIsolated) {
  try {
    // 暴露 Electron 核心 API
    contextBridge.exposeInMainWorld('electron', electronAPI)
    // 暴露 IPC API
    contextBridge.exposeInMainWorld('ipc', ipcAPI)
  } catch (error) {
    console.error('[Preload] 暴露 API 失败:', error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.ipc = ipcAPI
}
