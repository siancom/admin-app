const fs = require('fs');

let content = fs.readFileSync('src/components/EmployeePortal.jsx', 'utf8');

// --- PART 1: Rearrange and resize the clock-in block ---

// We need to move the block from where it is to the top.
// Let's find the start of dashboard tab.
const dashboardStartRegex = /\{\/\* Dashboard \/ Clock In-Out \*\/\}\s*\{activeTab === 'dashboard' && \(\s*<div className="flex flex-col gap-6">/;

// Let's find the clock in block.
const clockInBlockRegex = /<div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">\s*<h3 className="text-lg font-black text-slate-800 mb-4 text-center md:text-left">บันทึกเวลาทำงานวันนี้<\/h3>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

if (content.match(clockInBlockRegex)) {
    const originalClockInBlock = content.match(clockInBlockRegex)[0];
    
    // Resize the clock in block
    let newClockInBlock = originalClockInBlock
        .replace(/p-5 rounded-2xl/, 'p-4 md:p-5 rounded-3xl') // Slightly different card style
        .replace(/mb-4 text-center md:text-left/, 'mb-3 text-center md:text-left')
        .replace(/<CheckCircle size=\{28\} className="mb-2 text-emerald-500" \/>/, '<CheckCircle size={24} className="mb-1 text-emerald-500" />')
        .replace(/<h4 className="text-sm md:text-base font-black mb-1">เข้างาน<\/h4>/, '<h4 className="text-sm font-black mb-0.5">เข้างาน</h4>')
        .replace(/<p className="text-xs md:text-sm font-bold">/, '<p className="text-xs font-bold text-slate-600">')
        .replace(/<p className="text-\[10px\] md:text-xs font-bold text-emerald-600 mt-1">/, '<p className="text-[10px] font-bold text-emerald-600 mt-0.5">')
        
        .replace(/<XCircle size=\{28\} className="mb-2 text-slate-400" \/>/, '<XCircle size={24} className="mb-1 text-slate-400" />')
        .replace(/<h4 className="text-sm md:text-base font-black mb-1">ออกงาน<\/h4>/, '<h4 className="text-sm font-black mb-0.5">ออกงาน</h4>')
        
        .replace(/<button onClick=\{onClockIn\} disabled=\{!todayAtt\}\s*className="bg-gradient-to-br from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white p-4 rounded-2xl font-black shadow-lg shadow-emerald-500\/30 transition-transform active:scale-95 flex flex-col items-center justify-center text-center h-full disabled:opacity-50 w-full"/,
                 '<button onClick={onClockIn} disabled={!todayAtt} className="bg-gradient-to-br from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white p-3 rounded-2xl font-black shadow-sm shadow-emerald-500/20 transition-transform active:scale-95 flex flex-col items-center justify-center text-center h-full disabled:opacity-50 w-full"')
        .replace(/<button onClick=\{onClockOut\}\s*className="bg-gradient-to-br from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white p-4 rounded-2xl font-black shadow-lg shadow-rose-500\/30 transition-transform active:scale-95 flex flex-col items-center justify-center text-center h-full w-full"/,
                 '<button onClick={onClockOut} className="bg-gradient-to-br from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white p-3 rounded-2xl font-black shadow-sm shadow-rose-500/20 transition-transform active:scale-95 flex flex-col items-center justify-center text-center h-full w-full"');
        
    // Remove it from its original place
    content = content.replace(clockInBlockRegex, '');
    
    // Put it at the beginning of the dashboard
    if (content.match(dashboardStartRegex)) {
        const dStart = content.match(dashboardStartRegex)[0];
        content = content.replace(dashboardStartRegex, dStart + "\n" + newClockInBlock + "\n");
        console.log("Moved and resized clock-in block.");
    }
} else {
    console.log("Clock-in block not found.");
}

// --- PART 2: Add Monthly Requests List ---
// Find the end of the dashboard tab. We can look for `{/* Service Fees View */}`
const serviceFeesRegex = /\{\/\* Service Fees View \*\/\}/;
if (content.match(serviceFeesRegex)) {
    const requestsListHtml = `
                  {/* Monthly Requests Summary */}
                  <div className="bg-white p-4 md:p-5 rounded-3xl border border-slate-200 shadow-sm mb-4">
                     <div className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><Send size={16} className="text-indigo-500"/> สถานะคำร้องเดือนนี้</div>
                     <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                        {(() => {
                           const currentMonthPrefix = new Date().toISOString().substring(0, 7); // YYYY-MM
                           
                           // Combine leaves, advances, requisitions for the current employee and current month
                           const empLeaves = leaves.filter(l => l.employeeId === employee.id && (l.createdAt || '').startsWith(currentMonthPrefix))
                              .map(l => ({ ...l, reqType: 'leave', title: l.leaveType, amount: null }));
                           const empAdvances = advancePayments.filter(a => a.employeeId === employee.id && (a.createdAt || '').startsWith(currentMonthPrefix))
                              .map(a => ({ ...a, reqType: 'advance', title: 'เบิกเงินล่วงหน้า', amount: a.amount }));
                           const empRequisitions = requisitions.filter(r => r.employeeId === employee.id && (r.createdAt || '').startsWith(currentMonthPrefix))
                              .map(r => ({ ...r, reqType: 'requisition', title: 'เบิกของใช้: ' + r.itemName, amount: r.quantity }));
                              
                           const allMyRequests = [...empLeaves, ...empAdvances, ...empRequisitions]
                              .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
                              
                           if (allMyRequests.length === 0) {
                              return <div className="text-center text-slate-400 font-bold py-6 bg-slate-50 rounded-2xl text-xs border border-slate-100">ไม่มีคำร้องในเดือนนี้</div>;
                           }
                           
                           return allMyRequests.map((req, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                                 <div>
                                    <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                                      <div className={\`w-2 h-2 rounded-full \${
                                          req.status === 'อนุมัติ' || req.status === 'อนุมัติแล้ว' ? 'bg-emerald-500' :
                                          req.status === 'ไม่อนุมัติ' ? 'bg-rose-500' :
                                          'bg-amber-400'
                                      }\`}></div>
                                      {req.title}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-medium mt-1">
                                       {new Date(req.createdAt).toLocaleDateString('th-TH')}
                                       {req.reqType === 'leave' && req.startDate && \` (\${new Date(req.startDate).toLocaleDateString('th-TH')})\`}
                                       {req.reqType === 'advance' && \` - ฿\${Number(req.amount).toLocaleString()}\`}
                                       {req.reqType === 'requisition' && \` - จำนวน: \${req.amount}\`}
                                    </div>
                                 </div>
                                 <div>
                                     <span className={\`text-[10px] font-bold px-2 py-1 rounded-lg \${
                                          req.status === 'อนุมัติ' || req.status === 'อนุมัติแล้ว' ? 'bg-emerald-100 text-emerald-700' :
                                          req.status === 'ไม่อนุมัติ' ? 'bg-rose-100 text-rose-700' :
                                          'bg-amber-100 text-amber-700'
                                     }\`}>
                                        {req.status || 'รออนุมัติ'}
                                     </span>
                                 </div>
                              </div>
                           ));
                        })()}
                     </div>
                  </div>
`;
    content = content.replace(serviceFeesRegex, requestsListHtml + "\n               </div>\n            )}\n\n            {/* Service Fees View */}");
    console.log("Added Monthly Requests List.");
}

// --- PART 3: Bottom Navigation Styles ---
// Find the bottom navigation mapping block
const bottomNavRegex = /<div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-\[210\] flex justify-around items-center h-\[70px\] pb-safe shadow-\[0_-4px_20px_rgba\(0,0,0,0\.05\)\]">[\s\S]*?<\/div>/;
if (content.match(bottomNavRegex)) {
    const bottomNavNew = `<div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-[210] flex justify-around items-end pb-2 px-2 h-[75px] shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
         {[
            { id: 'dashboard', icon: Clock, label: 'ลงเวลา' },
            { id: 'service', icon: UserCheck, label: 'ค่ามือ' },
            { id: 'schedule_group', icon: Calendar, label: 'ตารางงาน' },
            { id: 'requests_group', icon: Send, label: 'คำร้อง' },
            { id: 'settings', icon: Lock, label: 'ตั้งค่า' },
         ].map(tab => {
            const isMain = tab.id === 'dashboard';
            const isActive = activeTab === tab.id;
            
            if (isMain) {
                return (
                    <button 
                       key={tab.id}
                       onClick={() => setActiveTab(tab.id)} 
                       className="relative flex flex-col items-center justify-center w-[20%] h-full group"
                    >
                       <div className={\`absolute -top-6 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform duration-300 \${isActive ? 'bg-indigo-600 scale-105 shadow-indigo-500/40' : 'bg-indigo-500 scale-100'}\`}>
                           <tab.icon size={24} className="text-white" />
                       </div>
                       <span className={\`text-[10px] font-black mt-8 \${isActive ? 'text-indigo-600' : 'text-slate-400'}\`}>{tab.label}</span>
                    </button>
                );
            }
            
            return (
               <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)} 
                  className={\`flex flex-col items-center justify-center w-[20%] h-[50px] space-y-1 \${isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}\`}
               >
                  <tab.icon size={20} className={isActive ? 'stroke-[2.5px]' : ''} />
                  <span className="text-[10px] font-bold">{tab.label}</span>
               </button>
            );
         })}
      </div>`;
      
    content = content.replace(bottomNavRegex, bottomNavNew);
    console.log("Updated bottom nav styles.");
}

fs.writeFileSync('src/components/EmployeePortal.jsx', content, 'utf8');
