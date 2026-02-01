/**
 * @file 主进程入口
 * @description Electron 主进程，创建主窗口并管理 BrowserView
 * 负责应用生命周期管理和 BrowserView 初始化
 */

import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initIPC } from '../ipc/main'
import { viewService } from './services/viewService'

/**
 * 启用远程调试端口
 * 使 MCP server 能够通过 Chrome DevTools Protocol 连接和自动化控制应用
 */
const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev')

if (isDev) {
  app.commandLine.appendSwitch('remote-debugging-port', '9222')
  console.log('[Electron] 远程调试端口已启用: 9222')
}

/**
 * 创建主窗口
 * 初始化 BrowserWindow 并设置基本配置
 */
function createWindow(): void {
  // 创建浏览器窗口
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false // 允许跨域（开发环境）
    }
  })

  // 设置主窗口引用到 ViewService
  viewService.setMainWindow(mainWindow)

  // 窗口准备好后显示
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // 窗口大小变化时重新计算 BrowserView 位置
  mainWindow.on('resize', () => {
    // ViewService 会通过 IPC 自动处理 resize 事件
    // 渲染进程会发送 update-view-bounds 消息
  })

  // 窗口关闭时销毁所有 BrowserView
  mainWindow.on('closed', () => {
    // BrowserView 会自动清理
  })

  // 拦截窗口内打开的外部链接
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // 开发环境加载远程 URL，生产环境加载本地 HTML 文件
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// 当 Electron 完成初始化并准备好创建窗口时调用此方法
app.whenReady().then(() => {
  // 设置 Windows 应用用户模型 ID
  electronApp.setAppUserModelId('com.electron')

  // 默认在开发环境按 F12 打开 DevTools，生产环境忽略 CommandOrControl + R
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 初始化 IPC 通信
  initIPC()

  // 创建主窗口
  createWindow()

  // macOS: 当点击 dock 图标且没有其他窗口打开时，通常重新创建一个窗口
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 当所有窗口都关闭时退出应用，macOS 除外
// macOS 通常保持应用和菜单栏处于活动状态，直到用户明确按 Cmd + Q 退出
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 在此文件中可以包含应用特定的主进程代码
// 也可以将它们放在单独的文件中并在这里引入
