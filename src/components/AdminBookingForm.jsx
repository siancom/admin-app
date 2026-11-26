import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
    CalendarPlus, User, Users, Phone, Sparkles, MapPin, Loader2, Droplets, Zap, 
    Crosshair, MessageCircle, Package, CalendarDays, Search, Clock, 
    UserPlus, CheckCircle2, AlertCircle, X, Crown, UserCheck, Check 
} from 'lucide-react';
import { getFuzzyKey } from '../utils/fuzzy';
import { DEFAULT_BOOKING_CONFIG, calculateBookingDuration } from '../utils/bookingConfig';

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

export default function AdminBookingForm({ 
    onSubmit, 
    onClose, 
    initialBranch, 
    isSlotTaken, 
    customers = [], 
    courses = [],
    preselectedCustomer = null,
    onOpenRegisterCustomer,
    bookingConfig = DEFAULT_BOOKING_CONFIG 
}) {
    const [form, setForm] = useState({
        name: '',
        phone: '',
        service: '',
        branch: initialBranch || BRANCHES[0],
        date: new Date().toLocaleDateString('en-CA'),
        time: '',
        guestsCount: 1
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Search states
    const [customerSearch, setCustomerSearch] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
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

    // Sync newly registered or preselected customer
    useEffect(() => {
        if (preselectedCustomer) {
            const cName = String(getFuzzyKey(preselectedCustomer, ["ชื่อ", "col_1"]) || preselectedCustomer.computedName || preselectedCustomer.name || '').trim();
            const cPhone = String(getFuzzyKey(preselectedCustomer, ["เบอร์โทร", "col_3", "phone"]) || preselectedCustomer.computedPhone || preselectedCustomer.phone || '').trim();
            setForm(prev => ({ 
                ...prev, 
                name: cName || prev.name, 
                phone: cPhone || prev.phone 
            }));
            setSelectedCustomer(preselectedCustomer);
            setCustomerSearch('');
            setIsDropdownOpen(false);
        }
    }, [preselectedCustomer]);

    // Clean phone helper
    const cleanDigits = (val) => String(val || '').replace(/\D/g, '');

    const isValidThaiPhone = (val) => {
        if (!val) return false;
        const digits = cleanDigits(val);
        // Thai phone: exactly 9 or 10 digits
        if (digits.length !== 9 && digits.length !== 10) return false;
        // Must start with 0
        if (!digits.startsWith('0')) return false;
        // Cannot be all repeating identical digits (e.g. 0000000000, 1111111111)
        if (/^(\d)\1+$/.test(digits)) return false;
        // 10 digits mobile (starts with 06, 08, 09, etc.) or 9 digits landline (02, 03, 04, 05, 07)
        return /^0[1-9]\d{7,8}$/.test(digits);
    };

    const formatPhone = (val) => {
        const raw = cleanDigits(val);
        if (raw.length === 10) return `${raw.slice(0, 3)}-${raw.slice(3, 6)}-${raw.slice(6)}`;
        if (raw.length === 9) return `${raw.slice(0, 2)}-${raw.slice(2, 5)}-${raw.slice(5)}`;
        return val || '';
    };

    // Filter customers
    const filteredCustomers = useMemo(() => {
        if (!customerSearch.trim()) return customers.slice(0, 8);
        const searchStr = customerSearch.trim().toLowerCase();
        const searchNums = cleanDigits(customerSearch);

        return customers.filter(c => {
            const name = String(getFuzzyKey(c, ["ชื่อ", "col_1"]) || c.computedName || c.name || '').toLowerCase();
            const phone = String(getFuzzyKey(c, ["เบอร์โทร", "col_3", "phone"]) || c.computedPhone || c.phone || '');
            const phoneNums = cleanDigits(phone);
            const nickname = String(c.nickname || '').toLowerCase();
            const citizenId = String(c.citizenId || c["เลขประจำตัวประชาชน"] || '');

            const matchName = name.includes(searchStr);
            const matchNickname = nickname.includes(searchStr);
            const matchPhone = searchNums && phoneNums ? (phoneNums.includes(searchNums) || searchNums.includes(phoneNums)) : phone.includes(searchStr);
            const matchCitizen = citizenId.includes(searchStr);

            return matchName || matchNickname || matchPhone || matchCitizen;
        }).slice(0, 8);
    }, [customers, customerSearch]);

    // Check if customer exists by phone digits
    const checkCustomerByPhone = (phoneStr) => {
        const digits = cleanDigits(phoneStr);
        if (!digits || digits.length < 9) return null;
        return customers.find(c => {
            const cPhone = cleanDigits(getFuzzyKey(c, ["เบอร์โทร", "col_3", "phone"]) || c.computedPhone || c.phone);
            return cPhone && (cPhone === digits || cPhone.endsWith(digits) || digits.endsWith(cPhone));
        });
    };

    // Lookups
    const searchPhoneMatch = useMemo(() => {
        return checkCustomerByPhone(customerSearch);
    }, [customerSearch, customers]);

    const formPhoneMatch = useMemo(() => {
        return checkCustomerByPhone(form.phone);
    }, [form.phone, customers]);

    // Active verified customer
    const currentCustomer = selectedCustomer || searchPhoneMatch || formPhoneMatch;

    // Remaining active courses for current customer
    const activeRemainingCourses = useMemo(() => {
        if (!currentCustomer || !courses || courses.length === 0) return [];
        const custId = currentCustomer.id;
        const custPhone = cleanDigits(getFuzzyKey(currentCustomer, ["เบอร์โทร", "col_3", "phone"]) || currentCustomer.computedPhone || currentCustomer.phone);
        const custName = String(getFuzzyKey(currentCustomer, ["ชื่อ", "col_1"]) || currentCustomer.computedName || currentCustomer.name || '').trim().toLowerCase();

        return courses.filter(crs => {
            const cCustId = crs.customerId || crs.customerRef;
            const cPhone = cleanDigits(crs.customerPhone || crs.phone || crs["เบอร์โทร"]);
            const cName = String(crs.customerName || crs.name || crs["ชื่อ"] || '').trim().toLowerCase();

            const matchId = custId && cCustId && String(custId) === String(cCustId);
            const matchPhone = custPhone && cPhone && (custPhone === cPhone || custPhone.endsWith(cPhone) || cPhone.endsWith(custPhone));
            const matchName = custName && cName && custName === cName;

            if (!matchId && !matchPhone && !matchName) return false;

            const used = Number(crs.used || crs.usedCount || 0);
            const total = Number(crs.total || crs.totalCount || crs.amount || 0);
            return total > used;
        });
    }, [currentCustomer, courses]);

    // Is new customer condition:
    const searchDigits = cleanDigits(customerSearch);
    const formDigits = cleanDigits(form.phone);
    const effectiveDigits = formDigits || searchDigits;
    const isSearchNumeric = /^[\d\s-]+$/.test(customerSearch.trim());
    const isSearchPhoneValid = isValidThaiPhone(searchDigits);
    const isFormPhoneValid = isValidThaiPhone(formDigits);
    const isEffectivePhoneValid = selectedCustomer ? true : isValidThaiPhone(effectiveDigits);

    const isSearchPhoneEntered = searchDigits.length >= 9;
    const isSearchNotFound = customerSearch.trim().length > 0 && filteredCustomers.length === 0;
    const isFormPhoneNotFound = isValidThaiPhone(formDigits) && !formPhoneMatch && !selectedCustomer;

    const handleSelectCustomer = (c) => {
        const name = String(getFuzzyKey(c, ["ชื่อ", "col_1"]) || c.computedName || c.name || '');
        const phone = String(getFuzzyKey(c, ["เบอร์โทร", "col_3", "phone"]) || c.computedPhone || c.phone || '');
        setForm(prev => ({ ...prev, name, phone }));
        setSelectedCustomer(c);
        setCustomerSearch('');
        setIsDropdownOpen(false);
    };

    const handleClearCustomer = () => {
        setSelectedCustomer(null);
        setForm(prev => ({ ...prev, name: '', phone: '' }));
        setCustomerSearch('');
    };

    const handleTriggerRegister = (phoneCandidate) => {
        const clean = cleanDigits(phoneCandidate) || String(phoneCandidate || '').trim();
        if (onOpenRegisterCustomer) {
            onOpenRegisterCustomer(clean);
        }
    };

    // Generate dates for the next 7 days
    const dateList = useMemo(() => {
        const list = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            const iso = d.toLocaleDateString('en-CA');
            const dayName = d.toLocaleDateString('th-TH', { weekday: 'short' });
            const dateNum = d.getDate();
            const monthName = d.toLocaleDateString('th-TH', { month: 'short' });
            list.push({ iso, dayName, dateNum, monthName, isToday: i === 0, isTomorrow: i === 1 });
        }
        return list;
    }, []);

    // คำนวณระยะเวลารวมตามบริการที่เลือกและจำนวนท่าน
    const totalDuration = useMemo(() => {
        return calculateBookingDuration(form.service, form.guestsCount, bookingConfig);
    }, [form.service, form.guestsCount, bookingConfig]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const effectiveRaw = (form.phone || customerSearch || '').trim();
        const effectivePhone = cleanDigits(effectiveRaw);
        const effectiveName = (form.name || '').trim() || (effectivePhone ? `ลูกค้า (${formatPhone(effectivePhone)})` : '');

        if (!selectedCustomer) {
            if (!effectivePhone) {
                return alert('กรุณาระบุเบอร์โทรศัพท์ลูกค้าเพื่อทำการจอง');
            }
            if (!isValidThaiPhone(effectivePhone)) {
                if (effectivePhone.length < 9) {
                    return alert(`กรุณาระบุเบอร์โทรศัพท์ให้ครบ 10 หลัก (ขณะนี้มีเพียง ${effectivePhone.length} หลัก)`);
                }
                if (effectivePhone.length > 10) {
                    return alert(`เบอร์โทรศัพท์เกิน 10 หลัก (${effectivePhone.length} หลัก) กรุณาตรวจสอบความถูกต้อง`);
                }
                return alert('รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง กรุณาระบุเบอร์โทรศัพท์ 9-10 หลักที่ขึ้นต้นด้วย 0');
            }
        }

        if (!effectivePhone && !effectiveName) {
            return alert('กรุณาระบุเบอร์โทรศัพท์หรือชื่อลูกค้าเพื่อทำการจอง');
        }
        if (!form.date || !form.time) {
            return alert('กรุณาเลือกวันที่และเวลา');
        }
        const dateTimeStr = `${form.date}T${form.time}`;
        setIsSubmitting(true);
        await onSubmit({ 
            ...form, 
            name: effectiveName,
            phone: effectivePhone || form.phone,
            customerPhone: effectivePhone || form.phone,
            dateTime: dateTimeStr, 
            duration: totalDuration,
            guestsCount: Math.min(3, Math.max(1, Number(form.guestsCount || 1))) 
        });
        setIsSubmitting(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 🌟 ข้อมูลลูกค้าและระบบค้นหาอัจฉริยะ (Intelligent Customer Lookup) 🌟 */}
            <div className="relative bg-gradient-to-b from-gray-50/90 to-slate-50/50 p-4 sm:p-5 rounded-3xl border border-gray-200/80 shadow-xs" ref={dropdownRef}>
                
                {/* Header with smart indicator */}
                <div className="flex items-center justify-between mb-2 ml-1">
                    <label className="flex items-center gap-1.5 text-[11px] font-black text-gray-700 uppercase tracking-wider">
                        <Phone size={14} className="text-teal-600" />
                        <span>เบอร์โทรศัพท์ / ค้นหาลูกค้า</span>
                        <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-bold border border-teal-200/80 flex items-center gap-1">
                        <Sparkles size={11} className="text-teal-600" />
                        ค้นหาประวัติอัตโนมัติ
                    </span>
                </div>

                {/* Selected Customer Card (If customer already chosen/found) */}
                {currentCustomer && (
                    <div className="mb-3.5 bg-gradient-to-r from-emerald-50/95 via-teal-50/80 to-emerald-50/95 border-2 border-emerald-300/80 rounded-2xl p-3.5 shadow-xs animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black text-sm shadow-sm shrink-0 overflow-hidden">
                                    {currentCustomer.imageUrl || currentCustomer.photoUrl || currentCustomer.customerPhoto ? (
                                        <img 
                                            src={currentCustomer.imageUrl || currentCustomer.photoUrl || currentCustomer.customerPhoto} 
                                            alt="" 
                                            className="w-full h-full object-cover" 
                                        />
                                    ) : (
                                        <UserCheck size={20} />
                                    )}
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="font-black text-sm text-gray-900">
                                            {form.name || getFuzzyKey(currentCustomer, ["ชื่อ", "col_1"]) || currentCustomer.computedName}
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100/90 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                                            <CheckCircle2 size={11} className="text-emerald-600" /> ลูกค้าเดิม (เคยใช้บริการ)
                                        </span>
                                        {(currentCustomer.isVipUpgrade || currentCustomer.hasMemberCard || String(currentCustomer["สถานะสมาชิก"] || '').includes('VIP')) && (
                                            <span className="inline-flex items-center gap-0.5 text-[9px] font-black bg-amber-400 text-slate-900 px-1.5 py-0.5 rounded-md shadow-2xs">
                                                <Crown size={10} /> VIP
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs font-mono font-medium text-emerald-700 mt-0.5 flex items-center gap-1">
                                        <Phone size={12} className="text-emerald-600" />
                                        <span>{formatPhone(form.phone || getFuzzyKey(currentCustomer, ["เบอร์โทร", "col_3", "phone"]) || currentCustomer.computedPhone)}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleClearCustomer}
                                className="px-2.5 py-1 text-xs text-gray-500 hover:text-rose-600 hover:bg-white rounded-xl border border-transparent hover:border-rose-200 transition-all font-bold shrink-0 flex items-center gap-1"
                                title="ล้างเพื่อค้นหาลูกค้าท่านอื่น"
                            >
                                <X size={14} />
                                <span>เปลี่ยน</span>
                            </button>
                        </div>

                        {/* Active Remaining Courses Chips */}
                        {activeRemainingCourses.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-emerald-200/80">
                                <div className="text-[10px] font-bold text-emerald-800 mb-1 flex items-center gap-1">
                                    <Package size={12} className="text-emerald-600" />
                                    <span>คอร์สคงเหลือที่ใช้ได้ ({activeRemainingCourses.length} รายการ - แตะเพื่อเลือกใช้):</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {activeRemainingCourses.slice(0, 3).map((crs, idx) => {
                                        const used = Number(crs.used || crs.usedCount || 0);
                                        const total = Number(crs.total || crs.totalCount || crs.amount || 0);
                                        const remain = Math.max(0, total - used);
                                        const cName = crs.name || crs.courseName || 'คอร์ส';
                                        return (
                                            <button
                                                key={crs.id || idx}
                                                type="button"
                                                onClick={() => {
                                                    setForm(prev => ({ 
                                                        ...prev, 
                                                        service: prev.service ? `${prev.service}, ${cName}` : cName 
                                                    }));
                                                }}
                                                className="text-[10px] font-bold bg-white text-emerald-900 border border-emerald-300 hover:border-emerald-500 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
                                            >
                                                <span>{cName}</span>
                                                <span className="text-emerald-600 font-mono font-black">(เหลือ {remain}/{total})</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Search / Phone Input */}
                <div className="mb-3">
                    <div className="relative flex items-center">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Search size={16} className="text-gray-400" />
                        </div>
                        <input 
                            placeholder="พิมพ์เบอร์โทร (08X-XXX-XXXX) หรือชื่อเพื่อค้นหาประวัติ..." 
                            value={customerSearch} 
                            maxLength={14}
                            onChange={e => {
                                let val = e.target.value;
                                const isNumLike = /^[\d\s-]+$/.test(val.trim());
                                const digits = cleanDigits(val);
                                if (isNumLike && digits.length > 10) {
                                    val = digits.slice(0, 10);
                                }
                                setCustomerSearch(val);
                                setIsDropdownOpen(true);
                                if (isNumLike || digits.length >= 8) {
                                    setForm(prev => ({ ...prev, phone: digits.slice(0, 10) || val.replace(/\s+/g, '') }));
                                }
                            }}
                            onFocus={() => setIsDropdownOpen(true)}
                            className="w-full pl-9 pr-28 py-3 border-2 border-white bg-white rounded-2xl outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-400/10 transition-all font-medium text-gray-800 text-sm shadow-xs" 
                        />

                        {/* Action buttons at the back of the input (ด้านหลังช่องค้นหา) */}
                        <div className="absolute inset-y-0 right-1.5 flex items-center gap-1">
                            {/* If searched phone/text is not in system, show registration icon/button */}
                            {(isSearchNotFound || (isSearchPhoneEntered && !searchPhoneMatch)) && (
                                <button
                                    type="button"
                                    onClick={() => handleTriggerRegister(customerSearch || form.phone)}
                                    className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-sm active:scale-95 transition-all flex items-center gap-1 animate-pulse cursor-pointer"
                                    title="ไม่พบประวัติ - กดเพื่อลงทะเบียนลูกค้าใหม่ทันที"
                                >
                                    <UserPlus size={14} />
                                    <span>+ ลงทะเบียน</span>
                                </button>
                            )}

                            {customerSearch && (
                                <button
                                    type="button"
                                    onClick={() => setCustomerSearch('')}
                                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                    
                    {/* Customer Dropdown Results */}
                    {isDropdownOpen && customerSearch.trim() && (
                        <div className="absolute z-20 left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-gray-100 max-h-56 overflow-y-auto divide-y divide-gray-50">
                            {filteredCustomers.length === 0 ? (
                                <div className="p-4 text-center">
                                    <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2 border border-amber-200">
                                        <AlertCircle size={20} />
                                    </div>
                                    <div className="font-black text-sm text-gray-800">ไม่พบประวัติลูกค้าในระบบ</div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        เบอร์ / ข้อมูลที่ค้นหา: <span className="font-bold text-gray-700 font-mono">{customerSearch}</span> (ลูกค้าใหม่)
                                    </div>
                                    <div className="mt-3 flex flex-col gap-2">
                                        {isSearchPhoneValid ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setForm(prev => ({ 
                                                        ...prev, 
                                                        phone: searchDigits, 
                                                        name: prev.name || `ลูกค้า (${formatPhone(searchDigits)})` 
                                                    }));
                                                    setIsDropdownOpen(false);
                                                }}
                                                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                            >
                                                <CheckCircle2 size={16} />
                                                <span>⚡ ใช้เบอร์นี้จองทันที ({formatPhone(searchDigits)})</span>
                                            </button>
                                        ) : isSearchNumeric && searchDigits.length > 0 ? (
                                            <div className="p-2.5 bg-amber-50 border border-amber-200/90 rounded-xl text-amber-800 text-xs text-center font-bold">
                                                <div className="flex items-center justify-center gap-1 text-amber-700 mb-0.5">
                                                    <AlertCircle size={14} />
                                                    <span>เบอร์โทรยังไม่ครบ 10 หลัก (ขณะนี้ {searchDigits.length}/10 หลัก)</span>
                                                </div>
                                                <p className="text-[11px] font-normal text-amber-600">กรุณาพิมพ์เบอร์ให้ครบ 10 หลักถึงจะสามารถกดจองได้</p>
                                            </div>
                                        ) : null}

                                        <button
                                            type="button"
                                            onClick={() => handleTriggerRegister(customerSearch)}
                                            className="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                            <UserPlus size={14} />
                                            <span>ลงทะเบียนลูกค้าใหม่ทันที (นำข้อมูลไปกรอกให้อัตโนมัติ)</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                filteredCustomers.map(c => {
                                    const cName = getFuzzyKey(c, ["ชื่อ", "col_1"]) || c.computedName || c.name;
                                    const cPhone = getFuzzyKey(c, ["เบอร์โทร", "col_3", "phone"]) || c.computedPhone || c.phone;
                                    const isVip = c.isVipUpgrade || c.hasMemberCard || String(c["สถานะสมาชิก"] || '').includes('VIP');
                                    return (
                                        <div 
                                            key={c.id} 
                                            onClick={() => handleSelectCustomer(c)}
                                            className="px-4 py-3 hover:bg-teal-50/80 cursor-pointer transition-colors flex justify-between items-center gap-2 group"
                                        >
                                            <div>
                                                <div className="font-black text-sm text-gray-800 group-hover:text-teal-700 flex items-center gap-1.5">
                                                    <span>{cName}</span>
                                                    {isVip && (
                                                        <span className="text-[9px] font-black bg-amber-400 text-slate-900 px-1 rounded">VIP</span>
                                                    )}
                                                </div>
                                                <div className="text-xs font-mono text-gray-500 mt-0.5">{formatPhone(cPhone)}</div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 group-hover:bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                                                    ✓ ลูกค้าเดิม
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>

                {/* Alert Box when customer not found in system (Strict Thai Phone Validation) */}
                {!selectedCustomer && (customerSearch.trim().length > 0 || effectiveDigits.length > 0) && !searchPhoneMatch && (
                    isEffectivePhoneValid ? (
                        <div className="mb-3 p-3 bg-gradient-to-r from-teal-50/90 via-emerald-50/90 to-teal-50/90 border border-teal-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs animate-in fade-in">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                                    <CheckCircle2 size={18} />
                                </div>
                                <div>
                                    <div className="text-xs font-black text-teal-900 flex items-center gap-1.5">
                                        <span>เบอร์: <span className="font-mono font-bold text-teal-800">{formatPhone(effectiveDigits)}</span></span>
                                        <span className="text-[9px] bg-teal-200/80 text-teal-900 px-1.5 py-0.5 rounded font-bold">ครบถ้วน (ลูกค้าใหม่)</span>
                                    </div>
                                    <div className="text-[11px] text-teal-700">
                                        ✓ เบอร์โทรครบ 10 หลัก สามารถกดบันทึกจองได้ทันที (ค่อยลงทะเบียนภายหลังได้ ไม่ต้องกรอกชื่อ)
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => handleTriggerRegister(effectiveDigits || customerSearch)}
                                    className="flex items-center justify-center gap-1 px-3 py-1.5 bg-white hover:bg-gray-50 border border-teal-300 text-teal-800 text-xs font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
                                >
                                    <UserPlus size={13} />
                                    <span>ลงทะเบียนตอนนี้</span>
                                </button>
                            </div>
                        </div>
                    ) : effectiveDigits.length > 0 ? (
                        <div className="mb-3 p-3 bg-amber-50/90 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs animate-in fade-in">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                                    <AlertCircle size={18} />
                                </div>
                                <div>
                                    <div className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                                        <span>เบอร์โทร: <span className="font-mono font-bold text-amber-800">{effectiveDigits}</span></span>
                                        <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-bold">ยังไม่ครบ ({effectiveDigits.length}/10 หลัก)</span>
                                    </div>
                                    <div className="text-[11px] text-amber-700">
                                        ⚠️ ต้องระบุเบอร์โทรให้ครบ 10 หลักถึงจะกดจองได้ หรือกดลงทะเบียนลูกค้าใหม่
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => handleTriggerRegister(effectiveDigits || customerSearch)}
                                    className="flex items-center justify-center gap-1 px-3 py-1.5 bg-white hover:bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
                                >
                                    <UserPlus size={13} />
                                    <span>ลงทะเบียนตอนนี้</span>
                                </button>
                            </div>
                        </div>
                    ) : null
                )}

                {/* Form Customer Details: Name and Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                            ชื่อลูกค้า <span className="text-gray-400 font-normal">(ไม่บังคับ - ลงทะเบียนภายหลังได้)</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <User size={16} className="text-gray-400" />
                            </div>
                            <input 
                                placeholder="ระบุชื่อลูกค้า (ถ้ามี)..." 
                                value={form.name} 
                                onChange={e => setForm({...form, name: e.target.value})} 
                                className="w-full pl-9 pr-4 py-3 border-2 border-white bg-white rounded-xl outline-none focus:border-teal-400 transition-all font-medium text-gray-800 text-sm shadow-xs" 
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                            เบอร์โทรศัพท์ <span className="text-teal-600 font-normal">(ดึงจากช่องค้นหาอัตโนมัติ)</span>
                        </label>
                        <div className="relative flex items-center">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <Phone size={16} className="text-gray-400" />
                            </div>
                            <input 
                                type="tel"
                                placeholder="08X-XXX-XXXX" 
                                value={form.phone} 
                                maxLength={12}
                                onChange={e => {
                                    let val = e.target.value;
                                    const digits = cleanDigits(val);
                                    if (digits.length > 10) {
                                        val = digits.slice(0, 10);
                                    }
                                    setForm({...form, phone: val});
                                }} 
                                className="w-full pl-9 pr-24 py-3 border-2 border-white bg-white rounded-xl outline-none focus:border-teal-400 transition-all font-medium text-gray-800 text-sm shadow-xs font-mono" 
                            />

                            {/* Icon button at the back of phone field (ด้านหลังช่องเบอร์โทร) */}
                            {isFormPhoneNotFound && (
                                <div className="absolute inset-y-0 right-1.5 flex items-center">
                                    <button
                                        type="button"
                                        onClick={() => handleTriggerRegister(form.phone)}
                                        className="px-2 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-black shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                                        title="เบอร์นี้ยังไม่มีในระบบ - กดเพื่อลงทะเบียนลูกค้าใหม่"
                                    >
                                        <UserPlus size={13} />
                                        <span>+ ลงทะเบียน</span>
                                    </button>
                                </div>
                            )}

                            {formPhoneMatch && (
                                <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                        ✓ ในระบบ
                                    </span>
                                </div>
                            )}
                        </div>
                        {isFormPhoneNotFound && (
                            <div className="mt-1 ml-1 flex items-center justify-between text-[10px]">
                                <span className="text-teal-700 font-medium">✓ เบอร์พร้อมใช้จองทันที (ลงทะเบียนภายหลังได้)</span>
                                <button
                                    type="button"
                                    onClick={() => handleTriggerRegister(form.phone)}
                                    className="text-teal-700 hover:text-teal-900 underline font-bold"
                                >
                                    หรือลงทะเบียนตอนนี้
                                </button>
                            </div>
                        )}
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

            {/* จำนวนผู้เข้ารับบริการ (1-3 ท่าน) */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        <Users size={14} className="text-teal-600" />
                        จำนวนผู้เข้ารับบริการ
                    </label>
                    <span className="text-[10px] text-teal-600 font-bold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                        เลือกได้ 1 - 3 ท่าน
                    </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((num) => {
                        const isSelected = (form.guestsCount || 1) === num;
                        return (
                            <button
                                key={num}
                                type="button"
                                onClick={() => setForm(prev => ({ ...prev, guestsCount: num }))}
                                className={`py-3 rounded-2xl text-xs font-black transition-all border-2 flex items-center justify-center gap-1.5 active:scale-95 ${
                                    isSelected
                                        ? 'bg-gradient-to-r from-teal-500 to-emerald-500 border-teal-600 text-white shadow-md shadow-teal-500/20 scale-[1.02]'
                                        : 'bg-white border-gray-100 text-gray-600 hover:border-teal-300 hover:text-teal-700'
                                }`}
                            >
                                <Users size={15} />
                                <span>{num} ท่าน</span>
                                {num > 1 && <span className="text-[9px] opacity-80">(พร้อมกัน)</span>}
                            </button>
                        );
                    })}
                </div>
                {(form.guestsCount || 1) > 1 && (
                    <p className="text-[11px] text-teal-700 bg-teal-50/80 p-2.5 rounded-xl border border-teal-200/80 mt-2 font-medium flex items-center gap-1.5">
                        <span>💡</span> จองบริการพร้อมกัน {form.guestsCount} ท่าน (คลินิกจะจัดเตรียมเตียงและผู้ให้บริการ {form.guestsCount} ท่านไว้รองรับ)
                    </p>
                )}
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
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">บริการที่ต้องการ</label>
                    {form.service && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 animate-in fade-in">
                            <Clock size={12} className="text-teal-600" />
                            เวลารวม: {totalDuration} นาที {totalDuration >= 60 && `(${Math.floor(totalDuration / 60)} ชม.${totalDuration % 60 > 0 ? ` ${totalDuration % 60} น.` : ''})`}
                        </span>
                    )}
                </div>
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
                        const disabled = isSlotTaken && isSlotTaken(dateTimeStr, totalDuration, form.branch);
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
               <button 
                   type="submit" 
                   disabled={isSubmitting || (!selectedCustomer && !isEffectivePhoneValid)} 
                   className={`w-full font-black py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-base ${
                       !selectedCustomer && !isEffectivePhoneValid
                           ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                           : 'bg-teal-500 hover:bg-teal-600 text-white shadow-teal-500/30 active:scale-95 cursor-pointer'
                   }`}
               >
                   {isSubmitting ? (
                       <Loader2 size={20} className="animate-spin" />
                   ) : (
                       <CalendarPlus size={20} />
                   )} 
                   {!selectedCustomer && !isEffectivePhoneValid ? (
                       effectiveDigits.length > 0 
                           ? `กรุณากรอกเบอร์โทรให้ครบ 10 หลักก่อนจอง (${effectiveDigits.length}/10)`
                           : 'กรุณาระบุเบอร์โทรศัพท์เพื่อจอง'
                   ) : (
                       'บันทึกนัดหมาย'
                   )}
               </button>
            </div>
            
            <style jsx>{`
              .hide-scrollbar::-webkit-scrollbar { display: none; }
              .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </form>
    );
}
