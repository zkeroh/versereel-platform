import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # Inject script before load to capture window.onerror with stack, line, col, source
        await page.add_init_script("""
            window.addEventListener('error', function(e) {
                console.log('INIT_ERROR_DETAILED:', e.message, 'at', e.filename, 'line', e.lineno, 'col', e.colno, 'stack:', e.error ? e.error.stack : '');
            });
        """)
        
        page.on("console", lambda msg: print(f"[{msg.type.upper()}] {msg.text}"))
        page.on("pageerror", lambda err: print(f"PAGEERROR: {err.name}: {err.message}\n{err.stack}"))
        
        url = "file:///C:/Users/USER/.gemini/antigravity/scratch/versereel-media-platform/index.html"
        await page.goto(url)
        await page.wait_for_timeout(2000)
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
