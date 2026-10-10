const fs = require('fs');

let epContent = fs.readFileSync('src/components/EmployeePortal.jsx', 'utf8');

const serviceView = `            {/* Service Fees View */}
            {activeTab === 'service' && (
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-fit">
                     <h3 className="text-lg md:text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><UserCheck className="text-pink-500" /> บันทึกค่ามือ / ค่าจี้ไฝ</h3>
                     <form onSubmit={handleSubmitService} className="space-y-4">
                         <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">วันที่ทำงาน</label>
                            <input required type="date" value={serviceForm.date} onChange={e => setServiceForm({...serviceForm, date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-indigo-500 outline-none text-slate-700" />
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">ประเภท</label>
                            <select required value={serviceForm.type} onChange={e => setServiceForm({...serviceForm, type: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-indigo-500 outline-none text-slate-700">
                               <option value="ค่ามือ">ค่ามือ</option>
                               <option value="ค่าจี้ไฝ">ค่าจี้ไฝ</option>
                            </select>
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">จำนวนเงิน (บาท)</label>
                            <input required type="number" min="0" step="any" value={serviceForm.amount} onChange={e => setServiceForm({...serviceForm, amount: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-indigo-500 outline-none text-slate-700 text-lg" placeholder="ระบุจำนวนเงิน..." />
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">รายละเอียด (ไม่บังคับ)</label>
                            <textarea rows="2" value={serviceForm.note} onChange={e => setServiceForm({...serviceForm, note: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-indigo-500 outline-none text-slate-700" placeholder="ระบุรายละเอียดเพิ่มเติม..."></textarea>
                         </div>
                         <button type="submit" disabled={isSubmittingService} className="w-full py-4 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl font-black shadow-xl shadow-pink-500/30 transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 mt-4">
                           <Check size={18} /> บันทึกยอด
                         </button>
                     </form>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-fit">
                     <h3 className="text-lg md:text-xl font-black text-slate-800 mb-6">ประวัติการบันทึกค่ามือ</h3>
                     <div className="space-y-3">
                        {serviceLogs.filter(s => s.employeeId === employee.id).length === 0 ? (
                           <div className="py-8 text-center text-slate-400 font-bold">ไม่มีประวัติการบันทึกค่ามือ</div>
                        ) : serviceLogs.filter(s => s.employeeId === employee.id)
                            .sort((a,b) => new Date(b.date) - new Date(a.date))
                            .map(log => (
                           <div key={log.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col gap-2">
                              <div className="flex justify-between items-start">
                                 <div>
                                    <h4 className="font-black text-pink-600 text-lg">฿{Number(log.amount).toLocaleString()}</h4>
                                    <p className="text-xs font-bold text-slate-500 mt-0.5">{new Date(log.date).toLocaleDateString('th-TH')} - {log.type}</p>
                                 </div>
                              </div>
                              {log.note && <p className="text-sm text-slate-600 bg-white p-2 rounded-xl border border-slate-100">{log.note}</p>}
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            )}
            
            {/* Requests Group */}`;

epContent = epContent.replace('            {/* Requests Group */}', serviceView);
fs.writeFileSync('src/components/EmployeePortal.jsx', epContent, 'utf8');
console.log("Service view patched.");
