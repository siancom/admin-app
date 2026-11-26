import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Printer, 
  Save, 
  X, 
  Sparkles, 
  Check, 
  User, 
  Phone, 
  Calendar, 
  MapPin, 
  Briefcase, 
  AlertCircle, 
  HeartPulse, 
  ShieldCheck, 
  PenTool, 
  Layers, 
  Package, 
  RotateCcw,
  CheckCircle2,
  Eye,
  FileCheck,
  ChevronRight
} from 'lucide-react';
import SignaturePad from './SignaturePad';
import { getLocalYYYYMMDD, formatDateTimeStr } from '../utils/parse';

// Quick options for easy, fast selection in clinic
const COMMON_DISEASES = ['ไม่มี', 'ความดันโลหิตสูง', 'เบาหวาน', 'ภูมิแพ้', 'โรคหัวใจ', 'ไทรอยด์', 'หอบหืด'];
const COMMON_CURRENT_PRODUCTS = ['ไม่มี', 'ครีมบำรุงทั่วไป', 'เซรั่ม', 'ครีมกันแดด', 'สบู่/โฟมล้างหน้า', 'ยารักษาสิวจากคลินิก'];
const COMMON_CHEMICALS = ['ไม่มี', 'ปรอท', 'สเตียรอยด์', 'ไฮโดรควิโนน', 'กรดผลไม้เข้มข้น', 'ครีมหน้าขาว'];
const COMMON_INJECTIONS_MEDS = ['ไม่มี', 'ยาปฏิชีวนะ', 'ยา Roaccutane / แอคโนติน', 'โบท็อกซ์', 'ฟิลเลอร์', 'วิตามินซี / คอลลาเจน'];
const COMMON_SKIN_TYPES = ['ผิวผสม', 'ผิวมัน', 'ผิวแห้ง', 'ผิวธรรมดา', 'ผิวแพ้ง่าย / บอบบาง', 'ผิวขาดน้ำ'];
const COMMON_CAPILLARY_AREAS = ['ไม่มี', 'โหนกแก้ม', 'ข้างปีกจมูก', 'คาง', 'หน้าผาก', 'ทั่วใบหน้า'];
const COMMON_PROBLEM_AREAS = ['ใต้คาง', 'แก้มซ้าย', 'แก้มขวา', 'หน้าผาก', 'จมูก', 'ขมับ', 'ทั่วใบหน้า'];
const COMMON_SOLUTIONS = ['ผงพอก+โทนเนอร์ยา', 'โคลนบำรุง+สบู่มินิ', 'มาร์คสาหร่าย+เซรั่ม', 'คอร์สสิว+กดสิว', 'คอร์สฝ้ากระ+ไอออนโต'];

