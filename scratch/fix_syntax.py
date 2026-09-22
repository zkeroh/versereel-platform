def fix_syntax():
    bundle_path = r'C:\Users\USER\.gemini\antigravity\scratch\versereel-media-platform\js\bundle.js'
    with open(bundle_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix the missing opening curly brace before id: "lemonade1"
    content = content.replace('\n    id: "lemonade1",', '\n    {\n      id: "lemonade1",')

    with open(bundle_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print("Fixed missing opening curly brace in bundle.js!")

if __name__ == '__main__':
    fix_syntax()
