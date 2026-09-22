import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        page.on("pageerror", lambda err: print("PAGE ERROR:", err))

        # We will load index.html and evaluate bundle.js in try/catch to get line & column
        await page.goto("file:///C:/Users/USER/.gemini/antigravity/scratch/versereel-media-platform/index.html")
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
