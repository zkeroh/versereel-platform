with open('js/bundle.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Check matching brackets, braces, parens
brackets = {'(': ')', '[': ']', '{': '}'}
stack = []
in_str = None
escape = False

lines = code.split('\n')
for line_num, line in enumerate(lines, 1):
    for char in line:
        if in_str:
            if escape:
                escape = False
            elif char == '\\':
                escape = True
            elif char == in_str:
                in_str = None
        else:
            if char in ('"', "'", '`'):
                in_str = char
            elif char in brackets:
                stack.append((char, line_num))
            elif char in brackets.values():
                if not stack:
                    print(f"Unmatched closing bracket {char} on line {line_num}")
                else:
                    top, top_line = stack.pop()
                    if brackets[top] != char:
                        print(f"Mismatch: opened {top} at line {top_line}, closed with {char} at line {line_num}")

if stack:
    print(f"Unclosed brackets remaining: {len(stack)}")
    for top, line_num in stack[-5:]:
        print(f"  Opened {top} at line {line_num}")
else:
    print("ALL BRACKETS MATCH 100% PERFECTLY!")
