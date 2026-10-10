const fs = require('fs');

let pos = fs.readFileSync('src/components/POSSystem.jsx', 'utf8');

// 1. Find the Monthly Target Progress start
const startIdx = pos.indexOf('{/* Monthly Target Progress */}');
if (startIdx === -1) {
  console.log('Could not find start marker in POSSystem.jsx');
  process.exit(1);
}

// 2. Find the Daily Sales Dashboard Cards end
// Let's find the div containing "ใช้เครดิต" and its end
const marker = '฿{todaySalesBreakdown.credit.toLocaleString()}</div>\n            </div>\n          </div>\n          )}';
const endIdx = pos.indexOf(marker);
if (endIdx === -1) {
  console.log('Could not find end marker in POSSystem.jsx');
  process.exit(1);
}

const fullEndIdx = endIdx + marker.length;

const dashboardUI = pos.substring(startIdx, fullEndIdx);

// Remove it from POSSystem
pos = pos.substring(0, startIdx) + pos.substring(fullEndIdx);
fs.writeFileSync('src/components/POSSystem.jsx', pos);
console.log('Removed dashboard UI from POSSystem.jsx');

// Now inject into SalesHistoryModal.jsx
let modal = fs.readFileSync('src/components/SalesHistoryModal.jsx', 'utf8');

// Remove `!isStockMode && ` from dashboardUI because SalesHistoryModal doesn't have isStockMode
let cleanDashboardUI = dashboardUI.replace('{!isStockMode && (', '').replace(')}', '');

const targetModalDiv = '<div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">';

if (!modal.includes('Monthly Target Progress')) {
  modal = modal.replace(
    targetModalDiv,
    `<div className="p-4 bg-white border-b border-slate-100 shadow-sm z-0">
          ${cleanDashboardUI}
        </div>\n        ${targetModalDiv}`
  );
  fs.writeFileSync('src/components/SalesHistoryModal.jsx', modal);
  console.log('Injected dashboard UI into SalesHistoryModal.jsx');
} else {
  console.log('dashboardUI already in SalesHistoryModal.jsx');
}
