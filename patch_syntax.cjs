const fs = require('fs');

let epContent = fs.readFileSync('src/components/EmployeePortal.jsx', 'utf8');

// I will find the exact block from `                      )};` to `            )}` just before `<div className="md:hidden fixed bottom-0...` and remove it.

const toRemove = `                      )};
                        
                        return [...blanks, ...days];
                     })()}
                  </div>
               </div>
            )}

            {/* Leave Management */}
            {activeTab === 'leave' && (
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-fit">
                     <h3 className="text-lg md:text-xl font-black text-slate-800 mb-6">ฟอร์มส่งคำขอลา</h3>
                     <form onSubmit={handleSaveLeave} className="space-y-4">
                         <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">ประเภทการลา</label>
                            <select required value={leaveForm.leaveType} onChange={e => setLeaveForm({...leaveForm, leaveType: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-indigo-500 outline-none text-slate-700">
                               <option value="ลาป่วย">ลาป่วย</option>
                               <option value="ลากิจ">ลากิจ</option>
                               <option value="ลาพักร้อน">ลาพักร้อน</option>
                               <option value="อื่นๆ">อื่นๆ</option>
                            </select>
                         </div>
             


            <div className="grid grid-cols-2 gap-3 mt-4">
                            <div>
                               <label className="block text-xs font-bold text-slate-500 mb-1">ตั้งแต่วันที่</label>
                               <input required type="date" value={leaveForm.startDate} onChange={e => setLeaveForm({...leaveForm, startDate: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 font-bold focus:border-indigo-500 outline-none text-slate-700 text-sm" />
                            </div>
                            <div>
                               <label className="block text-xs font-bold text-slate-500 mb-1">ถึงวันที่</label>
                               <input required type="date" value={leaveForm.endDate} onChange={e => setLeaveForm({...leaveForm, endDate: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 font-bold focus:border-indigo-500 outline-none text-slate-700 text-sm" />
                            </div>
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">เหตุผลการลา</label>
                            <textarea required rows="3" value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-indigo-500 outline-none text-slate-700" placeholder="ระบุเหตุผล..."></textarea>
                         </div>
                         <button type="submit" disabled={isSubmittingLeave} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/30 transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50">
                           <Send size={18} /> ส่งคำขอลา
                         </button>
                     </form>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-fit">
                     <h3 className="text-lg md:text-xl font-black text-slate-800 mb-6">ประวัติการขอลา</h3>
                     <div className="space-y-3">
                        {myLeaves.length === 0 ? (
                           <div className="py-8 text-center text-slate-400 font-bold">ไม่มีประวัติการลา</div>
                        ) : myLeaves.map(lv => (
                           <div key={lv.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col gap-2">
                              <div className="flex justify-between items-start">
                                 <div>
                                    <h4 className="font-bold text-slate-800">{lv.leaveType}</h4>
                                    <p className="text-xs font-bold text-slate-500 mt-0.5">{new Date(lv.startDate).toLocaleDateString('th-TH')} - {new Date(lv.endDate).toLocaleDateString('th-TH')}</p>
                                 </div>
                                 <span className={\`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 \${
                                    lv.status === 'อนุมัติ' ? 'bg-emerald-100 text-emerald-700' :
                                    lv.status === 'ไม่อนุมัติ' ? 'bg-rose-100 text-rose-700' :
                                    'bg-amber-100 text-amber-700'
                                 }\`}>
                                    {lv.status === 'อนุมัติ' && <Check size={14}/>}
                                    {lv.status === 'ไม่อนุมัติ' && <XCircle size={14}/>}
                                    {lv.status}
                                 </span>
                              </div>
                              <p className="text-sm text-slate-600 bg-white p-2 rounded-xl border border-slate-100">{lv.reason || '-'}</p>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            )}`;

if (epContent.includes(toRemove)) {
    epContent = epContent.replace(toRemove, '');
    fs.writeFileSync('src/components/EmployeePortal.jsx', epContent, 'utf8');
    console.log("Successfully removed syntax errors and leftover leave view");
} else {
    console.log("Could not find the block to remove exactly as written.");
}
