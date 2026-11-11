import React, { useState } from 'react';
import { 
  X, Lock, Unlock, Camera, Upload, Trash2, CheckCircle, 
  AlertTriangle, FileText, Loader2, Sparkles, Image as ImageIcon, Eye
} from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { updateDoc } from 'firebase/firestore';
import { storage, getDocRef } from '../config/firebase';
import { getFuzzyKey } from '../utils/fuzzy';

export default function CloseCourseModal({
  isOpen,
  onClose,
  course,
  activeStaff,
  onSuccess,
  showToast
}) {
  const [closeReason, setCloseReason] = useState('ใช้บริการครบแล้วในใบคอร์สกระดาษเดิม');
  const [closeNote, setCloseNote] = useState('');
  const [closedByName, setClosedByName] = useState(() => activeStaff?.name || '');
  const [syncFullUsage, setSyncFullUsage] = useState(true);
  const [photos, setPhotos] = useState(() => course?.paperCoursePhotos || []);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  if (!isOpen || !course) return null;

  const totalQty = Number(course.computedTotalQty ?? 1);
  const usedQty = Number(course.computedUsedQty ?? 0);
  const remainQty = Number(course.computedRemainQty ?? (totalQty - usedQty));
  const isAlreadyClosed = course.isClosed || course.computedStatus === 'ปิดคอร์สแล้ว';

  // Handle Photo selection and compression
  const handlePhotoSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(10);
    try {
      const newPhotoUrls = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // 1. Compress image to reasonable size
        let compressedFile = file;
        try {
          compressedFile = await imageCompression(file, {
            maxSizeMB: 0.8,
            maxWidthOrHeight: 1600,
            useWebWorker: true
          });
        } catch (compErr) {
          console.warn('Image compression fallback:', compErr);
        }

        // 2. Upload to Firebase Storage or Fallback to base64
        try {
          const fileExt = file.name ? file.name.split('.').pop() : 'jpg';
          const fileName = `paper_${Date.now()}_${i}.${fileExt}`;
          const storageRef = ref(storage, `paper_courses/${course.id || 'new'}/${fileName}`);
          const uploadTask = uploadBytesResumable(storageRef, compressedFile);

          const downloadUrl = await new Promise((resolve, reject) => {
            uploadTask.on(
              'state_changed',
              (snap) => {
                const prog = (snap.bytesTransferred / snap.totalBytes) * 100;
                setUploadProgress(Math.round(prog));
              },
              (err) => reject(err),
              async () => {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(url);
              }
            );
          });
          newPhotoUrls.push(downloadUrl);
        } catch (storageErr) {
          console.warn('Storage upload failed, falling back to DataURL:', storageErr);
          // Fallback to base64 data url
          const reader = new FileReader();
          const dataUrl = await new Promise((resolve) => {
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(compressedFile);
          });
          newPhotoUrls.push(dataUrl);
        }
      }

      setPhotos((prev) => [...prev, ...newPhotoUrls]);
      if (showToast) showToast('แนบรูปถ่ายใบคอร์สกระดาษสำเร็จ', 'success');
    } catch (err) {
      console.error('Photo upload error:', err);
      if (showToast) showToast('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ', 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Confirm Close Course
  const handleConfirmClose = async () => {
    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const courseRef = getDocRef('courses', course.id);

      const updateData = {
        isClosed: true,
        "สถานะ": 'ปิดคอร์สแล้ว',
        closeReason,
        closeNote: closeNote.trim(),
        closedAt: now,
        closedBy: closedByName.trim() || 'แอดมิน',
        paperCoursePhotos: photos
      };

      // If user chose to sync paper usage as complete
      if (syncFullUsage && closeReason === 'ใช้บริการครบแล้วในใบคอร์สกระดาษเดิม') {
        updateData["ครั้งที่ใช้"] = String(totalQty);
        updateData["paperUsedQty"] = totalQty;
      }

      await updateDoc(courseRef, updateData);

      if (showToast) showToast('บันทึกปิดคอร์สเรียบร้อยแล้ว (ประทับลายน้ำปิดคอร์ส)', 'success');
      if (onSuccess) onSuccess({ ...course, ...updateData, computedStatus: 'ปิดคอร์สแล้ว' });
      onClose();
    } catch (err) {
      console.error('Close course error:', err);
      if (showToast) showToast('เกิดข้อผิดพลาดในการปิดคอร์ส: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reopen Course
  const handleReopenCourse = async () => {
    if (!window.confirm('ยืนยันเปิดคอร์สนี้กลับมาใช้งานอีกครั้งหรือไม่?')) return;
    setIsSubmitting(true);
    try {
      const courseRef = getDocRef('courses', course.id);
      const updateData = {
        isClosed: false,
        "สถานะ": 'ยังคงเหลือ',
        reopenedAt: new Date().toISOString(),
        reopenedBy: closedByName.trim() || 'แอดมิน'
      };

      await updateDoc(courseRef, updateData);

      if (showToast) showToast('เปิดคอร์สกลับมาใช้งานเรียบร้อยแล้ว', 'success');
      if (onSuccess) onSuccess({ ...course, ...updateData, computedStatus: 'ยังคงเหลือ' });
      onClose();
    } catch (err) {
      console.error('Reopen course error:', err);
      if (showToast) showToast('เกิดข้อผิดพลาดในการเปิดคอร์ส: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-[28px] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className={`p-5 sm:p-6 border-b flex justify-between items-center text-white ${isAlreadyClosed ? 'bg-gradient-to-r from-rose-600 to-red-600 border-rose-500' : 'bg-gradient-to-r from-slate-800 to-slate-900 border-slate-700'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white shrink-0 shadow-inner">
              {isAlreadyClosed ? <Lock size={20} /> : <FileText size={20} />}
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg leading-tight">
                {isAlreadyClosed ? 'ใบคอร์สนี้ถูกปิดแล้ว' : 'ปิดคอร์สรับบริการ / บันทึกจบใบคอร์ส'}
              </h3>
              <p className="text-[11px] text-white/80 font-medium">
                {isAlreadyClosed ? 'จัดการหลักฐานใบคอร์สกระดาษ หรือเปิดคอร์สใหม่' : 'ใช้ควบคู่กับใบคอร์สกระดาษ และประทับลายน้ำปิดคอร์ส'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-slate-50/50">
          
          {/* Course Summary Card */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${isAlreadyClosed ? 'bg-rose-500' : 'bg-teal-500'}`}></div>
            <div className="pl-2">
              <h4 className="font-black text-sm text-gray-900 line-clamp-1 mb-1">
                {String(course.computedCourseName || getFuzzyKey(course, ["ชื่อคอส", "col_8"]) || '-')}
              </h4>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 mb-2">
                <span>ลูกค้า: <strong className="text-gray-900">{String(course.computedCustomerName || getFuzzyKey(course, ["ผู้ซื้อคอส", "col_9"]) || '-')}</strong></span>
                <span>Ref: <strong className="font-mono text-gray-700">{course.courseRefKey || String(getFuzzyKey(course, ["เลขที่ใบคอส", "col_2"]) || '-')}</strong></span>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100 text-xs">
                <span className="font-bold text-gray-500">จำนวนทั้งหมด: <strong className="text-gray-900">{totalQty}</strong></span>
                <span className="text-gray-300">•</span>
                <span className="font-bold text-gray-500">ใช้ไปแล้ว: <strong className="text-teal-600">{usedQty}</strong></span>
                <span className="text-gray-300">•</span>
                <span className="font-bold text-gray-500">คงเหลือ: <strong className={remainQty > 0 ? 'text-orange-600' : 'text-gray-400'}>{remainQty}</strong></span>
              </div>
            </div>
          </div>

          {/* If already closed, show closed info banner */}
          {isAlreadyClosed && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800 space-y-1 relative">
              <div className="flex items-center gap-1.5 font-black text-rose-700 text-sm mb-1">
                <Lock size={16} /> ใบคอร์สนี้ปิดแล้ว (Closed)
              </div>
              <p>• <strong>สาเหตุ:</strong> {course.closeReason || 'ใช้บริการครบแล้วในใบคอร์สกระดาษเดิม'}</p>
              {course.closedAt && <p>• <strong>วันที่ปิด:</strong> {new Date(course.closedAt).toLocaleString('th-TH')}</p>}
              {course.closedBy && <p>• <strong>ผู้ดำเนินการ:</strong> {course.closedBy}</p>}
              {course.closeNote && <p>• <strong>หมายเหตุ:</strong> {course.closeNote}</p>}
            </div>
          )}

          {/* Form fields (shown when not closed or updating) */}
          {!isAlreadyClosed && (
            <>
              {/* Reason Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-gray-700">
                  เหตุผลในการปิดคอร์ส <span className="text-rose-500">*</span>
                </label>
                <select
                  value={closeReason}
                  onChange={(e) => setCloseReason(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-800 outline-none focus:border-teal-500 shadow-xs"
                >
                  <option value="ใช้บริการครบแล้วในใบคอร์สกระดาษเดิม">📄 ใช้บริการครบแล้วในใบคอร์สกระดาษเดิม (แนะนำ)</option>
                  <option value="ลูกค้าขอจบคอร์ส / ยุติการรักษา">🤝 ลูกค้าขอจบคอร์ส / ยุติการรักษา</option>
                  <option value="เปลี่ยนคอร์ส / โอนสิทธิ์ไปคอร์สอื่น">🔄 เปลี่ยนคอร์ส / โอนสิทธิ์ไปคอร์สอื่น</option>
                  <option value="หมดอายุตามข้อตกลง">⏳ หมดอายุตามข้อตกลง</option>
                  <option value="อื่นๆ (ระบุในหมายเหตุ)">📝 อื่นๆ (ระบุในหมายเหตุ)</option>
                </select>
              </div>

              {/* Sync Paper Usage Checkbox */}
              {closeReason === 'ใช้บริการครบแล้วในใบคอร์สกระดาษเดิม' && remainQty > 0 && (
                <label className="flex items-start gap-2.5 bg-teal-50/70 border border-teal-200 p-3 rounded-2xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncFullUsage}
                    onChange={(e) => setSyncFullUsage(e.target.checked)}
                    className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-teal-900 block">
                      บันทึกว่าใช้บริการครบตามใบกระดาษ ({totalQty}/{totalQty} ครั้ง)
                    </span>
                    <span className="text-[11px] text-teal-700 block mt-0.5">
                      ระบบจะปรับจำนวนครั้งที่ใช้เป็น {totalQty} ครั้ง และคงเหลือ 0 ครั้ง เพื่อให้ตัวเลขในรายงานตรงกัน
                    </span>
                  </div>
                </label>
              )}

              {/* Closer Staff Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-gray-700">
                  พนักงาน / ผู้บันทึกปิดคอร์ส
                </label>
                <input
                  type="text"
                  placeholder="ระบุชื่อพนักงานที่ดำเนินการ"
                  value={closedByName}
                  onChange={(e) => setClosedByName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-800 outline-none focus:border-teal-500 shadow-xs"
                />
              </div>

              {/* Additional Note */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-gray-700">
                  หมายเหตุเพิ่มเติม (ถ้ามี)
                </label>
                <textarea
                  rows={2}
                  placeholder="เช่น ลูกค้าทำครบในใบคอร์สกระดาษเลขที่..., ยุติการรักษาตามคำขอ..."
                  value={closeNote}
                  onChange={(e) => setCloseNote(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs text-gray-800 outline-none focus:border-teal-500 shadow-xs resize-none"
                />
              </div>
            </>
          )}

          {/* --- PAPER COURSE PHOTO ATTACHMENT SECTION --- */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h5 className="font-black text-xs sm:text-sm text-gray-900 flex items-center gap-1.5">
                  <Camera size={16} className="text-teal-600" />
                  รูปถ่ายใบคอร์สกระดาษเดิม ({photos.length})
                </h5>
                <p className="text-[10px] text-gray-400">
                  ถ่ายรูปใบคอร์สกระดาษจริงที่มีลายเซ็นลูกค้า เพื่อเป็นหลักฐานอ้างอิงตลอดไป
                </p>
              </div>

              {/* Upload Button */}
              <label className="cursor-pointer bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all active:scale-95 shrink-0 shadow-2xs">
                {isUploading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>กำลังอัปโหลด ({uploadProgress}%)</span>
                  </>
                ) : (
                  <>
                    <Camera size={13} />
                    <span>ถ่ายรูป / แนบไฟล์</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  capture="environment"
                  onChange={handlePhotoSelect}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            </div>

            {/* Photos Grid */}
            {photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {photos.map((src, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-4/3 flex items-center justify-center shadow-2xs">
                    <img 
                      src={src} 
                      alt={`ใบคอร์สกระดาษ ${i+1}`} 
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                      onClick={() => setPreviewPhoto(src)}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
                      <button 
                        type="button" 
                        onClick={() => setPreviewPhoto(src)} 
                        className="p-1.5 bg-white/90 text-gray-800 rounded-lg pointer-events-auto hover:bg-white"
                        title="ดูรูปขยายใหญ่"
                      >
                        <Eye size={14} />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleRemovePhoto(i)} 
                        className="p-1.5 bg-rose-600/90 text-white rounded-lg pointer-events-auto hover:bg-rose-700"
                        title="ลบรูปนี้"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.2 rounded font-mono">
                      แผ่นที่ {i + 1}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 text-xs">
                <ImageIcon size={28} className="mx-auto mb-1 text-gray-300" />
                <span>ยังไม่มีรูปถ่ายใบคอร์สกระดาษแนบไว้</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-white border-t border-gray-100 flex justify-between items-center gap-2">
          {isAlreadyClosed ? (
            <>
              <button
                type="button"
                onClick={handleReopenCourse}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Unlock size={14} />
                <span>เปิดคอร์สใหม่ (Reopen)</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  // Save updated photos if any were added/removed
                  try {
                    setIsSubmitting(true);
                    const courseRef = getDocRef('courses', course.id);
                    await updateDoc(courseRef, { paperCoursePhotos: photos });
                    if (showToast) showToast('บันทึกรูปถ่ายใบคอร์สกระดาษเรียบร้อย', 'success');
                    if (onSuccess) onSuccess({ ...course, paperCoursePhotos: photos });
                    onClose();
                  } catch (e) {
                    if (showToast) showToast('บันทึกล้มเหลว: ' + e.message, 'error');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-sm"
              >
                {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกรูปถ่าย & ปิดหน้าต่าง'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmClose}
                disabled={isSubmitting || isUploading}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-600/30 active:scale-95 transition-all flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <>
                    <Lock size={14} />
                    <span>ยืนยันปิดคอร์ส (ประทับลายน้ำ)</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>

      </div>

      {/* Full Photo Preview Lightbox */}
      {previewPhoto && (
        <div 
          className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img 
              src={previewPhoto} 
              alt="Preview" 
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" 
            />
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute -top-3 -right-3 p-2 bg-white text-gray-900 rounded-full shadow-lg hover:bg-gray-100"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
