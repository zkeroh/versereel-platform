with open('js/bundle.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

stack = []
for idx, line in enumerate(lines):
    for col, ch in enumerate(line):
        if ch in '{[(':
            stack.append((ch, idx + 1, col + 1))
        elif ch in '}])':
            if not stack:
                print(f"Unmatched '{ch}' at {idx+1}:{col+1}")
            else:
                top = stack[-1]
                expected = {'{': '}', '[': ']', '(': ')'}[top[0]]
                if ch == expected:
                    stack.pop()
                else:
                    print(f"Mismatch: found '{ch}' at {idx+1}:{col+1}, expected '{expected}' for '{top[0]}' from {top[1]}:{top[2]}")

print("Remaining stack:", stack)
