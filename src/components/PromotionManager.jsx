import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit2, Trash2, X, Save, Percent, BadgeDollarSign } from 'lucide-react';
import { addDoc, updateDoc, deleteDoc, onSnapshot, query, getDocs } from 'firebase/firestore';
import { getCol, getDocRef, db } from '../config/firebase';

const PromotionManager = ({ products, masterCourses, showToast }) => {
  const [promotions, setPromotions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'discount_percent', // discount_percent, discount_amount, buy_x_get_y, free_item, discount_next_time
    value: '', // For percent/amount. Or buyQty for buy_x_get_y
    getQty: '', // For buy_x_get_y
    freeItemName: '', // For free_item
    freeItemQty: '', // For free_item
    discountNextType: 'percent', // 'percent', 'amount' for discount_next_time
    discountNextValue: '', // For discount_next_time
    scope: 'cart_total', // cart_total, specific_items
    applicableItemIds: [], // Used if scope is specific_items
    minPurchaseAmount: '',
    hasHappyHour: false,
    happyHourStart: '',
    happyHourEnd: '',
    isActive: true
  });

  useEffect(() => {
    const unsub = onSnapshot(getCol('promotions'), (snap) => {
      setPromotions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'discount_percent',
      value: '',
      getQty: '',
      freeItemName: '',
      freeItemQty: '',
      discountNextType: 'percent',
      discountNextValue: '',
      scope: 'cart_total',
      applicableItemIds: [],
      minPurchaseAmount: '',
      hasHappyHour: false,
      happyHourStart: '',
      happyHourEnd: '',
      isActive: true
    });
    setEditingPromotion(null);
  };

  const handleOpenModal = (promo = null) => {
    if (promo) {
      setFormData({
        name: promo.name || '',
        description: promo.description || '',
        type: promo.type || 'discount_percent',
        value: promo.value || '',
        getQty: promo.getQty || '',
        freeItemName: promo.freeItemName || '',
        freeItemQty: promo.freeItemQty || '',
        discountNextType: promo.discountNextType || 'percent',
        discountNextValue: promo.discountNextValue || '',
        scope: promo.scope || 'cart_total',
        applicableItemIds: promo.applicableItemIds || [],
        minPurchaseAmount: promo.minPurchaseAmount || '',
        hasHappyHour: promo.hasHappyHour || false,
        happyHourStart: promo.happyHourStart || '',
        happyHourEnd: promo.happyHourEnd || '',
        isActive: promo.isActive ?? true
      });
      setEditingPromotion(promo);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      showToast('กรุณากรอกชื่อโปรโมชั่น');
      return;
    }

    try {
      const dataToSave = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        value: Number(formData.value) || 0,
        getQty: Number(formData.getQty) || 0,
        freeItemName: formData.freeItemName || '',
        freeItemQty: Number(formData.freeItemQty) || 0,
        discountNextType: formData.discountNextType || 'percent',
        discountNextValue: Number(formData.discountNextValue) || 0,
        scope: formData.scope,
        applicableItemIds: formData.scope === 'specific_items' ? formData.applicableItemIds : [],
        minPurchaseAmount: Number(formData.minPurchaseAmount) || 0,
        hasHappyHour: formData.hasHappyHour,
        happyHourStart: formData.hasHappyHour ? formData.happyHourStart : '',
        happyHourEnd: formData.hasHappyHour ? formData.happyHourEnd : '',
        isActive: formData.isActive,
        updatedAt: new Date().toISOString()
      };

      if (editingPromotion) {
        await updateDoc(getDocRef('promotions', editingPromotion.id), dataToSave);
        showToast('อัปเดตโปรโมชั่นสำเร็จ');
      } else {
        await addDoc(getCol('promotions'), {
          ...dataToSave,
          createdAt: new Date().toISOString()
        });
        showToast('เพิ่มโปรโมชั่นใหม่สำเร็จ');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโปรโมชั่นนี้?')) {
      try {
        await deleteDoc(getDocRef('promotions', id));
        showToast('ลบโปรโมชั่นสำเร็จ');
      } catch (err) {
        showToast('ลบไม่สำเร็จ: ' + err.message);
      }
    }
  };

  const handleToggleActive = async (promo) => {
    try {
      await updateDoc(getDocRef('promotions', promo.id), { isActive: !promo.isActive });
    } catch (err) {
      console.error(err);
    }
  };

  // Combining products and courses for specific_items selection
  const allItems = [
    ...products.map(p => ({ id: p.id, label: `(สินค้า) ${p['ชื่อสินค้า'] || p.col_2}` })),
    ...masterCourses.map(c => ({ id: c.id, label: `(คอร์ส) ${c['ชื่อคอส'] || c.col_4}` }))
  ];

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Tag className="text-indigo-500" /> จัดการโปรโมชั่น
          </h1>
          <button
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus size={18} /> เพิ่มโปรโมชั่น
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-800">
                <tr>
                  <th className="px-6 py-4 font-bold">ชื่อโปรโมชั่น</th>
                  <th className="px-6 py-4 font-bold">ประเภทส่วนลด</th>
                  <th className="px-6 py-4 font-bold">ขอบเขต</th>
                  <th className="px-6 py-4 font-bold text-center">สถานะ</th>
                  <th className="px-6 py-4 font-bold text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {promotions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                      ยังไม่มีโปรโมชั่นในระบบ
                    </td>
                  </tr>
                ) : (
                  promotions.map((promo) => (
                    <tr key={promo.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 text-base">{promo.name}</div>
                        {promo.description && <div className="text-xs text-slate-500">{promo.description}</div>}
                        {promo.minPurchaseAmount > 0 && (
                          <div className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded inline-block mt-1">
                            ยอดขั้นต่ำ {promo.minPurchaseAmount}฿
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {promo.type === 'discount_percent' && (
                          <span className="text-sky-600 bg-sky-50 px-2 py-1 rounded-md border border-sky-100 flex items-center w-fit gap-1">
                            <Percent size={14} /> ลด {promo.value}%
                          </span>
                        )}
                        {promo.type === 'discount_amount' && (
                          <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 flex items-center w-fit gap-1">
                            <BadgeDollarSign size={14} /> ลด {promo.value}฿
                          </span>
                        )}
                        {promo.type === 'buy_x_get_y' && (
                          <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded-md border border-orange-100 flex items-center w-fit gap-1">
                            <Tag size={14} /> ซื้อ {promo.value || 1} แถม {promo.getQty || 1}
                          </span>
                        )}
                        {promo.type === 'free_item' && (
                          <span className="text-pink-600 bg-pink-50 px-2 py-1 rounded-md border border-pink-100 flex items-center w-fit gap-1">
                            <Tag size={14} /> รับฟรี {promo.freeItemName} ({promo.freeItemQty || 1})
                          </span>
                        )}
                        {promo.type === 'discount_next_time' && (
                          <span className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 flex items-center w-fit gap-1">
                            <Tag size={14} /> ลดครั้งถัดไป {promo.discountNextType === 'percent' ? `${promo.discountNextValue}%` : `${promo.discountNextValue}฿`}
                          </span>
                        )}
                        
                        {promo.hasHappyHour && (
                          <div className="text-[10px] text-amber-600 mt-1">
                            Happy Hour: {promo.happyHourStart} - {promo.happyHourEnd}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {promo.scope === 'cart_total' ? (
                          <span className="text-slate-700 bg-slate-100 px-2 py-1 rounded-md">ทั้งตะกร้า</span>
                        ) : (
                          <span className="text-purple-700 bg-purple-100 px-2 py-1 rounded-md">เฉพาะสินค้าที่ร่วมรายการ ({promo.applicableItemIds?.length || 0})</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleActive(promo)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${promo.isActive ? 'bg-indigo-600' : 'bg-slate-300'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${promo.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleOpenModal(promo)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(promo.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
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
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Tag className="text-indigo-500" />
                  {editingPromotion ? 'แก้ไขโปรโมชั่น' : 'เพิ่มโปรโมชั่นใหม่'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                <form id="promoForm" onSubmit={handleSave} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-slate-700 mb-1">ชื่อโปรโมชั่น *</label>
                      <input 
                        type="text" 
                        required
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        placeholder="เช่น ซื้อครบ 5000 ลด 10%"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-slate-700 mb-1">รายละเอียด (ตัวเลือก)</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">ประเภทส่วนลด</label>
                      <select 
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                        value={formData.type}
                        onChange={e => {
                           const newType = e.target.value;
                           let newScope = formData.scope;
                           // Force specific_items for buy_x_get_y to make sense
                           if (newType === 'buy_x_get_y') newScope = 'specific_items';
                           setFormData({...formData, type: newType, scope: newScope});
                        }}
                      >
                        <option value="discount_percent">ส่วนลดเป็นเปอร์เซ็นต์ (%)</option>
                        <option value="discount_amount">ส่วนลดเงินสด (บาท)</option>
                        <option value="buy_x_get_y">ซื้อ X แถม Y (1 แถม 1)</option>
                        <option value="free_item">รับสินค้าฟรี</option>
                        <option value="discount_next_time">ส่วนลดครั้งถัดไป</option>
                      </select>
                    </div>

                    {(formData.type === 'discount_percent' || formData.type === 'discount_amount') && (
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">มูลค่าส่วนลด *</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            required
                            min="0"
                            step="0.01"
                            className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            value={formData.value}
                            onChange={e => setFormData({...formData, value: e.target.value})}
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                            {formData.type === 'discount_percent' ? '%' : '฿'}
                          </span>
                        </div>
                      </div>
                    )}

                    {formData.type === 'buy_x_get_y' && (
                      <>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">จำนวนที่ต้องซื้อ *</label>
                          <input 
                            type="number" required min="1"
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            value={formData.value}
                            onChange={e => setFormData({...formData, value: e.target.value})}
                            placeholder="เช่น 1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">จำนวนที่แถม *</label>
                          <input 
                            type="number" required min="1"
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            value={formData.getQty}
                            onChange={e => setFormData({...formData, getQty: e.target.value})}
                            placeholder="เช่น 1"
                          />
                        </div>
                      </>
                    )}

                    {formData.type === 'free_item' && (
                      <>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">ชื่อสินค้า/บริการ ที่แถมฟรี *</label>
                          <input 
                            type="text" required
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            value={formData.freeItemName}
                            onChange={e => setFormData({...formData, freeItemName: e.target.value})}
                            placeholder="เช่น มาร์คหน้าใส"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">จำนวนที่แถม *</label>
                          <input 
                            type="number" required min="1"
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            value={formData.freeItemQty}
                            onChange={e => setFormData({...formData, freeItemQty: e.target.value})}
                            placeholder="เช่น 1"
                          />
                        </div>
                      </>
                    )}

                    {formData.type === 'discount_next_time' && (
                      <>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">ประเภทส่วนลดครั้งถัดไป</label>
                          <select 
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                            value={formData.discountNextType}
                            onChange={e => setFormData({...formData, discountNextType: e.target.value})}
                          >
                            <option value="percent">เป็นเปอร์เซ็นต์ (%)</option>
                            <option value="amount">เป็นเงินสด (บาท)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">มูลค่าส่วนลดครั้งถัดไป *</label>
                          <input 
                            type="number" required min="1"
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            value={formData.discountNextValue}
                            onChange={e => setFormData({...formData, discountNextValue: e.target.value})}
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">ยอดซื้อขั้นต่ำ (บาท)</label>
                      <input 
                        type="number" 
                        min="0"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        value={formData.minPurchaseAmount}
                        onChange={e => setFormData({...formData, minPurchaseAmount: e.target.value})}
                        placeholder="ปล่อยว่างหากไม่มีขั้นต่ำ"
                      />
                    </div>
                    
                    <div className="md:col-span-2 border border-amber-200 bg-amber-50 rounded-xl p-4 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer mb-3">
                        <input 
                          type="checkbox"
                          className="rounded text-amber-500 focus:ring-amber-500 w-5 h-5"
                          checked={formData.hasHappyHour}
                          onChange={(e) => setFormData({...formData, hasHappyHour: e.target.checked})}
                        />
                        <span className="font-bold text-amber-700">จำกัดช่วงเวลาโปรโมชั่น (Happy Hour)</span>
                      </label>
                      
                      {formData.hasHappyHour && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-amber-700 mb-1">เวลาเริ่ม (เช่น 12:00)</label>
                            <input 
                              type="time" 
                              required={formData.hasHappyHour}
                              className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                              value={formData.happyHourStart}
                              onChange={e => setFormData({...formData, happyHourStart: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-amber-700 mb-1">เวลาสิ้นสุด (เช่น 15:00)</label>
                            <input 
                              type="time" 
                              required={formData.hasHappyHour}
                              className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                              value={formData.happyHourEnd}
                              onChange={e => setFormData({...formData, happyHourEnd: e.target.value})}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">ขอบเขตของโปรโมชั่น</label>
                      <select 
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                        value={formData.scope}
                        onChange={e => setFormData({...formData, scope: e.target.value, applicableItemIds: []})}
                      >
                        <option value="cart_total">ลดทั้งตะกร้า (ยอดรวม)</option>
                        <option value="specific_items">ลดเฉพาะสินค้า/คอร์ส ที่กำหนด</option>
                      </select>
                    </div>

                    {formData.scope === 'specific_items' && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-1">เลือกสินค้า/คอร์ส ที่ร่วมรายการ</label>
                        <div className="border border-slate-200 rounded-xl max-h-48 overflow-y-auto p-2 bg-slate-50">
                          {allItems.map(item => (
                            <label key={item.id} className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded cursor-pointer">
                              <input 
                                type="checkbox"
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                                checked={formData.applicableItemIds.includes(item.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData({...formData, applicableItemIds: [...formData.applicableItemIds, item.id]});
                                  } else {
                                    setFormData({...formData, applicableItemIds: formData.applicableItemIds.filter(id => id !== item.id)});
                                  }
                                }}
                              />
                              <span className="text-sm text-slate-700">{item.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
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
                  form="promoForm"
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
                >
                  <Save size={18} /> บันทึกโปรโมชั่น
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionManager;
