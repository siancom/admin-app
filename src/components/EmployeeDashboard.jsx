import React, { useState, useMemo } from 'react';
import { Users, Clock, DollarSign, Plus, Trash2, Edit, UserCheck, UserMinus, Calendar, Printer, FileText, CheckCircle, History, Wallet, XCircle, ShoppingCart, Briefcase, Download, ExternalLink, User, LogIn, LogOut } from 'lucide-react';
import { db, getCol } from '../config/firebase';
import { addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { parseNumber } from '../utils/parse';
import { getFuzzyKey } from '../utils/fuzzy';
import { toPng } from 'html-to-image';
import PayslipModal from './PayslipModal';
import EmployeePortal from './EmployeePortal';
import JobApplicationModal from './JobApplicationModal';
import EmploymentContractModal from './EmploymentContractModal';
export default function EmployeeDashboard({ employees = [], attendance = [], histories = [], branches = [], leaves = [], advancePayments = [], dailySales = [], onGoToPOS, appSettings = {}, orders = [], serviceLogs = [], requisitions = [], jobApplications = [] }) {
  const [activeTab, setActiveTab] = useState('attendance');
  const [branchFilter, setBranchFilter] = useState('ทั้งหมด');
  const [selectedApplication, setSelectedApplication] = useState(null);

  // Employee Management State
  const [isEditingEmployee, setIsEditingEmployee] = useState(false);
  const [employeeFormTab, setEmployeeFormTab] = useState('general');
  const [employeeForm, setEmployeeForm] = useState({ id: null, name: '', phone: '', branch: 'เฉวง', baseSalary: '', commissionRate: '', productCommissionRate: '', foodAllowanceRate: 50, diligenceAllowance: 500, vipProductLimit: 2000, vipUniformAllowance: 1500, vipAnnualLeaveDays: 10, vipBirthdayBonus: 1000, vipProductDiscountRate: 30, weeklyDaysOff: [], employmentStatus: 'probation', employmentStartDate: new Date().toISOString().split('T')[0], probationDays: 119 });
  // Payroll Filter & Payslip State
  const [payrollMonth, setPayrollMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [selectedPayslipEmployee, setSelectedPayslipEmployee] = useState(null);
  const [selectedContractEmployee, setSelectedContractEmployee] = useState(null);
  const [isPrintingAction, setIsPrintingAction] = useState(false);

  // Attendance History State
  const [attendanceMonth, setAttendanceMonth] = useState(new Date().toISOString().substring(0, 7));
  const [scheduleMonth, setScheduleMonth] = useState(new Date().toISOString().substring(0, 7));
  const [editingAttendance, setEditingAttendance] = useState(null);
  const [historyEmployeeFilter, setHistoryEmployeeFilter] = useState('all');

  // Leave Management State
  const [isAddingLeave, setIsAddingLeave] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ id: null, employeeId: '', employeeName: '', leaveType: 'ลาป่วย', startDate: '', endDate: '', reason: '' });
  
  // Employee Portal State
  const [selectedEmployeeForPortal, setSelectedEmployeeForPortal] = useState(null);

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => branchFilter === 'ทั้งหมด' || e.branch === branchFilter);
  }, [employees, branchFilter]);
  const allRequests = useMemo(() => {
    const list = [];
    leaves.forEach(l => list.push({ ...l, reqType: 'leave', typeName: 'ขอลางาน', icon: 'Calendar' }));
    advancePayments.forEach(a => list.push({ ...a, reqType: 'advance', typeName: 'เบิกเงินล่วงหน้า', icon: 'Wallet' }));
    (requisitions || []).forEach(r => list.push({ ...r, reqType: 'supplies', typeName: 'เบิกของใช้', icon: 'ShoppingCart' }));
    
    // Sort by createdAt descending
    return list.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [leaves, advancePayments, requisitions]);


  // ==== Handle Employee Management ====
  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    try {
      const data = {
        name: employeeForm.name.trim(),
        phone: employeeForm.phone.trim(),
        branch: employeeForm.branch,
        baseSalary: parseNumber(employeeForm.baseSalary),
        commissionRate: parseNumber(employeeForm.commissionRate), // Percentage
        productCommissionRate: parseNumber(employeeForm.productCommissionRate), // Product Percentage
        foodAllowanceRate: parseNumber(employeeForm.foodAllowanceRate),
        diligenceAllowance: parseNumber(employeeForm.diligenceAllowance),
        weeklyDaysOff: employeeForm.weeklyDaysOff || [],
        employmentStatus: employeeForm.employmentStatus || 'probation',
        employmentStartDate: employeeForm.employmentStartDate || new Date().toISOString().split('T')[0],
        probationDays: parseInt(employeeForm.probationDays) || 119,
        vipProductLimit: parseNumber(employeeForm.vipProductLimit),
        usedVipProductLimit: parseNumber(employeeForm.usedVipProductLimit),
        vipUniformAllowance: parseNumber(employeeForm.vipUniformAllowance),
        usedVipUniformAllowance: parseNumber(employeeForm.usedVipUniformAllowance),
        vipAnnualLeaveDays: parseInt(employeeForm.vipAnnualLeaveDays) || 0,
        vipBirthdayBonus: parseNumber(employeeForm.vipBirthdayBonus),
        vipProductDiscountRate: parseNumber(employeeForm.vipProductDiscountRate),
        updatedAt: new Date().toISOString()
      };
      
      if (employeeForm.id) {
        await updateDoc(doc(db, 'employees', employeeForm.id), data);
      } else {
        data.createdAt = new Date().toISOString();
        await addDoc(getCol('employees'), data);
      }
      setIsEditingEmployee(false);
      setEmployeeForm({ id: null, name: '', phone: '', branch: 'เฉวง', baseSalary: '', commissionRate: '', productCommissionRate: '', foodAllowanceRate: 50, diligenceAllowance: 500, vipProductLimit: 2000, vipUniformAllowance: 1500, vipAnnualLeaveDays: 10, vipBirthdayBonus: 1000, vipProductDiscountRate: 30, weeklyDaysOff: [], employmentStatus: 'probation', employmentStartDate: new Date().toISOString().split('T')[0], probationDays: 119 });
      alert('บันทึกข้อมูลพนักงานสำเร็จ');
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการบันทึก: ' + err.message);
    }
  };

  const handleDeleteEmployee = async (id, name) => {
    if (window.confirm(`ต้องการลบพนักงาน ${name} หรือไม่?`)) {
      try {
        await deleteDoc(doc(db, 'employees', id));
      } catch (err) {
        alert('เกิดข้อผิดพลาด: ' + err.message);
      }
    }
  };

  // ==== Handle Attendance ====
  const getTodayAttendance = (empId) => {
    const today = new Date().toISOString().split('T')[0];
    return attendance.find(a => a.employeeId === empId && a.date === today);
  };

  const handleClockIn = async (empId, empName) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const time = new Date().toISOString();
      await addDoc(getCol('employee_attendance'), {
        employeeId: empId,
        employeeName: empName,
        date: today,
        clockIn: time,
        clockOut: null
      });
      alert(`บันทึกเวลาเข้างาน ${empName} สำเร็จ`);
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const handleClockOut = async (attendanceId, attBranch, empBranch) => {
    const branchToCheck = attBranch || empBranch;
    if (branchToCheck !== 'เฉวง') {
        const todayStr = new Date().toLocaleDateString('th-TH');
        const hasSubmittedEOD = dailySales.some(d => d.date === todayStr && d.branch === branchToCheck);
        
        if (!hasSubmittedEOD) {
            alert(`ไม่สามารถลงเวลาออกงานได้ กรุณาส่งยอดประจำวัน (EOD) ของสาขา ${branchToCheck} ก่อนครับ`);
            return;
        }
    }

    try {
      const time = new Date().toISOString();
      await updateDoc(doc(db, 'employee_attendance', attendanceId), { clockOut: time });
      alert('บันทึกเวลาออกงานสำเร็จ');
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  // ==== Handle Attendance History ====
  const getAttendanceHistory = () => {
    return attendance.filter(a => a.date && a.date.startsWith(attendanceMonth)).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  };

  const handleUpdateAttendance = async (e) => {
    e.preventDefault();
    if (!editingAttendance) return;
    try {
       await updateDoc(doc(db, 'employee_attendance', editingAttendance.id), {
          clockIn: editingAttendance.clockIn,
          clockOut: editingAttendance.clockOut || null
       });
       alert('บันทึกการแก้ไขเวลาสำเร็จ');
       setEditingAttendance(null);
    } catch(err) {
       alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const handleDeleteAttendance = async (id) => {
    if(window.confirm('ต้องการลบประวัติการลงเวลานี้หรือไม่?')) {
        try {
            await deleteDoc(doc(db, 'employee_attendance', id));
        } catch(err) {
            alert('เกิดข้อผิดพลาด: ' + err.message);
        }
    }
  };

  // ==== Handle Leave Management ====
  const handleSaveLeave = async (e) => {
      e.preventDefault();
      try {
          const emp = employees.find(emp => emp.id === leaveForm.employeeId);
          if(!emp) return alert('กรุณาเลือกพนักงาน');

          const data = {
             employeeId: leaveForm.employeeId,
             employeeName: emp.name,
             leaveType: leaveForm.leaveType,
             startDate: leaveForm.startDate,
             endDate: leaveForm.endDate,
             reason: leaveForm.reason,
             status: 'อนุมัติ',
             updatedAt: new Date().toISOString()
          };

          if(leaveForm.id) {
              await updateDoc(doc(db, 'employee_leaves', leaveForm.id), data);
          } else {
              data.createdAt = new Date().toISOString();
              await addDoc(getCol('employee_leaves'), data);
          }
          setIsAddingLeave(false);
          setLeaveForm({ id: null, employeeId: '', employeeName: '', leaveType: 'ลาป่วย', startDate: '', endDate: '', reason: '' });
          alert('บันทึกข้อมูลการลาสำเร็จ');
      } catch(err) {
          alert('เกิดข้อผิดพลาด: ' + err.message);
      }
  };

  const handleDeleteLeave = async (id) => {
      if(window.confirm('ต้องการลบรายการลานี้หรือไม่?')) {
          try {
              await deleteDoc(doc(db, 'employee_leaves', id));
          } catch(err) {
              alert('เกิดข้อผิดพลาด: ' + err.message);
          }
      }
  };

  const handleDeleteServiceLog = async (id) => {
      if(window.confirm('ต้องการลบประวัติค่ามือนี้หรือไม่?')) {
          try {
              await deleteDoc(doc(db, 'service_logs', id));
          } catch(err) {
              alert('เกิดข้อผิดพลาด: ' + err.message);
          }
      }
  };

  const handleDeleteJobApplication = async (id) => {
      if(window.confirm('ต้องการลบข้อมูลใบสมัครนี้หรือไม่?')) {
          try {
              await deleteDoc(doc(db, 'jobApplications', id));
          } catch(err) {
              alert('เกิดข้อผิดพลาด: ' + err.message);
          }
      }
  };

  const handlePrintJobApplication = (app) => {
      setSelectedApplication(app);
      setTimeout(() => {
          window.print();
      }, 500);
  };

  const handleUpdateLeaveStatus = async (id, status) => {
      try {
          await updateDoc(doc(db, 'employee_leaves', id), { status });
      } catch(err) {
          alert('เกิดข้อผิดพลาด: ' + err.message);
      }
  };

  const handleEditRequestDate = async (req) => {
     let currentIso = '';
     if (typeof req.createdAt === 'string') currentIso = req.createdAt;
     else if (req.createdAt && req.createdAt.toDate) currentIso = req.createdAt.toDate().toISOString();
     else currentIso = new Date().toISOString();

     const currentDateStr = currentIso.split('T')[0];
     const newDate = window.prompt('ระบุวันที่ส่งคำร้องใหม่ (YYYY-MM-DD):', currentDateStr);
     
     if (!newDate) return;
     if (newDate === currentDateStr) return;

     if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
        alert('รูปแบบวันที่ไม่ถูกต้อง กรุณาใช้ YYYY-MM-DD เช่น 2026-08-01');
        return;
     }

     try {
        let colName = '';
        if (req.reqType === 'leave') colName = 'employee_leaves';
        else if (req.reqType === 'advance') colName = 'advance_payments';
        else if (req.reqType === 'supplies') colName = 'supplies_requisitions';

        if (colName) {
           const oldTime = currentIso.includes('T') ? currentIso.split('T')[1] : '12:00:00.000Z';
           const newIsoString = `${newDate}T${oldTime}`;
           await updateDoc(doc(db, colName, req.id), { createdAt: newIsoString });
           alert('แก้ไขวันที่สำเร็จ');
        }
     } catch (err) {
        alert('เกิดข้อผิดพลาด: ' + err.message);
     }
  };

  const handleUpdateRequisitionStatus = async (id, newStatus) => {
      try {
          await updateDoc(doc(db, 'supplies_requisitions', id), { status: newStatus, updatedAt: new Date().toISOString() });
      } catch(err) {
          alert('เกิดข้อผิดพลาด: ' + err.message);
      }
  };

  const handleUpdateAdvanceStatus = async (id, status) => {
      try {
          await updateDoc(doc(db, 'advance_payments', id), { status, updatedAt: new Date().toISOString() });
      } catch(err) {
          alert('เกิดข้อผิดพลาด: ' + err.message);
      }
  };

  const handleToggleCustomLeave = async (emp, dateStr, existingLeave) => {
      try {
          if (existingLeave) {
              await deleteDoc(doc(db, 'employee_leaves', existingLeave.id));
          } else {
              const data = {
                 employeeId: emp.id,
                 employeeName: emp.name,
                 leaveType: 'หยุดพิเศษ',
                 startDate: dateStr,
                 endDate: dateStr,
                 reason: 'กำหนดจากตารางงานรายเดือน',
                 status: 'อนุมัติ',
                 createdAt: new Date().toISOString(),
                 updatedAt: new Date().toISOString()
              };
              await addDoc(getCol('employee_leaves'), data);
          }
      } catch(err) {
          alert('เกิดข้อผิดพลาด: ' + err.message);
      }
  };

  // ==== Handle Payroll ====
  const isInPayrollMonth = (item, monthPrefix) => {
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
  };

  const getPayrollData = () => {
    // histories has the service records.
    // Filter histories by month
    const monthHistories = histories.filter(h => isInPayrollMonth(h, payrollMonth));

    return filteredEmployees.map(emp => {
      // Find commissions for this employee in this month
      let totalCommission = 0;
      let serviceCount = 0;
      monthHistories.forEach(h => {
          const sName = String(getFuzzyKey(h, ["ชื่อเจ้าหน้าที่", "ชื่อพนักงาน", "staffName", "ผู้ให้บริการ", "เจ้าหน้าที่", "พนักงาน", "paymentStaff"]) || '');
          if (!sName) return;
          
          const staffNames = sName.split(/[,/]|และ|กับ/).map(s => s.trim()).filter(s => s);
          if (staffNames.includes(emp.name)) {
             const price = parseNumber(getFuzzyKey(h, ["ราคา", "price", "จำนวนเงิน", "ยอดเงิน"]) || 0);
             const typeStr = String(getFuzzyKey(h, ["ประเภท"]) || '');
             const shareCount = staffNames.length;
             if (typeStr.includes('ซื้อสินค้า')) {
                 totalCommission += (price * (parseFloat(emp.productCommissionRate) || 0) / 100) / shareCount;
             } else {
                 totalCommission += (price * (parseFloat(emp.commissionRate) || 0) / 100) / shareCount;
             }
             serviceCount++;
          }
      });

      const empServiceLogs = (serviceLogs || []).filter(s => s.employeeId === emp.id && isInPayrollMonth(s, payrollMonth));
      let totalServiceFees = 0;
      empServiceLogs.forEach(s => {
          const typeName = String(s.type || '').toLowerCase();
          let rawAmount = parseNumber(s.amount);
          const isPOS = typeof s.note === 'string' && s.note.startsWith('POS:');
          
          if (isPOS && (typeName.includes('จี้ไฝ') || typeName.includes('mole')) && rawAmount < 100) rawAmount = rawAmount * 10;

          if (typeName.includes('นวดหน้า') || typeName.includes('active skin') || typeName.includes('ipl รักแร้') || typeName.includes('ทรีทเม้นท์')) {
              totalServiceFees += 50;
          } else if (typeName.includes('กดสิว')) {
              totalServiceFees += 30;
          } else if (typeName.includes('สปา') || typeName.includes('ขัดตัว')) {
              totalServiceFees += 100;
          } else if (typeName.includes('จี้ไฝ') || typeName.includes('กระ') || typeName.includes('ติ่งเนื้อ') || typeName.includes('mole')) {
              totalServiceFees += rawAmount < 1000 ? (rawAmount * 0.10) : (rawAmount * 0.20);
          } else {
              totalServiceFees += isPOS ? (rawAmount * 0.10) : rawAmount;
          }
      });
      
      const empAdvances = (advancePayments || []).filter(a => a.employeeId === emp.id && (a.status === 'อนุมัติ' || a.status === 'อนุมัติแล้ว') && isInPayrollMonth(a, payrollMonth));
      let totalAdvances = 0;
      empAdvances.forEach(a => totalAdvances += parseNumber(a.amount));

      const empAttendance = (attendance || []).filter(a => a.employeeId === emp.id && isInPayrollMonth(a, payrollMonth));
      const daysWorked = new Set(empAttendance.map(a => a.date)).size;
      const foodRate = emp.foodAllowanceRate !== undefined ? Number(emp.foodAllowanceRate) : 50;
      const totalFoodAllowance = daysWorked * foodRate;
      
      const diligenceAllowance = emp.diligenceAllowance !== undefined ? Number(emp.diligenceAllowance) : 500;
      // In a real system, diligence allowance might be conditional, but for now we'll pass it to the view.
      // The user can manually adjust it if needed via another system, but we'll include it in total for now.

      const autoBaseSalary = Math.ceil(parseNumber(emp.baseSalary || 0));
      totalAdvances = Math.ceil(totalAdvances);
      
      const autoCommission = Math.ceil(totalCommission);
      const autoServiceFees = Math.ceil(totalServiceFees);

      const monthOverride = emp.payrollOverrides?.[payrollMonth] || {};
      const baseSalary = monthOverride.baseSalary !== undefined && monthOverride.baseSalary !== null && monthOverride.baseSalary !== ''
        ? parseNumber(monthOverride.baseSalary)
        : autoBaseSalary;
      const finalCommission = monthOverride.totalCommission !== undefined && monthOverride.totalCommission !== null && monthOverride.totalCommission !== ''
        ? parseNumber(monthOverride.totalCommission)
        : autoCommission;
      const finalServiceFees = monthOverride.totalServiceFees !== undefined && monthOverride.totalServiceFees !== null && monthOverride.totalServiceFees !== ''
        ? parseNumber(monthOverride.totalServiceFees)
        : autoServiceFees;
      const finalFoodAllowance = monthOverride.totalFoodAllowance !== undefined && monthOverride.totalFoodAllowance !== null && monthOverride.totalFoodAllowance !== ''
        ? parseNumber(monthOverride.totalFoodAllowance)
        : totalFoodAllowance;
      const finalAdvances = monthOverride.totalAdvances !== undefined && monthOverride.totalAdvances !== null && monthOverride.totalAdvances !== ''
        ? parseNumber(monthOverride.totalAdvances)
        : totalAdvances;
      
      // Included diligenceAllowance as a standard benefit for now.
      const totalIncome = baseSalary + finalCommission + finalServiceFees + finalFoodAllowance + diligenceAllowance - finalAdvances;

      return {
          ...emp,
          baseSalary,
          totalCommission: finalCommission,
          totalServiceFees: finalServiceFees,
          totalFoodAllowance: finalFoodAllowance,
          diligenceAllowance,
          totalAdvances: finalAdvances,
          totalIncome,
          daysWorked,
          serviceCount,
          serviceLogCount: empServiceLogs.length
      };
    });
  };

  const payrollData = getPayrollData();
  const attendanceHistoryData = getAttendanceHistory();

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Header */}
      <div className="bg-white px-6 py-5 border-b border-slate-200 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-indigo-600" /> ระบบจัดการพนักงาน
          </h1>
          <p className="text-sm text-slate-500 mt-1">เวลาเข้างาน เงินเดือน วันลา และค่าคอมมิชชั่น</p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setActiveTab('attendance')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'attendance' ? 'bg-indigo-100 text-indigo-700 shadow-inner' : 'text-slate-500 hover:bg-slate-100'}`}>
            <Clock size={16} /> ลงเวลาเข้างาน
          </button>
          <button onClick={() => setActiveTab('history')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-indigo-100 text-indigo-700 shadow-inner' : 'text-slate-500 hover:bg-slate-100'}`}>
            <History size={16} /> ประวัติลงเวลา
          </button>
          <button onClick={() => setActiveTab('requests')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'requests' ? 'bg-indigo-100 text-indigo-700 shadow-inner' : 'text-slate-500 hover:bg-slate-100'}`}>
            <FileText size={16} /> รวมคำร้อง
          </button>
          <button onClick={() => setActiveTab('service_logs')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'service_logs' ? 'bg-indigo-100 text-indigo-700 shadow-inner' : 'text-slate-500 hover:bg-slate-100'}`}>
            <UserCheck size={16} /> ประวัติค่ามือ
          </button>
          <button onClick={() => setActiveTab('payroll')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'payroll' ? 'bg-indigo-100 text-indigo-700 shadow-inner' : 'text-slate-500 hover:bg-slate-100'}`}>
            <DollarSign size={16} /> เงินเดือน/รายได้
          </button>
          <button onClick={() => setActiveTab('schedule')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'schedule' ? 'bg-indigo-100 text-indigo-700 shadow-inner' : 'text-slate-500 hover:bg-slate-100'}`}>
            <Calendar size={16} /> ตารางงาน (รายเดือน)
          </button>
          <button onClick={() => setActiveTab('manage')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'manage' ? 'bg-indigo-100 text-indigo-700 shadow-inner' : 'text-slate-500 hover:bg-slate-100'}`}>
            <Users size={16} /> จัดการพนักงาน
          </button>
          <button onClick={() => setActiveTab('applications')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'applications' ? 'bg-indigo-100 text-indigo-700 shadow-inner' : 'text-slate-500 hover:bg-slate-100'}`}>
            <Briefcase size={16} /> ใบสมัครงาน
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {/* Branch Filter */}
        {(activeTab === 'attendance' || activeTab === 'payroll' || activeTab === 'manage') && (
          <div className="mb-6 flex gap-2">
             <select 
                value={branchFilter} 
                onChange={e => setBranchFilter(e.target.value)}
                className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold shadow-sm outline-none focus:border-indigo-500"
             >
                <option value="ทั้งหมด">ทุกสาขา</option>
                {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
             </select>
          </div>
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === 'attendance' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredEmployees.map(emp => {
              const todayAtt = getTodayAttendance(emp.id);
              const handleClick = () => {
                setSelectedEmployeeForPortal(emp);
              };
              return (
                <div key={emp.id} 
                  onClick={handleClick}
                  className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center cursor-pointer hover:bg-slate-50 hover:shadow-md transition-all active:scale-[0.98]"
                >
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3 overflow-hidden border border-slate-200">
                    {emp.profileImage ? (
                      <img src={emp.profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <Users size={28} className="text-slate-400" />
                    )}
                  </div>
                  <h3 className="text-lg font-black text-slate-800">{emp.name}</h3>
                  <p className="text-xs text-slate-500 mb-4">{emp.branch}</p>
                  
                  <div className="w-full grid grid-cols-2 gap-2 mt-2">
                     {/* Clock In */}
                     {todayAtt ? (
                        <div className="bg-emerald-50 text-emerald-700 text-xs font-bold py-3 px-1 rounded-xl border border-emerald-100 flex flex-col items-center justify-center gap-1 shadow-sm">
                           <span className="opacity-70 text-[10px]">เวลาเข้างาน</span>
                           <span className="text-sm">{new Date(todayAtt.clockIn).toLocaleTimeString('th-TH')}</span>
                        </div>
                     ) : (
                        <button onClick={(e) => { e.stopPropagation(); handleClockIn(emp.id, emp.name); }} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md transition-colors flex flex-col items-center justify-center gap-1 active:scale-95">
                          <LogIn size={20} />
                          <span>เข้างาน</span>
                        </button>
                     )}

                     {/* Clock Out */}
                     {todayAtt?.clockOut ? (
                        <div className="bg-slate-50 text-slate-600 text-xs font-bold py-3 px-1 rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-1 shadow-sm">
                           <span className="opacity-70 text-[10px]">เวลาออกงาน</span>
                           <span className="text-sm">{new Date(todayAtt.clockOut).toLocaleTimeString('th-TH')}</span>
                        </div>
                     ) : todayAtt ? (
                        <button onClick={(e) => { e.stopPropagation(); handleClockOut(todayAtt.id, todayAtt.branch, emp.branch); }} className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-sm shadow-md transition-colors flex flex-col items-center justify-center gap-1 active:scale-95">
                          <LogOut size={20} />
                          <span>ออกงาน</span>
                        </button>
                     ) : (
                        <div className="bg-slate-50 border border-slate-200 text-slate-400 py-3 rounded-xl flex flex-col items-center justify-center gap-1 opacity-50 cursor-not-allowed">
                          <LogOut size={20} />
                          <span className="text-xs font-bold">ออกงาน</span>
                        </div>
                     )}
                  </div>
                </div>
              );
            })}
            {filteredEmployees.length === 0 && (
               <div className="col-span-full py-12 text-center text-slate-400 font-bold">ไม่มีข้อมูลพนักงาน</div>
            )}
          </div>
        )}

        {/* ATTENDANCE HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><History className="text-indigo-500" /> ตารางตอกบัตร</h2>
                  <select 
                    value={historyEmployeeFilter}
                    onChange={e => setHistoryEmployeeFilter(e.target.value)}
                    className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold shadow-sm outline-none focus:border-indigo-500"
                  >
                    <option value="all">พนักงานทั้งหมด</option>
                    {filteredEmployees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                  </select>
                </div>
                <input 
                  type="month" 
                  value={attendanceMonth} 
                  onChange={e => setAttendanceMonth(e.target.value)}
                  className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl font-bold outline-none"
                />
             </div>
            
             {editingAttendance && (
               <div className="p-6 bg-indigo-50 border-b border-indigo-100 flex flex-col gap-4">
                   <h3 className="font-bold text-indigo-800">แก้ไขเวลาของ {editingAttendance.employeeName} (วันที่ {editingAttendance.date})</h3>
                   <form onSubmit={handleUpdateAttendance} className="flex flex-wrap gap-4 items-end">
                      <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1">เวลาเข้างาน</label>
                         <input type="datetime-local" step="1" required value={editingAttendance.clockIn ? editingAttendance.clockIn.slice(0, 19) : ''} onChange={e => setEditingAttendance({...editingAttendance, clockIn: new Date(e.target.value).toISOString()})} className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1">เวลาออกงาน</label>
                         <input type="datetime-local" step="1" value={editingAttendance.clockOut ? editingAttendance.clockOut.slice(0, 19) : ''} onChange={e => setEditingAttendance({...editingAttendance, clockOut: e.target.value ? new Date(e.target.value).toISOString() : null})} className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                      </div>
                      <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors">บันทึก</button>
                      <button type="button" onClick={() => setEditingAttendance(null)} className="px-4 py-2 bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-bold transition-colors">ยกเลิก</button>
                   </form>
               </div>
             )}

             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm whitespace-nowrap">
                 <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                   <tr>
                     <th className="px-6 py-4">วันที่</th>
                     {historyEmployeeFilter === 'all' && <th className="px-6 py-4">พนักงาน</th>}
                     <th className="px-6 py-4">เวลาเข้างาน</th>
                     <th className="px-6 py-4">เวลาออกงาน</th>
                     <th className="px-6 py-4">รวมชั่วโมง</th>
                     <th className="px-6 py-4">สถานะการทำงาน</th>
                     <th className="px-6 py-4 text-right">จัดการ</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {attendanceHistoryData
                     .filter(att => historyEmployeeFilter === 'all' || att.employeeId === historyEmployeeFilter)
                     .map(att => {
                       let isLate = false;
                       let isComplete = false;
                       let hoursStr = '-';
                       let statusBadges = [];
                       
                       if (att.clockIn) {
                          const cin = new Date(att.clockIn);
                          const targetTime = new Date(cin);
                          targetTime.setHours(11, 15, 0, 0);
                          isLate = cin > targetTime;
                          
                          if (isLate) statusBadges.push(<span key="late" className="bg-rose-100 text-rose-700 px-2 py-1 rounded-md text-xs font-bold">เข้าสาย</span>);
                          else statusBadges.push(<span key="ontime" className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-xs font-bold">ตรงเวลา</span>);

                          if (att.clockOut) {
                             const cout = new Date(att.clockOut);
                             const diffHrs = (cout - cin) / (1000 * 60 * 60);
                             const h = Math.floor(diffHrs);
                             const m = Math.round((diffHrs - h) * 60);
                             hoursStr = `${h} ชม. ${m} นาที`;
                             
                             isComplete = diffHrs >= 8.5; // threshold for complete shift
                             if (isComplete) statusBadges.push(<span key="complete" className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-bold">ครบเวลา</span>);
                             else statusBadges.push(<span key="incomplete" className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-xs font-bold">ไม่ครบเวลา</span>);
                          } else {
                             statusBadges.push(<span key="working" className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-bold">กำลังทำงาน</span>);
                          }
                       }

                       return (
                         <tr key={att.id} className="hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-4 font-bold text-slate-700">{att.date}</td>
                           {historyEmployeeFilter === 'all' && <td className="px-6 py-4 font-bold text-slate-800">{att.employeeName}</td>}
                           <td className={`px-6 py-4 font-medium ${isLate ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {att.clockIn ? new Date(att.clockIn).toLocaleTimeString('th-TH') : '-'}
                           </td>
                           <td className="px-6 py-4 text-slate-600 font-medium">
                              {att.clockOut ? new Date(att.clockOut).toLocaleTimeString('th-TH') : '-'}
                           </td>
                           <td className="px-6 py-4 font-bold text-indigo-600">{hoursStr}</td>
                           <td className="px-6 py-4">
                              <div className="flex gap-1 flex-wrap">{statusBadges}</div>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <button onClick={() => setEditingAttendance(att)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg mr-1 transition-colors" title="แก้ไขเวลา">
                                <Edit size={16} />
                              </button>
                              <button onClick={() => handleDeleteAttendance(att.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="ลบข้อมูล">
                                <Trash2 size={16} />
                              </button>
                           </td>
                         </tr>
                       );
                   })}
                   {attendanceHistoryData.filter(att => historyEmployeeFilter === 'all' || att.employeeId === historyEmployeeFilter).length === 0 && (
                     <tr><td colSpan={historyEmployeeFilter === 'all' ? 7 : 6} className="px-6 py-12 text-center text-slate-400 font-bold">ไม่มีข้อมูลการลงเวลาในเดือนนี้</td></tr>
                   )}
                 </tbody>
               </table>
             </div>
         </div>
        )}

        {/* LEAVE MANAGEMENT TAB */}
        {activeTab === 'leave' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-1">
               <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                   <h2 className="text-xl font-black text-slate-800 mb-6">{isAddingLeave ? 'แก้ไขการลา' : 'เพิ่มรายการลา'}</h2>
                   <form onSubmit={handleSaveLeave} className="space-y-4">
                      <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1">พนักงาน</label>
                         <select required value={leaveForm.employeeId} onChange={e => setLeaveForm({...leaveForm, employeeId: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-medium focus:border-indigo-500 outline-none">
                            <option value="" disabled>-- เลือกพนักงาน --</option>
                            {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                         </select>
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1">ประเภทการลา</label>
                         <select required value={leaveForm.leaveType} onChange={e => setLeaveForm({...leaveForm, leaveType: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-medium focus:border-indigo-500 outline-none">
                            <option value="ลาป่วย">ลาป่วย</option>
                            <option value="ลากิจ">ลากิจ</option>
                            <option value="ลาพักร้อน">ลาพักร้อน</option>
                            <option value="อื่นๆ">อื่นๆ</option>
                         </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                         <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">ตั้งแต่วันที่</label>
                            <input required type="date" value={leaveForm.startDate} onChange={e => setLeaveForm({...leaveForm, startDate: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium focus:border-indigo-500 outline-none text-sm" />
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">ถึงวันที่</label>
                            <input required type="date" value={leaveForm.endDate} onChange={e => setLeaveForm({...leaveForm, endDate: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium focus:border-indigo-500 outline-none text-sm" />
                         </div>
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1">เหตุผล</label>
                         <textarea rows="2" value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-medium focus:border-indigo-500 outline-none"></textarea>
                      </div>
                      <div className="pt-4 flex gap-2">
                         {isAddingLeave && (
                            <button type="button" onClick={() => { setIsAddingLeave(false); setLeaveForm({ id: null, employeeId: '', employeeName: '', leaveType: 'ลาป่วย', startDate: '', endDate: '', reason: '' }); }} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors">
                              ยกเลิก
                            </button>
                         )}
                         <button type="submit" className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                           <Plus size={18} /> {isAddingLeave ? 'บันทึกแก้ไข' : 'บันทึกการลา'}
                         </button>
                      </div>
                   </form>
               </div>
            </div>

            <div className="xl:col-span-2">
               <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4">พนักงาน</th>
                        <th className="px-6 py-4">ประเภท</th>
                        <th className="px-6 py-4">ช่วงเวลา</th>
                        <th className="px-6 py-4">สถานะ</th>
                        <th className="px-6 py-4 text-right">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {leaves.map(lv => (
                        <tr key={lv.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-bold text-slate-800">
                             {lv.employeeName}
                             <div className="text-xs font-normal text-slate-500 mt-0.5 max-w-[150px] truncate">{lv.reason || '-'}</div>
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-medium">
                             <span className={`px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold ${lv.leaveType === 'ลาป่วย' ? 'bg-amber-100 text-amber-700' : lv.leaveType === 'ลาพักร้อน' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                {lv.leaveType}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 font-medium">
                             {new Date(lv.startDate).toLocaleDateString('th-TH')} - {new Date(lv.endDate).toLocaleDateString('th-TH')}
                          </td>
                          <td className="px-6 py-4">
                             <span className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 w-fit ${
                                lv.status === 'อนุมัติ' ? 'bg-emerald-100 text-emerald-700' :
                                lv.status === 'ไม่อนุมัติ' ? 'bg-rose-100 text-rose-700' :
                                'bg-amber-100 text-amber-700'
                             }`}>
                                {lv.status || 'รออนุมัติ'}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {(!lv.status || lv.status === 'รออนุมัติ') && (
                              <>
                                <button onClick={() => handleUpdateLeaveStatus(lv.id, 'อนุมัติ')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg mr-1 transition-colors" title="อนุมัติ">
                                  <CheckCircle size={16} />
                                </button>
                                <button onClick={() => handleUpdateLeaveStatus(lv.id, 'ไม่อนุมัติ')} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg mr-2 transition-colors" title="ไม่อนุมัติ">
                                  <XCircle size={16} />
                                </button>
                              </>
                            )}
                            <button onClick={() => { setIsAddingLeave(true); setLeaveForm(lv); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg mr-2 transition-colors" title="แก้ไข">
                              <Edit size={16} />
                            </button>
                            <button onClick={() => handleDeleteLeave(lv.id)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors" title="ลบ">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {leaves.length === 0 && (
                        <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400 font-bold">ไม่มีข้อมูลการลางาน</td></tr>
                      )}
                    </tbody>
                  </table>
               </div>
            </div>
          </div>
        )}

        {/* ADVANCE PAYMENTS TAB */}
        {activeTab === 'advance' && (
           <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Wallet className="text-emerald-500" /> จัดการคำขอเบิกเงินล่วงหน้า</h2>
             </div>
             <table className="w-full text-left text-sm">
               <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                 <tr>
                   <th className="px-6 py-4">วันที่ขอ</th>
                   <th className="px-6 py-4">พนักงาน</th>
                   <th className="px-6 py-4">จำนวนเงิน</th>
                   <th className="px-6 py-4">สถานะ</th>
                   <th className="px-6 py-4 text-right">จัดการ</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {[...advancePayments].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map(adv => (
                   <tr key={adv.id} className="hover:bg-slate-50">
                     <td className="px-6 py-4 text-slate-500 font-bold">{new Date(adv.createdAt).toLocaleDateString('th-TH')}</td>
                     <td className="px-6 py-4 font-bold text-slate-800">
                        {adv.employeeName}
                        <div className="text-xs font-normal text-slate-500 mt-0.5">{adv.reason}</div>
                     </td>
                     <td className="px-6 py-4 font-black text-emerald-600 text-lg">฿{Number(adv.amount).toLocaleString()}</td>
                     <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 w-fit ${
                           adv.status === 'อนุมัติ' ? 'bg-emerald-100 text-emerald-700' :
                           adv.status === 'ไม่อนุมัติ' ? 'bg-rose-100 text-rose-700' :
                           'bg-amber-100 text-amber-700'
                        }`}>
                           {adv.status || 'รออนุมัติ'}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-right">
                       {(!adv.status || adv.status === 'รออนุมัติ') && (
                         <>
                           <button onClick={() => handleUpdateAdvanceStatus(adv.id, 'อนุมัติ')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg mr-1 transition-colors" title="อนุมัติ">
                             <CheckCircle size={18} />
                           </button>
                           <button onClick={() => handleUpdateAdvanceStatus(adv.id, 'ไม่อนุมัติ')} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="ไม่อนุมัติ">
                             <XCircle size={18} />
                           </button>
                         </>
                       )}
                     </td>
                   </tr>
                 ))}
                 {advancePayments.length === 0 && (
                   <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-bold">ไม่มีข้อมูลคำขอเบิกเงินล่วงหน้า</td></tr>
                 )}
               </tbody>
             </table>
           </div>
        )}

        {/* JOB APPLICATIONS TAB */}
        {activeTab === 'applications' && (
           <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
             <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Briefcase className="text-blue-500" /> ข้อมูลผู้สมัครงาน</h2>
                <div className="text-sm font-bold text-slate-500">
                  <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">แชร์ลิงก์ฟอร์มรับสมัครงาน: {window.location.origin}/?mode=job_application</span>
                </div>
             </div>
             <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                     <tr>
                       <th className="px-6 py-4">วันที่สมัคร</th>
                       <th className="px-6 py-4">ชื่อ - นามสกุล</th>
                       <th className="px-6 py-4">ตำแหน่ง</th>
                       <th className="px-6 py-4">ข้อมูลติดต่อ</th>
                       <th className="px-6 py-4 text-center">Resume / ประวัติย่อ</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {[...jobApplications].sort((a,b) => new Date(b.createdAt || b.appliedAt?.toDate?.() || 0) - new Date(a.createdAt || a.appliedAt?.toDate?.() || 0)).map(app => (
                       <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                         <td className="px-6 py-4 text-slate-500 font-bold">
                           {app.appliedAt ? (app.appliedAt.toDate ? app.appliedAt.toDate().toLocaleDateString('th-TH') : new Date(app.appliedAt).toLocaleDateString('th-TH')) : '-'}
                         </td>
                         <td className="px-6 py-4 font-bold text-slate-800">
                            {app.firstName} {app.lastName}
                            <div className="text-xs font-normal text-slate-500 mt-1">อายุ: {app.age || '-'} ปี | เงินเดือนที่คาดหวัง: {app.expectedSalary || '-'}</div>
                         </td>
                         <td className="px-6 py-4 font-bold text-indigo-600">
                            {app.position}
                            {app.preferredBranch && <div className="text-xs font-normal text-slate-500 mt-1">สาขา: <span className="font-bold text-slate-700">{app.preferredBranch}</span></div>}
                         </td>
                         <td className="px-6 py-4">
                            <div className="text-sm text-slate-700 font-medium">{app.phone}</div>
                            {app.email && <div className="text-xs text-slate-500">{app.email}</div>}
                         </td>
                         <td className="px-6 py-4">
                            <div className="flex flex-col gap-2 items-center">
                              <button onClick={() => setSelectedApplication(app)} className="w-full inline-flex justify-center items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg font-bold transition-all text-xs border border-indigo-200 hover:border-indigo-600">
                                <User size={14} /> ดูข้อมูลทั้งหมด
                              </button>
                              <div className="flex gap-2 w-full">
                                <button onClick={() => handlePrintJobApplication(app)} className="flex-1 inline-flex justify-center items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-600 hover:bg-slate-600 hover:text-white rounded-lg font-bold transition-all text-xs border border-slate-200 hover:border-slate-600">
                                  <Printer size={14} /> พิมพ์
                                </button>
                                <button onClick={() => handleDeleteJobApplication(app.id)} className="flex-1 inline-flex justify-center items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg font-bold transition-all text-xs border border-rose-200 hover:border-rose-600">
                                  <Trash2 size={14} /> ลบ
                                </button>
                              </div>
                            </div>
                         </td>
                       </tr>
                     ))}
                     {jobApplications.length === 0 && (
                       <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold">ไม่มีข้อมูลผู้สมัครงาน</td></tr>
                     )}
                   </tbody>
                 </table>
             </div>
           </div>
        )}

        {/* SUPPLIES TAB */}
        {activeTab === 'supplies' && (
           <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
             <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><ShoppingCart className="text-indigo-500" /> จัดการคำขอเบิกของใช้</h2>
             </div>
             <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                     <tr>
                       <th className="px-6 py-4">วันที่ขอ</th>
                       <th className="px-6 py-4">พนักงาน</th>
                       <th className="px-6 py-4">รายการเบิก</th>
                       <th className="px-6 py-4">สถานะ</th>
                       <th className="px-6 py-4 text-right">จัดการ</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {[...requisitions].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map(req => (
                       <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                         <td className="px-6 py-4 text-slate-500 font-bold">{new Date(req.createdAt).toLocaleDateString('th-TH')}</td>
                         <td className="px-6 py-4 font-bold text-slate-800">
                            {req.employeeName}
                         </td>
                         <td className="px-6 py-4">
                            <div className="font-bold text-slate-800">{req.itemName} <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md text-xs">{req.quantity}</span></div>
                            {req.reason && <div className="text-xs font-normal text-slate-500 mt-1">เหตุผล: {req.reason}</div>}
                         </td>
                         <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${
                               req.status === 'อนุมัติแล้ว' ? 'bg-emerald-100 text-emerald-700' :
                               req.status === 'ไม่อนุมัติ' ? 'bg-rose-100 text-rose-700' :
                               'bg-amber-100 text-amber-700'
                            }`}>
                               {req.status || 'รออนุมัติ'}
                            </span>
                            {req.status === 'ไม่อนุมัติ' && req.note && (
                                <div className="text-[10px] text-rose-600 mt-1 max-w-[150px] truncate" title={req.note}>หมายเหตุ: {req.note}</div>
                            )}
                         </td>
                         <td className="px-6 py-4 text-right">
                           {(!req.status || req.status === 'รออนุมัติ') && (
                             <div className="flex justify-end gap-2">
                               <button onClick={() => handleUpdateRequisitionStatus(req.id, 'อนุมัติแล้ว')} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg font-bold transition-all text-xs border border-emerald-200 hover:border-emerald-500 flex items-center gap-1">
                                 <CheckCircle size={14} /> อนุมัติ
                               </button>
                               <button onClick={() => handleUpdateRequisitionStatus(req.id, 'ไม่อนุมัติ')} className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded-lg font-bold transition-all text-xs border border-rose-200 hover:border-rose-500 flex items-center gap-1">
                                 <XCircle size={14} /> ไม่อนุมัติ
                               </button>
                             </div>
                           )}
                         </td>
                       </tr>
                     ))}
                     {requisitions.length === 0 && (
                        <tr>
                            <td colSpan="5" className="px-6 py-8 text-center text-slate-500 font-bold">ไม่มีรายการคำขอเบิกของใช้</td>
                        </tr>
                     )}
                   </tbody>
                 </table>
             </div>
           </div>
        )}

        {/* SERVICE LOGS TAB */}
        {activeTab === 'service_logs' && (
           <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
             <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><UserCheck className="text-pink-500" /> ประวัติการบันทึกค่ามือ / ค่าจี้ไฝ</h2>
             </div>
             <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                     <tr>
                       <th className="px-6 py-4">วันที่ทำรายการ</th>
                       <th className="px-6 py-4">พนักงาน</th>
                       <th className="px-6 py-4">ประเภท</th>
                       <th className="px-6 py-4">จำนวนเงิน</th>
                       <th className="px-6 py-4">รายละเอียด</th>
                       <th className="px-6 py-4 text-right">จัดการ</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {[...(serviceLogs || [])].sort((a,b) => new Date(b.date) - new Date(a.date)).map(log => (
                       <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                         <td className="px-6 py-4 text-slate-500 font-bold">{new Date(log.date).toLocaleDateString('th-TH')}</td>
                         <td className="px-6 py-4 font-bold text-slate-800">
                            {log.employeeName}
                         </td>
                         <td className="px-6 py-4 text-slate-600 font-medium">
                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs">{log.type}</span>
                         </td>
                         <td className="px-6 py-4 font-black text-pink-600 text-lg">
                            ฿{Number(log.amount).toLocaleString()}
                         </td>
                         <td className="px-6 py-4 text-slate-500">
                            {log.note || '-'}
                         </td>
                         <td className="px-6 py-4 text-right">
                           <button onClick={() => handleDeleteServiceLog(log.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="ลบ">
                             <Trash2 size={16} />
                           </button>
                         </td>
                       </tr>
                     ))}
                     {(!serviceLogs || serviceLogs.length === 0) && (
                        <tr>
                            <td colSpan="6" className="px-6 py-8 text-center text-slate-500 font-bold">ไม่มีประวัติบันทึกค่ามือ</td>
                        </tr>
                     )}
                   </tbody>
                 </table>
             </div>
           </div>
        )}

        
        {/* UNIFIED REQUESTS TAB */}
        {activeTab === 'requests' && (
           <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
             <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><FileText className="text-indigo-500" /> จัดการคำร้องทั้งหมด</h2>
             </div>
             <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                     <tr>
                       <th className="px-6 py-4">วันที่ส่งคำร้อง</th>
                       <th className="px-6 py-4">พนักงาน</th>
                       <th className="px-6 py-4">ประเภท/รายละเอียด</th>
                       <th className="px-6 py-4">สถานะ</th>
                       <th className="px-6 py-4 text-right">จัดการ</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {allRequests.map(req => (
                       <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                         <td className="px-6 py-4 text-slate-500 font-bold">
                             <div className="flex items-center gap-2">
                                <span>{new Date(req.createdAt).toLocaleDateString('th-TH')}</span>
                                <button 
                                  onClick={() => handleEditRequestDate(req)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
                                  title="แก้วันที่ส่งคำร้อง"
                                >
                                  <Edit size={14} />
                                </button>
                             </div>
                          </td>
                         <td className="px-6 py-4 font-bold text-slate-800">
                            {req.employeeName}
                         </td>
                         <td className="px-6 py-4">
                            <div className="font-bold flex items-center gap-2">
                               <span className={`px-2 py-0.5 rounded text-xs ${
                                 req.reqType === 'leave' ? 'bg-orange-100 text-orange-700' :
                                 req.reqType === 'advance' ? 'bg-emerald-100 text-emerald-700' :
                                 'bg-blue-100 text-blue-700'
                               }`}>
                                 {req.typeName}
                               </span>
                            </div>
                            <div className="text-slate-700 font-medium mt-2">
                               {req.reqType === 'leave' && (
                                  <>
                                    <span>{req.leaveType}</span>
                                    <span className="mx-2 text-slate-300">|</span>
                                    <span>วันที่: {new Date(req.startDate).toLocaleDateString('th-TH')} {req.startDate !== req.endDate ? ` - ${new Date(req.endDate).toLocaleDateString('th-TH')}` : ''}</span>
                                  </>
                               )}
                               {req.reqType === 'advance' && (
                                  <span className="font-black text-emerald-600">฿{Number(req.amount).toLocaleString()}</span>
                               )}
                               {req.reqType === 'supplies' && (
                                  <>
                                    <span>{req.itemName}</span>
                                    <span className="ml-2 bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md text-xs">{req.quantity}</span>
                                  </>
                               )}
                            </div>
                            {req.reason && <div className="text-xs font-normal text-slate-500 mt-1">เหตุผล: {req.reason}</div>}
                         </td>
                         <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${
                               req.status === 'อนุมัติ' || req.status === 'อนุมัติแล้ว' ? 'bg-emerald-100 text-emerald-700' :
                               req.status === 'ไม่อนุมัติ' ? 'bg-rose-100 text-rose-700' :
                               'bg-amber-100 text-amber-700'
                            }`}>
                               {req.status || 'รออนุมัติ'}
                            </span>
                            {req.status === 'ไม่อนุมัติ' && req.note && (
                                <div className="text-[10px] text-rose-600 mt-1 max-w-[150px] truncate" title={req.note}>หมายเหตุ: {req.note}</div>
                            )}
                         </td>
                         <td className="px-6 py-4 text-right">
                           {(!req.status || req.status === 'รออนุมัติ') && (
                             <div className="flex justify-end gap-2">
                               <button 
                                 onClick={() => {
                                    if(req.reqType === 'leave') handleUpdateLeaveStatus(req.id, 'อนุมัติ');
                                    else if(req.reqType === 'advance') handleUpdateAdvanceStatus(req.id, 'อนุมัติ');
                                    else if(req.reqType === 'supplies') handleUpdateRequisitionStatus(req.id, 'อนุมัติแล้ว');
                                 }}
                                 className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg font-bold transition-all text-xs border border-emerald-200 hover:border-emerald-500 flex items-center gap-1">
                                 <CheckCircle size={14} /> อนุมัติ
                               </button>
                               <button 
                                 onClick={() => {
                                    if(req.reqType === 'leave') handleUpdateLeaveStatus(req.id, 'ไม่อนุมัติ');
                                    else if(req.reqType === 'advance') handleUpdateAdvanceStatus(req.id, 'ไม่อนุมัติ');
                                    else if(req.reqType === 'supplies') handleUpdateRequisitionStatus(req.id, 'ไม่อนุมัติ');
                                 }} 
                                 className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded-lg font-bold transition-all text-xs border border-rose-200 hover:border-rose-500 flex items-center gap-1">
                                 <XCircle size={14} /> ไม่อนุมัติ
                               </button>
                             </div>
                           )}
                         </td>
                       </tr>
                     ))}
                     {allRequests.length === 0 && (
                        <tr>
                            <td colSpan="5" className="px-6 py-8 text-center text-slate-500 font-bold">ไม่มีรายการคำร้อง</td>
                        </tr>
                     )}
                   </tbody>
                 </table>
             </div>
           </div>
        )}

        {/* PAYROLL TAB */}
        {activeTab === 'payroll' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><DollarSign className="text-emerald-500" /> สรุปรายได้พนักงาน</h2>
                <input 
                  type="month" 
                  value={payrollMonth} 
                  onChange={e => setPayrollMonth(e.target.value)}
                  className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl font-bold outline-none"
                />
             </div>

             {/* Real-time Monthly Summary Banner */}
             <div className="bg-slate-50/50 border-b border-slate-200 p-6 grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
                    <span className="text-slate-500 text-xs font-bold mb-1">รวมเงินเดือนพื้นฐาน</span>
                    <span className="text-xl font-black text-slate-800">฿{payrollData.reduce((sum, emp) => sum + (emp.baseSalary || 0), 0).toLocaleString()}</span>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
                    <span className="text-slate-500 text-xs font-bold mb-1">รวมค่าอาหาร</span>
                    <span className="text-xl font-black text-orange-600">฿{payrollData.reduce((sum, emp) => sum + (emp.totalFoodAllowance || 0), 0).toLocaleString()}</span>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
                    <span className="text-slate-500 text-xs font-bold mb-1">รวมค่าคอมมิชชั่น</span>
                    <span className="text-xl font-black text-indigo-600">฿{payrollData.reduce((sum, emp) => sum + (emp.totalCommission || 0), 0).toLocaleString()}</span>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
                    <span className="text-slate-500 text-xs font-bold mb-1">รวมเบิกเงินล่วงหน้า</span>
                    <span className="text-xl font-black text-rose-600">฿{payrollData.reduce((sum, emp) => sum + (emp.totalAdvances || 0), 0).toLocaleString()}</span>
                </div>
                <div className="bg-emerald-50 p-4 rounded-2xl shadow-sm border border-emerald-100 flex flex-col items-center justify-center text-center col-span-2 md:col-span-1 ring-1 ring-emerald-500/20 hover:shadow-md transition-shadow">
                    <span className="text-emerald-700 text-xs font-bold mb-1">ยอดรวมที่ต้องจ่ายสุทธิ</span>
                    <span className="text-2xl font-black text-emerald-600">฿{payrollData.reduce((sum, emp) => sum + (emp.totalIncome || 0), 0).toLocaleString()}</span>
                </div>
             </div>

             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 text-slate-500 font-bold">
                   <tr>
                     <th className="px-6 py-4">พนักงาน</th>
                     <th className="px-6 py-4">สาขา</th>
                     <th className="px-6 py-4 text-right">เงินเดือนพื้นฐาน</th>
                     <th className="px-6 py-4 text-right">ค่าอาหาร</th>
                     <th className="px-6 py-4 text-right">เบี้ยขยัน</th>
                     <th className="px-6 py-4 text-right">ค่าคอมมิชชั่น</th>
                     <th className="px-6 py-4 text-right">เบิกเงินล่วงหน้า</th>
                     <th className="px-6 py-4 text-right">ให้บริการ (ครั้ง)</th>
                     <th className="px-6 py-4 text-right">รายได้รวมสุทธิ</th>
                     <th className="px-6 py-4 text-center">สลิป</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {payrollData.map(emp => (
                     <tr key={emp.id} className="hover:bg-slate-50">
                       <td className="px-6 py-4 font-bold text-slate-800">{emp.name}</td>
                       <td className="px-6 py-4 text-slate-500">{emp.branch}</td>
                       <td className="px-6 py-4 text-right font-medium">฿{(emp.baseSalary || 0).toLocaleString()}</td>
                       <td className="px-6 py-4 text-right font-medium text-orange-600">฿{(emp.totalFoodAllowance || 0).toLocaleString()}</td>
                       <td className="px-6 py-4 text-right font-medium text-teal-600">฿{(emp.diligenceAllowance || 0).toLocaleString()}</td>
                       <td className="px-6 py-4 text-right font-medium text-indigo-600">฿{emp.totalCommission.toLocaleString()}</td>
                       <td className="px-6 py-4 text-right font-medium text-rose-600">฿{(emp.totalAdvances || 0).toLocaleString()}</td>
                       <td className="px-6 py-4 text-right text-slate-500">{emp.serviceCount}</td>
                       <td className="px-6 py-4 text-right font-black text-emerald-600 text-base">฿{emp.totalIncome.toLocaleString()}</td>
                       <td className="px-6 py-4 text-center">
                          <button 
                             onClick={() => setSelectedPayslipEmployee(emp)} 
                             className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-flex items-center justify-center"
                             title="พิมพ์สลิปเงินเดือน"
                          >
                             <Printer size={18} />
                          </button>
                       </td>
                     </tr>
                   ))}
                   {payrollData.length === 0 && (
                     <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-400 font-bold">ไม่มีข้อมูลพนักงาน</td></tr>
                   )}
                 </tbody>
               </table>
             </div>

             {/* Payslip Modal */}
             {selectedPayslipEmployee && (
               <PayslipModal 
                 employee={selectedPayslipEmployee} 
                 payrollMonth={payrollMonth}
                 onClose={() => setSelectedPayslipEmployee(null)} 
               />
             )}
         </div>
        )}

        {/* MANAGE TAB */}
        {activeTab === 'manage' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-1">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                 <h2 className="text-xl font-black text-slate-800 mb-4">{isEditingEmployee ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่'}</h2>
                 
                 {/* Tabs */}
                 <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
                    <button
                       onClick={() => setEmployeeFormTab('general')}
                       className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${employeeFormTab === 'general' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                       ข้อมูลทั่วไป
                    </button>
                    <button
                       onClick={() => setEmployeeFormTab('benefits')}
                       className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${employeeFormTab === 'benefits' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                       สวัสดิการ & สัญญาจ้าง
                    </button>
                 </div>

                 <form onSubmit={handleSaveEmployee} className="space-y-4">
                    {employeeFormTab === 'general' && (
                      <div className="space-y-4 animate-in fade-in duration-300">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">ชื่อ-นามสกุล</label>
                          <input required type="text" value={employeeForm.name} onChange={e => setEmployeeForm({...employeeForm, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-medium focus:border-indigo-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">เบอร์โทรศัพท์ (ทางเลือก)</label>
                          <input type="text" value={employeeForm.phone} onChange={e => setEmployeeForm({...employeeForm, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-medium focus:border-indigo-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">สาขาประจำ</label>
                          <select value={employeeForm.branch} onChange={e => setEmployeeForm({...employeeForm, branch: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-medium focus:border-indigo-500 outline-none">
                            <option value="เฉวง">เฉวง</option>
                            {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-2">วันหยุดประจำสัปดาห์</label>
                          <div className="flex flex-wrap gap-2">
                             {['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map((day, idx) => {
                                 const isSelected = employeeForm.weeklyDaysOff?.includes(idx);
                                 return (
                                   <button
                                     key={idx} type="button" 
                                     onClick={() => {
                                        let arr = employeeForm.weeklyDaysOff || [];
                                        if(isSelected) arr = arr.filter(d => d !== idx);
                                        else arr = [...arr, idx];
                                        setEmployeeForm({...employeeForm, weeklyDaysOff: arr});
                                     }}
                                     className={`w-10 h-10 rounded-full font-bold text-sm flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                     {day}
                                   </button>
                                 )
                             })}
                          </div>
                        </div>
                      </div>
                    )}

                    {employeeFormTab === 'benefits' && (
                      <div className="space-y-4 animate-in fade-in duration-300">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">สถานะพนักงาน</label>
                          <select value={employeeForm.employmentStatus || 'probation'} onChange={e => setEmployeeForm({...employeeForm, employmentStatus: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-medium focus:border-indigo-500 outline-none">
                            <option value="probation">ทดลองงาน</option>
                            <option value="regular">พนักงานประจำ</option>
                            <option value="resigned">พ้นสภาพ/ลาออก</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">วันที่เริ่มงาน</label>
                          <input type="date" value={employeeForm.employmentStartDate || ''} onChange={e => setEmployeeForm({...employeeForm, employmentStartDate: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-medium focus:border-indigo-500 outline-none" />
                        </div>
                        {(!employeeForm.employmentStatus || employeeForm.employmentStatus === 'probation') && (
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">ระยะเวลาทดลองงาน (วัน)</label>
                            <input type="number" value={employeeForm.probationDays || 119} onChange={e => setEmployeeForm({...employeeForm, probationDays: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-medium focus:border-indigo-500 outline-none" />
                          </div>
                        )}
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">เงินเดือน (บาท/เดือน)</label>
                          <input type="number" value={employeeForm.baseSalary} onChange={e => setEmployeeForm({...employeeForm, baseSalary: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-medium focus:border-indigo-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">เปอร์เซ็นต์ค่าคอมมิชชั่นคอร์ส (%)</label>
                          <input type="number" value={employeeForm.commissionRate} onChange={e => setEmployeeForm({...employeeForm, commissionRate: e.target.value})} placeholder="เช่น 5 หรือ 10" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-medium focus:border-indigo-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">เปอร์เซ็นต์ค่าคอมมิชชั่นสินค้า (%)</label>
                          <input type="number" value={employeeForm.productCommissionRate || ''} onChange={e => setEmployeeForm({...employeeForm, productCommissionRate: e.target.value})} placeholder="เช่น 2 หรือ 5" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-medium focus:border-indigo-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">ค่าอาหาร (บาท/วัน)</label>
                          <input type="number" value={employeeForm.foodAllowanceRate !== undefined ? employeeForm.foodAllowanceRate : 50} onChange={e => setEmployeeForm({...employeeForm, foodAllowanceRate: e.target.value})} placeholder="เช่น 50" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-medium focus:border-indigo-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">เบี้ยขยัน (บาท/เดือน)</label>
                          <input type="number" value={employeeForm.diligenceAllowance !== undefined ? employeeForm.diligenceAllowance : 500} onChange={e => setEmployeeForm({...employeeForm, diligenceAllowance: e.target.value})} placeholder="เช่น 500" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-medium focus:border-indigo-500 outline-none" />
                        </div>
                        
                        {employeeForm.employmentStatus === 'regular' && (
                          <div className="mt-4 pt-4 border-t border-slate-200 animate-in fade-in">
                             <h4 className="font-bold text-slate-700 mb-3 text-sm flex items-center gap-1">💎 สวัสดิการ V.I.P</h4>
                             <div className="grid grid-cols-2 gap-3">
                               <div className="col-span-2 grid grid-cols-2 gap-3 p-2 bg-indigo-50 rounded-xl border border-indigo-100">
                                 <div>
                                   <label className="block text-xs font-bold text-slate-500 mb-1">วงเงินผลิตภัณฑ์/ปี (บาท)</label>
                                   <input type="number" value={employeeForm.vipProductLimit !== undefined ? employeeForm.vipProductLimit : 2000} onChange={e => setEmployeeForm({...employeeForm, vipProductLimit: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-indigo-500 outline-none" />
                                 </div>
                                 <div>
                                   <label className="block text-xs font-bold text-slate-500 mb-1">ใช้ไปแล้ว (บาท)</label>
                                   <input type="number" value={employeeForm.usedVipProductLimit || 0} onChange={e => setEmployeeForm({...employeeForm, usedVipProductLimit: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 focus:border-indigo-500 outline-none" />
                                 </div>
                               </div>

                               <div className="col-span-2 grid grid-cols-2 gap-3 p-2 bg-indigo-50 rounded-xl border border-indigo-100">
                                 <div>
                                   <label className="block text-xs font-bold text-slate-500 mb-1">ค่าชุด/ปี (บาท)</label>
                                   <input type="number" value={employeeForm.vipUniformAllowance !== undefined ? employeeForm.vipUniformAllowance : 1500} onChange={e => setEmployeeForm({...employeeForm, vipUniformAllowance: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-indigo-500 outline-none" />
                                 </div>
                                 <div>
                                   <label className="block text-xs font-bold text-slate-500 mb-1">ใช้ไปแล้ว (บาท)</label>
                                   <input type="number" value={employeeForm.usedVipUniformAllowance || 0} onChange={e => setEmployeeForm({...employeeForm, usedVipUniformAllowance: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 focus:border-indigo-500 outline-none" />
                                 </div>
                               </div>

                               <div>
                                 <label className="block text-xs font-bold text-slate-500 mb-1">วันหยุดพักร้อน/ปี (วัน)</label>
                                 <input type="number" value={employeeForm.vipAnnualLeaveDays !== undefined ? employeeForm.vipAnnualLeaveDays : 10} onChange={e => setEmployeeForm({...employeeForm, vipAnnualLeaveDays: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-indigo-500 outline-none" />
                               </div>
                               <div>
                                 <label className="block text-xs font-bold text-slate-500 mb-1">โบนัสวันเกิด (บาท)</label>
                                 <input type="number" value={employeeForm.vipBirthdayBonus !== undefined ? employeeForm.vipBirthdayBonus : 1000} onChange={e => setEmployeeForm({...employeeForm, vipBirthdayBonus: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-indigo-500 outline-none" />
                               </div>
                               <div className="col-span-2">
                                 <label className="block text-xs font-bold text-slate-500 mb-1">ส่วนลดซื้อสินค้าพนักงาน (%)</label>
                                 <input type="number" value={employeeForm.vipProductDiscountRate !== undefined ? employeeForm.vipProductDiscountRate : 30} onChange={e => setEmployeeForm({...employeeForm, vipProductDiscountRate: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-indigo-500 outline-none" />
                               </div>
                             </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="pt-4 flex gap-2">
                       {isEditingEmployee && (
                          <button type="button" onClick={() => { setIsEditingEmployee(false); setEmployeeForm({ id: null, name: '', phone: '', branch: 'เฉวง', baseSalary: '', commissionRate: '', productCommissionRate: '', weeklyDaysOff: [], employmentStatus: 'probation', employmentStartDate: new Date().toISOString().split('T')[0], probationDays: 119 }); }} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors">
                            ยกเลิก
                          </button>
                       )}
                       <button type="submit" className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                         <Plus size={18} /> {isEditingEmployee ? 'บันทึกการแก้ไข' : 'เพิ่มพนักงาน'}
                       </button>
                    </div>
                 </form>
              </div>
            </div>

            <div className="xl:col-span-2">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">รายชื่อพนักงาน</th>
                      <th className="px-6 py-4">สาขา</th>
                      <th className="px-6 py-4">เงินเดือน / คอมมิชชั่น (คอร์ส|สินค้า)</th>
                      <th className="px-6 py-4 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEmployees.map(emp => {
                      let statusBadge = null;
                      let probationBar = null;
                      
                      const empStatus = emp.employmentStatus || 'probation';
                      
                      if (empStatus === 'probation') {
                          const startDate = new Date(emp.employmentStartDate || emp.createdAt || Date.now());
                          const today = new Date();
                          const diffTime = today - startDate;
                          const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
                          const totalDays = emp.probationDays || 119;
                          const progress = Math.min(100, Math.max(0, (diffDays / totalDays) * 100));
                          const isPassed = diffDays >= totalDays;
                          
                          statusBadge = <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold">ทดลองงาน</span>;
                          probationBar = (
                             <div className="w-full mt-2 w-48">
                                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                   <span>ทดลองงาน</span>
                                   <span className={isPassed ? 'text-rose-500 font-bold' : ''}>{diffDays}/{totalDays} วัน</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                   <div className={`h-1.5 rounded-full ${isPassed ? 'bg-rose-500' : 'bg-amber-500'}`} style={{ width: `${progress}%` }}></div>
                                </div>
                             </div>
                          );
                      } else if (empStatus === 'regular') {
                          statusBadge = <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold">ประจำ</span>;
                      } else if (empStatus === 'resigned') {
                          statusBadge = <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold">พ้นสภาพ</span>;
                      }

                      return (
                      <tr key={emp.id} className={`hover:bg-slate-50 ${empStatus === 'resigned' ? 'opacity-50 grayscale' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200 shrink-0">
                               {emp.profileImage ? (
                                  <img src={emp.profileImage} alt={emp.name} className="w-full h-full object-cover" />
                               ) : (
                                  <Users size={20} className="text-slate-400" />
                               )}
                            </div>
                            <div className="flex flex-col">
                               <div className="font-bold text-slate-800 flex items-center gap-2">
                                 {emp.name}
                                 {statusBadge}
                               </div>
                               {probationBar}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{emp.branch}</td>
                        <td className="px-6 py-4 text-slate-500">
                          ฿{(emp.baseSalary || 0).toLocaleString()} / <span className="font-bold text-indigo-500">C:{emp.commissionRate || 0}%</span> | <span className="font-bold text-pink-500">P:{emp.productCommissionRate || 0}%</span>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <button 
                            onClick={() => setSelectedContractEmployee(emp)} 
                            className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg mr-2 transition-colors"
                            title="พิมพ์สัญญาจ้างงาน"
                          >
                            <FileText size={16} />
                          </button>
                          <button 
                            onClick={() => { setIsEditingEmployee(true); setEmployeeForm(emp); }} 
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg mr-2 transition-colors"
                            title="แก้ไขข้อมูล"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteEmployee(emp.id, emp.name)} 
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    )})}
                    {filteredEmployees.length === 0 && (
                      <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400 font-bold">ไม่มีข้อมูลพนักงาน</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SCHEDULE TAB */}
        {activeTab === 'schedule' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
             <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 no-print">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Calendar className="text-indigo-600"/> ตารางงานประจำเดือน</h2>
                <div className="flex gap-2 items-center">
                   <button 
                     disabled={isPrintingAction}
                     onClick={async () => {
                       setIsPrintingAction(true);
                       try {
                           const el = document.getElementById('schedule-table-container');
                           if (el) {
                               const dataUrl = await toPng(el, { 
                                   backgroundColor: '#ffffff', 
                                   pixelRatio: 2,
                                   width: el.scrollWidth,
                                   style: { overflow: 'visible', width: el.scrollWidth + 'px' }
                               });
                               const printWindow = window.open('', '_blank');
                               if(printWindow) {
                                   printWindow.document.write(`
                                     <html>
                                       <head>
                                         <title>พิมพ์ตารางงาน</title>
                                         <style>
                                           @page { size: A4 landscape; margin: 10mm; }
                                           body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: flex-start; background-color: #fff; }
                                           img { max-width: 100%; max-height: 90vh; object-fit: contain; }
                                         </style>
                                       </head>
                                       <body>
                                         <img src="${dataUrl}" onload="setTimeout(function(){ window.print(); window.close(); }, 500);" />
                                       </body>
                                     </html>
                                   `);
                                   printWindow.document.close();
                               } else {
                                   alert("เบราว์เซอร์บล็อคป๊อปอัป กรุณาอนุญาตป๊อปอัปสำหรับเว็บนี้เพื่อพิมพ์");
                               }
                           }
                       } catch(err) {
                           console.error(err);
                           alert("เกิดข้อผิดพลาด: " + err.message);
                       } finally {
                           setIsPrintingAction(false);
                       }
                   }} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50">
                     <Printer size={18}/> พิมพ์ (A4)
                   </button>
                   <button 
                     disabled={isPrintingAction}
                     onClick={async () => {
                       setIsPrintingAction(true);
                       try {
                           const el = document.getElementById('schedule-table-container');
                           if (el) {
                               const dataUrl = await toPng(el, { 
                                   backgroundColor: '#ffffff', 
                                   pixelRatio: 2,
                                   width: el.scrollWidth,
                                   style: { overflow: 'visible', width: el.scrollWidth + 'px' }
                               });
                               const link = document.createElement('a');
                               link.download = `schedule_${scheduleMonth}.png`;
                               link.href = dataUrl;
                               link.click();
                           }
                       } catch(err) {
                           console.error(err);
                           alert("เกิดข้อผิดพลาด: " + err.message);
                       } finally {
                           setIsPrintingAction(false);
                       }
                   }} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50">
                     <FileText size={18}/> บันทึกรูป (A4)
                   </button>
                   <input 
                     type="month" 
                     value={scheduleMonth} 
                     onChange={e => setScheduleMonth(e.target.value)}
                     className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                   />
                </div>
             </div>
            
             {(() => {
                const year = parseInt(scheduleMonth.split('-')[0]);
                const month = parseInt(scheduleMonth.split('-')[1]) - 1;
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const daysArray = Array.from({length: daysInMonth}, (_, i) => i + 1);
                
                return (
                  <div id="schedule-table-container" className="overflow-x-auto pb-4 bg-white p-4 rounded-xl">
                    <div className="mb-4 text-center">
                       <h2 className="text-2xl font-black text-slate-800">ตารางงานประจำเดือน {scheduleMonth}</h2>
                    </div>
                    <table className="w-full text-center border-collapse min-w-max border-2 border-black">
                       <thead>
                         <tr>
                            <th className="sticky left-0 bg-slate-100 z-10 px-4 py-3 text-left font-bold text-slate-700 border-b-2 border-r-2 border-black min-w-[200px] shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">รายชื่อพนักงาน</th>
                            {daysArray.map(day => {
                               const dateObj = new Date(year, month, day);
                               const dayOfWeek = dateObj.getDay();
                               const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                               return (
                                 <th key={day} className={`px-2 py-3 text-xs border border-black ${isWeekend ? 'bg-rose-100 text-rose-700' : 'bg-slate-50 text-slate-700'} font-bold min-w-[40px]`}>
                                       <div>{['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'][dayOfWeek]}</div>
                                       <div className="text-base">{day}</div>
                                    </th>
                               )
                            })}
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-black">
                         {filteredEmployees.map(emp => (
                            <tr key={emp.id} className="hover:bg-slate-100 transition-colors">
                               <td className="sticky left-0 bg-slate-50 z-10 px-4 py-3 text-left font-bold text-slate-800 border-r-2 border-black shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">
                                   {emp.name} <span className="block text-xs text-slate-400 font-normal">{emp.branch}</span>
                                </td>
                                {daysArray.map(day => {
                                   const dateObj = new Date(year, month, day);
                                   const dayOfWeek = dateObj.getDay();
                                   const isWeeklyOff = emp.weeklyDaysOff?.includes(dayOfWeek);
                                   
                                   const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                                   const customLeave = leaves.find(l => l.employeeId === emp.id && l.startDate <= dateStr && l.endDate >= dateStr);
                                   
                                   const isOff = isWeeklyOff || !!customLeave;
                                   
                                   return (
                                     <td key={day} className={`px-1 py-3 text-xs font-bold border border-black ${isOff ? 'bg-red-50/50' : 'bg-white'}`}>
                                        {isWeeklyOff ? (
                                          <div className="mx-auto w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center" title="วันหยุดประจำสัปดาห์">หยุด</div>
                                        ) : customLeave ? (
                                          <div onClick={() => handleToggleCustomLeave(emp, dateStr, customLeave)} className="mx-auto w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center cursor-pointer hover:bg-orange-200" title={`วันลา: ${customLeave.leaveType}`}>ลา</div>
                                        ) : (
                                          <div onClick={() => handleToggleCustomLeave(emp, dateStr, null)} className="mx-auto w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center hover:bg-emerald-200 cursor-pointer transition-colors" title="คลิกเพื่อตั้งเป็นวันหยุด">
                                            <CheckCircle size={16} strokeWidth={3} />
                                          </div>
                                        )}
                                     </td>
                                   )
                                })}
                            </tr>
                         ))}
                       </tbody>
                    </table>

                    {/* Legend */}
                    <div className="mt-6 flex flex-wrap items-center gap-6 justify-center text-sm font-bold text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200 shadow-sm">
                                <CheckCircle size={18} strokeWidth={3} />
                            </div>
                            <span>วันทำงานปกติ</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center border border-red-200 shadow-sm">
                                หยุด
                            </div>
                            <span>วันหยุดประจำสัปดาห์</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center border border-orange-200 shadow-sm">
                                ลา
                            </div>
                            <span>วันลา (เช่น ลาป่วย/ลากิจ)</span>
                        </div>
                    </div>
                  </div>
                )
             })()}
         </div>
        )}
      </div>
      
      {/* Employee Portal Overlay */}
      {selectedEmployeeForPortal && (
         <EmployeePortal 
           employee={employees.find(e => e.id === selectedEmployeeForPortal.id) || selectedEmployeeForPortal}
           attendance={attendance}
           leaves={leaves}
           advancePayments={advancePayments}
           histories={histories}
           branches={branches}
           dailySales={dailySales}
           appSettings={appSettings}
           orders={orders}
           serviceLogs={serviceLogs}
           onClose={() => setSelectedEmployeeForPortal(null)}
           onClockIn={(emp) => handleClockIn(emp.id, emp.name)}
           onClockOut={(att) => handleClockOut(att.id, att.branch, selectedEmployeeForPortal.branch)}
           onGoToPOS={onGoToPOS}
           isAdmin={true}
           onDeleteServiceLog={handleDeleteServiceLog}
         />
      )}

      {selectedApplication && (
        <JobApplicationModal application={selectedApplication} onClose={() => setSelectedApplication(null)} />
      )}

      {selectedContractEmployee && (
        <EmploymentContractModal employee={selectedContractEmployee} onClose={() => setSelectedContractEmployee(null)} />
      )}
    </div>
  );
}