/**
 * 🔍 Fuzzy key lookup utility - shared across App.jsx and App_mobile.tsx
 */

const fuzzyCache = new WeakMap();

/**
 * Look up a value from an object using a list of possible key names.
 * Handles whitespace, zero-width chars, and fuzzy matching.
 */
export function getFuzzyKey(obj, targetKeys) {
  if (!obj) return undefined;
  let objCache = fuzzyCache.get(obj);
  if (!objCache) { objCache = new Map(); fuzzyCache.set(obj, objCache); }

  const cacheKey = Array.isArray(targetKeys) ? targetKeys.join(',') : targetKeys;
  if (objCache.has(cacheKey)) return objCache.get(cacheKey);

  const targets = Array.isArray(targetKeys) ? targetKeys : [targetKeys];
  let result = undefined;
  
  for (let target of targets) { if (obj[target] !== undefined && obj[target] !== '') { result = obj[target]; break; } }
  if (result === undefined) {
    for (let target of targets) {
      const cleanTarget = target.replace(new RegExp('[\\s\\u200B-\\u200D\\uFEFF]', 'g'), '').toLowerCase();
      const exactKey = Object.keys(obj).find(k => k.replace(new RegExp('[\\s\\u200B-\\u200D\\uFEFF"\'\\r\\n]', 'g'), '').toLowerCase() === cleanTarget);
      if (exactKey && obj[exactKey] !== '') { result = obj[exactKey]; break; }
    }
  }
  if (result === undefined) {
    for (let target of targets) {
      const cleanTarget = target.replace(new RegExp('[\\s\\u200B-\\u200D\\uFEFF]', 'g'), '').toLowerCase();
      if (['ยอด', 'ราคา', 'จำนวน'].includes(cleanTarget)) continue;
      const matchingKeys = Object.keys(obj).filter(k => k.replace(new RegExp('[\\s\\u200B-\\u200D\\uFEFF"\'\\r\\n]', 'g'), '').toLowerCase().includes(cleanTarget));
      for (let mk of matchingKeys) {
        const cleanMK = mk.replace(new RegExp('[\\s\\u200B-\\u200D\\uFEFF"\'\\r\\n]', 'g'), '').toLowerCase();
        
        if (!cleanTarget.includes('ค้าง') && cleanMK.includes('ค้าง')) continue;

        if (['เครดิต', 'วงเงิน', 'เครดิตที่ได้รับ', 'เครดิตที่ได้', 'ยอดเครดิต', 'เครดิตทั้งหมด'].includes(cleanTarget) && (cleanMK.includes('หัก') || cleanMK.includes('ใช้') || cleanMK.includes('เหลือ') || cleanMK.includes('เบิก') || cleanMK.includes('เก่า'))) continue;
        if (['ยอดเบิกดิบ', 'เบิกไปแล้ว', 'ยอดเบิก', 'ใช้เครดิต', 'ยอดสะสมดิบ', 'หักเครดิต'].includes(cleanTarget) && (cleanMK.includes('ได้รับ') || cleanMK.includes('ทั้งหมด') || cleanMK.includes('เหลือ'))) continue;
        if (obj[mk] !== '') { result = obj[mk]; break; }
      }
      if (result !== undefined) break;
    }
  }
  if (result !== undefined && typeof result === 'object' && result !== null) {
    if (result.toDate) result = result.toDate().toISOString(); else if (result.seconds) result = new Date(result.seconds * 1000).toISOString(); else result = JSON.stringify(result);
  }
  objCache.set(cacheKey, result);
  return result;
}