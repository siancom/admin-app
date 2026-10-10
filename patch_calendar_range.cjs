const fs = require('fs');
let content = fs.readFileSync('src/components/EmployeePortal.jsx', 'utf8');

// 1. Add calendarSelection state
const stateMatch = `  const [scheduleMonth, setScheduleMonth] = useState(new Date().toISOString().substring(0, 7));`;
const stateReplace = `  const [scheduleMonth, setScheduleMonth] = useState(new Date().toISOString().substring(0, 7));
  const [calendarSelection, setCalendarSelection] = useState(null);`;
if (content.includes(stateMatch) && !content.includes('const [calendarSelection, setCalendarSelection] = useState(null);')) {
    content = content.replace(stateMatch, stateReplace);
}

// 2. Add 'สลับวันหยุด' to the dropdown
const optionMatch = `<option value="ลากิจ">ลากิจ</option>
                               <option value="ลาพักร้อน">ลาพักร้อน</option>`;
const optionReplace = `<option value="ลากิจ">ลากิจ</option>
                               <option value="ลาพักร้อน">ลาพักร้อน</option>
                               <option value="สลับวันหยุด">สลับวันหยุด</option>`;
if (content.includes(optionMatch)) {
    content = content.replace(optionMatch, optionReplace);
}

// 3. Update the Calendar Day rendering
const calMatch = `                                     const handleClick = async () => {
                                        if (isWeeklyOff) return;
                                        if (customLeave) {
                                            if (window.confirm(\`คุณต้องการยกเลิกคำขอ\${customLeave.leaveType}ในวันที่ \${new Date(customLeave.startDate).toLocaleDateString('th-TH')} ถึง \${new Date(customLeave.endDate).toLocaleDateString('th-TH')} ใช่หรือไม่?\`)) {
                                                try {
                                                    await deleteDoc(doc(db, 'employee_leaves', customLeave.id));
                                                    alert('ยกเลิกการลาเรียบร้อยแล้ว');
                                                } catch (err) {
                                                    alert('เกิดข้อผิดพลาดในการยกเลิก: ' + err.message);
                                                }
                                            }
                                        } else {
                                            setLeaveForm({ ...leaveForm, startDate: dateStr, endDate: dateStr });
                                            setActiveTab('requests_group');
                                            setRequestsSubTab('leave');
                                        }
                                     };

                                     return (
                                      <div key={day} onClick={handleClick} className={\`p-1 md:p-3 rounded-xl md:rounded-2xl border flex flex-col items-center justify-center gap-1 transition-transform active:scale-95 \${bgColor} \${!isWeeklyOff ? 'cursor-pointer hover:shadow-md' : 'opacity-70'}\`}>
                                         <span className={\`font-bold text-sm md:text-lg \${textColor}\`}>{day}</span>
                                         {label && <span className={\`text-[8px] md:text-[10px] font-bold px-1 py-0.5 rounded-md bg-white/50 truncate max-w-full \${textColor}\`}>{label}</span>}
                                      </div>
                                     );`;

const calReplace = `                                     const handleClick = async () => {
                                        if (customLeave) {
                                            if (window.confirm(\`คุณต้องการยกเลิกคำขอ\${customLeave.leaveType}ในวันที่ \${new Date(customLeave.startDate).toLocaleDateString('th-TH')} ถึง \${new Date(customLeave.endDate).toLocaleDateString('th-TH')} ใช่หรือไม่?\`)) {
                                                try {
                                                    await deleteDoc(doc(db, 'employee_leaves', customLeave.id));
                                                    alert('ยกเลิกการลาเรียบร้อยแล้ว');
                                                } catch (err) {
                                                    alert('เกิดข้อผิดพลาดในการยกเลิก: ' + err.message);
                                                }
                                            }
                                            return;
                                        }

                                        if (!calendarSelection) {
                                            setCalendarSelection(dateStr);
                                            // If they click a weekly off day, pre-select "สลับวันหยุด"
                                            if (isWeeklyOff) {
                                                setLeaveForm({ ...leaveForm, leaveType: 'สลับวันหยุด', startDate: dateStr, endDate: dateStr });
                                            } else {
                                                setLeaveForm({ ...leaveForm, startDate: dateStr, endDate: dateStr });
                                            }
                                        } else {
                                            // Second click
                                            let start = calendarSelection;
                                            let end = dateStr;
                                            if (new Date(start) > new Date(end)) {
                                                start = dateStr;
                                                end = calendarSelection;
                                            }
                                            
                                            setLeaveForm({ ...leaveForm, startDate: start, endDate: end });
                                            setCalendarSelection(null);
                                            setActiveTab('requests_group');
                                            setRequestsSubTab('leave');
                                        }
                                     };

                                     const isSelectedStart = calendarSelection === dateStr;
                                     if (isSelectedStart) {
                                         bgColor = 'bg-indigo-500 border-indigo-600 shadow-md';
                                         textColor = 'text-white';
                                         label = 'เริ่มต้น';
                                     }

                                     return (
                                      <div key={day} onClick={handleClick} className={\`p-1 md:p-3 rounded-xl md:rounded-2xl border flex flex-col items-center justify-center gap-1 transition-transform active:scale-95 \${bgColor} cursor-pointer hover:shadow-md\`}>
                                         <span className={\`font-bold text-sm md:text-lg \${textColor}\`}>{day}</span>
                                         {label && <span className={\`text-[8px] md:text-[10px] font-bold px-1 py-0.5 rounded-md \${isSelectedStart ? 'bg-indigo-700/50 text-white' : 'bg-white/50 ' + textColor} truncate max-w-full\`}>{label}</span>}
                                      </div>
                                     );`;

if (content.includes(calMatch)) {
    content = content.replace(calMatch, calReplace);
    fs.writeFileSync('src/components/EmployeePortal.jsx', content, 'utf8');
    console.log("Calendar patch successful.");
} else {
    console.log("Could not find calendar match. Writing to debug log...");
}
