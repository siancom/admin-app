with open('old_app.jsx') as f:
    content = f.read()
start_idx = content.find("  if (!globalBranch) {")
end_idx = content.find("  return (", start_idx)
replaced_string = content[start_idx:end_idx]

count = 0
for c in replaced_string:
    if c == '{': count += 1
    elif c == '}': count -= 1
print(f"Replaced string net brace count: {count}")
