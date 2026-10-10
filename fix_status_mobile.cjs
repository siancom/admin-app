const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

const regexTimeline = /<div className=\{`px-2 py-0\.5 rounded text-\[9px\] font-bold border \$\{st === 'รอการยืนยัน' \? 'bg-amber-50 text-amber-600 border-amber-300' : st === 'ยืนยันแล้ว' \? 'bg-blue-50 text-blue-600 border-blue-300' : st === 'กำลังใช้บริการ' \? 'bg-purple-50 text-purple-600 border-purple-300' : st === 'เสร็จสิ้น' \? 'bg-emerald-50 text-emerald-600 border-emerald-300' : 'bg-gray-50 text-gray-600 border-gray-300'\}`\}>\s*\{st\}\s*<\/div>/g;

const replacementTimeline = `<select value={st} onChange={(e) => updateBookingStatus(b.id, e.target.value)} onClick={(e) => e.stopPropagation()} className={\`px-2 py-0.5 rounded text-[9px] font-bold border outline-none appearance-none cursor-pointer \${st === 'รอการยืนยัน' ? 'bg-amber-50 text-amber-600 border-amber-300' : st === 'ยืนยันแล้ว' ? 'bg-blue-50 text-blue-600 border-blue-300' : st === 'กำลังใช้บริการ' ? 'bg-purple-50 text-purple-600 border-purple-300' : st === 'เสร็จสิ้น' ? 'bg-emerald-50 text-emerald-600 border-emerald-300' : 'bg-gray-50 text-gray-600 border-gray-300'}\`}>
                                                                        <option value="รอการยืนยัน">รอการยืนยัน</option>
                                                                        <option value="ยืนยันแล้ว">ยืนยันแล้ว</option>
                                                                        <option value="กำลังใช้บริการ">กำลังใช้บริการ</option>
                                                                        <option value="เสร็จสิ้น">เสร็จสิ้น</option>
                                                                        <option value="ยกเลิก">ยกเลิก</option>
                                                                    </select>`;

let newContent = content.replace(regexTimeline, replacementTimeline);

const regexOrders = /<div className=\{`px-2 py-0\.5 rounded text-\[9px\] font-bold border \$\{st === 'รออนุมัติ' \? 'bg-amber-50 text-amber-600 border-amber-300' : st === 'อนุมัติแล้ว' \? 'bg-emerald-50 text-emerald-600 border-emerald-300' : 'bg-red-50 text-red-600 border-red-300'\}`\}>\s*\{st === 'รออนุมัติ' \? 'รอดำเนินการ' : st === 'อนุมัติแล้ว' \? 'สำเร็จแล้ว' : 'ยกเลิก'\}\s*<\/div>/g;

const replacementOrders = `<select value={st} onChange={(e) => handleOrderStatusChange(o, e.target.value)} onClick={(e) => e.stopPropagation()} className={\`px-2 py-0.5 rounded text-[9px] font-bold border outline-none appearance-none cursor-pointer \${st === 'รออนุมัติ' ? 'bg-amber-50 text-amber-600 border-amber-300' : st === 'อนุมัติแล้ว' ? 'bg-emerald-50 text-emerald-600 border-emerald-300' : 'bg-red-50 text-red-600 border-red-300'}\`}>
                                 <option value="รออนุมัติ">รอดำเนินการ</option>
                                 <option value="อนุมัติแล้ว">สำเร็จแล้ว</option>
                                 <option value="ยกเลิก">ยกเลิก</option>
                             </select>`;

newContent = newContent.replace(regexOrders, replacementOrders);

fs.writeFileSync('src/App.jsx', newContent, 'utf8');
console.log("Replaced status badges with interactive selects.");
