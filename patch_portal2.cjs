const fs = require('fs');
let content = fs.readFileSync('src/components/EmployeePortal.jsx', 'utf8');

// 1. Update handleSaveLeave to loop over leaveForm.dates
const saveLeaveRegex = /  const handleSaveLeave = async \(e\) => \{[\s\S]*?setIsSubmittingLeave\(false\);\n  \};/;

const newSaveLeave = `  const handleSaveLeave = async (e) => {
    e.preventDefault();
    if (!leaveForm.dates || leaveForm.dates.length === 0) {
        alert('กรุณาเลือกวันที่ต้องการลาบนปฏิทินก่อนครับ');
        return;
    }
    setIsSubmittingLeave(true);
    try {
        const batchPromises = leaveForm.dates.map(dateStr => {
            const data = {
               employeeId: employee.id,
               employeeName: employee.name,
               leaveType: leaveForm.leaveType,
               startDate: dateStr,
               endDate: dateStr,
               reason: leaveForm.reason,
               status: 'รออนุมัติ',
               createdAt: new Date().toISOString(),
               updatedAt: new Date().toISOString()
            };
            return addDoc(getCol('employee_leaves'), data);
        });
        
        await Promise.all(batchPromises);
        
        alert('ส่งคำขอลาสำเร็จ กรุณารอผู้จัดการอนุมัติ');
        setLeaveForm({ leaveType: 'ลาป่วย', startDate: '', endDate: '', reason: '', dates: [] });
        setCalendarSelection([]);
        setActiveTab('dashboard');
    } catch(err) {
        alert('เกิดข้อผิดพลาด: ' + err.message);
    }
    setIsSubmittingLeave(false);
  };`;

if (content.match(saveLeaveRegex)) {
    content = content.replace(saveLeaveRegex, newSaveLeave);
    console.log("Updated handleSaveLeave to support multiple dates.");
}

// 2. Update the Leave form UI to use leaveForm.dates instead of startDate/endDate inputs
// Find the div containing the startDate and endDate inputs
const leaveInputsRegex = /<div className="grid grid-cols-2 gap-3 mt-4">[\s\S]*?<\/div>\s*<\/div>/;

const newLeaveInputs = `<div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                                        <label className="block text-xs font-bold text-indigo-800 mb-2">วันที่เลือก ({leaveForm.dates?.length || 0} วัน):</label>
                                        <div className="flex flex-wrap gap-2">
                                            {leaveForm.dates && leaveForm.dates.length > 0 ? (
                                                leaveForm.dates.map(d => (
                                                    <span key={d} className="px-3 py-1 bg-white text-indigo-700 rounded-lg text-sm font-bold shadow-sm border border-indigo-200">
                                                        {new Date(d).toLocaleDateString('th-TH')}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-sm text-slate-500 font-bold">ยังไม่ได้เลือกวัน (กรุณากลับไปเลือกที่ปฏิทิน)</span>
                                            )}
                                        </div>
                                     </div>`;

if (content.match(leaveInputsRegex)) {
    content = content.replace(leaveInputsRegex, newLeaveInputs);
    console.log("Updated leave form inputs.");
}

// 3. Add handleSaveSupplies
const saveAdvanceRegex = /  const handleSaveAdvance = async \(e\) => \{[\s\S]*?setIsSubmittingAdvance\(false\);\n  \};/;

const addSaveSupplies = `
  const [isSubmittingSupplies, setIsSubmittingSupplies] = useState(false);
  
  const handleSaveSupplies = async (e) => {
    e.preventDefault();
    if (!suppliesForm.itemName || !suppliesForm.quantity) {
        alert('กรุณาระบุชื่อของใช้และจำนวน');
        return;
    }
    setIsSubmittingSupplies(true);
    try {
        const data = {
           employeeId: employee.id,
           employeeName: employee.name,
           itemName: suppliesForm.itemName,
           quantity: suppliesForm.quantity,
           reason: suppliesForm.reason,
           status: 'รออนุมัติ',
           createdAt: new Date().toISOString(),
           updatedAt: new Date().toISOString()
        };
        await addDoc(getCol('employee_requisitions'), data);
        alert('ส่งคำขอเบิกของใช้สำเร็จ กรุณารอผู้จัดการอนุมัติ');
        setSuppliesForm({ itemName: '', quantity: '', reason: '' });
    } catch(err) {
        alert('เกิดข้อผิดพลาด: ' + err.message);
    }
    setIsSubmittingSupplies(false);
  };
`;

if (content.match(saveAdvanceRegex)) {
    const matchedStr = content.match(saveAdvanceRegex)[0];
    content = content.replace(saveAdvanceRegex, matchedStr + addSaveSupplies);
    console.log("Added handleSaveSupplies logic.");
}

