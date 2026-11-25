import React, { useState, useEffect, useRef } from 'react';
import { 
  Scissors, Camera, CheckCircle, Clock, Trash2, Plus, 
  User, Check, Sparkles, ChevronRight, X, AlertCircle, Search
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
  showToast = () => {}
}) {
  const [timerNow, setTimerNow] = useState(Date.now());
  const [finishModalService, setFinishModalService] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Modal finish form state
  const [selectedStaffNames, setSelectedStaffNames] = useState('');
  const [selectedHandFees, setSelectedHandFees] = useState([]);
  const [finishPhotos, setFinishPhotos] = useState({ before: [], after: [] });
  const custSigRef = useRef(null);
  const staffSigRef = useRef(null);

  // Manual Add Queue Modal state
  const [showAddQueueModal, setShowAddQueueModal] = useState(false);
  const [searchCustQuery, setSearchCustQuery] = useState('');
  const [selectedAddCustomer, setSelectedAddCustomer] = useState(null);

  // Interval timer for live in-service elapsed time
  useEffect(() => {
    const timer = setInterval(() => setTimerNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const getServiceElapsedStr = (startTime) => {
    if (!startTime) return '';
    const diffMs = Math.max(0, timerNow - Number(startTime));
    const mins = Math.floor(diffMs / 60000);
    const startTimeFormatted = new Date(startTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    if (mins === 0) return `เริ่ม ${startTimeFormatted} • เพิ่งเริ่ม`;
    return `เริ่ม ${startTimeFormatted} • ${mins} นาที`;
  };

  // Filter active services for this branch and non-completed
  const pendingServices = activeServices.filter(s => {
    const isCompleted = s.status === 'เรียบร้อย';
    const isMatchBranch = !globalBranch || !s.branch || s.branch === globalBranch;
    return !isCompleted && isMatchBranch;
  });

  // Handle Before photo capture directly from card
  const handleUploadBefore = async (service, e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      const results = await Promise.all(files.map(async file => {
        try {
          const comp = await imageCompression(file, { maxSizeMB: 0.2, maxWidthOrHeight: 1024, useWebWorker: true });
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
        status: 'กำลังให้บริการ',
        startTime: Date.now(),
        beforePhotos: [...(service.beforePhotos || []), ...results],
        updatedAt: new Date().toISOString()
      });

      showToast(`📸 เริ่มให้บริการ "${service.courseName}" แล้ว! จับเวลาเรียบร้อย`, 'success');
    } catch (err) {
      console.error('Before photo error:', err);
      showToast('ไม่สามารถอัปโหลดรูปภาพได้', 'error');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Handle After photo capture
  const handleUploadAfter = async (service, e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      const results = await Promise.all(files.map(async file => {
        try {
          const comp = await imageCompression(file, { maxSizeMB: 0.2, maxWidthOrHeight: 1024, useWebWorker: true });
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

  // Open finish service modal
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

  // Toggle DF Hand fee preset
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

  const updateHandFeeQty = (id, delta) => {
    setSelectedHandFees(prev => prev.map(h => {
      if (h.id === id) {
        const newQty = Math.max(1, (h.qty || 1) + delta);
        return { ...h, qty: newQty };
      }
      return h;
    }));
  };

  const totalHandFee = selectedHandFees.reduce((sum, h) => sum + ((Number(h.fee) || 50) * (Number(h.qty) || 1)), 0);

  // Confirm finish service, deduct course, write history and service_log
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

      // 1. Find course to update session
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

      // 2. Add history record
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

      // 3. Write service_logs if hand fees (DF) exist
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

      // 4. Delete or mark completed in active_services
      const activeDocRef = doc(db, 'active_services', finishModalService.id);
      batch.delete(activeDocRef);

      await batch.commit();

      showToast(`✓ บันทึกตัดคอร์ส "${finishModalService.courseName}" สำเร็จ! บันทึกประวัติเรียบร้อย`, 'success');
      setFinishModalService(null);
    } catch (err) {
      console.error('Finish service error:', err);
      showToast('เกิดข้อผิดพลาดในการบันทึกตัดคอร์ส', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Add a course to queue manually from Staff Dashboard
  const handleAddCourseToQueue = async (course, customer) => {
    try {
      const activeRef = doc(collection(db, 'active_services'));
      const courseName = String(getFuzzyKey(course, ["ชื่อคอส", "col_8"]) || course.name || 'คอร์สบริการ');
      const custName = customer?.computedName || customer?.name || String(getFuzzyKey(course, ["ผู้ซื้อคอส", "col_9"]) || 'ลูกค้าทั่วไป');
      const custPhone = customer?.computedPhone || customer?.phone || String(getFuzzyKey(course, ["เบอร์โทร", "col_1"]) || '-');

      await updateDoc(activeRef, {
        courseId: course.id,
        courseDocId: course.id,
        courseName: courseName,
        courseNo: String(getFuzzyKey(course, ["รหัสคอส", "col_1"]) || ''),
        customerId: customer?.id || '',
        customerName: custName,
        customerPhone: custPhone,
        qty: 1,
        branch: String(globalBranch || 'เฉวง'),
        status: 'รอรับบริการ',
        startTime: null,
        beforePhotos: [],
        afterPhotos: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      showToast(`✓ เพิ่มคิว "${courseName}" เรียบร้อยแล้ว`, 'success');
      setShowAddQueueModal(false);
      setSelectedAddCustomer(null);
      setSearchCustQuery('');
    } catch (err) {
      console.error('Manual queue add error:', err);
      showToast('ไม่สามารถเพิ่มคิวได้', 'error');
    }
  };

  // Available staff list
  const staffList = clockedInEmployees.length > 0 ? clockedInEmployees : employees;

  return (
    <div className="space-y-4 mb-6">
      {/* Active Service Queue Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 bg-gradient-to-r from-teal-50 via-emerald-50/60 to-teal-50 border border-teal-200/90 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <Scissors size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-800 tracking-tight">คิวรับบริการ & ตัดคอร์ส (ส่งมาจากหน้าร้าน)</h3>
              {pendingServices.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-600 text-white shadow-2xs">
                  {pendingServices.length} คิว
                </span>
              )}
            </div>
            <p className="text-[11px] text-teal-800 font-medium">
              แตะถ่ายรูป Before เพื่อเริ่มจับเวลา และถ่ายรูป After + เซ็นชื่อเพื่อตัดยอด
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddQueueModal(true)}
          className="self-start sm:self-auto px-3 py-1.5 bg-white hover:bg-teal-50 text-teal-700 font-bold text-xs rounded-xl border border-teal-300 shadow-2xs flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
        >
          <Plus size={14} />
          <span>เพิ่มคิวรับบริการ</span>
        </button>
      </div>

      {/* Queue Cards List */}
      {pendingServices.length === 0 ? (
        <div className="p-6 bg-white border border-dashed border-slate-200 rounded-2xl text-center space-y-1">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
            <Clock size={20} />
          </div>
          <p className="text-xs font-bold text-slate-600">ยังไม่มีคิวที่ส่งมาจากหน้าร้านในขณะนี้</p>
          <p className="text-[11px] text-slate-400">เมื่อพนักงานเลือกตัดคอร์สที่เคาน์เตอร์ POS รายการจะปรากฏที่นี่ทันทีแบบเรียลไทม์</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pendingServices.map(service => {
            const isInService = service.status === 'กำลังให้บริการ';
            const beforeCount = service.beforePhotos?.length || 0;
            const afterCount = service.afterPhotos?.length || 0;

            return (
              <div
                key={service.id}
                className={`p-3.5 rounded-2xl border transition-all bg-white shadow-sm flex flex-col justify-between gap-3 relative overflow-hidden ${
                  isInService 
                    ? 'border-purple-300 ring-2 ring-purple-200/80 shadow-purple-100 bg-purple-50/10' 
                    : 'border-slate-200/90 hover:border-teal-300'
                }`}
              >
                {/* Left vertical status indicator */}
                <div className={`absolute top-0 left-0 w-1.5 h-full ${
                  isInService ? 'bg-purple-600 animate-pulse' : 'bg-amber-400'
                }`} />

                {/* Card Top: Customer & Course Details */}
                <div className="pl-2">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-black text-slate-800 truncate">
                          {service.customerName || 'ลูกค้าทั่วไป'}
                        </span>
                        {service.customerPhone && service.customerPhone !== '-' && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {service.customerPhone}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-teal-700 mt-0.5 truncate" title={service.courseName}>
                        🎫 {service.courseName}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {isInService ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1 shadow-2xs animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-ping" />
                          <span>{getServiceElapsedStr(service.startTime)}</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 shadow-2xs">
                          <Clock size={11} />
                          <span>รอเริ่มบริการ</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Course Details Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-2 text-[10px] text-slate-500">
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md font-bold text-slate-700">
                      ตัดยอด: {service.qty || 1} ครั้ง
                    </span>
                    {service.branch && (
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                        สาขา {service.branch}
                      </span>
                    )}
                    {beforeCount > 0 && (
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md font-bold">
                        📷 Before ({beforeCount})
                      </span>
                    )}
                    {afterCount > 0 && (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                        📸 After ({afterCount})
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pl-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  {!isInService ? (
                    <>
                      {/* Before Photo Input Trigger */}
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        multiple
                        className="hidden"
                        id={`queue-before-${service.id}`}
                        onChange={(e) => handleUploadBefore(service, e)}
                      />
                      <label
                        htmlFor={`queue-before-${service.id}`}
                        className="flex-1 py-2 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
                      >
                        <Camera size={14} />
                        <span>ถ่ายรูป Before เพื่อเริ่มบริการ</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => handleDeleteQueue(service)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="ยกเลิกคิวนี้"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      {/* After Photo Input Trigger */}
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        multiple
                        className="hidden"
                        id={`queue-after-${service.id}`}
                        onChange={(e) => handleUploadAfter(service, e)}
                      />
                      <label
                        htmlFor={`queue-after-${service.id}`}
                        className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer active:scale-95 transition-all border border-slate-200 shadow-2xs"
                        title="ถ่ายรูปหลังทำ (After)"
                      >
                        <Camera size={14} className="text-emerald-600" />
                        <span>+ After {afterCount > 0 ? `(${afterCount})` : ''}</span>
                      </label>

                      {/* Finish & Sign Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenFinishModal(service)}
                        className="flex-1 py-2 px-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                      >
                        <CheckCircle size={15} />
                        <span>บันทึกตัดยอด & เซ็นชื่อ</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FINISH SERVICE MODAL (Compact & Unified with Photos, DF & Signatures) */}
      {finishModalService && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Scissors size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black">ยืนยันตัดคอส & จบการให้บริการ</h3>
                  <p className="text-[10px] text-teal-100">{finishModalService.customerName} • {finishModalService.courseName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFinishModalService(null)}
                className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 overflow-y-auto space-y-3.5 custom-scrollbar flex-1 text-slate-800">
              {/* Staff Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  พนักงานผู้ให้บริการ <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {staffList.map(emp => {
                    const isSelected = selectedStaffNames.split('/').map(s => s.trim()).includes(emp.name);
                    return (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => {
                          let list = selectedStaffNames ? selectedStaffNames.split('/').map(s => s.trim()).filter(Boolean) : [];
                          if (isSelected) {
                            list = list.filter(s => s !== emp.name);
                          } else {
                            list.push(emp.name);
                          }
                          setSelectedStaffNames(list.join(' / '));
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 shadow-2xs active:scale-95 ${
                          isSelected
                            ? 'bg-teal-600 border-teal-600 text-white shadow-teal-200'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {isSelected ? <Check size={12} strokeWidth={3} /> : <User size={12} className="text-slate-400" />}
                        {emp.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hand Fee (DF) Presets */}
              <div className="p-2.5 bg-gradient-to-br from-amber-50/70 via-orange-50/60 to-amber-50/70 border border-orange-200/90 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-md bg-orange-500 text-white flex items-center justify-center">
                      <Sparkles size={10} />
                    </div>
                    <label className="text-xs font-black text-slate-800">รายการที่ได้ค่ามือ (DF บริการ)</label>
                  </div>
                  {totalHandFee > 0 && (
                    <span className="text-xs font-black text-orange-700 bg-white px-2 py-0.5 rounded-lg border border-orange-300 shadow-2xs">
                      ค่ามือรวม: ฿{totalHandFee.toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {HAND_FEE_PRESETS.map(preset => {
                    const selected = selectedHandFees.find(h => h.id === preset.id);
                    const isSelected = !!selected;
                    const Icon = preset.icon || Sparkles;

                    return (
                      <div
                        key={preset.id}
                        onClick={() => toggleHandFee(preset)}
                        className={`p-1.5 rounded-xl border transition-all flex flex-col justify-between text-left cursor-pointer active:scale-98 select-none ${
                          isSelected
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-orange-500 shadow-sm'
                            : 'bg-white border-orange-200 text-slate-800 hover:bg-orange-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <Icon size={12} className={isSelected ? 'text-white' : 'text-orange-500'} />
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded whitespace-nowrap shrink-0 ${
                            isSelected ? 'bg-white text-orange-600' : 'bg-orange-100 text-orange-700'
                          }`}>
                            +฿{preset.fee || 50}
                          </span>
                        </div>
                        <p className="text-[11px] font-bold truncate leading-tight">{preset.name}</p>

                        {isSelected && (
                          <div className="mt-1 pt-1 border-t border-white/20 flex items-center justify-between" onClick={e => e.stopPropagation()}>
                            <span className="text-[9px] font-bold">เลือก</span>
                            <div className="flex items-center gap-0.5 bg-white/25 rounded px-1">
                              <button type="button" onClick={() => updateHandFeeQty(preset.id, -1)} className="text-[10px] font-bold px-1 hover:bg-white/30 rounded">-</button>
                              <span className="text-[10px] font-black">{selected.qty || 1}</span>
                              <button type="button" onClick={() => updateHandFeeQty(preset.id, 1)} className="text-[10px] font-bold px-1 hover:bg-white/30 rounded">+</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Photos Capture & Review Section */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Camera size={14} className="text-indigo-600" />
                    <span>รูปถ่ายหลักฐานการให้บริการ (ก่อน / หลังทำ)</span>
                  </label>
                  <span className="text-[10px] text-slate-500">
                    {finishPhotos.before.length} ก่อนทำ • {finishPhotos.after.length} หลังทำ
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      multiple
                      className="hidden"
                      id="modal-finish-before"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length === 0) return;
                        const res = await Promise.all(files.map(f => {
                          return new Promise(r => {
                            const rd = new FileReader();
                            rd.onload = ev => r(ev.target.result);
                            rd.readAsDataURL(f);
                          });
                        }));
                        setFinishPhotos(p => ({ ...p, before: [...p.before, ...res] }));
                      }}
                    />
                    <label
                      htmlFor="modal-finish-before"
                      className="w-full py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer bg-white border border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50/50 shadow-2xs active:scale-95"
                    >
                      <Camera size={13} />
                      <span>+ Before ({finishPhotos.before.length})</span>
                    </label>
                  </div>

                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      multiple
                      className="hidden"
                      id="modal-finish-after"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length === 0) return;
                        const res = await Promise.all(files.map(f => {
                          return new Promise(r => {
                            const rd = new FileReader();
                            rd.onload = ev => r(ev.target.result);
                            rd.readAsDataURL(f);
                          });
                        }));
                        setFinishPhotos(p => ({ ...p, after: [...p.after, ...res] }));
                      }}
                    />
                    <label
                      htmlFor="modal-finish-after"
                      className="w-full py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer bg-white border border-dashed border-emerald-300 text-emerald-600 hover:bg-emerald-50/50 shadow-2xs active:scale-95"
                    >
                      <Camera size={13} />
                      <span>+ After ({finishPhotos.after.length})</span>
                    </label>
                  </div>
                </div>

                {/* Thumbnails */}
                {(finishPhotos.before.length > 0 || finishPhotos.after.length > 0) && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5 pb-0.5">
                    {finishPhotos.before.map((img, idx) => (
                      <div key={`fb-${idx}`} className="relative shrink-0">
                        <img src={img} alt="Before" className="w-11 h-11 object-cover rounded-lg border border-indigo-300" />
                        <span className="absolute bottom-0 inset-x-0 bg-indigo-900/80 text-[7px] text-center text-white font-bold py-0.2 rounded-b-lg">Before</span>
                        <button
                          type="button"
                          onClick={() => setFinishPhotos(p => ({ ...p, before: p.before.filter((_, i) => i !== idx) }))}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold shadow-xs hover:bg-rose-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {finishPhotos.after.map((img, idx) => (
                      <div key={`fa-${idx}`} className="relative shrink-0">
                        <img src={img} alt="After" className="w-11 h-11 object-cover rounded-lg border border-emerald-300" />
                        <span className="absolute bottom-0 inset-x-0 bg-emerald-900/80 text-[7px] text-center text-white font-bold py-0.2 rounded-b-lg">After</span>
                        <button
                          type="button"
                          onClick={() => setFinishPhotos(p => ({ ...p, after: p.after.filter((_, i) => i !== idx) }))}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold shadow-xs hover:bg-rose-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Signature Pads (Compact 90px height) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <SignaturePad canvasRef={custSigRef} label="ลายเซ็นลูกค้า" height={90} />
                <SignaturePad canvasRef={staffSigRef} label={`ลายเซ็นพนักงาน${selectedStaffNames ? ` (${selectedStaffNames})` : ''}`} height={90} />
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setFinishModalService(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-600 rounded-xl font-bold text-xs border border-slate-200 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmFinishService}
                disabled={isProcessing}
                className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer shadow-teal-600/20"
              >
                {isProcessing ? (
                  <span>กำลังประมวลผล...</span>
                ) : (
                  <>
                    <Scissors size={14} />
                    <span>ยืนยันตัดคอร์ส & จบการให้บริการ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL ADD QUEUE MODAL (Staff can search customer and pick their course) */}
      {showAddQueueModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Plus size={18} className="text-teal-400" />
                <h3 className="text-sm font-black">ค้นหาลูกค้าเพื่อเพิ่มคิวรับบริการ</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddQueueModal(false);
                  setSelectedAddCustomer(null);
                  setSearchCustQuery('');
                }}
                className="p-1 rounded-full hover:bg-white/20 text-white/80"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 custom-scrollbar flex-1">
              {!selectedAddCustomer ? (
                <>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchCustQuery}
                      onChange={e => setSearchCustQuery(e.target.value)}
                      placeholder="พิมพ์ชื่อ หรือ เบอร์โทรลูกค้า..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-teal-500"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-1.5 max-h-72 overflow-y-auto">
                    {customers
                      .filter(c => {
                        if (!searchCustQuery) return false;
                        const q = searchCustQuery.toLowerCase().trim();
                        const name = String(c.computedName || c.name || '').toLowerCase();
                        const phone = String(c.computedPhone || c.phone || '');
                        return name.includes(q) || phone.includes(q);
                      })
                      .slice(0, 10)
                      .map(c => (
                        <div
                          key={c.id}
                          onClick={() => setSelectedAddCustomer(c)}
                          className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/30 flex items-center justify-between cursor-pointer transition-all"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-800">{c.computedName || c.name || '-'}</p>
                            <p className="text-[10px] text-slate-500">{c.computedPhone || c.phone || '-'}</p>
                          </div>
                          <ChevronRight size={16} className="text-slate-400" />
                        </div>
                      ))}
                    {searchCustQuery && customers.filter(c => {
                      const q = searchCustQuery.toLowerCase().trim();
                      const name = String(c.computedName || c.name || '').toLowerCase();
                      const phone = String(c.computedPhone || c.phone || '');
                      return name.includes(q) || phone.includes(q);
                    }).length === 0 && (
                      <p className="text-xs text-center text-slate-400 py-4">ไม่พบรายชื่อลูกค้าที่ค้นหา</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-teal-900">{selectedAddCustomer.computedName || selectedAddCustomer.name}</p>
                      <p className="text-[10px] text-teal-700">{selectedAddCustomer.computedPhone || selectedAddCustomer.phone}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedAddCustomer(null)}
                      className="text-[10px] font-bold text-teal-700 hover:underline"
                    >
                      เปลี่ยนลูกค้า
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">เลือกคอร์สของลูกค้านี้:</label>
                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {courses
                        .filter(co => {
                          const cPhone = String(getFuzzyKey(co, ["เบอร์โทร", "col_1"]) || co.customerPhone || '');
                          const custPhone = String(selectedAddCustomer.computedPhone || selectedAddCustomer.phone || '');
                          const cStatus = String(getFuzzyKey(co, ["สถานะ", "col_10"]) || co.status || '');
                          return custPhone && cPhone.includes(custPhone.replace(/[^0-9]/g, '')) && cStatus !== 'ใช้ครบแล้ว';
                        })
                        .map(co => {
                          const coName = String(getFuzzyKey(co, ["ชื่อคอส", "col_8"]) || co.name || '-');
                          return (
                            <div
                              key={co.id}
                              onClick={() => handleAddCourseToQueue(co, selectedAddCustomer)}
                              className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/30 flex items-center justify-between cursor-pointer transition-all"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-800 truncate">🎫 {coName}</p>
                                <p className="text-[10px] text-slate-500">
                                  คงเหลือ: {co.computedRemainQty || co.remainQty || 'ไม่ระบุ'} ครั้ง
                                </p>
                              </div>
                              <span className="px-2.5 py-1 bg-teal-600 text-white rounded-lg text-xs font-bold shrink-0">
                                + เลือกคอร์สนี้
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
