const fs = require('fs');

let epContent = fs.readFileSync('src/components/EmployeePortal.jsx', 'utf8');

const targetStr = `                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 text-indigo-200 opacity-50 group-hover:scale-110 transition-transform duration-500"><CheckCircle size={80}/></div>
                        <div className="relative z-10">
                           <div className="text-indigo-800 font-bold mb-1 text-xs md:text-sm flex items-center gap-2">ยอดบริการ (ครั้ง)</div>
                           <div className="text-xl md:text-2xl font-black text-indigo-900">{payrollEmployee.serviceCount + payrollEmployee.serviceLogCount}</div>
                        </div>
                     </div>
                     
                     <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 text-emerald-200 opacity-50 group-hover:scale-110 transition-transform duration-500"><DollarSign size={80}/></div>
                        <div className="relative z-10">
                           <div className="text-emerald-800 font-bold mb-1 text-xs md:text-sm flex items-center gap-2">รายรับสุทธิ (รวมหักลบ)</div>
                           <div className="text-xl md:text-2xl font-black text-emerald-900">฿{payrollEmployee.netSalary.toLocaleString()}</div>
                        </div>
                     </div>
                  </div>`;

const replacement = `                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 text-indigo-200 opacity-50 group-hover:scale-110 transition-transform duration-500"><CheckCircle size={80}/></div>
                        <div className="relative z-10">
                           <div className="text-indigo-800 font-bold mb-1 text-xs md:text-sm flex items-center gap-2">ยอดบริการ (ครั้ง)</div>
                           <div className="text-xl md:text-2xl font-black text-indigo-900">{payrollEmployee.serviceCount + payrollEmployee.serviceLogCount}</div>
                        </div>
                     </div>
                     
                     <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 text-emerald-200 opacity-50 group-hover:scale-110 transition-transform duration-500"><DollarSign size={80}/></div>
                        <div className="relative z-10">
                           <div className="text-emerald-800 font-bold mb-1 text-xs md:text-sm flex items-center gap-2">รายรับสุทธิ (รวมหักลบ)</div>
                           <div className="text-xl md:text-2xl font-black text-emerald-900">฿{payrollEmployee.netSalary.toLocaleString()}</div>
                        </div>
                     </div>
                  </div>
                  
                  {/* Salary Breakdown */}
                  <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm">
                     <div className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><DollarSign size={16} className="text-emerald-500"/> รายละเอียดการคำนวณเงินเดือน</div>
                     <div className="space-y-2 text-xs md:text-sm">
                        <div className="flex justify-between items-center text-slate-600">
                           <span>ฐานเงินเดือน</span>
                           <span className="font-bold">฿{(Number(employee.baseSalary) || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                           <span>ค่าคอมมิชชัน (จากยอดขาย)</span>
                           <span className="font-bold text-emerald-600">+ ฿{payrollEmployee.totalCommission.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                           <span>ค่ามือ / ค่าจี้ไฝ</span>
                           <span className="font-bold text-emerald-600">+ ฿{payrollEmployee.totalServiceFees.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                           <span>หักเบิกล่วงหน้า</span>
                           <span className="font-bold text-rose-500">- ฿{payrollEmployee.totalAdvances.toLocaleString()}</span>
                        </div>
                        <div className="border-t border-dashed border-slate-200 pt-2 mt-2 flex justify-between items-center">
                           <span className="font-black text-slate-800">รายรับสุทธิ</span>
                           <span className="font-black text-emerald-600 text-base">฿{payrollEmployee.netSalary.toLocaleString()}</span>
                        </div>
                     </div>
                  </div>`;

if (epContent.includes(targetStr)) {
    epContent = epContent.replace(targetStr, replacement);
    fs.writeFileSync('src/components/EmployeePortal.jsx', epContent, 'utf8');
    console.log("Salary breakdown successfully added.");
} else {
    console.log("Could not find the target string.");
}
