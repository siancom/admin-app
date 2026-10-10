import React, { useState } from 'react';
import { Calendar, X, Clock, User } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function FollowUpPromptModal({ isOpen, onClose, customer, onComplete, showToast, globalBranch }) {
  const [selectedDays, setSelectedDays] = useState(14);
  const [customDate, setCustomDate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !customer) return null;

  const handleCreateFollowUp = async () => {
    setIsProcessing(true);
    try {
      let targetDate = new Date();
      if (customDate) {
        targetDate = new Date(customDate);
      } else {
        targetDate.setDate(targetDate.getDate() + selectedDays);
      }

      const formattedDate = `${String(targetDate.getDate()).padStart(2, '0')}/${String(targetDate.getMonth() + 1).padStart(2, '0')}/${targetDate.getFullYear() + 543}`;
      
      const newBooking = {
        date: formattedDate,
        time: '12:00', // Default time
        customerName: customer.name || 'ไม่ระบุชื่อ',
        phone: customer.phone || '',
        cleanPhone: (customer.phone || '').replace(/\D/g, ''),
        service: 'Follow-up (ติดตามผล)',
        branch: globalBranch || 'สำนักงานใหญ่',
        status: 'รอการยืนยัน',
        isFollowUp: true,
        source: 'Auto-FollowUp',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'bookings'), newBooking);
      showToast('สร้างคิวนัดหมายติดตามผลเรียบร้อยแล้ว', 'success');
      onComplete();
    } catch (error) {
      console.error(error);
      showToast('เกิดข้อผิดพลาดในการสร้างนัดหมาย', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Calendar className="text-pink-500" /> นัดหมายติดตามผล
            </h2>
            <p className="text-slate-500 text-sm font-medium mt-1">สร้างคิวนัดล่วงหน้าให้ลูกค้าโดยอัตโนมัติ</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="mb-6 p-4 bg-pink-50 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-pink-200 flex items-center justify-center text-pink-700">
            <User size={24} />
          </div>
          <div>
            <div className="font-bold text-slate-800 text-lg">{customer.name}</div>
            <div className="text-slate-500 text-sm">โทร: {customer.phone}</div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <label className="block text-sm font-bold text-slate-700">ต้องการนัดหมายติดตามผลในอีกกี่วัน?</label>
          <div className="grid grid-cols-3 gap-2">
            {[7, 14, 30].map(days => (
              <button
                key={days}
                onClick={() => { setSelectedDays(days); setCustomDate(''); }}
                className={`py-3 px-2 rounded-xl font-bold text-sm border-2 transition-all ${selectedDays === days && !customDate ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-slate-200 text-slate-600 hover:border-pink-200'}`}
              >
                {days === 7 ? '1 สัปดาห์' : days === 14 ? '2 สัปดาห์' : '1 เดือน'}
              </button>
            ))}
          </div>
          
          <div className="pt-2">
            <label className="block text-sm font-bold text-slate-700 mb-2">หรือเลือกวันที่ระบุ</label>
            <input 
              type="date" 
              value={customDate}
              onChange={(e) => { setCustomDate(e.target.value); setSelectedDays(null); }}
              className={`w-full border-2 rounded-xl p-3 outline-none font-medium ${customDate ? 'border-pink-500 bg-pink-50' : 'border-slate-200 focus:border-pink-400'}`}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
          >
            ไม่นัดหมาย
          </button>
          <button 
            onClick={handleCreateFollowUp}
            disabled={isProcessing}
            className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isProcessing ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-700 text-white shadow-lg shadow-pink-200'}`}
          >
            {isProcessing ? 'กำลังสร้าง...' : 'สร้างคิวนัดหมาย'}
          </button>
        </div>
      </div>
    </div>
  );
}
