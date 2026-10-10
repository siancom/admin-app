const fs = require('fs');

function main() {
    let content = fs.readFileSync('src/components/POSSystem.jsx', 'utf8');

    // 1. Add state variables for stock mode
    const state_marker = "  const [paymentPhotoUrl, setPaymentPhotoUrl] = useState(null);";
    const state_injection = `
  // Stock Adjustment Mode
  const [isStockMode, setIsStockMode] = useState(false);
  const [stockAdjustments, setStockAdjustments] = useState([]);
  const [isStockConfirmModalOpen, setIsStockConfirmModalOpen] = useState(false);
  const [stockInputModal, setStockInputModal] = useState({ isOpen: false, item: null, inputVal: '' });
`;
    content = content.replace(state_marker, state_marker + state_injection);

    // 2. Extract Customer Selection UI
    const start_marker = '        {/* Customer Selection */}';
    const end_marker = '                        </div>\n                      ))\n                    ) : (\n                      <div className="px-4 py-3 text-center text-slate-500">ไม่พบลูกค้า</div>\n                    )}\n                  </div>\n                )}\n              </div>\n            )}\n          </div>\n        </div>';
    
    let start_idx = content.indexOf(start_marker);
    let end_idx = content.indexOf(end_marker);
    if (start_idx !== -1 && end_idx !== -1) {
        end_idx += end_marker.length;
        const customer_block = content.substring(start_idx, end_idx);
        
        const replacement = `        {/* Customer Selection (Desktop/Cart View) */}
        <div className="hidden lg:block shrink-0 z-[60]">
          {customerSelectionUI}
        </div>`;
        content = content.substring(0, start_idx) + replacement + content.substring(end_idx);
        
        const customer_ui = `
  const customerSelectionUI = (
    <>
${customer_block}
    </>
  );
`;
        const return_idx = content.indexOf("  return (");
        content = content.substring(0, return_idx) + customer_ui + "\n" + content.substring(return_idx);

        const main_top_marker = "      <div className=\"flex-1 flex flex-col h-full border-r border-slate-200\">\n        <div className=\"p-4 bg-white border-b border-slate-200 shrink-0\">";
        const mobile_injection = `
        {/* Customer Selection (Mobile Main View) */}
        <div className="block lg:hidden z-[60] mb-4 relative">
          {customerSelectionUI}
        </div>
`;
        content = content.replace(main_top_marker, main_top_marker + mobile_injection);
    }

    // 3. Add Stock Toggle Button
    const search_marker = '<div className="relative hidden lg:block">';
    const toggle_btn = `
          {activeTab === 'products' && (
            <button
              onClick={() => setIsStockMode(!isStockMode)}
              className={\`hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all \${isStockMode ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}\`}
            >
              <Package size={20} /> {isStockMode ? 'ปิดโหมดนับสต๊อก' : 'โหมดนับสต๊อก'}
            </button>
          )}
`;
    content = content.replace(search_marker, toggle_btn + "          " + search_marker);

    const mobile_back_marker = "{onClosePos && (\n              <button onClick={onClosePos}";
    const mobile_toggle = `
            {activeTab === 'products' && (
              <button
                onClick={() => setIsStockMode(!isStockMode)}
                className={\`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center transition-all \${isStockMode ? 'bg-rose-500 text-white shadow-md' : 'bg-white border border-indigo-100 text-indigo-600 shadow-sm'}\`}
              >
                <Package size={20} />
              </button>
            )}
`;
    content = content.replace(mobile_back_marker, mobile_toggle + "            " + mobile_back_marker);

    // 4. Update Product Card
    const card_marker = "onClick={() => addToCart(p, 'product')}";
    const card_replacement = "onClick={() => isStockMode ? setStockInputModal({ isOpen: true, item: p, inputVal: '' }) : addToCart(p, 'product')}";
    content = content.replace(card_marker, card_replacement);

    const card_class_marker = 'className="bg-white p-2 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md border border-slate-100 cursor-pointer transition-all active:scale-95 flex flex-col h-full"';
    const card_class_replacement = 'className={`bg-white p-2 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border cursor-pointer transition-all flex flex-col h-full ${isStockMode ? (stockAdjustments.some(a => a.id === p.id) ? "border-emerald-500 opacity-70" : "border-rose-400 animate-pulse shadow-[0_0_15px_rgba(251,113,133,0.3)]") : "border-slate-100 hover:shadow-md hover:border-indigo-200 active:scale-95"}`}';
    content = content.replace(card_class_marker, card_class_replacement);

    const img_marker = '                  <div className="absolute inset-0 bg-emerald-500/20 z-10 flex items-center justify-center backdrop-blur-[1px]">\n                    <CheckCircle size={40} className="text-white drop-shadow-md" />\n                  </div>\n                )}';
    const img_replacement = img_marker + '\n                {isStockMode && stockAdjustments.some(a => a.id === p.id) && (\n                  <div className="absolute inset-0 bg-emerald-500/20 z-10 flex items-center justify-center backdrop-blur-[1px]">\n                    <CheckCircle size={40} className="text-emerald-600 bg-white rounded-full drop-shadow-md" />\n                  </div>\n                )}';
    content = content.replace(img_marker, img_replacement);

    // 5. Mobile Cart Button Toggle
    const cart_start_marker = "        {/* Floating Mobile Cart Button */}";
    const stock_cart_ui = `
        {isStockMode ? (
          <>
          {/* Mobile: View Stock Adjustments Button */}
          <div className="lg:hidden p-4 bg-white border-t border-slate-200 shrink-0 pb-safe">
            <button 
              onClick={() => setIsMobileCartOpen(true)}
              className="w-full bg-rose-600 text-white rounded-2xl py-4 font-black text-lg shadow-lg shadow-rose-200 flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              <Package size={24} /> 
              รายการนับสต๊อก 
              <span className="bg-white text-rose-600 px-2 py-0.5 rounded-lg text-sm">{stockAdjustments.length}</span>
            </button>
          </div>
          </>
        ) : (
          <>
`;
    content = content.replace(cart_start_marker, stock_cart_ui + "        " + cart_start_marker);

    const cart_end_marker = "          </button>\n        </div>";
    content = content.replace(cart_end_marker, cart_end_marker + "\n          </>\n        )}");

    // 6. Right Cart Side Toggle
    const cart_side_marker = '        <div className="lg:hidden p-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 sticky top-0 z-10">';
    const stock_cart_side = `
        {isStockMode ? (
          <>
          {/* Mobile Close Button (Stock) */}
          <div className="lg:hidden p-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 sticky top-0 z-10">
             <button onClick={() => setIsMobileCartOpen(false)} className="flex items-center gap-1 text-rose-600 font-bold active:scale-95 transition-transform">
                <ChevronLeft size={24} /> <span>กลับ</span>
             </button>
             <h2 className="font-black text-lg text-slate-800 flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
               <Package size={20} className="text-rose-600" /> รายการนับสต๊อก
             </h2>
             <div className="w-16"></div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
            {stockAdjustments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <span className="text-6xl mb-4 opacity-50">🎯</span>
                <p className="text-lg font-bold text-slate-500 mt-4">ยังไม่มีรายการนับสต๊อก</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {stockAdjustments.map((item) => (
                  <div key={item.id} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between relative overflow-hidden">
                    <div className="flex-1 min-w-0 pr-3">
                      <h4 className="font-bold text-slate-800 text-sm truncate">{item.name}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <span className="text-slate-500">เดิม: <span className="font-bold text-slate-700">{item.oldStock}</span></span>
                        <span className="text-slate-300">→</span>
                        <span className="text-slate-500">ใหม่: <span className="font-black text-rose-600">{item.newStock}</span></span>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-3">
                      <div className={\`font-black text-lg w-10 text-right \${item.diff > 0 ? 'text-emerald-500' : item.diff < 0 ? 'text-rose-500' : 'text-slate-400'}\`}>
                        {item.diff > 0 ? '+' : ''}{item.diff}
                      </div>
                      <button 
                        onClick={() => setStockAdjustments(prev => prev.filter(a => a.id !== item.id))}
                        className="p-2 text-slate-400 hover:text-rose-500 transition-colors rounded-full hover:bg-rose-50 active:scale-95"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-4 bg-white border-t border-slate-200 shrink-0 pb-safe">
            <button 
              onClick={() => setIsStockConfirmModalOpen(true)}
              disabled={stockAdjustments.length === 0}
              className="w-full py-4 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-2xl font-black text-lg shadow-lg shadow-rose-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
            >
              <CheckCircle size={24} /> ตรวจสอบและยืนยัน
            </button>
          </div>
          </>
        ) : (
          <>
`;
    content = content.replace(cart_side_marker, stock_cart_side + "        " + cart_side_marker);

    const cart_end = "      </div>\n    </div>\n    \n    {/* Payment Modal */}";
    content = content.replace(cart_end, "          </>\n        )}\n" + cart_end);

    // 7. Modals
    const modals = `
    {/* Stock Input Modal */}
    {stockInputModal.isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 relative zoom-in-95 animate-in">
          <button onClick={() => setStockInputModal({ isOpen: false, item: null, inputVal: '' })} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full p-2 transition-colors">
            <X size={20} />
          </button>
          
          <div className="text-center mb-6 mt-2">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package size={32} className="text-rose-500" />
            </div>
            <h3 className="text-xl font-black text-slate-800 leading-tight">{String(getFuzzyKey(stockInputModal.item, ["ชื่อสินค้า", "col_2"]))}</h3>
            <p className="text-sm text-slate-500 mt-1">รหัส: {String(getFuzzyKey(stockInputModal.item, ["รหัส", "col_1"]))}</p>
          </div>
          
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">นับสต๊อกได้จริง (ชิ้น)</label>
            <input 
              type="number"
              min="0"
              autoFocus
              className="w-full text-center text-4xl font-black py-4 bg-slate-50 border-2 border-slate-200 focus:border-rose-400 rounded-2xl outline-none transition-colors"
              value={stockInputModal.inputVal}
              onChange={(e) => setStockInputModal(prev => ({ ...prev, inputVal: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && stockInputModal.inputVal !== '') {
                  const newStock = Number(stockInputModal.inputVal);
                  const oldStock = getBranchStock(stockInputModal.item, globalBranch || 'สำนักงานใหญ่');
                  setStockAdjustments(prev => {
                    const existing = prev.filter(a => a.id !== stockInputModal.item.id);
                    return [...existing, { 
                      id: stockInputModal.item.id, 
                      name: String(getFuzzyKey(stockInputModal.item, ["ชื่อสินค้า", "col_2"])),
                      oldStock, 
                      newStock, 
                      diff: newStock - oldStock,
                      originalItem: stockInputModal.item
                    }];
                  });
                  setStockInputModal({ isOpen: false, item: null, inputVal: '' });
                }
              }}
            />
          </div>
          
          <button 
            onClick={() => {
              if (stockInputModal.inputVal === '') return;
              const newStock = Number(stockInputModal.inputVal);
              const oldStock = getBranchStock(stockInputModal.item, globalBranch || 'สำนักงานใหญ่');
              setStockAdjustments(prev => {
                const existing = prev.filter(a => a.id !== stockInputModal.item.id);
                return [...existing, { 
                  id: stockInputModal.item.id, 
                  name: String(getFuzzyKey(stockInputModal.item, ["ชื่อสินค้า", "col_2"])),
                  oldStock, 
                  newStock, 
                  diff: newStock - oldStock,
                  originalItem: stockInputModal.item
                }];
              });
              setStockInputModal({ isOpen: false, item: null, inputVal: '' });
            }}
            disabled={stockInputModal.inputVal === ''}
            className="w-full py-4 bg-rose-500 hover:bg-rose-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-black text-lg shadow-lg shadow-rose-200 transition-all active:scale-95"
          >
            บันทึก
          </button>
        </div>
      </div>
    )}

    {/* Stock Confirm Modal */}
    {isStockConfirmModalOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl relative flex flex-col max-h-[90vh] zoom-in-95 animate-in">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Package className="text-rose-500" /> ยืนยันการปรับปรุงสต๊อก
            </h3>
            <button onClick={() => setIsStockConfirmModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors bg-slate-50 hover:bg-slate-100">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-5 overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-3 font-bold rounded-tl-xl">รายการสินค้า</th>
                  <th className="p-3 font-bold text-center">สต๊อกเดิม</th>
                  <th className="p-3 font-bold text-center">สต๊อกใหม่</th>
                  <th className="p-3 font-bold text-center rounded-tr-xl">ผลต่าง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockAdjustments.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-sm text-slate-800">{item.name}</td>
                    <td className="p-3 text-center text-slate-600 font-medium">{item.oldStock}</td>
                    <td className="p-3 text-center text-rose-600 font-black">{item.newStock}</td>
                    <td className="p-3 text-center">
                      <span className={\`px-2 py-1 rounded-md text-xs font-bold \${item.diff > 0 ? 'bg-emerald-50 text-emerald-600' : item.diff < 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}\`}>
                        {item.diff > 0 ? '+' : ''}{item.diff}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-5 border-t border-slate-100 shrink-0 flex gap-3 pb-safe">
            <button 
              onClick={() => setIsStockConfirmModalOpen(false)}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-colors"
            >
              ยกเลิก
            </button>
            <button 
              onClick={async () => {
                try {
                  const db = getFirestore();
                  const batch = writeBatch(db);
                  
                  for (const adj of stockAdjustments) {
                    const pRef = doc(db, 'products', adj.id);
                    if (globalBranch && globalBranch !== 'สำนักงานใหญ่' && globalBranch !== 'เฉวง') {
                      batch.update(pRef, { [\`จำนวนคงเหลือ_\${globalBranch}\`]: String(adj.newStock) });
                    } else {
                      batch.update(pRef, { "จำนวนคงเหลือ": String(adj.newStock) });
                    }
                  }
                  
                  await batch.commit();
                  showToast('อัปเดตสต๊อกเรียบร้อยแล้ว');
                  setStockAdjustments([]);
                  setIsStockConfirmModalOpen(false);
                  setIsStockMode(false);
                } catch(e) {
                  showToast('เกิดข้อผิดพลาดในการอัปเดตสต๊อก');
                }
              }}
              className="flex-[2] py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black shadow-lg shadow-rose-200 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle size={20} /> ยืนยันการอัปเดตสต๊อก
            </button>
          </div>
        </div>
      </div>
    )}
`;
    const final_return = "    </>\n  );\n}";
    content = content.replace(final_return, modals + "\n" + final_return);

    fs.writeFileSync('src/components/POSSystem.jsx', content);
}

main();
