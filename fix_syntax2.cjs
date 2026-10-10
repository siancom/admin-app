const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

const badBlock = `                  <button onClick={() => { setActiveTab('bookings'); }} className="flex items-center justify-center gap-2 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl font-bold text-sm transition-colors active:scale-95">
                    <Calendar size={18} /> นัดหมาย
                  </button>
                </div>
              </div>
              <h2 className="text-lg font-black text-gray-800 flex items-center"><Users className="mr-2 text-indigo-500"/> ลูกค้า & ใบคอร์สรับบริการ</h2>`;

const goodBlock = `                  <button onClick={() => { setActiveTab('bookings'); }} className="flex items-center justify-center gap-2 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl font-bold text-sm transition-colors active:scale-95">
                    <Calendar size={18} /> นัดหมาย
                  </button>
                </div>
              </div>
            )}
              <h2 className="text-lg font-black text-gray-800 flex items-center"><Users className="mr-2 text-indigo-500"/> ลูกค้า & ใบคอร์สรับบริการ</h2>`;

content = content.replace(badBlock, goodBlock);
fs.writeFileSync('src/App.jsx', content, 'utf8');

console.log("Fixed syntax 2");
