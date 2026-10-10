import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Upload, Search, Home, FileText, Users, Settings, 
  Plus, Eye, CheckCircle, Clock, QrCode, LogOut, Menu, X, 
  Tag, Calendar, ShoppingCart, Package, TrendingUp, MapPin, 
  Award, AlertCircle, Banknote, Activity, Phone, History as HistoryIcon, 
  Printer, ShoppingBag, ArrowLeft, HeartPulse, ChevronRight, 
  CalendarPlus, UserPlus, Sparkles, Trash2, AlertTriangle, Layers, Database,
  Camera, Image as ImageIcon, ShieldCheck, ShieldAlert, RefreshCcw, PenTool,
  Bell, List, LayoutGrid, ScanLine, CalendarDays, ChevronLeft
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc, writeBatch, query, where, getDocs } from 'firebase/firestore';

// --- FIREBASE CONFIG ---
const fallbackFirebaseConfig = {
  apiKey: "AIzaSyBS3zKEA6zosmy8tLRTyJ38BPLlUQS30gU",
  authDomain: "iris-clinic-app.firebaseapp.com",
  projectId: "iris-clinic-app",
  storageBucket: "iris-clinic-app.firebasestorage.app",
  messagingSenderId: "372749467528",
  appId: "1:372749467528:web:1e90ecab74274ec965843d",
  measurementId: "G-BQW1W46XSH"
};

const app = initializeApp(fallbackFirebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, "iris-care");  

const getCol = (colName) => collection(db, colName);
const getDocRef = (colName, id) => doc(db, colName, id);

// --- UTILS & PARSERS ---
function getLocalYYYYMMDD(dateObj = new Date()) {
  if (isNaN(dateObj.getTime())) return '';
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateTimeStr(dt) {
  if (!dt) return '-';
  const d = new Date(dt);
  if (isNaN(d.getTime())) return dt;
  return d.toLocaleDateString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }) + ' น.';
}

function parseNumber(val) {
  if (val === undefined || val === null || val === '') return 0;
  return parseFloat(String(val).replace(new RegExp(',', 'g'), '').replace(new RegExp('[^\\d.-]', 'g'), '').trim()) || 0;
}

function parseQty(val) {
  return Math.floor(parseNumber(val));
}

function parseHistoryTime(val) {
  if (val === undefined || val === null || val === '') return 0;
  const text = String(val);
  const timeMatch = text.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) return Number(timeMatch[1]) * 60 + Number(timeMatch[2]);
  const nums = text.match(/\d+/g) || [];
  if (nums.length >= 2) return Number(nums[0]) * 60 + Number(nums[1]);
  return 0;
}

function getHistoryDateKey(h) {
  const createdAt = getFuzzyKey(h, ["createdAt", "updatedAt"]);
  const dateVal = createdAt || getFuzzyKey(h, ["วันที่", "col_1"]);
  if (!dateVal) return '';
  const parsed = parseThaiDate(dateVal);
  if (parsed) return getLocalYYYYMMDD(parsed);
  const isoMatch = String(dateVal).match(/^\d{4}-\d{2}-\d{2}/);
  return isoMatch ? isoMatch[0] : '';
}

function getHistorySortTime(h) {
  const createdAt = getFuzzyKey(h, ["createdAt", "updatedAt"]);
  if (createdAt) {
    const d = new Date(createdAt);
    if (!isNaN(d.getTime())) return d.getTime();
  }
  const dateVal = getFuzzyKey(h, ["วันที่", "col_1"]);
  const parsed = parseThaiDate(dateVal);
  if (!parsed) return 0;
  const timeVal = getFuzzyKey(h, ["เวลา", "time"]);
  const minutes = parseHistoryTime(timeVal);
  parsed.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return parsed.getTime();
}

function getHistoryBranch(h) {
  const branch = String(getFuzzyKey(h, ["สาขา", "branch"]) || '').trim();
  return branch || 'ไม่ระบุสาขา';
}

function isHistoryUsageRecord(h) {
  const type = String(getFuzzyKey(h, ["ประเภท", "col_4"]) || '');
  return isUsageType(type) || isAddType(type);
}

function parseCSVRow(text) {
  let ret = [''], i = 0, s = true;
  for (let l = text.length; i < l; i++) {
    let c = text[i];
    if (s) {
      if (c === '"') s = false;
      else if (c === ',') ret.push('');
      else ret[ret.length - 1] += c;
    } else {
      if (c === '"') {
        if (i + 1 < l && text[i + 1] === '"') { ret[ret.length - 1] += '"'; i++; }
        else s = true;
      } else ret[ret.length - 1] += c;
    }
  }
  return ret.map(str => str.trim());
}

function parseThaiDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  let d, m, y;
  const splitRegex = new RegExp('[-/]');
  const parts = dateStr.includes('T') ? dateStr.split('T')[0].split(splitRegex) : dateStr.split(splitRegex);
  
  if (parts.length === 3) {
      if (dateStr.includes('/')) { d = parseInt(parts[0], 10); m = parseInt(parts[1], 10); y = parseInt(parts[2], 10); } 
      else { y = parseInt(parts[0], 10); m = parseInt(parts[1], 10); d = parseInt(parts[2], 10); }
      if (y < 100) y += 2000; if (y > 2500) y -= 543;
      const date = new Date(y, m - 1, d);
      if (!isNaN(date.getTime())) return date;
  }
  return null;
}

function checkWarranty(dateStr) {
    const procDate = parseThaiDate(dateStr);
    if (!procDate) return null;
    const expireDate = new Date(procDate);
    expireDate.setDate(expireDate.getDate() + 30);
    const today = new Date(); today.setHours(0,0,0,0);
    const diffTime = expireDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { isCovered: daysLeft >= 0, daysLeft, expireDateStr: expireDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) };
}

const fuzzyCache = new WeakMap();

function getFuzzyKey(obj, targetKeys) {
  if (!obj) return undefined;
  let objCache = fuzzyCache.get(obj);
  if (!objCache) { objCache = new Map(); fuzzyCache.set(obj, objCache); }

  const cacheKey = Array.isArray(targetKeys) ? targetKeys.join(',') : targetKeys;
  if (objCache.has(cacheKey)) return objCache.get(cacheKey);

  const targets = Array.isArray(targetKeys) ? targetKeys : [targetKeys];
  let result = undefined;
  
  for (let target of targets) { if (obj[target] !== undefined && obj[target] !== '') { result = obj[target]; break; } }
  if (result === undefined) {
    for (let target of targets) {
      const cleanTarget = target.replace(new RegExp('[\\s\\u200B-\\u200D\\uFEFF]', 'g'), '').toLowerCase();
      const exactKey = Object.keys(obj).find(k => k.replace(new RegExp('[\\s\\u200B-\\u200D\\uFEFF"\'\\r\\n]', 'g'), '').toLowerCase() === cleanTarget);
      if (exactKey && obj[exactKey] !== '') { result = obj[exactKey]; break; }
    }
  }
  if (result === undefined) {
    for (let target of targets) {
      const cleanTarget = target.replace(new RegExp('[\\s\\u200B-\\u200D\\uFEFF]', 'g'), '').toLowerCase();
      if (['ยอด', 'ราคา', 'จำนวน'].includes(cleanTarget)) continue;
      const matchingKeys = Object.keys(obj).filter(k => k.replace(new RegExp('[\\s\\u200B-\\u200D\\uFEFF"\'\\r\\n]', 'g'), '').toLowerCase().includes(cleanTarget));
      for (let mk of matchingKeys) {
          const cleanMK = mk.replace(new RegExp('[\\s\\u200B-\\u200D\\uFEFF"\'\\r\\n]', 'g'), '').toLowerCase();
          
          if (!cleanTarget.includes('ค้าง') && cleanMK.includes('ค้าง')) continue;

          if (['เครดิต', 'วงเงิน', 'เครดิตที่ได้รับ', 'เครดิตที่ได้', 'ยอดเครดิต', 'เครดิตทั้งหมด'].includes(cleanTarget) && (cleanMK.includes('หัก') || cleanMK.includes('ใช้') || cleanMK.includes('เหลือ') || cleanMK.includes('เบิก') || cleanMK.includes('เก่า'))) continue;
          if (['ยอดเบิกดิบ', 'เบิกไปแล้ว', 'ยอดเบิก', 'ใช้เครดิต', 'ยอดสะสมดิบ', 'หักเครดิต'].includes(cleanTarget) && (cleanMK.includes('ได้รับ') || cleanMK.includes('ทั้งหมด') || cleanMK.includes('เหลือ'))) continue;
          if (obj[mk] !== '') { result = obj[mk]; break; }
      }
      if (result !== undefined) break;
    }
  }
  if (result !== undefined && typeof result === 'object' && result !== null) {
      if (result.toDate) result = result.toDate().toISOString(); else if (result.seconds) result = new Date(result.seconds * 1000).toISOString(); else result = JSON.stringify(result);
  }
  objCache.set(cacheKey, result);
  return result;
}

const isMoleHistoryRecord = (h) => String(getFuzzyKey(h, ["ประเภท", "col_4"]) || '').trim().includes('จี้ไฝ');

const isUsageType = (typeStr) => {
    if (!typeStr) return false;
    const clean = String(typeStr).replace(new RegExp('\\s', 'g'), '').toLowerCase();
    if (clean.match(new RegExp('(ซื้อ|อัพ|เพิ่ม|แถม|บวก|เปิด|ใหม่)'))) return false;
    return clean.match(new RegExp('(ใช้|ตัด|หัก|บริการ|treatment|คอส|คอร์ส)')) !== null || clean.includes('เบิก');
};

const isAddType = (typeStr) => {
    if (!typeStr) return false;
    const clean = String(typeStr).replace(new RegExp('\\s', 'g'), '').toLowerCase();
    return clean.match(new RegExp('(อัพ|เพิ่ม|แถม|บวก)')) !== null;
};

const isFreeUsage = (h) => {
    const type = String(getFuzzyKey(h, ["ประเภท", "col_4"]) || '');
    if (!isUsageType(type)) return false;

    const rawStatus = getFuzzyKey(h, ["สถานะ", "col_7", "col_8", "col_9"]);
    const hStatus = String(rawStatus || '').replace(new RegExp('\\s', 'g'), '');
    if (rawStatus !== undefined && hStatus !== 'เรียบร้อย') return true;
    
    return false;
};

const extractHistoryQty = (h) => {
    const rawQty = getFuzzyKey(h, ["จำนวน", "จำนวนที่ใช้", "จำนวนที่ได้", "ตัดคอร์ส", "col_15"]);
    if (rawQty !== undefined && rawQty !== '') {
        const parsed = parseQty(rawQty);
        if (parsed > 0 && parsed <= 500) return parsed;
    }
    return 1;
};

// 🌟 ตัวจัดการแสดงรูปภาพกรณีโหลดไฟล์จากโฮสต์ไม่สำเร็จ (404) ให้สลับไปใช้รูป Line ทันที 🌟
const handleProfileImgError = (e, fallbackUrl) => {
    if (fallbackUrl && !e.target.dataset.fallbackTried) {
        e.target.dataset.fallbackTried = 'true';
        e.target.src = fallbackUrl;
    } else {
        e.target.style.display = 'none';
        if (e.target.nextSibling) {
            e.target.nextSibling.classList.remove('hidden');
            e.target.nextSibling.style.display = ''; 
        }
    }
};

// 🌟 ฟังก์ชันแปลง Path รูปภาพจากระบบเก่าให้เป็น URL จริง 🌟
const parseImageUrl = (rawPath) => {
    if (!rawPath || typeof rawPath !== 'string') return null;
    if (rawPath.startsWith('http')) return rawPath;
    
    // ดักจับ Path ของระบบเก่าที่มีคำว่า "_Images" หรือ ".รูปลูกค้า." หรือมีนามสกุลไฟล์
    if (rawPath.match(/\.(jpeg|jpg|gif|png|webp)$/i) || rawPath.includes('_Images') || rawPath.includes('.รูปลูกค้า.')) {
        const filename = rawPath.split(/[/\\]/).pop(); // ดึงมาแค่ชื่อไฟล์
        return `https://crm.irisnatures.com/uploads/customer_photos/${filename}`;
    }
    return null;
};

// 🌟 ฟังก์ชันดึงรูปภาพแบบคู่ (ได้ทั้งลิงก์ Host และ ลิงก์ Line เพื่อทำ Fallback) 🌟
const getProfilePicData = (b, customersList) => {
    const extract = (obj) => {
        if (!obj) return null;
        let lineUrl = null, hostUrl = null;
        
        // 1. ดึงรูปลูกค้าจาก Line (เพิ่มคำค้นหาให้ครอบคลุม)
        const lineVal = getFuzzyKey(obj, ["linePicture", "lineProfilePic", "pictureUrl", "profileUrl", "รูปจากไลน์", "line_pic", "รูปลูกค้าในไลน์", "รูปโปรไฟล์ไลน์", "line"]);
        if (lineVal && typeof lineVal === 'string' && lineVal.startsWith('http')) lineUrl = lineVal;
        
        // 2. ดึงรูปลูกค้าที่อัปโหลดเข้าโฮสต์
        const hostVal = getFuzzyKey(obj, ["รูปลูกค้า", "รูปโปรไฟล์", "customerPhoto", "photo"]);
        const parsedHost = parseImageUrl(hostVal);
        if (parsedHost) {
            if (parsedHost.includes('crm.irisnatures.com')) hostUrl = parsedHost;
            else if (parsedHost.startsWith('http') && !lineUrl) lineUrl = parsedHost;
        }
        
        if (!hostUrl && !lineUrl) return null;
        
        // ส่งคืนทั้งรูปหลัก (Host) และรูปสำรอง (Line)
        return { 
            primary: hostUrl || lineUrl, 
            fallback: (hostUrl && lineUrl) ? lineUrl : null 
        };
    };

    let picData = extract(b);
    if (picData) return picData;

    // ถ้าไม่มีให้ไปค้นหาจากรายชื่อฐานลูกค้าหลัก (Customers) แทน
    if (b.customerPhone && customersList) {
        const cust = customersList.find(c => String(getFuzzyKey(c, ["เบอร์โทร", "col_3"])) === String(b.customerPhone));
        if (cust) return extract(cust);
    }
    return null;
};

const getSafeDateTime = (b) => {
    if (b.dateTime && typeof b.dateTime === 'string' && b.dateTime.includes('T')) {
        const d = new Date(b.dateTime);
        if (!isNaN(d.getTime())) {
             return `${getLocalYYYYMMDD(d)}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }
        return b.dateTime; 
    }
    
    const dateVal = getFuzzyKey(b, ["วันที่", "date", "bookingDate"]);
    const timeVal = getFuzzyKey(b, ["เวลา", "time", "bookingTime"]);

    if (dateVal) {
        const parsedDate = parseThaiDate(dateVal);
        if (parsedDate) {
            const dStr = getLocalYYYYMMDD(parsedDate);
            let tStr = '00:00';
            if (timeVal) {
                const cleanTime = String(timeVal).replace(new RegExp('[^0-9:]', 'g'), '');
                if (cleanTime.includes(':')) {
                    tStr = cleanTime.substring(0, 5);
                } else if (cleanTime.length >= 4) {
                    tStr = `${cleanTime.substring(0, 2)}:${cleanTime.substring(2, 4)}`;
                }
            }
            return `${dStr}T${tStr}`;
        }
    }
    return null;
};

const getBookingStatus = (b) => {
    let st = String(getFuzzyKey(b, ["status", "สถานะ"]) || '').trim();
    if (!st || st.toLowerCase() === 'pending') return 'รอการยืนยัน';
    if (st.toLowerCase() === 'confirmed') return 'ยืนยันแล้ว';
    if (st.toLowerCase() === 'กำลังใช้บริการ' || st.toLowerCase() === 'in_progress') return 'กำลังใช้บริการ';
    if (st.toLowerCase() === 'completed') return 'เสร็จสิ้น';
    if (st.toLowerCase() === 'cancelled' || st.toLowerCase() === 'canceled') return 'ยกเลิก';
    
    if (!['รอการยืนยัน', 'ยืนยันแล้ว', 'กำลังใช้บริการ', 'เสร็จสิ้น', 'ยกเลิก'].includes(st)) {
        return 'รอการยืนยัน'; 
    }
    return st;
};

const getOrderStatus = (o) => {
    let st = String(getFuzzyKey(o, ["status", "สถานะ"]) || '').trim();
    if (!st || st.toLowerCase() === 'pending') return 'รออนุมัติ';
    if (st.toLowerCase() === 'approved') return 'อนุมัติแล้ว';
    if (st.toLowerCase() === 'cancelled' || st.toLowerCase() === 'canceled' || st.toLowerCase() === 'rejected') return 'ยกเลิก';
    
    if (!['รออนุมัติ', 'อนุมัติแล้ว', 'ยกเลิก'].includes(st)) {
        return 'รออนุมัติ';
    }
    return st;
};

// 🌟 COMPONENTS 🌟
const SidebarItem = ({ activeTab, setActiveTab, setSidebarOpen, id, icon: Icon, label, badge }) => (
  <button 
    onClick={() => { setActiveTab(id); if (window.innerWidth < 1024) setSidebarOpen(false); }} 
    className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-300 relative ${activeTab === id ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg scale-[1.02]' : 'text-gray-500 hover:bg-gray-50 font-medium'}`}
  >
    <Icon size={20} className={activeTab === id ? 'text-white' : 'text-gray-400'} />
    <span className="tracking-wide text-left flex-1">{String(label)}</span>
    {badge !== undefined && Number(badge) > 0 && <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md animate-pulse">{Number(badge)}</span>}
  </button>
);

const InputField = ({ label, required, ...props }) => (
  <div>
     <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">{label} {required && <span className="text-red-500">*</span>}</label>
     <input required={required} className={`w-full border-2 border-gray-100 bg-gray-50/50 rounded-xl p-3 outline-none focus:border-blue-400 focus:bg-white transition-all font-medium text-gray-800 ${props.className || ''}`} {...props} />
  </div>
);

const SignaturePad = ({ canvasRef, label }) => {
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      if (!canvas.dataset.isSigned) canvas.dataset.isSigned = "false";
  }, [canvasRef]);

  const startDrawing = (e) => {
      const { offsetX, offsetY } = getCoordinates(e);
      const ctx = canvasRef.current.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY);
      setIsDrawing(true);
      canvasRef.current.dataset.isSigned = "true";
  };

  const draw = (e) => {
      if (!isDrawing) return;
      e.preventDefault(); 
      const { offsetX, offsetY } = getCoordinates(e);
      const ctx = canvasRef.current.getContext('2d');
      ctx.lineTo(offsetX, offsetY);
      ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const getCoordinates = (e) => {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { offsetX: clientX - rect.left, offsetY: clientY - rect.top };
  };

  const clear = (e) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.dataset.isSigned = "false";
  };

  return (
      <div className="relative border-2 border-gray-200 rounded-xl overflow-hidden bg-white shadow-inner touch-none">
          <div className="absolute top-2 left-3 text-[10px] font-bold text-gray-300 pointer-events-none">{label}</div>
          <canvas 
              ref={canvasRef} width={500} height={150} 
              className="w-full h-[150px] cursor-crosshair touch-none"
              onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
              onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
          />
          <button type="button" onClick={clear} className="absolute bottom-2 right-2 text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded-lg font-bold shadow-sm transition-colors z-10">เซ็นใหม่</button>
      </div>
  );
};

const ModalWrapper = ({ isOpen, onClose, title, icon: Icon, colorClass, children, noMaxHeight }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
           <div className={`bg-white w-full max-w-md rounded-[32px] p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 ${noMaxHeight ? '' : 'max-h-[90vh] overflow-y-auto'}`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-gray-800 flex items-center">
                    {Icon && <div className={`p-2 rounded-xl mr-3 ${colorClass}`}><Icon size={20} /></div>}
                    {title}
                </h3>
                <button type="button" onClick={onClose} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100"><X size={20}/></button>
              </div>
              {children}
           </div>
        </div>
    );
};

