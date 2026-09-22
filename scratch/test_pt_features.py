import asyncio
from playwright.async_api import async_playwright

async def test():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        # Set localStorage for age verification and clear unlocked items
        await page.add_init_script("""
            localStorage.setItem('age_verified_18', 'true');
            localStorage.removeItem('versereel_data_v3');
            try { indexedDB.deleteDatabase('VerseReelDB'); } catch(e){}
        """)

        # 1. Test paywall modal for Portuguese comic (lemonade1)
        url = "file:///C:/Users/USER/.gemini/antigravity/scratch/versereel-media-platform/index.html?comic=lemonade1"
        print("Loading comic url:", url)
        await page.goto(url)
        await page.wait_for_timeout(1500)

        # Click accept button if age modal still appears
        if await page.is_visible('#btn-accept-age-18'):
            await page.click('#btn-accept-age-18')
            await page.wait_for_timeout(1000)

        # Scroll webtoon container to bottom
        await page.evaluate("""() => {
            const container = document.querySelector('#webtoon-container');
            if (container) container.scrollTop = container.scrollHeight;
            window.scrollTo(0, document.body.scrollHeight);
        }""")
        await page.wait_for_timeout(1500)

        content = await page.content()
        print("Paywall title check:", "Limite de Amostra Grátis" in content)
        print("Paywall desc check:", "Veja como esta história termina" in content)
        print("Paywall price check:", "POR APENAS $4.99!" in content)
        print("PayPal button check:", "Pagar com Cartão de Débito/Crédito / PayPal" in content)
        print("MercadoPago button absent check:", "Pagar con Tarjeta Débito/Crédito / Yape" not in content)

        # 2. Test approved return link for Portuguese comic
        url_approved = "file:///C:/Users/USER/.gemini/antigravity/scratch/versereel-media-platform/index.html?unlock=lemonade1&status=approved"
        print("\nLoading approved url:", url_approved)
        await page.goto(url_approved)
        await page.wait_for_timeout(1500)

        # Scroll webtoon container to bottom
        await page.evaluate("""() => {
            const container = document.querySelector('#webtoon-container');
            if (container) container.scrollTop = container.scrollHeight;
            window.scrollTo(0, document.body.scrollHeight);
        }""")
        await page.wait_for_timeout(1500)

        content_approved = await page.content()
        print("Thanks title check:", "Obrigado por comprar" in content_approved)
        print("Thanks desc check:", "Você aproveitou todas as 35 páginas" in content_approved)
        print("Download btn check:", "Baixar Quadrinho Completo (HD)" in content_approved)
        print("Toast check:", "Pagamento verificado com sucesso" in content_approved)

        # 3. Test catalog language filter
        url_home = "file:///C:/Users/USER/.gemini/antigravity/scratch/versereel-media-platform/index.html"
        print("\nLoading catalog url:", url_home)
        await page.goto(url_home)
        await page.wait_for_timeout(1000)
        
        # Select PT
        await page.select_option('#lang-filter', 'pt')
        await page.wait_for_timeout(500)
        
        content_home = await page.content()
        print("PT badge check on card:", "🇧🇷 PT" in content_home)
        print("PT comic title in filtered catalog:", "DON'T TELL DAD (PT)" in content_home)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(test())
