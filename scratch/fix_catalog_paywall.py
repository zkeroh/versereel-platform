import re

def fix_bundle():
    bundle_path = r'C:\Users\USER\.gemini\antigravity\scratch\versereel-media-platform\js\bundle.js'
    with open(bundle_path, 'r', encoding='utf-8') as f:
        content = f.read()

    print("Length before:", len(content))

    # 1. Update Storage Version to v105 to purge stale/dev test unlocked state
    content = content.replace("STORAGE_KEY = 'versereel_data_v99';", "STORAGE_KEY = 'versereel_data_v105';")
    content = content.replace("DB_NAME = 'VerseReelDB_v99';", "DB_NAME = 'VerseReelDB_v105';")

    # Add legacy purgers
    legacy_purger = """    localStorage.removeItem('versereel_data_v3');
    localStorage.removeItem('versereel_data_v99');
    if (window.indexedDB) {
      window.indexedDB.deleteDatabase('VerseReelDB');
      window.indexedDB.deleteDatabase('versereel_db');
      window.indexedDB.deleteDatabase('VerseReelDB_v99');
    }"""
    
    # 2. Fix COMICS_CATALOG: remove duplicate lemonade1 at the top of COMICS_CATALOG
    # Let's inspect COMICS_CATALOG match
    comics_catalog_start = content.find("const COMICS_CATALOG = [")
    if comics_catalog_start != -1:
        print("Found COMICS_CATALOG")

    # Replace duplicate lemonade1 at top if present
    dup_pattern = r'const COMICS_CATALOG = \[\s*\{\s*id:\s*"lemonade1",[\s\S]*?createdAt: new Date\(\)\.toISOString\(\)\s*\},'
    content = re.sub(dup_pattern, 'const COMICS_CATALOG = [', content, count=1)

    # 3. Update lemonade1 item object to have previewLimit: 2, thumbnail: PL00.jpg, pixUrl, landingUrl
    lemonade1_old_pattern = r'id:\s*"lemonade1",[\s\S]*?title:\s*"DON\'T TELL DAD \(PT\)",[\s\S]*?previewLimit:\s*\d+,'
    lemonade1_new_replacement = '''id: "lemonade1",
      title: "DON'T TELL DAD (PT)",
      language: "pt",
      type: "comic",
      genre: "Incest",
      author: "Zkero",
      description: "Um filho cruza a linha com a mãe. Baseado em Lemonade — Milftoon.",
      isPaid: true,
      price: 4.99,
      previewLimit: 2,
      paypalUrl: "https://www.paypal.com/ncp/payment/VRSJZ76KRJTH6",
      pixUrl: "https://t.me/zkeroh?text=Quero%20comprar%20o%20comic%20Dont%20Tell%20Dad",
      landingUrl: "lemonade-pt.html",
      downloadUrl: "assets/DTDPT.pdf",
      thumbnail: "assets/PL00.jpg",
      pages: Array.from({ length: 35 }, (_, i) => `assets/PL${String(i).padStart(2, '0')}.jpg`),
      views: 10350,
      tags: ["porn comic online", "hq porno", "quadrinhos adultos", "hentai portugues", "hq erotica", "lemonade", "zkero", "milftoon", "mãe", "incesto", "milf"],
      createdAt: new Date().toISOString()
    },'''
    
    # Replace lemonade1 block
    lemonade1_block_pattern = r'\{\s*id:\s*"lemonade1",[\s\S]*?createdAt: new Date\(\)\.toISOString\(\)\s*\}'
    content = re.sub(lemonade1_block_pattern, lemonade1_new_replacement.strip(','), content)

    # 4. Update lemonade (EN) item previewLimit to 2
    lemonade_en_pattern = r'(id:\s*"lemonade",[\s\S]*?previewLimit:\s*)\d+'
    content = re.sub(lemonade_en_pattern, r'\g<1>2', content)

    # 5. Add PIX button on paywall card for Portuguese items
    paypal_btn_snippet = '''${txtPaypalBtn}
                              </button>'''
    paypal_btn_with_pix = '''${txtPaypalBtn}
                              </button>
                              ${(isPt || item.pixUrl) ? `
                                <a href="${item.pixUrl || 'https://t.me/zkeroh?text=Quero%20comprar%20o%20comic%20Dont%20Tell%20Dad'}" target="_blank" class="btn-action-buy-pix" style="padding: 0.85rem 1rem; font-size: 1rem; width: 100%; background: linear-gradient(135deg, #00bdae, #00796b); color: #ffffff; border-radius: 10px; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-weight: 800; border: 1px solid rgba(50, 188, 173, 0.5); box-shadow: 0 4px 15px rgba(0, 189, 174, 0.3); margin-top: 0.5rem; box-sizing: border-box;">
                                  <i class="ph-telegram-logo-bold"></i> ⚡ COMPRAR COM PIX
                                </a>
                              ` : ''}'''
    
    if paypal_btn_snippet in content:
        content = content.replace(paypal_btn_snippet, paypal_btn_with_pix)
        print("PIX button added to paywall card!")
    else:
        print("Warning: paypal_btn_snippet not matched directly, checking alternative replacement.")

    with open(bundle_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print("Length after:", len(content))
    print("Fix applied successfully!")

if __name__ == '__main__':
    fix_bundle()
