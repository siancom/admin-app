import React, { useRef, useState, useEffect, useMemo } from 'react';
import { X, Printer, Store, Download } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { toPng } from 'html-to-image';

export default function MonthlyEodPrintModal({ isOpen, onClose, month, year, eods, filterBranch, branchOptions = [], orders = [], expenses = [] }) {
  const printRef = useRef();
  const [localBranch, setLocalBranch] = useState(filterBranch || 'ทั้งหมด');
  const [isDownloading, setIsDownloading] = useState(false);

  const parseNumber = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    return Number(val.toString().replace(/,/g, '')) || 0;
  };

  const getIsoDateStr = (dateInput) => {
    if (!dateInput) return '';
    if (typeof dateInput.toDate === 'function') {
        const d = dateInput.toDate();
        const tzOffset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - tzOffset).toISOString().split('T')[0];
    }
    if (typeof dateInput === 'string' && dateInput.includes('/')) {
        const parts = dateInput.split('/');
        if (parts.length === 3) {
            let [day, month, year] = parts;
            day = day.padStart(2, '0');
            month = month.padStart(2, '0');
            year = String(parseInt(year) > 2500 ? parseInt(year) - 543 : year);
            return `${year}-${month}-${day}`;
        }
    }
    try {
        const d = new Date(dateInput);
        if (!isNaN(d.getTime())) {
            const tzOffset = d.getTimezoneOffset() * 60000;
            return new Date(d.getTime() - tzOffset).toISOString().split('T')[0];
        }
    } catch(e) {}
    if (typeof dateInput === 'string' && dateInput.includes('T')) return dateInput.split('T')[0];
    return String(dateInput);
  };

  const dailyBreakdown = useMemo(() => {
     if (!orders) return {};
     const breakdown = {};
     orders.forEach(o => {
        const isOldPO = (o.courseName || '').includes('[ซื้อเข้า') || (o.courseName || '').includes('[เบิกจาก');
        if (o.transactionType === 'owner_purchase' || o.transactionType === 'branch_requisition' || isOldPO || (o.status && o.status !== 'อนุมัติแล้ว')) return;
        
        const oDate = getIsoDateStr(o.createdAt || o.วันที่);
        if (!oDate) return;
        
        if (!breakdown[oDate]) {
           breakdown[oDate] = { course: 0, cream: 0, manual: 0, cogs: 0 };
        }
        
        let orderTotal = parseNumber(o.price);
        if (o.orderChannel === 'shopee' && o.shopeeNetReceived !== undefined) {
            orderTotal = parseNumber(o.shopeeNetReceived);
        }
        
        if (o.cartItems && Array.isArray(o.cartItems) && o.cartItems.length > 0) {
            let rawPSum = 0;
            let rawMSum = 0;
            let totalRaw = 0;
            
            o.cartItems.forEach(item => {
                const lineTotal = parseNumber(item.price) * parseNumber(item.qty);
                totalRaw += lineTotal;
                
                if (item.type === 'service') {
                    rawMSum += lineTotal;
                } else if (item.type !== 'course' && item.type !== 'debt_payment' && item.type !== 'usage') {
                    rawPSum += lineTotal;
                }
            });
            
            let actualCream = 0;
            let actualManual = 0;
            
            if (totalRaw > 0) {
                actualCream = orderTotal * (rawPSum / totalRaw);
                actualManual = orderTotal * (rawMSum / totalRaw);
            } else if (rawPSum > 0) {
                actualCream = orderTotal;
            }
            
            const actualCourse = orderTotal - actualCream;
            
            breakdown[oDate].cream += actualCream;
            breakdown[oDate].course += actualCourse;
            breakdown[oDate].manual += actualManual;
        } else if (o.courseName) {
            breakdown[oDate].course += orderTotal;
        } else {
        }
        
        if (o.totalCost !== undefined) {
           breakdown[oDate].cogs += parseNumber(o.totalCost);
        }
     });
     return breakdown;
  }, [orders]);

  // Reset localBranch when filterBranch changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalBranch(filterBranch || 'ทั้งหมด');
    }
  }, [isOpen, filterBranch]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `รายงานยอดประจำเดือน_${month+1}_${year}_${localBranch}`,
  });

  const handleDownloadImage = async () => {
    if (printRef.current) {
      try {
        setIsDownloading(true);
        // Wait a bit to ensure rendering is complete
        await new Promise(r => setTimeout(r, 100));
        const dataUrl = await toPng(printRef.current, { 
          cacheBust: true,
          backgroundColor: '#ffffff',
          style: {
            margin: '0',
            padding: '20px',
            transform: 'none',
            boxShadow: 'none'
          }
        });
        const link = document.createElement('a');
        link.download = `รายงานยอดประจำเดือน_${month+1}_${year}_${localBranch}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Failed to download image', err);
        alert('เกิดข้อผิดพลาดในการบันทึกรูปภาพ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setIsDownloading(false);
      }
    }
  };

  if (!isOpen) return null;

  const filteredEods = localBranch === 'ทั้งหมด' ? eods : eods.filter(e => e.branch === localBranch);

  const monthNamesThai = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];

  const parseDateStr = (dateStr) => {
    if (!dateStr) return 0;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      let [d, m, y] = parts;
      return parseInt(y) * 10000 + parseInt(m) * 100 + parseInt(d);
    }
    return 0;
  };
  
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  
  // OPEX Expenses (excluding inventory purchases from HQ to avoid double-counting with COGS)
  const monthlyExpenses = expenses.filter(e => {
      if (localBranch !== 'ทั้งหมด' && e.branch !== localBranch) return false;
      if (e.category === 'สั่งซื้อสินค้าจากศูนย์ใหญ่') return false; 
      const eDate = getIsoDateStr(e.date || e.createdAt);
      return eDate.startsWith(monthStr);
  });
  const sumOpex = monthlyExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  
  const sumTotalSales = filteredEods.reduce((sum, e) => {
      const iso = getIsoDateStr(e.date || e.createdAt);
      const hasBd = iso in dailyBreakdown;
      const bd = dailyBreakdown[iso];
      const c = hasBd ? bd.course : (e.courseSales || 0);
      const p = hasBd ? bd.cream : (e.productSales || 0);
      const t = hasBd ? (c + p) : Number(e.totalSales || 0);
      return sum + t;
  }, 0);
  
  const sumCogs = filteredEods.reduce((sum, e) => {
      const iso = getIsoDateStr(e.date || e.createdAt);
      const hasBd = iso in dailyBreakdown;
      return sum + (hasBd ? dailyBreakdown[iso].cogs : 0);
  }, 0);
  
  const netProfit = sumTotalSales - sumCogs - sumOpex;

  return (
    <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center p-4 sm:p-6 ${isDownloading ? 'items-start overflow-auto z-[200]' : 'items-center z-[100]'}`}>
      <div className={`bg-white rounded-3xl shadow-2xl w-full flex flex-col overflow-hidden transition-all ${isDownloading ? 'max-h-none min-w-max w-fit' : 'max-h-[90vh] max-w-5xl'}`}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between bg-slate-50/50 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Printer size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">พรีวิวรายงานยอดประจำเดือน</h2>
              <div className="text-sm font-medium text-slate-500">{monthNamesThai[month]} {year + 543}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200">
              <Store size={16} className="text-slate-500" />
              <select value={localBranch} onChange={(e) => setLocalBranch(e.target.value)} className="bg-transparent border-none outline-none text-sm font-medium text-slate-700">
                {branchOptions.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <button onClick={handleDownloadImage} disabled={isDownloading} className={`px-4 py-2 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2 ${isDownloading ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
              <Download size={16} /> {isDownloading ? 'กำลังสร้างรูป...' : 'บันทึกรูป'}
            </button>
            <button onClick={handlePrint} disabled={isDownloading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2">
              <Printer size={16} /> พิมพ์ตาราง
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content Preview */}
        <div className={`flex-1 bg-slate-100 p-4 sm:p-8 ${isDownloading ? 'overflow-visible' : 'overflow-y-auto overflow-x-auto'}`}>
          <div ref={printRef} className={`bg-white p-8 mx-auto shadow-sm print:shadow-none print:p-0 ${isDownloading ? 'w-max min-w-max' : 'max-w-4xl'}`}>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2">ตารางสรุปยอดขายและนำฝากประจำเดือน</h1>
              <h2 className="text-lg font-medium text-slate-600">เดือน {monthNamesThai[month]} {year + 543} {localBranch !== 'ทั้งหมด' && `(สาขา: ${localBranch})`}</h2>
            </div>

            <table className="w-full text-sm border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-2 text-center">วันที่</th>
                  <th className="border border-slate-300 p-2 text-right">รวมยอดขาย</th>
                  <th className="border border-slate-300 p-2 text-right">ยอดคอส</th>
                  <th className="border border-slate-300 p-2 text-right">ยอดครีม</th>
                  <th className="border border-slate-300 p-2 text-right">ยอดมือ</th>
                  <th className="border border-slate-300 p-2 text-right">ยอดรับจริง (เงินสด+โอน)</th>
                  <th className="border border-slate-300 p-2 text-right">ยอดค้าง (COD/Online)</th>
                  <th className="border border-slate-300 p-2 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {[...filteredEods].sort((a,b) => parseDateStr(a.date) - parseDateStr(b.date)).map((eod, idx) => {
                  const eodIsoDate = getIsoDateStr(eod.date || eod.createdAt);
                  const hasBd = eodIsoDate in dailyBreakdown;
                  const bd = dailyBreakdown[eodIsoDate] || { course: 0, cream: 0, manual: 0 };
                  const bdCourse = hasBd ? bd.course : (eod.courseSales || 0);
                  const bdCream = hasBd ? bd.cream : (eod.productSales || 0);
                  
                  // If we have live data, it's more accurate than eod.totalSales because historical eod missed Shopee imports
                  const finalTotalSales = hasBd ? (bdCourse + bdCream) : Number(eod.totalSales || 0);
                  
                  const finalCream = bdCream;
                  const finalManual = hasBd ? bd.manual : (eod.manualSales || 0);
                  const finalCourse = finalTotalSales - finalCream;
                  return (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="border border-slate-300 p-2 text-center">{eod.date}</td>
                    <td className="border border-slate-300 p-2 text-right font-bold text-emerald-700">
                      {Math.round(finalTotalSales).toLocaleString()}
                    </td>
                    <td className="border border-slate-300 p-2 text-right text-pink-700 font-medium">{Math.round(finalCourse).toLocaleString()}</td>
                    <td className="border border-slate-300 p-2 text-right text-indigo-700 font-medium">{Math.round(finalCream).toLocaleString()}</td>
                    <td className="border border-slate-300 p-2 text-right text-amber-700 font-medium">{Math.round(finalManual).toLocaleString()}</td>
                    <td className="border border-slate-300 p-2 text-right font-medium">{Number(eod.totalDeposit || eod.expectedDeposit || 0).toLocaleString()}</td>
                    <td className="border border-slate-300 p-2 text-right text-slate-500">
                      {Number((eod.onlineSales || 0) + (eod.codSales || 0) + (eod.creditSales || 0)).toLocaleString()}
                    </td>
                    <td className="border border-slate-300 p-2 text-center text-xs">
                      {eod.status || 'รอตรวจสอบ'}
                    </td>
                  </tr>
                  );
                })}
                {filteredEods.length === 0 && (
                  <tr>
                    <td colSpan="6" className="border border-slate-300 p-4 text-center text-slate-500">ไม่มีข้อมูลการส่งยอดในเดือนนี้</td>
                  </tr>
                )}
              </tbody>
              {filteredEods.length > 0 && (
                <tbody>
                  <tr className="bg-slate-50 font-bold">
                    <td className="border border-slate-300 p-2 text-right">รวมทั้งสิ้น</td>
                    <td className="border border-slate-300 p-2 text-right text-emerald-700">
                      {Math.round(sumTotalSales).toLocaleString()}
                    </td>
                    <td className="border border-slate-300 p-2 text-right text-pink-700">
                      {Math.round(filteredEods.reduce((sum, e) => {
                          const iso = getIsoDateStr(e.date || e.createdAt);
                          const hasBd = iso in dailyBreakdown;
                          const bd = dailyBreakdown[iso];
                          const c = hasBd ? bd.course : (e.courseSales || 0);
                          const p = hasBd ? bd.cream : (e.productSales || 0);
                          const t = hasBd ? (c + p) : Number(e.totalSales || 0);
                          return sum + (t - p);
                      }, 0)).toLocaleString()}
                    </td>
                    <td className="border border-slate-300 p-2 text-right text-indigo-700">
                      {Math.round(filteredEods.reduce((sum, e) => {
                          const iso = getIsoDateStr(e.date || e.createdAt);
                          const hasBd = iso in dailyBreakdown;
                          const bd = dailyBreakdown[iso];
                          const p = hasBd ? bd.cream : (e.productSales || 0);
                          return sum + p;
                      }, 0)).toLocaleString()}
                    </td>
                    <td className="border border-slate-300 p-2 text-right text-amber-700">
                      {Math.round(filteredEods.reduce((sum, e) => {
                          const iso = getIsoDateStr(e.date || e.createdAt);
                          const hasBd = iso in dailyBreakdown;
                          const bd = dailyBreakdown[iso];
                          const m = hasBd ? bd.manual : (e.manualSales || 0);
                          return sum + m;
                      }, 0)).toLocaleString()}
                    </td>
                    <td className="border border-slate-300 p-2 text-right text-slate-700">
                      {filteredEods.reduce((sum, e) => sum + Number(e.totalDeposit || e.expectedDeposit || 0), 0).toLocaleString()}
                    </td>
                    <td className="border border-slate-300 p-2 text-right text-slate-600">
                      {filteredEods.reduce((sum, e) => sum + Number((e.onlineSales || 0) + (e.codSales || 0) + (e.creditSales || 0)), 0).toLocaleString()}
                    </td>
                    <td className="border border-slate-300 p-2"></td>
                  </tr>
                  
                  {/* COGS Row */}
                  <tr className="bg-orange-50 text-orange-700 font-bold border-t-2 border-slate-300">
                    <td className="border border-slate-300 p-2 text-right">หัก ต้นทุนสินค้าที่ขายได้ (COGS)</td>
                    <td className="border border-slate-300 p-2 text-right">
                      - {Math.round(sumCogs).toLocaleString()}
                    </td>
                    <td colSpan="6" className="border border-slate-300 p-2 text-sm font-normal text-orange-600">
                      (คำนวณจาก ต้นทุน x จำนวนสินค้าที่ขายออกไปจริงในเดือนนี้)
                    </td>
                  </tr>
                  
                  {/* Expense Row */}
                  <tr className="bg-rose-50 text-rose-700 font-bold">
                    <td className="border border-slate-300 p-2 text-right">หัก ค่าใช้จ่ายดำเนินงาน (OPEX)</td>
                    <td className="border border-slate-300 p-2 text-right">
                      - {Math.round(sumOpex).toLocaleString()}
                    </td>
                    <td colSpan="6" className="border border-slate-300 p-2 text-sm font-normal text-rose-500">
                      (ค่าใช้จ่ายประจำเดือน ไม่รวมบิลสั่งซื้อครีม/สินค้าจากศูนย์ใหญ่)
                    </td>
                  </tr>
                  
                  {/* Net Profit Row */}
                  <tr className={`font-black text-lg ${netProfit >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    <td className="border border-slate-300 p-3 text-right">กำไรสุทธิเบื้องต้น</td>
                    <td className="border border-slate-300 p-3 text-right">
                      {Math.round(netProfit).toLocaleString()}
                    </td>
                    <td colSpan="6" className="border border-slate-300 p-3 text-sm font-normal opacity-80">
                      (กำไร/ขาดทุน สุทธิหลังหักค่าใช้จ่ายทั้งหมดของเดือนนี้)
                    </td>
                  </tr>
                </tbody>
              )}
            </table>
            
            <div className="mt-8 text-xs text-slate-400 text-right">
              พิมพ์เมื่อ: {new Date().toLocaleString('th-TH')}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
