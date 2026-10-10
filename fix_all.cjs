const fs = require('fs');

let pos = fs.readFileSync('src/components/POSSystem.jsx', 'utf8');
let modal = fs.readFileSync('src/components/SalesHistoryModal.jsx', 'utf8');

// If already migrated, skip extraction
let dashboardUI = '';

const dashStart = pos.indexOf('{/* Monthly Target Progress */}');
if (dashStart !== -1) {
    const marker = '฿{todaySalesBreakdown.credit.toLocaleString()}</div>\n            </div>\n          </div>\n          )}';
    const endIdx = pos.indexOf(marker);
    if (endIdx !== -1) {
        const fullEndIdx = endIdx + marker.length;
        dashboardUI = pos.substring(dashStart, fullEndIdx);
        // Remove from POS
        pos = pos.substring(0, dashStart) + pos.substring(fullEndIdx);
    }
}

// 2. Add 'Special discount' badge
pos = pos.replace(
  '{isVipCustomer && <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-yellow-200">VIP</span>}',
  `{isVipCustomer && <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-yellow-200">VIP</span>}\n                        {orderChannel === 'shopee' && <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-orange-200 ml-1">ส่วนลดพิเศษ</span>}`
);

// 3. Separate online sales in handleEodSubmit
if (!pos.includes('onlineSales: onlineSales')) {
    pos = pos.replace(
      'const eodRef = doc(getCol(\'daily_sales\'));',
      `const onlineSales = todaySalesBreakdown.online || 0;\n      const eodRef = doc(getCol('daily_sales'));`
    );

    pos = pos.replace(
      'creditSales: todaySalesBreakdown.credit,',
      `creditSales: todaySalesBreakdown.credit,\n        onlineSales: onlineSales,`
    );

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
      'credit,\n      transferDetails\n    };',
      'credit,\n      online,\n      transferDetails\n    };'
    );
}

// 4. Update SalesHistoryModal props in POSSystem
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

if (!modal.includes('appSettings, currentMonthSales')) {
    modal = modal.replace(
      'export default function SalesHistoryModal({ isOpen, onClose, showToast, globalBranch }) {',
      'export default function SalesHistoryModal({ \n  isOpen, onClose, showToast, globalBranch,\n  appSettings, currentMonthSales, todaySales, todaySalesBreakdown, setShowEodModal\n}) {'
    );

    modal = modal.replace(
      "import { X, Search, FileText, AlertCircle, Trash2, Clock, CheckCircle } from 'lucide-react';",
      "import { X, Search, FileText, AlertCircle, Trash2, Clock, CheckCircle, DollarSign, Banknote, Smartphone, CreditCard } from 'lucide-react';"
    );
}

// Insert dashboardUI at the top of the modal content
if (dashboardUI && !modal.includes('Monthly Target Progress')) {
    const cleanDashboardUI = dashboardUI.replace('{!isStockMode && (', '').replace('          )}', '');
    const targetModalDiv = '<div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">';

    modal = modal.replace(
        targetModalDiv,
        `${targetModalDiv}\n        <div className="p-4 bg-white border-b border-slate-100 shadow-sm z-0">\n${cleanDashboardUI}\n        </div>`
    );
}

fs.writeFileSync('src/components/SalesHistoryModal.jsx', modal);
console.log('SalesHistoryModal.jsx modified');
