const fs = require('fs');

let epContent = fs.readFileSync('src/components/EmployeePortal.jsx', 'utf8');

const targetStr = `                  <div className="flex-1 flex flex-col items-center justify-center py-2">
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
                     ) : (`;

const newStr = `                  <div className="flex-1 flex flex-col items-center justify-center py-2">
                     {todayAtt ? (
                       <div className="w-full grid grid-cols-2 gap-3">
                          <div className="bg-emerald-50 text-emerald-700 p-3 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center text-center h-full">
                            <CheckCircle size={28} className="mb-2 text-emerald-500" />
                            <h4 className="text-sm md:text-base font-black mb-1">เข้างาน</h4>
                            <p className="text-xs md:text-sm font-bold">{new Date(todayAtt.clockIn).toLocaleTimeString('th-TH', {hour: '2-digit', minute: '2-digit'})} น.</p>
                            {(() => {
                               if (todayAtt.clockOut) return null;
                               const diffMs = currentTime.getTime() - new Date(todayAtt.clockIn).getTime();
                               const hours = Math.floor(diffMs / (1000 * 60 * 60));
                               const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                               return <p className="text-[10px] md:text-xs font-bold text-emerald-600 mt-1">{hours} ชม. {mins} น.</p>;
                            })()}
                            {todayAtt.branch && <p className="text-[9px] md:text-[10px] font-bold mt-1 opacity-70">สาขา: {todayAtt.branch}</p>}
                          </div>
                          
                          {todayAtt.clockOut ? (
                            <div className="bg-slate-100 text-slate-600 p-3 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center h-full">
                              <XCircle size={28} className="mb-2 text-slate-400" />
                              <h4 className="text-sm md:text-base font-black mb-1">ออกงาน</h4>
                              <p className="text-xs md:text-sm font-bold">{new Date(todayAtt.clockOut).toLocaleTimeString('th-TH', {hour: '2-digit', minute: '2-digit'})} น.</p>
                              {(() => {
                                 const diffMs = new Date(todayAtt.clockOut).getTime() - new Date(todayAtt.clockIn).getTime();
                                 const hours = Math.floor(diffMs / (1000 * 60 * 60));
                                 const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                                 return <p className="text-[10px] md:text-xs font-bold text-slate-500 mt-1">รวม: {hours} ชม. {mins} น.</p>;
                              })()}
                            </div>
                          ) : (
                            <button onClick={() => onClockOut(todayAtt)} className="h-full w-full py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black text-sm md:text-base shadow-lg shadow-rose-500/30 transition-transform active:scale-95 flex flex-col items-center justify-center gap-2">
                              <UserMinus size={28} /> บันทึกออกงาน
                            </button>
                          )}
                       </div>
                     ) : (`;

if (epContent.includes(targetStr)) {
    epContent = epContent.replace(targetStr, newStr);
    fs.writeFileSync('src/components/EmployeePortal.jsx', epContent, 'utf8');
    console.log("Clock In block updated successfully for left-right layout.");
} else {
    console.log("Could not find the target string. The layout might have already changed or spaces mismatched.");
}
