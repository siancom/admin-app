const fs = require('fs');

let content = fs.readFileSync('src/components/EmployeePortal.jsx', 'utf8');

const startStr = '                                    const handleClick = async () => {';
const endStr = '                                    };';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
    const oldBlock = content.slice(startIndex, endIndex + endStr.length);
    
    const newBlock = `                                    const handleClick = async () => {
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

                                        if (!calendarSelection || calendarSelection.end) {
                                            setCalendarSelection({ start: dateStr, end: null });
                                            if (isWeeklyOff) {
                                                setLeaveForm({ ...leaveForm, leaveType: 'สลับวันหยุด', startDate: dateStr, endDate: dateStr });
                                            } else {
                                                setLeaveForm({ ...leaveForm, startDate: dateStr, endDate: dateStr });
                                            }
                                        } else {
                                            let start = calendarSelection.start;
                                            let end = dateStr;
                                            if (new Date(start) > new Date(end)) {
                                                start = dateStr;
                                                end = calendarSelection.start;
                                            }
                                            setCalendarSelection({ start, end });
                                            setLeaveForm({ ...leaveForm, startDate: start, endDate: end });
                                            
                                            // Delay slightly to show the highlight, then jump
                                            setTimeout(() => {
                                                setCalendarSelection(null);
                                                setActiveTab('requests_group');
                                                setRequestsSubTab('leave');
                                            }, 400);
                                        }
                                    };`;
                                    
    content = content.replace(oldBlock, newBlock);
    console.log("Replaced handleClick using index matching.");
} else {
    console.log("Could not find start/end bounds.");
}

const btnRegex = /\{calendarSelection && \(\s*<div className="mt-4 flex flex-col[\s\S]*?<\/div>\s*\)\}/;
if (content.match(btnRegex)) {
    content = content.replace(btnRegex, '');
    console.log("Removed button.");
}

fs.writeFileSync('src/components/EmployeePortal.jsx', content, 'utf8');
