/**
 * 🧰 Utility parsing functions shared across App.jsx and App_mobile.tsx
 */

export function getLocalYYYYMMDD(dateInput = new Date()) {
  let dateObj = dateInput;
  if (dateInput && typeof dateInput.toDate === 'function') {
    dateObj = dateInput.toDate();
  } else if (!(dateInput instanceof Date)) {
    dateObj = new Date(dateInput);
  }
  if (!dateObj || isNaN(dateObj.getTime())) return '';
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizeBranchName(branch) {
  return String(branch || '').replace(/^สาขา\s*/, '').trim();
}

export function formatDateTimeStr(dt) {
  if (!dt) return '-';
  const d = new Date(dt);
  if (isNaN(d.getTime())) return dt;
  return d.toLocaleDateString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }) + ' น.';
}

export function parseNumber(val) {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  const strVal = String(val).replace(new RegExp(',', 'g'), '').trim();
  const match = strVal.match(/-?\d+(?:\.\d+)?/);
  return match ? parseFloat(match[0]) : 0;
}

export function parseQty(val) {
  if (val === undefined || val === null || val === '') return 1;
  const strVal = String(val).trim();
  if (strVal === '0' || strVal === '0 ครั้ง') return 0;
  if (strVal.includes('+')) return 1; // Support for product bundles
  const num = Math.floor(parseNumber(val));
  return num >= 0 ? num : 0;
}

export function parseHistoryTime(val) {
  if (val === undefined || val === null || val === '') return 0;
  const text = String(val);
  const timeMatch = text.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) return Number(timeMatch[1]) * 60 + Number(timeMatch[2]);
  const nums = text.match(/\d+/g) || [];
  if (nums.length >= 2) return Number(nums[0]) * 60 + Number(nums[1]);
  return 0;
}

export function parseCSVRow(text) {
  let ret = [''], i = 0, s = true;
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

export function parseThaiDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? null : dateStr;
  if (typeof dateStr?.toDate === 'function') {
    const dt = dateStr.toDate();
    return isNaN(dt.getTime()) ? null : dt;
  }
  if (typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  let d, m, y;
  const splitRegex = new RegExp('[-/]');
  const datePart = trimmed.includes('T') ? trimmed.split('T')[0] : trimmed.split(/\s+/)[0];
  const parts = datePart.split(splitRegex);
  
  if (parts.length === 3) {
    if (datePart.includes('/')) {
      // รองรับทั้ง DD/MM/YYYY และ YYYY/MM/DD
      if (parts[0].length === 4) {
        y = parseInt(parts[0], 10); m = parseInt(parts[1], 10); d = parseInt(parts[2], 10);
      } else {
        d = parseInt(parts[0], 10); m = parseInt(parts[1], 10); y = parseInt(parts[2], 10);
      }
    } else {
      if (parts[2].length === 4) {
        d = parseInt(parts[0], 10); m = parseInt(parts[1], 10); y = parseInt(parts[2], 10);
      } else {
        y = parseInt(parts[0], 10); m = parseInt(parts[1], 10); d = parseInt(parts[2], 10);
      }
    }
    if (y < 100) {
      // ปี 2 หลัก เช่น 68, 69 = พ.ศ. 2568, 2569 -> ค.ศ. 2025, 2026
      y = y >= 55 ? (y + 2500 - 543) : (y + 2000);
    } else if (y > 2400) {
      y -= 543;
    }
    const date = new Date(y, m - 1, d);
    if (!isNaN(date.getTime())) return date;
  }
  return null;
}

import { getFuzzyKey } from './fuzzy';

export function getBranchStock(product, branch) {
  if (!product) return 0;
  const normTarget = normalizeBranchName(branch);
  if (product.stock_by_branch && typeof product.stock_by_branch === 'object') {
    if (product.stock_by_branch[branch] !== undefined) {
      return Number(product.stock_by_branch[branch]) || 0;
    }
    for (const [k, v] of Object.entries(product.stock_by_branch)) {
      if (normalizeBranchName(k) === normTarget) return Number(v) || 0;
    }
    return 0;
  }
  // Fallback เฉพาะสินค้าเก่าที่ยังไม่มี stock_by_branch
  if (!branch || normTarget === 'เฉวง' || normTarget === 'สำนักงานใหญ่') {
    return Number(getFuzzyKey(product, ['จำนวนคงเหลือ', 'col_12'])) || 0;
  }
  return 0;
}

export function getTotalStock(product, validBranches = null) {
  if (!product) return 0;
  if (product.stock_by_branch && typeof product.stock_by_branch === 'object' && Object.keys(product.stock_by_branch).length > 0) {
    let total = 0;
    let allowedKeys = null;
    if (validBranches && Array.isArray(validBranches) && validBranches.length > 0) {
      allowedKeys = validBranches.map(b => normalizeBranchName(b.name || b.id || b));
    }
    
    for (const [key, val] of Object.entries(product.stock_by_branch)) {
      if (allowedKeys && !allowedKeys.includes(normalizeBranchName(key)) && key !== 'สำนักงานใหญ่') continue;
      total += (Number(val) || 0);
    }
    return total;
  }
  return Number(getFuzzyKey(product, ['จำนวนคงเหลือ', 'col_12'])) || 0;
}