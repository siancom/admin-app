import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle,
  Scissors, Search, Info, ShoppingCart, Package, Layers, User, Trash2, UserPlus,
  CheckCircle, Plus, Minus, CreditCard, Banknote, Smartphone, X, Clock, DollarSign, ChevronLeft, ChevronRight, Truck, FileText, Calendar, Camera, Award, Printer, Maximize, Minimize, ScanLine, QrCode, Edit, Ticket
} from 'lucide-react';
import { db, getCol } from '../config/firebase';
import { addDoc, updateDoc, doc, getDocs, query, where, writeBatch, orderBy, limit, collection } from 'firebase/firestore';
import { getFuzzyKey } from '../utils/fuzzy';
import imageCompression from 'browser-image-compression';
import { parseNumber, parseQty, getTotalStock, getBranchStock, getLocalYYYYMMDD } from '../utils/parse';
import { getProfilePicData, handleProfileImgError } from '../utils/imageUtils';
import { getVipDiscountRate, computeFinalPrice, getOwnerDiscountRate, computeOwnerCostPrice } from '../utils/priceUtils';
import { fetchWithProxy, fetch17Track } from '../utils/wooProxy';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';
import generatePayload from 'promptpay-qr';
import TreatmentJobSlipModal from './TreatmentJobSlipModal';
import RoomManagementBoard from './RoomManagementBoard';
import { sendOrderLineNotification, sendPOSCheckoutNotification, sendCourseDeductionNotification } from '../utils/lineUtils';
import FollowUpPromptModal from './FollowUpPromptModal';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import IShipBookingModal from './IShipBookingModal';

// Lazy load heavy components to avoid Vite circular dependency bugs in minified builds
const SignaturePad = React.lazy(() => import('./SignaturePad'));
const ShopeeImportModal = React.lazy(() => import('./ShopeeImportModal'));
const SalesHistoryModal = React.lazy(() => import('./SalesHistoryModal'));
const BarcodeScannerModal = React.lazy(() => import('./BarcodeScannerModal'));
const CosmeticsIcon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="4" y="3" width="4" height="4" rx="1" />
    <path d="M3 7h6" />
    <path d="M3 7c0 3 1 14 1 14h4c0 0 1-11 1-14" />
    <rect x="13" y="10" width="8" height="3" rx="1" />
    <path d="M14 13v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-6" />
    <path d="M14 17h6" />
  </svg>
);

export default function POSSystem({ 
  products = [], 
  branches = [],
  masterCourses = [], 
  promotions = [],
  customers = [],
  courses = [],
  histories = [],
  bookings = [],
  orders = [],
  dailySales = [],
  showToast,
  globalBranch,
  globalRole,
  appSettings = { monthlyTarget: 0 },
  employees = [],
  employeeAttendance = [],
  clockedInEmployees = [],
  wooImagesMap = new Map(),
  wooIdMap = new Map(),
  onViewCustomerProfile = () => {},
  posPreselectedCustomer,
  posParkedOrderToResume,
  onClearParkedOrderToResume,
  clearPosPreselectedCustomer,
  onGoToLogin,
  onChangeBranch,
  onGoBack,
  onAddCustomer,
  onOpenVipForm = () => {},
  autoOpenEod = null, // 🌟 ส่งยอดด่วนจากหน้าล็อกอิน: { employeeId }
  onQuickEodFinished = () => {}
}) {
  // 🌟 โหมดส่งยอดด่วน — เปิดหน้า EOD ทันที (ไม่เด้ง SOD) และแจ้ง parent เมื่อปิดหน้าต่าง
  const quickEodActiveRef = useRef(!!autoOpenEod);
  const quickEodSubmittedRef = useRef(false);
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'courses' | 'my_courses'
  const [singleCourseTab, setSingleCourseTab] = useState('machine');
  const [multiCourseTab, setMultiCourseTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Start of Day (SOD) State
  const [showSodModal, setShowSodModal] = useState(false);
  const [pendingCheckInBooking, setPendingCheckInBooking] = useState(null);
  const [printingJobSlipBooking, setPrintingJobSlipBooking] = useState(null);
  const [hasCheckedSod, setHasCheckedSod] = useState(false);
  const [sodData, setSodData] = useState({ floatCash: '', submittedBy: '' });
  const [isSubmittingSod, setIsSubmittingSod] = useState(false);

  const COURSE_TABS = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'facial', label: 'ผิวหน้า (A-J)' },
    { id: 'acne_clear', label: 'เคลียร์สิว' },
    { id: 'machine', label: 'ลงเครื่อง' },
    { id: 'acne_sets', label: 'รักษาสิว/ฝ้า' },
    { id: 'nourish', label: 'บำรุงฟื้นฟู' },
    { id: 'ipl', label: 'IPL กำจัดขน' },
    { id: 'walkin', label: 'วอคอิน' }
  ];

  const getCourseCategory = (c) => {
    if (!c) return 'other';
    
    const type = String(getFuzzyKey(c, ["ประเภท", "col_2"]) || '');
    if (type === 'ผิวหน้า (A-J)') return 'facial';
    if (type === 'เคลียร์สิว') return 'acne_clear';
    if (type === 'ลงเครื่อง') return 'machine';
    if (type === 'รักษาสิว/ฝ้า') return 'acne_sets';
    if (type === 'บำรุงฟื้นฟู') return 'nourish';
    if (type === 'IPL กำจัดขน') return 'ipl';
    if (type === 'วอคอิน') return 'walkin';
    
    let code = String(getFuzzyKey(c, ["รหัสคอส", "col_1"]) || '');
    if (!code) return 'other';
    if (!code.startsWith('F-')) return 'old_courses';
    if (code.startsWith('F-MA') || code.startsWith('F-M')) return 'machine';
    if (code.startsWith('F-S')) return 'acne_sets';
    if (code.startsWith('F-N')) return 'nourish';
    if (code.startsWith('F-AC')) return 'acne_clear';
    if (code.startsWith('F-IPL')) return 'ipl';
    if (/^F-[A-J]/.test(code)) return 'facial';
    return 'other';
  };
  
  const [cart, setCart] = useState([]);
  const [activeCustomerAppOrderIds, setActiveCustomerAppOrderIds] = useState([]);
  // 🌟 ยอดที่ลูกค้า "จ่ายเครดิตไปแล้วในแอป" ของออเดอร์ที่โหลดเข้าตะกร้า — ใช้กัน POS ตัดเครดิตซ้ำ 2 ครั้ง
  const [appCreditPaidAmount, setAppCreditPaidAmount] = useState(0);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState('');
  const [discountVal, setDiscountVal] = useState(0);
  const [discountType, setDiscountType] = useState('percent'); // 'percent' | 'amount'
  const [showWebOrdersModal, setShowWebOrdersModal] = useState(false);
  const [showCustomerContextModal, setShowCustomerContextModal] = useState(false);
  const [showSalesHistory, setShowSalesHistory] = useState(false);
  const [showShopeeModal, setShowShopeeModal] = useState(false);
  const [showDiscountSection, setShowDiscountSection] = useState(false);
  const [viewCourseDetails, setViewCourseDetails] = useState(null);
  const [selectedCourseForUsage, setSelectedCourseForUsage] = useState(null);
  const [isSyncingWoo, setIsSyncingWoo] = useState(false);
  const [isLoadingCompare, setIsLoadingCompare] = useState(false);
  const [wooSyncDiff, setWooSyncDiff] = useState(null);
  const [selectedBed, setSelectedBed] = useState('');
  
  const [showParkBedModal, setShowParkBedModal] = useState(false);
  const [parkBedNumber, setParkBedNumber] = useState('1');
  const [ishipModal, setIshipModal] = useState({ isOpen: false });
  const [isFullscreen, setIsFullscreen] = useState(() => !!document.fullscreenElement);
  const [editingCoursePrice, setEditingCoursePrice] = useState(null);
  const posRef = useRef(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      // Sync body class immediately in the event handler (not deferred via useEffect)
      // to avoid a 1-frame flash of the sidebar re-appearing
      if (fs) {
        document.body.classList.add('pos-fullscreen-active');
      } else {
        document.body.classList.remove('pos-fullscreen-active');
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.warn(err.message));
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  const [isStockMode, setIsStockMode] = useState(false);
  const [isRequisitionMode, setIsRequisitionMode] = useState(false);
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  const [stockAdjustments, setStockAdjustments] = useState([]);
  const [stockInputModal, setStockInputModal] = useState({ isOpen: false, item: null, inputVal: '' });
  const [isStockConfirmModalOpen, setIsStockConfirmModalOpen] = useState(false);

  // Keep body class in sync with React state as a secondary safety net
  useEffect(() => {
    if (isFullscreen) {
      document.body.classList.add('pos-fullscreen-active');
    } else {
      // Only remove if browser is truly not fullscreen to avoid race condition
      if (!document.fullscreenElement) {
        document.body.classList.remove('pos-fullscreen-active');
      }
    }
  }, [isFullscreen]);

  // Cleanup only removes body class if browser is not fullscreen at unmount time
  useEffect(() => {
    return () => {
      if (!document.fullscreenElement) {
        document.body.classList.remove('pos-fullscreen-active');
      }
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  React.useEffect(() => {
    if (posParkedOrderToResume && posParkedOrderToResume.cartItems) {
      setCart(posParkedOrderToResume.cartItems);
      setActiveCustomerAppOrderIds(prev => [...new Set([...prev, posParkedOrderToResume.id])]);
      
      if (posParkedOrderToResume.customerPhone) {
         const cleanPhone = posParkedOrderToResume.customerPhone.replace(/[^0-9]/g, '');
         const targetCustomer = customers.find(c => {
             const phoneRaw = String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '');
             return phoneRaw.replace(/[^0-9]/g, '') === cleanPhone;
         });
         if (targetCustomer) {
            setSelectedCustomer(targetCustomer);
         }
      }
      onClearParkedOrderToResume();
    }
  }, [posParkedOrderToResume, customers, onClearParkedOrderToResume]);

  // Helper for branch stock
  const [isBedModalOpen, setIsBedModalOpen] = useState(false);
  // Checkout Details
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  // Listen for items from MoleRemovalSystem
  React.useEffect(() => {
    const handleAddItems = (e) => {
        const { items, customer } = e.detail;
        if (customer && !selectedCustomer) {
            setSelectedCustomer(customer);
        }
        if (items && items.length > 0) {
            setCart(prev => {
                const newCart = [...prev];
                items.forEach(item => {
                    const existIdx = newCart.findIndex(c => c.id === item.id && c.name === item.name && c.price === item.price);
                    if (existIdx > -1) {
                        newCart[existIdx] = { ...newCart[existIdx], qty: newCart[existIdx].qty + item.qty };
                    } else {
                        newCart.push({ ...item });
                    }
                });
                return newCart;
            });
        }
    };
    window.addEventListener('add-to-pos-cart', handleAddItems);
    return () => window.removeEventListener('add-to-pos-cart', handleAddItems);
  }, [selectedCustomer]);

  // Check for Start of Day (SOD)
  useEffect(() => {
    const checkSod = async () => {
      if (hasCheckedSod) return;
      try {
        const todayStr = new Date().toLocaleDateString('th-TH');
        const branchName = globalBranch || "สำนักงานใหญ่";
        const sodQuery = query(
          getCol('pos_sessions'),
          where('date', '==', todayStr),
          where('branch', '==', branchName)
        );
        const sodDocs = await getDocs(sodQuery);
        if (sodDocs.empty) {
          // Fetch the most recent daily_sales for this branch to get nextDayFloat
          const lastEodQuery = query(
            getCol('daily_sales'),
            where('branch', '==', branchName),
            orderBy('createdAt', 'desc'),
            limit(1)
          );
          const lastEodDocs = await getDocs(lastEodQuery);
          let defaultFloat = '';
          if (!lastEodDocs.empty) {
            const lastEodData = lastEodDocs.docs[0].data();
            if (lastEodData.nextDayFloat !== undefined) {
              defaultFloat = String(lastEodData.nextDayFloat);
            } else if (lastEodData.floatCash !== undefined) {
              defaultFloat = String(lastEodData.floatCash);
            }
          }
          setSodData(prev => ({ ...prev, floatCash: defaultFloat }));
          if (!quickEodActiveRef.current) setShowSodModal(true);
        } else {
          // If already opened, set floatCash to the existing value to auto-fill EOD
          const data = sodDocs.docs[0].data();
          setEodData(prev => ({ ...prev, floatCash: String(data.floatCash || '') }));
        }
      } catch (err) {
        console.error("Error checking SOD:", err);
      } finally {
        setHasCheckedSod(true);
      }
    };
    checkSod();
  }, [globalBranch, hasCheckedSod]);

  const handleSodSubmit = async () => {
    if (!sodData.submittedBy || !sodData.floatCash) {
      showToast('กรุณาระบุข้อมูลให้ครบถ้วน', 'error');
      return;
    }
    setIsSubmittingSod(true);
    try {
      const todayStr = new Date().toLocaleDateString('th-TH');
      const branchName = globalBranch || "สำนักงานใหญ่";
      const sodRef = getCol('pos_sessions');
      await addDoc(sodRef, {
        date: todayStr,
        branch: branchName,
        floatCash: parseNumber(sodData.floatCash),
        openedBy: sodData.submittedBy,
        openedAt: new Date().toISOString()
      });
      // Auto-fill EOD data
      setEodData(prev => ({ ...prev, floatCash: String(sodData.floatCash) }));
      setShowSodModal(false);
      showToast('เปิดกะเรียบร้อยแล้ว');
    } catch (err) {
      console.error(err);
      showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
    } finally {
      setIsSubmittingSod(false);
    }
  };

  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [appliedVoucherId, setAppliedVoucherId] = useState(null);
  const [appliedVoucherCode, setAppliedVoucherCode] = useState(null);
  const [appliedVoucherData, setAppliedVoucherData] = useState(null);
  const [instantVoucherModal, setInstantVoucherModal] = useState(null);
  const [manualVoucherCode, setManualVoucherCode] = useState('');
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [customerSignature, setCustomerSignature] = useState(null);
  const [splitPayment, setSplitPayment] = useState({ cash: 0, transfer: 0, cod: 0, credit: 0, omise_promptpay: 0 });
  const [showOmiseQrModal, setShowOmiseQrModal] = useState(false);
  const [showTransferChoiceModal, setShowTransferChoiceModal] = useState(false);
  const [omiseChargeData, setOmiseChargeData] = useState(null);
  const [isPollingOmise, setIsPollingOmise] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentStaff, setPaymentStaff] = useState('');
  const [paymentPhotos, setPaymentPhotos] = useState({
    before: [],
    after: []
  });
  const [usedServices, setUsedServices] = useState([]);
  const [singleCourseTabModal, setSingleCourseTabModal] = useState('machine');
  const [modalServiceSearch, setModalServiceSearch] = useState('');
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [quickPriceModalItem, setQuickPriceModalItem] = useState(null);
  
  const [orderChannel, setOrderChannel] = useState('instore'); // 'instore' | 'chat' | 'web'
  const [shippingAddress, setShippingAddress] = useState('');
  // 📮 เลขพัสดุที่กรอกตอนชำระเงิน (ถ้าจัดส่งแล้ว) → บันทึกลงบิล + ลูกค้าติดตาม 17TRACK ได้ทันที
  const [posTrackingNo, setPosTrackingNo] = useState('');
  const [printMode, setPrintMode] = useState('receipt'); // 'receipt' | 'label'
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  
  // Web Orders Polling
  const [webOrders, setWebOrders] = useState([]);
  const [activeWcOrderId, setActiveWcOrderId] = useState('');
  const [isFetchingWebOrders, setIsFetchingWebOrders] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showCustomerScanner, setShowCustomerScanner] = useState(false);
  const [scannerTarget, setScannerTarget] = useState(null);
  const [courseQRModalData, setCourseQRModalData] = useState(null);
  const [showShippingAddress, setShowShippingAddress] = useState(false);

  // WooCommerce Stock Sync Status
  // [ { name: string, status: 'pending' | 'success' | 'failed', newStock: number } ]
  const [wooSyncStatus, setWooSyncStatus] = useState([]);

  // Stock Comparison Modal
  const [showStockCompare, setShowStockCompare] = useState(false);
  const [stockCompareData, setStockCompareData] = useState([]);
  
  // Signature Refs for usage
  const custSigRef = React.useRef(null);
  const staffSigRef = React.useRef(null);
  const fileInputRef = React.useRef(null);

  // Web Orders Fetching Logic
  const fetchWebOrdersManual = async () => {
    if (isFetchingWebOrders) return;
    try {
      setIsFetchingWebOrders(true);
      // Fetch Processing orders from WooCommerce
      const data = await fetchWithProxy('https://irisnatures.com/wp-json/wc/v3/orders?status=processing');
      if (!Array.isArray(data)) return;
      
      // Fetch recent POS orders to filter out already imported ones
      // We fetch last 100 orders to be safe
      const recentOrdersSnap = await getDocs(query(getCol('orders'), where("source", "==", "POS")));
      const importedIds = recentOrdersSnap.docs.map(d => d.data().wcOrderId).filter(Boolean);
      
      const newOrders = data.filter(o => !importedIds.includes(String(o.id)));
      setWebOrders(newOrders);
    } catch(e) {
      console.error('Failed to fetch web orders', e);
    } finally {
      setIsFetchingWebOrders(false);
    }
  };

  useEffect(() => {
    fetchWebOrdersManual();
    const interval = setInterval(fetchWebOrdersManual, 60000);
    return () => clearInterval(interval);
  }, []);

  // Set Preselected Customer
  useEffect(() => {
    if (posPreselectedCustomer) {
      setSelectedCustomer(posPreselectedCustomer);
      setActiveTab('my_courses');
      if (clearPosPreselectedCustomer) clearPosPreselectedCustomer();
    }
  }, [posPreselectedCustomer, clearPosPreselectedCustomer]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [transactionDate, setTransactionDate] = useState(getLocalYYYYMMDD());
  const [posFilterDate, setPosFilterDate] = useState(getLocalYYYYMMDD());

  const [autoPrint, setAutoPrint] = useState(() => {
    const saved = localStorage.getItem('posAutoPrint');
    // Default to TRUE if never set before
    return saved === null ? true : saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('posAutoPrint', autoPrint);
  }, [autoPrint]);

  useEffect(() => {
    if (showPreviewModal && autoPrint) {
      // Reduced from 500ms → 50ms: just enough for DOM to render
      const timer = setTimeout(() => {
        window.print();
        if (receiptData?.orderNo === 'DRAFT') setReceiptData(null);
        setShowPreviewModal(false);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [showPreviewModal, autoPrint, receiptData]);

  // Keyboard shortcut: Enter or 'p' while preview is open → print immediately
  useEffect(() => {
    if (!showPreviewModal) return;
    const handleKey = (e) => {
      if (e.key === 'Enter' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        window.print();
        if (receiptData?.orderNo === 'DRAFT') setReceiptData(null);
        setShowPreviewModal(false);
      }
      if (e.key === 'Escape') {
        if (receiptData?.orderNo === 'DRAFT') setReceiptData(null);
        setShowPreviewModal(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [showPreviewModal, receiptData]);

  const [showEodModal, setShowEodModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(null);
  const [showEodPreviewA4, setShowEodPreviewA4] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [eodTab, setEodTab] = useState('cash');
  const [eodData, setEodData] = useState({ actualCash: '', floatCash: '1000', imageBase64: '', submittedBy: '', clockOut: true });

  const latestFloat = useMemo(() => {
    const sorted = [...dailySales].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const branchRec = sorted.find(d => d.branch === (globalBranch || "สำนักงานใหญ่"));
    if (branchRec && branchRec.nextDayFloat !== undefined) {
      return branchRec.nextDayFloat.toString();
    }
    return '1000'; // Default fallback
  }, [dailySales, globalBranch]);

  useEffect(() => {
    setEodData(prev => ({ ...prev, floatCash: latestFloat }));
  }, [latestFloat]);
  const [isSubmittingEod, setIsSubmittingEod] = useState(false);

  // 🌟 ส่งยอดย้อนหลัง: จำวันที่ก่อนเปิด EOD เพื่อคืนค่าตอนปิด
  const eodPrevDateRef = useRef(null);
  useEffect(() => {
    if (showEodModal) {
      if (eodPrevDateRef.current === null) eodPrevDateRef.current = posFilterDate;
    } else if (eodPrevDateRef.current !== null) {
      setPosFilterDate(eodPrevDateRef.current);
      eodPrevDateRef.current = null;
    }
  }, [showEodModal]);

  const isEodBackdated = posFilterDate !== getLocalYYYYMMDD();

  const toThDateStr = (yyyymmdd) => {
    const dObj = new Date();
    const [y, m, d] = yyyymmdd.split('-');
    dObj.setFullYear(y, m - 1, d);
    return dObj.toLocaleDateString('th-TH');
  };

  // รายงานที่ส่งไปแล้วของวันที่เลือก (กันส่งซ้ำ)
  const existingEodForDate = useMemo(() => {
    if (!posFilterDate) return [];
    const target = toThDateStr(posFilterDate);
    return dailySales.filter(d => d.branch === (globalBranch || "สำนักงานใหญ่") && d.date === target);
  }, [dailySales, globalBranch, posFilterDate]);

  const handleEodDateChange = (newDate) => {
    if (!newDate || newDate > getLocalYYYYMMDD()) return;
    setPosFilterDate(newDate);
    // เงินทอนตั้งต้น = ยอดยกไปจากรายงานล่าสุดก่อนวันที่เลือก
    const prev = [...dailySales]
      .filter(d => d.branch === (globalBranch || "สำนักงานใหญ่") && typeof d.createdAt === 'string' && d.createdAt.slice(0, 10) < newDate)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    const isToday = newDate === getLocalYYYYMMDD();
    setEodData(p => ({
      ...p,
      floatCash: isToday ? latestFloat : (prev && prev.nextDayFloat !== undefined ? prev.nextDayFloat.toString() : '1000'),
      actualCash: '',
      manualTransfer: '',
      manualTransferNote: '',
      clockOut: isToday ? p.clockOut : false,
    }));
    setEodTab('cash');
  };

  // 🌟 ส่งยอดด่วน: เปิด EOD modal อัตโนมัติ + เลือกผู้ส่งยอดให้เลย
  useEffect(() => {
    if (!autoOpenEod) return;
    quickEodActiveRef.current = true;
    quickEodSubmittedRef.current = false;
    setEodData(prev => ({ ...prev, submittedBy: autoOpenEod.employeeId || prev.submittedBy, clockOut: true }));
    setShowEodModal(true);
  }, [autoOpenEod]);

  // 🌟 ส่งยอดด่วน: เมื่อปิดหน้าต่าง EOD (ส่งสำเร็จหรือยกเลิก) → แจ้ง parent
  const quickEodShownRef = useRef(false);
  useEffect(() => {
    if (!autoOpenEod || !quickEodActiveRef.current) return;
    if (showEodModal) { quickEodShownRef.current = true; return; }
    if (quickEodShownRef.current) {
      quickEodShownRef.current = false;
      quickEodActiveRef.current = false;
      onQuickEodFinished(quickEodSubmittedRef.current);
    }
  }, [showEodModal]);

  // Filtered Inventory
  const filteredProducts = useMemo(() => {
    const filtered = products.filter(p => {
      const name = String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2", "ชื่อ", "name"]) || '').trim();
      const status = String(getFuzzyKey(p, ["สถานะ", "status", "การใช้งาน", "state"]) || '').trim();
      if (!name) return false;
      if (status === 'ร่าง' || status === 'draft' || status === 'ปิดใช้งาน' || status === 'ปิด' || status === 'ไม่แสดง' || status === 'ซ่อน') return false;
      // ซ่อนสินค้า Store Use เฉพาะโหมดขายปกติ (ไม่ใช่โหมดเบิกสินค้าและไม่ใช่โหมดนับสต๊อก)
      if (p.isStoreUseOnly && !isStockMode && !isRequisitionMode) return false;
      const searchStr = `${String(getFuzzyKey(p, ["รหัส", "col_1"]) || '')} ${name}`.toLowerCase();
      return searchTerm === '' || searchStr.includes(searchTerm.toLowerCase());
    });

    return filtered.sort((a, b) => {
      const nameA = String(getFuzzyKey(a, ["ชื่อสินค้า", "col_2"]) || '');
      const nameB = String(getFuzzyKey(b, ["ชื่อสินค้า", "col_2"]) || '');
      return nameA.localeCompare(nameB, 'th');
    });
  }, [products, searchTerm, isStockMode, isRequisitionMode]);

  const filteredCourses = useMemo(() => {
    return masterCourses.filter(mc => {
      const name = String(getFuzzyKey(mc, ["ชื่อคอส", "col_4"]) || '').trim();
      const status = String(getFuzzyKey(mc, ["สถานะ", "status", "การใช้งาน", "state"]) || '').trim();
      if (!name) return false;
      if (status === 'ร่าง' || status === 'draft' || status === 'ปิดใช้งาน' || status === 'ปิด' || status === 'ไม่แสดง' || status === 'ซ่อน') return false;
      const qty = String(getFuzzyKey(mc, ["จำนวนครั้ง", "col_7"]) || '').trim();
      if (qty === '1') return false;
      if (getCourseCategory(mc) === 'old_courses') return false;
      const searchStr = `${String(getFuzzyKey(mc, ["รหัสคอส", "col_1"]) || '')} ${name}`.toLowerCase();
      return searchTerm === '' || searchStr.includes(searchTerm.toLowerCase());
    });
  }, [masterCourses, searchTerm]);

  const filteredSingleCourses = useMemo(() => {
    return masterCourses.filter(mc => {
      const name = String(getFuzzyKey(mc, ["ชื่อคอส", "col_4"]) || '').trim();
      const status = String(getFuzzyKey(mc, ["สถานะ", "status", "การใช้งาน", "state"]) || '').trim();
      if (!name) return false;
      if (status === 'ร่าง' || status === 'draft' || status === 'ปิดใช้งาน' || status === 'ปิด' || status === 'ไม่แสดง' || status === 'ซ่อน') return false;
      const qty = String(getFuzzyKey(mc, ["จำนวนครั้ง", "col_7"]) || '').trim();
      if (qty !== '1') return false;
      if (getCourseCategory(mc) === 'old_courses') return false;
      const searchStr = `${String(getFuzzyKey(mc, ["รหัสคอส", "col_1"]) || '')} ${name}`.toLowerCase();
      return searchTerm === '' || searchStr.includes(searchTerm.toLowerCase());
    });
  }, [masterCourses, searchTerm]);

  const groupedSingleCourses = useMemo(() => {
    const groups = {};
    filteredSingleCourses.forEach(c => {
      const rawName = String(getFuzzyKey(c, ["ชื่อคอส", "col_4", "ชื่อสินค้า", "col_2"]) || '').trim();
      let baseName = rawName.replace(/\(ซื้อเพิ่มโปร\)/g, '').replace(/1\s*ครั้ง/g, '').trim();
      if (!baseName) baseName = rawName; // fallback
      
      const code = String(getFuzzyKey(c, ["รหัสคอส", "col_1"]));
      const category = getCourseCategory(c);
      const groupKey = `${category}_${baseName}`;
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          baseName,
          category,
          items: [],
          primaryCode: code
        };
      }
      groups[groupKey].items.push(c);
    });
    
    // Sort items inside each group: normal price first, then promo
    Object.values(groups).forEach(g => {
       g.items.sort((a, b) => {
          const nameA = String(getFuzzyKey(a, ["ชื่อคอส", "col_4", "ชื่อสินค้า", "col_2"]) || '');
          const nameB = String(getFuzzyKey(b, ["ชื่อคอส", "col_4", "ชื่อสินค้า", "col_2"]) || '');
          if (nameA.includes('ซื้อเพิ่มโปร') && !nameB.includes('ซื้อเพิ่มโปร')) return 1;
          if (!nameA.includes('ซื้อเพิ่มโปร') && nameB.includes('ซื้อเพิ่มโปร')) return -1;
          return 0;
       });
    });
    
    return Object.values(groups);
  }, [filteredSingleCourses]);

  const filteredMyCourses = useMemo(() => {
    if (!selectedCustomer) return [];
    const phone = String(getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3"]) || '').trim();
    if (!phone) return [];
    return courses.filter(c => {
      const cPhone = String(getFuzzyKey(c, ["เบอร์โทร", "col_1"]) || '').trim();
      if (cPhone !== phone) return false;
      if (!c.computedRemainQty || c.computedRemainQty <= 0) return false;
      
      const courseName = String(getFuzzyKey(c, ["ชื่อคอส", "ชื่อคอร์ส", "col_8"]) || '').toLowerCase();
      const isCreditCourse = courseName.includes('วงเงิน') || courseName.includes('เติมเงิน') || courseName.includes('เครดิต') || courseName.includes('voucher') || courseName.includes('บัตรกำนัล') || courseName.includes('ฝากเงิน');
      if (isCreditCourse) return false;
      
      const searchStr = `${String(getFuzzyKey(c, ["เลขที่ใบคอส", "col_2"]) || '')} ${String(getFuzzyKey(c, ["ชื่อคอส", "col_8"]) || '')}`.toLowerCase();
      return searchTerm === '' || searchStr.includes(searchTerm.toLowerCase());
    });
  }, [courses, selectedCustomer, searchTerm]);

  const filteredPendingPayments = useMemo(() => {
    if (!selectedCustomer) return [];
    const phone = String(getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3"]) || '').trim();
    const name = String(getFuzzyKey(selectedCustomer, ["ชื่อ", "col_1"]) || '').trim().toLowerCase();
    
    return courses.filter(c => {
      const cPhone = String(getFuzzyKey(c, ["เบอร์โทร", "col_1"]) || '').trim();
      const cName = String(getFuzzyKey(c, ["ผู้ซื้อคอส", "ชื่อลูกค้า", "col_9", "col_2"]) || '').trim().toLowerCase();
      
      const phoneMatch = phone && cPhone && cPhone === phone;
      const nameMatch = name && cName && cName === name;
      
      if (!phoneMatch && !nameMatch) return false;
      
      const pendingAmt = c.computedPendingAmount || 0;
      if (pendingAmt <= 0) return false;
      return true;
    });
  }, [courses, selectedCustomer]);

  // Auto-add pending payments to cart when customer is selected
  const autoAddedDebtCustomerRef = useRef(null);

  useEffect(() => {
    if (selectedCustomer) {
      if (filteredPendingPayments.length > 0 && autoAddedDebtCustomerRef.current !== selectedCustomer.id) {
        setCart(prev => {
          let newCart = [...prev];
          let addedCount = 0;
          filteredPendingPayments.forEach(c => {
             const debtId = `debt_${c.id}`;
             if (!newCart.some(item => item.id === debtId)) {
                const pendingAmt = c.computedPendingAmount || 0;
                newCart.push({ 
                  id: debtId, 
                  name: `ชำระค้าง: ${String(getFuzzyKey(c, ["เลขที่ใบคอส", "col_2"]))}`, 
                  price: pendingAmt, 
                  qty: 1, 
                  type: 'debt_payment', 
                  maxQty: 1, 
                  originalItem: c, 
                  isManualPrice: true 
                });
                addedCount++;
             }
          });
          if (addedCount > 0) {
             setTimeout(() => showToast(`นำรายการค้างชำระลงตะกร้าอัตโนมัติแล้ว`, 'info'), 300);
          }
          return newCart;
        });
        autoAddedDebtCustomerRef.current = selectedCustomer.id;
      } else if (filteredPendingPayments.length === 0) {
        autoAddedDebtCustomerRef.current = selectedCustomer.id;
      }
    } else {
      autoAddedDebtCustomerRef.current = null;
    }
  }, [selectedCustomer, filteredPendingPayments]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers.slice(0, 10);
    return customers.filter(c => {
      const searchStr = `${String(getFuzzyKey(c, ["ชื่อ", "col_1"]) || '')} ${String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '')}`.toLowerCase();
      return searchStr.includes(customerSearch.toLowerCase());
    }).slice(0, 10);
  }, [customers, customerSearch]);

  const getCustomerAccumulatedAmount = (c) => {
    if (!c) return 0;
    const cName = String(getFuzzyKey(c, ["ชื่อ", "col_1"]) || '').trim();
    const cPhone = String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '').trim();
    
    let historyEarned = 0;
    let historySpent = 0;
    
    histories.forEach(h => {
        if (h.isCancelled || String(getFuzzyKey(h, ["สถานะ", "col_7", "col_8", "col_9"]) || '') === 'ยกเลิก') return;
        const hName = String(getFuzzyKey(h, ["ชื่อลูกค้า", "col_2"]) || '').trim();
        const hPhoneNum = String(getFuzzyKey(h, ["เบอร์โทร", "col_3"]) || '').trim();
        if ((cName && hName === cName) || (cPhone && hPhoneNum === cPhone)) {
            const type = String(getFuzzyKey(h, ["ประเภท", "col_4"]) || '');
            const amt = parseNumber(getFuzzyKey(h, ["ยอดเงิน", "ยอดจัดซื้อ", "ยอดสินค้า", "ยอด", "col_19"]));
            if (amt > 0) {
                if (type.includes('เบิก') || type.includes('จ่าย') || type.includes('หัก')) {
                    historySpent += amt;
                } else {
                    historyEarned += amt;
                }
            }
        }
    });

    const oldAmount = parseNumber(getFuzzyKey(c, ["ยอดสะสม", "col_13"]));
    return oldAmount + historyEarned - historySpent;
  };

  const checkCustomerVipStatus = (c) => getCustomerAccumulatedAmount(c) >= 5000;

  const vipStats = useMemo(() => {
    if (!selectedCustomer) return { isVip: false, amount: 0 };
    // Use the computed amount from App.jsx if available to ensure consistency
    const amt = selectedCustomer.realAccumulatedAmount !== undefined 
                ? selectedCustomer.realAccumulatedAmount 
                : getCustomerAccumulatedAmount(selectedCustomer);
    return { isVip: amt >= 5000, amount: amt };
  }, [selectedCustomer, histories]);

  const isVipCustomer = orderChannel === 'shopee' || vipStats.isVip || (selectedCustomer && selectedCustomer.isApproved === true);

  const customerCreditBalance = useMemo(() => {
    if (!selectedCustomer) return 0;
    const phone = String(getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3"]) || '').trim();
    if (!phone) return 0;
    // Find all courses belonging to this customer
    const myCourses = courses.filter(c => String(getFuzzyKey(c, ["เบอร์โทร", "col_1"]) || '').trim() === phone);
    // Sum the computedRemainCredit
    return myCourses.reduce((sum, c) => sum + (c.computedRemainCredit || 0), 0);
  }, [selectedCustomer, courses]);

  const customerPendingBalance = useMemo(() => {
    return filteredPendingPayments.reduce((sum, c) => sum + (c.computedPendingAmount || 0), 0);
  }, [filteredPendingPayments]);

  const todaySales = useMemo(() => {
    const posFilterDateObj = new Date();
    if (posFilterDate) {
      const [y, m, d] = posFilterDate.split('-');
      posFilterDateObj.setFullYear(y, m - 1, d);
    }
    const today = posFilterDateObj.toLocaleDateString('th-TH');
    return histories.reduce((sum, h) => {
      const hDate = String(getFuzzyKey(h, ["วันที่", "col_1"]) || '');
      const hBranch = String(getFuzzyKey(h, ["สาขา", "col_21"]) || '');
      const status = String(getFuzzyKey(h, ["สถานะ", "col_7", "col_8", "col_9"]) || '');
      const type = String(getFuzzyKey(h, ["ประเภท", "col_4"]) || '');
      
      if (hDate === today && !h.isCancelled && status !== 'ยกเลิก' && (!globalBranch || hBranch === globalBranch)) {
        const amt = parseNumber(getFuzzyKey(h, ["ยอดเงิน", "ยอดจัดซื้อ", "ยอดสินค้า", "ยอด", "col_19"]));
        if ((type.includes('ซื้อสินค้า') || type.includes('ซื้อคอร์ส')) && !type.includes('PO')) {
            return sum + amt;
        }
      }
      return sum;
    }, 0);
  }, [histories, globalBranch, posFilterDate]);

  const todaySalesBreakdown = useMemo(() => {
    const posFilterDateObj = new Date();
    if (posFilterDate) {
      const [y, m, d] = posFilterDate.split('-');
      posFilterDateObj.setFullYear(y, m - 1, d);
    }
    const today = posFilterDateObj.toLocaleDateString('th-TH');
    let cash = 0;
    let transfer = 0;
    let cod = 0;
    let credit = 0;
    let online = 0;
    let productSalesAmt = 0;
    let courseSalesAmt = 0;
    let manualSalesAmt = 0;
    const transferDetails = [];
    const pendingDetails = [];
    const allSalesDetails = [];

    orders.forEach(o => {
      const isOldPO = (o.courseName || '').includes('[ซื้อเข้า') || (o.courseName || '').includes('[เบิกจาก');
      if (o.transactionType === 'owner_purchase' || o.transactionType === 'branch_requisition' || isOldPO || o.status === 'ยกเลิก') return;
      const oDate = new Date(o.createdAt).toLocaleDateString('th-TH');
      const oBranch = String(o.branch || '');
      
      if (oDate === today && (!globalBranch || oBranch === globalBranch)) {
         const paymentStr = String(o.paymentMethod || '');
         let tAmt = 0;
         let tItems = [];
         if (o.courseName) {
            tItems = [{name: o.courseName, qty: 1}];
         } else if (o.cartItems && Array.isArray(o.cartItems)) {
            tItems = o.cartItems.map(c => ({ name: c.name, qty: c.qty || 1 }));
         }
         
         if (paymentStr.includes('เงินสด:')) {
            const match = paymentStr.match(/เงินสด:\s*([\d.]+)/);
            if (match) cash += parseFloat(match[1]);
         }
         if (paymentStr.includes('โอนเงิน:')) {
            const match = paymentStr.match(/โอนเงิน:\s*([\d.]+)/);
            if (match) {
              tAmt = parseFloat(match[1]);
              transfer += tAmt;
            }
         }
         let currentCod = 0;
         if (paymentStr.includes('ค้าง\/COD:')) {
            const match = paymentStr.match(/ค้าง\/COD:\s*([\d.]+)/);
            if (match) currentCod += parseFloat(match[1]);
         }
         if (paymentStr === 'เงินสด') cash += parseNumber(o.price);
         if (paymentStr === 'โอนเงิน') {
            tAmt = parseNumber(o.price);
            transfer += tAmt;
         }
         if (paymentStr === 'ค้าง/COD') {
            currentCod += parseNumber(o.price);
         }
         
         if (currentCod > 0) {
             cod += currentCod;
             if (o.orderChannel === 'shopee') {
                 online += currentCod;
             }
             pendingDetails.push({
                 id: o.id || Math.random().toString(),
                 time: new Date(o.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
                 amount: currentCod,
                 customer: o.customerName || getFuzzyKey(o, ["ชื่อลูกค้า", "ลูกค้า", "customer"]) || 'ลูกค้าทั่วไป',
                 items: tItems.length > 0 ? tItems.map(i => `${i.name} x${i.qty || 1}`).join(', ') : 'สินค้า/บริการ',
                 channel: o.orderChannel === 'shopee' ? 'Shopee' : 'COD'
             });
         }
         
         if (tAmt > 0) {
           transferDetails.push({
             id: o.id || Math.random().toString(),
             time: new Date(o.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
             amount: tAmt,
             customer: o.customerName || getFuzzyKey(o, ["ชื่อลูกค้า", "ลูกค้า", "customer"]) || 'ลูกค้าทั่วไป',
             items: tItems.length > 0 ? tItems.map(i => `${i.name} x${i.qty || 1}`).join(', ') : 'สินค้า/บริการ'
           });
         }
         
         let orderTotal = parseNumber(o.price);
         if (o.orderChannel === 'shopee' && o.shopeeNetReceived !== undefined) {
             orderTotal = parseNumber(o.shopeeNetReceived);
         }
         let pSum = 0;
         let cSum = 0;
         let mSum = 0;
         if (o.cartItems && Array.isArray(o.cartItems) && o.cartItems.length > 0) {
             let rawPSum = 0;
             let rawMSum = 0;
             let totalRaw = 0;
             o.cartItems.forEach(item => {
                 const lineTotal = parseNumber(item.price) * parseNumber(item.qty);
                 totalRaw += lineTotal;
                 if (item.type === 'service') rawMSum += lineTotal;
                 else if (item.type !== 'course' && item.type !== 'debt_payment' && item.type !== 'usage') rawPSum += lineTotal;
             });
             if (totalRaw > 0) {
                 pSum = orderTotal * (rawPSum / totalRaw);
                 mSum = orderTotal * (rawMSum / totalRaw);
             } else if (rawPSum > 0) {
                 pSum = orderTotal;
             }
             cSum = orderTotal - pSum;
         } else if (o.courseName) {
             cSum = orderTotal;
         } else {
             pSum = orderTotal;
         }
         productSalesAmt += pSum;
         courseSalesAmt += cSum;
         manualSalesAmt += mSum;
         
         allSalesDetails.push({
             id: o.id || Math.random().toString(),
             orderNo: o.orderNo || '-',
             time: new Date(o.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
             customer: o.customerName || getFuzzyKey(o, ["ชื่อลูกค้า", "ลูกค้า", "customer"]) || 'ลูกค้าทั่วไป',
             details: tItems.length > 0 ? tItems : [{ name: 'สินค้า/บริการ', qty: 1 }],
             amount: parseNumber(o.price),
             paymentStr: paymentStr
         });
      }
    });

    histories.forEach(h => {
      const hDate = String(getFuzzyKey(h, ["วันที่", "col_1"]) || '').trim();
      const hBranch = String(h["สาขา"] || "สำนักงานใหญ่");
      if (hDate === today && (!globalBranch || hBranch === globalBranch)) {
         const type = String(getFuzzyKey(h, ["ประเภท", "col_4"]) || '');
         if (type === "เบิกสินค้า" || type === "เบิกใช้เครดิต") {
            const amt = parseNumber(getFuzzyKey(h, ["ยอดเบิก", "ยอดเงิน", "ยอดจัดซื้อ", "ยอด", "col_19"]));
            credit += amt;
         }
         if (type.includes("ใช้คอร์ส") || type.includes("หักคอร์ส") || type.includes("ตัดคอร์ส")) {
             allSalesDetails.push({
                 id: h.id || Math.random().toString(),
                 orderNo: h.orderNo || '-',
                 time: h.createdAt ? new Date(h.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-',
                 customer: getFuzzyKey(h, ["ชื่อลูกค้า", "ลูกค้า", "col_3"]) || '-',
                 details: [{ name: `ใช้คอร์ส: ${getFuzzyKey(h, ["รายการ", "คอร์ส", "col_8"]) || type}`, qty: 1 }],
                 amount: 0,
                 paymentStr: 'ตัดคอร์ส'
             });
         }
      }
    });

    // Sort allSalesDetails by time
    allSalesDetails.sort((a, b) => a.time.localeCompare(b.time));

    return { cash, transfer, cod, credit, transferDetails, pendingDetails, allSalesDetails, productSalesAmt, courseSalesAmt, manualSalesAmt, online };
  }, [orders, histories, globalBranch, posFilterDate]);

  // 🌟 เจ้าของร้านส่งยอดได้แม้ไม่มีรายการขาย (เช่น ร้านปิด / ส่งย้อนหลัง)
  const isEodNoSales = !((todaySalesBreakdown?.cash || 0) + (todaySalesBreakdown?.transfer || 0) + (todaySalesBreakdown?.credit || 0) + (todaySalesBreakdown?.cod || 0));
  const isOwnerZeroEod = globalRole === 'owner' && isEodNoSales;

  // 🌟 เจ้าของร้านกรอกยอดโอนเพิ่มเองได้ (รวมกับยอดโอนจากระบบ)
  const manualTransferNum = globalRole === 'owner' ? (parseNumber(eodData.manualTransfer) || 0) : 0;
  const eodBreakdown = useMemo(() => {
    if (!manualTransferNum) return todaySalesBreakdown;
    return {
      ...todaySalesBreakdown,
      transfer: (todaySalesBreakdown.transfer || 0) + manualTransferNum,
      transferDetails: [
        ...(todaySalesBreakdown.transferDetails || []),
        { time: '-', customer: 'เจ้าของร้านกรอกเอง', amount: manualTransferNum, items: eodData.manualTransferNote || 'ยอดโอนที่กรอกเพิ่ม', isManual: true },
      ],
    };
  }, [todaySalesBreakdown, manualTransferNum, eodData.manualTransferNote]);

  const currentMonthSales = useMemo(() => {
    const posFilterDateObj = new Date();
    if (posFilterDate) {
      const [y, m, d] = posFilterDate.split('-');
      posFilterDateObj.setFullYear(y, m - 1, d);
    }
    const currentMonth = posFilterDateObj.getMonth();
    const currentYear = posFilterDateObj.getFullYear();
    
    return orders.reduce((sum, o) => {
      const isOldPO = (o.courseName || '').includes('[ซื้อเข้า') || (o.courseName || '').includes('[เบิกจาก');
      if (o.transactionType === 'owner_purchase' || o.transactionType === 'branch_requisition' || isOldPO || o.status === 'ยกเลิก') return sum;
      if (!o.createdAt) return sum;
      const oDate = new Date(o.createdAt);
      if (oDate.getMonth() === currentMonth && oDate.getFullYear() === currentYear) {
         if (!globalBranch || o.branch === globalBranch) {
            return sum + parseNumber(o.price);
         }
      }
      return sum;
    }, 0);
  }, [orders, globalBranch, posFilterDate]);

  useEffect(() => {
    setCart(prev => prev.map(item => {
      if (item.type === 'product' && !item.isManualPrice) {
        return { ...item, price: computeFinalPrice(item.originalItem, isVipCustomer) };
      }
      return item;
    }));
  }, [isVipCustomer]);

  const handleEditMasterCoursePrice = (e, courseItem) => {
    e.stopPropagation();
    e.preventDefault();
    const oldPrice = parseNumber(getFuzzyKey(courseItem, ["ราคา", "ราคาขาย", "col_5"]));
    setEditingCoursePrice({ ...courseItem, newPriceStr: String(oldPrice) });
  };

  const submitEditMasterCoursePrice = async () => {
    if (!editingCoursePrice) return;
    
    const newPriceStr = editingCoursePrice.newPriceStr;
    if (newPriceStr !== null && newPriceStr.trim() !== '') {
       const newPrice = Number(newPriceStr);
       if (!isNaN(newPrice) && newPrice >= 0) {
           try {
              const updateData = {};
              if (editingCoursePrice["ราคา"] !== undefined) updateData["ราคา"] = String(newPrice);
              if (editingCoursePrice["ราคาขาย"] !== undefined) updateData["ราคาขาย"] = String(newPrice);
              if (editingCoursePrice["ราคาขายเต็ม"] !== undefined) updateData["ราคาขายเต็ม"] = String(newPrice);
              if (editingCoursePrice["col_5"] !== undefined) updateData["col_5"] = String(newPrice);
              if (editingCoursePrice["col_6"] !== undefined) updateData["col_6"] = String(newPrice);
              
              if (Object.keys(updateData).length === 0) updateData["ราคา"] = String(newPrice);
              
              const collectionName = editingCoursePrice.isPOSCourse ? 'products' : 'master_courses';
              
              await updateDoc(doc(db, collectionName, editingCoursePrice.id), updateData);
              showToast('อัปเดตราคาสำเร็จ (อาจต้องรอสักครู่เพื่อรีเฟรชข้อมูล)', 'success');
              setEditingCoursePrice(null);
           } catch (err) {
              showToast('ข้อผิดพลาด: ' + err.message, 'error');
           }
       } else {
           showToast('กรุณาระบุตัวเลขที่ถูกต้อง', 'error');
       }
    } else {
       showToast('กรุณาระบุราคา', 'error');
    }
  };

  const addToCart = (item, type, actionType = null) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id && i.type === type);
      if (existing) {
        if ((type === 'product' || type === 'claim_item') && existing.qty >= existing.maxQty) {
          showToast(type === 'claim_item' ? 'เบิกครบโควต้าแล้ว' : 'จำนวนสินค้าไม่เพียงพอ');
          return prev;
        }
        return prev.map(i => i.id === item.id && i.type === type ? { ...i, qty: i.qty + 1 } : i);
      } else {
        if (type === 'product') {
          let maxQty = parseQty(getBranchStock(item, globalBranch || 'สำนักงานใหญ่'));
          let price = computeFinalPrice(item, isVipCustomer);
          let nameStr = String(getFuzzyKey(item, ["ชื่อสินค้า", "col_2"]));
          const fullPrice = parseNumber(getFuzzyKey(item, ["ราคาขายเต็ม", "col_6"]));

          if (actionType === 'owner_purchase') {
             price = computeOwnerCostPrice(item);
             maxQty = 9999;
             nameStr = `[ซื้อเข้า-เฉวง] ${nameStr}`;
          } else if (actionType === 'branch_requisition') {
             price = computeOwnerCostPrice(item);
             // Branch requisitions from Chaweng, allow even if stock is 0
             maxQty = 9999;
             nameStr = `[เบิกจากเฉวง] ${nameStr}`;
          } else {
             // อนุญาตให้ขายได้แม้สต๊อกเป็น 0
             maxQty = 9999;
          }
          
          return [...prev, { id: item.id, name: nameStr, price, originalPrice: fullPrice, qty: 1, type, actionType, maxQty, originalItem: item, isManualPrice: false }];
        } else if (type === 'course') {
          const price = parseNumber(getFuzzyKey(item, ["ราคา", "ราคาขาย", "col_5"]));
          return [...prev, { id: item.id, name: String(getFuzzyKey(item, ["ชื่อคอส", "col_4"])), price, qty: 1, type, maxQty: 999, originalItem: item }];
        } else if (type === 'single_course') {
          const price = parseNumber(getFuzzyKey(item, ["ราคา", "ราคาขาย", "col_5"]));
          return [...prev, { id: item.id, name: String(getFuzzyKey(item, ["ชื่อคอส", "col_4"])), price, qty: 1, type, maxQty: 999, originalItem: item }];
        } else if (type === 'debt_payment') {
          const pendingAmt = item.computedPendingAmount || 0;
          return [...prev, { id: `debt_${item.id}`, name: `ชำระค้าง: ${String(getFuzzyKey(item, ["เลขที่ใบคอส", "col_2"]))}`, price: pendingAmt, qty: 1, type, maxQty: 1, originalItem: item, isManualPrice: true }];
      } else if (type === 'service') {
          return [...prev, { id: item.id, name: item.name, price: item.price || 0, qty: 1, type, maxQty: 99, originalItem: item, isManualPrice: true }];
        } else if (type === 'usage') {
          const maxQty = item.computedRemainQty || 1;
          const nameStr = `เบิกใช้: ${String(getFuzzyKey(item, ["ชื่อคอส", "col_8"]))} (${String(getFuzzyKey(item, ["เลขที่ใบคอส", "col_2"]))})`;
          return [...prev, { id: item.id, name: nameStr, price: 0, qty: 1, type, maxQty, originalItem: item }];
        }
        return prev;
      }
    });
  };

  const updateCartQty = (id, type, delta) => {
    setCart(prev => {
      return prev.map(i => {
        if (i.id === id && i.type === type) {
          const newQty = i.qty + delta;
          if (newQty < 1) return i;
          if ((type === 'product' || type === 'usage') && newQty > i.maxQty) {
            showToast(type === 'usage' ? 'จำนวนครั้งคอร์สไม่เพียงพอ' : 'จำนวนสินค้าเกินสต็อก');
            return i;
          }
          return { ...i, qty: newQty };
        }
        return i;
      });
    });
  };

  const updateCartPrice = (id, type, newPrice) => {
    setCart(prev => prev.map(i => {
       if (i.id === id && i.type === type) {
          let np = parseNumber(newPrice);
          if (i.type === 'debt_payment' && i.originalItem) {
             const maxPending = i.originalItem.computedPendingAmount || 0;
             if (np > maxPending) np = maxPending;
          }
          return { ...i, price: np, isManualPrice: true };
       }
       return i;
    }));
  };

  const removeFromCart = (id, type) => {
    setCart(prev => prev.filter(i => !(i.id === id && i.type === type)));
  };

  const handleSearchEnter = (e) => {
    if (e.key === 'Enter' && searchTerm.trim() !== '') {
      const code = searchTerm.trim();
      const product = products.find(p => String(getFuzzyKey(p, ["บาร์โค้ด", "barcode", "รหัส", "col_1"])) === code);
      if (product) {
         e.preventDefault();
         addToCart(product, 'product');
         showToast(`สแกนและเพิ่ม ${getFuzzyKey(product, ["ชื่อสินค้า", "col_2"])} ลงตะกร้าแล้ว!`, 'success');
         setSearchTerm('');
      }
    }
  };

  // Global Barcode Scanner Listener
  useEffect(() => {
    let barcodeBuffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e) => {
      // Ignore if typing in an input, textarea or select
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      
      const currentTime = Date.now();
      
      // If time between keystrokes is too long (> 100ms), it's likely a human typing. Reset buffer.
      if (currentTime - lastKeyTime > 100) {
        barcodeBuffer = '';
      }
      
      if (e.key === 'Enter') {
        if (barcodeBuffer.length >= 3) {
           const code = barcodeBuffer;
           barcodeBuffer = ''; // reset
           
           // Try parsing as JSON (Voucher QR code)
           try {
               const parsed = JSON.parse(code);
               if (parsed && parsed.type === 'voucher' && parsed.code) {
                   handleVoucherScan(parsed.code, parsed.phone);
                   return;
               }
           } catch (err) {
               // Not JSON, continue with normal flow
           }
           
           // Check if it's a phone number (10 digits starting with 0)
           if (/^0\d{9}$/.test(code)) {
               const customer = customers.find(c => {
                  const phone = String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '').replace(/[^0-9]/g, '');
                  return phone === code;
               });
               if (customer) {
                   setSelectedCustomer(customer);
                   showToast(`สแกนพบลูกค้าและเลือกอัตโนมัติ: ${getFuzzyKey(customer, ["ชื่อ", "col_1"])}`, 'success');
                   return;
               }
           }

           // Check if it's a booking ID or Ref
           const booking = bookings.find(b => b.id === code || String(b.ticketNo || '') === code || String(b.bookingRef || '') === code);
           if (booking && booking.customerPhone) {
               const customer = customers.find(c => {
                   const phone = String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '').replace(/[^0-9]/g, '');
                   return phone === String(booking.customerPhone).replace(/[^0-9]/g, '');
               });
               if (customer) {
                   setSelectedCustomer(customer);
                   showToast(`สแกนพบหมายเลขจองและเลือกลูกค้า: ${getFuzzyKey(customer, ["ชื่อ", "col_1"])}`, 'success');
                   return;
               }
           }

           // Check if it's a course invoice number
           const course = courses.find(c => String(getFuzzyKey(c, ["เลขที่ใบคอส", "col_2"])) === code);
           if (course) {
               const coursePhone = String(getFuzzyKey(course, ["เบอร์โทร", "col_1"]) || '').replace(/[^0-9]/g, '');
               if (coursePhone) {
                   const customer = customers.find(c => {
                       const phone = String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '').replace(/[^0-9]/g, '');
                       return phone === coursePhone;
                   });
                   if (customer) {
                       setSelectedCustomer(customer);
                       showToast(`สแกนพบใบคอร์สและเลือกลูกค้า: ${getFuzzyKey(customer, ["ชื่อ", "col_1"])}`, 'success');
                       return;
                   }
               }
           }

           // Search for product by barcode
           const product = products.find(p => String(getFuzzyKey(p, ["บาร์โค้ด", "barcode", "รหัส", "col_1"])) === code);
           if (product) {
               addToCart(product, 'product');
               showToast(`สแกนและเพิ่ม ${getFuzzyKey(product, ["ชื่อสินค้า", "col_2"])} ลงตะกร้าแล้ว!`, 'success');
           } else {
               showToast(`ไม่พบรหัสสินค้าหรือเบอร์ลูกค้า: ${code}`, 'error');
           }
        }
        return;
      }

      // Add alphanumeric characters and JSON chars to buffer
      if (e.key.length === 1 && /^[a-zA-Z0-9\-\_\{\}\":\,]$/.test(e.key)) {
        barcodeBuffer += e.key;
      }
      
      lastKeyTime = currentTime;
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, customers, bookings, courses]);

  // Auto Check-in logic when a customer is selected
  useEffect(() => {
    if (!selectedCustomer) return;
    
    // Don't auto prompt if we already prompted or it's a draft order
    const cleanPhone = String(getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3"]) || '').replace(/[^0-9]/g, '');
    if (!cleanPhone) return;

    const todayStr = getLocalYYYYMMDD();
    const activeBooking = bookings.find(b => {
       const bPhone = String(b.customerPhone || '').replace(/[^0-9]/g, '');
       const isToday = b.date === todayStr;
       const isPending = b.status === 'รอการยืนยัน' || b.status === 'รอคิว' || b.status === 'กำลังรอ';
       return isToday && isPending && bPhone === cleanPhone && String(b.branch || "สำนักงานใหญ่") === String(globalBranch || "สำนักงานใหญ่");
    });

    if (activeBooking) {
       setPendingCheckInBooking(activeBooking);
    }
  }, [selectedCustomer, bookings, globalBranch]);

  // Calculations
  const originalSubtotal = cart.reduce((sum, item) => sum + ((item.originalPrice || item.price) * item.qty), 0);
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const promoResult = useMemo(() => {
    if (!selectedPromotion) return { discount: 0, reason: null, nextTimeDiscount: null, freeItems: null };
    const activePromo = promotions.find(p => p.id === selectedPromotion);
    if (!activePromo) return { discount: 0, reason: null, nextTimeDiscount: null, freeItems: null };
    
    // 1. Happy Hour Check
    if (activePromo.hasHappyHour && activePromo.happyHourStart && activePromo.happyHourEnd) {
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      
      const [startH, startM] = activePromo.happyHourStart.split(':').map(Number);
      const startMins = startH * 60 + startM;
      
      const [endH, endM] = activePromo.happyHourEnd.split(':').map(Number);
      const endMins = endH * 60 + endM;
      
      if (currentMins < startMins || currentMins > endMins) {
        return { discount: 0, reason: `นอกเวลาโปรโมชั่น (${activePromo.happyHourStart} - ${activePromo.happyHourEnd})`, nextTimeDiscount: null, freeItems: null };
      }
    }
    
    // 2. Applicable items & Total check
    let applicableTotal = 0;
    let applicableItemsInCart = [];
    
    if (activePromo.scope === 'cart_total') {
      applicableTotal = subtotal;
      applicableItemsInCart = cart;
    } else if (activePromo.scope === 'specific_items') {
      const applicableIds = activePromo.applicableItemIds || [];
      cart.forEach(item => {
        if (applicableIds.includes(item.id) || applicableIds.includes(item.originalItem?.id)) {
          applicableTotal += (item.price * item.qty);
          applicableItemsInCart.push(item);
        }
      });
      if (applicableTotal === 0 && activePromo.type !== 'discount_next_time') {
        return { discount: 0, reason: 'ไม่มีสินค้าที่ร่วมรายการในตะกร้า', nextTimeDiscount: null, freeItems: null };
      }
    }

    const minAmt = Number(activePromo.minPurchaseAmount) || 0;
    if (minAmt > 0 && applicableTotal < minAmt) {
      return { discount: 0, reason: `ต้องมียอดขั้นต่ำ ${minAmt} บาท (ขาดอีก ${minAmt - applicableTotal} บาท)`, nextTimeDiscount: null, freeItems: null };
    }

    const val = Number(activePromo.value) || 0;

    // 3. Process by Type
    if (activePromo.type === 'discount_percent') {
      if (val <= 0) return { discount: 0, reason: 'มูลค่าส่วนลดเป็น 0', nextTimeDiscount: null, freeItems: null };
      return { discount: applicableTotal * (val / 100), reason: null, nextTimeDiscount: null, freeItems: null };
      
    } else if (activePromo.type === 'discount_amount') {
      if (val <= 0) return { discount: 0, reason: 'มูลค่าส่วนลดเป็น 0', nextTimeDiscount: null, freeItems: null };
      return { discount: Math.min(val, applicableTotal), reason: null, nextTimeDiscount: null, freeItems: null };
      
    } else if (activePromo.type === 'buy_x_get_y') {
      const buyQty = val || 1;
      const getQty = Number(activePromo.getQty) || 1;
      
      // Calculate total quantity of applicable items
      const totalApplicableQty = applicableItemsInCart.reduce((sum, item) => sum + item.qty, 0);
      if (totalApplicableQty < buyQty) {
        return { discount: 0, reason: `ซื้อไม่ครบ ${buyQty} ชิ้นตามเงื่อนไข (มี ${totalApplicableQty} ชิ้น)`, nextTimeDiscount: null, freeItems: null };
      }
      
      // Calculate sets
      const sets = Math.floor(totalApplicableQty / buyQty);
      const freeQtyToGive = sets * getQty;
      
      // Sort applicable items by price ASCENDING (give cheapest for free)
      let itemsToDiscount = [];
      applicableItemsInCart.forEach(item => {
        for(let i=0; i<item.qty; i++) {
          itemsToDiscount.push(item.price);
        }
      });
      itemsToDiscount.sort((a,b) => a - b);
      
      let discountValue = 0;
      for(let i=0; i<Math.min(freeQtyToGive, itemsToDiscount.length); i++) {
        discountValue += itemsToDiscount[i];
      }
      return { discount: discountValue, reason: null, nextTimeDiscount: null, freeItems: null };
      
    } else if (activePromo.type === 'free_item') {
      const freeItemName = activePromo.freeItemName || 'ของแถม';
      const freeItemQty = Number(activePromo.freeItemQty) || 1;
      return { 
        discount: 0, 
        reason: null, 
        nextTimeDiscount: null, 
        freeItems: { name: freeItemName, qty: freeItemQty } 
      };
      
    } else if (activePromo.type === 'discount_next_time') {
      const nextVal = Number(activePromo.discountNextValue) || 0;
      if (nextVal <= 0) return { discount: 0, reason: 'มูลค่าส่วนลดครั้งถัดไปเป็น 0', nextTimeDiscount: null, freeItems: null };
      
      const typeStr = activePromo.discountNextType === 'percent' ? `${nextVal}%` : `${nextVal} บาท`;
      return { 
        discount: 0, 
        reason: null, 
        nextTimeDiscount: `คูปองส่วนลด ${typeStr}`, 
        freeItems: null 
      };
    }
    
    return { discount: 0, reason: null, nextTimeDiscount: null, freeItems: null };
  }, [selectedPromotion, subtotal, cart, promotions]);

  const promoDiscount = promoResult.discount;
  const total = Math.max(0, subtotal - globalDiscount - promoDiscount);
  const totalSaved = Math.max(0, (originalSubtotal - subtotal) + globalDiscount + promoDiscount);
  const totalPaid = (splitPayment.cash || 0) + (splitPayment.transfer || 0) + (splitPayment.cod || 0) + (splitPayment.credit || 0) + (splitPayment.omise_promptpay || 0);
  // 🌟 ยอดรวมที่ "ครอบคลุมแล้ว" = เก็บหน้าร้าน + จ่ายไปแล้วผ่านแอป (เครดิตถูกหักตอนสั่งในแอปแล้ว)
  const totalCovered = totalPaid + (appCreditPaidAmount || 0);

  const handleRewardRedemptionScan = async (rewardId, customerIdentifier) => {
    try {
      let customer = null;
      if (customerIdentifier) {
        customer = customers.find(c => c.id === customerIdentifier || 
          String(getFuzzyKey(c, ["เบอร์โทร", "col_3", "phone"]) || '').replace(/[^0-9]/g, '') === String(customerIdentifier).replace(/[^0-9]/g, ''));
      }
      
      if (!customer) {
        showToast("สแกนของรางวัลล้มเหลว", "ไม่พบข้อมูลลูกค้าสำหรับของรางวัลนี้", "error");
        return;
      }
      
      const redeemedRewards = customer.redeemedRewards || [];
      const rewardIdx = redeemedRewards.findIndex(r => r.id === rewardId);
      
      if (rewardIdx === -1) {
        showToast("สแกนล้มเหลว", "ไม่พบของรางวัลนี้ในประวัติการแลกของลูกค้า", "error");
        return;
      }
      
      if (redeemedRewards[rewardIdx].isUsed) {
        showToast("สแกนล้มเหลว", `ของรางวัล "${redeemedRewards[rewardIdx].name}" ถูกใช้งานไปก่อนหน้านี้แล้ว`, "warning");
        return;
      }
      
      const updatedRewards = [...redeemedRewards];
      updatedRewards[rewardIdx] = {
        ...updatedRewards[rewardIdx],
        isUsed: true,
        usedAt: new Date().toISOString()
      };
      
      const custRef = doc(db, "customers", customer.id);
      await updateDoc(custRef, { redeemedRewards: updatedRewards });
      
      showToast("แลกของรางวัลสำเร็จ!", `ยืนยันการเคลมของรางวัล "${redeemedRewards[rewardIdx].name}" เรียบร้อยแล้ว`, "success");
    } catch (e) {
      console.error(e);
      showToast("เกิดข้อผิดพลาด", "ไม่สามารถแลกรับของรางวัลได้ในขณะนี้", "error");
    }
  };

  const handleVoucherScan = async (code, scanPhone = null) => {
    try {
      const q = query(getCol('coupons'), where('code', '==', code.toUpperCase()));
      const snap = await getDocs(q);
      if (snap.empty) {
        showToast(`ไม่พบ Voucher รหัส: ${code}`, 'error');
        return;
      }
      const voucherDoc = snap.docs[0];
      const voucher = voucherDoc.data();
      
      if (voucher.validUntil) {
         const expiryDate = new Date(voucher.validUntil);
         expiryDate.setHours(23, 59, 59, 999);
         if (new Date() > expiryDate) {
            showToast(`Voucher ${code} หมดอายุแล้วเมื่อ ${expiryDate.toLocaleDateString('th-TH')}`, 'error');
            return;
         }
      }
      
      if (voucher.isPersonal && voucher.isUsed) {
        showToast(`Voucher ${code} ถูกใช้งานไปแล้ว`, 'error');
        return;
      }
      
      if (voucher.isPersonal && selectedCustomer) {
        const phoneRaw = String(getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3", "phone"]) || '');
        const cleanPhone = phoneRaw.replace(/[^0-9]/g, '');
        if (voucher.customerPhone && voucher.customerPhone !== cleanPhone) {
          showToast(`Voucher นี้เป็นของลูกค้าเบอร์ ${voucher.customerPhone}`, 'error');
          return;
        }
      }

      if (voucher.conditionAdvanceDays && voucher.conditionAdvanceDays > 0) {
          let bookedDaysAgo = 0;
          if (selectedCustomer) {
             const cleanPhone = String(getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3", "phone"]) || '').replace(/[^0-9]/g, '');
             const todayStr = getLocalYYYYMMDD();
             const activeBooking = bookings.find(b => {
                 const bPhone = String(b.customerPhone || '').replace(/[^0-9]/g, '');
                 return b.date === todayStr && bPhone === cleanPhone;
             });
             if (activeBooking && activeBooking.createdAt) {
                 const createDate = new Date(activeBooking.createdAt);
                 const serviceDate = new Date(activeBooking.date);
                 createDate.setHours(0,0,0,0);
                 serviceDate.setHours(0,0,0,0);
                 const diffTime = Math.abs(serviceDate - createDate);
                 bookedDaysAgo = Math.floor(diffTime / (1000 * 60 * 60 * 24));
             }
          }
          if (bookedDaysAgo < voucher.conditionAdvanceDays) {
              showToast(`คูปองนี้สำหรับลูกค้าที่จองล่วงหน้าอย่างน้อย ${voucher.conditionAdvanceDays} วัน (พบว่าจองล่วงหน้า ${bookedDaysAgo} วัน)`, 'error');
              return;
          }
      }

      // Instead of applying automatically, show confirmation modal
      setInstantVoucherModal({
         code,
         voucher,
         voucherDocId: voucherDoc.id,
         scanPhone
      });

    } catch(err) {
       console.error("Voucher scan err:", err);
       showToast("เกิดข้อผิดพลาดในการตรวจสอบ Voucher", err.message, 'alert');
    }
  };

  useEffect(() => {
     const handleGlobalScan = (e) => {
         const { code, phone } = e.detail;
         if (code) {
             handleVoucherScan(code, phone);
         }
     };
     window.addEventListener('scanVoucherFromOutside', handleGlobalScan);
     return () => window.removeEventListener('scanVoucherFromOutside', handleGlobalScan);
  }, [customers, bookings, courses, selectedCustomer]);

  const executeVoucherAction = async (actionType) => {
      if (!instantVoucherModal) return;
      const { code, voucher, voucherDocId, scanPhone } = instantVoucherModal;
      setInstantVoucherModal(null);

      try {
          if (actionType === 'instant_use') {
              // Mark as used directly without cart
              const batch = writeBatch(db);
              
              if (voucher.isPersonal) {
                  batch.update(doc(db, 'coupons', voucherDocId), { 
                      isUsed: true, 
                      usedAt: new Date().toISOString() 
                  });
              }

              // Create history record
              const historyRef = doc(getCol('histories'));
              batch.set(historyRef, {
                  "วันที่": new Date().toLocaleDateString('th-TH'),
                  "เวลา": new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
                  "ชื่อลูกค้า": selectedCustomer ? String(getFuzzyKey(selectedCustomer, ["ชื่อ", "col_1"]) || '') : 'ไม่ระบุ',
                  "เบอร์โทร": scanPhone || (selectedCustomer ? String(getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3", "phone"]) || '') : ''),
                  "ประเภท": "ใช้สิทธิ์คูปอง",
                  "สถานะ": "เรียบร้อย",
                  "รายการ": `ใช้คูปอง: ${code} (${voucher.type === 'free_item' ? 'แลกรับฟรี' : (voucher.type === 'percent' ? 'ส่วนลด ' + voucher.value + '%' : 'ส่วนลด ฿' + voucher.value)})`,
                  "สาขา": String(globalBranch || "สำนักงานใหญ่")
              });

              await batch.commit();
              showToast('ใช้สิทธิ์คูปองสำเร็จ (ไม่ต้องชำระเงิน)', 'success');
              
          } else if (actionType === 'apply_cart') {
              // Apply to Cart
              if (voucher.type === 'free_item') {
                  addToCart({
                      id: `free-item-${Date.now()}`,
                      name: `แลกรับฟรี (Voucher: ${code})`,
                      price: 0,
                      originalPrice: 0,
                      type: 'product'
                  }, 'product');
                  showToast(`เพิ่มสิทธิ์แลกรับฟรีลงในบิล`, 'success');
              } else {
                  const discountVal = Number(voucher.value) || 0;
                  let actualDiscount = discountVal;
                  if (voucher.type === 'percent') {
                      actualDiscount = (subtotal * discountVal) / 100;
                  }
                  setGlobalDiscount(prev => prev + actualDiscount);
                  showToast('เพิ่มคูปองเป็นส่วนลดในบิลแล้ว', `หักลบ ฿${actualDiscount.toLocaleString()}`, 'success');
              }
              
              setAppliedVoucherCode(code);
              setAppliedVoucherData(voucher);

              if (voucher.isPersonal) {
                  setAppliedVoucherId(voucherDocId);
                  if (!selectedCustomer && (voucher.customerPhone || scanPhone)) {
                      const phoneToSearch = voucher.customerPhone || scanPhone;
                      const foundCustomer = customers.find(c => {
                          const phoneRaw = String(getFuzzyKey(c, ["เบอร์โทร", "col_3", "phone"]) || '');
                          return phoneRaw.replace(/[^0-9]/g, '') === phoneToSearch;
                      });
                      if (foundCustomer) {
                          setSelectedCustomer(foundCustomer);
                      }
                  }
              }
          }
      } catch (err) {
          console.error(err);
          showToast('เกิดข้อผิดพลาดในการใช้คูปอง', err.message, 'error');
      }
  };

  const handleOmisePromptPayCheckout = async (overrideAmount = null) => {
    setIsProcessing(true);
    try {
        const amount = overrideAmount !== null ? overrideAmount : splitPayment.omise_promptpay;
        if (!amount || amount <= 0) return;

        const res = await fetch('https://asia-southeast1-iris-clinic-app.cloudfunctions.net/omiseCharge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token: '',
                sourceType: 'promptpay',
                amount: amount,
                description: `POS Order ${new Date().getTime()}`,
            })
        });
        const data = await res.json();
        if (res.ok && data.status === 'pending') {
            setOmiseChargeData(data);
            setShowOmiseQrModal(true);
            setIsPollingOmise(true);
            setShowPaymentModal(false); // Hide the checkout modal temporarily
        } else {
            showToast('สร้าง QR Code ไม่สำเร็จ: ' + (data.message || data.error), 'error');
        }
    } catch (err) {
        showToast('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ชำระเงินได้', 'error');
    } finally {
        setIsProcessing(false);
    }
  };

  const [triggerCheckout, setTriggerCheckout] = useState(false);
  useEffect(() => {
    if (triggerCheckout) {
      setTriggerCheckout(false);
      handleCheckout();
    }
  }, [triggerCheckout]);

  useEffect(() => {
    let pollInterval;
    if (isPollingOmise && omiseChargeData?.id) {
        pollInterval = setInterval(async () => {
            try {
                const res = await fetch('https://asia-southeast1-iris-clinic-app.cloudfunctions.net/checkOmiseCharge', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chargeId: omiseChargeData.id })
                });
                const data = await res.json();
                if (res.ok && data.status === 'successful') {
                    clearInterval(pollInterval);
                    setIsPollingOmise(false);
                    setShowOmiseQrModal(false);
                    showToast('ลูกค้ายืนยันการชำระเงินเรียบร้อยแล้ว!', 'success');
                    
                    setSplitPayment(prev => ({ 
                        ...prev, 
                        omise_promptpay: 0
                    }));
                    setTriggerCheckout(true);
                }
            } catch (err) {
                console.error("Polling error", err);
            }
        }, 3000);
    }
    return () => clearInterval(pollInterval);
  }, [isPollingOmise, omiseChargeData]);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      showToast('ไม่มีสินค้าในตะกร้า');
      return;
    }
    const hasCourse = cart.some(i => {
      if (i.type !== 'course') return false;
      const qty = String(getFuzzyKey(i.originalItem, ["จำนวนครั้ง", "col_7"]) || '').trim();
      const isTopup = String(i.name).match(/(เติมเงิน|เครดิต|วงเงิน|ฝากเงิน)/);
      return qty !== '1' || isTopup;
    });
    const hasService = cart.some(i => i.type === 'service' || i.type === 'usage');
    if (hasService && !paymentStaff) {
      showToast('มีรายการรับบริการในตะกร้า โปรดเลือกพนักงานผู้ให้บริการ', 'error');
      return;
    }
    if (hasCourse && !selectedCustomer) {
      showToast('มีรายการคอร์สในตะกร้า โปรดเลือกลูกค้าก่อนชำระเงิน', 'error');
      return;
    }
    // 🌟 กันหักเครดิตซ้ำ 2 ครั้ง: ออเดอร์นี้ลูกค้าจ่ายเครดิตไปแล้วในแอป → ห้ามเลือก "ใช้เครดิต" อีก
    if (appCreditPaidAmount > 0 && (splitPayment.credit || 0) > 0) {
      showToast('⚠️ ออเดอร์นี้ลูกค้าจ่ายเครดิตไปแล้วในแอป ฿' + appCreditPaidAmount.toLocaleString() + ' — ห้ามเลือก "ใช้เครดิต" ซ้ำ (เครดิตจะถูกหักสองครั้ง) กรุณาลดช่องเครดิตเป็น 0', 'error');
      return;
    }
    if (totalCovered !== total && total > 0) {
      showToast(`ยอดชำระเงินไม่ตรงกับยอดสุทธิ (ขาดอีก ฿${(total - totalCovered).toLocaleString()})`);
      return;
    }

    const handleGoshipMock = async () => {
       showToast('กำลังจำลองสร้างเลขพัสดุ Goship...');
       await new Promise(r => setTimeout(r, 1000));
       const mockTrackingNo = 'TH' + Math.floor(100000000 + Math.random() * 900000000);
       setPosTrackingNo(mockTrackingNo);
       setGoshipModal({ isOpen: false });
       showToast(`สร้างเลขพัสดุสำเร็จ: ${mockTrackingNo}`, 'success');
    };

    if (appliedVoucherData && appliedVoucherData.conditionPaymentMethod && appliedVoucherData.conditionPaymentMethod !== 'all') {
       if (appliedVoucherData.conditionPaymentMethod === 'transfer' && splitPayment.transfer < total) {
           showToast('คูปองนี้ต้องชำระด้วยการโอนเงินเต็มจำนวนเท่านั้น', 'error');
           return;
       }
       if (appliedVoucherData.conditionPaymentMethod === 'cash' && splitPayment.cash < total) {
           showToast('คูปองนี้ต้องชำระด้วยเงินสดเต็มจำนวนเท่านั้น', 'error');
           return;
       }
    }
    
    setIsProcessing(true);
    try {
      const customDateObj = new Date();
      if (transactionDate) {
        const [y, m, d] = transactionDate.split('-');
        customDateObj.setFullYear(y, m - 1, d);
      }
      
      const orderNo = `POS${Date.now().toString().slice(-6)}`;
      
      let paymentMethodsStrArr = [];
      if (appCreditPaidAmount > 0) paymentMethodsStrArr.push(`จ่ายแล้วผ่านแอป(เครดิต): ${appCreditPaidAmount}`);
      if (splitPayment.cash > 0) paymentMethodsStrArr.push(`เงินสด: ${splitPayment.cash}`);
      if (splitPayment.transfer > 0) paymentMethodsStrArr.push(`โอนเงิน: ${splitPayment.transfer}`);
      if (splitPayment.cod > 0) paymentMethodsStrArr.push(`ค้าง/COD: ${splitPayment.cod}`);
      if (splitPayment.credit > 0) paymentMethodsStrArr.push(`ตัดเครดิต: ${splitPayment.credit}`);
      const paymentMethodStr = paymentMethodsStrArr.join(', ') || 'ฟรี/ส่วนลดเต็มจำนวน';
      const batch = writeBatch(db);
      const delayedHistoryUpdates = [];
      
      const cName = selectedCustomer ? String(getFuzzyKey(selectedCustomer, ["ชื่อ", "col_1"])) : 'ลูกค้าทั่วไป (POS)';
      const cPhone = selectedCustomer ? String(getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3"])) : '';
      const custCleanPhone = cPhone.replace(/[^0-9]/g, '');

      // Handle Credit Deduction
      if (splitPayment.credit > 0 && selectedCustomer) {
        let remainingToDeduct = splitPayment.credit;
        const phone = cPhone.trim();
        const myCourses = courses.filter(c => String(getFuzzyKey(c, ["เบอร์โทร", "col_1"]) || '').trim() === phone && (c.computedRemainCredit || 0) > 0);
        
        for (const c of myCourses) {
          if (remainingToDeduct <= 0) break;
          const available = c.computedRemainCredit;
          const deductAmt = Math.min(available, remainingToDeduct);
          
          const historyRef = doc(getCol('histories'));
          batch.set(historyRef, {
            "วันที่": customDateObj.toLocaleDateString('th-TH'),
            "เวลา": customDateObj.toLocaleTimeString('th-TH', { hour12: false, hour: '2-digit', minute: '2-digit' }),
            "ชื่อลูกค้า": cName,
            "เบอร์โทร": cPhone,
            "cleanPhone": custCleanPhone,
            "เลขที่ใบคอส": c.courseRefKey || String(getFuzzyKey(c, ["เลขที่ใบคอส", "col_3"])),
            "อ้างอิง": orderNo,
            "ประเภท": "เบิกใช้เครดิต",
            "ยอดเงิน": String(deductAmt),
            "รายละเอียด": `ใช้เครดิตชำระสินค้าบิล ${orderNo}`,
            "สาขา": String(globalBranch || "สำนักงานใหญ่")
          });
          
          remainingToDeduct -= deductAmt;
        }
      }
      
      
      let itemsStr = [];
      let courseClaimUpdates = {};

      for (const item of cart) {
        itemsStr.push(`${item.name} x${item.qty}`);

        if (item.type === 'product') {
          if (!item.skipStockUpdate) {
              const productRef = doc(db, 'products', item.id);
              
              // Re-calculate stock based on action type
              let newStockByBranch = { ...(item.originalItem?.stock_by_branch || {}) };
              
              if (item.actionType === 'owner_purchase') {
                const chawengStock = parseQty(newStockByBranch['เฉวง'] || 0);
                newStockByBranch['เฉวง'] = chawengStock + item.qty;
              } else if (item.actionType === 'branch_requisition') {
                const chawengStock = parseQty(newStockByBranch['เฉวง'] || 0);
                const myStock = parseQty(newStockByBranch[globalBranch || 'เฉวง'] || 0);
                newStockByBranch['เฉวง'] = Math.max(0, chawengStock - item.qty);
                if (globalBranch && globalBranch !== 'เฉวง') {
                   newStockByBranch[globalBranch] = myStock + item.qty;
                }
              } else {
                const myStock = parseQty(newStockByBranch[globalBranch || 'เฉวง'] || 0);
                newStockByBranch[globalBranch || 'เฉวง'] = Math.max(0, myStock - item.qty);
              }
    
              batch.set(productRef, { stock_by_branch: newStockByBranch }, { merge: true });
          }

          // History for product
          const historyRef = doc(getCol('histories'));
          let historyType = "ซื้อสินค้า";
          if (item.actionType === 'owner_purchase') historyType = "สั่งซื้อสินค้าเข้าสต๊อก (PO)";
          else if (item.actionType === 'branch_requisition') historyType = "เบิกสินค้าจากศูนย์ใหญ่";

          batch.set(historyRef, {
            "วันที่": customDateObj.toLocaleDateString('th-TH'),
            "ชื่อลูกค้า": (item.actionType === 'owner_purchase' || item.actionType === 'branch_requisition') ? 'ศูนย์ใหญ่/พาร์ทเนอร์' : cName,
            "เบอร์โทร": (item.actionType === 'owner_purchase' || item.actionType === 'branch_requisition') ? '' : cPhone,
            "cleanPhone": (item.actionType === 'owner_purchase' || item.actionType === 'branch_requisition') ? '' : custCleanPhone,
            "หมายเลขคำสั่งซื้อ": orderNo,
            "ประเภท": historyType,
            "สถานะ": "เรียบร้อย",
            "สินค้า": item.name,
            "จำนวน": String(item.qty),
            "ยอดเงิน": String(item.price * item.qty),
            "สาขา": item.actionType === 'owner_purchase' ? 'เฉวง' : String(globalBranch || "สำนักงานใหญ่"),
            "พนักงาน": paymentStaff
          });
        } 
        else if (item.type === 'service') {
          // Record service history
          const historyRef = doc(getCol('histories'));
          batch.set(historyRef, {
            "วันที่": customDateObj.toLocaleDateString('th-TH'),
            "เวลา": customDateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
            "ชื่อลูกค้า": cName,
            "เบอร์โทร": cPhone,
            "cleanPhone": custCleanPhone,
            "หมายเลขคำสั่งซื้อ": orderNo,
            "ประเภท": "รับบริการ",
            "สถานะ": "เรียบร้อย",
            "รายการ": item.name,
            "จำนวน": String(item.qty),
            "ยอดเงิน": String(item.price * item.qty),
            "สาขา": String(globalBranch || "สำนักงานใหญ่"),
            "พนักงาน": paymentStaff
          });

          // Find employee IDs for service_logs
          const staffList = paymentStaff ? paymentStaff.split('/').map(s => s.trim()).filter(Boolean) : [];
          staffList.forEach(sName => {
             const emp = employees.find(e => e.name === sName);
             if (emp) {
                const serviceLogRef = doc(getCol('service_logs'));
                batch.set(serviceLogRef, {
                  date: customDateObj.toISOString().split('T')[0],
                  type: item.name,
                  amount: item.price * item.qty,
                  note: `POS: ${orderNo}`,
                  employeeId: emp.id,
                  employeeName: emp.name,
                  branch: String(globalBranch || "สำนักงานใหญ่"),
                  createdAt: customDateObj.toISOString()
                });
             }
          });
        }
        else if (item.type === 'usage') {
          // History for course usage
          const historyRef = doc(getCol('histories'));
          const custSignatureUrl = custSigRef.current?.toDataURL() || null;
          const staffSignatureUrl = staffSigRef.current?.toDataURL() || null;

          const deductedQty = usedServices.filter(s => {
            const name = String(getFuzzyKey(s, ["ชื่อคอส", "col_4"])).trim();
            return !name.includes('ฟรี');
          }).length || (usedServices.some(s => String(getFuzzyKey(s, ["ชื่อคอส", "col_4"])).includes('ฟรี')) ? 0 : 1);
          const finalQty = deductedQty > 0 ? deductedQty : (usedServices.length === 0 ? item.qty : 0);
          item.qty = finalQty;

          batch.set(historyRef, {
            "วันที่": customDateObj.toLocaleDateString('th-TH'),
            "เวลา": customDateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
            "ชื่อลูกค้า": cName,
            "เบอร์โทร": cPhone,
            "cleanPhone": custCleanPhone,
            "หมายเลขคำสั่งซื้อ": orderNo,
            "เลขที่ใบคอส": String(getFuzzyKey(item.originalItem, ["เลขที่ใบคอส", "col_2"]) || ''),
            "ประเภท": "รับบริการ",
            "สถานะ": "เรียบร้อย",
            "รายการ": "ตัดคอร์สผ่านระบบ POS",
            "จำนวน": String(finalQty),
            "สาขา": String(globalBranch || "สำนักงานใหญ่"),
            "courseId": item.id,
            "usedServices": usedServices.map(s => getFuzzyKey(s, ["ชื่อคอส", "col_4"])),
            "พนักงาน": paymentStaff,
            "courseUpdatedDirectly": true
          });

          // Defer heavy image uploads to background so UI is not blocked
          if (paymentPhotos.before.length > 0 || paymentPhotos.after.length > 0 || custSignatureUrl || staffSignatureUrl) {
              delayedHistoryUpdates.push({
                  ref: historyRef,
                  data: {
                      "customerPhoto": paymentPhotos.before[0] || paymentPhotos.after[0] || null,
                      "customerPhotos": paymentPhotos,
                      "customerSignature": custSignatureUrl,
                      "staffSignature": staffSignatureUrl
                  }
              });
          }

          // --- Auto Create Booking & Assign Bed ---
          if (selectedBed) {
             const bookingRef = doc(getCol('bookings'));
             const nowObj = new Date();
             const nowIso = nowObj.toISOString();
             
             // Time components to match timezone correctly
             const localNowStr = new Date(nowObj.getTime() - (nowObj.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
             const dateStr = localNowStr.split('T')[0];
             const timeStr = localNowStr.split('T')[1];

             const usedServicesStr = usedServices.map(s => getFuzzyKey(s, ["ชื่อคอส", "col_4"])).join(', ');
             
             batch.set(bookingRef, {
                 courseId: item.id || '',
                 courseRef: String(getFuzzyKey(item.originalItem, ["เลขที่ใบคอส", "col_2"]) || ''),
                 courseName: usedServicesStr || item.name,
                 customerName: cName,
                 customerPhone: cPhone,
                 customerId: selectedCustomer ? selectedCustomer.id : '',
                 dateTime: localNowStr,
                 date: dateStr,
                 time: timeStr,
                 branch: String(globalBranch || "เฉวง"),
                 status: 'กำลังใช้บริการ',
                 serviceStartTime: nowIso,
                 createdAt: nowIso,
                 bedNumber: String(selectedBed),
                 isWalkIn: true
             });
          }

          // Update course directly to cache the state
          const courseId = item.originalItem.id;
          const courseRef = doc(getCol('courses'), courseId);
          const currentUsed = item.originalItem.computedUsedQty || 0;
          const currentTotal = item.originalItem.computedTotalQty || 1;
          const newUsed = currentUsed + finalQty;
          const newRemain = Math.max(0, currentTotal - newUsed);
          const newStatus = newRemain <= 0 ? "ใช้ครบแล้ว" : "ยังคงเหลือ";

          batch.update(courseRef, {
            "ครั้งที่ใช้": String(newUsed),
            "สถานะ": newStatus
          });
        }
        else if (item.type === 'debt_payment') {
          // Update Course Payment Pending Amount
          const courseId = item.originalItem.id;
          const courseRef = doc(getCol('courses'), courseId);
          
          const currentPending = item.originalItem.computedPendingAmount || 0;
          const currentPaid = parseNumber(getFuzzyKey(item.originalItem, ["ยอดชำระแล้วทั้งหมด", "ยอดชำระแล้ว"]));
          
          const newPending = Math.max(0, currentPending - item.price);
          const newPaid = currentPaid + item.price;
          
          const originalPaymentStr = String(getFuzzyKey(item.originalItem, ["ประเภทการชำระ", "col_7"]) || '');
          const combinedPaymentStr = originalPaymentStr ? (originalPaymentStr.includes(paymentMethodStr) ? originalPaymentStr : `${originalPaymentStr}, ${paymentMethodStr}`) : paymentMethodStr;

          batch.update(courseRef, {
            "ยอดค้างชำระ": String(newPending),
            "ยอดชำระแล้วทั้งหมด": String(newPaid),
            "ประเภทการชำระ": combinedPaymentStr
          });

          // History for debt payment
          const historyRef = doc(getCol('histories'));
          batch.set(historyRef, {
            "วันที่": customDateObj.toLocaleDateString('th-TH'),
            "เวลา": customDateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
            "ชื่อลูกค้า": cName,
            "เบอร์โทร": cPhone,
            "cleanPhone": custCleanPhone,
            "หมายเลขคำสั่งซื้อ": orderNo,
            "ประเภท": "ชำระยอดค้าง",
            "สถานะ": "เรียบร้อย",
            "สินค้า": item.name,
            "ยอดเงิน": String(item.price),
            "สาขา": String(globalBranch || "สำนักงานใหญ่"),
            "อ้างอิง": String(getFuzzyKey(item.originalItem, ["เลขที่ใบคอส", "col_2"]) || '')
          });
        }
        else if (item.type === 'claim_item') {
          // Record the claim update locally to prevent overwriting in batch
          if (!courseClaimUpdates[item.courseId]) {
             courseClaimUpdates[item.courseId] = [...(item.originalCourse.claimedItems || [])];
          }
          for (let i = 0; i < item.qty; i++) {
             courseClaimUpdates[item.courseId].push(item.itemName);
          }

          // Try to deduct stock if it's a product
          const product = products.find(p => String(getFuzzyKey(p, ["ชื่อสินค้า", "col_4"])) === item.itemName || item.itemName.includes(String(getFuzzyKey(p, ["ชื่อสินค้า", "col_4"]))));
          if (product) {
             const productRef = doc(db, 'products', product.id);
             let newStockByBranch = { ...(product.stock_by_branch || {}) };
             const myStock = parseQty(newStockByBranch[globalBranch || 'เฉวง'] || 0);
             newStockByBranch[globalBranch || 'เฉวง'] = Math.max(0, myStock - item.qty);
             batch.set(productRef, { stock_by_branch: newStockByBranch }, { merge: true });
          }

          // Add History
          const historyRef = doc(getCol('histories'));
          batch.set(historyRef, {
            "วันที่": customDateObj.toLocaleDateString('th-TH'),
            "เวลา": customDateObj.toLocaleTimeString('th-TH', { hour12: false, hour: '2-digit', minute: '2-digit' }),
            "ชื่อลูกค้า": cName,
            "เบอร์โทร": cPhone,
            "cleanPhone": custCleanPhone,
            "หมายเลขคำสั่งซื้อ": orderNo,
            "ประเภท": "เบิกสินค้าจากคอร์ส",
            "สถานะ": "เรียบร้อย",
            "รายการ": item.itemName,
            "จำนวน": String(item.qty),
            "สาขา": String(globalBranch || "สำนักงานใหญ่"),
            "อ้างอิง": String(getFuzzyKey(item.originalCourse, ["เลขที่ใบคอส", "col_3"]) || '')
          });
        }
        else if (item.type === 'course' || item.type === 'single_course') {
          // Generate Course instances per quantity
          for (let i = 0; i < item.qty; i++) {
            const courseNo = `IC${Date.now().toString().slice(-6)}${i}`;
            const courseRef = doc(getCol('courses'));
            const courseTotalQty = String(getFuzzyKey(item.originalItem, ["จำนวนครั้ง", "col_7"]) || "1");
            let creditReceived = String(getFuzzyKey(item.originalItem, ["เครดิตที่ได้รับ", "เครดิตที่ได้", "ยอดเครดิต", "เครดิต", "วงเงินคอร์ส", "col_14"]) || "0");
            if (parseNumber(creditReceived) === 0 && String(item.name).match(/(เติมเงิน|เครดิต|วงเงิน|ฝากเงิน|voucher)/i)) {
                creditReceived = String(item.price);
            }
            
            let expireDateStr = "";
            if (item.type === 'single_course') {
                const expDate = new Date(customDateObj);
                expDate.setDate(expDate.getDate() + 7);
                const exY = expDate.getFullYear() + 543;
                expireDateStr = `${String(expDate.getDate()).padStart(2, '0')}/${String(expDate.getMonth() + 1).padStart(2, '0')}/${exY}`;
            }

            const courseData = {
              "เบอร์โทร": cPhone,
              "cleanPhone": custCleanPhone,
              "เลขที่ใบคอส": courseNo,
              "วันที่ซื้อ": customDateObj.toLocaleDateString('th-TH'),
              "ผู้ซื้อคอส": cName,
              "ชื่อคอส": item.name,
              "สาขาที่ซื้อ": String(globalBranch || "สำนักงานใหญ่"),
              "ราคา": String(item.price),
              "เครดิตที่ได้รับ": creditReceived,
              "จำนวนครั้งที่ได้": courseTotalQty,
              "ยอดค้างชำระ": "0",
              "ยอดชำระแล้วทั้งหมด": String(item.price),
              "ครั้งที่ใช้": "0",
              "ครั้งที่เหลือดิบ": courseTotalQty,
              "สถานะ": "ยังคงเหลือ",
              "ประเภทการชำระ": paymentMethodStr,
              "รายการที่ได้รับ": String(getFuzzyKey(item.originalItem, ["รายการที่ได้รับ", "col_11"]) || ''),
              "ฟรีบัตรสมาชิก": String(getFuzzyKey(item.originalItem, ["ฟรีบัตรสมาชิก"]) || 'ไม่'),
              "claimedItems": []
            };
            if (expireDateStr) courseData["วันหมดอายุ"] = expireDateStr;
            batch.set(courseRef, courseData);

            // History for course
            const historyRef = doc(getCol('histories'));
            batch.set(historyRef, {
              "วันที่": customDateObj.toLocaleDateString('th-TH'),
              "ชื่อลูกค้า": cName,
              "เบอร์โทร": cPhone,
              "cleanPhone": custCleanPhone,
              "หมายเลขคำสั่งซื้อ": orderNo,
              "ประเภท": "ซื้อคอร์ส",
              "สถานะ": "เรียบร้อย",
              "สินค้า": item.name,
              "ยอดเงิน": String(item.price),
              "สาขา": String(globalBranch || "สำนักงานใหญ่"),
              "อ้างอิง": courseNo,
              "พนักงาน": paymentStaff
            });
          }
        }
      }

      // Apply accumulated claim updates for courses
      for (const [cId, updatedItems] of Object.entries(courseClaimUpdates)) {
        batch.update(doc(db, 'courses', cId), {
           claimedItems: updatedItems
        });
      }

      // Master Order Record (signatures stored in history only, not here — reduces batch payload size)
      const orderRef = doc(getCol('orders'));
      // NOTE: Signatures are NOT stored on the order doc to keep batch small & fast
      
      let totalCost = 0;
      let courseCost = 0;
      let productCost = 0;
      for (const item of cart) {
        if (item.type === 'course') {
           const costAmt = (item.price * item.qty) * 0.10;
           courseCost += costAmt;
           totalCost += costAmt;
        } else if (item.originalItem && item.type !== 'debt_payment' && item.type !== 'usage') {
           const costAmt = computeOwnerCostPrice(item.originalItem) * item.qty;
           productCost += costAmt;
           totalCost += costAmt;
        }
      }
      
      let transactionType = 'sale';
      if (cart.some(i => i.actionType === 'owner_purchase')) transactionType = 'owner_purchase';
      else if (cart.some(i => i.actionType === 'branch_requisition')) transactionType = 'branch_requisition';

      batch.set(orderRef, {
        orderNo,
        customerName: cName,
        customerPhone: cPhone,
        cleanPhone: custCleanPhone,
        courseName: itemsStr.join(', '), // Summarize items
        price: String(total),
        discount: String(globalDiscount),
        promotionId: selectedPromotion || null,
        promoDiscount: String(promoDiscount),
        qty: String(cart.reduce((sum, item) => sum + item.qty, 0)),
        branch: String(globalBranch || "สำนักงานใหญ่"),
        status: posTrackingNo.trim() ? "กำลังจัดส่ง" : "สำเร็จ",
        paymentMethod: paymentMethodStr,
        source: "POS",
        orderChannel,
        shippingAddress,
        trackingNo: posTrackingNo.trim(),
        fulfillment: posTrackingNo.trim() ? 'shipped' : '',
        wcOrderId: activeWcOrderId,
        createdAt: customDateObj.toISOString(),
        paymentStaff,
        usedServices: usedServices.map(s => getFuzzyKey(s, ["ชื่อคอส", "col_4"])),
        transactionType,
        totalCost: String(totalCost),
        courseCost: String(courseCost),
        productCost: String(productCost),
        cartItems: cart.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price, type: i.type }))
      });

      if (activeCustomerAppOrderIds.length > 0) {
        activeCustomerAppOrderIds.forEach(id => {
          const custAppOrderRef = doc(getCol('orders'), id);
          batch.update(custAppOrderRef, { status: "ชำระเงินแล้ว", updatedAt: customDateObj.toISOString() });
          
          // Send LINE Notification
          const relatedOrder = orders.find(o => o.id === id);
          if (relatedOrder && relatedOrder.customerPhone) {
             const targetCustomer = customers.find(c => String(c.computedPhone || getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '').trim() === String(relatedOrder.customerPhone).trim());
             if (targetCustomer && targetCustomer.lineUid) {
                 sendOrderLineNotification(relatedOrder, 'อนุมัติแล้ว', targetCustomer.lineUid);
             }
          }
        });
      }

      await batch.commit();

      // 🌟 ปิดบิล Woo อัตโนมัติ: ออเดอร์แอปที่ถูกสร้างบน irisnatures.com (มี wcOrderId บน OD)
      // → เมื่อ POS เก็บเงินเสร็จ (stamp ชำระเงินแล้ว) ให้ completed บนเว็บด้วย กัน POS ดึงซ้ำ/ค้างสถานะ processing
      if (activeCustomerAppOrderIds.length > 0) {
        (async () => {
          for (const oid of activeCustomerAppOrderIds) {
            try {
              const od = orders.find(o => o.id === oid);
              if (od && od.wcOrderId) {
                await fetchWithProxy(`https://irisnatures.com/wp-json/wc/v3/orders/${od.wcOrderId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'completed' }) }, true);
                console.log(`✅ Woo order #${od.wcOrderId} completed (ออเดอร์แอป ${od.orderNo} ปิดบิลแล้ว)`);
              }
            } catch (e) { console.error(`Failed to complete Woo order for ${oid}:`, e); }
          }
        })();
      }

      // 📮 ถ้ากรอกเลขพัสดุตอนชำระ → ลงทะเบียน 17TRACK + ดึงสถานะเก็บลงบิลทันที (เบื้องหลัง)
      const posTrackingClean = posTrackingNo.trim();
      if (posTrackingClean) {
        (async () => {
          try {
            try { await fetch17Track('https://api.17track.net/track/v2.2/register', [{ number: posTrackingClean }]); } catch (e) {}
            const json = await fetch17Track('https://api.17track.net/track/v2.2/gettrackinfo', [{ number: posTrackingClean }]);
            const acc = json?.data?.accepted?.[0];
            const ti = acc?.track_info || null;
            const allEvents = (ti?.tracking?.providers || []).flatMap(p => p?.events || []);
            const lastEv = ti?.latest_event || allEvents[allEvents.length - 1] || null;
            const normPhase = (s) => { const x = String(s || 'Pending'); return (x.charAt(0).toLowerCase() + x.slice(1)).replace(/_([a-zA-Z])/g, (m, c) => c.toUpperCase()); };
            await updateDoc(orderRef, { trackingInfo: {
              number: posTrackingClean,
              carrier: acc?.carrier ? String(acc.carrier) : '',
              phase: normPhase(ti?.latest_status?.status),
              lastEvent: lastEv ? { time: lastEv.time_iso || '', desc: lastEv.description || '', location: lastEv.location || '' } : null,
              events: allEvents.slice(-8).reverse().map(e => ({ time: e.time_iso || '', desc: e.description || '', location: e.location || '' })),
              fetchedAt: new Date().toISOString()
            }});
            console.log(`✅ 17TRACK พร้อมสำหรับ ${orderNo} (${posTrackingClean})`);
          } catch (e) { console.error('17TRACK at checkout failed:', e); }
        })();
      }

      // --- Background: Upload Heavy Images ---
      if (delayedHistoryUpdates.length > 0) {
        (async () => {
            try {
                const imgBatch = writeBatch(db);
                delayedHistoryUpdates.forEach(update => {
                    imgBatch.update(update.ref, update.data);
                });
                await imgBatch.commit();
            } catch (err) {
                console.error('Failed to upload heavy images in background:', err);
            }
        })();
      }

      // --- Auto-complete Active Queue (non-blocking: runs after commit) ---
      const custPhoneForQueue = cPhone;
      if (custPhoneForQueue) {
        (async () => {
          try {
            const qBk = query(
              collection(db, 'bookings'),
              where('customerPhone', '==', custPhoneForQueue),
              where('status', '==', 'กำลังใช้บริการ')
            );
            const snapBk = await getDocs(qBk);
            if (!snapBk.empty) {
              const queueBatch = writeBatch(db);
              snapBk.forEach(docSnap => {
                queueBatch.update(docSnap.ref, { status: 'เสร็จสิ้น', completedAt: new Date().toISOString() });
              });
              await queueBatch.commit();
            }
          } catch (e) {
            console.error('Error auto-completing queue:', e);
          }
        })();
      }
      
      if (appliedVoucherId) {
        try {
          await updateDoc(doc(db, 'coupons', appliedVoucherId), { isUsed: true, usedAt: new Date().toISOString() });
        } catch(e) { console.error("Failed to mark voucher used", e); }
      }

      showToast('ชำระเงินสำเร็จ!', 'success');
      
      setShowPaymentModal(false);
      setSelectedBed('');

      // Save data for receipt modal instead of clearing everything immediately
      const todayStr = customDateObj.toISOString().split('T')[0];
      const todayBranchOrders = orders.filter(o => 
         o.createdAt && o.createdAt.startsWith(todayStr) && String(o.branch || "สำนักงานใหญ่") === String(globalBranch || "สำนักงานใหญ่")
      );
      // Include this current order in the count by adding 1
      const queueNo = String(todayBranchOrders.length + 1).padStart(3, '0');

      // Read signatures here (only for receipt display — NOT stored in Firestore batch)
      const custSignatureUrl = custSigRef.current?.toDataURL() || null;
      const staffSignatureUrl = staffSigRef.current?.toDataURL() || null;

      setReceiptData({
        orderNo,
        queueNo,
        customerName: cName,
        customerPhone: cPhone,
        items: [...cart],
        subtotal,
        total,
        globalDiscount,
        appliedVoucherCode,
        promotionId: selectedPromotion || null,
        promoDiscount,
        promoFreeItems: selectedPromotion ? promoResult.freeItems : null,
        promoNextTimeDiscount: selectedPromotion ? promoResult.nextTimeDiscount : null,
        totalSaved,
        paymentMethodStr,
        orderChannel,
        shippingAddress,
        splitPayment: {...splitPayment},
        createdAt: customDateObj,
        customerSignature: custSignatureUrl,
        staffSignature: staffSignatureUrl,
        usedServices: usedServices.map(s => getFuzzyKey(s, ["ชื่อคอส", "col_4"]))
      });
      setCart([]);
      setAppCreditPaidAmount(0);
      setGlobalDiscount(0);
      setAppliedVoucherId(null);
      setAppliedVoucherCode(null);
      setAppliedVoucherData(null);
      setSelectedCustomer(null);
      setActiveWcOrderId(null);
      setActiveCustomerAppOrderIds([]);
      setAppliedVoucherId(null);
      setIsMobileCartOpen(false); // Close cart immediately so receipt shows properly

      // If autoPrint is enabled — open preview immediately so print fires without user action
      if (autoPrint) {
        setPrintMode('receipt');
        setShowPreviewModal(true);
      }
      
      // Send LINE Flex Message Notification for POS Checkout
      if (selectedCustomer && selectedCustomer.lineUid && !isRequisitionMode) {
          const receiptForLine = {
             receiptNo: orderNo,
             items: cart,
             totalAmount: subtotal,
             discount: totalSaved,
             finalAmount: total
          };
          sendPOSCheckoutNotification(receiptForLine, selectedCustomer.lineUid)
              .catch(e => console.warn('POS Line notification failed:', e.message));
      }

    } catch (error) {
      console.error(error);
      showToast(`เกิดข้อผิดพลาด: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };



  const handleSaveA4AsImage = () => {
    const printArea = document.getElementById('eod-a4-content');
    if (printArea) {
      setIsSavingImage(true);
      html2canvas(printArea, { scale: 2, useCORS: true }).then(canvas => {
        const link = document.createElement('a');
        link.download = `รายงานสรุปยอด_${new Date().toLocaleDateString('th-TH').replace(/\//g, '-')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        setIsSavingImage(false);
      }).catch(err => {
        console.error('Error saving image:', err);
        setIsSavingImage(false);
        showToast('เกิดข้อผิดพลาดในการบันทึกรูปภาพ', 'error');
      });
    }
  };

  const handleEodSubmit = async () => {
    if (!eodData.submittedBy) {
      showToast('กรุณาเลือกผู้ส่งยอด', 'error');
      return;
    }
    if (eodData.actualCash === '' && !isOwnerZeroEod) {
      showToast('กรุณาระบุยอดส่งเงินสด', 'error');
      return;
    }

    setIsSubmittingEod(true);
    try {
      const expectedCash = eodBreakdown.cash + (parseNumber(eodData.floatCash) || 0);
      const nonCashSales = (eodBreakdown.transfer || 0) + (eodBreakdown.credit || 0) + (eodBreakdown.cod || 0);
      
      const expectedTotalSystemBalance = expectedCash + nonCashSales;
      const floatCashNum = parseNumber(eodData.floatCash) || 0;
      const baseFloat = Math.floor(floatCashNum / 100) * 100;
      const expectedTheoreticalDeposit = Math.floor(expectedTotalSystemBalance / 100) * 100 - baseFloat;
      const expectedNextDayFloat = expectedTotalSystemBalance - expectedTheoreticalDeposit;
      const expectedRemitAmount = expectedCash - expectedNextDayFloat;

      const actualRemittedCash = parseNumber(eodData.actualCash);
      const diff = eodData.actualCash ? actualRemittedCash - expectedRemitAmount : 0;
      const actualTotalCash = eodData.actualCash ? actualRemittedCash + expectedNextDayFloat : expectedCash;

      const totalSystemBalance = actualTotalCash + nonCashSales;
      const totalTheoreticalDeposit = Math.floor(totalSystemBalance / 100) * 100 - baseFloat;
      const nextDayFloat = totalSystemBalance - totalTheoreticalDeposit;
      const remitAmount = eodData.actualCash ? actualRemittedCash : expectedRemitAmount;

      const onlineSales = eodBreakdown.online || 0;
      const eodRef = doc(getCol('daily_sales'));
      const batch = writeBatch(db);
      
      const posFilterDateObj = new Date();
      if (posFilterDate) {
        const [y, m, d] = posFilterDate.split('-');
        posFilterDateObj.setFullYear(y, m - 1, d);
      }
      const todayForFilter = posFilterDateObj.toLocaleDateString('th-TH');
      
      batch.set(eodRef, {
        date: todayForFilter,
        branch: globalBranch || "สำนักงานใหญ่",
        totalSales: todaySales + manualTransferNum,
        cashSales: eodBreakdown.cash,
        transferSales: eodBreakdown.transfer,
        codSales: eodBreakdown.cod - eodBreakdown.online,
        creditSales: eodBreakdown.credit,
        onlineSales: eodBreakdown.online,
        courseSales: eodBreakdown.courseSalesAmt,
        productSales: eodBreakdown.productSalesAmt,
        manualSales: eodBreakdown.manualSalesAmt,
        transferDetails: eodBreakdown.transferDetails,
        pendingDetails: eodBreakdown.pendingDetails,
        floatCash: floatCashNum,
        actualCash: actualTotalCash,
        expectedCash: expectedCash,
        difference: diff,
        remitAmount: remitAmount,
        totalDeposit: totalTheoreticalDeposit,
        nextDayFloat: nextDayFloat,
        imageBase64: eodData.imageBase64 || '',
        submittedBy: eodData.submittedBy,
        submittedByName: eodData.submittedBy === 'owner' ? 'เจ้าของร้าน' : (employees.find(e => e.id === eodData.submittedBy)?.name || ''),
        noSales: isEodNoSales && !manualTransferNum,
        manualTransfer: manualTransferNum,
        manualTransferNote: manualTransferNum ? (eodData.manualTransferNote || '') : '',
        status: 'รอตรวจสอบ',
        createdAt: posFilterDate ? `${posFilterDate}T${new Date().toISOString().split('T')[1]}` : new Date().toISOString()
      });

      // Handle Clock Out
      if (eodData.clockOut && !isEodBackdated && eodData.submittedBy !== 'owner') {
         const today = getLocalYYYYMMDD();
         const attRecord = employeeAttendance.find(a => a.employeeId === eodData.submittedBy && a.date === today && !a.clockOut);
         if (attRecord) {
             const attRef = doc(db, 'employee_attendance', attRecord.id);
             batch.update(attRef, { clockOut: new Date().toISOString() });
         }
      }

      await batch.commit();
      
      showToast('ส่งยอดประจำวันเรียบร้อยแล้ว!', 'success');
      quickEodSubmittedRef.current = true;
      setShowEodModal(false);
      setEodData({ actualCash: '', floatCash: '1000', imageBase64: '', submittedBy: '', clockOut: true, manualTransfer: '', manualTransferNote: '' });
    } catch (error) {
      console.error(error);
      showToast(`เกิดข้อผิดพลาด: ${error.message}`, 'error');
    } finally {
      setIsSubmittingEod(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

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
          
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
          setEodData({ ...eodData, imageBase64: compressedDataUrl });
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };


  const handleProcessCustomerAppOrder = (orderOrOrders) => {
    const ordersToProcess = Array.isArray(orderOrOrders) ? orderOrOrders : [orderOrOrders];
    if (ordersToProcess.length === 0) return;

    let hasTransfer = false;
    let totalDiscountAmt = 0;
    const newCart = [...cart];
    
    ordersToProcess.forEach(order => {
      if (order.paymentMethod === 'transfer') hasTransfer = true;
      
      // Accumulate discounts from customer app
      if (order.discount && !isNaN(Number(order.discount))) totalDiscountAmt += Number(order.discount);
      if (order.discountAmt && !isNaN(Number(order.discountAmt))) totalDiscountAmt += Number(order.discountAmt);
      if (order.pointsDiscount && !isNaN(Number(order.pointsDiscount))) totalDiscountAmt += Number(order.pointsDiscount);
      if (order.voucherDiscount && !isNaN(Number(order.voucherDiscount))) totalDiscountAmt += Number(order.voucherDiscount);
      
      
      (order.cartItems || []).forEach(item => {
        let origItem = null;
        if (item.type === 'product') origItem = products.find(p => p.id === item.id) || null;
        else if (item.type === 'course') origItem = masterCourses.find(c => c.id === item.id) || null;
        
        const existingIdx = newCart.findIndex(ci => ci.id === item.id && ci.type === item.type);
        if (existingIdx >= 0) {
           newCart[existingIdx].qty += Number(item.qty || 1);
        } else {
           newCart.push({
            id: item.id,
            originalItem: origItem,
            name: item.name,
            price: Number(item.price || 0),
            qty: Number(item.qty || 1),
            type: item.type || 'product'
          });
        }
      });
    });

    setCart(newCart);
    setActiveCustomerAppOrderIds(prev => [...new Set([...prev, ...ordersToProcess.map(o => o.id)])]);

    // 🌟 ตรวจออเดอร์ที่ลูกค้า "จ่ายเครดิตไปแล้วในแอป" → ปล่อยสินค้าได้เลยโดย POS ต้องไม่ตัดเครดิตซ้ำ
    const creditPaidOrders = ordersToProcess.filter(o =>
      o.paymentMethod === 'credit' || o.paymentMethod === 'balance_pay' || String(o.paymentMethod || '').includes('ตัดเครดิต')
    );
    let appPaidTotal = appCreditPaidAmount;
    if (creditPaidOrders.length > 0) {
      const addedAmt = creditPaidOrders.reduce((s, o) => s + (Number(o.itemPrice) || 0), 0);
      appPaidTotal += addedAmt;
      setAppCreditPaidAmount(appPaidTotal);
      // ล้างการเลือกเครดิต (ถ้ามี) กันพนักงานเผลอกดชำระด้วยเครดิตซ้ำ
      setSplitPayment(prev => ({ ...prev, credit: 0 }));
    }

    if (totalDiscountAmt > 0) {
        setDiscountType('amount');
        setDiscountVal(totalDiscountAmt);
    }

    if (hasTransfer) {
       setPaymentMethodStr('โอนเงิน');
       setOrderChannel('ทางเว็บ');
    } else if (creditPaidOrders.length > 0) {
       setPaymentMethodStr('จ่ายแล้วผ่านแอป');
       setOrderChannel('หน้าร้าน');
    } else {
       setPaymentMethodStr('เงินสด');
       setOrderChannel('หน้าร้าน');
    }

    showToast(creditPaidOrders.length > 0
      ? `ดึงออเดอร์เข้าตะกร้าสำเร็จ — ⚠️ ลูกค้าจ่ายเครดิตไปแล้วในแอป ฿${appPaidTotal.toLocaleString()} ห้ามเลือก "ใช้เครดิต" ซ้ำ`
      : 'ดึงรายการออเดอร์เข้าตะกร้าสำเร็จ', 'success');
  };

  const renderCustomerContext = () => {
    if (!selectedCustomer) return null;
    const cPhone = String(selectedCustomer.computedPhone || getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3"]) || '').trim();
    if (!cPhone) return null;

    const pendingBookingStatuses = ['รอยืนยัน', 'รอการยืนยัน', 'รอตรวจสอบยอดโอน', 'รอเข้ารับบริการ', 'ยืนยันแล้ว', 'รอคิว'];
    const custBookings = bookings.filter(b => b.customerPhone === cPhone && pendingBookingStatuses.includes(b.status)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const custOrders = orders.filter(o => o.customerPhone === cPhone && (!o.source || o.source !== 'POS') && o.status && String(o.status).includes('รอ') && !activeCustomerAppOrderIds.includes(o.id)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (custBookings.length === 0 && custOrders.length === 0) {
       if (showCustomerContextModal) setShowCustomerContextModal(false);
       return null;
    }

    const totalPending = custBookings.length + custOrders.length;

    return (
      <div className="mt-2 w-full animate-in fade-in slide-in-from-top-2">
        <button 
          onClick={() => setShowCustomerContextModal(true)}
          className="w-full flex items-center justify-between bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl p-3 shadow-sm transition-colors"
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            มีรายการที่ต้องจัดการ
          </div>
          <div className="bg-white text-rose-600 px-2 py-0.5 rounded-full text-xs font-black shadow-sm border border-rose-100">
            {totalPending} รายการ
          </div>
        </button>

        
      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setShowImageModal(null)}>
            <div className="relative max-w-3xl max-h-[90vh] w-full flex flex-col items-center">
                <button onClick={() => setShowImageModal(null)} className="absolute -top-12 right-0 text-white hover:text-pink-300 transition-colors p-2 bg-black/50 rounded-full">
                   <X size={24}/>
                </button>
                <img src={showImageModal} className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" alt="Slip" onClick={(e) => e.stopPropagation()} />
                <a href={showImageModal} target="_blank" rel="noreferrer" className="mt-4 px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-full font-bold shadow-lg transition-colors inline-flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                   เปิดในแท็บใหม่
                </a>
            </div>
        </div>
      )}

        {showCustomerContextModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setShowCustomerContextModal(false)}>
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="bg-rose-100 p-2 rounded-xl text-rose-600">
                    <ShoppingCart size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-base">รายการที่ต้องจัดการ</h3>
                    <p className="text-[11px] text-slate-500 font-medium">คิวจองและออเดอร์ของลูกค้ารายนี้</p>
                  </div>
                </div>
                <button onClick={() => setShowCustomerContextModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors">
                  <X size={16} />
                </button>
              </div>
              
              <div className="p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                {custBookings.length > 0 && (
                  <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-3">
                    <h4 className="text-xs font-bold text-blue-700 mb-2.5 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      คิวจองที่รอรับบริการ ({custBookings.length})
                    </h4>
                    <div className="flex flex-col gap-2">
                      {custBookings.map(b => {
                        const originalSt = b.status;
                        const st = originalSt === 'รอเข้ารับบริการ' ? 'รอการยืนยัน' : originalSt;
                        const isReady = ['ยืนยันแล้ว', 'รอคิว'].includes(st);
                        const theme = isReady 
                            ? { border: 'border-blue-200 shadow-blue-100/50', bar: 'bg-blue-400', badge: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-600', btn: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' }
                            : (st === 'รอยืนยัน' || st === 'รอการยืนยัน') 
                                ? { border: 'border-amber-200 shadow-amber-100/50', bar: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-600', btn: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' }
                                : { border: 'border-gray-200', bar: 'bg-gray-300', badge: 'bg-gray-50 text-gray-500 border-gray-200', text: 'text-gray-600', btn: 'bg-gray-500 hover:bg-gray-600 shadow-gray-200' };
                                
                        return (
                        <div key={b.id} className={`bg-white rounded-2xl border ${theme.border} shadow-sm overflow-hidden flex flex-col relative`}>
                          <div className="flex relative">
                            <div className={`w-2.5 ${theme.bar}`}></div>
                            <div className="p-3.5 flex-1">
                              <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${theme.badge}`}>{st}</span>
                                <span className="font-mono text-[10px] text-gray-400 font-bold">{b.ticketNo || b.id.slice(-6).toUpperCase()}</span>
                              </div>
                              <h4 className={`font-black text-[13px] mb-2 leading-tight ${theme.text}`}>{b.courseName || b.service || 'จองคิว'}</h4>
                              <div className="flex justify-between items-end">
                                <div className="grid grid-cols-2 gap-3 text-xs items-end">
                                    <div className="pb-0.5"><p className="text-gray-400 font-bold text-[9px] uppercase">วันที่</p><p className="font-bold text-gray-800">{b.date}</p></div>
                                    <div><p className="text-gray-400 font-bold text-[9px] uppercase mb-0.5">เวลา</p><p className={`text-lg sm:text-xl font-black tracking-tight leading-none ${theme.text.split(' ')[0]}`}>{b.time}</p></div>
                                </div>
                                <div className="shrink-0 ml-2">
                                    {isReady ? (
                                      <div className="flex gap-1">
                                        <button 
                                          onClick={(e) => { 
                                            e.stopPropagation(); 
                                            setPrintingJobSlipBooking(b);
                                          }}
                                          className={`text-white p-1.5 rounded-lg font-bold transition-all shadow-sm hover:shadow-md ${theme.btn}`}
                                          title="พิมพ์ใบงาน"
                                        >
                                          <Printer size={14} />
                                        </button>
                                        <button 
                                          onClick={(e) => { 
                                            e.stopPropagation(); 
                                            setPendingCheckInBooking(b);
                                            setShowCustomerContextModal(false);
                                          }}
                                          className={`text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-sm hover:shadow-md ${theme.btn}`}
                                        >
                                          เช็คอิน
                                        </button>
                                      </div>
                            ) : (
                              <button 
                                onClick={async (e) => { 
                                  e.stopPropagation(); 
                                  try {
                                    await updateDoc(doc(getCol('bookings'), b.id), { status: 'ยืนยันแล้ว' });
                                  } catch (error) {
                                    alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
                                  }
                                }}
                                className={`text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-sm hover:shadow-md ${theme.btn}`}
                              >
                                ยืนยันคิว
                              </button>
                            )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )})}
                    </div>
                  </div>
                )}
                
                {custOrders.length > 0 && (
                  <div className="bg-pink-50/50 border border-pink-100 rounded-2xl p-3">
                    <div className="flex justify-between items-center mb-2.5">
                      <h4 className="text-xs font-bold text-pink-700 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div>
                        ออเดอร์รอตรวจสอบ/ชำระ ({custOrders.length})
                      </h4>
                      {custOrders.length > 1 && (
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleProcessCustomerAppOrder(custOrders); 
                          }}
                          className="bg-pink-600 text-white px-2 py-1 rounded-md text-[10px] font-bold hover:bg-pink-700 transition-all shadow-sm"
                        >
                          + เพิ่มชำระทั้งหมด
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {custOrders.map(o => (
                        <div key={o.id} className="bg-white rounded-xl p-3 flex flex-col gap-2 shadow-sm border border-pink-50/80">
                          <div className="flex justify-between items-start gap-3">
                            <div className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">{o.itemName || o.courseName || 'รายการสั่งซื้อ'}</div>
                            <span className="text-[11px] font-black text-rose-600 shrink-0 bg-rose-50 px-2 py-0.5 rounded-md">฿{(Number(o.itemPrice || o.price) || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-end mt-1 pt-2 border-t border-slate-50 gap-2">
                            <span className="text-[9px] text-pink-600 bg-pink-100/80 px-2 py-1 rounded-md font-bold line-clamp-1">{o.status}</span>
                            <div className="flex gap-2 shrink-0">
                              {(o.status === 'รอตรวจสอบยอดโอน (รับคอร์สแล้ว)' || o.slipImage || o.paymentSlip || o.slipUrl || o.customOrderImage) && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const slipUrl = o.slipImage || o.paymentSlip || o.slipUrl || o.customOrderImage;
                                    if (slipUrl) {
                                        setShowImageModal(slipUrl);
                                    } else {
                                        showToast('ไม่พบรูปสลิปหรือรูปถูกลบไปแล้ว กรุณาตรวจสอบที่หน้า "คำสั่งซื้อ"', 'error');
                                    }
                                  }}
                                  className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-slate-200 transition-colors"
                                >
                                  ตรวจสลิป
                                </button>
                              )}
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  handleProcessCustomerAppOrder(o); 
                                }}
                                className="bg-pink-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-pink-700 transition-all shadow-sm shadow-pink-200 hover:shadow-md flex items-center gap-1.5"
                              >
                                <ShoppingCart size={11}/> นำเข้าตะกร้า
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                 <button onClick={() => setShowCustomerContextModal(false)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm">
                   ปิดหน้าต่าง
                 </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
    <div ref={posRef} className={`flex flex-col lg:flex-row overflow-hidden bg-slate-50 ${receiptData ? 'print:hidden' : ''} ${isFullscreen ? 'm-0 p-0 w-full h-[calc(100vh-68px)] lg:h-screen' : 'h-[100dvh] lg:h-[calc(100vh-80px)] -m-4 sm:-m-6 lg:-m-8'}`}>
      
      {/* Left: Inventory */}
      <div className="flex-1 flex flex-col h-full border-r border-slate-200">
        <div className="p-4 bg-white border-b border-slate-200">
          
          <button onClick={() => setIsBedModalOpen(true)} className="w-full mb-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg border border-indigo-200 shadow-sm flex items-center justify-center gap-2 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>
            ดูสถานะเตียงทรีตเมนต์ (Bed Management)
          </button>

          {/* Clocked in Employees Header */}
          <div className="mb-4 flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              {onGoBack && (
                <button 
                  onClick={onGoBack} 
                  className="flex items-center gap-1 px-3 py-1.5 mr-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-indigo-600 active:scale-95 transition-all border border-slate-200 shadow-sm shrink-0"
                  title="กลับหน้าลงเวลา / สลับพนักงาน"
                >
                  <ChevronLeft size={18} strokeWidth={3} />
                  <span className="text-[10px] font-bold hidden sm:inline">สลับพนักงาน</span>
                </button>
              )}
              {clockedInEmployees.length > 0 ? (
                <div className="flex -space-x-2">
                  {clockedInEmployees.slice(0, 3).map((emp, idx) => (
                    emp.profileImage ? (
                      <img key={emp.id} src={emp.profileImage} className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm relative bg-white" style={{ zIndex: 3 - idx }} alt={emp.name} onError={(e) => { e.target.onerror = null; e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'; }} />
                    ) : (
                      <div key={emp.id} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 text-slate-400 flex items-center justify-center shadow-sm relative" style={{ zIndex: 3 - idx }}>
                        <User size={14} />
                      </div>
                    )
                  ))}
                  {clockedInEmployees.length > 3 && (
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold shadow-sm relative z-0">
                      +{clockedInEmployees.length - 3}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shadow-inner border border-indigo-200">
                  <User size={16} />
                </div>
              )}
              <div>
                <h1 className="text-sm sm:text-base font-black text-slate-800 tracking-tight">
                  {globalRole === 'owner' ? '👑 เจ้าของร้าน' : clockedInEmployees.length > 0 ? `พนักงานเข้างาน ${clockedInEmployees.length} คน` : '👨‍💼 พนักงานระบบ'}
                </h1>
                <p className="text-[10px] text-slate-500 leading-tight">
                  {globalBranch ? `สาขา ${globalBranch}` : 'ไม่ได้เลือกสาขา'}
                  {onChangeBranch && (
                    <button 
                      onClick={onChangeBranch}
                      className="ml-2 text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded hover:bg-indigo-100 border border-indigo-100 transition-colors font-bold"
                    >
                      เปลี่ยนสาขา
                    </button>
                  )}
                  <button 
                    onClick={() => {
                       if(window.confirm('ต้องการออกจากระบบใช่หรือไม่?')) {
                          localStorage.removeItem('selectedBranch'); 
                          localStorage.removeItem('userRole'); 
                          localStorage.removeItem('admin_session_exp'); 
                          localStorage.removeItem('personalEmployeeId'); 
                          window.location.reload();
                       }
                    }}
                    className="ml-2 text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded hover:bg-red-100 border border-red-100 transition-colors font-bold"
                  >
                    ออกจากระบบ
                  </button>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeTab === 'products' && (
                <button
                  onClick={() => setIsModeMenuOpen(!isModeMenuOpen)}
                  className={`w-10 h-10 lg:w-12 lg:h-12 flex-shrink-0 rounded-xl flex items-center justify-center transition-all ${isModeMenuOpen || isStockMode || isRequisitionMode ? 'bg-indigo-500 text-white shadow-md' : 'bg-white border border-indigo-100 text-indigo-600 shadow-sm'}`}
                  title="เปิดโหมดจัดการสินค้า"
                >
                  <Package size={20} />
                </button>
              )}
              {!(isModeMenuOpen || isStockMode || isRequisitionMode) && (
                <>
                  <button
                    onClick={() => setShowWebOrdersModal(true)}
                    className="w-10 h-10 lg:w-12 lg:h-12 flex-shrink-0 rounded-xl flex items-center justify-center transition-all bg-sky-500 text-white shadow-md relative hover:bg-sky-600"
                    title="ออเดอร์จากเว็บ (WooCommerce)"
                  >
                    <Truck size={20} />
                    {webOrders.length > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{webOrders.length}</span>
                    )}
                  </button>
                  <button
                    onClick={() => setShowShopeeModal(true)}
                    className="w-10 h-10 lg:w-12 lg:h-12 flex-shrink-0 rounded-xl flex items-center justify-center transition-all bg-orange-500 text-white shadow-md relative hover:bg-orange-600"
                    title="นำเข้าออเดอร์ Shopee"
                  >
                    <span className="font-black text-lg leading-none">S</span>
                  </button>
                  <button
                    onClick={() => setShowSalesHistory(true)}
                    className="w-10 h-10 lg:w-12 lg:h-12 flex-shrink-0 rounded-xl flex items-center justify-center transition-all bg-indigo-500 text-white shadow-md relative hover:bg-indigo-600"
                    title="ประวัติการขาย"
                  >
                    <FileText size={20} />
                  </button>
                  <button
                    onClick={toggleFullscreen}
                    className="hidden lg:flex w-10 h-10 lg:w-12 lg:h-12 flex-shrink-0 rounded-xl items-center justify-center transition-all bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 shadow-sm"
                    title={isFullscreen ? "ย่อหน้าจอ" : "ขยายเต็มจอ"}
                  >
                    {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                  </button>
                </>
              )}
            </div>
          </div>

        {/* Mobile Customer Selection */}
        <div className="block lg:hidden mb-2 relative z-50">
           {selectedCustomer ? (
              <>
              <div className="flex items-center justify-between bg-indigo-50 p-3 rounded-xl border border-indigo-200 shadow-sm">
                 <div className="flex items-start gap-3 w-full">
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-white flex items-center justify-center border border-indigo-100">
                      {(() => {
                        const picData = getProfilePicData(selectedCustomer, customers);
                        if (picData && picData.primary) {
                          return (
                            <img 
                              src={picData.primary} 
                              onError={(e) => handleProfileImgError(e, picData.fallback)}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          );
                        }
                        return <User size={16} className="text-indigo-500" />;
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                       <div className="font-bold text-slate-800 text-sm flex items-center gap-2 truncate">
                           {selectedCustomer.computedName || String(getFuzzyKey(selectedCustomer, ["ชื่อ", "col_1"]))}
                           {isVipCustomer && <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-yellow-200">VIP</span>}
                           {(selectedCustomer.isApproved || vipStats.isVip) && (
                             <button 
                               onClick={() => onOpenVipForm(selectedCustomer)}
                               className="bg-orange-500 hover:bg-orange-600 transition-colors text-white px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 active:scale-95 shadow-sm"
                               title="ดู/สร้างใบสมัคร VIP"
                             >
                               <Award size={10} /> ใบสมัคร VIP
                             </button>
                           )}
                           {onViewCustomerProfile && (
                              <button 
                                onClick={() => {
                                  onViewCustomerProfile(selectedCustomer);
                                }}
                                className="ml-auto text-[10px] bg-white hover:bg-indigo-100 text-indigo-600 px-2 py-1 rounded-lg transition-colors flex items-center gap-1 font-bold border border-indigo-100 shrink-0"
                              >
                                <User size={10} />
                                ดูประวัติ
                              </button>
                           )}
                       </div>
                       <div className="text-xs text-slate-500 mb-1">{selectedCustomer.computedPhone || String(getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3"]))}</div>
                       <div className="text-[10px] text-slate-500 w-full mt-1">
                           <div className="flex justify-between mb-0.5">
                               <span>ยอดสะสม: ฿{vipStats.amount.toLocaleString()}</span>
                               {!isVipCustomer && <span>ขาด ฿{(5000 - vipStats.amount).toLocaleString()}</span>}
                           </div>
                           {!isVipCustomer && (
                               <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                   <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (vipStats.amount / 5000) * 100)}%` }}></div>
                               </div>
                           )}
                       </div>
                       <div className="flex gap-2 mt-1">
                          {customerPendingBalance > 0 && (
                             <div className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full inline-block">ค้างชำระ ฿{customerPendingBalance.toLocaleString()}</div>
                           )}
                           {customerCreditBalance > 0 && (
                             <div className="text-[10px] font-bold text-indigo-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full inline-block">เครดิต ฿{customerCreditBalance.toLocaleString()}</div>
                           )}
                       </div>
                    </div>
                 </div>
                 <button onClick={() => setSelectedCustomer(null)} className="p-2 text-slate-400 hover:text-red-500 bg-white rounded-full shadow-sm border border-indigo-100 self-start ml-2 shrink-0"><X size={16} /></button>
              </div>
              {renderCustomerContext()}
              </>
           ) : (
              <div className="flex gap-2">
                 <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="ค้นหาลูกค้า..." 
                      className="w-full pl-10 pr-4 py-2 h-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                      value={customerSearch}
                      onChange={(e) => { setCustomerSearch(e.target.value); setIsCustomerDropdownOpen(true); }}
                      onFocus={() => setIsCustomerDropdownOpen(true)}
                    />
                    <button 
                      onClick={() => setScannerTarget('customerSearch')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="สแกนคิวอาร์โค้ดลูกค้า"
                    >
                      <ScanLine size={18} />
                    </button>
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto z-50">
                      {isCustomerDropdownOpen && (
                        filteredCustomers.length > 0 ? filteredCustomers.map(c => {
                          const amt = c.realAccumulatedAmount !== undefined ? c.realAccumulatedAmount : getCustomerAccumulatedAmount(c);
                          const isVip = c.isApproved !== undefined ? c.isApproved : amt >= 5000;
                          return (
                          <div key={c.id} onClick={() => { 
                             setSelectedCustomer(c); 
                             setCustomerSearch(''); 
                             setIsCustomerDropdownOpen(false); 
                             const cPhone = String(c.computedPhone || getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '').trim();
                             const hasCourses = courses.some(course => String(getFuzzyKey(course, ["เบอร์โทร", "col_1"]) || '').trim() === cPhone && course.computedRemainQty > 0);
                             if (hasCourses) {
                               setActiveTab('my_courses');
                               showToast('พบคอร์สคงเหลือ สามารถคลิกตัดคอร์สได้ทันที!', 'success');
                             }
                          }} className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0 flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center border border-slate-200">
                               {(() => {
                                 const picData = getProfilePicData(c, customers);
                                 if (picData && picData.primary) {
                                   return <img src={picData.primary} onError={(e) => handleProfileImgError(e, picData.fallback)} alt="Profile" className="w-full h-full object-cover" />;
                                 }
                                 return <User size={16} className="text-slate-400" />;
                               })()}
                             </div>
                             <div className="flex-1 min-w-0">
                                 <div className="font-bold text-slate-800 text-sm flex items-center gap-2 truncate">
                                     {c.computedName || String(getFuzzyKey(c, ["ชื่อ", "col_1"]))}
                                     {isVip && <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-yellow-200">VIP</span>}
                                     {(c.isApproved || amt >= 5000) && (
                                       <button 
                                         onClick={(e) => { e.stopPropagation(); onOpenVipForm(c); setCustomerSearch(''); setIsCustomerDropdownOpen(false); }}
                                         className="bg-orange-500 hover:bg-orange-600 transition-colors text-white px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 active:scale-95 shadow-sm ml-auto"
                                         title="ดู/สร้างใบสมัคร VIP"
                                       >
                                         <Award size={10} /> ใบสมัคร VIP
                                       </button>
                                     )}
                                 </div>
                                 <div className="text-xs text-slate-500 mb-1">{c.computedPhone || String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]))}</div>
                                 <div className="text-[10px] text-slate-500 w-full mt-1">
                                     <div className="flex justify-between mb-0.5">
                                         <span>ยอดสะสม: ฿{amt.toLocaleString()}</span>
                                         {!isVip && <span>ขาด ฿{(5000 - amt).toLocaleString()}</span>}
                                     </div>
                                     {!isVip && (
                                         <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                             <div className="bg-yellow-400 h-1.5 rounded-full" style={{ width: `${Math.min(100, (amt / 5000) * 100)}%` }}></div>
                                         </div>
                                     )}
                                 </div>
                             </div>
                          </div>
                        )}) : <div className="px-4 py-3 text-center text-slate-500 text-sm">ไม่พบลูกค้า</div>
                      )}
                    </div>
              </div>
              {onAddCustomer && (
                   <button 
                     onClick={onAddCustomer}
                     className="px-3 bg-indigo-100 hover:bg-indigo-200 text-indigo-600 rounded-xl font-bold flex items-center justify-center transition-colors shadow-sm"
                     title="เพิ่มลูกค้าใหม่"
                   >
                     <Plus size={18} />
                   </button>
                 )}
              </div>
           )}
        </div>

          
          
          {!(isModeMenuOpen || isStockMode || isRequisitionMode) && (
            <div className="flex gap-2 sm:gap-4 mb-2">
              <button 
                onClick={() => setActiveTab('products')}
                className={`flex-1 py-2 px-2 sm:px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'products' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                title="สินค้าทั่วไป"
              >
                <CosmeticsIcon size={24} />
              </button>
              <button 
                onClick={() => setActiveTab('courses')}
                className={`flex-1 py-2 px-2 sm:px-4 rounded-xl font-medium transition-colors flex flex-col items-center justify-center gap-1 relative ${activeTab === 'courses' ? 'bg-pink-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                title="คอร์ส / รายครั้ง"
              >
                <div className="flex items-center gap-1">
                  <Layers size={20} />
                  <span className="text-[10px] font-bold">คอร์ส/รายครั้ง</span>
                </div>
              </button>
              <button 
                onClick={() => setActiveTab('services')}
                className={`flex-1 py-2 px-2 sm:px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'services' ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                title="บริการอื่นๆ"
              >
                <Scissors size={24} />
              </button>
              {selectedCustomer && (
                <button 
                  onClick={() => setActiveTab('my_courses')}
                  className={`flex-1 py-2 px-2 sm:px-4 rounded-xl font-medium transition-colors flex flex-col items-center justify-center gap-1 relative ${activeTab === 'my_courses' ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  title="คอร์สของฉัน"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle size={24} />
                  </div>
                  {customerPendingBalance > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white shadow-sm animate-bounce">
                      ค้างชำระ!
                    </span>
                  )}
                </button>
              )}
            </div>
          )}
          <div className="block lg:hidden mb-2 flex items-center gap-2">
            <div className="flex-1 relative flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder={`ค้นหา${activeTab === 'products' ? 'สินค้า' : 'คอร์ส'}...`}
                  className="w-full pl-10 pr-4 py-2 h-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchEnter}
                />
              </div>
              <button 
                onClick={() => setScannerTarget('productSearch')}
                className="bg-indigo-100 text-indigo-600 w-10 h-10 rounded-xl hover:bg-indigo-200 transition-colors shrink-0 shadow-sm flex items-center justify-center"
                title="แสกนบาร์โค้ด"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
              </button>
            </div>
            <button
              onClick={() => setIsMobileCartOpen(true)}
              className="w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center transition-all bg-indigo-600 text-white shadow-md shadow-indigo-200 relative lg:hidden"
            >
              <ShoppingCart size={18} />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{cart.length}</span>
              )}
            </button>
          </div>

          <div className="relative flex overflow-x-auto pb-2 -mb-2 gap-2 w-full lg:w-auto scrollbar-hide">
          {activeTab === 'products' && (isModeMenuOpen || isStockMode || isRequisitionMode) && (
            <>
            <button
              onClick={() => { setIsStockMode(!isStockMode); setIsRequisitionMode(false); setIsModeMenuOpen(false); }}
              className={`flex whitespace-nowrap items-center gap-2 rounded-xl text-sm font-bold transition-all ${isStockMode ? 'px-4 py-2 bg-rose-500 text-white shadow-lg shadow-rose-200' : 'w-10 h-10 justify-center bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              title={globalRole === 'owner' ? 'โหมดเจ้าของร้านซื้อเข้า' : 'โหมดนับสต๊อก'}
            >
              <Package size={18} /> {isStockMode && (globalRole === 'owner' ? 'ปิดโหมดซื้อเข้า' : 'ปิดโหมดนับสต๊อก')}
            </button>
            <button
              onClick={() => { setIsRequisitionMode(!isRequisitionMode); setIsStockMode(false); setIsModeMenuOpen(false); }}
              className={`flex whitespace-nowrap items-center gap-2 rounded-xl text-sm font-bold transition-all ${isRequisitionMode ? 'px-4 py-2 bg-amber-500 text-white shadow-lg shadow-amber-200' : 'w-10 h-10 justify-center bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              title="โหมดเบิกสินค้าจากศูนย์ใหญ่"
            >
              <Truck size={18} /> {isRequisitionMode && 'ปิดโหมดเบิกสินค้า'}
            </button>
            <button
              onClick={async () => {
                if (!wooIdMap || wooIdMap.size === 0) {
                  showToast('ยังโหลดข้อมูลเว็บไม่เสร็จ กรุณารอสักครู่', 'error');
                  return;
                }
                // Build batch payload
                const batchItems = [];
                for (const p of products) {
                  const productCode = String(getFuzzyKey(p, ['รหัส', 'col_1']) || '');
                  const productName = String(getFuzzyKey(p, ['ชื่อสินค้า', 'col_2']) || '');
                  const wooId = productCode ? wooIdMap.get(productCode.trim().toUpperCase()) : null; // Match by SKU only (case-insensitive)
                  if (!wooId) continue;
                  batchItems.push({ id: wooId, manage_stock: true, stock_quantity: getTotalStock(p, branches) });
                }
                if (batchItems.length === 0) {
                  showToast('ไม่พบสินค้าที่ตรงกับเว็บ ตรวจสอบชื่อ/รหัสสินค้า', 'error');
                  return;
                }
                showToast(`กำลัง Sync ${batchItems.length} สินค้าขึ้นเว็บ (Batch)...`, 'success');
                // Send in chunks of 50 (WooCommerce batch limit)
                const CHUNK = 50;
                let ok = 0, fail = 0;
                for (let i = 0; i < batchItems.length; i += CHUNK) {
                  const chunk = batchItems.slice(i, i + CHUNK);
                  try {
                    const res = await fetchWithProxy(`https://irisnatures.com/wp-json/wc/v3/products/batch`, {
                      method: 'POST',
                      body: JSON.stringify({ update: chunk })
                    }, true);
                    ok += res.update?.length || chunk.length;
                  } catch (e) {
                    fail += chunk.length;
                  }
                }
                showToast(`Sync สต๊อกเสร็จ: ✅ ${ok} สำเร็จ${fail > 0 ? ` ❌ ${fail} ล้มเหลว` : ''}`, 'success');
              }}
              className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all bg-teal-500 text-white shadow-lg shadow-teal-200 hover:bg-teal-600"
            >
              <Truck size={18} /> Sync สต๊อกขึ้นเว็บ
            </button>
            <button
              onClick={async () => {
                setIsLoadingCompare(true);
                setShowStockCompare(true);
                setStockCompareData([]);
                try {
                  let allWoo = [];
                  let page = 1;
                  while (true) {
                    const data = await fetchWithProxy(`https://irisnatures.com/wp-json/wc/v3/products?status=publish&per_page=100&page=${page}`);
                    if (!Array.isArray(data) || data.length === 0) break;
                    allWoo = allWoo.concat(data);
                    if (data.length < 100) break;
                    page++;
                  }
                  const wooSkuMap = new Map();
                  allWoo.forEach(w => { if (w.sku) wooSkuMap.set(w.sku.trim().toUpperCase(), w); });

                  const rows = [];
                  for (const p of products) {
                    const sku = String(getFuzzyKey(p, ['รหัส', 'col_1']) || '').trim().toUpperCase();
                    const name = String(getFuzzyKey(p, ['ชื่อสินค้า', 'col_2']) || '');
                    const posStock = getTotalStock(p, branches);
                    const woo = sku ? wooSkuMap.get(sku) : null;
                    const wooStock = woo ? (woo.manage_stock ? (woo.stock_quantity ?? 0) : null) : undefined;
                    rows.push({ sku, name, posStock, wooName: woo?.name || '-', wooStock, matched: !!woo });
                  }
                  setStockCompareData(rows);
                } catch(e) {
                  showToast('\u0e42\u0e2b\u0e25\u0e14\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e44\u0e21\u0e48\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08', 'error');
                } finally {
                  setIsLoadingCompare(false);
                }
              }}
              className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-all bg-violet-500 text-white shadow-lg shadow-violet-200 hover:bg-violet-600 text-sm"
            >
              \u0e40\u0e1b\u0e23\u0e35\u0e22\u0e1a\u0e2a\u0e15\u0e4a\u0e2d\u0e01 POS vs \u0e40\u0e27\u0e47\u0e1a
            </button>
            </>
          )}
            <div className="hidden lg:flex flex-1 relative items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text"
                  placeholder={`ค้นหา${activeTab === 'products' ? 'สินค้า' : 'คอร์ส'}...`}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchEnter}
                />
              </div>
              <button 
                onClick={() => setScannerTarget('productSearch')}
                className="bg-indigo-100 text-indigo-600 p-3 rounded-xl hover:bg-indigo-200 transition-colors shrink-0 shadow-sm"
                title="แสกนบาร์โค้ด"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
              </button>
            </div>
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto p-2 sm:p-4 bg-slate-50/50 ${isStockMode ? 'pb-36' : 'pb-28'}`}>
                    {isStockMode && globalRole === 'owner' && (
            <div className="mb-6 p-4 sm:p-6 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-teal-500/10 border border-teal-100 rounded-3xl shadow-sm">
              <h3 className="text-sm font-bold text-teal-700 mb-2">เจ้าของร้านซื้อเข้า (Owner Purchase)</h3>
              <div className="text-xs text-teal-600 font-medium space-y-1">
                <p>• ราคาทุนคิดจากราคาสมาชิก - ส่วนลดเจ้าของร้าน</p>
                <p>• ราคาสมาชิกมาจากคอลัมน์ "ราคาสมาชิก"</p>
                <p>• ถ้าราคาสมาชิกไม่มีค่า จะใช้ราคาปลีกเต็ม</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-4 md:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
            {activeTab === 'products' ? (
              filteredProducts.map(p => {
                const productName = String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2"]) || '');
                const productCode = String(getFuzzyKey(p, ["รหัส", "col_1"]) || '');
                
                const fullPrice = parseNumber(getFuzzyKey(p, ["ราคาขายเต็ม", "col_6"]));
                const displayPrice = computeFinalPrice(p, isVipCustomer);
                
                let imgFilename = null;
                // 1. Prioritize WooCommerce API images
                const wooImg = (productCode ? wooImagesMap.get(productCode.trim().toUpperCase()) : null) || wooImagesMap.get(productName.toLowerCase());
                if (wooImg) {
                  imgFilename = wooImg;
                } else {
                  // 2. Fallback to Firestore explicitly named fields
                  imgFilename = p["รูปสินค้า"] || p["image"] || p["imageUrl"] || p["รูปภาพ"] || p["img"];
                }
                if (!imgFilename) {
                  for (const key of Object.keys(p)) {
                    const val = String(p[key] || '').trim();
                    if (val.match(/\.(jpeg|jpg|gif|png|webp)$/i) || val.includes('.รูปสินค้า.')) {
                      imgFilename = val;
                      break;
                    }
                  }
                }
                if (!imgFilename) {
                    imgFilename = String(getFuzzyKey(p, ["รูปสินค้า", "image", "imageUrl", "รูปภาพ", "img"]) || '');
                }
                let imageUrl = null;
                if (imgFilename && imgFilename !== 'undefined') {
                  if (imgFilename.startsWith('http')) {
                    imageUrl = imgFilename;
                  } else {
                    let finalFilename = imgFilename.replace(/^\/+/, '');
                    try { finalFilename = decodeURIComponent(finalFilename); } catch(e) {}
                    imageUrl = `https://crm.irisnatures.com/สินค้า_Images/${encodeURI(finalFilename)}`;
                  }
                } else if (productName) {
                  imageUrl = `https://crm.irisnatures.com/สินค้า_Images/${encodeURIComponent(productName)}.jpg`;
                }

                const isOwnerPurchase = isStockMode && globalRole === 'owner';
                const isBranchReq = isRequisitionMode && globalRole !== 'owner';
                const isSpecialMode = isOwnerPurchase || isBranchReq;
                
                const costPrice = isSpecialMode ? computeOwnerCostPrice(p) : 0;
                const discountRate = isSpecialMode ? getOwnerDiscountRate(p) : 0;
                const memberPrice = parseNumber(getFuzzyKey(p, ["ราคาสมาชิก", "col_10"]));
                const originalCostBasePrice = memberPrice > 0 ? memberPrice : fullPrice;

                return (
                <div 
                  key={p.id} 
                  onClick={() => isOwnerPurchase ? addToCart(p, 'product', 'owner_purchase') : isBranchReq ? addToCart(p, 'product', 'branch_requisition') : isStockMode ? setStockInputModal({ isOpen: true, item: p, inputVal: '' }) : addToCart(p, 'product')}
                  className={`bg-white p-2 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border cursor-pointer transition-all flex flex-col h-full ${isSpecialMode ? "border-slate-100 hover:shadow-md hover:border-teal-200 active:scale-95" : isStockMode ? (stockAdjustments.some(a => a.id === p.id) ? "border-emerald-500 opacity-70" : "border-rose-400 animate-pulse shadow-[0_0_15px_rgba(251,113,133,0.3)]") : "border-slate-100 hover:shadow-md hover:border-indigo-200 active:scale-95"}`}
                >
                  <div className="w-full aspect-[4/3] bg-slate-100 rounded-lg sm:rounded-xl mb-2 sm:mb-3 overflow-hidden relative group flex items-center justify-center">
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={productName}
                        className="absolute inset-0 w-full h-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-110"
                        loading="lazy"
                        onError={(e) => { 
                          e.target.onerror = null; 
                          e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>';
                          e.target.className = "w-1/2 h-1/2 object-contain m-auto mt-4 opacity-50 transition-transform duration-300 group-hover:scale-110";
                        }}
                      />
                    ) : (
                      <Package size={40} className="text-slate-300" strokeWidth={1.5} />
                    )}
                    {!isSpecialMode && isStockMode && stockAdjustments.some(a => a.id === p.id) && (
                      <div className="absolute inset-0 bg-emerald-500/20 z-10 flex items-center justify-center backdrop-blur-[1px]">
                        <CheckCircle size={40} className="text-emerald-600 bg-white rounded-full drop-shadow-md" />
                      </div>
                    )}
                  </div>
                  
                  {/* <div className="text-[10px] sm:text-xs font-medium text-slate-400 mb-1 truncate">{productCode}</div> */}
                  <div className="font-semibold text-slate-800 flex-1 line-clamp-2 text-xs sm:text-base leading-snug">{productName}</div>
                  <div className="mt-2 sm:mt-3 flex items-center justify-between w-full gap-2">
                    {isSpecialMode ? (
                      <div className={`${isOwnerPurchase ? 'text-teal-600' : 'text-amber-600'} font-bold text-[10px] sm:text-xs flex flex-col gap-0.5`}>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-slate-400 font-normal">ปกติ:</span>
                          <del className="text-slate-400 text-[9px] sm:text-[10px] font-normal">฿{originalCostBasePrice.toLocaleString()}</del>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                          <span>฿{costPrice.toLocaleString()}</span>
                          <span className={`${isOwnerPurchase ? 'bg-teal-50 text-teal-700 border-teal-100' : 'bg-amber-50 text-amber-700 border-amber-100'} text-[8px] font-bold px-1 py-0.5 rounded border leading-none`}>ลด {Math.round(discountRate * 100)}%</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-indigo-600 font-bold text-sm sm:text-lg flex items-center gap-1 shrink-0">
                        {displayPrice < fullPrice && (
                          <del className="text-gray-400 text-[10px] sm:text-xs">฿{fullPrice.toLocaleString()}</del>
                        )}
                        ฿{displayPrice.toLocaleString()}
                      </div>
                    )}
                    
                    <div className="flex items-center shrink-0">
                      {(() => {
                           const currentBranch = globalBranch || "สำนักงานใหญ่";
                           const v = getBranchStock(p, currentBranch);
                           const vNum = Number(v);
                           return (
                             <div className={`flex items-center justify-center min-w-[32px] sm:min-w-[36px] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-black shadow-sm ${vNum <= 0 ? 'bg-rose-500 text-white shadow-rose-200' : 'bg-emerald-500 text-white shadow-emerald-200'}`} title={`สต๊อกคงเหลือสาขา ${currentBranch}`}>
                                {parseQty(v)}
                             </div>
                           );
                      })()}
                    </div>
                  </div>
                </div>
                );
              })
            ) : activeTab === 'courses' ? (
              <div className="col-span-full mb-4">
                <div className="flex gap-2 p-1 bg-slate-100/80 backdrop-blur rounded-xl border border-slate-200/60 mb-4 flex-wrap w-full">
                   {COURSE_TABS.map(tab => (
                     <button 
                        key={`m_${tab.id}`}
                        onClick={() => setMultiCourseTab(tab.id)}
                        className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[11px] sm:text-sm font-bold transition-all whitespace-nowrap ${multiCourseTab === tab.id ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200/50'}`}
                     >{tab.label}</button>
                   ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {filteredCourses
                    .filter(c => {
                      const category = getCourseCategory(c);
                      if (multiCourseTab === 'all') return category !== 'old_courses';
                      return category === multiCourseTab;
                    })
                    .sort((a, b) => String(getFuzzyKey(a, ["รหัสคอส", "col_1"])).localeCompare(String(getFuzzyKey(b, ["รหัสคอส", "col_1"]))))
                    .map(c => {
                      const code = String(getFuzzyKey(c, ["รหัสคอส", "col_1"]));
                      let letter = code.replace('F-', '').replace(/\d+/g, '');
                      if (letter.length > 3) letter = letter.substring(0, 3);
                      
                      const credit = Number(getFuzzyKey(c, ["เครดิตที่ได้รับ", "เครดิต", "col_8"]) || 0);
                      const subItems = String(getFuzzyKey(c, ["รายการที่ได้รับ", "col_11"]) || '').trim();
                      const courseName = String(getFuzzyKey(c, ["ชื่อคอส", "col_4"]));
                      
                      let sessionCount = null;
                      const match = courseName.match(/\(?(\d+)\s*ครั้ง\)?/);
                      if (match) {
                        sessionCount = parseInt(match[1]);
                      } else if (courseName.includes('รายครั้ง')) {
                        sessionCount = 1;
                      }
                      
                      const isSingle = sessionCount === 1;
                      
                      let duration = getFuzzyKey(c, ["กำหนดเวลา", "อายุคอส", "กำหนดเวลา (เดือน)"]);
                      if (!duration || String(duration).trim() === '-' || String(duration).trim() === '') {
                          const lowerName = courseName.toLowerCase();
                          if (lowerName.includes('set a') || lowerName.includes('set.a')) duration = 'อายุ 3 เดือน';
                          else if (lowerName.includes('set b') || lowerName.includes('set.b')) duration = 'อายุ 6 เดือน';
                          else if (lowerName.includes('set c') || lowerName.includes('set.c')) duration = 'อายุ 1 ปี';
                          else duration = getCourseCategory(c) === 'old_courses' ? 'คอร์สเก่า' : (getCourseCategory(c) === 'acne_sets' ? 'อายุ 1 ปี' : 'อายุ 3 เดือน');
                      }
                      
                      const cardStyle = isSingle 
                        ? "bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200 hover:border-indigo-300"
                        : "bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200 hover:border-pink-300";
                        
                      const priceStyle = isSingle ? "text-indigo-600" : "text-rose-600";
                      const watermarkStyle = isSingle ? "text-indigo-500/10" : "text-pink-500/10";
                      const infoStyle = isSingle ? "hover:bg-indigo-100 text-indigo-500" : "hover:bg-pink-100 text-pink-500";
                      const badgeStyle = isSingle ? "bg-indigo-100 text-indigo-700 border-indigo-200" : "bg-pink-100 text-pink-700 border-pink-200";

                      return (
                      <div 
                        key={c.id} 
                        onClick={() => addToCart(c, 'course')}
                        className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-all active:scale-95 flex flex-col h-full border relative overflow-hidden ${cardStyle}`}
                      >
                        <div className={`absolute -right-2 -bottom-4 text-[80px] font-black rotate-12 pointer-events-none select-none z-0 leading-none truncate w-24 text-center ${watermarkStyle}`}>{letter}</div>
                        <div className="font-semibold text-slate-800 flex-1 flex flex-col relative z-10">
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] text-slate-400 font-mono mb-0.5 opacity-70">{code}</span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setViewCourseDetails(c); }}
                              className={`p-1 rounded-full transition-colors ${infoStyle}`}
                            >
                              <Info size={14} />
                            </button>
                          </div>
                          <span className="line-clamp-2 text-xs sm:text-sm leading-snug">{courseName}</span>
                        </div>
                        
                        {subItems && (
                          <div className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-tight relative z-10 whitespace-pre-line">
                            {subItems.replace(/\\n/g, '\n')}
                          </div>
                        )}
                        
                        <div className="mt-2 sm:mt-3 flex flex-col gap-1.5 relative z-10">
                          <div className="flex items-end justify-between">
                            <div className={`font-bold text-sm sm:text-lg flex flex-col ${priceStyle}`}>
                              <span>฿{parseNumber(getFuzzyKey(c, ["ราคา", "ราคาขาย", "col_5"])).toLocaleString()}</span>
                              {credit > 0 && <span className="text-[10px] text-emerald-600 font-medium mt-0.5">ได้เครดิต {credit.toLocaleString()}</span>}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {sessionCount && (
                                <div className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-sm border ${badgeStyle}`}>
                                  {isSingle ? 'รายครั้ง' : `${sessionCount} ครั้ง`}
                                </div>
                              )}
                              {!isSingle && duration && String(duration).trim() !== '-' && (
                                <div className="text-[9px] sm:text-[10px] text-slate-600 font-bold bg-white/60 px-1.5 py-0.5 rounded-md shadow-sm border border-slate-200 backdrop-blur-sm">
                                  ⏳ {duration}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      )
                  })}
                </div>

                {groupedSingleCourses.filter(g => {
                      if (multiCourseTab === 'all') return g.category !== 'old_courses';
                      return g.category === multiCourseTab;
                    }).length > 0 && (
                   <div className="mt-6 mb-3 flex items-center gap-3 col-span-full">
                     <div className="h-[2px] bg-gradient-to-r from-transparent to-slate-200 flex-1"></div>
                     <span className="text-[11px] sm:text-xs font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest shadow-inner flex items-center gap-1"><CheckCircle size={12}/> แบบรายครั้ง (Single Course)</span>
                     <div className="h-[2px] bg-gradient-to-l from-transparent to-slate-200 flex-1"></div>
                   </div>
                )}
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 col-span-full mt-2">
                  {groupedSingleCourses
                    .filter(g => {
                      if (multiCourseTab === 'all') return g.category !== 'old_courses';
                      return g.category === multiCourseTab;
                    })
                    .sort((a, b) => a.primaryCode.localeCompare(b.primaryCode))
                    .map(g => {
                      const code = g.primaryCode;
                      let letter = code.replace('F-', '').replace(/\d+/g, '');
                      if (letter.length > 3) letter = letter.substring(0, 3);
                      
                      const primaryItem = g.items[0];
                      const subItems = String(getFuzzyKey(primaryItem, ["รายการที่ได้รับ", "col_11"]) || '').trim();
                      const hasPromo = g.items.some(c => String(getFuzzyKey(c, ["ชื่อคอส", "col_4", "ชื่อสินค้า", "col_2"]) || '').includes('ซื้อเพิ่มโปร'));

                      return (
                      <div 
                        key={code} 
                        className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col h-full relative overflow-hidden bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-200`}
                      >
                        <div className={`absolute -right-2 -bottom-4 text-[80px] font-black rotate-12 pointer-events-none select-none z-0 leading-none truncate w-24 text-center text-fuchsia-500/10`}>{letter}</div>
                        <div className="font-semibold text-slate-800 flex-1 flex flex-col relative z-10 mb-1">
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] text-slate-400 font-mono mb-0.5 opacity-70">{code}</span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setViewCourseDetails(primaryItem); }}
                              className="p-1 hover:bg-violet-100 rounded-full text-violet-500 transition-colors"
                            >
                              <Info size={14} />
                            </button>
                          </div>
                          <span className="line-clamp-2 text-xs sm:text-sm leading-snug">{g.baseName}</span>
                        </div>
                        
                        {subItems && (
                          <div className="text-[10px] text-slate-500 mb-2 line-clamp-2 leading-tight relative z-10 whitespace-pre-line">
                            {subItems.replace(/\\n/g, '\n')}
                          </div>
                        )}

                        <div className="mt-auto relative z-10 flex flex-col gap-1.5 w-full">
                           <div className="flex justify-end mb-1">
                              <span className="text-[9px] text-violet-600 font-bold bg-violet-100 px-1.5 py-0.5 rounded shadow-sm border border-violet-200">
                                
                                 {(() => {
                                   const lowerName = (g.baseName || '').toLowerCase();
                                   if (lowerName.includes('set a') || lowerName.includes('set.a')) return 'อายุ 3 เดือน';
                                   if (lowerName.includes('set b') || lowerName.includes('set.b')) return 'อายุ 6 เดือน';
                                   if (lowerName.includes('set c') || lowerName.includes('set.c')) return 'อายุ 1 ปี';
                                   return 'อายุ 7 วัน';
                                 })()}
                              </span>
                           </div>
                           {g.items.map(c => {
                              const nameStr = String(getFuzzyKey(c, ["ชื่อคอส", "col_4", "ชื่อสินค้า", "col_2"]) || '');
                              const isPromo = nameStr.includes('ซื้อเพิ่มโปร');
                              const price = parseNumber(getFuzzyKey(c, ["ราคา", "ราคาขาย", "col_5"]));
                              
                              return (
                                <div key={c.id} className="relative flex w-full">
                                  <button
                                    onClick={() => addToCart(c, 'single_course')}
                                    className={`w-full text-left flex justify-between items-center px-2 py-1.5 rounded-lg border text-xs sm:text-sm active:scale-95 transition-transform shadow-sm ${isPromo ? 'bg-gradient-to-r from-emerald-400 to-teal-500 border-teal-600 text-white hover:brightness-105' : 'bg-white border-violet-200 hover:bg-violet-50 text-violet-700'}`}
                                  >
                                     <span className="font-medium">{isPromo ? 'ซื้อเพิ่มโปร' : '1 ครั้ง'}</span>
                                     <span className="font-bold flex items-center gap-1 pr-6">฿{price.toLocaleString()}</span>
                                  </button>
                                  {globalRole === 'owner' && (
                                     <button 
                                        onClick={(e) => handleEditMasterCoursePrice(e, c)}
                                        className={`absolute right-1 top-1/2 -translate-y-1/2 p-1.5 flex items-center justify-center rounded-md opacity-60 hover:opacity-100 transition-opacity ${isPromo ? 'text-white hover:bg-teal-600/50' : 'text-violet-500 hover:bg-violet-100'}`}
                                        title="แก้ไขราคาคอร์ส"
                                     >
                                        <Edit size={14} />
                                     </button>
                                  )}
                                </div>
                              );
                           })}
                        </div>
                      </div>
                      )
                  })}

                  {/* Manual Walk-in Items */}
                  {(multiCourseTab === 'all' || multiCourseTab === 'walkin') && (
                      <div 
                        key="srv_mole_walkin"
                        onClick={() => setQuickPriceModalItem({ id: 'srv_mole_walkin', name: 'จี้ (วอคอิน)', price: 0, type: 'service' })}
                        className="p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-all active:scale-95 flex flex-col h-full bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-200 hover:border-violet-300 relative overflow-hidden"
                      >
                        <div className="absolute -right-2 -bottom-4 text-[80px] font-black text-fuchsia-500/10 rotate-12 pointer-events-none select-none z-0 leading-none truncate w-24 text-center">จี้</div>
                        <div className="font-semibold text-slate-800 flex-1 line-clamp-3 text-xs sm:text-sm leading-snug relative z-10">จี้ (วอคอิน)</div>
                        <div className="mt-2 sm:mt-3 flex items-end justify-between relative z-10">
                          <div className="font-bold text-sm sm:text-lg text-fuchsia-600">ระบุราคา</div>
                          <div className="text-[10px] text-violet-600 font-bold bg-violet-100 px-1.5 py-0.5 rounded-md shadow-sm border border-violet-200">ใช้ทันที</div>
                        </div>
                      </div>
                  )}
                </div>
              </div>
            ) : activeTab === 'services' ? (
              [{id: 'srv_mole', name: 'จี้ไฝ'}, {id: 'srv_consult', name: 'ประเมินราคา'}].map(srv => (
                <div key={srv.id} onClick={() => setQuickPriceModalItem({ id: srv.id, name: srv.name, price: 0, type: 'service' })} className="bg-white border border-slate-200 rounded-2xl p-4 cursor-pointer hover:border-orange-500 hover:shadow-md transition-all group flex flex-col h-full">
                  <div className="flex-1 flex flex-col items-center justify-center py-6 gap-3">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                      <Scissors size={32} />
                    </div>
                    <div className="font-bold text-slate-800 text-lg text-center">{srv.name}</div>
                    <div className="text-xs font-medium text-slate-400 text-center">คลิกเพื่อเพิ่มลงตะกร้า<br/>และระบุราคา</div>
                  </div>
                </div>
              ))
            ) : (
              <>
                {filteredPendingPayments.length > 0 && (
                  <div className="col-span-full mb-2 border border-red-100 bg-red-50 p-3 rounded-2xl">
                    <h3 className="font-bold text-red-600 flex items-center gap-2 mb-3">
                      <Banknote size={16} /> รายการมียอดค้างชำระ ({filteredPendingPayments.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                      {filteredPendingPayments.map(c => {
                         const pendingAmt = parseNumber(getFuzzyKey(c, ["ยอดค้างชำระ", "pending"]));
                         return (
                           <div 
                             key={`pending_${c.id}`} 
                             onClick={() => addToCart(c, 'debt_payment')}
                             className="bg-white p-3 rounded-xl shadow-sm border border-red-200 cursor-pointer transition-all active:scale-95 flex flex-col justify-between"
                           >
                             <div className="text-[10px] font-bold text-red-500 truncate mb-1">ค้าง: {String(getFuzzyKey(c, ["เลขที่ใบคอส", "col_2"]))}</div>
                             <div className="font-semibold text-slate-700 text-xs line-clamp-2">{String(getFuzzyKey(c, ["ชื่อคอส", "col_8"]))}</div>
                             <div className="mt-2 text-red-600 font-black text-sm">฿{pendingAmt.toLocaleString()}</div>
                           </div>
                         );
                      })}
                    </div>
                  </div>
                )}
                
                {filteredMyCourses.length > 0 && (
                  <div className="col-span-full mb-2">
                    <h3 className="font-bold text-teal-700 mb-2">รายการคอร์สที่เบิกใช้งานได้ ({filteredMyCourses.length})</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-3">
                      {filteredMyCourses.map(c => (
                        <div 
                          key={c.id} 
                          onClick={() => {
                            setSelectedCourseForUsage(c);
                          }}
                          className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md border border-teal-100 cursor-pointer transition-all active:scale-95 flex flex-row items-center relative overflow-hidden group"
                        >
                          <div className={`absolute top-0 left-0 w-1.5 h-full ${c.computedStatus === 'ยังคงเหลือ' ? 'bg-teal-400' : 'bg-gray-300'}`}></div>
                          
                          <div className="flex-1 pl-2 pr-3 min-w-0 flex flex-col justify-center">
                            <div className="mb-1.5 flex flex-col items-start gap-0.5">
                               {getFuzzyKey(c, ["รหัสคอส", "col_1"]) && (
                                   <span className="bg-teal-50 text-teal-600 border border-teal-100 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase inline-block">
                                       {String(getFuzzyKey(c, ["รหัสคอส", "col_1"]))}
                                   </span>
                               )}
                               <p className="font-bold text-teal-700 text-sm sm:text-base line-clamp-2 leading-tight" title={String(getFuzzyKey(c, ["ชื่อคอส", "col_8"]) || '-')}>
                                   {String(getFuzzyKey(c, ["ชื่อคอส", "col_8"]) || '-')}
                               </p>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(String(getFuzzyKey(c, ["ผู้ซื้อคอส", "col_9"]) || selectedCustomer?.computedName || '-'))}&background=f1f5f9&color=64748b&bold=true`} className="w-5 h-5 rounded-full shrink-0" />
                                <span className="text-xs text-gray-600 font-medium truncate">{String(getFuzzyKey(c, ["ผู้ซื้อคอส", "col_9"]) || selectedCustomer?.computedName || '-')}</span>
                                <span className="text-[10px] text-gray-400 font-mono hidden sm:inline">{String(getFuzzyKey(c, ["เบอร์โทร", "col_1"]) || selectedCustomer?.computedPhone || '-')}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                <span className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                  <Calendar size={10}/> ซื้อ: {String(getFuzzyKey(c, ["วันที่ซื้อ", "col_3"]) || '-')}
                                </span>
                                {c.computedExpireDate && c.computedExpireDate !== '-' && (
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${c.daysLeft !== null && c.daysLeft < 0 ? 'text-rose-600 bg-rose-50 border border-rose-100' : c.isExpiringSoon ? 'text-amber-600 bg-amber-50 border border-amber-100' : 'text-gray-500 bg-gray-50 border border-gray-100'}`}>
                                    <Clock size={10}/> หมดอายุ: {c.computedExpireDate}
                                  </span>
                                )}
                                {c.computedDurationMonths && (
                                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md">
                                    อายุ {c.computedDurationMonths} เดือน
                                  </span>
                                )}
                            </div>
                            <div className="flex flex-col gap-1 mt-1.5">
                                {c.computedPendingAmount > 0 && (
                                  <span className="self-start text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded flex items-center">
                                    ค้างชำระ ฿{c.computedPendingAmount.toLocaleString()}
                                  </span>
                                )}

                            </div>
                          </div>

                          <div className="flex flex-col items-end shrink-0 gap-3 border-l border-gray-100 pl-3 h-full justify-center">
                            <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600">{c.computedStatus || 'ยังคงเหลือ'}</span>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setCourseQRModalData(c); }}
                                    className="text-teal-600 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 p-1.5 rounded-lg transition-colors shadow-sm border border-teal-100"
                                    title="แสดงคิวอาร์โค้ดคอร์ส"
                                >
                                    <QrCode size={14} />
                                </button>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5">ใช้ไป {c.computedUsedQty || 0}/{c.computedTotalQty || 1}</p>
                                <p className="text-base sm:text-xl font-black text-teal-600 leading-none">เหลือ {c.computedRemainQty}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            
            {((activeTab === 'products' && filteredProducts.length === 0) || (activeTab === 'courses' && filteredCourses.length === 0) || (activeTab === 'my_courses' && filteredMyCourses.length === 0)) && (
              <div className="col-span-full py-20 text-center text-slate-400 flex flex-col items-center">
                <Search size={48} className="mb-4 opacity-20" />
                <p className="text-lg">ไม่พบข้อมูล</p>
              </div>
            )}
          </div>
        </div>

        {/* Floating Mobile Bottom Action Buttons (Hidden since Cart is in search bar) */}
        {isStockMode && globalRole !== 'owner' && !isMobileCartOpen && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 z-[70] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] pb-safe">
             <button 
                onClick={() => setIsStockConfirmModalOpen(true)}
                disabled={stockAdjustments.length === 0}
                className={`w-full py-4 rounded-2xl font-black text-lg shadow-xl flex items-center justify-between px-6 transition-transform active:scale-95 ${stockAdjustments.length > 0 ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30' : 'bg-slate-300 text-slate-500 shadow-none'}`}
             >
                <div className="flex items-center gap-2"><CheckCircle size={24} /> ยืนยันปรับสต๊อก</div>
                <div className={`${stockAdjustments.length > 0 ? 'bg-white text-rose-600' : 'bg-slate-200 text-slate-400'} px-3 py-1 rounded-xl text-sm`}>{stockAdjustments.length} รายการ</div>
             </button>
          </div>
        )}
      </div>

      {/* Right: Cart & Checkout */}
      <div className={`w-full lg:w-[450px] xl:w-[500px] flex-col h-full bg-white shadow-xl z-[60] lg:z-10 ${isMobileCartOpen ? 'fixed inset-0 flex pt-16 pb-0' : 'hidden lg:flex'}`}>
        
        {/* Mobile Close Button */}
        <div className="lg:hidden p-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 sticky top-0 z-10">
           <button onClick={() => setIsMobileCartOpen(false)} className="flex items-center gap-1 text-indigo-600 font-bold active:scale-95 transition-transform">
              <ChevronLeft size={24} /> <span>กลับ</span>
           </button>
           <h2 className="font-black text-lg text-slate-800 flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
             <ShoppingCart size={20} className="text-indigo-600" /> ตะกร้าสินค้า
           </h2>
           <div className="w-16"></div> {/* Spacer for centering */}
        </div>
        
        {/* Customer Selection */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 shrink-0 z-10">
          <div className="relative">
            {selectedCustomer ? (
              <>
              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-indigo-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-indigo-200 shadow-sm">
                    {(() => {
                      const picData = getProfilePicData(selectedCustomer, customers);
                      if (picData && picData.primary) {
                        return (
                          <img 
                            src={picData.primary} 
                            onError={(e) => handleProfileImgError(e, picData.fallback)}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        );
                      }
                      return <User size={20} />;
                    })()}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-800 flex items-center flex-wrap gap-2">
                        {selectedCustomer.computedName || String(getFuzzyKey(selectedCustomer, ["ชื่อ", "col_1"]))}
                        {isVipCustomer && <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-yellow-200">VIP</span>}
                        {orderChannel === 'shopee' && <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-orange-200 ml-1">ส่วนลดพิเศษ</span>}
                        {(selectedCustomer.isApproved || vipStats.isVip) && (
                          <button 
                            onClick={() => onOpenVipForm(selectedCustomer)}
                            className="bg-orange-500 hover:bg-orange-600 transition-colors text-white px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 active:scale-95 shadow-sm"
                            title="ดู/สร้างใบสมัคร VIP"
                          >
                            <Award size={10} /> ใบสมัคร VIP
                          </button>
                        )}
                        {onViewCustomerProfile && (
                          <button 
                            onClick={() => {
                              onViewCustomerProfile(selectedCustomer);
                              setIsMobileCartOpen(false);
                            }}
                            className="ml-auto text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-2 py-1 rounded-lg transition-colors flex items-center gap-1 font-bold"
                          >
                            <User size={12} />
                            ดูประวัติ
                          </button>
                        )}
                    </div>
                    <div className="text-sm text-slate-500 mb-1">{selectedCustomer.computedPhone || String(getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3"]))}</div>
                    
                    {/* VIP Progress Bar */}
                    <div className="text-[10px] text-slate-500 w-full max-w-xs mt-1">
                        <div className="flex justify-between mb-0.5">
                            <span>ยอดสะสม: ฿{vipStats.amount.toLocaleString()}</span>
                            {!isVipCustomer && <span>ขาด ฿{(5000 - vipStats.amount).toLocaleString()}</span>}
                        </div>
                        {!isVipCustomer && (
                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (vipStats.amount / 5000) * 100)}%` }}></div>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2 mt-2">
                      {customerCreditBalance > 0 && (
                        <div className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-600 border border-orange-100 px-2 py-1 rounded-lg text-xs font-bold shadow-sm">
                          <CreditCard size={14} /> 
                          เครดิต: <span className="text-indigo-600 font-black">฿{customerCreditBalance.toLocaleString()}</span>
                        </div>
                      )}
                      {customerPendingBalance > 0 && (
                        <div className="bg-red-100 px-3 py-1.5 rounded-lg flex flex-col justify-center animate-pulse">
                          <span className="text-[10px] font-bold text-red-500">ยอดค้างชำระรวม</span>
                          <span className="text-red-600 font-black">฿{customerPendingBalance.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="w-10 h-10 rounded-full bg-white text-slate-400 flex items-center justify-center hover:text-red-500 shadow-sm border border-indigo-100">
                  <X size={20} />
                </button>
              </div>
              {renderCustomerContext()}
              </>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="ค้นหาลูกค้า (ชื่อ, เบอร์โทร)..."
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setIsCustomerDropdownOpen(true);
                  }}
                  onFocus={() => setIsCustomerDropdownOpen(true)}
                />
                <button 
                  onClick={() => setScannerTarget('customerSearch')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="สแกนคิวอาร์โค้ดลูกค้า"
                >
                  <ScanLine size={18} />
                </button>
                
                {isCustomerDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto z-50">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map(c => {
                        const amt = c.realAccumulatedAmount !== undefined ? c.realAccumulatedAmount : getCustomerAccumulatedAmount(c);
                        const isVip = c.isApproved !== undefined ? c.isApproved : amt >= 5000;
                        return (
                        <div 
                          key={c.id} 
                          onClick={() => {
                            setSelectedCustomer(c);
                            setCustomerSearch('');
                            setIsCustomerDropdownOpen(false);
                            const cPhone = String(c.computedPhone || getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '').trim();
                            const hasCourses = courses.some(course => String(getFuzzyKey(course, ["เบอร์โทร", "col_1"]) || '').trim() === cPhone && course.computedRemainQty > 0);
                            if (hasCourses) {
                              setActiveTab('my_courses');
                              showToast('พบคอร์สคงเหลือ สามารถคลิกตัดคอร์สได้ทันที!', 'success');
                            }
                          }}
                          className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0 flex items-center gap-3"
                        >
                          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center border border-slate-200">
                            {(() => {
                              const picData = getProfilePicData(c, customers);
                              if (picData && picData.primary) {
                                return (
                                  <img 
                                    src={picData.primary} 
                                    onError={(e) => handleProfileImgError(e, picData.fallback)}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                  />
                                );
                              }
                              return <User size={16} className="text-slate-400" />;
                            })()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-800 flex items-center gap-2 truncate flex-wrap">
                                {c.computedName || String(getFuzzyKey(c, ["ชื่อ", "col_1"]))}
                                {isVip && <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-yellow-200">VIP</span>}
                                {(c.isApproved || amt >= 5000) && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); onOpenVipForm(c); setCustomerSearch(''); setIsCustomerDropdownOpen(false); }}
                                    className="bg-orange-500 hover:bg-orange-600 transition-colors text-white px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 active:scale-95 shadow-sm ml-auto"
                                    title="ดู/สร้างใบสมัคร VIP"
                                  >
                                    <Award size={10} /> ใบสมัคร VIP
                                  </button>
                                )}
                            </div>
                            <div className="text-sm text-slate-500 mb-1">{c.computedPhone || String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]))}</div>
                            <div className="text-[11px] text-slate-500 w-full mt-1">
                                <div className="flex justify-between mb-0.5">
                                    <span>ยอดสะสม: ฿{amt.toLocaleString()}</span>
                                    {!isVip && <span>ขาด ฿{(5000 - amt).toLocaleString()}</span>}
                                </div>
                                {!isVip && (
                                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                        <div className="bg-yellow-400 h-1.5 rounded-full" style={{ width: `${Math.min(100, (amt / 5000) * 100)}%` }}></div>
                                    </div>
                                )}
                            </div>
                          </div>
                          {onViewCustomerProfile && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewCustomerProfile(c);
                                setIsMobileCartOpen(false);
                                setIsCustomerDropdownOpen(false);
                                setCustomerSearch('');
                              }}
                              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1 font-bold shrink-0"
                            >
                              <User size={12} />
                              ดูประวัติ
                            </button>
                          )}
                        </div>
                      )})
                    ) : (
                      <div className="px-4 py-3 text-center text-slate-500">ไม่พบลูกค้า</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 bg-white">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <ShoppingCart size={64} className="mb-4 text-slate-200" strokeWidth={1.5} />
              <p className="text-lg">ตะกร้าว่างเปล่า</p>
              <p className="text-sm mt-2 text-slate-400">เพิ่มสินค้าจากรายการด้านซ้าย</p>
            </div>
          ) : (
            <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
              {cart.map((item) => {
                let imgUrl = null;
                if (item.type === 'product' && item.originalItem) {
                  let p = item.originalItem;
                  const productName = String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2"]) || item.name);
                  const productCode = String(getFuzzyKey(p, ["รหัส", "col_1"]) || '');
                  
                  const wooImg = (productCode ? wooImagesMap.get(productCode.trim().toUpperCase()) : null) || wooImagesMap.get(productName.toLowerCase());
                  
                  if (wooImg) {
                      imgUrl = wooImg;
                  } else {
                      let imgFilename = p["รูปสินค้า"] || p["image"] || p["imageUrl"] || p["รูปภาพ"] || p["img"];
                      if (!imgFilename) {
                        for (const key of Object.keys(p)) {
                          const val = String(p[key] || '').trim();
                          if (val.match(/\.(jpeg|jpg|gif|png|webp)$/i) || val.includes('.รูปสินค้า.')) {
                            imgFilename = val;
                            break;
                          }
                        }
                      }
                      if (imgFilename) {
                         if (imgFilename.startsWith('http')) imgUrl = imgFilename;
                         else imgUrl = `https://crm.irisnatures.com/สินค้า_Images/${encodeURI(imgFilename.replace(/^\/+/, ''))}`;
                      } else {
                         imgUrl = `https://crm.irisnatures.com/สินค้า_Images/${encodeURIComponent(item.name)}.jpg`;
                      }
                  }
                }

                return (
                <div key={`${item.type}-${item.id}`} className="flex items-center justify-between gap-2 p-2 border-b border-slate-100 bg-white hover:bg-slate-50 transition-colors last:border-0">
                  
                  <div className="flex-1 min-w-0 pr-1 flex items-center gap-2">
                    {imgUrl ? (
                      <img src={imgUrl} onError={(e) => { e.target.onerror = null; e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>'; }} className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-50 p-[2px]" />
                    ) : item.type === 'service' ? (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-orange-100 flex items-center justify-center shrink-0 border border-orange-200">
                        <Scissors size={20} className="text-orange-500" />
                      </div>
                    ) : item.type === 'product' ? (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                        <Package size={20} className="text-slate-400" />
                      </div>
                    ) : null}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                        {item.type === 'course' && <span className="inline-block px-1 py-[1px] rounded text-[9px] bg-pink-100 text-pink-700 font-bold uppercase shrink-0">Course</span>}
                        <span className="truncate" title={item.name}>{item.name}</span>
                      </div>
                      {item.type === 'product' && (
                        <div className="text-[10px] text-slate-400 mt-[2px] truncate" title={String(getFuzzyKey(item.originalItem, ["หมวดสินค้า", "col_4"]) || 'ทั่วไป')}>
                          แบรนด์/หมวดหมู่: <span className="font-medium text-slate-500">{String(getFuzzyKey(item.originalItem, ["หมวดสินค้า", "col_4"]) || 'ทั่วไป')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                      {/* Qty Controls */}
                      <div className="flex items-center bg-slate-100 rounded p-[1px] border border-slate-200">
                        <button onClick={() => updateCartQty(item.id, item.type, -1)} className="p-0.5 rounded hover:bg-white text-slate-600"><Minus size={14} strokeWidth={2.5} /></button>
                        <span className="w-6 text-center text-xs font-bold text-slate-800">{item.qty}</span>
                        <button onClick={() => updateCartQty(item.id, item.type, 1)} className="p-0.5 rounded hover:bg-white text-slate-600"><Plus size={14} strokeWidth={2.5} /></button>
                      </div>
                      
                      {/* Price & Total */}
                      <div className="flex flex-col items-end w-16 relative">
                          {item.originalPrice && item.originalPrice > item.price && (
                            <del className="text-gray-400 text-[8px] absolute -top-3 right-0">฿{item.originalPrice.toLocaleString()}</del>
                          )}
                          <input 
                            type="number" 
                            value={item.price}
                            onChange={(e) => updateCartPrice(item.id, item.type, e.target.value)}
                            disabled={globalRole !== 'owner'}
                            className={`w-full text-right text-[11px] font-bold bg-transparent border-b border-dashed px-0 py-0 focus:outline-none ${globalRole === 'owner' ? 'text-slate-700 border-slate-300 focus:border-indigo-500 hover:border-indigo-300 cursor-text' : 'text-slate-500 border-transparent cursor-not-allowed'}`}
                          />
                          <div className="text-[10px] text-indigo-600 font-bold mt-[2px]">
                            ={(item.price * item.qty).toLocaleString()}
                          </div>
                      </div>
                      
                      {/* Delete */}
                      <button onClick={() => removeFromCart(item.id, item.type)} className="text-slate-300 hover:text-red-500 transition-colors p-1 ml-1 shrink-0 bg-slate-50 rounded-md hover:bg-red-50">
                        <Trash2 size={14} />
                      </button>
                  </div>

                </div>
              )})}
            </div>
          )}
        </div>

        {/* Checkout Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)] shrink-0 z-10">
          
          <div className="space-y-3 mb-4 text-slate-600">
            {isRequisitionMode ? (
              <div className="pt-3 border-t border-slate-200 flex justify-between items-end">
                <span className="font-semibold text-slate-800 block">มูลค่าการเบิก (ต้นทุน)</span>
                <span className="text-3xl font-bold text-indigo-600 tracking-tight">฿{total.toLocaleString()}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center text-sm">
                  <span>ยอดรวม (Subtotal)</span>
                  <span className="font-semibold text-slate-800">฿{subtotal.toLocaleString()}</span>
                </div>
                
                <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div 
                    className="flex justify-between items-center cursor-pointer select-none"
                    onClick={() => setShowDiscountSection(!showDiscountSection)}
                  >
                    <span className="font-bold text-sm text-slate-700 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      ส่วนลด / โปรโมชั่น
                    </span>
                    <span className="text-slate-400">
                      {showDiscountSection ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>}
                    </span>
                  </div>

                  {showDiscountSection && (
                    <div className="pt-3 border-t border-slate-200 mt-1 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">โปรโมชั่น (Promotion)</span>
                        <select 
                          value={selectedPromotion}
                          onChange={(e) => setSelectedPromotion(e.target.value)}
                          className="w-48 text-right bg-white border border-slate-200 rounded-lg px-2 py-1 text-indigo-600 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">-- ไม่ใช้โปรโมชั่น --</option>
                          {promotions.filter(p => p.isActive).map(promo => (
                            <option key={promo.id} value={promo.id}>{promo.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      {promoDiscount > 0 && (
                        <div className="flex justify-between items-center text-xs text-indigo-500">
                          <span>ส่วนลดโปรโมชั่น:</span>
                          <span>-฿{promoDiscount.toLocaleString()}</span>
                        </div>
                      )}
                      {selectedPromotion && promoResult.reason && promoDiscount === 0 && (
                        <div className="flex justify-between items-center text-xs text-rose-500">
                          <span>ส่วนลดโปรโมชั่น:</span>
                          <span>{promoResult.reason}</span>
                        </div>
                      )}
                      {selectedPromotion && promoResult.freeItems && (
                        <div className="flex justify-between items-center text-xs text-pink-600 bg-pink-50 px-2 py-1 rounded">
                          <span>โปรโมชั่น (แถมฟรี):</span>
                          <span>{promoResult.freeItems.name} x{promoResult.freeItems.qty}</span>
                        </div>
                      )}
                      {selectedPromotion && promoResult.nextTimeDiscount && (
                        <div className="flex justify-between items-center text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                          <span>โปรโมชั่น (ครั้งถัดไป):</span>
                          <span>{promoResult.nextTimeDiscount}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="text-sm">รหัสคูปอง / E-Voucher</span>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => setScannerTarget('voucher')}
                            className="bg-slate-200 text-slate-600 p-1.5 rounded-lg hover:bg-slate-300 transition-colors"
                            title="สแกน QR Code"
                          >
                            <ScanLine size={16} />
                          </button>
                          <input 
                            type="text"
                            value={manualVoucherCode}
                            onChange={(e) => setManualVoucherCode(e.target.value.toUpperCase())}
                            placeholder="กรอกรหัส..."
                            className="w-24 text-center bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase text-xs"
                            onKeyDown={(e) => {
                              if(e.key === 'Enter' && manualVoucherCode) {
                                handleVoucherScan(manualVoucherCode);
                                setManualVoucherCode('');
                              }
                            }}
                          />
                          <button 
                            onClick={() => {
                              if (manualVoucherCode) {
                                handleVoucherScan(manualVoucherCode);
                                setManualVoucherCode('');
                              }
                            }}
                            className="bg-indigo-600 text-white px-2 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                          >
                            ใช้สิทธิ์
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm">ส่วนลดเพิ่มเติม (Manual)</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-400">฿</span>
                          <input 
                            type="number"
                            value={globalDiscount || ''}
                            onChange={(e) => setGlobalDiscount(parseNumber(e.target.value))}
                            placeholder="0"
                            disabled={globalRole !== 'owner'}
                            className={`w-24 text-right border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${globalRole === 'owner' ? 'bg-white border-slate-200 text-red-500 font-medium cursor-text' : 'bg-slate-100 border-transparent text-slate-400 cursor-not-allowed'}`}
                          />
                        </div>
                      </div>
                      
                      {subtotal > 0 && (
                        <div className="flex justify-end gap-1">
                          {[10, 20, 25].map(pct => (
                            <button 
                              key={pct}
                              onClick={() => setGlobalDiscount(Math.floor(subtotal * (pct / 100)))}
                              className="px-2 py-1 text-[10px] font-semibold bg-slate-200 text-slate-600 rounded hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                            >
                              {pct}%
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-end">
                  <div>
                    <span className="font-semibold text-slate-800 block">ยอดชำระสุทธิ</span>
                    {totalSaved > 0 && <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mt-1 inline-block">ส่วนลดพิเศษ {appliedVoucherCode ? `(${appliedVoucherCode})` : ''}: ฿{totalSaved.toLocaleString()}</span>}
                  </div>
                  <span className="text-3xl font-bold text-indigo-600 tracking-tight">฿{total.toLocaleString()}</span>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2">
            {!isRequisitionMode && (
              <>
                <button 
                  onClick={() => {
                    if (cart.length === 0) {
                      showToast('ไม่มีสินค้าในตะกร้า');
                      return;
                    }
                    setShowParkBedModal(true);
                  }}
                  disabled={cart.length === 0}
                  className={`w-1/4 py-3 rounded-2xl font-bold text-[12px] flex flex-col items-center justify-center gap-1 transition-all shadow-lg active:scale-95 ${cart.length === 0 ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200'}`}
                >
                  <QrCode size={18} /> พักบิล
                </button>
                <button 
                  onClick={() => {
                    if (cart.length === 0) {
                      showToast('ไม่มีสินค้าในตะกร้า');
                      return;
                    }
                    if (!selectedCustomer) {
                        showToast('โปรดเลือกลูกค้าก่อนทำรายการจัดส่ง', 'error');
                        return;
                    }
                    
                    // เตรียมข้อมูลสำหรับจัดส่งถ้ายังไม่มี
                    if (!shippingAddress) {
                        const name = String(getFuzzyKey(selectedCustomer, ["ชื่อ", "col_1"]) || '');
                        const phone = String(getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3"]) || '');
                        const address = String(getFuzzyKey(selectedCustomer, ["ที่อยู่", "col_4", "address"]) || '');
                        if (name || phone || address) {
                            setShippingAddress(`${name}\n${phone}\n${address}`.trim());
                        }
                    }
                    
                    // ไปที่หน้าชำระเงิน
                    setOrderChannel('chat'); // หรือค่าเริ่มต้นสำหรับการขายออนไลน์
                    setCheckoutStep(1);
                    setShowPaymentModal(true);
                    
                    // หน่วงเวลาเล็กน้อยให้ Modal แรกแสดงก่อน แล้วค่อยเปิดหน้าต่าง iShip
                    setTimeout(() => {
                        setIshipModal({ isOpen: true });
                    }, 300);
                  }}
                  disabled={cart.length === 0}
                  className={`w-1/4 py-3 rounded-2xl font-bold text-[12px] flex flex-col items-center justify-center gap-1 transition-all shadow-lg active:scale-95 ${cart.length === 0 ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' : 'bg-sky-500 hover:bg-sky-600 text-white shadow-sky-200'}`}
                >
                  <Package size={18} /> ขนส่ง
                </button>
              </>
            )}
            <button 
              onClick={() => {
                if (cart.length === 0) {
                  showToast('ไม่มีสินค้าในตะกร้า');
                  return;
                }
                const hasCourse = cart.some(i => {
                  if (i.type !== 'course') return false;
                  const qty = String(getFuzzyKey(i.originalItem, ["จำนวนครั้ง", "col_7"]) || '').trim();
                  return qty !== '1';
                });
                if (hasCourse && !selectedCustomer && !isRequisitionMode) {
                  showToast('มีรายการคอร์สในตะกร้า โปรดเลือกลูกค้าก่อนชำระเงิน', 'error');
                  return;
                }
                if (!splitPayment.cash && !splitPayment.transfer && !splitPayment.cod && !splitPayment.credit) {
                  setSplitPayment({ cash: 0, transfer: total, cod: 0, credit: 0 });
                }
                setCheckoutStep(1);
                setShowPaymentModal(true);
              }}
              disabled={cart.length === 0}
              className={`flex-1 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${cart.length === 0 ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' : (isRequisitionMode ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200')}`}
            >
              {isRequisitionMode ? (
                <><Package size={24} /> สร้างใบเบิกสินค้า (PO)</>
              ) : (
                <><CheckCircle size={24} /> ดำเนินการชำระเงิน</>
              )}
            </button>
          </div>
        </div>
      </div>

    {/* Park Bed Modal */}
    {showParkBedModal && (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm print:hidden">
        <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-800">พักบิลเข้าเตียง</h2>
            <button onClick={() => setShowParkBedModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full"><X size={20} /></button>
          </div>
          <div className="mb-6">
            <div className="text-sm font-semibold text-slate-700 mb-2">เลือกเตียงที่ต้องการพักบิล</div>
            <select
              value={parkBedNumber}
              onChange={(e) => setParkBedNumber(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 outline-none"
            >
              {Array.from({ length: 4 }).map((_, i) => (
                 <option key={i + 1} value={String(i + 1)}>เตียง {i + 1}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={async () => {
              setIsProcessing(true);
              try {
                const orderNo = `P${Date.now().toString().slice(-6)}`;
                const orderItems = cart.map(item => ({
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  qty: item.qty,
                  type: item.type
                }));
                
                const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
                const existingParkedOrder = orders.find(o => 
                  o.status === 'รอชำระเงิน' && 
                  o.source === 'POS_Parked' && 
                  String(o.bedNumber) === String(parkBedNumber) &&
                  (!globalBranch || o.branch === globalBranch || o.branch === 'สำนักงานใหญ่') &&
                  (new Date(o.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) === today || 
                   new Date(o.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') === today.replace(/\//g, '-'))
                );
                
                if (existingParkedOrder) {
                  // Merge cart items with existing order
                  const updatedCartItems = [...(existingParkedOrder.cartItems || []), ...orderItems];
                  const updatedPrice = Number(existingParkedOrder.price) + total;
                  const updatedCourseName = updatedCartItems.map(i => `${i.name} x${i.qty}`).join(', ');
                  
                  await updateDoc(doc(db, 'orders', existingParkedOrder.id), {
                    cartItems: updatedCartItems,
                    price: updatedPrice,
                    courseName: updatedCourseName,
                    updatedAt: new Date().toISOString()
                  });
                  showToast(`เพิ่มบิลเข้าเตียง ${parkBedNumber} สำเร็จ`, 'success');
                } else {
                  // Create new parked order
                  const orderData = {
                    orderNo,
                    customerName: selectedCustomer ? String(getFuzzyKey(selectedCustomer, ["ชื่อ", "col_1"]) || '') : 'ลูกค้าทั่วไป',
                    customerPhone: selectedCustomer ? String(getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3"]) || '') : '',
                    bedNumber: String(parkBedNumber),
                    branch: globalBranch || 'เฉวง',
                    source: 'POS_Parked',
                    status: 'รอชำระเงิน',
                    price: total,
                    totalCost: 0,
                    paymentMethod: 'โอนเงิน',
                    cartItems: orderItems,
                    createdAt: new Date().toISOString(),
                    courseName: orderItems.map(i => `${i.name} x${i.qty}`).join(', ')
                  };
                  
                  await addDoc(getCol('orders'), orderData);
                  showToast(`พักบิลเข้าเตียง ${parkBedNumber} สำเร็จ ให้ลูกค้าสแกน QR Code ประจำเตียงเพื่อจ่ายเงิน`, 'success');
                }
                
                setCart([]);
                setAppCreditPaidAmount(0);
                setShowParkBedModal(false);
              } catch (err) {
                console.error(err);
                showToast('เกิดข้อผิดพลาดในการพักบิล', 'error');
              }
              setIsProcessing(false);
            }}
            disabled={isProcessing}
            className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-200"
          >
            {isProcessing ? 'กำลังบันทึก...' : <><CheckCircle size={20} /> ยืนยันพักบิล</>}
          </button>
        </div>
      </div>
    )}

    {/* Payment Modal */}
    {showPaymentModal && (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm print:hidden">
        <div className={`bg-white rounded-3xl p-6 w-full ${cart.some(i => i.type === 'usage') && checkoutStep === 1 ? 'max-w-3xl' : 'max-w-sm'} shadow-2xl flex flex-col max-h-[95vh] overflow-y-auto`}>
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-800">
              {cart.some(i => i.type === 'usage') && checkoutStep === 1 ? 'ข้อมูลการรับบริการ' : (isRequisitionMode ? 'ยืนยันการเบิกสินค้า (PO)' : 'ช่องทางการชำระเงิน')}
            </h2>
            <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full"><X size={20} /></button>
          </div>

          {cart.some(i => i.type === 'usage') && (
            <div className="mb-4">
              <div className="text-sm font-semibold text-slate-700 mb-2">เข้าใช้เตียง (สำหรับ Walk-in)</div>
              <select
                value={selectedBed}
                onChange={(e) => setSelectedBed(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 outline-none"
              >
                <option value="">ไม่ระบุเตียง (แค่ตัดคอร์สอย่างเดียว)</option>
                {Array.from({ length: 4 }).map((_, i) => {
                   const bedNum = String(i + 1);
                   const isOccupied = bookings && bookings.some(b => String(b.bedNumber) === bedNum && b.status === 'กำลังใช้บริการ' && b.branch === (globalBranch || 'เฉวง'));
                   return (
                     <option key={bedNum} value={bedNum} disabled={isOccupied}>
                       เตียง {bedNum} {isOccupied ? '(ไม่ว่าง)' : '(ว่าง)'}
                     </option>
                   );
                })}
              </select>
            </div>
          )}

          {(!cart.some(i => i.type === 'usage') || checkoutStep === 2) && (

            <>
              {globalRole === 'owner' && (
                <div className="mb-4">
              <div className="text-sm font-semibold text-slate-700 mb-2">วันที่ทำรายการ (ย้อนหลังได้เฉพาะเจ้าของ)</div>
              <input 
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 outline-none"
              />
            </div>
          )}
          
          {!isRequisitionMode && (
            <>
              <div className="mb-4">
                <div className="text-sm font-semibold text-slate-700 mb-2">ช่องทางการสั่งซื้อ</div>
                <div className="flex gap-2">
                  <button onClick={() => { setOrderChannel('instore'); setSplitPayment(prev => ({ ...prev, transfer: total - prev.cash - prev.cod - prev.credit })); }} className={`flex-1 py-2 rounded-lg font-bold text-sm ${orderChannel === 'instore' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>หน้าร้าน</button>
                  <button onClick={() => { setOrderChannel('shopee'); setSplitPayment({ cash: 0, transfer: 0, cod: total, credit: 0 }); }} className={`flex-1 py-2 rounded-lg font-bold text-sm ${orderChannel === 'shopee' ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>ช้อปปี้</button>
                  <button onClick={() => { setOrderChannel('chat'); setSplitPayment({ cash: 0, transfer: 0, cod: total, credit: 0 }); }} className={`flex-1 py-2 rounded-lg font-bold text-sm ${orderChannel === 'chat' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>ทางแชท</button>
                  <button onClick={() => { setOrderChannel('web'); setSplitPayment({ cash: 0, transfer: 0, cod: total, credit: 0 }); }} className={`flex-1 py-2 rounded-lg font-bold text-sm ${orderChannel === 'web' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>ทางเว็บ</button>
                </div>
              </div>
              
              {orderChannel !== 'instore' && (
                <div className="mb-4 space-y-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-700 mb-2 flex justify-between">
                      <span>หมายเลขคำสั่งซื้อ / รหัสอ้างอิง</span>
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={activeWcOrderId || ''}
                        onChange={(e) => setActiveWcOrderId(e.target.value)}
                        placeholder="เช่น 240822ABCD..." 
                        className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button 
                        onClick={() => setScannerTarget('wcOrder')}
                        className="bg-indigo-100 text-indigo-600 px-3 py-2 rounded-lg font-bold hover:bg-indigo-200 transition-colors flex items-center justify-center shrink-0"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Shipping & Tracking Section */}
                  <div className="mb-4">
                      <div className="flex gap-2 mb-2">
                        <div className="flex-1">
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">📮 เลขพัสดุ / ข้อมูลจัดส่ง</label>
                          <div className="flex gap-1.5 flex-wrap sm:flex-nowrap">
                            <input
                              type="text"
                              value={posTrackingNo}
                              onChange={(e) => setPosTrackingNo(e.target.value)}
                              placeholder="สแกนหรือพิมพ์เลขพัสดุ"
                              className="flex-1 min-w-0 border border-slate-200 rounded-xl p-2.5 text-sm font-mono font-bold tracking-wide focus:outline-none focus:border-sky-500 w-full"
                            />
                            <div className="flex gap-1.5 shrink-0">
                               <button
                                 type="button"
                                 onClick={() => setScannerTarget('trackingNo')}
                                 title="เปิดกล้องสแกนเลขพัสดุ"
                                 className="px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl flex items-center gap-1.5 font-bold text-xs shadow-sm active:scale-95 transition-all"
                               >
                                 <QrCode size={16}/> สแกน
                               </button>
                               <button
                                 type="button"
                                 onClick={() => setIshipModal({ isOpen: true })}
                                 title="จัดการที่อยู่ / เรียก iShip"
                                 className="px-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl flex items-center gap-1.5 font-bold text-xs shadow-sm active:scale-95 transition-all"
                               >
                                 <Truck size={16}/> iShip
                               </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Address Summary */}
                      {shippingAddress && (
                        <div className="bg-slate-50 rounded-lg p-2 text-[11px] text-slate-600 flex items-center border border-slate-100">
                          <div className="truncate font-medium">
                            <Truck size={12} className="inline mr-1 text-slate-400" /> {shippingAddress.replace(/\n/g, ' ')}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              )}
              
              {/* 3. Staff Selection (Moved here to be visible for all sales/usages) */}
              <div className="mb-6 bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                <label className="block text-xs font-bold text-slate-500 mb-2">พนักงานที่ให้บริการ / ขายคอร์ส (เลือกได้หลายคนเพื่อแบ่งคอม) <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {clockedInEmployees.filter(emp => !globalBranch || emp.branch === globalBranch || emp.branch === 'สำนักงานใหญ่').map(emp => {
                     const isSelected = paymentStaff && paymentStaff.split('/').map(s => s.trim()).includes(emp.name);
                     return (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => {
                             let currentStaffList = paymentStaff ? paymentStaff.split('/').map(s => s.trim()).filter(Boolean) : [];
                             if (isSelected) {
                                 currentStaffList = currentStaffList.filter(s => s !== emp.name);
                             } else {
                                 currentStaffList.push(emp.name);
                             }
                             setPaymentStaff(currentStaffList.join(' / '));
                          }}
                          className={`px-3 py-2 rounded-xl text-sm font-bold border-2 transition-colors ${isSelected ? 'bg-indigo-100 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}
                        >
                          {emp.name}
                        </button>
                     );
                  })}
                </div>
                {paymentStaff && (
                  <div className="mt-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                    <p className="text-[11px] text-indigo-800 font-bold">ยอดค่าคอมมิชชั่นโดยประมาณจากบิลนี้ (แยกตามประเภท):</p>
                    {paymentStaff.split('/').map(s => s.trim()).filter(Boolean).map((staffName, idx, arr) => {
                       const emp = employees.find(e => e.name === staffName);
                       const courseRate = parseFloat(emp?.commissionRate) || 0;
                       const prodRate = parseFloat(emp?.productCommissionRate) || 0;
                       
                       let prodGross = 0;
                       let courseGross = 0;
                       cart.forEach(item => {
                         if (item.type === 'product' || item.type === 'claim_item') {
                           prodGross += (item.price || 0) * (item.qty || 1);
                         } else {
                           courseGross += (item.price || 0) * (item.qty || 1);
                         }
                       });

                       const courseComm = (courseGross * (courseRate / 100)) / arr.length;
                       const prodComm = (prodGross * (prodRate / 100)) / arr.length;
                       const totalComm = courseComm + prodComm;

                       return (
                         <div key={idx} className="flex flex-col gap-1 text-xs text-indigo-700 bg-white px-3 py-2 rounded-lg shadow-sm border border-indigo-50">
                           <div className="flex justify-between items-center w-full">
                             <span className="font-semibold flex items-center gap-1.5">
                               <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                               {staffName}
                             </span>
                             <span className="font-black text-emerald-600">฿{totalComm.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
                           </div>
                           <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-3 text-[10px] text-indigo-400 mt-0.5">
                             <span>คอร์ส/บริการ ({courseRate}%): ฿{courseComm.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                             <span>สินค้า ({prodRate}%): ฿{prodComm.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                           </div>
                         </div>
                       );
                    })}
                  </div>
                )}
              </div>

              <div className="text-center mb-6">
                <div className="text-sm text-slate-500 mb-1">ยอดสุทธิที่ต้องชำระ</div>
                <div className="text-3xl font-bold text-indigo-600">฿{total.toLocaleString()}</div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm font-semibold mb-2">
                  <span className="text-slate-700">ระบุยอดเงิน:</span>
                  {total - totalCovered > 0 && <span className="text-red-500 text-xs">ขาด ฿{(total - totalCovered).toLocaleString()}</span>}
                  {totalPaid - (total - appCreditPaidAmount) > 0 && <span className="text-orange-500 text-xs">เกิน ฿{(totalPaid - (total - appCreditPaidAmount)).toLocaleString()}</span>}
                  {appCreditPaidAmount > 0 && <span className="text-emerald-600 text-xs font-bold">✓ จ่ายแล้วผ่านแอป ฿{appCreditPaidAmount.toLocaleString()}</span>}
                </div>

                <button 
                  onClick={() => {
                    // 🌟 ล็อก "สแกน QR ตัดเครดิต" เมื่อลูกค้าจ่ายเครดิตผ่านแอปไปแล้ว
                    if (appCreditPaidAmount > 0) {
                      showToast('ห้ามตัดเครดิตซ้ำ — ออเดอร์นี้ลูกค้าจ่ายเครดิตไปแล้วในแอป', 'error');
                      return;
                    }
                    setScannerTarget('creditPayment');
                    setSplitPayment({ cash: 0, transfer: 0, cod: 0, credit: total });
                  }}
                  className="w-full bg-[#1a1f2c] text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 hover:bg-black active:scale-95 shadow-md mb-2 transition-all"
                >
                  <QrCode size={18} className="text-[#12B981]" /> สแกน QR Code เพื่อดึงลูกค้า/ตัดเครดิตจ่าย
                </button>

                {/* 🌟 แบนเนอร์กันหักเครดิตซ้ำ — ออเดอร์ที่ลูกค้าจ่ายเครดิตไปแล้วในแอป */}
                {appCreditPaidAmount > 0 && (
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-xl px-3 py-2.5 mb-2 flex items-start gap-2">
                    <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5"/>
                    <div className="flex-1">
                      <p className="text-xs font-black text-amber-800 leading-snug">
                        ออเดอร์นี้ลูกค้าจ่ายเครดิตไปแล้วในแอป ฿{appCreditPaidAmount.toLocaleString()} — ถือว่าชำระเต็มจำนวนแล้ว
                      </p>
                      <p className="text-[10px] font-bold text-amber-600 mt-0.5">🚫 ห้ามเลือก "ใช้เครดิต" ซ้ำ (ระบบบล็อกไว้ — เครดิตจะถูกหักสองครั้ง) กดชำระเงินได้เลย</p>
                    </div>
                  </div>
                )}

                {[
                  { key: 'transfer', label: 'โอนเงิน', icon: Smartphone },
                  { key: 'cash', label: 'เงินสด', icon: Banknote },
                  { key: 'cod', label: 'ค้าง/COD', icon: Clock },
                  ...(customerCreditBalance > 0 || splitPayment.credit > 0 ? [{ key: 'credit', label: 'ใช้เครดิต', icon: CreditCard }] : [])
                ].map((method) => (
                  <div key={method.key} className={`flex items-center gap-2 ${method.key === 'credit' && appCreditPaidAmount > 0 ? 'opacity-40 pointer-events-none' : ''}`}>
                    <button
                      onClick={() => {
                        // 🌟 ล็อกช่องเครดิตเมื่อลูกค้าจ่ายผ่านแอปแล้ว
                        if (method.key === 'credit' && appCreditPaidAmount > 0) {
                          showToast('ห้ามใช้เครดิตซ้ำ — ออเดอร์นี้ลูกค้าจ่ายเครดิตไปแล้วในแอป', 'error');
                          return;
                        }
                        // ยอดที่ต้องเก็บจริง = ยอดสุทธิ − ที่จ่ายไปแล้วผ่านแอป
                        const effectiveTotal = Math.max(0, total - (appCreditPaidAmount || 0));
                        const currentOthersTotal = totalPaid - (splitPayment[method.key] || 0);
                        if (currentOthersTotal >= effectiveTotal && effectiveTotal > 0) {
                           const newAmt = effectiveTotal;
                           setSplitPayment({ cash: 0, transfer: 0, cod: 0, credit: 0, [method.key]: newAmt });
                        } else {
                           let fillAmt = Math.max(0, effectiveTotal - currentOthersTotal);
                           if (method.key === 'credit' && fillAmt > customerCreditBalance) fillAmt = customerCreditBalance;
                           setSplitPayment(prev => ({ ...prev, [method.key]: fillAmt }));
                        }
                      }}
                      className="flex-1 flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl hover:bg-indigo-50 transition-colors text-slate-600 focus:outline-none"
                      title="คลิกเพื่อเติมยอดที่เหลือ หรือเปลี่ยนช่องทางชำระ"
                    >
                      <method.icon size={18} className="text-indigo-500" />
                      <span className="text-sm font-medium">{method.label}</span>
                      {method.key === 'credit' && <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-md ml-auto">เหลือ ฿{customerCreditBalance.toLocaleString()}</span>}
                    </button>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-slate-400">฿</span>
                      <input 
                        type="number" 
                        value={splitPayment[method.key] || ''}
                        onChange={(e) => {
                          // 🌟 ห้ามกรอกเครดิตเมื่อลูกค้าจ่ายเครดิตผ่านแอปไปแล้ว
                          if (method.key === 'credit' && appCreditPaidAmount > 0) return;
                          let val = parseNumber(e.target.value);
                          if (method.key === 'credit' && val > customerCreditBalance) val = customerCreditBalance;

                          setSplitPayment(prev => {
                             const nextState = { ...prev, [method.key]: val };
                             // ยอดที่ต้องเก็บจริง = ยอดสุทธิ − จ่ายแล้วผ่านแอป
                             const effectiveTotal = Math.max(0, total - (appCreditPaidAmount || 0));
                             let sum = (nextState.cash || 0) + (nextState.transfer || 0) + (nextState.cod || 0) + (nextState.credit || 0) + (nextState.omise_promptpay || 0);

                             if (sum > effectiveTotal) {
                                 let excess = sum - effectiveTotal;
                                 const otherKeys = ['cash', 'transfer', 'cod', 'credit']
                                     .filter(k => k !== method.key)
                                     .sort((a, b) => (nextState[b] || 0) - (nextState[a] || 0));
                                     
                                 for (let key of otherKeys) {
                                     if (excess <= 0) break;
                                     let currentVal = nextState[key] || 0;
                                     if (currentVal > 0) {
                                         let deduct = Math.min(currentVal, excess);
                                         nextState[key] = currentVal - deduct;
                                         excess -= deduct;
                                     }
                                 }
                             }
                             return nextState;
                          });
                        }}
                        placeholder="0"
                        className={`w-28 text-right bg-slate-50 border rounded-xl px-3 py-2 text-base font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${splitPayment[method.key] > 0 ? 'border-indigo-300 text-indigo-700 bg-indigo-50/30' : 'border-slate-200 text-slate-800'}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          </>
        )}

        <div className={`space-y-4 mb-6 pt-2 ${((cart.some(i => i.type === 'usage') && checkoutStep === 1) || cart.some(i => i.type === 'service')) ? 'block' : 'hidden'}`}>
              
              {/* 1. Photo Upload */}
              <div>
                 <span className="block text-xs font-bold text-slate-500 mb-2">อัปโหลดรูปภาพ (ก่อนทำ / หลังทำ)</span>
                 <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'before', label: 'ก่อนทำ (Before)' },
                      { key: 'after', label: 'หลังทำ (After)' }
                    ].map(photo => (
                      <div key={photo.key}>
                         <input type="file" accept="image/*" multiple className="hidden" id={`upload-${photo.key}`} onChange={(e) => {
                            const files = Array.from(e.target.files);
                            if (files.length > 0) {
                                Promise.all(files.map(async file => {
                                    try {
                                        const options = { maxSizeMB: 0.2, maxWidthOrHeight: 1024, useWebWorker: true };
                                        const compressed = await imageCompression(file, options);
                                        return new Promise((resolve) => {
                                            const reader = new FileReader();
                                            reader.onload = (ev) => resolve(ev.target.result);
                                            reader.readAsDataURL(compressed);
                                        });
                                    } catch (err) {
                                        console.error("Compression failed", err);
                                        return new Promise((resolve) => {
                                            const reader = new FileReader();
                                            reader.onload = (ev) => resolve(ev.target.result);
                                            reader.readAsDataURL(file);
                                        });
                                    }
                                })).then(results => {
                                    setPaymentPhotos(prev => ({ ...prev, [photo.key]: results }));
                                });
                            }
                         }} />
                         <label htmlFor={`upload-${photo.key}`} className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50/50 hover:bg-indigo-50 cursor-pointer transition-all relative overflow-hidden group">
                            {paymentPhotos[photo.key] && paymentPhotos[photo.key].length > 0 ? (
                              <>
                                <div className="absolute inset-0 w-full h-full p-1.5 flex gap-1.5 overflow-x-auto snap-x">
                                  {paymentPhotos[photo.key].map((img, idx) => (
                                     <img key={idx} src={img} className="h-full w-auto min-w-[40%] object-cover rounded shadow-sm snap-center opacity-90 group-hover:opacity-40 transition-opacity" alt="Preview" />
                                  ))}
                                </div>
                                <div className="z-10 hidden group-hover:flex flex-col items-center p-2 bg-white/90 rounded-lg shadow-sm backdrop-blur-sm pointer-events-none">
                                  <Camera size={16} className="text-indigo-600 mb-0.5" />
                                  <span className="text-[10px] font-bold text-indigo-700">เลือกรูปใหม่</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="w-10 h-10 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                  <Camera size={20} />
                                </div>
                                <span className="text-xs font-bold text-indigo-600 text-center px-1">{photo.label}</span>
                              </>
                            )}
                         </label>
                      </div>
                    ))}
                 </div>
              </div>

              {/* 2. Service Selection (Only for usage) */}
              {cart.some(i => i.type === 'usage') && (() => {
                const maxUsageAllowed = cart.filter(i => i.type === 'usage').reduce((sum, item) => sum + (item.originalItem?.computedRemainQty || 0), 0);
                const currentDeductedQty = usedServices.filter(s => !String(getFuzzyKey(s, ["ชื่อคอส", "col_4"])).includes('ฟรี')).length;
                return (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-500">เลือกรายการบริการที่ใช้ในครั้งนี้ (เลือกได้มากกว่า 1) <span className="text-red-500">*</span></label>
                    <div className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-1 rounded shadow-sm">
                       สิทธิ์คงเหลือ: {maxUsageAllowed} | เลือกแล้ว: <span className={currentDeductedQty > maxUsageAllowed ? 'text-red-600' : ''}>{currentDeductedQty}</span>
                    </div>
                  </div>
                <div className="mb-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text"
                      placeholder="ค้นหาบริการ (เช่น นวดหน้า, ขัดหน้า)..."
                      value={modalServiceSearch}
                      onChange={(e) => setModalServiceSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {usedServices.length > 0 && (
                  <div className="mb-2 p-2 bg-indigo-50 rounded-xl flex flex-wrap gap-2 border border-indigo-100">
                    {usedServices.map(s => (
                      <div key={s.id} className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-indigo-200 text-xs font-bold text-indigo-700 shadow-sm">
                        {String(getFuzzyKey(s, ["ชื่อคอส", "col_4"]))}
                        <X size={12} className="cursor-pointer hover:text-red-500 ml-1" onClick={() => setUsedServices(usedServices.filter(u => u.id !== s.id))} />
                      </div>
                    ))}
                  </div>
                )}

                {modalServiceSearch.trim() === '' ? (
                  <div className="mb-2 p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-white shadow-sm">
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
                          const isSelected = usedServices.some(s => s.id === srv.id);
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
                                onClick={() => {
                                   if (isSelected) setUsedServices(usedServices.filter(s => s.id !== srv.id));
                                   else {
                                      const srvName = String(getFuzzyKey(srv, ["ชื่อคอส", "col_4"])).trim();
                                      if (!srvName.includes('ฟรี') && currentDeductedQty >= maxUsageAllowed) {
                                         return showToast(`เลือกบริการเกินจำนวนสิทธิ์ที่มี (${maxUsageAllowed} ครั้ง)`, 'error');
                                      }
                                      setUsedServices([...usedServices, srv]);
                                   }
                                }}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all border ${isSelected ? 'bg-white text-indigo-600 border-white shadow-sm' : 'bg-white/20 text-white border-white/30 hover:bg-white/30'}`}
                             >
                                {displayName}
                             </button>
                          )
                      })}
                    </div>
                  </div>
                ) : (
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 border border-slate-100 rounded-xl">
                  {masterCourses.filter(c => {
                    const code = String(getFuzzyKey(c, ["รหัสคอส", "col_1"]));
                    const qty = String(getFuzzyKey(c, ["จำนวนครั้งที่ได้", "qty", "col_13"]) || '1');
                    if (!code.startsWith('F-') || qty !== '1') return false;
                    
                    if (modalServiceSearch.trim() !== '') {
                      const searchStr = `${code} ${String(getFuzzyKey(c, ["ชื่อคอส", "col_4"]) || '')}`.toLowerCase();
                      return searchStr.includes(modalServiceSearch.toLowerCase());
                    }
                    return true;
                  }).sort((a, b) => {
                    const codeA = String(getFuzzyKey(a, ["รหัสคอส", "col_1"]));
                    const codeB = String(getFuzzyKey(b, ["รหัสคอส", "col_1"]));
                    
                    const getSortScore = (code) => {
                      if (code.startsWith('F-MA') || code.startsWith('F-M')) return 1;
                      if (/^F-[A-J]/i.test(code)) return 2;
                      return 3;
                    };
                    
                    const scoreA = getSortScore(codeA);
                    const scoreB = getSortScore(codeB);
                    if (scoreA !== scoreB) return scoreA - scoreB;
                    return codeA.localeCompare(codeB);
                  })
                  .map(srv => {
                    const isSelected = usedServices.some(s => s.id === srv.id);
                    return (
                      <div 
                        key={srv.id}
                        onClick={() => {
                          if (isSelected) setUsedServices(usedServices.filter(s => s.id !== srv.id));
                          else {
                             const srvName = String(getFuzzyKey(srv, ["ชื่อคอส", "col_4"])).trim();
                             if (!srvName.includes('ฟรี') && currentDeductedQty >= maxUsageAllowed) {
                                return showToast(`เลือกบริการเกินจำนวนสิทธิ์ที่มี (${maxUsageAllowed} ครั้ง)`, 'error');
                             }
                             setUsedServices([...usedServices, srv]);
                          }
                        }}
                        className={`p-2 rounded-lg border cursor-pointer transition-all flex items-start gap-2 ${isSelected ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 hover:border-indigo-200 bg-white text-slate-600'}`}
                      >
                        <div className={`mt-0.5 flex-shrink-0 w-3 h-3 rounded-full border flex items-center justify-center ${isSelected ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-300'}`}>
                          {isSelected && <CheckCircle size={8} />}
                        </div>
                        <div className="text-[10px] sm:text-xs font-medium leading-tight">
                          {String(getFuzzyKey(srv, ["ชื่อคอส", "col_4"]))}
                        </div>
                      </div>
                    );
                  })}
                  </div>
                )}
                </div>
                );
              })()}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <SignaturePad canvasRef={custSigRef} label="ลายเซ็นลูกค้า" />
                 <SignaturePad canvasRef={staffSigRef} label="ลายเซ็นพนักงาน" />
              </div>
            </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            {cart.some(i => i.type === 'usage') && checkoutStep === 2 && (
              <button 
                onClick={() => setCheckoutStep(1)}
                className="py-4 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-lg transition-colors flex items-center justify-center shadow-sm active:scale-95"
              >
                ย้อนกลับ
              </button>
            )}
            
            {cart.some(i => i.type === 'usage') && checkoutStep === 1 ? (
              <button 
                onClick={() => {
                   if (!paymentStaff) return showToast('กรุณาเลือกพนักงานผู้ให้บริการ', 'error');
                   if (custSigRef.current?.dataset?.isSigned !== "true" || staffSigRef.current?.dataset?.isSigned !== "true") {
                       return showToast('กรุณาให้ลูกค้าและพนักงานเซ็นชื่อให้ครบถ้วนก่อนยืนยัน', 'error');
                   }
                   if (usedServices.length === 0) {
                       return showToast('กรุณาเลือกบริการที่ใช้ในครั้งนี้', 'error');
                   }
                   const maxAllowed = cart.filter(i => i.type === 'usage').reduce((sum, item) => sum + (item.originalItem?.computedRemainQty || 0), 0);
                   const deducted = usedServices.filter(s => !String(getFuzzyKey(s, ["ชื่อคอส", "col_4"])).includes('ฟรี')).length;
                   if (deducted > maxAllowed) {
                       return showToast(`เลือกบริการเกินจำนวนสิทธิ์ที่มี (${maxAllowed} ครั้ง)`, 'error');
                   }
                   setCheckoutStep(2);
                }}
                className="flex-1 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
              >
                ถัดไป <ChevronRight size={24} />
              </button>
            ) : (
              <button 
                id="btn-confirm-checkout"
                onClick={() => {
                    if (splitPayment.transfer > 0 && !omiseChargeData) {
                        setShowTransferChoiceModal(true);
                    } else {
                        handleCheckout();
                    }
                }}
                disabled={isProcessing || (!isRequisitionMode && totalPaid !== total)}
                className={`flex-1 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${(isProcessing || (!isRequisitionMode && totalPaid !== total)) ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' : (isRequisitionMode ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200' : (cart.some(i => i.type === 'usage') ? 'bg-pink-600 hover:bg-pink-700 text-white shadow-pink-200' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'))}`}
              >
                {isProcessing ? (
                  <><span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> กำลังประมวลผล...</>
                ) : (
                  <><CheckCircle size={24} /> {isRequisitionMode ? 'ยืนยันการเบิกสินค้า' : (cart.some(i => i.type === 'usage') ? 'ยืนยันตัดคอร์สและชำระเงิน' : 'ยืนยันการชำระเงิน')}</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    )}

    {/* Transfer Choice Modal */}
    {showTransferChoiceModal && (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:hidden">
        <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-200">
           <h2 className="text-xl font-black text-slate-800 mb-2 text-center">เลือกรูปแบบการรับเงิน</h2>
           <p className="text-sm text-slate-500 mb-6 text-center">ยอดโอน: ฿{splitPayment.transfer.toLocaleString()}</p>
           
           <div className="flex flex-col gap-3 w-full">
              <button 
                 onClick={() => {
                     setShowTransferChoiceModal(false);
                     handleOmisePromptPayCheckout(splitPayment.transfer);
                 }}
                 className="w-full py-4 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl font-bold text-teal-700 transition-colors flex flex-col items-center justify-center shadow-sm"
              >
                 <div className="flex items-center gap-2 mb-1"><QrCode size={20} /> สร้าง QR พร้อมเพย์ออโต้</div>
                 <span className="text-[11px] text-teal-600 font-normal">ระบบเช็คยอดอัตโนมัติ ใช้งานง่ายที่สุด</span>
              </button>
              
              <button 
                 onClick={() => {
                     setShowTransferChoiceModal(false);
                     handleCheckout();
                 }}
                 className="w-full py-4 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl font-bold text-indigo-700 transition-colors flex flex-col items-center justify-center shadow-sm"
              >
                 <div className="flex items-center gap-2 mb-1"><Smartphone size={20} /> โอนเงินธรรมดา</div>
                 <span className="text-[11px] text-indigo-600 font-normal">แอดมินเช็คสลิปและกดยืนยันด้วยตนเอง</span>
              </button>
           </div>
           
           <button 
             onClick={() => {
                 setShowTransferChoiceModal(false);
             }}
             className="mt-4 w-full py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-600 transition-colors"
           >
             ยกเลิก
           </button>
        </div>
      </div>
    )}

    {/* Omise QR Modal */}
    {showOmiseQrModal && omiseChargeData && (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:hidden">
        <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <QrCode size={20} className="text-teal-600" /> สแกนจ่าย (PromptPay)
            </h2>
            <button 
              onClick={() => {
                setShowOmiseQrModal(false);
                setIsPollingOmise(false);
                setShowPaymentModal(true); // Re-open checkout modal
              }} 
              className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="text-3xl font-black text-teal-600 mb-6">
            ฿{(omiseChargeData.amount / 100).toLocaleString()}
          </div>
          
          <div className="p-4 bg-white border-2 border-teal-100 rounded-2xl shadow-sm mb-6">
            {omiseChargeData.source?.scannable_code?.image?.download_uri ? (
              <img 
                src={omiseChargeData.source.scannable_code.image.download_uri} 
                alt="PromptPay QR Code" 
                className="w-48 h-48 object-contain"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center bg-slate-50 text-slate-400">
                ไม่พบรูปภาพ QR
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-slate-600 font-bold mb-4">
            <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            กำลังรอให้ลูกค้าชำระเงิน...
          </div>
          
          <div className="text-xs text-slate-400 text-center px-4">
            เมื่อลูกค้าสแกนจ่ายสำเร็จ ระบบจะทำรายการให้โดยอัตโนมัติ ไม่ต้องกดยืนยัน
          </div>
        </div>
      </div>
    )}

    {/* Receipt & Success Modal */}
    {receiptData && (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm print:hidden">
        <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
            <CheckCircle size={32} strokeWidth={2.5} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-1">
            {isRequisitionMode ? 'ทำรายการเบิกสินค้าเรียบร้อย!' : 'ชำระเงินเรียบร้อย!'}
          </h2>
          <p className="text-slate-500 text-sm mb-4">เลขที่บิล: {receiptData.orderNo}</p>
          
          {/* WooCommerce Sync Status */}
          {wooSyncStatus.length > 0 && (
            <div className="w-full mb-4 bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">ซิงค์สต๊อกขึ้นเว็บ (WooCommerce)</div>
              {wooSyncStatus.map((s, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-700 truncate flex-1">{s.name}</span>
                  <span className="text-xs text-slate-400 shrink-0">→ {s.newStock} ชิ้น</span>
                  {s.status === 'pending' && (
                    <span className="flex items-center gap-1 text-xs text-amber-500 font-bold shrink-0">
                      <span className="animate-spin inline-block w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full"></span>
                      กำลังส่ง...
                    </span>
                  )}
                  {s.status === 'success' && (
                    <span className="text-xs text-emerald-600 font-bold shrink-0">✅ สำเร็จ</span>
                  )}
                  {s.status === 'failed' && (
                    <span className="text-xs text-rose-500 font-bold shrink-0">❌ ล้มเหลว</span>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <div className="w-full space-y-3">
            <button 
              onClick={() => {
                setPrintMode('receipt');
                // Skip preview — print directly after one frame for portal to render
                requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                    window.print();
                  });
                });
              }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-200 transition-colors flex items-center justify-center gap-2"
            >
              🖨️ {receiptData?.items.some(i => i.actionType === 'owner_purchase')
                ? 'พิมพ์ใบสั่งซื้อ (A4)'
                : receiptData?.items.some(i => i.actionType === 'branch_requisition')
                  ? 'พิมพ์ใบเบิกสินค้า (A4)'
                  : 'พิมพ์ใบเสร็จ (80mm)'}
            </button>
            {receiptData.orderChannel !== 'instore' && (
              <button 
                onClick={() => {
                  setPrintMode('label');
                  setShowPreviewModal(true);
                }}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-md shadow-orange-200 transition-colors flex items-center justify-center gap-2"
              >
                พิมพ์ใบแปะหน้า (4x6 นิ้ว)
              </button>
            )}
            <button 
              onClick={() => {
                setReceiptData(null);
                setCart([]);
                setAppCreditPaidAmount(0);
                setActiveCustomerAppOrderIds([]);
                setSelectedCustomer(null);
                setCustomerSearch('');
                setGlobalDiscount(0);
                setSplitPayment({ cash: 0, transfer: 0, cod: 0, credit: 0 });
                setShippingAddress('');
                setPosTrackingNo('');
                setOrderChannel('instore');
                setActiveWcOrderId(null);
                setIsMobileCartOpen(false);
              }}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
            >
              ทำรายการใหม่
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Dynamic Print Style */}
    <style>
      {`
        @media print {
          @page {
            size: ${receiptData?.items.some(i => i.actionType === 'owner_purchase' || i.actionType === 'branch_requisition') ? 'A4' : printMode === 'receipt' ? '80mm auto' : '100mm 150mm'};
            margin: 0;
          }
          body {
            background: white !important;
          }
          #root {
            display: none !important;
          }
          #pos-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            display: block !important;
          }
          #pos-print-area * {
            visibility: visible !important;
          }
        }
      `}
    </style>

    {/* Print Container via Portal */}
    {printMode && receiptData && createPortal(
      <div id="pos-print-area" className={showPreviewModal ? "fixed inset-0 z-[100] bg-slate-500 overflow-y-auto flex flex-col print:block print:bg-white print:static print:z-auto print:overflow-visible" : ""}>
        
        {showPreviewModal && (
          <div className="sticky top-0 z-[110] bg-white border-b border-slate-300 shadow-md p-4 flex justify-between items-center print:hidden">
            <div className="flex items-center gap-3">
               <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg">
                  <FileText size={24} />
               </div>
               <div>
                 <h2 className="text-xl font-bold text-slate-800">พรีวิวเอกสารก่อนพิมพ์</h2>
                 <p className="text-xs text-slate-500">โปรดตรวจสอบความถูกต้องก่อนสั่งปริ้นท์</p>
               </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 mr-4 cursor-pointer bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors">
                <input 
                  type="checkbox" 
                  checked={autoPrint} 
                  onChange={(e) => setAutoPrint(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-sm font-bold text-slate-700">
                  {autoPrint ? '⚡ พิมพ์อัตโนมัติ (เปิด)' : '📋 พิมพ์อัตโนมัติ (ปิด)'}
                </span>
              </label>
              <button 
                onClick={() => {
                   if (receiptData.orderNo === 'DRAFT') setReceiptData(null);
                   setShowPreviewModal(false);
                }} 
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-colors shadow-sm"
              >
                ยกเลิก
              </button>
              <button 
                onClick={() => {
                   window.print();
                   if (receiptData.orderNo === 'DRAFT') setReceiptData(null);
                   setShowPreviewModal(false);
                }}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-md shadow-indigo-200 transition-colors"
              >
                <FileText size={18} /> สั่งพิมพ์ปกติ
              </button>
              <button 
                onClick={() => {
                   let receiptText = "";
                   receiptText += "         IRIS NATURES\n";
                   receiptText += `      ${globalBranch || "สำนักงานใหญ่"}\n`;
                   receiptText += `   ${receiptData.items.some(i => i.actionType === 'owner_purchase') ? 'ใบสั่งซื้อ (Purchase Order)' : receiptData.items.some(i => i.actionType === 'branch_requisition') ? 'ใบเบิกสินค้า (Requisition)' : 'ใบเสร็จรับเงิน / Receipt'}\n`;
                   receiptText += "--------------------------------\n";
                   receiptText += `บิล: ${receiptData.orderNo}\n`;
                   receiptText += `วันที่: ${new Date(receiptData.createdAt).toLocaleString('th-TH')}\n`;
                   receiptText += `ลูกค้า: ${receiptData.customerName}\n`;
                   receiptText += "--------------------------------\n";
                   receiptText += "รายการ          จำนวน       รวม\n";
                   receiptText += "--------------------------------\n";
                   
                   receiptData.items.forEach(item => {
                       let name = item.name.substring(0, 15);
                       receiptText += `${name.padEnd(16)} ${String(item.qty).padStart(3)} ${(item.price * item.qty).toLocaleString().padStart(9)}\n`;
                   });
                   
                   receiptText += "--------------------------------\n";
                   receiptText += `ยอดรวม (Subtotal):      ${receiptData.subtotal.toLocaleString().padStart(8)}\n`;
                   
                   if (receiptData.promoDiscount > 0) {
                       receiptText += `ส่วนลดโปรโมชั่น:      -${receiptData.promoDiscount.toLocaleString().padStart(8)}\n`;
                   }
                   if (receiptData.globalDiscount > 0) {
                       receiptText += `ส่วนลดเพิ่มเติม:      -${receiptData.globalDiscount.toLocaleString().padStart(8)}\n`;
                   }
                   
                   receiptText += `ยอดสุทธิ (Total):       ${receiptData.total.toLocaleString().padStart(8)}\n`;
                   receiptText += "--------------------------------\n";
                   receiptText += "          ขอบคุณที่ใช้บริการ\n";
                   receiptText += "    Thank you for shopping with us!\n\n\n";

                   const encodedText = encodeURIComponent(receiptText);
                   window.location.href = `intent:${encodedText}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
                   
                   if (receiptData.orderNo === 'DRAFT') setReceiptData(null);
                   setShowPreviewModal(false);
                }}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-md shadow-emerald-200 transition-colors"
              >
                <Printer size={18} /> พิมพ์ด่วน (RawBT)
              </button>
            </div>
          </div>
        )}

        <div className={showPreviewModal ? "flex-1 py-8 flex justify-center print:py-0 print:block" : ""}>
          {printMode === 'receipt' && receiptData.items.some(i => i.actionType === 'owner_purchase' || i.actionType === 'branch_requisition') ? (
          <div className={`${showPreviewModal ? 'block shadow-2xl' : 'hidden'} print:shadow-none print:block w-[210mm] max-w-[210mm] text-black font-sans bg-white m-0 p-8 text-sm leading-tight mx-auto`}>
            <div className="text-center mb-8">
              <h1 className="font-bold text-2xl mb-2">IRIS NATURES</h1>
              <h2 className="font-semibold text-xl mb-1">
                {receiptData.items.some(i => i.actionType === 'owner_purchase') 
                  ? 'ใบสั่งซื้อ (Purchase Order)' 
                  : 'ใบเบิกสินค้า (Requisition Form)'}
              </h2>
            </div>
            
            <div className="flex justify-between mb-8 text-sm">
              <div>
                <p className="font-bold mb-1">ส่งถึง (To):</p>
                <p>IRIS NATURES (สาขาหลัก เฉวง)</p>
              </div>
              <div className="text-right">
                <p><span className="font-bold">เลขที่เอกสาร:</span> {receiptData.orderNo}</p>
                <p><span className="font-bold">วันที่:</span> {new Date(receiptData.createdAt).toLocaleDateString('th-TH')}</p>
                <p><span className="font-bold">สาขาที่ขอเบิก/สั่งซื้อ:</span> {globalBranch || "สำนักงานใหญ่"}</p>
              </div>
            </div>

            {(() => {
              const grouped = {};
              receiptData.items.forEach(item => {
                let brand = "ทั่วไป";
                if (item.originalItem) {
                   brand = String(getFuzzyKey(item.originalItem, ["แบรนด์", "หมวดสินค้า", "col_4"]) || "ทั่วไป");
                }
                if (!grouped[brand]) grouped[brand] = [];
                grouped[brand].push(item);
              });
              
              let totalQty = 0;
              let grandTotal = 0;

              return (
                <div className="space-y-6">
                  {Object.keys(grouped).map(brand => {
                    const items = grouped[brand];
                    const brandTotal = items.reduce((sum, i) => sum + (i.price * i.qty), 0);
                    const brandQty = items.reduce((sum, i) => sum + i.qty, 0);
                    totalQty += brandQty;
                    grandTotal += brandTotal;
                    
                    return (
                      <div key={brand} className="mb-4">
                        <h3 className="font-bold text-lg mb-2 border-b-2 border-slate-800 pb-1">แบรนด์: {brand}</h3>
                        <table className="w-full text-sm mb-2 border-collapse">
                          <thead>
                            <tr className="bg-slate-100">
                              <th className="border border-slate-300 px-2 py-1 text-left w-12">ลำดับ</th>
                              <th className="border border-slate-300 px-2 py-1 text-left">รายการสินค้า</th>
                              <th className="border border-slate-300 px-2 py-1 text-right w-24">ราคาต่อชิ้น</th>
                              <th className="border border-slate-300 px-2 py-1 text-center w-24">จำนวน</th>
                              <th className="border border-slate-300 px-2 py-1 text-right w-32">รวม (บาท)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item, idx) => (
                              <tr key={idx}>
                                <td className="border border-slate-300 px-2 py-1 text-center">{idx + 1}</td>
                                <td className="border border-slate-300 px-2 py-1">{item.name.replace(/^\[.*?\]\s*/, '')}</td>
                                <td className="border border-slate-300 px-2 py-1 text-right">{item.price.toLocaleString()}</td>
                                <td className="border border-slate-300 px-2 py-1 text-center">{item.qty}</td>
                                <td className="border border-slate-300 px-2 py-1 text-right">{(item.price * item.qty).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="font-bold bg-slate-50">
                              <td colSpan="3" className="border border-slate-300 px-2 py-1 text-right">รวมแบรนด์ {brand}</td>
                              <td className="border border-slate-300 px-2 py-1 text-center">{brandQty}</td>
                              <td className="border border-slate-300 px-2 py-1 text-right">{brandTotal.toLocaleString()}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    );
                  })}
                  
                  {/* Grand Total */}
                  <div className="flex justify-end mt-8">
                    <table className="w-64 text-sm border-collapse">
                      <tbody>
                        <tr className="font-bold text-base bg-slate-200">
                          <td className="border border-slate-400 px-4 py-2 text-right">ยอดรวมทั้งสิ้น</td>
                          <td className="border border-slate-400 px-4 py-2 text-right text-indigo-700">{grandTotal.toLocaleString()} บาท</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Signatures */}
                  <div className="flex justify-between mt-24 pt-4">
                    <div className="text-center w-48">
                      <div className="border-b border-black mb-2 pb-6"></div>
                      <p>ผู้เบิก / ผู้สั่งซื้อ</p>
                      <p className="text-xs mt-1">(สาขา {globalBranch || "สำนักงานใหญ่"})</p>
                    </div>
                    <div className="text-center w-48">
                      <div className="border-b border-black mb-2 pb-6"></div>
                      <p>ผู้อนุมัติ / ผู้จ่ายของ</p>
                      <p className="text-xs mt-1">(ศูนย์ใหญ่ / เจ้าของแฟรนไชส์)</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : printMode === 'receipt' ? (
          <div className={`${showPreviewModal ? 'block shadow-2xl' : 'hidden'} print:shadow-none print:block w-[80mm] max-w-full text-black font-sans bg-white m-0 p-2 text-sm leading-tight mx-auto`}>
          
          {/* COURSE USAGE SLIP */}
          {receiptData.paymentMethodStr === 'ตัดคอร์ส' || receiptData.items.some(i => i.type === 'usage' || i.actionType === 'usage' || (typeof i.name === 'string' && i.name.includes('ใช้คอร์ส'))) ? (
            <>
              <div className="text-center mb-4">
                <h1 className="font-bold text-xl mb-1">IRIS NATURES</h1>
                <p className="text-xs">{globalBranch || "สำนักงานใหญ่"}</p>
                <p className="text-sm font-bold mt-2 bg-slate-200 py-1 rounded">สลิปตัดคอร์สบริการ (คิว {receiptData.queueNo})</p>
                <div className="text-left text-xs border-b border-dashed border-black pb-2 mt-2">
                  <div>บิล: {receiptData.orderNo}</div>
                  <div>วันที่: {new Date(receiptData.createdAt).toLocaleString('th-TH')}</div>
                  <div className="font-bold text-sm mt-1">ผู้รับบริการ: {receiptData.customerName}</div>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-bold text-sm mb-1 border-b border-dashed border-black pb-1">รายการตัดคอร์ส</h3>
                {receiptData.items.map((item, idx) => (
                  <div key={idx} className="flex flex-col text-sm py-1 border-b border-dashed border-slate-300">
                    <div className="flex justify-between items-start">
                      <span className="pr-2 font-semibold">{item.name.replace('ใช้คอร์ส:', '').trim()}</span>
                      <span className="font-bold shrink-0">หัก {item.qty} ครั้ง</span>
                    </div>
                    {(receiptData.usedServices && receiptData.usedServices.length > 0) ? (
                      <div className="mt-1 pl-2 text-xs text-slate-700 space-y-0.5">
                        {receiptData.usedServices.map((srvName, sIdx) => (
                          <div key={sIdx} className="flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-slate-400 shrink-0"></span>
                            <span>{srvName}</span>
                          </div>
                        ))}
                      </div>
                    ) : (item.usedServices && item.usedServices.length > 0) ? (
                      <div className="mt-1 pl-2 text-xs text-slate-700 space-y-0.5">
                        {item.usedServices.map((srvName, sIdx) => (
                          <div key={sIdx} className="flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-slate-400 shrink-0"></span>
                            <span>{srvName}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-center justify-center mt-6 mb-4">
                 <QRCodeSVG value={receiptData.orderNo} size={100} level={"L"} />
                 <span className="text-[10px] mt-1">{receiptData.orderNo}</span>
              </div>

              <div className="mt-8 pt-4 pb-12 flex justify-between px-2">
                 <div className="text-center flex flex-col items-center">
                    {receiptData.staffSignature ? (
                      <img src={receiptData.staffSignature} alt="staff" className="h-10 mb-1 object-contain" />
                    ) : (
                      <div className="border-b border-black w-24 mx-auto mb-2 h-10"></div>
                    )}
                    <p className="text-xs">ผู้ให้บริการ</p>
                 </div>
                 <div className="text-center flex flex-col items-center">
                    {receiptData.customerSignature ? (
                      <img src={receiptData.customerSignature} alt="customer" className="h-10 mb-1 object-contain" />
                    ) : (
                      <div className="border-b border-black w-24 mx-auto mb-2 h-10"></div>
                    )}
                    <p className="text-xs">ผู้รับบริการ (ลูกค้า)</p>
                 </div>
              </div>

              <div className="text-center text-xs pb-4 border-t border-dashed border-black pt-2 mt-2">
                <p>ขอขอบพระคุณที่ไว้วางใจใช้บริการครับ</p>
              </div>
            </>
          ) : (
            /* STANDARD RECEIPT */
            <>
        <div className="text-center mb-4">
          <h1 className="font-bold text-xl mb-1">IRIS NATURES</h1>
          <p className="text-xs">{globalBranch || "สำนักงานใหญ่"}</p>
          <p className="text-xs mb-2">
            {receiptData.items.some(i => i.actionType === 'owner_purchase') 
              ? 'ใบสั่งซื้อ (Purchase Order)' 
              : receiptData.items.some(i => i.actionType === 'branch_requisition')
                ? 'ใบเบิกสินค้า (Requisition)'
                : `ใบเสร็จรับเงิน (คิว ${receiptData.queueNo})`}
          </p>
          <div className="text-left text-xs border-b border-dashed border-black pb-2 mb-2">
            <div>บิล: {receiptData.orderNo}</div>
            <div>วันที่: {new Date(receiptData.createdAt).toLocaleString('th-TH')}</div>
            <div>ลูกค้า: {receiptData.customerName}</div>
          </div>
        </div>

        <table className="w-full text-xs mb-2">
          <thead>
            <tr className="border-b border-dashed border-black">
              <th className="text-left py-1">รายการ</th>
              <th className="text-center py-1">จำนวน</th>
              <th className="text-right py-1">รวม</th>
            </tr>
          </thead>
          <tbody>
            {receiptData.items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-1 align-top pr-1">{item.name}</td>
                <td className="py-1 text-center align-top">{item.qty}</td>
                <td className="py-1 text-right align-top">{(item.price * item.qty).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-dashed border-black pt-2 mb-4 space-y-1 text-xs">
          <div className="flex justify-between">
            <span>ยอดรวม (Subtotal):</span>
            <span>{receiptData.subtotal.toLocaleString()}</span>
          </div>
          {receiptData.promoDiscount > 0 && (
            <div className="flex justify-between">
              <span>ส่วนลดโปรโมชั่น:</span>
              <span>-{receiptData.promoDiscount.toLocaleString()}</span>
            </div>
          )}
          {receiptData.promoFreeItems && (
            <div className="flex justify-between font-bold border border-dashed border-black px-1 mt-1">
              <span>** ฟรี **</span>
              <span>{receiptData.promoFreeItems.name} x{receiptData.promoFreeItems.qty}</span>
            </div>
          )}
          {receiptData.promoNextTimeDiscount && (
            <div className="flex flex-col items-center justify-center font-bold border border-dashed border-black p-1 my-2">
              <span>*** คูปองส่วนลดครั้งถัดไป ***</span>
              <span>{receiptData.promoNextTimeDiscount}</span>
            </div>
          )}
          {receiptData.globalDiscount > 0 && (
            <div className="flex justify-between">
              <span>ส่วนลดเพิ่มเติม (Manual):</span>
              <span>-{receiptData.globalDiscount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm mt-1">
            <span>ยอดสุทธิ (Total):</span>
            <span>{receiptData.total.toLocaleString()}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-black pt-2 mb-4 text-xs space-y-1">
          <div className="font-bold mb-1">การชำระเงิน:</div>
          {receiptData.splitPayment?.cash > 0 && (
            <div className="flex justify-between">
              <span>เงินสด:</span>
              <span>{receiptData.splitPayment.cash.toLocaleString()}</span>
            </div>
          )}
          {receiptData.splitPayment?.transfer > 0 && (
            <div className="flex justify-between">
              <span>โอนเงิน:</span>
              <span>{receiptData.splitPayment.transfer.toLocaleString()}</span>
            </div>
          )}
          {receiptData.splitPayment?.cod > 0 && (
            <div className="flex justify-between">
              <span>ค้าง/COD:</span>
              <span>{receiptData.splitPayment.cod.toLocaleString()}</span>
            </div>
          )}
          {(!receiptData.splitPayment?.cash && !receiptData.splitPayment?.transfer && !receiptData.splitPayment?.cod) && (
            <div className="flex justify-between">
              <span>{receiptData.paymentMethodStr || 'ชำระเงิน'}</span>
              <span>{receiptData.total?.toLocaleString() || '0'}</span>
            </div>
          )}
          {receiptData.totalSaved > 0 && (
            <div className="flex justify-between mt-2 font-bold text-emerald-600">
              <span>ส่วนลดพิเศษ {receiptData.appliedVoucherCode ? `(${receiptData.appliedVoucherCode})` : ''}:</span>
              <span>{receiptData.totalSaved.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center justify-center mt-4 mb-2">
           { (receiptData.splitPayment?.transfer > 0 || receiptData.splitPayment?.cod > 0 || (!receiptData.splitPayment?.cash && !receiptData.splitPayment?.transfer && !receiptData.splitPayment?.cod && receiptData.total > 0)) && (
             <div className="w-full flex flex-col items-center justify-center mb-4 border-2 border-dashed border-slate-300 p-3 rounded-xl print:border-black print:border-solid">
                <div className="font-bold text-[13px] mb-2 text-center">สแกนเพื่อชำระเงิน (PromptPay)</div>
                <QRCodeSVG 
                   value={generatePayload(
                     globalBranch === 'สาขาละไม' ? '0999999999' : '0815093284', 
                     { amount: receiptData.splitPayment?.transfer > 0 ? receiptData.splitPayment.transfer : (receiptData.splitPayment?.cod > 0 ? receiptData.splitPayment.cod : receiptData.total) }
                   )} 
                   size={120} 
                   level={"L"} 
                />
                <div className="text-[10px] font-bold mt-2 text-center leading-tight">
                   {globalBranch === 'สาขาละไม' ? 'บจก. ไอริสแคร์ (สาขาละไม)' : 'นายอิทธิชัย สังคะโห (สาขาเฉวง)'}
                </div>
                <div className="text-sm font-black mt-1">
                   ยอดชำระ: ฿{(receiptData.splitPayment?.transfer > 0 ? receiptData.splitPayment.transfer : (receiptData.splitPayment?.cod > 0 ? receiptData.splitPayment.cod : receiptData.total)).toLocaleString()}
                </div>
             </div>
           )}

           <QRCodeSVG value={receiptData.orderNo} size={100} level={"L"} />
           <span className="text-[10px] mt-1">{receiptData.orderNo}</span>
        </div>

        <div className="text-center text-xs pb-8 border-t border-dashed border-black pt-4">
          <p>ขอบคุณที่ใช้บริการ</p>
          <p>Thank you for shopping with us!</p>
        </div>
        </>
      )}
      </div>
    ) : null}

        {printMode === 'label' && (
          <div className={`${showPreviewModal ? 'flex shadow-2xl flex-col' : 'hidden'} print:shadow-none print:flex print:flex-col w-[100mm] h-[150mm] max-w-full text-black font-sans bg-white m-0 p-4 leading-tight mx-auto border-2 border-black box-border`}>
        <div className="border-b-2 border-black pb-3 mb-3 flex justify-between items-start">
          <div>
            <h1 className="font-black text-2xl mb-1">ผู้ส่ง (SENDER)</h1>
            <p className="font-bold text-sm">IRIS NATURES</p>
            <p className="text-xs">{globalBranch || "สำนักงานใหญ่"}</p>
            <p className="text-xs mt-1">เลขที่ออเดอร์: <span className="font-bold">{receiptData.orderNo}</span></p>
            <p className="text-xs">วันที่: {new Date(receiptData.createdAt).toLocaleDateString('th-TH')}</p>
          </div>
          <div className="text-right">
             <div className="text-4xl font-black border-4 border-black px-3 py-1 inline-block">
                {receiptData.splitPayment.cod > 0 ? 'COD' : 'PAID'}
             </div>
             {receiptData.splitPayment.cod > 0 && (
                <div className="text-xl font-bold mt-2">เก็บเงิน: ฿{receiptData.splitPayment.cod.toLocaleString()}</div>
             )}
          </div>
        </div>
        
        <div className="flex-1 border-b-2 border-black pb-3 mb-3">
          <h1 className="font-black text-2xl mb-3">ผู้รับ (RECEIVER)</h1>
          {receiptData.shippingAddress ? (
            <div className="text-xl whitespace-pre-wrap leading-relaxed font-bold">
              {receiptData.shippingAddress}
            </div>
          ) : (
            <div className="text-xl whitespace-pre-wrap leading-relaxed font-bold">
              {receiptData.customerName}{'\n'}
              โทร: {receiptData.customerPhone}
            </div>
          )}
        </div>
        
        <div className="h-1/3 min-h-[40mm]">
           <h2 className="font-bold text-lg mb-2">รายการสินค้า ({receiptData.items.length} รายการ):</h2>
           <div className="text-sm space-y-1 font-semibold">
             {receiptData.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start">
                   <span className="pr-2">{idx+1}. {item.name}</span>
                   <span className="font-black text-base shrink-0">x{item.qty}</span>
                </div>
             ))}
           </div>
        </div>
      </div>
        )}
        </div>
      </div>,
      document.body
    )}

    {/* Start of Day Modal */}
    {showSodModal && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:hidden">
        <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col">
          <div className="text-center mb-6">
            <div className="bg-amber-100 text-amber-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Banknote size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-800">เปิดกะ (Start of Day)</h2>
            <p className="text-slate-500 text-sm mt-1">กรุณาระบุเงินทอนตั้งต้นในลิ้นชักสำหรับวันนี้</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">เงินทอนตั้งต้น (ยอดยกมา)</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-400 font-bold">฿</span>
                <input 
                  type="number" 
                  value={sodData.floatCash}
                  onChange={(e) => setSodData({...sodData, floatCash: e.target.value})}
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-lg font-black focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">พนักงานผู้เปิดกะ</label>
              <select
                value={sodData.submittedBy}
                onChange={(e) => setSodData({...sodData, submittedBy: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">-- เลือกพนักงาน --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-8 flex gap-3">
            <button 
              onClick={() => onGoBack ? onGoBack() : setShowSodModal(false)}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
            >
              ยกเลิก
            </button>
            <button 
              onClick={handleSodSubmit}
              disabled={isSubmittingSod || !sodData.floatCash || !sodData.submittedBy}
              className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${isSubmittingSod || !sodData.floatCash || !sodData.submittedBy ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200'}`}
            >
              {isSubmittingSod ? (
                <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span> รอสักครู่...</>
              ) : (
                <><CheckCircle size={18} /> เปิดลิ้นชัก</>
              )}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* End of Day Modal */}
    {showEodModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm print:hidden">
        <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800">
              สรุปส่งยอดประจำวัน
            </h2>
            <button onClick={() => setShowEodModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>

          {/* 🌟 เลือกวันที่ส่งยอด (ส่งย้อนหลังได้) */}
          <div className={`flex items-center gap-2 mb-3 p-2 rounded-xl border ${isEodBackdated ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
            <span className={`text-xs font-bold shrink-0 ${isEodBackdated ? 'text-amber-700' : 'text-slate-500'}`}>วันที่ส่งยอด</span>
            <input
              id="eod-date-picker"
              type="date"
              value={posFilterDate}
              max={getLocalYYYYMMDD()}
              onChange={(e) => handleEodDateChange(e.target.value)}
              className="flex-1 min-w-0 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {isEodBackdated ? (
              <button onClick={() => handleEodDateChange(getLocalYYYYMMDD())} className="text-xs font-bold text-indigo-600 hover:underline shrink-0">วันนี้</button>
            ) : null}
          </div>
          {isEodBackdated && (
            <div className="mb-2 text-[11px] font-bold text-amber-700">
              ⏪ ส่งยอดย้อนหลังของวันที่ {new Date(posFilterDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          )}
          {existingEodForDate.length > 0 && (
            <div className="mb-3 p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-700">
              ⚠️ {isEodBackdated ? 'วันที่นี้' : 'วันนี้'}สาขานี้ส่งยอดไปแล้ว {existingEodForDate.length} ครั้ง ถ้าส่งอีกจะเป็นรายงานซ้ำ
            </div>
          )}
          
          {/* Tab Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-4 overflow-x-auto hide-scrollbar">
            <button onClick={() => setEodTab('cash')} className={`flex-1 py-2 px-3 text-xs md:text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${eodTab === 'cash' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
              เงินสด {eodData.actualCash ? `(฿${parseNumber(eodData.actualCash).toLocaleString()})` : ''}
            </button>
            <button onClick={() => setEodTab('transfer')} className={`flex-1 py-2 px-3 text-xs md:text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${eodTab === 'transfer' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
              โอน {eodBreakdown.transfer > 0 ? `(฿${eodBreakdown.transfer.toLocaleString()})` : ''}
            </button>
            {eodBreakdown.credit > 0 && <button onClick={() => setEodTab('credit')} className={`flex-1 py-2 px-3 text-xs md:text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${eodTab === 'credit' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
              เครดิต (฿{eodBreakdown.credit.toLocaleString()})
            </button>}
            {eodBreakdown.cod > 0 && <button onClick={() => setEodTab('cod')} className={`flex-1 py-2 px-3 text-xs md:text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${eodTab === 'cod' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
              ค้าง/Shopee (฿{eodBreakdown.cod.toLocaleString()})
            </button>}
            <button onClick={() => setEodTab('confirm')} className={`flex-1 py-2 px-3 text-xs md:text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${eodTab === 'confirm' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>ยืนยัน</button>
          </div>
          
          <div className="mb-2">
            {eodTab === 'cash' && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">เงินทอนตั้งต้นในลิ้นชัก</label>
                  <input 
                    type="number" 
                    value={eodData.floatCash}
                    onChange={(e) => setEodData({...eodData, floatCash: e.target.value})}
                    placeholder="ระบุจำนวนเงินทอน"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">ยอดส่งเงินสดจริง (จำนวนเงินที่หยิบไปฝากธนาคาร)</label>
                  <input 
                    type="number" 
                    value={eodData.actualCash}
                    onChange={(e) => setEodData({...eodData, actualCash: e.target.value})}
                    placeholder="ระบุจำนวนเงินสด"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {(() => {
                  const expectedCash = eodBreakdown.cash + (parseNumber(eodData.floatCash) || 0);
                  const nonCashSales = (eodBreakdown.transfer || 0) + (eodBreakdown.credit || 0) + (eodBreakdown.cod || 0);
                  
                  // Expected calculations based on perfect system balance
                  const expectedTotalSystemBalance = expectedCash + nonCashSales;
                  const floatCashNum = parseNumber(eodData.floatCash) || 0;
                  const baseFloat = Math.floor(floatCashNum / 100) * 100;
                  const expectedTheoreticalDeposit = Math.floor(expectedTotalSystemBalance / 100) * 100 - baseFloat;
                  const expectedNextDayFloat = expectedTotalSystemBalance - expectedTheoreticalDeposit;
                  const expectedRemitAmount = expectedCash - expectedNextDayFloat;
                  
                  // The user inputs remitted cash into eodData.actualCash
                  const actualRemittedCash = parseNumber(eodData.actualCash) || 0;
                  
                  // If they typed something, diff is actualRemitted - expectedRemitted
                  const diff = eodData.actualCash ? actualRemittedCash - expectedRemitAmount : 0;
                  
                  // Reconstruct actual total cash (assuming nextDayFloat stays the same as expected)
                  const actualTotalCash = eodData.actualCash ? actualRemittedCash + expectedNextDayFloat : expectedCash;
                  
                  const totalSystemBalance = actualTotalCash + nonCashSales;
                  const totalTheoreticalDeposit = Math.floor(totalSystemBalance / 100) * 100 - baseFloat;
                  const nextDayFloat = totalSystemBalance - totalTheoreticalDeposit;
                  const remitAmount = eodData.actualCash ? actualRemittedCash : expectedRemitAmount;

                  if (!eodData.floatCash) return null;
                  return (
                    <div className="space-y-3">
                      {eodData.actualCash && (
                        <div className={`p-3 rounded-lg border shadow-sm ${diff > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : diff < 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                          <div className="flex justify-between font-bold text-xs">
                            <span>สถานะเงินสด</span>
                            <span>{diff > 0 ? 'ยอดเกิน' : diff < 0 ? 'ยอดขาด' : 'ยอดพอดี'}</span>
                          </div>
                          <div className="text-xl font-black text-center my-1">
                            {diff > 0 ? '+' : ''}{diff.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-center font-medium opacity-80">
                            ควรมีในลิ้นชัก: ฿{expectedCash.toLocaleString()}
                          </div>
                        </div>
                      )}

                      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-800">
                         <div className="flex justify-between items-center mb-2">
                           <span className="font-bold text-sm">ยอดส่งเงินสดจริง (หักยอดโอนแล้ว)</span>
                           <span className="text-2xl font-black text-rose-600">฿{remitAmount.toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between items-center text-sm mb-1">
                           <span className="font-medium text-indigo-600">ยอดฝากธนาคารรวม (ปัดเศษหลักร้อย)</span>
                           <span className="font-bold text-indigo-700">฿{totalTheoreticalDeposit.toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between items-center text-sm">
                           <span className="font-medium text-indigo-600">เงินทอนยกไปพรุ่งนี้</span>
                           <span className="font-bold text-indigo-700">฿{nextDayFloat.toLocaleString()}</span>
                         </div>
                      </div>
                    </div>
                  )
                })()}
                <button onClick={() => setEodTab('transfer')} className="w-full py-3 bg-indigo-50 text-indigo-700 rounded-xl font-bold hover:bg-indigo-100 transition-colors">ถัดไป: โอนเงิน</button>
              </div>
            )}
            
            {eodTab === 'transfer' && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <div className="flex justify-between text-base mb-2">
                    <span className="text-blue-700 font-bold">ยอดโอนเงินทั้งหมด</span>
                    <span className="font-black text-blue-700 text-lg">฿{eodBreakdown.transfer.toLocaleString()}</span>
                  </div>
                  {eodBreakdown.transferDetails?.length > 0 ? (
                    <div className="max-h-48 overflow-y-auto space-y-1.5 mt-4 pt-4 border-t border-blue-200 custom-scrollbar pr-2">
                      {eodBreakdown.transferDetails.map((t, idx) => (
                        <div key={idx} className="flex flex-col text-[11px] bg-emerald-500 border border-emerald-600 p-2 rounded-md shadow-sm">
                          <div className="flex justify-between font-bold text-white mb-1">
                            <span className="truncate mr-2">{t.time} - {t.customer}</span>
                            <span className="shrink-0">฿{t.amount?.toLocaleString()}</span>
                          </div>
                          <div className="text-[10px] text-emerald-50 leading-tight">{t.items}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-blue-400 text-sm mt-4">ไม่มีรายการโอนเงิน</div>
                  )}
                </div>
                {globalRole === 'owner' && (
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 space-y-2">
                    <label className="block text-sm font-bold text-amber-800">👑 เพิ่มยอดโอน (เฉพาะเจ้าของ)</label>
                    <input
                      id="eod-manual-transfer"
                      type="number"
                      inputMode="decimal"
                      value={eodData.manualTransfer || ''}
                      onChange={(e) => setEodData({ ...eodData, manualTransfer: e.target.value })}
                      placeholder="ระบุยอดโอนที่ไม่ได้คีย์ผ่าน POS"
                      className="w-full bg-white border border-amber-200 rounded-xl px-4 py-2.5 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <input
                      id="eod-manual-transfer-note"
                      type="text"
                      value={eodData.manualTransferNote || ''}
                      onChange={(e) => setEodData({ ...eodData, manualTransferNote: e.target.value })}
                      placeholder="หมายเหตุ (ไม่บังคับ) เช่น โอนค่าคอร์ส คุณ A"
                      className="w-full bg-white border border-amber-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}
                <button onClick={() => setEodTab(eodBreakdown.credit > 0 ? 'credit' : eodBreakdown.cod > 0 ? 'cod' : 'confirm')} className="w-full py-3 bg-indigo-50 text-indigo-700 rounded-xl font-bold hover:bg-indigo-100 transition-colors">ถัดไป</button>
              </div>
            )}

            {eodTab === 'credit' && eodBreakdown.credit > 0 && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                  <div className="flex justify-between text-base">
                    <span className="text-orange-700 font-bold">ยอดใช้เครดิตทั้งหมด</span>
                    <span className="font-black text-orange-700 text-lg">฿{eodBreakdown.credit.toLocaleString()}</span>
                  </div>
                </div>
                <button onClick={() => setEodTab(eodBreakdown.cod > 0 ? 'cod' : 'confirm')} className="w-full py-3 bg-indigo-50 text-indigo-700 rounded-xl font-bold hover:bg-indigo-100 transition-colors">ถัดไป</button>
              </div>
            )}

            {eodTab === 'cod' && eodBreakdown.cod > 0 && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 flex flex-col">
                  <div className="flex justify-between text-base mb-2">
                    <span className="text-rose-700 font-bold">ยอดค้างชำระรวม</span>
                    <span className="font-black text-rose-700 text-lg">฿{eodBreakdown.cod.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-rose-200/60 pt-2 mt-1 space-y-1 text-sm font-semibold text-rose-600/80">
                    {(eodBreakdown.cod - eodBreakdown.online) > 0 && (
                       <div className="flex justify-between">
                         <span>• COD:</span>
                         <span>฿{(eodBreakdown.cod - eodBreakdown.online).toLocaleString()}</span>
                       </div>
                    )}
                    {eodBreakdown.online > 0 && (
                       <div className="flex justify-between">
                         <span>• ช้อปปี้/ออนไลน์:</span>
                         <span>฿{eodBreakdown.online.toLocaleString()}</span>
                       </div>
                    )}
                  </div>
                  
                  {eodBreakdown.pendingDetails && eodBreakdown.pendingDetails.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-rose-200">
                      <div className="text-[10px] font-bold text-rose-500 mb-2">รายการยอดค้าง:</div>
                      <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                        {eodBreakdown.pendingDetails.map((p, idx) => (
                          <div key={idx} className="flex flex-col text-[11px] bg-orange-500 border border-orange-600 p-2 rounded-md shadow-sm">
                            <div className="flex justify-between font-bold text-white mb-1">
                              <span className="truncate mr-2">{p.time} - {p.customer} ({p.channel})</span>
                              <span className="shrink-0">฿{p.amount?.toLocaleString()}</span>
                            </div>
                            <div className="text-[10px] text-orange-50 leading-tight">{p.items}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={() => setEodTab('confirm')} className="w-full py-3 bg-indigo-50 text-indigo-700 rounded-xl font-bold hover:bg-indigo-100 transition-colors">ถัดไป: ยืนยัน</button>
              </div>
            )}

            {eodTab === 'confirm' && (() => {
              const expectedCash = eodBreakdown.cash + (parseNumber(eodData.floatCash) || 0);
              const nonCashSales = (eodBreakdown.transfer || 0) + (eodBreakdown.credit || 0) + (eodBreakdown.cod || 0);
              const expectedTotalSystemBalance = expectedCash + nonCashSales;
              const floatCashNum = parseNumber(eodData.floatCash) || 0;
              const baseFloat = Math.floor(floatCashNum / 100) * 100;
              const expectedTheoreticalDeposit = Math.floor(expectedTotalSystemBalance / 100) * 100 - baseFloat;
              const expectedNextDayFloat = expectedTotalSystemBalance - expectedTheoreticalDeposit;
              const actualRemittedCash = parseNumber(eodData.actualCash) || 0;
              const expectedRemitAmount = expectedCash - expectedNextDayFloat;
              
              const actualTotalCash = eodData.actualCash ? actualRemittedCash + expectedNextDayFloat : expectedCash;
              const totalSystemBalance = actualTotalCash + nonCashSales;
              const totalTheoreticalDeposit = Math.floor(totalSystemBalance / 100) * 100 - baseFloat;
              
              const displayCashAmount = eodData.actualCash ? actualRemittedCash : expectedRemitAmount;

              return (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                {/* Summary Banner */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-md">
                  <h3 className="font-bold text-sm text-indigo-100 mb-3 flex items-center gap-2"><CheckCircle size={16} /> สรุปยอดเตรียมนำฝาก</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-indigo-100">เงินสด:</span>
                      <span className="font-bold">฿{displayCashAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-indigo-100">เงินโอน:</span>
                      <span className="font-bold">฿{(eodBreakdown.transfer || 0).toLocaleString()}</span>
                    </div>
                    {(eodBreakdown.credit > 0 || eodBreakdown.cod > 0) && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-indigo-100">ยอดค้าง (เครดิต/COD):</span>
                        <span className="font-bold text-orange-200">฿{((eodBreakdown.credit || 0) + (eodBreakdown.cod || 0)).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="pt-2 mt-2 border-t border-indigo-400/50 flex justify-between items-center">
                      <span className="font-bold text-base">ยอดนำฝากรวม:</span>
                      <span className="font-black text-xl">฿{totalTheoreticalDeposit.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">รูปสลิป / สรุปยอด (ไม่บังคับ)</label>
                    <div className="text-xs text-slate-500">แนบรูปถ่ายสลิปหรือใบสรุปยอด</div>
                  </div>
                  {!eodData.imageBase64 ? (
                    <label className="flex items-center gap-2 px-3 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-lg cursor-pointer hover:bg-indigo-50 transition-colors shadow-sm active:scale-95">
                      <Camera size={16} />
                      <span className="text-sm font-bold">แนบรูป</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="relative">
                      <img src={eodData.imageBase64} alt="EOD Slip" className="h-14 w-auto rounded-lg border border-slate-200 object-cover shadow-sm" />
                      <button 
                        onClick={() => setEodData({ ...eodData, imageBase64: '' })}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {isOwnerZeroEod && (
                  <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg text-sky-700 text-xs font-bold text-center">
                    👑 ไม่มีรายการขายในวันที่เลือก เจ้าของร้านส่งยอด 0 บาทได้เลย ไม่ต้องกรอกยอดเงินสด
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">ผู้ส่งยอด (พนักงาน)</label>
                  <select
                    value={eodData.submittedBy}
                    onChange={(e) => setEodData({...eodData, submittedBy: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- เลือกพนักงาน --</option>
                    {globalRole === 'owner' && <option value="owner">👑 เจ้าของร้าน</option>}
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                  
                  {eodData.submittedBy && eodData.submittedBy !== 'owner' && !isEodBackdated && (
                     <label className="flex items-center gap-2 mt-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={eodData.clockOut} 
                          onChange={(e) => setEodData({...eodData, clockOut: e.target.checked})} 
                          className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-bold text-slate-700">บันทึกเวลาออกงานของฉันด้วยเลย</span>
                     </label>
                  )}
                </div>

                {((eodData.actualCash === '' && !isOwnerZeroEod) || eodData.floatCash === '') && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs font-bold text-center">
                    * กรุณาระบุยอดเงินสดในแถบ "เงินสด" ให้ครบถ้วนก่อนยืนยัน
                  </div>
                )}

                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowEodPreviewA4(true)}
                    className="flex-1 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 bg-teal-500 hover:bg-teal-600 text-white shadow-teal-200"
                  >
                    <FileText size={24} /> พรีวิวรายงาน (A4)
                  </button>
                  <button 
                    onClick={handleEodSubmit}
                    disabled={isSubmittingEod || (eodData.actualCash === '' && !isOwnerZeroEod) || eodData.floatCash === ''}
                    className={`flex-1 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${(isSubmittingEod || (eodData.actualCash === '' && !isOwnerZeroEod) || eodData.floatCash === '') ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'}`}
                  >
                    {isSubmittingEod ? (
                      <><span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> ส่งยอด...</>
                    ) : (
                      <><CheckCircle size={24} /> ยืนยันส่งยอด</>
                    )}
                  </button>
                </div>
              </div>
              );
            })()}
          </div>
        </div>
      </div>
    )}

    {/* EOD A4 Print Preview via Portal */}
    {showEodPreviewA4 && createPortal(
      <div id="pos-print-area" className="fixed inset-0 z-[100] bg-slate-500 overflow-y-auto flex flex-col print:block print:bg-white print:static print:z-auto print:overflow-visible">
        
        <div className="sticky top-0 z-[110] bg-white border-b border-slate-300 shadow-md p-4 flex justify-between items-center print:hidden">
          <div className="flex items-center gap-3">
             <div className="bg-teal-100 text-teal-600 p-2 rounded-lg">
                <FileText size={24} />
             </div>
             <div>
               <h2 className="text-xl font-bold text-slate-800">พรีวิวรายงานสรุปยอด (A4)</h2>
               <p className="text-xs text-slate-500">ตรวจสอบรายงานก่อนสั่งพิมพ์</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowEodPreviewA4(false)} 
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-colors shadow-sm"
            >
              ปิด
            </button>
            <button 
              onClick={handleSaveA4AsImage}
              disabled={isSavingImage}
              className={`px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-md transition-colors ${isSavingImage ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'}`}
            >
              {isSavingImage ? (
                <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span> กำลังบันทึก...</>
              ) : (
                <><CheckCircle size={18} /> บันทึกเป็นรูป</>
              )}
            </button>
            <button 
              onClick={() => window.print()}
              className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-md shadow-teal-200 transition-colors"
            >
              <FileText size={18} /> สั่งพิมพ์ (A4)
            </button>
          </div>
        </div>

        <div className="flex-1 py-8 flex justify-center print:py-0 print:block">
          <div id="eod-a4-content" className="block shadow-2xl print:shadow-none print:block w-[210mm] min-h-[297mm] max-w-[210mm] text-black font-sans bg-white m-0 p-10 text-sm leading-tight mx-auto">
             <div className="text-center mb-8 border-b-2 border-slate-800 pb-4">
               <h1 className="font-bold text-3xl mb-2">รายงานสรุปยอดประจำวัน</h1>
               <h2 className="font-semibold text-lg text-slate-600">สาขา {globalBranch || 'สำนักงานใหญ่'}</h2>
             </div>
             
             <div className="flex justify-between mb-8 text-base">
               <div>
                 <p><span className="font-bold">วันที่:</span> {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
               </div>
             </div>

             <div className="space-y-6">
                <div>
                   <h3 className="font-bold text-lg mb-3 bg-slate-100 p-2 border-l-4 border-slate-800">สรุปยอดขายแยกตามประเภท</h3>
                   <table className="w-full text-base border-collapse border border-slate-300">
                     <tbody>
                       <tr>
                         <td className="border border-slate-300 p-3 w-2/3">ยอดขายสินค้า</td>
                         <td className="border border-slate-300 p-3 text-right font-bold">฿{eodBreakdown.productSalesAmt.toLocaleString()}</td>
                       </tr>
                       <tr>
                         <td className="border border-slate-300 p-3">ยอดขายคอร์ส/บริการ</td>
                         <td className="border border-slate-300 p-3 text-right font-bold">฿{eodBreakdown.courseSalesAmt.toLocaleString()}</td>
                       </tr>
                       <tr>
                         <td className="border border-slate-300 p-3">ยอดใช้เครดิต/ตัดคอร์ส</td>
                         <td className="border border-slate-300 p-3 text-right font-bold">฿{eodBreakdown.credit.toLocaleString()}</td>
                       </tr>
                       <tr>
                         <td className="border border-slate-300 p-3">ยอดค้างชำระ / COD</td>
                         <td className="border border-slate-300 p-3 text-right font-bold text-rose-600">฿{eodBreakdown.cod.toLocaleString()}</td>
                       </tr>
                       <tr className="bg-slate-50 font-bold text-lg">
                         <td className="border border-slate-300 p-3 text-right">รวมยอดขายสุทธิทั้งหมด</td>
                         <td className="border border-slate-300 p-3 text-right text-indigo-700">฿{(eodBreakdown.cash + eodBreakdown.transfer + eodBreakdown.credit + eodBreakdown.cod).toLocaleString()}</td>
                       </tr>
                     </tbody>
                   </table>
                </div>

                <div className="mt-6 break-inside-avoid">
                   <h3 className="font-bold text-lg mb-3 bg-slate-100 p-2 border-l-4 border-slate-800">สรุปกระแสเงินสด (Cash Flow)</h3>
                   <table className="w-full text-base border-collapse border border-slate-300">
                     <tbody>
                       <tr>
                         <td className="border border-slate-300 p-3 w-2/3">เงินทอนตั้งต้น (นับตอนเปิดร้าน)</td>
                         <td className="border border-slate-300 p-3 text-right font-bold text-slate-600">฿{(parseNumber(eodData.floatCash) || 0).toLocaleString()}</td>
                       </tr>
                       <tr>
                         <td className="border border-slate-300 p-3">ยอดรับเงินสด (ในระบบ)</td>
                         <td className="border border-slate-300 p-3 text-right font-bold text-emerald-600">+ ฿{eodBreakdown.cash.toLocaleString()}</td>
                       </tr>
                       <tr className="bg-slate-50 font-bold text-lg">
                         <td className="border border-slate-300 p-3 text-right">ยอดรวมเงินสดที่ควรมี</td>
                         <td className="border border-slate-300 p-3 w-2/3">ยอดรวมเงินสดในลิ้นชัก (รวมเงินทอน)</td>
                         <td className="border border-slate-300 p-3 text-right font-bold text-emerald-600">฿{(() => {
                            const expected = eodBreakdown.cash + (parseNumber(eodData.floatCash) || 0);
                            const nonCashTemp = (eodBreakdown.transfer || 0) + (eodBreakdown.credit || 0) + (eodBreakdown.cod || 0);
                            const baseFloatTemp = Math.floor((parseNumber(eodData.floatCash) || 0) / 100) * 100;
                            const expTotalTemp = expected + nonCashTemp;
                            const expDepTemp = Math.floor(expTotalTemp / 100) * 100 - baseFloatTemp;
                            const expFloatTemp = expTotalTemp - expDepTemp;
                            const actualRemitted = parseNumber(eodData.actualCash);
                            const actual = eodData.actualCash ? actualRemitted + expFloatTemp : expected;
                            return actual.toLocaleString();
                         })()}</td>
                       </tr>
                       <tr>
                         <td className="border border-slate-300 p-3">ยอดขายช่องทางอื่น (โอน/เครดิต/COD)</td>
                         <td className="border border-slate-300 p-3 text-right font-bold text-blue-600">฿{((eodBreakdown.transfer || 0) + (eodBreakdown.credit || 0) + (eodBreakdown.cod || 0)).toLocaleString()}</td>
                       </tr>
                       <tr className="bg-slate-50 font-bold text-lg">
                         <td className="border border-slate-300 p-3 text-right">ยอดรวมสุทธิทั้งระบบ</td>
                         <td className="border border-slate-300 p-3 text-right text-indigo-700">฿{(() => {
                            const expected = eodBreakdown.cash + (parseNumber(eodData.floatCash) || 0);
                            const nonCashTemp = (eodBreakdown.transfer || 0) + (eodBreakdown.credit || 0) + (eodBreakdown.cod || 0);
                            const baseFloatTemp = Math.floor((parseNumber(eodData.floatCash) || 0) / 100) * 100;
                            const expTotalTemp = expected + nonCashTemp;
                            const expDepTemp = Math.floor(expTotalTemp / 100) * 100 - baseFloatTemp;
                            const expFloatTemp = expTotalTemp - expDepTemp;
                            const actualRemitted = parseNumber(eodData.actualCash);
                            const actual = eodData.actualCash ? actualRemitted + expFloatTemp : expected;
                            const nonCash = (eodBreakdown.transfer || 0) + (eodBreakdown.credit || 0) + (eodBreakdown.cod || 0);
                            return (actual + nonCash).toLocaleString();
                         })()}</td>
                       </tr>
                       <tr>
                         <td className="border border-slate-300 p-3">ยอดรวมที่ต้องฝากธนาคารทั้งหมด (ปัดเศษหลักร้อย)</td>
                         <td className="border border-slate-300 p-3 text-right font-bold text-slate-700">฿{(() => {
                            const expected = eodBreakdown.cash + (parseNumber(eodData.floatCash) || 0);
                            const nonCashTemp = (eodBreakdown.transfer || 0) + (eodBreakdown.credit || 0) + (eodBreakdown.cod || 0);
                            const baseFloatTemp = Math.floor((parseNumber(eodData.floatCash) || 0) / 100) * 100;
                            const expTotalTemp = expected + nonCashTemp;
                            const expDepTemp = Math.floor(expTotalTemp / 100) * 100 - baseFloatTemp;
                            const expFloatTemp = expTotalTemp - expDepTemp;
                            const actualRemitted = parseNumber(eodData.actualCash);
                            const actual = eodData.actualCash ? actualRemitted + expFloatTemp : expected;
                            const nonCash = (eodBreakdown.transfer || 0) + (eodBreakdown.credit || 0) + (eodBreakdown.cod || 0);
                            const totalSystemBalance = actual + nonCash;
                            const baseFloat = Math.floor((parseNumber(eodData.floatCash) || 0) / 100) * 100;
                            return (Math.floor(totalSystemBalance / 100) * 100 - baseFloat).toLocaleString();
                         })()}</td>
                       </tr>
                       <tr>
                         <td className="border border-slate-300 p-3 text-rose-600">ยอดส่งเงินสดจริง (หักยอดโอน/เครดิต/COD)</td>
                         <td className="border border-slate-300 p-3 text-right font-bold text-rose-600">- ฿{(() => {
                            const expected = eodBreakdown.cash + (parseNumber(eodData.floatCash) || 0);
                            const nonCashTemp = (eodBreakdown.transfer || 0) + (eodBreakdown.credit || 0) + (eodBreakdown.cod || 0);
                            const baseFloatTemp = Math.floor((parseNumber(eodData.floatCash) || 0) / 100) * 100;
                            const expTotalTemp = expected + nonCashTemp;
                            const expDepTemp = Math.floor(expTotalTemp / 100) * 100 - baseFloatTemp;
                            const expFloatTemp = expTotalTemp - expDepTemp;
                            const actualRemitted = parseNumber(eodData.actualCash);
                            const actual = eodData.actualCash ? actualRemitted + expFloatTemp : expected;
                            const nonCash = (eodBreakdown.transfer || 0) + (eodBreakdown.credit || 0) + (eodBreakdown.cod || 0);
                            const totalSystemBalance = actual + nonCash;
                            const baseFloat = Math.floor((parseNumber(eodData.floatCash) || 0) / 100) * 100;
                            const totalTheoreticalDeposit = Math.floor(totalSystemBalance / 100) * 100 - baseFloat;
                            const nextDayFloat = totalSystemBalance - totalTheoreticalDeposit;
                            return (actual - nextDayFloat).toLocaleString();
                         })()}</td>
                       </tr>
                       <tr className="bg-slate-50 font-bold text-lg">
                         <td className="border border-slate-300 p-3 text-right">ยอดเหลือ / เงินทอนยกไปพรุ่งนี้</td>
                         <td className="border border-slate-300 p-3 text-right text-indigo-700">฿{(() => {
                            const expected = eodBreakdown.cash + (parseNumber(eodData.floatCash) || 0);
                            const nonCashTemp = (eodBreakdown.transfer || 0) + (eodBreakdown.credit || 0) + (eodBreakdown.cod || 0);
                            const baseFloatTemp = Math.floor((parseNumber(eodData.floatCash) || 0) / 100) * 100;
                            const expTotalTemp = expected + nonCashTemp;
                            const expDepTemp = Math.floor(expTotalTemp / 100) * 100 - baseFloatTemp;
                            const expFloatTemp = expTotalTemp - expDepTemp;
                            const actualRemitted = parseNumber(eodData.actualCash);
                            const actual = eodData.actualCash ? actualRemitted + expFloatTemp : expected;
                            const nonCash = (eodBreakdown.transfer || 0) + (eodBreakdown.credit || 0) + (eodBreakdown.cod || 0);
                            const totalSystemBalance = actual + nonCash;
                            const baseFloat = Math.floor((parseNumber(eodData.floatCash) || 0) / 100) * 100;
                            const totalTheoreticalDeposit = Math.floor(totalSystemBalance / 100) * 100 - baseFloat;
                            return (totalSystemBalance - totalTheoreticalDeposit).toLocaleString();
                         })()}</td>
                       </tr>
                     </tbody>
                   </table>
                </div>

                {eodBreakdown.transferDetails?.length > 0 && (
                <div className="mt-8 break-inside-avoid">
                   <h3 className="font-bold text-lg mb-3 bg-slate-100 p-2 border-l-4 border-slate-800">รายการโอนเงิน</h3>
                   <table className="w-full text-sm border-collapse border border-slate-300">
                     <thead className="bg-slate-50">
                       <tr>
                         <th className="border border-slate-300 p-2 text-center w-16">ลำดับ</th>
                         <th className="border border-slate-300 p-2 text-center w-24">เวลา</th>
                         <th className="border border-slate-300 p-2 text-left">ลูกค้า</th>
                         <th className="border border-slate-300 p-2 text-right w-32">จำนวนเงิน</th>
                       </tr>
                     </thead>
                     <tbody>
                       {eodBreakdown.transferDetails.map((t, idx) => (
                         <tr key={idx}>
                           <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                           <td className="border border-slate-300 p-2 text-center">{t.time}</td>
                           <td className="border border-slate-300 p-2">{t.customer}</td>
                           <td className="border border-slate-300 p-2 text-right font-bold">฿{t.amount.toLocaleString()}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                </div>
                )}

                {eodBreakdown.allSalesDetails?.length > 0 && (
                <div className="mt-8 break-inside-avoid">
                   <h3 className="font-bold text-lg mb-3 bg-slate-100 p-2 border-l-4 border-slate-800">รายการขาย / ใช้บริการทั้งหมด</h3>
                   <table className="w-full text-xs border-collapse border border-slate-300">
                     <thead className="bg-slate-50">
                       <tr>
                         <th className="border border-slate-300 p-2 text-center w-12">ลำดับ</th>
                         <th className="border border-slate-300 p-2 text-center w-16">เวลา</th>
                         <th className="border border-slate-300 p-2 text-left w-32">ลูกค้า</th>
                         <th className="border border-slate-300 p-2 text-left">รายการ</th>
                         <th className="border border-slate-300 p-2 text-right w-24">ยอดเงิน</th>
                         <th className="border border-slate-300 p-2 text-center w-24">ช่องทาง</th>
                       </tr>
                     </thead>
                     <tbody>
                       {eodBreakdown.allSalesDetails.map((t, idx) => (
                         <tr key={idx}>
                           <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                           <td className="border border-slate-300 p-2 text-center leading-tight">
                             <div className="font-bold">{t.time}</div>
                             <div className="text-[9px] text-slate-500 mt-0.5">{t.orderNo}</div>
                           </td>
                           <td className="border border-slate-300 p-2">{t.customer}</td>
                           <td className="border border-slate-300 p-2">
                             {Array.isArray(t.details) ? (
                               <ul className="list-disc list-inside space-y-0.5">
                                 {t.details.map((item, i) => (
                                   <li key={i} className="text-xs">
                                     {item.name} <span className="text-slate-500 font-semibold ml-1">x{item.qty}</span>
                                   </li>
                                 ))}
                               </ul>
                             ) : (
                               <div className="text-xs">{t.details}</div>
                             )}
                           </td>
                           <td className="border border-slate-300 p-2 text-right font-bold">{t.amount > 0 ? `฿${t.amount.toLocaleString()}` : '-'}</td>
                           <td className="border border-slate-300 p-2 text-center">
                             <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${t.paymentStr === 'ตัดคอร์ส' ? 'bg-fuchsia-100 text-fuchsia-700' : t.paymentStr?.includes('เงินสด') ? 'bg-emerald-100 text-emerald-700' : t.paymentStr?.includes('โอนเงิน') ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                               {t.paymentStr || '-'}
                             </span>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                </div>
                )}
             </div>

             <div className="mt-20 flex justify-between text-center px-10 break-inside-avoid">
                <div>
                   <div className="border-b border-slate-400 w-48 mx-auto mb-2"></div>
                   <p className="font-bold">(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</p>
                   <p className="mt-1 text-slate-600">ผู้สรุปยอด / พนักงาน</p>
                </div>
                <div>
                   <div className="border-b border-slate-400 w-48 mx-auto mb-2"></div>
                   <p className="font-bold">(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</p>
                   <p className="mt-1 text-slate-600">ผู้ตรวจสอบ / ผู้รับเงิน</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    , document.body)}

    {/* ---- Signature Modal ---- */}
    {isPaymentModalOpen && showSignaturePad && (
        <React.Suspense fallback={<div className="fixed inset-0 z-[60] flex items-center justify-center"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div></div>}>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
                <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-slate-700">ลายเซ็นลูกค้า (จำเป็น)</h3>
                        <button onClick={() => setShowSignaturePad(false)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-xl transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-4">
                        <SignaturePad 
                            onSave={(dataUrl) => {
                                setCustomerSignature(dataUrl);
                                setShowSignaturePad(false);
                            }}
                            onCancel={() => setShowSignaturePad(false)}
                        />
                    </div>
                </div>
            </div>
        </React.Suspense>
    )}

    {/* Stock Input Modal */}
    {stockInputModal.isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 relative zoom-in-95 animate-in">
          <button onClick={() => setStockInputModal({ isOpen: false, item: null, inputVal: '' })} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full p-2 transition-colors">
            <X size={20} />
          </button>
          
          <div className="text-center mb-6 mt-2">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package size={32} className="text-rose-500" />
            </div>
            <h3 className="text-xl font-black text-slate-800 leading-tight">{String(getFuzzyKey(stockInputModal.item, ["ชื่อสินค้า", "col_2"]))}</h3>
            <p className="text-sm text-slate-500 mt-1">รหัส: {String(getFuzzyKey(stockInputModal.item, ["รหัส", "col_1"]))}</p>
          </div>
          
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">นับสต๊อกได้จริง (ชิ้น)</label>
            <input 
              type="number"
              min="0"
              autoFocus
              className="w-full text-center text-4xl font-black py-4 bg-slate-50 border-2 border-slate-200 focus:border-rose-400 rounded-2xl outline-none transition-colors"
              value={stockInputModal.inputVal}
              onChange={(e) => setStockInputModal(prev => ({ ...prev, inputVal: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && stockInputModal.inputVal !== '') {
                  const newStock = Number(stockInputModal.inputVal);
                  const oldStock = parseNumber(getBranchStock(stockInputModal.item, globalBranch || 'สำนักงานใหญ่'));
                  setStockAdjustments(prev => {
                    const existing = prev.filter(a => a.id !== stockInputModal.item.id);
                    return [...existing, { 
                      id: stockInputModal.item.id, 
                      name: String(getFuzzyKey(stockInputModal.item, ["ชื่อสินค้า", "col_2"])),
                      oldStock, 
                      newStock, 
                      diff: newStock - oldStock,
                      originalItem: stockInputModal.item
                    }];
                  });
                  setStockInputModal({ isOpen: false, item: null, inputVal: '' });
                }
              }}
            />
          </div>
          
          <button 
            onClick={() => {
              if (stockInputModal.inputVal === '') return;
              const newStock = Number(stockInputModal.inputVal);
              const oldStock = parseNumber(getBranchStock(stockInputModal.item, globalBranch || 'สำนักงานใหญ่'));
              setStockAdjustments(prev => {
                const existing = prev.filter(a => a.id !== stockInputModal.item.id);
                return [...existing, { 
                  id: stockInputModal.item.id, 
                  name: String(getFuzzyKey(stockInputModal.item, ["ชื่อสินค้า", "col_2"])),
                  oldStock, 
                  newStock, 
                  diff: newStock - oldStock,
                  originalItem: stockInputModal.item
                }];
              });
              setStockInputModal({ isOpen: false, item: null, inputVal: '' });
            }}
            disabled={stockInputModal.inputVal === ''}
            className="w-full py-4 bg-rose-500 hover:bg-rose-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-black text-lg shadow-lg shadow-rose-200 transition-all active:scale-95"
          >
            บันทึก
          </button>
        </div>
      </div>
    )}

    {/* Stock Confirm Modal */}
    {isStockConfirmModalOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl relative flex flex-col max-h-[90vh] zoom-in-95 animate-in">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Package className="text-rose-500" /> ยืนยันการปรับปรุงสต๊อก
            </h3>
            <button onClick={() => setIsStockConfirmModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors bg-slate-50 hover:bg-slate-100">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-5 overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-3 font-bold rounded-tl-xl">รายการสินค้า</th>
                  <th className="p-3 font-bold text-center">สต๊อกเดิม</th>
                  <th className="p-3 font-bold text-center">สต๊อกใหม่</th>
                  <th className="p-3 font-bold text-center rounded-tr-xl">ผลต่าง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockAdjustments.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-sm text-slate-800">{item.name}</td>
                    <td className="p-3 text-center text-slate-600 font-medium">{item.oldStock}</td>
                    <td className="p-3 text-center text-rose-600 font-black">{item.newStock}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${item.diff > 0 ? 'bg-emerald-50 text-emerald-600' : item.diff < 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                        {item.diff > 0 ? '+' : ''}{item.diff}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-5 border-t border-slate-100 shrink-0 flex gap-3 pb-safe">
            <button 
              onClick={() => setIsStockConfirmModalOpen(false)}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-colors"
            >
              ยกเลิก
            </button>
            <button 
              onClick={async () => {
                try {
                  const batch = writeBatch(db);
                  
                  for (const adj of stockAdjustments) {
                    const pRef = doc(db, 'products', adj.id);
                    const targetBranch = globalBranch || 'เฉวง';
                    const currentStockByBranch = adj.originalItem?.stock_by_branch || {};
                    const newStockByBranch = { ...currentStockByBranch, [targetBranch]: adj.newStock };
                    batch.set(pRef, { stock_by_branch: newStockByBranch }, { merge: true });
                  }
                  
                  await batch.commit();
                  showToast('อัปเดตสต๊อกเรียบร้อยแล้ว', 'success');
                  setStockAdjustments([]);
                  setIsStockConfirmModalOpen(false);
                  setIsStockMode(false);
                } catch(e) {
                  showToast('เกิดข้อผิดพลาดในการอัปเดตสต๊อก', 'error');
                }
              }}
              className="flex-[2] py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black shadow-lg shadow-rose-200 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle size={20} /> ยืนยันการอัปเดตสต๊อก
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Web Orders Modal */}
    {showWebOrdersModal && (
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:hidden">
        <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-sky-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-500 text-white rounded-xl flex items-center justify-center shadow-md">
                <Package size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 leading-tight">ออเดอร์จากเว็บ (WooCommerce)</h2>
                <p className="text-sm text-slate-500">สถานะ: กำลังดำเนินการ (Processing)</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={fetchWebOrdersManual} 
                disabled={isFetchingWebOrders}
                className="flex items-center gap-2 px-4 py-2 bg-white text-sky-600 hover:bg-sky-50 rounded-xl font-bold transition-colors shadow-sm disabled:opacity-50"
              >
                <Clock size={18} className={isFetchingWebOrders ? "animate-spin" : ""} /> 
                {isFetchingWebOrders ? "กำลังดึง..." : "ดึงออเดอร์ล่าสุด"}
              </button>
              <button onClick={() => setShowWebOrdersModal(false)} className="w-10 h-10 flex items-center justify-center bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors shadow-sm">
                <X size={20} />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
            {isFetchingWebOrders && webOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                 <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full mb-4"></div>
                 <p className="font-semibold">กำลังดึงข้อมูลออเดอร์...</p>
              </div>
            ) : webOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                 <Package size={48} className="mb-4 opacity-20" />
                 <p className="font-bold text-lg text-slate-500">ไม่มีออเดอร์ใหม่</p>
                 <p className="text-sm">ระบบจะดึงข้อมูลอัตโนมัติทุกๆ 1 นาที</p>
              </div>
            ) : (
              <div className="space-y-4">
                {webOrders.map(order => {
                  const s = order.shipping || {};
                  const b = order.billing || {};
                  const addrStr = `${s.first_name || b.first_name || ''} ${s.last_name || b.last_name || ''}\n${s.phone || b.phone || ''}\n${s.address_1 || b.address_1 || ''} ${s.address_2 || b.address_2 || ''} ${s.city || b.city || ''} ${s.state || b.state || ''} ${s.postcode || b.postcode || ''}`.trim();
                  
                  return (
                    <div key={order.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-indigo-100 text-indigo-700 font-bold text-xs px-2 py-1 rounded-md">#{order.id}</span>
                            <span className="text-slate-500 text-sm">{new Date(order.date_created).toLocaleString('th-TH')}</span>
                            <span className="bg-emerald-100 text-emerald-700 font-bold text-xs px-2 py-1 rounded-md">{order.payment_method_title || order.payment_method}</span>
                          </div>
                          <h3 className="font-bold text-lg text-slate-800 mb-1">{b.first_name} {b.last_name}</h3>
                          <p className="text-sm text-slate-600 line-clamp-2">{addrStr.replace(/\n/g, ' ')}</p>
                          
                          <div className="mt-4 space-y-1">
                            {order.line_items.map((item, idx) => (
                              <div key={item.id} className="text-sm flex gap-2">
                                <span className="text-slate-400">{idx+1}.</span>
                                <span className="font-semibold text-slate-700 flex-1">{item.name}</span>
                                <span className="text-slate-500">x{item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex flex-col justify-between items-end min-w-[150px] border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-4">
                          <div className="text-right mb-4">
                            <div className="text-xs text-slate-500 font-semibold">ยอดสุทธิ</div>
                            <div className="text-2xl font-black text-indigo-600">฿{parseFloat(order.total).toLocaleString()}</div>
                          </div>
                          
                          <div className="flex flex-col gap-2 w-full">
                            <button
                              onClick={() => {
                                // Import Logic
                                const newCart = [];
                                let missingItems = [];
                                
                                order.line_items.forEach(wItem => {
                                const wName = wItem.name.toLowerCase();
                                const wSku = (wItem.sku || '').toUpperCase();
                                const posProduct = products.find(p => {
                                   const pName = String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2"])).toLowerCase();
                                   const pSku = String(getFuzzyKey(p, ["รหัส", "col_1"])).toUpperCase();
                                   return (wSku && pSku === wSku) || pName.includes(wName) || wName.includes(pName);
                                });
                                
                                if (posProduct) {
                                  const fullPrice = parseNumber(getFuzzyKey(posProduct, ["ราคาขายเต็ม", "col_6"]));
                                  
                                  newCart.push({
                                    id: posProduct.id,
                                    name: String(getFuzzyKey(posProduct, ["ชื่อสินค้า", "col_2"])),
                                    price: parseFloat(wItem.price) || fullPrice,
                                    originalPrice: fullPrice,
                                    qty: wItem.quantity,
                                    type: 'product',
                                    maxQty: parseQty(getFuzzyKey(posProduct, ["จำนวนคงเหลือ", "col_12"])),
                                    originalItem: posProduct,
                                    isManualPrice: true
                                  });
                                } else {
                                  missingItems.push(wItem.name);
                                }
                              });
                              
                              if (missingItems.length > 0) {
                                showToast(`ไม่พบสินค้าในระบบ: ${missingItems.join(', ')} (กรุณาเพิ่มเอง)`, 'error');
                              }
                              
                              setCart(newCart);
                              setOrderChannel('web');
                              setActiveWcOrderId(String(order.id));
                              setShippingAddress(addrStr);
                              
                              const totalAmt = parseFloat(order.total) || 0;
                              const isCod = String(order.payment_method).toLowerCase() === 'cod';
                              setSplitPayment({
                                cash: 0,
                                transfer: isCod ? 0 : totalAmt,
                                cod: isCod ? totalAmt : 0,
                                credit: 0
                              });
                              
                              setShowWebOrdersModal(false);
                              showToast('นำเข้าออเดอร์สำเร็จ! กรุณาตรวจสอบและชำระเงิน', 'success');
                            }}
                            className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold shadow-md shadow-sky-200 transition-all flex items-center justify-center gap-2"
                          >
                            <ShoppingCart size={16} /> นำเข้าตะกร้า
                          </button>

                          <button
                            onClick={async () => {
                              const trackingNo = prompt(`สแกนหรือพิมพ์เลขพัสดุสำหรับออเดอร์ #${order.id}:`);
                              if (!trackingNo) return;
                              
                              try {
                                setIsFetchingWebOrders(true);
                                await fetchWithProxy(`https://irisnatures.com/wp-json/wc/v3/orders/${order.id}`, {
                                    method: 'PUT',
                                    body: JSON.stringify({
                                        status: 'completed',
                                        meta_data: [{ key: 'tracking_number', value: trackingNo }]
                                    })
                                }, true);
                                
                                await fetchWithProxy(`https://irisnatures.com/wp-json/wc/v3/orders/${order.id}/notes`, {
                                    method: 'POST',
                                    body: JSON.stringify({
                                        note: `ออเดอร์ของคุณถูกจัดส่งแล้ว\nหมายเลขพัสดุ (Tracking Number): ${trackingNo}`,
                                        customer_note: true
                                    })
                                });
                                
                                showToast('อัปเดตสถานะจัดส่งเรียบร้อยแล้ว', 'success');
                                fetchWebOrdersManual();
                              } catch (err) {
                                showToast('เกิดข้อผิดพลาดในการจัดส่ง', 'error');
                                setIsFetchingWebOrders(false);
                              }
                            }}
                            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-md shadow-emerald-200 transition-colors flex items-center justify-center gap-2"
                          >
                            <Truck size={16} /> ระบุเลขพัสดุ (จัดส่ง)
                          </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    {/* Stock Compare Modal */}
    {showStockCompare && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
            <div>
              <h2 className="text-xl font-bold text-slate-800">เปรียบเทียบสต๊อก POS vs เว็บ</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {isLoadingCompare ? 'กำลังโหลด...' : `${stockCompareData.length} สินค้าใน POS · จับคู่ได้ ${stockCompareData.filter(r => r.matched).length} รายการ (เทียบจากรหัส SKU)`}
              </p>
            </div>
            <button onClick={() => setShowStockCompare(false)} className="w-9 h-9 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-xl"><X size={18} className="text-slate-500"/></button>
          </div>

          <div className="overflow-y-auto flex-1">
            {isLoadingCompare ? (
              <div className="flex items-center justify-center py-20">
                <span className="animate-spin w-8 h-8 border-4 border-violet-400 border-t-transparent rounded-full mr-3"></span>
                <span className="text-slate-500 font-medium">กำลังดึงข้อมูลจากเว็บ...</span>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left p-3 font-semibold text-slate-600">รหัส (SKU)</th>
                    <th className="text-left p-3 font-semibold text-slate-600">ชื่อสินค้า (POS)</th>
                    <th className="text-center p-3 font-semibold text-slate-600">สต๊อก POS</th>
                    <th className="text-center p-3 font-semibold text-slate-600">สต๊อกบนเว็บ</th>
                    <th className="text-center p-3 font-semibold text-slate-600">ต่าง</th>
                  </tr>
                </thead>
                <tbody>
                  {stockCompareData.map((row, i) => {
                    const wooNum = typeof row.wooStock === 'number' ? row.wooStock : null;
                    const diff = wooNum !== null ? row.posStock - wooNum : null;
                    const isOk = diff === 0;
                    const notManaged = row.matched && row.wooStock === null;
                    return (
                      <tr key={i} className={`border-b border-slate-100 ${!row.matched ? 'bg-orange-50' : isOk ? '' : 'bg-rose-50'}`}>
                        <td className="p-3 font-mono text-xs text-slate-500">{row.sku || <span className="text-slate-300 italic">ไม่มีรหัส</span>}</td>
                        <td className="p-3 font-semibold text-slate-800">{row.name}</td>
                        <td className="p-3 text-center font-bold text-indigo-600">{row.posStock}</td>
                        <td className="p-3 text-center">
                          {!row.matched ? <span className="text-orange-500 font-semibold">ไม่พบบนเว็บ</span>
                           : notManaged ? <span className="text-slate-400">ไม่ได้จัดการสต๊อก</span>
                           : <span className={`font-bold ${isOk ? 'text-emerald-600' : 'text-rose-600'}`}>{wooNum}</span>}
                        </td>
                        <td className="p-3 text-center font-bold">
                          {diff === null ? '-'
                           : diff === 0 ? <span className="text-emerald-600">✓</span>
                           : <span className="text-rose-600">{diff > 0 ? '+' : ''}{diff}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 shrink-0 flex gap-3 text-xs text-slate-400">
            <span className="w-3 h-3 rounded bg-rose-50 border border-rose-200 inline-block"></span> สต๊อกไม่ตรงกัน
            <span className="w-3 h-3 rounded bg-orange-50 border border-orange-200 inline-block ml-2"></span> ไม่พบสินค้าบนเว็บ
          </div>
        </div>
      </div>
    )}

      <ShopeeImportModal 
        isOpen={showShopeeModal} 
        onClose={() => setShowShopeeModal(false)} 
        products={products}
        globalBranch={globalBranch}
        showToast={showToast}
      />

      <BarcodeScannerModal
        isOpen={!!scannerTarget}
        onClose={() => setScannerTarget(null)}
        onScan={async (text) => {
           try {
             const data = JSON.parse(text);
             if (data.type === 'voucher' && data.code) {
                 await handleVoucherScan(data.code, data.phone || null);
                 setScannerTarget(null);
                 return;
             }
             if (data.type === 'reward' && data.code) {
                 await handleRewardRedemptionScan(data.code, data.customerId || data.phone);
                 setScannerTarget(null);
                 return;
             }
             if (scannerTarget === 'creditPayment' && (data.type === 'credit_pay' || data.phone || data.customerPhone || data.code)) {
                 if (data.type === 'credit_pay' && data.timestamp) {
                     const now = Date.now();
                     const qrTime = new Date(data.timestamp).getTime();
                     if (now - qrTime > 5 * 60 * 1000) {
                         showToast("ข้อผิดพลาด", "QR Code หมดอายุ กรุณาสร้างใหม่จากแอป", "error");
                         setScannerTarget(null);
                         return;
                     }
                 }
                 const phoneToMatch = data.phone || data.customerPhone || data.code;
                 const cleanMatch = phoneToMatch.replace(/[^0-9]/g, '');
                 const foundCustomer = customers.find(c => String(getFuzzyKey(c, ["เบอร์โทร", "col_3", "phone"]) || '').replace(/[^0-9]/g, '') === cleanMatch);
                 if (foundCustomer) {
                     setSelectedCustomer(foundCustomer);
                     const myCourses = courses.filter(c => String(getFuzzyKey(c, ["เบอร์โทร", "col_1"]) || '').trim() === String(foundCustomer.computedPhone).trim());
                     const creditBal = myCourses.reduce((sum, c) => sum + (c.computedRemainCredit || 0), 0);
                     const currentOthersTotal = totalPaid - (splitPayment.credit || 0);
                     let fillAmt = Math.max(0, total - currentOthersTotal);
                     if (fillAmt > creditBal) fillAmt = creditBal;
                     
                     if (fillAmt > 0) {
                       setSplitPayment(prev => ({ ...prev, credit: fillAmt }));
                       showToast("สแกนรับชำระด้วยเครดิตสำเร็จ", `หักเครดิต ${fillAmt.toLocaleString()} บาท`, "success");
                       
                       if (fillAmt + currentOthersTotal >= total) {
                           setTimeout(() => {
                               const btn = document.getElementById('btn-confirm-checkout');
                               if (btn && !btn.disabled) btn.click();
                           }, 500);
                       }
                     } else {
                       showToast("สแกนและดึงข้อมูลลูกค้าสำเร็จ", "เครดิตไม่เพียงพอหรือไม่มียอดต้องชำระ", "success");
                     }
                 } else {
                     showToast("สแกนล้มเหลว", "ไม่พบข้อมูลลูกค้าจาก QR Code", "error");
                 }
                 setScannerTarget(null);
                 return;
             }
          } catch(e) {
             // Not JSON, continue with normal processing
          }

          if (scannerTarget === 'creditPayment') {
              let cleanMatch = text.replace(/[^0-9]/g, '');
              let foundCustomer = null;
              if (cleanMatch && cleanMatch.length >= 10) {
                  foundCustomer = customers.find(c => String(getFuzzyKey(c, ["เบอร์โทร", "col_3", "phone"]) || '').replace(/[^0-9]/g, '') === cleanMatch);
              }
              if (foundCustomer) {
                  setSelectedCustomer(foundCustomer);
                  const myCourses = courses.filter(c => String(getFuzzyKey(c, ["เบอร์โทร", "col_1"]) || '').trim() === String(foundCustomer.computedPhone || getFuzzyKey(foundCustomer, ["เบอร์โทร", "col_3"])).trim());
                  const creditBal = myCourses.reduce((sum, c) => sum + (c.computedRemainCredit || 0), 0);
                  const currentOthersTotal = totalPaid - (splitPayment.credit || 0);
                  let fillAmt = Math.max(0, total - currentOthersTotal);
                  if (fillAmt > creditBal) fillAmt = creditBal;
                  
                  if (fillAmt > 0) {
                    setSplitPayment(prev => ({ ...prev, credit: fillAmt }));
                    showToast("สแกนรับชำระด้วยเครดิตสำเร็จ", `หักเครดิต ${fillAmt.toLocaleString()} บาท`, "success");
                    
                    if (fillAmt + currentOthersTotal >= total) {
                        setTimeout(() => {
                            const btn = document.getElementById('btn-confirm-checkout');
                            if (btn && !btn.disabled) btn.click();
                        }, 500);
                    }
                  } else {
                    showToast("สแกนและดึงข้อมูลลูกค้าสำเร็จ", "เครดิตไม่เพียงพอหรือไม่มียอดต้องชำระ", "success");
                  }
              } else {
                  await handleVoucherScan(text);
              }
              setScannerTarget(null);
              return;
          }

          if (scannerTarget === 'wcOrder') {
             setActiveWcOrderId(text);
             showToast(`แสกนหมายเลขอ้างอิง: ${text}`, 'success');
          } else if (scannerTarget === 'trackingNo') {
             // 📮 สแกนเลขพัสดุจากใบเสร็จขนส่ง → ใส่ช่องเลขพัสดุตอนชำระเงิน
             setPosTrackingNo(String(text).trim());
             showToast('สแกนเลขพัสดุสำเร็จ', String(text).trim(), 'success');
          } else if (scannerTarget === 'productSearch') {
             setSearchTerm(text);
             showToast(`แสกนค้นหาสินค้า: ${text}`, 'success');
          } else if (scannerTarget === 'voucher') {
              await handleVoucherScan(text);
             setScannerTarget(null);
          } else if (scannerTarget === 'customerSearch') {
             // Check if it's a booking ID or Ref
             const booking = bookings.find(b => b.id === text || String(b.ticketNo || '') === text || String(b.bookingRef || '') === text);
             if (booking && booking.customerPhone) {
                 const customer = customers.find(c => {
                     const phone = String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '').replace(/[^0-9]/g, '');
                     return phone === String(booking.customerPhone).replace(/[^0-9]/g, '');
                 });
                 if (customer) {
                     setSelectedCustomer(customer);
                     showToast(`สแกนพบหมายเลขจองและเลือกลูกค้า: ${getFuzzyKey(customer, ["ชื่อ", "col_1"])}`, 'success');
                     setScannerTarget(null);
                     return;
                 }
             }

             // Check if it's a course invoice number
             const course = courses.find(c => String(getFuzzyKey(c, ["เลขที่ใบคอส", "col_2"])) === text);
             if (course) {
                 const coursePhone = String(getFuzzyKey(course, ["เบอร์โทร", "col_1"]) || '').replace(/[^0-9]/g, '');
                 if (coursePhone) {
                     const customer = customers.find(c => {
                         const phone = String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '').replace(/[^0-9]/g, '');
                         return phone === coursePhone;
                     });
                     if (customer) {
                         setSelectedCustomer(customer);
                         showToast(`สแกนพบใบคอร์สและเลือกลูกค้า: ${getFuzzyKey(customer, ["ชื่อ", "col_1"])}`, 'success');
                         setScannerTarget(null);
                         return;
                     }
                 }
             }

             // Check if it's phone number exactly
             if (/^0\d{9}$/.test(text)) {
                 const customer = customers.find(c => {
                    const phone = String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '').replace(/[^0-9]/g, '');
                    return phone === text;
                 });
                 if (customer) {
                     setSelectedCustomer(customer);
                     showToast(`สแกนพบลูกค้า: ${getFuzzyKey(customer, ["ชื่อ", "col_1"])}`, 'success');
                     setScannerTarget(null);
                     return;
                 }
             }

             setCustomerSearch(text);
             setIsCustomerDropdownOpen(true);
             showToast(`แสกนข้อมูลลูกค้าสำเร็จ`, 'success');
          }
          setScannerTarget(null);
        }}
      />

      {/* Course QR Modal */}
      {courseQRModalData && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden relative">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-teal-50">
                      <h3 className="font-black text-teal-800 text-lg flex items-center gap-2">
                          <QrCode size={20} className="text-teal-600" /> คิวอาร์โค้ดคอร์ส
                      </h3>
                      <button onClick={() => setCourseQRModalData(null)} className="w-8 h-8 flex items-center justify-center bg-white text-slate-400 hover:text-slate-600 rounded-full shadow-sm">
                          <X size={18} />
                      </button>
                  </div>
                  <div className="p-6 flex flex-col items-center text-center">
                      <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-100 mb-4">
                          <QRCodeSVG 
                              value={getFuzzyKey(courseQRModalData, "เลขที่ใบคอส") || getFuzzyKey(courseQRModalData, "รหัสคอส") || ''} 
                              size={180} 
                          />
                      </div>
                      <p className="font-bold text-slate-800 mb-1 line-clamp-2">{String(getFuzzyKey(courseQRModalData, ["ชื่อคอส", "col_8"]) || '-')}</p>
                      <p className="text-sm font-mono text-slate-500 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
                          Ref: {getFuzzyKey(courseQRModalData, "เลขที่ใบคอส") || '-'}
                      </p>
                  </div>
              </div>
          </div>
      )}

      {/* 🌟 Instant Voucher Confirmation Modal 🌟 */}
      {instantVoucherModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
           <div className="bg-white w-full max-w-md rounded-[32px] p-6 sm:p-8 shadow-2xl text-center">
              <div className="w-16 h-16 bg-teal-50 text-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                <Ticket size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-1">สแกนคูปองสำเร็จ!</h3>
              <p className="text-sm font-bold text-teal-600 mb-4 bg-teal-50 inline-block px-3 py-1 rounded-lg">รหัส: {instantVoucherModal.code}</p>
              
              <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600 mb-6 text-left border border-slate-100">
                  <div className="flex justify-between mb-2">
                     <span className="font-bold">ประเภท:</span> 
                     <span>{instantVoucherModal.voucher.type === 'free_item' ? 'แลกรับฟรี' : (instantVoucherModal.voucher.type === 'percent' ? 'ส่วนลด ' + instantVoucherModal.voucher.value + '%' : 'ส่วนลด ฿' + instantVoucherModal.voucher.value)}</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="font-bold">เงื่อนไข:</span> 
                     <span>{instantVoucherModal.voucher.isPersonal ? 'คูปองส่วนตัว' : 'คูปองทั่วไป (Batch)'}</span>
                  </div>
              </div>

              <div className="flex flex-col gap-3">
                 <button onClick={() => executeVoucherAction('instant_use')} className="w-full py-3.5 bg-teal-500 hover:bg-teal-600 text-white font-black rounded-xl shadow-lg shadow-teal-200 transition-all active:scale-95 flex items-center justify-center gap-2">
                    <CheckCircle size={20} /> ใช้สิทธิ์คูปองทันที (ไม่ต้องเปิดบิล POS)
                 </button>
                 <button onClick={() => executeVoucherAction('apply_cart')} className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl transition-colors flex items-center justify-center gap-2">
                    <ShoppingCart size={20} /> นำไปเป็นส่วนลดในบิล POS
                 </button>
                 <button onClick={() => setInstantVoucherModal(null)} className="mt-2 text-sm font-bold text-slate-400 hover:text-slate-600">
                    ยกเลิก
                 </button>
              </div>
           </div>
        </div>
      )}
      
      <SalesHistoryModal
        isOpen={showSalesHistory}
        onClose={() => setShowSalesHistory(false)}
        showToast={showToast}
        globalBranch={globalBranch}
        appSettings={appSettings}
        currentMonthSales={currentMonthSales}
        todaySales={todaySales}
        todaySalesBreakdown={eodBreakdown}
        setShowEodModal={setShowEodModal}
        setShowEodPreviewA4={setShowEodPreviewA4}
        posFilterDate={posFilterDate}
        eodData={eodData}
        setEodData={setEodData}
        setPosFilterDate={setPosFilterDate}
        globalRole={globalRole}
        onPrintReceipt={(order) => {
          const items = order.cartItems || [{ name: order.courseName || 'รายการสั่งซื้อ (ย้อนหลัง)', price: Number(order.price) + Number(order.discount || 0), qty: 1, actionType: order.transactionType }];
          const subtotal = items.reduce((sum, item) => sum + (Number(item.price) * (item.qty || 1)), 0);
          setReceiptData({
            orderNo: order.orderNo,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            items,
            subtotal,
            total: Number(order.price),
            globalDiscount: Number(order.discount || 0),
            totalSaved: 0,
            paymentMethodStr: order.paymentMethod,
            orderChannel: order.orderChannel,
            shippingAddress: order.shippingAddress,
            splitPayment: order.splitPayment || { cash: 0, transfer: 0, cod: 0, credit: 0 },
            createdAt: new Date(order.createdAt)
          });
          setShowPreviewModal(true);
          setPrintMode('receipt');
        }}
      />
      
      {viewCourseDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewCourseDetails(null)}></div>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-pink-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FileText size={18} className="text-pink-500" /> รายละเอียดคอร์ส
              </h3>
              <button onClick={() => setViewCourseDetails(null)} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-full transition-colors"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <div className="text-[10px] font-mono text-pink-500 font-bold mb-1">{String(getFuzzyKey(viewCourseDetails, ["รหัสคอส", "col_1"]) || '-')}</div>
                <h4 className="text-lg font-black text-slate-900">{String(getFuzzyKey(viewCourseDetails, ["ชื่อคอส", "col_4"]) || '-')}</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-500 font-bold mb-1">ราคาขาย</div>
                  <div className="font-bold text-slate-800">฿{parseNumber(getFuzzyKey(viewCourseDetails, ["ราคา", "ราคาขาย", "col_5"])).toLocaleString()}</div>
                </div>
                <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                  <div className="text-[10px] text-orange-600 font-bold mb-1">เครดิต / วงเงิน</div>
                  <div className="font-bold text-orange-700">฿{parseNumber(getFuzzyKey(viewCourseDetails, ["เครดิตที่ได้รับ", "เครดิต", "col_8", "วงเงิน"])).toLocaleString()}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-bold bg-pink-100 text-pink-700 px-2 py-1 rounded-lg">หมวดหมู่: {String(getFuzzyKey(viewCourseDetails, ["ประเภท", "col_2"]) || '-')}</span>
                {getFuzzyKey(viewCourseDetails, ["กำหนดเวลา"]) && (
                  <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded-lg">⏳ อายุ {getFuzzyKey(viewCourseDetails, ["กำหนดเวลา"])}</span>
                )}
                {getFuzzyKey(viewCourseDetails, ["ฟรีบัตรสมาชิก"]) === 'ใช่' && (
                  <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded-lg">💳 แถม VIP Card</span>
                )}
              </div>

              {getFuzzyKey(viewCourseDetails, ["รายการที่ได้รับ", "col_11"]) && (
                <div>
                  <div className="text-xs font-bold text-slate-700 mb-2">รายการที่ได้รับในคอร์ส:</div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                    {String(getFuzzyKey(viewCourseDetails, ["รายการที่ได้รับ", "col_11"]))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <button onClick={() => { addToCart(viewCourseDetails, 'course'); setViewCourseDetails(null); }} className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-2.5 rounded-xl transition-all shadow-sm shadow-pink-500/20">
                เพิ่มลงตะกร้า
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedCourseForUsage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedCourseForUsage(null)}></div>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-teal-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Layers size={18} className="text-teal-600" /> จัดการคอร์ส
              </h3>
              <button onClick={() => setSelectedCourseForUsage(null)} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-full transition-colors"><X size={18} /></button>
            </div>
            
            <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Course Info */}
              <div>
                <div className="text-[10px] font-mono text-teal-600 font-bold mb-1">{String(getFuzzyKey(selectedCourseForUsage, ["รหัสคอส", "col_1"]) || '-')}</div>
                <h4 className="text-lg font-black text-slate-900 leading-tight">{String(getFuzzyKey(selectedCourseForUsage, ["ชื่อคอส", "col_8"]) || '-')}</h4>
              </div>

              {/* Action 1: Use Session */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                 <div className="flex justify-between items-center mb-3">
                    <div>
                       <div className="font-bold text-slate-800">ตัดคอร์ส / รับบริการ</div>
                       <div className="text-xs text-slate-500">ใช้จำนวนครั้งการทำหน้า</div>
                    </div>
                    <div className="text-right">
                       <div className="text-xs text-slate-500">คงเหลือ</div>
                       <div className="font-black text-teal-600">{selectedCourseForUsage.computedStatus === 'ใช้ครบแล้ว' ? 0 : (selectedCourseForUsage.computedTotalQty > 0 ? selectedCourseForUsage.computedTotalQty - selectedCourseForUsage.computedUsedQty : 'ไม่จำกัด')}</div>
                    </div>
                 </div>
                 <button 
                   onClick={() => {
                      addToCart(selectedCourseForUsage, 'usage');
                      setCheckoutStep(1);
                      setShowPaymentModal(true);
                      setSelectedCourseForUsage(null);
                   }}
                   disabled={selectedCourseForUsage.computedStatus === 'ใช้ครบแล้ว'}
                   className={`w-full py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${selectedCourseForUsage.computedStatus === 'ใช้ครบแล้ว' ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-200'}`}
                 >
                   <Scissors size={18} /> ตัดคอร์สทำหน้า
                 </button>
              </div>

              {/* Action 2: Claim Items */}
              {(() => {
                 const courseName = String(getFuzzyKey(selectedCourseForUsage, ["ชื่อคอส", "col_8"]) || '');
                 const originalMaster = masterCourses.find(m => String(getFuzzyKey(m, ["ชื่อคอส", "col_4"])) === courseName) || products.find(p => String(getFuzzyKey(p, ["ชื่อสินค้า", "col_4"])) === courseName);

                 let includedItemsRaw = String(getFuzzyKey(selectedCourseForUsage, ["รายการที่ได้รับ", "col_11"]) || '');
                 let hasVip = String(getFuzzyKey(selectedCourseForUsage, ["ฟรีบัตรสมาชิก"]) || '') === 'ใช่';
                 
                 if (!includedItemsRaw && originalMaster) {
                    includedItemsRaw = String(getFuzzyKey(originalMaster, ["รายการที่ได้รับ", "col_11"]) || '');
                 }
                 if (!hasVip && originalMaster) {
                    hasVip = String(getFuzzyKey(originalMaster, ["ฟรีบัตรสมาชิก"]) || '') === 'ใช่';
                 }
                 
                 let items = [];
                 if (includedItemsRaw) {
                    let cleanStr = includedItemsRaw
                        .replace(/สินค้าที่ได้รับ:\s*/g, '')
                        .replace(/คอร์สย่อย\/เสริม:\s*/g, '');

                    let chunks = cleanStr.split('-').map(s => s.trim()).filter(s => s);

                    items = chunks.map(chunk => {
                       let name = chunk;
                       let qty = 1;
                       const match = name.match(/(.*?)\s*(?:\((\d+)\s*(?:ชิ้น|ครั้ง)\)|x\s*(\d+))$/);
                       if (match) {
                          name = match[1].trim();
                          qty = parseInt(match[2] || match[3], 10);
                       }
                       return { original: chunk, name, qty };
                    });
                 }
                 if (hasVip) items.push({ original: 'บัตรสมาชิก VIP', name: 'บัตรสมาชิก VIP', qty: 1 });

                 if (items.length === 0) return null;

                 return (
                    <div>
                       <div className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                          <Package size={18} className="text-pink-500"/> เบิกสินค้า / ของแถม
                       </div>
                       <div className="space-y-2">
                          {items.map((item, idx) => {
                             const claimedCount = (selectedCourseForUsage.claimedItems || []).filter(c => c === item.name).length;
                             const isClaimed = claimedCount >= item.qty;
                             return (
                                <div key={idx} className={`flex justify-between items-center p-3 rounded-lg border ${isClaimed ? 'bg-slate-50 border-slate-200' : 'bg-white border-pink-100 shadow-sm'}`}>
                                   <div className={`text-sm ${isClaimed ? 'text-slate-400 line-through' : 'font-semibold text-slate-700'}`}>
                                      {item.name} <span className="text-xs ml-1 text-slate-400 font-normal">(เหลือ {item.qty - claimedCount}/{item.qty})</span>
                                   </div>
                                   <button 
                                      onClick={() => {
                                         addToCart({
                                            id: `claim_${selectedCourseForUsage.id}_${item.name}`,
                                            courseId: selectedCourseForUsage.id,
                                            courseName: String(getFuzzyKey(selectedCourseForUsage, ["ชื่อคอส", "col_8"]) || ''),
                                            originalCourse: selectedCourseForUsage,
                                            name: `[เบิกของแถม] ${item.name}`,
                                            price: 0,
                                            qty: 1,
                                            maxQty: item.qty - claimedCount,
                                            itemName: item.name
                                         }, 'claim_item');
                                         setSelectedCourseForUsage(null);
                                      }}
                                      disabled={isClaimed}
                                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${isClaimed ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-pink-100 text-pink-600 hover:bg-pink-200 hover:text-pink-700'}`}
                                   >
                                      {isClaimed ? <><CheckCircle size={14}/> รับครบแล้ว</> : 'เบิก 1 ชิ้น'}
                                   </button>
                                </div>
                             )
                          })}
                       </div>
                    </div>
                 );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Booking Check-In Modal */}
    {pendingCheckInBooking && (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <Calendar size={32} strokeWidth={2.5} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2 text-center">
            พบการจองคิววันนี้
          </h2>
          <p className="text-slate-600 text-sm mb-6 text-center leading-relaxed">
            ลูกค้า <span className="font-bold text-indigo-600">{pendingCheckInBooking.customerName}</span><br />
            มีคิวรับบริการเวลา <span className="font-bold text-slate-800">{pendingCheckInBooking.time}</span><br />
            ต้องการเช็คอินลูกค้าและเปลี่ยนสถานะเป็น <span className="font-bold text-blue-600">กำลังใช้บริการ</span> เลยหรือไม่?
          </p>
          
          <div className="flex w-full gap-3">
            <button 
              onClick={() => setPendingCheckInBooking(null)}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
            >
              ไว้ทีหลัง
            </button>
            <button 
              onClick={async () => {
                 try {
                    const bedNum = window.prompt("ระบุหมายเลขเตียง (1-4) หรือชื่อห้อง:", "1");
                    if (bedNum === null) return; // User cancelled

                    await updateDoc(doc(getCol('bookings'), pendingCheckInBooking.id), {
                       status: 'กำลังใช้บริการ',
                       bedNumber: bedNum,
                       updatedAt: new Date().toISOString()
                    });
                    showToast('เช็คอินคิวสำเร็จ!', 'success');
                    setPendingCheckInBooking(null);
                 } catch (e) {
                    console.error("Check-in error:", e);
                    showToast('เกิดข้อผิดพลาดในการเช็คอิน', 'error');
                 }
              }}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-md shadow-blue-200"
            >
              เช็คอินเลย
            </button>
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
           if (order && order.cartItems) {
               setCart(order.cartItems);
               setActiveCustomerAppOrderIds(prev => [...new Set([...prev, order.id])]);
               if (order.customerPhone) {
                  const cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');
                  const targetCustomer = customers.find(c => {
                      const phoneRaw = String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '');
                      return phoneRaw.replace(/[^0-9]/g, '') === cleanPhone;
                  });
                  if (targetCustomer) {
                     setSelectedCustomer(targetCustomer);
                  }
               }
           }
           setIsBedModalOpen(false);
        }}
    />
    <TreatmentJobSlipModal
        isOpen={!!printingJobSlipBooking}
        onClose={() => setPrintingJobSlipBooking(null)}
        booking={printingJobSlipBooking}
        appSettings={{}} // POSSystem doesn't have appSettings directly, but we can pass an empty object or retrieve it. Wait, appSettings is not loaded in POSSystem? Yes it is not in the scope directly, but it falls back to 'IRIS CLINIC'
    />
    {/* Edit Course Price Modal */}
    {editingCoursePrice && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800">แก้ไขราคาคอร์ส</h2>
            <button onClick={() => setEditingCoursePrice(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>
          
          <div className="mb-4">
            <p className="text-sm font-medium text-slate-500 mb-2 truncate">
              {editingCoursePrice.name || getFuzzyKey(editingCoursePrice, ["ชื่อคอส", "col_4"])}
            </p>
            <div className="relative">
              <span className="absolute left-3 top-3 text-slate-400 font-bold">฿</span>
              <input 
                type="number"
                value={editingCoursePrice.newPriceStr}
                onChange={(e) => setEditingCoursePrice(prev => ({ ...prev, newPriceStr: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-violet-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitEditMasterCoursePrice();
                }}
              />
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button 
              onClick={() => setEditingCoursePrice(null)}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
            >
              ยกเลิก
            </button>
            <button 
              onClick={submitEditMasterCoursePrice}
              className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold shadow-md shadow-violet-200 transition-colors"
            >
              บันทึกราคา
            </button>
          </div>
        </div>
      </div>
    )}
    
    <IShipBookingModal 
      isOpen={ishipModal.isOpen} 
      order={{ customerName: selectedCustomer ? String(getFuzzyKey(selectedCustomer, ["ชื่อ", "col_1"])) : 'ลูกค้าทั่วไป', shippingAddress }} 
      onClose={() => setIshipModal({isOpen: false})} 
      onPrintLabel={(address) => {
         const tempReceipt = {
           orderNo: activeWcOrderId || 'DRAFT',
           createdAt: new Date(),
           splitPayment: { cod: splitPayment.cod > 0 ? splitPayment.cod : 0, cash: 0, transfer: 0, credit: 0 },
           shippingAddress: address || shippingAddress,
           items: [],
         };
         setReceiptData(tempReceipt);
         setPrintMode('label');
         setShowPreviewModal(true);
      }}
      onSubmit={async (data) => {
         showToast('กำลังส่งข้อมูลไปยัง iShip...');
         if (data && data.trackingNumber) {
            setPosTrackingNo(data.trackingNumber);
            if (data.dstAddress) {
                setShippingAddress(data.dstAddress);
            }
            showToast(`สร้างเลขพัสดุสำเร็จ: ${data.trackingNumber}`, 'success');
         }
         setIshipModal({ isOpen: false });
      }} 
    />
  </>
  );
}
