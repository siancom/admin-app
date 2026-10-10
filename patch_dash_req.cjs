const fs = require('fs');

let content = fs.readFileSync('src/components/EmployeeDashboard.jsx', 'utf8');

// 1. Add requisitions to imports and signature
const iconRegex = /import \{\s*([\s\S]*?)\s*\} from 'lucide-react';/;
if (content.match(iconRegex)) {
    const matched = content.match(iconRegex)[1];
    if (!matched.includes('ShoppingCart')) {
        content = content.replace(iconRegex, `import { ${matched}, ShoppingCart } from 'lucide-react';`);
    }
}

const sigOld = `export default function EmployeeDashboard({ employees = [], attendance = [], histories = [], branches = [], leaves = [], advancePayments = [], dailySales = [], onGoToPOS, appSettings = {}, orders = [], serviceLogs = [], requisitions = [] }) {`;
// Actually, App passed requisitions = {employeeRequisitions}, but EmployeeDashboard signature doesn't have it explicitly if I didn't add it.
// Let's add it carefully.
const defRegex = /export default function EmployeeDashboard\(\{([^}]+)\}\) \{/;
if (content.match(defRegex)) {
    let props = content.match(defRegex)[1];
    if (!props.includes('requisitions')) {
        content = content.replace(defRegex, `export default function EmployeeDashboard({ ${props}, requisitions = [] }) {`);
    }
}

// 2. Add handleUpdateRequisitionStatus
const handleAdv = `  const handleUpdateAdvanceStatus = async (id, status) => {
    try {
      let note = '';
      if (status === 'ไม่อนุมัติ') {
          note = prompt('ระบุเหตุผลที่ไม่อนุมัติ (ถ้ามี):') || '';
      }
      await updateDoc(doc(db, 'employee_advance', id), { status, note, updatedAt: new Date().toISOString() });
    } catch(err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };`;

const handleReq = `  const handleUpdateAdvanceStatus = async (id, status) => {
    try {
      let note = '';
      if (status === 'ไม่อนุมัติ') {
          note = prompt('ระบุเหตุผลที่ไม่อนุมัติ (ถ้ามี):') || '';
      }
      await updateDoc(doc(db, 'employee_advance', id), { status, note, updatedAt: new Date().toISOString() });
    } catch(err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };
  
  const handleUpdateRequisitionStatus = async (id, status) => {
    try {
      let note = '';
      if (status === 'ไม่อนุมัติ') {
          note = prompt('ระบุเหตุผลที่ไม่อนุมัติ (ถ้ามี):') || '';
      }
      await updateDoc(doc(db, 'employee_requisitions', id), { status, note, updatedAt: new Date().toISOString() });
    } catch(err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };`;

if (content.includes(handleAdv)) {
    content = content.replace(handleAdv, handleReq);
    console.log("Added handleUpdateRequisitionStatus.");
}

// 3. Add tab button
const manageTabRegex = /<button onClick=\{\(\) => setActiveTab\('manage'\)\} className=\{`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 \$\{activeTab === 'manage' \? 'bg-indigo-100 text-indigo-700 shadow-inner' : 'text-slate-500 hover:bg-slate-100'\}`\}>\n\s*<Users size=\{18\} \/> พนักงาน\n\s*<\/button>/;

const suppliesTab = `<button onClick={() => setActiveTab('supplies')} className={\`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 \${activeTab === 'supplies' ? 'bg-indigo-100 text-indigo-700 shadow-inner' : 'text-slate-500 hover:bg-slate-100'}\`}>
            <ShoppingCart size={18} /> เบิกของใช้
          </button>
          <button onClick={() => setActiveTab('manage')} className={\`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 \${activeTab === 'manage' ? 'bg-indigo-100 text-indigo-700 shadow-inner' : 'text-slate-500 hover:bg-slate-100'}\`}>
            <Users size={18} /> พนักงาน
          </button>`;

if (content.match(manageTabRegex)) {
    content = content.replace(manageTabRegex, suppliesTab);
    console.log("Added supplies tab button.");
}

// 4. Add supplies panel HTML
const advPanelEnd = /\{activeTab === 'advance' && \([\s\S]*?\}\s*<\/div>\s*<\/div>\s*\)\}/;

const suppliesPanelHtml = `
        {activeTab === 'supplies' && (
           <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
             <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><ShoppingCart className="text-indigo-500" /> จัดการคำขอเบิกของใช้</h2>
             </div>
             <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                     <tr>
                       <th className="px-6 py-4">วันที่ขอ</th>
                       <th className="px-6 py-4">พนักงาน</th>
                       <th className="px-6 py-4">รายการเบิก</th>
                       <th className="px-6 py-4">สถานะ</th>
                       <th className="px-6 py-4 text-right">จัดการ</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {[...requisitions].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map(req => (
                       <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                         <td className="px-6 py-4 text-slate-500 font-bold">{new Date(req.createdAt).toLocaleDateString('th-TH')}</td>
                         <td className="px-6 py-4 font-bold text-slate-800">
                            {req.employeeName}
                         </td>
                         <td className="px-6 py-4">
                            <div className="font-bold text-slate-800">{req.itemName} <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md text-xs">{req.quantity}</span></div>
                            {req.reason && <div className="text-xs font-normal text-slate-500 mt-1">เหตุผล: {req.reason}</div>}
                         </td>
                         <td className="px-6 py-4">
                            <span className={\`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit \${
                               req.status === 'อนุมัติแล้ว' ? 'bg-emerald-100 text-emerald-700' :
                               req.status === 'ไม่อนุมัติ' ? 'bg-rose-100 text-rose-700' :
                               'bg-amber-100 text-amber-700'
                            }\`}>
                               {req.status || 'รออนุมัติ'}
                            </span>
                            {req.status === 'ไม่อนุมัติ' && req.note && (
                                <div className="text-[10px] text-rose-600 mt-1 max-w-[150px] truncate" title={req.note}>หมายเหตุ: {req.note}</div>
                            )}
                         </td>
                         <td className="px-6 py-4 text-right">
                           {(!req.status || req.status === 'รออนุมัติ') && (
                             <div className="flex justify-end gap-2">
                               <button onClick={() => handleUpdateRequisitionStatus(req.id, 'อนุมัติแล้ว')} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg font-bold transition-all text-xs border border-emerald-200 hover:border-emerald-500 flex items-center gap-1">
                                 <CheckCircle size={14} /> อนุมัติ
                               </button>
                               <button onClick={() => handleUpdateRequisitionStatus(req.id, 'ไม่อนุมัติ')} className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded-lg font-bold transition-all text-xs border border-rose-200 hover:border-rose-500 flex items-center gap-1">
                                 <XCircle size={14} /> ไม่อนุมัติ
                               </button>
                             </div>
                           )}
                         </td>
                       </tr>
                     ))}
                     {requisitions.length === 0 && (
                        <tr>
                            <td colSpan="5" className="px-6 py-8 text-center text-slate-500 font-bold">ไม่มีรายการคำขอเบิกของใช้</td>
                        </tr>
                     )}
                   </tbody>
                 </table>
             </div>
           </div>
        )}`;

if (content.match(advPanelEnd)) {
    const matchedStr = content.match(advPanelEnd)[0];
    content = content.replace(advPanelEnd, matchedStr + suppliesPanelHtml);
    console.log("Added supplies panel UI.");
} else {
    // try index approach
    console.log("Regex for advPanelEnd failed.");
}

fs.writeFileSync('src/components/EmployeeDashboard.jsx', content, 'utf8');
