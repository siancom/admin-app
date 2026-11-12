import React, { useState } from 'react';
import { 
  X, Database, Info, AlertTriangle, CheckCircle, 
  Copy, Search, Sparkles, Layers, DollarSign, Calendar, MapPin, Tag, Wrench
} from 'lucide-react';
import { updateDoc } from 'firebase/firestore';
import { getDocRef } from '../config/firebase';
import { getFuzzyKey } from '../utils/fuzzy';

export default function CourseDataInspectorModal({
  isOpen,
  onClose,
  course,
  masterCourses = [],
  onCourseUpdated,
  showToast
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [customCreditInput, setCustomCreditInput] = useState('');
  const [showEditCredit, setShowEditCredit] = useState(false);

  if (!isOpen || !course) return null;

  const rawCredit = getFuzzyKey(course, ["เครดิตที่ได้รับ", "เครดิตที่ได้", "ยอดเครดิต", "วงเงินคอร์ส", "เครดิต", "วงเงิน"]);
  const rawCreditRemain = getFuzzyKey(course, ["เครดิตคงเหลือ"]);
  const rawUsedCredit = getFuzzyKey(course, ["ใช้เครดิตแล้ว", "ยอดเบิก", "เบิกไปแล้ว"]);
  const courseNo = course.courseRefKey || getFuzzyKey(course, ["เลขที่ใบคอส", "col_2"]) || course.id;
  const isPos = String(courseNo || '').startsWith('IC');
  const courseCode = String(getFuzzyKey(course, ["รหัสคอส", "col_1", "code"]) || '').trim();
  const courseName = String(course.computedCourseName || getFuzzyKey(course, ["ชื่อคอส", "col_8"]) || '-');
  const totalQty = course.computedTotalQty ?? getFuzzyKey(course, ["จำนวนครั้งที่ได้", "col_4"]);
  const price = course.computedRealPrice ?? getFuzzyKey(course, ["ราคา", "col_13"]);
  const isAccidental = (rawCredit !== undefined && rawCredit !== '' && Number(rawCredit) > 0 && Number(rawCredit) <= 20 && Number(rawCredit) === Number(totalQty));

  // Match master course
  let matchedMaster = null;
  if (courseCode && Array.isArray(masterCourses)) {
    matchedMaster = masterCourses.find(m => {
      const code = String(getFuzzyKey(m, ["รหัสคอส", "col_1", "code"]) || '').trim().toLowerCase();
      return code && (code === courseCode.toLowerCase() || courseCode.toLowerCase().includes(code));
    });
  }

  // All keys in raw document
  const rawKeys = Object.keys(course).filter(k => 
    !k.startsWith('computed') && 
    k !== 'myHistories' && 
    k !== 'paperCoursePhotos'
  ).sort();

  const filteredKeys = rawKeys.filter(k => 
    k.toLowerCase().includes(searchTerm.toLowerCase()) || 
    String(course[k]).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopyJson = () => {
    try {
      const cleanObj = {};
      rawKeys.forEach(k => cleanObj[k] = course[k]);
      navigator.clipboard.writeText(JSON.stringify(cleanObj, null, 2));
      if (showToast) showToast('คัดลอกข้อมูล JSON เรียบร้อยแล้ว', 'success');
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearCredit = async () => {
    if (!window.confirm(`ยืนยันล้างค่าวงเงินเครดิตของใบคอร์ส "${courseNo}" ให้เป็น 0 บาท หรือไม่?`)) return;
    setIsUpdating(true);
    try {
      const courseRef = getDocRef('courses', course.id);
      const updateData = {
        "เครดิตที่ได้รับ": "0",
        "เครดิตคงเหลือ": "0",
        "col_14": course["col_14"] === 'จ่ายเต็ม' || course["col_14"] === 'แบ่งชำระ' ? course["col_14"] : ""
      };
      await updateDoc(courseRef, updateData);
      if (showToast) showToast('ล้างค่าวงเงินเครดิตเป็น 0 บาท สำเร็จแล้ว', 'success');
      if (onCourseUpdated) {
        onCourseUpdated({
          ...course,
          ...updateData,
          computedTotalCredit: 0,
          computedRemainCredit: 0
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
      if (showToast) showToast('เกิดข้อผิดพลาดในการบันทึก: ' + err.message, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveCustomCredit = async () => {
    const val = parseFloat(customCreditInput);
    if (isNaN(val) || val < 0) {
      if (showToast) showToast('กรุณาระบุจำนวนเงินที่ถูกต้อง', 'error');
      return;
    }
    setIsUpdating(true);
    try {
      const courseRef = getDocRef('courses', course.id);
      const updateData = {
        "เครดิตที่ได้รับ": String(val),
        "เครดิตคงเหลือ": String(val)
      };
      await updateDoc(courseRef, updateData);
      if (showToast) showToast(`บันทึกวงเงินเครดิตเป็น ฿${val.toLocaleString()} เรียบร้อยแล้ว`, 'success');
      if (onCourseUpdated) {
        onCourseUpdated({
          ...course,
          ...updateData,
          computedTotalCredit: val,
          computedRemainCredit: val
        });
      }
      setShowEditCredit(false);
      onClose();
    } catch (err) {
      console.error(err);
      if (showToast) showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[350] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-[28px] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex justify-between items-start shrink-0 relative overflow-hidden">
          <div className="relative z-10 flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center text-indigo-300 shrink-0 border border-white/10 shadow-inner">
              <Database size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-lg sm:text-xl">ที่มาของข้อมูลใบคอร์ส (Data Inspector)</h3>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${isPos ? 'bg-purple-500/30 text-purple-200 border border-purple-400/40' : 'bg-slate-700 text-slate-200 border border-slate-600'}`}>
                  {isPos ? 'ระบบใหม่ (POS)' : 'ระบบเก่า (AppSheet Migration)'}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono mt-0.5">Ref: {courseNo} | ID: {course.id}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors relative z-10 shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-slate-50/50">
          
          {/* 🌟 Summary Box 🌟 */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">ชื่อคอร์ส</p>
              <p className="font-black text-slate-800 line-clamp-1">{courseName}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">รหัสคอร์ส</p>
              <p className="font-bold text-indigo-600 font-mono line-clamp-1">{courseCode || '-'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">จำนวนครั้งที่ได้</p>
              <p className="font-black text-teal-600">{totalQty} ครั้ง</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">ราคาคอร์ส</p>
              <p className="font-black text-slate-800">฿{Number(price || 0).toLocaleString()}</p>
            </div>
          </div>

          {/* 🌟 Credit Deep-Dive Section 🌟 */}
          <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-amber-500"></div>
            <div className="pl-2">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <DollarSign size={18} className="text-amber-600" />
                  <h4 className="font-black text-sm text-slate-900">เจาะลึกที่มาของ "วงเงินเครดิต" ในใบคอร์สนี้</h4>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleClearCredit}
                    disabled={isUpdating}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95"
                  >
                    ล้างค่าเครดิตเป็น 0 บาท
                  </button>
                  <button 
                    onClick={() => setShowEditCredit(!showEditCredit)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    ✏️ ระบุยอดใหม่
                  </button>
                </div>
              </div>

              {showEditCredit && (
                <div className="mb-3 p-3 bg-amber-50/70 rounded-xl border border-amber-200 flex items-center gap-2 animate-in fade-in">
                  <span className="text-xs font-bold text-amber-900 shrink-0">กำหนดวงเงินเครดิตใหม่:</span>
                  <input 
                    type="number"
                    placeholder="เช่น 3000 หรือ 0"
                    value={customCreditInput}
                    onChange={(e) => setCustomCreditInput(e.target.value)}
                    className="bg-white border border-amber-300 rounded-lg px-2.5 py-1 text-xs font-bold w-36 outline-none"
                  />
                  <button 
                    onClick={handleSaveCustomCredit}
                    disabled={isUpdating}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold"
                  >
                    บันทึก
                  </button>
                </div>
              )}

              {/* Grid of Raw Credit Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs mb-3 font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">ฟิลด์ "เครดิตที่ได้รับ" (ดิบ):</span>
                  <strong className="text-slate-900 text-sm">{rawCredit !== undefined && rawCredit !== '' ? `"${rawCredit}"` : 'ว่าง (ไม่มี)'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">ฟิลด์ "เครดิตคงเหลือ" (ดิบ):</span>
                  <strong className="text-slate-900 text-sm">{rawCreditRemain !== undefined && rawCreditRemain !== '' ? `"${rawCreditRemain}"` : 'ว่าง (ไม่มี)'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">ฟิลด์ "ใช้เครดิตแล้ว" (ดิบ):</span>
                  <strong className="text-slate-900 text-sm">{rawUsedCredit !== undefined && rawUsedCredit !== '' ? `"${rawUsedCredit}"` : '0'}</strong>
                </div>
              </div>

              {/* Explanation Note */}
              {isAccidental ? (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs text-amber-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-black text-amber-800">
                    <AlertTriangle size={15} />
                    <span>คำอธิบายที่มาของเลข ฿{rawCredit} บาท:</span>
                  </div>
                  <p className="leading-relaxed">
                    • ในระบบเดิม (AppSheet / Google Sheets) คอร์สตั้งต้น <strong>{courseCode || courseName}</strong> มีจำนวนครั้งบริการคือ <strong>{totalQty} ครั้ง</strong>
                  </p>
                  <p className="leading-relaxed">
                    • ผู้สร้างคอร์สในระบบเดิมได้กรอกตัวเลข <strong>"{rawCredit}"</strong> ลงในช่อง <em>"เครดิตที่ได้รับ"</em> ซ้ำกับจำนวนครั้งบริการ ทำให้ระบบมองเห็นเป็นตัวเลข {rawCredit} บาท
                  </p>
                  <p className="leading-relaxed font-bold text-emerald-800">
                    ✅ ระบบอัปเดตใหม่ได้ทำการกรองอัตโนมัติแล้ว โดยตัดยอด ฿{rawCredit} ออกให้กลายเป็น 0 บาท เพื่อไม่ให้แสดงในใบพิมพ์หรือหลอกตาในรายงาน
                  </p>
                </div>
              ) : Number(rawCredit) > 0 ? (
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-xs text-teal-900">
                  <p>• คอร์สนี้มีวงเงินเครดิตระบุไว้ <strong>฿{Number(rawCredit).toLocaleString()} บาท</strong> สำหรับเบิกสินค้าหรือผลิตภัณฑ์</p>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600">
                  <p>• คอร์สนี้ไม่มีวงเงินเครดิต (ยอดเครดิตเป็น 0 บาท)</p>
                </div>
              )}

              {/* Master course mapping note */}
              {matchedMaster && (
                <div className="mt-3 pt-2.5 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                  <span>
                    คอร์สตั้งต้นที่เชื่อมโยง: <strong className="text-indigo-700">{matchedMaster["ชื่อคอส"] || matchedMaster["col_4"]}</strong> ({matchedMaster["รหัสคอส"] || matchedMaster["col_1"]})
                  </span>
                  {matchedMaster["เครดิตที่ได้รับ"] && (
                    <span className="text-amber-700 font-mono text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      เครดิตใน Master: "{matchedMaster["เครดิตที่ได้รับ"]}"
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 🌟 Raw Firestore Document Fields Explorer 🌟 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h4 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                  <Layers size={16} className="text-slate-600" />
                  ฟิลด์ทั้งหมดในฐานข้อมูล Firestore ({rawKeys.length} ฟิลด์)
                </h4>
                <p className="text-[10px] text-slate-400">
                  ข้อมูลดิบที่ถูกเก็บใน Document สำหรับตรวจสอบที่มาทุกอย่าง
                </p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs w-full sm:w-48">
                  <Search size={13} className="text-slate-400 mr-1.5" />
                  <input 
                    type="text" 
                    placeholder="ค้นหาฟิลด์หรือค่า..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="bg-transparent outline-none w-full text-slate-800" 
                  />
                  {searchTerm && <button onClick={() => setSearchTerm('')}><X size={12} className="text-slate-400" /></button>}
                </div>
                <button 
                  onClick={handleCopyJson} 
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0"
                  title="คัดลอกข้อมูลทั้งหมดเป็น JSON"
                >
                  <Copy size={13} /> คัดลอก
                </button>
              </div>
            </div>

            {/* Fields Table */}
            <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 text-xs">
              <table className="w-full border-collapse">
                <thead className="bg-slate-100 sticky top-0 text-slate-600 font-bold text-[11px]">
                  <tr>
                    <th className="p-2 text-left w-1/3 border-b border-slate-200">ชื่อฟิลด์ (Key)</th>
                    <th className="p-2 text-left border-b border-slate-200">ค่าในฐานข้อมูล (Value)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {filteredKeys.map((k) => {
                    const val = course[k];
                    const isCreditRelated = k.includes('เครดิต') || k === 'col_14' || k.includes('credit');
                    return (
                      <tr key={k} className={isCreditRelated ? 'bg-amber-50/60 font-bold' : 'hover:bg-slate-50'}>
                        <td className="p-2 text-slate-700 align-top select-all">
                          {k}
                          {isCreditRelated && <span className="ml-1 text-[9px] text-amber-700 bg-amber-100 px-1 rounded">เครดิต</span>}
                        </td>
                        <td className="p-2 text-slate-900 break-all select-all">
                          {val === null || val === undefined || val === '' ? (
                            <span className="text-slate-300 italic">ว่าง (empty)</span>
                          ) : typeof val === 'object' ? (
                            JSON.stringify(val)
                          ) : (
                            String(val)
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredKeys.length === 0 && (
                    <tr>
                      <td colSpan={2} className="p-6 text-center text-slate-400 italic">
                        ไม่พบฟิลด์ที่ตรงกับคำค้นหา
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
          <span>IrisCare Clinic • Data Inspector</span>
          <button 
            onClick={onClose} 
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors shadow-2xs"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
}
