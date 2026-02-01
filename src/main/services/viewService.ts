/**
 * @file View 业务服务
 * @description 纯业务逻辑，不处理 IPC，只操作 BrowserView
 * 通过事件通知主进程层
 */

import { BrowserView, BrowserWindow } from 'electron'
import { ViewBounds } from '../../ipc/types'
import { IPCChannels } from '../../ipc/channels'

/**
 * View 业务服务类
 * 管理 BrowserView 的生命周期和业务逻辑
 */
export class ViewService {
  private mainWindow: BrowserWindow | null = null
  private primaryView: BrowserView | null = null
  private secondaryView: BrowserView | null = null
  private isSplit = false

  /**
   * 设置主窗口引用
   */
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window
  }

  /**
   * 创建主视图
   * @param url - 要加载的 URL
   * @param bounds - 位置和大小
   */
  createPrimaryView(url: string, bounds: ViewBounds): void {
    if (!this.mainWindow) {
      console.warn('[ViewService] 主窗口未设置')
      return
    }

    // 清理旧视图
    if (this.primaryView) {
      this.cleanupView(this.primaryView)
      this.primaryView = null
    }

    // 创建新的 BrowserView
    this.primaryView = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    })

    // 设置初始大小和位置
    this.primaryView.setBounds(bounds)

    // 添加到主窗口
    this.mainWindow.addBrowserView(this.primaryView)

    // 注入自定义滚动条样式
    this.injectScrollbarStyle(this.primaryView)

    // 加载 URL
    this.primaryView.webContents.loadURL(url)

    // 监听导航事件 - 拦截所有链接点击
    this.primaryView.webContents.on('will-navigate', (_event, url) => {
      this.handleNavigation(url)
    })

    // 页面加载完成后重新注入滚动条样式（防止被页面样式覆盖）
    this.primaryView.webContents.on('did-finish-load', () => {
      if (this.primaryView) {
        this.injectScrollbarStyle(this.primaryView)
      }
    })

    // 监听新窗口打开
    this.primaryView.webContents.setWindowOpenHandler(({ url }) => {
      this.handleNavigation(url)
      return { action: 'deny' }
    })

    console.log('[ViewService] 主视图已创建:', url)
  }

  /**
   * 创建次级视图（触发分屏）
   * @param url - 要加载的 URL
   * @param bounds - 位置和大小
   */
  createSecondaryView(url: string, bounds: ViewBounds): void {
    if (!this.mainWindow) {
      console.warn('[ViewService] 主窗口未设置')
      return
    }

    // 如果已存在，更新 URL
    if (this.secondaryView) {
      this.secondaryView.webContents.loadURL(url)
      this.updateSecondaryBounds(bounds)
      return
    }

    // 创建新的 BrowserView
    this.secondaryView = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    })

    this.secondaryView.setBounds(bounds)
    this.mainWindow.addBrowserView(this.secondaryView)

    // 注入自定义滚动条样式
    this.injectScrollbarStyle(this.secondaryView)

    // 页面加载完成后重新注入滚动条样式
    this.secondaryView.webContents.on('did-finish-load', () => {
      if (this.secondaryView) {
        this.injectScrollbarStyle(this.secondaryView)
      }
    })

    this.secondaryView.webContents.loadURL(url)

    this.isSplit = true

    // 通知渲染进程
    this.mainWindow.webContents.send(IPCChannels.BrowserView.SECONDARY_CREATED, {
      url,
      timestamp: Date.now()
    })

    console.log('[ViewService] 次级视图已创建:', url)
  }

  /**
   * 更新主视图边界
   */
  updatePrimaryBounds(bounds: ViewBounds): void {
    if (this.primaryView) {
      this.primaryView.setBounds(bounds)
    }
  }

  /**
   * 更新次级视图边界
   */
  updateSecondaryBounds(bounds: ViewBounds): void {
    if (this.secondaryView) {
      this.secondaryView.setBounds(bounds)
    }
  }

  /**
   * 更新视图边界（通用方法）
   */
  updateBounds(type: 'primary' | 'secondary', bounds: ViewBounds): void {
    if (type === 'primary') {
      this.updatePrimaryBounds(bounds)
    } else {
      this.updateSecondaryBounds(bounds)
    }
  }

  /**
   * 销毁次级视图
   */
  destroySecondaryView(): void {
    if (!this.mainWindow || !this.secondaryView) {
      console.warn('[ViewService] 次级视图不存在')
      return
    }

    this.mainWindow.removeBrowserView(this.secondaryView)
    this.secondaryView.webContents.close()
    this.secondaryView = null
    this.isSplit = false

    console.log('[ViewService] 次级视图已销毁')
  }

  /**
   * 销毁所有视图
   */
  destroyAllViews(): void {
    if (this.primaryView) {
      this.cleanupView(this.primaryView)
      this.primaryView = null
    }
    if (this.secondaryView) {
      this.cleanupView(this.secondaryView)
      this.secondaryView = null
    }
    this.isSplit = false
    console.log('[ViewService] 所有视图已销毁')
  }

  /**
   * 获取当前分屏状态
   */
  getIsSplit(): boolean {
    return this.isSplit
  }

  /**
   * 处理导航事件
   * 主窗口的所有导航都在次级窗口打开
   */
  private handleNavigation(url: string): void {
    if (!this.mainWindow || !this.primaryView) {
      console.warn('[ViewService] 无法处理导航：主窗口或主视图不存在')
      return
    }

    // 获取主视图的当前位置
    const primaryBounds = this.primaryView.getBounds()
    const windowBounds = this.mainWindow.getBounds()

    // 创建或更新次级视图（分屏显示）
    this.createSecondaryView(url, {
      x: primaryBounds.x + primaryBounds.width,
      y: primaryBounds.y,
      width: windowBounds.width - primaryBounds.width,
      height: primaryBounds.height
    })

    console.log('[ViewService] 导航已拦截，在次级窗口打开:', url)
  }

  /**
   * 清理视图
   */
  private cleanupView(view: BrowserView): void {
    if (this.mainWindow) {
      this.mainWindow.removeBrowserView(view)
    }
    view.webContents.close()
  }

  /**
   * 注入自定义滚动条样式
   */
  private injectScrollbarStyle(view: BrowserView): void {
    const scrollbarCSS = `
      ::-webkit-scrollbar {
        width: 6px !important;
        height: 6px !important;
      }

      ::-webkit-scrollbar-track {
        background: rgba(59, 130, 246, 0.1) !important;
        border-radius: 3px !important;
      }

      ::-webkit-scrollbar-thumb {
        background: rgba(59, 130, 246, 0.5) !important;
        border-radius: 3px !important;
        transition: background 0.3s ease !important;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: rgba(59, 130, 246, 0.8) !important;
      }

      * {
        scrollbar-width: thin !important;
        scrollbar-color: rgba(59, 130, 246, 0.5) rgba(59, 130, 246, 0.1) !important;
      }

      html, body, div, textarea, iframe, [class*="scroll"], [id*="scroll"] {
        scrollbar-width: thin !important;
      }
    `

    view.webContents.insertCSS(scrollbarCSS).catch((err) => {
      console.warn('[ViewService] 注入滚动条样式失败:', err)
    })
  }
}

// 导出单例实例
export const viewService = new ViewService()
