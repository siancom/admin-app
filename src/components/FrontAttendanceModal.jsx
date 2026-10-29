import React, { useState, useMemo } from 'react';
import { Users, User, UserCheck, UserMinus, X, Clock, LogOut, ArrowRight as ArrowRightIcon } from 'lucide-react';
import { db, getCol } from '../config/firebase';
import { addDoc, updateDoc, doc } from 'firebase/firestore';
import EmployeePortal from './EmployeePortal';
import PinModal from './PinModal';

export default function FrontAttendanceModal({ employees = [], attendance = [], branches = [], leaves = [], advancePayments = [], histories = [], dailySales = [], onClose, onGoToPOS, appSettings = {}, orders = [], serviceLogs = [], requisitions = [], globalBranch, globalRole, initialEmployee, featureFlags = {}, mode = 'board', onStaffIdentity }) {
  const [branchFilter, setBranchFilter] = useState(globalBranch || 'ทั้งหมด');
  const [selectedBranches, setSelectedBranches] = useState({});
  const [selectedEmployeeForPortal, setSelectedEmployeeForPortal] = useState(null);
  // PIN gate: ต้องใส่ PIN เฉพาะตัวก่อนเข้าพอร์ทัลพนักงาน
  const [pinModal, setPinModal] = useState({ isOpen: false, employee: null, error: '' });

  // 🌟 จำ PIN ต่อคน 30 นาที (ต่อ session) — คนเดิมทำงานต่อเนื่องไม่ต้องใส่ซ้ำ
  const PIN_TRUST_MS = 30 * 60 * 1000;
  const isPinTrusted = (empId) => {
    try {
      const t = Number(sessionStorage.getItem(`pin_ok_${empId}`) || 0);
      return Date.now() - t < PIN_TRUST_MS;
    } catch (e) { return false; }
  };
  const markPinTrusted = (empId) => {
    try { sessionStorage.setItem(`pin_ok_${empId}`, String(Date.now())); } catch (e) {}
  };

  const getTodayAttendance = (empId) => {
    const today = new Date().toISOString().split('T')[0];
    return attendance.find(a => a.employeeId === empId && a.date === today);
  };

  const hasTriggeredInitial = React.useRef(false);
  React.useEffect(() => {
    if (initialEmployee && !hasTriggeredInitial.current) {
      hasTriggeredInitial.current = true;
      // 🌟 เข้าผ่านปุ่ม "แดชบอร์ด" หรือเลือกพนักงานจากหน้าล็อกอิน → หลังใส่ PIN ให้เข้าแดชบอร์ดของตัวเอง (profile) ไม่ใช่ POS
      openEmployeePinGate(initialEmployee, 'profile');
    }
  }, [initialEmployee]);

  const activeBranches = useMemo(() => {
    const active = branches.filter(b => !b.isMaintenance);
    return active.length > 0 ? active : branches;
  }, [branches]);

  const isSingleBranchMode = useMemo(() => {
    const empBranchCount = new Set(employees.map(e => String(e.branch || '').replace('สาขา', '').trim()).filter(Boolean)).size;
    const branchesWithGps = activeBranches.filter(b => b.lat && b.lng);
    return activeBranches.length <= 1 || branchesWithGps.length <= 1 || empBranchCount <= 1;
  }, [activeBranches, employees]);

  // Auto-detect branch based on GPS if globalBranch is not set (skip GPS if only 1 branch)
  React.useEffect(() => {
    if (isSingleBranchMode) {
      if (activeBranches[0]?.name) setBranchFilter(activeBranches[0].name);
      return;
    }
    if (!globalBranch && navigator.geolocation && activeBranches.length > 1) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const R = 6371e3; // metres
          let nearestBranch = null;
          let minDistance = Infinity;

          branches.forEach(branch => {
            if (branch.lat && branch.lng) {
              const φ1 = branch.lat * Math.PI/180;
              const φ2 = latitude * Math.PI/180;
              const Δφ = (latitude-branch.lat) * Math.PI/180;
              const Δλ = (longitude-branch.lng) * Math.PI/180;

              const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                        Math.cos(φ1) * Math.cos(φ2) *
                        Math.sin(Δλ/2) * Math.sin(Δλ/2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
              const distance = R * c; 
              
              if (distance < minDistance) {
                minDistance = distance;
                nearestBranch = branch.name;
              }
            }
          });

          // Auto-select nearest branch if within 2km (2000m)
          if (nearestBranch && minDistance <= 2000) {
            setBranchFilter(prev => prev === 'ทั้งหมด' ? nearestBranch : prev);
          }
        },
        (error) => {
          console.warn("GPS auto-detect failed:", error.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  }, [globalBranch, branches]);

  // Auto clock-out at 21:00
  React.useEffect(() => {
    const checkAutoClockOut = async () => {
      const now = new Date();
      // Auto-clock out all open attendances if it's past 21:00 today, OR if the attendance is from a past date.
      const openAttendances = attendance.filter(a => !a.clockOut);
      
      for (const att of openAttendances) {
        let shouldClockOut = false;
        let clockOutTime = null;

        // Create date in local timezone
        // Use Thailand local string for current date comparison
        const todayStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
        const currentHour = now.getHours();

        if (att.date < todayStr) {
           // Past day: set clock out to 21:00 of that day
           shouldClockOut = true;
           // Construct 21:00 local time for that date
           clockOutTime = new Date(`${att.date}T21:00:00+07:00`).toISOString();
        } else if (att.date === todayStr && currentHour >= 21) {
           // Today and past 21:00
           shouldClockOut = true;
           clockOutTime = new Date(`${att.date}T21:00:00+07:00`).toISOString();
        }

        if (shouldClockOut && clockOutTime) {
           try {
              await updateDoc(doc(db, 'employee_attendance', att.id), { clockOut: clockOutTime, autoClockOut: true });
              console.log(`Auto clocked out ${att.employeeName} for ${att.date} at 21:00`);
           } catch (e) {
              console.error("Auto clock-out error:", e);
           }
        }
      }
    };

    checkAutoClockOut();
    const interval = setInterval(checkAutoClockOut, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [attendance]);

  const openEmployeePinGate = (emp, action = 'pos') => {
    // 🌟 เพิ่งใส่ PIN คนนี้ไป (30 นาที) → ข้ามการถามซ้ำ ทำงานต่อเลย
    if (isPinTrusted(emp.id)) {
      handlePinVerified(emp, action);
      return;
    }
    setPinModal({ isOpen: true, employee: emp, error: '', action });
  };

  // 🌟 หลังยืนยัน PIN สำเร็จ (หรือ PIN ยังเชื่อถืออยู่) — action: 'identity' | 'profile' | 'pos' | 'clockout'
  const handlePinVerified = async (emp, action) => {
    if (!emp) return;
    localStorage.setItem('personalEmployeeId', emp.id);

    if (action === 'identity') {
      // เลือกตัวตนเริ่มงาน: ลงเวลาให้อัตโนมัติ (GPS) → แจ้งแอป → เปิดพื้นที่ทำงานของตัวเอง
      const todayAtt = getTodayAttendance(emp.id);
      if (!todayAtt || todayAtt.clockOut) {
        handleClockIn(emp.id, emp.name, emp.branch, null, true);
      }
      if (onStaffIdentity) onStaffIdentity(emp);
      setSelectedEmployeeForPortal(emp);
      return;
    }

    if (action === 'profile') {
      const todayAtt = getTodayAttendance(emp.id);
      if (!todayAtt || todayAtt.clockOut) {
        handleClockIn(emp.id, emp.name, emp.branch, null, true);
      }
      if (onStaffIdentity) onStaffIdentity(emp);
      setSelectedEmployeeForPortal(emp);
      return;
    }

    const todayAtt = getTodayAttendance(emp.id);
    if (action === 'clockout') {
      if (todayAtt && !todayAtt.clockOut) handleClockOut(todayAtt.id, emp.name, todayAtt.branch, emp.branch);
      return;
    }

    // action 'pos': ต้องลงเวลาก่อนแล้วจึงเข้า POS
    if (!todayAtt || todayAtt.clockOut) {
      const branchToClockIn = selectedBranches[emp.id] || (branchFilter !== 'ทั้งหมด' ? branchFilter : emp.branch);
      const success = await handleClockIn(emp.id, emp.name, branchToClockIn, null, true);
      if (!success) return;
    }

    if (onStaffIdentity) onStaffIdentity(emp);
    if (onGoToPOS) onGoToPOS();
  };

  const handlePinSubmit = async (pin) => {
    const emp = pinModal.employee;
    const action = pinModal.action || 'profile';
    if (!emp) return;
    const correctPin = String(emp.pin || '1234');
    if (pin === correctPin) {
      setPinModal({ isOpen: false, employee: null, error: '', action: '' });
      markPinTrusted(emp.id);
      await handlePinVerified(emp, action);
    } else {
      setPinModal({ ...pinModal, error: 'PIN ไม่ถูกต้อง กรุณาลองอีกครั้ง' });
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => branchFilter === 'ทั้งหมด' || e.branch === branchFilter);
  }, [employees, branchFilter]);

  const verifyLocation = (branchName) => {
    return new Promise((resolve) => {
       if (featureFlags?.requireGpsForAttendance === false || isSingleBranchMode) {
           return resolve(true);
       }
       const branch = branches.find(b => b.name === branchName);
       if (!branch || !branch.lat || !branch.lng) {
          // แจ้งเตือนถ้าสาขายังไม่ได้ตั้งพิกัด
          if(window.confirm(`สาขา ${branchName} ยังไม่ได้ตั้งค่าพิกัด GPS บนระบบหลังบ้าน\nต้องการให้ข้ามการตรวจสอบไปก่อนหรือไม่?`)) {
              return resolve(true);
          }
          return resolve(false);
       }
       
       if (!navigator.geolocation) {
          alert('อุปกรณ์ของคุณไม่รองรับ GPS');
          return resolve(false);
       }

       alert('กำลังตรวจสอบพิกัด GPS...');
       navigator.geolocation.getCurrentPosition(
         (position) => {
             const { latitude, longitude, accuracy } = position.coords;
             const R = 6371e3; // metres
             const φ1 = branch.lat * Math.PI/180;
             const φ2 = latitude * Math.PI/180;
             const Δφ = (latitude-branch.lat) * Math.PI/180;
             const Δλ = (longitude-branch.lng) * Math.PI/180;

             const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                       Math.cos(φ1) * Math.cos(φ2) *
                       Math.sin(Δλ/2) * Math.sin(Δλ/2);
             const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
             const distance = R * c; 
             
             // กำหนดระยะที่อนุญาต คือ 100 เมตร (ตามที่ลูกค้าระบุ)
             // *หมายเหตุ: มือถือส่วนใหญ่มีความคลาดเคลื่อน 10-20 เมตร การตั้ง 100 เมตรถือว่าเหมาะสมกว่าเพื่อลดปัญหาสัญญาณแกว่ง
             const ALLOWED_RADIUS = 100; 
             
             if (distance <= ALLOWED_RADIUS) {
                 resolve(true);
             } else {
                 alert(`พิกัดของคุณอยู่นอกพื้นที่สาขา!\n(ระยะห่าง: ${Math.round(distance)} เมตร, กำหนดไม่เกิน ${ALLOWED_RADIUS} เมตร)\nความคลาดเคลื่อน GPS: ${Math.round(accuracy)}m`);
                 resolve(false);
             }
         },
         (error) => {
             let errorMsg = 'ไม่สามารถดึงข้อมูลพิกัด GPS ได้';
             if (error.code === 1) errorMsg += '\n(คุณยังไม่อนุญาต หรือ เบราว์เซอร์บล็อคเนื่องจากไม่ได้ใช้ HTTPS)';
             else if (error.code === 2) errorMsg += '\n(ไม่มีสัญญาณ GPS หรือค้นหาตำแหน่งไม่พบ)';
             else if (error.code === 3) errorMsg += '\n(หมดเวลาในการค้นหาตำแหน่ง)';
             
             alert(`${errorMsg}\nรายละเอียด: ${error.message}`);
             resolve(false);
         },
         { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
       );
    });
  };

  const handleClockIn = async (empId, empName, selectedBranch, empObj = null, isAuto = false) => {
    try {
      const isVerified = await verifyLocation(selectedBranch);
      if (!isVerified) return false;

      const today = new Date().toISOString().split('T')[0];
      const time = new Date().toISOString();
      await addDoc(getCol('employee_attendance'), {
        employeeId: empId,
        employeeName: empName,
        branch: selectedBranch,
        date: today,
        clockIn: time,
        clockOut: null
      });
      if (!isAuto) alert(`บันทึกเวลาเข้างาน ${empName} สำเร็จ`);
      
      if (empObj) {
         setPinModal(prev => ({ isOpen: true, employee: empObj, error: '', action: prev.action || 'profile' }));
      }
      return true;
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
      return false;
    }
  };

  const handleClockOut = async (attendanceId, empName, attBranch, empBranch) => {
    const branchToCheck = attBranch || empBranch;
    // Check if EOD is submitted for this branch
    if (branchToCheck !== 'เฉวง') {
        const todayStr = new Date().toLocaleDateString('th-TH');
        const hasSubmittedEOD = dailySales.some(d => d.date === todayStr && d.branch === branchToCheck);
        
        if (!hasSubmittedEOD) {
            alert(`ไม่สามารถลงเวลาออกงานได้ กรุณาส่งยอดประจำวัน (EOD) ของสาขา ${branchToCheck} ก่อนครับ`);
            return;
        }
    }

    if (!window.confirm(`ต้องการบันทึกเวลาออกงานของ ${empName} ใช่หรือไม่?`)) return;
    try {
      const time = new Date().toISOString();
      await updateDoc(doc(db, 'employee_attendance', attendanceId), { clockOut: time });
      alert('บันทึกเวลาออกงานสำเร็จ');
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000000] flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
              <Clock size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">{mode === 'select' ? 'ใครกำลังใช้งานเครื่องนี้?' : 'ระบบลงเวลาพนักงาน'}</h2>
              <p className="text-sm text-slate-500">{mode === 'select' ? 'แตะชื่อของคุณ → ใส่ PIN → เริ่มงานได้เลย' : 'แตะเพื่อบันทึกเวลาเข้า-ออกงาน'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-slate-200 flex gap-4">
          <select 
            value={branchFilter} 
            onChange={e => setBranchFilter(e.target.value)}
            className="bg-white border border-slate-200 px-4 py-3 rounded-xl font-bold shadow-sm outline-none focus:border-indigo-500 w-full sm:w-auto min-w-[200px]"
          >
            <option value="ทั้งหมด">ทุกสาขา</option>
            {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
          </select>
        </div>

        {/* Employee Grid */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredEmployees.map(emp => {
              const todayAtt = getTodayAttendance(emp.id);

              // 🌟 โหมด select (เลือกตัวตน): การ์ดเรียบง่าย — แตะ = ยืนยันตัวตนแล้วเริ่มงาน
              if (mode === 'select') {
                return (
                  <div key={emp.id}
                    onClick={() => openEmployeePinGate(emp, 'identity')}
                    className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center cursor-pointer hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/10 transition-all active:scale-[0.98] relative overflow-hidden"
                  >
                    <div className="absolute top-3 right-3">
                      {!todayAtt ? (
                        <span className="bg-slate-100 text-slate-500 text-[9px] font-black px-2 py-1 rounded-full border border-slate-200">ยังไม่เข้างาน</span>
                      ) : todayAtt.clockOut ? (
                        <span className="bg-slate-200 text-slate-600 text-[9px] font-black px-2 py-1 rounded-full">ออกงานแล้ว</span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-2 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> กำลังทำงาน
                        </span>
                      )}
                    </div>
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3 overflow-hidden shrink-0 shadow-sm">
                      {emp.profileImage ? (
                        <img src={emp.profileImage} alt={emp.name} className="w-full h-full object-cover" />
                      ) : (
                        <Users size={28} className="text-slate-400" />
                      )}
                    </div>
                    <h3 className="text-lg font-black text-slate-800 text-center leading-tight">{emp.name}</h3>
                    <p className="text-xs text-slate-500 mb-3 text-center">{emp.branch}</p>
                    <span className="mt-auto text-[11px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl flex items-center gap-1">
                      เริ่มงาน <ArrowRightIcon size={12} />
                    </span>
                  </div>
                );
              }

              return (
                <div key={emp.id}
                  onClick={() => openEmployeePinGate(emp, 'profile')}
                  className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center cursor-pointer hover:bg-slate-50 hover:shadow-md transition-all active:scale-[0.98]"
                >
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3 overflow-hidden shrink-0 shadow-sm">
                    {emp.profileImage ? (
                        <img src={emp.profileImage} alt={emp.name} className="w-full h-full object-cover" />
                    ) : (
                        <Users size={28} className="text-slate-400" />
                    )}
                  </div>
                  <h3 className="text-lg font-black text-slate-800 text-center">{emp.name}</h3>
                  <p className="text-xs text-slate-500 mb-4 text-center">{emp.branch}</p>
                  
                  {todayAtt ? (
                    <div className="w-full text-center space-y-2">
                       <div className="bg-emerald-50 text-emerald-700 text-xs font-bold py-2 px-3 rounded-xl border border-emerald-100 flex flex-col gap-1">
                         <span>เข้างาน: {new Date(todayAtt.clockIn).toLocaleTimeString('th-TH')}</span>
                         {todayAtt.branch && <span className="text-emerald-600">ที่สาขา: {todayAtt.branch}</span>}
                       </div>
                       {todayAtt.clockOut ? (
                         <div className="bg-slate-100 text-slate-600 text-xs font-bold py-2 px-3 rounded-xl flex flex-col gap-1">
                           <span>ออกงาน: {new Date(todayAtt.clockOut).toLocaleTimeString('th-TH')}</span>
                         </div>
                       ) : (
                         <div className="w-full py-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm">
                           🟢 กำลังทำงาน
                         </div>
                       )}
                       <div className="w-full flex gap-2 mt-2">
                         <button 
                            onClick={(e) => { e.stopPropagation(); openEmployeePinGate(emp, 'pos'); }} 
                            className={`flex-1 py-3 rounded-xl font-bold transition-colors ${todayAtt.clockOut ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md active:scale-95'}`}
                         >
                            POS
                         </button>
                         <button 
                            onClick={(e) => { e.stopPropagation(); openEmployeePinGate(emp, 'profile'); }} 
                            className="w-12 shrink-0 py-3 rounded-xl font-bold transition-colors bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
                            title="โปรไฟล์ส่วนตัว"
                         >
                            <User size={18} />
                         </button>
                         {!todayAtt.clockOut && (
                         <button 
                            onClick={(e) => { e.stopPropagation(); openEmployeePinGate(emp, 'clockout'); }} 
                            className="w-12 shrink-0 py-3 rounded-xl font-bold transition-colors bg-rose-100 hover:bg-rose-200 text-rose-600 flex items-center justify-center"
                            title="ลงเวลาออก"
                         >
                            <LogOut size={18} />
                         </button>
                         )}
                       </div>
                    </div>
                  ) : (
                    <div className="w-full flex gap-2 mt-auto pt-4">
                      <button 
                        onClick={(e) => { e.stopPropagation(); openEmployeePinGate(emp, 'pos'); }} 
                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition-colors flex items-center justify-center gap-2 active:scale-95"
                      >
                        เข้างาน & POS
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); openEmployeePinGate(emp, 'profile'); }} 
                        className="w-12 shrink-0 py-3 rounded-xl font-bold transition-colors bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center shadow-sm"
                        title="โปรไฟล์ส่วนตัว"
                      >
                        <User size={18} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {filteredEmployees.length === 0 && (
               <div className="col-span-full py-12 text-center text-slate-400 font-bold">ไม่มีข้อมูลพนักงาน</div>
            )}
          </div>
        </div>
      </div>
      
      {/* Employee Portal Overlay */}
      {selectedEmployeeForPortal && (
         <EmployeePortal
           employee={employees.find(e => e.id === selectedEmployeeForPortal.id) || selectedEmployeeForPortal}
           attendance={attendance}
           leaves={leaves}
           advancePayments={advancePayments}
           requisitions={requisitions}
           histories={histories}
           branches={branches}
           dailySales={dailySales}
           appSettings={appSettings}
           orders={orders}
           serviceLogs={serviceLogs}
           isAdmin={globalRole === 'owner'}
           onClose={() => setSelectedEmployeeForPortal(null)}
           onClockIn={(emp) => handleClockIn(emp.id, emp.name, emp.branch)}
           onClockOut={(att) => handleClockOut(att.id, att.employeeName, att.branch, selectedEmployeeForPortal.branch)}
           onGoToPOS={onGoToPOS}
           onChangePin={async (newPin) => {
             try {
               await updateDoc(doc(db, 'employees', selectedEmployeeForPortal.id), { pin: String(newPin) });
               setSelectedEmployeeForPortal({ ...selectedEmployeeForPortal, pin: String(newPin) });
               return { ok: true };
             } catch (err) {
               return { ok: false, error: err.message };
             }
           }}
         />
      )}

      {/* PIN Gate Modal */}
      <PinModal
        isOpen={pinModal.isOpen}
        title="กรุณาใส่รหัส PIN"
        subtitle={pinModal.employee ? `พนักงาน: ${pinModal.employee.name}` : ''}
        error={pinModal.error}
        onSubmit={handlePinSubmit}
        onClose={() => setPinModal({ isOpen: false, employee: null, error: '' })}
        length={4}
      />
    </div>
  );
}