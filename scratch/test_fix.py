import asyncio, sys
sys.stdout.reconfigure(encoding='utf-8')
from playwright.async_api import async_playwright

async def main():
    with open('js/bundle.js', 'r', encoding='utf-8') as f:
        code = f.read()

    # Apply fix to missing template closing in renderStandaloneComicPage
    target = """                <button type="button" id="reader-zoom-in" style="background:transparent; border:none; color:#fff; cursor:pointer; padding:2px 5px;"><i class="ph-plus-bold"></i></button>
              </div>
            </div>
          </footer>
        </div>
      `;
    }"""

    old_snippet = """                <button type="button" id="reader-zoom-in" style="background:transparent; border:none; color:#fff; cursor:pointer; padding:2px 5px;"><i class="ph-plus-bold"></i></button>
              </div>
            </div>"""

    fixed_code = code.replace(old_snippet, target, 1)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        console_errors = []
        page_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type in ['error', 'warning'] else None)
        page.on("pageerror", lambda err: page_errors.append(str(err)))

        html = f"""<!DOCTYPE html>
<html>
<head></head>
<body>
<div id="app"></div>
<script>{fixed_code}</script>
</body>
</html>"""

        await page.set_content(html)
        await page.wait_for_timeout(2000)

        print("--- PAGE ERRORS AFTER FIX ---")
        if page_errors:
            for e in page_errors:
                print("ERROR:", e)
        else:
            print("SUCCESS! ZERO PAGE ERRORS!")

        print("\n--- CONSOLE ERRORS ---")
        for c in console_errors:
            print("CONSOLE:", c)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
