const fs = require('fs');

let epContent = fs.readFileSync('src/components/EmployeePortal.jsx', 'utf8');

// 1. We will introduce internal states for the combined tabs.
// We can just rely on `activeTab` and when rendering, we'll group them.
// But wait, it's easier to create sub-states like `requestSubTab` ('leave' or 'finance') and `scheduleSubTab` ('schedule' or 'history').
// Or we can just keep the existing `activeTab` states, but in the mobile navigation bar and desktop sidebar, we map 5 buttons. Wait, if we use 5 buttons, clicking "คำร้อง" sets `activeTab` to 'requests'. But 'requests' doesn't exist yet!

// Let's modify the desktop sidebar AND mobile bottom nav to show 5 buttons.
// Desktop sidebar (lines 191-207)
epContent = epContent.replace(
  /         <div className="hidden md:flex flex-col w-64 gap-2 shrink-0">\s*\{\[\s*\{ id: 'dashboard', icon: Clock, label: 'ลงเวลา' \},\s*\{ id: 'schedule', icon: Calendar, label: 'ตารางงาน' \},\s*\{ id: 'history', icon: History, label: 'ประวัติลงเวลา' \},\s*\{ id: 'leave', icon: Send, label: 'ขอลา' \},\s*\{ id: 'service', icon: UserCheck, label: 'บันทึกค่ามือ' \},\s*\{ id: 'finance', icon: Wallet, label: 'เบิกเงิน' \},\s*\{ id: 'settings', icon: Lock, label: 'ตั้งค่า' \},\s*\]/,
  `         <div className="hidden md:flex flex-col w-64 gap-2 shrink-0">
            {[
               { id: 'dashboard', icon: Clock, label: 'ลงเวลา' },
               { id: 'service', icon: UserCheck, label: 'บันทึกค่ามือ' },
               { id: 'schedule_group', icon: Calendar, label: 'ตาราง & ประวัติ' },
               { id: 'requests_group', icon: Send, label: 'คำร้อง (ลา/เบิก)' },
               { id: 'settings', icon: Lock, label: 'ตั้งค่า' },
            ]`
);

// Mobile bottom nav (lines 610-616)
epContent = epContent.replace(
  /      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-\[210\] flex justify-around items-center h-16 pb-safe shadow-\[0_-4px_20px_rgba\(0,0,0,0\.05\)\]">\s*\{\[\s*\{ id: 'dashboard', icon: Clock, label: 'ลงเวลา' \},\s*\{ id: 'schedule', icon: Calendar, label: 'ตารางงาน' \},\s*\{ id: 'history', icon: History, label: 'ประวัติ' \},\s*\{ id: 'leave', icon: Send, label: 'ขอลา' \},\s*\{ id: 'service', icon: UserCheck, label: 'ค่ามือ' \},\s*\{ id: 'finance', icon: Wallet, label: 'เบิกเงิน' \},\s*\{ id: 'settings', icon: Lock, label: 'ตั้งค่า' \},\s*\]/,
  `      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-[210] flex justify-around items-center h-[70px] pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
         {[
            { id: 'dashboard', icon: Clock, label: 'ลงเวลา' },
            { id: 'service', icon: UserCheck, label: 'บันทึกค่ามือ' },
            { id: 'schedule_group', icon: Calendar, label: 'ตารางงาน' },
            { id: 'requests_group', icon: Send, label: 'คำร้อง' },
            { id: 'settings', icon: Lock, label: 'ตั้งค่า' },
         ]`
);

// We need state for subtabs.
epContent = epContent.replace(
  "  const [activeTab, setActiveTab] = useState('dashboard');",
  "  const [activeTab, setActiveTab] = useState('dashboard');\n  const [scheduleSubTab, setScheduleSubTab] = useState('schedule');\n  const [requestsSubTab, setRequestsSubTab] = useState('leave');"
);

// Now wrap 'schedule' and 'history' tabs.
epContent = epContent.replace(
  /            \{\/\* Schedule View \*\/\}/,
  `            {/* Schedule & History Group */}
            {activeTab === 'schedule_group' && (
               <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full max-h-[80vh]">
                  <div className="flex bg-slate-50 border-b border-slate-200">
                     <button onClick={() => setScheduleSubTab('schedule')} className={\`flex-1 py-4 font-bold text-sm transition-colors \${scheduleSubTab === 'schedule' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-100'}\`}>ตารางงาน</button>
                     <button onClick={() => setScheduleSubTab('history')} className={\`flex-1 py-4 font-bold text-sm transition-colors \${scheduleSubTab === 'history' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-100'}\`}>ประวัติลงเวลา</button>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
                     {scheduleSubTab === 'schedule' && (
                        <div className="space-y-4">
                           <h3 className="text-lg md:text-xl font-black text-slate-800 flex items-center gap-2 mb-4"><Calendar className="text-indigo-500" /> ตารางงานเดือน {new Date(scheduleMonth).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}</h3>
                           {/* Using the existing schedule UI logic... */}
                           <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center text-slate-500 font-bold">
                              ระบบกำลังอัปเดตตารางงานเร็วๆ นี้
                           </div>
                        </div>
                     )}
                     {scheduleSubTab === 'history' && (
                        <div className="space-y-4">
                           <h3 className="text-lg md:text-xl font-black text-slate-800 flex items-center gap-2 mb-4"><History className="text-indigo-500" /> ประวัติการลงเวลา</h3>
                           {myAttendance.length === 0 ? (
                              <div className="py-8 text-center text-slate-400 font-bold bg-slate-50 rounded-2xl">ไม่มีข้อมูลประวัติลงเวลา</div>
                           ) : (
                              <div className="space-y-3">
                                 {myAttendance.map(att => (
                                    <div key={att.id} className="bg-white border border-slate-200 p-4 rounded-2xl flex justify-between items-center shadow-sm">
                                       <div>
                                          <div className="font-bold text-slate-700">{new Date(att.date).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                                          <div className="text-xs text-slate-500 mt-1 flex gap-3">
                                             <span className="flex items-center gap-1 text-emerald-600"><CheckCircle size={12}/> {new Date(att.clockIn).toLocaleTimeString('th-TH', {hour:'2-digit', minute:'2-digit'})}</span>
                                             {att.clockOut && <span className="flex items-center gap-1 text-rose-500"><XCircle size={12}/> {new Date(att.clockOut).toLocaleTimeString('th-TH', {hour:'2-digit', minute:'2-digit'})}</span>}
                                          </div>
                                       </div>
                                       <div className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">{att.branch}</div>
                                    </div>
                                 ))}
                              </div>
                           )}
                        </div>
                     )}
                  </div>
               </div>
            )}

            {/* Old Schedule View */}`
);

// Wipe out old Schedule and History Views since we moved them into 'schedule_group'
epContent = epContent.replace(
  /            \{\/\* Old Schedule View \*\/\}[\s\S]*?\{\/\* Leave Request View \*\/\}/,
  "            {/* Leave Request View */}"
);

// Now wrap 'leave' and 'finance' into 'requests_group'
epContent = epContent.replace(
  /            \{\/\* Leave Request View \*\/\}/,
  `            {/* Requests Group */}
            {activeTab === 'requests_group' && (
               <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full max-h-[80vh]">
                  <div className="flex bg-slate-50 border-b border-slate-200">
                     <button onClick={() => setRequestsSubTab('leave')} className={\`flex-1 py-4 font-bold text-sm transition-colors \${requestsSubTab === 'leave' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-100'}\`}>ยื่นขอลา</button>
                     <button onClick={() => setRequestsSubTab('finance')} className={\`flex-1 py-4 font-bold text-sm transition-colors \${requestsSubTab === 'finance' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-100'}\`}>เบิกเงินล่วงหน้า</button>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                     {requestsSubTab === 'leave' && (
                        <div className="p-4 md:p-6 flex-1 flex flex-col h-full">`
);

// Fix the closing divs of old 'leave' view, and add 'finance' into it.
// Replace the start of 'finance' view to just be the `requestsSubTab === 'finance'` condition
epContent = epContent.replace(
  /            \{\/\* Advance Payment View \*\/\}\s*\{activeTab === 'finance' && \(/,
  `                     )}
                     
                     {requestsSubTab === 'finance' && (`
);

// Fix the end of 'finance' view to close the `requests_group` parent divs
epContent = epContent.replace(
  /               <\/div>\s*\)\}\s*\{\/\* Settings View \*\/\}/,
  `                  </div>
               </div>
            )}
            
            {/* Settings View */}`
);

// Wait, the old `leave` block was:
// {activeTab === 'leave' && (
//   <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
//      ...
//   </div>
// )}
// Let's just use regex to clean up `activeTab === 'leave' && (`
epContent = epContent.replace(
  /            \{activeTab === 'leave' && \(\s*<div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">\s*<div className="p-4 md:p-6 border-b border-slate-200">/,
  `                           <div className="mb-4">`
);

// We need to also clean up the header of leave and finance.
// Let's just create a new script to do it cleaner because regex might mess up the nested divs.

fs.writeFileSync('src/components/EmployeePortal.jsx', epContent, 'utf8');
console.log("Applied first pass. Verifying...");
