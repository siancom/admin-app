import React, { useState, useEffect } from 'react';
import { Calendar, CalendarPlus, CheckCircle, Clock, X, Info, AlertCircle, Plus, Minus, Zap, Users } from 'lucide-react';
import { getDocRef } from '../config/firebase';
import { deleteDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { getLocalYYYYMMDD, normalizeBranchName } from '../utils/parse';
import { getSafeDateTime, getBookingStatus } from '../utils/dateUtils';
import BookingCountdown from './BookingCountdown';
import { DEFAULT_BOOKING_CONFIG } from '../utils/bookingConfig';

const CLINIC_TIME_SLOTS = [
    '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', 
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
];

export default function CalendarBookingDashboard({ 
    bookings = [], 
    storeHolidays = [],
    branches = [],
    onSelectBooking
}) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState('all');
    const [selectedHolidayBranch, setSelectedHolidayBranch] = useState('all');
    const [bookingConfig, setBookingConfig] = useState(DEFAULT_BOOKING_CONFIG);
    const [extraSlotBranch, setExtraSlotBranch] = useState('all');

    useEffect(() => {
        const unsub = onSnapshot(getDocRef('config', 'booking'), (snap) => {
            if (snap.exists()) {
                setBookingConfig(prev => ({
                    ...DEFAULT_BOOKING_CONFIG,
                    ...snap.data(),
                    extraSlotOverrides: snap.data().extraSlotOverrides || {}
                }));
            }
        }, (err) => console.error("Error fetching booking config:", err));
        return () => unsub();
    }, []);

    const handleToggleExtraSlot = async (dateStr, branchName, slotTime, delta) => {
        const cleanBranch = branchName.replace(/^สาขา/, '').trim();
        const key = `${dateStr}_${cleanBranch}_${slotTime}`;
        const currentExtra = Number(bookingConfig?.extraSlotOverrides?.[key] || 0);
        const newExtra = Math.max(0, currentExtra + delta);
        
        setIsSaving(true);
        try {
            await setDoc(getDocRef('config', 'booking'), {
                extraSlotOverrides: {
                    ...(bookingConfig?.extraSlotOverrides || {}),
                    [key]: newExtra
                }
            }, { merge: true });
        } catch (err) {
            console.error("Failed to update extra slot:", err);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();

    const monthName = currentMonth.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });

    // Build day grid
    const blanks = Array.from({length: firstDayOfWeek}, (_, i) => i);
    const days = Array.from({length: daysInMonth}, (_, i) => i + 1);

    const getLocalDateString = (d) => getLocalYYYYMMDD(d);

    const matchesHolidayDate = (h, dateStr) => {
        if (!h || !dateStr) return false;
        return h.date === dateStr || h.id === dateStr || (typeof h.id === 'string' && h.id.startsWith(`${dateStr}_`));
    };

    const isGlobalHolidayDoc = (h) => {
        if (!h) return false;
        if (h.branch === 'all') return true;
        if (Array.isArray(h.branches) && h.branches.includes('all')) return true;
        if (!h.branch && (!h.branches || h.branches.length === 0)) return true;
        return false;
    };

    const getHolidayBranchList = (h) => {
        if (!h) return [];
        if (Array.isArray(h.branches) && h.branches.length > 0) return h.branches;
        if (h.branch) return [h.branch];
        return ['all'];
    };

    const isHoliday = (dateStr) => {
        return storeHolidays.find(h => {
            if (!matchesHolidayDate(h, dateStr)) return false;
            if (isGlobalHolidayDoc(h)) return true;
            if (selectedBranch === 'all') return false;
            const normSelected = normalizeBranchName(selectedBranch);
            return getHolidayBranchList(h).some(br => normalizeBranchName(br) === normSelected);
        });
    };

    const getBranchSpecificHolidaysForDate = (dateStr) => {
        return storeHolidays.filter(h => matchesHolidayDate(h, dateStr) && !isGlobalHolidayDoc(h));
    };

    const getBookingsForDate = (dateStr) => {
        return bookings.filter(b => {
            if (!b) return false;
            const rawStatus = String(b.status || b['สถานะ'] || '').trim();
            if (rawStatus === 'ยกเลิก' || rawStatus === 'ยกเลิกโดยลูกค้า' || rawStatus === 'ยกเลิกฉุกเฉิน' || getBookingStatus(b) === 'ยกเลิก') return false;
            if (selectedBranch !== 'all' && normalizeBranchName(b.branch) !== normalizeBranchName(selectedBranch)) return false;
            const safeDt = getSafeDateTime(b);
            if (safeDt) {
                return safeDt.startsWith(dateStr);
            }
            if (b.createdAt) {
                return getLocalYYYYMMDD(b.createdAt) === dateStr;
            }
            return false;
        });
    };

    const toggleHoliday = async (dateStr, existingHoliday) => {
        setIsSaving(true);
        try {
            if (existingHoliday) {
                await deleteDoc(getDocRef('store_holidays', existingHoliday.id));
                alert('ยกเลิกวันหยุดเรียบร้อยแล้ว');
            } else {
                const holidayBranches = selectedHolidayBranch === 'all' ? ['all'] : [selectedHolidayBranch];
                const newId = `${dateStr}_${selectedHolidayBranch}`;
                await setDoc(getDocRef('store_holidays', newId), {
                    date: dateStr,
                    id: newId,
                    branch: selectedHolidayBranch,
                    branches: holidayBranches,
                    createdAt: new Date().toISOString()
                });
                alert('ตั้งเป็นวันหยุดเรียบร้อยแล้ว');
            }
        } catch (err) {
            alert('Error: ' + err.message);
        }
        setIsSaving(false);
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full max-h-[85vh]">
            <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <Calendar className="text-indigo-500"/> ปฏิทินคิวจองและวันหยุด
                    </h2>
                    <select 
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="px-3 py-2 border border-slate-200 rounded-xl font-bold bg-white text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    >
                        <option value="all">ทุกสาขา</option>
                        {branches.map(b => (
                            <option key={b.id || b.name} value={b.name}>{b.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <button onClick={handlePrevMonth} className="px-4 py-2 border rounded-xl font-bold bg-white hover:bg-slate-50">เดือนก่อนหน้า</button>
                    <span className="font-black text-lg text-indigo-700">{monthName}</span>
                    <button onClick={handleNextMonth} className="px-4 py-2 border rounded-xl font-bold bg-white hover:bg-slate-50">เดือนถัดไป</button>
                </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
                <div className="grid grid-cols-7 gap-2 mb-2">
                    {['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map(d => (
                        <div key={d} className="text-center font-black text-slate-500 py-2 bg-slate-100 rounded-lg">{d}</div>
                    ))}
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                    {blanks.map(i => <div key={`blank-${i}`} className="p-2 border border-transparent"></div>)}
                    {days.map(day => {
                        const dateObj = new Date(year, month, day);
                        const dateStr = getLocalDateString(dateObj);
                        
                        const holidayDoc = isHoliday(dateStr);
                        const branchHolidays = selectedBranch === 'all' ? getBranchSpecificHolidaysForDate(dateStr) : [];
                        const dayBookings = getBookingsForDate(dateStr);

                        const isToday = dateStr === getLocalDateString(new Date());

                        return (
                            <div 
                                key={day} 
                                onClick={() => setSelectedDate(dateStr)}
                                className={`min-h-[100px] p-2 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.02] flex flex-col ${
                                    holidayDoc 
                                        ? 'border-red-200 bg-red-50 hover:border-red-400' 
                                        : isToday 
                                            ? 'border-indigo-400 bg-indigo-50 shadow-sm'
                                            : 'border-slate-100 bg-white hover:border-indigo-300 shadow-sm'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-lg font-black ${holidayDoc ? 'text-red-500' : isToday ? 'text-indigo-700' : 'text-slate-700'}`}>{day}</span>
                                    {holidayDoc ? (
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full mb-1">วันหยุด</span>
                                            {isGlobalHolidayDoc(holidayDoc) ? null : (
                                                <span className="text-[8px] font-medium bg-red-100 text-red-700 px-1.5 py-0.5 rounded line-clamp-1 max-w-[60px]" title={getHolidayBranchList(holidayDoc).join(',')}>
                                                    {getHolidayBranchList(holidayDoc).join(',')}
                                                </span>
                                            )}
                                        </div>
                                    ) : branchHolidays.length > 0 ? (
                                        <span className="text-[8px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded line-clamp-1 max-w-[70px]" title={`หยุดเฉพาะสาขา: ${branchHolidays.flatMap(getHolidayBranchList).join(', ')}`}>
                                            หยุด: {branchHolidays.flatMap(getHolidayBranchList).join(',')}
                                        </span>
                                    ) : null}
                                </div>
                                
                                {!holidayDoc && dayBookings.length > 0 && (
                                    <div className="mt-auto space-y-1">
                                        <div className="text-[10px] font-bold text-slate-500 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm flex items-center justify-between">
                                            <span>ทั้งหมด</span>
                                            <span className="bg-indigo-100 text-indigo-700 px-1.5 rounded">{dayBookings.length}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal Detail for Selected Date */}
            {selectedDate && (() => {
                const holidayDoc = isHoliday(selectedDate);
                const branchHolidays = selectedBranch === 'all' ? getBranchSpecificHolidaysForDate(selectedDate) : [];
                const selectedDayBookings = getBookingsForDate(selectedDate);

                return (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
                            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                    <CalendarPlus className="text-indigo-500"/>
                                    ข้อมูลวันที่ {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric'})}
                                </h3>
                                <button onClick={() => setSelectedDate(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500"><X size={20}/></button>
                            </div>
                            
                            <div className="p-6 overflow-y-auto flex-1">
                                <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-100 p-4 rounded-2xl gap-4">
                                    <div>
                                        <h4 className="font-bold text-slate-700 text-sm">การตั้งค่าวันหยุด</h4>
                                        <p className="text-xs text-slate-500">หากตั้งเป็นวันหยุด ลูกค้าจะไม่สามารถจองคิวในวันนี้ได้</p>
                                        {holidayDoc && (
                                            <div className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full inline-block mt-2 font-bold">
                                                {isGlobalHolidayDoc(holidayDoc) ? 'หยุดทุกสาขา' : `หยุดเฉพาะ: ${getHolidayBranchList(holidayDoc).join(', ')}`}
                                            </div>
                                        )}
                                        {!holidayDoc && branchHolidays.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {branchHolidays.map(bh => (
                                                    <span key={bh.id} className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                                                        หยุดเฉพาะ: {getHolidayBranchList(bh).join(', ')}
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleHoliday(selectedDate, bh)}
                                                            disabled={isSaving}
                                                            className="ml-1 text-red-600 hover:text-red-800"
                                                            title="ยกเลิกวันหยุดสาขานี้"
                                                        >
                                                            ✕
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                                        {!holidayDoc && (
                                            <select
                                                value={selectedHolidayBranch}
                                                onChange={(e) => setSelectedHolidayBranch(e.target.value)}
                                                className="bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm outline-none w-full sm:w-auto"
                                            >
                                                <option value="all">หยุดทุกสาขา</option>
                                                {branches.map(b => (
                                                    <option key={b.name} value={b.name}>{b.name}</option>
                                                ))}
                                            </select>
                                        )}
                                        <button 
                                            onClick={() => toggleHoliday(selectedDate, holidayDoc)}
                                            disabled={isSaving}
                                            className={`px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-2 ${
                                                holidayDoc ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-red-500 text-white hover:bg-red-600'
                                            }`}
                                        >
                                            {isSaving && <Clock size={16} className="animate-spin" />}
                                            {holidayDoc ? 'ยกเลิกวันหยุด' : 'ตั้งเป็นวันหยุดร้าน'}
                                        </button>
                                    </div>
                                </div>

                                {/* ⚡ เปิดรับคิวเพิ่มสำหรับพนักงาน */}
                                <div className="mb-6 p-4 bg-teal-50/70 border border-teal-200 rounded-2xl">
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                        <div>
                                            <h4 className="font-black text-teal-900 text-sm flex items-center gap-1.5">
                                                <Zap size={16} className="text-teal-600" />
                                                เปิดรับคิวเพิ่มรายรอบเวลา (Staff Extra Slots)
                                            </h4>
                                            <p className="text-[11px] text-teal-700 mt-0.5">
                                                พนักงานสามารถกดเปิดรับคิวเพิ่มในแต่ละช่วงเวลาได้ ลูกค้าจะมองเห็นเป็นคิวว่างและกดจองได้ทันที
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-teal-800">สาขา:</span>
                                            <select
                                                value={extraSlotBranch === 'all' ? (selectedBranch !== 'all' ? selectedBranch : (branches[0]?.name || 'เฉวง')) : extraSlotBranch}
                                                onChange={(e) => setExtraSlotBranch(e.target.value)}
                                                className="bg-white border border-teal-300 rounded-xl px-2.5 py-1 text-xs font-bold text-teal-900 outline-none shadow-xs"
                                            >
                                                {branches.map(b => (
                                                    <option key={b.name} value={b.name}>{b.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Grid of Slots */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                        {CLINIC_TIME_SLOTS.map(slotTime => {
                                            const activeTargetBranch = extraSlotBranch === 'all' ? (selectedBranch !== 'all' ? selectedBranch : (branches[0]?.name || 'เฉวง')) : extraSlotBranch;
                                            const cleanBranch = activeTargetBranch.replace(/^สาขา/, '').trim();
                                            const key = `${selectedDate}_${cleanBranch}_${slotTime}`;
                                            const extra = Number(bookingConfig?.extraSlotOverrides?.[key] || 0);
                                            const baseCap = Number(bookingConfig?.maxConcurrentBookings || 2);
                                            const totalCap = baseCap + extra;

                                            // Count current bookings in this slot
                                            const slotBookings = selectedDayBookings.filter(b => {
                                                const bBranch = String(b.branch || '').replace(/^สาขา/, '').trim();
                                                const matchesBranch = bBranch === cleanBranch;
                                                const matchesTime = b.time === slotTime || (b.time && b.time.startsWith(slotTime));
                                                const notCancelled = !['ยกเลิก', 'ยกเลิกโดยลูกค้า', 'ยกเลิกฉุกเฉิน'].includes(b.status);
                                                return matchesBranch && matchesTime && notCancelled;
                                            });
                                            const isFull = slotBookings.length >= totalCap;

                                            return (
                                                <div 
                                                    key={slotTime} 
                                                    className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                                                        extra > 0 
                                                            ? 'bg-emerald-50/80 border-emerald-300 shadow-xs' 
                                                            : isFull 
                                                                ? 'bg-gray-50 border-gray-200' 
                                                                : 'bg-white border-teal-100'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="font-mono font-black text-xs text-gray-800">{slotTime}</span>
                                                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                                                            isFull 
                                                                ? 'bg-rose-100 text-rose-700' 
                                                                : 'bg-teal-100 text-teal-800'
                                                        }`}>
                                                            {slotBookings.length}/{totalCap} คิว
                                                        </span>
                                                    </div>

                                                    {extra > 0 && (
                                                        <div className="text-[9px] font-bold text-emerald-700 mb-1.5 flex items-center gap-1">
                                                            <span>✨</span> เปิดเพิ่ม +{extra} คิว
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-1 mt-auto pt-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleExtraSlot(selectedDate, activeTargetBranch, slotTime, 1)}
                                                            disabled={isSaving}
                                                            className="flex-1 py-1 px-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 active:scale-95 shadow-xs"
                                                            title="เปิดรับคิวเพิ่ม +1 สำหรับรอบนี้"
                                                        >
                                                            <Plus size={11} /> เพิ่มคิว
                                                        </button>
                                                        {extra > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleExtraSlot(selectedDate, activeTargetBranch, slotTime, -1)}
                                                                disabled={isSaving}
                                                                className="py-1 px-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold flex items-center justify-center active:scale-95"
                                                                title="ลดคิวที่เปิดเพิ่ม"
                                                            >
                                                                <Minus size={11} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <h4 className="font-black text-slate-800 mb-3 flex items-center gap-2">
                                    <Clock className="text-emerald-500" size={18}/> รายชื่อคิวจอง ({selectedDayBookings.length} คิว)
                                </h4>
                                
                                {selectedDayBookings.length === 0 ? (
                                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <Info size={24} className="mx-auto text-slate-300 mb-2"/>
                                        <p className="text-slate-500 font-bold text-sm">ไม่มีคิวจองในวันนี้</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {selectedDayBookings.map(b => (
                                            <div 
                                                key={b.id} 
                                                onClick={() => onSelectBooking && onSelectBooking(b)} 
                                                className="p-4 border border-slate-200 rounded-2xl bg-white flex justify-between items-center shadow-sm cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all group"
                                                title="คลิกเพื่อจัดการคิวนัดหมาย & ปรับสถานะ"
                                            >
                                                <div>
                                                    <div className="font-black text-slate-800 text-lg">{b.time} น.</div>
                                                    <div className="font-bold text-slate-600 text-sm flex items-center gap-2 mt-1">
                                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-xs">{b.branch}</span>
                                                        <span>{b.customerName || b.customerPhone}</span>
                                                        {Number(b.guestsCount || b.pax || 1) > 1 && (
                                                            <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[10px] font-black">
                                                                👥 {b.guestsCount || b.pax} ท่าน
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs font-bold text-indigo-600 mt-1">{b.courseName}</div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1.5">
                                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                                                        b.status === 'รอการยืนยัน' ? 'bg-amber-100 text-amber-700' :
                                                        b.status === 'ยืนยันแล้ว' ? 'bg-emerald-100 text-emerald-700' :
                                                        b.status === 'เสร็จสิ้น' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-slate-100 text-slate-700'
                                                    }`}>
                                                        {b.status || 'รอการยืนยัน'}
                                                    </span>
                                                    <BookingCountdown booking={b} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
