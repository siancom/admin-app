import re

filepath = "src/components/POSSystem.jsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

if "setSelectedBed('');" not in content:
    content = content.replace(
        "setShowPaymentModal(false);",
        "setShowPaymentModal(false);\n      setSelectedBed('');"
    )

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("POSSystem.jsx reset bed patched successfully!")
