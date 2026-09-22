import subprocess, sys, os

def check_syntax():
    bundle_path = r'C:\Users\USER\.gemini\antigravity\scratch\versereel-media-platform\js\bundle.js'
    
    with open(bundle_path, 'r', encoding='utf-8') as f:
        code = f.read()

    print("Checking bundle.js size:", len(code))

    # Test executing node via python subprocess
    try:
        res = subprocess.run(['node', '-c', bundle_path], capture_output=True, text=True)
        print("Node return code:", res.returncode)
        if res.stdout:
            print("STDOUT:", res.stdout)
        if res.stderr:
            print("STDERR:", res.stderr)
    except Exception as e:
        print("Subprocess error:", e)

if __name__ == '__main__':
    check_syntax()
