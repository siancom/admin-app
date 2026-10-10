import React, { useState, useEffect, useRef } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { getFuzzyKey } from '../utils/fuzzy';
import html2pdf from 'html2pdf.js';
import { Download, Printer, Save, CheckCircle, X } from 'lucide-react';

export default function MoleConsultationForm({ 
  selectedCustomer, 
  globalBranch, 
  showToast 
}) {
  const formRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    branch: globalBranch || '',
    province: '',
    district: '',
    tel: '',
    
    // Customer Info
    name: '',
    dob: '',
    phone: '',
    lineId: '',
    job: '',
    address: '',
    
    // Medical Info
    congenitalDisease: '',
    productsUsed: '',
    prevLaser: false,
    prevOintment: false,
    prevOther: false,
    prevOtherDetail: '',
    skinType: '', // dry, oily, normal, sensitive, combination
    
    // Problems & Areas
    probMole: false,
    probFreckle: false,
    probSyringoma: false,
    probSkintag: false,
    area1: '',
    area2: '',
    area3: '',
    
    // Agreements
    agree1: false,
    agree2: false,
    agree3: false,
    
    // Signatures
    custSignName: '',
    custSignDate: new Date().toISOString().split('T')[0],
    staffSignName: '',
    staffSignDate: new Date().toISOString().split('T')[0]
  });

  // Pre-fill customer data when selectedCustomer changes
  useEffect(() => {
    if (selectedCustomer) {
      setFormData(prev => ({
        ...prev,
        name: selectedCustomer.computedName || String(getFuzzyKey(selectedCustomer, ["ชื่อ", "col_1"]) || ''),
        phone: selectedCustomer.computedPhone || String(getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3"]) || ''),
        address: String(getFuzzyKey(selectedCustomer, ["ที่อยู่", "col_4"]) || ''),
        dob: String(getFuzzyKey(selectedCustomer, ["วันเกิด", "ว/ด/ป เกิด"]) || '')
      }));

      // Try to load the latest consultation form for this customer
      const loadLatestConsult = async () => {
        try {
          const q = query(
            collection(db, 'mole_consultations'),
            where('customerId', '==', selectedCustomer.id),
            orderBy('createdAt', 'desc'),
            limit(1)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            const data = snap.docs[0].data();
            // Don't overwrite basic info, just medical/agreements
            setFormData(prev => ({
              ...prev,
              ...data,
              // Keep current dates
              custSignDate: prev.custSignDate,
              staffSignDate: prev.staffSignDate,
              // Keep basic customer info linked to current selectedCustomer
              name: prev.name,
              phone: prev.phone,
              address: prev.address,
              dob: prev.dob
            }));
          }
        } catch (error) {
          console.error("Error loading previous consult:", error);
        }
      };
      
      loadLatestConsult();
    }
  }, [selectedCustomer]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!selectedCustomer) {
      showToast('กรุณาเลือกลูกค้าก่อนบันทึก', 'error');
      return;
    }
    
    // Validation
    if (!formData.agree1 || !formData.agree2 || !formData.agree3) {
      showToast('กรุณากดยอมรับเงื่อนไขและข้อสัญญาให้ครบถ้วน', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const consultData = {
        ...formData,
        customerId: selectedCustomer.id,
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'mole_consultations'), consultData);
      showToast('บันทึกใบ Consult เรียบร้อยแล้ว', 'success');
      
    } catch (error) {
      console.error(error);
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const element = formRef.current;
    if (!element) return;
    
    const opt = {
        margin:       0,
        filename:     `Consult_${formData.name || 'Customer'}_${new Date().getTime()}.pdf`,
        image:        { type: 'jpeg', quality: 1.0 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="w-full flex flex-col items-center pb-12">
        {/* Action Buttons */}
        <div className="w-full max-w-[210mm] flex flex-wrap justify-end gap-3 mb-6 no-print">
            <button 
                type="button" 
                onClick={handleDownloadPDF} 
                className="px-5 py-2.5 bg-slate-600 text-white text-sm font-medium rounded-xl hover:bg-slate-700 transition-colors shadow flex items-center gap-2"
            >
                <Download size={16} />
                ดาวน์โหลด PDF
            </button>
            <button 
                type="button" 
                onClick={handlePrint} 
                className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
            >
                <Printer size={16} />
                พิมพ์เอกสาร
            </button>
            <button 
                type="button"
                onClick={handleSave}
                disabled={isProcessing}
                className={`px-6 py-2.5 text-white text-sm font-medium rounded-xl transition-colors shadow flex items-center gap-2 ${isProcessing ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30'}`}
            >
                {isProcessing ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> กำลังบันทึก...</>
                ) : (
                  <><Save size={16} /> บันทึกข้อมูล</>
                )}
            </button>
        </div>

        {/* A4 Document Content */}
        <div ref={formRef} className="a4-paper bg-white relative text-[13px] leading-tight text-gray-800">
            
            {/* Header */}
            <div className="bg-emerald-600 text-white px-6 py-3 text-center">
                <h1 className="text-xl font-bold tracking-wider uppercase mb-0.5">IRIS Queen Nature</h1>
                <h2 className="text-sm font-medium text-emerald-100">ใบ Consult จี้ไฝ กระเนื้อ สิวหิน ติ่งเนื้อ</h2>
            </div>

            {/* Main Content Area */}
            <div className="px-6 py-4 flex flex-col h-[calc(100%-65px)] justify-between">
                
                <div>
                    {/* Branch Info */}
                    <div className="flex justify-between items-center text-xs mb-3 font-medium">
                        <div className="flex items-center gap-1 w-1/4">
                            <span>สาขา</span>
                            <input name="branch" value={formData.branch} onChange={handleInputChange} type="text" className="print-input flex-1 w-full text-xs" />
                        </div>
                        <div className="flex items-center gap-1 w-1/4">
                            <span>จังหวัด</span>
                            <input name="province" value={formData.province} onChange={handleInputChange} type="text" className="print-input flex-1 w-full text-xs" />
                        </div>
                        <div className="flex items-center gap-1 w-1/4">
                            <span>อำเภอ</span>
                            <input name="district" value={formData.district} onChange={handleInputChange} type="text" className="print-input flex-1 w-full text-xs" />
                        </div>
                        <div className="flex items-center gap-1 w-1/5">
                            <span>โทร</span>
                            <input name="tel" value={formData.tel} onChange={handleInputChange} type="text" className="print-input flex-1 w-full text-xs" />
                        </div>
                    </div>

                    {/* 1. ข้อมูลลูกค้า */}
                    <section className="mb-3">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-emerald-600 text-white w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs">1</span>
                            <h3 className="text-sm font-semibold text-gray-800">ข้อมูลลูกค้า</h3>
                        </div>
                        <div className="grid grid-cols-12 gap-x-4 gap-y-2 pl-7">
                            <div className="col-span-6 flex items-center gap-2">
                                <label className="whitespace-nowrap font-medium text-gray-700">ชื่อ-นามสกุล:</label>
                                <input name="name" value={formData.name} onChange={handleInputChange} type="text" className="print-input flex-1 w-full text-[13px]" />
                            </div>
                            <div className="col-span-3 flex items-center gap-2">
                                <label className="whitespace-nowrap font-medium text-gray-700">ว/ด/ป เกิด:</label>
                                <input name="dob" value={formData.dob} onChange={handleInputChange} type="text" placeholder="DD/MM/YYYY" className="print-input flex-1 w-full text-[13px]" />
                            </div>
                            <div className="col-span-3 flex items-center gap-2">
                                <label className="whitespace-nowrap font-medium text-gray-700">เบอร์โทร:</label>
                                <input name="phone" value={formData.phone} onChange={handleInputChange} type="text" className="print-input flex-1 w-full text-[13px]" />
                            </div>
                            
                            <div className="col-span-4 flex items-center gap-2">
                                <label className="whitespace-nowrap font-medium text-gray-700">LINE ID:</label>
                                <input name="lineId" value={formData.lineId} onChange={handleInputChange} type="text" className="print-input flex-1 w-full text-[13px]" />
                            </div>
                            <div className="col-span-4 flex items-center gap-2">
                                <label className="whitespace-nowrap font-medium text-gray-700">อาชีพ:</label>
                                <input name="job" value={formData.job} onChange={handleInputChange} type="text" className="print-input flex-1 w-full text-[13px]" />
                            </div>
                            <div className="col-span-12 flex items-center gap-2 mt-1">
                                <label className="whitespace-nowrap font-medium text-gray-700">ที่อยู่:</label>
                                <input name="address" value={formData.address} onChange={handleInputChange} type="text" className="print-input flex-1 w-full text-[13px]" />
                            </div>
                        </div>
                    </section>

                    {/* 2. ข้อมูลทางการแพทย์ */}
                    <section className="mb-3">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-emerald-600 text-white w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs">2</span>
                            <h3 className="text-sm font-semibold text-gray-800">ข้อมูลทางการแพทย์</h3>
                        </div>
                        <div className="space-y-2 pl-7">
                            <div className="flex items-center gap-2">
                                <label className="whitespace-nowrap font-medium text-gray-700">โรคประจำตัว:</label>
                                <input name="congenitalDisease" value={formData.congenitalDisease} onChange={handleInputChange} type="text" placeholder="ไม่มี / หรือระบุ..." className="print-input flex-1 w-full text-[13px]" />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="whitespace-nowrap font-medium text-gray-700">ผลิตภัณฑ์ที่กำลังใช้ (ระบุยี่ห้อ):</label>
                                <input name="productsUsed" value={formData.productsUsed} onChange={handleInputChange} type="text" className="print-input flex-1 w-full text-[13px]" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-medium text-gray-700">เคยแก้ปัญหาผิว โดยวิธี:</label>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                                        <label className="flex items-center"><input name="prevLaser" checked={formData.prevLaser} onChange={handleInputChange} type="checkbox" className="rounded border-gray-400 text-emerald-600 focus:ring-emerald-600 w-3.5 h-3.5" /><span className="ml-1.5 text-[13px] text-gray-700">ใช้เลเซอร์</span></label>
                                        <label className="flex items-center"><input name="prevOintment" checked={formData.prevOintment} onChange={handleInputChange} type="checkbox" className="rounded border-gray-400 text-emerald-600 focus:ring-emerald-600 w-3.5 h-3.5" /><span className="ml-1.5 text-[13px] text-gray-700">ใช้ยาแต้ม</span></label>
                                        <label className="flex items-center flex-1 min-w-[120px]">
                                            <input name="prevOther" checked={formData.prevOther} onChange={handleInputChange} type="checkbox" className="rounded border-gray-400 text-emerald-600 focus:ring-emerald-600 w-3.5 h-3.5" />
                                            <span className="ml-1.5 text-[13px] text-gray-700 whitespace-nowrap">อื่นๆ</span>
                                            <input name="prevOtherDetail" value={formData.prevOtherDetail} onChange={handleInputChange} type="text" className="print-input ml-2 flex-1 w-full text-xs" disabled={!formData.prevOther} />
                                        </label>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-medium text-gray-700">ชนิดของผิว:</label>
                                    <div className="flex flex-wrap gap-3">
                                        {['dry', 'oily', 'normal', 'sensitive', 'combination'].map((type, idx) => {
                                            const labels = ['แห้ง', 'มัน', 'ธรรมดา', 'แพ้ง่าย', 'ผิวผสม'];
                                            return (
                                                <label key={type} className="flex items-center">
                                                    <input 
                                                        type="radio" 
                                                        name="skinType" 
                                                        value={type}
                                                        checked={formData.skinType === type}
                                                        onChange={handleInputChange}
                                                        className="border-gray-400 text-emerald-600 focus:ring-emerald-600 w-3.5 h-3.5" 
                                                    />
                                                    <span className="ml-1.5 text-[13px] text-gray-700">{labels[idx]}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 3. ประเภทปัญหาผิวและบริเวณ */}
                    <section className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-emerald-600 text-white w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs">3</span>
                            <h3 className="text-sm font-semibold text-gray-800">ประเภทปัญหาผิวและบริเวณที่ต้องการรับบริการ</h3>
                        </div>
                        
                        <div className="pl-7 space-y-2">
                            <div className="flex items-center gap-4">
                                <label className="font-medium text-gray-700 whitespace-nowrap">ประเภทปัญหา:</label>
                                <div className="flex flex-wrap gap-5">
                                    <label className="flex items-center"><input name="probMole" checked={formData.probMole} onChange={handleInputChange} type="checkbox" className="rounded border-gray-400 text-emerald-600 w-4 h-4" /><span className="ml-1.5 text-[13px] text-gray-700">ไฝ</span></label>
                                    <label className="flex items-center"><input name="probFreckle" checked={formData.probFreckle} onChange={handleInputChange} type="checkbox" className="rounded border-gray-400 text-emerald-600 w-4 h-4" /><span className="ml-1.5 text-[13px] text-gray-700">กระเนื้อ</span></label>
                                    <label className="flex items-center"><input name="probSyringoma" checked={formData.probSyringoma} onChange={handleInputChange} type="checkbox" className="rounded border-gray-400 text-emerald-600 w-4 h-4" /><span className="ml-1.5 text-[13px] text-gray-700">สิวหิน</span></label>
                                    <label className="flex items-center"><input name="probSkintag" checked={formData.probSkintag} onChange={handleInputChange} type="checkbox" className="rounded border-gray-400 text-emerald-600 w-4 h-4" /><span className="ml-1.5 text-[13px] text-gray-700">ติ่งเนื้อ</span></label>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 w-full mt-1">
                                <label className="font-medium text-gray-700 whitespace-nowrap">บริเวณที่มีปัญหาผิว:</label>
                                <div className="flex-1 grid grid-cols-3 gap-3">
                                    <div className="flex items-center gap-1"><span className="text-gray-500 text-xs">1.</span><input name="area1" value={formData.area1} onChange={handleInputChange} type="text" className="print-input flex-1 w-full text-[13px]" /></div>
                                    <div className="flex items-center gap-1"><span className="text-gray-500 text-xs">2.</span><input name="area2" value={formData.area2} onChange={handleInputChange} type="text" className="print-input flex-1 w-full text-[13px]" /></div>
                                    <div className="flex items-center gap-1"><span className="text-gray-500 text-xs">3.</span><input name="area3" value={formData.area3} onChange={handleInputChange} type="text" className="print-input flex-1 w-full text-[13px]" /></div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Information Block */}
                    <section className="bg-blue-50/50 border border-blue-100 rounded-lg p-3.5 text-xs text-gray-700 mb-3">
                        <div className="mb-2">
                            <h4 className="font-bold text-blue-900 mb-1 text-[13px]">อาการหลังการแก้ปัญหา</h4>
                            <p className="leading-relaxed text-justify text-[11.5px]">
                                หลังจี้ไฝจะมีรอยแดงคล้ำเกิดขึ้น ซึ่งเป็นแผลหลุมตื้น (ตามความลึกของรากไฝแต่ละเม็ด) ส่วนใหญ่หลุมแผลจะค่อยๆ ตื้นขึ้นประมาณ 3 - 4 สัปดาห์ ส่วนรอยแดงคล้ำแล้วแต่สภาพผิวและการดูแลผิวของแต่ละบุคคล ปกติรอยจะเริ่มดีขึ้นใน 1 เดือนขึ้นไป ระหว่างนี้ถ้าแผลแห้งดี ไม่บวมแดงรอบแผล เริ่มให้โดนน้ำได้ ทาครีมบำรุงและครีมกันแดดสม่ำเสมอทุกวัน หลีกเลี่ยงแสงแดด ไอร้อน และสามารถแต่งหน้าได้
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-2">
                            <div>
                                <h4 className="font-bold text-blue-900 mb-1">ขั้นตอนการดูแลและแก้ปัญหา</h4>
                                <ol className="list-decimal pl-4 space-y-0.5 text-[11px] leading-tight">
                                    <li>ห้ามโดนน้ำเป็นเวลา 3 - 5 วันในจุดที่จี้</li>
                                    <li>ใช้ผงสมุนไพรผสมน้ำสะอาดแปะที่รอยจี้เช้า-เย็น จะช่วยลดอาการแดง อักเสบ และลดการเกิดรอยแผลเป็น</li>
                                    <li>หลังจากนี้แผลจะเริ่มมีสะเก็ดเกิดขึ้น ห้ามแกะ ควรปล่อยให้สะเก็ดหลุดเอง และควรระวังเวลาทำความสะอาด ไม่ไปรบกวนสะเก็ดให้หลุดเร็วเกินไป</li>
                                    <li>ติดตามผลการดูแลและแก้ปัญหาตามนัด</li>
                                </ol>
                            </div>
                            <div>
                                <h4 className="font-bold text-blue-900 mb-1">คำแนะนำในการดูแล</h4>
                                <ol className="list-decimal pl-4 space-y-0.5 text-[11px] leading-tight">
                                    <li>แนะนำให้เข้ามารับบริการด้วยตนเองอย่างต่อเนื่องเพื่อผลการรักษาที่ถูกวิธี</li>
                                    <li>เมื่อบริเวณที่แก้ปัญหามีการตกสะเก็ด <strong className="text-red-600">ห้ามแกะ เกาเด็ดขาด</strong></li>
                                    <li>ควรปฏิบัติตามคำแนะนำของทางศูนย์บริการอย่างเคร่งครัด</li>
                                </ol>
                                <div className="mt-2 p-1.5 bg-white border border-blue-200 rounded text-[11px] leading-tight">
                                    <strong className="text-blue-900">เงื่อนไขรับประกัน:</strong> มีประกัน 1 เดือน จี้ซ้ำไม่มีค่าใช้จ่าย (กรณีรากไฝขึ้น) <span className="text-red-600 font-medium">หากเกินวันนัด ต้องชำระค่าบริการเพิ่ม</span> กรณีไม่สะดวกให้แจ้งเลื่อนล่วงหน้า
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Agreements */}
                    <section className="border border-gray-300 rounded-lg p-3 bg-gray-50/50">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1.5 w-1/2 pr-2">
                                <label className="flex items-start cursor-pointer group">
                                    <input name="agree1" checked={formData.agree1} onChange={handleInputChange} type="checkbox" required className="w-3.5 h-3.5 rounded border-gray-400 text-emerald-600 mt-0.5" />
                                    <span className="ml-2 text-[12px] font-medium text-gray-700 leading-tight">ลูกค้ายอมรับอาการหลังจากแก้ปัญหาได้ทุกประการ</span>
                                </label>
                                <label className="flex items-start cursor-pointer group">
                                    <input name="agree2" checked={formData.agree2} onChange={handleInputChange} type="checkbox" required className="w-3.5 h-3.5 rounded border-gray-400 text-emerald-600 mt-0.5" />
                                    <span className="ml-2 text-[12px] font-medium text-gray-700 leading-tight">รับทราบว่าระยะการรักษาขึ้นอยู่กับสภาพผิวของแต่ละบุคคล</span>
                                </label>
                                <label className="flex items-start cursor-pointer group">
                                    <input name="agree3" checked={formData.agree3} onChange={handleInputChange} type="checkbox" required className="w-3.5 h-3.5 rounded border-gray-400 text-emerald-600 mt-0.5" />
                                    <span className="ml-2 text-[12px] font-medium text-gray-700 leading-tight">ลูกค้ายินยอมปฏิบัติตามคำแนะนำของศูนย์บริการทุกประการ</span>
                                </label>
                            </div>
                            <div className="w-1/2 bg-emerald-50 border border-emerald-200 text-emerald-800 p-2 rounded text-[11px] font-medium leading-tight text-justify">
                                <strong>ข้อสัญญา:</strong> ข้าพเจ้าขอรับรองว่าข้อมูลที่ให้เป็นความจริงทุกประการ และยินยอมให้ศูนย์ความงามไอริสเป็นผู้ดูแลปัญหาผิว<br/>
                                <span className="text-[10px] font-normal text-gray-500 mt-1 block leading-tight">* ใบนี้จะนำกลับมาใช้ได้ตลอดเวลาที่เข้ารับบริการ หากมีการแก้ปัญหาต้องผ่านการตรวจสุขภาพผิวจากผู้เชี่ยวชาญของศูนย์ฯ เท่านั้น</span>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Signatures */}
                <section className="grid grid-cols-2 gap-12 pt-2 px-8 mt-4 pb-2">
                    <div className="text-center space-y-2">
                        <div className="border-b border-dashed border-gray-500 w-full mx-auto relative h-6">
                            <input name="custSignName" value={formData.custSignName} onChange={handleInputChange} type="text" className="absolute bottom-0 w-full text-center bg-transparent border-none focus:ring-0 text-[13px] font-medium print-input" placeholder="พิมพ์ชื่อลูกค้า" />
                        </div>
                        <p className="text-xs font-medium text-gray-600">(ลงชื่อ) ลูกค้า</p>
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
                            <span>วันที่:</span>
                            <input name="custSignDate" value={formData.custSignDate} onChange={handleInputChange} type="date" className="print-input w-28 text-center text-xs" />
                        </div>
                    </div>

                    <div className="text-center space-y-2">
                        <div className="border-b border-dashed border-gray-500 w-full mx-auto relative h-6">
                            <input name="staffSignName" value={formData.staffSignName} onChange={handleInputChange} type="text" className="absolute bottom-0 w-full text-center bg-transparent border-none focus:ring-0 text-[13px] font-medium print-input" placeholder="พิมพ์ชื่อเจ้าหน้าที่" />
                        </div>
                        <p className="text-xs font-medium text-gray-600">(ลงชื่อ) เจ้าหน้าที่ผู้ให้บริการ</p>
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
                            <span>วันที่:</span>
                            <input name="staffSignDate" value={formData.staffSignDate} onChange={handleInputChange} type="date" className="print-input w-28 text-center text-xs" />
                        </div>
                    </div>
                </section>

            </div>
        </div>
    </div>
  );
}
