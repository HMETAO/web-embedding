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
  private primaryUrl: string = ''
  private secondaryUrl: string = ''
  private primaryOverlay: BrowserView | null = null
  private secondaryOverlay: BrowserView | null = null

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

    // 保存 URL
    this.primaryUrl = url

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

    // 如果已存在，更新 URL 并确保状态同步
    if (this.secondaryView) {
      this.secondaryView.webContents.loadURL(url)
      this.updateSecondaryBounds(bounds)

      // 🔥 关键修复：确保 isSplit 状态正确
      if (!this.isSplit) {
        this.isSplit = true
      }

      // 🔥 关键修复：发送事件确保渲染进程同步
      this.mainWindow.webContents.send(IPCChannels.BrowserView.SECONDARY_CREATED, {
        url,
        timestamp: Date.now()
      })
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

    // 保存 URL
    this.secondaryUrl = url

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
   * 提取域名
   * @param url - URL 字符串
   * @returns 域名
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch {
      return url
    }
  }

  /**
   * 显示覆盖层
   * 创建带有网站图标的半透明覆盖层
   */
  showOverlay(): void {
    if (!this.mainWindow) {
      console.warn('[ViewService] 主窗口未设置，无法显示覆盖层')
      return
    }

    // 如果已有覆盖层，先隐藏
    if (this.primaryOverlay || this.secondaryOverlay) {
      this.hideOverlay()
    }

    // 获取当前视图边界
    const primaryBounds = this.primaryView?.getBounds()
    const secondaryBounds = this.secondaryView?.getBounds()

    // 创建主视图覆盖层
    if (primaryBounds) {
      const domain = this.extractDomain(this.primaryUrl)
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`

      this.primaryOverlay = new BrowserView({
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      })

      this.primaryOverlay.setBounds(primaryBounds)
      this.mainWindow.addBrowserView(this.primaryOverlay)

      const overlayHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              margin: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              background: rgba(255, 255, 255, 0.95);
            }
            img {
              width: 64px;
              height: 64px;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
          </style>
        </head>
        <body>
          <img src="${faviconUrl}" alt="icon" />
        </body>
        </html>
      `

      this.primaryOverlay.webContents.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(overlayHTML)}`
      )
    }

    // 创建次级视图覆盖层
    if (this.secondaryView && secondaryBounds && this.isSplit) {
      const domain = this.extractDomain(this.secondaryUrl)
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`

      this.secondaryOverlay = new BrowserView({
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      })

      this.secondaryOverlay.setBounds(secondaryBounds)
      this.mainWindow.addBrowserView(this.secondaryOverlay)

      const overlayHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              margin: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              background: rgba(255, 255, 255, 0.95);
            }
            img {
              width: 64px;
              height: 64px;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
          </style>
        </head>
        <body>
          <img src="${faviconUrl}" alt="icon" />
        </body>
        </html>
      `

      this.secondaryOverlay.webContents.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(overlayHTML)}`
      )
    }

    console.log('[ViewService] 覆盖层已显示')
  }

  /**
   * 隐藏覆盖层
   * 销毁覆盖层 BrowserView
   */
  hideOverlay(): void {
    if (!this.mainWindow) {
      return
    }

    if (this.primaryOverlay) {
      this.mainWindow.removeBrowserView(this.primaryOverlay)
      this.primaryOverlay.webContents.close()
      this.primaryOverlay = null
    }

    if (this.secondaryOverlay) {
      this.mainWindow.removeBrowserView(this.secondaryOverlay)
      this.secondaryOverlay.webContents.close()
      this.secondaryOverlay = null
    }

    console.log('[ViewService] 覆盖层已隐藏')
  }

  /**
   * 更新分屏比例
   * @param ratio - 分屏比例（0-1）
   * @param containerBounds - 容器边界
   */
  updateSplitRatio(ratio: number): void {
    if (!this.mainWindow || !this.isSplit) {
      return
    }

    // 获取窗口内容区域尺寸
    const contentBounds = this.mainWindow.getContentBounds()
    const totalWidth = contentBounds.width
    const availableWidth = totalWidth - 14 // 减去 SplitDivider 宽度
    const height = contentBounds.height - 40 // 减去导航栏高度

    // 计算新的边界
    const primaryWidth = Math.round(availableWidth * ratio)
    const secondaryWidth = availableWidth - primaryWidth

    // 更新主视图
    if (this.primaryView) {
      const primaryBounds = {
        x: 0,
        y: 40, // 导航栏下方
        width: primaryWidth,
        height: height
      }
      this.primaryView.setBounds(primaryBounds)
    }

    // 更新次级视图
    if (this.secondaryView) {
      const secondaryBounds = {
        x: primaryWidth + 14, // SplitDivider 右侧
        y: 40, // 导航栏下方
        width: secondaryWidth,
        height: height
      }
      this.secondaryView.setBounds(secondaryBounds)
    }

    // 更新遮罩层边界（如果存在）
    if (this.primaryOverlay) {
      this.primaryOverlay.setBounds({
        x: 0,
        y: 40,
        width: primaryWidth,
        height: height
      })
    }

    if (this.secondaryOverlay) {
      this.secondaryOverlay.setBounds({
        x: primaryWidth + 14,
        y: 40,
        width: secondaryWidth,
        height: height
      })
    }

    console.log('[ViewService] 分屏比例已更新:', ratio)
  }

  /**
   * 处理导航事件
   * 主窗口的所有导航都在次级窗口打开
   * 🔥 关键：边界计算必须考虑 DOM 中分割线的 14px 宽度
   */
  private handleNavigation(url: string): void {
    if (!this.mainWindow || !this.primaryView) {
      console.warn('[ViewService] 无法处理导航：主窗口或主视图不存在')
      return
    }

    // 获取主视图的当前位置
    const primaryBounds = this.primaryView.getBounds()
    const windowBounds = this.mainWindow.getBounds()
    const dividerWidth = 14 // DOM 中分割线的宽度

    // 🔥 关键修复：边界计算必须考虑分割线宽度
    // 次视图的 x 坐标 = 主视图右边界 + 分割线宽度
    // 次视图的宽度 = 窗口宽度 - 主视图宽度 - 分割线宽度
    this.createSecondaryView(url, {
      x: primaryBounds.x + primaryBounds.width + dividerWidth,
      y: primaryBounds.y,
      width: Math.max(0, windowBounds.width - primaryBounds.width - dividerWidth),
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
   * 注入自定义滚动条样式 - 全局隐藏滚动条
   */
  private injectScrollbarStyle(view: BrowserView): void {
    const hideScrollbarCSS = `
      /* 隐藏 Webkit 浏览器滚动条 */
      ::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }
      
      /* 隐藏 Firefox 滚动条 */
      * {
        scrollbar-width: none !important;
      }
      
      /* 确保所有元素都没有滚动条 */
      html, body, div, textarea, iframe, [class*="scroll"], [id*="scroll"] {
        scrollbar-width: none !important;
      }
    `

    view.webContents.insertCSS(hideScrollbarCSS).catch((err) => {
      console.warn('[ViewService] 注入滚动条样式失败:', err)
    })
  }
  /**
   * 获取当前分屏状态（详细）
   * 用于渲染进程查询和状态同步
   */
  getSplitStatus(): {
    isSplit: boolean
    hasSecondaryView: boolean
    primaryUrl: string
    secondaryUrl: string
  } {
    return {
      isSplit: this.isSplit,
      hasSecondaryView: this.secondaryView !== null,
      primaryUrl: this.primaryUrl,
      secondaryUrl: this.secondaryUrl
    }
  }
}

// 导出单例实例
export const viewService = new ViewService()
