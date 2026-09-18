import asyncio, sys
sys.stdout.reconfigure(encoding='utf-8')
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        urls = [
            "file:///C:/Users/USER/.gemini/antigravity/scratch/versereel-media-platform/index.html",
            "file:///C:/Users/USER/.gemini/antigravity/scratch/versereel-media-platform/lemonade.html",
            "file:///C:/Users/USER/.gemini/antigravity/scratch/versereel-media-platform/a-line-we-crossed.html",
            "https://xzkero.com/",
            "https://xzkero.com/lemonade.html",
            "https://xzkero.com/a-line-we-crossed.html"
        ]

        for url in urls:
            console_errors = []
            page_errors = []

            page.on("console", lambda msg, errs=console_errors: errs.append(f"[{msg.type.upper()}] {msg.text}") if msg.type in ['error'] else None)
            page.on("pageerror", lambda err, perrs=page_errors: perrs.append(str(err)))

            print(f"\n==========================================")
            print(f"Testing URL: {url}")
            try:
                response = await page.goto(url, wait_until="domcontentloaded", timeout=12000)
                status_code = response.status if response else "N/A"
                print(f"Status Code: {status_code}")
                title = await page.title()
                print(f"Page Title: {title}")
                content = await page.content()
                print(f"Content Length: {len(content)} bytes")

                if "index.html" in url or url == "https://xzkero.com/":
                    has_cards = await page.query_selector_all(".media-card")
                    print(f"Media cards found on index: {len(has_cards)}")

                if page_errors:
                    print("--- PAGE ERRORS ---")
                    for pe in page_errors:
                        print("PAGEERROR:", pe)
                else:
                    print("No uncaught page errors.")

                if console_errors:
                    print("--- CONSOLE ERRORS ---")
                    for ce in console_errors[:5]:
                        print("CONSOLE:", ce)

            except Exception as e:
                print(f"Failed to load URL {url}: {e}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
