import sys

file_path = "/Users/ittichai/ZCodeProject/admin-dashboard/src/components/SalesHistoryModal.jsx"

with open(file_path, "r") as f:
    content = f.read()

target = """                          </div>
                        </div>
                      </div>

                      <div className="hidden xl:flex"""

replacement = """                          </div>
                        </div>

                      <div className="hidden xl:flex"""

content = content.replace(target, replacement)

with open(file_path, "w") as f:
    f.write(content)
print("Fixed JSX")
