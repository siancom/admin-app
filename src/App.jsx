import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Upload, Search, Filter, Home, FileText, Users, Settings, 
  CreditCard, Plus, Eye, CheckCircle, Clock, 
  QrCode, LogOut, Menu, X, Tag,
  TrendingUp, MapPin, Award, AlertCircle, Banknote, Activity, Phone, PieChart, History as HistoryIcon, Printer, ShoppingBag, ArrowLeft, HeartPulse, ChevronRight, CalendarPlus, UserPlus, Sparkles
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';

// --- FIREBASE CONFIG (ของคุณ) ---
const firebaseConfig = {
  apiKey: "AIzaSyBS3zKEA6zosmy8tLRTyJ38BPLlUQS30gU",
  authDomain: "iris-clinic-app.firebaseapp.com",
  projectId: "iris-clinic-app",
  storageBucket: "iris-clinic-app.firebasestorage.app",
  messagingSenderId: "372749467528",
  appId: "1:372749467528:web:1e90ecab74274ec965843d",
  measurementId: "G-BQW1W46XSH"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 🌟 แก้ไข: บังคับให้ใช้ชื่อ Path คงที่เสมอ ป้องกันปัญหา Localhost กับ Vercel ดึงข้อมูลคนละที่
const appId = 'iris-clinic-app';

// --- UTILS & PARSERS ---
function parseNumber(val) {
  if (val === undefined || val === null || val === '') return 0;
  const cleaned = String(val).replace(/,/g, '').replace(/[^\d.-]/g, '').trim();
  return parseFloat(cleaned) || 0;
}

function parseCSVRow(text) {
  let ret = [''], i = 0, p = '', s = true;
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

function getFuzzyKey(obj, targetKeys) {
  if (!obj) return undefined;
  const targets = Array.isArray(targetKeys) ? targetKeys : [targetKeys];
  for (let target of targets) {
    if (obj[target] !== undefined) return obj[target];
    const cleanTarget = target.replace(/\s/g, '').toLowerCase();
    const foundKey = Object.keys(obj).find(k => {
        const cleanK = k.replace(/[\s\u200B-\u200D\uFEFF"'\r\n]/g, '').toLowerCase();
        return cleanK === cleanTarget || cleanK.includes(cleanTarget);
    });
    if (foundKey) return obj[foundKey];
  }
  return undefined;
}

function normalizeCourse(course) {
  const total = parseNumber(getFuzzyKey(course, ["จำนวนครั้งที่ได้", "col_10"]));
  const used = parseNumber(getFuzzyKey(course, ["ครั้งที่ใช้", "col_5"]));
  const rawRemaining = getFuzzyKey(course, ["ครั้งที่เหลือดิบ", "ครั้งที่เหลือ", "col_4"]) !== undefined ? parseNumber(getFuzzyKey(course, ["ครั้งที่เหลือดิบ", "ครั้งที่เหลือ", "col_4"])) : 0;
  const totalUsed = rawRemaining + used;
  const remaining = Math.max(0, total - totalUsed);
  let status = "ยังคงเหลือ";
  if (remaining <= 0 && total > 0) status = "ใช้ครบแล้ว";
  
  return {
    ...course,
    "ครั้งที่เหลือดิบ": rawRemaining.toString(),
    "รวมใช้งานแล้ว": totalUsed.toString(),
    "ครั้งที่เหลือ": remaining.toString(),
    "ครั้งที่ใช้": used.toString(),
    "สถานะ": status
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toastMessage, setToastMessage] = useState('');
  
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    if (window.innerWidth >= 1024) setSidebarOpen(true);
  }, []);

  // --- 🌟 STATE สำหรับเก็บข้อมูลจาก Firebase 🌟 ---
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [customersRaw, setCustomersRaw] = useState([]);
  const [histories, setHistories] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCustomerStatus, setFilterCustomerStatus] = useState('all'); 
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerModalTab, setCustomerModalTab] = useState('courses'); 
  const [isPrintMode, setIsPrintMode] = useState(false);

  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ ชื่อ: '', เบอร์โทร: '', ปัญหาผิวหน้า: '' });
  const [bookingCourse, setBookingCourse] = useState(null);
  
  const courseInputRef = useRef(null);
  const customerInputRef = useRef(null);
  const historyInputRef = useRef(null);

  // --- 🚀 FIREBASE SETUP: ตรวจสอบสิทธิ์ & ดึงข้อมูล Realtime 🚀 ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        const signInWithRetry = async (retries = 3, delay = 1000) => {
          try {
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
              try {
                await signInWithCustomToken(auth, __initial_auth_token);
              } catch (tokenErr) {
                console.warn("Custom token mismatch (using custom Firebase project). Falling back to anonymous auth.", tokenErr);
                await signInAnonymously(auth);
              }
            } else {
              await signInAnonymously(auth);
            }
          } catch (error) {
            if (error.code === 'auth/too-many-requests' && retries > 0) {
              console.warn(`Too many requests, retrying in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              return signInWithRetry(retries - 1, delay * 2);
            }
            throw error;
          }
        };

        await signInWithRetry();
      } catch (error) {
        console.error("Auth error after retries:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // 1. ดึงข้อมูลคอร์ส
    const unsubCourses = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'courses'), (snapshot) => {
      setCourses(snapshot.docs.map(doc => normalizeCourse({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("Course fetch error:", err));

    // 2. ดึงข้อมูลลูกค้า
    const unsubCustomers = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'customers'), (snapshot) => {
      setCustomersRaw(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("Customer fetch error:", err));

    // 3. ดึงประวัติ
    const unsubHistories = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'histories'), (snapshot) => {
      setHistories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("History fetch error:", err));

    return () => { unsubCourses(); unsubCustomers(); unsubHistories(); };
  }, [user]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // --- อัปเดตฟังก์ชันต่างๆ ให้บันทึกลง Firebase ---
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomerForm.ชื่อ || !newCustomerForm.เบอร์โทร) return;
    
    const newId = `Irismember${Math.floor(Math.random()*10000)}`;
    const newCust = {
      "ชื่อ": newCustomerForm.ชื่อ,
      "เบอร์โทร": newCustomerForm.เบอร์โทร,
      "ปัญหาผิวหน้า": newCustomerForm.ปัญหาผิวหน้า,
      "หมายเลขใบสะสม": newId,
      "ยอดสะสม": "0",
      "สถานะสมาชิก": "ยังไม่สะสมยอด"
    };
    
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'customers'), newCust);
      setIsAddCustomerOpen(false);
      setNewCustomerForm({ ชื่อ: '', เบอร์โทร: '', ปัญหาผิวหน้า: '' });
      showToast('เพิ่มลูกค้าใหม่ลงฐานข้อมูลสำเร็จ!');
    } catch (err) {
      showToast(`เกิดข้อผิดพลาด: ${err.message}`);
    }
  };

  const handleBuyCourseAgain = async (customer) => {
    const newCourse = normalizeCourse({
      "เบอร์โทร": getFuzzyKey(customer, ["เบอร์โทร", "col_3"]), 
      "เลขที่ใบคอส": `IrisCourse${Math.floor(Math.random()*10000)}`, 
      "วันที่ซื้อ": new Date().toLocaleDateString('th-TH'), 
      "ครั้งที่เหลือดิบ": "5", "ครั้งที่ใช้": "0", "สถานะ": "ยังคงเหลือ", 
      "สาขาที่ซื้อ": "เฉวง", "ชื่อคอส": "คอร์สใหม่ (เพิ่มจากระบบ)", 
      "ผู้ซื้อคอส": getFuzzyKey(customer, ["ชื่อ", "col_1"]), "ราคา": "1500", "จำนวนครั้งที่ได้": "5", 
      "ยอดชำระแล้วทั้งหมด": "1500", "ยอดค้างชำระ": "0", "ประเภทการชำระ": "จ่ายเต็ม", "รายการที่ได้รับ": "ทรีทเม้นท์ 5 ครั้ง"
    });

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'courses'), newCourse);
      showToast(`เพิ่มคอร์สใหม่ให้คุณ ${getFuzzyKey(customer, ["ชื่อ", "col_1"])} ลงฐานข้อมูลสำเร็จ!`);
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleApproveCustomer = async (customer) => {
    if (!customer.id) return showToast('ข้อผิดพลาด: ไม่พบ ID ลูกค้าในระบบคลาวด์');

    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customers', customer.id), {
        "สถานะสมาชิก": "สมาชิกระดับ VIP"
      });
      // อัปเดตหน้าจอทันทีเพื่อความรวดเร็ว
      setSelectedCustomer(prev => ({ ...prev, "สถานะสมาชิก": "สมาชิกระดับ VIP", isApproved: true }));
      showToast('อนุมัติสิทธิ์ VIP และบันทึกลงฐานข้อมูลสำเร็จ!');
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการอนุมัติสิทธิ์');
    }
  };

  const handleUseSession = async (course) => {
    if (getFuzzyKey(course, "สถานะ") !== 'ยังคงเหลือ') return;
    if (!course.id) return showToast('ข้อผิดพลาด: ไม่พบ ID คอร์สในระบบคลาวด์');

    try {
      const currentUsed = parseNumber(getFuzzyKey(course, ["ครั้งที่ใช้", "col_5"]));
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'courses', course.id), {
        "ครั้งที่ใช้": (currentUsed + 1).toString()
      });
      
      const updated = normalizeCourse({ ...course, "ครั้งที่ใช้": (currentUsed + 1).toString() });
      setSelectedCourse(updated);
      showToast('บันทึกการตัดคอร์ส 1 ครั้ง ลงฐานข้อมูลสำเร็จ!');
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการตัดคอร์ส');
    }
  };

  const handleCSVUpload = async (e, typeName) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      let text = evt.target.result;
      text = text.replace(/^\uFEFF/, ''); 
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length < 2) return showToast('ไฟล์ CSV ไม่มีข้อมูล');
      
      const rawHeaders = parseCSVRow(lines[0]);
      const headers = rawHeaders.map(h => h.replace(/^["']|["']$/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim());
      
      const parsedData = [];
      for (let i = 1; i < lines.length; i++) {
        const row = parseCSVRow(lines[i]);
        if (row.length === 1 && row[0].trim() === '') continue;
        
        let obj = {};
        headers.forEach((header, index) => {
          let val = row[index] !== undefined ? row[index] : '';
          val = String(val).replace(/^["']|["']$/g, '').trim();
          if (header) obj[header] = val;
          obj[`col_${index + 1}`] = val;
        });
        
        if (typeName === 'คอร์ส') parsedData.push(normalizeCourse(obj));
        else parsedData.push(obj); 
      }

      // บันทึกขึ้น Firebase ทีละรายการ
      try {
        showToast(`กำลังบันทึก ${parsedData.length} รายการเข้าคลาวด์...`);
        const collectionName = typeName === 'คอร์ส' ? 'courses' : typeName === 'ฐานลูกค้า' ? 'customers' : 'histories';
        const colRef = collection(db, 'artifacts', appId, 'public', 'data', collectionName);
        
        // Loop เพื่อ AddDoc เข้า Firebase
        for(let item of parsedData) {
           await addDoc(colRef, item);
        }
        showToast(`นำเข้า${typeName} สำเร็จ! ข้อมูลออนไลน์เชื่อมต่อแล้ว`);
      } catch (err) {
        showToast(`อัปโหลดล้มเหลว: ${err.message}`);
      }
      e.target.value = ''; 
    };
    reader.readAsText(file);
  };

  const submitBooking = (e) => {
    e.preventDefault();
    setBookingCourse(null);
    showToast('ระบบบันทึกการจองคิวสำเร็จ (รอแอดมินยืนยัน)');
  };

  // --- DATA PROCESSING (ตัวคำนวณยอดเหมือนเดิม) ---
  const customers = useMemo(() => {
    return customersRaw.map(c => {
      const oldAmount = parseNumber(getFuzzyKey(c, ["ยอดสะสม", "col_13"]));
      const custName = (getFuzzyKey(c, ["ชื่อ", "col_1"]) || '').trim();
      
      const myHistories = histories.filter(h => {
         const hName = (getFuzzyKey(h, ["ชื่อลูกค้า", "col_2"]) || '').trim();
         return hName === custName;
      });

      const historyAmount = myHistories.reduce((sum, h) => {
         const rawAmount = getFuzzyKey(h, ["ยอดสินค้า", "ยอดจัดซื้อ", "ยอดเงิน", "ยอด", "col_19"]);
         return sum + parseNumber(rawAmount);
      }, 0);
        
      const totalAccumulated = oldAmount + historyAmount;
      
      let originalStatus = (getFuzzyKey(c, ["สถานะสมาชิก", "col_7"]) || '').trim();
      let memberStatus = originalStatus || 'ทั่วไป';
      
      const basicStatuses = ['ยังไม่สะสมยอด', 'ทั่วไป', 'สะสมยอด', ''];
      
      if (totalAccumulated >= 5000 && basicStatuses.includes(memberStatus)) {
         memberStatus = 'รอบัตร';
      } else if (totalAccumulated > 0 && totalAccumulated < 5000 && ['ยังไม่สะสมยอด', 'ทั่วไป', ''].includes(memberStatus)) {
         memberStatus = 'สะสมยอด';
      }

      const isApproved = !['ยังไม่สะสมยอด', 'ทั่วไป', 'สะสมยอด', 'รอบัตร'].includes(memberStatus) && memberStatus !== '';

      return {
        ...c,
        "ชื่อ": custName,
        "เบอร์โทร": getFuzzyKey(c, ["เบอร์โทร", "col_3"]),
        "สถานะสมาชิก": memberStatus,
        "ปัญหาผิวหน้า": getFuzzyKey(c, ["ปัญหาผิวหน้า", "col_8"]),
        realAccumulatedAmount: totalAccumulated,
        oldAmount: oldAmount,
        historyAmount: historyAmount,
        myHistories: myHistories,
        isApproved: isApproved
      };
    });
  }, [customersRaw, histories]);

  const filteredCourses = useMemo(() => {
    let filtered = courses.filter(course => {
      const matchSearch = (getFuzzyKey(course, ["ผู้ซื้อคอส", "col_9"]) || '').includes(searchTerm) || 
                          (getFuzzyKey(course, ["เบอร์โทร", "col_1"]) || '').includes(searchTerm);
      const matchStatus = filterStatus === 'all' || getFuzzyKey(course, "สถานะ") === filterStatus;
      return matchSearch && matchStatus;
    });
    return filtered.sort((a, b) => (parseNumber(getFuzzyKey(b, ["เลขที่ใบคอส", "col_2"])?.replace(/[^0-9]/g, ''))) - (parseNumber(getFuzzyKey(a, ["เลขที่ใบคอส", "col_2"])?.replace(/[^0-9]/g, ''))));
  }, [courses, searchTerm, filterStatus]);

  const filteredCustomers = useMemo(() => {
    let filtered = customers.filter(c => 
      (c["ชื่อ"] || '').includes(searchTerm) || 
      (c["เบอร์โทร"] || '').includes(searchTerm)
    );
    if (filterCustomerStatus !== 'all') {
      if (filterCustomerStatus === 'อนุมัติแล้ว (Member)') {
         filtered = filtered.filter(c => c.isApproved);
      } else {
         filtered = filtered.filter(c => c["สถานะสมาชิก"] === filterCustomerStatus);
      }
    }
    return filtered.sort((a, b) => (parseNumber(getFuzzyKey(b, ["หมายเลขใบสะสม", "col_11"])?.replace(/[^0-9]/g, ''))) - (parseNumber(getFuzzyKey(a, ["หมายเลขใบสะสม", "col_11"])?.replace(/[^0-9]/g, ''))));
  }, [customers, searchTerm, filterCustomerStatus]);

  const stats = useMemo(() => {
    const activeCoursesList = courses.filter(c => getFuzzyKey(c, "สถานะ") === 'ยังคงเหลือ');
    const activeCustomersSet = new Set(activeCoursesList.map(c => getFuzzyKey(c, ["เบอร์โทร", "col_1"])).filter(Boolean));

    const treatmentCoursesList = courses.filter(c => {
      const courseName = getFuzzyKey(c, ["ชื่อคอส", "col_8"]) || '';
      return courseName.includes('รักษา');
    });
    const treatmentCustomersSet = new Set(treatmentCoursesList.map(c => getFuzzyKey(c, ["เบอร์โทร", "col_1"])).filter(Boolean));

    return {
      total: courses.length,
      active: activeCoursesList.length,
      completed: courses.filter(c => getFuzzyKey(c, "สถานะ") === 'ใช้ครบแล้ว').length,
      expired: courses.filter(c => getFuzzyKey(c, "สถานะ") === 'หมดอายุ').length,
      totalCustomers: customers.length,
      activeCustomers: activeCustomersSet.size,
      treatmentCustomers: treatmentCustomersSet.size 
    };
  }, [courses, customers]);

  const customerTypes = useMemo(() => {
    const types = {};
    customers.forEach(c => {
       const type = c.isApproved ? 'อนุมัติแล้ว (Member)' : (c["สถานะสมาชิก"] || 'ทั่วไป');
       if (!types[type]) types[type] = { count: 0, amount: 0 };
       types[type].count++;
       types[type].amount += c.realAccumulatedAmount || 0;
    });
    return Object.entries(types).map(([name, data]) => ({ name, count: data.count, amount: data.amount })).sort((a,b) => b.count - a.count);
  }, [customers]);

  const getCustomerCourses = (phone) => {
    return courses.filter(c => getFuzzyKey(c, ["เบอร์โทร", "col_1"]) === phone);
  };

  const getCustomerCourseUsage = (customer) => {
    if (!customer || !customer.myHistories) return [];
    return customer.myHistories.filter(h => {
       const hType = (getFuzzyKey(h, ["ประเภท", "col_4"]) || '').trim();
       return hType.includes('ใช้') || hType.includes('คอส') || hType.includes('เบิก') || hType.includes('บริการ');
    });
  };

  const getCustomerProducts = (customer) => {
    if (!customer || !customer.myHistories) return [];
    return customer.myHistories.filter(h => {
       const rawAmount = getFuzzyKey(h, ["ยอดสินค้า", "ยอดจัดซื้อ", "ยอดเงิน", "ยอด", "col_19"]);
       return parseNumber(rawAmount) > 0;
    });
  };

  const handlePrintView = () => {
    setIsPrintMode(true);
    setTimeout(() => { window.print(); }, 500);
  };

  const SidebarItem = ({ id, icon: Icon, label }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => {
          setActiveTab(id);
          if (window.innerWidth < 1024) setSidebarOpen(false); 
        }}
        className={`w-full flex items-center space-x-3 px-4 py-3.5 sm:py-3.5 rounded-2xl transition-all duration-300 ${
          isActive 
            ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/30 scale-[1.02]' 
            : 'text-gray-500 hover:bg-white hover:text-teal-600 hover:shadow-sm font-medium'
        }`}
      >
        <Icon size={20} className={`${isActive ? 'text-white' : 'text-gray-400 group-hover:text-teal-500'} transition-colors`} />
        <span className="tracking-wide">{label}</span>
      </button>
    );
  };

  // ==========================================
  // VIEW: PRINT MODE (เต็มจอ)
  // ==========================================
  if (isPrintMode && selectedCustomer) {
    return (
      <div className="min-h-screen bg-gray-200 py-4 sm:py-10 font-sans flex flex-col items-center">
        <div className="print:hidden w-full max-w-[21cm] flex flex-col sm:flex-row gap-3 justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-lg border border-gray-200 px-4 mx-2">
           <button onClick={() => setIsPrintMode(false)} className="w-full sm:w-auto flex justify-center items-center text-gray-600 hover:text-gray-900 font-bold px-4 py-3 sm:py-2 bg-gray-100 rounded-xl sm:rounded-lg">
             <ArrowLeft size={18} className="mr-2" /> กลับไปหน้าแอดมิน
           </button>
           <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
             <span className="text-xs font-bold text-gray-500 mr-2 hidden sm:inline-block">หากปุ่มไม่ทำงาน กด Ctrl+P เพื่อพิมพ์</span>
             <button onClick={() => window.print()} className="w-full sm:w-auto flex justify-center items-center space-x-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-6 py-3 sm:py-2 rounded-xl sm:rounded-lg hover:opacity-90 font-bold shadow-md">
               <Printer size={18} /><span>กดพิมพ์ (Print) / เซฟ PDF</span>
             </button>
           </div>
        </div>

        <div className="bg-white w-full max-w-[21cm] min-h-[29.7cm] shadow-2xl p-6 sm:p-12 text-black print:shadow-none print:p-0 relative">
           <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 sm:pb-6 mb-6 sm:mb-8">
             <div>
                <h1 className="text-2xl sm:text-4xl font-black tracking-widest uppercase mb-1 sm:mb-2 flex items-center"><Sparkles size={28} className="mr-2"/> IrisCare Clinic</h1>
                <h2 className="text-sm sm:text-xl font-bold text-gray-700 bg-gray-100 inline-block px-3 py-1 rounded-md border border-gray-200">ข้อมูลประวัติ & บัตรสะสมยอด</h2>
             </div>
             <div className="text-center flex flex-col items-center">
                <div className="w-20 h-20 sm:w-28 sm:h-28 border-2 border-gray-300 p-1 sm:p-2 rounded-xl mb-1 sm:mb-2 flex justify-center items-center bg-white shadow-sm">
                   {getFuzzyKey(selectedCustomer, "คิวอาร์โค้ด") ? <img src={getFuzzyKey(selectedCustomer, "คิวอาร์โค้ด")} alt="QR" className="w-full h-full object-contain" /> : <QrCode size={80} className="text-gray-800" />}
                </div>
                <p className="text-[9px] sm:text-[11px] text-gray-500 font-mono tracking-wider">ID: {getFuzzyKey(selectedCustomer, ["หมายเลขใบสะสม", "col_11"]) || selectedCustomer["เบอร์โทร"]}</p>
             </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 sm:gap-y-6 mb-6 sm:mb-10 bg-gray-50 p-4 sm:p-6 rounded-2xl border border-gray-200">
             <div><p className="text-gray-500 font-bold mb-1 text-[10px] sm:text-xs uppercase tracking-wide">ชื่อ-นามสกุลลูกค้า</p><p className="font-black text-xl sm:text-2xl flex items-center">{selectedCustomer["ชื่อ"]} {getFuzzyKey(selectedCustomer, "ชื่อเล่น") ? `(${getFuzzyKey(selectedCustomer, "ชื่อเล่น")})` : ''}</p></div>
             <div className="sm:text-right"><p className="text-gray-500 font-bold mb-1 text-[10px] sm:text-xs uppercase tracking-wide">เบอร์โทรศัพท์</p><p className="font-black text-xl sm:text-2xl font-mono">{selectedCustomer["เบอร์โทร"]}</p></div>
             <div><p className="text-gray-500 font-bold mb-1 text-[10px] sm:text-xs uppercase tracking-wide">สถานะสมาชิก</p><p className="font-bold text-gray-800 text-base sm:text-lg">{selectedCustomer["สถานะสมาชิก"]}</p></div>
             <div className="sm:text-right"><p className="text-gray-500 font-bold mb-1 text-[10px] sm:text-xs uppercase tracking-wide">ปัญหาผิวหน้า</p><p className="font-bold text-gray-800 text-base sm:text-lg">{selectedCustomer["ปัญหาผิวหน้า"] || '-'}</p></div>
           </div>

           <div className="border-4 border-gray-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 mb-6 sm:mb-10 text-center relative overflow-hidden bg-white">
             <p className="text-gray-700 font-black mb-1 sm:mb-3 uppercase tracking-widest text-xs sm:text-sm">ยอดสะสมสุทธิปัจจุบัน (Total Accumulated)</p>
             <p className="text-5xl sm:text-7xl font-black tracking-tighter text-gray-900">
               {selectedCustomer.realAccumulatedAmount ? selectedCustomer.realAccumulatedAmount.toLocaleString() : '0'} <span className="text-lg sm:text-2xl font-bold text-gray-500 tracking-normal ml-1 sm:ml-2">บาท</span>
             </p>
             
             {/* แจกแจงยอดที่มา */}
             <div className="flex justify-center items-center gap-4 sm:gap-10 mt-6 pt-6 border-t-2 border-gray-200 border-dashed">
               <div className="text-center">
                  <span className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide block mb-1">ยอดยกมา (ระบบเก่า/สาขาอื่น)</span>
                  <span className="font-black text-lg sm:text-2xl text-gray-700">+ ฿{selectedCustomer.oldAmount ? selectedCustomer.oldAmount.toLocaleString() : '0'}</span>
               </div>
               <div className="w-px h-10 bg-gray-300"></div>
               <div className="text-center">
                  <span className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide block mb-1">ยอดจัดซื้อ/เบิกสินค้า (ใหม่)</span>
                  <span className="font-black text-lg sm:text-2xl text-gray-700">+ ฿{selectedCustomer.historyAmount ? selectedCustomer.historyAmount.toLocaleString() : '0'}</span>
               </div>
             </div>
           </div>

           {/* ตารางสินค้าและยอดสะสม */}
           <div className="mb-8 sm:mb-10">
              <h3 className="font-bold text-gray-800 mb-3 sm:mb-4 border-l-4 border-gray-800 pl-2 sm:pl-3 text-base sm:text-lg flex items-center">
                <ShoppingBag size={18} className="mr-2" /> ประวัติการรับยอดสะสม
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap sm:whitespace-normal">
                    <thead>
                      <tr className="bg-gray-100 border-y-2 border-gray-400 text-xs sm:text-sm">
                        <th className="py-2 sm:py-3 px-3 sm:px-4 w-1/4">วันที่</th><th className="py-2 sm:py-3 px-3 sm:px-4 w-1/4">ประเภท</th><th className="py-2 sm:py-3 px-3 sm:px-4 w-1/4">ที่มาของยอด</th><th className="py-2 sm:py-3 px-3 sm:px-4 text-right w-1/4">ยอดที่ได้ (฿)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCustomer.oldAmount > 0 && (
                        <tr className="border-b border-gray-200 bg-gray-50 text-xs sm:text-sm"><td className="py-2 sm:py-3 px-3 sm:px-4 text-gray-500 italic">-</td><td className="py-2 sm:py-3 px-3 sm:px-4 font-bold text-gray-700">ยอดยกมา</td><td className="py-2 sm:py-3 px-3 sm:px-4 text-gray-600">ยอดสะสมเดิมจากตารางลูกค้า</td><td className="py-2 sm:py-3 px-3 sm:px-4 text-right font-black text-gray-900">+ {selectedCustomer.oldAmount.toLocaleString()}</td></tr>
                      )}
                      {getCustomerProducts(selectedCustomer).map((prod, idx) => {
                        const prodAmount = parseNumber(getFuzzyKey(prod, ["ยอดสินค้า", "ยอดจัดซื้อ", "ยอดเงิน", "ยอด", "col_19"]));
                        return (
                        <tr key={idx} className="border-b border-gray-200 text-xs sm:text-sm"><td className="py-2 sm:py-3 px-3 sm:px-4 font-mono">{getFuzzyKey(prod, ["วันที่", "col_1"])}</td><td className="py-2 sm:py-3 px-3 sm:px-4 font-medium text-gray-700">{getFuzzyKey(prod, ["ประเภท", "col_4"])}</td><td className="py-2 sm:py-3 px-3 sm:px-4 font-bold max-w-[120px] truncate">{getFuzzyKey(prod, ["สินค้า", "ชื่อคอส", "รายการ", "col_18", "col_16", "col_23"]) || '-'}</td><td className="py-2 sm:py-3 px-3 sm:px-4 text-right font-black text-gray-900">{prodAmount > 0 ? `+ ${prodAmount.toLocaleString()}` : '-'}</td></tr>
                      )})}
                      {selectedCustomer.oldAmount === 0 && getCustomerProducts(selectedCustomer).length === 0 && (
                        <tr><td colSpan="4" className="py-4 px-4 text-center text-gray-500 italic border-b border-gray-200 text-xs sm:text-sm">ยังไม่มีประวัติการรับยอดสะสม</td></tr>
                      )}
                    </tbody>
                </table>
              </div>
           </div>

           <div className="mb-8 sm:mb-10">
              <h3 className="font-bold text-gray-800 mb-3 sm:mb-4 border-l-4 border-gray-800 pl-2 sm:pl-3 text-base sm:text-lg flex items-center">
                <HeartPulse size={18} className="mr-2" /> ประวัติการใช้บริการ (คอร์ส / เบิกสินค้า)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap sm:whitespace-normal text-xs sm:text-sm">
                    <thead><tr className="bg-gray-100 border-y-2 border-gray-400"><th className="py-2 sm:py-3 px-3 sm:px-4">วันที่รับบริการ</th><th className="py-2 sm:py-3 px-3 sm:px-4">คอร์สหลัก / สินค้า</th><th className="py-2 sm:py-3 px-3 sm:px-4">รายการที่ทำ</th><th className="py-2 sm:py-3 px-3 sm:px-4 text-right">สาขา</th></tr></thead>
                    <tbody>
                      {getCustomerCourseUsage(selectedCustomer).length > 0 ? (
                        getCustomerCourseUsage(selectedCustomer).map((usage, idx) => {
                          const isBerq = getFuzzyKey(usage, ["ประเภท", "col_4"])?.includes('เบิก');
                          const amt = parseNumber(getFuzzyKey(usage, ["ยอดสินค้า", "col_19"]));
                          return (
                          <tr key={idx} className="border-b border-gray-200">
                             <td className="py-2 sm:py-3 px-3 sm:px-4 text-gray-700 font-mono font-bold">{getFuzzyKey(usage, ["วันที่", "col_1"])}</td>
                             <td className="py-2 sm:py-3 px-3 sm:px-4 font-bold text-gray-900 max-w-[120px] truncate">{getFuzzyKey(usage, ["ชื่อคอส", "คอสที่ซื้อ", "สินค้า", "col_16", "col_18"]) || '-'}</td>
                             <td className="py-2 sm:py-3 px-3 sm:px-4 text-gray-600 max-w-[120px] truncate">
                               <span className="bg-gray-100 px-1.5 py-0.5 rounded font-bold mr-1">{getFuzzyKey(usage, ["ประเภท", "col_4"])}</span>
                               {getFuzzyKey(usage, ["รายการ", "col_23"])}
                               {isBerq && amt > 0 && <span className="ml-1 text-[9px] text-orange-600 font-bold">(ยอดเบิก ฿{amt.toLocaleString()})</span>}
                             </td>
                             <td className="py-2 sm:py-3 px-3 sm:px-4 text-right text-gray-500">{getFuzzyKey(usage, ["สาขา", "col_39"])}</td>
                          </tr>
                        )})
                      ) : (<tr><td colSpan="4" className="py-4 px-4 text-center text-gray-500 italic border-b border-gray-200">ไม่มีประวัติการเข้าใช้บริการ</td></tr>)}
                    </tbody>
                </table>
              </div>
           </div>

           <div>
              <h3 className="font-bold text-gray-800 mb-3 sm:mb-4 border-l-4 border-gray-800 pl-2 sm:pl-3 text-base sm:text-lg flex items-center">
                <Activity size={18} className="mr-2" /> คอร์สที่ซื้อไว้ และยอดคงเหลือ
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap sm:whitespace-normal text-xs sm:text-sm">
                    <thead><tr className="bg-gray-100 border-y-2 border-gray-400"><th className="py-2 sm:py-3 px-3 sm:px-4">วันที่ซื้อ</th><th className="py-2 sm:py-3 px-3 sm:px-4">ชื่อคอร์ส</th><th className="py-2 sm:py-3 px-3 sm:px-4 text-center">คงเหลือ/ทั้งหมด</th><th className="py-2 sm:py-3 px-3 sm:px-4 text-right">สถานะ</th></tr></thead>
                    <tbody>
                      {getCustomerCourses(selectedCustomer["เบอร์โทร"]).length > 0 ? (
                        getCustomerCourses(selectedCustomer["เบอร์โทร"]).map((course, idx) => (
                          <tr key={idx} className="border-b border-gray-200"><td className="py-2 sm:py-3 px-3 sm:px-4 text-gray-700 font-mono">{getFuzzyKey(course, ["วันที่ซื้อ", "col_3"])}</td><td className="py-2 sm:py-3 px-3 sm:px-4 font-bold text-gray-900 max-w-[120px] truncate">{getFuzzyKey(course, ["ชื่อคอส", "col_8"])}</td><td className="py-2 sm:py-3 px-3 sm:px-4 text-center text-base sm:text-lg font-black text-gray-800">{getFuzzyKey(course, "ครั้งที่เหลือ")}<span className="text-[10px] sm:text-sm font-normal text-gray-500">/{getFuzzyKey(course, ["จำนวนครั้งที่ได้", "col_10"])}</span></td><td className="py-2 sm:py-3 px-3 sm:px-4 text-right font-bold text-gray-600">{getFuzzyKey(course, "สถานะ")}</td></tr>
                        ))
                      ) : (<tr><td colSpan="4" className="py-4 px-4 text-center text-gray-500 italic border-b border-gray-200">ไม่มีประวัติการซื้อคอร์ส</td></tr>)}
                    </tbody>
                </table>
              </div>
           </div>

           <div className="mt-12 sm:mt-16 pt-4 sm:pt-6 border-t border-gray-300 text-center text-[10px] sm:text-xs text-gray-400 flex flex-col sm:flex-row justify-between px-4 gap-2">
             <p>พิมพ์เมื่อ: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
             <p>ระบบบริหารจัดการคลินิก (IrisCare Management System)</p>
           </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: MAIN APPLICATION
  // ==========================================
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50 via-white to-teal-50 flex font-sans w-full selection:bg-teal-200 selection:text-teal-900">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-gray-900/90 backdrop-blur-md text-white px-6 py-3.5 rounded-2xl shadow-2xl z-[100] flex items-center animate-in slide-in-from-bottom-5 fade-in duration-300 border border-gray-700/50">
          <CheckCircle size={20} className="text-emerald-400 mr-3" />
          <span className="font-bold text-sm tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
           <div className="bg-white w-full max-w-md rounded-[32px] p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-gray-800 flex items-center">
                  <div className="bg-indigo-100 p-2 rounded-xl mr-3"><UserPlus size={20} className="text-indigo-600"/></div> เพิ่มลูกค้าใหม่
                </h3>
                <button onClick={() => setIsAddCustomerOpen(false)} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:bg-gray-100 transition-colors"><X size={20}/></button>
              </div>
              <form onSubmit={handleAddCustomer} className="space-y-5">
                 <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
                    <input type="text" required value={newCustomerForm.ชื่อ} onChange={e => setNewCustomerForm({...newCustomerForm, ชื่อ: e.target.value})} className="w-full border-2 border-gray-100 bg-gray-50/50 rounded-2xl p-3.5 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-medium text-gray-800" placeholder="เช่น สมหญิง สวยงาม" />
                 </div>
                 <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                    <input type="tel" required value={newCustomerForm.เบอร์โทร} onChange={e => setNewCustomerForm({...newCustomerForm, เบอร์โทร: e.target.value})} className="w-full border-2 border-gray-100 bg-gray-50/50 rounded-2xl p-3.5 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-mono font-medium text-gray-800" placeholder="08xxxxxxxx" />
                 </div>
                 <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">ปัญหาผิวหน้า (ถ้ามี)</label>
                    <input type="text" value={newCustomerForm.ปัญหาผิวหน้า} onChange={e => setNewCustomerForm({...newCustomerForm, ปัญหาผิวหน้า: e.target.value})} className="w-full border-2 border-gray-100 bg-gray-50/50 rounded-2xl p-3.5 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-medium text-gray-800" placeholder="เช่น สิว, รอยดำ" />
                 </div>
                 <button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-2xl p-4 mt-6 hover:shadow-lg hover:shadow-indigo-500/30 active:scale-95 transition-all flex items-center justify-center space-x-2">
                    <CheckCircle size={18} /> <span>บันทึกข้อมูลลูกค้า</span>
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* Booking Modal */}
      {bookingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
           <div className="bg-white w-full max-w-md rounded-[32px] p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-gray-800 flex items-center">
                  <div className="bg-blue-100 p-2 rounded-xl mr-3"><CalendarPlus size={20} className="text-blue-600"/></div> นัดหมายจองคิว
                </h3>
                <button onClick={() => setBookingCourse(null)} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:bg-gray-100 transition-colors"><X size={20}/></button>
              </div>
              <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-100/50 shadow-inner">
                 <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider mb-1">คอร์สที่รับบริการ</p>
                 <p className="font-black text-gray-900 text-lg leading-tight">{getFuzzyKey(bookingCourse, ["ชื่อคอส", "col_8"])}</p>
                 <div className="flex items-center mt-3 pt-3 border-t border-blue-100/50">
                    <Users size={14} className="text-gray-400 mr-1.5"/>
                    <p className="text-xs text-gray-600 font-medium">{getFuzzyKey(bookingCourse, ["ผู้ซื้อคอส", "col_9"])} <span className="font-mono text-gray-400 ml-1">({getFuzzyKey(bookingCourse, ["เบอร์โทร", "col_1"])})</span></p>
                 </div>
              </div>
              <form onSubmit={submitBooking} className="space-y-5">
                 <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">เลือกวันที่และเวลา <span className="text-red-500">*</span></label>
                    <input type="datetime-local" required className="w-full border-2 border-gray-100 bg-gray-50/50 rounded-2xl p-3.5 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-mono font-medium text-gray-800" />
                 </div>
                 <button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold rounded-2xl p-4 mt-6 hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center space-x-2">
                    <CalendarPlus size={18} /> <span>ยืนยันการนัดหมาย</span>
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-gray-900/40 z-20 lg:hidden backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed lg:static top-0 left-0 bg-white/80 backdrop-blur-xl w-72 h-full border-r border-gray-200/60 flex flex-col transition-transform duration-300 shadow-2xl lg:shadow-none z-30 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:hidden'}`}>
        <div className="h-20 flex items-center px-6 border-b border-gray-100 justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 via-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-teal-500/30">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <span className="text-xl font-black text-gray-900 tracking-wide block leading-none">IrisCare</span>
              <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Clinic System</span>
            </div>
          </div>
          <button className="lg:hidden p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-8 px-4 space-y-3">
          <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Menu</p>
          <SidebarItem id="dashboard" icon={Home} label="แดชบอร์ดสรุปผล" />
          <SidebarItem id="courses" icon={FileText} label="จัดการใบคอร์ส" />
          <SidebarItem id="customers" icon={Users} label="ระบบฐานลูกค้า" />
          <SidebarItem id="settings" icon={Settings} label="ตั้งค่าระบบ" />
        </div>
        <div className="p-6 border-t border-gray-100">
          <button className="flex items-center justify-center space-x-2 text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors px-4 py-3.5 rounded-2xl w-full font-bold">
            <LogOut size={18} /><span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden w-full relative">
        {/* HEADER */}
        <header className="h-20 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 flex items-center justify-between px-4 sm:px-8 z-10 sticky top-0">
          <div className="flex items-center">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 mr-3 sm:mr-4 rounded-xl text-gray-500 hover:text-teal-600 hover:bg-white shadow-sm bg-gray-50/50 lg:hidden transition-all"><Menu size={20} /></button>
            <h1 className="text-lg sm:text-2xl font-black text-gray-800 tracking-tight flex items-center">
              {activeTab === 'dashboard' && 'แดชบอร์ด (Dashboard)'}
              {activeTab === 'courses' && 'จัดการใบคอร์ส (Courses)'}
              {activeTab === 'customers' && 'ฐานลูกค้า (Customers)'}
              {activeTab === 'settings' && 'ตั้งค่าระบบ (Settings)'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto hide-scrollbar">
            <div className="flex bg-white/80 shadow-sm rounded-xl p-1.5 border border-gray-100 shrink-0">
               <button onClick={() => courseInputRef.current?.click()} className="flex items-center space-x-1.5 px-3 py-2 rounded-lg hover:bg-teal-50 hover:text-teal-700 transition-colors text-xs font-bold text-gray-600" title="นำเข้าคอร์ส">
                 <Upload size={14} /><span className="hidden sm:inline">คอร์ส</span>
               </button>
               <input type="file" accept=".csv" className="hidden" ref={courseInputRef} onChange={(e) => handleCSVUpload(e, 'คอร์ส')} />
               <div className="w-px bg-gray-200 mx-1"></div>
               <button onClick={() => customerInputRef.current?.click()} className="flex items-center space-x-1.5 px-3 py-2 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-xs font-bold text-gray-600" title="นำเข้าลูกค้า">
                 <Users size={14} /><span className="hidden sm:inline">ลูกค้า</span>
               </button>
               <input type="file" accept=".csv" className="hidden" ref={customerInputRef} onChange={(e) => handleCSVUpload(e, 'ฐานลูกค้า')} />
               <div className="w-px bg-gray-200 mx-1"></div>
               <button onClick={() => historyInputRef.current?.click()} className="flex items-center space-x-1.5 px-3 py-2 rounded-lg hover:bg-orange-50 hover:text-orange-700 transition-colors text-xs font-bold text-gray-600" title="นำเข้าประวัติ">
                 <HistoryIcon size={14} /><span className="hidden sm:inline">ประวัติ</span>
               </button>
               <input type="file" accept=".csv" className="hidden" ref={historyInputRef} onChange={(e) => handleCSVUpload(e, 'ประวัติการใช้งาน')} />
            </div>
            <div className="hidden sm:flex w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 items-center justify-center text-gray-600 font-black border-2 border-white shadow-sm shrink-0">
              AD
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-8 w-full relative">
          
          {/* แสดงกล่องเตือนหากยังไม่มีข้อมูลใน Firebase */}
          {courses.length === 0 && customersRaw.length === 0 && histories.length === 0 && activeTab !== 'settings' && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-0 flex flex-col items-center justify-center p-6">
               <div className="bg-white p-8 rounded-3xl shadow-xl border border-teal-100 text-center max-w-md animate-pulse">
                  <div className="w-16 h-16 bg-teal-50 text-teal-500 rounded-full flex items-center justify-center mx-auto mb-4"><Upload size={32} /></div>
                  <h3 className="text-lg font-black text-gray-800 mb-2">ฐานข้อมูลว่างเปล่า (เชื่อมต่อ Firebase แล้ว)</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">กรุณากดปุ่ม <b>"นำเข้าคอร์ส/ลูกค้า/ประวัติ"</b> ที่มุมขวาบน เพื่ออัปโหลดไฟล์ CSV เข้าสู่ระบบฐานข้อมูลคลาวด์ของคุณครับ</p>
               </div>
            </div>
          )}

          {/* DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500 relative z-10">
              
              <div className="flex items-center justify-between">
                 <h2 className="text-lg font-black text-gray-800 flex items-center"><Activity className="mr-2 text-teal-500"/> ภาพรวมคอร์สให้บริการ</h2>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white p-5 sm:p-6 rounded-[24px] border border-gray-100/50 shadow-lg shadow-gray-200/40 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group">
                  <div className="flex items-center space-x-4 mb-4">
                     <div className="p-3.5 bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform shadow-inner"><FileText size={24} /></div>
                     <p className="text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">คอร์สทั้งหมด</p>
                  </div>
                  <p className="text-3xl sm:text-4xl font-black text-gray-800">{stats.total}</p>
                </div>
                
                <div className="bg-white p-5 sm:p-6 rounded-[24px] border border-gray-100/50 shadow-lg shadow-gray-200/40 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group">
                  <div className="flex items-center space-x-4 mb-4">
                     <div className="p-3.5 bg-gradient-to-br from-teal-50 to-emerald-100 text-teal-600 rounded-2xl group-hover:scale-110 transition-transform shadow-inner"><Clock size={24} /></div>
                     <p className="text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">ใช้งาน (Active)</p>
                  </div>
                  <p className="text-3xl sm:text-4xl font-black text-gray-800">{stats.active}</p>
                </div>

                <div className="bg-white p-5 sm:p-6 rounded-[24px] border border-gray-100/50 shadow-lg shadow-gray-200/40 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group">
                  <div className="flex items-center space-x-4 mb-4">
                     <div className="p-3.5 bg-gradient-to-br from-green-50 to-lime-100 text-green-600 rounded-2xl group-hover:scale-110 transition-transform shadow-inner"><CheckCircle size={24} /></div>
                     <p className="text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">ใช้ครบแล้ว</p>
                  </div>
                  <p className="text-3xl sm:text-4xl font-black text-gray-800">{stats.completed}</p>
                </div>

                <div className="bg-white p-5 sm:p-6 rounded-[24px] border border-gray-100/50 shadow-lg shadow-gray-200/40 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group">
                  <div className="flex items-center space-x-4 mb-4">
                     <div className="p-3.5 bg-gradient-to-br from-rose-50 to-red-100 text-rose-600 rounded-2xl group-hover:scale-110 transition-transform shadow-inner"><AlertCircle size={24} /></div>
                     <p className="text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">หมดอายุ</p>
                  </div>
                  <p className="text-3xl sm:text-4xl font-black text-gray-800">{stats.expired}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                 <h2 className="text-lg font-black text-gray-800 flex items-center"><Users className="mr-2 text-indigo-500"/> สถิติฐานลูกค้า</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-5 sm:p-6 rounded-[24px] shadow-lg shadow-indigo-500/30 text-white relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-white/20 transition-all"></div>
                  <div className="flex items-center space-x-3 mb-4 relative z-10">
                     <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm"><Users size={20} className="text-white" /></div>
                     <p className="text-xs font-bold text-indigo-100 uppercase tracking-wider">จำนวนลูกค้าทั้งหมด</p>
                  </div>
                  <p className="text-4xl font-black relative z-10">{stats.totalCustomers} <span className="text-lg font-medium text-indigo-200 ml-1">ท่าน</span></p>
                </div>
                
                <div className="bg-white p-5 sm:p-6 rounded-[24px] border border-gray-100/50 shadow-lg shadow-gray-200/40 hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-center space-x-3 mb-4">
                     <div className="p-2 bg-teal-50 text-teal-600 rounded-xl"><TrendingUp size={20} /></div>
                     <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">ลูกค้ารับบริการ (Active)</p>
                  </div>
                  <p className="text-3xl sm:text-4xl font-black text-gray-800">{stats.activeCustomers} <span className="text-sm font-medium text-gray-400 ml-1">ท่าน</span></p>
                </div>

                <div className="bg-white p-5 sm:p-6 rounded-[24px] border border-gray-100/50 shadow-lg shadow-gray-200/40 hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-center space-x-3 mb-4">
                     <div className="p-2 bg-rose-50 text-rose-500 rounded-xl"><HeartPulse size={20} /></div>
                     <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">กลุ่ม "คอร์สรักษา"</p>
                  </div>
                  <p className="text-3xl sm:text-4xl font-black text-gray-800">{stats.treatmentCustomers} <span className="text-sm font-medium text-gray-400 ml-1">ท่าน</span></p>
                </div>
              </div>
            </div>
          )}

          {/* COURSES */}
          {activeTab === 'courses' && (
            <div className="bg-white/80 backdrop-blur-md rounded-[32px] border border-white shadow-xl flex flex-col h-full overflow-hidden w-full animate-in fade-in zoom-in-[0.99] duration-300 relative z-10">
              <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row gap-4">
                 <div className="relative w-full">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                   <input type="text" placeholder="ค้นหาชื่อลูกค้า, เบอร์โทร หรือ รหัสคอร์ส..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-teal-500/20 focus:border-teal-400 focus:bg-white transition-all text-sm font-medium text-gray-800" />
                 </div>
                 <div className="flex gap-3 overflow-x-auto w-full sm:w-auto hide-scrollbar shrink-0">
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border border-gray-200 bg-gray-50/50 rounded-2xl px-4 py-3.5 text-sm font-bold text-gray-700 flex-1 sm:w-auto min-w-[140px] focus:outline-none focus:ring-4 focus:ring-teal-500/20 focus:border-teal-400 transition-all cursor-pointer">
                      <option value="all">สถานะทั้งหมด</option><option value="ยังคงเหลือ">ยังคงเหลือ</option><option value="ใช้ครบแล้ว">ใช้ครบแล้ว</option>
                    </select>
                 </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block flex-1 overflow-x-auto w-full p-2">
                <table className="w-full text-left whitespace-nowrap min-w-[700px]">
                  <thead className="sticky top-0 z-10">
                    <tr className="text-[11px] text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100">
                      <th className="py-4 px-6 bg-white/90 backdrop-blur-sm">เลขที่ / วันที่</th><th className="py-4 px-6 bg-white/90 backdrop-blur-sm">ลูกค้า</th><th className="py-4 px-6 bg-white/90 backdrop-blur-sm">ชื่อคอร์ส</th><th className="py-4 px-6 bg-white/90 backdrop-blur-sm">ยอดเงิน</th><th className="py-4 px-6 text-center bg-white/90 backdrop-blur-sm">การใช้งาน</th><th className="py-4 px-6 bg-white/90 backdrop-blur-sm">สถานะ</th><th className="py-4 px-6 text-right bg-white/90 backdrop-blur-sm">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredCourses.map((course, idx) => {
                      const isPendingPayment = parseNumber(getFuzzyKey(course, "ยอดค้างชำระ")) > 0;
                      return (
                        <tr key={idx} className="hover:bg-teal-50/40 cursor-pointer transition-colors group" onClick={() => setSelectedCourse(course)}>
                          <td className="py-4 px-6"><div className="font-bold text-teal-700">{getFuzzyKey(course, ["เลขที่ใบคอส", "col_2"])}</div><div className="text-[11px] text-gray-400 font-mono mt-0.5">{getFuzzyKey(course, ["วันที่ซื้อ", "col_3"])}</div></td>
                          <td className="py-4 px-6"><div className="font-bold text-gray-900">{getFuzzyKey(course, ["ผู้ซื้อคอส", "col_9"])}</div><div className="text-xs text-gray-500 font-mono mt-0.5">{getFuzzyKey(course, ["เบอร์โทร", "col_1"])}</div></td>
                          <td className="py-4 px-6 text-sm font-bold text-gray-800 max-w-[200px] truncate" title={getFuzzyKey(course, ["ชื่อคอส", "col_8"])}>{getFuzzyKey(course, ["ชื่อคอส", "col_8"])}</td>
                          <td className="py-4 px-6">
                             <div className="text-sm font-black text-gray-800">฿{parseNumber(getFuzzyKey(course, ["ราคา", "col_13"])).toLocaleString()}</div>
                             {isPendingPayment ? (
                               <div className="text-[10px] font-bold text-red-600 mt-1 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md inline-block">ค้าง ฿{parseNumber(getFuzzyKey(course, "ยอดค้างชำระ")).toLocaleString()}</div>
                             ) : (
                               <div className="text-[10px] text-gray-400 font-bold mt-1 bg-gray-100 px-2 py-0.5 rounded-md inline-block">{getFuzzyKey(course, ["ประเภทการชำระ", "col_16"])}</div>
                             )}
                          </td>
                          <td className="py-4 px-6 text-center"><div className="bg-gray-50 rounded-xl px-3 py-1.5 inline-block border border-gray-100"><span className="text-base font-black text-gray-900">{getFuzzyKey(course, "รวมใช้งานแล้ว")}</span><span className="text-gray-300 mx-1">/</span><span className="text-xs font-bold text-gray-500">{getFuzzyKey(course, ["จำนวนครั้งที่ได้", "col_10"])}</span></div></td>
                          <td className="py-4 px-6"><span className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wide ${getFuzzyKey(course, "สถานะ") === 'ยังคงเหลือ' ? 'bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-700 border border-teal-100' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>{getFuzzyKey(course, "สถานะ")}</span></td>
                          <td className="py-4 px-6 text-right"><button className="p-2.5 text-gray-400 group-hover:text-teal-600 group-hover:bg-white shadow-sm border border-transparent group-hover:border-teal-100 rounded-xl transition-all active:scale-95"><Eye size={18} /></button></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden flex flex-col gap-4 p-4 overflow-y-auto bg-gray-50/30">
                {filteredCourses.map((course, idx) => {
                  const isPendingPayment = parseNumber(getFuzzyKey(course, "ยอดค้างชำระ")) > 0;
                  return (
                    <div key={idx} className={`bg-white border-2 ${isPendingPayment ? 'border-red-100 shadow-red-100/50' : 'border-transparent'} rounded-[24px] p-5 shadow-lg shadow-gray-200/50 cursor-pointer active:scale-[0.98] transition-transform relative overflow-hidden`} onClick={() => setSelectedCourse(course)}>
                       {getFuzzyKey(course, "สถานะ") === 'ยังคงเหลือ' && <div className={`absolute top-0 left-0 w-1.5 h-full ${isPendingPayment ? 'bg-red-400' : 'bg-gradient-to-b from-teal-400 to-emerald-500'}`}></div>}
                       
                       <div className="flex justify-between items-start mb-3">
                          <div className="pr-3">
                             <h4 className="font-black text-gray-900 text-base mb-1 leading-tight">{getFuzzyKey(course, ["ชื่อคอส", "col_8"])}</h4>
                             <p className="text-xs text-gray-600 font-medium flex items-center"><Users size={12} className="mr-1 opacity-50"/> {getFuzzyKey(course, ["ผู้ซื้อคอส", "col_9"])}</p>
                          </div>
                          <span className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wide ${getFuzzyKey(course, "สถานะ") === 'ยังคงเหลือ' ? 'bg-teal-50 text-teal-700 border border-teal-100' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                             {getFuzzyKey(course, "สถานะ")}
                          </span>
                       </div>
                       
                       {isPendingPayment && (
                         <div className="mb-3">
                            <span className="bg-red-50 text-red-600 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-red-100 flex items-center w-max">
                              <AlertCircle size={12} className="mr-1"/> ผ่อนชำระ: ค้าง ฿{parseNumber(getFuzzyKey(course, "ยอดค้างชำระ")).toLocaleString()}
                            </span>
                         </div>
                       )}

                       <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                          <div>
                             <p className="text-xs text-gray-500 flex items-center bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 font-medium">
                               ใช้ไป <span className="font-black text-gray-900 mx-1.5 text-sm">{getFuzzyKey(course, "รวมใช้งานแล้ว")}/{getFuzzyKey(course, ["จำนวนครั้งที่ได้", "col_10"])}</span> 
                               <span className={`ml-1 font-bold ${parseNumber(getFuzzyKey(course, "ครั้งที่เหลือ")) > 0 ? 'text-teal-600' : 'text-gray-400'}`}>(เหลือ {getFuzzyKey(course, "ครั้งที่เหลือ")})</span>
                             </p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center"><ChevronRight size={18} /></div>
                       </div>
                    </div>
                  )
                })}
                {filteredCourses.length === 0 && <div className="text-center py-10"><FileText size={48} className="mx-auto text-gray-200 mb-3"/><p className="text-sm font-bold text-gray-400">ไม่พบข้อมูลคอร์ส</p></div>}
              </div>
            </div>
          )}

          {/* CUSTOMERS */}
          {activeTab === 'customers' && (
            <div className="flex flex-col h-full space-y-4 sm:space-y-6 w-full animate-in fade-in zoom-in-[0.99] duration-300 relative z-10">
              
              {/* Summary Cards */}
              <div className="flex overflow-x-auto hide-scrollbar gap-3 sm:gap-4 pb-2 w-full shrink-0 snap-x">
                <div onClick={() => setFilterCustomerStatus('all')} className={`snap-center shrink-0 cursor-pointer bg-white p-4 sm:p-5 rounded-[24px] border-2 transition-all duration-300 ${filterCustomerStatus === 'all' ? 'border-indigo-400 shadow-lg shadow-indigo-100' : 'border-transparent shadow-md shadow-gray-200/50 hover:border-indigo-200'} flex items-center space-x-4 min-w-[160px] sm:min-w-[200px]`}>
                  <div className="w-12 h-12 rounded-2xl flex justify-center items-center bg-gradient-to-br from-indigo-50 to-blue-100 text-indigo-600 shadow-inner"><Users size={24} /></div>
                  <div><p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wide">ทั้งหมด</p><p className="text-2xl sm:text-3xl font-black text-gray-900">{stats.totalCustomers}</p></div>
                </div>
                {customerTypes.map((type, idx) => {
                  const isVIP = type.name === 'อนุมัติแล้ว (Member)' || type.name.includes('สมาชิก') || type.name.includes('VIP');
                  const isWait = type.name === 'รอบัตร';
                  return (
                  <div key={idx} onClick={() => setFilterCustomerStatus(type.name)} className={`snap-center shrink-0 cursor-pointer bg-white p-4 sm:p-5 rounded-[24px] border-2 transition-all duration-300 ${filterCustomerStatus === type.name ? (isVIP ? 'border-orange-400 shadow-lg shadow-orange-100' : isWait ? 'border-yellow-400 shadow-lg shadow-yellow-100' : 'border-purple-400 shadow-lg shadow-purple-100') : 'border-transparent shadow-md shadow-gray-200/50 hover:border-gray-200'} flex items-center space-x-4 min-w-[160px] sm:min-w-[200px]`}>
                    <div className={`w-12 h-12 rounded-2xl flex justify-center items-center shadow-inner ${isVIP ? 'bg-gradient-to-br from-amber-100 to-orange-100 text-orange-600' : isWait ? 'bg-gradient-to-br from-yellow-50 to-orange-100 text-yellow-600' : 'bg-gradient-to-br from-purple-50 to-fuchsia-100 text-purple-600'}`}><Users size={24} /></div>
                    <div><p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wide truncate max-w-[100px]">{type.name}</p><p className="text-2xl sm:text-3xl font-black text-gray-900">{type.count}</p></div>
                  </div>
                )})}
              </div>

              <div className="bg-white/80 backdrop-blur-md rounded-[32px] border border-white shadow-xl flex flex-col flex-1 overflow-hidden w-full">
                <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
                   <div className="relative w-full max-w-md">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                     <input type="text" placeholder="ค้นหาชื่อลูกค้า, เบอร์โทร..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all text-sm font-medium text-gray-800" />
                   </div>
                   <button onClick={() => setIsAddCustomerOpen(true)} className="w-full sm:w-auto flex justify-center items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3.5 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 active:scale-95 transition-all shrink-0">
                     <UserPlus size={18} /> <span>เพิ่มลูกค้าใหม่</span>
                   </button>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block flex-1 overflow-x-auto w-full p-2">
                  <table className="w-full text-left whitespace-nowrap min-w-[700px]">
                    <thead className="sticky top-0 z-10"><tr className="text-[11px] text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100"><th className="py-4 px-6 bg-white/90 backdrop-blur-sm">ชื่อ-นามสกุล</th><th className="py-4 px-6 bg-white/90 backdrop-blur-sm">เบอร์โทร</th><th className="py-4 px-6 bg-white/90 backdrop-blur-sm">สถานะสมาชิก</th><th className="py-4 px-6 text-right bg-white/90 backdrop-blur-sm">ยอดสะสมสุทธิ (฿)</th><th className="py-4 px-6 text-right bg-white/90 backdrop-blur-sm">จัดการ</th></tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredCustomers.map((customer, idx) => (
                        <tr key={idx} className={`hover:bg-indigo-50/30 cursor-pointer transition-colors group ${customer.isApproved ? 'bg-orange-50/10' : ''}`} onClick={() => setSelectedCustomer(customer)}>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-4">
                               <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-inner group-hover:scale-110 transition-transform ${customer.isApproved ? 'bg-gradient-to-br from-amber-100 to-orange-100 text-orange-600' : 'bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700'}`}>{getFuzzyKey(customer, "ชื่อ") ? getFuzzyKey(customer, "ชื่อ")[0] : 'U'}</div>
                               <div>
                                 <span className="font-black text-gray-900 text-base flex items-center">
                                   {getFuzzyKey(customer, "ชื่อ")}
                                   {customer.isApproved && <span className="ml-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm flex items-center"><Award size={10} className="mr-1"/> อนุมัติแล้ว</span>}
                                 </span> 
                                 {getFuzzyKey(customer, "ชื่อเล่น") && <span className="text-xs font-bold text-gray-400">({getFuzzyKey(customer, "ชื่อเล่น")})</span>}
                               </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-mono text-sm text-gray-500">{getFuzzyKey(customer, "เบอร์โทร")}</td>
                          <td className="py-4 px-6"><span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide ${customer.isApproved ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-orange-700 border border-orange-200' : customer["สถานะสมาชิก"] === 'สะสมยอด' ? 'bg-purple-50 text-purple-700 border border-purple-100' : customer["สถานะสมาชิก"] === 'รอบัตร' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' : 'bg-gray-50 text-gray-600 border border-gray-200'}`}>{customer["สถานะสมาชิก"] || 'ทั่วไป'}</span></td>
                          <td className="py-4 px-6 text-right font-black text-indigo-700 text-base">฿{customer.realAccumulatedAmount ? customer.realAccumulatedAmount.toLocaleString() : '0'}</td>
                          <td className="py-4 px-6 text-right"><button className="p-2.5 text-gray-400 group-hover:text-indigo-600 group-hover:bg-white shadow-sm border border-transparent group-hover:border-indigo-100 rounded-xl transition-all active:scale-95"><Eye size={18} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden flex flex-col gap-4 p-4 overflow-y-auto bg-gray-50/30">
                  {filteredCustomers.map((customer, idx) => (
                    <div key={idx} className="bg-white border border-gray-100 rounded-[24px] p-5 shadow-lg shadow-gray-200/50 cursor-pointer active:scale-[0.98] transition-transform relative overflow-hidden" onClick={() => setSelectedCustomer(customer)}>
                       <div className={`absolute top-0 left-0 w-1.5 h-full ${customer.isApproved ? 'bg-gradient-to-b from-amber-400 to-orange-500' : 'bg-gradient-to-b from-indigo-400 to-purple-500'}`}></div>
                       <div className="flex justify-between items-start mb-4 pl-1">
                          <div className="flex items-center space-x-4">
                             <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shadow-inner shrink-0 border border-white ${customer.isApproved ? 'bg-gradient-to-br from-amber-50 to-orange-100 text-orange-600' : 'bg-gradient-to-br from-indigo-50 to-purple-100 text-indigo-700'}`}>{getFuzzyKey(customer, "ชื่อ") ? getFuzzyKey(customer, "ชื่อ")[0] : 'U'}</div>
                             <div>
                                <h4 className="font-black text-gray-900 text-base leading-tight flex flex-wrap items-center gap-1">
                                  <span>{getFuzzyKey(customer, "ชื่อ")}</span>
                                  {getFuzzyKey(customer, "ชื่อเล่น") && <span className="text-xs font-bold text-gray-400">({getFuzzyKey(customer, "ชื่อเล่น")})</span>}
                                  {customer.isApproved && <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow-sm flex items-center mt-1 sm:mt-0"><Award size={10} className="mr-1"/> อนุมัติแล้ว</span>}
                                </h4>
                                <p className="text-[11px] font-mono font-bold text-gray-500 mt-1"><Phone size={10} className="inline mr-1"/>{getFuzzyKey(customer, "เบอร์โทร")}</p>
                             </div>
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-3 text-xs mb-4 bg-gray-50 p-3 rounded-2xl border border-gray-100 ml-1">
                          <div><span className="text-[9px] text-gray-400 font-bold block mb-1 uppercase tracking-wider">สถานะ</span><span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-black ${customer.isApproved ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-orange-700' : customer["สถานะสมาชิก"] === 'สะสมยอด' ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-700'}`}>{customer["สถานะสมาชิก"] || 'ทั่วไป'}</span></div>
                          <div><span className="text-[9px] text-gray-400 font-bold block mb-1 uppercase tracking-wider">ปัญหาผิว</span><span className="font-bold text-gray-700 line-clamp-1">{getFuzzyKey(customer, "ปัญหาผิวหน้า") || '-'}</span></div>
                       </div>
                       <div className="flex justify-between items-center border-t border-gray-100 pt-4 ml-1">
                          <div><span className="text-[9px] text-indigo-400 block mb-0.5 uppercase font-bold tracking-wider">ยอดสะสมสุทธิ</span><span className="font-black text-indigo-700 text-xl leading-none">฿{customer.realAccumulatedAmount?.toLocaleString() || '0'}</span></div>
                          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center"><ChevronRight size={18} /></div>
                       </div>
                    </div>
                  ))}
                  {filteredCustomers.length === 0 && <div className="text-center py-10"><Users size={48} className="mx-auto text-gray-200 mb-3"/><p className="text-sm font-bold text-gray-400">ไม่พบข้อมูลลูกค้า</p></div>}
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white/80 backdrop-blur-md rounded-[32px] border border-white shadow-xl flex flex-col h-full items-center justify-center min-h-[400px] animate-in fade-in duration-300 w-full p-8 text-center relative overflow-hidden z-10">
               <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50 rounded-full -mr-20 -mt-20 blur-3xl opacity-50"></div>
               <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-50 rounded-full -ml-20 -mb-20 blur-3xl opacity-50"></div>
               
               <div className="relative z-10 flex flex-col items-center">
                 <div className="bg-gray-50 p-6 rounded-full mb-6 border-2 border-gray-100 shadow-inner">
                   <Settings size={64} className="text-gray-300 animate-spin-slow" />
                 </div>
                 <h2 className="text-3xl font-black text-gray-800 mb-3 tracking-tight">ตั้งค่าระบบ</h2>
                 <p className="text-gray-500 font-medium max-w-md mx-auto leading-relaxed mb-4">
                   ระบบตอนนี้เชื่อมต่อกับคลาวด์ <b className="text-orange-500">Firebase</b> แล้ว! ข้อมูลทั้งหมดถูกจัดเก็บออนไลน์และจะแสดงผลแบบ Realtime ทันที
                 </p>
                 <button onClick={() => setActiveTab('dashboard')} className="mt-8 bg-gray-900 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-gray-800 transition-colors flex items-center space-x-2">
                   <ArrowLeft size={18} />
                   <span>กลับสู่หน้าหลัก</span>
                 </button>
               </div>
            </div>
          )}

        </div>
      </main>

      {/* --- COURSE DETAIL MODAL --- */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-gray-900/60 backdrop-blur-md">
          <div className="bg-white w-full sm:max-w-3xl h-[90vh] sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden rounded-t-[32px] sm:rounded-[32px] animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 shadow-2xl">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-20">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-teal-400 to-teal-500 p-2.5 rounded-xl text-white shadow-md shadow-teal-500/30"><FileText size={20} /></div>
                <div><h3 className="text-lg font-black text-gray-900 leading-tight">รายละเอียดคอร์ส</h3><p className="text-[10px] sm:text-xs text-teal-600 font-bold font-mono tracking-wider">{getFuzzyKey(selectedCourse, ["เลขที่ใบคอส", "col_2"])}</p></div>
              </div>
              <button onClick={() => setSelectedCourse(null)} className="p-2.5 bg-gray-50 text-gray-500 rounded-full hover:bg-gray-100 transition-colors"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50/50">
              
              <div className={`mb-6 p-6 rounded-3xl flex justify-between items-center shadow-lg ${parseNumber(getFuzzyKey(selectedCourse, "ยอดค้างชำระ")) > 0 ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/20 text-white' : 'bg-gradient-to-br from-teal-500 to-emerald-600 shadow-teal-500/20 text-white'} relative overflow-hidden`}>
                <div className="absolute right-0 top-0 w-40 h-40 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                <div className="relative z-10">
                   <p className="text-[10px] sm:text-xs font-bold uppercase mb-1 tracking-widest opacity-80">สถานะปัจจุบัน</p>
                   <p className="text-2xl sm:text-3xl font-black">{getFuzzyKey(selectedCourse, "สถานะ")}</p>
                </div>
                <div className="text-right relative z-10">
                   <p className="text-[10px] sm:text-xs font-bold uppercase mb-1 tracking-widest opacity-80">คงเหลือ</p>
                   <p className="text-5xl font-black">{getFuzzyKey(selectedCourse, "ครั้งที่เหลือ")} <span className="text-sm font-bold opacity-70">ครั้ง</span></p>
                </div>
              </div>
              
              <div className="space-y-4">
                 {parseNumber(getFuzzyKey(selectedCourse, "ยอดค้างชำระ")) > 0 && (
                   <div className="bg-white p-5 rounded-2xl border-2 border-red-100 flex items-start space-x-4 shadow-sm relative overflow-hidden">
                      <div className="absolute left-0 top-0 w-1.5 h-full bg-red-500"></div>
                      <div className="bg-red-50 p-2 rounded-full shrink-0"><AlertCircle className="text-red-500" size={24} /></div>
                      <div>
                         <h4 className="font-black text-gray-900 text-base">มียอดค้างชำระ (ผ่อนชำระ)</h4>
                         <p className="text-sm text-gray-600 mt-1">คอร์สนี้มียอดค้างชำระอีก <strong className="text-red-600 text-lg">฿{parseNumber(getFuzzyKey(selectedCourse, "ยอดค้างชำระ")).toLocaleString()}</strong> จากราคาเต็ม ฿{parseNumber(getFuzzyKey(selectedCourse, ["ราคา", "col_13"])).toLocaleString()}</p>
                      </div>
                   </div>
                 )}

                 <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-[11px] font-bold text-gray-400 mb-3 uppercase tracking-wider flex items-center"><Users size={16} className="mr-2 text-indigo-400"/> ข้อมูลลูกค้า</p>
                    <p className="font-black text-gray-900 text-xl">{getFuzzyKey(selectedCourse, ["ผู้ซื้อคอส", "col_9"])}</p>
                    <p className="text-sm font-mono text-gray-500 mt-1">{getFuzzyKey(selectedCourse, ["เบอร์โทร", "col_1"])}</p>
                 </div>
                 <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-[11px] font-bold text-gray-400 mb-3 uppercase tracking-wider flex items-center"><Tag size={16} className="mr-2 text-teal-400"/> ข้อมูลคอร์ส</p>
                    <p className="font-black text-teal-700 text-xl">{getFuzzyKey(selectedCourse, ["ชื่อคอส", "col_8"])}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                       <span className="bg-gray-100 px-3 py-1 rounded-lg text-xs font-bold text-gray-600 flex items-center"><MapPin size={12} className="mr-1"/> สาขา: {getFuzzyKey(selectedCourse, ["สาขาที่ซื้อ", "col_7"])}</span>
                       <span className="bg-gray-100 px-3 py-1 rounded-lg text-xs font-bold text-gray-600 flex items-center"><CalendarPlus size={12} className="mr-1"/> วันที่ซื้อ: {getFuzzyKey(selectedCourse, ["วันที่ซื้อ", "col_3"])}</span>
                    </div>
                 </div>
                 <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-[11px] font-bold text-gray-400 mb-3 uppercase tracking-wider flex items-center"><Activity size={16} className="mr-2 text-orange-400"/> รายละเอียดการรับบริการ</p>
                    <p className="text-sm text-gray-800 font-medium leading-relaxed bg-orange-50/50 p-4 rounded-xl border border-orange-100/50">{getFuzzyKey(selectedCourse, ["รายการที่ได้รับ", "col_17"]) || 'ไม่ระบุรายละเอียด'}</p>
                 </div>
              </div>
            </div>

            <div className="px-6 sm:px-8 py-5 sm:py-6 border-t border-gray-100 bg-white flex flex-col sm:flex-row justify-end gap-3 w-full">
              {getFuzzyKey(selectedCourse, "สถานะ") === 'ยังคงเหลือ' && parseNumber(getFuzzyKey(selectedCourse, "ครั้งที่เหลือ")) > 0 && (
                <button onClick={() => setBookingCourse(selectedCourse)} className="w-full sm:w-auto flex justify-center items-center space-x-2 bg-blue-50 text-blue-600 px-6 py-3.5 rounded-2xl font-bold text-sm hover:bg-blue-100 transition-colors">
                  <CalendarPlus size={18} /><span>จองคิวบริการ</span>
                </button>
              )}
              {getFuzzyKey(selectedCourse, "สถานะ") === 'ยังคงเหลือ' && parseNumber(getFuzzyKey(selectedCourse, "ครั้งที่เหลือ")) > 0 && (
                <button onClick={() => handleUseSession(selectedCourse)} className="w-full sm:w-auto flex justify-center items-center space-x-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-8 py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 active:scale-95 transition-all">
                  <CheckCircle size={18} /><span>กดเพื่อตัดคอร์ส (1 ครั้ง)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- CUSTOMER DETAIL MODAL --- */}
      {selectedCustomer && !isPrintMode && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-gray-900/60 backdrop-blur-md">
          <div className="bg-white w-full sm:max-w-4xl h-[95vh] sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden rounded-t-[32px] sm:rounded-[32px] animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 shadow-2xl">
            
            {/* Modal Header */}
            <div className={`px-6 sm:px-8 py-6 border-b flex flex-col sm:flex-row justify-between sm:items-start text-white gap-4 sticky top-0 z-20 relative overflow-hidden ${selectedCustomer.isApproved ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 border-orange-500/20' : 'bg-gradient-to-r from-indigo-700 via-purple-700 to-fuchsia-700 border-indigo-500/20'}`}>
              <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>
              
              <div className="flex justify-between items-start w-full sm:w-auto relative z-10">
                <div className="flex items-center space-x-4 sm:space-x-5">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-black text-2xl shadow-xl shrink-0">
                    {(getFuzzyKey(selectedCustomer, "ชื่อ") || 'U').substring(0, 1)}
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-3xl font-black leading-tight tracking-wide flex items-center flex-wrap gap-2">
                      <span className="truncate max-w-[200px] sm:max-w-[300px]">{getFuzzyKey(selectedCustomer, "ชื่อ")}</span>
                      {selectedCustomer.isApproved && <span className="bg-white/20 backdrop-blur-sm border border-white/40 text-white text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-lg uppercase tracking-wider shadow-sm flex items-center whitespace-nowrap"><Award size={14} className="mr-1"/> อนุมัติแล้ว</span>}
                    </h3>
                    <p className="font-mono text-xs sm:text-sm mt-1 text-white/80 flex items-center"><Phone size={12} className="mr-1.5 opacity-80" />{getFuzzyKey(selectedCustomer, "เบอร์โทร")}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="p-2 sm:hidden bg-white/10 rounded-full hover:bg-white/20 backdrop-blur-sm"><X size={20} /></button>
              </div>
              
              <div className="flex space-x-3 w-full sm:w-auto relative z-10 mt-2 sm:mt-0">
                <button onClick={handlePrintView} className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur-md text-white px-5 py-3 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-lg active:scale-95 transition-all">
                  <Printer size={18} className="sm:mr-1" /><span className="sm:hidden lg:inline">พิมพ์บัตรสะสมยอด</span>
                </button>
                <button onClick={() => setSelectedCustomer(null)} className="hidden sm:flex items-center justify-center p-3 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl transition-all"><X size={20} /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50 flex flex-col">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6 mb-6 shrink-0">
                {/* 🌟 กล่องสถานะสมาชิก & ปุ่มอนุมัติ 🌟 */}
                <div className="bg-white p-4 sm:p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center relative">
                   <p className="text-[10px] sm:text-xs font-bold text-gray-400 mb-1 sm:mb-2 uppercase tracking-widest flex items-center"><Award size={14} className={`mr-1 ${selectedCustomer.isApproved ? 'text-orange-400' : 'text-purple-400'}`}/> สถานะ</p>
                   <p className={`text-base sm:text-2xl font-black mb-1 leading-tight ${selectedCustomer.isApproved ? 'text-orange-600' : 'text-gray-800'}`}>{selectedCustomer["สถานะสมาชิก"]}</p>
                   
                   {/* ปุ่มกดอนุมัติสิทธิ์ */}
                   {!selectedCustomer.isApproved && (
                     <button onClick={() => handleApproveCustomer(selectedCustomer)} className="mt-2 w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white text-[10px] sm:text-xs font-black px-3 py-2 rounded-xl shadow-md flex items-center justify-center transition-all active:scale-95">
                       <CheckCircle size={14} className="mr-1.5"/> อนุมัติสิทธิ์ VIP
                     </button>
                   )}
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center">
                   <p className="text-[10px] sm:text-xs font-bold text-gray-400 mb-1 sm:mb-2 uppercase tracking-widest flex items-center"><Tag size={14} className="mr-1 text-orange-400"/> ปัญหาผิว</p>
                   <p className="text-sm sm:text-xl font-bold text-orange-600 truncate">{getFuzzyKey(selectedCustomer, "ปัญหาผิวหน้า") || '-'}</p>
                </div>
                <div className={`col-span-2 sm:col-span-1 p-4 sm:p-5 rounded-3xl shadow-lg text-white relative overflow-hidden flex flex-col justify-center ${selectedCustomer.isApproved ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-orange-500/20' : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/20'}`}>
                  <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                  <p className="text-[10px] sm:text-xs font-bold text-white/80 mb-0.5 sm:mb-1 uppercase tracking-widest relative z-10 flex items-center"><Banknote size={14} className="mr-1"/> ยอดสะสมสุทธิ (รวม)</p>
                  <p className="text-3xl sm:text-4xl font-black relative z-10 mb-2 sm:mb-3">฿{selectedCustomer.realAccumulatedAmount ? selectedCustomer.realAccumulatedAmount.toLocaleString() : '0'}</p>
                  
                  <div className="relative z-10 flex flex-col gap-1 border-t border-white/20 pt-2 sm:pt-3">
                    <div className="flex justify-between items-center text-[10px] sm:text-xs text-white/90">
                      <span>ยอดยกมา (ระบบเก่า):</span>
                      <span className="font-bold">+ ฿{selectedCustomer.oldAmount ? selectedCustomer.oldAmount.toLocaleString() : '0'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] sm:text-xs text-white/90">
                      <span>สั่งซื้อ/เบิกสินค้า (ใหม่):</span>
                      <span className="font-bold">+ ฿{selectedCustomer.historyAmount ? selectedCustomer.historyAmount.toLocaleString() : '0'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* TABS เมนูหลักย่อย */}
              <div className="flex mb-5 gap-3 overflow-x-auto hide-scrollbar pb-2 snap-x shrink-0 items-center">
                <button onClick={() => setCustomerModalTab('courses')} className={`snap-start shrink-0 px-5 py-3 sm:py-3.5 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-300 ${customerModalTab === 'courses' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-[1.02]' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}><Activity size={16} className="inline mr-1.5 -mt-0.5" /> ประวัติซื้อคอร์ส</button>
                <button onClick={() => setCustomerModalTab('courseUsage')} className={`snap-start shrink-0 px-5 py-3 sm:py-3.5 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-300 ${customerModalTab === 'courseUsage' ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30 scale-[1.02]' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}><HeartPulse size={16} className="inline mr-1.5 -mt-0.5" /> ประวัติใช้บริการ (ใช้คอร์ส/เบิกสินค้า)</button>
                <button onClick={() => setCustomerModalTab('products')} className={`snap-start shrink-0 px-5 py-3 sm:py-3.5 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-300 ${customerModalTab === 'products' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-[1.02]' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}><ShoppingBag size={16} className="inline mr-1.5 -mt-0.5" /> ประวัติรับยอดสะสม</button>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex-1 flex flex-col min-h-[300px] relative">
                
                {customerModalTab === 'courses' && (
                  <div className="absolute top-4 right-4 z-10 hidden sm:block">
                     <button onClick={() => handleBuyCourseAgain(selectedCustomer)} className="bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center shadow-sm border border-indigo-100 transition-all duration-300 active:scale-95">
                       <Plus size={16} className="mr-1.5"/> ซื้อคอร์สเพิ่ม
                     </button>
                  </div>
                )}
                
                {/* 1. ประวัติซื้อคอร์ส */}
                {customerModalTab === 'courses' && (
                  <div className="flex-1 overflow-y-auto bg-gray-50/30">
                    <div className="hidden md:block w-full p-2">
                      <table className="w-full text-left text-sm">
                        <thead className="sticky top-0"><tr className="text-[11px] font-bold uppercase text-gray-400 tracking-wider border-b border-gray-100"><th className="py-3 px-6 bg-white/90 backdrop-blur-sm">วันที่/คอร์ส</th><th className="py-3 px-6 text-center bg-white/90 backdrop-blur-sm">คงเหลือ</th><th className="py-3 px-6 bg-white/90 backdrop-blur-sm">สถานะ</th><th className="py-3 px-6 bg-white/90 backdrop-blur-sm"></th></tr></thead>
                        <tbody className="divide-y divide-gray-50">
                          {getCustomerCourses(getFuzzyKey(selectedCustomer, "เบอร์โทร")).length > 0 ? (
                            getCustomerCourses(getFuzzyKey(selectedCustomer, "เบอร์โทร")).map((c, i) => (
                              <tr key={i} className="hover:bg-indigo-50/40 group transition-colors">
                                <td className="py-4 px-6"><p className="font-bold text-gray-900 text-base">{getFuzzyKey(c, "ชื่อคอส")}</p><p className="font-mono text-[11px] text-gray-400 mt-0.5">{getFuzzyKey(c, "วันที่ซื้อ")}</p></td>
                                <td className="py-4 px-6 text-center"><span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-xl font-black text-lg border border-indigo-100">{getFuzzyKey(c, "ครั้งที่เหลือ")}</span></td>
                                <td className="py-4 px-6">
                                  <span className="bg-gray-100 px-2.5 py-1 rounded-md text-[10px] font-bold text-gray-600 block w-max mb-1.5">{getFuzzyKey(c, "สถานะ")}</span>
                                  {parseNumber(getFuzzyKey(c, "ยอดค้างชำระ")) > 0 && <span className="text-[10px] text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md block w-max font-bold">ค้าง ฿{parseNumber(getFuzzyKey(c, "ยอดค้างชำระ")).toLocaleString()}</span>}
                                </td>
                                <td className="py-4 px-6 text-right">
                                  {getFuzzyKey(c, "สถานะ") === 'ยังคงเหลือ' && parseNumber(getFuzzyKey(c, "ครั้งที่เหลือ")) > 0 && (
                                    <button onClick={() => setBookingCourse(c)} className="opacity-0 group-hover:opacity-100 text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg font-bold shadow-md hover:bg-blue-600 transition-all items-center inline-flex transform translate-x-2 group-hover:translate-x-0">
                                      <CalendarPlus size={14} className="mr-1.5"/> นัดหมาย
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))
                          ) : (<tr><td colSpan="4" className="py-12 text-center"><FileText size={40} className="mx-auto text-gray-200 mb-3"/><p className="text-gray-400 font-bold text-sm">ไม่มีประวัติการซื้อคอร์ส</p></td></tr>)}
                        </tbody>
                      </table>
                    </div>
                    {/* Mobile Cards */}
                    <div className="md:hidden flex flex-col p-4 gap-4">
                      <button onClick={() => handleBuyCourseAgain(selectedCustomer)} className="w-full bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white py-3.5 rounded-2xl text-sm font-bold border border-indigo-200 border-dashed flex justify-center items-center transition-colors">
                         <Plus size={18} className="mr-1.5"/> ซื้อคอร์สเพิ่ม
                      </button>

                      {getCustomerCourses(getFuzzyKey(selectedCustomer, "เบอร์โทร")).length > 0 ? (
                        getCustomerCourses(getFuzzyKey(selectedCustomer, "เบอร์โทร")).map((c, i) => (
                          <div key={i} className={`bg-white border-2 ${parseNumber(getFuzzyKey(c, "ยอดค้างชำระ")) > 0 ? 'border-red-100 shadow-red-100/50' : 'border-gray-50 shadow-gray-200/50'} rounded-[24px] p-5 shadow-lg relative overflow-hidden`}>
                             {getFuzzyKey(c, "สถานะ") === 'ยังคงเหลือ' && <div className={`absolute top-0 left-0 w-1.5 h-full ${parseNumber(getFuzzyKey(c, "ยอดค้างชำระ")) > 0 ? 'bg-red-400' : 'bg-indigo-400'}`}></div>}
                             <div className="flex justify-between items-start mb-3">
                                <div className="pr-3">
                                  <h4 className="font-black text-gray-900 text-base leading-tight">{getFuzzyKey(c, "ชื่อคอส")}</h4>
                                  {parseNumber(getFuzzyKey(c, "ยอดค้างชำระ")) > 0 && <span className="inline-block mt-2 bg-red-50 text-red-600 text-[10px] font-bold px-2 py-1 rounded-md border border-red-100">ผ่อนชำระ: ค้าง ฿{parseNumber(getFuzzyKey(c, "ยอดค้างชำระ")).toLocaleString()}</span>}
                                </div>
                                <span className="shrink-0 bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg text-[9px] font-black tracking-wide">{getFuzzyKey(c, "สถานะ")}</span>
                             </div>
                             <div className="flex justify-between items-end mt-4 pt-4 border-t border-gray-100">
                                <p className="font-mono text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-md">{getFuzzyKey(c, "วันที่ซื้อ")}</p>
                                <div className="flex items-center space-x-3">
                                   <p className="text-xs text-gray-500 font-medium">เหลือ <span className="font-black text-indigo-600 text-xl">{getFuzzyKey(c, "ครั้งที่เหลือ")}</span></p>
                                   {getFuzzyKey(c, "สถานะ") === 'ยังคงเหลือ' && parseNumber(getFuzzyKey(c, "ครั้งที่เหลือ")) > 0 && (
                                     <button onClick={() => setBookingCourse(c)} className="bg-blue-500 text-white p-2 rounded-xl shadow-md shadow-blue-500/30 active:scale-95 transition-transform"><CalendarPlus size={16}/></button>
                                   )}
                                </div>
                             </div>
                          </div>
                        ))
                      ) : (<div className="text-center py-10"><FileText size={40} className="mx-auto text-gray-200 mb-3"/><p className="text-gray-400 font-bold text-sm">ไม่มีประวัติการซื้อคอร์ส</p></div>)}
                    </div>
                  </div>
                )}

                {/* 2. ประวัติเข้าใช้คอร์ส (และเบิกสินค้า) */}
                {customerModalTab === 'courseUsage' && (
                  <div className="flex-1 overflow-y-auto bg-gray-50/30">
                    <div className="hidden md:block w-full p-2">
                      <table className="w-full text-left text-sm">
                        <thead className="sticky top-0"><tr className="text-[11px] font-bold uppercase text-gray-400 border-b border-gray-100 tracking-wider"><th className="py-3 px-6 bg-white/90 backdrop-blur-sm">วันที่รับบริการ</th><th className="py-3 px-6 bg-white/90 backdrop-blur-sm">คอร์สหลัก / สินค้าที่เบิก</th><th className="py-3 px-6 text-right bg-white/90 backdrop-blur-sm">สาขา</th></tr></thead>
                        <tbody className="divide-y divide-gray-50">
                          {getCustomerCourseUsage(selectedCustomer).length > 0 ? (
                            getCustomerCourseUsage(selectedCustomer).map((u, i) => {
                              const isBerq = getFuzzyKey(u, ["ประเภท", "col_4"])?.includes('เบิก');
                              const amt = parseNumber(getFuzzyKey(u, ["ยอดสินค้า", "col_19"]));
                              return (
                              <tr key={i} className="hover:bg-pink-50/40 transition-colors">
                                <td className="py-4 px-6 font-mono text-xs text-gray-500">{getFuzzyKey(u, "วันที่")}</td>
                                <td className="py-4 px-6">
                                  <p className="font-bold text-gray-900 text-base">{getFuzzyKey(u, ["ชื่อคอส", "คอสที่ซื้อ", "สินค้า", "col_16", "col_18"]) || '-'}</p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <p className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center ${isBerq ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-pink-50 text-pink-600 border border-pink-100'}`}><CheckCircle size={10} className="mr-1"/>{getFuzzyKey(u, "ประเภท")} {getFuzzyKey(u, "รายการ") ? `: ${getFuzzyKey(u, "รายการ")}` : ''}</p>
                                    {isBerq && amt > 0 && <span className="text-[10px] bg-orange-50 text-orange-600 font-bold px-2 py-0.5 rounded-md border border-orange-100">ยอดเบิก: ฿{amt.toLocaleString()}</span>}
                                  </div>
                                </td>
                                <td className="py-4 px-6 text-right text-xs font-bold text-gray-400">{getFuzzyKey(u, "สาขา")}</td>
                              </tr>
                            )})
                          ) : (<tr><td colSpan="3" className="py-12 text-center"><HeartPulse size={40} className="mx-auto text-gray-200 mb-3"/><p className="text-gray-400 font-bold text-sm">ไม่มีประวัติเข้าใช้บริการหรือเบิกสินค้า</p></td></tr>)}
                        </tbody>
                      </table>
                    </div>
                    {/* Mobile Cards */}
                    <div className="md:hidden flex flex-col p-4 gap-4">
                      {getCustomerCourseUsage(selectedCustomer).length > 0 ? (
                        getCustomerCourseUsage(selectedCustomer).map((u, i) => {
                          const isBerq = getFuzzyKey(u, ["ประเภท", "col_4"])?.includes('เบิก');
                          const amt = parseNumber(getFuzzyKey(u, ["ยอดสินค้า", "ยอดจัดซื้อ", "ยอดเงิน", "ยอด", "col_19"]));
                          return (
                          <div key={i} className="bg-white border-2 border-pink-50/50 rounded-[24px] p-5 shadow-lg shadow-gray-200/50 relative overflow-hidden">
                             <div className={`absolute top-0 left-0 w-1.5 h-full ${isBerq ? 'bg-indigo-400' : 'bg-gradient-to-b from-pink-400 to-rose-500'}`}></div>
                             <div className="flex justify-between items-center mb-3 pl-1">
                                <span className="font-mono text-[10px] text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg font-bold">{getFuzzyKey(u, "วันที่")}</span>
                                <span className="text-[10px] text-gray-400 font-bold flex items-center"><MapPin size={10} className="mr-1"/>{getFuzzyKey(u, "สาขา") || '-'}</span>
                             </div>
                             <h4 className="font-black text-gray-900 text-base mb-2 pl-1">{getFuzzyKey(u, ["ชื่อคอส", "คอสที่ซื้อ", "สินค้า", "col_16", "col_18"]) || '-'}</h4>
                             <div className="pl-1 flex flex-wrap gap-2">
                               <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border flex items-center ${isBerq ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-pink-50 text-pink-600 border-pink-100'}`}><CheckCircle size={12} className="inline mr-1"/>{getFuzzyKey(u, "ประเภท")} {getFuzzyKey(u, "รายการ") ? `: ${getFuzzyKey(u, "รายการ")}` : ''}</span>
                               {isBerq && amt > 0 && <span className="text-[10px] bg-orange-50 text-orange-600 font-bold px-2.5 py-1 rounded-lg border border-orange-100 flex items-center">ยอดเบิก: ฿{amt.toLocaleString()}</span>}
                             </div>
                          </div>
                        )})
                      ) : (<div className="text-center py-10"><HeartPulse size={40} className="mx-auto text-gray-200 mb-3"/><p className="text-gray-400 font-bold text-sm">ไม่มีประวัติเข้าใช้บริการ</p></div>)}
                    </div>
                  </div>
                )}

                {/* 3. ประวัติรับยอดสะสม */}
                {customerModalTab === 'products' && (
                  <div className="flex-1 overflow-y-auto bg-gray-50/30">
                    {/* Desktop Table */}
                    <div className="hidden md:block w-full p-2">
                      <table className="w-full text-left text-sm">
                        <thead className="sticky top-0"><tr className="text-[11px] text-gray-400 font-bold uppercase border-b border-gray-100 tracking-wider"><th className="py-3 px-6 bg-white/90 backdrop-blur-sm">วันที่</th><th className="py-3 px-6 bg-white/90 backdrop-blur-sm">ชื่อรายการ / ประเภท</th><th className="py-3 px-6 text-right bg-white/90 backdrop-blur-sm">ยอดสะสมที่ได้ (฿)</th></tr></thead>
                        <tbody className="divide-y divide-gray-50">
                          {selectedCustomer.oldAmount > 0 && (
                            <tr className="bg-orange-50/30"><td className="py-4 px-6 font-mono text-[10px] text-gray-400">-</td><td className="py-4 px-6"><p className="font-black text-gray-700 text-base">ยอดยกมา (ระบบเก่า)</p></td><td className="py-4 px-6 text-right font-black text-orange-600 text-lg">+ {selectedCustomer.oldAmount.toLocaleString()}</td></tr>
                          )}
                          {getCustomerProducts(selectedCustomer).length > 0 ? (
                            getCustomerProducts(selectedCustomer).map((p, i) => {
                              const isBerq = getFuzzyKey(p, "ประเภท")?.includes('เบิก');
                              return (
                              <tr key={i} className="hover:bg-orange-50/40 transition-colors">
                                <td className="py-4 px-6 font-mono text-xs text-gray-500">{getFuzzyKey(p, "วันที่")}</td>
                                <td className="py-4 px-6">
                                  <p className="font-bold text-gray-900 text-base">{getFuzzyKey(p, ["สินค้า", "รายการ", "ชื่อคอส", "col_18", "col_16"]) || '-'}</p>
                                  <p className={`text-[10px] font-bold mt-1 border px-2 py-0.5 rounded w-max ${isBerq ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-white text-orange-500 border-orange-200'}`}>{getFuzzyKey(p, "ประเภท")}</p>
                                </td>
                                <td className="py-4 px-6 text-right font-black text-orange-600 text-lg">+ {parseNumber(getFuzzyKey(p, ["ยอดสินค้า", "ยอดจัดซื้อ", "ยอดเงิน", "ยอด", "col_19"])).toLocaleString()}</td>
                              </tr>
                            )})
                          ) : (selectedCustomer.oldAmount === 0 && <tr><td colSpan="3" className="py-12 text-center"><ShoppingBag size={40} className="mx-auto text-gray-200 mb-3"/><p className="text-gray-400 font-bold text-sm">ไม่มีประวัติการรับยอดสะสม</p></td></tr>)}
                        </tbody>
                      </table>
                    </div>
                    {/* Mobile Cards */}
                    <div className="md:hidden flex flex-col p-4 gap-4">
                      {selectedCustomer.oldAmount > 0 && (
                         <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100/50 rounded-[24px] p-5 shadow-sm flex justify-between items-center relative overflow-hidden">
                            <div className="absolute left-0 top-0 w-1.5 h-full bg-gradient-to-b from-orange-300 to-amber-400"></div>
                            <div className="pl-2"><h4 className="font-black text-gray-800 text-sm">ยอดยกมา (ระบบเก่า)</h4></div>
                            <span className="font-black text-orange-600 text-xl">+ {selectedCustomer.oldAmount.toLocaleString()}</span>
                         </div>
                      )}
                      {getCustomerProducts(selectedCustomer).length > 0 ? (
                        getCustomerProducts(selectedCustomer).map((p, i) => {
                          const prodAmount = parseNumber(getFuzzyKey(p, ["ยอดสินค้า", "ยอดจัดซื้อ", "ยอดเงิน", "ยอด", "col_19"]));
                          const isBerq = getFuzzyKey(p, "ประเภท")?.includes('เบิก');
                          return (
                          <div key={i} className="bg-white border border-gray-100 rounded-[24px] p-5 shadow-lg shadow-gray-200/50 relative overflow-hidden">
                             <div className={`absolute top-0 left-0 w-1.5 h-full ${isBerq ? 'bg-indigo-400' : 'bg-gradient-to-b from-orange-400 to-amber-500'}`}></div>
                             <div className="flex justify-between items-start mb-3 pl-1">
                                <div className="pr-2">
                                  <h4 className="font-black text-gray-900 text-base leading-tight mb-1.5">{getFuzzyKey(p, ["สินค้า", "รายการ", "ชื่อคอส", "col_18", "col_16"]) || '-'}</h4>
                                  <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold border tracking-wide ${isBerq ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>{getFuzzyKey(p, "ประเภท")}</span>
                                </div>
                                <span className="font-black text-orange-600 text-xl shrink-0 bg-orange-50/50 px-2 py-1 rounded-xl">+ {prodAmount.toLocaleString()}</span>
                             </div>
                             <div className="pl-1 pt-3 border-t border-gray-50 mt-1">
                               <p className="font-mono text-[10px] text-gray-400 flex items-center"><Clock size={10} className="mr-1"/>{getFuzzyKey(p, "วันที่")}</p>
                             </div>
                          </div>
                        )})
                      ) : (selectedCustomer.oldAmount === 0 && <div className="text-center py-10"><ShoppingBag size={40} className="mx-auto text-gray-200 mb-3"/><p className="text-gray-400 font-bold text-sm">ไม่มีประวัติการได้ยอดสะสม</p></div>)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}