import asyncio, sys
sys.stdout.reconfigure(encoding='utf-8')
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        for filename in ["lemonade.html", "a-line-we-crossed.html"]:
            url = f"file:///C:/Users/USER/.gemini/antigravity/scratch/versereel-media-platform/{filename}"
            await page.goto(url)
            await page.wait_for_timeout(500)

            print(f"\n--- TESTING {filename} ---")
            thumb = await page.query_selector(".hero-img-thumb")
            computed_filter = await thumb.evaluate("el => getComputedStyle(el).filter")
            print(f"Computed filter style on thumbnail: '{computed_filter}'")

            badges = await page.query_selector_all(".hero-img-overlay-badge")
            print(f"Overlay badges count: {len(badges)}")

            # Click thumbnail to verify lightbox
            containers = await page.query_selector_all(".hero-img-container")
            await containers[0].click()
            await page.wait_for_timeout(300)

            modal = await page.query_selector("#image-lightbox-modal")
            is_visible = await modal.is_visible()
            print(f"Lightbox visible after click: {is_visible}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
