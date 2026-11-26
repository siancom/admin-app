/**
 * 📚 Course-related utility functions shared across App.jsx and App_mobile.tsx
 * Note: Some functions have two versions (App.jsx vs App_mobile.tsx) due to different logic.
 */

import { getFuzzyKey } from './fuzzy';
import { parseNumber, parseQty, parseThaiDate } from './parse';

// ──── Shared helpers ────

export function isUsageType(typeStr) {
  if (!typeStr) return false;
  const clean = String(typeStr).replace(new RegExp('\\s', 'g'), '').toLowerCase();
  if (clean.match(new RegExp('(ซื้อ|อัพ|เพิ่ม|แถม|บวก|เปิด|ใหม่)'))) return false;
  return clean.match(new RegExp('(ใช้|ตัด|หัก|บริการ|treatment|คอส|คอร์ส)')) !== null || clean.includes('เบิก');
}

export function isAddType(typeStr) {
  if (!typeStr) return false;
  const clean = String(typeStr).replace(new RegExp('\\s', 'g'), '').toLowerCase();
  return clean.match(new RegExp('(อัพ|เพิ่ม|แถม|บวก)')) !== null;
}

export function extractHistoryQty(h) {
  const rawQty = getFuzzyKey(h, ["จำนวน", "จำนวนที่ใช้", "จำนวนที่ได้", "ตัดคอร์ส", "col_15"]);
  if (rawQty !== undefined && rawQty !== '') {
    const parsed = parseQty(rawQty);
    if (parsed > 0 && parsed <= 500) return parsed;
  }
  return 1;
}

export const isMoleHistoryRecord = (h) => String(getFuzzyKey(h, ["ประเภท", "col_4"]) || '').trim().includes('จี้ไฝ');

// ──── isFreeUsage - App.jsx version (based on status check) ────

export function isFreeUsageApp(h) {
  const type = String(getFuzzyKey(h, ["ประเภท", "col_4"]) || '');
  if (!isUsageType(type)) return false;

  const rawStatus = getFuzzyKey(h, ["สถานะ", "col_7", "col_8", "col_9"]);
  const hStatus = String(rawStatus || '').replace(new RegExp('\\s', 'g'), '');
  if (rawStatus !== undefined && hStatus !== 'เรียบร้อย') return true;
  
  return false;
}

// ──── isFreeUsage - App_mobile version (based on remark/action/product text) ────

export function isFreeUsageMobile(h) {
  const rawRemark = String(getFuzzyKey(h, ["หมายเหตุ", "col_10", "col_11", "col_12"]) || '').toLowerCase();
  const rawAction = String(getFuzzyKey(h, ["รายการที่ทำ", "รายการ", "col_23", "col_18"]) || '').toLowerCase();
  const rawProduct = String(getFuzzyKey(h, ["สินค้า", "col_18", "col_16"]) || '').toLowerCase();

  const cleanRemark = rawRemark.replace(/\s/g, '');
  const cleanAction = rawAction.replace(/\s/g, '');
  const cleanProduct = rawProduct.replace(/\s/g, '');

  if (cleanRemark.includes('แอคทีฟ899') || cleanAction.includes('แอคทีฟ899') || cleanProduct.includes('แอคทีฟ899') ||
      cleanRemark.includes('active899') || cleanAction.includes('active899') || cleanProduct.includes('active899')) {
    return true;
  }

  const isRemarkFree = rawRemark === 'ฟรี' || rawRemark === 'แถม' || rawRemark.includes('ฟรี 1 ครั้ง') || rawRemark.includes('แถม 1 ครั้ง') || rawRemark.includes('ไม่หัก');
  if (isRemarkFree) return true;

  const checkAllFree = (text) => {
    if (!text) return true;
    const parts = text.split('>>').map(s => s.trim()).filter(Boolean);
    if (parts.length === 0) return true;
    return parts.every(part => part.includes('ฟรี') || part.includes('แถม'));
  };

  const hasText = rawAction.length > 0 || rawProduct.length > 0;
  if (hasText) {
    if (rawAction && rawProduct) return checkAllFree(rawAction) && checkAllFree(rawProduct);
    if (rawAction) return checkAllFree(rawAction);
    if (rawProduct) return checkAllFree(rawProduct);
  }

  return false;
}

// ──── checkWarranty ────

export function checkWarranty(dateStr) {
  const procDate = parseThaiDate(dateStr);
  if (!procDate) return null;
  const expireDate = new Date(procDate);
  expireDate.setDate(expireDate.getDate() + 30);
  const today = new Date(); today.setHours(0,0,0,0);
  const diffTime = expireDate.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return { isCovered: daysLeft >= 0, daysLeft, expireDateStr: expireDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) };
}

// ──── getHistoryDateKey & getHistorySortTime ────

export function getHistoryDateKey(h) {
  const createdAt = getFuzzyKey(h, ["createdAt", "updatedAt"]);
  const dateVal = createdAt || getFuzzyKey(h, ["วันที่", "col_1"]);
  if (!dateVal) return '';
  const parsed = parseThaiDate(dateVal);
  if (parsed) return getLocalYYYYMMDD_inline(parsed);
  const isoMatch = String(dateVal).match(/^\d{4}-\d{2}-\d{2}/);
  return isoMatch ? isoMatch[0] : '';
}

