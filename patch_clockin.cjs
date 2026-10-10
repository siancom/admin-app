const fs = require('fs');

let epContent = fs.readFileSync('src/components/EmployeePortal.jsx', 'utf8');

// 1. Import useEffect
if (!epContent.includes('useEffect')) {
    epContent = epContent.replace('import React, { useState, useMemo }', 'import React, { useState, useMemo, useEffect }');
}

// 2. Add currentTime state
const stateBlock = `  const [isSubmittingAdvance, setIsSubmittingAdvance] = useState(false);`;
const timerState = `  const [isSubmittingAdvance, setIsSubmittingAdvance] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);`;
if (epContent.includes(stateBlock) && !epContent.includes('const [currentTime, setCurrentTime]')) {
    epContent = epContent.replace(stateBlock, timerState);
}

// 3. Replace the Clock In UI block
const oldClockInBlock = `                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                     <h3 className="text-xl font-black text-slate-800 mb-6 text-center md:text-left">บันทึกเวลาทำงานวันนี้</h3>
                  <div className="flex-1 flex flex-col items-center justify-center py-10">
                     {todayAtt ? (
                       <div className="w-full max-w-md space-y-4">
                          <div className="bg-emerald-50 text-emerald-700 p-6 rounded-3xl border border-emerald-100 flex flex-col items-center text-center">
                            <CheckCircle size={48} className="mb-4 text-emerald-500" />
                            <h4 className="text-lg font-black mb-1">คุณเข้างานแล้ว</h4>
                            <p className="text-sm font-bold">เวลาเข้างาน: {new Date(todayAtt.clockIn).toLocaleTimeString('th-TH')}</p>
                            {todayAtt.branch && <p className="text-sm font-bold mt-1">ที่สาขา: {todayAtt.branch}</p>}
                          </div>
                          
                          {todayAtt.clockOut ? (
                            <div className="bg-slate-100 text-slate-600 p-6 rounded-3xl border border-slate-200 flex flex-col items-center text-center">
                              <h4 className="text-lg font-black mb-1">คุณออกงานแล้ว</h4>
                              <p className="text-sm font-bold">เวลาออกงาน: {new Date(todayAtt.clockOut).toLocaleTimeString('th-TH')}</p>
                            </div>
                          ) : (
                            <button onClick={() => onClockOut(todayAtt)} className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-rose-500/30 transition-transform active:scale-95 flex items-center justify-center gap-2">
                              <UserMinus size={24} /> บันทึกออกงาน
                            </button>
                          )}
                       </div>
                     ) : (
                       <div className="w-full max-w-md flex flex-col gap-4">
                          <button onClick={() => onClockIn(employee)} className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-black text-xl shadow-xl shadow-indigo-600/30 transition-transform active:scale-95 flex items-center justify-center gap-3">
                            <UserCheck size={28} /> บันทึกเข้างาน
                          </button>
                          <p className="text-xs text-center text-slate-400 font-bold mt-2">
                            * ระบบจะตรวจสอบพิกัด GPS ว่าท่านอยู่ในบริเวณสาขาหรือไม่ (ระยะ 10 เมตร)
                          </p>
                       </div>
                     )}
                  </div>
               </div>`;

const newClockInBlock = `                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                     <h3 className="text-lg font-black text-slate-800 mb-4 text-center md:text-left">บันทึกเวลาทำงานวันนี้</h3>
                  <div className="flex-1 flex flex-col items-center justify-center py-2">
                     {todayAtt ? (
                       <div className="w-full max-w-md space-y-3">
                          <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl border border-emerald-100 flex flex-col items-center text-center">
                            <CheckCircle size={32} className="mb-2 text-emerald-500" />
                            <h4 className="text-base font-black mb-1">เข้างาน: {new Date(todayAtt.clockIn).toLocaleTimeString('th-TH', {hour: '2-digit', minute: '2-digit'})} น.</h4>
                            {(() => {
                               if (todayAtt.clockOut) return null;
                               const diffMs = currentTime.getTime() - new Date(todayAtt.clockIn).getTime();
                               const hours = Math.floor(diffMs / (1000 * 60 * 60));
                               const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                               return <p className="text-sm font-bold text-emerald-600">ทำงานมาแล้ว: {hours} ชม. {mins} นาที</p>;
                            })()}
                            {todayAtt.branch && <p className="text-xs font-bold mt-1 opacity-70">สาขา: {todayAtt.branch}</p>}
                          </div>
                          
                          {todayAtt.clockOut ? (
                            <div className="bg-slate-100 text-slate-600 p-4 rounded-2xl border border-slate-200 flex flex-col items-center text-center">
                              <h4 className="text-base font-black mb-1">ออกงาน: {new Date(todayAtt.clockOut).toLocaleTimeString('th-TH', {hour: '2-digit', minute: '2-digit'})} น.</h4>
                              {(() => {
                                 const diffMs = new Date(todayAtt.clockOut).getTime() - new Date(todayAtt.clockIn).getTime();
                                 const hours = Math.floor(diffMs / (1000 * 60 * 60));
                                 const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                                 return <p className="text-sm font-bold text-slate-500 mt-1">รวมเวลาทำงาน: {hours} ชม. {mins} นาที</p>;
                              })()}
                            </div>
                          ) : (
                            <button onClick={() => onClockOut(todayAtt)} className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-black text-base shadow-lg shadow-rose-500/30 transition-transform active:scale-95 flex items-center justify-center gap-2">
                              <UserMinus size={20} /> บันทึกออกงาน
                            </button>
                          )}
                       </div>
                     ) : (
                       <div className="w-full max-w-md flex flex-col gap-3">
                          <button onClick={() => onClockIn(employee)} className="w-full py-3 md:py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/30 transition-transform active:scale-95 flex items-center justify-center gap-3">
                            <UserCheck size={24} /> บันทึกเข้างาน
                          </button>
                          <p className="text-[10px] md:text-xs text-center text-slate-400 font-bold">
                            * ตรวจสอบพิกัด GPS ระยะ 10 เมตรจากสาขา
                          </p>
                       </div>
                     )}
                  </div>
               </div>`;

if (epContent.includes('บันทึกเวลาทำงานวันนี้')) {
    epContent = epContent.replace(oldClockInBlock, newClockInBlock);
    fs.writeFileSync('src/components/EmployeePortal.jsx', epContent, 'utf8');
    console.log("Clock In block updated successfully.");
} else {
    console.log("Could not find the target string.");
}
