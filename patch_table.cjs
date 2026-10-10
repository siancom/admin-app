const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');

const tableStartRegex = /<table className="w-full text-left text-sm whitespace-nowrap">[\s\S]*?<tbody>/;
const tableStartReplacement = `<div className="space-y-3">`;

const emptyRow1Regex = /<tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400 font-bold">ไม่มีประวัติการใช้คอร์สในวันนี้<\/td><\/tr>/g;
const emptyRow1Replacement = `<div className="px-6 py-12 text-center text-gray-400 font-bold bg-white rounded-2xl border border-gray-100">ไม่มีประวัติการใช้คอร์สในวันนี้</div>`;

const usedCourseRowRegex = /<tr key=\{i\} className="hover:bg-gray-50">[\s\S]*?<\/tr>/;
const usedCourseRowReplacement = `<div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-200 transition-colors flex flex-col sm:flex-row sm:items-center gap-3">
                                      <div className="flex justify-between sm:w-48 shrink-0">
                                        <div className="font-bold text-gray-800 truncate">{r['ชื่อลูกค้า']}</div>
                                        <div className="text-gray-400 font-bold text-sm sm:hidden">{r['เวลา'] || '-'}</div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                         <div className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded inline-block text-[10px] mb-1">{r['ประเภท']}</div>
                                         <div className="text-gray-700 text-sm truncate" title={r['รายการ']}>{r['รายการ']}</div>
                                      </div>
                                      <div className="flex justify-between sm:flex-col sm:items-end gap-1 shrink-0 mt-2 sm:mt-0 border-t border-gray-50 sm:border-0 pt-2 sm:pt-0">
                                        <div className="text-gray-500 text-xs flex items-center gap-1">
                                          <User size={12} /> {r['พนักงาน'] || '-'}
                                        </div>
                                        <div className="font-black text-gray-800">{r['จำนวน'] ? \`\${r['จำนวน']} ครั้ง/ชิ้น\` : '-'}</div>
                                      </div>
                                      <div className="hidden sm:block text-gray-400 font-bold text-sm w-16 text-right shrink-0">{r['เวลา'] || '-'}</div>
                                   </div>`;

const emptyRow2Regex = /<tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400 font-bold">ไม่มีประวัติการขายในวันนี้<\/td><\/tr>/g;
const emptyRow2Replacement = `<div className="px-6 py-12 text-center text-gray-400 font-bold bg-white rounded-2xl border border-gray-100">ไม่มีประวัติการขายในวันนี้</div>`;

const newSaleRowRegex = /<tr key=\{i\} className="hover:bg-gray-50">[\s\S]*?<\/tr>/;
const newSaleRowReplacement = `<div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-emerald-200 transition-colors flex flex-col sm:flex-row sm:items-center gap-3">
                                      <div className="flex justify-between sm:w-48 shrink-0">
                                        <div className="font-bold text-gray-800 truncate">{r['ชื่อลูกค้า']}</div>
                                        <div className="text-gray-400 font-bold text-sm sm:hidden">{r['เวลา'] || '-'}</div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                         <div className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded inline-block text-[10px] mb-1">{r['ประเภท']}</div>
                                         <div className="text-gray-700 text-sm truncate" title={r['รายการ']}>{r['รายการ']}</div>
                                      </div>
                                      <div className="flex justify-between sm:flex-col sm:items-end gap-1 shrink-0 mt-2 sm:mt-0 border-t border-gray-50 sm:border-0 pt-2 sm:pt-0">
                                        <div className="text-gray-500 text-xs flex items-center gap-1">
                                          <User size={12} /> {r['พนักงาน'] || '-'}
                                        </div>
                                        <div className="font-black text-emerald-600">฿{Number(r['จำนวนเงิน'] || r['ยอดรวม'] || r['ราคา'] || 0).toLocaleString()}</div>
                                      </div>
                                      <div className="hidden sm:block text-gray-400 font-bold text-sm w-16 text-right shrink-0">{r['เวลา'] || '-'}</div>
                                   </div>`;

const emptyRow3Regex = /<tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400 font-bold">ไม่มีการบันทึกค่ามือในวันนี้<\/td><\/tr>/g;
const emptyRow3Replacement = `<div className="px-6 py-12 text-center text-gray-400 font-bold bg-white rounded-2xl border border-gray-100">ไม่มีการบันทึกค่ามือในวันนี้</div>`;

const serviceLogRowRegex = /<tr key=\{r\.id \|\| i\} className="hover:bg-gray-50">[\s\S]*?<\/tr>/;
const serviceLogRowReplacement = `<div key={r.id || i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-orange-200 transition-colors flex flex-col sm:flex-row sm:items-center gap-3">
                                      <div className="flex justify-between sm:w-48 shrink-0">
                                        <div className="font-bold text-gray-800 truncate">-</div>
                                        <div className="text-gray-400 font-bold text-sm sm:hidden">{new Date(r.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                         <div className="font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded inline-block text-[10px] mb-1">{r.type}</div>
                                         {r.note && <div className="text-gray-500 text-xs mt-1 truncate" title={r.note}>{r.note}</div>}
                                      </div>
                                      <div className="flex justify-between sm:flex-col sm:items-end gap-1 shrink-0 mt-2 sm:mt-0 border-t border-gray-50 sm:border-0 pt-2 sm:pt-0">
                                        <div className="text-gray-500 text-xs flex items-center gap-1">
                                          <User size={12} /> {r.employeeName}
                                        </div>
                                        <div className="font-black text-orange-600">฿{Number(r.amount || 0).toLocaleString()}</div>
                                      </div>
                                      <div className="hidden sm:block text-gray-400 font-bold text-sm w-16 text-right shrink-0">{new Date(r.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div>
                                   </div>`;

const tableEndRegex = /<\/tbody>\n\s*<\/table>/;
const tableEndReplacement = `</div>`;

// Apply regex
content = content.replace(tableStartRegex, tableStartReplacement);
content = content.replace(emptyRow1Regex, emptyRow1Replacement);
content = content.replace(usedCourseRowRegex, usedCourseRowReplacement); // Replace first row template
content = content.replace(emptyRow2Regex, emptyRow2Replacement);
content = content.replace(newSaleRowRegex, newSaleRowReplacement); // Replace second row template
content = content.replace(emptyRow3Regex, emptyRow3Replacement);
content = content.replace(serviceLogRowRegex, serviceLogRowReplacement); // Replace third row template
content = content.replace(tableEndRegex, tableEndReplacement);

// Fix wrapper
content = content.replace(/<div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">/, '<div className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-4 bg-slate-50">');
content = content.replace(/<thead className="bg-gray-50 text-gray-500 font-bold sticky top-0 z-10 shadow-sm">[\s\S]*?<\/thead>/, '');

fs.writeFileSync('src/App.jsx', content, 'utf8');
