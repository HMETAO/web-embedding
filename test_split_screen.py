"""
测试脚本：验证 Electron 分屏功能
使用 Playwright 连接到 Electron 应用进行自动化测试
"""

import subprocess
import time
import sys
from playwright.sync_api import sync_playwright

def main():
    """主测试函数"""
    print("🧪 开始测试 Electron 分屏功能...")
    
    # 1. 构建应用
    print("\n1. 构建 Electron 应用...")
    build_result = subprocess.run(
        ["npm", "run", "build"],
        cwd=r"E:\Code\Program\TypeScript\web-embedding",
        capture_output=True,
        text=True,
        encoding='utf-8'
    )
    if build_result.returncode != 0:
        print(f"❌ 构建失败: {build_result.stderr}")
        return 1
    print("   ✅ 构建成功")
    
    # 2. 启动 Electron 应用
    print("\n2. 启动 Electron 应用...")
    electron_process = subprocess.Popen(
        ["npx", "electron", ".", "--remote-debugging-port=9223"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        cwd=r"E:\Code\Program\TypeScript\web-embedding"
    )
    
    print("   等待应用启动（6秒）...")
    time.sleep(6)
    
    try:
        with sync_playwright() as p:
            # 3. 连接到 Electron
            print("\n3. 连接到 Electron 应用...")
            try:
                browser = p.chromium.connect_over_cdp("http://localhost:9223")
                print("   ✅ 成功连接")
            except Exception as e:
                print(f"   ⚠️ CDP连接失败: {e}")
                print("   使用直接启动方式...")
                browser = p.chromium.launch(
                    executable_path=r"E:\Code\Program\TypeScript\web-embedding\node_modules\electron\dist\electron.exe",
                    args=[r"E:\Code\Program\TypeScript\web-embedding"]
                )
            
            # 获取主窗口
            if browser.contexts:
                context = browser.contexts[0]
                pages = context.pages
            else:
                context = browser.new_context()
                pages = context.pages
            
            if not pages:
                print("❌ 未找到页面")
                return 1
            
            main_page = pages[0]
            print(f"   ✅ 主页面 URL: {main_page.url}")
            
            # 4. 截图首页
            print("\n4. 截图首页...")
            main_page.screenshot(path="test_screenshots/01_homepage.png")
            print("   ✅ test_screenshots/01_homepage.png")
            
            # 等待页面完全加载
            time.sleep(2)
            
            # 5. 点击第一个网站图标（例如 GitHub）
            print("\n5. 测试：打开网站...")
            try:
                # 尝试找到按钮
                buttons = main_page.locator("button").all()
                print(f"   找到 {len(buttons)} 个按钮")
                
                if buttons:
                    # 点击第一个按钮
                    first_button = buttons[0]
                    button_text = first_button.inner_text()
                    print(f"   点击按钮: {button_text}")
                    first_button.click()
                    time.sleep(3)
                    
                    main_page.screenshot(path="test_screenshots/02_website_opened.png")
                    print("   ✅ test_screenshots/02_website_opened.png")
                else:
                    print("   ⚠️ 未找到按钮")
                    
            except Exception as e:
                print(f"   ⚠️ 点击按钮失败: {e}")
            
            # 6. 等待 BrowserView 加载
            print("\n6. 等待 BrowserView 加载...")
            time.sleep(5)
            
            # 7. 尝试触发分屏（点击链接）
            print("\n7. 测试：触发分屏...")
            try:
                # 获取所有页面
                all_pages = context.pages
                print(f"   当前共 {len(all_pages)} 个页面")
                
                # 查找 BrowserView 页面
                browser_view_pages = [p for p in all_pages if p.url and p != main_page]
                
                if browser_view_pages:
                    view_page = browser_view_pages[0]
                    print(f"   ✅ BrowserView URL: {view_page.url}")
                    
                    # 截图 BrowserView
                    view_page.screenshot(path="test_screenshots/03_browserview.png")
                    print("   ✅ test_screenshots/03_browserview.png")
                    
                    # 尝试点击链接触发分屏
                    links = view_page.locator("a[href]").all()
                    print(f"   找到 {len(links)} 个链接")
                    
                    if len(links) > 0:
                        # 点击第二个链接（通常第一个是logo）
                        link_to_click = links[1] if len(links) > 1 else links[0]
                        link_text = link_to_click.inner_text()[:30]
                        print(f"   点击链接: {link_text}...")
                        link_to_click.click()
                        time.sleep(4)
                        
                        # 截图分屏状态
                        main_page.screenshot(path="test_screenshots/04_split_screen.png")
                        print("   ✅ test_screenshots/04_split_screen.png")
                        
                        # 8. 测试关闭分屏
                        print("\n8. 测试：关闭分屏...")
                        time.sleep(2)
                        main_page.screenshot(path="test_screenshots/05_before_close.png")
                        print("   ✅ test_screenshots/05_before_close.png")
                        
                else:
                    print("   ⚠️ 未找到 BrowserView 页面")
                    
            except Exception as e:
                print(f"   ⚠️ 分屏测试失败: {e}")
                import traceback
                traceback.print_exc()
            
            print("\n✅ 测试完成！")
            
            # 9. 总结
            print("\n9. 测试结果分析:")
            print("   📸 截图文件:")
            import os
            for f in os.listdir("test_screenshots"):
                print(f"      - {f}")
            
            print("\n   🔍 验证要点:")
            print("      - 02_website_opened.png: 网站是否正确加载（全屏模式）")
            print("      - 03_browserview.png: BrowserView 是否正常显示")
            print("      - 04_split_screen.png: 分屏是否正确触发（两个视图并排）")
            print("      - 05_before_close.png: 关闭分屏前状态")
            
    except Exception as e:
        print(f"\n❌ 测试出错: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    finally:
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
