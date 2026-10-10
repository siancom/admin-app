const fs = require('fs');
let content = fs.readFileSync('src/components/EmployeeDashboard.jsx', 'utf8');

// 1. Add allRequests useMemo
const reqMatch = /const filteredEmployees = useMemo\(\(\) => \{[\s\S]*?\}, \[employees, branchFilter\]\);/;

const allReqMemo = `
  const allRequests = useMemo(() => {
    const list = [];
    leaves.forEach(l => list.push({ ...l, reqType: 'leave', typeName: 'ขอลางาน', icon: 'Calendar' }));
    advancePayments.forEach(a => list.push({ ...a, reqType: 'advance', typeName: 'เบิกเงินล่วงหน้า', icon: 'Wallet' }));
    (requisitions || []).forEach(r => list.push({ ...r, reqType: 'supplies', typeName: 'เบิกของใช้', icon: 'ShoppingCart' }));
    
    // Sort by createdAt descending
    return list.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [leaves, advancePayments, requisitions]);
`;

if (content.match(reqMatch)) {
    const matchedStr = content.match(reqMatch)[0];
    content = content.replace(reqMatch, matchedStr + allReqMemo);
    console.log("Added allRequests useMemo.");
}

// 2. Modify tabs in menu
const tabsStartStr = `<div className="flex gap-2 flex-wrap">`;
const tabsEndStr = `</div>`;
const tabsStartIndex = content.indexOf(tabsStartStr);
const tabsEndIndex = content.indexOf(tabsEndStr, tabsStartIndex);

if (tabsStartIndex !== -1 && tabsEndIndex !== -1) {
    const oldTabsBlock = content.slice(tabsStartIndex, tabsEndIndex + tabsEndStr.length);
    
    const newTabsBlock = `<div className="flex gap-2 flex-wrap">
          <button onClick={() => setActiveTab('attendance')} className={\`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 \${activeTab === 'attendance' ? 'bg-indigo-100 text-indigo-700 shadow-inner' : 'text-slate-500 hover:bg-slate-100'}\`}>
            <Clock size={16} /> ลงเวลาเข้างาน
          </button>
          <button onClick={() => setActiveTab('history')} className={\`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 \${activeTab === 'history' ? 'bg-indigo-100 text-indigo-700 shadow-inner' : 'text-slate-500 hover:bg-slate-100'}\`}>
            <History size={16} /> ประวัติลงเวลา
          </button>
          <button onClick={() => setActiveTab('requests')} className={\`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 \${activeTab === 'requests' ? 'bg-indigo-100 text-indigo-700 shadow-inner' : 'text-slate-500 hover:bg-slate-100'}\`}>
            <FileText size={16} /> รวมคำร้อง
          </button>
          <button onClick={() => setActiveTab('payroll')} className={\`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 \${activeTab === 'payroll' ? 'bg-indigo-100 text-indigo-700 shadow-inner' : 'text-slate-500 hover:bg-slate-100'}\`}>
            <DollarSign size={16} /> เงินเดือน/รายได้
          </button>
          <button onClick={() => setActiveTab('schedule')} className={\`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 \${activeTab === 'schedule' ? 'bg-indigo-100 text-indigo-700 shadow-inner' : 'text-slate-500 hover:bg-slate-100'}\`}>
            <Calendar size={16} /> ตารางงาน (รายเดือน)
          </button>
          <button onClick={() => setActiveTab('manage')} className={\`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 \${activeTab === 'manage' ? 'bg-indigo-100 text-indigo-700 shadow-inner' : 'text-slate-500 hover:bg-slate-100'}\`}>
            <Users size={16} /> จัดการพนักงาน
          </button>
        </div>`;
        
    content = content.replace(oldTabsBlock, newTabsBlock);
    console.log("Replaced tabs block.");
}

// 3. Set default activeTab to 'requests' if we want, but 'attendance' is fine.
// Replace the old panels: leave, advance, supplies.
// We can just find them and remove them, or replace them.
// Since they are big, we can use simple regex to remove them.

const leavePanelRegex = /\{\/\* LEAVE TAB \*\/\}\s*\{activeTab === 'leave' && \([\s\S]*?\}\s*<\/div>\s*<\/div>\s*\)\}/;
if (content.match(leavePanelRegex)) {
    content = content.replace(leavePanelRegex, '');
    console.log("Removed leave panel.");
}

const advancePanelRegex = /\{\/\* ADVANCE PAYMENTS TAB \*\/\}\s*\{activeTab === 'advance' && \([\s\S]*?\}\s*<\/div>\s*<\/div>\s*\)\}/;
if (content.match(advancePanelRegex)) {
    content = content.replace(advancePanelRegex, '');
    console.log("Removed advance panel.");
}

const suppliesPanelRegex = /\{\/\* SUPPLIES TAB \*\/\}\s*\{activeTab === 'supplies' && \([\s\S]*?\}\s*<\/div>\s*<\/div>\s*\)\}/;
if (content.match(suppliesPanelRegex)) {
    content = content.replace(suppliesPanelRegex, '');
    console.log("Removed supplies panel.");
}

