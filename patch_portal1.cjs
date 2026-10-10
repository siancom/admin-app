const fs = require('fs');

let content = fs.readFileSync('src/components/EmployeePortal.jsx', 'utf8');

// 1. Change useState(null) to useState([])
const stateOld = 'const [calendarSelection, setCalendarSelection] = useState(null);';
const stateNew = 'const [calendarSelection, setCalendarSelection] = useState([]);';
if (content.includes(stateOld)) {
    content = content.replace(stateOld, stateNew);
    console.log("Updated state to array.");
}

// 2. Add 'supplies' and 'suppliesForm' to state
const formsOld = `  const [leaveForm, setLeaveForm] = useState({ leaveType: 'ลาป่วย', startDate: '', endDate: '', reason: '' });
  const [advanceForm, setAdvanceForm] = useState({ amount: '', reason: '' });`;
const formsNew = `  const [leaveForm, setLeaveForm] = useState({ leaveType: 'ลาป่วย', startDate: '', endDate: '', reason: '', dates: [] });
  const [advanceForm, setAdvanceForm] = useState({ amount: '', reason: '' });
  const [suppliesForm, setSuppliesForm] = useState({ itemName: '', quantity: '', reason: '' });`;
if (content.includes(formsOld)) {
    content = content.replace(formsOld, formsNew);
    console.log("Added suppliesForm to state.");
}

// Add mySupplies to props or just fetch it... Wait, EmployeePortal doesn't have supplies prop.
// EmployeePortal signature:
const sigOld = `  advancePayments = [],
  histories = [],`;
const sigNew = `  advancePayments = [],
  requisitions = [],
  histories = [],`;
if (content.includes(sigOld)) {
    content = content.replace(sigOld, sigNew);
    console.log("Added requisitions prop.");
}

// Add myRequisitions memo
const memoOld = `  const myAdvances = useMemo(() => advancePayments.filter(a => a.employeeId === employee.id).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)), [advancePayments, employee.id]);`;
const memoNew = `  const myAdvances = useMemo(() => advancePayments.filter(a => a.employeeId === employee.id).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)), [advancePayments, employee.id]);
  const myRequisitions = useMemo(() => requisitions.filter(r => r.employeeId === employee.id).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)), [requisitions, employee.id]);`;
if (content.includes(memoOld)) {
    content = content.replace(memoOld, memoNew);
    console.log("Added myRequisitions memo.");
}

// 3. Update the calendar days block
const regexDays = /const days = Array\.from\(\{[^\}]+\}, \(_, i\) => \{([\s\S]*?)return \(\s*<div key=\{day\}([\s\S]*?)<\/div>\s*\);\s*\}\);/g;

const newDaysBlock = `const days = Array.from({length: daysInMonth}, (_, i) => {
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
                                            if (window.confirm(\`คุณต้องการยกเลิกคำขอ\${customLeave.leaveType}ในวันที่ \${new Date(customLeave.startDate).toLocaleDateString('th-TH')} ใช่หรือไม่?\`)) {
                                                try {
                                                    await deleteDoc(doc(db, 'employee_leaves', customLeave.id));
                                                    alert('ยกเลิกการลาเรียบร้อยแล้ว');
                                                } catch (err) {
                                                    alert('เกิดข้อผิดพลาดในการยกเลิก: ' + err.message);
                                                }
                                            }
                                            return;
                                        }

                                        let newSelection = [...(calendarSelection || [])];
                                        if (newSelection.includes(dateStr)) {
                                            newSelection = newSelection.filter(d => d !== dateStr);
                                        } else {
                                            newSelection.push(dateStr);
                                            newSelection.sort();
                                        }
                                        setCalendarSelection(newSelection);
                                    };

                                    const isSelected = calendarSelection && calendarSelection.includes(dateStr);

                                    if (isSelected) {
                                        bgColor = 'bg-indigo-500 border-indigo-600 shadow-md scale-105';
                                        textColor = 'text-white';
                                        label = 'เลือกแล้ว';
                                    }

                                    return (
                                      <div key={day} onClick={handleClick} className={\`p-1 md:p-3 rounded-xl md:rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all active:scale-95 \${bgColor} cursor-pointer hover:shadow-md\`}>
                                         <span className={\`font-bold text-sm md:text-lg \${textColor}\`}>{day}</span>
                                         {label && <span className={\`text-[8px] md:text-[10px] font-bold px-1 py-0.5 rounded-md \${isSelected ? 'bg-indigo-700/50 text-white' : 'bg-white/50 ' + textColor} truncate max-w-full\`}>{label}</span>}
                                      </div>
                                    );
                                 });`;

if (content.match(regexDays)) {
    content = content.replace(regexDays, newDaysBlock);
    console.log("Replaced days rendering logic.");
}

// 4. Update the calendar UI confirm button block
// It was completely removed in my previous step, so I need to add it back below the `</div>` of days
const daysGridEnd = `                                 return [...blanks, ...days];
                              })()}
                           </div>`;

const newConfirmBlock = `                                 return [...blanks, ...days];
                              })()}
                           </div>
                           
                           {calendarSelection && calendarSelection.length > 0 && (
                                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between bg-indigo-50 border border-indigo-100 p-4 rounded-2xl animate-in fade-in slide-in-from-bottom-2">
                                    <div className="text-indigo-800 font-bold mb-2 sm:mb-0">
                                        เลือกทั้งหมด: {calendarSelection.length} วัน
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button 
                                          onClick={() => setCalendarSelection([])}
                                          className="flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 font-bold rounded-xl border border-slate-200 transition-colors"
                                        >
                                          ล้าง
                                        </button>
                                        <button 
                                          onClick={() => {
                                              setLeaveForm({ ...leaveForm, dates: [...calendarSelection] });
                                              setActiveTab('requests_group');
                                              setRequestsSubTab('leave');
                                          }}
                                          className="flex-1 sm:flex-none px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                                        >
                                          ดำเนินการแจ้งลา <Send size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}`;

if (content.includes(daysGridEnd)) {
    content = content.replace(daysGridEnd, newConfirmBlock);
    console.log("Added confirm button below calendar.");
}

fs.writeFileSync('src/components/EmployeePortal.jsx', content, 'utf8');
