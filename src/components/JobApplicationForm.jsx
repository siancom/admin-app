import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, Briefcase, User, Phone, Mail, Calendar, DollarSign, FileText, Loader2, AlertCircle, MapPin, GraduationCap, HeartPulse, ShieldAlert, Users } from 'lucide-react';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import EmploymentContractModal from './EmploymentContractModal';

export default function JobApplicationForm({ branches = [] }) {
  const [showContract, setShowContract] = useState(false);
  const [formData, setFormData] = useState({
    // ส่วนที่ 1: ประวัติส่วนตัว (Personal Information)
    position: '',
    expectedSalary: '',
    preferredBranch: '',
    firstName: '',
    lastName: '',
    nickname: '',
    dobDay: '',
    dobMonth: '',
    dobYearBE: '',
    age: '',
    weight: '',
    height: '',
    nationality: '',
    religion: '',
    idCardNumber: '',
    currentAddress: '',
    phone: '',
    lineId: '',
    maritalStatus: '',
    healthCondition: 'ไม่มี',
    healthConditionDetail: '',

    // ส่วนที่ 2: ประวัติการศึกษา (Education)
    educationLevel: '',
    major: '',
    institution: '',
    graduationYear: '',
    shortCourses: '',

    // ส่วนที่ 3: ประวัติการทำงาน (Work Experience)
    workExp1_company: '',
    workExp1_duration: '',
    workExp1_position: '',
    workExp1_salary: '',
    workExp1_duties: '',
    workExp1_reasonForLeaving: '',

    workExp2_company: '',
    workExp2_duration: '',
    workExp2_position: '',
    workExp2_duties: '',

    // ส่วนที่ 4: ทักษะและความสามารถ (Skills & Abilities)
    skills_facialMassage: false,
    skills_acneExtraction: false,
    skills_treatmentMachine: false,
    skills_bodyScrub: false,
    skills_sales: false,
    skills_others: '',

    // ส่วนที่ 5: ข้อมูลเพิ่มเติม (Additional Information)
    startDateAvailability: '',
    startDateDetail: '',
    accommodationOnSamui: '',
    hasCertificate: 'ไม่มี',
    criminalRecord: 'ไม่เคย',
    criminalRecordDetail: '',

    // ส่วนที่ 6: บุคคลที่ติดต่อได้ในกรณีฉุกเฉิน (Emergency Contact)
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyContactPhone: '',
  });
  
  const [resumeFile, setResumeFile] = useState(null);
  const [certFile, setCertFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  // สำหรับตรวจสอบสถานะ
  const [mode, setMode] = useState('apply'); // 'apply' หรือ 'check'
  const [checkPhone, setCheckPhone] = useState('');
  const [checkIdCard, setCheckIdCard] = useState('');
  const [checkResult, setCheckResult] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState('');

  const POSITIONS = [
    'พนักงานทรีทเม้นท์ (Therapist) - ประจำ (Full-time)',
    'พนักงานทรีทเม้นท์ (Therapist) - พาร์ทไทม์ (Part-time)',
    'พนักงานพาร์ทไทม์รายวัน (Daily Part-time)'
  ];

  useEffect(() => {
    if (formData.dobYearBE) {
      const currentYearBE = new Date().getFullYear() + 543;
      const calculatedAge = currentYearBE - parseInt(formData.dobYearBE);
      if (calculatedAge >= 0) {
        setFormData(prev => ({ ...prev, age: calculatedAge.toString() }));
      }
    }
  }, [formData.dobYearBE]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.phone || !formData.position || !formData.preferredBranch || !formData.idCardNumber) {
      setError('กรุณากรอกข้อมูลที่จำเป็น (*) ให้ครบถ้วน');
      // scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    try {
      let resumeUrl = '';
      let certUrl = '';
      let photoUrl = '';
      
      const uploadFile = async (file, prefix) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `job_applications/${Date.now()}_${formData.phone}_${prefix}.${fileExt}`;
        const storageRef = ref(storage, fileName);
        const uploadTask = await uploadBytesResumable(storageRef, file);
        return await getDownloadURL(uploadTask.ref);
      };

      if (resumeFile) {
        resumeUrl = await uploadFile(resumeFile, 'resume');
      }
      if (certFile) {
        certUrl = await uploadFile(certFile, 'cert');
      }
      if (photoFile) {
        photoUrl = await uploadFile(photoFile, 'photo');
      }

      await addDoc(collection(db, 'jobApplications'), {
        ...formData,
        resumeUrl,
        certUrl,
        photoUrl,
        status: 'new', // new, reviewed, interviewed, hired, rejected
        appliedAt: serverTimestamp()
      });

      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error("Error submitting application:", err);
      setError('เกิดข้อผิดพลาดในการส่งใบสมัคร กรุณาลองใหม่อีกครั้ง');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckStatus = async (e) => {
    e.preventDefault();
    if (!checkPhone || !checkIdCard) {
      setCheckError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    
    setIsChecking(true);
    setCheckError('');
    setCheckResult(null);

    try {
      const q = query(
        collection(db, 'jobApplications'), 
        where('phone', '==', checkPhone), 
        where('idCardNumber', '==', checkIdCard)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setCheckError('ไม่พบข้อมูลใบสมัคร กรุณาตรวจสอบเบอร์โทรศัพท์และเลขบัตรประชาชนอีกครั้ง');
      } else {
        // Sort by appliedAt descending in memory if multiple, just to get latest
        const apps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        apps.sort((a,b) => new Date(b.appliedAt?.toDate?.() || 0) - new Date(a.appliedAt?.toDate?.() || 0));
        setCheckResult(apps[0]);
      }
    } catch (err) {
      console.error(err);
      setCheckError('เกิดข้อผิดพลาดในการตรวจสอบสถานะ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsChecking(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-white max-w-md w-full rounded-3xl shadow-xl p-8 text-center animate-in zoom-in-95">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={48} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">ส่งใบสมัครเรียบร้อย!</h2>
          <p className="text-slate-600 mb-8 font-medium">ศูนย์ความงามไอริสได้รับข้อมูลของคุณแล้ว<br/>และจะติดต่อกลับไปเพื่อนัดสัมภาษณ์ในลำดับถัดไป</p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-colors shadow-md hover:shadow-lg"
          >
            ส่งใบสมัครเพิ่มเติม
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="bg-indigo-600 rounded-t-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-lg">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          
          <div className="relative z-10 flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <button 
              type="button"
              onClick={() => { setMode('apply'); setCheckResult(null); setCheckError(''); }}
              className={`px-6 py-2.5 rounded-full font-bold transition-all ${mode === 'apply' ? 'bg-white text-indigo-600 shadow-md' : 'bg-indigo-500 text-indigo-100 hover:bg-indigo-400'}`}
            >
              สมัครงานใหม่
            </button>
            <button 
              type="button"
              onClick={() => { setMode('check'); setError(''); }}
              className={`px-6 py-2.5 rounded-full font-bold transition-all ${mode === 'check' ? 'bg-white text-indigo-600 shadow-md' : 'bg-indigo-500 text-indigo-100 hover:bg-indigo-400'}`}
            >
              ตรวจสอบสถานะใบสมัคร
            </button>
          </div>

          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Briefcase size={40} className="text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-2 tracking-tight">{mode === 'apply' ? 'ใบสมัครงาน (Job Application)' : 'ตรวจสอบสถานะใบสมัคร'}</h1>
          <h2 className="text-xl sm:text-2xl font-bold mb-4 text-indigo-100">ศูนย์ความงามไอริส (Iris Natures)</h2>
          {mode === 'apply' && <p className="text-indigo-100 text-lg font-medium max-w-2xl mx-auto">กรุณากรอกข้อมูลตามความเป็นจริงให้ครบถ้วน เพื่อประโยชน์ในการพิจารณา</p>}
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-b-3xl shadow-xl p-6 sm:p-10 mb-12">
          
          {mode === 'check' && (
            <div className="max-w-xl mx-auto py-8">
              <form onSubmit={handleCheckStatus} className="space-y-6">
                {checkError && (
                  <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-start gap-3 text-sm font-bold">
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <span>{checkError}</span>
                  </div>
                )}
                
                {!checkResult ? (
                  <>
                    <p className="text-slate-600 font-medium text-center mb-6">กรอกเบอร์โทรศัพท์และเลขบัตรประชาชนที่ใช้สมัคร เพื่อดูสถานะปัจจุบัน</p>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">เบอร์โทรศัพท์ <span className="text-rose-500">*</span></label>
                      <input type="tel" required value={checkPhone} onChange={e => setCheckPhone(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="08X-XXX-XXXX" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">เลขที่บัตรประชาชน <span className="text-rose-500">*</span></label>
                      <input type="text" required value={checkIdCard} onChange={e => setCheckIdCard(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="กรอกเฉพาะตัวเลข 13 หลัก" />
                    </div>
                    <button 
                      type="submit" 
                      disabled={isChecking} 
                      className="w-full mt-4 flex justify-center items-center py-4 px-4 border border-transparent rounded-2xl shadow-md text-lg font-black text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 transition-all"
                    >
                      {isChecking ? <Loader2 className="animate-spin h-6 w-6" /> : 'ตรวจสอบสถานะ'}
                    </button>
                  </>
                ) : (
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 sm:p-8 text-center animate-in zoom-in-95">
                    <div className="w-20 h-20 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-1">{checkResult.firstName} {checkResult.lastName}</h3>
                    <p className="text-slate-500 font-medium mb-6">ตำแหน่ง: {checkResult.position}</p>
                    
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 mb-6">
                      <p className="text-sm font-bold text-slate-500 mb-3">สถานะใบสมัครของคุณ:</p>
                      {checkResult.status === 'new' && <div className="text-xl font-black text-blue-600 bg-blue-50 py-3 rounded-xl border border-blue-200">🌟 ได้รับใบสมัครแล้ว</div>}
                      {checkResult.status === 'reviewed' && <div className="text-xl font-black text-amber-600 bg-amber-50 py-3 rounded-xl border border-amber-200">👀 กำลังพิจารณา</div>}
                      {checkResult.status === 'interviewed' && <div className="text-xl font-black text-purple-600 bg-purple-50 py-3 rounded-xl border border-purple-200">🗣️ ติดต่อนัดสัมภาษณ์แล้ว</div>}
                      {checkResult.status === 'hired' && (
                        <div className="space-y-4">
                          <div className="text-xl font-black text-emerald-600 bg-emerald-50 py-3 rounded-xl border border-emerald-200">✅ รับเข้าทำงาน</div>
                          <div className="flex flex-col gap-3 pt-2">
                             <button type="button" onClick={() => setShowContract(true)} className="w-full flex justify-center items-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-sm">
                               <FileText size={20} /> หนังสือสัญญาจ้างงาน / ข้อตกลงการจ้างงาน
                             </button>
                             <a href="/" className="w-full flex justify-center items-center gap-2 py-3 bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-bold rounded-xl transition-colors shadow-sm">
                               <Briefcase size={20} /> เข้าสู่ระบบพนักงาน (Employee Dashboard)
                             </a>
                          </div>
                        </div>
                      )}
                      {checkResult.status === 'rejected' && <div className="text-xl font-black text-rose-600 bg-rose-50 py-3 rounded-xl border border-rose-200">❌ ไม่ผ่านการพิจารณา</div>}
                    </div>

                    <button 
                      type="button" 
                      onClick={() => { setCheckResult(null); setCheckPhone(''); setCheckIdCard(''); }} 
                      className="text-indigo-600 font-bold hover:underline"
                    >
                      ตรวจสอบคนอื่น / ตรวจสอบอีกครั้ง
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {showContract && checkResult && (
            <EmploymentContractModal 
               employee={{
                  name: `${checkResult.firstName || ''} ${checkResult.lastName || ''}`.trim(),
                  branch: checkResult.preferredBranch || 'เกาะสมุย',
                  position: checkResult.position || 'พนักงานทรีทเม้นท์ผิวหน้า (Facial Therapist)',
                  idCard: checkResult.idCardNumber,
                  address: checkResult.currentAddress,
                  baseSalary: parseInt(checkResult.expectedSalary) || null,
                  employmentStartDate: new Date().toISOString(),
                  probationDays: 119
               }}
               onClose={() => setShowContract(false)}
            />
          )}

          {mode === 'apply' && (
            <>
              {error && (
            <div className="mb-8 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-start gap-3 text-sm font-bold animate-in slide-in-from-top-2">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-12">
            
            {/* Section 0: ตำแหน่งที่สมัคร */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                <Briefcase className="text-indigo-600" size={24} />
                <h3 className="text-xl font-black text-slate-800">ตำแหน่งที่สมัคร (Position Applied)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <label className="block text-sm font-bold text-slate-700 mb-2">ตำแหน่ง <span className="text-rose-500">*</span></label>
                  <select required name="position" value={formData.position} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium appearance-none">
                    <option value="" disabled>-- เลือกตำแหน่ง --</option>
                    {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                  </select>
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-bold text-slate-700 mb-2">สาขาที่ต้องการประจำ <span className="text-rose-500">*</span></label>
                  <select required name="preferredBranch" value={formData.preferredBranch} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium appearance-none">
                    <option value="" disabled>-- เลือกสาขา --</option>
                    {branches.length > 0 ? (
                      branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)
                    ) : (
                      <>
                        <option value="เฉวง">เฉวง</option>
                        <option value="ละไม">ละไม</option>
                        <option value="นทอน">หน้าทอน</option>
                        <option value="อื่นๆ">อื่นๆ</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    {formData.position.includes('รายวัน') ? 'ค่าจ้างที่คาดหวัง (บาท/วัน)' : 'เงินเดือนที่คาดหวัง (บาท/เดือน)'}
                  </label>
                  <input type="text" name="expectedSalary" value={formData.expectedSalary} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium" placeholder={formData.position.includes('รายวัน') ? "เช่น วันละ 350-400 ตามความสามารถ" : "เช่น 15,000"} />
                </div>
              </div>
            </div>

            {/* Section 1: ประวัติส่วนตัว */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                <User className="text-indigo-600" size={24} />
                <h3 className="text-xl font-black text-slate-800">ส่วนที่ 1: ประวัติส่วนตัว (Personal Information)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">ชื่อจริง (ภาษาไทย) <span className="text-rose-500">*</span></label>
                  <input type="text" required name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">นามสกุล <span className="text-rose-500">*</span></label>
                  <input type="text" required name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">ชื่อเล่น <span className="text-rose-500">*</span></label>
                  <input type="text" required name="nickname" value={formData.nickname} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">วัน/เดือน/ปีเกิด (พ.ศ.) <span className="text-rose-500">*</span></label>
                  <div className="grid grid-cols-3 gap-2">
                    <select required name="dobDay" value={formData.dobDay} onChange={handleInputChange} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium appearance-none">
                      <option value="">วัน</option>
                      {Array.from({length: 31}, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select required name="dobMonth" value={formData.dobMonth} onChange={handleInputChange} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium appearance-none">
                      <option value="">เดือน</option>
                      {['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'].map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                    </select>
                    <select required name="dobYearBE" value={formData.dobYearBE} onChange={handleInputChange} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium appearance-none">
                      <option value="">ปี พ.ศ.</option>
                      {Array.from({length: 80}, (_, i) => new Date().getFullYear() + 543 - 15 - i).map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">อายุ (ปี)</label>
                  <input type="number" name="age" value={formData.age} onChange={handleInputChange} readOnly className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl outline-none font-bold text-indigo-700" placeholder="คำนวณอัตโนมัติ" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">น้ำหนัก (กก.)</label>
                  <input type="number" name="weight" value={formData.weight} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">ส่วนสูง (ซม.)</label>
                  <input type="number" name="height" value={formData.height} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">สัญชาติ / ศาสนา</label>
                  <div className="flex gap-2">
                    <input type="text" name="nationality" value={formData.nationality} onChange={handleInputChange} placeholder="สัญชาติ" className="w-1/2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
                    <input type="text" name="religion" value={formData.religion} onChange={handleInputChange} placeholder="ศาสนา" className="w-1/2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
                  </div>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-sm font-bold text-slate-700 mb-2">เลขที่บัตรประชาชน (13 หลัก) <span className="text-rose-500">*</span></label>
                  <input type="text" required maxLength="13" name="idCardNumber" value={formData.idCardNumber} onChange={handleInputChange} className="w-full md:w-1/2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium tracking-widest" placeholder="X-XXXX-XXXXX-XX-X" />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-sm font-bold text-slate-700 mb-2">ที่อยู่ปัจจุบัน (ที่พักบนเกาะสมุย ถ้ามี)</label>
                  <textarea rows="2" name="currentAddress" value={formData.currentAddress} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="บ้านเลขที่ ซอย ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"></textarea>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">เบอร์โทรศัพท์ <span className="text-rose-500">*</span></label>
                  <input type="tel" required name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="08X-XXX-XXXX" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Line ID</label>
                  <input type="text" name="lineId" value={formData.lineId} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">สถานภาพ</label>
                  <select name="maritalStatus" value={formData.maritalStatus} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium appearance-none">
                    <option value="">-- เลือกระบุ --</option>
                    <option value="โสด">โสด</option>
                    <option value="สมรส">สมรส</option>
                    <option value="หย่าร้าง">หย่าร้าง</option>
                  </select>
                </div>

                <div className="md:col-span-3 bg-orange-50 p-4 rounded-2xl border border-orange-100 flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="flex gap-2 items-center text-orange-700 shrink-0">
                    <HeartPulse size={20} />
                    <span className="font-bold">สุขภาพ/โรคประจำตัว:</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="healthCondition" value="ไม่มี" checked={formData.healthCondition === 'ไม่มี'} onChange={handleInputChange} className="w-4 h-4 text-indigo-600" />
                      <span className="font-bold text-slate-700">ไม่มี</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="healthCondition" value="มี" checked={formData.healthCondition === 'มี'} onChange={handleInputChange} className="w-4 h-4 text-indigo-600" />
                      <span className="font-bold text-slate-700">มี (โปรดระบุ)</span>
                    </label>
                  </div>
                  {formData.healthCondition === 'มี' && (
                    <input type="text" name="healthConditionDetail" value={formData.healthConditionDetail} onChange={handleInputChange} placeholder="ระบุโรคประจำตัว..." className="flex-1 px-4 py-2 bg-white border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium" />
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: ประวัติการศึกษา */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                <GraduationCap className="text-indigo-600" size={24} />
                <h3 className="text-xl font-black text-slate-800">ส่วนที่ 2: ประวัติการศึกษา (Education)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">ระดับการศึกษาสูงสุด</label>
                  <input type="text" name="educationLevel" value={formData.educationLevel} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="เช่น ม.6, ปวช, ปริญญาตรี" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">สาขาวิชา</label>
                  <input type="text" name="major" value={formData.major} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">ชื่อสถาบันการศึกษา</label>
                  <input type="text" name="institution" value={formData.institution} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">ปีที่สำเร็จการศึกษา</label>
                  <input type="text" name="graduationYear" value={formData.graduationYear} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="เช่น 2565" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">หลักสูตรอบรมระยะสั้นที่เกี่ยวข้อง (เช่น เรียนนวดหน้า, สปา)</label>
                  <input type="text" name="shortCourses" value={formData.shortCourses} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
                </div>
              </div>
            </div>

            {/* Section 3: ประวัติการทำงาน */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                <Briefcase className="text-indigo-600" size={24} />
                <h3 className="text-xl font-black text-slate-800">ส่วนที่ 3: ประวัติการทำงาน (เริ่มจากที่ทำงานล่าสุด)</h3>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-bold text-indigo-700 mb-2">1. สถานที่ทำงานล่าสุด</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">ชื่อสถานที่ทำงาน</label>
                    <input type="text" name="workExp1_company" value={formData.workExp1_company} onChange={handleInputChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-indigo-500 font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">ระยะเวลาที่ทำงาน</label>
                    <input type="text" name="workExp1_duration" value={formData.workExp1_duration} onChange={handleInputChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-indigo-500 font-medium" placeholder="เช่น 1 ปี 2 เดือน" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">ตำแหน่ง</label>
                    <input type="text" name="workExp1_position" value={formData.workExp1_position} onChange={handleInputChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-indigo-500 font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">เงินเดือนล่าสุด</label>
                    <input type="text" name="workExp1_salary" value={formData.workExp1_salary} onChange={handleInputChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-indigo-500 font-medium" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">ลักษณะงานที่รับผิดชอบ</label>
                    <input type="text" name="workExp1_duties" value={formData.workExp1_duties} onChange={handleInputChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-indigo-500 font-medium" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">สาเหตุที่ลาออก</label>
                    <input type="text" name="workExp1_reasonForLeaving" value={formData.workExp1_reasonForLeaving} onChange={handleInputChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-indigo-500 font-medium" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-bold text-indigo-700 mb-2">2. สถานที่ทำงานก่อนหน้า (ถ้ามี)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">ชื่อสถานที่ทำงาน</label>
                    <input type="text" name="workExp2_company" value={formData.workExp2_company} onChange={handleInputChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-indigo-500 font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">ระยะเวลาที่ทำงาน</label>
                    <input type="text" name="workExp2_duration" value={formData.workExp2_duration} onChange={handleInputChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-indigo-500 font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">ตำแหน่ง</label>
                    <input type="text" name="workExp2_position" value={formData.workExp2_position} onChange={handleInputChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-indigo-500 font-medium" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">ลักษณะงานที่รับผิดชอบ</label>
                    <input type="text" name="workExp2_duties" value={formData.workExp2_duties} onChange={handleInputChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-indigo-500 font-medium" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: ทักษะและความสามารถ */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                <CheckCircle className="text-indigo-600" size={24} />
                <h3 className="text-xl font-black text-slate-800">ส่วนที่ 4: ทักษะและความสามารถ (Skills)</h3>
              </div>
              <p className="text-sm font-bold text-slate-500 mb-2">โปรดเลือกช่องที่ตรงกับความสามารถของคุณ</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-indigo-50 transition-colors">
                  <input type="checkbox" name="skills_facialMassage" checked={formData.skills_facialMassage} onChange={handleInputChange} className="w-5 h-5 text-indigo-600 rounded" />
                  <span className="font-bold text-slate-700">การนวดหน้า / คลึงหน้า (Facial Massage)</span>
                </label>
                <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-indigo-50 transition-colors">
                  <input type="checkbox" name="skills_acneExtraction" checked={formData.skills_acneExtraction} onChange={handleInputChange} className="w-5 h-5 text-indigo-600 rounded" />
                  <span className="font-bold text-slate-700">การกดสิว (Acne Extraction)</span>
                </label>
                <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-indigo-50 transition-colors">
                  <input type="checkbox" name="skills_treatmentMachine" checked={formData.skills_treatmentMachine} onChange={handleInputChange} className="w-5 h-5 text-indigo-600 rounded" />
                  <span className="font-bold text-slate-700">การใช้เครื่องมือ (เช่น Phono, พ่นโอโซน)</span>
                </label>
                <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-indigo-50 transition-colors">
                  <input type="checkbox" name="skills_bodyScrub" checked={formData.skills_bodyScrub} onChange={handleInputChange} className="w-5 h-5 text-indigo-600 rounded" />
                  <span className="font-bold text-slate-700">การทำทรีทเม้นท์ตัว / สครับตัว</span>
                </label>
                <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-indigo-50 transition-colors">
                  <input type="checkbox" name="skills_sales" checked={formData.skills_sales} onChange={handleInputChange} className="w-5 h-5 text-indigo-600 rounded" />
                  <span className="font-bold text-slate-700">ทักษะการเชียร์ขายคอร์สและผลิตภัณฑ์ (Sales)</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">ทักษะอื่นๆ (ถ้ามี)</label>
                <input type="text" name="skills_others" value={formData.skills_others} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="พิมพ์ทักษะเพิ่มเติม..." />
              </div>
            </div>

            {/* Section 5: ข้อมูลเพิ่มเติม */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                <FileText className="text-indigo-600" size={24} />
                <h3 className="text-xl font-black text-slate-800">ส่วนที่ 5: ข้อมูลเพิ่มเติม (Additional Information)</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">คุณสามารถเริ่มงานได้เมื่อใด?</label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="startDateAvailability" value="ทันที" checked={formData.startDateAvailability === 'ทันที'} onChange={handleInputChange} className="w-4 h-4 text-indigo-600" />
                      <span className="font-medium text-slate-700">ทันที</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="startDateAvailability" value="ระบุวัน" checked={formData.startDateAvailability === 'ระบุวัน'} onChange={handleInputChange} className="w-4 h-4 text-indigo-600" />
                      <span className="font-medium text-slate-700">ภายในวัน หรือ วันที่ระบุ:</span>
                    </label>
                    {formData.startDateAvailability === 'ระบุวัน' && (
                      <input type="text" name="startDateDetail" value={formData.startDateDetail} onChange={handleInputChange} placeholder="เช่น ภายใน 15 วัน หรือ วันที่..." className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-sm" />
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">ปัจจุบันคุณมีที่พักบนเกาะสมุยหรือไม่?</label>
                  <div className="flex flex-col sm:flex-row gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="accommodationOnSamui" value="มี" checked={formData.accommodationOnSamui === 'มี'} onChange={handleInputChange} className="w-4 h-4 text-indigo-600" />
                      <span className="font-medium text-slate-700">มี</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="accommodationOnSamui" value="ไม่มี ต้องการสวัสดิการ" checked={formData.accommodationOnSamui === 'ไม่มี ต้องการสวัสดิการ'} onChange={handleInputChange} className="w-4 h-4 text-indigo-600" />
                      <span className="font-medium text-slate-700">ไม่มี ต้องการให้ทางคลินิกช่วยหา/มีสวัสดิการ</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">คุณมีประวัติอาชญากรรมหรือไม่?</label>
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="criminalRecord" value="ไม่เคย" checked={formData.criminalRecord === 'ไม่เคย'} onChange={handleInputChange} className="w-4 h-4 text-indigo-600" />
                      <span className="font-medium text-slate-700">ไม่เคย</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="criminalRecord" value="เคย" checked={formData.criminalRecord === 'เคย'} onChange={handleInputChange} className="w-4 h-4 text-indigo-600" />
                      <span className="font-medium text-slate-700">เคย (โปรดระบุ):</span>
                    </label>
                    {formData.criminalRecord === 'เคย' && (
                      <input type="text" name="criminalRecordDetail" value={formData.criminalRecordDetail} onChange={handleInputChange} placeholder="ระบุรายละเอียด..." className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-sm w-full sm:w-auto" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 6: บุคคลที่ติดต่อได้ในกรณีฉุกเฉิน */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                <Users className="text-indigo-600" size={24} />
                <h3 className="text-xl font-black text-slate-800">ส่วนที่ 6: บุคคลที่ติดต่อได้ในกรณีฉุกเฉิน (Emergency Contact)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">ชื่อ-นามสกุล</label>
                  <input type="text" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">ความสัมพันธ์</label>
                  <input type="text" name="emergencyContactRelation" value={formData.emergencyContactRelation} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">เบอร์โทรศัพท์</label>
                  <input type="tel" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
                </div>
              </div>
            </div>

            {/* อัพโหลดเอกสาร */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                <Upload className="text-indigo-600" size={24} />
                <h3 className="text-xl font-black text-slate-800">เอกสารแนบประกอบการพิจารณา</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">1. รูปถ่าย / เซลฟี่หน้าตรง <span className="text-rose-500">*</span></label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors cursor-pointer relative bg-slate-50" onClick={() => document.getElementById('photo-upload').click()}>
                    <div className="space-y-2 text-center">
                      <Upload className="mx-auto h-8 w-8 text-slate-400" />
                      <div className="flex text-sm text-slate-600 justify-center">
                        <span className="font-bold text-indigo-600">
                          {photoFile ? photoFile.name : 'คลิกเพื่อเลือกไฟล์'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">PNG, JPG (สูงสุด 5MB)</p>
                    </div>
                    <input required id="photo-upload" type="file" className="sr-only" onChange={(e) => e.target.files[0] && setPhotoFile(e.target.files[0])} accept=".png,.jpg,.jpeg" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">2. อัพโหลด Resume (ถ้ามี)</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors cursor-pointer relative bg-slate-50" onClick={() => document.getElementById('resume-upload').click()}>
                    <div className="space-y-2 text-center">
                      <Upload className="mx-auto h-8 w-8 text-slate-400" />
                      <div className="flex text-sm text-slate-600 justify-center">
                        <span className="font-bold text-indigo-600">
                          {resumeFile ? resumeFile.name : 'คลิกเพื่อเลือกไฟล์'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">PDF, PNG, JPG (สูงสุด 5MB)</p>
                    </div>
                    <input id="resume-upload" type="file" className="sr-only" onChange={(e) => e.target.files[0] && setResumeFile(e.target.files[0])} accept=".pdf,.png,.jpg,.jpeg" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">3. ใบรับรอง/ใบประกาศ (ถ้ามี)</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors cursor-pointer relative bg-slate-50" onClick={() => document.getElementById('cert-upload').click()}>
                    <div className="space-y-2 text-center">
                      <Upload className="mx-auto h-8 w-8 text-slate-400" />
                      <div className="flex text-sm text-slate-600 justify-center">
                        <span className="font-bold text-indigo-600">
                          {certFile ? certFile.name : 'คลิกเพื่อเลือกไฟล์'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">PDF, PNG, JPG (สูงสุด 5MB)</p>
                    </div>
                    <input id="cert-upload" type="file" className="sr-only" onChange={(e) => e.target.files[0] && setCertFile(e.target.files[0])} accept=".pdf,.png,.jpg,.jpeg" />
                  </div>
                </div>
              </div>
            </div>

            {/* Declaration */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <h4 className="font-black text-amber-800 mb-2 flex items-center gap-2"><ShieldAlert size={20} /> คำรับรอง (Declaration)</h4>
              <p className="text-sm font-medium text-amber-900">
                ข้าพเจ้าขอรับรองว่าข้อความทั้งหมดในใบสมัครนี้เป็นความจริงทุกประการ 
                หากศูนย์ความงามไอริสตรวจสอบพบว่าข้อความใดเป็นเท็จ ข้าพเจ้ายินยอมให้ยกเลิกการพิจารณาหรือการว่าจ้างทันทีโดยไม่มีข้อเรียกร้องใดๆ
              </p>
            </div>

            <div className="pt-6">
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full flex justify-center items-center py-5 px-4 border border-transparent rounded-2xl shadow-xl text-lg font-black text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 transition-all active:scale-95"
              >
                {isSubmitting ? (
                  <><Loader2 className="animate-spin -ml-1 mr-3 h-6 w-6" /> กำลังส่งใบสมัครและบันทึกข้อมูล...</>
                ) : (
                  <><CheckCircle className="-ml-1 mr-2 h-6 w-6" /> ยอมรับเงื่อนไขและส่งใบสมัครงาน</>
                )}
              </button>
            </div>
          </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
