import re

filepath = "src/components/POSSystem.jsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add selectedBed state
if "const [selectedBed, setSelectedBed] = useState('');" not in content:
    content = content.replace(
        "const [activeWcOrderId, setActiveWcOrderId] = useState(null);",
        "const [activeWcOrderId, setActiveWcOrderId] = useState(null);\n  const [selectedBed, setSelectedBed] = useState('');"
    )

# 2. Add Bed selector in the payment modal
bed_selector = """
          {cart.some(i => i.type === 'usage') && (
            <div className="mb-4">
              <div className="text-sm font-semibold text-slate-700 mb-2">เข้าใช้เตียง (สำหรับ Walk-in)</div>
              <select
                value={selectedBed}
                onChange={(e) => setSelectedBed(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 outline-none"
              >
                <option value="">ไม่ระบุเตียง (แค่ตัดคอร์สอย่างเดียว)</option>
                {Array.from({ length: 4 }).map((_, i) => {
                   const bedNum = String(i + 1);
                   const isOccupied = bookings && bookings.some(b => String(b.bedNumber) === bedNum && b.status === 'กำลังใช้บริการ' && b.branch === (globalBranch || 'เฉวง'));
                   return (
                     <option key={bedNum} value={bedNum} disabled={isOccupied}>
                       เตียง {bedNum} {isOccupied ? '(ไม่ว่าง)' : '(ว่าง)'}
                     </option>
                   );
                })}
              </select>
            </div>
          )}
"""
if "เข้าใช้เตียง (สำหรับ Walk-in)" not in content:
    content = content.replace(
        "{(!cart.some(i => i.type === 'usage') || checkoutStep === 2) && (",
        "{(!cart.some(i => i.type === 'usage') || checkoutStep === 2) && (\n" + bed_selector
    )

# 3. Add Booking creation in handleCheckout
booking_logic = """
          // --- Auto Create Booking & Assign Bed ---
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
          }
"""

if "// --- Auto Create Booking & Assign Bed ---" not in content:
    content = content.replace(
        "\"customerSignature\": custSignatureUrl,",
        booking_logic + "\n            \"customerSignature\": custSignatureUrl,"
    )

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("POSSystem.jsx patched successfully!")