// 4. Add the unified requests panel right before PAYROLL TAB
const requestsHtml = `
        {/* UNIFIED REQUESTS TAB */}
        {activeTab === 'requests' && (
           <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
             <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><FileText className="text-indigo-500" /> จัดการคำร้องทั้งหมด</h2>
             </div>
             <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                     <tr>
                       <th className="px-6 py-4">วันที่ส่งคำร้อง</th>
                       <th className="px-6 py-4">พนักงาน</th>
                       <th className="px-6 py-4">ประเภท/รายละเอียด</th>
                       <th className="px-6 py-4">สถานะ</th>
                       <th className="px-6 py-4 text-right">จัดการ</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {allRequests.map(req => (
                       <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                         <td className="px-6 py-4 text-slate-500 font-bold">{new Date(req.createdAt).toLocaleDateString('th-TH')}</td>
                         <td className="px-6 py-4 font-bold text-slate-800">
                            {req.employeeName}
                         </td>
                         <td className="px-6 py-4">
                            <div className="font-bold flex items-center gap-2">
                               <span className={\`px-2 py-0.5 rounded text-xs \${
                                 req.reqType === 'leave' ? 'bg-orange-100 text-orange-700' :
                                 req.reqType === 'advance' ? 'bg-emerald-100 text-emerald-700' :
                                 'bg-blue-100 text-blue-700'
                               }\`}>
                                 {req.typeName}
                               </span>
                            </div>
                            <div className="text-slate-700 font-medium mt-2">
                               {req.reqType === 'leave' && (
                                  <>
                                    <span>{req.leaveType}</span>
                                    <span className="mx-2 text-slate-300">|</span>
                                    <span>วันที่: {new Date(req.startDate).toLocaleDateString('th-TH')} {req.startDate !== req.endDate ? \` - \${new Date(req.endDate).toLocaleDateString('th-TH')}\` : ''}</span>
                                  </>
                               )}
                               {req.reqType === 'advance' && (
                                  <span className="font-black text-emerald-600">฿{Number(req.amount).toLocaleString()}</span>
                               )}
                               {req.reqType === 'supplies' && (
                                  <>
                                    <span>{req.itemName}</span>
                                    <span className="ml-2 bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md text-xs">{req.quantity}</span>
                                  </>
                               )}
                            </div>
                            {req.reason && <div className="text-xs font-normal text-slate-500 mt-1">เหตุผล: {req.reason}</div>}
                         </td>
                         <td className="px-6 py-4">
                            <span className={\`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit \${
                               req.status === 'อนุมัติ' || req.status === 'อนุมัติแล้ว' ? 'bg-emerald-100 text-emerald-700' :
                               req.status === 'ไม่อนุมัติ' ? 'bg-rose-100 text-rose-700' :
                               'bg-amber-100 text-amber-700'
                            }\`}>
                               {req.status || 'รออนุมัติ'}
                            </span>
                            {req.status === 'ไม่อนุมัติ' && req.note && (
                                <div className="text-[10px] text-rose-600 mt-1 max-w-[150px] truncate" title={req.note}>หมายเหตุ: {req.note}</div>
                            )}
                         </td>
                         <td className="px-6 py-4 text-right">
                           {(!req.status || req.status === 'รออนุมัติ') && (
                             <div className="flex justify-end gap-2">
                               <button 
                                 onClick={() => {
                                    if(req.reqType === 'leave') handleUpdateLeaveStatus(req.id, 'อนุมัติ');
                                    else if(req.reqType === 'advance') handleUpdateAdvanceStatus(req.id, 'อนุมัติ');
                                    else if(req.reqType === 'supplies') handleUpdateRequisitionStatus(req.id, 'อนุมัติแล้ว');
                                 }}
                                 className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg font-bold transition-all text-xs border border-emerald-200 hover:border-emerald-500 flex items-center gap-1">
                                 <CheckCircle size={14} /> อนุมัติ
                               </button>
                               <button 
                                 onClick={() => {
                                    if(req.reqType === 'leave') handleUpdateLeaveStatus(req.id, 'ไม่อนุมัติ');
                                    else if(req.reqType === 'advance') handleUpdateAdvanceStatus(req.id, 'ไม่อนุมัติ');
                                    else if(req.reqType === 'supplies') handleUpdateRequisitionStatus(req.id, 'ไม่อนุมัติ');
                                 }} 
                                 className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded-lg font-bold transition-all text-xs border border-rose-200 hover:border-rose-500 flex items-center gap-1">
                                 <XCircle size={14} /> ไม่อนุมัติ
                               </button>
                             </div>
                           )}
                         </td>
                       </tr>
                     ))}
                     {allRequests.length === 0 && (
                        <tr>
                            <td colSpan="5" className="px-6 py-8 text-center text-slate-500 font-bold">ไม่มีรายการคำร้อง</td>
                        </tr>
                     )}
                   </tbody>
                 </table>
             </div>
           </div>
        )}
`;

const payrollRegex = /\{\/\* PAYROLL TAB \*\/\}/;
if (content.match(payrollRegex)) {
    content = content.replace(payrollRegex, requestsHtml + '\n        {/* PAYROLL TAB */}');
    console.log("Added requests panel.");
}

fs.writeFileSync('src/components/EmployeeDashboard.jsx', content, 'utf8');
