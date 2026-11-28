import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  Store, 
  ArrowUpRight, 
  Sparkles, 
  CreditCard, 
  Banknote, 
  ChevronRight, 
  Info,
  DollarSign,
  BarChart3,
  Award,
  FileText
} from 'lucide-react';
import DailySalesPreviewModal from './DailySalesPreviewModal';
import { 
  parseNumber, 
  getLocalYYYYMMDD, 
  normalizeBranchName, 
  parseThaiDate 
} from '../utils/parse';
import { getFuzzyKey } from '../utils/fuzzy';

const THAI_MONTH_MAP = {
  'ม.ค.': 1, 'มกราคม': 1,
  'ก.พ.': 2, 'กุมภาพันธ์': 2,
  'มี.ค.': 3, 'มีนาคม': 3,
  'เม.ย.': 4, 'เมษายน': 4,
  'พ.ค.': 5, 'พฤษภาคม': 5,
  'มิ.ย.': 6, 'มิถุนายน': 6,
  'ก.ค.': 7, 'กรกฎาคม': 7,
  'ส.ค.': 8, 'สิงหาคม': 8,
  'ก.ย.': 9, 'กันยายน': 9,
  'ต.ค.': 10, 'ตุลาคม': 10,
  'พ.ย.': 11, 'พฤศจิกายน': 11,
  'ธ.ค.': 12, 'ธันวาคม': 12,
};

// Helper to convert any date representation to YYYY-MM-DD
const extractIsoDate = (val) => {
  if (!val) return '';
  if (val instanceof Date) return isNaN(val.getTime()) ? '' : getLocalYYYYMMDD(val);
  if (typeof val?.toDate === 'function') {
    const d = val.toDate();
    return isNaN(d.getTime()) ? '' : getLocalYYYYMMDD(d);
  }
  if (typeof val?.seconds === 'number') {
    const d = new Date(val.seconds * 1000);
    return isNaN(d.getTime()) ? '' : getLocalYYYYMMDD(d);
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return '';
    // 1. Thai textual month like "26 พ.ย. 2569" or "26 พฤศจิกายน 2569"
    const thaiMatch = trimmed.match(/^(\d{1,2})\s+([^\s\d]+)\s+(\d{2,4})/);
    if (thaiMatch) {
      const d = parseInt(thaiMatch[1], 10);
      const mStr = thaiMatch[2].replace(/\.$/, '');
      let y = parseInt(thaiMatch[3], 10);
      const m = THAI_MONTH_MAP[mStr] || THAI_MONTH_MAP[mStr + '.'];
      if (m) {
        if (y < 100) y = y >= 55 ? (y + 2500 - 543) : (y + 2000);
        else if (y > 2400) y -= 543;
        const dt = new Date(y, m - 1, d);
        if (!isNaN(dt.getTime())) return getLocalYYYYMMDD(dt);
      }
    }
    // 2. ISO / Datetime strings with 'T'
    if (trimmed.includes('T')) {
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) return getLocalYYYYMMDD(d);
    }
    // 3. parseThaiDate (handles DD/MM/YYYY, YYYY-MM-DD, Thai Buddhist year)
    const parsed = parseThaiDate(trimmed);
    if (parsed) return getLocalYYYYMMDD(parsed);
    // 4. Standard Date fallback
    const fallback = new Date(trimmed);
    return isNaN(fallback.getTime()) ? '' : getLocalYYYYMMDD(fallback);
  }
  return '';
};

const UNPAID_ORDER_STATUSES = ['รอชำระเงิน', 'รอตรวจสอบ', 'รอตรวจสอบยอดโอน', 'รอดำเนินการ', 'รอประเมินราคา', 'ยกเลิก', 'cancelled'];

export const isShopeeOrder = (o) => {
  if (!o) return false;
  const channel = String(o.orderChannel || o.channel || '').toLowerCase();
  const source = String(o.source || '').toUpperCase();
  const payment = String(o.paymentMethod || o.method || '').toLowerCase();
  return (
    channel === 'shopee' ||
    channel.includes('shopee') ||
    channel.includes('ช้อปปี้') ||
    channel.includes('ช็อปปี้') ||
    source === 'SHOPEE' ||
    Boolean(o.shopeeNetReceived !== undefined && o.shopeeNetReceived !== '') ||
    payment.includes('shopee') ||
    payment.includes('ช้อปปี้') ||
    payment.includes('ช็อปปี้')
  );
};

