import React from 'react';
import { 
  X, QrCode, Phone, MapPin, Calendar, Clock, Scissors, ShoppingCart, 
  MessageSquare, Camera, CheckCircle2, AlertCircle, ChevronRight, User, Layers
} from 'lucide-react';
import { getSafeDateTime, getBookingStatus } from '../utils/dateUtils';

export default function BookingTicketModal({
  booking,
  onClose,
  onOpenCheckIn,
  onGoToPosCutCourse,
  onGoToPosBuyProducts,
  onUpdateStatus,
  onReschedule
}) {
  if (!booking) return null;

  const st = getBookingStatus(booking);
  const dtSafe = getSafeDateTime(booking);
  const isLineBooking = Boolean(
    booking.lineUid || 
    booking.source === 'line' || 
    booking.channel === 'line' || 
    booking.source === 'liff' || 
    booking.source === 'LIFF' || 
    (!booking.isAdminCreated && !booking.isWalkIn && booking.source !== 'POS' && booking.source !== 'admin')
  );

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm print:hidden animate-in fade-in duration-150">
      <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100">
        
        {/* Ticket Header */}
        <div className={`p-5 text-white flex items-center justify-between shrink-0 relative overflow-hidden ${
          st === 'กำลังใช้บริการ' 
            ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-700' 
            : st === 'เสร็จสิ้น' 
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700' 
              : st === 'ยืนยันแล้ว'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
                : 'bg-gradient-to-r from-amber-500 to-orange-600'
        }`}>
          <div className="relative z-10">
            <div className="flex items-center gap-1.5 mb-1">
              {isLineBooking ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 backdrop-blur-sm text-white border border-white/30">
                  <MessageSquare size={11} className="fill-white" />
                  <span>จองผ่าน LINE</span>
                </span>
              ) : booking.isWalkIn ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 backdrop-blur-sm text-white">
                  🚶 Walk-in
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 backdrop-blur-sm text-white">
                  👤 หน้าร้าน/แอดมิน
                </span>
              )}
              <span className="text-[10px] font-mono opacity-80">#{booking.ticketNo || booking.id?.slice(-6).toUpperCase()}</span>
            </div>
            <h3 className="text-xl font-black tracking-tight">{booking.customerName || 'ลูกค้าทั่วไป'}</h3>
            <p className="text-xs opacity-90 flex items-center gap-2 mt-0.5 font-medium">
              <span>{booking.customerPhone || '-'}</span>
              <span>•</span>
              <span>สาขา {booking.branch || 'เฉวง'}</span>
            </p>
          </div>

          <button 
            type="button" 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors relative z-10"
          >
            <X size={18} />
          </button>
        </div>

        {/* Ticket Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* Status & Service Details */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-bold">สถานะปัจจุบัน:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-black border ${
                st === 'กำลังใช้บริการ' 
                  ? 'bg-purple-100 text-purple-700 border-purple-300 animate-pulse' 
                  : st === 'เสร็จสิ้น' 
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-300' 
                    : st === 'ยืนยันแล้ว'
                      ? 'bg-blue-100 text-blue-700 border-blue-300'
                      : 'bg-amber-100 text-amber-700 border-amber-300'
              }`}>
                {st}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-bold">บริการ / คอร์ส:</span>
              <span className="font-black text-slate-800 text-right max-w-[200px] truncate">
                {booking.checkedInCourseName || booking.courseName || 'บริการทั่วไป'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-bold">วันและเวลานัดหมาย:</span>
              <span className="font-black text-slate-800">
                {dtSafe ? new Date(dtSafe).toLocaleDateString('th-TH') : booking.date || '-'} เวลา {dtSafe ? dtSafe.split('T')[1]?.substring(0, 5) : booking.time || '-'} น.
              </span>
            </div>

            {booking.bedNumber && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-bold">เตียงบริการ:</span>
                <span className="font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
                  เตียง {booking.bedNumber}
                </span>
              </div>
            )}
          </div>

          {/* Before Photo if exists */}
          {(booking.beforePhoto || booking.customerPhoto) && (
            <div className="bg-white border border-slate-200 rounded-2xl p-3">
              <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Camera size={14} className="text-pink-600" />
                <span>รูปถ่ายก่อนทำ (Before Photo)</span>
              </div>
              <div className="rounded-xl overflow-hidden max-w-[180px] mx-auto border border-slate-200">
                <img 
                  src={booking.beforePhoto || booking.customerPhoto} 
                  alt="Before" 
                  className="w-full h-32 object-cover" 
                />
              </div>
            </div>
          )}

          {/* Action Hub */}
          <div className="space-y-2 pt-1">
            <div className="text-[11px] font-bold text-slate-400 px-1">การดำเนินการด่วน:</div>

            {/* If NOT in progress and NOT completed -> Check-in Button */}
            {st !== 'กำลังใช้บริการ' && st !== 'เสร็จสิ้น' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenCheckIn) onOpenCheckIn(booking);
                }}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition-all active:scale-95 cursor-pointer"
              >
                <Camera size={18} />
                <span>เช็คอินเข้าใช้บริการ (เลือกคอร์ส & ถ่าย Before)</span>
              </button>
            )}

            {/* If IN PROGRESS -> Cut Course in POS Button */}
            {st === 'กำลังใช้บริการ' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onGoToPosCutCourse) onGoToPosCutCourse(booking);
                }}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-orange-200 transition-all active:scale-95 cursor-pointer"
              >
                <Scissors size={18} />
                <span>ดำเนินการตัดคอสที่ POS (เสร็จแล้วปรับสถานะทันที)</span>
              </button>
            )}

            {/* Buy Cream / Products in POS Button */}
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onGoToPosBuyProducts) onGoToPosBuyProducts(booking);
              }}
              className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <ShoppingCart size={15} className="text-emerald-600" />
              <span>เปิด POS ซื้อครีม / ผลิตภัณฑ์ให้ลูกค้ารายนี้</span>
            </button>

            {/* Reschedule */}
            {st !== 'เสร็จสิ้น' && st !== 'ยกเลิก' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onReschedule) onReschedule(booking);
                }}
                className="w-full py-2 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Calendar size={14} className="text-slate-500" />
                <span>เลื่อนวัน / เวลาการนัดหมาย</span>
              </button>
            )}
          </div>

          {/* Status Changer Pills */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 mb-1.5">เปลี่ยนสถานะโดยตรง:</div>
            <div className="grid grid-cols-4 gap-1">
              {[
                { key: 'รอการยืนยัน', label: 'รอการยืนยัน', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
                { key: 'ยืนยันแล้ว', label: 'ยืนยันแล้ว', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
                { key: 'กำลังใช้บริการ', label: 'กำลังทำ', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
                { key: 'เสร็จสิ้น', label: 'เสร็จสิ้น', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
              ].map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    if (onUpdateStatus) onUpdateStatus(booking.id, item.key);
                    onClose();
                  }}
                  className={`py-1.5 px-1 rounded-xl text-[10px] font-bold border transition-all ${
                    st === item.key ? 'ring-2 ring-indigo-400 font-black' : ''
                  } ${item.bg}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
