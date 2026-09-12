import asyncio, sys
sys.stdout.reconfigure(encoding='utf-8')
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        url = "file:///C:/Users/USER/.gemini/antigravity/scratch/versereel-media-platform/index.html?unlock=no-interneten&status=approved"
        await page.goto(url)
        await page.wait_for_timeout(1500)

        # Check page counter or paywall presence
        content = await page.content()
        has_paywall = "Free Preview Limit" in content or "Límite de Muestra Gratuita" in content
        print(f"URL: {url}")
        print(f"Has paywall modal/warning: {has_paywall}")

        counter = await page.query_selector("#page-counter-num")
        if counter:
            ct = await page.inner_text("#page-counter-num")
            print(f"Page counter active: {ct}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
