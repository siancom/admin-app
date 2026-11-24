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
      const shareCount = staffNames.length || 1;
      if (typeStr.includes('ซื้อสินค้า')) {
        rawCommission += (price * ((parseFloat(emp.productCommissionRate) || 0) / 100)) / shareCount;
      } else if (typeStr.includes('บริการ') || typeStr.includes('จี้') || itemStr.includes('จี้') || h.isService || h.noCourseCommission || h.type === 'service') {
        // 🌟 รายการจี้ / หัตถการรายครั้ง: คิดเป็นค่ามือ (DF) ตามบิล ไม่คำนวณเป็นค่าคอมคอร์ส
      } else {
        rawCommission += (price * ((parseFloat(emp.commissionRate) || 0) / 100)) / shareCount;
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

  const empAttendance = (attendance || []).filter(
    (a) => a.employeeId === emp.id && isInPayrollMonth(a, payrollMonth)
  );
  const daysWorked = new Set(
    empAttendance.map((a) => a.date || getLocalYYYYMMDD(a.clockIn || a.createdAt)).filter(Boolean)
  ).size;

  const foodRate = emp.foodAllowanceRate !== undefined ? Number(emp.foodAllowanceRate) : 50;
  const autoFoodAllowance = daysWorked * foodRate;
  const autoBaseSalary = Math.ceil(
    parseNumber(localBaseSalary !== undefined ? localBaseSalary : emp.baseSalary || 0)
  );
  const autoCommission = Math.ceil(rawCommission);
  const autoServiceFees = Math.ceil(rawServiceFees);
  const autoAdvances = Math.ceil(rawAdvances);
  const autoDiligenceAllowance =
    emp.diligenceAllowance !== undefined ? Math.ceil(parseNumber(emp.diligenceAllowance)) : 0;

  const monthOverride =
    (localOverrides && localOverrides[payrollMonth]) ||
    emp.payrollOverrides?.[payrollMonth] ||
    {};

  const hasVal = (v) => v !== undefined && v !== null && v !== '';
  const hasOverride = ['baseSalary', 'totalCommission', 'totalServiceFees', 'totalFoodAllowance', 'diligenceAllowance', 'totalAdvances'].some(
    (k) => hasVal(monthOverride[k])
  );

  const baseSalary = hasVal(monthOverride.baseSalary)
    ? parseNumber(monthOverride.baseSalary)
    : autoBaseSalary;
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
    baseSalary,
    totalCommission,
    totalServiceFees,
    totalFoodAllowance,
    diligenceAllowance,
    totalAdvances,
    autoBaseSalary,
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
