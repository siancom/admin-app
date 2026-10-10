import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, ShoppingCart, Package, Layers, User, Trash2, 
  CheckCircle, Plus, Minus, CreditCard, Banknote, Smartphone, X, Clock, DollarSign, ChevronLeft, Truck, FileText
} from 'lucide-react';
import { db, getCol } from '../config/firebase';
import { addDoc, updateDoc, doc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { getFuzzyKey } from '../utils/fuzzy';
import { parseNumber, parseQty, getTotalStock, getBranchStock } from '../utils/parse';
import { getProfilePicData, handleProfileImgError } from '../utils/imageUtils';
import { getVipDiscountRate, computeFinalPrice, getOwnerDiscountRate, computeOwnerCostPrice } from '../utils/priceUtils';
import { fetchWithProxy } from '../utils/wooProxy';
import SignaturePad from './SignaturePad';
import ShopeeImportModal from './ShopeeImportModal';
import BarcodeScannerModal from './BarcodeScannerModal';
import SalesHistoryModal from './SalesHistoryModal';

export default function POSSystem({ 
  products = [], 
  branches = [],
  masterCourses = [], 
  customers = [],
  courses = [],
  histories = [],
  orders = [],
  showToast,
  globalBranch,
  globalRole,
  appSettings = { monthlyTarget: 0 },
  employees = [],
  employeeAttendance = [],
  wooImagesMap = new Map(),
  wooIdMap = new Map(),
  onViewCustomerProfile = () => {},
  posPreselectedCustomer,
  clearPosPreselectedCustomer
}) {
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'courses' | 'my_courses'
  const [searchTerm, setSearchTerm] = useState('');
  
  // Cart: { id, name, price, qty, type, maxQty, originalItem }
  const [cart, setCart] = useState([]);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [discountVal, setDiscountVal] = useState(0);
  const [discountType, setDiscountType] = useState('percent'); // 'percent' | 'amount'
  const [showWebOrdersModal, setShowWebOrdersModal] = useState(false);
  const [showSalesHistory, setShowSalesHistory] = useState(false);
  const [showShopeeModal, setShowShopeeModal] = useState(false);
  const [isSyncingWoo, setIsSyncingWoo] = useState(false);
  const [isLoadingCompare, setIsLoadingCompare] = useState(false);
  const [wooSyncDiff, setWooSyncDiff] = useState(null);

  const [isStockMode, setIsStockMode] = useState(false);
  const [stockAdjustments, setStockAdjustments] = useState([]);
  const [stockInputModal, setStockInputModal] = useState({ isOpen: false, item: null, inputVal: '' });
  const [isStockConfirmModalOpen, setIsStockConfirmModalOpen] = useState(false);

  // Hide global mobile bottom nav when in stock mode
  React.useEffect(() => {
    const bottomNav = document.getElementById('mobile-bottom-nav');
    if (bottomNav) {
      bottomNav.style.display = isStockMode ? 'none' : 'flex';
    }
    return () => {
      if (bottomNav) bottomNav.style.display = 'flex';
    };
  }, [isStockMode]);

  // Helper for branch stock
  // Checkout Details
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [splitPayment, setSplitPayment] = useState({ cash: 0, transfer: 0, cod: 0, credit: 0 });
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentStaff, setPaymentStaff] = useState('');
  const [paymentPhotoUrl, setPaymentPhotoUrl] = useState(null);
  
  const [orderChannel, setOrderChannel] = useState('instore'); // 'instore' | 'chat' | 'web'
  const [shippingAddress, setShippingAddress] = useState('');
  const [printMode, setPrintMode] = useState('receipt'); // 'receipt' | 'label'
  
  // Web Orders Polling
  const [webOrders, setWebOrders] = useState([]);
  const [activeWcOrderId, setActiveWcOrderId] = useState('');
  const [isFetchingWebOrders, setIsFetchingWebOrders] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
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

  const [showEodModal, setShowEodModal] = useState(false);
  const [eodData, setEodData] = useState({ actualCash: '', floatCash: '1000', imageBase64: '', submittedBy: '', clockOut: true });
  const [isSubmittingEod, setIsSubmittingEod] = useState(false);

  // Filtered Inventory
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const searchStr = `${String(getFuzzyKey(p, ["รหัส", "col_1"]) || '')} ${String(getFuzzyKey(p, ["ชื่อสิน�?��า", "col_2"]) || '')}`.toLowerCase();
      return searchTerm === '' || searchStr.includes(searchTerm.toLowerCase());
    });
  }, [products, searchTerm]);

  const stockSummary = useMemo(() => {
    let totalCostAll = 0;
    let totalCostBranch = 0;
    let totalRetailAll = 0;
    let totalRetailBranch = 0;
    let totalItemsAll = 0;
    let totalItemsBranch = 0;

    const currentBranch = globalBranch || 'เฉว�?';

    products.forEach(p => {
      const qtyAll = parseQty(getTotalStock(p, branches));
      const qtyBranch = parseQty(getBranchStock(p, currentBranch));
      
      const fullPrice = parseNumber(getFuzzyKey(p, ["รา�?��ขายเต�?��", "col_6"]));
      const costPrice = computeOwnerCostPrice(p);

      totalCostAll += qtyAll * costPrice;
      totalCostBranch += qtyBranch * costPrice;
      totalRetailAll += qtyAll * fullPrice;
      totalRetailBranch += qtyBranch * fullPrice;
      totalItemsAll += qtyAll;
      totalItemsBranch += qtyBranch;
    });

    return {
      totalCostAll,
      totalCostBranch,
      totalRetailAll,
      totalRetailBranch,
      totalItemsAll,
      totalItemsBranch
    };
  }, [products, branches, globalBranch]);

  const filteredCourses = useMemo(() => {
    return masterCourses.filter(mc => {
      const searchStr = `${String(getFuzzyKey(mc, ["รหัส�?��ส", "col_1"]) || '')} ${String(getFuzzyKey(mc, ["ชื่อ�?��ส", "col_4"]) || '')}`.toLowerCase();
      return searchTerm === '' || searchStr.includes(searchTerm.toLowerCase());
    });
  }, [masterCourses, searchTerm]);

  const filteredMyCourses = useMemo(() => {
    if (!selectedCustomer) return [];
    const phone = String(getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3"]) || '').trim();
    if (!phone) return [];
    return courses.filter(c => {
      const cPhone = String(getFuzzyKey(c, ["เบอร์โทร", "col_1"]) || '').trim();
      if (cPhone !== phone) return false;
      if (!c.computedRemainQty || c.computedRemainQty <= 0) return false;
      const searchStr = `${String(getFuzzyKey(c, ["เลขที่�?���?��ส", "col_2"]) || '')} ${String(getFuzzyKey(c, ["ชื่อ�?��ส", "col_8"]) || '')}`.toLowerCase();
      return searchTerm === '' || searchStr.includes(searchTerm.toLowerCase());
    });
  }, [courses, selectedCustomer, searchTerm]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return [];
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
        if (h.isCancelled || String(getFuzzyKey(h, ["สถานะ", "col_7", "col_8", "col_9"]) || '') === 'ยกเลิ�?') return;
        const hName = String(getFuzzyKey(h, ["ชื่อลูก�?��า", "col_2"]) || '').trim();
        const hPhoneNum = String(getFuzzyKey(h, ["เบอร์โทร", "col_3"]) || '').trim();
        if ((cName && hName === cName) || (cPhone && hPhoneNum === cPhone)) {
            const type = String(getFuzzyKey(h, ["ประเ�?�?", "col_4"]) || '');
            const amt = parseNumber(getFuzzyKey(h, ["ยอดเ�?���?", "ยอดจัดซื้อ", "ยอดสิน�?��า", "ยอ�?", "col_19"]));
            if (amt > 0) {
                if (type.includes('เบิ�?') || type.includes('จ่าย') || type.includes('หั�?')) {
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

  const todaySales = useMemo(() => {
    const today = new Date().toLocaleDateString('th-TH');
    return histories.reduce((sum, h) => {
      const hDate = String(getFuzzyKey(h, ["วันที�?", "col_1"]) || '');
      const hBranch = String(getFuzzyKey(h, ["สาขา", "col_21"]) || '');
      const status = String(getFuzzyKey(h, ["สถานะ", "col_7", "col_8", "col_9"]) || '');
      const type = String(getFuzzyKey(h, ["ประเ�?�?", "col_4"]) || '');
      
      if (hDate === today && !h.isCancelled && status !== 'ยกเลิ�?' && (!globalBranch || hBranch === globalBranch)) {
        const amt = parseNumber(getFuzzyKey(h, ["ยอดเ�?���?", "ยอดจัดซื้อ", "ยอดสิน�?��า", "ยอ�?", "col_19"]));
        if (type.includes('ซื้อสิน�?��า') || type.includes('ซื้อ�?��ร์ส')) {
            return sum + amt;
        }
      }
      return sum;
    }, 0);
  }, [histories, globalBranch]);

  const todaySalesBreakdown = useMemo(() => {
    const today = new Date().toLocaleDateString('th-TH');
    let cash = 0;
    let transfer = 0;
    let cod = 0;
    let credit = 0;
    let online = 0;
    const transferDetails = [];

    orders.forEach(o => {
      const oDate = new Date(o.createdAt).toLocaleDateString('th-TH');
      const oBranch = String(o.branch || '');
      
      if (oDate === today && (!globalBranch || oBranch === globalBranch)) {
         const paymentStr = String(o.paymentMethod || '');
         let tAmt = 0;
         
         if (paymentStr.includes('เ�?��นส�?:')) {
            const match = paymentStr.match(/เ�?��นส�?:\s*([\d.]+)/);
            if (match) cash += parseFloat(match[1]);
         }
         if (paymentStr.includes('โอนเ�?���?:')) {
            const match = paymentStr.match(/โอนเ�?���?:\s*([\d.]+)/);
            if (match) {
              tAmt = parseFloat(match[1]);
              transfer += tAmt;
            }
         }
         if (paymentStr.includes('�?��าง\/COD:')) {
            const match = paymentStr.match(/�?��าง\\/COD:\s*([\d.]+)/);
            if (match) cod += parseFloat(match[1]);
         }
         if (paymentStr === 'เ�?��นส�?') cash += parseNumber(o.price);
         if (paymentStr === 'โอนเ�?���?') {
            tAmt = parseNumber(o.price);
            transfer += tAmt;
         }
         if (paymentStr === '�?��า�?/COD') cod += parseNumber(o.price);
         
         if (tAmt > 0) {
           transferDetails.push({
             id: o.id || Math.random().toString(),
             time: new Date(o.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
             amount: tAmt,
             customer: getFuzzyKey(o, ["ชื่อลูก�?��า", "ลูก�?��า", "customer"]) || 'ลูก�?��าทั่ว�?�?'
           });
         }
      }
    });

    histories.forEach(h => {
      const hDate = String(getFuzzyKey(h, ["วันที�?", "col_1"]) || '').trim();
      const hBranch = String(h["สาขา"] || "สำนัก�?��น�?��ญ�?");
      if (hDate === today && (!globalBranch || hBranch === globalBranch)) {
         const type = String(getFuzzyKey(h, ["ประเ�?�?", "col_4"]) || '');
         if (type === "เบิกสิน�?��า" || type === "เบิก�?��้เ�?��ดิ�?") {
            const amt = parseNumber(getFuzzyKey(h, ["ยอดเบิ�?", "ยอดเ�?���?", "ยอดจัดซื้อ", "ยอ�?", "col_19"]));
            credit += amt;
         }
      }
    });

    return { cash, transfer, cod, credit, transferDetails };
  }, [orders, histories, globalBranch]);

  const currentMonthSales = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return orders.reduce((sum, o) => {
      if (!o.createdAt) return sum;
      const oDate = new Date(o.createdAt);
      if (oDate.getMonth() === currentMonth && oDate.getFullYear() === currentYear) {
         if (!globalBranch || o.branch === globalBranch) {
            return sum + parseNumber(o.price);
         }
      }
      return sum;
    }, 0);
  }, [orders, globalBranch]);

  useEffect(() => {
    setCart(prev => prev.map(item => {
      if (item.type === 'product' && !item.isManualPrice) {
        const isOwnerPurchase = isStockMode && globalRole === 'owner';
        const price = isOwnerPurchase 
          ? computeOwnerCostPrice(item.originalItem) 
          : computeFinalPrice(item.originalItem, isVipCustomer);
        const fullPrice = parseNumber(getFuzzyKey(item.originalItem, ["รา�?��ขายเต�?��", "col_6"]));
        const memberPrice = parseNumber(getFuzzyKey(item.originalItem, ["รา�?��สมาชิ�?", "col_10"]));
        const originalPrice = isOwnerPurchase ? (memberPrice > 0 ? memberPrice : fullPrice) : fullPrice;
        return { ...item, price, originalPrice };
      }
      return item;
    }));
  }, [isVipCustomer, isStockMode, globalRole]);

  const addToCart = (item, type) => {
    if (type === 'course' && !selectedCustomer) {
      showToast('โปรดเลือกลูก�?��าก่อนทำการขาย�?��ร์ส (ลูก�?��า Walk-in ซื้อ�?��ร์ส�?��่�?���?)', 'error');
      return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id && i.type === type);
      if (existing) {
        if (type === 'product' && existing.qty >= existing.maxQty) {
          showToast('จำนวนสิน�?��า�?��่เพีย�?��อ');
          return prev;
        }
        return prev.map(i => i.id === item.id && i.type === type ? { ...i, qty: i.qty + 1 } : i);
      } else {
        if (type === 'product') {
          const isOwnerPurchase = isStockMode && globalRole === 'owner';
          const maxQty = isOwnerPurchase ? 9999 : parseQty(getFuzzyKey(item, ["จำนวน�?�?��หลือ", "col_12"]));
          const fullPrice = parseNumber(getFuzzyKey(item, ["รา�?��ขายเต�?��", "col_6"]));
          const memberPrice = parseNumber(getFuzzyKey(item, ["รา�?��สมาชิ�?", "col_10"]));
          const price = isOwnerPurchase ? computeOwnerCostPrice(item) : computeFinalPrice(item, isVipCustomer);
          const originalPrice = isOwnerPurchase ? (memberPrice > 0 ? memberPrice : fullPrice) : fullPrice;

          return [...prev, { id: item.id, name: String(getFuzzyKey(item, ["ชื่อสิน�?��า", "col_2"])), price, originalPrice, qty: 1, type, maxQty, originalItem: item, isManualPrice: false }];
        } else if (type === 'course') {
          const price = parseNumber(getFuzzyKey(item, ["รา�?��ขาย", "col_6"]));
          return [...prev, { id: item.id, name: String(getFuzzyKey(item, ["ชื่อ�?��ส", "col_4"])), price, qty: 1, type, maxQty: 999, originalItem: item }];
        } else if (type === 'usage') {
          const maxQty = item.computedRemainQty || 1;
          const nameStr = `เบิก�?���?: ${String(getFuzzyKey(item, ["ชื่อ�?��ส", "col_8"]))} (${String(getFuzzyKey(item, ["เลขที่�?���?��ส", "col_2"]))})`;
          return [...prev, { id: item.id, name: nameStr, price: 0, qty: 1, type, maxQty, originalItem: item }];
        }
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
            showToast(type === 'usage' ? 'จำนวน�?��ั้�?�?��ร์ส�?��่เพีย�?��อ' : 'จำนวนสิน�?��าเกินสต�?���?');
            return i;
          }
          return { ...i, qty: newQty };
        }
        return i;
      });
    });
  };

  const updateCartPrice = (id, type, newPrice) => {
    setCart(prev => prev.map(i => (i.id === id && i.type === type) ? { ...i, price: parseNumber(newPrice), isManualPrice: true } : i));
  };

  const removeFromCart = (id, type) => {
    setCart(prev => prev.filter(i => !(i.id === id && i.type === type)));
  };

  // Calculations
  const originalSubtotal = cart.reduce((sum, item) => sum + ((item.originalPrice || item.price) * item.qty), 0);
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const total = Math.max(0, subtotal - globalDiscount);
  const totalSaved = Math.max(0, (originalSubtotal - subtotal) + globalDiscount);
  const totalPaid = (splitPayment.cash || 0) + (splitPayment.transfer || 0) + (splitPayment.cod || 0) + (splitPayment.credit || 0);

  const handleOwnerPurchaseSubmit = async () => {
    if (cart.length === 0) return;
    
    setIsProcessing(true);
    try {
      const orderNo = `PO${Date.now().toString().slice(-6)}`;
      const batch = writeBatch(db);
      
      let itemsStr = [];
      for (const item of cart) {
        itemsStr.push(`${item.name} x${item.qty}`);
      }
      
      const totalCost = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
      const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
      
      const orderRef = doc(getCol('orders'));
      batch.set(orderRef, {
        orderNo,
        customerName: 'เจ้าขอ�?��้า�? (สั่�?��ัดซื้อ)',
        customerPhone: '-',
        courseName: itemsStr.join(', '),
        price: String(totalCost),
        qty: String(totalQty),
        branch: String(globalBranch || "สำนัก�?��น�?��ญ�?"),
        status: "สั่�?��ัดซื้อแล้ว",
        paymentMethod: "สั่�?��ัดซื้อ (รา�?��ต้นทุ�?)",
        source: "PURCHASE_ORDER",
        createdAt: new Date().toISOString(),
      });
      
      await batch.commit();
      showToast('สั่�?��ัดซื้อสิน�?��าสำเร�?�?!', 'success');
      setCart([]);
      setIsMobileCartOpen(false);
    } catch (error) {
      console.error(error);
      showToast(`เกิดข้อผิดพลา�?: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      showToast('�?��่มีสิน�?��า�?��ตะกร้า');
      return;
    }
    const hasCourse = cart.some(i => i.type === 'course');
    if (hasCourse && !selectedCustomer) {
      showToast('มีรายการ�?��ร์ส�?��ตะกร้า โปรดเลือกลูก�?��าก่อนชำระเ�?���?', 'error');
      return;
    }
    if (totalPaid !== total && total > 0) {
      showToast(`ยอดชำระเ�?��น�?��่ตร�?��ับยอดสุทธิ (ขาดอี�? ฿${(total - totalPaid).toLocaleString()})`);
      return;
    }
    
    setIsProcessing(true);
    try {
      const orderNo = `POS${Date.now().toString().slice(-6)}`;
      
      let paymentMethodsStrArr = [];
      if (splitPayment.cash > 0) paymentMethodsStrArr.push(`เ�?��นส�?: ${splitPayment.cash}`);
      if (splitPayment.transfer > 0) paymentMethodsStrArr.push(`โอนเ�?���?: ${splitPayment.transfer}`);
      if (splitPayment.cod > 0) paymentMethodsStrArr.push(`�?��า�?/COD: ${splitPayment.cod}`);
      if (splitPayment.credit > 0) paymentMethodsStrArr.push(`ตัดเ�?��ดิ�?: ${splitPayment.credit}`);
      const paymentMethodStr = paymentMethodsStrArr.join(', ') || 'ฟรี/ส่วนลดเต�?��จำนว�?';
      const batch = writeBatch(db);
      
      const cName = selectedCustomer ? String(getFuzzyKey(selectedCustomer, ["ชื่อ", "col_1"])) : 'ลูก�?��าทั่ว�?�? (POS)';
      const cPhone = selectedCustomer ? String(getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3"])) : '';

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
            "วันที�?": new Date().toLocaleDateString('th-TH'),
            "เวลา": new Date().toLocaleTimeString('th-TH', { hour12: false, hour: '2-digit', minute: '2-digit' }),
            "ชื่อลูก�?��า": cName,
            "เบอร์โทร": cPhone,
            "เลขที่�?���?��ส": c.courseRefKey || String(getFuzzyKey(c, ["เลขที่�?���?��ส", "col_3"])),
            "อ้า�?��ิ�?": orderNo,
            "ประเ�?�?": "เบิก�?��้เ�?��ดิ�?",
            "ยอดเ�?���?": String(deductAmt),
            "รายละเอีย�?": `�?��้เ�?��ดิตชำระสิน�?��าบิล ${orderNo}`,
            "สาขา": String(globalBranch || "สำนัก�?��น�?��ญ�?")
          });
          
          remainingToDeduct -= deductAmt;
        }
      }
      
      
      let itemsStr = [];

      for (const item of cart) {
        itemsStr.push(`${item.name} x${item.qty}`);

        if (item.type === 'product') {
          // Reduce Stock in Firebase
          const productRef = doc(db, 'products', item.id);
          const currentLocalStock = getBranchStock(item.originalItem, globalBranch);
          const newStock = Math.max(0, currentLocalStock - item.qty);
          
          const targetBranch = globalBranch || 'เฉว�?';
          const currentStockByBranch = item.originalItem.stock_by_branch || {};
          const newStockByBranch = { ...currentStockByBranch, [targetBranch]: newStock };
          
          batch.update(productRef, { stock_by_branch: newStockByBranch });

          // History for product
          const historyRef = doc(getCol('histories'));
          batch.set(historyRef, {
            "วันที�?": new Date().toLocaleDateString('th-TH'),
            "ชื่อลูก�?��า": cName,
            "เบอร์โทร": cPhone,
            "หมายเลข�?��สั่�?��ื้อ": orderNo,
            "ประเ�?�?": "ซื้อสิน�?��า",
            "สถานะ": "เรียบร้อย",
            "สิน�?��า": item.name,
            "จำนว�?": String(item.qty),
            "ยอดเ�?���?": String(item.price * item.qty),
            "สาขา": String(globalBranch || "สำนัก�?��น�?��ญ�?"), 
          });
        } 
        else if (item.type === 'usage') {
          // Update Course Remaining Qty
          const courseRef = doc(db, 'courses', item.id);
          const currentUsed = parseQty(getFuzzyKey(item.originalItem, ["�?��ั้�?��ี่�?���?", "col_14"]) || 0);
          const currentTotal = parseQty(getFuzzyKey(item.originalItem, ["จำนวน�?��ั้�?��ี่�?���?", "จำนวน�?��ั้�?", "col_7"]) || 1);
          const newUsed = currentUsed + item.qty;
          const newRemain = Math.max(0, currentTotal - newUsed);
          
          batch.update(courseRef, {
            "�?��ั้�?��ี่�?���?": String(newUsed),
            "�?��ั้�?��ี่เหลือดิ�?": String(newRemain)
          });

          // History for course usage
          const historyRef = doc(getCol('histories'));
          const custSignatureUrl = custSigRef.current?.toDataURL() || null;
          const staffSignatureUrl = staffSigRef.current?.toDataURL() || null;

          batch.set(historyRef, {
            "วันที�?": new Date().toLocaleDateString('th-TH'),
            "เวลา": new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
            "ชื่อลูก�?��า": cName,
            "เบอร์โทร": cPhone,
            "หมายเลข�?��สั่�?��ื้อ": orderNo,
            "เลขที่�?���?��ส": String(getFuzzyKey(item.originalItem, ["เลขที่�?���?��ส", "col_2"]) || ''),
            "ประเ�?�?": "รับบริการ",
            "สถานะ": "เรียบร้อย",
            "รายการ": "ตัด�?��ร์สผ่านระบ�? POS",
            "จำนว�?": String(item.qty),
            "สาขา": String(globalBranch || "สำนัก�?��น�?��ญ�?"),
            "courseId": item.id,
            "customerPhoto": paymentPhotoUrl,
            "customerSignature": custSignatureUrl,
            "staffSignature": staffSignatureUrl,
            "พนัก�?���?": paymentStaff
          });
        }
        else if (item.type === 'course') {
          // Generate Course instances per quantity
          for (let i = 0; i < item.qty; i++) {
            const courseNo = `IC${Date.now().toString().slice(-6)}${i}`;
            const courseRef = doc(getCol('courses'));
            const courseTotalQty = String(getFuzzyKey(item.originalItem, ["จำนวน�?��ั้�?", "col_7"]) || "1");
            
            batch.set(courseRef, {
              "เบอร์โทร": cPhone,
              "เลขที่�?���?��ส": courseNo,
              "วันที่ซื้อ": new Date().toLocaleDateString('th-TH'),
              "ผู้ซื้อ�?��ส": cName,
              "ชื่อ�?��ส": item.name,
              "สาขาที่ซื้อ": String(globalBranch || "สำนัก�?��น�?��ญ�?"),
              "รา�?��": String(item.price),
              "เ�?��ดิตที่�?��้รั�?": String(item.price),
              "จำนวน�?��ั้�?��ี่�?���?": courseTotalQty,
              "ยอด�?��า�?��ำระ": "0",
              "ยอดชำระแล้วทั้�?��ม�?": String(item.price),
              "�?��ั้�?��ี่�?���?": "0",
              "�?��ั้�?��ี่เหลือดิ�?": courseTotalQty,
              "สถานะ": "ยั�?�?�?��หลือ",
              "ประเ�?ทการชำระ": paymentMethodStr
            });

            // History for course
            const historyRef = doc(getCol('histories'));
            batch.set(historyRef, {
              "วันที�?": new Date().toLocaleDateString('th-TH'),
              "ชื่อลูก�?��า": cName,
              "เบอร์โทร": cPhone,
              "หมายเลข�?��สั่�?��ื้อ": orderNo,
              "ประเ�?�?": "ซื้อ�?��ร์ส",
              "สถานะ": "เรียบร้อย",
              "สิน�?��า": item.name,
              "ยอดเ�?���?": String(item.price),
              "สาขา": String(globalBranch || "สำนัก�?��น�?��ญ�?"),
              "อ้า�?��ิ�?": courseNo
            });
          }
        }
      }

      // Master Order Record
      const orderRef = doc(getCol('orders'));
      const custSignatureUrl = custSigRef.current?.toDataURL() || null;
      const staffSignatureUrl = staffSigRef.current?.toDataURL() || null;
      
      batch.set(orderRef, {
        orderNo,
        customerName: cName,
        customerPhone: cPhone,
        courseName: itemsStr.join(', '), // Summarize items
        price: String(total),
        discount: String(globalDiscount),
        qty: String(cart.reduce((sum, item) => sum + item.qty, 0)),
        branch: String(globalBranch || "สำนัก�?��น�?��ญ�?"),
        status: "อนุมัติแล้ว",
        paymentMethod: paymentMethodStr,
        source: "POS",
        orderChannel,
        shippingAddress,
        wcOrderId: activeWcOrderId,
        createdAt: new Date().toISOString(),
        paymentStaff,
        customerPhoto: paymentPhotoUrl,
        customerSignature: custSignatureUrl,
        staffSignature: staffSignatureUrl
      });

      await batch.commit();

      showToast('ชำระเ�?��นสำเร�?�?!', 'success');
      
      // Save data for receipt modal instead of clearing everything immediately
      setReceiptData({
        orderNo,
        customerName: cName,
        customerPhone: cPhone,
        items: [...cart],
        subtotal,
        total,
        globalDiscount,
        totalSaved,
        paymentMethodStr,
        orderChannel,
        shippingAddress,
        splitPayment: {...splitPayment},
        createdAt: new Date()
      });
      setCart([]);
      setActiveWcOrderId(null);
      setIsMobileCartOpen(false); // Close cart immediately so receipt shows properly
      
    } catch (error) {
      console.error(error);
      showToast(`เกิดข้อผิดพลา�?: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

    const handleEodSubmit = async () => {
    if (!eodData.submittedBy) {
      showToast('กรุณาเลือกผู้ส่�?��อ�?', 'error');
      return;
    }

    setIsSubmittingEod(true);
    try {
      const expectedCash = todaySalesBreakdown.cash + (parseNumber(eodData.floatCash) || 0);
      const actual = parseNumber(eodData.actualCash) || 0;
      const diff = actual - expectedCash;
      
      const onlineSales = todaySalesBreakdown.online || 0;
      const eodRef = doc(getCol('daily_sales'));
      const batch = writeBatch(db);
      
      batch.set(eodRef, {
        date: new Date().toLocaleDateString('th-TH'),
        branch: globalBranch || "สำนัก�?��น�?��ญ�?",
        totalSales: todaySales,
        cashSales: todaySalesBreakdown.cash,
        transferSales: todaySalesBreakdown.transfer,
        codSales: todaySalesBreakdown.cod,
        creditSales: todaySalesBreakdown.credit,
        onlineSales: onlineSales,
        transferDetails: todaySalesBreakdown.transferDetails,
        floatCash: parseNumber(eodData.floatCash) || 0,
        actualCash: actual,
        expectedCash: expectedCash,
        difference: diff,
        imageBase64: eodData.imageBase64 || '',
        submittedBy: eodData.submittedBy,
        status: 'รอตรวจสอ�?',
        createdAt: new Date().toISOString()
      });

      // Handle Clock Out
      if (eodData.clockOut) {
         const today = new Date().toISOString().split('T')[0];
         const attRecord = employeeAttendance.find(a => a.employeeId === eodData.submittedBy && a.date === today && !a.clockOut);
         if (attRecord) {
             const attRef = doc(db, 'employee_attendance', attRecord.id);
             batch.update(attRef, { clockOut: new Date().toISOString() });
         }
      }

      await batch.commit();
      
      showToast('ส่�?��อดประจำวันเรียบร้อยแล้ว!', 'success');
      setShowEodModal(false);
      setEodData({ actualCash: '', floatCash: '1000', imageBase64: '', submittedBy: '', clockOut: true });
    } catch (error) {
      console.error(error);
      showToast(`เกิดข้อผิดพลา�?: ${error.message}`, 'error');
    } finally {
      setIsSubmittingEod(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for base64
        showToast('�?��ล์�?าพมีขนาด�?��ญ่เกิน�?�? (จำกั�? 1MB)', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEodData({ ...eodData, imageBase64: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
    <div className={`flex flex-col lg:flex-row h-[calc(100dvh-128px)] lg:h-[calc(100vh-80px)] -m-4 sm:-m-6 lg:-m-8 overflow-hidden bg-slate-50 ${receiptData ? 'print:hidden' : ''}`}>
      
      {/* Left: Inventory */}
      <div className="flex-1 flex flex-col h-full border-r border-slate-200">
        <div className="p-4 bg-white border-b border-slate-200">
          
        {/* Mobile Customer Selection */}
        <div className="block lg:hidden mb-4 relative z-50">
           {selectedCustomer ? (
              <div className="flex items-center justify-between bg-indigo-50 p-3 rounded-xl border border-indigo-200 shadow-sm">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-indigo-100">
                       <User size={16} className="text-indigo-500" />
                    </div>
                    <div>
                       <div className="font-bold text-slate-800 text-sm">{selectedCustomer.computedName || String(getFuzzyKey(selectedCustomer, ["ชื่อ", "col_1"]))}</div>
                       <div className="text-xs text-slate-500">{selectedCustomer.computedPhone || String(getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3"]))}</div>
                    </div>
                 </div>
                 <button onClick={() => setSelectedCustomer(null)} className="p-2 text-slate-400 hover:text-red-500 bg-white rounded-full"><X size={16} /></button>
              </div>
           ) : (
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                 <input 
                   type="text" 
                   placeholder="�?��นหาลูก�?��า..." 
                   className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                   value={customerSearch}
                   onChange={(e) => { setCustomerSearch(e.target.value); setIsCustomerDropdownOpen(true); }}
                   onFocus={() => setIsCustomerDropdownOpen(true)}
                 />
                 {isCustomerDropdownOpen && customerSearch && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto z-50">
                      {filteredCustomers.length > 0 ? filteredCustomers.map(c => (
                        <div key={c.id} onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); setIsCustomerDropdownOpen(false); }} className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0">
                           <div className="font-bold text-slate-800 text-sm">{c.computedName || String(getFuzzyKey(c, ["ชื่อ", "col_1"]))}</div>
                           <div className="text-xs text-slate-500">{c.computedPhone || String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]))}</div>
                        </div>
                      )) : <div className="px-4 py-3 text-center text-slate-500 text-sm">�?��่พบลูก�?��า</div>}
                    </div>
                 )}
              </div>
           )}
        </div>

          
          
          {!isStockMode && (
            <div className="flex gap-4 mb-4">
              <button 
                onClick={() => setActiveTab('products')}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'products' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                <Package size={20} /> สิน�?��าทั่ว�?�?
              </button>
              <button 
                onClick={() => setActiveTab('courses')}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'courses' ? 'bg-pink-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                <Layers size={20} /> ขาย�?��ร์ส�?��ม�?
              </button>
              {selectedCustomer && (
                <button 
                  onClick={() => setActiveTab('my_courses')}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'my_courses' ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  <CheckCircle size={20} /> �?��ร์สขอ�?��ั�?
                </button>
              )}
            </div>
          )}
          <div className="block lg:hidden mb-3 flex items-center gap-2">
            {activeTab === 'products' && (
              <button
                onClick={() => setIsStockMode(!isStockMode)}
                className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center transition-all ${isStockMode ? 'bg-rose-500 text-white shadow-md' : 'bg-white border border-indigo-100 text-indigo-600 shadow-sm'}`}
              >
                <Package size={20} />
              </button>
            )}
            
            {!isStockMode && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowWebOrdersModal(true)}
                  className="w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center transition-all bg-sky-500 text-white shadow-md relative"
                  title="ออเดอร์จากเว�?�? (WooCommerce)"
                >
                  <Truck size={22} />
                  {webOrders.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{webOrders.length}</span>
                  )}
                </button>
                <button
                  onClick={() => setShowShopeeModal(true)}
                  className="w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center transition-all bg-orange-500 text-white shadow-md relative"
                  title="นำเข้าออเดอร�? Shopee"
                >
                  <span className="font-black text-lg">S</span>
                </button>
                <button
                  onClick={() => setShowSalesHistory(true)}
                  className="w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center transition-all bg-indigo-500 text-white shadow-md relative"
                  title="ประวัติการขาย"
                >
                  <FileText size={22} />
                </button>
              </div>
            )}
            {!(isStockMode && globalRole === 'owner') && (
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text"
                  placeholder={`�?��นหา${activeTab === 'products' ? 'สิน�?��า' : '�?��ร์ส'}...`}
                  className="w-full pl-10 pr-4 py-3 h-12 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
            <button
              onClick={() => setIsMobileCartOpen(true)}
              className="w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center transition-all bg-indigo-600 text-white shadow-md shadow-indigo-200 relative lg:hidden"
            >
              <ShoppingCart size={22} />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{cart.length}</span>
              )}
            </button>
          </div>

          <div className="relative hidden lg:flex gap-2">
          {activeTab === 'products' && (
            <>
            <button
              onClick={() => setIsStockMode(!isStockMode)}
              className={`hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${isStockMode ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              <Package size={20} /> {isStockMode ? 'ปิดโหมดนับสต๊อ�' : 'โหมดนับสต๊อ�'}
            </button>
            <button
              onClick={async () => {
                if (!wooIdMap || wooIdMap.size === 0) {
                  showToast('ยัู�หลดข้อมูล�?ว๸�๸�่�?สร๸ กรุณารอสักุ�ู�', 'error');
                  return;
                }
                // Build batch payload
                const batchItems = [];
                for (const p of products) {
                  const productCode = String(getFuzzyKey(p, ['รหัส', 'col_1']) || '');
                  const productName = String(getFuzzyKey(p, ['ชื่อสินู�า', 'col_2']) || '');
                  const wooId = productCode ? wooIdMap.get(productCode.trim().toUpperCase()) : null; // Match by SKU only (case-insensitive)
                  if (!wooId) continue;
                  batchItems.push({ id: wooId, manage_stock: true, stock_quantity: getTotalStock(p, branches) });
                }
                if (batchItems.length === 0) {
                  showToast('๸�่พบสินู�าที่ตรุ�ับ�?ว๸ ตรวจสอบชื่อ/รหัสสินู�า', 'error');
                  return;
                }
                showToast(`กำลั� Sync ${batchItems.length} สินู�าขึ้น�?ว๸ (Batch)...`, 'success');
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
                showToast(`Sync สต๊อก�?สร๸: � ${ok} สำ�?ร๸${fail > 0 ? ` � ${fail} ล้ม�?หลว` : ''}`, 'success');
              }}
              className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all bg-teal-500 text-white shadow-lg shadow-teal-200 hover:bg-teal-600"
            >
              <Truck size={18} /> Sync สต๊อกขึ้น�?ว๸
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
                    const data = await fetchWithProxy(`https://irisnatures.com/wp-json/wc/v3/products?per_page=100&page=${page}`);
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
                    const name = String(getFuzzyKey(p, ['ชื่อสิน�?��า', 'col_2']) || '');
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
            <div className="flex gap-2">
              <button
                onClick={() => setShowWebOrdersModal(true)}
                className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all bg-sky-500 text-white shadow-lg shadow-sky-200 relative hover:bg-sky-600"
              >
                <Truck size={20} /> ออเดอร์เว�?�?
                {webOrders.length > 0 && (
                  <span className="bg-rose-500 text-white text-xs font-black px-2 py-0.5 rounded-full shadow-sm">{webOrders.length}</span>
                )}
              </button>
              <button
                onClick={() => setShowShopeeModal(true)}
                className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all bg-orange-500 text-white shadow-lg shadow-orange-200 relative hover:bg-orange-600"
              >
                <span className="font-black text-lg leading-none">S</span> Shopee
              </button>
              <button
                onClick={() => setShowSalesHistory(true)}
                className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all bg-indigo-500 text-white shadow-lg shadow-indigo-200 relative hover:bg-indigo-600"
              >
                <FileText size={20} /> ประวัติการขาย
              </button>
            </div>
            {!(isStockMode && globalRole === 'owner') && (
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text"
                  placeholder={`�?��นหา${activeTab === 'products' ? 'สิน�?��า' : '�?��ร์ส'}...`}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto p-2 sm:p-4 bg-slate-50/50 ${isStockMode ? 'pb-36' : 'pb-28'}`}>
          {isStockMode && globalRole === 'owner' && (
            <div className="mb-6 p-4 sm:p-6 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-teal-500/10 border border-teal-100 rounded-3xl shadow-sm">
                            <h3 className="text-sm font-bold text-teal-700 mb-2">??????????????????? (Owner Purchase)</h3>
              <div className="text-xs text-teal-600 font-medium space-y-1">
                <p>? ??????????????????????? - ?????????????????</p>
                <p>? ?????????????????????? "??????????"</p>
                <p>? ????????????????????? ?????????????????</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-4 md:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
            {activeTab === 'products' ? (
              filteredProducts.map(p => {
                const productName = String(getFuzzyKey(p, ["ชื่อสิน�?��า", "col_2"]) || '');
                const productCode = String(getFuzzyKey(p, ["รหัส", "col_1"]) || '');
                
                const fullPrice = parseNumber(getFuzzyKey(p, ["รา�?��ขายเต�?��", "col_6"]));
                const displayPrice = computeFinalPrice(p, isVipCustomer);
                
                let imgFilename = null;
                // 1. Prioritize WooCommerce API images
                const wooImg = (productCode ? wooImagesMap.get(productCode.trim().toUpperCase()) : null) || wooImagesMap.get(productName.toLowerCase());
                if (wooImg) {
                  imgFilename = wooImg;
                } else {
                  // 2. Fallback to Firestore explicitly named fields
                  imgFilename = p["รูปสิน�?��า"] || p["image"] || p["imageUrl"] || p["รูป�?า�?"] || p["img"];
                }
                if (!imgFilename) {
                  for (const key of Object.keys(p)) {
                    const val = String(p[key] || '').trim();
                    if (val.match(/\.(jpeg|jpg|gif|png|webp)$/i) || val.includes('.รูปสิน�?��า.')) {
                      imgFilename = val;
                      break;
                    }
                  }
                }
                if (!imgFilename) {
                    imgFilename = String(getFuzzyKey(p, ["รูปสิน�?��า", "image", "imageUrl", "รูป�?า�?", "img"]) || '');
                }
                let imageUrl = null;
                if (imgFilename && imgFilename !== 'undefined') {
                  if (imgFilename.startsWith('http')) {
                    imageUrl = imgFilename;
                  } else {
                    let finalFilename = imgFilename.replace(/^\/+/, '');
                    try { finalFilename = decodeURIComponent(finalFilename); } catch(e) {}
                    imageUrl = `https://crm.irisnatures.com/สิน�?��า_Images/${encodeURI(finalFilename)}`;
                  }
                } else if (productName) {
                  imageUrl = `https://crm.irisnatures.com/สิน�?��า_Images/${encodeURIComponent(productName)}.jpg`;
                }

                return (
                <div 
                  key={p.id} 
                  onClick={() => isStockMode ? setStockInputModal({ isOpen: true, item: p, inputVal: '' }) : addToCart(p, 'product')}
                  className={`bg-white p-2 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border cursor-pointer transition-all flex flex-col h-full ${isStockMode ? (stockAdjustments.some(a => a.id === p.id) ? "border-emerald-500 opacity-70" : "border-rose-400 animate-pulse shadow-[0_0_15px_rgba(251,113,133,0.3)]") : "border-slate-100 hover:shadow-md hover:border-indigo-200 active:scale-95"}`}
                >
                  <div className="w-full aspect-[4/3] bg-slate-100 rounded-lg sm:rounded-xl mb-2 sm:mb-3 overflow-hidden relative group">
                    {imageUrl && (
                      <img 
                        src={imageUrl} 
                        alt={productName}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        loading="lazy"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    {isStockMode && stockAdjustments.some(a => a.id === p.id) && (
                      <div className="absolute inset-0 bg-emerald-500/20 z-10 flex items-center justify-center backdrop-blur-[1px]">
                        <CheckCircle size={40} className="text-emerald-600 bg-white rounded-full drop-shadow-md" />
                      </div>
                    )}
                  </div>
                  
                  <div className="text-[10px] sm:text-xs font-medium text-slate-400 mb-1 truncate">{productCode}</div>
                  <div className="font-semibold text-slate-800 flex-1 line-clamp-2 text-xs sm:text-base leading-snug">{productName}</div>
                  <div className="mt-2 sm:mt-3 flex flex-col xl:flex-row xl:items-end justify-between gap-1">
                    <div className="text-indigo-600 font-bold text-sm sm:text-lg flex items-center gap-1">
                      {displayPrice < fullPrice && (
                        <del className="text-gray-400 text-[10px] sm:text-xs">฿{fullPrice.toLocaleString()}</del>
                      )}
                      ฿{displayPrice.toLocaleString()}
                    </div>
                    <div className="flex flex-col items-end gap-0.5 w-full mt-1">
                      <div className="text-[9px] sm:text-xs font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md w-fit self-end">
                        รวม {parseQty(getTotalStock(p, branches))}
                      </div>
                      <div className="flex flex-col items-end w-full text-[8px] sm:text-[9px] text-slate-500 bg-slate-50 border border-slate-100 p-1 rounded-md">
                        {branches.length > 0 ? branches.map(br => {
                             const b = br.name || br.id || br;
                             const v = getBranchStock(p, b);
                             return (
                               <div key={b} className="flex justify-between w-full gap-2 border-b border-slate-100 last:border-0 py-0.5">
                                  <span className="truncate">{b}</span>
                                  <span className={`font-bold ${Number(v) < 0 ? 'text-red-500' : ''}`}>{parseQty(v)}</span>
                               </div>
                             );
                        }) : (
                             <div className="flex justify-between w-full gap-2 py-0.5">
                               <span className="truncate text-gray-400">ยั�?�?��่มีข้อมูลสาขา</span>
                             </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                );
              })
            ) : activeTab === 'courses' ? (
              filteredCourses.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => addToCart(c, 'course')}
                  className="bg-white p-2 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md border border-pink-100 cursor-pointer transition-all active:scale-95 flex flex-col h-full"
                >
                  <div className="text-[10px] sm:text-xs font-medium text-pink-400 mb-1 truncate">{String(getFuzzyKey(c, ["รหัส�?��ส", "col_1"]))}</div>
                  <div className="font-semibold text-slate-800 flex-1 line-clamp-2 text-xs sm:text-base leading-snug">{String(getFuzzyKey(c, ["ชื่อ�?��ส", "col_4"]))}</div>
                  <div className="mt-2 sm:mt-3 text-pink-600 font-bold text-sm sm:text-lg">฿{parseNumber(getFuzzyKey(c, ["รา�?��ขาย", "col_6"])).toLocaleString()}</div>
                </div>
              ))
            ) : (
              filteredMyCourses.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => addToCart(c, 'usage')}
                  className="bg-white p-2 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md border border-teal-100 cursor-pointer transition-all active:scale-95 flex flex-col h-full"
                >
                  <div className="text-[10px] sm:text-xs font-medium text-teal-500 mb-1 truncate">เลขที�?: {String(getFuzzyKey(c, ["เลขที่�?���?��ส", "col_2"]))}</div>
                  <div className="font-semibold text-slate-800 flex-1 line-clamp-2 text-xs sm:text-base leading-snug">{String(getFuzzyKey(c, ["ชื่อ�?��ส", "col_8"]))}</div>
                  <div className="mt-2 sm:mt-3 flex flex-col xl:flex-row xl:items-end justify-between gap-1">
                    <div className="text-teal-600 font-bold text-sm sm:text-lg">เบิก�?��้�?���? (ฟรี)</div>
                    <div className="text-[9px] sm:text-xs text-teal-700 bg-teal-50 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md w-fit font-bold">เหลือ {c.computedRemainQty} �?��ั้�?</div>
                  </div>
                </div>
              ))
            )}
            
            {((activeTab === 'products' && filteredProducts.length === 0) || (activeTab === 'courses' && filteredCourses.length === 0) || (activeTab === 'my_courses' && filteredMyCourses.length === 0)) && (
              <div className="col-span-full py-20 text-center text-slate-400 flex flex-col items-center">
                <Search size={48} className="mb-4 opacity-20" />
                <p className="text-lg">�?��่พบข้อมูล</p>
              </div>
            )}
          </div>
        </div>

        {/* Floating Mobile Bottom Action Buttons (Hidden since Cart is in search bar) */}
        {isStockMode && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 z-[70] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] pb-safe">
             <button 
                onClick={() => setIsStockConfirmModalOpen(true)}
                disabled={stockAdjustments.length === 0}
                className={`w-full py-4 rounded-2xl font-black text-lg shadow-xl flex items-center justify-between px-6 transition-transform active:scale-95 ${stockAdjustments.length > 0 ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30' : 'bg-slate-300 text-slate-500 shadow-none'}`}
             >
                <div className="flex items-center gap-2"><CheckCircle size={24} /> ยืนยันปรับสต๊อ�?</div>
                <div className={`${stockAdjustments.length > 0 ? 'bg-white text-rose-600' : 'bg-slate-200 text-slate-400'} px-3 py-1 rounded-xl text-sm`}>{stockAdjustments.length} รายการ</div>
             </button>
          </div>
        )}
      </div>

      {/* Right: Cart & Checkout */}
      <div className={`w-full lg:w-[450px] xl:w-[500px] flex-col h-full bg-white shadow-xl z-[60] lg:z-10 ${isMobileCartOpen ? 'fixed inset-0 flex pt-16 pb-16' : 'hidden lg:flex'}`}>
        
        {/* Mobile Close Button */}
        <div className="lg:hidden p-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 sticky top-0 z-10">
           <button onClick={() => setIsMobileCartOpen(false)} className="flex items-center gap-1 text-indigo-600 font-bold active:scale-95 transition-transform">
              <ChevronLeft size={24} /> <span>กลั�?</span>
           </button>
           <h2 className="font-black text-lg text-slate-800 flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
             <ShoppingCart size={20} className="text-indigo-600" /> ตะกร้าสิน�?��า
           </h2>
           <div className="w-16"></div> {/* Spacer for centering */}
        </div>
        
        {/* Customer Selection */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 shrink-0 z-10">
          <div className="relative">
            {selectedCustomer ? (
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
                    <div className="font-semibold text-slate-800 flex items-center gap-2">
                        {selectedCustomer.computedName || String(getFuzzyKey(selectedCustomer, ["ชื่อ", "col_1"]))}
                        {isVipCustomer && <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-yellow-200">VIP</span>}
                        {orderChannel === 'shopee' && <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-orange-200 ml-1">ส่วนลดพิเศษ</span>}
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
                            {!isVipCustomer && <span>ขา�? ฿{(5000 - vipStats.amount).toLocaleString()}</span>}
                        </div>
                        {!isVipCustomer && (
                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (vipStats.amount / 5000) * 100)}%` }}></div>
                            </div>
                        )}
                    </div>
                    {customerCreditBalance > 0 && (
                      <div className="mt-2 inline-flex items-center gap-1.5 bg-orange-50 text-orange-600 border border-orange-100 px-2 py-1 rounded-lg text-xs font-bold shadow-sm">
                        <CreditCard size={14} /> 
                        เ�?��ดิตที่มี: ฿{customerCreditBalance.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                  <X size={20} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="�?��นหาลูก�?��า (ชื่อ, เบอร์โทร)..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setIsCustomerDropdownOpen(true);
                  }}
                  onFocus={() => setIsCustomerDropdownOpen(true)}
                />
                
                {isCustomerDropdownOpen && customerSearch && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto z-50">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map(c => (
                        <div 
                          key={c.id} 
                          onClick={() => {
                            setSelectedCustomer(c);
                            setCustomerSearch('');
                            setIsCustomerDropdownOpen(false);
                          }}
                          className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0 flex items-center gap-3"
                        >
                          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center border border-slate-200">
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
                              return <User size={14} className="text-slate-400" />;
                            })()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-800 flex items-center gap-2 truncate">
                                {c.computedName || String(getFuzzyKey(c, ["ชื่อ", "col_1"]))}
                                {(c.isApproved !== undefined ? c.isApproved : checkCustomerVipStatus(c)) && <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-yellow-200">VIP</span>}
                            </div>
                            <div className="text-sm text-slate-500">{c.computedPhone || String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]))}</div>
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
                      ))
                    ) : (
                      <div className="px-4 py-3 text-center text-slate-500">�?��่พบลูก�?��า</div>
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
              <p className="text-lg">ตะกร้าว่า�?��ปล่า</p>
              <p className="text-sm mt-2 text-slate-400">เพิ่มสิน�?��าจากรายการด้านซ้าย</p>
            </div>
          ) : (
            <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
              {cart.map((item) => {
                let imgUrl = null;
                if (item.type === 'product' && item.originalItem) {
                  let p = item.originalItem;
                  const productName = String(getFuzzyKey(p, ["ชื่อสิน�?��า", "col_2"]) || item.name);
                  const productCode = String(getFuzzyKey(p, ["รหัส", "col_1"]) || '');
                  
                  const wooImg = (productCode ? wooImagesMap.get(productCode.trim().toUpperCase()) : null) || wooImagesMap.get(productName.toLowerCase());
                  
                  if (wooImg) {
                      imgUrl = wooImg;
                  } else {
                      let imgFilename = p["รูปสิน�?��า"] || p["image"] || p["imageUrl"] || p["รูป�?า�?"] || p["img"];
                      if (!imgFilename) {
                        for (const key of Object.keys(p)) {
                          const val = String(p[key] || '').trim();
                          if (val.match(/\.(jpeg|jpg|gif|png|webp)$/i) || val.includes('.รูปสิน�?��า.')) {
                            imgFilename = val;
                            break;
                          }
                        }
                      }
                      if (imgFilename) {
                         if (imgFilename.startsWith('http')) imgUrl = imgFilename;
                         else imgUrl = `https://crm.irisnatures.com/สิน�?��า_Images/${encodeURI(imgFilename.replace(/^\/+/, ''))}`;
                      } else {
                         imgUrl = `https://crm.irisnatures.com/สิน�?��า_Images/${encodeURIComponent(item.name)}.jpg`;
                      }
                  }
                }

                return (
                <div key={`${item.type}-${item.id}`} className="flex items-center justify-between gap-2 p-2 border-b border-slate-100 bg-white hover:bg-slate-50 transition-colors last:border-0">
                  
                  <div className="flex-1 min-w-0 pr-1 flex items-center gap-2">
                    {imgUrl ? (
                      <img src={imgUrl} onError={(e) => { e.target.onerror = null; e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>'; }} className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-50 p-[2px]" />
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
                        <div className="text-[10px] text-slate-400 mt-[2px] truncate" title={String(getFuzzyKey(item.originalItem, ["หมวดสิน�?��า", "col_4"]) || 'ทั่ว�?�?')}>
                          แบรนด�?/หมวดหมู�?: <span className="font-medium text-slate-500">{String(getFuzzyKey(item.originalItem, ["หมวดสิน�?��า", "col_4"]) || 'ทั่ว�?�?')}</span>
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
                            className="w-full text-right text-[11px] font-bold text-slate-700 bg-transparent border-b border-dashed border-slate-300 px-0 py-0 focus:outline-none focus:border-indigo-500 hover:border-indigo-300"
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
            <div className="flex justify-between items-center text-sm">
              <span>ยอดรวม (Subtotal)</span>
              <span className="font-semibold text-slate-800">฿{subtotal.toLocaleString()}</span>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">ส่วนล�? (Discount)</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">฿</span>
                  <input 
                    type="number"
                    value={globalDiscount || ''}
                    onChange={(e) => setGlobalDiscount(parseNumber(e.target.value))}
                    placeholder="0"
                    className="w-24 text-right bg-white border border-slate-200 rounded-lg px-2 py-1 text-red-500 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

            <div className="pt-3 border-t border-slate-200 flex justify-between items-end">
              <div>
                <span className="font-semibold text-slate-800 block">ยอดชำระสุทธิ</span>
                {totalSaved > 0 && <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mt-1 inline-block">ส่วนลดพิเศษ: ฿{totalSaved.toLocaleString()}</span>}
              </div>
              <span className="text-3xl font-bold text-indigo-600 tracking-tight">฿{total.toLocaleString()}</span>
            </div>
          </div>

          <button 
            onClick={() => {
              if (cart.length === 0) {
                showToast('�?��่มีสิน�?��า�?��ตะกร้า');
                return;
              }
              const hasCourse = cart.some(i => i.type === 'course');
              if (hasCourse && !selectedCustomer) {
                showToast('มีรายการ�?��ร์ส�?��ตะกร้า โปรดเลือกลูก�?��าก่อนชำระเ�?���?', 'error');
                return;
              }
              if (!splitPayment.cash && !splitPayment.transfer && !splitPayment.cod && !splitPayment.credit) {
                setSplitPayment({ cash: 0, transfer: total, cod: 0, credit: 0 });
              }
              setShowPaymentModal(true);
            }}
            disabled={cart.length === 0}
            className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${cart.length === 0 ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'}`}
          >
            <CheckCircle size={24} /> ดำเนินการชำระเ�?���?
          </button>
        </div>
      </div>
    </div>
    
    {/* Payment Modal */}
    {showPaymentModal && (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm print:hidden">
        <div className={`bg-white rounded-3xl p-6 w-full ${cart.some(i => i.type === 'usage') ? 'max-w-2xl' : 'max-w-sm'} shadow-2xl flex flex-col max-h-[95vh] overflow-y-auto`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800">ช่อ�?��า�?��ารชำระเ�?���?</h2>
            <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>
          
          <div className="mb-4">
            <div className="text-sm font-semibold text-slate-700 mb-2">ช่อ�?��า�?��ารสั่�?��ื้อ</div>
            <div className="flex gap-2">
              <button onClick={() => { setOrderChannel('instore'); setSplitPayment(prev => ({ ...prev, transfer: total - prev.cash - prev.cod - prev.credit })); }} className={`flex-1 py-2 rounded-lg font-bold text-sm ${orderChannel === 'instore' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>หน้าร้า�?</button>
              <button onClick={() => { setOrderChannel('shopee'); setSplitPayment({ cash: 0, transfer: 0, cod: total, credit: 0 }); }} className={`flex-1 py-2 rounded-lg font-bold text-sm ${orderChannel === 'shopee' ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>ช้อปปี�?</button>
              <button onClick={() => { setOrderChannel('chat'); setSplitPayment({ cash: 0, transfer: 0, cod: total, credit: 0 }); }} className={`flex-1 py-2 rounded-lg font-bold text-sm ${orderChannel === 'chat' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>ทา�?��ช�?</button>
              <button onClick={() => { setOrderChannel('web'); setSplitPayment({ cash: 0, transfer: 0, cod: total, credit: 0 }); }} className={`flex-1 py-2 rounded-lg font-bold text-sm ${orderChannel === 'web' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>ทา�?��ว�?�?</button>
            </div>
          </div>
          
          {orderChannel !== 'instore' && (
            <div className="mb-4 space-y-4">
              <div>
                <div className="text-sm font-semibold text-slate-700 mb-2 flex justify-between">
                  <span>หมายเลข�?��สั่�?��ื้อ / รหัสอ้า�?��ิ�?</span>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={activeWcOrderId || ''}
                    onChange={(e) => setActiveWcOrderId(e.target.value)}
                    placeholder="เช่�? 240822ABCD..." 
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button 
                    onClick={() => setShowScanner(true)}
                    className="bg-indigo-100 text-indigo-600 px-3 py-2 rounded-lg font-bold hover:bg-indigo-200 transition-colors flex items-center justify-center shrink-0"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                  </button>
                </div>
              </div>
              
              <div>
                <div 
                  className="text-sm font-semibold text-slate-700 mb-2 flex justify-between items-center cursor-pointer select-none bg-slate-50 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                  onClick={() => setShowShippingAddress(!showShippingAddress)}
                >
                  <span className="flex items-center gap-2">
                    <Truck size={16} className="text-slate-500" /> ที่อยู่จัดส่�? 
                    {shippingAddress && <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded">มีข้อมูลแล้ว</span>}
                  </span>
                  <span className="text-slate-400">{showShippingAddress ? '▲' : '▼'}</span>
                </div>
                
                {showShippingAddress && (
                  <div className="space-y-3 mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex gap-3 justify-end">
                      {shippingAddress && (
                        <button 
                            onClick={() => {
                              const tempReceipt = {
                                orderNo: activeWcOrderId || 'DRAFT',
                                createdAt: new Date(),
                                splitPayment: { cod: splitPayment.cod > 0 ? splitPayment.cod : 0 },
                                shippingAddress: shippingAddress,
                              };
                              setReceiptData(tempReceipt);
                              setPrintMode('label');
                              setTimeout(() => {
                                window.print();
                                setReceiptData(null);
                              }, 50);
                            }}
                            className="text-xs text-orange-600 hover:underline flex items-center gap-1 font-bold"
                        >
                            <Truck size={12} /> พิมพ์�?��แปะหน้า
                        </button>
                      )}
                      {selectedCustomer && (
                          <button 
                              onClick={() => setShippingAddress(`${String(getFuzzyKey(selectedCustomer, ["ชื่อ", "col_1"]))}\n${String(getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3"]))}\n${String(getFuzzyKey(selectedCustomer, ["ที่อยู�?", "col_4"]) || '')}`)}
                              className="text-xs text-indigo-600 hover:underline"
                          >
                              + ดึ�?��้อมูลลูก�?��า
                          </button>
                      )}
                    </div>
                    <textarea 
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="ชื่อ ที่อยู�? เบอร์โทร สำหรับจัดส่�?..."
                      className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 h-20 resize-none"
                    ></textarea>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="text-center mb-6">
            <div className="text-sm text-slate-500 mb-1">ยอดสุทธิที่ต้อ�?��ำระ</div>
            <div className="text-3xl font-bold text-indigo-600">฿{total.toLocaleString()}</div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm font-semibold mb-2">
              <span className="text-slate-700">ระบุยอดเ�?���?:</span>
              {total - totalPaid > 0 && <span className="text-red-500 text-xs">ขา�? ฿{(total - totalPaid).toLocaleString()}</span>}
              {totalPaid - total > 0 && <span className="text-orange-500 text-xs">เกิ�? ฿{(totalPaid - total).toLocaleString()}</span>}
            </div>

            {[
              { key: 'transfer', label: 'โอนเ�?���?', icon: Smartphone }, 
              { key: 'cash', label: 'เ�?��นส�?', icon: Banknote }, 
              { key: 'cod', label: '�?��า�?/COD', icon: Clock },
              ...(customerCreditBalance > 0 ? [{ key: 'credit', label: '�?��้เ�?��ดิ�?', icon: CreditCard }] : [])
            ].map((method) => (
              <div key={method.key} className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    let fillAmt = Math.max(0, total - (totalPaid - (splitPayment[method.key] || 0)));
                    if (method.key === 'credit' && fillAmt > customerCreditBalance) fillAmt = customerCreditBalance;
                    setSplitPayment(prev => ({ ...prev, [method.key]: fillAmt }));
                  }}
                  className="flex-1 flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl hover:bg-indigo-50 transition-colors text-slate-600 focus:outline-none"
                  title="�?��ิกเพื่อเติมยอดที่เหลือ"
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
                      let val = parseNumber(e.target.value);
                      if (method.key === 'credit' && val > customerCreditBalance) val = customerCreditBalance;
                      setSplitPayment(prev => ({ ...prev, [method.key]: val }));
                    }}
                    placeholder="0"
                    className={`w-28 text-right bg-slate-50 border rounded-xl px-3 py-2 text-base font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${splitPayment[method.key] > 0 ? 'border-indigo-300 text-indigo-700 bg-indigo-50/30' : 'border-slate-200 text-slate-800'}`}
                  />
                </div>
              </div>
            ))}
          </div>

          {cart.some(i => i.type === 'usage') && (
            <div className="space-y-4 mb-6 border-t border-slate-200 pt-4">
              <h3 className="font-bold text-slate-700">ข้อมูลการรับบริการ</h3>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">พนัก�?��นผู้�?��้บริการ <span className="text-red-500">*</span></label>
                <select value={paymentStaff} onChange={e => setPaymentStaff(e.target.value)} className="w-full border-2 border-slate-100 rounded-xl p-2 outline-none focus:border-indigo-400">
                  <option value="">-- เลือกพนัก�?���? --</option>
                  {employees.filter(emp => !globalBranch || emp.branch === globalBranch || emp.branch === 'สำนัก�?��น�?��ญ�?').map(emp => (
                    <option key={emp.id} value={emp.name}>{emp.name} ({emp.branch})</option>
                  ))}
                </select>
              </div>

              <div>
                 <label className="block text-xs font-bold text-slate-500 mb-1">อัปโหลดรูป�?า�? Before/After (ถ้ามี)</label>
                 <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => setPaymentPhotoUrl(e.target.result);
                        reader.readAsDataURL(file);
                    }
                 }} className="text-sm w-full file:bg-indigo-50 file:text-indigo-600 file:px-4 file:py-2 file:border-none file:rounded-xl cursor-pointer" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <SignaturePad canvasRef={custSigRef} label="ลายเซ�?��ลูก�?��า" />
                 <SignaturePad canvasRef={staffSigRef} label="ลายเซ�?��พนัก�?���?" />
              </div>
            </div>
          )}

          <button 
            onClick={() => {
                const hasUsage = cart.some(i => i.type === 'usage');
                if (hasUsage) {
                   if (!paymentStaff) return showToast('กรุณาเลือกพนัก�?��นผู้�?��้บริการ', 'error');
                   if (custSigRef.current?.dataset?.isSigned !== "true" || staffSigRef.current?.dataset?.isSigned !== "true") {
                       return showToast('กรุณา�?��้ลูก�?��าและพนัก�?��นเซ�?��ชื่อ�?��้�?��บถ้วนก่อนยืนยั�?', 'error');
                   }
                }
                setShowPaymentModal(false);
                handleCheckout();
            }}
            disabled={isProcessing || totalPaid !== total}
            className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${(isProcessing || totalPaid !== total) ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'}`}
          >
            {isProcessing ? (
              <><span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> กำลั�?��ระมวลผล...</>
            ) : (
              <><CheckCircle size={24} /> ยืนยันการชำระเ�?���?</>
            )}
          </button>
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
          <h2 className="text-2xl font-bold text-slate-800 mb-1">ชำระเ�?��นเรียบร้อย!</h2>
          <p className="text-slate-500 text-sm mb-4">เลขที่บิล: {receiptData.orderNo}</p>
          
          {/* WooCommerce Sync Status */}
          {wooSyncStatus.length > 0 && (
            <div className="w-full mb-4 bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">ซิ�?�?��สต๊อกขึ้นเว�?�? (WooCommerce)</div>
              {wooSyncStatus.map((s, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-700 truncate flex-1">{s.name}</span>
                  <span className="text-xs text-slate-400 shrink-0">�? {s.newStock} ชิ้�?</span>
                  {s.status === 'pending' && (
                    <span className="flex items-center gap-1 text-xs text-amber-500 font-bold shrink-0">
                      <span className="animate-spin inline-block w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full"></span>
                      กำลั�?��่�?...
                    </span>
                  )}
                  {s.status === 'success' && (
                    <span className="text-xs text-emerald-600 font-bold shrink-0">�? สำเร�?�?</span>
                  )}
                  {s.status === 'failed' && (
                    <span className="text-xs text-rose-500 font-bold shrink-0">�? ล้มเหลว</span>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <div className="w-full space-y-3">
            <button 
              onClick={() => {
                setPrintMode('receipt');
                setTimeout(() => window.print(), 50);
              }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-200 transition-colors flex items-center justify-center gap-2"
            >
              พิมพ์�?��เสร�?�? (80mm)
            </button>
            {receiptData.orderChannel !== 'instore' && (
              <button 
                onClick={() => {
                  setPrintMode('label');
                  setTimeout(() => window.print(), 50);
                }}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-md shadow-orange-200 transition-colors flex items-center justify-center gap-2"
              >
                พิมพ์�?��แปะหน้า (4x6 นิ้ว)
              </button>
            )}
            <button 
              onClick={() => {
                setReceiptData(null);
                setCart([]);
                setSelectedCustomer(null);
                setCustomerSearch('');
                setGlobalDiscount(0);
                setSplitPayment({ cash: 0, transfer: 0, cod: 0, credit: 0 });
                setShippingAddress('');
                setOrderChannel('instore');
                setActiveWcOrderId(null);
                setIsMobileCartOpen(false);
              }}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
            >
              ทำรายการ�?��ม�?
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
            size: ${printMode === 'receipt' ? '80mm auto' : '100mm 150mm'};
            margin: 0;
          }
          body {
            background: white !important;
          }
          #root {
            visibility: hidden !important;
          }
          #pos-print-area, #pos-print-area * {
            visibility: visible !important;
          }
          #pos-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
        }
      `}
    </style>

    {/* Printable Containers wrapped in #pos-print-area */}
    {receiptData && (
      <div id="pos-print-area">
        {/* Printable Receipt (80mm Thermal format) */}
        {printMode === 'receipt' && (
          <div className="hidden print:block w-[80mm] max-w-full text-black font-sans bg-white m-0 p-2 text-sm leading-tight mx-auto">
        <div className="text-center mb-4">
          <h1 className="font-bold text-xl mb-1">IRIS NATURES</h1>
          <p className="text-xs">{globalBranch || "สำนัก�?��น�?��ญ�?"}</p>
          <p className="text-xs mb-2">�?��เสร�?��รับเ�?���? / Receipt</p>
          <div className="text-left text-xs border-b border-dashed border-black pb-2 mb-2">
            <div>บิล: {receiptData.orderNo}</div>
            <div>วันที�?: {new Date(receiptData.createdAt).toLocaleString('th-TH')}</div>
            <div>ลูก�?��า: {receiptData.customerName}</div>
          </div>
        </div>

        <table className="w-full text-xs mb-2">
          <thead>
            <tr className="border-b border-dashed border-black">
              <th className="text-left py-1">รายการ</th>
              <th className="text-center py-1">จำนว�?</th>
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
          {receiptData.globalDiscount > 0 && (
            <div className="flex justify-between">
              <span>ส่วนล�? (Discount):</span>
              <span>-{receiptData.globalDiscount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm mt-1">
            <span>ยอดสุทธิ (Total):</span>
            <span>{receiptData.total.toLocaleString()}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-black pt-2 mb-4 text-xs space-y-1">
          <div className="font-bold mb-1">การชำระเ�?���?:</div>
          {receiptData.splitPayment.cash > 0 && (
            <div className="flex justify-between">
              <span>เ�?��นส�?:</span>
              <span>{receiptData.splitPayment.cash.toLocaleString()}</span>
            </div>
          )}
          {receiptData.splitPayment.transfer > 0 && (
            <div className="flex justify-between">
              <span>โอนเ�?���?:</span>
              <span>{receiptData.splitPayment.transfer.toLocaleString()}</span>
            </div>
          )}
          {receiptData.splitPayment.cod > 0 && (
            <div className="flex justify-between">
              <span>�?��า�?/COD:</span>
              <span>{receiptData.splitPayment.cod.toLocaleString()}</span>
            </div>
          )}
          {receiptData.totalSaved > 0 && (
            <div className="flex justify-between mt-2 font-bold text-emerald-600">
              <span>ส่วนลดพิเศษ:</span>
              <span>{receiptData.totalSaved.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="text-center text-xs mt-6 pb-8 border-t border-dashed border-black pt-4">
          <p>ขอบ�?��ณที่�?��้บริการ</p>
          <p>Thank you for shopping with us!</p>
        </div>
      </div>
    )}

        {/* Printable Shipping Label (100x150mm format) */}
        {printMode === 'label' && (
          <div className="hidden print:flex print:flex-col w-[100mm] h-[150mm] max-w-full text-black font-sans bg-white m-0 p-4 leading-tight mx-auto border-2 border-black box-border">
        <div className="border-b-2 border-black pb-3 mb-3 flex justify-between items-start">
          <div>
            <h1 className="font-black text-2xl mb-1">ผู้ส่�? (SENDER)</h1>
            <p className="font-bold text-sm">IRIS NATURES</p>
            <p className="text-xs">{globalBranch || "สำนัก�?��น�?��ญ�?"}</p>
            <p className="text-xs mt-1">เลขที่ออเดอร�?: <span className="font-bold">{receiptData.orderNo}</span></p>
            <p className="text-xs">วันที�?: {new Date(receiptData.createdAt).toLocaleDateString('th-TH')}</p>
          </div>
          <div className="text-right">
             <div className="text-4xl font-black border-4 border-black px-3 py-1 inline-block">
                {receiptData.splitPayment.cod > 0 ? 'COD' : 'PAID'}
             </div>
             {receiptData.splitPayment.cod > 0 && (
                <div className="text-xl font-bold mt-2">เก�?��เ�?���?: ฿{receiptData.splitPayment.cod.toLocaleString()}</div>
             )}
          </div>
        </div>
        
        <div className="flex-1 border-b-2 border-black pb-3 mb-3">
          <h1 className="font-black text-2xl mb-3">ผู้รั�? (RECEIVER)</h1>
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
           <h2 className="font-bold text-lg mb-2">รายการสิน�?��า ({receiptData.items.length} รายการ):</h2>
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
    )}

    {/* End of Day Modal */}
    {showEodModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm print:hidden">
        <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800">สรุปส่�?��อดประจำวั�?</h2>
            <button onClick={() => setShowEodModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>
          
          <div className="space-y-4 mb-6">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-500 font-bold">ยอดขายเ�?��นส�? (�?��ระบ�?)</span>
                <span className="font-bold text-indigo-600">฿{todaySalesBreakdown.cash.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
              <div className="flex justify-between text-sm">
                <span className="text-blue-700 font-bold">ยอดโอนเ�?��นทั้�?��ม�?</span>
                <span className="font-bold text-blue-700">฿{todaySalesBreakdown.transfer.toLocaleString()}</span>
              </div>
              {todaySalesBreakdown.transferDetails?.length > 0 && (
                <div className="max-h-32 overflow-y-auto space-y-1 mt-2 pt-2 border-t border-blue-200">
                  {todaySalesBreakdown.transferDetails.map((t, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-blue-600">
                      <span>{t.time} - {t.customer}</span>
                      <span className="font-semibold">฿{t.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {todaySalesBreakdown.credit > 0 && (
              <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                <div className="flex justify-between text-sm">
                  <span className="text-orange-700 font-bold">ยอด�?��้เ�?��ดิตทั้�?��ม�?</span>
                  <span className="font-bold text-orange-700">฿{todaySalesBreakdown.credit.toLocaleString()}</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">เ�?��นทอนตั้�?��้น�?��ลิ้นชั�?</label>
              <input 
                type="number" 
                value={eodData.floatCash}
                onChange={(e) => setEodData({...eodData, floatCash: e.target.value})}
                placeholder="ระบุจำนวนเ�?��นทอ�?"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">ยอดเ�?��นสดที่นับ�?��้จริ�? (รวมเ�?��นทอ�?)</label>
              <input 
                type="number" 
                value={eodData.actualCash}
                onChange={(e) => setEodData({...eodData, actualCash: e.target.value})}
                placeholder="ระบุจำนวนเ�?��นส�?"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="block text-sm font-bold text-slate-700 mb-1">ผู้ส่�?��อ�? (พนัก�?���?)</label>
              <select
                value={eodData.submittedBy}
                onChange={(e) => setEodData({...eodData, submittedBy: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- เลือกพนัก�?���? --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
              
              {eodData.submittedBy && (
                 <label className="flex items-center gap-2 mt-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={eodData.clockOut} 
                      onChange={(e) => setEodData({...eodData, clockOut: e.target.checked})} 
                      className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-bold text-slate-700">บันทึกเวลาออก�?��นขอ�?��ันด้วยเลย</span>
                 </label>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">รูปสลิ�? / สรุปยอ�? (�?��่บั�?�?���?)</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {eodData.imageBase64 && (
                <div className="mt-2 relative inline-block">
                  <img src={eodData.imageBase64} alt="EOD Slip" className="h-24 w-auto rounded-lg border border-slate-200 object-cover" />
                  <button 
                    onClick={() => setEodData({ ...eodData, imageBase64: '' })}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
            
            {(() => {
              const expectedCash = todaySalesBreakdown.cash + (parseNumber(eodData.floatCash) || 0);
              const actual = parseNumber(eodData.actualCash) || 0;
              const diff = actual - expectedCash;
              
              if (!eodData.actualCash || !eodData.floatCash) return null;
              
              return (
                <div className={`p-4 rounded-xl border shadow-sm ${diff > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : diff < 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                  <div className="flex justify-between font-bold text-sm">
                    <span>สถานะเ�?��นส�?</span>
                    <span>{diff > 0 ? 'ยอดเกิ�?' : diff < 0 ? 'ยอดขา�?' : 'ยอดพอดี'}</span>
                  </div>
                  <div className="text-3xl font-black text-center my-2">
                    {diff > 0 ? '+' : ''}{diff.toLocaleString()}
                  </div>
                  <div className="text-xs text-center font-medium opacity-80">
                    �?��รมี�?��ลิ้นชั�?: ฿{expectedCash.toLocaleString()}
                  </div>
                </div>
              )
            })()}
          </div>

          <button 
            onClick={handleEodSubmit}
            disabled={isSubmittingEod || eodData.actualCash === '' || eodData.floatCash === ''}
            className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${(isSubmittingEod || eodData.actualCash === '' || eodData.floatCash === '') ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'}`}
          >
            {isSubmittingEod ? (
              <><span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> กำลั�?��่�?��อ�?...</>
            ) : (
              <><CheckCircle size={24} /> ยืนยันการส่�?��อ�?</>
            )}
          </button>
        </div>
      </div>
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
            <h3 className="text-xl font-black text-slate-800 leading-tight">{String(getFuzzyKey(stockInputModal.item, ["ชื่อสิน�?��า", "col_2"]))}</h3>
            <p className="text-sm text-slate-500 mt-1">รหัส: {String(getFuzzyKey(stockInputModal.item, ["รหัส", "col_1"]))}</p>
          </div>
          
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">นับสต๊อก�?��้จริ�? (ชิ้�?)</label>
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
                  const oldStock = parseNumber(getBranchStock(stockInputModal.item, globalBranch || 'สำนัก�?��น�?��ญ�?'));
                  setStockAdjustments(prev => {
                    const existing = prev.filter(a => a.id !== stockInputModal.item.id);
                    return [...existing, { 
                      id: stockInputModal.item.id, 
                      name: String(getFuzzyKey(stockInputModal.item, ["ชื่อสิน�?��า", "col_2"])),
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
              const oldStock = parseNumber(getBranchStock(stockInputModal.item, globalBranch || 'สำนัก�?��น�?��ญ�?'));
              setStockAdjustments(prev => {
                const existing = prev.filter(a => a.id !== stockInputModal.item.id);
                return [...existing, { 
                  id: stockInputModal.item.id, 
                  name: String(getFuzzyKey(stockInputModal.item, ["ชื่อสิน�?��า", "col_2"])),
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
            บันทึ�?
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
              <Package className="text-rose-500" /> ยืนยันการปรับปรุ�?��ต๊อ�?
            </h3>
            <button onClick={() => setIsStockConfirmModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors bg-slate-50 hover:bg-slate-100">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-5 overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-3 font-bold rounded-tl-xl">รายการสิน�?��า</th>
                  <th className="p-3 font-bold text-center">สต๊อกเดิม</th>
                  <th className="p-3 font-bold text-center">สต๊อก�?��ม�?</th>
                  <th className="p-3 font-bold text-center rounded-tr-xl">ผลต่า�?</th>
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
              ยกเลิ�?
            </button>
            <button 
              onClick={async () => {
                try {
                  const batch = writeBatch(db);
                  
                  for (const adj of stockAdjustments) {
                    const pRef = doc(db, 'products', adj.id);
                    const targetBranch = globalBranch || 'เฉว�?';
                    const currentStockByBranch = adj.originalItem.stock_by_branch || {};
                    const newStockByBranch = { ...currentStockByBranch, [targetBranch]: adj.newStock };
                    batch.update(pRef, { stock_by_branch: newStockByBranch });
                  }
                  
                  await batch.commit();
                  showToast('อัปเดตสต๊อกเรียบร้อยแล้ว', 'success');
                  setStockAdjustments([]);
                  setIsStockConfirmModalOpen(false);
                  setIsStockMode(false);
                } catch(e) {
                  showToast('เกิดข้อผิดพลาด�?��การอัปเดตสต๊อ�?', 'error');
                }
              }}
              className="flex-[2] py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black shadow-lg shadow-rose-200 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle size={20} /> ยืนยันการอัปเดตสต๊อ�?
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
                <h2 className="text-xl font-bold text-slate-800 leading-tight">ออเดอร์จากเว�?�? (WooCommerce)</h2>
                <p className="text-sm text-slate-500">สถานะ: กำลั�?��ำเนินการ (Processing)</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={fetchWebOrdersManual} 
                disabled={isFetchingWebOrders}
                className="flex items-center gap-2 px-4 py-2 bg-white text-sky-600 hover:bg-sky-50 rounded-xl font-bold transition-colors shadow-sm disabled:opacity-50"
              >
                <Clock size={18} className={isFetchingWebOrders ? "animate-spin" : ""} /> 
                {isFetchingWebOrders ? "กำลั�?��ึ�?..." : "ดึ�?��อเดอร์ล่าสุ�?"}
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
                 <p className="font-semibold">กำลั�?��ึ�?��้อมูลออเดอร�?...</p>
              </div>
            ) : webOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                 <Package size={48} className="mb-4 opacity-20" />
                 <p className="font-bold text-lg text-slate-500">�?��่มีออเดอร์�?��ม�?</p>
                 <p className="text-sm">ระบบจะดึ�?��้อมูลอัตโนมัติทุก�? 1 นาที</p>
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
                                   const pName = String(getFuzzyKey(p, ["ชื่อสิน�?��า", "col_2"])).toLowerCase();
                                   const pSku = String(getFuzzyKey(p, ["รหัส", "col_1"])).toUpperCase();
                                   return (wSku && pSku === wSku) || pName.includes(wName) || wName.includes(pName);
                                });
                                
                                if (posProduct) {
                                  const fullPrice = parseNumber(getFuzzyKey(posProduct, ["รา�?��ขายเต�?��", "col_6"]));
                                  
                                  newCart.push({
                                    id: posProduct.id,
                                    name: String(getFuzzyKey(posProduct, ["ชื่อสิน�?��า", "col_2"])),
                                    price: parseFloat(wItem.price) || fullPrice,
                                    originalPrice: fullPrice,
                                    qty: wItem.quantity,
                                    type: 'product',
                                    maxQty: parseQty(getFuzzyKey(posProduct, ["จำนวน�?�?��หลือ", "col_12"])),
                                    originalItem: posProduct,
                                    isManualPrice: true
                                  });
                                } else {
                                  missingItems.push(wItem.name);
                                }
                              });
                              
                              if (missingItems.length > 0) {
                                showToast(`�?��่พบสิน�?��า�?��ระบ�?: ${missingItems.join(', ')} (กรุณาเพิ่มเอ�?)`, 'error');
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
                              showToast('นำเข้าออเดอร์สำเร�?�?! กรุณาตรวจสอบและชำระเ�?���?', 'success');
                            }}
                            className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold shadow-md shadow-sky-200 transition-all flex items-center justify-center gap-2"
                          >
                            <ShoppingCart size={16} /> นำเข้าตะกร้า
                          </button>

                          <button
                            onClick={async () => {
                              const trackingNo = prompt(`สแกนหรือพิมพ์เลขพัสดุสำหรับออเดอร�? #${order.id}:`);
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
                                        note: `ออเดอร์ขอ�?�?��ณถูกจัดส่�?��ล้ว\nหมายเลขพัสดุ (Tracking Number): ${trackingNo}`,
                                        customer_note: true
                                    })
                                });
                                
                                showToast('อัปเดตสถานะจัดส่�?��รียบร้อยแล้ว', 'success');
                                fetchWebOrdersManual();
                              } catch (err) {
                                showToast('เกิดข้อผิดพลาด�?��การจัดส่�?', 'error');
                                setIsFetchingWebOrders(false);
                              }
                            }}
                            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-md shadow-emerald-200 transition-colors flex items-center justify-center gap-2"
                          >
                            <Truck size={16} /> ระบุเลขพัสดุ (จัดส่�?)
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
              <h2 className="text-xl font-bold text-slate-800">เปรียบเทียบสต๊อ�? POS vs เว�?�?</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {isLoadingCompare ? 'กำลั�?��หล�?...' : `${stockCompareData.length} สิน�?��า�?�? POS · จับ�?��่�?���? ${stockCompareData.filter(r => r.matched).length} รายการ (เทียบจากรหัส SKU)`}
              </p>
            </div>
            <button onClick={() => setShowStockCompare(false)} className="w-9 h-9 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-xl"><X size={18} className="text-slate-500"/></button>
          </div>

          <div className="overflow-y-auto flex-1">
            {isLoadingCompare ? (
              <div className="flex items-center justify-center py-20">
                <span className="animate-spin w-8 h-8 border-4 border-violet-400 border-t-transparent rounded-full mr-3"></span>
                <span className="text-slate-500 font-medium">กำลั�?��ึ�?��้อมูลจากเว�?�?...</span>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left p-3 font-semibold text-slate-600">รหัส (SKU)</th>
                    <th className="text-left p-3 font-semibold text-slate-600">ชื่อสิน�?��า (POS)</th>
                    <th className="text-center p-3 font-semibold text-slate-600">สต๊อ�? POS</th>
                    <th className="text-center p-3 font-semibold text-slate-600">สต๊อกบนเว�?�?</th>
                    <th className="text-center p-3 font-semibold text-slate-600">ต่า�?</th>
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
                        <td className="p-3 font-mono text-xs text-slate-500">{row.sku || <span className="text-slate-300 italic">�?��่มีรหัส</span>}</td>
                        <td className="p-3 font-semibold text-slate-800">{row.name}</td>
                        <td className="p-3 text-center font-bold text-indigo-600">{row.posStock}</td>
                        <td className="p-3 text-center">
                          {!row.matched ? <span className="text-orange-500 font-semibold">�?��่พบบนเว�?�?</span>
                           : notManaged ? <span className="text-slate-400">�?��่�?��้จัดการสต๊อ�?</span>
                           : <span className={`font-bold ${isOk ? 'text-emerald-600' : 'text-rose-600'}`}>{wooNum}</span>}
                        </td>
                        <td className="p-3 text-center font-bold">
                          {diff === null ? '-'
                           : diff === 0 ? <span className="text-emerald-600">�?</span>
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
            <span className="w-3 h-3 rounded bg-rose-50 border border-rose-200 inline-block"></span> สต๊อก�?��่ตร�?��ั�?
            <span className="w-3 h-3 rounded bg-orange-50 border border-orange-200 inline-block ml-2"></span> �?��่พบสิน�?��าบนเว�?�?
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
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={(text) => {
          setActiveWcOrderId(text);
          setShowScanner(false);
          showToast(`แสกนหมายเล�?: ${text}`, 'success');
        }}
      />
      
      <SalesHistoryModal
        isOpen={showSalesHistory}
        onClose={() => setShowSalesHistory(false)}
        showToast={showToast}
        globalBranch={globalBranch}
        appSettings={appSettings}
        currentMonthSales={currentMonthSales}
        todaySales={todaySales}
        todaySalesBreakdown={todaySalesBreakdown}
        setShowEodModal={setShowEodModal}
      />
  </>
  );
}
