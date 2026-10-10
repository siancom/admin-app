import re

filepath = "src/components/POSSystem.jsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

bad_string = """          {(!cart.some(i => i.type === 'usage') || checkoutStep === 2) && (

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
          )}"""

good_string = """          {cart.some(i => i.type === 'usage') && (
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

          {(!cart.some(i => i.type === 'usage') || checkoutStep === 2) && ("""

if bad_string in content:
    content = content.replace(bad_string, good_string)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print("UI syntax error fixed!")
else:
    print("Not found.")
