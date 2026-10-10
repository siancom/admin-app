const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

const target = `                    <button 
                      onClick={() => {                                                         <div className={\`hidden sm:block absolute top-1/2 w-10 h-0.5 bg-gray-200 transform -translate-y-1/2 \${isRightSide ? 'left-0' : 'right-0'}\`}></div>`;

const idxStart = content.indexOf('                    <button \n                      onClick={() => {                                                         <div className={`hidden sm:block absolute top-1/2');

if (idxStart === -1) {
    console.log("Could not find start");
    process.exit(1);
}

const endTarget = `                                                        </div>100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"><p className="text-[11px] sm:text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">รอการยืนยัน (คิว)</p><p className="text-3xl sm:text-4xl font-black text-amber-700">{bookingStats.pending}</p></div>`;

const idxEnd = content.indexOf(endTarget, idxStart);
if (idxEnd === -1) {
    console.log("Could not find end");
    process.exit(1);
}

const badBlock = content.substring(idxStart, idxEnd + endTarget.length);

const goodBlock = `                    <button 
                      onClick={() => { localStorage.removeItem('selectedBranch'); localStorage.removeItem('userRole'); setGlobalBranch(null); setGlobalRole('staff'); }}
                      className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-sm font-bold transition-colors border border-rose-100 active:scale-95"
                    >
                      <LogOut size={16} />
                      <span className="hidden sm:inline">ออกจากระบบ</span>
                    </button>
                  </div>
                </div>
              </div>

              <h2 className="text-lg font-black text-gray-800 flex items-center"><Users className="mr-2 text-indigo-500"/> ลูกค้า & ใบคอร์สรับบริการ</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div onClick={() => { setActiveTab('customers'); setFilterCustomerStatus('all'); }} className="bg-gradient-to-br from-indigo-600 to-purple-700 p-5 sm:p-6 rounded-[24px] shadow-lg text-white hover:-translate-y-1 cursor-pointer transition-transform"><p className="text-xs font-bold text-indigo-100 uppercase tracking-wider mb-2">ลูกค้าทั้งหมด</p><p className="text-3xl sm:text-4xl font-black">{stats.totalCustomers}</p></div>
                <div onClick={() => { setActiveTab('customers'); setFilterCustomerStatus('all'); }} className="bg-white p-5 sm:p-6 rounded-[24px] border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"><p className="text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">ลูกค้ารับบริการ (Active)</p><p className="text-3xl sm:text-4xl font-black text-gray-800">{stats.activeCustomers}</p></div>
                <div onClick={() => { setActiveTab('courses'); setFilterStatus('ยังคงเหลือ'); }} className="bg-white p-5 sm:p-6 rounded-[24px] border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"><p className="text-[11px] sm:text-xs font-bold text-teal-500 uppercase tracking-wider mb-2">ใบคอร์ส (ใช้งานอยู่)</p><p className="text-3xl sm:text-4xl font-black text-teal-700">{stats.active}</p></div>
                <div onClick={() => { setActiveTab('courses'); setFilterStatus('ใช้ครบแล้ว'); }} className="bg-white p-5 sm:p-6 rounded-[24px] border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"><p className="text-[11px] sm:text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2">ใบคอร์ส (ใช้ครบแล้ว)</p><p className="text-3xl sm:text-4xl font-black text-emerald-700">{stats.completed}</p></div>
              </div>
              <h2 className="text-lg font-black text-gray-800 flex items-center pt-2"><Calendar className="mr-2 text-blue-500"/> นัดหมาย & คำสั่งซื้อ</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div onClick={() => { setActiveTab('bookings'); setFilterBookingStatus('all'); }} className="bg-blue-50 p-5 sm:p-6 rounded-[24px] border border-blue-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"><p className="text-[11px] sm:text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">นัดหมายวันนี้</p><p className="text-3xl sm:text-4xl font-black text-blue-700">{bookingStats.today}</p></div>
                <div onClick={() => { setActiveTab('bookings'); setFilterBookingStatus('รอการยืนยัน'); }} className="bg-amber-50 p-5 sm:p-6 rounded-[24px] border border-amber-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"><p className="text-[11px] sm:text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">รอการยืนยัน (คิว)</p><p className="text-3xl sm:text-4xl font-black text-amber-700">{bookingStats.pending}</p></div>`;

content = content.replace(badBlock, goodBlock);
fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log("Fixed owner dashboard");
