import os, re

def verify_paywall():
    bundle_path = r'C:\Users\USER\.gemini\antigravity\scratch\versereel-media-platform\js\bundle.js'
    with open(bundle_path, 'r', encoding='utf-8') as f:
        content = f.read()

    print("--- VERIFYING BUNDLE.JS PAYWALL LOCK ---")
    
    # 1. Check duplicate lemonade1
    count = content.count('id: "lemonade1"')
    print(f"Occurrences of 'id: \"lemonade1\"': {count}")
    if count != 1:
        print("FAILED: lemonade1 is still duplicated!")
        return False
    else:
        print("OK: lemonade1 appears exactly once.")

    # 2. Check previewLimit for lemonade1
    m = re.search(r'id:\s*"lemonade1",[\s\S]*?previewLimit:\s*(\d+)', content)
    if m:
        preview_limit = int(m.group(1))
        print(f"lemonade1 previewLimit: {preview_limit}")
        if preview_limit == 2:
            print("OK: previewLimit is set to 2.")
        else:
            print(f"FAILED: previewLimit is {preview_limit} instead of 2!")
            return False
    else:
        print("FAILED: Could not parse previewLimit for lemonade1!")
        return False

    # 3. Check thumbnail
    m_thumb = re.search(r'id:\s*"lemonade1",[\s\S]*?thumbnail:\s*"([^"]+)"', content)
    if m_thumb:
        thumb = m_thumb.group(1)
        print(f"lemonade1 thumbnail: {thumb}")
        if thumb == "assets/PL00.jpg":
            print("OK: thumbnail is set to Portuguese cover assets/PL00.jpg.")
        else:
            print(f"WARNING: thumbnail is {thumb}")

    # 4. Check PIX button in paywall card
    if "COMPRAR COM PIX" in content:
        print("OK: PIX button present in paywall card.")
    else:
        print("FAILED: PIX button missing in paywall card!")
        return False

    print("\nSUCCESS: All paywall lock checks passed 100%!")
    return True

if __name__ == '__main__':
    verify_paywall()
