import React, { useState, useMemo } from 'react';
import { 
  Calendar, ChevronLeft, ChevronRight, Sparkles, Droplet, Zap, 
  Target, Syringe, Pill, Activity, TrendingUp, Clock, Users, 
  MessageSquare, UserCheck, CheckCircle2, AlertCircle, Filter, 
  X, ChevronDown, ChevronUp, MapPin, BarChart3, Sun, Sunset, Moon
} from 'lucide-react';
import { getSafeDateTime, getBookingStatus } from '../utils/dateUtils';
import { getLocalYYYYMMDD } from '../utils/parse';

// Match service category
export const matchBookingServiceCategory = (courseName, categoryId) => {
  if (!courseName) return categoryId === 'other';
  const nameLower = String(courseName).toLowerCase();
  
  if (categoryId === 'acne') {
    return nameLower.includes('สิว') || nameLower.includes('มาร์ค') || nameLower.includes('มาส์ก') || nameLower.includes('acne');
  }
  if (categoryId === 'facial') {
    return nameLower.includes('หน้า') || nameLower.includes('ทรีท') || nameLower.includes('นวด') || nameLower.includes('facial') || nameLower.includes('บำรุง') || nameLower.includes('ลงเครื่อง');
  }
  if (categoryId === 'laser') {
    return nameLower.includes('ipl') || nameLower.includes('เลเซอร์') || nameLower.includes('laser') || nameLower.includes('กำจัดขน') || nameLower.includes('รักแร้');
  }
  if (categoryId === 'mole') {
    return nameLower.includes('ไฝ') || nameLower.includes('ขี้แมลงวัน') || nameLower.includes('ติ่งเนื้อ');
  }
  if (categoryId === 'injection') {
    return nameLower.includes('ฉีด') || nameLower.includes('botox') || nameLower.includes('โบท็อก') || nameLower.includes('ฟิลเลอร์') || nameLower.includes('filler') || nameLower.includes('แฟต') || nameLower.includes('fat') || nameLower.includes('meso') || nameLower.includes('เมโส');
  }
  if (categoryId === 'vitamin') {
    return nameLower.includes('ดริป') || nameLower.includes('วิตามิน') || nameLower.includes('vitamin') || nameLower.includes('drip') || nameLower.includes('ผิวขาว');
  }
  if (categoryId === 'other') {
    return !matchBookingServiceCategory(courseName, 'acne') &&
           !matchBookingServiceCategory(courseName, 'facial') &&
           !matchBookingServiceCategory(courseName, 'laser') &&
           !matchBookingServiceCategory(courseName, 'mole') &&
           !matchBookingServiceCategory(courseName, 'injection') &&
           !matchBookingServiceCategory(courseName, 'vitamin');
  }
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

const SERVICE_CATEGORIES = [
  { id: 'acne', label: 'เคลียร์สิว / กดสิว / มาร์ค', icon: Droplet, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', bar: 'bg-blue-500' },
  { id: 'facial', label: 'ทำหน้า / ทรีตเมนต์ / นวด', icon: Sparkles, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', bar: 'bg-amber-500' },
  { id: 'laser', label: 'IPL / เลเซอร์กำจัดขน', icon: Zap, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', bar: 'bg-purple-500' },
  { id: 'mole', label: 'จี้ไฝ / ขี้แมลงวัน / ติ่งเนื้อ', icon: Target, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', bar: 'bg-rose-500' },
  { id: 'injection', label: 'ฉีด / โบท็อกซ์ / ฟิลเลอร์', icon: Syringe, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-200', bar: 'bg-pink-500' },
  { id: 'vitamin', label: 'ดริปวิตามินผิว / ผิวขาว', icon: Pill, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', bar: 'bg-emerald-500' },
  { id: 'other', label: 'บริการทั่วไป / ปรึกษาผิว', icon: Activity, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', bar: 'bg-slate-500' }
];

export default function MonthlyBookingOverviewBanner({
  bookings = [],
  selectedMonth = '', // YYYY-MM
  onMonthChange = () => {},
  activeBannerFilter = null,
  onApplyBannerFilter = () => {},
  onClearBannerFilter = () => {},
  selectedBranch = 'all',
  onBranchChange = () => {}
}) {
  const [showDeepAnalytics, setShowDeepAnalytics] = useState(false);

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

    let inProgressCount = 0;
    let completedCount = 0;
    let pendingCount = 0;
    let cancelledCount = 0;

    // Time of day counts
    let morningCount = 0;   // 10:00 - 12:59
    let afternoonCount = 0; // 13:00 - 16:59
    let eveningCount = 0;   // 17:00+

    // Service category breakdown
    const serviceCounts = {
      acne: 0,
      facial: 0,
      laser: 0,
      mole: 0,
      injection: 0,
      vitamin: 0,
      other: 0
    };

    // Daily distribution map: day 1 to 31 -> count
    const dailyMap = {};
    const daysInMonth = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      dailyMap[d] = 0;
    }

    monthlyBookings.forEach(b => {
      const guests = Number(b.guestsCount || b.pax || 1);
      totalGuests += guests;

      // Source
      if (checkIsLineBooking(b)) {
        lineCount++;
      } else if (b.isWalkIn) {
        walkInCount++;
      } else {
        adminCount++;
      }

      // Status
      const st = getBookingStatus(b);
      if (st === 'กำลังใช้บริการ') inProgressCount++;
      else if (st === 'เสร็จสิ้น') completedCount++;
      else if (st === 'รอการยืนยัน' || st === 'ยืนยันแล้ว') pendingCount++;
      else if (st === 'ยกเลิก' || st === 'ยกเลิกฉุกเฉิน') cancelledCount++;

      // Time
      const dt = getSafeDateTime(b);
      if (dt && dt.includes('T')) {
        const timePart = dt.split('T')[1];
        const hour = parseInt(timePart.split(':')[0], 10);
        if (hour < 13) morningCount++;
        else if (hour < 17) afternoonCount++;
        else eveningCount++;

        // Day of month
        const dayNum = parseInt(dt.split('T')[0].split('-')[2], 10);
        if (dailyMap[dayNum] !== undefined) {
          dailyMap[dayNum]++;
        }
      }

      // Service Categories
      const cName = b.courseName || '';
      let matchedAny = false;
      ['acne', 'facial', 'laser', 'mole', 'injection', 'vitamin'].forEach(catId => {
        if (matchBookingServiceCategory(cName, catId)) {
          serviceCounts[catId]++;
          matchedAny = true;
        }
      });
      if (!matchedAny) {
        serviceCounts.other++;
      }
    });

    return {
      total,
      totalGuests,
      lineCount,
      walkInCount,
      adminCount,
      inProgressCount,
      completedCount,
      pendingCount,
      cancelledCount,
      morningCount,
      afternoonCount,
      eveningCount,
      serviceCounts,
      dailyMap,
      daysInMonth
    };
  }, [monthlyBookings, currentMonthDate]);

  // Handle Filter clicks
  const toggleFilter = (type, value, label) => {
    if (activeBannerFilter?.type === type && activeBannerFilter?.value === value) {
      onClearBannerFilter();
    } else {
      onApplyBannerFilter({ type, value, label });
    }
  };

  const todayDateNum = new Date().getDate();

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm relative overflow-hidden transition-all duration-200">
      
      {/* Decorative top gradient bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-indigo-500 to-purple-600"></div>

      {/* 🌟 Header: Title, Month Selector & Branch Pills */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
        
        {/* Left Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
            <BarChart3 size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
                สรุปรายการจองประจำเดือน
              </h3>
              <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 shrink-0">
                Iris Intelligence
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              สถิติการเคลื่อนไหว • คอร์สยอดฮิต • สัดส่วนลูกค้าจองผ่าน LINE
            </p>
          </div>
        </div>

        {/* Right Controls: Month Selector & Deep Analytics Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Month Switcher */}
          <div className="flex items-center bg-slate-50 border border-slate-200/80 rounded-2xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white rounded-xl text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
              title="เดือนก่อนหน้า"
            >
              <ChevronLeft size={16} />
            </button>
            
            <div className="px-3 py-1 text-xs font-black text-slate-800 flex items-center gap-1.5 min-w-[130px] justify-center">
              <Calendar size={13} className="text-indigo-600" />
              <span>{monthLabelThai}</span>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white rounded-xl text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
              title="เดือนถัดไป"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {!isCurrentMonth && (
            <button
              type="button"
              onClick={handleResetToCurrentMonth}
              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs"
            >
              กลับเดือนปัจจุบัน
            </button>
          )}

          {/* Toggle Deep Movement Analytics */}
          <button
            type="button"
            onClick={() => setShowDeepAnalytics(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              showDeepAnalytics
                ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
            }`}
          >
            <TrendingUp size={13} />
            <span>{showDeepAnalytics ? 'ซ่อนกราฟ' : 'ดูความเคลื่อนไหว'}</span>
            {showDeepAnalytics ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* 🌟 Row 1: KPI Summary & Filter Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 my-3.5">
        
        {/* Card 1: Total Bookings */}
        <div
          onClick={() => toggleFilter('month', selectedMonth || thisMonthIso, `คิวทั้งหมดในเดือน ${monthLabelThai}`)}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group hover:shadow-md ${
            activeBannerFilter?.type === 'month'
              ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-lg ring-2 ring-indigo-400 ring-offset-1'
              : 'bg-gradient-to-br from-indigo-50/70 to-purple-50/40 hover:from-indigo-100/60 border-indigo-100 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[10px] font-black uppercase tracking-wider ${activeBannerFilter?.type === 'month' ? 'text-indigo-100' : 'text-indigo-600'}`}>
              คิวทั้งหมดในเดือน
            </span>
            <div className={`p-1 rounded-lg ${activeBannerFilter?.type === 'month' ? 'bg-white/20' : 'bg-white shadow-2xs'}`}>
              <Calendar size={13} className={activeBannerFilter?.type === 'month' ? 'text-white' : 'text-indigo-600'} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black">{stats.total}</span>
            <span className={`text-xs font-bold ${activeBannerFilter?.type === 'month' ? 'text-indigo-200' : 'text-slate-400'}`}>คิว</span>
          </div>
          <div className={`text-[10px] font-bold mt-1 flex items-center justify-between ${activeBannerFilter?.type === 'month' ? 'text-indigo-100' : 'text-slate-500'}`}>
            <span>👥 {stats.totalGuests} ท่าน</span>
            <span className="text-[9px] underline underline-offset-2">แตะเพื่อกรอง ↗</span>
          </div>
        </div>

        {/* Card 2: LINE Bookings */}
        <div
          onClick={() => toggleFilter('source', 'line', 'จองผ่าน LINE')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group hover:shadow-md ${
            activeBannerFilter?.type === 'source' && activeBannerFilter?.value === 'line'
              ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg ring-2 ring-emerald-400 ring-offset-1'
              : 'bg-gradient-to-br from-emerald-50/70 to-teal-50/40 hover:from-emerald-100/60 border-emerald-100 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className={`text-[10px] font-black uppercase tracking-wider ${activeBannerFilter?.type === 'source' && activeBannerFilter?.value === 'line' ? 'text-emerald-100' : 'text-emerald-700'}`}>
                จองผ่าน LINE
              </span>
            </div>
            <div className={`p-1 rounded-lg ${activeBannerFilter?.type === 'source' && activeBannerFilter?.value === 'line' ? 'bg-white/20' : 'bg-white shadow-2xs'}`}>
              <MessageSquare size={13} className={activeBannerFilter?.type === 'source' && activeBannerFilter?.value === 'line' ? 'text-white' : 'text-emerald-600'} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black">{stats.lineCount}</span>
            <span className={`text-xs font-bold ${activeBannerFilter?.type === 'source' && activeBannerFilter?.value === 'line' ? 'text-emerald-200' : 'text-slate-400'}`}>
              ({stats.total > 0 ? Math.round((stats.lineCount / stats.total) * 100) : 0}%)
            </span>
          </div>
          <div className={`text-[10px] font-bold mt-1 flex items-center justify-between ${activeBannerFilter?.type === 'source' && activeBannerFilter?.value === 'line' ? 'text-emerald-100' : 'text-slate-500'}`}>
            <span>ลูกค้าจองด้วยตนเอง</span>
            <span className="text-[9px] underline underline-offset-2">แตะเพื่อกรอง ↗</span>
          </div>
        </div>

        {/* Card 3: Walk-in & หน้าร้าน */}
        <div
          onClick={() => toggleFilter('source', 'walkin', 'Walk-in & หน้าร้าน')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group hover:shadow-md ${
            activeBannerFilter?.type === 'source' && activeBannerFilter?.value === 'walkin'
              ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg ring-2 ring-amber-400 ring-offset-1'
              : 'bg-gradient-to-br from-amber-50/70 to-orange-50/40 hover:from-amber-100/60 border-amber-100 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[10px] font-black uppercase tracking-wider ${activeBannerFilter?.type === 'source' && activeBannerFilter?.value === 'walkin' ? 'text-amber-100' : 'text-amber-700'}`}>
              Walk-in & แอดมิน
            </span>
            <div className={`p-1 rounded-lg ${activeBannerFilter?.type === 'source' && activeBannerFilter?.value === 'walkin' ? 'bg-white/20' : 'bg-white shadow-2xs'}`}>
              <Users size={13} className={activeBannerFilter?.type === 'source' && activeBannerFilter?.value === 'walkin' ? 'text-white' : 'text-amber-600'} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black">{stats.walkInCount + stats.adminCount}</span>
            <span className={`text-xs font-bold ${activeBannerFilter?.type === 'source' && activeBannerFilter?.value === 'walkin' ? 'text-amber-200' : 'text-slate-400'}`}>
              ({stats.total > 0 ? Math.round(((stats.walkInCount + stats.adminCount) / stats.total) * 100) : 0}%)
            </span>
          </div>
          <div className={`text-[10px] font-bold mt-1 flex items-center justify-between ${activeBannerFilter?.type === 'source' && activeBannerFilter?.value === 'walkin' ? 'text-amber-100' : 'text-slate-500'}`}>
            <span>หน้าร้าน {stats.walkInCount} • แอดมิน {stats.adminCount}</span>
            <span className="text-[9px] underline underline-offset-2">แตะเพื่อกรอง ↗</span>
          </div>
        </div>

        {/* Card 4: Service Status (Completed & In progress) */}
        <div
          onClick={() => toggleFilter('status', 'เสร็จสิ้น', 'คิวที่เสร็จสิ้นแล้ว')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group hover:shadow-md ${
            activeBannerFilter?.type === 'status' && activeBannerFilter?.value === 'เสร็จสิ้น'
              ? 'bg-gradient-to-br from-teal-600 to-cyan-700 text-white shadow-lg ring-2 ring-teal-400 ring-offset-1'
              : 'bg-gradient-to-br from-teal-50/70 to-cyan-50/40 hover:from-teal-100/60 border-teal-100 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[10px] font-black uppercase tracking-wider ${activeBannerFilter?.type === 'status' && activeBannerFilter?.value === 'เสร็จสิ้น' ? 'text-teal-100' : 'text-teal-700'}`}>
              ความคืบหน้าบริการ
            </span>
            <div className={`p-1 rounded-lg ${activeBannerFilter?.type === 'status' && activeBannerFilter?.value === 'เสร็จสิ้น' ? 'bg-white/20' : 'bg-white shadow-2xs'}`}>
              <CheckCircle2 size={13} className={activeBannerFilter?.type === 'status' && activeBannerFilter?.value === 'เสร็จสิ้น' ? 'text-white' : 'text-teal-600'} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black">{stats.completedCount}</span>
            <span className={`text-xs font-bold ${activeBannerFilter?.type === 'status' && activeBannerFilter?.value === 'เสร็จสิ้น' ? 'text-teal-200' : 'text-slate-400'}`}>
              / {stats.total} เสร็จสิ้น
            </span>
          </div>
          <div className={`text-[10px] font-bold mt-1 flex items-center justify-between ${activeBannerFilter?.type === 'status' && activeBannerFilter?.value === 'เสร็จสิ้น' ? 'text-teal-100' : 'text-slate-500'}`}>
            <span className="flex items-center gap-1.5">
              <span className="text-purple-600 font-black">กำลังทำ {stats.inProgressCount}</span>
              <span>•</span>
              <span className="text-blue-600 font-black">รอคิว {stats.pendingCount}</span>
            </span>
            <span className="text-[9px] underline underline-offset-2">แตะเพื่อกรอง ↗</span>
          </div>
        </div>

      </div>

      {/* 🌟 Row 2: "ลูกค้าจองอะไรเท่าไหร่" (Service / Treatment Breakdown Filter Cards) */}
      <div className="mt-4 pt-3.5 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Sparkles size={14} className="text-indigo-600" />
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
              className="text-[11px] font-black text-rose-600 hover:text-rose-700 flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200"
            >
              <X size={12} />
              <span>ล้างตัวกรองบริการ</span>
            </button>
          )}
        </div>

        {/* Service Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
          {SERVICE_CATEGORIES.map(cat => {
            const count = stats.serviceCounts[cat.id] || 0;
            const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
            const isSelected = activeBannerFilter?.type === 'service' && activeBannerFilter?.value === cat.id;
            const IconComp = cat.icon;

            return (
              <div
                key={cat.id}
                onClick={() => toggleFilter('service', cat.id, cat.label)}
                className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-indigo-500 scale-[1.02]' 
                    : `${cat.bg} ${cat.border} hover:shadow-sm hover:-translate-y-0.5 text-slate-800`
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className={`p-1.5 rounded-xl ${isSelected ? 'bg-white/20 text-white' : 'bg-white shadow-2xs ' + cat.color}`}>
                      <IconComp size={14} />
                    </div>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-white/90 text-slate-700 border border-slate-200/60'
                    }`}>
                      {pct}%
                    </span>
                  </div>
                  
                  <div className={`text-[11px] font-black leading-tight line-clamp-1 ${isSelected ? 'text-white' : 'text-slate-800'}`} title={cat.label}>
                    {cat.label.split('/')[0].trim()}
                  </div>
                </div>

                <div className="mt-2">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-base font-black">{count}</span>
                    <span className={`text-[9px] font-bold ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>คิว</span>
                  </div>
                  <div className={`w-full h-1 rounded-full overflow-hidden ${isSelected ? 'bg-white/20' : 'bg-slate-200'}`}>
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${isSelected ? 'bg-indigo-400' : cat.bar}`}
                      style={{ width: `${Math.max(5, pct)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🌟 Row 3: Deep Movement & Rhythm Analytics (ความเคลื่อนไหวของร้าน - Expandable) */}
      {showDeepAnalytics && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-in fade-in duration-200">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
            
            {/* 1. Daily Booking Rhythm (ปฏิทินความหนาแน่นรายวัน) */}
            <div className="lg:col-span-2 bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Calendar size={13} className="text-indigo-600" />
                  <span>ความหนาแน่นการจองคิวรายวัน ({monthLabelThai})</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">แตะแท่งเพื่อกรองวัน</span>
              </div>

              {/* 31 days bar chart */}
              <div className="flex items-end gap-1 h-24 pt-4 px-1 overflow-x-auto">
                {Object.entries(stats.dailyMap).map(([day, cnt]) => {
                  const dayNum = parseInt(day, 10);
                  const isToday = isCurrentMonth && dayNum === todayDateNum;
                  const targetDayStr = `${selectedMonth || thisMonthIso}-${String(dayNum).padStart(2, '0')}`;
                  const isDaySelected = activeBannerFilter?.type === 'date' && activeBannerFilter?.value === targetDayStr;
                  const maxDayCount = Math.max(1, ...Object.values(stats.dailyMap));
                  const heightPct = cnt > 0 ? Math.max(18, Math.round((cnt / maxDayCount) * 100)) : 8;

                  return (
                    <div
                      key={day}
                      onClick={() => toggleFilter('date', targetDayStr, `วันที่ ${dayNum} ${monthLabelThai}`)}
                      className="flex-1 min-w-[14px] flex flex-col items-center justify-end h-full group cursor-pointer"
                      title={`วันที่ ${dayNum}: ${cnt} คิว`}
                    >
                      {cnt > 0 && (
                        <span className="text-[8px] font-black text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          {cnt}
                        </span>
                      )}
                      <div
                        className={`w-full rounded-t-md transition-all ${
                          isDaySelected
                            ? 'bg-purple-600 shadow-sm ring-2 ring-purple-400'
                            : isToday
                              ? 'bg-indigo-500 shadow-xs ring-1 ring-indigo-300'
                              : cnt > 0
                                ? 'bg-teal-500/80 hover:bg-teal-600'
                                : 'bg-slate-200/70 hover:bg-slate-300'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                      <span className={`text-[8.5px] mt-1 font-bold ${
                        isToday ? 'text-indigo-600 font-black' : isDaySelected ? 'text-purple-700 font-black' : 'text-slate-400'
                      }`}>
                        {dayNum}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Peak Hours (ช่วงเวลายอดนิยมในการจอง) */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5 mb-2.5">
                  <Clock size={13} className="text-amber-500" />
                  <span>ช่วงเวลายอดนิยม (Peak Hours)</span>
                </span>
                
                <div className="space-y-2">
                  {/* Morning */}
                  <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-white border border-slate-100 shadow-2xs">
                    <span className="flex items-center gap-1.5 font-bold text-amber-700">
                      <Sun size={13} /> เช้า (10:00 - 13:00)
                    </span>
                    <span className="font-black text-slate-800">{stats.morningCount} คิว</span>
                  </div>

                  {/* Afternoon */}
                  <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-amber-50/80 border border-amber-200 shadow-2xs">
                    <span className="flex items-center gap-1.5 font-black text-amber-900">
                      <Sunset size={13} className="text-amber-600" /> บ่าย (13:00 - 17:00) 🔥 พีกสุด
                    </span>
                    <span className="font-black text-amber-900">{stats.afternoonCount} คิว</span>
                  </div>

                  {/* Evening */}
                  <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-white border border-slate-100 shadow-2xs">
                    <span className="flex items-center gap-1.5 font-bold text-indigo-700">
                      <Moon size={13} /> เย็น (17:00 - 20:00)
                    </span>
                    <span className="font-black text-slate-800">{stats.eveningCount} คิว</span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-200/60 mt-2 flex items-center justify-between font-medium">
                <span>อัตราการจองผ่าน LINE:</span>
                <span className="font-black text-emerald-600">
                  {stats.total > 0 ? Math.round((stats.lineCount / stats.total) * 100) : 0}% ของคิวทั้งหมด
                </span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 🌟 Active Filter Alert Pill */}
      {activeBannerFilter?.type && (
        <div className="mt-3.5 p-2.5 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between gap-2 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-black text-indigo-900">
            <Filter size={14} className="text-indigo-600" />
            <span>กำลังกรองคิว: <span className="underline decoration-indigo-400 font-extrabold">{activeBannerFilter.label}</span></span>
          </div>
          <button
            type="button"
            onClick={onClearBannerFilter}
            className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-black flex items-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer"
          >
            <X size={12} />
            <span>ล้างตัวกรอง</span>
          </button>
        </div>
      )}

    </div>
  );
}
