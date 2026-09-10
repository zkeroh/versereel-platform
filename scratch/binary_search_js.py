import asyncio
from playwright.async_api import async_playwright

async def main():
    with open('js/bundle.js', 'r', encoding='utf-8') as f:
        lines = f.readlines()

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        low = 1
        high = len(lines)
        found_line = None

        while low <= high:
            mid = (low + high) // 2
            chunk = "".join(lines[:mid])
            
            # Add closing brackets to make valid structure if possible
            test_js = chunk + "\n}" * 20 + "\n})();"
            
            try:
                await page.evaluate(f"new Function({repr(test_js)})")
                # If valid, the syntax error must be in lines AFTER mid
                low = mid + 1
            except Exception as e:
                err = str(e)
                if "Invalid or unexpected token" in err:
                    # The invalid token is at or before line mid!
                    found_line = mid
                    high = mid - 1
                else:
                    # Other syntax error (e.g. Unexpected token '}' due to our dummy closing brackets)
                    low = mid + 1

        print(f"EXACT LINE WITH INVALID TOKEN: {found_line}")
        if found_line:
            for l in range(max(1, found_line - 3), min(len(lines) + 1, found_line + 4)):
                marker = "====>" if l == found_line else "     "
                print(f"{marker} L{l}: {repr(lines[l-1])}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
