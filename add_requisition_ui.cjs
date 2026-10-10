const fs = require('fs');

let content = fs.readFileSync('src/components/POSSystem.jsx', 'utf8');

// Add isRequisitionMode state
content = content.replace(
  "  const [isStockMode, setIsStockMode] = useState(false);",
  "  const [isStockMode, setIsStockMode] = useState(false);\n  const [isRequisitionMode, setIsRequisitionMode] = useState(false);"
);

// Turn off Requisition Mode when switching tabs
content = content.replace(
  "    if (activeTab !== 'pos') setIsStockMode(false);",
  "    if (activeTab !== 'pos') {\n      setIsStockMode(false);\n      setIsRequisitionMode(false);\n    }"
);

// Add toggle button for Requisition Mode
let buttonsHTML = `            <button
              onClick={() => { setIsStockMode(!isStockMode); setIsRequisitionMode(false); }}
              className={\`hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all \${isStockMode ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}\`}
            >
              <Package size={20} /> {isStockMode ? (globalRole === 'owner' ? 'ปิดโหมดซื้อเข้า' : 'ปิดโหมดนับสต๊อก') : (globalRole === 'owner' ? 'โหมดเจ้าของร้านซื้อเข้า' : 'โหมดนับสต๊อก')}
            </button>
            {globalRole !== 'owner' && (
              <button
                onClick={() => { setIsRequisitionMode(!isRequisitionMode); setIsStockMode(false); }}
                className={\`hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all \${isRequisitionMode ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}\`}
              >
                <Truck size={20} /> {isRequisitionMode ? 'ปิดโหมดเบิกสินค้า' : 'โหมดเบิกสินค้าจากศูนย์ใหญ่'}
              </button>
            )}`;

content = content.replace(
  /<button\n              onClick=\{\(\) => setIsStockMode\(!isStockMode\)\}\n              className=\{`hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all \$\{isStockMode \? '\(globalRole === \\'owner\\' \? \\'ปิดโหมดซื้อเข้า\\' : \\'ปิดโหมดนับสต๊อก\\'\)' : '\(globalRole === \\'owner\\' \? \\'โหมดเจ้าของร้านซื้อเข้า\\' : \\'โหมดนับสต๊อก\\'\)'\}`\}\n            >[\s\S]*?<\/button>/,
  buttonsHTML
);
// Wait, my regex might fail because of the template literals and ternary operators.
// Let's use simple string replace for the button block.
content = content.replace(
  `            <button
              onClick={() => setIsStockMode(!isStockMode)}
              className={\`hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all \${isStockMode ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}\`}
            >
              <Package size={20} /> {isStockMode ? (globalRole === 'owner' ? 'ปิดโหมดซื้อเข้า' : 'ปิดโหมดนับสต๊อก') : (globalRole === 'owner' ? 'โหมดเจ้าของร้านซื้อเข้า' : 'โหมดนับสต๊อก')}
            </button>`,
  buttonsHTML
);

// Update product grid background and header
let gridHeader = `        <div className={\`flex-1 overflow-y-auto p-2 sm:p-4 bg-slate-50/50 \${(isStockMode || isRequisitionMode) ? 'pb-36' : 'pb-28'}\`}>
          {isStockMode && globalRole === 'owner' && (
            <div className="mb-6 p-4 sm:p-6 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-teal-500/10 border border-teal-100 rounded-3xl shadow-sm">
              <h3 className="text-sm font-bold text-teal-700 mb-2">เจ้าของร้านซื้อเข้า (Owner Purchase)</h3>
              <div className="text-xs text-teal-600 font-medium space-y-1">
                <p>• ราคาทุนคิดจากราคาสมาชิก - ส่วนลดเจ้าของร้าน</p>
                <p>• ราคาสมาชิกมาจากคอลัมน์ "ราคาสมาชิก"</p>
                <p>• ถ้าราคาสมาชิกไม่มีค่า จะใช้ราคาปลีกเต็ม</p>
                <p>• สต๊อกที่เพิ่มจะถูกนำเข้าสาขา "เฉวง" ทันที</p>
              </div>
            </div>
          )}
          {isRequisitionMode && globalRole !== 'owner' && (
            <div className="mb-6 p-4 sm:p-6 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 border border-amber-100 rounded-3xl shadow-sm">
              <h3 className="text-sm font-bold text-amber-700 mb-2">เบิกสินค้าจากศูนย์ใหญ่ (Branch Requisition)</h3>
              <div className="text-xs text-amber-600 font-medium space-y-1">
                <p>• สินค้าจะคิดราคาตามต้นทุน</p>
                <p>• เบิกได้ตามจำนวนสต๊อกที่มีในสาขา "เฉวง"</p>
                <p>• สต๊อกสาขาปัจจุบันจะเพิ่มขึ้น และสต๊อกศูนย์ใหญ่ (เฉวง) จะลดลง</p>
              </div>
            </div>
          )}`;

content = content.replace(
  `        <div className={\`flex-1 overflow-y-auto p-2 sm:p-4 bg-slate-50/50 \${isStockMode ? 'pb-36' : 'pb-28'}\`}>
          {isStockMode && globalRole === 'owner' && (
            <div className="mb-6 p-4 sm:p-6 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-teal-500/10 border border-teal-100 rounded-3xl shadow-sm">
              <h3 className="text-sm font-bold text-teal-700 mb-2">เจ้าของร้านซื้อเข้า (Owner Purchase)</h3>
              <div className="text-xs text-teal-600 font-medium space-y-1">
                <p>• ราคาทุนคิดจากราคาสมาชิก - ส่วนลดเจ้าของร้าน</p>
                <p>• ราคาสมาชิกมาจากคอลัมน์ "ราคาสมาชิก"</p>
                <p>• ถ้าราคาสมาชิกไม่มีค่า จะใช้ราคาปลีกเต็ม</p>
              </div>
            </div>
          )}`,
  gridHeader
);

