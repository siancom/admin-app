import React, { useState, useMemo } from 'react';
import { 
  X, Search, Receipt, FileText, Printer, ArrowLeft, 
  ExternalLink, CheckCircle, Clock, User, Phone, 
  CreditCard, Banknote, Smartphone, ShoppingBag, Eye,
  Tag, Download, Sparkles, Filter
} from 'lucide-react';
import { 
  extractIsoDate, 
  isShopeeOrder, 
  isOrderCompletedForRevenue, 
  getEffectiveOrderPrice, 
  parsePaymentBreakdown 
} from './DailySalesBannerChart';
import { normalizeBranchName, parseNumber } from '../utils/parse';

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export default function DailyOrdersModal({
  isOpen = false,
  onClose = () => {},
  dateIso = '',
  orders = [],
  branch = 'เฉวง',
  onOpenA4Preview = () => {},
  onViewSlip = () => {}
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);

  // Thai Date Label
  const thaiDateLabel = useMemo(() => {
    if (!dateIso) return '';
    const [y, m, d] = dateIso.split('-').map(Number);
    const thaiYear = y + 543;
    const monthName = THAI_MONTHS_FULL[m - 1] || '';
    return `${d} ${monthName} ${thaiYear}`;
  }, [dateIso]);

  // Filter orders matching the date and branch
  const dayOrders = useMemo(() => {
    if (!isOpen || !dateIso) return [];
    const normTarget = normalizeBranchName(branch || 'เฉวง');

    return orders.filter(o => {
      if (!isOrderCompletedForRevenue(o)) return false;
      if (branch && branch !== 'ทั้งหมด') {
        const oBranch = normalizeBranchName(o.branch || 'เฉวง');
        if (oBranch !== normTarget) return false;
      }
      const oDate = o.orderDateIso || extractIsoDate(o.createdAt || o.date || o['วันที่']);
      return oDate === dateIso;
    }).sort((a, b) => {
      const timeA = new Date(a.createdAt || a.date || 0).getTime();
      const timeB = new Date(b.createdAt || b.date || 0).getTime();
      return timeB - timeA;
    });
  }, [isOpen, dateIso, orders, branch]);

  // Summary totals for this day
  const summary = useMemo(() => {
    let total = 0;
    let cash = 0;
    let transfer = 0;
    let shopee = 0;
    let other = 0;
    let slipCount = 0;

    dayOrders.forEach(o => {
      const price = getEffectiveOrderPrice(o);
      const isShopee = isShopeeOrder(o);
      const breakdown = parsePaymentBreakdown(o);

      total += price;
      cash += breakdown.cash;
      transfer += breakdown.transfer;
      shopee += breakdown.shopee;
      other += (breakdown.cod + breakdown.other);

      const slip = o.slipUrl || o.transferSlip || o.paymentSlip || o.slipImage || o.slip;
      if (slip) slipCount++;
    });

    return { total, cash, transfer, shopee, other, slipCount, count: dayOrders.length };
  }, [dayOrders]);

  // Filter by search & payment method
  const filteredOrders = useMemo(() => {
    return dayOrders.filter(o => {
      // 1. Payment filter
      if (paymentFilter !== 'all') {
        const isShopee = isShopeeOrder(o);
        const breakdown = parsePaymentBreakdown(o);
        const slip = o.slipUrl || o.transferSlip || o.paymentSlip || o.slipImage || o.slip;

        if (paymentFilter === 'transfer' && breakdown.transfer <= 0 && !isShopee) return false;
        if (paymentFilter === 'cash' && breakdown.cash <= 0) return false;
        if (paymentFilter === 'shopee' && !isShopee) return false;
        if (paymentFilter === 'slip' && !slip) return false;
      }

      // 2. Search term
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const orderNo = String(o.orderNo || o.id || '').toLowerCase();
        const custName = String(o.customerName || o['ชื่อลูกค้า'] || '').toLowerCase();
        const custPhone = String(o.customerPhone || o['เบอร์โทร'] || '').toLowerCase();
        const courseName = String(o.courseName || o.itemName || '').toLowerCase();
        const cartNames = Array.isArray(o.cartItems) 
          ? o.cartItems.map(i => String(i.name || '').toLowerCase()).join(' ')
          : '';

        const match = orderNo.includes(term) ||
          custName.includes(term) ||
          custPhone.includes(term) ||
          courseName.includes(term) ||
          cartNames.includes(term);

        if (!match) return false;
      }

      return true;
    });
  }, [dayOrders, paymentFilter, searchTerm]);

  if (!isOpen || !dateIso) return null;

  return (
    <div 
      className="fixed inset-0 z-[220] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-white"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 border-b border-slate-800 flex flex-col gap-4 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
                <Receipt size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    รายการบิลคำสั่งซื้อ
                  </h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {dayOrders.length} บิล
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  วันที่ {thaiDateLabel} • สาขา {branch || 'เฉวง'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenA4Preview(dateIso);
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/40 active:scale-95 transition-all border border-emerald-400/30"
                title="เปิดใบสรุปยอดประจำวันเต็มรูปแบบ (A4)"
              >
                <FileText size={15} />
                <span>พรีวิวยอด A4</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-slate-700 active:scale-95"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Quick Stats Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ยอดขายรวมสุทธิ</span>
              <span className="text-base sm:text-lg font-black text-emerald-400">
                ฿{summary.total.toLocaleString()}
              </span>
            </div>
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">📱 โอนเงิน</span>
              <span className="text-base sm:text-lg font-black text-cyan-300">
                ฿{summary.transfer.toLocaleString()}
              </span>
            </div>
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">💵 เงินสด</span>
              <span className="text-base sm:text-lg font-black text-emerald-300">
                ฿{summary.cash.toLocaleString()}
              </span>
            </div>
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">🛍️ Shopee / อื่นๆ</span>
              <span className="text-base sm:text-lg font-black text-orange-300">
                ฿{(summary.shopee + summary.other).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาเลขบิล, ชื่อลูกค้า, สินค้า/คอร์ส, เบอร์โทร..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setPaymentFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  paymentFilter === 'all'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                ทั้งหมด ({dayOrders.length})
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter('transfer')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  paymentFilter === 'transfer'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                โอนเงิน
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter('cash')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  paymentFilter === 'cash'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                เงินสด
              </button>
              {summary.shopee > 0 && (
                <button
                  type="button"
                  onClick={() => setPaymentFilter('shopee')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    paymentFilter === 'shopee'
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  Shopee
                </button>
              )}
              {summary.slipCount > 0 && (
                <button
                  type="button"
                  onClick={() => setPaymentFilter('slip')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    paymentFilter === 'slip'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  📸 สลิป ({summary.slipCount})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Orders Body (Scrollable Cards List) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 bg-slate-900/60 divide-y divide-slate-800/40">
          {filteredOrders.length === 0 ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-3 text-slate-500">
                <Receipt size={32} />
              </div>
              <p className="text-base font-bold text-slate-300">ไม่พบบิลคำสั่งซื้อ</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                {searchTerm || paymentFilter !== 'all'
                  ? 'ลองปรับเปลี่ยนคำค้นหาหรือตัวกรองช่องทางชำระเงิน'
                  : 'ยังไม่มีประวัติการเปิดบิลในวันที่เลือกนี้'}
              </p>
            </div>
          ) : (
            filteredOrders.map((order, idx) => {
              const isShopee = isShopeeOrder(order);
              const orderPrice = getEffectiveOrderPrice(order);
              const breakdown = parsePaymentBreakdown(order);
              const slip = order.slipUrl || order.transferSlip || order.paymentSlip || order.slipImage || order.slip;
              const timeStr = order.createdAt 
                ? new Date(order.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
                : '-';

              // Extract item list
              let itemsList = [];
              if (Array.isArray(order.cartItems) && order.cartItems.length > 0) {
                itemsList = order.cartItems.map(i => ({
                  name: i.name || i.courseName || 'สินค้า/บริการ',
                  qty: parseNumber(i.qty || 1),
                  price: parseNumber(i.price || 0)
                }));
              } else if (order.courseName) {
                itemsList = [{
                  name: order.courseName,
                  qty: parseNumber(order.qty || 1),
                  price: orderPrice
                }];
              } else if (order.itemName) {
                itemsList = [{
                  name: order.itemName,
                  qty: 1,
                  price: orderPrice
                }];
              } else {
                itemsList = [{
                  name: isShopee ? 'สินค้าคำสั่งซื้อ Shopee' : 'สินค้า/บริการหน้าร้าน',
                  qty: 1,
                  price: orderPrice
                }];
              }

              return (
                <div 
                  key={order.id || idx}
                  className="bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 rounded-2xl p-4 transition-all duration-200 shadow-sm flex flex-col gap-3 group"
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-sm text-indigo-300 bg-indigo-950/60 border border-indigo-500/30 px-2.5 py-1 rounded-lg">
                        #{order.orderNo || `POS-${String(idx + 1).padStart(3, '0')}`}
                      </span>

                      <span className="text-xs text-slate-400 flex items-center gap-1 font-medium bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                        <Clock size={12} className="text-slate-500" />
                        {timeStr} น.
                      </span>

                      {isShopee ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-300 border border-orange-500/30">
                          Shopee
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          POS หน้าร้าน
                        </span>
                      )}

                      {order.isCancelled ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          ยกเลิกแล้ว
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle size={10} /> ชำระแล้ว
                        </span>
                      )}
                    </div>

                    {/* Price and Payment Method */}
                    <div className="text-right flex items-baseline gap-2">
                      <span className="text-xs text-slate-400 font-medium">ยอดชำระ:</span>
                      <span className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">
                        ฿{orderPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Customer and Staff Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-3 text-slate-300 flex-wrap">
                      <span className="flex items-center gap-1 font-bold text-white">
                        <User size={13} className="text-slate-400" />
                        {order.customerName || (isShopee ? 'ลูกค้า Shopee' : 'ลูกค้าทั่วไป')}
                      </span>
                      {order.customerPhone && (
                        <span className="text-slate-400 flex items-center gap-1">
                          <Phone size={12} />
                          {order.customerPhone}
                        </span>
                      )}
                      {(order.seller || order.cashierName || order.staffName) && (
                        <span className="text-indigo-300 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-800/40">
                          ผู้บันทึก: {order.seller || order.cashierName || order.staffName}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {breakdown.transfer > 0 && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                          📱 โอน ฿{breakdown.transfer.toLocaleString()}
                        </span>
                      )}
                      {breakdown.cash > 0 && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                          💵 สด ฿{breakdown.cash.toLocaleString()}
                        </span>
                      )}
                      {breakdown.shopee > 0 && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-orange-950/60 text-orange-300 border border-orange-500/30">
                          🛍️ Shopee ฿{breakdown.shopee.toLocaleString()}
                        </span>
                      )}
                      {Number(order.transferTip) > 0 && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-950/60 text-amber-300 border border-amber-500/30">
                          🎁 ทิป ฿{Number(order.transferTip).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/50 space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-400 flex items-center justify-between border-b border-slate-800 pb-1">
                      <span>รายการสินค้า / บริการ</span>
                      <span>จำนวน • ราคา</span>
                    </div>
                    {itemsList.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex items-center justify-between text-xs py-0.5">
                        <span className="text-slate-200 font-medium truncate pr-2">
                          {item.name}
                        </span>
                        <span className="text-slate-300 font-mono font-bold shrink-0">
                          {item.qty} x ฿{(item.price || 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Bottom Actions Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    {/* Left: Slip thumbnail if available */}
                    <div>
                      {slip ? (
                        <button
                          type="button"
                          onClick={() => onViewSlip(slip)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-950/60 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 hover:border-indigo-500/60 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
                          title="คลิกเพื่อดูรูปสลิปโอนเงินขนาดเต็ม"
                        >
                          <Eye size={13} className="text-indigo-400" />
                          <span>ดูสลิปโอนเงิน</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">
                          (ไม่มีรูปสลิปแนบ)
                        </span>
                      )}
                    </div>

                    {/* Right: Print Receipt Button */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedReceiptOrder(order)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700 hover:border-indigo-500 transition-all active:scale-95 cursor-pointer shadow-sm"
                        title="ดูและสั่งพิมพ์ใบเสร็จรับเงินสำหรับบิลนี้"
                      >
                        <Printer size={13} />
                        <span>พิมพ์ใบเสร็จ</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400">
            แสดง <span className="font-bold text-white">{filteredOrders.length}</span> จากทั้งหมด <span className="font-bold text-white">{dayOrders.length}</span> บิล
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenA4Preview(dateIso);
              }}
              className="sm:hidden px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <FileText size={14} />
              <span>สรุป A4</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-colors border border-slate-700 active:scale-95"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>

      {/* 🖨️ Thermal Receipt Preview Modal 🖨️ */}
      {selectedReceiptOrder && (
        <SingleReceiptModal
          order={selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
          branch={branch}
        />
      )}
    </div>
  );
}

// 🖨️ Sub-Component: Clean Thermal 80mm Receipt Modal
function SingleReceiptModal({ order, onClose, branch = 'เฉวง' }) {
  if (!order) return null;

  const orderPrice = getEffectiveOrderPrice(order);
  const breakdown = parsePaymentBreakdown(order);
  const dateStr = order.createdAt 
    ? new Date(order.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
    : '-';
  const timeStr = order.createdAt 
    ? new Date(order.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    : '-';

  // Items
  let items = [];
  if (Array.isArray(order.cartItems) && order.cartItems.length > 0) {
    items = order.cartItems.map(i => ({
      name: i.name || i.courseName || 'สินค้า/บริการ',
      qty: parseNumber(i.qty || 1),
      price: parseNumber(i.price || 0)
    }));
  } else if (order.courseName) {
    items = [{ name: order.courseName, qty: parseNumber(order.qty || 1), price: orderPrice }];
  } else {
    items = [{ name: order.itemName || 'สินค้า/บริการ', qty: 1, price: orderPrice }];
  }

  const subtotal = items.reduce((sum, i) => sum + (i.price * i.qty), 0);
  const discount = parseNumber(order.discount || 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-[260] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative bg-white text-slate-900 rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-md flex flex-col font-sans"
        onClick={e => e.stopPropagation()}
      >
        {/* Printable Receipt Content */}
        <div id="single-receipt-print-area" className="w-full text-slate-800 text-sm">
          {/* Clinic Header */}
          <div className="text-center pb-4 border-b-2 border-slate-800">
            <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">
              IRIS BOTANICAL CARE
            </h2>
            <p className="text-xs text-slate-600 font-bold mt-0.5">
              สาขา {order.branch || branch || 'เฉวง'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 font-mono">
              ใบเสร็จรับเงิน / คำสั่งซื้อ
            </p>
          </div>

          {/* Info Details */}
          <div className="py-3 border-b border-dashed border-slate-300 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">เลขที่บิล:</span>
              <span className="font-mono font-bold text-slate-800">{order.orderNo || order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">วันที่ / เวลา:</span>
              <span className="font-medium text-slate-700">{dateStr} {timeStr} น.</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">ลูกค้า:</span>
              <span className="font-bold text-slate-800">{order.customerName || 'ลูกค้าทั่วไป'}</span>
            </div>
            {order.customerPhone && (
              <div className="flex justify-between">
                <span className="text-slate-500">เบอร์โทร:</span>
                <span className="font-medium text-slate-700">{order.customerPhone}</span>
              </div>
            )}
            {(order.seller || order.cashierName) && (
              <div className="flex justify-between">
                <span className="text-slate-500">พนักงานขาย:</span>
                <span className="font-medium text-slate-700">{order.seller || order.cashierName}</span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="py-3 border-b border-dashed border-slate-300 text-xs space-y-2">
            <div className="flex justify-between font-bold text-slate-600 pb-1 border-b border-slate-200">
              <span>รายการ</span>
              <span>จำนวน x ราคา</span>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-baseline gap-2">
                <div className="flex-1 truncate">
                  <span className="font-medium text-slate-800">{item.name}</span>
                </div>
                <div className="text-right font-mono font-bold shrink-0">
                  <span>{item.qty} x ฿{item.price.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="py-3 border-b-2 border-slate-800 text-xs space-y-1.5">
            {discount > 0 && (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>ยอดรวมก่อนลด:</span>
                  <span className="font-mono">฿{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>ส่วนลด:</span>
                  <span className="font-mono font-bold">-฿{discount.toLocaleString()}</span>
                </div>
              </>
            )}
            <div className="flex justify-between items-center text-base pt-1 font-black text-slate-900">
              <span>ยอดชำระสุทธิ:</span>
              <span className="text-emerald-700 text-lg font-mono">฿{orderPrice.toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-xs text-slate-600 pt-1 border-t border-dashed border-slate-200">
              <span>วิธีชำระเงิน:</span>
              <span className="font-bold text-slate-800">
                {breakdown.transfer > 0 && `โอนเงิน ฿${breakdown.transfer.toLocaleString()} `}
                {breakdown.cash > 0 && `เงินสด ฿${breakdown.cash.toLocaleString()} `}
                {breakdown.shopee > 0 && `Shopee ฿${breakdown.shopee.toLocaleString()} `}
                {breakdown.cod > 0 && `COD ฿${breakdown.cod.toLocaleString()} `}
                {!breakdown.transfer && !breakdown.cash && !breakdown.shopee && !breakdown.cod && (order.paymentMethod || 'ชำระแล้ว')}
              </span>
            </div>
          </div>

          {/* Footer Thank You */}
          <div className="text-center pt-4 text-xs text-slate-500 space-y-1">
            <p className="font-bold text-slate-700">ขอบพระคุณที่ไว้วางใจใช้บริการ</p>
            <p className="text-[10px] text-slate-400">IRIS BOTANICAL CARE CLINIC</p>
          </div>
        </div>

        {/* Modal Controls */}
        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-200 transition-all active:scale-95"
          >
            <Printer size={15} />
            <span>พิมพ์ใบเสร็จ (Print)</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
