import { getFuzzyKey } from './fuzzy';
import { parseNumber, getLocalYYYYMMDD } from './parse';
import { isInPayrollMonth } from './dateUtils';

export function isHistoryValidForCommission(h) {
  if (!h || h.isCancelled) return false;
  const st = String(getFuzzyKey(h, ['สถานะ', 'status', 'col_7', 'col_8', 'col_9', 'col_22']) || '').trim().toLowerCase();
  if (!st) return true;
  if (st.includes('ยกเลิก') || st === 'cancelled' || st === 'canceled' || st === 'void') return false;
  if (st.includes('รอชำระ') || st.includes('รอตรวจ') || st === 'pending') return false;
  return true;
}

export function calculateServiceLogFee(s) {
  if (!s) return 0;
  const typeName = String(s.type || '').toLowerCase();
  let rawAmount = parseNumber(s.amount);
  const isPOS = typeof s.note === 'string' && s.note.startsWith('POS:');

  // ถ้ามีการระบุ serviceFee มาโดยตรงจาก POS ให้ใช้ค่านั้นเป็นอันดับแรก
  if (s.serviceFee !== undefined && s.serviceFee !== null && s.serviceFee !== '') {
    return parseNumber(s.serviceFee);
  }

  // 1. กดสิว = 10 บาท
  if (typeName.includes('กดสิว')) {
    return 10;
  }

  // 2. ขัดตัว / สปา = 100 บาท
  if (typeName.includes('สปา') || typeName.includes('ขัดตัว')) {
    return 100;
  }

  // 3. IPL และ รายการจี้ (จี้ไฝ/กระ/ติ่งเนื้อ) = คำนวณตามบิล (ยอด < 1,000 ได้ 10%, ยอด >= 1,000 ได้ 20%)
  if (typeName.includes('จี้') || typeName.includes('ipl') || typeName.includes('mole') || typeName.includes('กระ') || typeName.includes('ติ่งเนื้อ') || typeName.includes('เลเซอร์')) {
    if (isPOS && (typeName.includes('จี้') || typeName.includes('mole')) && rawAmount < 100) {
      rawAmount = rawAmount * 10;
    }
    if (rawAmount > 0) {
      return rawAmount < 1000 ? Math.round(rawAmount * 0.10) : Math.round(rawAmount * 0.20);
    }
    return 50;
  }

  // 4. นวดหน้า / ทรีทเม้นท์ / Active Skin = 50 บาท
  if (typeName.includes('นวดหน้า') || typeName.includes('active skin') || typeName.includes('ทรีทเม้นท์') || typeName.includes('ทรีตเมนต์')) {
    return 50;
  }

  return isPOS ? Math.round(rawAmount * 0.10) : rawAmount;
}

/**
 * Unified monthly payroll calculation shared across EmployeeDashboard, EmployeePortal, FinancialDashboard, and PayslipModal.
 */
