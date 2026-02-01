/**
 * @file IPC 通道名称定义
 * @description 所有 IPC 通信通道的唯一数据源
 * 避免魔法字符串，确保主进程和渲染进程使用一致的通道名
 */

export const IPCChannels = {
  // BrowserView 相关
  BrowserView: {
    CREATE_PRIMARY: 'browser-view:create-primary',
    UPDATE_BOUNDS: 'browser-view:update-bounds',
    DESTROY_SECONDARY: 'browser-view:destroy-secondary',
    DESTROY_ALL: 'browser-view:destroy-all',
    GET_STATUS: 'browser-view:get-status',
    GET_DETAILED_STATUS: 'browser-view:get-detailed-status',

    // 分割比例调整
    UPDATE_SPLIT_RATIO: 'browser-view:update-split-ratio',

    // 遮罩层控制（拖动时显示遮罩）
    SHOW_OVERLAY: 'browser-view:show-overlay',
    HIDE_OVERLAY: 'browser-view:hide-overlay',

    // 滚动条控制（拖动时显示/隐藏）
    TOGGLE_SCROLLBAR: 'browser-view:toggle-scrollbar',

    // 事件通知（主进程 → 渲染进程）
    SECONDARY_CREATED: 'browser-view:secondary-created',
    NAVIGATION_BLOCKED: 'browser-view:navigation-blocked'
  },

  // 窗口相关
  Window: {
    RESIZE: 'window:resize',
    FOCUS: 'window:focus'
  },

  // 系统相关
  System: {
    GET_VERSION: 'system:get-version',
    OPEN_EXTERNAL: 'system:open-external'
  }
} as const

// 类型导出，确保类型安全
export type IPCChannelType = typeof IPCChannels
