const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

const regex = /<div className=\{\`bg-white border-2 \$\{st === 'รอการยืนยัน' \? 'border-amber-200 shadow-amber-100\/50' : st === 'ยืนยันแล้ว' \? 'border-blue-200 shadow-blue-100\/50' : st === 'กำลังใช้บริการ' \? 'border-purple-300 shadow-purple-100\/50 ring-2 ring-purple-100' : st === 'เสร็จสิ้น' \? 'border-emerald-200 shadow-emerald-100\/50' : 'border-gray-200'\} rounded-\[24px\] p-5 shadow-md hover:shadow-xl transition-all w-full max-w-md relative overflow-hidden\`\>[^]*?<\/div>\s*<\/div>\s*<\/div>/;

const compactBlock = `<div className={\`bg-white border \${st === 'รอการยืนยัน' ? 'border-amber-200 shadow-amber-100/50' : st === 'ยืนยันแล้ว' ? 'border-blue-200 shadow-blue-100/50' : st === 'กำลังใช้บริการ' ? 'border-purple-300 shadow-purple-100/50 ring-1 ring-purple-100' : st === 'เสร็จสิ้น' ? 'border-emerald-200 shadow-emerald-100/50' : 'border-gray-200'} rounded-2xl p-3 shadow-sm hover:shadow-md transition-all w-full max-w-sm relative overflow-hidden\`}>
                                                            <div className={\`absolute top-0 left-0 w-1.5 h-full \${st === 'รอการยืนยัน' ? 'bg-amber-400' : st === 'ยืนยันแล้ว' ? 'bg-blue-400' : st === 'กำลังใช้บริการ' ? 'bg-purple-500' : st === 'เสร็จสิ้น' ? 'bg-emerald-400' : 'bg-gray-300'}\`}></div>
                                                            <div className="flex justify-between items-start mb-1.5 pl-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={\`font-mono text-sm font-black \${isPast ? 'text-red-500' : 'text-gray-900'}\`}>{dtSafe ? dtSafe.split('T')[1]?.substring(0,5) : ''}</span>
                                                                    <span className="text-[10px] text-gray-500 font-bold"><MapPin size={10} className="inline mr-0.5 mb-0.5"/>{String(b.branch || 'เฉวง')}</span>
                                                                </div>
                                                                <select value={st} onChange={(e) => updateBookingStatus(b.id, e.target.value)} className={\`px-1.5 py-0.5 rounded text-[10px] font-bold border cursor-pointer outline-none \${st === 'รอการยืนยัน' ? 'bg-amber-50 text-amber-600 border-amber-200' : st === 'ยืนยันแล้ว' ? 'bg-blue-50 text-blue-600 border-blue-200' : st === 'กำลังใช้บริการ' ? 'bg-purple-50 text-purple-600 border-purple-200' : st === 'เสร็จสิ้น' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'}\`}>
                                                                    <option value="รอการยืนยัน">รอการยืนยัน</option><option value="ยืนยันแล้ว">ยืนยันแล้ว</option><option value="กำลังใช้บริการ">กำลังใช้บริการ</option><option value="เสร็จสิ้น">เสร็จสิ้น</option><option value="ยกเลิก">ยกเลิก</option>
                                                                </select>
                                                            </div>
                                                            <div className="pl-2">
                                                                <h4 className="font-black text-blue-700 text-[13px] leading-tight mb-2 line-clamp-1" title={String(b.courseName || '-')}>{String(b.courseName || '-')}</h4>
                                                                <div className="flex items-center justify-between mt-1 pt-2 border-t border-gray-50">
                                                                    <div className="flex items-center">
                                                                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mr-2 shrink-0 overflow-hidden border border-gray-200">
                                                                            {picData ? <img src={picData.primary} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => handleProfileImgError(e, picData.fallback, 'block')} /> : null}
                                                                            <Users size={12} className={picData ? "hidden" : ""} />
                                                                        </div>
                                                                        <div><p className="font-bold text-gray-800 text-[11px] leading-tight">{String(b.customerName || '-')}</p><p className="font-mono text-[9px] text-gray-500">{String(b.customerPhone || '-')}</p></div>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <button onClick={() => setBookingTicket(b)} className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-blue-600 rounded-lg transition-colors" title="เปิด QR"><QrCode size={14}/></button>
                                                                        <button onClick={() => setActionConfirmModal({ isOpen: true, title: 'ลบนัดหมาย', message: 'แน่ใจหรือไม่ที่จะลบรายการนัดหมายนี้?', action: () => executeDeleteBooking(b.id), confirmText: 'ลบ', confirmColor: 'bg-red-600 hover:bg-red-700' })} className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>`;

if (regex.test(content)) {
    content = content.replace(regex, compactBlock);
    fs.writeFileSync('src/App.jsx', content, 'utf8');
    console.log("Applied compact timeline UI");
} else {
    console.log("Could not find timeline UI");
}
