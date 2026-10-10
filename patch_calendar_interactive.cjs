const fs = require('fs');

let epContent = fs.readFileSync('src/components/EmployeePortal.jsx', 'utf8');

// Add deleteDoc if missing
if (epContent.includes("import { addDoc, updateDoc, doc } from 'firebase/firestore';")) {
    epContent = epContent.replace("import { addDoc, updateDoc, doc } from 'firebase/firestore';", "import { addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';");
} else if (epContent.includes("import { addDoc, updateDoc, doc, deleteDoc }")) {
    // Already there
}

// Now replace the Calendar rendering logic
const targetStr = `                                     return (
                                      <div key={day} className={\`p-1 md:p-3 rounded-xl md:rounded-2xl border flex flex-col items-center justify-center gap-1 \${bgColor}\`}>
                                         <span className={\`font-bold text-sm md:text-lg \${textColor}\`}>{day}</span>
                                         {label && <span className={\`text-[8px] md:text-[10px] font-bold px-1 py-0.5 rounded-md bg-white/50 truncate max-w-full \${textColor}\`}>{label}</span>}
                                      </div>
                                     );`;

const newStr = `                                     const handleClick = async () => {
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

if (epContent.includes(targetStr)) {
    epContent = epContent.replace(targetStr, newStr);
    fs.writeFileSync('src/components/EmployeePortal.jsx', epContent, 'utf8');
    console.log("Calendar interactivity patched.");
} else {
    console.log("Target string not found in EmployeePortal.jsx");
}
