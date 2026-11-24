import React, { useState, useEffect } from 'react';
import { Sparkles, MapPin, Navigation, Users, Crown, Delete, ArrowRight, Loader2, Clock, Banknote, CheckCircle, Zap, Target } from 'lucide-react';
import { getLocalYYYYMMDD, normalizeBranchName, parseThaiDate } from '../utils/parse';

// 🌟 หน้าล็อกอินแอดมิน IrisCare — เลือกสาขา (GPS ไฮไลต์อัตโนมัติ) + เข้าแบบพนักงาน/เจ้าของร้าน (รหัสผ่าน)
export default function AdminLoginPage({ branches = [], employees = [], attendance = [], appSettings = {}, initialBranch = null, onStaffEnter, onOwnerEnter, onOpenAttendance, dailySales = [], onQuickEod, onOpenMoleService, flashMessage = null }) {
  const activeBranches = branches.filter(b => !b.isMaintenance);
  const displayBranches = activeBranches.length > 0 ? activeBranches : branches;
  const empBranchCount = new Set(employees.map(e => normalizeBranchName(e.branch)).filter(Boolean)).size;
  const isSingleBranchMode = displayBranches.length <= 1 || empBranchCount <= 1;

  const [now, setNow] = useState(new Date());
  const [selectedBranch, setSelectedBranch] = useState(() => {
    return initialBranch || localStorage.getItem('selectedBranch') || (displayBranches.length > 0 ? displayBranches[0].name : null);
  });
  const [mode, setMode] = useState('main'); // 'main' | 'owner_passcode'
  const [passcode, setPasscode] = useState('');
  const [passError, setPassError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // 🌟 ส่งยอดด่วน (EOD) — เช็คว่าสาขานี้ส่งยอดวันนี้แล้วหรือยัง
  const todayIso = getLocalYYYYMMDD(now);
  const todayTh = now.toLocaleDateString('th-TH');
  const todayEodRecords = selectedBranch
    ? dailySales.filter(d => (d.date === todayIso || d.date === todayTh || getLocalYYYYMMDD(parseThaiDate(d.date)) === todayIso) && normalizeBranchName(d.branch) === normalizeBranchName(selectedBranch))
    : [];
  const eodDoneToday = todayEodRecords.length > 0;
  const lastEodRecord = [...todayEodRecords].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];
  const lastEodBy = lastEodRecord ? (employees.find(e => e.id === lastEodRecord.submittedBy)?.name || lastEodRecord.submittedByName || '') : '';
  const lastEodTime = lastEodRecord?.createdAt ? new Date(lastEodRecord.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '';

  const openQuickEod = () => {
    if (!selectedBranch) return;
    if (eodDoneToday && !window.confirm(`สาขา ${selectedBranch} ส่งยอดวันนี้ไปแล้ว${lastEodTime ? ` (เวลา ${lastEodTime} น.)` : ''}\nต้องการส่งยอดซ้ำอีกครั้งใช่หรือไม่?`)) return;
    setMode('eod_passcode');
    setPasscode('');
  };

  const handleEodPinSubmit = () => {
    if (passcode.length < 4) return;
    setIsSubmitting(true);
    setTimeout(() => {
      const emp = employees.find(e => normalizeBranchName(e.branch) === normalizeBranchName(selectedBranch) && String(e.pin || '1234') === passcode);
      if (emp && onQuickEod) {
        onQuickEod(selectedBranch, emp);
        setMode('main');
        setPasscode('');
      } else {
        setPassError(true);
        setPasscode('');
        setTimeout(() => setPassError(false), 600);
      }
      setIsSubmitting(false);
    }, 250);
  };

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

        {/* แจ้งผลหลังส่งยอดด่วน */}
        {flashMessage && (
          <div className={`mb-4 rounded-2xl px-4 py-3 flex items-center gap-2 text-[12px] font-black shadow-lg animate-in fade-in slide-in-from-top-2 duration-300 ${flashMessage.type === 'success' ? 'bg-emerald-400/95 text-emerald-950' : 'bg-white/90 text-gray-700'}`}>
            <CheckCircle size={16} className="shrink-0" />
            {flashMessage.text}
          </div>
        )}

        {/* การ์ดหลัก */}
        <div className="bg-white rounded-[32px] shadow-2xl p-5 sm:p-7 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* 🌟 แบนเนอร์สวยๆ กดไปยังเมนูหน้าจี้ไฝได้ 🌟 */}
          <div 
            onClick={() => {
              if (onOpenMoleService) {
                onOpenMoleService(selectedBranch || displayBranches[0]?.name || 'เฉวง');
              }
            }}
            className="group relative overflow-hidden rounded-2xl p-3.5 sm:p-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/20 border border-orange-300/40 cursor-pointer active:scale-[0.98] transition-all hover:shadow-xl hover:shadow-orange-500/30 mb-4"
          >
            {/* Ambient background decoration */}
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-300/20 via-transparent to-transparent pointer-events-none"></div>

            <div className="relative z-10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                  <Target size={22} className="text-white drop-shadow-sm" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-black px-2 py-0.2 rounded-full bg-white/25 text-white tracking-wide border border-white/20">
                      ✨ หัตถการยอดนิยม
                    </span>
                    <span className="text-[10px] font-bold text-amber-100">
                      ฿200 - ฿5,000
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-white leading-tight mt-0.5 truncate drop-shadow-xs">
                    จี้ไฝ / กระ / ติ่งเนื้อ
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-amber-100/90 font-medium truncate mt-0.5">
                    เลือกราคาด่วน 8 ราคา หรือระบุราคาเอง • คิดค่ามือตามบิล
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1 bg-white text-orange-600 font-black text-xs px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl shadow-md transition-all group-hover:bg-amber-50 group-hover:translate-x-0.5">
                <span>เปิดหน้าจี้ไฝ</span>
                <ArrowRight size={13} />
              </div>
            </div>
          </div>

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
                      const todayStr = getLocalYYYYMMDD(now);
                      const todayAtt = attendance.find(a => a.employeeId === emp.id && a.date === todayStr && !a.clockOut);
                      const isClockedIn = !!todayAtt;
                      const clockInTime = todayAtt?.time || todayAtt?.clockIn || (todayAtt?.createdAt ? new Date(todayAtt.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '');

                      return (
                        <div 
                          key={emp.id}
                          onClick={() => { if (selectedBranch && onOpenAttendance) onOpenAttendance(selectedBranch, emp); }}
                          className={`group relative p-3 sm:p-3.5 rounded-2xl border-2 transition-all cursor-pointer active:scale-[0.99] flex items-center justify-between gap-3 ${
                            isClockedIn 
                              ? 'bg-gradient-to-r from-indigo-50/70 via-white to-teal-50/40 border-indigo-200/90 hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-500/10' 
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
                                isClockedIn ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
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

                {/* 🌟 ส่งยอดด่วน (EOD) — ไม่ต้องเข้าระบบเต็ม */}
                <button
                  onClick={openQuickEod}
                  disabled={!selectedBranch}
                  className={`group relative overflow-hidden p-4 rounded-2xl text-left border-2 transition-all active:scale-[0.98] flex items-center gap-3 ${!selectedBranch ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed' : eodDoneToday ? 'border-emerald-100 bg-emerald-50/60 hover:border-emerald-300' : 'border-rose-100 bg-gradient-to-r from-rose-50 to-orange-50 hover:border-rose-400 hover:shadow-lg hover:shadow-rose-500/20'}`}
                >
                  <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center shadow-lg ${eodDoneToday ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-500/30' : 'bg-gradient-to-br from-rose-500 to-orange-500 shadow-rose-500/30'}`}>
                    {eodDoneToday ? <CheckCircle size={22} className="text-white" /> : <Banknote size={22} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-black text-gray-800 flex items-center gap-1">
                      ส่งยอดด่วน (EOD)
                      {!eodDoneToday && selectedBranch && <Zap size={12} className="text-orange-500 fill-orange-400" />}
                    </p>
                    <p className={`text-[10px] font-bold leading-snug mt-0.5 truncate ${eodDoneToday ? 'text-emerald-600' : 'text-gray-500'}`}>
                      {!selectedBranch
                        ? 'กรุณาเลือกสาขาก่อน'
                        : eodDoneToday
                          ? `ส่งยอดวันนี้แล้ว${lastEodTime ? ` • ${lastEodTime} น.` : ''}${lastEodBy ? ` • ${lastEodBy}` : ''}`
                          : 'ปิดยอดประจำวัน + ลงเวลาออก ด้วย PIN พนักงาน'}
                    </p>
                  </div>
                  <ArrowRight size={18} className={`shrink-0 transition-transform group-hover:translate-x-1 ${eodDoneToday ? 'text-emerald-400' : 'text-rose-400'}`} />
                </button>
              </div>
            </div>
          )}

          {/* STEP: ส่งยอดด่วน — PIN พนักงาน */}
          {mode === 'eod_passcode' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-black text-gray-800 flex items-center">
                  <Banknote size={16} className="text-rose-500 mr-2" /> ส่งยอดด่วน — ใส่ PIN ผู้ส่งยอด
                </h2>
                <button onClick={() => { setMode('main'); setPasscode(''); }} className="text-[10px] font-black text-gray-400 hover:text-gray-600">
                  ← ย้อนกลับ
                </button>
              </div>
              <p className="text-[10px] text-gray-400 font-bold mb-4 ml-6">สาขา {selectedBranch} • ระบบจะเปิดหน้าสรุปยอดให้ทันที</p>

              <div className={`flex items-center justify-center gap-3 mb-5 ${passError ? 'animate-in shake' : ''}`}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={`w-11 h-13 rounded-xl border-2 flex items-center justify-center transition-all ${passError ? 'border-red-400 bg-red-50' : passcode.length > i ? 'border-rose-500 bg-rose-50' : 'border-gray-200 bg-gray-50'}`}>
                    {passcode.length > i && <span className={`w-3.5 h-3.5 rounded-full ${passError ? 'bg-red-400' : 'bg-rose-500'}`}></span>}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(k => (
                  <button key={k} onClick={() => { if (passcode.length < 4) pressKey(k); }} className="h-14 rounded-2xl bg-gray-50 hover:bg-rose-50 border border-gray-100 text-xl font-black text-gray-700 active:scale-95 transition-all">{k}</button>
                ))}
                <button onClick={() => pressKey('del')} className="h-14 rounded-2xl bg-gray-50 hover:bg-red-50 border border-gray-100 flex items-center justify-center text-gray-400 active:scale-95 transition-all"><Delete size={20} /></button>
                <button onClick={() => { if (passcode.length < 4) pressKey('0'); }} className="h-14 rounded-2xl bg-gray-50 hover:bg-rose-50 border border-gray-100 text-xl font-black text-gray-700 active:scale-95 transition-all">0</button>
                <button
                  onClick={handleEodPinSubmit}
                  disabled={passcode.length < 4 || isSubmitting}
                  className={`h-14 rounded-2xl flex items-center justify-center gap-1 text-[11px] font-black active:scale-95 transition-all ${passcode.length < 4 || isSubmitting ? 'bg-gray-100 text-gray-400' : 'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-500/30'}`}
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  {isSubmitting ? 'ตรวจสอบ' : 'ส่งยอด'}
                </button>
              </div>
              {passError && <p className="text-center text-[10px] font-black text-red-500 mt-3">ไม่พบพนักงานสาขานี้ที่ใช้ PIN นี้</p>}
            </div>
          )}

          {/* STEP: รหัสผ่านพนักงาน */}
          {mode === 'staff_passcode' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-black text-gray-800 flex items-center">
                  <Users size={16} className="text-indigo-500 mr-2" /> รหัสพนักงาน (PIN)
                </h2>
                <button onClick={() => { setMode('main'); setPasscode(''); }} className="text-[10px] font-black text-gray-400 hover:text-gray-600">
                  ← ย้อนกลับ
                </button>
              </div>

              <div className={`flex items-center justify-center gap-3 mb-5 ${passError ? 'animate-in shake' : ''}`}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={`w-11 h-13 rounded-xl border-2 flex items-center justify-center transition-all ${passError ? 'border-red-400 bg-red-50' : passcode.length > i ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-gray-50'}`}>
                    {passcode.length > i && <span className={`w-3.5 h-3.5 rounded-full ${passError ? 'bg-red-400' : 'bg-indigo-500'}`}></span>}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(k => (
                  <button key={k} onClick={() => { if (passcode.length < 4) pressKey(k); }} className="h-14 rounded-2xl bg-gray-50 hover:bg-indigo-50 border border-gray-100 text-xl font-black text-gray-700 active:scale-95 transition-all">{k}</button>
                ))}
                <button onClick={() => pressKey('del')} className="h-14 rounded-2xl bg-gray-50 hover:bg-red-50 border border-gray-100 flex items-center justify-center text-gray-400 active:scale-95 transition-all"><Delete size={20} /></button>
                <button onClick={() => { if (passcode.length < 4) pressKey('0'); }} className="h-14 rounded-2xl bg-gray-50 hover:bg-indigo-50 border border-gray-100 text-xl font-black text-gray-700 active:scale-95 transition-all">0</button>
                <button
                  onClick={handleStaffSubmit}
                  disabled={passcode.length < 4 || isSubmitting}
                  className={`h-14 rounded-2xl flex items-center justify-center gap-1 text-[11px] font-black active:scale-95 transition-all ${passcode.length < 4 || isSubmitting ? 'bg-gray-100 text-gray-400' : 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30'}`}
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  {isSubmitting ? 'ตรวจสอบ' : 'เข้าสู่ระบบ'}
                </button>
              </div>
              {passError && <p className="text-center text-[10px] font-black text-red-500 mt-3">รหัส PIN ไม่ถูกต้อง หรือยังไม่ได้ลงเวลาเข้างาน</p>}
            </div>
          )}

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
