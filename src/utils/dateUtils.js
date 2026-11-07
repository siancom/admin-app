/**
 * 📅 Date and status utility functions shared across App.jsx and App_mobile.tsx
 */

import { getFuzzyKey } from './fuzzy';
import { parseThaiDate, getLocalYYYYMMDD } from './parse';

/**
 * Get safe date-time string for bookings
 */
export function getSafeDateTime(b) {
  if (!b) return null;
  const dateVal = getFuzzyKey(b, ["วันที่", "date", "bookingDate"]);
  const timeVal = getFuzzyKey(b, ["เวลา", "time", "bookingTime"]);

  if (b.dateTime && typeof b.dateTime === 'string' && b.dateTime.includes('T')) {
    const d = new Date(b.dateTime);
    if (!isNaN(d.getTime())) {
      // หากมีการเลื่อนวันใน b.date โดยไม่ได้อัปเดต b.dateTime ให้ใช้วันที่จาก b.date เป็นหลัก
      let dStr = getLocalYYYYMMDD(d);
      if (dateVal) {
        const explicitDate = parseThaiDate(dateVal);
        if (explicitDate) dStr = getLocalYYYYMMDD(explicitDate);
      }
      return `${dStr}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
  }

  if (dateVal) {
    const parsedDate = parseThaiDate(dateVal);
    if (parsedDate) {
      const dStr = getLocalYYYYMMDD(parsedDate);
      let tStr = '00:00';
      if (timeVal) {
        const normalizedTime = String(timeVal).trim().replace(/\./g, ':');
        const timeMatch = normalizedTime.match(/(\d{1,2}):(\d{1,2})/);
        if (timeMatch) {
          const hh = String(Math.min(23, parseInt(timeMatch[1], 10) || 0)).padStart(2, '0');
          const mm = String(Math.min(59, parseInt(timeMatch[2], 10) || 0)).padStart(2, '0');
          tStr = `${hh}:${mm}`;
        } else {
          const digits = normalizedTime.replace(/\D/g, '');
          if (digits.length >= 4) {
            tStr = `${digits.slice(0, 2).padStart(2, '0')}:${digits.slice(2, 4).padStart(2, '0')}`;
          } else if (digits.length === 3) {
            tStr = `0${digits[0]}:${digits.slice(1, 3)}`;
          } else if (digits.length >= 1 && digits.length <= 2) {
            tStr = `${digits.padStart(2, '0')}:00`;
          }
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
  if (st.toLowerCase() === 'completed' || st === 'รอชำระเงิน') return 'เสร็จสิ้น';
  if (st.toLowerCase() === 'cancelled' || st.toLowerCase() === 'canceled' || st.includes('ยกเลิก')) return 'ยกเลิก';

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
  if (!item || !monthPrefix) return false;

  // 1) ให้ความสำคัญกับวันที่ระบุตรงๆ (date / วันที่) ก่อนเสมอ รองรับรายการย้อนหลัง
  for (const raw of [item.date, item.วันที่]) {
    if (!raw) continue;
    const dStr = String(raw).trim();
    if (!dStr) continue;
    if (dStr.startsWith(monthPrefix)) return true;
    const parsed = parseThaiDate(dStr);
    if (parsed && getLocalYYYYMMDD(parsed).startsWith(monthPrefix)) return true;
  }

  // 2) Fallback ไปยัง createdAt โดยแปลงเป็นเวลาท้องถิ่นไทย (UTC+7)
  if (item.createdAt) {
    const localIso = getLocalYYYYMMDD(item.createdAt);
    if (localIso && localIso.startsWith(monthPrefix)) return true;
  }

  return false;
}