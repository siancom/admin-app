import sys

file_path = "/Users/ittichai/ZCodeProject/admin-dashboard/src/components/FinancialDashboard.jsx"

with open(file_path, "r") as f:
    content = f.read()

target = """                      <div className="text-right">
                        <div className="text-xs text-slate-500">ยอดเงินสดที่นับได้</div>
                        <div className="text-xl font-black text-indigo-600">฿{d.actualCash?.toLocaleString()}</div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 rounded-xl p-3 space-y-2 text-sm mb-4">
                      <div className="flex justify-between"><span className="text-slate-500">เงินสดในระบบ</span><span className="font-bold">฿{d.cashSales?.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">เงินทอนตั้งต้น</span><span className="font-bold">฿{d.floatCash?.toLocaleString()}</span></div>
                      <div className="border-t border-slate-200 pt-2 flex justify-between font-bold">
                        <span className="text-slate-700">ควรมีในลิ้นชัก</span>
                        <span className="text-indigo-600">฿{d.expectedCash?.toLocaleString()}</span>
                      </div>
                      <div className={`flex justify-between font-bold ${d.difference > 0 ? 'text-emerald-600' : d.difference < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                        <span>ผลต่าง (เกิน/ขาด)</span>
                        <span>{d.difference > 0 ? '+' : ''}{d.difference?.toLocaleString()}</span>
                      </div>
                      
                      {(d.remitAmount !== undefined && d.nextDayFloat !== undefined) && (
                        <>
                          <div className="border-t border-indigo-100 pt-2 flex justify-between font-bold text-indigo-700">
                             <span>ยอดนำฝากธนาคาร (ส่งยอดจริง)</span>
                             <span>฿{d.remitAmount?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between font-bold text-indigo-500">
                             <span>ยอดเงินทอนยกไปพรุ่งนี้</span>
                             <span>฿{d.nextDayFloat?.toLocaleString()}</span>
                          </div>
                        </>
                      )}"""


replacement = """                      <div className="text-right">
                        <div className="text-xs text-rose-500 font-bold">ยอดเงินสดส่งฝากจริง</div>
                        <div className="text-xl font-black text-rose-600">฿{d.remitAmount?.toLocaleString()}</div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 rounded-xl p-3 space-y-2 text-sm mb-4">
                      <div className="flex justify-between"><span className="text-slate-500">เงินสดในระบบ</span><span className="font-bold">฿{d.cashSales?.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">เงินทอนตั้งต้น</span><span className="font-bold">฿{d.floatCash?.toLocaleString()}</span></div>
                      <div className="border-t border-slate-200 pt-2 flex justify-between font-bold">
                        <span className="text-slate-700">ยอดที่ควรส่งฝาก</span>
                        <span className="text-indigo-600">฿{(d.remitAmount - d.difference).toLocaleString()}</span>
                      </div>
                      <div className={`flex justify-between font-bold ${d.difference > 0 ? 'text-emerald-600' : d.difference < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                        <span>ผลต่าง (เกิน/ขาด)</span>
                        <span>{d.difference > 0 ? '+' : ''}{d.difference?.toLocaleString()}</span>
                      </div>
                      
                      {(d.nextDayFloat !== undefined) && (
                        <div className="border-t border-indigo-100 pt-2 flex justify-between font-bold text-indigo-500">
                           <span>เงินทอนยกไปพรุ่งนี้</span>
                           <span>฿{d.nextDayFloat?.toLocaleString()}</span>
                        </div>
                      )}"""

content = content.replace(target, replacement)

with open(file_path, "w") as f:
    f.write(content)
print("Updated FinancialDashboard.jsx")
