import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Upload, Search, Home, FileText, User, Users, Settings, 
  Plus, Eye, CheckCircle, Clock, QrCode, LogOut, Menu, X, 
  Tag, Calendar, ShoppingCart, Package, TrendingUp, MapPin, 
  Award, AlertCircle, Banknote, Activity, Phone, History as HistoryIcon, 
  Printer, ShoppingBag, ArrowLeft, HeartPulse, ChevronRight, 
  CalendarPlus, UserPlus, Sparkles, Trash2, AlertTriangle, Layers, Database,
  Camera, Image as ImageIcon, ShieldCheck, ShieldAlert, RefreshCcw, PenTool,
  Bell, List, LayoutGrid, ScanLine, CalendarDays, ChevronLeft, ChevronUp, ChevronDown, BarChart3, Store, UserCheck, Wallet, Loader2, Scissors, Ticket, Gift,
  Send, MessageSquare, ToggleLeft, ToggleRight, TestTube, ExternalLink, Zap, Target, Droplet, Syringe, Pill, Truck, Star
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
import { QRCodeSVG } from 'qrcode.react';

// --- FIREBASE IMPORTS ---
import { signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc, deleteField, writeBatch, query, where, getDocs, setDoc, orderBy } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject, uploadString } from 'firebase/storage';
import { auth, db, getCol, getDocRef, storage } from './config/firebase';
import html2canvas from 'html2canvas';

