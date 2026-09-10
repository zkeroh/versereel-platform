import asyncio, sys
sys.stdout.reconfigure(encoding='utf-8')
from playwright.async_api import async_playwright

async def main():
    with open('js/bundle.js', 'r', encoding='utf-8') as f:
        code = f.read()

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        console_errors = []
        page_errors = []
        page.on("console", lambda msg: console_errors.append(f"[{msg.type.upper()}] {msg.text}") if msg.type in ['error'] else None)
        page.on("pageerror", lambda err: page_errors.append(str(err)))

        html = f"""<!DOCTYPE html>
<html>
<head></head>
<body>
<div id="app"></div>
<script>{code}</script>
</body>
</html>"""

        await page.set_content(html)
        await page.wait_for_timeout(2000)

        print("--- PAGE ERRORS FOR ACTUAL BUNDLE.JS ---")
        if page_errors:
            for e in page_errors:
                print("ERROR:", e)
        else:
            print("SUCCESS! ZERO PAGE ERRORS!")

        print("\n--- CONSOLE ERRORS ---")
        for c in console_errors:
            print(c)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
