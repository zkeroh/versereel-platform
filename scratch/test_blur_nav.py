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

        # Check blur filter on preview thumbnail
        thumb = await page.query_selector(".hero-img-thumb")
        computed_style = await thumb.evaluate("el => getComputedStyle(el).filter")
        print(f"Thumbnail computed filter style: {computed_style}")

        # Click thumbnail to open lightbox
        containers = await page.query_selector_all(".hero-img-container")
        print(f"Containers found: {len(containers)}")
        await containers[0].click()
        await page.wait_for_timeout(400)

        # Check lightbox image filter
        lightbox_img = await page.query_selector("#lightbox-img")
        lightbox_filter = await lightbox_img.evaluate("el => getComputedStyle(el).filter")
        lightbox_src = await lightbox_img.get_attribute("src")
        print(f"Lightbox image filter: {lightbox_filter}, src: {lightbox_src}")

        # Check counter text
        counter = await page.query_selector("#lightbox-counter")
        c_text = await counter.text_content()
        print(f"Initial Counter text: {c_text}")

        # Click Next button
        next_btn = await page.query_selector("#lightbox-next-btn")
        await next_btn.click()
        await page.wait_for_timeout(300)

        c_text2 = await counter.text_content()
        lightbox_src2 = await lightbox_img.get_attribute("src")
        print(f"After Next click -> Counter text: {c_text2}, src: {lightbox_src2}")

        # Click Prev button
        prev_btn = await page.query_selector("#lightbox-prev-btn")
        await prev_btn.click()
        await page.wait_for_timeout(300)

        c_text3 = await counter.text_content()
        print(f"After Prev click -> Counter text: {c_text3}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
