import { ElectronAPI } from '@electron-toolkit/preload'

/**
 * IPC 回调函数类型
 */
type IPCCallback = (...args: unknown[]) => void

/**
 * IPC API 接口
 */
interface IPCAPI {
  send: (channel: string, ...args: unknown[]) => void
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
  on: (channel: string, callback: IPCCallback) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    ipc: IPCAPI
  }
}
