import React, { useState, useMemo, useEffect } from 'react';
import { Clock, Calendar, CheckCircle, UserCheck, UserMinus, X, User, LogOut, Send, Check, XCircle, History, DollarSign, Wallet, ShoppingCart, Lock, Trash2, FileText, ShieldAlert, Gift, Percent } from 'lucide-react';
import { db, getCol } from '../config/firebase';
import { addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import PayslipModal from './PayslipModal';
import { parseNumber } from '../utils/parse';
import { getFuzzyKey } from '../utils/fuzzy';
import EmploymentContractModal from './EmploymentContractModal';

export default function EmployeePortal({
  employee,
  attendance = [],
  leaves = [],
  advancePayments = [],
  requisitions = [],
  histories = [],
  branches = [],
  dailySales = [],
  serviceLogs = [],
  orders = [],
  appSettings = {},
  onClose,
  onClockIn,
  onClockOut,
  onGoToPOS,
  onChangePin,
  isAdmin,
  onDeleteServiceLog
}) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [scheduleSubTab, setScheduleSubTab] = useState('schedule');
  const [requestsSubTab, setRequestsSubTab] = useState('leave');
  const [scheduleMonth, setScheduleMonth] = useState(new Date().toISOString().substring(0, 7));
  const [payrollMonth, setPayrollMonth] = useState(new Date().toISOString().substring(0, 7));
  const [calendarSelection, setCalendarSelection] = useState([]);
  const [showPayslip, setShowPayslip] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ leaveType: 'ลาป่วย', startDate: '', endDate: '', reason: '', dates: [], replacementDate: '' });
  const [advanceForm, setAdvanceForm] = useState({ amount: '', reason: '' });
  const [suppliesForm, setSuppliesForm] = useState({ itemName: '', quantity: '', reason: '' });
  const [serviceForm, setServiceForm] = useState({ date: new Date().toISOString().split('T')[0], type: 'ค่ามือ', amount: '', note: '' });
  const [benefitForm, setBenefitForm] = useState({ show: false, type: '', amount: '', note: '' });
  const [isSubmittingBenefit, setIsSubmittingBenefit] = useState(false);
  const [isSubmittingService, setIsSubmittingService] = useState(false);
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
  const [isSubmittingAdvance, setIsSubmittingAdvance] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showContract, setShowContract] = useState(false);

  const usedAnnualLeave = useMemo(() => {
    // Check approved annual leaves in the current year
    const currentYear = new Date().getFullYear().toString();
    return leaves.filter(l => 
       l.employeeId === employee.id && 
       l.leaveType === 'ลาพักร้อน' && 
       l.status === 'อนุมัติ' && 
       (l.startDate || '').startsWith(currentYear)
    ).length;
  }, [leaves, employee]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
        const reader = new FileReader();
        reader.onload = async (event) => {
            const img = new Image();
            img.onload = async () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 300;
                const MAX_HEIGHT = 300;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                await updateDoc(doc(db, 'employees', employee.id), { profileImage: dataUrl });
                setIsUploadingImage(false);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    } catch (err) {
        alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: ' + err.message);
        setIsUploadingImage(false);
    }
  };
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Change PIN form
  const [pinForm, setPinForm] = useState({ oldPin: '', newPin: '', confirmPin: '' });
  const [pinFormMessage, setPinFormMessage] = useState({ type: '', text: '' });
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);

  const handleChangePin = async (e) => {
    e.preventDefault();
    setPinFormMessage({ type: '', text: '' });
    const { oldPin, newPin, confirmPin } = pinForm;
    const currentPin = String(employee.pin || '1234');

    if (oldPin !== currentPin) {
      setPinFormMessage({ type: 'error', text: 'PIN เดิมไม่ถูกต้อง' });
      return;
    }
    if (!/^\d{4}$/.test(newPin)) {
      setPinFormMessage({ type: 'error', text: 'PIN ใหม่ต้องเป็นตัวเลข 4 หลัก' });
      return;
    }
    if (newPin !== confirmPin) {
      setPinFormMessage({ type: 'error', text: 'PIN ใหม่และยืนยัน PIN ไม่ตรงกัน' });
      return;
    }
    if (newPin === oldPin) {
      setPinFormMessage({ type: 'error', text: 'PIN ใหม่ต้องไม่ซ้ำกับ PIN เดิม' });
      return;
    }

    setIsSubmittingPin(true);
    try {
      if (typeof onChangePin === 'function') {
        const res = await onChangePin(newPin);
        if (res && res.ok === false) throw new Error(res.error || 'บันทึกไม่สำเร็จ');
      } else {
        await updateDoc(doc(db, 'employees', employee.id), { pin: String(newPin) });
      }
      setPinFormMessage({ type: 'success', text: 'เปลี่ยน PIN สำเร็จ' });
      setPinForm({ oldPin: '', newPin: '', confirmPin: '' });
    } catch (err) {
      setPinFormMessage({ type: 'error', text: 'เกิดข้อผิดพลาด: ' + err.message });
    }
    setIsSubmittingPin(false);
  };

  // Computed data
  const myLeaves = useMemo(() => leaves.filter(l => l.employeeId === employee.id).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)), [leaves, employee.id]);
  const myAttendance = useMemo(() => attendance.filter(a => a.employeeId === employee.id).sort((a,b) => new Date(b.date) - new Date(a.date)), [attendance, employee.id]);
  const myAdvances = useMemo(() => advancePayments.filter(a => a.employeeId === employee.id).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)), [advancePayments, employee.id]);
  const myRequisitions = useMemo(() => requisitions.filter(r => r.employeeId === employee.id).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)), [requisitions, employee.id]);

  const isInPayrollMonth = (item, monthPrefix) => {
      if (item.createdAt && item.createdAt.includes('T')) return item.createdAt.startsWith(monthPrefix);
      if (item.date && String(item.date).match(/^\d{4}-\d{2}-\d{2}/)) return String(item.date).startsWith(monthPrefix);
      const dStr = item.วันที่ || item.date;
      if (dStr && typeof dStr === 'string' && dStr.includes('/')) {
          const parts = dStr.split('/');
          if (parts.length === 3) {
              let year = parseInt(parts[2], 10);
              if (year > 2500) year -= 543;
              return `${year}-${parts[1].padStart(2, '0')}` === monthPrefix;
          }
      }
      return false;
  };

  const payrollEmployee = useMemo(() => {
     let totalCommission = 0;
     let serviceCount = 0;
     histories.forEach(h => {
         if (!isInPayrollMonth(h, payrollMonth)) return;
         const sName = String(getFuzzyKey(h, ["ชื่อเจ้าหน้าที่", "ชื่อพนักงาน", "staffName", "ผู้ให้บริการ", "เจ้าหน้าที่"]) || '');
         if (!sName) return;
         
         const staffNames = sName.split(/[,/]|และ|กับ/).map(s => s.trim()).filter(s => s);
         if (staffNames.includes(employee.name)) {
             const price = parseNumber(getFuzzyKey(h, ["ราคา", "price", "จำนวนเงิน"]) || 0);
             const shareCount = staffNames.length;
             totalCommission += (price * ((employee.commissionRate || 0) / 100)) / shareCount;
             serviceCount++;
         }
     });
     
     const empServiceLogs = serviceLogs.filter(s => s.employeeId === employee.id && isInPayrollMonth(s, payrollMonth));
     let totalServiceFees = 0;
     empServiceLogs.forEach(s => {
         const typeName = String(s.type || '').toLowerCase();
         let rawAmount = parseNumber(s.amount);
         const isPOS = typeof s.note === 'string' && s.note.startsWith('POS:');
         
         if (isPOS && (typeName.includes('จี้ไฝ') || typeName.includes('mole')) && rawAmount < 100) rawAmount = rawAmount * 10;

         if (typeName.includes('นวดหน้า') || typeName.includes('active skin') || typeName.includes('ipl รักแร้') || typeName.includes('ทรีทเม้นท์')) {
             totalServiceFees += 50;
         } else if (typeName.includes('กดสิว')) {
             totalServiceFees += 30;
         } else if (typeName.includes('สปา') || typeName.includes('ขัดตัว')) {
             totalServiceFees += 100;
         } else if (typeName.includes('จี้ไฝ') || typeName.includes('กระ') || typeName.includes('ติ่งเนื้อ') || typeName.includes('mole')) {
             totalServiceFees += rawAmount < 1000 ? (rawAmount * 0.10) : (rawAmount * 0.20);
         } else {
             totalServiceFees += isPOS ? (rawAmount * 0.10) : rawAmount;
         }
     });
     
     const empAdvances = advancePayments.filter(a => a.employeeId === employee.id && (a.status === 'อนุมัติ' || a.status === 'อนุมัติแล้ว') && isInPayrollMonth(a, payrollMonth));
     let totalAdvances = 0;
     empAdvances.forEach(a => totalAdvances += parseNumber(a.amount));
     
     const empAttendance = attendance.filter(a => a.employeeId === employee.id && isInPayrollMonth(a, payrollMonth));
     const daysWorked = new Set(empAttendance.map(a => a.date)).size;
     const totalFoodAllowance = daysWorked * 50;

     const baseSalary = parseNumber(employee.baseSalary || 0);
     const totalIncome = baseSalary + totalCommission + totalServiceFees + totalFoodAllowance - totalAdvances;
     
     return {
         ...employee,
         totalCommission,
         totalServiceFees,
         totalFoodAllowance,
         totalAdvances,
         netSalary: totalIncome, // Keep netSalary for UI compatibility if needed elsewhere
         totalIncome, // For PayslipModal
         daysWorked,
         serviceCount,
         serviceLogCount: empServiceLogs.length
     };
  }, [histories, serviceLogs, advancePayments, employee, payrollMonth]);
  
  // Calculate Branch Target Progress
  const branchTargetStats = useMemo(() => {
     const currentMonth = new Date().toISOString().substring(0, 7);
     
     // Handle branch name mismatch (e.g. "เฉวง" vs "สาขาเฉวง")
     const empBranch = employee.branch || '';
     const altBranch = empBranch.startsWith('สาขา') ? empBranch.replace('สาขา', '').trim() : 'สาขา' + empBranch;
     
     let branchSales = 0;
     orders.forEach(o => {
       const isSameMonth = o.createdAt && o.createdAt.startsWith(currentMonth);
       const isSameBranch = o.branch === empBranch || o.branch === altBranch;
       if (isSameMonth && isSameBranch && (!o.status || o.status === 'อนุมัติแล้ว')) {
         const isPO = o.transactionType === 'owner_purchase' || (o.courseName || '').includes('[ซื้อเข้า');
         const isReq = o.transactionType === 'branch_requisition' || (o.courseName || '').includes('[เบิกจาก');
         if (!isPO && !isReq) {
           branchSales += parseNumber(o.price);
         }
       }
     });
     
     let target = parseNumber(appSettings?.branchTargets?.[empBranch] || 0);
     if (!target) {
        target = parseNumber(appSettings?.branchTargets?.[altBranch] || 0);
     }
     
     const percent = target > 0 ? Math.min(100, (branchSales / target) * 100) : 0;
     
     return { branchSales, target, percent };
  }, [orders, appSettings, employee.branch]);

  const handleSubmitService = async (e) => {
    e.preventDefault();
    if (!serviceForm.amount || !serviceForm.date) {
       alert("กรุณากรอกข้อมูลให้ครบถ้วน");
       return;
    }
    setIsSubmittingService(true);
    try {
       await addDoc(getCol('service_logs'), {
          ...serviceForm,
          amount: parseNumber(serviceForm.amount),
          employeeId: employee.id,
          employeeName: employee.name,
          branch: employee.branch,
          createdAt: new Date().toISOString()
       });
       alert("บันทึกค่ามือเรียบร้อยแล้ว");
       setServiceForm({ ...serviceForm, amount: '', note: '' });
    } catch(err) {
       console.error(err);
       alert("เกิดข้อผิดพลาด");
    }
    setIsSubmittingService(false);
  };
  
  const today = new Date().toISOString().split('T')[0];
  const todayAtt = myAttendance.find(a => a.date === today);
  const isActiveShift = todayAtt && !todayAtt.clockOut;

  const todayStr = new Date().toLocaleDateString('th-TH');
  const hasSubmittedEOD = dailySales?.some(d => d.date === todayStr && d.branch === (todayAtt?.branch || employee.branch));
  
  const hasClockedOutToday = todayAtt && todayAtt.clockOut;
  const neverClockedInToday = !todayAtt;
  
  const canAccessPOS = isAdmin || 
                       isActiveShift || 
                       (hasClockedOutToday && !hasSubmittedEOD);
  const isPosLocked = !canAccessPOS;

  // Force active tab to dashboard if not active shift, except for requests_group
  useEffect(() => {
     if (!isActiveShift && activeTab !== 'dashboard' && activeTab !== 'requests_group') {
        setActiveTab('dashboard');
     }
  }, [isActiveShift, activeTab]);
  const handleSaveBenefitRequest = async (e) => {
    e.preventDefault();
    setIsSubmittingBenefit(true);
    try {
        const reqTitle = benefitForm.type === 'product_limit' ? 'เบิกวงเงินผลิตภัณฑ์' : 'เบิกค่าชุดยูนิฟอร์ม';
        const data = {
           employeeId: employee.id,
           employeeName: employee.name,
           itemName: reqTitle,
           quantity: Number(benefitForm.amount),
           reason: benefitForm.note,
           status: 'รออนุมัติ',
           createdAt: new Date().toISOString(),
           updatedAt: new Date().toISOString()
        };
        // Store in employee_requisitions so it shows up in "Requests Summary" easily,
        // and HR can approve it in "Requests/Supplies" view.
        await addDoc(getCol('employee_requisitions'), data);
        alert('ส่งคำขอใช้สิทธิ์สำเร็จ กรุณารอผู้อนุมัติ');
        setBenefitForm({ show: false, type: '', amount: '', note: '' });
    } catch (err) {
        alert('เกิดข้อผิดพลาด: ' + err.message);
    }
    setIsSubmittingBenefit(false);
  };

  const handleSaveLeave = async (e) => {
    e.preventDefault();
    if (!leaveForm.dates || leaveForm.dates.length === 0) {
        alert('กรุณาเลือกวันที่ต้องการลาบนปฏิทินก่อนครับ');
        return;
    }
    setIsSubmittingLeave(true);
    try {
        const batchPromises = leaveForm.dates.map(dateStr => {
            const finalReason = leaveForm.leaveType === 'สลับวันหยุด' 
                ? `ขอสลับวันหยุด โดยจะมาทำงานชดเชยในวันที่ ${new Date(leaveForm.replacementDate).toLocaleDateString('th-TH')} (เหตุผล: ${leaveForm.reason})`
                : leaveForm.reason;
                
            const data = {
               employeeId: employee.id,
               employeeName: employee.name,
               leaveType: leaveForm.leaveType,
               startDate: dateStr,
               endDate: dateStr,
               reason: finalReason,
               replacementDate: leaveForm.leaveType === 'สลับวันหยุด' ? leaveForm.replacementDate : null,
               status: 'รออนุมัติ',
               createdAt: new Date().toISOString(),
               updatedAt: new Date().toISOString()
            };
            return addDoc(getCol('employee_leaves'), data);
        });
        
        await Promise.all(batchPromises);
        
        alert('ส่งคำขอลาสำเร็จ กรุณารอผู้จัดการอนุมัติ');
        setLeaveForm({ leaveType: 'ลาป่วย', startDate: '', endDate: '', reason: '', dates: [], replacementDate: '' });
        setCalendarSelection([]);
        setActiveTab('dashboard');
    } catch(err) {
        alert('เกิดข้อผิดพลาด: ' + err.message);
    }
    setIsSubmittingLeave(false);
  };

  const internalDeleteServiceLog = async (logId) => {
    if (onDeleteServiceLog) {
       onDeleteServiceLog(logId);
       return;
    }
    try {
      await deleteDoc(doc(db, 'service_logs', logId));
      alert('ลบข้อมูลเรียบร้อยแล้ว');
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const handleSaveAdvance = async (e) => {
    e.preventDefault();
    if (isNaN(advanceForm.amount) || advanceForm.amount <= 0) {
        alert('กรุณาระบุจำนวนเงินที่ถูกต้อง');
        return;
    }
    setIsSubmittingAdvance(true);
    try {
        const data = {
           employeeId: employee.id,
           employeeName: employee.name,
           amount: Number(advanceForm.amount),
           reason: advanceForm.reason,
           status: 'รออนุมัติ',
           createdAt: new Date().toISOString(),
           updatedAt: new Date().toISOString()
        };
        await addDoc(getCol('advance_payments'), data);
        alert('ส่งคำขอเบิกเงินสำเร็จ กรุณารอผู้จัดการอนุมัติ');
        setAdvanceForm({ amount: '', reason: '' });
    } catch(err) {
        alert('เกิดข้อผิดพลาด: ' + err.message);
    }
    setIsSubmittingAdvance(false);
  };
  const [isSubmittingSupplies, setIsSubmittingSupplies] = useState(false);
  
  const handleSaveSupplies = async (e) => {
    e.preventDefault();
    if (!suppliesForm.itemName || !suppliesForm.quantity) {
        alert('กรุณาระบุชื่อของใช้และจำนวน');
        return;
    }
    setIsSubmittingSupplies(true);
    try {
        const data = {
           employeeId: employee.id,
           employeeName: employee.name,
           itemName: suppliesForm.itemName,
           quantity: suppliesForm.quantity,
           reason: suppliesForm.reason,
           status: 'รออนุมัติ',
           createdAt: new Date().toISOString(),
           updatedAt: new Date().toISOString()
        };
        await addDoc(getCol('employee_requisitions'), data);
        alert('ส่งคำขอเบิกของใช้สำเร็จ กรุณารอผู้จัดการอนุมัติ');
        setSuppliesForm({ itemName: '', quantity: '', reason: '' });
    } catch(err) {
        alert('เกิดข้อผิดพลาด: ' + err.message);
    }
    setIsSubmittingSupplies(false);
  };


  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex flex-col animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white px-4 md:px-6 py-4 border-b border-slate-200 flex items-center shadow-sm">
        {/* Left: Employee Info */}
        <div className="flex items-center gap-3 md:gap-4">
          <label className="relative w-10 h-10 md:w-12 md:h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-indigo-200 overflow-hidden shadow-sm transition-colors shrink-0">
            {employee.profileImage ? (
                <img src={employee.profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
                <User size={24} />
            )}
            {isUploadingImage && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploadingImage} />
          </label>
          <div>
            <h2 className="text-lg md:text-xl font-black text-slate-800 leading-tight">{employee.name}</h2>
            <p className="text-xs md:text-sm font-bold text-slate-500">สาขาประจำ: {employee.branch}</p>
          </div>
        </div>
        {/* Center: POS Button - same style as POS page */}
        <div className="flex-1 flex justify-center">
          <button
            onClick={() => {
              if (isPosLocked) return; // เหตุผลแสดงบนปุ่ม/ในหน้าแดชบอร์ดแล้ว
              onClose();
              if (onGoToPOS) onGoToPOS();
            }}
            className={`flex items-center gap-2 px-4 py-2 font-semibold rounded-xl transition-all duration-200 ${isPosLocked ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/40 active:scale-[0.98]'}`}
            title={isPosLocked ? (neverClockedInToday ? "ต้องกดเข้างานก่อนจึงจะใช้งาน POS ได้" : "ส่งยอดประจำวันเรียบร้อยแล้ว") : "ไปยังหน้า POS"}
          >
            {isPosLocked ? <ShieldAlert size={20} /> : <ShoppingCart size={20} />}
            <span>POS {isPosLocked && '(ล็อค)'}</span>
          </button>
        </div>
        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button onClick={() => setShowContract(true)} className="p-2 md:py-2 md:px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold rounded-xl flex items-center gap-2 transition-colors" title="ดูหนังสือสัญญา">
            <FileText size={18} /> <span className="hidden md:inline text-sm">สัญญา</span>
          </button>
          <button onClick={() => { localStorage.removeItem('selectedBranch'); localStorage.removeItem('userRole'); localStorage.removeItem('admin_session_exp'); localStorage.removeItem('personalEmployeeId'); window.location.reload(); }} className="p-2 md:py-2 md:px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-2 transition-colors">
            <LogOut size={18} /> <span className="hidden md:inline text-sm">ออกจากระบบ</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4 md:p-8 flex flex-col md:flex-row gap-6 max-w-7xl mx-auto w-full">
         
         {/* Navigation Tabs (Desktop sidebar) */}
         <div className="hidden md:flex flex-col w-64 gap-2 shrink-0">
            {[
               { id: 'dashboard', icon: Clock, label: 'ลงเวลา' },
               { id: 'requests_group', icon: Send, label: 'คำร้อง (ลา/เบิก)' },
               ...(isActiveShift ? [
                  { id: 'service', icon: UserCheck, label: 'บันทึกค่ามือ' },
                  { id: 'schedule_group', icon: Calendar, label: 'ตาราง & ประวัติ' },
                  { id: 'settings', icon: Lock, label: 'ตั้งค่า' }
               ] : [])
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)} 
                className={`p-4 rounded-2xl font-bold flex items-center gap-2 transition-colors ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
              >
                 <tab.icon size={18} /> {tab.label}
              </button>
            ))}
         </div>

         {/* Content Area */}
         <div className="flex-1 min-w-0 flex flex-col gap-6 pb-32 md:pb-0">
            
            {/* Dashboard / Clock In-Out — 🌟 พื้นที่ทำงานวันนี้: สถานะกะ + ปุ่มหลักปุ่มเดียวตามสถานะ */}
            {activeTab === 'dashboard' && (
               <div className="flex flex-col gap-6">
                  <div className="bg-white p-4 md:p-6 rounded-3xl border border-slate-200 shadow-sm">
                     {/* Hero สถานะกะ */}
                     <div className={`rounded-2xl p-4 mb-4 border ${neverClockedInToday ? 'bg-slate-50 border-slate-200' : todayAtt?.clockOut ? (hasSubmittedEOD ? 'bg-blue-50 border-blue-100' : 'bg-amber-50 border-amber-100') : 'bg-emerald-50 border-emerald-200'}`}>
                        <div className="flex items-center justify-between gap-3">
                           <div className="min-w-0">
                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">สถานะกะวันนี้ · {(todayAtt?.branch || employee.branch)}</p>
                              {neverClockedInToday ? (
                                 <h3 className="text-lg md:text-xl font-black text-slate-700">ยังไม่ได้เข้างาน</h3>
                              ) : todayAtt?.clockOut ? (
                                 <>
                                    <h3 className="text-lg md:text-xl font-black text-slate-700">ออกงานแล้ว {new Date(todayAtt.clockOut).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</h3>
                                    <p className="text-[11px] font-bold text-slate-500 mt-0.5">{hasSubmittedEOD ? '✅ ส่งยอดประจำวันเรียบร้อย — วันนี้เสร็จแล้วครับ' : '🟡 ยังไม่ได้ส่งยอดประจำวัน (EOD)'}</p>
                                 </>
                              ) : (
                                 <>
                                    <h3 className="text-lg md:text-xl font-black text-emerald-700 flex items-center gap-2">
                                       <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span> กำลังทำงาน
                                    </h3>
                                    <p className="text-[11px] font-bold text-emerald-600 mt-0.5">
                                       เข้างาน {new Date(todayAtt.clockIn).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                                       {(() => {
                                          const diffMs = currentTime.getTime() - new Date(todayAtt.clockIn).getTime();
                                          const hours = Math.floor(diffMs / (1000 * 60 * 60));
                                          const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                                          return ` · แล้วเลยมา ${hours} ชม. ${mins} น.`;
                                       })()}
                                    </p>
                                 </>
                              )}
                           </div>
                        </div>
                     </div>

                     {/* ปุ่มหลักปุ่มเดียวตามสถานะ */}
                     {neverClockedInToday ? (
                        <div>
                           <button onClick={() => onClockIn(employee)} className="w-full py-4 md:py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-base md:text-lg shadow-lg shadow-indigo-600/30 transition-transform active:scale-95 flex items-center justify-center gap-3">
                              <UserCheck size={24} /> เข้างาน (บันทึกเวลา + GPS)
                           </button>
                           <p className="text-[10px] text-center text-slate-400 font-bold mt-2">ต้องอยู่ใกล้สาขา (GPS ระยะ 100 เมตร) จึงจะบันทึกได้</p>
                        </div>
                     ) : isPosLocked ? (
                        <div className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-sm flex items-center justify-center gap-2">
                           <Lock size={18} /> POS ปิดใช้งาน — {hasSubmittedEOD ? 'ส่งยอดวันนี้เรียบร้อยแล้ว' : 'ต้องกดเข้างานก่อน'}
                        </div>
                     ) : (
                        <div className="flex flex-col gap-2.5">
                           <button
                              onClick={() => { onClose(); if (onGoToPOS) onGoToPOS(); }}
                              className="w-full py-4 md:py-5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black text-base md:text-lg shadow-lg shadow-emerald-900/30 transition-transform active:scale-95 flex items-center justify-center gap-3"
                           >
                              <ShoppingCart size={24} /> เปิด POS ขายสินค้า
                           </button>
                           {isActiveShift ? (
                              <button onClick={() => onClockOut(todayAtt)} className="w-full py-3 bg-white hover:bg-rose-50 text-rose-600 rounded-2xl font-black text-sm border border-rose-200 transition-colors active:scale-95 flex items-center justify-center gap-2">
                                 <UserMinus size={18} /> บันทึกออกงาน
                              </button>
                           ) : !hasSubmittedEOD && (
                              <p className="text-[10px] text-center text-amber-600 font-bold">💡 ยังเปิด POS ได้เพื่อส่งยอดประจำวัน (EOD) — ส่งแล้วจึงปิดก่อนออกงานได้</p>
                           )}
                        </div>
                     )}
                  </div>

                  {/* Motivation Cards */}

                  <div className="grid grid-cols-2 gap-4">
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
                  
                  {/* Commission Rates Summary */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-5 rounded-2xl border border-blue-100 shadow-sm relative overflow-hidden group mb-4">
                     <div className="absolute -right-4 -bottom-4 text-blue-200 opacity-40 group-hover:scale-110 transition-transform duration-500"><Percent size={80}/></div>
                     <div className="relative z-10">
                        <div className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2"><DollarSign size={16}/> สรุปเรทค่าคอมมิชชันและค่ามือ (My Rates)</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs md:text-sm">
                           <div className="bg-white/60 p-3 rounded-xl border border-blue-100 flex justify-between items-center">
                              <span className="font-bold text-slate-700">💆‍♀️ ค่าคอมมิชชันหัตถการ/คอร์ส</span>
                              <span className="font-black text-indigo-600">{employee.commissionRate || 0}%</span>
                           </div>
                           <div className="bg-white/60 p-3 rounded-xl border border-blue-100 flex justify-between items-center">
                              <span className="font-bold text-slate-700">🧴 ค่าคอมมิชชันสินค้า</span>
                              <span className="font-black text-pink-600">{employee.productCommissionRate || 0}%</span>
                           </div>
                           <div className="bg-white/60 p-3 rounded-xl border border-blue-100 flex flex-col md:col-span-2 gap-2">
                              <span className="font-bold text-slate-700 mb-1">🖐️ เรทค่ามือ (Service Fees)</span>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-[11px] md:text-xs">
                                 <div className="flex justify-between border-b border-blue-50 pb-1"><span>กดสิว</span><span className="font-black text-emerald-600">20 บ./เคส</span></div>
                                 <div className="flex justify-between border-b border-blue-50 pb-1"><span>ทรีทเม้นท์/นวดหน้า/เลเซอร์ IPL</span><span className="font-black text-emerald-600">50 บ./เคส</span></div>
                                 <div className="flex justify-between border-b border-blue-50 pb-1"><span>สปาขัดตัว</span><span className="font-black text-emerald-600">100 บ./เคส</span></div>
                                 <div className="flex justify-between border-b border-blue-50 pb-1"><span>จี้ไฝ/กระ/ติ่งเนื้อ</span><span className="font-black text-emerald-600">10-20% ของยอดบิล</span></div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Benefits Summary */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 md:p-5 rounded-2xl border border-amber-100 shadow-sm relative overflow-hidden group mb-4">
                     <div className="absolute -right-4 -bottom-4 text-amber-200 opacity-40 group-hover:scale-110 transition-transform duration-500"><Gift size={80}/></div>
                     <div className="relative z-10">
                        <div className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2"><Gift size={16}/> สวัสดิการของฉัน (My Benefits)</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs md:text-sm">
                           <div className="bg-white/60 p-3 rounded-xl border border-amber-100 flex justify-between items-center">
                              <span className="font-bold text-slate-700">🍚 ค่าอาหาร</span>
                              <span className="font-black text-amber-700">{employee.foodAllowanceRate !== undefined ? employee.foodAllowanceRate : 50} บ./วัน</span>
                           </div>
                           <div className="bg-white/60 p-3 rounded-xl border border-amber-100 flex justify-between items-center">
                              <span className="font-bold text-slate-700">💪 เบี้ยขยัน</span>
                              <span className="font-black text-amber-700">{employee.diligenceAllowance !== undefined ? employee.diligenceAllowance : 500} บ./เดือน</span>
                           </div>
                           {employee.employmentStatus === 'regular' && (
                             <>
                               <div className="bg-white/90 p-3 rounded-xl border border-amber-200 flex flex-col gap-2 md:col-span-2 shadow-sm">
                                  <div className="flex justify-between items-center">
                                     <span className="font-bold text-slate-700 flex items-center gap-1">🛍️ วงเงินผลิตภัณฑ์ (ต่อปี)</span>
                                     <span className="text-[10px] md:text-xs font-bold text-slate-500">ใช้ไป {(Number(employee.usedVipProductLimit) || 0).toLocaleString()} / {(employee.vipProductLimit !== undefined ? Number(employee.vipProductLimit) : 2000).toLocaleString()} บ.</span>
                                  </div>
                                  <div className="w-full bg-slate-100 rounded-full h-2.5 mb-1 overflow-hidden shadow-inner">
                                     <div className="bg-gradient-to-r from-amber-400 to-orange-500 h-2.5 rounded-full" style={{ width: `${Math.min(100, ((Number(employee.usedVipProductLimit) || 0) / (employee.vipProductLimit !== undefined ? Number(employee.vipProductLimit) : 2000)) * 100)}%` }}></div>
                                  </div>
                                  <div className="flex justify-between items-center mt-1">
                                    <button onClick={() => setBenefitForm({ show: true, type: 'product_limit', amount: '', note: '' })} className="bg-amber-100 hover:bg-amber-200 text-amber-700 px-3 py-1 rounded-lg text-[10px] md:text-xs font-bold transition-colors">🎁 ขอใช้สิทธิ์</button>
                                    <div className="text-[10px] md:text-xs font-black text-amber-700 text-right">เหลือ: {Math.max(0, (employee.vipProductLimit !== undefined ? Number(employee.vipProductLimit) : 2000) - (Number(employee.usedVipProductLimit) || 0)).toLocaleString()} บ.</div>
                                  </div>
                               </div>

                               <div className="bg-white/90 p-3 rounded-xl border border-amber-200 flex flex-col gap-2 md:col-span-2 shadow-sm">
                                  <div className="flex justify-between items-center">
                                     <span className="font-bold text-slate-700 flex items-center gap-1">👕 ค่าชุดยูนิฟอร์ม (ต่อปี)</span>
                                     <span className="text-[10px] md:text-xs font-bold text-slate-500">ใช้ไป {(Number(employee.usedVipUniformAllowance) || 0).toLocaleString()} / {(employee.vipUniformAllowance !== undefined ? Number(employee.vipUniformAllowance) : 1500).toLocaleString()} บ.</span>
                                  </div>
                                  <div className="w-full bg-slate-100 rounded-full h-2.5 mb-1 overflow-hidden shadow-inner">
                                     <div className="bg-gradient-to-r from-blue-400 to-indigo-500 h-2.5 rounded-full" style={{ width: `${Math.min(100, ((Number(employee.usedVipUniformAllowance) || 0) / (employee.vipUniformAllowance !== undefined ? Number(employee.vipUniformAllowance) : 1500)) * 100)}%` }}></div>
                                  </div>
                                  <div className="flex justify-between items-center mt-1">
                                    <button onClick={() => setBenefitForm({ show: true, type: 'uniform_allowance', amount: '', note: '' })} className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1 rounded-lg text-[10px] md:text-xs font-bold transition-colors">🎁 ขอใช้สิทธิ์</button>
                                    <div className="text-[10px] md:text-xs font-black text-indigo-700 text-right">เหลือ: {Math.max(0, (employee.vipUniformAllowance !== undefined ? Number(employee.vipUniformAllowance) : 1500) - (Number(employee.usedVipUniformAllowance) || 0)).toLocaleString()} บ.</div>
                                  </div>
                               </div>

                               <div className="bg-white/90 p-3 rounded-xl border border-amber-200 flex flex-col gap-2 md:col-span-2 shadow-sm">
                                  <div className="flex justify-between items-center">
                                     <span className="font-bold text-slate-700 flex items-center gap-1">🏖️ วันหยุดพักร้อน (ต่อปี)</span>
                                     <span className="text-[10px] md:text-xs font-bold text-slate-500">ใช้ไป {usedAnnualLeave} / {employee.vipAnnualLeaveDays !== undefined ? Number(employee.vipAnnualLeaveDays) : 10} วัน</span>
                                  </div>
                                  <div className="w-full bg-slate-100 rounded-full h-2.5 mb-1 overflow-hidden shadow-inner">
                                     <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-2.5 rounded-full" style={{ width: `${Math.min(100, (usedAnnualLeave / (employee.vipAnnualLeaveDays !== undefined ? Number(employee.vipAnnualLeaveDays) : 10)) * 100)}%` }}></div>
                                  </div>
                                  <div className="text-[10px] md:text-xs font-black text-teal-700 text-right">เหลือ: {Math.max(0, (employee.vipAnnualLeaveDays !== undefined ? Number(employee.vipAnnualLeaveDays) : 10) - usedAnnualLeave)} วัน</div>
                               </div>

                               <div className="bg-white/60 p-3 rounded-xl border border-amber-100 flex justify-between items-center">
                                  <span className="font-bold text-slate-700">🎂 โบนัสวันเกิด</span>
                                  <span className="font-black text-amber-700">{(employee.vipBirthdayBonus !== undefined ? Number(employee.vipBirthdayBonus) : 1000).toLocaleString()} บ./ปี</span>
                               </div>
                               <div className="bg-white/60 p-3 rounded-xl border border-amber-100 flex justify-between items-center md:col-span-2">
                                  <span className="font-bold text-slate-700">🏷️ ส่วนลดซื้อสินค้าพนักงาน</span>
                                  <span className="font-black text-amber-700">{employee.vipProductDiscountRate !== undefined ? employee.vipProductDiscountRate : 30}%</span>
                               </div>
                             </>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* Salary Breakdown */}
                  <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm relative">
                     <div className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><DollarSign size={16} className="text-emerald-500"/> รายละเอียดการคำนวณเงินเดือน</div>
                     <button onClick={() => setShowContract(true)} className="absolute top-4 right-4 text-slate-400 hover:text-indigo-600 transition-colors p-1" title="ดูหนังสือสัญญา">
                        <FileText size={18} />
                     </button>
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
                           <span>ค่าอาหาร</span>
                           <span className="font-bold text-emerald-600">+ ฿{(payrollEmployee.totalFoodAllowance || 0).toLocaleString()}</span>
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
                  </div>
                  
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                     <div className="flex justify-between items-center mb-2">
                        <div className="text-sm font-bold text-slate-700 flex items-center gap-2"><ShoppingCart size={16} className="text-pink-500"/> เป้าหมายยอดขายสาขา {employee.branch}</div>
                        {branchTargetStats.target > 0 ? (
                           <div className="text-xs font-bold text-slate-500">{branchTargetStats.percent.toFixed(1)}%</div>
                        ) : (
                           <div className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">ยังไม่ตั้งเป้า</div>
                        )}
                     </div>
                     <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden">
                        <div className="bg-gradient-to-r from-pink-500 to-rose-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${branchTargetStats.percent}%` }}></div>
                     </div>
                     <div className="flex justify-between text-xs font-bold text-slate-400">
                        <span>ทำได้ ฿{branchTargetStats.branchSales.toLocaleString()}</span>
                        <span>เป้า ฿{branchTargetStats.target.toLocaleString()}</span>
                     </div>
                  </div>
                  {/* Monthly Requests Summary */}
                  <div className="bg-white p-4 md:p-5 rounded-3xl border border-slate-200 shadow-sm mb-4">
                     <div className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><Send size={16} className="text-indigo-500"/> สถานะคำร้องเดือนนี้</div>
                     <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                        {(() => {
                           const currentMonthPrefix = new Date().toISOString().substring(0, 7); // YYYY-MM
                           
                           // Combine leaves, advances, requisitions for the current employee and current month
                           const empLeaves = leaves.filter(l => l.employeeId === employee.id && (l.createdAt || '').startsWith(currentMonthPrefix))
                              .map(l => ({ ...l, reqType: 'leave', title: l.leaveType, amount: null }));
                           const empAdvances = advancePayments.filter(a => a.employeeId === employee.id && (a.createdAt || '').startsWith(currentMonthPrefix))
                              .map(a => ({ ...a, reqType: 'advance', title: 'เบิกเงินล่วงหน้า', amount: a.amount }));
                           const empRequisitions = requisitions.filter(r => r.employeeId === employee.id && (r.createdAt || '').startsWith(currentMonthPrefix))
                              .map(r => ({ ...r, reqType: 'requisition', title: 'เบิกของใช้: ' + r.itemName, amount: r.quantity }));
                              
                           const allMyRequests = [...empLeaves, ...empAdvances, ...empRequisitions]
                              .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
                              
                           if (allMyRequests.length === 0) {
                              return <div className="text-center text-slate-400 font-bold py-6 bg-slate-50 rounded-2xl text-xs border border-slate-100">ไม่มีคำร้องในเดือนนี้</div>;
                           }
                           
                           return allMyRequests.map((req, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                                 <div>
                                    <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                                      <div className={`w-2 h-2 rounded-full ${
                                          req.status === 'อนุมัติ' || req.status === 'อนุมัติแล้ว' ? 'bg-emerald-500' :
                                          req.status === 'ไม่อนุมัติ' ? 'bg-rose-500' :
                                          'bg-amber-400'
                                      }`}></div>
                                      {req.title}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-medium mt-1">
                                       {new Date(req.createdAt).toLocaleDateString('th-TH')}
                                       {req.reqType === 'leave' && req.startDate && ` (${new Date(req.startDate).toLocaleDateString('th-TH')})`}
                                       {req.reqType === 'advance' && ` - ฿${Number(req.amount).toLocaleString()}`}
                                       {req.reqType === 'requisition' && ` - จำนวน: ${req.amount}`}
                                    </div>
                                 </div>
                                 <div>
                                     <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                                          req.status === 'อนุมัติ' || req.status === 'อนุมัติแล้ว' ? 'bg-emerald-100 text-emerald-700' :
                                          req.status === 'ไม่อนุมัติ' ? 'bg-rose-100 text-rose-700' :
                                          'bg-amber-100 text-amber-700'
                                     }`}>
                                        {req.status || 'รออนุมัติ'}
                                     </span>
                                 </div>
                              </div>
                           ));
                        })()}
                     </div>
                  </div>
               </div>
            )}

            {/* Attendance History View */}
            {activeTab === 'history' && (
               <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full max-h-[70vh]">
                  <div className="p-4 md:p-6 border-b border-slate-200">
                     <h3 className="text-lg md:text-xl font-black text-slate-800 flex items-center gap-2"><History className="text-indigo-500" /> ประวัติการลงเวลา</h3>
                  </div>
                  <div className="overflow-auto p-2">
                     <div className="space-y-2">
                        {myAttendance.length === 0 ? (
                           <div className="py-8 text-center text-slate-400 font-bold">ไม่มีข้อมูลประวัติลงเวลา</div>
                        ) : myAttendance.map(att => (
                           <div key={att.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                              <div>
                                 <p className="font-bold text-slate-800">{new Date(att.date).toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                 <p className="text-xs font-bold text-slate-500 mt-1">สาขา: {att.branch}</p>
                              </div>
                              <div className="flex gap-2">
                                 <div className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold">
                                    เข้า: {new Date(att.clockIn).toLocaleTimeString('th-TH')}
                                 </div>
                                 <div className="bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-bold">
                                    ออก: {att.clockOut ? new Date(att.clockOut).toLocaleTimeString('th-TH') : '-'}
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            )}

            {/* Service Fees View */}
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
                                    <h4 className="font-black text-pink-600 text-lg">
                                       ฿{Number(log.amount).toLocaleString()} 
                                       <span className="text-sm font-bold text-emerald-500 ml-2">
                                          (ได้ {typeof log.note === 'string' && log.note.startsWith('POS:') ? `฿${(Number(log.amount) * 0.10).toLocaleString()}` : `เต็ม ฿${Number(log.amount).toLocaleString()}`})
                                       </span>
                                    </h4>
                                    <p className="text-xs font-bold text-slate-500 mt-0.5">{new Date(log.date).toLocaleDateString('th-TH')} - {log.type}</p>
                                 </div>
                                 <button 
                                    onClick={() => {
                                       if (window.confirm('ต้องการลบประวัติค่ามือนี้หรือไม่?')) {
                                          internalDeleteServiceLog(log.id);
                                       }
                                    }}
                                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0 ml-2"
                                    title="ลบข้อมูล"
                                 >
                                    <Trash2 size={16} />
                                 </button>
                              </div>
                              {log.note && <p className="text-sm text-slate-600 bg-white p-2 rounded-xl border border-slate-100">{log.note}</p>}
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            )}
            
            {/* Requests Group */}
            {activeTab === 'requests_group' && (
               <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full max-h-[80vh]">
                  <div className="flex bg-slate-50 border-b border-slate-200">
                     <button onClick={() => setRequestsSubTab('leave')} className={`flex-1 py-4 font-bold text-sm transition-colors ${requestsSubTab === 'leave' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}>ยื่นขอลา</button>
                     <button onClick={() => setRequestsSubTab('finance')} className={`flex-1 py-4 font-bold text-sm transition-colors ${requestsSubTab === 'finance' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}>เบิกเงินล่วงหน้า</button>
                     <button onClick={() => setRequestsSubTab('supplies')} className={`flex-1 py-4 font-bold text-sm transition-colors ${requestsSubTab === 'supplies' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}>เบิกของใช้</button>
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
                                       <option value="สลับวันหยุด">สลับวันหยุด</option>
                                       <option value="อื่นๆ">อื่นๆ</option>
                                    </select>
                                 </div>
                                 <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                                        <label className="block text-xs font-bold text-indigo-800 mb-2">วันที่เลือก ({leaveForm.dates?.length || 0} วัน):</label>
                                        <div className="flex flex-wrap gap-2">
                                            {leaveForm.dates && leaveForm.dates.length > 0 ? (
                                                leaveForm.dates.map(d => (
                                                    <span key={d} className="px-3 py-1 bg-white text-indigo-700 rounded-lg text-sm font-bold shadow-sm border border-indigo-200">
                                                        {new Date(d).toLocaleDateString('th-TH')}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-sm text-slate-500 font-bold">ยังไม่ได้เลือกวัน (กรุณากลับไปเลือกที่ปฏิทิน)</span>
                                            )}
                                        </div>
                                     </div>
                                     {leaveForm.leaveType === 'สลับวันหยุด' && (
                                         <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">วันที่มาทำงานชดเชย</label>
                                            <input required type="date" value={leaveForm.replacementDate} onChange={e => setLeaveForm({...leaveForm, replacementDate: e.target.value})} className="w-full bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 font-bold focus:border-amber-500 outline-none text-amber-700 text-sm" />
                                         </div>
                                     )}
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
                                          <span className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                                             leave.status === 'อนุมัติ' ? 'bg-emerald-100 text-emerald-700' :
                                             leave.status === 'ไม่อนุมัติ' ? 'bg-rose-100 text-rose-700' :
                                             'bg-amber-100 text-amber-700'
                                          }`}>
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
                                          <span className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                                             adv.status === 'อนุมัติ' ? 'bg-emerald-100 text-emerald-700' :
                                             adv.status === 'ไม่อนุมัติ' ? 'bg-rose-100 text-rose-700' :
                                             'bg-amber-100 text-amber-700'
                                          }`}>
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
                     {requestsSubTab === 'supplies' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 md:p-6">
                           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-fit">
                              <h3 className="text-lg md:text-xl font-black text-slate-800 mb-2 flex items-center gap-2"><ShoppingCart className="text-indigo-500" /> ขอเบิกของใช้ในร้าน</h3>
                              <p className="text-sm text-slate-500 font-bold mb-6">ระบุของใช้ที่ต้องการเบิกเพื่อใช้ในงาน</p>
                              <form onSubmit={handleSaveSupplies} className="space-y-4">
                                 <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">ชื่อของใช้</label>
                                    <input required type="text" value={suppliesForm.itemName} onChange={e => setSuppliesForm({...suppliesForm, itemName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-indigo-500 outline-none text-slate-700" placeholder="เช่น กระดาษทิชชู่, น้ำยาทำความสะอาด..." />
                                 </div>
                                 <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">จำนวนที่ต้องการ</label>
                                    <input required type="text" value={suppliesForm.quantity} onChange={e => setSuppliesForm({...suppliesForm, quantity: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-indigo-500 outline-none text-slate-700" placeholder="เช่น 2 แพ็ค, 1 ขวด" />
                                 </div>
                                 <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">เหตุผล/หมายเหตุ (ถ้ามี)</label>
                                    <textarea rows="3" value={suppliesForm.reason} onChange={e => setSuppliesForm({...suppliesForm, reason: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-indigo-500 outline-none text-slate-700" placeholder="ระบุเหตุผลในการเบิก..."></textarea>
                                 </div>
                                 <button type="submit" disabled={isSubmittingSupplies} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/30 transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50">
                                    <Send size={18} /> ส่งคำขอเบิกของ
                                 </button>
                              </form>
                           </div>
                           
                           <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-full">
                              <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><Clock className="text-slate-500" /> ประวัติการเบิกของใช้</h3>
                              <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2">
                                 {myRequisitions.length === 0 ? (
                                    <div className="text-center text-slate-500 text-sm font-bold mt-10">ยังไม่มีประวัติการเบิกของใช้</div>
                                 ) : myRequisitions.map(req => (
                                    <div key={req.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                       <div className="flex justify-between items-start mb-2">
                                          <div>
                                             <div className="font-bold text-slate-800">{req.itemName}</div>
                                             <div className="text-xs text-slate-500">{new Date(req.createdAt).toLocaleDateString('th-TH')} - จำนวน {req.quantity}</div>
                                          </div>
                                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                             req.status === 'อนุมัติแล้ว' ? 'bg-emerald-100 text-emerald-700' :
                                             req.status === 'ไม่อนุมัติ' ? 'bg-red-100 text-red-700' :
                                             'bg-amber-100 text-amber-700'
                                          }`}>{req.status}</span>
                                       </div>
                                       {req.reason && <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">เหตุผล: {req.reason}</p>}
                                       {req.status === 'ไม่อนุมัติ' && req.note && (
                                          <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded-lg border border-red-100">หมายเหตุ: {req.note}</p>
                                       )}
                                    </div>
                                 ))}
                              </div>
                           </div>
                        </div>
                     )}
            {/* Schedule & History Group */}
            {activeTab === 'schedule_group' && (
               <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full max-h-[80vh]">
                  <div className="flex bg-slate-50 border-b border-slate-200">
                     <button onClick={() => setScheduleSubTab('schedule')} className={`flex-1 py-4 font-bold text-sm transition-colors ${scheduleSubTab === 'schedule' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}>ตารางงาน</button>
                     <button onClick={() => setScheduleSubTab('history')} className={`flex-1 py-4 font-bold text-sm transition-colors ${scheduleSubTab === 'history' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}>ประวัติลงเวลา</button>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
                     {scheduleSubTab === 'schedule' && (
                        <div className="space-y-4 flex flex-col h-full">
                           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                              <h3 className="text-lg md:text-xl font-black text-slate-800 flex items-center gap-2"><Calendar className="text-indigo-500" /> ตารางงานของฉัน</h3>
                              <input 
                                type="month" 
                                value={scheduleMonth} 
                                onChange={e => setScheduleMonth(e.target.value)}
                                className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto text-slate-600"
                              />
                           </div>
                           
                           <div className="grid grid-cols-7 gap-1 md:gap-2">
                              {['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map(d => (
                                 <div key={d} className="text-center font-bold text-slate-500 text-xs md:text-sm py-2">{d}</div>
                              ))}
                              
                              {(() => {
                                 const year = parseInt(scheduleMonth.split('-')[0]);
                                 const month = parseInt(scheduleMonth.split('-')[1]) - 1;
                                 const daysInMonth = new Date(year, month + 1, 0).getDate();
                                 const firstDayOfWeek = new Date(year, month, 1).getDay();
                                 
                                 const blanks = Array.from({length: firstDayOfWeek}, (_, i) => <div key={`blank-${i}`} className="p-1 md:p-2"></div>);
                                 
                                 const days = Array.from({length: daysInMonth}, (_, i) => {
                                    const day = i + 1;
                                    const dateObj = new Date(year, month, day);
                                    const dayOfWeek = dateObj.getDay();
                                    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                                    
                                    const isWeeklyOff = employee.weeklyDaysOff?.includes(dayOfWeek);
                                    const customLeave = myLeaves.find(l => l.startDate <= dateStr && l.endDate >= dateStr);
                                    
                                    let bgColor = 'bg-slate-50 border-slate-100';
                                    let textColor = 'text-slate-700';
                                    let label = '';
                                    
                                    if (isWeeklyOff) {
                                        bgColor = 'bg-red-50 border-red-100';
                                        textColor = 'text-red-600';
                                        label = 'หยุด';
                                    } else if (customLeave) {
                                        if (customLeave.status === 'รออนุมัติ') {
                                            bgColor = 'bg-amber-50 border-amber-200 border-dashed';
                                            textColor = 'text-amber-600';
                                            label = 'รออนุมัติ';
                                        } else if (customLeave.status === 'ไม่อนุมัติ') {
                                            bgColor = 'bg-slate-50 border-slate-200';
                                            textColor = 'text-slate-400';
                                            label = 'ทำงาน';
                                        } else {
                                            bgColor = 'bg-orange-50 border-orange-100';
                                            textColor = 'text-orange-600';
                                            label = customLeave.leaveType;
                                        }
                                    }
                                    
                                    const handleClick = async () => {
                                        if (customLeave) {
                                            if (window.confirm(`คุณต้องการยกเลิกคำขอ${customLeave.leaveType}ในวันที่ ${new Date(customLeave.startDate).toLocaleDateString('th-TH')} ใช่หรือไม่?`)) {
                                                try {
                                                    await deleteDoc(doc(db, 'employee_leaves', customLeave.id));
                                                    alert('ยกเลิกการลาเรียบร้อยแล้ว');
                                                } catch (err) {
                                                    alert('เกิดข้อผิดพลาดในการยกเลิก: ' + err.message);
                                                }
                                            }
                                            return;
                                        }

                                        let newSelection = [...(calendarSelection || [])];
                                        if (newSelection.includes(dateStr)) {
                                            newSelection = newSelection.filter(d => d !== dateStr);
                                        } else {
                                            newSelection.push(dateStr);
                                            newSelection.sort();
                                        }
                                        setCalendarSelection(newSelection);
                                    };

                                    const isSelected = calendarSelection && calendarSelection.includes(dateStr);

                                    if (isSelected) {
                                        bgColor = 'bg-indigo-500 border-indigo-600 shadow-md scale-105';
                                        textColor = 'text-white';
                                        label = 'เลือกแล้ว';
                                    }

                                    return (
                                      <div key={day} onClick={handleClick} className={`p-1 md:p-3 rounded-xl md:rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${bgColor} cursor-pointer hover:shadow-md`}>
                                         <span className={`font-bold text-sm md:text-lg ${textColor}`}>{day}</span>
                                         {label && <span className={`text-[8px] md:text-[10px] font-bold px-1 py-0.5 rounded-md ${isSelected ? 'bg-indigo-700/50 text-white' : 'bg-white/50 ' + textColor} truncate max-w-full`}>{label}</span>}
                                      </div>
                                    );
                                 });
                                 
                                 return [...blanks, ...days];
                              })()}
                           </div>
                           
                           {calendarSelection && calendarSelection.length > 0 && (
                                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between bg-indigo-50 border border-indigo-100 p-4 rounded-2xl animate-in fade-in slide-in-from-bottom-2">
                                    <div className="text-indigo-800 font-bold mb-2 sm:mb-0">
                                        เลือกทั้งหมด: {calendarSelection.length} วัน
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button 
                                          onClick={() => setCalendarSelection([])}
                                          className="flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 font-bold rounded-xl border border-slate-200 transition-colors"
                                        >
                                          ล้าง
                                        </button>
                                        <button 
                                          onClick={() => {
                                              setLeaveForm({ ...leaveForm, dates: [...calendarSelection] });
                                              setActiveTab('requests_group');
                                              setRequestsSubTab('leave');
                                          }}
                                          className="flex-1 sm:flex-none px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                                        >
                                          ดำเนินการแจ้งลา <Send size={18} />
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
      
      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-[210] flex justify-around items-end pb-2 px-2 h-[75px] shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
         {[
            { id: 'service', icon: UserCheck, label: 'ค่ามือ' },
            { id: 'schedule_group', icon: Calendar, label: 'ตารางงาน' },
            { id: 'dashboard', icon: Clock, label: 'ลงเวลา' },
            { id: 'requests_group', icon: Send, label: 'คำร้อง' },
            { id: 'settings', icon: Lock, label: 'ตั้งค่า' },
         ].map(tab => {
            const isMain = tab.id === 'dashboard';
            const isActive = activeTab === tab.id;
            
            if (isMain) {
                return (
                    <button 
                       key={tab.id}
                       onClick={() => setActiveTab(tab.id)} 
                       className="relative flex flex-col items-center justify-center w-[20%] h-full group"
                    >
                       <div className={`absolute -top-6 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform duration-300 ${isActive ? 'bg-indigo-600 scale-105 shadow-indigo-500/40' : 'bg-indigo-500 scale-100'}`}>
                           <tab.icon size={24} className="text-white" />
                       </div>
                       <span className={`text-[10px] font-black mt-8 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>{tab.label}</span>
                    </button>
                );
            }
            
            return (
               <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)} 
                  className={`flex flex-col items-center justify-center w-[20%] h-[50px] space-y-1 ${isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
               >
                  <tab.icon size={20} className={isActive ? 'stroke-[2.5px]' : ''} />
                  <span className="text-[10px] font-bold">{tab.label}</span>
               </button>
            );
         })}
      </div>

      {showPayslip && (
         <PayslipModal
           employee={payrollEmployee}
           payrollMonth={payrollMonth}
           onClose={() => setShowPayslip(false)}
         />
      )}

      {/* Settings / Change PIN View */}
      {activeTab === 'settings' && (
         <div className="fixed inset-0 z-[260] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
               <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 px-6 py-5 text-white relative">
                  <button onClick={() => setActiveTab('dashboard')} className="absolute top-3 right-3 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                     <X size={20} />
                  </button>
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-2">
                     <Lock size={28} />
                  </div>
                  <h2 className="text-lg font-black">เปลี่ยนรหัส PIN</h2>
                  <p className="text-xs text-white/80 mt-1">PIN 4 หลักสำหรับเข้าแดชบอร์ดของคุณ</p>
               </div>

               <form onSubmit={handleChangePin} className="px-6 py-6 space-y-4">
                  <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">PIN เดิม</label>
                     <input
                       type="password"
                       inputMode="numeric"
                       pattern="[0-9]*"
                       maxLength={4}
                       value={pinForm.oldPin}
                       onChange={(e) => setPinForm({ ...pinForm, oldPin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono text-lg tracking-[0.3em] focus:border-indigo-500 outline-none"
                       placeholder="••••"
                       autoFocus
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">PIN ใหม่ (4 หลัก)</label>
                     <input
                       type="password"
                       inputMode="numeric"
                       pattern="[0-9]*"
                       maxLength={4}
                       value={pinForm.newPin}
                       onChange={(e) => setPinForm({ ...pinForm, newPin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono text-lg tracking-[0.3em] focus:border-indigo-500 outline-none"
                       placeholder="••••"
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">ยืนยัน PIN ใหม่</label>
                     <input
                       type="password"
                       inputMode="numeric"
                       pattern="[0-9]*"
                       maxLength={4}
                       value={pinForm.confirmPin}
                       onChange={(e) => setPinForm({ ...pinForm, confirmPin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono text-lg tracking-[0.3em] focus:border-indigo-500 outline-none"
                       placeholder="••••"
                     />
                  </div>

                  {pinFormMessage.text && (
                     <p className={`text-center text-sm font-bold ${pinFormMessage.type === 'success' ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {pinFormMessage.text}
                     </p>
                  )}

                  <div className="flex gap-3 pt-2">
                     <button type="button" onClick={() => { setActiveTab('dashboard'); setPinForm({ oldPin: '', newPin: '', confirmPin: '' }); setPinFormMessage({ type: '', text: '' }); }} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors">
                        ยกเลิก
                     </button>
                     <button type="submit" disabled={isSubmittingPin} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50">
                        บันทึก PIN ใหม่
                     </button>
                  </div>

                  <p className="text-[11px] text-center text-slate-400 font-bold pt-1">
                     หากยังไม่เคยตั้ง PIN รหัสเริ่มต้นคือ <span className="font-mono">1234</span>
                  </p>
               </form>
            </div>
         </div>
      )}

      {/* Mobile Bottom Navigation Bar (Employee Version) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-[210] flex justify-around items-end h-[68px] pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-2">
         {[
            { id: 'dashboard', icon: Clock, label: 'ลงเวลา' },
            { id: 'requests_group', icon: Send, label: 'คำร้อง' },
            ...(isActiveShift ? [
               { id: 'service', icon: UserCheck, label: 'ค่ามือ' },
               { id: 'schedule_group', icon: Calendar, label: 'ตาราง' },
               { id: 'settings', icon: Lock, label: 'ตั้งค่า' }
            ] : [])
         ].map(tab => (
            <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id)} 
               className={`flex flex-col items-center justify-center w-full h-full pb-1.5 space-y-1 ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
               <tab.icon size={22} className={activeTab === tab.id ? 'stroke-[2.5px]' : ''} />
               <span className="text-[10px] font-bold">{tab.label}</span>
            </button>
         ))}
      </div>
      {benefitForm.show && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
             <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
               {benefitForm.type === 'product_limit' ? '🛍️ ขอเบิกวงเงินผลิตภัณฑ์' : '👕 ขอเบิกค่าชุดยูนิฟอร์ม'}
             </h3>
             <form onSubmit={handleSaveBenefitRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">จำนวนเงินที่ต้องการเบิก (บาท)</label>
                  <input type="number" required max={
                      benefitForm.type === 'product_limit' 
                        ? Math.max(0, (employee.vipProductLimit !== undefined ? Number(employee.vipProductLimit) : 2000) - (Number(employee.usedVipProductLimit) || 0))
                        : Math.max(0, (employee.vipUniformAllowance !== undefined ? Number(employee.vipUniformAllowance) : 1500) - (Number(employee.usedVipUniformAllowance) || 0))
                    }
                    value={benefitForm.amount} onChange={e => setBenefitForm({...benefitForm, amount: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-indigo-500 outline-none text-slate-700" placeholder="ระบุจำนวนเงิน (ไม่เกินยอดคงเหลือ)" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">รายละเอียด / รายการ</label>
                  <textarea required value={benefitForm.note} onChange={e => setBenefitForm({...benefitForm, note: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:border-indigo-500 outline-none text-slate-700 text-sm h-24" placeholder="ระบุรายการสินค้าที่ขอใช้สิทธิ์..."></textarea>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setBenefitForm({ show: false, type: '', amount: '', note: '' })} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">ยกเลิก</button>
                  <button type="submit" disabled={isSubmittingBenefit} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-colors disabled:opacity-50">ส่งคำขอ</button>
                </div>
             </form>
          </div>
        </div>
      )}
      
      {showContract && (
        <EmploymentContractModal employee={employee} onClose={() => setShowContract(false)} />
      )}
    </div>
  );
}