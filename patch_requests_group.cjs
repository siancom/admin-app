const fs = require('fs');

let epContent = fs.readFileSync('src/components/EmployeePortal.jsx', 'utf8');

// I will replace from `            {/* Finance and Advance View */}` down to just before `            {/* Schedule & History Group */}`
// The replacement will be the fully rebuilt `requests_group` containing Leave and Finance.

const replacement = `            {/* Requests Group */}
            {activeTab === 'requests_group' && (
               <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full max-h-[80vh]">
                  <div className="flex bg-slate-50 border-b border-slate-200">
                     <button onClick={() => setRequestsSubTab('leave')} className={\`flex-1 py-4 font-bold text-sm transition-colors \${requestsSubTab === 'leave' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-100'}\`}>ยื่นขอลา</button>
                     <button onClick={() => setRequestsSubTab('finance')} className={\`flex-1 py-4 font-bold text-sm transition-colors \${requestsSubTab === 'finance' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-100'}\`}>เบิกเงินล่วงหน้า</button>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                     {requestsSubTab === 'leave' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 md:p-6">
                           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-fit">
                              <h3 className="text-lg md:text-xl font-black text-slate-800 mb-2 flex items-center gap-2"><Send className="text-indigo-500" /> ยื่นคำขอลา</h3>
                              <p className="text-sm text-slate-500 font-bold mb-6">ส่งแบบฟอร์มขอลาหยุดให้ผู้จัดการพิจารณา</p>
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
                                    <div className="py-8 text-center text-slate-400 font-bold">ไม่มีประวัติการขอลา</div>
                                 ) : myLeaves.map(leave => (
                                    <div key={leave.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col gap-2">
                                       <div className="flex justify-between items-start">
                                          <div>
                                             <h4 className="font-bold text-slate-700 text-sm">{leave.leaveType}</h4>
                                             <p className="text-xs font-bold text-slate-500 mt-0.5">{new Date(leave.startDate).toLocaleDateString('th-TH')} - {new Date(leave.endDate).toLocaleDateString('th-TH')}</p>
                                          </div>
                                          <span className={\`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 \${
                                             leave.status === 'อนุมัติ' ? 'bg-emerald-100 text-emerald-700' :
                                             leave.status === 'ไม่อนุมัติ' ? 'bg-rose-100 text-rose-700' :
                                             'bg-amber-100 text-amber-700'
                                          }\`}>
                                             {leave.status}
                                          </span>
                                       </div>
                                       <p className="text-sm text-slate-600 bg-white p-2 rounded-xl border border-slate-100">{leave.reason || '-'}</p>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        </div>
                     )}
                     
                     {requestsSubTab === 'finance' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 md:p-6">
                           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-fit">
                              <h3 className="text-lg md:text-xl font-black text-slate-800 mb-2 flex items-center gap-2"><Wallet className="text-emerald-500" /> ขอเบิกเงินล่วงหน้า</h3>
                              <p className="text-sm text-slate-500 font-bold mb-6">กรอกแบบฟอร์มเพื่อส่งคำขอเบิกเงินล่วงหน้าให้ผู้จัดการพิจารณา</p>
                              
                              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 mb-6 flex flex-col sm:flex-row justify-between sm:items-end gap-4">
                                 <div>
                                   <div className="text-xs font-bold text-emerald-600 mb-1">ฐานเงินเดือนของคุณ</div>
                                   <div className="text-2xl font-black text-emerald-700 flex items-center gap-1">
                                     <DollarSign size={20} />
                                     {employee.baseSalary ? Number(employee.baseSalary).toLocaleString() : '0'} <span className="text-sm font-bold">บาท</span>
                                   </div>
                                 </div>
                                 <div className="flex flex-col sm:flex-row gap-2">
                                    <input 
                                      type="month" 
                                      value={payrollMonth} 
                                      onChange={e => setPayrollMonth(e.target.value)}
                                      className="bg-white border border-emerald-200 px-3 py-2 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-emerald-700 w-full sm:w-auto"
                                    />
                                    <button onClick={() => setShowPayslip(true)} className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition-colors text-sm whitespace-nowrap">
                                       ดูสลิปเงินเดือน
                                    </button>
                                 </div>
                              </div>

                              <form onSubmit={handleSaveAdvance} className="space-y-4">
                                  <div>
                                     <label className="block text-xs font-bold text-slate-500 mb-1">จำนวนเงินที่ต้องการเบิก (บาท)</label>
                                     <input required type="number" min="1" value={advanceForm.amount} onChange={e => setAdvanceForm({...advanceForm, amount: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-indigo-500 outline-none text-slate-700 text-lg" placeholder="ตัวอย่าง: 1000" />
                                  </div>
                                  <div>
                                     <label className="block text-xs font-bold text-slate-500 mb-1">เหตุผลความจำเป็น</label>
                                     <textarea required rows="3" value={advanceForm.reason} onChange={e => setAdvanceForm({...advanceForm, reason: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-indigo-500 outline-none text-slate-700" placeholder="ระบุเหตุผล..."></textarea>
                                  </div>
                                  <button type="submit" disabled={isSubmittingAdvance} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-xl shadow-emerald-600/30 transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50">
                                    <Send size={18} /> ส่งคำขอเบิกเงิน
                                  </button>
                              </form>
                           </div>

                           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-fit">
                              <h3 className="text-lg md:text-xl font-black text-slate-800 mb-6">ประวัติการขอเบิกเงิน</h3>
                              <div className="space-y-3">
                                 {myAdvances.length === 0 ? (
                                    <div className="py-8 text-center text-slate-400 font-bold">ไม่มีประวัติการเบิกเงินล่วงหน้า</div>
                                 ) : myAdvances.map(adv => (
                                    <div key={adv.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col gap-2">
                                       <div className="flex justify-between items-start">
                                          <div>
                                             <h4 className="font-black text-emerald-600 text-lg">฿{Number(adv.amount).toLocaleString()}</h4>
                                             <p className="text-xs font-bold text-slate-500 mt-0.5">{new Date(adv.createdAt).toLocaleDateString('th-TH')}</p>
                                          </div>
                                          <span className={\`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 \${
                                             adv.status === 'อนุมัติ' ? 'bg-emerald-100 text-emerald-700' :
                                             adv.status === 'ไม่อนุมัติ' ? 'bg-rose-100 text-rose-700' :
                                             'bg-amber-100 text-amber-700'
                                          }\`}>
                                             {adv.status === 'อนุมัติ' && <Check size={14}/>}
                                             {adv.status === 'ไม่อนุมัติ' && <XCircle size={14}/>}
                                             {adv.status}
                                          </span>
                                       </div>
                                       <p className="text-sm text-slate-600 bg-white p-2 rounded-xl border border-slate-100">{adv.reason || '-'}</p>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        </div>
                     )}
                  </div>
               </div>
            )}
`;

epContent = epContent.replace(/            \{\/\* Finance and Advance View \*\/\}[\s\S]*?(?=            \{\/\* Schedule & History Group \*\/\})/m, replacement);

fs.writeFileSync('src/components/EmployeePortal.jsx', epContent, 'utf8');
console.log("Rebuilt requests_group");
