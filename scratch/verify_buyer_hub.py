import os

def test_hub():
    base_dir = r'C:\Users\USER\.gemini\antigravity\scratch\versereel-media-platform'
    hub_file = os.path.join(base_dir, 'obrigado-dont-tell-dad.html')

    print("--- STEP 1: Verifying obrigado-dont-tell-dad.html ---")
    if not os.path.isfile(hub_file):
        print("FAILED: obrigado-dont-tell-dad.html missing!")
        return False

    with open(hub_file, 'r', encoding='utf-8') as f:
        content = f.read()

    expected_links = [
        'ler-dont-tell-dad-pt.html',
        'assets/DTDPT.pdf',
        'dont-tell-dad-extras.html',
        'https://t.me/zkeroh'
    ]

    for link in expected_links:
        if link not in content:
            print(f"FAILED: Link {link} not found in hub page!")
            return False
        else:
            print(f"OK: Link {link} verified in hub page.")

    # Verify linked target files exist
    target_files = [
        os.path.join(base_dir, 'ler-dont-tell-dad-pt.html'),
        os.path.join(base_dir, 'assets', 'DTDPT.pdf'),
        os.path.join(base_dir, 'dont-tell-dad-extras.html')
    ]

    for target in target_files:
        if not os.path.isfile(target):
            print(f"FAILED: Target file {target} does not exist!")
            return False
        else:
            print(f"OK: Target file {os.path.basename(target)} exists ({os.path.getsize(target)} bytes).")

    print("\nSUCCESS: All buyer hub links and target files are 100% verified!")
    return True

if __name__ == '__main__':
    test_hub()
