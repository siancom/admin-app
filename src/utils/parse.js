/**
 * 🧰 Utility parsing functions shared across App.jsx and App_mobile.tsx
 */

export function getLocalYYYYMMDD(dateObj = new Date()) {
  if (isNaN(dateObj.getTime())) return '';
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
  return num > 0 ? num : (num === 0 ? 0 : 1);
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
  if (!dateStr || typeof dateStr !== 'string') return null;
  let d, m, y;
  const splitRegex = new RegExp('[-/]');
  const parts = dateStr.includes('T') ? dateStr.split('T')[0].split(splitRegex) : dateStr.split(splitRegex);
  
  if (parts.length === 3) {
    if (dateStr.includes('/')) { d = parseInt(parts[0], 10); m = parseInt(parts[1], 10); y = parseInt(parts[2], 10); } 
    else { y = parseInt(parts[0], 10); m = parseInt(parts[1], 10); d = parseInt(parts[2], 10); }
    if (y < 100) y += 2000; if (y > 2500) y -= 543;
    const date = new Date(y, m - 1, d);
    if (!isNaN(date.getTime())) return date;
  }
  return null;
}

import { getFuzzyKey } from './fuzzy';

export function getBranchStock(product, branch) {
  if (!product) return 0;
  if (product.stock_by_branch && typeof product.stock_by_branch === 'object') {
    return Number(product.stock_by_branch[branch]) || 0;
  }
  return 0;
}

export function getTotalStock(product, validBranches = null) {
  if (!product) return 0;
  let total = 0;
  if (product.stock_by_branch && typeof product.stock_by_branch === 'object') {
    let allowedKeys = null;
    if (validBranches && Array.isArray(validBranches) && validBranches.length > 0) {
      allowedKeys = validBranches.map(b => b.name || b.id || b);
    }
    
    for (const [key, val] of Object.entries(product.stock_by_branch)) {
      if (allowedKeys && !allowedKeys.includes(key)) continue;
      total += (Number(val) || 0);
    }
  }
  return total;
}