import sys

file_path = "/Users/ittichai/ZCodeProject/admin-dashboard/src/components/POSSystem.jsx"

with open(file_path, "r") as f:
    content = f.read()

target = """        expectedCash: expectedCash,
        difference: diff,
        remitAmount: remitAmount,
        nextDayFloat: nextDayFloat,"""

replacement = """        expectedCash: expectedCash,
        difference: diff,
        remitAmount: remitAmount,
        totalDeposit: totalTheoreticalDeposit,
        nextDayFloat: nextDayFloat,"""

content = content.replace(target, replacement)

with open(file_path, "w") as f:
    f.write(content)
