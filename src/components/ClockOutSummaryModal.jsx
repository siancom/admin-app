import React, { useMemo, useState } from 'react';
import { 
  Clock, Calendar, User, ShoppingBag, DollarSign, Sparkles, 
  CheckCircle2, AlertCircle, ChevronRight, X, UserMinus, 
  ShieldAlert, HeartHandshake, Coffee, ArrowRight, ShoppingCart, 
  MapPin, Phone, Award, Check
} from 'lucide-react';
import { parseNumber, getLocalYYYYMMDD, normalizeBranchName, parseThaiDate } from '../utils/parse';
import { getSafeDateTime, getBookingStatus, getOrderStatus } from '../utils/dateUtils';
import { isHistoryValidForCommission, calculateServiceLogFee } from '../utils/payrollUtils';
import { getFuzzyKey } from '../utils/fuzzy';

function isRecordToday(item, todayStr) {
  if (!item || !todayStr) return false;
  if (item.date && String(item.date).trim() === todayStr) return true;
  if (item['วันที่']) {
    const raw = String(item['วันที่']).trim();
    if (raw === todayStr) return true;
    const parsed = parseThaiDate(raw);
    if (parsed && getLocalYYYYMMDD(parsed) === todayStr) return true;
  }
  if (item.createdAt) {
    try {
      const localIso = getLocalYYYYMMDD(new Date(item.createdAt));
      if (localIso === todayStr) return true;
    } catch (_) {}
  }
  return false;
}

