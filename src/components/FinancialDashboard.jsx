import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart3, Calendar, Printer, Store, DollarSign, Banknote, Smartphone, Clock, FileText,
  Target, Image as ImageIcon, Check, X, Eye, ListChecks, Wallet, CheckCircle, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Trash2, History as HistoryIcon,
  Users, Package, Zap, Wifi, Home, Coffee, MoreHorizontal, Droplets, Camera, Info, Calculator, Download,
  ArrowDownToLine, ArrowUpFromLine, Landmark, CreditCard, PieChart, Coins, Building, Edit2
} from 'lucide-react';
import { parseNumber } from '../utils/parse';
import { computeOwnerCostPrice } from '../utils/priceUtils';
import { getOrderStatus, isInPayrollMonth } from '../utils/dateUtils';
import { getFuzzyKey } from '../utils/fuzzy';
import { db, storage } from '../config/firebase';
import { doc, setDoc, updateDoc, deleteDoc, collection, serverTimestamp } from 'firebase/firestore';
import ModalWrapper from './ModalWrapper';
import MonthlyEodPrintModal from './MonthlyEodPrintModal';
import DailyReportPrintModal from './DailyReportPrintModal';

// Helper to get local date string YYYY-MM-DD
const getLocalDateStr = (dateVal) => {
  const d = dateVal ? new Date(dateVal) : new Date();
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to extract correct ISO date from EOD records
const getIsoDate = (d) => {
    if (d.date && d.date.includes('/')) {
        const parts = d.date.split('/');
        if (parts.length === 3) {
           let [day, month, year] = parts;
           day = day.padStart(2, '0');
           month = month.padStart(2, '0');
           year = String(parseInt(year) > 2500 ? parseInt(year) - 543 : year);
           return `${year}-${month}-${day}`;
        }
    }
    return d.createdAt ? getLocalDateStr(d.createdAt) : '';
};

const FIXED_COST_CATEGORIES = ['เงินเดือนพนักงาน', 'ค่าน้ำ', 'ค่าไฟ', 'ค่าอินเทอร์เน็ต', 'ค่าเช่าที่'];
const EXPENSE_COLORS = {
  'เงินเดือนพนักงาน': '#f43f5e',
  'สั่งซื้อสินค้าจากศูนย์ใหญ่': '#eab308',
  'ค่าน้ำ': '#0ea5e9',
  'ค่าไฟ': '#f59e0b',
  'ค่าอินเทอร์เน็ต': '#8b5cf6',
  'ค่าเช่าที่': '#14b8a6',
  'ค่าอุปกรณ์/เบิกจิปาถะ': '#a8a29e',
  'อื่นๆ': '#94a3b8'
};

const DonutChart = ({ data, size = 160, strokeWidth = 24 }) => {
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) return <div className="text-slate-400 text-sm py-8 text-center w-full">ไม่มีข้อมูลค่าใช้จ่าย</div>;

  let currentOffset = 0;
  return (
    <div style={{ width: size, height: size }} className="relative flex items-center justify-center shrink-0">
      <svg width={size} height={size} className="transform -rotate-90">
        {data.map((item, index) => {
          if (item.value === 0) return null;
          const fraction = item.value / total;
          const strokeDasharray = `${fraction * circumference} ${circumference}`;
          const strokeDashoffset = -currentOffset;
          currentOffset += fraction * circumference;
          
          return (
            <circle
              key={index}
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className={`transition-all duration-500 ${item.onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
              onClick={item.onClick}
              title={`${item.label}: ฿${item.value.toLocaleString()}`}
            />
          );
        })}
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">รวม</span>
        <span className="text-sm font-black text-slate-800">฿{total.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default function FinancialDashboard({ orders = [], dailySales = [], appSettings = {}, branches = [], expenses = [], employees = [], histories = [], serviceLogs = [], advancePayments = [], courses = [], attendance = [] }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [filterDate, setFilterDate] = useState(getLocalDateStr());
  const [filterMode, setFilterMode] = useState('day'); // 'day' or 'month'
  const [filterBranch, setFilterBranch] = useState('ทั้งหมด');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDayStr, setSelectedDayStr] = useState(getLocalDateStr());

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [promptModal, setPromptModal] = useState({ isOpen: false, title: '', defaultValue: '', placeholder: '', onConfirm: null, type: 'text' });

  // Helper to show confirm
  const showConfirm = (title, message, onConfirm) => {
     setConfirmModal({ isOpen: true, title, message, onConfirm });
  };
  
  // Helper to show prompt
  const showPrompt = (title, defaultValue, placeholder, onConfirm, type = 'text') => {
     setPromptModal({ isOpen: true, title, defaultValue, placeholder, onConfirm, type });
  };
  const [targetInput, setTargetInput] = useState('');
  const [courseTargetInput, setCourseTargetInput] = useState('');
  const [productTargetInput, setProductTargetInput] = useState('');
  const [targetBranch, setTargetBranch] = useState('สำนักงานใหญ่');
  const [targetProfit, setTargetProfit] = useState(100000);
  const [showFormula, setShowFormula] = useState(false);
  const [showSimulatorModal, setShowSimulatorModal] = useState(false);
  const [simMode, setSimMode] = useState('profit');
  const [simCourseSales, setSimCourseSales] = useState(150000);
  const [simProductSales, setSimProductSales] = useState(50000);
  const [simCourseCostPct, setSimCourseCostPct] = useState(15);
  const [simProductCostPct, setSimProductCostPct] = useState(40);
  const [simOpex, setSimOpex] = useState(100000);
  const [simMargin, setSimMargin] = useState(70);
  const [simTargetProfit, setSimTargetProfit] = useState(50000);
  const [budgetInput, setBudgetInput] = useState('');
  const [isSavingTarget, setIsSavingTarget] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedPaymentCourse, setSelectedPaymentCourse] = useState(null);
  const [expenseForm, setExpenseForm] = useState({ date: getLocalDateStr(), category: 'เงินเดือนพนักงาน', amount: '', note: '', branch: 'สำนักงานใหญ่', receiptFile: null, receiptPreview: null });
  const [treasuryForm, setTreasuryForm] = useState({ amount: '', category: 'เงินทุนตั้งต้น', date: getLocalDateStr(), note: '', branch: 'สำนักงานใหญ่', bankName: '', bankAccountName: '' });
  const [showTreasuryHistory, setShowTreasuryHistory] = useState(null);
  const [isTreasurySummaryOpen, setIsTreasurySummaryOpen] = useState(false);
  const [editingTreasuryId, setEditingTreasuryId] = useState(null);
  const [editTreasuryForm, setEditTreasuryForm] = useState({});
  const expenseCategories = ['เงินเดือนพนักงาน', 'สั่งซื้อสินค้าจากศูนย์ใหญ่', 'ค่าน้ำ', 'ค่าไฟ', 'ค่าอินเทอร์เน็ต', 'ค่าเช่าที่', 'ค่าอุปกรณ์/เบิกจิปาถะ', 'อื่นๆ'];
  const [isSavingExpense, setIsSavingExpense] = useState(false);
  const [showMonthlyPrintModal, setShowMonthlyPrintModal] = useState(false);
  const [showDailyPrintModal, setShowDailyPrintModal] = useState(false);
  const [selectedExpenseCategory, setSelectedExpenseCategory] = useState(null); // { branch: string, category: string }
  const [viewingPO, setViewingPO] = useState(null); // the order object to view

  const branchOptions = ['ทั้งหมด', ...branches.map(b => b.name || b.id)];
  const targetBranches = branches.map(b => b.name || b.id).filter(b => b !== 'ทั้งหมด');
  if (targetBranches.length === 0) targetBranches.push('สำนักงานใหญ่');

  const expenseDataByBranch = useMemo(() => {
    const now = new Date();
    const currentMonthExpenses = expenses.filter(e => {
       if (!e.date) return false;
       const d = new Date(e.date);
       return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const branchMap = {};
    currentMonthExpenses.forEach(e => {
       const b = e.branch || 'ไม่ระบุ';
       if (!branchMap[b]) branchMap[b] = { total: 0, fixedTotal: 0, varTotal: 0, categories: {} };
       branchMap[b].total += e.amount || 0;
       if (FIXED_COST_CATEGORIES.includes(e.category)) {
          branchMap[b].fixedTotal += e.amount || 0;
       } else {
          branchMap[b].varTotal += e.amount || 0;
       }
       if (!branchMap[b].categories[e.category]) branchMap[b].categories[e.category] = 0;
       branchMap[b].categories[e.category] += e.amount || 0;
    });

    return Object.entries(branchMap).map(([branchName, data]) => {
       const chartData = Object.entries(data.categories).map(([cat, val]) => ({
           label: cat,
           value: val,
           color: EXPENSE_COLORS[cat] || '#cbd5e1',
           onClick: () => setSelectedExpenseCategory({ branch: branchName, category: cat })
       })).sort((a,b) => b.value - a.value);

       return {
           branchName,
           total: data.total,
           fixedTotal: data.fixedTotal,
           varTotal: data.varTotal,
           chartData
       };
    }).sort((a,b) => b.total - a.total);
  }, [expenses]);

  useEffect(() => {
    if (appSettings?.branchTargets?.[targetBranch]) {
      setTargetInput(appSettings.branchTargets[targetBranch]);
    } else {
      setTargetInput('');
    }
    if (appSettings?.courseTargets?.[targetBranch]) {
      setCourseTargetInput(appSettings.courseTargets[targetBranch]);
    } else {
      setCourseTargetInput('');
    }
    if (appSettings?.productTargets?.[targetBranch]) {
      setProductTargetInput(appSettings.productTargets[targetBranch]);
    } else {
      setProductTargetInput('');
    }
    if (appSettings?.branchBudgets?.[targetBranch]) {
      setBudgetInput(appSettings.branchBudgets[targetBranch]);
    } else {
      setBudgetInput('');
    }
  }, [appSettings, targetBranch]);

  // Helper to parse payment method string back to numbers
  const parsePaymentStr = (str) => {
    let cash = 0, transfer = 0, cod = 0;
    if (!str) return { cash, transfer, cod };
    if (str === 'ฟรี/ส่วนลดเต็มจำนวน') return { cash, transfer, cod };
    const parts = str.split(', ');
    parts.forEach(p => {
      if (p.startsWith('เงินสด:')) cash = parseNumber(p.replace('เงินสด:', ''));
      if (p.startsWith('โอนเงิน:')) transfer = parseNumber(p.replace('โอนเงิน:', ''));
      if (p.startsWith('ค้าง/COD:')) cod = parseNumber(p.replace('ค้าง/COD:', ''));
    });
    return { cash, transfer, cod };
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const orderDate = new Date(o.createdAt || o.วันที่);
      let isSame = false;
      if (filterMode === 'month') {
          const m = filterDate.substring(0, 7); // 'YYYY-MM'
          if (o.createdAt && typeof o.createdAt === 'string' && o.createdAt.includes('T')) {
              isSame = o.createdAt.startsWith(m);
          } else {
              isSame = true;
          }
      } else {
          if (o.createdAt && typeof o.createdAt === 'string' && o.createdAt.includes('T')) {
              isSame = getLocalDateStr(o.createdAt) === filterDate;
          } else {
              isSame = true; 
          }
      }
      if (filterDate && !isSame) return false;
      if (filterBranch !== 'ทั้งหมด' && o.branch !== filterBranch) return false;
      if (o.status && getOrderStatus(o) !== 'อนุมัติแล้ว') return false;
      return true;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [orders, filterDate, filterBranch, filterMode]);

  const stats = useMemo(() => {
    let totalSales = 0, totalExpense = 0, totalOPEX = 0, totalNet = 0, totalCOGS = 0;
    let totalCourseCOGS = 0, totalProductCOGS = 0;
    let totalCash = 0, totalTransfer = 0, totalCod = 0, totalOnline = 0;
    let totalSubmitted = 0, totalUnsubmitted = 0;
    let unsubmittedSalesByDateBranch = {};
    let productSales = {};
    let count = 0;
    
    const submittedEodKeys = new Set();
    dailySales.forEach(d => {
      if (d.date && d.branch) {
        submittedEodKeys.add(`${d.date}_${d.branch}`);
      }
    });
    
    filteredOrders.forEach(o => {
      let p = parseNumber(o.price);
      if (o.orderChannel === 'shopee' && o.shopeeNetReceived !== undefined) {
         p = parseNumber(o.shopeeNetReceived);
      }
      
      const isOldPO = (o.courseName || '').includes('[ซื้อเข้า');
      const isReq = o.transactionType === 'branch_requisition' || (o.courseName || '').includes('[เบิกจาก');
      const isPO = o.transactionType === 'owner_purchase' || isOldPO;
      
      if (isReq) return;

      if (isPO) {
        totalExpense += p;
      } else {
        // Subtract debt_payment from totalSales to prevent double counting
        let debtPaymentAmt = 0;
        if (o.cartItems && Array.isArray(o.cartItems)) {
            o.cartItems.forEach(item => {
                if (item.type === 'debt_payment') {
                    debtPaymentAmt += (parseNumber(item.price) * parseNumber(item.qty || 1));
                }
            });
        }
        totalSales += Math.max(0, p - debtPaymentAmt);
        
        let cCogs = 0;
        let pCogs = 0;
        
        if (o.courseCost !== undefined && o.productCost !== undefined) {
           cCogs = parseNumber(o.courseCost);
           pCogs = parseNumber(o.productCost);
        } else if (o.cartItems && Array.isArray(o.cartItems)) {
           o.cartItems.forEach(item => {
               if (item.actionType === 'owner_purchase' || item.actionType === 'branch_requisition' || item.type === 'usage' || item.type === 'debt_payment') return;
               if (item.type === 'course') {
                   cCogs += (parseNumber(item.price) * parseNumber(item.qty)) * 0.15;
               } else if (item.type === 'product' && item.originalItem) {
                   pCogs += computeOwnerCostPrice(item.originalItem) * parseNumber(item.qty);
               }
           });
        } else {
           pCogs = parseNumber(o.totalCost || 0);
        }
        
        totalCourseCOGS += cCogs;
        totalProductCOGS += pCogs;
        totalCOGS += (cCogs + pCogs);
        count++;
        
        const oDate = new Date(o.createdAt).toLocaleDateString('th-TH');
        const oBranch = o.branch || "สำนักงานใหญ่";
        if (submittedEodKeys.has(`${oDate}_${oBranch}`)) {
          totalSubmitted += p;
        } else {
          totalUnsubmitted += p;
          const key = `${oDate}_${oBranch}`;
          if (!unsubmittedSalesByDateBranch[key]) unsubmittedSalesByDateBranch[key] = 0;
          unsubmittedSalesByDateBranch[key] += p;
        }
        
        const parsed = parsePaymentStr(o.paymentMethod);
        if (parsed.cash === 0 && parsed.transfer === 0 && parsed.cod === 0 && o.paymentMethod && !o.paymentMethod.includes(':') && p > 0) {
            if (o.paymentMethod === 'เงินสด') totalCash += p;
            else if (o.paymentMethod === 'โอนเงิน' || o.paymentMethod === 'ช้อปปี้') totalTransfer += p; // Count Shopee as transfer visually
            else if (o.paymentMethod === 'บัตรเครดิต' || o.paymentMethod === 'ค้าง/COD') totalCod += p;
        } else {
            totalCash += parsed.cash;
            totalTransfer += parsed.transfer;
            totalCod += parsed.cod;
        }
        
        if (o.orderChannel && o.orderChannel !== 'instore') {
            totalOnline += p;
        }
        
        // Aggregate product sales
        if (o.cartItems && Array.isArray(o.cartItems) && o.cartItems.length > 0) {
             o.cartItems.forEach(item => {
                 if (item.type !== 'usage' && item.type !== 'debt_payment' && item.actionType !== 'owner_purchase' && item.actionType !== 'branch_requisition') {
                     const pName = item.name || 'ไม่ระบุชื่อสินค้า';
                     if (!productSales[pName]) productSales[pName] = { qty: 0, revenue: 0 };
                     productSales[pName].qty += Number(item.qty) || 1;
                     productSales[pName].revenue += (parseNumber(item.price) * (Number(item.qty) || 1));
                 }
             });
        } else if (o.courseName) {
             const courses = o.courseName.split(',').map(c => c.trim());
             courses.forEach(cName => {
                 if (cName && !cName.includes('[ซื้อเข้า') && !cName.includes('[เบิกจาก')) {
                     let qty = 1;
                     let name = cName;
                     const match = cName.match(/^(\d+)\s*x\s*(.+)$/);
                     if (match) {
                         qty = parseInt(match[1]);
                         name = match[2];
                     }
                     if (!productSales[name]) productSales[name] = { qty: 0, revenue: 0 };
                     productSales[name].qty += qty;
                     if (courses.length === 1) {
                         productSales[name].revenue += p;
                     }
                 }
             });
        }
      }
    });

    // Add OPEX from expenses collection (Filter by date/branch)
    const filteredExpenses = expenses.filter(e => {
       let isSame = false;
       if (!filterDate) {
         isSame = true;
       } else if (filterMode === 'month') {
         isSame = e.date && e.date.startsWith(filterDate.substring(0, 7));
       } else {
         isSame = e.date === filterDate;
       }
       const isSameBranch = filterBranch === 'ทั้งหมด' || e.branch === filterBranch;
       return isSame && isSameBranch;
    });
    
    filteredExpenses.forEach(e => {
       totalOPEX += parseNumber(e.amount);
    });
    
    let totalDeposit = 0;
    const filteredDailySales = dailySales.filter(d => {
       let isSame = false;
       const isoDate = getIsoDate(d);
       if (!filterDate) {
         isSame = true;
       } else if (filterMode === 'month') {
         isSame = isoDate.startsWith(filterDate.substring(0, 7));
       } else {
         isSame = isoDate === filterDate;
       }
       const isSameBranch = filterBranch === 'ทั้งหมด' || d.branch === filterBranch;
       return isSame && isSameBranch;
    });
    let depositDetails = [];
    let confirmedDeposit = 0;
    filteredDailySales.forEach(d => {
       const amount = parseNumber(d.totalDeposit || d.expectedDeposit || 0);
       totalDeposit += amount;
       if (d.status === 'อนุมัติแล้ว' || d.status === 'รับเงินแล้ว' || d.status === 'ยืนยันแล้ว') {
           confirmedDeposit += amount;
       }
       depositDetails.push({
         id: d.id,
         date: d.date,
         branch: d.branch,
         amount: amount,
         status: d.status || 'รอตรวจสอบ',
         isEstimated: false,
         createdAt: d.createdAt
       });
    });
    
    // Add estimated deposit for unsubmitted days
    let unsubmittedDepositEstimate = 0;
    Object.entries(unsubmittedSalesByDateBranch).forEach(([key, dailyTotal]) => {
       const [dDate, dBranch] = key.split('_');
       const amount = Math.floor(dailyTotal / 100) * 100;
       unsubmittedDepositEstimate += amount;
       depositDetails.push({
         date: dDate,
         branch: dBranch,
         amount: amount,
         status: 'ยังไม่ส่ง EOD',
         isEstimated: true,
         createdAt: new Date(dDate.split('/').reverse().join('-')).toISOString() // Approximation for sorting
       });
    });
    
    totalDeposit += unsubmittedDepositEstimate;
    depositDetails.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Sort and get top products
    const productList = Object.entries(productSales).map(([name, data]) => ({ name, qty: data.qty, revenue: data.revenue }));
    
    const topProductsByRevenue = [...productList]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
      
    const topProductsByQty = [...productList]
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);
    
    totalNet = totalSales - totalExpense - totalOPEX - totalCOGS;
    return { 
      totalSales, totalExpense, totalOPEX, totalNet, totalCOGS, totalCourseCOGS, totalProductCOGS, totalCash, totalTransfer, totalCod, totalOnline, count, 
      totalDeposit, confirmedDeposit, totalSubmitted, totalUnsubmitted, depositDetails, filteredDailySales, topProductsByRevenue, topProductsByQty,
      filteredOrders
    };
  }, [filteredOrders, expenses, dailySales, filterDate, filterBranch, filterMode]);

  const bannerStats = useMemo(() => {
    let todayCost = 0, todayProfit = 0, todaySales = 0, todayCOGS = 0, todayGrossProfit = 0;
    let todayCourseCOGS = 0, todayProductCOGS = 0;
    let monthCost = 0, monthProfit = 0, monthSales = 0, monthCOGS = 0, monthGrossProfit = 0;
    let monthCourseCOGS = 0, monthProductCOGS = 0;
    
    const targetDateObj = filterDate ? new Date(filterDate + 'T00:00:00') : new Date();
    const todayStr = targetDateObj.toLocaleDateString('th-TH');
    const todayIso = filterDate || getLocalDateStr(targetDateObj);
    const currentMonth = targetDateObj.getMonth();
    const currentYear = targetDateObj.getFullYear();
    const currentMonthStr = todayIso.substring(0, 7);

    orders.forEach(o => {
      if (!o.createdAt || (o.status && getOrderStatus(o) !== 'อนุมัติแล้ว')) return;
      if (filterBranch !== 'ทั้งหมด' && o.branch !== filterBranch) return;

      const d = new Date(o.createdAt);
      const isToday = o.createdAt.includes('T') ? getLocalDateStr(o.createdAt) === todayIso : new Date(o.createdAt).toLocaleDateString('th-TH') === todayStr;
      const isThisMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear;

      const isOldPO = (o.courseName || '').includes('[ซื้อเข้า');
      const isReq = o.transactionType === 'branch_requisition' || (o.courseName || '').includes('[เบิกจาก');
      const isPO = o.transactionType === 'owner_purchase' || isOldPO;
      
      if (isReq) return;

      let p = parseNumber(o.price);
      if (o.orderChannel === 'shopee' && o.shopeeNetReceived !== undefined) {
         p = parseNumber(o.shopeeNetReceived);
      }

      if (isPO) {
        if (isToday) todayCost += p;
        if (isThisMonth) monthCost += p;
      } else {
        let debtPaymentAmt = 0;
        if (o.cartItems && Array.isArray(o.cartItems)) {
            o.cartItems.forEach(item => {
                if (item.type === 'debt_payment') debtPaymentAmt += (parseNumber(item.price) * parseNumber(item.qty || 1));
            });
        }
        const actualSales = Math.max(0, p - debtPaymentAmt);
        if (isToday) todaySales += actualSales;
        if (isThisMonth) monthSales += actualSales;
        
        let cCogs = 0, pCogs = 0;
        if (o.courseCost !== undefined && o.productCost !== undefined) {
           cCogs = parseNumber(o.courseCost);
           pCogs = parseNumber(o.productCost);
        } else if (o.cartItems && Array.isArray(o.cartItems)) {
           o.cartItems.forEach(item => {
               if (item.actionType === 'owner_purchase' || item.actionType === 'branch_requisition' || item.type === 'usage' || item.type === 'debt_payment') return;
               if (item.type === 'course') {
                   cCogs += (parseNumber(item.price) * parseNumber(item.qty)) * 0.15;
               } else if (item.type === 'product' && item.originalItem) {
                   pCogs += computeOwnerCostPrice(item.originalItem) * parseNumber(item.qty);
               }
           });
        } else {
           pCogs = parseNumber(o.totalCost || 0);
        }
        
        const cogs = cCogs + pCogs;
        if (isToday) { 
           todayCost += cogs; todayCOGS += cogs; 
           todayCourseCOGS += cCogs; todayProductCOGS += pCogs;
        }
        if (isThisMonth) { 
           monthCost += cogs; monthCOGS += cogs; 
           monthCourseCOGS += cCogs; monthProductCOGS += pCogs;
        }
      }
    });

    expenses.forEach(e => {
       const isSameBranch = filterBranch === 'ทั้งหมด' || e.branch === filterBranch;
       if (!isSameBranch) return;

       const isToday = e.date === todayIso;
       const isThisMonth = e.date && e.date.startsWith(currentMonthStr);
       const p = parseNumber(e.amount);

       if (isToday) todayCost += p;
       if (isThisMonth) monthCost += p;
    });

    todayProfit = todaySales - todayCost;
    monthProfit = monthSales - monthCost;
    todayGrossProfit = todaySales - todayCOGS;
    monthGrossProfit = monthSales - monthCOGS;

    return { 
       todayCost, todayProfit, monthCost, monthProfit, todaySales, monthSales, todayGrossProfit, monthGrossProfit, todayCOGS, monthCOGS,
       todayCourseCOGS, todayProductCOGS, monthCourseCOGS, monthProductCOGS
    };
  }, [orders, expenses, filterBranch, filterDate]);

  const currentMonthSalesData = useMemo(() => {
    const now = filterDate ? new Date(filterDate) : new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    let dailyData = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, sales: 0 }));
    
    orders.forEach(o => {
      if (!o.createdAt) return;
      if (filterBranch !== 'ทั้งหมด' && o.branch !== filterBranch) return;
      
      const d = new Date(o.createdAt);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear && (!o.status || getOrderStatus(o) === 'อนุมัติแล้ว')) {
        const dayIdx = d.getDate() - 1;
        const isPO = o.transactionType === 'owner_purchase' || (o.courseName || '').includes('[ซื้อเข้า');
        const isReq = o.transactionType === 'branch_requisition' || (o.courseName || '').includes('[เบิกจาก');
        if (!isPO && !isReq && dailyData[dayIdx]) {
          let p = parseNumber(o.price);
          if (o.orderChannel === 'shopee' && o.shopeeNetReceived !== undefined) {
             p = parseNumber(o.shopeeNetReceived);
          }
          let debtPaymentAmt = 0;
          if (o.cartItems && Array.isArray(o.cartItems)) {
              o.cartItems.forEach(item => {
                  if (item.type === 'debt_payment') debtPaymentAmt += (parseNumber(item.price) * parseNumber(item.qty || 1));
              });
          }
          dailyData[dayIdx].sales += Math.max(0, p - debtPaymentAmt);
        }
      }
    });
    
    const maxSales = Math.max(...dailyData.map(d => d.sales), 1); // Avoid division by zero
    return { data: dailyData, maxSales };
  }, [orders, filterBranch, filterDate]);

  const handleUpdateTarget = async () => {
    setIsSavingTarget(true);
    try {
      const currentTargets = appSettings?.branchTargets || {};
      const currentCourseTargets = appSettings?.courseTargets || {};
      const currentProductTargets = appSettings?.productTargets || {};
      await setDoc(doc(db, 'app_settings', 'financial'), { 
        branchTargets: {
          ...currentTargets,
          [targetBranch]: parseNumber(targetInput)
        },
        courseTargets: {
          ...currentCourseTargets,
          [targetBranch]: parseNumber(courseTargetInput)
        },
        productTargets: {
          ...currentProductTargets,
          [targetBranch]: parseNumber(productTargetInput)
        },
        branchBudgets: {
          ...(appSettings?.branchBudgets || {}),
          [targetBranch]: parseNumber(budgetInput)
        }
      }, { merge: true });
      alert('บันทึกเป้าหมายสำเร็จ');
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการบันทึกเป้าหมาย');
    }
    setIsSavingTarget(false);
  };

  const handleExportCSV = () => {
    try {
      let csvContent = '\uFEFF'; // BOM for Excel UTF-8
      
      // 1. Sales Data
      csvContent += '--- รายรับ (Sales) ---\n';
      csvContent += 'วันที่,สาขา,เลขที่บิล/อ้างอิง,ลูกค้า,ยอดขาย (บาท),ช่องทาง\n';
      filteredOrders.forEach(o => {
         if (o.transactionType === 'owner_purchase' || (o.courseName || '').includes('[ซื้อเข้า') || o.transactionType === 'branch_requisition' || (o.courseName || '').includes('[เบิกจาก')) return;
         
         const date = new Date(o.createdAt || new Date()).toLocaleString('th-TH');
         const branch = o.branch || '-';
         const orderNo = o.orderNo || o.referenceNo || '-';
         const customer = (o.customerName || '').replace(/,/g, ' ') || 'ทั่วไป';
         let price = parseNumber(o.price);
         if (o.orderChannel === 'shopee' && o.shopeeNetReceived !== undefined) {
             price = parseNumber(o.shopeeNetReceived);
         }
         const channel = o.orderChannel === 'shopee' ? 'Shopee/Online' : (o.paymentMethod || 'ไม่ระบุ');
         
         csvContent += `${date},${branch},${orderNo},${customer},${price},${channel}\n`;
      });
      csvContent += '\n';
      
      // 2. Expense Data
      csvContent += '--- รายจ่าย (Expenses & PO) ---\n';
      csvContent += 'วันที่,สาขา,หมวดหมู่,รายละเอียด,ยอดรายจ่าย (บาท)\n';
      
      // PO Expenses
      filteredOrders.forEach(o => {
         const isOldPO = (o.courseName || '').includes('[ซื้อเข้า');
         if (o.transactionType === 'owner_purchase' || isOldPO) {
             const date = new Date(o.createdAt || new Date()).toLocaleString('th-TH');
             const branch = o.branch || '-';
             const desc = (o.courseName || 'สั่งซื้อสินค้า').replace(/,/g, ' ');
             const price = parseNumber(o.price);
             csvContent += `${date},${branch},สั่งซื้อเข้าร้าน (PO),${desc},${price}\n`;
         }
      });
      
      // OPEX Expenses
      expenses.forEach(e => {
         if (!filterDate) return;
         let isMatch = false;
         if (filterMode === 'month') {
            isMatch = e.date && e.date.startsWith(filterDate.substring(0, 7));
         } else {
            isMatch = e.date === filterDate;
         }
         if (!isMatch) return;
         if (filterBranch !== 'ทั้งหมด' && (e.branch || 'ไม่ระบุ') !== filterBranch) return;
         
         const date = new Date(e.date || new Date()).toLocaleString('th-TH');
         const branch = e.branch || 'ไม่ระบุ';
         const cat = e.category || 'อื่นๆ';
         const desc = (e.note || '').replace(/,/g, ' ');
         const amt = e.amount || 0;
         csvContent += `${date},${branch},${cat},${desc},${amt}\n`;
      });
      csvContent += '\n';
      
      // 3. Summary
      csvContent += '--- สรุปยอด (Summary) ---\n';
      csvContent += `รายรับทั้งหมด,${stats.totalSales}\n`;
      csvContent += `ต้นทุนขาย (COGS),${stats.totalCOGS}\n`;
      csvContent += `รายจ่ายสั่งของ (PO),${stats.totalExpense}\n`;
      csvContent += `ค่าใช้จ่ายอื่นๆ (OPEX),${stats.totalOPEX}\n`;
      csvContent += `กำไรสุทธิ (Net Profit),${stats.totalNet}\n`;
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `บัญชีคลินิก_${filterMode === 'month' ? filterDate.substring(0,7) : filterDate}_${filterBranch}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ Excel');
    }
  };


  const payrollSummary = useMemo(() => {
     if (expenseForm.category !== 'เงินเดือนพนักงาน') return null;

     const now = new Date(expenseForm.date || new Date());
     const monthPrefix = now.toISOString().substring(0, 7); 
     
     let totalBase = 0;
     let totalFood = 0;
     let totalComm = 0;
     let totalAdv = 0;
     let totalNet = 0;
     let totalService = 0;

     // Filter employees by branch
     const branchEmployees = employees.filter(emp => {
        if (!expenseForm.branch || expenseForm.branch === 'ทั้งหมด') return true;
        if (expenseForm.branch === 'สำนักงานใหญ่') return emp.branch === 'สำนักงานใหญ่' || !emp.branch;
        return emp.branch === expenseForm.branch;
     });

     branchEmployees.forEach(emp => {
        const baseSalary = parseNumber(emp.baseSalary || 0);
        
        const monthHistories = histories.filter(h => isInPayrollMonth(h, monthPrefix));
        let empComm = 0;
        monthHistories.forEach(h => {
            const sName = String(getFuzzyKey(h, ["ชื่อเจ้าหน้าที่", "ชื่อพนักงาน", "staffName", "ผู้ให้บริการ", "เจ้าหน้าที่", "พนักงาน", "paymentStaff"]) || '');
            if (!sName) return;
            const staffNames = sName.split(/[,/]|และ|กับ/).map(s => s.trim()).filter(s => s);
            if (staffNames.includes(emp.name)) {
                const price = parseNumber(getFuzzyKey(h, ["ราคา", "price", "จำนวนเงิน", "ยอดเงิน"]) || 0);
                const typeStr = String(getFuzzyKey(h, ["ประเภท"]) || '');
                const shareCount = staffNames.length;
                if (typeStr.includes('ซื้อสินค้า')) {
                    empComm += (price * ((parseFloat(emp.productCommissionRate) || 0) / 100)) / shareCount;
                } else {
                    empComm += (price * ((parseFloat(emp.commissionRate) || 0) / 100)) / shareCount;
                }
            }
        });
        
        const empServiceLogs = serviceLogs.filter(s => s.employeeId === emp.id && isInPayrollMonth(s, monthPrefix));
        let empService = 0;
        empServiceLogs.forEach(s => {
            const typeName = String(s.type || '').toLowerCase();
            let rawAmount = parseNumber(s.amount);
            const isPOS = typeof s.note === 'string' && s.note.startsWith('POS:');
            
            if (isPOS && (typeName.includes('จี้ไฝ') || typeName.includes('mole')) && rawAmount < 100) rawAmount = rawAmount * 10;

            if (typeName.includes('นวดหน้า') || typeName.includes('active skin') || typeName.includes('ipl รักแร้') || typeName.includes('ทรีทเม้นท์')) {
                empService += 50;
            } else if (typeName.includes('กดสิว')) {
                empService += 30;
            } else if (typeName.includes('สปา') || typeName.includes('ขัดตัว')) {
                empService += 100;
            } else if (typeName.includes('จี้ไฝ') || typeName.includes('กระ') || typeName.includes('ติ่งเนื้อ') || typeName.includes('mole')) {
                empService += rawAmount < 1000 ? (rawAmount * 0.10) : (rawAmount * 0.20);
            } else {
                empService += isPOS ? (rawAmount * 0.10) : rawAmount;
            }
        });
        
        const empAdvances = advancePayments.filter(a => a.employeeId === emp.id && (a.status === 'อนุมัติ' || a.status === 'อนุมัติแล้ว') && isInPayrollMonth(a, monthPrefix));
        let empAdv = 0;
        empAdvances.forEach(a => { empAdv += parseNumber(a.amount); });
        
        const empAttendance = attendance.filter(a => a.employeeId === emp.id && isInPayrollMonth(a, monthPrefix));
        const daysWorked = new Set(empAttendance.map(a => a.date)).size;
        const empFood = daysWorked * 50;
        
        totalBase += baseSalary;
        totalComm += empComm;
        totalService += empService;
        totalFood += empFood;
        totalAdv += empAdv;
        totalNet += (baseSalary + empComm + empService + empFood - empAdv);
     });

     return { 
        monthPrefix, 
        totalBase, 
        totalComm: totalComm + totalService, 
        totalFood, 
        totalAdv, 
        totalNet, 
        branchEmployees 
     };
  }, [expenseForm.category, expenseForm.date, expenseForm.branch, employees, histories, serviceLogs, advancePayments, attendance]);

  const handleAutoSalary = (emp) => {
    if (expenseForm.category !== 'เงินเดือนพนักงาน') {
      alert("กรุณาเลือกหมวดหมู่ 'เงินเดือนพนักงาน' ก่อนดึงข้อมูล");
      return;
    }
    
    const now = new Date(expenseForm.date);
    const monthPrefix = now.toISOString().substring(0, 7); 
    const monthHistories = histories.filter(h => isInPayrollMonth(h, monthPrefix));
    
    const baseSalary = parseNumber(emp.baseSalary || 0);
    
    let totalCommission = 0;
    monthHistories.forEach(h => {
        const sName = String(getFuzzyKey(h, ["ชื่อเจ้าหน้าที่", "ชื่อพนักงาน", "staffName", "ผู้ให้บริการ", "เจ้าหน้าที่", "พนักงาน", "paymentStaff"]) || '');
        if (!sName) return;
        const staffNames = sName.split(/[,/]|และ|กับ/).map(s => s.trim()).filter(s => s);
        if (staffNames.includes(emp.name)) {
            const price = parseNumber(getFuzzyKey(h, ["ราคา", "price", "จำนวนเงิน", "ยอดเงิน"]) || 0);
            const typeStr = String(getFuzzyKey(h, ["ประเภท"]) || '');
            const shareCount = staffNames.length;
            if (typeStr.includes('ซื้อสินค้า')) {
                totalCommission += (price * ((parseFloat(emp.productCommissionRate) || 0) / 100)) / shareCount;
            } else {
                totalCommission += (price * ((parseFloat(emp.commissionRate) || 0) / 100)) / shareCount;
            }
        }
    });
    
    const empServiceLogs = serviceLogs.filter(s => s.employeeId === emp.id && isInPayrollMonth(s, monthPrefix));
    let totalServiceFees = 0;
    empServiceLogs.forEach(s => {
        const typeName = String(s.type || '').toLowerCase();
        let rawAmount = parseNumber(s.amount);
        const isPOS = typeof s.note === 'string' && s.note.startsWith('POS:');
        
        if (isPOS && (typeName.includes('จี้ไฝ') || typeName.includes('mole')) && rawAmount < 100) rawAmount = rawAmount * 10;

        if (typeName.includes('นวดหน้า') || typeName.includes('active skin') || typeName.includes('ipl รักแร้') || typeName.includes('ทรีทเม้นท์')) {
            totalServiceFees += 50;
        } else if (typeName.includes('กดสิว')) {
            totalServiceFees += 30;
        } else if (typeName.includes('สปา') || typeName.includes('ขัดตัว')) {
            totalServiceFees += 100;
        } else if (typeName.includes('จี้ไฝ') || typeName.includes('กระ') || typeName.includes('ติ่งเนื้อ') || typeName.includes('mole')) {
            totalServiceFees += rawAmount < 1000 ? (rawAmount * 0.10) : (rawAmount * 0.20);
        } else {
            totalServiceFees += isPOS ? (rawAmount * 0.10) : rawAmount;
        }
    });
    
    const empAdvances = advancePayments.filter(a => a.employeeId === emp.id && (a.status === 'อนุมัติ' || a.status === 'อนุมัติแล้ว') && isInPayrollMonth(a, monthPrefix));
    let totalAdvances = 0;
    empAdvances.forEach(a => {
        totalAdvances += parseNumber(a.amount);
    });
    
    const empAttendance = attendance.filter(a => a.employeeId === emp.id && isInPayrollMonth(a, monthPrefix));
    const daysWorked = new Set(empAttendance.map(a => a.date)).size;
    const totalFoodAllowance = daysWorked * 50;
    
    const totalSalaryAndComm = (baseSalary + totalCommission + totalServiceFees + totalFoodAllowance - totalAdvances);
    
    let debugLog = `ฐาน ${baseSalary}, คอม ${totalCommission.toFixed(2)}, มือ ${totalServiceFees}, อาหาร ${totalFoodAllowance}, หักเบิก ${totalAdvances}`;
    
    setExpenseForm({
       ...expenseForm, 
       amount: totalSalaryAndComm, 
       note: `เงินเดือน ${emp.name} ประจำเดือน ${monthPrefix} | ${debugLog}`
    });
  };


  const handleAddExpense = async () => {
    if (!expenseForm.amount || !expenseForm.category || !expenseForm.date) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    setIsSavingExpense(true);
    try {
      const { collection, addDoc } = await import('firebase/firestore');
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      
      let receiptUrl = null;
      if (expenseForm.receiptFile) {
         try {
             const fileExt = expenseForm.receiptFile.name.split('.').pop() || 'jpg';
             const fileName = `receipts/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
             const storageRef = ref(storage, fileName);
             await uploadBytes(storageRef, expenseForm.receiptFile);
             receiptUrl = await getDownloadURL(storageRef);
         } catch (uploadErr) {
             console.error("Image upload failed:", uploadErr);
             alert("อัพโหลดรูปภาพไม่สำเร็จ จะบันทึกข้อมูลโดยไม่มีรูปภาพ");
         }
      }
      
      await addDoc(collection(db, 'expenses'), {
        date: expenseForm.date,
        branch: expenseForm.branch,
        category: expenseForm.category,
        amount: parseNumber(expenseForm.amount),
        note: expenseForm.note,
        receiptUrl: receiptUrl,
        createdAt: new Date().toISOString()
      });
      alert('บันทึกรายจ่ายเรียบร้อย');
      setExpenseForm({ date: expenseForm.date, branch: expenseForm.branch, category: expenseForm.category, amount: '', note: '', receiptFile: null, receiptPreview: null });
    } catch (e) {
      console.error(e);
      alert('เกิดข้อผิดพลาดในการบันทึกรายจ่าย');
    }
    setIsSavingExpense(false);
  };
  
  const handleDeleteExpense = async (id) => {
    if (!window.confirm("ต้องการลบรายจ่ายนี้ใช่หรือไม่?")) return;
    try {
      const { deleteDoc, doc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'expenses', id));
    } catch (e) {
      console.error(e);
      alert('เกิดข้อผิดพลาดในการลบ');
    }
  };
  
  const handleVerify = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'daily_sales', id), { status: newStatus });
      alert('บันทึกสถานะเรียบร้อยแล้ว');
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาด');
    }
  };

  const handleDeleteEod = async (id) => {
    if (!window.confirm("คุณต้องการลบใบส่งยอดนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้")) return;
    try {
      await deleteDoc(doc(db, 'daily_sales', id));
      alert('ลบใบส่งยอดเรียบร้อยแล้ว');
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการลบใบส่งยอด');
    }
  };

  const breakEvenAnalysis = useMemo(() => {
    const branchData = expenseDataByBranch.find(b => (b.branchName === targetBranch) || (targetBranch === 'ทั้งหมด' && b.branchName !== 'none')) 
      ? expenseDataByBranch.filter(b => targetBranch === 'ทั้งหมด' || b.branchName === targetBranch).reduce((acc, curr) => ({
          fixedTotal: acc.fixedTotal + curr.fixedTotal,
          varTotal: acc.varTotal + curr.varTotal
      }), { fixedTotal: 0, varTotal: 0 }) 
      : { fixedTotal: 0, varTotal: 0 };
      
    const fixedCosts = branchData.fixedTotal;
    const varCosts = branchData.varTotal;
    const totalOpex = fixedCosts + varCosts;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let totalSales = 0;
    let totalCogs = 0;
    let courseSalesTotal = 0;
    let productSalesTotal = 0;
    
    orders.forEach(o => {
      if (!o.createdAt || getOrderStatus(o) !== 'อนุมัติแล้ว') return;
      if (targetBranch !== 'ทั้งหมด' && o.branch !== targetBranch) return;
      
      const d = new Date(o.createdAt);
      if (d.getMonth() !== currentMonth || d.getFullYear() !== currentYear) return;
      
      const isOldPO = (o.courseName || '').includes('[ซื้อเข้า');
      const isReq = o.transactionType === 'branch_requisition' || (o.courseName || '').includes('[เบิกจาก');
      const isPO = o.transactionType === 'owner_purchase' || isOldPO;
      if (isReq || isPO) return;
      
      let p = parseNumber(o.price);
      if (o.orderChannel === 'shopee' && o.shopeeNetReceived !== undefined) {
         p = parseNumber(o.shopeeNetReceived);
      }
      
      let debtPaymentAmt = 0;
      let cSales = 0, pSales = 0;
      
      if (o.cartItems && Array.isArray(o.cartItems)) {
          o.cartItems.forEach(item => {
              if (item.type === 'debt_payment') debtPaymentAmt += (parseNumber(item.price) * parseNumber(item.qty || 1));
              else if (item.type === 'course') cSales += (parseNumber(item.price) * parseNumber(item.qty || 1));
              else if (item.type === 'product') pSales += (parseNumber(item.price) * parseNumber(item.qty || 1));
          });
      }
      
      const actualSales = Math.max(0, p - debtPaymentAmt);
      totalSales += actualSales;
      
      if (cSales === 0 && pSales === 0 && actualSales > 0) {
          cSales = actualSales;
      }
      const totalCP = cSales + pSales;
      if (totalCP > 0) {
          courseSalesTotal += (cSales / totalCP) * actualSales;
          productSalesTotal += (pSales / totalCP) * actualSales;
      }
      
      let cCogs = 0, pCogs = 0;
      if (o.courseCost !== undefined && o.productCost !== undefined) {
         cCogs = parseNumber(o.courseCost);
         pCogs = parseNumber(o.productCost);
      } else if (o.cartItems && Array.isArray(o.cartItems)) {
         o.cartItems.forEach(item => {
             if (item.actionType === 'owner_purchase' || item.actionType === 'branch_requisition' || item.type === 'usage' || item.type === 'debt_payment') return;
             if (item.type === 'course') {
                 cCogs += (parseNumber(item.price) * parseNumber(item.qty)) * 0.15;
             } else if (item.type === 'product' && item.originalItem) {
                 pCogs += computeOwnerCostPrice(item.originalItem) * parseNumber(item.qty);
             }
         });
      } else {
         pCogs = parseNumber(o.totalCost || 0);
      }
      totalCogs += (cCogs + pCogs);
    });
    
    const grossMargin = totalSales > 0 ? ((totalSales - totalCogs) / totalSales) : 0.85; 
    const breakEvenSales = grossMargin > 0 ? (totalOpex / grossMargin) : totalOpex;
    const courseRatio = totalSales > 0 ? (courseSalesTotal / totalSales) : 0.7;
    const productRatio = totalSales > 0 ? (productSalesTotal / totalSales) : 0.3;
    
    return {
      totalOpex,
      grossMarginPercent: (grossMargin * 100).toFixed(1),
      breakEvenSales,
      totalSales,
      courseRatio,
      productRatio
    };
  }, [expenseDataByBranch, targetBranch, orders]);

  return (
    <div className="h-full flex flex-col bg-slate-50 relative">
      
      {/* Custom Confirm Modal */}
      {confirmModal.isOpen && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
               <h3 className="text-xl font-black text-gray-800 mb-2">{confirmModal.title}</h3>
               {confirmModal.message && <p className="text-gray-500 mb-6 whitespace-pre-wrap text-sm leading-relaxed">{confirmModal.message}</p>}
               <div className="flex gap-3">
                  <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-colors">ยกเลิก</button>
                  <button onClick={() => { setConfirmModal({ ...confirmModal, isOpen: false }); if(confirmModal.onConfirm) confirmModal.onConfirm(); }} className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl transition-colors">ยืนยัน</button>
               </div>
            </div>
         </div>
      )}

      {/* Custom Prompt Modal */}
      {promptModal.isOpen && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
               <h3 className="text-xl font-black text-gray-800 mb-4">{promptModal.title}</h3>
               <input 
                  type={promptModal.type === 'number' ? 'text' : promptModal.type} 
                  inputMode={promptModal.type === 'number' ? 'decimal' : 'text'}
                  autoFocus
                  defaultValue={promptModal.defaultValue} 
                  placeholder={promptModal.placeholder}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-gray-800 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 mb-6"
                  id="custom-prompt-input"
                  onKeyDown={e => {
                     if (e.key === 'Enter') {
                        setPromptModal({ ...promptModal, isOpen: false });
                        if(promptModal.onConfirm) promptModal.onConfirm(e.target.value);
                     }
                  }}
               />
               <div className="flex gap-3">
                  <button onClick={() => setPromptModal({ ...promptModal, isOpen: false })} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-colors">ยกเลิก</button>
                  <button onClick={() => { 
                     const val = document.getElementById('custom-prompt-input').value;
                     setPromptModal({ ...promptModal, isOpen: false }); 
                     if(promptModal.onConfirm) promptModal.onConfirm(val); 
                  }} className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl transition-colors">บันทึก</button>
               </div>
            </div>
         </div>
      )}

      {/* Header */}
      <div className={`bg-white px-6 py-5 border-b border-slate-200 flex-col md:flex-row gap-4 justify-between items-start md:items-center print:hidden ${(activeTab === 'expenses' || activeTab === 'treasury') ? 'hidden md:flex' : 'flex'}`}>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="text-indigo-600" /> บัญชีการเงิน
          </h1>
          <p className="text-sm text-slate-500 mt-1">สรุปยอดขายและช่องทางการรับเงิน</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('overview')} 
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'overview' ? 'bg-indigo-100 text-indigo-700 shadow-inner' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <BarChart3 size={16} /> ภาพรวม
          </button>
          <button 
            onClick={() => setActiveTab('verifications')} 
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'verifications' ? 'bg-indigo-100 text-indigo-700 shadow-inner' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <ListChecks size={16} /> ตรวจรับยอด
            {dailySales.filter(d => d.status === 'รอตรวจสอบ').length > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{dailySales.filter(d => d.status === 'รอตรวจสอบ').length}</span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('expenses')} 
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'expenses' ? 'bg-indigo-100 text-indigo-700 shadow-inner' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <DollarSign size={16} /> บันทึกรายจ่าย
          </button>
          <button 
            onClick={() => setActiveTab('pending_payments')} 
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'pending_payments' ? 'bg-indigo-100 text-indigo-700 shadow-inner' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Clock size={16} /> จัดการยอดค้างชำระ
          </button>
          <button 
            onClick={() => setActiveTab('treasury')} 
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'treasury' ? 'bg-indigo-100 text-indigo-700 shadow-inner' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Landmark size={16} /> ทุนและปันผล
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 print:hidden">
        
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Monthly Target Setup */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end justify-between">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-1"><Target size={18} className="text-pink-500" /> เป้ายอดขายรายเดือน</h3>
                <p className="text-sm text-slate-500">ตั้งเป้าหมายยอดขายเพื่อแสดงในระบบ POS (แยกตามสาขา)</p>
              </div>
              <div className="flex flex-wrap gap-2 w-full md:w-auto items-end">
                <select 
                  value={targetBranch}
                  onChange={(e) => setTargetBranch(e.target.value)}
                  className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-base font-bold outline-none focus:border-indigo-500 flex-1 md:flex-none md:w-40 h-10"
                >
                  {targetBranches.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <div className="flex flex-col gap-1 w-full md:w-32">
                   <label className="text-[10px] text-slate-500 font-bold ml-1">เป้ารวม</label>
                   <input 
                     type="number" 
                     value={targetInput} 
                     onChange={(e) => setTargetInput(e.target.value)} 
                     placeholder="เป้ารวม"
                     className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 w-full h-10"
                   />
                </div>
                <div className="flex flex-col gap-1 w-full md:w-32">
                   <label className="text-[10px] text-slate-500 font-bold ml-1">เป้าคอร์ส</label>
                   <input 
                     type="number" 
                     value={courseTargetInput} 
                     onChange={(e) => setCourseTargetInput(e.target.value)} 
                     placeholder="เป้าคอร์ส"
                     className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 w-full h-10"
                   />
                </div>
                <div className="flex flex-col gap-1 w-full md:w-32">
                   <label className="text-[10px] text-slate-500 font-bold ml-1">เป้าสินค้า</label>
                   <input 
                     type="number" 
                     value={productTargetInput} 
                     onChange={(e) => setProductTargetInput(e.target.value)} 
                     placeholder="เป้าสินค้า"
                     className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 w-full h-10"
                   />
                </div>
                <div className="flex flex-col gap-1 w-full md:w-32">
                   <label className="text-[10px] text-slate-500 font-bold ml-1">งบรายจ่าย (OPEX)</label>
                   <input 
                     type="number" 
                     value={budgetInput} 
                     onChange={(e) => setBudgetInput(e.target.value)} 
                     placeholder="งบ OPEX"
                     className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 w-full h-10"
                   />
                </div>
                <button 
                  onClick={handleUpdateTarget}
                  disabled={isSavingTarget}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold shadow-sm hover:bg-indigo-700 transition-colors w-full md:w-auto h-10 flex items-center justify-center"
                >
                  {isSavingTarget ? 'กำลังบันทึก...' : 'บันทึกเป้า'}
                </button>
              </div>
            </div>

            {/* Break-Even & Profit Analysis */}
            <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <h4 className="font-bold text-indigo-900 flex items-center gap-2"><Target size={18} className="text-indigo-500" /> วิเคราะห์จุดคุ้มทุนและเป้ากำไร (Break-Even & Target Profit)</h4>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowSimulatorModal(true)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center justify-center gap-1 font-bold bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100 transition-colors w-full sm:w-auto"
                    >
                      <Calculator size={14} /> ทดลองคำนวณยอด
                    </button>
                    <button 
                      onClick={() => setShowFormula(!showFormula)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center justify-center gap-1 font-bold bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100 transition-colors w-full sm:w-auto"
                    >
                      <Info size={14} /> {showFormula ? 'ซ่อนที่มาการคำนวณ' : 'ดูที่มาการคำนวณ'}
                    </button>
                  </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                 <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-slate-500 mb-1">รายจ่ายของสาขา (OPEX)</p>
                    <p className="text-lg font-black text-rose-500">฿{breakEvenAnalysis.totalOpex.toLocaleString()}</p>
                 </div>
                 <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-slate-500 mb-1">อัตรากำไรขั้นต้น (Gross Margin)</p>
                    <p className="text-lg font-black text-indigo-600">{breakEvenAnalysis.grossMarginPercent}%</p>
                 </div>
                 <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-emerald-600 mb-1">ยอดขายขั้นต่ำที่ต้องทำ (คุ้มทุน)</p>
                    <p className="text-xl font-black text-emerald-600">฿{breakEvenAnalysis.breakEvenSales.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                 </div>
                 <div className="bg-white p-4 rounded-xl border border-indigo-200 flex flex-col justify-center shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none"><Target size={40} className="text-indigo-600 transform translate-x-2 -translate-y-2" /></div>
                    <p className="text-[10px] font-bold text-indigo-500 mb-2">เป้าหมายกำไรสุทธิ (บาท)</p>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-slate-400">฿</span>
                      <input 
                        type="number" 
                        value={targetProfit} 
                        onChange={(e) => setTargetProfit(e.target.value)}
                        className="bg-slate-50 w-full text-lg font-black text-indigo-700 outline-none border-b-2 border-indigo-100 focus:border-indigo-500 transition-colors py-1"
                      />
                    </div>
                 </div>
               </div>
               
               {/* Target Profit Result */}
               {(() => {
                 const margin = parseFloat(breakEvenAnalysis.grossMarginPercent) / 100;
                 const requiredSales = margin > 0 ? (breakEvenAnalysis.totalOpex + Number(targetProfit || 0)) / margin : 0;
                 const cTarget = requiredSales * breakEvenAnalysis.courseRatio;
                 const pTarget = requiredSales * breakEvenAnalysis.productRatio;
                 return (
                   <>
                     <div className="bg-indigo-600 text-white p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                       <p className="text-sm font-medium">ยอดขายที่ต้องทำให้ได้ เพื่อให้เหลือกำไร <span className="font-bold text-amber-300">฿{Number(targetProfit || 0).toLocaleString()}</span></p>
                       <p className="text-2xl font-black text-white bg-white/20 px-4 py-2 rounded-lg">฿{requiredSales.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex flex-col items-center text-center">
                           <span className="text-[10px] font-bold text-indigo-500 mb-1">แนะนำตั้งเป้าคอร์ส ({(breakEvenAnalysis.courseRatio * 100).toFixed(0)}%)</span>
                           <span className="text-lg font-black text-indigo-700">฿{cTarget.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                        </div>
                        <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex flex-col items-center text-center">
                           <span className="text-[10px] font-bold text-indigo-500 mb-1">แนะนำตั้งเป้าสินค้า ({(breakEvenAnalysis.productRatio * 100).toFixed(0)}%)</span>
                           <span className="text-lg font-black text-indigo-700">฿{pTarget.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                        </div>
                     </div>
                     
                     {showFormula && (
                       <div className="mt-4 p-4 bg-white/80 backdrop-blur border border-indigo-100 rounded-xl text-xs text-slate-600 leading-relaxed space-y-2 shadow-inner">
                          <p className="font-bold text-indigo-800 mb-1 text-sm flex items-center gap-1"><Info size={14}/> ที่มาของสูตรและการคำนวณ:</p>
                          <p><strong>1. อัตรากำไรขั้นต้น ({breakEvenAnalysis.grossMarginPercent}%):</strong> คำนวณจาก <code>(ยอดขาย - ต้นทุนสินค้า/คอร์ส) / ยอดขาย</code> ของเดือนนี้ (ยอดขายทุกๆ 100 บาท จะเหลือกำไรหลังหักต้นทุนสินค้า {breakEvenAnalysis.grossMarginPercent} บาท)</p>
                          <p><strong>2. จุดคุ้มทุน (฿{breakEvenAnalysis.breakEvenSales.toLocaleString(undefined, {maximumFractionDigits:0})}):</strong> คือยอดขายที่หักต้นทุนสินค้าแล้ว <u className="font-bold text-emerald-600">เพียงพอจ่ายรายจ่าย OPEX พอดี</u> (ไม่ขาดทุน ไม่กำไร) คำนวณจาก <code>รายจ่าย OPEX (฿{breakEvenAnalysis.totalOpex.toLocaleString()}) ÷ อัตรากำไรขั้นต้น ({breakEvenAnalysis.grossMarginPercent}%)</code></p>
                          <p><strong>3. เป้ากำไรสุทธิ:</strong> หากต้องการกำไรสุทธิ ฿{Number(targetProfit || 0).toLocaleString()} ต้องเอากำไรเป้าหมายไปบวกกับรายจ่าย OPEX คำนวณจาก <code>(รายจ่าย OPEX + เป้าหมายกำไร) ÷ อัตรากำไรขั้นต้น</code> <br/> = <code>(฿{breakEvenAnalysis.totalOpex.toLocaleString()} + ฿{Number(targetProfit || 0).toLocaleString()}) ÷ {(breakEvenAnalysis.grossMarginPercent / 100).toFixed(4)}</code> = <strong className="text-indigo-600 text-sm">฿{requiredSales.toLocaleString(undefined, {maximumFractionDigits:0})}</strong></p>
                          <p><strong>4. สัดส่วนยอดขาย:</strong> คำนวณจากสัดส่วนยอดขายจริงเดือนนี้ พบว่ามาจากคอร์ส {(breakEvenAnalysis.courseRatio * 100).toFixed(0)}% และสินค้า {(breakEvenAnalysis.productRatio * 100).toFixed(0)}% ระบบจึงแนะนำเป้าขายแยกตามสัดส่วนนี้ครับ</p>
                       </div>
                     )}
                   </>
                 );
               })()}
            </div>

            {/* Monthly Graph */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><BarChart3 size={18} className="text-indigo-500" /> กราฟยอดขายประจำเดือนนี้</h3>
              <div className="h-48 flex items-end gap-1 sm:gap-2">
                {currentMonthSalesData.data.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end group relative h-full">
                    {/* Tooltip */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] px-2 py-1 rounded pointer-events-none whitespace-nowrap z-10">
                      วันที่ {d.day}: ฿{d.sales.toLocaleString()}
                    </div>
                    {/* Bar */}
                    <div 
                      className={`w-full rounded-t-sm transition-all duration-500 ${d.sales > 0 ? 'bg-indigo-500 group-hover:bg-indigo-400' : 'bg-slate-100'}`} 
                      style={{ height: `${Math.max((d.sales / currentMonthSalesData.maxSales) * 100, d.sales > 0 ? 5 : 0)}%` }}
                    ></div>
                    {/* Label */}
                    <span className="text-[9px] sm:text-xs text-slate-400 mt-2 font-mono">{d.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                <button 
                  onClick={() => setFilterMode('day')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${filterMode === 'day' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >รายวัน</button>
                <button 
                  onClick={() => setFilterMode('month')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${filterMode === 'month' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >รายเดือน</button>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
                <Calendar size={18} className="text-slate-500" />
                <input 
                  type={filterMode === 'month' ? 'month' : 'date'} 
                  value={filterMode === 'month' ? filterDate.substring(0, 7) : filterDate} 
                  onChange={(e) => {
                    if (filterMode === 'month') {
                      setFilterDate(e.target.value + '-01');
                    } else {
                      setFilterDate(e.target.value);
                    }
                  }} 
                  className="bg-transparent border-none outline-none text-sm font-medium text-slate-700" 
                />
              </div>
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
                <Store size={18} className="text-slate-500" />
                <select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)} className="bg-transparent border-none outline-none text-sm font-medium text-slate-700">
                  {branchOptions.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <button onClick={handleExportCSV} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm">
                  <Download size={18} /> ส่งออกบัญชี (Excel)
                </button>
                <button onClick={() => setShowDailyPrintModal(true)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm">
                  <Printer size={18} /> พรีวิวรายงาน
                </button>
              </div>
            </div>
            
            <DailyReportPrintModal
              isOpen={showDailyPrintModal}
              onClose={() => setShowDailyPrintModal(false)}
              dateStr={filterDate}
              filterMode={filterMode}
              filterBranch={filterBranch}
              branchOptions={branchOptions}
              stats={stats}
              bannerStats={bannerStats}
              expenses={expenses}
            />

            {/* Banner: Daily & Monthly Cost/Profit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
               <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl p-4 text-white shadow-sm flex items-center justify-between">
                  <div className="w-full">
                     <div className="text-indigo-100 font-bold text-sm mb-2">รายวัน (Daily)</div>
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
                        <div>
                           <div className="text-[10px] sm:text-xs text-indigo-200">กำไรสุทธิ</div>
                           <div className="text-lg sm:text-xl font-black">฿{bannerStats.todayProfit.toLocaleString()}</div>
                        </div>
                        <div>
                           <div className="text-[10px] sm:text-xs text-indigo-200">กำไรเบื้องต้น</div>
                           <div className="text-base sm:text-lg font-bold opacity-90">฿{bannerStats.todayGrossProfit.toLocaleString()}</div>
                        </div>
                        <div>
                           <div className="text-[10px] sm:text-xs text-indigo-200">ยอดขาย</div>
                           <div className="text-base sm:text-lg font-bold opacity-90">฿{bannerStats.todaySales.toLocaleString()}</div>
                        </div>
                        <div>
                           <div className="text-[10px] sm:text-xs text-indigo-200">ต้นทุนขาย(COGS)</div>
                           <div className="text-base sm:text-lg font-bold opacity-90">
                              ฿{bannerStats.todayCOGS.toLocaleString()}
                           </div>
                           {(bannerStats.todayProductCOGS > 0 || bannerStats.todayCourseCOGS > 0) && (
                              <div className="text-[8px] sm:text-[10px] text-indigo-200 mt-0.5">
                                 สินค้า ฿{bannerStats.todayProductCOGS.toLocaleString()} <br/> คอร์ส ฿{bannerStats.todayCourseCOGS.toLocaleString()}
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
               
               <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white shadow-sm flex items-center justify-between">
                  <div className="w-full">
                     <div className="text-emerald-100 font-bold text-sm mb-2">รายเดือน (Monthly)</div>
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
                        <div>
                           <div className="text-[10px] sm:text-xs text-emerald-200">กำไรสุทธิ</div>
                           <div className="text-lg sm:text-xl font-black">฿{bannerStats.monthProfit.toLocaleString()}</div>
                        </div>
                        <div>
                           <div className="text-[10px] sm:text-xs text-emerald-200">กำไรเบื้องต้น</div>
                           <div className="text-base sm:text-lg font-bold opacity-90">฿{bannerStats.monthGrossProfit.toLocaleString()}</div>
                        </div>
                        <div>
                           <div className="text-[10px] sm:text-xs text-emerald-200">ยอดขาย</div>
                           <div className="text-base sm:text-lg font-bold opacity-90">฿{bannerStats.monthSales.toLocaleString()}</div>
                        </div>
                        <div>
                           <div className="text-[10px] sm:text-xs text-emerald-200">ต้นทุนขาย(COGS)</div>
                           <div className="text-base sm:text-lg font-bold opacity-90">
                              ฿{bannerStats.monthCOGS.toLocaleString()}
                           </div>
                           {(bannerStats.monthProductCOGS > 0 || bannerStats.monthCourseCOGS > 0) && (
                              <div className="text-[8px] sm:text-[10px] text-emerald-200 mt-0.5">
                                 สินค้า ฿{bannerStats.monthProductCOGS.toLocaleString()} <br/> คอร์ส ฿{bannerStats.monthCourseCOGS.toLocaleString()}
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 shadow-sm col-span-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><DollarSign size={20} /></div>
                  <div className="text-emerald-700 font-bold">รายรับ (Sales)</div>
                </div>
                <div className="text-3xl font-black text-emerald-800 mt-2">฿{stats.totalSales.toLocaleString()}</div>
                <div className="flex justify-between items-center mt-2">
                   <div className="text-xs text-emerald-600 font-medium">จาก {stats.count} บิล</div>
                   <div className="flex flex-col gap-1 items-end">
                      <span className="bg-emerald-200/50 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded-md" title="ยอดขายที่ส่งรายงานปิดยอดแล้ว">ส่งแล้ว {stats.totalSubmitted.toLocaleString()}</span>
                      {stats.totalUnsubmitted > 0 && <span className="bg-rose-100/80 text-rose-700 text-[9px] px-1.5 py-0.5 rounded-md" title="ยอดขายที่ยังไม่ได้ส่งรายงานปิดยอด">ยังไม่ส่ง {stats.totalUnsubmitted.toLocaleString()}</span>}
                   </div>
                </div>
              </div>

              <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 shadow-sm col-span-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Wallet size={20} /></div>
                    <div className="text-blue-700 font-bold">ยอดนำฝาก (Deposit)</div>
                  </div>
                  <button onClick={() => setShowDepositModal(true)} className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors" title="ดูตารางสรุปยอดฝาก">
                    <ListChecks size={16} />
                  </button>
                </div>
                <div className="text-3xl font-black text-blue-800 mt-2">฿{stats.totalDeposit.toLocaleString()}</div>
                <div className="flex justify-between items-center mt-2">
                   <div className="text-xs text-blue-600 font-medium" title="ไม่รวมยอดค้างชำระ (COD/Shopee) และการใช้เครดิตเก่า">เฉพาะยอดเงินสดและโอนเข้าบัญชี</div>
                   <div className="flex flex-col gap-1 items-end">
                      <span className="bg-blue-200/50 text-blue-700 text-[9px] px-1.5 py-0.5 rounded-md" title="ยอดที่ยืนยันแล้ว">ยืนยันแล้ว ฿{stats.confirmedDeposit.toLocaleString()}</span>
                   </div>
                </div>
              </div>
              <div className="bg-fuchsia-50 p-5 rounded-2xl border border-fuchsia-100 shadow-sm col-span-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-fuchsia-100 text-fuchsia-600 flex items-center justify-center"><Clock size={20} /></div>
                  <div className="text-fuchsia-700 font-bold">ยอดค้างชำระ (Pending)</div>
                </div>
                <div className="text-3xl font-black text-fuchsia-800 mt-2">฿{stats.totalCod.toLocaleString()}</div>
                <div className="flex justify-between items-center mt-2">
                   <div className="flex gap-2 items-center w-full">
                      <span className="bg-fuchsia-200/50 text-fuchsia-700 text-[9px] px-2 py-0.5 rounded-md flex-1 text-center" title="ยอดค้างชำระจาก COD">COD ฿{(stats.totalCod - stats.totalOnline).toLocaleString()}</span>
                      <span className="bg-orange-200/50 text-orange-700 text-[9px] px-2 py-0.5 rounded-md flex-1 text-center" title="ยอดค้างชำระจาก Shopee/Online">Shopee ฿{stats.totalOnline.toLocaleString()}</span>
                   </div>
                </div>
              </div>
              
              <div className="bg-rose-50 p-5 rounded-2xl border border-rose-100 shadow-sm col-span-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center"><Banknote size={20} /></div>
                  <div className="text-rose-700 font-bold">รายจ่ายสั่งของ (PO)</div>
                </div>
                <div className="text-3xl font-black text-rose-800 mt-2">฿{stats.totalExpense.toLocaleString()}</div>
                <div className="text-xs text-rose-600 mt-2 font-medium">เฉพาะยอดสั่งเข้าสต๊อก</div>
              </div>

              <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100 shadow-sm col-span-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center"><Banknote size={20} /></div>
                  <div className="text-orange-700 font-bold">ค่าใช้จ่ายอื่นๆ (OPEX)</div>
                </div>
                <div className="text-3xl font-black text-orange-800 mt-2">฿{stats.totalOPEX.toLocaleString()}</div>
                {filterBranch !== 'ทั้งหมด' && appSettings?.branchBudgets?.[filterBranch] > 0 ? (
                    <div className="mt-2">
                       <div className="flex justify-between text-[10px] font-bold text-orange-700 mb-1">
                          <span>งบ: ฿{appSettings.branchBudgets[filterBranch].toLocaleString()}</span>
                          <span className={stats.totalOPEX > appSettings.branchBudgets[filterBranch] ? 'text-rose-600' : ''}>
                            เหลือ: ฿{(appSettings.branchBudgets[filterBranch] - stats.totalOPEX).toLocaleString()}
                          </span>
                       </div>
                       <div className="w-full bg-orange-200 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${stats.totalOPEX > appSettings.branchBudgets[filterBranch] ? 'bg-rose-500' : 'bg-orange-500'}`} style={{width: `${Math.min(100, (stats.totalOPEX / appSettings.branchBudgets[filterBranch]) * 100)}%`}}></div>
                       </div>
                    </div>
                ) : (
                    <div className="text-xs text-orange-600 mt-2 font-medium">ค่าน้ำ ไฟ เน็ต เงินเดือน ฯลฯ</div>
                )}
              </div>

              <div className={`p-5 rounded-2xl border shadow-sm col-span-1 ${stats.totalNet >= 0 ? 'bg-indigo-50 border-indigo-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stats.totalNet >= 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-red-100 text-red-600'}`}><Target size={20} /></div>
                  <div className={`font-bold ${stats.totalNet >= 0 ? 'text-indigo-700' : 'text-red-700'}`}>กำไรสุทธิ (Net Profit)</div>
                </div>
                <div className={`text-4xl font-black mt-2 ${stats.totalNet >= 0 ? 'text-indigo-800' : 'text-red-800'}`}>
                  {stats.totalNet >= 0 ? '' : '-'}฿{Math.abs(stats.totalNet).toLocaleString()}
                </div>
                <div className="text-xs mt-2 font-medium opacity-75 flex flex-col">
                  <span>รายรับสุทธิ หักลบด้วย ต้นทุนขาย, รายจ่าย(PO) และค่าใช้จ่ายอื่นๆ</span>
                  {stats.totalCOGS > 0 && 
                     <span className="text-blue-600 mt-1">
                        ต้นทุนขาย(COGS): ฿{stats.totalCOGS.toLocaleString()} 
                        <span className="text-xs text-blue-500 ml-1">
                           (สินค้า ฿{stats.totalProductCOGS.toLocaleString()} / คอร์ส ฿{stats.totalCourseCOGS.toLocaleString()})
                        </span>
                     </span>
                  }
                </div>
              </div>
            </div>

            {/* Top Products */}
            {(stats.topProductsByRevenue && stats.topProductsByRevenue.length > 0) && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6 mt-6">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                  <h2 className="font-bold text-slate-800 flex items-center gap-2">
                    <Target size={18} className="text-amber-500" /> สินค้า/บริการขายดี (Top Products)
                  </h2>
                </div>
                
                <div className="p-5">
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span> จัดอันดับตามยอดขาย (Revenue)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {stats.topProductsByRevenue.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-4 bg-slate-50 rounded-xl p-3 border border-slate-100 hover:shadow-md transition-shadow">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                            idx === 0 ? 'bg-amber-100 text-amber-600 shadow-sm' : 
                            idx === 1 ? 'bg-slate-200 text-slate-600 shadow-sm' : 
                            idx === 2 ? 'bg-orange-100 text-orange-600 shadow-sm' : 'bg-white text-slate-400 border border-slate-200'
                          }`}>
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-slate-700 text-sm truncate" title={p.name}>{p.name}</div>
                            <div className="text-xs text-slate-500">ขายได้ {p.qty} รายการ</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-black text-indigo-600">฿{p.revenue.toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> จัดอันดับตามจำนวนชิ้น (Quantity)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {stats.topProductsByQty.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-4 bg-slate-50 rounded-xl p-3 border border-slate-100 hover:shadow-md transition-shadow">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                            idx === 0 ? 'bg-emerald-100 text-emerald-600 shadow-sm' : 
                            idx === 1 ? 'bg-slate-200 text-slate-600 shadow-sm' : 
                            idx === 2 ? 'bg-teal-100 text-teal-600 shadow-sm' : 'bg-white text-slate-400 border border-slate-200'
                          }`}>
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-slate-700 text-sm truncate" title={p.name}>{p.name}</div>
                            <div className="text-xs text-slate-500">ยอดเงิน ฿{p.revenue.toLocaleString()}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-black text-emerald-600">{p.qty} <span className="text-[10px] text-emerald-500">ชิ้น</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Data Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                <h2 className="font-bold text-slate-800 flex items-center gap-2"><FileText size={18} className="text-slate-400" /> รายการเดินบัญชี</h2>
              </div>
              <div className="overflow-x-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredOrders.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-slate-400">ไม่พบข้อมูลยอดขายในเงื่อนไขที่เลือก</div>
                  ) : (
                    filteredOrders.map(o => {
                      const isOldPO = (o.courseName || '').includes('[ซื้อเข้า');
                      const isPO = o.transactionType === 'owner_purchase' || isOldPO;
                      const isReq = o.transactionType === 'branch_requisition' || (o.courseName || '').includes('[เบิกจาก');
                      
                      let badge = <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-[10px] font-bold border border-emerald-200">รายรับ</span>;
                      if (isPO) badge = <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded-lg text-[10px] font-bold border border-rose-200">รายจ่าย (PO)</span>;
                      else if (isReq) badge = <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-lg text-[10px] font-bold border border-amber-200">เบิกสต๊อก</span>;
                      
                      let profitContent = '-';
                      let costContent = '-';
                      let rev = parseNumber(o.price);
                      
                      if (o.orderChannel === 'shopee' && o.shopeeNetReceived !== undefined) {
                          rev = parseNumber(o.shopeeNetReceived);
                      }

                      if (!isPO && !isReq && o.totalCost !== undefined) {
                         const cost = parseNumber(o.totalCost);
                         costContent = `฿${cost.toLocaleString()}`;
                         profitContent = `฿${(rev - cost).toLocaleString()}`;
                      }
                      
                      return (
                        <div key={o.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between group">
                           <div className="flex justify-between items-start mb-3">
                              <div>
                                 <div className="font-black text-indigo-700 mb-1 flex items-center gap-2">
                                   {o.orderNo}
                                 </div>
                                 <div className="text-[11px] text-slate-400 font-medium bg-slate-50 inline-block px-2 py-0.5 rounded-md">
                                   เวลา: {o.createdAt ? new Date(o.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                 </div>
                              </div>
                              {badge}
                           </div>
                           
                           <div className="mb-4">
                             <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5 mb-1.5">
                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">👤</div>
                                {o.customerName || 'ลูกค้าทั่วไป'}
                             </div>
                             <div className="text-xs text-slate-500 leading-relaxed line-clamp-2 bg-slate-50/50 p-2 rounded-xl" title={o.courseName}>
                                {o.courseName || '-'}
                             </div>
                           </div>

                           <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-slate-100 mb-3 bg-slate-50/50 -mx-5 px-5">
                              <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ยอดรวม</div>
                                <div className={`text-sm font-black ${isPO ? 'text-rose-600' : isReq ? 'text-amber-600' : 'text-slate-800'}`}>
                                  {isPO ? '-' : ''}฿{rev.toLocaleString()}
                                </div>
                                {o.orderChannel === 'shopee' && o.shopeeNetReceived !== undefined && (
                                  <div className="text-[9px] text-emerald-600 font-bold leading-none mt-1">รับจริง (Net)</div>
                                )}
                              </div>
                              <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ทุนรวม</div>
                                <div className="text-sm font-bold text-rose-500">{costContent}</div>
                              </div>
                              <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">กำไร/บิล</div>
                                <div className="text-sm font-black text-emerald-600">{profitContent}</div>
                              </div>
                           </div>

                           <div className="flex justify-between items-center text-xs mt-auto">
                             <span className="text-slate-400 font-medium flex items-center gap-1">
                               <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> ช่องทางชำระ
                             </span>
                             <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                               {o.paymentMethod || '-'}
                             </span>
                           </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'verifications' && (() => {
          const year = calendarMonth.getFullYear();
          const month = calendarMonth.getMonth();
          const firstDay = new Date(year, month, 1).getDay();
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          
          const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
          const monthlyDailySales = dailySales.filter(d => {
              if (filterBranch !== 'ทั้งหมด' && d.branch !== filterBranch) return false;
              return getIsoDate(d).startsWith(monthStr);
          });
          const monthlyOrders = orders.filter(o => {
              if (filterBranch !== 'ทั้งหมด' && o.branch !== filterBranch) return false;
              if (o.status && getOrderStatus(o) !== 'อนุมัติแล้ว') return false;
              
              if (o.createdAt && typeof o.createdAt === 'string' && o.createdAt.includes('T')) {
                  return o.createdAt.startsWith(monthStr);
              } else if (o.createdAt && typeof o.createdAt.toDate === 'function') {
                  // Firestore Timestamp
                  const d = o.createdAt.toDate();
                  const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                  return mStr === monthStr;
              } else if (o.createdAt) {
                  const d = new Date(o.createdAt);
                  if (!isNaN(d.getTime())) {
                      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                      return mStr === monthStr;
                  }
              }
              return true; // Fallback
          });
          
          const calendarDays = Array(firstDay).fill(null);
          for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(year, month, i);
            const tzOffset = d.getTimezoneOffset() * 60000;
            const dateStr = new Date(d.getTime() - tzOffset).toISOString().split('T')[0];
            
            const eodsForDay = monthlyDailySales.filter(e => getIsoDate(e) === dateStr);
            
            const ordersForDay = monthlyOrders.filter(o => {
               let dStr = '';
               if (o.createdAt) {
                  const dObj = typeof o.createdAt.toDate === 'function' ? o.createdAt.toDate() : new Date(o.createdAt);
                  if (!isNaN(dObj.getTime())) {
                      const tz = dObj.getTimezoneOffset() * 60000;
                      dStr = new Date(dObj.getTime() - tz).toISOString().split('T')[0];
                  }
               }
               return dStr === dateStr;
            });
            const dayTotalSales = ordersForDay.reduce((sum, o) => {
               let p = parseNumber(o.price);
               if (o.orderChannel === 'shopee' && o.shopeeNetReceived !== undefined) {
                  p = parseNumber(o.shopeeNetReceived);
               }
               const isOldPO = (o.courseName || '').includes('[ซื้อเข้า');
               const isReq = o.transactionType === 'branch_requisition' || (o.courseName || '').includes('[เบิกจาก');
               const isPO = o.transactionType === 'owner_purchase' || isOldPO;
               
               if (isReq || isPO) return sum;
               return sum + p;
            }, 0);
            
            calendarDays.push({ date: d, dateStr, eods: eodsForDay, totalSales: dayTotalSales });
          }
          
          const monthNamesThai = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
          const dayNames = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
          
          // Use filteredDailySales for the selected day cards
          const selectedDayCards = stats.filteredDailySales;
          
          return (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <ListChecks className="text-teal-500" /> ตรวจรับยอดประจำวัน
                </h2>
                
                <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm w-fit">
                  <button 
                    onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="font-bold text-slate-700 text-lg min-w-[120px] text-center">
                    {monthNamesThai[month]} {year + 543}
                  </div>
                  <button 
                    onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 ml-auto">
                  <select 
                    value={filterBranch} 
                    onChange={(e) => setFilterBranch(e.target.value)} 
                    className="bg-white border border-slate-200 text-sm font-bold text-slate-700 px-3 py-2 rounded-xl outline-none shadow-sm"
                  >
                    {branchOptions.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  
                  <button 
                    onClick={() => setShowMonthlyPrintModal(true)}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm"
                  >
                    <Printer size={18} /> พรีวิว/พิมพ์ยอด
                  </button>
                </div>
              </div>
              
              <MonthlyEodPrintModal 
                isOpen={showMonthlyPrintModal} 
                onClose={() => setShowMonthlyPrintModal(false)}
                month={month}
                year={year}
                eods={monthlyDailySales}
                filterBranch={filterBranch}
                branchOptions={branchOptions}
                orders={monthlyOrders}
                expenses={expenses}
              />
              
              {/* Calendar Grid */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-6">
                <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
                  {dayNames.map(d => (
                    <div key={d} className="py-3 text-center text-xs font-bold text-slate-500">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {calendarDays.map((cDay, idx) => {
                    if (!cDay) return <div key={`empty-${idx}`} className="min-h-[100px] border-b border-r border-slate-100 bg-slate-50/30"></div>;
                    
                    const isSelected = cDay.dateStr === filterDate;
                    const isToday = cDay.dateStr === getLocalDateStr();
                    
                    return (
                      <div 
                        key={cDay.dateStr}
                        onClick={() => {
                          setFilterDate(cDay.dateStr);
                          setFilterMode('day');
                          setSelectedDayStr(cDay.dateStr);
                        }}
                        className={`min-h-[100px] p-2 pb-6 border-b border-r border-slate-100 cursor-pointer transition-all relative overflow-hidden flex flex-col ${isSelected ? 'bg-indigo-50 ring-2 ring-indigo-500 ring-inset' : 'hover:bg-slate-50'}`}
                      >
                        <div className="flex flex-col xl:flex-row xl:justify-between items-start xl:items-center mb-1 gap-1">
                          <div className={`text-xs sm:text-sm font-bold w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full shrink-0 ${isToday ? 'bg-indigo-600 text-white' : isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>
                            {cDay.date.getDate()}
                          </div>
                          {cDay.totalSales > 0 && (
                            <div className="text-[9px] sm:text-[10px] font-bold text-blue-600 bg-blue-50 px-1 py-0.5 rounded w-full xl:w-auto text-left xl:text-right truncate" title={`ยอดขายรวม ฿${cDay.totalSales.toLocaleString()}`}>
                              ฿{cDay.totalSales.toLocaleString()}
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-1 mt-1 flex-1">
                          {cDay.eods.length > 0 ? (
                            cDay.eods.slice(0, 3).map((eod, i) => (
                              <div key={i} className="flex items-center gap-1.5 text-[10px] w-full pr-1">
                                <div className={`w-2 h-2 rounded-full shrink-0 ${eod.status === 'ยืนยันแล้ว' ? 'bg-emerald-500' : eod.status === 'ปฏิเสธ' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                                <span className="truncate text-slate-600 flex-1">{eod.branch === 'สำนักงานใหญ่' ? 'สนญ.' : eod.branch}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-[10px] text-slate-300 italic px-1">-</div>
                          )}
                          {cDay.eods.length > 3 && (
                            <div className="text-[10px] text-slate-400 font-medium pl-3">+{cDay.eods.length - 3} สาขา</div>
                          )}
                        </div>
                        
                        {(() => {
                           const dayTotalDeposit = cDay.eods.reduce((sum, eod) => sum + (eod.totalDeposit || eod.remitAmount || 0), 0);
                           if (dayTotalDeposit > 0) {
                             return (
                               <div className="absolute bottom-0 left-0 right-0 bg-emerald-500 text-white text-[10px] font-bold text-center py-0.5">
                                 ฝาก ฿{dayTotalDeposit.toLocaleString()}
                               </div>
                             );
                           }
                           return null;
                        })()}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Selected Day Cards Header */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                <h3 className="font-bold text-lg text-slate-800">
                  รายการส่งยอดวันที่ {new Date(filterDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {selectedDayCards
                  .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map(d => (
                  <div key={d.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    {/* Status Banner */}
                    <div className={`px-4 py-2 text-xs font-bold text-center text-white ${d.status === 'ยืนยันแล้ว' ? 'bg-emerald-500' : d.status === 'ปฏิเสธ' ? 'bg-red-500' : 'bg-amber-500'}`}>
                      สถานะ: {d.status}
                    </div>
                    
                    <div className="p-5 flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-lg font-black text-slate-800">{d.branch}</div>
                          <div className="text-xs text-slate-400 font-mono">{new Date(d.createdAt).toLocaleString('th-TH')}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                            นับสดได้: <span className="font-bold text-slate-700">฿{d.actualCash?.toLocaleString()}</span>
                          </div>
                          <button 
                            onClick={() => handleDeleteEod(d.id)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="ลบใบส่งยอด"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-3 text-white shadow-md mb-4">
                        <h3 className="font-bold text-xs text-indigo-100 mb-2 flex items-center gap-1"><CheckCircle size={14} /> สรุปยอดเตรียมนำฝาก</h3>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-indigo-100">เงินสด:</span>
                            <span className="font-bold">฿{d.remitAmount?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-indigo-100">เงินโอน:</span>
                            <span className="font-bold">฿{d.transferSales?.toLocaleString()}</span>
                          </div>
                          {(d.creditSales > 0 || d.codSales > 0) && (
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-indigo-100">ยอดค้าง (เครดิต/COD):</span>
                              <span className="font-bold text-orange-200">฿{((d.creditSales || 0) + (d.codSales || 0)).toLocaleString()}</span>
                            </div>
                          )}
                          <div className="pt-1 mt-1 border-t border-indigo-400/50 flex justify-between items-center">
                            <span className="font-bold text-sm">ยอดนำฝากรวม:</span>
                            <span className="font-black text-base">฿{parseNumber(d.totalDeposit || d.expectedDeposit || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 rounded-xl p-3 space-y-2 text-sm mb-4">
                        <div className="flex justify-between"><span className="text-slate-500">เงินสดในระบบ</span><span className="font-bold">฿{d.cashSales?.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">เงินทอนตั้งต้น</span><span className="font-bold">฿{d.floatCash?.toLocaleString()}</span></div>
                        <div className="border-t border-slate-200 pt-2 flex justify-between font-bold">
                          <span className="text-slate-700">ควรมีในลิ้นชัก</span>
                          <span className="text-indigo-600">฿{d.expectedCash?.toLocaleString()}</span>
                        </div>
                        <div className={`flex justify-between font-bold ${d.difference > 0 ? 'text-emerald-600' : d.difference < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                          <span>ผลต่าง (เกิน/ขาด)</span>
                          <span>{d.difference > 0 ? '+' : ''}{d.difference?.toLocaleString()}</span>
                        </div>
                        
                        {(d.nextDayFloat !== undefined) && (
                          <div className="border-t border-indigo-100 pt-2 mt-2 bg-indigo-50/50 -mx-3 px-3 pb-2 rounded-b-xl">
                             <div className="flex justify-between text-indigo-600 text-xs">
                               <span className="font-bold">ยอดเงินทอนยกไปพรุ่งนี้</span>
                               <span className="font-black">฿{d.nextDayFloat?.toLocaleString()}</span>
                             </div>
                          </div>
                        )}
                      </div>
  
                      <div className="flex flex-col gap-1 text-xs text-slate-500 mb-4">
                        <div className="flex justify-between">
                          <span className="font-bold">โอน: ฿{d.transferSales?.toLocaleString()}</span>
                          <span className="font-bold">ออนไลน์/Shopee: ฿{(d.onlineSales || 0).toLocaleString()}</span>
                        </div>
                        
                        {d.transferDetails && d.transferDetails.length > 0 && (
                          <div className="mt-1 pt-2 border-t border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 mb-1">รายการโอนย่อย:</div>
                            <div className="max-h-24 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                              {d.transferDetails.map((t, idx) => (
                                <div key={idx} className="flex flex-col text-[11px] bg-emerald-500 border border-emerald-600 p-2 rounded-md shadow-sm">
                                  <div className="flex justify-between font-bold text-white mb-1">
                                    <span className="truncate mr-2">{t.time} - {t.customer}</span>
                                    <span className="shrink-0">฿{t.amount?.toLocaleString()}</span>
                                  </div>
                                  <div className="text-[10px] text-emerald-50 leading-tight">{t.items || 'สินค้า/บริการ'}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {((d.creditSales || 0) + (d.codSales || 0) + (d.onlineSales || 0)) > 0 && (
                        <div className="bg-rose-50 px-4 py-3 rounded-xl flex flex-col mb-4 border border-rose-100">
                          <div className="flex justify-between items-center text-rose-700 mb-2">
                            <span className="font-bold text-sm">ยอดค้างชำระรวม</span>
                            <span className="font-black text-lg">฿{((d.creditSales || 0) + (d.codSales || 0) + (d.onlineSales || 0)).toLocaleString()}</span>
                          </div>
                          <div className="text-xs font-semibold text-rose-600/80 space-y-1.5 border-t border-rose-200/60 pt-2.5">
                            {(d.creditSales > 0) && (
                              <div className="flex justify-between items-center">
                                <span>• เครดิต:</span>
                                <span>฿{d.creditSales.toLocaleString()}</span>
                              </div>
                            )}
                            {(d.codSales > 0) && (
                              <div className="flex justify-between items-center">
                                <span>• COD:</span>
                                <span>฿{d.codSales.toLocaleString()}</span>
                              </div>
                            )}
                            {(d.onlineSales > 0) && (
                              <div className="flex justify-between items-center">
                                <span>• ช้อปปี้/ออนไลน์:</span>
                                <span>฿{d.onlineSales.toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                          {d.pendingDetails && d.pendingDetails.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-rose-200/60">
                              <div className="text-[10px] font-bold text-rose-500 mb-2">รายการยอดค้าง:</div>
                              <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                                {d.pendingDetails.map((p, idx) => (
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
                      )}
  
                      {d.imageBase64 ? (
                        <button 
                          onClick={() => setPreviewImage(d.imageBase64)}
                          className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-colors"
                        >
                          <ImageIcon size={16} /> ดูรูปสลิป/สรุปยอด
                        </button>
                      ) : (
                        <div className="w-full py-2 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center gap-2 text-sm border border-dashed border-slate-200">
                          <ImageIcon size={16} /> ไม่มีรูปแนบ
                        </div>
                      )}
                    </div>
                    
                    {d.status === 'รอตรวจสอบ' && (
                      <div className="flex border-t border-slate-100">
                        <button onClick={() => handleVerify(d.id, 'ปฏิเสธ')} className="flex-1 py-3 text-red-500 font-bold text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-1">
                          <X size={16}/> ปฏิเสธ
                        </button>
                        <div className="w-px bg-slate-100"></div>
                        <button onClick={() => handleVerify(d.id, 'ยืนยันแล้ว')} className="flex-1 py-3 text-emerald-600 font-bold text-sm hover:bg-emerald-50 transition-colors flex items-center justify-center gap-1">
                          <Check size={16}/> ยืนยันยอด
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                
                {selectedDayCards.length === 0 && (
                  <div className="col-span-full py-16 text-center text-slate-400 bg-slate-50/50 rounded-3xl border border-slate-200 border-dashed">
                    <ListChecks size={40} className="mx-auto mb-3 opacity-20" />
                    <p>ไม่มีรายการที่ค้นพบในวันนี้</p>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
                {activeTab === 'expenses' && (
          <>
          <style>{`
            @media (max-width: 1023px) {
              #mobile-bottom-nav { display: none !important; }
              main { padding-bottom: 0 !important; }
            }
          `}</style>
          <div className="-mx-6 -mt-6 md:mx-0 md:mt-0 flex flex-col min-h-[calc(100vh-140px)] md:min-h-0 bg-white md:bg-transparent">
            <h2 className="hidden md:flex text-xl font-bold text-slate-800 items-center gap-2 mb-4">
              <DollarSign className="text-orange-500" /> บันทึกค่าใช้จ่าย (OPEX)
            </h2>
            
            {/* Form */}
            <div className="max-w-md w-full mx-auto bg-white md:rounded-[32px] md:border border-slate-200 md:shadow-xl overflow-hidden relative">
              {/* Header Gradient */}
              <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 pb-10 text-center relative overflow-hidden">
                <button 
                  onClick={() => setActiveTab('overview')}
                  className="md:hidden absolute top-4 left-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur-sm transition-all z-20"
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="absolute top-0 right-0 p-4 opacity-30 pointer-events-none"><DollarSign size={100} className="text-white transform translate-x-4 -translate-y-4 rotate-12" /></div>
                <h3 className="text-white/80 font-bold mb-2">ระบุยอดเงิน (บาท)</h3>
                <div className="flex items-center justify-center text-white">
                  <span className="text-3xl font-bold mr-2 opacity-80">฿</span>
                  <input 
                    type="number" 
                    value={expenseForm.amount} 
                    onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} 
                    placeholder="0" 
                    className="bg-transparent border-none outline-none text-6xl font-black text-center w-full max-w-[250px] placeholder:text-white/30 text-white z-10" 
                  />
                </div>
              </div>

              {/* Form Body */}
              <div className="p-6 md:p-8 bg-white rounded-t-[32px] -mt-6 relative z-10 space-y-6">
                 
                 {/* Category Grid */}
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">เลือกหมวดหมู่</label>
                    <div className="grid grid-cols-4 gap-3">
                       {expenseCategories.map(c => {
                          let icon = <MoreHorizontal size={24}/>;
                          let color = 'text-slate-600 bg-slate-100';
                          if (c.includes('เงินเดือน')) { icon = <Users size={24}/>; color = 'text-indigo-600 bg-indigo-100'; }
                          else if (c.includes('สั่งซื้อสินค้า')) { icon = <Package size={24}/>; color = 'text-emerald-600 bg-emerald-100'; }
                          else if (c.includes('ค่าน้ำ')) { icon = <Droplets size={24}/>; color = 'text-blue-600 bg-blue-100'; }
                          else if (c.includes('ค่าไฟ')) { icon = <Zap size={24}/>; color = 'text-amber-600 bg-amber-100'; }
                          else if (c.includes('อินเทอร์เน็ต')) { icon = <Wifi size={24}/>; color = 'text-sky-600 bg-sky-100'; }
                          else if (c.includes('ค่าเช่า')) { icon = <Home size={24}/>; color = 'text-rose-600 bg-rose-100'; }
                          else if (c.includes('จิปาถะ')) { icon = <Coffee size={24}/>; color = 'text-purple-600 bg-purple-100'; }
                          
                          const isSelected = expenseForm.category === c;
                          return (
                            <button 
                               key={c}
                               onClick={() => setExpenseForm({...expenseForm, category: c})}
                               className={`flex flex-col items-center justify-start p-2 rounded-2xl border-2 transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50 shadow-md scale-105' : 'border-transparent bg-slate-50 hover:bg-slate-100'}`}
                               title={c}
                            >
                               <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 shrink-0 ${isSelected ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/40' : color}`}>{icon}</div>
                               <span className={`text-[9px] font-bold text-center leading-tight ${isSelected ? 'text-indigo-700' : 'text-slate-500'}`}>{c}</span>
                            </button>
                          );
                       })}
                    </div>
                 </div>

                 {/* Date & Branch */}
                 <div className="flex gap-4">
                    <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <label className="block text-xs font-bold text-slate-400 mb-1">วันที่ทำรายการ</label>
                      <input type="date" value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} className="w-full bg-transparent border-none outline-none font-bold text-slate-700" />
                    </div>
                    <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <label className="block text-xs font-bold text-slate-400 mb-1">สาขา</label>
                      <select value={expenseForm.branch} onChange={e => setExpenseForm({...expenseForm, branch: e.target.value})} className="w-full bg-transparent border-none outline-none font-bold text-slate-700 appearance-none cursor-pointer">
                        {branchOptions.map(b => <option key={b} value={b === 'ทั้งหมด' ? 'สำนักงานใหญ่' : b}>{b === 'ทั้งหมด' ? 'สำนักงานใหญ่' : b}</option>)}
                      </select>
                    </div>
                 </div>
                 
                 {expenseForm.category === 'เงินเดือนพนักงาน' && payrollSummary && (
                   <div className="space-y-4">
                     <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                       <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                          <h4 className="font-bold text-slate-800 flex items-center gap-2"><DollarSign className="text-emerald-500" /> สรุปรายได้พนักงาน</h4>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg flex items-center gap-1"><Calendar size={12}/> {new Date(expenseForm.date || new Date()).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span>
                       </div>
                       
                       <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                         <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                           <span className="text-[10px] font-bold text-slate-500 mb-1">รวมเงินเดือนพื้นฐาน</span>
                           <span className="text-sm font-black text-slate-700">฿{payrollSummary.totalBase.toLocaleString()}</span>
                         </div>
                         <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                           <span className="text-[10px] font-bold text-slate-500 mb-1">รวมค่าอาหาร</span>
                           <span className="text-sm font-black text-orange-600">฿{payrollSummary.totalFood.toLocaleString()}</span>
                         </div>
                         <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                           <span className="text-[10px] font-bold text-slate-500 mb-1">รวมค่าคอมมิชชั่น</span>
                           <span className="text-sm font-black text-indigo-600">฿{payrollSummary.totalComm.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                         </div>
                         <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                           <span className="text-[10px] font-bold text-slate-500 mb-1">รวมเบิกเงินล่วงหน้า</span>
                           <span className="text-sm font-black text-rose-600">฿{payrollSummary.totalAdv.toLocaleString()}</span>
                         </div>
                         <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex flex-col items-center justify-center text-center col-span-2 lg:col-span-1">
                           <span className="text-[10px] font-bold text-emerald-600 mb-1">ยอดรวมที่ต้องจ่ายสุทธิ</span>
                           <span className="text-lg font-black text-emerald-700">฿{payrollSummary.totalNet.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                         </div>
                       </div>
                     </div>
                     
                     <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                       <label className="block text-xs font-bold text-indigo-600 mb-3 flex items-center gap-1"><Users size={14}/> ดึงเงินเดือนอัตโนมัติรายบุคคล (เฉพาะ {expenseForm.branch || 'ทั้งหมด'})</label>
                       <div className="flex flex-wrap gap-2">
                           {payrollSummary.branchEmployees.map(emp => (
                               <button 
                                  key={emp.id}
                                  type="button"
                                  onClick={() => handleAutoSalary(emp)}
                                  className="text-xs bg-white text-indigo-700 px-4 py-2 rounded-xl shadow-sm font-bold border border-indigo-200 hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
                               >
                                   {emp.name}
                               </button>
                           ))}
                           {payrollSummary.branchEmployees.length === 0 && (
                               <span className="text-xs text-indigo-400">ไม่มีพนักงานในสาขานี้</span>
                           )}
                       </div>
                     </div>
                   </div>
                 )}

                 <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <label className="block text-xs font-bold text-slate-400 mb-2">หมายเหตุเพิ่มเติม</label>
                   <input type="text" value={expenseForm.note} onChange={e => setExpenseForm({...expenseForm, note: e.target.value})} placeholder="ระบุรายละเอียดเพิ่มเติม..." className="w-full bg-transparent border-none outline-none font-medium text-slate-700 placeholder:text-slate-400" />
                 </div>

                 <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">แนบรูปใบเสร็จ</label>
                      <p className="text-xs text-slate-400">รูปภาพสลิปโอนเงิน หรือใบเสร็จรับเงิน</p>
                    </div>
                    <div className="relative">
                      <input 
                         type="file" 
                         accept="image/*" 
                         capture="environment"
                         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                         onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                               const reader = new FileReader();
                               reader.onloadend = () => {
                                  setExpenseForm({...expenseForm, receiptFile: file, receiptPreview: reader.result});
                               };
                               reader.readAsDataURL(file);
                            } else {
                               setExpenseForm({...expenseForm, receiptFile: null, receiptPreview: null});
                            }
                         }}
                      />
                      {expenseForm.receiptPreview ? (
                         <div className="w-14 h-14 rounded-xl border-2 border-indigo-500 overflow-hidden relative">
                           <img src={expenseForm.receiptPreview} alt="Preview" className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><Camera size={20} className="text-white"/></div>
                         </div>
                      ) : (
                         <div className="w-14 h-14 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 bg-white hover:bg-slate-100 transition-colors">
                           <Camera size={24} />
                         </div>
                      )}
                    </div>
                 </div>

                 <button onClick={handleAddExpense} disabled={isSavingExpense} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all active:scale-[0.98]">
                   {isSavingExpense ? 'กำลังบันทึกข้อมูล...' : 'บันทึกรายจ่าย'}
                 </button>
              </div>
            </div>

            {/* Expense Charts by Branch */}
            {expenseDataByBranch.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-6xl mt-6">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <BarChart3 size={18} className="text-indigo-500" /> สรุปสัดส่วนค่าใช้จ่ายเดือนนี้ แยกตามสาขา
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {expenseDataByBranch.map((branch) => (
                    <div key={branch.branchName} className="bg-slate-50 border border-slate-100 rounded-xl p-5 shadow-sm flex flex-col items-center">
                      <h4 className="font-bold text-slate-700 mb-4">{branch.branchName}</h4>
                      <DonutChart data={branch.chartData} />
                      
                      <div className="w-full mt-6 space-y-4">
                        {/* Fixed Cost */}
                        <div>
                           <div className="flex justify-between items-center mb-2">
                             <span className="text-sm font-bold text-slate-700">Fixed Cost</span>
                             <span className="text-sm font-black text-rose-600">฿{branch.fixedTotal.toLocaleString()}</span>
                           </div>
                           <div className="space-y-1">
                             {branch.chartData.filter(d => FIXED_COST_CATEGORIES.includes(d.label)).map(d => (
                               <div key={d.label} onClick={d.onClick} className="flex justify-between items-center text-xs cursor-pointer hover:bg-slate-100 p-1.5 rounded transition-colors -mx-1.5">
                                 <span className="flex items-center gap-1 text-slate-500">
                                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                                   {d.label}
                                 </span>
                                 <span className="text-slate-600 font-medium">฿{d.value.toLocaleString()}</span>
                               </div>
                             ))}
                           </div>
                        </div>

                        {/* Variable Cost */}
                        <div className="border-t border-slate-200 pt-3">
                           <div className="flex justify-between items-center mb-2">
                             <span className="text-sm font-bold text-slate-700">Variable / Other</span>
                             <span className="text-sm font-black text-orange-600">฿{branch.varTotal.toLocaleString()}</span>
                           </div>
                           <div className="space-y-1">
                             {branch.chartData.filter(d => !FIXED_COST_CATEGORIES.includes(d.label)).map(d => (
                               <div key={d.label} onClick={d.onClick} className="flex justify-between items-center text-xs cursor-pointer hover:bg-slate-100 p-1.5 rounded transition-colors -mx-1.5">
                                 <span className="flex items-center gap-1 text-slate-500">
                                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                                   {d.label}
                                 </span>
                                 <span className="text-slate-600 font-medium">฿{d.value.toLocaleString()}</span>
                               </div>
                             ))}
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                <h2 className="font-bold text-slate-800 flex items-center gap-2"><ListChecks size={18} className="text-slate-400" /> ประวัติค่าใช้จ่ายเดือนนี้</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3">วันที่</th>
                      <th className="px-6 py-3">สาขา</th>
                      <th className="px-6 py-3">หมวดหมู่</th>
                      <th className="px-6 py-3">รายละเอียด</th>
                      <th className="px-6 py-3 text-right">จำนวนเงิน</th>
                      <th className="px-6 py-3 text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expenses.filter(e => {
                        // Show current month expenses mostly
                        if (!e.date) return false;
                        const d = new Date(e.date);
                        const now = new Date();
                        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                    }).sort((a,b) => new Date(b.date) - new Date(a.date)).map(e => (
                      <tr key={e.id} className="hover:bg-slate-50">
                        <td className="px-6 py-3">{new Date(e.date).toLocaleDateString('th-TH')}</td>
                        <td className="px-6 py-3">{e.branch}</td>
                        <td className="px-6 py-3"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-xs font-bold">{e.category}</span></td>
                        <td className="px-6 py-4 max-w-[200px] truncate text-slate-500">
                          {e.note || '-'}
                          {e.receiptUrl && (
                            <a href={e.receiptUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-bold ml-2 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 transition-colors">
                              <ImageIcon size={12} /> ดูรูปใบเสร็จ
                            </a>
                          )}
                        </td>
                        <td className="px-6 py-3 text-right font-bold text-orange-600">฿{e.amount?.toLocaleString()}</td>
                        <td className="px-6 py-3 text-center">
                           <button onClick={() => handleDeleteExpense(e.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors"><X size={16}/></button>
                        </td>
                      </tr>
                    ))}
                    {expenses.length === 0 && <tr><td colSpan={6} className="text-center py-6 text-slate-400">ยังไม่มีประวัติค่าใช้จ่าย</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          </>
        )}

        {/* PENDING PAYMENTS TAB */}
        {activeTab === 'pending_payments' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
             <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                   <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Clock className="text-orange-500" /> จัดการยอดค้างชำระ (Accounts Receivable)</h2>
                   <p className="text-sm text-slate-500 mt-1">รายการคอร์สและสินค้าที่ลูกค้ายังชำระเงินไม่ครบ</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
                  <Store size={18} className="text-slate-500" />
                  <select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)} className="bg-transparent border-none outline-none text-sm font-medium text-slate-700">
                    {branchOptions.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
             </div>
             
             {/* Summary Banner for Pending Payments */}
             {(() => {
                const pendingCourses = courses.filter(c => {
                    const pending = parseNumber(c['ยอดค้างชำระ'] || c.pending || 0);
                    return pending > 0 && (filterBranch === 'ทั้งหมด' || c['สาขาที่ซื้อ'] === filterBranch || c.branch === filterBranch);
                });
                const totalPending = pendingCourses.reduce((sum, c) => sum + parseNumber(c['ยอดค้างชำระ'] || c.pending || 0), 0);
                const totalPrice = pendingCourses.reduce((sum, c) => sum + parseNumber(c['ราคา'] || c.price || 0), 0);
                const totalPaid = pendingCourses.reduce((sum, c) => {
                    const price = parseNumber(c['ราคา'] || c.price || 0);
                    const pending = parseNumber(c['ยอดค้างชำระ'] || c.pending || 0);
                    const paid = parseNumber(c['ยอดชำระแล้วทั้งหมด'] || c.paid || (price - pending));
                    return sum + paid;
                }, 0);

                return (
                  <div className="bg-orange-50 border-b border-orange-100 p-6 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
                     <div className="text-center">
                        <div className="text-sm font-bold text-slate-500 mb-1">รวมราคาเต็มทั้งหมด (สาขา: {filterBranch})</div>
                        <div className="text-2xl font-black text-slate-700">฿{totalPrice.toLocaleString()}</div>
                     </div>
                     <div className="hidden md:block w-px h-12 bg-orange-200"></div>
                     <div className="text-center">
                        <div className="text-sm font-bold text-emerald-600 mb-1">จ่ายมาแล้วทั้งหมด</div>
                        <div className="text-2xl font-black text-emerald-600">฿{totalPaid.toLocaleString()}</div>
                     </div>
                     <div className="hidden md:block w-px h-12 bg-orange-200"></div>
                     <div className="text-center scale-110">
                        <div className="text-sm font-bold text-rose-600 mb-1">ยอดค้างชำระทั้งหมด</div>
                        <div className="text-3xl font-black text-rose-600">฿{totalPending.toLocaleString()}</div>
                     </div>
                  </div>
                );
             })()}

             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                   <tr>
                     <th className="px-6 py-4">วันที่ซื้อ</th>
                     <th className="px-6 py-4">ชื่อลูกค้า</th>
                     <th className="px-6 py-4">เบอร์โทร</th>
                     <th className="px-6 py-4">รายการคอร์ส/สินค้า</th>
                     <th className="px-6 py-4">สาขา</th>
                     <th className="px-6 py-4 text-right">ราคาเต็ม</th>
                     <th className="px-6 py-4 text-right">จ่ายแล้ว</th>
                     <th className="px-6 py-4 text-right">ยอดค้างชำระ</th>
                     <th className="px-6 py-4 text-center">จัดการ</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {courses.filter(c => {
                       const pending = parseNumber(c['ยอดค้างชำระ'] || c.pending || 0);
                       return pending > 0 && (filterBranch === 'ทั้งหมด' || c['สาขาที่ซื้อ'] === filterBranch || c.branch === filterBranch);
                   }).sort((a,b) => {
                       const dA = a['วันที่ซื้อ'] || a.createdAt || '';
                       const dB = b['วันที่ซื้อ'] || b.createdAt || '';
                       if (dA && dB && dA.includes('/') && dB.includes('/')) {
                           return new Date(dB.split('/').reverse().join('-')) - new Date(dA.split('/').reverse().join('-'));
                       }
                       return new Date(dB) - new Date(dA);
                   }).map(c => {
                       const pending = parseNumber(c['ยอดค้างชำระ'] || c.pending || 0);
                       const price = parseNumber(c['ราคา'] || c.price || 0);
                       const paid = parseNumber(c['ยอดชำระแล้วทั้งหมด'] || c.paid || (price - pending));
                       const cName = c['ผู้ซื้อคอส'] || c.customerName || 'ลูกค้าทั่วไป';
                       const phone = c['เบอร์โทร'] || c.customerPhone || '-';
                       const courseName = c['ชื่อคอส'] || c.courseName || '-';
                       const branch = c['สาขาที่ซื้อ'] || c.branch || '-';
                       const dateStr = c['วันที่ซื้อ'] || c.createdAt || '-';
                       
                       return (
                         <tr key={c.id} className="hover:bg-orange-50/30 transition-colors">
                           <td className="px-6 py-4 font-medium text-slate-500">{dateStr}</td>
                           <td className="px-6 py-4 font-bold text-slate-800">{cName}</td>
                           <td className="px-6 py-4 text-slate-600">{phone}</td>
                           <td className="px-6 py-4 text-slate-800 font-medium">{courseName}</td>
                           <td className="px-6 py-4 text-slate-500">{branch}</td>
                           <td className="px-6 py-4 text-right font-medium">฿{price.toLocaleString()}</td>
                           <td className="px-6 py-4 text-right text-emerald-600 font-medium">฿{paid.toLocaleString()}</td>
                           <td className="px-6 py-4 text-right font-black text-rose-600">฿{pending.toLocaleString()}</td>
                           <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <a 
                                  href={`tel:${phone.replace(/[^0-9]/g, '')}`}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-xs font-bold transition-colors"
                                >
                                  <Smartphone size={14} /> โทร
                                </a>
                                <button 
                                  onClick={() => setSelectedPaymentCourse(c)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 rounded-lg text-xs font-bold transition-colors"
                                >
                                  <HistoryIcon size={14} /> ประวัติชำระ
                                </button>
                              </div>
                            </td>
                         </tr>
                       );
                   })}
                   {courses.filter(c => parseNumber(c['ยอดค้างชำระ'] || c.pending || 0) > 0 && (filterBranch === 'ทั้งหมด' || c['สาขาที่ซื้อ'] === filterBranch || c.branch === filterBranch)).length === 0 && (
                     <tr>
                       <td colSpan="9" className="px-6 py-12 text-center text-slate-400 font-bold">
                         ไม่มีรายการยอดค้างชำระในสาขานี้ 🎉
                       </td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
          </div>
        )}

      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm print:hidden">
          <div className="relative max-w-3xl w-full">
            <button onClick={() => setPreviewImage(null)} className="absolute -top-12 right-0 text-white hover:text-red-400 p-2"><X size={32}/></button>
            <img src={previewImage} alt="Preview" className="w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {selectedPaymentCourse && (
        <ModalWrapper isOpen={true} onClose={() => setSelectedPaymentCourse(null)} title="ประวัติการชำระเงิน" icon={HistoryIcon}>
           {(() => {
              const c = selectedPaymentCourse;
              const courseRefNo = c['เลขที่ใบคอส'] || c.courseNo || '';
              // Filter from histories where อ้างอิง matches and it's a payment
              const relatedHistories = histories.filter(h => h['อ้างอิง'] === courseRefNo && (h['ประเภท'] === 'ชำระยอดค้าง' || h['ประเภท'] === 'ซื้อคอร์ส')).sort((a,b) => {
                  const dateA = a['วันที่'] ? a['วันที่'].split('/').reverse().join('') : '';
                  const timeA = a['เวลา'] || '';
                  const dateB = b['วันที่'] ? b['วันที่'].split('/').reverse().join('') : '';
                  const timeB = b['เวลา'] || '';
                  return (dateA+timeA).localeCompare(dateB+timeB);
              });
              const totalPaid = parseNumber(c['ยอดชำระแล้วทั้งหมด'] || 0);

              return (
                 <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                       <h3 className="font-bold text-slate-800 mb-1">{c['ชื่อคอส']} (ใบคอร์ส: {courseRefNo})</h3>
                       <div className="flex justify-between text-sm">
                          <span className="text-slate-500">ยอดชำระแล้วทั้งหมด:</span>
                          <span className="font-black text-emerald-600">฿{totalPaid.toLocaleString()}</span>
                       </div>
                    </div>
                    {relatedHistories.length > 0 ? (
                       <div className="border border-slate-200 rounded-xl overflow-hidden">
                         <table className="w-full text-sm text-left">
                           <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                              <tr>
                                <th className="px-4 py-2 font-bold">วันที่ / เวลา</th>
                                <th className="px-4 py-2 font-bold">สาขา</th>
                                <th className="px-4 py-2 font-bold">รายการ</th>
                                <th className="px-4 py-2 font-bold text-right">ยอดชำระ</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                              {relatedHistories.map((h, idx) => (
                                 <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3">{h['วันที่']} {h['เวลา'] || ''}</td>
                                    <td className="px-4 py-3">{h['สาขา'] || 'สำนักงานใหญ่'}</td>
                                    <td className="px-4 py-3 text-slate-600">{h['ประเภท']} {h['สินค้า'] ? `(${h['สินค้า']})` : ''}</td>
                                    <td className="px-4 py-3 text-right font-bold text-emerald-600">฿{parseNumber(h['ยอดเงิน']).toLocaleString()}</td>
                                 </tr>
                              ))}
                           </tbody>
                         </table>
                       </div>
                    ) : (
                       <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-xl">ไม่พบประวัติการชำระในระบบ (ข้อมูลอาจมาจากระบบเก่า)</div>
                    )}
                 </div>
              );
           })()}
        </ModalWrapper>
      )}

      {/* Printable Report Layout (A4 format) */}
      <div className="hidden print:block w-[210mm] min-h-[297mm] mx-auto bg-white text-black p-[20mm]">
        <div className="text-center mb-8 border-b-2 border-slate-800 pb-6">
          <h1 className="text-3xl font-bold mb-2">รายงานสรุปยอดขาย</h1>
          <p className="text-lg">IRIS NATURES</p>
          <div className="flex justify-center gap-6 mt-4 text-sm text-slate-700">
            <div><strong>วันที่:</strong> {new Date(filterDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div><strong>สาขา:</strong> {filterBranch}</div>
            <div><strong>พิมพ์เมื่อ:</strong> {new Date().toLocaleString('th-TH')}</div>
            <div><strong>รูปแบบ:</strong> {filterMode === 'month' ? 'สรุปรายเดือน' : 'สรุปรายวัน'}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="border border-slate-300 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-4 border-b border-slate-200 pb-2">สรุปผลกำไร-ขาดทุน (P&L)</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>รายรับรวม (Sales)</span>
                <span className="font-bold text-lg text-emerald-600">฿{stats.totalSales.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2 mb-2">
                <span>รายจ่าย (PO)</span>
                <span className="font-bold text-lg text-rose-600">- ฿{stats.totalExpense.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2 mb-2">
                <span>ค่าใช้จ่ายดำเนินงาน (OPEX)</span>
                <span className="font-bold text-lg text-orange-600">- ฿{stats.totalOPEX.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">กำไรสุทธิ (Net Profit)</span>
                <span className={`font-bold text-xl ${stats.totalNet >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                  {stats.totalNet >= 0 ? '' : '-'}฿{Math.abs(stats.totalNet).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="border border-slate-300 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-4 border-b border-slate-200 pb-2">ยอดขายสุทธิ แยกตามช่องทางชำระเงิน</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>เงินสด</span>
                <span>฿{stats.totalCash.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>โอนเงิน</span>
                <span>฿{stats.totalTransfer.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>ค้าง/COD</span>
                <span>฿{stats.totalCod.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <h3 className="font-bold text-lg mb-4">รายการบัญชี</h3>
        <table className="w-full text-sm text-left border-collapse border border-slate-300">
          <thead className="bg-slate-100 border-b border-slate-300">
            <tr>
              <th className="border border-slate-300 px-3 py-2">เวลา</th>
              <th className="border border-slate-300 px-3 py-2">เลขที่บิล</th>
              <th className="border border-slate-300 px-3 py-2">ลูกค้า</th>
              <th className="border border-slate-300 px-3 py-2">ช่องทางชำระ</th>
              <th className="border border-slate-300 px-3 py-2 text-right">ยอดรวม</th>
              <th className="border border-slate-300 px-3 py-2 text-right">กำไร</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="border border-slate-300 px-3 py-4 text-center">ไม่มีข้อมูล</td>
              </tr>
            ) : (
              filteredOrders.map(o => (
                <tr key={o.id}>
                  <td className="border border-slate-300 px-3 py-2">{o.createdAt ? new Date(o.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                  <td className="border border-slate-300 px-3 py-2">{o.orderNo}</td>
                  <td className="border border-slate-300 px-3 py-2">{o.customerName || 'ลูกค้าทั่วไป'}</td>
                  <td className="border border-slate-300 px-3 py-2 text-xs">{o.paymentMethod || '-'}</td>
                  <td className="border border-slate-300 px-3 py-2 text-right">
                    {o.transactionType === 'owner_purchase' || (o.courseName || '').includes('[ซื้อเข้า') ? '-' : ''}฿{parseNumber(o.price).toLocaleString()}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-right font-bold">
                    {o.totalCost !== undefined && o.transactionType !== 'owner_purchase' && o.transactionType !== 'branch_requisition' && !(o.courseName || '').includes('[ซื้อเข้า') && !(o.courseName || '').includes('[เบิกจาก') 
                       ? `฿${(parseNumber(o.price) - parseNumber(o.totalCost)).toLocaleString()}` 
                       : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="mt-16 flex justify-end">
          <div className="text-center">
            <div className="w-48 border-b border-slate-400 mb-2"></div>
            <div className="text-sm">ผู้จัดทำรายงาน / ผู้ตรวจสอบ</div>
          </div>
        </div>
      </div>

      {activeTab === 'treasury' && (
          <>
          <style>{`
            @media (max-width: 1023px) {
              #mobile-bottom-nav { display: none !important; }
              main { padding-bottom: 0 !important; }
            }
          `}</style>
          <div className="-mx-6 -mt-6 md:mx-0 md:mt-0 flex flex-col min-h-[calc(100vh-140px)] md:min-h-0 bg-white md:bg-transparent">
            <h2 className="hidden md:flex text-xl font-bold text-slate-800 items-center gap-2 mb-4">
              <Landmark className="text-emerald-600" /> บริหารเงินทุน และ ปันผล
            </h2>
            
            <div className="max-w-md w-full mx-auto bg-white md:rounded-[32px] md:border border-slate-200 md:shadow-xl overflow-hidden relative">
              {/* Header Gradient */}
              <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-8 pb-10 text-center relative overflow-hidden">
                <button 
                  onClick={() => setActiveTab('overview')}
                  className="md:hidden absolute top-4 left-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur-sm transition-all z-20"
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="absolute top-0 right-0 p-4 opacity-30 pointer-events-none"><Landmark size={100} className="text-white transform translate-x-4 -translate-y-4 rotate-12" /></div>
                <h3 className="text-white/80 font-bold mb-2">ระบุยอดเงิน (บาท)</h3>
                <div className="flex items-center justify-center text-white">
                  <span className="text-3xl font-bold mr-2 opacity-80">฿</span>
                  <input 
                    type="number" 
                    value={treasuryForm.amount} 
                    onChange={e => setTreasuryForm({...treasuryForm, amount: e.target.value})} 
                    placeholder="0" 
                    className="bg-transparent border-none outline-none text-6xl font-black text-center w-full max-w-[250px] placeholder:text-white/30 text-white z-10" 
                  />
                </div>
              </div>

              {/* Form Body */}
              <div className="p-6 md:p-8 bg-white rounded-t-[32px] -mt-6 relative z-10 space-y-6 pb-32">
                 
                 {/* Summary Section */}
                 <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                    <button 
                       onClick={() => setIsTreasurySummaryOpen(!isTreasurySummaryOpen)}
                       className="w-full font-bold text-slate-700 flex items-center justify-between p-4 hover:bg-slate-100 transition-colors"
                    >
                       <div className="flex items-center gap-2">
                          <Landmark size={18} className="text-emerald-500"/> สรุปสถานะทางการเงิน (ทั้งหมด)
                       </div>
                       {isTreasurySummaryOpen ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                    </button>
                    
                    {isTreasurySummaryOpen && (
                       <div className="p-4 pt-0 space-y-4 border-t border-slate-200 mt-2">
                       {(() => {
                          let totalCapital = 0, totalLoans = 0, repayLoans = 0, totalDividends = 0, totalWithdrawals = 0, totalBanks = 0, totalAssets = 0, totalGold = 0, totalCash = 0;
                          let bankAccounts = {};
                          expenses.forEach(e => {
                          if (e.type === 'treasury' || ['เงินทุนตั้งต้น', 'รับเงินกู้ยืม', 'จ่ายคืนเงินกู้', 'จ่ายเงินปันผล', 'ถอนเงินส่วนตัว', 'บัญชีธนาคาร', 'ทรัพย์สินอื่นๆ', 'ทองคำ', 'เงินสด'].includes(e.category)) {
                             const amt = parseNumber(e.amount);
                             if (e.category === 'เงินทุนตั้งต้น') totalCapital += amt;
                             else if (e.category === 'รับเงินกู้ยืม') totalLoans += amt;
                             else if (e.category === 'จ่ายคืนเงินกู้') repayLoans += amt;
                             else if (e.category === 'จ่ายเงินปันผล') totalDividends += amt;
                             else if (e.category === 'ถอนเงินส่วนตัว') totalWithdrawals += amt;
                             else if (e.category === 'บัญชีธนาคาร') {
                                totalBanks += amt;
                                const bankKey = `${e.bankAccountName || 'ไม่ระบุชื่อบัญชี'} - ${e.bankName || 'ไม่ระบุธนาคาร'}`;
                                bankAccounts[bankKey] = (bankAccounts[bankKey] || 0) + amt;
                             }
                             else if (e.category === 'ทรัพย์สินอื่นๆ') totalAssets += amt;
                             else if (e.category === 'ทองคำ') totalGold += amt;
                             else if (e.category === 'เงินสด') totalCash += amt;
                          }
                       });
                       
                       return (
                          <>
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600 font-medium flex items-center gap-1 cursor-pointer hover:text-emerald-700 transition-colors" onClick={() => setShowTreasuryHistory('เงินทุนตั้งต้น')}>
                                   เงินทุนตั้งต้น <Eye size={14} className="opacity-50" />
                                </span>
                                <span className="font-bold text-emerald-600">฿{totalCapital.toLocaleString()}</span>
                             </div>
                             <div className="flex flex-col gap-1 border-t border-slate-200 pt-2 pb-1">
                                <div className="flex justify-between items-center text-sm">
                                   <span className="text-slate-600 font-medium flex items-center gap-1 cursor-pointer hover:text-cyan-700 transition-colors" onClick={() => setShowTreasuryHistory('บัญชีธนาคาร')}>
                                      ยอดเงินฝากธนาคาร <Eye size={14} className="opacity-50" />
                                   </span>
                                   <span className="font-bold text-cyan-600">฿{totalBanks.toLocaleString()}</span>
                                </div>
                                {Object.entries(bankAccounts).map(([key, val]) => (
                                   <div key={key} className="flex justify-between items-center text-xs pl-4 text-slate-500 group">
                                      <span className="flex items-center gap-2">
                                         • {key}
                                         <button 
                                            onClick={async () => {
                                               const [oldAccName, oldBankName] = key.split(' - ');
                                               const actualOldAcc = oldAccName === 'ไม่ระบุชื่อบัญชี' ? '' : oldAccName;
                                               const actualOldBank = oldBankName === 'ไม่ระบุธนาคาร' ? '' : oldBankName;
                                               
                                               showPrompt(`แก้ไขชื่อบัญชี`, actualOldAcc, 'ระบุชื่อบัญชีใหม่...', (newAcc) => {
                                                   if (newAcc === null || newAcc === undefined) return;
                                                   setTimeout(() => {
                                                      showPrompt(`แก้ไขชื่อธนาคาร`, actualOldBank, 'ระบุชื่อธนาคารใหม่...', (newBank) => {
                                                         if (newBank === null || newBank === undefined) return;
                                                         setTimeout(() => {
                                                            showConfirm('ยืนยันการแก้ไข', `เปลี่ยนทุกรายการที่อยู่ในหมวดนี้\nจาก: ${key}\nเป็น: ${newAcc || 'ไม่ระบุชื่อบัญชี'} - ${newBank || 'ไม่ระบุธนาคาร'} ใช่หรือไม่?`, async () => {
                                                  try {
                                                     const batch = expenses.filter(e => e.category === 'บัญชีธนาคาร' && (e.bankAccountName || '') === actualOldAcc && (e.bankName || '') === actualOldBank);
                                                     let promises = [];
                                                     for (let exp of batch) {
                                                        promises.push(updateDoc(doc(db, 'expenses', exp.id), { bankAccountName: newAcc, bankName: newBank }));
                                                     }
                                                     await Promise.all(promises);
                                                     alert('อัปเดตเรียบร้อยแล้ว!');
                                                               } catch (err) {
                                                                  alert('เกิดข้อผิดพลาด: ' + err.message);
                                                               }
                                                            });
                                                         }, 300);
                                                      }, 'text');
                                                   }, 300);
                                                }, 'text');
                                             }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500 hover:text-indigo-700 bg-indigo-50 p-1 rounded"
                                            title="แก้ไขชื่อบัญชีทั้งหมดในหมวดนี้"
                                         >
                                            <Edit2 size={10} />
                                         </button>
                                      </span>
                                      <span className="font-semibold">฿{val.toLocaleString()}</span>
                                   </div>
                                ))}
                             </div>
                             <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-2">
                                <span className="text-slate-600 font-medium flex items-center gap-1 cursor-pointer hover:text-green-700 transition-colors" onClick={() => setShowTreasuryHistory('เงินสด')}>
                                   ยอดเงินสด <Eye size={14} className="opacity-50" />
                                </span>
                                <span className="font-bold text-green-600">฿{totalCash.toLocaleString()}</span>
                             </div>
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600 font-medium flex items-center gap-1 cursor-pointer hover:text-yellow-700 transition-colors" onClick={() => setShowTreasuryHistory('ทองคำ')}>
                                   มูลค่าทองคำ <Eye size={14} className="opacity-50" />
                                </span>
                                <span className="font-bold text-yellow-600">฿{totalGold.toLocaleString()}</span>
                             </div>
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600 font-medium flex items-center gap-1 cursor-pointer hover:text-orange-700 transition-colors" onClick={() => setShowTreasuryHistory('ทรัพย์สินอื่นๆ')}>
                                   มูลค่าทรัพย์สินอื่นๆ <Eye size={14} className="opacity-50" />
                                </span>
                                <span className="font-bold text-orange-600">฿{totalAssets.toLocaleString()}</span>
                             </div>
                             <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-2">
                                <span className="text-slate-600 font-medium flex items-center gap-1 cursor-pointer hover:text-amber-700 transition-colors" onClick={() => setShowTreasuryHistory('รับเงินกู้ยืม')}>
                                   หนี้สิน (กู้มา - คืนแล้ว) <Eye size={14} className="opacity-50" />
                                </span>
                                <span className="font-bold text-amber-600">฿{(totalLoans - repayLoans).toLocaleString()}</span>
                             </div>
                             <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-2">
                                <span className="text-slate-600 font-medium flex items-center gap-1 cursor-pointer hover:text-blue-700 transition-colors" onClick={() => setShowTreasuryHistory('จ่ายเงินปันผล')}>
                                   จ่ายปันผลสะสม <Eye size={14} className="opacity-50" />
                                </span>
                                <span className="font-bold text-blue-600">฿{totalDividends.toLocaleString()}</span>
                             </div>
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600 font-medium flex items-center gap-1 cursor-pointer hover:text-purple-700 transition-colors" onClick={() => setShowTreasuryHistory('ถอนเงินส่วนตัว')}>
                                   ถอนใช้ส่วนตัว <Eye size={14} className="opacity-50" />
                                </span>
                                <span className="font-bold text-purple-600">฿{totalWithdrawals.toLocaleString()}</span>
                             </div>
                          </>
                       );
                    })()}
                       </div>
                    )}
                 </div>

                 {/* Category Grid */}
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">เลือกหมวดหมู่รายการ</label>
                    <div className="grid grid-cols-3 gap-3">
                       {['เงินทุนตั้งต้น', 'รับเงินกู้ยืม', 'จ่ายคืนเงินกู้', 'จ่ายเงินปันผล', 'ถอนเงินส่วนตัว', 'บัญชีธนาคาร', 'เงินสด', 'ทองคำ', 'ทรัพย์สินอื่นๆ'].map(c => {
                          let icon = <MoreHorizontal size={16}/>;
                          let color = 'text-slate-600 bg-slate-100';
                          if (c.includes('ทุนตั้งต้น')) { icon = <Landmark size={16}/>; color = 'text-emerald-600 bg-emerald-100'; }
                          else if (c.includes('รับเงินกู้ยืม')) { icon = <ArrowDownToLine size={16}/>; color = 'text-amber-600 bg-amber-100'; }
                          else if (c.includes('จ่ายคืนเงินกู้')) { icon = <ArrowUpFromLine size={16}/>; color = 'text-rose-600 bg-rose-100'; }
                          else if (c.includes('ปันผล')) { icon = <PieChart size={16}/>; color = 'text-blue-600 bg-blue-100'; }
                          else if (c.includes('ถอนเงิน')) { icon = <CreditCard size={16}/>; color = 'text-purple-600 bg-purple-100'; }
                          else if (c.includes('บัญชีธนาคาร')) { icon = <Building size={16}/>; color = 'text-cyan-600 bg-cyan-100'; }
                          else if (c.includes('เงินสด')) { icon = <Banknote size={16}/>; color = 'text-green-600 bg-green-100'; }
                          else if (c.includes('ทองคำ')) { icon = <Coins size={16}/>; color = 'text-yellow-600 bg-yellow-100'; }
                          else if (c.includes('ทรัพย์สิน')) { icon = <Store size={16}/>; color = 'text-orange-600 bg-orange-100'; }
                          
                          const isSelected = treasuryForm.category === c;
                          return (
                            <button 
                               key={c}
                               onClick={() => setTreasuryForm({...treasuryForm, category: c})}
                               className={`flex flex-col items-center justify-start p-2 rounded-2xl border-2 transition-all ${isSelected ? 'border-teal-500 bg-teal-50 shadow-md scale-105' : 'border-transparent bg-slate-50 hover:bg-slate-100'}`}
                               title={c}
                            >
                               <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 shrink-0 ${isSelected ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/40' : color}`}>{icon}</div>
                               <span className={`text-[9px] font-bold text-center leading-tight ${isSelected ? 'text-teal-700' : 'text-slate-500'}`}>{c}</span>
                            </button>
                          );
                       })}
                    </div>
                 </div>

                 {/* Filters Row */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                       <label className="block text-[10px] font-bold text-slate-400 mb-1">วันที่ทำรายการ</label>
                       <input 
                         type="date" 
                         value={treasuryForm.date} 
                         onChange={e => setTreasuryForm({...treasuryForm, date: e.target.value})}
                         className="w-full bg-transparent border-none outline-none font-bold text-slate-700 text-sm"
                       />
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                       <label className="block text-[10px] font-bold text-slate-400 mb-1">สาขา</label>
                       <select 
                         value={treasuryForm.branch} 
                         onChange={e => setTreasuryForm({...treasuryForm, branch: e.target.value})}
                         className="w-full bg-transparent border-none outline-none font-bold text-slate-700 text-sm"
                       >
                         {branchOptions.map(b => <option key={b} value={b}>{b}</option>)}
                       </select>
                    </div>
                 </div>

                 {treasuryForm.category === 'บัญชีธนาคาร' && (
                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">ชื่อบัญชี</label>
                          <input 
                            type="text" 
                            value={treasuryForm.bankAccountName || ''} 
                            onChange={e => setTreasuryForm({...treasuryForm, bankAccountName: e.target.value})}
                            placeholder="เช่น บจก. ไอริส"
                            className="w-full bg-transparent border-none outline-none font-bold text-slate-700 text-sm"
                          />
                       </div>
                       <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">ธนาคาร</label>
                          <input 
                            type="text" 
                            value={treasuryForm.bankName || ''} 
                            onChange={e => setTreasuryForm({...treasuryForm, bankName: e.target.value})}
                            placeholder="เช่น กสิกรไทย"
                            className="w-full bg-transparent border-none outline-none font-bold text-slate-700 text-sm"
                          />
                       </div>
                    </div>
                 )}

                 <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">รายละเอียดเพิ่มเติม</label>
                    <input 
                      type="text" 
                      value={treasuryForm.note} 
                      onChange={e => setTreasuryForm({...treasuryForm, note: e.target.value})}
                      placeholder="หมายเหตุเพิ่มเติม..."
                      className="w-full bg-transparent border-none outline-none font-medium text-slate-700 text-sm"
                    />
                 </div>

                 <div className="fixed md:sticky bottom-0 left-0 right-0 p-4 md:p-0 md:bottom-6 z-50 md:mt-8 bg-white md:bg-transparent border-t md:border-none border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] md:shadow-none">
                   <button 
                     onClick={async () => {
                       const amt = parseNumber(treasuryForm.amount);
                       if (amt <= 0) return alert('กรุณาระบุจำนวนเงิน');
                       if (!window.confirm(`ยืนยันการบันทึกรายการ: ${treasuryForm.category} จำนวน ฿${amt.toLocaleString()} ?`)) return;
                       
                       try {
                          const newRef = doc(collection(db, 'expenses'));
                          await setDoc(newRef, {
                             date: treasuryForm.date,
                             category: treasuryForm.category,
                             amount: amt,
                             note: treasuryForm.note,
                             branch: treasuryForm.branch,
                             bankAccountName: treasuryForm.bankAccountName || '',
                             bankName: treasuryForm.bankName || '',
                             type: 'treasury',
                             createdAt: serverTimestamp()
                          });
                          alert('บันทึกรายการสำเร็จ!');
                          setTreasuryForm({...treasuryForm, amount: '', note: ''});
                       } catch (err) {
                          console.error(err);
                          alert('เกิดข้อผิดพลาด: ' + err.message);
                       }
                     }}
                     className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-lg py-4 rounded-2xl shadow-[0_10px_40px_rgba(13,148,136,0.4)] transition-colors"
                   >
                     บันทึกรายการ
                   </button>
                 </div>
                 
                 

              </div>
            </div>
          </div>
          </>
      )}

      {/* Treasury History Modal */}
      {showTreasuryHistory && (
         <ModalWrapper isOpen={true} onClose={() => setShowTreasuryHistory(null)} title={`ประวัติรายการ: ${showTreasuryHistory}`} icon={HistoryIcon}>
            <div className="max-h-[60vh] overflow-y-auto -mx-4 px-4 space-y-3 pb-4">
               {expenses
                  .filter(e => {
                     if (showTreasuryHistory === 'รับเงินกู้ยืม') return e.category === 'รับเงินกู้ยืม' || e.category === 'จ่ายคืนเงินกู้';
                     return e.category === showTreasuryHistory;
                  })
                  .sort((a,b) => new Date(b.createdAt?.seconds ? b.createdAt.toDate() : b.date) - new Date(a.createdAt?.seconds ? a.createdAt.toDate() : a.date))
                  .map((e, idx) => (
                     <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col gap-2 relative">
                        <div className="flex justify-between items-start">
                           <div>
                              <div className="font-bold text-slate-800">{e.category}</div>
                              {e.category === 'บัญชีธนาคาร' && (
                                 editingTreasuryId === e.id ? (
                                    <div className="mt-2 flex flex-col gap-2">
                                        <input type="text" value={editTreasuryForm.bankAccountName || ''} onChange={ev => setEditTreasuryForm({...editTreasuryForm, bankAccountName: ev.target.value})} placeholder="ชื่อบัญชี" className="border border-slate-300 rounded px-2 py-1 text-xs" />
                                        <input type="text" value={editTreasuryForm.bankName || ''} onChange={ev => setEditTreasuryForm({...editTreasuryForm, bankName: ev.target.value})} placeholder="ธนาคาร" className="border border-slate-300 rounded px-2 py-1 text-xs" />
                                        <div className="flex gap-2">
                                            <button onClick={async () => {
                                                try {
                                                    await updateDoc(doc(db, 'expenses', e.id), { bankAccountName: editTreasuryForm.bankAccountName || '', bankName: editTreasuryForm.bankName || '' });
                                                    setEditingTreasuryId(null);
                                                } catch(err) { alert('Save failed: ' + err.message); }
                                            }} className="bg-emerald-500 text-white px-3 py-1 rounded text-xs font-bold">บันทึก</button>
                                            <button onClick={() => setEditingTreasuryId(null)} className="bg-slate-200 text-slate-600 px-3 py-1 rounded text-xs font-bold">ยกเลิก</button>
                                        </div>
                                    </div>
                                 ) : (
                                    <div className="text-xs font-semibold text-cyan-600 mt-0.5 flex items-center gap-2">
                                       {e.bankAccountName || 'ไม่ระบุชื่อบัญชี'} {e.bankName ? `(${e.bankName})` : '(ไม่ระบุธนาคาร)'}
                                       <button onClick={() => { setEditingTreasuryId(e.id); setEditTreasuryForm({ bankAccountName: e.bankAccountName, bankName: e.bankName }); }} className="text-slate-400 hover:text-indigo-600 bg-white p-1 rounded border border-slate-200" title="แก้ไขชื่อบัญชี"><Edit2 size={12} /></button>
                                    </div>
                                 )
                              )}
                              <div className="text-xs text-slate-500 mt-0.5">{e.date} • {e.branch}</div>
                           </div>
                           <div className={`font-black text-lg flex items-center gap-2 justify-end ${e.category.includes('จ่าย') || e.category.includes('ถอน') ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {e.category.includes('จ่าย') || e.category.includes('ถอน') ? '-' : '+'}฿{parseNumber(e.amount).toLocaleString()}
                              <button 
                                onClick={async () => {
                                  showPrompt('แก้ไขยอดเงิน', parseNumber(e.amount), 'ระบุยอดเงินใหม่...', (newAmtStr) => {
                                      if (newAmtStr === null || newAmtStr === undefined) return;
                                      const newAmt = parseNumber(newAmtStr);
                                      if (newAmt <= 0) { alert('กรุณาระบุยอดเงินให้ถูกต้อง'); return; }
                                      setTimeout(() => {
                                         showConfirm('ยืนยันการแก้ไข', `ยืนยันการแก้ไขยอดเงินเป็น ฿${newAmt.toLocaleString()} ใช่หรือไม่?`, async () => {
                                            try {
                                               await updateDoc(doc(db, 'expenses', e.id), { amount: newAmt });
                                            } catch (err) { alert('เกิดข้อผิดพลาด: ' + err.message); }
                                         });
                                      }, 300);
                                   }, 'number');
                                }}
                                className="text-slate-300 hover:text-indigo-500 bg-white p-1.5 rounded-lg border border-slate-200 transition-colors shadow-sm"
                                title="แก้ไขยอดเงิน"
                              >
                                <Edit2 size={12} />
                              </button>
                           </div>
                        </div>
                        {e.note && (
                           <div className="text-sm bg-white p-2 rounded-lg border border-slate-100 text-slate-600 mt-1">
                              {e.note}
                           </div>
                        )}
                        <button 
                           onClick={() => {
                              showConfirm('ลบรายการ', 'คุณต้องการลบรายการนี้ใช่หรือไม่? ยอดจะถูกดึงกลับทันที', async () => {
                                 try {
                                    await deleteDoc(doc(db, 'expenses', e.id));
                                 } catch(err) {
                                    console.error(err);
                                    alert('ไม่สามารถลบรายการได้');
                                 }
                              });
                           }}
                           className="absolute top-4 right-4 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 w-8 h-8 rounded-full flex items-center justify-center border border-slate-200 transition-colors opacity-0 md:opacity-100 group-hover:opacity-100"
                           title="ลบรายการ"
                        >
                           <Trash2 size={14} />
                        </button>
                     </div>
                  ))}
               {expenses.filter(e => {
                  if (showTreasuryHistory === 'รับเงินกู้ยืม') return e.category === 'รับเงินกู้ยืม' || e.category === 'จ่ายคืนเงินกู้';
                  return e.category === showTreasuryHistory;
               }).length === 0 && (
                  <div className="text-center py-10 text-slate-400">
                     <HistoryIcon size={40} className="mx-auto mb-3 opacity-20" />
                     ไม่มีประวัติรายการ
                  </div>
               )}
            </div>
         </ModalWrapper>
      )}

      <ModalWrapper isOpen={showDepositModal} onClose={() => setShowDepositModal(false)} title="สรุปยอดนำฝาก (EOD)" icon={Wallet} noMaxHeight={true}>
        <div className="max-h-[70vh] overflow-y-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 sticky top-0 shadow-sm z-10">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">วันที่ (ส่งยอด)</th>
                <th className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">สาขา</th>
                <th className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap text-right">ยอดนำฝาก</th>
                <th className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.depositDetails && stats.depositDetails.length > 0 ? (
                stats.depositDetails.map((d, i) => (
                  <tr key={i} className={`transition-colors ${d.isEstimated ? 'bg-amber-50/30' : 'hover:bg-slate-50/50'}`}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {d.date}
                        {d.isEstimated && <span className="bg-amber-200 text-amber-800 text-[9px] px-1.5 py-0.5 rounded" title="ประเมินจากยอดขาย (ยังไม่ส่ง EOD)">ประเมิน</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{d.branch}</td>
                    <td className="px-4 py-3 text-right font-black text-blue-700 whitespace-nowrap">
                      ฿{d.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center justify-center gap-1">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                            d.status === 'อนุมัติแล้ว' || d.status === 'รับเงินแล้ว' || d.status === 'ยืนยันแล้ว'
                              ? 'bg-emerald-100 text-emerald-700' 
                              : d.isEstimated ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {d.status}
                          </span>
                          {!d.isEstimated && (
                              <button 
                                onClick={() => {
                                  setShowDepositModal(false);
                                  const dateStr = getLocalDateStr(d.createdAt);
                                  setFilterDate(dateStr);
                                  setActiveTab('verifications');
                                }} 
                                className="text-[10px] text-indigo-600 underline hover:text-indigo-800"
                              >
                                ตรวจรับ
                              </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-slate-400">ไม่มีข้อมูลยอดนำฝากในช่วงเวลานี้</td>
                </tr>
              )}
            </tbody>
            {stats.depositDetails && stats.depositDetails.length > 0 && (
              <tfoot className="bg-slate-50 font-bold sticky bottom-0 shadow-[0_-1px_2px_rgba(0,0,0,0.05)]">
                <tr>
                  <td colSpan="2" className="px-4 py-3 text-right">รวมทั้งหมด</td>
                  <td className="px-4 py-3 text-right text-blue-800 text-lg">฿{stats.totalDeposit.toLocaleString()}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </ModalWrapper>

      <ModalWrapper 
        isOpen={!!selectedExpenseCategory} 
        onClose={() => setSelectedExpenseCategory(null)} 
        title={`รายละเอียด: ${selectedExpenseCategory?.category}`} 
        icon={ListChecks} 
        noMaxHeight={true}
      >
        <div className="max-h-[70vh] overflow-y-auto">
          <div className="mb-4 flex items-center justify-between text-sm">
            <span className="font-bold text-slate-700">สาขา: <span className="text-indigo-600">{selectedExpenseCategory?.branch}</span></span>
          </div>
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 sticky top-0 shadow-sm z-10">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-700">วันที่</th>
                <th className="px-4 py-3 font-semibold text-slate-700">รายละเอียด</th>
                <th className="px-4 py-3 font-semibold text-slate-700 text-right">จำนวนเงิน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.filter(e => {
                if (!selectedExpenseCategory || !e.date) return false;
                const d = new Date(e.date);
                const now = new Date();
                const isCurrentMonth = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                return isCurrentMonth && (e.branch || 'ไม่ระบุ') === selectedExpenseCategory.branch && e.category === selectedExpenseCategory.category;
              }).sort((a,b) => new Date(b.date) - new Date(a.date)).map(e => {
                let poOrder = null;
                let extractedOrderNo = null;
                const isAuto = e.note && e.note.includes('[อัตโนมัติ]');
                
                // รองรับรูปแบบ (เลขอ้างอิง: POxxx) และ เลี่ยงเคสที่ไม่เจอใน orders
                if (e.note && e.note.includes('เลขอ้างอิง:')) {
                  const match = e.note.match(/เลขอ้างอิง:\s*([^)]+)/);
                  if (match && match[1]) {
                    extractedOrderNo = match[1].trim();
                    poOrder = orders.find(o => o.orderNo === extractedOrderNo);
                  }
                } else if (isAuto) {
                  // Fallback for legacy test data that doesn't have orderNo in the note
                  poOrder = orders.find(o => 
                    (o.transactionType === 'branch_requisition' || o.transactionType === 'owner_purchase' || (o.note || '').includes('[อัตโนมัติ]')) &&
                    o.price === e.amount && 
                    new Date(o.createdAt).toLocaleDateString('th-TH') === new Date(e.date).toLocaleDateString('th-TH')
                  );
                  if (poOrder) {
                    extractedOrderNo = poOrder.orderNo;
                  }
                }
                
                return (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">{new Date(e.date).toLocaleDateString('th-TH')}</td>
                    <td className="px-4 py-3 max-w-[200px] truncate" title={e.note}>
                      {e.note || '-'}
                      {e.receiptUrl && (
                        <a href={e.receiptUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-indigo-600 hover:text-indigo-700 font-bold ml-2 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 transition-colors">
                          <ImageIcon size={10} /> รูป
                        </a>
                      )}
                      {(extractedOrderNo || isAuto) && (
                        <button 
                          onClick={() => setViewingPO(poOrder || { orderNo: extractedOrderNo || 'ไม่ระบุ', notFound: true, createdAt: e.date, customerName: e.branch, cart: [] })} 
                          className="inline-flex items-center gap-1 text-[10px] text-teal-600 hover:text-teal-700 font-bold ml-2 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100 transition-colors"
                        >
                          <ListChecks size={10} /> ดูใบเบิก
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-slate-700">฿{(e.amount || 0).toLocaleString()}</td>
                  </tr>
                );
              })}
              {expenses.filter(e => {
                if (!selectedExpenseCategory || !e.date) return false;
                const d = new Date(e.date);
                const now = new Date();
                const isCurrentMonth = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                return isCurrentMonth && (e.branch || 'ไม่ระบุ') === selectedExpenseCategory.branch && e.category === selectedExpenseCategory.category;
              }).length === 0 && (
                <tr>
                  <td colSpan="3" className="text-center py-8 text-slate-400">ไม่มีข้อมูล</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ModalWrapper>

      <ModalWrapper 
        isOpen={!!viewingPO} 
        onClose={() => setViewingPO(null)} 
        title={`รายละเอียดใบสั่งซื้อ/เบิก: ${viewingPO?.orderNo}`} 
        icon={FileText} 
        noMaxHeight={true}
      >
        <div className="max-h-[70vh] overflow-y-auto">
          {viewingPO && (
            <div className="text-sm">
              <div className="mb-4 grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <p className="text-xs text-slate-500 font-bold mb-1">วันที่ทำรายการ</p>
                  <p className="font-medium text-slate-800">{new Date(viewingPO.createdAt).toLocaleString('th-TH')}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold mb-1">สาขาที่ขอเบิก</p>
                  <p className="font-medium text-slate-800">{viewingPO.customerName || viewingPO.branch || '-'}</p>
                </div>
              </div>

              <h4 className="font-bold text-slate-700 mb-2">รายการสินค้า</h4>
              {viewingPO.notFound ? (
                <div className="bg-orange-50 text-orange-600 p-4 rounded-xl text-center font-bold">
                  ไม่สามารถโหลดรายละเอียดของใบเบิกนี้ได้ (อาจถูกลบไปแล้วหรือไม่อยู่ในระบบปัจจุบัน)
                </div>
              ) : (
                <table className="w-full text-left border-collapse mb-4">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-3 py-2 font-semibold text-slate-600">รายการ</th>
                      <th className="px-3 py-2 font-semibold text-slate-600 text-center">จำนวน</th>
                      <th className="px-3 py-2 font-semibold text-slate-600 text-right">รวม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 border-b border-slate-100">
                    {(viewingPO.cart || []).map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2">
                          <p className="font-medium text-slate-800">{item.name}</p>
                          {item.price > 0 && <p className="text-[10px] text-slate-500">@{item.price.toLocaleString()}</p>}
                        </td>
                        <td className="px-3 py-2 text-center text-slate-600">{item.qty}</td>
                        <td className="px-3 py-2 text-right font-medium text-slate-800">฿{(item.price * item.qty).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="2" className="px-3 py-3 text-right font-bold text-slate-600">มูลค่ารวม (ต้นทุน)</td>
                      <td className="px-3 py-3 text-right font-black text-rose-600">฿{(viewingPO.price || 0).toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          )}
        </div>
      </ModalWrapper>
      <ModalWrapper 
        isOpen={showSimulatorModal} 
        onClose={() => setShowSimulatorModal(false)} 
        title="ทดลองคำนวณยอดเป้าหมาย (Simulator)" 
        icon={Calculator}
      >
        <div className="p-2 space-y-4">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
               onClick={() => setSimMode('profit')} 
               className={`flex-1 text-xs font-bold py-2 rounded-lg transition-colors ${simMode === 'profit' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
               ตั้งยอดขาย ➔ หากำไร
            </button>
            <button 
               onClick={() => setSimMode('target')} 
               className={`flex-1 text-xs font-bold py-2 rounded-lg transition-colors ${simMode === 'target' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
               ตั้งกำไร ➔ หายอดขาย
            </button>
          </div>
          
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <label className="block text-xs font-bold text-slate-700 mb-1">รายจ่ายต่อเดือน (OPEX) บาท</label>
            <input type="number" value={simOpex} onChange={(e) => setSimOpex(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-base font-bold" />
          </div>
          
          {simMode === 'profit' ? (
             <div className="space-y-4">
               <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="block text-xs font-bold text-indigo-600 mb-1">ยอดขายคอร์สจำลอง</label>
                    <input type="number" value={simCourseSales} onChange={(e) => setSimCourseSales(e.target.value)} className="w-full border border-indigo-200 bg-indigo-50 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-sm font-bold text-indigo-700" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">ต้นทุนคอร์ส (%)</label>
                    <input type="number" value={simCourseCostPct} onChange={(e) => setSimCourseCostPct(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-sm font-bold" />
                 </div>
                 
                 <div>
                    <label className="block text-xs font-bold text-teal-600 mb-1">ยอดขายสินค้าจำลอง</label>
                    <input type="number" value={simProductSales} onChange={(e) => setSimProductSales(e.target.value)} className="w-full border border-teal-200 bg-teal-50 rounded-xl px-3 py-2 outline-none focus:border-teal-500 text-sm font-bold text-teal-700" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">ต้นทุนสินค้า (%)</label>
                    <input type="number" value={simProductCostPct} onChange={(e) => setSimProductCostPct(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-sm font-bold" />
                 </div>
               </div>
               
               {(() => {
                  const cs = parseFloat(simCourseSales || 0);
                  const ps = parseFloat(simProductSales || 0);
                  const cc = cs * (parseFloat(simCourseCostPct || 0) / 100);
                  const pc = ps * (parseFloat(simProductCostPct || 0) / 100);
                  const o = parseFloat(simOpex || 0);
                  const totalSales = cs + ps;
                  const totalCogs = cc + pc;
                  const grossProfit = totalSales - totalCogs;
                  const netProfit = grossProfit - o;
                  
                  return (
                    <div className="mt-4 p-4 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl space-y-3 shadow-sm">
                       <div className="flex justify-between items-center text-sm">
                         <span className="text-slate-600 font-medium">ยอดขายรวม</span>
                         <span className="font-bold">฿{totalSales.toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between items-center text-sm">
                         <span className="text-slate-600 font-medium">ต้นทุนรวม (COGS)</span>
                         <span className="font-bold text-rose-500">- ฿{totalCogs.toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between items-center text-sm">
                         <span className="text-slate-600 font-medium">กำไรขั้นต้น (Gross Profit)</span>
                         <span className="font-bold text-indigo-600">฿{grossProfit.toLocaleString()} ({(totalSales > 0 ? (grossProfit/totalSales)*100 : 0).toFixed(1)}%)</span>
                       </div>
                       <div className="border-t border-indigo-100 pt-3 flex justify-between items-center">
                         <span className="font-bold text-indigo-900">กำไรสุทธิคาดการณ์</span>
                         <span className={`text-2xl font-black ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                           {netProfit >= 0 ? '' : '-'}฿{Math.abs(netProfit).toLocaleString(undefined, {maximumFractionDigits:0})}
                         </span>
                       </div>
                    </div>
                  );
               })()}
             </div>
          ) : (
             <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">อัตรากำไรขั้นต้น (Gross Margin) เฉลี่ย %</label>
                  <input type="number" value={simMargin} onChange={(e) => setSimMargin(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-lg font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-indigo-600 mb-1">เป้าหมายกำไรสุทธิ (บาท)</label>
                  <input type="number" value={simTargetProfit} onChange={(e) => setSimTargetProfit(e.target.value)} className="w-full border-2 border-indigo-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-lg font-black text-indigo-700 bg-indigo-50" />
                </div>
                
                {(() => {
                   const m = parseFloat(simMargin) / 100;
                   const o = parseFloat(simOpex || 0);
                   const t = parseFloat(simTargetProfit || 0);
                   const breakEven = m > 0 ? o / m : 0;
                   const reqSales = m > 0 ? (o + t) / m : 0;
                   return (
                      <div className="mt-4 space-y-3">
                         <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex justify-between items-center">
                           <span className="text-sm font-bold text-emerald-600">ยอดขายเพื่อคุ้มทุน</span>
                           <span className="text-xl font-black text-emerald-700">฿{breakEven.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                         </div>
                         <div className="bg-indigo-600 text-white p-4 rounded-xl flex justify-between items-center">
                           <span className="text-sm font-medium">ยอดขายเพื่อให้ได้เป้า</span>
                           <span className="text-2xl font-black">฿{reqSales.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                         </div>
                      </div>
                   );
                })()}
             </div>
          )}
        </div>
      </ModalWrapper>
    </div>
  );
}
