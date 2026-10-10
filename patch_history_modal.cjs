const fs = require('fs');

let content = fs.readFileSync('src/components/SalesHistoryModal.jsx', 'utf8');

// 1. Import Package, Truck
content = content.replace(
  "import { X, Search, FileText, AlertCircle, Trash2, Clock, CheckCircle, DollarSign, Banknote, Smartphone, CreditCard } from 'lucide-react';",
  "import { X, Search, FileText, AlertCircle, Trash2, Clock, CheckCircle, DollarSign, Banknote, Smartphone, CreditCard, Package, Truck } from 'lucide-react';"
);

// 2. Add viewMode state
content = content.replace(
  "  const [searchTerm, setSearchTerm] = useState('');",
  "  const [searchTerm, setSearchTerm] = useState('');\n  const [viewMode, setViewMode] = useState('sales');"
);

// 3. Update displayedOrders filter logic
let filterLogic = `  const displayedOrders = orders.filter(o => {
    // 1. Filter by view mode
    const isOldPO = (o.courseName || '').includes('[ซื้อเข้า') || (o.courseName || '').includes('[เบิกจาก');
    const isPO = o.transactionType === 'owner_purchase' || o.transactionType === 'branch_requisition' || isOldPO;
    
    if (viewMode === 'sales' && isPO) return false;
    if (viewMode === 'po' && !isPO) return false;

    // 2. Filter by search term
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (o.orderNo && String(o.orderNo).toLowerCase().includes(term)) ||
      (o.customerName && String(o.customerName).toLowerCase().includes(term)) ||
      (o.customerPhone && String(o.customerPhone).includes(term))
    );
  });`;

content = content.replace(
  /  const displayedOrders = orders\.filter\(o => \{[\s\S]*?    \);\n  \}\);/,
  filterLogic
);

// 4. Calculate PO Totals
let calcPoTotals = `  // Calculate PO Totals
  const today = new Date().toLocaleDateString('th-TH');
  let todayTotalPO = 0;
  let todayTotalReq = 0;
  
  orders.forEach(o => {
    const oDate = new Date(o.createdAt).toLocaleDateString('th-TH');
    if (oDate === today) {
       const isOldPO = (o.courseName || '').includes('[ซื้อเข้า') || (o.courseName || '').includes('[เบิกจาก');
       const isReq = o.transactionType === 'branch_requisition' || (o.courseName || '').includes('[เบิกจาก');
       const isPO = o.transactionType === 'owner_purchase' || (o.courseName || '').includes('[ซื้อเข้า');
       
       if (isReq) todayTotalReq += Number(o.price || 0);
       else if (isPO) todayTotalPO += Number(o.price || 0);
    }
  });`;

content = content.replace(
  /  return \(\n    <div className="fixed inset-0 z-\[100\] flex items-center justify-center p-4 bg-slate-900\/60 backdrop-blur-sm">/,
  calcPoTotals + `\n\n  return (\n    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">`
);

// 5. Add Tab Buttons and conditionally render the top sections
let topSections = `        <div className="p-4 bg-white border-b border-slate-100 shadow-sm z-0 shrink-0 overflow-y-auto max-h-[40vh]">
          {/* Tabs */}
          <div className="flex gap-2 mb-4 bg-slate-100 p-1.5 rounded-xl">
            <button 
              onClick={() => setViewMode('sales')} 
              className={\`flex-1 py-2 text-sm font-bold rounded-lg transition-all \${viewMode === 'sales' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
            >
              ประวัติยอดขาย
            </button>
            <button 
              onClick={() => setViewMode('po')} 
              className={\`flex-1 py-2 text-sm font-bold rounded-lg transition-all \${viewMode === 'po' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
            >
              ประวัติสั่งซื้อ/เบิกสินค้า
            </button>
          </div>

          {viewMode === 'sales' ? (
            <>
              {/* Monthly Target Progress */}
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
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">ประวัติการขาย (POS)</h2>
                  <p className="text-xs text-slate-500 font-medium">ดูประวัติบิลและยกเลิกรายการ ({globalBranch || 'สาขาทั้งหมด'})</p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* PO/Req Dashboard */}
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="bg-teal-50 p-4 rounded-xl border border-teal-100 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                      <Package size={16} />
                    </div>
                    <div className="text-teal-700 font-bold">ยอดสั่งซื้อเข้า (เฉวง) วันนี้</div>
                  </div>
                  <div className="text-2xl font-black text-teal-800">฿{todayTotalPO.toLocaleString()}</div>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                      <Truck size={16} />
                    </div>
                    <div className="text-amber-700 font-bold">ยอดเบิกสินค้าวันนี้ ({globalBranch || 'ทุกสาขา'})</div>
                  </div>
                  <div className="text-2xl font-black text-amber-800">฿{todayTotalReq.toLocaleString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center shadow-inner">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">ประวัติสั่งซื้อ/เบิกสินค้า</h2>
                  <p className="text-xs text-slate-500 font-medium">ดูประวัติใบ PO และใบเบิก ({globalBranch || 'สาขาทั้งหมด'})</p>
                </div>
              </div>
            </>
          )}

          <button onClick={onClose} className="absolute right-4 top-4 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors z-10">
            <X size={24} />
          </button>
        </div>`;

content = content.replace(
  /        <div className="p-4 bg-white border-b border-slate-100 shadow-sm z-0 shrink-0 overflow-y-auto max-h-\[40vh\]">[\s\S]*?<button onClick=\{onClose\} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">\n            <X size=\{24\} \/>\n          <\/button>\n        <\/div>/,
  topSections
);

// We need to make sure the X button has absolute positioning because it was originally inside the same container.
// Actually, I moved the X button in the topSections replacement to be absolutely positioned: \`className="absolute right-4 top-4 ..."\`

fs.writeFileSync('src/components/SalesHistoryModal.jsx', content, 'utf8');
console.log("Successfully patched SalesHistoryModal");