// Check if order counts toward customer sales revenue (real POS & approved/paid sales)
const isOrderCompletedForRevenue = (o) => {
  if (!o || o.isCancelled || o.source === 'POS_Parked' || o.mergedIntoPosOrderNo) return false;
  // Exclude internal stock transfers & owner acquisitions & internal clinic use
  const isReq = o.transactionType === 'branch_requisition' || (o.courseName || '').includes('[เบิกจาก');
  const isPO = o.transactionType === 'owner_purchase' || (o.courseName || '').includes('[ซื้อเข้า');
  const isStoreUse = o.transactionType === 'store_use' || (o.courseName || '').includes('[เบิกใช้');
  if (isReq || isPO || isStoreUse) return false;
  
  const rawStatus = String(getFuzzyKey(o, ['status', 'สถานะ']) || '').trim();
  if (rawStatus && UNPAID_ORDER_STATUSES.some(s => rawStatus.toLowerCase().includes(s.toLowerCase()))) {
    return false;
  }

  // Non-cancelled Shopee orders always count towards revenue
  if (isShopeeOrder(o)) {
    if (rawStatus && (rawStatus.includes('ยกเลิก') || rawStatus.includes('cancel') || rawStatus.includes('คืนเงิน') || rawStatus.includes('refund'))) {
      return false;
    }
    return true;
  }

  // POS orders (source === 'POS') are real completed point-of-sale transactions
  if (o.source === 'POS') return true;

  // General / web / customer app orders: completed, approved, paid, or shipped
  if (!rawStatus) return true;
  return (
    rawStatus === 'สำเร็จ' ||
    rawStatus === 'อนุมัติแล้ว' ||
    rawStatus === 'ชำระเงินแล้ว' ||
    rawStatus === 'กำลังจัดส่ง' ||
    rawStatus === 'จัดส่งแล้ว' ||
    rawStatus === 'เสร็จสิ้น' ||
    rawStatus === 'เรียบร้อย' ||
    rawStatus.includes('อนุมัติ') ||
    rawStatus.includes('สำเร็จ') ||
    rawStatus.includes('ชำระ')
  );
};

const getEffectiveOrderPrice = (o) => {
  if (isShopeeOrder(o) && o?.shopeeNetReceived !== undefined && o?.shopeeNetReceived !== '') {
    return parseNumber(o.shopeeNetReceived);
  }
  return parseNumber(o?.price ?? o?.total ?? o?.totalPrice ?? o?.netPrice ?? 0);
};

const parsePaymentBreakdown = (o) => {
  let cash = 0;
  let transfer = 0;
  let cod = 0;
  let shopee = 0;
  let other = 0;
  const price = getEffectiveOrderPrice(o);
  const isShopee = isShopeeOrder(o);
  if (isShopee) {
    shopee = price;
  }
  const methodStr = String(o?.paymentMethod || o?.method || o?.paymentType || '').trim();

  if (methodStr.includes(':')) {
    // Composite split payment format "เงินสด: 500, โอนเงิน: 1000"
    const parts = methodStr.split(',');
    parts.forEach(p => {
      const trimmed = p.trim();
      if (trimmed.startsWith('เงินสด:')) {
        cash += parseNumber(trimmed.replace('เงินสด:', ''));
      } else if (trimmed.startsWith('โอนเงิน:')) {
        transfer += parseNumber(trimmed.replace('โอนเงิน:', ''));
      } else if (trimmed.includes('COD') || trimmed.includes('ค้าง')) {
        cod += parseNumber(trimmed.replace(/[^0-9.]/g, ''));
      } else {
        other += parseNumber(trimmed.replace(/[^0-9.]/g, ''));
      }
    });
  } else {
    const lower = methodStr.toLowerCase();
    if (isShopee) {
      shopee = price;
    } else if (lower === 'cash' || lower.includes('เงินสด')) {
      cash = price;
    } else if (lower === 'transfer' || lower.includes('โอน') || lower.includes('promptpay') || lower.includes('qr')) {
      transfer = price;
    } else if (lower.includes('cod') || lower.includes('ค้าง')) {
      cod = price;
    } else {
      // Default clinic checkout without explicit label is Bank/QR transfer
      transfer = price;
    }
  }

  return { cash, transfer, cod, shopee, other };
};

const THAI_DAYS_SHORT = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const THAI_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

