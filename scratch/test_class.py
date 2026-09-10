import asyncio, sys
sys.stdout.reconfigure(encoding='utf-8')
from playwright.async_api import async_playwright

async def main():
    with open('js/bundle.js', 'r', encoding='utf-8') as f:
        lines = f.readlines()

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Class App begins at line 1403.
        # Let's test class App with different cutoffs!
        cutoffs = [1838, 2186, 2395, 2475]
        for c in cutoffs:
            class_code = "".join(lines[1402:c]) + "\n}"
            try:
                await page.evaluate(f"new Function({repr(class_code)})")
                print(f"Class App up to line {c}: PASSED")
            except Exception as e:
                print(f"Class App up to line {c}: FAILED:", e)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
