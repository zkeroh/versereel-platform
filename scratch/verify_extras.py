import os

def verify():
    base_dir = r'C:\Users\USER\.gemini\antigravity\scratch\versereel-media-platform'
    extras_dir = os.path.join(base_dir, 'assets', 'extras')
    page_path = os.path.join(base_dir, 'dont-tell-dad-extras.html')

    print("--- STEP 1: Verifying File Existence in assets/extras ---")
    expected_imgs = [f'extra_img_{i:02d}.' + ('jpg' if i <= 4 else 'png') for i in range(1, 15)]
    expected_vids = [f'extra_video_{i:02d}.mp4' for i in range(1, 9)]

    missing_files = []
    for img in expected_imgs:
        path = os.path.join(extras_dir, img)
        if not os.path.isfile(path):
            missing_files.append(img)
            print(f"FAILED: {img} missing!")
        else:
            print(f"OK: {img} ({os.path.getsize(path)} bytes)")

    for vid in expected_vids:
        path = os.path.join(extras_dir, vid)
        if not os.path.isfile(path):
            missing_files.append(vid)
            print(f"FAILED: {vid} missing!")
        else:
            print(f"OK: {vid} ({os.path.getsize(path)} bytes)")

    if missing_files:
        print(f"\nVerification FAILED! {len(missing_files)} files missing.")
        return False

    print("\n--- STEP 2: Verifying References in dont-tell-dad-extras.html ---")
    if not os.path.isfile(page_path):
        print("FAILED: dont-tell-dad-extras.html missing!")
        return False

    with open(page_path, 'r', encoding='utf-8') as f:
        content = f.read()

    missing_refs = []
    for file_name in expected_imgs + expected_vids:
        ref = f"assets/extras/{file_name}"
        if ref not in content:
            missing_refs.append(ref)
            print(f"FAILED: Reference {ref} not found in HTML!")
        else:
            print(f"OK: Found reference to {ref}")

    if missing_refs:
        print(f"\nVerification FAILED! {len(missing_refs)} references missing in HTML.")
        return False

    print("\nSUCCESS: All 14 images and 8 videos exist and are properly referenced in dont-tell-dad-extras.html!")
    return True

if __name__ == '__main__':
    verify()
