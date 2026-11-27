import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar, ChevronLeft, ChevronRight, Sparkles, Droplet, Zap, 
  Target, Syringe, Pill, Activity, TrendingUp, Clock, Users, 
  MessageSquare, MessageCircle, CheckCircle2, Filter, X, ChevronDown, ChevronUp, 
  BarChart3, Sun, Sunset, Moon, Eye, EyeOff, Award, Flame,
  Package, UserPlus, UserCheck
} from 'lucide-react';
import { getSafeDateTime, getBookingStatus } from '../utils/dateUtils';
import { getLocalYYYYMMDD } from '../utils/parse';

// Match service category (ตรงตามปุ่มบริการในระบบจองเป๊ะๆ: ทำหน้า, กดสิว, IPLรักแร้, จี้ไฝ, ปรึกษา, ใช้คอส)
export const matchBookingServiceCategory = (bookingOrName, categoryId) => {
  const b = typeof bookingOrName === 'object' && bookingOrName !== null ? bookingOrName : { courseName: bookingOrName };
  const courseName = b?.courseName || b?.service || '';
  if (!courseName && !b?.isCourseUsage && b?.type !== 'usage') return categoryId === 'other';
  const nameLower = String(courseName).toLowerCase().trim();

  // 1. ทำหน้า (Facial / ทรีตเมนต์ / นวดหน้า / บำรุง)
  if (categoryId === 'facial') {
    return nameLower.includes('ทำหน้า') || 
           nameLower.includes('ทรีท') || 
           nameLower.includes('ทรีต') || 
           nameLower.includes('นวด') || 
           nameLower.includes('facial') || 
           nameLower.includes('บำรุง') || 
           nameLower.includes('ลงเครื่อง') ||
           nameLower.includes('หน้าใส') ||
           nameLower.includes('ผลัดเซลล์') ||
           nameLower.includes('มาร์คหน้า') ||
           nameLower.includes('มาส์กหน้า');
  }

  // 2. กดสิว (Acne / เคลียร์สิว / มาร์คสิว)
  if (categoryId === 'acne') {
    return nameLower.includes('กดสิว') || 
           nameLower.includes('เคลียร์สิว') || 
           nameLower.includes('สิว') || 
           nameLower.includes('acne') || 
           nameLower.includes('ผงพอก') ||
           nameLower.includes('มาร์คสิว');
  }

  // 3. IPLรักแร้ (IPL / เลเซอร์ / กำจัดขน)
  if (categoryId === 'ipl' || categoryId === 'laser') {
    return nameLower.includes('ipl') || 
           nameLower.includes('รักแร้') || 
           nameLower.includes('เลเซอร์') || 
           nameLower.includes('laser') || 
           nameLower.includes('กำจัดขน');
  }

  // 4. จี้ไฝ (ไฝ / ติ่งเนื้อ / ขี้แมลงวัน / กระเนื้อ)
  if (categoryId === 'mole') {
    return nameLower.includes('จี้ไฝ') || 
           nameLower.includes('ไฝ') || 
           nameLower.includes('ขี้แมลงวัน') || 
           nameLower.includes('ติ่งเนื้อ') ||
           nameLower.includes('กระเนื้อ') ||
           nameLower.includes('หูด');
  }

  // 5. ปรึกษา (Consultation / ตรวจผิว / ประเมิน)
  if (categoryId === 'consult') {
    return nameLower.includes('ปรึกษา') || 
           nameLower.includes('ตรวจสภาพผิว') || 
           nameLower.includes('ตรวจผิว') || 
           nameLower.includes('consult') || 
           nameLower.includes('ประเมิน') || 
           nameLower.includes('แนะนำ');
  }

  // 6. ใช้คอส (Course usage / ตัดคอร์สเดิม)
  if (categoryId === 'use_course') {
    return Boolean(b?.isCourseUsage) || 
           b?.type === 'usage' ||
           nameLower.includes('ใช้คอส') || 
           nameLower.includes('ใช้คอร์ส') || 
           nameLower.includes('ตัดคอส') || 
           nameLower.includes('ตัดคอร์ส') ||
           nameLower.includes('คอร์สเดิม') ||
           nameLower.includes('ใบคอส');
  }

  // 7. บริการอื่นๆ (Other: ฉีด, ดริปวิตามิน, หรืออื่นๆ)
  if (categoryId === 'other') {
    return !matchBookingServiceCategory(b, 'facial') &&
           !matchBookingServiceCategory(b, 'acne') &&
           !matchBookingServiceCategory(b, 'ipl') &&
           !matchBookingServiceCategory(b, 'mole') &&
           !matchBookingServiceCategory(b, 'consult') &&
           !matchBookingServiceCategory(b, 'use_course');
  }
  return false;
};

