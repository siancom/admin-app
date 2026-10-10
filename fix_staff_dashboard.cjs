const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

const target = `                   <div>
                     <h1 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight">`;

const missingBlock = `          {/* STAFF DASHBOARD */}
          {activeTab === 'dashboard' && globalRole !== 'owner' && (
            <div className="flex flex-col h-full animate-in fade-in max-w-5xl mx-auto w-full px-2 sm:px-0">
               <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <div className="flex items-center gap-3">
                   {clockedInEmployees.length > 0 ? (
                <div className="flex -space-x-2">
                  {clockedInEmployees.slice(0, 3).map((emp, idx) => (
                    emp.profileImage ? (
                      <img key={emp.id} src={emp.profileImage} className="w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 border-white object-cover shadow-sm relative bg-white" style={{ zIndex: 3 - idx }} alt={emp.name} onError={(e) => { e.target.onerror = null; e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'; }} />
                    ) : (
                      <div key={emp.id} className="w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 border-white bg-slate-100 text-slate-400 flex items-center justify-center shadow-sm relative" style={{ zIndex: 3 - idx }}>
                        <User className="w-4 h-4 sm:w-6 sm:h-6" />
                      </div>
                    )
                  ))}
                       {clockedInEmployees.length > 3 && (
                         <div className="w-12 h-12 rounded-full border-2 border-white bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold shadow-sm relative z-0">
                           +{clockedInEmployees.length - 3}
                         </div>
                       )}
                     </div>
                   ) : (
                     <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shadow-inner border border-indigo-200">
                       <User size={24} />
                     </div>
                   )}
`;

content = content.replace(target, missingBlock + target);
fs.writeFileSync('src/App.jsx', content, 'utf8');

console.log("Restored missing staff dashboard header");
