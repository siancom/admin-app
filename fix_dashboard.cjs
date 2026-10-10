const fs = require('fs');

let modal = fs.readFileSync('src/components/SalesHistoryModal.jsx', 'utf8');

const dashboardUI = `          {/* Monthly Target Progress */}
          {(() => {
             const target = appSettings?.branchTargets?.[globalBranch || 'สำนักงานใหญ่'] || 0;
             if (target <= 0) return null;
             const progress = Math.min(100, (currentMonthSales / Number(target)) * 100);
             return (
               <div className="mb-3 bg-gradient-to-r from-indigo-50 to-blue-50 p-3 rounded-xl border border-indigo-100 shadow-sm">
                  <div className="flex justify-between items-center mb-1.5">
                     <div className="text-xs font-bold text-indigo-800">เป้ายอดขายเดือนนี้ ({globalBranch || 'สำนักงานใหญ่'})</div>
                     <div className="text-xs font-bold text-indigo-600">
                        ฿{currentMonthSales.toLocaleString()} / ฿{Number(target).toLocaleString()}
                     </div>
                  </div>
                  <div className="w-full bg-indigo-200/50 rounded-full h-1.5 mb-1 overflow-hidden">
                     <div 
                        className="bg-indigo-600 h-1.5 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: \`\${progress}%\` }}
                     ></div>
                  </div>
                  <div className="text-[9px] text-right text-indigo-500 font-medium">
                     คิดเป็น {progress.toFixed(1)}%
                  </div>
               </div>
             );
          })()}

          {/* Daily Sales Dashboard Cards */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-2 mb-3">
            <div className="bg-indigo-50 p-2 rounded-xl border border-indigo-100 shadow-sm col-span-1 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <DollarSign size={12} />
                    </div>
                    <div className="text-indigo-600/80 text-[10px] font-bold leading-tight">ยอดขายวันนี้<br/>({globalBranch || 'ทุกสาขา'})</div>
                  </div>
                  <div className="text-lg font-black text-indigo-700">฿{todaySales.toLocaleString()}</div>
                </div>
                <button 
                  onClick={() => { onClose(); setShowEodModal(true); }} 
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold hover:bg-indigo-700 transition-colors shadow-sm active:scale-95 whitespace-nowrap"
                >
                  ส่งยอด
                </button>
              </div>
              
              {/* Mobile Breakdown */}
              <div className="flex xl:hidden justify-between items-center bg-white/60 rounded-lg p-1.5 text-[9px] font-bold mt-2">
                <div className="flex items-center gap-1 text-emerald-600"><Banknote size={10}/> ฿{todaySalesBreakdown?.cash?.toLocaleString()}</div>
                <div className="flex items-center gap-1 text-blue-600"><Smartphone size={10}/> ฿{todaySalesBreakdown?.transfer?.toLocaleString()}</div>
                <div className="flex items-center gap-1 text-amber-600"><Clock size={10}/> ฿{todaySalesBreakdown?.cod?.toLocaleString()}</div>
                <div className="flex items-center gap-1 text-orange-600"><CreditCard size={10}/> ฿{todaySalesBreakdown?.credit?.toLocaleString()}</div>
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
            </div>
          </div>`;

if (!modal.includes('Monthly Target Progress')) {
    const targetModalDiv = '<div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">';

    modal = modal.replace(
        targetModalDiv,
        `${targetModalDiv}\n        </div>\n        <div className="p-4 bg-white border-b border-slate-100 shadow-sm z-0 shrink-0 overflow-y-auto max-h-[40vh]">\n${dashboardUI}\n`
    );
    fs.writeFileSync('src/components/SalesHistoryModal.jsx', modal);
    console.log('SalesHistoryModal.jsx modified');
} else {
    console.log('Already modified');
}
