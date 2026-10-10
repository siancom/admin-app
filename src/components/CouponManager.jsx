import React, { useState, useEffect } from 'react';
import { Ticket, Plus, Edit2, Trash2, X, Save, Percent, BadgeDollarSign, User, CheckCircle, RefreshCw, Gift, Printer } from 'lucide-react';
import { addDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { getCol, getDocRef } from '../config/firebase';
import { QRCodeSVG } from 'qrcode.react';

const CouponManager = ({ showToast, customers = [], products = [], masterCourses = [] }) => {
  const [coupons, setCoupons] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'personal' | 'batch'
  const [printCoupon, setPrintCoupon] = useState(null);
  const [printBatchMode, setPrintBatchMode] = useState(false);
  const [batchFilter, setBatchFilter] = useState('all'); // 'all' | 'unclaimed' | 'claimed'
  const [selectedCoupons, setSelectedCoupons] = useState([]);
  
  const [formData, setFormData] = useState({
    code: '',
    type: 'fixed', // 'fixed' or 'percent' or 'free_item' or 'pos_item'
    value: '',
    desc: '',
    isPersonal: false,
    customerPhone: '',
    batchCount: 50,
    prefix: 'BOX-',
    validUntil: '',
    conditionAdvanceDays: 0,
    conditionPaymentMethod: 'all'
  });

  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  
  const [itemSearch, setItemSearch] = useState('');
  const [showItemDropdown, setShowItemDropdown] = useState(false);

  const filteredCustomers = customers.filter(c => {
     if (!customerSearch) return true;
     const term = customerSearch.toLowerCase();
     return (c['ชื่อ'] && c['ชื่อ'].toLowerCase().includes(term)) || (c['เบอร์โทร'] && c['เบอร์โทร'].includes(term)) || (c.cleanPhone && c.cleanPhone.includes(term));
  }).slice(0, 5);

  const combinedItems = [
    ...products.map(p => {
       const priceStr = p['ราคาสมาชิก'] || p.col_10 || p['ราคาขายเต็ม'] || p['ราคา'] || p.col_6;
       const price = typeof priceStr === 'string' ? parseFloat(priceStr.replace(/,/g, '')) || 0 : Number(priceStr) || 0;
       return { ...p, _type: 'product', _name: p['ชื่อสินค้า'] || p.col_2 || p.name, _price: price };
    }),
    ...masterCourses.map(c => {
       const priceStr = c['ราคา'] || c.col_5;
       const price = typeof priceStr === 'string' ? parseFloat(priceStr.replace(/,/g, '')) || 0 : Number(priceStr) || 0;
       return { ...c, _type: 'course', _name: c['ชื่อคอส'] || c.col_4 || c.name, _price: price };
    })
  ].filter(i => i._name);

  const filteredItems = combinedItems.filter(i => {
     if (!itemSearch) return true;
     return i._name.toLowerCase().includes(itemSearch.toLowerCase());
  }).slice(0, 10);

  useEffect(() => {
    const unsub = onSnapshot(getCol('coupons'), (snap) => {
      setCoupons(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleOpenModal = (coupon = null) => {
    if (coupon) {
      setFormData({
        code: coupon.code || '',
        type: coupon.type || 'fixed',
        value: coupon.value || '',
        desc: coupon.desc || '',
        isPersonal: coupon.isPersonal || false,
        customerPhone: coupon.customerPhone || '',
        batchCount: 50,
        prefix: 'BOX-',
        validUntil: coupon.validUntil || '',
        conditionAdvanceDays: coupon.conditionAdvanceDays || 0,
        conditionPaymentMethod: coupon.conditionPaymentMethod || 'all'
      });
      setCustomerSearch(coupon.customerPhone || '');
      setItemSearch(coupon.type === 'pos_item' ? coupon.value : '');
      setEditingCoupon(coupon);
    } else {
      setFormData({
        code: '',
        type: 'fixed',
        value: '',
        desc: '',
        isPersonal: activeTab === 'personal',
        customerPhone: '',
        batchCount: 50,
        prefix: 'BOX-',
        validUntil: '',
        conditionAdvanceDays: 0,
        conditionPaymentMethod: 'all'
      });
      setCustomerSearch('');
      setItemSearch('');
      setEditingCoupon(null);
    }
    setIsModalOpen(true);
  };
  
  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'VCH-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (activeTab !== 'batch' && (!formData.code || !formData.value)) {
      showToast('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    if (activeTab === 'batch' && (!formData.prefix || !formData.batchCount || !formData.value)) {
      showToast('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      if (activeTab === 'batch') {
         const count = parseInt(formData.batchCount) || 50;
         for (let i = 0; i < count; i++) {
             const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
             const uniqueCode = `${formData.prefix.toUpperCase()}${randomStr}`;
             const insertData = {
                code: uniqueCode,
                type: formData.type,
                value: Number(formData.value) || 0,
                desc: formData.desc,
                isPersonal: false,
                isBatch: true, // Special flag for batch
                claimed: false,
                customerPhone: '',
                validUntil: formData.validUntil || null,
                conditionAdvanceDays: Number(formData.conditionAdvanceDays) || 0,
                conditionPaymentMethod: formData.conditionPaymentMethod || 'all',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
             };
             await addDoc(getCol('coupons'), insertData);
         }
         showToast(`สร้างคูปองแจกกลุ่ม ${count} ใบ สำเร็จ`);
      } else {
         const dataToSave = {
           code: formData.code.toUpperCase(),
           type: formData.type,
           value: Number(formData.value) || 0,
           desc: formData.desc,
           isPersonal: formData.isPersonal,
           customerPhone: formData.isPersonal ? formData.customerPhone.replace(/[^0-9]/g, '') : '',
           validUntil: formData.validUntil || null,
           conditionAdvanceDays: Number(formData.conditionAdvanceDays) || 0,
           conditionPaymentMethod: formData.conditionPaymentMethod || 'all',
           updatedAt: new Date().toISOString()
         };

         if (editingCoupon) {
           await updateDoc(getDocRef('coupons', editingCoupon.id), dataToSave);
           showToast('อัปเดตคูปองสำเร็จ');
         } else {
           const insertData = { ...dataToSave, createdAt: new Date().toISOString(), isBatch: false };
           if (formData.isPersonal) {
              insertData.isUsed = false; 
           }
           await addDoc(getCol('coupons'), insertData);
           showToast('เพิ่มคูปองสำเร็จ');
         }
      }
      setIsModalOpen(false);
    } catch (err) {
      showToast('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบคูปองนี้?')) {
      try {
        await deleteDoc(getDocRef('coupons', id));
        showToast('ลบคูปองสำเร็จ');
      } catch (err) {
        showToast('ลบไม่สำเร็จ: ' + err.message);
      }
    }
  };

  return (
    <>
    <div className={`p-4 sm:p-6 bg-slate-50 min-h-screen ${printCoupon || printBatchMode ? 'print:hidden' : ''}`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Ticket className="text-rose-500" /> จัดการคูปอง
          </h1>
          <div className="flex items-center gap-2">
            {activeTab === 'batch' && (
              <button
                onClick={() => setPrintBatchMode(true)}
                className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all"
              >
                <Printer size={18} /> พิมพ์คูปองทั้งหมด
              </button>
            )}
            <button
              onClick={() => handleOpenModal()}
              className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus size={18} /> สร้างคูปองใหม่
            </button>
          </div>
        </div>
        
        <div className="flex gap-4 mb-4">
          <button 
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${activeTab === 'general' ? 'bg-rose-100 text-rose-700 shadow-sm border border-rose-200' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}
          >
            คูปองทั่วไป (ใช้ได้ทุกคน)
          </button>
          <button 
            onClick={() => setActiveTab('batch')}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${activeTab === 'batch' ? 'bg-emerald-100 text-emerald-700 shadow-sm border border-emerald-200' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}
          >
            คูปองสุ่มแจก (Batch)
          </button>
          <button 
            onClick={() => setActiveTab('personal')}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${activeTab === 'personal' ? 'bg-fuchsia-100 text-fuchsia-700 shadow-sm border border-fuchsia-200' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}
          >
            Gift Voucher รายบุคคล
          </button>
        </div>

        {activeTab === 'batch' && (
          <div className="flex gap-2 mb-4 bg-white p-2 rounded-xl shadow-sm border border-slate-200 inline-flex">
            <button 
              onClick={() => setBatchFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${batchFilter === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              ทั้งหมด
            </button>
            <button 
              onClick={() => setBatchFilter('unclaimed')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${batchFilter === 'unclaimed' ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              ยังไม่ถูกเก็บ
            </button>
            <button 
              onClick={() => setBatchFilter('claimed')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${batchFilter === 'claimed' ? 'bg-slate-200 text-slate-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              เก็บไปแล้ว
            </button>
          </div>
        )}

        {activeTab === 'batch' && selectedCoupons.length > 0 && (
          <div className="flex gap-2 mb-4 animate-in fade-in slide-in-from-top-4">
            <button 
              onClick={() => setPrintBatchMode(true)}
              className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all text-sm"
            >
              <Printer size={16} /> พิมพ์ที่เลือก ({selectedCoupons.length})
            </button>
            <button 
              onClick={async () => {
                if(window.confirm(`แน่ใจหรือไม่ว่าต้องการลบคูปอง ${selectedCoupons.length} ใบที่เลือก?`)) {
                   for (const id of selectedCoupons) {
                     await deleteDoc(getDocRef('coupons', id));
                   }
                   setSelectedCoupons([]);
                   showToast(`ลบคูปอง ${selectedCoupons.length} ใบสำเร็จ`);
                }
              }}
              className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all text-sm"
            >
              <Trash2 size={16} /> ลบที่เลือก ({selectedCoupons.length})
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-800">
                <tr>
                  {activeTab === 'batch' && (
                    <th className="px-6 py-4 font-bold w-10">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                        onChange={(e) => {
                          const currentFiltered = coupons.filter(c => c.isBatch && (batchFilter === 'all' ? true : batchFilter === 'unclaimed' ? !c.claimed : c.claimed));
                          if (e.target.checked) {
                            setSelectedCoupons(currentFiltered.map(c => c.id));
                          } else {
                            setSelectedCoupons([]);
                          }
                        }}
                        checked={
                           coupons.filter(c => c.isBatch && (batchFilter === 'all' ? true : batchFilter === 'unclaimed' ? !c.claimed : c.claimed)).length > 0 &&
                           selectedCoupons.length === coupons.filter(c => c.isBatch && (batchFilter === 'all' ? true : batchFilter === 'unclaimed' ? !c.claimed : c.claimed)).length
                        }
                      />
                    </th>
                  )}
                  <th className="px-6 py-4 font-bold">โค้ดคูปอง (Code)</th>
                  {activeTab === 'personal' && (
                    <th className="px-6 py-4 font-bold">เจ้าของสิทธิ์ / สถานะ</th>
                  )}
                  {activeTab === 'batch' && (
                    <th className="px-6 py-4 font-bold">สถานะการเก็บ</th>
                  )}
                  <th className="px-6 py-4 font-bold">รายละเอียด</th>
                  <th className="px-6 py-4 font-bold">ส่วนลด</th>
                  <th className="px-6 py-4 font-bold text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {coupons.filter(c => (activeTab === 'batch' ? c.isBatch && (batchFilter === 'all' ? true : batchFilter === 'unclaimed' ? !c.claimed : c.claimed) : (c.isPersonal || false) === (activeTab === 'personal') && !c.isBatch)).length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                      ยังไม่มีคูปองในระบบ
                    </td>
                  </tr>
                ) : (
                  coupons
                    .filter(c => (activeTab === 'batch' ? c.isBatch && (batchFilter === 'all' ? true : batchFilter === 'unclaimed' ? !c.claimed : c.claimed) : (c.isPersonal || false) === (activeTab === 'personal') && !c.isBatch))
                    .map((coupon) => (
                    <tr key={coupon.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      {activeTab === 'batch' && (
                        <td className="px-6 py-4">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                            checked={selectedCoupons.includes(coupon.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCoupons(prev => [...prev, coupon.id]);
                              } else {
                                setSelectedCoupons(prev => prev.filter(id => id !== coupon.id));
                              }
                            }}
                          />
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="font-black text-rose-600 text-base uppercase bg-rose-50 px-2 py-1 rounded inline-block border border-rose-100">{coupon.code}</div>
                        {coupon.validUntil && (
                          <div className="text-[10px] text-slate-500 mt-1 font-bold">
                            หมดอายุ: {new Date(coupon.validUntil).toLocaleDateString('th-TH')}
                          </div>
                        )}
                      </td>
                      {activeTab === 'personal' && (
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 text-slate-600 font-medium">
                              <User size={14} /> {coupon.customerPhone || 'ไม่ระบุเบอร์'}
                            </div>
                            <div>
                              {coupon.isUsed ? (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                                  <CheckCircle size={10} /> ใช้สิทธิ์แล้ว
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-bold">
                                  <Gift size={10} /> ยังไม่ถูกใช้
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                      )}
                      {activeTab === 'batch' && (
                        <td className="px-6 py-4">
                            {coupon.claimed ? (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                                <CheckCircle size={10} /> เก็บไปแล้ว
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-bold">
                                <Gift size={10} /> ยังไม่ถูกเก็บ
                              </span>
                            )}
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="text-slate-600">{coupon.desc || '-'}</div>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {coupon.type === 'percent' ? (
                          <span className="text-sky-600 flex items-center gap-1">
                            <Percent size={14} /> ลด {coupon.value}%
                          </span>
                        ) : coupon.type === 'gamification_spins' ? (
                          <span className="text-purple-600 flex items-center gap-1">
                            <Gift size={14} /> {coupon.value} สิทธิ์
                          </span>
                        ) : coupon.type === 'pos_item' ? (
                          <span className="text-indigo-600 flex items-center gap-1 text-xs truncate max-w-[120px]">
                            <Gift size={14} className="shrink-0" /> {coupon.value}
                          </span>
                        ) : coupon.type === 'free_item' ? (
                          <span className="text-orange-600 flex items-center gap-1">
                            <Gift size={14} /> แลกฟรี
                          </span>
                        ) : (
                          <span className="text-emerald-600 flex items-center gap-1">
                            <BadgeDollarSign size={14} /> ลด {coupon.value}฿
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => setPrintCoupon(coupon)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="พิมพ์แจก">
                            <Printer size={16} />
                          </button>
                          <button onClick={() => handleOpenModal(coupon)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(coupon.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
              <div className="flex justify-between items-center p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Ticket className="text-rose-500" />
                  {editingCoupon ? 'แก้ไขคูปอง' : 'สร้างคูปองใหม่'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                <form id="couponForm" onSubmit={handleSave} className="space-y-5">
                  {activeTab === 'batch' ? (
                  <>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">รหัสนำหน้า (Prefix) *</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none uppercase font-bold text-rose-600"
                      value={formData.prefix}
                      onChange={e => setFormData({...formData, prefix: e.target.value})}
                      placeholder="เช่น BOX-, EVENT-"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">จำนวนคูปองที่ต้องการสร้าง (ใบ) *</label>
                    <input 
                      type="number" 
                      required min="1" max="500"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none font-bold"
                      value={formData.batchCount}
                      onChange={e => setFormData({...formData, batchCount: e.target.value})}
                    />
                  </div>
                  </>
                  ) : (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">โค้ดคูปอง (Code) *</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        required
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none uppercase font-bold text-rose-600"
                        value={formData.code}
                        onChange={e => setFormData({...formData, code: e.target.value})}
                        placeholder="เช่น WELCOME100, SUMMER50"
                      />
                      <button 
                        type="button"
                        onClick={generateRandomCode}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 rounded-xl flex items-center justify-center transition-colors"
                        title="สุ่มรหัส"
                      >
                        <RefreshCw size={18} />
                      </button>
                    </div>
                  </div>
                  )}
                  
                  {formData.isPersonal && (
                    <div className="relative">
                      <label className="block text-sm font-bold text-slate-700 mb-1">เบอร์โทรศัพท์ลูกค้า (เจ้าของสิทธิ์) *</label>
                      <input 
                        type="text" 
                        required={formData.isPersonal}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none font-medium"
                        value={customerSearch}
                        onChange={e => {
                           setCustomerSearch(e.target.value);
                           setFormData({...formData, customerPhone: e.target.value});
                           setShowCustomerDropdown(true);
                        }}
                        onFocus={() => setShowCustomerDropdown(true)}
                        onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                        placeholder="พิมพ์ชื่อหรือเบอร์โทรเพื่อค้นหา..."
                        autoComplete="off"
                      />
                      {showCustomerDropdown && customerSearch && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                          {filteredCustomers.length > 0 ? filteredCustomers.map(c => (
                            <button
                              key={c.id}
                              type="button"
                              className="w-full text-left px-4 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                              onClick={() => {
                                 const phone = c.cleanPhone || c['เบอร์โทร'];
                                 setCustomerSearch(`${c['ชื่อ']} (${phone})`);
                                 setFormData({...formData, customerPhone: phone});
                                 setShowCustomerDropdown(false);
                              }}
                            >
                              <div className="font-bold text-slate-800">{c['ชื่อ']}</div>
                              <div className="text-xs text-slate-500">{c['เบอร์โทร']}</div>
                            </button>
                          )) : (
                            <div className="px-4 py-3 text-sm text-slate-500 text-center">ไม่พบลูกค้า</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1 flex justify-between items-center">
                       รายละเอียด *
                    </label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                      value={formData.desc}
                      onChange={e => setFormData({...formData, desc: e.target.value})}
                      placeholder="เช่น ส่วนลด 100 บาท สำหรับลูกค้าใหม่"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                       {['ส่วนลดลูกค้าใหม่', 'ของขวัญวันเกิด', 'คอร์สฟรีจากการเล่นเกม', 'ชดเชยกรณีพิเศษ', 'สปาเย็นฟรี'].map(txt => (
                          <button 
                            key={txt} 
                            type="button" 
                            onClick={() => setFormData({...formData, desc: txt})}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors"
                          >
                            {txt}
                          </button>
                       ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-bold text-slate-700 mb-1">วันหมดอายุ (Expiry Date) - เลือกหรือไม่ก็ได้</label>
                      <input 
                        type="date"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                        value={formData.validUntil || ''}
                        onChange={e => setFormData({...formData, validUntil: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">ประเภทส่วนลด</label>
                      <select 
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none bg-white"
                        value={formData.type}
                        onChange={e => {
                           const firstItemName = combinedItems.length > 0 ? combinedItems[0]._name : '';
                           setFormData({...formData, type: e.target.value, value: e.target.value === 'pos_item' ? firstItemName : ''});
                           if (e.target.value === 'pos_item') setItemSearch(firstItemName);
                        }}
                      >
                        <option value="fixed">เป็นเงินสด (บาท)</option>
                        <option value="percent">เป็นเปอร์เซ็นต์ (%)</option>
                        <option value="free_item">แลกฟรี (ใส่ 0)</option>
                        <option value="pos_item">รายการจาก POS / คอร์ส</option>
                        <option value="gamification_spins">สิทธิ์หมุนวงล้อ (Spins)</option>
                      </select>
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-bold text-slate-700 mb-1">มูลค่า / จำนวนสิทธิ์ / รายการ *</label>
                      {formData.type === 'pos_item' ? (
                        <>
                          <input 
                            type="text" 
                            required
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none font-medium"
                            value={itemSearch}
                            onChange={e => {
                               setItemSearch(e.target.value);
                               setFormData({...formData, value: e.target.value});
                               setShowItemDropdown(true);
                            }}
                            onFocus={() => setShowItemDropdown(true)}
                            onBlur={() => setTimeout(() => setShowItemDropdown(false), 200)}
                            placeholder="พิมพ์ชื่อสินค้าหรือคอร์ส..."
                            autoComplete="off"
                          />
                          {showItemDropdown && itemSearch && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                              {filteredItems.length > 0 ? filteredItems.map(i => (
                                <button
                                  key={i.id || i._name}
                                  type="button"
                                  className="w-full text-left px-4 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                                  onClick={() => {
                                     setItemSearch(i._name);
                                     setFormData({...formData, value: i._name});
                                     setShowItemDropdown(false);
                                  }}
                                >
                                  <div className="font-bold text-slate-800">{i._name} {i._price > 0 && <span className="text-emerald-600 font-bold ml-1">(฿{i._price.toLocaleString()})</span>}</div>
                                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                                     {i._type === 'course' ? '📦 คอร์ส' : '🛍️ สินค้า'}
                                  </div>
                                </button>
                              )) : (
                                <div className="px-4 py-3 text-sm text-slate-500 text-center">ไม่พบรายการ</div>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <input 
                          type="number" 
                          required min="1"
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                          value={formData.value}
                          onChange={e => setFormData({...formData, value: e.target.value})}
                        />
                      )}
                    </div>
                  </div>

                  <hr className="border-slate-100 my-4" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="sm:col-span-2">
                       <h4 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-1">
                          เงื่อนไขพิเศษ (ไม่บังคับ)
                       </h4>
                       <p className="text-xs text-slate-500 mb-3">ระบุเงื่อนไขการใช้งานคูปอง หากไม่ต้องระบุเงื่อนไขให้ปล่อยค่าเริ่มต้นไว้</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">ต้องจองล่วงหน้าอย่างน้อย (วัน)</label>
                      <input 
                        type="number" 
                        min="0"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none bg-white text-sm"
                        value={formData.conditionAdvanceDays}
                        onChange={e => setFormData({...formData, conditionAdvanceDays: e.target.value})}
                        placeholder="0 = ไม่จำกัด"
                      />
                      <p className="text-[10px] text-slate-500 mt-1 ml-1">เช่น 1 = ต้องจองคิววันพรุ่งนี้ขึ้นไป</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">ช่องทางการชำระเงินที่รองรับ</label>
                      <select 
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none bg-white text-sm"
                        value={formData.conditionPaymentMethod}
                        onChange={e => setFormData({...formData, conditionPaymentMethod: e.target.value})}
                      >
                        <option value="all">ทุกช่องทาง</option>
                        <option value="transfer">เฉพาะ โอนเงิน เท่านั้น</option>
                        <option value="cash">เฉพาะ เงินสด เท่านั้น</option>
                        <option value="credit_card">เฉพาะ บัตรเครดิต เท่านั้น</option>
                      </select>
                      <p className="text-[10px] text-slate-500 mt-1 ml-1">เลือกว่าต้องจ่ายด้วยวิธีไหน</p>
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit" 
                  form="couponForm"
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm flex items-center gap-2"
                >
                  <Save size={18} /> บันทึกคูปอง
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Print QR Modal */}
    {printCoupon && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:bg-white print:p-0 print:absolute print:inset-0 print:block">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm flex flex-col relative print:shadow-none print:w-full print:max-w-none print:h-full print:justify-center">
          
          <div className="absolute right-4 top-4 print:hidden">
            <button onClick={() => setPrintCoupon(null)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-10 flex flex-col items-center justify-center text-center">
             <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4 print:hidden">
                 <Gift size={32} className="text-rose-500" />
             </div>
             
             <h3 className="text-2xl font-black text-rose-600 mb-2">Iris Clinic Privilege</h3>
             <p className="text-base font-bold text-slate-700 mb-6 px-4">{printCoupon.desc}</p>
             
             <div className="p-5 bg-white border-[3px] border-rose-100 rounded-[2rem] shadow-sm mb-6 print:border-slate-800 print:shadow-none inline-block">
                 <QRCodeSVG 
                    value={JSON.stringify({ type: 'voucher', code: printCoupon.code })} 
                    size={200} 
                    level="H" 
                 />
             </div>
             
             <p className="text-sm font-bold text-slate-500 mb-2">สแกนรับสิทธิ์ผ่านไลน์แอปพลิเคชัน</p>
             <div className="bg-slate-100 px-6 py-2 rounded-xl print:bg-white print:border print:border-slate-200">
                <p className="font-mono font-black text-xl text-slate-800 tracking-widest">{printCoupon.code}</p>
             </div>
          </div>
          
          <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-center gap-3 rounded-b-3xl print:hidden">
            <button 
              onClick={() => window.print()}
              className="w-full py-3 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <Printer size={20} /> พิมพ์ QR Code (Print)
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Print Batch Modal */}
    {printBatchMode && (
      <div className="fixed inset-0 z-50 bg-white overflow-y-auto print:absolute print:inset-0 print:overflow-visible">
        <div className="max-w-6xl mx-auto flex flex-col min-h-screen">
          <div className="p-6 flex justify-between items-center border-b border-slate-100 print:hidden sticky top-0 bg-white z-10 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Printer className="text-rose-500" /> 
              พิมพ์คูปองแจกกลุ่ม ({selectedCoupons.length > 0 ? selectedCoupons.length : coupons.filter(c => c.isBatch && !c.claimed).length} ใบ)
            </h2>
            <div className="flex gap-3">
              <button onClick={() => setPrintBatchMode(false)} className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                ยกเลิก
              </button>
              <button onClick={() => window.print()} className="px-6 py-2 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm flex items-center gap-2">
                <Printer size={18} /> สั่งพิมพ์เลย
              </button>
            </div>
          </div>
          
           {/* Print Grid Area */}
          <div className="p-6 print:p-0">
             <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 print:grid-cols-7 print:gap-1">
               {coupons
                 .filter(c => c.isBatch && (selectedCoupons.length > 0 ? selectedCoupons.includes(c.id) : !c.claimed))
                 .map(coupon => (
                  <div key={coupon.id} className="border border-slate-200 p-2 rounded-xl flex flex-col items-center justify-center text-center break-inside-avoid print:border-dashed print:border-slate-300 print:p-1 print:rounded-lg bg-white">
                      <h4 className="font-black text-rose-600 text-[10px] mb-0.5 uppercase tracking-wide print:text-[8px]">Iris Clinic</h4>
                      <p className="text-[9px] font-bold text-slate-700 mb-1 truncate w-full px-0.5 print:text-[7px]">{coupon.desc}</p>
                      <div className="bg-white p-0.5 rounded-md">
                        <QRCodeSVG value={JSON.stringify({ type: 'voucher', code: coupon.code })} size={60} level="L" className="print:w-12 print:h-12" />
                      </div>
                      <p className="font-mono font-black text-[9px] text-slate-800 mt-1 bg-slate-100 px-1 py-0.5 rounded print:text-[7px]">{coupon.code}</p>
                  </div>
               ))}
               {coupons.filter(c => c.isBatch && (selectedCoupons.length > 0 ? selectedCoupons.includes(c.id) : !c.claimed)).length === 0 && (
                 <div className="col-span-full py-12 text-center text-slate-500 font-bold print:hidden">
                   ไม่มีคูปองให้พิมพ์ครับ
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default CouponManager;
