const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// Find the Timeline card block
const timelineRegex = /<div className="flex-1 p-2\.5 pl-4 flex flex-col justify-between">[\s\S]*?<div className="flex items-center gap-1\.5 text-right bg-gray-50 px-1\.5 py-1 rounded-lg border border-gray-100">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/;

const newTimelineBlock = `<div className="flex-1 p-2.5 pl-4 flex flex-col justify-between">
                                                                <div className="flex justify-between items-start mb-1.5">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-gray-400 overflow-hidden border border-gray-200 shrink-0 shadow-sm">
                                                                            {picData ? <img src={picData.primary} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => handleProfileImgError(e, picData.fallback, 'block')} /> : <Users size={10} />}
                                                                        </div>
                                                                        <p className="font-bold text-gray-800 text-[11px] leading-tight truncate max-w-[100px]">{String(b.customerName || '-').split(' ')[0]}</p>
                                                                    </div>
                                                                    <div className={\`px-2 py-0.5 rounded text-[9px] font-bold border \${st === 'รอการยืนยัน' ? 'bg-amber-50 text-amber-600 border-amber-300' : st === 'ยืนยันแล้ว' ? 'bg-blue-50 text-blue-600 border-blue-300' : st === 'กำลังใช้บริการ' ? 'bg-purple-50 text-purple-600 border-purple-300' : st === 'เสร็จสิ้น' ? 'bg-emerald-50 text-emerald-600 border-emerald-300' : 'bg-gray-50 text-gray-600 border-gray-300'}\`}>
                                                                        {st}
                                                                    </div>
                                                                </div>
                                                                
                                                                <h4 className={\`font-black text-[14px] leading-tight mb-2 line-clamp-1 \${st === 'รอการยืนยัน' ? 'text-amber-600' : st === 'ยืนยันแล้ว' ? 'text-blue-600' : st === 'กำลังใช้บริการ' ? 'text-purple-600' : st === 'เสร็จสิ้น' ? 'text-emerald-600' : 'text-gray-600'}\`} title={String(b.courseName || '-')}>
                                                                    {String(b.courseName || '-')}
                                                                </h4>
                                                                
                                                                <div className="flex justify-between items-end mt-auto">
                                                                    <div>
                                                                        <p className="text-[8px] font-bold text-gray-400 mb-0.5">วันที่</p>
                                                                        <p className="font-black text-gray-800 text-[11px]">{dtSafe ? new Date(dtSafe).toLocaleDateString('th-TH', {day: 'numeric', month: 'numeric', year: 'numeric'}) : '-'}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[8px] font-bold text-gray-400 mb-0.5">เวลา</p>
                                                                        <p className={\`font-black text-[15px] leading-none \${st === 'รอการยืนยัน' ? 'text-amber-500' : st === 'ยืนยันแล้ว' ? 'text-blue-500' : st === 'กำลังใช้บริการ' ? 'text-purple-500' : st === 'เสร็จสิ้น' ? 'text-emerald-500' : 'text-gray-500'}\`}>
                                                                            {dtSafe ? dtSafe.split('T')[1]?.substring(0,5) : '-'} <span className="text-[9px]">น.</span>
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                                                                        <MapPin size={10} className="text-gray-400" />
                                                                        <p className="font-bold text-gray-700 text-[9px] leading-tight truncate max-w-[60px]">{String(b.branch || 'เฉวง')}</p>
                                                                    </div>
                                                                </div>
                                                            </div>`;

let newContent = content.replace(timelineRegex, newTimelineBlock);
if (newContent !== content) {
    fs.writeFileSync('src/App.jsx', newContent, 'utf8');
    console.log("Successfully replaced the Timeline card HTML.");
} else {
    console.log("Failed to match the Timeline regex.");
}
