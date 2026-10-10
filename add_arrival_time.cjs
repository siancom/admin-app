const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

const diffLogic = `
                                           const isRightSide = st === 'เสร็จสิ้น' || st === 'ยกเลิก';
                                           const picData = getProfilePicData(b, customersRaw);
                                           
                                           let timeDiffStr = '';
                                           let timeDiffColor = '';
                                           if ((st === 'กำลังใช้บริการ' || st === 'เสร็จสิ้น') && b.serviceStartTime && dtSafe) {
                                               const diffMins = Math.round((new Date(b.serviceStartTime) - new Date(dtSafe)) / 60000);
                                               if (diffMins < -1) {
                                                   timeDiffStr = \`มาก่อน \${Math.abs(diffMins)} นาที\`;
                                                   timeDiffColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
                                               } else if (diffMins > 1) {
                                                   timeDiffStr = \`สาย \${diffMins} นาที\`;
                                                   timeDiffColor = 'text-red-600 bg-red-50 border-red-200';
                                               } else {
                                                   timeDiffStr = \`ตรงเวลา\`;
                                                   timeDiffColor = 'text-blue-600 bg-blue-50 border-blue-200';
                                               }
                                           }
`;

content = content.replace(
    /const isRightSide = st === 'เสร็จสิ้น' \|\| st === 'ยกเลิก';\s*const picData = getProfilePicData\(b, customersRaw\);/,
    diffLogic
);

const diffLogicCards = `
                            const isPast = dtSafe ? new Date(dtSafe) < new Date() && st !== 'เสร็จสิ้น' && st !== 'ยกเลิก' : false;
                            const picData = getProfilePicData(b, customersRaw);
                            
                            let timeDiffStr = '';
                            let timeDiffColor = '';
                            if ((st === 'กำลังใช้บริการ' || st === 'เสร็จสิ้น') && b.serviceStartTime && dtSafe) {
                                const diffMins = Math.round((new Date(b.serviceStartTime) - new Date(dtSafe)) / 60000);
                                if (diffMins < -1) {
                                    timeDiffStr = \`มาก่อน \${Math.abs(diffMins)} นาที\`;
                                    timeDiffColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
                                } else if (diffMins > 1) {
                                    timeDiffStr = \`สาย \${diffMins} นาที\`;
                                    timeDiffColor = 'text-red-600 bg-red-50 border-red-200';
                                } else {
                                    timeDiffStr = \`ตรงเวลา\`;
                                    timeDiffColor = 'text-blue-600 bg-blue-50 border-blue-200';
                                }
                            }
`;

content = content.replace(
    /const isPast = dtSafe \? new Date\(dtSafe\) < new Date\(\) && st !== 'เสร็จสิ้น' && st !== 'ยกเลิก' : false;\s*const picData = getProfilePicData\(b, customersRaw\);/,
    diffLogicCards
);

const timeHtmlOld = `<div>
                                                                        <p className="text-[8px] font-bold text-gray-400 mb-0.5">เวลา</p>`;
                                                                        
const timeHtmlNew = `<div>
                                                                        <p className="text-[8px] font-bold text-gray-400 mb-0.5 flex items-center gap-1">เวลา {timeDiffStr && <span className={\`text-[8px] px-1 rounded border \${timeDiffColor}\`}>{timeDiffStr}</span>}</p>`;
                                                                        
content = content.split(timeHtmlOld).join(timeHtmlNew);

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log("Added time diff to cards");