export function calculateEmployeeMonthlyPayroll(
  emp,
  payrollMonth,
  {
    histories = [],
    serviceLogs = [],
    advancePayments = [],
    attendance = [],
    leaves = [],
    localOverrides = null,
    localBaseSalary = undefined,
  } = {}
) {
  if (!emp) return null;

  let rawCommission = 0;
  let serviceCount = 0;

  histories.forEach((h) => {
    if (!isInPayrollMonth(h, payrollMonth)) return;
    if (!isHistoryValidForCommission(h)) return;

    const sName = String(
      getFuzzyKey(h, ['ชื่อเจ้าหน้าที่', 'ชื่อพนักงาน', 'staffName', 'ผู้ให้บริการ', 'เจ้าหน้าที่', 'พนักงาน', 'paymentStaff']) || ''
    );
    if (!sName) return;

    const staffNames = sName
      .split(/[,/]|และ|กับ/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (staffNames.includes(emp.name)) {
      const price = parseNumber(getFuzzyKey(h, ['ราคา', 'price', 'จำนวนเงิน', 'ยอดเงิน']) || 0);
      const typeStr = String(getFuzzyKey(h, ['ประเภท', 'col_4']) || '');
      const itemStr = String(getFuzzyKey(h, ['สินค้า', 'รายการ', 'col_18']) || '');
      const actionType = String(h.actionType || '');
      const shareCount = staffNames.length || 1;

      // 🌟 ตัดคอร์ส / รับบริการ / เบิกของแถม: ไม่ใช่การซื้อคอร์สหรือซื้อเพิ่ม พนักงานต้องไม่ได้ค่าขายคอร์ส (0 บ.)
      const isCourseDeduction = 
        typeStr.includes('ใช้คอส') ||
        typeStr.includes('ใช้คอร์ส') ||
        typeStr.includes('ตัดคอส') ||
        typeStr.includes('ตัดคอร์ส') ||
        typeStr.includes('รับบริการ') ||
        typeStr.includes('เบิก') ||
        typeStr.includes('เคลม') ||
        actionType === 'usage' ||
        actionType === 'claim_item' ||
        h.isUsage ||
        h.noCourseCommission;

      if (isCourseDeduction) {
        // 🌟 ตัดคอร์ส / รับบริการ / เบิกของแถม: พนักงานไม่ได้ค่าขายคอร์ส (คิดเฉพาะค่ามือ DF ใน serviceLogs)
      } else if (typeStr.includes('ซื้อสินค้า')) {
        rawCommission += (price * ((parseFloat(emp.productCommissionRate) || 0) / 100)) / shareCount;
      } else if (typeStr.includes('บริการ') || typeStr.includes('จี้') || itemStr.includes('จี้') || h.isService || h.noCourseCommission || h.type === 'service') {
        // 🌟 รายการจี้ / หัตถการรายครั้ง: คิดเป็นค่ามือ (DF) ตามบิล ไม่คำนวณเป็นค่าคอมคอร์ส
      } else if (typeStr.includes('ซื้อคอส') || typeStr.includes('ซื้อคอร์ส') || typeStr.includes('ซื้อเพิ่ม') || typeStr.includes('อัพคอร์ส') || typeStr.includes('เปิดคอร์ส') || (!typeStr && price > 0)) {
        // 🌟 เฉพาะการซื้อคอร์สใหม่ หรือซื้อเพิ่มเท่านั้น ที่ได้ค่าคอมคอร์ส
        // ตรวจสอบกรณีคอร์สที่รวมเซตผลิตภัณฑ์ (พนักงานจะได้ค่าคอมแยกคอร์สกับสินค้า)
        const courseBase = parseNumber(h.courseCommissionBase ?? (h.coursePrice ? parseNumber(h.coursePrice) * parseQty(h['จำนวน'] || 1) : null));
        const prodBase = parseNumber(h.productCommissionBase ?? (h.productPrice ? parseNumber(h.productPrice) * parseQty(h['จำนวน'] || 1) : null));

        if (courseBase > 0 || prodBase > 0) {
          rawCommission += (courseBase * ((parseFloat(emp.commissionRate) || 0) / 100)) / shareCount;
          rawCommission += (prodBase * ((parseFloat(emp.productCommissionRate) || 0) / 100)) / shareCount;
        } else {
          // Dynamic fallback for courses with product sets
          const cleanItemStr = (itemStr || '').toLowerCase();
          const isBundle = 
            cleanItemStr.includes('รวมผลิตภัณฑ์') || 
            cleanItemStr.includes('เซตผลิตภัณฑ์') || 
            cleanItemStr.includes('ชุดรักษา') || 
            (cleanItemStr.includes('activeskin') && cleanItemStr.includes('set'));

          if (isBundle) {
            let baseCoursePrice = 0;
            if (cleanItemStr.includes('1999') || price === 1999) baseCoursePrice = 899;
            else if (cleanItemStr.includes('1199') || price === 1199) baseCoursePrice = 899;
            else if (price > 899) baseCoursePrice = 899;

            if (baseCoursePrice > 0 && price > baseCoursePrice) {
              const cPart = baseCoursePrice;
              const pPart = price - baseCoursePrice;
              rawCommission += (cPart * ((parseFloat(emp.commissionRate) || 0) / 100)) / shareCount;
              rawCommission += (pPart * ((parseFloat(emp.productCommissionRate) || 0) / 100)) / shareCount;
            } else {
              rawCommission += (price * ((parseFloat(emp.commissionRate) || 0) / 100)) / shareCount;
            }
          } else {
            rawCommission += (price * ((parseFloat(emp.commissionRate) || 0) / 100)) / shareCount;
          }
        }
      }
      serviceCount++;
    }
  });

  const empServiceLogs = (serviceLogs || []).filter(
    (s) => s.employeeId === emp.id && isInPayrollMonth(s, payrollMonth)
  );
  let rawServiceFees = 0;
  empServiceLogs.forEach((s) => {
    rawServiceFees += calculateServiceLogFee(s);
  });

  const empAdvances = (advancePayments || []).filter(
    (a) =>
      a.employeeId === emp.id &&
      (a.status === 'อนุมัติ' || a.status === 'อนุมัติแล้ว') &&
      isInPayrollMonth(a, payrollMonth)
  );
  let rawAdvances = 0;
  empAdvances.forEach((a) => {
    rawAdvances += parseNumber(a.amount);
  });

  // 1. วันที่มาทำงานจริงจากประวัติตอกบัตร
  const empAttendance = (attendance || []).filter(
    (a) => a.employeeId === emp.id && isInPayrollMonth(a, payrollMonth)
  );
  const daysWorked = new Set(
    empAttendance.map((a) => a.date || getLocalYYYYMMDD(a.clockIn || a.createdAt)).filter(Boolean)
  ).size;

  // 2. วันลาที่ได้รับอนุมัติ (เช่น ลาพักร้อน, ลาป่วยตามสิทธิ์)
  let approvedLeaveDays = 0;
  (leaves || []).forEach((l) => {
    if (l.employeeId !== emp.id) return;
    const st = String(l.status || '').trim();
    if (st !== 'อนุมัติ' && st !== 'อนุมัติแล้ว') return;
    const lType = String(l.leaveType || '');
    if (!lType.includes('พักร้อน') && !lType.includes('ป่วย') && !lType.includes('ประจำปี')) return;
    
    if (Array.isArray(l.dates) && l.dates.length > 0) {
      l.dates.forEach(d => {
        if (d && String(d).startsWith(payrollMonth)) approvedLeaveDays++;
      });
    } else if (l.startDate) {
      const startStr = getLocalYYYYMMDD(l.startDate);
      const endStr = l.endDate ? getLocalYYYYMMDD(l.endDate) : startStr;
      if (startStr.startsWith(payrollMonth) || endStr.startsWith(payrollMonth)) {
        const sD = new Date(startStr);
        const eD = new Date(endStr);
        const diff = Math.max(0, Math.round((eD - sD) / (1000 * 60 * 60 * 24))) + 1;
        approvedLeaveDays += diff;
      }
    }
  });

  // 3. วันในเดือน และ สิทธิ์วันหยุด 4 วัน
  const [yearNum, monthNum] = (payrollMonth || getLocalYYYYMMDD().substring(0, 7)).split('-').map(Number);
  const totalDaysInMonth = (yearNum && monthNum) ? new Date(yearNum, monthNum, 0).getDate() : 30;
  const allowedDaysOff = 4; // พนักงานได้รับสิทธิ์วันหยุด 4 วันต่อเดือน
  const expectedWorkingDays = Math.max(0, totalDaysInMonth - allowedDaysOff); // เช่น 30 - 4 = 26 วัน

  // 4. คำนวณฐานเงินเดือนจริง และหักลบวันที่ไม่ได้ทำงานเลย
  const rawBaseSalary = Math.ceil(
    parseNumber(localBaseSalary !== undefined ? localBaseSalary : emp.baseSalary || 0)
  );
  const dailyRate = totalDaysInMonth > 0 ? (rawBaseSalary / totalDaysInMonth) : 0;

  // วันที่ได้รับค่าจ้าง = วันทำงานจริง + สิทธิ์วันหยุด 4 วัน + วันลาที่ได้รับอนุมัติ
  let paidDays = 0;
  let missingDays = 0;
  let autoAbsenceDeduction = 0;
  let autoBaseSalary = 0;

  if (rawBaseSalary === 0) {
    paidDays = daysWorked;
    missingDays = 0;
    autoAbsenceDeduction = 0;
    autoBaseSalary = 0;
  } else if (daysWorked === 0 && approvedLeaveDays === 0) {
    // ไม่ได้มาทำงานเลยทั้งเดือน และไม่มีวันลาที่อนุมัติ
    paidDays = 0;
    missingDays = totalDaysInMonth;
    autoAbsenceDeduction = rawBaseSalary;
    autoBaseSalary = 0;
  } else {
    paidDays = Math.min(totalDaysInMonth, daysWorked + allowedDaysOff + approvedLeaveDays);
    missingDays = Math.max(0, totalDaysInMonth - paidDays);
    autoAbsenceDeduction = Math.round(missingDays * dailyRate);
    autoBaseSalary = Math.max(0, rawBaseSalary - autoAbsenceDeduction);
  }

  const foodRate = emp.foodAllowanceRate !== undefined ? Number(emp.foodAllowanceRate) : 50;
  const autoFoodAllowance = daysWorked * foodRate;
  const autoCommission = Math.ceil(rawCommission);
  const autoServiceFees = Math.ceil(rawServiceFees);
  const autoAdvances = Math.ceil(rawAdvances);
  const autoDiligenceAllowance =
    (emp.diligenceAllowance !== undefined && missingDays === 0 && daysWorked > 0)
      ? Math.ceil(parseNumber(emp.diligenceAllowance))
      : 0;

  const monthOverride =
    (localOverrides && localOverrides[payrollMonth]) ||
    emp.payrollOverrides?.[payrollMonth] ||
    {};

  const hasVal = (v) => v !== undefined && v !== null && v !== '';
  const hasOverride = ['baseSalary', 'totalCommission', 'totalServiceFees', 'totalFoodAllowance', 'diligenceAllowance', 'totalAdvances', 'absenceDeduction'].some(
    (k) => hasVal(monthOverride[k])
  );

  const baseSalary = hasVal(monthOverride.baseSalary)
    ? parseNumber(monthOverride.baseSalary)
    : autoBaseSalary;
  const absenceDeduction = hasVal(monthOverride.absenceDeduction)
    ? parseNumber(monthOverride.absenceDeduction)
    : autoAbsenceDeduction;
  const totalCommission = hasVal(monthOverride.totalCommission)
    ? parseNumber(monthOverride.totalCommission)
    : autoCommission;
  const totalServiceFees = hasVal(monthOverride.totalServiceFees)
    ? parseNumber(monthOverride.totalServiceFees)
    : autoServiceFees;
  const totalFoodAllowance = hasVal(monthOverride.totalFoodAllowance)
    ? parseNumber(monthOverride.totalFoodAllowance)
    : autoFoodAllowance;
  const diligenceAllowance = hasVal(monthOverride.diligenceAllowance)
    ? parseNumber(monthOverride.diligenceAllowance)
    : autoDiligenceAllowance;
  const totalAdvances = hasVal(monthOverride.totalAdvances)
    ? parseNumber(monthOverride.totalAdvances)
    : autoAdvances;

  const totalIncome =
    baseSalary +
    totalCommission +
    totalServiceFees +
    totalFoodAllowance +
    diligenceAllowance -
    totalAdvances;

  return {
    ...emp,
    rawBaseSalary,
    baseSalary,
    absenceDeduction,
    missingDays,
    totalDaysInMonth,
    allowedDaysOff,
    expectedWorkingDays,
    paidDays,
    approvedLeaveDays,
    dailyRate,
    totalCommission,
    totalServiceFees,
    totalFoodAllowance,
    diligenceAllowance,
    totalAdvances,
    autoRawBaseSalary: rawBaseSalary,
    autoBaseSalary,
    autoAbsenceDeduction,
    autoCommission,
    autoServiceFees,
    autoFoodAllowance,
    autoDiligenceAllowance,
    autoAdvances,
    hasOverride,
    totalIncome,
    netSalary: totalIncome,
    daysWorked,
    serviceCount,
    serviceLogCount: empServiceLogs.length,
  };
}
