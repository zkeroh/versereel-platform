import asyncio, sys
sys.stdout.reconfigure(encoding='utf-8')
from playwright.async_api import async_playwright

async def main():
    with open('js/bundle.js', 'r', encoding='utf-8') as f:
        lines = f.readlines()

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Let's test lines 1839 to 2186 (renderStandaloneComicPage)
        m1 = "".join(lines[1838:2186])
        try:
            await page.evaluate(f"new Function({repr('function m(item){ ' + m1 + ' }')})")
            print("renderStandaloneComicPage syntax: PASSED")
        except Exception as e:
            print("renderStandaloneComicPage syntax: FAILED:", e)

        # Let's test lines 2187 to 2395 (attachStandaloneComicEvents)
        m2 = "".join(lines[2186:2395])
        try:
            await page.evaluate(f"new Function({repr('function m(root, item){ ' + m2 + ' }')})")
            print("attachStandaloneComicEvents syntax: PASSED")
        except Exception as e:
            print("attachStandaloneComicEvents syntax: FAILED:", e)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
