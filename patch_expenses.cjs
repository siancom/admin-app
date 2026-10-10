const fs = require('fs');

// --- Patch App.jsx ---
let appContent = fs.readFileSync('src/App.jsx', 'utf8');

// Add state
appContent = appContent.replace(
  "  const [dailySales, setDailySales] = useState([]);",
  "  const [dailySales, setDailySales] = useState([]);\n  const [expenses, setExpenses] = useState([]);"
);

// Add onSnapshot
appContent = appContent.replace(
  "    const unsub14 = onSnapshot(getCol('advance_payments'), (s) => { setAdvancePayments(s.docs.map(d => ({ id: d.id, ...d.data() }))); }, errHandler);",
  "    const unsub14 = onSnapshot(getCol('advance_payments'), (s) => { setAdvancePayments(s.docs.map(d => ({ id: d.id, ...d.data() }))); }, errHandler);\n    const unsub15 = onSnapshot(getCol('expenses'), (s) => { setExpenses(s.docs.map(d => ({ id: d.id, ...d.data() }))); }, errHandler);"
);

// Add to unsub cleanup
appContent = appContent.replace(
  "return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); unsub6(); unsub7(); unsub8(); unsub9(); unsub10(); unsub11(); unsub12(); unsub13(); unsub14(); };",
  "return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); unsub6(); unsub7(); unsub8(); unsub9(); unsub10(); unsub11(); unsub12(); unsub13(); unsub14(); unsub15(); };"
);

// Pass prop
appContent = appContent.replace(
  /           <FinancialDashboard \n               orders=\{orders\} \n               dailySales=\{dailySales\} \n               appSettings=\{appSettings\} \n               branches=\{branches\}\n            \/>/,
  `           <FinancialDashboard 
               orders={orders} 
               dailySales={dailySales} 
               appSettings={appSettings} 
               branches={branches}
               expenses={expenses}
            />`
);

fs.writeFileSync('src/App.jsx', appContent, 'utf8');

// --- Patch FinancialDashboard.jsx ---
let fdContent = fs.readFileSync('src/components/FinancialDashboard.jsx', 'utf8');

// Add expenses prop
fdContent = fdContent.replace(
  "export default function FinancialDashboard({ orders = [], dailySales = [], appSettings = {}, branches = [] }) {",
  "export default function FinancialDashboard({ orders = [], dailySales = [], appSettings = {}, branches = [], expenses = [] }) {"
);

// Add expense state
fdContent = fdContent.replace(
  "  const [previewImage, setPreviewImage] = useState(null);",
  `  const [previewImage, setPreviewImage] = useState(null);
  const [expenseForm, setExpenseForm] = useState({ date: new Date().toISOString().split('T')[0], category: 'เงินเดือนพนักงาน', amount: '', note: '', branch: 'สำนักงานใหญ่' });
  const expenseCategories = ['เงินเดือนพนักงาน', 'ค่าน้ำ', 'ค่าไฟ', 'ค่าอินเทอร์เน็ต', 'ค่าเช่าที่', 'ค่าอุปกรณ์/เบิกจิปาถะ', 'อื่นๆ'];
  const [isSavingExpense, setIsSavingExpense] = useState(false);`
);

// Update stats logic to include OPEX
let newStatsLogic = `  const stats = useMemo(() => {
    let totalSales = 0, totalExpense = 0, totalOPEX = 0, totalNet = 0;
    let totalCash = 0, totalTransfer = 0, totalCod = 0, totalOnline = 0;
    let count = 0;
    
    filteredOrders.forEach(o => {
      const p = parseNumber(o.price);
      const isOldPO = (o.courseName || '').includes('[ซื้อเข้า');
      const isReq = o.transactionType === 'branch_requisition' || (o.courseName || '').includes('[เบิกจาก');
      const isPO = o.transactionType === 'owner_purchase' || isOldPO;
      
      if (isReq) return;

      if (isPO) {
        totalExpense += p;
      } else {
        totalSales += p;
        count++;
        
        const parsed = parsePaymentStr(o.paymentMethod);
        if (parsed.cash === 0 && parsed.transfer === 0 && parsed.cod === 0 && o.paymentMethod && !o.paymentMethod.includes(':') && p > 0) {
            if (o.paymentMethod === 'เงินสด') totalCash += p;
            else if (o.paymentMethod === 'โอนเงิน') totalTransfer += p;
            else if (o.paymentMethod === 'บัตรเครดิต' || o.paymentMethod === 'ค้าง/COD') totalCod += p;
        } else {
            totalCash += parsed.cash;
            totalTransfer += parsed.transfer;
            totalCod += parsed.cod;
        }
        
        if (o.orderChannel && o.orderChannel !== 'instore') {
            totalOnline += p;
        }
      }
    });

    // Add OPEX from expenses collection (Filter by date/branch)
    const filteredExpenses = expenses.filter(e => {
       const isSameDate = e.date === filterDate || (!filterDate);
       const isSameBranch = filterBranch === 'ทั้งหมด' || e.branch === filterBranch;
       return isSameDate && isSameBranch;
    });
    
    filteredExpenses.forEach(e => {
       totalOPEX += parseNumber(e.amount);
    });
    
    totalNet = totalSales - totalExpense - totalOPEX;
    return { totalSales, totalExpense, totalOPEX, totalNet, totalCash, totalTransfer, totalCod, totalOnline, count };
  }, [filteredOrders, expenses, filterDate, filterBranch]);`;

