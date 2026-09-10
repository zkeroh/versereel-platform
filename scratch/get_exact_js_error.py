import asyncio
from playwright.async_api import async_playwright

async def main():
    with open('js/bundle.js', 'r', encoding='utf-8') as f:
        code = f.read()

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Wrap in Function to get exact line in bundle.js
        try:
            await page.evaluate(f"""() => {{
                try {{
                    const fn = new Function({repr(code)});
                }} catch(e) {{
                    console.log("SYNTAX_ERROR_NAME:", e.name);
                    console.log("SYNTAX_ERROR_MSG:", e.message);
                    console.log("SYNTAX_ERROR_STACK:", e.stack);
                    throw e;
                }}
            }}""")
        except Exception as e:
            print("Evaluated with error:", e)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
