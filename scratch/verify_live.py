import asyncio, sys
sys.stdout.reconfigure(encoding='utf-8')
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        console_errors = []
        page_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)
        page.on("pageerror", lambda err: page_errors.append(str(err)))

        print("Navigating to live https://xzkero.com/ ...")
        await page.goto("https://xzkero.com/", wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)

        title = await page.title()
        content = await page.content()
        print(f"Page Title: {title}")
        print(f"Has app root: {'id=\"app\"' in content}")
        print(f"Has media cards: {'media-card' in content}")

        print("\n--- LIVE PAGE ERRORS ---")
        if page_errors:
            for e in page_errors:
                print("PAGEERROR:", e)
        else:
            print("SUCCESS! No JS runtime errors on live site!")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
