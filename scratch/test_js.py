import sys

with open('js/bundle.js', 'r', encoding='utf-8') as f:
    code = f.read()

stack = []
pairs = {')': '(', ']': '[', '}': '{'}
i = 0
n = len(code)
line = 1
col = 1

in_s_comment = False
in_m_comment = False
in_str = False
str_char = ''
in_tpl = False

errors = []

while i < n:
    ch = code[i]
    nxt = code[i+1] if i + 1 < n else ''
    
    if ch == '\n':
        line += 1
        col = 1
        if in_s_comment:
            in_s_comment = False
        i += 1
        continue
    
    if in_s_comment:
        i += 1
        col += 1
        continue
        
    if in_m_comment:
        if ch == '*' and nxt == '/':
            in_m_comment = False
            i += 2
            col += 2
            continue
        i += 1
        col += 1
        continue
        
    if in_str:
        if ch == '\\':
            i += 2
            col += 2
            continue
        if ch == str_char:
            in_str = False
        i += 1
        col += 1
        continue
        
    # Check comments
    if ch == '/' and nxt == '/':
        in_s_comment = True
        i += 2
        col += 2
        continue
    if ch == '/' and nxt == '*':
        in_m_comment = True
        i += 2
        col += 2
        continue
        
    # Strings
    if ch in ('"', "'"):
        in_str = True
        str_char = ch
        i += 1
        col += 1
        continue
        
    # Template literals
    if ch == '`':
        in_tpl = not in_tpl
        i += 1
        col += 1
        continue
        
    if in_tpl:
        if ch == '\\':
            i += 2
            col += 2
            continue
        if ch == '$' and nxt == '{':
            stack.append(('${', line, col))
            i += 2
            col += 2
            continue
        i += 1
        col += 1
        continue
        
    if ch in '([{':
        stack.append((ch, line, col))
    elif ch in ')]}':
        if not stack:
            errors.append(f'Unmatched closing {ch} at L{line}:C{col}')
        else:
            top, l, c = stack.pop()
            if top == '${':
                if ch == '}':
                    pass
                else:
                    errors.append(f'Mismatched {ch} at L{line}:C{col}, expected closing for {top} from L{l}:C{c}')
            elif pairs[ch] != top:
                errors.append(f'Mismatched {ch} at L{line}:C{col}, expected closing for {top} from L{l}:C{c}')
                
    i += 1
    col += 1

print('Errors found:', len(errors))
for e in errors[:10]:
    print(' ', e)
print('Unclosed tokens:', len(stack))
for s in stack[-10:]:
    print(' ', s)
