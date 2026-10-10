import re

for filepath in [
    '/Users/ittichai/ZCodeProject/liff-customer-app /src/App.jsx',
]:
    with open(filepath, 'r') as f:
        content = f.read()
    
    # In customer app
    pattern = r"\} else \{\s*eDate = parseThaiDate\(expireDateStr\);\s*\}"
    replacement = """} else {
                    eDate = parseThaiDate(expireDateStr);
                    if (eDate) {
                        const diffMs = eDate.getTime() - pDate.getTime();
                        const dDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                        if (dDays <= 31) durationText = `${dDays} วัน`;
                        else if (dDays <= 365) durationText = `${Math.round(dDays / 30)} เดือน`;
                        else durationText = `${Math.round(dDays / 365)} ปี`;
                    }
                }"""
    new_content = re.sub(pattern, replacement, content)
    with open(filepath, 'w') as f:
        f.write(new_content)

for filepath in [
    '/Users/ittichai/ZCodeProject/admin-dashboard/src/App.jsx',
]:
    with open(filepath, 'r') as f:
        content = f.read()
    
    # In admin app
    pattern = r"\} else \{\s*expireDateObj = parseThaiDate\(expireStr\);\s*\}"
    replacement = """} else {
              expireDateObj = parseThaiDate(expireStr);
              if (expireDateObj) {
                  const diffMs = expireDateObj.getTime() - pDate.getTime();
                  const dDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                  if (dDays <= 31) durationText = `${dDays} วัน`;
                  else if (dDays <= 365) durationText = `${Math.round(dDays / 30)} เดือน`;
                  else durationText = `${Math.round(dDays / 365)} ปี`;
              }
          }"""
    new_content = re.sub(pattern, replacement, content)
    with open(filepath, 'w') as f:
        f.write(new_content)
