import asyncio
from playwright.async_api import async_playwright

async def main():
    with open('js/bundle.js', 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # Test full file wrapped in an IIFE or function
        # Let's test line by line or line range to see where SyntaxError occurs
        for i, line in enumerate(lines, 1):
            try:
                # evaluate just line as JS expression/statement
                await page.evaluate(f"new Function({repr(line)})")
            except Exception as e:
                err = str(e)
                if "Invalid or unexpected token" in err or "Unexpected token" in err:
                    # Ignore expected errors like 'Unexpected token }' or 'Unexpected token return'
                    if not any(x in err for x in ["return", "export", "import", "super", "yield", "await", "Unexpected token '}'", "Unexpected token ')'", "Unexpected end of input", "Unexpected token ';'"]):
                        print(f"Syntax error on line {i}: {err}")
                        print(f"Line content: {repr(line)}")

if __name__ == "__main__":
    asyncio.run(main())
