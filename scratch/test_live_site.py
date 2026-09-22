import asyncio
from playwright.async_api import async_playwright

async def main():
    url = "https://xzkero.com/"
    print(f"Testing Live Site: {url}")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        console_logs = []
        page_errors = []

        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
        page.on("pageerror", lambda err: page_errors.append(str(err)))

        try:
            response = await page.goto(url, wait_until="networkidle", timeout=15000)
            print("HTTP Status Code:", response.status if response else "No response")
        except Exception as e:
            print("Navigation Exception:", e)

        print("\n--- LIVE PAGE ERRORS ---")
        if page_errors:
            for err in page_errors:
                print("ERROR:", err)
        else:
            print("No page errors detected.")

        print("\n--- CONSOLE LOGS ---")
        for log in console_logs:
            print(log)

        app_html = await page.inner_html("#app")
        print(f"\n--- APP HTML LENGTH: {len(app_html)} ---")
        if len(app_html) < 200:
            print("APP HTML:", app_html)

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