// Update map variables and onClick
let mapVariables = `                } else if (productName) {
                  imageUrl = \`https://crm.irisnatures.com/สินค้า_Images/\${encodeURIComponent(productName)}.jpg\`;
                }

                const isOwnerPurchase = isStockMode && globalRole === 'owner';
                const isBranchReq = isRequisitionMode && globalRole !== 'owner';
                const isSpecialMode = isOwnerPurchase || isBranchReq;
                
                const costPrice = isSpecialMode ? computeOwnerCostPrice(p) : 0;
                const discountRate = isSpecialMode ? getOwnerDiscountRate(p) : 0;
                const memberPrice = parseNumber(getFuzzyKey(p, ["ราคาสมาชิก", "col_10"]));
                const originalCostBasePrice = memberPrice > 0 ? memberPrice : fullPrice;

                return (
                <div 
                  key={p.id} 
                  onClick={() => isOwnerPurchase ? addToCart(p, 'product', 'owner_purchase') : isBranchReq ? addToCart(p, 'product', 'branch_requisition') : isStockMode ? setStockInputModal({ isOpen: true, item: p, inputVal: '' }) : addToCart(p, 'product')}
                  className={\`bg-white p-2 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border cursor-pointer transition-all flex flex-col h-full \${isSpecialMode ? "border-slate-100 hover:shadow-md hover:border-teal-200 active:scale-95" : isStockMode ? (stockAdjustments.some(a => a.id === p.id) ? "border-emerald-500 opacity-70" : "border-rose-400 animate-pulse shadow-[0_0_15px_rgba(251,113,133,0.3)]") : "border-slate-100 hover:shadow-md hover:border-indigo-200 active:scale-95"}\`}
                >`;

content = content.replace(
  `                } else if (productName) {
                  imageUrl = \`https://crm.irisnatures.com/สินค้า_Images/\${encodeURIComponent(productName)}.jpg\`;
                }

                const isOwnerPurchase = isStockMode && globalRole === 'owner';
                const costPrice = isOwnerPurchase ? computeOwnerCostPrice(p) : 0;
                const discountRate = isOwnerPurchase ? getOwnerDiscountRate(p) : 0;
                const memberPrice = parseNumber(getFuzzyKey(p, ["ราคาสมาชิก", "col_10"]));
                const originalCostBasePrice = memberPrice > 0 ? memberPrice : fullPrice;

                return (
                <div 
                  key={p.id} 
                  onClick={() => isOwnerPurchase ? addToCart(p, 'product', 'owner_purchase') : isStockMode ? setStockInputModal({ isOpen: true, item: p, inputVal: '' }) : addToCart(p, 'product')}
                  className={\`bg-white p-2 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border cursor-pointer transition-all flex flex-col h-full \${isOwnerPurchase ? "border-slate-100 hover:shadow-md hover:border-teal-200 active:scale-95" : isStockMode ? (stockAdjustments.some(a => a.id === p.id) ? "border-emerald-500 opacity-70" : "border-rose-400 animate-pulse shadow-[0_0_15px_rgba(251,113,133,0.3)]") : "border-slate-100 hover:shadow-md hover:border-indigo-200 active:scale-95"}\`}
                >`,
  mapVariables
);

// Update CheckCircle
content = content.replace(
  `{!isOwnerPurchase && isStockMode && stockAdjustments.some(a => a.id === p.id) && (`,
  `{!isSpecialMode && isStockMode && stockAdjustments.some(a => a.id === p.id) && (`
);

// Update price rendering logic in card
let priceHTML = `                  <div className="mt-2 sm:mt-3 flex flex-col xl:flex-row xl:items-end justify-between gap-1">
                    {isSpecialMode ? (
                      <div className={\`\${isOwnerPurchase ? 'text-teal-600' : 'text-amber-600'} font-bold text-xs sm:text-sm flex flex-col gap-0.5\`}>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-normal">ปกติ:</span>
                          <del className="text-slate-400 text-[10px] sm:text-xs font-normal">฿{originalCostBasePrice.toLocaleString()}</del>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                          <span>฿{costPrice.toLocaleString()}</span>
                          <span className={\`\${isOwnerPurchase ? 'bg-teal-50 text-teal-700 border-teal-100' : 'bg-amber-50 text-amber-700 border-amber-100'} text-[9px] font-bold px-1.5 py-0.5 rounded border\`}>ต้นทุน (ลด {Math.round(discountRate * 100)}%)</span>
                        </div>
                      </div>
                    ) : (`;

content = content.replace(
  `                  <div className="mt-2 sm:mt-3 flex flex-col xl:flex-row xl:items-end justify-between gap-1">
                    {isOwnerPurchase ? (
                      <div className="text-teal-600 font-bold text-xs sm:text-sm flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-normal">ปกติ:</span>
                          <del className="text-slate-400 text-[10px] sm:text-xs font-normal">฿{originalCostBasePrice.toLocaleString()}</del>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                          <span>฿{costPrice.toLocaleString()}</span>
                          <span className="bg-teal-50 text-teal-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-teal-100">ต้นทุน (ลด {Math.round(discountRate * 100)}%)</span>
                        </div>
                      </div>
                    ) : (`,
  priceHTML
);

fs.writeFileSync('src/components/POSSystem.jsx', content, 'utf8');
console.log("Requisition UI added.");
