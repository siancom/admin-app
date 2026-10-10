import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Image as ImageIcon, Download, CheckCircle, Save, Printer, Flower2, Award } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useReactToPrint } from 'react-to-print';
import { getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { getCol } from '../config/firebase';
import ModalWrapper from './ModalWrapper';
import InputField from './InputField';
import SignaturePad from './SignaturePad';

const VipApplicationFormModal = ({ isOpen, onClose, customer, onUpgradeComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nickname: '',
    idCard: '',
    dob: '',
    age: '',
    gender: 'หญิง',
    addressNo: '',
    village: '',
    soi: '',
    road: '',
    subDistrict: '',
    district: '',
    province: '',
    zipcode: '',
    phone: '',
    email: ''
  });
  const [cardImage, setCardImage] = useState(null);
  const [signatureImage, setSignatureImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedFormUrl, setSavedFormUrl] = useState(null);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);
  const formRef = useRef(null);

  useEffect(() => {
    if (isOpen && customer) {
      setStep(1);
      setFormData(prev => ({
        ...prev,
        firstName: customer?.firstName || customer?.computedName?.split(' ')[0] || '',
        lastName: customer?.lastName || customer?.computedName?.split(' ')[1] || '',
        nickname: customer?.nickname || '',
        idCard: customer?.idCard || '',
        dob: customer?.dob || '',
        age: customer?.age || '',
        gender: customer?.gender || 'หญิง',
        addressNo: customer?.addressNo || '',
        village: customer?.village || '',
        soi: customer?.soi || '',
        road: customer?.road || '',
        subDistrict: customer?.subDistrict || '',
        district: customer?.district || '',
        province: customer?.province || '',
        zipcode: customer?.zipcode || '',
        phone: customer?.computedPhone || customer?.เบอร์โทร || '',
        email: customer?.email || ''
      }));

      const fetchSavedForm = async () => {
        setIsLoadingSaved(true);
        try {
          const q = query(
            getCol('customer_documents'),
            where('customerId', '==', customer.id),
            where('title', '==', 'ใบสมัครสมาชิก VIP')
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            const docs = snap.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b) => {
              const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.getTime ? a.createdAt.getTime() : 0);
              const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.getTime ? b.createdAt.getTime() : 0);
              return timeB - timeA;
            });
            setSavedFormUrl(docs[0].fileUrl);
            setStep(0); // Step 0 is View Mode
          } else {
            setSavedFormUrl(null);
            setStep(1);
          }

          // Fetch Customer Uploaded Card Photo
          const qCard = query(
            getCol('customer_documents'),
            where('customerId', '==', customer.id),
            where('title', '==', 'รูปถ่ายบัตรสมาชิก (จากแอป)')
          );
          const snapCard = await getDocs(qCard);
          if (!snapCard.empty) {
            const docsCard = snapCard.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b) => {
              const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.getTime ? a.createdAt.getTime() : 0);
              const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.getTime ? b.createdAt.getTime() : 0);
              return timeB - timeA;
            });
            setCardImage(docsCard[0].fileUrl);
          }

          // Fetch Customer Uploaded Signature
          const qSig = query(
            getCol('customer_documents'),
            where('customerId', '==', customer.id),
            where('title', '==', 'ลายเซ็น (จากแอป)')
          );
          const snapSig = await getDocs(qSig);
          if (!snapSig.empty) {
            const docsSig = snapSig.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b) => {
              const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.getTime ? a.createdAt.getTime() : 0);
              const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.getTime ? b.createdAt.getTime() : 0);
              return timeB - timeA;
            });
            setSignatureImage(docsSig[0].fileUrl);
          }
        } catch (e) {
          console.error(e);
          setStep(1);
        } finally {
          setIsLoadingSaved(false);
        }
      };
      fetchSavedForm();
    } else if (!isOpen) {
      setStep(1);
      setSavedFormUrl(null);
      setSignatureImage(null);
      setCardImage(null);
    }
  }, [isOpen, customer]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setCardImage(dataUrl);
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDobChange = (e) => {
    const val = e.target.value;
    let newAge = formData.age;
    
    const yearMatch = val.match(/\d{4}/);
    if (yearMatch) {
      const year = parseInt(yearMatch[0], 10);
      const currentYearCE = new Date().getFullYear();
      if (year > 2400 && year <= currentYearCE + 543) {
        newAge = String(currentYearCE + 543 - year);
      } else if (year > 1900 && year <= currentYearCE) {
        newAge = String(currentYearCE - year);
      }
    }
    
    setFormData({...formData, dob: val, age: newAge});
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!cardImage) {
        alert('กรุณาถ่ายรูปหรืออัปโหลดรูปบัตรสมาชิก');
        return;
      }
      if (!signatureImage) {
        alert('กรุณาให้ลูกค้าเซ็นลายมือชื่อ');
        return;
      }
      setStep(2);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: formRef,
    documentTitle: `แบบฟอร์มสมัครสมาชิก_VIP_${customer?.firstName}_${customer?.lastName}`,
    onAfterPrint: () => console.log('Print success'),
  });

  const handleGenerateAndSave = async () => {
    if (!formRef.current) return;
    setIsGenerating(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const canvas = await html2canvas(formRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: true
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      
      if (onUpgradeComplete) {
        await onUpgradeComplete(imgData);
      }

      // Automatically downloading the file using link.click() is removed 
      // because it causes WebViews (like LINE app) and iOS Safari to crash or behave unexpectedly.
      // The image is safely uploaded to Firebase Storage instead.
      
      onClose();
    } catch (err) {
      console.error("Error generating form:", err);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title={customer?.isApproved ? "สร้างใบสมัคร VIP" : "อัปเกรดและสร้างแบบฟอร์ม VIP"} icon={CheckCircle} colorClass="bg-green-100 text-green-600">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Award className="text-orange-500" size={24} />
          {step === 0 ? 'ใบสมัคร VIP ที่บันทึกไว้' : step === 1 ? 'ข้อมูลผู้สมัคร VIP' : 'ตรวจสอบแบบฟอร์ม'}
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
          <X size={20} />
        </button>
      </div>

      {isLoadingSaved ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          กำลังโหลดข้อมูล...
        </div>
      ) : step === 0 ? (
        <div className="flex flex-col items-center space-y-4">
          {savedFormUrl ? (
            <img src={savedFormUrl} alt="Saved VIP Form" className="max-w-full rounded-lg shadow-md border border-slate-200" />
          ) : (
            <div className="text-slate-500">ไม่พบใบสมัครที่บันทึกไว้</div>
          )}
          <div className="flex w-full gap-3 mt-6">
            <button 
              onClick={() => {
                if (!savedFormUrl) return;
                if (savedFormUrl.startsWith('data:')) {
                  const link = document.createElement('a');
                  link.href = savedFormUrl;
                  link.download = `VIP_Application_${customer.id}_${Date.now()}.jpg`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                } else {
                  window.open(savedFormUrl, '_blank');
                }
              }} 
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex justify-center items-center gap-2"
            >
              <Printer size={18} /> โหลดแบบฟอร์ม
            </button>
            <button onClick={() => setStep(1)} className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex justify-center items-center gap-2">
              <CheckCircle size={18} /> กรอกใบสมัครใหม่
            </button>
          </div>
        </div>
      ) : step === 1 ? (
        <div className="space-y-4">
          <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 text-orange-800 text-sm mb-4">
            กรุณากรอกข้อมูลส่วนตัวให้ครบถ้วน และถ่ายรูปบัตรสมาชิกเพื่อใช้ประกอบใบสมัคร
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <InputField label="ชื่อ" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required />
            <InputField label="นามสกุล" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required />
            <InputField label="ชื่อเล่น" value={formData.nickname} onChange={e => setFormData({...formData, nickname: e.target.value})} />
            <InputField label="เลขบัตรประชาชน" value={formData.idCard} onChange={e => setFormData({...formData, idCard: e.target.value})} maxLength={13} />
            <InputField label="วัน/เดือน/ปีเกิด" value={formData.dob} onChange={handleDobChange} placeholder="วว/ดด/ปปปป (พ.ศ.)" />
            <div className="grid grid-cols-2 gap-2">
              <InputField label="อายุ" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} type="number" />
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">เพศ</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                  <option value="หญิง">หญิง</option>
                  <option value="ชาย">ชาย</option>
                  <option value="อื่นๆ">อื่นๆ</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 my-4 pt-4">
            <h4 className="font-bold text-sm text-gray-700 mb-2">ที่อยู่ผู้สมัคร</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <InputField label="บ้านเลขที่" value={formData.addressNo} onChange={e => setFormData({...formData, addressNo: e.target.value})} />
              <InputField label="หมู่บ้าน" value={formData.village} onChange={e => setFormData({...formData, village: e.target.value})} />
              <InputField label="ซอย/ตรอก" value={formData.soi} onChange={e => setFormData({...formData, soi: e.target.value})} />
              <InputField label="ถนน" value={formData.road} onChange={e => setFormData({...formData, road: e.target.value})} />
              <InputField label="แขวง/ตำบล" value={formData.subDistrict} onChange={e => setFormData({...formData, subDistrict: e.target.value})} />
              <InputField label="เขต/อำเภอ" value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} />
              <InputField label="จังหวัด" value={formData.province} onChange={e => setFormData({...formData, province: e.target.value})} />
              <InputField label="รหัสไปรษณีย์" value={formData.zipcode} onChange={e => setFormData({...formData, zipcode: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <InputField label="เบอร์โทร" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
              <InputField label="E-mail" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
          </div>

          <div className="border-t border-gray-100 my-4 pt-4">
            <h4 className="font-bold text-sm text-gray-700 mb-2">รูปถ่ายบัตรสมาชิกจริง</h4>
            <div className="flex items-center gap-4">
              {cardImage ? (
                <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-gray-200">
                  <img src={cardImage} alt="Card Preview" className="w-full h-full object-cover" />
                  <button onClick={() => setCardImage(null)} className="absolute top-1 right-1 bg-white rounded-full p-0.5 text-red-500 shadow"><X size={14} /></button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Camera className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-xs text-gray-500 font-bold">กดเพื่อถ่ายรูป หรืออัปโหลดบัตรสมาชิก</p>
                  </div>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 my-4 pt-4">
            <h4 className="font-bold text-sm text-gray-700 mb-2">ลายเซ็นลูกค้า</h4>
            <SignaturePad label="เซ็นชื่อที่นี่" onSigned={setSignatureImage} />
          </div>

          <button onClick={handleNextStep} className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-3 rounded-xl mt-4 shadow-lg active:scale-95 transition-all">
            ถัดไป: ตรวจสอบแบบฟอร์ม
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center text-sm text-gray-600 mb-2">
            ตรวจสอบความเรียบร้อยของแบบฟอร์มก่อนทำการบันทึก
          </div>
          
          <div className="overflow-auto max-h-[60vh] bg-gray-100 p-4 rounded-xl flex justify-center">
            <style>{`
              @import url('https://fonts.googleapis.com/css2?family=Sriracha&display=swap');
            `}</style>
            <div 
              ref={formRef}
              className="relative shadow-md overflow-hidden px-5 py-12 flex flex-col font-sans text-gray-800" 
              style={{ 
                width: '420px', 
                height: '594px', 
                background: 'linear-gradient(135deg, #e5e7eb 0%, #ffffff 40%, #ffffff 60%, #e5e7eb 100%)',
                color: '#1f2937' 
              }}
            >
              <div className="flex flex-col items-center mb-4 mt-2">
                <div className="flex items-center justify-center mb-3">
                  <img src="/assets/iris-logo.png" alt="IRIS Logo" className="h-14 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
                <div className="text-lg font-bold" style={{ color: '#000000' }}>แบบฟอร์มการสมัครสมาชิก</div>
              </div>

              <div className="text-[10px] space-y-4 flex-1 px-2 mt-2">
                <div className="flex items-end gap-2 border-b pb-1" style={{ borderColor: '#9ca3af', borderBottomStyle: 'dotted' }}>
                  <span className="font-bold whitespace-nowrap" style={{ color: '#000000' }}>ชื่อ:</span> <span className="flex-1 text-center whitespace-nowrap" style={{ color: '#1e40af', fontFamily: '"Sriracha", cursive', fontSize: '10px' }}>{formData.firstName}</span>
                  <span className="font-bold whitespace-nowrap" style={{ color: '#000000' }}>สกุล:</span> <span className="flex-1 text-center whitespace-nowrap" style={{ color: '#1e40af', fontFamily: '"Sriracha", cursive', fontSize: '10px' }}>{formData.lastName}</span>
                  <span className="font-bold whitespace-nowrap" style={{ color: '#000000' }}>ชื่อเล่น:</span> <span className="w-16 text-center whitespace-nowrap" style={{ color: '#1e40af', fontFamily: '"Sriracha", cursive', fontSize: '10px' }}>{formData.nickname}</span>
                </div>
                
                <div className="flex items-end gap-2 border-b pb-1" style={{ borderColor: '#9ca3af', borderBottomStyle: 'dotted' }}>
                  <span className="font-bold whitespace-nowrap" style={{ color: '#000000' }}>เลขประจำตัวประชาชน:</span> <span className="flex-1 text-center tracking-widest whitespace-nowrap" style={{ color: '#1e40af', fontFamily: '"Sriracha", cursive', fontSize: '10px' }}>{formData.idCard}</span>
                </div>
                
                <div className="flex items-end gap-2 border-b pb-1" style={{ borderColor: '#9ca3af', borderBottomStyle: 'dotted' }}>
                  <span className="font-bold whitespace-nowrap" style={{ color: '#000000' }}>วัน เดือน ปีเกิด:</span> <span className="flex-1 text-center whitespace-nowrap" style={{ color: '#1e40af', fontFamily: '"Sriracha", cursive', fontSize: '10px' }}>{formData.dob}</span>
                  <span className="font-bold whitespace-nowrap" style={{ color: '#000000' }}>อายุ:</span> <span className="w-10 text-center whitespace-nowrap" style={{ color: '#1e40af', fontFamily: '"Sriracha", cursive', fontSize: '10px' }}>{formData.age}</span>
                  <span className="font-bold whitespace-nowrap" style={{ color: '#000000' }}>เพศ:</span> <span className="w-12 text-center whitespace-nowrap" style={{ color: '#1e40af', fontFamily: '"Sriracha", cursive', fontSize: '10px' }}>{formData.gender}</span>
                </div>

                <div className="font-bold mt-8 mb-2 text-[13px]" style={{ color: '#000000' }}>ที่อยู่ผู้สมัคร</div>
                
                <div className="flex items-end gap-2 border-b pb-1" style={{ borderColor: '#9ca3af', borderBottomStyle: 'dotted' }}>
                  <span className="font-bold whitespace-nowrap" style={{ color: '#000000' }}>บ้านเลขที่:</span> <span className="w-16 text-center whitespace-nowrap" style={{ color: '#1e40af', fontFamily: '"Sriracha", cursive', fontSize: '10px' }}>{formData.addressNo}</span>
                  <span className="font-bold whitespace-nowrap" style={{ color: '#000000' }}>หมู่บ้าน:</span> <span className="flex-1 text-center whitespace-nowrap" style={{ color: '#1e40af', fontFamily: '"Sriracha", cursive', fontSize: '10px' }}>{formData.village}</span>
                  <span className="font-bold whitespace-nowrap" style={{ color: '#000000' }}>ซอย/ตรอก:</span> <span className="flex-1 text-center whitespace-nowrap" style={{ color: '#1e40af', fontFamily: '"Sriracha", cursive', fontSize: '10px' }}>{formData.soi}</span>
                </div>
                
                <div className="flex items-end gap-2 border-b pb-1" style={{ borderColor: '#9ca3af', borderBottomStyle: 'dotted' }}>
                  <span className="font-bold whitespace-nowrap" style={{ color: '#000000' }}>ถนน:</span> <span className="flex-1 text-center whitespace-nowrap" style={{ color: '#1e40af', fontFamily: '"Sriracha", cursive', fontSize: '10px' }}>{formData.road}</span>
                  <span className="font-bold whitespace-nowrap" style={{ color: '#000000' }}>แขวง/ตำบล:</span> <span className="flex-1 text-center whitespace-nowrap" style={{ color: '#1e40af', fontFamily: '"Sriracha", cursive', fontSize: '10px' }}>{formData.subDistrict}</span>
                  <span className="font-bold whitespace-nowrap" style={{ color: '#000000' }}>เขต/อำเภอ:</span> <span className="flex-1 text-center whitespace-nowrap" style={{ color: '#1e40af', fontFamily: '"Sriracha", cursive', fontSize: '10px' }}>{formData.district}</span>
                </div>
                
                <div className="flex items-end gap-2 border-b pb-1" style={{ borderColor: '#9ca3af', borderBottomStyle: 'dotted' }}>
                  <span className="font-bold whitespace-nowrap" style={{ color: '#000000' }}>จังหวัด:</span> <span className="flex-1 text-center whitespace-nowrap" style={{ color: '#1e40af', fontFamily: '"Sriracha", cursive', fontSize: '10px' }}>{formData.province}</span>
                  <span className="font-bold whitespace-nowrap" style={{ color: '#000000' }}>รหัสไปรษณีย์:</span> <span className="w-20 text-center whitespace-nowrap" style={{ color: '#1e40af', fontFamily: '"Sriracha", cursive', fontSize: '10px' }}>{formData.zipcode}</span>
                  <span className="font-bold whitespace-nowrap" style={{ color: '#000000' }}>เบอร์โทร:</span> <span className="flex-1 text-center whitespace-nowrap" style={{ color: '#1e40af', fontFamily: '"Sriracha", cursive', fontSize: '10px' }}>{formData.phone}</span>
                </div>
                
                <div className="flex items-end gap-2 border-b pb-1" style={{ borderColor: '#9ca3af', borderBottomStyle: 'dotted' }}>
                  <span className="font-bold whitespace-nowrap" style={{ color: '#000000' }}>E-mail:</span> <span className="flex-1 text-center whitespace-nowrap" style={{ color: '#1e40af', fontFamily: '"Sriracha", cursive', fontSize: '10px' }}>{formData.email}</span>
                </div>
              </div>

              {/* Bottom Area: ID Card & Signatures */}
              <div className="relative h-[110px] mt-4 flex justify-between items-end px-2">
                {/* Captured ID Card */}
                <div className="w-[140px] h-[90px] rounded border-2 border-dashed flex items-center justify-center text-[10px] overflow-hidden rotate-[-2deg]" style={{ borderColor: '#d1d5db', backgroundColor: '#f9fafb', color: '#9ca3af' }}>
                  {cardImage ? (
                    <img src={cardImage} alt="Card" className="w-full h-full object-cover" />
                  ) : (
                    <span>รูปบัตรสมาชิก</span>
                  )}
                </div>
                
                {/* Signatures */}
                <div className="w-[160px] text-center text-[12px] mb-2 flex flex-col items-center">
                  <div className="border-b pb-1 mb-1 w-full flex justify-center items-center h-12" style={{ borderColor: '#9ca3af', borderBottomStyle: 'dotted' }}>
                    {signatureImage ? (
                      <img src={signatureImage} alt="Signature" className="h-full object-contain mix-blend-multiply" />
                    ) : (
                      <span className="font-bold" style={{ color: '#1e40af', fontFamily: '"Sriracha", cursive', fontSize: '11px' }}>{formData.firstName} {formData.lastName}</span>
                    )}
                  </div>
                  <div style={{ color: '#000000' }}>ลงชื่อผู้สมัคร</div>
                  <div className="mt-2 text-[11px]" style={{ color: '#000000' }}>
                    วันที่ <span className="font-bold" style={{ color: '#1e40af', fontFamily: '"Sriracha", cursive', fontSize: '10px' }}>{new Date().toLocaleDateString('th-TH')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-xl shadow-sm active:scale-95 transition-all text-sm">
              กลับไปแก้ไข
            </button>
            <button onClick={handlePrint} className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold py-3 rounded-xl shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 text-sm">
              <Printer size={18}/> ปริ้น PDF
            </button>
            <button onClick={handleGenerateAndSave} disabled={isGenerating} className="flex-[2] bg-green-600 hover:bg-green-700 text-white font-black py-3 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 text-sm">
              {isGenerating ? 'กำลังประมวลผล...' : <><Save size={18}/> {customer?.isApproved ? 'บันทึกเอกสาร' : 'บันทึก & อัปเกรด VIP'}</>}
            </button>
          </div>
        </div>
      )}
    </ModalWrapper>
  );
};

export default VipApplicationFormModal;
