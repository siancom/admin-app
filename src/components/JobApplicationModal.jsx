import React from 'react';
import { X, User, MapPin, Briefcase, Phone, Mail, GraduationCap, HeartPulse, ExternalLink, Calendar, CheckCircle, FileText } from 'lucide-react';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import EmploymentContractModal from './EmploymentContractModal';

export default function JobApplicationModal({ application, onClose }) {
  const [showContract, setShowContract] = React.useState(false);
  if (!application) return null;

  const handleStatusChange = async (newStatus) => {
    try {
      await updateDoc(doc(db, 'jobApplications', application.id), {
        status: newStatus
      });
      
      if (newStatus === 'hired' && window.confirm('ต้องการเพิ่มผู้สมัครรายนี้เข้าสู่ระบบรายชื่อพนักงานอัตโนมัติหรือไม่?')) {
        const empData = {
          name: `${application.firstName} ${application.lastName}`.trim(),
          phone: application.phone || '',
          branch: application.preferredBranch || 'เฉวง',
          baseSalary: parseInt(application.expectedSalary) || 0,
          commissionRate: 0,
          weeklyDaysOff: [],
          profileImage: application.photoUrl || '',
          employmentStatus: 'probation',
          employmentStartDate: new Date().toISOString().split('T')[0],
          probationDays: 119,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          jobApplicationId: application.id
        };
        await addDoc(collection(db, 'employees'), empData);
        alert('เพิ่มพนักงานเข้าสู่ระบบเรียบร้อยแล้ว (สามารถไปแก้ไขเงินเดือน/ค่าคอมมิชชั่น เพิ่มเติมได้ที่หน้าจัดการพนักงาน)');
      }
    } catch (error) {
      console.error("Error updating status: ", error);
      alert("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-sans">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 print:hidden">
        
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-5 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-3">
            <Briefcase size={24} className="text-indigo-200" />
            <div>
              <h2 className="text-xl font-black">ข้อมูลผู้สมัครงาน</h2>
              <p className="text-indigo-200 text-sm font-medium">{application.position} - สาขา{application.preferredBranch}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors no-print">
            <X size={24} />
          </button>
        </div>

        {/* Action Bar */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-wrap gap-4 justify-between items-center shrink-0 no-print">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-600">สถานะปัจจุบัน:</span>
            <select 
              value={application.status || 'new'} 
              onChange={(e) => handleStatusChange(e.target.value)}
              className={`px-4 py-2 rounded-xl text-sm font-bold border-2 outline-none appearance-none cursor-pointer ${
                application.status === 'new' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                application.status === 'reviewed' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                application.status === 'interviewed' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                application.status === 'hired' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                application.status === 'rejected' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="new">🌟 ใบสมัครใหม่</option>
              <option value="reviewed">👀 กำลังพิจารณา</option>
              <option value="interviewed">🗣️ นัดสัมภาษณ์แล้ว</option>
              <option value="hired">✅ รับเข้าทำงาน</option>
              <option value="rejected">❌ ไม่ผ่านการพิจารณา</option>
            </select>
          </div>
          <div className="flex gap-2">
            {application.status === 'hired' && (
              <button onClick={() => setShowContract(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-xl font-bold transition-colors text-sm border border-emerald-200 hover:border-emerald-600">
                <FileText size={16} /> พิมพ์สัญญาจ้าง
              </button>
            )}
            {application.photoUrl && (
              <a href={application.photoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl font-bold transition-colors text-sm border border-indigo-200 hover:border-indigo-600">
                <ExternalLink size={16} /> ดูรูปถ่าย
              </a>
            )}
            {application.resumeUrl && (
              <a href={application.resumeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl font-bold transition-colors text-sm border border-indigo-200 hover:border-indigo-600">
                <ExternalLink size={16} /> ดู Resume
              </a>
            )}
            {application.certUrl && (
              <a href={application.certUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl font-bold transition-colors text-sm border border-indigo-200 hover:border-indigo-600">
                <ExternalLink size={16} /> ดูใบรับรอง
              </a>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto bg-slate-50 flex-1 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ส่วนที่ 1: ประวัติส่วนตัว */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                <User className="text-indigo-500" size={20} /> ประวัติส่วนตัว
              </h3>
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="shrink-0 flex flex-col items-center sm:items-start mx-auto sm:mx-0">
                  <div className="w-28 h-36 bg-slate-100 rounded-xl overflow-hidden border-2 border-slate-200 flex items-center justify-center shadow-sm">
                    {application.photoUrl ? (
                      <img src={application.photoUrl} alt="รูปผู้สมัคร" className="w-full h-full object-cover" />
                    ) : (
                      <User size={48} className="text-slate-300" />
                    )}
                  </div>
                  {!application.photoUrl && <span className="text-xs text-slate-400 font-bold mt-2">ไม่มีรูปถ่าย</span>}
                </div>
                
                <div className="space-y-2 text-sm flex-1">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-slate-500 font-bold">ชื่อ-นามสกุล:</span>
                    <span className="col-span-2 font-medium text-slate-800">{application.firstName} {application.lastName} ({application.nickname || '-'})</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-slate-500 font-bold">อายุ:</span>
                    <span className="col-span-2 font-medium text-slate-800">{application.age || '-'} ปี (เกิด {application.dobDay ? `${application.dobDay}/${application.dobMonth}/${application.dobYearBE}` : '-'})</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-slate-500 font-bold">น้ำหนัก/ส่วนสูง:</span>
                    <span className="col-span-2 font-medium text-slate-800">{application.weight || '-'} กก. / {application.height || '-'} ซม.</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-slate-500 font-bold">สัญชาติ/ศาสนา:</span>
                    <span className="col-span-2 font-medium text-slate-800">{application.nationality || '-'} / {application.religion || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-slate-500 font-bold">บัตรประชาชน:</span>
                    <span className="col-span-2 font-medium text-slate-800">{application.idCardNumber || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-slate-500 font-bold">สถานภาพ:</span>
                    <span className="col-span-2 font-medium text-slate-800">{application.maritalStatus || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-slate-500 font-bold">โรคประจำตัว:</span>
                    <span className="col-span-2 font-medium text-slate-800">{application.healthCondition === 'มี' ? <span className="text-rose-600">มี: {application.healthConditionDetail}</span> : 'ไม่มี'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-slate-500 font-bold">ที่อยู่ปัจจุบัน:</span>
                    <span className="col-span-2 font-medium text-slate-800">{application.currentAddress || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ข้อมูลการติดต่อ & ตำแหน่ง */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Phone className="text-indigo-500" size={20} /> ข้อมูลการติดต่อ
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-slate-500 font-bold">เบอร์โทร:</span>
                    <span className="col-span-2 font-medium text-slate-800">{application.phone || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-slate-500 font-bold">Line ID:</span>
                    <span className="col-span-2 font-medium text-slate-800">{application.lineId || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-slate-500 font-bold">ฉุกเฉินติดต่อ:</span>
                    <span className="col-span-2 font-medium text-rose-600">{application.emergencyContactName} ({application.emergencyContactRelation})<br/>{application.emergencyContactPhone}</span>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 space-y-4">
                <h3 className="font-black text-indigo-900 flex items-center gap-2 border-b border-indigo-200 pb-2">
                  <Briefcase className="text-indigo-600" size={20} /> ตำแหน่งที่สมัคร
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-indigo-700 font-bold">ตำแหน่ง:</span>
                    <span className="col-span-2 font-black text-indigo-900">{application.position}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-indigo-700 font-bold">สาขาประจำ:</span>
                    <span className="col-span-2 font-bold text-indigo-900">{application.preferredBranch}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-indigo-700 font-bold">เงินเดือน:</span>
                    <span className="col-span-2 font-medium text-indigo-900">{application.expectedSalary || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-indigo-700 font-bold">เริ่มงานได้:</span>
                    <span className="col-span-2 font-medium text-indigo-900">
                      {application.startDateAvailability} {application.startDateDetail ? `(${application.startDateDetail})` : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ประวัติการศึกษา */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <GraduationCap className="text-indigo-500" size={20} /> ประวัติการศึกษาและการอบรม
            </h3>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 font-bold block mb-1">การศึกษาสูงสุด</span>
                  <p className="font-medium text-slate-800">
                    {application.educationLevel || '-'} {application.major ? `สาขา ${application.major}` : ''}
                    <br/>สถาบัน: {application.institution || '-'} (จบปี {application.graduationYear || '-'})
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block mb-1">หลักสูตรอบรมระยะสั้น</span>
                  <p className="font-medium text-slate-800">{application.shortCourses || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ประวัติการทำงาน */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Briefcase className="text-indigo-500" size={20} /> ประวัติการทำงาน
            </h3>
            <div className="space-y-4">
              {application.workExp1_company ? (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="font-bold text-slate-800 mb-2">1. {application.workExp1_company} <span className="text-slate-500 text-xs font-normal">({application.workExp1_duration})</span></h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <p><span className="text-slate-500 font-bold">ตำแหน่ง:</span> {application.workExp1_position}</p>
                    <p><span className="text-slate-500 font-bold">เงินเดือน:</span> {application.workExp1_salary}</p>
                    <p className="sm:col-span-2"><span className="text-slate-500 font-bold">หน้าที่:</span> {application.workExp1_duties}</p>
                    <p className="sm:col-span-2"><span className="text-slate-500 font-bold">สาเหตุที่ลาออก:</span> {application.workExp1_reasonForLeaving}</p>
                  </div>
                </div>
              ) : <p className="text-sm text-slate-500">- ไม่มีข้อมูลประวัติการทำงาน -</p>}
              
              {application.workExp2_company && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="font-bold text-slate-800 mb-2">2. {application.workExp2_company} <span className="text-slate-500 text-xs font-normal">({application.workExp2_duration})</span></h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <p><span className="text-slate-500 font-bold">ตำแหน่ง:</span> {application.workExp2_position}</p>
                    <p className="sm:col-span-2"><span className="text-slate-500 font-bold">หน้าที่:</span> {application.workExp2_duties}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ทักษะและความสามารถ */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <CheckCircle className="text-indigo-500" size={20} /> ทักษะและความสามารถ
            </h3>
            <div className="flex flex-wrap gap-2 text-sm">
              {application.skills_facialMassage && <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold">นวดหน้า / คลึงหน้า</span>}
              {application.skills_acneExtraction && <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold">กดสิว</span>}
              {application.skills_treatmentMachine && <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold">ใช้เครื่องมือทรีทเม้นท์</span>}
              {application.skills_bodyScrub && <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold">ทรีทเม้นท์ตัว / สครับตัว</span>}
              {application.skills_sales && <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold">ทักษะการขาย (Sales)</span>}
              
              {!application.skills_facialMassage && !application.skills_acneExtraction && !application.skills_treatmentMachine && !application.skills_bodyScrub && !application.skills_sales && (
                <span className="text-slate-500">- ไม่ได้ระบุทักษะพื้นฐาน -</span>
              )}
            </div>
            {application.skills_others && (
              <p className="text-sm mt-2"><span className="text-slate-500 font-bold">ทักษะอื่นๆ:</span> {application.skills_others}</p>
            )}
          </div>

          {/* ข้อมูลเพิ่มเติม */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <CheckCircle className="text-indigo-500" size={20} /> ข้อมูลเพิ่มเติม
            </h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-slate-500 font-bold block mb-1">ที่พักบนเกาะสมุย:</span> {application.accommodationOnSamui || '-'}</p>
              <p><span className="text-slate-500 font-bold block mb-1">ประวัติอาชญากรรม:</span> {application.criminalRecord === 'เคย' ? <span className="text-rose-600 font-bold">เคย: {application.criminalRecordDetail}</span> : 'ไม่เคย'}</p>
            </div>
          </div>

          {/* บุคคลที่ติดต่อได้ในกรณีฉุกเฉิน */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Phone className="text-indigo-500" size={20} /> บุคคลที่ติดต่อได้ในกรณีฉุกเฉิน
            </h3>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500 font-bold">ชื่อ-นามสกุล:</span>
                <span className="col-span-2 font-medium text-slate-800">{application.emergencyContactName || '-'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500 font-bold">ความสัมพันธ์:</span>
                <span className="col-span-2 font-medium text-slate-800">{application.emergencyContactRelation || '-'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500 font-bold">เบอร์โทรศัพท์:</span>
                <span className="col-span-2 font-medium text-slate-800">{application.emergencyContactPhone || '-'}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 no-print pb-6">
            <button onClick={onClose} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-sm">
              ปิดหน้าต่าง
            </button>
          </div>

        </div>
      </div>
      {showContract && (
        <EmploymentContractModal 
           employee={{
              name: `${application.firstName || ''} ${application.lastName || ''}`.trim(),
              branch: application.preferredBranch || 'เกาะสมุย',
              position: application.position || 'พนักงานทรีทเม้นท์ผิวหน้า (Facial Therapist)',
              idCard: application.idCardNumber,
              address: application.address,
              baseSalary: parseInt(application.expectedSalary) || null,
              employmentStartDate: new Date().toISOString(),
              probationDays: 119
           }}
           onClose={() => setShowContract(false)}
        />
      )}
    </div>
  );
}
