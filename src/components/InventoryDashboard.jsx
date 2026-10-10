import React, { useState, useMemo } from 'react';
import { Search, Plus, Package, ArrowRightLeft, Download, Check, X, Clock, AlertCircle, ScanLine, Printer, QrCode, Trash2 } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db, storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { parseNumber, parseQty, getTotalStock, getBranchStock } from '../utils/parse';
import { getFuzzyKey } from '../utils/fuzzy';
import { fetchWithProxy, WOO_CFG } from '../utils/wooProxy';
import { getOwnerDiscountRate, computeOwnerCostPrice } from '../utils/priceUtils';
import { RefreshCw } from 'lucide-react';
import BarcodeScannerModal from './BarcodeScannerModal';
import { QRCodeSVG } from 'qrcode.react';

export default function InventoryDashboard({ 
  products, 
  branches, 
  globalBranch,
  globalRole, 
  user, 
  inventoryLogs,
  triggerToast,
  setActionConfirmModal,
  wooIdMap,
  onAddProduct
}) {
  const [activeTab, setActiveTab] = useState('inventory'); // inventory, stock_in, transfers
  const [searchInput, setSearchInput] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(globalBranch || 'เฉวง');
  
  // Modals & Forms
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustData, setAdjustData] = useState({ product: null, branch: '', qty: 0, reason: '' });
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [editProductForm, setEditProductForm] = useState(null);
  const [stockInForm, setStockInForm] = useState({ productId: '', branch: globalBranch || 'เฉวง', qty: '', supplier: '', note: '' });
  const [transferForm, setTransferForm] = useState({ 
    productId: '', 
    fromBranch: 'เฉวง', 
    toBranch: (globalBranch && globalBranch !== 'เฉวง') ? globalBranch : '', 
    qty: '', 
    note: '' 
  });
  
  // Internal Requisition State
  const [isRequisitionOpen, setIsRequisitionOpen] = useState(false);
  const [requisitionData, setRequisitionData] = useState({ productId: '', qty: '', note: '' });

  // Scanner state
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // QR Print State
  const [qrPrintData, setQrPrintData] = useState({ product: null, copies: 1, isOpen: false });
  const [isQrPrinting, setIsQrPrinting] = useState(false);

  // Sync State
  const [isSyncing, setIsSyncing] = useState(false);

  // Tabs Navigation
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      triggerToast('กรุณาเลือกไฟล์รูปภาพเท่านั้น', 'error');
      return;
    }

    setIsUploadingImage(true);
    try {
      const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setEditProductForm({ ...editProductForm, image: url });
      triggerToast('อัปโหลดรูปภาพสำเร็จ', 'success');
    } catch (err) {
      console.error('Upload Error:', err);
      triggerToast('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: ' + err.message, 'error');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const tabs = [
    { id: 'inventory', label: 'ภาพรวมคลังสินค้า', icon: Package },
    { id: 'stock_in', label: 'รับเข้าสินค้า (Stock In)', icon: Download },
    { id: 'transfers', label: 'โอนย้าย / เบิกสินค้า', icon: ArrowRightLeft }
  ];

  // Async helper to sync WooCommerce stock quietly
  const syncToWoo = async (product, newTotalStock) => {
    if (!wooIdMap) return;
    const sku = String(getFuzzyKey(product, ['รหัส', 'col_1']) || '').trim().toUpperCase();
    const wooId = sku ? wooIdMap.get(sku) : null;
    if (wooId) {
      try {
        await fetchWithProxy(`https://irisnatures.com/wp-json/wc/v3/products/${wooId}`, {
          method: 'PUT',
          body: JSON.stringify({ manage_stock: true, stock_quantity: newTotalStock })
        }, true);
      } catch (err) {
        console.error('WooCommerce sync failed in inventory:', err);
      }
    }
  };

  const handleSyncWooProducts = async () => {
    if (!WOO_CFG.url) return triggerToast('ไม่พบการตั้งค่า WooCommerce', 'error');
    if (globalRole !== 'owner') return triggerToast('เฉพาะเจ้าของร้านเท่านั้นที่สามารถดึงข้อมูลได้', 'error');
    
    setIsSyncing(true);
    triggerToast('กำลังดึงข้อมูลจากเว็บไซต์...', 'info');
    
    try {
      let page = 1;
      let hasMore = true;
      let allWooProducts = [];
      
      // Fetch up to 10 pages (max 1000 items)
      while (hasMore && page <= 10) {
        const data = await fetchWithProxy(`${WOO_CFG.url.replace(/\/$/, '')}/wp-json/wc/v3/products?per_page=100&page=${page}`, { method: 'GET' });
        if (Array.isArray(data) && data.length > 0) {
          allWooProducts = [...allWooProducts, ...data];
          if (data.length < 100) hasMore = false;
          else page++;
        } else {
          hasMore = false;
        }
      }

      if (allWooProducts.length === 0) {
        setIsSyncing(false);
        return triggerToast('ไม่พบข้อมูลสินค้าบนเว็บไซต์', 'error');
      }

      let newCount = 0;
      let updateCount = 0;
      
      const batch = writeBatch(db);
      let batchCount = 0;

      for (const wp of allWooProducts) {
        // Skip WooCommerce courses (only want physical products)
        if (wp.categories && Array.isArray(wp.categories)) {
           const isCourse = wp.categories.some(cat => cat.name && (cat.name.includes('คอร์ส') || cat.name.toLowerCase().includes('course')));
           if (isCourse) continue;
        }

        const sku = String(wp.sku || '').trim();
        const name = String(wp.name || '').trim();
        if (!name) continue;

        const getWooMeta = (prod, keys) => {
            if (!prod.meta_data || !Array.isArray(prod.meta_data)) return undefined;
            const targetKeys = Array.isArray(keys) ? keys : [keys];
            for (const m of prod.meta_data) {
                if (targetKeys.some(k => m.key === k || String(m.key).toLowerCase().includes(k.toLowerCase()))) {
                    return m.value;
                }
            }
            return undefined;
        };

        let rawPrice = parseFloat(wp.price || wp.regular_price || 0);
        if (['variable', 'grouped', 'bundle', 'woosb'].includes(wp.type)) {
            if (wp.price_html) {
                const stripped = wp.price_html.replace(/<[^>]+>/g, '').replace(/,/g, '');
                const numbers = stripped.match(/\d+(\.\d+)?/g);
                if (numbers && numbers.length > 0) {
                    rawPrice = Math.min(...numbers.map(Number));
                }
            }
        }
        const memberPrice = getWooMeta(wp, ["ราคาสมาชิก", "col_10", "_member_price"]) || 0;
        const status = wp.status === 'publish' ? 'ใช้งาน' : 'ซ่อน';
        const category = wp.categories && wp.categories.length > 0 ? wp.categories[0].name : 'IRIS';
        const image = wp.images && wp.images.length > 0 ? wp.images.map(img => img.src).join(',') : '';
        let desc = String(wp.description || wp.short_description || '').replace(/<[^>]*>?/gm, '').trim();
        // WooCommerce often encodes entities, basic decode:
        desc = desc.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'");

        // Find existing product in Firestore
        const existingProd = products.find(p => {
          const pCode = String(getFuzzyKey(p, ["รหัส", "col_1"]) || '').trim();
          const pName = String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2"]) || '').trim().toLowerCase();
          return (sku && pCode.toLowerCase() === sku.toLowerCase()) || (name.toLowerCase() === pName);
        });

        if (existingProd) {
          // Update existing
          updateCount++;
          const updateData = {
            "รหัส": sku || existingProd["รหัส"] || '',
            "ชื่อสินค้า": name,
            "หมวดสินค้า": category,
            "ราคาขายเต็ม": String(rawPrice),
            "สถานะ": status,
            "isStoreUseOnly": false, // Web products are not store-use-only
            "wooId": wp.id,
            "wooType": wp.type,
            "groupedIds": wp.grouped_products || []
          };
          // Only overwrite member price if WooCommerce actually provided one
          if (memberPrice > 0) {
              updateData["ราคาสมาชิก"] = String(memberPrice);
          }
          if (image) {
              updateData["รูปภาพ"] = image;
          }
          if (desc) {
              updateData["รายละเอียดสินค้า"] = desc;
          }
          batch.update(doc(db, 'products', existingProd.id), updateData);
        } else {
          // Create new
          newCount++;
          const newDocRef = doc(collection(db, 'products'));
          batch.set(newDocRef, {
            "รหัส": sku,
            "ชื่อสินค้า": name,
            "หมวดสินค้า": category,
            "หน่วยนับ": "ชิ้น",
            "ราคาขายเต็ม": String(rawPrice),
            "ราคาสมาชิก": String(memberPrice),
            "จำนวนคงเหลือ": String(wp.stock_quantity || 0),
            "สถานะ": status,
            "รูปภาพ": image,
            "รายละเอียดสินค้า": desc,
            "isStoreUseOnly": false,
            "wooId": wp.id,
            "wooType": wp.type,
            "groupedIds": wp.grouped_products || [],
            "stock_by_branch": { [globalBranch || 'เฉวง']: Number(wp.stock_quantity || 0) }
          });
        }

        batchCount++;
        // Firestore batch limit is 500
        if (batchCount >= 490) {
          await batch.commit();
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      triggerToast(`ซิงค์ข้อมูลสำเร็จ! เพิ่มใหม่ ${newCount} รายการ อัปเดต ${updateCount} รายการ`, 'success');

    } catch (err) {
      console.error('WooCommerce Sync Error:', err);
      triggerToast('เกิดข้อผิดพลาดในการดึงข้อมูล: ' + err.message, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleInternalRequisition = async (e) => {
    e.preventDefault();
    try {
      const { productId, qty, note } = requisitionData;
      if (!productId || !qty) return triggerToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');

      const product = products.find(p => p.id === productId);
      if (!product) return triggerToast('ไม่พบสินค้า', 'error');

      const reqQty = Number(qty);
      if (reqQty <= 0) return triggerToast('จำนวนต้องมากกว่า 0', 'error');

      const branch = globalBranch || 'เฉวง';
      const oldStock = getBranchStock(product, branch);
      
      if (oldStock < reqQty) {
        return triggerToast(`สต๊อกสาขา ${branch} ไม่เพียงพอ (มี ${oldStock})`, 'error');
      }

      const newStock = oldStock - reqQty;
      const currentStockByBranch = product?.stock_by_branch || {};
      const newStockByBranch = { ...currentStockByBranch, [branch]: newStock };
      
      const batch = writeBatch(db);
      
      // 1. Update product stock
      batch.set(doc(db, 'products', product.id), { stock_by_branch: newStockByBranch }, { merge: true });

      // 2. Add to histories as Store Use
      batch.set(doc(collection(db, 'histories')), {
        "ประเภท": "เบิกใช้ภายในร้าน",
        "สินค้า": String(getFuzzyKey(product, ["ชื่อสินค้า", "col_2"])),
        "จำนวน": String(reqQty),
        "หมายเหตุ": note || "ใช้ภายในคลินิก",
        "สาขา": branch,
        "วันที่": new Date().toLocaleString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }).split(' ')[0],
        "ผู้บันทึก": user?.name || 'พนักงาน',
        createdAt: serverTimestamp()
      });

      // 3. Add to inventory logs
      batch.set(doc(collection(db, 'inventory_logs')), {
        productId: product.id,
        productName: String(getFuzzyKey(product, ["ชื่อสินค้า", "col_2"])),
        type: 'STORE_USE',
        branch,
        oldStock,
        newStock,
        diff: -reqQty,
        reason: note || 'เบิกใช้ภายในคลินิก',
        createdBy: user?.name || 'พนักงาน',
        createdAt: serverTimestamp()
      });

      await batch.commit();
      triggerToast('เบิกใช้ภายในคลินิกสำเร็จ ตัดสต๊อกเรียบร้อย', 'success');
      setRequisitionData({ productId: '', qty: '', note: '' });
      setIsRequisitionOpen(false);
      syncToWoo(product, Object.values(newStockByBranch).reduce((sum, val) => sum + (Number(val) || 0), 0));
    } catch (error) {
      console.error(error);
      triggerToast('เกิดข้อผิดพลาด: ' + error.message, 'error');
    }
  };

  const handleStockIn = async (e) => {
    e.preventDefault();
    try {
      const { productId, branch, qty, supplier, note } = stockInForm;
      if (!productId || !branch || !qty) return triggerToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');

      const product = products.find(p => p.id === productId);
      if (!product) return triggerToast('ไม่พบสินค้า', 'error');

      const inQty = Number(qty);
      if (inQty <= 0) return triggerToast('จำนวนต้องมากกว่า 0', 'error');

      const oldStock = getBranchStock(product, branch);
      const newStock = oldStock + inQty;

      const currentStockByBranch = product?.stock_by_branch || {};
      const newStockByBranch = { ...currentStockByBranch, [branch]: newStock };
      
      const batch = writeBatch(db);
      batch.set(doc(db, 'products', product.id), { stock_by_branch: newStockByBranch }, { merge: true });

      batch.set(doc(collection(db, 'inventory_logs')), {
        productId: product.id,
        productName: String(getFuzzyKey(product, ["ชื่อสินค้า", "col_2"])),
        type: 'STOCK_IN',
        branch,
        oldStock,
        newStock,
        diff: inQty,
        supplier,
        note,
        createdBy: user?.name || 'พนักงาน',
        createdAt: serverTimestamp()
      });

      await batch.commit();
      triggerToast('รับสินค้าเข้าสำเร็จ', 'success');
      setStockInForm({ productId: '', branch: globalBranch || '', qty: '', supplier: '', note: '' });
      syncToWoo(product, Object.values(newStockByBranch).reduce((sum, val) => sum + (Number(val) || 0), 0));
    } catch (error) {
      console.error(error);
      triggerToast('เกิดข้อผิดพลาด: ' + error.message, 'error');
    }
  };

  const handleScanResult = (resultText) => {
    // Find product matching the scanned barcode
    const cleanBarcode = resultText.trim();
    const matchedProduct = products.find(p => {
      const pBarcode = String(getFuzzyKey(p, ["บาร์โค้ด", "barcode", "col_3"]) || '').trim();
      const pCode = String(getFuzzyKey(p, ["รหัส", "col_1"]) || '').trim();
      return (pBarcode && pBarcode === cleanBarcode) || (pCode && pCode.toLowerCase() === cleanBarcode.toLowerCase());
    });

    if (matchedProduct) {
      triggerToast(`สแกนสำเร็จ: ${String(getFuzzyKey(matchedProduct, ["ชื่อสินค้า", "col_2"]))}`, 'success');
      setStockInForm({ ...stockInForm, productId: matchedProduct.id });
    } else {
      triggerToast(`ไม่พบสินค้าที่ตรงกับบาร์โค้ด: ${cleanBarcode}`, 'error');
    }
  };

  const sortedProducts = useMemo(() => {
    return products.filter(p => {
      const name = String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2"]) || '');
      return !name.includes('ครั้ง');
    }).sort((a, b) => {
      const codeA = String(getFuzzyKey(a, ["รหัส", "col_1"]) || '');
      const codeB = String(getFuzzyKey(b, ["รหัส", "col_1"]) || '');
      return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [products]);

  const stockSummary = useMemo(() => {
    let totalCostAll = 0;
    let totalCostBranch = 0;
    let totalRetailAll = 0;
    let totalRetailBranch = 0;
    let totalItemsAll = 0;
    let totalItemsBranch = 0;

    sortedProducts.forEach(p => {
      const qtyAll = parseQty(getTotalStock(p, branches));
      const qtyBranch = parseQty(getBranchStock(p, selectedBranch));
      
      const fullPrice = parseNumber(getFuzzyKey(p, ["ราคาขายเต็ม", "col_6"]));
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
  }, [sortedProducts, branches, selectedBranch]);

  const handleAdjustStock = async () => {
    try {
      const { product, branch, qty, reason } = adjustData;
      if (!product || !branch) return;
      if (!reason.trim()) return triggerToast('กรุณาระบุเหตุผลในการปรับปรุงสต๊อก', 'error');

      const oldStock = getBranchStock(product, branch);
      const newStock = Number(qty);
      const diff = newStock - oldStock;
      
      if (diff === 0) return triggerToast('จำนวนสต๊อกไม่มีการเปลี่ยนแปลง', 'info');

      // Update product document
      const currentStockByBranch = product?.stock_by_branch || {};
      const newStockByBranch = { ...currentStockByBranch, [branch]: newStock };
      
      const batch = writeBatch(db);
      const productRef = doc(db, 'products', product.id);
      batch.set(productRef, { stock_by_branch: newStockByBranch }, { merge: true });

      // Add log
      const logRef = doc(collection(db, 'inventory_logs'));
      batch.set(logRef, {
        productId: product.id,
        productName: String(getFuzzyKey(product, ["ชื่อสินค้า", "col_2"])),
        type: 'ADJUST',
        branch,
        oldStock,
        newStock,
        diff,
        reason,
        createdBy: user?.name || 'พนักงาน',
        createdAt: serverTimestamp()
      });

      await batch.commit();
      triggerToast('ปรับปรุงสต๊อกสำเร็จ', 'success');
      syncToWoo(product, Object.values(newStockByBranch).reduce((sum, val) => sum + (Number(val) || 0), 0));
      setIsAdjustOpen(false);
    } catch (error) {
      console.error(error);
      triggerToast('เกิดข้อผิดพลาด: ' + error.message, 'error');
    }
  };

  const handleInlineAdjustStock = async (product, branch, oldStock, newValue) => {
    const newStock = Number(newValue);
    if (isNaN(newStock) || newStock === oldStock) return;
    
    try {
      const diff = newStock - oldStock;
      const currentStockByBranch = product?.stock_by_branch || {};
      const newStockByBranch = { ...currentStockByBranch, [branch]: newStock };
      
      const batch = writeBatch(db);
      const productRef = doc(db, 'products', product.id);
      batch.set(productRef, { stock_by_branch: newStockByBranch }, { merge: true });

      const logRef = doc(collection(db, 'inventory_logs'));
      batch.set(logRef, {
        productId: product.id,
        productName: String(getFuzzyKey(product, ["ชื่อสินค้า", "col_2"])),
        type: 'ADJUST',
        branch,
        oldStock,
        newStock,
        diff,
        reason: 'ปรับปรุงสต๊อกด่วน',
        createdBy: user?.name || 'พนักงาน',
        createdAt: serverTimestamp()
      });

      await batch.commit();
      triggerToast('อัปเดตสต๊อกสำเร็จ', 'success');
      syncToWoo(product, Object.values(newStockByBranch).reduce((sum, val) => sum + (Number(val) || 0), 0));
    } catch (err) {
      console.error(err);
      triggerToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
    }
  };

  const handleInlineAdjustPriceCost = async (product, field, newValue) => {
    const numValue = Number(newValue);
    if (isNaN(numValue) || numValue < 0) return;
    
    const currentValue = field === 'cost' 
      ? computeOwnerCostPrice(product) 
      : parseNumber(getFuzzyKey(product, ["ราคาขายเต็ม", "ราคา", "col_6"]));
      
    if (numValue === currentValue) return;
    
    try {
      const productRef = doc(db, 'products', product.id);
      if (field === 'cost') {
        await updateDoc(productRef, { "ต้นทุน": String(numValue) });
      } else {
        await updateDoc(productRef, { "ราคาขายเต็ม": String(numValue), "ราคา": String(numValue) });
      }
      triggerToast('อัปเดตราคาสำเร็จ', 'success');
    } catch (err) {
      console.error(err);
      triggerToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
    }
  };

  const handleEditProductSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!editProductForm || !editProductForm.id) return;
      
      const productRef = doc(db, 'products', editProductForm.id);
      await updateDoc(productRef, {
        "รหัส": String(editProductForm.code),
        "ชื่อสินค้า": String(editProductForm.name),
        "หมวดสินค้า": String(editProductForm.category),
        "ราคาขายเต็ม": String(editProductForm.price),
        "ราคาสมาชิก": String(editProductForm.memberPrice),
        "รูปภาพ": String(editProductForm.image),
        "รายละเอียดสินค้า": String(editProductForm.details || '')
      });
      
      triggerToast('แก้ไขข้อมูลสินค้าสำเร็จ', 'success');
      setIsEditProductOpen(false);
      setEditProductForm(null);
    } catch (err) {
      console.error(err);
      triggerToast('เกิดข้อผิดพลาดในการแก้ไขสินค้า: ' + err.message, 'error');
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      const { productId, fromBranch, toBranch, qty, note } = transferForm;
      if (!productId || !fromBranch || !toBranch || !qty) return triggerToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
      if (fromBranch === toBranch) return triggerToast('สาขาต้นทางและปลายทางต้องไม่ซ้ำกัน', 'error');

      const product = products.find(p => p.id === productId);
      if (!product) return triggerToast('ไม่พบสินค้า', 'error');

      const transferQty = Number(qty);
      if (transferQty <= 0) return triggerToast('จำนวนต้องมากกว่า 0', 'error');

      const isMainBranch = globalRole === 'owner';
      const isTransferingFromMain = fromBranch === 'เฉวง';
      
      // If a sub-branch is requesting from Main Branch (and they are not Main Branch admin)
      if (!isMainBranch && isTransferingFromMain) {
        // Create REQUEST log
        await addDoc(collection(db, 'inventory_logs'), {
          productId: product.id,
          productName: String(getFuzzyKey(product, ["ชื่อสินค้า", "col_2"])),
          type: 'REQUEST',
          status: 'PENDING',
          fromBranch,
          toBranch,
          qty: transferQty,
          note,
          createdBy: user?.name || 'พนักงาน',
          createdAt: serverTimestamp()
        });
        triggerToast('ส่งคำขอเบิกสินค้าสำเร็จ รอการอนุมัติจากเฉวง', 'success');
      } else {
        // Direct Transfer (Main Branch to Sub Branch, or authorized transfer)
        const oldFromStock = getBranchStock(product, fromBranch);
        if (oldFromStock < transferQty) return triggerToast(`สต๊อกสาขา ${fromBranch} ไม่เพียงพอ (มี ${oldFromStock})`, 'error');

        const oldToStock = getBranchStock(product, toBranch);
        
        const currentStockByBranch = product?.stock_by_branch || {};
        const newStockByBranch = { 
          ...currentStockByBranch, 
          [fromBranch]: oldFromStock - transferQty,
          [toBranch]: oldToStock + transferQty
        };

        const batch = writeBatch(db);
        batch.set(doc(db, 'products', product.id), { stock_by_branch: newStockByBranch }, { merge: true });

        batch.set(doc(collection(db, 'inventory_logs')), {
          productId: product.id,
          productName: String(getFuzzyKey(product, ["ชื่อสินค้า", "col_2"])),
          type: 'TRANSFER',
          status: 'COMPLETED',
          fromBranch,
          toBranch,
          qty: transferQty,
          note,
          createdBy: user?.name || 'พนักงาน',
          createdAt: serverTimestamp()
        });

        // 🌟 Auto-create Expense for the destination branch 🌟
        const costPrice = computeOwnerCostPrice(product);
        const totalCost = costPrice * transferQty;
        if (totalCost > 0) {
          batch.set(doc(collection(db, 'expenses')), {
            date: new Date().toISOString().split('T')[0],
            branch: toBranch,
            category: 'สั่งซื้อสินค้าจากศูนย์ใหญ่',
            amount: totalCost,
            note: `[อัตโนมัติ] รับโอนสินค้า ${String(getFuzzyKey(product, ["ชื่อสินค้า", "col_2"]))} จำนวน ${transferQty} ชิ้น จากสาขา ${fromBranch}`,
            createdAt: new Date().toISOString()
          });
        }

        await batch.commit();
        triggerToast('โอนย้ายสินค้าและบันทึกค่าใช้จ่ายสำเร็จ', 'success');
      }
      
      setTransferForm({ ...transferForm, productId: '', qty: '', note: '' });
    } catch (err) {
      console.error(err);
      triggerToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
    }
  };

  const handleApproveTransfer = async (logId, isApprove) => {
    try {
      const log = inventoryLogs.find(l => l.id === logId);
      if (!log) return;
      if (log.status !== 'PENDING') return;

      if (!isApprove) {
        await updateDoc(doc(db, 'inventory_logs', logId), { status: 'REJECTED', updatedAt: serverTimestamp(), updatedBy: user?.name || 'พนักงาน' });
        return triggerToast('ปฏิเสธคำขอเบิกสินค้าแล้ว', 'info');
      }

      // Approve -> Deduct from fromBranch, Add to toBranch
      const product = products.find(p => p.id === log.productId);
      if (!product) return triggerToast('ไม่พบสินค้านี้ในระบบแล้ว', 'error');

      const oldFromStock = getBranchStock(product, log.fromBranch);
      if (oldFromStock < log.qty) return triggerToast(`สต๊อกสาขาต้นทางไม่เพียงพอ (มี ${oldFromStock})`, 'error');
      
      const oldToStock = getBranchStock(product, log.toBranch);
      const currentStockByBranch = product?.stock_by_branch || {};
      const newStockByBranch = { 
        ...currentStockByBranch, 
        [log.fromBranch]: oldFromStock - log.qty,
        [log.toBranch]: oldToStock + log.qty
      };

      const batch = writeBatch(db);
      batch.set(doc(db, 'products', product.id), { stock_by_branch: newStockByBranch }, { merge: true });
      batch.update(doc(db, 'inventory_logs', logId), { 
        status: 'COMPLETED', 
        updatedAt: serverTimestamp(), 
        updatedBy: user?.name || 'พนักงาน' 
      });

      // 🌟 Auto-create Expense for the destination branch upon approval 🌟
      const costPrice = computeOwnerCostPrice(product);
      const totalCost = costPrice * log.qty;
      if (totalCost > 0) {
        batch.set(doc(collection(db, 'expenses')), {
          date: new Date().toISOString().split('T')[0],
          branch: log.toBranch,
          category: 'สั่งซื้อสินค้าจากศูนย์ใหญ่',
          amount: totalCost,
          note: `[อัตโนมัติ] รับโอนสินค้า ${String(getFuzzyKey(product, ["ชื่อสินค้า", "col_2"]))} จำนวน ${log.qty} ชิ้น จากสาขา ${log.fromBranch}`,
          createdAt: new Date().toISOString()
        });
      }

      await batch.commit();
      triggerToast('อนุมัติ โอนย้ายสินค้า และบันทึกค่าใช้จ่ายสำเร็จ', 'success');
    } catch (err) {
      console.error(err);
      triggerToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
    }
  };

  const handlePrintQr = () => {
    setQrPrintData(prev => ({ ...prev, isOpen: false }));
    setIsQrPrinting(true);
    setTimeout(() => {
      window.print();
      setIsQrPrinting(false);
    }, 500);
  };

  const handleDeleteProduct = async (product) => {
    try {
      // Log the deletion
      const logRef = doc(collection(db, 'inventory_logs'));
      await writeBatch(db).set(logRef, {
        productId: product.id,
        productName: String(getFuzzyKey(product, ["ชื่อสินค้า", "col_2"])),
        type: 'DELETE',
        reason: 'ลบสินค้า',
        createdBy: user?.name || 'พนักงาน',
        createdAt: serverTimestamp()
      }).delete(doc(db, 'products', product.id)).commit();
      
      triggerToast('ลบสินค้าสำเร็จ', 'success');
    } catch (error) {
      console.error(error);
      triggerToast('เกิดข้อผิดพลาดในการลบ: ' + error.message, 'error');
    }
  };

  return (
    <div className={`flex flex-col h-full space-y-4 max-w-7xl mx-auto ${isQrPrinting ? 'print:hidden' : ''}`}>
      {/* Sub-navigation */}
      <div className="flex space-x-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-teal-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 p-4 min-h-[500px]">
        {activeTab === 'inventory' && (
          <div>
            {globalRole === 'owner' && (
              <div className="mb-6 p-6 bg-gradient-to-br from-indigo-50/50 via-teal-50/30 to-emerald-50/40 border border-slate-100 rounded-2xl shadow-sm">
                <h3 className="text-sm font-bold text-teal-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span>📈 สรุปมูลค่าคลังสินค้าคงเหลือ (ราคาต้นทุน)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">มูลค่าต้นทุนรวม (ทุกสาขา)</p>
                    <p className="text-xl font-black text-teal-600 mt-1">฿{stockSummary.totalCostAll.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 mt-1">จำนวนทั้งหมด: {stockSummary.totalItemsAll} ชิ้น</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">มูลค่าต้นทุน (สาขา {selectedBranch})</p>
                    <p className="text-xl font-black text-teal-600 mt-1">฿{stockSummary.totalCostBranch.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 mt-1">จำนวนสาขา: {stockSummary.totalItemsBranch} ชิ้น</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">มูลค่าขายรวม (ทุกสาขา)</p>
                    <p className="text-xl font-black text-slate-700 mt-1">฿{stockSummary.totalRetailAll.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 mt-1">ราคาปลีกเต็ม</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">มูลค่าขายรวม (สาขา {selectedBranch})</p>
                    <p className="text-xl font-black text-slate-700 mt-1">฿{stockSummary.totalRetailBranch.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 mt-1">ราคาปลีกเต็ม</p>
                  </div>
                </div>
              </div>
            )}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                <div className="flex gap-2 w-full max-w-xl">
                  <div className="flex flex-1 items-center bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
                    <Search size={20} className="text-gray-400" />
                    <input type="text" placeholder="ค้นหาสินค้า..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-full mx-2 outline-none text-sm bg-transparent" />
                  </div>
                  {globalRole === 'owner' && (
                    <select 
                      value={selectedBranch} 
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-bold text-sm w-32"
                    >
                      {branches.map(b => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                {globalRole === 'owner' && (
                  <button 
                    onClick={handleSyncWooProducts}
                    disabled={isSyncing}
                    className="w-full sm:w-auto px-5 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white rounded-xl font-bold shadow-sm shadow-sky-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
                    {isSyncing ? 'กำลังดึงข้อมูล...' : 'ดึงข้อมูลจากเว็บไซต์'}
                  </button>
                )}
                <button 
                  onClick={onAddProduct}
                  className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  เพิ่มสินค้า
                </button>
                <button 
                  onClick={() => setIsRequisitionOpen(true)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-sm shadow-orange-500/30 transition-all flex items-center justify-center gap-2 print:hidden"
                >
                  <Package size={18} />
                  เบิกใช้ภายในคลินิก
                </button>
                <button 
                  onClick={() => window.print()}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold shadow-sm shadow-slate-800/30 transition-all flex items-center justify-center gap-2 print:hidden"
                >
                  <Printer size={18} />
                  พิมพ์สต๊อก
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left border-collapse print:w-full print:table-fixed">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                    <th className="p-4 print:p-1 print:text-xs font-bold rounded-tl-xl w-16 text-center">รูป</th>
                    <th className="p-4 print:p-1 print:text-xs font-bold">รหัส</th>
                    <th className="p-4 print:p-1 print:text-xs font-bold">ชื่อสินค้า</th>
                    <th className="p-4 print:p-1 print:text-xs font-bold text-center">ราคาขาย</th>
                    <th className="p-4 print:p-1 print:text-xs font-bold text-center">ราคาสมาชิก</th>
                    <th className="p-4 print:p-1 print:text-xs font-bold text-center">สต๊อกรวม</th>
                    <th className="p-4 print:p-1 print:text-xs font-bold text-center">สาขา ({selectedBranch})</th>
                    <th className="p-4 print:p-1 print:text-xs font-bold rounded-tr-xl text-right print:hidden">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedProducts.filter(p => {
                    const term = searchInput.toLowerCase();
                    const name = String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2"]) || '').toLowerCase();
                    const code = String(getFuzzyKey(p, ["รหัส", "col_1"]) || '').toLowerCase();
                    return name.includes(term) || code.includes(term);
                  }).map(p => {
                    const total = getTotalStock(p, branches);
                    const branchStock = getBranchStock(p, selectedBranch);
                    const imgSrc = getFuzzyKey(p, ["รูปภาพ", "รูป", "image", "img", "col_13"]) || (wooIdMap && String(getFuzzyKey(p, ["รหัส", "col_1"])).trim() ? wooIdMap.get(String(getFuzzyKey(p, ["รหัส", "col_1"])).trim().toUpperCase()) : null);
                    
                    return (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 print:p-1 text-center">
                          {imgSrc ? (
                            <img src={imgSrc} alt="product" className="w-10 h-10 object-cover rounded-lg border border-gray-100 shadow-sm mx-auto bg-white" />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto text-gray-400">
                              <Package size={16} />
                            </div>
                          )}
                        </td>
                        <td className="p-4 print:p-1 print:text-[11px] font-mono text-sm text-gray-500">{String(getFuzzyKey(p, ["รหัส", "col_1"]) || '-')}</td>
                        <td className="p-4 print:p-1 print:text-xs font-bold text-gray-900">{String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2"]) || '-')}</td>
                        <td className="p-4 print:p-1 text-center">
                          <input 
                            type="number"
                            key={`price-${p.id}`}
                            defaultValue={parseNumber(getFuzzyKey(p, ["ราคาขายเต็ม", "ราคา", "col_6"]))}
                            onBlur={(e) => handleInlineAdjustPriceCost(p, 'price', e.target.value)}
                            className="w-20 px-2 py-1 text-center bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 font-bold text-gray-700 print:bg-transparent print:border-none print:p-0 print:text-xs"
                          />
                        </td>
                        <td className="p-4 print:p-1 text-center font-bold text-orange-500">
                          {parseNumber(getFuzzyKey(p, ["ราคาสมาชิก", "col_10"])) > 0 ? `฿${parseNumber(getFuzzyKey(p, ["ราคาสมาชิก", "col_10"]))}` : '-'}
                        </td>
                        <td className="p-4 print:p-1 text-center">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${total > 0 ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                            {total}
                          </span>
                        </td>
                        <td className="p-4 print:p-1 text-center">
                          <input 
                            type="number"
                            key={`${p.id}-${branchStock}`}
                            defaultValue={branchStock}
                            onBlur={(e) => handleInlineAdjustStock(p, selectedBranch, branchStock, e.target.value)}
                            className={`w-16 px-2 py-1 text-center bg-gray-50 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 font-bold print:bg-transparent print:border-none print:p-0 print:text-xs ${branchStock > 0 ? 'border-emerald-200 text-emerald-700' : 'border-orange-200 text-orange-700'}`}
                          />
                        </td>
                        <td className="p-4 text-right print:hidden space-x-2 whitespace-nowrap">
                          <button 
                            onClick={() => {
                                setEditProductForm({
                                  id: p.id,
                                  code: String(getFuzzyKey(p, ["รหัส", "col_1"]) || ''),
                                  name: String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2"]) || ''),
                                  category: String(getFuzzyKey(p, ["หมวดสินค้า"]) || 'IRIS'),
                                  price: parseNumber(getFuzzyKey(p, ["ราคาขายเต็ม", "ราคา", "col_6"])),
                                  memberPrice: parseNumber(getFuzzyKey(p, ["ราคาสมาชิก", "col_10"])),
                                  image: getFuzzyKey(p, ["รูปภาพ", "รูป", "image", "img", "col_13"]) || '',
                                  details: String(getFuzzyKey(p, ["รายละเอียดสินค้า", "รายละเอียด", "รายละเอียดสินค้า (ถ้ามี)", "details", "description", "col_11"]) || '')
                                });
                              setIsEditProductOpen(true);
                            }}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold rounded-lg transition-colors inline-flex items-center justify-center"
                          >
                            แก้ไข
                          </button>
                          <button 
                            onClick={() => setQrPrintData({ product: p, copies: 1, isOpen: true })}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold rounded-lg transition-colors inline-flex items-center justify-center"
                            title="พิมพ์ QR Code สติ๊กเกอร์"
                          >
                            <QrCode size={14} className="inline-block" />
                          </button>
                          <button 
                            onClick={() => { setAdjustData({ product: p, branch: selectedBranch, qty: branchStock, reason: '' }); setIsAdjustOpen(true); }}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors inline-flex items-center justify-center"
                          >
                            ปรับสต๊อก
                          </button>
                          {globalRole === 'owner' && (
                            <button 
                              onClick={() => setActionConfirmModal({
                                isOpen: true,
                                title: 'ยืนยันการลบสินค้า',
                                message: `คุณต้องการลบสินค้า "${String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2"]))}" ใช่หรือไม่? (การกระทำนี้ไม่สามารถกู้คืนได้)`,
                                confirmText: 'ลบสินค้า',
                                confirmColor: 'bg-red-500 hover:bg-red-600',
                                action: () => handleDeleteProduct(p)
                              })}
                              className="px-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg transition-colors inline-flex items-center justify-center"
                              title="ลบสินค้า"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {activeTab === 'stock_in' && (
          <div className="max-w-2xl mx-auto py-4">
            <h2 className="text-2xl font-black mb-6 flex items-center"><Download className="mr-2 text-teal-500" /> รับเข้าสินค้า (Stock In)</h2>
            <form onSubmit={handleStockIn} className="space-y-5 bg-gray-50 p-6 rounded-3xl border border-gray-100">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">เลือกสินค้า <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <select 
                      value={stockInForm.productId}
                      onChange={e => setStockInForm({...stockInForm, productId: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-bold"
                      required
                    >
                      <option value="">-- เลือกสินค้า --</option>
                      {sortedProducts.map(p => (
                        <option key={p.id} value={p.id}>{String(getFuzzyKey(p, ["รหัส", "col_1"]))} : {String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2"]))}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsScannerOpen(true)}
                      className="px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 rounded-xl font-bold flex items-center transition-colors"
                      title="สแกนบาร์โค้ด"
                    >
                      <ScanLine size={20} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">รับเข้าสาขา <span className="text-red-500">*</span></label>
                  <select 
                    value={stockInForm.branch}
                    onChange={e => setStockInForm({...stockInForm, branch: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-bold"
                    required
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">จำนวนที่รับเข้า <span className="text-red-500">*</span></label>
                  <input 
                    type="number" min="1"
                    value={stockInForm.qty}
                    onChange={e => setStockInForm({...stockInForm, qty: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-bold"
                    placeholder="เช่น 50" required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">ชื่อผู้จำหน่าย / Supplier</label>
                  <input 
                    type="text" 
                    value={stockInForm.supplier}
                    onChange={e => setStockInForm({...stockInForm, supplier: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    placeholder="ใส่ชื่อบริษัทหรือผู้ส่งมอบ"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">หมายเหตุเพิ่มเติม</label>
                <textarea 
                  value={stockInForm.note}
                  onChange={e => setStockInForm({...stockInForm, note: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 min-h-[80px] text-sm"
                  placeholder="เช่น เลขที่ใบส่งของ, รับเข้าจากสาขา..."
                />
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full py-3.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-black shadow-lg shadow-teal-500/30 transition-all flex justify-center items-center gap-2">
                  <Download size={18} /> บันทึกการรับเข้าสินค้า
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'transfers' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Transfer Form (1/3 width on large screens) */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                <h3 className="text-lg font-black mb-4 flex items-center"><ArrowRightLeft className="mr-2 text-indigo-500" size={20} /> ทำรายการเบิก/โอน</h3>
                <form onSubmit={handleTransfer} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">เลือกสินค้า <span className="text-red-500">*</span></label>
                    <select 
                      value={transferForm.productId}
                      onChange={e => setTransferForm({...transferForm, productId: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
                      required
                    >
                      <option value="">-- เลือกสินค้า --</option>
                      {sortedProducts.map(p => (
                        <option key={p.id} value={p.id}>{String(getFuzzyKey(p, ["รหัส", "col_1"]))} : {String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2"]))}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">จากสาขา (ต้นทาง) <span className="text-red-500">*</span></label>
                    <select 
                      value={transferForm.fromBranch}
                      onChange={e => setTransferForm({...transferForm, fromBranch: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
                      required
                    >
                      <option value="">-- เลือกสาขาต้นทาง --</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">ไปสาขา (ปลายทาง) <span className="text-red-500">*</span></label>
                    <select 
                      value={transferForm.toBranch}
                      onChange={e => setTransferForm({...transferForm, toBranch: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
                      required
                    >
                      {branches.map(b => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">จำนวน <span className="text-red-500">*</span></label>
                    <input 
                      type="number" min="1"
                      value={transferForm.qty}
                      onChange={e => setTransferForm({...transferForm, qty: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">หมายเหตุ</label>
                    <textarea 
                      value={transferForm.note}
                      onChange={e => setTransferForm({...transferForm, note: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 min-h-[60px] text-sm"
                      placeholder="เหตุผลการเบิก/โอน"
                    />
                  </div>

                  <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-lg shadow-indigo-600/30 transition-all text-sm">
                    {globalBranch && globalBranch !== 'เฉวง' ? 'ส่งคำขอเบิกสินค้า' : 'ยืนยันการโอนย้าย'}
                  </button>
                </form>
              </div>
            </div>

            {/* History & Requests (2/3 width) */}
            <div className="lg:col-span-2 flex flex-col space-y-4">
              <h3 className="text-lg font-black flex items-center"><Clock className="mr-2 text-gray-400" size={20} /> ประวัติการโอนและคำขอเบิก</h3>
              
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex-1 overflow-hidden flex flex-col">
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                        <th className="p-3 font-bold">วันที่</th>
                        <th className="p-3 font-bold">รายการ</th>
                        <th className="p-3 font-bold">ต้นทาง ➔ ปลายทาง</th>
                        <th className="p-3 font-bold text-center">สถานะ</th>
                        <th className="p-3 font-bold text-right">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {inventoryLogs
                        .filter(l => l.type === 'REQUEST' || l.type === 'TRANSFER')
                        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
                        .slice(0, 50)
                        .map(log => (
                        <tr key={log.id} className="hover:bg-gray-50/50">
                          <td className="p-3 text-xs text-gray-500">
                            {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString('th-TH') : '-'}
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-sm text-gray-800">{log.productName}</div>
                            <div className="text-xs text-gray-500">จำนวน: <span className="font-bold text-indigo-600">{log.qty}</span></div>
                          </td>
                          <td className="p-3 text-xs">
                            <div className="flex items-center text-gray-600">
                              <span className="truncate max-w-[80px]">{log.fromBranch}</span>
                              <ArrowRightLeft size={12} className="mx-1 text-gray-400" />
                              <span className="truncate max-w-[80px]">{log.toBranch}</span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            {log.status === 'PENDING' && <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-[10px] font-bold">รออนุมัติ</span>}
                            {log.status === 'COMPLETED' && <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-[10px] font-bold">เสร็จสิ้น</span>}
                            {log.status === 'REJECTED' && <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-[10px] font-bold">ปฏิเสธ</span>}
                          </td>
                          <td className="p-3 text-right">
                            {log.status === 'PENDING' && globalRole === 'owner' ? (
                              <div className="flex justify-end gap-1">
                                <button onClick={() => setActionConfirmModal({ isOpen: true, title: 'อนุมัติคำขอ', message: `ยืนยันการอนุมัติโอน ${log.productName} จำนวน ${log.qty}?`, action: () => handleApproveTransfer(log.id, true), confirmText: 'อนุมัติ', confirmColor: 'bg-green-500 hover:bg-green-600' })} className="p-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-md transition-colors"><Check size={16} /></button>
                                <button onClick={() => setActionConfirmModal({ isOpen: true, title: 'ปฏิเสธคำขอ', message: `ยืนยันการปฏิเสธคำขอ ${log.productName}?`, action: () => handleApproveTransfer(log.id, false), confirmText: 'ปฏิเสธ', confirmColor: 'bg-red-500 hover:bg-red-600' })} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-md transition-colors"><X size={16} /></button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Adjust Modal */}
      {isAdjustOpen && adjustData.product && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-xl font-black mb-1 text-gray-800">ปรับปรุงสต๊อก</h3>
            <p className="text-sm text-gray-500 mb-6 border-b border-gray-100 pb-4">
              สาขา: <span className="font-bold text-teal-600">{adjustData.branch}</span><br/>
              สินค้า: <span className="font-bold text-gray-800">{String(getFuzzyKey(adjustData.product, ["ชื่อสินค้า", "col_2"]))}</span>
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">จำนวนสต๊อกที่ถูกต้อง</label>
                <input 
                  type="number" 
                  value={adjustData.qty} 
                  onChange={e => setAdjustData({...adjustData, qty: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">เหตุผลการปรับปรุง <span className="text-red-500">*</span></label>
                <textarea 
                  value={adjustData.reason} 
                  onChange={e => setAdjustData({...adjustData, reason: e.target.value})}
                  placeholder="เช่น ตรวจนับสต๊อกประจำเดือน, สินค้าชำรุด"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 min-h-[100px] text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button onClick={() => setIsAdjustOpen(false)} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-colors">ยกเลิก</button>
              <button onClick={handleAdjustStock} className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-teal-500/30">บันทึก</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditProductOpen && editProductForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-xl font-black mb-6 text-gray-800 flex items-center"><Package className="mr-2 text-blue-500"/> แก้ไขข้อมูลสินค้า</h3>
            <form onSubmit={handleEditProductSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">รหัสสินค้า</label>
                  <input required type="text" value={editProductForm.code} onChange={e => setEditProductForm({...editProductForm, code: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">หมวดหมู่</label>
                  <input required type="text" value={editProductForm.category} onChange={e => setEditProductForm({...editProductForm, category: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">ชื่อสินค้า <span className="text-red-500">*</span></label>
                <input required type="text" value={editProductForm.name} onChange={e => setEditProductForm({...editProductForm, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">ราคาขายปกติ <span className="text-red-500">*</span></label>
                  <input required type="number" min="0" value={editProductForm.price} onChange={e => setEditProductForm({...editProductForm, price: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">ราคาสมาชิก</label>
                  <input type="number" min="0" value={editProductForm.memberPrice} onChange={e => setEditProductForm({...editProductForm, memberPrice: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-orange-600" placeholder="เว้นว่างถ้าไม่มี" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">URL รูปภาพ</label>
                <div className="flex gap-2 items-center">
                  <input type="text" value={editProductForm.image} onChange={e => setEditProductForm({...editProductForm, image: e.target.value})} className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="https://..." />
                  <label className={`cursor-pointer px-4 py-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl font-bold text-sm whitespace-nowrap border border-indigo-200 transition-colors ${isUploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                    {isUploadingImage ? 'กำลังอัปโหลด...' : 'อัปโหลดรูป'}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={isUploadingImage} />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">รายละเอียดสินค้า</label>
                <textarea 
                  value={editProductForm.details || ''} 
                  onChange={e => setEditProductForm({...editProductForm, details: e.target.value})} 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                  rows={3} 
                  placeholder="รายละเอียดสินค้า..." 
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsEditProductOpen(false)} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-colors">ยกเลิก</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-blue-500/30">บันทึกการแก้ไข</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Internal Requisition Modal */}
      {isRequisitionOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-xl font-black mb-1 text-gray-800 flex items-center"><Package className="mr-2 text-orange-500"/> เบิกของใช้ภายในคลินิก</h3>
            <p className="text-sm text-gray-500 mb-6 border-b border-gray-100 pb-4">
              สาขา: <span className="font-bold text-teal-600">{globalBranch || 'เฉวง'}</span>
            </p>
            
            <form onSubmit={handleInternalRequisition} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">เลือกสินค้า <span className="text-red-500">*</span></label>
                <select 
                  value={requisitionData.productId}
                  onChange={e => setRequisitionData({...requisitionData, productId: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                  required
                >
                  <option value="">-- เลือกสินค้า --</option>
                  {sortedProducts.map(p => (
                    <option key={p.id} value={p.id}>{String(getFuzzyKey(p, ["รหัส", "col_1"]))} : {String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2"]))}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">จำนวนที่เบิกใช้ <span className="text-red-500">*</span></label>
                <input 
                  type="number" min="1"
                  value={requisitionData.qty} 
                  onChange={e => setRequisitionData({...requisitionData, qty: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">หมายเหตุ (เบิกไปทำอะไร) <span className="text-red-500">*</span></label>
                <textarea 
                  value={requisitionData.note} 
                  onChange={e => setRequisitionData({...requisitionData, note: e.target.value})}
                  placeholder="เช่น เบิกสำลีเติมห้องทรีทเมนท์, เบิกน้ำเกลือ"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 min-h-[80px] text-sm"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsRequisitionOpen(false)} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-colors">ยกเลิก</button>
                <button type="submit" className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-orange-500/30">ยืนยันการเบิกใช้</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrPrintData.isOpen && qrPrintData.product && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2"><QrCode size={20} className="text-teal-600"/> พิมพ์ QR Code สินค้า</h3>
              <button onClick={() => setQrPrintData({ ...qrPrintData, isOpen: false })} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"><X size={18} /></button>
            </div>
            <div className="p-6">
              <div className="flex flex-col items-center justify-center bg-gray-50 p-4 rounded-xl mb-4 border border-gray-100">
                <QRCodeSVG value={String(getFuzzyKey(qrPrintData.product, ["รหัส", "col_1"]) || '')} size={120} />
                <p className="mt-3 font-bold text-gray-800 text-center">{String(getFuzzyKey(qrPrintData.product, ["ชื่อสินค้า", "col_2"]) || '')}</p>
                <p className="text-teal-600 font-black text-lg">฿{parseNumber(getFuzzyKey(qrPrintData.product, ["ราคาขายเต็ม", "ราคา", "col_6"])).toLocaleString()}</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">จำนวนดวงที่จะพิมพ์</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="100" 
                    value={qrPrintData.copies} 
                    onChange={e => setQrPrintData({ ...qrPrintData, copies: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-bold text-center"
                  />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button onClick={() => setQrPrintData({ ...qrPrintData, isOpen: false })} className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors">ยกเลิก</button>
              <button onClick={handlePrintQr} className="flex-1 px-4 py-3 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl shadow-lg shadow-teal-500/30 transition-all flex items-center justify-center gap-2">
                <Printer size={18} /> สั่งพิมพ์
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Print View (PeriPage A6 57x30mm) */}
      {isQrPrinting && qrPrintData.product && (
        <div className="hidden print:flex flex-col items-center justify-start bg-white fixed inset-0 z-[999999] print:overflow-visible">
          {Array.from({ length: qrPrintData.copies }).map((_, i) => (
            <div key={i} className="flex flex-col items-center justify-center w-[57mm] h-[30mm] break-after-page overflow-hidden" style={{ margin: 0, padding: 0 }}>
               <p className="text-[9px] font-bold text-black mb-0.5 text-center leading-tight max-w-[54mm] truncate">{String(getFuzzyKey(qrPrintData.product, ["ชื่อสินค้า", "col_2"]) || '')}</p>
               <QRCodeSVG value={String(getFuzzyKey(qrPrintData.product, ["รหัส", "col_1"]) || '')} size={55} />
               <p className="text-[10px] font-black text-black mt-0.5 leading-none">฿{parseNumber(getFuzzyKey(qrPrintData.product, ["ราคาขายเต็ม", "ราคา", "col_6"])).toLocaleString()}</p>
               <p className="text-[7px] font-mono text-black leading-none mt-0.5">{String(getFuzzyKey(qrPrintData.product, ["รหัส", "col_1"]) || '')}</p>
            </div>
          ))}
        </div>
      )}

      {/* Barcode Scanner Modal for Stock In */}
      <BarcodeScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScan={handleScanResult} 
      />
    </div>
  );
}
