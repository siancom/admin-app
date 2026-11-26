import { getFuzzyKey } from './fuzzy';

// 🌟 ส่วนลด VIP ตามแบรนด์สินค้า 🌟
export const VIP_DISCOUNT_MAP = {
  'IRIS': 0.25,      // 25%
  'JENESS': 0.20,    // 20%
  'PUREFRESH': 0.20  // 20%
};

export const getVipDiscountRate = (product) => {
  const category = String(getFuzzyKey(product, ["หมวดสินค้า", "col_4"]) || '').trim().toUpperCase();
  const name = String(getFuzzyKey(product, ["ชื่อสินค้า", "col_2", "name"]) || '').trim().toUpperCase();
  const code = String(getFuzzyKey(product, ["รหัส", "col_1", "code"]) || '').trim().toUpperCase();
  const unit = String(getFuzzyKey(product, ["หน่วยนับ", "col_5", "unit"]) || '').trim().toLowerCase();
  
  // ยกเว้นสินค้าประเภทซอง และสินค้าราคาพิเศษที่ไม่ร่วมส่วนลด (สบู่มินิ RTC013 ราคาเต็ม 50 บ. เท่านั้น)
  if (unit.includes('ซอง')) return 0;
  if (code === 'RTC013' || name.includes('สบู่มินิ') || name.includes('MINIHERBALSOAP')) return 0;
  
  // ตรวจสอบแบรนด์จากหมวดหมู่, ชื่อสินค้า หรือ รหัสสินค้า (เช่น RTC, RTT, RTE, RTS, RTB, IQ, IR คือแบรนด์ IRIS ทั้งหมด)
  if (
    category === 'IRIS' || category.includes('IRIS') || category.includes('ไอริส') ||
    code.startsWith('RTC') || code.startsWith('RTT') || code.startsWith('RTE') || code.startsWith('RTS') || code.startsWith('RTB') ||
    code.startsWith('IQ') || code.startsWith('IR') ||
    name.includes('IRIS') || name.includes('ไอริส')
  ) {
    return VIP_DISCOUNT_MAP['IRIS']; // 25%
  }
  if (category === 'JENESS' || category.includes('JENESS') || name.includes('JENESS') || name.includes('เจเนส')) {
    return VIP_DISCOUNT_MAP['JENESS']; // 20%
  }
  if (category === 'PUREFRESH' || category.includes('PUREFRESH') || code.startsWith('P') || name.includes('PUREFRESH') || name.includes('เพียว')) {
    return VIP_DISCOUNT_MAP['PUREFRESH']; // 20%
  }

  return 0;
};

import { parseNumber } from './parse';

export const computeFinalPrice = (product, isVipCustomer) => {
    const fullPrice = parseNumber(getFuzzyKey(product, ["ราคาขายเต็ม", "ราคา", "col_6"]));
    if (!isVipCustomer) return fullPrice;
    
    const name = String(getFuzzyKey(product, ["ชื่อสินค้า", "col_2", "name"]) || '').trim().toUpperCase();
    const code = String(getFuzzyKey(product, ["รหัส", "col_1", "code"]) || '').trim().toUpperCase();

    // สินค้าราคาพิเศษที่ไม่ร่วมส่วนลด (สบู่มินิ RTC013 ราคาเต็ม 50 บ. เท่านั้น)
    if (code === 'RTC013' || name.includes('สบู่มินิ') || name.includes('MINIHERBALSOAP')) {
        return fullPrice;
    }
    
    const unit = String(getFuzzyKey(product, ["หน่วยนับ", "col_5", "unit"]) || '').trim().toLowerCase();
    if (unit.includes('ซอง')) return fullPrice;

    // 1. ถ้ามีราคาสมาชิกที่ระบุไว้ชัดเจนและถูกกว่าราคาเต็ม ให้ใช้ค่านั้น
    const memberPriceRaw = parseNumber(getFuzzyKey(product, ["ราคาสมาชิก", "col_10"]));
    if (memberPriceRaw > 0 && memberPriceRaw < fullPrice) {
        return memberPriceRaw;
    }

    // 2. คำนวณส่วนลด VIP ตามแบรนด์ (IRIS 25%, JENESS 20%, PUREFRESH 20%)
    const discountRate = getVipDiscountRate(product);
    if (discountRate > 0) {
        return Math.ceil(fullPrice * (1 - discountRate));
    }

    // 3. Fallback to memberPriceRaw if available
    if (memberPriceRaw > 0) return memberPriceRaw;

    return fullPrice;
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

