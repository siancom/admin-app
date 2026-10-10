import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  CheckCircle, X, Search, CalendarDays, ReceiptText, 
  Package, Camera, Clock, AlertCircle, Loader2, DollarSign, 
  LogOut, LayoutDashboard, CheckSquare, Image as ImgIcon, 
  Database, FileText, ArrowRight, Sparkles,
  ScanLine, History, Users, Settings, Trash2, Upload, MapPin, 
  CreditCard, Info, User, Menu, ChevronRight, ChevronLeft, 
  Phone, RefreshCcw, Globe, CalendarPlus, Plus, Edit3, Trash, 
  Activity, ShoppingBag, Store, AlertTriangle, ShieldCheck,
  Timer, UserCheck, BellRing, Play
} from 'lucide-react';

import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, doc, updateDoc, addDoc, writeBatch, deleteDoc } from 'firebase/firestore';
import { auth, db, getCol, getDocRef } from './config/firebase';

// --- UTILS ---
import { parseCSVRow } from './utils/parse';
import { isUsageType, isAddType, isFreeUsageMobile as isFreeUsage, extractHistoryQty } from './utils/courseUtils';
import { fetchWithProxy, fetch17Track } from './utils/wooProxy';

// ============================================================================
// 🌟 MOBILE-SPECIFIC HELPER FUNCTIONS
// ============================================================================

const safeRender = (v) => { 
    if(v == null) return ''; 
    if(typeof v === 'object') {
        if(typeof v.toDate === 'function') return v.toDate().toLocaleString('th-TH');
        if(v instanceof Date) return v.toLocaleString('th-TH');
        if(Array.isArray(v)) return v.map(safeRender).join(', ');
        try { return JSON.stringify(v); } catch(e) { return ''; }
    } 
    return String(v).trim(); 
};

const formatDate = (dateVal) => {
    if (!dateVal) return '-';
    try {
        if (typeof dateVal === 'object') {
            if (typeof dateVal.toDate === 'function') return dateVal.toDate().toLocaleDateString('th-TH');
            if (dateVal instanceof Date) return dateVal.toLocaleDateString('th-TH');
        }
        const d = new Date(dateVal);
        if (!isNaN(d.getTime())) return d.toLocaleDateString('th-TH');
        return String(dateVal);
    } catch (e) {
        return '-';
    }
};

const parseDateForSort = (dateVal) => {
    if (!dateVal) return 0;
    try {
        if (typeof dateVal === 'object' && typeof dateVal.toDate === 'function') return dateVal.toDate().getTime();
        const d = new Date(dateVal);
        return isNaN(d.getTime()) ? 0 : d.getTime();
    } catch (e) {
        return 0;
    }
};

const parseThaiDate = (dateStr) => {
    if (!dateStr || String(dateStr).trim() === '-' || String(dateStr).trim() === '') return null;
    const cleanStr = String(dateStr).split(' ')[0].split('T')[0];
    const parts = cleanStr.split(/[-/]/);
    if (parts.length >= 3) {
        let year, month, day;
        if (parts[0].length >= 4) {
            year = parseInt(parts[0], 10); month = parseInt(parts[1], 10) - 1; day = parseInt(parts[2], 10);
        } else {
            day = parseInt(parts[0], 10); month = parseInt(parts[1], 10) - 1; year = parseInt(parts[2], 10);
        }
        if (year > 2500) year -= 543; else if (year > 0 && year < 100) year += 2000;
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) return d;
    }
    const dFallback = new Date(dateStr);
    return isNaN(dFallback.getTime()) ? null : dFallback;
};

import { getFuzzyKey as getVal } from './utils/fuzzy';
import { sendOrderLineNotification } from './utils/lineUtils';

const parseNum = (val) => {
    if (val === undefined || val === null || val === '') return 0;
    const cleaned = String(val).replace(/,/g, '').replace(/[^\d.-]/g, '').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
};

const isActive899 = (h) => {
    const rawRemark = String(getVal(h, ["หมายเหตุ", "col_10", "col_11", "col_12"]) || '').replace(/\s/g, '').toLowerCase();
    const rawAction = String(getVal(h, ["รายการที่ทำ", "รายการ", "col_23", "col_18"]) || '').replace(/\s/g, '').toLowerCase();
    const rawProduct = String(getVal(h, ["สินค้า", "col_18", "col_16"]) || '').replace(/\s/g, '').toLowerCase();
    return rawRemark.includes('แอคทีฟ899') || rawAction.includes('แอคทีฟ899') || rawProduct.includes('แอคทีฟ899');
};

// 🌟 Generate Date Options สำหรับป้ายวันที่ 🌟
const generateDateOptions = () => {
    const options = [];
    const today = new Date();
    const dayNames = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
    const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

    // ย้อนหลัง 2 วัน ถึง ล่วงหน้า 7 วัน
    for (let i = -2; i <= 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const val = `${yyyy}-${mm}-${dd}`;

        let label = '';
        if (i === 0) label = 'วันนี้';
        else if (i === 1) label = 'พรุ่งนี้';
        else if (i === -1) label = 'เมื่อวาน';
        else label = dayNames[d.getDay()];

        const dateDisplay = `${d.getDate()} ${monthNames[d.getMonth()]}`;

        options.push({ value: val, label, dateDisplay });
    }
    return options;
};

// 🌟 Course Stats Logic 🌟
const computeCourseStats = (c, allHistories = [], isParsed = false) => {
    if (!c) return { total: 0, used: 0, remain: 0, status: 'ไม่มีข้อมูล', credit: 0, usedCredit: 0, remainCredit: 0, expireText: '', diffDays: 0, myHistories: [] };

    const courseId = c.id;
    const cRef = String(getVal(c, ['เลขที่ใบคอส', 'col_2']) || '').trim().toLowerCase();
    const cPhone = String(getVal(c, ['เบอร์โทร', 'col_1'])).replace(/[^0-9]/g, '');
    const custName = String(getVal(c, ['ผู้ซื้อคอส', 'ชื่อลูกค้า', 'ชื่อ', 'col_9'])).trim();
    const cNameRaw = String(getVal(c, ['ชื่อคอส', 'col_8'])).trim().toLowerCase();

    const linkedHistories = allHistories.filter(h => {
        // 1) Exact match by system-generated courseId (highest priority)
        if (courseId && h.courseId === courseId) return true;

        const hRefRaw = isParsed ? h._hRefRaw : String(getVal(h, ['เลขที่ใบคอส', 'รหัสใบคอส', 'อ้างอิง', 'col_6'])).trim().toLowerCase();

        // 2) Exact match by course ref number (e.g. "iriscourse570" === "iriscourse570")
        if (cRef && cRef !== '-' && cRef.length > 2 && hRefRaw === cRef) return true;

        // 3) Fallback: customer phone + customer name + course name must ALL match
        if (cPhone && cPhone.length >= 9) {
            const hPhoneRaw = isParsed ? h._hPhoneRaw : String(getVal(h, ['เบอร์โทร', 'customerPhone', 'col_5'])).replace(/[^0-9]/g, '');
            if (hPhoneRaw === cPhone) {
                const hCustName = isParsed ? h._hCustName : String(getVal(h, ['ชื่อลูกค้า', 'ชื่อ', 'customerName', 'col_2'])).trim().toLowerCase();
                const hItemRaw = isParsed ? h._hItemRaw : String(getVal(h, ["สินค้า", "ชื่อคอส", "รายการ", "col_18", "col_16", "col_23"])).trim().toLowerCase();
                if (custName && hCustName && cNameRaw && hItemRaw) {
                    const custMatch = custName.toLowerCase() === hCustName.toLowerCase() || hCustName.includes(custName.toLowerCase());
                    const itemMatch = cNameRaw === hItemRaw || (cNameRaw.length > 4 && hItemRaw.length > 4 && (cNameRaw.includes(hItemRaw) || hItemRaw.includes(cNameRaw)));
                    if (custMatch && itemMatch) return true;
                }
            }
        }
        return false;
    });

    let baseTotalQty = parseNum(getVal(c, ['จำนวนครั้งที่ได้', 'จำนวนรวม', 'ยอดเต็ม', 'col_10']));
    let baseUsedQty = parseNum(getVal(c, ['ครั้งที่ใช้', 'ใช้ไป', 'รวมใช้งานแล้ว', 'col_5']));
    const rawRemainStr = String(getVal(c, ['คงเหลือ', 'ครั้งที่เหลือ', 'ครั้งที่เหลือดิบ', 'col_4']) || '').trim();

    if (baseTotalQty === 0 && rawRemainStr !== '') {
        baseTotalQty = parseNum(rawRemainStr) + baseUsedQty;
    }
    
    let historyAdded = 0, historyUsed = 0, historyUsedCredit = 0;

    linkedHistories.forEach(h => {
        if (h.isCancelled || String(getVal(h, ['สถานะ', 'col_7', 'col_8', 'col_9'])).includes('ยกเลิก')) return;

        const isNewSystemRecord = !!h.courseId;

        const type = String(getVal(h, ['ประเภท', 'col_4'])).trim();
        const hQty = extractHistoryQty(h);
        const hAmount = parseNum(getVal(h, ['ยอดสินค้า', 'ยอดเงิน', 'ยอดเบิก', 'col_19'])) || 0;

        if (isUsageType(type)) {
            if (!isFreeUsage(h)) {
                if (isNewSystemRecord) historyUsed += hQty;
                historyUsedCredit += hAmount;
            }
        } else if (isAddType(type)) {
            if (isNewSystemRecord) historyAdded += hQty;
        } else if (!type && !isFreeUsage(h) && isNewSystemRecord) {
            if (hAmount > 0) historyUsedCredit += hAmount;
            if (hQty > 0 && hAmount === 0) historyUsed += hQty; 
        }
    });

    let totalQty = baseTotalQty + historyAdded;
    let totalUsed = baseUsedQty + historyUsed;
    let remaining = Math.max(0, totalQty - totalUsed);

    const coursePrice = parseNum(getVal(c, ['ราคา', 'ราคาคอร์ส', 'ยอดเต็ม', 'col_13']));
    let totalCredit = parseNum(getVal(c, ['เครดิตที่ได้รับ', 'เครดิตที่ได้', 'วงเงินคอร์ส', 'วงเงิน', 'เครดิต', 'col_14', 'col_15']));

    if (totalCredit === 0 && coursePrice > 0 && (cNameRaw.includes('เครดิต') || cNameRaw.includes('วงเงิน') || cNameRaw.includes('voucher'))) {
        totalCredit = coursePrice;
    }

    let baseUsedCredit = parseNum(getVal(c, ['ยอดเบิกดิบ', 'เบิกไปแล้ว', 'col_15', 'col_16'])) + parseNum(getVal(c, ['ยอดสะสมเดิม', 'col_16', 'col_17']));
    let totalUsedCredit = baseUsedCredit + historyUsedCredit;

    if (totalCredit > 0) totalUsedCredit = Math.min(totalCredit, totalUsedCredit);
    let remainCredit = Math.max(0, totalCredit - totalUsedCredit);

    let currentStatus = getVal(c, ['สถานะ', 'col_11']);
    if (currentStatus !== 'ยกเลิก') {
        const isQtyDepleted = totalQty > 0 && remaining <= 0;
        const isCreditDepleted = totalCredit > 0 && remainCredit <= 0;
        
        if (isQtyDepleted || (totalQty === 0 && totalCredit > 0 && isCreditDepleted)) {
             currentStatus = 'ใช้ครบแล้ว';
        } else {
             currentStatus = 'ยังคงเหลือ';
        }
    }

    const purchaseDateStr = getVal(c, ['วันที่ซื้อ', 'col_3']);
    let pDate = parseThaiDate(purchaseDateStr) || new Date();
    let eDate;
    const expireDateStr = getVal(c, ['วันหมดอายุ', 'หมดอายุ']);

    if (expireDateStr) {
        const expStr = String(expireDateStr).trim().toLowerCase();
        if (expStr.includes('ไม่มี') || expStr.includes('ตลอดชีพ')) {
            eDate = new Date(pDate); eDate.setFullYear(eDate.getFullYear() + 100);
        } else if (expStr.includes('เดือน')) {
            eDate = new Date(pDate); eDate.setMonth(eDate.getMonth() + (parseInt(expStr.replace(/[^0-9]/g, '')) || 1));
        } else if (expStr.includes('ปี')) {
            eDate = new Date(pDate); eDate.setFullYear(eDate.getFullYear() + (parseInt(expStr.replace(/[^0-9]/g, '')) || 1));
        } else if (expStr.includes('วัน') && !expStr.includes('/')) {
            eDate = new Date(pDate); eDate.setDate(eDate.getDate() + (parseInt(expStr.replace(/[^0-9]/g, '')) || 1));
        } else {
            eDate = parseThaiDate(expireDateStr);
            if (!eDate || eDate.getTime() <= pDate.getTime()) {
                eDate = new Date(pDate); eDate.setFullYear(eDate.getFullYear() + 1);
            }
        }
    } else {
        eDate = new Date(pDate); eDate.setFullYear(eDate.getFullYear() + 1);
    }

    const today = new Date(); today.setHours(0,0,0,0); eDate.setHours(0,0,0,0);
    const diffDays = Math.ceil((eDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    let expireText = diffDays < 0 ? "หมดอายุแล้ว" : diffDays === 0 ? "หมดอายุวันนี้" : `หมดอายุใน ${diffDays} วัน`;
    
    if (diffDays < 0 && currentStatus !== 'ยกเลิก' && currentStatus !== 'ใช้ครบแล้ว') {
        if (remaining > 0 || remainCredit > 0) currentStatus = 'หมดอายุ';
    }

    return {
        total: totalQty, used: totalUsed, remain: remaining, status: currentStatus,
        credit: totalCredit, usedCredit: totalUsedCredit, remainCredit: remainCredit,
        expireText, diffDays,
        myHistories: linkedHistories.sort((a,b) => parseDateForSort(getVal(b, ['วันที่', 'createdAt'])) - parseDateForSort(getVal(a, ['วันที่', 'createdAt'])))
    };
};

// --- DIGITAL SIGNATURE COMPONENT (Mobile-specific) ---
const SignaturePad = ({ label, onSigned }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    }, []);

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        let clientX = e.clientX, clientY = e.clientY;
        if (e.touches && e.touches.length > 0) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
        ctx.beginPath(); ctx.moveTo(clientX - rect.left, clientY - rect.top); setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        e.preventDefault(); 
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        let clientX = e.clientX, clientY = e.clientY;
        if (e.touches && e.touches.length > 0) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
        ctx.lineTo(clientX - rect.left, clientY - rect.top); ctx.stroke();
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            onSigned(canvasRef.current.toDataURL('image/png'));
        }
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        onSigned(null); 
    };

    return (
        <div className="border border-slate-300 rounded-xl overflow-hidden bg-slate-50 relative touch-none">
            <div className="absolute top-2 left-3 text-[10px] font-black text-slate-400 uppercase tracking-widest pointer-events-none">{label}</div>
            <canvas ref={canvasRef} width={400} height={150} className="w-full h-[150px] cursor-crosshair touch-none"
                onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseOut={stopDrawing}
                onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
            <button type="button" onClick={clearSignature} className="absolute bottom-2 right-2 text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-600 px-3 py-1 rounded-lg font-bold transition-colors">เซ็นใหม่</button>
        </div>
    );
};

