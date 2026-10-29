import React, { useState, useEffect } from 'react';
import { Sparkles, MapPin, Navigation, Users, Crown, Delete, ArrowRight, Loader2, Clock, Banknote, CheckCircle, Zap } from 'lucide-react';

// 🌟 หน้าล็อกอินแอดมิน IrisCare — เลือกสาขา (GPS ไฮไลต์อัตโนมัติ) + เข้าแบบพนักงาน/เจ้าของร้าน (รหัสผ่าน)
export default function AdminLoginPage({ branches = [], employees = [], attendance = [], appSettings = {}, initialBranch = null, onStaffEnter, onOwnerEnter, onOpenAttendance, dailySales = [], onQuickEod, flashMessage = null }) {
  const activeBranches = branches.filter(b => !b.isMaintenance);
  const displayBranches = activeBranches.length > 0 ? activeBranches : branches;
  const empBranchCount = new Set(employees.map(e => String(e.branch || '').replace('สาขา', '').trim()).filter(Boolean)).size;
  const isSingleBranchMode = displayBranches.length <= 1 || empBranchCount <= 1;

  const [now, setNow] = useState(new Date());
  const [selectedBranch, setSelectedBranch] = useState(() => initialBranch || (displayBranches.length === 1 ? displayBranches[0].name : null));
  const [nearestBranch, setNearestBranch] = useState(null);
  const [mode, setMode] = useState('main'); // 'main' | 'owner_passcode'
  const [passcode, setPasscode] = useState('');
  const [passError, setPassError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // นาฬิกาสด
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // GPS: หาสาขาใกล้ตัว (ไฮไลต์ + เลือกให้อัตโนมัติถ้าในระยะ 2 กม. — หากมีสาขาเดียวให้เลือกทันทีและข้าม GPS)
  useEffect(() => {
    if (displayBranches.length === 0) return;
    if (isSingleBranchMode) {
      setSelectedBranch(prev => prev || displayBranches[0].name);
      return;
    }
    const branchesWithGps = displayBranches.filter(b => b.lat && b.lng);
    if (branchesWithGps.length <= 1 || !navigator.geolocation) {
      if (displayBranches.length === 1) setSelectedBranch(displayBranches[0].name);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const R = 6371e3;
        let nearest = null, minDist = Infinity;
        branchesWithGps.forEach(b => {
          if (b.lat && b.lng) {
            const φ1 = b.lat * Math.PI / 180, φ2 = latitude * Math.PI / 180;
            const Δφ = (latitude - b.lat) * Math.PI / 180, Δλ = (longitude - b.lng) * Math.PI / 180;
            const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
            const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            if (d < minDist) { minDist = d; nearest = b.name; }
          }
        });
        if (nearest && minDist <= 2000) {
          setNearestBranch(nearest);
          setSelectedBranch(prev => prev || nearest);
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, [branches, employees]);

  useEffect(() => {
    if (branches.length > 0 && !selectedBranch && nearestBranch === null) {
      // ยังไม่เลือก — รอผู้ใช้กด (ไม่บังคับ default)
    }
  }, [branches]);

  const masterPasscode = appSettings?.masterPasscode || '999999';

  const handleStaffSubmit = () => {
    if (passcode.length < 4) return;
    setIsSubmitting(true);
    setTimeout(() => {
      const normalizeBranch = b => String(b || '').replace('สาขา', '').trim();
      const emp = employees.find(e => normalizeBranch(e.branch) === normalizeBranch(selectedBranch) && String(e.pin || '1234') === passcode);
      if (emp) {
        const todayStr = new Date().toISOString().split('T')[0];
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
  const normBranch = (b) => String(b || '').replace('สาขา', '').trim();
  const todayTh = now.toLocaleDateString('th-TH');
  const todayEodRecords = selectedBranch
    ? dailySales.filter(d => d.date === todayTh && normBranch(d.branch) === normBranch(selectedBranch))
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
      const emp = employees.find(e => normBranch(e.branch) === normBranch(selectedBranch) && String(e.pin || '1234') === passcode);
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

      <div className="relative z-10 w-full max-w-md">
        {/* โลโก้ + นาฬิกา */}
        <div className="text-center mb-6 animate-in fade-in duration-500">
          <div className="w-20 h-20 mx-auto bg-white/15 backdrop-blur-md rounded-[28px] border border-white/25 flex items-center justify-center shadow-2xl mb-4">
            <Sparkles size={40} className="text-white" />
          </div>
          <h1 className="text-white text-3xl font-black tracking-widest">IrisCare</h1>
          <p className="text-teal-200/80 text-[11px] font-bold uppercase tracking-[0.25em] mt-1">Clinic Admin System</p>
          <div className="mt-4 inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-2">
            <Clock size={14} className="text-teal-200" />
            <span className="text-white font-mono font-black text-lg tabular-nums">{timeStr}</span>
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
        <div className="bg-white rounded-[32px] shadow-2xl p-6 sm:p-7 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* STEP: เลือกสาขา */}
          <div>
            <h2 className="text-sm font-black text-gray-800 flex items-center mb-1">
              <span className="w-5 h-5 rounded-full bg-teal-500 text-white text-[10px] flex items-center justify-center mr-2">1</span>
              เลือกสาขาที่ทำงาน
            </h2>
            <p className="text-[10px] text-gray-400 font-bold mb-3 ml-7 flex items-center gap-1">
              <Navigation size={10} className="text-teal-500" />
              {isSingleBranchMode
                ? `เลือกสาขา ${selectedBranch || displayBranches[0]?.name || ''} อัตโนมัติ (ข้ามการเช็ค GPS)`
                : nearestBranch
                  ? `ระบบตรวจพบว่าคุณอยู่ใกล้ ${nearestBranch}`
                  : 'ระบบจะตรวจสาขาใกล้คุณอัตโนมัติ (GPS)'}
            </p>
            <div className={`grid ${displayBranches.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2.5 mb-5`}>
              {displayBranches.map(b => {
                const isSel = selectedBranch === b.name;
                const isNear = nearestBranch === b.name;
                return (
                  <button
                    key={b.name}
                    onClick={() => setSelectedBranch(b.name)}
                    className={`relative p-4 rounded-2xl border-2 text-left transition-all active:scale-95 ${isSel ? 'border-teal-500 bg-teal-50 shadow-md shadow-teal-500/20' : 'border-gray-100 bg-gray-50 hover:border-teal-200'}`}
                  >
                    {isNear && (
                      <span className="absolute -top-2 right-2 bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full border-2 border-white flex items-center gap-0.5">
                        <Navigation size={7} /> ใกล้คุณ
                      </span>
                    )}
                    <MapPin size={18} className={isSel ? 'text-teal-500' : 'text-gray-300'} />
                    <p className={`text-[13px] font-black mt-1.5 leading-tight ${isSel ? 'text-teal-700' : 'text-gray-700'}`}>{b.name}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP: เลือกบทบาท */}
          {mode === 'main' && (
            <div className="animate-in fade-in duration-300">
              <h2 className="text-sm font-black text-gray-800 flex items-center mb-3">
                <span className="w-5 h-5 rounded-full bg-teal-500 text-white text-[10px] flex items-center justify-center mr-2">2</span>
                เข้าสู่ระบบในบทบาท
              </h2>
              <div className="flex flex-col gap-2.5">
                {selectedBranch ? (
                  <div className="mb-2">
                    <p className="text-[11px] font-bold text-gray-500 mb-2 flex items-center"><Users size={12} className="mr-1"/> พนักงานสาขา {selectedBranch}</p>
                    <div className="flex overflow-x-auto gap-3 pb-2 snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                       {employees.filter(e => String(e.branch || '').replace('สาขา', '').trim() === String(selectedBranch || '').replace('สาขา', '').trim()).map(emp => {
                          const todayStr = new Date().toISOString().split('T')[0];
                          const todayAtt = attendance.find(a => a.employeeId === emp.id && a.date === todayStr && !a.clockOut);
                          const isClockedIn = !!todayAtt;

                          return (
                          <div 
                             key={emp.id}
                             onClick={() => { if (selectedBranch && onOpenAttendance) onOpenAttendance(selectedBranch, emp); }}
                             className={`min-w-[100px] max-w-[100px] p-3 rounded-2xl border bg-white shadow-sm flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 snap-start shrink-0 ${isClockedIn ? 'border-indigo-200 hover:border-indigo-400 hover:shadow-md' : 'border-gray-100 hover:border-emerald-300 hover:shadow-md'}`}
                          >
                             <div className="w-12 h-12 bg-gray-100 rounded-full mb-2 overflow-hidden border border-gray-100 flex items-center justify-center shrink-0">
                                {emp.profileImage ? (
                                    <img src={emp.profileImage} alt={emp.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Users size={20} className="text-gray-400" />
                                )}
                             </div>
                             <p className="text-[11px] font-black text-gray-800 text-center truncate w-full mb-2">{emp.name}</p>
                             <button className={`w-full py-1.5 rounded-lg text-[10px] font-bold border flex items-center justify-center gap-1 transition-colors ${isClockedIn ? 'bg-indigo-50 text-indigo-600 border-indigo-100 active:bg-indigo-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100 active:bg-emerald-100'}`}>
                                {isClockedIn ? <Users size={10} /> : <Clock size={10} />}
                                {isClockedIn ? 'เข้าสู่ระบบ' : 'ลงเวลา'}
                             </button>
                          </div>
                          );
                       })}
                       {employees.filter(e => String(e.branch || '').replace('สาขา', '').trim() === String(selectedBranch || '').replace('สาขา', '').trim()).length === 0 && (
                          <div className="w-full py-4 text-center text-[11px] font-bold text-gray-400 border border-dashed border-gray-200 rounded-2xl">
                             ไม่พบรายชื่อพนักงาน
                          </div>
                       )}
                    </div>
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
