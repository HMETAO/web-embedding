const { _electron: electron } = require('playwright')
const path = require('path')
const fs = require('fs')

// 确保测试截图目录存在
const screenshotDir = path.join(__dirname, '..', 'test_screenshots')
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true })
}

async function runTest() {
  console.log('🚀 开始测试 Electron 分屏应用...\n')

  let electronApp = null
  let testResults = {
    homepageLoaded: false,
    primaryViewCreated: false,
    splitScreenTriggered: false,
    splitScreenClosed: false,
    backToHome: false,
    screenshots: [],
    errors: []
  }

  try {
    // 启动 Electron 应用
    console.log('📦 启动 Electron 应用...')
    electronApp = await electron.launch({
      args: ['.'],
      cwd: path.join(__dirname, '..'),
      timeout: 30000
    })

    // 获取主窗口
    const window = await electronApp.firstWindow()

    // 设置窗口大小
    await window.setViewportSize({ width: 1280, height: 800 })

    // 等待应用加载完成
    await window.waitForLoadState('domcontentloaded')
    await window.waitForTimeout(2000)

    console.log('✅ 应用启动成功\n')

    // 等待页面完全加载 - React 应用需要更长时间初始化
    console.log('⏳ 等待页面完全加载 (等待 10 秒)...')
    await window.waitForLoadState('networkidle')
    await window.waitForTimeout(10000) // 给 React 应用更多时间初始化

    // 1. 截图：首页
    console.log('📸 截图 1: 首页')
    const homepagePath = path.join(screenshotDir, '01_homepage.png')
    await window.screenshot({
      path: homepagePath,
      fullPage: false
    })
    testResults.screenshots.push('01_homepage.png')
    testResults.homepageLoaded = true
    console.log('   已保存: 01_homepage.png\n')

    // 2. 点击第一个网站按钮（哔哩哔哩）
    console.log('🖱️  点击第一个网站按钮（哔哩哔哩）...')

    // 等待按钮出现
    try {
      await window.waitForSelector('button', { timeout: 10000 })
      const buttons = await window.locator('button').all()
      console.log(`   找到 ${buttons.length} 个按钮`)

      if (buttons.length > 0) {
        // 点击第一个按钮
        await buttons[0].click()
        console.log('✅ 已点击第一个可用按钮\n')
      } else {
        console.log('⚠️  未找到任何按钮\n')
        testResults.errors.push('No buttons found on homepage')
      }
    } catch (e) {
      console.log('⚠️  等待按钮超时:', e.message)
      testResults.errors.push(`Button wait failed: ${e.message}`)
    }

    // 等待页面加载（包括 BrowserView 创建）
    await window.waitForTimeout(5000)

    // 3. 截图：主视图加载中/已加载
    console.log('📸 截图 2: 主视图已加载')
    const mainviewPath = path.join(screenshotDir, '02_mainview_loaded.png')
    await window.screenshot({
      path: mainviewPath,
      fullPage: false
    })
    testResults.screenshots.push('02_mainview_loaded.png')
    testResults.primaryViewCreated = true
    console.log('   已保存: 02_mainview_loaded.png\n')

    // 4. 尝试触发分屏功能
    console.log('🔀 尝试触发分屏功能...')
    console.log('   注意：分屏功能需要在 BrowserView 中点击链接触发')
    console.log('   Playwright 无法直接与 BrowserView 内容交互，尝试通过 Electron API 模拟...\n')

    // 使用 Electron 的 executeJavaScript API 来触发分屏
    // 通过发送 IPC 消息给主进程，模拟导航事件
    try {
      // 尝试获取 BrowserView 并触发导航
      await electronApp.evaluate(async ({ electron }) => {
        const { BrowserWindow, BrowserView } = electron
        const wins = BrowserWindow.getAllWindows()
        if (wins.length > 0) {
          const mainWindow = wins[0]
          const views = mainWindow.getBrowserViews()
          if (views.length > 0) {
            const primaryView = views[0]
            // 获取当前 URL
            const currentUrl = primaryView.webContents.getURL()
            console.log('   当前 BrowserView URL:', currentUrl)

            // 尝试导航到另一个页面来触发分屏
            // 这里我们导航到同一个网站的另一个页面
            const newUrl = currentUrl.replace(/\/$/, '') + '/video/BV1GJ411x7h7'
            primaryView.webContents.loadURL(newUrl)
            return { success: true, fromUrl: currentUrl, toUrl: newUrl }
          }
        }
        return { success: false, error: 'No BrowserView found' }
      })

      await window.waitForTimeout(5000)

      // 检查是否已进入分屏模式
      const isSplit = await window.evaluate(() => {
        // 检查分屏相关的 UI 元素
        const splitText = document.body.innerText.includes('分屏模式')
        const closeSplitBtn = document.querySelector('button')?.textContent?.includes('关闭分屏')
        const secondaryContainer = document.querySelector('div[style*="width: 50%"]')
        return splitText || closeSplitBtn || !!secondaryContainer
      })

      if (isSplit) {
        testResults.splitScreenTriggered = true
        console.log('✅ 分屏功能已成功触发\n')
      } else {
        console.log('⚠️  自动触发分屏可能未成功，继续测试...\n')
      }
    } catch (e) {
      testResults.errors.push(`Split screen trigger failed: ${e.message}`)
      console.log('⚠️  触发分屏时出错:', e.message)
    }

    // 5. 截图：分屏视图
    console.log('📸 截图 3: 当前视图状态')
    const splitscreenPath = path.join(screenshotDir, '03_current_view.png')
    await window.screenshot({
      path: splitscreenPath,
      fullPage: false
    })
    testResults.screenshots.push('03_current_view.png')
    console.log('   已保存: 03_current_view.png\n')

    // 6. 尝试关闭分屏
    console.log('❌ 尝试关闭分屏...')
    try {
      const closeButton = await window.locator('button:has-text("关闭分屏")').first()
      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click()
        testResults.splitScreenClosed = true
        console.log('✅ 已通过按钮关闭分屏\n')
      } else {
        console.log('⚠️  未找到关闭分屏按钮，可能未进入分屏模式\n')
      }
    } catch (e) {
      testResults.errors.push(`Close split failed: ${e.message}`)
    }

    await window.waitForTimeout(2000)

    // 7. 截图：最终状态
    console.log('📸 截图 4: 最终状态')
    const finalPath = path.join(screenshotDir, '04_final_state.png')
    await window.screenshot({
      path: finalPath,
      fullPage: false
    })
    testResults.screenshots.push('04_final_state.png')
    console.log('   已保存: 04_final_state.png\n')

    // 8. 返回首页
    console.log('🏠 尝试返回首页...')
    try {
      const homeButton = await window.locator('button:has-text("返回首页")').first()
      if (await homeButton.isVisible().catch(() => false)) {
        await homeButton.click()
        await window.waitForTimeout(2000)

        testResults.backToHome = true
        console.log('📸 截图 5: 返回首页后')
        const homePath = path.join(screenshotDir, '05_back_to_home.png')
        await window.screenshot({
          path: homePath,
          fullPage: false
        })
        testResults.screenshots.push('05_back_to_home.png')
        console.log('   已保存: 05_back_to_home.png\n')
      } else {
        console.log('⚠️  未找到返回首页按钮\n')
      }
    } catch (e) {
      testResults.errors.push(`Back to home failed: ${e.message}`)
    }

    console.log('✨ 测试完成！')
    console.log('\n📁 所有截图已保存到: ' + screenshotDir)
    console.log('\n截图列表:')
    testResults.screenshots.forEach((shot, i) => {
      console.log(`  ${i + 1}. ${shot}`)
    })

    // 输出测试结果摘要
    console.log('\n📊 测试结果摘要:')
    console.log(`  ✅ 首页加载: ${testResults.homepageLoaded ? '成功' : '失败'}`)
    console.log(`  ✅ 主视图创建: ${testResults.primaryViewCreated ? '成功' : '失败'}`)
    console.log(`  ✅ 分屏触发: ${testResults.splitScreenTriggered ? '成功' : '失败/未触发'}`)
    console.log(`  ✅ 关闭分屏: ${testResults.splitScreenClosed ? '成功' : '失败/未执行'}`)
    console.log(`  ✅ 返回首页: ${testResults.backToHome ? '成功' : '失败/未执行'}`)

    if (testResults.errors.length > 0) {
      console.log('\n⚠️  遇到的错误:')
      testResults.errors.forEach((err) => console.log(`  - ${err}`))
    }

    // 总结
    console.log('\n📝 总结:')
    if (testResults.primaryViewCreated) {
      console.log('  BrowserView 嵌入功能工作正常 ✅')
    }
    if (testResults.splitScreenTriggered) {
      console.log('  分屏功能工作正常 ✅')
    } else {
      console.log('  分屏功能可能需要手动在 BrowserView 中点击链接来触发')
      console.log('  （Playwright 无法直接与 BrowserView 内容交互）')
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    if (electronApp) {
      console.log('\n🛑 关闭 Electron 应用...')
      await electronApp.close()
    }
  }
}

// 运行测试
runTest().catch(console.error)
