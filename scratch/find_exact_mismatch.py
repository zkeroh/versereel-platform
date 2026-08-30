with open('js/bundle.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

stack = []
for idx, line in enumerate(lines):
    line_no = idx + 1
    for col, ch in enumerate(line):
        col_no = col + 1
        if ch in '{[(':
            stack.append((ch, line_no, col_no, line.strip()))
        elif ch in '}])':
            if not stack:
                print(f"ERROR: Extra closing '{ch}' at {line_no}:{col_no}")
            else:
                top = stack[-1]
                expected = {'{': '}', '[': ']', '(': ')'}[top[0]]
                if ch == expected:
                    stack.pop()
                else:
                    print(f"ERROR: Found '{ch}' at {line_no}:{col_no}, expected '{expected}' for '{top[0]}' opened at {top[1]}:{top[2]} -> {top[3]}")
                    # print current stack top
                    stack.pop()

print("Remaining open elements:")
for item in stack:
    print(item)
