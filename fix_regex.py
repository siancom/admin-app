with open("src/App.jsx", "r") as f:
    text = f.read()

# Fix the broken regexes at lines 1114 and 1118
text = text.replace("new RegExp('^[\"']|[\"']$', 'g')", r"new RegExp('^[\"\']|[\"\']$', 'g')")

with open("src/App.jsx", "w") as f:
    f.write(text)
print("Fixed regex")
