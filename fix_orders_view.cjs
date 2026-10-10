const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

const ordersRegex = /<div key=\{idx\} className="bg-white border border-gray-100 rounded-\[24px\] p-5 shadow-sm hover:shadow-lg transition-all flex flex-col relative overflow-hidden group">[\s\S]*?<button onClick=\{\(\) => setActionConfirmModal\([^>]*\)><Trash2 size=\{14\} className="mr-1 hidden sm:block"\/> ลบ<\/button>\s*<\/div>\s*<\/div>\s*<\/div>/;

const newOrderBlock = `<div key={idx} className={\`bg-white border \${st === 'รออนุมัติ' ? 'border-amber-200 shadow-amber-100/50' : st === 'อนุมัติแล้ว' ? 'border-emerald-200 shadow-emerald-100/50' : 'border-red-200 shadow-red-100/50'} rounded-xl shadow-sm hover:shadow-md transition-all flex cursor-pointer relative overflow-hidden group\`} onClick={() => setOrderTicket(o)}>
                     <div className={\`absolute top-0 left-0 w-2 h-full \${st === 'รออนุมัติ' ? 'bg-amber-400' : st === 'อนุมัติแล้ว' ? 'bg-emerald-400' : 'bg-red-400'}\`}></div>
                     
                     <div className="flex-1 p-2.5 pl-4 flex flex-col justify-between">
                         <div className="flex justify-between items-start mb-1.5">
                             <div className="flex items-center gap-1.5">
                                 <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-gray-400 overflow-hidden border border-gray-200 shrink-0 shadow-sm">
                                     {picData ? <img src={picData.primary} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => handleProfileImgError(e, picData.fallback, 'block')} /> : <Users size={10} />}
                                 </div>
                                 <p className="font-bold text-gray-800 text-[11px] leading-tight truncate max-w-[100px]">{String(o.customerName || 'ไม่ระบุชื่อ').split(' ')[0]}</p>
                             </div>
                             <div className={\`px-2 py-0.5 rounded text-[9px] font-bold border \${st === 'รออนุมัติ' ? 'bg-amber-50 text-amber-600 border-amber-300' : st === 'อนุมัติแล้ว' ? 'bg-emerald-50 text-emerald-600 border-emerald-300' : 'bg-red-50 text-red-600 border-red-300'}\`}>
                                 {st === 'รออนุมัติ' ? 'รอดำเนินการ' : st === 'อนุมัติแล้ว' ? 'สำเร็จแล้ว' : 'ยกเลิก'}
                             </div>
                         </div>
                         
                         <h4 className={\`font-black text-[14px] leading-tight mb-2 line-clamp-2 \${st === 'รออนุมัติ' ? 'text-amber-600' : st === 'อนุมัติแล้ว' ? 'text-emerald-600' : 'text-red-600'}\`}>
                            {o.courseName ? String(o.courseName) : (o.cartItems && o.cartItems.length > 0 ? o.cartItems.map(c => \`\${c.name} x\${c.qty || 1}\`).join(', ') : (o.itemName ? String(o.itemName) : '-'))}
                         </h4>
                         
                         <div className="flex flex-wrap gap-1 text-[9px] text-gray-500 mb-2">
                             <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-bold">฿{parseNumber(o.price || o.itemPrice || o.originalPrice || 0).toLocaleString()}</span>
                             <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-1.5 py-0.5 rounded font-bold">เครดิต: ฿{parseNumber(o.credit || o.price || o.itemPrice || 0).toLocaleString()}</span>
                             {o.itemType === 'custom_image' && (
                                <button onClick={(e) => { e.stopPropagation(); window.open(o.customOrderImage || o.slipImage || o.faceImage, '_blank'); }} className="bg-pink-50 text-pink-600 border border-pink-200 px-1.5 py-0.5 rounded font-bold flex items-center hover:bg-pink-100 transition-colors shadow-sm">
                                   <ImageIcon size={10} className="mr-0.5" /> ดูรูป
                                </button>
                             )}
                         </div>
                         
                         <div className="flex justify-between items-end mt-auto">
                             <div>
                                 <p className="text-[8px] font-bold text-gray-400 mb-0.5">วันที่</p>
                                 <p className="font-black text-gray-800 text-[11px]">{new Date(o.createdAt).toLocaleDateString('th-TH', {day: 'numeric', month: 'numeric', year: 'numeric'})}</p>
                             </div>
                             <div>
                                 <p className="text-[8px] font-bold text-gray-400 mb-0.5">เวลา</p>
                                 <p className={\`font-black text-[15px] leading-none \${st === 'รออนุมัติ' ? 'text-amber-500' : st === 'อนุมัติแล้ว' ? 'text-emerald-500' : 'text-red-500'}\`}>
                                     {new Date(o.createdAt).toLocaleTimeString('th-TH', {hour: '2-digit', minute: '2-digit'})} <span className="text-[9px]">น.</span>
                                 </p>
                             </div>
                             <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                                 <MapPin size={10} className="text-gray-400" />
                                 <p className="font-bold text-gray-700 text-[9px] leading-tight truncate max-w-[60px]">{String(o.branch || 'เฉวง')}</p>
                             </div>
                         </div>
                     </div>
                     <div className="w-12 shrink-0 border-l-2 border-dashed border-gray-100 flex flex-col items-center justify-center bg-gray-50/30 hover:bg-gray-100 transition-colors relative">
                         <QrCode size={18} className={\`\${st === 'รออนุมัติ' ? 'text-amber-400' : st === 'อนุมัติแล้ว' ? 'text-emerald-400' : 'text-red-400'}\`} />
                         
                         <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={(e) => {
                               e.stopPropagation();
                               const customer = customersRaw.find(c => String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '') === String(o.customerPhone || ''));
                               let posItems = [];
                               if (o.cartItems && Array.isArray(o.cartItems) && o.cartItems.length > 0) {
                                   posItems = o.cartItems.map((item, i) => ({
                                       id: \`\${o.id}_\${i}\`, name: String(item.name || 'สินค้าจากคำสั่งซื้อ'), price: parseNumber(item.price), qty: parseNumber(item.qty || '1'), type: 'product', skipStockUpdate: true, maxQty: 9999, originalItem: { id: o.id, "ชื่อสินค้า": item.name, "ราคาขาย": item.price }, isManualPrice: true
                                   }));
                               } else {
                                   posItems = [{
                                       id: o.id, name: String(o.courseName || 'สินค้าจากคำสั่งซื้อ'), price: parseNumber(o.price), qty: parseNumber(o.qty || '1'), type: 'product', skipStockUpdate: true, maxQty: 9999, originalItem: { id: o.id, "ชื่อสินค้า": o.courseName, "ราคาขาย": o.price }, isManualPrice: true
                                   }];
                               }
                               const event = new CustomEvent('add-to-pos-cart', { detail: { items: posItems, customer: customer || null } });
                               setActiveTab('pos');
                               setTimeout(() => { window.dispatchEvent(event); showToast('ส่งไปคิดเงินที่ POS สำเร็จ'); }, 100);
                             }} className="p-1 bg-indigo-50 text-indigo-500 hover:bg-indigo-100 rounded-lg transition-colors" title="คิดเงิน (POS)"><ShoppingCart size={10}/></button>
                             <button onClick={(e) => { e.stopPropagation(); setActionConfirmModal({ isOpen: true, title: 'ลบประวัติคำสั่งซื้อ', message: 'ยืนยันการลบประวัติคำสั่งซื้อนี้ทิ้งถาวร ใช่หรือไม่?', action: () => executeDeleteOrder(o.id), confirmText: 'ลบทิ้ง', confirmColor: 'bg-red-600 hover:bg-red-700' }); }} className="p-1 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors" title="ลบ"><Trash2 size={10}/></button>
                         </div>
                     </div>
                  </div>`;

let newContent = content.replace(ordersRegex, newOrderBlock);
if (newContent !== content) {
    fs.writeFileSync('src/App.jsx', newContent, 'utf8');
    console.log("Successfully replaced the Orders card HTML.");
} else {
    console.log("Failed to match the Orders regex.");
}