export default function ClockOutSummaryModal({
  isOpen,
  onClose,
  onConfirmClockOut,
  employee,
  attendanceRecord,
  orders = [],
  serviceLogs = [],
  histories = [],
  bookings = [],
  dailySales = [],
  onGoToPOS
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'breakdown' | 'bookings'

  if (!isOpen || !employee) return null;

  const todayStr = getLocalYYYYMMDD();
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const tomorrowStr = getLocalYYYYMMDD(tomorrow);

  const todayThaiDate = now.toLocaleDateString('th-TH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const tomorrowThaiDate = tomorrow.toLocaleDateString('th-TH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Calculate work duration today
  const clockInTime = attendanceRecord?.clockIn 
    ? new Date(attendanceRecord.clockIn).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) 
    : '-';
  const currentTime = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  const durationStr = useMemo(() => {
    if (!attendanceRecord?.clockIn) return '-';
    try {
      const diffMs = Math.max(0, now.getTime() - new Date(attendanceRecord.clockIn).getTime());
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours} ชม. ${mins} นาที`;
    } catch (_) {
      return '-';
    }
  }, [attendanceRecord?.clockIn, now]);

  // Check EOD submission
  const branchToCheck = attendanceRecord?.branch || employee.branch || 'เฉวง';
  const cleanBranch = normalizeBranchName(branchToCheck);
  const requiresEOD = cleanBranch !== 'เฉวง';
  const todayThaiStr = now.toLocaleDateString('th-TH');
  const hasSubmittedEOD = dailySales?.some(d =>
    normalizeBranchName(d.branch) === cleanBranch &&
    (d.date === todayStr || d.date === todayThaiStr || getLocalYYYYMMDD(parseThaiDate(d.date)) === todayStr)
  );

  // 1. Calculate Today's Sales & Orders
  const todayOrders = useMemo(() => {
    return (orders || []).filter(o => {
      if (!o.createdAt || getOrderStatus(o) === 'ยกเลิก') return false;
      const isPO = o.transactionType === 'owner_purchase' || (o.courseName || '').includes('[ซื้อเข้า');
      const isReq = o.transactionType === 'branch_requisition' || (o.courseName || '').includes('[เบิกจาก');
      if (isPO || isReq) return false;

      const oDate = getLocalYYYYMMDD(new Date(o.createdAt));
      if (oDate !== todayStr && o.date !== todayStr) return false;

      const staffStr = String(o.paymentStaff || o.staffName || o.seller || o.employeeName || o.cashier || '');
      const staffList = staffStr.split(/[,/]|และ|กับ/).map(s => s.trim()).filter(Boolean);
      return staffList.includes(employee.name) || o.sellerId === employee.id || o.employeeId === employee.id;
    });
  }, [orders, todayStr, employee]);

  const todaySalesTotal = useMemo(() => {
    return todayOrders.reduce((sum, o) => {
      let p = parseNumber(o.price);
      if (o.orderChannel === 'shopee' && o.shopeeNetReceived !== undefined) {
        p = parseNumber(o.shopeeNetReceived);
      }
      const staffStr = String(o.paymentStaff || o.staffName || o.seller || o.employeeName || o.cashier || '');
      const staffList = staffStr.split(/[,/]|และ|กับ/).map(s => s.trim()).filter(Boolean);
      const shareCount = staffList.length > 0 && staffList.includes(employee.name) ? staffList.length : 1;
      return sum + (p / shareCount);
    }, 0);
  }, [todayOrders, employee.name]);

  // 2. Calculate Today's Commission
  const todayCommission = useMemo(() => {
    let comm = 0;
    (histories || []).forEach(h => {
      if (!isRecordToday(h, todayStr)) return;
      if (!isHistoryValidForCommission(h)) return;

      const sName = String(
        getFuzzyKey(h, ['ชื่อเจ้าหน้าที่', 'ชื่อพนักงาน', 'staffName', 'ผู้ให้บริการ', 'เจ้าหน้าที่', 'พนักงาน', 'paymentStaff']) || ''
      );
      if (!sName) return;

      const staffNames = sName.split(/[,/]|และ|กับ/).map(s => s.trim()).filter(Boolean);
      if (staffNames.includes(employee.name)) {
        const price = parseNumber(getFuzzyKey(h, ['ราคา', 'price', 'จำนวนเงิน', 'ยอดเงิน']) || 0);
        const typeStr = String(getFuzzyKey(h, ['ประเภท', 'col_4']) || '');
        const itemStr = String(getFuzzyKey(h, ['สินค้า', 'รายการ', 'col_18']) || '');
        const shareCount = staffNames.length || 1;
        if (typeStr.includes('ซื้อสินค้า')) {
          comm += (price * ((parseFloat(employee.productCommissionRate) || 0) / 100)) / shareCount;
        } else if (typeStr.includes('บริการ') || typeStr.includes('จี้') || itemStr.includes('จี้') || h.isService || h.noCourseCommission || h.type === 'service') {
          // 🌟 รายการจี้ / หัตถการรายครั้ง: คิดเป็นค่ามือ (DF) ตามบิล ไม่คำนวณเป็นค่าคอมคอร์ส
        } else {
          comm += (price * ((parseFloat(employee.commissionRate) || 0) / 100)) / shareCount;
        }
      }
    });
    return Math.ceil(comm);
  }, [histories, todayStr, employee]);

  // 3. Calculate Today's Service Logs (ค่ามือ / DF)
  const todayServiceLogs = useMemo(() => {
    return (serviceLogs || []).filter(s => {
      const isEmp = s.employeeId === employee.id || s.employeeName === employee.name;
      if (!isEmp) return false;
      const dStr = s.date || (s.createdAt ? getLocalYYYYMMDD(new Date(s.createdAt)) : '');
      return dStr === todayStr;
    });
  }, [serviceLogs, employee, todayStr]);

  const todayServiceFees = useMemo(() => {
    let total = 0;
    todayServiceLogs.forEach(s => {
      total += calculateServiceLogFee(s);
    });
    return Math.ceil(total);
  }, [todayServiceLogs]);

  // 4. Food allowance & estimated total income today
  const foodAllowance = Number(employee.foodAllowanceRate !== undefined ? employee.foodAllowanceRate : 50);
  const totalEstIncomeToday = todayCommission + todayServiceFees + foodAllowance;

  // 5. Tomorrow's Bookings
  const tomorrowBookings = useMemo(() => {
    const list = (bookings || []).filter(b => {
      const st = getBookingStatus(b);
      if (st === 'ยกเลิก') return false;
      const dt = getSafeDateTime(b);
      if (!dt || !dt.startsWith(tomorrowStr)) return false;

      // Filter by staff or branch
      const staffField = String(b.therapist || b.staff || b.staffName || b.employeeName || b.employeeId || '');
      const matchesEmp = staffField && (
        staffField === employee.name ||
        staffField === employee.id ||
        staffField.includes(employee.name)
      );

      const bookingBranchNorm = normalizeBranchName(b.branch);
      const matchesBranch = !b.branch || !cleanBranch || bookingBranchNorm === cleanBranch;

      return matchesEmp || matchesBranch;
    });

    // Sort by time
    return list.sort((a, b) => {
      const dtA = getSafeDateTime(a) || '';
      const dtB = getSafeDateTime(b) || '';
      return dtA.localeCompare(dtB);
    });
  }, [bookings, tomorrowStr, employee, cleanBranch]);

  const handleConfirm = async () => {
    if (requiresEOD && !hasSubmittedEOD) {
      alert(`ไม่สามารถลงเวลาออกงานได้ กรุณาส่งยอดประจำวัน (EOD) ของสาขา ${branchToCheck} ก่อนครับ`);
      return;
    }
    setIsSubmitting(true);
    try {
      if (onConfirmClockOut) {
        await onConfirmClockOut();
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการบันทึกออกงาน: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[2000000] flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-[28px] sm:rounded-[32px] w-full max-w-xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden border border-slate-100 my-auto animate-in zoom-in-95 duration-200">
        
        {/* Header with Hero Gradient */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white p-5 sm:p-6 shrink-0 overflow-hidden">
          {/* Decorative background glow */}
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute right-12 -bottom-10 w-24 h-24 bg-purple-400/20 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner overflow-hidden">
                {employee.profileImage ? (
                  <img src={employee.profileImage} alt={employee.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={26} />
                )}
              </div>
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] sm:text-[11px] font-black text-indigo-100 uppercase tracking-wider mb-1">
                  ✨ สรุปผลการทำงานก่อนเลิกงาน
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white truncate leading-tight">
                  {employee.name}
                </h2>
                <p className="text-xs text-indigo-100/90 font-medium flex items-center gap-2 mt-0.5">
                  <span>สาขา {branchToCheck}</span>
                  <span>•</span>
                  <span>{todayThaiDate}</span>
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              disabled={isSubmitting}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors active:scale-90 shrink-0 ml-2"
              title="ปิดหน้าต่าง"
            >
              <X size={20} />
            </button>
          </div>

          {/* Shift time summary badge */}
          <div className="mt-4 pt-3.5 border-t border-white/15 flex items-center justify-between text-xs sm:text-sm font-bold text-indigo-100">
            <div className="flex items-center gap-1.5">
              <Clock size={15} className="text-emerald-300" />
              <span>เข้างาน: <strong className="text-white">{clockInTime} น.</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>เวลาปัจจุบัน: <strong className="text-white">{currentTime} น.</strong></span>
            </div>
            <div className="bg-white/15 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] text-white font-black">
              ทำงาน {durationStr}
            </div>
          </div>
        </div>

        {/* EOD Warning if required and pending */}
        {requiresEOD && !hasSubmittedEOD && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-amber-800 shrink-0">
            <div className="flex items-center gap-2 font-bold">
              <ShieldAlert size={18} className="text-amber-600 shrink-0" />
              <span>สาขายังไม่ได้ส่งยอดประจำวัน (EOD) — ต้องส่งยอดก่อนลงชื่อออก</span>
            </div>
            {onGoToPOS && (
              <button 
                onClick={onGoToPOS}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] shrink-0 transition-colors shadow-xs"
              >
                เปิด POS ส่ง EOD
              </button>
            )}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 shrink-0">
          <button 
            onClick={() => setActiveTab('summary')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-black border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'summary' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <DollarSign size={16} /> สรุปยอดวันนี้
          </button>
          <button 
            onClick={() => setActiveTab('bookings')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-black border-b-2 transition-all flex items-center gap-1.5 relative ${
              activeTab === 'bookings' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar size={16} /> คิวจองพรุ่งนี้
            {tomorrowBookings.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center ml-0.5">
                {tomorrowBookings.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('breakdown')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-black border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'breakdown' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles size={16} /> รายการบริการ & บิล
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* TAB 1: SUMMARY */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              
              {/* 4 Performance Cards Grid */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                
                {/* 1. ยอดขายวันนี้ */}
                <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-50 to-teal-50/50 p-4 rounded-2xl border border-emerald-200/80 relative overflow-hidden group">
                  <div className="flex items-center justify-between text-emerald-800 mb-1">
                    <span className="text-xs font-black">ยอดขายวันนี้</span>
                    <ShoppingBag size={18} className="text-emerald-600 opacity-80" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
                    ฿{todaySalesTotal.toLocaleString()}
                  </div>
                  <div className="text-[11px] font-bold text-emerald-600/80 mt-1">
                    {todayOrders.length} คำสั่งซื้อที่ขายได้
                  </div>
                </div>

                {/* 2. ค่าคอมมิชชั่นสะสมวันนี้ */}
                <div className="bg-gradient-to-br from-indigo-500/10 via-indigo-50 to-blue-50/50 p-4 rounded-2xl border border-indigo-200/80 relative overflow-hidden group">
                  <div className="flex items-center justify-between text-indigo-800 mb-1">
                    <span className="text-xs font-black">ค่าคอมมิชชั่น</span>
                    <Award size={18} className="text-indigo-600 opacity-80" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-indigo-700 tracking-tight">
                    ฿{todayCommission.toLocaleString()}
                  </div>
                  <div className="text-[11px] font-bold text-indigo-600/80 mt-1 truncate">
                    คอมคอร์ส {employee.commissionRate || 0}% / สินค้า {employee.productCommissionRate || 0}%
                  </div>
                </div>

                {/* 3. ค่ามือบริการ / ทรีตเมนต์ (DF) */}
                <div className="bg-gradient-to-br from-purple-500/10 via-purple-50 to-pink-50/50 p-4 rounded-2xl border border-purple-200/80 relative overflow-hidden group">
                  <div className="flex items-center justify-between text-purple-800 mb-1">
                    <span className="text-xs font-black">ค่ามือบริการ (DF)</span>
                    <Sparkles size={18} className="text-purple-600 opacity-80" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-purple-700 tracking-tight">
                    ฿{todayServiceFees.toLocaleString()}
                  </div>
                  <div className="text-[11px] font-bold text-purple-600/80 mt-1">
                    {todayServiceLogs.length} เคสบริการที่ทำวันนี้
                  </div>
                </div>

                {/* 4. รวมรายได้สะสมวันนี้ */}
                <div className="bg-gradient-to-br from-amber-500/10 via-amber-50 to-orange-50/50 p-4 rounded-2xl border border-amber-200/80 relative overflow-hidden group">
                  <div className="flex items-center justify-between text-amber-800 mb-1">
                    <span className="text-xs font-black">รวมรายได้วันนี้</span>
                    <Coffee size={18} className="text-amber-600 opacity-80" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-700 tracking-tight">
                    ฿{totalEstIncomeToday.toLocaleString()}
                  </div>
                  <div className="text-[11px] font-bold text-amber-700/80 mt-1">
                    (รวมค่าอาหาร ฿{foodAllowance})
                  </div>
                </div>

              </div>

              {/* Tomorrow's Queue Highlights in Summary Tab */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-indigo-600" />
                    <h3 className="text-xs sm:text-sm font-black text-slate-800">
                      คิวจองวันพรุ่งนี้ ({tomorrowThaiDate})
                    </h3>
                  </div>
                  <button 
                    onClick={() => setActiveTab('bookings')}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
                  >
                    ดูทั้งหมด ({tomorrowBookings.length}) <ChevronRight size={14} />
                  </button>
                </div>

                {tomorrowBookings.length > 0 ? (
                  <div className="space-y-2">
                    {tomorrowBookings.slice(0, 3).map((b, idx) => {
                      const dt = getSafeDateTime(b);
                      const timeStr = dt ? dt.split('T')[1]?.substring(0, 5) : '-';
                      const st = getBookingStatus(b);
                      return (
                        <div key={b.id || idx} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-xs">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-black text-xs shrink-0">
                              ⏰ {timeStr} น.
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-black text-slate-800 truncate">
                                {b.customerName || b.customerPhone || 'ลูกค้า'}
                              </p>
                              <p className="text-[11px] text-slate-500 font-medium truncate">
                                {b.courseName || b.serviceName || 'ทรีตเมนต์'}
                              </p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 border ${
                            st === 'ยืนยันแล้ว' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            st === 'รอการยืนยัน' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {st}
                          </span>
                        </div>
                      );
                    })}
                    {tomorrowBookings.length > 3 && (
                      <p className="text-center text-[11px] font-bold text-slate-500 pt-1">
                        + และอีก {tomorrowBookings.length - 3} คิวจอง
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                    <p className="text-xs font-bold text-slate-600">
                      🎉 วันพรุ่งนี้ยังไม่มีคิวจองในระบบ พักผ่อนให้เต็มที่นะคะ/ครับ
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: TOMORROW'S BOOKINGS DETAIL */}
          {activeTab === 'bookings' && (
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-blue-900 flex items-center gap-2">
                    <Calendar size={18} className="text-blue-600" />
                    คิวนัดหมายวันพรุ่งนี้
                  </h3>
                  <p className="text-xs text-blue-700 font-medium mt-0.5">
                    {tomorrowThaiDate} • สาขา {branchToCheck}
                  </p>
                </div>
                <div className="bg-blue-600 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-xs">
                  {tomorrowBookings.length} คิว
                </div>
              </div>

              {tomorrowBookings.length > 0 ? (
                <div className="space-y-2.5">
                  {tomorrowBookings.map((b, idx) => {
                    const dt = getSafeDateTime(b);
                    const timeStr = dt ? dt.split('T')[1]?.substring(0, 5) : '-';
                    const st = getBookingStatus(b);
                    const staffField = String(b.therapist || b.staff || b.staffName || b.employeeName || b.employeeId || '');
                    const isMyDirectQueue = staffField && (
                      staffField === employee.name ||
                      staffField === employee.id ||
                      staffField.includes(employee.name)
                    );

                    return (
                      <div 
                        key={b.id || idx} 
                        className={`p-3.5 rounded-2xl border bg-white shadow-xs transition-all ${
                          isMyDirectQueue ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-xl bg-indigo-600 text-white font-black text-xs shadow-xs">
                              ⏰ {timeStr} น.
                            </span>
                            {isMyDirectQueue && (
                              <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 font-black text-[10px] border border-purple-200">
                                ⭐ คิวของคุณ
                              </span>
                            )}
                          </div>
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                            st === 'ยืนยันแล้ว' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            st === 'รอการยืนยัน' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {st}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                            <User size={14} className="text-slate-400" />
                            <span>{b.customerName || 'ลูกค้าทั่วไป'}</span>
                            {b.customerPhone && (
                              <span className="text-xs text-slate-500 font-normal">({b.customerPhone})</span>
                            )}
                          </p>

                          <p className="text-xs text-indigo-700 font-bold flex items-center gap-1.5 pl-5">
                            <Sparkles size={13} className="text-indigo-500" />
                            <span>{b.courseName || b.serviceName || 'ทรีตเมนต์ / รับบริการ'}</span>
                          </p>

                          {b.branch && (
                            <p className="text-[11px] text-slate-400 font-medium pl-5 flex items-center gap-1">
                              <MapPin size={11} /> {b.branch}
                            </p>
                          )}

                          {b.note && (
                            <p className="text-[11px] text-amber-700 bg-amber-50/70 p-2 rounded-lg mt-1 border border-amber-200/50">
                              💬 หมายเหตุ: {b.note}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center space-y-2">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 mx-auto shadow-xs border border-slate-200">
                    <Calendar size={24} />
                  </div>
                  <h4 className="text-sm font-black text-slate-700">ไม่มีคิวจองในวันพรุ่งนี้</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    ไม่มีลูกค้านัดหมายไว้ล่วงหน้าสำหรับวันพรุ่งนี้ พักผ่อนให้เต็มที่นะคะ/ครับ
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BREAKDOWN (Services and Orders) */}
          {activeTab === 'breakdown' && (
            <div className="space-y-4">
              
              {/* รายการค่ามือที่ทำวันนี้ */}
              <div>
                <h4 className="text-xs sm:text-sm font-black text-slate-800 mb-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={16} className="text-purple-600" /> 
                    บันทึกค่ามือวันนี้ ({todayServiceLogs.length} รายการ)
                  </span>
                  <span className="text-purple-700 font-black">
                    รวม ฿{todayServiceFees.toLocaleString()}
                  </span>
                </h4>

                {todayServiceLogs.length > 0 ? (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {todayServiceLogs.map((s, idx) => {
                      const fee = calculateServiceLogFee(s);
                      return (
                        <div key={s.id || idx} className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs shadow-xs">
                          <div className="min-w-0 pr-2">
                            <p className="font-bold text-slate-800 truncate">{s.type || 'บริการ'}</p>
                            {s.note && <p className="text-[10px] text-slate-400 truncate">{s.note}</p>}
                          </div>
                          <span className="font-black text-purple-600 shrink-0 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100">
                            +฿{fee}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                    ไม่มีรายการค่ามือในวันนี้
                  </p>
                )}
              </div>

              {/* รายการคำสั่งซื้อที่ขายได้วันนี้ */}
              <div>
                <h4 className="text-xs sm:text-sm font-black text-slate-800 mb-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShoppingBag size={16} className="text-emerald-600" /> 
                    รายการบิลที่ขายได้วันนี้ ({todayOrders.length} บิล)
                  </span>
                  <span className="text-emerald-700 font-black">
                    รวม ฿{todaySalesTotal.toLocaleString()}
                  </span>
                </h4>

                {todayOrders.length > 0 ? (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {todayOrders.map((o, idx) => {
                      const p = parseNumber(o.price);
                      return (
                        <div key={o.id || idx} className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs shadow-xs">
                          <div className="min-w-0 pr-2">
                            <p className="font-bold text-slate-800 truncate">{o.courseName || 'สินค้า/คอร์ส'}</p>
                            <p className="text-[10px] text-slate-400">
                              ลูกค้า: {o.customerName || '-'} • บิล: {o.orderNo || '-'}
                            </p>
                          </div>
                          <span className="font-black text-emerald-600 shrink-0 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                            ฿{p.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                    ไม่มีรายการขายสินค้าหรือคอร์สในวันนี้
                  </p>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Modal Action Buttons Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-1/3 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs sm:text-sm transition-colors active:scale-95 flex items-center justify-center gap-1.5"
          >
            ยังไม่เลิกงาน / ย้อนกลับ
          </button>

          <button
            onClick={handleConfirm}
            disabled={isSubmitting || (requiresEOD && !hasSubmittedEOD)}
            className={`w-full sm:flex-1 py-3.5 px-6 rounded-2xl font-black text-sm sm:text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
              requiresEOD && !hasSubmittedEOD
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 hover:from-rose-600 hover:to-rose-800 text-white shadow-rose-900/20'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>กำลังบันทึกเวลาออกงาน...</span>
              </>
            ) : (
              <>
                <UserMinus size={20} />
                <span>ยืนยันลงชื่อออกงาน (Clock-out)</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

