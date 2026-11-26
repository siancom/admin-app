import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Upload, Search, Home, FileText, User, Users, Settings, 
  Plus, Eye, CheckCircle, Clock, QrCode, LogOut, Menu, X, 
  Tag, Calendar, ShoppingCart, Package, TrendingUp, MapPin, 
  Award, AlertCircle, Banknote, Activity, Phone, History as HistoryIcon, 
  Printer, ShoppingBag, ArrowLeft, HeartPulse, ChevronRight, 
  CalendarPlus, UserPlus, Sparkles, Trash2, AlertTriangle, Layers, Database,
  Camera, Image as ImageIcon, ShieldCheck, ShieldAlert, RefreshCcw, PenTool, Edit3,
  Bell, List, LayoutGrid, ScanLine, CalendarDays, ChevronLeft, ChevronUp, ChevronDown, BarChart3, Store, UserCheck, Wallet, Loader2, Scissors, Ticket, Gift, CreditCard, RefreshCw, Bot, Key, EyeOff,
  Send, MessageSquare, ToggleLeft, ToggleRight, TestTube, ExternalLink, Zap, Target, Droplet, Syringe, Pill, Truck, Star,
  Filter, RotateCcw, Lock, Unlock, CalendarClock, Save, FileCheck
} from 'lucide-react';

// --- SERVICE TYPE HELPER ---
export const getServiceIcons = (courseName) => {
    if (!courseName) return [];
    const name = String(courseName).toLowerCase();
    const icons = [];
    if (name.includes('หน้า') || name.includes('ทรีท') || name.includes('นวด')) icons.push({ Icon: Sparkles, color: 'text-amber-100', id: 'facial' });
    if (name.includes('สิว') || name.includes('มาร์ค') || name.includes('มาส์ก')) icons.push({ Icon: Droplet, color: 'text-blue-100', id: 'acne' });
    if (name.includes('ipl') || name.includes('เลเซอร์') || name.includes('laser') || name.includes('กำจัดขน') || name.includes('รักแร้')) icons.push({ Icon: Zap, color: 'text-yellow-100', id: 'laser' });
    if (name.includes('ไฝ') || name.includes('ขี้แมลงวัน') || name.includes('ติ่งเนื้อ')) icons.push({ Icon: Target, color: 'text-red-100', id: 'mole' });
    if (name.includes('ฉีด') || name.includes('botox') || name.includes('โบท็อก') || name.includes('ฟิลเลอร์') || name.includes('filler') || name.includes('แฟต') || name.includes('fat') || name.includes('meso') || name.includes('เมโส')) icons.push({ Icon: Syringe, color: 'text-pink-100', id: 'injection' });
    if (name.includes('ดริป') || name.includes('วิตามิน') || name.includes('vitamin') || name.includes('drip') || name.includes('ผิวขาว')) icons.push({ Icon: Pill, color: 'text-emerald-100', id: 'vitamin' });
    return icons;
};

import FinancialDashboard from './components/FinancialDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import JobApplicationForm from './components/JobApplicationForm';
import MapPinModal from './components/MapPinModal';
import AdminBookingForm from './components/AdminBookingForm';
import SkinAiBanner from './components/SkinAiBanner';
import { analyzeSkinIssue } from './utils/skinAiUtils';
import { DEFAULT_BOOKING_CONFIG, calculateBookingDuration } from './utils/bookingConfig';
import { QRCodeSVG } from 'qrcode.react';

// --- FIREBASE IMPORTS ---
import { signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc, deleteField, writeBatch, query, where, getDocs, getDoc, setDoc, orderBy, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, uploadBytes, getDownloadURL, deleteObject, uploadString } from 'firebase/storage';
import { auth, db, getCol, getDocRef, storage } from './config/firebase';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

// --- UTILS & PARSERS ---
import { getLocalYYYYMMDD, normalizeBranchName, getTotalStock, getBranchStock, formatDateTimeStr, parseNumber, parseQty, parseHistoryTime, parseCSVRow, parseThaiDate, compressImage, blobToBase64 } from './utils/parse';
import { getFuzzyKey } from './utils/fuzzy';
import { 
  isUsageType, isAddType, isFreeUsageApp as isFreeUsage, extractHistoryQty, 
  isMoleHistoryRecord, checkWarranty, getHistoryDateKey, getHistorySortTime, 
  getHistoryBranch, isHistoryUsageRecord 
} from './utils/courseUtils';
import { handleProfileImgError, parseImageUrl, getProfilePicData } from './utils/imageUtils';
import { getSafeDateTime, getBookingStatus, getOrderStatus } from './utils/dateUtils';

// 🌟 ดึง Timestamp เวลาสมัคร/แก้ไขล่าสุดของลูกค้า (เพื่อเรียงลำดับสมาชิกใหม่ล่าสุด)
export const getCustomerTimestamp = (c) => {
  if (!c) return 0;
  if (c.createdAt) {
    if (typeof c.createdAt.toMillis === 'function') return c.createdAt.toMillis();
    if (typeof c.createdAt.toDate === 'function') return c.createdAt.toDate().getTime();
    if (c.createdAt.seconds) return c.createdAt.seconds * 1000;
    const t = new Date(c.createdAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (c.updatedAt) {
    if (typeof c.updatedAt.toMillis === 'function') return c.updatedAt.toMillis();
    if (typeof c.updatedAt.toDate === 'function') return c.updatedAt.toDate().getTime();
    if (c.updatedAt.seconds) return c.updatedAt.seconds * 1000;
    const t = new Date(c.updatedAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  const regDateStr = getFuzzyKey(c, ["วันที่สมัคร", "registeredAt", "col_2"]);
  if (regDateStr) {
    const t = new Date(regDateStr).getTime();
    if (!isNaN(t) && t > 0) return t;
    const thaiParsed = parseThaiDate(regDateStr);
    if (thaiParsed) return thaiParsed.getTime();
  }
  return 0;
};

export const getHistoryCategoryInfo = (h) => {
  if (!h) return { id: 'other', label: 'ทั่วไป / อื่นๆ', color: 'text-slate-700 bg-slate-50 border-slate-200', icon: Activity };
  const typeStr = String(getFuzzyKey(h, ["ประเภท", "col_4"]) || '').toLowerCase();
  const itemStr = `${String(getFuzzyKey(h, ["สินค้า", "ชื่อคอส", "รายการ", "col_18", "col_16", "col_23"]) || '')} ${typeStr} ${String(getFuzzyKey(h, ["รายการที่ทำ", "หมายเหตุ", "col_10", "col_11", "col_12"]) || '')}`.toLowerCase();
  
  if (isMoleHistoryRecord(h) || itemStr.includes('ไฝ') || itemStr.includes('ขี้แมลงวัน') || itemStr.includes('ติ่งเนื้อ')) {
    return { id: 'mole', label: 'จี้ไฝ / ติ่งเนื้อ', color: 'text-rose-700 bg-rose-50 border-rose-200', icon: Target };
  }
  if (itemStr.includes('ฉีด') || itemStr.includes('botox') || itemStr.includes('โบท็อก') || itemStr.includes('ฟิลเลอร์') || itemStr.includes('filler') || itemStr.includes('แฟต') || itemStr.includes('fat') || itemStr.includes('meso') || itemStr.includes('เมโส')) {
    return { id: 'injection', label: 'ฉีด / โบท็อกซ์ / ฟิลเลอร์', color: 'text-pink-700 bg-pink-50 border-pink-200', icon: Syringe };
  }
  if (itemStr.includes('ดริป') || itemStr.includes('วิตามิน') || itemStr.includes('vitamin') || itemStr.includes('drip') || itemStr.includes('ผิวขาว')) {
    return { id: 'vitamin', label: 'ดริปวิตามินผิว', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: Pill };
  }
  if (itemStr.includes('ipl') || itemStr.includes('เลเซอร์') || itemStr.includes('laser') || itemStr.includes('กำจัดขน') || itemStr.includes('รักแร้')) {
    return { id: 'laser', label: 'IPL / เลเซอร์', color: 'text-amber-800 bg-amber-50 border-amber-200', icon: Zap };
  }
  if (itemStr.includes('สิว') || itemStr.includes('มาร์ค') || itemStr.includes('มาส์ก') || itemStr.includes('acne') || itemStr.includes('เคลียร์สิว') || itemStr.includes('กดสิว')) {
    return { id: 'acne', label: 'กดสิว / เคลียร์สิว / มาส์ก', color: 'text-blue-700 bg-blue-50 border-blue-200', icon: Droplet };
  }
  if (itemStr.includes('หน้า') || itemStr.includes('ทรีท') || itemStr.includes('นวด') || itemStr.includes('treatment') || itemStr.includes('facial') || itemStr.includes('บำรุง') || itemStr.includes('ลงเครื่อง')) {
    return { id: 'facial', label: 'ทำหน้า / ทรีทเม้นท์', color: 'text-orange-700 bg-orange-50 border-orange-200', icon: Sparkles };
  }
  if (typeStr.includes('ซื้อ') || itemStr.includes('สินค้า') || itemStr.includes('ครีม') || itemStr.includes('เซรั่ม') || itemStr.includes('ยา') || itemStr.includes('เบิกสินค้า') || itemStr.includes('product')) {
    return { id: 'product', label: 'ซื้อสินค้า / เวชสำอาง', color: 'text-purple-700 bg-purple-50 border-purple-200', icon: ShoppingBag };
  }
  if (isFreeUsage(h) || itemStr.includes('ฟรี') || itemStr.includes('แถม')) {
    return { id: 'free', label: 'ของแถม / ฟรี', color: 'text-teal-700 bg-teal-50 border-teal-200', icon: Gift };
  }
  return { id: 'other', label: 'บริการทั่วไป / อื่นๆ', color: 'text-slate-700 bg-slate-50 border-slate-200', icon: Activity };
};

// --- COMPONENTS ---
import SidebarItem from './components/SidebarItem';
import InputField from './components/InputField';
import ModalWrapper from './components/ModalWrapper';
import AddCourseModal from './components/AddCourseModal';
import SignaturePad from './components/SignaturePad';
import BarcodeScannerModal from './components/BarcodeScannerModal';
import POSSystem from './components/POSSystem';
import PayslipModal from './components/PayslipModal';
import FrontAttendanceModal from './components/FrontAttendanceModal';
import AdminLoginPage from './components/AdminLoginPage';
import VipApplicationFormModal from './components/VipApplicationFormModal';
import MoleRemovalSystem from './components/MoleRemovalSystem';
import CourseDeductionSystem from './components/CourseDeductionSystem';
import StaffServiceQueue from './components/StaffServiceQueue';
import LiveTimer from './components/LiveTimer';
import InventoryDashboard from './components/InventoryDashboard';
import PromotionManager from './components/PromotionManager';
import CouponManager from './components/CouponManager';
import MarketingPromoManager from './components/MarketingPromoManager';
import GamificationManager from './components/GamificationManager';
import { fetchWithProxy, WOO_CFG } from './utils/wooProxy';
import { getVipDiscountRate, computeFinalPrice } from './utils/priceUtils';
import ErrorBoundary from './components/ErrorBoundary';
import EmployeePortal from './components/EmployeePortal';
import TreatmentJobSlipModal from './components/TreatmentJobSlipModal';
import RoomManagementBoard from './components/RoomManagementBoard';
import BookingCountdown from './components/BookingCountdown';
import { sendOrderLineNotification, sendBookingLineNotification, sendPOSCheckoutNotification, sendCourseDeductionNotification, sendRewardLineNotification } from './utils/lineUtils';
import CustomerBedSession from './components/CustomerBedSession';
import CalendarBookingDashboard from './components/CalendarBookingDashboard';
import SettingsPage from './components/SettingsPage';
import DailyBookingModal from './components/DailyBookingModal';
import CreditManagementModal from './components/CreditManagementModal';
import IShipBookingModal from './components/IShipBookingModal';
import ShippingLabelModal from './components/ShippingLabelModal';
import CoursePrintModal from './components/CoursePrintModal';
import MemberCardPrintModal from './components/MemberCardPrintModal';
import CloseCourseModal from './components/CloseCourseModal';
import CourseDataInspectorModal from './components/CourseDataInspectorModal';
import AddressManagerModal from './components/AddressManagerModal';
import DailySalesBannerChart from './components/DailySalesBannerChart';
import IrisPatientIntakeModal from './components/IrisPatientIntakeModal';
import { fetch17Track } from './utils/wooProxy';
// 📦 17TRACK — แปลงสถานะพัสดุเป็นไทย (ใช้ร่วมทุกหน้าที่แสดง trackingInfo)
export const TRACK17_PHASE_TH = {
  infoReceived: 'แจ้งข้อมูลแล้ว',
  pending: 'รอติดตาม',
  notFound: 'ไม่พบเลขพัสดุ',
  inTransit: 'อยู่ระหว่างขนส่ง',
  outForDelivery: 'กำลังนำส่ง',
  delivered: 'จัดส่งสำเร็จ',
  exception: 'การขนส่งมีปัญหา',
  expired: 'หมดเวลาติดตาม',
  undelivered: 'ส่งไม่สำเร็จ',
};

// 🎛️ รายการฟีเจอร์ที่แอดมินเปิด/ปิดได้ (ส่งผลต่อแอปลูกค้าแบบเรียลไทม์) — แยกตามกลุ่ม
export const ADMIN_FEATURE_GROUPS = [
  {
    group: 'ผิว & AI', icon: 'Sparkles', color: 'text-indigo-500', bg: 'bg-indigo-50',
    features: [
      { key: 'skinCheck', label: 'สแกนผิว AI', desc: 'แบนเนอร์+หน้าวิเคราะห์ผิวในแอปลูกค้า' },
      { key: 'moleScan', label: 'นับไฝ/ประเมินราคาจี้', desc: 'แท็บนับไฝ-ติ่งเนื้อในหน้าสแกนผิว' },
      { key: 'skinProgress', label: 'ประวัติสแกนผิว', desc: 'ปุ่มประวัติ+ความคืบหน้า+เทียบ Before/After' },
      { key: 'aiSurvey', label: 'แบบประเมิน AI รับส่วนลด', desc: 'ฟอร์มความพอใจหลังสแกนผิว รหัส AIFEED ลด 50.-' },
    ],
  },
  {
    group: 'การจัดส่ง', icon: 'Truck', color: 'text-sky-500', bg: 'bg-sky-50',
    features: [
      { key: 'tracking', label: 'ติดตามพัสดุ 17TRACK', desc: 'การ์ด+ชิปสถานะพัสดุในแอปลูกค้า' },
    ],
  },
  {
    group: 'ร้านค้า & สั่งซื้อ', icon: 'ShoppingBag', color: 'text-teal-500', bg: 'bg-teal-50',
    features: [
      { key: 'shop', label: 'ร้านค้า/สั่งซื้อ', desc: 'แท็บซื้อคอร์ส-ร้านค้า+ปุ่มไปที่ร้านค้า' },
      { key: 'sourcePOSCourses', label: 'ดึงคอร์สจากระบบ POS', desc: 'แสดงคอร์สและบริการจากระบบจัดการหน้าร้าน (แนะนำ)' },
      { key: 'sourceOldCourses', label: 'ดึงคอร์สจากเว็บ/ระบบเก่า', desc: 'แสดงโบรชัวร์และโปรโมชั่นจากระบบเดิม' },
      { key: 'sourceFirestore', label: 'ดึงสินค้าจากคลังคลินิก', desc: 'แสดงสินค้าจากฐานข้อมูล Firebase ในหน้าช้อปปิ้งแอปลูกค้า' },
      { key: 'sourceWooCommerce', label: 'ดึงสินค้าจากเว็บคลินิก', desc: 'แสดงสินค้าจากระบบ WooCommerce ในหน้าช้อปปิ้งแอปลูกค้า' },
      { key: 'imageSearchAI', label: 'ค้นหาสินค้าด้วยรูป AI', desc: 'ไอคอนกล้องในช่องค้นหา (แบบ Shopee)' },
      { key: 'priceCompare', label: 'เทียบราคาร้านอื่น', desc: 'ปุ่มเทียบราคาบนการ์ดสินค้า' },
    ],
  },
  {
    group: 'การเงิน & เครดิต', icon: 'Wallet', color: 'text-emerald-500', bg: 'bg-emerald-50',
    features: [
      { key: 'wallet', label: 'กระเป๋าเงิน (จ่ายเงิน)', desc: 'ปุ่มกลาง "จ่ายเงิน" ในแถบล่าง' },
      { key: 'walletTopup', label: 'เติมเครดิต', desc: 'ปุ่มเติมเงินในกระเป๋าเงินลูกค้า' },
      { key: 'walletTransfer', label: 'โอนเครดิต', desc: 'ปุ่มโอนเครดิตให้เพื่อนในกระเป๋าเงิน' },
      { key: 'exchange', label: 'แลกวงเงิน', desc: 'ปุ่มแลกเปลี่ยนวงเงินในกระเป๋าเงิน' },
    ],
  },
  {
    group: 'การนัดหมาย & รางวัล', icon: 'Gift', color: 'text-rose-500', bg: 'bg-rose-50',
    features: [
      { key: 'booking', label: 'จองคิว', desc: 'แท็บจองคิวในแอปลูกค้า' },
      { key: 'rewards', label: 'แลกรางวัล', desc: 'แท็บแต้มสะสม/แลกรางวัล' },
    ],
  },
];

// ==========================================
// MAIN APP COMPONENT
// ==========================================
export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const bedParam = urlParams.get('bed');
  const branchParam = urlParams.get('branch');
  const [customerBedSession, setCustomerBedSession] = useState(
    bedParam && branchParam ? { bed: bedParam, branch: branchParam } : null
  );
  const isJobApplicationMode = urlParams.get('mode') === 'job_application';

  const [globalBranch, setGlobalBranch] = useState(localStorage.getItem('selectedBranch') || null);
  const hasAutoDetectedBranch = useRef(false);
  const [globalRole, setGlobalRole] = useState(localStorage.getItem('userRole') || 'staff');
  const [loginStep, setLoginStep] = useState('role_selection');
  const [showBranchSelectForPos, setShowBranchSelectForPos] = useState(false);
  const [showOwnerLogin, setShowOwnerLogin] = useState(false);
  const [initialEmployeeForAttendance, setInitialEmployeeForAttendance] = useState(null);
  const [ownerPasscode, setOwnerPasscode] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isBedModalOpen, setIsBedModalOpen] = useState(false);
  const [staffDashboardTab, setStaffDashboardTab] = useState('used_course');
  const [toastMessage, setToastMessage] = useState('');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [printingJobSlipBooking, setPrintingJobSlipBooking] = useState(null);

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
  const [promotions, setPromotions] = useState([]);
  const [wooImagesMap, setWooImagesMap] = useState(new Map());
  const [wooIdMap, setWooIdMap] = useState(new Map());
  const [branches, setBranches] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeeAttendance, setEmployeeAttendance] = useState([]);
  const [employeeLeaves, setEmployeeLeaves] = useState([]);
  const [employeeRequisitions, setEmployeeRequisitions] = useState([]);
  const [jobApplications, setJobApplications] = useState([]);
  const [advancePayments, setAdvancePayments] = useState([]);
  const [dailySales, setDailySales] = useState([]);
  const [storeHolidays, setStoreHolidays] = useState([]);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [selectedHolidayDate, setSelectedHolidayDate] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [serviceLogs, setServiceLogs] = useState([]);
  const [activeServices, setActiveServices] = useState([]);
  const [inventoryLogs, setInventoryLogs] = useState([]);
  const [appSettings, setAppSettings] = useState({ monthlyTarget: 0 });
  const [branchPasscodeModal, setBranchPasscodeModal] = useState({ isOpen: false, branch: null, passcode: '' });
  const [masterCourseUsagesModal, setMasterCourseUsagesModal] = useState({ isOpen: false, mc: null });
  const [showFrontAttendance, setShowFrontAttendance] = useState(false);
  // 🌟 StaffSession: โหมดหน้าลงเวลา ('select' = เลือกตัวตน / 'board' = บอร์ดภาพรวมเจ้าของ) + ตัวตนพนักงานปัจจุบัน
  const [attendanceMode, setAttendanceMode] = useState('select');
  const [activeStaff, setActiveStaff] = useState(null);
  const posAfterIdentity = useRef(false);
  const [isMobileMoreMenuOpen, setIsMobileMoreMenuOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [posParkedOrderToResume, setPosParkedOrderToResume] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [courseFilterType, setCourseFilterType] = useState('all');
  const [selectedHistoryForPhotos, setSelectedHistoryForPhotos] = useState(null);
  const [adminEnlargedPhoto, setAdminEnlargedPhoto] = useState(null);
  const [courseSummaryFilter, setCourseSummaryFilter] = useState('all');
  const [filterCustomerStatus, setFilterCustomerStatus] = useState('all'); 
  const [filterBookingStatus, setFilterBookingStatus] = useState('today_upcoming'); 
  const [filterBookingBranch, setFilterBookingBranch] = useState('all'); 
  const [filterOrderStatus, setFilterOrderStatus] = useState('รออนุมัติ'); 
  // --- HISTORY FILTERS ---
  const [historyPeriodFilter, setHistoryPeriodFilter] = useState('all'); 
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState('all'); 
  const [historyBranchFilter, setHistoryBranchFilter] = useState('all'); 
  const [historyActionTypeFilter, setHistoryActionTypeFilter] = useState('all'); 
  const [historySortBy, setHistorySortBy] = useState('newest'); 
  const [historyLimit, setHistoryLimit] = useState(60); 
  const [bookingViewMode, setBookingViewMode] = useState('timeline');
  const [customerViewMode, setCustomerViewMode] = useState('grid'); 
  const [customerSortBy, setCustomerSortBy] = useState('accumulated');
  const [customerSortMode, setCustomerSortMode] = useState('newest');
  const [customerLimit, setCustomerLimit] = useState(100);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerModalTab, setCustomerModalTab] = useState('courses'); 
  const [posPreselectedCustomer, setPosPreselectedCustomer] = useState(null);
  const [posPreselectedUsageCourses, setPosPreselectedUsageCourses] = useState([]);
  const [posReturnToStaffAfterCheckout, setPosReturnToStaffAfterCheckout] = useState(false);
  const [posPreselectedBeforePhotos, setPosPreselectedBeforePhotos] = useState([]);
  const [posPreselectedStaffName, setPosPreselectedStaffName] = useState('');
  const [posPendingAfterLogin, setPosPendingAfterLogin] = useState(false);

  const handleGoToPosDeduction = ({ customer, courses: targetCourses, beforePhotos, staffName }) => {
    setPosPreselectedCustomer(customer);
    setPosPreselectedUsageCourses(targetCourses || []);
    setPosPreselectedBeforePhotos(beforePhotos || []);
    setPosPreselectedStaffName(staffName || activeStaff?.name || '');
    setPosReturnToStaffAfterCheckout(true);
    setActiveTab('pos');
  };

  const handleReturnToStaffDashboard = () => {
    setPosReturnToStaffAfterCheckout(false);
    setPosPreselectedUsageCourses([]);
    setPosPreselectedBeforePhotos([]);
    setPosPreselectedStaffName('');
    setActiveTab('dashboard');
    setStaffDashboardTab('used_course');
  };
  
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isPrintSingleCourseMode, setIsPrintSingleCourseMode] = useState(false);
  const [isPrintMultiCourseMode, setIsPrintMultiCourseMode] = useState(false);
  const [isPrintCourseSummaryMode, setIsPrintCourseSummaryMode] = useState(false);
  const [isSelectCoursesToPrintOpen, setIsSelectCoursesToPrintOpen] = useState(false);
  const [selectedCoursesForPrint, setSelectedCoursesForPrint] = useState([]);
  const [closeCourseModalData, setCloseCourseModalData] = useState({ isOpen: false, course: null });
  const [inspectorCourse, setInspectorCourse] = useState(null);

  const [bookingTicket, setBookingTicket] = useState(null);
  const [rescheduleBookingModal, setRescheduleBookingModal] = useState({
    isOpen: false,
    booking: null,
    targetDate: '',
    targetTime: '',
    targetBranch: '',
    notifyLine: true,
    reason: ''
  });
  const [isReschedulingBooking, setIsReschedulingBooking] = useState(false);
  const [orderTicket, setOrderTicket] = useState(null);
  const orderTicketRef = useRef(null);
  const [isDownloadingTicket, setIsDownloadingTicket] = useState(false);
  const [ishipModal, setIshipModal] = useState({ isOpen: false, order: null });
  const [shippingLabelOrder, setShippingLabelOrder] = useState(null);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isCheckInScannerOpen, setIsCheckInScannerOpen] = useState(false);
  const [checkInInput, setCheckInInput] = useState('');

  const [confirmDeleteModal, setConfirmDeleteModal] = useState({ isOpen: false, type: '', data: [] });
  const [deleteProgress, setDeleteProgress] = useState({ isDeleting: false, current: 0, total: 0, type: '' });
  const [actionConfirmModal, setActionConfirmModal] = useState({ isOpen: false, title: '', message: '', action: null, confirmText: 'ยืนยัน', confirmColor: 'bg-indigo-600 hover:bg-indigo-700' });

  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isAddressManagerOpen, setIsAddressManagerOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ 
    firstName: '',
    lastName: '',
    name: '', 
    nickname: '',
    phone: '', 
    gender: 'หญิง',
    dob: '',
    age: '',
    citizenId: '',
    issue: '',
    photoFile: null,
    photoPreview: null,
    photoBase64: null,
    aiSkinScanResult: null,
    idCardPhotoFile: null,
    idCardPhotoPreview: null,
    idCardPhotoBase64: null,
    addressNo: '',
    subDistrict: '',
    district: '',
    province: '',
    zipcode: '',
    isVipUpgrade: false,
    hasMemberCard: false,
    memberCardNo: '',
    memberCardPhotoFile: null,
    memberCardPhotoPreview: null,
    memberCardPhotoBase64: null,
    irisIntakeData: null,
  });
  const [isAnalyzingSkin, setIsAnalyzingSkin] = useState(false);
  const [isScanningIdCard, setIsScanningIdCard] = useState(false);
  const [isGeminiKeyModalOpen, setIsGeminiKeyModalOpen] = useState(false);
  const [customGeminiApiKey, setCustomGeminiApiKey] = useState('');
  const [showApiKeyText, setShowApiKeyText] = useState(false);
  const [isTestingGeminiKey, setIsTestingGeminiKey] = useState(false);
  const [pendingAiAction, setPendingAiAction] = useState(null);
  const customerCameraInputRef = useRef(null);
  const customerFileInputRef = useRef(null);
  const idCardCameraInputRef = useRef(null);
  const idCardFileInputRef = useRef(null);
  const memberCardCameraInputRef = useRef(null);
  const memberCardFileInputRef = useRef(null);
  
  // 🌟 เพิ่มสถานะสำหรับระบบแก้ไขข้อมูลลูกค้า 🌟
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const [editCustomerData, setEditCustomerData] = useState({ 
    id: '', 
    name: '', 
    firstName: '',
    lastName: '',
    nickname: '',
    phone: '', 
    gender: 'หญิง',
    dob: '',
    age: '',
    citizenId: '',
    issue: '',
    photoFile: null,
    photoPreview: null,
    photoBase64: null,
    aiSkinScanResult: null,
    idCardPhotoFile: null,
    idCardPhotoPreview: null,
    idCardPhotoBase64: null,
    addressNo: '',
    subDistrict: '',
    district: '',
    province: '',
    zipcode: '',
    isVipUpgrade: false,
    hasMemberCard: false,
    memberCardNo: '',
    memberCardPhotoFile: null,
    memberCardPhotoPreview: null,
    memberCardPhotoBase64: null,
    irisIntakeData: null,
  });

  const editCustomerCameraInputRef = useRef(null);
  const editCustomerFileInputRef = useRef(null);
  const editIdCardCameraInputRef = useRef(null);
  const editIdCardFileInputRef = useRef(null);
  const editMemberCardCameraInputRef = useRef(null);
  const editMemberCardFileInputRef = useRef(null);

  // 🌟 เพิ่มสถานะสำหรับระบบจัดเก็บเอกสารลูกค้า 🌟
  const [customerDocuments, setCustomerDocuments] = useState([]);
  const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false);
  const [newDocumentForm, setNewDocumentForm] = useState({ title: '', type: 'physical', physicalLocation: '', notes: '' });
  const [documentFile, setDocumentFile] = useState(null);
  const [documentUploadProgress, setDocumentUploadProgress] = useState(0);

  // 🌟 แบบฟอร์มประวัติลูกค้า & แฟ้มเอกสาร Iris Queen Nature (IrisPatient) 🌟
  const [isIrisIntakeOpen, setIsIrisIntakeOpen] = useState(false);
  const [irisIntakeCustomer, setIrisIntakeCustomer] = useState(null);
  const [irisIntakeInitialData, setIrisIntakeInitialData] = useState(null);
  const [irisIntakeReadOnly, setIrisIntakeReadOnly] = useState(false);
  const [irisIntakeCaller, setIrisIntakeCaller] = useState('documents'); // 'documents' | 'registration'


  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [newCourseForm, setNewCourseForm] = useState({ phone: '', name: '', qty: '1', price: '', credit: '', pending: '0', branch: globalBranch || 'เฉวง' });
  const [bookingCourse, setBookingCourse] = useState(null);
  const [bookingDateTime, setBookingDateTime] = useState('');
  const [bookingCourseBranch, setBookingCourseBranch] = useState(globalBranch || 'เฉวง');
  const [isGeneralBookingOpen, setIsGeneralBookingOpen] = useState(false);
  
  // 🌟 VIP Application Form 🌟
  const [isVipFormOpen, setIsVipFormOpen] = useState(false);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [activeCreditCourses, setActiveCreditCourses] = useState([]);
  const [generalBookingForm, setGeneralBookingForm] = useState({ name: '', phone: '', service: '', dateTime: '', branch: globalBranch || 'เฉวง' });
  const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);
  const [courseSourceFilter, setCourseSourceFilter] = useState('all');
  const [courseDateFilter, setCourseDateFilter] = useState({ from: '', to: '' });
  const [newOrderForm, setNewOrderForm] = useState({ customerPhone: '', customerName: '', courseName: '', price: '', credit: '', qty: '1', branch: globalBranch || 'เฉวง' });
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddMasterCourseOpen, setIsAddMasterCourseOpen] = useState(false);
  const [editingMasterCourse, setEditingMasterCourse] = useState(null);
  const [newProductForm, setNewProductForm] = useState({ code: '', name: '', category: 'IRIS', unit: 'ชิ้น', price: '', memberPrice: '', stock: '0', isStoreUseOnly: false });
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchLat, setNewBranchLat] = useState('');
  const [newBranchLng, setNewBranchLng] = useState('');
  const [isMapPinModalOpen, setIsMapPinModalOpen] = useState(false);
  const [mapPinTarget, setMapPinTarget] = useState(null); // { type: 'new' | 'edit', id?: string, lat?: string, lng?: string }

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [adminNotifConfig, setAdminNotifConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('adminNotifConfig');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return { bookingNew: true, bookingToday: true, orderPending: true, outOfStock: true, lowStock: true, lowStockThreshold: 5, courseExpiring: true, requisitionPending: true, leaveRequest: true, soundAlert: true };
  });
  
  useEffect(() => {
    localStorage.setItem('adminNotifConfig', JSON.stringify(adminNotifConfig));
  }, [adminNotifConfig]);

  const [notifToast, setNotifToast] = useState({ show: false, title: '', message: '', type: 'info' });

  // --- CLEAR TEST DATA STATE ---
  const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false);
  const [clearDataInput, setClearDataInput] = useState('');
  const [isClearingData, setIsClearingData] = useState(false);
  // 🧹 ล้างข้อมูลทดสอบเฉพาะเดือนปัจจุบัน (scoped cleanup)
  const [isMonthCleanupOpen, setIsMonthCleanupOpen] = useState(false);
  const [cleanupPhone, setCleanupPhone] = useState('');
  const [cleanupCols, setCleanupCols] = useState({ orders: true, bookings: true, histories: true, skinScans: true });
  const [cleanupPreview, setCleanupPreview] = useState(null);
  const [cleanupInput, setCleanupInput] = useState('');
  const [isCleaningMonth, setIsCleaningMonth] = useState(false);
  const [lineNotifConfig, setLineNotifConfig] = useState({ orderNotif: true, bookingNotif: true, queueReminder: true });
  const [lineTestTarget, setLineTestTarget] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState({ title: '', body: '', ctaText: '', ctaUrl: '', color: '#10b981', targetType: 'multicast' });
  const [broadcastCoupon, setBroadcastCoupon] = useState(null); // selected coupon to attach
  const [couponsForBroadcast, setCouponsForBroadcast] = useState([]); // all active coupons
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null);
  
  // --- SETTINGS ACCORDION STATE ---
  const [isDataMgmtExpanded, setIsDataMgmtExpanded] = useState(false);
  const [isDangerZoneExpanded, setIsDangerZoneExpanded] = useState(true);
  const prevPendingCount = useRef(-1);
  const prevBookingsRef = useRef(null);
  const notifTimerRef = useRef(null);
  const posTimerRef = useRef(null);


  // Load LINE Notification config
  const lineNotifConfigRef = useRef(lineNotifConfig);
  lineNotifConfigRef.current = lineNotifConfig;
  const customersRawRef = useRef(customersRaw);
  customersRawRef.current = customersRaw;

  // 🔔 Helper ค้นหา LINE UID ของลูกค้าสำหรับการส่งแจ้งเตือนการจองคิว
  const getBookingLineUid = (b) => {
    if (!b) return null;
    if (b.lineUid && !String(b.lineUid).includes('mock')) return b.lineUid;

    const bPhone = String(b.customerPhone || b.cleanPhone || b.phone || '').replace(/\D/g, '');
    const currentCustomers = customersRawRef.current || customersRaw || [];
    
    // 1. ค้นหาจาก customerId
    if (b.customerId) {
      const match = currentCustomers.find(c => c.id === b.customerId);
      if (match?.lineUid && !String(match.lineUid).includes('mock')) return match.lineUid;
    }

    // 2. ค้นหาจากเบอร์โทรศัพท์
    if (bPhone) {
      const matches = currentCustomers.filter(c => {
        const cPhone = String(getFuzzyKey(c, ["เบอร์โทร", "col_3", "phone"]) || c.cleanPhone || '').replace(/\D/g, '');
        return cPhone && (cPhone === bPhone || cPhone.endsWith(bPhone) || bPhone.endsWith(cPhone));
      });
      const realUser = matches.find(c => c.lineUid && !String(c.lineUid).includes('mock'));
      if (realUser) return realUser.lineUid;
      if (matches[0]?.lineUid) return matches[0].lineUid;
    }

    return (b.lineUid && !String(b.lineUid).includes('mock')) ? b.lineUid : null;
  };

  useEffect(() => {
    const loadLineConfig = async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const snap = await getDoc(doc(db, 'config', 'lineNotifications'));
        if (snap.exists()) {
          setLineNotifConfig(prev => ({ ...prev, ...snap.data() }));
        }
      } catch(e) {}
    };
    loadLineConfig();
  }, []);

  // 🎛️ สวิตช์เปิด/ปิดฟีเจอร์ — ฟังแบบเรียลไทม์จาก config/featureFlags
  const [featureFlags, setFeatureFlags] = useState({});
  // settingsSection state is now managed inside SettingsPage component
  const featureFlagsRef = useRef(featureFlags);
  featureFlagsRef.current = featureFlags;
  useEffect(() => {
    const unsub = onSnapshot(getDocRef('config', 'featureFlags'), (snap) => {
      setFeatureFlags(snap.data() || {});
    }, () => {});
    return () => unsub();
  }, []);

  // ⏱️ การตั้งค่าเวลาบริการและสล็อตคิว — ฟังแบบเรียลไทม์จาก config/booking
  const [bookingConfig, setBookingConfig] = useState(DEFAULT_BOOKING_CONFIG);
  useEffect(() => {
    const unsub = onSnapshot(getDocRef('config', 'booking'), (snap) => {
      if (snap.exists()) {
        setBookingConfig(prev => ({
          ...DEFAULT_BOOKING_CONFIG,
          ...snap.data(),
          serviceDurations: {
            ...DEFAULT_BOOKING_CONFIG.serviceDurations,
            ...(snap.data().serviceDurations || {})
          },
          extraSlotOverrides: snap.data().extraSlotOverrides || {}
        }));
      }
    }, (err) => console.error("Error loading bookingConfig:", err));
    return () => unsub();
  }, []);

  // 🌟 เปิดรับคิวเพิ่มรายรอบเวลาโดยตรงจากการ์ดคิว (Staff Extra Slot from Card)
  const handleToggleBookingExtraSlot = async (b, delta = 1) => {
    if (!b) return;
    const dtSafe = getSafeDateTime(b);
    const dateStr = b.date || (dtSafe ? dtSafe.split('T')[0] : '');
    const timeStr = b.time ? b.time.substring(0, 5) : (dtSafe ? dtSafe.split('T')[1]?.substring(0, 5) : '');
    const branchName = String(b.branch || 'เฉวง').replace(/^สาขา/, '').trim();
    
    if (!dateStr || !timeStr) {
      showToast('ไม่พบข้อมูลวันที่หรือเวลาของคิวนี้', 'error');
      return;
    }

    const key = `${dateStr}_${branchName}_${timeStr}`;
    const currentExtra = Number(bookingConfig?.extraSlotOverrides?.[key] || 0);
    const newExtra = Math.max(0, currentExtra + delta);

    try {
      await setDoc(getDocRef('config', 'booking'), {
        extraSlotOverrides: {
          ...(bookingConfig?.extraSlotOverrides || {}),
          [key]: newExtra
        }
      }, { merge: true });

      if (delta > 0) {
        showToast(`เปิดรับคิวเพิ่มรอบ ${timeStr} น. (${branchName}) สำเร็จ! รวมเปิดเพิ่ม +${newExtra} คิว`, 'success');
      } else {
        showToast(`ลดคิวที่เปิดเพิ่มรอบ ${timeStr} น. เหลือ +${newExtra} คิว`, 'info');
      }
    } catch (err) {
      console.error("Failed to update extra slot:", err);
      showToast('เกิดข้อผิดพลาดในการเปิดรับคิวเพิ่ม: ' + err.message, 'error');
    }
  };

  // 🗓️ พนักงานเลื่อนวันและเวลานัดหมาย (Staff Reschedule Booking)
  const openRescheduleModal = (b) => {
    if (!b) return;
    const dtSafe = getSafeDateTime(b);
    const currentDate = b.date || (dtSafe ? dtSafe.split('T')[0] : new Date().toISOString().split('T')[0]);
    const currentTime = b.time ? b.time.substring(0, 5) : (dtSafe ? dtSafe.split('T')[1]?.substring(0, 5) : '13:00');
    const currentBranch = String(b.branch || 'เฉวง').replace(/^สาขา/, '').trim();
    
    setRescheduleBookingModal({
      isOpen: true,
      booking: b,
      targetDate: currentDate,
      targetTime: currentTime,
      targetBranch: currentBranch || 'เฉวง',
      notifyLine: true,
      reason: ''
    });
  };

  const handleConfirmReschedule = async () => {
    if (!rescheduleBookingModal.booking || isReschedulingBooking) return;
    const { booking, targetDate, targetTime, targetBranch, notifyLine, reason } = rescheduleBookingModal;
    
    if (!targetDate || !targetTime) {
      showToast('กรุณาระบุวันที่และเวลาที่ต้องการเลื่อน', 'error');
      return;
    }

    setIsReschedulingBooking(true);
    const newDateTime = `${targetDate}T${targetTime}:00`;
    const oldSafeDt = getSafeDateTime(booking);

    try {
      const updatePayload = {
        date: targetDate,
        time: targetTime,
        dateTime: newDateTime,
        branch: targetBranch || booking.branch || 'เฉวง',
        rescheduledAt: new Date().toISOString(),
        rescheduledBy: 'staff',
        lastRescheduledFrom: oldSafeDt || null,
        reminded20m: false,
        reminded1hr: false
      };
      if (reason && reason.trim()) {
        updatePayload.rescheduleReason = reason.trim();
      }

      await updateDoc(getDocRef('bookings', booking.id), updatePayload);

      // อัปเดต modal ที่เปิดอยู่ถ้าเป็นรายการเดียวกัน
      if (bookingTicket && bookingTicket.id === booking.id) {
        setBookingTicket(prev => prev ? ({ ...prev, ...updatePayload }) : null);
      }

      // ส่งข้อความแจ้งเตือนทาง LINE ถ้ามี LINE UID
      const targetLineUid = getBookingLineUid(booking);
      if (notifyLine && targetLineUid) {
        const updatedBookingForNotif = { ...booking, ...updatePayload };
        sendBookingLineNotification(updatedBookingForNotif, 'เลื่อนเวลานัดหมาย', targetLineUid);
      }

      const [y, m, d] = targetDate.split('-');
      const thYear = Number(y) + 543;
      showToast(`เลื่อนนัดหมายเป็นวันที่ ${d}/${m}/${thYear} เวลา ${targetTime} น. สำเร็จ!`, 'success');
      setRescheduleBookingModal({ isOpen: false, booking: null, targetDate: '', targetTime: '', targetBranch: '', notifyLine: true, reason: '' });
    } catch (err) {
      console.error('Error rescheduling booking:', err);
      showToast('เกิดข้อผิดพลาดในการเลื่อนนัดหมาย: ' + err.message, 'error');
    } finally {
      setIsReschedulingBooking(false);
    }
  };

  // 📋 แบบประเมิน AI (ช่วงทดสอบ) — ฟังแบบเรียลไทม์
  const [aiSurveys, setAiSurveys] = useState([]);
  useEffect(() => {
    const unsub = onSnapshot(getCol('surveys'), (snap) => {
      setAiSurveys(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    }, () => {});
    return () => unsub();
  }, []);
  const toggleFeatureFlag = async (key, value) => {
    setFeatureFlags(prev => ({ ...prev, [key]: value })); // optimistic
    try {
      await setDoc(getDocRef('config', 'featureFlags'), { [key]: value, updatedAt: new Date().toISOString() }, { merge: true });
      showToast(`ฟีเจอร์ถูก${value ? 'เปิด' : 'ปิด'}แล้ว — แอปลูกค้าอัพเดททันที`, 'success');
    } catch (e) { showToast('บันทึกไม่สำเร็จ: ' + e.message, 'error'); }
  };

  // 📦 ดึงสถานะพัสดุจาก 17TRACK → บันทึกลง order.trackingInfo (ฝั่งลูกค้าอ่านจาก Firestore โดยไม่ต้องใช้ token)
  // 📮 Modal กรอกเลขพัสดุ (แทน window.prompt ที่ถูกเบราว์เซอร์บางตัวบล็อก)
  const [trackingInputModal, setTrackingInputModal] = useState(null); // { order, value }
  // แปลงสถานะ PascalCase ของ 17TRACK ("InTransit", "Not_found") → camelCase ที่ระบบใช้ ("inTransit", "notFound")
  const normTrackPhase = (s) => {
      const x = String(s || 'Pending');
      const camel = x.charAt(0).toLowerCase() + x.slice(1);
      return camel.replace(/_([a-zA-Z])/g, (m, c) => c.toUpperCase());
  };
  const refreshTracking17 = async (order, silent = false) => {
    const num = String(order.trackingNo || '').trim();
    if (!num) { if (!silent) showToast('ออเดอร์นี้ยังไม่มีเลขติดตามพัสดุ', 'error'); return null; }
    try {
      // สมัครเลขให้ 17TRACK ติดตาม (ถ้าเคยสมัครแล้วจะ error ก็ปล่อยผ่าน)
      try { await fetch17Track('https://api.17track.net/track/v2.2/register', [{ number: num }]); } catch (e) {}
      const json = await fetch17Track('https://api.17track.net/track/v2.2/gettrackinfo', [{ number: num }]);
      // 🌟 endpoint ที่ถูกคือ gettrackinfo → โครงสร้าง: data.accepted[0].track_info
      const acc = json?.data?.accepted?.[0];
      const ti = acc?.track_info || null;
      const allEvents = (ti?.tracking?.providers || []).flatMap(p => p?.events || []);
      const lastEv = ti?.latest_event || allEvents[allEvents.length - 1] || null;
      const info = {
        number: num,
        carrier: acc?.carrier ? String(acc.carrier) : '',
        phase: normTrackPhase(ti?.latest_status?.status),
        lastEvent: lastEv ? { time: lastEv.time_iso || '', desc: lastEv.description || '', location: lastEv.location || '' } : null,
        events: allEvents.slice(-8).reverse().map(e => ({ time: e.time_iso || '', desc: e.description || '', location: e.location || '' })),
        fetchedAt: new Date().toISOString()
      };
      const isDelivered = info.phase === 'delivered';
      const orderUpdate = { trackingInfo: info };
      if (isDelivered) {
        orderUpdate.status = 'จัดส่งสำเร็จ';
        orderUpdate.fulfillment = 'delivered';
        orderUpdate.updatedAt = new Date().toISOString();
      }
      await updateDoc(getDocRef('orders', order.id), orderUpdate);

      if (isDelivered) {
        const orderNo = String(order.orderNo || order.id || '').trim();
        const curHistories = historiesRef.current || histories || [];
        const matchingHistories = curHistories.filter(h => {
          const ref = String(getFuzzyKey(h, ["หมายเลขคำสั่งซื้อ", "เลขที่คำสั่งซื้อ", "col_5", "Order", "Ref", "เลขอ้างอิง"]) || '').trim();
          return ref && (ref === orderNo || (order.orderNo && ref === String(order.orderNo).trim()) || (order.id && ref === String(order.id).trim()));
        });
        if (matchingHistories.length > 0) {
          const batch = writeBatch(db);
          matchingHistories.forEach(h => {
            if (h.id) {
              batch.update(getDocRef('histories', h.id), {
                status: 'จัดส่งสำเร็จ',
                "สถานะ": 'จัดส่งสำเร็จ',
                "col_22": 'จัดส่งสำเร็จ',
                fulfillment: 'delivered'
              });
            }
          });
          await batch.commit().catch(e => console.warn('Failed to update matching histories on delivered:', e));
        }
      }

      if (!silent) showToast(`ดึงสถานะพัสดุสำเร็จ: ${TRACK17_PHASE_TH[info.phase] || info.phase} (${num})`, 'success');
      return info;
    } catch (e) {
      if (!silent) showToast('ดึงสถานะไม่สำเร็จ: ' + e.message, 'error');
      return null;
    }
  };

  // 🌟 Auto-refresh 17TRACK แบบ Shopee: ดึงสถานะพัสดุที่กำลังขนส่งเองทุก 15 นาที (เบื้องหลัง เงียบๆ)
  const ordersRef = useRef(orders);
  ordersRef.current = orders;
  const historiesRef = useRef(histories);
  historiesRef.current = histories;
  useEffect(() => {
    let cancelled = false;
    const DEAD_PHASES = ['delivered', 'undelivered', 'expired'];
    const runAutoRefresh = async () => {
      if (cancelled) return;
      if (featureFlagsRef.current.tracking === false) return; // 🎛️ ปิดฟีเจอร์ติดตามพัสดุ → งดดึงอัตโนมัติ
      const now = Date.now();
      const targets = (ordersRef.current || [])
        .filter(o => o.trackingNo && (o.status === 'ชำระเงินแล้ว' || o.status === 'กำลังจัดส่ง' || o.status === 'รอตรวจสอบ' || o.status === 'รอดำเนินการ')) // ดึงพัสดุสำหรับออเดอร์ที่อยู่ในกระบวนการจัดส่ง
        .filter(o => !o.trackingInfo?.phase || !DEAD_PHASES.includes(String(o.trackingInfo.phase)))
        .filter(o => !o.trackingInfo?.fetchedAt || (now - new Date(o.trackingInfo.fetchedAt).getTime()) > 15 * 60 * 1000) // ดึงทุกๆ 15 นาที
        .slice(0, 8); // จำกัดต่อรอบกันเกินโควตา API
      for (const o of targets) {
        if (cancelled) break;
        await refreshTracking17(o, true);
        await new Promise(r => setTimeout(r, 3000)); // เว้นจังหวะกัน rate limit
      }
    };
    const firstRun = setTimeout(runAutoRefresh, 20000);            // รอบแรก 20 วิหลังเปิดแอป
    const interval = setInterval(runAutoRefresh, 15 * 60 * 1000);  // จากนั้นทุก 15 นาที
    return () => { cancelled = true; clearTimeout(firstRun); clearInterval(interval); };
  }, []);

  // Subscribe to coupons for broadcast selector
  useEffect(() => {
    const unsub = onSnapshot(getCol('coupons'), (snap) => {
      setCouponsForBroadcast(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const triggerToast = (title, message, type = 'info') => {
      // รองรับกรณีคอมโพเนนต์ลูกเรียก showToast(msg, 'success' | 'error' | 'warning' | 'info') แบบ 2 อาร์กิวเมนต์
      let resolvedTitle = title;
      let resolvedMessage = message;
      let resolvedType = type;
      if (['success', 'error', 'warning', 'info', 'alert'].includes(message) && type === 'info') {
          resolvedType = message;
          resolvedTitle = message === 'error' ? 'เกิดข้อผิดพลาด' : message === 'warning' ? 'แจ้งเตือน' : 'สำเร็จ';
          resolvedMessage = title;
      } else if (message === undefined) {
          resolvedMessage = title;
          resolvedTitle = 'แจ้งเตือน';
      }
      setNotifToast({ show: true, title: resolvedTitle, message: resolvedMessage, type: resolvedType });
      if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
      notifTimerRef.current = setTimeout(() => {
          setNotifToast(prev => ({ ...prev, show: false }));
      }, 6000);
      
      if (resolvedType === 'alert') {
          try {
              const alertAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
              alertAudio.play().catch(e => console.log(e));
          } catch(err) {}
      }
  };

  const [useCourseModal, setUseCourseModal] = useState({ isOpen: false, customer: null, targetCourseId: null });
  const [useCourseData, setUseCourseData] = useState({ staffName: '', photoUrl: null, selections: {}, productSelections: [], branch: globalBranch || 'เฉวง' });
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
      case 'promotions': return promotions;
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
      case 'promotions': return String(getFuzzyKey(item, ["ชื่อโปรโมชั่น", "col_1"]) || '-');
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
      case 'promotions': return String(getFuzzyKey(item, ["เงื่อนไข", "col_2"]) || '-');
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
      case 'promotions': return getFuzzyKey(item, ["สถานะ", "col_3"]) || '-';
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

  const fetchWooProducts = async () => {
    if (!WOO_CFG.url) return;
    try {
      const newImgMap = new Map();
      const newIdMap = new Map();
      let page = 1;
      let hasMore = true;
      // Fetch up to 10 pages (1000 products) to ensure we get all of them
      while (hasMore && page <= 10) {
        const data = await fetchWithProxy(`${WOO_CFG.url.replace(/\/$/, '')}/wp-json/wc/v3/products?per_page=100&page=${page}`, { method: 'GET' });
        if (Array.isArray(data) && data.length > 0) {
          data.forEach(wp => {
            const norm = (s) => String(s || '').toLowerCase().replace(/[\s\(\)\-_+.,/]/g, '');
            if (wp.sku) {
              const sku = String(wp.sku).trim().toUpperCase();
              newIdMap.set(sku, wp.id);
              newIdMap.set(norm(sku), wp.id);
            }
            if (wp.name) {
              const name = String(wp.name).toLowerCase().trim();
              newIdMap.set(name, wp.id);
              newIdMap.set(norm(name), wp.id);
            }
            if (wp.images && wp.images.length > 0) {
              const imgSrc = wp.images[0].src;
              if (wp.sku) {
                const sku = String(wp.sku).trim().toUpperCase();
                newImgMap.set(sku, imgSrc);
                newImgMap.set(norm(sku), imgSrc);
              }
              if (wp.name) {
                const name = String(wp.name).toLowerCase().trim();
                newImgMap.set(name, imgSrc);
                newImgMap.set(norm(name), imgSrc);
              }
            }
          });
          if (data.length < 100) hasMore = false;
          else page++;
        } else {
          hasMore = false;
        }
      }
      setWooImagesMap(newImgMap);
      setWooIdMap(newIdMap);
    } catch (err) {
      console.error("Failed to fetch woo products:", err);
    }
  };

  useEffect(() => {
    fetchWooProducts();
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
    const totalKeyCollections = 10;
    const updateProgress = () => { 
      loaded++; 
      setLoadingProgress(Math.min(100, Math.round((loaded / totalKeyCollections) * 100))); 
      if (loaded >= totalKeyCollections) setTimeout(() => setIsCloudLoading(false), 300); 
    };
    const safetyTimer = setTimeout(() => setIsCloudLoading(false), 6000);
    const errHandler = (err) => { console.error(err); updateProgress(); };

    const unsub1 = onSnapshot(getCol('courses'), (s) => { setCourses(s.docs.map(d => ({ id: d.id, ...d.data() }))); updateProgress(); }, errHandler);
    const unsub2 = onSnapshot(getCol('master_courses'), (s) => { setMasterCourses(s.docs.map(d => ({ id: d.id, ...d.data() }))); updateProgress(); }, errHandler);
    const unsub3 = onSnapshot(getCol('customers'), (s) => { setCustomersRaw(s.docs.map(d => ({ id: d.id, ...d.data() }))); updateProgress(); }, errHandler);
    const unsub4 = onSnapshot(getCol('histories'), (s) => { setHistories(s.docs.map(d => ({ id: d.id, ...d.data() }))); updateProgress(); }, errHandler);
    const unsub5 = onSnapshot(getCol('bookings'), (s) => { setBookings(s.docs.map(d => ({ id: d.id, ...d.data() }))); updateProgress(); }, errHandler);
    const unsub6 = onSnapshot(getCol('orders'), (s) => { setOrders(s.docs.map(d => ({ id: d.id, ...d.data() }))); updateProgress(); }, errHandler);
    const unsub7 = onSnapshot(getCol('products'), (s) => { setProducts(s.docs.map(d => ({ id: d.id, ...d.data() }))); updateProgress(); }, errHandler);
    const unsubPromo = onSnapshot(getCol('promotions'), (s) => { setPromotions(s.docs.map(d => ({ id: d.id, ...d.data() }))); }, errHandler);
    const unsub8 = onSnapshot(getCol('branches'), (s) => { 
      let docs = s.docs.map(d => ({ id: d.id, ...d.data() }));
      if (docs.length === 0) {
        // Fallback or seed default branches if none exist
        docs = [
          { id: 'default-1', name: 'สาขาเฉวง', passcode: '' },
          { id: 'default-2', name: 'สาขาละไม', passcode: '' }
        ];
      }
      setBranches(docs);
    }, errHandler);
    const unsub9 = onSnapshot(getCol('daily_sales'), (s) => { setDailySales(s.docs.map(d => ({ id: d.id, ...d.data() }))); updateProgress(); }, errHandler);
    const unsubHolidays = onSnapshot(getCol('store_holidays'), (s) => { setStoreHolidays(s.docs.map(d => ({ ...d.data(), id: d.id }))); updateProgress(); }, errHandler);
    const unsub10 = onSnapshot(doc(db, 'app_settings', 'financial'), (docSnap) => { 
      if (docSnap.exists()) {
        setAppSettings(docSnap.data());
      }
      updateProgress(); 
    }, errHandler);
    const unsub11 = onSnapshot(getCol('employees'), (s) => { setEmployees(s.docs.map(d => ({ id: d.id, ...d.data() }))); }, errHandler);
    const unsub12 = onSnapshot(getCol('employee_attendance'), (s) => { setEmployeeAttendance(s.docs.map(d => ({ id: d.id, ...d.data() }))); }, errHandler);
    const unsub13 = onSnapshot(getCol('employee_leaves'), (s) => { setEmployeeLeaves(s.docs.map(d => ({ id: d.id, ...d.data() }))); }, errHandler);
    const unsubReqs = onSnapshot(getCol('employee_requisitions'), (s) => { setEmployeeRequisitions(s.docs.map(d => ({ id: d.id, ...d.data() }))); }, errHandler);
    const unsubJobs = onSnapshot(getCol('jobApplications'), (s) => { setJobApplications(s.docs.map(d => ({ id: d.id, ...d.data() }))); }, errHandler);
    const unsub14 = onSnapshot(getCol('advance_payments'), (s) => { setAdvancePayments(s.docs.map(d => ({ id: d.id, ...d.data() }))); }, errHandler);
    const unsub15 = onSnapshot(getCol('expenses'), (s) => { setExpenses(s.docs.map(d => ({ id: d.id, ...d.data() }))); }, errHandler);
    const unsub16 = onSnapshot(getCol('service_logs'), (s) => { setServiceLogs(s.docs.map(d => ({ id: d.id, ...d.data() }))); }, errHandler);
    const unsubInvLogs = onSnapshot(getCol('inventory_logs'), (s) => { setInventoryLogs(s.docs.map(d => ({ id: d.id, ...d.data() }))); }, errHandler);
    const unsubActiveServices = onSnapshot(getCol('active_services'), (s) => { setActiveServices(s.docs.map(d => ({ id: d.id, ...d.data() }))); }, errHandler);

    return () => { 
      clearTimeout(safetyTimer);
      unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); unsub6(); unsub7(); unsubPromo(); unsub8(); unsub9(); unsubHolidays(); unsub10(); unsub11(); unsub12(); unsub13(); unsubReqs(); unsubJobs(); unsub14(); unsub15(); unsub16(); unsubInvLogs(); unsubActiveServices();
    };
  }, [user]);

  // 🌟 ตัวตนพนักงานปัจจุบัน (ย้ายขึ้นมาอยู่ก่อน early returns เพื่อไม่ให้ผิดกฎ React Hooks เวลาสั่งพิมพ์ใบคอร์ส)
  useEffect(() => {
    const id = localStorage.getItem('personalEmployeeId');
    if (id && employees.length > 0) {
      const emp = employees.find(e => e.id === id);
      setActiveStaff(emp || null);
    }
  }, [employees]);

  // ซิงค์เป้ายอดขายที่เคยถูกบันทึกไว้ใต้คีย์ 'สำนักงานใหญ่' (จากบั๊กค่าเริ่มต้น dropdown) ไปยังสาขาแรกจริง (เช่น 'เฉวง' / 'สาขาเฉวง')
  useEffect(() => {
    if (!branches || branches.length === 0) return;
    const validBranchNames = branches.map(b => b.name || b.id).filter(Boolean);
    if (validBranchNames.includes('สำนักงานใหญ่')) return;

    const hqTarget = appSettings?.branchTargets?.['สำนักงานใหญ่'];
    if (hqTarget === undefined) return;

    const firstBranch = validBranchNames[0];
    if (!firstBranch) return;
    const cleanFirst = String(firstBranch).replace('สาขา', '').trim();
    const altFirst = String(firstBranch).startsWith('สาขา') ? cleanFirst : `สาขา${cleanFirst}`;

    const migrateMap = (mapObj) => {
      if (!mapObj || mapObj['สำนักงานใหญ่'] === undefined) return undefined;
      const val = mapObj['สำนักงานใหญ่'];
      const next = { ...mapObj, 'สำนักงานใหญ่': deleteField() };
      if (val > 0) {
        next[firstBranch] = val;
        next[altFirst] = val;
        next[cleanFirst] = val;
      }
      return next;
    };

    const payload = {};
    const nextBranchTargets = migrateMap(appSettings?.branchTargets);
    const nextCourseTargets = migrateMap(appSettings?.courseTargets);
    const nextProductTargets = migrateMap(appSettings?.productTargets);
    const nextBranchBudgets = migrateMap(appSettings?.branchBudgets);
    if (nextBranchTargets) payload.branchTargets = nextBranchTargets;
    if (nextCourseTargets) payload.courseTargets = nextCourseTargets;
    if (nextProductTargets) payload.productTargets = nextProductTargets;
    if (nextBranchBudgets) payload.branchBudgets = nextBranchBudgets;

    if (Object.keys(payload).length > 0) {
      setDoc(doc(db, 'app_settings', 'financial'), payload, { merge: true }).catch(console.error);
    }
  }, [branches, appSettings]);

  // 🌟 โหลดสาขาเริ่มต้นทันทีเมื่อโหลดข้อมูลเสร็จ (จำค่าเดิมที่เลือกไว้ ข้ามการเช็ค GPS เพื่อให้โหลดเร็วขึ้น)
  useEffect(() => {
    if (!isCloudLoading && branches.length > 0 && !hasAutoDetectedBranch.current) {
      hasAutoDetectedBranch.current = true;
      const savedBranch = localStorage.getItem('selectedBranch');
      const activeBranches = branches.filter(b => !b.isMaintenance);
      const targetBranch = (savedBranch && activeBranches.some(b => b.name === savedBranch))
        ? savedBranch
        : (activeBranches[0] || branches[0])?.name;
      if (targetBranch && globalBranch !== targetBranch) {
        setGlobalBranch(targetBranch);
        localStorage.setItem('selectedBranch', targetBranch);
      }
    }
  }, [isCloudLoading, branches, globalBranch]);

  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!selectedCustomer) {
      setCustomerDocuments([]);
      return;
    }
    const q = query(getCol('customer_documents'), where('customerId', '==', selectedCustomer.id), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setCustomerDocuments(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [selectedCustomer]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      bookings.forEach(b => {
        const st = b.status || b["สถานะ"] || "รอการยืนยัน";
        const safeDt = getSafeDateTime(b);
        if (st === 'กำลังใช้บริการ' && b.serviceStartTime) {
          const startTime = new Date(b.serviceStartTime);
          const diffHours = (now - startTime) / (1000 * 60 * 60);
          if (diffHours >= 1.5) {
            updateDoc(getDocRef('bookings', b.id), { 
                status: 'เสร็จสิ้น', 
                "สถานะ": "เสร็จสิ้น", 
                serviceEndTime: now.toISOString() 
            }).catch(console.error);
          }
        } else if ((st === 'รอการยืนยัน' || st === 'ยืนยันแล้ว' || st === 'รอเข้ารับบริการ') && safeDt) {
          const bookingTime = new Date(safeDt);
          const diffMins = (now - bookingTime) / (1000 * 60);
          
          if (diffMins >= 20) {
            // Auto cancel if 20 mins late
            updateDoc(getDocRef('bookings', b.id), { 
                status: 'ยกเลิก', 
                "สถานะ": "ยกเลิก",
                cancelReason: 'เลยเวลาจองเกิน 20 นาที และไม่ได้มาเช็คอิน'
            }).then(() => {
                const targetLineUid = getBookingLineUid(b);
                if (targetLineUid && lineNotifConfigRef.current?.bookingNotif !== false) {
                    sendBookingLineNotification(b, 'ยกเลิก', targetLineUid);
                }
            }).catch(console.error);
          } else if (st === 'ยืนยันแล้ว' && diffMins <= -19) {
            // Reminders for confirmed bookings
            const minsUntil = -diffMins; 
            if (minsUntil <= 20 && minsUntil > 0 && !b.reminded20m) {
               updateDoc(getDocRef('bookings', b.id), { reminded20m: true, reminded1hr: true }).catch(console.error);
               const targetLineUid = getBookingLineUid(b);
               if (targetLineUid && lineNotifConfigRef.current?.queueReminder !== false) {
                   sendBookingLineNotification(b, 'เตือนคิว (อีก 20 นาที)', targetLineUid);
               }
            } else if (minsUntil <= 60 && minsUntil > 20 && !b.reminded1hr) {
               updateDoc(getDocRef('bookings', b.id), { reminded1hr: true }).catch(console.error);
               const targetLineUid = getBookingLineUid(b);
               if (targetLineUid && lineNotifConfigRef.current?.queueReminder !== false) {
                   sendBookingLineNotification(b, 'เตือนคิว (อีก 1 ชม.)', targetLineUid);
               }
            }
          }
        }
      });
    }, 60000);
    return () => clearInterval(timer);
  }, [bookings]);

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
    // 🌟 High-performance index maps for O(1) customer history matching
    const historiesByName = new Map();
    const historiesByPhone = new Map();

    histories.forEach(h => {
      if (h.isCancelled || String(getFuzzyKey(h, ["สถานะ", "col_7", "col_8", "col_9"]) || '') === 'ยกเลิก') return;
      
      const rawName = String(getFuzzyKey(h, ["ชื่อลูกค้า", "col_2", "ผู้ใช้คอส", "col_17"]) || '').trim();
      if (rawName) {
        const normName = rawName.replace(/\s+/g, '').toLowerCase();
        if (!historiesByName.has(normName)) historiesByName.set(normName, []);
        historiesByName.get(normName).push(h);
        if (!historiesByName.has(rawName)) historiesByName.set(rawName, []);
        historiesByName.get(rawName).push(h);
      }

      const rawPhone = String(getFuzzyKey(h, ["cleanPhone", "เบอร์โทร", "เบอร์โทรลูกค้า", "col_3", "phone"]) || '').replace(/\D/g, '');
      if (rawPhone && rawPhone.length >= 9) {
        if (!historiesByPhone.has(rawPhone)) historiesByPhone.set(rawPhone, []);
        historiesByPhone.get(rawPhone).push(h);
      }
    });

    return customersRaw.map(c => {
      const oldAmount = parseNumber(getFuzzyKey(c, ["ยอดสะสม", "col_13"]));
      const posName = String(getFuzzyKey(c, ["ชื่อ", "col_1"]) || '').trim();
      
      let displayName = posName;
      if (c.firstName && c.lastName) {
          displayName = `${c.firstName} ${c.lastName}`.trim();
      } else if (c.computedName && c.computedName !== posName) {
          displayName = c.computedName;
      }

      const myHistoriesMap = new Map();
      const normPosName = posName.replace(/\s+/g, '').toLowerCase();
      const normDisplayName = displayName.replace(/\s+/g, '').toLowerCase();

      if (normPosName && historiesByName.has(normPosName)) {
        historiesByName.get(normPosName).forEach(h => myHistoriesMap.set(h.id || JSON.stringify(h), h));
      }
      if (normDisplayName && normDisplayName !== normPosName && historiesByName.has(normDisplayName)) {
        historiesByName.get(normDisplayName).forEach(h => myHistoriesMap.set(h.id || JSON.stringify(h), h));
      }
      
      const cleanPhone = String(getFuzzyKey(c, ["เบอร์โทร", "col_3", "phone", "computedPhone", "cleanPhone"]) || '').replace(/\D/g, '');
      if (cleanPhone && cleanPhone.length >= 9 && historiesByPhone.has(cleanPhone)) {
        historiesByPhone.get(cleanPhone).forEach(h => myHistoriesMap.set(h.id || JSON.stringify(h), h));
      }

      const myHistories = Array.from(myHistoriesMap.values());
      
      let historyEarned = 0;
      let historySpent = 0;
      let productEarned = 0;
      
      myHistories.forEach(h => {
         const type = String(getFuzzyKey(h, ["ประเภท", "col_4"]) || '');
         const amt = parseNumber(getFuzzyKey(h, ["ยอดสินค้า", "ยอดจัดซื้อ", "ยอดเงิน", "ยอด", "col_19"]));
         if (amt > 0) {
             if (type.includes('เบิก') || type.includes('จ่าย') || type.includes('หัก')) {
                 historySpent += amt;
             } else {
                 historyEarned += amt;
                 if (type.includes('สินค้า')) {
                     productEarned += amt;
                 }
             }
         }
      });

      const totalAccumulated = oldAmount + historyEarned - historySpent;
      const productAccumulatedAmount = oldAmount + productEarned;
      
      let memberStatus = String(getFuzzyKey(c, ["สถานะสมาชิก", "col_7"]) || '').trim() || 'ทั่วไป';
      if (productAccumulatedAmount >= 5000 && ['ยังไม่สะสมยอด', 'ทั่วไป', 'สะสมยอด', ''].includes(memberStatus)) memberStatus = 'รอบัตร';
      else if (productAccumulatedAmount > 0 && productAccumulatedAmount < 5000 && ['ยังไม่สะสมยอด', 'ทั่วไป', ''].includes(memberStatus)) memberStatus = 'สะสมยอด';
      
      // 🌟 ดึงข้อมูลรูปภาพสำหรับ Customer
      const picData = getProfilePicData(c, null);
      const createdAtTimestamp = getCustomerTimestamp(c);

      return { 
        ...c, 
        computedName: displayName, 
        computedPhone: String(getFuzzyKey(c, ["เบอร์โทร", "col_3", "phone", "computedPhone"]) || ''), 
        computedMemberStatus: memberStatus, 
        computedIssue: String(getFuzzyKey(c, ["ปัญหาผิวหน้า", "col_8"]) || ''), 
        realAccumulatedAmount: totalAccumulated, 
        productAccumulatedAmount, 
        oldAmount, 
        historyEarned, 
        productEarned,
        historySpent, 
        myHistories, 
        isApproved: !['ยังไม่สะสมยอด', 'ทั่วไป', 'สะสมยอด', 'รอบัตร'].includes(memberStatus) && memberStatus !== '',
        hasMoleHistory: myHistories.some(isMoleHistoryRecord),
        profilePicData: picData,
        createdAtTimestamp
      };
    });
  }, [customersRaw, histories]);

  const processedCourses = useMemo(() => {
    const consumedHistoryIds = new Set();
    const sortedCourses = [...courses].sort((a,b) => {
        const dA = parseThaiDate(getFuzzyKey(a, ["วันที่ซื้อ", "col_3"]));
        const dB = parseThaiDate(getFuzzyKey(b, ["วันที่ซื้อ", "col_3"]));
        if (dA && dB) return dA.getTime() - dB.getTime();
        return 0;
    });

    // 🌟 Pre-index customers by clean phone and master courses by code for instant O(1) lookups
    const customersByPhoneMap = new Map();
    customersRaw.forEach(cu => {
      const cuPhone = String(getFuzzyKey(cu, ["เบอร์โทร", "col_3", "phone", "cleanPhone"]) || '').replace(/\D/g, '');
      if (cuPhone && !customersByPhoneMap.has(cuPhone)) {
        customersByPhoneMap.set(cuPhone, cu);
      }
    });

    const masterCoursesByCodeMap = new Map();
    masterCourses.forEach(mc => {
      const mcCode = String(getFuzzyKey(mc, ["รหัสคอส", "col_1", "code"]) || '').trim().toLowerCase();
      if (mcCode && !masterCoursesByCodeMap.has(mcCode)) {
        masterCoursesByCodeMap.set(mcCode, mc);
      }
    });

    return sortedCourses.map(course => {
      const courseNo = String(getFuzzyKey(course, ["เลขที่ใบคอส", "col_2", "courseRefKey"]) || course.id || '').trim();
      let courseName = String(getFuzzyKey(course, ["ชื่อคอส", "ชื่อคอร์ส", "col_8", "courseName", "name"]) || '').trim();
      const coursePhone = String(getFuzzyKey(course, ["เบอร์โทร", "col_1", "phone", "customerPhone"]) || '').trim();
      const cleanCoursePhone = coursePhone.replace(/\D/g, '');
      let courseCustomerName = String(getFuzzyKey(course, ["ผู้ซื้อคอส", "ชื่อลูกค้า", "ชื่อ", "col_9", "customerName"]) || '').trim();

      // Look up customer name by phone if missing (O(1))
      if (!courseCustomerName && cleanCoursePhone && customersByPhoneMap.has(cleanCoursePhone)) {
        const matchedCust = customersByPhoneMap.get(cleanCoursePhone);
        courseCustomerName = String(matchedCust.computedName || getFuzzyKey(matchedCust, ["ชื่อ", "ชื่อลูกค้า", "col_1", "col_2"]) || '').trim();
      }

      // Look up course name from master courses if missing (O(1))
      if (!courseName) {
        const courseCode = String(getFuzzyKey(course, ["รหัสคอส", "col_1", "code", "courseCode"]) || '').trim().toLowerCase();
        if (courseCode && masterCoursesByCodeMap.has(courseCode)) {
          const matchedMaster = masterCoursesByCodeMap.get(courseCode);
          courseName = String(getFuzzyKey(matchedMaster, ["ชื่อคอส", "col_4", "col_8", "name"]) || '').trim();
        }
      }

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
      const isPosCourse = courseNo.toUpperCase().startsWith('IC');
      
      if (!isPosCourse) {
          const custHistories = precomputedHistories.byCustomer[cleanCustomerName] || [];
          custHistories.forEach(h => {
              const hItem = String(getFuzzyKey(h, ["สินค้า", "ชื่อคอส", "รายการ", "col_18", "col_16", "col_23"]) || '').replace(new RegExp('\\s', 'g'), '').toLowerCase();
              if (cleanCourseName && hItem && (cleanCourseName.includes(hItem) || hItem.includes(cleanCourseName))) {
                  const id = h.id || JSON.stringify(h);
                  if (!consumedHistoryIds.has(id)) {
                      addHistories([h]);
                  }
              }
          });
      }
      
      myHistories.forEach(h => consumedHistoryIds.add(h.id || JSON.stringify(h)));

      myHistories.sort((a, b) => {
         const d1 = parseThaiDate(getFuzzyKey(a, ["วันที่", "col_1"]));
         const d2 = parseThaiDate(getFuzzyKey(b, ["วันที่", "col_1"]));
         if (d1 && d2) return d2.getTime() - d1.getTime();
         return 0;
      });

      let totalAmountLinkedToCourse = 0; 
      myHistories.forEach(h => {
          if (h.isCancelled || String(getFuzzyKey(h, ["สถานะ", "col_7", "col_8", "col_9"]) || '').trim() === 'ยกเลิก') return;
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
          if (h.isCancelled || String(getFuzzyKey(h, ["สถานะ", "col_7", "col_8", "col_9"]) || '').trim() === 'ยกเลิก') return;
          if (!isMoleHistoryRecord(h)) {
              const type = String(getFuzzyKey(h, ["ประเภท", "col_4"]) || '');
              
              if (isUsageType(type)) {
                  if (!isFreeUsage(h)) {
                      const isLegacy = !h.courseId;
                      const hasValidSigs = (h.customerSignature?.length > 200 && h.staffSignature?.length > 200) || h.courseUpdatedDirectly === true;
                      
                      if (isLegacy || hasValidSigs) {
                          const rawQty = getFuzzyKey(h, ["จำนวน", "จำนวนที่ใช้", "ตัดคอร์ส", "col_15"]);
                          const qty = extractHistoryQty(h); 
                          if (!(type.includes('เบิก') && (rawQty === undefined || rawQty === ''))) {
                              if (!h.courseUpdatedDirectly) {
                                  newSystemUsed += qty;
                              }
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
      let finalUsed = baseUsed + newSystemUsed;
      // Cap used at total for ALL courses (not just POS) to prevent contradictory
      // displays like "486/10" caused by bogus legacy history entries (e.g. "หัก 453 ครั้ง").
      finalUsed = Math.min(currentTotal, finalUsed);
      let remaining = Math.max(0, currentTotal - finalUsed);
      
      const isCourseClosed = Boolean(
        course.isClosed || 
        String(getFuzzyKey(course, ["สถานะ", "status"]) || '').trim() === 'ปิดคอร์สแล้ว' || 
        String(getFuzzyKey(course, ["สถานะ", "status"]) || '').trim() === 'ปิดคอร์ส'
      );
      if (isCourseClosed && (course.closeReason === 'ใช้บริการครบแล้วในใบคอร์สกระดาษเดิม' || Number(course.paperUsedQty) >= currentTotal)) {
        finalUsed = currentTotal;
        remaining = 0;
      }

      let status = getFuzzyKey(course, "สถานะ") || "ยังคงเหลือ";
      if (remaining <= 0 && currentTotal > 0) status = "ใช้ครบแล้ว";
      if (isCourseClosed) status = "ปิดคอร์สแล้ว";
      
      let expireStr = getFuzzyKey(course, ["วันหมดอายุ", "expireDate", "วันที่สิ้นสุด"]);
      const purchaseDateStr = getFuzzyKey(course, ["วันที่ซื้อ", "col_3"]);
      let daysLeft = null;
      let isExpiringSoon = false;

      let expireDateObj = null;
      let calculatedDurationMonths = 12; // Default 1 year
      let durationText = "1 ปี";
      const pDate = parseThaiDate(purchaseDateStr) || new Date();
      
      if (expireStr) {
          const expStr = String(expireStr).trim().toLowerCase();
          if (expStr.includes('เดือน')) {
              const months = parseInt(expStr.replace(/[^0-9]/g, '')) || 1;
              expireDateObj = new Date(pDate);
              expireDateObj.setMonth(expireDateObj.getMonth() + months);
              durationText = `${months} เดือน`;
          } else if (expStr.includes('ปี')) {
              const years = parseInt(expStr.replace(/[^0-9]/g, '')) || 1;
              expireDateObj = new Date(pDate);
              expireDateObj.setFullYear(expireDateObj.getFullYear() + years);
              durationText = `${years} ปี`;
          } else if (expStr.includes('วัน') && !expStr.includes('/')) {
              const days = parseInt(expStr.replace(/[^0-9]/g, '')) || 1;
              expireDateObj = new Date(pDate);
              expireDateObj.setDate(expireDateObj.getDate() + days);
              durationText = `${days} วัน`;
          } else {
              expireDateObj = parseThaiDate(expireStr);
              if (expireDateObj) {
                  const diffMs = expireDateObj.getTime() - pDate.getTime();
                  const dDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                  if (dDays <= 31) durationText = `${dDays} วัน`;
                  else if (dDays <= 365) durationText = `${Math.round(dDays / 30)} เดือน`;
                  else durationText = `${Math.round(dDays / 365)} ปี`;
              }
          }
      }

      if (!expireDateObj || (expireStr && expireDateObj.getTime() <= pDate.getTime())) {
          expireDateObj = new Date(pDate);

          const cNameStr = String(getFuzzyKey(course, ["ชื่อคอส", "ชื่อคอร์ส"]) || '').toLowerCase();
          let effectiveQty = currentTotal;
          const qtyMatch = cNameStr.match(/\((\d+)\s*(ครั้ง|cc|ml|g|กรัม)\)/i) || cNameStr.match(/(\d+)\s*(ครั้ง|cc|ml|g|กรัม)/i);
          if (qtyMatch && parseInt(qtyMatch[1]) > 0) {
              effectiveQty = parseInt(qtyMatch[1]);
          }

          if (cNameStr.includes('set a') || cNameStr.includes('set.a')) {
              expireDateObj.setMonth(expireDateObj.getMonth() + 3);
              durationText = "3 เดือน";
          } else if (cNameStr.includes('set b') || cNameStr.includes('set.b')) {
              expireDateObj.setMonth(expireDateObj.getMonth() + 6);
              durationText = "6 เดือน";
          } else if (cNameStr.includes('set c') || cNameStr.includes('set.c')) {
              expireDateObj.setFullYear(expireDateObj.getFullYear() + 1);
              durationText = "1 ปี";
          } else if (cNameStr.includes('รักษา')) {
              expireDateObj.setFullYear(expireDateObj.getFullYear() + 1);
              durationText = "1 ปี";
          } else if (effectiveQty === 1) {
              expireDateObj.setDate(expireDateObj.getDate() + 7);
              durationText = "7 วัน";
          } else if (effectiveQty === 2) {
              expireDateObj.setMonth(expireDateObj.getMonth() + 1);
              durationText = "1 เดือน";
          } else if (effectiveQty >= 3 && effectiveQty <= 5) {
              expireDateObj.setMonth(expireDateObj.getMonth() + 3);
              durationText = "3 เดือน";
          } else if (effectiveQty >= 6 && effectiveQty <= 9) {
              expireDateObj.setMonth(expireDateObj.getMonth() + 6);
              durationText = "6 เดือน";
          } else {
              expireDateObj.setFullYear(expireDateObj.getFullYear() + 1);
              durationText = "1 ปี";
          }
          const exY = expireDateObj.getFullYear() + 543;
          expireStr = `${String(expireDateObj.getDate()).padStart(2, '0')}/${String(expireDateObj.getMonth() + 1).padStart(2, '0')}/${exY}`;
      }
      
      if (expireDateObj) {
          calculatedDurationMonths = (expireDateObj.getFullYear() - pDate.getFullYear()) * 12 + (expireDateObj.getMonth() - pDate.getMonth());
          calculatedDurationMonths = Math.max(1, calculatedDurationMonths);
      }
      if (expireDateObj) {
          const today = new Date(); today.setHours(0,0,0,0);
          const diffTime = expireDateObj.getTime() - today.getTime();
          daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (daysLeft <= 30 && daysLeft >= 0) isExpiringSoon = true;
          if (daysLeft < 0 && currentTotal > 0 && remaining > 0) status = "หมดอายุ";
      }

      if (String(getFuzzyKey(course, "สถานะ") || '') === 'หมดอายุ') status = "หมดอายุ";

      const rawExplicitCredit = getFuzzyKey(course, ["เครดิตที่ได้รับ", "เครดิตที่ได้", "เครดิตทั้งหมด", "ยอดเครดิต", "วงเงินคอร์ส", "เครดิต", "วงเงิน", "วงเงินที่ได้รับ", "มูลค่าเครดิต"]);
      const coursePrice = parseNumber(getFuzzyKey(course, ["ราคา", "ราคาคอร์ส", "ยอดเต็ม", "ยอดเงิน", "จำนวนเงิน", "ยอดสุทธิ", "ราคาขาย", "col_13"]));
      
      let initialCredit = rawExplicitCredit !== undefined && rawExplicitCredit !== '' ? parseNumber(rawExplicitCredit) : 0;
      
      const isExplicitCashCreditProgram = 
        cleanCourseName.includes('เครดิต') || 
        cleanCourseName.includes('วงเงิน') || 
        cleanCourseName.includes('voucher') || 
        cleanCourseName.includes('บัตรกำนัล') || 
        cleanCourseName.includes('เติมเงิน') || 
        cleanCourseName.includes('ฝากเงิน');

      if (initialCredit === 0 && coursePrice > 0 && isExplicitCashCreditProgram) {
        initialCredit = coursePrice;
      }

      // 🛡️ Auto-sanitize accidental session counts stored in credit column
      // e.g. "หน้าใสครบขั้นตอน 3ครั้ง798" having credit = 3, or "ริดพิกเม้น 10ครั้ง" having credit = 10
      const isAccidentalSessionCredit = initialCredit > 0 && !isExplicitCashCreditProgram && (
        (initialCredit <= 20 && initialCredit === currentTotal) || 
        initialCredit < 50
      );

      const rawCreditBeforeSanitize = initialCredit;
      if (isAccidentalSessionCredit) {
        initialCredit = 0;
      }
      
      const courseOldBerq = parseNumber(getFuzzyKey(course, ["ยอดเบิกดิบ", "เบิกไปแล้ว", "ยอดเบิก", "ใช้เครดิต", "หักเครดิต", "col_15"]));
      const courseOldAccum = parseNumber(getFuzzyKey(course, ["ยอดสะสมดิบ", "ยอดสะสม", "col_16"]));
      
      let finalBerqAmount = courseOldBerq + courseOldAccum + totalAmountLinkedToCourse;
      finalBerqAmount = Math.min(initialCredit, finalBerqAmount);

      const remainingCredit = initialCredit - finalBerqAmount; 

      const paidAmt = parseNumber(getFuzzyKey(course, ["ยอดชำระแล้วทั้งหมด", "ยอดชำระแล้ว", "paidAmount"]));
      const rawPending = getFuzzyKey(course, ["ยอดค้างชำระ", "pending", "col_pending"]);
      let pendingAmt = 0;

      if (rawPending !== undefined && rawPending !== null && String(rawPending).trim() !== '') {
        // มีการระบุยอดค้างชำระไว้ชัดเจน
        pendingAmt = parseNumber(rawPending);
      } else if (coursePrice > 0 && paidAmt > 0) {
        // หากไม่มีฟิลด์ยอดค้างชำระ แต่มีราคาและยอดชำระแล้ว คำนวณจาก ราคา - ชำระแล้ว
        pendingAmt = Math.max(0, coursePrice - paidAmt);
      } else {
        // เฉพาะใบคอร์สเก่าที่ยังไม่เคยมีบันทึกยอดค้างชำระ
        const paymentType = String(getFuzzyKey(course, ["ประเภทการชำระ", "col_10", "col_7"]) || '');
        if (paymentType.includes('ค้าง') || paymentType.includes('COD')) {
          const match = paymentType.match(/(?:ค้าง|COD)\s*[:/-]?\s*([\d,.]+)/i);
          if (match) {
            pendingAmt = parseNumber(match[1]);
          }
        }
      }

      // 🌟 หากชำระครบตามราคาคอร์สแล้ว หรือระบุยอดค้างชำระเป็น 0 ต้องไม่มียอดค้างชำระเด็ดขาด
      if ((coursePrice > 0 && paidAmt >= coursePrice) || (rawPending !== undefined && parseNumber(rawPending) <= 0)) {
        pendingAmt = 0;
      }

      // 🎁 Automatically exclude items where the claim history was cancelled ("คืนสิทธิ์")
      const cancelledClaimItems = [];
      myHistories.forEach(h => {
        if (h.isCancelled || String(getFuzzyKey(h, ["สถานะ", "col_7", "col_8", "col_9"]) || '').trim() === 'ยกเลิก') {
          const hType = String(getFuzzyKey(h, ["ประเภท", "col_4"]) || '');
          if (hType.includes('เบิก')) {
            const hItem = String(getFuzzyKey(h, ["รายการ", "สินค้า", "col_23", "col_18"]) || '').trim();
            if (hItem) {
              const qty = Math.max(1, parseQty(getFuzzyKey(h, ["จำนวน", "col_15"])) || 1);
              for (let i = 0; i < qty; i++) cancelledClaimItems.push(hItem);
            }
          }
        }
      });

      let effectiveClaimedItems = Array.isArray(course.claimedItems) ? [...course.claimedItems] : [];
      cancelledClaimItems.forEach(itemToUnclaim => {
        const cleanTarget = itemToUnclaim.replace(/\s+/g, '').toLowerCase();
        const idx = effectiveClaimedItems.findIndex(c => {
          const cleanC = String(c || '').replace(/\s+/g, '').toLowerCase();
          return cleanC.includes(cleanTarget) || cleanTarget.includes(cleanC);
        });
        if (idx !== -1) {
          effectiveClaimedItems.splice(idx, 1);
        }
      });

      return {
        ...course, 
        claimedItems: effectiveClaimedItems,
        courseRefKey: courseNo, 
        computedCustomerName: courseCustomerName || '-',
        computedCourseName: courseName || '-',
        computedPhone: coursePhone,
        cleanPhone: cleanCoursePhone,
        myHistories,
        computedTotalQty: currentTotal, 
        computedUsedQty: finalUsed, 
        computedRemainQty: remaining, 
        computedStatus: status, 
        isClosed: isCourseClosed,
        closeReason: course.closeReason || (isCourseClosed ? 'ปิดคอร์สแล้ว' : null),
        closeNote: course.closeNote || '',
        closedAt: course.closedAt || null,
        closedBy: course.closedBy || null,
        paperCoursePhotos: Array.isArray(course.paperCoursePhotos) ? course.paperCoursePhotos : (course.paperCoursePhotoUrl ? [course.paperCoursePhotoUrl] : []),
        computedTotalCredit: initialCredit, 
        computedUsedCredit: finalBerqAmount, 
        computedRemainCredit: remainingCredit, 
        rawExplicitCredit,
        rawCreditBeforeSanitize,
        isAccidentalSessionCredit,
        computedRealPrice: coursePrice,
        computedPendingAmount: pendingAmt,
        computedExpireDate: expireStr || '-', 
        computedDurationMonths: calculatedDurationMonths,
        daysLeft, 
        isExpiringSoon,
        durationText
      };
    });
  }, [courses, precomputedHistories, customers, customersRaw, masterCourses]);

  const getCustomerCourses = (phone) => {
    const targetClean = String(phone || '').replace(/\D/g, '');
    if (!targetClean) return [];
    return processedCourses.filter(c => {
      const cp = String(c.cleanPhone || c.computedPhone || getFuzzyKey(c, ["เบอร์โทร", "col_1", "phone"]) || '').replace(/\D/g, '');
      return cp === targetClean;
    });
  };
  const getDisplayCourses = (phone) => getCustomerCourses(phone).filter(c => {
      const courseName = String(getFuzzyKey(c, ["ชื่อคอส", "ชื่อคอร์ส", "col_8"]) || '').toLowerCase();
      const isCreditCourse = courseName.includes('วงเงิน') || courseName.includes('เติมเงิน') || courseName.includes('เครดิต') || courseName.includes('voucher') || courseName.includes('บัตรกำนัล') || courseName.includes('ฝากเงิน');
      return !isCreditCourse;
  });
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
  const [masterCourseTab, setMasterCourseTab] = useState('ทั้งหมด');

  const allMasterCourses = useMemo(() => {
    const posCourses = products.filter(p => {
        const code = String(getFuzzyKey(p, ["รหัส", "col_1"]) || '').trim();
        return code.startsWith('F-');
    }).map(p => {
        const cName = String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2"]) || '');
        let qty = null;
        const match = cName.match(/(\d+)\s*(ครั้ง|c)/i);
        if (match) qty = parseInt(match[1], 10);
        
        const code = String(getFuzzyKey(p, ["รหัส", "col_1"]) || '').trim();
        let cat = 'ทั่วไป';
        if (code.startsWith('F-MA') || code.startsWith('F-M')) cat = 'ลงเครื่อง';
        else if (code.startsWith('F-S')) cat = 'รักษาสิว/ฝ้า';
        else if (code.startsWith('F-N')) cat = 'บำรุงฟื้นฟู';
        else if (code.startsWith('F-AC')) cat = 'เคลียร์สิว';
        else if (code.startsWith('F-IPL')) cat = 'IPL กำจัดขน';
        else if (/^F-[A-J]/.test(code)) cat = 'ผิวหน้า (A-J)';
        
        return {
            ...p,
            isPOSCourse: true,
            "รหัสคอส": code,
            "ชื่อคอส": cName,
            "ราคา": String(getFuzzyKey(p, ["ราคาขายเต็ม", "col_6"]) || getFuzzyKey(p, ["ราคาขาย", "col_5"]) || 0),
            "ประเภท": cat,
            "จำนวนครั้งที่ได้": qty !== null ? String(qty) : "",
            "จำนวนครั้ง": qty !== null ? String(qty) : ""
        };
    });

    return [...masterCourses, ...posCourses];
  }, [masterCourses, products]);

  const filteredMasterCourses = useMemo(() => {
    const getCourseTimestamp = (mc) => {
        if (mc.updatedAt) {
            const t = typeof mc.updatedAt === 'object' && mc.updatedAt.seconds ? mc.updatedAt.seconds * 1000 : new Date(mc.updatedAt).getTime();
            if (!isNaN(t) && t > 0) return t;
        }
        if (mc.createdAt) {
            const t = typeof mc.createdAt === 'object' && mc.createdAt.seconds ? mc.createdAt.seconds * 1000 : new Date(mc.createdAt).getTime();
            if (!isNaN(t) && t > 0) return t;
        }
        if (Array.isArray(mc.promoOptions)) {
            for (const opt of mc.promoOptions) {
                const optMatch = String(opt?.id || '').match(/opt_(\d+)/);
                if (optMatch) {
                    const optTime = Number(optMatch[1]);
                    if (!isNaN(optTime) && optTime > 0) return optTime;
                }
            }
        }
        if (mc.isNewSystem) {
            return new Date('2026-11-21T00:00:00+07:00').getTime();
        }
        const rawDate = getFuzzyKey(mc, ["วันที่เริ่มโปร", "วันที่", "col_9", "col_3", "startDate"]);
        if (rawDate) {
            const parsed = parseThaiDate(rawDate);
            if (parsed && !isNaN(parsed.getTime())) return parsed.getTime();
        }
        return 0;
    };

    return allMasterCourses.filter(mc => {
        const code = String(getFuzzyKey(mc, ["รหัสคอส", "col_1"]) || mc.id || '').trim();
        if (code.startsWith('course') || (mc.id && String(mc.id).startsWith('course'))) return false;
        const searchStr = `${code} ${String(getFuzzyKey(mc, ["ชื่อคอส", "col_4"]) || '')} ${String(getFuzzyKey(mc, ["ประเภท", "col_2"]) || '')}`.toLowerCase();
        return masterCourseSearch === '' || searchStr.includes(masterCourseSearch.toLowerCase());
    }).sort((a, b) => {
        const tA = getCourseTimestamp(a);
        const tB = getCourseTimestamp(b);
        if (tA !== tB) return tB - tA; // ล่าสุดขึ้นก่อน

        const numA = parseNumber(String(getFuzzyKey(a, ["รหัสคอส", "col_1"])).replace(/[^0-9]/g, ''));
        const numB = parseNumber(String(getFuzzyKey(b, ["รหัสคอส", "col_1"])).replace(/[^0-9]/g, ''));
        if (numA !== numB) return numB - numA;
        return String(getFuzzyKey(b, ["รหัสคอส", "col_1"]) || '').localeCompare(String(getFuzzyKey(a, ["รหัสคอส", "col_1"]) || ''));
    });
  }, [allMasterCourses, masterCourseSearch]);

  const masterCourseCategories = useMemo(() => {
      const counts = {};
      let total = 0;
      filteredMasterCourses.forEach(mc => {
          const type = String(getFuzzyKey(mc, ["ประเภท", "col_2"]) || 'ทั่วไป').trim();
          counts[type] = (counts[type] || 0) + 1;
          total++;
      });
      const sortedCats = Object.keys(counts).filter(c => c !== 'ทั้งหมด').sort((a, b) => a.localeCompare(b, 'th'));
      return [
          { name: 'ทั้งหมด', count: total },
          ...sortedCats.map(name => ({ name, count: counts[name] || 0 }))
      ];
  }, [filteredMasterCourses]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => { 
        const searchStr = `${String(getFuzzyKey(p, ["รหัส", "col_1"]) || '')} ${String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2"]) || '')} ${String(getFuzzyKey(p, ["หมวดสินค้า", "col_4"]) || '')}`.toLowerCase(); 
        return searchTerm === '' || searchStr.includes(searchTerm.toLowerCase()); 
    }).sort((a, b) => String(getFuzzyKey(a, ["รหัส", "col_1"]) || '').localeCompare(String(getFuzzyKey(b, ["รหัส", "col_1"]) || '')));
  }, [products, searchTerm]);

  const sortedOrders = useMemo(() => {
    return orders.filter(o => { 
        const matchSearch = String(o.customerName || '').includes(searchTerm) || String(o.customerPhone || '').includes(searchTerm) || String(o.courseName || '').includes(searchTerm) || String(o.orderNo || '').includes(searchTerm); 
        
        let matchStatus = false;
        const rawSt = String(getFuzzyKey(o, ["status", "สถานะ"]) || '').trim() || 'รออนุมัติ';
        const st = getOrderStatus(o);

        if (filterOrderStatus === 'all') {
            matchStatus = true;
        } else if (filterOrderStatus === 'รอชำระเงิน') {
            matchStatus = rawSt === 'รอชำระเงิน';
        } else if (filterOrderStatus === 'รอดำเนินการ') {
            matchStatus = ['รอตรวจสอบ', 'รอดำเนินการ', 'รอประเมินราคา', 'รออนุมัติ', 'pending'].includes(rawSt) || (st === 'รออนุมัติ' && rawSt !== 'รอชำระเงิน');
        } else if (filterOrderStatus === 'กำลังจัดส่ง') {
            matchStatus = (rawSt === 'กำลังจัดส่ง' || rawSt === 'จัดส่งแล้ว') && rawSt !== 'จัดส่งสำเร็จ' && o.fulfillment !== 'delivered' && o.trackingInfo?.phase !== 'delivered';
        } else if (filterOrderStatus === 'สำเร็จแล้ว') {
            matchStatus = ['ชำระเงินแล้ว', 'สำเร็จ', 'เรียบร้อย', 'approved', 'อนุมัติแล้ว', 'จัดส่งสำเร็จ'].includes(rawSt) || rawSt.includes('สำเร็จ') || o.fulfillment === 'delivered' || o.trackingInfo?.phase === 'delivered' || (st === 'อนุมัติแล้ว' && rawSt !== 'กำลังจัดส่ง' && rawSt !== 'จัดส่งแล้ว');
        } else if (filterOrderStatus === 'ยกเลิก') {
            matchStatus = st === 'ยกเลิก';
        } else {
            matchStatus = rawSt === filterOrderStatus || st === filterOrderStatus;
        }

        return matchSearch && matchStatus; 
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [orders, searchTerm, filterOrderStatus]);

  const sortedBookings = useMemo(() => {
    const todayStr = getLocalYYYYMMDD();
    return bookings.filter(b => { 
        const matchSearch = String(b.customerName || '').includes(searchTerm) || String(b.customerPhone || '').includes(searchTerm) || String(b.courseName || '').includes(searchTerm); 
        const st = getBookingStatus(b);
        const dt = getSafeDateTime(b);
        const isToday = dt && dt.startsWith(todayStr);

        let matchStatus = true;
        if (filterBookingStatus === 'all') {
            matchStatus = true;
        } else if (filterBookingStatus === 'today_upcoming') {
            // แสดงเฉพาะคิวทั้งหมดของวันที่ปัจจุบันที่ยังไม่ถึงคิว
            const isNotReached = ['รอการยืนยัน', 'ยืนยันแล้ว', 'รอเข้ารับบริการ', 'รอคิว'].includes(st);
            matchStatus = isToday && isNotReached;
        } else if (filterBookingStatus === 'today_all') {
            // คิววันนี้ทั้งหมด
            matchStatus = isToday && st !== 'ยกเลิก' && st !== 'ยกเลิกฉุกเฉิน' && st !== 'ยกเลิกโดยลูกค้า';
        } else {
            matchStatus = st === filterBookingStatus; 
        }

        const bBranchClean = String(b.branch || 'เฉวง').replace(/^สาขา/,'').trim();
        const filterBranchClean = String(filterBookingBranch).replace(/^สาขา/,'').trim();
        const matchBranch = filterBookingBranch === 'all' || bBranchClean === filterBranchClean;
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
          const rawBr = b.branch || 'เฉวง';
          // Normalize branch name by removing 'สาขา' prefix and trimming whitespace
          const br = String(rawBr).replace(/^สาขา/g, '').trim();
          
          if(!stats[br]) stats[br] = { total: 0, pending: 0, in_progress: 0, completed: 0 };
          const rawSt = String(b.status || b["สถานะ"] || '').trim().toLowerCase();
          const isCancelled = b.isCancelled || rawSt.includes('ยกเลิก') || rawSt.includes('cancel');
          if (isCancelled) return;

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
    const isCancelledBooking = (b) => {
        if (!b) return true;
        if (b.isCancelled) return true;
        const rawSt = String(b.status || b["สถานะ"] || '').trim().toLowerCase();
        if (rawSt.includes('ยกเลิก') || rawSt.includes('cancel')) return true;
        const st = getBookingStatus(b);
        return st === 'ยกเลิก';
    };

    const todayUpcoming = bookings.filter(b => {
        if (isCancelledBooking(b)) return false;
        const dt = getSafeDateTime(b);
        const st = getBookingStatus(b);
        const isToday = dt && dt.startsWith(todayStr);
        const isNotReached = ['รอการยืนยัน', 'ยืนยันแล้ว', 'รอเข้ารับบริการ', 'รอคิว'].includes(st);
        return isToday && isNotReached;
    }).length;

    const todayAll = bookings.filter(b => {
        if (isCancelledBooking(b)) return false;
        const dt = getSafeDateTime(b);
        const isToday = dt && dt.startsWith(todayStr);
        return isToday;
    }).length;

    return { 
        total: bookings.filter(b => !isCancelledBooking(b)).length, 
        pending: bookings.filter(b => !isCancelledBooking(b) && getBookingStatus(b) === 'รอการยืนยัน').length, 
        confirmed: bookings.filter(b => !isCancelledBooking(b) && getBookingStatus(b) === 'ยืนยันแล้ว').length, 
        today: todayAll,
        todayUpcoming: todayUpcoming,
        badgeCount: todayUpcoming // ป้ายแจ้งเตือนแสดงเฉพาะคิวทั้งหมดของวันที่ปัจจุบันที่ยังไม่ถึงคิว!
    };
  }, [bookings]);

  const productStats = useMemo(() => ({ outOfStock: products.filter(p => !p.isStoreUseOnly && getTotalStock(p, branches) <= 0).length }), [products, branches]);

  const filteredHistories = useMemo(() => {
    return histories.filter(h => {
      // 1. Cancelled filter
      if (h.isCancelled || String(getFuzzyKey(h, ["สถานะ", "col_7", "col_8", "col_9"]) || '').trim() === 'ยกเลิก') return false;

      // 2. Search filter
      if (searchTerm) {
        const searchStr = `${String(getFuzzyKey(h, ["ชื่อลูกค้า", "col_2"]) || '')} ${String(getFuzzyKey(h, ["เบอร์โทร", "phone", "col_1"]) || '')} ${String(getFuzzyKey(h, ["ประเภท", "col_4"]) || '')} ${String(getFuzzyKey(h, ["สินค้า", "ชื่อคอส", "รายการ", "col_18", "col_16", "col_23"]) || '')} ${String(getFuzzyKey(h, ["หมายเลขคำสั่งซื้อ", "เลขที่บิล", "เลขที่", "col_3"]) || '')} ${String(getFuzzyKey(h, ["เลขที่ใบคอส", "อ้างอิง", "col_6"]) || '')} ${String(getFuzzyKey(h, ["ผู้ให้บริการ", "พนักงาน", "staff"]) || '')}`.toLowerCase();
        if (!searchStr.includes(searchTerm.toLowerCase())) return false;
      }

      // 3. Period / Date filter
      if (historyPeriodFilter !== 'all') {
        const dateKey = getHistoryDateKey(h);
        const today = getLocalYYYYMMDD();
        if (historyPeriodFilter === 'today' && dateKey !== today) return false;
        if (historyPeriodFilter === 'yesterday') {
          const y = new Date(); y.setDate(y.getDate() - 1);
          if (dateKey !== getLocalYYYYMMDD(y)) return false;
        }
        if (historyPeriodFilter === '7days') {
          const d = new Date(); d.setDate(d.getDate() - 7);
          const start = getLocalYYYYMMDD(d);
          if (dateKey < start || dateKey > today) return false;
        }
        if (historyPeriodFilter === '30days') {
          const d = new Date(); d.setDate(d.getDate() - 30);
          const start = getLocalYYYYMMDD(d);
          if (dateKey < start || dateKey > today) return false;
        }
        if (historyPeriodFilter === 'this_month') {
          if (!dateKey || !dateKey.startsWith(today.slice(0, 7))) return false;
        }
        if (historyPeriodFilter === 'last_month') {
          const d = new Date(); d.setMonth(d.getMonth() - 1);
          if (!dateKey || !dateKey.startsWith(getLocalYYYYMMDD(d).slice(0, 7))) return false;
        }
        if (historyPeriodFilter === 'custom') {
          if (historyStartDate && dateKey < historyStartDate) return false;
          if (historyEndDate && dateKey > historyEndDate) return false;
        }
      }

      // 4. Branch filter
      if (historyBranchFilter !== 'all') {
        const br = getHistoryBranch(h).replace(/^สาขา/, '').trim();
        const targetBr = historyBranchFilter.replace(/^สาขา/, '').trim();
        if (br !== targetBr) return false;
      }

      // 5. Category filter
      if (historyCategoryFilter !== 'all') {
        const cat = getHistoryCategoryInfo(h).id;
        if (cat !== historyCategoryFilter) return false;
      }

      // 6. Action Type filter
      if (historyActionTypeFilter !== 'all') {
        const type = String(getFuzzyKey(h, ["ประเภท", "col_4"]) || '');
        if (historyActionTypeFilter === 'usage' && !isUsageType(type)) return false;
        if (historyActionTypeFilter === 'purchase' && !type.includes('ซื้อ') && !type.includes('เปิด')) return false;
        if (historyActionTypeFilter === 'add' && !isAddType(type)) return false;
        if (historyActionTypeFilter === 'free' && !isFreeUsage(h)) return false;
        if (historyActionTypeFilter === 'credit' && !type.includes('เครดิต') && !type.includes('โอน') && !type.includes('หักเงิน')) return false;
      }

      return true;
    }).sort((a, b) => {
      if (historySortBy === 'oldest') {
        return getHistorySortTime(a) - getHistorySortTime(b);
      }
      if (historySortBy === 'amount_desc') {
        const amtA = parseNumber(getFuzzyKey(a, ["ยอดสินค้า", "ยอดจัดซื้อ", "ยอดเงิน", "ยอดเบิก", "ยอด", "col_19"]));
        const amtB = parseNumber(getFuzzyKey(b, ["ยอดสินค้า", "ยอดจัดซื้อ", "ยอดเงิน", "ยอดเบิก", "ยอด", "col_19"]));
        return amtB - amtA;
      }
      // default: newest first
      return getHistorySortTime(b) - getHistorySortTime(a);
    });
  }, [histories, searchTerm, historyPeriodFilter, historyStartDate, historyEndDate, historyBranchFilter, historyCategoryFilter, historyActionTypeFilter, historySortBy]);

  const sortedHistories = filteredHistories;

  const stats = useMemo(() => {
    const activeCoursesList = processedCourses.filter(c => c.computedRemainQty > 0 && !c.isClosed && c.computedStatus !== 'ปิดคอร์สแล้ว');
    const activeCustomersSet = new Set(activeCoursesList.map(c => String(getFuzzyKey(c, ["เบอร์โทร", "col_1"]) || '')).filter(Boolean));
    return {
      total: processedCourses.length, active: activeCoursesList.length,
      totalCustomers: customers.length, completed: processedCourses.filter(c => c.computedStatus === 'ใช้ครบแล้ว').length,
      expired: processedCourses.filter(c => c.computedStatus === 'หมดอายุ').length, 
      closed: processedCourses.filter(c => c.computedStatus === 'ปิดคอร์สแล้ว').length,
      activeCustomers: activeCustomersSet.size
    };
  }, [processedCourses, customers]);

  const courseSummaryStats = useMemo(() => {
    const makeCounts = () => ({ active: 0, completed: 0, closed: 0, expired: 0, total: 0 });
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
      const isClosed = status === 'ปิดคอร์สแล้ว';
      const isExpired = status === 'หมดอายุ';
      
      // Helper to increment counts for a category
      const increment = (obj) => {
        if (isActive) obj.active++;
        else if (isClosed) obj.closed++;
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

  const historyCategoryCounts = useMemo(() => {
    const counts = { all: 0, facial: 0, acne: 0, laser: 0, mole: 0, injection: 0, vitamin: 0, product: 0, free: 0, other: 0 };
    histories.forEach(h => {
      if (h.isCancelled || String(getFuzzyKey(h, ["สถานะ", "col_7", "col_8", "col_9"]) || '').trim() === 'ยกเลิก') return;
      
      // Match period & branch
      if (historyPeriodFilter !== 'all') {
        const dateKey = getHistoryDateKey(h);
        const today = getLocalYYYYMMDD();
        if (historyPeriodFilter === 'today' && dateKey !== today) return;
        if (historyPeriodFilter === 'yesterday') {
          const y = new Date(); y.setDate(y.getDate() - 1);
          if (dateKey !== getLocalYYYYMMDD(y)) return;
        }
        if (historyPeriodFilter === '7days') {
          const d = new Date(); d.setDate(d.getDate() - 7);
          const start = getLocalYYYYMMDD(d);
          if (dateKey < start || dateKey > today) return;
        }
        if (historyPeriodFilter === '30days') {
          const d = new Date(); d.setDate(d.getDate() - 30);
          const start = getLocalYYYYMMDD(d);
          if (dateKey < start || dateKey > today) return;
        }
        if (historyPeriodFilter === 'this_month') {
          if (!dateKey || !dateKey.startsWith(today.slice(0, 7))) return;
        }
        if (historyPeriodFilter === 'last_month') {
          const d = new Date(); d.setMonth(d.getMonth() - 1);
          if (!dateKey || !dateKey.startsWith(getLocalYYYYMMDD(d).slice(0, 7))) return;
        }
        if (historyPeriodFilter === 'custom') {
          if (historyStartDate && dateKey < historyStartDate) return;
          if (historyEndDate && dateKey > historyEndDate) return;
        }
      }

      if (historyBranchFilter !== 'all') {
        const br = getHistoryBranch(h).replace(/^สาขา/, '').trim();
        const targetBr = historyBranchFilter.replace(/^สาขา/, '').trim();
        if (br !== targetBr) return;
      }

      counts.all++;
      const cat = getHistoryCategoryInfo(h).id;
      if (counts[cat] !== undefined) counts[cat]++;
      else counts.other++;
    });
    return counts;
  }, [histories, historyPeriodFilter, historyStartDate, historyEndDate, historyBranchFilter]);

  const historyFilteredSummary = useMemo(() => {
    const branches = {};
    let totalCount = 0;
    let totalQty = 0;
    let totalAmount = 0;
    const uniqueCustomers = new Set();

    filteredHistories.forEach(h => {
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

      const cust = String(getFuzzyKey(h, ["ชื่อลูกค้า", "col_2", "เบอร์โทร", "phone"]) || '').trim();
      if (cust) uniqueCustomers.add(cust);
    });

    Object.keys(branches).forEach(br => { 
      branches[br].items.sort((a, b) => getHistorySortTime(b) - getHistorySortTime(a)); 
    });

    return { 
      branches, 
      totalCount, 
      totalQty, 
      totalAmount, 
      uniqueCustomerCount: uniqueCustomers.size 
    };
  }, [filteredHistories]);

  const filteredCourses = useMemo(() => {
    return processedCourses.filter(c => {
      const courseName = String(c.computedCourseName || getFuzzyKey(c, ["ชื่อคอส", "ชื่อคอร์ส", "col_8", "name"]) || '').toLowerCase();
      const customerName = String(c.computedCustomerName || getFuzzyKey(c, ["ผู้ซื้อคอส", "ชื่อลูกค้า", "ชื่อ", "col_9"]) || '');
      const courseRef = String(c.courseRefKey || getFuzzyKey(c, ["เลขที่ใบคอส", "col_2"]) || '');
      
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
      
      let matchSource = true;
      if (courseSourceFilter !== 'all') {
        const isPos = String(courseRef || '').startsWith('IC');
        if (courseSourceFilter === 'pos') matchSource = isPos;
        if (courseSourceFilter === 'legacy') matchSource = !isPos;
      }

      let matchDate = true;
      if (courseDateFilter.from || courseDateFilter.to) {
        const pDate = parseThaiDate(getFuzzyKey(c, ["วันที่ซื้อ", "col_3"]));
        if (!pDate) {
          matchDate = false;
        } else {
          const fromDate = courseDateFilter.from ? new Date(courseDateFilter.from + 'T00:00:00') : null;
          const toDate = courseDateFilter.to ? new Date(courseDateFilter.to + 'T23:59:59') : null;
          if (fromDate && pDate < fromDate) matchDate = false;
          if (toDate && pDate > toDate) matchDate = false;
        }
      }

      return matchSearch && matchStatus && matchType && matchSummary && matchSource && matchDate;
    }).sort((a, b) => parseNumber(String(getFuzzyKey(b, ["เลขที่ใบคอส", "col_2"]) || '').replace(new RegExp('[^0-9]', 'g'), '')) - parseNumber(String(getFuzzyKey(a, ["เลขที่ใบคอส", "col_2"]) || '').replace(new RegExp('[^0-9]', 'g'), '')));
  }, [processedCourses, searchTerm, filterStatus, courseFilterType, courseSummaryFilter, courseSourceFilter, courseDateFilter]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchSearch = `${c.computedName} ${c.computedPhone}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterCustomerStatus === 'all' || (filterCustomerStatus === 'อนุมัติแล้ว (Member)' ? c.isApproved : c.computedMemberStatus === filterCustomerStatus);
      return matchSearch && matchStatus;
    }).sort((a, b) => {
      if (customerSortMode === 'cardNo') {
        const cardB = parseNumber(String(getFuzzyKey(b, ["หมายเลขใบสะสม", "col_11"]) || '').replace(new RegExp('[^0-9]', 'g'), ''));
        const cardA = parseNumber(String(getFuzzyKey(a, ["หมายเลขใบสะสม", "col_11"]) || '').replace(new RegExp('[^0-9]', 'g'), ''));
        return cardB - cardA;
      }
      if (customerSortMode === 'accumulated') {
        return (b.realAccumulatedAmount || 0) - (a.realAccumulatedAmount || 0);
      }
      if (customerSortMode === 'name') {
        return String(a.computedName || '').localeCompare(String(b.computedName || ''), 'th');
      }
      // Default: 'newest' (ลงทะเบียนล่าสุด)
      const timeA = a.createdAtTimestamp ?? getCustomerTimestamp(a);
      const timeB = b.createdAtTimestamp ?? getCustomerTimestamp(b);
      if (timeA > 0 || timeB > 0) {
        if (timeA > 0 && timeB > 0) return timeB - timeA;
        return timeB > 0 ? 1 : -1;
      }
      const cardB = parseNumber(String(getFuzzyKey(b, ["หมายเลขใบสะสม", "col_11"]) || '').replace(new RegExp('[^0-9]', 'g'), ''));
      const cardA = parseNumber(String(getFuzzyKey(a, ["หมายเลขใบสะสม", "col_11"]) || '').replace(new RegExp('[^0-9]', 'g'), ''));
      return cardB - cardA;
    });
  }, [customers, searchTerm, filterCustomerStatus, customerSortMode]);

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
    
    // 1. คิวนัดหมายใหม่ (รอการยืนยัน)
    if (adminNotifConfig.bookingNew !== false) {
      const pendingBookings = bookings.filter(b => getBookingStatus(b) === 'รอการยืนยัน');
      if (pendingBookings.length > 0) {
        notifs.push({ id: 'booking', title: 'คิวนัดหมายใหม่', message: `มีคิวนัดหมายรอการยืนยัน ${pendingBookings.length} รายการ`, icon: Calendar, color: 'text-blue-500', bgColor: 'bg-blue-50', tab: 'bookings' });
        count += pendingBookings.length;
      }
    }

    // 2. คิวนัดหมายวันนี้
    if (adminNotifConfig.bookingToday !== false) {
      const todayStr = getLocalYYYYMMDD();
      const todayBookings = bookings.filter(b => {
          const st = getBookingStatus(b);
          const dt = getSafeDateTime(b);
          return dt && dt.startsWith(todayStr) && (st === 'ยืนยันแล้ว' || st === 'รอการยืนยัน' || st === 'กำลังใช้บริการ');
      });
      if (todayBookings.length > 0) {
          notifs.push({ id: 'booking-today', title: 'คิวของวันนี้', message: `มีคิวนัดหมายของวันนี้ ${todayBookings.length} รายการ`, icon: Calendar, color: 'text-teal-500', bgColor: 'bg-teal-50', tab: 'bookings' });
      }
    }
    
    // 3. คำสั่งซื้อรออนุมัติ
    if (adminNotifConfig.orderPending !== false) {
      const pendingOrders = orders.filter(o => getOrderStatus(o) === 'รออนุมัติ');
      if (pendingOrders.length > 0) {
        notifs.push({ id: 'order', title: 'คำสั่งซื้อรออนุมัติ', message: `มีคำสั่งซื้อรอตรวจสอบ ${pendingOrders.length} รายการ`, icon: ShoppingCart, color: 'text-amber-500', bgColor: 'bg-amber-50', tab: 'orders' });
        count += pendingOrders.length;
      }
    }

    // 4. สินค้าหมด / เหลือน้อย
    const stockThreshold = adminNotifConfig.lowStockThreshold || 5;
    const outOfStock = [];
    const lowStock = [];
    products.forEach(p => {
      if (p.isStoreUseOnly) return;
      const qty = getTotalStock(p, branches);
      if (qty <= 0) outOfStock.push(p);
      else if (qty <= stockThreshold) lowStock.push(p);
    });

    if (adminNotifConfig.outOfStock !== false && outOfStock.length > 0) {
      notifs.push({ id: 'product-out', title: 'สินค้าหมดสต็อก', message: `มีสินค้าหมดสต็อก ${outOfStock.length} รายการ`, icon: Package, color: 'text-red-500', bgColor: 'bg-red-50', tab: 'products' });
      count += outOfStock.length;
    }

    if (adminNotifConfig.lowStock !== false && lowStock.length > 0) {
      notifs.push({ id: 'product-low', title: 'สินค้าเหลือน้อย', message: `มีสินค้าเหลือน้อยกว่า ${stockThreshold} ชิ้น จำนวน ${lowStock.length} รายการ`, icon: Package, color: 'text-orange-500', bgColor: 'bg-orange-50', tab: 'products' });
    }
    
    // 5. คอร์สใกล้หมดอายุ
    if (adminNotifConfig.courseExpiring !== false) {
      const expiringCourses = processedCourses.filter(c => c.isExpiringSoon && c.computedRemainQty > 0);
      if (expiringCourses.length > 0) {
        notifs.push({ id: 'course', title: 'คอร์สใกล้หมดอายุ', message: `มีคอร์สใกล้หมดอายุ ${expiringCourses.length} รายการ`, icon: Clock, color: 'text-orange-500', bgColor: 'bg-orange-50', tab: 'courses' });
        count += expiringCourses.length;
      }
    }

    // 6. ใบเบิกสินค้ารออนุมัติ
    if (adminNotifConfig.requisitionPending !== false) {
      const pendingReqs = employeeRequisitions.filter(r => r.status === 'pending');
      if (pendingReqs.length > 0) {
        notifs.push({ id: 'requisition', title: 'ใบเบิกสินค้ารออนุมัติ', message: `มีคำขอเบิกสินค้ารอตรวจสอบ ${pendingReqs.length} รายการ`, icon: Layers, color: 'text-purple-500', bgColor: 'bg-purple-50', tab: 'employees' });
        count += pendingReqs.length;
      }
    }

    // 7. คำขอลาหยุดรออนุมัติ
    if (adminNotifConfig.leaveRequest !== false) {
      const pendingLeaves = employeeLeaves.filter(l => l.status === 'pending');
      if (pendingLeaves.length > 0) {
        notifs.push({ id: 'leave', title: 'คำขอลาหยุดรออนุมัติ', message: `มีคำขอลาหยุดรอตรวจสอบ ${pendingLeaves.length} รายการ`, icon: Users, color: 'text-pink-500', bgColor: 'bg-pink-50', tab: 'employees' });
        count += pendingLeaves.length;
      }
    }

    if (notifs.length === 0) {
      notifs.push({ id: 'system', title: 'ระบบพร้อมใช้งาน', message: 'ไม่มีรายการค้างตรวจสอบในขณะนี้', icon: CheckCircle, color: 'text-emerald-500', bgColor: 'bg-emerald-50', tab: 'dashboard' });
    }
    
    return { notifications: notifs, totalPendingCount: count };
  }, [bookings, orders, products, processedCourses, employeeRequisitions, employeeLeaves, adminNotifConfig]);

  const handleExportExcel = (data, filename) => {
    if (!data || data.length === 0) return triggerToast('ไม่มีข้อมูล', 'ไม่มีข้อมูลสำหรับส่งออก', 'error');
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${filename}_${getLocalYYYYMMDD()}.xlsx`);
  };

  const handleClearTestData = async () => {
    if (clearDataInput !== 'CONFIRM') {
      showToast('กรุณาพิมพ์คำว่า CONFIRM ให้ถูกต้อง', 'error');
      return;
    }
    setIsClearingData(true);
    try {
      const collectionsToClear = [
        'courses', 'bookings', 'orders', 'daily_sales', 'service_logs',
        'histories', 'advance_payments', 'employee_leaves', 'employee_attendance',
        'employee_requisitions', 'expenses'
      ];
      
      for (const colName of collectionsToClear) {
        const colRef = getCol(colName);
        const snapshot = await getDocs(colRef);
        if (!snapshot.empty) {
          // Delete in batches of 500
          let batch = writeBatch(db);
          let count = 0;
          for (const docSnap of snapshot.docs) {
            batch.delete(docSnap.ref);
            count++;
            if (count === 500) {
              await batch.commit();
              batch = writeBatch(db);
              count = 0;
            }
          }
          if (count > 0) {
            await batch.commit();
          }
        }
      }
      
      showToast('ล้างข้อมูลทดสอบทั้งหมดเรียบร้อยแล้ว!', 'success');
      setIsClearDataModalOpen(false);
      setClearDataInput('');
    } catch (err) {
      console.error(err);
      showToast('เกิดข้อผิดพลาดในการล้างข้อมูล: ' + err.message, 'error');
    } finally {
      setIsClearingData(false);
    }
  };

  // 🧹 ล้างข้อมูลทดสอบเฉพาะเดือนปัจจุบัน — ระบุเดือน (1-ปัจจุบัน), เบอร์ (ไม่ระบุ = ทุกเบอร์), และประเภทข้อมูล
  const getDocTimestamp = (d) => {
      const fromIso = (v) => { const t = new Date(v).getTime(); return isNaN(t) ? null : t; };
      if (d.createdAt) { const t = fromIso(d.createdAt); if (t != null) return t; }
      if (d.updatedAt) { const t = fromIso(d.updatedAt); if (t != null) return t; }
      // fallback: วันที่ไทย "D/M/BBBB (พ.ศ.)" เช่น 23/8/2569
      const m = String(d['วันที่'] || '').trim().match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (m) {
          const yr = parseInt(m[3], 10);
          return new Date(yr > 2400 ? yr - 543 : yr, parseInt(m[2], 10) - 1, parseInt(m[1], 10)).getTime();
      }
      return null;
  };
  const monthStartTs = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).getTime(); };
  const inCurrentMonth = (d) => { const t = getDocTimestamp(d); return t != null && t >= monthStartTs(); };
  const cleanupPhoneMatch = (d, fields) => {
      const target = String(cleanupPhone || '').replace(/\D/g, '');
      if (!target) return true;
      return fields.some(f => String(d[f] || '').replace(/\D/g, '') === target);
  };

  const previewMonthCleanup = async () => {
      const result = { orders: 0, bookings: 0, histories: 0, skinScans: 0, samples: [] };
      if (cleanupCols.orders) {
          const list = orders.filter(o => inCurrentMonth(o) && cleanupPhoneMatch(o, ['customerPhone', 'cleanPhone']));
          result.orders = list.length;
          result.samples.push(...list.slice(0, 5).map(o => `คำสั่งซื้อ ${o.orderNo || o.id} · ${String(o.courseName || o.itemName || '-').slice(0, 30)} · ${getOrderStatus(o)}`));
      }
      if (cleanupCols.bookings) {
          const list = bookings.filter(b => inCurrentMonth(b) && cleanupPhoneMatch(b, ['customerPhone', 'phone']));
          result.bookings = list.length;
      }
      if (cleanupCols.histories) {
          const list = histories.filter(h => inCurrentMonth(h) && cleanupPhoneMatch(h, ['เบอร์โทร', 'cleanPhone', 'customerPhone']));
          result.histories = list.length;
      }
      if (cleanupCols.skinScans) {
          try {
              const snap = await getDocs(getCol('skinScans'));
              result.skinScans = snap.docs.filter(d => inCurrentMonth(d.data()) && cleanupPhoneMatch(d.data(), ['phone'])).length;
          } catch (e) { result.skinScans = 0; }
      }
      setCleanupPreview(result);
  };

  const handleMonthCleanup = async () => {
      if (cleanupInput !== 'ลบ') return showToast('กรุณาพิมพ์คำว่า "ลบ" ให้ถูกต้อง', 'error');
      if (!Object.values(cleanupCols).some(Boolean)) return showToast('เลือกประเภทข้อมูลอย่างน้อย 1 อย่าง', 'error');
      setIsCleaningMonth(true);
      try {
          let deleted = 0;
          const targets = [];
          if (cleanupCols.orders) targets.push(...orders.filter(o => inCurrentMonth(o) && cleanupPhoneMatch(o, ['customerPhone', 'cleanPhone'])).map(o => ({ col: 'orders', id: o.id })));
          if (cleanupCols.bookings) targets.push(...bookings.filter(b => inCurrentMonth(b) && cleanupPhoneMatch(b, ['customerPhone', 'phone'])).map(b => ({ col: 'bookings', id: b.id })));
          if (cleanupCols.histories) targets.push(...histories.filter(h => inCurrentMonth(h) && cleanupPhoneMatch(h, ['เบอร์โทร', 'cleanPhone', 'customerPhone'])).map(h => ({ col: 'histories', id: h.id })));
          if (cleanupCols.skinScans) {
              const snap = await getDocs(getCol('skinScans'));
              targets.push(...snap.docs.filter(d => inCurrentMonth(d.data()) && cleanupPhoneMatch(d.data(), ['phone'])).map(d => ({ col: 'skinScans', id: d.id })));
          }
          let batch = writeBatch(db);
          let count = 0;
          for (const t of targets) {
              batch.delete(getDocRef(t.col, t.id));
              count++; deleted++;
              if (count === 500) { await batch.commit(); batch = writeBatch(db); count = 0; }
          }
          if (count > 0) await batch.commit();
          showToast(`ล้างข้อมูลทดสอบเดือนนี้สำเร็จ (${deleted} รายการ)`, 'success');
          setIsMonthCleanupOpen(false);
          setCleanupInput('');
          setCleanupPreview(null);
          setCleanupPhone('');
      } catch (err) {
          console.error(err);
          showToast('เกิดข้อผิดพลาดในการล้างข้อมูล: ' + err.message, 'error');
      } finally {
          setIsCleaningMonth(false);
      }
  };

  const handleAddBranch = async () => {
    if (!newBranchName.trim()) return;
    try {
        await addDoc(getCol('branches'), {
          name: newBranchName.trim(),
          passcode: '',
          lat: newBranchLat ? parseFloat(newBranchLat) : null,
          lng: newBranchLng ? parseFloat(newBranchLng) : null
        });
        triggerToast('เพิ่มสาขาสำเร็จ', `เพิ่มสาขา ${newBranchName} เรียบร้อยแล้ว`, 'success');
        setNewBranchName('');
        setNewBranchLat('');
        setNewBranchLng('');
    } catch (error) {
        triggerToast('เกิดข้อผิดพลาด', error.message, 'error');
    }
  };

  const handleUpdateBranchLocation = async (id, lat, lng) => {
    try {
        await updateDoc(doc(db, 'branches', id), { 
          lat: parseFloat(lat), 
          lng: parseFloat(lng) 
        });
        triggerToast('อัปเดตสาขาสำเร็จ', 'บันทึกพิกัดสาขาเรียบร้อยแล้ว', 'success');
    } catch (error) {
        triggerToast('เกิดข้อผิดพลาด', error.message, 'error');
    }
  };

  const handleDeleteBranch = async (id, name) => {
    if (!window.confirm(`ยืนยันการลบสาขา ${name} หรือไม่?`)) return;
    try {
        await deleteDoc(doc(db, 'branches', id));
        triggerToast('ลบสาขาสำเร็จ', `ลบสาขา ${name} เรียบร้อยแล้ว`, 'success');
    } catch (error) {
        triggerToast('เกิดข้อผิดพลาด', error.message, 'error');
    }
  };

  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch(e) {}
  };

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
          triggerToast('🔔 แจ้งเตือนใหม่!', `มีรายการรอตรวจสอบเพิ่มขึ้น (รวม ${totalPendingCount} รายการ)`, 'alert');
          if (adminNotifConfig.soundAlert !== false) {
             playNotificationSound();
          }
      }

      prevPendingCount.current = totalPendingCount;
      prevBookingsRef.current = JSON.parse(JSON.stringify(bookings));
  }, [bookings, totalPendingCount, isDbConnected, isCloudLoading, adminNotifConfig.soundAlert]);

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

  useEffect(() => {
    if (globalRole !== 'owner') {
      if (['employees', 'financials', 'settings'].includes(activeTab)) {
        setActiveTab('dashboard');
      }
    }
  }, [globalBranch, activeTab]);

  // Auto-redirect to POS after login if POS button was pressed before login
  useEffect(() => {
    if (posPendingAfterLogin && globalRole && globalBranch) {
      setActiveTab('pos');
      setPosPendingAfterLogin(false);
    }
  }, [posPendingAfterLogin, globalRole, globalBranch]);

  // 🌟 หน้าล็อกอินแอดมิน — บังคับทุกครั้งที่เปิดหน้าใหม่ (จำ session 8 ชม. หลังล็อกอินสำเร็จ)
  // ⚠️ ต้องประกาศ state ก่อน effect ที่อ้างถึง (มิฉะนั้น TDZ ReferenceError)
  const ADMIN_SESSION_HOURS = 8;
  const [loginGate, setLoginGate] = useState(() => {
    try {
      const exp = Number(localStorage.getItem('admin_session_exp') || 0);
      return Date.now() > exp; // หมดอายุ หรือ ยังไม่เคยล็อกอิน → โชว์หน้าล็อกอิน
    } catch (e) { return true; }
  });
  const grantAdminSession = () => {
    try { localStorage.setItem('admin_session_exp', String(Date.now() + ADMIN_SESSION_HOURS * 3600 * 1000)); } catch (e) {}
  };
  const handleStaffLoginGate = (branch) => {
    localStorage.setItem('selectedBranch', branch);
    setGlobalBranch(branch);
    grantAdminSession();
    setLoginGate(false);
    // 🌟 เข้าสู่โหมดเลือกตัวตนพนักค้า → แตะชื่อ → PIN → ลงเวลา → พื้นที่ทำงาน
    setAttendanceMode('select');
    setShowFrontAttendance(true);
  };
  const handleOwnerLoginGate = (branch) => {
    localStorage.setItem('userRole', 'owner');
    setGlobalRole('owner');
    if (branch) {
      localStorage.setItem('selectedBranch', branch);
      setGlobalBranch(branch);
    }
    grantAdminSession();
    setLoginGate(false);
    setActiveTab('dashboard');
    showToast('เข้าสู่ระบบเจ้าของร้านสำเร็จ 👑');
  };

  // 🌟 เปิดหน้าระบบจี้ไฝโดยตรงจากแบนเนอร์หน้าล็อกอิน
  const [posInitialTab, setPosInitialTab] = useState(null);
  const handleOpenMoleFromLogin = (branch) => {
    const targetBranch = branch || globalBranch || 'เฉวง';
    localStorage.setItem('selectedBranch', targetBranch);
    setGlobalBranch(targetBranch);
    grantAdminSession();
    setLoginGate(false);
    setActiveTab('mole_removal');
  };

  // 🌟 พนักงานยืนยัน PIN สำเร็จจากหน้าล็อกอิน (สไลด์ PIN เท่ๆ) -> เปิดหน้า Employee Portal ก่อนไป POS
  const handleStaffDirectLogin = (branch, emp) => {
    const targetBranch = branch || emp?.branch || globalBranch || 'เฉวง';
    if (emp) {
      localStorage.setItem('personalEmployeeId', emp.id);
      try { sessionStorage.setItem(`pin_ok_${emp.id}`, String(Date.now())); } catch (e) {}
      setActiveStaff(emp);
      setInitialEmployeeForAttendance(emp);
      setShowFrontAttendance(true);
    }
    localStorage.setItem('selectedBranch', targetBranch);
    localStorage.setItem('userRole', 'staff');
    setGlobalBranch(targetBranch);
    setGlobalRole('staff');
    grantAdminSession();
    setLoginGate(false);
    setActiveTab('dashboard');
    showToast(`ยินดีต้อนรับ ${emp?.name || ''} ✨`, 'success');
  };

  // 🌟 ส่งยอดด่วนจากหน้าล็อกอิน — เปิด POS เฉพาะหน้า EOD (ไม่ออก session 8 ชม.) เสร็จแล้วกลับหน้าล็อกอิน
  const [posAutoOpenEod, setPosAutoOpenEod] = useState(null);
  const [loginFlash, setLoginFlash] = useState(null);
  const handleQuickEodLoginGate = (branch, emp) => {
    localStorage.setItem('selectedBranch', branch);
    localStorage.setItem('userRole', 'staff');
    setGlobalBranch(branch);
    setGlobalRole('staff');
    setPosAutoOpenEod({ employeeId: emp?.id || '', employeeName: emp?.name || '', nonce: Date.now() });
    setLoginGate(false);
    setActiveTab('pos');
  };
  const handleQuickEodFinished = (submitted) => {
    setPosAutoOpenEod(null);
    setActiveTab('dashboard');
    try { localStorage.removeItem('admin_session_exp'); } catch (e) {}
    setLoginGate(true);
    setLoginFlash(submitted
      ? { type: 'success', text: 'ส่งยอดประจำวันเรียบร้อยแล้ว ✅' }
      : { type: 'info', text: 'ยกเลิกการส่งยอด — ยังไม่ได้บันทึกข้อมูล' });
    setTimeout(() => setLoginFlash(null), 5000);
  };

  // Auto-open employee attendance list on first visit (no branch selected)
  useEffect(() => {
    if (!isCloudLoading && !globalBranch && !loginGate) {
      setShowFrontAttendance(true);
    }
  }, [isCloudLoading, globalBranch, loginGate]);

  // Sync booking branch filter with POS global branch
  useEffect(() => {
    if (globalBranch) {
        setFilterBookingBranch(globalBranch);
    } else {
        setFilterBookingBranch('all');
    }
  }, [globalBranch]);

  const clockedInEmployees = useMemo(() => {
     if (!globalBranch) return [];
     const today = getLocalYYYYMMDD();
     
     return employees.filter(emp => {
         const att = employeeAttendance.find(a => a.employeeId === emp.id && a.date === today && !a.clockOut);
         if (!att) return false;
         
         const checkBranch = (b1, b2) => b1 === b2 || (b1 && b2 && (b1.includes(b2) || b2.includes(b1)));
         
         if (att.branch && !checkBranch(att.branch, globalBranch)) return false;
         if (!att.branch && !checkBranch(emp.branch, globalBranch)) return false;
         return true;
     }).map(emp => {
         const att = employeeAttendance.find(a => a.employeeId === emp.id && a.date === today && !a.clockOut);
         return { ...emp, clockInTime: att.clockIn };
     });
  }, [globalBranch, employees, employeeAttendance]);

  // --- ACTIONS ---
  const showToast = (msg) => { setToastMessage(String(msg)); setTimeout(() => setToastMessage(''), 3000); };
  
  // 🌟 ฟังก์ชันอัพโหลดข้อมูลพร้อมตรวจสอบซ้ำ 🌟
  const handleCSVUpload = async (e, typeName) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        let text = evt.target.result.replace(new RegExp('^\\uFEFF'), ''); 
        const lines = text.split(/\r\n|\n|\r/).filter(l => l.trim() !== '');
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
      } catch (err) {
        showToast(`เกิดข้อผิดพลาด: ${err.message}`);
      } finally {
        e.target.value = ''; 
      }
    };
    reader.readAsText(file);
  };

  const executeDeleteData = async () => {
    const { type, data } = confirmDeleteModal;
    const cmap = { 'รายการคอร์สตั้งต้น': 'master_courses', 'ใบคอร์ส': 'courses', 'ลูกค้า': 'customers', 'ประวัติ': 'histories', 'การจองคิว': 'bookings', 'คำสั่งซื้อ': 'orders', 'สินค้า': 'products' };
    const validCollections = ['master_courses', 'courses', 'customers', 'histories', 'bookings', 'orders', 'products'];
    const collectionName = cmap[type] || (validCollections.includes(type) ? type : null); 
    if (!collectionName) return;
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

  const executeResetAllStock = async () => {
    try {
      showToast('กำลังดำเนินการล้างสต๊อกทั้งหมด กรุณารอสักครู่...');
      let batch = writeBatch(db);
      let count = 0;
      for (const p of products) {
        batch.update(getDocRef('products', p.id), { 
          stock_by_branch: {},
          "จำนวนคงเหลือ": 0,
          col_12: 0
        });
        count++;
        if (count % 400 === 0) {
          await batch.commit();
          batch = writeBatch(db);
        }
      }
      if (count % 400 !== 0) {
        await batch.commit();
      }
      showToast('ล้างสต๊อกสินค้าทั้งหมดสำเร็จแล้ว!');
    } catch (err) {
      showToast('ข้อผิดพลาดในการล้างสต๊อก: ' + err.message);
    }
  };

  const handleApproveCustomer = async (c) => { try { await updateDoc(getDocRef('customers', c.id), { "สถานะสมาชิก": "สมาชิกระดับ VIP" }); setSelectedCustomer(prev => ({ ...prev, computedMemberStatus: "สมาชิกระดับ VIP", isApproved: true })); showToast('อนุมัติสิทธิ์ VIP สำเร็จ!'); } catch (err) { showToast('เกิดข้อผิดพลาดในการอนุมัติสิทธิ์'); } };
  const executeDeleteBooking = async (id) => { try { await deleteDoc(getDocRef('bookings', id)); showToast('ลบสำเร็จ'); } catch (err) { showToast('ข้อผิดพลาด: ' + err.message); } };
  
  const sendBookingLineNotification = async (booking, newStatus, lineUid, cancelReason = null) => {
      if (!lineUid) return;
      const LINE_TOKEN = 'ZETupyqjlJyWxas+yaTBSDuGIkZKAwd8B6bWsZhmqfC+A00I/9LfZm8fSu31l8buhDOZbJhCivLyWiTVsxCZvOmAB0wmAYf4Q+t2jad/G1ZIzmnfo66k79bG6W9QQJIZcJxWuPEj9K5QAQKlVlXSbgdB04t89/1O/w1cDnyilFU=';
      
      const statusColors = {
          'เลื่อนเวลานัดหมาย': '#6366f1',
          'เตือนคิว (อีก 1 ชม.)': '#3b82f6',
          'เตือนคิว (อีก 20 นาที)': '#ef4444',
          'รอการยืนยัน': '#f59e0b',
          'ยืนยันแล้ว': '#14b8a6',
          'รอรับบริการ': '#14b8a6',
          'ยกเลิก': '#ef4444',
          'ยกเลิกฉุกเฉิน': '#dc2626',
          'ยกเลิกโดยลูกค้า': '#ef4444',
          'เสร็จสิ้น': '#10b981',
          'กำลังใช้บริการ': '#f59e0b',
          'กำลังให้บริการ': '#f59e0b',
          'ไม่มาตามนัด': '#64748b'
      };
      
      const statusIcons = {
          'เลื่อนเวลานัดหมาย': '🗓️',
          'เตือนคิว (อีก 1 ชม.)': '⏰',
          'เตือนคิว (อีก 20 นาที)': '⏰',
          'รอการยืนยัน': '●',
          'ยืนยันแล้ว': '✓',
          'รอรับบริการ': '✓',
          'ยกเลิก': '✕',
          'ยกเลิกฉุกเฉิน': '🚨',
          'ยกเลิกโดยลูกค้า': '✕',
          'เสร็จสิ้น': '✓',
          'กำลังใช้บริการ': '—',
          'กำลังให้บริการ': '—',
          'ไม่มาตามนัด': '✕'
      };
      
      const color = statusColors[newStatus] || '#000000';
      const icon = statusIcons[newStatus] || '●';
      const safeDt = getSafeDateTime(booking);
      const dtObj = safeDt ? new Date(safeDt) : null;
      
      const realCancelReason = cancelReason || booking.cancelReason;
      let formattedDate = '-';
      if (dtObj && !isNaN(dtObj.getTime())) {
          const dateOpts = { day: 'numeric', month: 'short', year: 'numeric' };
          const timeOpts = { hour: '2-digit', minute: '2-digit' };
          formattedDate = `${dtObj.toLocaleDateString('th-TH', dateOpts)} เวลา ${dtObj.toLocaleTimeString('th-TH', timeOpts)} น.`;
      }
      
const flexMessage = {
        to: lineUid,
        messages: [
          {
            type: "flex",
            altText: `อัปเดตสถานะคิว: ${newStatus}`,
            contents: {
              type: "bubble",
              size: "mega",
              header: {
                type: "box",
                layout: "vertical",
                backgroundColor: color,
                paddingAll: "16px",
                contents: [
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      {
                        type: "text",
                        text: `${icon} ${newStatus}`,
                        color: "#ffffff",
                        weight: "bold",
                        size: "lg",
                        flex: 1,
                        wrap: true
                      }
                    ]
                  },
                  {
                    type: "text",
                    text: newStatus === 'เลื่อนเวลานัดหมาย'
                      ? (booking.rescheduleReason ? `เหตุผลที่เลื่อน: ${booking.rescheduleReason}` : "คลินิกได้ทำการเลื่อนวันและเวลานัดหมายใหม่ของคุณเรียบร้อยแล้ว")
                      : ['ยกเลิก', 'ยกเลิกฉุกเฉิน', 'ยกเลิกโดยลูกค้า'].includes(newStatus)
                        ? (realCancelReason ? `สาเหตุ: ${realCancelReason}` : "คิวนี้ได้รับการยกเลิกแล้ว")
                        : "แสดง E-Ticket นี้ให้พนักงานเมื่อมาถึงสาขา",
                    size: "xs",
                    color: "#ffffff",
                    margin: "sm",
                    wrap: true
                  }
                ]
              },
              body: {
                type: "box",
                layout: "vertical",
                paddingAll: "20px",
                spacing: "md",
                contents: [
                  ...(newStatus === 'ยกเลิกฉุกเฉิน' && realCancelReason ? [{
                    type: "box",
                    layout: "vertical",
                    backgroundColor: "#fee2e2",
                    cornerRadius: "md",
                    paddingAll: "10px",
                    margin: "sm",
                    contents: [
                      {
                        type: "text",
                        text: `สาเหตุ: ${realCancelReason}`,
                        size: "sm",
                        color: "#991b1b",
                        weight: "bold",
                        wrap: true
                      }
                    ]
                  }] : []),
                  {
                    type: "box",
                    layout: "vertical",
                    backgroundColor: "#f8fafc",
                    cornerRadius: "xl",
                    paddingAll: "15px",
                    contents: [
                      {
                        type: "text",
                        text: "⏰ เวลานัดหมาย",
                        size: "xs",
                        color: "#94a3b8",
                        weight: "bold"
                      },
                      {
                        type: "text",
                        text: (dtObj && !isNaN(dtObj.getTime())) ? dtObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + " น." : "-",
                        size: "xxl",
                        weight: "bold",
                        color: color,
                        margin: "sm"
                      },
                      {
                        type: "text",
                        text: (dtObj && !isNaN(dtObj.getTime())) ? dtObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) : "-",
                        size: "sm",
                        color: "#475569",
                        weight: "bold",
                        margin: "xs"
                      }
                    ]
                  },
                  { type: "separator" },
                  {
                    type: "box",
                    layout: "vertical",
                    spacing: "sm",
                    contents: [
                      {
                        type: "box",
                        layout: "horizontal",
                        contents: [
                          { type: "text", text: "บริการ", color: "#94a3b8", size: "sm", flex: 2 },
                          { type: "text", text: String(booking.courseName || "บริการ"), weight: "bold", color: "#334155", size: "sm", flex: 5, wrap: true, align: "end" }
                        ]
                      },
                      {
                        type: "box",
                        layout: "horizontal",
                        contents: [
                          { type: "text", text: "สาขา", color: "#94a3b8", size: "sm", flex: 2 },
                          { type: "text", text: String(booking.branch || "-"), weight: "bold", color: "#334155", size: "sm", flex: 5, align: "end" }
                        ]
                      },
                      {
                        type: "box",
                        layout: "horizontal",
                        contents: [
                          { type: "text", text: "หมายเลขคิว", color: "#94a3b8", size: "sm", flex: 3 },
                          { type: "text", text: String(booking.ticketNo || booking.id || "-"), weight: "bold", color: "#334155", size: "xs", flex: 5, align: "end" }
                        ]
                      }
                    ]
                  },
                  { type: "separator" },
                  {
                    type: "box",
                    layout: "vertical",
                    paddingTop: "12px",
                    paddingBottom: "4px",
                    contents: [
                      {
                        type: "text",
                        text: ['ยกเลิก', 'ยกเลิกฉุกเฉิน', 'ยกเลิกโดยลูกค้า'].includes(newStatus)
                          ? "QR Code หมายเลขคิว"
                          : "QR Code สำหรับ Check-in",
                        size: "xs",
                        color: "#94a3b8",
                        weight: "bold",
                        align: "center"
                      },
                      {
                        type: "image",
                        url: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(String(booking.ticketNo || booking.id || 'NO_ID'))}`,
                        size: "xl",
                        aspectRatio: "1:1",
                        aspectMode: "cover",
                        align: "center",
                        margin: "md"
                      },
                      {
                        type: "text",
                        text: String(booking.ticketNo || booking.id || "-"),
                        size: "xs",
                        color: "#64748b",
                        weight: "bold",
                        align: "center",
                        margin: "xs"
                      }
                    ]
                  }
                ]
              }
            }
          }
        ]
      };

      try {
          const r = await fetch('https://asia-southeast1-iris-clinic-app.cloudfunctions.net/lineProxy', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${LINE_TOKEN}`
              },
              body: JSON.stringify(flexMessage)
          });
          if (!r.ok) {
              const errText = await r.text();
              throw new Error(`LINE API ${r.status}: ${errText}`);
          }
      } catch (error) {
          console.error("Failed to send LINE booking notification", error);
          throw error; // propagate so callers can show error UI
      }
  };

  const updateBookingStatus = async (bookingId, newStatus, cancelReason = null) => { 
      try { 
          if (newStatus === 'ยกเลิกฉุกเฉิน' && !cancelReason) {
              const reason = window.prompt("กรุณาระบุสาเหตุการยกเลิกฉุกเฉิน (เช่น ไฟดับ, พนักงานไม่พอ):", "");
              if (reason === null) {
                  showToast('ยกเลิกการทำรายการ');
                  return;
              }
              cancelReason = reason || "เหตุสุดวิสัย (ไม่ได้ระบุ)";
          }
          
          const updates = { status: newStatus };
          if (cancelReason) updates.cancelReason = cancelReason;
          
          const targetBooking = bookings.find(b => b.id === bookingId);
          if(targetBooking) {
              if (newStatus === 'กำลังใช้บริการ' && !targetBooking.serviceStartTime) updates.serviceStartTime = new Date().toISOString();
              if (newStatus === 'กำลังใช้บริการ') {
                  const bedNum = window.prompt("กรุณาระบุหมายเลขเตียง (1-4) หรือชื่อห้อง:", "1");
                  if (bedNum !== null) updates.bedNumber = bedNum;
              }
              if (newStatus === 'เสร็จสิ้น' && !targetBooking.serviceEndTime) updates.serviceEndTime = new Date().toISOString();
              if (newStatus === 'เสร็จสิ้น' || newStatus === 'รอชำระเงิน' || newStatus === 'ยกเลิก') updates.bedNumber = null;
          }
          await updateDoc(getDocRef('bookings', bookingId), updates); 
          showToast(`อัปเดตสถานะเป็น "${newStatus}"`); 
          
          if (targetBooking) {
              const targetLineUid = getBookingLineUid(targetBooking);
              if (targetLineUid && lineNotifConfig.bookingNotif !== false) {
                  sendBookingLineNotification({ ...targetBooking, ...updates }, newStatus, targetLineUid, cancelReason)
                      .catch(e => console.warn('LINE notification failed (non-critical):', e.message));
              }
          }
      } catch (err) { showToast('ข้อผิดพลาด: ' + err.message); } 
  };
  
  const executeDeleteOrder = async (id) => { try { await deleteDoc(getDocRef('orders', id)); showToast('ลบสำเร็จ'); } catch (err) { showToast('ข้อผิดพลาด: ' + err.message); } };

  const executeDeleteCustomer = async (id) => { 
    try { 
      await deleteDoc(getDocRef('customers', id)); 
      showToast('ลบลูกค้าสำเร็จ'); 
      setSelectedCustomer(null); 
    } catch (err) { 
      showToast('ข้อผิดพลาด: ' + err.message); 
    } 
  };

  const handleIshipBooking = async (bookingData) => {
    if (!ishipModal.order) return;
    try {
      showToast('กำลังบันทึกข้อมูลการจัดส่ง...');
      const targetOrder = ishipModal.order;
      const updateFields = {
        trackingNo: bookingData.trackingNumber,
        isIShip: true,
        ishipCourier: bookingData.courier || '',
        ishipSortCode: bookingData.rawApiResult?.data?.sortCode || '',
        ishipSortingLineCode: bookingData.rawApiResult?.data?.sortingLineCode || '',
        ishipDstStoreName: bookingData.rawApiResult?.data?.dstStoreName || '',
        codAmount: bookingData.codAmount || 0,
        ...(bookingData.dstAddress ? { shippingAddress: bookingData.dstAddress } : {}),
        ishipOrderRef: bookingData.rawApiResult?.data?.ref || bookingData.rawApiResult?.data?.id || ('ISHIP' + Date.now()),
        status: 'กำลังจัดส่ง',
        'สถานะ': 'กำลังจัดส่ง'
      };

      let updated = false;
      if (targetOrder.id) {
        try {
          await updateDoc(doc(db, 'orders', targetOrder.id), updateFields);
          updated = true;
        } catch (directErr) {
          console.warn('Direct order id update fallback to query:', directErr);
        }
      }
      if (!updated) {
        const q = query(collection(db, 'orders'), where('orderNo', '==', targetOrder.orderNo || targetOrder.id));
        const snap = await getDocs(q);
        if (!snap.empty) {
          await updateDoc(doc(db, 'orders', snap.docs[0].id), updateFields);
          updated = true;
        }
      }

      showToast(`สร้างออเดอร์สำเร็จ! เลขพัสดุ: ${bookingData.trackingNumber}${bookingData.pickupNote || ''}`);
      setIshipModal({ isOpen: false, order: null });
      setOrderTicket(null);
      setShippingLabelOrder({ ...targetOrder, ...updateFields });
    } catch(e) {
      console.error(e);
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูลจัดส่ง', 'error');
    }
  };
  const executeDeleteProduct = async (id) => { try { await deleteDoc(getDocRef('products', id)); showToast('ลบสำเร็จ'); } catch (err) { showToast('ข้อผิดพลาด: ' + err.message); } };
  const executeDeleteMasterCourse = async (id, isPOSCourse = false) => { 
    try { 
      const isPos = Boolean(isPOSCourse || products.some(p => p.id === id));
      const col = isPos ? 'products' : 'master_courses';
      await deleteDoc(getDocRef(col, id)); 
      showToast('ลบสำเร็จ'); 
    } catch (err) { 
      showToast('ข้อผิดพลาด: ' + err.message); 
    } 
  };
  const handleDeleteCourse = async (courseId, courseRefKey) => {
    if (globalRole !== 'owner') {
      showToast('เฉพาะเจ้าของร้านเท่านั้นที่สามารถลบใบคอร์สได้');
      return;
    }
    const safeRef = String(courseRefKey || '');
    if (window.confirm(`คุณต้องการลบใบคอร์ส ${safeRef} ใช่หรือไม่?\n(นี่เป็นการลบใบคอร์สออกจากระบบอย่างถาวร)`)) {
      try {
        await deleteDoc(doc(db, 'courses', courseId));
        showToast('ลบใบคอร์สสำเร็จ');
      } catch (err) {
        showToast('เกิดข้อผิดพลาดในการลบใบคอร์ส: ' + err.message);
      }
    }
  };

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
    setUseCourseData({ staffName: '', photoUrl: null, selections: initialSelections, productSelections: [], branch: globalBranch || 'เฉวง' });
  };

  const handleQtyChange = (courseId, delta, maxAllowed) => {
      setUseCourseData(prev => { const current = prev.selections[courseId] || 0; return { ...prev, selections: { ...prev.selections, [courseId]: Math.max(0, Math.min(maxAllowed, current + delta)) } }; });
  };

  const addProductSelection = () => setUseCourseData(prev => ({ ...prev, productSelections: [...(prev.productSelections || []), { id: Date.now(), productId: '', qty: 1 }] }));
  const updateProductSelection = (id, field, value) => setUseCourseData(prev => ({ ...prev, productSelections: prev.productSelections.map(p => p.id === id ? { ...p, [field]: value } : p) }));
  const removeProductSelection = (id) => setUseCourseData(prev => ({ ...prev, productSelections: prev.productSelections.filter(p => p.id !== id) }));

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
        const activeCourses = getCustomerCourses(customer.computedPhone); 
        const linkedCourseId = useCourseModal.targetCourseId || (activeCourses.length > 0 ? activeCourses[0].id : '');
        const linkedCourse = activeCourses.find(c => c.id === linkedCourseId);
        const isVip = customer?.isApproved === true;
        const targetBranch = normalizeBranchName(useCourseData.branch || globalBranch || 'เฉวง') || 'เฉวง';

        // ตรวจสอบวงเงินเครดิตและคำนวณยอดเบิกสินค้าล่วงหน้าก่อนตัดจริง
        const productItems = [];
        let totalProductQty = 0;
        let totalProductValue = 0;
        const productQtyById = new Map();

        validProducts.forEach(pSelect => {
            const prod = products.find(p => p.id === pSelect.productId);
            if (!prod) return;
            const finalPrice = computeFinalPrice(prod, isVip);
            const lineValue = finalPrice * pSelect.qty;
            const prodName = String(getFuzzyKey(prod, ["ชื่อสินค้า", "col_2"]));
            productItems.push(`${prodName} x${pSelect.qty}`);
            totalProductQty += pSelect.qty;
            totalProductValue += lineValue;
            productQtyById.set(prod.id, (productQtyById.get(prod.id) || 0) + Number(pSelect.qty || 0));
        });

        if (totalProductValue > 0 && (!linkedCourse || totalProductValue > (linkedCourse.computedRemainCredit || 0))) {
            return showToast(`เครดิตคงเหลือไม่เพียงพอสำหรับการเบิกสินค้า (ต้องการ ฿${totalProductValue.toLocaleString()})`);
        }

        const batch = writeBatch(db); 
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
                "สาขา": String(useCourseData.branch || 'เฉวง'), 
                "ผู้ให้บริการ": String(useCourseData.staffName || ''),
                "courseId": course.id,
                "customerPhoto": useCourseData.photoUrl, 
                "customerSignature": custSignatureUrl, 
                "staffSignature": staffSignatureUrl
            });
        });

        // 2. ตัดสต็อกสินค้าแยกตามสาขา (รวมยอดต่อสินค้าป้องกันเขียนทับ)
        productQtyById.forEach((deductQty, prodId) => {
            const prod = products.find(p => p.id === prodId);
            if (!prod || deductQty <= 0) return;
            const nextStockByBranch = { ...(prod.stock_by_branch || {}) };
            const currentBrStock = getBranchStock(prod, targetBranch);
            nextStockByBranch[targetBranch] = Math.max(0, currentBrStock - deductQty);
            const currentTotal = getTotalStock(prod, branches);
            const nextTotal = prod.stock_by_branch && Object.keys(prod.stock_by_branch).length > 0
                ? Object.values(nextStockByBranch).reduce((sum, v) => sum + (Number(v) || 0), 0)
                : Math.max(0, currentTotal - deductQty);
            batch.update(doc(db, 'products', prod.id), {
                stock_by_branch: nextStockByBranch,
                "จำนวนคงเหลือ": String(nextTotal)
            });
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
                "ผู้ให้บริการ": String(useCourseData.staffName || ''),
                "courseId": linkedCourseId,
                "เลขที่ใบคอส": linkedCourse ? String(getFuzzyKey(linkedCourse, ["เลขที่ใบคอส", "col_2"])) : '',
                "สาขา": String(useCourseData.branch || 'เฉวง'),
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
      reader.onloadend = (ev) => { const img = new Image(); img.onload = () => { const canvas = document.createElement('canvas'); const scaleSize = 400 / img.width; canvas.width = 400; canvas.height = img.height * scaleSize; canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height); setUseCourseData(prev => ({ ...prev, photoUrl: canvas.toDataURL('image/jpeg', 0.8) })); }; img.src = ev.target.result; };
      reader.readAsDataURL(file);
  };

  const handleRefundCourse = (historyItem) => {
      setActionConfirmModal({ 
        isOpen: true, 
        title: 'ยืนยันการคืนสิทธิ์ (ยกเลิก)', 
        message: `ประวัติการใช้นี้จะถูกยกเลิกและจำนวนครั้ง/สิทธิ์การเบิกจะถูกคืนกลับไปยังใบคอร์ส แน่ใจหรือไม่?`, 
        confirmText: 'ยืนยันการคืนคอร์ส/คืนสิทธิ์', 
        confirmColor: 'bg-orange-500 hover:bg-orange-600', 
        action: async () => { 
          try { 
            const batch = writeBatch(db);
            batch.update(getDocRef('histories', historyItem.id), { isCancelled: true, "สถานะ": "ยกเลิก" });
            
            const hType = String(getFuzzyKey(historyItem, ["ประเภท", "col_4"]) || '');
            const isClaim = hType.includes('เบิก') || hType === 'เบิกสินค้าจากคอร์ส';
            const claimedItemName = String(getFuzzyKey(historyItem, ["รายการ", "สินค้า", "col_23", "col_18"]) || '').trim();
            const qtyToRevert = Math.max(1, parseQty(getFuzzyKey(historyItem, ["จำนวน", "col_15"])) || extractHistoryQty(historyItem) || 1);

            // Locate target course
            const targetCourseId = historyItem.courseId || historyItem["อ้างอิง"] || historyItem["เลขที่ใบคอส"];
            let course = targetCourseId ? (processedCourses.find(c => c.id === targetCourseId || c.courseRefKey === targetCourseId)) : null;
            if (!course && isClaim) {
               const histPhone = String(getFuzzyKey(historyItem, ["เบอร์โทร", "col_3", "cleanPhone"]) || '').replace(/\D/g, '');
               course = processedCourses.find(c => {
                  const cPhone = String(c.computedPhone || getFuzzyKey(c, ["เบอร์โทร", "col_1"]) || '').replace(/\D/g, '');
                  return cPhone && cPhone === histPhone && Array.isArray(c.claimedItems) && c.claimedItems.some(ci => ci.includes(claimedItemName) || claimedItemName.includes(ci));
               });
            }

            if (course && course.id) {
               if (isClaim) {
                  // Revert claimed items from course
                  const currentClaimed = Array.isArray(course.claimedItems) ? [...course.claimedItems] : [];
                  for (let i = 0; i < qtyToRevert; i++) {
                     const cleanTarget = claimedItemName.replace(/\s+/g, '').toLowerCase();
                     const idx = currentClaimed.findIndex(c => {
                        const cleanC = String(c || '').replace(/\s+/g, '').toLowerCase();
                        return cleanC.includes(cleanTarget) || cleanTarget.includes(cleanC);
                     });
                     if (idx !== -1) currentClaimed.splice(idx, 1);
                  }
                  batch.update(getDocRef('courses', course.id), {
                     claimedItems: currentClaimed
                  });

                  // Restore product stock if it was a physical product
                  const prod = products.find(p => String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2"]) || '').trim() === claimedItemName) ||
                     products.find(p => {
                        const pName = String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2"]) || '').trim();
                        return pName.length >= 3 && (claimedItemName.includes(pName) || pName.includes(claimedItemName));
                     });
                  if (prod) {
                     const branch = normalizeBranchName(historyItem.branch || historyItem["สาขา"] || globalBranch || 'เฉวง') || 'เฉวง';
                     const curStock = parseQty(getBranchStock(prod, branch));
                     const nextStockByBranch = { ...(prod.stock_by_branch || {}) };
                     nextStockByBranch[branch] = curStock + qtyToRevert;
                     const nextTotal = Object.values(nextStockByBranch).reduce((sum, v) => sum + (Number(v) || 0), 0);
                     batch.update(getDocRef('products', prod.id), {
                        stock_by_branch: nextStockByBranch,
                        "จำนวนคงเหลือ": String(nextTotal)
                     });
                  }
               } else {
                  // Revert regular service usage count
                  const currentUsed = parseNumber(getFuzzyKey(course, ["ครั้งที่ใช้", "col_5"]));
                  const newUsed = Math.max(0, currentUsed - qtyToRevert);
                  batch.update(getDocRef('courses', course.id), {
                     "ครั้งที่ใช้": String(newUsed),
                     "สถานะ": "ยังคงเหลือ"
                  });
               }
            }
            
            await batch.commit();
            showToast('คืนสิทธิ์สำเร็จ! ยอด/สิทธิ์การเบิกกลับคืนสู่ใบคอร์สแล้ว'); 
            setSelectedCourse(null); 
          } catch (err) { 
            showToast('เกิดข้อผิดพลาดในการคืนสิทธิ์: ' + err.message); 
          } 
        } 
      });
  };

  // 🌟 ตรวจสอบว่าคำสั่งซื้อสร้างใบคอร์สในระบบ POS แล้วหรือยัง
  const isOrderCourseCreated = (order) => {
    if (!order) return false;
    if (order.courseCreated) return true;
    const orderNo = String(order.orderNo || order.id || '').trim();
    if (!orderNo) return false;
    return (courses || []).some(c => {
      const cRef = String(c.orderNo || c.refOrderNo || getFuzzyKey(c, ["orderNo", "refOrderNo", "หมายเลขคำสั่งซื้อ", "col_6", "อ้างอิง"]) || '').trim();
      return cRef && (cRef === orderNo || cRef.includes(orderNo) || orderNo.includes(cRef));
    });
  };

  // 🌟 ตรวจสอบว่าคำสั่งซื้อมีรายการคอร์ส / บริการ หรือไม่
  const orderHasCourses = (order) => {
    if (!order) return false;
    const cartItems = Array.isArray(order.cartItems) ? order.cartItems : (Array.isArray(order.cart) ? order.cart : []);
    if (order.courseName || order.itemType === 'course') return true;
    if (cartItems.some(i => i && (i.type === 'course' || i.type === 'single_course' || i.category === 'ลงเครื่อง' || i.isAddon || i.isCourse || i.sessions || i.selectedPromoOption || i.promoOption))) return true;
    if (!order.itemType || order.itemType === 'general') {
        const title = String(order.courseName || order.itemName || (cartItems[0]?.name) || '');
        if (title && !order.shippingAddress && !cartItems.every(i => i.type === 'product')) return true;
    }
    return false;
  };

  const executeApproveOrder = async (order, targetStatus = 'ชำระเงินแล้ว') => {
    try {
        // 🌟 กันอนุมัติ "เติมเครดิต (TU)" ผ่านปุ่มอนุมัติทั่วไป — ออเดอร์เติมเครดิตไม่มี courseName/credit
        // การอนุมัติผิด flow จะสร้างคอร์สชื่อ undefined — ต้องใช้ปุ่มเติมวงเงินเครดิตโดยเฉพาะเท่านั้น
        if (order.itemType === 'topup' || order.source === 'Wallet_TopUp' || String(order.orderNo || '').startsWith('TU')) {
            showToast('⚠️ นี่คือคำสั่งซื้อ "เติมเครดิต" — อย่าอนุมัติผ่านปุ่มนี้ ให้ใช้หน้าเติมวงเงินเครดิต (Wallet) เพื่อเพิ่มเครดิตให้ลูกค้าแทน');
            return;
        }
        const cleanOrderPhone = String(order.customerPhone || order.cleanPhone || '').replace(/\D/g, '');
        const matchedCustomer = customersRaw.find(c => {
            const cp = String(c.computedPhone || getFuzzyKey(c, ["เบอร์โทร", "col_3", "phone"]) || '').replace(/\D/g, '');
            return cp && cleanOrderPhone && cp === cleanOrderPhone;
        });
        const cName = matchedCustomer ? String(matchedCustomer.computedName || getFuzzyKey(matchedCustomer, ["ชื่อ", "col_1"])) : String(order.customerName || 'ลูกค้าทั่วไป');
        const resolvedPrice = parseNumber(order.price ?? order.totalPrice ?? order.itemPrice ?? 0);
        const targetBranch = normalizeBranchName(order.branch || globalBranch || 'เฉวง') || 'เฉวง';

        const cartItems = Array.isArray(order.cartItems) ? order.cartItems : (Array.isArray(order.cart) ? order.cart : []);
        const isItemCourse = (i) => i && (i.type === 'course' || i.type === 'single_course' || i.category === 'ลงเครื่อง' || i.isAddon || i.isCourse || i.sessions || i.selectedPromoOption || i.promoOption);
        const hasCourseItem = order.courseName || order.itemType === 'course' || cartItems.some(isItemCourse);
        const isProductOrder = !hasCourseItem && (order.itemType === 'product' || (cartItems.length > 0 && cartItems.every(i => i.type === 'product' || i.type === 'simple')));

        if (isProductOrder) {
            const batch = writeBatch(db);
            if (!order.stockDeducted && cartItems.length > 0) {
                const deductMap = new Map();
                cartItems.forEach(item => {
                    const qty = Number(item.qty) || 1;
                    const prod = products.find(p =>
                        (item.productId && p.id === item.productId) ||
                        (item.id && p.id === item.id) ||
                        (item.sku && String(getFuzzyKey(p, ["รหัส", "รหัสสินค้า", "col_1"]) || '').trim() === String(item.sku).trim()) ||
                        (item.name && String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2"]) || '').trim() === String(item.name).trim())
                    );
                    if (prod) {
                        deductMap.set(prod.id, (deductMap.get(prod.id) || 0) + qty);
                    }
                });
                deductMap.forEach((deductQty, prodId) => {
                    const prod = products.find(p => p.id === prodId);
                    if (!prod) return;
                    const nextStockByBranch = { ...(prod.stock_by_branch || {}) };
                    const curBr = getBranchStock(prod, targetBranch);
                    nextStockByBranch[targetBranch] = Math.max(0, curBr - deductQty);
                    const curTotal = getTotalStock(prod, branches);
                    const nextTotal = prod.stock_by_branch && Object.keys(prod.stock_by_branch).length > 0
                        ? Object.values(nextStockByBranch).reduce((sum, v) => sum + (Number(v) || 0), 0)
                        : Math.max(0, curTotal - deductQty);
                    batch.update(getDocRef('products', prod.id), {
                        stock_by_branch: nextStockByBranch,
                        "จำนวนคงเหลือ": String(nextTotal)
                    });
                });
            }
            const itemSummary = cartItems.length > 0
                ? cartItems.map(i => `${i.name || i.itemName || 'สินค้า'} x${i.qty || 1}`).join(', ')
                : String(order.itemName || order.courseName || 'สินค้า');
            batch.set(doc(getCol('histories')), {
                "วันที่": new Date().toLocaleDateString('th-TH'),
                "เวลา": new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
                "ชื่อลูกค้า": cName,
                "col_2": cName,
                "เบอร์โทร": String(order.customerPhone || ''),
                "col_3": String(order.customerPhone || ''),
                "cleanPhone": cleanOrderPhone,
                "หมายเลขคำสั่งซื้อ": String(order.orderNo || ''),
                "ประเภท": "ซื้อสินค้า",
                "col_4": "ซื้อสินค้า",
                "สถานะ": "เรียบร้อย",
                "สินค้า": itemSummary,
                "col_18": itemSummary,
                "รายการ": itemSummary,
                "ยอดเงิน": String(resolvedPrice),
                "col_19": String(resolvedPrice),
                "สาขา": targetBranch
            });
            batch.update(getDocRef('orders', order.id), {
                status: targetStatus,
                stockDeducted: true,
                updatedAt: new Date().toISOString()
            });
            await batch.commit();
            showToast('อนุมัติคำสั่งซื้อสินค้าและตัดสต็อกสำเร็จ!');
        } else {
            const courseItems = cartItems.filter(isItemCourse);
            const itemsToCreate = courseItems.length > 0 ? courseItems : [{
                name: order.courseName || order.itemName || 'คอร์สบริการ',
                price: resolvedPrice,
                qty: Number(order.qty) || 1,
                sessions: order.sessions || order.qty || "1",
                credit: order.credit || "0",
                desc: order.items || order.desc || ''
            }];

            const batch = writeBatch(db);

            for (const item of itemsToCreate) {
                const itemQty = Number(item.qty) || 1;
                const itemSessions = String(item.sessions || item.selectedPromoOption?.sessions || item.promoOption?.sessions || "1");
                const itemPrice = parseNumber(item.price ?? resolvedPrice);
                const itemCredit = String(item.credit || (order.credit !== undefined && order.credit !== '' ? order.credit : "0"));
                const itemItems = String(item.items || item.selectedPromoOption?.items || item.desc || '');
                const itemName = String(item.name || order.courseName || 'คอร์สบริการ');

                let expireDateStr = "";
                if (item.type === 'single_course' || item.category === 'ลงเครื่อง' || item.isAddon || String(itemSessions) === '1') {
                    const expDate = new Date();
                    expDate.setDate(expDate.getDate() + 7);
                    const exY = expDate.getFullYear() + 543;
                    expireDateStr = `${String(expDate.getDate()).padStart(2, '0')}/${String(expDate.getMonth() + 1).padStart(2, '0')}/${exY}`;
                }

                for (let q = 0; q < itemQty; q++) {
                    const courseNo = `IC${Date.now().toString().slice(-6)}${q}`;
                    const courseRef = doc(getCol('courses'));
                    const courseData = {
                        "เบอร์โทร": String(order.customerPhone || order.cleanPhone || ''),
                        "col_1": String(order.customerPhone || order.cleanPhone || ''),
                        "cleanPhone": cleanOrderPhone,
                        "เลขที่ใบคอส": courseNo,
                        "col_2": courseNo,
                        "วันที่ซื้อ": new Date().toLocaleDateString('th-TH'),
                        "col_3": new Date().toLocaleDateString('th-TH'),
                        "ผู้ซื้อคอส": cName,
                        "col_9": cName,
                        "ชื่อคอส": itemName,
                        "col_8": itemName,
                        "สาขาที่ซื้อ": targetBranch,
                        "ราคา": String(itemPrice),
                        "col_13": String(itemPrice),
                        "เครดิตที่ได้รับ": itemCredit,
                        "col_14": itemCredit,
                        "จำนวนครั้งที่ได้": itemSessions,
                        "col_10": itemSessions,
                        "col_4": itemSessions,
                        "ยอดค้างชำระ": "0",
                        "ยอดชำระแล้วทั้งหมด": String(itemPrice),
                        "ครั้งที่ใช้": "0",
                        "col_5": "0",
                        "ครั้งที่เหลือดิบ": itemSessions,
                        "col_33": itemSessions,
                        "สถานะ": "ยังคงเหลือ",
                        "col_6": "ยังคงเหลือ",
                        "ประเภทการชำระ": "จ่ายเต็ม",
                        "รายการที่ได้รับ": itemItems,
                        "col_11": itemItems,
                        "claimedItems": [],
                        "createdAt": new Date().toISOString(),
                        "promoOption": item.selectedPromoOption || item.promoOption || null,
                        "orderNo": String(order.orderNo || ''),
                        "refOrderNo": String(order.orderNo || '')
                    };
                    if (expireDateStr) courseData["วันหมดอายุ"] = expireDateStr;
                    batch.set(courseRef, courseData);

                    const historyRef = doc(getCol('histories'));
                    batch.set(historyRef, {
                        "วันที่": new Date().toLocaleDateString('th-TH'),
                        "เวลา": new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
                        "ชื่อลูกค้า": cName,
                        "col_2": cName,
                        "เบอร์โทร": String(order.customerPhone || order.cleanPhone || ''),
                        "col_3": String(order.customerPhone || order.cleanPhone || ''),
                        "cleanPhone": cleanOrderPhone,
                        "หมายเลขคำสั่งซื้อ": String(order.orderNo || ''),
                        "ประเภท": "ซื้อคอร์ส",
                        "col_4": "ซื้อคอร์ส",
                        "สถานะ": "เรียบร้อย",
                        "สินค้า": itemName,
                        "col_18": itemName,
                        "ยอดเงิน": String(itemPrice),
                        "col_19": String(itemPrice),
                        "สาขา": targetBranch,
                        "อ้างอิง": courseNo,
                        "col_6": courseNo
                    });
                }
            }

            // Deduct product stock if mixed cart
            const productItems = cartItems.filter(i => i.type === 'product' || i.type === 'simple');
            if (!order.stockDeducted && productItems.length > 0) {
                const deductMap = new Map();
                productItems.forEach(item => {
                    const qty = Number(item.qty) || 1;
                    const prod = products.find(p =>
                        (item.productId && p.id === item.productId) ||
                        (item.id && p.id === item.id) ||
                        (item.sku && String(getFuzzyKey(p, ["รหัส", "รหัสสินค้า", "col_1"]) || '').trim() === String(item.sku).trim()) ||
                        (item.name && String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2"]) || '').trim() === String(item.name).trim())
                    );
                    if (prod) {
                        deductMap.set(prod.id, (deductMap.get(prod.id) || 0) + qty);
                    }
                });
                deductMap.forEach((deductQty, prodId) => {
                    const prod = products.find(p => p.id === prodId);
                    if (!prod) return;
                    const nextStockByBranch = { ...(prod.stock_by_branch || {}) };
                    const curBr = getBranchStock(prod, targetBranch);
                    nextStockByBranch[targetBranch] = Math.max(0, curBr - deductQty);
                    const curTotal = getTotalStock(prod, branches);
                    const nextTotal = prod.stock_by_branch && Object.keys(prod.stock_by_branch).length > 0
                        ? Object.values(nextStockByBranch).reduce((sum, v) => sum + (Number(v) || 0), 0)
                        : Math.max(0, curTotal - deductQty);
                    batch.update(getDocRef('products', prod.id), {
                        stock_by_branch: nextStockByBranch,
                        "จำนวนคงเหลือ": String(nextTotal)
                    });
                });
            }

            batch.update(getDocRef('orders', order.id), { 
                status: targetStatus, 
                courseCreated: true,
                stockDeducted: true, 
                updatedAt: new Date().toISOString() 
            });

            // อัปเดตประวัติการสั่งซื้อเดิม (ถ้ามี) จาก "รอตรวจสอบ" เป็น "เรียบร้อย"
            const matchingPendingHistories = (histories || []).filter(h => 
                String(getFuzzyKey(h, ["หมายเลขคำสั่งซื้อ", "col_5", "Order", "Ref"]) || '').trim() === String(order.orderNo || '').trim()
            );
            matchingPendingHistories.forEach(h => {
                if (h.id) {
                    batch.update(getDocRef('histories', h.id), {
                        "สถานะ": "เรียบร้อย",
                        "col_22": "เรียบร้อย",
                        status: "เรียบร้อย"
                    });
                }
            });

            await batch.commit();
            showToast(`อนุมัติคำสั่งซื้อ (${targetStatus}) และเพิ่มคอร์สเข้าสู่ระบบ POS เรียบร้อยแล้ว! ✨`);
        }
        const targetCustomer = matchedCustomer;
        
        // --- Gamification Logic ---
        if (targetCustomer) {
            try {
                const gamificationSnap = await getDocs(collection(db, 'config'));
                let gamiConfig = null;
                gamificationSnap.forEach(d => { if (d.id === 'gamification') gamiConfig = d.data(); });
                
                if (gamiConfig && gamiConfig.spinSettings && gamiConfig.spinSettings.isActive) {
                    const price = resolvedPrice;
                    const bahtPerSpin = gamiConfig.spinSettings.bahtPerSpin || 5000;
                    const bahtPerGolden = 1000; // Hardcoded or dynamic
                    
                    const spinsToAdd = Math.floor(price / bahtPerSpin);
                    const goldensToAdd = Math.floor(price / bahtPerGolden);
                    
                    let newGoldens = [];
                    for(let i=0; i<goldensToAdd; i++){
                        newGoldens.push(`GLD-${Date.now().toString().slice(-4)}${Math.floor(Math.random()*1000)}`);
                    }
                    
                    if (spinsToAdd > 0 || goldensToAdd > 0) {
                        const custRef = getDocRef('customers', targetCustomer.id);
                        await updateDoc(custRef, {
                            spinTickets: (Number(targetCustomer.spinTickets) || 0) + spinsToAdd,
                            goldenTickets: [...(targetCustomer.goldenTickets || []), ...newGoldens]
                        });
                        console.log(`Added ${spinsToAdd} spins and ${goldensToAdd} golden tickets to ${targetCustomer.id}`);
                    }
                }
            } catch (err) {
                console.error("Error in gamification logic:", err);
            }
        }
        
        if (targetCustomer && targetCustomer.lineUid) sendOrderLineNotification(order, 'อนุมัติแล้ว', targetCustomer.lineUid);
    } catch (err) { showToast('เกิดข้อผิดพลาด: ' + err.message); }
  };


  const saveLineNotifConfig = async (newConfig) => {
    try {
      await setDoc(getDocRef('config', 'lineNotifications'), newConfig, { merge: true });
      setLineNotifConfig(newConfig);
      showToast('บันทึกการตั้งค่าแจ้งเตือน LINE สำเร็จ', 'success');
    } catch(e) {
      showToast('เกิดข้อผิดพลาด: ' + e.message, 'error');
    }
  };

  const sendLineTestNotification = async (testType = 'order') => {
    if (!lineTestTarget) return showToast('กรุณาเลือกลูกค้าที่ต้องการทดสอบก่อน', 'error');
    const customer = customersRaw.find(c => c.id === lineTestTarget);
    if (!customer || !customer.lineUid) return showToast('ลูกค้านี้ไม่ได้ผูก LINE หรือไม่มี LINE UID', 'error');
    setIsSendingTest(testType);
    try {
      const cName = customer.computedName || String(getFuzzyKey(customer, ['ชื่อ', 'col_1']));
      if (testType === 'order') {
        const fakeOrder = { 
          orderNo: 'TEST001', id: 'test_order_001',
          courseName: '[ทดสอบ] คอร์สยกกระชับสลายไขมันทั่วหน้า',
          totalPrice: 4990, customerName: cName,
          cartItems: [{ name: 'คอร์สยกกระชับสลายไขมัน', qty: 1, image: '' }]
        };
        await sendOrderLineNotification(fakeOrder, 'อนุมัติแล้ว', customer.lineUid);
        showToast('✅ ส่งทดสอบ "แจ้งสถานะคำสั่งซื้อ" สำเร็จ! ตรวจสอบ LINE ได้เลย', 'success');
      } else if (testType === 'booking') {
        const fakeBooking = {
          id: 'test_booking_001',
          customerName: cName,
          customerPhone: customer.computedPhone || '',
          courseName: '[ทดสอบ] คิวนัดหมายบริการทั่วไป',
          dateTime: new Date(Date.now() + 3600000).toISOString(),
          branch: globalBranch || 'เฉวง'
        };
        await sendBookingLineNotification(fakeBooking, 'ยืนยันแล้ว', customer.lineUid);
        showToast('✅ ส่งทดสอบ "แจ้งสถานะคิว" สำเร็จ! ตรวจสอบ LINE ได้เลย', 'success');
      } else if (testType === 'reminder') {
        const fakeBooking = {
          id: 'test_booking_002',
          customerName: cName,
          customerPhone: customer.computedPhone || '',
          courseName: '[ทดสอบ] เตือนก่อนถึงเวลานัด',
          dateTime: new Date(Date.now() + 1200000).toISOString(),
          branch: globalBranch || 'เฉวง'
        };
        await sendBookingLineNotification(fakeBooking, 'เตือนคิว (อีก 20 นาที)', customer.lineUid);
        showToast('✅ ส่งทดสอบ "เตือนก่อนเข้าบริการ" สำเร็จ! ตรวจสอบ LINE ได้เลย', 'success');
      }
    } catch(e) {
      showToast('ส่งไม่สำเร็จ: ' + e.message, 'error');
    } finally {
      setIsSendingTest(false);
    }
  };

  // Parse LINE API error response into Thai message
  const parseLineError = async (r) => {
    let errBody = '';
    try { errBody = await r.text(); } catch(_) {}
    if (r.status === 429 || errBody.includes('monthly limit')) {
      return '❌ ใช้โควต้าส่งข้อความ LINE ครบแล้ว (Monthly Limit)\nกรุณา Upgrade LINE OA Plan หรือรอรอบเดือนถัดไป\n\nดูรายละเอียด: https://manager.line.biz';
    }
    if (r.status === 400) return `ข้อมูลไม่ถูกต้อง: ${errBody}`;
    if (r.status === 401) return 'Token LINE หมดอายุหรือไม่ถูกต้อง';
    if (r.status === 403) return 'ไม่มีสิทธิ์ส่งข้อความ (Permission denied)';
    return `LINE API Error ${r.status}: ${errBody}`;
  };

  const sendLineBroadcast = async () => {
    if (!broadcastMsg.title.trim() || !broadcastMsg.body.trim()) {
      return showToast('กรุณาใส่หัวเรื่องและเนื้อหาก่อนส่ง', 'error');
    }
    const LINE_TOKEN_VAL = 'ZETupyqjlJyWxas+yaTBSDuGIkZKAwd8B6bWsZhmqfC+A00I/9LfZm8fSu31l8buhDOZbJhCivLyWiTVsxCZvOmAB0wmAYf4Q+t2jad/G1ZIzmnfo66k79bG6W9QQJIZcJxWuPEj9K5QAQKlVlXSbgdB04t89/1O/w1cDnyilFU=';
    const PROXY = 'https://asia-southeast1-iris-clinic-app.cloudfunctions.net/lineProxy';

    const isMulticast = broadcastMsg.targetType === 'multicast';
    const lineUids = customersRaw.filter(c => c.lineUid).map(c => c.lineUid);

    if (isMulticast && lineUids.length === 0) {
      return showToast('ไม่มีลูกค้าที่ผูก LINE UID ในระบบ', 'error');
    }

    const confirmed = window.confirm(
      isMulticast
        ? `ยืนยันส่ง LINE Flex ถึงลูกค้าที่ผูก LINE ${lineUids.length} คน ใช่หรือไม่?`
        : `ยืนยันส่ง LINE Broadcast ถึง Follower ทั้งหมดของ LINE OA ใช่หรือไม่?`
    );
    if (!confirmed) return;

    setIsBroadcasting(true);
    setBroadcastResult(null);
    try {
      const flexMessage = {
        type: 'flex',
        altText: broadcastMsg.title,
        contents: {
          type: 'bubble',
          size: 'mega',
          header: {
            type: 'box', layout: 'vertical',
            backgroundColor: broadcastMsg.color,
            paddingAll: '16px',
            contents: [
              { type: 'text', text: broadcastMsg.title, color: '#ffffff', weight: 'bold', size: 'lg', wrap: true }
            ]
          },
          body: {
            type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '16px',
            contents: [
              { type: 'text', text: broadcastMsg.body, wrap: true, color: '#444444', size: 'sm' },
              ...(broadcastMsg.ctaUrl && broadcastMsg.ctaText ? [{
                type: 'button',
                style: 'primary',
                color: broadcastMsg.color,
                margin: 'xl',
                action: { type: 'uri', label: broadcastMsg.ctaText, uri: broadcastMsg.ctaUrl }
              }] : [])
            ]
          },
          footer: {
            type: 'box', layout: 'vertical', paddingAll: '12px',
            contents: [
              { type: 'text', text: 'IRIS Clinic — ขอบคุณที่ไว้วางใจเรา 💚', size: 'xs', color: '#aaaaaa', align: 'center' }
            ]
          }
        }
      };

      // Build coupon bubble if one is selected
      const couponBubble = broadcastCoupon ? {
        type: 'bubble',
        size: 'mega',
        header: {
          type: 'box', layout: 'vertical',
          backgroundColor: '#e11d48',
          paddingAll: '16px',
          contents: [
            { type: 'text', text: '🎟️ คูปองพิเศษสำหรับคุณ', color: '#ffffff', weight: 'bold', size: 'md', wrap: true }
          ]
        },
        body: {
          type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '16px',
          contents: [
            {
              type: 'box', layout: 'vertical',
              paddingAll: '12px',
              backgroundColor: '#fff1f2',
              cornerRadius: '12px',
              contents: [
                { type: 'text', text: broadcastCoupon.code, weight: 'bold', size: 'xxl', color: '#e11d48', align: 'center', wrap: true },
                { type: 'text', text: broadcastCoupon.desc || '', size: 'xs', color: '#6b7280', align: 'center', wrap: true, margin: 'sm' }
              ]
            },
            {
              type: 'text',
              text: broadcastCoupon.type === 'percent'
                ? `ส่วนลด ${broadcastCoupon.value}%`
                : broadcastCoupon.type === 'free_item'
                  ? 'แลกรับฟรี!'
                  : broadcastCoupon.type === 'pos_item'
                    ? `ฟรี: ${broadcastCoupon.value}`
                    : `มูลค่า ${Number(broadcastCoupon.value).toLocaleString()} บาท`,
              color: '#e11d48', weight: 'bold', size: 'sm', align: 'center', margin: 'md'
            },
            ...(broadcastCoupon.validUntil ? [{
              type: 'text',
              text: `หมดอายุ: ${new Date(broadcastCoupon.validUntil).toLocaleDateString('th-TH')}`,
              color: '#9ca3af', size: 'xs', align: 'center', margin: 'sm'
            }] : [])
          ]
        },
        footer: {
          type: 'box', layout: 'vertical', paddingAll: '12px',
          contents: [
            { type: 'text', text: 'แสดงโค้ดที่หน้าร้านเพื่อรับสิทธิ์', size: 'xs', color: '#aaaaaa', align: 'center' }
          ]
        }
      } : null;

      // If coupon attached → carousel (2 bubbles), else single bubble
      const finalFlexMessage = couponBubble ? {
        type: 'flex',
        altText: `${broadcastMsg.title} + คูปอง ${broadcastCoupon.code}`,
        contents: {
          type: 'carousel',
          contents: [flexMessage.contents, couponBubble]
        }
      } : flexMessage;

      if (isMulticast) {
        // Send in batches of 500 (LINE multicast limit)
        const BATCH = 500;
        let successCount = 0;
        for (let i = 0; i < lineUids.length; i += BATCH) {
          const batch = lineUids.slice(i, i + BATCH);
          const payload = { _endpoint: 'multicast', to: batch, messages: [finalFlexMessage] };
          const r = await fetch(PROXY, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${LINE_TOKEN_VAL}` },
            body: JSON.stringify(payload)
          });
          if (!r.ok) {
            const errMsg = await parseLineError(r);
            throw new Error(errMsg);
          }
          successCount += batch.length;
        }
        setBroadcastResult({ success: true, sent: successCount, type: 'multicast' });
        showToast(`✅ ส่ง Flex สำเร็จ! ถึงลูกค้า ${successCount} คน`, 'success');
      } else {
        const payload = { _endpoint: 'broadcast', messages: [finalFlexMessage] };
        const r = await fetch(PROXY, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${LINE_TOKEN_VAL}` },
          body: JSON.stringify(payload)
        });
        if (r.ok) {
          setBroadcastResult({ success: true, type: 'broadcast' });
          showToast('✅ Broadcast สำเร็จ! ส่งถึง Follower ทั้งหมดของ LINE OA แล้ว', 'success');
        } else {
          const errMsg = await parseLineError(r);
          throw new Error(errMsg);
        }
      }
    } catch(e) {
      setBroadcastResult({ success: false, error: e.message });
      showToast('ส่งไม่สำเร็จ: ' + e.message.split('\n')[0], 'error');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleRunMigration = async () => {

    try {
      const confirmMsg = window.confirm("รัน Migration ข้อมูลคอร์สและประวัติ? ระบบจะทำการฝังตัวเลขลงฐานข้อมูลถาวร");
      if (!confirmMsg) return;

      setIsClearingData(true);
      showToast("เริ่มทำ Migration... กรุณารอสักครู่", "alert");

      let batch = writeBatch(db);
      let opCount = 0;
      let coursesUpdated = 0;
      let historiesUpdated = 0;

      const commitBatch = async () => {
        await batch.commit();
        batch = writeBatch(db);
        opCount = 0;
      };

      for (const course of processedCourses) {
         if (course.computedUsedQty !== undefined) {
             const courseRef = getDocRef('courses', course.id);
             batch.update(courseRef, { 
                "ครั้งที่ใช้": String(course.computedUsedQty),
                "สถานะ": course.computedStatus || "ยังคงเหลือ"
             });
             opCount++;
             coursesUpdated++;
             if (opCount >= 400) await commitBatch();
         }
      }

      for (const h of histories) {
         if (!h.courseUpdatedDirectly) {
             const historyRef = getDocRef('histories', h.id);
             batch.update(historyRef, {
                 courseUpdatedDirectly: true
             });
             opCount++;
             historiesUpdated++;
             if (opCount >= 400) await commitBatch();
         }
      }

      if (opCount > 0) {
         await commitBatch();
      }

      showToast(`Migration สำเร็จ! อัปเดตคอร์ส ${coursesUpdated} รายการ และประวัติ ${historiesUpdated} รายการ`);
    } catch (err) {
      showToast("เกิดข้อผิดพลาดในการ Migration: " + err.message);
    } finally {
      setIsClearingData(false);
    }
  };

  const handleOrderStatusChange = async (order, newStatus) => {
    if (newStatus === order.status) return;
    const isApprovedStatus = ['ชำระเงินแล้ว', 'สำเร็จ', 'เรียบร้อย'].includes(newStatus);
    const hasCourse = orderHasCourses(order);
    const alreadyCreated = isOrderCourseCreated(order);

    if (isApprovedStatus && hasCourse && !alreadyCreated) {
      setActionConfirmModal({ 
        isOpen: true, 
        title: 'ยืนยันอนุมัติและสร้างคอร์สใน POS', 
        message: `เปลี่ยนสถานะเป็น "${newStatus}" และสร้างใบคอร์สในระบบ POS ให้กับคุณ ${String(order.customerName || order.customerPhone || '')} ทันทีใช่หรือไม่?`, 
        action: () => executeApproveOrder(order, newStatus), 
        confirmText: `อนุมัติ (${newStatus}) + เพิ่มคอร์ส`, 
        confirmColor: 'bg-emerald-500 hover:bg-emerald-600' 
      });
    } else if (newStatus === 'ชำระเงินแล้ว' && !alreadyCreated) {
      setActionConfirmModal({ 
        isOpen: true, 
        title: 'ยืนยันอนุมัติคำสั่งซื้อ', 
        message: `ยืนยันการอนุมัติคำสั่งซื้อให้กับ ${String(order.customerName || order.customerPhone || '')} ใช่หรือไม่?`, 
        action: () => executeApproveOrder(order, newStatus), 
        confirmText: 'อนุมัติคำสั่งซื้อ', 
        confirmColor: 'bg-emerald-500 hover:bg-emerald-600' 
      });
    } else { 
        try {
        await updateDoc(getDocRef('orders', order.id), { status: newStatus, updatedAt: new Date().toISOString() });
        showToast(`เปลี่ยนสถานะเป็น "${newStatus}"`); 
        
        // Use cleanPhone to reliably match customer phone regardless of formatting (- or spaces)
        const cleanPhone = (p) => String(p || '').replace(/\D/g, '');
        const targetCustomer = customersRaw.find(c => 
          cleanPhone(c.computedPhone || getFuzzyKey(c, ["เบอร์โทร", "col_3"])) === cleanPhone(order.customerPhone)
        ); 
        
        if (targetCustomer && targetCustomer.lineUid) {
          sendOrderLineNotification(order, newStatus, targetCustomer.lineUid);
        }
      } catch (err) { 
        showToast('ข้อผิดพลาด: ' + err.message); 
      } 
    }
  };

  const BRANCHES = ['เฉวง', 'ละไม'];

  const isSlotTaken = (datetimeInput, requestedDuration = 60, branch = null) => {
    if (!datetimeInput) return false;
    const parts = datetimeInput.split('T');
    const datePart = parts[0];
    const timePart = parts[1];
    if (!datePart || !timePart) return false;

    const [h, m] = timePart.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return false;
    const reqStart = h * 60 + m;
    const reqEnd = reqStart + Number(requestedDuration || 60);

    return bookings.some(b => {
      const status = getBookingStatus(b);
      if (status === 'ยกเลิก' || status === 'เสร็จสิ้น') return false;

      if (branch && b.branch && normalizeBranchName(b.branch) !== normalizeBranchName(branch)) {
        return false;
      }

      const safeDt = getSafeDateTime(b);
      const bDate = b.date || (safeDt ? safeDt.split('T')[0] : '');
      if (bDate !== datePart) return false;

      const bTime = b.time || (safeDt ? safeDt.split('T')[1] : '');
      if (!bTime) return false;

      const [bh, bm] = bTime.split(':').map(Number);
      if (isNaN(bh) || isNaN(bm)) return false;

      const bStart = bh * 60 + bm;
      const bDur = Number(b.duration || calculateBookingDuration(b.courseName || b.service || '', b.guestsCount || 1, bookingConfig) || 60);
      const bEnd = bStart + bDur;

      return Math.max(reqStart, bStart) < Math.min(reqEnd, bEnd);
    });
  };

  // 🤖 Helper to get active Gemini API key from localStorage or Firestore
  const getGeminiApiKey = async () => {
    let key = (localStorage.getItem('gemini_api_key') || '').trim();
    if (key && key.length > 10 && key !== 'AIzaSyBwRZHwQ_sIzjYMVVsBDu3wYk8scjXJ5yc') {
      return key;
    }
    try {
      const snap = await getDoc(getDocRef('app_settings', 'ai'));
      if (snap.exists() && snap.data().geminiApiKey) {
        const k = snap.data().geminiApiKey.trim();
        if (k && k.length > 10 && k !== 'AIzaSyBwRZHwQ_sIzjYMVVsBDu3wYk8scjXJ5yc') {
          return k;
        }
      }
    } catch (e) {
      console.warn('Error reading app_settings/ai:', e);
    }
    return '';
  };

  const testGeminiApiKey = async (key) => {
    const k = (key || '').trim();
    if (!k) throw new Error('กรุณาระบุ API Key');
    const modelsToTry = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
    let lastErr = null;
    for (const m of modelsToTry) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${k}`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-goog-api-key': k
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Ping' }] }],
            generationConfig: { maxOutputTokens: 5 }
          })
        });
        if (res.ok) return true;
        const err = await res.json().catch(() => ({}));
        lastErr = err.error?.message || `HTTP ${res.status}`;
      } catch (e) {
        lastErr = e.message;
      }
    }
    throw new Error(lastErr || 'ไม่สามารถเชื่อมต่อกับ Google Gemini ได้');
  };

  const handleSaveGeminiApiKey = async () => {
    const trimmed = customGeminiApiKey.trim();
    if (!trimmed) {
      showToast('กรุณาระบุ Gemini API Key', 'warning');
      return;
    }
    setIsTestingGeminiKey(true);
    try {
      await testGeminiApiKey(trimmed);
      await setDoc(getDocRef('app_settings', 'ai'), {
        geminiApiKey: trimmed,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      localStorage.setItem('gemini_api_key', trimmed);
      showToast('✅ เชื่อมต่อ Google Gemini AI สำเร็จ!', 'success');
      setIsGeminiKeyModalOpen(false);

      if (typeof pendingAiAction === 'function') {
        const action = pendingAiAction;
        setPendingAiAction(null);
        setTimeout(() => action(), 300);
      }
    } catch (err) {
      showToast('❌ การเชื่อมต่อไม่สำเร็จ: ' + err.message, 'error');
    } finally {
      setIsTestingGeminiKey(false);
    }
  };

  // 🪪 AI Thai National ID Card OCR Reader 🪪
  const handleAnalyzeIdCard = async (base64Data, target = 'new') => {
    if (!base64Data) return;
    try {
      setIsScanningIdCard(true);
      showToast('กำลังส่งภาพบัตรประชาชนให้ Iris AI อ่านข้อมูล...', 'info');

      const apiKey = await getGeminiApiKey();
      if (!apiKey) {
        setPendingAiAction(() => () => handleAnalyzeIdCard(base64Data, target));
        setIsGeminiKeyModalOpen(true);
        throw new Error('กรุณาระบุ Google Gemini API Key เพื่อใช้งาน AI (สร้างฟรีได้ที่ aistudio.google.com/apikey)');
      }

      const prompt = `คุณคือระบบ AI OCR อัจฉริยะสำหรับอ่านข้อมูลจากบัตรประจำตัวประชาชนไทย (Thai National ID Card)
จงอ่านข้อมูลจากภาพบัตรประชาชนนี้อย่างละเอียด ถูกต้อง และแม่นยำที่สุด
หากส่วนใดในภาพไม่ชัดเจน หรือไม่มีระบุ ให้ใส่ค่าว่าง ("") อย่าแต่งข้อมูลขึ้นมาเอง

กฎการแปลงข้อมูล:
1. citizenId: เลขประจำตัวประชาชน 13 หลัก ตัวเลขติดกันเท่านั้น ไม่มีขีดคั่น
2. title: คำนำหน้า เช่น นาย, นาง, นางสาว, น.ส., เด็กชาย, เด็กหญิง
3. firstName: ชื่อตัวภาษาไทยเท่านั้น ไม่รวมคำนำหน้า
4. lastName: นามสกุลภาษาไทยเท่านั้น
5. firstNameEn: ชื่อตัวภาษาอังกฤษ
6. lastNameEn: นามสกุลภาษาอังกฤษ
7. gender: เพศ ("หญิง" หรือ "ชาย") หากไม่ระบุชัดเจน ให้อนุมานจากคำนำหน้า (นาย = ชาย, นาง/นางสาว/น.ส. = หญิง)
8. dob: วัน/เดือน/ปีเกิด ในรูปแบบ วว/ดด/ปปปป (พ.ศ.) เช่น "15/05/2536" (หากเป็นชื่อเดือนภาษาไทย เช่น 15 พ.ค. 2536 ให้แปลงชื่อเดือนเป็นตัวเลข 2 หลักเสมอ เช่น 15/05/2536)
9. birthYearBe: ตัวเลขปีเกิด พ.ศ. เช่น 2536
10. age: อายุเป็นตัวเลขจำนวนเต็ม คำนวณจากปีเกิด พ.ศ. เทียบกับปีปัจจุบัน พ.ศ. 2569 (เช่น 2569 - 2536 = 33)
11. addressNo: บ้านเลขที่, หมู่ที่, ซอย, ถนน
12. subDistrict: ตำบล หรือ แขวง (ตัดคำว่า ตำบล/แขวง ออกหรือใส่ให้เรียบร้อย)
13. district: อำเภอ หรือ เขต (ตัดคำว่า อำเภอ/เขต ออกหรือใส่ให้เรียบร้อย)
14. province: จังหวัด (ตัดคำว่า จังหวัด ออกหรือใส่ชื่อจังหวัด เช่น สุราษฎร์ธานี, กรุงเทพมหานคร)
15. zipcode: รหัสไปรษณีย์ 5 หลัก (ถ้าในบัตรไม่ระบุ ให้ค้นหา/อนุมานจากตำบล อำเภอ จังหวัด)
16. fullAddress: ที่อยู่เต็มตามที่ปรากฏในบัตร

ตอบกลับเป็น JSON เท่านั้น โครงสร้างดังนี้:
{
  "citizenId": "1849900123456",
  "title": "นางสาว",
  "firstName": "สมหญิง",
  "lastName": "ใจดี",
  "firstNameEn": "Somying",
  "lastNameEn": "Jaidee",
  "gender": "หญิง",
  "dob": "15/05/2536",
  "birthYearBe": 2536,
  "age": 33,
  "addressNo": "123/45 หมู่ 2",
  "subDistrict": "บ่อผุด",
  "district": "เกาะสมุย",
  "province": "สุราษฎร์ธานี",
  "zipcode": "84320",
  "fullAddress": "123/45 หมู่ 2 ต.บ่อผุด อ.เกาะสมุย จ.สุราษฎร์ธานี"
}`;

      const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
      const cleanMime = (base64Data.includes('data:') && base64Data.includes(';'))
        ? base64Data.split(';')[0].replace('data:', '')
        : 'image/jpeg';

      const requestPayload = {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: cleanMime,
                  data: cleanBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      };

      const modelsToTry = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
      let response = null;
      let lastErrMessage = null;

      for (const model of modelsToTry) {
        try {
          response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey
            },
            body: JSON.stringify(requestPayload)
          });
          if (response.ok) break;
          const errJson = await response.json().catch(() => ({}));
          lastErrMessage = errJson.error?.message || `HTTP ${response.status}`;
          if (response.status === 400 || response.status === 403) break;
        } catch (fetchErr) {
          lastErrMessage = fetchErr.message;
        }
      }

      if (!response || !response.ok) {
        if (response?.status === 403 || (lastErrMessage && (lastErrMessage.includes('leaked') || lastErrMessage.includes('API key') || lastErrMessage.includes('PERMISSION_DENIED')))) {
          setPendingAiAction(() => () => handleAnalyzeIdCard(base64Data, target));
          setIsGeminiKeyModalOpen(true);
          throw new Error('Gemini API Key ถูกระงับหรือหมดอายุ (Google ตรวจพบคีย์รั่วไหล) กรุณาใส่ API Key ใหม่');
        }
        throw new Error(lastErrMessage || `HTTP ${response?.status || 'Error'}`);
      }

      const resData = await response.json();
      const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('AI ไม่ได้ตอบกลับข้อมูลบัตร');

      const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(cleanedText);

      const updateFields = (prev) => {
        const updatedFirstName = parsedData.firstName ? String(parsedData.firstName).trim() : prev.firstName;
        const updatedLastName = parsedData.lastName ? String(parsedData.lastName).trim() : prev.lastName;
        const fullName = `${updatedFirstName} ${updatedLastName}`.trim();
        
        let gender = prev.gender;
        if (parsedData.gender) {
          gender = parsedData.gender.includes('ชาย') ? 'ชาย' : 'หญิง';
        } else if (parsedData.title) {
          gender = parsedData.title.includes('นาย') ? 'ชาย' : 'หญิง';
        }

        let age = prev.age;
        if (parsedData.age) {
          age = String(parsedData.age);
        } else if (parsedData.birthYearBe) {
          const currentYearBE = new Date().getFullYear() + 543;
          age = String(Math.max(0, currentYearBE - Number(parsedData.birthYearBe)));
        }

        return {
          ...prev,
          firstName: updatedFirstName,
          lastName: updatedLastName,
          name: fullName,
          gender: gender,
          dob: parsedData.dob ? String(parsedData.dob).trim() : prev.dob,
          age: age,
          citizenId: parsedData.citizenId ? String(parsedData.citizenId).replace(/\D/g, '') : prev.citizenId,
          addressNo: parsedData.addressNo ? String(parsedData.addressNo).trim() : prev.addressNo,
          subDistrict: parsedData.subDistrict ? String(parsedData.subDistrict).trim() : prev.subDistrict,
          district: parsedData.district ? String(parsedData.district).trim() : prev.district,
          province: parsedData.province ? String(parsedData.province).trim() : prev.province,
          zipcode: parsedData.zipcode ? String(parsedData.zipcode).trim() : prev.zipcode
        };
      };

      if (target === 'edit') {
        setEditCustomerData(updateFields);
      } else {
        setNewCustomerForm(updateFields);
      }

      const extractedName = parsedData.firstName ? `คุณ${parsedData.firstName} ${parsedData.lastName || ''}` : '';
      showToast(`✨ AI อ่านบัตรประชาชนสำเร็จ! ${extractedName} (กรอกข้อมูลให้อัตโนมัติแล้ว)`, 'success');

    } catch (err) {
      console.error('ID Card AI Analysis error:', err);
      showToast('ไม่สามารถอ่านบัตรด้วย AI ได้: ' + err.message, 'error');
    } finally {
      setIsScanningIdCard(false);
    }
  };

  const handleIdCardPhotoSelected = async (e, target = 'new') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsScanningIdCard(true);
      const compressedBlob = await compressImage(file, 1600, 1600, 0.90);
      const idCardPhotoFile = new File([compressedBlob], `idcard_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const previewUrl = URL.createObjectURL(compressedBlob);
      const base64Data = await blobToBase64(compressedBlob);

      if (target === 'edit') {
        setEditCustomerData(prev => ({
          ...prev,
          idCardPhotoFile,
          idCardPhotoPreview: previewUrl,
          idCardPhotoBase64: base64Data
        }));
      } else {
        setNewCustomerForm(prev => ({
          ...prev,
          idCardPhotoFile,
          idCardPhotoPreview: previewUrl,
          idCardPhotoBase64: base64Data
        }));
      }

      // Immediately trigger Gemini ID Card OCR analysis!
      await handleAnalyzeIdCard(base64Data, target);
    } catch (err) {
      console.error('ID Card photo error:', err);
      showToast('ไม่สามารถประมวลผลรูปภาพบัตรได้: ' + err.message, 'error');
      setIsScanningIdCard(false);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // 🌟 AI Skin Analysis from Customer Photo 🌟
  const handleAnalyzeCustomerPhoto = async (base64Data, target = 'new') => {
    if (!base64Data) return;
    try {
      setIsAnalyzingSkin(true);
      showToast('กำลังส่งภาพถ่ายให้ Iris AI วิเคราะห์สภาพผิว...', 'info');

      let data = null;
      try {
        const response = await fetch('https://asia-southeast1-iris-clinic-app.cloudfunctions.net/aiSkinAnalysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Data,
            mimeType: 'image/jpeg',
            scanMode: 'skin'
          })
        });

        if (response.ok) {
          data = await response.json();
        }
      } catch (cfErr) {
        console.warn('Cloud Function aiSkinAnalysis fetch failed, falling back to direct Gemini API:', cfErr);
      }

      // If Cloud Function failed or returned no scores/summary, fallback directly to Gemini API
      if (!data || (!data.scores && !data.summary)) {
        const apiKey = await getGeminiApiKey();
        if (!apiKey) {
          setPendingAiAction(() => () => handleAnalyzeCustomerPhoto(base64Data, target));
          setIsGeminiKeyModalOpen(true);
          throw new Error('กรุณาระบุ Google Gemini API Key เพื่อใช้งาน AI');
        }

        const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
        const skinPrompt = `คุณคือผู้เชี่ยวชาญด้านผิวพรรณประจำ Iris Clinic (ไอริส คลินิก)
จงวิเคราะห์ภาพใบหน้านี้อย่างละเอียดในด้านหลักต่อไปนี้ (คะแนน 1-10 โดย 10 คือสมบูรณ์แบบ):
1. สิวและรอยแดง (acne)
2. ริ้วรอยและความกระชับ (wrinkles)
3. ความสว่างกระจ่างใส (brightness)
4. รูขุมขนและความเรียบเนียน (pores)
5. ฝ้า กระ จุดด่างดำ (darkSpots)
6. ความชุ่มชื้นและสมดุลความมัน (moisture)
7. ระดับความพร้อมผลัดเซลล์ผิว (cellTurnover)
พร้อมประเมินอายุผิวหน้า (estimatedSkinAge ตัวเลข)

ตอบกลับเป็น JSON เท่านั้น:
{
  "greeting": "สวัสดีค่ะคุณลูกค้าจาก Iris Clinic",
  "estimatedSkinAge": 28,
  "scores": { "acne": 8, "wrinkles": 7, "brightness": 6, "pores": 7, "darkSpots": 6, "moisture": 8, "cellTurnover": 6 },
  "hydrationAnalysis": { "isDehydrated": false, "description": "ผิวชุ่มชื้นปานกลาง" },
  "summary": "สรุปสภาพผิวสั้นๆ",
  "recommendation": "คำแนะนำการดูแลผิวสั้นๆ"
}`;

        const reqPayload = {
          contents: [{
            parts: [
              { text: skinPrompt },
              { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } }
            ]
          }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
        };

        const modelsToTry = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
        let geminiRes = null;
        let lastErrMessage = null;

        for (const model of modelsToTry) {
          try {
            geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
              },
              body: JSON.stringify(reqPayload)
            });
            if (geminiRes.ok) break;
            const errJson = await geminiRes.json().catch(() => ({}));
            lastErrMessage = errJson.error?.message || `HTTP ${geminiRes.status}`;
            if (geminiRes.status === 400 || geminiRes.status === 403) break;
          } catch (e) {
            lastErrMessage = e.message;
          }
        }

        if (geminiRes && geminiRes.ok) {
          const resJson = await geminiRes.json();
          const raw = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (raw) {
            data = JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim());
          }
        } else {
          if (geminiRes?.status === 403 || (lastErrMessage && (lastErrMessage.includes('leaked') || lastErrMessage.includes('API key') || lastErrMessage.includes('PERMISSION_DENIED')))) {
            setPendingAiAction(() => () => handleAnalyzeCustomerPhoto(base64Data, target));
            setIsGeminiKeyModalOpen(true);
            throw new Error('Gemini API Key ถูกระงับหรือหมดอายุ (Google ตรวจพบคีย์รั่วไหล) กรุณาใส่ API Key ใหม่');
          }
          throw new Error(lastErrMessage || 'ไม่สามารถเชื่อมต่อ Gemini API ได้');
        }
      }

      if (data && (data.scores || data.summary || data.greeting)) {
        // Extract concerns
        const detectedIssues = [];
        if (data.scores) {
          if (data.scores.acne <= 7) detectedIssues.push('สิวอักเสบ/รอยแดง');
          if (data.scores.darkSpots <= 7) detectedIssues.push('ฝ้า/กระ/รอยดำ');
          if (data.scores.moisture <= 7) detectedIssues.push('ผิวแห้งขาดน้ำ');
          if (data.scores.pores <= 7) detectedIssues.push('รูขุมขนกว้าง/หน้ามัน');
          if (data.scores.wrinkles <= 7) detectedIssues.push('ริ้วรอย/หย่อนคล้อย');
          if (data.scores.brightness <= 7) detectedIssues.push('ผิวหมองคล้ำ');
          if (data.scores.cellTurnover >= 7) detectedIssues.push('ผลัดเซลล์ผิว');
        }
        if (data.hydrationAnalysis?.isDehydrated && !detectedIssues.includes('ผิวแห้งขาดน้ำ')) {
          detectedIssues.push('ผิวแห้งขาดน้ำ');
        }

        let detectedText = detectedIssues.join(', ');
        if (!detectedText && data.summary) {
          detectedText = data.summary;
        }

        const updateFn = (prev) => {
          const updatedAge = (!prev.age && data.estimatedSkinAge) ? String(data.estimatedSkinAge) : prev.age;
          const updatedIssue = detectedText 
            ? (prev.issue ? `${prev.issue}, ${detectedText}` : detectedText)
            : prev.issue;
          return {
            ...prev,
            issue: updatedIssue,
            age: updatedAge,
            aiSkinScanResult: data
          };
        };

        if (target === 'edit') {
          setEditCustomerData(updateFn);
        } else {
          setNewCustomerForm(updateFn);
        }

        showToast('✨ Iris AI วิเคราะห์สภาพผิวเรียบร้อยแล้ว!', 'success');
      }
    } catch (err) {
      console.warn('AI analysis error:', err);
      showToast('ระบบบันทึกรูปถ่ายแล้ว (สามารถแตะเลือกปัญหาผิวด้านล่างได้ทันที)', 'info');
    } finally {
      setIsAnalyzingSkin(false);
    }
  };

  const handleCustomerPhotoSelected = async (e, target = 'new') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsAnalyzingSkin(true);
      const compressedBlob = await compressImage(file, 900, 900, 0.82);
      const photoFile = new File([compressedBlob], `cust_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const previewUrl = URL.createObjectURL(compressedBlob);
      const base64Data = await blobToBase64(compressedBlob);

      if (target === 'edit') {
        setEditCustomerData(prev => ({
          ...prev,
          photoFile,
          photoPreview: previewUrl,
          photoBase64: base64Data
        }));
      } else {
        setNewCustomerForm(prev => ({
          ...prev,
          photoFile,
          photoPreview: previewUrl,
          photoBase64: base64Data
        }));
      }

      // Immediately trigger AI skin analysis!
      await handleAnalyzeCustomerPhoto(base64Data, target);
    } catch (err) {
      console.error('Photo processing error:', err);
      showToast('ไม่สามารถประมวลผลรูปภาพได้: ' + err.message, 'error');
      setIsAnalyzingSkin(false);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // 🌟 Member Card & VIP Upgrade Photo Handler 🌟
  const handleMemberCardPhotoSelected = async (e, target = 'new') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedBlob = await compressImage(file, 1200, 1200, 0.85);
      const memberCardPhotoFile = new File([compressedBlob], `membercard_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const previewUrl = URL.createObjectURL(compressedBlob);
      const base64Data = await blobToBase64(compressedBlob);

      const updateCard = (prev) => ({
        ...prev,
        hasMemberCard: true,
        isVipUpgrade: true,
        memberCardPhotoFile,
        memberCardPhotoPreview: previewUrl,
        memberCardPhotoBase64: base64Data
      });

      if (target === 'edit') {
        setEditCustomerData(updateCard);
      } else {
        setNewCustomerForm(updateCard);
      }
      showToast('แนบรูปถ่ายบัตรสมาชิกเรียบร้อยแล้ว!', 'success');
    } catch (err) {
      console.error('Member Card photo error:', err);
      showToast('ไม่สามารถประมวลผลรูปภาพบัตรสมาชิกได้: ' + err.message, 'error');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // --- CUSTOMER ACTIONS ---
  const handleAddCustomer = async (e) => { 
    e.preventDefault(); 
    try { 
      const computedName = `${newCustomerForm.firstName || ''} ${newCustomerForm.lastName || ''}`.trim() || String(newCustomerForm.name || '').trim();
      const cleanPhone = String(newCustomerForm.phone || '').trim().replace(/\D/g, '');

      if (!computedName) {
        showToast('กรุณาระบุชื่อลูกค้า', 'error');
        return;
      }
      if (!cleanPhone || cleanPhone.length < 9) {
        showToast('กรุณาระบุเบอร์โทรศัพท์ให้ถูกต้อง (9-10 หลัก)', 'error');
        return;
      }

      // ตรวจสอบเบอร์ซ้ำ
      const isDuplicate = customers.some(c => {
        const p = String(c.computedPhone || c["เบอร์โทร"] || c.col_3 || '').replace(/\D/g, '');
        return p && p === cleanPhone;
      });
      if (isDuplicate) {
        showToast(`เบอร์โทรศัพท์ ${cleanPhone} มีในระบบแล้ว`, 'error');
        return;
      }

      let uploadedPhotoUrl = '';
      if (newCustomerForm.photoFile) {
        try {
          const photoStorageRef = ref(storage, `customer_photos/${cleanPhone}_${Date.now()}.jpg`);
          await uploadBytes(photoStorageRef, newCustomerForm.photoFile);
          uploadedPhotoUrl = await getDownloadURL(photoStorageRef);
        } catch (uploadErr) {
          console.warn('Customer photo upload error:', uploadErr);
        }
      }

      let uploadedIdCardUrl = '';
      if (newCustomerForm.idCardPhotoFile) {
        try {
          const idCardStorageRef = ref(storage, `customer_id_cards/${cleanPhone}_${Date.now()}.jpg`);
          await uploadBytes(idCardStorageRef, newCustomerForm.idCardPhotoFile);
          uploadedIdCardUrl = await getDownloadURL(idCardStorageRef);
        } catch (uploadErr) {
          console.warn('Customer ID card upload error:', uploadErr);
        }
      }

      let uploadedMemberCardUrl = '';
      if (newCustomerForm.memberCardPhotoFile) {
        try {
          const cardStorageRef = ref(storage, `customer_vip_cards/${cleanPhone}_${Date.now()}.jpg`);
          await uploadBytes(cardStorageRef, newCustomerForm.memberCardPhotoFile);
          uploadedMemberCardUrl = await getDownloadURL(cardStorageRef);
        } catch (uploadErr) {
          console.warn('Customer member card upload error:', uploadErr);
        }
      }

      const skinAnalysis = analyzeSkinIssue(newCustomerForm.issue);
      const isVip = Boolean(newCustomerForm.isVipUpgrade || newCustomerForm.hasMemberCard || newCustomerForm.memberCardNo || uploadedMemberCardUrl);

      const docData = { 
        "ชื่อ": computedName, 
        "เบอร์โทร": cleanPhone, 
        computedName: computedName,
        computedPhone: cleanPhone,
        firstName: newCustomerForm.firstName || computedName.split(' ')[0] || '',
        lastName: newCustomerForm.lastName || computedName.split(' ')[1] || '',
        nickname: newCustomerForm.nickname || '',
        gender: newCustomerForm.gender || 'หญิง',
        dob: newCustomerForm.dob || '',
        age: newCustomerForm.age || '',
        citizenId: newCustomerForm.citizenId || '',
        "เลขประจำตัวประชาชน": newCustomerForm.citizenId || '',
        idCard: newCustomerForm.citizenId || '',
        idCardUrl: uploadedIdCardUrl || '',
        idCardPhotoUrl: uploadedIdCardUrl || '',
        "ปัญหาผิวหน้า": String(newCustomerForm.issue || ''), 
        issue: String(newCustomerForm.issue || ''),
        imageUrl: uploadedPhotoUrl || '',
        photoUrl: uploadedPhotoUrl || '',
        customerPhoto: uploadedPhotoUrl || '',
        pictureUrl: uploadedPhotoUrl || '',
        linePictureUrl: uploadedPhotoUrl || '',
        aiSkinScanResult: newCustomerForm.aiSkinScanResult || null,
        aiEstimatedSkinAge: newCustomerForm.aiSkinScanResult?.estimatedSkinAge || null,
        aiSkinScores: newCustomerForm.aiSkinScanResult?.scores || null,
        aiRecommendedCourses: skinAnalysis ? skinAnalysis.courses.map(c => c.name) : [],
        aiCarePhase: skinAnalysis ? skinAnalysis.primaryPhase : '',
        aiRecommendation: skinAnalysis ? skinAnalysis.summaryText : '',
        addressNo: newCustomerForm.addressNo || '',
        subDistrict: newCustomerForm.subDistrict || '',
        district: newCustomerForm.district || '',
        province: newCustomerForm.province || '',
        zipcode: newCustomerForm.zipcode || '',
        "หมายเลขใบสะสม": `Irismember${Math.floor(1000 + Math.random()*9000)}`, 
        "ยอดสะสม": "0", 
        "สถานะสมาชิก": isVip ? "สมาชิกระดับ VIP" : "ยังไม่สะสมยอด",
        isApproved: isVip,
        hasMemberCard: isVip,
        isMemberDiscount: isVip,
        membershipCardNo: newCustomerForm.memberCardNo || '',
        memberCardPhotoUrl: uploadedMemberCardUrl || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(getCol('customers'), docData); 
      const createdCustomer = { id: docRef.id, ...docData };

      if (uploadedMemberCardUrl) {
        try {
          await addDoc(getCol('customer_documents'), {
            customerId: docRef.id,
            title: 'รูปถ่ายบัตรสมาชิก (จากแอป)',
            type: 'digital',
            fileUrl: uploadedMemberCardUrl,
            fileName: `membercard_${cleanPhone}.jpg`,
            notes: 'แนบจากการลงทะเบียนลูกค้าใหม่',
            createdAt: new Date()
          });
        } catch (docErr) {
          console.warn('Customer member card document create error:', docErr);
        }
      }

      // 🌟 บันทึกใบบันทึกประวัติลูกค้า IrisPatient ลงแฟ้มเอกสารอัตโนมัติ 🌟
      if (newCustomerForm.irisIntakeData) {
        try {
          const intake = newCustomerForm.irisIntakeData;
          await addDoc(getCol('customer_documents'), {
            customerId: docRef.id,
            title: intake.documentTitle || `ใบบันทึกประวัติลูกค้า (IrisPatient) - ${computedName}`,
            type: intake.archiveType || 'physical',
            physicalLocation: intake.physicalLocation || 'แฟ้มประวัติลูกค้า (IrisPatient2)',
            intakeData: intake,
            notes: `แนบจากการลงทะเบียนลูกค้าใหม่ (Ref: ${intake.refNo || 'IrisPatient2'})`,
            createdAt: new Date()
          });
        } catch (docErr) {
          console.warn('Customer IrisPatient document create error:', docErr);
        }
      }

      setIsAddCustomerOpen(false); 
      setNewCustomerForm({ 
        firstName: '', lastName: '', name: '', nickname: '',
        phone: '', gender: 'หญิง', dob: '', age: '', citizenId: '', issue: '',
        photoFile: null, photoPreview: null, photoBase64: null, aiSkinScanResult: null,
        idCardPhotoFile: null, idCardPhotoPreview: null, idCardPhotoBase64: null,
        addressNo: '', subDistrict: '', district: '', province: '', zipcode: '',
        isVipUpgrade: false, hasMemberCard: false, memberCardNo: '',
        memberCardPhotoFile: null, memberCardPhotoPreview: null, memberCardPhotoBase64: null,
        irisIntakeData: null
      }); 
      
      // Auto-select for POS!
      setPosPreselectedCustomer(createdCustomer);
      showToast(newCustomerForm.irisIntakeData ? 'เพิ่มลูกค้าใหม่และจัดเก็บประวัติ IrisPatient ลงแฟ้มเรียบร้อยแล้ว!' : 'เพิ่มลูกค้าใหม่และเลือกเข้าสู่ระบบเรียบร้อยแล้ว!', 'success'); 
    } catch (err) { 
      showToast(`ข้อผิดพลาด: ${err.message}`, 'error'); 
    } 
  };

  // 🌟 IrisPatient Intake Handlers 🌟
  const handleOpenIrisIntake = (targetCustomer = null, existingData = null, readOnly = false, caller = 'documents') => {
    setIrisIntakeCustomer(targetCustomer || selectedCustomer);
    setIrisIntakeInitialData(existingData);
    setIrisIntakeReadOnly(readOnly);
    setIrisIntakeCaller(caller);
    setIsIrisIntakeOpen(true);
  };

  const handleOpenIrisIntakeFromReg = () => {
    const fullName = `${newCustomerForm.firstName || ''} ${newCustomerForm.lastName || ''}`.trim() || newCustomerForm.name || '';
    const tempCust = {
      name: fullName,
      computedName: fullName,
      phone: newCustomerForm.phone,
      computedPhone: newCustomerForm.phone,
      dob: newCustomerForm.dob,
      age: newCustomerForm.age,
      citizenId: newCustomerForm.citizenId,
      address: [newCustomerForm.addressNo, newCustomerForm.subDistrict ? `ต.${newCustomerForm.subDistrict}` : '', newCustomerForm.district ? `อ.${newCustomerForm.district}` : '', newCustomerForm.province ? `จ.${newCustomerForm.province}` : '', newCustomerForm.zipcode].filter(Boolean).join(' '),
      issue: newCustomerForm.issue,
      branch: globalBranch ? `สาขา${globalBranch} เกาะสมุย จังหวัดสุราษฎร์ธานี` : 'สาขาเกาะสมุย จังหวัดสุราษฎร์ธานี'
    };
    handleOpenIrisIntake(tempCust, newCustomerForm.irisIntakeData, false, 'registration');
  };

  const handleSaveIrisIntake = async (intakeForm) => {
    if (irisIntakeCaller === 'registration') {
      setNewCustomerForm(prev => ({
        ...prev,
        irisIntakeData: intakeForm,
        firstName: prev.firstName || (intakeForm.name ? intakeForm.name.split(' ')[0] : ''),
        lastName: prev.lastName || (intakeForm.name ? intakeForm.name.split(' ').slice(1).join(' ') : ''),
        phone: intakeForm.phone || prev.phone,
        dob: intakeForm.dob || prev.dob,
        age: intakeForm.age || prev.age,
        issue: intakeForm.problemAreas || prev.issue
      }));
      showToast('บันทึกข้อมูลใบบันทึกประวัติลูกค้า IrisPatient เรียบร้อยแล้ว (จะถูกจัดเก็บเข้าแฟ้มเมื่อกดสร้างลูกค้า)', 'success');
      setIsIrisIntakeOpen(false);
      return;
    }

    const currentCust = irisIntakeCustomer || selectedCustomer;
    if (!currentCust) {
      showToast('ไม่พบข้อมูลลูกค้าสำหรับบันทึกเอกสาร', 'error');
      return;
    }

    try {
      await addDoc(getCol('customer_documents'), {
        customerId: currentCust.id,
        title: intakeForm.documentTitle || `ใบบันทึกประวัติลูกค้า (IrisPatient) - ${intakeForm.name}`,
        type: intakeForm.archiveType || 'physical',
        physicalLocation: intakeForm.physicalLocation || 'แฟ้มประวัติลูกค้า (IrisPatient2)',
        intakeData: intakeForm,
        notes: `บันทึกประวัติสุขภาพผิวและหนังสือยินยอม (Ref: ${intakeForm.refNo || 'IrisPatient2'})`,
        createdAt: new Date()
      });

      try {
        const custRef = doc(db, 'customers', currentCust.id);
        await updateDoc(custRef, {
          medicalHistory: intakeForm.underlyingDisease || 'ไม่มี',
          currentSkincare: intakeForm.currentProducts || 'ไม่มี',
          chemicalHistory: intakeForm.chemicalHistory || '',
          skinType: intakeForm.skinType || '',
          problemAreas: intakeForm.problemAreas || '',
          occupation: intakeForm.occupation || '',
          idLine: intakeForm.idLine || '',
          physicalFileRef: intakeForm.physicalLocation || '',
          lastIntakeDate: new Date().toLocaleDateString('th-TH'),
          updatedAt: serverTimestamp()
        });
      } catch (updErr) {
        console.warn('Customer profile update error:', updErr);
      }

      showToast('บันทึกใบบันทึกประวัติลูกค้าลงแฟ้มเอกสารเรียบร้อยแล้ว!', 'success');
      setIsIrisIntakeOpen(false);
    } catch (err) {
      showToast(`เกิดข้อผิดพลาดในการบันทึก: ${err.message}`, 'error');
    }
  };

  // 🌟 Document Storage Handlers 🌟
  const handleAddDocument = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    try {
      let fileUrl = '';
      let fileName = '';
      
      if (newDocumentForm.type === 'digital') {
          if (!documentFile) { showToast('โปรดเลือกไฟล์ก่อนบันทึก', 'error'); return; }
          setDocumentUploadProgress(10);
          const fileExt = documentFile.name.split('.').pop();
          fileName = `doc_${Date.now()}.${fileExt}`;
          const storageRef = ref(storage, `customer_documents/${selectedCustomer.id}/${fileName}`);
          
          const uploadTask = uploadBytesResumable(storageRef, documentFile);
          
          await new Promise((resolve, reject) => {
            uploadTask.on('state_changed', 
              (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setDocumentUploadProgress(Math.max(10, progress));
              }, 
              (error) => reject(error), 
              async () => {
                fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
                resolve();
              }
            );
          });
      }

      await addDoc(getCol('customer_documents'), {
        customerId: selectedCustomer.id,
        title: String(newDocumentForm.title),
        type: newDocumentForm.type,
        physicalLocation: newDocumentForm.type === 'physical' ? String(newDocumentForm.physicalLocation) : '',
        fileUrl,
        fileName,
        notes: String(newDocumentForm.notes),
        createdAt: new Date()
      });

      setIsAddDocumentOpen(false);
      setNewDocumentForm({ title: '', type: 'physical', physicalLocation: '', notes: '' });
      setDocumentFile(null);
      setDocumentUploadProgress(0);
      showToast('เพิ่มเอกสารสำเร็จ!');
    } catch (err) {
      showToast(`เกิดข้อผิดพลาด: ${err.message}`);
      setDocumentUploadProgress(0);
    }
  };

  const handleDeleteDocument = (docItem) => {
    setActionConfirmModal({ 
      isOpen: true, 
      title: 'ยืนยันลบเอกสาร', 
      message: `คุณแน่ใจหรือไม่ว่าต้องการลบเอกสาร "${docItem.title}" ? ข้อมูลจะไม่สามารถกู้คืนได้`, 
      action: async () => {
        try {
          if (docItem.type === 'digital' && docItem.fileName) {
            const storageRef = ref(storage, `customer_documents/${docItem.customerId}/${docItem.fileName}`);
            try { await deleteObject(storageRef); } catch(e) { console.warn("Failed to delete file from storage", e); }
          }
          await deleteDoc(getDocRef('customer_documents', docItem.id));
          showToast('ลบเอกสารสำเร็จ!');
        } catch (err) {
          showToast(`ข้อผิดพลาด: ${err.message}`);
        }
      }, 
      confirmText: 'ลบข้อมูล', 
      confirmColor: 'bg-red-500 hover:bg-red-600' 
    });
  };
  
  const handleEditCustomerSave = async (e) => {
      e.preventDefault();
      try {
          const computedName = `${editCustomerData.firstName || ''} ${editCustomerData.lastName || ''}`.trim() || String(editCustomerData.name || '').trim();
          const cleanPhone = String(editCustomerData.phone || '').trim().replace(/\D/g, '');

          if (!computedName) {
            showToast('กรุณาระบุชื่อลูกค้า', 'error');
            return;
          }
          if (!cleanPhone || cleanPhone.length < 9) {
            showToast('กรุณาระบุเบอร์โทรศัพท์ให้ถูกต้อง (9-10 หลัก)', 'error');
            return;
          }

          let uploadedPhotoUrl = editCustomerData.photoPreview || '';
          if (editCustomerData.photoFile) {
            try {
              const photoStorageRef = ref(storage, `customer_photos/${cleanPhone}_${Date.now()}.jpg`);
              await uploadBytes(photoStorageRef, editCustomerData.photoFile);
              uploadedPhotoUrl = await getDownloadURL(photoStorageRef);
            } catch (uploadErr) {
              console.warn('Customer photo upload error:', uploadErr);
            }
          }

          let uploadedIdCardUrl = editCustomerData.idCardPhotoPreview || '';
          if (editCustomerData.idCardPhotoFile) {
            try {
              const idCardStorageRef = ref(storage, `customer_id_cards/${cleanPhone}_${Date.now()}.jpg`);
              await uploadBytes(idCardStorageRef, editCustomerData.idCardPhotoFile);
              uploadedIdCardUrl = await getDownloadURL(idCardStorageRef);
            } catch (uploadErr) {
              console.warn('Customer ID card upload error:', uploadErr);
            }
          }

          let uploadedMemberCardUrl = editCustomerData.memberCardPhotoPreview || '';
          if (editCustomerData.memberCardPhotoFile) {
            try {
              const cardStorageRef = ref(storage, `customer_vip_cards/${cleanPhone}_${Date.now()}.jpg`);
              await uploadBytes(cardStorageRef, editCustomerData.memberCardPhotoFile);
              uploadedMemberCardUrl = await getDownloadURL(cardStorageRef);
              
              await addDoc(getCol('customer_documents'), {
                customerId: editCustomerData.id,
                title: 'รูปถ่ายบัตรสมาชิก (จากแอป)',
                type: 'digital',
                fileUrl: uploadedMemberCardUrl,
                fileName: `membercard_${cleanPhone}.jpg`,
                notes: 'แนบจากการแก้ไขข้อมูลลูกค้า / ส่งข้อมูลอัปเกรด VIP',
                createdAt: new Date()
              });
            } catch (cardErr) {
              console.warn('Member card upload error:', cardErr);
            }
          }

          const skinAnalysis = analyzeSkinIssue(editCustomerData.issue);
          const isVip = Boolean(editCustomerData.isVipUpgrade || editCustomerData.hasMemberCard || editCustomerData.memberCardNo || uploadedMemberCardUrl);

          const updateData = {
              "ชื่อ": computedName,
              "เบอร์โทร": cleanPhone,
              computedName: computedName,
              computedPhone: cleanPhone,
              firstName: editCustomerData.firstName || computedName.split(' ')[0] || '',
              lastName: editCustomerData.lastName || computedName.split(' ').slice(1).join(' ') || '',
              nickname: editCustomerData.nickname || '',
              gender: editCustomerData.gender || 'หญิง',
              dob: editCustomerData.dob || '',
              age: editCustomerData.age || '',
              citizenId: editCustomerData.citizenId || '',
              "เลขประจำตัวประชาชน": editCustomerData.citizenId || '',
              idCard: editCustomerData.citizenId || '',
              "ปัญหาผิวหน้า": String(editCustomerData.issue || ''),
              issue: String(editCustomerData.issue || ''),
              addressNo: editCustomerData.addressNo || '',
              subDistrict: editCustomerData.subDistrict || '',
              district: editCustomerData.district || '',
              province: editCustomerData.province || '',
              zipcode: editCustomerData.zipcode || '',
              aiRecommendedCourses: skinAnalysis ? skinAnalysis.courses.map(c => c.name) : [],
              aiCarePhase: skinAnalysis ? skinAnalysis.primaryPhase : '',
              aiRecommendation: skinAnalysis ? skinAnalysis.summaryText : '',
              updatedAt: serverTimestamp()
          };

          if (uploadedPhotoUrl) {
            updateData.imageUrl = uploadedPhotoUrl;
            updateData.photoUrl = uploadedPhotoUrl;
            updateData.customerPhoto = uploadedPhotoUrl;
          }
          if (uploadedIdCardUrl) {
            updateData.idCardUrl = uploadedIdCardUrl;
            updateData.idCardPhotoUrl = uploadedIdCardUrl;
          }
          if (editCustomerData.aiSkinScanResult) {
            updateData.aiSkinScanResult = editCustomerData.aiSkinScanResult;
            updateData.aiEstimatedSkinAge = editCustomerData.aiSkinScanResult.estimatedSkinAge || null;
            updateData.aiSkinScores = editCustomerData.aiSkinScanResult.scores || null;
          }
          if (isVip) {
            updateData["สถานะสมาชิก"] = "สมาชิกระดับ VIP";
            updateData.isApproved = true;
            updateData.hasMemberCard = true;
            updateData.isMemberDiscount = true;
            if (editCustomerData.memberCardNo) {
              updateData.membershipCardNo = editCustomerData.memberCardNo;
            }
            if (uploadedMemberCardUrl) {
              updateData.memberCardPhotoUrl = uploadedMemberCardUrl;
            }
          }

          await updateDoc(getDocRef('customers', editCustomerData.id), updateData);
          setIsEditCustomerOpen(false);
          showToast('อัปเดตข้อมูลลูกค้าและสิทธิประโยชน์สำเร็จ!', 'success');

          if (selectedCustomer && selectedCustomer.id === editCustomerData.id) {
              setSelectedCustomer(prev => ({
                ...prev,
                ...updateData,
                computedName: computedName,
                computedPhone: cleanPhone,
                computedIssue: editCustomerData.issue,
                computedMemberStatus: isVip ? "สมาชิกระดับ VIP" : prev.computedMemberStatus,
                isApproved: isVip ? true : prev.isApproved,
                hasMemberCard: isVip ? true : prev.hasMemberCard,
                membershipCardNo: editCustomerData.memberCardNo || prev.membershipCardNo
              }));
          }
      } catch (err) { 
        showToast(`ข้อผิดพลาด: ${err.message}`, 'error'); 
      }
  };


  const handleCreateCourse = async (e) => { e.preventDefault(); try { await addDoc(getCol('courses'), { "เบอร์โทร": String(newCourseForm.phone), "เลขที่ใบคอส": `IC${Date.now().toString().slice(-6)}`, "วันที่ซื้อ": new Date().toLocaleDateString('th-TH'), "ผู้ซื้อคอส": customersRaw.find(c => String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '') === String(newCourseForm.phone || '')) ? String(getFuzzyKey(customersRaw.find(c => String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '') === String(newCourseForm.phone || '')), ["ชื่อ", "col_1"])) : 'ลูกค้าทั่วไป', "ชื่อคอส": String(newCourseForm.name), "สาขาที่ซื้อ": String(newCourseForm.branch), "ราคา": String(newCourseForm.price || "0"), "เครดิตที่ได้รับ": String(newCourseForm.credit !== '' && newCourseForm.credit !== undefined ? newCourseForm.credit : "0"), "จำนวนครั้งที่ได้": String(newCourseForm.qty || "1"), "ยอดค้างชำระ": String(newCourseForm.pending || "0"), "ยอดชำระแล้วทั้งหมด": String(parseNumber(newCourseForm.price) - parseNumber(newCourseForm.pending)), "ครั้งที่ใช้": "0", "ครั้งที่เหลือดิบ": String(newCourseForm.qty || "1"), "สถานะ": "ยังคงเหลือ", "ประเภทการชำระ": parseNumber(newCourseForm.pending) > 0 ? "ผ่อนชำระ" : "จ่ายเต็ม" }); setIsAddCourseOpen(false); setNewCourseForm({ phone: '', name: '', qty: '1', price: '', credit: '', pending: '0', branch: globalBranch || 'เฉวง' }); showToast(`เปิดใบคอร์สใหม่สำเร็จ!`); } catch (err) { showToast('ข้อผิดพลาด: ' + err.message); } };
  
  const submitCourseBooking = async (e) => { 
      e.preventDefault(); 
      const courseName = String(getFuzzyKey(bookingCourse, ["ชื่อคอส", "col_8"]) || 'ใช้คอส');
      const duration = calculateBookingDuration(courseName, 1, bookingConfig);
      if (isSlotTaken(bookingDateTime, duration, bookingCourseBranch)) return showToast('เวลานี้มีลูกค้าจองคิวไว้แล้ว (คิวเต็ม) กรุณาเลือกเวลาอื่นครับ');
      try { 
          const cPhone = String(getFuzzyKey(bookingCourse, ["เบอร์โทร", "col_1"]) || '');
          const newBookingData = { 
              courseId: String(bookingCourse?.id || ''), 
              courseRef: String(getFuzzyKey(bookingCourse, ["เลขที่ใบคอส", "col_2"]) || ''), 
              courseName, 
              customerName: String(getFuzzyKey(bookingCourse, ["ผู้ซื้อคอส", "col_9"]) || ''), 
              customerPhone: cPhone, 
              cleanPhone: cPhone.replace(/\D/g, ''),
              dateTime: String(bookingDateTime), 
              date: String(bookingDateTime).split('T')[0] || '', 
              time: String(bookingDateTime).split('T')[1] || '', 
              branch: String(bookingCourseBranch), 
              guestsCount: 1,
              pax: 1,
              duration,
              status: 'ยืนยันแล้ว', 
              createdAt: new Date().toISOString() 
          }; 
          const lineUid = getBookingLineUid(newBookingData);
          if (lineUid) newBookingData.lineUid = lineUid;

          const docRef = await addDoc(getCol('bookings'), newBookingData); 
          if (lineUid && lineNotifConfig.bookingNotif !== false) {
              sendBookingLineNotification({ id: docRef.id, ...newBookingData }, 'ยืนยันแล้ว', lineUid)
                  .catch(e => console.warn('LINE notification error:', e));
          }

          setBookingCourse(null); 
          setBookingDateTime(''); 
          setBookingCourseBranch(globalBranch || 'เฉวง'); 
          showToast('จองคิวสำเร็จ ได้รับการยืนยันทันที'); 
      } catch (err) { showToast('ข้อผิดพลาด: ' + err.message); } 
  };
  
  const submitGeneralBooking = async (e) => { 
      e.preventDefault(); 
      const gCount = Math.min(3, Math.max(1, Number(generalBookingForm.guestsCount || 1)));
      const duration = calculateBookingDuration(generalBookingForm.service || 'บริการทั่วไป', gCount, bookingConfig);
      if (isSlotTaken(generalBookingForm.dateTime, duration, generalBookingForm.branch)) return showToast('เวลานี้มีลูกค้าจองคิวไว้แล้ว (คิวเต็ม) กรุณาเลือกเวลาอื่นครับ');
      try { 
          const isWalkIn = generalBookingForm.isWalkIn;
          const nowIso = new Date().toISOString();
          const cleanPhone = String(generalBookingForm.phone || '').replace(/\D/g, '');
          const newBookingData = { 
              courseId: '', 
              courseRef: '', 
              courseName: String(generalBookingForm.service || 'บริการทั่วไป'), 
              customerName: String(generalBookingForm.name), 
              customerPhone: String(generalBookingForm.phone), 
              cleanPhone,
              dateTime: String(generalBookingForm.dateTime), 
              date: String(generalBookingForm.dateTime).split('T')[0] || '', 
              time: String(generalBookingForm.dateTime).split('T')[1] || '', 
              branch: String(generalBookingForm.branch), 
              guestsCount: gCount,
              pax: gCount,
              duration,
              status: isWalkIn ? 'กำลังใช้บริการ' : 'ยืนยันแล้ว', 
              serviceStartTime: isWalkIn ? nowIso : null,
              createdAt: nowIso 
          }; 
          const lineUid = getBookingLineUid(newBookingData);
          if (lineUid) newBookingData.lineUid = lineUid;

          const docRef = await addDoc(getCol('bookings'), newBookingData); 
          if (lineUid && !isWalkIn && lineNotifConfig.bookingNotif !== false) {
              sendBookingLineNotification({ id: docRef.id, ...newBookingData }, 'ยืนยันแล้ว', lineUid)
                  .catch(e => console.warn('LINE notification error:', e));
          }

          setIsGeneralBookingOpen(false); 
          setGeneralBookingForm({ name: '', phone: '', service: '', dateTime: '', branch: globalBranch || 'เฉวง' }); 
          showToast(isWalkIn ? 'เพิ่มคิว Walk-in เข้าใช้บริการสำเร็จ' : 'เพิ่มคิวนัดหมายใหม่ (อนุมัติทันที) สำเร็จ'); 
      } catch (err) { showToast('ข้อผิดพลาด: ' + err.message); } 
  };

  const handleCheckInSubmit = async (e, inputData = null) => {
      e?.preventDefault(); 
      const todayStr = getLocalYYYYMMDD();
      const rawVal = inputData || checkInInput;
      if(!rawVal || !String(rawVal).trim()) return;
      
      const val = String(rawVal).trim().toUpperCase();
      
      // Try parse as JSON (Voucher scan)
      try {
          const parsed = JSON.parse(rawVal);
          if (parsed && parsed.type === 'voucher' && parsed.code) {
              setIsCheckInScannerOpen(false);
              setIsCheckInOpen(false);
              setActiveTab('pos');
              setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('scanVoucherFromOutside', { detail: { code: parsed.code, phone: parsed.phone } }));
              }, 500);
              return;
          }
      } catch (err) {}
      
      // ค้นหาคิวโดยไม่สนเงื่อนไขอื่นก่อน
      const found = bookings.find(b => { 
          const bPhone = String(b.customerPhone || '').trim().toUpperCase();
          const bId = String(b.id || '').trim().toUpperCase();
          const bTicket = String(b.ticketNo || '').trim().toUpperCase();
          return bPhone === val || bId === val || bTicket === val;
      });

      if (!found) {
          // 🌟 สแกน QR ใบคอร์ส (A4) แต่ไม่มีคิว → เปิด POS พร้อมเลือกลูกค้าให้ตัดคอร์สได้ทันที
          const valLower = String(rawVal).trim().toLowerCase();
          const scannedCourse = processedCourses.find(c => [getFuzzyKey(c, ["เลขที่ใบคอส", "col_2"]), c.courseRefKey, c.id]
              .map(v => String(v || '').trim().toLowerCase()).filter(Boolean).includes(valLower));
          if (scannedCourse) {
              const cPhone = String(getFuzzyKey(scannedCourse, ["เบอร์โทร", "col_1"]) || '').replace(/\D/g, '');
              const cust = customers.find(c => String(c.computedPhone || '').replace(/\D/g, '') === cPhone);
              if (cust) {
                  setCheckInInput('');
                  setIsCheckInScannerOpen(false);
                  setIsCheckInOpen(false);
                  setPosPreselectedCustomer(cust);
                  setActiveTab('pos');
                  showToast(`พบใบคอร์ส ${scannedCourse.courseRefKey || ''} ของ ${cust.computedName} — เปิด POS เพื่อตัดคอร์ส`);
                  return;
              }
          }
          showToast(`ไม่พบคิวนัดหมายที่ตรงกับข้อมูล: ${val}`);
          return;
      }

      // เช็คสถานะ
      const st = getBookingStatus(found);
      if (['กำลังใช้บริการ', 'เสร็จสิ้น', 'ยกเลิก'].includes(st)) {
          showToast(`เช็คอินไม่ได้: คิวนี้มีสถานะเป็น "${st}" ไปแล้ว`);
          return;
      }

      // เช็ควันที่ - ถ้าเป็นคิววันอื่น ให้เปลี่ยนวันที่เป็นวันนี้เลย (ทั้ง date และ dateTime)
      const dt = getSafeDateTime(found);
      const isToday = dt?.startsWith(todayStr);
      if (!isToday) {
          const timePart = dt && dt.includes('T') ? dt.split('T')[1] : '10:00';
          await updateDoc(getDocRef('bookings', found.id), {
              date: todayStr,
              dateTime: `${todayStr}T${timePart}`
          });
      }

      // ผ่านทุกเงื่อนไข
      await updateBookingStatus(found.id, 'กำลังใช้บริการ'); 
      setCheckInInput(''); 
      setIsCheckInOpen(false); 
      showToast(`เช็คอินสำเร็จ! ${!isToday ? '(รับคิวก่อนกำหนด) ' : ''}อัปเดตคิวของ ${found.customerName || 'ลูกค้า'} เป็น "กำลังใช้บริการ"`); 
  };
  
  const submitCreateOrder = async (e) => { e.preventDefault(); try { await addDoc(getCol('orders'), { ...newOrderForm, orderNo: `OD${Date.now().toString().slice(-6)}`, status: 'รอดำเนินการ', createdAt: new Date().toISOString() }); setIsAddOrderOpen(false); setNewOrderForm({ customerPhone: '', customerName: '', courseName: '', price: '', credit: '', qty: '1', branch: globalBranch || 'เฉวง' }); showToast('สร้างคำสั่งซื้อสำเร็จ รออนุมัติ'); } catch (err) { showToast('ข้อผิดพลาด: ' + err.message); } };
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const targetBr = normalizeBranchName(globalBranch || 'เฉวง') || 'เฉวง';
      const initialStock = Number(newProductForm.stock) || 0;
      await addDoc(getCol('products'), {
        "รหัส": String(newProductForm.code),
        "ชื่อสินค้า": String(newProductForm.name),
        "หมวดสินค้า": String(newProductForm.category),
        "หน่วยนับ": String(newProductForm.unit),
        "ราคาขายเต็ม": String(newProductForm.price),
        "ราคาสมาชิก": String(newProductForm.memberPrice),
        "จำนวนคงเหลือ": String(initialStock),
        stock_by_branch: { [targetBr]: initialStock },
        "รายละเอียดสินค้า": String(newProductForm.details || ''),
        "isStoreUseOnly": Boolean(newProductForm.isStoreUseOnly)
      });
      setIsAddProductOpen(false);
      setNewProductForm({ code: '', name: '', category: 'IRIS', unit: 'ชิ้น', price: '', memberPrice: '', stock: '0', details: '', isStoreUseOnly: false });
      showToast('เพิ่มสินค้าใหม่สำเร็จ');
    } catch (err) {
      showToast('ข้อผิดพลาด: ' + err.message);
    }
  };
  
  // --- CREDIT MANAGEMENT HANDLERS ---
  const handleAddCredit = async ({ amount, note }) => {
    try {
      await addDoc(getCol('courses'), { 
        "เบอร์โทร": selectedCustomer.computedPhone, 
        "เลขที่ใบคอส": `CR${Date.now().toString().slice(-6)}`, 
        "วันที่ซื้อ": new Date().toLocaleDateString('th-TH'), 
        "ผู้ซื้อคอส": selectedCustomer.computedName, 
        "ชื่อคอส": `เติมวงเงินเครดิต${note ? ` (${note})` : ''}`, 
        "สาขาที่ซื้อ": globalBranch || 'เฉวง', 
        "ราคา": String(amount), 
        "เครดิตที่ได้รับ": String(amount), 
        "จำนวนครั้งที่ได้": "1", 
        "ยอดค้างชำระ": "0", 
        "ยอดชำระแล้วทั้งหมด": String(amount), 
        "ครั้งที่ใช้": "0", 
        "ครั้งที่เหลือดิบ": "1", 
        "สถานะ": "ยังคงเหลือ", 
        "ประเภทการชำระ": "จ่ายเต็ม" 
      });
      setIsCreditModalOpen(false);
      showToast('เติมเครดิตสำเร็จ!');
    } catch (err) { showToast('ข้อผิดพลาด: ' + err.message); }
  };

  const handleTransferCredit = async ({ amount, destPhone, destName, note, sourceCourses }) => {
    try {
      let remainingToDeduct = amount;
      for (const course of sourceCourses) {
        if (remainingToDeduct <= 0) break;
        const available = course.computedRemainCredit || 0;
        if (available > 0) {
          const deductAmount = Math.min(available, remainingToDeduct);
          
          await addDoc(getCol('histories'), {
              courseId: course.id,
              "เลขที่ใบคอส": String(getFuzzyKey(course, ["เลขที่ใบคอส", "col_2"]) || '').trim(),
              "วันที่": new Date().toLocaleDateString('th-TH'),
              "เวลา": new Date().toLocaleTimeString('th-TH', { hour12: false, hour: '2-digit', minute: '2-digit' }),
              "ชื่อลูกค้า": selectedCustomer.computedName,
              "เบอร์โทร": selectedCustomer.computedPhone,
              "ประเภท": "ตัดคอร์ส",
              "สถานะ": "เรียบร้อย",
              "รายการ": `โอนเครดิตไปยัง ${destPhone} ${destName}${note ? ` (${note})` : ''}`,
              "ผู้ให้บริการ": "ระบบ",
              "ยอดเบิก": String(deductAmount),
              "ลายเซ็นพนักงาน": "ระบบ"
          });
          
          // ไม่ต้องแก้ "ยอดเบิกดิบ" ซ้ำ เพราะ processedCourses คำนวณรวมจาก histories ("ยอดเบิก") อยู่แล้ว
          remainingToDeduct -= deductAmount;
        }
      }

      await addDoc(getCol('courses'), { 
        "เบอร์โทร": String(destPhone), 
        "เลขที่ใบคอส": `TR${Date.now().toString().slice(-6)}`, 
        "วันที่ซื้อ": new Date().toLocaleDateString('th-TH'), 
        "ผู้ซื้อคอส": String(destName), 
        "ชื่อคอส": `รับโอนเครดิตจาก ${selectedCustomer.computedPhone} ${selectedCustomer.computedName}${note ? ` (${note})` : ''}`, 
        "สาขาที่ซื้อ": globalBranch || 'เฉวง', 
        "ราคา": "0", 
        "เครดิตที่ได้รับ": String(amount), 
        "จำนวนครั้งที่ได้": "1", 
        "ยอดค้างชำระ": "0", 
        "ยอดชำระแล้วทั้งหมด": "0", 
        "ครั้งที่ใช้": "0", 
        "ครั้งที่เหลือดิบ": "1", 
        "สถานะ": "ยังคงเหลือ", 
        "ประเภทการชำระ": "โอนเครดิต" 
      });

      setIsCreditModalOpen(false);
      showToast('โอนเครดิตสำเร็จ!');
    } catch (err) { showToast('ข้อผิดพลาด: ' + err.message); }
  };

  const handleDeductCredit = async ({ amount, note, sourceCourses }) => {
    try {
      let remainingToDeduct = amount;
      for (const course of sourceCourses) {
        if (remainingToDeduct <= 0) break;
        const available = course.computedRemainCredit || 0;
        if (available > 0) {
          const deductAmount = Math.min(available, remainingToDeduct);
          
          await addDoc(getCol('histories'), {
              courseId: course.id,
              "เลขที่ใบคอส": String(getFuzzyKey(course, ["เลขที่ใบคอส", "col_2"]) || '').trim(),
              "วันที่": new Date().toLocaleDateString('th-TH'),
              "เวลา": new Date().toLocaleTimeString('th-TH', { hour12: false, hour: '2-digit', minute: '2-digit' }),
              "ชื่อลูกค้า": selectedCustomer.computedName,
              "เบอร์โทร": selectedCustomer.computedPhone,
              "ประเภท": "ตัดคอร์ส",
              "สถานะ": "เรียบร้อย",
              "รายการ": `หักลดเครดิต: ${note}`,
              "ผู้ให้บริการ": "ระบบ",
              "ยอดเบิก": String(deductAmount),
              "ลายเซ็นพนักงาน": "ระบบ"
          });
          
          // ไม่ต้องแก้ "ยอดเบิกดิบ" ซ้ำ เพราะ processedCourses คำนวณรวมจาก histories ("ยอดเบิก") อยู่แล้ว
          remainingToDeduct -= deductAmount;
        }
      }
      setIsCreditModalOpen(false);
      showToast('หักลดเครดิตสำเร็จ!');
    } catch (err) { showToast('ข้อผิดพลาด: ' + err.message); }
  };

  const handleSearchCustomerForTransfer = (phone) => {
    const cleanPhone = (p) => String(p || '').replace(/\D/g, '');
    const found = customers.find(c => cleanPhone(c.computedPhone || getFuzzyKey(c, ["เบอร์โทร", "col_3"])) === cleanPhone(phone));
    return Promise.resolve(found || null);
  };

  const handleAddCourse = async (courseData, editingId = null) => {
    try {
      const isPos = Boolean(courseData.isPOSCourse || editingMasterCourse?.isPOSCourse || products.some(p => p.id === editingId));
      const targetCol = isPos ? 'products' : 'master_courses';

      const payload = {
        "รหัสคอส": courseData.code,
        "col_1": courseData.code,
        "รหัส": courseData.code,
        "ชื่อคอส": courseData.name,
        "col_4": courseData.name,
        "ชื่อสินค้า": courseData.name,
        "col_2": courseData.name,
        "ราคาขาย": courseData.price,
        "col_5": courseData.price,
        "ราคา": courseData.price,
        "col_6": courseData.price,
        "ราคาขายเต็ม": courseData.price,
        "หมวดสินค้า": courseData.category || 'โปรโมชั่น',
        "ประเภท": courseData.category || 'โปรโมชั่น',
        "เครดิตที่ได้รับ": courseData.credit || '0',
        "col_8": courseData.credit || '0',
        "จำนวนครั้ง": courseData.sessions || '1',
        "col_7": courseData.sessions || '1',
        "กำหนดเวลา": courseData.duration || '',
        "รายการที่ได้รับ": `${courseData.products ? 'สินค้าที่ได้รับ:\n' + courseData.products + '\n\n' : ''}${courseData.subCourses ? 'คอร์สย่อย/เสริม:\n' + courseData.subCourses : ''}`,
        "col_11": `${courseData.products ? 'สินค้าที่ได้รับ:\n' + courseData.products + '\n\n' : ''}${courseData.subCourses ? 'คอร์สย่อย/เสริม:\n' + courseData.subCourses : ''}`,
        "ฟรีบัตรสมาชิก": courseData.freeVip ? 'ใช่' : 'ไม่ใช่',
        "วันที่สิ้นสุด": courseData.endDate || '',
        "วันหมดเขต": courseData.endDate || '',
        "expireDate": courseData.endDate || '',
        "col_10": courseData.endDate || '',
        "รูปภาพ": courseData.image || '',
        "image": courseData.image || '',
        "col_13": courseData.image || '',
        "promoOptions": Array.isArray(courseData.promoOptions) ? courseData.promoOptions : [],
        "isNewSystem": true,
        "isAvailableInShop": true,
        "source": "new_system",
        "updatedAt": new Date().toISOString()
      };

      if (editingId) {
        await setDoc(getDocRef(targetCol, editingId), payload, { merge: true });
        showToast('แก้ไขคอร์สโปรโมชั่นสำเร็จ');
      } else {
        payload.createdAt = new Date().toISOString();
        await addDoc(getCol('master_courses'), payload);
        showToast('เพิ่มคอร์สโปรโมชั่นสำเร็จ');
      }
    } catch (err) {
      showToast('ข้อผิดพลาด: ' + err.message);
      throw err;
    }
  };

  const handleDirectCourseImageUpload = async (mc, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }
    showToast('กำลังอัปโหลดรูปภาพคอร์ส...');
    try {
      const compressedBlob = await compressImage(file, 1200, 1200, 0.85);
      const storageRef = ref(storage, `master_courses/${mc.id || Date.now()}_${Date.now()}.jpg`);
      await uploadBytes(storageRef, compressedBlob);
      const downloadURL = await getDownloadURL(storageRef);

      const isPos = Boolean(mc.isPOSCourse || products.some(p => p.id === mc.id));
      const targetCol = isPos ? 'products' : 'master_courses';

      await setDoc(getDocRef(targetCol, mc.id), {
        "รูปภาพ": downloadURL,
        "image": downloadURL,
        "col_13": downloadURL,
        "updatedAt": new Date().toISOString()
      }, { merge: true });
      showToast('อัปโหลดรูปภาพคอร์สสำเร็จ!');
    } catch (err) {
      console.error(err);
      showToast('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: ' + err.message);
    }
  };

  const handleRemoveCourseImage = async (mc) => {
    try {
      const isPos = Boolean(mc.isPOSCourse || products.some(p => p.id === mc.id));
      const targetCol = isPos ? 'products' : 'master_courses';

      await setDoc(getDocRef(targetCol, mc.id), {
        "รูปภาพ": "",
        "image": "",
        "col_13": "",
        "updatedAt": new Date().toISOString()
      }, { merge: true });
      showToast('ลบรูปภาพคอร์สสำเร็จ');
    } catch (err) {
      showToast('เกิดข้อผิดพลาด: ' + err.message);
    }
  };
  const handleImageUpload = async (historyId, field, file) => { if (!file) return; const reader = new FileReader(); reader.onloadend = async () => { try { await updateDoc(getDocRef('histories', historyId), { [field]: reader.result }); showToast('อัปโหลดรูปภาพสำเร็จ'); } catch(e) { showToast('อัปโหลดล้มเหลว: ' + e.message); } }; reader.readAsDataURL(file); };
  const handlePrintView = () => { setIsPrintMode(true); };

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
                                      {(() => {
                                          const rawAction = String(getFuzzyKey(h, ["รายการ", "สินค้า", "col_23", "col_18"]) || '');
                                          const displayAction = (rawAction === 'ตัดคอร์สผ่านระบบ POS' && Array.isArray(h.usedServices) && h.usedServices.length > 0)
                                              ? h.usedServices.join(', ')
                                              : (rawAction || (isAdd ? 'อัพคอร์ส' : 'ตัดคอร์ส'));
                                          return (
                                              <>
                                                  <div className="font-black text-gray-800 text-sm mb-2 leading-relaxed">{displayAction}</div>
                                                  {Array.isArray(h.usedServices) && h.usedServices.length > 0 && displayAction !== h.usedServices.join(', ') && (
                                                      <div className="flex flex-wrap gap-1 mb-2">
                                                          {h.usedServices.map((srv, sIdx) => (
                                                              <span key={sIdx} className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-md font-medium border border-teal-100">
                                                                  {srv}
                                                              </span>
                                                          ))}
                                                      </div>
                                                  )}
                                              </>
                                          );
                                      })()}
                                      <div className="flex flex-wrap items-center gap-1.5">
                                          {isFree ? (
                                              <span className="text-[10px] bg-rose-50 text-rose-600 px-2.5 py-0.5 rounded-md font-bold border border-rose-100 shadow-sm">ไม่หักยอด</span>
                                          ) : isAdd ? (
                                              <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-md font-bold border border-emerald-100 shadow-sm">+{extractHistoryQty(h)} ครั้ง</span>
                                          ) : (
                                              <span className="text-[10px] bg-white text-gray-600 px-2.5 py-0.5 rounded-md font-bold border border-gray-200 shadow-sm">หัก {extractHistoryQty(h)} ครั้ง</span>
                                          )}
                                          {(() => {
                                              const bPhotos = h.customerPhotos?.before || h.beforePhotos || [];
                                              const aPhotos = h.customerPhotos?.after || h.afterPhotos || (h.customerPhoto ? [h.customerPhoto] : []);
                                              const hasPhotos = (Array.isArray(bPhotos) && bPhotos.length > 0) || (Array.isArray(aPhotos) && aPhotos.length > 0);
                                              if (!hasPhotos) return null;
                                              return (
                                                  <button
                                                      type="button"
                                                      onClick={() => setSelectedHistoryForPhotos(h)}
                                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition-colors shadow-2xs"
                                                  >
                                                      <Camera size={11} /> ดูรูปก่อน-หลัง
                                                  </button>
                                              );
                                          })()}
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
      <CoursePrintModal
        isOpen
        courses={coursesToRender}
        masterCourses={masterCourses}
        shopName={appSettings?.shopName || 'IrisCare Clinic'}
        onBack={() => { setIsPrintMultiCourseMode(false); setIsSelectCoursesToPrintOpen(true); }}
        onClose={() => setIsPrintMultiCourseMode(false)}
      />
    );
  }

  if (isPrintMode && selectedCustomer) {
    return (
       <MemberCardPrintModal
         isOpen={isPrintMode}
         customer={selectedCustomer}
         products={products}
         orders={orders}
         shopName={appSettings?.shopName || 'IrisCare Clinic'}
         globalBranch={globalBranch || 'สาขาเฉวง'}
         onClose={() => setIsPrintMode(false)}
       />
    );
  }

  if (isPrintSingleCourseMode && selectedCourse) {
    // 🌟 ใบคอร์ส A4 + QR + ช่องว่างครบตามจำนวนครั้ง (ใช้ได้ทั้งออนไลน์และกระดาษ)
    return (
      <CoursePrintModal
        isOpen
        courses={[selectedCourse]}
        masterCourses={masterCourses}
        shopName={appSettings?.shopName || 'IrisCare Clinic'}
        onBack={() => setIsPrintSingleCourseMode(false)}
        onClose={() => setIsPrintSingleCourseMode(false)}
      />
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
                           <tr key={i} className="hover:bg-gray-50 border-b border-gray-200">
                               <td className="border border-gray-300 p-2 font-mono text-xs">{c.courseRefKey || String(getFuzzyKey(c, ["เลขที่ใบคอส", "col_2"]) || c.id.substring(0, 7))}</td>
                               <td className="border border-gray-300 p-2 font-medium">{c.computedCustomerName || String(getFuzzyKey(c, ["ผู้ซื้อคอส", "ชื่อลูกค้า", "ชื่อ", "col_9"]) || '-')}</td>
                               <td className="border border-gray-300 p-2 font-medium">{c.computedCourseName || String(getFuzzyKey(c, ["ชื่อคอส", "ชื่อคอร์ส", "col_8"]) || '-')}</td>
                               <td className="border border-gray-300 p-2 text-center">{c.computedTotalQty}</td>
                               <td className="border border-gray-300 p-2 text-center">{c.computedUsedQty}</td>
                               <td className="border border-gray-300 p-2 text-center font-bold text-teal-600">{c.computedRemainQty}</td>
                               <td className="border border-gray-300 p-2 text-center">{c.computedRemainCredit ? Number(c.computedRemainCredit).toLocaleString() : '0'}</td>
                               <td className="border border-gray-300 p-2 text-center">{c.computedStatus || String(getFuzzyKey(c, ["สถานะ", "col_7"]) || '-')}</td>
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

  // Branch Selection Modal for POS
  const handlePosAccess = () => {
    // 🌟 เจ้าของร้าน: เข้า POS ได้เลย (เลือกสาขาก่อนถ้ายังไม่เลือก)
    if (globalRole === 'owner') {
      if (!globalBranch) { setShowBranchSelectForPos(true); return; }
      localStorage.setItem('userRole', 'owner');
      setActiveTab('pos');
      return;
    }
    // 🌟 พนักงาน: ต้องมี "ตัวตน" ก่อนเสมอ — ยังไม่มี → เลือกตัวเอง + PIN แล้วระบบพาเข้า POS เอง
    if (!activeStaff) {
      posAfterIdentity.current = true;
      setAttendanceMode('select');
      setShowFrontAttendance(true);
      return;
    }
    if (!globalBranch) { setShowBranchSelectForPos(true); return; }
    localStorage.setItem('selectedBranch', globalBranch);
    localStorage.setItem('userRole', globalRole || 'staff');
    setActiveTab('pos');
  };

  const handleSelectBranchForPos = (branch) => {
    if (branch.passcode) {
      setShowBranchSelectForPos(false);
      setBranchPasscodeModal({ isOpen: true, branch, passcode: '' });
    } else {
      localStorage.setItem('selectedBranch', branch.name);
      localStorage.setItem('userRole', 'staff');
      setGlobalBranch(branch.name);
      setGlobalRole('staff');
      setShowBranchSelectForPos(false);
      setActiveTab('pos');
    }
  };

  const handleBranchPasscodeSubmit = (e) => {
    e.preventDefault();
    if (branchPasscodeModal.passcode === branchPasscodeModal.branch.passcode) {
      localStorage.setItem('selectedBranch', branchPasscodeModal.branch.name);
      localStorage.setItem('userRole', 'staff');
      setGlobalBranch(branchPasscodeModal.branch.name);
      setGlobalRole('staff');
      setBranchPasscodeModal({ isOpen: false, branch: null, passcode: '' });
      setActiveTab('pos');
    } else {
      showToast('รหัสผ่านไม่ถูกต้อง');
    }
  };

  const handleOwnerLoginSubmit = (e) => {
    e.preventDefault();
    const masterPasscode = appSettings?.masterPasscode || '999999';
    if (ownerPasscode === masterPasscode) {
      localStorage.setItem('userRole', 'owner');
      setGlobalRole('owner');
      setOwnerPasscode('');
      setShowOwnerLogin(false);
      showToast('เข้าสู่ระบบเจ้าของร้านสำเร็จ');
    } else {
      showToast('รหัสผ่านไม่ถูกต้อง');
    }
  };
  
  if (isJobApplicationMode) {
    return <JobApplicationForm branches={branches} />;
  }
  
  if (customerBedSession) {
    return (
      <>
        {/* Notifications */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 bg-gray-900/90 text-white px-6 py-3.5 rounded-2xl shadow-2xl z-[999999] flex items-center animate-in slide-in-from-bottom-5">
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
        <CustomerBedSession 
           bedNumber={customerBedSession.bed} 
           branch={customerBedSession.branch}
           products={products}
           masterCourses={masterCourses}
           bookings={bookings}
           orders={orders}
           showToast={triggerToast}
        />
      </>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full bg-gray-50 overflow-hidden print:overflow-visible print:h-auto font-sans text-gray-900">
      {/* 🌟 หน้าล็อกอินแอดมิน (เต็มจอ บังทุกอย่างจนกว่าจะเข้าสู่ระบบ) */}
      {loginGate && (
        <AdminLoginPage
          branches={branches}
          appSettings={appSettings}
          initialBranch={globalBranch}
          employees={employees}
          attendance={employeeAttendance}
          onOpenAttendance={(b, emp) => { 
            posAfterIdentity.current = false;
            setGlobalBranch(b); 
            setInitialEmployeeForAttendance(emp || null);
            setShowFrontAttendance(true); 
          }}
          onStaffEnter={handleStaffLoginGate}
          onOwnerEnter={handleOwnerLoginGate}
          dailySales={dailySales}
          onQuickEod={handleQuickEodLoginGate}
          onOpenMoleService={handleOpenMoleFromLogin}
          onStaffLoginSuccess={handleStaffDirectLogin}
          flashMessage={loginFlash}
        />
      )}
      {/* Notifications */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-gray-900/90 text-white px-6 py-3.5 rounded-2xl shadow-2xl z-[999999] flex items-center animate-in slide-in-from-bottom-5">
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

      {/* 🌟 จุดสีแสดงสถานะการซิงค์ข้อมูลมุมขวาบน (Mobile / Floating Top-Right Sync Dot) 🌟 */}
      {activeTab !== 'pos' && (
        <div 
          onClick={() => triggerToast(
            isCloudLoading 
              ? `กำลังซิงค์ข้อมูล Cloud (${loadingProgress}%)` 
              : isDbConnected 
                ? 'ข้อมูลเชื่อมต่อและซิงค์เรียลไทม์กับ Cloud เรียบร้อยแล้ว' 
                : 'ระบบออฟไลน์ ขาดการเชื่อมต่อ Cloud',
            isCloudLoading ? 'info' : isDbConnected ? 'success' : 'error'
          )}
          className="lg:hidden fixed top-3 right-3 z-50 flex items-center cursor-pointer pointer-events-auto active:scale-95 transition-all print:hidden"
          title={
            isCloudLoading 
              ? `กำลังซิงค์ข้อมูล Cloud... (${loadingProgress}%)` 
              : isDbConnected 
                ? 'ซิงค์ข้อมูลเรียบร้อย (Cloud Online)' 
                : 'ขาดการเชื่อมต่อ Cloud'
          }
        >
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-sm backdrop-blur-md transition-all ${
            isCloudLoading 
              ? 'bg-amber-50/95 border-amber-200 text-amber-700' 
              : isDbConnected 
                ? 'bg-white/95 border-emerald-200 text-emerald-700 shadow-emerald-500/10' 
                : 'bg-rose-50/95 border-rose-200 text-rose-700'
          }`}>
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              {isCloudLoading ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </>
              ) : isDbConnected ? (
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]"></span>
              ) : (
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 animate-pulse"></span>
              )}
            </span>
            {isCloudLoading && (
              <span className="text-[9px] font-bold text-amber-700 font-mono">
                {loadingProgress}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* Sidebar (Desktop Only) */}
      <aside className={`hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 bg-white/95 backdrop-blur-xl border-r border-gray-200 z-40`}>
        <div className="h-20 flex items-center px-6 border-b border-gray-100 shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-teal-500/30"><Sparkles size={20} className="text-white" /></div>
          <div><span className="text-xl font-black tracking-wide block leading-none">IrisCare</span><span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Clinic System</span></div>
        </div>
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} id="dashboard" icon={Home} label="แดชบอร์ด" />
          <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} id="pos" icon={ScanLine} label="ระบบ POS" onClick={handlePosAccess} />
          <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} id="course_deduction" icon={Scissors} label="ตัดคอร์สบริการ" />
          <SidebarItem activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); if(t === "bookings") setFilterBookingStatus("today_upcoming"); }} setSidebarOpen={setSidebarOpen} id="bookings" icon={Calendar} label="ตารางนัดหมาย" badge={bookingStats.badgeCount} />
          <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} id="calendar_dashboard" icon={CalendarDays} label="ปฏิทินวันหยุดและคิวจอง" />
          <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} id="orders" icon={ShoppingCart} label="คำสั่งซื้อ" badge={orderStats.pending} />
          <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} id="masterCourses" icon={Layers} label="คอร์สโปรโมชั่น" />
          <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} id="promotions" icon={Tag} label="จัดการโปรโมชั่น (POS)" />
          <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} id="marketing_promos" icon={Sparkles} label="แบนเนอร์โปรโมชั่น" />
          <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} id="coupons" icon={Ticket} label="จัดการคูปอง" />
          <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} id="gamification" icon={Gift} label="กิจกรรมลุ้นโชค" />
          <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} id="products" icon={Package} label="คลังสินค้า" />
          <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} id="courses" icon={FileText} label="ใบคอร์สลูกค้า" />
          <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} id="customers" icon={Users} label="ฐานลูกค้า" />
          <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} id="mole_removal" icon={Sparkles} label="ระบบจี้ไฝ" />
          <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} id="histories" icon={HistoryIcon} label="ประวัติบริการ" />
          {globalRole === 'owner' && (
             <>
                <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} id="employees" icon={UserCheck} label="จัดการพนักงาน" />
                <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} id="financials" icon={BarChart3} label="บัญชีการเงิน" />
                <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} id="settings" icon={Settings} label="ตั้งค่าระบบ" />
             </>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col h-[100dvh] min-w-0 transition-all duration-300 lg:ml-64 relative overflow-hidden print:overflow-visible print:h-auto ${activeTab === 'pos' ? 'pb-0' : 'pb-16 lg:pb-0'}`}>
        <header className="hidden lg:flex h-20 bg-white/80 backdrop-blur-md border-b border-gray-200 items-center justify-between px-8 z-30 sticky top-0 shrink-0 shadow-sm print:hidden">
          <div className="flex items-center">
            <h1 className="text-lg lg:text-2xl font-black text-gray-800 tracking-tight flex items-center">
              {activeTab === 'dashboard' && 'แดชบอร์ดสรุปผล'}{activeTab === 'promotions' && 'จัดการโปรโมชั่น'}{activeTab === 'pos' && 'ระบบ POS (จุดขาย)'}{activeTab === 'bookings' && 'ตารางนัดหมาย (คิว)'}{activeTab === 'orders' && 'คำสั่งซื้อ / อนุมัติคอร์ส'}{activeTab === 'masterCourses' && 'รายการคอร์สโปรโมชั่น'}{activeTab === 'products' && 'คลังสินค้า'}{activeTab === 'courses' && 'จัดการใบคอร์สลูกค้า'}{activeTab === 'customers' && 'ระบบฐานลูกค้า'}{activeTab === 'mole_removal' && 'ระบบจี้ไฝ'}{activeTab === 'histories' && 'ประวัติการใช้บริการ'}{activeTab === 'employees' && 'ระบบพนักงาน'}{activeTab === 'financials' && 'บัญชีการเงิน'}{activeTab === 'settings' && 'การตั้งค่าระบบ'}{activeTab === 'gamification' && 'กิจกรรมแจกรางวัล'}{activeTab === 'calendar_dashboard' && 'ปฏิทินวันหยุดและคิวจอง'}
            </h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4 relative">
            {clockedInEmployees.length > 0 && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg">
                <span className="text-[10px] font-bold text-emerald-600 mr-1">ทีมงานวันนี้:</span>
                {clockedInEmployees.map(emp => (
                  <span key={emp.id} className="text-[10px] font-bold bg-white text-emerald-700 px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                    {emp.name} <span className="text-emerald-500 font-normal border-l border-emerald-100 pl-1"><LiveTimer startTime={emp.clockInTime} /></span>
                  </span>
                ))}
              </div>
            )}
            <button 
              onClick={() => { localStorage.removeItem('selectedBranch'); setGlobalBranch(null); }}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-bold transition-colors border border-indigo-100"
              title="เปลี่ยนสาขา"
            >
              <Store size={16} /> {globalBranch}
            </button>
            <div className="relative shrink-0">
               <button onClick={() => setIsNotificationOpen(!isNotificationOpen)} className="p-2 relative text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-colors">
                  <Bell size={20} />
                  {totalPendingCount > 0 && (<><span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm z-10"></span><span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-400 rounded-full animate-ping z-0"></span></>)}
               </button>
               {isNotificationOpen && (
                 <>
                   <div className="fixed inset-0 z-40" onClick={() => setIsNotificationOpen(false)}></div>
                   <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                     <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                       <h3 className="font-black text-gray-800">การแจ้งเตือน</h3>
                       <div className="flex items-center gap-2">
                         {totalPendingCount > 0 && <span className="text-[10px] font-bold bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">{totalPendingCount} รายการ</span>}
                         <button onClick={() => { setIsNotificationOpen(false); setActiveTab('settings'); }} className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors" title="ตั้งค่าการแจ้งเตือน"><Settings size={16} /></button>
                       </div>
                     </div>
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
            {/* 🌟 จุดสีแสดงสถานะการซิงค์ข้อมูลมุมขวาบน (Desktop Top-Right Sync Dot) 🌟 */}
            <div 
              onClick={() => triggerToast(
                isCloudLoading 
                  ? `กำลังซิงค์ข้อมูล Cloud (${loadingProgress}%)` 
                  : isDbConnected 
                    ? 'ข้อมูลเชื่อมต่อและซิงค์เรียลไทม์กับ Cloud เรียบร้อยแล้ว' 
                    : 'ระบบออฟไลน์ ขาดการเชื่อมต่อ Cloud',
                isCloudLoading ? 'info' : isDbConnected ? 'success' : 'error'
              )}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold border shadow-2xs shrink-0 transition-all cursor-pointer ${
                isCloudLoading 
                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
                  : isDbConnected 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                    : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
              }`}
              title={
                isCloudLoading 
                  ? `กำลังซิงค์ข้อมูล Cloud... (${loadingProgress}%)` 
                  : isDbConnected 
                    ? 'ซิงค์ข้อมูลเรียบร้อย (Cloud Online)' 
                    : 'ขาดการเชื่อมต่อ Cloud (Offline)'
              }
            >
               <span className="relative flex h-2.5 w-2.5 shrink-0">
                 {isCloudLoading ? (
                   <>
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                   </>
                 ) : isDbConnected ? (
                   <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]"></span>
                 ) : (
                   <>
                     <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                   </>
                 )}
               </span>
               <span>{isCloudLoading ? `ซิงค์ ${loadingProgress}%` : isDbConnected ? 'ซิงค์แล้ว' : 'ออฟไลน์'}</span>
            </div>
            <div className="flex bg-white/80 shadow-sm rounded-xl p-1.5 border border-gray-100 shrink-0">
               {uploadButtons.map((btn, idx) => {
                 const Icon = btn.icon;
                 return (
                 <React.Fragment key={idx}>
                   <button onClick={() => btn.ref.current?.click()} className={`flex items-center px-3 py-2 rounded-lg text-xs font-bold text-gray-600 transition-colors ${btn.hover}`} title={btn.label}><Icon size={14} className="mr-1"/><span className="hidden xl:inline">{btn.label}</span></button>
                   <input type="file" accept=".csv" className="hidden" ref={btn.ref} onChange={(e) => handleCSVUpload(e, btn.type)} />
                   {idx < uploadButtons.length - 1 && <div className="w-px bg-gray-200 mx-1"></div>}
                 </React.Fragment>
               )})}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto print:overflow-visible print:h-auto p-4 sm:p-6 lg:p-8 w-full relative z-10">
          
        {/* --- PROMOTIONS TAB --- */}
        {activeTab === 'promotions' && (
          <PromotionManager 
             products={products} 
             masterCourses={masterCourses} 
             promotions={promotions}
             showToast={showToast} 
          />
        )}

        {/* --- COUPONS TAB --- */}
        {activeTab === 'coupons' && (
          <CouponManager 
             showToast={showToast} 
             customers={customers}
             products={products}
             masterCourses={masterCourses}
          />
        )}

        {/* --- MARKETING PROMOS TAB --- */}
        {activeTab === 'marketing_promos' && (
          <MarketingPromoManager 
             showToast={showToast} 
          />
        )}

        {/* --- GAMIFICATION TAB --- */}
        {activeTab === 'gamification' && (
          <GamificationManager 
             showToast={showToast} 
             customers={customers}
          />
        )}

          {activeTab === 'pos' && (
            <ErrorBoundary>
            <POSSystem 
              products={products}
              branches={branches}
              promotions={promotions}
              masterCourses={allMasterCourses}
              customers={customers}
              courses={processedCourses}
              histories={histories}
              bookings={bookings}
              orders={orders}
              dailySales={dailySales}
              showToast={triggerToast}
              globalBranch={globalBranch}
              globalRole={globalRole}
              appSettings={appSettings}
              employees={employees}
              employeeAttendance={employeeAttendance}
              clockedInEmployees={clockedInEmployees}
              wooImagesMap={wooImagesMap}
              wooIdMap={wooIdMap}
              activeServices={activeServices}
              onOpenVipForm={(customer) => {
                 setSelectedCustomer(customer);
                 setIsVipFormOpen(true);
              }}
              onChangeBranch={() => {
                localStorage.removeItem('selectedBranch');
                setGlobalBranch(null);
              }}
              onViewCustomerProfile={(rawCustomer) => {
                const processed = customers.find(c => c.id === rawCustomer.id);
                setSelectedCustomer(processed || rawCustomer);
                setActiveTab('customers');
              }}
              posPreselectedCustomer={posPreselectedCustomer}
              clearPosPreselectedCustomer={() => setPosPreselectedCustomer(null)}
              posPreselectedUsageCourses={posPreselectedUsageCourses}
              clearPosPreselectedUsageCourses={() => setPosPreselectedUsageCourses([])}
              posPreselectedBeforePhotos={posPreselectedBeforePhotos}
              posPreselectedStaffName={posPreselectedStaffName}
              activeStaff={activeStaff}
              posReturnToStaffAfterCheckout={posReturnToStaffAfterCheckout}
              onReturnToStaffDashboard={handleReturnToStaffDashboard}
              onGoToLogin={() => setShowBranchSelectForPos(true)}
              onGoBack={() => setActiveTab('dashboard')}
              onAddCustomer={() => setIsAddCustomerOpen(true)}
              autoOpenEod={posAutoOpenEod}
              onQuickEodFinished={handleQuickEodFinished}
              initialTab={posInitialTab}
              onClearInitialTab={() => setPosInitialTab(null)}
            />
            </ErrorBoundary>
          )}

          {activeTab === 'course_deduction' && (
            <CourseDeductionSystem
              customers={customers}
              courses={processedCourses}
              masterCourses={masterCourses}
              employees={employees}
              clockedInEmployees={clockedInEmployees}
              globalBranch={globalBranch}
              showToast={triggerToast}
              onGoBack={() => setActiveTab('dashboard')}
              histories={histories}
            />
          )}
          
          {/* STAFF DASHBOARD */}
          {activeTab === 'dashboard' && globalRole !== 'owner' && (
            <div className="flex flex-col h-full animate-in fade-in max-w-5xl mx-auto w-full px-2 sm:px-0">
               <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <div className="flex items-center gap-3">
                   {clockedInEmployees.length > 0 ? (
                <div className="flex -space-x-2">
                  {clockedInEmployees.slice(0, 3).map((emp, idx) => (
                    emp.profileImage ? (
                      <img key={emp.id} src={emp.profileImage} className="w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 border-white object-cover shadow-sm relative bg-white" style={{ zIndex: 3 - idx }} alt={emp.name} onError={(e) => { e.target.onerror = null; e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'; }} />
                    ) : (
                      <div key={emp.id} className="w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 border-white bg-slate-100 text-slate-400 flex items-center justify-center shadow-sm relative" style={{ zIndex: 3 - idx }}>
                        <User className="w-4 h-4 sm:w-6 sm:h-6" />
                      </div>
                    )
                  ))}
                       {clockedInEmployees.length > 3 && (
                         <div className="w-12 h-12 rounded-full border-2 border-white bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold shadow-sm relative z-0">
                           +{clockedInEmployees.length - 3}
                         </div>
                       )}
                     </div>
                   ) : (
                     <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shadow-inner border border-indigo-200">
                       <User size={24} />
                     </div>
                   )}
                   <div>
                     <h1 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight">
                       {globalRole === 'owner' ? '👑 เจ้าของร้าน' : clockedInEmployees.length > 0 ? `พนักงานเข้างาน ${clockedInEmployees.length} คน` : '👨‍💼 พนักงานระบบ'}
                     </h1>
                     <p className="text-sm text-gray-500 mt-0.5">สาขา {globalBranch || 'ทั้งหมด'} • วันที่ {new Date().toLocaleDateString('th-TH')}</p>
                   </div>
                 </div>
                 
                 <div className="flex gap-2">
                    {globalRole === 'owner' && (
                    <button
                      onClick={() => { setAttendanceMode('board'); setShowFrontAttendance(true); }}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-sm font-bold transition-colors border border-indigo-100 active:scale-95"
                    >
                      <Clock size={16} />
                      <span className="hidden sm:inline">บอร์ดลงเวลา</span>
                    </button>
                    )}
                    <button
                      onClick={() => { setShowOwnerLogin(true); setOwnerPasscode(''); }}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-sm font-bold transition-colors border border-amber-100 active:scale-95"
                    >
                      <ShieldCheck size={16} />
                      <span className="hidden sm:inline">เจ้าของร้าน</span>
                    </button>
                    {activeStaff && (
                    <button
                      onClick={() => { posAfterIdentity.current = false; setInitialEmployeeForAttendance(null); setAttendanceMode('select'); setShowFrontAttendance(true); }}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-sm font-bold transition-colors border border-emerald-100 active:scale-95"
                      title="เปลี่ยนตัวตนผู้ใช้งาน"
                    >
                      <UserCheck size={16} />
                      <span className="hidden sm:inline">ผู้ใช้: {activeStaff.name}</span>
                    </button>
                    )}
                    <button onClick={() => { localStorage.removeItem('selectedBranch'); localStorage.removeItem('userRole'); localStorage.removeItem('admin_session_exp'); localStorage.removeItem('personalEmployeeId'); window.location.reload(); }} className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-sm font-bold transition-colors border border-rose-100 active:scale-95">
                      <LogOut size={16} /> <span className="hidden sm:inline">ออกจากระบบ</span>
                    </button>
                 </div>
               </div>

               {/* Quick Actions for Staff */}
               <div className="grid grid-cols-2 gap-3 mb-6">
                 <button onClick={() => {
                   posAfterIdentity.current = false;
                   setAttendanceMode('board');
                   const savedEmpId = localStorage.getItem('personalEmployeeId');
                   if (savedEmpId) {
                     const emp = employees.find(e => e.id === savedEmpId);
                     if (emp) {
                       setInitialEmployeeForAttendance(emp);
                     }
                   }
                   setShowFrontAttendance(true);
                 }} className="flex items-center justify-center gap-2 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold text-sm transition-colors active:scale-95 shadow-sm">
                   <User size={18} /> 
                   {(() => {
                     const savedEmpId = localStorage.getItem('personalEmployeeId');
                     const emp = savedEmpId ? employees.find(e => e.id === savedEmpId) : null;
                     return emp ? `แดชบอร์ด (${emp.name})` : 'แดชบอร์ดส่วนตัว';
                   })()}
                 </button>
                 <button onClick={() => { setActiveTab('bookings'); }} className="flex items-center justify-center gap-2 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl font-bold text-sm transition-colors active:scale-95">
                   <Calendar size={18} /> ปฏิทินนัดหมาย
                 </button>
               </div>
               
               {/* Today's Bookings for this branch */}
               <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                     <h2 className="text-sm font-black text-gray-800 flex items-center gap-2">
                        <Calendar className="text-indigo-500" size={16} /> 
                        คิวนัดหมายวันนี้ ({globalBranch || 'ทั้งหมด'})
                     </h2>
                  </div>
                  
                  <div className="flex overflow-x-auto gap-3 pb-2 snap-x custom-scrollbar">
                     {(() => {
                        const localToday = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
                        const todayBookings = bookings.filter(b => {
                           const isToday = b.date === localToday || (b.createdAt && b.createdAt.startsWith(localToday));
                           const isNotCancelled = b.status !== 'ยกเลิก' && b.status !== 'ยกเลิกโดยลูกค้า' && b.status !== 'ยกเลิกฉุกเฉิน';
                           const isMatchBranch = !globalBranch || b.branch === globalBranch;
                           return isToday && isNotCancelled && isMatchBranch;
                        }).sort((a,b) => (a.time || '').localeCompare(b.time || ''));

                        if (todayBookings.length === 0) {
                           return (
                              <div className="w-full py-6 text-center text-xs font-bold text-slate-400 bg-white/50 rounded-2xl border border-dashed border-slate-200">
                                 ไม่มีคิวนัดหมายในวันนี้
                              </div>
                           );
                        }

                        return todayBookings.map(b => (
                           <div key={b.id} onClick={() => { setActiveTab('bookings'); }} className="min-w-[200px] max-w-[200px] bg-white rounded-2xl p-4 border border-indigo-100 shadow-sm snap-start shrink-0 flex flex-col justify-between cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all active:scale-95">
                              <div>
                                 <div className="flex justify-between items-start mb-2">
                                    <div className="text-lg font-black text-slate-800">{b.time} น.</div>
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                       b.status === 'รอการยืนยัน' ? 'bg-amber-100 text-amber-700' :
                                       b.status === 'ยืนยันแล้ว' ? 'bg-emerald-100 text-emerald-700' :
                                       b.status === 'เสร็จสิ้น' ? 'bg-blue-100 text-blue-700' :
                                       'bg-slate-100 text-slate-700'
                                    }`}>
                                       {b.status || 'รอการยืนยัน'}
                                    </span>
                                 </div>
                                 <div className="flex items-center gap-1.5 truncate">
                                    <p className="text-xs font-bold text-slate-600 truncate">{b.customerName || b.customerPhone}</p>
                                    {Number(b.guestsCount || b.pax || 1) > 1 && (
                                       <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-black text-[9px] shrink-0">👥 {b.guestsCount || b.pax} ท่าน</span>
                                    )}
                                 </div>
                                 <p className="text-[10px] font-bold text-indigo-600 mt-1 line-clamp-2">{b.courseName}</p>
                              </div>
                              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                                 <BookingCountdown booking={b} />
                              </div>
                           </div>
                        ));
                     })()}
                  </div>
               </div>
               
               {/* Staff Tabs */}
               <div className="flex bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6 flex-wrap">
                  <button onClick={() => setStaffDashboardTab('used_course')} className={`flex-1 min-w-[120px] py-4 font-bold text-sm transition-colors flex items-center justify-center gap-2 ${staffDashboardTab === 'used_course' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                     <CheckCircle size={16} /> <span>ใช้คอร์ส / รับบริการ</span>
                     {activeServices.filter(s => (!globalBranch || !s.branch || s.branch === globalBranch) && s.status !== 'เรียบร้อย').length > 0 && (
                        <span className="px-2 py-0.5 bg-rose-500 text-white rounded-full text-xs font-black animate-pulse shadow-sm">
                          {activeServices.filter(s => (!globalBranch || !s.branch || s.branch === globalBranch) && s.status !== 'เรียบร้อย').length}
                        </span>
                     )}
                  </button>
                  <button onClick={() => setStaffDashboardTab('new_sale')} className={`flex-1 min-w-[120px] py-4 font-bold text-sm transition-colors flex items-center justify-center gap-2 ${staffDashboardTab === 'new_sale' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                     <ShoppingCart size={16} /> ขายคอร์ส / สินค้า
                  </button>
                  <button onClick={() => setStaffDashboardTab('service_log')} className={`flex-1 min-w-[120px] py-4 font-bold text-sm transition-colors flex items-center justify-center gap-2 ${staffDashboardTab === 'service_log' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                     <Wallet size={16} /> บันทึกค่ามือ
                  </button>
               </div>
               
               <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-4 bg-slate-50">
                     <div className="space-y-3">
                          {(() => {
                             const todayDateStr = new Date().toLocaleDateString('th-TH');
                             const todayIsoStr = getLocalYYYYMMDD();
                             
                             let rows = [];
                             
                             const renderEmpAvatar = (empName) => {
                               const emp = empName ? employees.find(e => e.name === empName) : null;
                               return (
                                 <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                                   {emp && emp.profileImage ? (
                                     <img src={emp.profileImage} className="w-5 h-5 rounded-full object-cover shadow-sm border border-gray-200" alt={empName} onError={(e) => e.target.style.display='none'} />
                                   ) : (
                                     <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200"><User size={10} className="text-gray-400" /></div>
                                   )}
                                   <span className="font-medium text-gray-700">{empName || '-'}</span>
                                 </div>
                               );
                             };
                             
                             if (staffDashboardTab === 'used_course') {
                                rows = histories.filter(h => h['วันที่'] === todayDateStr && (!globalBranch || h['สาขา'] === globalBranch) && (h['ประเภท'] === 'รับบริการ' || h['ประเภท'] === 'เบิกใช้เครดิต'));
                                return (
                                  <div className="space-y-4">
                                    <StaffServiceQueue 
                                      activeServices={activeServices}
                                      courses={processedCourses}
                                      customers={customers}
                                      employees={employees}
                                      clockedInEmployees={clockedInEmployees}
                                      activeStaff={activeStaff}
                                      globalBranch={globalBranch}
                                      showToast={triggerToast}
                                      onGoToPosDeduction={handleGoToPosDeduction}
                                    />

                                    <div className="pt-2">
                                      <h4 className="text-xs font-black text-slate-700 mb-2.5 flex items-center gap-1.5 px-1">
                                        <HistoryIcon size={14} className="text-indigo-500" />
                                        <span>ประวัติการใช้คอร์สที่ตัดยอดเรียบร้อยแล้ววันนี้ ({rows.length})</span>
                                      </h4>
                                      {rows.length === 0 ? (
                                        <div className="px-6 py-8 text-center text-gray-400 font-bold bg-white rounded-2xl border border-gray-100 text-xs">
                                          ยังไม่มีประวัติการตัดคอร์สในวันนี้
                                        </div>
                                      ) : (
                                        <div className="space-y-2">
                                          {rows.map((r, i) => (
                                             <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-emerald-200 transition-colors flex flex-col sm:flex-row sm:items-center gap-3">
                                                <div className="flex justify-between sm:w-48 shrink-0">
                                                  <div className="font-bold text-gray-800 truncate">{r['ชื่อลูกค้า']}</div>
                                                  <div className="text-gray-400 font-bold text-sm sm:hidden">{r['เวลา'] || '-'}</div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                   <div className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded inline-block text-[10px] mb-1">{r['ประเภท']}</div>
                                                   <div className="text-gray-700 text-sm truncate" title={r['รายการ']}>{r['รายการ']}</div>
                                                </div>
                                                <div className="flex justify-between sm:flex-col sm:items-end gap-1 shrink-0 mt-2 sm:mt-0 border-t border-gray-50 sm:border-0 pt-2 sm:pt-0">
                                                  {renderEmpAvatar(r['พนักงาน'])}
                                                  <div className="font-black text-emerald-600">฿{Number(r['จำนวนเงิน'] || r['ยอดรวม'] || r['ราคา'] || 0).toLocaleString()}</div>
                                                </div>
                                                <div className="hidden sm:block text-gray-400 font-bold text-sm w-16 text-right shrink-0">{r['เวลา'] || '-'}</div>
                                             </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                             } 
                             else if (staffDashboardTab === 'new_sale') {
                                rows = histories.filter(h => h['วันที่'] === todayDateStr && (!globalBranch || h['สาขา'] === globalBranch) && h['ประเภท'] && h['ประเภท'].includes('ซื้อ'));
                                if (rows.length === 0) return <div className="px-6 py-12 text-center text-gray-400 font-bold bg-white rounded-2xl border border-gray-100">ไม่มีประวัติการขายในวันนี้</div>;
                                return rows.map((r, i) => (
                                   <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-emerald-200 transition-colors flex flex-col sm:flex-row sm:items-center gap-3">
                                      <div className="flex justify-between sm:w-48 shrink-0">
                                        <div className="font-bold text-gray-800 truncate">{r['ชื่อลูกค้า']}</div>
                                        <div className="text-gray-400 font-bold text-sm sm:hidden">{r['เวลา'] || '-'}</div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                         <div className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded inline-block text-[10px] mb-1">{r['ประเภท']}</div>
                                         <div className="text-gray-700 text-sm truncate" title={r['รายการ']}>{r['รายการ']}</div>
                                      </div>
                                      <div className="flex justify-between sm:flex-col sm:items-end gap-1 shrink-0 mt-2 sm:mt-0 border-t border-gray-50 sm:border-0 pt-2 sm:pt-0">
                                        <div className="text-gray-500 text-xs flex items-center gap-1">
                                          <User size={12} /> {r['พนักงาน'] || '-'}
                                        </div>
                                        <div className="font-black text-emerald-600">฿{Number(r['จำนวนเงิน'] || r['ยอดรวม'] || r['ราคา'] || 0).toLocaleString()}</div>
                                      </div>
                                      <div className="hidden sm:block text-gray-400 font-bold text-sm w-16 text-right shrink-0">{r['เวลา'] || '-'}</div>
                                   </div>
                                ));
                             }
                             else if (staffDashboardTab === 'service_log') {
                                rows = serviceLogs.filter(s => s.date === todayIsoStr && (!globalBranch || s.branch === globalBranch));
                                if (rows.length === 0) return <div className="px-6 py-12 text-center text-gray-400 font-bold bg-white rounded-2xl border border-gray-100">ไม่มีการบันทึกค่ามือในวันนี้</div>;
                                return rows.map((r, i) => (
                                   <div key={r.id || i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-orange-200 transition-colors flex flex-col sm:flex-row sm:items-center gap-3">
                                      <div className="flex justify-between sm:w-48 shrink-0">
                                        <div className="font-bold text-gray-800 truncate">-</div>
                                        <div className="text-gray-400 font-bold text-sm sm:hidden">{new Date(r.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                         <div className="font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded inline-block text-[10px] mb-1">{r.type}</div>
                                         {r.note && <div className="text-gray-500 text-xs mt-1 truncate" title={r.note}>{r.note}</div>}
                                      </div>
                                      <div className="flex justify-between sm:flex-col sm:items-end gap-1 shrink-0 mt-2 sm:mt-0 border-t border-gray-50 sm:border-0 pt-2 sm:pt-0">
                                        {renderEmpAvatar(r.employeeName)}
                                        <div className="font-black text-orange-600">฿{Number(r.amount || 0).toLocaleString()}</div>
                                      </div>
                                      <div className="hidden sm:block text-gray-400 font-bold text-sm w-16 text-right shrink-0">{new Date(r.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div>
                                   </div>
                                ));
                             }
                          })()}
                       </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'dashboard' && globalRole === 'owner' && (
            <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500 pb-10">
              {/* User Info & Actions */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center">
                      <Store size={20} />
                    </div>
                    <div>
                      <p className="font-black text-gray-800 text-sm sm:text-base">
                        {globalRole === 'owner' ? '👑 เจ้าของร้าน' : '👨‍💼 พนักงาน'} — {globalBranch ? `สาขา${globalBranch}` : 'ยังไม่ได้เลือกสาขา'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {globalRole !== 'owner' && (
                      <button 
                        onClick={() => { setShowOwnerLogin(true); setOwnerPasscode(''); }}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors border border-slate-200 active:scale-95"
                      >
                        <ShieldCheck size={16} />
                        <span className="hidden sm:inline">เจ้าของร้าน</span>
                      </button>
                    )}
                    <button 
                      onClick={() => { localStorage.removeItem('selectedBranch'); localStorage.removeItem('userRole'); localStorage.removeItem('admin_session_exp'); localStorage.removeItem('personalEmployeeId'); window.location.reload(); }}
                      className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-sm font-bold transition-colors border border-rose-100 active:scale-95"
                    >
                      <LogOut size={16} />
                      <span className="hidden sm:inline">ออกจากระบบ</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 🌟 ยอดขายประจำวัน (Daily Sales Overview Banner & Interactive Chart) 🌟 */}
              <DailySalesBannerChart
                dailySales={dailySales}
                orders={orders}
                branches={branches}
                globalBranch={globalBranch}
                onNavigateToTab={(tab) => setActiveTab(tab)}
              />

              <h2 className="text-lg font-black text-gray-800 flex items-center"><Users className="mr-2 text-indigo-500"/> ลูกค้า & ใบคอร์สรับบริการ</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div onClick={() => { setActiveTab('customers'); setFilterCustomerStatus('all'); }} className="bg-gradient-to-br from-indigo-600 to-purple-700 p-5 sm:p-6 rounded-[24px] shadow-lg text-white hover:-translate-y-1 cursor-pointer transition-transform"><p className="text-xs font-bold text-indigo-100 uppercase tracking-wider mb-2">ลูกค้าทั้งหมด</p><p className="text-3xl sm:text-4xl font-black">{stats.totalCustomers}</p></div>
                <div onClick={() => { setActiveTab('customers'); setFilterCustomerStatus('all'); }} className="bg-white p-5 sm:p-6 rounded-[24px] border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"><p className="text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">ลูกค้ารับบริการ (Active)</p><p className="text-3xl sm:text-4xl font-black text-gray-800">{stats.activeCustomers}</p></div>
                <div onClick={() => { setActiveTab('courses'); setFilterStatus('ยังคงเหลือ'); }} className="bg-white p-5 sm:p-6 rounded-[24px] border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"><p className="text-[11px] sm:text-xs font-bold text-teal-500 uppercase tracking-wider mb-2">ใบคอร์ส (ใช้งานอยู่)</p><p className="text-3xl sm:text-4xl font-black text-teal-700">{stats.active}</p></div>
                <div onClick={() => { setActiveTab('courses'); setFilterStatus('ใช้ครบแล้ว'); }} className="bg-white p-5 sm:p-6 rounded-[24px] border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"><p className="text-[11px] sm:text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2">ใบคอร์ส (ใช้ครบแล้ว)</p><p className="text-3xl sm:text-4xl font-black text-emerald-700">{stats.completed}</p></div>
              </div>
              <h2 className="text-lg font-black text-gray-800 flex items-center pt-2"><Calendar className="mr-2 text-blue-500"/> นัดหมาย & คำสั่งซื้อ</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div onClick={() => { setActiveTab('bookings'); setFilterBookingStatus('all'); }} className="bg-blue-50 p-5 sm:p-6 rounded-[24px] border border-blue-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"><p className="text-[11px] sm:text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">นัดหมายวันนี้</p><p className="text-3xl sm:text-4xl font-black text-blue-700">{bookingStats.today}</p></div>
                <div onClick={() => { setActiveTab('bookings'); setFilterBookingStatus('รอการยืนยัน'); }} className="bg-amber-50 p-5 sm:p-6 rounded-[24px] border border-amber-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"><p className="text-[11px] sm:text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">รอการยืนยัน (คิว)</p><p className="text-3xl sm:text-4xl font-black text-amber-700">{bookingStats.pending}</p></div>
                <div onClick={() => { setActiveTab('orders'); setFilterOrderStatus('all'); }} className="bg-white p-5 sm:p-6 rounded-[24px] border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"><p className="text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">คำสั่งซื้อทั้งหมด</p><p className="text-3xl sm:text-4xl font-black text-gray-800">{orderStats.total}</p></div>
                <div onClick={() => { setActiveTab('orders'); setFilterOrderStatus('รออนุมัติ'); }} className="bg-amber-50 p-5 sm:p-6 rounded-[24px] border border-amber-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"><p className="text-[11px] sm:text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">รออนุมัติ (สั่งซื้อ)</p><p className="text-3xl sm:text-4xl font-black text-amber-700">{orderStats.pending}</p></div>
              </div>
              <h2 className="text-lg font-black text-gray-800 flex items-center pt-2"><Package className="mr-2 text-orange-500"/> คลังสินค้า & คอร์สตั้งต้น</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div onClick={() => setActiveTab('products')} className="bg-white p-5 sm:p-6 rounded-[24px] border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"><p className="text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">สินค้าทั้งหมด</p><p className="text-3xl sm:text-4xl font-black text-gray-800">{products.length}</p></div>
                <div onClick={() => setActiveTab('products')} className="bg-red-50 p-5 sm:p-6 rounded-[24px] border border-red-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"><p className="text-[11px] sm:text-xs font-bold text-red-600 uppercase tracking-wider mb-2">สินค้าหมดสต็อก</p><p className="text-3xl sm:text-4xl font-black text-red-700">{productStats.outOfStock}</p></div>
                <div onClick={() => setActiveTab('masterCourses')} className="bg-white p-5 sm:p-6 rounded-[24px] border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"><p className="text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">คอร์สโปรโมชั่น</p><p className="text-3xl sm:text-4xl font-black text-gray-800">{masterCourses.length}</p></div>
                <div onClick={() => setActiveTab('histories')} className="bg-white p-5 sm:p-6 rounded-[24px] border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"><p className="text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">ประวัติทั้งหมด</p><p className="text-3xl sm:text-4xl font-black text-gray-800">{histories.length}</p></div>
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="flex flex-col min-h-full space-y-4 max-w-7xl mx-auto">
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
                          {Array.from(new Set([...branches.map(b => b.name), ...Object.keys(bookingBranchStats)].map(br => String(br).replace(/^สาขา/,'').trim()))).map(br => <option key={br} value={br}>{br}</option>)}
                      </select>
                      
                      <div className="flex bg-gray-100 p-1 rounded-xl shrink-0">
                         <button onClick={() => setBookingViewMode('calendar')} className={`px-3 py-1.5 flex items-center text-xs font-bold rounded-lg transition-colors ${bookingViewMode === 'calendar' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}><CalendarDays size={14} className="mr-1 hidden sm:block"/> ปฏิทิน</button>
                         <button onClick={() => setBookingViewMode('timeline')} className={`px-3 py-1.5 flex items-center text-xs font-bold rounded-lg transition-colors ${bookingViewMode === 'timeline' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}><List size={14} className="mr-1 hidden sm:block"/> ไทม์ไลน์</button>
                         <button onClick={() => setBookingViewMode('cards')} className={`px-3 py-1.5 flex items-center text-xs font-bold rounded-lg transition-colors ${bookingViewMode === 'cards' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}><LayoutGrid size={14} className="mr-1 hidden sm:block"/> การ์ด</button>
                      </div>
                      <select value={filterBookingStatus} onChange={(e) => setFilterBookingStatus(e.target.value)} className="bg-gray-50 rounded-xl px-3 py-2 text-sm font-bold outline-none border border-gray-200 flex-1 sm:w-auto min-w-[140px]">
                          <option value="today_upcoming">⚡ คิววันนี้ที่ยังไม่ถึงคิว (${bookingStats.todayUpcoming})</option>
                          <option value="today_all">📅 คิววันนี้ทั้งหมด (${bookingStats.today})</option>
                          <option value="all">📋 คิวทั้งหมดทุกวัน (${bookings.length})</option>
                          <option value="รอการยืนยัน">รอการยืนยัน</option>
                          <option value="ยืนยันแล้ว">ยืนยันแล้ว</option>
                          <option value="กำลังใช้บริการ">กำลังใช้บริการ</option>
                          <option value="เสร็จสิ้น">เสร็จสิ้น</option>
                          <option value="ยกเลิก">ยกเลิก</option>
                          <option value="ยกเลิกฉุกเฉิน">🚨 ยกเลิกฉุกเฉิน</option>
                       </select>
                      
                      <button onClick={() => setIsCheckInOpen(true)} className="bg-emerald-500 hover:bg-emerald-600 transition-colors text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center shadow-md active:scale-95 shrink-0"><ScanLine size={16} className="mr-1"/> เช็คอิน</button>
                                            <button onClick={() => {
                          const now = new Date();
                          const nowStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                          setGeneralBookingForm({ name: '', phone: '', service: '', dateTime: nowStr, branch: filterBookingBranch !== 'all' ? filterBookingBranch : 'เฉวง', isWalkIn: true });
                          setIsGeneralBookingOpen(true);
                      }} className="bg-purple-600 hover:bg-purple-700 transition-colors text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center shadow-md active:scale-95 shrink-0"><UserPlus size={16} className="mr-1"/> Walk-in</button>
                      <button onClick={() => { setGeneralBookingForm({ name: "", phone: "", service: "", dateTime: "", branch: filterBookingBranch !== "all" ? filterBookingBranch : "เฉวง", isWalkIn: false }); setIsGeneralBookingOpen(true); }} className="bg-blue-600 hover:bg-blue-700 transition-colors text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center shadow-md active:scale-95 shrink-0"><Plus size={16} className="mr-1"/> นัดหมาย</button>
                   </div>
                </div>

                {/* Quick Filter Chips: แสดงคิวทั้งหมดของวันที่ปัจจุบันที่ยังไม่ถึงคิว */}
                <div className="flex flex-wrap items-center gap-2 px-1">
                    <button 
                        onClick={() => setFilterBookingStatus('today_upcoming')}
                        className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm active:scale-95 ${filterBookingStatus === 'today_upcoming' ? 'bg-indigo-600 text-white shadow-indigo-200 ring-2 ring-indigo-300' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}
                    >
                        <span>⚡ คิววันนี้ที่ยังไม่ถึงคิว</span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${filterBookingStatus === 'today_upcoming' ? 'bg-white text-indigo-700' : 'bg-indigo-50 text-indigo-600'}`}>
                            {bookingStats.todayUpcoming}
                        </span>
                    </button>
                    <button 
                        onClick={() => setFilterBookingStatus('today_all')}
                        className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm active:scale-95 ${filterBookingStatus === 'today_all' ? 'bg-blue-600 text-white shadow-blue-200 ring-2 ring-blue-300' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}
                    >
                        <span>📅 คิววันนี้ทั้งหมด</span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${filterBookingStatus === 'today_all' ? 'bg-white text-blue-700' : 'bg-blue-50 text-blue-600'}`}>
                            {bookingStats.today}
                        </span>
                    </button>
                    <button 
                        onClick={() => setFilterBookingStatus('กำลังใช้บริการ')}
                        className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm active:scale-95 ${filterBookingStatus === 'กำลังใช้บริการ' ? 'bg-purple-600 text-white shadow-purple-200 ring-2 ring-purple-300' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}
                    >
                        <span>🟢 กำลังรับบริการ</span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${filterBookingStatus === 'กำลังใช้บริการ' ? 'bg-white text-purple-700' : 'bg-purple-50 text-purple-600'}`}>
                            {bookings.filter(b => getBookingStatus(b) === 'กำลังใช้บริการ').length}
                        </span>
                    </button>
                    <button 
                        onClick={() => setFilterBookingStatus('all')}
                        className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm active:scale-95 ${filterBookingStatus === 'all' ? 'bg-slate-800 text-white shadow-slate-300' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}
                    >
                        <span>📋 คิวทั้งหมดทุกวัน</span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${filterBookingStatus === 'all' ? 'bg-white text-slate-800' : 'bg-gray-100 text-gray-600'}`}>
                            {bookings.length}
                        </span>
                    </button>
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
                                const isHoliday = storeHolidays.some(h => h.id === dStr);
                                
                                return (
                                    <div key={i} onClick={() => { setSelectedHolidayDate(d); setIsHolidayModalOpen(true); }} className={`h-24 sm:h-32 border ${isToday ? 'border-blue-400 bg-blue-50/30 shadow-inner' : isHoliday ? 'border-rose-300 bg-rose-50/50' : 'border-gray-100 bg-white hover:bg-gray-50 cursor-pointer'} rounded-xl p-1.5 sm:p-2 overflow-y-auto hide-scrollbar flex flex-col relative group transition-colors`}>
                                        <div className="flex justify-between items-start mb-1.5 shrink-0">
                                            <span className={`text-[10px] sm:text-xs font-bold ${isToday ? 'text-blue-600 bg-blue-100 w-6 h-6 rounded-full flex items-center justify-center' : isHoliday ? 'text-rose-600' : 'text-gray-600 ml-1'}`}>{d.getDate()}</span>
                                            {isHoliday && <span className="text-[9px] font-bold text-rose-600 bg-rose-100 px-1.5 rounded-full border border-rose-200">วันหยุดร้าน</span>}
                                        </div>
                                        <div className="space-y-1 flex-1">
                                            {dayBookings.map((b, bi) => {
                                                const st = getBookingStatus(b);
                                                const dtSafe = getSafeDateTime(b);
                                                const timeStr = dtSafe ? dtSafe.split('T')[1]?.substring(0,5) : '';
                                                return (
                                                    <div key={bi} onClick={(e) => { e.stopPropagation(); setBookingViewMode('cards'); }} className={`text-[9px] sm:text-[10px] font-bold p-1 sm:p-1.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity border ${st === 'รอการยืนยัน' ? 'bg-amber-50 text-amber-700 border-amber-100' : st === 'ยืนยันแล้ว' ? 'bg-blue-50 text-blue-700 border-blue-100' : st === 'กำลังใช้บริการ' ? 'bg-purple-50 text-purple-700 border-purple-100' : st === 'เสร็จสิ้น' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`} title={`${timeStr} - ${b.customerName}`}>
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
                    <div className="pb-4 px-2 sm:px-6 relative mt-4">
                       <div className="flex justify-start sm:justify-center gap-2 mb-8 sticky top-2 z-30">
                           <input type="date" onChange={(e) => { if(e.target.value) jumpToDate(e.target.value); }} className="bg-white/90 backdrop-blur border border-blue-200 text-blue-700 rounded-full px-4 py-2 text-sm font-bold outline-none shadow-md cursor-pointer hover:bg-white transition-all" />
                           <button onClick={() => jumpToDate(getLocalYYYYMMDD())} className="bg-blue-600 text-white hover:bg-blue-700 rounded-full px-5 py-2 text-sm font-bold shadow-md transition-all active:scale-95">กลับไปวันนี้</button>
                       </div>
                       <div className="absolute left-[21px] sm:left-1/2 top-12 bottom-0 w-0.5 bg-gradient-to-b from-gray-200 via-blue-200 to-gray-100 transform sm:-translate-x-1/2 rounded-full"></div>
                       {Object.entries(sortedBookings.reduce((acc, b) => {
                           const dt = getSafeDateTime(b); const datePart = dt ? dt.split('T')[0] : 'ไม่ระบุวันที่';
                           if (!acc[datePart]) acc[datePart] = []; acc[datePart].push(b); return acc;
                       }, {})).sort(([dateA], [dateB]) => {
                           if (dateA === 'ไม่ระบุวันที่') return -1; if (dateB === 'ไม่ระบุวันที่') return 1; return new Date(dateA) - new Date(dateB);
                       }).map(([dateStr, items], gIdx) => {
                           const d = new Date(dateStr); const title = isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                           return (
                               <div key={gIdx} id={`timeline-date-${dateStr}`} className="mb-6 relative scroll-mt-24">
                                   <div className="flex justify-start sm:justify-center mb-3 relative z-20 sticky top-20 pt-1">
                                       <div className="bg-blue-100 text-blue-800 border-2 border-blue-200 px-4 py-1.5 rounded-full text-[11px] font-black shadow-md flex items-center ml-10 sm:ml-0 relative z-10 backdrop-blur-sm bg-blue-100/90">
                                           <Calendar size={14} className="mr-1 text-blue-600"/> {title}
                                       </div>
                                       <div className="absolute left-0 sm:hidden top-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full transform -translate-y-1/2 shadow-sm ml-[19px] z-0"></div>
                                   </div>
                                   <div className="space-y-2">
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
                                           
                                           let timeDiffStr = '';
                                           let timeDiffColor = '';
                                           if ((st === 'กำลังใช้บริการ' || st === 'เสร็จสิ้น') && b.serviceStartTime && dtSafe) {
                                               const diffMins = Math.round((new Date(b.serviceStartTime) - new Date(dtSafe)) / 60000);
                                               if (diffMins < -100) {
                                                   timeDiffStr = `มาก่อน ${Math.abs(diffMins)} นาที`;
                                                   timeDiffColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
                                               } else if (diffMins > 100) {
                                                   timeDiffStr = `สาย ${diffMins} นาที`;
                                                   timeDiffColor = 'text-red-600 bg-red-50 border-red-200';
                                               } else {
                                                   timeDiffStr = `ตรงเวลา`;
                                                   timeDiffColor = 'text-blue-600 bg-blue-50 border-blue-200';
                                               }
                                           }


                                           return (
                                               <div key={b.id || idx} className={`flex flex-col sm:flex-row items-center w-full relative z-10 ${isRightSide ? 'sm:flex-row-reverse' : ''}`}>
                                                   <div className="absolute left-0 sm:left-1/2 w-3 h-3 bg-white border-2 border-gray-300 rounded-full transform sm:-translate-x-1/2 ml-[19px] sm:ml-0 mt-2.5 sm:mt-0 shadow-sm"></div>
                                                   <div className="w-full sm:w-1/2 flex justify-start sm:justify-end sm:px-10 pl-10 pr-1 mt-1 sm:mt-0 relative group">
                                                        <div className={`hidden sm:block absolute top-1/2 w-8 h-0.5 bg-gray-200 transform -translate-y-1/2 ${isRightSide ? 'left-0' : 'right-0'}`}></div>
                                                        <div className={`bg-white border ${st === 'รอการยืนยัน' ? 'border-amber-200 shadow-amber-100/50' : st === 'ยืนยันแล้ว' ? 'border-blue-200 shadow-blue-100/50' : st === 'กำลังใช้บริการ' ? 'border-purple-300 shadow-purple-100/50 ring-1 ring-purple-100' : st === 'เสร็จสิ้น' ? 'border-emerald-200 shadow-emerald-100/50' : 'border-gray-200'} rounded-xl shadow-sm hover:shadow-md transition-all w-full max-w-[400px] relative overflow-hidden flex cursor-pointer`} onClick={() => setBookingTicket(b)}>
                                                            <div className={`absolute top-0 left-0 w-2 h-full ${st === 'รอการยืนยัน' ? 'bg-amber-400' : st === 'ยืนยันแล้ว' ? 'bg-blue-500' : st === 'กำลังใช้บริการ' ? 'bg-purple-500 animate-pulse' : st === 'เสร็จสิ้น' ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                                                            <div className="flex-1 p-2.5 pl-4 flex flex-col justify-between">
                                                                <div className="flex justify-between items-start mb-1.5">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-gray-400 overflow-hidden border border-gray-200 shrink-0 shadow-sm">
                                                                            {picData ? <img src={picData.primary} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => handleProfileImgError(e, picData.fallback, 'block')} /> : <Users size={10} />}
                                                                        </div>
                                                                        <p className="font-bold text-gray-800 text-[11px] leading-tight truncate max-w-[100px]">{String(b.customerName || '-').split(' ')[0]}</p>
                                                                        {Number(b.guestsCount || b.pax || 1) > 1 && (
                                                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-700 border border-purple-200 text-[9px] font-black shrink-0" title={`จองบริการพร้อมกัน ${b.guestsCount || b.pax} ท่าน`}>
                                                                                👥 {b.guestsCount || b.pax} ท่าน
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <button onClick={(e) => { e.stopPropagation(); setBookingTicket(b); }} className={`px-2 py-0.5 rounded-full text-[9px] font-bold border transition-all hover:scale-105 active:scale-95 flex items-center gap-1 shadow-xs ${st === 'รอการยืนยัน' ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100' : st === 'ยืนยันแล้ว' ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100' : st === 'กำลังใช้บริการ' ? 'bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100 animate-pulse' : st === 'เสร็จสิ้น' ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100' : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'}`} title="แตะเพื่อเปิดหน้าต่างปรับสถานะ">
                                                                        <span>{st}</span>
                                                                        <span className="text-[8px] opacity-75">✏️</span>
                                                                    </button>
                                                                </div>
                                                                
                                                                <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {String(b.courseName || '-').split(',').map((c, i) => {
                                                                            const typeName = c.trim();
                                                                            if (!typeName) return null;
                                                                            let Icon = null;
                                                                            const nameLower = typeName.toLowerCase();
                                                                            if (nameLower.includes('หน้า') || nameLower.includes('ทรีท') || nameLower.includes('นวด')) Icon = Sparkles;
                                                                            else if (nameLower.includes('สิว') || nameLower.includes('มาร์ค') || nameLower.includes('มาส์ก')) Icon = Droplet;
                                                                            else if (nameLower.includes('ipl') || nameLower.includes('เลเซอร์') || nameLower.includes('laser') || nameLower.includes('กำจัดขน') || nameLower.includes('รักแร้')) Icon = Zap;
                                                                            else if (nameLower.includes('ไฝ') || nameLower.includes('ขี้แมลงวัน') || nameLower.includes('ติ่งเนื้อ')) Icon = Target;
                                                                            else if (nameLower.includes('ฉีด') || nameLower.includes('botox') || nameLower.includes('โบท็อก') || nameLower.includes('ฟิลเลอร์') || nameLower.includes('filler') || nameLower.includes('แฟต') || nameLower.includes('fat') || nameLower.includes('meso') || nameLower.includes('เมโส')) Icon = Syringe;
                                                                            else if (nameLower.includes('ดริป') || nameLower.includes('วิตามิน') || nameLower.includes('vitamin') || nameLower.includes('drip') || nameLower.includes('ผิวขาว')) Icon = Pill;

                                                                            return (
                                                                                <div key={i} className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${st === 'รอการยืนยัน' ? 'bg-amber-50 border-amber-200 text-amber-700' : st === 'ยืนยันแล้ว' ? 'bg-blue-50 border-blue-200 text-blue-700' : st === 'กำลังใช้บริการ' ? 'bg-purple-50 border-purple-200 text-purple-700' : st === 'เสร็จสิ้น' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                                                                                    {Icon && <Icon size={12} strokeWidth={2.5} />}
                                                                                    <span className="font-black text-[12px]">{typeName}</span>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                    <BookingCountdown booking={b} />
                                                                </div>
                                                                
                                                                 <div className="flex justify-between items-end mt-auto">
                                                                    <div
                                                                        className="cursor-pointer hover:bg-indigo-50/70 p-0.5 rounded transition-colors"
                                                                        onClick={(e) => { e.stopPropagation(); openRescheduleModal(b); }}
                                                                        title="คลิกเพื่อเลื่อนวัน/เวลานัดหมาย"
                                                                    >
                                                                        <p className="text-[8px] font-bold text-gray-400 mb-0.5 flex items-center gap-0.5">
                                                                            วันที่ <CalendarClock size={9} className="text-indigo-500" />
                                                                        </p>
                                                                        <p className="font-black text-gray-800 text-[11px] underline decoration-dashed decoration-indigo-300 underline-offset-2">
                                                                            {dtSafe ? new Date(dtSafe).toLocaleDateString('th-TH', {day: 'numeric', month: 'numeric', year: 'numeric'}) : '-'}
                                                                        </p>
                                                                    </div>
                                                                    <div
                                                                        className="cursor-pointer hover:bg-indigo-50/70 p-0.5 rounded transition-colors text-right"
                                                                        onClick={(e) => { e.stopPropagation(); openRescheduleModal(b); }}
                                                                        title="คลิกเพื่อเลื่อนวัน/เวลานัดหมาย"
                                                                    >
                                                                        <p className="text-[8px] font-bold text-gray-400 mb-0.5 flex items-center gap-1">เวลา {timeDiffStr && <span className={`text-[8px] px-1 rounded border ${timeDiffColor}`}>{timeDiffStr}</span>}</p>
                                                                        <p className={`font-black text-[15px] leading-none underline decoration-dashed decoration-indigo-300 underline-offset-2 ${st === 'รอการยืนยัน' ? 'text-amber-500' : st === 'ยืนยันแล้ว' ? 'text-blue-500' : st === 'กำลังใช้บริการ' ? 'text-purple-500' : st === 'เสร็จสิ้น' ? 'text-emerald-500' : 'text-gray-500'}`}>
                                                                            {dtSafe ? dtSafe.split('T')[1]?.substring(0,5) : '-'} <span className="text-[9px]">น.</span>
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                                                                        <MapPin size={10} className="text-gray-400" />
                                                                        <p className="font-bold text-gray-700 text-[9px] leading-tight truncate max-w-[60px]">{String(b.branch || 'เฉวง')}</p>
                                                                    </div>
                                                                </div>

                                                                {/* ⚡ เปิดรับคิวเพิ่มและเลื่อนเวลาโดยตรงจากการ์ด (Timeline) */}
                                                                {(() => {
                                                                    const bDate = b.date || (dtSafe ? dtSafe.split('T')[0] : '');
                                                                    const bTime = b.time ? b.time.substring(0, 5) : (dtSafe ? dtSafe.split('T')[1]?.substring(0, 5) : '');
                                                                    const bBranch = String(b.branch || 'เฉวง').replace(/^สาขา/, '').trim();
                                                                    const key = `${bDate}_${bBranch}_${bTime}`;
                                                                    const extraCount = Number(bookingConfig?.extraSlotOverrides?.[key] || 0);

                                                                    return (
                                                                        <div className="mt-2 pt-1.5 border-t border-gray-100/80 flex items-center justify-between gap-1">
                                                                            <div className="flex items-center gap-1">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => { e.stopPropagation(); openRescheduleModal(b); }}
                                                                                    className="px-2 py-0.5 rounded-lg text-[8.5px] font-black flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 active:scale-95 transition-all shadow-xs"
                                                                                    title="เลื่อนวัน/เวลานัดหมาย"
                                                                                >
                                                                                    <CalendarClock size={10} />
                                                                                    <span>เลื่อนเวลา</span>
                                                                                </button>
                                                                                {extraCount > 0 ? (
                                                                                    <span className="text-[8.5px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                                                                        <Zap size={9} className="fill-emerald-500 text-emerald-600" />
                                                                                        +{extraCount}
                                                                                    </span>
                                                                                ) : null}
                                                                            </div>
                                                                            <div className="flex items-center gap-1">
                                                                                {extraCount > 0 && (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={(e) => { e.stopPropagation(); handleToggleBookingExtraSlot(b, -1); }}
                                                                                        className="w-4 h-4 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 font-black text-[10px] flex items-center justify-center active:scale-95"
                                                                                        title="ลดคิวที่เปิดเพิ่ม"
                                                                                    >
                                                                                        -
                                                                                    </button>
                                                                                )}
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => { e.stopPropagation(); handleToggleBookingExtraSlot(b, 1); }}
                                                                                    className={`px-1.5 py-0.5 rounded-md text-[8.5px] font-black flex items-center gap-1 active:scale-95 shadow-xs ${
                                                                                        extraCount > 0
                                                                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                                                                            : 'bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200'
                                                                                    }`}
                                                                                    title="กดเพื่อเปิดรับคิวเพิ่มในรอบนี้"
                                                                                >
                                                                                    <Plus size={10} />
                                                                                    <span>{extraCount > 0 ? 'เพิ่ม' : 'เปิดรับเพิ่ม'}</span>
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                            <div onClick={(e) => { e.stopPropagation(); setBookingTicket(b); }} className="w-10 shrink-0 border-l-2 border-dashed border-gray-100 flex flex-col items-center justify-center bg-gray-50/40 hover:bg-blue-50/60 transition-colors cursor-pointer group/qr" title="คลิกดู E-Ticket & ปรับสถานะ">
                                                                <QrCode size={16} className={`transition-transform group-hover/qr:scale-110 ${st === 'รอการยืนยัน' ? 'text-amber-500' : st === 'ยืนยันแล้ว' ? 'text-blue-500' : st === 'กำลังใช้บริการ' ? 'text-purple-500' : st === 'เสร็จสิ้น' ? 'text-emerald-500' : 'text-gray-400'}`} />
                                                                <span className="text-[7px] font-bold text-gray-400 mt-0.5 group-hover/qr:text-blue-600">จัดการ</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="w-full sm:w-1/2 flex justify-start items-center pl-[40px] sm:pl-10 mt-1 sm:mt-0 text-sm font-bold text-gray-400 opacity-60">
                                                        {durationStr && <span className="bg-white border border-gray-200 px-3 py-1 rounded-full shadow-sm text-xs"><Clock size={12} className="inline mr-1"/> {durationStr}</span>}
                                                    </div>
                                               </div>
                                           );
                                       })}
                                   </div>
                               </div>
                           );
                       })}
                       {sortedBookings.length === 0 && (
                           <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 p-8 shadow-sm max-w-lg mx-auto">
                              <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-3">
                                 <CheckCircle size={32} />
                              </div>
                              <h4 className="text-base font-black text-gray-800 mb-1">
                                 {filterBookingStatus === 'today_upcoming' ? 'ไม่มีคิวค้างในวันนี้ (ไม่มีคิวที่ยังไม่ถึงคิว)' : 'ไม่พบข้อมูลนัดหมาย'}
                              </h4>
                              <p className="text-xs text-gray-500 mb-4">
                                 {filterBookingStatus === 'today_upcoming' ? 'คิววันนี้ได้รับการดูแลครบถ้วนแล้ว หรือยังไม่มีการจองคิวใหม่สำหรับวันนี้' : 'ลองเปลี่ยนตัวกรองสถานะหรือค้นหาด้วยคำอื่น'}
                              </p>
                              {filterBookingStatus !== 'all' && (
                                 <button onClick={() => setFilterBookingStatus('all')} className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition-colors">
                                    ดูคิวทั้งหมดทุกวัน
                                 </button>
                              )}
                           </div>
                        )}
                    </div>
                )}

                {bookingViewMode === 'cards' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pb-10">
                        {sortedBookings.slice(0, 100).map((b, idx) => {
                            const st = getBookingStatus(b);
                            const dtSafe = getSafeDateTime(b);
                            
                            const isPast = dtSafe ? new Date(dtSafe) < new Date() && st !== 'เสร็จสิ้น' && st !== 'ยกเลิก' : false;
                            const picData = getProfilePicData(b, customersRaw);
                            
                            let timeDiffStr = '';
                            let timeDiffColor = '';
                            if ((st === 'กำลังใช้บริการ' || st === 'เสร็จสิ้น') && b.serviceStartTime && dtSafe) {
                                const diffMins = Math.round((new Date(b.serviceStartTime) - new Date(dtSafe)) / 60000);
                                if (diffMins < -100) {
                                    timeDiffStr = `มาก่อน ${Math.abs(diffMins)} นาที`;
                                    timeDiffColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
                                } else if (diffMins > 100) {
                                    timeDiffStr = `สาย ${diffMins} นาที`;
                                    timeDiffColor = 'text-red-600 bg-red-50 border-red-200';
                                } else {
                                    timeDiffStr = `ตรงเวลา`;
                                    timeDiffColor = 'text-blue-600 bg-blue-50 border-blue-200';
                                }
                            }

                            return (
                                <div key={b.id || idx} className={`bg-white border ${st === 'รอการยืนยัน' ? 'border-amber-200 shadow-amber-100/50' : st === 'ยืนยันแล้ว' ? 'border-blue-200 shadow-blue-100/50' : st === 'กำลังใช้บริการ' ? 'border-purple-300 shadow-purple-100/50 ring-1 ring-purple-100' : st === 'เสร็จสิ้น' ? 'border-emerald-200 shadow-emerald-100/50' : 'border-gray-200'} rounded-xl shadow-sm hover:shadow-md transition-all flex cursor-pointer relative overflow-hidden group`} onClick={() => setBookingTicket(b)}>
                                    <div className={`absolute top-0 left-0 w-2 h-full ${st === 'รอการยืนยัน' ? 'bg-amber-400' : st === 'ยืนยันแล้ว' ? 'bg-blue-500' : st === 'กำลังใช้บริการ' ? 'bg-purple-500 animate-pulse' : st === 'เสร็จสิ้น' ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                                    <div className="flex-1 p-2.5 pl-4 flex flex-col justify-between">
                                        <div className="flex justify-between items-start mb-1.5">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-gray-400 overflow-hidden border border-gray-200 shrink-0 shadow-sm">
                                                    {picData ? <img src={picData.primary} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => handleProfileImgError(e, picData.fallback, 'block')} /> : <Users size={10} />}
                                                </div>
                                                <p className="font-bold text-gray-800 text-[11px] leading-tight truncate max-w-[100px]">{String(b.customerName || '-').split(' ')[0]}</p>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); setBookingTicket(b); }} className={`px-2 py-0.5 rounded-full text-[9px] font-bold border transition-all hover:scale-105 active:scale-95 flex items-center gap-1 shadow-xs ${st === 'รอการยืนยัน' ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100' : st === 'ยืนยันแล้ว' ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100' : st === 'กำลังใช้บริการ' ? 'bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100 animate-pulse' : st === 'เสร็จสิ้น' ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100' : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'}`} title="แตะเพื่อเปิดหน้าต่างปรับสถานะ">
                                                                        <span>{st}</span>
                                                                        <span className="text-[8px] opacity-75">✏️</span>
                                                                    </button>
                                        </div>
                                        
                                        <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
                                            <div className="flex flex-wrap gap-1">
                                                {String(b.courseName || '-').split(',').map((c, i) => {
                                                    const typeName = c.trim();
                                                    if (!typeName) return null;
                                                    let Icon = null;
                                                    const nameLower = typeName.toLowerCase();
                                                    if (nameLower.includes('หน้า') || nameLower.includes('ทรีท') || nameLower.includes('นวด')) Icon = Sparkles;
                                                    else if (nameLower.includes('สิว') || nameLower.includes('มาร์ค') || nameLower.includes('มาส์ก')) Icon = Droplet;
                                                    else if (nameLower.includes('ipl') || nameLower.includes('เลเซอร์') || nameLower.includes('laser') || nameLower.includes('กำจัดขน') || nameLower.includes('รักแร้')) Icon = Zap;
                                                    else if (nameLower.includes('ไฝ') || nameLower.includes('ขี้แมลงวัน') || nameLower.includes('ติ่งเนื้อ')) Icon = Target;
                                                    else if (nameLower.includes('ฉีด') || nameLower.includes('botox') || nameLower.includes('โบท็อก') || nameLower.includes('ฟิลเลอร์') || nameLower.includes('filler') || nameLower.includes('แฟต') || nameLower.includes('fat') || nameLower.includes('meso') || nameLower.includes('เมโส')) Icon = Syringe;
                                                    else if (nameLower.includes('ดริป') || nameLower.includes('วิตามิน') || nameLower.includes('vitamin') || nameLower.includes('drip') || nameLower.includes('ผิวขาว')) Icon = Pill;

                                                    return (
                                                        <div key={i} className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${st === 'รอการยืนยัน' ? 'bg-amber-50 border-amber-200 text-amber-700' : st === 'ยืนยันแล้ว' ? 'bg-blue-50 border-blue-200 text-blue-700' : st === 'กำลังใช้บริการ' ? 'bg-purple-50 border-purple-200 text-purple-700' : st === 'เสร็จสิ้น' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                                                            {Icon && <Icon size={12} strokeWidth={2.5} />}
                                                            <span className="font-black text-[12px]">{typeName}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <BookingCountdown booking={b} />
                                        </div>
                                        
                                        <div className="flex justify-between items-end mt-auto">
                                            <div
                                                className="cursor-pointer hover:bg-indigo-50/70 p-0.5 rounded transition-colors"
                                                onClick={(e) => { e.stopPropagation(); openRescheduleModal(b); }}
                                                title="คลิกเพื่อเลื่อนวัน/เวลานัดหมาย"
                                            >
                                                <p className="text-[8px] font-bold text-gray-400 mb-0.5 flex items-center gap-0.5">
                                                    วันที่ <CalendarClock size={9} className="text-indigo-500" />
                                                </p>
                                                <p className="font-black text-gray-800 text-[11px] underline decoration-dashed decoration-indigo-300 underline-offset-2">
                                                    {dtSafe ? new Date(dtSafe).toLocaleDateString('th-TH', {day: 'numeric', month: 'numeric', year: 'numeric'}) : '-'}
                                                </p>
                                            </div>
                                            <div
                                                className="cursor-pointer hover:bg-indigo-50/70 p-0.5 rounded transition-colors text-right"
                                                onClick={(e) => { e.stopPropagation(); openRescheduleModal(b); }}
                                                title="คลิกเพื่อเลื่อนวัน/เวลานัดหมาย"
                                            >
                                                <p className="text-[8px] font-bold text-gray-400 mb-0.5 flex items-center justify-end gap-0.5">
                                                    เวลา <Clock size={9} className="text-indigo-500" />
                                                </p>
                                                <p className={`font-black text-[15px] leading-none underline decoration-dashed decoration-indigo-300 underline-offset-2 ${st === 'รอการยืนยัน' ? 'text-amber-500' : st === 'ยืนยันแล้ว' ? 'text-blue-500' : st === 'กำลังใช้บริการ' ? 'text-purple-500' : st === 'เสร็จสิ้น' ? 'text-emerald-500' : 'text-gray-500'}`}>
                                                    {dtSafe ? dtSafe.split('T')[1]?.substring(0,5) : '-'} <span className="text-[9px]">น.</span>
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                                                <MapPin size={10} className="text-gray-400" />
                                                <p className="font-bold text-gray-700 text-[9px] leading-tight truncate max-w-[60px]">{String(b.branch || 'เฉวง')}</p>
                                            </div>
                                        </div>

                                        {/* ⚡ เปิดรับคิวเพิ่มและเลื่อนเวลาโดยตรงจากการ์ด (Cards) */}
                                        {(() => {
                                            const bDate = b.date || (dtSafe ? dtSafe.split('T')[0] : '');
                                            const bTime = b.time ? b.time.substring(0, 5) : (dtSafe ? dtSafe.split('T')[1]?.substring(0, 5) : '');
                                            const bBranch = String(b.branch || 'เฉวง').replace(/^สาขา/, '').trim();
                                            const key = `${bDate}_${bBranch}_${bTime}`;
                                            const extraCount = Number(bookingConfig?.extraSlotOverrides?.[key] || 0);

                                            return (
                                                <div className="mt-2 pt-2 border-t border-gray-100/80 flex items-center justify-between gap-1">
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); openRescheduleModal(b); }}
                                                            className="px-2 py-0.5 rounded-lg text-[9px] font-black flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 active:scale-95 transition-all shadow-xs"
                                                            title="เลื่อนวัน/เวลานัดหมาย"
                                                        >
                                                            <CalendarClock size={11} />
                                                            <span>เลื่อนเวลา</span>
                                                        </button>
                                                        {extraCount > 0 ? (
                                                            <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                                                                <Zap size={10} className="fill-emerald-500 text-emerald-600" />
                                                                +{extraCount}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {extraCount > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); handleToggleBookingExtraSlot(b, -1); }}
                                                                className="w-5 h-5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 font-black text-xs flex items-center justify-center active:scale-95 transition-all"
                                                                title="ลดคิวที่เปิดเพิ่ม"
                                                            >
                                                                -
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); handleToggleBookingExtraSlot(b, 1); }}
                                                            className={`px-2 py-0.5 rounded-lg text-[9px] font-black flex items-center gap-1 active:scale-95 transition-all shadow-xs ${
                                                                extraCount > 0
                                                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                                                    : 'bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200'
                                                            }`}
                                                            title="กดเพื่อเปิดรับคิวเพิ่มในรอบนี้ ลูกค้าจะสามารถจองต่อได้ทันที"
                                                        >
                                                            <Plus size={11} />
                                                            <span>{extraCount > 0 ? 'เพิ่มอีก' : 'เปิดรับเพิ่ม'}</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                    <div onClick={(e) => { e.stopPropagation(); setBookingTicket(b); }} className="w-12 shrink-0 border-l-2 border-dashed border-gray-100 flex flex-col items-center justify-center bg-gray-50/40 hover:bg-blue-50/60 transition-colors cursor-pointer group/qr" title="คลิกดู E-Ticket & ปรับสถานะ">
                                        <QrCode size={18} className={`transition-transform group-hover/qr:scale-110 ${st === 'รอการยืนยัน' ? 'text-amber-500' : st === 'ยืนยันแล้ว' ? 'text-blue-500' : st === 'กำลังใช้บริการ' ? 'text-purple-500' : st === 'เสร็จสิ้น' ? 'text-emerald-500' : 'text-gray-400'}`} />
                                        <span className="text-[8px] font-bold text-gray-400 mt-0.5 group-hover/qr:text-blue-600">จัดการ</span>
                                    </div>
                                </div>
                            );
                        })}
                        {sortedBookings.length === 0 && (
                           <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 p-8 shadow-sm max-w-lg mx-auto">
                              <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-3">
                                 <CheckCircle size={32} />
                              </div>
                              <h4 className="text-base font-black text-gray-800 mb-1">
                                 {filterBookingStatus === 'today_upcoming' ? 'ไม่มีคิวค้างในวันนี้ (ไม่มีคิวที่ยังไม่ถึงคิว)' : 'ไม่พบข้อมูลนัดหมาย'}
                              </h4>
                              <p className="text-xs text-gray-500 mb-4">
                                 {filterBookingStatus === 'today_upcoming' ? 'คิววันนี้ได้รับการดูแลครบถ้วนแล้ว หรือยังไม่มีการจองคิวใหม่สำหรับวันนี้' : 'ลองเปลี่ยนตัวกรองสถานะหรือค้นหาด้วยคำอื่น'}
                              </p>
                              {filterBookingStatus !== 'all' && (
                                 <button onClick={() => setFilterBookingStatus('all')} className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition-colors">
                                    ดูคิวทั้งหมดทุกวัน
                                 </button>
                              )}
                           </div>
                        )}
                    </div>
                )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="flex flex-col h-full space-y-4 max-w-7xl mx-auto">
              <div className="p-4 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4">
                 <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                     <div className="flex items-center w-full max-w-md"><Search size={20} className="text-gray-400 ml-2" /><input type="text" placeholder="ค้นหาคำสั่งซื้อ..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-full mx-2 outline-none text-sm" /></div>
                     <div className="flex gap-2 w-full sm:w-auto"><button onClick={() => setIsAddOrderOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 transition-colors text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center shadow-lg active:scale-95 shrink-0 w-full sm:w-auto"><Plus size={16} className="mr-1"/> สร้างคำสั่งซื้อ</button></div>
                 </div>
                 <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide px-1 w-full border-t border-gray-50 pt-3">
                     {['all', 'รอชำระเงิน', 'รอดำเนินการ', 'กำลังจัดส่ง', 'สำเร็จแล้ว', 'ยกเลิก'].map(st => (
                         <button key={st} onClick={() => setFilterOrderStatus(st)} className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold transition-all ${filterOrderStatus === st ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-transparent'}`}>
                             {st === 'all' ? 'ทั้งหมด' : st}
                         </button>
                     ))}
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pb-10">
                {sortedOrders.slice(0, 100).map((o, idx) => {
                  const st = getOrderStatus(o);
                  // 🌟 สถานะดิบจริงจากเอกสาร — ใช้เป็นค่าของ dropdown เพื่อไม่เขียนทับสถานะรวยๆ (เช่น 'รอชำระที่สาขา (สาขาเฉวง)') โดยไม่ตั้งใจ
                  const rawSt = String(getFuzzyKey(o, ["status", "สถานะ"]) || '').trim() || 'รออนุมัติ';
                  const picData = getProfilePicData({customerPhone: o.customerPhone}, customersRaw);
                  return (
                  <div key={idx} className={`bg-white border ${st === 'รออนุมัติ' ? 'border-amber-200 shadow-amber-100/50' : st === 'อนุมัติแล้ว' ? 'border-emerald-200 shadow-emerald-100/50' : 'border-red-200 shadow-red-100/50'} rounded-xl shadow-sm hover:shadow-md transition-all flex cursor-pointer relative overflow-hidden group`} onClick={() => setOrderTicket(o)}>
                     <div className={`absolute top-0 left-0 w-2 h-full ${st === 'รออนุมัติ' ? 'bg-amber-400' : st === 'อนุมัติแล้ว' ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                     
                     <div className="flex-1 p-2.5 pl-4 flex flex-col justify-between">
                         <div className="flex justify-between items-start mb-1.5">
                             <div className="flex items-center gap-1.5">
                                 <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-gray-400 overflow-hidden border border-gray-200 shrink-0 shadow-sm">
                                     {picData ? <img src={picData.primary} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => handleProfileImgError(e, picData.fallback, 'block')} /> : <Users size={10} />}
                                 </div>
                                 <p className="font-bold text-gray-800 text-[11px] leading-tight truncate max-w-[100px]">{String(o.customerName || 'ไม่ระบุชื่อ').split(' ')[0]}</p>
                             </div>
                             <select value={rawSt} onChange={(e) => handleOrderStatusChange(o, e.target.value)} onClick={(e) => e.stopPropagation()} className={`px-2 py-0.5 rounded text-[9px] font-bold border outline-none appearance-none cursor-pointer max-w-[150px] ${st === 'รออนุมัติ' ? 'bg-amber-50 text-amber-600 border-amber-300' : st === 'อนุมัติแล้ว' ? 'bg-emerald-50 text-emerald-600 border-emerald-300' : 'bg-red-50 text-red-600 border-red-300'}`}>
                                 {/* 🌟 ชุดสถานะมาตรฐาน (เดียวกับแอปลูกค้า) — แสดงสถานะปัจจุบัน (ดิบ) ไว้ก่อนเสมอกันเขียนทับโดยไม่ตั้งใจ */}
                                 {[...new Set([rawSt, 'รอชำระเงิน', 'รอตรวจสอบ', 'รอดำเนินการ', 'รอประเมินราคา', 'ชำระเงินแล้ว', 'กำลังจัดส่ง', 'จัดส่งแล้ว', 'สำเร็จ', 'เรียบร้อย', 'ยกเลิก'])].map(opt => (
                                     <option key={opt} value={opt}>{opt}</option>
                                 ))}
                             </select>
                         </div>
                         
                         <h4 className={`font-black text-[14px] leading-tight mb-2 line-clamp-2 ${st === 'รออนุมัติ' ? 'text-amber-600' : st === 'อนุมัติแล้ว' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {o.courseName ? String(o.courseName) : (o.cartItems && o.cartItems.length > 0 ? o.cartItems.map(c => `${c.name} x${c.qty || 1}`).join(', ') : (o.itemName ? String(o.itemName) : '-'))}
                         </h4>
                         
                         <div className="flex flex-wrap gap-1 text-[9px] text-gray-500 mb-2">
                             <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-bold">฿{parseNumber(o.price || o.itemPrice || o.originalPrice || 0).toLocaleString()}</span>
                             <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-1.5 py-0.5 rounded font-bold">เครดิต: ฿{parseNumber(o.credit || o.price || o.itemPrice || 0).toLocaleString()}</span>
                             {orderHasCourses(o) && (
                                isOrderCourseCreated(o) ? (
                                   <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-bold flex items-center shadow-sm" title="สร้างใบคอร์สในระบบ POS แล้ว">
                                      <CheckCircle size={10} className="mr-0.5 text-emerald-600" /> มีใน POS แล้ว
                                   </span>
                                ) : (
                                   <button
                                     onClick={(e) => {
                                        e.stopPropagation();
                                        setActionConfirmModal({
                                           isOpen: true,
                                           title: 'เพิ่มคอร์สเข้าสู่ POS ทันที',
                                           message: `ต้องการสร้างใบคอร์สในระบบ POS สำหรับออเดอร์ ${o.orderNo || ''} (${o.customerName || o.customerPhone}) ทันทีใช่หรือไม่?`,
                                           action: () => executeApproveOrder(o, o.status || 'สำเร็จ'),
                                           confirmText: 'สร้างคอร์สใน POS ทันที',
                                           confirmColor: 'bg-emerald-500 hover:bg-emerald-600'
                                        });
                                     }}
                                     className="bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-0.5 rounded font-black flex items-center shadow-sm transition-all hover:scale-105 animate-pulse"
                                     title="กดเพื่อสร้างใบคอร์สเข้าสู่ระบบ POS ทันที"
                                   >
                                      <Plus size={10} className="mr-0.5" /> เพิ่มคอร์สเข้า POS
                                   </button>
                                )
                             )}
                             {o.itemType === 'custom_image' && (
                                <button onClick={(e) => { e.stopPropagation(); window.open(o.customOrderImage || o.slipImage || o.faceImage, '_blank'); }} className="bg-pink-50 text-pink-600 border border-pink-200 px-1.5 py-0.5 rounded font-bold flex items-center hover:bg-pink-100 transition-colors shadow-sm">
                                   <ImageIcon size={10} className="mr-0.5" /> ดูรูป
                                </button>
                             )}
                             {(o.trackingNo || o.shippingAddress || o.itemType === 'product' || (Array.isArray(o.cartItems) && o.cartItems.some(c => c.type === 'product' || c.type === 'simple'))) && (
                                <button
                                  onClick={(e) => {
                                     e.stopPropagation();
                                     setShippingLabelOrder(o);
                                  }}
                                  className="bg-orange-50 text-orange-600 border border-orange-200 px-1.5 py-0.5 rounded font-bold flex items-center hover:bg-orange-100 transition-colors shadow-sm"
                                >
                                   <Printer size={10} className="mr-0.5" /> พิมพ์ใบแปะหน้า
                                </button>
                             )}
                             {o.trackingNo && (
                                <>
                                   <button onClick={(e) => { e.stopPropagation(); refreshTracking17(o); }} className="bg-sky-50 text-sky-600 border border-sky-200 px-1.5 py-0.5 rounded font-bold flex items-center hover:bg-sky-100 transition-colors shadow-sm">
                                      <Truck size={10} className="mr-0.5"/> ดึงสถานะพัสดุ
                                   </button>
                                   {o.trackingInfo?.phase && (
                                      <span className="bg-sky-100 text-sky-700 border border-sky-200 px-1.5 py-0.5 rounded font-bold">
                                         📦 {TRACK17_PHASE_TH[o.trackingInfo.phase] || o.trackingInfo.phase}
                                      </span>
                                   )}
                                </>
                             )}
                             {o.itemType === 'product' && (
                                <button
                                  onClick={(e) => {
                                     e.stopPropagation();
                                     setTrackingInputModal({ order: o, value: o.trackingNo || '' });
                                  }}
                                  className="bg-slate-50 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded font-bold flex items-center hover:bg-slate-100 transition-colors shadow-sm"
                                >
                                   📮 กรอกเลขพัสดุ
                                </button>
                             )}
                         </div>
                         
                         <div className="flex justify-between items-end mt-auto">
                             <div>
                                 <p className="text-[8px] font-bold text-gray-400 mb-0.5">วันที่</p>
                                 <p className="font-black text-gray-800 text-[11px]">{new Date(o.createdAt).toLocaleDateString('th-TH', {day: 'numeric', month: 'numeric', year: 'numeric'})}</p>
                             </div>
                             <div>
                                 <p className="text-[8px] font-bold text-gray-400 mb-0.5">เวลา</p>
                                 <p className={`font-black text-[15px] leading-none ${st === 'รออนุมัติ' ? 'text-amber-500' : st === 'อนุมัติแล้ว' ? 'text-emerald-500' : 'text-red-500'}`}>
                                     {new Date(o.createdAt).toLocaleTimeString('th-TH', {hour: '2-digit', minute: '2-digit'})} <span className="text-[9px]">น.</span>
                                 </p>
                             </div>
                             <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                                 <MapPin size={10} className="text-gray-400" />
                                 <p className="font-bold text-gray-700 text-[9px] leading-tight truncate max-w-[60px]">{String(o.branch || 'เฉวง')}</p>
                             </div>
                         </div>
                     </div>
                     <div className="w-12 shrink-0 border-l-2 border-dashed border-gray-100 flex flex-col items-center justify-center bg-gray-50/30 hover:bg-gray-100 transition-colors relative group/qr">
                         <QrCode size={18} className={`${st === 'รออนุมัติ' ? 'text-amber-400' : st === 'อนุมัติแล้ว' ? 'text-emerald-400' : 'text-red-400'}`} />
                         
                         <div className="absolute top-1/2 -translate-y-1/2 right-full mr-1 flex flex-row items-center gap-1.5 opacity-0 group-hover/qr:opacity-100 transition-all z-10 bg-white/95 backdrop-blur-sm p-1.5 rounded-2xl shadow-md border border-gray-100 translate-x-2 group-hover/qr:translate-x-0" style={{ width: 'max-content', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                              <button onClick={(e) => { e.stopPropagation(); setActionConfirmModal({ isOpen: true, title: 'ลบประวัติคำสั่งซื้อ', message: 'ยืนยันการลบประวัติคำสั่งซื้อนี้ทิ้งถาวร ใช่หรือไม่?', action: () => executeDeleteOrder(o.id), confirmText: 'ลบทิ้ง', confirmColor: 'bg-red-600 hover:bg-red-700' }); }} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors" title="ลบ"><Trash2 size={14}/></button>
                              <button onClick={(e) => {
                                e.stopPropagation();
                                const customer = customersRaw.find(c => {
                                  const p = String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '').replace(/\D/g, '');
                                  const oPhone = String(o.customerPhone || '').replace(/\D/g, '');
                                  return p && oPhone && (p === oPhone || p.endsWith(oPhone) || oPhone.endsWith(p));
                                });
                                let posItems = [];
                                if (o.cartItems && Array.isArray(o.cartItems) && o.cartItems.length > 0) {
                                    posItems = o.cartItems.map((item, i) => {
                                        const isCourse = item.type === 'course' || !!item.sessions || !!item.promoOption || !!item.courseId || (masterCourses && masterCourses.some(c => c.id === item.courseId || c.id === item.id || (item.id && String(item.id).startsWith(c.id))));
                                        const itemType = item.type || (isCourse ? 'course' : 'product');
                                        let origItem = null;
                                        if (itemType === 'course') {
                                            origItem = (masterCourses || []).find(c => c.id === item.courseId || c.id === item.id || (item.id && String(item.id).startsWith(c.id)) || String(c["ชื่อคอส"] || c.name || '') === String(item.name || '')) || null;
                                        } else {
                                            origItem = (products || []).find(p => p.id === item.id || String(p["ชื่อสินค้า"] || p.name || '') === String(item.name || '')) || null;
                                        }
                                        const totalSessions = item.sessions || item.promoOption?.sessions || (origItem ? getFuzzyKey(origItem, ["จำนวนครั้ง", "col_7"]) : 1);
                                        const receivedItems = item.items || item.promoOption?.items || (origItem ? getFuzzyKey(origItem, ["รายการที่ได้รับ", "col_11"]) : '');
                                        const creditAmt = item.credit || (origItem ? getFuzzyKey(origItem, ["เครดิตที่ได้รับ", "วงเงินคอร์ส", "col_14"]) : 0);
                                        return {
                                            id: item.id || `${o.id}_${i}`,
                                            name: String(item.name || 'สินค้าจากคำสั่งซื้อ'),
                                            price: parseNumber(item.price),
                                            qty: parseNumber(item.qty || '1'),
                                            type: itemType,
                                            sessions: totalSessions,
                                            items: receivedItems,
                                            promoOption: item.promoOption || null,
                                            credit: creditAmt,
                                            skipStockUpdate: itemType === 'course',
                                            maxQty: 9999,
                                            originalItem: origItem || { id: item.id || o.id, "ชื่อสินค้า": item.name, "ชื่อคอส": item.name, "ราคาขาย": item.price, "จำนวนครั้ง": totalSessions, "รายการที่ได้รับ": receivedItems },
                                            isManualPrice: true
                                        };
                                    });
                                } else {
                                    const isCourse = o.type === 'course' || !!o.courseName || !!o.sessions || !!o.courseId;
                                    const itemType = isCourse ? 'course' : 'product';
                                    let origItem = null;
                                    if (itemType === 'course') {
                                        origItem = (masterCourses || []).find(c => c.id === o.courseId || String(c["ชื่อคอส"] || c.name || '') === String(o.courseName || '')) || null;
                                    } else {
                                        origItem = (products || []).find(p => p.id === o.id || String(p["ชื่อสินค้า"] || p.name || '') === String(o.courseName || '')) || null;
                                    }
                                    const totalSessions = o.sessions || (origItem ? getFuzzyKey(origItem, ["จำนวนครั้ง", "col_7"]) : 1);
                                    const receivedItems = o.items || (origItem ? getFuzzyKey(origItem, ["รายการที่ได้รับ", "col_11"]) : '');
                                    const creditAmt = o.credit || (origItem ? getFuzzyKey(origItem, ["เครดิตที่ได้รับ", "วงเงินคอร์ส", "col_14"]) : 0);
                                    posItems = [{
                                        id: o.courseId || o.id,
                                        name: String(o.courseName || 'สินค้าจากคำสั่งซื้อ'),
                                        price: parseNumber(o.price || o.totalPrice),
                                        qty: parseNumber(o.qty || '1'),
                                        type: itemType,
                                        sessions: totalSessions,
                                        items: receivedItems,
                                        credit: creditAmt,
                                        skipStockUpdate: itemType === 'course',
                                        maxQty: 9999,
                                        originalItem: origItem || { id: o.id, "ชื่อสินค้า": o.courseName, "ชื่อคอส": o.courseName, "ราคาขาย": o.price || o.totalPrice, "จำนวนครั้ง": totalSessions, "รายการที่ได้รับ": receivedItems },
                                        isManualPrice: true
                                    }];
                                }
                                const event = new CustomEvent('add-to-pos-cart', { detail: { items: posItems, customer: customer || null, orderId: o.id, order: o } });
                                setActiveTab('pos');
                                setTimeout(() => { window.dispatchEvent(event); showToast('ส่งไปคิดเงินที่ POS สำเร็จ'); }, 100);
                              }} className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-colors" title="คิดเงิน (POS)"><ShoppingCart size={14}/></button>
                          </div>
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
              <div className="flex-shrink-0 bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden flex flex-col mb-6">
                 <div className="p-4 sm:p-5 flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <Search size={22} className="text-gray-400 ml-2 shrink-0" />
                      <input type="text" placeholder="ค้นหาชื่อคอร์ส, รหัส, หมวดหมู่..." value={masterCourseSearch} onChange={(e) => setMasterCourseSearch(e.target.value)} className="w-full mx-3 outline-none text-base bg-transparent font-medium text-gray-800" />
                    </div>
                    {(globalRole === 'owner' || globalRole === 'manager') && (
                      <button onClick={() => setIsAddMasterCourseOpen(true)} className="hidden sm:flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm shadow-pink-500/30 transition-all shrink-0">
                        <Plus size={16} />
                        เพิ่มคอร์สโปรโมชั่น
                      </button>
                    )}
                 </div>
                 <div className="bg-slate-50 border-t border-gray-100 p-3 sm:px-5 sm:py-4">
                     <div className="flex gap-2 overflow-x-auto scrollbar-hide w-full">
                         {masterCourseCategories.map(({ name, count }) => (
                            <button 
                                key={name} 
                                onClick={() => setMasterCourseTab(name)} 
                                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border flex items-center gap-2 ${
                                  masterCourseTab === name 
                                    ? 'bg-cyan-500 text-white border-cyan-500 shadow-md transform scale-105' 
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                                }`}
                            >
                                <span>{name}</span>
                                <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-full ${
                                  masterCourseTab === name 
                                    ? 'bg-white/20 text-white' 
                                    : 'bg-gray-100 text-gray-500'
                                }`}>
                                  {count}
                                </span>
                            </button>
                         ))}
                     </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pb-10">
                {filteredMasterCourses.filter(mc => masterCourseTab === 'ทั้งหมด' || String(getFuzzyKey(mc, ["ประเภท", "col_2"]) || 'ทั่วไป') === masterCourseTab).slice(0, 500).map((mc, idx) => {
                  const rawCredit = getFuzzyKey(mc, ["เครดิตที่ได้รับ", "เครดิตที่ได้", "เครดิตทั้งหมด", "ยอดเครดิต", "วงเงินคอร์ส", "เครดิต", "วงเงิน", "วงเงินที่ได้รับ", "มูลค่าเครดิต"]);
                  const creditAmt = rawCredit !== undefined && rawCredit !== '' ? parseNumber(rawCredit) : 0;
                  
                  let qty = 1;
                  const rawQty = getFuzzyKey(mc, ["จำนวนครั้งที่ได้", "จำนวนครั้ง", "ครั้งที่ได้", "col_7"]);
                  if (rawQty !== undefined && rawQty !== '') {
                      qty = parseQty(rawQty);
                  } else {
                      const cName = String(getFuzzyKey(mc, ["ชื่อคอส", "col_4"]) || '');
                      const match = cName.match(/(\d+)\s*ครั้ง/);
                      if (match) qty = parseInt(match[1], 10);
                  }
                  
                  const duration = getFuzzyKey(mc, ["กำหนดเวลา"]);
                  const items = getFuzzyKey(mc, ["รายการที่ได้รับ", "col_11"]);
                  const vip = getFuzzyKey(mc, ["ฟรีบัตรสมาชิก"]);
                  const courseImage = getFuzzyKey(mc, ["รูปภาพ", "รูป", "image", "img", "col_13"]);
                  const promoOpts = Array.isArray(mc.promoOptions) ? mc.promoOptions.filter(o => o && (o.name || o.price)) : [];

                  return (
                  <div key={idx} className="bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm hover:shadow-lg transition-all flex flex-col relative overflow-hidden group border-t-4 border-t-cyan-400">
                     {/* 🌟 รูปภาพคอร์สโปรโมชั่นแนวตั้ง (แสดงบนการ์ด และกดอัปโหลด/เปลี่ยนรูปได้ทันที) 🌟 */}
                     <div className="relative w-full aspect-[3/4] max-h-72 rounded-2xl overflow-hidden bg-slate-50 mb-3 border border-slate-100 group/img flex items-center justify-center">
                        {courseImage ? (
                          <>
                            <img src={courseImage} alt={String(getFuzzyKey(mc, ["ชื่อคอส", "col_4"]) || '')} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <label className="bg-white/95 hover:bg-white text-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer shadow-md flex items-center gap-1.5 active:scale-95 transition-transform">
                                <Camera size={14} className="text-cyan-600" /> เปลี่ยนรูป
                                <input type="file" accept="image/*" onChange={(e) => handleDirectCourseImageUpload(mc, e.target.files?.[0])} className="hidden" />
                              </label>
                              <button 
                                type="button" 
                                onClick={() => handleRemoveCourseImage(mc)}
                                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-xl shadow-md transition-colors"
                                title="ลบรูป"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </>
                        ) : (
                          <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-cyan-50/40 transition-colors p-3 text-slate-400 hover:text-cyan-600 border-2 border-dashed border-slate-200 hover:border-cyan-300 rounded-2xl group/btn">
                            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-1 text-slate-400 group-hover/btn:text-cyan-500 group-hover/btn:scale-110 transition-transform">
                              <Camera size={20} />
                            </div>
                            <span className="text-xs font-bold text-slate-600 group-hover/btn:text-cyan-600">+ เพิ่มรูปโปรโมชั่น</span>
                            <span className="text-[10px] text-slate-400">แสดงฝั่งลูกค้าให้กดซื้อได้</span>
                            <input type="file" accept="image/*" onChange={(e) => handleDirectCourseImageUpload(mc, e.target.files?.[0])} className="hidden" />
                          </label>
                        )}
                     </div>

                     <div className="flex justify-between items-start mb-2">
                        <div className="font-mono text-xs font-bold text-cyan-700">{String(getFuzzyKey(mc, ["รหัสคอส", "col_1"]) || '-')}</div>
                        <span className="px-2 py-0.5 bg-cyan-50 text-cyan-600 text-[9px] font-bold rounded">{String(getFuzzyKey(mc, ["ประเภท", "col_2"]) || '-')}</span>
                     </div>
                     <h4 className="font-black text-gray-900 text-base mb-1 line-clamp-2">{String(getFuzzyKey(mc, ["ชื่อคอส", "col_4"]) || '-')}</h4>
                     
                     <div className="flex flex-wrap gap-1 mb-2">
                       {duration && <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">⏳ {duration}</span>}
                       {vip === 'ใช่' && <span className="text-[10px] bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded font-bold">💳 ฟรี VIP</span>}
                     </div>
                     
                     {items && (
                        <div className="text-[10px] text-gray-500 bg-gray-50 p-2 rounded-lg mb-2 line-clamp-3 whitespace-pre-line flex-1">
                          {items}
                        </div>
                     )}

                     {promoOpts.length > 0 && (
                        <div className="mb-2 bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200/70 rounded-xl p-2.5">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-black text-pink-700 flex items-center gap-1">
                              <Sparkles size={12} className="text-pink-500 fill-pink-500" /> มี {promoOpts.length} แพ็กเกจโปรให้เลือก:
                            </span>
                          </div>
                          <div className="space-y-1">
                            {promoOpts.map((opt, oIdx) => (
                              <div key={opt.id || oIdx} className="flex items-center justify-between text-[11px] bg-white/90 px-2 py-1 rounded-lg border border-pink-100">
                                <span className="font-bold text-slate-800 truncate mr-2 flex items-center gap-1">
                                  <span>{opt.name || `โปรที่ ${oIdx+1}`}</span>
                                  {opt.badge && <span className="px-1.5 py-0.2 bg-red-100 text-red-600 rounded text-[9px] font-black">{opt.badge}</span>}
                                </span>
                                <span className="font-black text-pink-600 shrink-0">฿{Number(opt.price || 0).toLocaleString()} <span className="text-[9px] font-normal text-slate-500">({opt.sessions || 1} ครั้ง)</span></span>
                              </div>
                            ))}
                          </div>
                        </div>
                     )}

                     <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-50">
                        <div className="text-xs text-gray-500">
                           ราคา <span className="font-bold text-gray-800">฿{parseNumber(getFuzzyKey(mc, ["ราคา", "col_5"])).toLocaleString()}</span>
                           {creditAmt > 0 && (
                              <span className="ml-2 px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded text-[9px] font-bold inline-block">
                                วงเงิน ฿{creditAmt.toLocaleString()}
                              </span>
                           )}
                        </div>
                        <div className="text-[10px] text-cyan-600 bg-cyan-50 px-2 py-1 rounded-md font-bold shrink-0 ml-2">จำนวน <span className="text-sm">{qty}</span> ครั้ง</div>
                     </div>
                     
                     <div className="mt-3">
                        <button onClick={() => setMasterCourseUsagesModal({ isOpen: true, mc })} className="w-full bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-100 py-2 rounded-xl text-xs font-bold flex items-center justify-center transition-colors">
                           <Users size={14} className="mr-1.5 text-slate-400"/> ดูใบคอร์สที่ใช้โปรนี้
                        </button>
                     </div>

                     <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 opacity-90 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setEditingMasterCourse(mc);
                            setIsAddMasterCourseOpen(true);
                          }} 
                          className="text-xs font-bold text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 px-2.5 py-1.5 rounded-lg flex items-center transition-colors"
                        >
                          <Edit3 size={14} className="mr-1"/> แก้ไข
                        </button>
                        <button 
                          onClick={() => setActionConfirmModal({ 
                            isOpen: true, 
                            title: 'ลบคอร์สตั้งต้น', 
                            message: 'แน่ใจหรือไม่ที่จะลบรายการคอร์สนี้?', 
                            action: () => executeDeleteMasterCourse(mc.id, mc.isPOSCourse), 
                            confirmText: 'ลบ', 
                            confirmColor: 'bg-red-600 hover:bg-red-700' 
                          })} 
                          className="text-xs font-bold text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg flex items-center transition-colors"
                        >
                          <Trash2 size={14} className="mr-1"/> ลบ
                        </button>
                     </div>
                  </div>
                  );
                })}
                {filteredMasterCourses.filter(mc => masterCourseTab === 'ทั้งหมด' || String(getFuzzyKey(mc, ["ประเภท", "col_2"]) || 'ทั่วไป') === masterCourseTab).length === 0 && <div className="col-span-full text-center py-20"><Layers size={64} className="mx-auto text-gray-200 mb-4"/><p className="text-base font-black text-gray-800 mb-1">ไม่พบข้อมูลคอร์สตั้งต้น</p></div>}
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <InventoryDashboard
              products={products}
              branches={branches}
              globalBranch={globalBranch}
              globalRole={globalRole}
              user={user}
              inventoryLogs={inventoryLogs}
              wooImagesMap={wooImagesMap}
              triggerToast={triggerToast}
              setActionConfirmModal={setActionConfirmModal}
              wooIdMap={wooIdMap}
              onAddProduct={() => setIsAddProductOpen(true)}
            />
          )}

          {activeTab === 'employees' && globalRole === 'owner' && <EmployeeDashboard employees={employees} requisitions={employeeRequisitions} jobApplications={jobApplications} attendance={employeeAttendance} histories={histories} branches={branches} leaves={employeeLeaves} advancePayments={advancePayments} dailySales={dailySales} appSettings={appSettings} orders={orders} serviceLogs={serviceLogs} bookings={bookings} onGoToPOS={handlePosAccess} />}

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
                 <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <select value={courseFilterType} onChange={(e) => setCourseFilterType(e.target.value)} className="bg-teal-50 text-teal-700 rounded-xl px-3 py-2 text-sm font-bold flex-1 sm:w-auto min-w-[120px] outline-none border border-teal-200">
                        <option value="all">ทุกประเภท</option>
                        <option value="treatment">คอสรักษา</option>
                        <option value="general">คอสทั่วไป</option>
                    </select>
                    <select value={courseSourceFilter} onChange={(e) => setCourseSourceFilter(e.target.value)} className="bg-purple-50 text-purple-700 rounded-xl px-3 py-2 text-sm font-bold flex-1 sm:w-auto min-w-[120px] outline-none border border-purple-200">
                        <option value="all">ทุกแหล่งที่มา</option>
                        <option value="pos">ระบบใหม่ (POS)</option>
                        <option value="legacy">ระบบเก่า</option>
                    </select>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-gray-50 rounded-xl px-3 py-2 text-sm font-bold flex-1 sm:w-auto min-w-[120px] outline-none border border-gray-200">
                      <option value="all">สถานะทั้งหมด</option>
                      <option value="ยังคงเหลือ">ยังคงเหลือ</option>
                      <option value="ใช้ครบแล้ว">ใช้ครบแล้ว</option>
                      <option value="ปิดคอร์สแล้ว">ปิดคอร์สแล้ว</option>
                      <option value="หมดอายุ">หมดอายุ</option>
                    </select>
                    <div className="flex items-center gap-1.5 flex-1 sm:flex-initial min-w-[120px]">
                        <input type="date" value={courseDateFilter.from} onChange={(e) => setCourseDateFilter(prev => ({ ...prev, from: e.target.value }))} className="bg-amber-50 text-amber-700 rounded-xl px-2 py-2 text-xs font-bold w-full sm:w-auto outline-none border border-amber-200" title="วันที่ซื้อ - ตั้งแต่" />
                        <span className="text-gray-400 text-xs font-bold shrink-0">—</span>
                        <input type="date" value={courseDateFilter.to} onChange={(e) => setCourseDateFilter(prev => ({ ...prev, to: e.target.value }))} className="bg-amber-50 text-amber-700 rounded-xl px-2 py-2 text-xs font-bold w-full sm:w-auto outline-none border border-amber-200" title="วันที่ซื้อ - ถึง" />
                        {(courseDateFilter.from || courseDateFilter.to) && <button onClick={() => setCourseDateFilter({ from: '', to: '' })} className="text-gray-400 hover:text-red-500 shrink-0 p-1" title="ล้างตัวกรองวันที่"><X size={14} /></button>}
                    </div>
                    <button onClick={() => { setIsPrintCourseSummaryMode(true); setTimeout(() => window.print(), 500); }} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center shadow-sm active:scale-95 shrink-0 transition-colors border border-gray-200"><Printer size={16} className="mr-1"/> พิมพ์ตาราง</button>
                    <button onClick={() => setIsAddCourseOpen(true)} className="bg-teal-500 hover:bg-teal-600 transition-colors text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center shadow-lg active:scale-95 shrink-0"><Plus size={16} className="mr-1"/> เพิ่มคอร์ส</button>
                 </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pb-10">
                {filteredCourses.slice(0, 100).map((course, idx) => {
                  const isPendingPayment = course.computedPendingAmount > 0;
                  const isClosed = course.isClosed || course.computedStatus === 'ปิดคอร์สแล้ว';
                  const isCompleted = course.computedStatus === 'ใช้ครบแล้ว';
                  const courseCustomerPhone = String(getFuzzyKey(course, ["เบอร์โทร", "col_1"]) || '');
                  const picData = getProfilePicData({customerPhone: courseCustomerPhone}, customersRaw);
                  return (
                    <div key={idx} className={`bg-white border-2 ${isClosed ? 'border-rose-100 bg-rose-50/10' : isPendingPayment ? 'border-red-100 shadow-red-100/50' : 'border-gray-100'} rounded-[24px] p-5 shadow-sm hover:shadow-lg transition-all cursor-pointer relative overflow-hidden group flex flex-col`} onClick={() => setSelectedCourse(course)}>
                       <div className={`absolute top-0 left-0 w-1.5 h-full ${isClosed ? 'bg-gradient-to-b from-rose-600 to-red-700' : isPendingPayment ? 'bg-red-400' : course.computedStatus === 'ยังคงเหลือ' ? 'bg-gradient-to-b from-teal-400 to-emerald-500' : course.computedStatus === 'หมดอายุ' ? 'bg-gradient-to-b from-rose-400 to-red-500' : 'bg-gray-300'}`}></div>
                       
                       {/* 🌟 Watermark Stamp Overlay 🌟 */}
                       {isClosed && (
                         <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 select-none overflow-hidden">
                           <div className="border-[3px] border-rose-600/35 text-rose-600/40 font-black text-sm tracking-widest px-3 py-1 rounded-xl rotate-[-18deg] uppercase select-none shadow-sm backdrop-blur-[0.5px]">
                             ปิดคอร์สแล้ว
                           </div>
                         </div>
                       )}
                       {!isClosed && isCompleted && (
                         <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 select-none overflow-hidden">
                           <div className="border-[3px] border-blue-600/25 text-blue-600/30 font-black text-sm tracking-widest px-3 py-1 rounded-xl rotate-[-18deg] uppercase select-none shadow-sm">
                             ใช้ครบแล้ว
                           </div>
                         </div>
                       )}

                       <div className="flex justify-between items-start mb-3 pl-2 relative">
                          <div className="font-bold text-teal-700 text-sm line-clamp-1 pr-6">{String(getFuzzyKey(course, ["ชื่อคอส", "col_8"]) || '-')}</div>
                          <span className={`px-2 py-1 rounded-lg text-[9px] font-black shrink-0 absolute right-0 top-0 ${isClosed ? 'bg-rose-50 text-rose-700 border border-rose-300 shadow-sm' : course.computedStatus === 'ยังคงเหลือ' ? 'bg-teal-50 text-teal-700 border border-teal-200' : course.computedStatus === 'ใช้ครบแล้ว' ? 'bg-blue-50 text-blue-700 border border-blue-200' : course.computedStatus === 'หมดอายุ' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>{course.computedStatus}</span>
                       </div>
                        <div className="pl-2 flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shrink-0 overflow-hidden border border-gray-200">
                                    {picData ? <img src={picData.primary} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => handleProfileImgError(e, picData.fallback, 'block')} /> : null}
                                    <Users size={10} className={picData ? "hidden" : ""} />
                                </div>
                                <div className="text-xs text-gray-600 line-clamp-1 flex-1">{String(getFuzzyKey(course, ["ผู้ซื้อคอส", "col_9"]) || '-')}</div>
                                {globalRole === 'owner' && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); handleDeleteCourse(course.id, course.courseRefKey); }}
                                      className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                      title="ลบใบคอร์ส (เฉพาะเจ้าของร้าน)"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono mb-2 flex items-center gap-1.5 flex-wrap">
                                <span>{courseCustomerPhone || '-'}</span>
                                {String(course.courseRefKey || '').startsWith('IC') ? (
                                    <span className="text-[8px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">POS</span>
                                ) : (
                                    <span className="text-[8px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold">เก่า</span>
                                )}
                                {course.paperCoursePhotos?.length > 0 && (
                                    <span className="text-[8px] bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5" title="มีรูปถ่ายใบคอร์สกระดาษเดิมแนบไว้">
                                        <Camera size={9} /> ใบกระดาษ ({course.paperCoursePhotos.length})
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-1 mb-2">
                                <div className="flex items-center gap-1">
                                    <span className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[10px] font-bold border border-indigo-100">
                                        อายุ {course.durationText || '1 ปี'}
                                    </span>
                                    <div className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                        <Calendar size={10} className="text-gray-400"/>
                                        ซื้อ: {String(getFuzzyKey(course, ["วันที่ซื้อ", "col_3"]) || '-')}
                                    </div>
                                </div>
                                {course.computedExpireDate !== '-' && (
                                    <div className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${course.daysLeft !== null && course.daysLeft < 0 ? 'text-rose-600 bg-rose-50 border border-rose-100' : course.isExpiringSoon ? 'text-amber-600 bg-amber-50 border border-amber-100' : 'text-gray-500 bg-gray-50 border border-gray-100'}`}>
                                        <Clock size={10}/>
                                        หมดอายุ: {course.computedExpireDate}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {isPendingPayment && <div className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md mb-1 inline-block">ค้างชำระ ฿{course.computedPendingAmount.toLocaleString()}</div>}
                                {course.computedTotalCredit > 0 && <div className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md mb-1 inline-block">เครดิต: ฿{course.computedRemainCredit.toLocaleString()}</div>}
                            </div>
                        </div>
                        <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-50 pl-2">
                           <p className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">ใช้ไป {course.computedUsedQty}/{course.computedTotalQty}</p>
                           {isClosed ? (
                             <p className="text-sm font-black text-rose-600">ปิดคอร์สแล้ว</p>
                           ) : (
                             <p className="text-sm font-bold text-teal-600">เหลือ {course.computedRemainQty}</p>
                           )}
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
                    <select value={filterCustomerStatus} onChange={(e) => setFilterCustomerStatus(e.target.value)} className="bg-gray-50 rounded-xl px-3 py-2 text-sm font-bold flex-1 sm:w-auto outline-none border border-gray-200">
                      <option value="all">สมาชิกทั้งหมด</option>
                      <option value="อนุมัติแล้ว (Member)">VIP (Member)</option>
                      <option value="สะสมยอด">สะสมยอด</option>
                      <option value="ทั่วไป">ทั่วไป</option>
                    </select>
                    <select value={customerSortMode} onChange={(e) => setCustomerSortMode(e.target.value)} className="bg-gray-50 rounded-xl px-3 py-2 text-sm font-bold flex-1 sm:w-auto outline-none border border-gray-200">
                      <option value="newest">🕒 ลงทะเบียนล่าสุด</option>
                      <option value="cardNo">🏷️ หมายเลขใบสะสม</option>
                      <option value="accumulated">💰 ยอดสะสมสูงสุด</option>
                      <option value="name">🔤 ชื่อ (ก-ฮ)</option>
                    </select>
                    <button onClick={() => setIsAddressManagerOpen(true)} className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center shadow-lg active:scale-95 shrink-0"><MapPin size={16} className="mr-1"/> จัดการที่อยู่จัดส่ง</button>
                    <button onClick={() => setIsAddCustomerOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center shadow-lg active:scale-95 shrink-0"><UserPlus size={16} className="mr-1"/> เพิ่มลูกค้า</button>
                 </div>
              </div>

              {/* 🌟 Grid View (เดิม) 🌟 */}
              {customerViewMode === 'grid' && (
                <div className="space-y-6 pb-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {filteredCustomers.slice(0, customerLimit).map((customer, idx) => (
                      <div key={customer.id || idx} className={`bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col relative overflow-hidden group ${customer.isApproved ? 'ring-2 ring-orange-100' : ''}`} onClick={() => setSelectedCustomer(customer)}>
                         <div className={`absolute top-0 left-0 w-1.5 h-full ${customer.isApproved ? 'bg-gradient-to-b from-amber-400 to-orange-500' : customer.createdAtTimestamp > 0 ? 'bg-gradient-to-b from-emerald-400 to-teal-500' : 'bg-gradient-to-b from-indigo-400 to-purple-500'}`}></div>
                         <div className="flex items-center space-x-3 mb-4 pl-2">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shadow-inner shrink-0 overflow-hidden border border-gray-100 ${customer.isApproved ? 'bg-orange-50 text-orange-600' : customer.createdAtTimestamp > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'}`}>
                               {customer.profilePicData ? <img src={customer.profilePicData.primary} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => handleProfileImgError(e, customer.profilePicData.fallback, 'flex')} /> : null}
                               <span className={customer.profilePicData ? "hidden" : "flex items-center justify-center w-full h-full"}>{String(customer.computedName || 'U')[0]}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                               <h4 className="font-black text-gray-900 text-sm truncate flex items-center gap-1">
                                   <span className="truncate">{customer.computedName}</span>
                                   {customer.lineUid && (
                                       <span className="text-[#06C755] shrink-0" title="เชื่อมต่อ LINE แล้ว">
                                           <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.122.295.079.756.039 1.066l-.172 1.028c-.05.293-.239 1.168 1.026.634 1.265-.534 6.817-4.01 9.324-6.883 1.83-2.096 2.69-4.041 2.69-6.045z"/></svg>
                                       </span>
                                   )}
                               </h4>
                               <p className="text-[10px] text-gray-500 font-mono flex items-center mt-1"><Phone size={10} className="mr-1 shrink-0"/>{customer.computedPhone || '-'}</p>
                               {customer.createdAtTimestamp > 0 && (
                                   <p className="text-[9px] text-emerald-600 font-medium mt-0.5">
                                       ลงทะเบียน: {new Date(customer.createdAtTimestamp).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                                   </p>
                               )}
                            </div>
                         </div>
                         <div className="pl-2 flex-1">
                             <div className="flex flex-wrap gap-1.5 mb-3">
                                 {customer.createdAtTimestamp > 0 && (
                                     <div className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center">
                                         ✨ สมาชิกใหม่
                                     </div>
                                 )}
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

                  {filteredCustomers.length > customerLimit && (
                    <div className="flex flex-col items-center justify-center py-4 gap-2">
                      <p className="text-xs text-gray-400 font-bold">แสดง {Math.min(customerLimit, filteredCustomers.length)} จากทั้งหมด {filteredCustomers.length} คน</p>
                      <button 
                        onClick={() => setCustomerLimit(prev => prev + 100)} 
                        className="bg-white hover:bg-gray-50 border border-gray-200 px-6 py-2.5 rounded-2xl text-sm font-bold text-gray-700 shadow-sm active:scale-95 transition-all flex items-center gap-2"
                      >
                        <ChevronDown size={16} /> โหลดข้อมูลเพิ่มเติม (+100)
                      </button>
                    </div>
                  )}
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
                          const vipProgress = Math.min(100, Math.round((customer.productAccumulatedAmount / 5000) * 100));
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
                                      <h4 className="font-black text-gray-900 text-sm line-clamp-1 flex items-center gap-1">
                                          {customer.computedName}
                                          {customer.lineUid && (
                                              <span className="text-[#06C755]" title="เชื่อมต่อ LINE แล้ว">
                                                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.122.295.079.756.039 1.066l-.172 1.028c-.05.293-.239 1.168 1.026.634 1.265-.534 6.817-4.01 9.324-6.883 1.83-2.096 2.69-4.041 2.69-6.045z"/></svg>
                                              </span>
                                          )}
                                      </h4>
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

          {activeTab === 'mole_removal' && (
              <MoleRemovalSystem 
                  customersRaw={customersRaw}
                  histories={histories}
                  globalBranch={globalBranch}
                  triggerToast={showToast}
                  onNavigateToPos={(item) => {
                      // Note: passing selected info into POS could be done via a global state or simple activeTab switch.
                      setActiveTab('pos');
                      // If we wanted to add it to cart directly we would need to pass setCart or similar, 
                      // but for now navigating to POS is sufficient as they usually enter it there.
                  }}
                  onAddCustomer={() => setIsAddCustomerOpen(true)}
              />
          )}

          {activeTab === 'histories' && (
            <div className="flex flex-col h-full space-y-4 max-w-7xl mx-auto pb-12">
              {/* --- 1. FILTER & SEARCH TOOLBAR --- */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-5 space-y-3">
                 <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                    {/* Search Input */}
                    <div className="flex items-center flex-1 bg-gray-50 rounded-2xl px-3 py-2 border border-gray-200 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100 transition-all">
                       <Search size={18} className="text-gray-400 shrink-0" />
                       <input 
                          type="text" 
                          placeholder="ค้นหาชื่อลูกค้า, เบอร์โทร, ชื่อคอร์ส/สินค้า, เลขบิล, Ref, ผู้ให้บริการ..." 
                          value={searchInput} 
                          onChange={(e) => setSearchInput(e.target.value)} 
                          className="w-full mx-2 outline-none text-xs sm:text-sm bg-transparent text-gray-800 placeholder-gray-400" 
                       />
                       {searchInput && (
                          <button onClick={() => setSearchInput('')} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200">
                             <X size={14} />
                          </button>
                       )}
                    </div>

                    {/* Quick Filters Group */}
                    <div className="flex flex-wrap items-center gap-2">
                       {/* Period Filter Dropdown */}
                       <div className="relative">
                          <select 
                             value={historyPeriodFilter} 
                             onChange={(e) => setHistoryPeriodFilter(e.target.value)} 
                             className="bg-gray-50 hover:bg-gray-100 rounded-xl px-3 py-2 text-xs font-bold outline-none border border-gray-200 text-gray-700 cursor-pointer transition-colors"
                          >
                             <option value="all">📅 ทุกช่วงเวลา</option>
                             <option value="today">⚡ ประจำวันนี้</option>
                             <option value="yesterday">⏮️ เมื่อวานนี้</option>
                             <option value="7days">🗓️ 7 วันล่าสุด</option>
                             <option value="30days">🗓️ 30 วันล่าสุด</option>
                             <option value="this_month">📆 ประจำเดือนนี้</option>
                             <option value="last_month">📆 เดือนที่แล้ว</option>
                             <option value="custom">✏️ กำหนดช่วงวันที่เอง</option>
                          </select>
                       </div>

                       {/* Branch Filter Dropdown */}
                       <div className="relative">
                          <select 
                             value={historyBranchFilter} 
                             onChange={(e) => setHistoryBranchFilter(e.target.value)} 
                             className="bg-gray-50 hover:bg-gray-100 rounded-xl px-3 py-2 text-xs font-bold outline-none border border-gray-200 text-gray-700 cursor-pointer transition-colors"
                          >
                             <option value="all">🏢 ทุกสาขา</option>
                             {Array.from(new Set([...branches.map(b => b.name), 'เฉวง', 'ละไม'].map(br => String(br).replace(/^สาขา/,'').trim()))).filter(Boolean).map(br => (
                                <option key={br} value={br}>สาขา{br}</option>
                             ))}
                          </select>
                       </div>

                       {/* Action Type Dropdown */}
                       <div className="relative">
                          <select 
                             value={historyActionTypeFilter} 
                             onChange={(e) => setHistoryActionTypeFilter(e.target.value)} 
                             className="bg-gray-50 hover:bg-gray-100 rounded-xl px-3 py-2 text-xs font-bold outline-none border border-gray-200 text-gray-700 cursor-pointer transition-colors"
                          >
                             <option value="all">📋 ทุกประเภทรายการ</option>
                             <option value="usage">✂️ ตัดคอร์ส / รับบริการ</option>
                             <option value="purchase">🛒 ซื้อคอร์ส / สินค้า</option>
                             <option value="add">➕ เพิ่มครั้ง / อัปคอร์ส</option>
                             <option value="free">🎁 บริการฟรี / ของแถม</option>
                             <option value="credit">💳 หักเครดิต / โอน</option>
                          </select>
                       </div>

                       {/* Sort Dropdown */}
                       <div className="relative">
                          <select 
                             value={historySortBy} 
                             onChange={(e) => setHistorySortBy(e.target.value)} 
                             className="bg-gray-50 hover:bg-gray-100 rounded-xl px-3 py-2 text-xs font-bold outline-none border border-gray-200 text-gray-700 cursor-pointer transition-colors"
                          >
                             <option value="newest">⏱️ ใหม่ล่าสุดก่อน</option>
                             <option value="oldest">⏳ เก่าสุดก่อน</option>
                             <option value="amount_desc">💰 ยอดเงินสูงสุด</option>
                          </select>
                       </div>

                       {/* Reset Filter Button */}
                       {(historyPeriodFilter !== 'all' || historyBranchFilter !== 'all' || historyCategoryFilter !== 'all' || historyActionTypeFilter !== 'all' || searchInput !== '' || historyStartDate !== '' || historyEndDate !== '') && (
                          <button 
                             onClick={() => {
                                setHistoryPeriodFilter('all');
                                setHistoryBranchFilter('all');
                                setHistoryCategoryFilter('all');
                                setHistoryActionTypeFilter('all');
                                setHistorySortBy('newest');
                                setSearchInput('');
                                setHistoryStartDate('');
                                setHistoryEndDate('');
                                setHistoryLimit(60);
                             }}
                             className="px-2.5 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1 shrink-0"
                             title="ล้างตัวกรองทั้งหมด"
                          >
                             <RotateCcw size={12} /> ล้างตัวกรอง
                          </button>
                       )}
                    </div>
                 </div>

                 {/* Custom Date Range Picker (shown when custom is selected) */}
                 {historyPeriodFilter === 'custom' && (
                    <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center gap-2 animate-in fade-in duration-200">
                       <span className="text-xs font-bold text-gray-500">ระบุช่วงวันที่:</span>
                       <div className="flex items-center gap-1.5">
                          <label className="text-[11px] font-bold text-gray-400">ตั้งแต่</label>
                          <input 
                             type="date" 
                             value={historyStartDate} 
                             onChange={(e) => setHistoryStartDate(e.target.value)} 
                             className="bg-gray-50 rounded-xl px-2.5 py-1.5 text-xs font-bold border border-gray-200 outline-none" 
                          />
                       </div>
                       <div className="flex items-center gap-1.5">
                          <label className="text-[11px] font-bold text-gray-400">ถึง</label>
                          <input 
                             type="date" 
                             value={historyEndDate} 
                             onChange={(e) => setHistoryEndDate(e.target.value)} 
                             className="bg-gray-50 rounded-xl px-2.5 py-1.5 text-xs font-bold border border-gray-200 outline-none" 
                          />
                       </div>
                    </div>
                 )}
              </div>

              {/* --- 2. CATEGORY FILTER CHIPS BANNER --- */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 px-1 hide-scrollbar">
                 {[
                    { id: 'all', label: 'ทั้งหมด', icon: Activity, count: historyCategoryCounts.all, activeColor: 'bg-teal-600 text-white shadow-teal-200 ring-2 ring-teal-300' },
                    { id: 'facial', label: '✨ ทำหน้า / ทรีทเม้นท์', icon: Sparkles, count: historyCategoryCounts.facial, activeColor: 'bg-orange-500 text-white shadow-orange-200 ring-2 ring-orange-300' },
                    { id: 'acne', label: '💧 กดสิว / เคลียร์สิว', icon: Droplet, count: historyCategoryCounts.acne, activeColor: 'bg-blue-600 text-white shadow-blue-200 ring-2 ring-blue-300' },
                    { id: 'laser', label: '⚡ IPL / เลเซอร์', icon: Zap, count: historyCategoryCounts.laser, activeColor: 'bg-amber-500 text-white shadow-amber-200 ring-2 ring-amber-300' },
                    { id: 'mole', label: '🎯 จี้ไฝ / ติ่งเนื้อ', icon: Target, count: historyCategoryCounts.mole, activeColor: 'bg-rose-600 text-white shadow-rose-200 ring-2 ring-rose-300' },
                    { id: 'injection', label: '💉 ฉีด / โบท็อกซ์ / ฟิลเลอร์', icon: Syringe, count: historyCategoryCounts.injection, activeColor: 'bg-pink-600 text-white shadow-pink-200 ring-2 ring-pink-300' },
                    { id: 'vitamin', label: '💊 ดริปวิตามินผิว', icon: Pill, count: historyCategoryCounts.vitamin, activeColor: 'bg-emerald-600 text-white shadow-emerald-200 ring-2 ring-emerald-300' },
                    { id: 'product', label: '🛍️ ซื้อสินค้า / เวชสำอาง', icon: ShoppingBag, count: historyCategoryCounts.product, activeColor: 'bg-purple-600 text-white shadow-purple-200 ring-2 ring-purple-300' },
                    { id: 'free', label: '🎁 ของแถม / ฟรี', icon: Gift, count: historyCategoryCounts.free, activeColor: 'bg-teal-700 text-white shadow-teal-200 ring-2 ring-teal-300' },
                 ].map(cat => {
                    const isSelected = historyCategoryFilter === cat.id;
                    const IconComponent = cat.icon;
                    return (
                       <button
                          key={cat.id}
                          onClick={() => setHistoryCategoryFilter(cat.id)}
                          className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0 ${isSelected ? cat.activeColor : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}
                       >
                          <IconComponent size={14} className={isSelected ? 'text-white' : 'text-gray-400'} />
                          <span>{cat.label}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                             {cat.count}
                          </span>
                       </button>
                    );
                 })}
              </div>

              {/* --- 3. DYNAMIC SUMMARY KPI BOX --- */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                       <Activity size={20} />
                    </div>
                    <div>
                       <h3 className="font-black text-gray-800 text-sm sm:text-base flex items-center gap-2">
                         <span>ประวัติการใช้บริการ</span>
                         <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100">
                           {historyPeriodFilter === 'today' && `ประจำวันนี้ (${new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })})`}
                           {historyPeriodFilter === 'yesterday' && `เมื่อวานนี้ (${new Date(Date.now() - 86400000).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })})`}
                           {historyPeriodFilter === '7days' && '7 วันล่าสุด'}
                           {historyPeriodFilter === '30days' && '30 วันล่าสุด'}
                           {historyPeriodFilter === 'this_month' && `ประจำเดือนนี้ (${new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })})`}
                           {historyPeriodFilter === 'last_month' && `ประจำเดือนที่แล้ว`}
                           {historyPeriodFilter === 'custom' && `ช่วง ${historyStartDate || '...'} ถึง ${historyEndDate || '...'}`}
                           {historyPeriodFilter === 'all' && 'ทุกช่วงเวลาทั้งหมด'}
                         </span>
                       </h3>
                       <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                         {historyBranchFilter === 'all' ? 'ทุกสาขา' : `สาขา${historyBranchFilter}`} • {historyCategoryFilter === 'all' ? 'ทุกหมวดหมู่บริการ' : getHistoryCategoryInfo({ [getFuzzyKey({}, ["ประเภท"])]: historyCategoryFilter }).label}
                       </p>
                    </div>
                  </div>

                  {/* Summary Metrics Chips */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <div className="bg-teal-50 border border-teal-100 px-3 py-1.5 rounded-xl font-bold text-teal-700 flex items-center gap-1">
                       <span className="text-[10px] text-teal-600">รวม</span>
                       <span className="text-sm font-black">{historyFilteredSummary.totalCount}</span>
                       <span className="text-[10px]">รายการ</span>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl font-bold text-indigo-700 flex items-center gap-1">
                       <span className="text-[10px] text-indigo-600">รวม</span>
                       <span className="text-sm font-black">{historyFilteredSummary.totalQty}</span>
                       <span className="text-[10px]">ครั้ง</span>
                    </div>
                    {historyFilteredSummary.totalAmount > 0 && (
                      <div className="bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-xl font-bold text-orange-700 flex items-center gap-1">
                         <span className="text-[10px] text-orange-600">มูลค่า</span>
                         <span className="text-sm font-black">฿{historyFilteredSummary.totalAmount.toLocaleString()}</span>
                      </div>
                    )}
                    {historyFilteredSummary.uniqueCustomerCount > 0 && (
                      <div className="bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-xl font-bold text-purple-700 flex items-center gap-1">
                         <Users size={12} className="text-purple-600" />
                         <span className="text-sm font-black">{historyFilteredSummary.uniqueCustomerCount}</span>
                         <span className="text-[10px]">ลูกค้า</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Per Branch Cards Breakdown */}
                {historyFilteredSummary.totalCount === 0 ? (
                  <div className="text-center py-10 bg-gray-50/60 rounded-2xl border-2 border-dashed border-gray-200">
                    <HistoryIcon size={36} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-600 font-black text-sm mb-1">ยังไม่มีประวัติการใช้บริการตามช่วงเวลาหรือตัวกรองที่เลือก</p>
                    <p className="text-gray-400 text-xs mb-3">ลองปรับตัวกรองช่วงเวลา เช่น "7 วันล่าสุด", "เดือนนี้" หรือ "ทุกช่วงเวลา"</p>
                    {historyPeriodFilter !== 'all' && (
                       <button 
                          onClick={() => setHistoryPeriodFilter('all')} 
                          className="px-3.5 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-xl text-xs font-bold transition-colors border border-teal-200"
                       >
                          ดูประวัติทั้งหมดทุกช่วงเวลา
                       </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(historyFilteredSummary.branches).map(([branch, data]) => (
                      <div key={branch} className="bg-gradient-to-br from-gray-50/80 to-white rounded-2xl border border-gray-100 p-4 relative overflow-hidden shadow-xs">
                        <div className="absolute top-0 left-0 w-1 h-full bg-teal-400"></div>
                        <div className="flex items-center justify-between mb-3 pl-2">
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-teal-500" />
                            <span className="font-black text-gray-800 text-sm">{branch}</span>
                          </div>
                          <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full">{data.count} รายการ</span>
                        </div>
                        <div className="flex gap-3 mb-3 pl-2 text-[10px]">
                          <span className="text-gray-500 font-bold">จำนวนครั้ง: <span className="text-indigo-600 font-black">{data.qty}</span></span>
                          {data.amount > 0 && (
                            <span className="text-gray-500 font-bold">มูลค่า: <span className="text-orange-600 font-black">฿{data.amount.toLocaleString()}</span></span>
                          )}
                        </div>
                        <div className="space-y-1.5 max-h-44 overflow-y-auto hide-scrollbar pl-2">
                          {data.items.slice(0, 10).map((item, iIdx) => {
                            const customerName = String(getFuzzyKey(item, ["ชื่อลูกค้า", "col_2"]) || '-');
                            const itemName = String(getFuzzyKey(item, ["สินค้า", "ชื่อคอส", "รายการ", "col_18", "col_16", "col_23"]) || '-');
                            const timeStr = getFuzzyKey(item, ["เวลา", "time"]) || '';
                            const sortTime = getHistorySortTime(item);
                            const catInfo = getHistoryCategoryInfo(item);
                            return (
                              <div key={iIdx} className="flex items-center gap-2 text-[10px] bg-white rounded-xl px-2.5 py-1.5 border border-gray-100 shadow-2xs hover:bg-teal-50/30 transition-colors">
                                <span className="font-mono text-gray-400 shrink-0 w-10">
                                  {sortTime ? new Date(sortTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : timeStr}
                                </span>
                                <span className="font-bold text-gray-700 truncate flex-1">{customerName}</span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded border font-bold shrink-0 ${catInfo.color}`}>{catInfo.label.split(' / ')[0]}</span>
                                <span className="text-gray-400 truncate max-w-[80px]" title={itemName}>{itemName}</span>
                              </div>
                            );
                          })}
                          {data.items.length > 10 && (
                            <p className="text-[9px] text-gray-400 text-center font-bold pt-1">แสดง 10 จาก {data.items.length} รายการ</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* --- 4. DETAILED HISTORY CARDS LIST --- */}
              <div className="space-y-3">
                 <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-bold text-gray-500">
                       พบ <strong className="text-teal-600">{filteredHistories.length}</strong> รายการบริการ
                       {filteredHistories.length > historyLimit && ` (แสดง ${historyLimit} รายการแรก)`}
                    </span>
                    <span className="text-[11px] font-bold text-gray-400">
                       เรียงตาม: {historySortBy === 'newest' ? 'ใหม่ล่าสุดก่อน' : historySortBy === 'oldest' ? 'เก่าสุดก่อน' : 'ยอดเงินสูงสุด'}
                    </span>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {filteredHistories.slice(0, historyLimit).map((h, idx) => {
                       const catInfo = getHistoryCategoryInfo(h);
                       const CatIcon = catInfo.icon;
                       const customerName = String(getFuzzyKey(h, ["ชื่อลูกค้า", "col_2"]) || '-');
                       const customerPhone = String(getFuzzyKey(h, ["เบอร์โทร", "phone", "col_1"]) || '').trim();
                       const serviceName = String(getFuzzyKey(h, ["สินค้า", "ชื่อคอส", "รายการ", "col_18", "col_16", "col_23"]) || '-');
                       const typeStr = String(getFuzzyKey(h, ["ประเภท", "col_4"]) || '-');
                       const branchName = getHistoryBranch(h);
                       const refKey = String(getFuzzyKey(h, ["อ้างอิง", "เลขที่ใบคอส", "col_6", "courseRefKey"]) || '-');
                       const staffName = String(getFuzzyKey(h, ["ผู้ให้บริการ", "พนักงาน", "staff", "col_20", "col_21"]) || '').trim();
                       const billNo = String(getFuzzyKey(h, ["หมายเลขคำสั่งซื้อ", "เลขที่บิล", "เลขที่", "col_3"]) || '').trim();
                       const amount = parseNumber(getFuzzyKey(h, ["ยอดสินค้า", "ยอดจัดซื้อ", "ยอดเงิน", "ยอดเบิก", "ยอด", "col_19"]));
                       const qty = extractHistoryQty(h);
                       const sortTime = getHistorySortTime(h);
                       const dateStr = sortTime 
                          ? new Date(sortTime).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) 
                          : String(getFuzzyKey(h, ["วันที่", "col_1"]) || '-');
                       const timeStr = sortTime 
                          ? new Date(sortTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) 
                          : String(getFuzzyKey(h, ["เวลา", "time"]) || '');

                       return (
                          <div key={h.id || idx} className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group overflow-hidden">
                             <div className="space-y-2.5">
                                {/* Top Header: Category Badge + Date Time */}
                                <div className="flex justify-between items-start gap-2">
                                   <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-xl border ${catInfo.color}`}>
                                      <CatIcon size={12} strokeWidth={2.5} />
                                      {catInfo.label}
                                   </span>
                                   <div className="text-right shrink-0">
                                      <span className="font-mono text-[10px] font-bold text-gray-500 block">{dateStr}</span>
                                      {timeStr && <span className="font-mono text-[9px] text-gray-400 block">{timeStr} น.</span>}
                                   </div>
                                </div>

                                {/* Customer Info */}
                                <div>
                                   <h4 
                                      onClick={() => {
                                         if (customerPhone) {
                                            const matched = customersRaw.find(cu => String(getFuzzyKey(cu, ["เบอร์โทร", "col_3", "phone"]) || '').trim() === customerPhone);
                                            if (matched) setSelectedCustomer(matched);
                                         }
                                      }}
                                      className="font-black text-sm text-gray-900 line-clamp-1 hover:text-teal-600 transition-colors cursor-pointer flex items-center gap-1.5"
                                      title={customerPhone ? `คลิกดูข้อมูลลูกค้า: ${customerName}` : customerName}
                                   >
                                      <User size={14} className="text-gray-400 shrink-0" />
                                      <span>{customerName}</span>
                                      {customerPhone && <span className="text-[10px] text-gray-400 font-mono font-normal">({customerPhone})</span>}
                                   </h4>
                                </div>

                                {/* Service / Course / Product Name */}
                                <div className="bg-gray-50/70 p-3 rounded-2xl border border-gray-100">
                                   <p className="text-[10px] font-bold text-gray-400 mb-0.5">บริการ / รายการที่ทำ</p>
                                   <p className="text-xs font-black text-gray-800 line-clamp-2 leading-relaxed" title={serviceName}>
                                      {serviceName}
                                   </p>
                                   {qty > 1 && (
                                      <span className="inline-block mt-1 text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.2 rounded-md">
                                         ใช้งาน {qty} ครั้ง
                                      </span>
                                   )}
                                </div>

                                {/* Meta Tags: Branch, Type, Staff */}
                                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                                   <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1">
                                      <MapPin size={10} className="text-gray-400" />
                                      {branchName}
                                   </span>
                                   <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg font-bold border border-indigo-100">
                                      {typeStr}
                                   </span>
                                   {staffName && (
                                      <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg font-bold border border-amber-100" title={`ผู้ให้บริการ: ${staffName}`}>
                                         👤 {staffName}
                                      </span>
                                   )}
                                </div>
                             </div>

                             {/* Bottom Footer: Ref & Amount */}
                             <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 text-[10px]">
                                <div className="text-gray-400 font-mono truncate max-w-[160px]" title={`Ref: ${refKey} ${billNo ? `| บิล: ${billNo}` : ''}`}>
                                   <span>Ref: {refKey !== '-' ? refKey : billNo || '-'}</span>
                                </div>
                                {amount > 0 ? (
                                   <span className="font-black text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100">
                                      ฿{amount.toLocaleString()}
                                   </span>
                                ) : (
                                   <span className="text-[10px] text-gray-400 font-bold">
                                      {isFreeUsage(h) ? '🎁 บริการฟรี' : 'ตัดจากคอร์ส'}
                                   </span>
                                )}
                             </div>
                          </div>
                       );
                    })}
                 </div>

                 {/* Empty State */}
                 {filteredHistories.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 p-8 shadow-sm">
                       <HistoryIcon size={56} className="mx-auto text-gray-200 mb-3" />
                       <h4 className="text-base font-black text-gray-800 mb-1">ไม่พบข้อมูลประวัติบริการ</h4>
                       <p className="text-xs text-gray-400 max-w-md mx-auto mb-4">
                          ไม่พบประวัติการใช้บริการที่ตรงกับตัวกรองที่เลือก ลองเปลี่ยนช่วงเวลา หมวดหมู่ หรือคำค้นหาใหม่
                       </p>
                       <button
                          onClick={() => {
                             setHistoryPeriodFilter('all');
                             setHistoryBranchFilter('all');
                             setHistoryCategoryFilter('all');
                             setHistoryActionTypeFilter('all');
                             setSearchInput('');
                          }}
                          className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-xl text-xs font-bold transition-colors border border-teal-200"
                       >
                          ล้างตัวกรองเพื่อดูทั้งหมด
                       </button>
                    </div>
                 )}

                 {/* Load More Button */}
                 {filteredHistories.length > historyLimit && (
                    <div className="text-center pt-4 pb-6 flex items-center justify-center gap-3">
                       <button
                          onClick={() => setHistoryLimit(prev => prev + 60)}
                          className="px-6 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold text-xs rounded-2xl shadow-sm hover:shadow transition-all active:scale-95 flex items-center gap-1.5"
                       >
                          <span>โหลดเพิ่มอีก 60 รายการ</span>
                          <span className="text-[10px] text-gray-400 font-mono">({Math.min(filteredHistories.length, historyLimit + 60)} / {filteredHistories.length})</span>
                       </button>
                       <button
                          onClick={() => setHistoryLimit(filteredHistories.length)}
                          className="px-4 py-2.5 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-700 font-bold text-xs rounded-2xl transition-all active:scale-95"
                       >
                          แสดงทั้งหมด ({filteredHistories.length})
                       </button>
                    </div>
                 )}
              </div>
            </div>
          )}

          {activeTab === 'financials' && (
            <FinancialDashboard 
               orders={orders} 
               dailySales={dailySales} 
               appSettings={appSettings} 
               branches={branches}
               expenses={expenses}
               employees={employees}
               histories={histories}
               serviceLogs={serviceLogs}
               advancePayments={advancePayments}
               courses={courses}
               attendance={employeeAttendance}
            />
          )}

          {activeTab === 'calendar_dashboard' && (
            <CalendarBookingDashboard 
              bookings={bookings} 
              storeHolidays={storeHolidays} 
              branches={branches} 
              onSelectBooking={setBookingTicket}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              adminNotifConfig={adminNotifConfig}
              setAdminNotifConfig={setAdminNotifConfig}
              featureFlags={featureFlags}
              toggleFeatureFlag={toggleFeatureFlag}
              lineNotifConfig={lineNotifConfig}
              saveLineNotifConfig={saveLineNotifConfig}
              lineTestTarget={lineTestTarget}
              setLineTestTarget={setLineTestTarget}
              isSendingTest={isSendingTest}
              sendLineTestNotification={sendLineTestNotification}
              broadcastMsg={broadcastMsg}
              setBroadcastMsg={setBroadcastMsg}
              broadcastCoupon={broadcastCoupon}
              setBroadcastCoupon={setBroadcastCoupon}
              couponsForBroadcast={couponsForBroadcast}
              isBroadcasting={isBroadcasting}
              sendLineBroadcast={sendLineBroadcast}
              broadcastResult={broadcastResult}
              isDbConnected={isDbConnected}
              dbInfo={dbInfo}
              branches={branches}
              setMapPinTarget={setMapPinTarget}
              setIsMapPinModalOpen={setIsMapPinModalOpen}
              handleRunMigration={handleRunMigration}
              executeResetAllStock={executeResetAllStock}
              setActionConfirmModal={setActionConfirmModal}
              deleteButtons={deleteButtons}
              setConfirmDeleteModal={setConfirmDeleteModal}
              setIsClearDataModalOpen={setIsClearDataModalOpen}
              setIsMonthCleanupOpen={setIsMonthCleanupOpen}
              setCleanupPreview={setCleanupPreview}
              setCleanupInput={setCleanupInput}
              settingsSelectedCollection={settingsSelectedCollection}
              setSettingsSelectedCollection={setSettingsSelectedCollection}
              selectedItems={selectedItems}
              setSelectedItems={setSelectedItems}
              getCurrentCollectionData={getCurrentCollectionData}
              getItemDisplayName={getItemDisplayName}
              getItemSubInfo={getItemSubInfo}
              getItemDate={getItemDate}
              getItemStatus={getItemStatus}
              courses={courses}
              customersRaw={customersRaw}
              histories={histories}
              bookings={bookings}
              orders={orders}
              products={products}
              masterCourses={masterCourses}
              aiSurveys={aiSurveys}
              showToast={showToast}
              getFuzzyKey={getFuzzyKey}
            />
          )}
        </div>
      </main>

      {/* 🌟 Clear Test Data Modal 🌟 */}
      {isClearDataModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl flex flex-col p-6 border border-gray-100 animate-in zoom-in-95 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
            
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
               <AlertTriangle size={32} />
            </div>
            
            <h2 className="text-xl font-black text-center text-gray-800 mb-2">ยืนยันการล้างข้อมูลทดสอบ?</h2>
            
            <div className="text-sm text-gray-600 mb-6 bg-red-50 p-4 rounded-2xl border border-red-100 space-y-2">
              <p>ระบบจะทำการลบทิ้งข้อมูลต่อไปนี้ <strong>อย่างถาวร</strong>:</p>
              <ul className="list-disc pl-5 text-red-700 font-medium">
                <li>รายการขาย (Courses / Orders / Daily Sales)</li>
                <li>ประวัติการเข้ารับบริการ และการจองคิว</li>
                <li>ประวัติการลงเวลาเข้างาน/ลางาน/เบิกเงินล่วงหน้าของพนักงาน</li>
                <li>ข้อมูลรายจ่าย (Expenses)</li>
              </ul>
              <p className="pt-2 text-indigo-700 font-bold border-t border-red-200 mt-2">
                *จะเก็บข้อมูลลูกค้า, รายชื่อพนักงาน, พิกัดสาขา, เมนูสินค้า และการตั้งค่าระบบไว้ตามเดิม
              </p>
            </div>

            <p className="text-sm text-center text-gray-800 font-bold mb-2">เพื่อยืนยัน ให้พิมพ์คำว่า <span className="text-red-600 font-black tracking-widest bg-red-100 px-2 py-0.5 rounded">CONFIRM</span></p>
            <input 
              type="text" 
              value={clearDataInput} 
              onChange={e => setClearDataInput(e.target.value)}
              placeholder="พิมพ์ CONFIRM"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center font-bold tracking-widest uppercase focus:border-red-500 outline-none mb-6"
            />

            <div className="flex gap-3 mt-auto">
              <button disabled={isClearingData} onClick={() => { setIsClearDataModalOpen(false); setClearDataInput(''); }} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors">ยกเลิก</button>
              <button disabled={isClearingData} onClick={handleClearTestData} className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                {isClearingData ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
                {isClearingData ? 'กำลังล้างข้อมูล...' : 'ยืนยันลบทิ้ง'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🧹 Modal ล้างข้อมูลทดสอบเฉพาะเดือนปัจจุบัน */}
      {isMonthCleanupOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl flex flex-col p-6 border border-gray-100 animate-in zoom-in-95 relative overflow-hidden max-h-[92vh]">
            <div className="absolute top-0 left-0 w-full h-2 bg-orange-500"></div>

            <div className="w-14 h-14 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-3">
               <Trash2 size={28} />
            </div>
            <h2 className="text-lg font-black text-center text-gray-800 mb-1">ล้างข้อมูลทดสอบเดือนนี้</h2>
            <p className="text-[11px] text-center text-gray-500 mb-4">
              ลบรายการตั้งแต่ <b>{new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</b> ถึงปัจจุบัน
            </p>

            {/* กรองเบอร์ (ไม่กรอก = ทุกเบอร์) */}
            <label className="text-[11px] font-black text-gray-600 mb-1 block">กรองเฉพาะเบอร์ลูกค้า (ไม่กรอก = ทุกเบอร์ รวมของจริง — ใช้กับเบอร์ทดสอบแนะนำ)</label>
            <input
              type="tel"
              value={cleanupPhone}
              onChange={(e) => { setCleanupPhone(e.target.value); setCleanupPreview(null); }}
              placeholder="เช่น 0932120611"
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold mb-3 focus:border-orange-500 outline-none"
            />

            {/* เลือกประเภทข้อมูล */}
            <label className="text-[11px] font-black text-gray-600 mb-1.5 block">ประเภทข้อมูลที่จะลบ</label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { key: 'orders', label: 'คำสั่งซื้อ' },
                { key: 'bookings', label: 'การจองคิว' },
                { key: 'histories', label: 'ประวัติ/เครดิต' },
                { key: 'skinScans', label: 'สแกนผิว AI' },
              ].map(c => (
                <button key={c.key} onClick={() => { setCleanupCols(p => ({ ...p, [c.key]: !p[c.key] })); setCleanupPreview(null); }}
                  className={`py-2 rounded-xl text-xs font-bold border-2 transition-all ${cleanupCols[c.key] ? 'bg-orange-500 text-white border-orange-500 shadow' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                  {cleanupCols[c.key] ? '✓ ' : ''}{c.label}
                </button>
              ))}
            </div>

            {/* ปุ่มพรีวิว */}
            <button onClick={previewMonthCleanup} disabled={isCleaningMonth}
              className="w-full py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 mb-3">
              <Search size={16}/> ตรวจสอบก่อน (พรีวิว)
            </button>

            {/* ผลพรีวิว */}
            {cleanupPreview && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3 mb-3 space-y-1.5 animate-in fade-in">
                <p className="text-[11px] font-black text-orange-700">พบข้อมูลตามเงื่อนไข:</p>
                <div className="grid grid-cols-2 gap-1 text-[11px] font-bold text-gray-700">
                  <span>🧾 คำสั่งซื้อ: <b className="text-orange-600">{cleanupPreview.orders}</b></span>
                  <span>📅 การจอง: <b className="text-orange-600">{cleanupPreview.bookings}</b></span>
                  <span>📒 ประวัติ: <b className="text-orange-600">{cleanupPreview.histories}</b></span>
                  <span>📸 สแกนผิว: <b className="text-orange-600">{cleanupPreview.skinScans}</b></span>
                </div>
                {cleanupPreview.samples.length > 0 && (
                  <div className="border-t border-orange-200 pt-1.5">
                    {cleanupPreview.samples.map((s, i) => <p key={i} className="text-[9.5px] text-gray-500 truncate">• {s}</p>)}
                    {cleanupPreview.orders > 5 && <p className="text-[9px] text-gray-400">…และอีก {cleanupPreview.orders - 5} รายการ</p>}
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-center text-gray-800 font-bold mb-2">เพื่อยืนยัน พิมพ์คำว่า <span className="text-orange-600 font-black bg-orange-100 px-2 py-0.5 rounded">ลบ</span></p>
            <input
              type="text"
              value={cleanupInput}
              onChange={(e) => setCleanupInput(e.target.value)}
              placeholder="พิมพ์ ลบ"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center font-bold tracking-widest focus:border-orange-500 outline-none mb-4"
            />

            <div className="flex gap-3 mt-auto">
              <button disabled={isCleaningMonth} onClick={() => { setIsMonthCleanupOpen(false); setCleanupInput(''); setCleanupPreview(null); }}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors">ยกเลิก</button>
              <button disabled={isCleaningMonth || !cleanupPreview} onClick={handleMonthCleanup}
                className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                {isCleaningMonth ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
                {isCleaningMonth ? 'กำลังล้าง...' : 'ยืนยันลบ'}
              </button>
            </div>
            {!cleanupPreview && <p className="text-[10px] text-center text-gray-400 mt-2">* กด "ตรวจสอบก่อน" เพื่อเปิดปุ่มยืนยันลบ</p>}
          </div>
        </div>
      )}

      {/* 📮 Modal กรอกเลขพัสดุ (แทน window.prompt ที่เบราว์เซอร์ in-app บล็อก) */}
      {trackingInputModal && (() => {
          const tOrder = trackingInputModal.order;
          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setTrackingInputModal(null)}>
              <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl flex flex-col p-6 border border-gray-100 animate-in zoom-in-95 relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="absolute top-0 left-0 w-full h-2 bg-sky-500"></div>
                <div className="w-14 h-14 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-3">
                   <Truck size={28} />
                </div>
                <h2 className="text-lg font-black text-center text-gray-800 mb-1">กรอกเลขติดตามพัสดุ</h2>
                <p className="text-[11px] text-center text-gray-500 mb-4 leading-snug">
                  ออเดอร์ <b>#{tOrder.orderNo}</b> · {String(tOrder.courseName || tOrder.itemName || '-').slice(0, 40)}
                </p>
                <input
                  type="text"
                  autoFocus
                  value={trackingInputModal.value || ''}
                  onChange={(e) => setTrackingInputModal(p => ({ ...p, value: e.target.value }))}
                  placeholder="เช่น TH1234567890"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center font-mono font-bold tracking-wider mb-4 focus:border-sky-500 outline-none"
                />
                <div className="flex gap-3">
                  <button onClick={() => setTrackingInputModal(null)}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors">ยกเลิก</button>
                  <button
                    onClick={async () => {
                      const clean = String(trackingInputModal.value || '').trim();
                      if (!clean) return showToast('กรุณากรอกเลขพัสดุ', 'error');
                      try {
                        await updateDoc(getDocRef('orders', tOrder.id), { trackingNo: clean, status: 'ชำระเงินแล้ว', fulfillment: 'shipped', updatedAt: new Date().toISOString() });
                        showToast('บันทึกเลขพัสดุแล้ว — กำลังดึงสถานะ 17TRACK...', 'success');
                        setTrackingInputModal(null);
                        refreshTracking17({ ...tOrder, trackingNo: clean });
                      } catch (err) { showToast('บันทึกไม่สำเร็จ: ' + err.message, 'error'); }
                    }}
                    className="flex-1 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                    <Truck size={18}/> บันทึก + ดึงสถานะ
                  </button>
                </div>
              </div>
            </div>
          );
      })()}

      {/* 🌟 Select Courses To Print Modal (A4) 🌟 */}
      {isSelectCoursesToPrintOpen && selectedCustomer && (() => {
        const custCourses = getCustomerCourses(selectedCustomer.computedPhone);
        const allSelected = custCourses.length > 0 && custCourses.every(c => selectedCoursesForPrint.includes(c.id));
        return (
          <div className="fixed inset-0 z-[180] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-[28px] p-6 shadow-2xl flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black text-gray-800 flex items-center"><Printer size={20} className="mr-2 text-teal-600"/> เลือกใบคอร์สที่จะพิมพ์ (A4)</h3>
                <button onClick={() => setIsSelectCoursesToPrintOpen(false)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100"><X size={18}/></button>
              </div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-600 mb-3 cursor-pointer">
                <input type="checkbox" checked={allSelected} onChange={() => setSelectedCoursesForPrint(allSelected ? [] : custCourses.map(c => c.id))} className="w-4 h-4 accent-teal-600" />
                เลือกทั้งหมด ({custCourses.length} ใบ)
              </label>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {custCourses.map(c => (
                  <label key={c.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedCoursesForPrint.includes(c.id) ? 'border-teal-300 bg-teal-50/60' : 'border-gray-100 hover:bg-gray-50'}`}>
                    <input type="checkbox" checked={selectedCoursesForPrint.includes(c.id)} onChange={() => setSelectedCoursesForPrint(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id])} className="w-4 h-4 accent-teal-600" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-800 truncate">{String(getFuzzyKey(c, ["ชื่อคอส", "col_8"]) || '-')}</p>
                      <p className="text-[11px] text-gray-500 font-mono">{c.courseRefKey || '-'} • ใช้ {c.computedUsedQty}/{c.computedTotalQty} • {c.computedStatus}</p>
                    </div>
                  </label>
                ))}
              </div>
              <button
                disabled={selectedCoursesForPrint.length === 0}
                onClick={() => { setIsSelectCoursesToPrintOpen(false); setIsPrintMultiCourseMode(true); }}
                className="mt-4 w-full py-3 rounded-xl font-black text-white bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 flex items-center justify-center gap-2 shadow-md"
              >
                <Printer size={18}/> ดูตัวอย่าง / พิมพ์ {selectedCoursesForPrint.length} ใบ
              </button>
            </div>
          </div>
        );
      })()}

      {/* 🌟 Course Details Modal 🌟 */}
      {selectedCourse && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-3xl rounded-[32px] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-in zoom-in-95 border border-gray-100">
             <div className="p-6 sm:p-8 border-b border-gray-100 flex justify-between items-start bg-gradient-to-r from-teal-500 to-emerald-500 text-white relative">
                <div className="absolute right-0 top-0 w-48 h-48 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none"></div>
                <div className="relative z-10 flex-1 min-w-0 pr-4">
                   <div className="flex items-center gap-2.5 flex-wrap mb-1">
                     <h2 className="text-2xl sm:text-3xl font-black">{String(getFuzzyKey(selectedCourse, ["ชื่อคอส", "col_8"]) || '-')}</h2>
                     <button
                       onClick={() => setInspectorCourse(selectedCourse)}
                       className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all backdrop-blur-sm border border-white/20 active:scale-95 shadow-2xs"
                       title="ดูที่มาของข้อมูลใบคอร์สและฟิลด์ดิบในฐานข้อมูล"
                     >
                       <Database size={13} />
                       <span>ที่มาข้อมูลใบคอร์ส</span>
                     </button>
                   </div>
                   <p className="font-mono text-white/80 text-xs">Ref: {String(getFuzzyKey(selectedCourse, ["เลขที่ใบคอส", "col_2"]) || '-')}</p>
                </div>
                <button onClick={() => setSelectedCourse(null)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 relative z-10 shrink-0"><X size={20}/></button>
             </div>
             <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-gray-50/50">
                {/* 🌟 Informative banner if accidental session credit detected 🌟 */}
                {selectedCourse.isAccidentalSessionCredit && (
                  <div className="mb-6 bg-amber-50/90 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-black text-amber-950 text-sm">ตรวจพบที่มาของวงเงินเครดิต ฿{selectedCourse.rawExplicitCredit} บาท (มาจากจำนวนครั้ง)</p>
                        <p className="text-xs text-amber-800 mt-0.5">
                          ใบคอร์สนี้เป็นคอร์สบริการ {selectedCourse.computedTotalQty} ครั้ง ซึ่งในระบบเดิม (AppSheet) มีการกรอกเลข {selectedCourse.rawExplicitCredit} ซ้ำในช่อง "เครดิตที่ได้รับ" ระบบใหม่ได้ปรับตัดเป็น ฿0 ให้แล้ว
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setInspectorCourse(selectedCourse)}
                      className="px-3.5 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold shrink-0 shadow-2xs transition-colors"
                    >
                      ดูที่มา / ล้างฟิลด์ใน DB
                    </button>
                  </div>
                )}
                {/* 🌟 Closed Course Banner 🌟 */}
                {(selectedCourse.isClosed || selectedCourse.computedStatus === 'ปิดคอร์สแล้ว') && (
                  <div className="mb-6 bg-gradient-to-r from-rose-50 via-red-50 to-amber-50 border-2 border-rose-300 rounded-3xl p-5 shadow-sm relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
                          <Lock size={22} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-rose-900 text-base">ใบคอร์สนี้ถูกปิดคอร์สแล้ว (Closed)</h3>
                            <span className="text-[10px] font-bold bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full">จบคอร์สสมบูรณ์</span>
                          </div>
                          <p className="text-xs text-rose-700 font-bold mt-1">
                            สาเหตุการปิดคอร์ส: <span className="font-black text-rose-950 underline">{selectedCourse.closeReason || 'ปิดคอร์ส'}</span>
                          </p>
                          {selectedCourse.closeNote && (
                            <p className="text-xs text-rose-800 mt-1.5 bg-white/80 p-2.5 rounded-xl border border-rose-200 font-medium">
                              📝 หมายเหตุ: {selectedCourse.closeNote}
                            </p>
                          )}
                          <div className="text-[11px] text-rose-600/90 mt-2 flex flex-wrap gap-x-4 gap-y-1">
                            {selectedCourse.closedAt && <span>📅 ปิดเมื่อ: {new Date(selectedCourse.closedAt).toLocaleString('th-TH')}</span>}
                            {selectedCourse.closedBy && <span>👤 ผู้ดำเนินการ: {selectedCourse.closedBy}</span>}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setCloseCourseModalData({ isOpen: true, course: selectedCourse })}
                        className="bg-white hover:bg-rose-100 text-rose-700 border border-rose-300 px-3.5 py-2 rounded-xl text-xs font-black shadow-sm transition-all shrink-0 active:scale-95"
                      >
                        จัดการ / เปิดคอร์สใหม่
                      </button>
                    </div>

                    {/* Paper Photos Gallery Preview */}
                    {selectedCourse.paperCoursePhotos && selectedCourse.paperCoursePhotos.length > 0 && (
                      <div className="mt-4 pt-3.5 border-t border-rose-200">
                        <p className="text-xs font-black text-rose-900 mb-2 flex items-center gap-1.5">
                          <Camera size={14} className="text-rose-700" />
                          รูปถ่ายใบคอร์สกระดาษเดิมที่แนบไว้ ({selectedCourse.paperCoursePhotos.length} รูป):
                        </p>
                        <div className="flex flex-wrap gap-2.5">
                          {selectedCourse.paperCoursePhotos.map((url, pIdx) => (
                            <a 
                              key={pIdx} 
                              href={url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="w-20 h-20 rounded-2xl border-2 border-rose-200 overflow-hidden shadow-sm hover:scale-105 transition-all block relative group bg-white"
                              title="คลิกเพื่อดูรูปขนาดเต็ม"
                            >
                              <img src={url} alt={`Paper ${pIdx + 1}`} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <Eye size={18} />
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Paper Photos banner if course is not closed but has paper photos attached */}
                {!(selectedCourse.isClosed || selectedCourse.computedStatus === 'ปิดคอร์สแล้ว') && selectedCourse.paperCoursePhotos && selectedCourse.paperCoursePhotos.length > 0 && (
                  <div className="mb-6 bg-teal-50/70 border border-teal-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Camera size={20} className="text-teal-600" />
                      <div>
                        <p className="text-xs font-black text-teal-900">มีรูปถ่ายใบคอร์สกระดาษเดิม ({selectedCourse.paperCoursePhotos.length} รูป)</p>
                        <p className="text-[10px] text-teal-700">สามารถคลิกดูรูปหรือกดจัดการปิดคอร์สเพื่ออัปเดตสถานะได้</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2 overflow-hidden">
                        {selectedCourse.paperCoursePhotos.slice(0, 3).map((url, i) => (
                          <img key={i} src={url} alt="Paper" className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover" />
                        ))}
                      </div>
                      <button 
                        onClick={() => setCloseCourseModalData({ isOpen: true, course: selectedCourse })}
                        className="bg-white hover:bg-teal-100 text-teal-800 border border-teal-300 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm"
                      >
                        ดูรูป / ปิดคอร์ส
                      </button>
                    </div>
                  </div>
                )}

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
                      <p className={`font-black text-2xl ${
                        selectedCourse.isClosed || selectedCourse.computedStatus === 'ปิดคอร์สแล้ว'
                          ? 'text-rose-600'
                          : selectedCourse.computedRemainQty > 0 
                            ? 'text-teal-600' 
                            : 'text-gray-500'
                      }`}>{selectedCourse.computedStatus}</p>
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                   <button 
                     disabled={selectedCourse.isClosed || selectedCourse.computedStatus === 'ปิดคอร์สแล้ว'}
                     onClick={() => {
                       if (selectedCourse.isClosed || selectedCourse.computedStatus === 'ปิดคอร์สแล้ว') {
                         showToast('คอร์สนี้ถูกปิดแล้ว ไม่สามารถตัดใช้บริการได้', 'error');
                         return;
                       }
                       setPosPreselectedCustomer(selectedCustomer);
                       setActiveTab('pos');
                       setSelectedCustomer(null);
                       window.scrollTo({ top: 0, behavior: 'smooth' });
                     }} 
                     className={`py-3.5 rounded-2xl font-black shadow-lg flex items-center justify-center text-sm active:scale-95 transition-all ${
                       selectedCourse.isClosed || selectedCourse.computedStatus === 'ปิดคอร์สแล้ว'
                         ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                         : 'bg-teal-500 hover:bg-teal-600 text-white shadow-teal-500/30'
                     }`}
                   >
                     <CheckCircle className="mr-1.5" size={18} /> รับบริการ / เบิก (POS)
                   </button>

                   <button 
                     onClick={() => setIsPrintSingleCourseMode(true)} 
                     className="bg-gray-900 hover:bg-gray-800 text-white py-3.5 rounded-2xl font-black shadow-lg flex items-center justify-center text-sm active:scale-95 transition-all"
                   >
                     <Printer className="mr-1.5" size={18} /> พิมพ์ใบคอร์ส
                   </button>

                   <button 
                     onClick={() => setCloseCourseModalData({ isOpen: true, course: selectedCourse })}
                     className={`py-3.5 rounded-2xl font-black shadow-sm border flex items-center justify-center text-sm active:scale-95 transition-all ${
                       selectedCourse.isClosed || selectedCourse.computedStatus === 'ปิดคอร์สแล้ว'
                         ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                         : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
                     }`}
                   >
                     {selectedCourse.isClosed || selectedCourse.computedStatus === 'ปิดคอร์สแล้ว' ? (
                       <>
                         <Lock className="mr-1.5" size={18} /> จัดการปิดคอร์ส / ใบกระดาษ
                       </>
                     ) : (
                       <>
                         <Lock className="mr-1.5 text-rose-600" size={18} /> ปิดคอร์ส / แนบใบกระดาษ
                       </>
                     )}
                   </button>
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
                <div className="flex justify-end gap-2 mb-6 relative z-10 w-full flex-wrap">
                    {(!selectedCustomer.isApproved || selectedCustomer.computedMemberStatus !== 'สมาชิกระดับ VIP') && (
                        <button 
                          onClick={() => setIsVipFormOpen(true)} 
                          className="p-2.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full hover:from-amber-600 hover:to-orange-600 transition-all text-white shadow-lg flex items-center gap-1.5 px-4 active:scale-95 cursor-pointer animate-pulse" 
                          title="ส่งข้อมูลอัปเกรดสมาชิก VIP"
                        >
                          <Award size={16}/>
                          <span className="text-[11px] font-bold tracking-wider">⭐ ส่งข้อมูลอัปเกรด VIP</span>
                        </button>
                    )}
                    <button onClick={() => { 
                      const cCourses = getCustomerCourses(selectedCustomer.computedPhone).filter(c => (c.computedTotalCredit || 0) > 0);
                      setActiveCreditCourses(cCourses);
                      setIsCreditModalOpen(true); 
                    }} className="p-2.5 bg-blue-500 hover:bg-blue-600 transition-colors text-white shadow-sm flex items-center gap-1.5 px-4 rounded-full" title="จัดการวงเงินเครดิต">
                        <Wallet size={16}/><span className="text-[11px] font-bold tracking-wider hidden sm:inline">จัดการวงเงินเครดิต</span>
                    </button>
                    <button onClick={() => { 
                      setEditCustomerData({ 
                        id: selectedCustomer.id, 
                        name: selectedCustomer.computedName || '',
                        firstName: selectedCustomer.firstName || (selectedCustomer.computedName ? selectedCustomer.computedName.split(' ')[0] : ''),
                        lastName: selectedCustomer.lastName || (selectedCustomer.computedName ? selectedCustomer.computedName.split(' ').slice(1).join(' ') : ''),
                        nickname: selectedCustomer.nickname || '',
                        phone: selectedCustomer.computedPhone || selectedCustomer.เบอร์โทร || '',
                        gender: selectedCustomer.gender || 'หญิง',
                        dob: selectedCustomer.dob || '',
                        age: selectedCustomer.age || '',
                        citizenId: selectedCustomer.citizenId || selectedCustomer.เลขประจำตัวประชาชน || selectedCustomer.idCard || '',
                        issue: selectedCustomer.computedIssue || selectedCustomer.ปัญหาผิวหน้า || selectedCustomer.issue || '',
                        photoFile: null,
                        photoPreview: selectedCustomer.imageUrl || selectedCustomer.photoUrl || selectedCustomer.customerPhoto || null,
                        photoBase64: null,
                        aiSkinScanResult: selectedCustomer.aiSkinScanResult || null,
                        idCardPhotoFile: null,
                        idCardPhotoPreview: selectedCustomer.idCardUrl || selectedCustomer.idCardPhotoUrl || null,
                        idCardPhotoBase64: null,
                        addressNo: selectedCustomer.addressNo || '',
                        subDistrict: selectedCustomer.subDistrict || '',
                        district: selectedCustomer.district || '',
                        province: selectedCustomer.province || '',
                        zipcode: selectedCustomer.zipcode || '',
                        isVipUpgrade: selectedCustomer.isApproved || selectedCustomer.computedMemberStatus === 'สมาชิกระดับ VIP',
                        hasMemberCard: selectedCustomer.hasMemberCard || !!selectedCustomer.membershipCardNo,
                        memberCardNo: selectedCustomer.membershipCardNo || selectedCustomer.memberCardNo || '',
                        memberCardPhotoFile: null,
                        memberCardPhotoPreview: selectedCustomer.memberCardPhotoUrl || null,
                        memberCardPhotoBase64: null,
                      }); 
                      setIsEditCustomerOpen(true); 
                    }} className="p-2.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors text-white shadow-sm" title="แก้ไขข้อมูลลูกค้า"><PenTool size={18}/></button>
                    <button onClick={handleOpenSelectPrint} className="p-2.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors text-white shadow-sm" title="พิมพ์ใบคอร์สหลายใบ"><Printer size={18}/></button>
                    <button onClick={handlePrintView} className="p-2.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors text-white shadow-sm" title="พิมพ์ประวัติ/บัตรสมาชิก"><FileText size={18}/></button>
                    <button onClick={() => setActionConfirmModal({ isOpen: true, title: 'ลบข้อมูลลูกค้า', message: 'ยืนยันการลบข้อมูลลูกค้านี้ทิ้งถาวร ใช่หรือไม่?', action: () => executeDeleteCustomer(selectedCustomer.id), confirmText: 'ลบทิ้ง', confirmColor: 'bg-red-600 hover:bg-red-700' })} className="p-2.5 bg-red-500/80 rounded-full hover:bg-red-500 transition-colors text-white shadow-sm ml-2" title="ลบข้อมูลลูกค้า"><Trash2 size={18}/></button>
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
                            {selectedCustomer.isApproved && <button onClick={() => setIsVipFormOpen(true)} className="bg-orange-500 hover:bg-orange-600 transition-colors text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center active:scale-95 cursor-pointer" title="ดู/สร้างใบสมัคร VIP"><Award size={12} className="mr-1"/> VIP</button>}
                        </div>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 text-white/90 text-sm">
                            <p className="font-mono flex items-center bg-white/10 px-3 py-1.5 rounded-xl"><Phone size={16} className="mr-2 opacity-70"/>{selectedCustomer.computedPhone}</p>
                            <p className="flex items-center bg-white/10 px-3 py-1.5 rounded-xl"><Users size={16} className="mr-2 opacity-70"/> สถานะ: <span className="font-bold ml-1 text-white">{selectedCustomer.computedMemberStatus}</span></p>
                            {selectedCustomer.membershipCardNo && (
                              <p className="flex items-center bg-amber-400/25 border border-amber-300/40 px-3 py-1.5 rounded-xl text-amber-100 font-bold">
                                <Award size={16} className="mr-2 text-amber-300"/> บัตรสมาชิก: <span className="text-white ml-1 font-mono">{selectedCustomer.membershipCardNo}</span>
                              </p>
                            )}
                            <p className="flex items-center bg-white/10 px-3 py-1.5 rounded-xl"><AlertCircle size={16} className="mr-2 opacity-70"/> ปัญหาผิว: {selectedCustomer.computedIssue || 'ไม่ระบุ'}</p>
                            <p className="flex items-center bg-white/10 px-3 py-1.5 rounded-xl"><MapPin size={16} className="mr-2 opacity-70"/> ที่อยู่: {String(getFuzzyKey(selectedCustomer, ['ที่อยู่', 'col_4', 'address']) || 'ไม่ระบุ')}</p>
                        </div>
                    </div>

                    {/* ยอดสะสม (จัดลงกล่องแยกให้ชัดเจนและไม่ทับ) */}
                    <div className="grid grid-cols-2 gap-3 shrink-0 mt-4 sm:mt-0 w-full sm:w-auto">
                        <div className="bg-orange-500/20 backdrop-blur-md border border-orange-400/30 rounded-2xl p-4 text-center min-w-[120px] shadow-lg">
                            <p className="text-[10px] text-orange-100 uppercase tracking-widest font-bold mb-1">สะสมสินค้า (VIP)</p>
                            <p className="text-2xl font-black text-white drop-shadow-md">฿{selectedCustomer.productAccumulatedAmount?.toLocaleString() || '0'}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center min-w-[120px] shadow-lg">
                            <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold mb-1">สะสมรวม (ทั้งหมด)</p>
                            <p className="text-2xl font-black text-white drop-shadow-md">฿{selectedCustomer.realAccumulatedAmount?.toLocaleString() || '0'}</p>
                        </div>
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
                    <button onClick={() => setCustomerModalTab('documents')} className={`py-4 px-4 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${customerModalTab === 'documents' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>เอกสาร/แฟ้ม</button>
                    <button onClick={() => setCustomerModalTab('shipping')} className={`py-4 px-4 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${customerModalTab === 'shipping' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>ประวัติจัดส่ง</button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    
                    {/* แท็บ ใบคอร์สที่ซื้อ */}
                    {customerModalTab === 'courses' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="font-black text-gray-800 flex items-center text-lg"><FileText className="mr-2 text-indigo-500"/> ใบคอร์สรับบริการทั้งหมด</h4>
                                <div className="flex gap-2">
                                <button onClick={() => { setNewCourseForm({...newCourseForm, phone: selectedCustomer.computedPhone}); setIsAddCourseOpen(true); }} className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold px-3 py-2 rounded-lg flex items-center transition-colors shadow-sm">
                                    <Plus size={14} className="mr-1"/> เปิดคอร์ส
                                </button>
                                <button onClick={() => { 
                                  const cCourses = getCustomerCourses(selectedCustomer.computedPhone).filter(c => (c.computedTotalCredit || 0) > 0);
                                  setActiveCreditCourses(cCourses);
                                  setIsCreditModalOpen(true); 
                                }} className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold px-3 py-2 rounded-lg flex items-center transition-colors shadow-sm">
                                    <Wallet size={14} className="mr-1"/> จัดการวงเงินเครดิต
                                </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {getDisplayCourses(selectedCustomer.computedPhone).map(c => {
                                    const isPendingPayment = c.computedPendingAmount > 0;
                                    return (
                                        <div key={c.id} onClick={() => { setSelectedCustomer(null); setSelectedCourse(c); }} className={`bg-white border-2 ${isPendingPayment ? 'border-red-100 hover:border-red-300' : 'border-gray-100 hover:border-teal-200'} rounded-2xl p-4 cursor-pointer shadow-sm hover:shadow-lg transition-all relative overflow-hidden group`}>
                                            <div className={`absolute top-0 left-0 w-1.5 h-full ${c.computedStatus === 'ยังคงเหลือ' ? 'bg-teal-400' : c.computedStatus === 'หมดอายุ' ? 'bg-rose-400' : 'bg-gray-300'}`}></div>
                                            <div className="flex justify-between items-start mb-2 pl-2">
                                                <p className="font-bold text-teal-700 text-sm line-clamp-1">{String(getFuzzyKey(c, ["ชื่อคอส", "col_8"]) || '-')}</p>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    {globalRole === 'owner' && (
                                                        <button 
                                                          onClick={(e) => { e.stopPropagation(); handleDeleteCourse(c.id, c.courseRefKey); }}
                                                          className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                                          title="ลบใบคอร์ส (เฉพาะเจ้าของร้าน)"
                                                        >
                                                          <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${c.computedStatus === 'ยังคงเหลือ' ? 'bg-teal-50 text-teal-700 border border-teal-200' : c.computedStatus === 'ใช้ครบแล้ว' ? 'bg-blue-50 text-blue-700 border border-blue-200' : c.computedStatus === 'หมดอายุ' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>{c.computedStatus}</span>
                                                </div>
                                            </div>
                                            <div className="pl-2 mb-3">
                                                <p className="text-[10px] text-gray-500 font-mono mb-1">{c.courseRefKey}</p>
                                                <div className="flex flex-wrap gap-1 mb-1">
                                                    <span className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md text-[9px] font-bold border border-indigo-100 mr-0.5">
                                                        อายุ {c.durationText || '1 ปี'}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-gray-400 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                                        <Calendar size={9}/>
                                                        ซื้อ: {String(getFuzzyKey(c, ["วันที่ซื้อ", "col_3"]) || '-')}
                                                    </span>
                                                    {c.computedExpireDate !== '-' && (
                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${c.daysLeft !== null && c.daysLeft < 0 ? 'text-rose-600 bg-rose-50 border border-rose-100' : (c.daysLeft !== null && c.daysLeft <= 180) ? 'text-orange-600 bg-orange-50 border border-orange-100' : 'text-gray-400 bg-gray-50 border border-gray-100'}`}>
                                                            <Clock size={9}/>
                                                            {c.daysLeft !== null && c.daysLeft >= 0 ? `หมดอายุใน ${c.daysLeft} วัน` : (c.daysLeft !== null && c.daysLeft < 0 ? 'หมดอายุแล้ว' : `หมดอายุ: ${c.computedExpireDate}`)}
                                                        </span>
                                                    )}
                                                </div>
                                                {isPendingPayment && <p className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded inline-block">ค้างชำระ ฿{c.computedPendingAmount.toLocaleString()}</p>}
                                            </div>
                                            <div className="pt-3 border-t border-gray-50 pl-2">
                                                <div className="flex justify-between text-[11px] mb-1.5">
                                                    <span className="text-gray-500 font-bold">ใช้ไปแล้ว <span className="font-black text-gray-900 text-xs mx-0.5">{c.computedUsedQty}</span>/{c.computedTotalQty}</span>
                                                    <span className="text-teal-600 font-black text-xs">เหลือ {c.computedRemainQty} ครั้ง</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all duration-1000 ${isPendingPayment ? 'bg-gradient-to-r from-red-400 to-orange-400' : 'bg-gradient-to-r from-teal-400 to-emerald-400'}`} style={{ width: `${(c.computedUsedQty / Math.max(1, c.computedTotalQty)) * 100}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                                {getDisplayCourses(selectedCustomer.computedPhone).length === 0 && <div className="col-span-full text-center py-10 text-gray-400 text-sm font-bold">ยังไม่มีข้อมูลใบคอร์ส</div>}
                            </div>
                        </div>
                    )}
                    
                    {customerModalTab === 'timeline' && (
                        <div className="space-y-2">
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
                                        <div className="space-y-2">
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

                    {/* แท็บ เอกสาร/แฟ้ม */}
                    {customerModalTab === 'documents' && (
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="font-black text-gray-800 flex items-center text-lg"><Layers className="mr-2 text-blue-500"/> เอกสาร/แฟ้มเก็บข้อมูล</h4>
                                <div className="flex items-center gap-2">
                                    <button 
                                      onClick={() => handleOpenIrisIntake(selectedCustomer)} 
                                      className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold px-3 py-2 rounded-lg flex items-center transition-colors shadow-xs border border-emerald-200 cursor-pointer"
                                    >
                                        <FileCheck size={14} className="mr-1.5 text-emerald-600"/> 📋 ใบบันทึกประวัติ (IrisPatient)
                                    </button>
                                    <button onClick={() => setIsAddDocumentOpen(true)} className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold px-3 py-2 rounded-lg flex items-center transition-colors shadow-sm cursor-pointer">
                                        <Plus size={14} className="mr-1"/> เพิ่มเอกสารใหม่
                                    </button>
                                </div>
                            </div>
                            {customerDocuments.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                                                <th className="p-3">ประเภท</th>
                                                <th className="p-3">ชื่อเอกสาร</th>
                                                <th className="p-3">สถานที่เก็บ / ลิงก์</th>
                                                <th className="p-3">วันที่เพิ่ม</th>
                                                <th className="p-3">จัดการ</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm text-gray-700">
                                            {customerDocuments.map(docItem => (
                                                <tr key={docItem.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                                    <td className="p-3">
                                                        {docItem.type === 'physical' ? 
                                                            <span className="flex items-center text-orange-600 bg-orange-50 px-2 py-1 rounded-md text-xs font-bold w-max"><Package size={14} className="mr-1"/> แฟ้มกระดาษ</span> : 
                                                            <span className="flex items-center text-blue-600 bg-blue-50 px-2 py-1 rounded-md text-xs font-bold w-max"><FileText size={14} className="mr-1"/> ไฟล์ดิจิตอล</span>
                                                        }
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="font-bold text-gray-800">{docItem.title}</div>
                                                        {docItem.notes && <div className="text-xs text-gray-500 mt-1">{docItem.notes}</div>}
                                                    </td>
                                                    <td className="p-3">
                                                        {docItem.type === 'physical' ? (
                                                            <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded-md text-xs border border-gray-200 break-all">{docItem.physicalLocation || '-'}</span>
                                                        ) : (
                                                            <a href={docItem.fileUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-xs flex items-center">เปิดดูไฟล์ <Eye size={12} className="ml-1"/></a>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-xs text-gray-500">{new Date(docItem.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString('th-TH')}</td>
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-1.5">
                                                            {(docItem.intakeData || (docItem.title && docItem.title.includes('IrisPatient'))) && (
                                                                <button 
                                                                    onClick={() => handleOpenIrisIntake(selectedCustomer, docItem.intakeData, false, 'documents')} 
                                                                    className="text-emerald-600 hover:text-emerald-800 p-1.5 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors" 
                                                                    title="ดู/พิมพ์ใบบันทึกประวัติ IrisPatient"
                                                                >
                                                                    <Printer size={16}/>
                                                                </button>
                                                            )}
                                                            <button onClick={() => handleDeleteDocument(docItem)} className="text-red-400 hover:text-red-600 p-1.5 bg-red-50 rounded-lg hover:bg-red-100 transition-colors" title="ลบเอกสาร"><Trash2 size={16}/></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 text-gray-300">
                                        <Layers size={32}/>
                                    </div>
                                    <p className="text-gray-500 text-sm font-medium">ยังไม่มีการบันทึกเอกสารของลูกค้านี้</p>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {customerModalTab === 'shipping' && (() => {
                        const shippingOrders = orders.filter(o => o.customerPhone === selectedCustomer.computedPhone && o.trackingNo).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
                        return (
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="font-black text-gray-800 flex items-center text-lg"><Truck className="mr-2 text-sky-500"/> ประวัติการจัดส่งพัสดุ</h4>
                                </div>
                                {shippingOrders.length === 0 ? (
                                    <div className="text-center py-10">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 text-gray-300">
                                            <Truck size={32}/>
                                        </div>
                                        <p className="text-gray-500 text-sm font-medium">ไม่มีประวัติการจัดส่งพัสดุ</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {shippingOrders.map((o, idx) => (
                                            <div key={idx} className="bg-gray-50 rounded-2xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col h-full">
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className="text-[10px] font-bold bg-sky-100 text-sky-700 px-2 py-1 rounded-md uppercase tracking-wider">{o.trackingInfo?.carrier || (o.isIShip ? 'iShip' : 'พัสดุทั่วไป')}</span>
                                                    <span className="text-xs text-gray-500 font-mono">{o.createdAt?.toDate ? new Date(o.createdAt.toDate()).toLocaleDateString('th-TH') : new Date(o.createdAt || Date.now()).toLocaleDateString('th-TH')}</span>
                                                </div>
                                                <h3 className="font-black text-gray-800 text-base mb-1">{o.trackingNo}</h3>
                                                <p className="text-xs text-gray-600 mb-4 line-clamp-2" title={o.dst_address || o.shippingAddress || o.address || '-'}>{o.dst_address || o.shippingAddress || o.address || 'ไม่มีที่อยู่จัดส่ง'}</p>
                                                <div className="flex justify-between items-center text-[10px] border-t border-gray-200 pt-3 mt-auto">
                                                    <span className="font-bold text-gray-400">เลขออเดอร์: {o.orderNo || o.id?.substring(0, 8) || '-'}</span>
                                                    <a href={o.trackingInfo?.carrier ? `https://www.17track.net/en/track?nums=${o.trackingNo}` : `https://iship.cloud/track/${o.trackingNo}`} target="_blank" rel="noreferrer" className="text-sky-600 font-bold hover:underline flex items-center bg-white px-2 py-1 rounded shadow-sm border border-gray-100">
                                                        เช็คสถานะ <ExternalLink size={10} className="ml-1"/>
                                                    </a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Add Document Modal */}
      <ModalWrapper isOpen={isAddDocumentOpen} onClose={() => setIsAddDocumentOpen(false)} title="เพิ่มเอกสารใหม่" icon={Layers} colorClass="bg-blue-100 text-blue-600">
         {/* 🌟 แม่แบบเอกสารแนะนำ: ใบบันทึกประวัติ IrisPatient 🌟 */}
         <div className="mb-4 p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
           <div className="flex items-center gap-2.5">
             <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
               <FileCheck size={16} />
             </div>
             <div>
               <p className="text-xs font-black text-slate-800">ใบบันทึกประวัติลูกค้า Iris Queen Nature</p>
               <p className="text-[10px] text-slate-500">แบบฟอร์มประวัติการแพทย์ สภาพผิว ลายเซ็นยินยอม และพิมพ์ A4</p>
             </div>
           </div>
           <button
             type="button"
             onClick={() => {
               setIsAddDocumentOpen(false);
               handleOpenIrisIntake(selectedCustomer);
             }}
             className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all shrink-0 active:scale-95 cursor-pointer"
           >
             เปิดกรอกฟอร์ม ➜
           </button>
         </div>

         <form onSubmit={handleAddDocument} className="space-y-4">
             <InputField label="ชื่อเอกสาร" required placeholder="เช่น ใบยินยอม, ผลตรวจ, ใบเสร็จ..." value={newDocumentForm.title} onChange={e => setNewDocumentForm({...newDocumentForm, title: e.target.value})} />
             
             <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">ประเภทเอกสาร</label>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={newDocumentForm.type === 'physical'} onChange={() => setNewDocumentForm({...newDocumentForm, type: 'physical'})} className="text-blue-600 focus:ring-blue-500"/>
                        <span className="text-sm font-medium text-gray-700">แฟ้มกระดาษ</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={newDocumentForm.type === 'digital'} onChange={() => setNewDocumentForm({...newDocumentForm, type: 'digital'})} className="text-blue-600 focus:ring-blue-500"/>
                        <span className="text-sm font-medium text-gray-700">ไฟล์ดิจิตอล (อัปโหลด)</span>
                    </label>
                </div>
             </div>

             {newDocumentForm.type === 'physical' ? (
                 <InputField label="สถานที่เก็บ/หมายเลขอ้างอิง" required placeholder="เช่น แฟ้มเบอร์ 3 ชั้น B, ซองเอกสารสีแดง..." value={newDocumentForm.physicalLocation} onChange={e => setNewDocumentForm({...newDocumentForm, physicalLocation: e.target.value})} />
             ) : (
                 <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">อัปโหลดไฟล์ (PDF, รูปภาพ)</label>
                    <input type="file" accept="image/*,.pdf" onChange={(e) => setDocumentFile(e.target.files[0])} className="w-full border border-gray-200 p-2 rounded-xl text-sm" required />
                    {documentUploadProgress > 0 && documentUploadProgress < 100 && (
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${documentUploadProgress}%` }}></div>
                        </div>
                    )}
                 </div>
             )}

             <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">หมายเหตุ (ถ้ามี)</label>
                <textarea rows="2" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="รายละเอียดเพิ่มเติม..." value={newDocumentForm.notes} onChange={e => setNewDocumentForm({...newDocumentForm, notes: e.target.value})}></textarea>
             </div>

             <button type="submit" disabled={documentUploadProgress > 0 && documentUploadProgress < 100} className={`w-full text-white font-black py-3 rounded-xl mt-4 shadow-lg active:scale-95 transition-all ${documentUploadProgress > 0 && documentUploadProgress < 100 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>บันทึกเอกสาร</button>
         </form>
      </ModalWrapper>

      {/* Edit Customer Modal - Unified Rich Form */}
      <ModalWrapper 
        isOpen={isEditCustomerOpen} 
        onClose={() => setIsEditCustomerOpen(false)} 
        title="แก้ไขข้อมูลลูกค้า & สิทธิประโยชน์" 
        icon={PenTool} 
        colorClass="bg-indigo-100 text-indigo-700"
        maxWidth="max-w-xl"
        noMaxHeight={true}
      >
        <form onSubmit={handleEditCustomerSave} className="space-y-4 max-h-[75vh] overflow-y-auto px-1 hide-scrollbar">
          
          <div className="bg-indigo-50/90 border border-indigo-150 p-3 rounded-2xl flex items-center gap-2.5 text-indigo-900 text-xs">
            <Sparkles size={18} className="text-indigo-600 shrink-0" />
            <span>อัปเดตข้อมูลลูกค้า สแกนบัตรประชาชน ถ่ายภาพวิเคราะห์ผิวหน้า และส่งข้อมูลอัปเกรด VIP</span>
          </div>

          {/* 🪪 AI Thai National ID Card OCR Scanner 🪪 */}
          <div className="bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-indigo-50/90 border-2 border-sky-200/90 rounded-2xl p-3 sm:p-3.5 shadow-2xs relative overflow-hidden">
            <div className="flex items-center gap-3">
              {/* ID Card Thumbnail / Preview */}
              <div className="relative shrink-0">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white border-2 border-sky-200 shadow-xs overflow-hidden flex items-center justify-center relative">
                  {editCustomerData.idCardPhotoPreview ? (
                    <img 
                      src={editCustomerData.idCardPhotoPreview} 
                      alt="ID Card preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-sky-50/70 flex flex-col items-center justify-center text-sky-600 p-1 text-center">
                      <CreditCard size={22} className="text-sky-600 mb-0.5" />
                      <span className="text-[9px] font-bold text-sky-700 leading-tight">บัตร ปชช.</span>
                    </div>
                  )}

                  {isScanningIdCard && (
                    <div className="absolute inset-0 bg-sky-950/75 backdrop-blur-[1px] flex flex-col items-center justify-center text-white p-1 text-center">
                      <Loader2 size={20} className="animate-spin text-sky-300 mb-0.5" />
                      <span className="text-[9px] font-black text-sky-200">AI อ่านบัตร...</span>
                    </div>
                  )}
                </div>

                {editCustomerData.idCardPhotoPreview && !isScanningIdCard && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditCustomerData(prev => ({
                        ...prev,
                        idCardPhotoFile: null,
                        idCardPhotoPreview: null,
                        idCardPhotoBase64: null
                      }));
                    }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer"
                    title="ลบรูปบัตร"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Text & Buttons */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                    <Sparkles size={14} className="text-sky-600" /> สแกนบัตรประชาชนด้วย AI
                  </span>
                  {editCustomerData.citizenId ? (
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.2 rounded-full border border-emerald-200">
                      อ่านข้อมูลสำเร็จ ✨
                    </span>
                  ) : (
                    <span className="bg-sky-100 text-sky-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-sky-200">
                      กรอกฟอร์มอัตโนมัติ
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-tight mb-2">
                  ถ่ายรูปบัตรประชาชน AI จะช่วยอ่านชื่อ นามสกุล เพศ วันเกิด อายุ และที่อยู่อัตโนมัติทันที
                </p>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    disabled={isScanningIdCard}
                    onClick={() => editIdCardCameraInputRef.current?.click()}
                    className="px-2.5 py-1.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-bold rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Camera size={14} />
                    <span>{editCustomerData.idCardPhotoPreview ? 'ถ่ายบัตรใหม่' : 'ถ่ายรูปบัตรประชาชน'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isScanningIdCard}
                    onClick={() => editIdCardFileInputRef.current?.click()}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <ImageIcon size={14} className="text-sky-600" />
                    <span>{editCustomerData.idCardPhotoPreview ? 'เปลี่ยนรูป' : 'เลือกรูปบัตร'}</span>
                  </button>

                  {editCustomerData.idCardPhotoBase64 && !isScanningIdCard && (
                    <button
                      type="button"
                      onClick={() => handleAnalyzeIdCard(editCustomerData.idCardPhotoBase64, 'edit')}
                      className="px-2 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-xl border border-sky-200 transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                      title="ให้ AI อ่านบัตรใหม่อีกครั้ง"
                    >
                      <RefreshCw size={13} className="text-sky-600" />
                      <span>สแกนซ้ำ</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Hidden file inputs for ID Card Camera and Gallery */}
            <input 
              ref={editIdCardCameraInputRef}
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
              onChange={(e) => handleIdCardPhotoSelected(e, 'edit')}
            />
            <input 
              ref={editIdCardFileInputRef}
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => handleIdCardPhotoSelected(e, 'edit')}
            />
          </div>

          {/* 🌟 Customer Profile Photo & Instant AI Face/Skin Scan 🌟 */}
          <div className="bg-gradient-to-r from-indigo-50/90 via-purple-50/60 to-pink-50/90 border-2 border-indigo-150 rounded-2xl p-3 sm:p-3.5 shadow-2xs relative overflow-hidden">
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Photo Avatar / Preview */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-white border-2 border-indigo-200/80 shadow-xs overflow-hidden flex items-center justify-center relative group">
                  {editCustomerData.photoPreview ? (
                    <img 
                      src={editCustomerData.photoPreview} 
                      alt="Customer face preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-50/90 flex flex-col items-center justify-center text-slate-400 p-1 text-center">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-1 shadow-2xs">
                        <Camera size={18} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 leading-tight">ถ่ายรูปใบหน้า</span>
                    </div>
                  )}

                  {/* Scanning overlay on the photo */}
                  {isAnalyzingSkin && (
                    <div className="absolute inset-0 bg-indigo-950/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-white p-1 text-center">
                      <Loader2 size={24} className="animate-spin text-indigo-300 mb-1" />
                      <span className="text-[9px] font-black tracking-wide text-indigo-200">Iris AI สแกน...</span>
                    </div>
                  )}
                </div>

                {editCustomerData.photoPreview && !isAnalyzingSkin && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditCustomerData(prev => ({
                        ...prev,
                        photoFile: null,
                        photoPreview: null,
                        photoBase64: null,
                        aiSkinScanResult: null
                      }));
                    }}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer"
                    title="ลบรูปถ่าย"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Action Buttons & Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <span className="text-xs font-black text-slate-800">รูปถ่ายลูกค้า & ให้ AI วิเคราะห์ทันที</span>
                  {editCustomerData.aiSkinScanResult ? (
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.2 rounded-full border border-emerald-200">
                      AI สแกนสำเร็จ ✨
                    </span>
                  ) : (
                    <span className="bg-indigo-100 text-indigo-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-indigo-200">
                      Iris AI Face Scan
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-tight mb-2.5">
                  ถ่ายรูปหน้าตรงเพื่อวิเคราะห์ปัญหาผิว คาดคะเนอายุผิว และวางแผนโปรแกรมรักษาให้อัตโนมัติ
                </p>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    disabled={isAnalyzingSkin}
                    onClick={() => editCustomerCameraInputRef.current?.click()}
                    className="px-2.5 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Camera size={14} />
                    <span>{editCustomerData.photoPreview ? 'ถ่ายใหม่' : 'ถ่ายรูปใบหน้า'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isAnalyzingSkin}
                    onClick={() => editCustomerFileInputRef.current?.click()}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <ImageIcon size={14} className="text-indigo-500" />
                    <span>{editCustomerData.photoPreview ? 'เปลี่ยนรูป' : 'เลือกจากเครื่อง'}</span>
                  </button>

                  {editCustomerData.photoBase64 && !isAnalyzingSkin && (
                    <button
                      type="button"
                      onClick={() => handleAnalyzeCustomerPhoto(editCustomerData.photoBase64, 'edit')}
                      className="px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                      title="ให้ AI วิเคราะห์ใหม่อีกครั้ง"
                    >
                      <Sparkles size={13} className="text-indigo-600" />
                      <span>วิเคราะห์ใหม่</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Hidden file inputs for Camera and File picker */}
            <input 
              ref={editCustomerCameraInputRef}
              type="file" 
              accept="image/*" 
              capture="user" 
              className="hidden" 
              onChange={(e) => handleCustomerPhotoSelected(e, 'edit')}
            />
            <input 
              ref={editCustomerFileInputRef}
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => handleCustomerPhotoSelected(e, 'edit')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InputField 
              label="ชื่อ" 
              required 
              placeholder="เช่น คุณสมหญิง" 
              value={editCustomerData.firstName} 
              onChange={e => setEditCustomerData({
                ...editCustomerData, 
                firstName: e.target.value,
                name: `${e.target.value} ${editCustomerData.lastName || ''}`.trim()
              })} 
            />
            <InputField 
              label="นามสกุล" 
              placeholder="เช่น ใจดี" 
              value={editCustomerData.lastName} 
              onChange={e => setEditCustomerData({
                ...editCustomerData, 
                lastName: e.target.value,
                name: `${editCustomerData.firstName || ''} ${e.target.value}`.trim()
              })} 
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InputField 
              label="ชื่อเล่น" 
              placeholder="เช่น หญิง" 
              value={editCustomerData.nickname} 
              onChange={e => setEditCustomerData({...editCustomerData, nickname: e.target.value})} 
            />
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                เบอร์โทรศัพท์ <span className="text-red-500">*</span>
              </label>
              <input 
                type="tel"
                required
                maxLength={10}
                placeholder="08X-XXX-XXXX"
                value={editCustomerData.phone}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 10) setEditCustomerData({...editCustomerData, phone: val});
                }}
                className={`w-full border-2 bg-gray-50/50 rounded-xl p-3 text-sm outline-none transition-all font-medium text-gray-800 ${editCustomerData.phone && editCustomerData.phone.length === 10 ? 'border-emerald-400 focus:border-emerald-500 focus:bg-white' : 'border-gray-100 focus:border-indigo-400 focus:bg-white'}`}
              />
              {editCustomerData.phone && editCustomerData.phone.length < 10 && (
                <p className="text-amber-600 text-[10px] mt-1 font-bold">กรอกให้ครบ 10 หลัก (ปัจจุบัน {editCustomerData.phone.length} หลัก)</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><CreditCard size={14} className="text-sky-600"/> เลขประจำตัวประชาชน (13 หลัก)</span>
              {editCustomerData.citizenId && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${editCustomerData.citizenId.length === 13 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-sky-50 text-sky-700 border-sky-200'}`}>
                  {editCustomerData.citizenId.length === 13 ? '✓ ครบ 13 หลัก' : `${editCustomerData.citizenId.length}/13 หลัก`}
                </span>
              )}
            </label>
            <input 
              type="text"
              maxLength={17}
              placeholder="X-XXXX-XXXXX-XX-X"
              value={editCustomerData.citizenId || ''}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '');
                if (val.length <= 13) setEditCustomerData({...editCustomerData, citizenId: val});
              }}
              className="w-full border-2 border-gray-100 bg-gray-50/50 rounded-xl p-3 text-sm outline-none focus:border-sky-400 focus:bg-white transition-all font-mono font-bold text-gray-800 tracking-wider"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">เพศ</label>
              <select 
                value={editCustomerData.gender} 
                onChange={e => setEditCustomerData({...editCustomerData, gender: e.target.value})}
                className="w-full border-2 border-gray-100 bg-gray-50/50 rounded-xl p-3 text-sm outline-none focus:border-indigo-400 focus:bg-white transition-all font-medium text-gray-800"
              >
                <option value="หญิง">หญิง</option>
                <option value="ชาย">ชาย</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">วัน/เดือน/ปีเกิด (พ.ศ.)</label>
              <input 
                type="text"
                placeholder="วว/ดด/ปปปป"
                value={editCustomerData.dob}
                onChange={e => {
                  const val = e.target.value;
                  let newAge = editCustomerData.age;
                  const yearMatch = val.match(/\d{4}/);
                  if (yearMatch) {
                    const year = parseInt(yearMatch[0], 10);
                    const currentYearCE = new Date().getFullYear();
                    if (year > 2400 && year <= currentYearCE + 543) {
                      newAge = String(currentYearCE + 543 - year);
                    } else if (year > 1900 && year <= currentYearCE) {
                      newAge = String(currentYearCE - year);
                    }
                  }
                  setEditCustomerData({...editCustomerData, dob: val, age: newAge});
                }}
                className="w-full border-2 border-gray-100 bg-gray-50/50 rounded-xl p-3 text-sm outline-none focus:border-indigo-400 focus:bg-white transition-all font-medium text-gray-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">อายุ (ปี)</label>
              <input 
                type="number"
                placeholder="เช่น 28"
                value={editCustomerData.age}
                onChange={e => setEditCustomerData({...editCustomerData, age: e.target.value})}
                className="w-full border-2 border-gray-100 bg-gray-50/50 rounded-xl p-3 text-sm outline-none focus:border-indigo-400 focus:bg-white transition-all font-medium text-gray-800"
              />
            </div>
          </div>

          <InputField 
            label="ปัญหาผิวหน้า / ความกังวลที่ต้องการดูแล" 
            placeholder="เช่น สิวอักเสบ, ฝ้ากระ, ผิวแห้งขาดน้ำ, ริ้วรอย..." 
            value={editCustomerData.issue} 
            onChange={e => setEditCustomerData({...editCustomerData, issue: e.target.value})} 
          />

          {/* 🌟 AI Skin Analysis & Smart Treatment Matcher Banner 🌟 */}
          <SkinAiBanner 
            issue={editCustomerData.issue}
            onChangeIssue={(val) => setEditCustomerData({...editCustomerData, issue: val})}
            aiScanResult={editCustomerData.aiSkinScanResult}
            isAnalyzing={isAnalyzingSkin}
          />

          <div className="border-t border-slate-100 pt-3">
            <h4 className="text-xs font-bold text-slate-700 mb-2.5 flex items-center gap-1.5">
              <span>📍 ที่อยู่ลูกค้า (สำหรับส่งสินค้าหรือออกใบเสร็จ)</span>
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <InputField 
                label="บ้านเลขที่ / หมู่บ้าน / ถนน" 
                placeholder="เช่น 123/45 ม.2 ถ.ทวีราษฎร์ภักดี" 
                value={editCustomerData.addressNo} 
                onChange={e => setEditCustomerData({...editCustomerData, addressNo: e.target.value})} 
              />
              <InputField 
                label="ตำบล / แขวง" 
                placeholder="เช่น บ่อผุด" 
                value={editCustomerData.subDistrict} 
                onChange={e => setEditCustomerData({...editCustomerData, subDistrict: e.target.value})} 
              />
              <InputField 
                label="อำเภอ / เขต" 
                placeholder="เช่น เกาะสมุย" 
                value={editCustomerData.district} 
                onChange={e => setEditCustomerData({...editCustomerData, district: e.target.value})} 
              />
              <InputField 
                label="จังหวัด / รหัสไปรษณีย์" 
                placeholder="เช่น สุราษฎร์ธานี 84320" 
                value={editCustomerData.province} 
                onChange={e => setEditCustomerData({...editCustomerData, province: e.target.value})} 
              />
            </div>
          </div>

          {/* 🌟 บัตรสมาชิก & อัปเกรดสมาชิก VIP 🌟 */}
          <div className="bg-gradient-to-r from-amber-50/90 via-orange-50/70 to-yellow-50/90 border-2 border-amber-200/90 rounded-2xl p-3 sm:p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Award size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-950 flex items-center gap-1.5 flex-wrap">
                    <span>สิทธิ์บัตรสมาชิก & อัปเกรด VIP</span>
                    {editCustomerData.isVipUpgrade && (
                      <span className="bg-amber-200/90 text-amber-900 text-[9px] font-black px-1.5 py-0.2 rounded-full border border-amber-300">
                        สถานะ VIP ✨
                      </span>
                    )}
                  </h4>
                  <p className="text-[10px] text-amber-800/80 leading-tight">
                    ลูกค้ามีบัตรสมาชิก หรือต้องการส่งข้อมูลเพื่ออัปเกรดรับสิทธิประโยชน์ VIP
                  </p>
                </div>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input 
                  type="checkbox"
                  checked={editCustomerData.isVipUpgrade || editCustomerData.hasMemberCard}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setEditCustomerData(prev => ({
                      ...prev,
                      isVipUpgrade: checked,
                      hasMemberCard: checked
                    }));
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {(editCustomerData.isVipUpgrade || editCustomerData.hasMemberCard) && (
              <div className="mt-3 pt-3 border-t border-amber-200/70 space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>หมายเลขบัตรสมาชิก (Member Card No.)</span>
                    <span className="text-[10px] font-bold text-amber-700">รับสิทธิ์ VIP</span>
                  </label>
                  <input 
                    type="text"
                    placeholder="เช่น IRIS-VIP-8899 หรือ เบอร์โทร"
                    value={editCustomerData.memberCardNo}
                    onChange={(e) => setEditCustomerData(prev => ({ ...prev, memberCardNo: e.target.value }))}
                    className="w-full border-2 border-amber-200 bg-white rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-amber-400 font-mono tracking-wider"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-xl bg-white border-2 border-amber-200 shadow-2xs overflow-hidden flex items-center justify-center relative">
                      {editCustomerData.memberCardPhotoPreview ? (
                        <img 
                          src={editCustomerData.memberCardPhotoPreview} 
                          alt="Member Card" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-amber-50/50 flex flex-col items-center justify-center text-amber-600 p-1 text-center">
                          <CreditCard size={20} className="text-amber-500 mb-0.5" />
                          <span className="text-[8px] font-bold text-amber-800 leading-tight">รูปบัตร</span>
                        </div>
                      )}
                    </div>

                    {editCustomerData.memberCardPhotoPreview && (
                      <button
                        type="button"
                        onClick={() => setEditCustomerData(prev => ({
                          ...prev,
                          memberCardPhotoFile: null,
                          memberCardPhotoPreview: null,
                          memberCardPhotoBase64: null
                        }))}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-xs cursor-pointer"
                        title="ลบรูปบัตรสมาชิก"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-amber-950 mb-1">
                      แนบรูปถ่ายบัตรสมาชิก (สำหรับยืนยันสิทธิ์ VIP)
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => editMemberCardCameraInputRef.current?.click()}
                        className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                      >
                        <Camera size={13} />
                        <span>ถ่ายรูปบัตร</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => editMemberCardFileInputRef.current?.click()}
                        className="px-2.5 py-1.5 bg-white hover:bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                      >
                        <ImageIcon size={13} className="text-amber-600" />
                        <span>เลือกรูป</span>
                      </button>
                    </div>
                  </div>
                </div>

                <input 
                  ref={editMemberCardCameraInputRef}
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  className="hidden" 
                  onChange={(e) => handleMemberCardPhotoSelected(e, 'edit')}
                />
                <input 
                  ref={editMemberCardFileInputRef}
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => handleMemberCardPhotoSelected(e, 'edit')}
                />
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black py-3.5 rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            <Save size={18} />
            <span>บันทึกการแก้ไขข้อมูลลูกค้า</span>
          </button>
        </form>
      </ModalWrapper>

      {/* Add Customer Modal - Customer App Style */}
      <ModalWrapper 
        isOpen={isAddCustomerOpen} 
        onClose={() => setIsAddCustomerOpen(false)} 
        title="ลงทะเบียนลูกค้าใหม่" 
        icon={UserPlus} 
        colorClass="bg-teal-100 text-teal-700"
        maxWidth="max-w-xl"
        noMaxHeight={true}
      >
        <form onSubmit={handleAddCustomer} className="space-y-4 max-h-[75vh] overflow-y-auto px-1 hide-scrollbar">
          
          <div className="bg-teal-50/90 border border-teal-150 p-3 rounded-2xl flex items-center gap-2.5 text-teal-900 text-xs">
            <Sparkles size={18} className="text-teal-600 shrink-0" />
            <span>กรอกข้อมูลลูกค้าให้ครบถ้วนเพื่อสร้างประวัติในระบบและสะสมยอดสิทธิประโยชน์</span>
          </div>

          {/* 🪪 AI Thai National ID Card OCR Scanner 🪪 */}
          <div className="bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-indigo-50/90 border-2 border-sky-200/90 rounded-2xl p-3 sm:p-3.5 shadow-2xs relative overflow-hidden">
            <div className="flex items-center gap-3">
              {/* ID Card Thumbnail / Preview */}
              <div className="relative shrink-0">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white border-2 border-sky-200 shadow-xs overflow-hidden flex items-center justify-center relative">
                  {newCustomerForm.idCardPhotoPreview ? (
                    <img 
                      src={newCustomerForm.idCardPhotoPreview} 
                      alt="ID Card preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-sky-50/70 flex flex-col items-center justify-center text-sky-600 p-1 text-center">
                      <CreditCard size={22} className="text-sky-600 mb-0.5" />
                      <span className="text-[9px] font-bold text-sky-700 leading-tight">บัตร ปชช.</span>
                    </div>
                  )}

                  {isScanningIdCard && (
                    <div className="absolute inset-0 bg-sky-950/75 backdrop-blur-[1px] flex flex-col items-center justify-center text-white p-1 text-center">
                      <Loader2 size={20} className="animate-spin text-sky-300 mb-0.5" />
                      <span className="text-[9px] font-black text-sky-200">AI อ่านบัตร...</span>
                    </div>
                  )}
                </div>

                {newCustomerForm.idCardPhotoPreview && !isScanningIdCard && (
                  <button
                    type="button"
                    onClick={() => {
                      setNewCustomerForm(prev => ({
                        ...prev,
                        idCardPhotoFile: null,
                        idCardPhotoPreview: null,
                        idCardPhotoBase64: null
                      }));
                    }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer"
                    title="ลบรูปบัตร"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Text & Buttons */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                    <Sparkles size={14} className="text-sky-600" /> สแกนบัตรประชาชนด้วย AI
                  </span>
                  {newCustomerForm.citizenId ? (
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.2 rounded-full border border-emerald-200">
                      อ่านข้อมูลสำเร็จ ✨
                    </span>
                  ) : (
                    <span className="bg-sky-100 text-sky-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-sky-200">
                      กรอกฟอร์มอัตโนมัติ
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-tight mb-2">
                  ถ่ายรูปบัตรประชาชน AI จะช่วยอ่านชื่อ นามสกุล เพศ วันเกิด อายุ และที่อยู่อัตโนมัติทันที
                </p>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    disabled={isScanningIdCard}
                    onClick={() => idCardCameraInputRef.current?.click()}
                    className="px-2.5 py-1.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-bold rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Camera size={14} />
                    <span>{newCustomerForm.idCardPhotoPreview ? 'ถ่ายบัตรใหม่' : 'ถ่ายรูปบัตรประชาชน'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isScanningIdCard}
                    onClick={() => idCardFileInputRef.current?.click()}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <ImageIcon size={14} className="text-sky-600" />
                    <span>{newCustomerForm.idCardPhotoPreview ? 'เปลี่ยนรูป' : 'เลือกรูปบัตร'}</span>
                  </button>

                  {newCustomerForm.idCardPhotoBase64 && !isScanningIdCard && (
                    <button
                      type="button"
                      onClick={() => handleAnalyzeIdCard(newCustomerForm.idCardPhotoBase64)}
                      className="px-2 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-xl border border-sky-200 transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                      title="ให้ AI อ่านบัตรใหม่อีกครั้ง"
                    >
                      <RefreshCw size={13} className="text-sky-600" />
                      <span>สแกนซ้ำ</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Hidden file inputs for ID Card Camera and Gallery */}
            <input 
              ref={idCardCameraInputRef}
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
              onChange={handleIdCardPhotoSelected}
            />
            <input 
              ref={idCardFileInputRef}
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleIdCardPhotoSelected}
            />
          </div>

          {/* 🌟 Customer Profile Photo & Instant AI Face/Skin Scan 🌟 */}
          <div className="bg-gradient-to-r from-teal-50/90 via-indigo-50/60 to-purple-50/90 border-2 border-teal-150 rounded-2xl p-3 sm:p-3.5 shadow-2xs relative overflow-hidden">
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Photo Avatar / Preview */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-white border-2 border-teal-200/80 shadow-xs overflow-hidden flex items-center justify-center relative group">
                  {newCustomerForm.photoPreview ? (
                    <img 
                      src={newCustomerForm.photoPreview} 
                      alt="Customer face preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-50/90 flex flex-col items-center justify-center text-slate-400 p-1 text-center">
                      <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mb-1 shadow-2xs">
                        <Camera size={18} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 leading-tight">ถ่ายรูปใบหน้า</span>
                    </div>
                  )}

                  {/* Scanning overlay on the photo */}
                  {isAnalyzingSkin && (
                    <div className="absolute inset-0 bg-indigo-950/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-white p-1 text-center">
                      <Loader2 size={24} className="animate-spin text-teal-300 mb-1" />
                      <span className="text-[9px] font-black tracking-wide text-teal-200">Iris AI สแกน...</span>
                    </div>
                  )}
                </div>

                {newCustomerForm.photoPreview && !isAnalyzingSkin && (
                  <button
                    type="button"
                    onClick={() => {
                      setNewCustomerForm(prev => ({
                        ...prev,
                        photoFile: null,
                        photoPreview: null,
                        photoBase64: null,
                        aiSkinScanResult: null
                      }));
                    }}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer"
                    title="ลบรูปถ่าย"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Action Buttons & Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <span className="text-xs font-black text-slate-800">รูปถ่ายลูกค้า & ให้ AI วิเคราะห์ทันที</span>
                  {newCustomerForm.aiSkinScanResult ? (
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.2 rounded-full border border-emerald-200">
                      AI สแกนสำเร็จ ✨
                    </span>
                  ) : (
                    <span className="bg-teal-100 text-teal-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-teal-200">
                      Iris AI Face Scan
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-tight mb-2.5">
                  ถ่ายรูปหน้าตรงเพื่อวิเคราะห์ปัญหาผิว คาดคะเนอายุผิว และวางแผนโปรแกรมรักษาให้อัตโนมัติ
                </p>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    disabled={isAnalyzingSkin}
                    onClick={() => customerCameraInputRef.current?.click()}
                    className="px-2.5 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Camera size={14} />
                    <span>{newCustomerForm.photoPreview ? 'ถ่ายใหม่' : 'ถ่ายรูปใบหน้า'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isAnalyzingSkin}
                    onClick={() => customerFileInputRef.current?.click()}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <ImageIcon size={14} className="text-indigo-500" />
                    <span>{newCustomerForm.photoPreview ? 'เปลี่ยนรูป' : 'เลือกจากเครื่อง'}</span>
                  </button>

                  {newCustomerForm.photoBase64 && !isAnalyzingSkin && (
                    <button
                      type="button"
                      onClick={() => handleAnalyzeCustomerPhoto(newCustomerForm.photoBase64)}
                      className="px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                      title="ให้ AI วิเคราะห์ใหม่อีกครั้ง"
                    >
                      <Sparkles size={13} className="text-indigo-600" />
                      <span>วิเคราะห์ใหม่</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Hidden file inputs for Camera and File picker */}
            <input 
              ref={customerCameraInputRef}
              type="file" 
              accept="image/*" 
              capture="user" 
              className="hidden" 
              onChange={handleCustomerPhotoSelected}
            />
            <input 
              ref={customerFileInputRef}
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleCustomerPhotoSelected}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InputField 
              label="ชื่อ" 
              required 
              placeholder="เช่น คุณสมหญิง" 
              value={newCustomerForm.firstName} 
              onChange={e => setNewCustomerForm({
                ...newCustomerForm, 
                firstName: e.target.value,
                name: `${e.target.value} ${newCustomerForm.lastName || ''}`.trim()
              })} 
            />
            <InputField 
              label="นามสกุล" 
              placeholder="เช่น ใจดี" 
              value={newCustomerForm.lastName} 
              onChange={e => setNewCustomerForm({
                ...newCustomerForm, 
                lastName: e.target.value,
                name: `${newCustomerForm.firstName || ''} ${e.target.value}`.trim()
              })} 
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InputField 
              label="ชื่อเล่น" 
              placeholder="เช่น หญิง" 
              value={newCustomerForm.nickname} 
              onChange={e => setNewCustomerForm({...newCustomerForm, nickname: e.target.value})} 
            />
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                เบอร์โทรศัพท์ <span className="text-red-500">*</span>
              </label>
              <input 
                type="tel"
                required
                maxLength={10}
                placeholder="08X-XXX-XXXX"
                value={newCustomerForm.phone}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 10) setNewCustomerForm({...newCustomerForm, phone: val});
                }}
                className={`w-full border-2 bg-gray-50/50 rounded-xl p-3 text-sm outline-none transition-all font-medium text-gray-800 ${newCustomerForm.phone && newCustomerForm.phone.length === 10 ? 'border-emerald-400 focus:border-emerald-500 focus:bg-white' : 'border-gray-100 focus:border-teal-400 focus:bg-white'}`}
              />
              {newCustomerForm.phone && newCustomerForm.phone.length < 10 && (
                <p className="text-amber-600 text-[10px] mt-1 font-bold">กรอกให้ครบ 10 หลัก (ปัจจุบัน {newCustomerForm.phone.length} หลัก)</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><CreditCard size={14} className="text-sky-600"/> เลขประจำตัวประชาชน (13 หลัก)</span>
              {newCustomerForm.citizenId && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${newCustomerForm.citizenId.length === 13 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-sky-50 text-sky-700 border-sky-200'}`}>
                  {newCustomerForm.citizenId.length === 13 ? '✓ ครบ 13 หลัก' : `${newCustomerForm.citizenId.length}/13 หลัก`}
                </span>
              )}
            </label>
            <input 
              type="text"
              maxLength={17}
              placeholder="X-XXXX-XXXXX-XX-X"
              value={newCustomerForm.citizenId || ''}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '');
                if (val.length <= 13) setNewCustomerForm({...newCustomerForm, citizenId: val});
              }}
              className="w-full border-2 border-gray-100 bg-gray-50/50 rounded-xl p-3 text-sm outline-none focus:border-sky-400 focus:bg-white transition-all font-mono font-bold text-gray-800 tracking-wider"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">เพศ</label>
              <select 
                value={newCustomerForm.gender} 
                onChange={e => setNewCustomerForm({...newCustomerForm, gender: e.target.value})}
                className="w-full border-2 border-gray-100 bg-gray-50/50 rounded-xl p-3 text-sm outline-none focus:border-teal-400 focus:bg-white transition-all font-medium text-gray-800"
              >
                <option value="หญิง">หญิง</option>
                <option value="ชาย">ชาย</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">วัน/เดือน/ปีเกิด (พ.ศ.)</label>
              <input 
                type="text"
                placeholder="วว/ดด/ปปปป"
                value={newCustomerForm.dob}
                onChange={e => {
                  const val = e.target.value;
                  let newAge = newCustomerForm.age;
                  const yearMatch = val.match(/\d{4}/);
                  if (yearMatch) {
                    const year = parseInt(yearMatch[0], 10);
                    const currentYearCE = new Date().getFullYear();
                    if (year > 2400 && year <= currentYearCE + 543) {
                      newAge = String(currentYearCE + 543 - year);
                    } else if (year > 1900 && year <= currentYearCE) {
                      newAge = String(currentYearCE - year);
                    }
                  }
                  setNewCustomerForm({...newCustomerForm, dob: val, age: newAge});
                }}
                className="w-full border-2 border-gray-100 bg-gray-50/50 rounded-xl p-3 text-sm outline-none focus:border-teal-400 focus:bg-white transition-all font-medium text-gray-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">อายุ (ปี)</label>
              <input 
                type="number"
                placeholder="เช่น 28"
                value={newCustomerForm.age}
                onChange={e => setNewCustomerForm({...newCustomerForm, age: e.target.value})}
                className="w-full border-2 border-gray-100 bg-gray-50/50 rounded-xl p-3 text-sm outline-none focus:border-teal-400 focus:bg-white transition-all font-medium text-gray-800"
              />
            </div>
          </div>

          <InputField 
            label="ปัญหาผิวหน้า / ความกังวลที่ต้องการดูแล" 
            placeholder="เช่น สิวอักเสบ, ฝ้ากระ, ผิวแห้งขาดน้ำ, ริ้วรอย..." 
            value={newCustomerForm.issue} 
            onChange={e => setNewCustomerForm({...newCustomerForm, issue: e.target.value})} 
          />

          {/* 🌟 AI Skin Analysis & Smart Treatment Matcher Banner 🌟 */}
          <SkinAiBanner 
            issue={newCustomerForm.issue}
            onChangeIssue={(val) => setNewCustomerForm({...newCustomerForm, issue: val})}
            aiScanResult={newCustomerForm.aiSkinScanResult}
            isAnalyzing={isAnalyzingSkin}
          />

          <div className="border-t border-slate-100 pt-3">
            <h4 className="text-xs font-bold text-slate-700 mb-2.5 flex items-center gap-1.5">
              <span>📍 ที่อยู่ลูกค้า (สำหรับส่งสินค้าหรือออกใบเสร็จ)</span>
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <InputField 
                label="บ้านเลขที่ / หมู่บ้าน / ถนน" 
                placeholder="เช่น 123/45 ม.2 ถ.ทวีราษฎร์ภักดี" 
                value={newCustomerForm.addressNo} 
                onChange={e => setNewCustomerForm({...newCustomerForm, addressNo: e.target.value})} 
              />
              <InputField 
                label="ตำบล / แขวง" 
                placeholder="เช่น บ่อผุด" 
                value={newCustomerForm.subDistrict} 
                onChange={e => setNewCustomerForm({...newCustomerForm, subDistrict: e.target.value})} 
              />
              <InputField 
                label="อำเภอ / เขต" 
                placeholder="เช่น เกาะสมุย" 
                value={newCustomerForm.district} 
                onChange={e => setNewCustomerForm({...newCustomerForm, district: e.target.value})} 
              />
              <InputField 
                label="จังหวัด / รหัสไปรษณีย์" 
                placeholder="เช่น สุราษฎร์ธานี 84320" 
                value={newCustomerForm.province} 
                onChange={e => setNewCustomerForm({...newCustomerForm, province: e.target.value})} 
              />
            </div>
          </div>

          {/* 🌟 บัตรสมาชิก & อัปเกรดสมาชิก VIP 🌟 */}
          <div className="bg-gradient-to-r from-amber-50/90 via-orange-50/70 to-yellow-50/90 border-2 border-amber-200/90 rounded-2xl p-3 sm:p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Award size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-950 flex items-center gap-1.5 flex-wrap">
                    <span>สิทธิ์บัตรสมาชิก & อัปเกรด VIP</span>
                    {newCustomerForm.isVipUpgrade && (
                      <span className="bg-amber-200/90 text-amber-900 text-[9px] font-black px-1.5 py-0.2 rounded-full border border-amber-300">
                        อัปเกรด VIP ✨
                      </span>
                    )}
                  </h4>
                  <p className="text-[10px] text-amber-800/80 leading-tight">
                    ลูกค้ามีบัตรสมาชิก หรือต้องการส่งข้อมูลเพื่ออัปเกรดรับสิทธิประโยชน์ VIP
                  </p>
                </div>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input 
                  type="checkbox"
                  checked={newCustomerForm.isVipUpgrade || newCustomerForm.hasMemberCard}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setNewCustomerForm(prev => ({
                      ...prev,
                      isVipUpgrade: checked,
                      hasMemberCard: checked
                    }));
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {(newCustomerForm.isVipUpgrade || newCustomerForm.hasMemberCard) && (
              <div className="mt-3 pt-3 border-t border-amber-200/70 space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>หมายเลขบัตรสมาชิก (Member Card No.)</span>
                    <span className="text-[10px] font-bold text-amber-700">รับสิทธิ์ VIP</span>
                  </label>
                  <input 
                    type="text"
                    placeholder="เช่น IRIS-VIP-8899 หรือ เบอร์โทร"
                    value={newCustomerForm.memberCardNo}
                    onChange={(e) => setNewCustomerForm(prev => ({ ...prev, memberCardNo: e.target.value }))}
                    className="w-full border-2 border-amber-200 bg-white rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-amber-400 font-mono tracking-wider"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-xl bg-white border-2 border-amber-200 shadow-2xs overflow-hidden flex items-center justify-center relative">
                      {newCustomerForm.memberCardPhotoPreview ? (
                        <img 
                          src={newCustomerForm.memberCardPhotoPreview} 
                          alt="Member Card" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-amber-50/50 flex flex-col items-center justify-center text-amber-600 p-1 text-center">
                          <CreditCard size={20} className="text-amber-500 mb-0.5" />
                          <span className="text-[8px] font-bold text-amber-800 leading-tight">รูปบัตร</span>
                        </div>
                      )}
                    </div>

                    {newCustomerForm.memberCardPhotoPreview && (
                      <button
                        type="button"
                        onClick={() => setNewCustomerForm(prev => ({
                          ...prev,
                          memberCardPhotoFile: null,
                          memberCardPhotoPreview: null,
                          memberCardPhotoBase64: null
                        }))}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-xs cursor-pointer"
                        title="ลบรูปบัตรสมาชิก"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-amber-950 mb-1">
                      แนบรูปถ่ายบัตรสมาชิก (สำหรับยืนยันสิทธิ์ VIP)
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => memberCardCameraInputRef.current?.click()}
                        className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                      >
                        <Camera size={13} />
                        <span>ถ่ายรูปบัตร</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => memberCardFileInputRef.current?.click()}
                        className="px-2.5 py-1.5 bg-white hover:bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                      >
                        <ImageIcon size={13} className="text-amber-600" />
                        <span>เลือกรูป</span>
                      </button>
                    </div>
                  </div>
                </div>

                <input 
                  ref={memberCardCameraInputRef}
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  className="hidden" 
                  onChange={(e) => handleMemberCardPhotoSelected(e, 'new')}
                />
                <input 
                  ref={memberCardFileInputRef}
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => handleMemberCardPhotoSelected(e, 'new')}
                />
              </div>
            )}
          </div>

          {/* 📋 ใบบันทึกประวัติลูกค้า & แฟ้มเอกสาร (IrisPatient) 📋 */}
          <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-amber-50/90 border-2 border-emerald-300/90 rounded-2xl p-3.5 sm:p-4 shadow-2xs">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <FileCheck size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs sm:text-sm font-black text-slate-800">
                      ใบบันทึกประวัติลูกค้า & แฟ้มเอกสาร (IrisPatient)
                    </h4>
                    {newCustomerForm.irisIntakeData ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        <Check size={11} className="stroke-[3]" /> กรอกข้อมูลแล้ว
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                        แนะนำกรอกประวัติ
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    ประวัติการแพทย์ สภาพผิว ลายเซ็นยินยอม และบันทึกเข้าแฟ้มเอกสารอัตโนมัติ
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenIrisIntakeFromReg}
                className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-sm active:scale-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <PenTool size={13} />
                <span>{newCustomerForm.irisIntakeData ? 'แก้ไขประวัติ' : 'กรอกใบบันทึกประวัติ'}</span>
              </button>
            </div>

            {newCustomerForm.irisIntakeData && (
              <div className="mt-3 pt-2.5 border-t border-emerald-200/70 flex items-center justify-between text-[11px] text-emerald-900 flex-wrap gap-1">
                <span className="font-semibold flex items-center gap-1">
                  <span>📁 ที่เก็บ:</span>
                  <span className="underline decoration-dotted">{newCustomerForm.irisIntakeData.physicalLocation || 'IrisPatient2'}</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-bold bg-white/70 px-2 py-0.5 rounded-md border border-emerald-200">
                  ✓ พร้อมบันทึกเข้าแฟ้มเอกสาร
                </span>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-black py-3.5 rounded-xl shadow-lg shadow-teal-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            <Save size={18} />
            <span>บันทึกข้อมูลลูกค้า</span>
          </button>
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
               const mcPrice = parseNumber(getFuzzyKey(selectedMC, ["ราคา", "ราคาขาย", "col_5"]));
               const mcQty = parseQty(getFuzzyKey(selectedMC, ["จำนวนครั้งที่ได้", "จำนวนครั้ง", "col_7", "col_13"]));
               const mcCredit = parseNumber(getFuzzyKey(selectedMC, ["เครดิตที่ได้รับ", "เครดิต", "วงเงิน", "col_8", "col_14"]));
               setNewCourseForm({
                 ...newCourseForm,
                 name: selectedName,
                 price: String(mcPrice || ''),
                 qty: String(mcQty || '1'),
                 credit: String(mcCredit || '0')
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

      {/* General Booking Modal - Customer App Style */}
      {/* General Booking Modal - Customer App Style */}
      <ModalWrapper isOpen={isGeneralBookingOpen} onClose={() => setIsGeneralBookingOpen(false)} title="จองคิว / นัดหมายใหม่" icon={CalendarPlus} colorClass="bg-gradient-to-r from-teal-500 to-emerald-500 text-white">
         <AdminBookingForm
             customers={customers}
             initialBranch={globalBranch || 'เฉวง'}
             isSlotTaken={isSlotTaken}
             bookingConfig={bookingConfig}
             onClose={() => setIsGeneralBookingOpen(false)}
             onSubmit={async (formData) => {
                 try { 
                     const guestsCount = Math.min(3, Math.max(1, Number(formData.guestsCount || 1)));
                     const duration = calculateBookingDuration(formData.service || 'บริการทั่วไป', guestsCount, bookingConfig);
                     const cleanPhone = String(formData.phone || '').replace(/\D/g, '');
                     const newBookingData = { 
                         courseId: '', courseRef: '', 
                         courseName: String(formData.service || 'บริการทั่วไป'), 
                         customerName: String(formData.name), 
                         customerPhone: String(formData.phone), 
                         cleanPhone,
                         dateTime: String(formData.dateTime),
                         date: String(formData.date || formData.dateTime.split('T')[0]),
                         time: String(formData.time || formData.dateTime.split('T')[1]),
                         branch: String(formData.branch), 
                         guestsCount,
                         pax: guestsCount,
                         duration,
                         status: 'ยืนยันแล้ว', 
                         createdAt: new Date().toISOString() 
                     };
                     const lineUid = getBookingLineUid(newBookingData);
                     if (lineUid) newBookingData.lineUid = lineUid;

                     const docRef = await addDoc(getCol('bookings'), newBookingData); 
                     if (lineUid && lineNotifConfig.bookingNotif !== false) {
                         sendBookingLineNotification({ id: docRef.id, ...newBookingData }, 'ยืนยันแล้ว', lineUid)
                             .catch(e => console.warn('LINE notification error:', e));
                     }
                     setIsGeneralBookingOpen(false); 
                     showToast('เพิ่มคิวนัดหมายใหม่สำเร็จ'); 
                 } catch (err) { 
                     showToast('ข้อผิดพลาด: ' + err.message); 
                 }
             }}
         />
      </ModalWrapper>

      <AddCourseModal 
        isOpen={isAddMasterCourseOpen} 
        onClose={() => { 
          setIsAddMasterCourseOpen(false); 
          setEditingMasterCourse(null); 
        }} 
        onAdd={handleAddCourse} 
        products={products} 
        masterCourses={masterCourses} 
        initialData={editingMasterCourse}
      />

      <DailyBookingModal
          isOpen={isHolidayModalOpen}
          onClose={() => { setIsHolidayModalOpen(false); setSelectedHolidayDate(null); }}
          selectedDate={selectedHolidayDate}
          dayBookings={selectedHolidayDate ? sortedBookings.filter(b => { const dt = getSafeDateTime(b); return dt && dt.startsWith(selectedHolidayDate.getFullYear() + '-' + String(selectedHolidayDate.getMonth() + 1).padStart(2, '0') + '-' + String(selectedHolidayDate.getDate()).padStart(2, '0')); }) : []}
          storeHolidays={storeHolidays}
          showToast={showToast}
          getBookingStatus={getBookingStatus}
          setBookingViewMode={setBookingViewMode}
          updateBookingStatus={updateBookingStatus}
          branches={branches}
      />

      <VipApplicationFormModal
        isOpen={isVipFormOpen}
        onClose={() => setIsVipFormOpen(false)}
        customer={selectedCustomer}
        onUpgradeComplete={async (imgData) => {
          try {
            await addDoc(getCol('customer_documents'), {
              customerId: selectedCustomer.id,
              title: 'ใบสมัครสมาชิก VIP',
              type: 'digital',
              physicalLocation: '',
              fileUrl: imgData,
              fileName: `vip_form_${selectedCustomer.id}_${Date.now()}.jpg`,
              notes: 'ใบสมัคร VIP จากแอป',
              createdAt: new Date()
            });
            await handleApproveCustomer(selectedCustomer);
            setIsVipFormOpen(false);
          } catch(e) { console.error(e); throw e; }
        }}
      />

      {/* 🌟 แบบฟอร์มประวัติลูกค้า & แฟ้มเอกสาร Iris Queen Nature (IrisPatient2) 🌟 */}
      <IrisPatientIntakeModal
        isOpen={isIrisIntakeOpen}
        onClose={() => setIsIrisIntakeOpen(false)}
        customer={irisIntakeCustomer}
        initialData={irisIntakeInitialData}
        globalBranch={globalBranch}
        readOnly={irisIntakeReadOnly}
        onSave={handleSaveIrisIntake}
      />

      <CreditManagementModal
        isOpen={isCreditModalOpen}
        onClose={() => setIsCreditModalOpen(false)}
        customer={selectedCustomer}
        activeCreditCourses={activeCreditCourses}
        onAddCredit={handleAddCredit}
        onTransferCredit={handleTransferCredit}
        onDeductCredit={handleDeductCredit}
        onSearchCustomer={handleSearchCustomerForTransfer}
      />

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
             <div>
                 <label className="block text-xs font-bold text-gray-600 mb-1">รายละเอียดสินค้า</label>
                 <textarea 
                   value={newProductForm.details || ''} 
                   onChange={e => setNewProductForm({...newProductForm, details: e.target.value})} 
                   className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-sm" 
                   rows={3} 
                   placeholder="รายละเอียดสินค้า..." 
                 />
             </div>
             <label className="flex items-center space-x-3 p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                 <input 
                     type="checkbox" 
                     className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                     checked={newProductForm.isStoreUseOnly}
                     onChange={(e) => setNewProductForm({...newProductForm, isStoreUseOnly: e.target.checked})}
                 />
                 <div>
                     <p className="font-bold text-gray-800 text-sm">สินค้าใช้ภายในคลินิกเท่านั้น</p>
                     <p className="text-xs text-gray-500">ติ๊กเลือกเพื่อซ่อนสินค้านี้จากหน้าระบบ POS (ไม่ให้พนักงานกดขาย)</p>
                 </div>
             </label>
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
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">พนักงานผู้ให้บริการ <span className="text-red-500">*</span></label>
                  <select required value={useCourseData.staffName} onChange={e => setUseCourseData({...useCourseData, staffName: e.target.value})} className="w-full border-2 border-gray-100 bg-gray-50/50 rounded-xl p-3 outline-none focus:border-blue-400 focus:bg-white transition-all font-medium text-gray-800">
                    <option value="" disabled>-- เลือกพนักงาน --</option>
                    {employees.filter(emp => !useCourseData.branch || emp.branch === useCourseData.branch || emp.branch === 'เฉวง').map(emp => (
                      <option key={emp.id} value={emp.name}>{emp.name} ({emp.branch})</option>
                    ))}
                    {/* Fallback to text input if no employees in system yet, although usually they will select from above */}
                  </select>
                </div>
                {/* Course Selections */}
                <div>
                  <h4 className="font-black text-gray-800 mb-3 flex items-center"><FileText size={16} className="mr-2 text-teal-500"/> เลือกคอร์สที่จะใช้บริการ</h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {getDisplayCourses(useCourseModal.customer?.computedPhone || '').filter(c => c.computedRemainQty > 0).map(course => (
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
                    {getDisplayCourses(useCourseModal.customer?.computedPhone || '').filter(c => c.computedRemainQty > 0).length === 0 && (
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
                      const finalPrice = selectedProduct ? computeFinalPrice(selectedProduct, isVip) : 0;
                      const basePrice = selectedProduct ? parseNumber(getFuzzyKey(selectedProduct, ["ราคาขายเต็ม", "ราคา", "col_6"])) : 0;
                      const discountRate = (selectedProduct && isVip && basePrice > finalPrice) ? (basePrice - finalPrice) / basePrice : 0;
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
             <div className="flex gap-2">
                 <div className="flex-1">
                     <InputField label="เบอร์โทรศัพท์ หรือ รหัสอ้างอิง" required placeholder="ค้นหาจากเบอร์ หรือ รหัสจอง..." value={checkInInput} onChange={e => setCheckInInput(e.target.value)} />
                 </div>
                 <div className="flex items-end">
                     <button type="button" onClick={() => setIsCheckInScannerOpen(true)} className="h-[52px] px-4 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors flex flex-col items-center justify-center">
                         <QrCode size={20} />
                         <span className="text-[10px] font-bold mt-1">สแกน</span>
                     </button>
                 </div>
             </div>
             <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3 rounded-xl mt-4 shadow-lg active:scale-95 transition-all text-lg flex items-center justify-center"><CheckCircle className="mr-2"/> ยืนยันการเช็คอิน</button>
         </form>

         <React.Suspense fallback={null}>
            <BarcodeScannerModal 
               isOpen={isCheckInScannerOpen} 
               onClose={() => setIsCheckInScannerOpen(false)} 
               onScan={(data) => {
                  setCheckInInput(data);
                  setIsCheckInScannerOpen(false);
                  handleCheckInSubmit(null, data);
               }} 
            />
         </React.Suspense>
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

      {/* Progress Overlay (เฉพาะการลบข้อมูล ไม่บล็อกหน้าจอตอนซิงค์) */}
      {deleteProgress.isDeleting && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
           <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full border border-gray-100">
              <div className="inline-block mb-4 relative">
                 <div className="w-16 h-16 border-4 border-gray-100 rounded-full"></div>
                 <div className="w-16 h-16 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-2">{`กำลังลบข้อมูล ${deleteProgress.type}...`}</h3>
              <p className="text-gray-500 text-sm font-medium mb-4">กรุณารอสักครู่ ห้ามปิดหน้าต่างนี้</p>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
                 <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-300" style={{ width: `${(deleteProgress.current / (deleteProgress.total || 1)) * 100}%` }}></div>
              </div>
              <p className="text-xs font-bold text-gray-400 font-mono">{`${deleteProgress.current} / ${deleteProgress.total}`}</p>
           </div>
        </div>
      )}

      {/* Enhanced Booking Detail & Status Modal */}
      {bookingTicket && (() => {
        const currentSt = String(bookingTicket.status || 'ยืนยันแล้ว').trim();
        const bSafeDt = getSafeDateTime(bookingTicket);

        const handleModalStatusChange = async (targetStatus) => {
          try {
            await updateBookingStatus(bookingTicket.id, targetStatus);
            setBookingTicket(prev => prev ? ({ ...prev, status: targetStatus }) : null);
          } catch (err) {
            console.error('Failed to change status:', err);
          }
        };

        const statusOptions = [
          {
            key: 'กำลังใช้บริการ',
            label: 'เช็คอิน / กำลังใช้บริการ',
            sub: 'เริ่มทำหัตถการ & ระบุเตียง',
            icon: ScanLine,
            activeColor: 'bg-purple-600 text-white shadow-purple-200 border-purple-600',
            idleColor: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
          },
          {
            key: 'ยืนยันแล้ว',
            label: 'ยืนยันคิวแล้ว',
            sub: 'อนุมัติเรียบร้อย รอเข้ารับบริการ',
            icon: CheckCircle,
            activeColor: 'bg-blue-600 text-white shadow-blue-200 border-blue-600',
            idleColor: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
          },
          {
            key: 'เสร็จสิ้น',
            label: 'ให้บริการเสร็จสิ้น',
            sub: 'จบคิว / ปิดการให้บริการ',
            icon: CheckCircle,
            activeColor: 'bg-emerald-600 text-white shadow-emerald-200 border-emerald-600',
            idleColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
          },
          {
            key: 'รอการยืนยัน',
            label: 'รอการยืนยัน',
            sub: 'คำขอจองคิว / รอดำเนินการ',
            icon: Clock,
            activeColor: 'bg-amber-600 text-white shadow-amber-200 border-amber-600',
            idleColor: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
          },
          {
            key: 'ยกเลิกฉุกเฉิน',
            label: '🚨 ยกเลิกฉุกเฉิน',
            sub: 'เหตุสุดวิสัย / คลินิกปิดด่วน',
            icon: AlertTriangle,
            activeColor: 'bg-rose-600 text-white shadow-rose-200 border-rose-600',
            idleColor: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
          },
          {
            key: 'ยกเลิก',
            label: 'ยกเลิกนัดหมาย',
            sub: 'ลูกค้ายกเลิก หรือไม่มาตามนัด',
            icon: X,
            activeColor: 'bg-gray-700 text-white shadow-gray-200 border-gray-700',
            idleColor: 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
          }
        ];

        return (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setBookingTicket(null)}>
            <div className="bg-white w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 relative overflow-hidden max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
              
              {/* Header */}
              <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-gray-800 leading-tight">จัดการคิวนัดหมาย & ปรับสถานะ</h3>
                    <p className="text-[11px] text-gray-500">ปรับเปลี่ยนสถานะง่ายๆ เพียงแตะปุ่มที่ต้องการ</p>
                  </div>
                </div>
                <button onClick={() => setBookingTicket(null)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="overflow-y-auto space-y-4 pr-1">
                {/* Current Status Banner */}
                <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                  currentSt === 'รอการยืนยัน' ? 'bg-amber-50/80 border-amber-200 text-amber-800' :
                  currentSt === 'ยืนยันแล้ว' ? 'bg-blue-50/80 border-blue-200 text-blue-800' :
                  currentSt === 'กำลังใช้บริการ' ? 'bg-purple-50/80 border-purple-200 text-purple-800 ring-2 ring-purple-100' :
                  currentSt === 'เสร็จสิ้น' ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800' :
                  'bg-rose-50/80 border-rose-200 text-rose-800'
                }`}>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">สถานะปัจจุบัน</span>
                    <h4 className="text-base font-black flex items-center gap-1.5 mt-0.5">
                      {currentSt === 'กำลังใช้บริการ' && <span className="inline-block w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping mr-1"></span>}
                      {currentSt}
                      {bookingTicket.bedNumber && <span className="text-xs font-bold px-2 py-0.5 bg-white rounded-full border border-purple-200 text-purple-700 ml-1">เตียง {bookingTicket.bedNumber}</span>}
                    </h4>
                    {bookingTicket.cancelReason && (
                      <p className="text-xs text-rose-600 mt-1 font-medium">สาเหตุ: {bookingTicket.cancelReason}</p>
                    )}
                  </div>
                  <BookingCountdown booking={bookingTicket} />
                </div>

                {/* Booking Info Card with QR */}
                <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase">บริการ / คอร์ส</span>
                      <p className="font-black text-gray-800 text-sm truncate">{bookingTicket.courseName || 'บริการทั่วไป'}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-gray-700 flex items-center gap-1">
                        <User size={13} className="text-gray-400" /> {bookingTicket.customerName || '-'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 font-black text-[10px] flex items-center gap-1 shadow-xs">
                        <Users size={11} /> {Number(bookingTicket.guestsCount || bookingTicket.pax || 1)} ท่าน
                      </span>
                      {bookingTicket.customerPhone && (
                        <a href={`tel:${bookingTicket.customerPhone}`} onClick={e => e.stopPropagation()} className="font-mono text-indigo-600 font-bold hover:underline flex items-center gap-0.5">
                          <Phone size={11} /> {bookingTicket.customerPhone}
                        </a>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-600 flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 mt-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold">🗓️ {bSafeDt ? new Date(bSafeDt).toLocaleDateString('th-TH', {day: 'numeric', month: 'numeric', year: 'numeric'}) : (bookingTicket.date || '-')}</span>
                        <span className="font-black text-indigo-600">⏰ {bSafeDt ? bSafeDt.split('T')[1]?.substring(0,5) : (bookingTicket.time || '-')} น.</span>
                        <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px] font-bold text-slate-600">📍 {bookingTicket.branch || 'เฉวง'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openRescheduleModal(bookingTicket)}
                        className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-black text-xs flex items-center gap-1 shadow-xs active:scale-95 transition-all shrink-0"
                        title="เลื่อนวันหรือเวลานัดหมาย"
                      >
                        <CalendarClock size={13} />
                        <span>เลื่อนวัน/เวลา</span>
                      </button>
                    </div>
                  </div>
                  <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm shrink-0 flex flex-col items-center">
                    <QRCodeSVG value={bookingTicket.id || bookingTicket.ticketNo || ''} size={68} level="H" />
                    <span className="text-[8px] font-mono text-gray-400 mt-0.5">{bookingTicket.ticketNo || (bookingTicket.id ? bookingTicket.id.slice(0,6) : '')}</span>
                  </div>
                </div>

                {/* ⚡ เปิดรับคิวเพิ่มสำหรับรอบนี้ */}
                {(() => {
                  const bDate = bookingTicket.date || (bSafeDt ? bSafeDt.split('T')[0] : '');
                  const bTime = bookingTicket.time ? bookingTicket.time.substring(0, 5) : (bSafeDt ? bSafeDt.split('T')[1]?.substring(0, 5) : '');
                  const bBranch = String(bookingTicket.branch || 'เฉวง').replace(/^สาขา/, '').trim();
                  const key = `${bDate}_${bBranch}_${bTime}`;
                  const extraCount = Number(bookingConfig?.extraSlotOverrides?.[key] || 0);

                  return (
                    <div className="p-3.5 bg-teal-50/80 border border-teal-200 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-black text-teal-900 flex items-center gap-1.5">
                          <Zap size={14} className="text-teal-600 fill-teal-500" />
                          เปิดรับคิวเพิ่มรอบนี้ ({bTime} น. • {bBranch})
                        </p>
                        <p className="text-[10px] text-teal-700 mt-0.5">
                          {extraCount > 0 ? `เปิดรับเพิ่มอยู่แล้ว +${extraCount} คิว (ลูกค้าจองได้ทันที)` : 'กดปุ่มเพื่อเปิดโควต้าให้ลูกค้าจองรอบนี้เพิ่มได้ทันที'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {extraCount > 0 && (
                          <button
                            type="button"
                            onClick={() => handleToggleBookingExtraSlot(bookingTicket, -1)}
                            className="px-2.5 py-1.5 bg-white border border-teal-200 text-teal-700 hover:bg-teal-100 rounded-xl font-black text-xs active:scale-95 transition-all shadow-xs"
                            title="ลดคิวที่เปิดเพิ่ม"
                          >
                            -1
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleToggleBookingExtraSlot(bookingTicket, 1)}
                          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-black text-xs flex items-center gap-1 active:scale-95 transition-all shadow-md shadow-teal-500/20"
                        >
                          <Plus size={14} />
                          <span>{extraCount > 0 ? '+ เพิ่มอีก 1' : '+ เปิดรับคิวเพิ่ม'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Status Selection Buttons */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-gray-700">แตะเพื่อเปลี่ยนสถานะ:</span>
                    <span className="text-[10px] text-gray-400 font-medium">(คลิกปุ่มจะอัปเดตและแจ้งเตือนทันที)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {statusOptions.map((opt) => {
                      const isCurrent = currentSt === opt.key;
                      const IconComp = opt.icon;
                      return (
                        <button
                          key={opt.key}
                          onClick={() => handleModalStatusChange(opt.key)}
                          className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all active:scale-95 ${
                            isCurrent
                              ? `${opt.activeColor} shadow-md scale-[1.02] ring-2 ring-offset-1`
                              : `${opt.idleColor} shadow-sm`
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${isCurrent ? 'bg-white/20' : 'bg-white shadow-xs'}`}>
                            <IconComp size={16} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-black leading-tight flex items-center gap-1">
                              {opt.label}
                              {isCurrent && <span className="text-[9px] px-1 py-0.2 bg-white/30 rounded">ปัจจุบัน</span>}
                            </div>
                            <div className={`text-[10px] truncate mt-0.5 ${isCurrent ? 'text-white/80' : 'text-gray-500'}`}>
                              {opt.sub}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-gray-100 mt-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openRescheduleModal(bookingTicket)}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-colors flex items-center gap-1.5 shadow-sm active:scale-95"
                    title="เลื่อนวันหรือเวลานัดหมาย"
                  >
                    <CalendarClock size={14} /> เลื่อนวัน/เวลา
                  </button>
                  <button
                    onClick={() => {
                      setPrintingJobSlipBooking(bookingTicket);
                      setBookingTicket(null);
                    }}
                    className="px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-indigo-200"
                  >
                    <Printer size={14} /> พิมพ์ใบงาน
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const bId = bookingTicket.id;
                      setBookingTicket(null);
                      setActionConfirmModal({
                        isOpen: true,
                        title: 'ลบนัดหมาย',
                        message: 'แน่ใจหรือไม่ที่จะลบรายการนัดหมายนี้?',
                        action: () => executeDeleteBooking(bId),
                        confirmText: 'ลบ',
                        confirmColor: 'bg-red-600 hover:bg-red-700'
                      });
                    }}
                    className="px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-red-200"
                  >
                    <Trash2 size={14} /> ลบ
                  </button>
                  <button
                    onClick={() => setBookingTicket(null)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    ปิด
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 🗓️ Reschedule Booking Modal (พนักงานเลื่อนวัน/เวลานัดหมาย) */}
      {rescheduleBookingModal.isOpen && rescheduleBookingModal.booking && (() => {
        const b = rescheduleBookingModal.booking;
        const dtSafe = getSafeDateTime(b);
        const currentDtObj = dtSafe ? new Date(dtSafe) : null;
        const currentDisplayDate = currentDtObj && !isNaN(currentDtObj.getTime())
          ? currentDtObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
          : (b.date || '-');
        const currentDisplayTime = b.time ? b.time.substring(0, 5) : (dtSafe ? dtSafe.split('T')[1]?.substring(0, 5) : '-');
        const currentBranch = String(b.branch || 'เฉวง').replace(/^สาขา/, '').trim();

        const quickDates = [
          { label: 'วันนี้', days: 0 },
          { label: 'พรุ่งนี้', days: 1 },
          { label: 'มะรืนนี้', days: 2 },
          { label: '+3 วัน', days: 3 },
          { label: '+1 สัปดาห์', days: 7 }
        ];

        const standardSlots = [
          '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
          '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
        ];

        const targetDateObj = rescheduleBookingModal.targetDate ? new Date(rescheduleBookingModal.targetDate + 'T00:00:00') : null;
        const targetDateFormatted = targetDateObj && !isNaN(targetDateObj.getTime())
          ? targetDateObj.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
          : '';

        const hasLine = Boolean(getBookingLineUid(b));

        return (
          <div className="fixed inset-0 z-[170] flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setRescheduleBookingModal(prev => ({ ...prev, isOpen: false }))}>
            <div className="bg-white w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 relative overflow-hidden max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

              {/* Header */}
              <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <CalendarClock size={22} />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-gray-800 leading-tight">เลื่อนวัน / เวลานัดหมาย</h3>
                    <p className="text-[11px] text-gray-500">
                      ลูกค้า: <span className="font-bold text-gray-700">{b.customerName || '-'}</span> • {b.courseName || 'บริการ'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRescheduleBookingModal(prev => ({ ...prev, isOpen: false }))}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="overflow-y-auto space-y-4 pr-1">
                {/* Current Schedule Banner */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">เวลานัดหมายปัจจุบัน</span>
                    <p className="font-black text-gray-700 mt-0.5">
                      🗓️ {currentDisplayDate} • ⏰ {currentDisplayTime} น.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold text-[11px]">
                    📍 สาขา {currentBranch}
                  </span>
                </div>

                {/* Date Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black text-gray-700 flex items-center gap-1">
                      <Calendar size={14} className="text-indigo-600" /> เลือกวันที่ใหม่:
                    </label>
                    {targetDateFormatted && (
                      <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {targetDateFormatted}
                      </span>
                    )}
                  </div>

                  {/* Quick Date Pills */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {quickDates.map(qd => {
                      const d = new Date();
                      d.setDate(d.getDate() + qd.days);
                      const dStr = d.toISOString().split('T')[0];
                      const isSelected = rescheduleBookingModal.targetDate === dStr;
                      return (
                        <button
                          key={qd.label}
                          type="button"
                          onClick={() => setRescheduleBookingModal(prev => ({ ...prev, targetDate: dStr }))}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                          }`}
                        >
                          {qd.label}
                        </button>
                      );
                    })}
                  </div>

                  <input
                    type="date"
                    value={rescheduleBookingModal.targetDate}
                    onChange={(e) => setRescheduleBookingModal(prev => ({ ...prev, targetDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
                  />
                </div>

                {/* Time Slot Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black text-gray-700 flex items-center gap-1">
                      <Clock size={14} className="text-indigo-600" /> เลือกรอบเวลาใหม่:
                    </label>
                    <span className="text-xs font-black text-indigo-600">
                      {rescheduleBookingModal.targetTime ? `⏰ ${rescheduleBookingModal.targetTime} น.` : 'ยังไม่ได้เลือก'}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 mb-2">
                    {standardSlots.map(time => {
                      const isSelected = rescheduleBookingModal.targetTime === time;
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setRescheduleBookingModal(prev => ({ ...prev, targetTime: time }))}
                          className={`py-1.5 px-1 rounded-xl text-xs font-bold transition-all active:scale-95 border ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40'
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom time picker if outside standard slots */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-gray-500">หรือระบุเวลาเฉพาะเจาะจง:</span>
                    <input
                      type="time"
                      value={rescheduleBookingModal.targetTime}
                      onChange={(e) => setRescheduleBookingModal(prev => ({ ...prev, targetTime: e.target.value }))}
                      className="px-2.5 py-1 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Branch Selection */}
                <div>
                  <label className="text-xs font-black text-gray-700 flex items-center gap-1 mb-1.5">
                    <MapPin size={14} className="text-indigo-600" /> สาขา:
                  </label>
                  <div className="flex gap-2">
                    {['เฉวง', 'ละไม'].map(br => {
                      const isSelected = rescheduleBookingModal.targetBranch === br;
                      return (
                        <button
                          key={br}
                          type="button"
                          onClick={() => setRescheduleBookingModal(prev => ({ ...prev, targetBranch: br }))}
                          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all active:scale-95 border ${
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                              : 'bg-white text-gray-700 border-gray-200 hover:bg-purple-50/40'
                          }`}
                        >
                          📍 สาขา {br}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Reschedule Reason (Optional) */}
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">
                    เหตุผลในการเลื่อนเวลา (ไม่บังคับ):
                  </label>
                  <input
                    type="text"
                    value={rescheduleBookingModal.reason}
                    onChange={(e) => setRescheduleBookingModal(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="เช่น ลูกค้าขอเลื่อนเวลา, หมอติดเคสผ่าตัด..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* LINE Notification Toggle */}
                {hasLine ? (
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <Send size={15} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-900">แจ้งเตือนลูกค้าผ่าน LINE</p>
                        <p className="text-[10px] text-emerald-700">ส่งการ์ดแจ้งวันและเวลาใหม่ให้ลูกค้าทันที</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rescheduleBookingModal.notifyLine}
                        onChange={(e) => setRescheduleBookingModal(prev => ({ ...prev, notifyLine: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                ) : (
                  <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[11px] text-gray-500 flex items-center gap-2">
                    <AlertCircle size={14} className="text-gray-400 shrink-0" />
                    <span>คิวนี้ไม่ได้เชื่อมต่อกับ LINE (ไม่มี LINE UID) จึงไม่สามารถส่งข้อความแจ้งเตือนอัตโนมัติได้</span>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-gray-100 mt-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setRescheduleBookingModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={isReschedulingBooking || !rescheduleBookingModal.targetDate || !rescheduleBookingModal.targetTime}
                  onClick={handleConfirmReschedule}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-500/25 flex items-center gap-2 active:scale-95 transition-all"
                >
                  {isReschedulingBooking ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>กำลังบันทึก...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} />
                      <span>ยืนยันการเลื่อนนัด</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* QR Code Ticket Modal for Orders */}
      {orderTicket && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm" onClick={() => setOrderTicket(null)}>
           <div className="bg-white w-full max-w-xs rounded-[32px] p-6 shadow-2xl animate-in zoom-in-95 text-center relative overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
              <div ref={orderTicketRef} className="bg-white p-2">
                 <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-400 to-purple-500"></div>
                 <h3 className="font-black text-xl text-gray-800 mb-2 mt-4">ใบเสร็จคำสั่งซื้อ</h3>
                 <p className="text-xs text-gray-500 mb-6">{orderTicket.courseName || (orderTicket.cartItems && orderTicket.cartItems.length > 0 ? orderTicket.cartItems.map(c => `${c.name} x${c.qty || 1}`).join(', ') : orderTicket.itemName || '-')}</p>
                 
                 <div className="bg-white p-2 rounded-2xl border-2 border-gray-100 shadow-sm mb-6 inline-block">
                     <QRCodeSVG value={orderTicket.id || orderTicket.orderNo || ''} size={120} level="H" />
                 </div>
                 
                 <div className="text-left bg-gray-50 p-4 rounded-xl mb-4">
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">ชื่อลูกค้า</p>
                    <p className="font-bold text-gray-800 text-sm mb-3">{String(orderTicket.customerName || 'ไม่ระบุชื่อ')}</p>
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">เลขที่บิล</p>
                    <p className="font-bold text-gray-800 text-sm mb-3">{orderTicket.orderNo || orderTicket.id}</p>
                    {orderTicket.trackingNo && (
                       <>
                          <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">เลขพัสดุ (Tracking)</p>
                          <p className="font-mono font-black text-emerald-700 text-sm mb-3">{orderTicket.trackingNo}</p>
                       </>
                    )}
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">วันที่และเวลา</p>
                    <p className="font-bold text-gray-800 text-sm">{new Date(orderTicket.createdAt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                 </div>
              </div>
              
              {(orderTicket.trackingNo || orderTicket.itemType === 'product' || (orderTicket.cartItems && orderTicket.cartItems.some(i => i.type === 'product' || i.type === 'simple')) || orderTicket.shippingAddress || (orderTicket.transactionType && orderTicket.transactionType.includes('purchase'))) && (
                  <div className="flex flex-col gap-2 mb-4 w-full px-2">
                     <button onClick={(e) => { e.stopPropagation(); setShippingLabelOrder(orderTicket); }} className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 rounded-xl font-black text-white transition-colors flex items-center justify-center shadow-md gap-2">
                        <Printer size={16} /> พิมพ์ใบแปะหน้า (QR & บาร์โค้ด)
                     </button>
                     {orderTicket.waybillUrl && (
                         <button onClick={(e) => { e.stopPropagation(); window.open(orderTicket.waybillUrl, '_blank'); }} className="w-full py-2 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl font-bold text-orange-600 text-xs transition-colors flex items-center justify-center shadow-sm">
                            <Truck size={14} className="mr-1.5" /> เปิดลิงก์ใบปะหน้าเดิม
                         </button>
                     )}
                     <button onClick={(e) => { e.stopPropagation(); setIshipModal({ isOpen: true, order: orderTicket }); }} className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 rounded-xl font-bold text-white transition-colors flex items-center justify-center shadow-md gap-2">
                        <Package size={16} /> {orderTicket.trackingNo ? 'จองขนส่งใหม่ / เรียกรถ (iShip)' : 'เรียกขนส่ง (iShip)'}
                     </button>
                  </div>
              )}

              {orderHasCourses(orderTicket) && !isOrderCourseCreated(orderTicket) && (
                  <div className="px-2 mb-3 w-full">
                     <button
                       onClick={async (e) => {
                           e.stopPropagation();
                           await executeApproveOrder(orderTicket, orderTicket.status || 'สำเร็จ');
                           setOrderTicket(null);
                       }}
                       className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-black text-white transition-colors flex items-center justify-center shadow-md gap-2 animate-pulse"
                     >
                        <Plus size={16} /> สร้างคอร์สเข้าสู่ระบบ POS ทันที
                     </button>
                  </div>
              )}
              
              <div className="flex gap-2 w-full mt-2">
                 <button onClick={async () => {
                     if (!orderTicketRef.current) return;
                     try {
                         setIsDownloadingTicket(true);
                         const canvas = await html2canvas(orderTicketRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
                         const image = canvas.toDataURL("image/jpeg", 0.9);
                         const a = document.createElement('a');
                         a.href = image;
                         a.download = `receipt-${orderTicket.orderNo || orderTicket.id}.jpg`;
                         a.click();
                     } catch (e) {
                         alert('ไม่สามารถดาวน์โหลดใบเสร็จได้');
                     } finally {
                         setIsDownloadingTicket(false);
                     }
                 }} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold text-white transition-colors flex items-center justify-center">
                    {isDownloadingTicket ? 'กำลังโหลด...' : 'บันทึกใบเสร็จ'}
                 </button>
                 <button onClick={() => setOrderTicket(null)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-700 transition-colors">ปิด</button>
              </div>
           </div>
        </div>
      )}

      {/* 🌟 Notifications Center Modal 🌟 */}
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

      {/* Branch Selection Modal for POS */}
      {showBranchSelectForPos && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 text-center">
            <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin size={32} />
            </div>
            <h3 className="text-xl font-black text-gray-800 mb-2">เลือกสาขา</h3>
            <p className="text-sm text-gray-500 mb-6">กรุณาเลือกสาขาที่ต้องการใช้ระบบ POS</p>
            <div className="space-y-3 mb-4">
              {branches.map((b) => (
                <button
                  key={b.id}
                  onClick={() => handleSelectBranchForPos(b)}
                  className="w-full py-4 px-6 bg-white border-2 border-teal-100 hover:border-teal-500 hover:bg-teal-50 text-teal-700 rounded-2xl font-bold text-lg transition-all flex items-center justify-between shadow-sm active:scale-95"
                >
                  <div className="flex items-center gap-3">
                    <Store size={20} /> {b.name}
                  </div>
                  {b.passcode && <ShieldCheck size={16} className="text-teal-400" />}
                </button>
              ))}
            </div>
            <button onClick={() => setShowBranchSelectForPos(false)} className="text-gray-500 font-bold hover:text-gray-800 text-sm py-2">
              ← ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* Owner Login Modal */}
      {showOwnerLogin && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-6 sm:p-8 shadow-2xl animate-in zoom-in-95">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-2xl font-black text-gray-800">เจ้าของร้าน</h3>
              <p className="text-gray-500 mt-2 text-sm">กรุณาใส่รหัสผ่านหลัก 6 หลัก</p>
            </div>
            <form onSubmit={handleOwnerLoginSubmit}>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={ownerPasscode}
                onChange={(e) => setOwnerPasscode(e.target.value)}
                className="w-full text-center text-3xl font-mono tracking-[0.5em] p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none mb-6 transition-all"
                placeholder="******"
                autoFocus
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowOwnerLogin(false); setOwnerPasscode(''); }} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors">ยกเลิก</button>
                <button type="submit" className="flex-1 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-colors">ยืนยัน</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Branch Passcode Modal (for POS access) */}
      {branchPasscodeModal.isOpen && (
        <div className="fixed inset-0 z-[350] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldAlert size={32} />
              </div>
              <h3 className="text-2xl font-black text-gray-800">
                {branchPasscodeModal.branch?.name}
              </h3>
              <p className="text-gray-500 mt-2 text-sm">กรุณาใส่รหัสผ่านสาขา</p>
            </div>
            <form onSubmit={handleBranchPasscodeSubmit}>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={branchPasscodeModal.passcode}
                onChange={(e) => setBranchPasscodeModal({...branchPasscodeModal, passcode: e.target.value})}
                className="w-full text-center text-3xl font-mono tracking-[0.5em] p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none mb-6 transition-all"
                placeholder="****"
                autoFocus
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setBranchPasscodeModal({ isOpen: false, branch: null, passcode: '' })} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors">ยกเลิก</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors">ยืนยัน</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Map Pin Modal */}
      <MapPinModal 
        isOpen={isMapPinModalOpen}
        onClose={() => setIsMapPinModalOpen(false)}
        initialLat={mapPinTarget?.lat}
        initialLng={mapPinTarget?.lng}
        onConfirm={(lat, lng) => {
          if (mapPinTarget?.type === 'new') {
            setNewBranchLat(lat);
            setNewBranchLng(lng);
          } else if (mapPinTarget?.type === 'edit' && mapPinTarget.id) {
            handleUpdateBranchLocation(mapPinTarget.id, lat, lng);
          }
          setIsMapPinModalOpen(false);
        }}
      />

      {/* Front Attendance Modal - Employee list view */}
      {showFrontAttendance && (
        <FrontAttendanceModal
          employees={employees}
          attendance={employeeAttendance}
          branches={branches}
          leaves={employeeLeaves}
          advancePayments={advancePayments}
          requisitions={employeeRequisitions}
          histories={histories}
          dailySales={dailySales}
          appSettings={appSettings}
          orders={orders}
          serviceLogs={serviceLogs}
          bookings={bookings}
          globalBranch={globalBranch}
          globalRole={globalRole}
          initialEmployee={initialEmployeeForAttendance}
          featureFlags={featureFlags}
          mode={attendanceMode}
          onStaffIdentity={(emp) => {
            // 🌟 ยืนยันตัวตนสำเร็จ: จำตัวตน + ถ้ากด POS มาก่อนหน้า → พาเข้า POS ทันที
            setActiveStaff(emp);
            setLoginGate(false);
            grantAdminSession();
            if (!globalBranch) {
              localStorage.setItem('selectedBranch', emp.branch);
              setGlobalBranch(emp.branch);
            }
            if (posAfterIdentity.current) {
              posAfterIdentity.current = false;
              setShowFrontAttendance(false);
              setActiveTab('pos');
            }
          }}
          onClose={() => {
             posAfterIdentity.current = false;
             setShowFrontAttendance(false);
             setInitialEmployeeForAttendance(null);
          }}
          onGoToPOS={() => {
            setShowFrontAttendance(false);
            handlePosAccess();
          }}
        />
      )}

      {/* Mobile Bottom Navigation Bar */}
      <div id="mobile-bottom-nav" className={`lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 justify-around items-end h-[68px] pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-2 print:hidden !print:hidden ${activeTab === 'pos' ? 'hidden' : 'flex'}`}>
         <button onClick={() => { setActiveTab('dashboard'); setIsMobileMoreMenuOpen(false); }} className={`flex flex-col items-center justify-center w-full h-full pb-1.5 space-y-1 ${activeTab === 'dashboard' ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600'}`}>
            <Home size={22} className={activeTab === 'dashboard' ? 'stroke-[2.5px]' : ''} />
            <span className="text-[9px] font-bold">หน้าแรก</span>
         </button>
         
         <button onClick={() => { setActiveTab('customers'); setIsMobileMoreMenuOpen(false); }} className={`flex flex-col items-center justify-center w-full h-full pb-1.5 space-y-1 ${activeTab === 'customers' ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600'}`}>
            <Users size={22} className={activeTab === 'customers' ? 'stroke-[2.5px]' : ''} />
            <span className="text-[9px] font-bold">ลูกค้า</span>
         </button>

         <button onClick={() => { setActiveTab('mole_removal'); setIsMobileMoreMenuOpen(false); }} className={`flex flex-col items-center justify-center w-full h-full pb-1.5 space-y-1 ${activeTab === 'mole_removal' ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600'}`}>
            <Sparkles size={22} className={activeTab === 'mole_removal' ? 'stroke-[2.5px]' : ''} />
            <span className="text-[9px] font-bold">จี้ไฝ</span>
         </button>

         {/* Prominent Center POS Button */}
         <div className="relative w-full flex justify-center h-full z-10">
           <button 
             onContextMenu={(e) => { e.preventDefault(); }}
             onTouchStart={() => {
                posTimerRef.current = setTimeout(() => {
                    posTimerRef.current = 'fired';
                    setIsCheckInOpen(true);
                    setIsCheckInScannerOpen(true);
                }, 500);
             }}
             onTouchEnd={(e) => {
                if (posTimerRef.current === 'fired') {
                    e.preventDefault();
                    posTimerRef.current = null;
                    return;
                }
                if (posTimerRef.current) {
                    clearTimeout(posTimerRef.current);
                    posTimerRef.current = null;
                }
                // Normal click behavior — 🌟 ผ่าน handlePosAccess เสมอ (ตรวจตัวตนพนักงานก่อนเข้า POS)
                handlePosAccess();
                setIsMobileMoreMenuOpen(false);
             }}
             onMouseDown={() => {
                posTimerRef.current = setTimeout(() => {
                    posTimerRef.current = 'fired';
                    setIsCheckInOpen(true);
                    setIsCheckInScannerOpen(true);
                }, 500);
             }}
             onMouseUp={(e) => {
                if (posTimerRef.current === 'fired') {
                    e.preventDefault();
                    posTimerRef.current = null;
                    return;
                }
                if (posTimerRef.current) {
                    clearTimeout(posTimerRef.current);
                    posTimerRef.current = null;
                }
                // Normal click behavior — 🌟 ผ่าน handlePosAccess เสมอ (ตรวจตัวตนพนักงานก่อนเข้า POS)
                handlePosAccess();
                setIsMobileMoreMenuOpen(false);
             }}
             className={`absolute -top-6 ${activeTab === 'pos' ? 'bg-teal-600 border-teal-100 shadow-teal-600/50' : 'bg-teal-500 border-white shadow-teal-500/40'} text-white w-[64px] h-[64px] rounded-full flex items-center justify-center shadow-lg border-[4px] transition-all active:scale-95`}
           >
              <ScanLine size={28} className="stroke-[2.5px]" />
           </button>
           <span className={`text-[10px] font-bold absolute bottom-1.5 ${activeTab === 'pos' ? 'text-teal-600' : 'text-gray-500'}`}>POS</span>
         </div>

         <button onClick={() => { setActiveTab('courses'); setIsMobileMoreMenuOpen(false); }} className={`flex flex-col items-center justify-center w-full h-full pb-1.5 space-y-1 ${activeTab === 'courses' ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600'}`}>
            <FileText size={22} className={activeTab === 'courses' ? 'stroke-[2.5px]' : ''} />
            <span className="text-[9px] font-bold">ใบคอร์ส</span>
         </button>

         <button onClick={() => { setActiveTab('bookings'); setFilterBookingStatus('today_upcoming'); setIsMobileMoreMenuOpen(false); }} className={`flex flex-col items-center justify-center w-full h-full pb-1.5 space-y-1 ${activeTab === 'bookings' ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600'}`}>
            <div className="relative">
               <Calendar size={22} className={activeTab === 'bookings' ? 'stroke-[2.5px]' : ''} />
               {bookingStats.badgeCount > 0 && (
                 <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[10px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white shadow-sm leading-none pt-px">
                    {bookingStats.badgeCount > 99 ? '99+' : bookingStats.badgeCount}
                 </span>
               )}
            </div>
            <span className="text-[9px] font-bold">นัดหมาย</span>
         </button>
         
         <button onClick={() => setIsMobileMoreMenuOpen(true)} className={`flex flex-col items-center justify-center w-full h-full pb-1.5 space-y-1 ${isMobileMoreMenuOpen ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600'}`}>
            <Menu size={22} className={isMobileMoreMenuOpen ? 'stroke-[2.5px]' : ''} />
            <span className="text-[9px] font-bold">เมนู</span>
         </button>
      </div>

      {/* Mobile More Menu Modal (Slide-up) */}
      {isMobileMoreMenuOpen && (
         <div className="lg:hidden fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMoreMenuOpen(false)}></div>
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-full pb-safe flex flex-col max-h-[85vh]">
               <div className="flex justify-between items-center p-4 border-b border-gray-100 shrink-0">
                  <h3 className="font-black text-gray-800 text-lg flex items-center gap-2"><Layers size={20} className="text-teal-500"/> เมนูทั้งหมด</h3>
                  <button onClick={() => setIsMobileMoreMenuOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200"><X size={20}/></button>
               </div>
               <div className="overflow-y-auto p-4 space-y-2 flex-1 grid grid-cols-2 gap-2 pb-20">
                  <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setIsMobileMoreMenuOpen} id="course_deduction" icon={Scissors} label="ตัดคอร์สบริการ" />
                  <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setIsMobileMoreMenuOpen} id="calendar_dashboard" icon={CalendarDays} label="ปฏิทินวันหยุด" />
                  <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setIsMobileMoreMenuOpen} id="orders" icon={ShoppingCart} label="คำสั่งซื้อ" badge={orderStats.pending} />
                  <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setIsMobileMoreMenuOpen} id="masterCourses" icon={Layers} label="คอร์สโปรโมชัน" />
                  <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setIsMobileMoreMenuOpen} id="promotions" icon={Tag} label="โปรโมชัน(POS)" />
                  <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setIsMobileMoreMenuOpen} id="marketing_promos" icon={Sparkles} label="แบนเนอร์" />
                  <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setIsMobileMoreMenuOpen} id="coupons" icon={Ticket} label="คูปอง" />
                  <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setIsMobileMoreMenuOpen} id="gamification" icon={Gift} label="ลุ้นโชค" />
                  <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setIsMobileMoreMenuOpen} id="products" icon={Package} label="คลังสินค้า" />
                  <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setIsMobileMoreMenuOpen} id="courses" icon={FileText} label="ใบคอร์ส" />
                  <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setIsMobileMoreMenuOpen} id="customers" icon={Users} label="ฐานลูกค้า" />
                  <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setIsMobileMoreMenuOpen} id="histories" icon={HistoryIcon} label="ประวัติบริการ" />
                  {globalRole === 'owner' && (
                     <>
                        <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setIsMobileMoreMenuOpen} id="employees" icon={UserCheck} label="จัดการพนักงาน" />
                        <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setIsMobileMoreMenuOpen} id="financials" icon={BarChart3} label="บัญชีการเงิน" />
                        <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setIsMobileMoreMenuOpen} id="settings" icon={Settings} label="ตั้งค่าระบบ" />
                     </>
                  )}
               </div>
            </div>
         </div>
      )}

      <VipApplicationFormModal 
        isOpen={isVipFormOpen}
        onClose={() => setIsVipFormOpen(false)}
        customer={selectedCustomer}
        onUpgradeComplete={async (imgData) => {
          await handleApproveCustomer(selectedCustomer);
          
          if (imgData) {
            try {
              const fileName = `vip_form_${Date.now()}.jpg`;
              
              await addDoc(getCol('customer_documents'), {
                customerId: selectedCustomer.id,
                title: 'ใบสมัครสมาชิก VIP',
                type: 'digital',
                physicalLocation: '',
                fileUrl: imgData, // Save base64 directly to Firestore to bypass Storage rules
                fileName,
                notes: 'ระบบสร้างให้อัตโนมัติเมื่ออัปเกรด VIP',
                createdAt: new Date()
              });
              showToast('บันทึกใบสมัคร VIP ลงในเอกสารสำเร็จ!');
            } catch (err) {
              console.error('Failed to upload VIP form:', err);
              showToast('เกิดข้อผิดพลาดในการบันทึกใบสมัครลงระบบ');
            }
          }
        }}
      />

      {confirmDeleteModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-sm rounded-[32px] p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 text-center">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={32}/></div>
                <h3 className="text-xl font-black text-gray-800 mb-2">ยืนยันการลบข้อมูล</h3>
                <p className="text-sm text-gray-500 mb-6">คุณกำลังจะลบข้อมูล 
                  {(() => {
                    const displayType = {
                      'courses': 'ใบคอร์ส',
                      'customers': 'ลูกค้า',
                      'histories': 'ประวัติ',
                      'bookings': 'การจองคิว',
                      'orders': 'คำสั่งซื้อ',
                      'products': 'สินค้า',
                      'master_courses': 'คอร์สตั้งต้น'
                    }[confirmDeleteModal.type] || confirmDeleteModal.type;
                    return <strong className="text-red-500 mx-1">{displayType}</strong>;
                  })()}
                  จำนวน {confirmDeleteModal.data.length} รายการ การกระทำนี้ไม่สามารถย้อนกลับได้
                </p>
                <div className="flex gap-3">
                    <button onClick={() => setConfirmDeleteModal({ isOpen: false, type: '', data: [] })} className="flex-1 py-3.5 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">ยกเลิก</button>
                    <button onClick={executeDeleteData} className="flex-1 py-3.5 rounded-xl font-black text-white bg-red-500 hover:bg-red-600 shadow-md transition-all active:scale-95">ยืนยันลบข้อมูล</button>
                </div>
            </div>
        </div>
      )}

      {/* 🌟 Master Course Usages Modal 🌟 */}
      {masterCourseUsagesModal.isOpen && masterCourseUsagesModal.mc && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
               <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
                  <div>
                     <h3 className="font-black text-gray-800 text-xl">ใบคอร์สลูกค้าที่ใช้รหัสโปรโมชันนี้</h3>
                     <p className="text-sm text-gray-500 font-bold mt-1">รหัสคอร์สตั้งต้น: <span className="text-teal-600">{String(getFuzzyKey(masterCourseUsagesModal.mc, ["รหัสคอส", "col_1"]) || '-')}</span></p>
                  </div>
                  <button onClick={() => setMasterCourseUsagesModal({ isOpen: false, mc: null })} className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors">
                     <X size={24}/>
                  </button>
               </div>
               <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                  {(() => {
                     const code = String(getFuzzyKey(masterCourseUsagesModal.mc, ["รหัสคอส", "col_1"]) || '').trim().toLowerCase();
                     const usages = processedCourses.filter(c => {
                         const rawVal = String(getFuzzyKey(c, ["รหัสคอส", "col_1"]) || '').trim().toLowerCase();
                         // Sometimes it's exactly the code
                         if (rawVal === code) return true;
                         // Sometimes it's formatted like "ชื่อคอร์ส: COURSE195"
                         const parts = rawVal.split(':').map(p => p.trim());
                         if (parts.includes(code)) return true;
                         // Or try regex word boundary to prevent course1 matching course10
                         try {
                             return new RegExp('(?:^|[^a-zA-Z0-9])' + code + '(?:[^a-zA-Z0-9]|$)', 'i').test(rawVal);
                         } catch (e) {
                             return rawVal.includes(code);
                         }
                     });
                     
                     if (usages.length === 0) {
                        return <div className="text-center py-20 text-gray-400 font-bold">ไม่พบใบคอร์สลูกค้าที่อ้างอิงรหัสคอร์สตั้งต้นนี้</div>;
                     }

                     return (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                           {usages.map((u, i) => (
                              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm relative group hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer" onClick={() => { setMasterCourseUsagesModal({ isOpen: false, mc: null }); setSelectedCourse(u); }}>
                                 <div className="flex justify-between items-start mb-2">
                                    <div className="font-bold text-gray-800 line-clamp-1">{String(getFuzzyKey(u, ["ชื่อคอส", "col_8"]) || '-')}</div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ml-2 ${u.computedStatus === 'ยังคงเหลือ' ? 'bg-teal-50 text-teal-600' : 'bg-gray-100 text-gray-500'}`}>{u.computedStatus}</span>
                                 </div>
                                 <div className="text-xs text-gray-500 mb-3 font-mono bg-gray-50 px-2 py-1 rounded inline-block">Ref: {String(getFuzzyKey(u, ["เลขที่ใบคอส", "col_2"]) || '-')}</div>
                                 <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0"><User size={14}/></div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-bold text-gray-700 truncate">{String(getFuzzyKey(u, ["ผู้ซื้อคอส", "col_9"]) || '-')}</div>
                                        <div className="text-[10px] text-gray-400 font-mono">{String(getFuzzyKey(u, ["เบอร์โทร", "col_1"]) || '-')}</div>
                                    </div>
                                 </div>
                                 
                                 <div className="mt-4 flex justify-between items-center border-t border-gray-50 pt-3 text-xs">
                                    <div className="font-bold text-teal-600">คงเหลือ <span className="text-sm">{u.computedRemainQty}</span> ครั้ง</div>
                                    <div className="text-gray-400 text-[10px]">ซื้อ: {String(getFuzzyKey(u, ["วันที่ซื้อ", "col_7"]) || '-')}</div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     );
                  })()}
               </div>
            </div>
         </div>
      )}

      <RoomManagementBoard 
        bookings={bookings} 
        orders={orders}
        globalBranch={globalBranch} 
        isOpen={isBedModalOpen} 
        onClose={() => setIsBedModalOpen(false)} 
        onRetrieveParkedOrder={(order) => {
           setPosParkedOrderToResume(order);
           setIsBedModalOpen(false);
           setActiveTab('pos');
        }}
      />
      <IShipBookingModal 
        isOpen={ishipModal.isOpen} 
        order={ishipModal.order} 
        onClose={() => setIshipModal({isOpen: false, order: null})} 
        onPrintLabel={(address) => {
          if (!ishipModal.order) return;
          setShippingLabelOrder({
            ...ishipModal.order,
            ...(address ? { shippingAddress: address } : {})
          });
        }}
        onSubmit={handleIshipBooking} 
      />
      <ShippingLabelModal
        isOpen={!!shippingLabelOrder}
        order={shippingLabelOrder}
        globalBranch={globalBranch}
        onClose={() => setShippingLabelOrder(null)}
      />
      <AddressManagerModal 
        isOpen={isAddressManagerOpen} 
        onClose={() => setIsAddressManagerOpen(false)} 
        customers={customers} 
      />
      <CloseCourseModal 
        isOpen={closeCourseModalData.isOpen} 
        course={closeCourseModalData.course} 
        activeStaff={activeStaff} 
        onClose={() => setCloseCourseModalData({ isOpen: false, course: null })} 
        onSuccess={(updatedCourse) => {
          if (selectedCourse && (selectedCourse.id === updatedCourse.id || selectedCourse.courseRefKey === updatedCourse.courseRefKey)) {
            setSelectedCourse(prev => ({ ...prev, ...updatedCourse }));
          }
        }}
        showToast={showToast}
      />
      <CourseDataInspectorModal
        isOpen={!!inspectorCourse}
        course={inspectorCourse}
        masterCourses={masterCourses}
        onCourseUpdated={(updatedCourse) => {
          if (selectedCourse && (selectedCourse.id === updatedCourse.id || selectedCourse.courseRefKey === updatedCourse.courseRefKey)) {
            setSelectedCourse(prev => ({ ...prev, ...updatedCourse }));
          }
        }}
        onClose={() => setInspectorCourse(null)}
        showToast={showToast}
      />

      {/* Before / After Photos Modal in Admin */}
      {selectedHistoryForPhotos && (() => {
        const h = selectedHistoryForPhotos;
        const bPhotos = Array.isArray(h.customerPhotos?.before) ? h.customerPhotos.before : (Array.isArray(h.beforePhotos) ? h.beforePhotos : []);
        const aPhotos = Array.isArray(h.customerPhotos?.after) ? h.customerPhotos.after : (Array.isArray(h.afterPhotos) ? h.afterPhotos : (h.customerPhoto ? [h.customerPhoto] : []));
        const srvName = getFuzzyKey(h, ["รายการ", "col_23", "col_18"]) || 'ตัดคอร์ส';
        const dateStr = getFuzzyKey(h, ["วันที่", "col_1"]) || '-';

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              <div className="p-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white flex justify-between items-center">
                <div>
                  <h3 className="font-black text-sm flex items-center gap-1.5"><Camera size={16} /> รูปภาพก่อน - หลังทำ (Before & After)</h3>
                  <p className="text-[11px] text-teal-100 font-medium">{srvName} • {dateStr}</p>
                </div>
                <button onClick={() => setSelectedHistoryForPhotos(null)} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20"><X size={16} /></button>
              </div>
              <div className="p-4 overflow-y-auto space-y-4 bg-slate-50/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-2xl border border-indigo-100 shadow-2xs space-y-2">
                    <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">📸 ก่อนทำ ({bPhotos.length})</span>
                    {bPhotos.length > 0 ? (
                      bPhotos.map((url, idx) => (
                        <img key={idx} src={url} alt="Before" onClick={() => setAdminEnlargedPhoto(url)} className="w-full aspect-[4/3] object-cover rounded-xl cursor-pointer hover:opacity-90 shadow-2xs" />
                      ))
                    ) : (
                      <div className="py-8 text-center text-xs text-slate-400">ไม่มีรูปก่อนทำ</div>
                    )}
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-emerald-100 shadow-2xs space-y-2">
                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">✨ หลังทำ ({aPhotos.length})</span>
                    {aPhotos.length > 0 ? (
                      aPhotos.map((url, idx) => (
                        <img key={idx} src={url} alt="After" onClick={() => setAdminEnlargedPhoto(url)} className="w-full aspect-[4/3] object-cover rounded-xl cursor-pointer hover:opacity-90 shadow-2xs" />
                      ))
                    ) : (
                      <div className="py-8 text-center text-xs text-slate-400">ไม่มีรูปหลังทำ</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-3 bg-white border-t text-center">
                <button onClick={() => setSelectedHistoryForPhotos(null)} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl">ปิด</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 🤖 Gemini API Key Configuration Modal */}
      {isGeminiKeyModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-700 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shadow-inner">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base">ตั้งค่า Google Gemini AI</h3>
                  <p className="text-[11px] text-purple-200">อ่านบัตร ปชช. ไทย & Iris Face Scan</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsGeminiKeyModalOpen(false)} 
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 text-purple-900 text-xs leading-relaxed">
                <p className="font-bold mb-1 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-purple-600" />
                  <span>ระบบ AI ต้องใช้ Google Gemini API Key</span>
                </p>
                <p className="text-[11px] text-purple-700">
                  รองรับโมเดลล่าสุด <strong className="underline">gemini-3.8-flash</strong> อ่านข้อมูลบัตรประชาชนไทย 13 หลัก และวิเคราะห์สภาพผิวหน้าอัตโนมัติ
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Key size={14} className="text-amber-500" />
                  <span>วาง API Key ที่นี่ (ขึ้นต้นด้วย AQ... หรือ AIzaSy...):</span>
                </label>
                <div className="relative">
                  <input
                    type={showApiKeyText ? 'text' : 'password'}
                    value={customGeminiApiKey}
                    onChange={(e) => setCustomGeminiApiKey(e.target.value)}
                    placeholder="AQ... หรือ AIzaSy..."
                    className="w-full pl-3 pr-12 py-2.5 text-xs font-mono rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 outline-none bg-slate-50"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowApiKeyText(p => !p)}
                      className="p-1 text-slate-400 hover:text-slate-600"
                      title={showApiKeyText ? 'ซ่อนคีย์' : 'แสดงคีย์'}
                    >
                      {showApiKeyText ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-bold underline"
                >
                  <span>สร้าง API Key ฟรีได้ที่ Google AI Studio</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsGeminiKeyModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-xl border border-slate-200 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveGeminiApiKey}
                disabled={isTestingGeminiKey || !customGeminiApiKey.trim()}
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isTestingGeminiKey ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                <span>{isTestingGeminiKey ? 'กำลังทดสอบ & บันทึก...' : 'บันทึกและสแกนทันที'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {adminEnlargedPhoto && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 cursor-pointer" onClick={() => setAdminEnlargedPhoto(null)}>
          <img src={adminEnlargedPhoto} alt="Enlarged" className="max-w-[95vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
        </div>
      )}
    </div>
  );
}
