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