fdContent = fdContent.replace(
  /  const stats = useMemo\(\(\) => \{[\s\S]*?  \}, \[filteredOrders\]\);/,
  newStatsLogic
);

// Add OPEX card to summary cards
let opexCard = `
              <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100 shadow-sm col-span-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center"><Banknote size={20} /></div>
                  <div className="text-orange-700 font-bold">ค่าใช้จ่ายอื่นๆ (OPEX)</div>
                </div>
                <div className="text-3xl font-black text-orange-800 mt-2">฿{stats.totalOPEX.toLocaleString()}</div>
                <div className="text-xs text-orange-600 mt-2 font-medium">ค่าน้ำ ไฟ เน็ต เงินเดือน ฯลฯ</div>
              </div>
`;

// Inject into grid by changing cols from 4 to 5
fdContent = fdContent.replace(
  /            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">/,
  `            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">`
);

fdContent = fdContent.replace(
  /              <div className="bg-rose-50 p-5 rounded-2xl border border-rose-100 shadow-sm col-span-1">[\s\S]*?              <\/div>/,
  `              <div className="bg-rose-50 p-5 rounded-2xl border border-rose-100 shadow-sm col-span-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center"><Banknote size={20} /></div>
                  <div className="text-rose-700 font-bold">รายจ่ายสั่งของ (PO)</div>
                </div>
                <div className="text-3xl font-black text-rose-800 mt-2">฿{stats.totalExpense.toLocaleString()}</div>
                <div className="text-xs text-rose-600 mt-2 font-medium">เฉพาะยอดสั่งเข้าสต๊อก</div>
              </div>` + opexCard
);

// Add Tab Button
fdContent = fdContent.replace(
  /          <button \n            onClick=\{\(\) => setActiveTab\('verifications'\)\}[\s\S]*?          <\/button>/,
  `          <button 
            onClick={() => setActiveTab('verifications')} 
            className={\`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 \${activeTab === 'verifications' ? 'bg-indigo-100 text-indigo-700 shadow-inner' : 'text-slate-500 hover:bg-slate-100'}\`}
          >
            <ListChecks size={16} /> ตรวจรับยอด
            {dailySales.filter(d => d.status === 'รอตรวจสอบ').length > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{dailySales.filter(d => d.status === 'รอตรวจสอบ').length}</span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('expenses')} 
            className={\`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 \${activeTab === 'expenses' ? 'bg-indigo-100 text-indigo-700 shadow-inner' : 'text-slate-500 hover:bg-slate-100'}\`}
          >
            <DollarSign size={16} /> บันทึกรายจ่าย
          </button>`
);

// Implement Handle Expense Add
let handleAddExpenseStr = `  const handleAddExpense = async () => {
    if (!expenseForm.amount || !expenseForm.category || !expenseForm.date) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    setIsSavingExpense(true);
    try {
      const { collection, addDoc } = await import('firebase/firestore');
      await addDoc(collection(db, 'expenses'), {
        ...expenseForm,
        amount: parseNumber(expenseForm.amount),
        createdAt: new Date().toISOString()
      });
      alert('บันทึกรายจ่ายเรียบร้อย');
      setExpenseForm({ ...expenseForm, amount: '', note: '' });
    } catch (e) {
      console.error(e);
      alert('เกิดข้อผิดพลาดในการบันทึกรายจ่าย');
    }
    setIsSavingExpense(false);
  };
  
  const handleDeleteExpense = async (id) => {
    if (!window.confirm("ต้องการลบรายจ่ายนี้ใช่หรือไม่?")) return;
    try {
      const { deleteDoc, doc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'expenses', id));
    } catch (e) {
      console.error(e);
      alert('เกิดข้อผิดพลาดในการลบ');
    }
  };
  `;

