import asyncio, sys
sys.stdout.reconfigure(encoding='utf-8')
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        url = "file:///C:/Users/USER/.gemini/antigravity/scratch/versereel-media-platform/lemonade.html"
        await page.goto(url)
        await page.wait_for_timeout(1000)

        # Check images count
        thumbs = await page.query_selector_all(".hero-img-thumb")
        print(f"Number of preview thumbnails found: {len(thumbs)}")

        # Check free buttons count
        free_btns = await page.query_selector_all(".btn-action-free")
        print(f"Number of free action buttons found: {len(free_btns)}")

        # Check buy buttons count
        buy_btns = await page.query_selector_all(".btn-action-buy-paypal")
        print(f"Number of buy action buttons found: {len(buy_btns)}")

        # Test lightbox click on first image
        if thumbs:
            await thumbs[0].click()
            await page.wait_for_timeout(300)
            modal = await page.query_selector("#image-lightbox-modal")
            is_visible = await modal.is_visible()
            print(f"Lightbox modal visible after click: {is_visible}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
