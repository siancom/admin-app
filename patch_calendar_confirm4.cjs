const fs = require('fs');

let content = fs.readFileSync('src/components/EmployeePortal.jsx', 'utf8');

const regexEnd = /                           <\/div>\s*<\/div>\s*\)\}\s*<\/div>\s*<\/div>\s*\)\}\s*<\/div>\s*<\/div>\s*\{\/\* Modals \*\/\}/;

const newEnd = `                           </div>
                            {calendarSelection && (
                                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between bg-indigo-50 border border-indigo-100 p-4 rounded-2xl animate-in fade-in slide-in-from-bottom-2">
                                    <div className="text-indigo-800 font-bold mb-2 sm:mb-0">
                                        {calendarSelection.end 
                                            ? \`เลือกช่วงเวลา: \${new Date(calendarSelection.start).toLocaleDateString('th-TH')} ถึง \${new Date(calendarSelection.end).toLocaleDateString('th-TH')}\`
                                            : \`เลือกวันที่: \${new Date(calendarSelection.start).toLocaleDateString('th-TH')} (กดอีกวันเพื่อเลือกเป็นช่วง)\`
                                        }
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button 
                                          onClick={() => setCalendarSelection(null)}
                                          className="flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 font-bold rounded-xl border border-slate-200 transition-colors"
                                        >
                                          ยกเลิก
                                        </button>
                                        <button 
                                          onClick={() => {
                                              setActiveTab('requests_group');
                                              setRequestsSubTab('leave');
                                              setCalendarSelection(null);
                                          }}
                                          className="flex-1 sm:flex-none px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                                        >
                                          ดำเนินการแจ้งลา <CheckCircle size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                     )}
                  </div>
               </div>
            )}
         </div>
      </div>
      
      {/* Modals */}`;

if (content.match(regexEnd)) {
    content = content.replace(regexEnd, newEnd);
    console.log("Replaced UI end successfully.");
} else {
    // Let's use a simpler match just on the last divs before {/* Modals */}
    const simpleEnd = `                     )}
                  </div>
               </div>
            )}
         </div>
      </div>
      
      {/* Modals */}`;
      
    const simpleReplace = `                           {calendarSelection && (
                                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between bg-indigo-50 border border-indigo-100 p-4 rounded-2xl animate-in fade-in slide-in-from-bottom-2">
                                    <div className="text-indigo-800 font-bold mb-2 sm:mb-0">
                                        {calendarSelection.end 
                                            ? \`เลือกช่วงเวลา: \${new Date(calendarSelection.start).toLocaleDateString('th-TH')} ถึง \${new Date(calendarSelection.end).toLocaleDateString('th-TH')}\`
                                            : \`เลือกวันที่: \${new Date(calendarSelection.start).toLocaleDateString('th-TH')} (กดอีกวันเพื่อเลือกเป็นช่วง)\`
                                        }
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button 
                                          onClick={() => setCalendarSelection(null)}
                                          className="flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 font-bold rounded-xl border border-slate-200 transition-colors"
                                        >
                                          ยกเลิก
                                        </button>
                                        <button 
                                          onClick={() => {
                                              setActiveTab('requests_group');
                                              setRequestsSubTab('leave');
                                              setCalendarSelection(null);
                                          }}
                                          className="flex-1 sm:flex-none px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                                        >
                                          ดำเนินการแจ้งลา <CheckCircle size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                     )}
                  </div>
               </div>
            )}
         </div>
      </div>
      
      {/* Modals */}`;
      
    content = content.replace(simpleEnd, simpleReplace);
    console.log("Replaced UI end using simple match.");
}

fs.writeFileSync('src/components/EmployeePortal.jsx', content, 'utf8');
