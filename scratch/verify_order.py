import asyncio, sys
sys.stdout.reconfigure(encoding='utf-8')
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        for filename in ["lemonade.html", "lemonade.htm"]:
            url = f"file:///C:/Users/USER/.gemini/antigravity/scratch/versereel-media-platform/{filename}"
            await page.goto(url)
            await page.wait_for_timeout(500)

            print(f"\n--- TESTING {filename} ---")
            
            # Check 1: Headline & Description
            headline = await page.inner_text(".headline-hook")
            desc = await page.inner_text(".engaging-desc")
            print(f"1. Headline: {headline[:40]}... | Desc: {desc[:40]}...")

            # Check 2: Previews
            previews = await page.query_selector_all(".hero-img-thumb")
            print(f"2. Previews count: {len(previews)}")

            # Check 3: Offer Features Block text
            features_text = await page.inner_text(".offer-features-block")
            print("3. Value Block contains:")
            print("   - 'What you get':", "What you get:" in features_text)
            print("   - 'How it works':", "How it works:" in features_text)
            print("   - 'Secure PayPal':", "Secure PayPal" in features_text)
            print("   - 'Launch price until Sep 13.':", "Launch price until Sep 13." in features_text)

            # Check 4: Buy Button
            buy_btn = await page.query_selector(".btn-action-buy-paypal")
            buy_text = await buy_btn.inner_text()
            print(f"4. BUY Button text: {buy_text.strip()}")

            # Check 5: Under Buy Subtext Note
            subtext = await page.inner_text(".buy-subtext-note")
            print(f"5. Under Buy Subtext: '{subtext.strip()}'")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
