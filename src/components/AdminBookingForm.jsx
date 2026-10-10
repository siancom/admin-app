import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CalendarPlus, User, Phone, Sparkles, MapPin, Loader2, Droplets, Zap, Crosshair, MessageCircle, Package, CalendarDays, Search } from 'lucide-react';
import { getFuzzyKey } from '../utils/fuzzy';

const BRANCHES = ["เฉวง", "ละไม"];

const TIME_SLOTS = [
    '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', 
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
];

const SERVICE_CHIPS = [
    { text: 'ทำหน้า', icon: Sparkles },
    { text: 'กดสิว', icon: Droplets },
    { text: 'IPLรักแร้', icon: Zap },
    { text: 'จี้ไฝ', icon: Crosshair },
    { text: 'ปรึกษา', icon: MessageCircle },
    { text: 'ใช้คอส', icon: Package }
];

export default function AdminBookingForm({ onSubmit, onClose, initialBranch, isSlotTaken, customers = [] }) {
    const [form, setForm] = useState({
        name: '',
        phone: '',
        service: '',
        branch: initialBranch || BRANCHES[0],
        date: new Date().toLocaleDateString('en-CA'),
        time: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Search states
    const [customerSearch, setCustomerSearch] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter customers
    const filteredCustomers = useMemo(() => {
        if (!customerSearch) return customers.slice(0, 10); // Show top 10 initially
        const searchStr = customerSearch.toLowerCase();
        return customers.filter(c => {
            const name = String(getFuzzyKey(c, ["ชื่อ", "col_1"]) || '').toLowerCase();
            const phone = String(getFuzzyKey(c, ["เบอร์โทร", "col_3", "phone"]) || '');
            return name.includes(searchStr) || phone.includes(searchStr);
        }).slice(0, 10);
    }, [customers, customerSearch]);

    const handleSelectCustomer = (c) => {
        const name = String(getFuzzyKey(c, ["ชื่อ", "col_1"]) || '');
        const phone = String(getFuzzyKey(c, ["เบอร์โทร", "col_3", "phone"]) || '');
        setForm(prev => ({ ...prev, name, phone }));
        setCustomerSearch('');
        setIsDropdownOpen(false);
    };

    // Generate dates for the next 7 days
    const dateList = useMemo(() => {
        const list = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            const iso = d.toLocaleDateString('en-CA'); // YYYY-MM-DD
            const dayName = d.toLocaleDateString('th-TH', { weekday: 'short' });
            const dateNum = d.getDate();
            const monthName = d.toLocaleDateString('th-TH', { month: 'short' });
            list.push({ iso, dayName, dateNum, monthName, isToday: i === 0, isTomorrow: i === 1 });
        }
        return list;
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.date || !form.time) return alert('กรุณาเลือกวันที่และเวลา');
        const dateTimeStr = `${form.date}T${form.time}`;
        setIsSubmitting(true);
        await onSubmit({ ...form, dateTime: dateTimeStr });
        setIsSubmitting(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* ข้อมูลลูกค้า (Searchable & Optional) */}
            <div className="relative bg-gray-50/50 p-4 rounded-3xl border border-gray-100" ref={dropdownRef}>
                <div className="mb-3">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">ค้นหาลูกค้า (ไม่บังคับ)</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Search size={16} className="text-gray-400" />
                        </div>
                        <input 
                            placeholder="พิมพ์ชื่อ หรือ เบอร์โทร เพื่อค้นหา..." 
                            value={customerSearch} 
                            onChange={e => {
                                setCustomerSearch(e.target.value);
                                setIsDropdownOpen(true);
                            }}
                            onFocus={() => setIsDropdownOpen(true)}
                            className="w-full pl-9 pr-4 py-3 border-2 border-white bg-white rounded-xl outline-none focus:border-teal-400 transition-all font-medium text-gray-800 text-sm shadow-sm" 
                        />
                    </div>
                    
                    {/* Customer Dropdown */}
                    {isDropdownOpen && (
                        <div className="absolute z-10 left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 max-h-48 overflow-y-auto">
                            {filteredCustomers.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 text-xs">ไม่พบลูกค้า</div>
                            ) : (
                                filteredCustomers.map(c => {
                                    const cName = getFuzzyKey(c, ["ชื่อ", "col_1"]);
                                    const cPhone = getFuzzyKey(c, ["เบอร์โทร", "col_3", "phone"]);
                                    return (
                                        <div 
                                            key={c.id} 
                                            onClick={() => handleSelectCustomer(c)}
                                            className="px-4 py-3 hover:bg-teal-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors flex justify-between items-center"
                                        >
                                            <div className="font-bold text-sm text-gray-800">{cName}</div>
                                            <div className="text-xs font-mono text-gray-500">{cPhone}</div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">ชื่อลูกค้า (ถ้ามี)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <User size={16} className="text-gray-400" />
                            </div>
                            <input placeholder="ระบุชื่อลูกค้า (ลูกค้าทั่วไป)" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full pl-9 pr-4 py-3 border-2 border-white bg-white rounded-xl outline-none focus:border-teal-400 transition-all font-medium text-gray-800 text-sm shadow-sm" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">เบอร์โทรศัพท์ (ถ้ามี)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <Phone size={16} className="text-gray-400" />
                            </div>
                            <input placeholder="08X-XXX-XXXX" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full pl-9 pr-4 py-3 border-2 border-white bg-white rounded-xl outline-none focus:border-teal-400 transition-all font-medium text-gray-800 text-sm shadow-sm" />
                        </div>
                    </div>
                </div>
            </div>

            <hr className="border-gray-100" />

            {/* เลือกสาขา */}
            <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">เลือกสาขา</label>
                <div className="flex gap-2">
                    {BRANCHES.map(b => (
                        <button 
                            key={b} type="button" onClick={() => setForm({...form, branch: b})}
                            className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all border-2 ${form.branch === b ? 'bg-emerald-500 border-emerald-600 text-white shadow-md' : 'bg-white border-gray-100 text-gray-600 hover:border-emerald-300'}`}
                        >
                            สาขา{b}
                        </button>
                    ))}
                </div>
            </div>

            {/* วันที่ต้องการจอง */}
            <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">วันที่ต้องการจอง</label>
                <div className="flex gap-2 overflow-x-auto pb-2 snap-x hide-scrollbar">
                    {dateList.map(d => {
                        const isSelected = form.date === d.iso;
                        return (
                            <button 
                                key={d.iso} type="button" onClick={() => setForm({...form, date: d.iso, time: ''})}
                                className={`snap-start shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-2xl border-2 transition-all ${isSelected ? 'bg-teal-500 border-teal-600 text-white shadow-md scale-105' : 'bg-white border-gray-100 text-gray-600 hover:border-teal-300'}`}
                            >
                                <span className="text-[10px] font-bold opacity-90">{d.isToday ? 'วันนี้' : d.isTomorrow ? 'พรุ่งนี้' : d.dayName}</span>
                                <span className="text-2xl font-black">{d.dateNum}</span>
                                <span className="text-[10px] font-medium">{d.monthName}</span>
                            </button>
                        )
                    })}
                    {/* Fallback Date Picker */}
                    <div className="snap-start shrink-0 relative flex flex-col items-center justify-center w-16 h-20 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 transition-all">
                        <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value, time: ''})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <CalendarDays size={20} className="mb-1" />
                        <span className="text-[9px] font-bold">ปฏิทิน</span>
                    </div>
                </div>
            </div>

            {/* บริการที่ต้องการ */}
            <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">บริการที่ต้องการ</label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                    {SERVICE_CHIPS.map(svc => {
                        const currentServices = form.service.split(',').map(s => s.trim()).filter(Boolean);
                        const isSelected = currentServices.includes(svc.text);
                        return (
                            <button
                                key={svc.text} type="button" 
                                onClick={() => {
                                    let newServices;
                                    if (isSelected) {
                                        newServices = currentServices.filter(s => s !== svc.text);
                                    } else {
                                        newServices = [...currentServices, svc.text];
                                    }
                                    setForm({...form, service: newServices.join(', ')});
                                }}
                                className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl border text-[11px] font-black transition-all active:scale-95 ${isSelected ? 'bg-gradient-to-br from-teal-500 to-emerald-500 text-white border-teal-500 shadow-md shadow-teal-500/30' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700'}`}
                            >
                                <svc.icon size={20} className={isSelected ? 'text-white' : 'text-teal-500'} />
                                {svc.text}
                            </button>
                        );
                    })}
                </div>
                <input 
                    type="text" required
                    value={form.service} 
                    onChange={e => setForm({...form, service: e.target.value})}
                    placeholder="หรือพิมพ์บริการอื่นๆ..." 
                    className="w-full px-4 py-3 border-2 border-gray-100 bg-gray-50/50 rounded-2xl outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-400/10 transition-all font-medium text-gray-800"
                />
            </div>

            {/* เวลา (เลือกเวลาที่ว่าง) */}
            <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">เวลา (เลือกเวลาที่ว่าง)</label>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1">
                    {TIME_SLOTS.map(time => {
                        const dateTimeStr = `${form.date}T${time}`;
                        const disabled = isSlotTaken && isSlotTaken(dateTimeStr);
                        return (
                            <button
                                key={time} type="button" disabled={disabled}
                                onClick={() => setForm({...form, time})}
                                className={`py-2.5 rounded-xl text-xs font-mono font-black border-2 transition-all ${
                                    form.time === time
                                        ? 'bg-teal-500 border-teal-600 text-white shadow-md'
                                        : disabled
                                            ? 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                                            : 'bg-white border-gray-100 text-gray-700 hover:border-teal-300 hover:text-teal-600'
                                }`}
                            >
                                {time}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
               <button type="submit" disabled={isSubmitting} className="w-full bg-teal-500 hover:bg-teal-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-teal-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 text-base">
                   {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <CalendarPlus size={20} />} บันทึกนัดหมาย
               </button>
            </div>
            
            <style jsx>{`
              .hide-scrollbar::-webkit-scrollbar { display: none; }
              .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </form>
    );
}
