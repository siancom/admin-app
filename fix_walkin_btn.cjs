const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

const walkInBtn = `                      <button onClick={() => {
                          const now = new Date();
                          const nowStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                          setGeneralBookingForm({ name: '', phone: '', service: '', dateTime: nowStr, branch: filterBookingBranch !== 'all' ? filterBookingBranch : 'เฉวง', isWalkIn: true });
                          setIsGeneralBookingOpen(true);
                      }} className="bg-purple-600 hover:bg-purple-700 transition-colors text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center shadow-md active:scale-95 shrink-0"><UserPlus size={16} className="mr-1"/> Walk-in</button>`;

content = content.replace(/<button onClick=\{\(\) => setIsGeneralBookingOpen\(true\)\}/, walkInBtn + '\n                      <button onClick={() => { setGeneralBookingForm({ name: "", phone: "", service: "", dateTime: "", branch: filterBookingBranch !== "all" ? filterBookingBranch : "เฉวง", isWalkIn: false }); setIsGeneralBookingOpen(true); }}');

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log("Added Walk-in button");
