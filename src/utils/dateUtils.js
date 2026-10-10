/**
 * 📅 Date and status utility functions shared across App.jsx and App_mobile.tsx
 */

import { getFuzzyKey } from './fuzzy';
import { parseThaiDate, getLocalYYYYMMDD } from './parse';

/**
 * Get safe date-time string for bookings
 */
export function getSafeDateTime(b) {
  if (b.dateTime && typeof b.dateTime === 'string' && b.dateTime.includes('T')) {
    const d = new Date(b.dateTime);
    if (!isNaN(d.getTime())) {
      return `${getLocalYYYYMMDD(d)}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    return b.dateTime;
  }

  const dateVal = getFuzzyKey(b, ["วันที่", "date", "bookingDate"]);
  const timeVal = getFuzzyKey(b, ["เวลา", "time", "bookingTime"]);

  if (dateVal) {
    const parsedDate = parseThaiDate(dateVal);
    if (parsedDate) {
      const dStr = getLocalYYYYMMDD(parsedDate);
      let tStr = '00:00';
      if (timeVal) {
        const cleanTime = String(timeVal).replace(new RegExp('[^0-9:]', 'g'), '');
        if (cleanTime.includes(':')) {
          tStr = cleanTime.substring(0, 5);
        } else if (cleanTime.length >= 4) {
          tStr = `${cleanTime.substring(0, 2)}:${cleanTime.substring(2, 4)}`;
        }
      }
      return `${dStr}T${tStr}`;
    }
  }
  return null;
}

/**
 * Get booking status with Thai labels
 */
export function getBookingStatus(b) {
  let st = String(getFuzzyKey(b, ["status", "สถานะ"]) || '').trim();
  if (!st || st.toLowerCase() === 'pending') return 'รอการยืนยัน';
  if (st.toLowerCase() === 'confirmed') return 'ยืนยันแล้ว';
  if (st.toLowerCase() === 'กำลังใช้บริการ' || st.toLowerCase() === 'in_progress') return 'กำลังใช้บริการ';
  if (st.toLowerCase() === 'completed') return 'เสร็จสิ้น';
  if (st.toLowerCase() === 'cancelled' || st.toLowerCase() === 'canceled') return 'ยกเลิก';

  if (!['รอการยืนยัน', 'ยืนยันแล้ว', 'กำลังใช้บริการ', 'เสร็จสิ้น', 'ยกเลิก'].includes(st)) {
    return 'รอการยืนยัน';
  }
  return st;
}

/**
 * Get order status with Thai labels
 */
export function getOrderStatus(o) {
  let st = String(getFuzzyKey(o, ["status", "สถานะ"]) || '').trim();
  if (!st || st.toLowerCase() === 'pending') return 'รออนุมัติ';
  if (st.toLowerCase() === 'approved') return 'อนุมัติแล้ว';
  if (['cancelled', 'canceled', 'rejected'].includes(st.toLowerCase()) || st.includes('ยกเลิก')) return 'ยกเลิก';
  if (['รออนุมัติ', 'อนุมัติแล้ว'].includes(st)) return st;

  // 🌟 จัดกลุ่มสถานะจริงที่ระบบอื่นเขียน (แอปลูกค้า / POS / แอดมินมือถือ) ให้ถูกต้อง
  // เดิม: อะไรที่ไม่ใช่ 3 ค่าหลักถูกนับเป็น "รออนุมัติ" ทั้งหมด ทำให้ 'จัดส่งแล้ว', 'สำเร็จ (ชำระแล้ว)' กลายเป็นค้างอนุมัติในสถิติ
  if (st.includes('รอ') || st.includes('เตรียม')) return 'รออนุมัติ'; // รอตรวจสอบยอดโอน / รอชำระเงิน / รอประเมินราคา / รอดำเนินการ (ตัดเครดิต) ฯลฯ
  return 'อนุมัติแล้ว'; // จัดส่งแล้ว / สำเร็จ (ชำระแล้ว) / สำเร็จ (รับของแล้ว) / ชำระแล้ว = เสร็จสิ้นแล้ว
}

/**
 * Check if a record (history, service log, attendance, etc) is within a specific YYYY-MM month prefix
 */
export function isInPayrollMonth(item, monthPrefix) {
  if (!item) return false;
  if (item.createdAt && item.createdAt.includes('T')) return item.createdAt.startsWith(monthPrefix);
  
  const dStr1 = String(item.date || '');
  const dStr2 = String(item.วันที่ || '');
  
  if (dStr1.startsWith(monthPrefix) || dStr2.startsWith(monthPrefix)) return true;

  for (const dStr of [dStr1, dStr2]) {
      if (dStr && dStr.includes('/')) {
          const parts = dStr.split('/');
          if (parts.length === 3) {
              let year = parseInt(parts[2], 10);
              if (year > 2500) year -= 543;
              if (`${year}-${parts[1].padStart(2, '0')}` === monthPrefix) return true;
          }
      }
  }
  return false;
}