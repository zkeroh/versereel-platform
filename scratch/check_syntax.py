with open('js/bundle.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print("Total lines:", len(lines))
# Check matching braces
stack = []
for idx, line in enumerate(lines):
    for col, ch in enumerate(line):
        if ch in '{[(':
            stack.append((ch, idx + 1, col + 1))
        elif ch in '}])':
            if not stack:
                print(f"Unmatched closing '{ch}' at line {idx+1}, col {col+1}")
            else:
                opening, oline, ocol = stack.pop()
                expected = {'{': '}', '[': ']', '(': ')'}[opening]
                if ch != expected:
                    print(f"Mismatched bracket '{ch}' at line {idx+1}:{col+1}, expected '{expected}' for '{opening}' from line {oline}:{ocol}")

if stack:
    print("Unclosed brackets left:", stack[-10:])
else:
    print("All brackets match perfectly!")
