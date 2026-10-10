import React, { useState } from 'react';
import { Calendar, Trash2, X, Plus, CalendarOff, Search } from 'lucide-react';
import ModalWrapper from './ModalWrapper';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase'; // Ensure correct path

export default function DailyBookingModal({
    isOpen,
    onClose,
    selectedDate, // Date object
    dayBookings,
    storeHolidays, // array of holiday objects { id: 'YYYY-MM-DD', reason: '...' }
    showToast,
    getBookingStatus,
    setBookingViewMode,
    updateBookingStatus,
    branches = []
}) {
    const [reason, setReason] = useState('');
    const [selectedHolidayBranch, setSelectedHolidayBranch] = useState('all');
    
    if (!selectedDate || !isOpen) return null;

    const dateStr = selectedDate.getFullYear() + '-' + String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + String(selectedDate.getDate()).padStart(2, '0');
    const isHoliday = storeHolidays.some(h => h.date === dateStr || h.id === dateStr);
    const holidayData = storeHolidays.find(h => h.date === dateStr || h.id === dateStr);

    const toggleHoliday = async () => {
        try {
            if (isHoliday && holidayData) {
                // Remove holiday
                await deleteDoc(doc(db, 'store_holidays', holidayData.id));
                showToast('ยกเลิกวันหยุดเรียบร้อยแล้ว');
            } else {
                // Set holiday
                const holidayBranches = selectedHolidayBranch === 'all' ? ['all'] : [selectedHolidayBranch];
                await setDoc(doc(db, 'store_holidays', dateStr), {
                    date: dateStr,
                    reason: reason || 'วันหยุดร้าน',
                    branches: holidayBranches
                });
                showToast('ตั้งเป็นวันหยุดเรียบร้อยแล้ว');
            }
            setReason('');
        } catch (error) {
            console.error(error);
            showToast('เกิดข้อผิดพลาด: ' + error.message);
        }
    };

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} title={`ข้อมูลคิวประจำวันที่ ${selectedDate.toLocaleDateString('th-TH')}`} icon={Calendar} colorClass="bg-blue-100 text-blue-700">
            <div className="space-y-4">
                {/* Holiday Toggle Section */}
                <div className={`p-4 rounded-xl border ${isHoliday ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                    <h3 className="font-bold text-sm mb-2 flex items-center">
                        <CalendarOff size={16} className={`mr-1 ${isHoliday ? 'text-rose-600' : 'text-slate-500'}`} />
                        การตั้งคลาวันหยุดร้าน (ลูกค้าจะจองคิวไม่ได้)
                    </h3>
                    {isHoliday ? (
                        <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-rose-100">
                            <div>
                                <div className="text-rose-600 font-bold text-sm">วันหยุดร้าน</div>
                                <div className="text-xs text-rose-500">{holidayData?.reason}</div>
                                <div className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full inline-block mt-1">
                                    {holidayData?.branches?.includes('all') || !holidayData?.branches ? 'หยุดทุกสาขา' : `หยุดเฉพาะ: ${holidayData?.branches.join(', ')}`}
                                </div>
                            </div>
                            <button onClick={toggleHoliday} className="text-xs font-bold bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                                ยกเลิกวันหยุด
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-2 items-center">
                                <select
                                    value={selectedHolidayBranch}
                                    onChange={(e) => setSelectedHolidayBranch(e.target.value)}
                                    className="bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-rose-300 w-1/3"
                                >
                                    <option value="all">ทุกสาขา</option>
                                    {branches.map(b => (
                                        <option key={b.name} value={b.name}>{b.name}</option>
                                    ))}
                                </select>
                                <input 
                                    type="text" 
                                    placeholder="เหตุผลการหยุด" 
                                    value={reason} 
                                    onChange={(e) => setReason(e.target.value)} 
                                    className="flex-1 bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-rose-300"
                                />
                            </div>
                            <button onClick={toggleHoliday} className="w-full text-xs font-bold bg-rose-500 text-white px-4 py-2.5 rounded-lg hover:bg-rose-600 transition-colors">
                                ตั้งเป็นวันหยุด
                            </button>
                        </div>
                    )}
                </div>

                {/* Daily Bookings List */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-sm text-slate-800">รายการจองคิว ({dayBookings.length} คิว)</h3>
                        {dayBookings.length > 0 && (
                            <button 
                                onClick={async () => {
                                    const activeBookings = dayBookings.filter(b => {
                                        const st = getBookingStatus(b);
                                        return !['ยกเลิก', 'ยกเลิกโดยลูกค้า', 'ยกเลิกฉุกเฉิน', 'เสร็จสิ้น'].includes(st);
                                    });
                                    if (activeBookings.length === 0) {
                                        showToast('ไม่มีคิวที่สามารถยกเลิกได้');
                                        return;
                                    }
                                    const reason = window.prompt(`พบ ${activeBookings.length} คิวที่กำลังจะถูกยกเลิก\nกรุณาระบุสาเหตุการยกเลิกฉุกเฉิน (เช่น ไฟดับ):`, "");
                                    if (reason) {
                                        let successCount = 0;
                                        for (const b of activeBookings) {
                                            try {
                                                await updateBookingStatus(b.id, 'ยกเลิกฉุกเฉิน', reason);
                                                successCount++;
                                            } catch (e) {
                                                console.error('Failed to cancel booking', b.id, e);
                                            }
                                        }
                                        showToast(`ยกเลิกคิวฉุกเฉินสำเร็จ ${successCount} คิว`);
                                    }
                                }}
                                className="text-[10px] font-bold bg-rose-100 text-rose-600 hover:bg-rose-200 px-3 py-1.5 rounded-lg transition-colors flex items-center"
                            >
                                🚨 ยกเลิกฉุกเฉินทั้งหมด
                            </button>
                        )}
                    </div>
                    {dayBookings.length === 0 ? (
                        <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100">
                            <Calendar size={32} className="mx-auto text-slate-300 mb-2" />
                            <p className="text-slate-400 font-bold text-sm">ไม่มีคิวในวันนี้</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {dayBookings.map((b, i) => {
                                const st = getBookingStatus(b);
                                const timeStr = b.time ? b.time.substring(0,5) : (b.dateTime ? b.dateTime.split('T')[1]?.substring(0,5) : '');
                                return (
                                    <div key={b.id || i} onClick={() => { onClose(); setBookingViewMode('cards'); }} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-blue-300 cursor-pointer transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md text-xs">{timeStr || '-'}</div>
                                            <div>
                                                <div className="font-bold text-sm text-slate-800">{b.customerName || 'ไม่ระบุชื่อ'}</div>
                                                <div className="text-[10px] text-slate-500">{b.courseName || 'บริการทั่วไป'} • {b.branch || '-'}</div>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded ${st === 'รอการยืนยัน' ? 'bg-amber-50 text-amber-700' : st === 'ยืนยันแล้ว' ? 'bg-blue-50 text-blue-700' : st === 'กำลังใช้บริการ' ? 'bg-purple-50 text-purple-700' : st === 'เสร็จสิ้น' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500'}`}>
                                            {st}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </ModalWrapper>
    );
}
