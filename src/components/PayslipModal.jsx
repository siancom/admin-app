import React from 'react';
import { X, Printer } from 'lucide-react';

export default function PayslipModal({ employee, payrollMonth, onClose }) {
  if (!employee) return null;

  const handlePrint = () => {
    window.print();
  };

  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const [yearStr, monthStr] = payrollMonth.split('-');
  const displayMonth = `${monthNames[parseInt(monthStr, 10) - 1]} ${yearStr}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      {/* Container */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col relative print:shadow-none print:max-h-none print:w-full">
        {/* Header - Hidden on print */}
        <div className="flex justify-between items-center p-4 border-b border-slate-200 print:hidden">
          <h2 className="text-xl font-bold text-slate-800">พิมพ์สลิปเงินเดือน</h2>
          <div className="flex gap-2">
            <button 
              onClick={handlePrint} 
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Printer size={18} /> พิมพ์สลิป
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Payslip Content (Printable Area) */}
        <div className="p-8 print:p-0 print:m-0 w-full bg-white text-slate-800 font-sans" id="payslip-content">
          <div className="text-center mb-8 border-b-2 border-slate-800 pb-6">
            <h1 className="text-2xl font-black uppercase tracking-wider mb-1">ใบรับรองเงินเดือน (Payslip)</h1>
            <p className="text-slate-500 font-medium">ประจำเดือน: {displayMonth}</p>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8">
            <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
              <span className="font-bold text-slate-600">ชื่อพนักงาน:</span>
              <span className="font-bold">{employee.name}</span>
            </div>
            <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
              <span className="font-bold text-slate-600">สาขา:</span>
              <span className="font-bold">{employee.branch}</span>
            </div>
            <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
              <span className="font-bold text-slate-600">เบอร์โทรศัพท์:</span>
              <span className="font-bold">{employee.phone || '-'}</span>
            </div>
            <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
              <span className="font-bold text-slate-600">วันที่ออกเอกสาร:</span>
              <span className="font-bold">{new Date().toLocaleDateString('th-TH')}</span>
            </div>
          </div>

          <div className="flex gap-8 mb-8">
            {/* รายรับ */}
            <div className="flex-1">
              <div className="bg-slate-100 px-4 py-2 font-bold border border-slate-300 mb-2">รายรับ (Earnings)</div>
              <div className="space-y-3 px-2">
                <div className="flex justify-between">
                  <span>เงินเดือนพื้นฐาน (Base Salary)</span>
                  <span className="font-medium">{(employee.baseSalary || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>ค่าคอมมิชชั่น (Commission)</span>
                  <span className="font-medium">{(employee.totalCommission || 0).toLocaleString()}</span>
                </div>
                {(employee.totalServiceFees > 0) && (
                  <div className="flex justify-between">
                    <span>ค่ามือ / ค่าจี้ไฝ (Service Fees)</span>
                    <span className="font-medium">{(employee.totalServiceFees || 0).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>ค่าอาหาร (Food Allowance)</span>
                  <span className="font-medium">{(employee.totalFoodAllowance || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>เบี้ยขยัน (Diligence Allowance)</span>
                  <span className="font-medium">{(employee.diligenceAllowance || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* รายจ่าย / หัก */}
            <div className="flex-1">
              <div className="bg-slate-100 px-4 py-2 font-bold border border-slate-300 mb-2">รายการหัก (Deductions)</div>
              <div className="space-y-3 px-2">
                {(employee.totalAdvances > 0) ? (
                  <div className="flex justify-between text-rose-600">
                    <span>หักเบิกล่วงหน้า (Advance Deductions)</span>
                    <span className="font-medium">{(employee.totalAdvances || 0).toLocaleString()}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-slate-400">
                    <span>ไม่มีรายการหัก</span>
                    <span className="font-medium">0</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-between items-center border-t-2 border-b-2 border-slate-800 py-4 mb-12">
            <div className="text-lg font-bold">รายรับสุทธิ (Net Pay)</div>
            <div className="text-2xl font-black text-slate-800">
              ฿{(employee.totalIncome || 0).toLocaleString()}
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-12 mt-16 pt-8">
            <div className="text-center">
              <div className="border-b border-slate-400 w-48 mx-auto mb-2"></div>
              <p className="font-bold text-sm text-slate-600">ผู้รับเงิน (Employee)</p>
              <p className="text-xs text-slate-400 mt-1">วันที่ ____/____/____</p>
            </div>
            <div className="text-center">
              <div className="border-b border-slate-400 w-48 mx-auto mb-2"></div>
              <p className="font-bold text-sm text-slate-600">ผู้อนุมัติ (Authorized Manager)</p>
              <p className="text-xs text-slate-400 mt-1">วันที่ ____/____/____</p>
            </div>
          </div>

        </div>
      </div>

      {/* Print-specific styles using a style tag to target just this component's wrapper */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #payslip-content, #payslip-content * {
            visibility: visible;
          }
          #payslip-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
