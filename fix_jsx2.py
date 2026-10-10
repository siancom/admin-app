import sys

file_path = "/Users/ittichai/ZCodeProject/admin-dashboard/src/components/SalesHistoryModal.jsx"

with open(file_path, "r") as f:
    content = f.read()

target = """                  {/* EOD Summary Calculations */}
                  {(() => {"""

replacement = """                  </div>
                  {/* EOD Summary Calculations */}
                  {(() => {"""

content = content.replace(target, replacement)

with open(file_path, "w") as f:
    f.write(content)
print("Fixed JSX again")
