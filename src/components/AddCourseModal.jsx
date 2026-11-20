import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Type, Hash, Banknote, Monitor, Package, Clock, Layers, CreditCard, Wallet, Plus, Search, X, Check, Image as ImageIcon, Upload, Trash2, Loader2, Edit3 } from 'lucide-react';
import ModalWrapper from './ModalWrapper';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import { compressImage } from '../utils/parse';
import { getFuzzyKey } from '../utils/fuzzy';

const InputField = ({ icon: Icon, label, required, ...props }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
      <Icon size={14} className="text-pink-500" />
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
    {props.type === 'textarea' ? (
      <textarea 
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all min-h-[80px]"
        {...props}
      />
    ) : (
      <input 
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
        {...props}
      />
    )}
  </div>
);

const SearchableSelector = ({ icon: Icon, label, items, selectedItems, onAdd, onRemove, placeholder, renderItem }) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredItems = useMemo(() => {
    if (!search) return items.slice(0, 50);
    const lowerSearch = search.toLowerCase();
    return items.filter(item => renderItem(item).toLowerCase().includes(lowerSearch)).slice(0, 50);
  }, [items, search, renderItem]);

  return (
    <div className="flex flex-col gap-1.5" ref={wrapperRef}>
      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
        <Icon size={14} className="text-pink-500" />
        {label}
      </label>
      
      {/* Selected Items Chips */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-1">
          {selectedItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1 bg-pink-50 border border-pink-200 text-pink-700 px-2 py-1 rounded-lg text-xs font-medium">
              <span className="max-w-[150px] truncate">{item.name}</span>
              <span className="text-pink-500">x{item.qty}</span>
              <button type="button" onClick={() => onRemove(idx)} className="hover:text-pink-900 ml-1">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={14} className="text-slate-400" />
        </div>
        <input 
          type="text" 
          value={search}
          onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-800 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
        />
        
        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="p-3 text-sm text-slate-500 text-center">ไม่พบข้อมูล</div>
            ) : (
              filteredItems.map((item, idx) => {
                const itemName = renderItem(item);
                return (
                  <div key={idx} className="flex items-center justify-between p-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0" onClick={() => {
                    const qty = window.prompt(`ระบุจำนวนของ: ${itemName}`, "1");
                    if (qty && !isNaN(qty) && parseInt(qty) > 0) {
                      onAdd({ name: itemName, qty: parseInt(qty) });
                      setSearch('');
                      setIsOpen(false);
                    }
                  }}>
                    <span className="text-sm text-slate-700 truncate">{itemName}</span>
                    <Plus size={14} className="text-pink-500" />
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default function AddCourseModal({ isOpen, onClose, onAdd, products = [], masterCourses = [], initialData = null }) {
  const isEditMode = !!initialData;
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'ทั่วไป',
    price: '',
    sessions: '',
    duration: '',
    credit: '',
    freeVip: false,
    image: ''
  });
  
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedSubCourses, setSelectedSubCourses] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const categories = ['ผิวหน้า (A-J)', 'เคลียร์สิว', 'ลงเครื่อง', 'รักษาสิว/ฝ้า', 'บำรุงฟื้นฟู', 'IPL กำจัดขน', 'ทั่วไป'];
  const durations = ['1 เดือน', '2 เดือน', '3 เดือน', '6 เดือน', '1 ปี', 'ไม่มีกำหนด'];

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          code: String(getFuzzyKey(initialData, ["รหัสคอส", "col_1"]) || initialData.code || ''),
          name: String(getFuzzyKey(initialData, ["ชื่อคอส", "col_4"]) || initialData.name || ''),
          category: String(getFuzzyKey(initialData, ["ประเภท", "col_2"]) || initialData.category || 'ทั่วไป'),
          price: String(getFuzzyKey(initialData, ["ราคาขาย", "ราคา", "col_5", "col_6"]) || initialData.price || ''),
          sessions: String(getFuzzyKey(initialData, ["จำนวนครั้ง", "col_7"]) || initialData.sessions || ''),
          duration: String(getFuzzyKey(initialData, ["กำหนดเวลา"]) || initialData.duration || ''),
          credit: String(getFuzzyKey(initialData, ["เครดิตที่ได้รับ", "col_8"]) || initialData.credit || ''),
          freeVip: String(getFuzzyKey(initialData, ["ฟรีบัตรสมาชิก"])) === 'ใช่' || initialData.freeVip === true,
          image: String(getFuzzyKey(initialData, ["รูปภาพ", "รูป", "image", "img", "col_13"]) || initialData.image || '')
        });

        // Parse existing items
        const rawItems = String(getFuzzyKey(initialData, ["รายการที่ได้รับ", "col_11"]) || '');
        if (rawItems) {
          const prods = [];
          const courses = [];
          rawItems.split('\n').forEach(line => {
            const trimmed = line.trim();
            const prodMatch = trimmed.match(/^-\s*(.+?)\s*\((\d+)\s*ชิ้น\)$/);
            if (prodMatch) prods.push({ name: prodMatch[1], qty: parseInt(prodMatch[2], 10) });
            const courseMatch = trimmed.match(/^-\s*(.+?)\s*\((\d+)\s*ครั้ง\)$/);
            if (courseMatch) courses.push({ name: courseMatch[1], qty: parseInt(courseMatch[2], 10) });
          });
          setSelectedProducts(prods);
          setSelectedSubCourses(courses);
        } else {
          setSelectedProducts([]);
          setSelectedSubCourses([]);
        }
      } else {
        setFormData({
          code: `PROMO-${Date.now().toString().slice(-6)}`,
          name: '',
          category: 'ทั่วไป',
          price: '',
          sessions: '',
          duration: '',
          credit: '',
          freeVip: false,
          image: ''
        });
        setSelectedProducts([]);
        setSelectedSubCourses([]);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WebP)');
      return;
    }
    setIsUploadingImage(true);
    try {
      const compressedBlob = await compressImage(file, 1200, 1200, 0.85);
      const storageRef = ref(storage, `master_courses/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, compressedBlob);
      const url = await getDownloadURL(storageRef);
      setFormData(prev => ({ ...prev, image: url }));
    } catch (err) {
      console.error('Upload Error:', err);
      alert('อัปโหลดรูปภาพไม่สำเร็จ: ' + err.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.price) {
      alert("กรุณากรอกรหัสคอร์ส, ชื่อคอร์ส และราคาให้ครบถ้วน");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const formattedProducts = selectedProducts.map(p => `- ${p.name} (${p.qty} ชิ้น)`).join('\n');
      const formattedSubCourses = selectedSubCourses.map(c => `- ${c.name} (${c.qty} ครั้ง)`).join('\n');

      await onAdd({
        ...formData,
        products: formattedProducts,
        subCourses: formattedSubCourses,
      }, initialData?.id || null);
      
      setFormData({
        code: `PROMO-${Date.now().toString().slice(-6)}`,
        name: '',
        category: 'ทั่วไป',
        price: '',
        sessions: '',
        duration: '',
        credit: '',
        freeVip: false,
        image: ''
      });
      setSelectedProducts([]);
      setSelectedSubCourses([]);
      onClose();
    } catch (error) {
      console.error(error);
      alert("ข้อผิดพลาดในการบันทึกคอร์ส: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalWrapper 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isEditMode ? "แก้ไขคอร์สโปรโมชั่น" : "เพิ่มคอร์สโปรโมชั่นใหม่"} 
      icon={isEditMode ? Edit3 : Plus} 
      colorClass="bg-pink-100 text-pink-600"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 🌟 รูปภาพคอร์สโปรโมชั่น (สำหรับแสดงฝั่งลูกค้าให้กดซื้อได้) 🌟 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ImageIcon size={14} className="text-pink-500" />
              รูปภาพคอร์สโปรโมชั่น (แสดงฝั่งลูกค้าในหน้า Shop ให้กดซื้อได้เลย)
            </span>
            {formData.image && (
              <button 
                type="button" 
                onClick={() => setFormData({ ...formData, image: '' })}
                className="text-[11px] text-red-500 hover:text-red-700 flex items-center gap-1 font-bold"
              >
                <Trash2 size={12} /> ลบรูปภาพ
              </button>
            )}
          </label>
          
          {formData.image ? (
            <div className="relative rounded-2xl overflow-hidden border-2 border-pink-200 bg-pink-50/30 group aspect-[3/4] max-h-64 mx-auto flex items-center justify-center">
              <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <label className="bg-white/95 hover:bg-white text-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer shadow-lg flex items-center gap-1.5 transition-all active:scale-95">
                  <Upload size={14} className="text-pink-600" /> เปลี่ยนรูปภาพ
                  <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" disabled={isUploadingImage} />
                </label>
                <button 
                  type="button" 
                  onClick={() => setFormData({ ...formData, image: '' })}
                  className="bg-red-500 hover:bg-red-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Trash2 size={14} /> ลบ
                </button>
              </div>
            </div>
          ) : (
            <label className="border-2 border-dashed border-slate-300 hover:border-pink-400 bg-slate-50 hover:bg-pink-50/30 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all group">
              {isUploadingImage ? (
                <div className="flex flex-col items-center gap-2 text-pink-600 py-3">
                  <Loader2 size={28} className="animate-spin" />
                  <span className="text-xs font-bold">กำลังอัปโหลดรูปภาพ...</span>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-sm">
                    <Upload size={22} />
                  </div>
                  <span className="text-xs font-bold text-slate-700">คลิกเพื่ออัปโหลดรูปโปรโมชั่น</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">ไฟล์ JPG, PNG, WebP (บีบอัดอัตโนมัติ โหลดไว)</span>
                  <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" disabled={isUploadingImage} />
                </>
              )}
            </label>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField 
            icon={Hash} label="รหัสคอร์ส" required 
            value={formData.code} disabled={!isEditMode && formData.code.startsWith('PROMO-')}
            onChange={e => setFormData({...formData, code: e.target.value})}
            placeholder="ตัวอย่าง: F-A1, PROMO-016970"
          />
          <InputField 
            icon={Type} label="ชื่อคอร์ส" required 
            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
          />
          
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Layers size={14} className="text-pink-500" />
              หมวดหมู่คอร์ส
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFormData({...formData, category: cat})}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${formData.category === cat ? 'bg-pink-500 text-white border-pink-500 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <InputField 
            icon={Banknote} label="ราคาขาย (บาท)" type="number" required 
            value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} 
          />
          <InputField 
            icon={Wallet} label="เครดิตที่ได้รับ (บาท)" type="number" 
            value={formData.credit} onChange={e => setFormData({...formData, credit: e.target.value})} 
          />
          <InputField 
            icon={Monitor} label="จำนวนครั้งการลงเครื่อง" type="number" 
            value={formData.sessions} onChange={e => setFormData({...formData, sessions: e.target.value})} 
          />
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Clock size={14} className="text-pink-500" />
              กำหนดเวลา
            </label>
            <div className="flex flex-wrap gap-2">
              {durations.map(dur => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => setFormData({...formData, duration: dur})}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${formData.duration === dur ? 'bg-pink-500 text-white border-pink-500 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                  {dur}
                </button>
              ))}
            </div>
          </div>
        </div>

        <SearchableSelector
          icon={Package}
          label="ระบุสินค้าที่ได้"
          placeholder="ค้นหาสินค้า..."
          items={products}
          selectedItems={selectedProducts}
          onAdd={(item) => setSelectedProducts([...selectedProducts, item])}
          onRemove={(idx) => setSelectedProducts(selectedProducts.filter((_, i) => i !== idx))}
          renderItem={(item) => String(item["ชื่อสินค้า"] || item.col_2 || 'ไม่ระบุชื่อ')}
        />

        <SearchableSelector
          icon={Layers}
          label="ระบุคอร์สย่อย / คอร์สเสริม"
          placeholder="ค้นหาคอร์ส..."
          items={masterCourses}
          selectedItems={selectedSubCourses}
          onAdd={(item) => setSelectedSubCourses([...selectedSubCourses, item])}
          onRemove={(idx) => setSelectedSubCourses(selectedSubCourses.filter((_, i) => i !== idx))}
          renderItem={(item) => String(item["ชื่อคอส"] || item.col_4 || 'ไม่ระบุชื่อ')}
        />

        <div className="flex items-center gap-3 p-4 border border-pink-200 bg-pink-50 rounded-xl cursor-pointer hover:bg-pink-100 transition-colors" onClick={() => setFormData({...formData, freeVip: !formData.freeVip})}>
          <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all ${formData.freeVip ? 'bg-pink-500 text-white' : 'bg-white border-2 border-pink-300'}`}>
            {formData.freeVip && <Check size={14} />}
          </div>
          <div className="flex-1">
            <span className="text-sm font-bold text-pink-900 flex items-center gap-1.5">
              <CreditCard size={16} className="text-pink-500" />
              แถมฟรีบัตรสมาชิก (VIP Card)
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-all">ยกเลิก</button>
          <button type="submit" disabled={isSubmitting || isUploadingImage} className="px-6 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-bold shadow-sm shadow-pink-500/30 transition-all flex items-center gap-2">
            {isSubmitting ? 'กำลังบันทึก...' : isEditMode ? 'บันทึกการแก้ไข' : 'บันทึกคอร์สใหม่'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}
