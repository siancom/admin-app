import React, { useState } from 'react';
import { Package, Truck, X, Loader2, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { iShipAPI } from '../utils/iShipAPI';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getFuzzyKey } from '../utils/fuzzy';
import { ThailandAddressTypeahead, ThailandAddressValue } from 'react-thailand-address-typeahead';
import { parseThaiAddress } from '../utils/thaiAddress';

export default function IShipBookingModal({ isOpen, onClose, order, onSubmit, onPrintLabel }) {
  const [weight, setWeight] = useState('1'); // kg
  const [width, setWidth] = useState('20'); // cm
  const [length, setLength] = useState('30'); // cm
  const [height, setHeight] = useState('11'); // cm (Box A standard)
  const [courier, setCourier] = useState('FlashExpress'); // iShip uses FlashExpress
  
  // Destination Info
  const [dstPhone, setDstPhone] = useState(order?.customerPhone || order?.phone || '');
  const [dstAddress, setDstAddress] = useState(order?.shippingAddress || '');
  const [dstDistrict, setDstDistrict] = useState('');
  const [dstAmphure, setDstAmphure] = useState('');
  const [dstProvince, setDstProvince] = useState('');
  const [dstZipcode, setDstZipcode] = useState('');
  const [addrVal, setAddrVal] = useState(ThailandAddressValue.empty());

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [codAmount, setCodAmount] = useState('0');

  if (!isOpen || !order) return null;

  const searchAddressByPhone = async () => {
    if (!dstPhone || dstPhone.length < 9) {
      alert('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง');
      return;
    }
    setIsSearching(true);
    try {
      const q = query(collection(db, 'customers'), where('เบอร์โทร', '==', dstPhone));
      const q2 = query(collection(db, 'customers'), where('col_3', '==', dstPhone));
      
      let snap = await getDocs(q);
      if (snap.empty) {
        snap = await getDocs(q2);
      }

      if (!snap.empty) {
        const customer = snap.docs[0].data();
        let name = String(getFuzzyKey(customer, ['ชื่อ', 'ชื่อลูกค้า', 'col_1']) || '');
        let phone = String(getFuzzyKey(customer, ['เบอร์โทร', 'เบอร์โทรลูกค้า', 'col_3']) || '');
        let addr = String(getFuzzyKey(customer, ['ที่อยู่', 'col_4', 'address']) || '');
        
        let fullAddressText = `${name} ${phone}\n${addr}`.trim();
        
        if (addr || fullAddressText.length > 10) {
          const parsedAddress = await parseThaiAddress(addr || fullAddressText);
          
          if (parsedAddress.zipcode) setDstZipcode(parsedAddress.zipcode);
          if (parsedAddress.province) setDstProvince(parsedAddress.province);
          if (parsedAddress.amphure) setDstAmphure(parsedAddress.amphure);
          if (parsedAddress.district) setDstDistrict(parsedAddress.district);
          
          setDstAddress(addr || fullAddressText);
          setAddrVal({ 
            subdistrict: parsedAddress.district, 
            district: parsedAddress.amphure, 
            province: parsedAddress.province, 
            postalCode: parsedAddress.zipcode 
          });
          
          alert('ดึงข้อมูลที่อยู่สำเร็จ กรุณาตรวจสอบและแก้ไขความถูกต้อง');
        } else {
          alert('พบข้อมูลลูกค้าแต่ไม่มีที่อยู่ในระบบ');
        }
      } else {
        alert('ไม่พบประวัติลูกค้าจากเบอร์โทรศัพท์นี้');
      }
    } catch (e) {
      console.error(e);
      alert('เกิดข้อผิดพลาดในการค้นหาข้อมูล');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Mock API call to iShip (if no token yet) or real API call
      // Because we might not have a valid token, we'll just mock the response for now
      // so it doesn't crash the app in production, but if token is added, it will work.
      
      let trackingNumber = 'MOCK-ISHIP-' + Math.floor(Math.random() * 1000000);
      let apiResult = null;

      try {
        apiResult = await iShipAPI.createOrder({
            weight: parseFloat(weight),
            width: parseFloat(width),
            length: parseFloat(length),
            height: parseFloat(height),
            courier_code: courier,
            src_name: 'คลินิก',
            src_phone: '0888888888',
            src_address: 'ที่อยู่คลินิก',
            src_district: 'แขวง',
            src_amphure: 'เขต',
            src_province: 'จังหวัด',
            src_zipcode: '10000',
            dst_name: order.customerName || 'ไม่ระบุชื่อ',
            dst_phone: dstPhone || '0000000000',
            dst_address: dstAddress || '-',
            dst_district: dstDistrict || '-',
            dst_amphure: dstAmphure || '-',
            dst_province: dstProvince || '-',
            dst_zipcode: dstZipcode || '00000',
            cod_amount: parseFloat(codAmount || 0),
            category_id: 3, // ของใช้
            remark: 'ระวังแตก'
        });
        
        if (apiResult && apiResult.status === false) {
          throw new Error(apiResult.message || JSON.stringify(apiResult));
        }

        if (apiResult && apiResult.data && apiResult.data.track_no) {
           trackingNumber = apiResult.data.track_no;
        }
      } catch (apiErr) {
        console.error("iShip API Error:", apiErr);
        // We will throw this so the user can see it in the UI instead of silently mocking
        alert("iShip API Error: " + (apiErr.message || "การเชื่อมต่อล้มเหลว อาจติดปัญหา CORS หรือข้อมูลไม่ครบถ้วน"));
        setIsSubmitting(false);
        return; // Stop here, don't fall back to mock
      }

      await onSubmit({
        weight: parseFloat(weight),
        width: parseFloat(width),
        length: parseFloat(length),
        height: parseFloat(height),
        courier,
        codAmount: parseFloat(codAmount || 0),
        trackingNumber: trackingNumber,
        rawApiResult: apiResult,
        dstAddress: dstAddress ? `${dstAddress}\nต.${dstDistrict} อ.${dstAmphure} จ.${dstProvince} ${dstZipcode}`.replace(/\nต. อ. จ. 00000|\nต.- อ.- จ.- 00000/g, '') : ''
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95">
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Package size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-black text-xl">เรียกขนส่ง (iShip)</h3>
              <p className="text-sm font-medium opacity-90">เชื่อมต่อ 7 ขนส่งชั้นนำ</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-6">
             <p className="text-sm font-black text-gray-800 mb-3">ข้อมูลผู้รับ (ปลายทาง)</p>
             <div className="space-y-3">
               <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="block text-xs font-bold text-gray-700 mb-1">ชื่อผู้รับ</label>
                   <input type="text" value={order.customerName || ''} readOnly className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm font-bold text-gray-500 cursor-not-allowed" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-gray-700 mb-1">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                   <div className="flex gap-2">
                     <input type="tel" value={dstPhone} onChange={(e) => setDstPhone(e.target.value)} required placeholder="08X-XXX-XXXX" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm font-bold" />
                     <button type="button" onClick={searchAddressByPhone} disabled={isSearching} title="ค้นหาที่อยู่จากเบอร์โทร" className="px-3 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 rounded-lg font-bold flex items-center justify-center transition-colors shrink-0 disabled:opacity-50 shadow-sm">
                       {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                     </button>
                   </div>
                 </div>
               </div>
               <div>
                 <label className="block text-xs font-bold text-gray-700 mb-1">ที่อยู่ (บ้านเลขที่, ซอย, ถนน) <span className="text-red-500">*</span></label>
                 <textarea value={dstAddress} onChange={(e) => setDstAddress(e.target.value)} required rows={2} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm font-medium text-gray-800" />
                 {order.shippingAddress && (
                    <p className="text-[10px] text-gray-500 mt-1">ที่อยู่เดิม: {order.shippingAddress}</p>
                 )}
               </div>
               <ThailandAddressTypeahead value={addrVal} onValueChange={(val) => {
                 setAddrVal(val);
                 setDstDistrict(val.subdistrict);
                 setDstAmphure(val.district);
                 setDstProvince(val.province);
                 setDstZipcode(val.postalCode);
               }}>
                 <div className="grid grid-cols-2 gap-3 relative">
                   <div>
                     <label className="block text-xs font-bold text-gray-700 mb-1">ตำบล/แขวง <span className="text-red-500">*</span></label>
                     <ThailandAddressTypeahead.SubdistrictInput className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm font-bold" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-gray-700 mb-1">อำเภอ/เขต <span className="text-red-500">*</span></label>
                     <ThailandAddressTypeahead.DistrictInput className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm font-bold" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-gray-700 mb-1">จังหวัด <span className="text-red-500">*</span></label>
                     <ThailandAddressTypeahead.ProvinceInput className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm font-bold" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-gray-700 mb-1">รหัสไปรษณีย์ <span className="text-red-500">*</span></label>
                     <ThailandAddressTypeahead.PostalCodeInput className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm font-bold tracking-widest" />
                   </div>
                 </div>
                 <ThailandAddressTypeahead.Suggestion containerProps={{ className: 'absolute z-[250] bg-white w-full border border-gray-200 shadow-xl rounded-lg mt-1 max-h-48 overflow-y-auto text-sm' }} optionItemProps={{ className: 'px-4 py-2 hover:bg-indigo-50 cursor-pointer text-gray-700 border-b border-gray-50 last:border-0' }} />
               </ThailandAddressTypeahead>
             </div>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">บริษัทขนส่ง</label>
              <select value={courier} onChange={(e) => setCourier(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-800">
                <option value="FlashExpress">Flash Express</option>
                <option value="JNT">J&T Express</option>
                <option value="Kerry">Kerry Express</option>
                <option value="BestExpress">Best Express</option>
              </select>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                <div className="p-4 space-y-4">
                  <div className="flex flex-col md:flex-row gap-4 mb-2">
                    <div className="flex-1">
                      <label className="block text-sm font-bold text-gray-700 mb-1">ยอดเก็บเงินปลายทาง (COD)</label>
                      <input type="number" min="0" value={codAmount} onChange={(e) => setCodAmount(e.target.value)} placeholder="0 = ไม่เก็บเงินปลายทาง" className="w-full px-4 py-2 bg-rose-50 border border-rose-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 font-bold text-rose-700" />
                      <p className="text-[10px] text-gray-500 mt-1">ใส่ 0 หากเป็นพัสดุชำระเงินแล้ว</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">เลือกขนาดมาตรฐาน</label>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => { setWidth(14); setLength(20); setHeight(6); }} className="px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100">กล่อง A (14x20x6)</button>
                      <button type="button" onClick={() => { setWidth(17); setLength(25); setHeight(9); }} className="px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100">กล่อง B (17x25x9)</button>
                      <button type="button" onClick={() => { setWidth(20); setLength(30); setHeight(11); }} className="px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100">กล่อง C (20x30x11)</button>
                      <button type="button" onClick={() => { setWidth(11); setLength(17); setHeight(6); }} className="px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100">กล่อง 00 (11x17x6)</button>
                      <button type="button" onClick={() => { setWidth(16); setLength(23); setHeight(2); }} className="px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100">ซองเอกสาร/กันกระแทก</button>
                    </div>
                  </div>

                  <div className="hidden grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">น้ำหนัก (กก.)</label>
                      <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-bold" required />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">กว้าง (ซม.)</label>
                      <input type="number" value={width} onChange={(e) => setWidth(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-bold" required />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">ยาว (ซม.)</label>
                      <input type="number" value={length} onChange={(e) => setLength(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-bold" required />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">สูง (ซม.)</label>
                      <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-bold" required />
                    </div>
                  </div>
                </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <button 
              type="button" 
              onClick={() => {
                const fullAddress = dstAddress ? `${dstAddress}\nต.${dstDistrict} อ.${dstAmphure} จ.${dstProvince} ${dstZipcode}`.replace(/\nต. อ. จ. 00000|\nต.- อ.- จ.- 00000/g, '') : '';
                if (onPrintLabel) onPrintLabel(fullAddress);
              }}
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-lg transition-colors flex items-center justify-center shadow-lg shadow-orange-500/30 gap-2"
            >
              <Package size={20}/> พิมพ์ใบแปะหน้า
            </button>
            <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-xl font-black text-lg transition-colors flex items-center justify-center shadow-lg shadow-blue-500/30 gap-2">
              {isSubmitting ? <><Loader2 size={20} className="animate-spin"/> กำลังจอง...</> : <><Truck size={20} /> ยืนยันจองขนส่ง</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
