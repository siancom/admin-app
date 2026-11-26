import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FileText, CheckCircle, X, Download, Printer, Store, Calendar, ArrowLeft } from 'lucide-react';
import html2canvas from 'html2canvas';
import { parseNumber, normalizeBranchName, parseThaiDate, getLocalYYYYMMDD } from '../utils/parse';
import { getFuzzyKey } from '../utils/fuzzy';

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

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
    if (trimmed.includes('T')) {
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) return getLocalYYYYMMDD(d);
    }
    const parsed = parseThaiDate(trimmed);
    if (parsed) return getLocalYYYYMMDD(parsed);
    const fallback = new Date(trimmed);
    return isNaN(fallback.getTime()) ? '' : getLocalYYYYMMDD(fallback);
  }
  return '';
};

const UNPAID_ORDER_STATUSES = ['รอชำระเงิน', 'รอตรวจสอบ', 'รอตรวจสอบยอดโอน', 'รอดำเนินการ', 'รอประเมินราคา', 'ยกเลิก', 'cancelled'];

const isOrderCompletedForRevenue = (o) => {
  if (!o || o.isCancelled || o.source === 'POS_Parked' || o.mergedIntoPosOrderNo) return false;
  const isReq = o.transactionType === 'branch_requisition' || (o.courseName || '').includes('[เบิกจาก');
  const isPO = o.transactionType === 'owner_purchase' || (o.courseName || '').includes('[ซื้อเข้า');
  if (isReq || isPO) return false;
  const rawStatus = String(getFuzzyKey(o, ['status', 'สถานะ']) || '').trim();
  if (rawStatus && UNPAID_ORDER_STATUSES.some(s => rawStatus.toLowerCase().includes(s.toLowerCase()))) return false;
  if (o.source === 'POS') return true;
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

export default function DailySalesPreviewModal({
  isOpen = false,
  onClose = () => {},
  dateIso = '',
  orders = [],
  dailySales = [],
  branch = 'เฉวง',
  employees = []
}) {
  const [isSavingImage, setIsSavingImage] = useState(false);

  // Parse Date Info
  const thaiDateLabel = useMemo(() => {
    if (!dateIso) return '';
    const [y, m, d] = dateIso.split('-').map(Number);
    const thaiYear = y + 543;
    const monthName = THAI_MONTHS_FULL[m - 1] || '';
    return `${d} ${monthName} ${thaiYear}`;
  }, [dateIso]);

  // Compute day's financial summary
  const summary = useMemo(() => {
    if (!isOpen || !dateIso) {
      return null;
    }

    const normTargetBranch = normalizeBranchName(branch || 'เฉวง');

    // 1. Filter orders matching date and branch
    const dayOrders = orders.filter(o => {
      if (!isOrderCompletedForRevenue(o)) return false;
      if (branch && branch !== 'ทั้งหมด') {
        const oBranch = normalizeBranchName(o.branch || 'เฉวง');
        if (oBranch !== normTargetBranch) return false;
      }
      const oDateIso = extractIsoDate(o.createdAt || o.date || o['วันที่']);
      return oDateIso === dateIso;
    });

    // 2. Find matching EOD record
    const dayEod = dailySales.find(ds => {
      if (branch && branch !== 'ทั้งหมด') {
        const dsBranch = normalizeBranchName(ds.branch || 'เฉวง');
        if (dsBranch !== normTargetBranch) return false;
      }
      const dsDateIso = extractIsoDate(ds.date) || extractIsoDate(ds.createdAt);
      return dsDateIso === dateIso;
    });

    // 3. Breakdown calculations
    let productSalesAmt = 0;
    let courseSalesAmt = 0;
    let manualSalesAmt = 0;
    let creditSalesAmt = 0;
    let codSalesAmt = 0;
    let cashSalesAmt = 0;
    let transferSalesAmt = 0;
    const allSalesDetails = [];

    dayOrders.forEach((o, idx) => {
      const orderTotal = parseNumber(o.price ?? o.total ?? o.totalPrice ?? o.netPrice ?? 0);
      const paymentStr = String(o.paymentMethod || o.method || '').trim();
      const isOwnerZeroPay = paymentStr.includes('สิทธิ์เจ้าของ') || (o.price === '0' && o.courseName);
      
      // Breakdown items
      let pSum = 0;
      let cSum = 0;
      let mSum = 0;
      let tItems = [];

      if (o.cartItems && Array.isArray(o.cartItems) && o.cartItems.length > 0) {
        let rawPSum = 0;
        let rawMSum = 0;
        let totalRaw = 0;
        tItems = o.cartItems.map(item => ({ name: item.name, qty: item.qty || 1 }));
        o.cartItems.forEach(item => {
          const lineTotal = parseNumber(item.price) * parseNumber(item.qty || 1);
          totalRaw += lineTotal;
          if (item.type === 'service') rawMSum += lineTotal;
          else if (item.type !== 'course' && item.type !== 'debt_payment' && item.type !== 'usage') rawPSum += lineTotal;
        });
        if (totalRaw > 0) {
          pSum = orderTotal * (rawPSum / totalRaw);
          mSum = orderTotal * (rawMSum / totalRaw);
        } else if (rawPSum > 0) {
          pSum = orderTotal;
        }
        cSum = Math.max(0, orderTotal - pSum - mSum);
      } else if (o.courseName) {
        tItems = [{ name: o.courseName, qty: parseNumber(o.qty || 1) }];
        cSum = orderTotal;
      } else {
        tItems = [{ name: 'สินค้า/บริการ', qty: 1 }];
        pSum = orderTotal;
      }

      productSalesAmt += pSum;
      courseSalesAmt += cSum;
      manualSalesAmt += mSum;

      // Payment breakdowns
      if (paymentStr.includes('เงินสด:')) {
        const m = paymentStr.match(/เงินสด:\s*([\d.]+)/);
        if (m) cashSalesAmt += parseFloat(m[1]);
      } else if (paymentStr.toLowerCase() === 'cash' || paymentStr.includes('เงินสด')) {
        cashSalesAmt += orderTotal;
      }

      if (paymentStr.includes('โอนเงิน:')) {
        const m = paymentStr.match(/โอนเงิน:\s*([\d.]+)/);
        if (m) transferSalesAmt += parseFloat(m[1]);
      } else if (paymentStr.toLowerCase() === 'transfer' || paymentStr.includes('โอน') || paymentStr.includes('qr')) {
        transferSalesAmt += orderTotal;
      }

      if (paymentStr.includes('ตัดเครดิต:') || paymentStr.includes('เครดิต:')) {
        const m = paymentStr.match(/(?:ตัดเครดิต|เครดิต):\s*([\d.]+)/);
        if (m) creditSalesAmt += parseFloat(m[1]);
      } else if (paymentStr.includes('เครดิต')) {
        creditSalesAmt += orderTotal;
      }

      if (paymentStr.includes('ค้าง') || paymentStr.includes('COD')) {
        const m = paymentStr.match(/(?:ค้าง\/COD|COD):\s*([\d.]+)/);
        if (m) codSalesAmt += parseFloat(m[1]);
        else codSalesAmt += orderTotal;
      }

      // Default payment channel fallback
      if (!paymentStr.includes(':') && !paymentStr.includes('เงินสด') && !paymentStr.includes('เครดิต') && !paymentStr.includes('COD') && !isOwnerZeroPay) {
        if (transferSalesAmt === 0 && cashSalesAmt === 0) {
          transferSalesAmt += orderTotal;
        }
      }

      const timeFormatted = o.createdAt
        ? new Date(o.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
        : '-';

      allSalesDetails.push({
        id: o.id || idx,
        orderNo: o.orderNo || `POS${String(idx + 1).padStart(6, '0')}`,
        time: timeFormatted,
        customer: o.customerName || (o.isWalkIn ? 'ลูกค้าทั่วไป (Walk-in)' : 'ลูกค้าทั่วไป'),
        items: tItems,
        amount: orderTotal,
        paymentStr: paymentStr || (isOwnerZeroPay ? 'สิทธิ์เจ้าของร้าน (ตรวจเช็คฟรี)' : 'โอนเงิน')
      });
    });

    // If EOD is submitted, use its submitted values as official record if orders are zero
    const finalProductSales = productSalesAmt > 0 ? productSalesAmt : parseNumber(dayEod?.productSales || 0);
    const finalCourseSales = (courseSalesAmt + manualSalesAmt) > 0 ? (courseSalesAmt + manualSalesAmt) : parseNumber(dayEod?.courseSales || 0);
    const finalCreditSales = creditSalesAmt > 0 ? creditSalesAmt : parseNumber(dayEod?.creditSales || 0);
    const finalCodSales = codSalesAmt > 0 ? codSalesAmt : parseNumber(dayEod?.codSales || 0);
    const finalCashSales = cashSalesAmt > 0 ? cashSalesAmt : parseNumber(dayEod?.cashSales || 0);
    const finalTransferSales = transferSalesAmt > 0 ? transferSalesAmt : parseNumber(dayEod?.transferSales || 0);

    const totalNetSales = finalProductSales + finalCourseSales + finalCreditSales + finalCodSales;

    // Cash flow metrics
    const floatCash = dayEod ? parseNumber(dayEod.floatCash || 0) : 1153;
    const cashTotalInDrawer = finalCashSales + floatCash;
    const nonCashSales = finalTransferSales + finalCreditSales + finalCodSales;
    const totalSystemBalance = cashTotalInDrawer + nonCashSales;

    const baseFloat = Math.floor(floatCash / 100) * 100;
    const totalTheoreticalDeposit = dayEod?.totalDeposit !== undefined
      ? parseNumber(dayEod.totalDeposit)
      : Math.floor(totalSystemBalance / 100) * 100 - baseFloat;

    const remitAmount = dayEod?.remitAmount !== undefined
      ? parseNumber(dayEod.remitAmount)
      : (dayEod?.actualCash !== undefined ? parseNumber(dayEod.actualCash) : finalCashSales);

    const nextDayFloat = dayEod?.nextDayFloat !== undefined
      ? parseNumber(dayEod.nextDayFloat)
      : totalSystemBalance - totalTheoreticalDeposit;

    return {
      productSalesAmt: finalProductSales,
      courseSalesAmt: finalCourseSales,
      creditSalesAmt: finalCreditSales,
      codSalesAmt: finalCodSales,
      totalNetSales,
      floatCash,
      cashSalesAmt: finalCashSales,
      cashTotalInDrawer,
      nonCashSales,
      totalSystemBalance,
      totalTheoreticalDeposit,
      remitAmount,
      nextDayFloat,
      allSalesDetails,
      isEodSubmitted: Boolean(dayEod),
      submittedByName: dayEod?.submittedByName || dayEod?.submittedBy || ''
    };
  }, [isOpen, dateIso, orders, dailySales, branch]);

  if (!isOpen || !dateIso || !summary) return null;

  const handleSaveImage = () => {
    const printArea = document.getElementById('daily-sales-a4-preview-content');
    if (!printArea) return;
    setIsSavingImage(true);
    html2canvas(printArea, { scale: 2, useCORS: true }).then(canvas => {
      const link = document.createElement('a');
      link.download = `รายงานสรุปยอด_${thaiDateLabel.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setIsSavingImage(false);
    }).catch(err => {
      console.error('Error saving image:', err);
      setIsSavingImage(false);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div id="pos-print-area" className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm overflow-y-auto flex flex-col print:block print:bg-white print:static print:z-auto print:overflow-visible">
      {/* Top Floating Control Bar */}
      <div className="sticky top-0 z-[10000] bg-slate-900 border-b border-indigo-900/80 shadow-2xl p-4 flex flex-wrap justify-between items-center gap-3 print:hidden text-white">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="ย้อนกลับ"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="bg-teal-500/20 text-teal-400 p-2 rounded-xl border border-teal-500/30">
            <FileText size={22} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              พรีวิวรายงานสรุปยอดประจำวัน (A4)
              {summary.isEodSubmitted && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  ปิดยอดแล้ว ✓
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              วันที่ {thaiDateLabel} • สาขา {branch || 'เฉวง'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <button 
            onClick={handleSaveImage}
            disabled={isSavingImage}
            className={`px-4 sm:px-5 py-2 rounded-xl font-bold flex items-center gap-2 shadow-md transition-all text-xs sm:text-sm ${
              isSavingImage 
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30 active:scale-95'
            }`}
          >
            {isSavingImage ? (
              <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span> กำลังบันทึก...</>
            ) : (
              <><Download size={16} /> บันทึกเป็นรูปภาพ</>
            )}
          </button>

          <button 
            onClick={handlePrint}
            className="px-4 sm:px-5 py-2 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-md shadow-indigo-900/30 transition-all active:scale-95 text-xs sm:text-sm"
          >
            <Printer size={16} /> สั่งพิมพ์ (A4)
          </button>

          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl font-bold transition-colors text-xs sm:text-sm border border-slate-700"
          >
            ปิด
          </button>
        </div>
      </div>

      {/* A4 Sheet Viewport Container */}
      <div className="flex-1 py-8 sm:py-12 flex justify-center print:py-0 print:block">
        <div 
          id="daily-sales-a4-preview-content" 
          className="block shadow-2xl print:shadow-none print:block w-[210mm] min-h-[297mm] max-w-[210mm] text-black font-sans bg-white m-0 p-10 text-sm leading-tight mx-auto rounded-none print:m-0"
        >
          {/* Header */}
          <div className="text-center mb-8 border-b-2 border-slate-800 pb-4">
            <h1 className="font-bold text-3xl mb-2 tracking-tight">รายงานสรุปยอดประจำวัน</h1>
            <h2 className="font-semibold text-lg text-slate-600">สาขา {branch || 'เฉวง'}</h2>
          </div>

          <div className="flex justify-between mb-8 text-base">
            <div>
              <p><span className="font-bold">วันที่:</span> {thaiDateLabel}</p>
            </div>
            {summary.submittedByName && (
              <div className="text-right text-slate-600 text-sm">
                <span className="font-bold">ผู้ส่งยอด:</span> {summary.submittedByName}
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* 1. สรุปยอดขายแยกตามประเภท */}
            <div>
              <h3 className="font-bold text-lg mb-3 bg-slate-100 p-2 border-l-4 border-slate-800">
                สรุปยอดขายแยกตามประเภท
              </h3>
              <table className="w-full text-base border-collapse border border-slate-300">
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-3 w-2/3">ยอดขายสินค้า</td>
                    <td className="border border-slate-300 p-3 text-right font-bold">
                      ฿{summary.productSalesAmt.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-3">ยอดขายคอร์ส/บริการ</td>
                    <td className="border border-slate-300 p-3 text-right font-bold">
                      ฿{summary.courseSalesAmt.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-3">ยอดใช้เครดิต/ตัดคอร์ส</td>
                    <td className="border border-slate-300 p-3 text-right font-bold">
                      ฿{summary.creditSalesAmt.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-3">ยอดค้างชำระ / COD</td>
                    <td className="border border-slate-300 p-3 text-right font-bold text-rose-600">
                      ฿{summary.codSalesAmt.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-slate-50 font-bold text-lg">
                    <td className="border border-slate-300 p-3 text-right">รวมยอดขายสุทธิทั้งหมด</td>
                    <td className="border border-slate-300 p-3 text-right text-indigo-700">
                      ฿{summary.totalNetSales.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 2. สรุปกระแสเงินสด (Cash Flow) */}
            <div className="mt-6 break-inside-avoid">
              <h3 className="font-bold text-lg mb-3 bg-slate-100 p-2 border-l-4 border-slate-800">
                สรุปกระแสเงินสด (Cash Flow)
              </h3>
              <table className="w-full text-base border-collapse border border-slate-300">
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-3 w-2/3">เงินทอนตั้งต้น (นับตอนเปิดร้าน)</td>
                    <td className="border border-slate-300 p-3 text-right font-bold text-slate-600">
                      ฿{summary.floatCash.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-3">ยอดรับเงินสด (ในระบบ)</td>
                    <td className="border border-slate-300 p-3 text-right font-bold text-emerald-600">
                      + ฿{summary.cashSalesAmt.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-slate-50 font-bold text-lg">
                    <td className="border border-slate-300 p-3 w-2/3">ยอดรวมเงินสดในลิ้นชัก (รวมเงินทอน)</td>
                    <td className="border border-slate-300 p-3 text-right font-bold text-emerald-600">
                      ฿{summary.cashTotalInDrawer.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-3">ยอดขายช่องทางอื่น (โอน/เครดิต/COD)</td>
                    <td className="border border-slate-300 p-3 text-right font-bold text-blue-600">
                      ฿{summary.nonCashSales.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-slate-50 font-bold text-lg">
                    <td className="border border-slate-300 p-3 text-right">ยอดรวมสุทธิทั้งระบบ</td>
                    <td className="border border-slate-300 p-3 text-right text-indigo-700">
                      ฿{summary.totalSystemBalance.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-3">ยอดรวมที่ต้องฝากธนาคารทั้งหมด (ปัดเศษหลักร้อย)</td>
                    <td className="border border-slate-300 p-3 text-right font-bold text-slate-700">
                      ฿{summary.totalTheoreticalDeposit.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-3 text-rose-600">ยอดส่งเงินสดจริง (หักยอดโอน/เครดิต/COD)</td>
                    <td className="border border-slate-300 p-3 text-right font-bold text-rose-600">
                      - ฿{summary.remitAmount.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-slate-50 font-bold text-lg">
                    <td className="border border-slate-300 p-3 text-right">ยอดเหลือ / เงินทอนยกไปพรุ่งนี้</td>
                    <td className="border border-slate-300 p-3 text-right text-indigo-700">
                      ฿{summary.nextDayFloat.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 3. รายการขาย / ใช้บริการทั้งหมด */}
            <div className="mt-8 break-inside-avoid">
              <h3 className="font-bold text-lg mb-3 bg-slate-100 p-2 border-l-4 border-slate-800">
                รายการขาย / ใช้บริการทั้งหมด ({summary.allSalesDetails.length} รายการ)
              </h3>
              {summary.allSalesDetails.length === 0 ? (
                <div className="p-6 text-center text-slate-400 border border-slate-200 rounded-lg italic">
                  ไม่มีรายการขายหรือใช้บริการในวันนี้
                </div>
              ) : (
                <table className="w-full text-xs border-collapse border border-slate-300">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="border border-slate-300 p-2 text-center w-12">ลำดับ</th>
                      <th className="border border-slate-300 p-2 text-center w-20">เวลา</th>
                      <th className="border border-slate-300 p-2 text-left w-36">ลูกค้า</th>
                      <th className="border border-slate-300 p-2 text-left">รายการ</th>
                      <th className="border border-slate-300 p-2 text-right w-24">ยอดเงิน</th>
                      <th className="border border-slate-300 p-2 text-center w-28">ช่องทาง</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.allSalesDetails.map((t, idx) => (
                      <tr key={t.id || idx}>
                        <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                        <td className="border border-slate-300 p-2 text-center leading-tight">
                          <div className="font-bold">{t.time}</div>
                          <div className="text-[9px] text-slate-500 mt-0.5">{t.orderNo}</div>
                        </td>
                        <td className="border border-slate-300 p-2 font-medium">{t.customer}</td>
                        <td className="border border-slate-300 p-2">
                          {Array.isArray(t.items) ? (
                            <ul className="list-disc list-inside space-y-0.5">
                              {t.items.map((item, i) => (
                                <li key={i} className="text-xs">
                                  {item.name} <span className="text-slate-500 font-semibold ml-1">x{item.qty}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span>{t.items}</span>
                          )}
                        </td>
                        <td className="border border-slate-300 p-2 text-right font-bold">
                          {t.amount > 0 ? `฿${t.amount.toLocaleString()}` : '-'}
                        </td>
                        <td className="border border-slate-300 p-2 text-center">
                          <span className="text-[11px] font-semibold text-slate-700">
                            {t.paymentStr}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Signature Section */}
            <div className="mt-16 pt-8 break-inside-avoid">
              <div className="grid grid-cols-2 gap-12 text-center">
                <div>
                  <p className="mb-10 text-slate-400 font-light">( ............................................................ )</p>
                  <p className="font-bold text-slate-800">ผู้สรุปยอด / พนักงาน</p>
                </div>
                <div>
                  <p className="mb-10 text-slate-400 font-light">( ............................................................ )</p>
                  <p className="font-bold text-slate-800">ผู้ตรวจสอบ / ผู้รับเงิน</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
