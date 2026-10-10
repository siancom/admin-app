import React, { useState } from 'react';
import { Wallet, ArrowRightLeft, MinusCircle, PlusCircle, CheckCircle, Search, User } from 'lucide-react';
import ModalWrapper from './ModalWrapper';

const CreditManagementModal = ({ isOpen, onClose, customer, activeCreditCourses, onAddCredit, onTransferCredit, onDeductCredit, onSearchCustomer }) => {
  const [activeTab, setActiveTab] = useState('topup'); // topup, transfer, deduct

  // Top-up Form
  const [topupAmount, setTopupAmount] = useState('');
  const [topupNote, setTopupNote] = useState('');

  // Transfer Form
  const [transferAmount, setTransferAmount] = useState('');
  const [transferPhone, setTransferPhone] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [destinationCustomer, setDestinationCustomer] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Deduct Form
  const [deductAmount, setDeductAmount] = useState('');
  const [deductNote, setDeductNote] = useState('');

  if (!isOpen || !customer) return null;

  const totalRemainCredit = activeCreditCourses.reduce((sum, course) => sum + (course.computedRemainCredit || 0), 0);

  const handleTopupSubmit = async (e) => {
    e.preventDefault();
    if (!topupAmount || isNaN(topupAmount) || Number(topupAmount) <= 0) {
      alert("กรุณาระบุจำนวนเงินที่ถูกต้อง");
      return;
    }
    await onAddCredit({ amount: Number(topupAmount), note: topupNote });
    setTopupAmount('');
    setTopupNote('');
  };

  const handleSearchDest = async () => {
    if (!transferPhone) return;
    setIsSearching(true);
    const destCust = await onSearchCustomer(transferPhone);
    setDestinationCustomer(destCust);
    setIsSearching(false);
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!transferAmount || isNaN(transferAmount) || Number(transferAmount) <= 0) {
      alert("กรุณาระบุจำนวนเงินที่ถูกต้อง");
      return;
    }
    if (Number(transferAmount) > totalRemainCredit) {
      alert("เครดิตคงเหลือไม่เพียงพอสำหรับการโอน");
      return;
    }
    if (!destinationCustomer) {
      alert("กรุณาระบุเบอร์โทรศัพท์และค้นหาผู้รับโอนให้ถูกต้อง");
      return;
    }
    
    await onTransferCredit({
      amount: Number(transferAmount),
      destPhone: transferPhone,
      destName: destinationCustomer.computedName || 'ไม่ทราบชื่อ',
      note: transferNote,
      sourceCourses: activeCreditCourses
    });
    
    setTransferAmount('');
    setTransferNote('');
    setTransferPhone('');
    setDestinationCustomer(null);
  };

  const handleDeductSubmit = async (e) => {
    e.preventDefault();
    if (!deductAmount || isNaN(deductAmount) || Number(deductAmount) <= 0) {
      alert("กรุณาระบุจำนวนเงินที่ถูกต้อง");
      return;
    }
    if (Number(deductAmount) > totalRemainCredit) {
      alert("เครดิตคงเหลือไม่เพียงพอสำหรับหักลด");
      return;
    }
    await onDeductCredit({ 
      amount: Number(deductAmount), 
      note: deductNote,
      sourceCourses: activeCreditCourses
    });
    setDeductAmount('');
    setDeductNote('');
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title={`จัดการวงเงินเครดิต: ${customer.computedName}`} icon={Wallet} colorClass="bg-blue-100 text-blue-600">
      
      {/* Current Balance Summary */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white mb-6 shadow-md flex items-center justify-between">
        <div>
          <p className="text-blue-100 font-bold mb-1 text-sm">เครดิตคงเหลือปัจจุบัน</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black">฿{totalRemainCredit.toLocaleString()}</span>
          </div>
        </div>
        <div className="bg-white/20 p-3 rounded-full">
          <Wallet size={32} className="text-white" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
        <button onClick={() => setActiveTab('topup')} className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'topup' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <PlusCircle size={16} className="mr-1.5" /> เติมเครดิต
        </button>
        <button onClick={() => setActiveTab('transfer')} className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'transfer' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <ArrowRightLeft size={16} className="mr-1.5" /> โอนเครดิต
        </button>
        <button onClick={() => setActiveTab('deduct')} className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'deduct' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <MinusCircle size={16} className="mr-1.5" /> หักลดเครดิต
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'topup' && (
        <form onSubmit={handleTopupSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl mb-2 text-sm text-emerald-800">
            ระบบจะสร้างคอร์สใหม่ในชื่อ "เติมวงเงินเครดิต" พร้อมยอดที่ระบุ
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">จำนวนเครดิตที่ต้องการเติม (บาท) *</label>
            <input type="number" required min="1" placeholder="เช่น 1000" value={topupAmount} onChange={e => setTopupAmount(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-lg" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">หมายเหตุ (ถ้ามี)</label>
            <input type="text" placeholder="เช่น โปรโมชั่นพิเศษ, รับเงินโอนแล้ว" value={topupNote} onChange={e => setTopupNote(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm" />
          </div>
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl mt-4 shadow-lg shadow-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-2">
            <CheckCircle size={20} /> ยืนยันการเติมเครดิต
          </button>
        </form>
      )}

      {activeTab === 'transfer' && (
        <form onSubmit={handleTransferSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-2 text-sm text-blue-800">
            ระบบจะหักเครดิตจากลูกค้ารายนี้ และสร้างคอร์สเครดิตใหม่ให้กับผู้รับ
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">จำนวนเครดิตที่ต้องการโอน (บาท) *</label>
            <input type="number" required min="1" max={totalRemainCredit} placeholder={`ยอดโอนสูงสุด ${totalRemainCredit}`} value={transferAmount} onChange={e => setTransferAmount(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-lg" />
          </div>
          
          <div className="pt-2 border-t border-gray-100">
            <label className="block text-xs font-bold text-gray-700 mb-1">เบอร์โทรศัพท์ผู้รับโอน *</label>
            <div className="flex gap-2">
              <input type="text" required placeholder="08xxxxxxxx" value={transferPhone} onChange={e => {setTransferPhone(e.target.value); setDestinationCustomer(null);}} className="flex-1 border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono font-bold" />
              <button type="button" onClick={handleSearchDest} disabled={!transferPhone || isSearching} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 rounded-xl font-bold transition-all disabled:opacity-50">
                {isSearching ? <Search size={18} className="animate-pulse" /> : 'ค้นหา'}
              </button>
            </div>
            
            {destinationCustomer && (
              <div className="mt-3 bg-white border-2 border-green-100 p-3 rounded-xl flex items-center gap-3">
                <div className="bg-green-100 text-green-600 p-2 rounded-full"><User size={20}/></div>
                <div>
                  <p className="text-xs text-gray-500 font-bold mb-0.5">พบข้อมูลลูกค้า (ผู้รับโอน)</p>
                  <p className="font-black text-gray-800">{destinationCustomer.computedName}</p>
                </div>
              </div>
            )}
            {!destinationCustomer && transferPhone.length >= 9 && (
              <p className="text-xs text-orange-500 mt-2 font-bold">
                * หากไม่พบในระบบ ระบบจะบันทึกข้อมูลเพื่อเตรียมสร้างลูกค้าใหม่
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 mt-2">หมายเหตุ (ถ้ามี)</label>
            <input type="text" placeholder="เช่น โอนให้เพื่อน, ให้ญาติ" value={transferNote} onChange={e => setTransferNote(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" />
          </div>
          <button type="submit" disabled={!destinationCustomer && transferPhone.length < 9} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl mt-4 shadow-lg shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            <CheckCircle size={20} /> ยืนยันการโอนเครดิต
          </button>
        </form>
      )}

      {activeTab === 'deduct' && (
        <form onSubmit={handleDeductSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl mb-2 text-sm text-rose-800">
            ระบบจะสร้างรายการเบิก (ติดลบ) เพื่อปรับลดเครดิตคงเหลือ
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">จำนวนเครดิตที่ต้องการหักออก (บาท) *</label>
            <input type="number" required min="1" max={totalRemainCredit} placeholder={`ยอดสูงสุด ${totalRemainCredit}`} value={deductAmount} onChange={e => setDeductAmount(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-bold text-lg" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">เหตุผลการหักลดเครดิต *</label>
            <input type="text" required placeholder="เช่น ปรับลดยอดผิดพลาด, ยกเลิกคอร์ส" value={deductNote} onChange={e => setDeductNote(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-sm" />
          </div>
          <button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-4 rounded-xl mt-4 shadow-lg shadow-rose-500/30 active:scale-95 transition-all flex items-center justify-center gap-2">
            <CheckCircle size={20} /> ยืนยันการหักลด
          </button>
        </form>
      )}
    </ModalWrapper>
  );
};

export default CreditManagementModal;
