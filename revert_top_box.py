import sys

file_path = "/Users/ittichai/ZCodeProject/admin-dashboard/src/components/POSSystem.jsx"

with open(file_path, "r") as f:
    content = f.read()

target = """                <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 shadow-sm mb-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-rose-700 font-bold text-lg">ยอดเงินสดส่งฝากจริง</span>
                    <span className="font-black text-rose-700 text-3xl">
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
                  <div className="flex justify-between items-center pt-2 border-t border-rose-200/60">
                    <span className="text-indigo-700 font-bold">เงินทอนเก็บไว้ในลิ้นชัก (สำหรับพรุ่งนี้)</span>
                    <span className="font-black text-indigo-700 text-xl">
                      ฿{(() => {
                        const expectedCash = todaySalesBreakdown.cash + (parseNumber(eodData.floatCash) || 0);
                        const nonCashSales = (todaySalesBreakdown.transfer || 0) + (todaySalesBreakdown.credit || 0) + (todaySalesBreakdown.cod || 0);
                        const totalSystemBalance = expectedCash + nonCashSales;
                        const floatCashNum = parseNumber(eodData.floatCash) || 0;
                        const baseFloat = Math.floor(floatCashNum / 100) * 100;
                        const totalTheoreticalDeposit = Math.floor(totalSystemBalance / 100) * 100 - baseFloat;
                        return (totalSystemBalance - totalTheoreticalDeposit).toLocaleString();
                      })()}
                    </span>
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
print("Updated POSSystem.jsx")
