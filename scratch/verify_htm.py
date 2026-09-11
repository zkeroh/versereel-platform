import asyncio, sys
sys.stdout.reconfigure(encoding='utf-8')
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        for url in ["file:///C:/Users/USER/.gemini/antigravity/scratch/versereel-media-platform/lemonade.html",
                    "file:///C:/Users/USER/.gemini/antigravity/scratch/versereel-media-platform/lemonade.htm"]:
            await page.goto(url)
            title = await page.title()
            print(f"URL: {url} -> Title: {title}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
