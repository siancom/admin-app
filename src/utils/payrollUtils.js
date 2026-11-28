import { getFuzzyKey } from './fuzzy';
import { parseNumber, parseQty, getLocalYYYYMMDD } from './parse';
import { isInPayrollMonth, getOrderStatus } from './dateUtils';

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
  if (s.isCancelled || s.status === 'ยกเลิก' || s.status === 'cancelled') return 0;
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
 * Returns itemized lists of product commission items and course commission items for an employee.
 */
export function calculateEmployeeCommissionDetails(emp, payrollMonth, { histories = [], orders = [], masterCourses = [] } = {}) {
  if (!emp) {
    return {
      productItems: [],
      courseItems: [],
      totalProductCommission: 0,
      totalCourseCommission: 0,
      totalProductSales: 0,
      totalCourseSales: 0,
    };
  }

  const productItems = [];
  const courseItems = [];
  let totalProductCommission = 0;
  let totalCourseCommission = 0;
  let totalProductSales = 0;
  let totalCourseSales = 0;

  const processedKeys = new Set();
  const rateCourse = parseFloat(emp.commissionRate) || 0;
  const rateProduct = parseFloat(emp.productCommissionRate) || 0;

  const empNameLower = String(emp.name || '').trim().toLowerCase();
  const empNicknameLower = String(emp.nickname || '').trim().toLowerCase();

  const isEmpMatched = (str) => {
    if (!str) return false;
    const clean = String(str).trim().toLowerCase();
    if (empNameLower && (clean === empNameLower || clean.includes(empNameLower) || empNameLower.includes(clean))) return true;
    if (empNicknameLower && (clean === empNicknameLower || clean.includes(empNicknameLower) || empNicknameLower.includes(clean))) return true;
    return false;
  };

  (histories || []).forEach((h, idx) => {
    if (!isInPayrollMonth(h, payrollMonth)) return;
    if (!isHistoryValidForCommission(h)) return;

    const sName = String(
      getFuzzyKey(h, ['ชื่อเจ้าหน้าที่', 'ชื่อพนักงาน', 'staffName', 'ผู้ให้บริการ', 'เจ้าหน้าที่', 'พนักงาน', 'paymentStaff']) || ''
    );
    if (!sName) return;

    const staffNames = sName.split(/[,/]|และ|กับ/).map((s) => s.trim()).filter(Boolean);
    if (!staffNames.some(s => isEmpMatched(s))) return;

    const price = parseNumber(getFuzzyKey(h, ['ราคา', 'price', 'จำนวนเงิน', 'ยอดเงิน']) || 0);
    const typeStr = String(getFuzzyKey(h, ['ประเภท', 'col_4']) || '');
    const itemStr = String(getFuzzyKey(h, ['สินค้า', 'รายการ', 'col_18']) || '');
    const actionType = String(h.actionType || '');
    const shareCount = staffNames.length || 1;
    const orderNo = String(getFuzzyKey(h, ['หมายเลขคำสั่งซื้อ', 'orderNo', 'refNo', 'col_5', 'col_6']) || '').trim();
    const dateStr = String(getFuzzyKey(h, ['วันที่', 'date', 'col_1']) || '');
    const timeStr = String(getFuzzyKey(h, ['เวลา', 'time']) || '');
    const custName = String(getFuzzyKey(h, ['ชื่อลูกค้า', 'customerName', 'col_2']) || 'ลูกค้าทั่วไป');
    const custPhone = String(getFuzzyKey(h, ['เบอร์โทร', 'phone', 'col_3']) || '');

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

    if (isCourseDeduction) return;

    const itemKey = `${orderNo || 'NO_ORD'}_${itemStr}_${price}_${idx}`;
    processedKeys.add(itemKey);

    if (typeStr.includes('ซื้อสินค้า')) {
      const salesShare = price / shareCount;
      const comm = (price * (rateProduct / 100)) / shareCount;
      totalProductCommission += comm;
      totalProductSales += salesShare;
      productItems.push({
        id: h.id || `h_prod_${idx}`,
        orderNo,
        date: dateStr,
        time: timeStr,
        itemName: itemStr || 'สินค้า',
        customerName: custName,
        customerPhone: custPhone,
        price,
        salesShare,
        shareCount,
        staffNames,
        rate: rateProduct,
        commission: comm,
        branch: h.branch || emp.branch,
        rawRecord: h
      });
    } else if (typeStr.includes('บริการ') || typeStr.includes('จี้') || itemStr.includes('จี้') || h.isService || h.noCourseCommission || h.type === 'service') {
      // Hand fee (handled in serviceLogs)
    } else if (typeStr.includes('ซื้อคอส') || typeStr.includes('ซื้อคอร์ส') || typeStr.includes('ซื้อเพิ่ม') || typeStr.includes('อัพคอร์ส') || typeStr.includes('เปิดคอร์ส') || (!typeStr && price > 0)) {
      let courseBase = parseNumber(h.courseCommissionBase ?? (h.coursePrice ? parseNumber(h.coursePrice) * parseQty(h['จำนวน'] || 1) : null));
      let prodBase = parseNumber(h.productCommissionBase ?? (h.productPrice ? parseNumber(h.productPrice) * parseQty(h['จำนวน'] || 1) : null));

      if (courseBase <= 0 && prodBase <= 0 && Array.isArray(masterCourses) && masterCourses.length > 0) {
        const matchedMaster = masterCourses.find(mc => 
          mc.id === h.courseId || 
          mc.id === h.id ||
          String(mc["ชื่อคอส"] || mc.name || '').trim() === itemStr.trim() ||
          itemStr.includes(String(mc["ชื่อคอส"] || mc.name || '').trim())
        );
        if (matchedMaster) {
          let opt = null;
          if (Array.isArray(matchedMaster.promoOptions)) {
            opt = matchedMaster.promoOptions.find(o => itemStr.includes(o.name) || (o.price && Number(o.price) === price));
          }
          const cPrice = Number(opt?.coursePrice ?? matchedMaster.coursePrice ?? 0);
          const pPrice = Number(opt?.productPrice ?? matchedMaster.productPrice ?? 0);
          if (cPrice > 0 || pPrice > 0) {
            courseBase = cPrice > 0 ? cPrice : Math.max(0, price - pPrice);
            prodBase = pPrice > 0 ? pPrice : Math.max(0, price - courseBase);
          }
        }
      }

      let effectiveCourseBase = price;
      let effectiveProdBase = 0;

      if (courseBase > 0 || prodBase > 0) {
        effectiveCourseBase = courseBase;
        effectiveProdBase = prodBase;
      } else {
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
            effectiveCourseBase = baseCoursePrice;
            effectiveProdBase = price - baseCoursePrice;
          }
        }
      }

      if (effectiveCourseBase > 0) {
        const salesShare = effectiveCourseBase / shareCount;
        const comm = (effectiveCourseBase * (rateCourse / 100)) / shareCount;
        totalCourseCommission += comm;
        totalCourseSales += salesShare;
        courseItems.push({
          id: h.id || `h_crs_${idx}`,
          orderNo,
          date: dateStr,
          time: timeStr,
          itemName: itemStr || 'คอร์สทรีทเม้นท์',
          customerName: custName,
          customerPhone: custPhone,
          price: effectiveCourseBase,
          totalBillPrice: price,
          salesShare,
          shareCount,
          staffNames,
          rate: rateCourse,
          commission: comm,
          branch: h.branch || emp.branch,
          rawRecord: h
        });
      }

      if (effectiveProdBase > 0) {
        const salesShare = effectiveProdBase / shareCount;
        const comm = (effectiveProdBase * (rateProduct / 100)) / shareCount;
        totalProductCommission += comm;
        totalProductSales += salesShare;
        productItems.push({
          id: `${h.id || `h_prod_bundle_${idx}`}_bundle`,
          orderNo,
          date: dateStr,
          time: timeStr,
          itemName: `${itemStr} (เซตผลิตภัณฑ์คู่คอร์ส)`,
          customerName: custName,
          customerPhone: custPhone,
          price: effectiveProdBase,
          salesShare,
          shareCount,
          staffNames,
          rate: rateProduct,
          commission: comm,
          isBundle: true,
          branch: h.branch || emp.branch,
          rawRecord: h
        });
      }
    }
  });

  // Check orders to catch any POS orders not present in histories
  (orders || []).forEach((o) => {
    if (!o.createdAt || getOrderStatus(o) === 'ยกเลิก') return;
    if (!isInPayrollMonth(o, payrollMonth)) return;

    const staffStr = String(o.paymentStaff || o.staffName || o.seller || o.employeeName || o.cashier || '');
    const staffList = staffStr.split(/[,/]|และ|กับ/).map((s) => s.trim()).filter(Boolean);
    if (!staffList.some(s => isEmpMatched(s))) return;

    const shareCount = staffList.length || 1;
    const orderNo = String(o.orderNo || o.id || '').trim();
    const dateStr = getLocalYYYYMMDD(o.createdAt);
    const timeStr = new Date(o.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const custName = o.customerName || 'ลูกค้าทั่วไป';
    const custPhone = o.customerPhone || '';

    if (Array.isArray(o.cartItems) && o.cartItems.length > 0) {
      o.cartItems.forEach((it, itIdx) => {
        const itemKey = `${orderNo}_${it.name}_${it.price}_${itIdx}`;
        if (processedKeys.has(itemKey)) return;
        processedKeys.add(itemKey);

        const itPrice = parseNumber(it.price) * (Number(it.qty) || 1);
        if (itPrice <= 0) return;

        if (it.type === 'product') {
          const salesShare = itPrice / shareCount;
          const comm = (itPrice * (rateProduct / 100)) / shareCount;
          totalProductCommission += comm;
          totalProductSales += salesShare;
          productItems.push({
            id: `ord_${orderNo}_p_${itIdx}`,
            orderNo,
            date: dateStr,
            time: timeStr,
            itemName: it.name || 'สินค้า',
            customerName: custName,
            customerPhone: custPhone,
            price: itPrice,
            salesShare,
            shareCount,
            staffNames: staffList,
            rate: rateProduct,
            commission: comm,
            branch: o.branch || emp.branch,
            linkedOrder: o
          });
        } else if (it.type === 'course' || it.type === 'single_course') {
          const salesShare = itPrice / shareCount;
          const comm = (itPrice * (rateCourse / 100)) / shareCount;
          totalCourseCommission += comm;
          totalCourseSales += salesShare;
          courseItems.push({
            id: `ord_${orderNo}_c_${itIdx}`,
            orderNo,
            date: dateStr,
            time: timeStr,
            itemName: it.name || 'คอร์สทรีทเม้นท์',
            customerName: custName,
            customerPhone: custPhone,
            price: itPrice,
            salesShare,
            shareCount,
            staffNames: staffList,
            rate: rateCourse,
            commission: comm,
            branch: o.branch || emp.branch,
            linkedOrder: o
          });
        }
      });
    }
  });

  return {
    productItems,
    courseItems,
    totalProductCommission: Math.ceil(totalProductCommission),
    totalCourseCommission: Math.ceil(totalCourseCommission),
    totalProductSales: Math.round(totalProductSales),
    totalCourseSales: Math.round(totalCourseSales),
  };
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
    masterCourses = [],
    courses = [],
    orders = [],
  } = {}
) {
  if (!emp) return null;

  const empNameLower = String(emp.name || '').trim().toLowerCase();
  const empNicknameLower = String(emp.nickname || '').trim().toLowerCase();

  const isEmpMatched = (str) => {
    if (!str) return false;
    const clean = String(str).trim().toLowerCase();
    if (empNameLower && (clean === empNameLower || clean.includes(empNameLower) || empNameLower.includes(clean))) return true;
    if (empNicknameLower && (clean === empNicknameLower || clean.includes(empNicknameLower) || empNicknameLower.includes(clean))) return true;
    return false;
  };

  const commDetails = calculateEmployeeCommissionDetails(emp, payrollMonth, {
    histories,
    orders,
    masterCourses
  });
  const rawProductCommission = commDetails.totalProductCommission;
  const rawCourseCommission = commDetails.totalCourseCommission;
  const rawCommission = rawProductCommission + rawCourseCommission;
  const rawProductSales = commDetails.totalProductSales;
  const rawCourseSales = commDetails.totalCourseSales;
  const serviceCount = commDetails.productItems.length + commDetails.courseItems.length;

  const empServiceLogs = (serviceLogs || []).filter(
    (s) => (s.employeeId === emp.id || isEmpMatched(s.employeeName) || isEmpMatched(s.sharedWith)) &&
           isInPayrollMonth(s, payrollMonth) &&
           !s.isCancelled && s.status !== 'ยกเลิก' && s.status !== 'cancelled'
  );
  let rawServiceFees = 0;
  empServiceLogs.forEach((s) => {
    rawServiceFees += calculateServiceLogFee(s);
  });

  const empAdvances = (advancePayments || []).filter(
    (a) =>
      (a.employeeId === emp.id || isEmpMatched(a.employeeName)) &&
      (a.status === 'อนุมัติ' || a.status === 'อนุมัติแล้ว') &&
      isInPayrollMonth(a, payrollMonth)
  );
  let rawAdvances = 0;
  empAdvances.forEach((a) => {
    rawAdvances += parseNumber(a.amount);
  });

  // 1. วันที่มาทำงานจริงจากประวัติตอกบัตร
  const empAttendance = (attendance || []).filter(
    (a) => (a.employeeId === emp.id || isEmpMatched(a.employeeName)) && isInPayrollMonth(a, payrollMonth)
  );
  const daysWorked = new Set(
    empAttendance.map((a) => a.date || getLocalYYYYMMDD(a.clockIn || a.createdAt)).filter(Boolean)
  ).size;

  // 2. วันลาที่ได้รับอนุมัติ (เช่น ลาพักร้อน, ลาป่วยตามสิทธิ์)
  let approvedLeaveDays = 0;
  (leaves || []).forEach((l) => {
    if (l.employeeId !== emp.id && !isEmpMatched(l.employeeName)) return;
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

  const currentMonthPrefix = getLocalYYYYMMDD().substring(0, 7);
  const isCurrentMonth = payrollMonth === currentMonthPrefix;
  const todayDate = new Date();
  const currentDay = isCurrentMonth ? Math.min(totalDaysInMonth, todayDate.getDate()) : totalDaysInMonth;

  // วันที่ได้รับค่าจ้าง = วันทำงานจริง + สิทธิ์วันหยุด 4 วัน + วันลาที่ได้รับอนุมัติ
  let paidDays = 0;
  let missingDays = 0;
  let autoAbsenceDeduction = 0;
  let autoBaseSalary = rawBaseSalary;

  if (rawBaseSalary === 0) {
    paidDays = daysWorked;
    missingDays = 0;
    autoAbsenceDeduction = 0;
    autoBaseSalary = 0;
  } else if (daysWorked === 0 && approvedLeaveDays === 0) {
    if (isCurrentMonth && currentDay < 5) {
      paidDays = 0;
      missingDays = 0;
      autoAbsenceDeduction = 0;
      autoBaseSalary = rawBaseSalary;
    } else {
      paidDays = 0;
      missingDays = isCurrentMonth ? Math.max(0, currentDay - allowedDaysOff) : totalDaysInMonth;
      autoAbsenceDeduction = Math.round(missingDays * dailyRate);
      autoBaseSalary = Math.max(0, rawBaseSalary - autoAbsenceDeduction);
    }
  } else {
    paidDays = Math.min(totalDaysInMonth, daysWorked + allowedDaysOff + approvedLeaveDays);
    if (isCurrentMonth) {
      // 🌟 Real-time ในระหว่างเดือน: ไม่หักวันในอนาคตที่ยังไม่ถึง
      missingDays = Math.max(0, currentDay - paidDays);
    } else {
      missingDays = Math.max(0, totalDaysInMonth - paidDays);
    }
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

  // 🌟 คำนวณยอดค้างชำระสินค้า / คอร์ส ของพนักงาน (Pending Debt)
  const empPhoneClean = String(emp.phone || '').replace(/\D/g, '');
  const empId = String(emp.id || '');
  const linkedCustId = String(emp.linkedCustomerId || '');

  const pendingDebtCourses = (courses || []).filter((c) => {
    if (c.isCancelled || c.status === 'ยกเลิก' || c.status === 'cancelled') return false;
    const pending = Number(c.computedPendingAmount ?? parseNumber(getFuzzyKey(c, ['ยอดค้างชำระ', 'pending', 'col_pending']))) || 0;
    if (pending <= 0) return false;

    const cPhoneClean = String(c.cleanPhone || c.computedPhone || getFuzzyKey(c, ['เบอร์โทร', 'col_1', 'col_3']) || '').replace(/\D/g, '');
    const cName = String(c.computedCustomerName || getFuzzyKey(c, ['ผู้ซื้อคอส', 'ชื่อลูกค้า', 'col_9', 'col_2']) || '').trim().toLowerCase();
    const cEmpId = String(c.employeeId || '');
    const cCustId = String(c.customerId || c.id || '');

    const isDirectMatch = (cEmpId && (cEmpId === empId || cEmpId === emp.name)) ||
      (linkedCustId && cCustId === linkedCustId);

    const isPhoneMatch = empPhoneClean && cPhoneClean && empPhoneClean === cPhoneClean;

    const isNameMatch = (empNameLower && cName && (cName === empNameLower || cName.includes(empNameLower) || empNameLower.includes(cName))) ||
      (empNicknameLower && cName && (cName === empNicknameLower || cName.includes(empNicknameLower) || empNicknameLower.includes(cName)));

    return isDirectMatch || isPhoneMatch || isNameMatch;
  });

  const rawPendingDebt = pendingDebtCourses.reduce((sum, c) => {
    return sum + (Number(c.computedPendingAmount ?? parseNumber(getFuzzyKey(c, ['ยอดค้างชำระ', 'pending', 'col_pending']))) || 0);
  }, 0);

  const pendingDebtOrders = (orders || []).filter((o) => {
    if (o.isCancelled || o.status === 'ยกเลิก' || o.status === 'cancelled') return false;
    let pending = Number(o.pendingAmount ?? o.unpaidAmount ?? 0);
    if (pending <= 0 && o.splitPayment && Number(o.splitPayment.cod) > 0) {
      pending = Number(o.splitPayment.cod);
    }
    if (pending <= 0 && String(o.paymentMethod || '').includes('ค้าง')) {
      const match = String(o.paymentMethod).match(/(?:ค้าง\/COD|ค้าง|COD):\s*([\d.]+)/);
      if (match) pending = parseFloat(match[1]);
    }
    if (pending <= 0) return false;

    const oPhoneClean = String(o.cleanPhone || o.customerPhone || '').replace(/\D/g, '');
    const oName = String(o.customerName || '').trim().toLowerCase();
    const oEmpId = String(o.employeeId || '');
    const oCustId = String(o.customerId || '');

    const isDirectMatch = (oEmpId && (oEmpId === empId || oEmpId === emp.name)) ||
      (linkedCustId && oCustId === linkedCustId);

    const isPhoneMatch = empPhoneClean && oPhoneClean && empPhoneClean === oPhoneClean;

    const isNameMatch = (empNameLower && oName && (oName === empNameLower || oName.includes(empNameLower) || empNameLower.includes(oName))) ||
      (empNicknameLower && oName && (oName === empNicknameLower || oName.includes(empNicknameLower) || empNicknameLower.includes(oName)));

    return isDirectMatch || isPhoneMatch || isNameMatch;
  });

  const totalOrderDebt = pendingDebtOrders.reduce((sum, o) => {
    let pending = Number(o.pendingAmount ?? o.unpaidAmount ?? 0);
    if (pending <= 0 && o.splitPayment && Number(o.splitPayment.cod) > 0) {
      pending = Number(o.splitPayment.cod);
    }
    if (pending <= 0 && String(o.paymentMethod || '').includes('ค้าง')) {
      const match = String(o.paymentMethod).match(/(?:ค้าง\/COD|ค้าง|COD):\s*([\d.]+)/);
      if (match) pending = parseFloat(match[1]);
    }
    return sum + pending;
  }, 0);

  const autoPendingDebt = rawPendingDebt + totalOrderDebt;

  const monthOverride =
    (localOverrides && localOverrides[payrollMonth]) ||
    emp.payrollOverrides?.[payrollMonth] ||
    {};

  const hasVal = (v) => v !== undefined && v !== null && v !== '';
  const hasOverride = ['baseSalary', 'totalCommission', 'totalServiceFees', 'totalFoodAllowance', 'diligenceAllowance', 'totalAdvances', 'absenceDeduction', 'totalPendingDebt'].some(
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
  const totalPendingDebt = hasVal(monthOverride.totalPendingDebt)
    ? parseNumber(monthOverride.totalPendingDebt)
    : autoPendingDebt;

  // 🌟 รายได้รวมทั้งหมดก่อนหัก (Gross Total Earnings)
  const autoGrossEarnings =
    autoBaseSalary +
    autoCommission +
    autoServiceFees +
    autoFoodAllowance +
    autoDiligenceAllowance;

  const grossEarnings =
    baseSalary +
    totalCommission +
    totalServiceFees +
    totalFoodAllowance +
    diligenceAllowance;

  const totalDeductions = totalAdvances + totalPendingDebt;

  // รายรับสุทธิคงเหลือจ่ายจริง (Net Remaining Payable)
  const totalIncome = grossEarnings - totalDeductions;

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
    grossEarnings,
    autoGrossEarnings,
    totalDeductions,
    totalCommission,
    totalProductCommission: Math.ceil(rawProductCommission),
    totalCourseCommission: Math.ceil(rawCourseCommission),
    totalProductSales: Math.round(rawProductSales),
    totalCourseSales: Math.round(rawCourseSales),
    totalServiceFees,
    totalFoodAllowance,
    diligenceAllowance,
    totalAdvances,
    totalPendingDebt,
    autoPendingDebt,
    pendingDebtCourses,
    pendingDebtOrders,
    commissionDetails: commDetails,
    productItems: commDetails.productItems,
    courseItems: commDetails.courseItems,
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
