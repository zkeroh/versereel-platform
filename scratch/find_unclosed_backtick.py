import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('js/bundle.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

in_backtick = False
start_line = None

for i in range(1838, 2187):
    line = lines[i]
    # Count unescaped backticks in line
    j = 0
    while j < len(line):
        ch = line[j]
        if ch == '`' and (j == 0 or line[j-1] != '\\'):
            if not in_backtick:
                in_backtick = True
                start_line = i + 1
            else:
                in_backtick = False
                start_line = None
        j += 1

print(f"At end of renderStandaloneComicPage (line 2186), in_backtick: {in_backtick}, started at line: {start_line}")