// 4. Add 'supplies' tab in requests_group UI
const tabsRegex = /<button onClick=\{\(\) => setRequestsSubTab\('finance'\)\} className=\{`flex-1 py-4 font-bold text-sm transition-colors \$\{requestsSubTab === 'finance' \? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-100'\}`\}>เบิกเงินล่วงหน้า<\/button>/;

const newTabs = `<button onClick={() => setRequestsSubTab('finance')} className={\`flex-1 py-4 font-bold text-sm transition-colors \${requestsSubTab === 'finance' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-100'}\`}>เบิกเงินล่วงหน้า</button>
                     <button onClick={() => setRequestsSubTab('supplies')} className={\`flex-1 py-4 font-bold text-sm transition-colors \${requestsSubTab === 'supplies' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-100'}\`}>เบิกของใช้</button>`;

if (content.match(tabsRegex)) {
    content = content.replace(tabsRegex, newTabs);
    console.log("Added supplies tab button.");
}

// 5. Add the 'supplies' UI panel below the 'finance' one
const financePanelRegex = /\{requestsSubTab === 'finance' && \([\s\S]*?\}\s*<\/div>\s*<\/div>\s*\)\}/;

const suppliesPanel = `
                     {requestsSubTab === 'supplies' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 md:p-6">
                           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-fit">
                              <h3 className="text-lg md:text-xl font-black text-slate-800 mb-2 flex items-center gap-2"><ShoppingCart className="text-indigo-500" /> ขอเบิกของใช้ในร้าน</h3>
                              <p className="text-sm text-slate-500 font-bold mb-6">ระบุของใช้ที่ต้องการเบิกเพื่อใช้ในงาน</p>
                              <form onSubmit={handleSaveSupplies} className="space-y-4">
                                 <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">ชื่อของใช้</label>
                                    <input required type="text" value={suppliesForm.itemName} onChange={e => setSuppliesForm({...suppliesForm, itemName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-indigo-500 outline-none text-slate-700" placeholder="เช่น กระดาษทิชชู่, น้ำยาทำความสะอาด..." />
                                 </div>
                                 <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">จำนวนที่ต้องการ</label>
                                    <input required type="text" value={suppliesForm.quantity} onChange={e => setSuppliesForm({...suppliesForm, quantity: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-indigo-500 outline-none text-slate-700" placeholder="เช่น 2 แพ็ค, 1 ขวด" />
                                 </div>
                                 <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">เหตุผล/หมายเหตุ (ถ้ามี)</label>
                                    <textarea rows="3" value={suppliesForm.reason} onChange={e => setSuppliesForm({...suppliesForm, reason: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-indigo-500 outline-none text-slate-700" placeholder="ระบุเหตุผลในการเบิก..."></textarea>
                                 </div>
                                 <button type="submit" disabled={isSubmittingSupplies} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/30 transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50">
                                    <Send size={18} /> ส่งคำขอเบิกของ
                                 </button>
                              </form>
                           </div>
                           
                           <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-full">
                              <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><Clock className="text-slate-500" /> ประวัติการเบิกของใช้</h3>
                              <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2">
                                 {myRequisitions.length === 0 ? (
                                    <div className="text-center text-slate-500 text-sm font-bold mt-10">ยังไม่มีประวัติการเบิกของใช้</div>
                                 ) : myRequisitions.map(req => (
                                    <div key={req.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                       <div className="flex justify-between items-start mb-2">
                                          <div>
                                             <div className="font-bold text-slate-800">{req.itemName}</div>
                                             <div className="text-xs text-slate-500">{new Date(req.createdAt).toLocaleDateString('th-TH')} - จำนวน {req.quantity}</div>
                                          </div>
                                          <span className={\`text-xs font-bold px-3 py-1 rounded-full \${
                                             req.status === 'อนุมัติแล้ว' ? 'bg-emerald-100 text-emerald-700' :
                                             req.status === 'ไม่อนุมัติ' ? 'bg-red-100 text-red-700' :
                                             'bg-amber-100 text-amber-700'
                                          }\`}>{req.status}</span>
                                       </div>
                                       {req.reason && <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">เหตุผล: {req.reason}</p>}
                                       {req.status === 'ไม่อนุมัติ' && req.note && (
                                          <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded-lg border border-red-100">หมายเหตุ: {req.note}</p>
                                       )}
                                    </div>
                                 ))}
                              </div>
                           </div>
                        </div>
                     )}`;

if (content.match(financePanelRegex)) {
    const matchedStr = content.match(financePanelRegex)[0];
    content = content.replace(financePanelRegex, matchedStr + suppliesPanel);
    console.log("Added supplies UI panel.");
}

fs.writeFileSync('src/components/EmployeePortal.jsx', content, 'utf8');
