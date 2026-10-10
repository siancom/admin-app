const fs = require('fs');

// --- Patch App.jsx ---
let appContent = fs.readFileSync('src/App.jsx', 'utf8');

appContent = appContent.replace(
  "  const [expenses, setExpenses] = useState([]);",
  "  const [expenses, setExpenses] = useState([]);\n  const [serviceLogs, setServiceLogs] = useState([]);"
);

appContent = appContent.replace(
  "    const unsub15 = onSnapshot(getCol('expenses'), (s) => { setExpenses(s.docs.map(d => ({ id: d.id, ...d.data() }))); }, errHandler);",
  "    const unsub15 = onSnapshot(getCol('expenses'), (s) => { setExpenses(s.docs.map(d => ({ id: d.id, ...d.data() }))); }, errHandler);\n    const unsub16 = onSnapshot(getCol('service_logs'), (s) => { setServiceLogs(s.docs.map(d => ({ id: d.id, ...d.data() }))); }, errHandler);"
);

appContent = appContent.replace(
  "return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); unsub6(); unsub7(); unsub8(); unsub9(); unsub10(); unsub11(); unsub12(); unsub13(); unsub14(); unsub15(); };",
  "return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); unsub6(); unsub7(); unsub8(); unsub9(); unsub10(); unsub11(); unsub12(); unsub13(); unsub14(); unsub15(); unsub16(); };"
);

appContent = appContent.replace(
  /               histories=\{histories\}\n            \/>/,
  `               histories={histories}
               serviceLogs={serviceLogs}
               advancePayments={advancePayments}
            />`
);

