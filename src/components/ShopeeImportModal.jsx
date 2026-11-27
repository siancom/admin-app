import React, { useState, useRef, useMemo } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Loader2, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import { writeBatch, doc, collection } from 'firebase/firestore';
import { db, getCol } from '../config/firebase';
import { getFuzzyKey } from '../utils/fuzzy';
import { getBranchStock } from '../utils/parse';

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

/**
 * คำนวณวันสิ้นเดือนของแต่ละออเดอร์ Shopee โดยอัตโนมัติ
 * 1) อ่านจากคอลัมน์วันที่สั่งซื้อ/ชำระเงินในไฟล์
 * 2) Fallback: ดึงจากรหัสออเดอร์ Shopee ซึ่งขึ้นต้นด้วย YYMMDD (เช่น 2611015XCHT94R -> 26=2026, 11=พ.ย., 01=วันที่ 1)
 * 3) หา วันสิ้นเดือน ของเดือนนั้นๆ (เช่น 30/11/2569 เวลา 23:59 น.)
 */
export function getShopeeOrderEndOfMonth(rawDateVal, orderId) {
  let y = null;
  let m = null; // 1-12

  // 1. ลองถอดรหัสจากคอลัมน์วันที่ในไฟล์
  if (rawDateVal !== undefined && rawDateVal !== null && rawDateVal !== '') {
    if (typeof rawDateVal === 'number') {
      // Excel serial date number
      const d = new Date(Math.round((rawDateVal - 25569) * 86400 * 1000));
      if (!isNaN(d.getTime())) {
        y = d.getUTCFullYear();
        m = d.getUTCMonth() + 1;
      }
    } else if (typeof rawDateVal === 'string') {
      const s = rawDateVal.trim();
      const mIso = s.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
      if (mIso) {
        let yr = parseInt(mIso[1], 10);
        if (yr > 2500) yr -= 543;
        y = yr;
        m = parseInt(mIso[2], 10);
      } else {
        const mSlash = s.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})/);
        if (mSlash) {
          let yr = parseInt(mSlash[3], 10);
          if (yr < 100) yr += 2000;
          else if (yr > 2500) yr -= 543;
          y = yr;
          m = parseInt(mSlash[2], 10);
        }
      }
    }
  }

  // 2. Fallback: ดึงจากรูปแบบรหัสคำสั่งซื้อ Shopee (YYMMDD...)
  // ตัวอย่าง: "2611015XCHT94R" -> 26 = 2026, 11 = Nov, 01 = Day 1
  if (!y || !m || m < 1 || m > 12) {
    if (orderId && typeof orderId === 'string') {
      const mId = orderId.trim().match(/^(\d{2})(\d{2})(\d{2})/);
      if (mId) {
        const yearPart = parseInt(mId[1], 10);
        const monthPart = parseInt(mId[2], 10);
        const dayPart = parseInt(mId[3], 10);
        if (yearPart >= 20 && yearPart <= 35 && monthPart >= 1 && monthPart <= 12 && dayPart >= 1 && dayPart <= 31) {
          y = 2000 + yearPart;
          m = monthPart;
        }
      }
    }
  }

  // 3. Fallback สุดท้าย: ใช้ปีและเดือนปัจจุบัน
  if (!y || !m || m < 1 || m > 12) {
    const now = new Date();
    y = now.getFullYear();
    m = now.getMonth() + 1;
  }

  // คำนวณวันสิ้นเดือน (วันสุดท้ายของเดือน)
  const lastDayDate = new Date(y, m, 0);
  const lastDay = lastDayDate.getDate();
  const padM = String(m).padStart(2, '0');
  const padD = String(lastDay).padStart(2, '0');

  const isoDate = `${y}-${padM}-${padD}`;
  const thaiYear = y + 543;
  const thaiDate = `${padD}/${padM}/${thaiYear}`;
  // กำหนดเวลาเป็น 23:59:00 น. ตามเวลาไทย (UTC+7) -> 16:59:00Z
  const isoDateTime = `${isoDate}T16:59:00.000Z`;

  return {
    year: y,
    month: m,
    lastDay,
    isoDate,
    thaiDate,
    thaiYear,
    isoDateTime,
    displayMonthLabel: `${THAI_MONTHS[m - 1] || padM} ${thaiYear}`
  };
}

