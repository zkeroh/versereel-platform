import asyncio
from playwright.async_api import async_playwright

async def debug():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        await page.goto("file:///C:/Users/USER/.gemini/antigravity/scratch/versereel-media-platform/index.html?comic=lemonade1")
        await page.wait_for_timeout(2000)

        html = await page.content()
        with open("scratch/page_output.html", "w", encoding="utf-8") as f:
            f.write(html)
        print("HTML saved to scratch/page_output.html, length:", len(html))

        await browser.close()

if __name__ == "__main__":
    asyncio.run(debug())
