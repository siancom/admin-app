import React, { useState, useEffect, useRef } from 'react';
import { 
  X, CheckCircle2, Camera, Upload, Trash2, Sparkles, User, Phone, 
  Clock, MapPin, Calendar, Scissors, ShoppingCart, MessageSquare, 
  ChevronRight, AlertCircle, RefreshCw, Layers
} from 'lucide-react';
import { getFuzzyKey } from '../utils/fuzzy';

export default function SmartQueueCheckInModal({
  isOpen,
  onClose,
  preselectedBooking = null,
  bookings = [],
  courses = [],
  customers = [],
  globalBranch = 'เฉวง',
  onConfirmCheckIn,
  onCheckInAndGoToPos
}) {
  const [selectedBooking, setSelectedBooking] = useState(preselectedBooking);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedBed, setSelectedBed] = useState('1');
  const [beforePhoto, setBeforePhoto] = useState(null);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Sync preselected booking
  useEffect(() => {
    if (preselectedBooking) {
      setSelectedBooking(preselectedBooking);
    } else if (isOpen) {
      // If opened without preselected, find the first upcoming booking of today
      const today = new Date().toISOString().split('T')[0];
      const todayUpcoming = bookings.find(b => {
        const dt = b.dateTime || b.date || '';
        const st = b.status || '';
        return dt.startsWith(today) && (st === 'ยืนยันแล้ว' || st === 'รอการยืนยัน');
      });
      setSelectedBooking(todayUpcoming || null);
    }
  }, [preselectedBooking, isOpen, bookings]);

  // Reset states when changing booking
  useEffect(() => {
    if (selectedBooking) {
      // Find matching courses for this customer
      const bPhone = String(selectedBooking.customerPhone || '').replace(/\D/g, '');
      const custCourses = courses.filter(c => {
        const cPhone = String(getFuzzyKey(c, ["เบอร์โทร", "col_1"]) || '').replace(/\D/g, '');
        const remainQty = Number(c.computedRemainQty ?? getFuzzyKey(c, ["ครั้งที่เหลือดิบ", "col_33", "col_4"]) ?? 1);
        return cPhone && bPhone && (cPhone === bPhone || cPhone.endsWith(bPhone) || bPhone.endsWith(cPhone)) && remainQty > 0;
      });

      // Default course selection
      if (custCourses.length > 0) {
        // Try match by course name if possible
        const matchByName = custCourses.find(c => {
          const cName = String(c["ชื่อคอส"] || c.name || '').toLowerCase();
          const bName = String(selectedBooking.courseName || '').toLowerCase();
          return cName && bName && (cName.includes(bName) || bName.includes(cName));
        });
        setSelectedCourse(matchByName || custCourses[0]);
      } else {
        setSelectedCourse(null);
      }

      setSelectedBed(selectedBooking.bedNumber || '1');
      setBeforePhoto(selectedBooking.beforePhoto || selectedBooking.customerPhoto || null);
    }
  }, [selectedBooking, courses]);

  if (!isOpen) return null;

  // Filter available customer courses
  const customerPhoneClean = selectedBooking ? String(selectedBooking.customerPhone || '').replace(/\D/g, '') : '';
  const customerAvailableCourses = courses.filter(c => {
    const cPhone = String(getFuzzyKey(c, ["เบอร์โทร", "col_1"]) || '').replace(/\D/g, '');
    const remainQty = Number(c.computedRemainQty ?? getFuzzyKey(c, ["ครั้งที่เหลือดิบ", "col_33", "col_4"]) ?? 1);
    const remainCredit = Number(c.computedRemainCredit ?? getFuzzyKey(c, ["เครดิตที่ได้รับ", "col_14"]) ?? 0);
    return cPhone && customerPhoneClean && (cPhone === customerPhoneClean || cPhone.endsWith(customerPhoneClean) || customerPhoneClean.endsWith(cPhone)) && (remainQty > 0 || remainCredit > 0);
  });

  // Filter queue for selection if changing
  const filteredBookings = bookings.filter(b => {
    if (b.status === 'เสร็จสิ้น' || b.status === 'ยกเลิก') return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = String(b.customerName || '').toLowerCase();
    const phone = String(b.customerPhone || '').toLowerCase();
    const ticket = String(b.ticketNo || '').toLowerCase();
    return name.includes(q) || phone.includes(q) || ticket.includes(q);
  });

  const isLineBooking = Boolean(
    selectedBooking?.lineUid || 
    selectedBooking?.source === 'line' || 
    selectedBooking?.channel === 'line' || 
    selectedBooking?.source === 'liff' || 
    selectedBooking?.source === 'LIFF' || 
    (!selectedBooking?.isAdminCreated && !selectedBooking?.isWalkIn && selectedBooking?.source !== 'POS' && selectedBooking?.source !== 'admin')
  );

  // Handle Photo selection and compression
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCapturingPhoto(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 900;
        const MAX_HEIGHT = 900;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL('image/jpeg', 0.75);
        setBeforePhoto(compressed);
        setIsCapturingPhoto(false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitCheckIn = async (goToPos = false) => {
    if (!selectedBooking) return;
    setIsSubmitting(true);
    try {
      const checkInData = {
        courseId: selectedCourse?.id || null,
        courseName: selectedCourse ? (selectedCourse["ชื่อคอส"] || selectedCourse.name) : (selectedBooking.courseName || 'บริการทั่วไป'),
        courseNo: selectedCourse ? (selectedCourse["เลขที่ใบคอส"] || selectedCourse.courseRefKey || selectedCourse.courseNo) : null,
        bedNumber: selectedBed,
        beforePhoto: beforePhoto || null,
        selectedCourseObj: selectedCourse || null
      };

      if (goToPos && onCheckInAndGoToPos) {
        await onCheckInAndGoToPos(selectedBooking, selectedCourse, beforePhoto, selectedBed);
      } else if (onConfirmCheckIn) {
        await onConfirmCheckIn(selectedBooking.id, checkInData);
      }
      onClose();
    } catch (err) {
      console.error("Check-in error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm print:hidden animate-in fade-in duration-150">
      <div className="bg-white rounded-[28px] w-full max-w-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-4 sm:p-5 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
              <Camera size={22} className="text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>เช็คอินเข้าใช้บริการ</span>
                <span className="text-[10px] bg-white/25 px-2 py-0.5 rounded-full font-bold">Smart Queue</span>
              </h3>
              <p className="text-[11px] text-emerald-100 font-medium">
                เลือกคอร์สที่มี ถ่ายรูป Before และเตรียมตัดคอร์ส
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scroll Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* Customer & Booking Info Card */}
          {selectedBooking ? (
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-black text-slate-800">
                      {selectedBooking.customerName || 'ลูกค้าทั่วไป'}
                    </span>
                    {isLineBooking ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-[#06C755]/15 text-[#00993a] border border-[#06C755]/30">
                        <MessageSquare size={10} className="fill-[#06C755]" />
                        <span>จองผ่าน LINE</span>
                      </span>
                    ) : selectedBooking.isWalkIn ? (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-100 text-purple-700 border border-purple-200">
                        🚶 Walk-in
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-slate-200 text-slate-700">
                        👤 หน้าร้าน
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 font-medium flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 font-mono">
                      <Phone size={11} className="text-slate-400" />
                      {selectedBooking.customerPhone || '-'}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={11} className="text-slate-400" />
                      {selectedBooking.branch || globalBranch || 'เฉวง'}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[10px] text-slate-400 font-bold">เวลานัดหมาย</div>
                  <div className="text-sm font-black text-teal-700">
                    {selectedBooking.dateTime ? selectedBooking.dateTime.split('T')[1]?.substring(0, 5) : selectedBooking.time || '-'} น.
                  </div>
                </div>
              </div>

              {/* Course booked originally */}
              <div className="text-[11px] text-slate-600 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <span className="font-medium text-slate-500">บริการที่จองไว้:</span>
                <span className="font-black text-slate-800">{selectedBooking.courseName || 'บริการทั่วไป'}</span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 font-bold text-center">
              กรุณาเลือกลูกค้าหรือคิวนัดหมายที่ต้องการเช็คอิน
            </div>
          )}

          {/* Quick Booking Switcher if multiple bookings */}
          {!preselectedBooking && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ค้นหาหรือเปลี่ยนคิวที่ต้องการเช็คอิน:
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="พิมพ์ชื่อ, เบอร์โทร หรือเลขตั๋ว..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              />
              {filteredBookings.length > 0 && searchQuery && (
                <div className="mt-1.5 max-h-36 overflow-y-auto space-y-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                  {filteredBookings.slice(0, 6).map(b => (
                    <div
                      key={b.id}
                      onClick={() => { setSelectedBooking(b); setSearchQuery(''); }}
                      className="px-2.5 py-1.5 rounded-lg text-xs hover:bg-teal-50 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <span className="font-bold text-slate-800">{b.customerName} ({b.customerPhone})</span>
                      <span className="text-[10px] text-teal-600 font-black">{b.time || b.dateTime?.split('T')[1]?.substring(0, 5)} น.</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 1: Customer Active Courses (Smart Selection) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Scissors size={14} className="text-teal-600" />
                <span>เลือกคอร์สของลูกค้าที่จะใช้รอบนี้:</span>
              </label>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                มี {customerAvailableCourses.length} คอร์ส
              </span>
            </div>

            {customerAvailableCourses.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {customerAvailableCourses.map((c) => {
                  const courseName = c["ชื่อคอส"] || c.name || 'คอร์สทรีตเมนต์';
                  const courseNo = c["เลขที่ใบคอส"] || c.courseRefKey || c.id?.slice(-6);
                  const remainSessions = c.computedRemainQty ?? getFuzzyKey(c, ["ครั้งที่เหลือดิบ", "col_33", "col_4"]) ?? 1;
                  const totalSessions = c["จำนวนครั้งที่ได้"] || c["col_10"] || c.sessions || 1;
                  const usedSessions = c["ครั้งที่ใช้"] || c["col_5"] || 0;
                  const isSelected = selectedCourse?.id === c.id;

                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCourse(c)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isSelected 
                          ? 'bg-teal-50/90 border-teal-500 shadow-sm ring-1 ring-teal-400' 
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-black text-slate-800 truncate" title={courseName}>
                            {courseName}
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="font-mono">เลขที่: {courseNo}</span>
                            <span>•</span>
                            <span>ซื้อเมื่อ: {c["วันที่ซื้อ"] || c["col_3"] || '-'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-block text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ใช้ไป {usedSessions}/{totalSessions} เหลือ {remainSessions}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Option for General Service without cutting course */}
                <div
                  onClick={() => setSelectedCourse(null)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                    selectedCourse === null 
                      ? 'bg-purple-50 border-purple-400 font-bold text-purple-900 ring-1 ring-purple-300' 
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      selectedCourse === null ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-300'
                    }`}>
                      {selectedCourse === null && <span className="w-1 h-1 rounded-full bg-white" />}
                    </div>
                    <span>ไม่ใช้คอร์สเดิม (ทำบริการทั่วไป / ซื้อใหม่หน้าร้าน)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <p className="text-xs text-slate-500 font-bold">
                  ลูกค้ารายนี้ยังไม่มีคอร์สคงเหลือในระบบ
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  ระบบจะเช็คอินเป็นบริการทั่วไปตามที่นัดหมายไว้ ({selectedBooking?.courseName || 'บริการทั่วไป'})
                </p>
              </div>
            )}
          </div>

          {/* SECTION 2: Bed Selection */}
          <div>
            <label className="block text-xs font-black text-slate-800 mb-1.5 flex items-center gap-1.5">
              <Layers size={14} className="text-indigo-600" />
              <span>เลือกเตียงเข้าบริการ:</span>
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {['1', '2', '3', '4', ''].map((bed) => {
                const isSelected = selectedBed === bed;
                return (
                  <button
                    key={bed || 'none'}
                    type="button"
                    onClick={() => setSelectedBed(bed)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {bed ? `เตียง ${bed}` : 'ไม่ระบุ'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: 📸 Before Photo (ถ่ายรูปก่อนทำ) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Camera size={14} className="text-pink-600" />
                <span>ถ่ายรูปก่อนทำ (Before Photo):</span>
              </label>
              {beforePhoto && (
                <button
                  type="button"
                  onClick={() => setBeforePhoto(null)}
                  className="text-[10px] text-rose-500 hover:text-rose-700 font-bold flex items-center gap-0.5"
                >
                  <Trash2 size={11} /> ลบรูป
                </button>
              )}
            </div>

            {beforePhoto ? (
              <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-sm max-w-[200px] mx-auto bg-slate-900 group">
                <img 
                  src={beforePhoto} 
                  alt="Before" 
                  className="w-full h-36 object-cover" 
                />
                <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs">
                  ✓ รูป Before พร้อมแล้ว
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="p-1.5 bg-white text-slate-800 rounded-full shadow"
                    title="ถ่ายใหม่"
                  >
                    <Camera size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setBeforePhoto(null)}
                    className="p-1.5 bg-rose-500 text-white rounded-full shadow"
                    title="ลบ"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="py-3 px-3 bg-pink-50 hover:bg-pink-100 text-pink-700 border-2 border-dashed border-pink-300 rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                >
                  <Camera size={20} className="text-pink-600" />
                  <span>เปิดกล้องถ่าย Before</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-3 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border-2 border-dashed border-slate-300 rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                >
                  <Upload size={20} className="text-slate-500" />
                  <span>เลือกรูปจากเครื่อง</span>
                </button>
              </div>
            )}

            {/* Hidden Inputs */}
            <input 
              ref={cameraInputRef} 
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
              onChange={handlePhotoUpload} 
            />
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handlePhotoUpload} 
            />
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Action 1: Standard Check-in */}
            <button
              type="button"
              disabled={isSubmitting || !selectedBooking}
              onClick={() => handleSubmitCheckIn(false)}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-200 flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 size={16} />
              <span>{isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันเช็คอินเข้าใช้บริการ'}</span>
            </button>

            {/* Action 2: Check-in & Go to POS directly to cut course */}
            <button
              type="button"
              disabled={isSubmitting || !selectedBooking}
              onClick={() => handleSubmitCheckIn(true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-bold text-xs rounded-xl shadow-md shadow-pink-200 flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              title="เช็คอินแล้วส่งต่อไปยังหน้าตัดคอร์สที่ POS ทันที"
            >
              <Scissors size={15} />
              <span>เช็คอิน & ตัดคอสทันที</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}