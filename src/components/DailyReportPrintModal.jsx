import React, { useRef, useState, useEffect, useMemo } from 'react';
import { X, Printer, Store, Download } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { toPng } from 'html-to-image';

export default function DailyReportPrintModal({ isOpen, onClose, dateStr, filterMode, filterBranch, branchOptions = [], stats, expenses }) {
  const printRef = useRef();
  const [localBranch, setLocalBranch] = useState(filterBranch || 'ทั้งหมด');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalBranch(filterBranch || 'ทั้งหมด');
    }
  }, [isOpen, filterBranch]);

  const reportTitle = filterMode === 'month' ? 'รายงานสรุปยอดรายเดือน' : 'รายงานสรุปยอดรายวัน';

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${reportTitle}_${dateStr}_${localBranch}`,
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
        link.download = `${reportTitle}_${dateStr}_${localBranch}.png`;
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
  // Derive display values based on localBranch
  // For simplicity, we could recalculate or just use the global stats if localBranch === filterBranch
  // However, since stats are calculated globally based on `filterBranch`, it's safer to enforce that localBranch 
  // only allows printing what is currently shown on the dashboard, OR we filter the transactions here.
  // Given `stats` is already passed and contains the filtered totals for `filterBranch`, 
  // let's just use `stats` and lock the branch to `filterBranch` for consistency, 
  // or recalculate if they change the branch.
  
  // Since recalculating the whole dashboard stats inside this modal is complex, 
  // let's remove the local branch selector here and just print the currently viewed branch, 
  // as the user should filter on the dashboard first before clicking "Print".

  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    if (filterMode === 'month') {
       return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long' });
    }
    return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const currentExpenses = expenses.filter(ex => {
    const exDate = ex.date ? ex.date.split('T')[0] : '';
    const matchDate = exDate === dateStr;
    const matchBranch = filterBranch === 'ทั้งหมด' || ex.branch === filterBranch;
    return matchDate && matchBranch;
  });

  const eodData = (stats?.filteredDailySales || []).reduce((acc, curr) => {
    acc.cashSales += Number(curr.cashSales || 0);
    acc.transferSales += Number(curr.transferSales || 0);
    acc.codSales += Number(curr.codSales || 0);
    acc.onlineSales += Number(curr.onlineSales || 0);
    acc.creditSales += Number(curr.creditSales || 0);
    acc.remitAmount += Number(curr.remitAmount || 0);
    acc.totalDeposit += Number(curr.totalDeposit || 0);
    
    // Fix: EOD totalSales in database was generated from histories, which may differ from orders.
    // Sum up the breakdown explicitly to ensure "Total Sales" matches the rows below it.
    acc.totalSales = acc.cashSales + acc.transferSales + acc.codSales + acc.onlineSales + acc.creditSales;
    return acc;
  }, { totalSales: 0, cashSales: 0, transferSales: 0, codSales: 0, onlineSales: 0, creditSales: 0, remitAmount: 0, totalDeposit: 0 });

  const systemEodData = useMemo(() => {
    let cash = 0, transfer = 0, cod = 0, online = 0, credit = 0, totalSales = 0;
    (stats?.filteredOrders || []).forEach(o => {
      const isOldPO = (o.courseName || '').includes('[ซื้อเข้า') || (o.courseName || '').includes('[เบิกจาก');
      if (o.transactionType === 'owner_purchase' || o.transactionType === 'branch_requisition' || isOldPO || o.status === 'ยกเลิก') return;

      const p = Number(o.price) || 0;
      totalSales += p;

      const paymentStr = String(o.paymentMethod || '');
      let currentCod = 0;

      if (paymentStr.includes('เงินสด:')) {
         const match = paymentStr.match(/เงินสด:\s*([\d.]+)/);
         if (match) cash += parseFloat(match[1]);
      }
      if (paymentStr.includes('โอนเงิน:')) {
         const match = paymentStr.match(/โอนเงิน:\s*([\d.]+)/);
         if (match) transfer += parseFloat(match[1]);
      }
      if (paymentStr.includes('ค้าง/COD:')) {
         const match = paymentStr.match(/ค้าง\/COD:\s*([\d.]+)/);
         if (match) currentCod += parseFloat(match[1]);
      }
      if (paymentStr === 'เงินสด') cash += p;
      if (paymentStr === 'โอนเงิน') transfer += p;
      if (paymentStr === 'ค้าง/COD') currentCod += p;
      if (paymentStr === 'บัตรเครดิต') credit += p;
      
      if (currentCod > 0) {
          cod += currentCod;
          if (o.orderChannel === 'shopee') {
              online += currentCod;
          }
      }
    });

    const expectedCash = cash + 1000;
    const nonCashSales = transfer + cod + credit;
    const expectedTotalSystemBalance = expectedCash + nonCashSales;
    const expectedTheoreticalDeposit = Math.floor(expectedTotalSystemBalance / 100) * 100 - 1000;
    const expectedNextDayFloat = expectedTotalSystemBalance - expectedTheoreticalDeposit;
    const expectedRemitAmount = expectedCash - expectedNextDayFloat;
    
    return {
      totalSales,
      cashSales: cash,
      transferSales: transfer,
      codSales: cod - online,
      onlineSales: online,
      expectedRemitAmount: expectedRemitAmount
    };
  }, [stats?.filteredOrders]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center p-4 sm:p-6 ${isDownloading ? 'items-start overflow-auto z-[200]' : 'items-center z-[100]'}`}>
      <div className={`bg-white rounded-3xl shadow-2xl w-full flex flex-col overflow-hidden transition-all ${isDownloading ? 'max-h-none min-w-max w-fit' : 'max-h-[90vh] max-w-4xl'}`}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between bg-slate-50/50 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Printer size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">พรีวิว{reportTitle}</h2>
              <div className="text-sm font-medium text-slate-500">{filterMode === 'month' ? 'ประจำเดือน' : 'ประจำวันที่'} {formatDate(dateStr)} (สาขา: {filterBranch})</div>
            </div>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button onClick={handleDownloadImage} disabled={isDownloading} className={`px-4 py-2 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2 ${isDownloading ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
              <Download size={16} /> {isDownloading ? 'กำลังสร้างรูป...' : 'บันทึกรูป'}
            </button>
            <button onClick={handlePrint} disabled={isDownloading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2">
              <Printer size={16} /> พิมพ์รายงาน
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content Preview */}
        <div className={`flex-1 bg-slate-100 p-4 sm:p-8 ${isDownloading ? 'overflow-visible' : 'overflow-y-auto overflow-x-auto'}`}>
          <div ref={printRef} className={`bg-white p-8 mx-auto shadow-sm print:shadow-none print:p-0 ${isDownloading ? 'w-max min-w-max' : 'max-w-3xl'}`}>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-slate-800 mb-2">{reportTitle}</h1>
              <div className="text-lg text-slate-600 font-medium">{filterMode === 'month' ? 'ประจำเดือน' : 'ประจำวันที่'} {formatDate(dateStr)}</div>
              <div className="text-slate-500 mt-1">สาขา: {filterBranch}</div>
            </div>

            <div className="space-y-6">
              <section>
                <h3 className="text-lg font-bold text-slate-800 mb-3 bg-slate-100 p-2 rounded-lg">1. สรุปยอดขาย (รายรับ)</h3>
                <table className="w-full text-sm border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="border border-slate-300 p-2 text-left w-1/2">รายการ</th>
                      <th className="border border-slate-300 p-2 text-right">ยอดในระบบ (ล่าสุด)</th>
                      <th className="border border-slate-300 p-2 text-right text-emerald-700 bg-emerald-50">ยอดแจ้งส่ง (ตอนปิดยอด)</th>
                    </tr>
                  </thead>
                  <tbody>

                    <tr>
                      <td className="border border-slate-300 p-2 pl-6 text-slate-600">เงินสด</td>
                      <td className="border border-slate-300 p-2 text-right">฿{systemEodData.cashSales.toLocaleString()}</td>
                      <td className="border border-slate-300 p-2 text-right text-emerald-700 bg-emerald-50">฿{eodData.cashSales.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2 pl-6 text-slate-600">เงินโอน</td>
                      <td className="border border-slate-300 p-2 text-right">฿{systemEodData.transferSales.toLocaleString()}</td>
                      <td className="border border-slate-300 p-2 text-right text-emerald-700 bg-emerald-50">฿{eodData.transferSales.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2 pl-6 text-slate-600 font-bold">ยอดค้าง / COD (รวมออนไลน์)</td>
                      <td className="border border-slate-300 p-2 text-right font-bold text-slate-700">฿{(systemEodData.codSales + systemEodData.onlineSales).toLocaleString()}</td>
                      <td className="border border-slate-300 p-2 text-right font-bold text-emerald-700 bg-emerald-50">฿{(eodData.codSales + eodData.onlineSales).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2 pl-10 text-xs text-slate-500">└ เฉพาะช้อปปี้ / ออนไลน์ (ยอดย่อย)</td>
                      <td className="border border-slate-300 p-2 text-right text-xs text-slate-500">฿{systemEodData.onlineSales.toLocaleString()}</td>
                      <td className="border border-slate-300 p-2 text-right text-xs text-emerald-600 bg-emerald-50/50">฿{eodData.onlineSales.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2 font-bold text-amber-700 bg-amber-50">ยอดรวมทั้งสิ้น (ยอดขายระบบ / ยอดรับจริง)</td>
                      <td className="border border-slate-300 p-2 text-right font-black text-amber-700 bg-amber-50">฿{systemEodData.totalSales.toLocaleString()}</td>
                      <td className="border border-slate-300 p-2 text-right font-black text-emerald-700 bg-emerald-50">฿{eodData.totalDeposit.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </section>

              {/* Costs & Profits Section */}
              <section>
                <h3 className="text-lg font-bold text-slate-800 mb-3 bg-slate-100 p-2 rounded-lg">2. สรุปต้นทุนและกำไร</h3>
                <table className="w-full text-sm border-collapse border border-slate-300">
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 p-2 w-1/2 font-medium">ต้นทุนขาย (COGS)</td>
                      <td className="border border-slate-300 p-2 text-right font-medium text-rose-600">฿{(stats?.totalCOGS || 0).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2 font-bold text-emerald-700">กำไรเบื้องต้น (Gross Profit)</td>
                      <td className="border border-slate-300 p-2 text-right font-bold text-emerald-700">฿{((stats?.totalSales || 0) - (stats?.totalCOGS || 0)).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </section>

              {/* Expenses Section */}
              <section>
                <h3 className="text-lg font-bold text-slate-800 mb-3 bg-slate-100 p-2 rounded-lg">3. ค่าใช้จ่ายจิปาถะ (OPEX)</h3>
                {currentExpenses.length > 0 ? (
                  <table className="w-full text-sm border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="border border-slate-300 p-2 text-left">หมวดหมู่</th>
                        <th className="border border-slate-300 p-2 text-left">รายละเอียด</th>
                        <th className="border border-slate-300 p-2 text-right">จำนวนเงิน</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentExpenses.map(ex => (
                        <tr key={ex.id}>
                          <td className="border border-slate-300 p-2">{ex.category}</td>
                          <td className="border border-slate-300 p-2">{ex.note || '-'}</td>
                          <td className="border border-slate-300 p-2 text-right">฿{Number(ex.amount || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tbody>
                      <tr>
                        <td colSpan="2" className="border border-slate-300 p-2 text-right font-bold">รวมค่าใช้จ่าย</td>
                        <td className="border border-slate-300 p-2 text-right font-bold text-rose-600">
                          ฿{currentExpenses.reduce((sum, ex) => sum + Number(ex.amount || 0), 0).toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <div className="border border-slate-300 p-4 text-center text-slate-500 rounded-lg">ไม่มีค่าใช้จ่ายบันทึกในวันนี้</div>
                )}
              </section>

              {/* Net Profit Section */}
              <section className="mt-8 border-t-2 border-slate-800 pt-4">
                <table className="w-full text-lg border-collapse">
                  <tbody>
                    <tr>
                      <td className="p-2 w-1/2 font-black text-slate-800">กำไรสุทธิ (Net Profit)</td>
                      <td className={`p-2 text-right font-black ${(stats?.totalNet || 0) >= 0 ? 'text-indigo-800' : 'text-rose-700'}`}>
                        {(stats?.totalNet || 0) < 0 ? '-' : ''}฿{Math.abs(stats?.totalNet || 0).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className="text-xs text-slate-400 mt-2 text-right">
                  * กำไรสุทธิ = กำไรเบื้องต้น - ค่าใช้จ่าย OPEX (รวมเงินเดือน พาร์ทไทม์ และ PO ที่บันทึก)
                </div>
              </section>

            </div>
            
            <div className="mt-12 text-xs text-slate-400 text-right">
              พิมพ์เมื่อ: {new Date().toLocaleString('th-TH')}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
