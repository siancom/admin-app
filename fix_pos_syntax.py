import re

filepath = "src/components/POSSystem.jsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Extract the bad block
bad_block = """          // --- Auto Create Booking & Assign Bed ---
          if (selectedBed) {
             const bookingRef = doc(getCol('bookings'));
             const nowObj = new Date();
             const nowIso = nowObj.toISOString();
             
             // Time components to match timezone correctly
             const localNowStr = new Date(nowObj.getTime() - (nowObj.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
             const dateStr = localNowStr.split('T')[0];
             const timeStr = localNowStr.split('T')[1];

             const usedServicesStr = usedServices.map(s => getFuzzyKey(s, ["ชื่อคอส", "col_4"])).join(', ');
             
             batch.set(bookingRef, {
                 courseId: item.id || '',
                 courseRef: String(getFuzzyKey(item.originalItem, ["เลขที่ใบคอส", "col_2"]) || ''),
                 courseName: usedServicesStr || item.name,
                 customerName: cName,
                 customerPhone: cPhone,
                 customerId: selectedCustomer ? selectedCustomer.id : '',
                 dateTime: localNowStr,
                 date: dateStr,
                 time: timeStr,
                 branch: String(globalBranch || "เฉวง"),
                 status: 'กำลังใช้บริการ',
                 serviceStartTime: nowIso,
                 createdAt: nowIso,
                 bedNumber: String(selectedBed),
                 isWalkIn: true
             });
          }"""

if bad_block in content:
    # Remove from inside the object
    content = content.replace(bad_block + "\n\n            \"customerSignature\":", "\"customerSignature\":")
    content = content.replace(bad_block + "\n            \"customerSignature\":", "\"customerSignature\":")
    
    # Place it AFTER the batch.set(historyRef, {...})
    content = content.replace(
        "\"courseUpdatedDirectly\": true\n          });",
        "\"courseUpdatedDirectly\": true\n          });\n\n" + bad_block
    )
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print("Syntax error fixed successfully!")
else:
    print("Bad block not found.")