function getLocalYYYYMMDD_inline(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getHistorySortTime(h) {
  const createdAt = getFuzzyKey(h, ["createdAt", "updatedAt"]);
  if (createdAt) {
    const d = new Date(createdAt);
    if (!isNaN(d.getTime())) return d.getTime();
  }
  const dateVal = getFuzzyKey(h, ["วันที่", "col_1"]);
  const parsed = parseThaiDate(dateVal);
  if (!parsed) return 0;
  const timeVal = getFuzzyKey(h, ["เวลา", "time"]);
  const minutes = parseHistoryTime_inline(timeVal);
  parsed.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return parsed.getTime();
}

function parseHistoryTime_inline(val) {
  if (val === undefined || val === null || val === '') return 0;
  const text = String(val);
  const timeMatch = text.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) return Number(timeMatch[1]) * 60 + Number(timeMatch[2]);
  const nums = text.match(/\d+/g) || [];
  if (nums.length >= 2) return Number(nums[0]) * 60 + Number(nums[1]);
  return 0;
}

export function getHistoryBranch(h) {
  const branch = String(getFuzzyKey(h, ["สาขา", "branch"]) || '').trim();
  return branch || 'ไม่ระบุสาขา';
}

export function isHistoryUsageRecord(h) {
  const type = String(getFuzzyKey(h, ["ประเภท", "col_4"]) || '');
  return isUsageType(type) || isAddType(type);
}

