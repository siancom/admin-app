import React, { useState, useRef, useMemo, Suspense } from 'react';
import { Search, User, CheckCircle, Scissors, X, Upload, Plus, History, CheckSquare } from 'lucide-react';
import { db, storage } from '../config/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { parseQty, getLocalYYYYMMDD, normalizeBranchName } from '../utils/parse';
import { getFuzzyKey } from '../utils/fuzzy';
import { sendCourseDeductionNotification } from '../utils/lineUtils';
import SignaturePad from './SignaturePad';

export default function CourseDeductionSystem({ 
  customers = [], 
  courses,
  masterCourses = [], 
  employees = [],
  clockedInEmployees = [],
  globalBranch,
  currentBranch,
  currentUser,
  showToast,
  onGoBack,
  histories = []
}) {
  const effectiveBranch = currentBranch || globalBranch || 'สำนักงานใหญ่';
  const notify = (msg, type = 'info') => {
    if (typeof showToast === 'function') {
      showToast(msg, type);
    }
  };

  const getCustomerName = (c) => c?.computedName || getFuzzyKey(c, ['ชื่อ', 'ชื่อลูกค้า', 'name', 'col_1']) || '';
  const getCustomerPhone = (c) => c?.computedPhone || getFuzzyKey(c, ['เบอร์โทร', 'phone', 'col_3']) || '';
  const getCustomerHn = (c) => c?.hnCode || c?.id || '';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [modalSignatureData, setModalSignatureData] = useState(null);
  
  // Modal states
  const [showDeductModal, setShowDeductModal] = useState(false);
  const [courseToDeduct, setCourseToDeduct] = useState(null);
  const [modalServiceSearch, setModalServiceSearch] = useState('');
  
  // Form states
  const [selectedServices, setSelectedServices] = useState([]);
  const [paymentStaff, setPaymentStaff] = useState('');
  const [paymentPhotoUrl, setPaymentPhotoUrl] = useState(null);
  const fileInputRef = useRef(null);
  const modalSigRef = useRef(null);
  const custSigRef = useRef(null);
  const staffSigRef = useRef(null);
  const [treatmentNotes, setTreatmentNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSaveSignature = (sig) => {
    if (!sig && modalSigRef.current?.dataset?.isSigned !== 'true') {
      return notify('กรุณาลงลายมือชื่อก่อนบันทึก', 'error');
    }
    setShowSignatureModal(false);
  };

  const availableStaffList = useMemo(() => {
    const normCurrent = normalizeBranchName(effectiveBranch);
    const matchBranch = (emp) => {
      if (!normCurrent) return true;
      const empBranch = normalizeBranchName(emp?.branch);
      return !empBranch || empBranch === normCurrent || empBranch === 'สำนักงานใหญ่';
    };
    const clocked = (clockedInEmployees || []).filter(matchBranch);
    if (clocked.length > 0) return clocked;
    const allBranchStaff = (employees || []).filter(matchBranch);
    if (allBranchStaff.length > 0) return allBranchStaff;
    if (currentUser?.name) {
      return [{ id: currentUser.id || 'current_user', name: currentUser.name, branch: effectiveBranch }];
    }
    return [];
  }, [clockedInEmployees, employees, effectiveBranch, currentUser]);

  const activeCourses = useMemo(() => {
    if (!selectedCustomer) return [];

    const custName = String(getCustomerName(selectedCustomer)).trim();
    const custPhone = String(getCustomerPhone(selectedCustomer)).trim();
    const custCleanPhone = custPhone.replace(/\D/g, '');

    if (Array.isArray(courses)) {
      return courses
        .filter(course => {
          const status = String(course.computedStatus || getFuzzyKey(course, ['สถานะ', 'status']) || '').trim();
          if (status === 'ยกเลิก' || status.includes('ยกเลิก')) return false;

          const remain = course.computedRemainQty ?? parseQty(getFuzzyKey(course, ['คงเหลือ', 'ครั้งคงเหลือ', 'ครั้งที่เหลือ', 'ครั้งที่เหลือดิบ', 'col_4']));
          if (!remain || remain <= 0) return false;

          const courseTitle = String(getFuzzyKey(course, ['ชื่อคอส', 'ชื่อคอร์ส', 'รายการ', 'col_8', 'col_4']) || '').toLowerCase();
          const isCreditCourse = courseTitle.includes('วงเงิน') || courseTitle.includes('เติมเงิน') || courseTitle.includes('เครดิต') || courseTitle.includes('voucher') || courseTitle.includes('บัตรกำนัล') || courseTitle.includes('ฝากเงิน');
          if (isCreditCourse) return false;

          const rawPhoneCandidates = [
            course.customerPhone,
            course.cleanPhone,
            getFuzzyKey(course, ['เบอร์โทร', 'เบอร์โทรลูกค้า', 'col_4', 'col_3']),
            course.col_1
          ]
            .filter(v => v !== undefined && v !== null && String(v).trim() !== '')
            .map(v => String(v).trim());

          const phoneMatched = custCleanPhone.length >= 6 && rawPhoneCandidates.some(cp => {
            const digits = cp.replace(/\D/g, '');
            return digits.length >= 6 && digits === custCleanPhone;
          });
          if (phoneMatched) return true;

          const exactRawPhoneMatched = Boolean(custPhone) && rawPhoneCandidates.some(cp => cp === custPhone && cp.length >= 6);
          if (exactRawPhoneMatched) return true;

          // Fallback to exact customer name match only if course has no valid phone number
          const courseHasValidPhone = rawPhoneCandidates.some(cp => cp.replace(/\D/g, '').length >= 8);
          if (!courseHasValidPhone && custName) {
            const cCustomerName = String(
              course.customerName ||
              getFuzzyKey(course, ['ผู้ซื้อคอส', 'ชื่อลูกค้า', 'ชื่อ', 'customerName', 'col_9']) ||
              ''
            ).trim();
            if (cCustomerName && cCustomerName === custName) return true;
          }

          return false;
        })
        .map(course => {
          const totalQty = course.computedTotalQty ?? (parseQty(getFuzzyKey(course, ['จำนวนครั้งที่ได้', 'จำนวนรวม', 'col_10', 'qty'])) || 1);
          const remain = course.computedRemainQty ?? parseQty(getFuzzyKey(course, ['คงเหลือ', 'ครั้งคงเหลือ', 'ครั้งที่เหลือ', 'ครั้งที่เหลือดิบ', 'col_4']));
          const used = course.computedUsedQty ?? Math.max(0, totalQty - remain);
          return {
            ...course,
            used,
            balance: remain,
            totalQty,
            dateBought: getFuzzyKey(course, ['วันที่ซื้อ', 'dateBought', 'col_3']) || course.id
          };
        });
    }

    // Fallback if `courses` prop isn't passed
    const boughtCourses = [];
    const usageMap = {};
    const myHistories = (histories || []).filter(h => {
      if (String(h.customerId) === String(selectedCustomer.id)) return true;
      const hPhone = String(getFuzzyKey(h, ['เบอร์โทร', 'phone', 'col_3']) || '').replace(/\D/g, '');
      return custCleanPhone.length >= 6 && hPhone === custCleanPhone;
    });

    myHistories.forEach(h => {
      if (h.cart) {
        h.cart.forEach(item => {
          if (item.type === 'course') {
            boughtCourses.push({
              ...item,
              _fromHistoryFallback: true,
              dateBought: h.date,
              receiptNo: h.receiptNo || h.id
            });
          }
          if (item.type === 'usage') {
            const cid = item.originalItem?.id || item.id;
            usageMap[cid] = (usageMap[cid] || 0) + (parseInt(item.qty, 10) || 1);
          }
        });
      }
    });

    return boughtCourses
      .map(c => {
        const totalQty = parseInt(getFuzzyKey(c, ['จำนวนครั้งที่ได้', 'col_13', 'qty']), 10) || 1;
        const used = usageMap[c.id] || 0;
        return { ...c, used, balance: totalQty - used, totalQty };
      })
      .filter(c => c.balance > 0);
  }, [selectedCustomer, courses, histories]);

  const singleServices = useMemo(() => {
    return (masterCourses || []).filter(c => {
      const code = String(getFuzzyKey(c, ["รหัสคอส", "col_1"]) || '');
      const qty = String(getFuzzyKey(c, ["จำนวนครั้งที่ได้", "qty", "col_13"]) || '1');
      if (!code.startsWith('F-') || qty !== '1') return false;
      
      if (modalServiceSearch.trim() !== '') {
        const searchStr = `${code} ${String(getFuzzyKey(c, ["ชื่อคอส", "col_4"]) || '')}`.toLowerCase();
        return searchStr.includes(modalServiceSearch.toLowerCase());
      }
      return true;
    }).sort((a, b) => {
      const codeA = String(getFuzzyKey(a, ["รหัสคอส", "col_1"]) || '');
      const codeB = String(getFuzzyKey(b, ["รหัสคอส", "col_1"]) || '');
      
      const getSortScore = (code) => {
        if (code.startsWith('F-MA') || code.startsWith('F-M')) return 1;
        if (/^F-[A-J]/i.test(code)) return 2;
        return 3;
      };
      
      const scoreA = getSortScore(codeA);
      const scoreB = getSortScore(codeB);
      if (scoreA !== scoreB) return scoreA - scoreB;
      return codeA.localeCompare(codeB);
    });
  }, [masterCourses, modalServiceSearch]);

  // 🌟 ค้นหาลูกค้าจากเลขที่ใบคอร์ส (สแกน QR บนใบคอร์ส A4 หรือพิมพ์เลขที่ใบคอส)
  const findCustomerByCourseRef = (raw) => {
    const t = String(raw || '').trim().toLowerCase();
    if (!t || !Array.isArray(courses)) return null;
    const course = courses.find(c => {
      const refs = [getFuzzyKey(c, ['เลขที่ใบคอส', 'col_2']), c.courseRefKey, c.id]
        .map(v => String(v || '').trim().toLowerCase()).filter(Boolean);
      return refs.includes(t);
    });
    if (!course) return null;
    const cPhone = String(getFuzzyKey(course, ['เบอร์โทร', 'col_1']) || '').replace(/\D/g, '');
    const cName = String(getFuzzyKey(course, ['ผู้ซื้อคอส', 'ชื่อลูกค้า', 'col_9']) || '').trim();
    return (customers || []).find(cu => {
      const p = String(getCustomerPhone(cu)).replace(/\D/g, '');
      return cPhone.length >= 6 && p === cPhone;
    }) || (cName ? (customers || []).find(cu => String(getCustomerName(cu)).trim() === cName) : null) || null;
  };

  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const t = searchTerm.trim().toLowerCase();
    const cleanT = t.replace(/\D/g, '');
    const byCourse = findCustomerByCourseRef(searchTerm);
    if (byCourse) return [byCourse];
    return (customers || []).filter(c => {
      const name = String(getCustomerName(c)).toLowerCase();
      const phone = String(getCustomerPhone(c)).toLowerCase();
      const cleanPhone = phone.replace(/\D/g, '');
      const hn = String(getCustomerHn(c)).toLowerCase();
      return (
        name.includes(t) ||
        phone.includes(t) ||
        (cleanT.length >= 3 && cleanPhone.includes(cleanT)) ||
        hn.includes(t)
      );
    }).slice(0, 10);
  }, [searchTerm, customers, courses]);

  const getCourseCodeLabel = (course) => {
    return String(getFuzzyKey(course, ['เลขที่ใบคอส', 'รหัสคอส', 'col_2', 'col_1']) || course?.id || '-');
  };

  const getCourseTitleLabel = (course) => {
    return String(getFuzzyKey(course, ['ชื่อคอส', 'ชื่อคอร์ส', 'รายการ', 'col_8', 'col_4']) || '-');
  };

  const handleDeduct = async () => {
    if (!courseToDeduct || !selectedCustomer) return;
    if (!paymentStaff) return notify('กรุณาเลือกพนักงานผู้ให้บริการ', 'error');
    if (custSigRef.current?.dataset?.isSigned !== "true" || staffSigRef.current?.dataset?.isSigned !== "true") {
      return notify('กรุณาให้ลูกค้าและพนักงานเซ็นชื่อให้ครบถ้วนก่อนยืนยัน', 'error');
    }
    if (selectedServices.length === 0) {
      return notify('กรุณาเลือกบริการที่ใช้ในครั้งนี้', 'error');
    }

    const paidCount = selectedServices.filter(s => {
      const name = String(getFuzzyKey(s, ["ชื่อคอส", "col_4"]) || '').trim();
      return !name.includes('ฟรี');
    }).length;
    const hasFreeService = selectedServices.some(s => String(getFuzzyKey(s, ["ชื่อคอส", "col_4"]) || '').includes('ฟรี'));
    const qty = paidCount > 0 ? paidCount : (hasFreeService ? 0 : 1);

    if (qty > (courseToDeduct.balance ?? 0)) {
      return notify(`เลือกบริการเกินจำนวนสิทธิ์คงเหลือ (${courseToDeduct.balance ?? 0} ครั้ง)`, 'error');
    }

    setIsProcessing(true);
    try {
      let finalPhotoUrl = '';
      if (paymentPhotoUrl) {
        const storageRef = ref(storage, `usage_photos/${Date.now()}.jpg`);
        await uploadString(storageRef, paymentPhotoUrl, 'data_url');
        finalPhotoUrl = await getDownloadURL(storageRef);
      }

      const custSig = custSigRef.current?.toDataURL('image/png') || '';
      const staffSig = staffSigRef.current?.toDataURL('image/png') || '';

      const nowObj = new Date();
      const todayIso = getLocalYYYYMMDD(nowObj);
      const timeStr = nowObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      const custName = String(getCustomerName(selectedCustomer)).trim();
      const custPhone = String(getCustomerPhone(selectedCustomer)).trim();
      const custCleanPhone = custPhone.replace(/\D/g, '');
      const courseNo = String(getFuzzyKey(courseToDeduct, ['เลขที่ใบคอส', 'รหัสคอส', 'col_2', 'col_1']) || '');
      const courseName = getCourseTitleLabel(courseToDeduct);
      const usedServiceNames = selectedServices.map(s => String(getFuzzyKey(s, ["ชื่อคอส", "col_4"]) || '').trim()).filter(Boolean);
      const itemDesc = usedServiceNames.length > 0
        ? `ตัดคอร์ส: ${courseName} (${usedServiceNames.join(', ')})`
        : `ตัดคอร์ส: ${courseName}`;

      const currentUsed = courseToDeduct.computedUsedQty ?? courseToDeduct.used ?? parseQty(getFuzzyKey(courseToDeduct, ['ครั้งที่ใช้', 'รวมใช้งานแล้ว', 'ใช้ไป', 'col_5']));
      const currentTotal = courseToDeduct.computedTotalQty ?? courseToDeduct.totalQty ?? (parseQty(getFuzzyKey(courseToDeduct, ['จำนวนครั้งที่ได้', 'จำนวนรวม', 'col_10'])) || 1);
      const newUsed = currentUsed + qty;
      const newRemain = Math.max(0, currentTotal - newUsed);
      const newStatus = newRemain <= 0 ? 'ใช้ครบแล้ว' : 'ยังคงเหลือ';
      const canUpdateCourseDoc = Boolean(courseToDeduct.id && !courseToDeduct._fromHistoryFallback);

      const batch = writeBatch(db);
      const historyRef = doc(collection(db, 'histories'));
      const historyData = {
        "วันที่": nowObj.toLocaleDateString('th-TH'),
        date: todayIso,
        "เวลา": timeStr,
        "ชื่อลูกค้า": custName,
        "เบอร์โทร": custPhone,
        "cleanPhone": custCleanPhone,
        "รายการ": itemDesc,
        "ประเภท": "รับบริการ",
        "สถานะ": "เรียบร้อย",
        "จำนวนครั้ง": qty,
        "จำนวน": String(qty),
        "เลขที่ใบคอส": courseNo,
        "สาขา": String(effectiveBranch),
        "ชื่อเจ้าหน้าที่": paymentStaff,
        "พนักงาน": paymentStaff,
        courseId: courseToDeduct.id || '',
        courseUpdatedDirectly: canUpdateCourseDoc,
        createdAt: nowObj.toISOString(),
        customerSignature: custSig,
        staffSignature: staffSig,
        customerId: selectedCustomer.id || '',
        usedServices: usedServiceNames,
        treatmentNotes: treatmentNotes || '',
        paymentPhotoUrl: finalPhotoUrl || null,
        customerPhoto: finalPhotoUrl || null
      };

      batch.set(historyRef, historyData);

      if (canUpdateCourseDoc) {
        const courseRef = doc(db, 'courses', courseToDeduct.id);
        batch.update(courseRef, {
          "ครั้งที่ใช้": String(newUsed),
          "สถานะ": newStatus
        });
      }

      await batch.commit();
      
      // Send LINE notification for course deduction
      if (selectedCustomer && selectedCustomer.lineUid) {
        sendCourseDeductionNotification(courseName, qty, newRemain, selectedCustomer.lineUid)
          .catch(e => console.warn('Deduction Line notification failed:', e.message));
      }

      notify('ตัดคอร์สสำเร็จ!', 'success');
      setShowDeductModal(false);
      setCourseToDeduct(null);
      setSelectedServices([]);
      setPaymentStaff('');
      setTreatmentNotes('');
      setPaymentPhotoUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error(error);
      notify('เกิดข้อผิดพลาดในการตัดคอร์ส', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleService = (service) => {
    if (selectedServices.find(s => s.id === service.id)) {
      setSelectedServices(selectedServices.filter(s => s.id !== service.id));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* --- User Signature Modal --- */}
      {showSignatureModal && (
          <Suspense fallback={<div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div></div>}>
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                  <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col">
                      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
                          <h3 className="font-bold text-slate-800 flex items-center">
                              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center mr-3">
                                  <CheckSquare size={16} className="text-teal-600" />
                              </div>
                              ลายเซ็นลูกค้ายินยอมรับบริการ
                          </h3>
                          <button onClick={() => setShowSignatureModal(false)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                              <X size={20} />
                          </button>
                      </div>
                      <div className="p-4 bg-slate-50/50 rounded-b-3xl space-y-4">
                          <SignaturePad 
                              label="ลายเซ็นลูกค้า"
                              canvasRef={modalSigRef}
                              onSigned={(sig) => setModalSignatureData(sig)}
                          />
                          <div className="flex gap-3 justify-end">
                              <button
                                  type="button"
                                  onClick={() => setShowSignatureModal(false)}
                                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
                              >
                                  ยกเลิก
                              </button>
                              <button
                                  type="button"
                                  onClick={() => handleSaveSignature(modalSignatureData)}
                                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm transition-colors"
                              >
                                  บันทึก
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </Suspense>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-pink-100 text-pink-600 rounded-2xl">
              <Scissors size={28} />
            </div>
            ระบบตัดคอร์สบริการ
          </h2>
          <p className="text-slate-500 mt-2 font-medium">ค้นหาลูกค้าและเลือกคอร์สที่ต้องการตัดใช้งาน</p>
        </div>
        {onGoBack && (
          <button
            type="button"
            onClick={onGoBack}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
          >
            กลับหน้าหลัก
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <div className="relative max-w-xl mx-auto mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, เบอร์โทร, HN หรือสแกน/พิมพ์เลขที่ใบคอร์ส..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const cust = findCustomerByCourseRef(searchTerm);
                if (cust) {
                  e.preventDefault();
                  setSelectedCustomer(cust);
                  setSearchTerm('');
                  notify(`พบใบคอร์สของ ${getCustomerName(cust)}`, 'success');
                }
              }
            }}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-pink-400 focus:ring-4 focus:ring-pink-100 outline-none transition-all text-lg font-medium"
          />
        </div>

        {!selectedCustomer && searchTerm && (
          <div className="max-w-xl mx-auto space-y-2">
            {filteredCustomers.length > 0 ? filteredCustomers.map(cust => (
              <div 
                key={cust.id}
                onClick={() => {
                  setSelectedCustomer(cust);
                  setSearchTerm('');
                }}
                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-pink-50 border border-transparent hover:border-pink-100 cursor-pointer transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                  <User size={24} />
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-lg">{getCustomerName(cust) || '-'}</div>
                  <div className="text-sm text-slate-500">HN: {getCustomerHn(cust) || '-'} • โทร: {getCustomerPhone(cust) || '-'}</div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-slate-500">ไม่พบข้อมูลลูกค้า</div>
            )}
          </div>
        )}

        {selectedCustomer && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                  <User size={28} />
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-xl">{getCustomerName(selectedCustomer) || '-'}</div>
                  <div className="text-slate-500 font-medium">HN: {getCustomerHn(selectedCustomer) || '-'} • โทร: {getCustomerPhone(selectedCustomer) || '-'}</div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors"
              >
                เปลี่ยนลูกค้า
              </button>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <History className="text-pink-500" /> คอร์สที่ใช้งานได้ (Active Courses)
              </h3>
              
              {activeCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeCourses.map(course => (
                    <div 
                      key={`${course.id}_${course.dateBought}`}
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-pink-300 hover:shadow-md transition-all flex flex-col h-full"
                    >
                      <div className="flex-1">
                        <div className="text-xs font-bold text-pink-500 mb-2">{getCourseCodeLabel(course)}</div>
                        <div className="font-bold text-slate-800 text-lg leading-tight mb-3">
                          {getCourseTitleLabel(course)}
                        </div>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="text-sm font-medium text-slate-500">
                            ยอดรวม: <span className="text-slate-800 font-bold">{course.totalQty} ครั้ง</span>
                          </div>
                          <div className="text-sm font-medium text-slate-500">
                            ใช้แล้ว: <span className="text-slate-800 font-bold">{course.used} ครั้ง</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="font-bold text-slate-800">
                          คงเหลือ <span className="text-2xl text-pink-600 ml-1">{course.balance}</span>
                        </div>
                        <button 
                          onClick={() => {
                            setCourseToDeduct(course);
                            setShowDeductModal(true);
                          }}
                          className="px-5 py-2 bg-pink-100 hover:bg-pink-200 text-pink-700 rounded-xl font-bold transition-colors"
                        >
                          ตัดคอร์ส
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm">
                    <History size={32} />
                  </div>
                  <h4 className="text-lg font-bold text-slate-600 mb-1">ไม่พบคอร์สที่ใช้งานได้</h4>
                  <p className="text-slate-500">ลูกค้ารายนี้ไม่มีคอร์สคงเหลือ หรือใช้ครบกำหนดแล้ว</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showDeductModal && courseToDeduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-2xl font-black text-slate-800">ยืนยันการตัดคอร์ส</h2>
                <p className="text-slate-500 font-medium">ตัดคอร์ส {getCourseTitleLabel(courseToDeduct)} (คงเหลือ {courseToDeduct.balance} ครั้ง)</p>
              </div>
              <button onClick={() => setShowDeductModal(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  เลือกรายการบริการที่ใช้ในครั้งนี้ (เลือกได้มากกว่า 1 รายการ) <span className="text-red-500">*</span>
                </label>
                
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text"
                      placeholder="ค้นหาบริการ (เช่น นวดหน้า, ขัดหน้า)..."
                      value={modalServiceSearch}
                      onChange={(e) => setModalServiceSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-3 text-sm border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-slate-50 focus:bg-white transition-colors font-medium"
                    />
                  </div>
                </div>

                {selectedServices.length > 0 && (
                  <div className="mb-4 p-2 bg-pink-50 rounded-xl flex flex-wrap gap-2 border border-pink-100">
                    {selectedServices.map(s => (
                      <div key={s.id} className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-pink-200 text-xs font-bold text-pink-700 shadow-sm">
                        {String(getFuzzyKey(s, ["ชื่อคอส", "col_4"]))}
                        <X size={12} className="cursor-pointer hover:text-red-500 ml-1" onClick={() => toggleService(s)} />
                      </div>
                    ))}
                  </div>
                )}

                {modalServiceSearch.trim() === '' ? (
                  <div className="mb-4 p-4 bg-gradient-to-r from-pink-500 to-rose-400 rounded-xl text-white shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-base">⭐</span>
                      <span className="font-bold text-sm">บริการที่ใช้บ่อย (แตะเพื่อเลือก)</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {masterCourses.filter(c => {
                         const name = String(getFuzzyKey(c, ["ชื่อคอส", "col_4"]) || '').trim();
                         const exactMatches = [
                           'กดสิวฟรี',
                           'นวดหน้าใส',
                           'ขัดหน้าขาว',
                           'ไครโอเย็น สปาเย็น (1 ครั้ง)',
                           'โอโซนร้อน/เย็น (1 ครั้ง)',
                           'B. ดูดสิวเสี้ยนครบขั้นตอน (1 ครั้ง)',
                           'มาร์คหน้าขาวครบขั้นตอน'
                         ];
                         return exactMatches.includes(name);
                      }).slice(0, 10).map(srv => {
                          const isSelected = selectedServices.some(s => s.id === srv.id);
                          const originalName = String(getFuzzyKey(srv, ["ชื่อคอส", "col_4"])).trim();
                          const displayNames = {
                            'กดสิวฟรี': 'กดสิวฟรี',
                            'นวดหน้าใส': 'นวดหน้าใส',
                            'ขัดหน้าขาว': 'ขัดหน้าขาว',
                            'ไครโอเย็น สปาเย็น (1 ครั้ง)': 'สปา',
                            'โอโซนร้อน/เย็น (1 ครั้ง)': 'โอโซน',
                            'B. ดูดสิวเสี้ยนครบขั้นตอน (1 ครั้ง)': 'ดูดสิวเสี้ยน',
                            'มาร์คหน้าขาวครบขั้นตอน': 'มาร์ค'
                          };
                          const displayName = displayNames[originalName] || originalName;
                          return (
                             <button
                                key={srv.id}
                                onClick={() => toggleService(srv)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all border ${isSelected ? 'bg-white text-pink-600 border-white shadow-sm' : 'bg-white/20 text-white border-white/30 hover:bg-white/30'}`}
                             >
                                {displayName}
                             </button>
                          )
                      })}
                    </div>
                  </div>
                ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1">
                  {singleServices.map(srv => {
                    const isSelected = selectedServices.some(s => s.id === srv.id);
                    return (
                      <div 
                        key={srv.id}
                        onClick={() => toggleService(srv)}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-2 ${isSelected ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-sm' : 'border-slate-100 hover:border-pink-200 bg-white text-slate-600'}`}
                      >
                        <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-pink-500 bg-pink-500 text-white' : 'border-slate-300'}`}>
                          {isSelected && <CheckCircle size={12} />}
                        </div>
                        <div className="text-xs sm:text-sm font-medium leading-tight">
                          {String(getFuzzyKey(srv, ["ชื่อคอส", "col_4"]))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                )}
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h3 className="font-bold text-slate-700 mb-4">ข้อมูลการรับบริการ</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-2">พนักงานผู้ให้บริการ <span className="text-red-500">*</span></label>
                    <select value={paymentStaff} onChange={e => setPaymentStaff(e.target.value)} className="w-full border-2 border-slate-200 rounded-xl p-3 outline-none focus:border-pink-400 font-medium">
                      <option value="">-- เลือกพนักงาน --</option>
                      {availableStaffList.map(emp => (
                        <option key={emp.id} value={emp.name}>{emp.name}{emp.branch ? ` (${emp.branch})` : ''}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                     <label className="block text-sm font-bold text-slate-600 mb-2">อัปโหลดรูปภาพ Before/After (ถ้ามี)</label>
                     <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative overflow-hidden">
                       <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                              const reader = new FileReader();
                              reader.onload = (e) => setPaymentPhotoUrl(e.target.result);
                              reader.readAsDataURL(file);
                          }
                       }} className="absolute inset-0 opacity-0 cursor-pointer" />
                       
                       {paymentPhotoUrl ? (
                         <div className="text-center text-emerald-600 font-bold flex flex-col items-center">
                           <CheckCircle size={32} className="mb-2" />
                           อัปโหลดรูปภาพเรียบร้อยแล้ว
                         </div>
                       ) : (
                         <div className="text-center text-slate-500 font-medium flex flex-col items-center">
                           <Upload size={32} className="mb-2 text-slate-400" />
                           คลิกเพื่อเลือกไฟล์รูปภาพ
                         </div>
                       )}
                     </div>
                  </div>

                  <div>
                     <label className="block text-sm font-bold text-slate-600 mb-2">บันทึกการรักษา (Treatment Notes)</label>
                     <textarea 
                        value={treatmentNotes}
                        onChange={(e) => setTreatmentNotes(e.target.value)}
                        placeholder="เช่น 500 ช็อต, พลังงาน 2.0, หน้าแดงนิดหน่อย"
                        className="w-full border-2 border-slate-200 rounded-xl p-3 outline-none focus:border-pink-400 font-medium h-24 resize-none"
                     ></textarea>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <SignaturePad canvasRef={custSigRef} label="ลายเซ็นลูกค้า" onSigned={() => {}} />
                     <SignaturePad canvasRef={staffSigRef} label="ลายเซ็นพนักงาน" onSigned={() => {}} />
                  </div>
                </div>
              </div>

            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setShowDeductModal(false)}
                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-lg transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                onClick={handleDeduct}
                disabled={isProcessing}
                className={`flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${isProcessing ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' : 'bg-pink-600 hover:bg-pink-700 text-white shadow-pink-200'}`}
              >
                {isProcessing ? (
                  <><span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> กำลังบันทึก...</>
                ) : (
                  <><Scissors size={24} /> ยืนยันการตัดคอร์ส</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
