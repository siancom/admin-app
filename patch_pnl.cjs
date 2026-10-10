const fs = require('fs');

let content = fs.readFileSync('src/components/FinancialDashboard.jsx', 'utf8');

// 1. Update stats logic
let statsLogic = `  const stats = useMemo(() => {
    let totalSales = 0, totalExpense = 0, totalNet = 0;
    let totalCash = 0, totalTransfer = 0, totalCod = 0, totalOnline = 0;
    let count = 0;
    
    filteredOrders.forEach(o => {
      const p = parseNumber(o.price);
      const isOldPO = (o.courseName || '').includes('[ซื้อเข้า');
      const isReq = o.transactionType === 'branch_requisition' || (o.courseName || '').includes('[เบิกจาก');
      const isPO = o.transactionType === 'owner_purchase' || isOldPO;
      
      // Skip requisitions from the top-level P&L sum to avoid double counting stock moves
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
    
    totalNet = totalSales - totalExpense;
    return { totalSales, totalExpense, totalNet, totalCash, totalTransfer, totalCod, totalOnline, count };
  }, [filteredOrders]);`;

content = content.replace(
  /  const stats = useMemo\(\(\) => \{[\s\S]*?  \}, \[filteredOrders\]\);/,
  statsLogic
);

// 2. Update currentMonthSalesData to exclude POs
content = content.replace(
  "        if (dailyData[dayIdx]) {",
  "        const isPO = o.transactionType === 'owner_purchase' || (o.courseName || '').includes('[ซื้อเข้า');\n        const isReq = o.transactionType === 'branch_requisition' || (o.courseName || '').includes('[เบิกจาก');\n        if (!isPO && !isReq && dailyData[dayIdx]) {"
);

// 3. Update the UI Cards for P&L
let plCards = `            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 shadow-sm col-span-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><DollarSign size={20} /></div>
                  <div className="text-emerald-700 font-bold">รายรับ (Sales)</div>
                </div>
                <div className="text-3xl font-black text-emerald-800 mt-2">฿{stats.totalSales.toLocaleString()}</div>
                <div className="text-xs text-emerald-600 mt-2 font-medium">จาก {stats.count} บิล</div>
              </div>
              
              <div className="bg-rose-50 p-5 rounded-2xl border border-rose-100 shadow-sm col-span-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center"><Banknote size={20} /></div>
                  <div className="text-rose-700 font-bold">รายจ่าย (PO)</div>
                </div>
                <div className="text-3xl font-black text-rose-800 mt-2">฿{stats.totalExpense.toLocaleString()}</div>
                <div className="text-xs text-rose-600 mt-2 font-medium">เฉพาะยอดสั่งเข้าสต๊อก</div>
              </div>

              <div className={\`p-5 rounded-2xl border shadow-sm col-span-1 md:col-span-2 \${stats.totalNet >= 0 ? 'bg-indigo-50 border-indigo-200' : 'bg-red-50 border-red-200'}\`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={\`w-10 h-10 rounded-full flex items-center justify-center \${stats.totalNet >= 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-red-100 text-red-600'}\`}><Target size={20} /></div>
                  <div className={\`font-bold \${stats.totalNet >= 0 ? 'text-indigo-700' : 'text-red-700'}\`}>กำไรสุทธิ (Net Profit)</div>
                </div>
                <div className={\`text-4xl font-black mt-2 \${stats.totalNet >= 0 ? 'text-indigo-800' : 'text-red-800'}\`}>
                  {stats.totalNet >= 0 ? '' : '-'}฿{Math.abs(stats.totalNet).toLocaleString()}
                </div>
                <div className="text-xs mt-2 font-medium opacity-75">รายรับสุทธิ หักลบด้วย รายจ่ายจากการสั่งซื้อ</div>
              </div>
            </div>`;

content = content.replace(
  /            \{\/\* Summary Cards \*\/\}[\s\S]*?            \{\/\* Data Table \*\/\}/,
  plCards + `\n\n            {/* Data Table */}`
);

// 4. Update the Table rows to show "รายรับ" vs "รายจ่าย"
let tableRow = `                      filteredOrders.map(o => {
                        const isOldPO = (o.courseName || '').includes('[ซื้อเข้า');
                        const isPO = o.transactionType === 'owner_purchase' || isOldPO;
                        const isReq = o.transactionType === 'branch_requisition' || (o.courseName || '').includes('[เบิกจาก');
                        let badge = <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold border border-emerald-200">รายรับ</span>;
                        if (isPO) badge = <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-xs font-bold border border-rose-200">รายจ่าย (PO)</span>;
                        else if (isReq) badge = <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs font-bold border border-amber-200">เบิกสต๊อก</span>;
                        
                        return (
                          <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-3 text-slate-500">{o.createdAt ? new Date(o.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                            <td className="px-6 py-3 font-medium text-indigo-600">{o.orderNo}</td>
                            <td className="px-6 py-3 text-slate-700">{o.customerName || 'ลูกค้าทั่วไป'}</td>
                            <td className="px-6 py-3 text-slate-500 max-w-xs truncate" title={o.courseName}>
                              <div className="flex items-center gap-2">
                                {badge}
                                <span className="truncate">{o.courseName || '-'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-3 text-slate-500">{o.paymentMethod || '-'}</td>
                            <td className={\`px-6 py-3 text-right font-bold \${isPO ? 'text-rose-600' : isReq ? 'text-amber-600' : 'text-slate-800'}\`}>
                              {isPO ? '-' : ''}฿{parseNumber(o.price).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })`;

content = content.replace(
  /                      filteredOrders\.map\(o => \([\s\S]*?\)\)/,
  tableRow
);

// 5. Update Printable Report
let printableReport = `        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="border border-slate-300 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-4 border-b border-slate-200 pb-2">สรุปผลกำไร-ขาดทุน (P&L)</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>รายรับรวม (Sales)</span>
                <span className="font-bold text-lg text-emerald-600">฿{stats.totalSales.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2 mb-2">
                <span>รายจ่าย (PO)</span>
                <span className="font-bold text-lg text-rose-600">- ฿{stats.totalExpense.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">กำไรสุทธิ (Net Profit)</span>
                <span className={\`font-bold text-xl \${stats.totalNet >= 0 ? 'text-indigo-600' : 'text-red-600'}\`}>
                  {stats.totalNet >= 0 ? '' : '-'}฿{Math.abs(stats.totalNet).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="border border-slate-300 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-4 border-b border-slate-200 pb-2">ยอดขายสุทธิ แยกตามช่องทางชำระเงิน</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>เงินสด</span>
                <span>฿{stats.totalCash.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>โอนเงิน</span>
                <span>฿{stats.totalTransfer.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>ค้าง/COD</span>
                <span>฿{stats.totalCod.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>`;

content = content.replace(
  /        <div className="grid grid-cols-2 gap-8 mb-8">[\s\S]*?          <\/div>\n        <\/div>/,
  printableReport
);

fs.writeFileSync('src/components/FinancialDashboard.jsx', content, 'utf8');
console.log("Successfully patched FinancialDashboard for P&L");
