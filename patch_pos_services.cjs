const fs = require('fs');
let content = fs.readFileSync('src/components/POSSystem.jsx', 'utf8');

// 1. Add `Scissors` to imports if not exists
if (!content.includes('Scissors,')) {
    content = content.replace(/import \{ \n\s*Search,/, "import { \n  Scissors, Search,");
}

// 2. Add 'services' tab button
const tabsRegex = /<button \n\s*onClick=\{\(\) => setActiveTab\('courses'\)\}[\s\S]*?<\/button>/;
const servicesTabBtn = `<button 
                onClick={() => setActiveTab('courses')}
                className={\`flex-1 py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 \${activeTab === 'courses' ? 'bg-pink-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}\`}
              >
                <Layers size={20} /> ขายคอร์สใหม่
              </button>
              <button 
                onClick={() => setActiveTab('services')}
                className={\`flex-1 py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 \${activeTab === 'services' ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}\`}
              >
                <Scissors size={20} /> บริการอื่นๆ
              </button>`;
if (content.match(tabsRegex)) {
    content = content.replace(tabsRegex, servicesTabBtn);
}

// 3. Render services items in the grid
const gridEndRegex = /\{activeTab === 'my_courses' \? \([\s\S]*?\}\)\n\s*\) : null\}/;
const servicesGridHtml = `
            {activeTab === 'services' ? (
              [{id: 'srv_mole', name: 'จี้ไฝ'}, {id: 'srv_consult', name: 'ประเมินราคา'}].map(srv => (
                <div key={srv.id} onClick={() => addToCart({ id: srv.id, name: srv.name, price: 0 }, 'service')} className="bg-white border border-slate-200 rounded-2xl p-4 cursor-pointer hover:border-orange-500 hover:shadow-md transition-all group flex flex-col h-full">
                  <div className="flex-1 flex flex-col items-center justify-center py-6 gap-3">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                      <Scissors size={32} />
                    </div>
                    <div className="font-bold text-slate-800 text-lg text-center">{srv.name}</div>
                    <div className="text-xs font-medium text-slate-400 text-center">คลิกเพื่อเพิ่มลงตะกร้า<br/>และระบุราคา</div>
                  </div>
                </div>
              ))
            ) : null}`;

if (content.match(gridEndRegex)) {
    const endMatch = content.match(gridEndRegex)[0];
    content = content.replace(gridEndRegex, endMatch.replace(': null}', `: ${servicesGridHtml.replace('{activeTab', '\n            {activeTab').replace(': null}', ': null}')}`));
}

// 4. Update addToCart
const addToCartRegex = /\} else if \(type === 'usage'\) \{/;
const addToCartService = `} else if (type === 'service') {
          return [...prev, { id: item.id, name: item.name, price: item.price || 0, qty: 1, type, maxQty: 99, originalItem: item, isManualPrice: true }];
        } else if (type === 'usage') {`;
content = content.replace(addToCartRegex, addToCartService);

// 5. Check employee required condition in handleCheckout
const handleCheckoutConditionRegex = /const hasCourse = cart\.some\(i => i\.type === 'course'\);/;
const employeeCheckCondition = `const hasCourse = cart.some(i => i.type === 'course');
    const hasService = cart.some(i => i.type === 'service' || i.type === 'usage');
    if (hasService && !paymentStaff) {
      showToast('มีรายการรับบริการในตะกร้า โปรดเลือกพนักงานผู้ให้บริการ', 'error');
      return;
    }`;
content = content.replace(handleCheckoutConditionRegex, employeeCheckCondition);

// 6. Update checkout logic to save service_logs
const courseUsageLogicRegex = /\} \n\s*else if \(item\.type === 'usage'\) \{/;
const serviceLogic = `} 
        else if (item.type === 'service') {
          // Record service history
          const historyRef = doc(getCol('histories'));
          batch.set(historyRef, {
            "วันที่": new Date().toLocaleDateString('th-TH'),
            "เวลา": new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
            "ชื่อลูกค้า": cName,
            "เบอร์โทร": cPhone,
            "หมายเลขคำสั่งซื้อ": orderNo,
            "ประเภท": "รับบริการ",
            "สถานะ": "เรียบร้อย",
            "รายการ": item.name,
            "จำนวน": String(item.qty),
            "ยอดเงิน": String(item.price * item.qty),
            "สาขา": String(globalBranch || "สำนักงานใหญ่"),
            "พนักงาน": paymentStaff
          });

          // Find employee ID for service_logs
          const emp = employees.find(e => e.name === paymentStaff);
          if (emp) {
            const serviceLogRef = doc(getCol('service_logs'));
            batch.set(serviceLogRef, {
              date: new Date().toISOString().split('T')[0],
              type: item.name,
              amount: item.price * item.qty,
              note: \`POS: \${orderNo}\`,
              employeeId: emp.id,
              employeeName: emp.name,
              branch: String(globalBranch || "สำนักงานใหญ่"),
              createdAt: new Date().toISOString()
            });
          }
        }
        else if (item.type === 'usage') {`;
content = content.replace(courseUsageLogicRegex, serviceLogic);

// 7. Make employee selector visible for 'service'
const checkoutModalSelectorRegex = /\{cart\.some\(i => i\.type === 'usage'\) && \(/;
content = content.replace(checkoutModalSelectorRegex, `{cart.some(i => i.type === 'usage' || i.type === 'service') && (`);

// 8. Add icon for service items in cart
const cartIconRegex = /\) : item\.type === 'product' \? \(/;
content = content.replace(cartIconRegex, `) : item.type === 'service' ? (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-orange-100 flex items-center justify-center shrink-0 border border-orange-200">
                        <Scissors size={20} className="text-orange-500" />
                      </div>
                    ) : item.type === 'product' ? (`);

fs.writeFileSync('src/components/POSSystem.jsx', content, 'utf8');
