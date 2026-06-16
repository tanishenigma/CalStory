import sys

def check_braces(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    braces = []
    parens = []
    brackets = []
    
    lines = content.split('\n')
    for line_num, line in enumerate(lines, 1):
        for col_num, char in enumerate(line, 1):
            if char == '{':
                braces.append((line_num, col_num))
            elif char == '}':
                if not braces:
                    print(f"Stray '}}' at line {line_num}, col {col_num}")
                else:
                    braces.pop()
            elif char == '(':
                parens.append((line_num, col_num))
            elif char == ')':
                if not parens:
                    print(f"Stray ')' at line {line_num}, col {col_num}")
                else:
                    parens.pop()
            elif char == '[':
                brackets.append((line_num, col_num))
            elif char == ']':
                if not brackets:
                    print(f"Stray ']' at line {line_num}, col {col_num}")
                else:
                    brackets.pop()
                    
    print(f"Unclosed braces: {len(braces)}")
    for l, c in braces:
        print(f"  Opened at line {l}, col {c}: {lines[l-1][c-5:c+15]}")
        
    print(f"Unclosed parens: {len(parens)}")
    for l, c in parens:
        print(f"  Opened at line {l}, col {c}: {lines[l-1][c-5:c+15]}")

if __name__ == '__main__':
    check_braces('app/onboarding/page.tsx')