export default function ShopeeImportModal({ isOpen, onClose, products, globalBranch, showToast }) {
  const [file, setFile] = useState(null);
  const [parsedOrders, setParsedOrders] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const distinctMonths = useMemo(() => {
    const map = new Map();
    parsedOrders.forEach(o => {
      if (o.endOfMonth) {
        const key = o.endOfMonth.isoDate;
        if (!map.has(key)) {
          map.set(key, { ...o.endOfMonth, count: 1 });
        } else {
          map.get(key).count += 1;
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => a.isoDate.localeCompare(b.isoDate));
  }, [parsedOrders]);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);
    setError(null);
    setParsedOrders([]);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setIsProcessing(true);
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Convert array of arrays
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        if (data.length < 2) {
          setError("ไฟล์ไม่มีข้อมูล");
          setIsProcessing(false);
          return;
        }

        // Find header row (Shopee exports sometimes have empty rows at top)
        let headerRowIndex = 0;
        let headers = [];
        for (let i = 0; i < Math.min(10, data.length); i++) {
          if (data[i] && data[i].length > 5 && data[i].includes('หมายเลขคำสั่งซื้อ')) {
            headerRowIndex = i;
            headers = data[i].map(h => String(h || '').trim());
            break;
          }
        }

        if (headers.length === 0) {
          setError("ไม่พบหัวข้อ 'หมายเลขคำสั่งซื้อ' ในไฟล์ กรุณาตรวจสอบว่าเป็นไฟล์จาก Shopee");
          setIsProcessing(false);
          return;
        }

        const idxOrderId = headers.findIndex(h => h === 'หมายเลขคำสั่งซื้อ');
        const idxStatus = headers.findIndex(h => h.includes('สถานะการสั่งซื้อ') || h === 'สถานะคำสั่งซื้อ');
        const idxSku = headers.findIndex(h => h.includes('เลขอ้างอิง SKU') || h.includes('SKU อ้างอิง'));
        const idxProductName = headers.findIndex(h => h === 'ชื่อสินค้า');
        const idxQty = headers.findIndex(h => h === 'จำนวน');
        const idxPrice = headers.findIndex(h => h === 'ราคาเสนอขาย' || h === 'ราคาขาย' || h === 'ราคาต่อชิ้น');
        const idxCustomerName = headers.findIndex(h => h.includes('ชื่อผู้ใช้ (ผู้ซื้อ)') || h.includes('ชื่อผู้ซื้อ'));
        const idxPhone = headers.findIndex(h => h === 'หมายเลขโทรศัพท์');
        
        // Find Date column (order date, payment time, or creation time)
        const idxDate = headers.findIndex(h => {
          const norm = String(h || '').trim().toLowerCase();
          return (
            norm.includes('เวลาที่ทำการสั่งซื้อ') ||
            norm.includes('เวลาการชำระเงิน') ||
            norm.includes('เวลาที่คำสั่งซื้อเสร็จ') ||
            norm.includes('วันที่สั่งซื้อ') ||
            norm.includes('วันที่ทำการสั่งซื้อ') ||
            norm.includes('order creation') ||
            norm.includes('payment time') ||
            norm.includes('order date') ||
            (norm.startsWith('วันที่') && !norm.includes('ส่ง') && !norm.includes('คืน'))
          );
        });
        
        // Identify all fee columns precisely based on user request
        const feeIndices = headers.map((h, i) => {
           let val = String(h).trim().replace(/^['"]+|['"]+$/g, ''); // Remove leading quotes if any
           let lowerVal = val.toLowerCase();
           
           if (val === 'ค่าคอมมิชชั่น' || lowerVal.includes('ค่าคอมมิชชั่น')) return i;
           if (val === 'Transaction Fee' || lowerVal.includes('transaction fee')) return i;
           if (val === 'ค่าบริการ' || lowerVal.includes('ค่าบริการ')) return i;
           
           return -1;
        }).filter(i => i !== -1);

        const idxNetReceived = headers.findIndex(h => h.includes('ประมาณการรายรับ') || h.includes('ยอดสุทธิ') || h.includes('ยอดเงินที่ได้รับ') || h.includes('ได้รับจริง') || h.includes('รายรับจากคำสั่งซื้อ'));

        const ordersMap = new Map();

        // Process from headerRowIndex + 1 to end
        for (let i = headerRowIndex + 1; i < data.length; i++) {
          const row = data[i];
          if (!row || !row[idxOrderId]) continue;

          const orderId = String(row[idxOrderId] || '').trim();
          const status = String(row[idxStatus] || '').trim();
          
          // Only import successful orders or those that are completely finished
          if (status.includes('ยกเลิก') || status.includes('ไม่สำเร็จ')) continue;

          const sku = String(row[idxSku] || '').trim();
          const productName = String(row[idxProductName] || '').trim();
          const qty = parseInt(row[idxQty]) || 0;
          const price = parseFloat(String(row[idxPrice] || '0').replace(/,/g, '')) || 0;
          const customerName = String(row[idxCustomerName] || '').trim() || 'ลูกค้า Shopee';
          const phone = String(row[idxPhone] || '').trim().replace(/^['"]+|['"]+$/g, '');

          if (qty <= 0) continue;

          // Try to match product by SKU first, then by name
          let matchedProduct = null;
          if (sku) {
            matchedProduct = products.find(p => {
               const pCode = String(getFuzzyKey(p, ["รหัส", "col_1"]) || '').trim();
               return pCode.toLowerCase() === sku.toLowerCase();
            });
          }
          
          if (!matchedProduct && productName) {
             matchedProduct = products.find(p => {
                const pName = String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2"]) || '').trim();
                return pName.toLowerCase() === productName.toLowerCase();
             });
          }

          if (!ordersMap.has(orderId)) {
            let totalFees = 0;
            feeIndices.forEach(idx => {
               const rawVal = String(row[idx] || '0').replace(/[^0-9.-]/g, '');
               totalFees += Math.abs(parseFloat(rawVal) || 0);
            });

            const rawDateVal = idxDate !== -1 ? row[idxDate] : null;
            const endOfMonth = getShopeeOrderEndOfMonth(rawDateVal, orderId);

            ordersMap.set(orderId, {
              orderId,
              customerName,
              phone,
              items: [],
              totalPrice: 0,
              hasUnmatched: false,
              totalFees,
              netReceived: 0,
              rawDateVal: rawDateVal !== null && rawDateVal !== undefined ? String(rawDateVal) : '',
              endOfMonth
            });
          }

          const order = ordersMap.get(orderId);
          
          // Capture rawDateVal and endOfMonth if present in subsequent row
          if (idxDate !== -1 && (!order.rawDateVal || order.rawDateVal === '') && row[idxDate]) {
             order.rawDateVal = String(row[idxDate]);
             order.endOfMonth = getShopeeOrderEndOfMonth(row[idxDate], orderId);
          }
          
          // Capture net received if present in any row
          if (idxNetReceived !== -1 && (!order.netReceived || order.netReceived === 0)) {
             const rawNr = String(row[idxNetReceived] || '0').replace(/[^0-9.-]/g, '');
             const nr = parseFloat(rawNr) || 0;
             if (nr !== 0) order.netReceived = nr;
          }

          order.items.push({
            sku,
            productName,
            qty,
            price,
            matchedProduct
          });
          order.totalPrice += (price * qty);
          if (!matchedProduct) order.hasUnmatched = true;
        }

        const parsedList = Array.from(ordersMap.values()).map(order => {
           // Fallback to manual calculation if netReceived is 0 or wasn't found in columns
           if (!order.netReceived || order.netReceived === 0) {
              order.netReceived = order.totalPrice - order.totalFees;
           }
           return order;
        });

        // -------------------------------------------------------------
        // MATCH WITH POS ORDERS
        // -------------------------------------------------------------
        try {
           const { getDocs, query, orderBy, limit } = await import('firebase/firestore');
           const q = query(getCol('orders'), orderBy('createdAt', 'desc'), limit(1000));
           const snap = await getDocs(q);
           const recentOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
           
           parsedList.forEach(order => {
               const matchedPosOrder = recentOrders.find(o => o.wcOrderId === order.orderId);
               if (matchedPosOrder) {
                   order.posMatched = true;
                   order.posOrderId = matchedPosOrder.id;
                   order.posOrderNo = matchedPosOrder.orderNo;
               } else {
                   order.posMatched = false;
               }
           });
        } catch(e) {
           console.error("Error fetching orders for matching", e);
        }

        setParsedOrders(parsedList);
        setIsProcessing(false);

      } catch (err) {
        console.error(err);
        setError("เกิดข้อผิดพลาดในการอ่านไฟล์ โปรดตรวจสอบรูปแบบไฟล์");
        setIsProcessing(false);
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const handleManualMatch = (orderId, itemIndex, productId) => {
    const selectedProduct = products.find(p => p.id === productId);
    if (!selectedProduct) return;

    setParsedOrders(prev => {
      const newOrders = [...prev];
      const orderIdx = newOrders.findIndex(o => o.orderId === orderId);
      if (orderIdx === -1) return prev;

      const order = { ...newOrders[orderIdx] };
      const items = [...order.items];
      items[itemIndex] = { ...items[itemIndex], matchedProduct: selectedProduct };
      order.items = items;
      
      order.hasUnmatched = items.some(i => !i.matchedProduct);
      newOrders[orderIdx] = order;
      return newOrders;
    });
  };

  const handleProcessOrders = async (skipStockDeduct = false) => {
    if (parsedOrders.length === 0) return;
    
    // Check if there are unmatched items (only if we are deducting stock)
    const hasUnmatched = parsedOrders.some(o => o.hasUnmatched);
    if (!skipStockDeduct && hasUnmatched && !window.confirm("มีสินค้าบางรายการในไฟล์ไม่ตรงกับรหัสสินค้าในระบบ ต้องการดำเนินการต่อโดยข้ามสินค้านั้นหรือไม่?")) {
      return;
    }

    setIsProcessing(skipStockDeduct ? 'skipDeduct' : 'deduct');
    try {
      let batch = writeBatch(db);
      let opCount = 0;
      const commitIfNeeded = async () => {
        if (opCount >= 400) {
          await batch.commit();
          batch = writeBatch(db);
          opCount = 0;
        }
      };

      const targetBranch = globalBranch || 'เฉวง';
      const pendingStockMap = new Map(); // productId -> updated stock_by_branch object
      let processedCount = 0;

      for (const order of parsedOrders) {
        await commitIfNeeded();

        const targetDateInfo = order.endOfMonth || getShopeeOrderEndOfMonth(order.rawDateVal, order.orderId);

        // MATCHED FLOW
        if (order.posMatched && order.posOrderId) {
            const orderRef = doc(getCol('orders'), order.posOrderId);
            batch.update(orderRef, {
                shopeeNetReceived: order.netReceived || 0,
                shopeeFees: order.totalFees || 0,
                shopeeMatchStatus: 'matched',
                date: targetDateInfo.thaiDate,
                "วันที่": targetDateInfo.thaiDate,
                orderDateIso: targetDateInfo.isoDate,
                createdAt: targetDateInfo.isoDateTime
            });
            opCount++;
            
            // Log history for matching
            const historyRef = doc(getCol('histories'));
            batch.set(historyRef, {
                "วันที่": targetDateInfo.thaiDate,
                "ชื่อลูกค้า": order.customerName,
                "เบอร์โทร": order.phone,
                "cleanPhone": order.phone.replace(/[^0-9]/g, ''),
                "หมายเลขคำสั่งซื้อ": order.orderId,
                "ประเภท": "อัปเดตยอด Shopee",
                "ชื่อสินค้า": "จับคู่บิลสำเร็จ",
                "ยอดเงิน": String(order.netReceived),
                "สาขา": targetBranch
            });
            opCount++;
            processedCount++;
            continue; // Do not deduct stock or loop items for matched orders!
        }
        
        // UNMATCHED FLOW (Create new POS bill)
        let orderHasItemsProcessed = false;
        let cartItems = [];
        
        for (const item of order.items) {
          // If we are deducting stock, we MUST have a matched product. Otherwise skip.
          if (!skipStockDeduct && !item.matchedProduct) continue;
          await commitIfNeeded();
          
          orderHasItemsProcessed = true;
          cartItems.push({
             id: item.matchedProduct ? item.matchedProduct.id : `unmapped_${Date.now()}_${Math.random().toString(36).substring(7)}`,
             name: item.matchedProduct ? String(getFuzzyKey(item.matchedProduct, ["ชื่อสินค้า", "col_2"])) : item.productName,
             qty: item.qty,
             price: item.price,
             type: 'product',
             originalItem: item.matchedProduct || null
          });
          
          if (!skipStockDeduct && item.matchedProduct) {
            const pid = item.matchedProduct.id;
            const currentStockByBranch = pendingStockMap.has(pid)
              ? pendingStockMap.get(pid)
              : { ...(item.matchedProduct?.stock_by_branch || {}) };
            const oldStock = Number(currentStockByBranch[targetBranch]) || 0;
            const newStock = Math.max(0, oldStock - item.qty);
            pendingStockMap.set(pid, { ...currentStockByBranch, [targetBranch]: newStock });
          }
          
          // History log
          const historyRef = doc(getCol('histories'));
          const finalProductName = item.matchedProduct 
            ? String(getFuzzyKey(item.matchedProduct, ["ชื่อสินค้า", "col_2"])) 
            : item.productName;

          batch.set(historyRef, {
            "วันที่": targetDateInfo.thaiDate,
            "ชื่อลูกค้า": order.customerName,
            "เบอร์โทร": order.phone,
            "cleanPhone": order.phone.replace(/[^0-9]/g, ''),
            "หมายเลขคำสั่งซื้อ": order.orderId,
            "ประเภท": "ซื้อสินค้า Shopee" + (skipStockDeduct ? " (ไม่ตัดสต๊อก)" : ""),
            "ชื่อสินค้า": finalProductName,
            "จำนวน": String(item.qty),
            "สาขา": targetBranch
          });
          opCount++;
        }
        
        // Create an order document if unmatched
        if (orderHasItemsProcessed) {
           await commitIfNeeded();
           const newOrderRef = doc(getCol('orders'));
           const courseName = cartItems.map(i => `${i.name} x${i.qty}`).join(', ');
           let totalCost = 0;
           cartItems.forEach(i => {
              if (i.originalItem) {
                 const cost = parseFloat(String(getFuzzyKey(i.originalItem, ["ต้นทุน", "ราคาต้นทุน", "cost", "col_5"]) || '0').replace(/[^0-9.-]/g, '')) || 0;
                 totalCost += (cost * i.qty);
              }
           });
           batch.set(newOrderRef, {
              orderNo: order.orderId,
              customerName: order.customerName,
              customerPhone: order.phone,
              courseName: courseName,
              price: String(order.totalPrice),
              shopeeNetReceived: order.netReceived || 0,
              shopeeFees: order.totalFees || 0,
              qty: String(cartItems.reduce((sum, item) => sum + item.qty, 0)),
              branch: targetBranch,
              status: "อนุมัติแล้ว",
              paymentMethod: "ช้อปปี้",
              source: "SHOPEE",
              orderChannel: "shopee",
              wcOrderId: order.orderId,
              createdAt: targetDateInfo.isoDateTime,
              date: targetDateInfo.thaiDate,
              "วันที่": targetDateInfo.thaiDate,
              orderDateIso: targetDateInfo.isoDate,
              shopeeOrderDate: order.rawDateVal || '',
              totalCost: String(totalCost),
              cartItems: cartItems
           });
           opCount++;
           processedCount++;
        }
      }

      // Apply accumulated stock updates once per product (preventing same-SKU overwrites)
      for (const [pid, newStockByBranch] of pendingStockMap.entries()) {
        await commitIfNeeded();
        const pRef = doc(db, 'products', pid);
        batch.set(pRef, { stock_by_branch: newStockByBranch }, { merge: true });
        opCount++;
      }

      if (processedCount > 0) {
        if (opCount > 0) await batch.commit();
        showToast(`บันทึกสำเร็จ ${processedCount} คำสั่งซื้อ (ลงยอดเข้า POS วันสิ้นเดือนเรียบร้อย)!`, 'success');
        onClose();
      } else {
        showToast('ไม่มีรายการสินค้าที่ตรงกับระบบเลย', 'error');
      }

    } catch (err) {
      console.error(err);
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const totalValidItems = parsedOrders.reduce((sum, o) => sum + o.items.filter(i => i.matchedProduct).length, 0);
  const totalUnmatchedItems = parsedOrders.reduce((sum, o) => sum + o.items.filter(i => !i.matchedProduct).length, 0);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-orange-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-md">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 leading-tight">นำเข้าออเดอร์ Shopee</h2>
              <p className="text-sm text-slate-500">อัปโหลดไฟล์ Excel (.xlsx) หรือ CSV จาก Shopee Seller Centre</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {!file ? (
            <div 
              className="border-2 border-dashed border-orange-200 bg-orange-50/50 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-orange-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleFileUpload}
              />
              <Upload size={40} className="text-orange-400 mb-4" />
              <div className="font-bold text-slate-700 text-lg mb-1">คลิกเพื่อเลือกไฟล์ออเดอร์ Shopee</div>
              <div className="text-slate-500 text-sm">รองรับไฟล์ Excel (.xlsx) และ CSV</div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <CheckCircle className="text-emerald-500" size={20} />
                    พบทั้งหมด {parsedOrders.length} คำสั่งซื้อ
                  </h3>
                  <div className="text-sm text-slate-500 mt-1 flex gap-4">
                    <span className="flex items-center gap-1 text-emerald-600">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div> ตรงกับสต๊อก: {totalValidItems} รายการ
                    </span>
                    {totalUnmatchedItems > 0 && (
                      <span className="flex items-center gap-1 text-rose-500 font-medium">
                        <div className="w-2 h-2 rounded-full bg-rose-500"></div> ไม่พบสินค้าในระบบ: {totalUnmatchedItems} รายการ
                      </span>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setFile(null)} 
                  className="text-sm font-bold text-indigo-600 hover:text-indigo-700 underline"
                >
                  อัปโหลดไฟล์ใหม่
                </button>
              </div>

              {/* Beautiful Totals Banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
                 <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 text-white shadow-md flex flex-col justify-between">
                    <div className="text-orange-100 text-xs font-bold mb-1">ยอดขายรวม (ตามราคาสินค้า)</div>
                    <div className="text-2xl font-black">฿{parsedOrders.reduce((sum, o) => sum + o.totalPrice, 0).toLocaleString()}</div>
                 </div>
                 <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-4 text-white shadow-md flex flex-col justify-between">
                    <div className="text-rose-100 text-xs font-bold mb-1">ค่าธรรมเนียมรวม (ทุกรายการ)</div>
                    <div className="text-2xl font-black">฿{parsedOrders.reduce((sum, o) => sum + (o.totalFees || 0), 0).toLocaleString()}</div>
                 </div>
                 <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white shadow-md flex flex-col justify-between">
                    <div className="text-emerald-100 text-xs font-bold mb-1">ยอดสุทธิที่ได้รับจริง (โอนเข้าบัญชี)</div>
                    <div className="text-2xl font-black">฿{parsedOrders.reduce((sum, o) => sum + (o.netReceived || 0), 0).toLocaleString()}</div>
                 </div>
              </div>

              {/* End of Month Notification Banner */}
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                      วันบันทึกยอดเข้า POS
                      <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black">วันสิ้นเดือนของแต่ละเดือน</span>
                    </div>
                    <div className="text-xs text-blue-700 mt-0.5 font-medium">
                      คำสั่งซื้อ Shopee แต่ละรายการจะถูกนำเข้า POS ตามวันสิ้นเดือนของเดือนนั้นๆ โดยอัตโนมัติ
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {distinctMonths.map(m => (
                    <span key={m.isoDate} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 text-indigo-700 text-xs font-black rounded-xl shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      สิ้นเดือน {m.displayMonthLabel}: {m.thaiDate} ({m.count} ออเดอร์)
                    </span>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium flex gap-2 items-start border border-red-100">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <div className="bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden mt-4">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100/50 text-slate-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-3 font-bold w-40">หมายเลขคำสั่งซื้อ</th>
                      <th className="p-3 font-bold">ลูกค้า</th>
                      <th className="p-3 font-bold">รายการสินค้า</th>
                      <th className="p-3 font-bold">สถานะใน POS</th>
                      <th className="p-3 font-bold text-right">ยอดรวม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedOrders.slice(0, 50).map((order) => (
                      <tr key={order.orderId} className="hover:bg-white transition-colors">
                        <td className="p-3 font-bold text-indigo-600 align-top">{order.orderId}</td>
                        <td className="p-3 text-slate-700 align-top">
                          <div>{order.customerName}</div>
                          <div className="text-xs text-slate-400">{order.phone}</div>
                        </td>
                        <td className="p-3 align-top">
                          <div className="space-y-1">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-xs">
                                <span className={`px-1.5 py-0.5 rounded flex-shrink-0 ${item.matchedProduct ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                  x{item.qty}
                                </span>
                                <div>
                                  <div className={`font-medium ${!item.matchedProduct && 'text-rose-500'}`}>
                                    {item.matchedProduct ? String(getFuzzyKey(item.matchedProduct, ["ชื่อสินค้า", "col_2"])) : item.productName}
                                  </div>
                                  <div className="text-[10px] text-slate-400">SKU: {item.sku || '-'}</div>
                                  
                                  {!item.matchedProduct && (
                                    <div className="mt-1">
                                      <input 
                                        type="text" 
                                        placeholder="พิมพ์ชื่อสินค้าเพื่อจับคู่..."
                                        list="productList"
                                        className="w-full text-xs border border-rose-300 rounded p-1.5 outline-none focus:border-rose-500 bg-white"
                                        onChange={(e) => {
                                          const selectedName = e.target.value;
                                          const p = products.find(prod => String(getFuzzyKey(prod, ["ชื่อสินค้า", "col_2"])) === selectedName);
                                          if (p) handleManualMatch(order.orderId, idx, p.id);
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 align-top">
                          {order.posMatched ? (
                            <div className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-[10px] font-bold border border-emerald-200">
                              <CheckCircle size={12} /> จับคู่บิล {order.posOrderNo}
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-lg text-[10px] font-bold border border-orange-200">
                              จะสร้างบิลใหม่
                            </div>
                          )}
                          {order.endOfMonth && (
                            <div className="text-[11px] font-bold text-indigo-600 mt-1 flex items-center gap-1 bg-indigo-50/80 px-2 py-0.5 rounded border border-indigo-100 w-fit">
                              <Calendar size={11} className="shrink-0 text-indigo-500" />
                              ลงสิ้นเดือน: {order.endOfMonth.thaiDate}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-right font-black text-slate-800 align-top">
                          ฿{order.totalPrice.toLocaleString()}
                          <div className="text-[10px] text-slate-500 font-medium">ค่าธรรมเนียม: -฿{order.totalFees?.toLocaleString()}</div>
                          <div className="text-[11px] text-emerald-600 font-bold mt-1">รับจริง: ฿{order.netReceived?.toLocaleString()}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedOrders.length > 50 && (
                  <div className="p-3 text-center text-xs text-slate-500 bg-slate-100/50">
                    ... และอีก {parsedOrders.length - 50} รายการที่ซ่อนอยู่
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
          >
            ปิด
          </button>
          <div className="flex gap-2">
            <button 
              onClick={() => handleProcessOrders(true)}
              disabled={!file || parsedOrders.length === 0 || !!isProcessing || !!error}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center gap-2"
            >
              {isProcessing === 'skipDeduct' ? (
                <><Loader2 size={20} className="animate-spin" /> กำลังบันทึก...</>
              ) : (
                <><CheckCircle size={20} /> ยืนยัน (ไม่ตัดสต๊อก)</>
              )}
            </button>
            <button 
              onClick={() => handleProcessOrders(false)}
              disabled={!file || parsedOrders.length === 0 || !!isProcessing || !!error}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg shadow-orange-200 transition-colors flex items-center gap-2"
            >
              {isProcessing === 'deduct' ? (
                <><Loader2 size={20} className="animate-spin" /> กำลังบันทึก...</>
              ) : (
                <><CheckCircle size={20} /> ยืนยันการตัดสต๊อก</>
              )}
            </button>
          </div>
        </div>
      </div>
      
      <datalist id="productList">
        {products.map(p => (
          <option key={p.id} value={String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2"]))} />
        ))}
      </datalist>
    </div>
  );
}