// ==========================================
// MAIN APP COMPONENT
// ==========================================
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toastMessage, setToastMessage] = useState('');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const [user, setUser] = useState(null);
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [isCloudLoading, setIsCloudLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const [courses, setCourses] = useState([]); 
  const [masterCourses, setMasterCourses] = useState([]); 
  const [customersRaw, setCustomersRaw] = useState([]);
  const [histories, setHistories] = useState([]);
  const [bookings, setBookings] = useState([]); 
  const [orders, setOrders] = useState([]); 
  const [products, setProducts] = useState([]); 
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [courseFilterType, setCourseFilterType] = useState('all');
  const [courseSummaryFilter, setCourseSummaryFilter] = useState('all');
  const [filterCustomerStatus, setFilterCustomerStatus] = useState('all'); 
  const [filterBookingStatus, setFilterBookingStatus] = useState('all'); 
  const [filterBookingBranch, setFilterBookingBranch] = useState('all'); 
  const [filterOrderStatus, setFilterOrderStatus] = useState('รออนุมัติ'); 
  const [bookingViewMode, setBookingViewMode] = useState('timeline');
  const [customerViewMode, setCustomerViewMode] = useState('grid'); 
  const [customerSortBy, setCustomerSortBy] = useState('accumulated');
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerModalTab, setCustomerModalTab] = useState('courses'); 
  
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isPrintSingleCourseMode, setIsPrintSingleCourseMode] = useState(false);
  const [isPrintMultiCourseMode, setIsPrintMultiCourseMode] = useState(false);
  const [isPrintCourseSummaryMode, setIsPrintCourseSummaryMode] = useState(false);
  const [isSelectCoursesToPrintOpen, setIsSelectCoursesToPrintOpen] = useState(false);
  const [selectedCoursesForPrint, setSelectedCoursesForPrint] = useState([]);

  const [bookingTicket, setBookingTicket] = useState(null);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [checkInInput, setCheckInInput] = useState('');

  const [confirmDeleteModal, setConfirmDeleteModal] = useState({ isOpen: false, type: '', data: [] });
  const [deleteProgress, setDeleteProgress] = useState({ isDeleting: false, current: 0, total: 0, type: '' });
  const [actionConfirmModal, setActionConfirmModal] = useState({ isOpen: false, title: '', message: '', action: null, confirmText: 'ยืนยัน', confirmColor: 'bg-indigo-600 hover:bg-indigo-700' });

  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '', issue: '' });
  
  // 🌟 เพิ่มสถานะสำหรับระบบแก้ไขข้อมูลลูกค้า 🌟
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const [editCustomerData, setEditCustomerData] = useState({ id: '', name: '', phone: '', issue: '' });

  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [newCourseForm, setNewCourseForm] = useState({ phone: '', name: '', qty: '1', price: '', credit: '', pending: '0', branch: 'สำนักงานใหญ่' });
  const [bookingCourse, setBookingCourse] = useState(null);
  const [bookingDateTime, setBookingDateTime] = useState('');
  const [bookingCourseBranch, setBookingCourseBranch] = useState('สำนักงานใหญ่');
  const [isGeneralBookingOpen, setIsGeneralBookingOpen] = useState(false);
  const [generalBookingForm, setGeneralBookingForm] = useState({ name: '', phone: '', service: '', dateTime: '', branch: 'สำนักงานใหญ่' });
  const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState({ customerPhone: '', customerName: '', courseName: '', price: '', credit: '', qty: '1', branch: 'สำนักงานใหญ่' });
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProductForm, setNewProductForm] = useState({ code: '', name: '', category: 'IRIS', unit: 'ชิ้น', price: '', memberPrice: '', stock: '0' });

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifToast, setNotifToast] = useState({ show: false, title: '', message: '', type: 'info' });
  const prevPendingCount = useRef(-1);
  const prevBookingsRef = useRef(null);
  const notifTimerRef = useRef(null);

  const triggerToast = (title, message, type = 'info') => {
      setNotifToast({ show: true, title, message, type });
      if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
      notifTimerRef.current = setTimeout(() => {
          setNotifToast(prev => ({ ...prev, show: false }));
      }, 6000);
      
      if (type === 'alert') {
          try {
              const alertAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
              alertAudio.play().catch(e => console.log(e));
          } catch(err) {}
      }
  };

  const [useCourseModal, setUseCourseModal] = useState({ isOpen: false, customer: null, targetCourseId: null });
  const [useCourseData, setUseCourseData] = useState({ staffName: '', photoUrl: null, selections: {}, productSelections: [], branch: 'สำนักงานใหญ่' });
  const custSigRef = useRef(null);
  const staffSigRef = useRef(null);

  const fileInputRefs = { 
    courses: useRef(null), master_courses: useRef(null), customers: useRef(null), histories: useRef(null), products: useRef(null) 
  };

  // 🌟 State สำหรับ Modal จัดการรายการซ้ำ 🌟
  const [duplicateDialog, setDuplicateDialog] = useState({ isOpen: false, newItems: [], duplicateItems: [], typeName: '', onConfirm: null });

  // 🌟 State สำหรับตารางจัดการข้อมูลในหน้า Settings 🌟
  const [settingsSelectedCollection, setSettingsSelectedCollection] = useState('courses');
  const [selectedItems, setSelectedItems] = useState(new Set());

  // 🌟 Helper functions สำหรับตารางจัดการข้อมูล 🌟
  const getCurrentCollectionData = () => {
    switch (settingsSelectedCollection) {
      case 'courses': return courses;
      case 'customers': return customersRaw;
      case 'histories': return histories;
      case 'bookings': return bookings;
      case 'orders': return orders;
      case 'products': return products;
      case 'master_courses': return masterCourses;
      default: return [];
    }
  };

  const getItemDisplayName = (item, type) => {
    switch (type) {
      case 'courses': return String(getFuzzyKey(item, ["ชื่อคอส", "col_8"]) || getFuzzyKey(item, ["ผู้ซื้อคอส", "col_9"]) || '-');
      case 'customers': return String(getFuzzyKey(item, ["ชื่อ", "col_1"]) || '-');
      case 'histories': return String(getFuzzyKey(item, ["ชื่อลูกค้า", "col_2"]) || getFuzzyKey(item, ["รายการ", "สินค้า", "col_18"]) || '-');
      case 'bookings': return String(item.customerName || '-');
      case 'orders': return String(item.customerName || '-');
      case 'products': return String(getFuzzyKey(item, ["ชื่อสินค้า", "col_2"]) || '-');
      case 'master_courses': return String(getFuzzyKey(item, ["ชื่อคอส", "col_4"]) || '-');
      default: return '-';
    }
  };

  const getItemSubInfo = (item, type) => {
    switch (type) {
      case 'courses': return String(getFuzzyKey(item, ["เลขที่ใบคอส", "col_2"]) || '-');
      case 'customers': return String(getFuzzyKey(item, ["เบอร์โทร", "col_3"]) || '-');
      case 'histories': return String(getFuzzyKey(item, ["ประเภท", "col_4"]) || '-');
      case 'bookings': return String(item.customerPhone || '-');
      case 'orders': return String(item.customerPhone || '-') + ' | ' + String(item.courseName || '-');
      case 'products': return String(getFuzzyKey(item, ["รหัส", "col_1"]) || '-');
      case 'master_courses': return String(getFuzzyKey(item, ["รหัสคอส", "col_1"]) || '-');
      default: return '';
    }
  };

  const getItemDate = (item) => {
    const d = getFuzzyKey(item, ["วันที่", "col_1"]) || item.createdAt;
    if (!d) return '-';
    if (typeof d === 'string' && d.includes('T')) return d.split('T')[0];
    return String(d);
  };

  const getItemStatus = (item, type) => {
    switch (type) {
      case 'courses': return getFuzzyKey(item, ["สถานะ"]) || '-';
      case 'customers': return getFuzzyKey(item, ["สถานะสมาชิก", "col_7"]) || '-';
      case 'histories': return getFuzzyKey(item, ["สถานะ", "col_7", "col_8", "col_9"]) || '-';
      case 'bookings': return getBookingStatus(item);
      case 'orders': return getOrderStatus(item);
      case 'products': return `คงเหลือ ${parseQty(getFuzzyKey(item, ["จำนวนคงเหลือ", "col_12"]))}`;
      case 'master_courses': return getFuzzyKey(item, ["ประเภท", "col_2"]) || '-';
      default: return '-';
    }
  };

  // 🌟 ฟังก์ชันสร้าง key สำหรับตรวจสอบซ้ำตามประเภทข้อมูล 🌟
  const getDuplicateKey = (typeName, item) => {
    switch (typeName) {
      case 'courses':
        return String(getFuzzyKey(item, ["เลขที่ใบคอส", "col_2"]) || '').trim().toLowerCase();
      case 'customers':
        return String(getFuzzyKey(item, ["เบอร์โทร", "col_3"]) || '').trim().toLowerCase();
      case 'histories': {
        const orderNo = String(getFuzzyKey(item, ["หมายเลขคำสั่งซื้อ", "เลขที่บิล", "เลขที่", "col_3"]) || '').trim();
        const date = String(getFuzzyKey(item, ["วันที่", "col_1"]) || '').trim();
        const customer = String(getFuzzyKey(item, ["ชื่อลูกค้า", "col_2"]) || '').trim().toLowerCase();
        return `${orderNo}|${date}|${customer}`;
      }
      case 'master_courses':
        return String(getFuzzyKey(item, ["รหัสคอส", "col_1"]) || '').trim().toLowerCase();
      case 'products':
        return String(getFuzzyKey(item, ["รหัส", "col_1"]) || '').trim().toLowerCase();
      default:
        return JSON.stringify(item);
    }
  };

  // 🌟 ฟังก์ชันดึง existing keys จาก state ปัจจุบัน 🌟
  const getExistingKeys = (typeName) => {
    let items = [];
    switch (typeName) {
      case 'courses': items = courses; break;
      case 'customers': items = customersRaw; break;
      case 'histories': items = histories; break;
      case 'master_courses': items = masterCourses; break;
      case 'products': items = products; break;
      default: items = [];
    }
    const keys = new Set();
    items.forEach(item => {
      const key = getDuplicateKey(typeName, item);
      if (key) keys.add(key);
    });
    return keys;
  };

  // 🌟 ฟังก์ชันหา document ID ด้วย Firestore Query (ประหยัดค่าบริการ) 🌟
  const findExistingDocId = async (typeName, item) => {
    const colRef = getCol(typeName);
    let q;
    
    try {
      switch (typeName) {
        case 'courses': {
          const courseNo = String(getFuzzyKey(item, ["เลขที่ใบคอส", "col_2"]) || '').trim();
          if (courseNo) {
            q = query(colRef, where("เลขที่ใบคอส", "==", courseNo));
            const snap = await getDocs(q);
            if (!snap.empty) return snap.docs[0].id;
          }
          break;
        }
        case 'customers': {
          const phone = String(getFuzzyKey(item, ["เบอร์โทร", "col_3"]) || '').trim();
          if (phone) {
            q = query(colRef, where("เบอร์โทร", "==", phone));
            const snap = await getDocs(q);
            if (!snap.empty) return snap.docs[0].id;
          }
          break;
        }
        case 'master_courses': {
          const code = String(getFuzzyKey(item, ["รหัสคอส", "col_1"]) || '').trim();
          if (code) {
            q = query(colRef, where("รหัสคอส", "==", code));
            const snap = await getDocs(q);
            if (!snap.empty) return snap.docs[0].id;
          }
          break;
        }
        case 'products': {
          const code = String(getFuzzyKey(item, ["รหัส", "col_1"]) || '').trim();
          if (code) {
            q = query(colRef, where("รหัส", "==", code));
            const snap = await getDocs(q);
            if (!snap.empty) return snap.docs[0].id;
          }
          break;
        }
        case 'histories': {
          // สำหรับ histories ใช้ orderNo + date + customerName
          const orderNo = String(getFuzzyKey(item, ["หมายเลขคำสั่งซื้อ", "เลขที่บิล", "เลขที่", "col_3"]) || '').trim();
          const date = String(getFuzzyKey(item, ["วันที่", "col_1"]) || '').trim();
          if (orderNo) {
            q = query(colRef, where("หมายเลขคำสั่งซื้อ", "==", orderNo));
            const snap = await getDocs(q);
            if (!snap.empty) {
              // หลังจากได้ results แล้ว กรองเพิ่มเติมด้วย date และ customerName
              const matched = snap.docs.find(d => {
                const dData = d.data();
                const dDate = String(getFuzzyKey(dData, ["วันที่", "col_1"]) || '').trim();
                const dCustomer = String(getFuzzyKey(dData, ["ชื่อลูกค้า", "col_2"]) || '').trim().toLowerCase();
                const itemCustomer = String(getFuzzyKey(item, ["ชื่อลูกค้า", "col_2"]) || '').trim().toLowerCase();
                return dDate === date && dCustomer === itemCustomer;
              });
              if (matched) return matched.id;
              // ถ้าไม่เจอ exact match ใช้ตัวแรก
              return snap.docs[0].id;
            }
          }
          break;
        }
      }
    } catch (err) {
      console.warn('findExistingDocId error:', err);
    }
    return null;
  };

  useEffect(() => {
    if (window.innerWidth >= 1024) setSidebarOpen(true);
    const initAuth = async () => {
      try {
        if (typeof window !== 'undefined' && window.__initial_auth_token) {
          try { await signInWithCustomToken(auth, window.__initial_auth_token); } catch (e) { await signInAnonymously(auth); }
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) { console.error("Auth error:", e); }
    };
    initAuth();
    return onAuthStateChanged(auth, (currentUser) => { setUser(currentUser); setIsDbConnected(!!currentUser); });
  }, []);

  useEffect(() => {
    if (!user) return;
    let loaded = 0;
    const updateProgress = () => { loaded++; setLoadingProgress(Math.round((loaded / 7) * 100)); if (loaded >= 7) setTimeout(() => setIsCloudLoading(false), 500); };
    const errHandler = (err) => { console.error(err); updateProgress(); };

    const unsub1 = onSnapshot(getCol('courses'), (s) => { setCourses(s.docs.map(d => ({ id: d.id, ...d.data() }))); updateProgress(); }, errHandler);
    const unsub2 = onSnapshot(getCol('master_courses'), (s) => { setMasterCourses(s.docs.map(d => ({ id: d.id, ...d.data() }))); updateProgress(); }, errHandler);
    const unsub3 = onSnapshot(getCol('customers'), (s) => { setCustomersRaw(s.docs.map(d => ({ id: d.id, ...d.data() }))); updateProgress(); }, errHandler);
    const unsub4 = onSnapshot(getCol('histories'), (s) => { setHistories(s.docs.map(d => ({ id: d.id, ...d.data() }))); updateProgress(); }, errHandler);
    const unsub5 = onSnapshot(getCol('bookings'), (s) => { setBookings(s.docs.map(d => ({ id: d.id, ...d.data() }))); updateProgress(); }, errHandler);
    const unsub6 = onSnapshot(getCol('orders'), (s) => { setOrders(s.docs.map(d => ({ id: d.id, ...d.data() }))); updateProgress(); }, errHandler);
    const unsub7 = onSnapshot(getCol('products'), (s) => { setProducts(s.docs.map(d => ({ id: d.id, ...d.data() }))); updateProgress(); }, errHandler);

    return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); unsub6(); unsub7(); };
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const handleAfterPrint = () => { 
        setIsPrintMode(false); 
        setIsPrintSingleCourseMode(false); 
        setIsPrintMultiCourseMode(false); 
        setIsPrintCourseSummaryMode(false);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  // --- COMPUTED DATA ---
  const precomputedHistories = useMemo(() => {
    const byCourseRef = {};
    const byCustomer = {}; 
    
    histories.forEach(h => {
        if (h.isCancelled || String(getFuzzyKey(h, ["สถานะ", "col_7", "col_8", "col_9"]) || '') === 'ยกเลิก') return;

        const hRef = String(getFuzzyKey(h, ["เลขที่ใบคอส", "รหัสใบคอส", "อ้างอิง", "col_6"]) || '').replace(new RegExp('\\s', 'g'), '').toLowerCase();
        if (hRef) { if (!byCourseRef[hRef]) byCourseRef[hRef] = []; byCourseRef[hRef].push(h); }
        if (h.courseId) { if (!byCourseRef[h.courseId]) byCourseRef[h.courseId] = []; byCourseRef[h.courseId].push(h); }
        
        const hCust = String(getFuzzyKey(h, ["ชื่อลูกค้า", "col_2"]) || '').replace(new RegExp('\\s', 'g'), '').toLowerCase();
        if (hCust) {
            if (!byCustomer[hCust]) byCustomer[hCust] = [];
            byCustomer[hCust].push(h);
        }
    });
    return { byCourseRef, byCustomer };
  }, [histories]);

  const customers = useMemo(() => {
    const historiesByCustomerName = {};
    histories.forEach(h => {
        if (h.isCancelled || String(getFuzzyKey(h, ["สถานะ", "col_7", "col_8", "col_9"]) || '') === 'ยกเลิก') return;
        const custName = String(getFuzzyKey(h, ["ชื่อลูกค้า", "col_2"]) || '').trim();
        if (custName) { if (!historiesByCustomerName[custName]) historiesByCustomerName[custName] = []; historiesByCustomerName[custName].push(h); }
    });

    return customersRaw.map(c => {
      const oldAmount = parseNumber(getFuzzyKey(c, ["ยอดสะสม", "col_13"]));
      const custName = String(getFuzzyKey(c, ["ชื่อ", "col_1"]) || '').trim();
      const myHistories = historiesByCustomerName[custName] || [];
      
      let historyEarned = 0;
      let historySpent = 0;
      
      myHistories.forEach(h => {
         const type = String(getFuzzyKey(h, ["ประเภท", "col_4"]) || '');
         const amt = parseNumber(getFuzzyKey(h, ["ยอดสินค้า", "ยอดจัดซื้อ", "ยอดเงิน", "ยอด", "col_19"]));
         if (amt > 0) {
             if (type.includes('เบิก') || type.includes('จ่าย') || type.includes('หัก')) {
                 historySpent += amt;
             } else {
                 historyEarned += amt;
             }
         }
      });

      const totalAccumulated = oldAmount + historyEarned - historySpent;
      
      let memberStatus = String(getFuzzyKey(c, ["สถานะสมาชิก", "col_7"]) || '').trim() || 'ทั่วไป';
      if (totalAccumulated >= 5000 && ['ยังไม่สะสมยอด', 'ทั่วไป', 'สะสมยอด', ''].includes(memberStatus)) memberStatus = 'รอบัตร';
      else if (totalAccumulated > 0 && totalAccumulated < 5000 && ['ยังไม่สะสมยอด', 'ทั่วไป', ''].includes(memberStatus)) memberStatus = 'สะสมยอด';
      
      // 🌟 ดึงข้อมูลรูปภาพสำหรับ Customer
      const picData = getProfilePicData(c, null);

      return { 
        ...c, 
        computedName: custName, 
        computedPhone: String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || ''), 
        computedMemberStatus: memberStatus, 
        computedIssue: String(getFuzzyKey(c, ["ปัญหาผิวหน้า", "col_8"]) || ''), 
        realAccumulatedAmount: totalAccumulated, 
        oldAmount, 
        historyEarned, 
        historySpent, 
        myHistories, 
        isApproved: !['ยังไม่สะสมยอด', 'ทั่วไป', 'สะสมยอด', 'รอบัตร'].includes(memberStatus) && memberStatus !== '',
        hasMoleHistory: myHistories.some(isMoleHistoryRecord),
        profilePicData: picData
      };
    });
  }, [customersRaw, histories]);

  const processedCourses = useMemo(() => {
    return courses.map(course => {
      const courseNo = String(getFuzzyKey(course, ["เลขที่ใบคอส", "col_2"]) || '').trim();
      const courseName = String(getFuzzyKey(course, ["ชื่อคอส", "col_8"]) || '').trim();
      const coursePhone = String(getFuzzyKey(course, ["เบอร์โทร", "col_1"]) || '').trim();
      const courseCustomerName = String(getFuzzyKey(course, ["ผู้ซื้อคอส", "ชื่อลูกค้า", "ชื่อ", "col_9"]) || '').trim();

      const cleanCourseNo = courseNo.replace(new RegExp('\\s', 'g'), '').toLowerCase();
      const cleanCourseName = courseName.replace(new RegExp('\\s', 'g'), '').toLowerCase();
      const cleanCustomerName = courseCustomerName.replace(new RegExp('\\s', 'g'), '').toLowerCase();
      
      const exactRefKey = cleanCourseNo + cleanCourseName;

      let myHistories = [];
      const existingIds = new Set();
      
      const addHistories = (hList) => {
          if (!hList) return;
          hList.forEach(h => {
              const id = h.id || JSON.stringify(h);
              if (!existingIds.has(id)) {
                  existingIds.add(id);
                  myHistories.push(h);
              }
          });
      };

      if (course.id) addHistories(precomputedHistories.byCourseRef[course.id]);

      // Match by course ref number: exact match + startsWith scan
      // Legacy histories often store เลขที่ใบคอส concatenated with ชื่อคอส (e.g. "IrisCourse152โปรนาโนไวท์...")
      // The course ref number always appears FIRST in the concatenated string.
      if (cleanCourseNo && cleanCourseNo.length > 2) {
          // Try exact match first (modern histories with clean ref only)
          addHistories(precomputedHistories.byCourseRef[cleanCourseNo]);
          
          // Scan for concatenated legacy refs where key starts with this course number
          // Min length > 4 to avoid false matches on short numbers
          if (cleanCourseNo.length > 4) {
              Object.keys(precomputedHistories.byCourseRef).forEach(key => {
                  if (key.startsWith(cleanCourseNo) && key !== cleanCourseNo) {
                      addHistories(precomputedHistories.byCourseRef[key]);
                  }
              });
          }
      }
      
      // NOTE: Fallback matching by customer name + course name is intentionally removed.
      // It caused cross-course pollution (e.g., IrisCourse570 reporting 138/15 uses).
      // Only courseId and เลขที่ใบคอส (exact + startsWith for concatenated legacy refs) are used.

      myHistories.sort((a, b) => {
         const d1 = parseThaiDate(getFuzzyKey(a, ["วันที่", "col_1"]));
         const d2 = parseThaiDate(getFuzzyKey(b, ["วันที่", "col_1"]));
         if (d1 && d2) return d2.getTime() - d1.getTime();
         return 0;
      });

      let totalAmountLinkedToCourse = 0; 
      myHistories.forEach(h => {
          const type = String(getFuzzyKey(h, ["ประเภท", "col_4"]) || '').trim();
          if (type.match(/(เบิก|หัก|จ่าย)/)) { 
              const amt = parseNumber(getFuzzyKey(h, ["ยอดสินค้า", "ยอดจัดซื้อ", "ยอดเงิน", "ยอดรวม", "ยอดเบิก", "ยอดหัก", "จำนวนเงิน", "ราคา", "ยอดหักเครดิต", "col_19"]));
              if (amt > 0) totalAmountLinkedToCourse += amt;
          }
      });

      const total = parseQty(getFuzzyKey(course, ["จำนวนครั้งที่ได้", "จำนวนรวม", "col_10"])) || 1;

      const oldUsedRaw = getFuzzyKey(course, ["ครั้งที่ใช้", "รวมใช้งานแล้ว", "ใช้ไป", "จำนวนใช้", "col_5"]);
      const oldRemainingRaw = getFuzzyKey(course, ["ครั้งที่เหลือดิบ", "ครั้งที่เหลือ", "จำนวนครั้งคงเหลือ", "คงเหลือ", "col_4"]);

      let baseUsed = 0;
      if (oldUsedRaw !== undefined && oldUsedRaw !== '') {
          baseUsed = parseQty(oldUsedRaw);
      } else if (oldRemainingRaw !== undefined && oldRemainingRaw !== '') {
          baseUsed = Math.max(0, total - parseQty(oldRemainingRaw));
      }

      let newSystemUsed = 0;
      let newSystemAdded = 0;
      myHistories.forEach(h => {
          if (!isMoleHistoryRecord(h)) {
              const type = String(getFuzzyKey(h, ["ประเภท", "col_4"]) || '');
              
              if (isUsageType(type)) {
                  if (!isFreeUsage(h)) {
                      const isLegacy = !h.courseId;
                      const hasValidSigs = h.customerSignature?.length > 2000 && h.staffSignature?.length > 2000;
                      
                      if (isLegacy || hasValidSigs) {
                          const rawQty = getFuzzyKey(h, ["จำนวน", "จำนวนที่ใช้", "ตัดคอร์ส", "col_15"]);
                          const qty = extractHistoryQty(h); 
                          if (!(type.includes('เบิก') && (rawQty === undefined || rawQty === ''))) {
                              newSystemUsed += qty;
                          }
                      }
                  }
              } 
              else if (isAddType(type)) {
                  const qty = extractHistoryQty(h); 
                  newSystemAdded += qty;
              }
          }
      });

      const currentTotal = total + newSystemAdded;
      // Cap used qty to never exceed total (prevents inflated counts from matching errors)
      const finalUsed = Math.min(currentTotal, baseUsed + newSystemUsed);
      let remaining = Math.max(0, currentTotal - finalUsed);
      
      let status = getFuzzyKey(course, "สถานะ") || "ยังคงเหลือ";
      if (remaining <= 0 && currentTotal > 0) status = "ใช้ครบแล้ว";
      
      let expireStr = getFuzzyKey(course, ["วันหมดอายุ", "expireDate", "วันที่สิ้นสุด"]);
      const purchaseDateStr = getFuzzyKey(course, ["วันที่ซื้อ", "col_3"]);
      let daysLeft = null;
      let isExpiringSoon = false;

      let expireDateObj = parseThaiDate(expireStr);
      if (!expireDateObj && purchaseDateStr) {
          const pDate = parseThaiDate(purchaseDateStr);
          if (pDate) {
              pDate.setFullYear(pDate.getFullYear() + 1); 
              expireDateObj = pDate;
              const exY = pDate.getFullYear() + 543;
              expireStr = `${String(pDate.getDate()).padStart(2, '0')}/${String(pDate.getMonth() + 1).padStart(2, '0')}/${exY}`;
          }
      }
      if (expireDateObj) {
          const today = new Date(); today.setHours(0,0,0,0);
          const diffTime = expireDateObj.getTime() - today.getTime();
          daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (daysLeft <= 30 && daysLeft >= 0) isExpiringSoon = true;
          if (daysLeft < 0 && currentTotal > 0 && remaining > 0) status = "หมดอายุ";
      }

      if (String(getFuzzyKey(course, "สถานะ") || '') === 'หมดอายุ') status = "หมดอายุ";

      const rawExplicitCredit = getFuzzyKey(course, ["เครดิตที่ได้รับ", "เครดิตที่ได้", "เครดิตทั้งหมด", "ยอดเครดิต", "วงเงินคอร์ส", "เครดิต", "วงเงิน", "วงเงินที่ได้รับ", "มูลค่าเครดิต", "col_14"]);
      const coursePrice = parseNumber(getFuzzyKey(course, ["ราคา", "ราคาคอร์ส", "ยอดเต็ม", "ยอดเงิน", "จำนวนเงิน", "ยอดสุทธิ", "ราคาขาย", "col_13"]));
      
      let initialCredit = rawExplicitCredit !== undefined && rawExplicitCredit !== '' ? parseNumber(rawExplicitCredit) : 0;
      
      if (initialCredit === 0 && coursePrice > 0) {
          if (cleanCourseName.includes('เครดิต') || cleanCourseName.includes('วงเงิน') || cleanCourseName.includes('voucher') || cleanCourseName.includes('บัตรกำนัล')) {
              initialCredit = coursePrice;
          }
      }
      
      const courseOldBerq = parseNumber(getFuzzyKey(course, ["ยอดเบิกดิบ", "เบิกไปแล้ว", "ยอดเบิก", "ใช้เครดิต", "หักเครดิต", "col_15"]));
      const courseOldAccum = parseNumber(getFuzzyKey(course, ["ยอดสะสมดิบ", "ยอดสะสม", "col_16"]));
      
      let finalBerqAmount = courseOldBerq + courseOldAccum + totalAmountLinkedToCourse;
      finalBerqAmount = Math.min(initialCredit, finalBerqAmount);

      const remainingCredit = initialCredit - finalBerqAmount; 

      return {
        ...course, 
        courseRefKey: courseNo, 
        myHistories,
        computedTotalQty: currentTotal, 
        computedUsedQty: finalUsed, 
        computedRemainQty: remaining, 
        computedStatus: status, 
        computedTotalCredit: initialCredit, 
        computedUsedCredit: finalBerqAmount, 
        computedRemainCredit: remainingCredit, 
        computedRealPrice: coursePrice,
        computedExpireDate: expireStr || '-', 
        daysLeft, 
        isExpiringSoon
      };
    });
  }, [courses, precomputedHistories, customers]);

  const getCustomerCourses = (phone) => processedCourses.filter(c => String(getFuzzyKey(c, ["เบอร์โทร", "col_1"]) || '') === String(phone || ''));
  const getCustomerCourseUsage = (cust) => (cust?.myHistories || []).filter(h => {
      const type = String(getFuzzyKey(h, ["ประเภท", "col_4"]) || '');
      return (isUsageType(type) || isAddType(type)) && !isMoleHistoryRecord(h);
  });
  const getCustomerProducts = (cust) => (cust?.myHistories || []).filter(h => parseNumber(getFuzzyKey(h, ["ยอดสินค้า", "ยอดจัดซื้อ", "ยอดเงิน", "ยอด", "col_19"])) > 0 || String(getFuzzyKey(h, ["ประเภท", "col_4"]) || '').trim().match(new RegExp('(ยอด|ซื้อ)')));
  
  const getCustomerMoles = (cust) => {
    return (cust?.myHistories || []).filter(isMoleHistoryRecord).sort((a, b) => {
        const dateA = parseThaiDate(getFuzzyKey(a, ["วันที่", "col_1"]));
        const dateB = parseThaiDate(getFuzzyKey(b, ["วันที่", "col_1"]));
        if (dateA && dateB) return dateB.getTime() - dateA.getTime();
        return 0;
    });
  };

  const [masterCourseSearch, setMasterCourseSearch] = useState('');

  const filteredMasterCourses = useMemo(() => {
    return masterCourses.filter(mc => {
        const searchStr = `${String(getFuzzyKey(mc, ["รหัสคอส", "col_1"]) || '')} ${String(getFuzzyKey(mc, ["ชื่อคอส", "col_4"]) || '')} ${String(getFuzzyKey(mc, ["ประเภท", "col_2"]) || '')}`.toLowerCase();
        return masterCourseSearch === '' || searchStr.includes(masterCourseSearch.toLowerCase());
    }).sort((a, b) => String(getFuzzyKey(a, ["รหัสคอส", "col_1"]) || '').localeCompare(String(getFuzzyKey(b, ["รหัสคอส", "col_1"]) || '')));
  }, [masterCourses, masterCourseSearch]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => { 
        const searchStr = `${String(getFuzzyKey(p, ["รหัส", "col_1"]) || '')} ${String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2"]) || '')} ${String(getFuzzyKey(p, ["หมวดสินค้า", "col_4"]) || '')}`.toLowerCase(); 
        return searchTerm === '' || searchStr.includes(searchTerm.toLowerCase()); 
    }).sort((a, b) => String(getFuzzyKey(a, ["รหัส", "col_1"]) || '').localeCompare(String(getFuzzyKey(b, ["รหัส", "col_1"]) || '')));
  }, [products, searchTerm]);

  const sortedOrders = useMemo(() => {
    return orders.filter(o => { 
        const matchSearch = String(o.customerName || '').includes(searchTerm) || String(o.customerPhone || '').includes(searchTerm) || String(o.courseName || '').includes(searchTerm) || String(o.orderNo || '').includes(searchTerm); 
        const st = getOrderStatus(o);
        const matchStatus = filterOrderStatus === 'all' || st === filterOrderStatus; 
        return matchSearch && matchStatus; 
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [orders, searchTerm, filterOrderStatus]);

  const sortedBookings = useMemo(() => {
    return bookings.filter(b => { 
        const matchSearch = String(b.customerName || '').includes(searchTerm) || String(b.customerPhone || '').includes(searchTerm) || String(b.courseName || '').includes(searchTerm); 
        const st = getBookingStatus(b);
        const matchStatus = filterBookingStatus === 'all' || st === filterBookingStatus; 
        const matchBranch = filterBookingBranch === 'all' || String(b.branch || 'สำนักงานใหญ่') === filterBookingBranch;
        return matchSearch && matchStatus && matchBranch; 
    }).sort((a, b) => {
        const da = getSafeDateTime(a) ? new Date(getSafeDateTime(a)) : new Date(0);
        const db = getSafeDateTime(b) ? new Date(getSafeDateTime(b)) : new Date(0);
        return da - db;
    });
  }, [bookings, searchTerm, filterBookingStatus, filterBookingBranch]);

  const bookingBranchStats = useMemo(() => {
      const stats = {};
      bookings.forEach(b => {
          const br = b.branch || 'สำนักงานใหญ่';
          if(!stats[br]) stats[br] = { total: 0, pending: 0, in_progress: 0, completed: 0 };
          stats[br].total++;
          const st = getBookingStatus(b);
          if(st === 'รอการยืนยัน' || st === 'ยืนยันแล้ว') stats[br].pending++;
          if(st === 'กำลังใช้บริการ') stats[br].in_progress++;
          if(st === 'เสร็จสิ้น') stats[br].completed++;
      });
      return stats;
  }, [bookings]);

  const orderStats = useMemo(() => ({ total: orders.length, pending: orders.filter(o => getOrderStatus(o) === 'รออนุมัติ').length, approved: orders.filter(o => getOrderStatus(o) === 'อนุมัติแล้ว').length, rejected: orders.filter(o => getOrderStatus(o) === 'ยกเลิก').length }), [orders]);
  
  const bookingStats = useMemo(() => {
    const todayStr = getLocalYYYYMMDD(); 
    return { 
        total: bookings.length, 
        pending: bookings.filter(b => getBookingStatus(b) === 'รอการยืนยัน').length, 
        confirmed: bookings.filter(b => getBookingStatus(b) === 'ยืนยันแล้ว').length, 
        today: bookings.filter(b => {
            const dt = getSafeDateTime(b);
            return dt && dt.startsWith(todayStr) && getBookingStatus(b) !== 'ยกเลิก';
        }).length 
    };
  }, [bookings]);

  const productStats = useMemo(() => ({ outOfStock: products.filter(p => parseQty(getFuzzyKey(p, ["จำนวนคงเหลือ", "col_12"])) <= 0).length }), [products]);

  const sortedHistories = useMemo(() => {
    return histories.filter(h => {
      const searchStr = `${String(getFuzzyKey(h, ["ชื่อลูกค้า", "col_2"]) || '')} ${String(getFuzzyKey(h, ["ประเภท", "col_4"]) || '')} ${String(getFuzzyKey(h, ["สินค้า", "ชื่อคอส", "รายการ", "col_18", "col_16", "col_23"]) || '')} ${String(getFuzzyKey(h, ["หมายเลขคำสั่งซื้อ", "เลขที่บิล", "เลขที่", "col_3"]) || '')} ${String(getFuzzyKey(h, ["เลขที่ใบคอส", "อ้างอิง", "col_6"]) || '')}`.toLowerCase();
      return searchTerm === '' || searchStr.includes(searchTerm.toLowerCase());
    }).sort((a, b) => {
      const valA = String(getFuzzyKey(a, ["หมายเลขคำสั่งซื้อ", "เลขที่บิล", "เลขที่", "col_3"]) || '');
      const valB = String(getFuzzyKey(b, ["หมายเลขคำสั่งซื้อ", "เลขที่บิล", "เลขที่", "col_3"]) || '');
      const numA = parseNumber(valA.replace(new RegExp('[^0-9]', 'g'), ''));
      const numB = parseNumber(valB.replace(new RegExp('[^0-9]', 'g'), ''));
      if(numA !== numB) return numB - numA;
      return valB.localeCompare(valA);
    });
  }, [histories, searchTerm]);

  const stats = useMemo(() => {
    const activeCoursesList = processedCourses.filter(c => c.computedRemainQty > 0);
    const activeCustomersSet = new Set(activeCoursesList.map(c => String(getFuzzyKey(c, ["เบอร์โทร", "col_1"]) || '')).filter(Boolean));
    return {
      total: processedCourses.length, active: activeCoursesList.length,
      totalCustomers: customers.length, completed: processedCourses.filter(c => c.computedStatus === 'ใช้ครบแล้ว').length,
      expired: processedCourses.filter(c => c.computedStatus === 'หมดอายุ').length, activeCustomers: activeCustomersSet.size
    };
  }, [processedCourses, customers]);

  const courseSummaryStats = useMemo(() => {
    const makeCounts = () => ({ active: 0, completed: 0, expired: 0, total: 0 });
    const ipl = makeCounts();
    const rakrae = makeCounts();
    const longKreung = makeCounts();
    const treatment = makeCounts();
    const general = makeCounts();
    const all = makeCounts();
    
    const seen = new Set(); // track unique course IDs to avoid double counting
    
    processedCourses.forEach(c => {
      const id = c.id || `${String(getFuzzyKey(c, ["เบอร์โทร", "col_1"]) || '')}_${String(getFuzzyKey(c, ["ชื่อคอส", "col_8"]) || '')}`;
      if (seen.has(id)) return;
      seen.add(id);
      
      const name = String(getFuzzyKey(c, ["ชื่อคอส", "col_8"]) || '').trim().toLowerCase();
      const status = c.computedStatus;
      const isActive = status === 'ยังคงเหลือ';
      const isCompleted = status === 'ใช้ครบแล้ว';
      const isExpired = status === 'หมดอายุ';
      
      // Helper to increment counts for a category
      const increment = (obj) => {
        if (isActive) obj.active++;
        else if (isCompleted) obj.completed++;
        else if (isExpired) obj.expired++;
        obj.total++;
      };
      
      increment(all);
      if (name.includes('ipl')) increment(ipl);
      else if (name.includes('รักแร้')) increment(rakrae);
      else if (name.includes('ลงเครื่อง')) increment(longKreung);
      else if (name.includes('รักษา')) increment(treatment);
      else if (!name.includes('ipl') && !name.includes('รักแร้') && !name.includes('ลงเครื่อง') && !name.includes('รักษา')) increment(general);
    });
    
    return { 
      ipl, rakrae, longKreung, treatment, general, all,
      iplRakrae: {
        active: ipl.active + rakrae.active,
        completed: ipl.completed + rakrae.completed,
        expired: ipl.expired + rakrae.expired,
        total: ipl.total + rakrae.total
      }
    };
  }, [processedCourses]);

  const todayUsageByBranch = useMemo(() => {
    const todayStr = getLocalYYYYMMDD();
    const branches = {};
    let totalCount = 0;
    let totalQty = 0;
    let totalAmount = 0;
    histories.forEach(h => {
      if (h.isCancelled || String(getFuzzyKey(h, ["สถานะ", "col_7", "col_8", "col_9"]) || '') === 'ยกเลิก') return;
      if (!isHistoryUsageRecord(h)) return;
      const dateKey = getHistoryDateKey(h);
      if (dateKey !== todayStr) return;
      const branch = getHistoryBranch(h);
      if (!branches[branch]) branches[branch] = { count: 0, qty: 0, amount: 0, items: [] };
      const qty = extractHistoryQty(h);
      const amount = parseNumber(getFuzzyKey(h, ["ยอดสินค้า", "ยอดจัดซื้อ", "ยอดเงิน", "ยอดเบิก", "ยอด", "col_19"]));
      branches[branch].count++;
      branches[branch].qty += qty;
      branches[branch].amount += amount;
      branches[branch].items.push(h);
      totalCount++;
      totalQty += qty;
      totalAmount += amount;
    });
    Object.keys(branches).forEach(br => { branches[br].items.sort((a, b) => getHistorySortTime(b) - getHistorySortTime(a)); });
    return { branches, totalCount, totalQty, totalAmount };
  }, [histories]);

  const filteredCourses = useMemo(() => {
    return processedCourses.filter(c => {
      const courseName = String(getFuzzyKey(c, ["ชื่อคอส", "col_8"]) || '').toLowerCase();
      const customerName = String(getFuzzyKey(c, ["ผู้ซื้อคอส", "col_9"]) || '');
      const courseRef = String(getFuzzyKey(c, ["เลขที่ใบคอส", "col_2"]) || '');
      
      const matchSearch = customerName.includes(searchTerm) || courseRef.includes(searchTerm) || courseName.includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === 'all' || c.computedStatus === filterStatus;
      
      const isTreatment = courseName.includes('รักษา');
      const matchType = courseFilterType === 'all' || (courseFilterType === 'treatment' ? isTreatment : !isTreatment);
      
      // Course summary filter
      let matchSummary = true;
      if (courseSummaryFilter !== 'all') {
        if (courseSummaryFilter === 'ipl-rakrae') {
          matchSummary = courseName.includes('ipl') || courseName.includes('รักแร้');
        } else if (courseSummaryFilter === 'long-kreung') {
          matchSummary = courseName.includes('ลงเครื่อง');
        } else if (courseSummaryFilter === 'treatment') {
          matchSummary = courseName.includes('รักษา');
        } else if (courseSummaryFilter === 'general') {
          matchSummary = !courseName.includes('ipl') && !courseName.includes('รักแร้') && !courseName.includes('ลงเครื่อง') && !courseName.includes('รักษา');
        }
      }
      
      return matchSearch && matchStatus && matchType && matchSummary;
    }).sort((a, b) => parseNumber(String(getFuzzyKey(b, ["เลขที่ใบคอส", "col_2"]) || '').replace(new RegExp('[^0-9]', 'g'), '')) - parseNumber(String(getFuzzyKey(a, ["เลขที่ใบคอส", "col_2"]) || '').replace(new RegExp('[^0-9]', 'g'), '')));
  }, [processedCourses, searchTerm, filterStatus, courseFilterType, courseSummaryFilter]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchSearch = `${c.computedName} ${c.computedPhone}`.includes(searchTerm);
      const matchStatus = filterCustomerStatus === 'all' || (filterCustomerStatus === 'อนุมัติแล้ว (Member)' ? c.isApproved : c.computedMemberStatus === filterCustomerStatus);
      return matchSearch && matchStatus;
    }).sort((a, b) => parseNumber(String(getFuzzyKey(b, ["หมายเลขใบสะสม", "col_11"]) || '').replace(new RegExp('[^0-9]', 'g'), '')) - parseNumber(String(getFuzzyKey(a, ["หมายเลขใบสะสม", "col_11"]) || '').replace(new RegExp('[^0-9]', 'g'), '')));
  }, [customers, searchTerm, filterCustomerStatus]);

  // 🌟 สรุปภาพรวมลูกค้า (Summary Cards) 🌟
  const customerSummaryStats = useMemo(() => {
    const vipCount = customers.filter(c => c.isApproved).length;
    const avgAccumulated = customers.length > 0 ? Math.round(customers.reduce((sum, c) => sum + c.realAccumulatedAmount, 0) / customers.length) : 0;
    const totalCourses = processedCourses.reduce((sum, c) => sum + c.computedRemainQty, 0);
    const topSpender = customers.length > 0 ? customers.reduce((max, c) => c.realAccumulatedAmount > max.realAccumulatedAmount ? c : max, customers[0]) : null;
    return { total: customers.length, vipCount, avgAccumulated, totalCourses, topSpender };
  }, [customers, processedCourses]);

  // 🌟 จัดอันดับลูกค้า (Rankings) 🌟
  const rankedCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchSearch = `${c.computedName} ${c.computedPhone}`.includes(searchTerm);
      const matchStatus = filterCustomerStatus === 'all' || (filterCustomerStatus === 'อนุมัติแล้ว (Member)' ? c.isApproved : c.computedMemberStatus === filterCustomerStatus);
      return matchSearch && matchStatus;
    }).map(c => {
      const custCourses = getCustomerCourses(c.computedPhone);
      const courseCount = custCourses.filter(co => co.computedRemainQty > 0).length;
      const totalCourses = custCourses.length;
       const visitCount = getCustomerCourseUsage(c).length;
       const productValue = (c.myHistories || []).reduce((sum, h) => {
         const type = String(getFuzzyKey(h, ["ประเภท", "col_4"]) || '');
         if (type.includes('เบิก') || type.includes('สินค้า')) {
           return sum + parseNumber(getFuzzyKey(h, ["ยอดสินค้า", "ยอดจัดซื้อ", "ยอดเงิน", "ยอดเบิก", "ยอด", "col_19"]));
         }
         return sum;
       }, 0);
       const totalRemainingQty = custCourses.reduce((sum, co) => sum + (co.computedRemainQty || 0), 0);
       const latestVisitDate = (c.myHistories || []).reduce((latest, h) => {
         const d = parseThaiDate(getFuzzyKey(h, ["วันที่", "col_1"]));
         if (d && (!latest || d > latest)) return d;
         return latest;
       }, null);
       return { ...c, courseCount, totalCourses, visitCount, productValue, totalRemainingQty, latestVisitDate };
     }).sort((a, b) => {
       switch (customerSortBy) {
         case 'courses': return b.totalCourses - a.totalCourses;
         case 'visits': return b.visitCount - a.visitCount;
         case 'productValue': return b.productValue - a.productValue;
         case 'remainingQty': return b.totalRemainingQty - a.totalRemainingQty;
         case 'accumulated':
         default: return b.realAccumulatedAmount - a.realAccumulatedAmount;
       }
    }).slice(0, 50);
  }, [customers, searchTerm, filterCustomerStatus, customerSortBy, processedCourses]);

  // 🌟 ประมวลผลการแจ้งเตือน (Notifications) 🌟
  const { notifications, totalPendingCount } = useMemo(() => {
    const notifs = [];
    let count = 0;
    
    const pendingBookings = bookings.filter(b => getBookingStatus(b) === 'รอการยืนยัน');
    if (pendingBookings.length > 0) {
      notifs.push({ id: 'booking', title: 'คิวนัดหมายใหม่', message: `มีคิวนัดหมายรอการยืนยัน ${pendingBookings.length} รายการ`, icon: Calendar, color: 'text-blue-500', bgColor: 'bg-blue-50', tab: 'bookings' });
      count += pendingBookings.length;
    }
    
    const pendingOrders = orders.filter(o => getOrderStatus(o) === 'รออนุมัติ');
    if (pendingOrders.length > 0) {
      notifs.push({ id: 'order', title: 'คำสั่งซื้อรออนุมัติ', message: `มีคำสั่งซื้อรอตรวจสอบ ${pendingOrders.length} รายการ`, icon: ShoppingCart, color: 'text-amber-500', bgColor: 'bg-amber-50', tab: 'orders' });
      count += pendingOrders.length;
    }
    
    const outOfStock = products.filter(p => parseQty(getFuzzyKey(p, ["จำนวนคงเหลือ", "col_12"])) <= 0);
    if (outOfStock.length > 0) {
      notifs.push({ id: 'product', title: 'สินค้าหมดสต็อก', message: `มีสินค้าหมดสต็อก ${outOfStock.length} รายการ`, icon: Package, color: 'text-red-500', bgColor: 'bg-red-50', tab: 'products' });
      count += outOfStock.length;
    }
    
    const expiringCourses = processedCourses.filter(c => c.isExpiringSoon && c.computedRemainQty > 0);
    if (expiringCourses.length > 0) {
      notifs.push({ id: 'course', title: 'คอร์สใกล้หมดอายุ', message: `มีคอร์สใกล้หมดอายุ ${expiringCourses.length} รายการ`, icon: Clock, color: 'text-orange-500', bgColor: 'bg-orange-50', tab: 'courses' });
      count += expiringCourses.length;
    }

    if (notifs.length === 0) {
      notifs.push({ id: 'system', title: 'ระบบพร้อมใช้งาน', message: 'ไม่มีรายการค้างตรวจสอบในขณะนี้', icon: CheckCircle, color: 'text-emerald-500', bgColor: 'bg-emerald-50', tab: 'dashboard' });
    }
    
    return { notifications: notifs, totalPendingCount: count };
  }, [bookings, orders, products, processedCourses]);

  // 🌟 ตรวจจับความเคลื่อนไหว และการเลื่อน/ยกเลิกคิว (Real-time Watcher) 🌟
  useEffect(() => {
      if (!isDbConnected || isCloudLoading || bookings.length === 0) return;

      if (prevBookingsRef.current === null) {
          prevBookingsRef.current = JSON.parse(JSON.stringify(bookings));
          prevPendingCount.current = totalPendingCount;
          return;
      }

      const prevBookings = prevBookingsRef.current;
      
      bookings.forEach(curr => {
          const prev = prevBookings.find(b => b.id === curr.id);
          if (prev) {
              const prevSt = getBookingStatus(prev);
              const currSt = getBookingStatus(curr);
              const prevDt = getSafeDateTime(prev);
              const currDt = getSafeDateTime(curr);
              
              if (prevSt !== 'ยกเลิก' && currSt === 'ยกเลิก') {
                  triggerToast('❌ คิวถูกยกเลิก!', `คิวนัดหมายของ ${curr.customerName || 'ลูกค้า'} ถูกยกเลิก`, 'alert');
              }
              
              if (prevDt && currDt && prevDt !== currDt) {
                  triggerToast('🗓️ มีการเลื่อนคิว!', `คิวของ ${curr.customerName || 'ลูกค้า'} เลื่อนไปเป็น ${formatDateTimeStr(currDt)}`, 'alert');
              }
          }
      });

      if (totalPendingCount > prevPendingCount.current && prevPendingCount.current !== -1) {
          triggerToast('🔔 แจ้งเตือนคิวใหม่!', `มียอดรอตรวจสอบเพิ่มขึ้น (รวม ${totalPendingCount} รายการ)`, 'alert');
      }

      prevPendingCount.current = totalPendingCount;
      prevBookingsRef.current = JSON.parse(JSON.stringify(bookings));
  }, [bookings, totalPendingCount, isDbConnected, isCloudLoading]);

  // 🌟 ฟังก์ชันเลื่อนไปวันที่ต้องการใน Timeline 🌟
  const jumpToDate = (dateStr) => {
      const target = document.getElementById(`timeline-date-${dateStr}`);
      if (target) {
          const container = document.querySelector('main > .overflow-y-auto');
          if (container) {
              const containerTop = container.getBoundingClientRect().top;
              const targetTop = target.getBoundingClientRect().top;
              container.scrollTo({ top: container.scrollTop + (targetTop - containerTop) - 20, behavior: "smooth" });
          } else {
              target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
      } else {
          showToast('ไม่พบคิวในวันที่เลือก หรือไม่มีการจองในระบบ');
      }
  };

  // 🌟 เลื่อนอัตโนมัติไปวันที่ปัจจุบัน (ทำแค่ครั้งแรกที่เปิด Timeline) 🌟
  const hasScrolledToTimeline = useRef(false);
  useEffect(() => {
      if (activeTab === 'bookings' && bookingViewMode === 'timeline') {
          if (!hasScrolledToTimeline.current && sortedBookings.length > 0) {
              setTimeout(() => {
                  const todayStr = getLocalYYYYMMDD();
                  let targetStr = todayStr;
                  if (!document.getElementById(`timeline-date-${todayStr}`)) {
                      const futureDates = sortedBookings.map(b => {
                          const safeDt = getSafeDateTime(b);
                          return safeDt ? safeDt.split('T')[0] : null;
                      }).filter(d => d && d >= todayStr).sort();
                      if (futureDates.length > 0) targetStr = futureDates[0];
                  }
                  jumpToDate(targetStr);
                  hasScrolledToTimeline.current = true;
              }, 400);
          }
      } else {
          hasScrolledToTimeline.current = false;
      }
  }, [activeTab, bookingViewMode, sortedBookings]);

  // --- ACTIONS ---
  const showToast = (msg) => { setToastMessage(String(msg)); setTimeout(() => setToastMessage(''), 3000); };
  
  // 🌟 ฟังก์ชันอัพโหลดข้อมูลพร้อมตรวจสอบซ้ำ 🌟
  const handleCSVUpload = async (e, typeName) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      let text = evt.target.result.replace(new RegExp('^\\uFEFF'), ''); 
      const lines = text.split(new RegExp('\\r?\\n')).filter(l => l.trim() !== '');
      if (lines.length < 2) return showToast('ไฟล์ CSV ไม่มีข้อมูล');
      const headers = parseCSVRow(lines[0]).map(h => h.replace(new RegExp('^["\']|["\']$', 'g'), '').replace(new RegExp('[\\u200B-\\u200D\\uFEFF]', 'g'), '').trim());
      const parsedData = [];
      for (let i = 1; i < lines.length; i++) {
        const row = parseCSVRow(lines[i]); if (row.every(cell => cell.trim() === '')) continue;
        let obj = {}; headers.forEach((h, j) => { let v = String(row[j] !== undefined ? row[j] : '').replace(new RegExp('^["\']|["\']$', 'g'), '').trim(); if (h) obj[h] = v; obj[`col_${j + 1}`] = v; });
        parsedData.push(obj);
      }

      // 🌟 ตรวจสอบรายการซ้ำ 🌟
      const existingKeys = getExistingKeys(typeName);
      const newItems = [];
      const duplicateItems = [];
      
      parsedData.forEach(item => {
        const key = getDuplicateKey(typeName, item);
        if (key && existingKeys.has(key)) {
          duplicateItems.push(item);
        } else {
          newItems.push(item);
        }
      });

      // 🌟 ถ้ามีรายการซ้ำ แสดง Modal ให้ผู้ใช้เลือก 🌟
      if (duplicateItems.length > 0) {
        setDuplicateDialog({
          isOpen: true,
          newItems,
          duplicateItems,
          typeName,
          onConfirm: async (itemsToUpload, action) => {
            setDuplicateDialog({ isOpen: false, newItems: [], duplicateItems: [], typeName: '', onConfirm: null });
            if (itemsToUpload.length === 0) return showToast('ไม่มีรายการที่จะอัพโหลด');
            
            try {
              const colRef = getCol(typeName);
              const chunkSize = 100;
              let uploadedCount = 0;
              
              for (let i = 0; i < itemsToUpload.length; i += chunkSize) {
                const chunk = itemsToUpload.slice(i, i + chunkSize);
                const batch = writeBatch(db);
                
                if (action === 'update') {
                  // 🌟 อัพเดทรายการเดิม - ใช้ Firestore Query แทนการ Read ทั้งหมด (ประหยัดค่าบริการ) 🌟
                  for (const item of chunk) {
                    const existingDocId = await findExistingDocId(typeName, item);
                    if (existingDocId) {
                      // อัพเดทรายการเดิม
                      batch.update(doc(colRef, existingDocId), item);
                    } else {
                      // ไม่เจอรายการเดิม เพิ่มใหม่
                      batch.set(doc(colRef), item);
                    }
                  }
                } else {
                  // เพิ่มใหม่ (skip duplicates)
                  chunk.forEach(item => batch.set(doc(colRef), item));
                }
                
                await batch.commit();
                uploadedCount += chunk.length;
                await new Promise(r => setTimeout(r, 500));
              }
              
              const actionText = action === 'update' ? 'อัพเดท' : 'เพิ่มใหม่';
              showToast(`✅ ${actionText}สำเร็จ ${uploadedCount} รายการ! (ข้ามซ้ำ ${duplicateItems.length} รายการ)`);
            } catch (err) { showToast(`อัปโหลดล้มเหลว: ${err.message}`); }
          }
        });
      } else {
        // 🌟 ไม่มีรายการซ้ำ อัพโหลดทันที 🌟
        try {
          showToast(`กำลังอัปโหลด ${parsedData.length} รายการ...`);
          const chunkSize = 100; 
          for (let i = 0; i < parsedData.length; i += chunkSize) {
            const chunk = parsedData.slice(i, i + chunkSize); const batch = writeBatch(db); const colRef = getCol(typeName);
            chunk.forEach(item => batch.set(doc(colRef), item));
            await batch.commit(); await new Promise(r => setTimeout(r, 1500));
          }
          showToast(`นำเข้าสำเร็จ ${parsedData.length} รายการ!`);
        } catch (err) { showToast(`อัปโหลดล้มเหลว: ${err.message}`); }
      }
      e.target.value = ''; 
    };
    reader.readAsText(file);
  };

  const executeDeleteData = async () => {
    const { type, data } = confirmDeleteModal;
    const cmap = { 'รายการคอร์สตั้งต้น': 'master_courses', 'ใบคอร์ส': 'courses', 'ลูกค้า': 'customers', 'ประวัติ': 'histories', 'การจองคิว': 'bookings', 'คำสั่งซื้อ': 'orders', 'สินค้า': 'products' };
    const collectionName = cmap[type]; if (!collectionName) return;
    setConfirmDeleteModal({ isOpen: false, type: '', data: [] }); setDeleteProgress({ isDeleting: true, current: 0, total: data.length, type });
    try {
      const chunkSize = 100; let deletedCount = 0;
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize); const batch = writeBatch(db); 
        chunk.forEach(item => { if (item.id) batch.delete(getDocRef(collectionName, item.id)); });
        await batch.commit(); deletedCount += chunk.length; setDeleteProgress(prev => ({ ...prev, current: deletedCount })); await new Promise(r => setTimeout(r, 1500));
      }
      showToast(`ล้างข้อมูล ${type} สำเร็จเรียบร้อยแล้ว!`);
    } catch (err) { showToast(`เกิดข้อผิดพลาดในการลบ: ${err.message}`); } finally { setDeleteProgress({ isDeleting: false, current: 0, total: 0, type: '' }); }
  };

  const handleApproveCustomer = async (c) => { try { await updateDoc(getDocRef('customers', c.id), { "สถานะสมาชิก": "สมาชิกระดับ VIP" }); setSelectedCustomer(prev => ({ ...prev, computedMemberStatus: "สมาชิกระดับ VIP", isApproved: true })); showToast('อนุมัติสิทธิ์ VIP สำเร็จ!'); } catch (err) { showToast('เกิดข้อผิดพลาดในการอนุมัติสิทธิ์'); } };
  const executeDeleteBooking = async (id) => { try { await deleteDoc(getDocRef('bookings', id)); showToast('ลบสำเร็จ'); } catch (err) { showToast('ข้อผิดพลาด: ' + err.message); } };
  
  const updateBookingStatus = async (bookingId, newStatus) => { 
      try { 
          const updates = { status: newStatus };
          const targetBooking = bookings.find(b => b.id === bookingId);
          if(targetBooking) {
              if (newStatus === 'กำลังใช้บริการ' && !targetBooking.serviceStartTime) updates.serviceStartTime = new Date().toISOString();
              if (newStatus === 'เสร็จสิ้น' && !targetBooking.serviceEndTime) updates.serviceEndTime = new Date().toISOString();
          }
          await updateDoc(getDocRef('bookings', bookingId), updates); showToast(`อัปเดตสถานะเป็น "${newStatus}"`); 
      } catch (err) { showToast('ข้อผิดพลาด: ' + err.message); } 
  };
  
  const executeDeleteOrder = async (id) => { try { await deleteDoc(getDocRef('orders', id)); showToast('ลบสำเร็จ'); } catch (err) { showToast('ข้อผิดพลาด: ' + err.message); } };
  const executeDeleteProduct = async (id) => { try { await deleteDoc(getDocRef('products', id)); showToast('ลบสำเร็จ'); } catch (err) { showToast('ข้อผิดพลาด: ' + err.message); } };
  const executeDeleteMasterCourse = async (id) => { try { await deleteDoc(getDocRef('master_courses', id)); showToast('ลบสำเร็จ'); } catch (err) { showToast('ข้อผิดพลาด: ' + err.message); } };

  const handleOpenSelectPrint = () => {
    if (!selectedCustomer) return;
    const custCourses = getCustomerCourses(selectedCustomer.computedPhone);
    if (custCourses.length === 0) return showToast('ไม่พบใบคอร์สสำหรับลูกค้ารายนี้');
    setSelectedCoursesForPrint(custCourses.map(c => c.id)); setIsSelectCoursesToPrintOpen(true);
  };

  // 🌟 เปิดหน้าต่างตัดคอร์ส / เบิกสินค้า 🌟
  const handleOpenUseSession = (course, customerObj = null) => {
    let customerTarget = customerObj || selectedCustomer;
    if (!customerTarget && course) {
        const coursePhone = String(getFuzzyKey(course, ["เบอร์โทร", "col_1"]) || '').trim();
        if (coursePhone) customerTarget = customers.find(c => c.computedPhone === coursePhone);
        if (!customerTarget) customerTarget = { computedName: String(getFuzzyKey(course, ["ผู้ซื้อคอส", "ชื่อลูกค้า", "ชื่อ", "col_9"]) || 'ลูกค้าทั่วไป'), computedPhone: coursePhone };
    }
    if (!customerTarget || !customerTarget.computedPhone) return showToast('ไม่พบข้อมูลลูกค้าที่เชื่อมโยง (โปรดตรวจสอบว่าใบคอร์สมีเบอร์โทรศัพท์)');
    
    let initialSelections = {};
    if (course) { 
        if (course.computedRemainQty <= 0) return showToast('คอร์สนี้ถูกใช้งานครบจำนวนแล้วครับ'); 
        initialSelections[course.id] = 1; 
    }
    
    setUseCourseModal({ isOpen: true, customer: customerTarget, targetCourseId: course?.id || null });
    setUseCourseData({ staffName: '', photoUrl: null, selections: initialSelections, productSelections: [], branch: 'สำนักงานใหญ่' });
  };

  const handleQtyChange = (courseId, delta, maxAllowed) => {
      setUseCourseData(prev => { const current = prev.selections[courseId] || 0; return { ...prev, selections: { ...prev.selections, [courseId]: Math.max(0, Math.min(maxAllowed, current + delta)) } }; });
  };

  const addProductSelection = () => setUseCourseData(prev => ({ ...prev, productSelections: [...(prev.productSelections || []), { id: Date.now(), productId: '', qty: 1 }] }));
  const updateProductSelection = (id, field, value) => setUseCourseData(prev => ({ ...prev, productSelections: prev.productSelections.map(p => p.id === id ? { ...p, [field]: value } : p) }));
  const removeProductSelection = (id) => setUseCourseData(prev => ({ ...prev, productSelections: prev.productSelections.filter(p => p.id !== id) }));

  // 🌟 ส่วนลด VIP ตามแบรนด์สินค้า 🌟
  const VIP_DISCOUNT_MAP = {
    'IRIS': 0.25,      // 25%
    'JENESS': 0.20,    // 20%
    'PUREFRESH': 0.20  // 20%
  };

  const getVipDiscountRate = (product) => {
    const category = String(getFuzzyKey(product, ["หมวดสินค้า", "col_4"]) || '').trim().toUpperCase();
    const unit = String(getFuzzyKey(product, ["หน่วยนับ", "col_7"]) || '').trim().toLowerCase();
    
    // ยกเว้นสินค้าประเภทซอง
    if (unit.includes('ซอง')) return 0;
    
    // ตรวจสอบแบรนด์จากหมวดหมู่
    if (category === 'IRIS' || category.includes('IRIS')) return VIP_DISCOUNT_MAP['IRIS'];
    if (category === 'JENESS' || category.includes('JENESS')) return VIP_DISCOUNT_MAP['JENESS'];
    if (category === 'PUREFRESH' || category.includes('PUREFRESH')) return VIP_DISCOUNT_MAP['PUREFRESH'];
    
    return 0; // ไม่เข้าเงื่อนไข = ไม่ลด
  };

  // 🌟 บันทึกการตัดคอร์ส และ การเบิกสินค้า 🌟
  const submitUseCourse = async (e) => {
    e.preventDefault(); 
    const customer = useCourseModal.customer; 
    const selections = useCourseData.selections;
    const productSelections = useCourseData.productSelections || [];
    
    const selectedCourseIds = Object.keys(selections).filter(id => selections[id] > 0);
    const validProducts = productSelections.filter(p => p.productId && p.qty > 0);
    
    if (selectedCourseIds.length === 0 && validProducts.length === 0) return showToast('กรุณาเลือกคอร์สหรือสินค้า อย่างน้อย 1 รายการเพื่อดำเนินการ');
    if (custSigRef.current?.dataset?.isSigned !== "true" || staffSigRef.current?.dataset?.isSigned !== "true") return showToast('กรุณาให้ลูกค้าและพนักงานเซ็นชื่อให้ครบถ้วนก่อนยืนยัน');
    
    try {
        const custSignatureUrl = custSigRef.current?.toDataURL() || null; 
        const staffSignatureUrl = staffSigRef.current?.toDataURL() || null;
        const batch = writeBatch(db); 
        const activeCourses = getCustomerCourses(customer.computedPhone); 
        const orderRefNo = `Use${Date.now().toString().slice(-6)}`;
        
        // 1. บันทึกประวัติการตัดคอร์ส
        selectedCourseIds.forEach(courseId => {
            const qty = selections[courseId]; 
            const course = activeCourses.find(c => c.id === courseId); 
            if (!course) return;
            batch.set(doc(collection(db, 'histories')), { 
                "วันที่": new Date().toLocaleDateString('th-TH'), 
                "เวลา": new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
                "ชื่อลูกค้า": customer.computedName || String(getFuzzyKey(course, ["ผู้ซื้อคอส", "col_9"]) || ''), 
                "เบอร์โทร": customer.computedPhone || String(getFuzzyKey(course, ["เบอร์โทร", "col_1"]) || ''), 
                "หมายเลขคำสั่งซื้อ": orderRefNo, 
                "ประเภท": "ใช้คอร์ส", 
                "สถานะ": "เรียบร้อย", 
                "เลขที่ใบคอส": String(getFuzzyKey(course, ["เลขที่ใบคอส", "col_2"]) || '').trim(), 
                "รายการ": "ตัดคอร์สผ่านระบบ", 
                "จำนวน": String(qty), 
                "สาขา": String(useCourseData.branch || 'สำนักงานใหญ่'), 
                "courseId": course.id,
                "customerPhoto": useCourseData.photoUrl, 
                "customerSignature": custSignatureUrl, 
                "staffSignature": staffSignatureUrl
            });
        });

        // 2. บันทึกประวัติการเบิกสินค้า (หักเครดิต) พร้อมตัดสต็อก — รวมเป็นรายการเดียว
        const productItems = [];
        let totalProductQty = 0;
        let totalProductValue = 0;
        const linkedCourseId = useCourseModal.targetCourseId || (activeCourses.length > 0 ? activeCourses[0].id : '');
        const linkedCourse = activeCourses.find(c => c.id === linkedCourseId);

        validProducts.forEach(pSelect => {
            const prod = products.find(p => p.id === pSelect.productId);
            if (!prod) return;
            
            const basePrice = parseNumber(getFuzzyKey(prod, ["ราคาสมาชิก", "col_10"])) || parseNumber(getFuzzyKey(prod, ["ราคาขายเต็ม", "ราคา", "col_6"]));
            // 🔥 ส่วนลด VIP ตามแบรนด์สินค้า
            const isVip = customer?.isApproved === true;
            const discountRate = isVip ? getVipDiscountRate(prod) : 0;
            const finalPrice = basePrice * (1 - discountRate);
            const lineValue = finalPrice * pSelect.qty;
            const currentStock = parseQty(getFuzzyKey(prod, ["จำนวนคงเหลือ", "col_12"]));
            
            // ตัดสต็อกสินค้า (แยกทีละสินค้า)
            batch.update(doc(db, 'products', prod.id), {
                "จำนวนคงเหลือ": String(Math.max(0, currentStock - pSelect.qty))
            });

            // เก็บข้อมูลสำหรับรวมเป็นรายการเดียว
            const prodName = String(getFuzzyKey(prod, ["ชื่อสินค้า", "col_2"]));
            productItems.push(`${prodName} x${pSelect.qty}`);
            totalProductQty += pSelect.qty;
            totalProductValue += lineValue;
        });

        // สร้าง history record เดียวรวมทุกสินค้า
        if (totalProductQty > 0) {
            batch.set(doc(collection(db, 'histories')), {
                "วันที่": new Date().toLocaleDateString('th-TH'),
                "เวลา": new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
                "ชื่อลูกค้า": customer.computedName,
                "เบอร์โทร": customer.computedPhone,
                "หมายเลขคำสั่งซื้อ": orderRefNo,
                "ประเภท": "เบิกสินค้า",
                "สถานะ": "เรียบร้อย",
                "รายการ": productItems.join(', '),
                "จำนวนเบิก": String(totalProductQty),
                "ยอดเบิก": String(totalProductValue),
                "courseId": linkedCourseId,
                "เลขที่ใบคอส": linkedCourse ? String(getFuzzyKey(linkedCourse, ["เลขที่ใบคอส", "col_2"])) : '',
                "สาขา": String(useCourseData.branch || 'สำนักงานใหญ่'),
                "customerPhoto": useCourseData.photoUrl,
                "customerSignature": custSignatureUrl,
                "staffSignature": staffSignatureUrl
            });
        }

        await batch.commit();
        showToast('บันทึกการรับบริการ/เบิกสินค้า สำเร็จ!'); 
        setUseCourseModal({ isOpen: false, customer: null, targetCourseId: null });
    } catch (err) { 
        showToast('เกิดข้อผิดพลาดในการทำรายการ: ' + err.message); 
    }
  };

  const handleCapturePhoto = (e) => {
      const file = e.target.files[0]; if (!file) return; const reader = new FileReader();
      reader.onload = (ev) => { const img = new Image(); img.onload = () => { const canvas = document.createElement('canvas'); const scaleSize = 400 / img.width; canvas.width = 400; canvas.height = img.height * scaleSize; canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height); setUseCourseData(prev => ({ ...prev, photoUrl: canvas.toDataURL('image/jpeg', 0.8) })); }; img.src = ev.target.result; };
      reader.readAsDataURL(file);
  };

  const handleRefundCourse = (historyItem) => {
      setActionConfirmModal({ isOpen: true, title: 'ยืนยันการคืนสิทธิ์ (ยกเลิก)', message: `ประวัติการใช้นี้จะถูกยกเลิกและจำนวนครั้งจะถูกคืนกลับไปยังใบคอร์ส แน่ใจหรือไม่?`, confirmText: 'ยืนยันการคืนคอร์ส', confirmColor: 'bg-orange-500 hover:bg-orange-600', action: async () => { try { await updateDoc(getDocRef('histories', historyItem.id), { isCancelled: true, "สถานะ": "ยกเลิก" }); showToast('คืนคอร์สสำเร็จ! ยอดกลับคืนสู่ใบคอร์สแล้ว'); setSelectedCourse(null); } catch (err) { showToast('เกิดข้อผิดพลาดในการคืนคอร์ส: ' + err.message); } } });
  };

  const executeApproveOrder = async (order) => {
    try {
        const cName = customersRaw.find(c => String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '') === String(order.customerPhone || '')) ? String(getFuzzyKey(customersRaw.find(c => String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '') === String(order.customerPhone || '')), ["ชื่อ", "col_1"])) : String(order.customerName || 'ลูกค้าทั่วไป');
        const courseNo = `IC${Date.now().toString().slice(-6)}`;
        await addDoc(getCol('courses'), { "เบอร์โทร": String(order.customerPhone || ''), "เลขที่ใบคอส": courseNo, "วันที่ซื้อ": new Date().toLocaleDateString('th-TH'), "ผู้ซื้อคอส": cName, "ชื่อคอส": String(order.courseName || ''), "สาขาที่ซื้อ": String(order.branch || "สำนักงานใหญ่"), "ราคา": String(order.price || "0"), "เครดิตที่ได้รับ": String(order.credit || order.price || "0"), "จำนวนครั้งที่ได้": String(order.qty || "1"), "ยอดค้างชำระ": "0", "ยอดชำระแล้วทั้งหมด": String(order.price || "0"), "ครั้งที่ใช้": "0", "ครั้งที่เหลือดิบ": String(order.qty || "1"), "สถานะ": "ยังคงเหลือ", "ประเภทการชำระ": "จ่ายเต็ม" });
        await addDoc(getCol('histories'), { "วันที่": new Date().toLocaleDateString('th-TH'), "ชื่อลูกค้า": cName, "เบอร์โทร": String(order.customerPhone || ''), "หมายเลขคำสั่งซื้อ": String(order.orderNo || ''), "ประเภท": "ซื้อคอร์ส", "สถานะ": "เรียบร้อย", "สินค้า": String(order.courseName || ''), "ยอดเงิน": String(order.price || "0"), "สาขา": String(order.branch || "สำนักงานใหญ่"), "อ้างอิง": courseNo });
        await updateDoc(getDocRef('orders', order.id), { status: 'อนุมัติแล้ว' });
        showToast('อนุมัติคำสั่งซื้อ สร้างคอร์ส และเพิ่มยอดสะสมสำเร็จ!');
    } catch (err) { showToast('เกิดข้อผิดพลาด: ' + err.message); }
  };

  const handleOrderStatusChange = async (order, newStatus) => {
    if (newStatus === order.status) return;
    if (newStatus === 'อนุมัติแล้ว') setActionConfirmModal({ isOpen: true, title: 'ยืนยันอนุมัติคอร์ส', message: `ยืนยันการอนุมัติคอร์ส: ${String(order.courseName || '')} ให้กับ ${String(order.customerName || order.customerPhone || '')} ใช่หรือไม่?`, action: () => executeApproveOrder(order), confirmText: 'อนุมัติ (เพิ่มคอร์ส)', confirmColor: 'bg-emerald-500 hover:bg-emerald-600' });
    else { try { await updateDoc(getDocRef('orders', order.id), { status: newStatus }); showToast(`เปลี่ยนสถานะเป็น "${newStatus}"`); } catch (err) { showToast('ข้อผิดพลาด: ' + err.message); } }
  };

  const BRANCHES = ['สำนักงานใหญ่', 'เฉวง', 'ละไม'];