// 🌟 ฟังก์ชันตรวจสอบว่าการจองเป็น "ลูกค้าใหม่" หรือ "ลูกค้าเก่า"
export const isBookingNewCustomer = (b, customerPhoneSet) => {
  if (b?.isNewCustomer === true) return true;
  if (b?.isNewCustomer === false || b?.isExistingCustomer === true) return false;
  if (b?.customerType === 'new') return true;
  if (b?.customerType === 'existing') return false;

  const rawPhone = String(b?.customerPhone || b?.phone || '').replace(/\D/g, '');
  if (rawPhone && rawPhone.length >= 9) {
    if (customerPhoneSet) {
      return !customerPhoneSet.has(rawPhone);
    }
  }

  if (b?.isWalkIn) return true;
  return false;
};

// Check if booking is from LINE
export const checkIsLineBooking = (b) => {
  if (!b) return false;
  return Boolean(
    b.lineUid || 
    b.source === 'line' || 
    b.channel === 'line' || 
    b.source === 'liff' || 
    b.source === 'LIFF' || 
    (b.source !== 'admin' && b.source !== 'POS' && !b.isAdminCreated && !b.isWalkIn && !b.createdByAdmin)
  );
};

const THAI_DAYS_SHORT = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const THAI_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

// 🌟 หมวดหมู่บริการตรงตามหน้าการจอง (รูปที่ 2: ทำหน้า, กดสิว, IPLรักแร้, จี้ไฝ, ปรึกษา, ใช้คอส + บริการอื่นๆ)
export const SERVICE_CATEGORIES = [
  { id: 'facial', label: 'ทำหน้า', icon: Sparkles, color: 'text-amber-400', barColor: 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]', glow: 'text-amber-400' },
  { id: 'acne', label: 'กดสิว', icon: Droplet, color: 'text-cyan-400', barColor: 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]', glow: 'text-cyan-400' },
  { id: 'ipl', label: 'IPLรักแร้', icon: Zap, color: 'text-purple-400', barColor: 'bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.5)]', glow: 'text-purple-400' },
  { id: 'mole', label: 'จี้ไฝ', icon: Target, color: 'text-rose-400', barColor: 'bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.5)]', glow: 'text-rose-400' },
  { id: 'consult', label: 'ปรึกษา', icon: MessageCircle, color: 'text-blue-400', barColor: 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]', glow: 'text-blue-400' },
  { id: 'use_course', label: 'ใช้คอส', icon: Package, color: 'text-emerald-400', barColor: 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]', glow: 'text-emerald-400' },
  { id: 'other', label: 'บริการอื่นๆ', icon: Activity, color: 'text-slate-400', barColor: 'bg-slate-400 shadow-[0_0_10px_rgba(148,163,184,0.5)]', glow: 'text-slate-400' }
];