// 🌟 ฟังก์ชันจับคู่ของแถมจากคอร์สกับสินค้าจริงในสต็อกอัตโนมัติ (Auto-match Free Gifts to Inventory Products)
export function findAutoMatchedProduct(giftName, productsList) {
  if (!giftName || !Array.isArray(productsList) || productsList.length === 0) return null;
  const rawName = String(giftName).trim();
  const clean = rawName.toLowerCase().replace(/[\s\-_(),.+/]/g, '');

  // 1. ตรวจสอบชื่อของแถมยอดนิยม & สินค้าโปรโมชั่น
  // แป้งรักแร้ขาว / Deo
  if (clean.includes('รักแร้') || clean.includes('deo') || clean.includes('แป้งรักแร้')) {
    const p = productsList.find(x => {
      const pCode = String(getFuzzyKey(x, ["รหัสสินค้า", "col_1"]) || '').toUpperCase();
      const pName = String(getFuzzyKey(x, ["ชื่อสินค้า", "col_2"]) || '').toLowerCase();
      return pCode === 'P801' || pName.includes('รักแร้ขาว') || (pName.includes('deo') && pName.includes('crystal'));
    });
    if (p) return p;
  }

  // ผงพอก (กระปุก RelaxingPowderMask)
  if (clean.includes('ผงพอก') || clean.includes('relaxingpowder')) {
    const p = productsList.find(x => {
      const pCode = String(getFuzzyKey(x, ["รหัสสินค้า", "col_1"]) || '').toUpperCase();
      const pName = String(getFuzzyKey(x, ["ชื่อสินค้า", "col_2"]) || '').toLowerCase();
      return pCode === 'IQ470006' || pName.includes('ผงพอก(กระปุก)') || pName.includes('relaxingpowder');
    });
    if (p) return p;
  }

  // เจลลดอาการ (Revival Clear Gel)
  if (clean.includes('ลดอาการ') || clean.includes('revivalclear')) {
    const p = productsList.find(x => {
      const pCode = String(getFuzzyKey(x, ["รหัสสินค้า", "col_1"]) || '').toUpperCase();
      const pName = String(getFuzzyKey(x, ["ชื่อสินค้า", "col_2"]) || '').toLowerCase();
      return pCode === 'IQ470009' || pName.includes('ลดอาการเจล') || pName.includes('revival clear');
    });
    if (p) return p;
  }

  // สบู่มินิ (MiniHerbalSoap)
  if (clean.includes('สบู่มินิ') || clean.includes('miniherbal')) {
    const p = productsList.find(x => {
      const pCode = String(getFuzzyKey(x, ["รหัสสินค้า", "col_1"]) || '').toUpperCase();
      const pName = String(getFuzzyKey(x, ["ชื่อสินค้า", "col_2"]) || '').toLowerCase();
      return pCode === 'RTC013' || pName.includes('สบู่มินิ');
    });
    if (p) return p;
  }

  // สบู่ลอก (HerbalSoap)
  if (clean.includes('สบู่ลอก')) {
    const p = productsList.find(x => {
      const pCode = String(getFuzzyKey(x, ["รหัสสินค้า", "col_1"]) || '').toUpperCase();
      const pName = String(getFuzzyKey(x, ["ชื่อสินค้า", "col_2"]) || '').toLowerCase();
      return pCode === 'RTC010' || pName.includes('สบู่ลอก');
    });
    if (p) return p;
  }

  // สบู่เดียว (Clarifying Herbal Soap)
  if (clean.includes('สบู่เดียว')) {
    const p = productsList.find(x => {
      const pCode = String(getFuzzyKey(x, ["รหัสสินค้า", "col_1"]) || '').toUpperCase();
      const pName = String(getFuzzyKey(x, ["ชื่อสินค้า", "col_2"]) || '').toLowerCase();
      return pCode === 'IQ470005' || pName.includes('สบู่เดียว');
    });
    if (p) return p;
  }

  // เซรั่มฟื้นฟู / เซรั่มบำรุง (Revival Serum)
  if (clean.includes('เซรั่มฟื้นฟู') || clean.includes('เซรั่มบำรุง') || clean.includes('revivalserum')) {
    const p = productsList.find(x => {
      const pCode = String(getFuzzyKey(x, ["รหัสสินค้า", "col_1"]) || '').toUpperCase();
      const pName = String(getFuzzyKey(x, ["ชื่อสินค้า", "col_2"]) || '').toLowerCase();
      return pCode === 'RTT021' || pName.includes('เซรั่มฟื้นฟู') || pName.includes('revival serum');
    });
    if (p) return p;
  }

  // เซรั่มโกลด์ / โกด์ล (Absolute Serum)
  if (clean.includes('เซรั่มโกล') || clean.includes('เซรั่มโกด์ล') || clean.includes('absoluteserum')) {
    const p = productsList.find(x => {
      const pCode = String(getFuzzyKey(x, ["รหัสสินค้า", "col_1"]) || '').toUpperCase();
      const pName = String(getFuzzyKey(x, ["ชื่อสินค้า", "col_2"]) || '').toLowerCase();
      return pCode === 'RTT007' || pName.includes('เซรั่มโกล') || pName.includes('เซรั่มโกด์ล');
    });
    if (p) return p;
  }

  // เซรั่มวิตซี (VITC)
  if (clean.includes('วิตซี') || clean.includes('vitc')) {
    const p = productsList.find(x => {
      const pCode = String(getFuzzyKey(x, ["รหัสสินค้า", "col_1"]) || '').toUpperCase();
      const pName = String(getFuzzyKey(x, ["ชื่อสินค้า", "col_2"]) || '').toLowerCase();
      return pCode === 'RTT026' || pName.includes('วิตซี');
    });
    if (p) return p;
  }

  // เจลสิว
  if (clean.includes('เจลสิว')) {
    const p = productsList.find(x => {
      const pCode = String(getFuzzyKey(x, ["รหัสสินค้า", "col_1"]) || '').toUpperCase();
      const pName = String(getFuzzyKey(x, ["ชื่อสินค้า", "col_2"]) || '').toLowerCase();
      return pCode === 'IQ470003' || pName.includes('เจลสิว');
    });
    if (p) return p;
  }

  // เจลฝ้า
  if (clean.includes('เจลฝ้า')) {
    const p = productsList.find(x => {
      const pCode = String(getFuzzyKey(x, ["รหัสสินค้า", "col_1"]) || '').toUpperCase();
      const pName = String(getFuzzyKey(x, ["ชื่อสินค้า", "col_2"]) || '').toLowerCase();
      return pCode === 'IQ470002' || pName.includes('เจลฝ้า');
    });
    if (p) return p;
  }

  // 2. ค้นหาจากรหัสสินค้าที่ระบุในข้อความ
  for (const p of productsList) {
    const pCode = String(getFuzzyKey(p, ["รหัสสินค้า", "col_1"]) || '').trim().toLowerCase();
    if (pCode && pCode.length >= 3 && clean.includes(pCode)) {
      return p;
    }
  }

  // 3. ค้นหาจากชื่อสินค้าที่มีความยาวใกล้เคียงหรือซ้อนทับกัน
  for (const p of productsList) {
    const pName = String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2"]) || '').trim().toLowerCase().replace(/[\s\-_(),.+/]/g, '');
    if (pName && (clean === pName || (pName.length >= 4 && clean.includes(pName)) || (clean.length >= 4 && pName.includes(clean)))) {
      return p;
    }
  }

  return null;
}

/**
 * 🔍 ตรวจสอบว่ารายการประวัตินี้มาจากระบบเก่า (AppSheet Migration) หรือไม่
 * ระบบใหม่ (POS) จะมี orderNo/หมายเลขคำสั่งซื้อ ขึ้นต้นด้วย ORD-, POS-, IC-
 * หรือมี source: 'POS' / 'SHOPEE', หรือมี usedServices, orderId
 */
export function isLegacyHistory(h) {
  if (!h) return false;
  const source = String(h.source || '').toUpperCase();
  if (source === 'POS' || source === 'SHOPEE') return false;

  const orderNo = String(h.หมายเลขคำสั่งซื้อ || h.orderNo || h.orderId || h.เลขที่บิล || h.อ้างอิง || '').trim().toUpperCase();
  if (orderNo.startsWith('ORD-') || orderNo.startsWith('POS-') || orderNo.startsWith('IC-')) {
    return false;
  }

  if (Array.isArray(h.usedServices) && h.usedServices.length > 0) return false;
  if (h.orderId || h.posOrderId) return false;
  if (h.checkInBookingId || h.checkInId) return false;

  return true;
}
