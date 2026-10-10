const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

const insertPoint = `                             let rows = [];`;
const renderEmpAvatarFunc = `                             let rows = [];
                             
                             const renderEmpAvatar = (empName) => {
                               const emp = empName ? employees.find(e => e.name === empName) : null;
                               return (
                                 <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                                   {emp && emp.profileImage ? (
                                     <img src={emp.profileImage} className="w-5 h-5 rounded-full object-cover shadow-sm border border-gray-200" alt={empName} onError={(e) => e.target.style.display='none'} />
                                   ) : (
                                     <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200"><User size={10} className="text-gray-400" /></div>
                                   )}
                                   <span className="font-medium text-gray-700">{empName || '-'}</span>
                                 </div>
                               );
                             };`;

content = content.replace(insertPoint, renderEmpAvatarFunc);

const oldTpl1 = `<div className="text-gray-500 text-xs flex items-center gap-1">
                                          <User size={12} /> {r['พนักงาน'] || '-'}
                                        </div>`;
const newTpl1 = `{renderEmpAvatar(r['พนักงาน'])}`;
content = content.replace(oldTpl1, newTpl1); // First time (used_course)
content = content.replace(oldTpl1, newTpl1); // Second time (new_sale)

const oldTpl2 = `<div className="text-gray-500 text-xs flex items-center gap-1">
                                          <User size={12} /> {r.employeeName}
                                        </div>`;
const newTpl2 = `{renderEmpAvatar(r.employeeName)}`;
content = content.replace(oldTpl2, newTpl2); // Third time (service_log)

fs.writeFileSync('src/App.jsx', content, 'utf8');