export default function MonthlyBookingOverviewBanner({
  bookings = [],
  customers = [],
  customerPhoneSet = null,
  selectedMonth = '', // YYYY-MM
  onMonthChange = () => {},
  activeBannerFilter = null,
  onApplyBannerFilter = () => {},
  onClearBannerFilter = () => {},
  selectedBranch = 'all',
  onBranchChange = () => {}
}) {
  // 👁️ รูปดวงตาเปิด-ปิด ซ่อนไว้ก่อนตามคำสั่ง (default = false)
  const [isOpen, setIsOpen] = useState(() => {
    try {
      return localStorage.getItem('iris_booking_overview_open') === 'true';
    } catch (e) {
      return false;
    }
  });

  const [hoveredDayNum, setHoveredDayNum] = useState(null);

  const toggleOpenState = (nextState) => {
    setIsOpen(nextState);
    try {
      localStorage.setItem('iris_booking_overview_open', String(nextState));
    } catch (e) {}
  };

  // Month navigation calculation
  const currentMonthDate = useMemo(() => {
    if (selectedMonth && selectedMonth.includes('-')) {
      const [y, m] = selectedMonth.split('-');
      return new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    }
    return new Date();
  }, [selectedMonth]);

  const monthLabelThai = useMemo(() => {
    return currentMonthDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
  }, [currentMonthDate]);

  const monthShortThai = useMemo(() => {
    return THAI_MONTHS_SHORT[currentMonthDate.getMonth()] || '';
  }, [currentMonthDate]);

  const thisMonthIso = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const isCurrentMonth = selectedMonth === thisMonthIso;

  const handlePrevMonth = () => {
    const prev = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1);
    const mStr = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
    onMonthChange(mStr);
  };

  const handleNextMonth = () => {
    const next = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1);
    const mStr = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
    onMonthChange(mStr);
  };

  const handleResetToCurrentMonth = () => {
    onMonthChange(thisMonthIso);
  };

  // Set of clean customer phones for fast O(1) new vs returning customer lookup
  const effectivePhoneSet = useMemo(() => {
    if (customerPhoneSet && customerPhoneSet.size > 0) return customerPhoneSet;
    const set = new Set();
    if (Array.isArray(customers)) {
      customers.forEach(c => {
        const p = String(c?.phone || c?.tel || '').replace(/\D/g, '');
        if (p && p.length >= 9) set.add(p);
      });
    }
    return set;
  }, [customerPhoneSet, customers]);

  // Filter bookings for this month & branch
  const monthlyBookings = useMemo(() => {
    const targetMonth = selectedMonth || thisMonthIso;
    return bookings.filter(b => {
      const dt = getSafeDateTime(b);
      const isMonthMatch = dt ? dt.startsWith(targetMonth) : (b.date && String(b.date).startsWith(targetMonth));
      if (!isMonthMatch) return false;

      if (selectedBranch && selectedBranch !== 'all') {
        const bBranchClean = String(b.branch || 'เฉวง').replace(/^สาขา/, '').trim();
        const fBranchClean = String(selectedBranch).replace(/^สาขา/, '').trim();
        if (bBranchClean !== fBranchClean) return false;
      }
      return true;
    });
  }, [bookings, selectedMonth, thisMonthIso, selectedBranch]);

  // Statistics calculation
  const stats = useMemo(() => {
    let total = monthlyBookings.length;
    let totalGuests = 0;
    let lineCount = 0;
    let walkInCount = 0;
    let adminCount = 0;
    let newCustCount = 0;
    let oldCustCount = 0;

    let inProgressCount = 0;
    let completedCount = 0;
    let pendingCount = 0;
    let cancelledCount = 0;

    let morningCount = 0;   // 10:00 - 12:59
    let afternoonCount = 0; // 13:00 - 16:59
    let eveningCount = 0;   // 17:00+

    // 🌟 6 หมวดหมู่บริการตามระบบ + บริการอื่นๆ (ตรงตามรูปที่ 2 เป๊ะๆ)
    const serviceCounts = {
      facial: 0,
      acne: 0,
      ipl: 0,
      mole: 0,
      consult: 0,
      use_course: 0,
      other: 0
    };

    const daysInMonth = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 0).getDate();
    const dailyMap = {};
    for (let d = 1; d <= daysInMonth; d++) {
      dailyMap[d] = {
        total: 0,
        line: 0,
        walkin: 0,
        completed: 0,
        newCust: 0,
        oldCust: 0,
        dayOfWeek: new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), d).getDay()
      };
    }

    const categoryKeys = ['facial', 'acne', 'ipl', 'mole', 'consult', 'use_course'];

    monthlyBookings.forEach(b => {
      const guests = Number(b.guestsCount || b.pax || 1);
      totalGuests += guests;

      const isLine = checkIsLineBooking(b);
      if (isLine) {
        lineCount++;
      } else if (b.isWalkIn) {
        walkInCount++;
      } else {
        adminCount++;
      }

      // ตรวจสอบลูกค้าใหม่ / ลูกค้าเก่า
      const isNew = isBookingNewCustomer(b, effectivePhoneSet);
      if (isNew) {
        newCustCount++;
      } else {
        oldCustCount++;
      }

      const st = getBookingStatus(b);
      if (st === 'กำลังใช้บริการ') inProgressCount++;
      else if (st === 'เสร็จสิ้น') completedCount++;
      else if (st === 'รอการยืนยัน' || st === 'ยืนยันแล้ว') pendingCount++;
      else if (st === 'ยกเลิก' || st === 'ยกเลิกฉุกเฉิน') cancelledCount++;

      const dt = getSafeDateTime(b);
      if (dt && dt.includes('T')) {
        const timePart = dt.split('T')[1];
        const hour = parseInt(timePart.split(':')[0], 10);
        if (hour < 13) morningCount++;
        else if (hour < 17) afternoonCount++;
        else eveningCount++;

        const dayNum = parseInt(dt.split('T')[0].split('-')[2], 10);
        if (dailyMap[dayNum]) {
          dailyMap[dayNum].total++;
          if (isLine) dailyMap[dayNum].line++;
          else dailyMap[dayNum].walkin++;
          if (st === 'เสร็จสิ้น') dailyMap[dayNum].completed++;
          if (isNew) dailyMap[dayNum].newCust++;
          else dailyMap[dayNum].oldCust++;
        }
      }

      // นับหมวดหมู่บริการ (ตรงตามรูป 2: ทำหน้า, กดสิว, IPLรักแร้, จี้ไฝ, ปรึกษา, ใช้คอส)
      let matchedAny = false;
      for (const catId of categoryKeys) {
        if (matchBookingServiceCategory(b, catId)) {
          serviceCounts[catId]++;
          matchedAny = true;
          break;
        }
      }
      if (!matchedAny) {
        serviceCounts.other++;
      }
    });

    // Find peak day
    let peakDayNum = 1;
    let peakDayCount = 0;
    Object.entries(dailyMap).forEach(([d, val]) => {
      if (val.total > peakDayCount) {
        peakDayCount = val.total;
        peakDayNum = parseInt(d, 10);
      }
    });

    // Find top service category
    let topCatId = 'facial';
    let topCatCount = 0;
    Object.entries(serviceCounts).forEach(([cId, cnt]) => {
      if (cnt > topCatCount) {
        topCatCount = cnt;
        topCatId = cId;
      }
    });
    const topCatObj = SERVICE_CATEGORIES.find(c => c.id === topCatId) || SERVICE_CATEGORIES[0];

    // Compute average bookings per day
    const todayNum = new Date().getDate();
    const effectiveDays = isCurrentMonth ? Math.max(1, todayNum) : daysInMonth;
    const avgPerDay = (total / effectiveDays).toFixed(1);

    const newCustPct = total > 0 ? Math.round((newCustCount / total) * 100) : 0;
    const oldCustPct = total > 0 ? (100 - newCustPct) : 0;

    return {
      total,
      totalGuests,
      lineCount,
      walkInCount,
      adminCount,
      newCustCount,
      oldCustCount,
      newCustPct,
      oldCustPct,
      inProgressCount,
      completedCount,
      pendingCount,
      cancelledCount,
      morningCount,
      afternoonCount,
      eveningCount,
      serviceCounts,
      dailyMap,
      daysInMonth,
      peakDayNum,
      peakDayCount,
      topCatObj,
      topCatCount,
      avgPerDay
    };
  }, [monthlyBookings, currentMonthDate, isCurrentMonth, effectivePhoneSet]);

  const toggleFilter = (type, value, label) => {
    if (activeBannerFilter?.type === type && activeBannerFilter?.value === value) {
      onClearBannerFilter();
    } else {
      onApplyBannerFilter({ type, value, label });
    }
  };

  const todayDateNum = new Date().getDate();
  const activeHoverOrToday = hoveredDayNum || (isCurrentMonth ? todayDateNum : stats.peakDayNum || 1);
  const selectedDayInfo = stats.dailyMap[activeHoverOrToday] || { total: 0, line: 0, walkin: 0, completed: 0, dayOfWeek: 0 };
  const selectedDayDow = THAI_DAYS_SHORT[selectedDayInfo.dayOfWeek] || '';

  // -------------------------------------------------------------
  // 👁️ 1. กรณี "ซ่อนไว้ก่อน" (Collapsed View with Eye Icon)
  // -------------------------------------------------------------
  if (!isOpen) {
    return (
      <div className="bg-gradient-to-r from-[#0c101d] via-[#111827] to-[#0a0d18] border border-slate-800 rounded-3xl p-3 sm:p-3.5 shadow-xl shadow-black/30 flex items-center justify-between gap-3 text-white transition-all hover:border-slate-700 animate-in fade-in duration-200">
        
        {/* Left: Eye Button + Summary */}
        <div 
          onClick={() => toggleOpenState(true)}
          className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0"
        >
          <button 
            type="button" 
            onClick={(e) => { e.stopPropagation(); toggleOpenState(true); }}
            className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-700/80 text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-500/50 flex items-center justify-center transition-all cursor-pointer shadow-inner shrink-0"
            title="แตะเพื่อเปิดดูสถิติการจองประจำเดือน"
          >
            <EyeOff size={18} className="text-amber-400 group-hover:hidden" />
            <Eye size={18} className="text-cyan-400 hidden group-hover:block" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                สรุปรายการจองประจำเดือน ({monthLabelThai})
              </span>
              <span className="text-[10px] font-black bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                ซ่อนอยู่ • แตะเพื่อเปิดดู
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
              ยอดจอง <span className="text-white font-bold">{stats.total} คิว</span> • 🌱 ใหม่ <span className="text-emerald-400 font-bold">{stats.newCustCount}</span> | 💎 เก่า <span className="text-cyan-400 font-bold">{stats.oldCustCount}</span> • LINE <span className="text-emerald-400 font-bold">{stats.lineCount} คิว</span> ({stats.total > 0 ? Math.round((stats.lineCount / stats.total) * 100) : 0}%) • คอร์สยอดฮิต: <span className="text-amber-300 font-bold">{stats.topCatObj?.label?.split('/')[0]} ({stats.topCatCount} คิว)</span>
            </p>
          </div>
        </div>

        {/* Right: Open Button */}
        <button
          type="button"
          onClick={() => toggleOpenState(true)}
          className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-indigo-950/60 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Eye size={15} />
          <span className="hidden sm:inline">เปิดดูสถิติ</span>
          <span className="sm:hidden">เปิด</span>
        </button>

      </div>
    );
  }

  // -------------------------------------------------------------
  // 🚀 2. กรณี "เปิดดู" (Full Expanded Cyber Dark Theme เหมือนรูปที่ 2)
  // -------------------------------------------------------------
  return (
    <div className="bg-gradient-to-br from-[#0c101d] via-[#111827] to-[#0a0d18] border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl shadow-indigo-950/40 relative overflow-hidden text-white transition-all duration-300 animate-in fade-in">
      
      {/* Top Cyber Glow Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-indigo-500 to-purple-500"></div>

      {/* 🌟 Header: Title, Real-time badge, Branch, Month Selector & Eye Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 pb-4 border-b border-slate-800">
        
        {/* Left Title & Subtitle */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 border border-indigo-400/30 text-white flex items-center justify-center shadow-lg shadow-indigo-950/50 shrink-0">
            <BarChart3 size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1.5">
                สรุปรายการจองประจำเดือน
              </h3>
              <span className="text-[10px] font-black bg-teal-500/10 text-teal-400 border border-teal-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                อัปเดตสด Real-time
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              ภาพรวมการจองและสัดส่วนบริการ ประจำสาขา {selectedBranch === 'all' ? 'ทุกสาขา' : selectedBranch} • สถิติย้อนหลังและเปรียบเทียบยอดจอง
            </p>
          </div>
        </div>

        {/* Right Controls: Branch Pills, Month Selector & Eye Hide Button */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Branch Pill Selector (ถ้ามีตัวเลือก) */}
          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-2xl p-1">
            <button
              type="button"
              onClick={() => onBranchChange('all')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedBranch === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ทุกสาขา
            </button>
            <button
              type="button"
              onClick={() => onBranchChange('เฉวง')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedBranch === 'เฉวง'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              เฉวง
            </button>
          </div>

          {/* Month Switcher */}
          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-2xl p-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="เดือนก่อนหน้า"
            >
              <ChevronLeft size={16} />
            </button>
            
            <div className="px-2.5 py-1 text-xs font-black text-white flex items-center gap-1.5 min-w-[120px] justify-center">
              <Calendar size={13} className="text-indigo-400" />
              <span>{monthLabelThai}</span>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="เดือนถัดไป"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {!isCurrentMonth && (
            <button
              type="button"
              onClick={handleResetToCurrentMonth}
              className="px-2.5 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              กลับเดือนปัจจุบัน
            </button>
          )}

          {/* 👁️ ปุ่มดวงตาปิดซ่อนไว้ (Eye Toggle) */}
          <button
            type="button"
            onClick={() => toggleOpenState(false)}
            className="px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ml-1"
            title="ซ่อนสถิติการจอง"
          >
            <EyeOff size={14} className="text-amber-400" />
            <span>ซ่อน</span>
          </button>

        </div>
      </div>

      {/* 🌟 Row 1: KPI Cards (Dark Glassmorphic Style เหมือนรูปที่ 2) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-4">
        
        {/* Card 1: ยอดจองเดือนนี้ */}
        <div
          onClick={() => toggleFilter('month', selectedMonth || thisMonthIso, `คิวทั้งหมดในเดือน ${monthLabelThai}`)}
          className={`bg-slate-900/80 border rounded-2xl p-4 transition-all cursor-pointer relative overflow-hidden group hover:border-slate-700 ${
            activeBannerFilter?.type === 'month'
              ? 'border-indigo-500 ring-2 ring-indigo-500/50 bg-gradient-to-br from-indigo-950/70 to-slate-900'
              : 'border-slate-800/90 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
              ยอดจองเดือนนี้
            </span>
            <span className="text-[10px] font-black bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded-full">
              {stats.total} คิว
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-white">{stats.total}</span>
            <span className="text-xs font-bold text-slate-400">คิว</span>
          </div>
          <div className="text-[11px] font-bold text-teal-400 mt-1 flex items-center justify-between">
            <span>↑ 👥 {stats.totalGuests} ท่าน (เฉลี่ย {stats.avgPerDay} /วัน)</span>
            <span className="text-[9px] text-slate-500 group-hover:text-slate-300">กรอง ↗</span>
          </div>
          {/* New vs Returning customer pills */}
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-bold">
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleFilter('customer_type', 'new', 'ลูกค้าใหม่ (New)'); }}
              className={`px-1.5 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1 ${
                activeBannerFilter?.type === 'customer_type' && activeBannerFilter?.value === 'new'
                  ? 'bg-emerald-500/30 text-emerald-300 ring-1 ring-emerald-400'
                  : 'text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              🌱 ใหม่ {stats.newCustCount} ({stats.newCustPct}%)
            </button>
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleFilter('customer_type', 'existing', 'ลูกค้าเก่า (Existing)'); }}
              className={`px-1.5 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1 ${
                activeBannerFilter?.type === 'customer_type' && activeBannerFilter?.value === 'existing'
                  ? 'bg-cyan-500/30 text-cyan-300 ring-1 ring-cyan-400'
                  : 'text-cyan-400 hover:bg-cyan-500/10'
              }`}
            >
              💎 เก่า {stats.oldCustCount} ({stats.oldCustPct}%)
            </button>
          </div>
        </div>

        {/* Card 2: ช่องทางจอง (LINE vs หน้าร้าน) */}
        <div
          onClick={() => toggleFilter('source', 'line', 'จองผ่าน LINE')}
          className={`bg-slate-900/80 border rounded-2xl p-4 transition-all cursor-pointer relative overflow-hidden group hover:border-slate-700 ${
            activeBannerFilter?.type === 'source' && activeBannerFilter?.value === 'line'
              ? 'border-emerald-500 ring-2 ring-emerald-500/50 bg-gradient-to-br from-emerald-950/70 to-slate-900'
              : 'border-slate-800/90 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400">ช่องทางจองเดือนนี้</span>
            <span className="text-[10px] font-bold text-slate-400">LINE / หน้าร้าน</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">{stats.lineCount}</span>
            <span className="text-xs font-bold text-slate-400">คิว LINE</span>
          </div>
          {/* Progress bar split */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex my-2">
            <div 
              className="bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" 
              style={{ width: `${stats.total > 0 ? (stats.lineCount / stats.total) * 100 : 50}%` }}
              title={`LINE ${stats.lineCount} คิว`}
            />
            <div 
              className="bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)] flex-1"
              title={`หน้าร้าน ${stats.walkInCount + stats.adminCount} คิว`}
            />
          </div>
          <div className="text-[10px] font-bold text-slate-400 flex items-center justify-between">
            <span className="text-emerald-400">• LINE {stats.total > 0 ? Math.round((stats.lineCount / stats.total) * 100) : 0}%</span>
            <span className="text-amber-400">• หน้าร้าน {stats.total > 0 ? Math.round(((stats.walkInCount + stats.adminCount) / stats.total) * 100) : 0}%</span>
          </div>
        </div>

        {/* Card 3: สถานะบริการ (MTD) */}
        <div
          onClick={() => toggleFilter('status', 'เสร็จสิ้น', 'คิวที่เสร็จสิ้นแล้ว')}
          className={`bg-slate-900/80 border rounded-2xl p-4 transition-all cursor-pointer relative overflow-hidden group hover:border-slate-700 ${
            activeBannerFilter?.type === 'status' && activeBannerFilter?.value === 'เสร็จสิ้น'
              ? 'border-teal-500 ring-2 ring-teal-500/50 bg-gradient-to-br from-teal-950/70 to-slate-900'
              : 'border-slate-800/90 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400">สถานะบริการ (MTD)</span>
            <span className="text-[10px] font-black bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">
              {monthShortThai}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-white">{stats.completedCount}</span>
            <span className="text-xs font-bold text-slate-400">เสร็จสิ้น</span>
          </div>
          <div className="text-[11px] font-bold mt-2 flex items-center justify-between">
            <span className="text-cyan-400">• กำลังทำ {stats.inProgressCount} คิว</span>
            <span className="text-slate-400">• รอคิว {stats.pendingCount} คิว</span>
          </div>
        </div>

        {/* Card 4: คอร์สยอดฮิต & วันพีกสุด (Peak) */}
        <div
          onClick={() => toggleFilter('service', stats.topCatObj?.id, stats.topCatObj?.label)}
          className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 transition-all cursor-pointer relative overflow-hidden group hover:border-amber-500/50 hover:bg-slate-900"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
              <Award size={13} className="text-amber-400" />
              ยอดจองสูงสุดในรอบเดือน
            </span>
            <span className="text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
              Peak
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 truncate">
            <span className="text-xl sm:text-2xl font-black text-amber-400 truncate">
              {stats.topCatObj?.label?.split('/')[0]}
            </span>
          </div>
          <div className="text-[11px] font-bold text-slate-400 mt-2 flex items-center justify-between">
            <span className="text-amber-300 font-bold">{stats.topCatCount} คิว ({stats.total > 0 ? Math.round((stats.topCatCount / stats.total) * 100) : 0}%)</span>
            <span className="text-slate-500 text-[10px]">วันพีกสุด: {stats.peakDayNum} {monthShortThai}</span>
          </div>
        </div>

      </div>

      {/* 🌟 Row 2: "สัดส่วนคอร์สและบริการที่ลูกค้าจอง" (Service Cards Grid) */}
      <div className="mt-5 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
              <Sparkles size={14} className="text-indigo-400" />
              <span>สัดส่วนคอร์สและบริการที่ลูกค้าจอง ({monthLabelThai})</span>
            </span>
            <span className="text-[10px] font-medium text-slate-400 hidden sm:inline">
              (แตะการ์ดบริการด้านล่างเพื่อกรองดูรายชื่อลูกค้าทันที)
            </span>
          </div>

          {activeBannerFilter?.type === 'service' && (
            <button
              type="button"
              onClick={onClearBannerFilter}
              className="text-[11px] font-black text-rose-400 hover:text-rose-300 flex items-center gap-1 bg-rose-500/10 px-2.5 py-1 rounded-xl border border-rose-500/30 cursor-pointer"
            >
              <X size={12} />
              <span>ล้างตัวกรอง</span>
            </button>
          )}
        </div>

        {/* 7 Service Cards in Cyber Dark Look */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
          {SERVICE_CATEGORIES.map(cat => {
            const count = stats.serviceCounts[cat.id] || 0;
            const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
            const isSelected = activeBannerFilter?.type === 'service' && activeBannerFilter?.value === cat.id;
            const IconComp = cat.icon;

            return (
              <div
                key={cat.id}
                onClick={() => toggleFilter('service', cat.id, cat.label)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected 
                    ? 'bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white border-indigo-400 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-900/40 scale-[1.02]' 
                    : 'bg-[#0e1424] border-slate-800/80 hover:border-slate-700 hover:bg-[#12192e] text-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-1.5 rounded-xl bg-slate-900/90 border border-slate-800 ${cat.color}`}>
                      <IconComp size={15} />
                    </div>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                      isSelected 
                        ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-400/40' 
                        : 'bg-slate-900/80 text-slate-300 border border-slate-800'
                    }`}>
                      {pct}%
                    </span>
                  </div>
                  
                  <div className="text-xs font-black leading-tight line-clamp-1 text-slate-100" title={cat.label}>
                    {cat.label.split('/')[0].trim()}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-lg font-black text-white">{count}</span>
                    <span className="text-[10px] font-bold text-slate-400">คิว</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden bg-slate-800">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${cat.barColor}`}
                      style={{ width: `${Math.max(6, pct)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🌟 Row 3: Daily Booking Rhythm Chart (แนวๆ ตัวอย่างรูปที่สอง เป๊ะๆ!) */}
      <div className="mt-5 pt-4 border-t border-slate-800 space-y-4">
        
        {/* Detail Header Bar for Selected/Hovered Day */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span className="text-xs font-bold text-slate-300">
              รายละเอียดวันที่เลือก: <strong className="text-white font-black">{selectedDayDow} {activeHoverOrToday} {monthShortThai} {currentMonthDate.getFullYear() + 543}</strong>
              {isCurrentMonth && activeHoverOrToday === todayDateNum && (
                <span className="ml-1.5 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-md font-bold">
                  🔥 (วันนี้)
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs font-bold flex-wrap">
            <span className="text-teal-400 font-black">ยอดจอง: {selectedDayInfo.total} คิว</span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-emerald-300 font-bold bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
              🌱 ลูกค้าใหม่: <span className="font-black text-white">{selectedDayInfo.newCust || 0}</span> ท่าน
            </span>
            <span className="text-cyan-300 font-bold bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
              💎 ลูกค้าเก่า: <span className="font-black text-white">{selectedDayInfo.oldCust || 0}</span> ท่าน
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-emerald-400">LINE: {selectedDayInfo.line}</span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-amber-400">หน้าร้าน: {selectedDayInfo.walkin}</span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-purple-400">เสร็จ: {selectedDayInfo.completed}</span>
          </div>
        </div>

        {/* 31-Day Bar Chart Canvas with Dotted Average Line */}
        <div className="bg-[#0b0f19] border border-slate-800/90 rounded-2xl p-4 relative overflow-hidden">
          
          <div className="relative h-32 pt-6 pb-2 px-1 flex items-end gap-1 sm:gap-1.5 overflow-x-auto">
            
            {/* Dotted Average Line */}
            {stats.total > 0 && (
              <div 
                className="absolute left-2 right-2 border-b border-dashed border-amber-400/40 z-10 pointer-events-none flex items-center justify-start"
                style={{ 
                  bottom: `${Math.min(90, Math.max(15, (parseFloat(stats.avgPerDay) / Math.max(1, stats.peakDayCount)) * 90))}%` 
                }}
              >
                <span className="text-[9px] font-bold text-amber-300/80 bg-[#0b0f19]/90 px-1.5 py-0.5 rounded -translate-y-2.5">
                  --- เส้นเฉลี่ย {stats.avgPerDay} คิว/วัน
                </span>
              </div>
            )}

            {Object.entries(stats.dailyMap).map(([day, val]) => {
              const dayNum = parseInt(day, 10);
              const isToday = isCurrentMonth && dayNum === todayDateNum;
              const isPeak = dayNum === stats.peakDayNum && stats.peakDayCount > 0;
              const isHovered = activeHoverOrToday === dayNum;
              const targetDayStr = `${selectedMonth || thisMonthIso}-${String(dayNum).padStart(2, '0')}`;
              const isDaySelected = activeBannerFilter?.type === 'date' && activeBannerFilter?.value === targetDayStr;
              
              const maxCount = Math.max(1, stats.peakDayCount);
              const heightPct = val.total > 0 ? Math.max(16, Math.round((val.total / maxCount) * 85)) : 6;
              const dow = THAI_DAYS_SHORT[val.dayOfWeek] || '';

              return (
                <div
                  key={day}
                  onMouseEnter={() => setHoveredDayNum(dayNum)}
                  onClick={() => toggleFilter('date', targetDayStr, `วันที่ ${dayNum} ${monthLabelThai}`)}
                  title={`วันที่ ${dayNum} ${monthLabelThai}: รวม ${val.total} คิว (🌱 ลูกค้าใหม่ ${val.newCust || 0} ท่าน • 💎 ลูกค้าเก่า ${val.oldCust || 0} ท่าน)`}
                  className="flex-1 min-w-[16px] sm:min-w-[18px] flex flex-col items-center justify-end h-full group cursor-pointer relative z-20"
                >
                  {/* Tooltip on hover */}
                  {val.total > 0 && (
                    <div className={`mb-1 transition-all text-center flex flex-col items-center pointer-events-none ${
                      isHovered ? 'scale-105 opacity-100 z-30' : 'opacity-0 group-hover:opacity-100'
                    }`}>
                      <span className="text-[8.5px] font-black text-cyan-300 leading-none">
                        {val.total}
                      </span>
                      {isHovered && (
                        <span className="text-[7.5px] font-bold text-slate-200 whitespace-nowrap bg-slate-900/95 border border-slate-700 px-1 py-0.2 rounded mt-0.5 shadow-lg">
                          🌱{val.newCust || 0} 💎{val.oldCust || 0}
                        </span>
                      )}
                    </div>
                  )}

                  {/* The Bar */}
                  <div
                    className={`w-full rounded-t-lg transition-all duration-200 ${
                      isDaySelected
                        ? 'bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.7)] ring-2 ring-purple-300'
                        : isToday
                          ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)] ring-1 ring-emerald-300'
                          : isPeak
                            ? 'bg-gradient-to-t from-amber-600 to-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)]'
                            : isHovered
                              ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]'
                              : val.total > 0
                                ? 'bg-gradient-to-t from-indigo-900 to-indigo-600 hover:to-indigo-500'
                                : 'bg-slate-800/60 hover:bg-slate-700'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />

                  {/* Day Number and Weekday underneath */}
                  <span className={`text-[9px] mt-1 font-bold ${
                    isToday ? 'text-emerald-400 font-black' : isDaySelected ? 'text-purple-400 font-black' : isHovered ? 'text-white' : 'text-slate-400'
                  }`}>
                    {dayNum}
                  </span>
                  <span className="text-[7.5px] text-slate-500 leading-none">
                    {dow}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Chart Legend (เหมือนรูปที่ 2 เป๊ะๆ + เสริมข้อมูลลูกค้าใหม่/เก่า) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 mt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            <div className="flex items-center gap-3 flex-wrap font-bold">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> ยอดจองปกติ
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"></span> วันนี้ (Live)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]"></span> ยอดสูงสุด
              </span>
              <span className="flex items-center gap-1.5 text-amber-300">
                <span className="w-3 border-b border-dashed border-amber-300"></span> เส้นเฉลี่ย
              </span>
              <span className="flex items-center gap-1 text-emerald-300 font-bold ml-1">
                🌱 ลูกค้าใหม่
              </span>
              <span className="flex items-center gap-1 text-cyan-300 font-bold">
                💎 ลูกค้าเก่า
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              แตะหรือชี้ที่แท่งกราฟเพื่อดูรายละเอียดลูกค้าใหม่/เก่าแต่ละวัน
            </div>
          </div>
        </div>

        {/* Peak Hours Breakdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Sun size={15} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-300">ช่วงเช้า (10:00 - 13:00)</div>
                <div className="text-[10px] text-slate-500">เปิดร้านรอบแรก</div>
              </div>
            </div>
            <span className="text-base font-black text-amber-400">{stats.morningCount} คิว</span>
          </div>

          <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between shadow-sm shadow-amber-950/20">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <Sunset size={15} />
              </div>
              <div>
                <div className="text-xs font-black text-amber-300 flex items-center gap-1">
                  <span>ช่วงบ่าย (13:00 - 17:00)</span>
                  <span className="text-[9px] bg-amber-500/20 px-1 rounded text-amber-300">🔥 พีกสุด</span>
                </div>
                <div className="text-[10px] text-amber-400/80">ความหนาแน่นสูงสุด</div>
              </div>
            </div>
            <span className="text-base font-black text-amber-300">{stats.afternoonCount} คิว</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Moon size={15} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-300">ช่วงเย็น (17:00 - 20:00)</div>
                <div className="text-[10px] text-slate-500">หลังเลิกงาน</div>
              </div>
            </div>
            <span className="text-base font-black text-indigo-400">{stats.eveningCount} คิว</span>
          </div>
        </div>

      </div>

      {/* 🌟 Active Filter Alert Pill */}
      {activeBannerFilter?.type && (
        <div className="mt-4 p-3 bg-indigo-950/80 border border-indigo-500/40 rounded-2xl flex items-center justify-between gap-2 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-black text-indigo-200">
            <Filter size={14} className="text-indigo-400" />
            <span>กำลังกรองคิว: <span className="underline decoration-indigo-400 font-extrabold text-white">{activeBannerFilter.label}</span></span>
          </div>
          <button
            type="button"
            onClick={onClearBannerFilter}
            className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer"
          >
            <X size={12} />
            <span>ล้างตัวกรอง</span>
          </button>
        </div>
      )}

    </div>
  );
}
