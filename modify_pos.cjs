const fs = require('fs');

// --- Modify POSSystem.jsx ---
let pos = fs.readFileSync('src/components/POSSystem.jsx', 'utf8');

// 1. Remove dashboard
const dashStart = pos.indexOf('{/* Monthly Target Progress */}');
const dashEndStr = '          </div>\n          )}\n\n';
let dashEnd = pos.indexOf(dashEndStr, dashStart);
if (dashEnd !== -1) dashEnd += dashEndStr.length;

let dashboardUI = '';
if (dashStart !== -1 && dashEnd !== -1) {
  dashboardUI = pos.substring(dashStart, dashEnd);
  pos = pos.substring(0, dashStart) + pos.substring(dashEnd);
}

// 2. Add 'Special discount' badge
pos = pos.replace(
  '{isVipCustomer && <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-yellow-200">VIP</span>}',
  `{isVipCustomer && <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-yellow-200">VIP</span>}\n                        {orderChannel === 'shopee' && <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-orange-200 ml-1">ส่วนลดพิเศษ</span>}`
);

// 3. Separate online sales in handleEodSubmit
pos = pos.replace(
  'const eodRef = doc(getCol(\'daily_sales\'));',
  `const onlineSales = todaySalesBreakdown.online || 0;\n      const eodRef = doc(getCol('daily_sales'));`
);

pos = pos.replace(
  'creditSales: todaySalesBreakdown.credit,',
  `creditSales: todaySalesBreakdown.credit,\n        onlineSales: onlineSales,`
);

// Wait, todaySalesBreakdown needs to compute online
// Let's find todaySalesBreakdown
pos = pos.replace(
  'let credit = 0;\n    const transferDetails = [];',
  `let credit = 0;\n    let online = 0;\n    const transferDetails = [];`
);

pos = pos.replace(
  'if (status === \'ค้างชำระ\') {',
  `if (String(o.orderChannel || '') !== 'instore' && String(o.orderChannel || '') !== '') {
               online += tAmt;
             }\n             if (status === 'ค้างชำระ') {`
);

pos = pos.replace(
  'credit,',
  'credit,\n      online,'
);

// 4. Update SalesHistoryModal props
pos = pos.replace(
  '<SalesHistoryModal\n        isOpen={showSalesHistory}\n        onClose={() => setShowSalesHistory(false)}\n        showToast={showToast}\n        globalBranch={globalBranch}\n      />',
  `<SalesHistoryModal
        isOpen={showSalesHistory}
        onClose={() => setShowSalesHistory(false)}
        showToast={showToast}
        globalBranch={globalBranch}
        appSettings={appSettings}
        currentMonthSales={currentMonthSales}
        todaySales={todaySales}
        todaySalesBreakdown={todaySalesBreakdown}
        setShowEodModal={setShowEodModal}
      />`
);

fs.writeFileSync('src/components/POSSystem.jsx', pos);
console.log('POSSystem.jsx modified');

// --- Modify SalesHistoryModal.jsx ---
let modal = fs.readFileSync('src/components/SalesHistoryModal.jsx', 'utf8');

modal = modal.replace(
  'export default function SalesHistoryModal({ isOpen, onClose, showToast, globalBranch }) {',
  'export default function SalesHistoryModal({ \n  isOpen, onClose, showToast, globalBranch,\n  appSettings, currentMonthSales, todaySales, todaySalesBreakdown, setShowEodModal\n}) {'
);

modal = modal.replace(
  "import { X, Search, FileText, AlertCircle, Trash2, Clock, CheckCircle } from 'lucide-react';",
  "import { X, Search, FileText, AlertCircle, Trash2, Clock, CheckCircle, DollarSign, Banknote, Smartphone, CreditCard } from 'lucide-react';"
);

// Insert dashboardUI at the top of the modal content
const targetModalDiv = '<div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">';

if (dashboardUI) {
  modal = modal.replace(
    targetModalDiv,
    `<div className="p-4 bg-white border-b border-slate-100 shadow-sm z-0">
          ${dashboardUI}
        </div>\n        ${targetModalDiv}`
  );
}

fs.writeFileSync('src/components/SalesHistoryModal.jsx', modal);
console.log('SalesHistoryModal.jsx modified');
