with open('replace_login.py') as f:
    text = f.read()
start = text.find('new_login_block =')
end = text.rfind('\"\"\"')
block = text[start:end]

count = 0
for i, line in enumerate(block.split('\n')):
    for c in line:
        if c == '{': count += 1
        elif c == '}': count -= 1
    if count < 0:
        print(f"Unbalanced at line {i}: {line}")
        break
