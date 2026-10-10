const fs = require('fs');

let epContent = fs.readFileSync('src/components/EmployeePortal.jsx', 'utf8');

const newScheduleView = `                     {scheduleSubTab === 'schedule' && (
                        <div className="space-y-4 flex flex-col h-full">
                           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                              <h3 className="text-lg md:text-xl font-black text-slate-800 flex items-center gap-2"><Calendar className="text-indigo-500" /> ตารางงานของฉัน</h3>
                              <input 
                                type="month" 
                                value={scheduleMonth} 
                                onChange={e => setScheduleMonth(e.target.value)}
                                className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto text-slate-600"
                              />
                           </div>
                           
                           <div className="grid grid-cols-7 gap-1 md:gap-2">
                              {['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map(d => (
                                 <div key={d} className="text-center font-bold text-slate-500 text-xs md:text-sm py-2">{d}</div>
                              ))}
                              
                              {(() => {
                                 const year = parseInt(scheduleMonth.split('-')[0]);
                                 const month = parseInt(scheduleMonth.split('-')[1]) - 1;
                                 const daysInMonth = new Date(year, month + 1, 0).getDate();
                                 const firstDayOfWeek = new Date(year, month, 1).getDay();
                                 
                                 const blanks = Array.from({length: firstDayOfWeek}, (_, i) => <div key={\`blank-\${i}\`} className="p-1 md:p-2"></div>);
                                 
                                 const days = Array.from({length: daysInMonth}, (_, i) => {
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
                                    
                                    return (
                                      <div key={day} className={\`p-1 md:p-3 rounded-xl md:rounded-2xl border flex flex-col items-center justify-center gap-1 \${bgColor}\`}>
                                         <span className={\`font-bold text-sm md:text-lg \${textColor}\`}>{day}</span>
                                         {label && <span className={\`text-[8px] md:text-[10px] font-bold px-1 py-0.5 rounded-md bg-white/50 truncate max-w-full \${textColor}\`}>{label}</span>}
                                      </div>
                                    );
                                 });
                                 
                                 return [...blanks, ...days];
                              })()}
                           </div>
                        </div>
                     )}`;

// Replace the placeholder schedule subtab
epContent = epContent.replace(/                     \{scheduleSubTab === 'schedule' && \([\s\S]*?                     \}\)/, newScheduleView);

// Now, remove the Old Schedule View
epContent = epContent.replace(/            \{\/\* Old Schedule View \*\/\}[\s\S]*?            \)\}\n/, '');

fs.writeFileSync('src/components/EmployeePortal.jsx', epContent, 'utf8');
console.log("Restored schedule view successfully.");
