import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, CheckCircle2, Camera, Upload, Trash2, Sparkles, User, Phone, 
  Clock, MapPin, Calendar, Scissors, ShoppingCart, MessageSquare, 
  ChevronRight, AlertCircle, RefreshCw, Layers, Search, QrCode, Eye
} from 'lucide-react';
import { getFuzzyKey } from '../utils/fuzzy';
import { getLocalYYYYMMDD } from '../utils/parse';
import BarcodeScannerModal from './BarcodeScannerModal';

export default function SmartQueueCheckInModal({
  isOpen,
  onClose,
  preselectedBooking = null,
  bookings = [],
  courses = [],
  customers = [],
  globalBranch = 'เฉวง',
  onConfirmCheckIn,
  onCheckInAndGoToPos,
  onViewCourseDetails,
  onGoToBuyCourse
}) {
  const [selectedBooking, setSelectedBooking] = useState(preselectedBooking);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedBed, setSelectedBed] = useState('1');
  const [beforePhoto, setBeforePhoto] = useState(null);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Close search suggestions and clear query on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync preselected booking
  useEffect(() => {
    if (preselectedBooking) {
      setSelectedBooking(preselectedBooking);
      setSearchQuery('');
    } else if (isOpen) {
      // Find today's upcoming booking if any
      const today = new Date().toISOString().split('T')[0];
      const todayUpcoming = bookings.find(b => {
        const dt = b.dateTime || b.date || '';
        const st = b.status || '';
        return dt.startsWith(today) && (st === 'ยืนยันแล้ว' || st === 'รอการยืนยัน');
      });
      setSelectedBooking(todayUpcoming || null);
      setSearchQuery('');
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

  // Audio Beep Feedback
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch (e) {}
  };

  // 🌟 UNIVERSAL IDENTIFIER: Scans/Searches QR, Phone, Customer ID, HN, Citizen ID, Ticket, Course Sheet
  const handleIdentifyInput = (rawVal) => {
    if (!rawVal || !String(rawVal).trim()) return;
    let val = String(rawVal).trim();
    playBeep();

    // 1. Parse JSON if scanned QR is JSON format
    try {
      const parsed = JSON.parse(val);
      if (parsed && typeof parsed === 'object') {
        val = parsed.customerId || parsed.phone || parsed.bookingId || parsed.courseId || parsed.code || parsed.ticketNo || val;
      }
    } catch (e) {}

    const valClean = String(val).trim();
    const valDigits = valClean.replace(/\D/g, '');
    const valLower = valClean.toLowerCase();

    // 2. Check in Bookings (by id, ticketNo, bookingRef, phone, name)
    const matchedBooking = bookings.find(b => {
      const bId = String(b.id || '').toLowerCase();
      const bTicket = String(b.ticketNo || '').toLowerCase();
      const bRef = String(b.bookingRef || '').toLowerCase();
      const bPhoneClean = String(b.customerPhone || '').replace(/\D/g, '');
      const bName = String(b.customerName || '').toLowerCase();

      return bId === valLower || 
             bTicket === valLower || 
             bRef === valLower || 
             (valDigits.length >= 8 && bPhoneClean && (bPhoneClean === valDigits || bPhoneClean.endsWith(valDigits) || valDigits.endsWith(bPhoneClean))) ||
             (valLower.length >= 3 && bName.includes(valLower));
    });

    if (matchedBooking) {
      setSelectedBooking(matchedBooking);
      setSearchQuery('');
      setIsScannerOpen(false);
      setFeedbackMessage(`✓ พบคิวนัดหมายของคุณ ${matchedBooking.customerName}`);
      setTimeout(() => setFeedbackMessage(''), 3000);
      return;
    }

    // 3. Check in Courses (e.g. Scanned A4 Course sheet QR or course reference)
    const matchedCourse = courses.find(c => {
      const cRef = String(c.courseRefKey || '').toLowerCase();
      const cNo = String(getFuzzyKey(c, ["เลขที่ใบคอส", "col_2"]) || '').toLowerCase();
      const cId = String(c.id || '').toLowerCase();
      return (cRef && cRef === valLower) || (cNo && cNo === valLower) || (cId && cId === valLower);
    });

    if (matchedCourse) {
      const cPhone = String(getFuzzyKey(matchedCourse, ["เบอร์โทร", "col_1"]) || '').replace(/\D/g, '');
      const cCustName = String(getFuzzyKey(matchedCourse, ["ผู้ซื้อคอส", "ชื่อลูกค้า", "col_9", "col_2"]) || 'ลูกค้า');

      const matchedCust = customers.find(cust => {
        const p = String(cust.computedPhone || cust.phone || '').replace(/\D/g, '');
        return p && cPhone && (p === cPhone || p.endsWith(cPhone) || cPhone.endsWith(p));
      });

      const existingBk = bookings.find(b => {
        const bPhoneClean = String(b.customerPhone || '').replace(/\D/g, '');
        return bPhoneClean && cPhone && (bPhoneClean === cPhone || bPhoneClean.endsWith(cPhone) || cPhone.endsWith(bPhoneClean));
      });

      if (existingBk) {
        setSelectedBooking(existingBk);
        setSelectedCourse(matchedCourse);
        setFeedbackMessage(`✓ พบใบคอร์สและคิวของคุณ ${existingBk.customerName}`);
      } else {
        const now = new Date();
        const walkInBooking = {
          id: `walkin_${Date.now()}`,
          customerName: matchedCust ? (matchedCust.name || matchedCust.computedName) : cCustName,
          customerPhone: cPhone,
          customerId: matchedCust?.id || '',
          branch: globalBranch || 'เฉวง',
          isWalkIn: true,
          courseName: matchedCourse["ชื่อคอส"] || matchedCourse.name || 'บริการทั่วไป',
          dateTime: now.toISOString(),
          date: getLocalYYYYMMDD(now),
          time: now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
          status: 'รอการยืนยัน',
          isVirtualWalkIn: true
        };
        setSelectedBooking(walkInBooking);
        setSelectedCourse(matchedCourse);
        setFeedbackMessage(`✓ พบใบคอร์สของคุณ ${walkInBooking.customerName} (ตั้งเป็น Walk-in พร้อมตัดคอส)`);
      }

      setSearchQuery('');
      setIsScannerOpen(false);
      setTimeout(() => setFeedbackMessage(''), 3000);
      return;
    }

    // 4. Check in Customer Database (Member Card QR, Phone, Customer ID, HN, Citizen ID 13 digits)
    const matchedCustomer = customers.find(c => {
      const cId = String(c.id || '').toLowerCase();
      const cNo = String(c.customerNo || c.memberCardNo || '').toLowerCase();
      const cHn = String(c.hn || '').toLowerCase();
      const cIdCard = String(c.idCard || c.citizenId || '').replace(/\D/g, '');
      const cPhoneClean = String(c.computedPhone || c.phone || '').replace(/\D/g, '');
      const cName = String(c.computedName || c.name || '').toLowerCase();

      return cId === valLower || 
             (cNo && cNo === valLower) || 
             (cHn && cHn === valLower) ||
             (valDigits.length === 13 && cIdCard === valDigits) ||
             (valDigits.length >= 8 && cPhoneClean && (cPhoneClean === valDigits || cPhoneClean.endsWith(valDigits) || valDigits.endsWith(cPhoneClean))) ||
             (valLower.length >= 3 && cName.includes(valLower));
    });

    if (matchedCustomer) {
      const cPhone = String(matchedCustomer.computedPhone || matchedCustomer.phone || '').replace(/\D/g, '');
      const existingBk = bookings.find(b => {
        const bPhoneClean = String(b.customerPhone || '').replace(/\D/g, '');
        return bPhoneClean && cPhone && (bPhoneClean === cPhone || bPhoneClean.endsWith(cPhone) || cPhone.endsWith(bPhoneClean));
      });

      if (existingBk) {
        setSelectedBooking(existingBk);
        setFeedbackMessage(`✓ พบคิวนัดหมายของคุณ ${matchedCustomer.name || matchedCustomer.computedName}`);
      } else {
        const now = new Date();
        const walkInBooking = {
          id: `walkin_${Date.now()}`,
          customerName: matchedCustomer.name || matchedCustomer.computedName || 'ลูกค้า Walk-in',
          customerPhone: matchedCustomer.phone || matchedCustomer.computedPhone || '',
          customerId: matchedCustomer.id,
          branch: globalBranch || 'เฉวง',
          isWalkIn: true,
          courseName: 'บริการทั่วไป (Walk-in)',
          dateTime: now.toISOString(),
          date: getLocalYYYYMMDD(now),
          time: now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
          status: 'รอการยืนยัน',
          isVirtualWalkIn: true
        };
        setSelectedBooking(walkInBooking);
        setFeedbackMessage(`✓ พบข้อมูลสมาชิกคุณ ${walkInBooking.customerName} (ตั้งเป็น Walk-in)`);
      }

      setSearchQuery('');
      setIsScannerOpen(false);
      setTimeout(() => setFeedbackMessage(''), 3000);
      return;
    }

    // 5. Fallback: Digits entered as phone number
    if (valDigits.length >= 9) {
      const now = new Date();
      const walkInBooking = {
        id: `walkin_${Date.now()}`,
        customerName: `ลูกค้า ${valDigits}`,
        customerPhone: valDigits,
        branch: globalBranch || 'เฉวง',
        isWalkIn: true,
        courseName: 'บริการทั่วไป (Walk-in)',
        dateTime: now.toISOString(),
        date: getLocalYYYYMMDD(now),
        time: now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        status: 'รอการยืนยัน',
        isVirtualWalkIn: true
      };
      setSelectedBooking(walkInBooking);
      setSearchQuery('');
      setIsScannerOpen(false);
      setFeedbackMessage(`✓ ระบุเบอร์ ${valDigits} สำหรับเช็คอิน Walk-in`);
      setTimeout(() => setFeedbackMessage(''), 3000);
      return;
    }

    setFeedbackMessage(`⚠️ ไม่พบข้อมูลที่ตรงกับ "${rawVal}"`);
    setTimeout(() => setFeedbackMessage(''), 4000);
  };

  // Autocomplete matching lists while typing
  const matchingBookings = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    const qDigits = q.replace(/\D/g, '');
    return bookings.filter(b => {
      if (b.status === 'เสร็จสิ้น' || b.status === 'ยกเลิก') return false;
      const name = String(b.customerName || '').toLowerCase();
      const phone = String(b.customerPhone || '').replace(/\D/g, '');
      const ticket = String(b.ticketNo || '').toLowerCase();
      const id = String(b.id || '').toLowerCase();
      return name.includes(q) || (qDigits && phone.includes(qDigits)) || ticket.includes(q) || id.includes(q);
    }).slice(0, 5);
  }, [bookings, searchQuery]);

  const matchingCustomers = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    const qDigits = q.replace(/\D/g, '');
    return customers.filter(c => {
      const name = String(c.name || c.computedName || '').toLowerCase();
      const phone = String(c.phone || c.computedPhone || '').replace(/\D/g, '');
      const memberNo = String(c.memberCardNo || c.customerNo || '').toLowerCase();
      const hn = String(c.hn || '').toLowerCase();
      const idCard = String(c.idCard || c.citizenId || '').replace(/\D/g, '');
      return name.includes(q) || (qDigits && phone.includes(qDigits)) || memberNo.includes(q) || hn.includes(q) || (qDigits && idCard.includes(qDigits));
    }).slice(0, 5);
  }, [customers, searchQuery]);

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
            width = MAX_HEIGHT;
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
        selectedCourseObj: selectedCourse || null,
        customerName: selectedBooking.customerName,
        customerPhone: selectedBooking.customerPhone,
        isVirtualWalkIn: selectedBooking.isVirtualWalkIn || false
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

  if (!isOpen) return null;

  // Filter available customer courses
  const customerPhoneClean = selectedBooking ? String(selectedBooking.customerPhone || '').replace(/\D/g, '') : '';
  const customerAvailableCourses = courses.filter(c => {
    const cPhone = String(getFuzzyKey(c, ["เบอร์โทร", "col_1"]) || '').replace(/\D/g, '');
    const remainQty = Number(c.computedRemainQty ?? getFuzzyKey(c, ["ครั้งที่เหลือดิบ", "col_33", "col_4"]) ?? 1);
    const remainCredit = Number(c.computedRemainCredit ?? getFuzzyKey(c, ["เครดิตที่ได้รับ", "col_14"]) ?? 0);
    return cPhone && customerPhoneClean && (cPhone === customerPhoneClean || cPhone.endsWith(customerPhoneClean) || customerPhoneClean.endsWith(cPhone)) && (remainQty > 0 || remainCredit > 0);
  });

  const isLineBooking = Boolean(
    selectedBooking?.lineUid || 
    selectedBooking?.source === 'line' || 
    selectedBooking?.channel === 'line' || 
    selectedBooking?.source === 'liff' || 
    selectedBooking?.source === 'LIFF' || 
    (!selectedBooking?.isAdminCreated && !selectedBooking?.isWalkIn && selectedBooking?.source !== 'POS' && selectedBooking?.source !== 'admin')
  );

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
                สแกน QR ลูกค้า / ใบคอร์ส • เลือกคอร์ส • ถ่ายรูป Before
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scroll Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">

          {/* Feedback notification toast inside modal */}
          {feedbackMessage && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs font-black text-emerald-800 flex items-center gap-2 animate-in fade-in">
              <Sparkles size={15} className="text-emerald-600 shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
          )}
          
          {/* 🌟 Universal Customer & Booking Search / Scan Bar */}
          <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl space-y-2" ref={searchContainerRef}>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Search size={14} className="text-teal-600" />
                <span>ระบุตัวตนลูกค้า (สแกน QR / พิมพ์เบอร์ / รหัส / ชื่อ):</span>
              </label>
              {selectedBooking && (
                <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 font-bold">
                  ✓ ระบุตัวตนแล้ว
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => {
                    setTimeout(() => {
                      if (searchContainerRef.current && !searchContainerRef.current.contains(document.activeElement)) {
                        setSearchQuery('');
                      }
                    }, 200);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleIdentifyInput(searchQuery);
                    }
                  }}
                  placeholder="สแกน หรือพิมพ์ เบอร์โทร, เลขตั๋ว, รหัสสมาชิก, เลขบัตร ปชช., ชื่อ..."
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500 bg-white shadow-2xs font-medium"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-teal-200 active:scale-95 transition-all shrink-0 cursor-pointer"
                title="เปิดกล้องสแกน QR Code หรือบาร์โค้ด"
              >
                <QrCode size={16} />
                <span>สแกน QR</span>
              </button>
            </div>

            {/* Dropdown search suggestions when typing */}
            {searchQuery.trim().length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-1 bg-white border border-slate-200 rounded-xl p-1.5 shadow-md">
                {/* Bookings matches */}
                {matchingBookings.length > 0 && (
                  <div>
                    <div className="text-[9px] font-black uppercase text-slate-400 px-2 py-0.5">คิวนัดหมายที่ตรงกัน:</div>
                    {matchingBookings.map(b => (
                      <div
                        key={b.id}
                        onClick={() => { setSelectedBooking(b); setSearchQuery(''); }}
                        className="px-2.5 py-1.5 rounded-lg text-xs hover:bg-teal-50 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div>
                          <span className="font-black text-slate-800">{b.customerName}</span>
                          <span className="text-[11px] text-slate-500 font-mono ml-1.5">({b.customerPhone})</span>
                        </div>
                        <span className="text-[10px] text-teal-700 font-black bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                          {b.time || b.dateTime?.split('T')[1]?.substring(0, 5)} น.
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Customers matches */}
                {matchingCustomers.length > 0 && (
                  <div className="pt-1 border-t border-slate-100">
                    <div className="text-[9px] font-black uppercase text-slate-400 px-2 py-0.5">ลูกค้าในระบบ (Customer DB):</div>
                    {matchingCustomers.map(cust => (
                      <div
                        key={cust.id}
                        onClick={() => { handleIdentifyInput(cust.phone || cust.id); setSearchQuery(''); }}
                        className="px-2.5 py-1.5 rounded-lg text-xs hover:bg-indigo-50 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div>
                          <span className="font-black text-indigo-900">{cust.name || cust.computedName}</span>
                          {cust.computedNickname && <span className="text-xs font-bold text-indigo-600 ml-1">({cust.computedNickname})</span>}
                          <span className="text-[11px] text-slate-500 font-mono ml-1.5">({cust.phone || cust.computedPhone})</span>
                          {cust.memberCardNo && <span className="text-[9px] text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded ml-1">#{cust.memberCardNo}</span>}
                        </div>
                        <span className="text-[10px] text-indigo-700 font-bold">
                          เลือกลูกค้า ↗
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {matchingBookings.length === 0 && matchingCustomers.length === 0 && (
                  <div className="p-2 text-center text-xs text-slate-500">
                    <span>ไม่พบข้อมูลที่ตรงกัน </span>
                    {searchQuery.replace(/\D/g, '').length >= 9 && (
                      <button
                        type="button"
                        onClick={() => handleIdentifyInput(searchQuery)}
                        className="text-xs text-teal-600 font-bold underline ml-1 cursor-pointer"
                      >
                        เช็คอินเป็น Walk-in ด้วยเบอร์นี้ทันที
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

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
                <span className="font-medium text-slate-500">บริการที่นัดหมายไว้:</span>
                <span className="font-black text-slate-800">{selectedBooking.courseName || 'บริการทั่วไป'}</span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 font-bold text-center">
              กรุณากดปุ่ม <strong>[ สแกน QR ]</strong> หรือพิมพ์เบอร์โทร/ชื่อ เพื่อระบุตัวตนลูกค้า
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

            {/* 🌟 1. อันดับแรกสุด: "ไม่ใช้คอร์สเดิม (ทำบริการทั่วไป / ซื้อใหม่หน้าร้าน)" พร้อมปุ่มรถเข็นไปหน้าซื้อคอร์สใน POS */}
            <div
              onClick={() => setSelectedCourse(null)}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                selectedCourse === null 
                  ? 'bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-purple-400 font-bold text-purple-950 ring-2 ring-purple-300 shadow-sm' 
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                  selectedCourse === null ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-300 bg-white'
                }`}>
                  {selectedCourse === null && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-slate-900 truncate">
                    ไม่ใช้คอร์สเดิม (ทำบริการทั่วไป / ซื้อใหม่หน้าร้าน)
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    ทำบริการทั่วไป หรือเปิดบิลซื้อคอร์สใหม่ที่ POS
                  </div>
                </div>
              </div>

              {/* 🛒 ปุ่มรถเข็นไปหน้าซื้อคอร์สใน POS */}
              {onGoToBuyCourse && selectedBooking && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                    onGoToBuyCourse(selectedBooking);
                  }}
                  className="px-2.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-[11px] font-black flex items-center gap-1.5 shadow-md shadow-purple-200 shrink-0 active:scale-95 transition-all cursor-pointer"
                  title="เปิดหน้า POS เพื่อซื้อคอร์สใหม่ให้ลูกค้าทันที"
                >
                  <ShoppingCart size={13} />
                  <span>ซื้อคอร์สใน POS ↗</span>
                </button>
              )}
            </div>

            {/* 🌟 2. รายการคอร์สที่ลูกค้ามีคงเหลือในระบบ */}
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

                      <div className="text-right shrink-0 flex items-center gap-1.5">
                        <span className="inline-block text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ใช้ไป {usedSessions}/{totalSessions} เหลือ {remainSessions}
                        </span>
                        {onViewCourseDetails && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewCourseDetails(c);
                            }}
                            className="p-1 rounded-lg text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 border border-indigo-100 shadow-2xs cursor-pointer"
                            title="ดูรายละเอียดใบคอร์ส"
                          >
                            <Eye size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-center">
                <p className="text-xs text-slate-500 font-bold">
                  ลูกค้ารายนี้ยังไม่มีคอร์สคงเหลือในระบบ
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  ระบบจะเช็คอินเป็นบริการทั่วไป ({selectedBooking?.courseName || 'บริการทั่วไป'}) หรือกดปุ่ม 🛒 เพื่อซื้อคอร์สใหม่ใน POS
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
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all border cursor-pointer ${
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
                  className="text-[10px] text-rose-500 hover:text-rose-700 font-bold flex items-center gap-0.5 cursor-pointer"
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
                    className="p-1.5 bg-white text-slate-800 rounded-full shadow cursor-pointer"
                    title="ถ่ายใหม่"
                  >
                    <Camera size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setBeforePhoto(null)}
                    className="p-1.5 bg-rose-500 text-white rounded-full shadow cursor-pointer"
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

            {/* Action 2: Check-in & Go to POS directly to cut course or buy course */}
            <button
              type="button"
              disabled={isSubmitting || !selectedBooking}
              onClick={() => handleSubmitCheckIn(true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-bold text-xs rounded-xl shadow-md shadow-pink-200 flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              title={selectedCourse ? "เช็คอินแล้วส่งต่อไปยังหน้าตัดคอร์สที่ POS ทันที" : "เช็คอินแล้วส่งต่อไปยังหน้า POS ซื้อคอร์สทันที"}
            >
              {selectedCourse ? <Scissors size={15} /> : <ShoppingCart size={15} />}
              <span>{selectedCourse ? 'เช็คอิน & ตัดคอสทันที' : 'เช็คอิน & ซื้อคอร์ส (POS)'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* 📷 Built-in Camera Scanner Modal */}
      {isScannerOpen && (
        <BarcodeScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScan={(scannedText) => {
            handleIdentifyInput(scannedText);
          }}
        />
      )}

    </div>
  );
}
