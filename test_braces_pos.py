with open("src/components/POSSystem.jsx", "r") as f:
    text = f.read()

count = 0
for i, line in enumerate(text.split('\n')):
    for c in line:
        if c == '{': count += 1
        elif c == '}': count -= 1
    if count < 0:
        print(f"Line {i+1}: count={count} | {line}")
        break

print(f"Final brace count: {count}")

count2 = 0
for i, line in enumerate(text.split('\n')):
    for c in line:
        if c == '<': count2 += 1
        elif c == '>': count2 -= 1
print(f"Final tag bracket count: {count2}")
