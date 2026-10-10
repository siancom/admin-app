const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Add state variable
const stateRegex = /const \[activeTab, setActiveTab\] = useState\('dashboard'\);/;
const stateNew = `const [activeTab, setActiveTab] = useState('dashboard');
  const [staffDashboardTab, setStaffDashboardTab] = useState('used_course');`;
if (content.match(stateRegex)) {
    content = content.replace(stateRegex, stateNew);
    console.log("Added staffDashboardTab state.");
}

// 2. Prepare Staff Dashboard UI block
// This block will be rendered when activeTab === 'dashboard' && globalRole === 'staff'
const staffDashboardHtml = `
          {/* STAFF DASHBOARD */}
          {activeTab === 'dashboard' && globalRole !== 'owner' && (
            <div className="flex flex-col h-full animate-in fade-in max-w-5xl mx-auto w-full px-2 sm:px-0">
               <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <div>
                   <h1 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                     <span className="bg-indigo-600 text-white p-2 sm:p-2.5 rounded-2xl shadow-lg shadow-indigo-200">
                       <Clock size={24} />
                     </span>
                     ประวัติการให้บริการวันนี้
                   </h1>
                   <p className="text-sm text-gray-500 mt-1">สรุปรายการและผลงานของสาขา {globalBranch || 'ทั้งหมด'} ประจำวันที่ {new Date().toLocaleDateString('th-TH')}</p>
                 </div>
                 
                 <div className="flex gap-2">
                    <button onClick={() => setShowFrontAttendance(true)} className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-sm transition-colors active:scale-95 shadow-sm border border-indigo-100">
                      <Clock size={16} /> ลงเวลา
                    </button>
                    <button onClick={() => { localStorage.removeItem('selectedBranch'); localStorage.removeItem('userRole'); setGlobalBranch(null); setGlobalRole('staff'); }} className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-sm font-bold transition-colors border border-rose-100 active:scale-95">
                      <LogOut size={16} /> <span className="hidden sm:inline">เปลี่ยนสาขา</span>
                    </button>
                 </div>
               </div>
               
               {/* Staff Tabs */}
               <div className="flex bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6 flex-wrap">
                  <button onClick={() => setStaffDashboardTab('used_course')} className={\`flex-1 min-w-[120px] py-4 font-bold text-sm transition-colors flex items-center justify-center gap-2 \${staffDashboardTab === 'used_course' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-gray-500 hover:bg-gray-50'}\`}>
                     <CheckCircle size={16} /> ใช้คอร์ส / รับบริการ
                  </button>
                  <button onClick={() => setStaffDashboardTab('new_sale')} className={\`flex-1 min-w-[120px] py-4 font-bold text-sm transition-colors flex items-center justify-center gap-2 \${staffDashboardTab === 'new_sale' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-gray-500 hover:bg-gray-50'}\`}>
                     <ShoppingCart size={16} /> ขายคอร์ส / สินค้า
                  </button>
                  <button onClick={() => setStaffDashboardTab('service_log')} className={\`flex-1 min-w-[120px] py-4 font-bold text-sm transition-colors flex items-center justify-center gap-2 \${staffDashboardTab === 'service_log' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-gray-500 hover:bg-gray-50'}\`}>
                     <Wallet size={16} /> บันทึกค่ามือ
                  </button>
               </div>
               
               <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
                  <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
                     <table className="w-full text-left text-sm whitespace-nowrap">
                       <thead className="bg-gray-50 text-gray-500 font-bold sticky top-0 z-10 shadow-sm">
                         <tr>
                           <th className="px-4 sm:px-6 py-4">เวลา</th>
                           <th className="px-4 sm:px-6 py-4">ลูกค้า</th>
                           <th className="px-4 sm:px-6 py-4">รายการ</th>
                           <th className="px-4 sm:px-6 py-4">ผู้ให้บริการ</th>
                           <th className="px-4 sm:px-6 py-4 text-right">จำนวน/ยอด</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                          {(() => {
                             const todayDateStr = new Date().toLocaleDateString('th-TH');
                             const todayIsoStr = new Date().toISOString().split('T')[0];
                             
                             let rows = [];
                             
                             if (staffDashboardTab === 'used_course') {
                                rows = histories.filter(h => h['วันที่'] === todayDateStr && (!globalBranch || h['สาขา'] === globalBranch) && (h['ประเภท'] === 'รับบริการ' || h['ประเภท'] === 'เบิกใช้เครดิต'));
                                if (rows.length === 0) return <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400 font-bold">ไม่มีประวัติการใช้คอร์สในวันนี้</td></tr>;
                                return rows.map((r, i) => (
                                   <tr key={i} className="hover:bg-gray-50">
                                      <td className="px-4 sm:px-6 py-4 text-gray-500 font-bold">{r['เวลา'] || '-'}</td>
                                      <td className="px-4 sm:px-6 py-4 font-bold text-gray-800">{r['ชื่อลูกค้า']}</td>
                                      <td className="px-4 sm:px-6 py-4">
                                         <div className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded inline-block text-xs mb-1">{r['ประเภท']}</div>
                                         <div className="text-gray-700">{r['รายการ']}</div>
                                      </td>
                                      <td className="px-4 sm:px-6 py-4 text-gray-600">{r['พนักงาน'] || '-'}</td>
                                      <td className="px-4 sm:px-6 py-4 text-right font-black text-gray-800">{r['จำนวน'] ? \`\${r['จำนวน']} ครั้ง/ชิ้น\` : '-'}</td>
                                   </tr>
                                ));
                             } 
                             else if (staffDashboardTab === 'new_sale') {
                                rows = histories.filter(h => h['วันที่'] === todayDateStr && (!globalBranch || h['สาขา'] === globalBranch) && h['ประเภท'] && h['ประเภท'].includes('ซื้อ'));
                                if (rows.length === 0) return <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400 font-bold">ไม่มีประวัติการขายในวันนี้</td></tr>;
                                return rows.map((r, i) => (
                                   <tr key={i} className="hover:bg-gray-50">
                                      <td className="px-4 sm:px-6 py-4 text-gray-500 font-bold">{r['เวลา'] || '-'}</td>
                                      <td className="px-4 sm:px-6 py-4 font-bold text-gray-800">{r['ชื่อลูกค้า']}</td>
                                      <td className="px-4 sm:px-6 py-4">
                                         <div className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded inline-block text-xs mb-1">{r['ประเภท']}</div>
                                         <div className="text-gray-700 max-w-[200px] truncate">{r['รายการ']}</div>
                                      </td>
                                      <td className="px-4 sm:px-6 py-4 text-gray-600">{r['พนักงาน'] || '-'}</td>
                                      <td className="px-4 sm:px-6 py-4 text-right font-black text-emerald-600">฿{Number(r['จำนวนเงิน'] || r['ยอดรวม'] || r['ราคา'] || 0).toLocaleString()}</td>
                                   </tr>
                                ));
                             }
                             else if (staffDashboardTab === 'service_log') {
                                rows = serviceLogs.filter(s => s.date === todayIsoStr && (!globalBranch || s.branch === globalBranch));
                                if (rows.length === 0) return <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400 font-bold">ไม่มีการบันทึกค่ามือในวันนี้</td></tr>;
                                return rows.map((r, i) => (
                                   <tr key={r.id || i} className="hover:bg-gray-50">
                                      <td className="px-4 sm:px-6 py-4 text-gray-500 font-bold">{new Date(r.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</td>
                                      <td className="px-4 sm:px-6 py-4 font-bold text-gray-800">-</td>
                                      <td className="px-4 sm:px-6 py-4">
                                         <div className="font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded inline-block text-xs mb-1">{r.type}</div>
                                         {r.note && <div className="text-gray-500 text-xs mt-1">{r.note}</div>}
                                      </td>
                                      <td className="px-4 sm:px-6 py-4 font-bold text-gray-700">{r.employeeName}</td>
                                      <td className="px-4 sm:px-6 py-4 text-right font-black text-orange-600">฿{Number(r.amount || 0).toLocaleString()}</td>
                                   </tr>
                                ));
                             }
                          })()}
                       </tbody>
                     </table>
                  </div>
               </div>
            </div>
          )}
`;

// 3. Find activeTab === 'dashboard' and add globalRole === 'owner' constraint
const ownerDashboardRegex = /\{activeTab === 'dashboard' && \(/;
if (content.match(ownerDashboardRegex)) {
    content = content.replace(ownerDashboardRegex, staffDashboardHtml + "\n          {activeTab === 'dashboard' && globalRole === 'owner' && (");
    console.log("Added Staff Dashboard UI and modified Owner Dashboard constraint.");
}

fs.writeFileSync('src/App.jsx', content, 'utf8');
