import sys

file_path = "/Users/ittichai/ZCodeProject/admin-dashboard/src/components/SalesHistoryModal.jsx"

with open(file_path, "r") as f:
    content = f.read()

target = """                  {/* Mobile Breakdown */}
                  <div className="flex xl:hidden grid grid-cols-4 gap-1.5 mt-3">
                    <div className="bg-white/80 rounded-lg py-2 px-1 flex flex-col items-center justify-center border border-emerald-100 shadow-sm">
                       <Banknote size={12} className="text-emerald-500 mb-1"/>
                       <div className="text-[10px] font-black text-emerald-700">฿{todaySalesBreakdown?.cash?.toLocaleString()}</div>
                    </div>
                    <div className="bg-white/80 rounded-lg py-2 px-1 flex flex-col items-center justify-center border border-blue-100 shadow-sm">
                       <Smartphone size={12} className="text-blue-500 mb-1"/>
                       <div className="text-[10px] font-black text-blue-700">฿{todaySalesBreakdown?.transfer?.toLocaleString()}</div>
                    </div>
                    <div className="bg-white/80 rounded-lg py-2 px-1 flex flex-col items-center justify-center border border-amber-100 shadow-sm">
                       <Clock size={12} className="text-amber-500 mb-1"/>
                       <div className="text-[10px] font-black text-amber-700">฿{todaySalesBreakdown?.cod?.toLocaleString()}</div>
                    </div>
                    <div className="bg-white/80 rounded-lg py-2 px-1 flex flex-col items-center justify-center border border-orange-100 shadow-sm">
                       <CreditCard size={12} className="text-orange-500 mb-1"/>
                       <div className="text-[10px] font-black text-orange-700">฿{todaySalesBreakdown?.credit?.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                <div className="hidden xl:flex bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex-col justify-center hover:border-emerald-200 transition-colors">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-500 text-[10px] font-bold">เงินสด</span>
                    <Banknote size={12} className="text-emerald-500" />
                  </div>
                  <div className="text-base font-bold text-emerald-600">฿{todaySalesBreakdown?.cash?.toLocaleString()}</div>
                </div>

                <div className="hidden xl:flex bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex-col justify-center hover:border-blue-200 transition-colors">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-500 text-[10px] font-bold">โอนเงิน</span>
                    <Smartphone size={12} className="text-blue-500" />
                  </div>
                  <div className="text-base font-bold text-blue-600">฿{todaySalesBreakdown?.transfer?.toLocaleString()}</div>
                </div>

                <div className="hidden xl:flex bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex-col justify-center hover:border-amber-200 transition-colors">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-500 text-[10px] font-bold">ค้าง/COD</span>
                    <Clock size={12} className="text-amber-500" />
                  </div>
                  <div className="text-base font-bold text-amber-600">฿{todaySalesBreakdown?.cod?.toLocaleString()}</div>
                </div>

                <div className="hidden xl:flex bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex-col justify-center hover:border-orange-200 transition-colors">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-500 text-[10px] font-bold">ใช้เครดิต</span>
                    <CreditCard size={12} className="text-orange-500" />
                  </div>
                  <div className="text-base font-bold text-orange-600">฿{todaySalesBreakdown?.credit?.toLocaleString()}</div>
                </div>"""

replacement = """                  {/* EOD Summary Calculations */}
                  {(() => {
                    const expectedCash = (todaySalesBreakdown?.cash || 0) + (Number(String(eodData?.floatCash).replace(/,/g, '')) || 0);
                    const nonCashSales = (todaySalesBreakdown?.transfer || 0) + (todaySalesBreakdown?.credit || 0) + (todaySalesBreakdown?.cod || 0);
                    const totalSystemBalance = expectedCash + nonCashSales;
                    const floatCashNum = Number(String(eodData?.floatCash).replace(/,/g, '')) || 0;
                    const baseFloat = Math.floor(floatCashNum / 100) * 100;
                    const expectedDeposit = Math.floor(totalSystemBalance / 100) * 100 - baseFloat;
                    const expectedNextDayFloat = totalSystemBalance - expectedDeposit;
                    const expectedRemit = expectedCash - expectedNextDayFloat;
                    
                    return (
                      <>
                        <div className="flex xl:hidden grid grid-cols-4 gap-1.5 mt-3">
                          <div className="bg-indigo-50 rounded-lg py-2 px-1 flex flex-col items-center justify-center border border-indigo-200 shadow-sm">
                             <div className="text-[10px] font-bold text-indigo-700">ยอดรวมฝาก</div>
                             <div className="text-[10px] font-black text-indigo-800">฿{expectedDeposit.toLocaleString()}</div>
                          </div>
                          <div className="bg-rose-50 rounded-lg py-2 px-1 flex flex-col items-center justify-center border border-rose-200 shadow-sm">
                             <div className="text-[10px] font-bold text-rose-700">จริงสด</div>
                             <div className="text-[10px] font-black text-rose-800">฿{expectedRemit.toLocaleString()}</div>
                          </div>
                          <div className="bg-orange-50 rounded-lg py-2 px-1 flex flex-col items-center justify-center border border-orange-200 shadow-sm">
                             <div className="text-[9px] font-bold text-orange-700 leading-tight text-center">ปลายทาง/<br/>ค้าง</div>
                             <div className="text-[10px] font-black text-orange-800">฿{((todaySalesBreakdown?.cod || 0) + (todaySalesBreakdown?.credit || 0)).toLocaleString()}</div>
                          </div>
                          <div className="bg-blue-50 rounded-lg py-2 px-1 flex flex-col items-center justify-center border border-blue-200 shadow-sm">
                             <div className="text-[10px] font-bold text-blue-700">โอน</div>
                             <div className="text-[10px] font-black text-blue-800">฿{(todaySalesBreakdown?.transfer || 0).toLocaleString()}</div>
                          </div>
                        </div>
                      </div>

                      <div className="hidden xl:flex bg-indigo-50 p-2 rounded-xl border border-indigo-200 shadow-sm flex-col justify-center">
                        <div className="text-indigo-600 text-[10px] font-bold mb-1">ยอดรวมฝาก</div>
                        <div className="text-base font-black text-indigo-800">฿{expectedDeposit.toLocaleString()}</div>
                      </div>

                      <div className="hidden xl:flex bg-rose-50 p-2 rounded-xl border border-rose-200 shadow-sm flex-col justify-center">
                        <div className="text-rose-600 text-[10px] font-bold mb-1">นำฝากจริง (สด)</div>
                        <div className="text-base font-black text-rose-800">฿{expectedRemit.toLocaleString()}</div>
                      </div>

                      <div className="hidden xl:flex bg-orange-50 p-2 rounded-xl border border-orange-200 shadow-sm flex-col justify-center">
                        <div className="text-orange-600 text-[10px] font-bold mb-1">ปลายทาง/ค้าง</div>
                        <div className="text-base font-black text-orange-800">฿{((todaySalesBreakdown?.cod || 0) + (todaySalesBreakdown?.credit || 0)).toLocaleString()}</div>
                      </div>

                      <div className="hidden xl:flex bg-blue-50 p-2 rounded-xl border border-blue-200 shadow-sm flex-col justify-center">
                        <div className="text-blue-600 text-[10px] font-bold mb-1">โอนเงิน</div>
                        <div className="text-base font-black text-blue-800">฿{(todaySalesBreakdown?.transfer || 0).toLocaleString()}</div>
                      </div>
                      </>
                    );
                  })()}"""

content = content.replace(target, replacement)

with open(file_path, "w") as f:
    f.write(content)
print("Updated SalesHistoryModal.jsx")
