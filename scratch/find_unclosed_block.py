with open('js/bundle.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

stack = []
for idx, line in enumerate(lines):
    for col, ch in enumerate(line):
        if ch in '{':
            stack.append((idx + 1, line.strip()))
        elif ch in '}':
            if stack:
                stack.pop()

print("Unclosed '{' blocks remaining:")
for item in stack:
    print(item)
