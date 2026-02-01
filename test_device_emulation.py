#!/usr/bin/env python3
"""
测试脚本：验证 Electron 应用的响应式视口适配功能
使用 Playwright 连接到 Electron 应用进行测试
"""

import subprocess
import time
import sys
from playwright.sync_api import sync_playwright

def main():
    """主测试函数"""
    print("🧪 开始测试 Electron 应用...")
    
    # 1. 启动 Electron 应用
    print("\n1. 启动 Electron 应用...")
    electron_process = subprocess.Popen(
        ["npx", "electron", ".", "--remote-debugging-port=9223"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        cwd="E:\\Code\\Program\\TypeScript\\web-embedding"
    )
    
    # 等待应用启动
    time.sleep(5)
    
    try:
        with sync_playwright() as p:
            # 2. 连接到 Electron 应用
            print("\n2. 连接到 Electron 应用...")
            browser = p.chromium.connect_over_cdp("http://localhost:9223")
            
            # 获取所有 contexts（包括主窗口和 BrowserView）
            contexts = browser.contexts
            print(f"   找到 {len(contexts)} 个 context")
            
            # 获取主窗口页面
            if not contexts:
                print("❌ 错误：未找到任何页面")
                return 1
                
            context = contexts[0]
            pages = context.pages
            print(f"   找到 {len(pages)} 个页面")
            
            if not pages:
                print("❌ 错误：未找到主页面")
                return 1
            
            page = pages[0]
            
            # 3. 截图首页
            print("\n3. 截图首页状态...")
            page.screenshot(path="test_screenshots/01_homepage.png", full_page=True)
            print("   ✅ 已保存首页截图")
            
            # 4. 点击第一个网站（GitHub）
            print("\n4. 测试：点击 GitHub 图标...")
            github_button = page.locator("text=GitHub").first
            if github_button.is_visible():
                github_button.click()
                time.sleep(3)
                page.screenshot(path="test_screenshots/02_github_fullscreen.png", full_page=True)
                print("   ✅ 已保存 GitHub 全屏截图")
            else:
                print("   ⚠️ 未找到 GitHub 按钮")
            
            # 5. 查找并点击链接触发分屏
            print("\n5. 测试：触发分屏...")
            # 等待 BrowserView 加载
            time.sleep(5)
            
            # 截图查看分屏效果
            page.screenshot(path="test_screenshots/03_split_screen.png", full_page=True)
            print("   ✅ 已保存分屏截图")
            
            # 6. 检查控制台日志
            print("\n6. 检查控制台日志...")
            logs = []
            page.on("console", lambda msg: logs.append(f"{msg.type}: {msg.text}"))
            
            # 输出最近的日志
            for log in logs[-10:]:
                print(f"   {log}")
            
            print("\n✅ 测试完成！截图保存在 test_screenshots/ 目录")
            
            # 7. 分析结果
            print("\n7. 测试分析：")
            print("   - 全屏模式：检查 02_github_fullscreen.png 是否为桌面布局")
            print("   - 分屏模式：检查 03_split_screen.png 是否为平板/手机布局")
            
    except Exception as e:
        print(f"\n❌ 测试出错: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    finally:
        # 关闭 Electron 应用
        print("\n8. 关闭 Electron 应用...")
        electron_process.terminate()
        try:
            electron_process.wait(timeout=5)
        except:
            electron_process.kill()
    
    return 0

if __name__ == "__main__":
    # 创建截图目录
    import os
    os.makedirs("test_screenshots", exist_ok=True)
    
    sys.exit(main())
