const fs = require('fs');
let content = fs.readFileSync('src/components/EmployeePortal.jsx', 'utf8');

// 1. Update the handleClick to jump directly with a delay
const handleMatch = `                                     const handleClick = async () => {
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
                                        }
                                     };`;

const handleReplace = `                                     const handleClick = async () => {
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

if (content.includes(handleMatch)) {
    content = content.replace(handleMatch, handleReplace);
    console.log("Updated handleClick for direct jump.");
} else {
    console.log("Could not find handleClick block.");
}

// 2. Remove the confirm button
const buttonRegex = /                           \}\)\(\)\}\s*<\/div>\s*\{calendarSelection && \([\s\S]*?\}\s*<\/div>\s*\)\}\s*<\/div>\s*\)\}\s*<\/div>\s*<\/div>\s*\)\}\s*<\/div>\s*<\/div>\s*\{\/\* Modals \*\/\}/;

const buttonReplace = `                           })()}
                            </div>
                        </div>
                     )}
                  </div>
               </div>
            )}
         </div>
      </div>
      
      {/* Modals */}`;

if (content.match(buttonRegex)) {
    content = content.replace(buttonRegex, buttonReplace);
    console.log("Removed confirm button block.");
} else {
    // simpler match
    const simpleBtnRegex = /\{calendarSelection && \(\s*<div className="mt-4 flex flex-col[\s\S]*?<\/div>\s*\)\}/;
    if (content.match(simpleBtnRegex)) {
        content = content.replace(simpleBtnRegex, '');
        console.log("Removed confirm button block via simple regex.");
    }
}

fs.writeFileSync('src/components/EmployeePortal.jsx', content, 'utf8');
