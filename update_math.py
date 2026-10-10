import sys

file_path = "/Users/ittichai/ZCodeProject/admin-dashboard/src/components/POSSystem.jsx"

with open(file_path, "r") as f:
    content = f.read()

# Replace handleEodSubmit logic
old_submit = """      const floatCashNum = parseNumber(eodData.floatCash) || 0;
      const nonCashSales = (todaySalesBreakdown.transfer || 0) + (todaySalesBreakdown.credit || 0) + (todaySalesBreakdown.cod || 0);
      const totalSystemBalance = actual + nonCashSales;
      const totalTheoreticalDeposit = Math.floor(totalSystemBalance / 100) * 100;
      const nextDayFloat = totalSystemBalance - totalTheoreticalDeposit;
      const remitAmount = actual - nextDayFloat;"""

new_submit = """      const floatCashNum = parseNumber(eodData.floatCash) || 0;
      const nonCashSales = (todaySalesBreakdown.transfer || 0) + (todaySalesBreakdown.credit || 0) + (todaySalesBreakdown.cod || 0);
      const totalSystemBalance = actual + nonCashSales;
      const baseFloat = Math.floor(floatCashNum / 100) * 100;
      const totalTheoreticalDeposit = Math.floor(totalSystemBalance / 100) * 100 - baseFloat;
      const nextDayFloat = totalSystemBalance - totalTheoreticalDeposit;
      const remitAmount = actual - nextDayFloat;"""

content = content.replace(old_submit, new_submit)

# Replace eodTab logic
old_tab = """                  const effectiveActual = eodData.actualCash ? actual : expectedCash;
                  const nonCashSales = (todaySalesBreakdown.transfer || 0) + (todaySalesBreakdown.credit || 0) + (todaySalesBreakdown.cod || 0);
                  const totalSystemBalance = effectiveActual + nonCashSales;
                  const totalTheoreticalDeposit = Math.floor(totalSystemBalance / 100) * 100;
                  const nextDayFloat = totalSystemBalance - totalTheoreticalDeposit;
                  const remitAmount = effectiveActual - nextDayFloat;"""

new_tab = """                  const effectiveActual = eodData.actualCash ? actual : expectedCash;
                  const nonCashSales = (todaySalesBreakdown.transfer || 0) + (todaySalesBreakdown.credit || 0) + (todaySalesBreakdown.cod || 0);
                  const totalSystemBalance = effectiveActual + nonCashSales;
                  const floatCashNum = parseNumber(eodData.floatCash) || 0;
                  const baseFloat = Math.floor(floatCashNum / 100) * 100;
                  const totalTheoreticalDeposit = Math.floor(totalSystemBalance / 100) * 100 - baseFloat;
                  const nextDayFloat = totalSystemBalance - totalTheoreticalDeposit;
                  const remitAmount = effectiveActual - nextDayFloat;"""

content = content.replace(old_tab, new_tab)

# Replace A4 logic (totalTheoreticalDeposit)
old_a4_deposit = """                       <tr>
                         <td className="border border-slate-300 p-3">ยอดรวมที่ต้องฝากธนาคารทั้งหมด (ปัดเศษหลักร้อย)</td>
                         <td className="border border-slate-300 p-3 text-right font-bold text-slate-700">฿{(() => {
                            const expected = todaySalesBreakdown.cash + (parseNumber(eodData.floatCash) || 0);
                            const actual = eodData.actualCash ? parseNumber(eodData.actualCash) : expected;
                            const nonCash = (todaySalesBreakdown.transfer || 0) + (todaySalesBreakdown.credit || 0) + (todaySalesBreakdown.cod || 0);
                            return (Math.floor((actual + nonCash) / 100) * 100).toLocaleString();
                         })()}</td>
                       </tr>"""

new_a4_deposit = """                       <tr>
                         <td className="border border-slate-300 p-3">ยอดรวมที่ต้องฝากธนาคารทั้งหมด (ปัดเศษหลักร้อย)</td>
                         <td className="border border-slate-300 p-3 text-right font-bold text-slate-700">฿{(() => {
                            const expected = todaySalesBreakdown.cash + (parseNumber(eodData.floatCash) || 0);
                            const actual = eodData.actualCash ? parseNumber(eodData.actualCash) : expected;
                            const nonCash = (todaySalesBreakdown.transfer || 0) + (todaySalesBreakdown.credit || 0) + (todaySalesBreakdown.cod || 0);
                            const totalSystemBalance = actual + nonCash;
                            const baseFloat = Math.floor((parseNumber(eodData.floatCash) || 0) / 100) * 100;
                            return (Math.floor(totalSystemBalance / 100) * 100 - baseFloat).toLocaleString();
                         })()}</td>
                       </tr>"""