appContent = appContent.replace(
  /               dailySales=\{dailySales\}\n               onClose=\{/,
  `               dailySales={dailySales}
               serviceLogs={serviceLogs}
               orders={orders}
               appSettings={appSettings}
               onClose={`
);

fs.writeFileSync('src/App.jsx', appContent, 'utf8');

// --- Patch FinancialDashboard.jsx ---
let fdContent = fs.readFileSync('src/components/FinancialDashboard.jsx', 'utf8');

fdContent = fdContent.replace(
  "export default function FinancialDashboard({ orders = [], dailySales = [], appSettings = {}, branches = [], expenses = [], employees = [], histories = [] }) {",
  "export default function FinancialDashboard({ orders = [], dailySales = [], appSettings = {}, branches = [], expenses = [], employees = [], histories = [], serviceLogs = [], advancePayments = [] }) {"
);

const newAutoSalary = `
  const handleAutoSalary = () => {
    if (expenseForm.category !== 'เงินเดือนพนักงาน') {
      alert("กรุณาเลือกหมวดหมู่ 'เงินเดือนพนักงาน' ก่อนดึงข้อมูล");
      return;
    }
    
    const now = new Date(expenseForm.date);
    const monthPrefix = now.toISOString().substring(0, 7); 
    
    let totalSalaryAndComm = 0;
    employees.forEach(emp => {
       const baseSalary = parseNumber(emp.baseSalary || 0);
       
       const empHistories = histories.filter(h => h.employee === emp.name && h.date && h.date.startsWith(monthPrefix));
       let totalCommission = 0;
       empHistories.forEach(h => {
           const price = parseNumber(getFuzzyKey(h, ["ราคา", "price", "จำนวนเงิน"]) || 0);
           totalCommission += price * ((parseNumber(emp.commissionRate) || 0) / 100);
       });
       
       const empServiceLogs = serviceLogs.filter(s => s.employeeId === emp.id && s.date && s.date.startsWith(monthPrefix));
       let totalServiceFees = 0;
       empServiceLogs.forEach(s => {
           totalServiceFees += parseNumber(s.amount);
       });
       
       const empAdvances = advancePayments.filter(a => a.employeeId === emp.id && a.status === 'อนุมัติแล้ว' && a.createdAt && a.createdAt.startsWith(monthPrefix));
       let totalAdvances = 0;
       empAdvances.forEach(a => {
           totalAdvances += parseNumber(a.amount);
       });
       
       totalSalaryAndComm += (baseSalary + totalCommission + totalServiceFees - totalAdvances);
    });
    
    if (totalSalaryAndComm === 0) {
       alert("ไม่พบข้อมูลเงินเดือนหรือค่าคอมในเดือนนี้");
       return;
    }
    
    setExpenseForm({
       ...expenseForm, 
       amount: totalSalaryAndComm, 
       note: \`เงินเดือนสุทธิ (หักเบิกล่วงหน้าแล้ว) ประจำเดือน \${monthPrefix}\`
    });
  };
`;

fdContent = fdContent.replace(
  /  const handleAutoSalary = \(\) => \{[\s\S]*?  \};\n/g,
  newAutoSalary + '\n'
);

fs.writeFileSync('src/components/FinancialDashboard.jsx', fdContent, 'utf8');

// --- Patch EmployeePortal.jsx ---
let epContent = fs.readFileSync('src/components/EmployeePortal.jsx', 'utf8');

epContent = epContent.replace(
  /  dailySales = \[\],\n  onClose,/,
  `  dailySales = [],
  serviceLogs = [],
  orders = [],
  appSettings = {},
  onClose,`
);

// Add Tab
epContent = epContent.replace(
  /               \{ id: 'leave', icon: Send, label: 'ขอลา' \},/,
  `               { id: 'leave', icon: Send, label: 'ขอลา' },
               { id: 'service', icon: UserCheck, label: 'บันทึกค่ามือ' },`
);

// Add Service Form State
epContent = epContent.replace(
  "  const [advanceForm, setAdvanceForm] = useState({ amount: '', reason: '' });",
  "  const [advanceForm, setAdvanceForm] = useState({ amount: '', reason: '' });\n  const [serviceForm, setServiceForm] = useState({ date: new Date().toISOString().split('T')[0], type: 'ค่ามือ', amount: '', note: '' });\n  const [isSubmittingService, setIsSubmittingService] = useState(false);"
);

// Add payroll logic
const newPayrollLogic = `
  const payrollEmployee = useMemo(() => {
     const empHistories = histories.filter(h => 
         h.employee === employee.name && 
         h.date && h.date.startsWith(payrollMonth)
     );
     let totalCommission = 0;
     empHistories.forEach(h => {
         const price = parseNumber(getFuzzyKey(h, ["ราคา", "price", "จำนวนเงิน"]) || 0);
         totalCommission += price * ((employee.commissionRate || 0) / 100);
     });
     
     const empServiceLogs = serviceLogs.filter(s => s.employeeId === employee.id && s.date && s.date.startsWith(payrollMonth));
     let totalServiceFees = 0;
     empServiceLogs.forEach(s => totalServiceFees += parseNumber(s.amount));
     
     const empAdvances = advancePayments.filter(a => a.employeeId === employee.id && a.status === 'อนุมัติแล้ว' && a.createdAt && a.createdAt.startsWith(payrollMonth));
     let totalAdvances = 0;
     empAdvances.forEach(a => totalAdvances += parseNumber(a.amount));
     
     const baseSalary = parseNumber(employee.baseSalary || 0);
     const netSalary = baseSalary + totalCommission + totalServiceFees - totalAdvances;
     
     return {
         ...employee,
         totalCommission,
         totalServiceFees,
         totalAdvances,
         netSalary,
         serviceCount: empHistories.length,
         serviceLogCount: empServiceLogs.length
     };
  }, [histories, serviceLogs, advancePayments, employee, payrollMonth]);
  
  // Calculate Branch Target Progress
  const branchTargetStats = useMemo(() => {
     const currentMonth = new Date().toISOString().substring(0, 7);
     let branchSales = 0;
     orders.forEach(o => {
       const isSameMonth = o.createdAt && o.createdAt.startsWith(currentMonth);
       const isSameBranch = o.branch === employee.branch;
       if (isSameMonth && isSameBranch && (!o.status || o.status === 'อนุมัติแล้ว')) {
         const isPO = o.transactionType === 'owner_purchase' || (o.courseName || '').includes('[ซื้อเข้า');
         const isReq = o.transactionType === 'branch_requisition' || (o.courseName || '').includes('[เบิกจาก');
         if (!isPO && !isReq) {
           branchSales += parseNumber(o.price);
         }
       }
     });
     
     const target = parseNumber(appSettings?.branchTargets?.[employee.branch] || 0);
     const percent = target > 0 ? Math.min(100, (branchSales / target) * 100) : 0;
     
     return { branchSales, target, percent };
  }, [orders, appSettings, employee.branch]);

  const handleSubmitService = async (e) => {
    e.preventDefault();
    if (!serviceForm.amount || !serviceForm.date) {
       alert("กรุณากรอกข้อมูลให้ครบถ้วน");
       return;
    }
    setIsSubmittingService(true);
    try {
       await addDoc(getCol('service_logs'), {
          ...serviceForm,
          amount: parseNumber(serviceForm.amount),
          employeeId: employee.id,
          employeeName: employee.name,
          branch: employee.branch,
          createdAt: new Date().toISOString()
       });
       alert("บันทึกค่ามือเรียบร้อยแล้ว");
       setServiceForm({ ...serviceForm, amount: '', note: '' });
    } catch(err) {
       console.error(err);
       alert("เกิดข้อผิดพลาด");
    }
    setIsSubmittingService(false);
  };
`;

epContent = epContent.replace(
  /  const payrollEmployee = useMemo\(\(\) => \{[\s\S]*?  \}, \[histories, employee, payrollMonth\]\);\n/g,
  newPayrollLogic
);

// Update Dashboard Cards
const newDashboardCards = `
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 text-indigo-200 opacity-50 group-hover:scale-110 transition-transform duration-500"><CheckCircle size={80}/></div>
                        <div className="relative z-10">
                           <div className="text-indigo-800 font-bold mb-1 text-xs md:text-sm flex items-center gap-2">ยอดบริการ (ครั้ง)</div>
                           <div className="text-xl md:text-2xl font-black text-indigo-900">{payrollEmployee.serviceCount + payrollEmployee.serviceLogCount}</div>
                        </div>
                     </div>
                     
                     <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 text-emerald-200 opacity-50 group-hover:scale-110 transition-transform duration-500"><DollarSign size={80}/></div>
                        <div className="relative z-10">
                           <div className="text-emerald-800 font-bold mb-1 text-xs md:text-sm flex items-center gap-2">รายรับสุทธิ (รวมหักลบ)</div>
                           <div className="text-xl md:text-2xl font-black text-emerald-900">฿{payrollEmployee.netSalary.toLocaleString()}</div>
                        </div>
                     </div>
                  </div>
                  
                  {branchTargetStats.target > 0 && (
                     <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                           <div className="text-sm font-bold text-slate-700 flex items-center gap-2"><ShoppingCart size={16} className="text-pink-500"/> เป้าหมายยอดขายสาขา {employee.branch}</div>
                           <div className="text-xs font-bold text-slate-500">{branchTargetStats.percent.toFixed(1)}%</div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden">
                           <div className="bg-gradient-to-r from-pink-500 to-rose-500 h-3 rounded-full transition-all duration-1000" style={{ width: \`\${branchTargetStats.percent}%\` }}></div>
                        </div>
                        <div className="flex justify-between text-xs font-bold text-slate-400">
                           <span>ทำได้ ฿{branchTargetStats.branchSales.toLocaleString()}</span>
                           <span>เป้า ฿{branchTargetStats.target.toLocaleString()}</span>
                        </div>
                     </div>
                  )}
`;

epContent = epContent.replace(
  /                  <div className="grid grid-cols-2 gap-4">[\s\S]*?                  <\/div>/,
  newDashboardCards
);

// Inject Service Form Tab
const serviceTabUI = `
            {activeTab === 'service' && (
               <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                  <div className="p-4 md:p-6 border-b border-slate-200">
                     <h3 className="text-lg md:text-xl font-black text-slate-800 flex items-center gap-2"><UserCheck className="text-indigo-500" /> บันทึกค่ามือ / ค่าจี้ไฝ</h3>
                     <p className="text-xs md:text-sm text-slate-500 mt-1">บันทึกประวัติการทำหัตถการเพื่อคิดเงินเดือน</p>
                  </div>
                  <div className="p-4 md:p-6 flex-1 overflow-y-auto custom-scrollbar">
                     <form onSubmit={handleSubmitService} className="max-w-lg mx-auto bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8 shadow-inner">
                        <div className="space-y-4 mb-6">
                           <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">วันที่ทำรายการ</label>
                              <input type="date" required value={serviceForm.date} onChange={e => setServiceForm({...serviceForm, date: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-indigo-500 outline-none text-slate-700" />
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">ประเภท</label>
                              <select required value={serviceForm.type} onChange={e => setServiceForm({...serviceForm, type: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-indigo-500 outline-none text-slate-700">
                                 <option value="ค่ามือ">ค่ามือ (Service Fee)</option>
                                 <option value="ค่าจี้ไฝ">ค่าจี้ไฝ (Mole Removal)</option>
                                 <option value="อื่นๆ">อื่นๆ (Others)</option>
                              </select>
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">จำนวนเงิน (บาท)</label>
                              <input type="number" required placeholder="0" value={serviceForm.amount} onChange={e => setServiceForm({...serviceForm, amount: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-indigo-500 outline-none text-indigo-700 text-lg" />
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">รายละเอียด / ชื่อลูกค้า (ถ้ามี)</label>
                              <input type="text" placeholder="ระบุรายละเอียด..." value={serviceForm.note} onChange={e => setServiceForm({...serviceForm, note: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-indigo-500 outline-none text-slate-700" />
                           </div>
                        </div>
                        <button type="submit" disabled={isSubmittingService} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/30 transition-transform active:scale-95 flex items-center justify-center gap-2">
                           <CheckCircle size={20} /> บันทึกข้อมูล
                        </button>
                     </form>
                     
                     <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><History size={16}/> ประวัติการบันทึกเดือนนี้</h4>
                     <div className="space-y-3">
                        {serviceLogs.filter(s => s.employeeId === employee.id && s.date && s.date.startsWith(new Date().toISOString().substring(0,7))).length === 0 ? (
                           <div className="text-center py-8 text-slate-400 font-bold bg-slate-50 rounded-2xl">ยังไม่มีประวัติการบันทึก</div>
                        ) : (
                           serviceLogs.filter(s => s.employeeId === employee.id && s.date && s.date.startsWith(new Date().toISOString().substring(0,7))).sort((a,b) => new Date(b.date) - new Date(a.date)).map(s => (
                              <div key={s.id} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex justify-between items-center">
                                 <div>
                                    <div className="flex items-center gap-2">
                                       <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg text-xs font-bold">{s.type}</span>
                                       <span className="text-sm font-bold text-slate-700">{new Date(s.date).toLocaleDateString('th-TH')}</span>
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">{s.note || '-'}</div>
                                 </div>
                                 <div className="font-black text-indigo-600">฿{parseNumber(s.amount).toLocaleString()}</div>
                              </div>
                           ))
                        )}
                     </div>
                  </div>
               </div>
            )}
`;

epContent = epContent.replace(
  /            \{\/\* Settings View \*\/\}/,
  serviceTabUI + "\n            {/* Settings View */}"
);

fs.writeFileSync('src/components/EmployeePortal.jsx', epContent, 'utf8');
console.log("Successfully patched service fees and net salary features");
