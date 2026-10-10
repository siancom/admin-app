const fs = require('fs');

let content = fs.readFileSync('src/components/EmployeePortal.jsx', 'utf8');

const regexDays = /const days = Array\.from\(\{[^\}]+\}, \(_, i\) => \{([\s\S]*?)return \(\s*<div key=\{day\}([\s\S]*?)<\/div>\s*\);\s*\}\);/g;

const newBlock = `const days = Array.from({length: daysInMonth}, (_, i) => {
                                    const day = i + 1;
                                    const dateObj = new Date(year, month, day);
                                    const dayOfWeek = dateObj.getDay();
                                    const dateStr = \`\${year}-\${String(month+1).padStart(2,'0')}-\${String(day).padStart(2,'0')}\`;
                                    
                                    const isWeeklyOff = employee.weeklyDaysOff?.includes(dayOfWeek);
                                    const customLeave = myLeaves.find(l => l.startDate <= dateStr && l.endDate >= dateStr);
                                    
                                    let bgColor = 'bg-slate-50 border-slate-100';
                                    let textColor = 'text-slate-700';
                                    let label = '';
                                    
                                    if (isWeeklyOff) {
                                        bgColor = 'bg-red-50 border-red-100';
                                        textColor = 'text-red-600';
                                        label = 'หยุด';
                                    } else if (customLeave) {
                                        if (customLeave.status === 'รออนุมัติ') {
                                            bgColor = 'bg-amber-50 border-amber-200 border-dashed';
                                            textColor = 'text-amber-600';
                                            label = 'รออนุมัติ';
                                        } else if (customLeave.status === 'ไม่อนุมัติ') {
                                            bgColor = 'bg-slate-50 border-slate-200';
                                            textColor = 'text-slate-400';
                                            label = 'ทำงาน';
                                        } else {
                                            bgColor = 'bg-orange-50 border-orange-100';
                                            textColor = 'text-orange-600';
                                            label = customLeave.leaveType;
                                        }
                                    }
                                    
                                    const handleClick = async () => {
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
                                    };

                                    const isSelectedStart = calendarSelection?.start === dateStr;
                                    const isSelectedEnd = calendarSelection?.end === dateStr;
                                    const isBetween = calendarSelection?.start && calendarSelection?.end && dateStr > calendarSelection.start && dateStr < calendarSelection.end;

                                    if (isSelectedStart || isSelectedEnd) {
                                        bgColor = 'bg-indigo-500 border-indigo-600 shadow-md';
                                        textColor = 'text-white';
                                        label = isSelectedStart && !calendarSelection?.end ? 'เริ่มต้น' : 'เลือกแล้ว';
                                    } else if (isBetween) {
                                        bgColor = 'bg-indigo-100 border-indigo-200';
                                        textColor = 'text-indigo-700';
                                    }

                                    const isSelected = isSelectedStart || isSelectedEnd || isBetween;

                                    return (
                                      <div key={day} onClick={handleClick} className={\`p-1 md:p-3 rounded-xl md:rounded-2xl border flex flex-col items-center justify-center gap-1 transition-transform active:scale-95 \${bgColor} cursor-pointer hover:shadow-md\`}>
                                         <span className={\`font-bold text-sm md:text-lg \${textColor}\`}>{day}</span>
                                         {label && <span className={\`text-[8px] md:text-[10px] font-bold px-1 py-0.5 rounded-md \${isSelected ? 'bg-indigo-700/50 text-white' : 'bg-white/50 ' + textColor} truncate max-w-full\`}>{label}</span>}
                                      </div>
                                    );
                                 });`;

if (content.match(regexDays)) {
    content = content.replace(regexDays, newBlock);
    console.log("Replaced days block.");
}

const oldEnd = `                           </div>
                        </div>
                     )}
                  </div>
               </div>
            )}
         </div>
      </div>
      
      {/* Modals */}`;

const newEnd = `                           </div>
                            {calendarSelection && (
                                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between bg-indigo-50 border border-indigo-100 p-4 rounded-2xl animate-in fade-in slide-in-from-bottom-2">
                                    <div className="text-indigo-800 font-bold mb-2 sm:mb-0">
                                        {calendarSelection.end 
                                            ? \`เลือกช่วงเวลา: \${new Date(calendarSelection.start).toLocaleDateString('th-TH')} ถึง \${new Date(calendarSelection.end).toLocaleDateString('th-TH')}\`
                                            : \`เลือกวันที่: \${new Date(calendarSelection.start).toLocaleDateString('th-TH')} (กดอีกวันเพื่อเลือกเป็นช่วง)\`
                                        }
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button 
                                          onClick={() => setCalendarSelection(null)}
                                          className="flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 font-bold rounded-xl border border-slate-200 transition-colors"
                                        >
                                          ยกเลิก
                                        </button>
                                        <button 
                                          onClick={() => {
                                              setActiveTab('requests_group');
                                              setRequestsSubTab('leave');
                                              setCalendarSelection(null);
                                          }}
                                          className="flex-1 sm:flex-none px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                                        >
                                          ดำเนินการแจ้งลา <CheckCircle size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                     )}
                  </div>
               </div>
            )}
         </div>
      </div>
      
      {/* Modals */}`;

if (content.includes(oldEnd)) {
    content = content.replace(oldEnd, newEnd);
    console.log("Replaced UI end.");
}

fs.writeFileSync('src/components/EmployeePortal.jsx', content, 'utf8');
