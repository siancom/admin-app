import sys

file_path = "/Users/ittichai/ZCodeProject/admin-dashboard/src/components/SalesHistoryModal.jsx"

with open(file_path, "r") as f:
    content = f.read()

target = "<Wallet size={12} /> เงินทอน"
replacement = "<Wallet size={12} /> เงินทอน ฿{Number(String(eodData?.floatCash || 0).replace(/,/g, '')).toLocaleString()}"

content = content.replace(target, replacement)

with open(file_path, "w") as f:
    f.write(content)
print("Updated button text")