// --- UTILS & PARSERS ---
import { getLocalYYYYMMDD, formatDateTimeStr, parseNumber, parseQty, parseHistoryTime, parseCSVRow, parseThaiDate } from './utils/parse';
import { getFuzzyKey } from './utils/fuzzy';
import { 
  isUsageType, isAddType, isFreeUsageApp as isFreeUsage, extractHistoryQty, 
  isMoleHistoryRecord, checkWarranty, getHistoryDateKey, getHistorySortTime, 
  getHistoryBranch, isHistoryUsageRecord 
} from './utils/courseUtils';
import { handleProfileImgError, parseImageUrl, getProfilePicData } from './utils/imageUtils';
import { getSafeDateTime, getBookingStatus, getOrderStatus } from './utils/dateUtils';

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
import { sendOrderLineNotification, sendBookingLineNotification, sendPOSCheckoutNotification, sendCourseDeductionNotification, sendRewardLineNotification } from './utils/lineUtils';
import CustomerBedSession from './components/CustomerBedSession';
import CalendarBookingDashboard from './components/CalendarBookingDashboard';
import SettingsPage from './components/SettingsPage';
import DailyBookingModal from './components/DailyBookingModal';
import CreditManagementModal from './components/CreditManagementModal';
import IShipBookingModal from './components/IShipBookingModal';
import ShippingLabelModal from './components/ShippingLabelModal';
import AddressManagerModal from './components/AddressManagerModal';
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
  const [posPreselectedCustomer, setPosPreselectedCustomer] = useState(null);
  const [posPendingAfterLogin, setPosPendingAfterLogin] = useState(false);
  
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isPrintSingleCourseMode, setIsPrintSingleCourseMode] = useState(false);
  const [isPrintMultiCourseMode, setIsPrintMultiCourseMode] = useState(false);
  const [isPrintCourseSummaryMode, setIsPrintCourseSummaryMode] = useState(false);
  const [isSelectCoursesToPrintOpen, setIsSelectCoursesToPrintOpen] = useState(false);
  const [selectedCoursesForPrint, setSelectedCoursesForPrint] = useState([]);

  const [bookingTicket, setBookingTicket] = useState(null);
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
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '', issue: '' });
  
  // 🌟 เพิ่มสถานะสำหรับระบบแก้ไขข้อมูลลูกค้า 🌟
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const [editCustomerData, setEditCustomerData] = useState({ id: '', name: '', phone: '', issue: '' });

  // 🌟 เพิ่มสถานะสำหรับระบบจัดเก็บเอกสารลูกค้า 🌟
  const [customerDocuments, setCustomerDocuments] = useState([]);
  const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false);
  const [newDocumentForm, setNewDocumentForm] = useState({ title: '', type: 'physical', physicalLocation: '', notes: '' });
  const [documentFile, setDocumentFile] = useState(null);
  const [documentUploadProgress, setDocumentUploadProgress] = useState(0);


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
      await updateDoc(getDocRef('orders', order.id), { trackingInfo: info });
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
            if (wp.sku) newIdMap.set(String(wp.sku).trim().toUpperCase(), wp.id);
            if (wp.name) newIdMap.set(String(wp.name).toLowerCase().trim(), wp.id);
            if (wp.images && wp.images.length > 0) {
              const imgSrc = wp.images[0].src;
              if (wp.sku) newImgMap.set(String(wp.sku).trim().toUpperCase(), imgSrc);
              if (wp.name) newImgMap.set(String(wp.name).toLowerCase().trim(), imgSrc);
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
    const updateProgress = () => { loaded++; setLoadingProgress(Math.round((loaded / 9) * 100)); if (loaded >= 9) setTimeout(() => setIsCloudLoading(false), 500); };
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

    return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); unsub6(); unsub7(); unsubPromo(); unsub8(); unsub9(); unsub10(); unsub11(); unsub12(); unsub13(); unsub14(); unsub15(); unsub16(); };
  }, [user]);

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

  // Auto-detect branch based on GPS when branches are loaded (runs once per session; skip GPS if only 1 branch)
  useEffect(() => {
    if (!isCloudLoading && branches.length > 0 && !hasAutoDetectedBranch.current) {
      hasAutoDetectedBranch.current = true;
      const activeBranches = branches.filter(b => !b.isMaintenance);
      const branchesWithGps = activeBranches.filter(b => b.lat && b.lng);
      if (activeBranches.length <= 1 || branchesWithGps.length <= 1) {
        const singleBranchName = (activeBranches[0] || branches[0])?.name;
        if (singleBranchName && globalBranch !== singleBranchName) {
          setGlobalBranch(singleBranchName);
          localStorage.setItem('selectedBranch', singleBranchName);
        }
        return;
      }
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const R = 6371e3; // metres
            
            for (let branch of branches) {
              if (branch.lat && branch.lng) {
                const φ1 = branch.lat * Math.PI/180;
                const φ2 = latitude * Math.PI/180;
                const Δφ = (latitude-branch.lat) * Math.PI/180;
                const Δλ = (longitude-branch.lng) * Math.PI/180;

                const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                          Math.cos(φ1) * Math.cos(φ2) *
                          Math.sin(Δλ/2) * Math.sin(Δλ/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                const distance = R * c;
                
                if (distance <= 50) {
                  // Only change if it's different from the currently saved one
                  if (globalBranch !== branch.name) {
                    setGlobalBranch(branch.name);
                    localStorage.setItem('selectedBranch', branch.name);
                    showToast(`พิกัดของคุณอยู่ที่สาขา ${branch.name} ระบบเลือกสาขาให้อัตโนมัติ`, 'success');
                  }
                  break; 
                }
              }
            }
          },
          (err) => {
            console.log("GPS auto-detect failed or denied:", err.message);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
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
                const c = customersRaw.find(c => (b.customerId && c.id === b.customerId) || (b.customerPhone && String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '').trim() === String(b.customerPhone).trim()));
                if (c && c.lineUid && lineNotifConfig.bookingNotif !== false) sendBookingLineNotification(b, 'ยกเลิก', c.lineUid);
            }).catch(console.error);
          } else if (st === 'ยืนยันแล้ว' && diffMins <= -19) {
            // Reminders for confirmed bookings
            const minsUntil = -diffMins; 
            if (minsUntil <= 20 && minsUntil > 0 && !b.reminded20m) {
               updateDoc(getDocRef('bookings', b.id), { reminded20m: true, reminded1hr: true }).catch(console.error);
               const c = customersRaw.find(c => (b.customerId && c.id === b.customerId) || (b.customerPhone && String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '').trim() === String(b.customerPhone).trim()));
               if (c && c.lineUid && lineNotifConfig.queueReminder !== false) sendBookingLineNotification(b, 'เตือนคิว (อีก 20 นาที)', c.lineUid);
            } else if (minsUntil <= 60 && minsUntil > 20 && !b.reminded1hr) {
               updateDoc(getDocRef('bookings', b.id), { reminded1hr: true }).catch(console.error);
               const c = customersRaw.find(c => (b.customerId && c.id === b.customerId) || (b.customerPhone && String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '').trim() === String(b.customerPhone).trim()));
               if (c && c.lineUid && lineNotifConfig.queueReminder !== false) sendBookingLineNotification(b, 'เตือนคิว (อีก 1 ชม.)', c.lineUid);
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
    const historiesByCustomerName = {};
    histories.forEach(h => {
        if (h.isCancelled || String(getFuzzyKey(h, ["สถานะ", "col_7", "col_8", "col_9"]) || '') === 'ยกเลิก') return;
        const custName = String(getFuzzyKey(h, ["ชื่อลูกค้า", "col_2"]) || '').trim();
        if (custName) { if (!historiesByCustomerName[custName]) historiesByCustomerName[custName] = []; historiesByCustomerName[custName].push(h); }
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
      if (historiesByCustomerName[posName]) {
          historiesByCustomerName[posName].forEach(h => myHistoriesMap.set(h.id || JSON.stringify(h), h));
      }
      if (displayName !== posName && historiesByCustomerName[displayName]) {
          historiesByCustomerName[displayName].forEach(h => myHistoriesMap.set(h.id || JSON.stringify(h), h));
      }
      
      const cleanPhone = String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '').trim();
      if (cleanPhone) {
         histories.forEach(h => {
             if (h.isCancelled || String(getFuzzyKey(h, ["สถานะ", "col_7", "col_8", "col_9"]) || '') === 'ยกเลิก') return;
             const hPhone = String(getFuzzyKey(h, ["cleanPhone", "เบอร์โทร", "เบอร์โทรลูกค้า", "col_3"]) || '').trim();
             if (hPhone === cleanPhone) myHistoriesMap.set(h.id || JSON.stringify(h), h);
         });
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

      return { 
        ...c, 
        computedName: displayName, 
        computedPhone: String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || ''), 
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
        profilePicData: picData
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

    return sortedCourses.map(course => {
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
                              if (isPosCourse) {
                                  if (!h.courseUpdatedDirectly) {
                                      newSystemUsed += qty;
                                  }
                              } else {
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
      
      let status = getFuzzyKey(course, "สถานะ") || "ยังคงเหลือ";
      if (remaining <= 0 && currentTotal > 0) status = "ใช้ครบแล้ว";
      
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

      const rawExplicitCredit = getFuzzyKey(course, ["เครดิตที่ได้รับ", "เครดิตที่ได้", "เครดิตทั้งหมด", "ยอดเครดิต", "วงเงินคอร์ส", "เครดิต", "วงเงิน", "วงเงินที่ได้รับ", "มูลค่าเครดิต", "col_14"]);
      const coursePrice = parseNumber(getFuzzyKey(course, ["ราคา", "ราคาคอร์ส", "ยอดเต็ม", "ยอดเงิน", "จำนวนเงิน", "ยอดสุทธิ", "ราคาขาย", "col_13"]));
      
      let initialCredit = rawExplicitCredit !== undefined && rawExplicitCredit !== '' ? parseNumber(rawExplicitCredit) : 0;
      
      if (initialCredit === 0 && coursePrice > 0) {
          if (cleanCourseName.includes('เครดิต') || cleanCourseName.includes('วงเงิน') || cleanCourseName.includes('voucher') || cleanCourseName.includes('บัตรกำนัล') || cleanCourseName.includes('เติมเงิน') || cleanCourseName.includes('ฝากเงิน')) {
              initialCredit = coursePrice;
          }
      }
      
      const courseOldBerq = parseNumber(getFuzzyKey(course, ["ยอดเบิกดิบ", "เบิกไปแล้ว", "ยอดเบิก", "ใช้เครดิต", "หักเครดิต", "col_15"]));
      const courseOldAccum = parseNumber(getFuzzyKey(course, ["ยอดสะสมดิบ", "ยอดสะสม", "col_16"]));
      
      let finalBerqAmount = courseOldBerq + courseOldAccum + totalAmountLinkedToCourse;
      finalBerqAmount = Math.min(initialCredit, finalBerqAmount);

      const remainingCredit = initialCredit - finalBerqAmount; 

      let pendingAmt = parseNumber(getFuzzyKey(course, ["ยอดค้างชำระ", "pending"]));
      if (pendingAmt === 0) {
         const paymentType = String(getFuzzyKey(course, ["ประเภทการชำระ", "col_10"]) || '');
         if (paymentType.includes('ค้าง') || paymentType.includes('COD')) {
             const match = paymentType.match(/(?:ค้าง|COD)\s*[:/-]?\s*([\d,.]+)/i);
             if (match) {
                 pendingAmt = parseNumber(match[1]);
             }
         }
      }

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
        computedPendingAmount: pendingAmt,
        computedExpireDate: expireStr || '-', 
        computedDurationMonths: calculatedDurationMonths,
        daysLeft, 
        isExpiringSoon,
        durationText
      };
    });
  }, [courses, precomputedHistories, customers]);

  const getCustomerCourses = (phone) => processedCourses.filter(c => String(getFuzzyKey(c, ["เบอร์โทร", "col_1"]) || '') === String(phone || ''));
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
    return allMasterCourses.filter(mc => {
        const cName = mc["ชื่อคอส"] || mc["col_4"] || "";
        const match = cName.match(/(\d+)\s*(ครั้ง|c)/i);
        if (match && parseInt(match[1], 10) === 1) return false;
        
        const qtyStr = String(getFuzzyKey(mc, ["จำนวนครั้ง", "col_7", "จำนวนครั้งที่ได้"]) || '').trim();
        if (qtyStr === '1') return false;
        
        const searchStr = `${String(getFuzzyKey(mc, ["รหัสคอส", "col_1"]) || '')} ${String(getFuzzyKey(mc, ["ชื่อคอส", "col_4"]) || '')} ${String(getFuzzyKey(mc, ["ประเภท", "col_2"]) || '')}`.toLowerCase();
        return masterCourseSearch === '' || searchStr.includes(masterCourseSearch.toLowerCase());
    }).sort((a, b) => {
        const numA = parseNumber(String(getFuzzyKey(a, ["รหัสคอส", "col_1"])).replace(/[^0-9]/g, ''));
        const numB = parseNumber(String(getFuzzyKey(b, ["รหัสคอส", "col_1"])).replace(/[^0-9]/g, ''));
        if (numA !== numB) return numB - numA;
        return String(getFuzzyKey(b, ["รหัสคอส", "col_1"]) || '').localeCompare(String(getFuzzyKey(a, ["รหัสคอส", "col_1"]) || ''));
    });
  }, [allMasterCourses, masterCourseSearch]);

  const masterCourseCategories = useMemo(() => {
      const cats = new Set();
      filteredMasterCourses.forEach(mc => cats.add(String(getFuzzyKey(mc, ["ประเภท", "col_2"]) || 'ทั่วไป')));
      return ['ทั้งหมด', ...Array.from(cats)].sort();
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
            matchStatus = rawSt === 'กำลังจัดส่ง' || rawSt === 'จัดส่งแล้ว';
        } else if (filterOrderStatus === 'สำเร็จแล้ว') {
            matchStatus = ['ชำระเงินแล้ว', 'สำเร็จ', 'เรียบร้อย', 'approved', 'อนุมัติแล้ว'].includes(rawSt) || (st === 'อนุมัติแล้ว' && rawSt !== 'กำลังจัดส่ง' && rawSt !== 'จัดส่งแล้ว');
        } else if (filterOrderStatus === 'ยกเลิก') {
            matchStatus = st === 'ยกเลิก';
        } else {
            matchStatus = rawSt === filterOrderStatus || st === filterOrderStatus;
        }

        return matchSearch && matchStatus; 
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [orders, searchTerm, filterOrderStatus]);

  const sortedBookings = useMemo(() => {
    return bookings.filter(b => { 
        const matchSearch = String(b.customerName || '').includes(searchTerm) || String(b.customerPhone || '').includes(searchTerm) || String(b.courseName || '').includes(searchTerm); 
        const st = getBookingStatus(b);
        const matchStatus = filterBookingStatus === 'all' || st === filterBookingStatus; 
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
            return dt && dt.startsWith(todayStr) && getBookingStatus(b) !== 'ยกเลิก' && getBookingStatus(b) !== 'เสร็จสิ้น';
        }).length,
        badgeCount: bookings.filter(b => {
            const st = getBookingStatus(b);
            if (st === 'รอการยืนยัน') return true;
            const dt = getSafeDateTime(b);
            return dt && dt.startsWith(todayStr) && st !== 'ยกเลิก' && st !== 'เสร็จสิ้น';
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
      const qty = parseQty(getFuzzyKey(p, ["จำนวนคงเหลือ", "col_12"]));
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
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
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
      if (m) return new Date(parseInt(m[3]) - 543, parseInt(m[2]) - 1, parseInt(m[1])).getTime();
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
     const today = new Date().toISOString().split('T')[0];
     
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
                    text: newStatus === 'ยกเลิกฉุกเฉิน' ? "ขออภัยในความไม่สะดวก ทางเราจำเป็นต้องยกเลิกคิวนี้" : "แสดง E-Ticket นี้ให้พนักงานเมื่อมาถึงสาขา",
                    size: "xs",
                    color: "#ffffff",
                    margin: "sm"
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
                  (!['ยกเลิก', 'ยกเลิกฉุกเฉิน'].includes(newStatus)) ? {
                    type: "box",
                    layout: "vertical",
                    paddingTop: "12px",
                    paddingBottom: "4px",
                    contents: [
                      {
                        type: "text",
                        text: "QR Code สำหรับ Check-in",
                        size: "xs",
                        color: "#94a3b8",
                        weight: "bold",
                        align: "center"
                      },
                      {
                        type: "image",
                        url: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=1e293b&bgcolor=ffffff&data=${encodeURIComponent(String(booking.ticketNo || booking.id || 'NO_ID'))}`,
                        size: "150px",
                        align: "center",
                        margin: "sm"
                      },
                      {
                        type: "text",
                        text: String(booking.ticketNo || booking.id || "-"),
                        size: "xs",
                        color: "#64748b",
                        align: "center",
                        margin: "xs"
                      }
                    ]
                  } : { type: "filler" }
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
              const bPhone = (targetBooking.customerPhone || '').replace(/[^0-9]/g, '');
              const customer = customersRaw.find(c => {
                  const cPhone = String(getFuzzyKey(c, ["เบอร์โทร", "col_3"])).replace(/[^0-9]/g, '');
                  return cPhone === bPhone || (c.cleanPhone && c.cleanPhone === bPhone);
              });
              if (customer && customer.lineUid) {
                  sendBookingLineNotification(targetBooking, newStatus, customer.lineUid, cancelReason)
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
  const executeDeleteMasterCourse = async (id) => { try { await deleteDoc(getDocRef('master_courses', id)); showToast('ลบสำเร็จ'); } catch (err) { showToast('ข้อผิดพลาด: ' + err.message); } };
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
                "สาขา": String(useCourseData.branch || 'เฉวง'), 
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
            
            // 🔥 คำนวณราคาสุทธิ (ไม่ลดซ้ำซ้อน)
            const isVip = customer?.isApproved === true;
            const finalPrice = computeFinalPrice(prod, isVip);
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
        message: `ประวัติการใช้นี้จะถูกยกเลิกและจำนวนครั้งจะถูกคืนกลับไปยังใบคอร์ส แน่ใจหรือไม่?`, 
        confirmText: 'ยืนยันการคืนคอร์ส', 
        confirmColor: 'bg-orange-500 hover:bg-orange-600', 
        action: async () => { 
          try { 
            const batch = writeBatch(db);
            batch.update(getDocRef('histories', historyItem.id), { isCancelled: true, "สถานะ": "ยกเลิก" });
            
            if (historyItem.courseUpdatedDirectly && historyItem.courseId) {
               const course = processedCourses.find(c => c.id === historyItem.courseId);
               if (course) {
                  const currentUsed = parseNumber(getFuzzyKey(course, ["ครั้งที่ใช้", "col_5"]));
                  const qtyToRevert = extractHistoryQty(historyItem);
                  const newUsed = Math.max(0, currentUsed - qtyToRevert);
                  
                  batch.update(getDocRef('courses', historyItem.courseId), {
                     "ครั้งที่ใช้": String(newUsed),
                     "สถานะ": "ยังคงเหลือ"
                  });
               }
            }
            
            await batch.commit();
            showToast('คืนคอร์สสำเร็จ! ยอดกลับคืนสู่ใบคอร์สแล้ว'); 
            setSelectedCourse(null); 
          } catch (err) { 
            showToast('เกิดข้อผิดพลาดในการคืนคอร์ส: ' + err.message); 
          } 
        } 
      });
  };

  const executeApproveOrder = async (order) => {
    try {
        // 🌟 กันอนุมัติ "เติมเครดิต (TU)" ผ่านปุ่มอนุมัติทั่วไป — ออเดอร์เติมเครดิตไม่มี courseName/credit
        // การอนุมัติผิด flow จะสร้างคอร์สชื่อ undefined — ต้องใช้ปุ่มเติมวงเงินเครดิตโดยเฉพาะเท่านั้น
        if (order.itemType === 'topup' || order.source === 'Wallet_TopUp' || String(order.orderNo || '').startsWith('TU')) {
            showToast('⚠️ นี่คือคำสั่งซื้อ "เติมเครดิต" — อย่าอนุมัติผ่านปุ่มนี้ ให้ใช้หน้าเติมวงเงินเครดิต (Wallet) เพื่อเพิ่มเครดิตให้ลูกค้าแทน');
            return;
        }
        const cName = customersRaw.find(c => String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '') === String(order.customerPhone || '')) ? String(getFuzzyKey(customersRaw.find(c => String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '') === String(order.customerPhone || '')), ["ชื่อ", "col_1"])) : String(order.customerName || 'ลูกค้าทั่วไป');
        const courseNo = `IC${Date.now().toString().slice(-6)}`;
        await addDoc(getCol('courses'), { "เบอร์โทร": String(order.customerPhone || ''), "เลขที่ใบคอส": courseNo, "วันที่ซื้อ": new Date().toLocaleDateString('th-TH'), "ผู้ซื้อคอส": cName, "ชื่อคอส": String(order.courseName || ''), "สาขาที่ซื้อ": String(order.branch || "เฉวง"), "ราคา": String(order.price || "0"), "เครดิตที่ได้รับ": String(order.credit || order.price || "0"), "จำนวนครั้งที่ได้": String(order.qty || "1"), "ยอดค้างชำระ": "0", "ยอดชำระแล้วทั้งหมด": String(order.price || "0"), "ครั้งที่ใช้": "0", "ครั้งที่เหลือดิบ": String(order.qty || "1"), "สถานะ": "ยังคงเหลือ", "ประเภทการชำระ": "จ่ายเต็ม" });
        await addDoc(getCol('histories'), { "วันที่": new Date().toLocaleDateString('th-TH'), "ชื่อลูกค้า": cName, "เบอร์โทร": String(order.customerPhone || ''), "หมายเลขคำสั่งซื้อ": String(order.orderNo || ''), "ประเภท": "ซื้อคอร์ส", "สถานะ": "เรียบร้อย", "สินค้า": String(order.courseName || ''), "ยอดเงิน": String(order.price || "0"), "สาขา": String(order.branch || "เฉวง"), "อ้างอิง": courseNo });
        await updateDoc(getDocRef('orders', order.id), { status: 'ชำระเงินแล้ว', updatedAt: new Date().toISOString() });
        showToast('อนุมัติคำสั่งซื้อ สร้างคอร์ส และเพิ่มยอดสะสมสำเร็จ!');
        const targetCustomer = customersRaw.find(c => String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '') === String(order.customerPhone || ''));
        
        // --- Gamification Logic ---
        if (targetCustomer) {
            try {
                const gamificationSnap = await getDocs(collection(db, 'config'));
                let gamiConfig = null;
                gamificationSnap.forEach(d => { if (d.id === 'gamification') gamiConfig = d.data(); });
                
                if (gamiConfig && gamiConfig.spinSettings && gamiConfig.spinSettings.isActive) {
                    const price = Number(order.price || 0);
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
    if (newStatus === 'ชำระเงินแล้ว') setActionConfirmModal({ isOpen: true, title: 'ยืนยันอนุมัติคอร์ส', message: `ยืนยันการอนุมัติคอร์ส: ${String(order.courseName || '')} ให้กับ ${String(order.customerName || order.customerPhone || '')} ใช่หรือไม่?`, action: () => executeApproveOrder(order), confirmText: 'อนุมัติ (เพิ่มคอร์ส)', confirmColor: 'bg-emerald-500 hover:bg-emerald-600' });
    else { 
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

const isSlotTaken = (datetimeInput) => bookings.some(b => getSafeDateTime(b) === datetimeInput && getBookingStatus(b) !== 'ยกเลิก' && getBookingStatus(b) !== 'เสร็จสิ้น');

  // --- CUSTOMER ACTIONS ---
  const handleAddCustomer = async (e) => { e.preventDefault(); try { await addDoc(getCol('customers'), { "ชื่อ": String(newCustomerForm.name), "เบอร์โทร": String(newCustomerForm.phone), "ปัญหาผิวหน้า": String(newCustomerForm.issue), "หมายเลขใบสะสม": `Irismember${Math.floor(Math.random()*10000)}`, "ยอดสะสม": "0", "สถานะสมาชิก": "ยังไม่สะสมยอด" }); setIsAddCustomerOpen(false); setNewCustomerForm({ name: '', phone: '', issue: '' }); showToast('เพิ่มลูกค้าใหม่สำเร็จ!'); } catch (err) { showToast(`ข้อผิดพลาด: ${err.message}`); } };

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


  const handleCreateCourse = async (e) => { e.preventDefault(); try { await addDoc(getCol('courses'), { "เบอร์โทร": String(newCourseForm.phone), "เลขที่ใบคอส": `IC${Date.now().toString().slice(-6)}`, "วันที่ซื้อ": new Date().toLocaleDateString('th-TH'), "ผู้ซื้อคอส": customersRaw.find(c => String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '') === String(newCourseForm.phone || '')) ? String(getFuzzyKey(customersRaw.find(c => String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '') === String(newCourseForm.phone || '')), ["ชื่อ", "col_1"])) : 'ลูกค้าทั่วไป', "ชื่อคอส": String(newCourseForm.name), "สาขาที่ซื้อ": String(newCourseForm.branch), "ราคา": String(newCourseForm.price || "0"), "เครดิตที่ได้รับ": String(newCourseForm.credit || newCourseForm.price || "0"), "จำนวนครั้งที่ได้": String(newCourseForm.qty || "1"), "ยอดค้างชำระ": String(newCourseForm.pending || "0"), "ยอดชำระแล้วทั้งหมด": String(parseNumber(newCourseForm.price) - parseNumber(newCourseForm.pending)), "ครั้งที่ใช้": "0", "ครั้งที่เหลือดิบ": String(newCourseForm.qty || "1"), "สถานะ": "ยังคงเหลือ", "ประเภทการชำระ": parseNumber(newCourseForm.pending) > 0 ? "ผ่อนชำระ" : "จ่ายเต็ม" }); setIsAddCourseOpen(false); setNewCourseForm({ phone: '', name: '', qty: '1', price: '', credit: '', pending: '0', branch: globalBranch || 'เฉวง' }); showToast(`เปิดใบคอร์สใหม่สำเร็จ!`); } catch (err) { showToast('ข้อผิดพลาด: ' + err.message); } };
  
  const submitCourseBooking = async (e) => { 
      e.preventDefault(); if (isSlotTaken(bookingDateTime)) return showToast('เวลานี้มีลูกค้าจองคิวไว้แล้ว (คิวเต็ม) กรุณาเลือกเวลาอื่นครับ');
      try { await addDoc(getCol('bookings'), { courseId: String(bookingCourse?.id || ''), courseRef: String(getFuzzyKey(bookingCourse, ["เลขที่ใบคอส", "col_2"]) || ''), courseName: String(getFuzzyKey(bookingCourse, ["ชื่อคอส", "col_8"]) || 'ไม่ระบุคอร์ส'), customerName: String(getFuzzyKey(bookingCourse, ["ผู้ซื้อคอส", "col_9"]) || ''), customerPhone: String(getFuzzyKey(bookingCourse, ["เบอร์โทร", "col_1"]) || ''), dateTime: String(bookingDateTime), date: String(bookingDateTime).split('T')[0] || '', time: String(bookingDateTime).split('T')[1] || '', branch: String(bookingCourseBranch), status: 'รอการยืนยัน', createdAt: new Date().toISOString() }); setBookingCourse(null); setBookingDateTime(''); setBookingCourseBranch(globalBranch || 'เฉวง'); showToast('ส่งคำขอจองคิวสำเร็จ'); } catch (err) { showToast('ข้อผิดพลาด: ' + err.message); } 
  };
  
  const submitGeneralBooking = async (e) => { 
      e.preventDefault(); if (isSlotTaken(generalBookingForm.dateTime)) return showToast('เวลานี้มีลูกค้าจองคิวไว้แล้ว (คิวเต็ม) กรุณาเลือกเวลาอื่นครับ');
      try { 
          const isWalkIn = generalBookingForm.isWalkIn;
          const nowIso = new Date().toISOString();
          await addDoc(getCol('bookings'), { 
              courseId: '', 
              courseRef: '', 
              courseName: String(generalBookingForm.service || 'บริการทั่วไป'), 
              customerName: String(generalBookingForm.name), 
              customerPhone: String(generalBookingForm.phone), 
              dateTime: String(generalBookingForm.dateTime), 
              date: String(generalBookingForm.dateTime).split('T')[0] || '', 
              time: String(generalBookingForm.dateTime).split('T')[1] || '', 
              branch: String(generalBookingForm.branch), 
              status: isWalkIn ? 'กำลังใช้บริการ' : 'รอการยืนยัน', 
              serviceStartTime: isWalkIn ? nowIso : null,
              createdAt: nowIso 
          }); 
          setIsGeneralBookingOpen(false); 
          setGeneralBookingForm({ name: '', phone: '', service: '', dateTime: '', branch: globalBranch || 'เฉวง' }); 
          showToast(isWalkIn ? 'เพิ่มคิว Walk-in เข้าใช้บริการสำเร็จ' : 'เพิ่มคิวนัดหมายใหม่สำเร็จ'); 
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
          showToast(`ไม่พบคิวนัดหมายที่ตรงกับข้อมูล: ${val}`);
          return;
      }

      // เช็คสถานะ
      const st = getBookingStatus(found);
      if (['กำลังใช้บริการ', 'เสร็จสิ้น', 'ยกเลิก'].includes(st)) {
          showToast(`เช็คอินไม่ได้: คิวนี้มีสถานะเป็น "${st}" ไปแล้ว`);
          return;
      }

      // เช็ควันที่ - ถ้าเป็นคิววันอื่น ให้เปลี่ยนวันที่เป็นวันนี้เลย
      const dt = getSafeDateTime(found);
      const isToday = dt?.startsWith(todayStr);
      if (!isToday) {
          await updateDoc(getDocRef('bookings', found.id), { date: todayStr });
      }

      // ผ่านทุกเงื่อนไข
      await updateBookingStatus(found.id, 'กำลังใช้บริการ'); 
      setCheckInInput(''); 
      setIsCheckInOpen(false); 
      showToast(`เช็คอินสำเร็จ! ${!isToday ? '(รับคิวก่อนกำหนด) ' : ''}อัปเดตคิวของ ${found.customerName || 'ลูกค้า'} เป็น "กำลังใช้บริการ"`); 
  };
  
  const submitCreateOrder = async (e) => { e.preventDefault(); try { await addDoc(getCol('orders'), { ...newOrderForm, orderNo: `OD${Date.now().toString().slice(-6)}`, status: 'รอดำเนินการ', createdAt: new Date().toISOString() }); setIsAddOrderOpen(false); setNewOrderForm({ customerPhone: '', customerName: '', courseName: '', price: '', credit: '', qty: '1', branch: globalBranch || 'เฉวง' }); showToast('สร้างคำสั่งซื้อสำเร็จ รออนุมัติ'); } catch (err) { showToast('ข้อผิดพลาด: ' + err.message); } };
  const handleAddProduct = async (e) => { e.preventDefault(); try { await addDoc(getCol('products'), { "รหัส": String(newProductForm.code), "ชื่อสินค้า": String(newProductForm.name), "หมวดสินค้า": String(newProductForm.category), "หน่วยนับ": String(newProductForm.unit), "ราคาขายเต็ม": String(newProductForm.price), "ราคาสมาชิก": String(newProductForm.memberPrice), "จำนวนคงเหลือ": String(newProductForm.stock), "รายละเอียดสินค้า": String(newProductForm.details || ''), "isStoreUseOnly": Boolean(newProductForm.isStoreUseOnly) }); setIsAddProductOpen(false); setNewProductForm({ code: '', name: '', category: 'IRIS', unit: 'ชิ้น', price: '', memberPrice: '', stock: '0', details: '', isStoreUseOnly: false }); showToast('เพิ่มสินค้าใหม่สำเร็จ'); } catch (err) { showToast('ข้อผิดพลาด: ' + err.message); } };
  
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
              "วันที่": new Date().toLocaleDateString('th-TH'),
              "เวลา": new Date().toLocaleTimeString('th-TH', { hour12: false, hour: '2-digit', minute: '2-digit' }),
              "เบอร์โทร": selectedCustomer.computedPhone,
              "ประเภท": "ตัดคอร์ส",
              "รายการ": `โอนเครดิตไปยัง ${destPhone} ${destName}${note ? ` (${note})` : ''}`,
              "ผู้ให้บริการ": "ระบบ",
              "ยอดเบิก": String(deductAmount),
              "ลายเซ็นพนักงาน": "ระบบ"
          });
          
          const newUsedCredit = (course.computedUsedCredit || 0) + deductAmount;
          await updateDoc(getDocRef('courses', course.id), { "ยอดเบิกดิบ": String(newUsedCredit) });
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
              "วันที่": new Date().toLocaleDateString('th-TH'),
              "เวลา": new Date().toLocaleTimeString('th-TH', { hour12: false, hour: '2-digit', minute: '2-digit' }),
              "เบอร์โทร": selectedCustomer.computedPhone,
              "ประเภท": "ตัดคอร์ส",
              "รายการ": `หักลดเครดิต: ${note}`,
              "ผู้ให้บริการ": "ระบบ",
              "ยอดเบิก": String(deductAmount),
              "ลายเซ็นพนักงาน": "ระบบ"
          });
          
          const newUsedCredit = (course.computedUsedCredit || 0) + deductAmount;
          await updateDoc(getDocRef('courses', course.id), { "ยอดเบิกดิบ": String(newUsedCredit) });
          remainingToDeduct -= deductAmount;
        }
      }
      setIsCreditModalOpen(false);
      showToast('หักลดเครดิตสำเร็จ!');
    } catch (err) { showToast('ข้อผิดพลาด: ' + err.message); }
  };

  const handleSearchCustomerForTransfer = (phone) => {
    const cleanPhone = (p) => String(p || '').replace(/\D/g, '');
    const found = customersRaw.find(c => cleanPhone(c.computedPhone || getFuzzyKey(c, ["เบอร์โทร", "col_3"])) === cleanPhone(phone));
    return Promise.resolve(found || null);
  };

  const handleAddCourse = async (courseData) => {
    try {
      await addDoc(getCol('master_courses'), {
        "รหัสคอส": courseData.code,
        "col_1": courseData.code,
        "ชื่อคอส": courseData.name,
        "col_4": courseData.name,
        "ราคาขาย": courseData.price,
        "col_5": courseData.price,
        "เครดิตที่ได้รับ": courseData.credit || '0',
        "col_8": courseData.credit || '0',
        "จำนวนครั้ง": courseData.sessions || '1',
        "col_7": courseData.sessions || '1',
        "กำหนดเวลา": courseData.duration || '',
        "รายการที่ได้รับ": `${courseData.products ? 'สินค้าที่ได้รับ:\n' + courseData.products + '\n\n' : ''}${courseData.subCourses ? 'คอร์สย่อย/เสริม:\n' + courseData.subCourses : ''}`,
        "col_11": `${courseData.products ? 'สินค้าที่ได้รับ:\n' + courseData.products + '\n\n' : ''}${courseData.subCourses ? 'คอร์สย่อย/เสริม:\n' + courseData.subCourses : ''}`,
        "ฟรีบัตรสมาชิก": courseData.freeVip ? 'ใช่' : 'ไม่ใช่',
        "ประเภท": courseData.category || 'ทั่วไป'
      });
      showToast('เพิ่มคอร์สโปรโมชั่นสำเร็จ');
    } catch (err) {
      showToast('ข้อผิดพลาด: ' + err.message);
      throw err;
    }
  };
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
               <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="bg-orange-50 border border-orange-100 p-6 rounded-2xl text-center shadow-sm">
                    <p className="text-orange-500 font-bold mb-2 text-xs uppercase">ยอดสะสมสินค้า (VIP)</p>
                    <p className="text-3xl font-black text-orange-600">฿{selectedCustomer.productAccumulatedAmount?.toLocaleString() || '0'}</p>
                 </div>
                 <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl text-center shadow-sm">
                    <p className="text-gray-500 font-bold mb-2 text-xs uppercase">ยอดสะสมสุทธิ (รวม)</p>
                    <p className="text-3xl font-black text-gray-900">฿{selectedCustomer.realAccumulatedAmount?.toLocaleString() || '0'}</p>
                 </div>
               </div>
               <div className="mb-8">
                   <h3 className="font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2">ประวัติรายการสะสม</h3>
                   <HistoryTable histories={selectedCustomer.myHistories?.filter(h => !(h.isCancelled || String(getFuzzyKey(h, ["สถานะ", "col_7", "col_8", "col_9"]) || '') === 'ยกเลิก'))} />
               </div>
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
                           <tr key={i} className="hover:bg-gray-50 border-b border-gray-200">
                               <td className="border border-gray-300 p-2">{c.id.substring(0, 5)}</td>
                               <td className="border border-gray-300 p-2">{String(getFuzzyKey(c, ["ชื่อลูกค้า"]) || '')}</td>
                               <td className="border border-gray-300 p-2">{String(getFuzzyKey(c, ["ชื่อคอร์ส"]) || '')}</td>
                               <td className="border border-gray-300 p-2 text-center">{c.computedTotalQty}</td>
                               <td className="border border-gray-300 p-2 text-center">{c.computedUsedQty}</td>
                               <td className="border border-gray-300 p-2 text-center">{c.computedRemainQty}</td>
                               <td className="border border-gray-300 p-2 text-center">{c.computedRemainCredit}</td>
                               <td className="border border-gray-300 p-2 text-center">{String(getFuzzyKey(c, ["สถานะ", "col_7"]) || '')}</td>
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
  // 🌟 ตัวตนพนักงานปัจจุบัน (จาก personalEmployeeId ที่เพิ่งยืนยัน PIN)
  useEffect(() => {
    const id = localStorage.getItem('personalEmployeeId');
    if (id && employees.length > 0) {
      const emp = employees.find(e => e.id === id);
      setActiveStaff(emp || null);
    }
  }, [employees]);

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
          <SidebarItem activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} id="bookings" icon={Calendar} label="ตารางนัดหมาย" badge={bookingStats.badgeCount} />
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
            <div className={`hidden sm:flex items-center px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold border shadow-sm shrink-0 transition-colors ${isDbConnected ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
               <div className={`w-2 h-2 rounded-full mr-2 ${isDbConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>{isDbConnected ? 'Cloud' : 'Connecting...'}
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
          
          {courses.length === 0 && customersRaw.length === 0 && histories.length === 0 && activeTab !== 'settings' && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-0 flex flex-col items-center justify-center p-6">
               <div className="bg-white p-8 rounded-3xl shadow-xl border border-teal-100 text-center max-w-md animate-pulse">
                  <div className="w-16 h-16 bg-teal-50 text-teal-500 rounded-full flex items-center justify-center mx-auto mb-4"><Upload size={32} /></div>
                  <h3 className="text-lg font-black text-gray-800 mb-2">ฐานข้อมูลว่างเปล่า (เชื่อมต่อ Firebaseแล้ว)</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">กรุณากดปุ่ม <b>"นำเข้า..."</b> ที่มุมขวาบน เพื่ออัปโหลดไฟล์ CSV เข้าสู่ระบบฐานข้อมูลคลาวด์ของคุณครับ</p>
               </div>
            </div>
          )}

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
              onGoToLogin={() => setShowBranchSelectForPos(true)}
              onGoBack={() => setActiveTab('dashboard')}
              onAddCustomer={() => setIsAddCustomerOpen(true)}
              autoOpenEod={posAutoOpenEod}
              onQuickEodFinished={handleQuickEodFinished}
            />
            </ErrorBoundary>
          )}

          {activeTab === 'course_deduction' && (
            <CourseDeductionSystem
              customers={customers}
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
                                 <p className="text-xs font-bold text-slate-600 truncate">{b.customerName || b.customerPhone}</p>
                                 <p className="text-[10px] font-bold text-indigo-600 mt-1 line-clamp-2">{b.courseName}</p>
                              </div>
                           </div>
                        ));
                     })()}
                  </div>
               </div>
               
               {/* Staff Tabs */}
               <div className="flex bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6 flex-wrap">
                  <button onClick={() => setStaffDashboardTab('used_course')} className={`flex-1 min-w-[120px] py-4 font-bold text-sm transition-colors flex items-center justify-center gap-2 ${staffDashboardTab === 'used_course' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                     <CheckCircle size={16} /> ใช้คอร์ส / รับบริการ
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
                             const todayIsoStr = new Date().toISOString().split('T')[0];
                             
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
                                if (rows.length === 0) return <div className="px-6 py-12 text-center text-gray-400 font-bold bg-white rounded-2xl border border-gray-100">ไม่มีประวัติการใช้คอร์สในวันนี้</div>;
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
                                        {renderEmpAvatar(r['พนักงาน'])}
                                        <div className="font-black text-emerald-600">฿{Number(r['จำนวนเงิน'] || r['ยอดรวม'] || r['ราคา'] || 0).toLocaleString()}</div>
                                      </div>
                                      <div className="hidden sm:block text-gray-400 font-bold text-sm w-16 text-right shrink-0">{r['เวลา'] || '-'}</div>
                                   </div>
                                ));
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
                      <select value={filterBookingStatus} onChange={(e) => setFilterBookingStatus(e.target.value)} className="bg-gray-50 rounded-xl px-3 py-2 text-sm font-bold outline-none border border-gray-200 flex-1 sm:w-auto min-w-[120px]"><option value="all">สถานะทั้งหมด</option><option value="รอการยืนยัน">รอการยืนยัน</option><option value="ยืนยันแล้ว">ยืนยันแล้ว</option><option value="กำลังใช้บริการ">กำลังใช้บริการ</option><option value="เสร็จสิ้น">เสร็จสิ้น</option><option value="ยกเลิก">ยกเลิก</option><option value="ยกเลิกฉุกเฉิน">🚨 ยกเลิกฉุกเฉิน</option></select>
                      
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
                                                                    </div>
                                                                    <select value={st} onChange={(e) => updateBookingStatus(b.id, e.target.value)} onClick={(e) => e.stopPropagation()} className={`px-2 py-0.5 rounded text-[9px] font-bold border outline-none appearance-none cursor-pointer ${st === 'รอการยืนยัน' ? 'bg-amber-50 text-amber-600 border-amber-300' : st === 'ยืนยันแล้ว' ? 'bg-blue-50 text-blue-600 border-blue-300' : st === 'กำลังใช้บริการ' ? 'bg-purple-50 text-purple-600 border-purple-300 animate-pulse' : st === 'เสร็จสิ้น' ? 'bg-emerald-50 text-emerald-600 border-emerald-300' : 'bg-gray-50 text-gray-600 border-gray-300'}`}>
                                                                        <option value="รอการยืนยัน">รอการยืนยัน</option>
                                                                        <option value="ยืนยันแล้ว">ยืนยันแล้ว</option>
                                                                        <option value="กำลังใช้บริการ">กำลังใช้บริการ</option>
                                                                        <option value="เสร็จสิ้น">เสร็จสิ้น</option>
                                                                        <option value="ยกเลิก">ยกเลิก</option>
                                                                        <option value="ยกเลิกฉุกเฉิน">🚨 ยกเลิกฉุกเฉิน</option>
                                                                    </select>
                                                                </div>
                                                                
                                                                <div className="flex flex-wrap gap-1 mb-2">
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
                                                                
                                                                <div className="flex justify-between items-end mt-auto">
                                                                    <div>
                                                                        <p className="text-[8px] font-bold text-gray-400 mb-0.5">วันที่</p>
                                                                        <p className="font-black text-gray-800 text-[11px]">{dtSafe ? new Date(dtSafe).toLocaleDateString('th-TH', {day: 'numeric', month: 'numeric', year: 'numeric'}) : '-'}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[8px] font-bold text-gray-400 mb-0.5 flex items-center gap-1">เวลา {timeDiffStr && <span className={`text-[8px] px-1 rounded border ${timeDiffColor}`}>{timeDiffStr}</span>}</p>
                                                                        <p className={`font-black text-[15px] leading-none ${st === 'รอการยืนยัน' ? 'text-amber-500' : st === 'ยืนยันแล้ว' ? 'text-blue-500' : st === 'กำลังใช้บริการ' ? 'text-purple-500' : st === 'เสร็จสิ้น' ? 'text-emerald-500' : 'text-gray-500'}`}>
                                                                            {dtSafe ? dtSafe.split('T')[1]?.substring(0,5) : '-'} <span className="text-[9px]">น.</span>
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                                                                        <MapPin size={10} className="text-gray-400" />
                                                                        <p className="font-bold text-gray-700 text-[9px] leading-tight truncate max-w-[60px]">{String(b.branch || 'เฉวง')}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="w-10 shrink-0 border-l-2 border-dashed border-gray-100 flex flex-col items-center justify-center bg-gray-50/30 hover:bg-gray-100 transition-colors relative group">
                                                                <QrCode size={16} className={`${st === 'รอการยืนยัน' ? 'text-amber-400' : st === 'ยืนยันแล้ว' ? 'text-blue-400' : st === 'กำลังใช้บริการ' ? 'text-purple-400' : st === 'เสร็จสิ้น' ? 'text-emerald-400' : 'text-gray-400'}`} />
                                                                <div className="absolute top-1/2 -translate-y-1/2 right-full mr-1 flex flex-row items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all z-10 bg-white/95 backdrop-blur-sm p-1.5 rounded-2xl shadow-md border border-gray-100 translate-x-2 group-hover:translate-x-0" style={{ width: 'max-content', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                                                                    <button onClick={(e) => { e.stopPropagation(); setActionConfirmModal({ isOpen: true, title: 'ลบนัดหมาย', message: 'แน่ใจหรือไม่ที่จะลบรายการนัดหมายนี้?', action: () => executeDeleteBooking(b.id), confirmText: 'ลบ', confirmColor: 'bg-red-600 hover:bg-red-700' }); }} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors shrink-0" title="ลบ"><Trash2 size={14}/></button>
                                                                    {(st === 'รอการยืนยัน' || st === 'ยืนยันแล้ว') && (
                                                                        <>
                                                                            <button onClick={(e) => { e.stopPropagation(); updateBookingStatus(b.id, 'ยกเลิกฉุกเฉิน'); }} className="p-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-xl transition-colors flex items-center justify-center text-[14px] shrink-0" title="ยกเลิกฉุกเฉิน">🚨</button>
                                                                            <button onClick={(e) => { e.stopPropagation(); updateBookingStatus(b.id, 'กำลังใช้บริการ'); showToast('เช็คอินสำเร็จ'); }} className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-colors shrink-0" title="เช็คอิน"><ScanLine size={14}/></button>
                                                                            <button onClick={(e) => { e.stopPropagation(); setPrintingJobSlipBooking(b); }} className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-colors shrink-0" title="พิมพ์ใบงาน"><Printer size={14}/></button>
                                                                        </>
                                                                    )}
                                                                    {st === 'รอการยืนยัน' && <button onClick={(e) => { e.stopPropagation(); updateBookingStatus(b.id, 'ยืนยันแล้ว'); showToast('ยืนยันคิวสำเร็จ'); }} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors shrink-0" title="ยืนยันคิว"><CheckCircle size={14}/></button>}
                                                                </div>
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
                                            <select value={st} onChange={(e) => updateBookingStatus(b.id, e.target.value)} onClick={(e) => e.stopPropagation()} className={`px-2 py-0.5 rounded text-[9px] font-bold border outline-none appearance-none cursor-pointer ${st === 'รอการยืนยัน' ? 'bg-amber-50 text-amber-600 border-amber-300' : st === 'ยืนยันแล้ว' ? 'bg-blue-50 text-blue-600 border-blue-300' : st === 'กำลังใช้บริการ' ? 'bg-purple-50 text-purple-600 border-purple-300 animate-pulse' : st === 'เสร็จสิ้น' ? 'bg-emerald-50 text-emerald-600 border-emerald-300' : 'bg-gray-50 text-gray-600 border-gray-300'}`}>
                                                                        <option value="รอการยืนยัน">รอการยืนยัน</option>
                                                                        <option value="ยืนยันแล้ว">ยืนยันแล้ว</option>
                                                                        <option value="กำลังใช้บริการ">กำลังใช้บริการ</option>
                                                                        <option value="เสร็จสิ้น">เสร็จสิ้น</option>
                                                                        <option value="ยกเลิก">ยกเลิก</option>
                                                                        <option value="ยกเลิกฉุกเฉิน">🚨 ยกเลิกฉุกเฉิน</option>
                                                                    </select>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-1 mb-2">
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
                                        
                                        <div className="flex justify-between items-end mt-auto">
                                            <div>
                                                <p className="text-[8px] font-bold text-gray-400 mb-0.5">วันที่</p>
                                                <p className="font-black text-gray-800 text-[11px]">{dtSafe ? new Date(dtSafe).toLocaleDateString('th-TH', {day: 'numeric', month: 'numeric', year: 'numeric'}) : '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-bold text-gray-400 mb-0.5">เวลา</p>
                                                <p className={`font-black text-[15px] leading-none ${st === 'รอการยืนยัน' ? 'text-amber-500' : st === 'ยืนยันแล้ว' ? 'text-blue-500' : st === 'กำลังใช้บริการ' ? 'text-purple-500' : st === 'เสร็จสิ้น' ? 'text-emerald-500' : 'text-gray-500'}`}>
                                                    {dtSafe ? dtSafe.split('T')[1]?.substring(0,5) : '-'} <span className="text-[9px]">น.</span>
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                                                <MapPin size={10} className="text-gray-400" />
                                                <p className="font-bold text-gray-700 text-[9px] leading-tight truncate max-w-[60px]">{String(b.branch || 'เฉวง')}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-12 shrink-0 border-l-2 border-dashed border-gray-100 flex flex-col items-center justify-center bg-gray-50/30 hover:bg-gray-100 transition-colors relative group">
                                        <QrCode size={18} className={`${st === 'รอการยืนยัน' ? 'text-amber-400' : st === 'ยืนยันแล้ว' ? 'text-blue-400' : st === 'กำลังใช้บริการ' ? 'text-purple-400' : st === 'เสร็จสิ้น' ? 'text-emerald-400' : 'text-gray-400'}`} />
                                        <div className="absolute top-1/2 -translate-y-1/2 right-full mr-1 flex flex-row items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all z-10 bg-white/95 backdrop-blur-sm p-1.5 rounded-2xl shadow-md border border-gray-100 translate-x-2 group-hover:translate-x-0" style={{ width: 'max-content', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                                            <button onClick={(e) => { e.stopPropagation(); setActionConfirmModal({ isOpen: true, title: 'ลบนัดหมาย', message: 'แน่ใจหรือไม่ที่จะลบรายการนัดหมายนี้?', action: () => executeDeleteBooking(b.id), confirmText: 'ลบ', confirmColor: 'bg-red-600 hover:bg-red-700' }); }} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors shrink-0" title="ลบ"><Trash2 size={14}/></button>
                                            {(st === 'รอการยืนยัน' || st === 'ยืนยันแล้ว') && (
                                                <>
                                                    <button onClick={(e) => { e.stopPropagation(); updateBookingStatus(b.id, 'ยกเลิกฉุกเฉิน'); }} className="p-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-xl transition-colors flex items-center justify-center text-[14px] shrink-0" title="ยกเลิกฉุกเฉิน">🚨</button>
                                                    <button onClick={(e) => { e.stopPropagation(); updateBookingStatus(b.id, 'กำลังใช้บริการ'); showToast('เช็คอินสำเร็จ'); }} className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-colors shrink-0" title="เช็คอิน"><ScanLine size={14}/></button>
                                                    <button onClick={(e) => { e.stopPropagation(); setPrintingJobSlipBooking(b); }} className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-colors shrink-0" title="พิมพ์ใบงาน"><Printer size={14}/></button>
                                                </>
                                            )}
                                            {st === 'รอการยืนยัน' && <button onClick={(e) => { e.stopPropagation(); updateBookingStatus(b.id, 'ยืนยันแล้ว'); showToast('ยืนยันคิวสำเร็จ'); }} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors shrink-0" title="ยืนยันคิว"><CheckCircle size={14}/></button>}
                                        </div>
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
                                const customer = customersRaw.find(c => String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '') === String(o.customerPhone || ''));
                                let posItems = [];
                                if (o.cartItems && Array.isArray(o.cartItems) && o.cartItems.length > 0) {
                                    posItems = o.cartItems.map((item, i) => ({
                                        id: `${o.id}_${i}`, name: String(item.name || 'สินค้าจากคำสั่งซื้อ'), price: parseNumber(item.price), qty: parseNumber(item.qty || '1'), type: 'product', skipStockUpdate: true, maxQty: 9999, originalItem: { id: o.id, "ชื่อสินค้า": item.name, "ราคาขาย": item.price }, isManualPrice: true
                                    }));
                                } else {
                                    posItems = [{
                                        id: o.id, name: String(o.courseName || 'สินค้าจากคำสั่งซื้อ'), price: parseNumber(o.price), qty: parseNumber(o.qty || '1'), type: 'product', skipStockUpdate: true, maxQty: 9999, originalItem: { id: o.id, "ชื่อสินค้า": o.courseName, "ราคาขาย": o.price }, isManualPrice: true
                                    }];
                                }
                                const event = new CustomEvent('add-to-pos-cart', { detail: { items: posItems, customer: customer || null } });
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
                         {masterCourseCategories.map(cat => (
                            <button key={cat} onClick={() => setMasterCourseTab(cat)} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${masterCourseTab === cat ? 'bg-cyan-500 text-white border-cyan-500 shadow-md transform scale-105' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'}`}>{cat}</button>
                         ))}
                     </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pb-10">
                {filteredMasterCourses.filter(mc => masterCourseTab === 'ทั้งหมด' || String(getFuzzyKey(mc, ["ประเภท", "col_2"]) || 'ทั่วไป') === masterCourseTab).slice(0, 100).map((mc, idx) => {
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

                  return (
                  <div key={idx} className="bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm hover:shadow-lg transition-all flex flex-col relative overflow-hidden group border-t-4 border-t-cyan-400">
                     <div className="flex justify-between items-start mb-3">
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

                     <div className="flex justify-end mt-4 pt-4 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setActionConfirmModal({ isOpen: true, title: 'ลบคอร์สตั้งต้น', message: 'แน่ใจหรือไม่ที่จะลบรายการคอร์สนี้?', action: () => executeDeleteMasterCourse(mc.id), confirmText: 'ลบ', confirmColor: 'bg-red-600 hover:bg-red-700' })} className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg flex items-center"><Trash2 size={14} className="mr-1"/> ลบ</button>
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
              inventoryLogs={[]}
              triggerToast={triggerToast}
              setActionConfirmModal={setActionConfirmModal}
              wooIdMap={wooIdMap}
              onAddProduct={() => setIsAddProductOpen(true)}
            />
          )}

          {activeTab === 'employees' && globalRole === 'owner' && <EmployeeDashboard employees={employees} requisitions={employeeRequisitions} jobApplications={jobApplications} attendance={employeeAttendance} histories={histories} branches={branches} leaves={employeeLeaves} advancePayments={advancePayments} dailySales={dailySales} appSettings={appSettings} orders={orders} serviceLogs={serviceLogs} onGoToPOS={handlePosAccess} />}

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
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-gray-50 rounded-xl px-3 py-2 text-sm font-bold flex-1 sm:w-auto min-w-[120px] outline-none border border-gray-200"><option value="all">สถานะทั้งหมด</option><option value="ยังคงเหลือ">ยังคงเหลือ</option><option value="ใช้ครบแล้ว">ใช้ครบแล้ว</option><option value="หมดอายุ">หมดอายุ</option></select>
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
                  const courseCustomerPhone = String(getFuzzyKey(course, ["เบอร์โทร", "col_1"]) || '');
                  const picData = getProfilePicData({customerPhone: courseCustomerPhone}, customersRaw);
                  return (
                    <div key={idx} className={`bg-white border-2 ${isPendingPayment ? 'border-red-100 shadow-red-100/50' : 'border-gray-100'} rounded-[24px] p-5 shadow-sm hover:shadow-lg transition-all cursor-pointer relative overflow-hidden group flex flex-col`} onClick={() => setSelectedCourse(course)}>
                       <div className={`absolute top-0 left-0 w-1.5 h-full ${isPendingPayment ? 'bg-red-400' : course.computedStatus === 'ยังคงเหลือ' ? 'bg-gradient-to-b from-teal-400 to-emerald-500' : course.computedStatus === 'หมดอายุ' ? 'bg-gradient-to-b from-rose-400 to-red-500' : 'bg-gray-300'}`}></div>
                       <div className="flex justify-between items-start mb-3 pl-2 relative">
                          <div className="font-bold text-teal-700 text-sm line-clamp-1 pr-6">{String(getFuzzyKey(course, ["ชื่อคอส", "col_8"]) || '-')}</div>
                          <span className={`px-2 py-1 rounded-lg text-[9px] font-black shrink-0 absolute right-0 top-0 ${course.computedStatus === 'ยังคงเหลือ' ? 'bg-teal-50 text-teal-700 border border-teal-200' : course.computedStatus === 'ใช้ครบแล้ว' ? 'bg-blue-50 text-blue-700 border border-blue-200' : course.computedStatus === 'หมดอายุ' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>{course.computedStatus}</span>
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
                            <div className="text-[10px] text-gray-500 font-mono mb-2 flex items-center gap-2">
                                <span>{courseCustomerPhone || '-'}</span>
                                {String(course.courseRefKey || '').startsWith('IC') ? (
                                    <span className="text-[8px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">POS</span>
                                ) : (
                                    <span className="text-[8px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold">เก่า</span>
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
                    <button onClick={() => setIsAddressManagerOpen(true)} className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center shadow-lg active:scale-95 shrink-0"><MapPin size={16} className="mr-1"/> จัดการที่อยู่จัดส่ง</button>
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
                             <h4 className="font-black text-gray-900 text-sm line-clamp-1 flex items-center gap-1">
                                 {customer.computedName}
                                 {customer.lineUid && (
                                     <span className="text-[#06C755]" title="เชื่อมต่อ LINE แล้ว">
                                         <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.122.295.079.756.039 1.066l-.172 1.028c-.05.293-.239 1.168 1.026.634 1.265-.534 6.817-4.01 9.324-6.883 1.83-2.096 2.69-4.041 2.69-6.045z"/></svg>
                                     </span>
                                 )}
                             </h4>
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
                   <button onClick={() => {
                     setPosPreselectedCustomer(selectedCustomer);
                     setActiveTab('pos');
                     setSelectedCustomer(null);
                     window.scrollTo({ top: 0, behavior: 'smooth' });
                   }} className="bg-teal-500 hover:bg-teal-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-teal-500/30 flex items-center justify-center text-lg active:scale-95 transition-all"><CheckCircle className="mr-2"/> รับบริการ / เบิกสินค้า (POS)</button>
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
                    {!selectedCustomer.isApproved && selectedCustomer.productAccumulatedAmount >= 5000 && (
                        <button onClick={() => setIsVipFormOpen(true)} className="p-2.5 bg-orange-500 rounded-full hover:bg-orange-600 transition-colors text-white shadow-lg animate-bounce flex items-center gap-1.5 px-4" title="อนุมัติสิทธิ์ VIP"><Award size={16}/><span className="text-[11px] font-bold uppercase tracking-wider hidden sm:inline">อัปเกรด VIP</span></button>
                    )}
                    <button onClick={() => { 
                      const cCourses = getCustomerCourses(selectedCustomer.computedPhone).filter(c => (c.computedTotalCredit || 0) > 0);
                      setActiveCreditCourses(cCourses);
                      setIsCreditModalOpen(true); 
                    }} className="p-2.5 bg-blue-500 hover:bg-blue-600 transition-colors text-white shadow-sm flex items-center gap-1.5 px-4 rounded-full" title="จัดการวงเงินเครดิต">
                        <Wallet size={16}/><span className="text-[11px] font-bold tracking-wider hidden sm:inline">จัดการวงเงินเครดิต</span>
                    </button>
                    <button onClick={() => { setEditCustomerData({ id: selectedCustomer.id, name: selectedCustomer.computedName, phone: selectedCustomer.computedPhone, issue: selectedCustomer.computedIssue }); setIsEditCustomerOpen(true); }} className="p-2.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors text-white shadow-sm" title="แก้ไขข้อมูลลูกค้า"><PenTool size={18}/></button>
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
                                <button onClick={() => setIsAddDocumentOpen(true)} className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold px-3 py-2 rounded-lg flex items-center transition-colors shadow-sm">
                                    <Plus size={14} className="mr-1"/> เพิ่มเอกสารใหม่
                                </button>
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
                                                        <button onClick={() => handleDeleteDocument(docItem)} className="text-red-400 hover:text-red-600 p-1 bg-red-50 rounded-lg hover:bg-red-100 transition-colors" title="ลบเอกสาร"><Trash2 size={16}/></button>
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
               const mcPrice = parseNumber(getFuzzyKey(mc, ["ราคา", "col_5"]));
               const mcQty = parseQty(getFuzzyKey(mc, ["จำนวนครั้งที่ได้", "col_13"]));
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

      {/* General Booking Modal - Customer App Style */}
      {/* General Booking Modal - Customer App Style */}
      <ModalWrapper isOpen={isGeneralBookingOpen} onClose={() => setIsGeneralBookingOpen(false)} title="จองคิว / นัดหมายใหม่" icon={CalendarPlus} colorClass="bg-gradient-to-r from-teal-500 to-emerald-500 text-white">
         <AdminBookingForm
             customers={customers}
             initialBranch={globalBranch || 'เฉวง'}
             isSlotTaken={isSlotTaken}
             onClose={() => setIsGeneralBookingOpen(false)}
             onSubmit={async (formData) => {
                 try { 
                     await addDoc(getCol('bookings'), { 
                         courseId: '', courseRef: '', 
                         courseName: String(formData.service || 'บริการทั่วไป'), 
                         customerName: String(formData.name), 
                         customerPhone: String(formData.phone), 
                         dateTime: String(formData.dateTime),
                         date: String(formData.date || formData.dateTime.split('T')[0]),
                         time: String(formData.time || formData.dateTime.split('T')[1]),
                         branch: String(formData.branch), 
                         status: 'รอการยืนยัน', 
                         createdAt: new Date().toISOString() 
                     }); 
                     setIsGeneralBookingOpen(false); 
                     showToast('เพิ่มคิวนัดหมายใหม่สำเร็จ'); 
                 } catch (err) { 
                     showToast('ข้อผิดพลาด: ' + err.message); 
                 }
             }}
         />
      </ModalWrapper>

      <AddCourseModal isOpen={isAddMasterCourseOpen} onClose={() => setIsAddMasterCourseOpen(false)} onAdd={handleAddCourse} products={products} masterCourses={masterCourses} />

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
              
              <div className="bg-white p-2 rounded-2xl border-2 border-gray-100 shadow-sm mb-6 inline-block">
                  <QRCodeSVG value={bookingTicket.id || bookingTicket.ticketNo || ''} size={120} level="H" />
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
          histories={histories}
          dailySales={dailySales}
          appSettings={appSettings}
          orders={orders}
          serviceLogs={serviceLogs}
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

         <button onClick={() => { setActiveTab('bookings'); setIsMobileMoreMenuOpen(false); }} className={`flex flex-col items-center justify-center w-full h-full pb-1.5 space-y-1 ${activeTab === 'bookings' ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600'}`}>
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
    </div>
  );
}
