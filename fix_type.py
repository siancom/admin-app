import sys

file_path = "/Users/ittichai/ZCodeProject/admin-dashboard/src/components/POSSystem.jsx"

with open(file_path, "r") as f:
    content = f.read()

content = content.replace("type === 'คอร์สครั้งเดียว' || type === 'ครั้งเดียว'", "type === 'รายครั้ง' || type === 'ครั้งเดียว'")
content = content.replace("type !== 'คอร์สครั้งเดียว' && type !== 'ครั้งเดียว'", "type !== 'รายครั้ง' && type !== 'ครั้งเดียว'")

with open(file_path, "w") as f:
    f.write(content)
print("Updated type check")
