import React, { useState, useEffect } from 'react';
import { X, Search, FileText, AlertCircle, Trash2, Clock, CheckCircle, DollarSign, Banknote, Smartphone, CreditCard, Package, Truck, Wallet, Camera } from 'lucide-react';
import { query, where, orderBy, getDocs, doc, writeBatch, getDoc, limit } from 'firebase/firestore';
import { db, getCol } from '../config/firebase';
import { getBranchStock } from '../utils/parse';
import BarcodeScannerModal from './BarcodeScannerModal';
import { sendOrderLineNotification } from '../utils/lineUtils';

export default function SalesHistoryModal({ 
  isOpen, onClose, showToast, globalBranch,
  appSettings, currentMonthSales, todaySales, todaySalesBreakdown, setShowEodModal, setShowEodPreviewA4,
  posFilterDate, setPosFilterDate, globalRole, onPrintReceipt, eodData, setEodData
}) {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('sales');
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadOrders = async () => {
      if (!isOpen) return;
      setIsLoading(true);
      try {
        const q = query(
          getCol('orders'),
          orderBy('createdAt', 'desc'),
          limit(300)
        );
        
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        let filtered = data.filter(o => o.source === 'POS');
        
        if (globalBranch && globalBranch !== 'สำนักงานใหญ่') {
          filtered = filtered.filter(o => o.branch === globalBranch);
        }
          
        if (isMounted) setOrders(filtered);
      } catch (err) {
        console.error(err);
        if (isMounted) showToast('ไม่สามารถโหลดประวัติการขายได้', 'error');
      }
      if (isMounted) setIsLoading(false);
    };

    loadOrders();
    
    return () => { isMounted = false; };
  }, [isOpen, globalBranch, showToast]);

  const fetchOrders = async () => {
      if (!isOpen) return;
      setIsLoading(true);
      try {
        const q = query(
          getCol('orders'),
          orderBy('createdAt', 'desc'),
          limit(300)
        );
        
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        let filtered = data.filter(o => o.source === 'POS');
        
        if (globalBranch && globalBranch !== 'สำนักงานใหญ่') {
          filtered = filtered.filter(o => o.branch === globalBranch);
        }
          
        setOrders(filtered);
      } catch (err) {
        console.error(err);
        showToast('ไม่สามารถโหลดประวัติการขายได้', 'error');
      }
      setIsLoading(false);
  };

  const handleCancelBill = async (order) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการยกเลิกบิล ${order.orderNo}?\n(การกระทำนี้จะคืนสต๊อกและสิทธิ์คอร์สที่ถูกหักไป)`)) return;
    
    setCancellingId(order.id);
    try {
      const batch = writeBatch(db);
      
      const orderRef = doc(getCol('orders'), order.id);
      batch.update(orderRef, { status: 'ยกเลิก' });
      
      if (order.cartItems && Array.isArray(order.cartItems)) {
        for (const item of order.cartItems) {
          if (item.type === 'product' && item.id) {
            const prodRef = doc(getCol('products'), item.id);
            const prodSnap = await getDoc(prodRef);
            if (prodSnap.exists()) {
              const prodData = prodSnap.data();
              const targetBranch = order.branch || globalBranch || 'เฉวง';
              const currentBranchStock = getBranchStock(prodData, targetBranch);
              const newStock = currentBranchStock + item.qty;
              
              const currentStockByBranch = prodData?.stock_by_branch || {};
              const newStockByBranch = { ...currentStockByBranch, [targetBranch]: newStock };
              
              batch.set(prodRef, { stock_by_branch: newStockByBranch }, { merge: true });
            }
          } else if (item.type === 'usage' && item.id) {
             const courseRef = doc(getCol('courses'), item.id);
             const courseSnap = await getDoc(courseRef);
             if (courseSnap.exists()) {
                const cData = courseSnap.data();
                const currentUsed = Number(cData['ครั้งที่ใช้'] || 0);
                const currentRemain = Number(cData['ครั้งที่เหลือดิบ'] || 0);
                
                const newUsed = Math.max(0, currentUsed - item.qty);
                const newRemain = currentRemain + item.qty;
                
                batch.update(courseRef, {
                  "ครั้งที่ใช้": String(newUsed),
                  "ครั้งที่เหลือดิบ": String(newRemain)
                });
             }
          }
        }
      }

      if (order.orderNo) {
        const histQuery = query(getCol('histories'), where('หมายเลขคำสั่งซื้อ', '==', order.orderNo));
        const histSnap = await getDocs(histQuery);
        histSnap.docs.forEach(docSnap => {
           batch.update(doc(getCol('histories'), docSnap.id), { "สถานะ": "ยกเลิก" });
        });

        const coursesQuery = query(getCol('courses'), where('หมายเลขคำสั่งซื้อ', '==', order.orderNo));
        const coursesSnap = await getDocs(coursesQuery);
        coursesSnap.docs.forEach(docSnap => {
           batch.update(doc(getCol('courses'), docSnap.id), { "สถานะ": "ยกเลิก" });
        });
      }

      await batch.commit();

      // Send LINE notification for cancellation
      try {
        const cleanPhone = (p) => String(p || '').replace(/\D/g, '');
        const targetPhone = cleanPhone(order.customerPhone);
        
        if (targetPhone.length > 5) { // Ensure it's a valid phone
          const custSnap = await getDocs(getCol('customers'));
          const targetCustomer = custSnap.docs.map(d => ({id: d.id, ...d.data()}))
            .find(c => cleanPhone(c.computedPhone || c["เบอร์โทร"] || c.col_3) === targetPhone);
          
          if (targetCustomer && targetCustomer.lineUid) {
             await sendOrderLineNotification(order, 'ยกเลิก', targetCustomer.lineUid);
             showToast(`ส่งแจ้งเตือนยกเลิกไปที่ LINE ลูกค้าสำเร็จ`);
          } else {
             console.warn("No LINE UID found for this customer phone:", targetPhone);
          }
        }
      } catch (err) {
        console.error("Failed to send cancel notification", err);
      }

      showToast(`ยกเลิกบิล ${order.orderNo} สำเร็จ`, 'success');
      fetchOrders();
    } catch (err) {
      console.error(err);
      showToast('เกิดข้อผิดพลาดในการยกเลิกบิล', 'error');
    }
    setCancellingId(null);
  };

  if (!isOpen) return null;
  
  const displayedOrders = orders.filter(o => {
    // 1. Filter by view mode
    const isOldPO = (o.courseName || '').includes('[ซื้อเข้า') || (o.courseName || '').includes('[เบิกจาก');
    const isPO = o.transactionType === 'owner_purchase' || o.transactionType === 'branch_requisition' || isOldPO;
    
    if (viewMode === 'sales' && isPO) return false;
    if (viewMode === 'po' && !isPO) return false;

    // 2. Filter by search term
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (o.orderNo && String(o.orderNo).toLowerCase().includes(term)) ||
      (o.customerName && String(o.customerName).toLowerCase().includes(term)) ||
      (o.customerPhone && String(o.customerPhone).includes(term))
    );
  });

  // Calculate PO Totals
  const posFilterDateObj = new Date();
  if (posFilterDate) {
    const [y, m, d] = posFilterDate.split('-');
    posFilterDateObj.setFullYear(y, m - 1, d);
  }
  const today = posFilterDateObj.toLocaleDateString('th-TH');
  let todayTotalPO = 0;
  let todayTotalReq = 0;
  
  orders.forEach(o => {
    const oDate = new Date(o.createdAt).toLocaleDateString('th-TH');
    if (oDate === today) {
       const isOldPO = (o.courseName || '').includes('[ซื้อเข้า') || (o.courseName || '').includes('[เบิกจาก');
       const isReq = o.transactionType === 'branch_requisition' || (o.courseName || '').includes('[เบิกจาก');
       const isPO = o.transactionType === 'owner_purchase' || (o.courseName || '').includes('[ซื้อเข้า');
       
       if (isReq) todayTotalReq += Number(o.price || 0);
       else if (isPO) todayTotalPO += Number(o.price || 0);
    }
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        </div>
        <div className="p-4 bg-white border-b border-slate-100 shadow-sm z-0 shrink-0 overflow-y-auto max-h-[40vh]">
          {/* Owner Date Filter */}
          {globalRole === 'owner' && (
            <div className="mb-4 bg-orange-50 border border-orange-100 p-3 rounded-xl flex items-center justify-between gap-4 shadow-sm">
               <div className="flex flex-col">
                 <span className="text-sm font-bold text-orange-800">วันที่สรุปยอด (เฉพาะเจ้าของ)</span>
                 <span className="text-[10px] text-orange-600 font-medium">ใช้สำหรับดูประวัติย้อนหลังและส่งยอดของวันนั้นๆ</span>
               </div>
               <input 
                 type="date"
                 value={posFilterDate}
                 onChange={(e) => setPosFilterDate(e.target.value)}
                 className="p-2 border border-orange-200 rounded-lg text-sm font-bold text-orange-800 focus:ring-2 focus:ring-orange-500 focus:outline-none"
               />
            </div>
          )}
          
          {/* Tabs */}
          <div className="flex gap-2 mb-4 bg-slate-100 p-1.5 rounded-xl">
            <button 
              onClick={() => setViewMode('sales')} 
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === 'sales' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              ประวัติยอดขาย
            </button>
            <button 
              onClick={() => setViewMode('po')} 
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === 'po' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              ประวัติสั่งซื้อ/เบิกสินค้า
            </button>
          </div>

          {viewMode === 'sales' ? (
            <>
              {/* Monthly Target Progress */}
              {(() => {
                 const branchName = globalBranch || 'สำนักงานใหญ่';
                 const cleanBranch = String(branchName).replace('สาขา', '').trim();
                 const altBranch = String(branchName).startsWith('สาขา') ? cleanBranch : `สาขา${cleanBranch}`;
                 const target = Number(appSettings?.branchTargets?.[branchName] || appSettings?.branchTargets?.[altBranch] || appSettings?.branchTargets?.[cleanBranch] || 0);
                 if (target <= 0) return null;
                 const progress = Math.min(100, (currentMonthSales / target) * 100);
                 const now = new Date();
                 const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                 const remainingDays = Math.max(1, daysInMonth - now.getDate() + 1);
                 const remainingAmount = Math.max(0, target - currentMonthSales);
                 const dailyNeeded = remainingAmount > 0 ? Math.ceil(remainingAmount / remainingDays) : 0;
                 const baseDailyTarget = Math.ceil(target / daysInMonth);
                 return (
                   <div className="mb-3 bg-gradient-to-r from-indigo-50 to-blue-50 p-3 rounded-xl border border-indigo-100 shadow-sm">
                      <div className="flex justify-between items-center mb-1.5">
                         <div className="text-xs font-bold text-indigo-800">เป้ายอดขายเดือนนี้ ({globalBranch || 'สำนักงานใหญ่'})</div>
                         <div className="text-xs font-bold text-indigo-600">
                            ฿{currentMonthSales.toLocaleString()} / ฿{target.toLocaleString()}
                         </div>
                      </div>
                      <div className="w-full bg-indigo-200/50 rounded-full h-1.5 mb-1.5 overflow-hidden">
                         <div 
                            className="bg-indigo-600 h-1.5 rounded-full transition-all duration-1000 ease-out" 
                            style={{ width: `${progress}%` }}
                         ></div>
                      </div>
                      <div className="flex flex-wrap justify-between items-center gap-1 text-[10px] text-indigo-600 font-bold">
                         <span>
                            {remainingAmount > 0
                              ? `ต้องทำเฉลี่ยอีกวันละ ฿${dailyNeeded.toLocaleString()} (ขาดอีก ฿${remainingAmount.toLocaleString()} · เหลือ ${remainingDays} วัน)`
                              : `🎉 ทะลุเป้าหมายเดือนนี้แล้ว! (เป้าเฉลี่ย ฿${baseDailyTarget.toLocaleString()}/วัน)`}
                         </span>
                         <span className="text-indigo-500 font-medium">คิดเป็น {progress.toFixed(1)}%</span>
                      </div>
                   </div>
                 );
              })()}

              {/* Unified Beautiful Sales Dashboard Banner */}
              {(() => {
                const expectedCash = (todaySalesBreakdown?.cash || 0) + (Number(String(eodData?.floatCash).replace(/,/g, '')) || 0);
                const nonCashSales = (todaySalesBreakdown?.transfer || 0) + (todaySalesBreakdown?.credit || 0) + (todaySalesBreakdown?.cod || 0);
                const actualSales = (todaySalesBreakdown?.cash || 0) + nonCashSales;
                
                const totalSystemBalance = expectedCash + nonCashSales;
                const floatCashNum = Number(String(eodData?.floatCash).replace(/,/g, '')) || 0;
                const baseFloat = Math.floor(floatCashNum / 100) * 100;
                const expectedDeposit = Math.floor(totalSystemBalance / 100) * 100 - baseFloat;
                const expectedNextDayFloat = totalSystemBalance - expectedDeposit;
                const expectedRemit = expectedCash - expectedNextDayFloat;
                
                return (
                  <div className="bg-gradient-to-br from-indigo-50 to-white p-4 sm:p-5 rounded-2xl border border-indigo-100 shadow-sm mb-4 relative overflow-hidden">
                    {/* Decorative background element */}
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="flex flex-col xl:flex-row gap-5 xl:items-center justify-between relative z-10">
                      {/* Left: Total Sales */}
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200/50 shrink-0">
                          <DollarSign size={32} strokeWidth={2.5} />
                        </div>
                        <div>
                          <div className="text-indigo-600/80 text-xs font-bold tracking-wide mb-1">ยอดขายจริงวันนี้ ({globalBranch || 'ทุกสาขา'})</div>
                          <div className="text-2xl sm:text-3xl font-black text-indigo-900 tracking-tight">฿{actualSales.toLocaleString()}</div>
                        </div>
                      </div>

                      {/* Right: Breakdowns */}
                      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 w-full xl:max-w-[500px]">
                        {/* 1. ยอดรวมฝาก */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-2 border border-indigo-100 flex flex-col items-center justify-center text-center shadow-sm">
                          <div className="text-[9px] sm:text-[10px] font-bold text-indigo-500 mb-0.5">ยอดรวมฝาก</div>
                          <div className="text-xs sm:text-sm font-black text-indigo-700">฿{expectedDeposit.toLocaleString()}</div>
                        </div>
                        {/* 2. จริงสด */}
                        <div className="bg-rose-50/80 backdrop-blur-sm rounded-xl p-2 border border-rose-100 flex flex-col items-center justify-center text-center shadow-sm">
                          <div className="text-[9px] sm:text-[10px] font-bold text-rose-500 mb-0.5">นำฝากจริง(สด)</div>
                          <div className="text-xs sm:text-sm font-black text-rose-700">฿{expectedRemit.toLocaleString()}</div>
                        </div>
                        {/* 3. ปลายทาง/ค้าง */}
                        <div className="bg-orange-50/80 backdrop-blur-sm rounded-xl p-2 border border-orange-100 flex flex-col items-center justify-center text-center shadow-sm">
                          <div className="text-[9px] sm:text-[10px] font-bold text-orange-500 mb-0.5 leading-tight">ปลายทาง/ค้าง</div>
                          <div className="text-xs sm:text-sm font-black text-orange-700">฿{((todaySalesBreakdown?.cod || 0) + (todaySalesBreakdown?.credit || 0)).toLocaleString()}</div>
                        </div>
                        {/* 4. โอนเงิน */}
                        <div className="bg-blue-50/80 backdrop-blur-sm rounded-xl p-2 border border-blue-100 flex flex-col items-center justify-center text-center shadow-sm">
                          <div className="text-[9px] sm:text-[10px] font-bold text-blue-500 mb-0.5">โอนเงิน</div>
                          <div className="text-xs sm:text-sm font-black text-blue-700">฿{(todaySalesBreakdown?.transfer || 0).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-indigo-100/60 relative z-10">
                      <button 
                        onClick={() => { 
                            const val = window.prompt("ตั้งค่าเงินทอนตั้งต้น (ยอดยกมาในลิ้นชัก):", eodData?.floatCash || "0");
                            if (val !== null && !isNaN(val)) {
                              setEodData(prev => ({...prev, floatCash: val}));
                              showToast('ตั้งค่าเงินทอนสำเร็จ', 'success');
                            }
                        }} 
                        className="flex-1 sm:flex-none px-3 py-2 bg-white text-amber-600 border border-amber-200 hover:bg-amber-50 rounded-xl text-[10px] sm:text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <Wallet size={14} /> เงินทอน: ฿{Number(String(eodData?.floatCash || 0).replace(/,/g, '')).toLocaleString()}
                      </button>
                      <button 
                        onClick={() => { onClose(); setShowEodPreviewA4(true); }} 
                        className="flex-1 sm:flex-none px-3 py-2 bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 rounded-xl text-[10px] sm:text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <FileText size={14} /> พรีวิวใบสรุปยอด
                      </button>
                      <button 
                        onClick={() => { onClose(); setShowEodModal(true); }} 
                        className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200/50 active:scale-95 flex items-center justify-center gap-2 sm:ml-auto mt-2 sm:mt-0"
                      >
                        <CheckCircle size={14} /> ส่งยอดประจำวัน (EOD)
                      </button>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">ประวัติการขาย (POS)</h2>
                  <p className="text-xs text-slate-500 font-medium">ดูประวัติบิลและยกเลิกรายการ ({globalBranch || 'สาขาทั้งหมด'})</p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* PO/Req Dashboard */}
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="bg-teal-50 p-4 rounded-xl border border-teal-100 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                      <Package size={16} />
                    </div>
                    <div className="text-teal-700 font-bold">ยอดสั่งซื้อเข้า (เฉวง) วันนี้</div>
                  </div>
                  <div className="text-2xl font-black text-teal-800">฿{todayTotalPO.toLocaleString()}</div>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                      <Truck size={16} />
                    </div>
                    <div className="text-amber-700 font-bold">ยอดเบิกสินค้าวันนี้ ({globalBranch || 'ทุกสาขา'})</div>
                  </div>
                  <div className="text-2xl font-black text-amber-800">฿{todayTotalReq.toLocaleString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center shadow-inner">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">ประวัติสั่งซื้อ/เบิกสินค้า</h2>
                  <p className="text-xs text-slate-500 font-medium">ดูประวัติใบ PO และใบเบิก ({globalBranch || 'สาขาทั้งหมด'})</p>
                </div>
              </div>
            </>
          )}

          <button onClick={onClose} className="absolute right-4 top-4 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors z-10">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="flex gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="ค้นหาเลขบิล, ชื่อ, เบอร์โทร..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-bold"
              />
            </div>
            <button 
              onClick={() => setShowScanner(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl shadow-md transition-colors flex items-center justify-center aspect-square active:scale-95"
            >
              <Camera size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p>กำลังโหลดข้อมูล...</p>
            </div>
          ) : displayedOrders.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <FileText size={48} className="mb-4 text-slate-200" />
              <p className="text-lg font-medium">ไม่พบประวัติบิล</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedOrders.map(order => {
                const isCancelled = order.status === 'ยกเลิก';
                const canCancel = !isCancelled;
                
                return (
                  <div key={order.id} className={`bg-white border rounded-2xl p-4 transition-all hover:shadow-md ${isCancelled ? 'border-red-200 bg-red-50/30 opacity-75' : 'border-slate-200 shadow-sm'}`}>
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-lg">#{order.orderNo}</span>
                          {isCancelled ? (
                            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold border border-red-200">ยกเลิกแล้ว</span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold border border-emerald-200">สำเร็จ</span>
                          )}
                          <span className="text-xs text-slate-500 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded"><Clock size={12}/> {new Date(order.createdAt).toLocaleString('th-TH')}</span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                           <div><span className="text-slate-400">ลูกค้า:</span> <span className="font-semibold">{order.customerName || '-'}</span></div>
                           <div><span className="text-slate-400">ช่องทาง:</span> <span className="font-semibold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">{order.orderChannel || 'หน้าร้าน'}</span></div>
                        </div>
                        
                        <div className="text-sm bg-slate-50 p-2 rounded-lg border border-slate-100 text-slate-600 line-clamp-2" title={order.courseName}>
                           <span className="font-semibold text-slate-700">รายการ:</span> {order.courseName}
                        </div>
                        
                        {!order.cartItems && !isCancelled && (
                            <div className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100 flex items-center gap-1 inline-flex">
                                <AlertCircle size={12} /> บิลรุ่นเก่า: หากยกเลิก สต๊อกจะไม่ถูกคืนอัตโนมัติ
                            </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end justify-between shrink-0 border-l border-slate-100 pl-4">
                         <div className="text-right mb-4">
                           <div className="text-sm text-slate-500">ยอดรวม</div>
                           <div className={`text-2xl font-black ${isCancelled ? 'text-red-500 line-through' : 'text-indigo-600'}`}>฿{Number(order.price).toLocaleString()}</div>
                           {viewMode === 'sales' && !isCancelled && order.totalCost !== undefined && (
                              <div className="text-xs font-bold text-emerald-600 mt-1 bg-emerald-50 px-2 py-0.5 rounded inline-block border border-emerald-100">
                                 กำไร: ฿{(Number(order.price) - Number(order.totalCost)).toLocaleString()}
                              </div>
                           )}
                         </div>
                         
                         <div className="flex flex-col gap-2 w-full sm:w-auto">
                           {canCancel && onPrintReceipt && (
                             <button 
                               onClick={() => onPrintReceipt(order)}
                               className="w-full sm:w-auto text-xs font-bold px-4 py-2 rounded-xl flex items-center justify-center gap-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-200 hover:border-indigo-600 transition-all shadow-sm active:scale-95"
                             >
                               <FileText size={14} /> {order.transactionType === 'owner_purchase' || order.transactionType === 'branch_requisition' || (order.courseName || '').includes('[ซื้อเข้า') || (order.courseName || '').includes('[เบิกจาก') ? 'พิมพ์ใบสั่งซื้อ/ใบเบิก' : 'พิมพ์ใบเสร็จ'}
                             </button>
                           )}
                           
                           {canCancel && (
                             <button 
                               onClick={() => handleCancelBill(order)}
                               disabled={cancellingId === order.id}
                               className={`w-full sm:w-auto text-xs font-bold px-4 py-2 rounded-xl flex items-center justify-center gap-1 transition-all shadow-sm active:scale-95 ${cancellingId === order.id ? 'bg-slate-200 text-slate-500' : 'bg-red-50 text-red-600 hover:bg-red-500 hover:text-white border border-red-200 hover:border-red-500'}`}
                             >
                               {cancellingId === order.id ? (
                                 <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-slate-500"></span>
                               ) : (
                                 <Trash2 size={14} />
                               )}
                               {cancellingId === order.id ? 'กำลังยกเลิก...' : 'ยกเลิกบิล'}
                             </button>
                           )}
                         </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      <BarcodeScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={(code) => {
          setSearchTerm(code);
          setShowScanner(false);
          showToast('อ่านบาร์โค้ดสำเร็จ', 'success');
        }}
      />
    </div>
  );
}
