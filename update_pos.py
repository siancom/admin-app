import sys

file_path = "/Users/ittichai/ZCodeProject/admin-dashboard/src/components/POSSystem.jsx"

with open(file_path, "r") as f:
    lines = f.readlines()

replacement_eodTab = """                      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-800">
                         <div className="flex justify-between items-center mb-2">
                           <span className="font-bold text-sm">ยอดส่งเงินสดจริง (หักยอดโอนแล้ว)</span>
                           <span className="text-2xl font-black text-rose-600">฿{remitAmount.toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between items-center text-sm mb-1">
                           <span className="font-medium text-indigo-600">ยอดฝากธนาคารรวม (ปัดเศษหลักร้อย)</span>
                           <span className="font-bold text-indigo-700">฿{totalTheoreticalDeposit.toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between items-center text-sm">
                           <span className="font-medium text-indigo-600">เงินทอนยกไปพรุ่งนี้</span>
                           <span className="font-bold text-indigo-700">฿{nextDayFloat.toLocaleString()}</span>
                         </div>
                      </div>
"""

lines[2640:2650] = [replacement_eodTab]

replacement_a4 = """                         <td className="border border-slate-300 p-3 w-2/3">ยอดรวมเงินสดในลิ้นชัก (รวมเงินทอน)</td>
                         <td className="border border-slate-300 p-3 text-right font-bold text-emerald-600">฿{(() => {
                            const expected = todaySalesBreakdown.cash + (parseNumber(eodData.floatCash) || 0);
                            const actual = eodData.actualCash ? parseNumber(eodData.actualCash) : expected;
                            return actual.toLocaleString();
                         })()}</td>
                       </tr>
                       <tr>
                         <td className="border border-slate-300 p-3">ยอดขายช่องทางอื่น (โอน/เครดิต/COD)</td>
                         <td className="border border-slate-300 p-3 text-right font-bold text-blue-600">฿{((todaySalesBreakdown.transfer || 0) + (todaySalesBreakdown.credit || 0) + (todaySalesBreakdown.cod || 0)).toLocaleString()}</td>
                       </tr>
                       <tr className="bg-slate-50 font-bold text-lg">
                         <td className="border border-slate-300 p-3 text-right">ยอดรวมสุทธิทั้งระบบ</td>
                         <td className="border border-slate-300 p-3 text-right text-indigo-700">฿{(() => {
                            const expected = todaySalesBreakdown.cash + (parseNumber(eodData.floatCash) || 0);
                            const actual = eodData.actualCash ? parseNumber(eodData.actualCash) : expected;
                            const nonCash = (todaySalesBreakdown.transfer || 0) + (todaySalesBreakdown.credit || 0) + (todaySalesBreakdown.cod || 0);
                            return (actual + nonCash).toLocaleString();
                         })()}</td>
                       </tr>
                       <tr>
                         <td className="border border-slate-300 p-3">ยอดรวมที่ต้องฝากธนาคารทั้งหมด (ปัดเศษหลักร้อย)</td>
                         <td className="border border-slate-300 p-3 text-right font-bold text-slate-700">฿{(() => {
                            const expected = todaySalesBreakdown.cash + (parseNumber(eodData.floatCash) || 0);
                            const actual = eodData.actualCash ? parseNumber(eodData.actualCash) : expected;
                            const nonCash = (todaySalesBreakdown.transfer || 0) + (todaySalesBreakdown.credit || 0) + (todaySalesBreakdown.cod || 0);
                            return (Math.floor((actual + nonCash) / 100) * 100).toLocaleString();
                         })()}</td>
                       </tr>
                       <tr>
                         <td className="border border-slate-300 p-3 text-rose-600">ยอดส่งเงินสดจริง (หักยอดโอน/เครดิต/COD)</td>
                         <td className="border border-slate-300 p-3 text-right font-bold text-rose-600">- ฿{(() => {
                            const expected = todaySalesBreakdown.cash + (parseNumber(eodData.floatCash) || 0);
                            const actual = eodData.actualCash ? parseNumber(eodData.actualCash) : expected;
                            const nonCash = (todaySalesBreakdown.transfer || 0) + (todaySalesBreakdown.credit || 0) + (todaySalesBreakdown.cod || 0);
                            const totalSystemBalance = actual + nonCash;
                            const totalTheoreticalDeposit = Math.floor(totalSystemBalance / 100) * 100;
                            const nextDayFloat = totalSystemBalance - totalTheoreticalDeposit;
                            return (actual - nextDayFloat).toLocaleString();
                         })()}</td>
                       </tr>
                       <tr className="bg-slate-50 font-bold text-lg">
                         <td className="border border-slate-300 p-3 text-right">ยอดเหลือ / เงินทอนยกไปพรุ่งนี้</td>
                         <td className="border border-slate-300 p-3 text-right text-indigo-700">฿{(() => {
                            const expected = todaySalesBreakdown.cash + (parseNumber(eodData.floatCash) || 0);
                            const actual = eodData.actualCash ? parseNumber(eodData.actualCash) : expected;
                            const nonCash = (todaySalesBreakdown.transfer || 0) + (todaySalesBreakdown.credit || 0) + (todaySalesBreakdown.cod || 0);
                            const totalSystemBalance = actual + nonCash;
                            const totalTheoreticalDeposit = Math.floor(totalSystemBalance / 100) * 100;
                            return (totalSystemBalance - totalTheoreticalDeposit).toLocaleString();
                         })()}</td>
                       </tr>
"""

lines[2874:2907] = [replacement_a4]

with open(file_path, "w") as f:
    f.writelines(lines)

print("Saved.")
