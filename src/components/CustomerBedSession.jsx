import React, { useState, useEffect } from 'react';
import { ShoppingCart, CheckCircle, CreditCard, Camera, User, Check } from 'lucide-react';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db, storage } from '../config/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { getFuzzyKey } from '../utils/fuzzy';
import { parseNumber } from '../utils/parse';

export default function CustomerBedSession({ 
  bedNumber, 
  branch, 
  products, 
  masterCourses, 
  bookings, 
  orders,
  showToast 
}) {
  const [activeBooking, setActiveBooking] = useState(null);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [slipImage, setSlipImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Self-Service Shopping States
  const [customerCart, setCustomerCart] = useState([]);
  const [activeTab, setActiveTab] = useState('products');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [viewItemDetails, setViewItemDetails] = useState(null);
  const [viewItemType, setViewItemType] = useState('');

  const getProductImage = (p, productName) => {
    return getFuzzyKey(p, ["รูปภาพ", "ภาพ", "img", "image"]);
  };

  useEffect(() => {
    // Find active booking for this bed
    const bedStr = String(bedNumber).trim();
    const branchStr = String(branch).trim();
    const active = bookings.find(b => 
      String(b.branch).trim() === branchStr && 
      (String(b.bedNumber).trim() === bedStr || String(b.assignedBed).trim() === bedStr) &&
      (String(b.status).trim() === 'กำลังใช้บริการ' || String(b.status).trim() === 'รอการยืนยัน')
    );
    setActiveBooking(active);
  }, [bedNumber, branch, bookings]);

  useEffect(() => {
    // Find parked order for this bed
    const bedStr = String(bedNumber).trim();
    const branchStr = String(branch).trim();
    const pending = orders.find(o => 
      String(o.bedNumber).trim() === bedStr && 
      (!o.branch || String(o.branch).trim() === branchStr || String(o.branch).trim() === 'เฉวง') &&
      String(o.status).trim() === 'รอชำระเงิน' && 
      String(o.source).trim() === 'POS_Parked'
    );
    setPendingOrder(pending);
  }, [bedNumber, branch, orders]);

  const handleSlipUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSlipImage(file);
    }
  };

  const handleCheckout = async () => {
    // Determine if we are paying a parked order or a self-service cart
    const isPayingParkedOrder = !!pendingOrder;
    const cartToProcess = isPayingParkedOrder ? pendingOrder.cartItems : customerCart;
    const totalAmount = isPayingParkedOrder ? Number(pendingOrder.price) : customerCart.reduce((sum, item) => sum + (Number(item.price) * item.qty), 0);
    
    if (cartToProcess?.length === 0) return showToast('ไม่มีสินค้าในตะกร้า', 'error');
    if (!slipImage) return showToast('กรุณาแนบสลิปโอนเงิน', 'error');

    setIsUploading(true);
    try {
      // Compress slip image
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1024, useWebWorker: true };
      let compressedFile = slipImage;
      try {
        compressedFile = await imageCompression(slipImage, options);
      } catch (error) {
        console.error("Image compression failed", error);
      }

      // Upload slip
      const timestamp = Date.now();
      const storageRef = ref(storage, `slips/bed_self_service_${timestamp}`);
      const uploadTask = await uploadBytesResumable(storageRef, compressedFile);
      const slipUrl = await getDownloadURL(uploadTask.ref);

      if (isPayingParkedOrder) {
        // Update existing parked order
        await updateDoc(doc(db, 'orders', pendingOrder.id), {
          status: 'รอตรวจสอบ',
          slipUrl,
          updatedAt: new Date().toISOString()
        });
      } else {
        // Create NEW order from Self-Service Cart
        const orderNo = `OD${Date.now().toString().slice(-6)}`;
        const orderItems = customerCart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          qty: item.qty,
          type: item.type
        }));
        
        await addDoc(collection(db, 'orders'), {
          orderNo,
          customerName: activeBooking ? activeBooking.customerName : 'ลูกค้าทั่วไป',
          customerPhone: activeBooking ? (activeBooking.phone || '') : '',
          bedNumber: String(bedNumber),
          branch: branch || 'เฉวง',
          source: 'Customer_Self_Service',
          status: 'รอตรวจสอบ',
          price: totalAmount,
          totalCost: 0,
          paymentMethod: 'โอนเงิน',
          slipUrl,
          cartItems: orderItems,
          createdAt: new Date().toISOString(),
          courseName: orderItems.map(i => `${i.name} x${i.qty}`).join(', ')
        });
      }
      
      showToast('ชำระเงินสำเร็จ! รอพนักงานตรวจสอบสักครู่ครับ', 'success');
      setSlipImage(null);
      setCustomerCart([]);
      setIsCartOpen(false);
      setIsSuccess(true);
    } catch (error) {
      console.error(error);
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    }
    setIsUploading(false);
  };
  
  const handleAddToCart = (item, type) => {
    setCustomerCart(prev => {
      const existing = prev.find(p => p.id === item.id);
      if (existing) {
        return prev.map(p => p.id === item.id ? { ...p, qty: p.qty + 1 } : p);
      }
      return [...prev, { ...item, type, qty: 1 }];
    });
    showToast(`เพิ่ม ${item.name} ลงตะกร้าแล้ว`);
  };

  const updateCartQty = (id, delta) => {
    setCustomerCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }).filter(item => item.qty > 0));
  };
  
  const getProductCategory = (p) => String(getFuzzyKey(p, ["หมวดหมู่", "ประเภท", "category"]) || 'อื่นๆ').trim();
  const allCategories = ['ทั้งหมด', ...new Set(products.map(getProductCategory))].filter(Boolean);

  const filteredProducts = products.filter(p => {
    const matchSearch = String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2", "name", "ชื่อ"]) || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = selectedCategory === 'ทั้งหมด' || getProductCategory(p) === selectedCategory;
    return matchSearch && matchCat;
  });
  
  const filteredCourses = masterCourses.filter(c => 
    String(getFuzzyKey(c, ["ชื่อคอส", "ชื่อคอร์ส", "col_4", "name"]) || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const cartTotal = customerCart.reduce((sum, item) => sum + (Number(item.price) * item.qty), 0);

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-4 font-sans max-w-md mx-auto shadow-xl">
        <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-100 max-w-sm w-full">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={40} strokeWidth={3} />
          </div>
          <h2 className="text-2xl font-black mb-2 text-slate-800">ชำระเงินเรียบร้อย</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">ขอบคุณที่ใช้บริการค่ะ<br/>พนักงานกำลังตรวจสอบยอดเงิน กรุณารอสักครู่</p>
          <button 
            onClick={() => setIsSuccess(false)}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
          >
            กลับสู่หน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans max-w-md mx-auto shadow-xl">
      <div className="bg-indigo-600 text-white p-6 rounded-b-3xl shadow-md">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-black mb-1">สวัสดีค่ะ 🙏</h1>
            <p className="text-indigo-100 text-sm">บริการสั่งซื้อสินค้าที่เตียง</p>
          </div>
          <div className="bg-white/20 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm">
            {branch} • เตียง {bedNumber}
          </div>
        </div>
        
        {activeBooking ? (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <User size={20} className="text-white" />
              </div>
              <div>
                <div className="text-xs text-indigo-100">กำลังรับบริการ</div>
                <div className="font-bold">{activeBooking.customerName}</div>
              </div>
            </div>
            <div className="text-sm bg-black/20 p-2 rounded-lg line-clamp-2">
              <span className="opacity-80">รายการ:</span> {activeBooking.courseName}
            </div>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center text-sm">
            ไม่มีรายการรับบริการของท่านในขณะนี้
          </div>
        )}
      </div>

      <div className="flex-1 p-4 overflow-y-auto pb-24">
        {!pendingOrder ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
             <div className="flex border-b border-slate-100">
               <button 
                 onClick={() => setActiveTab('products')} 
                 className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'products' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
               >
                 สินค้า
               </button>
               <button 
                 onClick={() => setActiveTab('courses')} 
                 className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'courses' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
               >
                 คอร์สโปรโมชั่น
               </button>
             </div>
             
             <div className="p-3 bg-slate-50 border-b border-slate-100 sticky top-0 z-10 space-y-3 shadow-[0_4px_10px_-10px_rgba(0,0,0,0.1)]">
               <div className="relative">
                 <input 
                   type="text" 
                   placeholder="ค้นหาสินค้า..." 
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                   className="w-full pl-10 pr-4 py-2.5 rounded-full border-none bg-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium"
                 />
                 <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                 </div>
               </div>

               {activeTab === 'products' && (
                 <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                   {allCategories.map(cat => (
                     <button
                       key={cat}
                       onClick={() => setSelectedCategory(cat)}
                       className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-sm border ${selectedCategory === cat ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                     >
                       {cat}
                     </button>
                   ))}
                 </div>
               )}
             </div>

             <div className="p-3 bg-slate-50 min-h-[500px]">
               {activeTab === 'products' && (
                 <>
                   <div className="flex items-center gap-2 mb-3 px-1">
                     <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                       <ShoppingCart size={14} />
                     </div>
                     <h3 className="font-bold text-slate-800">สินค้าทั้งหมด</h3>
                   </div>
                   <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                     {filteredProducts.map((p, idx) => {
                       const name = String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2", "name", "ชื่อ"]) || '-');
                       const price = parseNumber(getFuzzyKey(p, ["ราคาขาย"]) || 0);
                       const image = getFuzzyKey(p, ["รูปภาพ", "ภาพ", "img", "image"]);
                       return (
                         <div key={`p-${idx}`} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col relative transition-transform hover:-translate-y-1 hover:shadow-md">
                           <div className="relative aspect-[4/3] bg-slate-50/50 p-2 border-b border-slate-50 cursor-pointer" onClick={() => { setViewItemDetails(p); setViewItemType('product'); }}>
                              {image ? <img src={image} className="w-full h-full object-contain mix-blend-multiply" alt={name}/> : <div className="w-full h-full flex items-center justify-center text-slate-300 text-[10px] font-bold">ไม่มีรูป</div>}
                           </div>
                           <div className="p-3 flex flex-col flex-1">
                             <h4 className="font-bold text-slate-700 text-[11px] sm:text-xs line-clamp-2 leading-tight mb-2 flex-1 text-center h-8">{name}</h4>
                             <div className="font-black text-indigo-600 text-center mb-3 text-sm">฿{price.toLocaleString()}</div>
                             <button onClick={() => handleAddToCart({ id: p.id, name, price, image }, 'product')} className="w-10 h-10 mx-auto rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white active:scale-95 transition-colors absolute -bottom-1 -right-1 rounded-tl-2xl rounded-br-none rounded-tr-none rounded-bl-none shadow-sm">
                               <ShoppingCart size={16} />
                             </button>
                           </div>
                         </div>
                       )
                     })}
                   </div>
                 </>
               )}
               {activeTab === 'courses' && (
                 <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                   {filteredCourses.map((c, idx) => {
                     const name = String(getFuzzyKey(c, ["ชื่อคอส", "ชื่อคอร์ส", "col_4", "name"]) || '-');
                     const price = parseNumber(getFuzzyKey(c, ["ราคาขาย"]) || 0);
                     const image = getFuzzyKey(c, ["รูปภาพ", "ภาพ", "img", "image"]);
                     return (
                       <div key={`c-${idx}`} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col relative transition-transform hover:-translate-y-1 hover:shadow-md">
                         <div className="relative aspect-[4/3] bg-slate-50/50 p-2 border-b border-slate-50">
                            {image ? <img src={image} className="w-full h-full object-contain mix-blend-multiply" alt={name}/> : <div className="w-full h-full flex items-center justify-center text-slate-300 text-[10px] font-bold">ไม่มีรูป</div>}
                         </div>
                         <div className="p-3 flex flex-col flex-1">
                           <h4 className="font-bold text-slate-700 text-[11px] sm:text-xs line-clamp-2 leading-tight mb-2 flex-1 text-center h-8">{name}</h4>
                           <div className="font-black text-indigo-600 text-center mb-3 text-sm">฿{price.toLocaleString()}</div>
                           <button onClick={() => handleAddToCart({ id: c.id, name, price, image }, 'course')} className="w-full py-1.5 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white active:scale-95 transition-colors text-xs font-bold gap-1 shadow-sm">
                             <ShoppingCart size={14} /> เพิ่ม
                           </button>
                         </div>
                       </div>
                     )
                   })}
                   {filteredCourses.length === 0 && (
                     <div className="col-span-full text-center py-12 text-slate-400 text-sm font-bold">ไม่พบคอร์ส/บริการ</div>
                   )}
                 </div>
               )}
               
               {activeTab === 'products' && filteredProducts.length === 0 && (
                 <div className="text-center py-12 text-slate-400 text-sm font-bold">ไม่พบสินค้า</div>
               )}
             </div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4">
              <h2 className="font-bold text-lg mb-3 flex items-center gap-2 text-indigo-600">
                <ShoppingCart size={20}/> รายการรอชำระเงิน
              </h2>
              <div className="mb-2 text-xs text-slate-500">หมายเลขบิล: {pendingOrder.orderNo}</div>
              {pendingOrder.cartItems?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0 text-sm">
                  <div className="flex-1 pr-2">
                    <div className="font-semibold line-clamp-1 text-slate-800">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.qty} x ฿{Number(item.price).toLocaleString()}</div>
                  </div>
                  <div className="font-bold text-indigo-600 shrink-0">
                    ฿{(Number(item.price) * Number(item.qty)).toLocaleString()}
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 font-black text-lg">
                <span>ยอดรวมทั้งสิ้น</span>
                <span className="text-indigo-600">฿{Number(pendingOrder.price).toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center mb-8">
              <h2 className="font-bold text-lg mb-2 text-slate-800">แสกน QR Code เพื่อโอนเงิน</h2>
              <img src="https://promptpay.io/0812345678.png" alt="PromptPay" className="w-48 h-48 mx-auto mb-3 opacity-50 border border-slate-100 rounded-xl p-2" />
              <p className="text-xs text-slate-500 mb-4">*จำลองภาพ QR Code</p>
              
              <label className={`block w-full cursor-pointer border-2 border-dashed rounded-xl p-6 transition-all ${slipImage ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 hover:bg-slate-100 border-indigo-200 hover:border-indigo-400'}`}>
                <input type="file" accept="image/*" className="hidden" onChange={handleSlipUpload} />
                {slipImage ? (
                  <div className="flex flex-col items-center">
                    <CheckCircle className="text-emerald-500 mb-2" size={32} />
                    <span className="font-bold text-emerald-700 text-sm line-clamp-1">{slipImage.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-indigo-600">
                    <Camera size={32} className="mb-2" />
                    <span className="font-bold text-sm">อัปโหลดสลิปโอนเงิน</span>
                  </div>
                )}
              </label>
            </div>
          </>
        )}
      </div>

      {pendingOrder && !isCartOpen && (
        <div className="p-4 bg-white border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] sticky bottom-0">
          <button 
            onClick={handleCheckout} 
            disabled={isUploading || !slipImage}
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
          >
            {isUploading ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> : <CreditCard size={20} />}
            {isUploading ? 'กำลังบันทึก...' : 'ยืนยันการชำระเงิน'}
          </button>
        </div>
      )}
      
      {!pendingOrder && customerCart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto">
          <button 
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-indigo-600 text-white p-4 rounded-2xl shadow-[0_10px_25px_rgba(79,70,229,0.3)] flex items-center justify-between hover:bg-indigo-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart size={24} />
                <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-indigo-600">
                  {customerCart.reduce((sum, item) => sum + item.qty, 0)}
                </div>
              </div>
              <span className="font-bold text-sm">ดูตะกร้าสินค้า</span>
            </div>
            <div className="font-black text-lg">฿{cartTotal.toLocaleString()}</div>
          </button>
        </div>
      )}
      
      {/* Cart Modal for Self-Service */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-center items-end animate-in fade-in max-w-md mx-auto">
          <div className="bg-white w-full rounded-t-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-full">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <ShoppingCart size={24} className="text-indigo-600"/> ตะกร้าของฉัน
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3 mb-6">
                {customerCart.map(item => (
                  <div key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                     <div className="flex-1 min-w-0 pr-3">
                        <div className="font-bold text-sm text-slate-800 line-clamp-2 leading-tight">{item.name}</div>
                        <div className="text-indigo-600 font-black text-sm mt-1">฿{Number(item.price).toLocaleString()}</div>
                     </div>
                     <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-1 shrink-0">
                        <button onClick={() => updateCartQty(item.id, -1)} className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 font-bold text-slate-600">-</button>
                        <span className="font-black text-slate-800 text-sm w-4 text-center">{item.qty}</span>
                        <button onClick={() => updateCartQty(item.id, 1)} className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 font-bold text-slate-600">+</button>
                     </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-6">
                 <div className="flex justify-between items-center font-black text-lg text-slate-800 mb-2">
                   <span>ยอดรวมที่ต้องชำระ</span>
                   <span className="text-indigo-700">฿{cartTotal.toLocaleString()}</span>
                 </div>
                 <div className="text-xs text-indigo-500 text-right">รวมภาษีมูลค่าเพิ่มแล้ว</div>
              </div>
              
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center mb-4">
                <h2 className="font-bold text-slate-800 mb-2 text-sm">แสกน QR Code เพื่อโอนเงิน</h2>
                <img src="https://promptpay.io/0812345678.png" alt="PromptPay" className="w-32 h-32 mx-auto mb-3 opacity-50 border border-slate-100 rounded-xl p-2" />
                
                <label className={`block w-full cursor-pointer border-2 border-dashed rounded-xl p-4 transition-all ${slipImage ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 hover:bg-slate-100 border-indigo-200 hover:border-indigo-400'}`}>
                  <input type="file" accept="image/*" className="hidden" onChange={handleSlipUpload} />
                  {slipImage ? (
                    <div className="flex flex-col items-center">
                      <CheckCircle className="text-emerald-500 mb-1" size={24} />
                      <span className="font-bold text-emerald-700 text-xs line-clamp-1">{slipImage.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-indigo-600">
                      <Camera size={24} className="mb-1" />
                      <span className="font-bold text-xs">อัปโหลดสลิปโอนเงิน</span>
                    </div>
                  )}
                </label>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-white shrink-0">
               <button 
                 onClick={handleCheckout} 
                 disabled={isUploading || !slipImage || customerCart.length === 0}
                 className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
               >
                 {isUploading ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> : <CreditCard size={20} />}
                 {isUploading ? 'กำลังบันทึก...' : `ชำระเงิน ฿${cartTotal.toLocaleString()}`}
               </button>
            </div>
          </div>
        </div>
      )}
      {/* Item Details Modal */}
      {viewItemDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViewItemDetails(null)}></div>
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <button onClick={() => setViewItemDetails(null)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 z-20">✕</button>
            
            <div className="flex-1 overflow-y-auto hide-scrollbar">
              {viewItemType === 'product' ? (() => {
                const name = String(getFuzzyKey(viewItemDetails, ["ชื่อสินค้า", "col_2", "name", "ชื่อ"]) || '-');
                const price = parseNumber(getFuzzyKey(viewItemDetails, ["ราคาขาย"]) || 0);
                const image = getFuzzyKey(viewItemDetails, ["รูปภาพ", "ภาพ", "img", "image"]);
                const desc = getFuzzyKey(viewItemDetails, ["รายละเอียด", "col_8", "desc"]);
                const cat = getFuzzyKey(viewItemDetails, ["หมวดหมู่", "ประเภท", "category"]) || '-';
                return (
                  <div className="flex flex-col">
                    <div className="aspect-[4/3] bg-slate-50/50 rounded-2xl p-4 mb-4 relative flex items-center justify-center border border-slate-100">
                      {image ? <img src={image} className="w-full h-full object-contain mix-blend-multiply" alt={name}/> : <div className="text-slate-300 font-bold">ไม่มีรูปภาพ</div>}
                    </div>
                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-md self-start mb-2">{cat}</span>
                    <h3 className="text-lg font-black text-slate-800 mb-2 leading-snug">{name}</h3>
                    <div className="font-black text-indigo-600 text-2xl mb-4">฿{price.toLocaleString()}</div>
                    {desc && (
                      <div className="text-sm text-slate-600 bg-slate-50 p-3.5 rounded-xl mb-4 whitespace-pre-line leading-relaxed border border-slate-100">
                        {desc}
                      </div>
                    )}
                    <button onClick={() => { handleAddToCart({ id: viewItemDetails.id, name, price, image }, 'product'); setViewItemDetails(null); }} className="w-full py-3.5 mt-auto rounded-xl bg-indigo-600 text-white font-black shadow-[0_4px_14px_rgba(79,70,229,0.3)] hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                      <ShoppingCart size={18} /> เพิ่มลงตะกร้า
                    </button>
                  </div>
                );
              })() : (() => {
                const code = String(getFuzzyKey(viewItemDetails, ["รหัสคอส", "col_1"]) || '');
                const courseName = String(getFuzzyKey(viewItemDetails, ["ชื่อคอส", "ชื่อคอร์ส", "col_4", "name"]) || '-');
                const price = parseNumber(getFuzzyKey(viewItemDetails, ["ราคาขายเต็ม", "ราคา", "col_5"]) || 0);
                const credit = Number(getFuzzyKey(viewItemDetails, ["เครดิตที่ได้รับ", "เครดิต", "col_8"]) || 0);
                const subItems = String(getFuzzyKey(viewItemDetails, ["รายการที่ได้รับ", "col_11"]) || '').trim();
                const sessionCount = Number(getFuzzyKey(viewItemDetails, ["จำนวนครั้ง", "ครั้ง", "col_6"]) || 0);
                const duration = getFuzzyKey(viewItemDetails, ["อายุคอส", "อายุคอร์ส", "col_7"]);
                const isSingle = sessionCount <= 1;
                const badgeStyle = isSingle ? "bg-indigo-100 text-indigo-700 border-indigo-200" : "bg-pink-100 text-pink-700 border-pink-200";
                
                return (
                  <div className="flex flex-col">
                    <div className={`p-5 rounded-2xl mb-4 border ${isSingle ? 'bg-indigo-50 border-indigo-100' : 'bg-pink-50 border-pink-100'}`}>
                      <div className={`text-xs font-mono font-bold mb-1 ${isSingle ? 'text-indigo-500' : 'text-pink-500'}`}>{code}</div>
                      <h3 className="text-lg font-black text-slate-900 leading-snug">{courseName}</h3>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <div className="font-black text-slate-800 text-2xl">฿{price.toLocaleString()}</div>
                      <div className={`text-xs font-bold px-2 py-1 rounded-md border ${badgeStyle}`}>
                        {isSingle ? 'รายครั้ง' : `${sessionCount} ครั้ง`}
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-6">
                      {credit > 0 && (
                        <div className="flex justify-between items-center bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                          <span className="text-xs font-bold text-emerald-700">ได้รับเครดิตคืน</span>
                          <span className="font-black text-emerald-600">฿{credit.toLocaleString()}</span>
                        </div>
                      )}
                      {duration && String(duration).trim() !== '-' && (
                        <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-xs font-bold text-slate-600">อายุการใช้งาน</span>
                          <span className="font-bold text-slate-800">⏳ {duration}</span>
                        </div>
                      )}
                    </div>
                    
                    {subItems && (
                      <div className="mb-6">
                        <h4 className="text-xs font-black text-slate-400 mb-2 uppercase tracking-wider">สิ่งที่ได้รับในแพ็กเกจ</h4>
                        <div className="text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl whitespace-pre-line leading-relaxed border border-slate-100">
                          {subItems.replace(/\\n/g, '\n')}
                        </div>
                      </div>
                    )}
                    
                    <button onClick={() => { handleAddToCart({ id: viewItemDetails.id, name: courseName, price }, 'course'); setViewItemDetails(null); }} className={`w-full py-3.5 mt-auto rounded-xl text-white font-black shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${isSingle ? 'bg-indigo-600 shadow-indigo-600/30 hover:bg-indigo-700' : 'bg-pink-500 shadow-pink-500/30 hover:bg-pink-600'}`}>
                      <ShoppingCart size={18} /> เพิ่มลงตะกร้า
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