fdContent = fdContent.replace(
  /  const handleVerify = async \(id, newStatus\) => \{/,
  handleAddExpenseStr + `\n  const handleVerify = async (id, newStatus) => {`
);

// Implement Expense Tab UI
let expenseUI = `        {activeTab === 'expenses' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
              <DollarSign className="text-orange-500" /> บันทึกค่าใช้จ่าย (OPEX)
            </h2>
            
            {/* Form */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-4xl">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">วันที่ทำรายการ</label>
                  <input type="date" value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">สาขา</label>
                  <select value={expenseForm.branch} onChange={e => setExpenseForm({...expenseForm, branch: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl focus:border-indigo-500 outline-none">
                    {branchOptions.map(b => <option key={b} value={b === 'ทั้งหมด' ? 'สำนักงานใหญ่' : b}>{b === 'ทั้งหมด' ? 'สำนักงานใหญ่' : b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">หมวดหมู่</label>
                  <select value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl focus:border-indigo-500 outline-none">
                    {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">จำนวนเงิน (บาท)</label>
                  <input type="number" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} placeholder="0.00" className="w-full bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl focus:border-indigo-500 outline-none font-bold text-orange-600" />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">หมายเหตุเพิ่มเติม</label>
                  <input type="text" value={expenseForm.note} onChange={e => setExpenseForm({...expenseForm, note: e.target.value})} placeholder="ระบุรายละเอียด เช่น ค่าไฟเดือนพฤษภาคม, เงินเดือนคุณ A" className="w-full bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl focus:border-indigo-500 outline-none" />
                </div>
              </div>
              <button onClick={handleAddExpense} disabled={isSavingExpense} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-sm hover:bg-indigo-700 transition-colors w-full md:w-auto">
                {isSavingExpense ? 'กำลังบันทึก...' : 'บันทึกรายการ'}
              </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                <h2 className="font-bold text-slate-800 flex items-center gap-2"><ListChecks size={18} className="text-slate-400" /> ประวัติค่าใช้จ่ายเดือนนี้</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3">วันที่</th>
                      <th className="px-6 py-3">สาขา</th>
                      <th className="px-6 py-3">หมวดหมู่</th>
                      <th className="px-6 py-3">รายละเอียด</th>
                      <th className="px-6 py-3 text-right">จำนวนเงิน</th>
                      <th className="px-6 py-3 text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expenses.filter(e => {
                        // Show current month expenses mostly
                        if (!e.date) return false;
                        const d = new Date(e.date);
                        const now = new Date();
                        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                    }).sort((a,b) => new Date(b.date) - new Date(a.date)).map(e => (
                      <tr key={e.id} className="hover:bg-slate-50">
                        <td className="px-6 py-3">{new Date(e.date).toLocaleDateString('th-TH')}</td>
                        <td className="px-6 py-3">{e.branch}</td>
                        <td className="px-6 py-3"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-xs font-bold">{e.category}</span></td>
                        <td className="px-6 py-3 text-slate-600">{e.note || '-'}</td>
                        <td className="px-6 py-3 text-right font-bold text-orange-600">฿{e.amount?.toLocaleString()}</td>
                        <td className="px-6 py-3 text-center">
                           <button onClick={() => handleDeleteExpense(e.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors"><X size={16}/></button>
                        </td>
                      </tr>
                    ))}
                    {expenses.length === 0 && <tr><td colSpan={6} className="text-center py-6 text-slate-400">ยังไม่มีประวัติค่าใช้จ่าย</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}`;

fdContent = fdContent.replace(
  /      <\/div>\n\n      \{\/\* Image Preview Modal \*\/\}/,
  `        ${expenseUI}\n      </div>\n\n      {/* Image Preview Modal */}`
);

// Update Printable P&L format
let printablePnL = `              <div className="flex justify-between border-b border-slate-100 pb-2 mb-2">
                <span>รายจ่าย (PO)</span>
                <span className="font-bold text-lg text-rose-600">- ฿{stats.totalExpense.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2 mb-2">
                <span>ค่าใช้จ่ายดำเนินงาน (OPEX)</span>
                <span className="font-bold text-lg text-orange-600">- ฿{stats.totalOPEX.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">กำไรสุทธิ (Net Profit)</span>`;

fdContent = fdContent.replace(
  /              <div className="flex justify-between border-b border-slate-100 pb-2 mb-2">\n                <span>รายจ่าย \(PO\)<\/span>\n                <span className="font-bold text-lg text-rose-600">- ฿\{stats\.totalExpense\.toLocaleString\(\)\}<\/span>\n              <\/div>\n              <div className="flex justify-between">\n                <span className="font-bold">กำไรสุทธิ \(Net Profit\)<\/span>/,
  printablePnL
);

fs.writeFileSync('src/components/FinancialDashboard.jsx', fdContent, 'utf8');
console.log("Successfully added expenses feature");
