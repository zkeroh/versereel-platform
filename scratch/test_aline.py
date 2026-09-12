import asyncio, sys
sys.stdout.reconfigure(encoding='utf-8')
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        for filename in ["a-line-we-crossed.html", "aline-we-crossed.htm"]:
            url = f"file:///C:/Users/USER/.gemini/antigravity/scratch/versereel-media-platform/{filename}"
            await page.goto(url)
            await page.wait_for_timeout(500)

            print(f"\n--- TESTING {filename} ---")
            
            # Check 1: Headline
            headline = await page.inner_text(".headline-hook")
            print(f"1. Headline: {headline.strip()}")

            # Check 2: Previews
            previews = await page.query_selector_all(".hero-img-thumb")
            print(f"2. Previews count: {len(previews)}")

            # Check 3: Value Block
            features = await page.inner_text(".offer-features-block")
            print("3. Value Block contains 'What you get':", "What you get:" in features)

            # Check 4: Buy Button link
            buy_btn = await page.query_selector(".btn-action-buy-paypal")
            paypal_href = await buy_btn.get_attribute("href")
            print(f"4. PayPal Link: {paypal_href}")

            # Check 5: Under Buy Note
            subtext = await page.inner_text(".buy-subtext-note")
            print(f"5. Under Buy Subtext: '{subtext.strip()}'")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
