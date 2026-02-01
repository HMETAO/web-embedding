#!/usr/bin/env python3
"""
测试脚本：验证 Electron 应用的响应式视口适配功能
直接启动 Electron 应用并进行自动化测试
"""

import subprocess
import time
import sys
import os
from playwright.sync_api import sync_playwright

def main():
    """主测试函数"""
    print("🧪 开始测试 Electron 应用响应式视口适配...")
    
    # 1. 构建应用（确保最新代码）
    print("\n1. 构建 Electron 应用...")
    build_result = subprocess.run(
        ["npm", "run", "build"],
        cwd=r"E:\Code\Program\TypeScript\web-embedding",
        capture_output=True,
        text=True
    )
    if build_result.returncode != 0:
        print(f"❌ 构建失败: {build_result.stderr}")
        return 1
    print("   ✅ 构建成功")
    
    # 2. 启动 Electron 应用（启用远程调试）
    print("\n2. 启动 Electron 应用...")
    electron_process = subprocess.Popen(
        ["npx", "electron", ".", "--remote-debugging-port=9223"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        cwd=r"E:\Code\Program\TypeScript\web-embedding"
    )
    
    # 等待应用启动
    print("   等待应用启动（5秒）...")
    time.sleep(5)
    
    try:
        with sync_playwright() as p:
            # 3. 连接到 Electron 应用
            print("\n3. 连接到 Electron 应用...")
            try:
                browser = p.chromium.connect_over_cdp("http://localhost:9223")
                print("   ✅ 成功连接到 Electron 应用")
            except Exception as e:
                print(f"   ❌ 连接失败: {e}")
                print("   尝试直接启动 Electron...")
                # 备选方案：直接启动
                browser = p.chromium.launch(
                    executable_path=r"E:\Code\Program\TypeScript\web-embedding\node_modules\.bin\electron.cmd",
                    args=[r"E:\Code\Program\TypeScript\web-embedding", "--remote-debugging-port=9223"]
                )
            
            # 获取主窗口
            contexts = browser.contexts
            if not contexts:
                print("❌ 未找到任何页面 context")
                return 1
            
            context = contexts[0]
            pages = context.pages
            if not pages:
                print("❌ 未找到主页面")
                return 1
            
            main_page = pages[0]
            print(f"   ✅ 找到主页面: {main_page.url}")
            
            # 4. 截图首页
            print("\n4. 截图首页状态...")
            os.makedirs("test_screenshots", exist_ok=True)
            main_page.screenshot(path="test_screenshots/01_homepage.png")
            print("   ✅ 已保存首页截图: test_screenshots/01_homepage.png")
            
            # 5. 点击 GitHub 图标（如果可见）
            print("\n5. 测试：打开 GitHub...")
            try:
                # 尝试找到 GitHub 按钮
                github_button = main_page.locator("button:has-text('GitHub')").first
                if github_button.is_visible():
                    github_button.click()
                    print("   ✅ 点击了 GitHub 按钮")
                    time.sleep(3)
                    
                    # 截图全屏模式
                    main_page.screenshot(path="test_screenshots/02_github_fullscreen.png")
                    print("   ✅ 已保存全屏截图: test_screenshots/02_github_fullscreen.png")
                else:
                    print("   ⚠️ 未找到 GitHub 按钮，尝试其他选择器...")
                    # 尝试通用选择器
                    buttons = main_page.locator("button").all()
                    if buttons:
                        buttons[0].click()
                        print(f"   ✅ 点击了第一个按钮")
                        time.sleep(3)
                        main_page.screenshot(path="test_screenshots/02_first_button.png")
                
            except Exception as e:
                print(f"   ⚠️ 点击按钮失败: {e}")
            
            # 6. 等待 BrowserView 加载并截图
            print("\n6. 等待 BrowserView 加载...")
            time.sleep(5)
            
            # 7. 尝试触发分屏（点击链接）
            print("\n7. 测试：触发分屏...")
            try:
                # 尝试在 BrowserView 中找到链接并点击
                # 注意：BrowserView 是独立的页面，需要获取所有 pages
                all_pages = context.pages
                print(f"   当前共有 {len(all_pages)} 个页面")
                
                # 查找 BrowserView 页面（通常 URL 不为空且不是主页面）
                browser_view_pages = [p for p in all_pages if p.url and "localhost" not in p.url]
                if browser_view_pages:
                    view_page = browser_view_pages[0]
                    print(f"   ✅ 找到 BrowserView 页面: {view_page.url}")
                    
                    # 截图 BrowserView 状态
                    view_page.screenshot(path="test_screenshots/03_browserview_state.png")
                    print("   ✅ 已保存 BrowserView 截图")
                    
                    # 尝试点击链接触发分屏
                    links = view_page.locator("a").all()
                    if links:
                        print(f"   找到 {len(links)} 个链接，点击第一个...")
                        links[0].click()
                        time.sleep(3)
                        
                        # 截图分屏状态
                        main_page.screenshot(path="test_screenshots/04_split_screen.png")
                        print("   ✅ 已保存分屏截图")
                else:
                    print("   ⚠️ 未找到 BrowserView 页面")
                    
            except Exception as e:
                print(f"   ⚠️ 分屏测试失败: {e}")
                import traceback
                traceback.print_exc()
            
            # 8. 收集控制台日志
            print("\n8. 收集控制台日志...")
            logs = []
            main_page.on("console", lambda msg: logs.append(f"[{msg.type}] {msg.text}"))
            time.sleep(1)  # 等待收集日志
            
            if logs:
                print("   最近日志:")
                for log in logs[-10:]:
                    print(f"     {log}")
            else:
                print("   暂无日志")
            
            print("\n✅ 测试完成！截图保存在 test_screenshots/ 目录")
            
            # 9. 分析结果
            print("\n9. 测试结果分析:")
            print("   📸 截图文件:")
            for f in os.listdir("test_screenshots"):
                print(f"      - {f}")
            
            print("\n   🔍 验证要点:")
            print("      1. 02_github_fullscreen.png - 检查是否为桌面布局（宽屏）")
            print("      2. 04_split_screen.png - 检查是否为平板/手机布局（窄屏）")
            print("      3. 查看控制台日志中的 [ViewService] 设备模拟日志")
            
    except Exception as e:
        print(f"\n❌ 测试出错: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    finally:
        # 关闭 Electron 应用
        print("\n10. 关闭 Electron 应用...")
        electron_process.terminate()
        try:
            electron_process.wait(timeout=5)
        except:
            electron_process.kill()
        print("   ✅ 应用已关闭")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
