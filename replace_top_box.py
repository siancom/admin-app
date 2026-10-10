import sys

file_path = "/Users/ittichai/ZCodeProject/admin-dashboard/src/components/POSSystem.jsx"

with open(file_path, "r") as f:
    content = f.read()

target = """                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-500 font-bold">ยอดขายเงินสด (ในระบบ)</span>
                    <span className="font-bold text-indigo-600">฿{todaySalesBreakdown.cash.toLocaleString()}</span>
                  </div>
                </div>"""

replacement = """                <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 shadow-sm mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-rose-700 font-bold">ยอดเงินสดส่งฝากจริง</span>
                    <span className="font-black text-rose-700 text-2xl">
                      ฿{(() => {
                        const expectedCash = todaySalesBreakdown.cash + (parseNumber(eodData.floatCash) || 0);
                        const nonCashSales = (todaySalesBreakdown.transfer || 0) + (todaySalesBreakdown.credit || 0) + (todaySalesBreakdown.cod || 0);
                        const totalSystemBalance = expectedCash + nonCashSales;
                        const floatCashNum = parseNumber(eodData.floatCash) || 0;
                        const baseFloat = Math.floor(floatCashNum / 100) * 100;
                        const totalTheoreticalDeposit = Math.floor(totalSystemBalance / 100) * 100 - baseFloat;
                        const expectedNextDayFloat = totalSystemBalance - totalTheoreticalDeposit;
                        return (expectedCash - expectedNextDayFloat).toLocaleString();
                      })()}
                    </span>
                  </div>
                </div>"""

content = content.replace(target, replacement)

with open(file_path, "w") as f:
    f.write(content)
