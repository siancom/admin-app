import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Edit2, Trash2, X, Save, Image as ImageIcon } from 'lucide-react';
import { addDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { getCol, getDocRef } from '../config/firebase';

const MarketingPromoManager = ({ showToast }) => {
  const [promos, setPromos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    desc: '',
    badge: '',
    image: '',
    isActive: true
  });

  useEffect(() => {
    const unsub = onSnapshot(getCol('marketing_promotions'), (snap) => {
      setPromos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleOpenModal = (promo = null) => {
    if (promo) {
      setFormData({
        title: promo.title || '',
        desc: promo.desc || '',
        badge: promo.badge || '',
        image: promo.image || '',
        isActive: promo.isActive ?? true
      });
      setEditingPromo(promo);
    } else {
      setFormData({
        title: '',
        desc: '',
        badge: '',
        image: '',
        isActive: true
      });
      setEditingPromo(null);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.image) {
      showToast('กรุณากรอกชื่อหัวข้อและลิงก์รูปภาพ');
      return;
    }

    try {
      const dataToSave = {
        title: formData.title,
        desc: formData.desc,
        badge: formData.badge,
        image: formData.image,
        isActive: formData.isActive,
        updatedAt: new Date().toISOString()
      };

      if (editingPromo) {
        await updateDoc(getDocRef('marketing_promotions', editingPromo.id), dataToSave);
        showToast('อัปเดตแบนเนอร์สำเร็จ');
      } else {
        await addDoc(getCol('marketing_promotions'), {
          ...dataToSave,
          createdAt: new Date().toISOString()
        });
        showToast('เพิ่มแบนเนอร์สำเร็จ');
      }
      setIsModalOpen(false);
    } catch (err) {
      showToast('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบแบนเนอร์นี้?')) {
      try {
        await deleteDoc(getDocRef('marketing_promotions', id));
        showToast('ลบแบนเนอร์สำเร็จ');
      } catch (err) {
        showToast('ลบไม่สำเร็จ: ' + err.message);
      }
    }
  };

  const handleToggleActive = async (promo) => {
    try {
      await updateDoc(getDocRef('marketing_promotions', promo.id), { isActive: !promo.isActive });
    } catch (err) {
      showToast('เกิดข้อผิดพลาด');
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="text-teal-500" /> แบนเนอร์สิทธิพิเศษ
          </h1>
          <button
            onClick={() => handleOpenModal()}
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus size={18} /> เพิ่มแบนเนอร์
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promos.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
                    ยังไม่มีแบนเนอร์ในระบบ
                </div>
            ) : (
                promos.map(promo => (
                    <div key={promo.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${!promo.isActive ? 'opacity-60 border-slate-200' : 'border-teal-100'}`}>
                        <div className="h-40 w-full bg-slate-100 relative">
                            {promo.image ? (
                                <img src={promo.image} alt={promo.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-400"><ImageIcon size={32}/></div>
                            )}
                            {promo.badge && (
                                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-teal-600 text-xs font-black px-2 py-1 rounded-lg shadow-sm">
                                    {promo.badge}
                                </div>
                            )}
                            <button
                                onClick={() => handleToggleActive(promo)}
                                className={`absolute top-3 right-3 inline-flex h-6 w-11 items-center rounded-full transition-colors shadow-md ${promo.isActive ? 'bg-teal-500' : 'bg-slate-300'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${promo.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-slate-800 line-clamp-1 mb-1">{promo.title}</h3>
                            <p className="text-xs text-slate-500 line-clamp-2 mb-4 h-8">{promo.desc}</p>
                            <div className="flex gap-2">
                                <button onClick={() => handleOpenModal(promo)} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold flex justify-center items-center gap-1 transition-colors">
                                    <Edit2 size={16} /> แก้ไข
                                </button>
                                <button onClick={() => handleDelete(promo.id)} className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-sm font-bold flex justify-center items-center gap-1 transition-colors">
                                    <Trash2 size={16} /> ลบ
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
              <div className="flex justify-between items-center p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="text-teal-500" />
                  {editingPromo ? 'แก้ไขแบนเนอร์' : 'เพิ่มแบนเนอร์ใหม่'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                <form id="promoForm" onSubmit={handleSave} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">ลิงก์รูปภาพ (Image URL) *</label>
                    <input 
                      type="url" 
                      required
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                      value={formData.image}
                      onChange={e => setFormData({...formData, image: e.target.value})}
                      placeholder="https://..."
                    />
                    {formData.image && (
                        <div className="mt-2 h-32 rounded-xl overflow-hidden border border-slate-200">
                            <img src={formData.image} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.target.src = 'https://via.placeholder.com/400x200?text=Invalid+Image+URL'} />
                        </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">หัวข้อ (Title) *</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      placeholder="เช่น ลด 50% เลเซอร์ทุกจุด"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">รายละเอียด (Description)</label>
                    <textarea 
                      rows="3"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none"
                      value={formData.desc}
                      onChange={e => setFormData({...formData, desc: e.target.value})}
                      placeholder="อธิบายรายละเอียดโปรโมชั่น..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">ป้ายกำกับ (Badge)</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                      value={formData.badge}
                      onChange={e => setFormData({...formData, badge: e.target.value})}
                      placeholder="เช่น เดือนเกิด, Hot Promotion"
                    />
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
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-sm flex items-center gap-2"
                >
                  <Save size={18} /> บันทึก
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketingPromoManager;
