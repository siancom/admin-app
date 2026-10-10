import fs from 'fs';
// We'll write a script to patch App.jsx to render raw employeeAttendance data so I can see what's wrong.
let content = fs.readFileSync('src/components/POSSystem.jsx', 'utf8');

const target = `{/* Debug info */}`;
const replace = `{/* Debug info */}
                <div className="text-[8px] text-red-500">
                  GlobalBranch: {globalBranch} | 
                  Atts: {JSON.stringify(employeeAttendance.filter(a => !a.clockOut).map(a => ({emp: a.employeeName, b: a.branch, d: a.date})))}
                </div>`;

content = content.replace(target, replace);
fs.writeFileSync('src/components/POSSystem.jsx', content, 'utf8');
