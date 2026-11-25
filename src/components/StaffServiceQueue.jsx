import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Scissors, Camera, CheckCircle, Clock, Trash2, Plus, 
  User, Check, Sparkles, ChevronRight, X, AlertCircle, Search,
  Calendar, Phone, ArrowRight, Image as ImageIcon, RefreshCw,
  CheckSquare, Square, BedDouble, UserCheck, Flame
} from 'lucide-react';
import { db } from '../config/firebase';
import { collection, doc, writeBatch, deleteDoc, updateDoc } from 'firebase/firestore';
import imageCompression from 'browser-image-compression';
import SignaturePad from './SignaturePad';
import { HAND_FEE_PRESETS } from '../utils/handFeePresets';
import { getLocalYYYYMMDD } from '../utils/parse';
import { getFuzzyKey } from '../utils/fuzzy';

export default function StaffServiceQueue({
  activeServices = [],
  courses = [],
  customers = [],
  employees = [],
  clockedInEmployees = [],
  activeStaff = null,
  globalBranch = '',
  showToast = () => {},
  onGoToPosDeduction = () => {}
}) {
  const [timerNow, setTimerNow] = useState(Date.now());
  const [isProcessing, setIsProcessing] = useState(false);

  // Customer search & selection
  const [custSearchQuery, setCustSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);

  // Check-In Modal state (ถ่ายรูปก่อนทำ แล้วกดเช็คอิน)
  const [checkInModal, setCheckInModal] = useState({
    isOpen: false,
    courses: [],
    customer: null,
    staffName: '',
    beforePhotos: [],
    bedNumber: '',
    note: ''
  });

  // Finish Service Modal state (ตัดยอดที่นี่ - ทางเลือกสำรอง)
  const [finishModalService, setFinishModalService] = useState(null);
  const [selectedStaffNames, setSelectedStaffNames] = useState('');
  const [selectedHandFees, setSelectedHandFees] = useState([]);
  const [finishPhotos, setFinishPhotos] = useState({ before: [], after: [] });
  const custSigRef = useRef(null);
  const staffSigRef = useRef(null);

  // Interval timer for live in-service elapsed time
  useEffect(() => {
    const timer = setInterval(() => setTimerNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const getServiceElapsedStr = (startTime) => {
    if (!startTime) return 'เพิ่งเริ่ม';
    const diffMs = Math.max(0, timerNow - Number(startTime));
    const mins = Math.floor(diffMs / 60000);
    const startTimeFormatted = new Date(startTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    if (mins === 0) return `เริ่ม ${startTimeFormatted} • เพิ่งเริ่ม`;
    return `เริ่ม ${startTimeFormatted} • ${mins} นาที`;
  };

  // Filter active services for this branch and non-completed
  const pendingServices = useMemo(() => {
    return activeServices.filter(s => {
      const isCompleted = s.status === 'เรียบร้อย';
      const isMatchBranch = !globalBranch || !s.branch || s.branch === globalBranch;
      return !isCompleted && isMatchBranch;
    });
  }, [activeServices, globalBranch]);

  // Search matching customers
  const filteredCustomerSuggestions = useMemo(() => {
    const q = custSearchQuery.trim().toLowerCase();
    if (!q) return [];
    const cleanQ = q.replace(/\D/g, '');

    return customers.filter(c => {
      const cName = String(c.computedName || c.name || getFuzzyKey(c, ["ชื่อ", "col_1"]) || '').toLowerCase();
      const cPhone = String(c.computedPhone || c.phone || getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '').trim();
      const cleanPhone = cPhone.replace(/\D/g, '');
      const cNick = String(c.nickname || getFuzzyKey(c, ["ชื่อเล่น"]) || '').toLowerCase();

      if (cleanQ && cleanPhone.includes(cleanQ)) return true;
      if (cName.includes(q) || cNick.includes(q)) return true;
      return false;
    }).slice(0, 10);
  }, [custSearchQuery, customers]);

  // Helper to find all courses belonging to a specific customer
  const getCustomerCourses = useCallback((cust) => {
    if (!cust) return [];
    const phone = String(cust.computedPhone || cust.phone || getFuzzyKey(cust, ["เบอร์โทร", "col_3"]) || '').trim();
    const cleanPhone = phone.replace(/\D/g, '');
    const name = String(cust.computedName || cust.name || getFuzzyKey(cust, ["ชื่อ", "col_1"]) || '').trim().toLowerCase();

    return (courses || []).filter(c => {
      const courseName = String(getFuzzyKey(c, ["ชื่อคอส", "ชื่อคอร์ส", "col_8"]) || c.name || '').toLowerCase();
      const isCreditCourse = courseName.includes('วงเงิน') || courseName.includes('เติมเงิน') || courseName.includes('เครดิต') || courseName.includes('voucher') || courseName.includes('บัตรกำนัล') || courseName.includes('ฝากเงิน');
      if (isCreditCourse) return false;

      const courseBuyer = String(getFuzzyKey(c, ["ผู้ซื้อคอส", "col_9"]) || '').trim().toLowerCase();
      const coursePhone = String(getFuzzyKey(c, ["เบอร์โทร", "col_1"]) || '').trim();
      const cleanCoursePhone = coursePhone.replace(/\D/g, '');

      let isMatch = false;
      if (cleanPhone && cleanCoursePhone && (cleanPhone === cleanCoursePhone || (cleanPhone.length >= 9 && cleanCoursePhone.includes(cleanPhone)))) {
        isMatch = true;
      } else if (name && !name.includes('ลูกค้าทั่วไป') && courseBuyer === name) {
        isMatch = true;
      }
      return isMatch;
    });
  }, [courses]);

  // Courses of currently selected customer
  const customerAvailableCourses = useMemo(() => {
    if (!selectedCustomer) return [];
    const allCourses = getCustomerCourses(selectedCustomer);
    // Show remaining courses
    return allCourses.filter(c => Number(c.computedRemainQty || 0) > 0 && c.computedStatus !== 'ใช้ครบแล้ว');
  }, [selectedCustomer, getCustomerCourses]);

  // Quick list of customers who currently have remaining courses
  const customersWithRemainingCourses = useMemo(() => {
    return (customers || []).map(cust => {
      const custCourses = getCustomerCourses(cust);
      const remainCount = custCourses.filter(c => Number(c.computedRemainQty || 0) > 0 && c.computedStatus !== 'ใช้ครบแล้ว').length;
      return { ...cust, remainCourseCount: remainCount };
    }).filter(c => c.remainCourseCount > 0).slice(0, 15);
  }, [customers, getCustomerCourses]);

  // Handle select / unselect course
  const toggleSelectCourse = (courseId) => {
    setSelectedCourseIds(prev => 
      prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
    );
  };

  // Open Check-In Modal for single or multiple courses
  const handleOpenCheckInModal = (targetCourses) => {
    if (!targetCourses || targetCourses.length === 0) {
      showToast('กรุณาเลือกคอร์สที่ต้องการเช็คอิน', 'error');
      return;
    }
    const defaultStaff = activeStaff?.name || clockedInEmployees[0]?.name || employees[0]?.name || '';
    setCheckInModal({
      isOpen: true,
      courses: targetCourses,
      customer: selectedCustomer,
      staffName: defaultStaff,
      beforePhotos: [],
      bedNumber: '',
      note: ''
    });
  };

  // Capture Before Photo in Check-In Modal
  const handleCheckInPhotoCapture = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      const compressedResults = await Promise.all(files.map(async file => {
        try {
          const comp = await imageCompression(file, { maxSizeMB: 0.25, maxWidthOrHeight: 1200, useWebWorker: true });
          return new Promise(res => {
            const reader = new FileReader();
            reader.onload = ev => res(ev.target.result);
            reader.readAsDataURL(comp);
          });
        } catch {
          return new Promise(res => {
            const reader = new FileReader();
            reader.onload = ev => res(ev.target.result);
            reader.readAsDataURL(file);
          });
        }
      }));

      setCheckInModal(prev => ({
        ...prev,
        beforePhotos: [...prev.beforePhotos, ...compressedResults]
      }));
      showToast(`📸 บันทึกรูปก่อนทำ (Before) ${compressedResults.length} รูปเรียบร้อย`, 'success');
    } catch (err) {
      console.error('Check-in photo error:', err);
      showToast('ไม่สามารถอัปโหลดรูปภาพได้', 'error');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Confirm Check-In -> Save to active_services Firestore & start timer
  const handleConfirmCheckIn = async () => {
    if (!checkInModal.courses || checkInModal.courses.length === 0) return;
    const cust = checkInModal.customer || selectedCustomer;
    const custName = cust?.computedName || cust?.name || 'ลูกค้าทั่วไป';
    const custPhone = cust?.computedPhone || cust?.phone || '-';

    try {
      setIsProcessing(true);
      const batch = writeBatch(db);
      const startTimeNow = Date.now();
      const nowIso = new Date().toISOString();

      checkInModal.courses.forEach(c => {
        const activeDocRef = doc(collection(db, 'active_services'));
        const cName = String(getFuzzyKey(c, ["ชื่อคอส", "col_8"]) || c.name || 'คอร์สบริการ');
        const cNo = String(getFuzzyKey(c, ["เลขที่ใบคอส", "col_2"]) || getFuzzyKey(c, ["รหัสคอส", "col_1"]) || '');

        batch.set(activeDocRef, {
          courseId: c.id,
          courseDocId: c.id,
          courseName: cName,
          courseNo: cNo,
          customerId: cust?.id || '',
          customerName: custName,
          customerPhone: custPhone,
          qty: 1,
          branch: String(globalBranch || 'เฉวง'),
          status: 'กำลังให้บริการ',
          startTime: startTimeNow,
          beforePhotos: checkInModal.beforePhotos || [],
          afterPhotos: [],
          staffName: checkInModal.staffName || '',
          bedNumber: checkInModal.bedNumber || '',
          note: checkInModal.note || '',
          createdAt: nowIso,
          updatedAt: nowIso
        });
      });

      await batch.commit();

      showToast(`✅ เช็คอินเริ่มบริการ ${checkInModal.courses.length} คอร์สเรียบร้อย! เริ่มจับเวลาทันที`, 'success');
      setSelectedCourseIds([]);
      setCheckInModal({
        isOpen: false,
        courses: [],
        customer: null,
        staffName: '',
        beforePhotos: [],
        bedNumber: '',
        note: ''
      });
    } catch (err) {
      console.error('Confirm check-in error:', err);
      showToast('เกิดข้อผิดพลาดในการเช็คอิน', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Upload additional Before photo directly on active card
  const handleUploadBeforeOnCard = async (service, e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      const results = await Promise.all(files.map(async file => {
        try {
          const comp = await imageCompression(file, { maxSizeMB: 0.25, maxWidthOrHeight: 1200, useWebWorker: true });
          return new Promise(res => {
            const reader = new FileReader();
            reader.onload = ev => res(ev.target.result);
            reader.readAsDataURL(comp);
          });
        } catch {
          return new Promise(res => {
            const reader = new FileReader();
            reader.onload = ev => res(ev.target.result);
            reader.readAsDataURL(file);
          });
        }
      }));

      const serviceDocRef = doc(db, 'active_services', service.id);
      await updateDoc(serviceDocRef, {
        beforePhotos: [...(service.beforePhotos || []), ...results],
        updatedAt: new Date().toISOString()
      });

      showToast('📸 เพิ่มรูปก่อนทำ (Before) เรียบร้อย', 'success');
    } catch (err) {
      console.error('Before photo error:', err);
      showToast('ไม่สามารถอัปโหลดรูปภาพได้', 'error');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Upload After photo on active card
  const handleUploadAfterOnCard = async (service, e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      const results = await Promise.all(files.map(async file => {
        try {
          const comp = await imageCompression(file, { maxSizeMB: 0.25, maxWidthOrHeight: 1200, useWebWorker: true });
          return new Promise(res => {
            const reader = new FileReader();
            reader.onload = ev => res(ev.target.result);
            reader.readAsDataURL(comp);
          });
        } catch {
          return new Promise(res => {
            const reader = new FileReader();
            reader.onload = ev => res(ev.target.result);
            reader.readAsDataURL(file);
          });
        }
      }));

      const serviceDocRef = doc(db, 'active_services', service.id);
      await updateDoc(serviceDocRef, {
        afterPhotos: [...(service.afterPhotos || []), ...results],
        updatedAt: new Date().toISOString()
      });

      showToast('📸 บันทึกรูปหลังทำ (After) สำเร็จ!', 'success');
    } catch (err) {
      console.error('After photo error:', err);
      showToast('ไม่สามารถอัปโหลดรูปภาพได้', 'error');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Cancel / Delete a service queue item
  const handleDeleteQueue = async (service) => {
    if (!window.confirm(`ต้องการยกเลิกคิว "${service.courseName}" ของ ${service.customerName} หรือไม่?`)) return;
    try {
      await deleteDoc(doc(db, 'active_services', service.id));
      showToast('ยกเลิกคิวรับบริการเรียบร้อย', 'info');
    } catch (err) {
      console.error('Delete queue error:', err);
      showToast('เกิดข้อผิดพลาดในการยกเลิกคิว', 'error');
    }
  };

  // Trigger navigation to POS to deduct course(s)
  const handleProceedToPosDeduction = (serviceOrCourses, cust = null) => {
    let targetCourses = [];
    let targetCust = cust || selectedCustomer;
    let beforePhotos = [];
    let afterPhotos = [];
    let activeServiceId = null;

    if (Array.isArray(serviceOrCourses)) {
      targetCourses = serviceOrCourses;
    } else if (serviceOrCourses && serviceOrCourses.id) {
      activeServiceId = serviceOrCourses.id;
      beforePhotos = serviceOrCourses.beforePhotos || [];
      afterPhotos = serviceOrCourses.afterPhotos || [];

      // Find original course doc
      const targetCourseId = serviceOrCourses.courseDocId || serviceOrCourses.courseId;
      const matched = courses.find(c => c.id === targetCourseId);
      if (matched) {
        targetCourses = [matched];
      } else {
        targetCourses = [{
          id: targetCourseId,
          name: serviceOrCourses.courseName,
          code: serviceOrCourses.courseNo,
          computedRemainQty: 1
        }];
      }

      if (!targetCust) {
        targetCust = customers.find(c => 
          c.id === serviceOrCourses.customerId || 
          String(c.computedPhone || c.phone || '').trim() === String(serviceOrCourses.customerPhone || '').trim()
        ) || {
          id: serviceOrCourses.customerId || '',
          name: serviceOrCourses.customerName,
          computedName: serviceOrCourses.customerName,
          phone: serviceOrCourses.customerPhone,
          computedPhone: serviceOrCourses.customerPhone
        };
      }
    }

    if (targetCourses.length === 0) {
      showToast('ไม่พบคอร์สที่ต้องการตัดยอด', 'error');
      return;
    }

    onGoToPosDeduction({
      customer: targetCust,
      courses: targetCourses,
      activeServiceId,
      beforePhotos,
      afterPhotos,
      staffName: activeStaff?.name || serviceOrCourses?.staffName || ''
    });
  };

  // Finish directly here (Secondary option)
  const handleOpenFinishModal = (service) => {
    setFinishModalService(service);
    const initialStaff = activeStaff?.name || (clockedInEmployees[0]?.name) || '';
    setSelectedStaffNames(initialStaff);
    setSelectedHandFees([]);
    setFinishPhotos({
      before: service.beforePhotos || [],
      after: service.afterPhotos || []
    });
  };

  const toggleHandFee = (preset) => {
    setSelectedHandFees(prev => {
      const existing = prev.find(h => h.id === preset.id);
      if (existing) {
        return prev.filter(h => h.id !== preset.id);
      } else {
        return [...prev, { ...preset, qty: 1 }];
      }
    });
  };



  const totalHandFee = selectedHandFees.reduce((sum, h) => sum + ((Number(h.fee) || 50) * (Number(h.qty) || 1)), 0);

  const handleConfirmFinishService = async () => {
    if (!finishModalService) return;
    if (!selectedStaffNames) {
      showToast('กรุณาเลือกพนักงานผู้ให้บริการ', 'error');
      return;
    }

    const custSigned = custSigRef.current?.dataset?.isSigned === "true";
    const staffSigned = staffSigRef.current?.dataset?.isSigned === "true";
    if (!custSigned || !staffSigned) {
      showToast('กรุณาให้ลูกค้าและพนักงานเซ็นชื่อให้ครบถ้วนก่อนยืนยัน', 'error');
      return;
    }

    try {
      setIsProcessing(true);
      const batch = writeBatch(db);
      const now = new Date();
      const todayIso = getLocalYYYYMMDD();
      const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

      const targetCourseId = finishModalService.courseDocId || finishModalService.courseId;
      const courseDoc = courses.find(c => c.id === targetCourseId);
      
      const deductQty = Number(finishModalService.qty) || 1;
      let newUsed = deductQty;
      let newRemain = 0;
      let newStatus = 'ยังคงเหลือ';

      if (courseDoc) {
        const curUsed = Number(getFuzzyKey(courseDoc, ["ครั้งที่ใช้", "col_7", "used"]) || 0);
        const totalSessions = Number(getFuzzyKey(courseDoc, ["จำนวนครั้ง", "col_6", "total"]) || 1);
        newUsed = curUsed + deductQty;
        newRemain = Math.max(0, totalSessions - newUsed);
        newStatus = newRemain <= 0 ? 'ใช้ครบแล้ว' : 'ยังคงเหลือ';

        const courseRef = doc(db, 'courses', courseDoc.id);
        batch.update(courseRef, {
          "ครั้งที่ใช้": String(newUsed),
          "สถานะ": newStatus,
          updatedAt: now.toISOString()
        });
      }

      const historyRef = doc(collection(db, 'histories'));
      const custSigUrl = custSigRef.current?.toDataURL('image/png') || null;
      const staffSigUrl = staffSigRef.current?.toDataURL('image/png') || null;

      batch.set(historyRef, {
        "วันที่": now.toLocaleDateString('th-TH'),
        date: todayIso,
        "เวลา": timeStr,
        "ชื่อลูกค้า": finishModalService.customerName,
        "เบอร์โทร": finishModalService.customerPhone,
        "รายการ": finishModalService.courseName,
        "ประเภท": "รับบริการ",
        "สถานะ": "เรียบร้อย",
        "จำนวนครั้ง": deductQty,
        "จำนวน": String(deductQty),
        "เลขที่ใบคอส": finishModalService.courseNo || '',
        "สาขา": String(finishModalService.branch || globalBranch || 'เฉวง'),
        "ชื่อเจ้าหน้าที่": selectedStaffNames,
        "พนักงาน": selectedStaffNames,
        courseId: targetCourseId || '',
        createdAt: now.toISOString(),
        customerSignature: custSigUrl,
        staffSignature: staffSigUrl,
        customerPhoto: finishPhotos.before[0] || finishPhotos.after[0] || null,
        customerPhotos: finishPhotos,
        handFees: selectedHandFees,
        totalHandFee: totalHandFee
      });

      if (totalHandFee > 0 && selectedStaffNames) {
        const staffArr = selectedStaffNames.split('/').map(s => s.trim()).filter(Boolean);
        const feePerStaff = Math.round(totalHandFee / staffArr.length);

        staffArr.forEach(staffName => {
          const serviceLogRef = doc(collection(db, 'service_logs'));
          batch.set(serviceLogRef, {
            date: todayIso,
            time: timeStr,
            customerName: finishModalService.customerName,
            customerPhone: finishModalService.customerPhone,
            courseName: finishModalService.courseName,
            staffName: staffName,
            branch: String(finishModalService.branch || globalBranch || 'เฉวง'),
            handFeeAmount: feePerStaff,
            handFeeItems: selectedHandFees,
            createdAt: now.toISOString()
          });
        });
      }

      const activeDocRef = doc(db, 'active_services', finishModalService.id);
      batch.delete(activeDocRef);

      await batch.commit();

      showToast(`✓ บันทึกตัดคอร์ส "${finishModalService.courseName}" สำเร็จ!`, 'success');
      setFinishModalService(null);
    } catch (err) {
      console.error('Finish service error:', err);
      showToast('เกิดข้อผิดพลาดในการบันทึกตัดคอร์ส', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 🌟 1. SECTION: คอร์สที่กำลังให้บริการอยู่ตอนนี้ (Active Services Queue) */}
      {pendingServices.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50/50 p-4 rounded-3xl border border-purple-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-600"></span>
              </span>
              <h3 className="font-black text-sm sm:text-base text-purple-900 flex items-center gap-1.5">
                <span>คอร์สที่กำลังให้บริการอยู่ตอนนี้</span>
                <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {pendingServices.length} คิว
                </span>
              </h3>
            </div>
            <span className="text-[11px] text-purple-700 font-medium hidden sm:inline">
              จับเวลาแบบเรียลไทม์ • ทำเสร็จกดไปตัดยอดที่ POS ได้ทันที
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingServices.map(service => {
              // status check
              const isInService = service.status === 'กำลังให้บริการ';
              const beforeCount = service.beforePhotos?.length || 0;
              const afterCount = service.afterPhotos?.length || 0;

              return (
                <div 
                  key={service.id} 
                  className={`bg-white rounded-2xl p-3.5 sm:p-4 border shadow-sm transition-all relative overflow-hidden flex flex-col justify-between gap-3 ${
                    isInService 
                      ? 'border-purple-300 ring-2 ring-purple-100 shadow-purple-100' 
                      : 'border-amber-200 ring-2 ring-amber-50'
                  }`}
                >
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${isInService ? 'bg-purple-600 animate-pulse' : 'bg-amber-400'}`}></div>

                  <div className="pl-1.5 space-y-2">
                    {/* Header info */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black text-slate-800 text-sm sm:text-base truncate">
                            {service.customerName}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {service.customerPhone}
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-indigo-700 truncate mt-0.5" title={service.courseName}>
                          🎫 {service.courseName}
                        </div>
                      </div>

                      {/* Status chip */}
                      <div className="shrink-0">
                        {isInService ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1 shadow-2xs animate-pulse">
                            <Clock size={11} />
                            <span>{getServiceElapsedStr(service.startTime)}</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <Clock size={11} /> รอรับบริการ
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metadata & Photos */}
                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                        ตัดยอด: {service.qty || 1} ครั้ง
                      </span>
                      {service.staffName && (
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <User size={10} /> {service.staffName}
                        </span>
                      )}
                      {beforeCount > 0 && (
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1">
                          📷 Before ({beforeCount})
                        </span>
                      )}
                      {afterCount > 0 && (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1">
                          📷 After ({afterCount})
                        </span>
                      )}
                    </div>

                    {/* Before Photo Preview Thumbnail */}
                    {beforeCount > 0 && (
                      <div className="flex items-center gap-2 pt-1 overflow-x-auto custom-scrollbar">
                        {service.beforePhotos.slice(0, 3).map((img, idx) => (
                          <img 
                            key={idx} 
                            src={img} 
                            alt="Before" 
                            className="w-12 h-12 rounded-lg object-cover border border-purple-200 shadow-2xs shrink-0 cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => window.open(img, '_blank')}
                            title="แตะเพื่อดูรูปขนาดเต็ม"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5 mt-1">
                    <div className="flex items-center gap-1.5">
                      {/* Button: Upload Before if missing */}
                      <label className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs">
                        <Camera size={13} />
                        <span>{beforeCount > 0 ? '+ Before' : 'ถ่าย Before'}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          capture="environment" 
                          multiple 
                          className="hidden" 
                          onChange={(e) => handleUploadBeforeOnCard(service, e)}
                        />
                      </label>

                      {/* Button: Upload After */}
                      <label className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs">
                        <Camera size={13} />
                        <span>{afterCount > 0 ? '+ After' : 'ถ่าย After'}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          capture="environment" 
                          multiple 
                          className="hidden" 
                          onChange={(e) => handleUploadAfterOnCard(service, e)}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => handleDeleteQueue(service)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="ยกเลิกคิวนี้"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenFinishModal(service)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer hidden sm:flex items-center gap-1"
                        title="ตัดยอดและลงลายเซ็นที่หน้าจอพนักงานโดยตรง"
                      >
                        <span>✍️ ตัดยอดที่นี่</span>
                      </button>

                      {/* PRIMARY BUTTON: ไปตัดยอดที่ POS */}
                      <button
                        type="button"
                        onClick={() => handleProceedToPosDeduction(service)}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-teal-500 via-emerald-600 to-teal-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span>✂️ ไปตัดยอดที่ POS</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 🌟 2. SECTION: ค้นหาลูกค้า & ให้บริการคอร์ส (Customer Course Search & Service) */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-600" />
              <span>ค้นหาลูกค้าเพื่อให้บริการคอร์ส</span>
            </h3>
            <p className="text-xs text-slate-400">
              พิมพ์ชื่อ หรือ เบอร์โทร เพื่อเลือกลูกค้าและดูคอร์สคงเหลือทั้งหมด
            </p>
          </div>

          {selectedCustomer && (
            <button
              type="button"
              onClick={() => {
                setSelectedCustomer(null);
                setSelectedCourseIds([]);
                setCustSearchQuery('');
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw size={12} />
              <span>เปลี่ยนลูกค้า / ค้นหาใหม่</span>
            </button>
          )}
        </div>

        {/* Customer Search Bar */}
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 text-slate-400 pointer-events-none" size={18} />
            <input 
              type="text"
              value={custSearchQuery}
              onChange={(e) => setCustSearchQuery(e.target.value)}
              placeholder="🔍 ค้นหาชื่อลูกค้า หรือ เบอร์โทรศัพท์ เพื่อเริ่มให้บริการคอร์ส..."
              className="w-full pl-10 pr-10 py-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl text-sm font-medium focus:outline-none transition-all shadow-2xs"
            />
            {custSearchQuery && (
              <button
                type="button"
                onClick={() => setCustSearchQuery('')}
                className="absolute right-3 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Search suggestions dropdown */}
          {custSearchQuery && !selectedCustomer && (
            <div className="mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden divide-y divide-slate-100 max-h-72 overflow-y-auto custom-scrollbar z-20">
              {filteredCustomerSuggestions.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  ไม่พบข้อมูลลูกค้าที่ตรงกับคำค้นหา "{custSearchQuery}"
                </div>
              ) : (
                filteredCustomerSuggestions.map(cust => {
                  const custCourses = getCustomerCourses(cust);
                  const remainCourses = custCourses.filter(c => Number(c.computedRemainQty || 0) > 0);
                  const custName = String(cust.computedName || cust.name || getFuzzyKey(cust, ["ชื่อ", "col_1"]) || 'ไม่ระบุชื่อ');
                  const custPhone = String(cust.computedPhone || cust.phone || getFuzzyKey(cust, ["เบอร์โทร", "col_3"]) || '-');

                  return (
                    <div 
                      key={cust.id}
                      onClick={() => {
                        setSelectedCustomer(cust);
                        setCustSearchQuery('');
                        setSelectedCourseIds([]);
                      }}
                      className="p-3 hover:bg-indigo-50/60 cursor-pointer transition-colors flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img 
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(custName)}&background=6366f1&color=fff&bold=true`} 
                          className="w-8 h-8 rounded-full shrink-0 shadow-2xs" 
                          alt="" 
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-slate-800 group-hover:text-indigo-600 truncate">
                            {custName}
                          </div>
                          <div className="text-xs text-slate-400 font-mono">
                            {custPhone}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {remainCourses.length > 0 ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                            เหลือ {remainCourses.length} คอร์ส
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] text-slate-400 bg-slate-100">
                            ไม่มีคอร์สคงเหลือ
                          </span>
                        )}
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Quick Customer Selection Chips */}
        {!selectedCustomer && !custSearchQuery && customersWithRemainingCourses.length > 0 && (
          <div className="pt-1 space-y-1.5">
            <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
              <User size={12} className="text-indigo-600" />
              <span>เลือกลูกค้าที่มีคอร์สคงเหลือด่วน:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto custom-scrollbar">
              {customersWithRemainingCourses.map(cust => (
                <button
                  key={cust.id}
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(cust);
                    setSelectedCourseIds([]);
                  }}
                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  <span>{cust.computedName || cust.name}</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-md font-black">
                    เหลือ {cust.remainCourseCount} คอร์ส
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected Customer Banner */}
        {selectedCustomer && (
          <div className="bg-indigo-50/70 p-3 sm:p-4 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(String(selectedCustomer.computedName || selectedCustomer.name || 'ลูกค้า'))}&background=4f46e5&color=fff&bold=true`} 
                className="w-10 h-10 rounded-full shadow-sm" 
                alt="" 
              />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-slate-900 text-base">
                    {String(selectedCustomer.computedName || selectedCustomer.name || 'ลูกค้า')}
                  </span>
                  {selectedCustomer.isVip && (
                    <span className="text-[10px] font-black bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full">
                      VIP
                    </span>
                  )}
                  {selectedCustomer.nickname && (
                    <span className="text-xs text-slate-500 font-medium">
                      ({selectedCustomer.nickname})
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                  <Phone size={11} className="text-indigo-600" />
                  <span>{String(selectedCustomer.computedPhone || selectedCustomer.phone || '-')}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs font-black text-indigo-700 bg-white px-3 py-1 rounded-xl border border-indigo-200 shadow-2xs">
                🎫 คอร์สคงเหลือ {customerAvailableCourses.length} รายการ
              </span>
            </div>
          </div>
        )}

        {/* 🌟 3. SECTION: รายการคอร์สเหมือนใน POS (เหมือนที่อยู่ใน POS เลย) */}
        {selectedCustomer && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-sm text-slate-700 flex items-center gap-2">
                <Scissors size={15} className="text-teal-600" />
                <span>รายการคอร์สที่เบิกใช้งานได้ ({customerAvailableCourses.length})</span>
              </h4>

              {selectedCourseIds.length > 0 && (
                <span className="text-xs font-black text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                  เลือกอยู่ {selectedCourseIds.length} คอร์ส
                </span>
              )}
            </div>

            {customerAvailableCourses.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs space-y-2">
                <div className="text-2xl">🎫</div>
                <div className="font-bold text-slate-600">ลูกค้าท่านนี้ไม่มีคอร์สคงเหลือในระบบ</div>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  สามารถเลือกซื้อคอร์สใหม่หรือลงทะเบียนโปรโมชั่นได้ที่หน้าขายหน้าร้าน (POS)
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {customerAvailableCourses.map(c => {
                  const isSelected = selectedCourseIds.includes(c.id);
                  const activeSession = activeServices.find(s => 
                    (s.courseId === c.id || s.courseDocId === c.id) && s.status !== 'เรียบร้อย'
                  );
                  const isInService = activeSession && activeSession.status === 'กำลังให้บริการ';
                  const isWaitingService = activeSession && activeSession.status === 'รอรับบริการ';
                  const cName = String(getFuzzyKey(c, ["ชื่อคอส", "col_8"]) || c.name || '-');
                  const cCode = String(getFuzzyKey(c, ["รหัสคอส", "col_1"]) || c.code || '');
                  const cBuyer = String(getFuzzyKey(c, ["ผู้ซื้อคอส", "col_9"]) || selectedCustomer?.computedName || '-');
                  const cPhone = String(getFuzzyKey(c, ["เบอร์โทร", "col_1"]) || selectedCustomer?.computedPhone || '-');
                  const remainQty = Number(c.computedRemainQty ?? 0);
                  const totalQty = Number(getFuzzyKey(c, ["จำนวนครั้ง", "col_7", "col_6"]) || c.computedTotalQty || 1);
                  const usedQty = Number(c.computedUsedQty || 0);

                  return (
                    <div 
                      key={c.id}
                      onClick={() => toggleSelectCourse(c.id)}
                      className={`bg-white p-3.5 sm:p-4 rounded-2xl shadow-sm hover:shadow-md border cursor-pointer transition-all active:scale-[0.99] flex flex-row items-center relative overflow-hidden group ${
                        isInService 
                          ? 'border-purple-400 ring-2 ring-purple-300 shadow-purple-100 bg-purple-50/20' 
                          : isWaitingService
                            ? 'border-amber-400 ring-2 ring-amber-300 shadow-amber-100 bg-amber-50/20'
                            : isSelected 
                              ? 'border-purple-500 ring-2 ring-purple-400 shadow-purple-100 bg-purple-50/40 animate-pulse' 
                              : 'border-teal-100'
                      }`}
                    >
                      {/* Left accent stripe */}
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${
                        isInService || isSelected ? 'bg-purple-600 animate-pulse' : 'bg-teal-400'
                      }`}></div>

                      {/* Checkbox for multi-select */}
                      <div className="pr-2 pl-1 shrink-0">
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-md bg-purple-600 text-white flex items-center justify-center shadow-2xs">
                            <Check size={14} strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-md border-2 border-slate-300 group-hover:border-purple-500 bg-white transition-colors" />
                        )}
                      </div>

                      {/* Course Information (exact POS style) */}
                      <div className="flex-1 pr-3 min-w-0 flex flex-col justify-center">
                        <div className="mb-1 flex flex-col items-start gap-0.5">
                          {cCode && (
                            <span className="bg-teal-50 text-teal-600 border border-teal-100 text-[9px] font-bold px-1.5 py-0.2 rounded-md uppercase inline-block">
                              {cCode}
                            </span>
                          )}
                          <p className="font-bold text-teal-800 text-sm sm:text-base line-clamp-2 leading-tight" title={cName}>
                            {cName}
                          </p>
                        </div>

                        {/* Customer Avatar & Phone */}
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <img 
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(cBuyer)}&background=f1f5f9&color=64748b&bold=true`} 
                            className="w-4 h-4 rounded-full shrink-0" 
                            alt="" 
                          />
                          <span className="text-xs text-gray-600 font-medium truncate">{cBuyer}</span>
                          <span className="text-[10px] text-gray-400 font-mono hidden sm:inline">{cPhone}</span>
                        </div>

                        {/* Dates Chips */}
                        <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                          <span className="text-gray-500 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                            <Calendar size={10} /> ซื้อ: {String(getFuzzyKey(c, ["วันที่ซื้อ", "col_3"]) || '-')}
                          </span>
                          {c.computedExpireDate && c.computedExpireDate !== '-' && (
                            <span className={`px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${c.daysLeft !== null && c.daysLeft < 0 ? 'text-rose-600 bg-rose-50 border border-rose-100' : 'text-gray-500 bg-gray-50 border border-gray-100'}`}>
                              <Clock size={10} /> หมดอายุ: {c.computedExpireDate}
                            </span>
                          )}
                          {c.computedDurationMonths && (
                            <span className="text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md">
                              อายุ {c.computedDurationMonths} เดือน
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right column: Status, counts, Action button */}
                      <div className="flex flex-col items-end shrink-0 gap-2 border-l border-gray-100 pl-3 h-full justify-between">
                        {/* Status chip */}
                        <div>
                          {isInService ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1 shadow-2xs animate-pulse">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-600"></span>
                              </span>
                              <span>กำลังให้บริการ</span>
                            </span>
                          ) : isWaitingService ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              ⏳ รอรับบริการ
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-gray-100 text-gray-600">
                              ยังคงเหลือ
                            </span>
                          )}
                        </div>

                        {/* Usage counter */}
                        <div className="text-right">
                          <div className="text-[10px] text-gray-400 font-bold">
                            ใช้ไป {usedQty}/{totalQty}
                          </div>
                          <div className="text-sm font-black text-teal-600">
                            เหลือ {remainQty} ครั้ง
                          </div>
                        </div>

                        {/* Action Buttons on Card */}
                        <div className="flex items-center gap-1">
                          {isInService ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProceedToPosDeduction(activeSession || c, selectedCustomer);
                              }}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer"
                              title="เปิดหน้า POS เพื่อตัดยอดคอร์สนี้"
                            >
                              <span>✂️ ไปตัดยอดที่ POS</span>
                              <ChevronRight size={11} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCheckInModal([c]);
                              }}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white flex items-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer"
                              title="เช็คอินเพื่อเริ่มรับบริการ ถ่ายรูป Before ก่อนทำ"
                            >
                              <span>📍 เช็คอิน</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 🌟 4. STICKY / FLOATING BAR: เมื่อเลือกหลายคอร์สเพื่อเช็คอินร่วมกัน */}
      {selectedCourseIds.length > 0 && selectedCustomer && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] bg-slate-900/95 text-white backdrop-blur-md px-4 sm:px-6 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 sm:gap-6 border border-slate-700 animate-in slide-in-from-bottom-5 max-w-[95vw]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black shadow-sm shrink-0">
              <Sparkles size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 flex-wrap">
                <span>เลือก {selectedCourseIds.length} คอร์ส</span>
                <span className="text-[10px] bg-teal-500 text-white font-black px-1.5 py-0.2 rounded-full">
                  ลูกค้า: {selectedCustomer.computedName || selectedCustomer.name}
                </span>
              </div>
              <div className="text-[10px] text-slate-300 truncate max-w-[200px] sm:max-w-xs">
                {customerAvailableCourses.filter(c => selectedCourseIds.includes(c.id)).map(c => String(getFuzzyKey(c, ["ชื่อคอส", "col_8"]) || c.name)).join(', ')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedCourseIds([])}
              className="px-2.5 py-2 text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
            >
              ล้าง
            </button>

            <button
              type="button"
              onClick={() => {
                const targetCourses = customerAvailableCourses.filter(c => selectedCourseIds.includes(c.id));
                handleOpenCheckInModal(targetCourses);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-orange-500/25"
            >
              <span>📍 เช็คอินรับบริการ ({selectedCourseIds.length} คอร์ส)</span>
            </button>
          </div>
        </div>
      )}

      {/* 🌟 5. MODAL: เช็คอินรับบริการ & ถ่ายรูป Before ก่อนทำ */}
      {checkInModal.isOpen && (
        <div className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-100 space-y-4 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-black">
                  📍
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-800">
                    เช็คอินเริ่มรับบริการคอร์ส
                  </h3>
                  <p className="text-xs text-slate-400">
                    ถ่ายรูป Before ก่อนทำ และกดเช็คอินเพื่อเริ่มจับเวลา
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCheckInModal(prev => ({ ...prev, isOpen: false }))}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Customer & Courses summary */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-bold">ลูกค้า:</span>
                <span className="font-black text-slate-800">
                  {checkInModal.customer?.computedName || checkInModal.customer?.name || selectedCustomer?.computedName} ({checkInModal.customer?.computedPhone || checkInModal.customer?.phone || selectedCustomer?.computedPhone})
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] font-bold text-slate-500">คอร์สที่เช็คอิน ({checkInModal.courses.length} รายการ):</div>
                <div className="space-y-1">
                  {checkInModal.courses.map((c, i) => (
                    <div key={i} className="text-xs font-bold text-indigo-700 bg-white p-2 rounded-xl border border-indigo-100 flex items-center justify-between">
                      <span className="truncate">🎫 {String(getFuzzyKey(c, ["ชื่อคอส", "col_8"]) || c.name)}</span>
                      <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-black shrink-0">ตัด 1 ครั้ง</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 📸 ถ่ายรูป Before ก่อนทำ (สำคัญ!) */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Camera size={14} className="text-orange-500" />
                  <span>ถ่ายรูปสภาพผิวก่อนทำ (Before Photo)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {checkInModal.beforePhotos.length > 0 ? `ถ่ายแล้ว ${checkInModal.beforePhotos.length} รูป` : 'ควรถ่ายก่อนเริ่มทำ'}
                </span>
              </label>

              {checkInModal.beforePhotos.length === 0 ? (
                <label className="w-full py-6 px-4 bg-orange-50/50 hover:bg-orange-50 border-2 border-dashed border-orange-300 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors group">
                  <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                    <Camera size={24} />
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-black text-orange-800 block">
                      📷 แตะเพื่อเปิดกล้องถ่ายรูป Before
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ระบบจะบีบอัดรูปให้อัตโนมัติ รวดเร็วและคมชัด
                    </span>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    multiple 
                    className="hidden" 
                    onChange={handleCheckInPhotoCapture} 
                  />
                </label>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    {checkInModal.beforePhotos.map((img, idx) => (
                      <div key={idx} className="relative rounded-xl overflow-hidden border border-orange-200 group">
                        <img src={img} alt="Before" className="w-full h-20 object-cover" />
                        <button
                          type="button"
                          onClick={() => setCheckInModal(prev => ({
                            ...prev,
                            beforePhotos: prev.beforePhotos.filter((_, i) => i !== idx)
                          }))}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-rose-600 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <label className="h-20 border-2 border-dashed border-orange-300 rounded-xl flex flex-col items-center justify-center gap-1 text-orange-600 bg-orange-50/30 hover:bg-orange-50 cursor-pointer transition-colors">
                      <Camera size={18} />
                      <span className="text-[10px] font-bold">+ ถ่ายเพิ่ม</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment" 
                        multiple 
                        className="hidden" 
                        onChange={handleCheckInPhotoCapture} 
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>



            {/* Note & Bed optional */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">เลขเตียง / ห้อง (ถ้ามี):</label>
                <input 
                  type="text" 
                  value={checkInModal.bedNumber}
                  onChange={(e) => setCheckInModal(prev => ({ ...prev, bedNumber: e.target.value }))}
                  placeholder="เช่น เตียง 1, ห้อง A"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">หมายเหตุ:</label>
                <input 
                  type="text" 
                  value={checkInModal.note}
                  onChange={(e) => setCheckInModal(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="เช่น เน้นสิวอักเสบข้างแก้ม"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCheckInModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={handleConfirmCheckIn}
                disabled={isProcessing}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle size={16} />
                <span>ยืนยันเช็คอินเริ่มบริการ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 6. MODAL: Finish Service Directly (ทางเลือกสำรอง) */}
      {finishModalService && (
        <div className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-5 shadow-2xl border border-slate-100 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black">
                  ✍️
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-800">
                    บันทึกตัดยอด & จบงาน
                  </h3>
                  <p className="text-xs text-slate-400">
                    {finishModalService.customerName} • {finishModalService.courseName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFinishModalService(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* DF Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700">รายการค่ามือบริการ (DF):</label>
              <div className="grid grid-cols-3 gap-1.5">
                {HAND_FEE_PRESETS.map(preset => {
                  const isChecked = selectedHandFees.some(h => h.id === preset.id);
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => toggleHandFee(preset)}
                      className={`p-2 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer ${
                        isChecked ? 'bg-orange-50 border-orange-400 text-orange-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <div className="truncate">{preset.name}</div>
                      <div className="text-[10px] text-orange-600 font-black">+฿{preset.fee}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Signature Pads */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">ลายเซ็นลูกค้า:</label>
                <SignaturePad ref={custSigRef} height={90} className="rounded-xl border border-slate-200" />
              </div>
              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">ลายเซ็นพนักงาน:</label>
                <SignaturePad ref={staffSigRef} height={90} className="rounded-xl border border-slate-200" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setFinishModalService(null)}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmFinishService}
                disabled={isProcessing}
                className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black"
              >
                ยืนยันตัดยอด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
