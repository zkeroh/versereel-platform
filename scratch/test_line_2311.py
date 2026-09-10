import asyncio, sys
sys.stdout.reconfigure(encoding='utf-8')
from playwright.async_api import async_playwright

async def main():
    with open('js/bundle.js', 'r', encoding='utf-8') as f:
        lines = f.readlines()

    line_2311 = lines[2310]
    print("Line 2311 text:", repr(line_2311))

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Test 1: line 2311 as is
        try:
            await page.evaluate(f"new Function({repr('let item={title:\"test\"}; ' + line_2311)})")
            print("Test 1 (original line 2311): PASSED")
        except Exception as e:
            print("Test 1 (original line 2311): FAILED:", e)

        # Test 2: without emoji
        no_emoji = line_2311.replace("🔥", "")
        try:
            await page.evaluate(f"new Function({repr('let item={title:\"test\"}; ' + no_emoji)})")
            print("Test 2 (no emoji): PASSED")
        except Exception as e:
            print("Test 2 (no emoji): FAILED:", e)

        # Test 3: lines 2307 to 2328
        chunk = "".join(lines[2306:2328])
        try:
            await page.evaluate(f"new Function({repr('let root={querySelectorAll:()=>[]}, item={id:\"1\", title:\"t\"}; ' + chunk)})")
            print("Test 3 (block 2307-2328): PASSED")
        except Exception as e:
            print("Test 3 (block 2307-2328): FAILED:", e)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
