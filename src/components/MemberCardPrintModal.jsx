import React, { useRef, useState, useMemo } from 'react';
import { 
  Printer, X, CreditCard, Calendar, Plus, Trash2, QrCode, 
  Sparkles, Award, CheckCircle, FileText, Receipt, ArrowLeft,
  ShoppingBag, Layers, Phone, MapPin, Tag, ShieldCheck, Edit3
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import { getFuzzyKey } from '../utils/fuzzy';
import { parseNumber } from '../utils/parse';

export default function MemberCardPrintModal({
  isOpen,
  customer,
  products = [],
  orders = [],
  shopName = 'IrisCare Clinic',
  globalBranch = 'สาขาเฉวง',
  onClose
}) {
  const printContainerRef = useRef(null);

  // --- STATE ---
  // Print Mode: 'id_card' (บัตรประชาชน 85.6x54mm), 'foldable' (บัตรพับกระเป๋าเงิน), 'thermal' (สลิป 80mm), 'a4' (เอกสาร A4)
  const [printFormat, setPrintFormat] = useState('id_card'); 
  // Filter Mode: 'product' (เฉพาะสินค้า), 'all' (รวมคอร์สและบริการ)
  const [filterMode, setFilterMode] = useState('product'); 
  
  // Customization fields
  const [expiryText, setExpiryText] = useState('ไม่มีวันหมดอายุ');
  const [issueDate, setIssueDate] = useState(() => new Date().toLocaleDateString('th-TH'));
  const [noteText, setNoteText] = useState('สะสมยอดซื้อสินค้าครบ 5,000 บาท รับสิทธิ์อัปเกรดสมาชิก VIP ส่วนลด 10% ตลอดชีพ');
  const [branchText, setBranchText] = useState(globalBranch || 'สาขาเฉวง');
  const [blankRowsCount, setBlankRowsCount] = useState(4); // 0, 2, 4, 6, 8

  // New custom item input
  const [newItemDate, setNewItemDate] = useState(() => new Date().toLocaleDateString('th-TH'));
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [newItemRecorder, setNewItemRecorder] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);

  // Custom items added by user & excluded item IDs
  const [customItems, setCustomItems] = useState([]);
  const [excludedItemIds, setExcludedItemIds] = useState([]);
  const [manualTotalOverride, setManualTotalOverride] = useState('');
  const [isEditingTotal, setIsEditingTotal] = useState(false);

  if (!isOpen || !customer) return null;

  // --- DATA EXTRACTION ---
  const custName = customer.computedName || 'ลูกค้าทั่วไป';
  const custPhone = customer.computedPhone || '-';
  const memberStatus = customer.computedMemberStatus || 'ทั่วไป';
  const isVip = memberStatus.includes('VIP') || memberStatus.includes('บัตรทอง') || memberStatus.includes('สมาชิกพิเศษ');
  const oldAmount = Number(customer.oldAmount || 0);

  // Helper function to parse Thai/standard dates for sorting newest first
  const parseDateForSort = (dateStr) => {
    if (!dateStr || dateStr === 'ยอดยกมา' || dateStr === '-') return 0;
    try {
      const parts = String(dateStr).trim().split(/[/.-]/);
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10) || 1;
        const m = parseInt(parts[1], 10) || 1;
        let y = parseInt(parts[2], 10) || 2024;
        if (y > 2500) y -= 543;
        return new Date(y, m - 1, d).getTime();
      }
    } catch (e) {}
    return 0;
  };

  // Extract base items from customer history
  const baseItems = useMemo(() => {
    if (!customer?.myHistories) return [];
    const items = [];

    // 1. Old balance brought forward (if any)
    if (oldAmount > 0) {
      items.push({
        id: 'old_amount_row',
        date: 'ยอดยกมา',
        name: 'ยอดสะสมสินค้าเดิมยกมา',
        amount: oldAmount,
        recorder: 'ระบบ',
        type: 'old_balance',
        isProduct: true
      });
    }

    const activeHistories = customer.myHistories.filter(
      h => !(h.isCancelled || String(getFuzzyKey(h, ["สถานะ", "col_7", "col_8", "col_9"]) || '') === 'ยกเลิก')
    );

    activeHistories.forEach((h, idx) => {
      const type = String(getFuzzyKey(h, ["ประเภท", "col_4"]) || '').trim();
      const rawProduct = String(getFuzzyKey(h, ["สินค้า", "col_18", "รายการสินค้า", "รายการเบิก"]) || '').trim();
      const rawService = String(getFuzzyKey(h, ["รายการที่ทำ", "บริการ", "col_23", "รายการ"]) || '').trim();
      const rawAction = String(getFuzzyKey(h, ["รายการ", "col_23", "สินค้า", "col_18"]) || '').trim();
      const amt = parseNumber(getFuzzyKey(h, ["ยอดสินค้า", "ยอดจัดซื้อ", "ยอดเงิน", "ยอดเบิก", "ยอด", "col_19"]));
      const dateStr = String(getFuzzyKey(h, ["วันที่", "col_1"]) || '-');
      const staff = String(getFuzzyKey(h, ["พนักงาน", "ผู้ให้บริการ", "เจ้าหน้าที่", "staff"]) || '');
      const prodQty = String(getFuzzyKey(h, ["จำนวนสินค้าที่เบิก", "จำนวนเบิก", "จำนวนสินค้า"]) || '');
      const isLegacy = !h.courseId;

      // ในระบบเก่าทุกยอดคือยอดซื้อสินค้า (col_19 = ยอดสินค้า)
      // ลำดับการแสดงชื่อ: แสดงชื่อสินค้าก่อน ตามด้วยชื่อบริการ หรือการกระทำ
      const displayName = rawProduct || rawService || rawAction || (amt > 0 ? 'สินค้า' : 'รายการ');

      // ตรวจสอบการหักเงิน/จ่ายเงินคืน
      const isDeductionOrSpent = type.includes('จ่ายเงินคืน') || h.isRefund === true;

      // ในระบบเก่า (AppSheet) ทุกยอดเงินที่บันทึกไว้ในประวัติ (col_19 = ยอดสินค้า) คือยอดซื้อสินค้าทั้งหมด
      // ในระบบใหม่รวมรายการที่มีสินค้า, type สินค้า, หรือ amt > 0
      const isProduct = amt > 0 && !isDeductionOrSpent && (
        isLegacy ||
        type.includes('สินค้า') ||
        type.includes('จัดซื้อ') ||
        rawProduct.length > 0 ||
        (products && products.some(p => {
          const pName = String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2", "name"]) || '').trim();
          return pName && (displayName.includes(pName) || pName.includes(displayName));
        }))
      );

      items.push({
        id: h.id || `h_${idx}`,
        date: dateStr,
        name: displayName,
        amount: amt,
        recorder: staff || 'IRIS',
        type: isProduct ? 'product' : 'other',
        isProduct: isProduct,
        isSpent: isDeductionOrSpent,
        timestamp: parseDateForSort(dateStr)
      });
    });

    // Sort newest first, with 'ยอดยกมา' at the start if needed
    const oldBalanceItems = items.filter(i => i.type === 'old_balance');
    const normalItems = items.filter(i => i.type !== 'old_balance').sort((a, b) => b.timestamp - a.timestamp);

    return [...oldBalanceItems, ...normalItems];
  }, [customer, products, oldAmount]);

  // Combine with custom items and filter according to mode & exclusions
  const displayItems = useMemo(() => {
    const combined = [...baseItems, ...customItems];
    return combined.filter(item => {
      if (excludedItemIds.includes(item.id)) return false;
      if (filterMode === 'product') {
        return item.isProduct || item.type === 'old_balance';
      }
      return true;
    });
  }, [baseItems, customItems, excludedItemIds, filterMode]);

  // Calculate current total for this card
  const calculatedTotal = useMemo(() => {
    return displayItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [displayItems]);

  // Active total to display and print (supports manual override)
  const activeTotal = manualTotalOverride !== '' ? (parseNumber(manualTotalOverride) || 0) : calculatedTotal;

  const vipTarget = 5000;
  const progressPercent = Math.min(100, Math.round((activeTotal / vipTarget) * 100));
  const remainingToVip = Math.max(0, vipTarget - activeTotal);

  // Handle Add Item
  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    setCustomItems(prev => [
      ...prev,
      {
        id: `custom_${Date.now()}`,
        date: newItemDate || new Date().toLocaleDateString('th-TH'),
        name: newItemName.trim(),
        amount: parseNumber(newItemAmount) || 0,
        recorder: newItemRecorder.trim() || 'เจ้าหน้าที่',
        type: 'product',
        isProduct: true,
        isCustom: true
      }
    ]);
    setNewItemName('');
    setNewItemAmount('');
    setIsAddingItem(false);
  };

  // Handle Remove Item
  const handleRemoveItem = (id) => {
    setExcludedItemIds(prev => [...prev, id]);
  };

  // React to print handler
  const handlePrint = useReactToPrint({
    contentRef: printContainerRef,
    documentTitle: `บัตรสมาชิก_${custName}_${custPhone}`,
    pageStyle: `
      @page {
        size: auto;
        margin: 5mm;
      }
      @media print {
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `
  });

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900/80 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      
      {/* TOP CONTROLS BAR (Hidden on print) */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 shrink-0 flex flex-wrap items-center justify-between gap-3 shadow-sm z-10 print:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors flex items-center gap-1 text-xs font-bold"
          >
            <ArrowLeft size={16} /> ย้อนกลับ
          </button>
          <div className="h-5 w-px bg-slate-200"></div>
          <div className="flex items-center gap-1.5">
            <CreditCard size={18} className="text-teal-600" />
            <h2 className="text-sm font-black text-slate-800">
              พิมพ์บัตรสมาชิก / สะสมยอด
            </h2>
            <span className="text-xs text-slate-500 font-medium">({custName})</span>
          </div>
        </div>

        {/* PRINT FORMAT SELECTOR */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold gap-1">
          <button
            type="button"
            onClick={() => setPrintFormat('id_card')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${printFormat === 'id_card' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <CreditCard size={14} /> ขนาดบัตรประชาชน (85.6x54mm)
          </button>
          <button
            type="button"
            onClick={() => setPrintFormat('foldable')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${printFormat === 'foldable' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Layers size={14} /> บัตรพับกระเป๋าเงิน (หน้า-หลังคู่)
          </button>
          <button
            type="button"
            onClick={() => setPrintFormat('thermal')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${printFormat === 'thermal' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Receipt size={14} /> สลิป 80mm
          </button>
          <button
            type="button"
            onClick={() => setPrintFormat('a4')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${printFormat === 'a4' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <FileText size={14} /> เอกสาร A4
          </button>
        </div>

        {/* PRINT ACTION BUTTON */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-xs rounded-xl shadow-md shadow-teal-200 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Printer size={16} /> สั่งพิมพ์บัตร
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* MAIN LAYOUT: SIDEBAR CUSTOMIZER + PREVIEW */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT: EDIT & CUSTOMIZATION SIDEBAR (Hidden on print) */}
        <div className="w-80 sm:w-96 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto p-4 space-y-4 print:hidden shadow-lg z-10">
          
          {/* 1. Filter: Products vs All */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 flex items-center gap-1">
              <ShoppingBag size={14} className="text-teal-600" /> ตัวกรองรายการสะสม
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setFilterMode('product')}
                className={`py-1.5 rounded-lg transition-all text-center ${filterMode === 'product' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                🛍️ รายการสะสมสินค้า ({baseItems.filter(i => i.isProduct || i.type === 'old_balance').length + customItems.filter(i => i.isProduct).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`py-1.5 rounded-lg transition-all text-center ${filterMode === 'all' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                📋 ทั้งหมด ({baseItems.length + customItems.length})
              </button>
            </div>
          </div>

          {/* 2. Customer Summary Card */}
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200/80 rounded-2xl p-3.5 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-teal-600 uppercase">บัตรสมาชิก / สะสมยอด</p>
                <h4 className="font-black text-slate-800 text-sm leading-tight">{custName}</h4>
                <p className="text-[11px] font-mono text-slate-500">{custPhone}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${isVip ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-teal-100 text-teal-800 border border-teal-200'}`}>
                {memberStatus}
              </span>
            </div>

            <div className="pt-2 border-t border-teal-200/60 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-600">
                {filterMode === 'product' ? 'ยอดสะสมสินค้า (VIP):' : 'ยอดสะสมรวม (ทั้งหมด):'}
              </span>
              <div className="flex items-center gap-1">
                {isEditingTotal ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-teal-700">฿</span>
                    <input
                      type="number"
                      autoFocus
                      value={manualTotalOverride !== '' ? manualTotalOverride : activeTotal}
                      onChange={(e) => setManualTotalOverride(e.target.value)}
                      onBlur={() => setIsEditingTotal(false)}
                      onKeyDown={(e) => { if (e.key === 'Enter') setIsEditingTotal(false); }}
                      className="w-24 px-1.5 py-0.5 text-xs border border-teal-500 rounded bg-white font-black text-teal-800 text-right focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-teal-700 text-base">฿{activeTotal.toLocaleString()}</span>
                    <button
                      type="button"
                      onClick={() => setIsEditingTotal(true)}
                      title="คลิกเพื่อแก้ไขตัวเลขยอดสะสมที่พิมพ์ลงบัตร"
                      className="p-1 text-slate-400 hover:text-teal-600 hover:bg-teal-100/50 rounded transition-colors"
                    >
                      <Edit3 size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {manualTotalOverride !== '' && (
              <div className="flex justify-between items-center text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <span>(ยอดถูกปรับแต่งเอง: ฿{Number(manualTotalOverride).toLocaleString()})</span>
                <button
                  type="button"
                  onClick={() => setManualTotalOverride('')}
                  className="font-bold underline text-amber-800 hover:text-amber-950"
                >
                  คืนค่ายอดคำนวณจริง (฿{calculatedTotal.toLocaleString()})
                </button>
              </div>
            )}

            {/* Progress to VIP */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                <span>สิทธิ์ VIP (เป้าหมาย ฿5,000)</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <p className="text-[9px] font-bold text-teal-700 text-right">
                {remainingToVip > 0 ? `ขาดอีก ฿${remainingToVip.toLocaleString()} ครบสิทธิ์ VIP` : '🎉 ครบสิทธิ์สมาชิก VIP แล้ว'}
              </p>
            </div>
          </div>

          {/* 3. Editable Card Information */}
          <div className="space-y-3 pt-1 border-t border-slate-100">
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Edit3 size={14} className="text-teal-600" /> ข้อมูลที่พิมพ์ลงบัตร (แก้ไขได้)
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">วันที่ออกบัตร</label>
                <input
                  type="text"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">วันหมดอายุ</label>
                <input
                  type="text"
                  value={expiryText}
                  onChange={(e) => setExpiryText(e.target.value)}
                  placeholder="เช่น ไม่มีวันหมดอายุ"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">สาขาที่ออกบัตร</label>
              <input
                type="text"
                value={branchText}
                onChange={(e) => setBranchText(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">เงื่อนไข / สิทธิประโยชน์</label>
              <textarea
                rows={2}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                จำนวนช่องตารางเปล่า (สำหรับเขียนมือ / ปั๊มตรา)
              </label>
              <div className="grid grid-cols-5 gap-1 text-xs font-bold text-center">
                {[0, 2, 4, 6, 8].map(count => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setBlankRowsCount(count)}
                    className={`py-1 rounded-lg border transition-all ${blankRowsCount === count ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                  >
                    {count} ช่อง
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Manage Items & Add Custom Item */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1">
                <Tag size={13} className="text-teal-600" /> รายการที่จะพิมพ์ ({displayItems.length})
              </label>
              <button
                type="button"
                onClick={() => setIsAddingItem(!isAddingItem)}
                className="text-[10px] font-bold text-teal-600 bg-teal-50 border border-teal-200 hover:bg-teal-100 px-2 py-0.5 rounded-lg flex items-center gap-0.5 transition-colors"
              >
                <Plus size={12} /> เพิ่มรายการสินค้า
              </button>
            </div>

            {/* Add Item Form */}
            {isAddingItem && (
              <form onSubmit={handleAddItem} className="bg-slate-50 border border-teal-200 p-2.5 rounded-xl space-y-2 text-xs animate-in fade-in duration-150">
                <p className="font-bold text-teal-800 text-[11px]">กรอกรายการสินค้าเพิ่มเติม:</p>
                <input
                  type="text"
                  placeholder="ชื่อสินค้า เช่น ไนท์ครีม, โทนเนอร์"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  required
                  className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                />
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="number"
                    placeholder="ยอดเงิน (บาท)"
                    value={newItemAmount}
                    onChange={(e) => setNewItemAmount(e.target.value)}
                    className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                  <input
                    type="text"
                    placeholder="ผู้บันทึก"
                    value={newItemRecorder}
                    onChange={(e) => setNewItemRecorder(e.target.value)}
                    className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div className="flex justify-end gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingItem(false)}
                    className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg font-bold text-[10px]"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-teal-600 text-white rounded-lg font-bold text-[10px] hover:bg-teal-700 shadow-xs"
                  >
                    + บันทึกเพิ่ม
                  </button>
                </div>
              </form>
            )}

            {/* Items List in Sidebar with delete button */}
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {displayItems.map((item, idx) => (
                <div key={item.id || idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-slate-800 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400">{item.date} • {item.recorder}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-bold text-teal-700">฿{Number(item.amount || 0).toLocaleString()}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      title="ลบออกจากบัตรที่พิมพ์"
                      className="text-slate-300 hover:text-red-500 p-0.5 rounded transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
              {displayItems.length === 0 && (
                <p className="text-center text-slate-400 py-3 text-xs italic">ไม่มีรายการสินค้าที่เลือก</p>
              )}
            </div>

            {excludedItemIds.length > 0 && (
              <button
                type="button"
                onClick={() => setExcludedItemIds([])}
                className="text-[10px] text-teal-600 font-bold hover:underline"
              >
                คืนค่ารายการที่ถูกซ่อนทั้งหมด ({excludedItemIds.length})
              </button>
            )}
          </div>

        </div>

        {/* RIGHT: LIVE PRINT PREVIEW CANVAS */}
        <div className="flex-1 bg-slate-800/50 overflow-y-auto p-4 sm:p-8 flex flex-col items-center justify-start">
          
          <div className="mb-3 text-center text-white/70 text-xs font-bold flex items-center gap-1.5 print:hidden">
            <Sparkles size={14} className="text-teal-400" /> ตัวอย่างงานพิมพ์แบบ Real-time (ขนาดและอัตราส่วนจะตรงตามที่สั่งพิมพ์จริง)
          </div>

          {/* PRINT CONTAINER REF */}
          <div ref={printContainerRef} className="print:m-0 print:p-0">

            {/* FORMAT 1: ID CARD SIZE (85.6mm x 54mm) - พิมพ์ด้านหน้าและด้านหลังคู่กัน */}
            {(printFormat === 'id_card' || printFormat === 'foldable') && (
              <div className="flex flex-col sm:flex-row flex-wrap gap-5 items-center justify-center print:flex-row print:gap-4 print:items-center">
                
                {/* --- FRONT CARD (ด้านหน้าบัตร 85.6mm x 54mm) --- */}
                <div 
                  style={{ width: '85.6mm', height: '54mm' }} 
                  className="rounded-2xl shadow-xl overflow-hidden relative flex flex-col justify-between p-3.5 bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-900 text-white border border-teal-500/40 shrink-0 print:shadow-none print:border-teal-700"
                >
                  {/* Decorative background elements */}
                  <div className="absolute top-0 right-0 w-36 h-36 bg-teal-500/10 rounded-full blur-xl pointer-events-none"></div>
                  <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-emerald-400/10 rounded-full blur-lg pointer-events-none"></div>

                  {/* Header: Shop Name & VIP Badge */}
                  <div className="relative z-10 flex justify-between items-start">
                    <div>
                      <span className="text-[7px] font-black uppercase tracking-widest text-teal-300/80 block">MEMBER ACCUMULATION CARD</span>
                      <h3 className="text-xs font-black tracking-wide text-white drop-shadow-sm leading-tight">{shopName}</h3>
                    </div>
                    <div className="flex items-center gap-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 px-2 py-0.5 rounded-full shadow-xs">
                      <Award size={10} className="fill-current" />
                      <span className="text-[8px] font-black uppercase tracking-wider">{memberStatus}</span>
                    </div>
                  </div>

                  {/* Middle: Smart Chip Icon + Customer Name */}
                  <div className="relative z-10 my-auto flex items-center justify-between">
                    <div>
                      <p className="text-[7px] font-bold text-teal-200/70 uppercase">ชื่อสมาชิก</p>
                      <h4 className="text-sm font-black text-white tracking-wide truncate max-w-[50mm] drop-shadow-sm">{custName}</h4>
                      <p className="font-mono text-[9px] font-bold text-teal-300 tracking-wider">{custPhone}</p>
                    </div>
                    {/* Simulated Gold Chip */}
                    <div className="w-8 h-6 rounded-md bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 border border-yellow-200/60 shadow-xs flex items-center justify-center opacity-90">
                      <div className="w-5 h-4 border border-amber-700/40 rounded-xs flex flex-col justify-around py-0.5">
                        <div className="w-full h-px bg-amber-700/30"></div>
                        <div className="w-full h-px bg-amber-700/30"></div>
                      </div>
                    </div>
                  </div>

                  {/* Footer: Accumulated Amount + QR Code */}
                  <div className="relative z-10 pt-1 border-t border-teal-500/30 flex items-end justify-between">
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[7px] font-bold text-teal-200/80 uppercase">
                          ยอดสะสมสินค้า:
                        </span>
                        <span className="text-xs font-black text-amber-300 tracking-tight">฿{activeTotal.toLocaleString()}</span>
                      </div>
                      <p className="text-[6.5px] font-medium text-teal-200/60 truncate max-w-[50mm]">
                        {expiryText ? `หมดอายุ: ${expiryText}` : `ออกบัตร: ${issueDate}`} • {branchText}
                      </p>
                    </div>

                    <div className="bg-white p-1 rounded-md shadow-xs shrink-0">
                      <QRCodeSVG value={custPhone} size={28} level="M" />
                    </div>
                  </div>
                </div>

                {/* --- BACK CARD (ด้านหลังบัตร 85.6mm x 54mm) --- */}
                <div 
                  style={{ width: '85.6mm', height: '54mm' }} 
                  className="rounded-2xl shadow-xl overflow-hidden relative flex flex-col justify-between p-2.5 bg-white text-slate-900 border border-slate-300 shrink-0 print:shadow-none print:border-slate-400"
                >
                  {/* Back Header */}
                  <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                    <span className="text-[7.5px] font-black uppercase text-teal-800 tracking-wide flex items-center gap-0.5">
                      <CheckCircle size={8} className="text-teal-600" /> {filterMode === 'product' ? 'ตารางสะสมยอดซื้อสินค้า' : 'ตารางสะสมยอดทั้งหมด'}
                    </span>
                    <span className="text-[6.5px] font-bold text-slate-400">
                      {filterMode === 'product' ? 'เป้าหมาย ฿5,000 รับสิทธิ์ VIP' : 'สะสมยอด IRIS CARE'}
                    </span>
                  </div>

                  {/* Stamp / Log Table */}
                  <div className="my-auto overflow-hidden">
                    <table className="w-full border-collapse text-[6.5px]">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 font-black border-b border-slate-200">
                          <th className="py-0.5 px-1 text-left w-12">วันที่</th>
                          <th className="py-0.5 px-1 text-left">รายการสินค้า</th>
                          <th className="py-0.5 px-1 text-right w-11">ยอดเงิน</th>
                          <th className="py-0.5 px-1 text-center w-10">ผู้ตรวจ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {displayItems.slice(0, 4).map((it, i) => (
                          <tr key={it.id || i} className="leading-tight">
                            <td className="py-0.5 px-1 font-mono">{it.date}</td>
                            <td className="py-0.5 px-1 truncate max-w-[34mm]">{it.name}</td>
                            <td className="py-0.5 px-1 text-right font-bold text-teal-800">฿{Number(it.amount || 0).toLocaleString()}</td>
                            <td className="py-0.5 px-1 text-center text-slate-400">{it.recorder || '✓'}</td>
                          </tr>
                        ))}
                        {/* Empty handwriting rows */}
                        {Array.from({ length: Math.max(1, Math.min(blankRowsCount, 5 - Math.min(displayItems.length, 4))) }).map((_, bIdx) => (
                          <tr key={`blank_${bIdx}`} className="leading-tight h-3 text-slate-200 border-b border-dashed border-slate-200">
                            <td className="py-0.5 px-1 font-mono text-[5.5px] text-slate-300">.../.../...</td>
                            <td className="py-0.5 px-1 text-[5.5px] text-slate-300">........................</td>
                            <td className="py-0.5 px-1 text-right text-[5.5px] text-slate-300">฿........</td>
                            <td className="py-0.5 px-1 text-center text-[5.5px] text-slate-300">...</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Back Footer: Note & Terms */}
                  <div className="pt-1 border-t border-slate-200 flex justify-between items-end text-[6px] text-slate-500 leading-tight">
                    <p className="truncate max-w-[60mm]">
                      {noteText}
                    </p>
                    <p className="font-bold text-slate-700 shrink-0">
                      รวม: ฿{activeTotal.toLocaleString()}
                    </p>
                  </div>
                </div>

              </div>
            )}

            {/* FORMAT 2: FOLDABLE WALLET CARD INFO (Guide line) */}
            {printFormat === 'foldable' && (
              <div className="mt-4 p-2.5 bg-teal-50 border border-teal-200 rounded-xl text-center text-xs text-teal-800 font-medium max-w-md mx-auto print:hidden">
                ✂️ <strong>วิธีใช้งานบัตรพับ:</strong> พิมพ์ลงกระดาษการ์ด แล้วตัดตามขอบ จากนั้นพับครึ่งระหว่างด้านหน้าและด้านหลัง จะได้บัตรสมาชิกขนาดเท่าบัตรประชาชนพกใส่กระเป๋าสตางค์ได้พอดีเป๊ะครับ
              </div>
            )}

            {/* FORMAT 3: THERMAL 80MM SLIP */}
            {printFormat === 'thermal' && (
              <div 
                style={{ width: '80mm' }} 
                className="bg-white text-black p-4 rounded-xl shadow-xl font-mono text-xs leading-tight border border-slate-200 shrink-0 print:shadow-none print:p-2"
              >
                <div className="text-center mb-3 pb-2 border-b-2 border-dashed border-black">
                  <h3 className="font-black text-sm uppercase">{shopName}</h3>
                  <p className="text-[10px] text-slate-600 font-bold">
                    {filterMode === 'product' ? 'บัตรสมาชิก / สลิปสะสมยอดสินค้า' : 'บัตรสมาชิก / สลิปสะสมยอดรวม'}
                  </p>
                  <p className="text-[9px] text-slate-500">{branchText} • โทร. {custPhone}</p>
                </div>

                <div className="space-y-1 mb-3 text-[11px]">
                  <div className="flex justify-between">
                    <span className="font-bold">ลูกค้า:</span>
                    <span className="font-black">{custName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>เบอร์โทร:</span>
                    <span>{custPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>สถานะ:</span>
                    <span className="font-bold">{memberStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>วันที่ออกบัตร:</span>
                    <span>{issueDate}</span>
                  </div>
                </div>

                <div className="bg-slate-100 p-2 rounded-lg text-center mb-3 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 block">
                    {filterMode === 'product' ? 'ยอดสะสมสินค้าปัจจุบัน' : 'ยอดสะสมรวมปัจจุบัน'}
                  </span>
                  <span className="text-lg font-black text-slate-900">฿{activeTotal.toLocaleString()}</span>
                  <p className="text-[9px] text-slate-600 mt-0.5">
                    {remainingToVip > 0 ? `ขาดอีก ฿${remainingToVip.toLocaleString()} ครบ ฿5,000 (VIP)` : '⭐ สิทธิ์สมาชิก VIP สมบูรณ์'}
                  </p>
                </div>

                <div className="mb-3">
                  <div className="font-bold text-[10px] uppercase border-b border-black pb-0.5 mb-1 flex justify-between">
                    <span>รายการสินค้าสะสม</span>
                    <span>ยอดเงิน</span>
                  </div>
                  <div className="space-y-1">
                    {displayItems.map((item, idx) => (
                      <div key={item.id || idx} className="flex justify-between text-[10px]">
                        <div className="truncate pr-1">
                          <span>{item.date} </span>
                          <span>{item.name}</span>
                        </div>
                        <span className="font-bold shrink-0">฿{Number(item.amount || 0).toLocaleString()}</span>
                      </div>
                    ))}
                    {/* Blank handwriting rows */}
                    {Array.from({ length: blankRowsCount }).map((_, bIdx) => (
                      <div key={`th_blank_${bIdx}`} className="flex justify-between text-[9px] text-slate-400 border-b border-dashed border-slate-300 py-0.5">
                        <span>.../.../... ........................</span>
                        <span>฿........</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-dashed border-black pt-2 text-center space-y-1">
                  <p className="text-[9px] text-slate-600">{noteText}</p>
                  <div className="flex justify-center my-1.5">
                    <QRCodeSVG value={custPhone} size={60} level="M" />
                  </div>
                  <p className="text-[8px] text-slate-400">ขอบพระคุณที่ไว้วางใจใช้บริการ</p>
                </div>
              </div>
            )}

            {/* FORMAT 4: FULL A4 DOCUMENT */}
            {printFormat === 'a4' && (
              <div 
                style={{ width: '210mm', minHeight: '297mm' }} 
                className="bg-white text-black p-10 rounded-2xl shadow-xl font-sans text-sm border border-slate-200 shrink-0 print:shadow-none print:p-6 print:border-none"
              >
                <div className="flex justify-between items-start border-b-2 border-teal-600 pb-4 mb-6">
                  <div>
                    <h1 className="text-2xl font-black text-teal-800 uppercase tracking-tight">{shopName}</h1>
                    <h2 className="text-base font-bold text-slate-600">บัตรสมาชิกและประวัติการสะสมยอดซื้อสินค้า (Member & VIP Record)</h2>
                    <p className="text-xs text-slate-400 mt-1">{branchText} • วันที่พิมพ์: {new Date().toLocaleDateString('th-TH')}</p>
                  </div>
                  <div className="text-right">
                    <div className="bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 font-black px-4 py-1.5 rounded-xl shadow-xs text-xs uppercase inline-block mb-1">
                      {memberStatus}
                    </div>
                    <p className="text-xs text-slate-500">วันหมดอายุ: {expiryText}</p>
                  </div>
                </div>

                {/* Customer Details Box */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-2xl mb-6">
                  <div>
                    <p className="text-xs text-slate-500 font-bold">ชื่อลูกค้า</p>
                    <p className="text-base font-black text-slate-800">{custName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold">เบอร์โทรศัพท์</p>
                    <p className="text-base font-mono font-bold text-slate-800">{custPhone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold">สถานะสมาชิก</p>
                    <p className="text-sm font-bold text-teal-700">{memberStatus}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold">ปัญหาผิว / ข้อมูลบันทึก</p>
                    <p className="text-sm font-bold text-slate-700">{customer.computedIssue || 'ไม่ระบุ'}</p>
                  </div>
                </div>

                {/* Amounts Summary */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 p-5 rounded-2xl text-center">
                    <p className="text-xs font-bold text-teal-600 uppercase mb-1">ยอดสะสมสินค้า (VIP)</p>
                    <p className="text-3xl font-black text-teal-700">
                      ฿{(filterMode === 'product' ? activeTotal : (customer.productAccumulatedAmount || calculatedTotal)).toLocaleString()}
                    </p>
                    <p className="text-xs text-teal-600 mt-1">
                      {remainingToVip > 0 ? `(ขาดอีก ฿${remainingToVip.toLocaleString()} ครบสิทธิ์ VIP ฿5,000)` : '⭐ มีสิทธิ์สมาชิก VIP'}
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl text-center">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">ยอดสะสมสุทธิ (รวมทุกรายการ)</p>
                    <p className="text-3xl font-black text-slate-800">
                      ฿{(customer.realAccumulatedAmount || (filterMode === 'all' ? activeTotal : calculatedTotal)).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">อัปเดตล่าสุดตามระบบคลินิก</p>
                  </div>
                </div>

                {/* Items Table */}
                <div className="mb-6">
                  <h3 className="font-black text-sm text-slate-800 mb-2 border-b border-slate-200 pb-1 flex justify-between items-center">
                    <span>ตารางประวัติรายการสะสม</span>
                    <span className="text-xs text-slate-400 font-normal">ทั้งหมด {displayItems.length} รายการ</span>
                  </h3>
                  <table className="w-full border-collapse border border-slate-200 text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold">
                        <th className="border border-slate-200 p-2 text-left w-24">วันที่</th>
                        <th className="border border-slate-200 p-2 text-left">รายการ</th>
                        <th className="border border-slate-200 p-2 text-right w-28">ยอดสะสม (บาท)</th>
                        <th className="border border-slate-200 p-2 text-center w-24">ผู้บันทึก</th>
                        <th className="border border-slate-200 p-2 text-center w-28">ลายเซ็น / ตราประทับ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayItems.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-50">
                          <td className="border border-slate-200 p-2 font-mono">{item.date}</td>
                          <td className="border border-slate-200 p-2 font-medium">{item.name}</td>
                          <td className="border border-slate-200 p-2 text-right font-black text-teal-700">
                            ฿{Number(item.amount || 0).toLocaleString()}
                          </td>
                          <td className="border border-slate-200 p-2 text-center text-slate-600">{item.recorder || '-'}</td>
                          <td className="border border-slate-200 p-2 text-center text-slate-300">
                            <span className="inline-block border border-dashed border-slate-300 w-16 h-6 rounded"></span>
                          </td>
                        </tr>
                      ))}
                      {/* Blank rows */}
                      {Array.from({ length: blankRowsCount }).map((_, bIdx) => (
                        <tr key={`a4_blank_${bIdx}`} className="h-8">
                          <td className="border border-slate-200 p-2 text-slate-300">.../.../...</td>
                          <td className="border border-slate-200 p-2 text-slate-300">................................................</td>
                          <td className="border border-slate-200 p-2 text-right text-slate-300">฿................</td>
                          <td className="border border-slate-200 p-2 text-center text-slate-300">............</td>
                          <td className="border border-slate-200 p-2 text-center text-slate-300">
                            <span className="inline-block border border-dashed border-slate-300 w-16 h-6 rounded"></span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-black text-slate-800">
                        <td colSpan={2} className="border border-slate-200 p-2 text-right">ยอดรวมทั้งหมด:</td>
                        <td className="border border-slate-200 p-2 text-right text-teal-800 text-sm">฿{calculatedTotal.toLocaleString()}</td>
                        <td colSpan={2} className="border border-slate-200 p-2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Footer Signatures */}
                <div className="mt-12 pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
                  <div>
                    <div className="border-b border-dashed border-slate-400 w-44 mx-auto mb-1 h-12"></div>
                    <p className="font-bold text-slate-700">ลายมือชื่อลูกค้า</p>
                    <p className="text-[10px] text-slate-400">({custName})</p>
                  </div>
                  <div>
                    <div className="border-b border-dashed border-slate-400 w-44 mx-auto mb-1 h-12"></div>
                    <p className="font-bold text-slate-700">ลายมือชื่อเจ้าหน้าที่ / ตราประทับ</p>
                    <p className="text-[10px] text-slate-400">{branchText}</p>
                  </div>
                </div>

                <div className="mt-8 text-center text-[10px] text-slate-400">
                  <p>{noteText}</p>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}

