/**
 * @file IPC 类型定义
 * @description 所有 IPC 通信的类型定义集中管理
 */

import { IPCChannels } from './channels'

// 基础类型
export interface ViewBounds {
  x: number
  y: number
  width: number
  height: number
}

// 设备预设类型
export interface DevicePreset {
  name: string
  width: number
  height: number
  deviceScaleFactor: number
  userAgent: string
  screenPosition: 'mobile' | 'desktop'
}

// 设备模式枚举
export enum DeviceMode {
  DESKTOP = 'desktop',
  TABLET = 'tablet',
  MOBILE = 'mobile'
}

// IPC 请求/响应类型定义
export interface IPCRequestMap {
  [IPCChannels.BrowserView.CREATE_PRIMARY]: {
    url: string
    bounds: ViewBounds
  }
  [IPCChannels.BrowserView.UPDATE_BOUNDS]: {
    type: 'primary' | 'secondary'
    bounds: ViewBounds
  }
  [IPCChannels.BrowserView.DESTROY_SECONDARY]: never // 无参数
  [IPCChannels.BrowserView.DESTROY_ALL]: never // 无参数
  [IPCChannels.BrowserView.GET_STATUS]: never // 无参数
  [IPCChannels.BrowserView.GET_DETAILED_STATUS]: never // 无参数
  [IPCChannels.BrowserView.UPDATE_SPLIT_RATIO]: {
    ratio: number // 分割比例 0.1-0.9
  }
  [IPCChannels.BrowserView.SHOW_OVERLAY]: never // 无参数
  [IPCChannels.BrowserView.HIDE_OVERLAY]: never // 无参数
  [IPCChannels.BrowserView.TOGGLE_SCROLLBAR]: {
    viewType: 'primary' | 'secondary'
    visible: boolean // true=显示, false=隐藏
  }
  [IPCChannels.System.GET_VERSION]: never // 无参数
}

export interface IPCResponseMap {
  [IPCChannels.BrowserView.GET_STATUS]: boolean
  [IPCChannels.BrowserView.GET_DETAILED_STATUS]: {
    isSplit: boolean
    hasSecondaryView: boolean
    primaryUrl: string
    secondaryUrl: string
  }
  [IPCChannels.System.GET_VERSION]: string
}

// 事件类型定义（主进程 → 渲染进程）
export interface IPCEventMap {
  [IPCChannels.BrowserView.SECONDARY_CREATED]: {
    url: string
    timestamp: number
  }
  [IPCChannels.BrowserView.NAVIGATION_BLOCKED]: {
    fromUrl: string
    toUrl: string
  }
  [IPCChannels.Window.RESIZE]: {
    width: number
    height: number
  }
}

// 辅助类型
export type IPCChannelName = keyof IPCRequestMap | keyof IPCEventMap | string

export type IPCRequest<T extends keyof IPCRequestMap> = IPCRequestMap[T]
export type IPCResponse<T extends keyof IPCResponseMap> = IPCResponseMap[T]
export type IPCEvent<T extends keyof IPCEventMap> = IPCEventMap[T]
