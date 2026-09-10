import asyncio, sys
sys.stdout.reconfigure(encoding='utf-8')
from playwright.async_api import async_playwright

async def main():
    with open('js/bundle.js', 'r', encoding='utf-8') as f:
        lines = f.readlines()

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # We know up to line 2186 inside class App is fine when properly closed.
        # Let's test lines 1403 to L (where 2186 <= L <= 2395) with closing braces '} \n}'
        for l in range(2186, 2396):
            # Add closing braces for renderStandaloneComicPage and class App
            test_code = "".join(lines[1402:l]) + "\n}\n}"
            try:
                await page.evaluate(f"new Function({repr(test_code)})")
            except Exception as e:
                err = str(e)
                if "Invalid or unexpected token" in err:
                    print(f"FAILED AT LINE {l}: {err}")
                    print(f"LINE {l} CONTENT: {repr(lines[l-1])}")
                    break

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
