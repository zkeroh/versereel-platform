import asyncio
from playwright.async_api import async_playwright

async def test():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Test lemonade-pt.html
        url = "file:///C:/Users/USER/.gemini/antigravity/scratch/versereel-media-platform/lemonade-pt.html"
        print("Testing landing page:", url)
        await page.goto(url)
        await page.wait_for_timeout(1000)

        content = await page.content()
        print("Comprar comic completo check:", "COMPRAR COMIC COMPLETO - $4.99 USD" in content)
        print("Comprar com pix check:", "COMPRAR COM PIX" in content)
        print("Telegram word absent from PIX button check:", "(TELEGRAM)" not in content)
        print("Sticky bottom bar PayPal check:", "COMIC COMPLETO ($4.99)" in content)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(test())