const isSlotTaken = (datetimeInput) => bookings.some(b => getSafeDateTime(b) === datetimeInput && getBookingStatus(b) !== 'ยกเลิก');

  // --- CUSTOMER ACTIONS ---
  const handleAddCustomer = async (e) => { e.preventDefault(); try { await addDoc(getCol('customers'), { "ชื่อ": String(newCustomerForm.name), "เบอร์โทร": String(newCustomerForm.phone), "ปัญหาผิวหน้า": String(newCustomerForm.issue), "หมายเลขใบสะสม": `Irismember${Math.floor(Math.random()*10000)}`, "ยอดสะสม": "0", "สถานะสมาชิก": "ยังไม่สะสมยอด" }); setIsAddCustomerOpen(false); setNewCustomerForm({ name: '', phone: '', issue: '' }); showToast('เพิ่มลูกค้าใหม่สำเร็จ!'); } catch (err) { showToast(`ข้อผิดพลาด: ${err.message}`); } };
  
  const handleEditCustomerSave = async (e) => {
      e.preventDefault();
      try {
          await updateDoc(getDocRef('customers', editCustomerData.id), {
              "ชื่อ": editCustomerData.name,
              "เบอร์โทร": editCustomerData.phone,
              "ปัญหาผิวหน้า": editCustomerData.issue
          });
          setIsEditCustomerOpen(false);
          showToast('แก้ไขข้อมูลลูกค้าสำเร็จ!');
          if (selectedCustomer && selectedCustomer.id === editCustomerData.id) {
              setSelectedCustomer(prev => ({...prev, computedName: editCustomerData.name, computedPhone: editCustomerData.phone, computedIssue: editCustomerData.issue}));
          }
      } catch (err) { showToast(`ข้อผิดพลาด: ${err.message}`); }
  };

  const handleCreateCourse = async (e) => { e.preventDefault(); try { await addDoc(getCol('courses'), { "เบอร์โทร": String(newCourseForm.phone), "เลขที่ใบคอส": `IC${Date.now().toString().slice(-6)}`, "วันที่ซื้อ": new Date().toLocaleDateString('th-TH'), "ผู้ซื้อคอส": customersRaw.find(c => String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '') === String(newCourseForm.phone || '')) ? String(getFuzzyKey(customersRaw.find(c => String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '') === String(newCourseForm.phone || '')), ["ชื่อ", "col_1"])) : 'ลูกค้าทั่วไป', "ชื่อคอส": String(newCourseForm.name), "สาขาที่ซื้อ": String(newCourseForm.branch), "ราคา": String(newCourseForm.price || "0"), "เครดิตที่ได้รับ": String(newCourseForm.credit || newCourseForm.price || "0"), "จำนวนครั้งที่ได้": String(newCourseForm.qty || "1"), "ยอดค้างชำระ": String(newCourseForm.pending || "0"), "ยอดชำระแล้วทั้งหมด": String(parseNumber(newCourseForm.price) - parseNumber(newCourseForm.pending)), "ครั้งที่ใช้": "0", "ครั้งที่เหลือดิบ": String(newCourseForm.qty || "1"), "สถานะ": "ยังคงเหลือ", "ประเภทการชำระ": parseNumber(newCourseForm.pending) > 0 ? "ผ่อนชำระ" : "จ่ายเต็ม" }); setIsAddCourseOpen(false); setNewCourseForm({ phone: '', name: '', qty: '1', price: '', credit: '', pending: '0', branch: 'สำนักงานใหญ่' }); showToast(`เปิดใบคอร์สใหม่สำเร็จ!`); } catch (err) { showToast('ข้อผิดพลาด: ' + err.message); } };
  
  const submitCourseBooking = async (e) => { 
      e.preventDefault(); if (isSlotTaken(bookingDateTime)) return showToast('เวลานี้มีลูกค้าจองคิวไว้แล้ว (คิวเต็ม) กรุณาเลือกเวลาอื่นครับ');
      try { await addDoc(getCol('bookings'), { courseId: String(bookingCourse?.id || ''), courseRef: String(getFuzzyKey(bookingCourse, ["เลขที่ใบคอส", "col_2"]) || ''), courseName: String(getFuzzyKey(bookingCourse, ["ชื่อคอส", "col_8"]) || 'ไม่ระบุคอร์ส'), customerName: String(getFuzzyKey(bookingCourse, ["ผู้ซื้อคอส", "col_9"]) || ''), customerPhone: String(getFuzzyKey(bookingCourse, ["เบอร์โทร", "col_1"]) || ''), dateTime: String(bookingDateTime), branch: String(bookingCourseBranch), status: 'รอการยืนยัน', createdAt: new Date().toISOString() }); setBookingCourse(null); setBookingDateTime(''); setBookingCourseBranch('สำนักงานใหญ่'); showToast('ส่งคำขอจองคิวสำเร็จ'); } catch (err) { showToast('ข้อผิดพลาด: ' + err.message); } 
  };
  
  const submitGeneralBooking = async (e) => { 
      e.preventDefault(); if (isSlotTaken(generalBookingForm.dateTime)) return showToast('เวลานี้มีลูกค้าจองคิวไว้แล้ว (คิวเต็ม) กรุณาเลือกเวลาอื่นครับ');
      try { await addDoc(getCol('bookings'), { courseId: '', courseRef: '', courseName: String(generalBookingForm.service || 'บริการทั่วไป'), customerName: String(generalBookingForm.name), customerPhone: String(generalBookingForm.phone), dateTime: String(generalBookingForm.dateTime), branch: String(generalBookingForm.branch), status: 'รอการยืนยัน', createdAt: new Date().toISOString() }); setIsGeneralBookingOpen(false); setGeneralBookingForm({ name: '', phone: '', service: '', dateTime: '', branch: 'สำนักงานใหญ่' }); showToast('เพิ่มคิวนัดหมายใหม่สำเร็จ'); } catch (err) { showToast('ข้อผิดพลาด: ' + err.message); } 
  };

  const handleCheckInSubmit = async (e) => {
      e.preventDefault(); const todayStr = getLocalYYYYMMDD();
      const found = bookings.find(b => { const dt = getSafeDateTime(b); return (b.customerPhone === checkInInput || b.id === checkInInput) && dt?.startsWith(todayStr) && ['รอการยืนยัน', 'ยืนยันแล้ว'].includes(getBookingStatus(b)); });
      if(found) { await updateBookingStatus(found.id, 'กำลังใช้บริการ'); setCheckInInput(''); setIsCheckInOpen(false); showToast(`เช็คอินสำเร็จ! อัปเดตคิวของ ${found.customerName} เป็น "กำลังใช้บริการ"`); } else showToast('ไม่พบคิวนัดหมายของวันนี้ที่ตรงกับเบอร์โทร/รหัสอ้างอิง หรือเช็คอินไปแล้ว');
  };
  
  const submitCreateOrder = async (e) => { e.preventDefault(); try { await addDoc(getCol('orders'), { ...newOrderForm, orderNo: `OD${Date.now().toString().slice(-6)}`, status: 'รออนุมัติ', createdAt: new Date().toISOString() }); setIsAddOrderOpen(false); setNewOrderForm({ customerPhone: '', customerName: '', courseName: '', price: '', credit: '', qty: '1', branch: 'สำนักงานใหญ่' }); showToast('สร้างคำสั่งซื้อสำเร็จ รออนุมัติ'); } catch (err) { showToast('ข้อผิดพลาด: ' + err.message); } };
  const handleAddProduct = async (e) => { e.preventDefault(); try { await addDoc(getCol('products'), { "รหัส": String(newProductForm.code), "ชื่อสินค้า": String(newProductForm.name), "หมวดสินค้า": String(newProductForm.category), "หน่วยนับ": String(newProductForm.unit), "ราคาขายเต็ม": String(newProductForm.price), "ราคาสมาชิก": String(newProductForm.memberPrice), "จำนวนคงเหลือ": String(newProductForm.stock) }); setIsAddProductOpen(false); setNewProductForm({ code: '', name: '', category: 'IRIS', unit: 'ชิ้น', price: '', memberPrice: '', stock: '0' }); showToast('เพิ่มสินค้าใหม่สำเร็จ'); } catch (err) { showToast('ข้อผิดพลาด: ' + err.message); } };
  const handleImageUpload = async (historyId, field, file) => { if (!file) return; const reader = new FileReader(); reader.onloadend = async () => { try { await updateDoc(getDocRef('histories', historyId), { [field]: reader.result }); showToast('อัปโหลดรูปภาพสำเร็จ'); } catch(e) { showToast('อัปโหลดล้มเหลว: ' + e.message); } }; reader.readAsDataURL(file); };
  const handlePrintView = () => { setIsPrintMode(true); setTimeout(() => window.print(), 500); };

  // 🌟 Reusable History Table Component (แสดงลายเซ็นและยอดเบิกรูปแบบตาราง) 🌟
  const HistoryTable = ({ histories, showActions = false, onRefund }) => {
      if (!histories || histories.length === 0) return (
          <div className="text-center py-12 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
              <HistoryIcon size={32} className="text-gray-300 mb-3" />
              <p className="text-gray-400 font-bold text-sm">ยังไม่มีประวัติการใช้งาน</p>
          </div>
      );

      return (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm bg-white">
              <table className="w-full text-sm text-left border-collapse min-w-[800px]">
                  <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-200">
                          <th className="py-4 px-5 font-black text-gray-500 whitespace-nowrap text-[10px] uppercase tracking-wider w-28">วันที่ / เวลา</th>
                          <th className="py-4 px-5 font-black text-gray-500 text-[10px] uppercase tracking-wider min-w-[220px]">รายการที่ใช้บริการ</th>
                          <th className="py-4 px-5 font-black text-gray-500 text-center whitespace-nowrap text-[10px] uppercase tracking-wider w-36">ยอดเบิก / มูลค่า</th>
                          <th className="py-4 px-5 font-black text-gray-500 text-center whitespace-nowrap text-[10px] uppercase tracking-wider w-40">ลายเซ็นลูกค้า</th>
                          <th className="py-4 px-5 font-black text-gray-500 text-center whitespace-nowrap text-[10px] uppercase tracking-wider w-40">ลายเซ็นพนักงาน</th>
                          {showActions && <th className="py-4 px-5 font-black text-gray-500 text-center whitespace-nowrap text-[10px] uppercase tracking-wider w-24">จัดการ</th>}
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {histories.map((h, i) => {
                          const type = String(getFuzzyKey(h, ["ประเภท", "col_4"]) || '');
                          const isFree = isFreeUsage(h);
                          const isAdd = isAddType(type);
                          const deductValue = parseNumber(getFuzzyKey(h, ["ยอดสินค้า", "ยอดจัดซื้อ", "ยอดเงิน", "ยอดเบิก", "ยอด", "col_19"]));
                          const productQty = String(getFuzzyKey(h, ["จำนวนสินค้าที่เบิก", "จำนวนเบิก", "จำนวนสินค้า"]) || '');

                          const cSig = getFuzzyKey(h, ["ลายเซนต์ลูกค้า", "ลายเซ็นลูกค้า", "ลายเซ็นต์ลูกค้า", "customerSignature", "ลายมือชื่อลูกค้า"]);
                          const sSig = getFuzzyKey(h, ["ลายเซนต์เจ้าหน้าที่", "ลายเซ็นเจ้าหน้าที่", "ลายเซ็นต์เจ้าหน้าที่", "ลายเซนต์พนักงาน", "ลายเซ็นพนักงาน", "staffSignature"]);

                          const parseSig = (sig) => {
                              if(!sig) return null;
                              if(sig.startsWith('http')) return sig;
                              if(sig.startsWith('data:image')) return sig;
                              
                              if(sig.includes('ประวัติการใช้บริการ_Images') || sig.includes('_Images')) {
                                  return `https://crm.irisnatures.com/ประวัติการใช้บริการ_Images/${sig.split(/[/\\]/).pop()}`;
                              }

                              if(sig.match(/\.(jpeg|jpg|gif|png|webp)$/i) || sig.includes('.รูปลูกค้า.') || sig.includes('signature')) {
                                  return `https://crm.irisnatures.com/uploads/customer_photos/${sig.split(/[/\\]/).pop()}`;
                              }
                              return sig;
                          };
                          
                          const cSigParsed = parseSig(cSig);
                          const sSigParsed = parseSig(sSig);
                          const isImg = (s) => s && (s.startsWith('http') || s.startsWith('data:image'));

                          const showRefund = showActions && !(h.isCancelled || String(getFuzzyKey(h, ["สถานะ", "col_7", "col_8", "col_9"]) || '') === 'ยกเลิก') && !isAdd;

                          const VerifiedSig = () => (
                              <div className="flex flex-col items-center justify-center w-full h-full">
                                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mb-1.5 shadow-inner">
                                      <ShieldCheck size={18} className="text-emerald-600" />
                                  </div>
                                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Verified</span>
                              </div>
                          );

                          return (
                              <tr key={i} className="hover:bg-slate-50/80 transition-all duration-200 print:break-inside-avoid group">
                                  <td className="py-4 px-5 align-middle whitespace-nowrap">
                                      <div className="font-mono text-gray-600 text-xs font-bold bg-gray-100/50 inline-block px-2 py-1 rounded-lg border border-gray-100">
                                          {String(getFuzzyKey(h, ["วันที่", "col_1"]) || '-')}
                                      </div>
                                  </td>
                                  <td className="py-4 px-5 align-middle">
                                      <div className="font-black text-gray-800 text-sm mb-2">{String(getFuzzyKey(h, ["รายการ", "สินค้า", "col_23", "col_18"]) || (isAdd ? 'อัพคอร์ส' : 'ตัดคอร์ส'))}</div>
                                      <div className="flex flex-wrap gap-1.5">
                                          {isFree ? (
                                              <span className="text-[10px] bg-rose-50 text-rose-600 px-2.5 py-0.5 rounded-md font-bold border border-rose-100 shadow-sm">ไม่หักยอด</span>
                                          ) : isAdd ? (
                                              <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-md font-bold border border-emerald-100 shadow-sm">+{extractHistoryQty(h)} ครั้ง</span>
                                          ) : (
                                              <span className="text-[10px] bg-white text-gray-600 px-2.5 py-0.5 rounded-md font-bold border border-gray-200 shadow-sm">หัก {extractHistoryQty(h)} ครั้ง</span>
                                          )}
                                      </div>
                                  </td>
                                  <td className="py-4 px-5 align-middle text-center">
                                      {(deductValue > 0 || productQty) ? (
                                          <div className="mx-auto flex flex-col items-center justify-center bg-gradient-to-b from-orange-50 to-orange-100/50 border border-orange-200/60 px-3 py-2 rounded-xl shadow-[0_2px_10px_-3px_rgba(251,146,60,0.2)] w-max min-w-[80px]">
                                              <span className="text-[9px] text-orange-500 font-bold uppercase tracking-wider mb-1">ยอดเบิก</span>
                                              <span className="text-sm font-black text-orange-700 leading-none">
                                                  ฿{deductValue.toLocaleString()}
                                              </span>
                                              {productQty && (
                                                  <span className="text-[10px] font-bold text-orange-500 mt-0.5">
                                                      {productQty} ชิ้น
                                                  </span>
                                              )}
                                          </div>
                                      ) : (
                                          <span className="text-gray-300 font-bold">-</span>
                                      )}
                                  </td>
                                  <td className="py-3 px-5 align-middle text-center">
                                      <div className="bg-gray-50/50 rounded-xl p-2 border border-gray-100 min-h-[70px] w-[130px] mx-auto flex items-center justify-center relative overflow-hidden group-hover:bg-white group-hover:shadow-sm transition-all duration-300">
                                          {cSigParsed ? (
                                              isImg(cSigParsed) ? (
                                                  <>
                                                    <img src={cSigParsed} alt="Customer Sig" className="max-h-12 w-full object-contain mix-blend-multiply" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                                                    <div className="hidden w-full h-full">
                                                        <VerifiedSig />
                                                    </div>
                                                  </>
                                              ) : <VerifiedSig />
                                          ) : <span className="text-gray-300 text-xs font-bold">-</span>}
                                      </div>
                                  </td>
                                  <td className="py-3 px-5 align-middle text-center">
                                      <div className="bg-gray-50/50 rounded-xl p-2 border border-gray-100 min-h-[70px] w-[130px] mx-auto flex items-center justify-center relative overflow-hidden group-hover:bg-white group-hover:shadow-sm transition-all duration-300">
                                          {sSigParsed ? (
                                              isImg(sSigParsed) ? (
                                                  <>
                                                    <img src={sSigParsed} alt="Staff Sig" className="max-h-12 w-full object-contain mix-blend-multiply" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                                                    <div className="hidden w-full h-full">
                                                        <VerifiedSig />
                                                    </div>
                                                  </>
                                              ) : <VerifiedSig />
                                          ) : <span className="text-gray-300 text-xs font-bold">-</span>}
                                      </div>
                                  </td>
                                  {showActions && (
                                      <td className="py-4 px-5 align-middle text-center">
                                          {showRefund && (
                                              <button onClick={() => onRefund(h)} className="text-[10px] font-bold text-orange-600 bg-orange-50 hover:bg-orange-500 hover:text-white border border-orange-200 transition-colors px-3 py-1.5 rounded-lg flex items-center justify-center mx-auto whitespace-nowrap shadow-sm active:scale-95">
                                                  <RefreshCcw size={12} className="mr-1.5"/> คืนสิทธิ์
                                              </button>
                                          )}
                                      </td>
                                  )}
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
      );
  };

  // --- EARLY RETURNS FOR PRINT VIEWS ---
  if (isPrintMultiCourseMode && selectedCustomer) {
    const coursesToRender = getCustomerCourses(selectedCustomer.computedPhone).filter(c => selectedCoursesForPrint.includes(c.id));
    return (
       <div className="bg-gray-100 min-h-screen text-black print:bg-white print:p-0">
           <div className="print:hidden p-4 flex justify-center gap-4 bg-white border-b shadow-sm mb-4 sticky top-0 z-50">
              <button onClick={() => { setIsPrintMultiCourseMode(false); setIsSelectCoursesToPrintOpen(true); }} className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl font-bold">กลับ</button>
              <button onClick={() => window.print()} className="px-6 py-3 bg-teal-600 text-white rounded-xl font-bold flex items-center"><Printer className="mr-2"/> พิมพ์ {coursesToRender.length} ใบ</button>
           </div>
           <div className="p-4 sm:p-8 print:p-0">
               {coursesToRender.map((c, idx) => (
                   <div key={c.id} style={{ pageBreakAfter: idx < coursesToRender.length - 1 ? 'always' : 'auto' }} className="max-w-2xl mx-auto border-2 border-gray-800 p-8 rounded-3xl shadow-sm bg-white mb-8 print:border-0 print:shadow-none print:m-0 print:p-0">
                       <div className="text-center mb-8"><h1 className="text-3xl font-black mb-2">ใบคอร์สรับบริการ</h1><p className="text-gray-500 font-mono">Ref: {c.courseRefKey}</p></div>
                       <div className="grid grid-cols-2 gap-6 mb-8 text-lg">
                           <div className="col-span-2"><p className="text-sm text-gray-500 font-bold mb-1">ชื่อคอร์ส</p><p className="font-black text-xl">{String(getFuzzyKey(c, "ชื่อคอส"))}</p></div>
                           <div><p className="text-sm text-gray-500 font-bold mb-1">ชื่อลูกค้า</p><p className="font-bold">{String(getFuzzyKey(c, "ผู้ซื้อคอส"))}</p></div>
                           <div><p className="text-sm text-gray-500 font-bold mb-1">เบอร์โทรศัพท์</p><p className="font-mono font-bold">{String(getFuzzyKey(c, "เบอร์โทร"))}</p></div>
                       </div>
                       <div className="flex justify-around items-center border border-gray-300 rounded-2xl p-4 mb-8 text-center bg-gray-50">
                           <div><p className="text-xs font-bold text-gray-500 uppercase">ทั้งหมด</p><p className="text-2xl font-black">{c.computedTotalQty}</p></div><div className="w-px h-10 bg-gray-300"></div>
                           <div><p className="text-xs font-bold text-gray-500 uppercase">ใช้ไปแล้ว</p><p className="text-2xl font-black">{c.computedUsedQty}</p></div><div className="w-px h-10 bg-gray-300"></div>
                           <div><p className="text-xs font-bold text-gray-500 uppercase">คงเหลือ</p><p className="text-3xl font-black text-teal-600">{c.computedRemainQty}</p></div>
                       </div>
                       {c.computedTotalCredit > 0 && (
                           <div className="flex justify-around items-center border border-orange-200 rounded-2xl p-4 mb-8 text-center bg-orange-50/50">
                               <div><p className="text-xs font-bold text-orange-600 uppercase">ยอดเครดิตที่ได้รับ</p><p className="text-lg font-black text-orange-800">฿{c.computedTotalCredit.toLocaleString()}</p></div><div className="w-px h-8 bg-orange-200"></div>
                               <div><p className="text-xs font-bold text-orange-600 uppercase">เบิกสินค้าไปแล้ว</p><p className="text-lg font-black text-orange-800">฿{c.computedUsedCredit.toLocaleString()}</p></div><div className="w-px h-8 bg-orange-200"></div>
                               <div><p className="text-xs font-bold text-orange-600 uppercase">เครดิตคงเหลือ</p><p className="text-2xl font-black text-orange-600">฿{c.computedRemainCredit.toLocaleString()}</p></div>
                           </div>
                       )}
                       <div className="mb-8">
                           <h3 className="font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2">ประวัติการใช้งาน</h3>
                           <HistoryTable histories={c.myHistories?.filter(h => !(h.isCancelled || String(getFuzzyKey(h, ["สถานะ", "col_7", "col_8", "col_9"]) || '') === 'ยกเลิก') && (isUsageType(String(getFuzzyKey(h, ["ประเภท", "col_4"]) || '')) || isAddType(String(getFuzzyKey(h, ["ประเภท", "col_4"]) || ''))))} />
                       </div>
                       <div className="text-center text-sm text-gray-400 mt-8 pt-4 border-t border-gray-100"><p>พิมพ์เมื่อ: {new Date().toLocaleString('th-TH')}</p></div>
                   </div>
               ))}
           </div>
       </div>
    );
  }

  if (isPrintMode && selectedCustomer) {
    return (
       <div className="p-8 bg-white min-h-screen text-black print:p-0">
           <div className="print:hidden mb-6 flex gap-4"><button onClick={() => setIsPrintMode(false)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-xl font-bold">กลับ</button><button onClick={() => window.print()} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold">สั่งพิมพ์</button></div>
           <div className="max-w-2xl mx-auto border-2 border-gray-800 p-8 rounded-3xl shadow-sm">
               <div className="text-center mb-8"><h1 className="text-3xl font-black mb-2">บัตรสมาชิก / สะสมยอด</h1><p className="text-gray-500 font-mono">IrisCare Clinic</p></div>
               <div className="grid grid-cols-2 gap-6 mb-8 text-lg">
                   <div><p className="text-sm text-gray-500 font-bold mb-1">ชื่อลูกค้า</p><p className="font-black">{selectedCustomer.computedName}</p></div>
                   <div><p className="text-sm text-gray-500 font-bold mb-1">เบอร์โทรศัพท์</p><p className="font-mono font-bold">{selectedCustomer.computedPhone}</p></div>
                   <div><p className="text-sm text-gray-500 font-bold mb-1">สถานะสมาชิก</p><p className="font-bold">{selectedCustomer.computedMemberStatus}</p></div>
                   <div><p className="text-sm text-gray-500 font-bold mb-1">ปัญหาผิว</p><p className="font-bold">{selectedCustomer.computedIssue}</p></div>
               </div>
               <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl text-center mb-8"><p className="text-gray-500 font-bold mb-2">ยอดสะสมสุทธิ (รวม)</p><p className="text-4xl font-black text-gray-900">฿{selectedCustomer.realAccumulatedAmount?.toLocaleString() || '0'}</p></div>
               <div className="text-center text-sm text-gray-400"><p>พิมพ์เมื่อ: {new Date().toLocaleString('th-TH')}</p></div>
           </div>
       </div>
    );
  }

  if (isPrintSingleCourseMode && selectedCourse) {
    return (
       <div className="p-8 bg-white min-h-screen text-black print:p-0">
           <div className="print:hidden mb-6 flex gap-4"><button onClick={() => setIsPrintSingleCourseMode(false)} className="px-4 py-2 bg-gray-200 rounded-xl font-bold">กลับ</button><button onClick={() => window.print()} className="px-4 py-2 bg-teal-600 text-white rounded-xl font-bold">สั่งพิมพ์</button></div>
           <div className="max-w-2xl mx-auto border-2 border-gray-800 p-8 rounded-3xl shadow-sm">
               <div className="text-center mb-8"><h1 className="text-3xl font-black mb-2">ใบคอร์สรับบริการ</h1><p className="text-gray-500 font-mono">Ref: {selectedCourse.courseRefKey}</p></div>
               <div className="grid grid-cols-2 gap-6 mb-8 text-lg">
                   <div className="col-span-2"><p className="text-sm text-gray-500 font-bold mb-1">ชื่อคอร์ส</p><p className="font-black text-xl">{String(getFuzzyKey(selectedCourse, "ชื่อคอส"))}</p></div>
                   <div><p className="text-sm text-gray-500 font-bold mb-1">ชื่อลูกค้า</p><p className="font-bold">{String(getFuzzyKey(selectedCourse, "ผู้ซื้อคอส"))}</p></div>
                   <div><p className="text-sm text-gray-500 font-bold mb-1">เบอร์โทรศัพท์</p><p className="font-mono font-bold">{String(getFuzzyKey(selectedCourse, "เบอร์โทร"))}</p></div>
               </div>
               <div className="flex justify-around items-center border border-gray-300 rounded-2xl p-4 mb-8 text-center bg-gray-50">
                   <div><p className="text-xs font-bold text-gray-500 uppercase">ทั้งหมด</p><p className="text-2xl font-black">{selectedCourse.computedTotalQty}</p></div><div className="w-px h-10 bg-gray-300"></div>
                   <div><p className="text-xs font-bold text-gray-500 uppercase">ใช้ไปแล้ว</p><p className="text-2xl font-black">{selectedCourse.computedUsedQty}</p></div><div className="w-px h-10 bg-gray-300"></div>
                   <div><p className="text-xs font-bold text-gray-500 uppercase">คงเหลือ</p><p className="text-3xl font-black text-teal-600">{selectedCourse.computedRemainQty}</p></div>
               </div>
               {selectedCourse.computedTotalCredit > 0 && (
                   <div className="flex justify-around items-center border border-orange-200 rounded-2xl p-4 mb-8 text-center bg-orange-50/50">
                       <div><p className="text-xs font-bold text-orange-600 uppercase">ยอดเครดิตที่ได้รับ</p><p className="text-lg font-black text-orange-800">฿{selectedCourse.computedTotalCredit.toLocaleString()}</p></div><div className="w-px h-8 bg-orange-200"></div>
                       <div><p className="text-xs font-bold text-orange-600 uppercase">เบิกสินค้าไปแล้ว</p><p className="text-lg font-black text-orange-800">฿{selectedCourse.computedUsedCredit.toLocaleString()}</p></div><div className="w-px h-8 bg-orange-200"></div>
                       <div><p className="text-xs font-bold text-orange-600 uppercase">เครดิตคงเหลือ</p><p className="text-2xl font-black text-orange-600">฿{selectedCourse.computedRemainCredit.toLocaleString()}</p></div>
                   </div>
               )}
               <div className="mb-8">
                   <h3 className="font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2">ประวัติการใช้งาน</h3>
                   <HistoryTable histories={selectedCourse.myHistories?.filter(h => !(h.isCancelled || String(getFuzzyKey(h, ["สถานะ", "col_7", "col_8", "col_9"]) || '') === 'ยกเลิก') && (isUsageType(String(getFuzzyKey(h, ["ประเภท", "col_4"]) || '')) || isAddType(String(getFuzzyKey(h, ["ประเภท", "col_4"]) || ''))))} />
               </div>
               <div className="text-center text-sm text-gray-400 mt-8 pt-4 border-t border-gray-100"><p>พิมพ์เมื่อ: {new Date().toLocaleString('th-TH')}</p></div>
           </div>
       </div>
    );
  }

  if (isPrintCourseSummaryMode) {
    return (
       <div className="p-8 bg-white min-h-screen text-black print:p-0">
           <div className="print:hidden mb-6 flex gap-4"><button onClick={() => setIsPrintCourseSummaryMode(false)} className="px-4 py-2 bg-gray-200 rounded-xl font-bold">กลับ</button><button onClick={() => window.print()} className="px-4 py-2 bg-teal-600 text-white rounded-xl font-bold flex items-center"><Printer className="mr-2"/> พิมพ์ตาราง</button></div>
           <div className="max-w-5xl mx-auto print:max-w-full print:w-full">
               <div className="text-center mb-6"><h1 className="text-2xl font-black mb-1">รายงานสรุปใบคอร์สและเครดิตคงเหลือ</h1><p className="text-gray-500 text-sm">พิมพ์เมื่อ: {new Date().toLocaleString('th-TH')}</p></div>
               <table className="w-full border-collapse border border-gray-300 text-sm">
                   <thead>
                       <tr className="bg-gray-100">
                           <th className="border border-gray-300 p-2 text-left w-24">Ref.</th><th className="border border-gray-300 p-2 text-left">ชื่อลูกค้า</th><th className="border border-gray-300 p-2 text-left">ชื่อคอร์ส</th><th className="border border-gray-300 p-2 text-center w-16">ทั้งหมด</th><th className="border border-gray-300 p-2 text-center w-16">ใช้ไป</th><th className="border border-gray-300 p-2 text-center w-20">ครั้งคงเหลือ</th><th className="border border-gray-300 p-2 text-center w-24">เครดิตคงเหลือ</th><th className="border border-gray-300 p-2 text-center w-20">สถานะ</th>
                       </tr>
                   </thead>
                   <tbody>
                       {filteredCourses.map((c, i) => (
                           <tr key={i} className="hover:bg-gray-50">
                               <td className="border border-gray-300 p-2 font-mono text-[10px] text-gray-500">{c.courseRefKey}</td><td className="border border-gray-300 p-2 font-bold">{String(getFuzzyKey(c, "ผู้ซื้อคอส"))}</td><td className="border border-gray-300 p-2">{String(getFuzzyKey(c, "ชื่อคอส"))}</td><td className="border border-gray-300 p-2 text-center">{c.computedTotalQty}</td><td className="border border-gray-300 p-2 text-center">{c.computedUsedQty}</td><td className="border border-gray-300 p-2 text-center font-bold text-teal-600">{c.computedRemainQty}</td><td className="border border-gray-300 p-2 text-center font-bold text-orange-600">{c.computedTotalCredit > 0 ? `฿${c.computedRemainCredit.toLocaleString()}` : '-'}</td><td className="border border-gray-300 p-2 text-center text-[10px]">{c.computedStatus}</td>
                           </tr>
                       ))}
                   </tbody>
               </table>
               <div className="mt-4 text-right text-sm font-bold text-gray-600">รวมทั้งหมด: {filteredCourses.length} รายการ</div>
           </div>
       </div>
    );
  }

  const dbInfo = [
    { id: 'master_courses', len: masterCourses.length, icon: Layers, color: 'text-cyan-500', label: 'คอร์สตั้งต้น' },
    { id: 'courses', len: courses.length, icon: FileText, color: 'text-teal-500', label: 'ใบคอร์ส' },
    { id: 'customers', len: customersRaw.length, icon: Users, color: 'text-purple-500', label: 'ลูกค้า' },
    { id: 'histories', len: histories.length, icon: HistoryIcon, color: 'text-rose-500', label: 'ประวัติ' },
    { id: 'bookings', len: bookings.length, icon: Calendar, color: 'text-blue-500', label: 'การจองคิว' },
    { id: 'orders', len: orders.length, icon: ShoppingCart, color: 'text-amber-500', label: 'คำสั่งซื้อ' },
    { id: 'products', len: products.length, icon: Package, color: 'text-orange-500', label: 'สินค้า' },
  ];

  const deleteButtons = [
    { type: 'รายการคอร์สตั้งต้น', data: masterCourses, label: 'ล้างคอร์สตั้งต้น' },
    { type: 'ใบคอร์ส', data: courses, label: 'ล้างใบคอร์ส' },
    { type: 'ลูกค้า', data: customersRaw, label: 'ล้างลูกค้า' },
    { type: 'ประวัติ', data: histories, label: 'ล้างประวัติ' },
    { type: 'การจองคิว', data: bookings, label: 'ล้างการจองคิว' },
    { type: 'คำสั่งซื้อ', data: orders, label: 'ล้างคำสั่งซื้อ' },
    { type: 'สินค้า', data: products, label: 'ล้างสินค้า' },
  ];

  const uploadButtons = [
    { ref: fileInputRefs.products, type: 'products', icon: Package, hover: 'hover:bg-orange-50 hover:text-orange-700', label: 'สินค้า' },
    { ref: fileInputRefs.master_courses, type: 'master_courses', icon: Layers, hover: 'hover:bg-cyan-50 hover:text-cyan-700', label: 'คอร์สโปร' },
    { ref: fileInputRefs.courses, type: 'courses', icon: FileText, hover: 'hover:bg-teal-50 hover:text-teal-700', label: 'ใบคอร์ส' },
    { ref: fileInputRefs.customers, type: 'customers', icon: Users, hover: 'hover:bg-indigo-50 hover:text-indigo-700', label: 'ลูกค้า' },
    { ref: fileInputRefs.histories, type: 'histories', icon: HistoryIcon, hover: 'hover:bg-rose-50 hover:text-rose-700', label: 'ประวัติ' },
  ];

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden font-sans text-gray-900">
      {/* Notifications */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-gray-900/90 text-white px-6 py-3.5 rounded-2xl shadow-2xl z-[100] flex items-center animate-in slide-in-from-bottom-5">
          <CheckCircle size={20} className="text-emerald-400 mr-3" />
          <span className="font-bold text-sm">{toastMessage}</span>
        </div>
      )}
      <div className={`fixed top-6 left-0 right-0 z-[999999] pointer-events-none flex justify-center transition-all duration-500 ease-[cubic-bezier(0.2,1,0.3,1)] ${notifToast.show ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0'}`}>
         <div className={`bg-white border-b-4 ${notifToast.type === 'alert' ? 'border-rose-500 shadow-[0_20px_50px_rgba(244,63,94,0.4)]' : 'border-blue-500 shadow-[0_20px_50px_rgba(59,130,246,0.4)]'} text-gray-800 px-6 py-4 rounded-2xl flex items-center min-w-[340px] max-w-md pointer-events-auto border border-gray-100`}>
             <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 shrink-0 relative ${notifToast.type === 'alert' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}><Bell size={24} className="animate-pulse" /></div>
             <div className="flex-1"><p className={`font-black text-base leading-tight ${notifToast.type === 'alert' ? 'text-rose-600' : 'text-blue-600'}`}>{notifToast.title}</p><p className="text-sm font-bold mt-1 text-gray-700">{notifToast.message}</p></div>
             <button onClick={() => setNotifToast({ show: false, title: '', message: '', type: 'info' })} className="ml-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"><X size={20} /></button>
         </div>
      </div>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-white/95 backdrop-blur-xl border-r border-gray-200 z-40 transition-transform lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-20 flex items-center px-6 border-b border-gray-100">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-teal-500/30"><Sparkles size={20} className="text-white" /></div>
          <div><span className="text-xl font-black tracking-wide block leading-none">IrisCare</span><span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Clinic System</span></div>
        </div>
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} id="dashboard" icon={Home} label="แดชบอร์ด" />
          <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} id="bookings" icon={Calendar} label="ตารางนัดหมาย" badge={bookingStats.pending} />
          <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} id="orders" icon={ShoppingCart} label="คำสั่งซื้อ" badge={orderStats.pending} />
          <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} id="masterCourses" icon={Layers} label="คอร์สโปรโมชั่น" />
          <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} id="products" icon={Package} label="คลังสินค้า" />
          <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} id="courses" icon={FileText} label="ใบคอร์สลูกค้า" />
          <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} id="customers" icon={Users} label="ฐานลูกค้า" />
          <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} id="histories" icon={HistoryIcon} label="ประวัติบริการ" />
          <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} id="settings" icon={Settings} label="ตั้งค่าระบบ" />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen min-w-0 transition-all duration-300 lg:ml-64 relative overflow-hidden">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-4 sm:px-8 z-30 sticky top-0 shrink-0 shadow-sm">
          <div className="flex items-center">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 mr-3 sm:mr-4 rounded-xl text-gray-500 hover:text-teal-600 hover:bg-gray-100 lg:hidden transition-all"><Menu size={20} /></button>
            <h1 className="text-lg sm:text-2xl font-black text-gray-800 tracking-tight flex items-center">
              {activeTab === 'dashboard' && 'แดชบอร์ดสรุปผล'}{activeTab === 'bookings' && 'ตารางนัดหมาย (คิว)'}{activeTab === 'orders' && 'คำสั่งซื้อ / อนุมัติคอร์ส'}{activeTab === 'masterCourses' && 'รายการคอร์สโปรโมชั่น'}{activeTab === 'products' && 'คลังสินค้า'}{activeTab === 'courses' && 'จัดการใบคอร์สลูกค้า'}{activeTab === 'customers' && 'ระบบฐานลูกค้า'}{activeTab === 'histories' && 'ประวัติการใช้บริการ'}{activeTab === 'settings' && 'การตั้งค่าระบบ'}
            </h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4 relative">
            <div className="relative shrink-0">
               <button onClick={() => setIsNotificationOpen(!isNotificationOpen)} className="p-2 relative text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-colors">
                  <Bell size={20} />
                  {totalPendingCount > 0 && (<><span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm z-10"></span><span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-400 rounded-full animate-ping z-0"></span></>)}
               </button>
               {isNotificationOpen && (
                 <>
                   <div className="fixed inset-0 z-40" onClick={() => setIsNotificationOpen(false)}></div>
                   <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                     <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50"><h3 className="font-black text-gray-800">การแจ้งเตือน</h3>{totalPendingCount > 0 && <span className="text-[10px] font-bold bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">{totalPendingCount} รายการ</span>}</div>
                     <div className="max-h-80 overflow-y-auto">
                       {notifications.map(n => {
                         const Icon = n.icon;
                         return (
                           <div key={n.id} onClick={() => { setActiveTab(n.tab); setIsNotificationOpen(false); }} className="p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors flex gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${n.bgColor} ${n.color}`}><Icon size={18} /></div>
                              <div><p className="text-sm font-bold text-gray-800">{n.title}</p><p className="text-xs text-gray-500 mt-0.5">{n.message}</p></div>
                           </div>
                         )
                       })}
                     </div>
                   </div>
                 </>
               )}
            </div>
            <div className={`hidden sm:flex items-center px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold border shadow-sm shrink-0 transition-colors ${isDbConnected ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
               <div className={`w-2 h-2 rounded-full mr-2 ${isDbConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>{isDbConnected ? 'Cloud' : 'Connecting...'}
            </div>
            <div className="flex bg-white/80 shadow-sm rounded-xl p-1.5 border border-gray-100 shrink-0">
               {uploadButtons.map((btn, idx) => {
                 const Icon = btn.icon;
                 return (
                 <React.Fragment key={idx}>
                   <button onClick={() => btn.ref.current?.click()} className={`flex items-center px-3 py-2 rounded-lg text-xs font-bold text-gray-600 transition-colors ${btn.hover}`} title={btn.label}><Icon size={14} className="mr-1.5"/><span className="hidden xl:inline">{btn.label}</span></button>
                   <input type="file" accept=".csv" className="hidden" ref={btn.ref} onChange={(e) => handleCSVUpload(e, btn.type)} />
                   {idx < uploadButtons.length - 1 && <div className="w-px bg-gray-200 mx-1"></div>}
                 </React.Fragment>
               )})}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 w-full relative z-10">
          
          {courses.length === 0 && customersRaw.length === 0 && histories.length === 0 && activeTab !== 'settings' && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-0 flex flex-col items-center justify-center p-6">
               <div className="bg-white p-8 rounded-3xl shadow-xl border border-teal-100 text-center max-w-md animate-pulse">
                  <div className="w-16 h-16 bg-teal-50 text-teal-500 rounded-full flex items-center justify-center mx-auto mb-4"><Upload size={32} /></div>
                  <h3 className="text-lg font-black text-gray-800 mb-2">ฐานข้อมูลว่างเปล่า (เชื่อมต่อ Firebaseแล้ว)</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">กรุณากดปุ่ม <b>"นำเข้า..."</b> ที่มุมขวาบน เพื่ออัปโหลดไฟล์ CSV เข้าสู่ระบบฐานข้อมูลคลาวด์ของคุณครับ</p>
               </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500 pb-10">
              <h2 className="text-lg font-black text-gray-800 flex items-center"><Users className="mr-2 text-indigo-500"/> ลูกค้า & ใบคอร์สรับบริการ</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-5 sm:p-6 rounded-[24px] shadow-lg text-white hover:-translate-y-1 transition-transform"><p className="text-xs font-bold text-indigo-100 uppercase tracking-wider mb-2">ลูกค้าทั้งหมด</p><p className="text-3xl sm:text-4xl font-black">{stats.totalCustomers}</p></div>
                <div className="bg-white p-5 sm:p-6 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow"><p className="text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">ลูกค้ารับบริการ (Active)</p><p className="text-3xl sm:text-4xl font-black text-gray-800">{stats.activeCustomers}</p></div>
                <div className="bg-white p-5 sm:p-6 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow"><p className="text-[11px] sm:text-xs font-bold text-teal-500 uppercase tracking-wider mb-2">ใบคอร์ส (ใช้งานอยู่)</p><p className="text-3xl sm:text-4xl font-black text-teal-700">{stats.active}</p></div>
                <div className="bg-white p-5 sm:p-6 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow"><p className="text-[11px] sm:text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2">ใบคอร์ส (ใช้ครบแล้ว)</p><p className="text-3xl sm:text-4xl font-black text-emerald-700">{stats.completed}</p></div>
              </div>
              <h2 className="text-lg font-black text-gray-800 flex items-center pt-2"><Calendar className="mr-2 text-blue-500"/> นัดหมาย & คำสั่งซื้อ</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-blue-50 p-5 sm:p-6 rounded-[24px] border border-blue-100 shadow-sm hover:shadow-md transition-shadow"><p className="text-[11px] sm:text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">นัดหมายวันนี้</p><p className="text-3xl sm:text-4xl font-black text-blue-700">{bookingStats.today}</p></div>
                <div className="bg-amber-50 p-5 sm:p-6 rounded-[24px] border border-amber-100 shadow-sm hover:shadow-md transition-shadow"><p className="text-[11px] sm:text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">รอการยืนยัน (คิว)</p><p className="text-3xl sm:text-4xl font-black text-amber-700">{bookingStats.pending}</p></div>
                <div className="bg-white p-5 sm:p-6 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow"><p className="text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">คำสั่งซื้อทั้งหมด</p><p className="text-3xl sm:text-4xl font-black text-gray-800">{orderStats.total}</p></div>
                <div className="bg-amber-50 p-5 sm:p-6 rounded-[24px] border border-amber-100 shadow-sm hover:shadow-md transition-shadow"><p className="text-[11px] sm:text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">รออนุมัติ (สั่งซื้อ)</p><p className="text-3xl sm:text-4xl font-black text-amber-700">{orderStats.pending}</p></div>
              </div>
              <h2 className="text-lg font-black text-gray-800 flex items-center pt-2"><Package className="mr-2 text-orange-500"/> คลังสินค้า & คอร์สตั้งต้น</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white p-5 sm:p-6 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow"><p className="text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">สินค้าทั้งหมด</p><p className="text-3xl sm:text-4xl font-black text-gray-800">{products.length}</p></div>
                <div className="bg-red-50 p-5 sm:p-6 rounded-[24px] border border-red-100 shadow-sm hover:shadow-md transition-shadow"><p className="text-[11px] sm:text-xs font-bold text-red-600 uppercase tracking-wider mb-2">สินค้าหมดสต็อก</p><p className="text-3xl sm:text-4xl font-black text-red-700">{productStats.outOfStock}</p></div>
                <div className="bg-white p-5 sm:p-6 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow"><p className="text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">คอร์สโปรโมชั่น</p><p className="text-3xl sm:text-4xl font-black text-gray-800">{masterCourses.length}</p></div>
                <div className="bg-white p-5 sm:p-6 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow"><p className="text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">ประวัติทั้งหมด</p><p className="text-3xl sm:text-4xl font-black text-gray-800">{histories.length}</p></div>
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="flex flex-col h-full space-y-4 max-w-7xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-2">
                    {Object.entries(bookingBranchStats).map(([br, s], idx) => (
                        <div key={idx} className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-400"></div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase mb-2 flex items-center pl-2"><MapPin size={12} className="mr-1 text-blue-400"/> {br}</span>
                            <div className="flex justify-between items-end pl-2">
                                <div><span className="text-2xl font-black text-gray-800">{s.total}</span> <span className="text-[10px] text-gray-400">คิวรวม</span></div>
                                <div className="text-right text-[10px] space-y-0.5">
                                    <div className="text-amber-600 font-bold bg-amber-50 px-1.5 rounded">รอคิว: {s.pending}</div>
                                    <div className="text-purple-600 font-bold bg-purple-50 px-1.5 rounded">กำลังทำ: {s.in_progress}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {Object.keys(bookingBranchStats).length === 0 && (
                        <div className="col-span-full text-center py-4 bg-white rounded-2xl border border-gray-100 text-sm text-gray-400 font-bold">ไม่มีข้อมูลสรุปสาขา</div>
                    )}
                </div>

                <div className="p-4 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col lg:flex-row justify-between items-center gap-4">
                   <div className="flex items-center w-full lg:max-w-xs"><Search size={20} className="text-gray-400 ml-2" /><input type="text" placeholder="ค้นหาชื่อ, เบอร์โทร..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-full mx-2 outline-none text-sm" /></div>
                   <div className="flex flex-wrap gap-2 w-full lg:w-auto justify-end items-center">
                      <select value={filterBookingBranch} onChange={(e) => setFilterBookingBranch(e.target.value)} className="bg-gray-50 rounded-xl px-3 py-2 text-sm font-bold outline-none border border-gray-200">
                          <option value="all">ทุกสาขา</option>
                          {Object.keys(bookingBranchStats).map(br => <option key={br} value={br}>{br}</option>)}
                      </select>
                      
                      <div className="flex bg-gray-100 p-1 rounded-xl shrink-0">
                         <button onClick={() => setBookingViewMode('calendar')} className={`px-3 py-1.5 flex items-center text-xs font-bold rounded-lg transition-colors ${bookingViewMode === 'calendar' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}><CalendarDays size={14} className="mr-1 hidden sm:block"/> ปฏิทิน</button>
                         <button onClick={() => setBookingViewMode('timeline')} className={`px-3 py-1.5 flex items-center text-xs font-bold rounded-lg transition-colors ${bookingViewMode === 'timeline' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}><List size={14} className="mr-1 hidden sm:block"/> ไทม์ไลน์</button>
                         <button onClick={() => setBookingViewMode('cards')} className={`px-3 py-1.5 flex items-center text-xs font-bold rounded-lg transition-colors ${bookingViewMode === 'cards' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}><LayoutGrid size={14} className="mr-1 hidden sm:block"/> การ์ด</button>
                      </div>
                      <select value={filterBookingStatus} onChange={(e) => setFilterBookingStatus(e.target.value)} className="bg-gray-50 rounded-xl px-3 py-2 text-sm font-bold outline-none border border-gray-200 flex-1 sm:w-auto min-w-[120px]"><option value="all">สถานะทั้งหมด</option><option value="รอการยืนยัน">รอการยืนยัน</option><option value="ยืนยันแล้ว">ยืนยันแล้ว</option><option value="กำลังใช้บริการ">กำลังใช้บริการ</option><option value="เสร็จสิ้น">เสร็จสิ้น</option><option value="ยกเลิก">ยกเลิก</option></select>
                      
                      <button onClick={() => setIsCheckInOpen(true)} className="bg-emerald-500 hover:bg-emerald-600 transition-colors text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center shadow-md active:scale-95 shrink-0"><ScanLine size={16} className="mr-1"/> เช็คอิน</button>
                      <button onClick={() => setIsGeneralBookingOpen(true)} className="bg-blue-600 hover:bg-blue-700 transition-colors text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center shadow-md active:scale-95 shrink-0"><Plus size={16} className="mr-1"/> นัดหมาย</button>
                   </div>
                </div>

                {bookingViewMode === 'calendar' && (() => {
                    const startOfMonth = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), 1);
                    const startDayOfWeek = startOfMonth.getDay();
                    const daysInMonth = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 0).getDate();
                    const days = [];
                    for (let i = 0; i < startDayOfWeek; i++) days.push(null);
                    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), i));

                    return (
                    <div className="bg-white border border-gray-200 rounded-3xl p-4 sm:p-6 shadow-sm overflow-hidden mt-4 pb-10">
                        <div className="flex justify-between items-center mb-6">
                            <button onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1))} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeft size={24} className="text-gray-600"/></button>
                            <h3 className="font-black text-xl sm:text-2xl text-blue-900">{currentCalendarDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}</h3>
                            <button onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1))} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronRight size={24} className="text-gray-600"/></button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                            {['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map(d => <div key={d} className="text-center text-xs font-bold text-gray-500 uppercase tracking-wider">{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-1 sm:gap-2">
                            {days.map((d, i) => {
                                if(!d) return <div key={i} className="h-24 sm:h-32 bg-gray-50/50 rounded-xl border border-gray-50 border-dashed"></div>;
                                const dStr = getLocalYYYYMMDD(d);
                                const dayBookings = sortedBookings.filter(b => { const dt = getSafeDateTime(b); return dt && dt.startsWith(dStr); });
                                const isToday = dStr === getLocalYYYYMMDD();
                                
                                return (
                                    <div key={i} className={`h-24 sm:h-32 border ${isToday ? 'border-blue-400 bg-blue-50/30 shadow-inner' : 'border-gray-100'} rounded-xl p-1.5 sm:p-2 overflow-y-auto hide-scrollbar flex flex-col relative group`}>
                                        <span className={`text-[10px] sm:text-xs font-bold mb-1.5 shrink-0 ${isToday ? 'text-blue-600 bg-blue-100 w-6 h-6 rounded-full flex items-center justify-center' : 'text-gray-600 ml-1'}`}>{d.getDate()}</span>
                                        <div className="space-y-1 flex-1">
                                            {dayBookings.map((b, bi) => {
                                                const st = getBookingStatus(b);
                                                const dtSafe = getSafeDateTime(b);
                                                const timeStr = dtSafe ? dtSafe.split('T')[1]?.substring(0,5) : '';
                                                return (
                                                    <div key={bi} onClick={() => setBookingViewMode('cards')} className={`text-[9px] sm:text-[10px] font-bold p-1 sm:p-1.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity border ${st === 'รอการยืนยัน' ? 'bg-amber-50 text-amber-700 border-amber-100' : st === 'ยืนยันแล้ว' ? 'bg-blue-50 text-blue-700 border-blue-100' : st === 'กำลังใช้บริการ' ? 'bg-purple-50 text-purple-700 border-purple-100' : st === 'เสร็จสิ้น' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`} title={`${timeStr} - ${b.customerName}`}>
                                                        <span className="hidden sm:inline mr-1">{timeStr}</span>
                                                        {b.customerName}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    );
                })()}

                {bookingViewMode === 'timeline' && (
                    <div className="pb-10 px-2 sm:px-6 relative mt-4">
                       <div className="flex justify-start sm:justify-center gap-2 mb-8 sticky top-2 z-30">
                           <input type="date" onChange={(e) => { if(e.target.value) jumpToDate(e.target.value); }} className="bg-white/90 backdrop-blur border border-blue-200 text-blue-700 rounded-full px-4 py-2 text-sm font-bold outline-none shadow-md cursor-pointer hover:bg-white transition-all" />
                           <button onClick={() => jumpToDate(getLocalYYYYMMDD())} className="bg-blue-600 text-white hover:bg-blue-700 rounded-full px-5 py-2 text-sm font-bold shadow-md transition-all active:scale-95">กลับไปวันนี้</button>
                       </div>
                       <div className="absolute left-6 sm:left-1/2 top-12 bottom-0 w-1 bg-gradient-to-b from-gray-200 via-blue-200 to-gray-100 transform sm:-translate-x-1/2 rounded-full"></div>
                       {Object.entries(sortedBookings.reduce((acc, b) => {
                           const dt = getSafeDateTime(b); const datePart = dt ? dt.split('T')[0] : 'ไม่ระบุวันที่';
                           if (!acc[datePart]) acc[datePart] = []; acc[datePart].push(b); return acc;
                       }, {})).sort(([dateA], [dateB]) => {
                           if (dateA === 'ไม่ระบุวันที่') return -1; if (dateB === 'ไม่ระบุวันที่') return 1; return new Date(dateA) - new Date(dateB);
                       }).map(([dateStr, items], gIdx) => {
                           const d = new Date(dateStr); const title = isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                           return (
                               <div key={gIdx} id={`timeline-date-${dateStr}`} className="mb-12 relative scroll-mt-24">
                                   <div className="flex justify-start sm:justify-center mb-6 relative z-20 sticky top-20 pt-2">
                                       <div className="bg-blue-100 text-blue-800 border-2 border-blue-200 px-6 py-2.5 rounded-full text-sm font-black shadow-md flex items-center ml-10 sm:ml-0 relative z-10 backdrop-blur-sm bg-blue-100/90">
                                           <Calendar size={18} className="mr-2 text-blue-600"/> {title}
                                       </div>
                                       <div className="absolute left-0 sm:hidden top-1/2 w-4 h-4 bg-white border-4 border-blue-500 rounded-full transform -translate-y-1/2 shadow-sm ml-[18px] z-0"></div>
                                   </div>
                                   <div className="space-y-6">
                                       {items.map((b, idx) => {
                                           const st = getBookingStatus(b); const dtSafe = getSafeDateTime(b);
                                           const isPast = dtSafe ? new Date(dtSafe) < new Date() && st !== 'เสร็จสิ้น' && st !== 'กำลังใช้บริการ' && st !== 'ยกเลิก' : false;
                                           let durationStr = '';
                                           if (b.serviceStartTime && b.serviceEndTime && st === 'เสร็จสิ้น') {
                                               const mins = Math.max(1, Math.round((new Date(b.serviceEndTime) - new Date(b.serviceStartTime)) / 60000));
                                               durationStr = `เวลาบริการ ${mins} นาที`;
                                           }
                                           const isRightSide = st === 'เสร็จสิ้น' || st === 'ยกเลิก';
                                           const picData = getProfilePicData(b, customersRaw);

                                           return (
                                               <div key={b.id || idx} className={`flex flex-col sm:flex-row items-center w-full relative z-10 ${isRightSide ? 'sm:flex-row-reverse' : ''}`}>
                                                   <div className="absolute left-0 sm:left-1/2 w-4 h-4 bg-white border-4 border-gray-300 rounded-full transform sm:-translate-x-1/2 ml-[18px] sm:ml-0 mt-6 sm:mt-0 shadow-sm"></div>
                                                   <div className="w-full sm:w-1/2 flex justify-start sm:justify-end sm:px-10 pl-14 pr-2 mt-2 sm:mt-0 relative group">
                                                        <div className={`hidden sm:block absolute top-1/2 w-10 h-0.5 bg-gray-200 transform -translate-y-1/2 ${isRightSide ? 'left-0' : 'right-0'}`}></div>
                                                        <div className={`bg-white border-2 ${st === 'รอการยืนยัน' ? 'border-amber-200 shadow-amber-100/50' : st === 'ยืนยันแล้ว' ? 'border-blue-200 shadow-blue-100/50' : st === 'กำลังใช้บริการ' ? 'border-purple-300 shadow-purple-100/50 ring-2 ring-purple-100' : st === 'เสร็จสิ้น' ? 'border-emerald-200 shadow-emerald-100/50' : 'border-gray-200'} rounded-[24px] p-5 shadow-md hover:shadow-xl transition-all w-full max-w-md relative overflow-hidden`}>
                                                            <div className={`absolute top-0 left-0 w-1.5 h-full ${st === 'รอการยืนยัน' ? 'bg-amber-400' : st === 'ยืนยันแล้ว' ? 'bg-blue-400' : st === 'กำลังใช้บริการ' ? 'bg-purple-500' : st === 'เสร็จสิ้น' ? 'bg-emerald-400' : 'bg-gray-300'}`}></div>
                                                            <div className="flex justify-between items-start mb-3 pl-2">
                                                                <div className={`font-mono text-sm font-bold ${isPast ? 'text-red-500' : 'text-gray-900'}`}>{dtSafe ? dtSafe.split('T')[1]?.substring(0,5) : ''} น.</div>
                                                                <select value={st} onChange={(e) => updateBookingStatus(b.id, e.target.value)} className={`px-2 py-1 rounded-md text-[10px] font-bold border cursor-pointer outline-none ${st === 'รอการยืนยัน' ? 'bg-amber-50 text-amber-600 border-amber-200' : st === 'ยืนยันแล้ว' ? 'bg-blue-50 text-blue-600 border-blue-200' : st === 'กำลังใช้บริการ' ? 'bg-purple-50 text-purple-600 border-purple-200' : st === 'เสร็จสิ้น' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                                                    <option value="รอการยืนยัน">รอการยืนยัน</option><option value="ยืนยันแล้ว">ยืนยันแล้ว</option><option value="กำลังใช้บริการ">กำลังใช้บริการ</option><option value="เสร็จสิ้น">เสร็จสิ้น</option><option value="ยกเลิก">ยกเลิก</option>
                                                                </select>
                                                            </div>
                                                            <div className="pl-2 mb-3">
                                                                <h4 className="font-black text-blue-700 text-base leading-tight mb-1 line-clamp-2">{String(b.courseName || '-')}</h4>
                                                                <div className="flex items-center text-[10px] text-gray-500 mb-2 font-bold"><MapPin size={10} className="mr-1"/> {String(b.branch || 'สำนักงานใหญ่')}</div>
                                                                <div className="flex items-center mt-3 pt-3 border-t border-gray-50">
                                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mr-3 shrink-0 overflow-hidden border border-gray-200">
                                                                        {picData ? <img src={picData.primary} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => handleProfileImgError(e, picData.fallback, 'block')} /> : null}
                                                                        <Users size={14} className={picData ? "hidden" : ""} />
                                                                    </div>
                                                                    <div><p className="font-bold text-gray-800 text-sm">{String(b.customerName || '-')}</p><p className="font-mono text-xs text-gray-500">{String(b.customerPhone || '-')}</p></div>
                                                                </div>
                                                            </div>
                                                            <div className="flex justify-between gap-2 mt-auto pt-4 border-t border-gray-100 pl-2">
                                                                <button onClick={() => setBookingTicket(b)} className="text-[10px] font-bold text-gray-500 hover:text-blue-600 flex items-center"><QrCode size={14} className="mr-1"/> เปิด QR</button>
                                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button onClick={() => setActionConfirmModal({ isOpen: true, title: 'ลบนัดหมาย', message: 'แน่ใจหรือไม่ที่จะลบรายการนัดหมายนี้?', action: () => executeDeleteBooking(b.id), confirmText: 'ลบ', confirmColor: 'bg-red-600 hover:bg-red-700' })} className="bg-red-50 text-red-500 px-2 py-1.5 rounded-lg text-[10px] font-bold hover:bg-red-100 transition-colors flex items-center"><Trash2 size={12}/></button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="w-full sm:w-1/2 flex justify-start items-center pl-[52px] sm:pl-10 mt-2 sm:mt-0 text-sm font-bold text-gray-400 opacity-60">
                                                        {durationStr && <span className="bg-white border border-gray-200 px-3 py-1 rounded-full shadow-sm text-xs"><Clock size={12} className="inline mr-1"/> {durationStr}</span>}
                                                    </div>
                                               </div>
                                           );
                                       })}
                                   </div>
                               </div>
                           );
                       })}
                       {sortedBookings.length === 0 && <div className="text-center py-20"><Calendar size={64} className="mx-auto text-gray-200 mb-4"/><p className="text-base font-black text-gray-800 mb-1">ไม่พบข้อมูลนัดหมายในไทม์ไลน์</p></div>}
                    </div>
                )}

                {bookingViewMode === 'cards' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pb-10">
                        {sortedBookings.slice(0, 100).map((b, idx) => {
                            const st = getBookingStatus(b);
                            const dtSafe = getSafeDateTime(b);
                            const isPast = dtSafe ? new Date(dtSafe) < new Date() && st !== 'เสร็จสิ้น' && st !== 'ยกเลิก' : false;
                            const picData = getProfilePicData(b, customersRaw);
                            return (
                                <div key={b.id || idx} className="bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm hover:shadow-lg transition-all flex flex-col relative overflow-hidden group">
                                    <div className={`absolute top-0 left-0 w-1.5 h-full ${st === 'รอการยืนยัน' ? 'bg-amber-400' : st === 'ยืนยันแล้ว' ? 'bg-blue-400' : st === 'กำลังใช้บริการ' ? 'bg-purple-500' : st === 'เสร็จสิ้น' ? 'bg-emerald-400' : 'bg-gray-300'}`}></div>
                                    <div className="flex justify-between items-start mb-3 pl-2">
                                        <div className={`font-mono text-sm font-bold ${isPast ? 'text-red-500' : 'text-gray-900'}`}>{formatDateTimeStr(dtSafe)}</div>
                                        <select value={st} onChange={(e) => updateBookingStatus(b.id, e.target.value)} className={`px-2 py-1 rounded-md text-[10px] font-bold border cursor-pointer outline-none ${st === 'รอการยืนยัน' ? 'bg-amber-50 text-amber-600 border-amber-200' : st === 'ยืนยันแล้ว' ? 'bg-blue-50 text-blue-600 border-blue-200' : st === 'กำลังใช้บริการ' ? 'bg-purple-50 text-purple-600 border-purple-200' : st === 'เสร็จสิ้น' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                            <option value="รอการยืนยัน">รอการยืนยัน</option><option value="ยืนยันแล้ว">ยืนยันแล้ว</option><option value="กำลังใช้บริการ">กำลังใช้บริการ</option><option value="เสร็จสิ้น">เสร็จสิ้น</option><option value="ยกเลิก">ยกเลิก</option>
                                        </select>
                                    </div>
                                    <div className="pl-2 mb-4 flex-1">
                                        <h4 className="font-black text-blue-700 text-base leading-tight mb-1 line-clamp-2" title={String(b.courseName || '-')}>{String(b.courseName || '-')}</h4>
                                        <div className="flex items-center text-[10px] text-gray-500 mb-2 font-bold"><MapPin size={10} className="mr-1"/> {String(b.branch || 'สำนักงานใหญ่')}</div>
                                        {b.courseRef && <p className="text-[10px] text-gray-500 mb-2 flex items-center"><FileText size={10} className="mr-1"/>จากใบ: {String(b.courseRef || '-')}</p>}
                                        <div className="flex items-center mt-3 pt-3 border-t border-gray-50">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mr-3 shrink-0 overflow-hidden border border-gray-200">
                                                {picData ? <img src={picData.primary} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => handleProfileImgError(e, picData.fallback, 'block')} /> : null}
                                                <Users size={14} className={picData ? "hidden" : ""} />
                                            </div>
                                            <div><p className="font-bold text-gray-800 text-sm">{String(b.customerName || '-')}</p><p className="font-mono text-xs text-gray-500">{String(b.customerPhone || '-')}</p></div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between gap-2 mt-auto pt-4 border-t border-gray-100 pl-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setBookingTicket(b)} className="text-[10px] font-bold text-gray-500 hover:text-blue-600 flex items-center"><QrCode size={14} className="mr-1"/> เปิด QR</button>
                                        <button onClick={() => setActionConfirmModal({ isOpen: true, title: 'ลบนัดหมาย', message: 'แน่ใจหรือไม่ที่จะลบรายการนัดหมายนี้?', action: () => executeDeleteBooking(b.id), confirmText: 'ลบ', confirmColor: 'bg-red-600 hover:bg-red-700' })} className="flex-1 bg-red-50 text-red-500 py-1.5 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors flex items-center justify-center"><Trash2 size={14} className="mr-1"/> ลบรายการนี้</button>
                                    </div>
                                </div>
                            );
                        })}
                        {sortedBookings.length === 0 && <div className="col-span-full text-center py-20"><Calendar size={64} className="mx-auto text-gray-200 mb-4"/><p className="text-base font-black text-gray-800 mb-1">ไม่พบข้อมูลนัดหมาย</p></div>}
                    </div>
                )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="flex flex-col h-full space-y-4 max-w-7xl mx-auto">
              <div className="p-4 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                 <div className="flex items-center w-full max-w-md"><Search size={20} className="text-gray-400 ml-2" /><input type="text" placeholder="ค้นหาคำสั่งซื้อ..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-full mx-2 outline-none text-sm" /></div>
                 <div className="flex gap-2 w-full sm:w-auto"><select value={filterOrderStatus} onChange={(e) => setFilterOrderStatus(e.target.value)} className="bg-gray-50 rounded-xl px-3 py-2 text-sm font-bold outline-none border border-gray-200 flex-1 sm:w-auto"><option value="all">สถานะทั้งหมด</option><option value="รออนุมัติ">รออนุมัติ</option><option value="อนุมัติแล้ว">อนุมัติแล้ว</option><option value="ยกเลิก">ยกเลิก</option></select><button onClick={() => setIsAddOrderOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 transition-colors text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center shadow-lg active:scale-95 shrink-0"><Plus size={16} className="mr-1"/> สร้างคำสั่งซื้อ</button></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pb-10">
                {sortedOrders.slice(0, 100).map((o, idx) => {
                  const st = getOrderStatus(o);
                  const picData = getProfilePicData({customerPhone: o.customerPhone}, customersRaw);
                  return (
                  <div key={idx} className="bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm hover:shadow-lg transition-all flex flex-col relative overflow-hidden group">
                     <div className={`absolute top-0 left-0 w-1.5 h-full ${st === 'รออนุมัติ' ? 'bg-amber-400' : st === 'อนุมัติแล้ว' ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                     <div className="flex justify-between items-start mb-3 pl-2">
                        <div className="font-bold text-indigo-700 text-sm">#{String(o.orderNo || '-')}</div>
                        <select value={st} onChange={(e) => handleOrderStatusChange(o, e.target.value)} className={`px-2 py-1 rounded-md text-[10px] font-bold border cursor-pointer outline-none ${st === 'รออนุมัติ' ? 'bg-amber-50 text-amber-600 border-amber-200' : st === 'อนุมัติแล้ว' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                          <option value="รออนุมัติ">รออนุมัติ</option><option value="อนุมัติแล้ว">อนุมัติแล้ว</option><option value="ยกเลิก">ยกเลิก</option>
                        </select>
                     </div>
                     <div className="pl-2 mb-4 flex-1">
                        <h4 className="font-black text-gray-900 text-base leading-tight mb-1 line-clamp-2">{String(o.courseName || '-')}</h4>
                        <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 mb-2">
                             <span className="bg-gray-100 px-2 py-1 rounded-md font-bold">฿{parseNumber(o.price).toLocaleString()}</span>
                             <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-1 rounded-md font-bold">เครดิต: ฿{parseNumber(o.credit || o.price).toLocaleString()}</span>
                             <span className="bg-gray-100 px-2 py-1 rounded-md font-bold">จำนวน: {String(o.qty || '0')}</span>
                        </div>
                        <div className="flex items-center mt-3 pt-3 border-t border-gray-50">
                           <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-400 mr-3 shrink-0 overflow-hidden border border-indigo-100">
                               {picData ? <img src={picData.primary} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => handleProfileImgError(e, picData.fallback, 'block')} /> : null}
                               <Users size={14} className={picData ? "hidden" : ""}/>
                           </div>
                           <div><p className="font-bold text-gray-800 text-sm">{String(o.customerName || 'ไม่ระบุชื่อ')}</p><p className="font-mono text-xs text-gray-500">{String(o.customerPhone || '-')}</p></div>
                        </div>
                     </div>
                     <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-100 pl-2">
                        <p className="text-[10px] text-gray-400 font-mono">{new Date(o.createdAt).toLocaleDateString('th-TH')}</p>
                        <button onClick={() => setActionConfirmModal({ isOpen: true, title: 'ลบประวัติคำสั่งซื้อ', message: 'ยืนยันการลบประวัติคำสั่งซื้อนี้ทิ้งถาวร ใช่หรือไม่?', action: () => executeDeleteOrder(o.id), confirmText: 'ลบทิ้ง', confirmColor: 'bg-red-600 hover:bg-red-700' })} className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg flex items-center transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={14} className="mr-1"/> ลบ</button>
                     </div>
                  </div>
                  );
                })}
                {sortedOrders.length === 0 && <div className="col-span-full text-center py-20"><ShoppingCart size={64} className="mx-auto text-gray-200 mb-4"/><p className="text-base font-black text-gray-800 mb-1">ไม่พบข้อมูลคำสั่งซื้อ</p></div>}
              </div>
            </div>
          )}

          {activeTab === 'masterCourses' && (
            <div className="flex flex-col h-full space-y-4 max-w-7xl mx-auto">
              <div className="p-4 bg-white rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center">
                 <div className="flex items-center w-full max-w-sm"><Search size={20} className="text-gray-400 ml-2" /><input type="text" placeholder="ค้นหาชื่อคอร์ส, รหัส..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-full mx-2 outline-none text-sm" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pb-10">
                {filteredMasterCourses.slice(0, 100).map((mc, idx) => (
                  <div key={idx} className="bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm hover:shadow-lg transition-all flex flex-col relative overflow-hidden group border-t-4 border-t-cyan-400">
                     <div className="flex justify-between items-start mb-3">
                        <div className="font-mono text-xs font-bold text-cyan-700">{String(getFuzzyKey(mc, ["รหัสคอส", "col_1"]) || '-')}</div>
                        <span className="px-2 py-0.5 bg-cyan-50 text-cyan-600 text-[9px] font-bold rounded">{String(getFuzzyKey(mc, ["ประเภท", "col_2"]) || '-')}</span>
                     </div>
                     <h4 className="font-black text-gray-900 text-base mb-1 line-clamp-2 flex-1">{String(getFuzzyKey(mc, ["ชื่อคอส", "col_4"]) || '-')}</h4>
                     <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
                        <div className="text-xs text-gray-500">ราคา <span className="font-bold text-gray-800">฿{parseNumber(getFuzzyKey(mc, ["ราคา", "col_5"])).toLocaleString()}</span></div>
                        <div className="text-[10px] text-cyan-600 bg-cyan-50 px-2 py-1 rounded-md font-bold">จำนวน <span className="text-sm">{parseQty(getFuzzyKey(mc, ["จำนวนครั้งที่ได้", "col_13"]))}</span> ครั้ง</div>
                     </div>
                     <div className="flex justify-end mt-4 pt-4 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setActionConfirmModal({ isOpen: true, title: 'ลบคอร์สตั้งต้น', message: 'แน่ใจหรือไม่ที่จะลบรายการคอร์สนี้?', action: () => executeDeleteMasterCourse(mc.id), confirmText: 'ลบ', confirmColor: 'bg-red-600 hover:bg-red-700' })} className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg flex items-center"><Trash2 size={14} className="mr-1"/> ลบ</button>
                     </div>
                  </div>
                ))}
                {filteredMasterCourses.length === 0 && <div className="col-span-full text-center py-20"><Layers size={64} className="mx-auto text-gray-200 mb-4"/><p className="text-base font-black text-gray-800 mb-1">ไม่พบข้อมูลคอร์สตั้งต้น</p></div>}
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="flex flex-col h-full space-y-4 max-w-7xl mx-auto">
              <div className="p-4 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                 <div className="flex items-center w-full max-w-md"><Search size={20} className="text-gray-400 ml-2" /><input type="text" placeholder="ค้นหาสินค้า..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-full mx-2 outline-none text-sm" /></div>
                 <button onClick={() => setIsAddProductOpen(true)} className="bg-orange-500 hover:bg-orange-600 transition-colors text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg w-full sm:w-auto flex justify-center items-center active:scale-95"><Plus size={16} className="mr-1"/> เพิ่มสินค้า</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pb-10">
                {filteredProducts.slice(0, 100).map((p, idx) => {
                  const stock = parseQty(getFuzzyKey(p, ["จำนวนคงเหลือ", "col_12"]));
                  return (
                    <div key={idx} className="bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm hover:shadow-lg transition-all flex flex-col relative overflow-hidden group">
                       <div className={`absolute top-0 left-0 w-1.5 h-full ${stock <= 0 ? 'bg-red-400' : 'bg-orange-400'}`}></div>
                       <div className="flex justify-between items-start mb-3 pl-2">
                          <div className="font-mono font-bold text-orange-700 text-sm">{String(getFuzzyKey(p, ["รหัส", "col_1"]) || '-')}</div>
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${stock <= 0 ? 'bg-red-50 text-red-600' : 'bg-gray-100'}`}>คงเหลือ: {stock}</span>
                       </div>
                       <div className="pl-2 mb-4 flex-1">
                          <h4 className="font-black text-gray-900 text-base mb-1 line-clamp-2">{String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2"]) || '-')}</h4>
                          <div className="text-[10px] text-gray-500 mb-2">{String(getFuzzyKey(p, ["หมวดสินค้า", "col_4"]) || '-')}</div>
                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
                             <div className="text-xs text-gray-500">ปกติ <span className="font-bold ml-1">฿{parseNumber(getFuzzyKey(p, ["ราคาขายเต็ม", "ราคา", "col_6"])).toLocaleString()}</span></div>
                             <div className="text-xs text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded-lg">สมาชิก <span className="font-black ml-1 text-sm">฿{parseNumber(getFuzzyKey(p, ["ราคาสมาชิก", "col_10"])).toLocaleString()}</span></div>
                          </div>
                       </div>
                       <div className="flex justify-end mt-auto pt-4 border-t border-gray-100 pl-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setActionConfirmModal({ isOpen: true, title: 'ลบสินค้า', message: 'แน่ใจหรือไม่ที่จะลบสินค้านี้?', action: () => executeDeleteProduct(p.id), confirmText: 'ลบ', confirmColor: 'bg-red-600 hover:bg-red-700' })} className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg flex items-center"><Trash2 size={14} className="mr-1"/> ลบ</button>
                       </div>
                    </div>
                  )
                })}
                {filteredProducts.length === 0 && <div className="col-span-full text-center py-20"><Package size={64} className="mx-auto text-gray-200 mb-4"/><p className="text-base font-black text-gray-800 mb-1">ไม่พบข้อมูลสินค้า</p></div>}
              </div>
            </div>
          )}

          {activeTab === 'courses' && (
            <div className="flex flex-col h-full space-y-4 max-w-7xl mx-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                <div 
                  onClick={() => { setCourseSummaryFilter('all'); setSearchTerm(''); setCourseFilterType('all'); }} 
                  className={`bg-gradient-to-br from-indigo-600 to-purple-700 p-3 sm:p-4 rounded-2xl shadow-md text-white cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all ${courseSummaryFilter === 'all' ? 'ring-2 ring-white ring-offset-2 ring-offset-indigo-600' : ''}`}
                  role="button" tabIndex={0}
                >
                  <p className="text-[9px] sm:text-[10px] font-bold text-indigo-100 uppercase tracking-wider mb-0.5">รวมทั้งหมด</p>
                  <p className="text-xl sm:text-2xl font-black">{courseSummaryStats.all.total}</p>
                  <div className="flex gap-1.5 mt-1.5 text-[8px] sm:text-[9px]">
                    <span className="bg-white/20 px-1.5 py-0.5 rounded font-bold">ใช้ได้ {courseSummaryStats.all.active}</span>
                    <span className="bg-white/20 px-1.5 py-0.5 rounded font-bold">ใช้ครบ {courseSummaryStats.all.completed}</span>
                    <span className="bg-white/20 px-1.5 py-0.5 rounded font-bold">หมดอายุ {courseSummaryStats.all.expired}</span>
                  </div>
                </div>
                <div 
                  onClick={() => { setCourseSummaryFilter('treatment'); setSearchTerm(''); setCourseFilterType('all'); }} 
                  className={`bg-gradient-to-br from-emerald-500 to-green-600 p-3 sm:p-4 rounded-2xl shadow-md text-white cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all ${courseSummaryFilter === 'treatment' ? 'ring-2 ring-white ring-offset-2 ring-offset-emerald-600' : ''}`}
                  role="button" tabIndex={0}
                >
                  <p className="text-[9px] sm:text-[10px] font-bold text-emerald-100 uppercase tracking-wider mb-0.5">คอสรักษา</p>
                  <p className="text-xl sm:text-2xl font-black">{courseSummaryStats.treatment.total}</p>
                  <div className="flex gap-1.5 mt-1.5 text-[8px] sm:text-[9px]">
                    <span className="bg-white/20 px-1.5 py-0.5 rounded font-bold">ใช้ได้ {courseSummaryStats.treatment.active}</span>
                    <span className="bg-white/20 px-1.5 py-0.5 rounded font-bold">ใช้ครบ {courseSummaryStats.treatment.completed}</span>
                    <span className="bg-white/20 px-1.5 py-0.5 rounded font-bold">หมดอายุ {courseSummaryStats.treatment.expired}</span>
                  </div>
                </div>
                <div 
                  onClick={() => { setCourseSummaryFilter('long-kreung'); setSearchTerm(''); setCourseFilterType('all'); }} 
                  className={`bg-gradient-to-br from-cyan-500 to-teal-600 p-3 sm:p-4 rounded-2xl shadow-md text-white cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all ${courseSummaryFilter === 'long-kreung' ? 'ring-2 ring-white ring-offset-2 ring-offset-cyan-600' : ''}`}
                  role="button" tabIndex={0}
                >
                  <p className="text-[9px] sm:text-[10px] font-bold text-cyan-100 uppercase tracking-wider mb-0.5">ลงเครื่อง</p>
                  <p className="text-xl sm:text-2xl font-black">{courseSummaryStats.longKreung.total}</p>
                  <div className="flex gap-1.5 mt-1.5 text-[8px] sm:text-[9px]">
                    <span className="bg-white/20 px-1.5 py-0.5 rounded font-bold">ใช้ได้ {courseSummaryStats.longKreung.active}</span>
                    <span className="bg-white/20 px-1.5 py-0.5 rounded font-bold">ใช้ครบ {courseSummaryStats.longKreung.completed}</span>
                    <span className="bg-white/20 px-1.5 py-0.5 rounded font-bold">หมดอายุ {courseSummaryStats.longKreung.expired}</span>
                  </div>
                </div>
                <div 
                  onClick={() => { setCourseSummaryFilter('ipl-rakrae'); setSearchTerm(''); setCourseFilterType('all'); }} 
                  className={`bg-gradient-to-br from-rose-500 to-pink-600 p-3 sm:p-4 rounded-2xl shadow-md text-white cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all ${courseSummaryFilter === 'ipl-rakrae' ? 'ring-2 ring-white ring-offset-2 ring-offset-rose-600' : ''}`}
                  role="button" tabIndex={0}
                >
                  <p className="text-[9px] sm:text-[10px] font-bold text-rose-100 uppercase tracking-wider mb-0.5">IPL / รักแร้</p>
                  <p className="text-xl sm:text-2xl font-black">{courseSummaryStats.iplRakrae.total}</p>
                  <div className="flex gap-1.5 mt-1.5 text-[8px] sm:text-[9px]">
                    <span className="bg-white/20 px-1.5 py-0.5 rounded font-bold">ใช้ได้ {courseSummaryStats.iplRakrae.active}</span>
                    <span className="bg-white/20 px-1.5 py-0.5 rounded font-bold">ใช้ครบ {courseSummaryStats.iplRakrae.completed}</span>
                    <span className="bg-white/20 px-1.5 py-0.5 rounded font-bold">หมดอายุ {courseSummaryStats.iplRakrae.expired}</span>
                  </div>
                </div>
                <div 
                  onClick={() => { setCourseSummaryFilter('general'); setSearchTerm(''); setCourseFilterType('all'); }} 
                  className={`bg-white p-3 sm:p-4 rounded-2xl border border-gray-200 shadow-sm cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all ${courseSummaryFilter === 'general' ? 'ring-2 ring-indigo-400 ring-offset-2' : ''}`}
                  role="button" tabIndex={0}
                >
                  <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">คอสทั่วใบ</p>
                  <p className="text-xl sm:text-2xl font-black text-gray-700">{courseSummaryStats.general.total}</p>
                  <div className="flex gap-1.5 mt-1.5 text-[8px] sm:text-[9px]">
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded font-bold text-gray-600">ใช้ได้ {courseSummaryStats.general.active}</span>
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded font-bold text-gray-600">ใช้ครบ {courseSummaryStats.general.completed}</span>
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded font-bold text-gray-600">หมดอายุ {courseSummaryStats.general.expired}</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                 <div className="flex items-center w-full max-w-md"><Search size={20} className="text-gray-400 ml-2" /><input type="text" placeholder="ค้นหาชื่อลูกค้า, เบอร์โทร..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full mx-2 outline-none text-sm" /></div>
                 <div className="flex gap-2 w-full sm:w-auto">
                    <select value={courseFilterType} onChange={(e) => setCourseFilterType(e.target.value)} className="bg-teal-50 text-teal-700 rounded-xl px-3 py-2 text-sm font-bold flex-1 sm:w-auto outline-none border border-teal-200">
                        <option value="all">ทุกประเภท</option>
                        <option value="treatment">คอสรักษา</option>
                        <option value="general">คอสทั่วไป</option>
                    </select>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-gray-50 rounded-xl px-3 py-2 text-sm font-bold flex-1 sm:w-auto outline-none border border-gray-200"><option value="all">สถานะทั้งหมด</option><option value="ยังคงเหลือ">ยังคงเหลือ</option><option value="ใช้ครบแล้ว">ใช้ครบแล้ว</option></select>
                    <button onClick={() => { setIsPrintCourseSummaryMode(true); setTimeout(() => window.print(), 500); }} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center shadow-sm active:scale-95 shrink-0 transition-colors border border-gray-200"><Printer size={16} className="mr-1"/> พิมพ์ตาราง</button>
                    <button onClick={() => setIsAddCourseOpen(true)} className="bg-teal-500 hover:bg-teal-600 transition-colors text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center shadow-lg active:scale-95 shrink-0"><Plus size={16} className="mr-1"/> เพิ่มคอร์ส</button>
                 </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pb-10">
                {filteredCourses.slice(0, 100).map((course, idx) => {
                  const isPendingPayment = parseNumber(getFuzzyKey(course, "ยอดค้างชำระ")) > 0;
                  const courseCustomerPhone = String(getFuzzyKey(course, ["เบอร์โทร", "col_1"]) || '');
                  const picData = getProfilePicData({customerPhone: courseCustomerPhone}, customersRaw);
                  return (
                    <div key={idx} className={`bg-white border-2 ${isPendingPayment ? 'border-red-100 shadow-red-100/50' : 'border-gray-100'} rounded-[24px] p-5 shadow-sm hover:shadow-lg transition-all cursor-pointer relative overflow-hidden group flex flex-col`} onClick={() => setSelectedCourse(course)}>
                       <div className={`absolute top-0 left-0 w-1.5 h-full ${isPendingPayment ? 'bg-red-400' : course.computedStatus === 'ยังคงเหลือ' ? 'bg-gradient-to-b from-teal-400 to-emerald-500' : 'bg-gray-300'}`}></div>
                       <div className="flex justify-between items-start mb-3 pl-2">
                          <div className="font-bold text-teal-700 text-sm line-clamp-1">{String(getFuzzyKey(course, ["ชื่อคอส", "col_8"]) || '-')}</div>
                          <span className="px-2 py-1 rounded-lg text-[9px] font-black bg-gray-100 shrink-0">{course.computedStatus}</span>
                       </div>
                        <div className="pl-2 flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shrink-0 overflow-hidden border border-gray-200">
                                    {picData ? <img src={picData.primary} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => handleProfileImgError(e, picData.fallback, 'block')} /> : null}
                                    <Users size={10} className={picData ? "hidden" : ""} />
                                </div>
                                <div className="text-xs text-gray-600 line-clamp-1 flex-1">{String(getFuzzyKey(course, ["ผู้ซื้อคอส", "col_9"]) || '-')}</div>
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono mb-2">{courseCustomerPhone || '-'}</div>
                            <div className="flex flex-wrap gap-1 mb-2">
                                <div className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <Calendar size={10} className="text-gray-400"/>
                                    ซื้อ: {String(getFuzzyKey(course, ["วันที่ซื้อ", "col_3"]) || '-')}
                                </div>
                                {course.computedExpireDate !== '-' && (
                                    <div className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${course.daysLeft !== null && course.daysLeft < 0 ? 'text-rose-600 bg-rose-50 border border-rose-100' : course.isExpiringSoon ? 'text-amber-600 bg-amber-50 border border-amber-100' : 'text-gray-500 bg-gray-50 border border-gray-100'}`}>
                                        <Clock size={10}/>
                                        หมดอายุ: {course.computedExpireDate}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {isPendingPayment && <div className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md mb-1 inline-block">ค้างชำระ ฿{parseNumber(getFuzzyKey(course, "ยอดค้างชำระ")).toLocaleString()}</div>}
                                {course.computedTotalCredit > 0 && <div className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md mb-1 inline-block">เครดิต: ฿{course.computedRemainCredit.toLocaleString()}</div>}
                            </div>
                        </div>
                        <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-50 pl-2">
                           <p className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">ใช้ไป {course.computedUsedQty}/{course.computedTotalQty}</p>
                           <p className="text-sm font-bold text-teal-600">เหลือ {course.computedRemainQty}</p>
                        </div>
                    </div>
                  )
                })}
                {filteredCourses.length === 0 && <div className="col-span-full text-center py-20"><FileText size={64} className="mx-auto text-gray-200 mb-4"/><p className="text-base font-black text-gray-800 mb-1">ไม่พบข้อมูลใบคอร์ส</p></div>}
              </div>
            </div>
          )}

          {activeTab === 'customers' && (
            <div className="flex flex-col h-full space-y-4 max-w-7xl mx-auto">
              {/* 🌟 Summary Cards 🌟 */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-3 sm:p-4 rounded-2xl shadow-md text-white hover:shadow-xl hover:-translate-y-1 transition-all">
                  <p className="text-[9px] sm:text-[10px] font-bold text-indigo-100 uppercase tracking-wider mb-0.5">ลูกค้าทั้งหมด</p>
                  <p className="text-xl sm:text-2xl font-black">{customerSummaryStats.total}</p>
                </div>
                <div onClick={() => setFilterCustomerStatus('อนุมัติแล้ว (Member)')} className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 sm:p-4 rounded-2xl shadow-md text-white cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all">
                  <p className="text-[9px] sm:text-[10px] font-bold text-amber-100 uppercase tracking-wider mb-0.5">⭐ VIP Member</p>
                  <p className="text-xl sm:text-2xl font-black">{customerSummaryStats.vipCount}</p>
                </div>
                <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">💵 ยอดสะสมเฉลี่ย</p>
                  <p className="text-xl sm:text-2xl font-black text-emerald-600">฿{customerSummaryStats.avgAccumulated.toLocaleString()}</p>
                </div>
                <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">📦 ครั้งคอร์สคงเหลือ</p>
                  <p className="text-xl sm:text-2xl font-black text-teal-600">{customerSummaryStats.totalCourses}</p>
                </div>
                {customerSummaryStats.topSpender && (
                  <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow col-span-2 lg:col-span-1">
                    <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">🏆 Top Spender</p>
                    <p className="text-sm font-black text-gray-800 line-clamp-1">{customerSummaryStats.topSpender.computedName}</p>
                    <p className="text-xs text-indigo-600 font-bold mt-0.5">฿{customerSummaryStats.topSpender.realAccumulatedAmount?.toLocaleString() || '0'}</p>
                  </div>
                )}
              </div>

              {/* 🌟 Search + Filter + Toggle Bar 🌟 */}
              <div className="p-4 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                 <div className="flex items-center w-full max-w-md"><Search size={20} className="text-gray-400 ml-2" /><input type="text" placeholder="ค้นหาชื่อลูกค้า, เบอร์โทร..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full mx-2 outline-none text-sm" /></div>
                 <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                    <div className="flex bg-gray-100 p-1 rounded-xl shrink-0">
                       <button onClick={() => setCustomerViewMode('grid')} className={`px-3 py-1.5 flex items-center text-xs font-bold rounded-lg transition-colors ${customerViewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}><LayoutGrid size={14} className="mr-1"/> การ์ด</button>
                       <button onClick={() => setCustomerViewMode('ranking')} className={`px-3 py-1.5 flex items-center text-xs font-bold rounded-lg transition-colors ${customerViewMode === 'ranking' ? 'bg-white shadow-sm text-amber-600' : 'text-gray-500 hover:text-gray-700'}`}><Award size={14} className="mr-1"/> อันดับ</button>
                    </div>
                    <select value={filterCustomerStatus} onChange={(e) => setFilterCustomerStatus(e.target.value)} className="bg-gray-50 rounded-xl px-3 py-2 text-sm font-bold flex-1 sm:w-auto outline-none border border-gray-200"><option value="all">สมาชิกทั้งหมด</option><option value="อนุมัติแล้ว (Member)">VIP (Member)</option><option value="สะสมยอด">สะสมยอด</option><option value="ทั่วไป">ทั่วไป</option></select>
                    <button onClick={() => setIsAddCustomerOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center shadow-lg active:scale-95 shrink-0"><UserPlus size={16} className="mr-1"/> เพิ่มลูกค้า</button>
                 </div>
              </div>

              {/* 🌟 Grid View (เดิม) 🌟 */}
              {customerViewMode === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pb-10">
                  {filteredCustomers.slice(0, 100).map((customer, idx) => (
                    <div key={idx} className={`bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col relative overflow-hidden group ${customer.isApproved ? 'ring-2 ring-orange-100' : ''}`} onClick={() => setSelectedCustomer(customer)}>
                       <div className={`absolute top-0 left-0 w-1.5 h-full ${customer.isApproved ? 'bg-gradient-to-b from-amber-400 to-orange-500' : 'bg-gradient-to-b from-indigo-400 to-purple-500'}`}></div>
                       <div className="flex items-center space-x-3 mb-4 pl-2">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shadow-inner shrink-0 overflow-hidden border border-gray-100 ${customer.isApproved ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-700'}`}>
                             {customer.profilePicData ? <img src={customer.profilePicData.primary} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => handleProfileImgError(e, customer.profilePicData.fallback, 'flex')} /> : null}
                             <span className={customer.profilePicData ? "hidden" : "flex items-center justify-center w-full h-full"}>{String(customer.computedName || 'U')[0]}</span>
                          </div>
                          <div>
                             <h4 className="font-black text-gray-900 text-sm line-clamp-1">{customer.computedName}</h4>
                             <p className="text-[10px] text-gray-500 font-mono flex items-center mt-1"><Phone size={10} className="mr-1"/>{customer.computedPhone}</p>
                          </div>
                       </div>
                       <div className="pl-2 flex-1">
                           <div className="flex flex-wrap gap-2 mb-3">
                               <div className={`text-[10px] px-2 py-1 rounded-md font-bold ${customer.isApproved ? 'bg-orange-50 text-orange-600' : 'bg-gray-100 text-gray-600'}`}>
                                  {customer.isApproved ? 'VIP Member' : customer.computedMemberStatus}
                               </div>
                               {customer.hasMoleHistory && (
                                   <div className="text-[10px] px-2 py-1 rounded-md font-bold bg-teal-50 text-teal-600 border border-teal-100 flex items-center">
                                       <Sparkles size={10} className="mr-1" /> จี้ไฝ
                                   </div>
                               )}
                           </div>
                       </div>
                       <div className="pt-3 border-t border-gray-50 flex justify-between items-center pl-2 mt-auto">
                          <p className="text-[10px] text-gray-400 font-bold uppercase">ยอดสะสมสุทธิ</p>
                          <p className={`font-black text-lg ${customer.isApproved ? 'text-orange-600' : 'text-indigo-700'}`}>฿{customer.realAccumulatedAmount?.toLocaleString() || '0'}</p>
                       </div>
                    </div>
                  ))}
                  {filteredCustomers.length === 0 && <div className="col-span-full text-center py-20"><Users size={64} className="mx-auto text-gray-200 mb-4"/><p className="text-base font-black text-gray-800 mb-1">ไม่พบข้อมูลลูกค้า</p></div>}
                </div>
              )}

              {/* 🌟 Ranking View (Leaderboard) 🌟 */}
              {customerViewMode === 'ranking' && (
                <div className="pb-10">
                  {/* Sort Dropdown */}
                  <div className="flex justify-end mb-4">
                    <select value={customerSortBy} onChange={(e) => setCustomerSortBy(e.target.value)} className="bg-white rounded-xl px-4 py-2.5 text-sm font-bold outline-none border border-gray-200 shadow-sm">
                      <option value="accumulated">💰 เรียงตามยอดสะสมสูงสุด</option>
                      <option value="remainingQty">🎯 เรียงตามจำนวนครั้งคงเหลือรวม</option>
                      <option value="courses">📦 เรียงตามจำนวนคอร์สมากสุด</option>
                      <option value="visits">🔢 เรียงตามจำนวนครั้งใช้บริการ</option>
                      <option value="productValue">🛒 เรียงตามมูลค่าเบิกสินค้า</option>
                    </select>
                  </div>

                  {/* Leaderboard Table */}
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-200">
                          <th className="py-4 px-5 font-black text-gray-500 text-[10px] uppercase tracking-wider w-16 text-center">อันดับ</th>
                          <th className="py-4 px-5 font-black text-gray-500 text-[10px] uppercase tracking-wider">ลูกค้า</th>
                          <th className="py-4 px-5 font-black text-gray-500 text-[10px] uppercase tracking-wider text-center w-28">คอร์สคงเหลือ</th>
                          <th className="py-4 px-5 font-black text-gray-500 text-[10px] uppercase tracking-wider text-center w-28">จำนวนครั้ง</th>
                          <th className="py-4 px-5 font-black text-gray-500 text-[10px] uppercase tracking-wider text-right w-40">
                            {customerSortBy === 'accumulated' ? '💰 ยอดสะสม' : customerSortBy === 'remainingQty' ? '🎯 ครั้งคงเหลือรวม' : customerSortBy === 'courses' ? '📦 คอร์สทั้งหมด' : customerSortBy === 'visits' ? '🔢 ครั้งใช้บริการ' : '🛒 มูลค่าเบิกสินค้า'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {rankedCustomers.map((customer, idx) => {
                          const rank = idx + 1;
                          const medalEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
                          const vipProgress = Math.min(100, Math.round((customer.realAccumulatedAmount / 5000) * 100));
                          const sortValue = customerSortBy === 'accumulated' ? customer.realAccumulatedAmount : customerSortBy === 'remainingQty' ? customer.totalRemainingQty : customerSortBy === 'courses' ? customer.totalCourses : customerSortBy === 'visits' ? customer.visitCount : customer.productValue;
                          return (
                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors cursor-pointer group" onClick={() => setSelectedCustomer(customer)}>
                              <td className="py-4 px-5 align-middle text-center">
                                {rank <= 3 ? (
                                  <span className="text-2xl">{medalEmoji}</span>
                                ) : (
                                  <span className="font-black text-gray-400 text-sm">{rank}</span>
                                )}
                              </td>
                              <td className="py-4 px-5 align-middle">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shadow-inner shrink-0 overflow-hidden border ${customer.isApproved ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                                    {customer.profilePicData ? <img src={customer.profilePicData.primary} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => handleProfileImgError(e, customer.profilePicData.fallback, 'flex')} /> : null}
                                    <span className={customer.profilePicData ? "hidden" : "flex items-center justify-center w-full h-full"}>{String(customer.computedName || 'U')[0]}</span>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-black text-gray-900 text-sm line-clamp-1">{customer.computedName}</h4>
                                      {customer.isApproved && <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">VIP</span>}
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-mono">{customer.computedPhone}</p>
                                    {/* VIP Progress Bar */}
                                    <div className="w-32 mt-1.5 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                      <div className={`h-full rounded-full transition-all ${vipProgress >= 100 ? 'bg-amber-400' : 'bg-indigo-400'}`} style={{ width: `${vipProgress}%` }}></div>
                                    </div>
                                    <p className="text-[8px] text-gray-400 mt-0.5">{vipProgress >= 100 ? '✅ ถึงเกณฑ์ VIP' : `${vipProgress}% สู่ VIP (5,000)`}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-5 align-middle text-center">
                                <span className={`font-bold text-sm ${customer.courseCount > 0 ? 'text-teal-600' : 'text-gray-300'}`}>{customer.courseCount}</span>
                                <span className="text-[10px] text-gray-400">/{customer.totalCourses}</span>
                              </td>
                              <td className="py-4 px-5 align-middle text-center">
                                <span className={`font-bold text-sm ${customer.visitCount > 0 ? 'text-indigo-600' : 'text-gray-300'}`}>{customer.visitCount}</span>
                                <span className="text-[10px] text-gray-400 block">ครั้ง</span>
                              </td>
                              <td className="py-4 px-5 align-middle text-right">
                                <span className={`font-black text-base ${rank === 1 ? 'text-amber-500 text-lg' : 'text-gray-800'}`}>
                                  {customerSortBy === 'productValue' || customerSortBy === 'accumulated' ? `฿${sortValue.toLocaleString()}` : sortValue}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        {rankedCustomers.length === 0 && (
                          <tr><td colSpan={5}><div className="text-center py-20"><Users size={64} className="mx-auto text-gray-200 mb-4"/><p className="text-base font-black text-gray-800 mb-1">ไม่พบข้อมูลลูกค้า</p></div></td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Bottom Note */}
                  <div className="text-center mt-4 text-[10px] text-gray-400 font-bold">
                    แสดง 50 อันดับแรก &nbsp;|&nbsp; คลิกที่ชื่อเพื่อดูรายละเอียด
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'histories' && (
            <div className="flex flex-col h-full space-y-4 max-w-7xl mx-auto">
              <div className="p-4 bg-white rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center">
                 <div className="flex items-center w-full max-w-md">
                    <Search size={20} className="text-gray-400 ml-2" />
                    <input type="text" placeholder="ค้นหาประวัติ..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-full mx-2 outline-none text-sm" />
                 </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-gray-800 flex items-center text-sm sm:text-base">
                    <Activity className="mr-2 text-teal-500" size={18} />
                    ประวัติการใช้บริการ ประจำวันนี้
                    <span className="ml-2 text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</span>
                  </h3>
                  <div className="flex items-center gap-3 text-[10px] sm:text-xs">
                    <span className="font-bold text-gray-500">รวม: <span className="text-teal-600 font-black">{todayUsageByBranch.totalCount}</span> รายการ</span>
                    <span className="font-bold text-gray-500">ครั้ง: <span className="text-indigo-600 font-black">{todayUsageByBranch.totalQty}</span></span>
                    {todayUsageByBranch.totalAmount > 0 && (
                      <span className="font-bold text-gray-500">มูลค่า: <span className="text-orange-600 font-black">฿{todayUsageByBranch.totalAmount.toLocaleString()}</span></span>
                    )}
                  </div>
                </div>

                {todayUsageByBranch.totalCount === 0 ? (
                  <div className="text-center py-8 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                    <HistoryIcon size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-400 font-bold text-sm">ยังไม่มีประวัติการใช้บริการในวันนี้</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(todayUsageByBranch.branches).map(([branch, data]) => (
                      <div key={branch} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 p-4 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-teal-400"></div>
                        <div className="flex items-center justify-between mb-3 pl-2">
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-teal-500" />
                            <span className="font-black text-gray-800 text-sm">{branch}</span>
                          </div>
                          <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">{data.count} รายการ</span>
                        </div>
                        <div className="flex gap-3 mb-3 pl-2 text-[10px]">
                          <span className="text-gray-500 font-bold">ครั้ง: <span className="text-indigo-600">{data.qty}</span></span>
                          {data.amount > 0 && (
                            <span className="text-gray-500 font-bold">มูลค่า: <span className="text-orange-600">฿{data.amount.toLocaleString()}</span></span>
                          )}
                        </div>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto hide-scrollbar pl-2">
                          {data.items.slice(0, 10).map((item, iIdx) => {
                            const customerName = String(getFuzzyKey(item, ["ชื่อลูกค้า", "col_2"]) || '-');
                            const itemName = String(getFuzzyKey(item, ["สินค้า", "ชื่อคอส", "รายการ", "col_18", "col_16", "col_23"]) || '-');
                            const timeStr = getFuzzyKey(item, ["เวลา", "time"]) || '';
                            const sortTime = getHistorySortTime(item);
                            return (
                              <div key={iIdx} className="flex items-center gap-2 text-[10px] bg-white rounded-lg px-2 py-1.5 border border-gray-50">
                                <span className="font-mono text-gray-400 shrink-0 w-10">
                                  {sortTime ? new Date(sortTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : timeStr}
                                </span>
                                <span className="font-bold text-gray-700 truncate flex-1">{customerName}</span>
                                <span className="text-gray-400 truncate max-w-[80px]" title={itemName}>{itemName}</span>
                              </div>
                            );
                          })}
                          {data.items.length > 10 && (
                            <p className="text-[9px] text-gray-400 text-center font-bold">แสดง 10 จาก {data.items.length} รายการ</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pb-10">
                {sortedHistories.slice(0, 100).map((h, idx) => (
                  <div key={idx} className="bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm">
                     <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded border border-indigo-100">{String(getFuzzyKey(h, ["ประเภท", "col_4"]) || '-')}</span>
                        <span className="font-mono text-[10px] text-gray-500">{String(getFuzzyKey(h, ["วันที่", "col_1"]) || '-')} {h.เวลา || ''}</span>
                     </div>
                     <p className="font-black text-sm text-gray-900 mb-1">{String(getFuzzyKey(h, ["ชื่อลูกค้า", "col_2"]) || '-')}</p>
                     <p className="text-xs text-gray-600 line-clamp-2">{String(getFuzzyKey(h, ["สินค้า", "ชื่อคอส", "รายการ", "col_18", "col_16", "col_23"]) || '-')}</p>
                     
                     <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
                        <span className="text-[10px] text-gray-400 font-mono">Ref: {String(getFuzzyKey(h, ["อ้างอิง", "เลขที่ใบคอส", "col_6"]) || '-')}</span>
                        {parseNumber(getFuzzyKey(h, ["ยอดสินค้า", "ยอดจัดซื้อ", "ยอดเงิน", "ยอด", "col_19"])) > 0 && (
                            <span className="font-black text-xs text-orange-500">฿{parseNumber(getFuzzyKey(h, ["ยอดสินค้า", "ยอดจัดซื้อ", "ยอดเงิน", "ยอด", "col_19"])).toLocaleString()}</span>
                        )}
                     </div>
                  </div>
                ))}
                {sortedHistories.length === 0 && <div className="col-span-full text-center py-20"><HistoryIcon size={64} className="mx-auto text-gray-200 mb-4"/><p className="text-base font-black text-gray-800 mb-1">ไม่พบข้อมูลประวัติบริการ</p></div>}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="flex flex-col h-full space-y-6 max-w-6xl mx-auto pb-10">
              <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-sm border border-gray-100">
                 <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center"><Database className="mr-3 text-indigo-500"/> ข้อมูลระบบฐานข้อมูล (Firebase)</h3>
                 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 shadow-inner ${isDbConnected ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                       {isDbConnected ? <CheckCircle size={28} /> : <AlertTriangle size={28} />}
                    </div>
                    <div>
                       <p className="font-black text-gray-800 text-lg">{isDbConnected ? 'เชื่อมต่อ Cloud สำเร็จ' : 'ขาดการเชื่อมต่อ'}</p>
                       <p className="text-sm text-gray-500">ข้อมูลทั้งหมดของคุณถูกบันทึกและซิงค์เรียลไทม์บนระบบ Firestore</p>
                    </div>
                 </div>

                 <h4 className="font-bold text-gray-800 mb-4">สถิติข้อมูลในระบบ</h4>
                 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {dbInfo.map((info, idx) => {
                      const Icon = info.icon;
                      return (
                        <div key={idx} className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm text-center">
                           <Icon size={24} className={`mx-auto mb-2 ${info.color}`} />
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{info.label}</p>
                           <p className="text-xl font-black text-gray-800">{info.len}</p>
                        </div>
                      )
                    })}
                 </div>
              </div>

              {/* 🌟 ตารางจัดการข้อมูล (Data Management Table) 🌟 */}
              <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-sm border border-gray-100">
                 <h3 className="text-xl font-black text-gray-800 mb-2 flex items-center"><List className="mr-3 text-indigo-500"/> จัดการข้อมูลระบบ</h3>
                 <p className="text-sm text-gray-500 mb-6">เลือกข้อมูลที่ต้องการลบออกจากฐานข้อมูล คุณสามารถเลือกทีละรายการหรือเลือกทั้งหมดได้</p>
                 
                 {/* เลือก Collection */}
                 <div className="mb-6">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">เลือกประเภทข้อมูล</label>
                    <select 
                      value={settingsSelectedCollection} 
                      onChange={(e) => { setSettingsSelectedCollection(e.target.value); setSelectedItems(new Set()); }}
                      className="w-full sm:w-64 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-indigo-400"
                    >
                      <option value="courses">ใบคอร์ส ({courses.length} รายการ)</option>
                      <option value="customers">ลูกค้า ({customersRaw.length} รายการ)</option>
                      <option value="histories">ประวัติ ({histories.length} รายการ)</option>
                      <option value="bookings">การจองคิว ({bookings.length} รายการ)</option>
                      <option value="orders">คำสั่งซื้อ ({orders.length} รายการ)</option>
                      <option value="products">สินค้า ({products.length} รายการ)</option>
                      <option value="master_courses">คอร์สตั้งต้น ({masterCourses.length} รายการ)</option>
                    </select>
                 </div>

                 {/* ตารางข้อมูล */}
                 <div className="overflow-x-auto rounded-2xl border border-gray-200">
                    <table className="w-full text-sm text-left border-collapse min-w-[600px]">
                       <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                             <th className="py-3 px-4 w-12">
                                <input 
                                  type="checkbox" 
                                  checked={getCurrentCollectionData().length > 0 && selectedItems.size === getCurrentCollectionData().length}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedItems(new Set(getCurrentCollectionData().map(item => item.id)));
                                    } else {
                                      setSelectedItems(new Set());
                                    }
                                  }}
                                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                             </th>
                             <th className="py-3 px-4 font-black text-gray-500 text-[10px] uppercase tracking-wider">ข้อมูล</th>
                             <th className="py-3 px-4 font-black text-gray-500 text-[10px] uppercase tracking-wider w-32">วันที่</th>
                             <th className="py-3 px-4 font-black text-gray-500 text-[10px] uppercase tracking-wider w-24">สถานะ</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                          {getCurrentCollectionData().slice(0, 50).map((item, idx) => (
                            <tr key={item.id || idx} className="hover:bg-gray-50 transition-colors">
                               <td className="py-3 px-4">
                                  <input 
                                    type="checkbox" 
                                    checked={selectedItems.has(item.id)}
                                    onChange={(e) => {
                                      const newSelected = new Set(selectedItems);
                                      if (e.target.checked) {
                                        newSelected.add(item.id);
                                      } else {
                                        newSelected.delete(item.id);
                                      }
                                      setSelectedItems(newSelected);
                                    }}
                                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                 </td>
                               <td className="py-3 px-4">
                                  <div className="font-bold text-gray-800 text-sm">{getItemDisplayName(item, settingsSelectedCollection)}</div>
                                  <div className="text-[10px] text-gray-400 font-mono">{getItemSubInfo(item, settingsSelectedCollection)}</div>
                                 </td>
                               <td className="py-3 px-4 text-xs text-gray-500">
                                  {getItemDate(item)}
                                 </td>
                               <td className="py-3 px-4">
                                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                                    {getItemStatus(item, settingsSelectedCollection)}
                                  </span>
                                 </td>
                            </tr>
                          ))}
                          {getCurrentCollectionData().length === 0 && (
                            <tr>
                              <td colSpan={4} className="py-8 text-center text-gray-400 font-bold">ไม่มีข้อมูลในหมวดหมู่นี้</td>
                            </tr>
                          )}
                       </tbody>
                    </table>
                 </div>
                 {getCurrentCollectionData().length > 50 && (
                   <p className="text-xs text-gray-400 text-center mt-2">แสดง 50 จาก {getCurrentCollectionData().length} รายการ</p>
                 )}

                 {/* ปุ่มดำเนินการ */}
                 <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-gray-100">
                    <button 
                      onClick={() => {
                        if (selectedItems.size === 0) return showToast('กรุณาเลือกรายการที่ต้องการลบ');
                        const itemsToDelete = getCurrentCollectionData().filter(item => selectedItems.has(item.id));
                        setConfirmDeleteModal({ isOpen: true, type: settingsSelectedCollection, data: itemsToDelete });
                      }}
                      disabled={selectedItems.size === 0}
                      className="bg-red-500 hover:bg-red-600 disabled:bg-gray-200 disabled:text-gray-400 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center transition-colors active:scale-95"
                    >
                      <Trash2 size={16} className="mr-2" />
                      ลบที่เลือก ({selectedItems.size} รายการ)
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedItems(new Set(getCurrentCollectionData().map(item => item.id)));
                      }}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center transition-colors active:scale-95"
                    >
                      เลือกทั้งหมด
                    </button>
                    <button 
                      onClick={() => setSelectedItems(new Set())}
                      className="bg-gray-50 hover:bg-gray-100 text-gray-500 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center transition-colors active:scale-95"
                    >
                      ยกเลิกการเลือก
                    </button>
                 </div>
              </div>

              <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-sm border border-red-100 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-2 h-full bg-red-500"></div>
                 <h3 className="text-xl font-black text-red-600 mb-2 flex items-center"><AlertTriangle className="mr-3"/> โซนอันตราย (Danger Zone)</h3>
                 <p className="text-sm text-gray-600 mb-6 font-medium">ระมัดระวัง! การกดลบข้อมูลด้านล่างนี้จะเป็นการ <span className="text-red-500 font-bold underline">ลบออกจากฐานข้อมูล Cloud อย่างถาวร</span> และไม่สามารถกู้คืนได้</p>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {deleteButtons.map((btn, idx) => (
                       <button key={idx} onClick={() => setConfirmDeleteModal({ isOpen: true, type: btn.type, data: btn.data })} disabled={btn.data.length === 0} className="bg-red-50 hover:bg-red-100 disabled:bg-gray-50 disabled:text-gray-300 text-red-600 border border-red-100 disabled:border-gray-200 p-4 rounded-2xl text-sm font-bold flex items-center justify-between transition-colors group shadow-sm active:scale-95">
                          <span className="flex items-center"><Trash2 size={18} className="mr-2"/> {btn.label}</span>
                          <span className="bg-white group-disabled:bg-gray-100 px-2.5 py-1 rounded-lg text-[10px] border border-red-100 group-disabled:border-gray-200">{btn.data.length} รายการ</span>
                       </button>
                    ))}
                 </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 🌟 Course Details Modal 🌟 */}
      {selectedCourse && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-3xl rounded-[32px] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-in zoom-in-95 border border-gray-100">
             <div className="p-6 sm:p-8 border-b border-gray-100 flex justify-between items-start bg-gradient-to-r from-teal-500 to-emerald-500 text-white relative">
                <div className="absolute right-0 top-0 w-48 h-48 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none"></div>
                <div className="relative z-10">
                   <h2 className="text-2xl sm:text-3xl font-black mb-1 pr-8">{String(getFuzzyKey(selectedCourse, ["ชื่อคอส", "col_8"]) || '-')}</h2>
                   <p className="font-mono text-white/80">Ref: {String(getFuzzyKey(selectedCourse, ["เลขที่ใบคอส", "col_2"]) || '-')}</p>
                </div>
                <button onClick={() => setSelectedCourse(null)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 relative z-10 shrink-0"><X size={20}/></button>
             </div>
             <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-gray-50/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                   <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                      {(() => {
                          const courseCustomerPhone = String(getFuzzyKey(selectedCourse, ["เบอร์โทร", "col_1"]) || '');
                          const picData = getProfilePicData({customerPhone: courseCustomerPhone}, customersRaw);
                          return (
                              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shrink-0 overflow-hidden border border-gray-200">
                                  {picData ? <img src={picData.primary} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => handleProfileImgError(e, picData.fallback, 'block')} /> : null}
                                  <Users size={24} className={picData ? "hidden" : ""} />
                              </div>
                          );
                      })()}
                      <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">ลูกค้า</p>
                          <p className="font-black text-lg text-gray-800 line-clamp-1">{String(getFuzzyKey(selectedCourse, ["ผู้ซื้อคอส", "col_9"]) || '-')}</p>
                          <p className="text-xs font-mono text-gray-500">{String(getFuzzyKey(selectedCourse, ["เบอร์โทร", "col_1"]) || '-')}</p>
                      </div>
                   </div>
                   <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-right flex flex-col justify-center">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">สถานะปัจจุบัน</p>
                      <p className={`font-black text-2xl ${selectedCourse.computedRemainQty > 0 ? 'text-teal-600' : 'text-gray-500'}`}>{selectedCourse.computedStatus}</p>
                   </div>
                </div>
                
                <div className="flex justify-around items-center border-4 border-gray-800 bg-white rounded-3xl p-5 mb-6 text-center shadow-sm">
                   <div><p className="text-xs font-bold text-gray-500 uppercase">ทั้งหมด</p><p className="text-3xl font-black">{selectedCourse.computedTotalQty}</p></div><div className="w-px h-12 bg-gray-200"></div>
                   <div><p className="text-xs font-bold text-teal-600 uppercase">ใช้ไปแล้ว</p><p className="text-3xl font-black text-teal-600">{selectedCourse.computedUsedQty}</p></div><div className="w-px h-12 bg-gray-200"></div>
                   <div><p className="text-xs font-bold text-orange-600 uppercase">คงเหลือ</p><p className="text-4xl font-black text-orange-600">{selectedCourse.computedRemainQty}</p></div>
                </div>

                {selectedCourse.computedTotalCredit > 0 && (
                   <div className="mb-6 bg-gradient-to-r from-orange-50 to-amber-50 p-5 rounded-3xl shadow-sm border border-orange-100">
                       <div className="flex justify-between items-center mb-3">
                           <h3 className="font-black text-orange-800 flex items-center text-sm"><Banknote size={16} className="mr-2"/> วงเงินเครดิตคงเหลือ</h3>
                           <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                               เบิก/หักแล้ว {Math.round(Math.min(100, Math.max(0, (selectedCourse.computedUsedCredit / selectedCourse.computedTotalCredit) * 100)))}%
                           </span>
                       </div>
                       <div className="flex justify-between items-end mb-2">
                           <div>
                               <p className="text-[10px] font-bold text-orange-400 uppercase">ยอดที่ได้รับรวม ฿{selectedCourse.computedTotalCredit.toLocaleString()}</p>
                               <p className="text-[10px] font-bold text-orange-500 uppercase mt-0.5">เบิกใช้ไปแล้ว ฿{selectedCourse.computedUsedCredit.toLocaleString()}</p>
                           </div>
                           <p className="text-3xl font-black text-orange-600">฿{selectedCourse.computedRemainCredit.toLocaleString()}</p>
                       </div>
                       <div className="w-full bg-orange-200/50 rounded-full h-2 overflow-hidden">
                           <div className="bg-gradient-to-r from-orange-400 to-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, (selectedCourse.computedUsedCredit / selectedCourse.computedTotalCredit) * 100))}%` }}></div>
                       </div>
                   </div>
                )}

                <div className="mb-8 bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex justify-between text-xs font-bold mb-2">
                        <span className="text-gray-600">การใช้คอร์ส ({Math.round(Math.min(100, Math.max(0, (selectedCourse.computedUsedQty / (selectedCourse.computedTotalQty || 1)) * 100)))}%)</span>
                        {selectedCourse.computedExpireDate !== '-' && <span className={`flex items-center ${selectedCourse.daysLeft !== null && selectedCourse.daysLeft < 0 ? 'text-rose-500' : 'text-gray-500'}`}><Clock size={12} className="mr-1"/> หมดอายุ: {selectedCourse.computedExpireDate}</span>}
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${selectedCourse.computedStatus === 'หมดอายุ' ? 'bg-rose-400' : 'bg-gradient-to-r from-teal-400 to-emerald-500'}`} style={{ width: `${Math.min(100, Math.max(0, (selectedCourse.computedUsedQty / (selectedCourse.computedTotalQty || 1)) * 100))}%` }}></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                   <button onClick={() => handleOpenUseSession(selectedCourse)} className="bg-teal-500 hover:bg-teal-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-teal-500/30 flex items-center justify-center text-lg active:scale-95 transition-all"><CheckCircle className="mr-2"/> รับบริการ / เบิกสินค้า</button>
                   <button onClick={() => { setIsPrintSingleCourseMode(true); setTimeout(() => window.print(), 500); }} className="bg-gray-900 hover:bg-gray-800 text-white py-4 rounded-2xl font-black shadow-lg flex items-center justify-center text-lg active:scale-95 transition-all"><Printer className="mr-2"/> พิมพ์ใบคอร์ส</button>
                </div>

                {(() => {
                   const freeUsages = selectedCourse.myHistories?.filter(h => {
                       if (h.isCancelled || String(getFuzzyKey(h, ["สถานะ", "col_7", "col_8", "col_9"]) || '') === 'ยกเลิก') return false;
                       return isFreeUsage(h);
                   }) || [];

                   if (freeUsages.length === 0) return null;
                   
                   return (
                       <div className="mb-8">
                           <h3 className="font-black text-rose-500 mb-3 flex items-center"><Sparkles size={18} className="mr-2"/> รายการฟรี / ไม่หักยอดคอร์ส</h3>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                               {freeUsages.map((h, i) => {
                                   const type = String(getFuzzyKey(h, ["ประเภท", "col_4"]) || '');
                                   const isAdd = isAddType(type);
                                   return (
                                     <div key={i} className="flex justify-between items-center text-sm bg-white p-4 rounded-2xl border border-rose-100 shadow-sm">
                                         <div>
                                             <span className="font-mono text-gray-500 mr-3">{String(getFuzzyKey(h, ["วันที่", "col_1"]) || '-')}</span>
                                             <span className="font-bold text-gray-800">
                                                 {String(getFuzzyKey(h, ["รายการ", "สินค้า", "col_23", "col_18"]) || (isAdd ? 'อัพคอร์ส' : 'ตัดคอร์ส'))}
                                                 <span className="ml-2 text-[10px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded border border-rose-200">ฟรี</span>
                                             </span>
                                         </div>
                                         <span className="font-black px-2 py-1 rounded bg-rose-50 text-rose-500 text-xs shrink-0 ml-2">ไม่หักยอด</span>
                                      </div>
                                   );
                               })}
                           </div>
                       </div>
                   );
                })()}

                <h3 className="font-black text-gray-800 mb-3 flex items-center"><HistoryIcon size={18} className="mr-2 text-gray-400"/> ประวัติการรับบริการ / หักเครดิตสินค้า</h3>
                
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                   {(() => {
                       const standardUsages = selectedCourse.myHistories?.filter(h => {
                           const type = String(getFuzzyKey(h, ["ประเภท", "col_4"]) || '');
                           if (isFreeUsage(h)) return false; 
                           if (isUsageType(type)) return true;
                           return isAddType(type);
                       }) || [];

                       if (standardUsages.length === 0) return <div className="text-center py-6 text-gray-400 italic">ไม่มีประวัติการใช้งาน</div>;

                       return (
                           <div className="-mx-6 -my-6">
                               <HistoryTable histories={standardUsages} showActions={true} onRefund={handleRefundCourse} />
                           </div>
                       );
                   })()}
                </div>
             </div>
          </div>
        </div>
      )}

      {/* 🌟 Customer Profile Modal 🌟 */}
      {selectedCustomer && !isPrintMode && !isPrintMultiCourseMode && !isPrintCourseSummaryMode && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-5xl rounded-[32px] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-in zoom-in-95 border border-gray-100">
             
             {/* Header ลูกค้า */}
             <div className="p-6 sm:p-8 border-b border-gray-100 flex flex-col bg-gradient-to-r from-indigo-500 to-purple-600 text-white relative">
                <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -mr-10 -mt-20 blur-3xl pointer-events-none"></div>
                
                {/* แถบเครื่องมือ (ย้ายมาจัดเรียงด้านบนให้ไม่ทับข้อความ) */}
                <div className="flex justify-end gap-2 mb-6 relative z-10 w-full">
                    {!selectedCustomer.isApproved && selectedCustomer.realAccumulatedAmount >= 5000 && (
                        <button onClick={() => handleApproveCustomer(selectedCustomer)} className="p-2.5 bg-orange-500 rounded-full hover:bg-orange-600 transition-colors text-white shadow-lg animate-bounce flex items-center gap-1.5 px-4" title="อนุมัติสิทธิ์ VIP"><Award size={16}/><span className="text-[11px] font-bold uppercase tracking-wider hidden sm:inline">อัปเกรด VIP</span></button>
                    )}
                    <button onClick={() => { setEditCustomerData({ id: selectedCustomer.id, name: selectedCustomer.computedName, phone: selectedCustomer.computedPhone, issue: selectedCustomer.computedIssue }); setIsEditCustomerOpen(true); }} className="p-2.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors text-white shadow-sm" title="แก้ไขข้อมูลลูกค้า"><PenTool size={18}/></button>
                    <button onClick={handleOpenSelectPrint} className="p-2.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors text-white shadow-sm" title="พิมพ์ใบคอร์สหลายใบ"><Printer size={18}/></button>
                    <button onClick={handlePrintView} className="p-2.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors text-white shadow-sm" title="พิมพ์ประวัติ/บัตรสมาชิก"><FileText size={18}/></button>
                    <button onClick={() => setSelectedCustomer(null)} className="p-2.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors text-white ml-2 shadow-sm"><X size={20}/></button>
                </div>

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10 w-full">
                    <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-inner border border-white/30 text-4xl font-black overflow-hidden shrink-0">
                        {selectedCustomer.profilePicData ? <img src={selectedCustomer.profilePicData.primary} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => handleProfileImgError(e, selectedCustomer.profilePicData.fallback, 'flex')} /> : null}
                        <span className={selectedCustomer.profilePicData ? "hidden" : "flex items-center justify-center w-full h-full"}>{String(selectedCustomer.computedName || 'U')[0]}</span>
                    </div>
                    
                    <div className="flex-1 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row items-center gap-3 mb-3">
                            <h2 className="text-3xl font-black drop-shadow-sm">{selectedCustomer.computedName}</h2>
                            {selectedCustomer.isApproved && <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center"><Award size={12} className="mr-1"/> VIP</span>}
                        </div>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 text-white/90 text-sm">
                            <p className="font-mono flex items-center bg-white/10 px-3 py-1.5 rounded-xl"><Phone size={16} className="mr-2 opacity-70"/>{selectedCustomer.computedPhone}</p>
                            <p className="flex items-center bg-white/10 px-3 py-1.5 rounded-xl"><Users size={16} className="mr-2 opacity-70"/> สถานะ: <span className="font-bold ml-1 text-white">{selectedCustomer.computedMemberStatus}</span></p>
                            <p className="flex items-center bg-white/10 px-3 py-1.5 rounded-xl"><AlertCircle size={16} className="mr-2 opacity-70"/> ปัญหาผิว: {selectedCustomer.computedIssue || 'ไม่ระบุ'}</p>
                        </div>
                    </div>

                    {/* ยอดสะสม (จัดลงกล่องแยกให้ชัดเจนและไม่ทับ) */}
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center min-w-[160px] shrink-0 shadow-lg mt-4 sm:mt-0 w-full sm:w-auto">
                        <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold mb-1">ยอดสะสมสุทธิ (รวม)</p>
                        <p className="text-3xl font-black text-white drop-shadow-md">฿{selectedCustomer.realAccumulatedAmount?.toLocaleString() || '0'}</p>
                    </div>
                </div>
             </div>

             <div className="flex flex-col h-full overflow-hidden bg-gray-50/50">
                <div className="flex overflow-x-auto hide-scrollbar border-b border-gray-200 bg-white px-4 sm:px-8 shrink-0">
                    <button onClick={() => setCustomerModalTab('courses')} className={`py-4 px-4 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${customerModalTab === 'courses' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>ใบคอร์สที่ซื้อ</button>
                    <button onClick={() => setCustomerModalTab('timeline')} className={`py-4 px-4 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${customerModalTab === 'timeline' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>ไทม์ไลน์ภาพ (รูป)</button>
                    <button onClick={() => setCustomerModalTab('courseUsage')} className={`py-4 px-4 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${customerModalTab === 'courseUsage' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>ประวัติใช้คอร์ส</button>
                    <button onClick={() => setCustomerModalTab('products')} className={`py-4 px-4 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${customerModalTab === 'products' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>ประวัติสินค้า</button>
                    <button onClick={() => setCustomerModalTab('moles')} className={`py-4 px-4 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${customerModalTab === 'moles' ? 'border-gray-800 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>ประวัติจี้ไฝ</button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    
                    {/* แท็บ ใบคอร์สที่ซื้อ */}
                    {customerModalTab === 'courses' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="font-black text-gray-800 flex items-center text-lg"><FileText className="mr-2 text-indigo-500"/> ใบคอร์สรับบริการทั้งหมด</h4>
                                <button onClick={() => { setNewCourseForm({...newCourseForm, phone: selectedCustomer.computedPhone}); setIsAddCourseOpen(true); }} className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold px-3 py-2 rounded-lg flex items-center transition-colors shadow-sm">
                                    <Plus size={14} className="mr-1"/> เปิดคอร์สให้ลูกค้านี้
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {getCustomerCourses(selectedCustomer.computedPhone).map(c => {
                                    const isPendingPayment = parseNumber(getFuzzyKey(c, "ยอดค้างชำระ")) > 0;
                                    return (
                                        <div key={c.id} onClick={() => { setSelectedCustomer(null); setSelectedCourse(c); }} className={`bg-white border-2 ${isPendingPayment ? 'border-red-100 hover:border-red-300' : 'border-gray-100 hover:border-teal-200'} rounded-2xl p-4 cursor-pointer shadow-sm hover:shadow-lg transition-all relative overflow-hidden group`}>
                                            <div className={`absolute top-0 left-0 w-1.5 h-full ${c.computedStatus === 'ยังคงเหลือ' ? 'bg-teal-400' : 'bg-gray-300'}`}></div>
                                            <div className="flex justify-between items-start mb-2 pl-2">
                                                <p className="font-bold text-teal-700 text-sm line-clamp-1">{String(getFuzzyKey(c, ["ชื่อคอส", "col_8"]) || '-')}</p>
                                                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-gray-100 shrink-0">{c.computedStatus}</span>
                                            </div>
                                            <div className="pl-2 mb-3">
                                                <p className="text-[10px] text-gray-500 font-mono mb-1">{c.courseRefKey}</p>
                                                <div className="flex flex-wrap gap-1 mb-1">
                                                    <span className="text-[9px] font-bold text-gray-400 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                                        <Calendar size={9}/>
                                                        ซื้อ: {String(getFuzzyKey(c, ["วันที่ซื้อ", "col_3"]) || '-')}
                                                    </span>
                                                    {c.computedExpireDate !== '-' && (
                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${c.daysLeft !== null && c.daysLeft < 0 ? 'text-rose-600 bg-rose-50 border border-rose-100' : c.isExpiringSoon ? 'text-amber-600 bg-amber-50 border border-amber-100' : 'text-gray-400 bg-gray-50 border border-gray-100'}`}>
                                                            <Clock size={9}/>
                                                            หมดอายุ: {c.computedExpireDate}
                                                        </span>
                                                    )}
                                                </div>
                                                {isPendingPayment && <p className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded inline-block">ค้างชำระ ฿{parseNumber(getFuzzyKey(c, "ยอดค้างชำระ")).toLocaleString()}</p>}
                                            </div>
                                            <div className="flex justify-between items-center pt-2 border-t border-gray-50 pl-2">
                                                <p className="text-xs text-gray-500">ใช้ไป {c.computedUsedQty}/{c.computedTotalQty}</p>
                                                <p className="text-sm font-black text-teal-600">เหลือ {c.computedRemainQty}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                                {getCustomerCourses(selectedCustomer.computedPhone).length === 0 && <div className="col-span-full text-center py-10 text-gray-400 text-sm font-bold">ยังไม่มีข้อมูลใบคอร์ส</div>}
                            </div>
                        </div>
                    )}
                    
                    {customerModalTab === 'timeline' && (
                        <div className="space-y-6">
                            {(() => {
                                const usages = getCustomerCourseUsage(selectedCustomer);
                                if (usages.length === 0) return <div className="text-center py-10 text-gray-400 text-sm font-bold">ไม่มีประวัติสำหรับไทม์ไลน์ภาพ</div>;
                                
                                const grouped = usages.reduce((acc, curr) => {
                                    const ref = String(getFuzzyKey(curr, ["อ้างอิง", "เลขที่ใบคอส", "col_6"]) || 'ไม่ระบุใบคอร์ส');
                                    if (!acc[ref]) acc[ref] = [];
                                    acc[ref].push(curr);
                                    return acc;
                                }, {});

                                return Object.entries(grouped).map(([ref, items], gIdx) => (
                                    <div key={gIdx} className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
                                        <h4 className="font-black text-gray-800 mb-4 flex items-center bg-gray-50 p-3 rounded-xl border border-gray-100"><Tag size={16} className="mr-2 text-teal-500"/> จากใบคอร์ส: {ref}</h4>
                                        <div className="space-y-6">
                                            {items.map((u, i) => {
                                                const type = String(getFuzzyKey(u, ["ประเภท", "col_4"]) || '');
                                                return (
                                                    <div key={i} className="flex flex-col md:flex-row gap-4 p-4 border border-gray-100 rounded-2xl bg-gray-50/50">
                                                        <div className="w-full md:w-1/3 flex flex-col justify-center">
                                                            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-bold w-max mb-2">{type}</span>
                                                            <p className="font-bold text-gray-800 text-sm mb-1">{String(getFuzzyKey(u, ["รายการ", "สินค้า", "col_23", "col_18"]) || '-')}</p>
                                                            <p className="text-xs text-gray-500 font-mono mb-2">{String(getFuzzyKey(u, ["วันที่", "col_1"]) || '-')} {u.เวลา || ''}</p>
                                                            <p className="text-[10px] text-gray-400">จนท: {String(getFuzzyKey(u, ["ชื่อเจ้าหน้าที่", "ชื่อพนักงาน", "staffName", "ผู้ให้บริการ", "เจ้าหน้าที่"]) || '-')}</p>
                                                        </div>
                                                        <div className="w-full md:w-2/3 grid grid-cols-2 gap-3">
                                                            {/* Before Image */}
                                                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-2 text-center bg-white relative overflow-hidden group">
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">ก่อนทำ (Before)</p>
                                                                {u.beforeImage ? (
                                                                    <div className="relative">
                                                                        <img src={u.beforeImage} className="w-full h-32 object-cover rounded-lg shadow-sm cursor-pointer" alt="Before" onClick={() => window.open(u.beforeImage, '_blank')} />
                                                                        <label className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg cursor-pointer transition-colors opacity-0 group-hover:opacity-100 shadow-md">
                                                                            <PenTool size={14}/>
                                                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(u.id, 'beforeImage', e.target.files[0])} />
                                                                        </label>
                                                                    </div>
                                                                ) : (
                                                                    <label className="w-full h-32 bg-gray-50 hover:bg-gray-100 transition-colors rounded-lg flex flex-col items-center justify-center cursor-pointer border border-gray-100">
                                                                        <Camera size={24} className="text-gray-300 mb-2" />
                                                                        <span className="text-[10px] text-gray-500 font-bold">เพิ่มรูปภาพ</span>
                                                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(u.id, 'beforeImage', e.target.files[0])} />
                                                                    </label>
                                                                )}
                                                            </div>
                                                            {/* After Image */}
                                                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-2 text-center bg-white relative overflow-hidden group">
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">หลังทำ (After)</p>
                                                                {u.afterImage ? (
                                                                    <div className="relative">
                                                                        <img src={u.afterImage} className="w-full h-32 object-cover rounded-lg shadow-sm cursor-pointer" alt="After" onClick={() => window.open(u.afterImage, '_blank')} />
                                                                        <label className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg cursor-pointer transition-colors opacity-0 group-hover:opacity-100 shadow-md">
                                                                            <PenTool size={14}/>
                                                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(u.id, 'afterImage', e.target.files[0])} />
                                                                        </label>
                                                                    </div>
                                                                ) : (
                                                                    <label className="w-full h-32 bg-gray-50 hover:bg-gray-100 transition-colors rounded-lg flex flex-col items-center justify-center cursor-pointer border border-gray-100">
                                                                        <ImageIcon size={24} className="text-gray-300 mb-2" />
                                                                        <span className="text-[10px] text-gray-500 font-bold">เพิ่มรูปภาพ</span>
                                                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(u.id, 'afterImage', e.target.files[0])} />
                                                                    </label>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    )}

                    {customerModalTab === 'courseUsage' && (
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <HistoryTable histories={getCustomerCourseUsage(selectedCustomer)} showActions={true} onRefund={handleRefundCourse} />
                        </div>
                    )}

                    {customerModalTab === 'products' && (
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <HistoryTable histories={getCustomerProducts(selectedCustomer)} showActions={true} onRefund={handleRefundCourse} />
                        </div>
                    )}

                    {customerModalTab === 'moles' && (
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            {(() => {
                                const moles = getCustomerMoles(selectedCustomer);
                                if (moles.length === 0) return <div className="text-center py-10 text-gray-400 text-sm font-bold">ไม่มีประวัติจี้ไฝ</div>;
                                return (
                                    <div className="divide-y divide-gray-100">
                                        {moles.map((m, i) => {
                                            const w = checkWarranty(getFuzzyKey(m, ["วันที่", "col_1"]));
                                            return (
                                                <div key={i} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <h4 className="font-bold text-gray-800 mb-1">{String(getFuzzyKey(m, ["รายการ", "สินค้า", "col_23", "col_18"]) || '-')}</h4>
                                                            <p className="text-[10px] text-gray-500 font-mono">ทำเมื่อ: {String(getFuzzyKey(m, ["วันที่", "col_1"]) || '-')} {m.เวลา||''}</p>
                                                        </div>
                                                        {w && (
                                                            <div className={`px-3 py-1.5 rounded-lg text-[10px] font-bold ${w.isCovered ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-100 text-gray-500'}`}>
                                                                {w.isCovered ? `อยู่ในประกัน (เหลือ ${w.daysLeft} วัน)` : 'หมดประกันแล้ว'}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      <ModalWrapper isOpen={isEditCustomerOpen} onClose={() => setIsEditCustomerOpen(false)} title="แก้ไขข้อมูลลูกค้า" icon={PenTool} colorClass="bg-indigo-100 text-indigo-600">
         <form onSubmit={handleEditCustomerSave} className="space-y-4">
             <InputField label="ชื่อลูกค้า" required placeholder="เช่น คุณสมหญิง..." value={editCustomerData.name} onChange={e => setEditCustomerData({...editCustomerData, name: e.target.value})} />
             <InputField label="เบอร์โทรศัพท์" required placeholder="08X-XXX-XXXX" value={editCustomerData.phone} onChange={e => setEditCustomerData({...editCustomerData, phone: e.target.value})} />
             <InputField label="ปัญหาผิวหน้า (ถ้ามี)" placeholder="เช่น สิว, ฝ้า..." value={editCustomerData.issue} onChange={e => setEditCustomerData({...editCustomerData, issue: e.target.value})} />
             <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl mt-4 shadow-lg active:scale-95 transition-all">อัปเดตข้อมูลลูกค้า</button>
         </form>
      </ModalWrapper>

      {/* Add Customer Modal */}
      <ModalWrapper isOpen={isAddCustomerOpen} onClose={() => setIsAddCustomerOpen(false)} title="เพิ่มลูกค้าใหม่" icon={UserPlus} colorClass="bg-indigo-100 text-indigo-600">
         <form onSubmit={handleAddCustomer} className="space-y-4">
             <InputField label="ชื่อลูกค้า" required placeholder="เช่น คุณสมหญิง..." value={newCustomerForm.name} onChange={e => setNewCustomerForm({...newCustomerForm, name: e.target.value})} />
             <InputField label="เบอร์โทรศัพท์" required placeholder="08X-XXX-XXXX" value={newCustomerForm.phone} onChange={e => setNewCustomerForm({...newCustomerForm, phone: e.target.value})} />
             <InputField label="ปัญหาผิวหน้า (ถ้ามี)" placeholder="เช่น สิว, ฝ้า..." value={newCustomerForm.issue} onChange={e => setNewCustomerForm({...newCustomerForm, issue: e.target.value})} />
             <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl mt-4 shadow-lg active:scale-95 transition-all">บันทึกข้อมูลลูกค้า</button>
         </form>
      </ModalWrapper>

      {/* Add Course Modal */}
      <ModalWrapper isOpen={isAddCourseOpen} onClose={() => setIsAddCourseOpen(false)} title="เปิดคอร์สใหม่" icon={FileText} colorClass="bg-teal-100 text-teal-600" noMaxHeight={true}>
         <form onSubmit={handleCreateCourse} className="space-y-4 max-h-[70vh] overflow-y-auto px-1 hide-scrollbar">
             <InputField label="เบอร์โทรลูกค้า" required placeholder="ค้นหาจากเบอร์โทร..." value={newCourseForm.phone} onChange={e => setNewCourseForm({...newCourseForm, phone: e.target.value})} />
             <div>
         <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">ชื่อคอร์ส <span className="text-red-500">*</span></label>
         <select 
           required 
           value={newCourseForm.name} 
           onChange={(e) => {
             const selectedName = e.target.value;
             const selectedMC = masterCourses.find(mc => String(getFuzzyKey(mc, ["ชื่อคอส", "col_4"]) || '') === selectedName);
             if (selectedMC) {
               const mcPrice = parseNumber(getFuzzyKey(selectedMC, ["ราคา", "col_5"]));
               const mcQty = parseQty(getFuzzyKey(selectedMC, ["จำนวนครั้งที่ได้", "col_13"]));
               setNewCourseForm({
                 ...newCourseForm,
                 name: selectedName,
                 price: String(mcPrice || ''),
                 qty: String(mcQty || '1'),
                 credit: String(mcPrice || '')
               });
             } else {
               setNewCourseForm({...newCourseForm, name: selectedName});
             }
           }}
           className="w-full border-2 border-gray-100 bg-gray-50/50 rounded-xl p-3 outline-none focus:border-blue-400 focus:bg-white transition-all font-medium text-gray-800"
         >
           <option value="">-- เลือกคอร์สโปรโมชั่น --</option>
           {filteredMasterCourses.map((mc, idx) => {
             const mcName = String(getFuzzyKey(mc, ["ชื่อคอส", "col_4"]) || '');
             const mcCode = String(getFuzzyKey(mc, ["รหัสคอส", "col_1"]) || '');
             const mcPrice = parseNumber(getFuzzyKey(mc, ["ราคา", "col_5"]));
             return (
               <option key={mc.id || idx} value={mcName}>
                 {mcCode} - {mcName} (฿{mcPrice.toLocaleString()})
               </option>
             );
           })}
         </select>
         <p className="text-[10px] text-gray-400 mt-1">หรือพิมพ์ชื่อคอร์สเองหากไม่อยู่ในรายการ</p>
      </div>
      <InputField label="หรือระบุชื่อคอร์สเอง" placeholder="พิมพ์ชื่อคอร์สเอง (ถ้าไม่อยู่ในรายการ)" value={newCourseForm.name} onChange={e => setNewCourseForm({...newCourseForm, name: e.target.value})} />
             <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">สาขาที่ซื้อ <span className="text-red-500">*</span></label>
                   <select required value={newCourseForm.branch} onChange={e => setNewCourseForm({...newCourseForm, branch: e.target.value})} className="w-full border-2 border-gray-100 bg-gray-50/50 rounded-xl p-3 outline-none focus:border-blue-400 focus:bg-white transition-all font-medium text-gray-800">
                     {BRANCHES.map(br => <option key={br} value={br}>{br}</option>)}
                   </select>
                 </div>
                 <InputField label="จำนวนครั้ง" required type="number" min="1" value={newCourseForm.qty} onChange={e => setNewCourseForm({...newCourseForm, qty: e.target.value})} />
             </div>
             <div className="grid grid-cols-2 gap-4">
                 <InputField label="ราคาเต็ม (บาท)" required type="number" min="0" value={newCourseForm.price} onChange={e => setNewCourseForm({...newCourseForm, price: e.target.value})} />
                 <InputField label="เครดิต (ถ้ามี)" type="number" min="0" placeholder="ใส่ถ้าเป็น Voucher" value={newCourseForm.credit} onChange={e => setNewCourseForm({...newCourseForm, credit: e.target.value})} />
             </div>
             <InputField label="ยอดค้างชำระ (บาท)" type="number" min="0" value={newCourseForm.pending} onChange={e => setNewCourseForm({...newCourseForm, pending: e.target.value})} />
             <button type="submit" className="w-full bg-teal-500 hover:bg-teal-600 text-white font-black py-3 rounded-xl mt-4 shadow-lg active:scale-95 transition-all">เปิดคอร์สใหม่</button>
         </form>
      </ModalWrapper>

      {/* General Booking Modal */}
      <ModalWrapper isOpen={isGeneralBookingOpen} onClose={() => setIsGeneralBookingOpen(false)} title="เพิ่มนัดหมายใหม่ (คิว)" icon={CalendarPlus} colorClass="bg-blue-100 text-blue-600">
         <form onSubmit={submitGeneralBooking} className="space-y-4">
             <InputField label="ชื่อลูกค้า" required placeholder="ชื่อลูกค้า..." value={generalBookingForm.name} onChange={e => setGeneralBookingForm({...generalBookingForm, name: e.target.value})} />
             <InputField label="เบอร์โทรศัพท์" required placeholder="08X-XXX-XXXX" value={generalBookingForm.phone} onChange={e => setGeneralBookingForm({...generalBookingForm, phone: e.target.value})} />
             <InputField label="บริการ/เรื่องที่นัดหมาย" required placeholder="เช่น เลเซอร์, ติดตามผล..." value={generalBookingForm.service} onChange={e => setGeneralBookingForm({...generalBookingForm, service: e.target.value})} />
             <div>
               <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">สาขา <span className="text-red-500">*</span></label>
               <select required value={generalBookingForm.branch} onChange={e => setGeneralBookingForm({...generalBookingForm, branch: e.target.value})} className="w-full border-2 border-gray-100 bg-gray-50/50 rounded-xl p-3 outline-none focus:border-blue-400 focus:bg-white transition-all font-medium text-gray-800">
                 {BRANCHES.map(br => <option key={br} value={br}>{br}</option>)}
               </select>
             </div>
             <InputField label="วันที่และเวลา" required type="datetime-local" value={generalBookingForm.dateTime} onChange={e => setGeneralBookingForm({...generalBookingForm, dateTime: e.target.value})} />
             <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl mt-4 shadow-lg active:scale-95 transition-all">บันทึกนัดหมาย</button>
         </form>
      </ModalWrapper>

      {/* Add Product Modal */}
      <ModalWrapper isOpen={isAddProductOpen} onClose={() => setIsAddProductOpen(false)} title="เพิ่มสินค้าใหม่" icon={Package} colorClass="bg-orange-100 text-orange-600">
         <form onSubmit={handleAddProduct} className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                 <InputField label="รหัสสินค้า" required placeholder="เช่น P001" value={newProductForm.code} onChange={e => setNewProductForm({...newProductForm, code: e.target.value})} />
                 <InputField label="หมวดหมู่" required value={newProductForm.category} onChange={e => setNewProductForm({...newProductForm, category: e.target.value})} />
             </div>
             <InputField label="ชื่อสินค้า" required value={newProductForm.name} onChange={e => setNewProductForm({...newProductForm, name: e.target.value})} />
             <div className="grid grid-cols-2 gap-4">
                 <InputField label="ราคาเต็ม" required type="number" min="0" value={newProductForm.price} onChange={e => setNewProductForm({...newProductForm, price: e.target.value})} />
                 <InputField label="ราคาสมาชิก" type="number" min="0" value={newProductForm.memberPrice} onChange={e => setNewProductForm({...newProductForm, memberPrice: e.target.value})} />
             </div>
             <div className="grid grid-cols-2 gap-4">
                 <InputField label="จำนวนเริ่มต้น" required type="number" min="0" value={newProductForm.stock} onChange={e => setNewProductForm({...newProductForm, stock: e.target.value})} />
                 <InputField label="หน่วยนับ" required value={newProductForm.unit} onChange={e => setNewProductForm({...newProductForm, unit: e.target.value})} />
             </div>
             <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-3 rounded-xl mt-4 shadow-lg active:scale-95 transition-all">เพิ่มสินค้า</button>
         </form>
      </ModalWrapper>

      {/* Add Order Modal */}
      <ModalWrapper isOpen={isAddOrderOpen} onClose={() => setIsAddOrderOpen(false)} title="สร้างคำสั่งซื้อ / ขออนุมัติคอร์ส" icon={ShoppingCart} colorClass="bg-amber-100 text-amber-600">
         <form onSubmit={submitCreateOrder} className="space-y-4">
             <InputField label="เบอร์โทรลูกค้า" required placeholder="08X-XXX-XXXX" value={newOrderForm.customerPhone} onChange={e => setNewOrderForm({...newOrderForm, customerPhone: e.target.value})} />
             <InputField label="ชื่อลูกค้า" placeholder="ชื่อ..." value={newOrderForm.customerName} onChange={e => setNewOrderForm({...newOrderForm, customerName: e.target.value})} />
             <InputField label="ชื่อคอร์ส / สินค้า" required placeholder="แพ็กเกจ..." value={newOrderForm.courseName} onChange={e => setNewOrderForm({...newOrderForm, courseName: e.target.value})} />
             <div className="grid grid-cols-2 gap-4">
                 <InputField label="ราคา (บาท)" required type="number" min="0" value={newOrderForm.price} onChange={e => setNewOrderForm({...newOrderForm, price: e.target.value})} />
                 <InputField label="เครดิต/วงเงิน (บาท)" type="number" min="0" value={newOrderForm.credit} onChange={e => setNewOrderForm({...newOrderForm, credit: e.target.value})} />
             </div>
             <div className="grid grid-cols-2 gap-4">
                 <InputField label="จำนวนครั้ง" required type="number" min="1" value={newOrderForm.qty} onChange={e => setNewOrderForm({...newOrderForm, qty: e.target.value})} />
                 <div>
                   <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">สาขา <span className="text-red-500">*</span></label>
                   <select required value={newOrderForm.branch} onChange={e => setNewOrderForm({...newOrderForm, branch: e.target.value})} className="w-full border-2 border-gray-100 bg-gray-50/50 rounded-xl p-3 outline-none focus:border-blue-400 focus:bg-white transition-all font-medium text-gray-800">
                     {BRANCHES.map(br => <option key={br} value={br}>{br}</option>)}
                   </select>
                 </div>
             </div>
             <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-3 rounded-xl mt-4 shadow-lg active:scale-95 transition-all">ส่งคำขออนุมัติ</button>
         </form>
      </ModalWrapper>

      {/* 🌟 Use Course / Product Withdrawal Modal 🌟 */}
      {useCourseModal.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
           <div className="bg-white w-full max-w-2xl rounded-[32px] p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-gray-800 flex items-center">
                    <div className="p-2 rounded-xl mr-3 bg-teal-100 text-teal-600"><CheckCircle size={20} /></div>
                    ตัดคอร์ส / เบิกสินค้า
                </h3>
                <button type="button" onClick={() => setUseCourseModal({ isOpen: false, customer: null, targetCourseId: null })} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100"><X size={20}/></button>
              </div>
              
              <form onSubmit={submitUseCourse} className="space-y-6">
                {/* Customer Info */}
                <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-100">
                  <p className="text-[10px] font-bold text-teal-500 uppercase tracking-wider mb-1">ลูกค้า</p>
                  <p className="font-black text-gray-800 text-lg">{useCourseModal.customer?.computedName || 'ไม่ระบุ'}</p>
                  <p className="text-xs text-gray-500 font-mono">{useCourseModal.customer?.computedPhone || '-'}</p>
                  {useCourseModal.customer?.isApproved && (
                    <span className="inline-block mt-2 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-bold">⭐ VIP Member</span>
                  )}
                </div>

                {/* Branch Selection */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">สาขาที่ให้บริการ <span className="text-red-500">*</span></label>
                  <select required value={useCourseData.branch} onChange={e => setUseCourseData({...useCourseData, branch: e.target.value})} className="w-full border-2 border-gray-100 bg-gray-50/50 rounded-xl p-3 outline-none focus:border-blue-400 focus:bg-white transition-all font-medium text-gray-800">
                    {BRANCHES.map(br => <option key={br} value={br}>{br}</option>)}
                  </select>
                </div>

                {/* Staff Name */}
                <InputField label="ชื่อพนักงานผู้ให้บริการ" required placeholder="ชื่อพนักงาน..." value={useCourseData.staffName} onChange={e => setUseCourseData({...useCourseData, staffName: e.target.value})} />

                {/* Course Selections */}
                <div>
                  <h4 className="font-black text-gray-800 mb-3 flex items-center"><FileText size={16} className="mr-2 text-teal-500"/> เลือกคอร์สที่จะใช้บริการ</h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {getCustomerCourses(useCourseModal.customer?.computedPhone || '').filter(c => c.computedRemainQty > 0).map(course => (
                      <div key={course.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div className="flex-1">
                          <p className="font-bold text-gray-800 text-sm">{String(getFuzzyKey(course, ["ชื่อคอส", "col_8"]) || '-')}</p>
                          <p className="text-[10px] text-gray-500">คงเหลือ {course.computedRemainQty} ครั้ง</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => handleQtyChange(course.id, -1, course.computedRemainQty)} className="w-8 h-8 bg-white border border-gray-200 rounded-lg font-bold text-gray-600 hover:bg-gray-100">-</button>
                          <span className="font-black text-gray-800 w-8 text-center">{useCourseData.selections[course.id] || 0}</span>
                          <button type="button" onClick={() => handleQtyChange(course.id, 1, course.computedRemainQty)} className="w-8 h-8 bg-teal-500 text-white rounded-lg font-bold hover:bg-teal-600">+</button>
                        </div>
                      </div>
                    ))}
                    {getCustomerCourses(useCourseModal.customer?.computedPhone || '').filter(c => c.computedRemainQty > 0).length === 0 && (
                      <p className="text-center text-gray-400 text-sm py-4">ไม่พบคอร์สที่ยังเหลือครั้งให้ใช้บริการ</p>
                    )}
                  </div>
                </div>

                {/* Product Selections */}
                <div>
                  <h4 className="font-black text-gray-800 mb-3 flex items-center"><Package size={16} className="mr-2 text-orange-500"/> เบิกสินค้า</h4>
                  <div className="space-y-3">
                    {(useCourseData.productSelections || []).map((pSel, idx) => {
                      const selectedProduct = products.find(p => p.id === pSel.productId);
                      const isVip = useCourseModal.customer?.isApproved === true;
                      const discountRate = selectedProduct ? (isVip ? getVipDiscountRate(selectedProduct) : 0) : 0;
                      const basePrice = selectedProduct ? (parseNumber(getFuzzyKey(selectedProduct, ["ราคาสมาชิก", "col_10"])) || parseNumber(getFuzzyKey(selectedProduct, ["ราคาขายเต็ม", "ราคา", "col_6"]))) : 0;
                      const finalPrice = basePrice * (1 - discountRate);
                      return (
                        <div key={pSel.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                          <select value={pSel.productId} onChange={e => updateProductSelection(pSel.id, 'productId', e.target.value)} className="flex-1 border-2 border-gray-100 bg-white rounded-xl p-2 text-sm font-bold outline-none focus:border-orange-400">
                            <option value="">-- เลือกสินค้า --</option>
                            {filteredProducts.map(prod => (
                              <option key={prod.id} value={prod.id}>
                                {String(getFuzzyKey(prod, ["ชื่อสินค้า", "col_2"]) || '-')} (฿{parseNumber(getFuzzyKey(prod, ["ราคาสมาชิก", "col_10"]) || getFuzzyKey(prod, ["ราคาขายเต็ม", "ราคา", "col_6"])).toLocaleString()})
                              </option>
                            ))}
                          </select>
                          <input type="number" min="1" value={pSel.qty} onChange={e => updateProductSelection(pSel.id, 'qty', Math.max(1, parseInt(e.target.value) || 1))} className="w-16 border-2 border-gray-100 bg-white rounded-xl p-2 text-sm font-bold text-center outline-none" />
                          <button type="button" onClick={() => removeProductSelection(pSel.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><X size={16}/></button>
                          {selectedProduct && (
                            <div className="text-right min-w-[80px]">
                              <div className="text-[10px] text-gray-400 line-through">฿{basePrice.toLocaleString()}</div>
                              <div className={`text-xs font-black ${discountRate > 0 ? 'text-orange-600' : 'text-gray-800'}`}>
                                ฿{finalPrice.toLocaleString()}
                                {discountRate > 0 && <span className="ml-1 text-[9px] bg-orange-100 text-orange-600 px-1 py-0.5 rounded font-bold">VIP -{Math.round(discountRate * 100)}%</span>}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <button type="button" onClick={addProductSelection} className="w-full py-2.5 border-2 border-dashed border-orange-200 text-orange-500 rounded-xl text-sm font-bold hover:bg-orange-50 transition-colors flex items-center justify-center">
                      <Plus size={16} className="mr-1"/> เพิ่มรายการเบิกสินค้า
                    </button>
                  </div>
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">รูปถ่ายลูกค้า (ถ้ามี)</label>
                  <input type="file" accept="image/*" capture="environment" onChange={handleCapturePhoto} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" />
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SignaturePad canvasRef={custSigRef} label="ลายเซ็นลูกค้า" />
                  <SignaturePad canvasRef={staffSigRef} label="ลายเซ็นพนักงาน" />
                </div>

                <button type="submit" className="w-full bg-teal-500 hover:bg-teal-600 text-white font-black py-3 rounded-xl mt-4 shadow-lg active:scale-95 transition-all text-lg flex items-center justify-center">
                  <CheckCircle className="mr-2"/> ยืนยันการรับบริการ / เบิกสินค้า
                </button>
              </form>
           </div>
        </div>
      )}

      {/* Check In Modal */}
      <ModalWrapper isOpen={isCheckInOpen} onClose={() => setIsCheckInOpen(false)} title="เช็คอินรับบริการ" icon={ScanLine} colorClass="bg-emerald-100 text-emerald-600">
         <form onSubmit={handleCheckInSubmit} className="space-y-4">
             <InputField label="เบอร์โทรศัพท์ หรือ รหัสอ้างอิง" required placeholder="ค้นหาจากเบอร์ หรือ รหัสจอง..." value={checkInInput} onChange={e => setCheckInInput(e.target.value)} />
             <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3 rounded-xl mt-4 shadow-lg active:scale-95 transition-all text-lg flex items-center justify-center"><CheckCircle className="mr-2"/> ยืนยันการเช็คอิน</button>
         </form>
      </ModalWrapper>

      {/* Confirmation Modal */}
      {actionConfirmModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
           <div className="bg-white w-full max-w-sm rounded-[32px] p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={32}/></div>
              <h3 className="text-xl font-black text-gray-800 mb-2">{actionConfirmModal.title}</h3>
              <p className="text-sm text-gray-500 mb-6">{actionConfirmModal.message}</p>
              <div className="flex gap-3">
                 <button onClick={() => setActionConfirmModal({ isOpen: false, title: '', message: '', action: null })} className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors">ยกเลิก</button>
                 <button onClick={() => { if(actionConfirmModal.action) actionConfirmModal.action(); setActionConfirmModal({ isOpen: false, title: '', message: '', action: null }); }} className={`flex-1 px-4 py-3 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 ${actionConfirmModal.confirmColor}`}>{actionConfirmModal.confirmText}</button>
              </div>
           </div>
        </div>
      )}

      {/* Progress Overlay */}
      {(deleteProgress.isDeleting || isCloudLoading) && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
           <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full border border-gray-100">
              <div className="inline-block mb-4 relative">
                 <div className="w-16 h-16 border-4 border-gray-100 rounded-full"></div>
                 <div className="w-16 h-16 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-2">{isCloudLoading ? 'กำลังซิงค์ข้อมูล Cloud...' : `กำลังลบข้อมูล ${deleteProgress.type}...`}</h3>
              <p className="text-gray-500 text-sm font-medium mb-4">กรุณารอสักครู่ ห้ามปิดหน้าต่างนี้</p>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
                 <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-300" style={{ width: `${isCloudLoading ? loadingProgress : (deleteProgress.current / (deleteProgress.total || 1)) * 100}%` }}></div>
              </div>
              <p className="text-xs font-bold text-gray-400 font-mono">{isCloudLoading ? `${loadingProgress}%` : `${deleteProgress.current} / ${deleteProgress.total}`}</p>
           </div>
        </div>
      )}

      {/* QR Code Ticket Modal */}
      {bookingTicket && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm" onClick={() => setBookingTicket(null)}>
           <div className="bg-white w-full max-w-xs rounded-[32px] p-6 shadow-2xl animate-in zoom-in-95 text-center relative overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
              <h3 className="font-black text-xl text-gray-800 mb-2 mt-2">ตั๋วนัดหมาย</h3>
              <p className="text-xs text-gray-500 mb-6">{bookingTicket.courseName}</p>
              
              <div className="bg-white p-4 rounded-2xl border-2 border-gray-800 mb-6 inline-block">
                  <QrCode size={120} className="text-gray-900" />
              </div>
              
              <div className="text-left bg-gray-50 p-4 rounded-xl mb-6">
                 <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">ชื่อลูกค้า</p>
                 <p className="font-bold text-gray-800 text-sm mb-3">{bookingTicket.customerName}</p>
                 <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">วันที่และเวลา</p>
                 <p className="font-bold text-gray-800 text-sm">{formatDateTimeStr(getSafeDateTime(bookingTicket))}</p>
              </div>
              <button onClick={() => setBookingTicket(null)} className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-700 transition-colors">ปิดหน้าต่าง</button>
           </div>
        </div>
      )}

      {/* 🌟 Duplicate Detection Modal 🌟 */}
      {duplicateDialog.isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[32px] p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mr-3">
                  <AlertTriangle size={20} className="text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-800">พบรายการซ้ำ!</h3>
                  <p className="text-xs text-gray-500">มีข้อมูลบางรายการที่ตรงกับข้อมูลเดิมในระบบ</p>
                </div>
              </div>
              <button onClick={() => setDuplicateDialog({ isOpen: false, newItems: [], duplicateItems: [], typeName: '', onConfirm: null })} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mb-4">
              {/* รายการใหม่ */}
              {duplicateDialog.newItems.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <CheckCircle size={16} className="text-emerald-500 mr-2" />
                    <span className="text-sm font-bold text-emerald-700">รายการใหม่ {duplicateDialog.newItems.length} รายการ</span>
                  </div>
                  <div className="bg-emerald-50/50 rounded-xl p-3 text-xs text-gray-600">
                    รายการเหล่านี้จะถูกเพิ่มเข้าสู่ระบบ
                  </div>
                </div>
              )}

              {/* รายการซ้ำ */}
              {duplicateDialog.duplicateItems.length > 0 && (
                <div>
                  <div className="flex items-center mb-2">
                    <AlertTriangle size={16} className="text-amber-500 mr-2" />
                    <span className="text-sm font-bold text-amber-700">รายการซ้ำ {duplicateDialog.duplicateItems.length} รายการ</span>
                  </div>
                  <div className="bg-amber-50/50 rounded-xl p-3 max-h-40 overflow-y-auto">
                    {duplicateDialog.duplicateItems.slice(0, 10).map((item, idx) => {
                      const key = getDuplicateKey(duplicateDialog.typeName, item);
                      return (
                        <div key={idx} className="text-xs text-gray-600 py-1 border-b border-amber-100 last:border-0">
                          {key || `รายการ #${idx + 1}`}
                        </div>
                      );
                    })}
                    {duplicateDialog.duplicateItems.length > 10 && (
                      <div className="text-xs text-gray-400 text-center mt-2">
                        ...แสดง 10 จาก {duplicateDialog.duplicateItems.length} รายการ
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ปุ่มเลือกการดำเนินการ */}
            <div className="space-y-2 pt-4 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-500 mb-2">เลือกการดำเนินการ:</p>
              
              {/* ปุ่ม 1: เพิ่มเฉพาะรายการใหม่ */}
              {duplicateDialog.newItems.length > 0 && (
                <button
                  onClick={() => duplicateDialog.onConfirm(duplicateDialog.newItems, 'skip')}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center transition-colors active:scale-[0.98]"
                >
                  <CheckCircle size={18} className="mr-2" />
                  เพิ่มเฉพาะรายการใหม่ ({duplicateDialog.newItems.length} รายการ)
                </button>
              )}

              {/* ปุ่ม 2: อัพเดทรายการซ้ำ */}
              {duplicateDialog.duplicateItems.length > 0 && (
                <button
                  onClick={() => duplicateDialog.onConfirm([...duplicateDialog.newItems, ...duplicateDialog.duplicateItems], 'update')}
                  className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center transition-colors active:scale-[0.98]"
                >
                  <RefreshCcw size={18} className="mr-2" />
                  อัพเดทรายการซ้ำ + เพิ่มรายการใหม่ ({duplicateDialog.newItems.length + duplicateDialog.duplicateItems.length} รายการ)
                </button>
              )}

              {/* ปุ่ม 3: ยกเลิก */}
              <button
                onClick={() => setDuplicateDialog({ isOpen: false, newItems: [], duplicateItems: [], typeName: '', onConfirm: null })}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl flex items-center justify-center transition-colors active:scale-[0.98]"
              >
                <X size={18} className="mr-2" />
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
