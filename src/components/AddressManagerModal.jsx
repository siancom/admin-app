import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Save, MapPin, Edit3, Loader2, RefreshCw } from 'lucide-react';
import { db } from '../config/firebase';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getFuzzyKey } from '../utils/fuzzy';
import { parseThaiAddress } from '../utils/thaiAddress';
import ModalWrapper from './ModalWrapper';

export default function AddressManagerModal({ isOpen, onClose, customers }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editAddress, setEditAddress] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isFetchingHistory, setIsFetchingHistory] = useState(false);
    const [bulkProgress, setBulkProgress] = useState({ isRunning: false, total: 0, current: 0, found: 0 });
    const [page, setPage] = useState(1);
    const itemsPerPage = 20;

    // Reset when opened
    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setEditingId(null);
            setPage(1);
        }
    }, [isOpen]);

    // Filter customers
    const filteredCustomers = useMemo(() => {
        if (!searchTerm) return customers;
        const lowerSearch = searchTerm.toLowerCase();
        return customers.filter(c => {
            const name = String(c.computedName || '').toLowerCase();
            const phone = String(c.computedPhone || '').toLowerCase();
            const address = String(getFuzzyKey(c, ['ที่อยู่', 'col_4', 'address']) || '').toLowerCase();
            return name.includes(lowerSearch) || phone.includes(lowerSearch) || address.includes(lowerSearch);
        });
    }, [customers, searchTerm]);

    const paginatedCustomers = useMemo(() => {
        return filteredCustomers.slice(0, page * itemsPerPage);
    }, [filteredCustomers, page]);

    const handleScroll = (e) => {
        const { scrollTop, clientHeight, scrollHeight } = e.target;
        if (scrollHeight - scrollTop <= clientHeight * 1.5) {
            if (page * itemsPerPage < filteredCustomers.length) {
                setPage(p => p + 1);
            }
        }
    };

    const startEditing = (customer) => {
        setEditingId(customer.id);
        setEditAddress(String(getFuzzyKey(customer, ['ที่อยู่', 'col_4', 'address']) || ''));
    };

    const handleAddressChange = async (e) => {
        const text = e.target.value;
        setEditAddress(text);
    };

    const handleAutoFill = async () => {
        if (!editAddress) return;
        const parsed = await parseThaiAddress(editAddress);
        if (parsed.zipcode && parsed.province) {
            // Check if address already contains these words to avoid duplication
            let newAddr = editAddress;
            const appendParts = [];
            
            if (parsed.district && !newAddr.includes(parsed.district)) appendParts.push(`ต.${parsed.district}`);
            if (parsed.amphure && !newAddr.includes(parsed.amphure)) appendParts.push(`อ.${parsed.amphure}`);
            if (parsed.province && !newAddr.includes(parsed.province)) appendParts.push(`จ.${parsed.province}`);
            if (parsed.zipcode && !newAddr.includes(parsed.zipcode)) appendParts.push(parsed.zipcode);
            
            if (appendParts.length > 0) {
                // If it ends with zipcode, replace zipcode with full info
                const zipRegex = new RegExp(`${parsed.zipcode}\\s*$`);
                if (zipRegex.test(newAddr)) {
                   newAddr = newAddr.replace(zipRegex, '').trim() + ' ' + appendParts.join(' ');
                } else {
                   newAddr = newAddr.trim() + ' ' + appendParts.join(' ');
                }
                setEditAddress(newAddr);
            }
        }
    };

    const saveAddress = async (customerId) => {
        setIsSaving(true);
        try {
            const customerRef = doc(db, 'customers', customerId);
            await updateDoc(customerRef, {
                'ที่อยู่': editAddress,
                col_4: editAddress,
                address: editAddress,
                updatedAt: new Date().toISOString()
            });
            setEditingId(null);
            // Optionally show toast, but we'll just quietly succeed for speed
        } catch (error) {
            console.error("Error updating address:", error);
            alert("บันทึกไม่สำเร็จ: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleFetchFromHistory = async (customerPhone) => {
        if (!customerPhone) return;
        setIsFetchingHistory(true);
        try {
            const q = query(collection(db, 'orders'), where('customerPhone', '==', customerPhone));
            const snapshot = await getDocs(q);
            let foundAddress = '';
            
            // Sort locally to avoid needing a composite index in Firestore
            const docs = snapshot.docs.map(d => d.data()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            
            for (const order of docs) {
                if (order.shippingAddress) { foundAddress = order.shippingAddress; break; }
                if (order.dst_address) { foundAddress = order.dst_address; break; }
                if (order.address) { foundAddress = order.address; break; }
            }

            if (foundAddress) {
                setEditAddress(foundAddress);
            } else {
                alert('ไม่พบประวัติที่อยู่จัดส่งในออเดอร์เก่าๆ ของลูกค้ารายนี้เลยครับ');
            }
        } catch (error) {
            console.error("Error fetching history:", error);
            alert("ดึงข้อมูลไม่สำเร็จ: " + error.message);
        } finally {
            setIsFetchingHistory(false);
        }
    };

    const handleBulkFetch = async () => {
        const missingCustomers = customers.filter(c => !String(getFuzzyKey(c, ['ที่อยู่', 'col_4', 'address']) || '').trim());
        
        if (missingCustomers.length === 0) {
            alert('ลูกค้าทุกคนมีที่อยู่ครบแล้วครับ!');
            return;
        }

        if (!confirm(`พบลูกค้าที่ยังไม่มีที่อยู่ ${missingCustomers.length} คน\n\nระบบจะทำการค้นหาจากประวัติออเดอร์เก่าและอัปเดตให้อัตโนมัติ อาจใช้เวลาสักครู่ คุณต้องการดำเนินการต่อหรือไม่?`)) {
            return;
        }

        setBulkProgress({ isRunning: true, total: missingCustomers.length, current: 0, found: 0 });
        let foundCount = 0;

        for (let i = 0; i < missingCustomers.length; i++) {
            const customer = missingCustomers[i];
            const customerPhone = customer.computedPhone;
            
            setBulkProgress(prev => ({ ...prev, current: i + 1 }));

            if (customerPhone) {
                try {
                    const q = query(collection(db, 'orders'), where('customerPhone', '==', customerPhone));
                    const snapshot = await getDocs(q);
                    let foundAddress = '';
                    
                    const docs = snapshot.docs.map(d => d.data()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
                    
                    for (const order of docs) {
                        if (order.shippingAddress) { foundAddress = order.shippingAddress; break; }
                        if (order.dst_address) { foundAddress = order.dst_address; break; }
                        if (order.address) { foundAddress = order.address; break; }
                    }

                    if (foundAddress) {
                        const customerRef = doc(db, 'customers', customer.id);
                        await updateDoc(customerRef, {
                            'ที่อยู่': foundAddress,
                            col_4: foundAddress,
                            address: foundAddress,
                            updatedAt: new Date().toISOString()
                        });
                        foundCount++;
                        setBulkProgress(prev => ({ ...prev, found: foundCount }));
                    }
                } catch (error) {
                    console.error("Error bulk fetching for", customerPhone, error);
                }
            }
        }

        setBulkProgress({ isRunning: false, total: 0, current: 0, found: 0 });
        alert(`ดำเนินการเสร็จสิ้น!\nพบที่อยู่และอัปเดตสำเร็จ ${foundCount} รายการ จากทั้งหมด ${missingCustomers.length} รายการ`);
    };

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} title="จัดการที่อยู่จัดส่ง (รวดเดียว)" icon={MapPin} colorClass="bg-purple-100 text-purple-600" noMaxHeight={true}>
            <div className="flex flex-col h-[75vh]">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-4 gap-3 shrink-0">
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex-1">
                        <Search size={18} className="text-gray-400 mr-2" />
                        <input 
                            type="text" 
                            placeholder="ค้นหาชื่อ, เบอร์โทร, ที่อยู่..." 
                            className="bg-transparent outline-none w-full text-sm font-medium"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={handleBulkFetch}
                        disabled={bulkProgress.isRunning}
                        className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center shrink-0 hover:bg-orange-600 transition-colors shadow-sm disabled:opacity-50"
                    >
                        {bulkProgress.isRunning ? <Loader2 size={16} className="mr-2 animate-spin" /> : <RefreshCw size={16} className="mr-2" />}
                        ดึงประวัติที่อยู่ทั้งหมดรวดเดียว
                    </button>
                </div>
                
                {bulkProgress.isRunning && (
                    <div className="mb-4 bg-orange-50 rounded-xl p-3 border border-orange-100 shrink-0">
                        <div className="flex justify-between text-xs font-bold text-orange-700 mb-1">
                            <span>กำลังค้นหาประวัติและอัปเดต... ({bulkProgress.current}/{bulkProgress.total})</span>
                            <span>พบแล้ว {bulkProgress.found} รายการ</span>
                        </div>
                        <div className="w-full bg-orange-200 rounded-full h-2">
                            <div className="bg-orange-500 h-2 rounded-full transition-all duration-300" style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}></div>
                        </div>
                    </div>
                )}

                <div 
                    className="flex-1 overflow-y-auto pr-2 hide-scrollbar space-y-3"
                    onScroll={handleScroll}
                >
                    {paginatedCustomers.map((customer) => {
                        const currentAddress = String(getFuzzyKey(customer, ['ที่อยู่', 'col_4', 'address']) || '');
                        const isEditing = editingId === customer.id;

                        return (
                            <div key={customer.id} className={`bg-white border rounded-2xl p-4 transition-all ${isEditing ? 'border-purple-300 shadow-md ring-2 ring-purple-100' : 'border-gray-100 hover:border-purple-200 hover:shadow-sm'}`}>
                                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-black text-gray-800">{customer.computedName}</h3>
                                            <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">{customer.computedPhone}</span>
                                        </div>
                                        
                                        {isEditing ? (
                                            <div className="mt-2">
                                                <div className="flex flex-col gap-2">
                                                    <textarea 
                                                        className="w-full border border-purple-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-purple-100 resize-none"
                                                        rows={2}
                                                        placeholder="พิมพ์ที่อยู่ หรือ รหัสไปรษณีย์ แล้วกดเติมอัตโนมัติ"
                                                        value={editAddress}
                                                        onChange={handleAddressChange}
                                                    />
                                                    <div className="flex flex-wrap justify-between items-center gap-2 mt-1">
                                                        <button 
                                                            onClick={handleAutoFill}
                                                            className="text-[11px] font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition-colors shrink-0"
                                                            type="button"
                                                        >
                                                            ✨ เติมตำบล/อำเภอ อัตโนมัติ
                                                        </button>
                                                        <button
                                                            onClick={() => handleFetchFromHistory(customer.computedPhone)}
                                                            disabled={isFetchingHistory}
                                                            className="text-[11px] font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors flex items-center shrink-0 disabled:opacity-50"
                                                            type="button"
                                                        >
                                                            {isFetchingHistory ? <Loader2 size={12} className="animate-spin mr-1"/> : <RefreshCw size={12} className="mr-1"/>}
                                                            ดึงจากประวัติจัดส่ง (iShip/ออเดอร์)
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className={`text-sm mt-1 ${currentAddress ? 'text-gray-600' : 'text-gray-400 italic'}`}>
                                                {currentAddress || 'ยังไม่มีที่อยู่จัดส่ง'}
                                            </p>
                                        )}
                                    </div>
                                    
                                    <div className="shrink-0 flex items-center justify-end">
                                        {isEditing ? (
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => setEditingId(null)}
                                                    className="px-3 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                                                    disabled={isSaving}
                                                >
                                                    ยกเลิก
                                                </button>
                                                <button 
                                                    onClick={() => saveAddress(customer.id)}
                                                    className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-sm transition-colors flex items-center disabled:opacity-50"
                                                    disabled={isSaving}
                                                >
                                                    {isSaving ? <Loader2 size={14} className="animate-spin mr-1"/> : <Save size={14} className="mr-1"/>}
                                                    บันทึก
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => startEditing(customer)}
                                                className="px-3 py-2 text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors flex items-center"
                                            >
                                                <Edit3 size={14} className="mr-1"/> แก้ไขที่อยู่
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    
                    {filteredCustomers.length === 0 && (
                        <div className="text-center py-10 text-gray-400">
                            <MapPin size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="font-medium text-sm">ไม่พบลูกค้าที่ค้นหา</p>
                        </div>
                    )}
                </div>
            </div>
        </ModalWrapper>
    );
}
