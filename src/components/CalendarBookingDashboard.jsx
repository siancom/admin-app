import React, { useState } from 'react';
import { Calendar, CalendarPlus, CheckCircle, Clock, X, Info, AlertCircle } from 'lucide-react';
import { db, getCol, getDocRef } from '../config/firebase';
import { addDoc, deleteDoc, updateDoc, setDoc } from 'firebase/firestore';

export default function CalendarBookingDashboard({ 
    bookings = [], 
    storeHolidays = [],
    branches = []
}) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState('all');
    const [selectedHolidayBranch, setSelectedHolidayBranch] = useState('all');

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

    const getLocalDateString = (d) => {
        const offset = d.getTimezoneOffset();
        const adjustedDate = new Date(d.getTime() - (offset*60*1000));
        return adjustedDate.toISOString().split('T')[0];
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
                        
                        const isHoliday = storeHolidays.find(h => {
                            if (h.date !== dateStr && h.id !== dateStr) return false;
                            if (!h.branches || h.branches.includes('all')) return true;
                            if (selectedBranch !== 'all' && !h.branches.includes(selectedBranch)) return false;
                            return true;
                        });
                        const dayBookings = bookings.filter(b => {
                            if (b.status === 'ยกเลิก' || b.status === 'ยกเลิกโดยลูกค้า' || b.status === 'ยกเลิกฉุกเฉิน') return false;
                            if (selectedBranch !== 'all' && b.branch !== selectedBranch) return false;
                            if (b.date === dateStr) return true;
                            if (b.createdAt && b.createdAt.startsWith(dateStr)) return true;
                            return false;
                        });

                        const isToday = dateStr === getLocalDateString(new Date());

                        return (
                            <div 
                                key={day} 
                                onClick={() => setSelectedDate(dateStr)}
                                className={`min-h-[100px] p-2 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.02] flex flex-col ${
                                    isHoliday 
                                        ? 'border-red-200 bg-red-50 hover:border-red-400' 
                                        : isToday 
                                            ? 'border-indigo-400 bg-indigo-50 shadow-sm'
                                            : 'border-slate-100 bg-white hover:border-indigo-300 shadow-sm'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-lg font-black ${isHoliday ? 'text-red-500' : isToday ? 'text-indigo-700' : 'text-slate-700'}`}>{day}</span>
                                    {isHoliday && (
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full mb-1">วันหยุด</span>
                                            {(!isHoliday.branches || isHoliday.branches.includes('all')) ? null : (
                                                <span className="text-[8px] font-medium bg-red-100 text-red-700 px-1.5 py-0.5 rounded line-clamp-1 max-w-[60px]" title={isHoliday.branches.join(',')}>
                                                    {isHoliday.branches.join(',')}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                {!isHoliday && dayBookings.length > 0 && (
                                    <div className="mt-auto space-y-1">
                                        <div className="text-[10px] font-bold text-slate-500 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm flex items-center justify-between">
                                            <span>ทั้งหมด</span>
                                            <span className="bg-indigo-100 text-indigo-700 px-1.5 rounded">{dayBookings.length}</span>
                                        </div>
                                        {/* Optional: Break down by branch if you want */}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal Detail for Selected Date */}
            {selectedDate && (() => {
                const isHoliday = storeHolidays.find(h => {
                    if (h.date !== selectedDate && h.id !== selectedDate) return false;
                    if (!h.branches || h.branches.includes('all')) return true;
                    if (selectedBranch !== 'all' && !h.branches.includes(selectedBranch)) return false;
                    return true;
                });
                const dayBookings = bookings.filter(b => {
                    if (b.status === 'ยกเลิก' || b.status === 'ยกเลิกโดยลูกค้า' || b.status === 'ยกเลิกฉุกเฉิน') return false;
                    if (selectedBranch !== 'all' && b.branch !== selectedBranch) return false;
                    if (b.date === selectedDate) return true;
                    if (b.createdAt && b.createdAt.startsWith(selectedDate)) return true;
                    return false;
                });

                return (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
                            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                    <CalendarPlus className="text-indigo-500"/>
                                    ข้อมูลวันที่ {new Date(selectedDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric'})}
                                </h3>
                                <button onClick={() => setSelectedDate(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500"><X size={20}/></button>
                            </div>
                            
                            <div className="p-6 overflow-y-auto flex-1">
                                <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-100 p-4 rounded-2xl gap-4">
                                    <div>
                                        <h4 className="font-bold text-slate-700 text-sm">การตั้งคาวันหยุด</h4>
                                        <p className="text-xs text-slate-500">หากตั้งเป็นวันหยุด ลูกค้าจะไม่สามารถจองคิวในวันนี้ได้</p>
                                        {isHoliday && (
                                            <div className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full inline-block mt-2 font-bold">
                                                {isHoliday?.branches?.includes('all') || !isHoliday?.branches ? 'หยุดทุกสาขา' : `หยุดเฉพาะ: ${isHoliday?.branches.join(', ')}`}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                                        {!isHoliday && (
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
                                            onClick={() => toggleHoliday(selectedDate, isHoliday)}
                                            disabled={isSaving}
                                            className={`px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-2 ${
                                                isHoliday ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-red-500 text-white hover:bg-red-600'
                                            }`}
                                        >
                                            {isSaving && <Clock size={16} className="animate-spin" />}
                                            {isHoliday ? 'ยกเลิกวันหยุด' : 'ตั้งเป็นวันหยุดร้าน'}
                                        </button>
                                    </div>
                                </div>

                                <h4 className="font-black text-slate-800 mb-3 flex items-center gap-2">
                                    <Clock className="text-emerald-500" size={18}/> รายชื่อคิวจอง ({dayBookings.length} คิว)
                                </h4>
                                
                                {dayBookings.length === 0 ? (
                                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <Info size={24} className="mx-auto text-slate-300 mb-2"/>
                                        <p className="text-slate-500 font-bold text-sm">ไม่มีคิวจองในวันนี้</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {dayBookings.map(b => (
                                            <div key={b.id} className="p-4 border border-slate-200 rounded-2xl bg-white flex justify-between items-center shadow-sm">
                                                <div>
                                                    <div className="font-black text-slate-800 text-lg">{b.time} น.</div>
                                                    <div className="font-bold text-slate-600 text-sm flex items-center gap-2 mt-1">
                                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-xs">{b.branch}</span>
                                                        {b.customerName || b.customerPhone}
                                                    </div>
                                                    <div className="text-xs font-bold text-indigo-600 mt-1">{b.courseName}</div>
                                                </div>
                                                <div>
                                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                                                        b.status === 'รอการยืนยัน' ? 'bg-amber-100 text-amber-700' :
                                                        b.status === 'ยืนยันแล้ว' ? 'bg-emerald-100 text-emerald-700' :
                                                        b.status === 'เสร็จสิ้น' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-slate-100 text-slate-700'
                                                    }`}>
                                                        {b.status || 'รอการยืนยัน'}
                                                    </span>
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