// --- MOBILE BOTTOM SHEET MODAL ---
const ModalWrapper = ({ isOpen, onClose, title, icon: Icon, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex flex-col justify-end sm:justify-center p-0 sm:p-4 animate-in fade-in">
            <div className="bg-white rounded-t-[32px] sm:rounded-[24px] w-full max-w-lg mx-auto overflow-hidden shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-full sm:zoom-in-95">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 sm:hidden"></div>
                <div className="flex justify-between items-center p-5 border-b border-slate-100 shrink-0">
                    <h3 className="font-black text-lg text-slate-800 flex items-center">
                        {Icon && <Icon size={20} className="mr-2 text-indigo-500"/>} {title}
                    </h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"><X size={18}/></button>
                </div>
                <div className="p-5 overflow-y-auto hide-scrollbar flex-1 pb-safe">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default function AdminApp() {
  const [now, setNow] = useState(new Date());
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [user, setUser] = useState(null);
  
  const [dbData, setDbData] = useState({ bookings: [], orders: [], customers: [], histories: [], products: [], courses: [] });
  const [wooOrders, setWooOrders] = useState([]);
  const [isWooLoading, setIsWooLoading] = useState(false);
  const [wooCustomers, setWooCustomers] = useState([]);
  const [isWooCustomersLoading, setIsWooCustomersLoading] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  
  const [authStatus, setAuthStatus] = useState('checking'); 
  const [dbStatus, setDbStatus] = useState('connecting'); 
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState('');

  // Prevent zoom
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'viewport'; meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0';
    const existingMeta = document.querySelector('meta[name="viewport"]');
    if (existingMeta) document.head.removeChild(existingMeta);
    document.head.appendChild(meta);
  }, []);

  const [customerFilter, setCustomerFilter] = useState('all');
  const [courseFilterType, setCourseFilterType] = useState('all');
  const [customerProfileModal, setCustomerProfileModal] = useState({ open: false, customer: null });

  const [modalData, setModalData] = useState({ open: false, type: '', data: null, inputVal: '', trackingVal: '', linkPhoneVal: '', errorMsg: '' });
  const scannerInputRef = useRef(null);

  const [deleteModal, setDeleteModal] = useState({ open: false, type: '', data: [] });
  const [deleteProgress, setDeleteProgress] = useState({ isDeleting: false, current: 0, total: 0, type: '' });

  const [isScanning, setIsScanning] = useState(false);
  const html5QrcodeScannerRef = useRef(null);

  const [trackingStatusData, setTrackingStatusData] = useState(null);
  const [isCheckingTracking, setIsCheckingTracking] = useState(false);

  const [deductForm, setDeductForm] = useState({ qty: 1, note: '', photo: null, isLoading: false });
  const [useCourseModal, setUseCourseModal] = useState({ open: false, course: null, linkedBookingId: null, errorMsg: '' });
  const [selectCourseModal, setSelectCourseModal] = useState({ open: false, bookingId: null, courses: [] });
  const [cartItems, setCartItems] = useState([]); 
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [customerSignature, setCustomerSignature] = useState(null);
  const [staffSignature, setStaffSignature] = useState(null);

  const [bookingFilterDate, setBookingFilterDate] = useState(() => {
      const today = new Date(); return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [bookingFilterBranch, setBookingFilterBranch] = useState('ทั้งหมด');
  const [bookingFilterStatus, setBookingFilterStatus] = useState('all');
  const [activityBranch, setActivityBranch] = useState('ทั้งหมด'); 
  
  // 🌟 State จดจำสาขาล่าสุดที่เลือกจอง 🌟
  const [lastUsedBranch, setLastUsedBranch] = useState('สาขาเฉวง');

  const [isAddBookingOpen, setIsAddBookingOpen] = useState(false);
  const [newBookingForm, setNewBookingForm] = useState({ customerName: '', customerPhone: '', courseName: '', branch: 'สาขาเฉวง', date: new Date().toLocaleDateString('en-CA'), time: '' });

  // 🌟 State สำหรับแก้ไข/เลื่อนคิว 🌟
  const [isEditBookingOpen, setIsEditBookingOpen] = useState(false);
  const [editBookingForm, setEditBookingForm] = useState({ id: '', customerName: '', customerPhone: '', courseName: '', branch: '', date: '', time: '' });

  const [isAddShopeeOrderOpen, setIsAddShopeeOrderOpen] = useState(false);
  const [newShopeeOrderForm, setNewShopeeOrderForm] = useState({ orderNo: '', customerName: '', itemName: '', itemPrice: '', trackingNo: '' });

  // 🌟 State สำหรับควบคุม Popup คิวใหม่ 🌟
  const [isPendingBookingModalOpen, setIsPendingBookingModalOpen] = useState(false);
  const prevPendingState = useRef(new Map());

  const getBookingDate = (b) => b.date || (b.dateTime ? b.dateTime.split('T')[0] : '');
  const getBookingTime = (b) => {
      if (b.time) return b.time;
      if (b.dateTime && b.dateTime.includes('T')) return b.dateTime.split('T')[1].substring(0,5);
      return '';
  };

  const getLocalTodayStr = () => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const adminBookingDateOptions = useMemo(() => {
      const options = [];
      const today = new Date();
      const dayNames = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
      const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      // Generate only today and future dates (0 to 14)
      for (let i = 0; i <= 14; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          let label = i === 0 ? 'วันนี้' : i === 1 ? 'พรุ่งนี้' : dayNames[d.getDay()];
          options.push({ value: val, label, dateDisplay: `${d.getDate()} ${monthNames[d.getMonth()]}` });
      }
      return options;
  }, [now]); // Update if day changes

  const timeSlots = ['11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'];
  const quickServices = ['ทำหน้า', 'กดสิว', 'รักแร้', 'จี้ไฝ', 'ปรึกษา'];

  const bookedTimeSlotsForAdmin = useMemo(() => {
      if (!newBookingForm.date || !newBookingForm.branch) return [];
      return dbData.bookings.filter(b => getBookingDate(b) === newBookingForm.date && safeRender(b.branch) === newBookingForm.branch && !safeRender(b.status).includes('ยกเลิก')).map(b => getBookingTime(b));
  }, [dbData.bookings, newBookingForm.date, newBookingForm.branch]);

  useEffect(() => {
      if (newBookingForm.time && bookedTimeSlotsForAdmin.includes(newBookingForm.time)) setNewBookingForm(p => ({...p, time: ''}));
  }, [bookedTimeSlotsForAdmin, newBookingForm.time]);

  // 🌟 Logic เช็คคิวว่างสำหรับการแก้ไขคิว (ไม่นับคิวตัวเอง) 🌟
  const bookedTimeSlotsForEdit = useMemo(() => {
      if (!editBookingForm.date || !editBookingForm.branch) return [];
      return dbData.bookings.filter(b => b.id !== editBookingForm.id && getBookingDate(b) === editBookingForm.date && safeRender(b.branch) === editBookingForm.branch && !safeRender(b.status).includes('ยกเลิก')).map(b => getBookingTime(b));
  }, [dbData.bookings, editBookingForm.date, editBookingForm.branch, editBookingForm.id]);

  useEffect(() => {
      if (editBookingForm.time && bookedTimeSlotsForEdit.includes(editBookingForm.time)) setEditBookingForm(p => ({...p, time: ''}));
  }, [bookedTimeSlotsForEdit, editBookingForm.time]);

  const stopScanner = () => {
    if (html5QrcodeScannerRef.current) {
        try {
            if (html5QrcodeScannerRef.current.isScanning) {
                html5QrcodeScannerRef.current.stop().then(() => {
                    html5QrcodeScannerRef.current.clear();
                }).catch(() => {
                    try { html5QrcodeScannerRef.current.clear(); } catch(e){}
                }).finally(() => { html5QrcodeScannerRef.current = null; });
            } else {
                html5QrcodeScannerRef.current.clear();
                html5QrcodeScannerRef.current = null;
            }
        } catch (e) {
            html5QrcodeScannerRef.current = null;
        }
    }
  };

  useEffect(() => {
    if (!modalData.open && isScanning) { setIsScanning(false); stopScanner(); }
  }, [modalData.open, isScanning]);

  useEffect(() => {
    let isMounted = true;
    if (isScanning) {
        const initScanner = () => {
            if (!isMounted) return;
            setTimeout(() => {
                if (!document.getElementById("reader")) return;
                try {
                    stopScanner();
                    const html5QrCode = new window.Html5Qrcode("reader");
                    html5QrcodeScannerRef.current = html5QrCode;
                    
                    html5QrCode.start(
                        { facingMode: "environment" },
                        { fps: 10, qrbox: { width: 250, height: 250 } },
                        (decodedText) => {
                            if (!isMounted) return;
                            stopScanner();
                            setModalData(prev => prev.type === 'order_detail' ? {...prev, trackingVal: decodedText, errorMsg: ''} : {...prev, inputVal: decodedText, errorMsg: ''});
                            setIsScanning(false);
                        },
                        (errorMessage) => {
                            // ignore parse errors
                        }
                    ).catch((err) => {
                        console.error("Camera start error:", err);
                        alert("ไม่สามารถเปิดกล้องได้ (" + err.message + ")\n\nสาเหตุที่พบบ่อย:\n1. ยังไม่ได้อนุญาตให้ใช้กล้อง (ตรวจสอบการตั้งค่าเบราว์เซอร์)\n2. หากใช้งานผ่านมือถือ/แท็บเล็ต ระบบจำเป็นต้องใช้ HTTPS (Secure Context)");
                        setIsScanning(false);
                    });
                } catch (err) { 
                    console.error("Scanner init error:", err);
                    setIsScanning(false); 
                }
            }, 400);
        };
        if (!window.Html5Qrcode) {
            const script = document.createElement('script'); script.src = "https://unpkg.com/html5-qrcode"; script.async = true; script.onload = initScanner; document.body.appendChild(script);
        } else initScanner();
    } else stopScanner();
    return () => { isMounted = false; stopScanner(); };
  }, [isScanning]);

  useEffect(() => {
    if (!isLoggedIn) return;
    setAuthStatus('checking');
    const initAuth = async () => { try { await signInAnonymously(auth); } catch (error) { setAuthStatus('denied'); setIsLoading(false); } };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
        if (usr) { setUser(usr); setAuthStatus('authenticated'); } else { setUser(null); setAuthStatus('unauthenticated'); setIsLoading(false); }
    });
    return () => unsubscribe();
  }, [isLoggedIn]);

  useEffect(() => {
    if (!user) return;
    setDbStatus('connecting');
    const hErr = () => setDbStatus('error');
    const unsubB = onSnapshot(collection(db, 'bookings'), s => { setDbData(p => ({ ...p, bookings: s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => parseDateForSort(b.createdAt) - parseDateForSort(a.createdAt)) })); setDbStatus('connected'); }, hErr);
    const unsubO = onSnapshot(collection(db, 'orders'), s => setDbData(p => ({ ...p, orders: s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => parseDateForSort(b.createdAt) - parseDateForSort(a.createdAt)) })), hErr);
    const unsubC = onSnapshot(collection(db, 'customers'), s => setDbData(p => ({ ...p, customers: s.docs.map(d => ({ id: d.id, ...d.data() })) })), hErr);
    const unsubH = onSnapshot(collection(db, 'histories'), s => setDbData(p => ({ ...p, histories: s.docs.map(d => ({ id: d.id, ...d.data() })) })), hErr);
    const unsubP = onSnapshot(collection(db, 'products'), s => setDbData(p => ({ ...p, products: s.docs.map(d => ({ id: d.id, ...d.data() })) })), hErr);
    const unsubCo = onSnapshot(collection(db, 'courses'), s => setDbData(p => ({ ...p, courses: s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => parseDateForSort(b.createdAt) - parseDateForSort(a.createdAt)) })), hErr);
    setTimeout(() => setIsLoading(false), 1000);
    return () => { unsubB(); unsubO(); unsubC(); unsubH(); unsubP(); unsubCo(); };
  }, [user]);

  const fetchWooOrders = async () => {
      if (!WOO_CFG.url) return;
      setIsWooLoading(true);
      try {
          const data = await fetchWithProxy(`${WOO_CFG.url.replace(/\/$/, '')}/wp-json/wc/v3/orders?per_page=50`, { method: 'GET' });
          if (Array.isArray(data)) {
              setWooOrders(data.map(o => ({
                  id: `woo-${o.id}`, wooId: o.id, orderNo: `W-${o.id}`, customerName: `${o.billing?.first_name || ''} ${o.billing?.last_name || ''}`.trim(),
                  customerPhone: o.billing?.phone || '', itemType: 'product', itemName: o.line_items?.map(i => `${i.name} (x${i.quantity})`).join(', ') || 'Unknown Item',
                  itemPrice: parseFloat(o.total || 0), status: o.status, paymentMethod: o.payment_method === 'bacs' ? 'transfer' : 'branch', createdAt: o.date_created,
                  isWoo: true, trackingNo: o.meta_data?.find(m => m.key === '_tracking_number')?.value || '', shippingAddress: o.shipping && o.shipping.first_name ? `${o.shipping.first_name} ${o.shipping.last_name}\n${o.shipping.address_1} ${o.shipping.city}` : ''
              })));
          }
      } catch (err) {} finally { setIsWooLoading(false); }
  };

  const fetchWooCustomers = async () => {
      if (!WOO_CFG.url) return;
      setIsWooCustomersLoading(true);
      try {
          const data = await fetchWithProxy(`${WOO_CFG.url.replace(/\/$/, '')}/wp-json/wc/v3/customers?per_page=50`, { method: 'GET' });
          if (Array.isArray(data)) setWooCustomers(data.map(c => ({ id: `woo-cust-${c.id}`, wooId: c.id, name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.username, phone: c.billing?.phone || '-', total_spent: c.total_spent || '0', isWoo: true })));
      } catch (err) {} finally { setIsWooCustomersLoading(false); }
  };

  useEffect(() => { if (user) { fetchWooOrders(); fetchWooCustomers(); } }, [user]);

  // 🌟 Auto Cancel & Real-time Timer Effect 🌟
  useEffect(() => {
      const timerId = setInterval(() => {
          const currentDate = new Date();
          setNow(currentDate);

          if (dbData.bookings && dbData.bookings.length > 0) {
              dbData.bookings.forEach(async (b) => {
                  const s = safeRender(b.status).trim();
                  if (s === 'กำลังรอ' || s === 'รอยืนยัน') {
                      const bDate = getBookingDate(b);
                      const bTime = getBookingTime(b);
                      if (bDate && bTime) {
                          const bDateTime = new Date(`${bDate}T${bTime}`);
                          const diffMin = (currentDate - bDateTime) / 60000;
                          // หากเลยเวลามาเกิน 15 นาที ให้ยกเลิกอัตโนมัติ
                          if (diffMin >= 15) {
                              try {
                                  await updateDoc(doc(db, 'bookings', b.id), { 
                                      status: 'ยกเลิก (เลยเวลา 15 นาที)', 
                                      updatedAt: currentDate.toISOString() 
                                  });
                              } catch (e) {}
                          }
                      }
                  }
              });
          }
      }, 60000); // Check every 1 minute
      return () => clearInterval(timerId);
  }, [dbData.bookings]);

  const showToast = (msg) => { setToast(String(msg)); setTimeout(() => setToast(''), 3000); };

  const allOrders = useMemo(() => [...dbData.orders, ...wooOrders].sort((a, b) => parseDateForSort(b.createdAt) - parseDateForSort(a.createdAt)), [dbData.orders, wooOrders]);

  const allCustomers = useMemo(() => {
      const shopeeDataMap = {};
      dbData.orders.filter(o => o.isShopee && !safeRender(o.status).includes('ยกเลิก')).forEach(o => {
          const key = (!o.customerPhone.includes('*') && o.customerPhone.length >= 9) ? `phone_${o.customerPhone.replace(/[^0-9]/g, '')}` : `name_${o.customerName.trim().toLowerCase()}`;
          if (!shopeeDataMap[key]) shopeeDataMap[key] = { name: o.customerName, phone: o.customerPhone.includes('*') ? '-' : o.customerPhone, totalSpent: 0, isShopeeOnly: true };
          shopeeDataMap[key].totalSpent += parseNum(o.itemPrice);
      });

      const fbCustomers = dbData.customers.map(c => {
          const phone = String(getVal(c, ['เบอร์โทร', 'col_3'])).replace(/[^0-9]/g, '');
          const phoneKey = phone ? `phone_${phone}` : null;
          const nameKey = `name_${String(getVal(c, ['ชื่อ', 'col_1'])).trim().toLowerCase()}`;
          
          // ดึงข้อมูลชื่อเล่น และ สถานะให้ครอบคลุมคอลัมน์หลายรูปแบบ
          const nickName = String(getVal(c, ['ชื่อเล่น', 'nickname', 'col_2']) || '').trim();
          const rawStatus = String(getVal(c, ['สถานะสมาชิก', 'ประเภทสมาชิก', 'กลุ่มลูกค้า', 'ระดับ', 'สถานะ', 'col_7', 'col_8', 'col_6']) || '').trim();

          let shopeePoints = 0;
          if (phoneKey && shopeeDataMap[phoneKey]) { shopeePoints = shopeeDataMap[phoneKey].totalSpent; delete shopeeDataMap[phoneKey]; }
          else if (shopeeDataMap[nameKey]) { shopeePoints = shopeeDataMap[nameKey].totalSpent; delete shopeeDataMap[nameKey]; }
          
          return { 
              ...c, 
              computedName: getVal(c, ['ชื่อ', 'col_1']), 
              computedNickname: nickName,
              computedPhone: getVal(c, ['เบอร์โทร', 'col_3']) || '-', 
              computedStatus: rawStatus || 'ทั่วไป', 
              computedPoints: parseNum(getVal(c, ['ยอดสะสม', 'col_13'])) + shopeePoints, 
              basePoints: parseNum(getVal(c, ['ยอดสะสม', 'col_13'])), 
              shopeePoints, 
              hasShopeeOrders: shopeePoints > 0 
          };
      });
      
      const wCustomers = wooCustomers.map(c => {
          let shopeePoints = 0;
          const phoneKey = c.phone ? `phone_${String(c.phone).replace(/[^0-9]/g, '')}` : null;
          const nameKey = `name_${c.name.trim().toLowerCase()}`;
          if (phoneKey && shopeeDataMap[phoneKey]) { shopeePoints = shopeeDataMap[phoneKey].totalSpent; delete shopeeDataMap[phoneKey]; }
          else if (shopeeDataMap[nameKey]) { shopeePoints = shopeeDataMap[nameKey].totalSpent; delete shopeeDataMap[nameKey]; }
          return { ...c, computedName: c.name, computedPhone: c.phone || '-', computedStatus: 'ลูกค้าระบบเว็บ', computedPoints: parseNum(c.total_spent) + shopeePoints, shopeePoints, hasShopeeOrders: shopeePoints > 0 };
      });

      const shopeeOnlyCustomers = Object.values(shopeeDataMap).map((sc, idx) => ({ id: `shopee-cust-${idx}`, computedName: sc.name, computedPhone: sc.phone || '-', computedStatus: 'ลูกค้า Shopee', computedPoints: sc.totalSpent, shopeePoints: sc.totalSpent, basePoints: 0, isShopeeOnly: true, hasShopeeOrders: true }));

      return [...fbCustomers, ...wCustomers, ...shopeeOnlyCustomers].sort((a,b) => String(a.computedName).localeCompare(String(b.computedName)));
  }, [dbData.customers, wooCustomers, dbData.orders]);

  // 🌟 Logic คิวรอยืนยัน (รวมการเช็คเวลาเปลี่ยน) 🌟
  const pendingBookings = useMemo(() => dbData.bookings.filter(b => {
      const s = safeRender(b.status).trim();
      const isStandardPending = !(s === 'กำลังรอ' || s === 'รอคิว' || s === 'กำลังใช้บริการ' || s === 'กำลังให้บริการ' || s === 'เข้ารับบริการแล้ว' || s === 'สำเร็จ' || s.includes('ยกเลิก'));
      
      // เช็คว่ามีการเปลี่ยนเวลาเงียบๆ หรือไม่
      let isSilentReschedule = false;
      if (!['เข้ารับบริการแล้ว', 'สำเร็จ', 'ยกเลิก'].includes(s) && !s.includes('ยกเลิก')) {
          const cDate = getBookingDate(b);
          const cTime = getBookingTime(b);
          
          if (b.originalTime && cTime && b.originalTime !== cTime) isSilentReschedule = true;
          if (b.originalDate && cDate && b.originalDate !== cDate) isSilentReschedule = true;
          if (s.includes('เลื่อน')) isSilentReschedule = true;
      }

      return isStandardPending || isSilentReschedule;
  }), [dbData.bookings]);
  
  const pendingSlips = useMemo(() => allOrders.filter(o => o.itemType !== 'custom_image' && o.itemType !== 'external_accumulation' && (safeRender(o.status).toLowerCase().includes('รอ') || safeRender(o.status).toLowerCase().includes('เตรียม') || ['pending', 'processing', 'on-hold'].includes(safeRender(o.status).toLowerCase()))), [allOrders]);
  const pendingFastOrders = useMemo(() => dbData.orders.filter(o => o.itemType === 'custom_image' && safeRender(o.status).includes('รอประเมินราคา')), [dbData.orders]);
  const pendingAccums = useMemo(() => dbData.orders.filter(o => o.itemType === 'external_accumulation' && safeRender(o.status).includes('รอตรวจสอบยอดสะสม')), [dbData.orders]);

  // 🌟 Popup แจ้งเตือนคิวใหม่ & ขอเลื่อนคิว เด้งอัตโนมัติ (ตรวจจับเวลาเปลี่ยน) 🌟
  useEffect(() => {
      // ติดตามทั้ง id, สถานะ, วันที่ และเวลา (ดึงเวลาจริงที่คำนวณแล้ว)
      const currentMap = new Map(pendingBookings.map(b => [b.id, `${safeRender(b.status).trim()}_${getBookingDate(b)}_${getBookingTime(b)}`]));
      const prevMap = prevPendingState.current;
      
      let shouldOpen = false;
      
      if (pendingBookings.length > 0) {
          if (prevMap.size === 0) {
              shouldOpen = true;
          } else {
              currentMap.forEach((val, id) => {
                  if (!prevMap.has(id) || prevMap.get(id) !== val) {
                      shouldOpen = true;
                  }
              });
          }
      }

      if (shouldOpen) {
          setIsPendingBookingModalOpen(true);
      } else if (pendingBookings.length === 0) {
          setIsPendingBookingModalOpen(false);
      }
      
      prevPendingState.current = currentMap;
  }, [pendingBookings]);

  const computedCourses = useMemo(() => {
      const parsedHistories = dbData.histories.map(h => ({ ...h, _hRefRaw: String(getVal(h, ['เลขที่ใบคอส', 'col_6'])).trim().toLowerCase(), _hPhoneRaw: String(getVal(h, ['เบอร์โทร', 'col_5'])).replace(/[^0-9]/g, ''), _hCustName: String(getVal(h, ['ชื่อลูกค้า', 'col_2'])).trim(), _hItemRaw: String(getVal(h, ["สินค้า", "รายการ", "col_23"])).trim().toLowerCase() }));
      return dbData.courses.map(c => ({ ...c, _stats: computeCourseStats(c, parsedHistories, true) }));
  }, [dbData.courses, dbData.histories]);

  const filteredCustomersList = useMemo(() => {
      const sq = searchQuery.toLowerCase();
      return allCustomers.filter(c => {
          const matchSearch = !sq || (safeRender(c.computedName) + safeRender(c.computedPhone)).toLowerCase().includes(sq);
          if (!matchSearch) return false;
          if (customerFilter === 'general') return !c.isWoo && !c.isShopeeOnly && (c.computedStatus === 'ทั่วไป' || !c.computedStatus);
          if (customerFilter === 'member') return !c.isWoo && !c.isShopeeOnly && c.computedStatus !== 'ทั่วไป' && !!c.computedStatus && c.computedStatus !== 'ลูกค้า Shopee';
          if (customerFilter === 'web') return !!c.isWoo;
          if (customerFilter === 'shopee') return !!c.hasShopeeOrders || !!c.isShopeeOnly;
          return true;
      }).slice(0, 100);
  }, [allCustomers, searchQuery, customerFilter]);

  const filteredCoursesList = useMemo(() => {
      const sq = searchQuery.toLowerCase();
      return computedCourses.filter(c => {
          if (getVal(c, ['สถานะ', 'col_11']) === 'ยกเลิก') return false;
          
          const courseName = String(getVal(c, ['ชื่อคอส', 'col_8']) || '');
          const isTreatment = courseName.includes('รักษา');
          if (courseFilterType === 'treatment' && !isTreatment) return false;
          if (courseFilterType === 'general' && isTreatment) return false;
          
          return !sq || (safeRender(getVal(c, ['เลขที่ใบคอส', 'col_2']))+courseName+safeRender(getVal(c, ['ผู้ซื้อคอส', 'col_9']))+safeRender(getVal(c, ['เบอร์โทร', 'col_1']))).toLowerCase().includes(sq);
      }).slice(0, 100);
  }, [computedCourses, searchQuery, courseFilterType]);

  const filteredHistoriesList = useMemo(() => {
      const sq = searchQuery.toLowerCase();
      return dbData.histories.filter(h => !sq || (safeRender(getVal(h, ['เลขที่ใบคอส', 'col_6']))+safeRender(getVal(h, ['ชื่อลูกค้า', 'col_2']))+safeRender(getVal(h, ['รายการ', 'col_23']))).toLowerCase().includes(sq)).slice(0, 100);
  }, [dbData.histories, searchQuery]);

  const todayActivities = useMemo(() => {
      const today = new Date(); today.setHours(0,0,0,0);
      const activities = [];
      dbData.histories.forEach(h => {
          const ts = parseDateForSort(getVal(h, ['createdAt', 'วันที่', 'col_1']));
          if (ts >= today.getTime()) activities.push({ id: `h-${h.id}`, type: getVal(h, ['ประเภท', 'col_4']) || 'ทำรายการ', title: getVal(h, ['รายการ', 'col_23']) || 'ทำรายการ', customer: getVal(h, ['ชื่อลูกค้า', 'col_2']) || 'ไม่ระบุ', ts, icon: History, color: 'text-blue-500', bg: 'bg-blue-50', status: getVal(h, ['สถานะ', 'col_7']) || 'สำเร็จ', branch: getVal(h, ['สาขา', 'branch']) || 'ไม่ระบุ' });
      });
      dbData.orders.forEach(o => {
          const ts = parseDateForSort(o.updatedAt || o.createdAt);
          if (ts >= today.getTime()) activities.push({ id: `o-${o.id}`, type: o.isShopee ? 'Shopee' : 'ออเดอร์', title: o.itemName || 'สั่งซื้อสินค้า', customer: o.customerName || 'ไม่ระบุ', ts, icon: ReceiptText, color: 'text-emerald-500', bg: 'bg-emerald-50', status: o.status, branch: 'ออนไลน์' });
      });
      dbData.bookings.forEach(b => {
          const ts = parseDateForSort(b.updatedAt || b.createdAt);
          if (ts >= today.getTime()) activities.push({ id: `b-${b.id}`, type: 'จองคิว', title: b.courseName || 'รับบริการ', customer: b.customerName || 'ไม่ระบุ', ts, icon: CalendarDays, color: 'text-indigo-500', bg: 'bg-indigo-50', status: b.status, branch: b.branch || 'ไม่ระบุ' });
      });
      return activities.filter(a => activityBranch === 'ทั้งหมด' || safeRender(a.branch).includes(activityBranch)).sort((a,b) => b.ts - a.ts).slice(0, 30);
  }, [dbData.histories, dbData.orders, dbData.bookings, activityBranch]);

  const globalCustomerSearch = useMemo(() => {
      if (!searchQuery) return [];
      const sq = searchQuery.toLowerCase();
      return allCustomers.filter(c => (safeRender(c.computedName) + safeRender(c.computedPhone)).toLowerCase().includes(sq)).slice(0, 50);
  }, [allCustomers, searchQuery]);

  const bookingStatusCounts = useMemo(() => {
      let baseFiltered = dbData.bookings;
      if (searchQuery) baseFiltered = baseFiltered.filter(b => (safeRender(b.customerName)+safeRender(b.customerPhone)+safeRender(b.ticketNo)).toLowerCase().includes(searchQuery.toLowerCase()));
      if (bookingFilterDate) baseFiltered = baseFiltered.filter(b => getBookingDate(b) === bookingFilterDate);
      if (bookingFilterBranch !== 'ทั้งหมด') baseFiltered = baseFiltered.filter(b => safeRender(b.branch) === bookingFilterBranch || (!b.branch && bookingFilterBranch === 'สาขาเฉวง'));

      const counts = { all: 0, pending: 0, waiting: 0, inservice: 0, completed: 0 };
      
      baseFiltered.forEach(b => {
          const s = safeRender(b.status).trim();
          const cDate = getBookingDate(b);
          const cTime = getBookingTime(b);
          let isSilentReschedule = false;
          if (!['เข้ารับบริการแล้ว', 'สำเร็จ', 'ยกเลิก'].includes(s) && !s.includes('ยกเลิก')) {
              if (b.originalTime && cTime && b.originalTime !== cTime) isSilentReschedule = true;
              if (b.originalDate && cDate && b.originalDate !== cDate) isSilentReschedule = true;
              if (s.includes('เลื่อน')) isSilentReschedule = true;
          }

          const isStandardPending = !(s === 'กำลังรอ' || s === 'รอคิว' || s === 'กำลังใช้บริการ' || s === 'กำลังให้บริการ' || s === 'เข้ารับบริการแล้ว' || s === 'สำเร็จ' || s.includes('ยกเลิก'));
          const isPending = isStandardPending || isSilentReschedule;

          counts.all++;
          if (isPending) counts.pending++;
          else if (s === 'กำลังรอ' || s === 'รอคิว') counts.waiting++;
          else if (s === 'กำลังใช้บริการ' || s === 'กำลังให้บริการ') counts.inservice++;
          else if (s === 'เข้ารับบริการแล้ว' || s === 'สำเร็จ') counts.completed++;
      });
      return counts;
  }, [dbData.bookings, searchQuery, bookingFilterDate, bookingFilterBranch]);

  // 🌟 Logic คำนวณจำนวนคิวรวมของแต่ละวันที่ 🌟
  const dateOptionsWithCounts = useMemo(() => {
      const options = generateDateOptions();
      let baseFiltered = dbData.bookings;
      if (searchQuery) baseFiltered = baseFiltered.filter(b => (safeRender(b.customerName)+safeRender(b.customerPhone)+safeRender(b.ticketNo)).toLowerCase().includes(searchQuery.toLowerCase()));
      if (bookingFilterBranch !== 'ทั้งหมด') baseFiltered = baseFiltered.filter(b => safeRender(b.branch) === bookingFilterBranch || (!b.branch && bookingFilterBranch === 'สาขาเฉวง'));

      return options.map(opt => {
          const count = baseFiltered.filter(b => getBookingDate(b) === opt.value).length;
          return { ...opt, count };
      });
  }, [dbData.bookings, searchQuery, bookingFilterBranch, now]);

  // 🌟 Logic คำนวณยอดรวมของแต่ละสาขา (อิงตามวันที่เลือก) 🌟
  const branchCounts = useMemo(() => {
      let baseFiltered = dbData.bookings;
      if (searchQuery) baseFiltered = baseFiltered.filter(b => (safeRender(b.customerName)+safeRender(b.customerPhone)+safeRender(b.ticketNo)).toLowerCase().includes(searchQuery.toLowerCase()));
      if (bookingFilterDate) baseFiltered = baseFiltered.filter(b => getBookingDate(b) === bookingFilterDate);
      
      const counts = { 'ทั้งหมด': 0, 'สาขาเฉวง': 0, 'สาขาละไม': 0 };
      baseFiltered.forEach(b => {
          counts['ทั้งหมด']++;
          const branch = safeRender(b.branch);
          if (branch === 'สาขาละไม') counts['สาขาละไม']++;
          else counts['สาขาเฉวง']++; // Fallback
      });
      return counts;
  }, [dbData.bookings, searchQuery, bookingFilterDate]);

  const filteredBookings = useMemo(() => {
      let filtered = dbData.bookings;
      if (searchQuery) filtered = filtered.filter(b => (safeRender(b.customerName)+safeRender(b.customerPhone)+safeRender(b.ticketNo)).toLowerCase().includes(searchQuery.toLowerCase()));
      if (bookingFilterDate) filtered = filtered.filter(b => getBookingDate(b) === bookingFilterDate);
      if (bookingFilterBranch !== 'ทั้งหมด') filtered = filtered.filter(b => safeRender(b.branch) === bookingFilterBranch || (!b.branch && bookingFilterBranch === 'สาขาเฉวง')); // fallback for empty branch
      
      if (bookingFilterStatus !== 'all') {
          filtered = filtered.filter(b => {
              const s = safeRender(b.status).trim();
              const cDate = getBookingDate(b);
              const cTime = getBookingTime(b);
              let isSilentReschedule = false;
              if (!['เข้ารับบริการแล้ว', 'สำเร็จ', 'ยกเลิก'].includes(s) && !s.includes('ยกเลิก')) {
                  if (b.originalTime && cTime && b.originalTime !== cTime) isSilentReschedule = true;
                  if (b.originalDate && cDate && b.originalDate !== cDate) isSilentReschedule = true;
                  if (s.includes('เลื่อน')) isSilentReschedule = true;
              }

              const isStandardPending = !(s === 'กำลังรอ' || s === 'รอคิว' || s === 'กำลังใช้บริการ' || s === 'กำลังให้บริการ' || s === 'เข้ารับบริการแล้ว' || s === 'สำเร็จ' || s.includes('ยกเลิก'));
              const isPending = isStandardPending || isSilentReschedule;

              if (bookingFilterStatus === 'pending') return isPending;
              if (bookingFilterStatus === 'waiting') return !isPending && (s === 'กำลังรอ' || s === 'รอคิว');
              if (bookingFilterStatus === 'inservice') return !isPending && (s === 'กำลังใช้บริการ' || s === 'กำลังให้บริการ');
              if (bookingFilterStatus === 'completed') return s === 'เข้ารับบริการแล้ว' || s === 'สำเร็จ';
              return true;
          });
      }

      return filtered;
  }, [dbData.bookings, searchQuery, bookingFilterDate, bookingFilterBranch, bookingFilterStatus]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === '123456') { setIsLoggedIn(true); setLoginError(''); } else { setLoginError('รหัส PIN ไม่ถูกต้อง (ทดสอบ: 123456)'); setPin(''); }
  };

  const handleAction = async (type, id) => {
      try {
          if (type === 'confirm_booking') { 
              const b = dbData.bookings.find(x => x.id === id);
              // อัปเดตเวลา original ให้เป็นเวลาล่าสุดเสมอ เพื่อเคลียร์สถานะเลื่อนเวลา
              await updateDoc(doc(db, 'bookings', id), { 
                  status: 'กำลังรอ', 
                  originalDate: getBookingDate(b),
                  originalTime: getBookingTime(b),
                  updatedAt: new Date().toISOString() 
              }); 
              showToast('อนุมัติคิวเรียบร้อย'); 
          }
          else if (type === 'mark_arrived') { await updateDoc(doc(db, 'bookings', id), { status: 'รอคิว', arrivedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }); showToast('ลูกค้ามาถึงคลินิกแล้ว'); }
          else if (type === 'extend_time') { 
              const b = dbData.bookings.find(x => x.id === id);
              const oldDateTime = new Date(`${getBookingDate(b)}T${getBookingTime(b)}`);
              oldDateTime.setMinutes(oldDateTime.getMinutes() + 15);
              const newTime = oldDateTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
              
              await updateDoc(doc(db, 'bookings', id), { 
                  time: newTime, 
                  dateTime: `${getBookingDate(b)}T${newTime}`, 
                  originalTime: newTime, // ป้องกันการเด้งป๊อปอัปแจ้งเลื่อนเวลา
                  updatedAt: new Date().toISOString() 
              });
              showToast('ขยายเวลารอคิว 15 นาที'); 
          }
          else if (type === 'start_service') { await updateDoc(doc(db, 'bookings', id), { status: 'กำลังให้บริการ', startedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }); showToast('เริ่มให้บริการ'); }
          else if (type === 'finish_booking') { await updateDoc(doc(db, 'bookings', id), { status: 'เข้ารับบริการแล้ว', completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }); showToast('ปิดจ๊อบคิวสำเร็จ'); } 
          else if (type === 'cancel_booking') { await updateDoc(doc(db, 'bookings', id), { status: 'ยกเลิก', updatedAt: new Date().toISOString() }); showToast('ยกเลิกคิวสำเร็จ'); }
          else if (type === 'approve_order') { await updateDoc(doc(db, 'orders', id), { status: 'ชำระเงินแล้ว', updatedAt: new Date().toISOString() }); triggerLineNotif(id, 'ชำระเงินแล้ว'); showToast('อนุมัติสลิปสำเร็จ'); }
          else if (type === 'cancel_order') { await updateDoc(doc(db, 'orders', id), { status: 'ยกเลิก', updatedAt: new Date().toISOString() }); triggerLineNotif(id, 'ยกเลิก'); showToast('ยกเลิกรายการสำเร็จ'); }
          else if (type === 'quote_fast_order') {
              const price = parseNum(modalData.inputVal);
              if (price <= 0) return setModalData(p => ({...p, errorMsg: 'กรุณาระบุราคาประเมินให้มากกว่า 0'}));
              await updateDoc(doc(db, 'orders', id), { itemPrice: price, originalPrice: price, status: 'รอชำระเงิน', updatedAt: new Date().toISOString() }); triggerLineNotif(id, 'รอชำระเงิน');
              showToast('ส่งราคาประเมินให้ลูกค้าแล้ว'); setModalData({open:false, errorMsg: ''});
          }
          else if (type === 'approve_accumulation') {
              const amount = parseNum(modalData.inputVal);
              if (amount <= 0) return setModalData(p => ({...p, errorMsg: 'กรุณาระบุยอดที่สั่งซื้อจริง'}));
              const order = dbData.orders.find(o => o.id === id);
              if (order) {
                  await addDoc(collection(db, 'histories'), { ประเภท: 'สะสมยอดนอกระบบ', ชื่อลูกค้า: order.customerName || 'ไม่ระบุ', เบอร์โทร: order.customerPhone || '', รายการที่ทำ: order.itemName, ยอดสินค้า: amount, วันที่: new Date().toISOString(), ผู้บันทึก: 'Admin App' });
                  await updateDoc(doc(db, 'orders', id), { itemPrice: amount, status: 'ชำระเงินแล้ว', updatedAt: new Date().toISOString() }); triggerLineNotif(id, 'ชำระเงินแล้ว');
                  showToast('อนุมัติและเพิ่มยอดสะสมให้ลูกค้าสำเร็จ'); setModalData({open:false, errorMsg: ''});
              }
          }
          else if (type === 'link_shopee_phone') {
              const newPhone = String(modalData.linkPhoneVal || '').trim();
              if (newPhone.length < 9) return setModalData(p => ({...p, errorMsg: 'กรุณากรอกเบอร์โทรลูกค้าให้ถูกต้อง'}));
              const currentOrder = dbData.orders.find(o => o.id === id);
              if (!currentOrder) return;
              const ordersToUpdate = dbData.orders.filter(o => o.isShopee && o.customerName === currentOrder.customerName);
              const batch = writeBatch(db);
              ordersToUpdate.forEach(o => batch.update(doc(db, 'orders', o.id), { customerPhone: newPhone, updatedAt: new Date().toISOString() }));
              await batch.commit();
              showToast(`เชื่อมโยงออเดอร์สำเร็จ! อัปเดต ${ordersToUpdate.length} รายการ`);
              setModalData(p => ({...p, data: {...p.data, customerPhone: newPhone}, linkPhoneVal: '', errorMsg: ''}));
          }
          else if (type === 'process_scan') {
              const val = String(modalData.inputVal).trim().toUpperCase();
              if (!val) return setModalData(p => ({...p, errorMsg: 'กรุณากรอกรหัสอ้างอิง'}));
              if (val.startsWith('OD')) {
                  const foundOrder = dbData.orders.find(o => String(o.orderNo).toUpperCase() === val);
                  if (foundOrder) return setModalData({ open: true, type: 'scan_result', data: { type: 'order', item: foundOrder }, inputVal: '' });
              } else if (val.startsWith('BK') || val.startsWith('GBK')) {
                  const foundBooking = dbData.bookings.find(b => String(b.ticketNo).toUpperCase() === val);
                  if (foundBooking) return setModalData({ open: true, type: 'scan_result', data: { type: 'booking', item: foundBooking }, inputVal: '' });
              } else {
                  const foundCourse = dbData.courses.find(c => String(c["เลขที่ใบคอส"] || '').toUpperCase() === val);
                  if (foundCourse) return setModalData({ open: true, type: 'scan_result', data: { type: 'course', item: foundCourse }, inputVal: '' });
              }
              setModalData(p => ({...p, errorMsg: 'ไม่พบข้อมูลที่ตรงกับรหัสอ้างอิงนี้ในระบบ'}));
          }
      } catch (error) { showToast('เกิดข้อผิดพลาด: ' + error.message); }
  };

  const handleWooAction = async (actionType, wooId) => {
      try {
          showToast('กำลังอัปเดตข้อมูลเว็บ...');
          const wooStatus = actionType === 'approve' ? 'completed' : 'cancelled';
          await fetchWithProxy(`${WOO_CFG.url.replace(/\/$/, '')}/wp-json/wc/v3/orders/${wooId}`, {
              method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: wooStatus })
          }, true);
          setWooOrders(prev => prev.map(o => o.wooId === wooId ? { ...o, status: wooStatus } : o));
          showToast('อัปเดตสถานะบนเว็บไซต์สำเร็จ!');
      } catch (err) { showToast('เว็บติดระบบป้องกัน (CORS) ไม่สามารถอัปเดตได้'); }
  };

  const handleUpdateTracking = async (order, trackingNo) => {
      if (!trackingNo || !trackingNo.trim()) return setModalData(p => ({...p, errorMsg: 'กรุณาระบุเลขพัสดุ'}));
      try {
          showToast('กำลังบันทึกเลขพัสดุ...');
          const finalTracking = trackingNo.trim();
          if (order.isWoo) {
              await fetchWithProxy(`${WOO_CFG.url.replace(/\/$/, '')}/wp-json/wc/v3/orders/${order.wooId}`, {
                  method: 'PUT', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ meta_data: [{ key: 'tracking_number', value: finalTracking }], status: 'completed' })
              }, true);
              setWooOrders(prev => prev.map(o => o.wooId === order.wooId ? { ...o, trackingNo: finalTracking, status: 'completed' } : o));
          } else {
              await updateDoc(doc(db, 'orders', order.id), { trackingNo: finalTracking, status: 'ชำระเงินแล้ว', fulfillment: 'shipped', updatedAt: new Date().toISOString() }); triggerLineNotif(order.id, 'จัดส่งแล้ว', order);
          }
          showToast('บันทึกเลขพัสดุสำเร็จ!');
          setModalData(p => ({...p, data: {...p.data, trackingNo: finalTracking, status: order.isWoo ? 'completed' : 'จัดส่งแล้ว'}, errorMsg: ''}));
      } catch (err) { setModalData(p => ({...p, errorMsg: 'ติดข้อจำกัดความปลอดภัยของเว็บ (CORS)'})); }
  };

  const handleCheck17Track = async (trackingNo) => {
      if (!trackingNo) return;
      setIsCheckingTracking(true); setTrackingStatusData(null);
      try {
          let data = await fetch17Track("https://api.17track.net/track/v2.2/gettrackinfo", [{ "number": trackingNo }]);
          if (data.data && data.data.rejected && data.data.rejected.length > 0) {
              const regRes = await fetch17Track("https://api.17track.net/track/v2.2/register", [{ "number": trackingNo }]);
              if (regRes.code === 0) return showToast('ลงทะเบียนเลขพัสดุเข้าระบบ 17Track สำเร็จ! กรุณารอ 1-2 นาที แล้วเช็คอีกครั้ง');
          }
          if (data.data && data.data.accepted && data.data.accepted.length > 0 && (data.data.accepted[0].track_info || data.data.accepted[0].track)) {
              setTrackingStatusData(data.data.accepted[0].track_info || data.data.accepted[0].track); showToast('ดึงข้อมูลสำเร็จ!');
              // 🌟 บันทึกสรุปสถานะลง order.trackingInfo เพื่อให้แอปลูกค้าเห็นสถานะพัสดุด้วย (โดยไม่ต้องใช้ token)
              if (modalData?.data?.id) {
                  try {
                      const ti = data.data.accepted[0].track_info || null;
                      if (ti) {
                          const allEvents = (ti.tracking?.providers || []).flatMap((p: any) => p?.events || []);
                          const lastEv = ti.latest_event || allEvents[allEvents.length - 1];
                          const normPhase = (s: any) => { const x = String(s || 'Pending'); const c = x.charAt(0).toLowerCase() + x.slice(1); return c.replace(/_([a-zA-Z])/g, (_m: any, ch: string) => ch.toUpperCase()); };
                          await updateDoc(doc(db, 'orders', modalData.data.id), { trackingInfo: {
                              number: trackingNo,
                              carrier: String(data.data.accepted[0].carrier || ''),
                              phase: normPhase(ti.latest_status?.status),
                              lastEvent: lastEv ? { time: lastEv.time_iso || '', desc: lastEv.description || '', location: lastEv.location || '' } : null,
                              events: allEvents.slice(-8).reverse().map((e: any) => ({ time: e.time_iso || '', desc: e.description || '', location: e.location || '' })),
                              fetchedAt: new Date().toISOString()
                          }});
                      }
                  } catch (e) { console.error('save trackingInfo error', e); }
              }
          } else { showToast('ยังไม่มีความเคลื่อนไหวจากบริษัทขนส่ง'); }
      } catch (error) { showToast('ไม่สามารถเชื่อมต่อ 17track ได้ในขณะนี้'); } finally { setIsCheckingTracking(false); }
  };

  const openCourseDetail = (course) => {
      setDeductForm({ qty: 1, note: '', photo: null, isLoading: false });
      setModalData({ open: true, type: 'course_detail', data: course, errorMsg: '' });
  };

  const openUseCourseModal = (course, linkedBookingId = null) => {
      setUseCourseModal({ open: true, course, linkedBookingId, errorMsg: '' });
      setCartItems([]); setProductSearchTerm(''); setCustomerSignature(null); setStaffSignature(null); setDeductForm({ qty: 1, note: '', photo: null, isLoading: false }); setModalData({ open: false }); 
  };

  const addToCart = (product) => {
      const price = parseNum(getVal(product, ['ราคา', 'col_6']));
      const currentStock = parseNum(getVal(product, ['จำนวนคงเหลือ', 'col_12']));
      if (currentStock <= 0) return showToast('สินค้าหมดสต็อก');
      setCartItems(prev => {
          const existing = prev.find(item => item.product.id === product.id);
          if (existing) { if (existing.qty + 1 > currentStock) return prev; return prev.map(item => item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item); }
          return [...prev, { product, qty: 1, price }];
      });
      setProductSearchTerm(''); 
  };

  const removeFromCart = (productId) => {
      setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleDeductCourse = async (e) => {
      e.preventDefault();
      const course = modalData.data || useCourseModal.course;
      const qty = parseInt(deductForm.qty);
      const isDeductingCourse = qty > 0;
      const isDeductingProducts = cartItems && cartItems.length > 0;

      if (!isDeductingCourse && !isDeductingProducts) {
          if (useCourseModal.open) setUseCourseModal(p => ({...p, errorMsg: 'กรุณาระบุจำนวนคอร์สที่ตัด หรือ เลือกสินค้า'}));
          else setModalData(p => ({...p, errorMsg: 'กรุณาระบุจำนวนที่ตัด'}));
          return;
      }
      
      const stats = course._stats || computeCourseStats(course, dbData.histories, true);
      if (isDeductingCourse && qty > stats.remain) return setUseCourseModal(p => ({...p, errorMsg: 'จำนวนคงเหลือไม่เพียงพอ'}));

      let cartTotalValue = 0;
      if (isDeductingProducts) {
          cartTotalValue = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
          if (cartTotalValue > stats.remainCredit) return setUseCourseModal(p => ({...p, errorMsg: 'เครดิตคงเหลือไม่เพียงพอ'}));
      }

      if (useCourseModal.open && (!customerSignature || !staffSignature)) {
          return setUseCourseModal(p => ({...p, errorMsg: 'กรุณาให้ลูกค้าและพนักงานเซ็นชื่อเพื่อยืนยันรายการให้ครบถ้วน'}));
      }

      setDeductForm(p => ({...p, isLoading: true}));
      try {
          const batch = writeBatch(db);
          const orderRefNo = `SVC${Date.now().toString().slice(-6)}`;
          const currentDateStr = new Date().toLocaleDateString('th-TH');
          const currentTimeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
          const customerName = getVal(course, ['ผู้ซื้อคอส', 'ชื่อลูกค้า', 'col_9']) || 'ไม่ระบุ';
          const customerPhone = getVal(course, ['เบอร์โทร', 'col_1']) || '';
          const courseRef = getVal(course, ['เลขที่ใบคอส', 'col_2']) || '';
          const branch = getVal(course, ['สาขาที่ซื้อ', 'col_7']) || 'ไม่ระบุ';

          if (isDeductingCourse) {
              const newRemain = stats.remain - qty;
              batch.update(doc(db, 'courses', course.id), { 'ครั้งที่ใช้': String(stats.used + qty), 'ครั้งที่เหลือดิบ': String(newRemain), 'คงเหลือ': String(newRemain), 'สถานะ': newRemain <= 0 ? 'ใช้ครบแล้ว' : 'ยังคงเหลือ', updatedAt: new Date().toISOString() });
              batch.set(doc(collection(db, 'histories')), { 'วันที่': currentDateStr, 'เวลา': currentTimeStr, 'ชื่อลูกค้า': customerName, 'เบอร์โทร': customerPhone, 'เลขที่ใบคอส': courseRef, 'หมายเลขคำสั่งซื้อ': orderRefNo, 'courseId': course.id, 'ประเภท': 'ใช้คอร์ส', 'รายการ': deductForm.note || getVal(course, ['ชื่อคอส', 'col_8']), 'จำนวน': String(qty), 'สถานะ': 'เรียบร้อย', 'สาขา': branch, 'customerPhoto': deductForm.photo || '', 'customerSignature': customerSignature || '', 'staffSignature': staffSignature || '', 'ผู้บันทึก': 'Admin App', 'createdAt': new Date().toISOString() });
          }
          if (isDeductingProducts) {
              batch.update(doc(db, 'courses', course.id), { 'ยอดเบิก': String(stats.usedCredit + cartTotalValue), updatedAt: new Date().toISOString() });
              cartItems.forEach(item => {
                  batch.set(doc(collection(db, 'histories')), { 'วันที่': currentDateStr, 'เวลา': currentTimeStr, 'ชื่อลูกค้า': customerName, 'เบอร์โทร': customerPhone, 'เลขที่ใบคอส': courseRef, 'หมายเลขคำสั่งซื้อ': orderRefNo, 'courseId': course.id, 'ประเภท': 'เบิกสินค้า', 'รายการ': getVal(item.product, ['ชื่อสินค้า', 'col_2']), 'จำนวนเบิก': String(item.qty), 'ยอดเบิก': String(item.price * item.qty), 'สถานะ': 'เรียบร้อย', 'สาขา': branch, 'customerPhoto': deductForm.photo || '', 'customerSignature': customerSignature || '', 'staffSignature': staffSignature || '', 'ผู้บันทึก': 'Admin App', 'createdAt': new Date().toISOString() });
                  batch.update(doc(db, 'products', item.product.id), { 'จำนวนคงเหลือ': String(Math.max(0, parseNum(getVal(item.product, ['จำนวนคงเหลือ', 'col_12'])) - item.qty)) });
              });
          }

          if (useCourseModal.linkedBookingId) {
              batch.update(doc(db, 'bookings', useCourseModal.linkedBookingId), { status: 'เข้ารับบริการแล้ว', completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
          }

          await batch.commit();
          
          if (useCourseModal.linkedBookingId) showToast('ตัดคอร์สและปิดคิวจองสำเร็จ!');
          else showToast(`ทำรายการสำเร็จ!`);
          
          setModalData({open: false}); setUseCourseModal({ open: false, course: null, linkedBookingId: null });
      } catch (err) { setUseCourseModal(p => ({...p, errorMsg: 'เกิดข้อผิดพลาด: ' + err.message})); } finally { setDeductForm(p => ({...p, isLoading: false})); }
  };

  const handleScanAction = async (actionType, item) => {
      try {
          if (actionType === 'checkin_booking') { await updateDoc(doc(db, 'bookings', item.id), { status: 'รอคิว', arrivedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }); showToast('เช็คอินลูกค้ารอคิวสำเร็จ!'); }
          else if (actionType === 'complete_order') { await updateDoc(doc(db, 'orders', item.id), { status: 'ชำระเงินแล้ว', fulfillment: 'delivered', updatedAt: new Date().toISOString() }); triggerLineNotif(item.id, 'รับของแล้ว', item); showToast('รับออเดอร์สำเร็จ!'); }
          setModalData({open: false});
      } catch (err) { showToast('เกิดข้อผิดพลาด: ' + err.message); }
  };

  const handleCreateAdminBooking = async (e) => {
      e.preventDefault();
      try {
          if(!newBookingForm.customerName || !newBookingForm.customerPhone || !newBookingForm.date || !newBookingForm.time) return showToast('กรุณากรอกข้อมูลที่จำเป็นให้ครบ');
          
          // บันทึกสาขาที่เลือกล่าสุดเพื่อเป็นค่าเริ่มต้นในครั้งถัดไป
          setLastUsedBranch(newBookingForm.branch);

          await addDoc(collection(db, 'bookings'), { 
              ticketNo: `ABK${Date.now().toString().slice(-6)}`, 
              ...newBookingForm, 
              originalDate: newBookingForm.date, // บันทึกเวลาเริ่มต้น
              originalTime: newBookingForm.time, // บันทึกเวลาเริ่มต้น
              dateTime: `${newBookingForm.date}T${newBookingForm.time}`, 
              status: 'กำลังรอ', 
              createdAt: new Date().toISOString(), 
              isAdminCreated: true 
          });
          showToast('สร้างคิวจองให้ลูกค้าสำเร็จ!');
          setIsAddBookingOpen(false); 
          setNewBookingForm({ customerName: '', customerPhone: '', courseName: '', branch: lastUsedBranch, date: getLocalTodayStr(), time: '' });
      } catch(err) { showToast('เกิดข้อผิดพลาด: ' + err.message); }
  };

  // 🌟 ฟังก์ชันจัดการการเลื่อนคิว / แก้ไขคิว 🌟
  const openEditBooking = (b) => {
      setEditBookingForm({
          id: b.id,
          customerName: safeRender(b.customerName),
          customerPhone: safeRender(b.customerPhone),
          courseName: safeRender(b.courseName),
          branch: safeRender(b.branch) || 'สาขาเฉวง',
          date: getBookingDate(b) || getLocalTodayStr(),
          time: getBookingTime(b)
      });
      setIsEditBookingOpen(true);
  };

  const handleUpdateBooking = async (e) => {
      e.preventDefault();
      try {
          if(!editBookingForm.date || !editBookingForm.time || !editBookingForm.branch) return showToast('กรุณาระบุข้อมูลให้ครบถ้วน');
          
          const b = dbData.bookings.find(x => x.id === editBookingForm.id);
          if(!b) return;

          let newStatus = safeRender(b.status);
          // ถ้าคิวเคยขอเลื่อน หรือรอยืนยันอยู่ เมื่อแอดมินเป็นคนจัดการเลื่อนให้ ให้ถือว่า "ยืนยันการรับคิวแล้ว" ทันที (สถานะ: กำลังรอ)
          if (['รอยืนยัน', 'เลื่อน'].some(s => newStatus.includes(s))) {
              newStatus = 'กำลังรอ';
          }

          await updateDoc(doc(db, 'bookings', editBookingForm.id), { 
              branch: editBookingForm.branch,
              date: editBookingForm.date,
              time: editBookingForm.time,
              dateTime: `${editBookingForm.date}T${editBookingForm.time}`,
              originalDate: editBookingForm.date, // เซ็ตค่าเริ่มต้นใหม่ เพื่อเคลียร์การแจ้งเตือน
              originalTime: editBookingForm.time, // เซ็ตค่าเริ่มต้นใหม่ เพื่อเคลียร์การแจ้งเตือน
              status: newStatus,
              updatedAt: new Date().toISOString() 
          });
          showToast('อัปเดตเลื่อนคิวให้ลูกค้าสำเร็จ!');
          setIsEditBookingOpen(false); 
      } catch(err) { showToast('เกิดข้อผิดพลาด: ' + err.message); }
  };

  const handleCreateShopeeOrder = async (e) => {
      e.preventDefault();
      try {
          if (!newShopeeOrderForm.orderNo || !newShopeeOrderForm.customerName) return showToast('กรุณากรอกหมายเลขคำสั่งซื้อและชื่อลูกค้า');
          await addDoc(collection(db, 'orders'), { orderNo: newShopeeOrderForm.orderNo, customerName: newShopeeOrderForm.customerName, customerPhone: '-', itemName: newShopeeOrderForm.itemName || 'สินค้าสั่งจากช้อปปี้', itemPrice: parseNum(newShopeeOrderForm.itemPrice), trackingNo: newShopeeOrderForm.trackingNo || '', status: 'ชำระเงินแล้ว', fulfillment: newShopeeOrderForm.trackingNo ? 'shipped' : '', itemType: 'shopee_order', isShopee: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
          showToast('เพิ่มออเดอร์ Shopee เข้าระบบสำเร็จ!');
          setIsAddShopeeOrderOpen(false); setNewShopeeOrderForm({ orderNo: '', customerName: '', itemName: '', itemPrice: '', trackingNo: '' });
      } catch (err) { showToast('เกิดข้อผิดพลาด: ' + err.message); }
  };

  const handleCSVUpload = async (e, typeName) => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = async (evt) => {
          let text = evt.target.result.replace(/^\uFEFF/, ''); 
          const lines = text.split(/\r\n|\n|\r/).filter(l => l.trim() !== '');
          if (lines.length < 2) return showToast('ไฟล์ CSV ไม่มีข้อมูล');
          const headers = parseCSVRow(lines[0]); const parsedData = [];
          for (let i = 1; i < lines.length; i++) {
              const row = parseCSVRow(lines[i]); if (row.length === 1 && row[0] === '') continue;
              let obj = {}; headers.forEach((h, j) => { let v = row[j] !== undefined ? row[j] : ''; if (h) obj[h] = v; obj[`col_${j + 1}`] = v; });
              if (typeName === 'shopee_orders') {
                  const orderNo = getVal(obj, ['หมายเลขคำสั่งซื้อ', 'Order ID', 'col_1']);
                  if (orderNo) parsedData.push({ orderNo: orderNo, customerName: getVal(obj, ['ชื่อผู้ใช้ (ผู้ซื้อ)', 'ชื่อผู้รับ', 'Username', 'col_4']) || 'ลูกค้า Shopee', customerPhone: getVal(obj, ['หมายเลขโทรศัพท์', 'Phone', 'col_5']) || '-', itemName: getVal(obj, ['ชื่อสินค้า', 'ชื่อตัวเลือกสินค้า', 'Product Name', 'col_13']) || '-', itemPrice: parseNum(getVal(obj, ['จำนวนเงินทั้งหมด', 'ยอดเงินรวมที่ผู้ซื้อชำระ', 'ราคาสินค้ารวม', 'col_14', 'col_21'])), shippingAddress: getVal(obj, ['ที่อยู่จัดส่ง', 'ข้อมูลการจัดส่ง', 'Address']) || '', trackingNo: getVal(obj, ['หมายเลขติดตามพัสดุ', 'Tracking Number', 'col_9']) || '', status: getVal(obj, ['สถานะการสั่งซื้อ', 'Order Status', 'col_2']) || 'รอดำเนินการ', itemType: 'shopee_order', isShopee: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
              } else parsedData.push(obj);
          }
          try {
              setDeleteProgress({ isDeleting: true, current: 0, total: parsedData.length, type: 'นำเข้าข้อมูล ' + typeName });
              const chunkSize = 100; let uploaded = 0;
              for (let i = 0; i < parsedData.length; i += chunkSize) {
                  const chunk = parsedData.slice(i, i + chunkSize); const batch = writeBatch(db); 
                  chunk.forEach(item => { if (typeName === 'shopee_orders') batch.set(doc(collection(db, 'orders')), item); else batch.set(doc(collection(db, typeName)), item); });
                  await batch.commit(); uploaded += chunk.length; setDeleteProgress(p => ({...p, current: uploaded}));
              }
              showToast(`นำเข้าสำเร็จ ${parsedData.length} รายการ!`);
          } catch (err) { showToast(`อัปโหลดล้มเหลว: ${err.message}`); } finally { setDeleteProgress({ isDeleting: false, current: 0, total: 0, type: '' }); }
          e.target.value = ''; 
      };
      reader.readAsText(file);
  };

  const executeDeleteData = async () => {
      const { type, data } = deleteModal;
      const cmap = { 'ใบคอร์สลูกค้า': 'courses', 'ลูกค้า': 'customers', 'ประวัติ': 'histories', 'การจองคิว': 'bookings', 'คำสั่งซื้อ': 'orders', 'สินค้า': 'products' };
      const collectionName = cmap[type];
      if (!collectionName) return;
      setDeleteModal({ open: false, type: '', data: [] });
      setDeleteProgress({ isDeleting: true, current: 0, total: data.length, type });

      try {
          const chunkSize = 100; let deletedCount = 0;
          for (let i = 0; i < data.length; i += chunkSize) {
              const chunk = data.slice(i, i + chunkSize); const batch = writeBatch(db);
              chunk.forEach(item => { if (item.id) batch.delete(doc(db, collectionName, item.id)); });
              await batch.commit(); deletedCount += chunk.length; setDeleteProgress(prev => ({ ...prev, current: deletedCount }));
          }
          showToast(`ล้างข้อมูล ${type} สำเร็จเรียบร้อยแล้ว!`);
      } catch (err) { showToast(`เกิดข้อผิดพลาดในการลบ: ${err.message}`); } finally { setDeleteProgress({ isDeleting: false, current: 0, total: 0, type: '' }); }
  };

  const printLabel = (order) => {
      const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(order.orderNo)}&scale=3&height=12&includetext`;
      const printContent = `
          <!DOCTYPE html>
          <html lang="th"><head><meta charset="UTF-8"><title>พิมพ์ใบแปะหน้า - ${order.orderNo}</title>
          <style>@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap'); @page { size: 105mm 148mm; margin: 0; } body { font-family: 'Sarabun', sans-serif; margin: 0; padding: 5mm; color: #000; width: 105mm; height: 148mm; box-sizing: border-box; background: #fff; } .label-box { border: 2px solid #000; width: 100%; height: 100%; padding: 4mm; border-radius: 8px; box-sizing: border-box; display: flex; flex-direction: column; } .header { text-align: center; font-size: 14px; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 10px; text-transform: uppercase; } .sender { font-size: 11px; margin-bottom: 10px; color: #000; line-height: 1.4; } .receiver { font-size: 14px; font-weight: bold; border-top: 1px dashed #000; padding-top: 10px; line-height: 1.5; flex-grow: 1; } .barcode-container { text-align: center; margin-top: auto; border-top: 2px solid #000; padding-top: 10px; } .barcode-img { max-width: 90%; height: 40px; } .order-ref { font-size: 10px; text-align: center; color: #000; margin-top: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;}</style></head>
          <body><div class="label-box"><div class="header">IrisCare Clinic - ใบจ่าหน้าพัสดุ</div><div class="sender"><strong>ผู้ส่ง:</strong> ศูนย์ความงามไอริสเกาะสมุย (เฉวง/ละไม)<br/>โทร: 097-064-3249</div><div class="receiver"><strong>ผู้รับ:</strong> ${safeRender(order.customerName)}<br/><strong>โทร:</strong> ${safeRender(order.customerPhone)}<br/><br/><strong>ที่อยู่จัดส่ง:</strong><br/><span style="font-size: 16px;">${(safeRender(order.shippingAddress) || 'ไม่ได้ระบุที่อยู่จัดส่ง / รับหน้าร้านสาขา').replace(/\\n/g, '<br/>')}</span></div><div class="barcode-container"><img class="barcode-img" src="${barcodeUrl}" alt="Barcode" onload="window.print();" onerror="window.print();" /><div class="order-ref">รายการ: ${safeRender(order.itemName)}</div></div></div></body></html>`;
      const printWin = window.open('', '_blank');
      if (printWin) { printWin.document.write(printContent); printWin.document.close(); } else showToast('กรุณาอนุญาต Pop-up เพื่อพิมพ์ใบแปะหน้า');
  };

  if (!isLoggedIn) {
      return (
          <div className="min-h-[100dvh] bg-slate-900 flex items-center justify-center p-4 font-sans relative overflow-hidden">
              <div className="bg-white rounded-[32px] p-8 w-full max-w-sm mx-auto shadow-2xl relative z-10 flex flex-col items-center">
                  <div className="w-20 h-20 bg-slate-900 rounded-[24px] flex items-center justify-center shadow-lg mb-6"><ShieldCheck size={36} className="text-teal-400" /></div>
                  <h1 className="text-2xl font-black text-slate-800 mb-1">IrisCare Admin</h1>
                  <p className="text-[11px] text-slate-500 font-bold mb-8 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">ระบบหลังบ้านแบบพกพา</p>
                  <form onSubmit={handleLogin} className="w-full space-y-4">
                      {loginError && <div className="bg-red-50 text-red-600 text-[11px] font-bold p-3 rounded-xl border border-red-100">{loginError}</div>}
                      <input type="password" placeholder="PIN CODE (123456)" value={pin} onChange={e=>setPin(e.target.value)} className="w-full py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-center text-lg font-black tracking-[0.2em] outline-none focus:border-teal-500 font-mono" />
                      <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all flex justify-center items-center">เข้าสู่ระบบ <ArrowRight size={16} className="ml-2"/></button>
                  </form>
              </div>
          </div>
      );
  }

  if (isLoading) return <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-teal-600 mb-4" size={40}/><p className="text-slate-500 font-bold text-sm">LOADING DATA...</p></div>;

  const isMoreMenu = ['more', 'fast_orders', 'accumulations', 'customers', 'courses', 'settings', 'histories', 'shopee_orders'].includes(activeTab);

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto bg-slate-50 font-sans shadow-2xl relative overflow-hidden">
        {toast && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-slate-900/90 backdrop-blur-md text-white px-5 py-3.5 rounded-2xl shadow-2xl z-[200] text-xs font-bold flex items-center animate-in slide-in-from-top-5 duration-300">
                <CheckCircle size={18} className="text-teal-400 mr-2 shrink-0"/> <span className="line-clamp-2 leading-relaxed">{toast}</span>
            </div>
        )}

        {/* --- CUSTOMER PROFILE MODAL --- */}
        <ModalWrapper isOpen={customerProfileModal.open} onClose={() => setCustomerProfileModal({open: false, customer: null})} title="โปรไฟล์ลูกค้า" icon={User}>
            {customerProfileModal.customer && (() => {
                const c = customerProfileModal.customer;
                const cName = safeRender(c.computedName);
                const cPhone = safeRender(c.computedPhone);
                const cPoints = parseNum(c.computedPoints);
                const cStatus = safeRender(c.computedStatus);

                const cCourses = computedCourses.filter(course => getVal(course, ['สถานะ', 'col_11']) !== 'ยกเลิก' && (getVal(course, ['เบอร์โทร', 'col_1']) === cPhone || getVal(course, ['ผู้ซื้อคอส', 'ชื่อลูกค้า', 'col_9']) === cName));
                const cBookings = dbData.bookings.filter(b => b.customerPhone === cPhone || b.customerName === cName).slice(0, 5);
                
                const cNameLower = cName.toLowerCase();
                const rawNameLower = String(getVal(c, ['ชื่อ', 'ชื่อลูกค้า', 'col_1'])).trim().toLowerCase();
                const cPhoneClean = cPhone.replace(/[^0-9]/g, '');

                // 🌟 ประวัติการเข้ารับบริการ (รูปแบบเดิม) 🌟
                const cHistories = dbData.histories.filter(h => {
                    const hPhone = String(getVal(h, ['เบอร์โทร', 'col_5'])).replace(/[^0-9]/g, '');
                    const hName = String(getVal(h, ['ชื่อลูกค้า', 'col_2'])).trim().toLowerCase();
                    return (cPhoneClean && cPhoneClean.length >= 9 && hPhone === cPhoneClean) || (hName === cNameLower || rawNameLower === hName);
                }).sort((a,b) => parseDateForSort(getVal(b, ['createdAt', 'วันที่', 'col_1'])) - parseDateForSort(getVal(a, ['createdAt', 'วันที่', 'col_1'])));

                // 🌟 ประวัติการได้ยอดสะสม (ฟีเจอร์ใหม่) 🌟
                const cAccumHistories = [];
                dbData.orders.filter(o => o.isShopee && !safeRender(o.status).includes('ยกเลิก') && !safeRender(o.status).toLowerCase().includes('cancel')).forEach(o => {
                    const oName = safeRender(o.customerName).trim().toLowerCase(); const oPhone = safeRender(o.customerPhone).replace(/[^0-9]/g, '');
                    if ((cPhoneClean && cPhoneClean.length >= 9 && oPhone === cPhoneClean) || (oName === rawNameLower || oName === cNameLower)) cAccumHistories.push({ id: o.id, date: o.createdAt, item: o.itemName || 'สินค้าจาก Shopee', amount: parseNum(o.itemPrice), source: 'SHOPEE', ref: o.orderNo });
                });
                wooOrders.forEach(o => {
                    const oName = safeRender(o.customerName).trim().toLowerCase(); const oPhone = safeRender(o.customerPhone).replace(/[^0-9]/g, '');
                    if ((cPhoneClean && cPhoneClean.length >= 9 && oPhone === cPhoneClean) || (oName === rawNameLower || oName === cNameLower)) cAccumHistories.push({ id: o.id, date: o.createdAt, item: o.itemName || 'สินค้าจาก Website', amount: parseNum(o.itemPrice), source: 'WEB', ref: o.orderNo });
                });
                dbData.histories.filter(h => h['ประเภท'] === 'สะสมยอดนอกระบบ').forEach(h => {
                    const hName = safeRender(h['ชื่อลูกค้า']).trim().toLowerCase(); const hPhone = safeRender(h['เบอร์โทร']).replace(/[^0-9]/g, '');
                    if ((cPhoneClean && cPhoneClean.length >= 9 && hPhone === cPhoneClean) || (hName === rawNameLower || hName === cNameLower)) cAccumHistories.push({ id: h.id, date: h.createdAt || h['วันที่'], item: h['รายการที่ทำ'] || 'สะสมยอดจากนอกระบบ', amount: parseNum(h['ยอดสินค้า']), source: 'MANUAL', ref: h['หมายเลขคำสั่งซื้อ'] || '-' });
                });
                cAccumHistories.sort((a,b) => parseDateForSort(b.date) - parseDateForSort(a.date));

                // 🌟 คำนวณเครดิตคงเหลือรวมทั้งหมดของลูกค้า 🌟
                const totalRemainCredit = cCourses.reduce((sum, course) => sum + (course._stats?.remainCredit || 0), 0);
                const activeCreditCoursesCount = cCourses.filter(course => (course._stats?.remainCredit || 0) > 0).length;

                return (
                    <div className="space-y-6">
                        {/* 1. Header & Summary (ของใหม่) */}
                        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black relative shadow-inner ${c.isShopeeOnly ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                {cName[0] || 'U'}
                                {c.isWoo && <span className="absolute -bottom-2 bg-blue-500 text-white text-[9px] px-2 py-0.5 rounded-full border-2 border-white shadow-sm">WEB</span>}
                                {c.isShopeeOnly && <span className="absolute -bottom-2 bg-orange-500 text-white text-[9px] px-2 py-0.5 rounded-full border-2 border-white shadow-sm">SHP</span>}
                            </div>
                            <div>
                                <h3 className="font-black text-lg text-slate-800">
                                    {cName} {c.computedNickname && <span className="text-sm font-bold text-slate-500 ml-1">({c.computedNickname})</span>}
                                </h3>
                                <p className="text-sm font-mono text-slate-500 mb-1">{cPhone}</p>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.isWoo ? 'bg-blue-50 text-blue-600' : c.isShopeeOnly ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-600'}`}>{cStatus}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex flex-col justify-center relative overflow-hidden">
                                <DollarSign size={40} className="absolute -right-2 -bottom-2 text-emerald-200/50" />
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">ยอดใช้จ่ายสะสม</p>
                                <p className="text-2xl font-black text-emerald-700 line-clamp-1">฿{cPoints.toLocaleString()}</p>
                                {(c.basePoints > 0 || c.shopeePoints > 0 || c.isWoo) && (
                                    <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-emerald-200/50 relative z-10">
                                        {c.basePoints > 0 && <span className="text-[9px] font-bold text-teal-700">หน้าร้าน: ฿{parseNum(c.basePoints).toLocaleString()}</span>}
                                        {c.isWoo && <span className="text-[9px] font-bold text-blue-700">เว็บ: ฿{parseNum(c.total_spent).toLocaleString()}</span>}
                                        {c.shopeePoints > 0 && <span className="text-[9px] font-bold text-orange-700">Shopee: ฿{parseNum(c.shopeePoints).toLocaleString()}</span>}
                                    </div>
                                )}
                            </div>

                            <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex flex-col justify-center relative overflow-hidden">
                                <CreditCard size={40} className="absolute -right-2 -bottom-2 text-orange-200/50" />
                                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-1">เครดิตวงเงินคงเหลือ</p>
                                <p className="text-2xl font-black text-orange-700 line-clamp-1">฿{totalRemainCredit.toLocaleString()}</p>
                                <div className="mt-2 pt-2 border-t border-orange-200/50 relative z-10">
                                    <span className="text-[9px] font-bold text-orange-600">พร้อมใช้งาน {activeCreditCoursesCount} ใบคอร์ส</span>
                                </div>
                            </div>
                        </div>

                        {/* 2. ใบคอร์สของลูกค้า (รูปแบบเดิม) */}
                        <div>
                            <h4 className="font-black text-sm text-slate-800 mb-3 flex items-center"><FileText size={16} className="mr-2 text-teal-500"/> ใบคอร์สของลูกค้า ({cCourses.length})</h4>
                            <div className="space-y-2">
                                {cCourses.length > 0 ? cCourses.map((course, idx) => {
                                    const stats = course._stats;
                                    return (
                                        <div key={idx} onClick={() => { setCustomerProfileModal({open: false, customer: null}); openCourseDetail(course); setSearchQuery(''); }} className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col cursor-pointer hover:border-teal-500 active:scale-95 transition-all">
                                            <div className="flex justify-between items-start mb-2">
                                                <div><p className="font-bold text-sm text-teal-700 line-clamp-1">{safeRender(getVal(course, ['ชื่อคอส', 'col_8']))}</p><p className="text-[10px] text-slate-400">Ref: {safeRender(getVal(course, ['เลขที่ใบคอส', 'col_2']))}</p></div>
                                                <div className="text-right">
                                                    <span className={`bg-slate-100 text-slate-600 px-2 py-1 rounded text-[9px] font-bold shrink-0 ${stats.diffDays <= 30 && stats.diffDays >= 0 ? 'text-orange-500' : stats.diffDays < 0 ? 'text-rose-500' : ''}`}>{safeRender(stats.status)}</span>
                                                    <p className={`text-[9px] mt-1 ${stats.diffDays < 0 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>{safeRender(stats.expireText)}</p>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                <p className="text-[10px] font-bold text-slate-500">คงเหลือ <span className={`text-xs font-black ml-1 ${stats.remain > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{stats.remain} ครั้ง</span></p>
                                                {stats.credit > 0 && <p className="text-[10px] font-bold text-slate-500">เครดิต <span className={`text-xs font-black ml-1 ${stats.remainCredit > 0 ? 'text-orange-500' : 'text-rose-500'}`}>฿{stats.remainCredit.toLocaleString()}</span></p>}
                                            </div>
                                        </div>
                                    )
                                }) : <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">ไม่มีประวัติการซื้อคอร์ส</p>}
                            </div>
                        </div>

                        {/* 3. ประวัติจองคิวล่าสุด (รูปแบบเดิม) */}
                        <div>
                            <h4 className="font-black text-sm text-slate-800 mb-3 flex items-center"><CalendarDays size={16} className="mr-2 text-blue-500"/> ประวัติจองคิว</h4>
                            <div className="space-y-2">
                                {cBookings.length > 0 ? cBookings.map((b, idx) => (
                                    <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                                        <div><p className="font-bold text-xs text-slate-700">{formatDate(getBookingDate(b))} {safeRender(getBookingTime(b))}</p><p className="text-[10px] text-slate-500">{safeRender(b.courseName)}</p></div>
                                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">{safeRender(b.status)}</span>
                                    </div>
                                )) : <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">ไม่มีประวัติจองคิว</p>}
                            </div>
                        </div>

                        {/* 4. ประวัติการเข้ารับบริการ / การใช้คอร์ส (รูปแบบเดิมที่นำกลับมา) */}
                        <div>
                            <h4 className="font-black text-sm text-slate-800 mb-3 flex items-center"><History size={16} className="mr-2 text-indigo-500"/> ประวัติการเข้ารับบริการ</h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto hide-scrollbar">
                                {cHistories.length > 0 ? cHistories.map((h, idx) => (
                                    <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col">
                                        <div className="flex justify-between items-start mb-1.5">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black bg-slate-100 text-slate-600`}>{safeRender(getVal(h, ['ประเภท', 'col_4']))}</span>
                                            <span className="text-[10px] text-slate-400 font-mono">{formatDate(getVal(h, ['วันที่', 'col_1', 'createdAt']))} {safeRender(h['เวลา'])}</span>
                                        </div>
                                        <p className="font-bold text-xs text-slate-800 line-clamp-2">{safeRender(getVal(h, ['รายการ', 'สินค้า', 'col_23', 'col_18']))}</p>
                                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-50">
                                            <p className="text-[10px] text-slate-500">Ref: {safeRender(getVal(h, ['เลขที่ใบคอส', 'col_6'])) || '-'}</p>
                                            <div className="text-right">
                                                {getVal(h, ['จำนวน', 'จำนวนที่ใช้', 'ตัดคอร์ส', 'col_15']) && <span className="text-[10px] font-black text-indigo-600 mr-2">ใช้ {safeRender(getVal(h, ['จำนวน', 'จำนวนที่ใช้', 'ตัดคอร์ส', 'col_15']))} ครั้ง</span>}
                                                {getVal(h, ['ยอดเบิก', 'ยอดสินค้า', 'ยอดจัดซื้อ', 'col_19']) && <span className="text-[10px] font-black text-orange-600">฿{parseNum(getVal(h, ['ยอดเบิก', 'ยอดสินค้า', 'ยอดจัดซื้อ', 'col_19'])).toLocaleString()}</span>}
                                            </div>
                                        </div>
                                    </div>
                                )) : <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">ไม่มีประวัติเข้ารับบริการ</p>}
                            </div>
                        </div>

                        {/* 5. ประวัติการได้ยอดสะสม (ฟีเจอร์ใหม่) */}
                        <div>
                            <h4 className="font-black text-sm text-slate-800 mb-3 flex items-center"><DollarSign size={16} className="mr-2 text-amber-500"/> ประวัติการได้ยอดสะสม</h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto hide-scrollbar">
                            {cAccumHistories.length > 0 ? cAccumHistories.map((h, idx) => (
                                <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                                        <div className="flex-1 pr-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${h.source === 'SHOPEE' ? 'bg-orange-100 text-orange-600' : h.source === 'WEB' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>{h.source}</span>
                                                <p className="text-[10px] text-slate-400 font-mono">{formatDate(h.date)}</p>
                                            </div>
                                            <p className="font-bold text-xs text-slate-700 line-clamp-1">{safeRender(h.item)}</p>
                                            {h.ref !== '-' && <p className="text-[9px] text-slate-400 font-mono mt-0.5">Ref: {safeRender(h.ref)}</p>}
                                        </div>
                                        <span className="font-black text-emerald-600 text-sm shrink-0">+ ฿{h.amount.toLocaleString()}</span>
                                    </div>
                                )) : <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">ยังไม่มีประวัติการได้ยอดสะสม</p>}
                            </div>
                        </div>

                    </div>
                )
            })()}
        </ModalWrapper>

        {/* --- PENDING BOOKINGS POPUP MODAL --- */}
        <ModalWrapper isOpen={isPendingBookingModalOpen} onClose={() => setIsPendingBookingModalOpen(false)} title={`คิวใหม่ / ขอเลื่อนเวลา (${pendingBookings.length})`} icon={CalendarDays}>
            <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs p-3 rounded-xl font-bold flex items-center shadow-sm">
                    <span className="relative flex h-2.5 w-2.5 mr-2.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-600"></span>
                    </span>
                    กรุณาตรวจสอบและอนุมัติรับคิว หรือ เลื่อนคิว เพื่อให้ลูกค้าทราบสถานะ (ป๊อปอัปจะปิดเมื่อจัดการคิวหมดแล้ว)
                </div>
                
                {pendingBookings.map((b, i) => {
                    const rawStatus = safeRender(b.status).trim();
                    const cDate = getBookingDate(b);
                    const cTime = getBookingTime(b);
                    const isTimeChanged = (b.originalTime && b.originalTime !== cTime) || (b.originalDate && b.originalDate !== cDate);
                    const isReschedule = rawStatus.includes('เลื่อน') || isTimeChanged;
                    const displayStatus = isReschedule ? 'ขอเลื่อนเวลา' : 'รอยืนยัน';

                    // 🌟 หาข้อมูลลูกค้าเพื่อแสดงรูปโปรไฟล์ 🌟
                    const bPhoneRaw = safeRender(b.customerPhone).replace(/[^0-9]/g, '');
                    const bNameRaw = safeRender(b.customerName).trim().toLowerCase();
                    const matchedCustomer = allCustomers.find(c => {
                        const cPhone = c.computedPhone.replace(/[^0-9]/g, '');
                        const cName = String(c.computedName).trim().toLowerCase();
                        return (cPhone && cPhone.length >= 9 && cPhone === bPhoneRaw) || (cName && cName === bNameRaw);
                    });

                    return (
                    <div key={b.id || i} className={`bg-white p-4 rounded-2xl shadow-sm border-2 ${isReschedule ? 'border-purple-300' : 'border-amber-300'} relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                        <div className="pl-1">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] border relative shrink-0 ${matchedCustomer?.isShopeeOnly ? 'bg-orange-50 text-orange-500 border-orange-100' : matchedCustomer?.isWoo ? 'bg-blue-50 text-blue-500 border-blue-100' : 'bg-indigo-50 text-indigo-500 border-indigo-100'}`}>
                                        {matchedCustomer?.isWoo && <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[6px] px-1 py-[1px] rounded shadow-sm z-10">WEB</span>}
                                        {matchedCustomer?.isShopeeOnly && <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[6px] px-1 py-[1px] rounded shadow-sm z-10">SHP</span>}
                                        {matchedCustomer?.photo ? <img src={matchedCustomer.photo} className="w-full h-full rounded-full object-cover" alt="profile"/> : (safeRender(b.customerName)[0] || 'U')}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <p className="font-black text-slate-800 text-sm line-clamp-1">{safeRender(b.customerName)}</p>
                                        <p className="text-[10px] text-slate-500 font-mono"><Phone size={10} className="inline mr-1"/>{safeRender(b.customerPhone)}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded-md text-[9px] font-black shrink-0 ${isReschedule ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'} animate-pulse`}>{displayStatus}</span>
                            </div>
                            
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3">
                                <p className="text-xs font-bold text-slate-700 mb-1 line-clamp-1">{safeRender(b.courseName)}</p>
                                <p className="text-[10px] text-slate-500 flex items-center"><Clock size={12} className={`mr-1 ${isReschedule ? 'text-purple-500' : 'text-amber-500'}`}/> {cDate ? new Date(cDate).toLocaleDateString('th-TH') : ''} • {cTime} น. ({safeRender(b.branch)})</p>
                                {isTimeChanged && b.originalTime && (
                                    <p className="text-[9px] text-purple-600 bg-purple-100 px-2 py-1 rounded mt-1.5 inline-block font-bold">
                                        (เปลี่ยนจากเดิม: {b.originalDate ? new Date(b.originalDate).toLocaleDateString('th-TH') : ''} {b.originalTime} น.)
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-2 pt-1">
                                <button onClick={()=>handleAction('confirm_booking', b.id)} className={`flex-1 ${isReschedule ? 'bg-purple-500 hover:bg-purple-600' : 'bg-amber-500 hover:bg-amber-600'} text-white font-black py-3 rounded-xl text-xs active:scale-95 transition-all shadow-md flex justify-center items-center`}><CheckCircle size={16} className="mr-1.5"/> {isReschedule ? 'อนุมัติให้เลื่อน' : 'อนุมัติรับคิวนี้'}</button>
                                <button onClick={()=>handleAction('cancel_booking', b.id)} className="px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold active:scale-95 transition-all text-xs">ปฏิเสธ</button>
                            </div>
                        </div>
                    </div>
                )})}
            </div>
        </ModalWrapper>

        {/* --- ADD BOOKING MODAL --- */}
        <ModalWrapper isOpen={isAddBookingOpen} onClose={() => setIsAddBookingOpen(false)} title="เพิ่มคิวจอง (แอดมิน)" icon={CalendarPlus}>
            <form onSubmit={handleCreateAdminBooking} className="space-y-6 pb-4">
                
                {/* 1. Branch Selection */}
                <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 block">1. เลือกสาขา</label>
                    <div className="flex gap-2">
                        {['สาขาเฉวง', 'สาขาละไม'].map(b => (
                            <button type="button" key={b} onClick={() => setNewBookingForm({...newBookingForm, branch: b, time: ''})}
                                className={`flex-1 py-3 rounded-2xl font-black text-xs transition-all border-2 ${newBookingForm.branch === b ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}>
                                {b}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. Date Selection */}
                <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 block">2. เลือกวันที่</label>
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 px-1 -mx-1">
                        {adminBookingDateOptions.map(opt => (
                            <button type="button" key={opt.value} onClick={() => setNewBookingForm({...newBookingForm, date: opt.value, time: ''})}
                                className={`flex flex-col items-center justify-center min-w-[76px] py-3 rounded-2xl border-2 transition-all shrink-0 ${newBookingForm.date === opt.value ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-sm' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}>
                                <span className="text-[10px] font-bold mb-1">{opt.label}</span>
                                <span className="text-sm font-black">{opt.dateDisplay}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Time Slots */}
                <div>
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 block">3. เลือกเวลา</label>
                     <div className="grid grid-cols-4 gap-2">
                         {timeSlots.map(time => {
                             const isBooked = bookedTimeSlotsForAdmin.includes(time);
                             
                             // 🌟 ตรวจสอบว่าเวลาผ่านไปหรือยัง (ถ้าเป็นวันนี้) 🌟
                             const todayStr = getLocalTodayStr();
                             const isToday = newBookingForm.date === todayStr;
                             const [slotHour, slotMin] = time.split(':').map(Number);
                             const isPastTime = isToday && (slotHour < now.getHours() || (slotHour === now.getHours() && slotMin <= now.getMinutes()));
                             
                             const isUnavailable = isBooked || isPastTime;
                             const isSelected = newBookingForm.time === time;

                             return (
                                 <button type="button" key={time} disabled={isUnavailable} onClick={() => setNewBookingForm({...newBookingForm, time})}
                                    className={`py-2.5 rounded-xl text-xs font-black transition-all border-2 ${isUnavailable ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed' : isSelected ? 'bg-amber-500 border-amber-500 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-amber-400 hover:text-amber-600'}`}>
                                    {time}
                                 </button>
                             )
                         })}
                     </div>
                </div>

                {/* 4. Customer Info */}
                <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 block">4. ข้อมูลลูกค้าและบริการ</label>
                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <input type="text" required value={newBookingForm.customerName} onChange={e=>setNewBookingForm(p=>({...p, customerName: e.target.value}))} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-teal-500 transition-colors" placeholder="ชื่อ-นามสกุล"/>
                        <input type="tel" required value={newBookingForm.customerPhone} onChange={e=>setNewBookingForm(p=>({...p, customerPhone: e.target.value}))} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-teal-500 transition-colors" placeholder="08X-XXX-XXXX"/>
                        
                        <div className="space-y-2 pt-2 border-t border-slate-200">
                            <p className="text-[10px] font-bold text-slate-500">เลือกบริการด่วน:</p>
                            <div className="flex flex-wrap gap-2">
                                {quickServices.map(srv => (
                                    <button type="button" key={srv} onClick={() => setNewBookingForm(p => ({...p, courseName: srv}))}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${newBookingForm.courseName === srv ? 'bg-teal-500 text-white border-teal-500 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'}`}>
                                        {srv}
                                    </button>
                                ))}
                            </div>
                            <input type="text" value={newBookingForm.courseName} onChange={e=>setNewBookingForm(p=>({...p, courseName: e.target.value}))} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-teal-500 transition-colors mt-1" placeholder="หรือ พิมพ์รายการที่ต้องการทำด้วยตัวเอง..."/>
                        </div>
                    </div>
                </div>

                <button type="submit" disabled={!newBookingForm.time} className={`w-full font-black py-4 rounded-2xl shadow-lg transition-all text-sm flex items-center justify-center ${!newBookingForm.time ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-95'}`}>
                    <CalendarPlus size={18} className="mr-2"/> ยืนยันจองคิว
                </button>
            </form>
        </ModalWrapper>

        {/* --- EDIT / RESCHEDULE BOOKING MODAL --- */}
        <ModalWrapper isOpen={isEditBookingOpen} onClose={() => setIsEditBookingOpen(false)} title="จัดการคิว (เลื่อน/เปลี่ยนสาขา)" icon={Edit3}>
            <form onSubmit={handleUpdateBooking} className="space-y-6 pb-4">
                
                {/* Customer Info (Read-only for reference) */}
                <div className="bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100/50 flex items-center justify-between">
                    <div>
                        <p className="font-black text-indigo-900 text-sm">{editBookingForm.customerName}</p>
                        <p className="text-[10px] text-indigo-600/70 font-mono mt-0.5">{editBookingForm.courseName} • {editBookingForm.customerPhone}</p>
                    </div>
                </div>

                {/* 1. Branch Selection */}
                <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 block">1. เลือกสาขาใหม่</label>
                    <div className="flex gap-2">
                        {['สาขาเฉวง', 'สาขาละไม'].map(b => (
                            <button type="button" key={b} onClick={() => setEditBookingForm({...editBookingForm, branch: b, time: ''})}
                                className={`flex-1 py-3 rounded-2xl font-black text-xs transition-all border-2 ${editBookingForm.branch === b ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}>
                                {b}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. Date Selection */}
                <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 block">2. เลือกวันที่ใหม่</label>
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 px-1 -mx-1">
                        <div className="relative flex flex-col items-center justify-center min-w-[76px] py-3 rounded-2xl border-2 transition-all shrink-0 bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 overflow-hidden cursor-pointer">
                            <CalendarDays size={20} className="mb-1 text-slate-400" />
                            <span className="text-[10px] font-bold">ปฏิทิน</span>
                            <input type="date" value={editBookingForm.date} onChange={e => setEditBookingForm({...editBookingForm, date: e.target.value, time: ''})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        </div>
                        {adminBookingDateOptions.map(opt => (
                            <button type="button" key={opt.value} onClick={() => setEditBookingForm({...editBookingForm, date: opt.value, time: ''})}
                                className={`flex flex-col items-center justify-center min-w-[76px] py-3 rounded-2xl border-2 transition-all shrink-0 ${editBookingForm.date === opt.value ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-sm' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}>
                                <span className="text-[10px] font-bold mb-1">{opt.label}</span>
                                <span className="text-sm font-black">{opt.dateDisplay}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Time Slots */}
                <div>
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 block">3. เลือกเวลาใหม่</label>
                     <div className="grid grid-cols-4 gap-2">
                         {timeSlots.map(time => {
                             const isBooked = bookedTimeSlotsForEdit.includes(time);
                             
                             // เช็คเวลาอดีต
                             const todayStr = getLocalTodayStr();
                             const isToday = editBookingForm.date === todayStr;
                             const [slotHour, slotMin] = time.split(':').map(Number);
                             const isPastTime = isToday && (slotHour < now.getHours() || (slotHour === now.getHours() && slotMin <= now.getMinutes()));
                             
                             const isUnavailable = isBooked || isPastTime;
                             const isSelected = editBookingForm.time === time;

                             return (
                                 <button type="button" key={time} disabled={isUnavailable} onClick={() => setEditBookingForm({...editBookingForm, time})}
                                    className={`py-2.5 rounded-xl text-xs font-black transition-all border-2 ${isUnavailable ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed' : isSelected ? 'bg-amber-500 border-amber-500 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-amber-400 hover:text-amber-600'}`}>
                                    {time}
                                 </button>
                             )
                         })}
                     </div>
                </div>

                <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => { handleAction('cancel_booking', editBookingForm.id); setIsEditBookingOpen(false); }} className="px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 font-black rounded-2xl active:scale-95 transition-all text-sm flex items-center justify-center border border-rose-200">
                        ยกเลิกคิว
                    </button>
                    <button type="submit" disabled={!editBookingForm.time} className={`flex-1 font-black py-4 rounded-2xl shadow-lg transition-all text-sm flex items-center justify-center ${!editBookingForm.time ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-95'}`}>
                        <CheckCircle size={18} className="mr-2"/> ยืนยันการแก้ไขคิว
                    </button>
                </div>
            </form>
        </ModalWrapper>

        {/* --- ADD SHOPEE ORDER MODAL --- */}
        <ModalWrapper isOpen={isAddShopeeOrderOpen} onClose={() => setIsAddShopeeOrderOpen(false)} title="เพิ่มออเดอร์ Shopee" icon={Store}>
            <form onSubmit={handleCreateShopeeOrder} className="space-y-5">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-3">
                    <input type="text" required value={newShopeeOrderForm.orderNo} onChange={e=>setNewShopeeOrderForm(p=>({...p, orderNo: e.target.value}))} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 uppercase" placeholder="หมายเลขคำสั่งซื้อ"/>
                    <input type="text" required value={newShopeeOrderForm.customerName} onChange={e=>setNewShopeeOrderForm(p=>({...p, customerName: e.target.value}))} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500" placeholder="ชื่อลูกค้า / Username"/>
                    <input type="text" value={newShopeeOrderForm.itemName} onChange={e=>setNewShopeeOrderForm(p=>({...p, itemName: e.target.value}))} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500" placeholder="ชื่อสินค้า"/>
                    <input type="number" value={newShopeeOrderForm.itemPrice} onChange={e=>setNewShopeeOrderForm(p=>({...p, itemPrice: e.target.value}))} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500" placeholder="ยอดเงินสุทธิ"/>
                    <input type="text" value={newShopeeOrderForm.trackingNo} onChange={e=>setNewShopeeOrderForm(p=>({...p, trackingNo: e.target.value}))} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 uppercase" placeholder="เลขพัสดุ (ถ้ามี)"/>
                </div>
                <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-xl shadow-lg mt-2">บันทึกออเดอร์เข้าสู่ระบบ</button>
            </form>
        </ModalWrapper>

        {/* --- USE COURSE / DEDUCT CART MODAL --- */}
        <ModalWrapper isOpen={useCourseModal.open} onClose={() => setUseCourseModal({open: false, course: null, linkedBookingId: null, errorMsg: ''})} title="รับบริการ & เบิกสินค้า" icon={CheckSquare}>
            {useCourseModal.errorMsg && <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl">{useCourseModal.errorMsg}</div>}
            {useCourseModal.course && (() => {
                const c = useCourseModal.course;
                const stats = c._stats || computeCourseStats(c, dbData.histories, true);
                const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
                return (
                    <form onSubmit={handleDeductCourse} className="space-y-6">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                            <h4 className="font-black text-slate-800 text-sm flex items-center"><Activity className="mr-1.5 text-teal-500" size={16}/> {safeRender(getVal(c, ['ชื่อคอส', 'col_8']))}</h4>
                            <div className="flex items-center gap-3 mt-3">
                                <div className="flex-1">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase">หักจำนวนครั้ง</label>
                                    <input type="number" min="0" max={stats.remain} value={deductForm.qty} onChange={e=>setDeductForm(p=>({...p, qty: e.target.value}))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-center font-black" />
                                </div>
                                <div className="flex-[2]">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase">หมายเหตุ</label>
                                    <input type="text" placeholder="พิมพ์หมายเหตุ..." value={deductForm.note} onChange={e=>setDeductForm(p=>({...p, note: e.target.value}))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-teal-500 bg-white" />
                                </div>
                            </div>
                        </div>

                        {/* เบิกสินค้า (หักเครดิต) */}
                        <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                            <div className="flex justify-between items-start mb-3">
                                <h4 className="font-black text-orange-800 text-sm flex items-center"><ShoppingBag className="mr-1.5 text-orange-500" size={16}/> เบิกสินค้า (หักเครดิต)</h4>
                                <div className="text-right">
                                    <p className="text-[9px] font-bold text-orange-500 uppercase">เครดิตคงเหลือ</p>
                                    <p className={`font-black text-sm ${stats.remainCredit < cartTotal ? 'text-rose-600' : 'text-orange-700'}`}>฿{(stats.remainCredit - cartTotal).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="relative mb-3">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" />
                                <input type="text" placeholder="ค้นหาสินค้าเพื่อเบิก..." value={productSearchTerm} onChange={e => setProductSearchTerm(e.target.value)} className="w-full border-2 border-orange-200 rounded-xl pl-9 pr-3 py-2 text-sm font-bold text-orange-900 outline-none focus:border-orange-500 bg-white" />
                                {productSearchTerm.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-orange-100 max-h-48 overflow-y-auto z-50">
                                        {dbData.products.filter(p => `${getVal(p, ['รหัส', 'col_1'])} ${getVal(p, ['ชื่อสินค้า', 'col_2'])}`.toLowerCase().includes(productSearchTerm.toLowerCase())).slice(0, 10).map((p, idx) => {
                                            const stock = parseNum(getVal(p, ['จำนวนคงเหลือ', 'col_12']));
                                            const price = parseNum(getVal(p, ['ราคาขายเต็ม', 'ราคา', 'col_6']));
                                            return (
                                                <div key={idx} onClick={() => addToCart(p)} className="p-3 border-b border-slate-50 hover:bg-orange-50 cursor-pointer flex justify-between items-center transition-colors">
                                                    <div><p className="text-xs font-bold text-slate-800 line-clamp-1">{safeRender(getVal(p, ['ชื่อสินค้า', 'col_2']))}</p><p className="text-[10px] text-slate-400 font-mono">คงเหลือ {stock}</p></div>
                                                    <span className="text-xs font-black text-orange-600 shrink-0 ml-2">฿{price.toLocaleString()}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>

                            {cartItems.length > 0 && (
                                <div className="space-y-2 mb-3">
                                    {cartItems.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-white p-2 rounded-xl border border-orange-100 shadow-sm">
                                            <div className="flex-1 pr-2"><p className="text-[11px] font-bold text-slate-800 line-clamp-1">{safeRender(getVal(item.product, ['ชื่อสินค้า', 'col_2']))}</p><p className="text-[10px] font-black text-orange-500">฿{(item.price * item.qty).toLocaleString()}</p></div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg">
                                                    <button type="button" onClick={() => setCartItems(prev => prev.map(i => i.product.id === item.product.id ? {...i, qty: Math.max(1, i.qty - 1)} : i))} className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-slate-100">-</button>
                                                    <span className="w-6 text-center text-xs font-black text-slate-700">{item.qty}</span>
                                                    <button type="button" onClick={() => addToCart(item.product)} className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-slate-100">+</button>
                                                </div>
                                                <button type="button" onClick={() => removeFromCart(item.product.id)} className="w-6 h-6 flex items-center justify-center text-rose-500 bg-rose-50 rounded-lg hover:bg-rose-100"><Trash size={12}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-black text-slate-800 text-sm flex items-center"><Edit3 className="mr-1.5 text-indigo-500" size={16}/> ลายเซ็นยืนยันรายการ</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <SignaturePad label="ลายเซ็นลูกค้า" onSigned={setCustomerSignature} />
                                <SignaturePad label="ลายเซ็นเจ้าหน้าที่" onSigned={setStaffSignature} />
                            </div>
                        </div>

                        <button type="submit" disabled={deductForm.isLoading || (deductForm.qty <= 0 && cartItems.length === 0)} className={`w-full font-black py-4 rounded-xl shadow-lg transition-all flex items-center justify-center text-base ${deductForm.isLoading || (deductForm.qty <= 0 && cartItems.length === 0) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-95'}`}>
                            {deductForm.isLoading ? <Loader2 size={20} className="animate-spin mr-2"/> : <CheckSquare size={20} className="mr-2"/>} ยืนยันการรับบริการ / ตัดคอร์ส
                        </button>
                    </form>
                );
            })()}
        </ModalWrapper>

        {/* --- SELECT COURSE FOR DEDUCTION MODAL --- */}
        <ModalWrapper isOpen={selectCourseModal.open} onClose={() => setSelectCourseModal({open: false, bookingId: null, courses: []})} title="เลือกคอร์สเพื่อตัด" icon={FileText}>
            <div className="space-y-3">
                <p className="text-xs text-slate-500 mb-2">ลูกค้ารายนี้มีใบคอร์สที่ยังใช้งานได้หลายใบ กรุณาเลือกคอร์สที่ต้องการหัก</p>
                {selectCourseModal.courses.map((c, i) => (
                    <div key={i} onClick={() => { setSelectCourseModal({open:false, bookingId: null, courses: []}); openUseCourseModal(c, selectCourseModal.bookingId); }} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-indigo-500 active:scale-95 transition-all flex justify-between items-center">
                        <div>
                            <p className="font-bold text-sm text-indigo-700">{safeRender(getVal(c, ['ชื่อคอส', 'col_8']))}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Ref: {safeRender(getVal(c, ['เลขที่ใบคอส', 'col_2']))}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-500">คงเหลือ <span className="font-black text-emerald-600 text-sm">{c._stats.remain}</span> ครั้ง</p>
                        </div>
                    </div>
                ))}
            </div>
        </ModalWrapper>

        {/* --- SCANNER & ACTIONS MODAL --- */}
        <ModalWrapper isOpen={modalData.open} onClose={() => { setModalData({open:false, errorMsg:''}); setTrackingStatusData(null); setIsCheckingTracking(false); }} title={modalData.type === 'image' ? 'หลักฐาน' : modalData.type === 'quote' ? 'ประเมินราคา' : modalData.type === 'accumulate' ? 'เพิ่มยอดสะสม' : modalData.type === 'order_detail' ? 'รายละเอียดคำสั่งซื้อ' : modalData.type === 'scan_result' ? 'ผลการสแกน' : modalData.type === 'course_detail' ? 'รายละเอียดใบคอร์ส' : 'สแกน QR / บาร์โค้ด'} icon={ScanLine}>
            {modalData.errorMsg && <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl flex items-center"><AlertCircle size={14} className="mr-2 shrink-0"/>{modalData.errorMsg}</div>}
            
            {modalData.type === 'image' && (
                <div className="w-full bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100 min-h-[300px]">
                    {modalData.data ? <img src={modalData.data} className="w-full object-contain" alt="หลักฐาน" /> : <p className="text-slate-400 font-bold text-sm py-20">ไม่มีรูปภาพ</p>}
                </div>
            )}

            {modalData.type === 'order_detail' && modalData.data && (
                <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-mono text-xs font-black text-slate-500">#{safeRender(modalData.data.orderNo)}</span>
                            <span className="px-2 py-1 rounded-md text-[9px] font-black uppercase bg-blue-50 text-blue-600">{safeRender(modalData.data.status)}</span>
                        </div>
                        <h4 className="font-black text-slate-800 text-sm mb-3">{safeRender(modalData.data.itemName)}</h4>
                        <div className="flex justify-between items-center text-xs border-t border-slate-200 pt-3">
                            <span className="text-slate-500 font-bold flex items-center"><CreditCard size={14} className="mr-1.5"/> ยอดชำระ:</span>
                            <span className="font-black text-rose-600 text-lg">฿{parseNum(modalData.data.itemPrice).toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <h4 className="text-xs font-black text-blue-800 mb-2 flex items-center"><MapPin size={14} className="mr-1.5"/> ข้อมูลและที่อยู่จัดส่ง</h4>
                        <p className="text-xs text-blue-700 font-bold whitespace-pre-line leading-relaxed">{safeRender(modalData.data.shippingAddress) || 'ไม่ได้ระบุที่อยู่จัดส่ง / รับหน้าร้านสาขา'}</p>
                        <div className="mt-3 pt-3 border-t border-blue-200 text-xs text-blue-700 flex flex-col gap-1">
                            <p className="flex items-center gap-1.5"><strong>ชื่อลูกค้า:</strong> {safeRender(modalData.data.customerName)}</p>
                            <p><strong>เบอร์โทร:</strong> <span className="font-mono">{safeRender(modalData.data.customerPhone)}</span></p>
                        </div>
                    </div>

                    {modalData.data.isShopee && (safeRender(modalData.data.customerPhone).includes('*') || safeRender(modalData.data.customerPhone) === '-') && !isScanning && (
                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-300 shadow-sm relative">
                            <h4 className="text-xs font-black text-orange-800 mb-1.5">ระบุเบอร์โทรเพื่อเชื่อมยอดสะสม</h4>
                            <div className="flex gap-2">
                                <input type="tel" value={modalData.linkPhoneVal || ''} onChange={e => setModalData({...modalData, linkPhoneVal: e.target.value, errorMsg: ''})} placeholder="08X-XXX-XXXX" className="flex-1 border-2 border-orange-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-orange-900 focus:border-orange-500 outline-none bg-white"/>
                                <button onClick={() => handleAction('link_shopee_phone', modalData.data.id)} className="bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-black">เชื่อมโยง</button>
                            </div>
                        </div>
                    )}

                    {!isScanning && !modalData.data.isWoo && !modalData.data.isShopee && (
                        <button onClick={() => printLabel(modalData.data)} className="w-full bg-slate-100 text-slate-700 font-black py-4 rounded-xl flex items-center justify-center hover:bg-slate-200 active:scale-95 transition-all">พิมพ์ใบแปะหน้าจัดส่ง</button>
                    )}
                </div>
            )}

            {modalData.type === 'scan_result' && modalData.data && (
                <div className="space-y-4">
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-start">
                        <CheckCircle className="text-emerald-500 mr-3 shrink-0" size={24}/>
                        <div>
                            <p className="font-black text-emerald-800 text-base mb-0.5">{modalData.data.type === 'order' ? 'คำสั่งซื้อสินค้า' : modalData.data.type === 'booking' ? 'คิวจองบริการ' : 'ใบคอร์สลูกค้า'}</p>
                            <p className="text-[11px] font-bold text-emerald-600">Ref: {safeRender(modalData.data.item.orderNo || modalData.data.item.ticketNo || modalData.data.item["เลขที่ใบคอส"])}</p>
                        </div>
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 space-y-2.5">
                        <div className="flex justify-between"><span className="text-slate-400">ลูกค้า:</span> <span>{safeRender(modalData.data.item.customerName || modalData.data.item["ผู้ซื้อคอส"] || 'ไม่ระบุ')}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">เบอร์โทร:</span> <span>{safeRender(modalData.data.item.customerPhone || modalData.data.item["เบอร์โทร"] || '-')}</span></div>
                        <div className="flex justify-between border-t border-slate-200 pt-2"><span className="text-slate-400">รายการ:</span> <span className="text-right flex-1 ml-4">{safeRender(modalData.data.item.itemName || modalData.data.item.courseName || modalData.data.item["ชื่อคอส"] || '-')}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">สถานะ:</span> <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-xs">{safeRender(modalData.data.item.status || modalData.data.item["สถานะ"])}</span></div>
                    </div>

                    {modalData.data.type === 'order' && safeRender(modalData.data.item.status).includes('รอ') && (
                        <button onClick={() => handleScanAction('complete_order', modalData.data.item)} className="w-full bg-emerald-500 text-white font-black py-4 rounded-xl shadow-lg active:scale-95 transition-all">ลูกค้ารับสินค้าเรียบร้อย</button>
                    )}
                    {modalData.data.type === 'booking' && (() => {
                        const s = safeRender(modalData.data.item.status).trim();
                        const isPending = !(s === 'กำลังรอ' || s === 'รอคิว' || s === 'กำลังใช้บริการ' || s === 'กำลังให้บริการ' || s === 'เข้ารับบริการแล้ว' || s === 'สำเร็จ' || s.includes('ยกเลิก'));
                        const isConfirmed = s === 'กำลังรอ' || s === 'รอคิว';
                        return (isPending || isConfirmed);
                    })() && (
                        <button onClick={() => handleScanAction('checkin_booking', modalData.data.item)} className="w-full bg-teal-500 text-white font-black py-3.5 rounded-xl shadow-lg active:scale-95 transition-all">สแกนสำเร็จ (เริ่มให้บริการ)</button>
                    )}
                    {modalData.data.type === 'course' && (
                        <button onClick={() => { openCourseDetail(modalData.data.item); setSearchQuery(''); }} className="w-full bg-slate-900 text-white font-black py-3.5 rounded-xl shadow-lg active:scale-95 transition-all">ดูรายละเอียดและตัดคอร์ส</button>
                    )}
                </div>
            )}

            {modalData.type === 'course_detail' && modalData.data && (() => {
                const c = modalData.data;
                const stats = c._stats || computeCourseStats(c, dbData.histories, true); 
                return (
                <div className="space-y-4">
                    <div className="bg-teal-50 p-4 rounded-xl border border-teal-100 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-400"></div>
                        <h4 className="font-black text-teal-800 text-base mb-1">{safeRender(getVal(c, ['ชื่อคอส', 'col_8']))}</h4>
                        <p className="text-[11px] text-teal-600 font-mono">Ref: {safeRender(getVal(c, ['เลขที่ใบคอส', 'col_2'])) || '-'}</p>
                        
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-teal-100/50">
                            <div><p className="text-[10px] text-teal-600 font-bold uppercase mb-0.5">ลูกค้า</p><p className="font-bold text-teal-900 text-sm">{safeRender(getVal(c, ['ผู้ซื้อคอส', 'ชื่อลูกค้า', 'col_9']))}</p></div>
                            <div className="text-right"><p className="text-[10px] text-teal-600 font-bold uppercase mb-0.5">เบอร์โทร</p><p className="font-mono font-bold text-teal-900">{safeRender(getVal(c, ['เบอร์โทร', 'col_1']))}</p></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100"><p className="text-[10px] text-slate-500 font-bold uppercase mb-1">ทั้งหมด</p><p className="font-black text-slate-800 text-lg">{stats.total}</p></div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100"><p className="text-[10px] text-slate-500 font-bold uppercase mb-1">ใช้ไป</p><p className="font-black text-slate-800 text-lg">{stats.used}</p></div>
                        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100"><p className="text-[10px] text-emerald-600 font-bold uppercase mb-1">คงเหลือ</p><p className="font-black text-emerald-600 text-xl">{stats.remain}</p></div>
                    </div>

                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div><p className="text-[10px] text-slate-500 font-bold">สถานะคอร์ส</p><p className={`font-black text-sm ${stats.status === 'ใช้ครบแล้ว' ? 'text-rose-600' : 'text-teal-600'}`}>{safeRender(stats.status)}</p></div>
                        <div className="text-right"><p className="text-[10px] text-slate-500 font-bold">วันหมดอายุ</p><p className={`font-black text-xs ${stats.diffDays < 0 ? 'text-rose-500' : 'text-slate-700'}`}>{safeRender(stats.expireText)}</p></div>
                    </div>

                    <button onClick={() => openUseCourseModal(c)} disabled={stats.remain <= 0 && stats.credit <= stats.usedCredit} className="w-full bg-slate-900 text-white font-black py-4 rounded-xl shadow-lg hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-4">
                        <ShoppingBag size={18} className="mr-2 text-orange-400"/> ระบบเบิกสินค้า / ลายเซ็น
                    </button>
                </div>
            );})()}

            {!isScanning && !modalData.data && (
                <div className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-300 text-center">
                    <ScanLine size={48} className="mx-auto text-teal-400 mb-3 animate-pulse" />
                    <p className="text-xs text-slate-500 font-bold mb-4">พิมพ์รหัส หรือใช้กล้องสแกนบาร์โค้ด</p>
                    <form onSubmit={(e) => { e.preventDefault(); handleAction('process_scan', null); }}>
                        <div className="relative">
                            <input autoFocus ref={scannerInputRef} type="text" value={modalData.inputVal} onChange={e=>setModalData({...modalData, inputVal: e.target.value, errorMsg: ''})} className="w-full border-2 border-slate-200 rounded-xl pl-3 pr-12 py-3 text-center text-lg font-mono font-black text-slate-800 outline-none focus:border-teal-500 uppercase" placeholder="เช่น BK98765" />
                            <button type="button" onClick={() => setIsScanning(true)} className="absolute right-2 top-1/2 -translate-y-1/2 text-teal-500 hover:text-teal-700 p-2 bg-teal-50 rounded-lg transition-colors active:scale-95"><Camera size={20}/></button>
                        </div>
                        <button type="submit" className="w-full bg-slate-900 text-white font-black py-4 rounded-xl mt-4 shadow-lg active:scale-95 transition-all">ตรวจสอบรหัส</button>
                    </form>
                </div>
            )}

            {isScanning && (
                <div className="bg-slate-900 rounded-2xl p-4 relative shadow-lg">
                    <button onClick={() => { setIsScanning(false); stopScanner(); }} className="absolute top-3 right-3 text-white bg-rose-500 rounded-full w-8 h-8 flex items-center justify-center z-[110] active:scale-95 transition-transform shadow-md"><X size={18}/></button>
                    <h4 className="text-white text-xs font-black text-center mb-3">หันกล้องไปที่บาร์โค้ดหรือ QR</h4>
                    <div className="relative w-full bg-black rounded-xl overflow-hidden border-2 border-slate-700 min-h-[250px]">
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <Loader2 size={32} className="text-teal-500 animate-spin mb-2" />
                            <span className="text-teal-500 text-[10px] font-bold animate-pulse">กำลังโหลดกล้อง...</span>
                        </div>
                        <div id="reader" className="w-full h-full relative z-10"></div>
                    </div>
                </div>
            )}
        </ModalWrapper>

        {/* --- DELETE CONFIRMATION MODAL --- */}
        {deleteModal.open && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <div className="bg-white w-full max-w-sm rounded-[32px] p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 text-center">
                    <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={32}/></div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">ยืนยันการลบข้อมูล</h3>
                    <p className="text-sm text-slate-500 mb-6">คุณกำลังจะลบข้อมูล <strong className="text-rose-500">{deleteModal.type}</strong> จำนวน {deleteModal.data.length} รายการ การกระทำนี้ไม่สามารถย้อนกลับได้</p>
                    <div className="flex gap-3">
                        <button onClick={() => setDeleteModal({ open: false, type: '', data: [] })} className="flex-1 py-3.5 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200">ยกเลิก</button>
                        <button onClick={executeDeleteData} className="flex-1 py-3.5 rounded-xl font-black text-white bg-rose-500 hover:bg-rose-600 shadow-md">ยืนยันลบข้อมูล</button>
                    </div>
                </div>
            </div>
        )}

        {/* --- TOP APP BAR --- */}
        <header className="bg-slate-900 text-white pt-safe pb-3 px-5 shrink-0 shadow-md relative z-10">
            <div className="flex justify-between items-center h-14">
               <div className="flex items-center gap-2"><div className="w-8 h-8 bg-teal-500/20 rounded-lg flex items-center justify-center border border-teal-500/30"><Sparkles className="text-teal-400" size={16}/></div><h1 className="text-lg font-black tracking-wide">Iris Admin</h1></div>
            </div>
            {!['settings'].includes(activeTab) && (
                <div className="relative mt-2">
                   <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input type="text" className="w-full bg-slate-800 border border-slate-700 text-white rounded-full py-2.5 pl-10 pr-4 text-xs font-bold focus:outline-none focus:border-teal-500" placeholder="ค้นหาชื่อ, เบอร์ลูกค้า, อ้างอิง..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} />
                   {searchQuery && <button onClick={()=>setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"><X size={14}/></button>}
                </div>
            )}
        </header>

        {/* --- MAIN CONTENT SCROLL AREA --- */}
        <main className="flex-1 overflow-y-auto bg-slate-50 pb-20 hide-scrollbar">
            <div className="p-4 sm:p-5">
                
                {/* 🌟 DASHBOARD TAB 🌟 */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-4 animate-in fade-in">
                        {searchQuery ? (
                            <div className="space-y-3">
                                <h2 className="text-sm font-black text-slate-800 flex items-center mb-2"><Search className="mr-2 text-teal-500" size={16}/> ค้นหาข้อมูลลูกค้าด่วน</h2>
                                {globalCustomerSearch.map((c, i) => (
                                    <div key={i} onClick={() => { setCustomerProfileModal({ open: true, customer: c }); setSearchQuery(''); }} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.98]">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg border relative ${c.isShopeeOnly ? 'bg-orange-50 text-orange-500 border-orange-100' : 'bg-indigo-50 text-indigo-500 border-indigo-100'}`}>
                                            {c.isWoo && <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[7px] px-1 py-0.5 rounded shadow-sm">WEB</span>}
                                            {c.isShopeeOnly && <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[7px] px-1 py-0.5 rounded shadow-sm">SHP</span>}
                                            {safeRender(c.computedName)[0] || 'U'}
                                        </div>
                                        <div className="flex-1 pr-2">
                                            <p className="font-black text-slate-800 text-sm line-clamp-1">
                                                {safeRender(c.computedName)}
                                                {c.computedNickname && <span className="text-slate-500 font-bold ml-1 text-xs">({c.computedNickname})</span>}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-mono mb-1">{safeRender(c.computedPhone) || '-'}</p>
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${c.isWoo ? 'bg-blue-50 text-blue-600' : c.isShopeeOnly ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>{safeRender(c.computedStatus)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <>
                                <h2 className="text-sm font-black text-slate-800 flex items-center mb-1"><LayoutDashboard className="mr-2 text-teal-500" size={16}/> ภาพรวมวันนี้</h2>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <div onClick={() => { setActiveTab('bookings'); if(pendingBookings.length > 0) setIsPendingBookingModalOpen(true); }} className={`bg-white p-4 rounded-2xl shadow-sm border active:scale-95 transition-transform relative overflow-hidden ${pendingBookings.length > 0 ? 'border-amber-300 bg-amber-50/30' : 'border-slate-100'}`}>
                                        <div className="absolute top-0 right-0 p-3 opacity-10"><CalendarDays size={48} className={pendingBookings.length > 0 ? "text-amber-500" : ""}/></div>
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${pendingBookings.length > 0 ? 'text-amber-600' : 'text-blue-500'}`}>คิวรอยืนยัน</p>
                                            {pendingBookings.length > 0 && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span></span>}
                                        </div>
                                        <p className={`text-3xl font-black ${pendingBookings.length > 0 ? 'text-amber-600' : 'text-slate-800'}`}>{pendingBookings.length}</p>
                                    </div>
                                    <div onClick={() => setActiveTab('orders')} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 active:scale-95 transition-transform relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-3 opacity-10"><ReceiptText size={48}/></div>
                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">สลิป/เว็บ รอตรวจ</p>
                                        <p className="text-3xl font-black text-slate-800">{pendingSlips.length}</p>
                                    </div>
                                </div>

                                <div className="mt-6 mb-2">
                                    <div className="flex justify-between items-end mb-3 px-1">
                                        <h3 className="font-black text-slate-800 text-sm flex items-center"><Activity className="mr-2 text-blue-500" size={16}/> ประวัติรายการวันนี้</h3>
                                        <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">{todayActivities.length} รายการ</span>
                                    </div>
                                    <div className="space-y-3">
                                        {todayActivities.map((act, i) => (
                                            <div key={i} className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-3 relative overflow-hidden">
                                                <div className={`w-1 h-full absolute top-0 left-0 ${act.bg.replace('bg-', 'bg-').replace('-50', '-400')}`}></div>
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ml-1 ${act.bg} ${act.color}`}><act.icon size={18} /></div>
                                                <div className="flex-1 pr-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-0.5">
                                                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">{safeRender(act.type)}</span>
                                                        <span className="text-[9px] font-mono text-slate-400 flex items-center"><Clock size={9} className="mr-1"/>{new Date(act.ts).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})}</span>
                                                    </div>
                                                    <p className="font-bold text-slate-800 text-xs line-clamp-1">{safeRender(act.title)}</p>
                                                    <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t border-slate-50">
                                                        <span className="text-[10px] text-slate-500 font-medium truncate pr-2"><User size={10} className="inline mr-1 text-slate-400"/>{safeRender(act.customer)}</span>
                                                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded shrink-0 ${safeRender(act.status).includes('รอ') ? 'bg-amber-50 text-amber-600' : safeRender(act.status).includes('ยกเลิก') ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>{safeRender(act.status)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* 🌟 BOOKINGS TAB 🌟 */}
                {activeTab === 'bookings' && (
                    <div className="space-y-4 animate-in fade-in">
                        <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 sticky top-0 z-10 space-y-3">
                            <div className="flex justify-between items-center px-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-black text-slate-800 text-sm">จัดการคิวจอง</h3>
                                    <div className="relative flex items-center justify-center w-7 h-7 bg-slate-100 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors overflow-hidden">
                                        <CalendarDays size={14} />
                                        <input type="date" value={bookingFilterDate} onChange={e => setBookingFilterDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title="เลือกวันที่อื่นๆ" />
                                    </div>
                                </div>
                                <button onClick={() => {
                                    // 🌟 ใช้สาขาเก่า และ วันที่ปัจจุบัน 🌟
                                    setNewBookingForm({
                                        customerName: '', customerPhone: '', courseName: '',
                                        branch: lastUsedBranch,
                                        date: getLocalTodayStr(),
                                        time: ''
                                    });
                                    setIsAddBookingOpen(true);
                                }} className="px-3 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md"><Plus size={14} className="inline mr-1"/>เพิ่มคิว</button>
                            </div>

                            {/* 🌟 1. Filter: วันที่ (สลับขึ้นมาข้างบน) 🌟 */}
                            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 px-1">
                                {dateOptionsWithCounts.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setBookingFilterDate(opt.value)}
                                        className={`flex flex-col items-center justify-center min-w-[72px] py-2 rounded-xl border-2 transition-all shrink-0 relative ${bookingFilterDate === opt.value ? 'bg-teal-500 text-white border-teal-500 shadow-md' : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'}`}
                                    >
                                        <span className="text-[10px] font-bold mb-0.5">{opt.label}</span>
                                        <span className={`text-xs font-black ${bookingFilterDate === opt.value ? 'text-white' : 'text-slate-800'}`}>{opt.dateDisplay}</span>
                                        {/* ป้ายแสดงจำนวนคิวรวมในวันนั้น */}
                                        {opt.count > 0 && (
                                            <span className={`absolute -top-1.5 -right-1.5 flex items-center justify-center h-4 min-w-[16px] px-1 text-[9px] font-black rounded-full shadow-sm border ${bookingFilterDate === opt.value ? 'bg-white text-teal-600 border-teal-500' : 'bg-slate-800 text-white border-white'}`}>
                                                {opt.count}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* 🌟 2. Filter: สาขา (มีตัวเลขกำกับ) & 3. สถานะ 🌟 */}
                            <div className="flex flex-col gap-2">
                                <div className="flex gap-2 overflow-x-auto hide-scrollbar px-1 pb-1">
                                    {['ทั้งหมด', 'สาขาเฉวง', 'สาขาละไม'].map(branch => (
                                        <button key={branch} onClick={() => setBookingFilterBranch(branch)} className={`flex items-center justify-center px-3 py-1.5 rounded-lg text-[10px] font-black whitespace-nowrap transition-colors flex-1 text-center ${bookingFilterBranch === branch ? 'bg-slate-800 text-white shadow-sm' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'}`}>
                                            {branch}
                                            {/* ป้ายแสดงจำนวนคิวรวมของแต่ละสาขา */}
                                            {branchCounts[branch] > 0 && (
                                                <span className={`ml-1.5 flex items-center justify-center h-4 min-w-[16px] px-1 text-[9px] font-black rounded-full shadow-sm border ${bookingFilterBranch === branch ? 'bg-white text-slate-800 border-white' : 'bg-slate-200 text-slate-600 border-slate-300'}`}>
                                                    {branchCounts[branch]}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2 overflow-x-auto hide-scrollbar px-1 pb-1">
                                    {[
                                        {id: 'all', label: 'ทุกสถานะ'},
                                        {id: 'pending', label: 'รอยืนยัน'},
                                        {id: 'waiting', label: 'รอคิว'},
                                        {id: 'inservice', label: 'กำลังทำ'},
                                        {id: 'completed', label: 'เสร็จสิ้น'}
                                    ].map(stat => {
                                        const hasItems = bookingStatusCounts[stat.id] > 0 && stat.id !== 'all';
                                        return (
                                        <button key={stat.id} onClick={() => setBookingFilterStatus(stat.id)} className={`flex items-center px-3 py-1.5 rounded-lg text-[10px] font-black whitespace-nowrap transition-colors ${bookingFilterStatus === stat.id ? 'bg-indigo-500 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600'}`}>
                                            {stat.label}
                                            {/* แสดงป้ายสีแดงเสมอสำหรับสถานะที่มีคิวค้างอยู่ พร้อมแอนิเมชัน */}
                                            {hasItems && (
                                                <span className={`ml-1.5 flex items-center justify-center h-4 min-w-[16px] px-1 text-[9px] font-black rounded-full shadow-sm bg-rose-500 text-white border ${bookingFilterStatus === stat.id ? 'border-indigo-500' : 'border-white'} ${stat.id === 'inservice' ? 'animate-pulse' : ''}`}>
                                                    {bookingStatusCounts[stat.id]}
                                                </span>
                                            )}
                                        </button>
                                    )})}
                                </div>
                            </div>
                        </div>

                        {filteredBookings.length === 0 && (
                            <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
                                <CalendarDays size={32} className="mx-auto text-slate-300 mb-2" />
                                <p className="text-slate-500 font-bold text-xs">ไม่มีคิวในเงื่อนไขที่คุณเลือก</p>
                            </div>
                        )}

                        {filteredBookings.map((b, i) => {
                            const rawStatus = safeRender(b.status).trim();
                            const cDate = getBookingDate(b);
                            const cTime = getBookingTime(b);
                            const isTimeChanged = (b.originalTime && b.originalTime !== cTime) || (b.originalDate && b.originalDate !== cDate);
                            const isReschedule = rawStatus.includes('เลื่อน') || isTimeChanged;
                            
                            // ถ้ามีการเลื่อนเวลา ถือว่าเป็นคิวที่ต้องรอการยืนยันทันที
                            const isWaitingConfirm = !(rawStatus === 'กำลังรอ' || rawStatus === 'รอคิว' || rawStatus === 'กำลังใช้บริการ' || rawStatus === 'กำลังให้บริการ' || rawStatus === 'เข้ารับบริการแล้ว' || rawStatus === 'สำเร็จ' || rawStatus.includes('ยกเลิก')) || isReschedule;

                            let stripeColor = isReschedule ? 'bg-purple-400' : isWaitingConfirm ? 'bg-amber-400' : rawStatus === 'กำลังรอ' ? 'bg-teal-400' : rawStatus === 'รอคิว' ? 'bg-indigo-400' : rawStatus === 'กำลังให้บริการ' ? 'bg-blue-400' : 'bg-slate-300';
                            let timeBoxColor = isReschedule ? 'bg-purple-50 border-purple-200 text-purple-700' : isWaitingConfirm ? 'bg-amber-50 border-amber-200 text-amber-700' : rawStatus === 'กำลังรอ' ? 'bg-teal-50 border-teal-200 text-teal-700' : rawStatus === 'รอคิว' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : rawStatus === 'กำลังให้บริการ' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-500';

                            const displayTime = cTime ? cTime : '--:--';
                            
                            // 🌟 Time Calculations 🌟
                            let diffToBooked = 0;
                            let bookedTimeObj = null;
                            if (cDate && cTime) {
                                bookedTimeObj = new Date(`${cDate}T${cTime}`);
                                diffToBooked = (now - bookedTimeObj) / 60000;
                            }
                            // ถ้ารออยู่แล้วเลยเวลา (ยังไม่เกิน 15 นาที) แจ้งเตือนกระพริบ
                            const isOverdue = (rawStatus === 'กำลังรอ' || isWaitingConfirm) && diffToBooked > 0 && diffToBooked < 15;
                            
                            // 🌟 หาใบคอร์สที่เชื่อมโยงกับลูกค้านี้ 🌟
                            const bPhoneRaw = safeRender(b.customerPhone).replace(/[^0-9]/g, '');
                            const bNameRaw = safeRender(b.customerName).trim().toLowerCase();
                            const relatedCourses = computedCourses.filter(c => {
                                if (getVal(c, ['สถานะ', 'col_11']) === 'ยกเลิก') return false;
                                if (c._stats.remain <= 0 && c._stats.remainCredit <= 0) return false;
                                const cPhone = String(getVal(c, ['เบอร์โทร', 'col_1'])).replace(/[^0-9]/g, '');
                                const cName = String(getVal(c, ['ผู้ซื้อคอส', 'ชื่อลูกค้า', 'col_9'])).trim().toLowerCase();
                                return (cPhone && cPhone === bPhoneRaw) || (cName && cName === bNameRaw);
                            });

                            // 🌟 หาข้อมูลลูกค้าเพื่อแสดงรูปโปรไฟล์ 🌟
                            const matchedCustomer = allCustomers.find(c => {
                                const cPhone = c.computedPhone.replace(/[^0-9]/g, '');
                                const cName = String(c.computedName).trim().toLowerCase();
                                return (cPhone && cPhone.length >= 9 && cPhone === bPhoneRaw) || (cName && cName === bNameRaw);
                            });

                            return (
                            <div key={b.id || i} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden queue-item animate-in fade-in slide-in-from-bottom-4 duration-500 flex gap-3">
                                <div className={`absolute top-0 left-0 w-1.5 h-full ${stripeColor}`}></div>
                                
                                {/* 🌟 กล่องเวลาจองขนาดใหญ่ 🌟 */}
                                <div className={`w-[80px] rounded-xl flex flex-col items-center justify-center shrink-0 border ${timeBoxColor} ml-1`}>
                                    <span className="text-[9px] font-bold uppercase mb-0.5 opacity-80">เวลาจอง</span>
                                    <span className="text-xl font-black tracking-tighter">{displayTime}</span>
                                    {cTime && <span className="text-[9px] font-bold mt-0.5">น.</span>}
                                </div>

                                <div className="flex-1 py-1 pr-1 min-w-0 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-1.5">
                                            {/* 🌟 แสดงรูปโปรไฟล์ลูกค้า และ ชื่อ 🌟 */}
                                            <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                                                <div onClick={(e) => { e.stopPropagation(); if(matchedCustomer) { setCustomerProfileModal({ open: true, customer: matchedCustomer }); } }} className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] border relative shrink-0 transition-transform ${matchedCustomer ? 'cursor-pointer hover:scale-105 shadow-sm' : ''} ${matchedCustomer?.isShopeeOnly ? 'bg-orange-50 text-orange-500 border-orange-100' : matchedCustomer?.isWoo ? 'bg-blue-50 text-blue-500 border-blue-100' : 'bg-indigo-50 text-indigo-500 border-indigo-100'}`}>
                                                    {matchedCustomer?.isWoo && <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[6px] px-1 py-[1px] rounded shadow-sm z-10">WEB</span>}
                                                    {matchedCustomer?.isShopeeOnly && <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[6px] px-1 py-[1px] rounded shadow-sm z-10">SHP</span>}
                                                    {matchedCustomer?.photo ? <img src={matchedCustomer.photo} className="w-full h-full rounded-full object-cover" alt="profile"/> : (safeRender(b.customerName)[0] || 'U')}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <p className="font-black text-slate-800 text-sm line-clamp-1">{safeRender(b.customerName)} {matchedCustomer?.computedNickname && <span className="text-[10px] text-slate-500 font-bold ml-1">({matchedCustomer.computedNickname})</span>}</p>
                                                    <p className="text-[10px] text-slate-500 font-mono"><Phone size={10} className="inline mr-1"/>{safeRender(b.customerPhone)}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black ${isReschedule ? 'bg-purple-50 text-purple-600' : isWaitingConfirm ? 'bg-amber-50 text-amber-600' : rawStatus === 'กำลังให้บริการ' ? 'bg-blue-50 text-blue-600' : rawStatus === 'รอคิว' ? 'bg-indigo-50 text-indigo-600' : rawStatus === 'กำลังรอ' ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 text-slate-600'}`}>{isReschedule ? 'ขอเลื่อนเวลา' : isWaitingConfirm ? 'รอยืนยัน' : rawStatus}</span>
                                                {/* 🌟 ปุ่มเลื่อนคิว / เปลี่ยนสาขา (แสดงเฉพาะคิวที่ยังไม่จบ) 🌟 */}
                                                {!(rawStatus === 'เข้ารับบริการแล้ว' || rawStatus === 'สำเร็จ' || rawStatus.includes('ยกเลิก')) && (
                                                    <button onClick={(e) => { e.stopPropagation(); openEditBooking(b); }} className="w-6 h-6 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-400 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors shadow-sm">
                                                        <Edit3 size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 mb-2 flex flex-col justify-center">
                                            <div className="flex justify-between items-center w-full">
                                                <p className="text-[11px] font-bold text-slate-700 line-clamp-1 flex-1">{safeRender(b.courseName)}</p>
                                                <p className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded shrink-0 ml-2">{safeRender(b.branch) || 'สาขาเฉวง'}</p>
                                            </div>
                                            {isTimeChanged && b.originalTime && (
                                                <p className="text-[9px] text-purple-500 mt-1.5 font-bold border-t border-slate-200 pt-1">
                                                    เดิม: {b.originalDate ? new Date(b.originalDate).toLocaleDateString('th-TH') : ''} {b.originalTime} น.
                                                </p>
                                            )}
                                        </div>
                                        
                                        {/* แจ้งเตือนเลยเวลา */}
                                        {isOverdue && (
                                            <div className="bg-rose-50 border border-rose-200 rounded-lg p-2 mb-2 flex justify-between items-center animate-pulse">
                                                <span className="text-[10px] font-bold text-rose-600 flex items-center"><BellRing size={12} className="mr-1"/> เลยเวลา {Math.floor(diffToBooked)} นาที</span>
                                                <span className="text-[9px] text-rose-500">ยกเลิกใน {15 - Math.floor(diffToBooked)} น.</span>
                                            </div>
                                        )}
                                    </div>

                                    {isWaitingConfirm && (
                                        <div className="flex gap-2 mt-1">
                                            <button onClick={()=>handleAction('confirm_booking', b.id)} className={`flex-1 ${isReschedule ? 'bg-purple-50 hover:bg-purple-100 text-purple-700' : 'bg-amber-50 hover:bg-amber-100 text-amber-700'} font-black py-2 rounded-xl text-xs active:scale-95 transition-all`}><CheckCircle size={14} className="inline mr-1"/> {isReschedule ? 'อนุมัติเลื่อนคิว' : 'อนุมัติรับจอง'}</button>
                                            {isOverdue && <button onClick={()=>handleAction('cancel_booking', b.id)} className="px-3 bg-rose-50 text-rose-600 font-bold rounded-xl text-xs active:scale-95">ยกเลิก</button>}
                                        </div>
                                    )}
                                    {rawStatus === 'กำลังรอ' && !isOverdue && !isWaitingConfirm && (
                                        <div className="flex gap-2 mt-1">
                                            <button onClick={()=>handleAction('mark_arrived', b.id)} className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold py-2 rounded-xl text-xs active:scale-95 transition-all"><UserCheck size={14} className="inline mr-1"/> ลูกค้ามาถึงคลินิก</button>
                                        </div>
                                    )}
                                    {rawStatus === 'กำลังรอ' && isOverdue && !isWaitingConfirm && (
                                        <div className="flex gap-2 mt-1">
                                            <button onClick={()=>handleAction('extend_time', b.id)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs active:scale-95 transition-all"><Timer size={14} className="inline mr-1"/> รอต่อ</button>
                                            <button onClick={()=>handleAction('cancel_booking', b.id)} className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-2 rounded-xl text-xs active:scale-95 transition-all">ยกเลิก</button>
                                        </div>
                                    )}
                                    {rawStatus === 'รอคิว' && !isWaitingConfirm && (
                                        <div className="mt-1">
                                            {(() => {
                                                if (b.arrivedAt && bookedTimeObj) {
                                                    const arrTime = new Date(b.arrivedAt);
                                                    const arrDiff = (arrTime - bookedTimeObj) / 60000;
                                                    const isLate = arrDiff > 0;
                                                    const absMin = Math.abs(Math.floor(arrDiff));
                                                    const h = Math.floor(absMin / 60);
                                                    const m = absMin % 60;
                                                    const timeStr = h > 0 ? `${h} ชม.${m > 0 ? ` ${m} นาที` : ''}` : `${m} นาที`;
                                                    
                                                    return (
                                                        <div className={`text-[10px] font-bold mb-2 p-1.5 rounded-lg flex items-center justify-between ${isLate ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                            <span className="flex items-center"><Clock size={12} className="mr-1"/> {isLate ? `มาสาย ${timeStr}` : `มาก่อนเวลา ${timeStr}`}</span>
                                                            <span className="text-[9px] opacity-70">(มาถึง: {arrTime.toLocaleTimeString('th-TH', {hour:'2-digit', minute:'2-digit'})})</span>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                            <button onClick={()=>handleAction('start_service', b.id)} className="w-full bg-teal-50 hover:bg-teal-100 text-teal-700 font-black py-2 rounded-xl text-xs active:scale-95 transition-all"><Play size={14} className="inline mr-1"/> เริ่มให้บริการ</button>
                                        </div>
                                    )}
                                    {rawStatus === 'กำลังให้บริการ' && (
                                        <div className="mt-2 space-y-2">
                                            {(() => {
                                                const sTime = b.startedAt ? new Date(b.startedAt) : new Date(b.updatedAt);
                                                const dur = Math.max(0, Math.floor((now - sTime) / 60000));
                                                const dh = Math.floor(dur / 60);
                                                const dm = dur % 60;
                                                const durStr = dh > 0 ? `${dh} ชม. ${dm} นาที` : `${dm} นาที`;

                                                return (
                                                    <div className="bg-blue-50 border border-blue-100 p-2 rounded-lg flex items-center justify-between">
                                                        <span className="text-[10px] font-bold text-blue-800 flex items-center"><Timer size={12} className="mr-1"/> ให้บริการมาแล้ว</span>
                                                        <span className="font-black text-blue-600 text-xs font-mono">{durStr}</span>
                                                    </div>
                                                );
                                            })()}

                                            {/* ปุ่มลัดตัดคอร์ส */}
                                            {relatedCourses.length > 0 && (
                                                relatedCourses.length === 1 ? (
                                                    <button onClick={()=>openUseCourseModal(relatedCourses[0], b.id)} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-black py-2.5 rounded-xl text-xs shadow-md active:scale-95 transition-all flex items-center justify-center">
                                                        <Edit3 size={14} className="mr-1.5"/> ตัดคอร์ส ({safeRender(getVal(relatedCourses[0], ['ชื่อคอส', 'col_8']))})
                                                    </button>
                                                ) : (
                                                    <button onClick={()=>setSelectCourseModal({open: true, bookingId: b.id, courses: relatedCourses})} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-black py-2.5 rounded-xl text-xs shadow-md active:scale-95 transition-all flex items-center justify-center">
                                                        <Edit3 size={14} className="mr-1.5"/> ตัดคอร์ส (พบ {relatedCourses.length} คอร์ส)
                                                    </button>
                                                )
                                            )}

                                            <button onClick={()=>handleAction('finish_booking', b.id)} className={`w-full font-black py-2.5 rounded-xl text-xs active:scale-95 transition-all flex items-center justify-center ${relatedCourses.length > 0 ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200' : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md'}`}>
                                                <CheckSquare size={14} className="mr-1.5"/> {relatedCourses.length > 0 ? 'เสร็จสิ้น (ไม่ตัดคอร์ส)' : 'เสร็จสิ้นให้บริการ'}
                                            </button>
                                        </div>
                                    )}
                                    
                                    {/* 🌟 ปุ่มสำหรับจองคิวต่อเนื่องจากคิวที่เสร็จสิ้นแล้ว 🌟 */}
                                    {(rawStatus === 'เข้ารับบริการแล้ว' || rawStatus === 'สำเร็จ') && (
                                        <div className="mt-2 pt-2 border-t border-slate-100">
                                            <button onClick={() => {
                                                setNewBookingForm({
                                                    customerName: safeRender(b.customerName),
                                                    customerPhone: safeRender(b.customerPhone),
                                                    courseName: safeRender(b.courseName),
                                                    branch: safeRender(b.branch) || lastUsedBranch,
                                                    date: getLocalTodayStr(), // ใช้วันนี้
                                                    time: ''
                                                });
                                                setIsAddBookingOpen(true);
                                            }} className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 font-black py-2.5 rounded-xl text-xs active:scale-95 transition-all flex items-center justify-center border border-slate-200">
                                                <CalendarPlus size={14} className="mr-1.5 text-teal-500"/> นัดหมายครั้งถัดไป (ดึงข้อมูลเดิม)
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )})}
                    </div>
                )}

                {/* 🌟 ORDERS TAB 🌟 */}
                {activeTab === 'orders' && (
                    <div className="space-y-3 animate-in fade-in">
                        <div className="flex justify-between items-center px-1 mb-2">
                            <h3 className="font-black text-slate-700 text-sm">คำสั่งซื้อทั้งหมด</h3>
                            <button onClick={fetchWooOrders} disabled={isWooLoading} className="flex items-center text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg active:scale-95 transition-all"><RefreshCcw size={12} className={`mr-1.5 ${isWooLoading ? 'animate-spin' : ''}`}/> ซิงค์เว็บ</button>
                        </div>
                        {allOrders.filter(o => o.itemType !== 'custom_image' && o.itemType !== 'external_accumulation').filter(o => (safeRender(o.customerName)+safeRender(o.customerPhone)+safeRender(o.orderNo)).toLowerCase().includes(searchQuery.toLowerCase())).map((o, i) => {
                            const isPending = safeRender(o.status).toLowerCase().includes('รอ') || safeRender(o.status).toLowerCase().includes('เตรียม') || ['pending', 'processing', 'on-hold'].includes(safeRender(o.status).toLowerCase());
                            return (
                            <div key={i} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex gap-3 relative overflow-hidden cursor-pointer hover:shadow-md" onClick={() => { setModalData({open: true, type: 'order_detail', data: o, trackingVal: o.trackingNo || '', errorMsg: ''}); setSearchQuery(''); }}>
                                <div className={`absolute top-0 left-0 w-1 h-full ${isPending ? 'bg-amber-400' : 'bg-blue-400'}`}></div>
                                <div className="w-20 h-20 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden shrink-0 ml-1 flex items-center justify-center relative hover:opacity-80 transition-opacity" onClick={(e)=> { e.stopPropagation(); if(!o.isWoo && !o.isShopee && o.slipImage) { setModalData({open:true, type:'image', data: o.slipImage}); setSearchQuery(''); } }}>
                                    {o.isWoo ? <div className="flex flex-col items-center text-blue-500 opacity-50"><Globe size={24}/><span className="text-[8px] font-black mt-1">WEB</span></div> : o.isShopee ? <div className="flex flex-col items-center text-orange-500 opacity-50"><Store size={24}/><span className="text-[8px] font-black mt-1">SHOPEE</span></div> : o.slipImage ? <img src={o.slipImage} className="w-full h-full object-cover" alt="slip" /> : <ImgIcon className="text-slate-300"/>}
                                </div>
                                <div className="flex-1 flex flex-col justify-between py-0.5 pr-1">
                                    <div>
                                        <div className="flex justify-between items-start mb-0.5">
                                            <span className="font-black text-slate-800 text-[13px] line-clamp-1 pr-2">{safeRender(o.customerName)}</span>
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 ${isPending ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>{safeRender(o.status)}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 line-clamp-1">{safeRender(o.itemName)}</p>
                                    </div>
                                    <div className="flex justify-between items-end mt-2">
                                        <div>
                                            <p className="text-[9px] font-mono text-slate-400 mb-0.5">{safeRender(o.orderNo)} {o.trackingNo ? `| 📦 ${o.trackingNo}` : ''}</p>
                                            <p className="font-black text-rose-600 text-sm">฿{parseNum(o.itemPrice).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );})}
                    </div>
                )}

                {/* 🌟 MORE MENU & SUB TABS 🌟 */}
                {isMoreMenu && (
                    <div className="animate-in fade-in">
                        {activeTab === 'more' ? (
                            <div className="space-y-4">
                                <h2 className="text-sm font-black text-slate-800 pl-2">จัดการข้อมูลระบบ</h2>
                                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
                                    {[
                                        { id: 'shopee_orders', label: 'จัดการออเดอร์ Shopee', desc: 'นำเข้าและจัดการออเดอร์ช้อปปี้', icon: Store, color: 'text-orange-500', bg: 'bg-orange-50' },
                                        { id: 'customers', label: 'ฐานข้อมูลลูกค้า', desc: 'รายชื่อสมาชิก, VIP, ยอดสะสม', icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                                        { id: 'courses', label: 'จัดการใบคอร์ส', desc: 'ตรวจสอบคอร์ส, ยอดคงเหลือ', icon: FileText, color: 'text-teal-500', bg: 'bg-teal-50' },
                                        { id: 'histories', label: 'ประวัติบริการ', desc: 'ตรวจสอบประวัติย้อนหลังทั้งหมด', icon: History, color: 'text-blue-500', bg: 'bg-blue-50' },
                                        { id: 'fast_orders', label: 'ประเมินราคาออเดอร์', desc: 'ตอบกลับรูปภาพที่ลูกค้าส่งมา', icon: ImgIcon, color: 'text-purple-500', bg: 'bg-purple-50', badge: pendingFastOrders.length },
                                        { id: 'accumulations', label: 'อนุมัติสะสมยอด', desc: 'ยอดจิปาถะอื่นๆ จากภายนอก', icon: Package, color: 'text-amber-500', bg: 'bg-amber-50', badge: pendingAccums.length },
                                        { id: 'settings', label: 'การตั้งค่าระบบ', desc: 'การเชื่อมต่อ, อัปโหลด CSV, ลบข้อมูล', icon: Settings, color: 'text-slate-500', bg: 'bg-slate-100' },
                                    ].map((m, i) => (
                                        <div key={i} onClick={() => setActiveTab(m.id)} className="flex items-center p-4 active:bg-slate-50 transition-colors cursor-pointer">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-4 ${m.bg} ${m.color}`}><m.icon size={20}/></div>
                                            <div className="flex-1">
                                                <h4 className="font-black text-slate-800 text-sm flex items-center">{m.label} {m.badge > 0 && <span className="ml-2 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{m.badge}</span>}</h4>
                                                <p className="text-[11px] text-slate-500 mt-0.5">{m.desc}</p>
                                            </div>
                                            <ChevronRight size={20} className="text-slate-300"/>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => setIsLoggedIn(false)} className="w-full mt-4 bg-white border border-rose-100 text-rose-500 font-black py-4 rounded-3xl shadow-sm flex items-center justify-center active:scale-95 transition-transform"><LogOut size={18} className="mr-2"/> ออกจากระบบ</button>
                            </div>
                        ) : (
                            <div>
                                <button onClick={() => setActiveTab('more')} className="flex items-center text-xs font-bold text-slate-500 mb-4 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm active:scale-95 w-max"><ChevronLeft size={16} className="mr-1"/> กลับเมนูหลัก</button>
                                
                                {activeTab === 'shopee_orders' && (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center mb-2"><h3 className="font-black text-slate-800 text-lg flex items-center"><Store className="mr-2 text-orange-500"/> ออเดอร์ Shopee</h3><button onClick={() => setIsAddShopeeOrderOpen(true)} className="flex items-center text-[10px] font-bold text-white bg-orange-500 px-3 py-1.5 rounded-lg active:scale-95 transition-all shadow-sm"><Plus size={12} className="mr-1"/> เพิ่มออเดอร์</button></div>
                                        {dbData.orders.filter(o => o.isShopee).filter(o => (safeRender(o.customerName)+safeRender(o.orderNo)+safeRender(o.trackingNo)).toLowerCase().includes(searchQuery.toLowerCase())).map((o, i) => (
                                            <div key={i} onClick={() => { setModalData({open: true, type: 'order_detail', data: o, trackingVal: o.trackingNo || '', errorMsg: ''}); setSearchQuery(''); }} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden cursor-pointer">
                                                <div className={`absolute top-0 left-0 w-1.5 h-full ${safeRender(o.status).includes('รอ') ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>
                                                <div className="pl-2">
                                                    <div className="flex justify-between items-start mb-1"><p className="font-black text-slate-800 text-sm">{safeRender(o.customerName)}</p><span className="px-2 py-1 rounded-md text-[9px] font-black bg-amber-50 text-amber-600">{safeRender(o.status)}</span></div>
                                                    <p className="text-[10px] text-slate-500 font-mono mb-2">Order ID: <span className="font-bold text-slate-700">{safeRender(o.orderNo)}</span></p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeTab === 'fast_orders' && (
                                    <div className="space-y-4">
                                        <h3 className="font-black text-slate-800 text-lg mb-2">ประเมินราคารูปภาพ</h3>
                                        {dbData.orders.filter(o => o.itemType === 'custom_image').filter(o => (safeRender(o.customerName)+safeRender(o.customerPhone)+safeRender(o.orderNo)).toLowerCase().includes(searchQuery.toLowerCase())).map((o, i) => (
                                            <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
                                                <div className="flex justify-between items-center"><span className="font-mono text-[10px] text-slate-400">#{safeRender(o.orderNo)}</span><span className={`px-2 py-1 rounded-md text-[9px] font-black ${safeRender(o.status).includes('รอ')?'bg-indigo-50 text-indigo-600':'bg-emerald-50 text-emerald-600'}`}>{safeRender(o.status)}</span></div>
                                                <img src={o.slipImage} onClick={()=> { setModalData({open:true, type:'image', data: o.slipImage}); setSearchQuery(''); }} className="w-full h-40 object-cover rounded-xl border border-slate-200" alt="fast-order" />
                                                <div><p className="font-black text-slate-800 text-sm">{safeRender(o.customerName)}</p></div>
                                                {safeRender(o.status).includes('รอ') && <button onClick={()=> { setModalData({open:true, type: 'quote', data: o, inputVal: ''}); setSearchQuery(''); }} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-xs shadow-md active:scale-95">ประเมินราคา (ส่งให้ลูกค้า)</button>}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeTab === 'accumulations' && (
                                    <div className="space-y-4">
                                        <h3 className="font-black text-slate-800 text-lg mb-2">อนุมัติสะสมยอดออนไลน์</h3>
                                        {dbData.orders.filter(o => o.itemType === 'external_accumulation').filter(o => (safeRender(o.customerName)+safeRender(o.customerPhone)+safeRender(o.orderNo)).toLowerCase().includes(searchQuery.toLowerCase())).map((o, i) => (
                                            <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
                                                <div className="flex justify-between items-center"><span className="font-mono text-[10px] text-slate-400">#{safeRender(o.orderNo)}</span><span className={`px-2 py-1 rounded-md text-[9px] font-black ${safeRender(o.status).includes('รอ')?'bg-amber-50 text-amber-600':'bg-emerald-50 text-emerald-600'}`}>{safeRender(o.status)}</span></div>
                                                <img src={o.slipImage} onClick={()=> { setModalData({open:true, type:'image', data: o.slipImage}); setSearchQuery(''); }} className="w-full h-40 object-cover rounded-xl border border-slate-200" alt="accumulate" />
                                                <div><p className="font-black text-slate-800 text-sm">{safeRender(o.customerName)}</p></div>
                                                {safeRender(o.status).includes('รอ') && <button onClick={()=> { setModalData({open:true, type: 'accumulate', data: o, inputVal: ''}); setSearchQuery(''); }} className="w-full py-3 bg-amber-500 text-white rounded-xl font-black text-xs shadow-md active:scale-95">ตรวจสอบและบวกแต้ม</button>}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeTab === 'customers' && (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center mb-2"><h3 className="font-black text-slate-800 text-lg">ฐานข้อมูลลูกค้า</h3><button onClick={fetchWooCustomers} disabled={isWooCustomersLoading} className="flex items-center text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg active:scale-95 transition-all"><RefreshCcw size={12} className={`mr-1.5 ${isWooCustomersLoading ? 'animate-spin' : ''}`}/> ซิงค์เว็บ</button></div>
                                        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 mb-3">
                                            {[ { id: 'all', label: 'ทั้งหมด' }, { id: 'general', label: 'ทั่วไป' }, { id: 'member', label: 'สมาชิก / VIP' }, { id: 'web', label: 'ลูกค้าเว็บ' }, { id: 'shopee', label: 'ลูกค้า Shopee' } ].map(f => (
                                                <button key={f.id} onClick={() => setCustomerFilter(f.id)} className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${customerFilter === f.id ? (f.id === 'shopee' ? 'bg-orange-500 text-white' : 'bg-indigo-500 text-white') : 'bg-white border border-slate-200 text-slate-600'}`}>{f.label}</button>
                                            ))}
                                        </div>
                                        {filteredCustomersList.map((c, i) => (
                                            <div key={i} onClick={() => { setCustomerProfileModal({ open: true, customer: c }); setSearchQuery(''); }} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 cursor-pointer">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg border relative ${c.isShopeeOnly ? 'bg-orange-50 text-orange-500 border-orange-100' : 'bg-indigo-50 text-indigo-500 border-indigo-100'}`}>
                                                    {c.isWoo && <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[7px] px-1 py-0.5 rounded shadow-sm">WEB</span>}
                                                    {c.isShopeeOnly && <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[7px] px-1 py-0.5 rounded shadow-sm">SHP</span>}
                                                    {safeRender(c.computedName)[0] || 'U'}
                                                </div>
                                                <div className="flex-1 pr-2">
                                                    <p className="font-black text-slate-800 text-sm line-clamp-1">
                                                        {safeRender(c.computedName)}
                                                        {c.computedNickname && <span className="text-slate-500 font-bold ml-1 text-xs">({c.computedNickname})</span>}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 font-mono mb-1">{safeRender(c.computedPhone) || '-'}</p>
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${c.isWoo ? 'bg-blue-50 text-blue-600' : c.isShopeeOnly ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>{safeRender(c.computedStatus)}</span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase">ยอดสะสม</p>
                                                    <p className="font-black text-emerald-600">฿{parseNum(c.computedPoints).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeTab === 'courses' && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-black text-slate-800 text-lg">ใบคอร์สทั้งหมด</h3>
                                        </div>
                                        <div className="flex p-1 bg-slate-100 rounded-xl mb-4">
                                            <button onClick={() => setCourseFilterType('all')} className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${courseFilterType === 'all' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-500'}`}>ทั้งหมด</button>
                                            <button onClick={() => setCourseFilterType('treatment')} className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${courseFilterType === 'treatment' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-500'}`}>คอสรักษา</button>
                                            <button onClick={() => setCourseFilterType('general')} className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${courseFilterType === 'general' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-500'}`}>คอสทั่วไป</button>
                                        </div>
                                        {filteredCoursesList.map((c, i) => {
                                            const stats = c._stats;
                                            return (
                                            <div key={i} onClick={() => { openCourseDetail(c); setSearchQuery(''); }} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden cursor-pointer hover:shadow-md transition-all active:scale-[0.98]">
                                                <div className={`absolute top-0 left-0 w-1.5 h-full ${stats.remain > 0 ? 'bg-teal-400' : 'bg-slate-300'}`}></div>
                                                <div className="pl-2">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <p className="font-black text-teal-700 text-sm line-clamp-1 pr-2">{safeRender(getVal(c, ['ชื่อคอส', 'col_8'])) || '-'}</p>
                                                        <div className="text-right shrink-0"><span className={`bg-slate-100 text-slate-600 px-2 py-1 rounded text-[9px] font-bold ${stats.diffDays <= 30 && stats.diffDays >= 0 ? 'text-orange-500' : stats.diffDays < 0 ? 'text-rose-500' : ''}`}>{safeRender(stats.status)}</span></div>
                                                    </div>
                                                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-2 mt-2">
                                                        <p className="text-xs font-bold text-slate-800">{safeRender(getVal(c, ['ผู้ซื้อคอส', 'ชื่อลูกค้า', 'col_9'])) || '-'}</p>
                                                        <p className="text-[10px] text-slate-500 font-mono">Ref: {safeRender(getVal(c, ['เลขที่ใบคอส', 'col_2'])) || '-'} | {safeRender(getVal(c, ['เบอร์โทร', 'col_1']))}</p>
                                                    </div>
                                                    <div className="flex justify-between items-center pt-1">
                                                        <div><p className="text-[11px] text-slate-500 font-bold">ใช้งาน {stats.used} / {stats.total}</p><p className={`text-[9px] mt-0.5 ${stats.diffDays < 0 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>{safeRender(stats.expireText)}</p></div>
                                                        <p className="text-sm font-black text-emerald-600">เหลือ {stats.remain}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )})}
                                    </div>
                                )}

                                {activeTab === 'histories' && (
                                    <div className="space-y-3">
                                        <h3 className="font-black text-slate-800 text-lg mb-2">ตรวจสอบประวัติ (Histories)</h3>
                                        <p className="text-[11px] text-slate-500 mb-4 bg-blue-50 p-3 rounded-xl border border-blue-100"><Info size={14} className="inline mr-1 mb-0.5 text-blue-500"/> ข้อมูลประวัติการรับบริการ, ตัดคอร์ส, เบิกสินค้า ที่ดึงมาจากตาราง <code className="font-bold text-slate-700">histories</code></p>
                                        
                                        {filteredHistoriesList.map((h, i) => {
                                            const type = getVal(h, ['ประเภท', 'col_4']) || '-';
                                            const isCancel = h.isCancelled || String(getVal(h, ['สถานะ', 'col_7', 'col_8', 'col_9'])).includes('ยกเลิก');
                                            return (
                                            <div key={i} className={`bg-white p-4 rounded-2xl shadow-sm border ${isCancel ? 'border-rose-200' : 'border-slate-100'} relative overflow-hidden`}>
                                                <div className={`absolute top-0 left-0 w-1.5 h-full ${isCancel ? 'bg-rose-400' : type.includes('เบิก') || type.includes('หัก') || type.includes('จ่าย') ? 'bg-orange-400' : 'bg-blue-400'}`}></div>
                                                <div className="pl-2">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black shrink-0 ${isCancel ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>{safeRender(type)}</span>
                                                        <span className="text-[10px] text-slate-400 font-mono">{formatDate(getVal(h, ['วันที่', 'col_1']))} {safeRender(h.เวลา)}</span>
                                                    </div>
                                                    <p className="font-bold text-slate-800 text-sm mt-1">{safeRender(getVal(h, ['รายการ', 'สินค้า', 'col_23', 'col_18'])) || 'ไม่มีชื่อรายการ'}</p>
                                                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-2 mt-2">
                                                        <p className="text-xs font-bold text-slate-700">{safeRender(getVal(h, ['ชื่อลูกค้า', 'col_2'])) || 'ไม่ระบุลูกค้า'}</p>
                                                        <p className="text-[10px] text-slate-500 font-mono">Ref ใบคอร์ส: {safeRender(getVal(h, ['เลขที่ใบคอส', 'col_6', 'courseId'])) || '-'} | {safeRender(getVal(h, ['เบอร์โทร', 'col_5', 'customerPhone'])) || '-'}</p>
                                                    </div>
                                                    <div className="flex justify-between items-center pt-1 border-t border-slate-50">
                                                        <p className="text-[11px] text-slate-500 font-bold">จนท: {safeRender(getVal(h, ['ชื่อเจ้าหน้าที่', 'ชื่อพนักงาน', 'staffName', 'ผู้ให้บริการ', 'เจ้าหน้าที่'])) || '-'}</p>
                                                        <div className="text-right">
                                                            {getVal(h, ['จำนวน', 'จำนวนที่ใช้', 'ตัดคอร์ส', 'col_15']) && <span className="text-xs font-black text-indigo-600 mr-2">ใช้: {safeRender(getVal(h, ['จำนวน', 'จำนวนที่ใช้', 'ตัดคอร์ส', 'col_15']))} ครั้ง</span>}
                                                            {getVal(h, ['ยอดสินค้า', 'ยอดจัดซื้อ', 'ยอดเงิน', 'ยอดเบิก', 'ยอด', 'col_19']) && <span className="text-xs font-black text-orange-600">฿{parseNum(getVal(h, ['ยอดสินค้า', 'ยอดจัดซื้อ', 'ยอดเงิน', 'ยอดเบิก', 'ยอด', 'col_19'])).toLocaleString()}</span>}
                                                        </div>
                                                    </div>
                                                    {isCancel && <p className="text-[10px] font-black text-rose-500 mt-2 text-center bg-rose-50 py-1 rounded">-- รายการนี้ถูกยกเลิกแล้ว --</p>}
                                                </div>
                                            </div>
                                        )})}
                                    </div>
                                )}

                                {activeTab === 'settings' && (
                                    <div className="space-y-4">
                                        <h3 className="font-black text-slate-800 text-lg mb-2">การตั้งค่าระบบ</h3>
                                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                            <h4 className="font-black text-sm mb-4 flex items-center"><Database className="mr-2 text-indigo-500" size={18}/> สถานะ Firebase</h4>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                    <div className="flex items-center gap-3"><User size={16} className={authStatus === 'authenticated' ? 'text-emerald-500' : 'text-rose-500'}/><span className="text-xs font-bold text-slate-700">Authentication</span></div>
                                                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${authStatus === 'authenticated' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>{safeRender(authStatus)}</span>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                    <div className="flex items-center gap-3"><Database size={16} className={dbStatus === 'connected' ? 'text-emerald-500' : 'text-rose-500'}/><span className="text-xs font-bold text-slate-700">Firestore Rules</span></div>
                                                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${dbStatus === 'connected' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>{safeRender(dbStatus)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                            <h4 className="font-black text-sm mb-4 flex items-center"><Upload className="mr-2 text-teal-500" size={18}/> นำเข้าข้อมูล (CSV)</h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[ { t: 'customers', l: 'ลูกค้า' }, { t: 'courses', l: 'ใบคอร์ส' }, { t: 'histories', l: 'ประวัติ' }, { t: 'products', l: 'สินค้า' }, { t: 'shopee_orders', l: 'Shopee CSV' } ].map((btn, idx) => (
                                                    <label key={idx} className="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 py-3 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-colors cursor-pointer active:scale-95">
                                                        <Upload size={16} className={`mb-1 ${btn.t === 'shopee_orders' ? 'text-orange-400' : 'text-slate-400'}`}/> <span className={btn.t === 'shopee_orders' ? 'text-orange-600' : ''}>{btn.l}</span>
                                                        <input type="file" accept=".csv" className="hidden" onChange={(e) => handleCSVUpload(e, btn.t)} />
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-rose-50 p-5 rounded-2xl border border-rose-100 shadow-sm">
                                            <h4 className="font-black text-sm mb-4 flex items-center text-rose-600"><AlertTriangle className="mr-2" size={18}/> ลบข้อมูล (Danger)</h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[ { t: 'ใบคอร์สลูกค้า', d: dbData.courses, l: 'ล้างใบคอร์ส' }, { t: 'ลูกค้า', d: dbData.customers, l: 'ล้างลูกค้า' }, { t: 'ประวัติ', d: dbData.histories, l: 'ล้างประวัติ' }, { t: 'การจองคิว', d: dbData.bookings, l: 'ล้างคิว' }, { t: 'คำสั่งซื้อ', d: dbData.orders, l: 'ล้างออเดอร์' }, { t: 'สินค้า', d: dbData.products, l: 'ล้างสินค้า' } ].map((btn, idx) => (
                                                    <button key={idx} onClick={() => setDeleteModal({ open: true, type: btn.t, data: btn.d })} disabled={btn.d.length === 0} className="bg-white disabled:bg-slate-50 text-rose-500 disabled:text-slate-300 border border-rose-200 disabled:border-slate-200 py-3 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-colors active:scale-95">
                                                        <Trash2 size={16} className="mb-1"/> {btn.l}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>

        {/* --- BOTTOM NAVIGATION BAR --- */}
        <nav className="bg-white border-t border-slate-200 flex justify-around items-center h-[72px] pb-safe shrink-0 relative z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-2">
            <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center w-16 transition-colors ${activeTab === 'dashboard' ? 'text-teal-600' : 'text-slate-400'}`}>
                <div className={`p-1.5 rounded-xl ${activeTab === 'dashboard' ? 'bg-teal-50' : ''}`}><LayoutDashboard size={22} strokeWidth={activeTab === 'dashboard' ? 2.5 : 2}/></div>
                <span className="text-[9px] font-black mt-0.5">ภาพรวม</span>
            </button>
            <button onClick={() => setActiveTab('bookings')} className={`flex flex-col items-center w-16 transition-colors relative ${activeTab === 'bookings' ? 'text-teal-600' : 'text-slate-400'}`}>
                <div className={`p-1.5 rounded-xl ${activeTab === 'bookings' ? 'bg-teal-50' : ''}`}><CalendarDays size={22} strokeWidth={activeTab === 'bookings' ? 2.5 : 2}/></div>
                <span className="text-[9px] font-black mt-0.5">คิวจอง</span>
                {pendingBookings.length > 0 && <span className="absolute top-0 right-1.5 flex items-center justify-center h-4 min-w-[16px] px-1 bg-rose-500 text-white text-[9px] font-black rounded-full border-[1.5px] border-white shadow-sm">{pendingBookings.length > 99 ? '99+' : pendingBookings.length}</span>}
            </button>

            {/* SCANNER FAB IN CENTER */}
            <div className="relative -top-6">
                <button onClick={() => { setModalData({open:true, type:'scanner', inputVal: '', errorMsg: ''}); setIsScanning(true); }} className="w-14 h-14 bg-slate-900 text-teal-400 rounded-full flex items-center justify-center shadow-xl shadow-slate-900/30 border-4 border-slate-50 active:scale-95 transition-transform">
                    <ScanLine size={24} strokeWidth={2.5}/>
                </button>
            </div>

            <button onClick={() => setActiveTab('orders')} className={`flex flex-col items-center w-16 transition-colors relative ${activeTab === 'orders' ? 'text-teal-600' : 'text-slate-400'}`}>
                <div className={`p-1.5 rounded-xl ${activeTab === 'orders' ? 'bg-teal-50' : ''}`}><ReceiptText size={22} strokeWidth={activeTab === 'orders' ? 2.5 : 2}/></div>
                <span className="text-[9px] font-black mt-0.5">ออเดอร์</span>
                {pendingSlips.length > 0 && <span className="absolute top-0 right-1.5 flex items-center justify-center h-4 min-w-[16px] px-1 bg-rose-500 text-white text-[9px] font-black rounded-full border-[1.5px] border-white shadow-sm">{pendingSlips.length > 99 ? '99+' : pendingSlips.length}</span>}
            </button>
            <button onClick={() => setActiveTab('more')} className={`flex flex-col items-center w-16 transition-colors relative ${isMoreMenu ? 'text-teal-600' : 'text-slate-400'}`}>
                <div className={`p-1.5 rounded-xl ${isMoreMenu ? 'bg-teal-50' : ''}`}><Menu size={22} strokeWidth={isMoreMenu ? 2.5 : 2}/></div>
                <span className="text-[9px] font-black mt-0.5">เมนู</span>
                {(pendingFastOrders.length + pendingAccums.length) > 0 && <span className="absolute top-0 right-1.5 flex items-center justify-center h-4 min-w-[16px] px-1 bg-rose-500 text-white text-[9px] font-black rounded-full border-[1.5px] border-white shadow-sm">{(pendingFastOrders.length + pendingAccums.length) > 99 ? '99+' : (pendingFastOrders.length + pendingAccums.length)}</span>}
            </button>
        </nav>
    </div>
  );
}