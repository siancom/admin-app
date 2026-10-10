import { getFuzzyKey } from './fuzzy';

// 🌟 ส่วนลด VIP ตามแบรนด์สินค้า 🌟
export const VIP_DISCOUNT_MAP = {
  'IRIS': 0.25,      // 25%
  'JENESS': 0.20,    // 20%
  'PUREFRESH': 0.20  // 20%
};

export const getVipDiscountRate = (product) => {
  const category = String(getFuzzyKey(product, ["หมวดสินค้า", "col_4"]) || '').trim().toUpperCase();
  const unit = String(getFuzzyKey(product, ["หน่วยนับ", "col_7", "col_5"]) || '').trim().toLowerCase();
  
  // ยกเว้นสินค้าประเภทซอง
  if (unit.includes('ซอง')) return 0;
  
  // ตรวจสอบแบรนด์จากหมวดหมู่
  if (category === 'IRIS' || category.includes('IRIS') || category.includes('ไอริส')) return VIP_DISCOUNT_MAP['IRIS'];
  if (category === 'JENESS' || category.includes('JENESS')) return VIP_DISCOUNT_MAP['JENESS'];
  if (category === 'PUREFRESH' || category.includes('PUREFRESH')) return VIP_DISCOUNT_MAP['PUREFRESH'];

};

import { parseNumber } from './parse';

export const computeFinalPrice = (product, isVipCustomer) => {
    const fullPrice = parseNumber(getFuzzyKey(product, ["ราคาขายเต็ม", "ราคา", "col_6"]));
    if (!isVipCustomer) return fullPrice;
    
    const discountRate = getVipDiscountRate(product);
    if (discountRate > 0) {
        return Math.ceil(fullPrice * (1 - discountRate));
    }
    const memberPriceRaw = parseNumber(getFuzzyKey(product, ["ราคาสมาชิก", "col_10"]));
    return memberPriceRaw > 0 ? memberPriceRaw : fullPrice;
};

// 🌟 ส่วนลดราคาสั่งจัดซื้อ (ราคาต้นทุน) สำหรับเจ้าของร้าน 🌟
// iris 35%, pure 25%, jeness 40%
export const getOwnerDiscountRate = (product) => {
  const category = String(getFuzzyKey(product, ["หมวดสินค้า", "col_4"]) || '').trim().toUpperCase();
  const name = String(getFuzzyKey(product, ["ชื่อสินค้า", "col_2"]) || '').trim().toUpperCase();
  const checkString = (category + ' ' + name).toUpperCase();
  
  if (checkString.includes('IRIS') || checkString.includes('ไอริส')) return 0.35;
  if (checkString.includes('PURE') || checkString.includes('เพียว')) return 0.25;
  if (checkString.includes('JENESS') || checkString.includes('เจเนส')) return 0.40;
  
  // กำหนดค่าเริ่มต้นเป็น 35% (IRIS) เสมอหากไม่พบแบรนด์เฉพาะ 
  // เพื่อป้องกันปัญหากำไรเป็น 0 จากต้นทุนเท่ากับราคาขาย
  return 0.35;
};

export const computeOwnerCostPrice = (product) => {
  const explicitCost = parseNumber(getFuzzyKey(product, ["ต้นทุน", "costPrice"]));
  if (explicitCost > 0) return explicitCost;

  const fullPrice = parseNumber(getFuzzyKey(product, ["ราคาขายเต็ม", "ราคา", "col_6"]));
  const memberPrice = parseNumber(getFuzzyKey(product, ["ราคาสมาชิก", "col_10"]));
  const basePrice = memberPrice > 0 ? memberPrice : fullPrice;
  const discountRate = getOwnerDiscountRate(product);
  return Math.ceil(basePrice * (1 - discountRate));
};

