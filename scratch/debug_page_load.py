import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    base_dir = r'C:\Users\USER\.gemini\antigravity\scratch\versereel-media-platform'
    index_url = f"file:///{base_dir.replace('\\', '/')}/index.html"
    
    print(f"Loading URL: {index_url}")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        console_logs = []
        page_errors = []

        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
        page.on("pageerror", lambda err: page_errors.append(str(err)))

        try:
            await page.goto(index_url, wait_until="networkidle", timeout=10000)
        except Exception as e:
            print("Navigation exception:", e)

        print("\n--- PAGE ERRORS ---")
        if page_errors:
            for err in page_errors:
                print("ERROR:", err)
        else:
            print("No page errors detected.")

        print("\n--- CONSOLE LOGS ---")
        for log in console_logs:
            print(log)

        # Check DOM content
        app_html = await page.inner_html("#app")
        print(f"\n--- APP HTML LENGTH: {len(app_html)} ---")
        if len(app_html) < 100:
            print("APP HTML CONTENT:", app_html)
        else:
            print("APP HTML FIRST 200 CHARS:", app_html[:200])

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
