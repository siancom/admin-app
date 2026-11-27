import React, { useState, useEffect } from 'react';
import { Sparkles, MapPin, Navigation, Users, Crown, Delete, ArrowRight, Loader2, Clock, Banknote, CheckCircle, Zap, Target, AlertTriangle } from 'lucide-react';
import { getLocalYYYYMMDD, normalizeBranchName, parseThaiDate } from '../utils/parse';
import { db, getCol } from '../config/firebase';
import { doc, addDoc, updateDoc } from 'firebase/firestore';

// 🌟 หน้าล็อกอินแอดมิน IrisCare — เลือกสาขา (GPS ไฮไลต์อัตโนมัติ) + เข้าแบบพนักงาน/เจ้าของร้าน (รหัสผ่าน)
export default function AdminLoginPage({ branches = [], employees = [], attendance = [], appSettings = {}, initialBranch = null, onStaffEnter, onOwnerEnter, onOpenAttendance, onStaffLoginSuccess }) {
  const activeBranches = branches.filter(b => !b.isMaintenance);
  const displayBranches = activeBranches.length > 0 ? activeBranches : branches;
  const empBranchCount = new Set(employees.map(e => normalizeBranchName(e.branch)).filter(Boolean)).size;
  const isSingleBranchMode = displayBranches.length <= 1 || empBranchCount <= 1;

  const [now, setNow] = useState(new Date());
  const [selectedBranch, setSelectedBranch] = useState(() => {
    return initialBranch || localStorage.getItem('selectedBranch') || (displayBranches.length > 0 ? displayBranches[0].name : null);
  });
  const [mode, setMode] = useState('main'); // 'main' | 'owner_passcode' | 'employee_pin'
  const [passcode, setPasscode] = useState('');
  const [passError, setPassError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🌟 State สำหรับสไลด์กรอก PIN พนักงาน (เท่ๆ รวดเร็ว) 🌟
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [empPasscode, setEmpPasscode] = useState('');
  const [empPassError, setEmpPassError] = useState(false);
  const [empIsSubmitting, setEmpIsSubmitting] = useState(false);
  const [empSuccessMsg, setEmpSuccessMsg] = useState('');

  const branchEmployees = employees.filter(e => {
    if (!selectedBranch || isSingleBranchMode) return true;
    return normalizeBranchName(e.branch) === normalizeBranchName(selectedBranch);
  });

  // นาฬิกาสด
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // เลือกสาขาเริ่มต้นทันทีเมื่อมีข้อมูล (จำสาขาเดิมที่เคยเลือกไว้ ไม่ต้องรอตรวจ GPS ให้เสียเวลา)
  useEffect(() => {
    if (displayBranches.length === 0) return;
    const saved = localStorage.getItem('selectedBranch');
    const matched = saved && displayBranches.some(b => b.name === saved);
    if (!selectedBranch) {
      const target = matched ? saved : displayBranches[0].name;
      setSelectedBranch(target);
      localStorage.setItem('selectedBranch', target);
    }
  }, [displayBranches, selectedBranch]);

  const masterPasscode = appSettings?.masterPasscode || '999999';

  const handleStaffSubmit = () => {
    if (passcode.length < 4) return;
    setIsSubmitting(true);
    setTimeout(() => {
      const emp = employees.find(e => normalizeBranchName(e.branch) === normalizeBranchName(selectedBranch) && String(e.pin || '1234') === passcode);
      if (emp) {
        const todayStr = getLocalYYYYMMDD();
        const todayAtt = attendance.find(a => a.employeeId === emp.id && a.date === todayStr && !a.clockOut);
        if (!todayAtt) {
            alert(`คุณ ${emp.name} ยังไม่ได้ลงเวลาเข้างาน\nกรุณากด "ลงเวลาเข้า/ออกงาน" ก่อนเข้าใช้งานระบบครับ`);
            setPassError(true);
            setPasscode('');
            setTimeout(() => setPassError(false), 600);
        } else {
            onStaffEnter(selectedBranch);
        }
      } else {
        setPassError(true);
        setPasscode('');
        setTimeout(() => setPassError(false), 600);
      }
      setIsSubmitting(false);
    }, 250);
  };

  const handleOwnerSubmit = () => {
    if (passcode.length === 0) return;
    setIsSubmitting(true);
    setTimeout(() => {
      if (passcode === String(masterPasscode)) {
        onOwnerEnter(selectedBranch);
      } else {
        setPassError(true);
        setPasscode('');
        setTimeout(() => setPassError(false), 600);
      }
      setIsSubmitting(false);
    }, 250);
  };

  const pressKey = (k) => {
    if (k === 'del') { setPasscode(p => p.slice(0, -1)); return; }
    if (passcode.length >= 6) return;
    setPasscode(p => p + k);
  };

  const handleStartEmpPin = (emp) => {
    if (!selectedBranch && emp.branch) {
      setSelectedBranch(emp.branch);
      localStorage.setItem('selectedBranch', emp.branch);
    }
    setSelectedEmp(emp);
    setEmpPasscode('');
    setEmpPassError(false);
    setEmpSuccessMsg('');
    setEmpIsSubmitting(false);
    setMode('employee_pin');
  };

  const pressEmpKey = (k) => {
    if (empIsSubmitting) return;
    if (k === 'del') {
      setEmpPasscode(p => p.slice(0, -1));
      return;
    }
    if (empPasscode.length >= 4) return;
    const next = empPasscode + k;
    setEmpPasscode(next);
    if (next.length === 4) {
      handleEmpPinSubmit(next);
    }
  };

  const handleEmpPinSubmit = async (pinToTest) => {
    const pin = pinToTest || empPasscode;
    if (!selectedEmp) return;
    const correctPin = String(selectedEmp.pin || '1234');
    if (pin !== correctPin) {
      setEmpPassError(true);
      setTimeout(() => {
        setEmpPasscode('');
        setEmpPassError(false);
      }, 700);
      return;
    }

    setEmpIsSubmitting(true);
    try {
      const targetBranch = selectedBranch || selectedEmp.branch || (displayBranches[0]?.name) || 'เฉวง';
      const todayIsoStr = getLocalYYYYMMDD(now);
      const empTodayAtts = attendance.filter(a => a.employeeId === selectedEmp.id && a.date === todayIsoStr);
      const activeAtt = empTodayAtts.find(a => !a.clockOut);
      const latestClosedAtt = empTodayAtts.filter(a => !!a.clockOut).sort((a,b) => new Date(b.clockOut || 0) - new Date(a.clockOut || 0))[0];

      // 1. ถ้าเคยออกงานไปแล้ววันนี้ -> ลงเวลาต่อ / เข้างานต่อ (Reopen หรือบันทึกต่อ)
      if (!activeAtt && latestClosedAtt) {
        await updateDoc(doc(db, 'employee_attendance', latestClosedAtt.id), {
          clockOut: null,
          resumedAt: new Date().toISOString()
        });
        setEmpSuccessMsg('บันทึกเวลาเข้างานต่อสำเร็จ ⏱️ กำลังเปิดระบบ...');
      } else if (!activeAtt) {
        // 2. ยังไม่เคยเข้างานวันนี้ -> บันทึกเข้างานใหม่
        await addDoc(getCol('employee_attendance'), {
          employeeId: selectedEmp.id,
          employeeName: selectedEmp.name,
          branch: targetBranch,
          date: todayIsoStr,
          clockIn: new Date().toISOString(),
          clockOut: null
        });
        setEmpSuccessMsg('ลงเวลาเข้างานสำเร็จ ✨ กำลังเปิดระบบ...');
      } else {
        setEmpSuccessMsg('ยืนยันรหัสผ่านสำเร็จ ✨ กำลังเปิดระบบ...');
      }

      try {
        sessionStorage.setItem(`pin_ok_${selectedEmp.id}`, String(Date.now()));
      } catch (e) {}

      setTimeout(() => {
        if (onStaffLoginSuccess) {
          onStaffLoginSuccess(targetBranch, selectedEmp);
        } else if (onStaffEnter) {
          onStaffEnter(targetBranch);
        }
      }, 350);
    } catch (err) {
      console.error('Error in employee login:', err);
      alert('เกิดข้อผิดพลาดในการบันทึกเวลา: ' + err.message);
      setEmpIsSubmitting(false);
    }
  };

  const todayIso = getLocalYYYYMMDD(now);

  const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-[1000000] bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900 flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-sans">
      {/* พื้นหลังตกแต่ง */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full -ml-24 -mt-24 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-400/10 rounded-full -mr-20 -mb-20 blur-3xl"></div>
      <div className="absolute top-1/3 right-1/4 w-40 h-40 bg-teal-300/10 rounded-full blur-2xl"></div>

      <div className="relative z-10 w-full max-w-md sm:max-w-lg">
        {/* โลโก้ + นาฬิกา */}
        <div className="text-center mb-5 animate-in fade-in duration-500">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-white/15 backdrop-blur-md rounded-[28px] border border-white/25 flex items-center justify-center shadow-2xl mb-3 sm:mb-4">
            <Sparkles size={36} className="text-white" />
          </div>
          <h1 className="text-white text-2xl sm:text-3xl font-black tracking-widest">IrisCare</h1>
          <p className="text-teal-200/80 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.25em] mt-0.5">Clinic Admin System</p>
          <div className="mt-3 inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-3.5 py-1.5 sm:px-4 sm:py-2">
            <Clock size={14} className="text-teal-200" />
            <span className="text-white font-mono font-black text-base sm:text-lg tabular-nums">{timeStr}</span>
            <span className="w-px h-4 bg-white/20" />
            <span className="text-teal-100/80 text-[11px] font-bold">{dateStr}</span>
          </div>
        </div>

        {/* การ์ดหลัก */}
        <div className="bg-white rounded-[32px] shadow-2xl p-5 sm:p-7 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* STEP: เลือกสาขา (ถ้ามีสาขาเดียวไม่ต้องแสดงสาขา) */}
          {!isSingleBranchMode && displayBranches.length > 1 && (
            <div className="mb-4">
              <h2 className="text-sm font-black text-gray-800 flex items-center mb-1">
                <span className="w-5 h-5 rounded-full bg-teal-500 text-white text-[10px] flex items-center justify-center mr-2 font-bold">1</span>
                เลือกสาขาที่ทำงาน
              </h2>
              <p className="text-[10px] text-gray-400 font-bold mb-3 ml-7 flex items-center gap-1">
                <MapPin size={10} className="text-teal-500" />
                {selectedBranch ? `สาขาปัจจุบัน: ${selectedBranch}` : 'แตะเพื่อเลือกสาขาที่ทำงาน'}
              </p>
              <div className={`grid ${displayBranches.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2.5`}>
                {displayBranches.map(b => {
                  const isSel = selectedBranch === b.name;
                  return (
                    <button
                      key={b.name}
                      onClick={() => {
                        setSelectedBranch(b.name);
                        localStorage.setItem('selectedBranch', b.name);
                      }}
                      className={`relative p-3.5 rounded-2xl border-2 text-left transition-all active:scale-95 ${isSel ? 'border-teal-500 bg-teal-50 shadow-md shadow-teal-500/20' : 'border-gray-100 bg-gray-50 hover:border-teal-200'}`}
                    >
                      <MapPin size={18} className={isSel ? 'text-teal-500' : 'text-gray-300'} />
                      <p className={`text-[13px] font-black mt-1.5 leading-tight ${isSel ? 'text-teal-700' : 'text-gray-700'}`}>{b.name}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP: เลือกบทบาท & แสดงเน้นไปที่การ์ดพนักงานแนวนอน */}
          {mode === 'main' && (
            <div className="animate-in fade-in duration-300">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-black text-gray-800 flex items-center">
                  {!isSingleBranchMode && displayBranches.length > 1 ? (
                    <span className="w-5 h-5 rounded-full bg-teal-500 text-white text-[10px] flex items-center justify-center mr-2 font-bold">2</span>
                  ) : (
                    <Users size={16} className="text-teal-600 mr-2" />
                  )}
                  <span>เข้าสู่ระบบพนักงาน</span>
                </h2>
                {selectedBranch && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                    <MapPin size={10} className="text-teal-600" />
                    สาขา {selectedBranch}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2.5">
                {selectedBranch ? (
                  <div className="space-y-2 mb-2">
                    {branchEmployees.map(emp => {
                      const empTodayAtts = attendance.filter(a => a.employeeId === emp.id && a.date === todayIso);
                      const activeAtt = empTodayAtts.find(a => !a.clockOut);
                      const isClockedIn = !!activeAtt;
                      const clockInTime = activeAtt?.time || activeAtt?.clockIn || (activeAtt?.createdAt ? new Date(activeAtt.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '');

                      const latestClosedAtt = empTodayAtts.filter(a => !!a.clockOut).sort((a,b) => new Date(b.clockOut || 0) - new Date(a.clockOut || 0))[0];

                      let totalMins = 0;
                      empTodayAtts.forEach(a => {
                        if (a.clockIn && a.clockOut) {
                          const diff = (new Date(a.clockOut) - new Date(a.clockIn)) / (1000 * 60);
                          if (diff > 0) totalMins += diff;
                        } else if (a.clockIn && !a.clockOut) {
                          const diff = (now - new Date(a.clockIn)) / (1000 * 60);
                          if (diff > 0) totalMins += diff;
                        }
                      });
                      const hWorked = Math.floor(totalMins / 60);
                      const mWorked = Math.round(totalMins % 60);
                      const workedText = `${hWorked} ชม. ${mWorked} น.`;

                      const hasClockedOut = !isClockedIn && !!latestClosedAtt;
                      const isShiftIncomplete = hasClockedOut && totalMins < (8 * 60);

                      return (
                        <div 
                          key={emp.id}
                          onClick={() => handleStartEmpPin(emp)}
                          className={`group relative p-3 sm:p-3.5 rounded-2xl border-2 transition-all cursor-pointer active:scale-[0.99] flex items-center justify-between gap-3 ${
                            isClockedIn 
                              ? 'bg-gradient-to-r from-indigo-50/70 via-white to-teal-50/40 border-indigo-200/90 hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-500/10' 
                              : isShiftIncomplete
                                ? 'bg-gradient-to-r from-amber-50/80 via-white to-orange-50/50 border-amber-300 hover:border-amber-400 hover:shadow-md hover:shadow-amber-500/15'
                                : 'bg-white hover:bg-slate-50 border-gray-150 hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-500/10'
                          }`}
                        >
                          {/* Avatar + Info */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative shrink-0">
                              <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl overflow-hidden bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center">
                                {emp.profileImage ? (
                                  <img src={emp.profileImage} alt={emp.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center text-white font-black text-base">
                                    {emp.name ? emp.name.charAt(0) : <Users size={20} />}
                                  </div>
                                )}
                              </div>
                              {/* Online / Clock-in status dot */}
                              <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                                isClockedIn ? 'bg-emerald-500 animate-pulse' : isShiftIncomplete ? 'bg-amber-500 animate-bounce' : 'bg-slate-300'
                              }`} />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="text-sm font-black text-gray-800 truncate leading-tight group-hover:text-teal-700 transition-colors">
                                  {emp.name}
                                </h4>
                                {emp.nickname && (
                                  <span className="text-[11px] font-bold text-gray-400">
                                    ({emp.nickname})
                                  </span>
                                )}
                              </div>

                              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                {isClockedIn ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    <CheckCircle size={10} className="text-emerald-600" />
                                    เข้างานแล้ว {clockInTime ? `• ${clockInTime} น.` : ''}
                                  </span>
                                ) : isShiftIncomplete ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                                    <Clock size={10} className="text-amber-600" />
                                    ออกงานแล้ว • ทำไป {workedText} (ยังไม่ครบ 8 ชม.)
                                  </span>
                                ) : hasClockedOut ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                                    <CheckCircle size={10} className="text-blue-600" />
                                    ครบกะแล้ว • {workedText}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                    <Clock size={10} className="text-slate-400" />
                                    ยังไม่ลงเวลา
                                  </span>
                                )}
                                {emp.role && emp.role !== 'staff' && (
                                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                                    {emp.role}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right Action Pill Button */}
                          <div className="shrink-0">
                            {isClockedIn ? (
                              <div className="py-2 px-3 sm:px-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 text-white font-black text-xs shadow-xs flex items-center gap-1 group-hover:shadow-md transition-all">
                                <Users size={12} />
                                <span>เข้าสู่ระบบ</span>
                                <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                              </div>
                            ) : isShiftIncomplete ? (
                              <div className="py-2 px-3 sm:px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-teal-600 text-white font-black text-xs shadow-xs flex items-center gap-1 group-hover:shadow-md transition-all ring-2 ring-amber-300/60">
                                <Clock size={12} />
                                <span>ลงเวลาต่อ</span>
                                <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                              </div>
                            ) : hasClockedOut ? (
                              <div className="py-2 px-3 sm:px-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 text-white font-black text-xs shadow-xs flex items-center gap-1 group-hover:shadow-md transition-all">
                                <Clock size={12} />
                                <span>ลงเวลาต่อ</span>
                                <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                              </div>
                            ) : (
                              <div className="py-2 px-3 sm:px-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs shadow-xs flex items-center gap-1 group-hover:shadow-md transition-all">
                                <Clock size={12} />
                                <span>ลงเวลา</span>
                                <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {branchEmployees.length === 0 && (
                      <div className="w-full py-6 text-center text-xs font-bold text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                        ไม่พบรายชื่อพนักงาน
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    disabled
                    className="p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed mb-2.5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gray-300 flex items-center justify-center">
                        <Clock size={22} className="text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-[13px] font-black text-gray-500">ลงเวลาเข้า/ออกงาน</p>
                        <p className="text-[10px] text-gray-400 font-bold leading-snug mt-0.5">กรุณาเลือกสาขาที่ทำงานก่อน</p>
                      </div>
                    </div>
                  </button>
                )}
                
                <button
                  onClick={() => { if (selectedBranch) { setMode('owner_passcode'); setPasscode(''); } }}
                  disabled={!selectedBranch}
                  className={`group relative overflow-hidden p-4 rounded-2xl text-left border-2 transition-all active:scale-[0.98] flex items-center gap-3 ${!selectedBranch ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed' : 'border-amber-100 bg-amber-50/60 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/20'}`}
                >
                  <div className="w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <Crown size={22} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-black text-gray-800">เจ้าของร้าน</p>
                    <p className="text-[10px] text-gray-500 font-bold leading-snug mt-0.5">สิทธิ์เต็มระบบ • รหัสผ่านหลัก 6 หลัก</p>
                  </div>
                  <ArrowRight size={18} className="shrink-0 transition-transform group-hover:translate-x-1 text-amber-400" />
                </button>
              </div>
            </div>
          )}

          {/* STEP: สไลด์กรอก PIN พนักงาน (เท่ๆ รวดเร็ว พร้อมรองรับลงเวลาต่อ) */}
          {mode === 'employee_pin' && selectedEmp && (() => {
            const empTodayAtts = attendance.filter(a => a.employeeId === selectedEmp.id && a.date === todayIso);
            const activeAtt = empTodayAtts.find(a => !a.clockOut);
            const isClockedInEmp = !!activeAtt;
            const latestClosedAtt = empTodayAtts.filter(a => !!a.clockOut).sort((a,b) => new Date(b.clockOut || 0) - new Date(a.clockOut || 0))[0];

            let totalMins = 0;
            empTodayAtts.forEach(a => {
              if (a.clockIn && a.clockOut) {
                const diff = (new Date(a.clockOut) - new Date(a.clockIn)) / (1000 * 60);
                if (diff > 0) totalMins += diff;
              } else if (a.clockIn && !a.clockOut) {
                const diff = (now - new Date(a.clockIn)) / (1000 * 60);
                if (diff > 0) totalMins += diff;
              }
            });
            const hWorked = Math.floor(totalMins / 60);
            const mWorked = Math.round(totalMins % 60);
            const workedTimeText = `${hWorked} ชม. ${mWorked} นาที`;

            const isResumingShift = !isClockedInEmp && !!latestClosedAtt;
            const isShiftUnder8Hours = isResumingShift && totalMins < (8 * 60);

            return (
              <div className="animate-in fade-in slide-in-from-right-6 duration-300">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                  <button 
                    type="button"
                    onClick={() => { setMode('main'); setEmpPasscode(''); setSelectedEmp(null); }} 
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                  >
                    <ArrowRight size={14} className="rotate-180" />
                    <span>ย้อนกลับ</span>
                  </button>
                  <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                    isResumingShift 
                      ? 'bg-amber-50 text-amber-800 border-amber-200' 
                      : isClockedInEmp 
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    {isResumingShift ? '⚡ ลงเวลาต่อ' : isClockedInEmp ? '🟢 เข้าสู่ระบบ' : '⏱️ ลงเวลาเข้างาน'}
                  </span>
                </div>

                {/* Spotlight Employee Profile */}
                <div className="flex flex-col items-center text-center mb-5">
                  <div className="relative mb-2.5">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl overflow-hidden bg-slate-100 border-3 border-teal-500/30 shadow-lg shadow-teal-500/10 flex items-center justify-center">
                      {selectedEmp.profileImage ? (
                        <img src={selectedEmp.profileImage} alt={selectedEmp.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl">
                          {selectedEmp.name ? selectedEmp.name.charAt(0) : <Users size={28} />}
                        </div>
                      )}
                    </div>
                    <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                      isClockedInEmp ? 'bg-emerald-500 animate-pulse' : isResumingShift ? 'bg-amber-500 animate-bounce' : 'bg-slate-300'
                    }`} />
                  </div>

                  <h3 className="text-lg font-black text-gray-900 leading-tight">
                    {selectedEmp.name} {selectedEmp.nickname ? `(${selectedEmp.nickname})` : ''}
                  </h3>
                  
                  {isResumingShift ? (
                    <div className="mt-1 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] font-bold text-amber-800 max-w-xs">
                      {isShiftUnder8Hours ? (
                        <span>⚠️ ออกงานแล้ว (ทำงานไป {workedTimeText} ยังไม่ครบ 8 ชม.) • กรอก PIN เพื่อลงเวลาเข้างานต่อ</span>
                      ) : (
                        <span>ออกงานแล้วเมื่อ {new Date(latestClosedAtt.clockOut).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น. • กรอก PIN เพื่อเข้างานต่อ</span>
                      )}
                    </div>
                  ) : isClockedInEmp ? (
                    <p className="text-xs text-emerald-600 font-bold mt-1">
                      🟢 เข้างานแล้วเมื่อ {activeAtt?.clockIn ? new Date(activeAtt.clockIn).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : ''} น.
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 font-bold mt-1">
                      กรอก PIN 4 หลักเพื่อบันทึกเวลาเข้างาน สาขา {selectedBranch || selectedEmp.branch || 'เฉวง'}
                    </p>
                  )}
                </div>

                {/* 4-digit PIN Indicator */}
                <div className={`flex items-center justify-center gap-3.5 mb-5 ${empPassError ? 'animate-in shake' : ''}`}>
                  {Array.from({ length: 4 }).map((_, i) => {
                    const isFilled = empPasscode.length > i;
                    return (
                      <div 
                        key={i} 
                        className={`w-12 h-14 rounded-2xl border-2 flex items-center justify-center transition-all duration-200 ${
                          empPassError 
                            ? 'border-red-400 bg-red-50 shadow-sm shadow-red-200' 
                            : isFilled 
                              ? 'border-teal-500 bg-teal-50 shadow-md shadow-teal-500/20 scale-105' 
                              : 'border-gray-200 bg-gray-50/80'
                        }`}
                      >
                        {isFilled && (
                          <span className={`w-4 h-4 rounded-full transition-transform scale-110 ${
                            empPassError ? 'bg-red-500' : 'bg-gradient-to-br from-teal-500 to-indigo-600'
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {empPassError && (
                  <p className="text-center text-xs font-black text-red-500 -mt-2 mb-3 animate-in fade-in">
                    รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง
                  </p>
                )}

                {empSuccessMsg && (
                  <p className="text-center text-xs font-black text-emerald-600 -mt-2 mb-3 animate-in fade-in flex items-center justify-center gap-1">
                    <CheckCircle size={14} />
                    <span>{empSuccessMsg}</span>
                  </p>
                )}

                {/* PIN Keypad Grid */}
                <div className="grid grid-cols-3 gap-2.5 max-w-[270px] mx-auto">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(k => (
                    <button 
                      key={k} 
                      type="button"
                      disabled={empIsSubmitting}
                      onClick={() => pressEmpKey(k)} 
                      className="h-13 rounded-2xl bg-gray-50 hover:bg-teal-50 border border-gray-150 text-xl font-black text-gray-800 active:scale-95 hover:border-teal-300 transition-all shadow-2xs disabled:opacity-50"
                    >
                      {k}
                    </button>
                  ))}
                  <button 
                    type="button"
                    disabled={empIsSubmitting}
                    onClick={() => pressEmpKey('del')} 
                    className="h-13 rounded-2xl bg-gray-50 hover:bg-red-50 border border-gray-150 flex items-center justify-center text-gray-500 hover:text-red-500 active:scale-95 hover:border-red-200 transition-all disabled:opacity-50"
                  >
                    <Delete size={20} />
                  </button>
                  <button 
                    type="button"
                    disabled={empIsSubmitting}
                    onClick={() => pressEmpKey('0')} 
                    className="h-13 rounded-2xl bg-gray-50 hover:bg-teal-50 border border-gray-150 text-xl font-black text-gray-800 active:scale-95 hover:border-teal-300 transition-all shadow-2xs disabled:opacity-50"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    disabled={empPasscode.length < 4 || empIsSubmitting}
                    onClick={() => handleEmpPinSubmit(empPasscode)}
                    className={`h-13 rounded-2xl flex items-center justify-center gap-1 text-xs font-black active:scale-95 transition-all shadow-md ${
                      empPasscode.length < 4 || empIsSubmitting 
                        ? 'bg-gray-100 text-gray-400 border border-gray-200' 
                        : 'bg-gradient-to-r from-teal-500 to-indigo-600 text-white shadow-teal-500/25 hover:from-teal-600 hover:to-indigo-700'
                    }`}
                  >
                    {empIsSubmitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                    <span>{empIsSubmitting ? 'ยืนยัน...' : 'ยืนยัน'}</span>
                  </button>
                </div>

                <div className="text-center mt-3">
                  <p className="text-[10px] text-gray-400">
                    PIN เริ่มต้นคือ <span className="font-mono font-bold text-gray-600">1234</span>
                  </p>
                </div>
              </div>
            );
          })()}

          {/* STEP: รหัสผ่านเจ้าของร้าน */}
          {mode === 'owner_passcode' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-black text-gray-800 flex items-center">
                  <Crown size={16} className="text-amber-500 mr-2" /> รหัสผ่านเจ้าของร้าน
                </h2>
                <button onClick={() => { setMode('main'); setPasscode(''); }} className="text-[10px] font-black text-gray-400 hover:text-gray-600">
                  ← ย้อนกลับ
                </button>
              </div>

              <div className={`flex items-center justify-center gap-3 mb-5 ${passError ? 'animate-in shake' : ''}`}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={`w-11 h-13 rounded-xl border-2 flex items-center justify-center transition-all ${passError ? 'border-red-400 bg-red-50' : passcode.length > i ? 'border-teal-500 bg-teal-50' : 'border-gray-200 bg-gray-50'}`}>
                    {passcode.length > i && <span className={`w-3.5 h-3.5 rounded-full ${passError ? 'bg-red-400' : 'bg-teal-500'}`}></span>}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(k => (
                  <button key={k} onClick={() => pressKey(k)} className="h-14 rounded-2xl bg-gray-50 hover:bg-teal-50 border border-gray-100 text-xl font-black text-gray-700 active:scale-95 transition-all">{k}</button>
                ))}
                <button onClick={() => pressKey('del')} className="h-14 rounded-2xl bg-gray-50 hover:bg-red-50 border border-gray-100 flex items-center justify-center text-gray-400 active:scale-95 transition-all"><Delete size={20} /></button>
                <button onClick={() => pressKey('0')} className="h-14 rounded-2xl bg-gray-50 hover:bg-teal-50 border border-gray-100 text-xl font-black text-gray-700 active:scale-95 transition-all">0</button>
                <button
                  onClick={handleOwnerSubmit}
                  disabled={passcode.length === 0 || isSubmitting}
                  className={`h-14 rounded-2xl flex items-center justify-center gap-1 text-[11px] font-black active:scale-95 transition-all ${passcode.length === 0 || isSubmitting ? 'bg-gray-100 text-gray-400' : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30'}`}
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  {isSubmitting ? 'ตรวจสอบ' : 'ยืนยัน'}
                </button>
              </div>
              {passError && <p className="text-center text-[10px] font-black text-red-500 mt-3">รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่</p>}
            </div>
          )}
        </div>

        <p className="text-center text-teal-200/50 text-[9px] font-bold mt-5 tracking-widest uppercase">
          IrisCare Clinic • ระบบหลังร้าน v2.0
        </p>
      </div>
    </div>
  );
}