content = content.replace(old_a4_deposit, new_a4_deposit)

# Replace A4 logic (remitAmount)
old_a4_remit = """                       <tr>
                         <td className="border border-slate-300 p-3 text-rose-600">ยอดส่งเงินสดจริง (หักยอดโอน/เครดิต/COD แล้ว)</td>
                         <td className="border border-slate-300 p-3 text-right font-bold text-rose-600">- ฿{(() => {
                            const expected = todaySalesBreakdown.cash + (parseNumber(eodData.floatCash) || 0);
                            const actual = eodData.actualCash ? parseNumber(eodData.actualCash) : expected;
                            const nonCash = (todaySalesBreakdown.transfer || 0) + (todaySalesBreakdown.credit || 0) + (todaySalesBreakdown.cod || 0);
                            const totalSystemBalance = actual + nonCash;
                            const totalTheoreticalDeposit = Math.floor(totalSystemBalance / 100) * 100;
                            const nextDayFloat = totalSystemBalance - totalTheoreticalDeposit;
                            return (actual - nextDayFloat).toLocaleString();
                         })()}</td>
                       </tr>"""

new_a4_remit = """                       <tr>
                         <td className="border border-slate-300 p-3 text-rose-600">ยอดส่งเงินสดจริง (หักยอดโอน/เครดิต/COD)</td>
                         <td className="border border-slate-300 p-3 text-right font-bold text-rose-600">- ฿{(() => {
                            const expected = todaySalesBreakdown.cash + (parseNumber(eodData.floatCash) || 0);
                            const actual = eodData.actualCash ? parseNumber(eodData.actualCash) : expected;
                            const nonCash = (todaySalesBreakdown.transfer || 0) + (todaySalesBreakdown.credit || 0) + (todaySalesBreakdown.cod || 0);
                            const totalSystemBalance = actual + nonCash;
                            const baseFloat = Math.floor((parseNumber(eodData.floatCash) || 0) / 100) * 100;
                            const totalTheoreticalDeposit = Math.floor(totalSystemBalance / 100) * 100 - baseFloat;
                            const nextDayFloat = totalSystemBalance - totalTheoreticalDeposit;
                            return (actual - nextDayFloat).toLocaleString();
                         })()}</td>
                       </tr>"""
                       
content = content.replace(old_a4_remit, new_a4_remit)

# Replace A4 logic (nextDayFloat)
old_a4_float = """                       <tr className="bg-slate-50 font-bold text-lg">
                         <td className="border border-slate-300 p-3 text-right">ยอดเหลือ / เงินทอนยกไปพรุ่งนี้</td>
                         <td className="border border-slate-300 p-3 text-right text-indigo-700">฿{(() => {
                            const expected = todaySalesBreakdown.cash + (parseNumber(eodData.floatCash) || 0);
                            const actual = eodData.actualCash ? parseNumber(eodData.actualCash) : expected;
                            const nonCash = (todaySalesBreakdown.transfer || 0) + (todaySalesBreakdown.credit || 0) + (todaySalesBreakdown.cod || 0);
                            const totalSystemBalance = actual + nonCash;
                            const totalTheoreticalDeposit = Math.floor(totalSystemBalance / 100) * 100;
                            return (totalSystemBalance - totalTheoreticalDeposit).toLocaleString();
                         })()}</td>
                       </tr>"""

new_a4_float = """                       <tr className="bg-slate-50 font-bold text-lg">
                         <td className="border border-slate-300 p-3 text-right">ยอดเหลือ / เงินทอนยกไปพรุ่งนี้</td>
                         <td className="border border-slate-300 p-3 text-right text-indigo-700">฿{(() => {
                            const expected = todaySalesBreakdown.cash + (parseNumber(eodData.floatCash) || 0);
                            const actual = eodData.actualCash ? parseNumber(eodData.actualCash) : expected;
                            const nonCash = (todaySalesBreakdown.transfer || 0) + (todaySalesBreakdown.credit || 0) + (todaySalesBreakdown.cod || 0);
                            const totalSystemBalance = actual + nonCash;
                            const baseFloat = Math.floor((parseNumber(eodData.floatCash) || 0) / 100) * 100;
                            const totalTheoreticalDeposit = Math.floor(totalSystemBalance / 100) * 100 - baseFloat;
                            return (totalSystemBalance - totalTheoreticalDeposit).toLocaleString();
                         })()}</td>
                       </tr>"""
                       
content = content.replace(old_a4_float, new_a4_float)

with open(file_path, "w") as f:
    f.write(content)

print("Saved.")
