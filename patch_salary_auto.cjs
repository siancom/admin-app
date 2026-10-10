const fs = require('fs');

// --- Patch App.jsx ---
let appContent = fs.readFileSync('src/App.jsx', 'utf8');

appContent = appContent.replace(
  /               branches=\{branches\}\n               expenses=\{expenses\}\n            \/>/,
  `               branches={branches}
               expenses={expenses}
               employees={employees}
               histories={histories}
            />`
);

fs.writeFileSync('src/App.jsx', appContent, 'utf8');

// --- Patch FinancialDashboard.jsx ---
let fdContent = fs.readFileSync('src/components/FinancialDashboard.jsx', 'utf8');

fdContent = fdContent.replace(
  "export default function FinancialDashboard({ orders = [], dailySales = [], appSettings = {}, branches = [], expenses = [] }) {",
  "export default function FinancialDashboard({ orders = [], dailySales = [], appSettings = {}, branches = [], expenses = [], employees = [], histories = [] }) {"
);

const handleAutoSalary = `
  const handleAutoSalary = () => {
    if (expenseForm.category !== 'เงินเดือนพนักงาน') {
      alert("กรุณาเลือกหมวดหมู่ 'เงินเดือนพนักงาน' ก่อนดึงข้อมูล");
      return;
    }
    
    // Calculate salary for current month
    const now = new Date(expenseForm.date);
    const monthPrefix = now.toISOString().substring(0, 7); // YYYY-MM
    
    let totalSalaryAndComm = 0;
    employees.forEach(emp => {
       const baseSalary = parseNumber(emp.baseSalary || 0);
       
       const empHistories = histories.filter(h => 
           h.employee === emp.name && 
           h.date && h.date.startsWith(monthPrefix)
       );
       
       let totalCommission = 0;
       empHistories.forEach(h => {
           const price = parseNumber(getFuzzyKey(h, ["ราคา", "price", "จำนวนเงิน"]) || 0);
           totalCommission += price * ((parseNumber(emp.commissionRate) || 0) / 100);
       });
       
       totalSalaryAndComm += (baseSalary + totalCommission);
    });
    
    if (totalSalaryAndComm === 0) {
       alert("ไม่พบข้อมูลเงินเดือนหรือค่าคอมในเดือนนี้");
       return;
    }
    
    setExpenseForm({
       ...expenseForm, 
       amount: totalSalaryAndComm, 
       note: \`เงินเดือนและค่าคอมประจำเดือน \${monthPrefix}\`
    });
  };
`;

fdContent = fdContent.replace(
  /  const handleAddExpense = async \(\) => \{/,
  handleAutoSalary + "\n  const handleAddExpense = async () => {"
);

fdContent = fdContent.replace(
  /<label className="block text-xs font-bold text-slate-500 mb-1">จำนวนเงิน \(บาท\)<\/label>/,
  `<div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-500">จำนวนเงิน (บาท)</label>
                    {expenseForm.category === 'เงินเดือนพนักงาน' && (
                      <button onClick={handleAutoSalary} className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold hover:bg-indigo-200 transition-colors">✨ ดึงเงินเดือนอัตโนมัติ</button>
                    )}
                  </div>`
);

fs.writeFileSync('src/components/FinancialDashboard.jsx', fdContent, 'utf8');

// --- Patch EmployeePortal.jsx ---
let epContent = fs.readFileSync('src/components/EmployeePortal.jsx', 'utf8');

const dashboardCards = `
            {/* Motivation Cards */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute -right-4 -bottom-4 text-indigo-200 opacity-50 group-hover:scale-110 transition-transform duration-500"><History size={80}/></div>
                  <div className="relative z-10">
                     <div className="text-indigo-800 font-bold mb-1 text-sm flex items-center gap-2"><CheckCircle size={16}/> รอบบริการเดือนนี้</div>
                     <div className="text-3xl font-black text-indigo-900">{payrollEmployee.serviceCount} <span className="text-sm font-medium text-indigo-600">รอบ</span></div>
                  </div>
               </div>
               
               <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute -right-4 -bottom-4 text-emerald-200 opacity-50 group-hover:scale-110 transition-transform duration-500"><DollarSign size={80}/></div>
                  <div className="relative z-10">
                     <div className="text-emerald-800 font-bold mb-1 text-sm flex items-center gap-2"><DollarSign size={16}/> ค่าคอมมิชชันสะสม</div>
                     <div className="text-3xl font-black text-emerald-900">฿{payrollEmployee.totalCommission.toLocaleString()}</div>
                  </div>
               </div>
            </div>
`;

epContent = epContent.replace(
  /            <div className="grid grid-cols-2 gap-3">/,
  dashboardCards + `\n            <div className="grid grid-cols-2 gap-3 mt-4">`
);

fs.writeFileSync('src/components/EmployeePortal.jsx', epContent, 'utf8');
console.log("Successfully patched Employee Salary Automation & Portal Motivation");