export default function IrisPatientIntakeModal({
  isOpen = false,
  onClose = () => {},
  customer = null,
  initialData = null,
  globalBranch = '',
  onSave = async () => {},
  readOnly = false
}) {
  const [activeTab, setActiveTab] = useState('form'); // 'form' | 'preview'
  const printRef = useRef(null);

  // Signature canvas refs
  const custSigRef = useRef(null);
  const staffSigRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    // Header & Meta
    branch: globalBranch ? `สาขา${globalBranch} เกาะสมุย จังหวัดสุราษฎร์ธานี` : 'สาขาเกาะสมุย จังหวัดสุราษฎร์ธานี',
    refNo: 'IrisPatient2',
    dateStr: new Date().toLocaleDateString('th-TH'),

    // ข้อมูลลูกค้า
    name: '',
    phone: '',
    idLine: 'ไม่มี',
    dob: '',
    age: '',
    address: '',
    occupation: 'รับจ้าง',
    citizenId: '',

    // ข้อมูลทางการแพทย์
    underlyingDisease: 'ไม่มี',
    currentProducts: 'ไม่มี',
    chemicalHistory: 'ปรอท+สเตียรอยด์+ไม่มี',
    injectionsMedsSupplements: 'ไม่มี',
    skinType: 'ผิวผสม+ไม่มี',
    capillaryArea: 'โหนกแก้ม',
    problemAreas: 'ใต้คาง , แก้มซ้าย',
    solutionProducts: 'ผงพอก+โทนเนอร์ยา',

    // คำแนะนำในการดูแลผิว
    advice1: '1. แนะนำให้เข้ามารับบริการที่ร้านอย่างต่อเนื่อง เพื่อผลการรักษาที่ถูกวิธี',
    advice2: '2. เมื่อมีอาการแสบ ตึงคัน ห้ามแกะ เกา ถู',
    advice3: '3. ควรปฏิบัติตามคำแนะนำของทางศูนย์บริการ',

    // ขั้นตอนการดูแลและแก้ปัญหา
    step1: '1. อธิบายขั้นตอนกระบวนการผลัดเซลล์ผิว และอาการขณะใช้ผลิตภัณฑ์กลุ่มผลัดเซลล์ผิว (คันตึง แดงบวม)',
    step2: '2. แนะนำการใช้ผลิตภัณฑ์อย่างถูกวิธี',
    step3: '3. ใช้ผลิตภัณฑ์ตามคู่มือที่ได้รับ',
    step4: '4. ติดตามผลการแก้ปัญหา',

    // ข้อสัญญา & หมายเหตุ
    contractText: 'ข้าพเจ้าขอรับรองว่าข้อมูลที่ให้เป็นความจริงทุกประการและยินยอมให้ศูนย์ความงามไอริสเป็นผู้ดูแลปัญหาผิว',
    disclaimerNotes: [
      'ใบนี้จะนำกลับมาใช้ได้ตลอดเวลาที่ลูกค้าเข้ามารับบริการ และหากมีการแก้ปัญหา ต้องมีการตรวจสุขภาพผิวจากผู้ดูแลผิวของศูนย์บริการเท่านั้น',
      'สินค้าซื้อแล้วไม่รับคืนทุกกรณี',
      'ลูกค้ายอมรับอาการก่อนผลัดเซลล์ได้',
      'ลูกค้ายินยอมปฏิบัติตามคำแนะนำของทางศูนย์ทุกประการ'
    ],

    // ลายเซ็น
    customerSignature: '',
    staffSignature: '',
    customerSignDate: new Date().toLocaleDateString('th-TH'),
    staffSignDate: new Date().toLocaleDateString('th-TH'),
    staffName: '',

    // แฟ้มเอกสาร
    documentTitle: 'ใบบันทึกประวัติลูกค้า (IrisPatient)',
    physicalLocation: 'แฟ้มเบอร์ 2 ชั้นประวัติลูกค้า (IrisPatient2)',
    archiveType: 'physical', // 'physical' | 'digital' | 'both'
    archiveNotes: 'บันทึกประวัติสุขภาพผิวและหนังสือยินยอมการรักษา'
  });

  const [isSaving, setIsSaving] = useState(false);

  // Initialize data when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData
      }));
      return;
    }

    if (customer) {
      const custName = customer.computedName || customer['ชื่อ'] || customer.name || '';
      const custPhone = customer.computedPhone || customer['เบอร์โทร'] || customer.phone || '';
      const custDob = customer.dob || customer['วันเกิด'] || '';
      const custAge = customer.age || customer['อายุ'] || '';
      const custIdCard = customer.citizenId || customer.idCard || customer['เลขประจำตัวประชาชน'] || '';
      
      const addrParts = [
        customer.addressNo,
        customer.subDistrict ? `ต.${customer.subDistrict}` : '',
        customer.district ? `อ.${customer.district}` : '',
        customer.province ? `จ.${customer.province}` : '',
        customer.zipcode
      ].filter(Boolean);
      const custAddr = addrParts.length > 0 ? addrParts.join(' ') : (customer.address || customer['ที่อยู่'] || '');

      const custIssue = customer.issue || customer['ปัญหาผิวหน้า'] || '';

      setFormData(prev => ({
        ...prev,
        name: custName,
        phone: custPhone,
        dob: custDob,
        age: custAge ? String(custAge) : '',
        citizenId: custIdCard,
        address: custAddr,
        problemAreas: custIssue || prev.problemAreas,
        refNo: `IrisPatient-${custPhone.slice(-4) || '001'}`,
        documentTitle: `ใบบันทึกประวัติลูกค้า (IrisPatient) - ${custName}`,
        physicalLocation: `แฟ้มประวัติ ${custName} (Ref: IrisPatient2)`
      }));
    }
  }, [isOpen, customer, initialData]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSaveForm = async () => {
    try {
      setIsSaving(true);

      // Extract current signatures from canvas if drawn
      let custSig = formData.customerSignature;
      let staffSig = formData.staffSignature;

      if (custSigRef.current && custSigRef.current.dataset.isSigned === "true") {
        custSig = custSigRef.current.toDataURL('image/png');
      }
      if (staffSigRef.current && staffSigRef.current.dataset.isSigned === "true") {
        staffSig = staffSigRef.current.toDataURL('image/png');
      }

      const updatedForm = {
        ...formData,
        customerSignature: custSig,
        staffSignature: staffSig
      };

      await onSave(updatedForm);
      onClose();
    } catch (err) {
      console.error('Error saving IrisPatient intake form:', err);
      alert(`บันทึกไม่สำเร็จ: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-5xl flex flex-col max-h-[94vh] overflow-hidden">
        
        {/* 🌟 Header Bar (Hidden during print) 🌟 */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-amber-500/10 via-emerald-500/5 to-teal-500/10 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30">
              <FileCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-800 text-base sm:text-lg">
                  ใบบันทึกประวัติลูกค้า Iris Queen Nature (IrisPatient)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-200">
                  เชื่อมแฟ้มเอกสาร
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                แบบฟอร์มประวัติการแพทย์ สุขภาพผิว หนังสือยินยอม และจัดเก็บเข้าแฟ้มเอกสารลูกค้า
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'form'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PenTool size={14} />
                <span>กรอกข้อมูล</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'preview'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye size={14} />
                <span>พรีวิวใบ A4</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 🌟 Content Area 🌟 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          
          {/* TAB 1: FORM INPUT */}
          {activeTab === 'form' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              
              {/* Card 1: ข้อมูลลูกค้า */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 text-emerald-700 font-black text-sm mb-3 pb-2 border-b border-slate-100">
                  <User size={16} />
                  <span>ข้อมูลทั่วไปของลูกค้า</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">ชื่อ-นามสกุล *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="เช่น คุณสมหญิง ใจดี"
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">เบอร์โทรศัพท์ *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="08X-XXX-XXXX"
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">ID Line</label>
                    <input
                      type="text"
                      value={formData.idLine}
                      onChange={e => setFormData({ ...formData, idLine: e.target.value })}
                      placeholder="เช่น somying_iris หรือ ไม่มี"
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">วันเดือนปีเกิด</label>
                    <input
                      type="text"
                      value={formData.dob}
                      onChange={e => setFormData({ ...formData, dob: e.target.value })}
                      placeholder="วว/ดด/ปปปป"
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">อายุ (ปี)</label>
                    <input
                      type="text"
                      value={formData.age}
                      onChange={e => setFormData({ ...formData, age: e.target.value })}
                      placeholder="เช่น 28"
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">อาชีพ</label>
                    <input
                      type="text"
                      value={formData.occupation}
                      onChange={e => setFormData({ ...formData, occupation: e.target.value })}
                      placeholder="เช่น รับจ้าง, ค้าขาย, ข้าราชการ"
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">สาขาที่เข้ารับบริการ</label>
                    <input
                      type="text"
                      value={formData.branch}
                      onChange={e => setFormData({ ...formData, branch: e.target.value })}
                      placeholder="เช่น สาขาเกาะสมุย"
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">ที่อยู่ลูกค้า</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="บ้านเลขที่ ตำบล อำเภอ จังหวัด"
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Card 2: ข้อมูลทางการแพทย์ & สภาพผิว */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-indigo-700 font-black text-sm pb-2 border-b border-slate-100">
                  <HeartPulse size={16} />
                  <span>ข้อมูลทางการแพทย์ & สภาพผิวหน้า (Iris Skin & Medical History)</span>
                </div>

                {/* 1. โรคประจำตัว */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700">1. โรคประจำตัว</label>
                    <div className="flex gap-1 flex-wrap">
                      {COMMON_DISEASES.map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            underlyingDisease: prev.underlyingDisease === 'ไม่มี' || !prev.underlyingDisease ? d : (d === 'ไม่มี' ? 'ไม่มี' : `${prev.underlyingDisease}, ${d}`)
                          }))}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] rounded-md font-medium transition-colors"
                        >
                          + {d}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={formData.underlyingDisease}
                    onChange={e => setFormData({ ...formData, underlyingDisease: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:border-indigo-500 outline-none"
                    placeholder="ระบุโรคประจำตัว หรือ พิมพ์ 'ไม่มี'"
                  />
                </div>

                {/* 2. ผลิตภัณฑ์ที่กำลังใช้ */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700">2. ผลิตภัณฑ์ที่กำลังใช้อยู่ในปัจจุบัน</label>
                    <div className="flex gap-1 flex-wrap">
                      {COMMON_CURRENT_PRODUCTS.map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            currentProducts: prev.currentProducts === 'ไม่มี' || !prev.currentProducts ? p : (p === 'ไม่มี' ? 'ไม่มี' : `${prev.currentProducts}, ${p}`)
                          }))}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] rounded-md font-medium transition-colors"
                        >
                          + {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={formData.currentProducts}
                    onChange={e => setFormData({ ...formData, currentProducts: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:border-indigo-500 outline-none"
                    placeholder="เช่น ครีมทั่วไป, เซรั่ม, สบู่ หรือ 'ไม่มี'"
                  />
                </div>

                {/* 3. ประเภทของสารเคมีที่ใช้ */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700">3. ประเภทของสารเคมีที่เคยใช้ (ปรอท / สเตียรอยด์ ฯลฯ)</label>
                    <div className="flex gap-1 flex-wrap">
                      {COMMON_CHEMICALS.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            chemicalHistory: prev.chemicalHistory === 'ไม่มี' || !prev.chemicalHistory ? c : (c === 'ไม่มี' ? 'ไม่มี' : `${prev.chemicalHistory}+${c}`)
                          }))}
                          className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] rounded-md font-medium transition-colors"
                        >
                          + {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={formData.chemicalHistory}
                    onChange={e => setFormData({ ...formData, chemicalHistory: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:border-indigo-500 outline-none"
                    placeholder="เช่น ปรอท+สเตียรอยด์+ไม่มี"
                  />
                </div>

                {/* 4. การฉีด / ยา / อาหารเสริม */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700">4. การฉีด / รับประทานยา / อาหารเสริม</label>
                    <div className="flex gap-1 flex-wrap">
                      {COMMON_INJECTIONS_MEDS.map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            injectionsMedsSupplements: prev.injectionsMedsSupplements === 'ไม่มี' || !prev.injectionsMedsSupplements ? m : (m === 'ไม่มี' ? 'ไม่มี' : `${prev.injectionsMedsSupplements}, ${m}`)
                          }))}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] rounded-md font-medium transition-colors"
                        >
                          + {m}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={formData.injectionsMedsSupplements}
                    onChange={e => setFormData({ ...formData, injectionsMedsSupplements: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:border-indigo-500 outline-none"
                    placeholder="เช่น ไม่มี หรือ โบท็อกซ์, วิตามิน"
                  />
                </div>

                {/* 5. ชนิดของผิว & บริเวณเส้นเลือดฝอย */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">5. ชนิดของผิว</label>
                    <input
                      type="text"
                      value={formData.skinType}
                      onChange={e => setFormData({ ...formData, skinType: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:border-indigo-500 outline-none mb-1.5"
                      placeholder="เช่น ผิวผสม+ไม่มี"
                    />
                    <div className="flex gap-1 flex-wrap">
                      {COMMON_SKIN_TYPES.map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setFormData({ ...formData, skinType: s })}
                          className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] rounded-md font-medium transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">6. บริเวณที่เป็นเส้นเลือดฝอย</label>
                    <input
                      type="text"
                      value={formData.capillaryArea}
                      onChange={e => setFormData({ ...formData, capillaryArea: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:border-indigo-500 outline-none mb-1.5"
                      placeholder="เช่น โหนกแก้ม หรือ ไม่มี"
                    />
                    <div className="flex gap-1 flex-wrap">
                      {COMMON_CAPILLARY_AREAS.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setFormData({ ...formData, capillaryArea: c })}
                          className="px-2 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] rounded-md font-medium transition-colors"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 7. บริเวณที่มีปัญหาผิว & ผลิตภัณฑ์ที่ใช้แก้ปัญหา */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">7. บริเวณที่มีปัญหาผิว</label>
                    <input
                      type="text"
                      value={formData.problemAreas}
                      onChange={e => setFormData({ ...formData, problemAreas: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:border-indigo-500 outline-none mb-1.5"
                      placeholder="เช่น ใต้คาง , แก้มซ้าย"
                    />
                    <div className="flex gap-1 flex-wrap">
                      {COMMON_PROBLEM_AREAS.map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            problemAreas: prev.problemAreas ? `${prev.problemAreas}, ${p}` : p
                          }))}
                          className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] rounded-md font-medium transition-colors"
                        >
                          + {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">8. ผลิตภัณฑ์ที่ใช้ในการแก้ปัญหา</label>
                    <input
                      type="text"
                      value={formData.solutionProducts}
                      onChange={e => setFormData({ ...formData, solutionProducts: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:border-indigo-500 outline-none mb-1.5"
                      placeholder="เช่น ผงพอก+โทนเนอร์ยา"
                    />
                    <div className="flex gap-1 flex-wrap">
                      {COMMON_SOLUTIONS.map(sol => (
                        <button
                          key={sol}
                          type="button"
                          onClick={() => setFormData({ ...formData, solutionProducts: sol })}
                          className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] rounded-md font-medium transition-colors"
                        >
                          {sol}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: ลายเซ็นยินยอม (Signatures) */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 text-teal-700 font-black text-sm mb-3 pb-2 border-b border-slate-100">
                  <PenTool size={16} />
                  <span>ข้อสัญญา & ลายเซ็นยืนยันรับบริการ (Signatures)</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 mb-4 space-y-1">
                  <p className="font-bold text-slate-800">📜 ข้อสัญญา:</p>
                  <p>{formData.contractText}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Customer Signature */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>✍️ ลายเซ็นลูกค้า (ผู้รับบริการ)</span>
                      <span className="text-[11px] text-slate-400">วันที่: {formData.customerSignDate}</span>
                    </div>
                    {formData.customerSignature && !readOnly ? (
                      <div className="border border-slate-200 rounded-xl p-2 bg-slate-50 relative flex items-center justify-center h-28">
                        <img src={formData.customerSignature} alt="Customer Signature" className="max-h-full max-w-full object-contain" />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, customerSignature: '' })}
                          className="absolute bottom-1.5 right-1.5 text-[9px] bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-0.5 rounded-md font-bold"
                        >
                          เซ็นใหม่
                        </button>
                      </div>
                    ) : (
                      <SignaturePad
                        canvasRef={custSigRef}
                        label="ลงชื่อลูกค้าที่นี่..."
                        height={110}
                      />
                    )}
                  </div>

                  {/* Staff Signature */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>✍️ ลายเซ็นเจ้าหน้าที่ (ผู้ดูแลผิว)</span>
                      <span className="text-[11px] text-slate-400">วันที่: {formData.staffSignDate}</span>
                    </div>
                    {formData.staffSignature && !readOnly ? (
                      <div className="border border-slate-200 rounded-xl p-2 bg-slate-50 relative flex items-center justify-center h-28">
                        <img src={formData.staffSignature} alt="Staff Signature" className="max-h-full max-w-full object-contain" />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, staffSignature: '' })}
                          className="absolute bottom-1.5 right-1.5 text-[9px] bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-0.5 rounded-md font-bold"
                        >
                          เซ็นใหม่
                        </button>
                      </div>
                    ) : (
                      <SignaturePad
                        canvasRef={staffSigRef}
                        label="ลงชื่อเจ้าหน้าที่ที่นี่..."
                        height={110}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Card 4: การจัดเก็บแฟ้มเอกสาร (Archive Options) */}
              <div className="bg-gradient-to-r from-blue-50/80 via-sky-50/50 to-indigo-50/80 rounded-2xl p-4 sm:p-5 border-2 border-sky-200 shadow-xs">
                <div className="flex items-center gap-2 text-sky-800 font-black text-sm mb-3 pb-2 border-b border-sky-100">
                  <Layers size={16} />
                  <span>การจัดเก็บแฟ้มเอกสารลูกค้า (Document Archive & Storage)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ชื่อเอกสารในระบบ *
                    </label>
                    <input
                      type="text"
                      value={formData.documentTitle}
                      onChange={e => setFormData({ ...formData, documentTitle: e.target.value })}
                      className="w-full border border-sky-200 bg-white rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:border-sky-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      สถานที่เก็บจริง / หมายเลขอ้างอิงแฟ้ม *
                    </label>
                    <input
                      type="text"
                      value={formData.physicalLocation}
                      onChange={e => setFormData({ ...formData, physicalLocation: e.target.value })}
                      placeholder="เช่น แฟ้มเบอร์ 3 ชั้น B, ซองเอกสารสีแดง..."
                      className="w-full border border-sky-200 bg-white rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:border-sky-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium text-slate-700 mb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="archiveType"
                      checked={formData.archiveType === 'physical'}
                      onChange={() => setFormData({ ...formData, archiveType: 'physical' })}
                      className="text-sky-600 focus:ring-sky-500"
                    />
                    <span>แฟ้มกระดาษ (บันทึกเลขแฟ้มเก็บจริง)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="archiveType"
                      checked={formData.archiveType === 'digital'}
                      onChange={() => setFormData({ ...formData, archiveType: 'digital' })}
                      className="text-sky-600 focus:ring-sky-500"
                    />
                    <span>ไฟล์ดิจิทัล (บันทึกข้อมูลในระบบ)</span>
                  </label>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: A4 PRINT PREVIEW (Matches IrisPatient2.pdf exact layout) */}
          {activeTab === 'preview' && (
            <div className="flex flex-col items-center">
              
              <div className="mb-4 flex items-center justify-between w-full max-w-[210mm] print:hidden">
                <div className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                  <Printer size={15} className="text-emerald-600" />
                  <span>พรีวิวแบบฟอร์มเอกสาร A4 (ตามแบบ IrisPatient2.pdf)</span>
                </div>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={15} />
                  <span>สั่งพิมพ์เอกสาร A4</span>
                </button>
              </div>

              {/* Printable A4 Container */}
              <div 
                ref={printRef}
                className="iris-print-area bg-white text-black p-8 sm:p-10 shadow-xl border border-slate-300 w-full max-w-[210mm] min-h-[297mm] mx-auto text-xs leading-relaxed font-sans"
                style={{ fontFamily: "'Sarabun', 'Prompt', sans-serif" }}
              >
                {/* 1. Header with Logo & Title */}
                <div className="flex flex-col items-center justify-center mb-6 text-center">
                  <img 
                    src="/assets/iris-logo.png" 
                    alt="Iris Queen Nature" 
                    className="h-14 sm:h-16 object-contain mb-2"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="w-full flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-wide">
                      ประวัติลูกค้า
                    </h1>
                    <span className="text-sm font-bold text-slate-800">
                      {formData.branch || 'สาขาเกาะสมุย จังหวัดสุราษฎร์ธานี'}
                    </span>
                  </div>
                </div>

                {/* 2. Main 2-Column Table (Exact replica of IrisPatient2) */}
                <div className="border-2 border-black grid grid-cols-2 divide-x-2 divide-black">
                  
                  {/* LEFT COLUMN: ข้อมูลทางการแพทย์ */}
                  <div className="flex flex-col divide-y-2 divide-black">
                    <div className="bg-slate-100 py-1.5 px-3 font-bold text-center border-b-2 border-black">
                      ข้อมูลทางการแพทย์
                    </div>

                    <div className="p-2 min-h-[42px]">
                      <span className="font-bold">โรคประจำตัว: </span>
                      <span className="text-blue-800 font-semibold underline decoration-dotted">{formData.underlyingDisease || 'ไม่มี'}</span>
                    </div>

                    <div className="p-2 min-h-[42px]">
                      <span className="font-bold">ผลิตภัณฑ์ที่กำลังใช้: </span>
                      <span className="text-blue-800 font-semibold underline decoration-dotted">{formData.currentProducts || 'ไม่มี'}</span>
                    </div>

                    <div className="p-2 min-h-[42px]">
                      <span className="font-bold">ประเภทของสารเคมีที่ใช้: </span>
                      <span className="text-blue-800 font-semibold underline decoration-dotted">{formData.chemicalHistory || 'ปรอท+สเตียรอยด์+ไม่มี'}</span>
                    </div>

                    <div className="p-2 min-h-[42px]">
                      <span className="font-bold">การฉีด/รับประทานยา/อาหารเสริม: </span>
                      <span className="text-blue-800 font-semibold underline decoration-dotted">{formData.injectionsMedsSupplements || 'ไม่มี'}</span>
                    </div>

                    <div className="p-2 min-h-[42px]">
                      <span className="font-bold">ชนิดของผิว: </span>
                      <span className="text-blue-800 font-semibold underline decoration-dotted">{formData.skinType || 'ผิวผสม+ไม่มี'}</span>
                    </div>

                    <div className="p-2 space-y-1 bg-slate-50/50">
                      <div className="font-bold">คำแนะนำในการดูแลผิวและแก้ปัญหา:</div>
                      <div className="pl-1 space-y-0.5 text-[11px]">
                        <div>{formData.advice1}</div>
                        <div>{formData.advice2}</div>
                        <div>{formData.advice3}</div>
                      </div>
                    </div>

                    <div className="p-2 flex-1 flex flex-col justify-between bg-rose-50/30 text-[11px] text-rose-900 leading-snug">
                      <div className="space-y-1">
                        <div className="font-bold text-rose-800">*หมายเหตุ</div>
                        {formData.disclaimerNotes.map((note, nIdx) => (
                          <div key={nIdx}>• {note}</div>
                        ))}
                      </div>
                      <div className="mt-4 pt-2 border-t border-slate-300 font-bold text-slate-800">
                        หมายเลขอ้างอิง: <span className="font-mono text-black">{formData.refNo || 'IrisPatient2'}</span>
                        {formData.physicalLocation && (
                          <span className="block text-[10px] text-slate-600 font-normal">
                            ที่เก็บ: {formData.physicalLocation}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: ข้อมูลลูกค้า */}
                  <div className="flex flex-col divide-y-2 divide-black">
                    <div className="bg-slate-100 py-1.5 px-3 font-bold text-center border-b-2 border-black">
                      ข้อมูลลูกค้า
                    </div>

                    <div className="p-2 space-y-1">
                      <div>
                        <span className="font-bold">ชื่อลูกค้า: </span>
                        <span className="text-blue-800 font-bold">{formData.name || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold">เบอร์โทร: </span>
                          <span className="text-blue-800 font-bold font-mono">{formData.phone || '-'}</span>
                        </div>
                        <div>
                          <span className="font-bold">ID Line: </span>
                          <span className="text-blue-800">{formData.idLine || 'ไม่มี'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold">วันเดือนปีเกิด: </span>
                          <span className="text-blue-800">{formData.dob || '-'}</span>
                        </div>
                        {formData.age && (
                          <div>
                            <span className="font-bold">อายุ: </span>
                            <span className="text-blue-800">{formData.age} ปี</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="font-bold">ที่อยู่: </span>
                        <span className="text-blue-800">{formData.address || '-'}</span>
                      </div>
                      <div>
                        <span className="font-bold">อาชีพ: </span>
                        <span className="text-blue-800">{formData.occupation || 'รับจ้าง'}</span>
                      </div>
                    </div>

                    <div className="p-2 min-h-[42px] space-y-0.5">
                      <div>
                        <span className="font-bold">บริเวณที่เป็นเส้นเลือดฝอย: </span>
                        <span className="text-blue-800 font-semibold">{formData.capillaryArea || 'โหนกแก้ม'}</span>
                      </div>
                      <div>
                        <span className="font-bold">บริเวณที่มีปัญหาผิว: </span>
                        <span className="text-blue-800 font-semibold">{formData.problemAreas || 'ใต้คาง , แก้มซ้าย'}</span>
                      </div>
                    </div>

                    <div className="p-2 space-y-1 bg-slate-50/50">
                      <div className="font-bold">ขั้นตอนการดูแลและแก้ปัญหา:</div>
                      <div className="pl-1 space-y-0.5 text-[11px]">
                        <div>{formData.step1}</div>
                        <div>{formData.step2}</div>
                        <div>{formData.step3}</div>
                        <div>{formData.step4}</div>
                      </div>
                    </div>

                    <div className="p-2 min-h-[42px]">
                      <span className="font-bold">ผลิตภัณฑ์ที่ใช้ในการแก้ปัญหา: </span>
                      <span className="text-blue-800 font-bold">{formData.solutionProducts || 'ผงพอก+โทนเนอร์ยา'}</span>
                    </div>

                    {/* Contract & Signatures Area */}
                    <div className="p-2 flex-1 flex flex-col justify-between space-y-2">
                      <div className="text-[10px] leading-snug border-b border-slate-200 pb-2">
                        <span className="font-bold">ข้อสัญญา: </span>
                        <span>{formData.contractText}</span>
                      </div>

                      {/* Signatures */}
                      <div className="space-y-4 pt-1">
                        {/* Customer signature row */}
                        <div className="flex items-end justify-between">
                          <div className="w-1/2">
                            <span className="text-[11px] font-bold block mb-1">ลงชื่อลูกค้า:</span>
                            <div className="h-14 border-b border-black flex items-center justify-center relative">
                              {formData.customerSignature ? (
                                <img src={formData.customerSignature} alt="Customer Sig" className="max-h-full max-w-full object-contain" />
                              ) : (
                                <span className="text-[10px] text-slate-300">ลายเซ็นลูกค้า</span>
                              )}
                            </div>
                          </div>
                          <div className="text-[10px] font-bold text-slate-700">
                            วันที่: <span className="font-mono">{formData.customerSignDate}</span>
                          </div>
                        </div>

                        {/* Staff signature row */}
                        <div className="flex items-end justify-between">
                          <div className="w-1/2">
                            <span className="text-[11px] font-bold block mb-1">ลงชื่อเจ้าหน้าที่:</span>
                            <div className="h-14 border-b border-black flex items-center justify-center relative">
                              {formData.staffSignature ? (
                                <img src={formData.staffSignature} alt="Staff Sig" className="max-h-full max-w-full object-contain" />
                              ) : (
                                <span className="text-[10px] text-slate-300">ลายเซ็นเจ้าหน้าที่</span>
                              )}
                            </div>
                          </div>
                          <div className="text-[10px] font-bold text-slate-700">
                            วันที่: <span className="font-mono">{formData.staffSignDate}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Footer notes */}
                <div className="mt-4 pt-2 border-t border-slate-200 text-[9px] text-slate-400 flex items-center justify-between">
                  <span>ศูนย์ความงามไอริส ควีน เนเจอร์ (Iris Queen Nature Clinic)</span>
                  <span>พิมพ์เมื่อ: {formatDateTimeStr(new Date())}</span>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* 🌟 Footer Action Bar (Hidden during print) 🌟 */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white flex items-center justify-between gap-3 print:hidden shrink-0">
          <div className="text-xs text-slate-500 hidden sm:block">
            {formData.name ? (
              <span>บันทึกประวัติ: <strong className="text-slate-800">{formData.name}</strong> ({formData.phone})</span>
            ) : (
              <span>โปรดระบุชื่อและเบอร์โทรศัพท์ลูกค้า</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-xs transition-colors"
            >
              ยกเลิก
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Printer size={15} />
              <span>พิมพ์ใบ A4</span>
            </button>

            {!readOnly && (
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveForm}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Save size={16} />
                <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกลงแฟ้มเอกสาร'}</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Print Specific CSS injected for A4 perfection */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .iris-print-area, .iris-print-area * {
            visibility: visible !important;
          }
          .iris-print-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 12mm 15mm !important;
            box-shadow: none !important;
            border: none !important;
            font-size: 11pt !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
