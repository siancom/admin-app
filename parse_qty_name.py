import re

for filepath in [
    '/Users/ittichai/ZCodeProject/liff-customer-app /src/App.jsx',
]:
    with open(filepath, 'r') as f:
        content = f.read()

    pattern = r"if \(!eDate \|\| \(expireDateStr && eDate\.getTime\(\) <= pDate\.getTime\(\)\)\) \{\s*eDate = new Date\(pDate\);\s*if \(currentTotal === 1\) \{"
    
    replacement = """if (!eDate || (expireDateStr && eDate.getTime() <= pDate.getTime())) {
                eDate = new Date(pDate);
                
                // Read quantity from name if applicable, and check for "รักษา"
                const cNameStr = String(getFuzzyKey(c, ["ชื่อคอส", "ชื่อคอร์ส"]) || '').toLowerCase();
                let effectiveQty = currentTotal;
                const qtyMatch = cNameStr.match(/\\((\\d+)\\s*(ครั้ง|cc|ml|g|กรัม)\\)/i) || cNameStr.match(/(\\d+)\\s*(ครั้ง|cc|ml|g|กรัม)/i);
                if (qtyMatch && parseInt(qtyMatch[1]) > 0) {
                    effectiveQty = parseInt(qtyMatch[1]);
                }

                if (cNameStr.includes('รักษา')) {
                    eDate.setFullYear(eDate.getFullYear() + 1);
                    durationText = "1 ปี";
                } else if (effectiveQty === 1) {"""
    
    # Also fix the rest of the if-else chain to use effectiveQty
    content = re.sub(pattern, replacement, content)
    content = content.replace("} else if (currentTotal === 2) {", "} else if (effectiveQty === 2) {")
    content = content.replace("} else if (currentTotal >= 3 && currentTotal <= 5) {", "} else if (effectiveQty >= 3 && effectiveQty <= 5) {")
    content = content.replace("} else if (currentTotal >= 6 && currentTotal <= 9) {", "} else if (effectiveQty >= 6 && effectiveQty <= 9) {")
    
    with open(filepath, 'w') as f:
        f.write(content)

for filepath in [
    '/Users/ittichai/ZCodeProject/admin-dashboard/src/App.jsx',
]:
    with open(filepath, 'r') as f:
        content = f.read()
    
    pattern = r"if \(!expireDateObj \|\| \(expireStr && expireDateObj\.getTime\(\) <= pDate\.getTime\(\)\)\) \{\s*expireDateObj = new Date\(pDate\);\s*if \(currentTotal === 1\) \{"
    
    replacement = """if (!expireDateObj || (expireStr && expireDateObj.getTime() <= pDate.getTime())) {
          expireDateObj = new Date(pDate);
          
          // Read quantity from name if applicable, and check for "รักษา"
          const cNameStr = String(courseName || '').toLowerCase();
          let effectiveQty = currentTotal;
          const qtyMatch = cNameStr.match(/\\((\\d+)\\s*(ครั้ง|cc|ml|g|กรัม)\\)/i) || cNameStr.match(/(\\d+)\\s*(ครั้ง|cc|ml|g|กรัม)/i);
          if (qtyMatch && parseInt(qtyMatch[1]) > 0) {
              effectiveQty = parseInt(qtyMatch[1]);
          }

          if (cNameStr.includes('รักษา')) {
              expireDateObj.setFullYear(expireDateObj.getFullYear() + 1);
              durationText = "1 ปี";
          } else if (effectiveQty === 1) {"""
          
    content = re.sub(pattern, replacement, content)
    content = content.replace("} else if (currentTotal === 2) {", "} else if (effectiveQty === 2) {")
    content = content.replace("} else if (currentTotal >= 3 && currentTotal <= 5) {", "} else if (effectiveQty >= 3 && effectiveQty <= 5) {")
    content = content.replace("} else if (currentTotal >= 6 && currentTotal <= 9) {", "} else if (effectiveQty >= 6 && effectiveQty <= 9) {")

    with open(filepath, 'w') as f:
        f.write(content)
