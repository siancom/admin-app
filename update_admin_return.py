import re

with open('/Users/ittichai/ZCodeProject/admin-dashboard/src/App.jsx', 'r') as f:
    content = f.read()

pattern = r"expireDateObj: expireDateObj,\s*computedPendingAmount: pendingAmount,\s*daysLeft: daysLeft,\s*isExpiringSoon: isExpiringSoon\s*\};\s*\}\);"
replacement = """expireDateObj: expireDateObj,
        computedPendingAmount: pendingAmount,
        daysLeft: daysLeft,
        isExpiringSoon: isExpiringSoon,
        durationText: durationText
      };
    });"""

new_content = re.sub(pattern, replacement, content)

with open('/Users/ittichai/ZCodeProject/admin-dashboard/src/App.jsx', 'w') as f:
    f.write(new_content)
