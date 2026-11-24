import React, { useState, useEffect } from 'react';
import { X, Trash2, AlertTriangle, CheckCircle, ShieldCheck, Calendar, Store, Loader2, RefreshCw } from 'lucide-react';
import { getDocs, writeBatch, doc } from 'firebase/firestore';
import { db, getCol } from '../config/firebase';
import { getLocalYYYYMMDD, normalizeBranchName } from '../utils/parse';

export default function ClearMonthlyPosSalesModal({
  isOpen,
  onClose,
  globalBranch = '',
  branches = [],
  showToast,
  onSuccess
}) {
  const [selectedMonth, setSelectedMonth] = useState(getLocalYYYYMMDD().substring(0, 7)); // YYYY-MM
  const [selectedBranch, setSelectedBranch] = useState(globalBranch || 'ทั้งหมด');
  const [confirmInput, setConfirmInput] = useState('');
  const [isInspecting, setIsInspecting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewCounts, setPreviewCounts] = useState({
    orders: 0,
    histories: 0,
    serviceLogs: 0,
    courses: 0
  });

  // Calculate month name in Thai
  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const [yearStr, monthStr] = (selectedMonth || '').split('-');
  const displayMonthName = monthStr ? `${monthNames[parseInt(monthStr, 10) - 1]} ${parseInt(yearStr, 10) + 543}` : selectedMonth;

  // Inspect data count when modal opens or filter changes
  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;

    const inspectData = async () => {
      setIsInspecting(true);
      try {
        const [ordersSnap, historiesSnap, serviceLogsSnap, coursesSnap] = await Promise.all([
          getDocs(getCol('orders')),
          getDocs(getCol('histories')),
          getDocs(getCol('service_logs')),
          getDocs(getCol('courses'))
        ]);

        if (isCancelled) return;

        // 1. Orders
        const targetOrders = ordersSnap.docs.filter(d => {
          const data = d.data();
          if (data.source && data.source !== 'POS' && data.source !== 'SHOPEE') return false;
          const created = data.createdAt || '';
          const dStr = getLocalYYYYMMDD(created);
          if (!dStr || !dStr.startsWith(selectedMonth)) return false;
          if (selectedBranch && selectedBranch !== 'ทั้งหมด' && normalizeBranchName(selectedBranch) !== 'สำนักงานใหญ่') {
            if (normalizeBranchName(data.branch) !== normalizeBranchName(selectedBranch)) return false;
          }
          return true;
        });

        const targetOrderNos = new Set();
        targetOrders.forEach(d => {
          const data = d.data();
          if (data.orderNo) targetOrderNos.add(data.orderNo);
        });

        // 2. Histories
        const targetHistories = historiesSnap.docs.filter(d => {
          const data = d.data();
          const orderNo = data.หมายเลขคำสั่งซื้อ || data.orderNo || data.อ้างอิง || '';
          if (orderNo && targetOrderNos.has(orderNo)) return true;
          const hDate = data.วันที่ || data.date || data.createdAt || '';
          const dStr = getLocalYYYYMMDD(hDate);
          if (dStr && dStr.startsWith(selectedMonth)) {
            const isPos = (data.source === 'POS' || orderNo.startsWith('ORD-') || orderNo.startsWith('POS-'));
            if (isPos) {
              if (selectedBranch && selectedBranch !== 'ทั้งหมด' && normalizeBranchName(selectedBranch) !== 'สำนักงานใหญ่') {
                if (normalizeBranchName(data.สาขา || data.branch) !== normalizeBranchName(selectedBranch)) return false;
              }
              return true;
            }
          }
          return false;
        });

        // 3. Service Logs
        const targetServiceLogs = serviceLogsSnap.docs.filter(d => {
          const data = d.data();
          const note = String(data.note || '');
          if (!note.startsWith('POS:')) return false;
          const sDate = data.date || getLocalYYYYMMDD(data.createdAt) || '';
          if (!sDate.startsWith(selectedMonth)) return false;
          if (selectedBranch && selectedBranch !== 'ทั้งหมด' && normalizeBranchName(selectedBranch) !== 'สำนักงานใหญ่') {
            if (normalizeBranchName(data.branch) !== normalizeBranchName(selectedBranch)) return false;
          }
          return true;
        });

        // 4. Courses
        const targetCourses = coursesSnap.docs.filter(d => {
          const data = d.data();
          const orderNo = data.หมายเลขคำสั่งซื้อ || data.orderNo || '';
          return orderNo && targetOrderNos.has(orderNo);
        });

        setPreviewCounts({
          orders: targetOrders.length,
          histories: targetHistories.length,
          serviceLogs: targetServiceLogs.length,
          courses: targetCourses.length
        });
      } catch (err) {
        console.error('Error inspecting monthly POS sales:', err);
      }
      if (!isCancelled) setIsInspecting(false);
    };

    inspectData();
    return () => { isCancelled = true; };
  }, [isOpen, selectedMonth, selectedBranch]);

  const handleExecuteClear = async (e) => {
    e.preventDefault();
    if (confirmInput.trim().toUpperCase() !== 'CONFIRM') {
      if (showToast) showToast('กรุณาพิมพ์คำว่า CONFIRM เพื่อยืนยัน', 'error');
      else alert('กรุณาพิมพ์คำว่า CONFIRM เพื่อยืนยัน');
      return;
    }

    setIsDeleting(true);
    try {
      // 1. Fetch collections
      const [ordersSnap, historiesSnap, serviceLogsSnap, coursesSnap] = await Promise.all([
        getDocs(getCol('orders')),
        getDocs(getCol('histories')),
        getDocs(getCol('service_logs')),
        getDocs(getCol('courses'))
      ]);

      // 2. Identify target orders
      const targetOrders = ordersSnap.docs.filter(d => {
        const data = d.data();
        if (data.source && data.source !== 'POS' && data.source !== 'SHOPEE') return false;
        const created = data.createdAt || '';
        const dStr = getLocalYYYYMMDD(created);
        if (!dStr || !dStr.startsWith(selectedMonth)) return false;
        if (selectedBranch && selectedBranch !== 'ทั้งหมด' && normalizeBranchName(selectedBranch) !== 'สำนักงานใหญ่') {
          if (normalizeBranchName(data.branch) !== normalizeBranchName(selectedBranch)) return false;
        }
        return true;
      });

      const targetOrderNos = new Set();
      targetOrders.forEach(d => {
        const data = d.data();
        if (data.orderNo) targetOrderNos.add(data.orderNo);
      });

      // 3. Identify target histories
      const targetHistories = historiesSnap.docs.filter(d => {
        const data = d.data();
        const orderNo = data.หมายเลขคำสั่งซื้อ || data.orderNo || data.อ้างอิง || '';
        if (orderNo && targetOrderNos.has(orderNo)) return true;
        const hDate = data.วันที่ || data.date || data.createdAt || '';
        const dStr = getLocalYYYYMMDD(hDate);
        if (dStr && dStr.startsWith(selectedMonth)) {
          const isPos = (data.source === 'POS' || orderNo.startsWith('ORD-') || orderNo.startsWith('POS-'));
          if (isPos) {
            if (selectedBranch && selectedBranch !== 'ทั้งหมด' && normalizeBranchName(selectedBranch) !== 'สำนักงานใหญ่') {
              if (normalizeBranchName(data.สาขา || data.branch) !== normalizeBranchName(selectedBranch)) return false;
            }
            return true;
          }
        }
        return false;
      });

      // 4. Identify target service logs
      const targetServiceLogs = serviceLogsSnap.docs.filter(d => {
        const data = d.data();
        const note = String(data.note || '');
        if (!note.startsWith('POS:')) return false;
        const sDate = data.date || getLocalYYYYMMDD(data.createdAt) || '';
        if (!sDate.startsWith(selectedMonth)) return false;
        if (selectedBranch && selectedBranch !== 'ทั้งหมด' && normalizeBranchName(selectedBranch) !== 'สำนักงานใหญ่') {
          if (normalizeBranchName(data.branch) !== normalizeBranchName(selectedBranch)) return false;
        }
        return true;
      });

      // 5. Identify target courses
      const targetCourses = coursesSnap.docs.filter(d => {
        const data = d.data();
        const orderNo = data.หมายเลขคำสั่งซื้อ || data.orderNo || '';
        return orderNo && targetOrderNos.has(orderNo);
      });

      // 6. Gather all doc references to delete
      // 🔒 IMPORTANT: daily_sales (การส่งยอด) is NEVER touched!
      const docsToDelete = [
        ...targetOrders.map(d => d.ref),
        ...targetHistories.map(d => d.ref),
        ...targetServiceLogs.map(d => d.ref),
        ...targetCourses.map(d => d.ref),
      ];

      if (docsToDelete.length === 0) {
        if (showToast) showToast('ไม่พบข้อมูลการขาย POS ในเดือนนี้ที่ต้องล้าง', 'info');
        else alert('ไม่พบข้อมูลการขาย POS ในเดือนนี้ที่ต้องล้าง');
        setIsDeleting(false);
        return;
      }

      // 7. Delete in batches of 400
      let batch = writeBatch(db);
      let count = 0;
      for (const docRef of docsToDelete) {
        batch.delete(docRef);
        count++;
        if (count === 400) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }
      if (count > 0) {
        await batch.commit();
      }

      const msg = `ล้างข้อมูลการขาย POS ประจำเดือน ${displayMonthName} เรียบร้อยแล้ว (ลบ ${targetOrders.length} บิล, ${targetHistories.length} ประวัติ, ${targetServiceLogs.length} ค่ามือ)`;
      if (showToast) showToast(msg, 'success');
      else alert(msg);

      setConfirmInput('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error clearing monthly POS sales:', err);
      if (showToast) showToast('เกิดข้อผิดพลาดในการล้างข้อมูล: ' + err.message, 'error');
      else alert('เกิดข้อผิดพลาดในการล้างข้อมูล: ' + err.message);
    }
    setIsDeleting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden flex flex-col relative" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-5 px-6 border-b border-rose-100 bg-gradient-to-r from-rose-50 to-orange-50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-200 shrink-0">
              <Trash2 size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-800 leading-tight">
                ล้างข้อมูลการขาย POS เดือนนี้
              </h3>
              <p className="text-xs text-rose-600 font-bold">เพื่อเตรียมระบบสำหรับเริ่มใช้งานจริง</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            disabled={isDeleting}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-white/80 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleExecuteClear} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          
          {/* Guaranteed Safe Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-start gap-3">
            <ShieldCheck size={22} className="text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-black text-emerald-900">การส่งยอดประจำวัน (EOD) ปลอดภัย 100%</p>
              <p className="text-emerald-700 font-medium mt-0.5">
                ระบบจะล้างเฉพาะบิลขายทดสอบใน POS เท่านั้น <strong>ไม่รวมข้อมูลการส่งยอดประจำวัน (Daily Sales)</strong> ประวัติการส่งยอดเดิมจะยังคงอยู่ครบถ้วน
              </p>
            </div>
          </div>

          {/* Month & Branch Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1.5">
                <Calendar size={14} className="text-indigo-500" /> เลือกเดือนที่ต้องการล้าง
              </label>
              <input 
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                disabled={isDeleting}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1.5">
                <Store size={14} className="text-indigo-500" /> สาขา
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                disabled={isDeleting}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-indigo-500"
              >
                <option value="ทั้งหมด">ทุกสาขา</option>
                {branches && branches.length > 0 ? (
                  branches.map(b => (
                    <option key={b.name || b.id || b} value={b.name || b}>{b.name || b}</option>
                  ))
                ) : (
                  <>
                    <option value="เฉวง">เฉวง</option>
                    <option value="ละไม">ละไม</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Summary Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-xs font-black text-slate-700">
                รายการที่จะถูกลบในเดือน {displayMonthName}:
              </span>
              {isInspecting && (
                <span className="text-[10px] text-indigo-600 font-bold flex items-center gap-1 animate-pulse">
                  <RefreshCw size={10} className="animate-spin" /> กำลังตรวจสอบข้อมูล...
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
                <div className="text-[10px] font-bold text-slate-500">บิลขาย POS</div>
                <div className="text-base font-black text-rose-600 mt-0.5">{previewCounts.orders.toLocaleString()}</div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
                <div className="text-[10px] font-bold text-slate-500">ประวัติขาย</div>
                <div className="text-base font-black text-orange-600 mt-0.5">{previewCounts.histories.toLocaleString()}</div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
                <div className="text-[10px] font-bold text-slate-500">ค่ามือที่ผูกบิล</div>
                <div className="text-base font-black text-pink-600 mt-0.5">{previewCounts.serviceLogs.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Warning and Confirmation Field */}
          <div className="bg-rose-50/60 border border-rose-100 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-rose-700 font-black text-xs mb-1.5">
              <AlertTriangle size={15} /> คำเตือน: ข้อมูลที่ถูกลบจะไม่สามารถกู้คืนได้
            </div>
            <p className="text-[11px] text-slate-600 font-medium mb-3">
              กรุณาพิมพ์คำว่า <span className="font-black text-rose-700 bg-white px-1.5 py-0.5 rounded border border-rose-200">CONFIRM</span> ในช่องด้านล่างเพื่อยืนยันการลบ
            </p>
            <input 
              type="text"
              required
              placeholder="พิมพ์ CONFIRM เพื่อยืนยัน"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              disabled={isDeleting}
              className="w-full bg-white border border-rose-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-rose-500 text-center tracking-wider"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-sm transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={confirmInput.trim().toUpperCase() !== 'CONFIRM' || isDeleting}
              className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:text-slate-500 text-white rounded-2xl font-bold text-sm shadow-md shadow-rose-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isDeleting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> กำลังล้างข้อมูล...
                </>
              ) : (
                <>
                  <Trash2 size={16} /> ยืนยันล้างข้อมูล POS
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