export default function DailySalesBannerChart({
  dailySales = [],
  orders = [],
  branches = [],
  globalBranch = '',
  onNavigateToTab = () => {}
}) {
  const [selectedBranch, setSelectedBranch] = useState(() => globalBranch || 'ทั้งหมด');
  const [dayRange, setDayRange] = useState(14); // 7, 14, 30
  const [hoveredDay, setHoveredDay] = useState(null);
  const [previewModalDate, setPreviewModalDate] = useState(null);

  // Sync if globalBranch changes
  React.useEffect(() => {
    if (globalBranch && selectedBranch !== 'ทั้งหมด' && selectedBranch !== globalBranch) {
      setSelectedBranch(globalBranch);
    }
  }, [globalBranch]);

  const todayIso = useMemo(() => getLocalYYYYMMDD(new Date()), []);

  // Compute daily sales map for past 30 days
  const { 
    chartData, 
    todayStats, 
    yesterdayStats, 
    mtdTotal, 
    mtdPosTotal,
    mtdPosOrdersCount,
    mtdPosDaysCount,
    mtdEodTotal,
    mtdEodDaysCount,
    mtdDepositTotal,
    mtdDaysCount, 
    peakDay 
  } = useMemo(() => {
    // Generate dates for current range
    const dates = [];
    for (let i = dayRange - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(getLocalYYYYMMDD(d));
    }

    // Filter orders by branch & validity
    const validOrders = orders.filter(o => {
      if (!isOrderCompletedForRevenue(o)) return false;
      if (selectedBranch && selectedBranch !== 'ทั้งหมด') {
        const orderBranch = normalizeBranchName(o.branch || 'เฉวง');
        const targetBranch = normalizeBranchName(selectedBranch);
        if (orderBranch !== targetBranch) return false;
      }
      return true;
    });

    // Group orders by ISO date
    const ordersByDate = {};
    validOrders.forEach(o => {
      const dateIso = extractIsoDate(o.createdAt || o.date || o['วันที่']);
      if (!dateIso) return;
      if (!ordersByDate[dateIso]) {
        ordersByDate[dateIso] = {
          total: 0,
          inStoreTotal: 0,
          shopeeTotal: 0,
          cash: 0,
          transfer: 0,
          cod: 0,
          shopee: 0,
          other: 0,
          orderCount: 0,
          inStoreOrderCount: 0,
          shopeeOrderCount: 0,
          orders: []
        };
      }
      const isShopee = isShopeeOrder(o);
      const price = getEffectiveOrderPrice(o);
      const breakdown = parsePaymentBreakdown(o);
      ordersByDate[dateIso].total += price;
      if (isShopee) {
        ordersByDate[dateIso].shopeeTotal += price;
        ordersByDate[dateIso].shopeeOrderCount += 1;
        ordersByDate[dateIso].shopee += price;
      } else {
        ordersByDate[dateIso].inStoreTotal += price;
        ordersByDate[dateIso].inStoreOrderCount += 1;
      }
      ordersByDate[dateIso].cash += breakdown.cash;
      ordersByDate[dateIso].transfer += breakdown.transfer;
      ordersByDate[dateIso].cod += breakdown.cod;
      ordersByDate[dateIso].other += breakdown.other;
      if (price > 0 || o.source === 'POS' || isShopee) {
        ordersByDate[dateIso].orderCount += 1;
      }
      ordersByDate[dateIso].orders.push(o);
    });

    // Check EOD submissions for extra adjustments
    const eodByDate = {};
    dailySales.forEach(ds => {
      if (selectedBranch && selectedBranch !== 'ทั้งหมด') {
        const dsBranch = normalizeBranchName(ds.branch || 'เฉวง');
        const sBranch = normalizeBranchName(selectedBranch);
        if (dsBranch !== sBranch) return;
      }
      const dateIso = extractIsoDate(ds.date) || extractIsoDate(ds.createdAt);
      if (!dateIso) return;

      const manualTransfer = parseNumber(ds.manualTransfer || 0);
      const diff = parseNumber(ds.difference || 0);
      const extra = manualTransfer + diff;
      const tSales = parseNumber(ds.totalSales);
      const baseSales = tSales > 0 ? tSales : (parseNumber(ds.cashSales) + parseNumber(ds.transferSales) + manualTransfer);
      const dayEod = Math.max(0, baseSales + diff);
      
      eodByDate[dateIso] = {
        isSubmitted: true,
        status: ds.status || 'ปิดยอดแล้ว',
        totalSales: dayEod,
        rawTotalSales: tSales,
        totalDeposit: parseNumber(ds.totalDeposit || 0),
        cashSales: parseNumber(ds.cashSales),
        transferSales: parseNumber(ds.transferSales),
        difference: diff,
        extraSales: extra
      };
    });

    // Build chart array
    let maxVal = 0;
    let peak = { date: '', total: 0 };
    const chartItems = dates.map(dateStr => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const dObj = new Date(year, month - 1, day);
      const dayName = THAI_DAYS_SHORT[dObj.getDay()];
      const monthName = THAI_MONTHS_SHORT[dObj.getMonth()];
      const thaiYearShort = (year + 543) % 100;

      const ordData = ordersByDate[dateStr] || { 
        total: 0, inStoreTotal: 0, shopeeTotal: 0, cash: 0, transfer: 0, cod: 0, shopee: 0, other: 0, orderCount: 0, inStoreOrderCount: 0, shopeeOrderCount: 0 
      };
      const eodData = eodByDate[dateStr];

      // รายรับจริงมาจากยอดบิลขาย POS โดยตรง ไม่นำยอดส่งยอดมาบวกซ้ำซ้อน
      let dayTotal = ordData.total > 0 ? ordData.total : (eodData ? eodData.totalSales : 0);

      if (dayTotal > maxVal) maxVal = dayTotal;
      if (dayTotal > peak.total) {
        peak = { date: `${day} ${monthName} ${year + 543}`, total: dayTotal, dateStr };
      }

      return {
        dateStr,
        dayNum: day,
        dayName,
        monthName,
        thaiYearShort,
        fullLabel: `${dayName} ${day} ${monthName} ${year + 543}`,
        total: dayTotal,
        posTotal: ordData.total,
        inStoreTotal: ordData.inStoreTotal,
        shopeeTotal: ordData.shopeeTotal,
        eodTotal: eodData ? eodData.totalSales : 0,
        cash: ordData.cash || (eodData ? eodData.cashSales : 0),
        transfer: ordData.transfer || (eodData ? eodData.transferSales : 0),
        shopee: ordData.shopee || 0,
        orderCount: ordData.orderCount,
        inStoreOrderCount: ordData.inStoreOrderCount,
        shopeeOrderCount: ordData.shopeeOrderCount,
        isToday: dateStr === todayIso,
        isSubmitted: Boolean(eodData)
      };
    });

    // Stats for Today & Yesterday
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayIso = getLocalYYYYMMDD(yesterdayDate);

    const todayItem = chartItems.find(i => i.dateStr === todayIso) || {
      total: 0, posTotal: 0, inStoreTotal: 0, shopeeTotal: 0, eodTotal: 0, cash: 0, transfer: 0, shopee: 0, orderCount: 0, inStoreOrderCount: 0, shopeeOrderCount: 0
    };
    const yesterdayItem = chartItems.find(i => i.dateStr === yesterdayIso) || {
      total: 0, posTotal: 0, inStoreTotal: 0, shopeeTotal: 0, eodTotal: 0, cash: 0, transfer: 0, shopee: 0, orderCount: 0, inStoreOrderCount: 0, shopeeOrderCount: 0
    };

    // Month-to-date calculation (all days from 1st of current month up to today)
    const currentMonthPrefix = todayIso.substring(0, 7);

    // 1. ยอดสะสมจริงจาก POS (บิลขายหน้าร้าน + Shopee)
    let mtdPosSum = 0;
    let mtdPosOrdersCount = 0;
    let mtdPosDaysCount = 0;
    let mtdShopeeSum = 0;
    let mtdShopeeOrdersCount = 0;
    let mtdInStorePosSum = 0;
    let mtdInStorePosOrdersCount = 0;

    Object.entries(ordersByDate).forEach(([dStr, val]) => {
      if (dStr.startsWith(currentMonthPrefix) && dStr <= todayIso) {
        mtdPosSum += val.total;
        mtdPosOrdersCount += val.orderCount;
        mtdShopeeSum += (val.shopeeTotal || 0);
        mtdShopeeOrdersCount += (val.shopeeOrderCount || 0);
        mtdInStorePosSum += (val.inStoreTotal || 0);
        mtdInStorePosOrdersCount += (val.inStoreOrderCount || 0);
        if (val.total > 0) mtdPosDaysCount++;
      }
    });

    // 2. ยอดสะสมจากการส่งยอด (ใบส่งยอดประจำวัน EOD)
    let mtdEodSum = 0;
    let mtdEodDaysCount = 0;
    let mtdDepositSum = 0;
    dailySales.forEach(ds => {
      if (selectedBranch && selectedBranch !== 'ทั้งหมด') {
        const dsBranch = normalizeBranchName(ds.branch || 'เฉวง');
        const sBranch = normalizeBranchName(selectedBranch);
        if (dsBranch !== sBranch) return;
      }
      const dateIso = extractIsoDate(ds.date) || extractIsoDate(ds.createdAt);
      if (dateIso && dateIso.startsWith(currentMonthPrefix) && dateIso <= todayIso) {
        const tSales = parseNumber(ds.totalSales);
        const manualTransfer = parseNumber(ds.manualTransfer || 0);
        const diff = parseNumber(ds.difference || 0);
        const baseSales = tSales > 0 ? tSales : (parseNumber(ds.cashSales) + parseNumber(ds.transferSales) + manualTransfer);
        const dayEod = Math.max(0, baseSales + diff);
        mtdEodSum += dayEod;
        mtdDepositSum += parseNumber(ds.totalDeposit || 0);
        if (dayEod > 0) mtdEodDaysCount++;
      }
    });

    // 3. ยอดรวมผสมสำหรับภาพรวม (Combined MTD)
    let mtdCombinedSum = 0;
    let mtdCombinedCount = 0;
    Object.entries(ordersByDate).forEach(([dStr, val]) => {
      if (dStr.startsWith(currentMonthPrefix) && dStr <= todayIso) {
        mtdCombinedSum += val.total;
        if (val.total > 0) mtdCombinedCount++;
      }
    });
    Object.entries(eodByDate).forEach(([dStr, eod]) => {
      if (dStr.startsWith(currentMonthPrefix) && dStr <= todayIso) {
        if (!ordersByDate[dStr] && eod.totalSales > 0) {
          mtdCombinedSum += eod.totalSales;
          mtdCombinedCount++;
        }
      }
    });

    return {
      chartData: chartItems,
      maxVal: maxVal > 0 ? maxVal : 10000,
      todayStats: todayItem,
      yesterdayStats: yesterdayItem,
      mtdTotal: mtdCombinedSum,
      mtdPosTotal: mtdPosSum,
      mtdPosOrdersCount,
      mtdPosDaysCount,
      mtdInStorePosTotal: mtdInStorePosSum,
      mtdInStorePosOrdersCount,
      mtdShopeeTotal: mtdShopeeSum,
      mtdShopeeOrdersCount,
      mtdEodTotal: mtdEodSum,
      mtdEodDaysCount,
      mtdDepositTotal: mtdDepositSum,
      mtdDaysCount: mtdCombinedCount > 0 ? mtdCombinedCount : 1,
      peakDay: peak
    };
  }, [orders, dailySales, selectedBranch, dayRange, todayIso]);

  // Comparison with yesterday
  const diffFromYesterday = todayStats.total - yesterdayStats.total;
  const pctFromYesterday = yesterdayStats.total > 0 
    ? Math.round((diffFromYesterday / yesterdayStats.total) * 100) 
    : (todayStats.total > 0 ? 100 : 0);
  const mtdDiff = mtdPosTotal - mtdEodTotal;
  const inStoreDiff = (mtdShopeeTotal > 0 ? mtdInStorePosTotal : mtdPosTotal) - mtdEodTotal;

  // Average per day in current timeframe
  const totalInPeriod = chartData.reduce((s, i) => s + i.total, 0);
  const avgPerDayInPeriod = chartData.length > 0 ? Math.round(totalInPeriod / chartData.length) : 0;
  const maxChartVal = useMemo(() => {
    const rawMax = Math.max(...chartData.map(d => d.total), 1000);
    // Round up nicely to nearest 5,000 or 10,000 for chart headroom
    const step = rawMax > 50000 ? 10000 : 5000;
    return Math.ceil((rawMax * 1.15) / step) * step;
  }, [chartData]);

  // SVG Chart Dimensions
  const svgWidth = 800;
  const svgHeight = 200;
  const chartPaddingTop = 24;
  const chartPaddingBottom = 32;
  const chartPaddingLeft = 12;
  const chartPaddingRight = 12;
  const usableWidth = svgWidth - chartPaddingLeft - chartPaddingRight;
  const usableHeight = svgHeight - chartPaddingTop - chartPaddingBottom;

  const barCount = chartData.length;
  const barSpacing = usableWidth / barCount;
  const barWidth = Math.max(8, Math.min(32, barSpacing * 0.65));

  // Current active tooltip item
  const activeDay = hoveredDay || chartData.find(d => d.isToday) || chartData[chartData.length - 1];

  return (
    <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-2xl border border-indigo-500/20 p-4 sm:p-7 mb-8 transition-all">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent pointer-events-none" />

      {/* 🌟 Header & Controls Bar 🌟 */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-indigo-800/40">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 shadow-inner">
              <TrendingUp size={18} className="text-emerald-400" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              สรุปยอดขายประจำวัน
            </h2>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>อัปเดตสด Real-time</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            ภาพรวมการเติบโตยอดขาย ประจำสาขา {selectedBranch} • ดูสถิติย้อนหลังและเปรียบเทียบยอดขาย
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Branch Pill Selector */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-2xl border border-indigo-900/60 backdrop-blur-md">
            <button
              onClick={() => setSelectedBranch('ทั้งหมด')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedBranch === 'ทั้งหมด'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ทุกสาขา
            </button>
            {branches.map(b => {
              const bName = b.name || b.id;
              if (!bName) return null;
              return (
                <button
                  key={bName}
                  onClick={() => setSelectedBranch(bName)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedBranch === bName
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {bName}
                </button>
              );
            })}
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-2xl border border-indigo-900/60 backdrop-blur-md">
            {[7, 14, 30].map(days => (
              <button
                key={days}
                onClick={() => setDayRange(days)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  dayRange === days
                    ? 'bg-white text-slate-900 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {days} วัน
              </button>
            ))}
          </div>

          {/* Quick link to Financials */}
          <button
            onClick={() => onNavigateToTab('financials')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-400/30 text-xs font-bold transition-all active:scale-95 shadow-sm ml-auto sm:ml-0"
            title="ดูรายงานบัญชีการเงินเต็มรูปแบบ"
          >
            <span>รายงานการเงิน</span>
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>

      {/* 📊 Key Metrics KPI Cards Row 📊 */}
      <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-6">
        {/* KPI 1: ยอดขายวันนี้ */}
        <div className="bg-slate-800/50 hover:bg-slate-800/70 p-4 sm:p-5 rounded-2xl border border-indigo-500/20 backdrop-blur-md transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ยอดขายวันนี้
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              {todayStats.orderCount} บิล
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            ฿{todayStats.total.toLocaleString()}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] sm:text-xs">
            {diffFromYesterday >= 0 ? (
              <span className="text-emerald-400 font-bold flex items-center">
                ↑ +฿{diffFromYesterday.toLocaleString()} {pctFromYesterday > 0 && `(+${pctFromYesterday}%)`}
              </span>
            ) : (
              <span className="text-rose-400 font-bold flex items-center">
                ↓ -฿{Math.abs(diffFromYesterday).toLocaleString()} ({pctFromYesterday}%)
              </span>
            )}
            <span className="text-slate-500">vs เมื่อวาน</span>
          </div>
        </div>

        {/* KPI 2: ช่องทางการชำระวันนี้ */}
        <div className="bg-slate-800/50 hover:bg-slate-800/70 p-4 sm:p-5 rounded-2xl border border-indigo-500/20 backdrop-blur-md transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-400">ช่องทางชำระวันนี้</span>
            <span className="text-[10px] text-indigo-300 font-bold">
              โอน / เงินสด{todayStats.shopee > 0 ? ' / Shopee' : ''}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg sm:text-xl font-black text-cyan-300">
              ฿{todayStats.transfer.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">โอนเงิน</span>
          </div>
          {/* Mini progress bar */}
          <div className="w-full bg-slate-700/60 rounded-full h-1.5 my-2 overflow-hidden flex">
            {todayStats.total > 0 ? (
              <>
                <div 
                  className="bg-cyan-400 h-full rounded-l-full" 
                  style={{ width: `${Math.round((todayStats.transfer / todayStats.total) * 100)}%` }} 
                />
                <div 
                  className="bg-emerald-400 h-full" 
                  style={{ width: `${Math.round((todayStats.cash / todayStats.total) * 100)}%` }} 
                />
                {todayStats.shopee > 0 && (
                  <div 
                    className="bg-orange-500 h-full rounded-r-full" 
                    style={{ width: `${Math.round((todayStats.shopee / todayStats.total) * 100)}%` }} 
                  />
                )}
              </>
            ) : (
              <div className="w-full bg-slate-700" />
            )}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-1">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              โอน {todayStats.total > 0 ? Math.round((todayStats.transfer / todayStats.total) * 100) : 0}%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              สด ฿{todayStats.cash.toLocaleString()}
            </span>
            {todayStats.shopee > 0 && (
              <span className="flex items-center gap-1 text-orange-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                Shopee ฿{todayStats.shopee.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* KPI 3: ยอดสะสมเดือนนี้ (MTD) - ยอดจาก POS คู่กับ ยอด Shopee และ ยอดส่งยอด */}
        <div className="bg-slate-800/50 hover:bg-slate-800/70 p-3.5 sm:p-5 rounded-2xl border border-indigo-500/20 backdrop-blur-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Store size={14} className="text-purple-400" />
                ยอดสะสมเดือนนี้ (MTD)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                {new Date().toLocaleDateString('th-TH', { month: 'short' })}
              </span>
            </div>

            {/* แถบคู่ / สามแถว: ยอดจาก POS หน้าร้าน, ยอด Shopee, ยอดส่งยอด */}
            <div className="space-y-1.5 sm:space-y-2">
              {/* บรรทัด 1: ยอดจาก POS */}
              <div className="flex items-center justify-between bg-slate-900/70 px-2.5 py-1.5 sm:py-2 rounded-xl border border-cyan-500/30">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-xs shadow-cyan-400/50" />
                  <span className="text-[11px] sm:text-xs font-bold text-cyan-300">
                    {mtdShopeeTotal > 0 ? 'ยอด POS (หน้าร้าน)' : 'ยอด POS'}
                  </span>
                </div>
                <div className="text-right flex items-baseline gap-1">
                  <span className="text-base sm:text-lg font-black text-white tracking-tight">
                    ฿{(mtdShopeeTotal > 0 ? mtdInStorePosTotal : mtdPosTotal).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    ({mtdShopeeTotal > 0 ? mtdInStorePosOrdersCount : mtdPosOrdersCount} บิล)
                  </span>
                </div>
              </div>

              {/* บรรทัด 2: ยอด Shopee (ช้อปปี้) */}
              <div className="flex items-center justify-between bg-slate-900/70 px-2.5 py-1.5 sm:py-2 rounded-xl border border-orange-500/30">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-500 shadow-xs shadow-orange-500/50" />
                  <span className="text-[11px] sm:text-xs font-bold text-orange-400">ยอด Shopee</span>
                </div>
                <div className="text-right flex items-baseline gap-1">
                  <span className="text-base sm:text-lg font-black text-orange-200 tracking-tight">
                    ฿{mtdShopeeTotal.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    ({mtdShopeeOrdersCount} บิล)
                  </span>
                </div>
              </div>

              {/* บรรทัด 3: ยอดส่งยอด (EOD) */}
              <div className="flex items-center justify-between bg-slate-900/70 px-2.5 py-1.5 sm:py-2 rounded-xl border border-purple-500/30">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-400 shadow-xs shadow-purple-400/50" />
                  <span className="text-[11px] sm:text-xs font-bold text-purple-300">ยอดส่งยอด</span>
                </div>
                <div className="text-right flex items-baseline gap-1">
                  <span className="text-base sm:text-lg font-black text-purple-200 tracking-tight">
                    ฿{mtdEodTotal.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    ({mtdEodDaysCount} วัน)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ส่วนท้าย: เปรียบเทียบส่วนต่าง และเฉลี่ยต่อวัน */}
          <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-1">
            <span className="flex items-center gap-1">
              {Math.abs(inStoreDiff) === 0 ? (
                <span className="text-emerald-400 font-bold">✓ หน้าร้านตรงกับส่งยอด</span>
              ) : Math.abs(inStoreDiff) < 100 ? (
                <span className="text-emerald-400 font-bold">✓ ยอดตรงกัน (ต่าง ฿{Math.abs(inStoreDiff).toLocaleString()})</span>
              ) : (
                <span className={`font-semibold ${inStoreDiff > 0 ? 'text-amber-300' : 'text-rose-400'}`}>
                  ต่างกัน: ฿{Math.abs(inStoreDiff).toLocaleString()}
                </span>
              )}
            </span>
            <span className="text-slate-300 font-medium">
              เฉลี่ย: <strong className="text-white">฿{Math.round((mtdPosTotal || mtdEodTotal) / (mtdDaysCount || 1)).toLocaleString()}</strong>/วัน
            </span>
          </div>
        </div>

        {/* KPI 4: วันที่ขายดีที่สุดในรอบช่วงเวลา */}
        <div className="bg-slate-800/50 hover:bg-slate-800/70 p-4 sm:p-5 rounded-2xl border border-indigo-500/20 backdrop-blur-md transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
              <Award size={13} className="text-amber-400" />
              ยอดสูงสุดในรอบ {dayRange} วัน
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
              Peak
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight">
            ฿{peakDay.total.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] sm:text-xs text-slate-400 truncate">
            {peakDay.date || 'ไม่มีข้อมูล'}
          </div>
        </div>
      </div>

      {/* 📈 Interactive High-Tech SVG Chart 📈 */}
      <div className="relative z-10 bg-slate-950/70 rounded-2xl border border-indigo-800/30 p-4 sm:p-6 backdrop-blur-md">
        {/* Chart Header Info / Tooltip Active Display */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-indigo-900/40">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span className="text-xs font-bold text-slate-400">
              รายละเอียดวันที่เลือก:
            </span>
            {activeDay && (
              <span className="text-xs sm:text-sm font-black text-white px-2 py-0.5 rounded-lg bg-indigo-900/70 border border-indigo-700/50">
                {activeDay.fullLabel} {activeDay.isToday && '🔥 (วันนี้)'}
              </span>
            )}
          </div>

          {activeDay && (
            <div className="flex items-center gap-2 sm:gap-3 text-xs font-bold flex-wrap">
              <span className="text-emerald-400">
                ยอดขาย: ฿{activeDay.total.toLocaleString()}
              </span>
              <span className="text-cyan-300 bg-cyan-950/50 px-2 py-0.5 rounded-lg border border-cyan-500/30 text-[11px]">
                POS: ฿{(activeDay.posTotal ?? activeDay.total).toLocaleString()} ({activeDay.orderCount} บิล)
              </span>
              {activeDay.shopeeTotal > 0 && (
                <span className="text-orange-300 bg-orange-950/50 px-2 py-0.5 rounded-lg border border-orange-500/30 text-[11px]">
                  Shopee: ฿{activeDay.shopeeTotal.toLocaleString()} ({activeDay.shopeeOrderCount} บิล)
                </span>
              )}
              {activeDay.isSubmitted ? (
                <span className="text-purple-300 bg-purple-950/50 px-2 py-0.5 rounded-lg border border-purple-500/30 text-[11px]">
                  ส่งยอด: ฿{(activeDay.eodTotal || 0).toLocaleString()} ✓
                </span>
              ) : (
                <span className="text-amber-300/80 text-[11px] font-normal">
                  (ยังไม่ได้ส่งยอด)
                </span>
              )}
              <span className="text-cyan-400">
                โอน: ฿{activeDay.transfer.toLocaleString()}
              </span>
              <span className="text-emerald-300">
                สด: ฿{activeDay.cash.toLocaleString()}
              </span>
              <button
                onClick={() => setPreviewModalDate(activeDay.dateStr)}
                className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-950/40 active:scale-95 transition-all cursor-pointer border border-emerald-400/40 ml-1"
                title="คลิกดูหน้าพรีวิวสรุปยอด (A4) ประจำวันนี้"
              >
                <FileText size={13} />
                <span>พรีวิวยอด A4</span>
              </button>
            </div>
          )}
        </div>

        {/* SVG Viewport */}
        <div className="w-full relative overflow-hidden">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-44 sm:h-56 overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              {/* Normal Bar Gradient */}
              <linearGradient id="barGradNormal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.4" />
              </linearGradient>

              {/* Peak Bar Gradient */}
              <linearGradient id="barGradPeak" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="1" />
                <stop offset="100%" stopColor="#d97706" stopOpacity="0.5" />
              </linearGradient>

              {/* Today Bar Gradient */}
              <linearGradient id="barGradToday" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity="1" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.6" />
              </linearGradient>

              {/* Hover Glow Filter */}
              <filter id="barGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Grid Lines */}
            {[0.25, 0.5, 0.75, 1.0].map((ratio, idx) => {
              const yPos = chartPaddingTop + usableHeight * (1 - ratio);
              const gridVal = Math.round(maxChartVal * ratio);
              return (
                <g key={idx}>
                  <line
                    x1={chartPaddingLeft}
                    y1={yPos}
                    x2={svgWidth - chartPaddingRight}
                    y2={yPos}
                    stroke="#312e81"
                    strokeWidth="1"
                    strokeDasharray="4 6"
                    opacity="0.45"
                  />
                  <text
                    x={svgWidth - chartPaddingRight - 4}
                    y={yPos - 4}
                    fill="#6366f1"
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="end"
                    opacity="0.75"
                  >
                    ฿{gridVal >= 1000 ? `${Math.round(gridVal / 1000)}k` : gridVal}
                  </text>
                </g>
              );
            })}

            {/* Average Reference Line */}
            {avgPerDayInPeriod > 0 && (
              (() => {
                const avgRatio = Math.min(1, avgPerDayInPeriod / maxChartVal);
                const avgY = chartPaddingTop + usableHeight * (1 - avgRatio);
                return (
                  <g>
                    <line
                      x1={chartPaddingLeft}
                      y1={avgY}
                      x2={svgWidth - chartPaddingRight}
                      y2={avgY}
                      stroke="#fbbf24"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                      opacity="0.75"
                    />
                    <text
                      x={chartPaddingLeft + 6}
                      y={avgY - 4}
                      fill="#fbbf24"
                      fontSize="9"
                      fontWeight="bold"
                      opacity="0.9"
                    >
                      --- ค่าเฉลี่ย ฿{avgPerDayInPeriod.toLocaleString()}/วัน
                    </text>
                  </g>
                );
              })()
            )}

            {/* Bars & Labels */}
            {chartData.map((d, idx) => {
              const xCenter = chartPaddingLeft + (idx + 0.5) * barSpacing;
              const xPos = xCenter - barWidth / 2;
              const barRatio = maxChartVal > 0 ? Math.min(1, d.total / maxChartVal) : 0;
              const computedHeight = usableHeight * barRatio;
              const barHeight = Math.max(d.total > 0 ? 6 : 2, computedHeight);
              const yPos = chartPaddingTop + (usableHeight - barHeight);

              const isPeak = d.total === peakDay.total && d.total > 0;
              const isToday = d.isToday;
              const isHovered = hoveredDay?.dateStr === d.dateStr;

              let fillGrad = 'url(#barGradNormal)';
              if (isToday) fillGrad = 'url(#barGradToday)';
              else if (isPeak) fillGrad = 'url(#barGradPeak)';

              return (
                <g 
                  key={d.dateStr} 
                  className="cursor-pointer group"
                  onMouseEnter={() => setHoveredDay(d)}
                  onMouseLeave={() => setHoveredDay(null)}
                  onClick={() => {
                    setHoveredDay(d);
                    setPreviewModalDate(d.dateStr);
                  }}
                >
                  {/* Invisible wide hitbox for easy mouse/touch targeting */}
                  <rect
                    x={xCenter - barSpacing / 2}
                    y={chartPaddingTop}
                    width={barSpacing}
                    height={usableHeight + chartPaddingBottom}
                    fill="transparent"
                  />

                  {/* Highlight column background on hover */}
                  {isHovered && (
                    <rect
                      x={xCenter - barSpacing / 2 + 2}
                      y={chartPaddingTop}
                      width={barSpacing - 4}
                      height={usableHeight}
                      fill="#6366f1"
                      fillOpacity="0.1"
                      rx="6"
                    />
                  )}

                  {/* The Main Bar */}
                  <rect
                    x={xPos}
                    y={yPos}
                    width={barWidth}
                    height={barHeight}
                    rx={Math.min(6, barWidth / 2)}
                    fill={fillGrad}
                    stroke={isToday ? '#6ee7b7' : isPeak ? '#fde68a' : isHovered ? '#ffffff' : 'none'}
                    strokeWidth={isToday ? 2 : isHovered ? 1.5 : 0}
                    filter={isToday || isHovered ? 'url(#barGlow)' : undefined}
                    className="transition-all duration-200"
                  />

                  {/* Star or crown for peak day */}
                  {isPeak && d.total > 0 && (
                    <circle
                      cx={xCenter}
                      cy={yPos - 6}
                      r="3"
                      fill="#f59e0b"
                      className="animate-pulse"
                    />
                  )}

                  {/* Pulsing indicator on top of Today's bar */}
                  {isToday && (
                    <g>
                      <circle
                        cx={xCenter}
                        cy={yPos - 6}
                        r="3.5"
                        fill="#34d399"
                        className="animate-ping"
                      />
                      <circle
                        cx={xCenter}
                        cy={yPos - 6}
                        r="3"
                        fill="#34d399"
                      />
                    </g>
                  )}

                  {/* X-axis Label: Date Number & Day Name */}
                  <text
                    x={xCenter}
                    y={svgHeight - chartPaddingBottom + 16}
                    textAnchor="middle"
                    fontSize={barCount > 20 ? '8' : '10'}
                    fontWeight={isToday ? '900' : '600'}
                    fill={isToday ? '#34d399' : isHovered ? '#ffffff' : '#94a3b8'}
                  >
                    {d.dayNum}
                  </text>
                  
                  {barCount <= 14 && (
                    <text
                      x={xCenter}
                      y={svgHeight - chartPaddingBottom + 27}
                      textAnchor="middle"
                      fontSize="8"
                      fontWeight={isToday ? 'bold' : 'normal'}
                      fill={isToday ? '#6ee7b7' : '#64748b'}
                    >
                      {d.dayName}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Bottom Legend */}
        <div className="flex items-center justify-between text-xs text-slate-400 mt-4 pt-3 border-t border-indigo-900/40 flex-wrap gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-indigo-500" />
              <span>ยอดขายปกติ</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-400" />
              <span className="text-emerald-300 font-bold">วันนี้ (Live)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-400" />
              <span className="text-amber-300 font-bold">ยอดสูงสุด</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-amber-400" />
              <span>เส้นเฉลี่ย</span>
            </span>
          </div>

          <div className="text-[11px] text-teal-300 font-semibold flex items-center gap-1">
            <span>แตะหรือคลิกที่แท่งกราฟเพื่อดูพรีวิวใบสรุปยอด (A4)</span>
          </div>
        </div>
      </div>

      {/* 📄 Daily Sales A4 Preview Modal 📄 */}
      <DailySalesPreviewModal
        isOpen={Boolean(previewModalDate)}
        onClose={() => setPreviewModalDate(null)}
        dateIso={previewModalDate || ''}
        orders={orders}
        dailySales={dailySales}
        branch={selectedBranch === 'ทั้งหมด' ? (globalBranch || 'เฉวง') : selectedBranch}
      />
    </div>
  );
}

