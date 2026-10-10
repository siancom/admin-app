const fs = require('fs');

let content = fs.readFileSync('src/components/FrontAttendanceModal.jsx', 'utf8');

const targetMatch = `                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                    <Users size={28} className="text-slate-400" />
                  </div>`;
const replaceMatch = `                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3 overflow-hidden shrink-0 shadow-sm">
                    {emp.profileImage ? (
                        <img src={emp.profileImage} alt={emp.name} className="w-full h-full object-cover" />
                    ) : (
                        <Users size={28} className="text-slate-400" />
                    )}
                  </div>`;

if (content.includes(targetMatch)) {
    content = content.replace(targetMatch, replaceMatch);
    fs.writeFileSync('src/components/FrontAttendanceModal.jsx', content, 'utf8');
    console.log("Avatar added to FrontAttendanceModal successfully.");
} else {
    console.log("Could not find the target match.");
}
