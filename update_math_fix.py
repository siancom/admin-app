import sys
import re

file_path = "/Users/ittichai/ZCodeProject/admin-dashboard/src/components/POSSystem.jsx"

with open(file_path, "r") as f:
    content = f.read()

# Fix duplicate floatCashNum
target = """                  const floatCashNum = parseNumber(eodData.floatCash) || 0;
                  const baseFloat = Math.floor(floatCashNum / 100) * 100;"""

replacement = """                  const baseFloat = Math.floor(floatCashNum / 100) * 100;"""

content = content.replace(target, replacement)

with open(file_path, "w") as f:
    f.write(content)

print("Saved.")
