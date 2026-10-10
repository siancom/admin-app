const fs = require('fs');
let content = fs.readFileSync('src/components/EmployeePortal.jsx', 'utf8');

// 1. Add replacementDate to leaveForm initial state
const formStateRegex = /const \[leaveForm, setLeaveForm\] = useState\(\{ leaveType: 'ลาป่วย', startDate: '', endDate: '', reason: '', dates: \[\] \}\);/;
const formStateNew = `const [leaveForm, setLeaveForm] = useState({ leaveType: 'ลาป่วย', startDate: '', endDate: '', reason: '', dates: [], replacementDate: '' });`;
if (content.match(formStateRegex)) {
    content = content.replace(formStateRegex, formStateNew);
    console.log("Updated leaveForm initial state.");
}

// 2. Add 'สลับวันหยุด' to the select options
const selectRegex = /<option value="อื่นๆ">อื่นๆ<\/option>/;
const selectNew = `<option value="สลับวันหยุด">สลับวันหยุด</option>\n                                       <option value="อื่นๆ">อื่นๆ</option>`;
if (content.match(selectRegex)) {
    content = content.replace(selectRegex, selectNew);
    console.log("Added สลับวันหยุด to select options.");
}

// 3. Add the Replacement Date input if leaveType === 'สลับวันหยุด'
const datesDivRegex = /<div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">[\s\S]*?<\/div>\s*<\/div>/;

const datesDivNew = `<div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
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
                                     </div>
                                     {leaveForm.leaveType === 'สลับวันหยุด' && (
                                         <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">วันที่มาทำงานชดเชย</label>
                                            <input required type="date" value={leaveForm.replacementDate} onChange={e => setLeaveForm({...leaveForm, replacementDate: e.target.value})} className="w-full bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 font-bold focus:border-amber-500 outline-none text-amber-700 text-sm" />
                                         </div>
                                     )}`;

if (content.match(datesDivRegex)) {
    content = content.replace(datesDivRegex, datesDivNew);
    console.log("Added replacement date input UI.");
}

// 4. Update handleSaveLeave to include replacementDate
const saveLeaveRegex = /const data = \{\s*employeeId: employee\.id,\s*employeeName: employee\.name,\s*leaveType: leaveForm\.leaveType,[\s\S]*?updatedAt: new Date\(\)\.toISOString\(\)\s*\};/g;

const newSaveLeave = `const finalReason = leaveForm.leaveType === 'สลับวันหยุด' 
                ? \`ขอสลับวันหยุด โดยจะมาทำงานชดเชยในวันที่ \${new Date(leaveForm.replacementDate).toLocaleDateString('th-TH')} (เหตุผล: \${leaveForm.reason})\`
                : leaveForm.reason;
                
            const data = {
               employeeId: employee.id,
               employeeName: employee.name,
               leaveType: leaveForm.leaveType,
               startDate: dateStr,
               endDate: dateStr,
               reason: finalReason,
               replacementDate: leaveForm.leaveType === 'สลับวันหยุด' ? leaveForm.replacementDate : null,
               status: 'รออนุมัติ',
               createdAt: new Date().toISOString(),
               updatedAt: new Date().toISOString()
            };`;

if (content.match(saveLeaveRegex)) {
    content = content.replace(saveLeaveRegex, newSaveLeave);
    console.log("Updated handleSaveLeave data object.");
}

// 5. Also reset replacementDate on success
const resetRegex = /setLeaveForm\(\{ leaveType: 'ลาป่วย', startDate: '', endDate: '', reason: '', dates: \[\] \}\);/;
const newReset = `setLeaveForm({ leaveType: 'ลาป่วย', startDate: '', endDate: '', reason: '', dates: [], replacementDate: '' });`;
if (content.match(resetRegex)) {
    content = content.replace(resetRegex, newReset);
    console.log("Updated setLeaveForm reset.");
}

fs.writeFileSync('src/components/EmployeePortal.jsx', content, 'utf8');
