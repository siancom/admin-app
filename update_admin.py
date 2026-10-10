import re

with open('/Users/ittichai/ZCodeProject/admin-dashboard/src/App.jsx', 'r') as f:
    content = f.read()

# Replace duration logic in admin-dashboard
pattern = r"let expireDateObj = null;.*?calculatedDurationMonths = Math.max\(1, calculatedDurationMonths\);\s*\}"

replacement = """let expireDateObj = null;
      let calculatedDurationMonths = 12; // Default 1 year
      let durationText = "1 ปี";
      const pDate = parseThaiDate(purchaseDateStr) || new Date();
      
      if (expireStr) {
          const expStr = String(expireStr).trim().toLowerCase();
          if (expStr.includes('เดือน')) {
              const months = parseInt(expStr.replace(/[^0-9]/g, '')) || 1;
              expireDateObj = new Date(pDate);
              expireDateObj.setMonth(expireDateObj.getMonth() + months);
              durationText = `${months} เดือน`;
          } else if (expStr.includes('ปี')) {
              const years = parseInt(expStr.replace(/[^0-9]/g, '')) || 1;
              expireDateObj = new Date(pDate);
              expireDateObj.setFullYear(expireDateObj.getFullYear() + years);
              durationText = `${years} ปี`;
          } else if (expStr.includes('วัน') && !expStr.includes('/')) {
              const days = parseInt(expStr.replace(/[^0-9]/g, '')) || 1;
              expireDateObj = new Date(pDate);
              expireDateObj.setDate(expireDateObj.getDate() + days);
              durationText = `${days} วัน`;
          } else {
              expireDateObj = parseThaiDate(expireStr);
          }
      }

      if (!expireDateObj || (expireStr && expireDateObj.getTime() <= pDate.getTime())) {
          expireDateObj = new Date(pDate);
          if (currentTotal === 1) {
              expireDateObj.setDate(expireDateObj.getDate() + 7);
              durationText = "7 วัน";
          } else if (currentTotal === 2) {
              expireDateObj.setMonth(expireDateObj.getMonth() + 1);
              durationText = "1 เดือน";
          } else if (currentTotal >= 3 && currentTotal <= 5) {
              expireDateObj.setMonth(expireDateObj.getMonth() + 3);
              durationText = "3 เดือน";
          } else if (currentTotal >= 6 && currentTotal <= 9) {
              expireDateObj.setMonth(expireDateObj.getMonth() + 6);
              durationText = "6 เดือน";
          } else {
              expireDateObj.setFullYear(expireDateObj.getFullYear() + 1);
              durationText = "1 ปี";
          }
          const exY = expireDateObj.getFullYear() + 543;
          expireStr = `${String(expireDateObj.getDate()).padStart(2, '0')}/${String(expireDateObj.getMonth() + 1).padStart(2, '0')}/${exY}`;
      }
      
      if (expireDateObj) {
          calculatedDurationMonths = (expireDateObj.getFullYear() - pDate.getFullYear()) * 12 + (expireDateObj.getMonth() - pDate.getMonth());
          calculatedDurationMonths = Math.max(1, calculatedDurationMonths);
      }"""

new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('/Users/ittichai/ZCodeProject/admin-dashboard/src/App.jsx', 'w') as f:
    f.write(new_content)
