import React, { useState, useEffect } from 'react';
import { Gift, Ticket, Save, Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import { addDoc, updateDoc, deleteDoc, onSnapshot, getDocs, doc, setDoc } from 'firebase/firestore';
import { getCol, getDocRef } from '../config/firebase';

export default function GamificationManager({ showToast, customers }) {
  const [activeTab, setActiveTab] = useState('lucky_spin'); // lucky_spin, golden_ticket
  
  // Spin Settings
  const [spinSettings, setSpinSettings] = useState({
    bahtPerSpin: 5000,
    isActive: true
  });
  const [prizes, setPrizes] = useState([]);
  
  // Modal for Prizes
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const [editingPrize, setEditingPrize] = useState(null);
  const [prizeForm, setPrizeForm] = useState({
    name: '',
    type: 'points', // points, coupon, free_course, physical
    value: '', // how many points, or coupon code
    probability: 10,
    stock: -1 // -1 = unlimited
  });

  // 🎯 เมนูแลกแต้มรับคูปอง (config/redeemTiers) — แสดงในแอปลูกค้าแบบเรียลไทม์
  const [redeemTiers, setRedeemTiers] = useState([]);
  useEffect(() => {
    const unsubTiers = onSnapshot(getDocRef('config', 'redeemTiers'), (snap) => {
      setRedeemTiers(Array.isArray(snap.data()?.tiers) ? snap.data().tiers : []);
    }, () => {});
    return () => unsubTiers();
  }, []);
  const setTier = (idx, field, value) => setRedeemTiers(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  const addTier = () => setRedeemTiers(prev => [...prev, { id: `t${Date.now().toString().slice(-5)}`, points: 100, name: 'คูปองส่วนลด ฿100', desc: 'ใช้กับคำสั่งซื้อขั้นต่ำ ฿300', type: 'coupon', grad: 'from-sky-400 to-blue-500', emoji: '🎟️', isActive: true }]);
  const removeTier = (idx) => setRedeemTiers(prev => prev.filter((_, i) => i !== idx));
  const saveTiers = async () => {
    try {
      const clean = redeemTiers.filter(t => Number(t.points) > 0 && t.name?.trim()).map(t => ({ ...t, points: Number(t.points) }));
      await setDoc(getDocRef('config', 'redeemTiers'), { tiers: clean, updatedAt: new Date().toISOString() });
      showToast('บันทึกเมนูแลกแต้มแล้ว — แอปลูกค้าอัพเดททันที', 'success');
    } catch (e) { showToast('บันทึกไม่สำเร็จ: ' + e.message, 'error'); }
  };

  // Load Settings
  useEffect(() => {
    const unsubPrizes = onSnapshot(getCol('lucky_wheel_prizes'), (snap) => {
      setPrizes(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.probability - a.probability));
    });
    
    const unsubConfig = onSnapshot(doc(getCol('config'), 'gamification'), (snap) => {
      if (snap.exists()) {
        setSpinSettings(snap.data().spinSettings || { bahtPerSpin: 5000, isActive: true });
      }
    });

    return () => {
      unsubPrizes();
      unsubConfig();
    };
  }, []);

  const saveSpinSettings = async () => {
    try {
      await setDoc(doc(getCol('config'), 'gamification'), { spinSettings }, { merge: true });
      showToast('บันทึกการตั้งค่าวงล้อสำเร็จ');
    } catch (err) {
      showToast('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const handleOpenPrizeModal = (prize = null) => {
    if (prize) {
      setPrizeForm(prize);
      setEditingPrize(prize);
    } else {
      setPrizeForm({ name: '', type: 'points', value: '', probability: 10, stock: -1 });
      setEditingPrize(null);
    }
    setIsPrizeModalOpen(true);
  };

  const handleSavePrize = async (e) => {
    e.preventDefault();
    if (!prizeForm.name) return showToast('กรุณากรอกชื่อรางวัล');
    
    try {
      const totalProb = prizes.filter(p => p.id !== editingPrize?.id).reduce((sum, p) => sum + Number(p.probability), 0);
      if (totalProb + Number(prizeForm.probability) > 100) {
        return showToast('โอกาสออกรางวัลรวมต้องไม่เกิน 100%');
      }

      const data = {
        name: prizeForm.name,
        type: prizeForm.type,
        value: String(prizeForm.value),
        probability: Number(prizeForm.probability),
        stock: Number(prizeForm.stock)
      };

      if (editingPrize) {
        await updateDoc(getDocRef('lucky_wheel_prizes', editingPrize.id), data);
        showToast('อัปเดตของรางวัลสำเร็จ');
      } else {
        await addDoc(getCol('lucky_wheel_prizes'), data);
        showToast('เพิ่มของรางวัลสำเร็จ');
      }
      setIsPrizeModalOpen(false);
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleDeletePrize = async (id) => {
    if(window.confirm('ต้องการลบของรางวัลนี้?')) {
      await deleteDoc(getDocRef('lucky_wheel_prizes', id));
      showToast('ลบสำเร็จ');
    }
  };

  // Golden Tickets
  const allGoldenTickets = customers.flatMap(c => 
    (c.goldenTickets || []).map(t => ({ ticket: t, customerName: c.name, customerTel: c.tel }))
  );

  const [randomWinner, setRandomWinner] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const pickRandomWinner = () => {
    if (allGoldenTickets.length === 0) return showToast('ยังไม่มีตั๋วชิงโชคในระบบ');
    setIsSpinning(true);
    setRandomWinner(null);
    
    let counter = 0;
    const interval = setInterval(() => {
      setRandomWinner(allGoldenTickets[Math.floor(Math.random() * allGoldenTickets.length)]);
      counter++;
      if (counter > 20) {
        clearInterval(interval);
        setIsSpinning(false);
        const finalWinner = allGoldenTickets[Math.floor(Math.random() * allGoldenTickets.length)];
        setRandomWinner(finalWinner);
        showToast('ได้ผู้โชคดีแล้ว!');
      }
    }, 100);
  };

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Gift className="text-purple-600" /> จัดการกิจกรรมแจกรางวัล
          </h1>
          <div className="flex bg-white rounded-xl shadow-sm p-1 border border-slate-200">
            <button onClick={() => setActiveTab('lucky_spin')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'lucky_spin' ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:bg-slate-50'}`}>วงล้อเสี่ยงโชค (Lucky Spin)</button>
            <button onClick={() => setActiveTab('golden_ticket')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'golden_ticket' ? 'bg-amber-100 text-amber-700' : 'text-slate-500 hover:bg-slate-50'}`}>ตั๋วทองชิงโชค (Golden Ticket)</button>
          </div>
        </div>

        {activeTab === 'lucky_spin' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><AlertCircle size={18} className="text-slate-400"/> ตั้งค่าเงื่อนไขวงล้อ</h2>
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-sm font-bold text-slate-700 mb-1">ยอดซื้อ (บาท) ต่อ 1 สิทธิ์หมุน</label>
                  <input type="number" value={spinSettings.bahtPerSpin} onChange={e => setSpinSettings({...spinSettings, bahtPerSpin: Number(e.target.value)})} className="w-full border border-slate-200 rounded-xl px-4 py-2" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <input type="checkbox" id="isActive" checked={spinSettings.isActive} onChange={e => setSpinSettings({...spinSettings, isActive: e.target.checked})} className="w-5 h-5 accent-purple-600" />
                  <label htmlFor="isActive" className="font-bold text-slate-700">เปิดใช้งานกิจกรรมวงล้อ</label>
                </div>
                <button onClick={saveSpinSettings} className="bg-slate-800 text-white px-6 py-2 rounded-xl font-bold hover:bg-slate-900 transition-colors">บันทึกตั้งค่า</button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="font-bold text-lg text-slate-800">ของรางวัลในวงล้อ</h2>
                <button onClick={() => handleOpenPrizeModal()} className="bg-purple-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-purple-700"><Plus size={16}/> เพิ่มรางวัล</button>
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-4 bg-purple-50 p-3 rounded-lg border border-purple-100">
                  <span className="font-bold text-purple-800">โอกาสออกรางวัลรวมปัจจุบัน:</span>
                  <span className={`font-black text-lg ${prizes.reduce((s,p)=>s+p.probability,0) > 100 ? 'text-rose-500' : 'text-emerald-600'}`}>{prizes.reduce((s,p)=>s+p.probability,0)}% / 100%</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {prizes.map(p => (
                    <div key={p.id} className="border border-slate-200 rounded-xl p-4 flex flex-col relative group">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-slate-800">{p.name}</h3>
                        <div className="flex gap-1">
                          <button onClick={() => handleOpenPrizeModal(p)} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-lg"><Edit2 size={14}/></button>
                          <button onClick={() => handleDeletePrize(p.id)} className="p-1.5 text-slate-400 hover:text-rose-600 bg-slate-50 rounded-lg"><Trash2 size={14}/></button>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm text-slate-600 mb-3">
                        <p>ประเภท: <span className="font-medium">{p.type === 'points' ? 'คะแนน (Points)' : p.type === 'coupon' ? 'คูปองส่วนลด' : p.type === 'free_course' ? 'คอร์สฟรี' : 'ของรางวัล (Physical)'}</span></p>
                        <p>มูลค่า/โค้ด: <span className="font-medium text-slate-800">{p.value || '-'}</span></p>
                        <p>คงเหลือ: <span className="font-medium text-slate-800">{p.stock === -1 ? 'ไม่จำกัด' : p.stock}</span></p>
                      </div>
                      <div className="mt-auto pt-3 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-xs text-slate-500">โอกาสออกรางวัล</span>
                        <span className="font-black text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">{p.probability}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'golden_ticket' && (
          <div className="space-y-6">
            <div className="bg-amber-50 rounded-2xl shadow-sm border border-amber-200 p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10"><Ticket size={120} /></div>
              <h2 className="text-2xl font-black text-amber-800 mb-2 relative z-10">สุ่มจับรางวัล Golden Ticket</h2>
              <p className="text-amber-700/80 mb-6 relative z-10">จำนวนตั๋วในระบบทั้งหมด: <strong className="text-amber-900 text-xl">{allGoldenTickets.length}</strong> ใบ</p>
              
              <div className="bg-white max-w-md mx-auto rounded-2xl shadow-xl border-4 border-amber-200 p-6 mb-6 relative z-10 min-h-[160px] flex items-center justify-center flex-col">
                {randomWinner ? (
                  <div className="animate-in zoom-in duration-300">
                    <p className="text-sm font-bold text-slate-500 mb-1">ขอแสดงความยินดีกับ</p>
                    <h3 className="text-3xl font-black text-slate-800 mb-2">{randomWinner.customerName}</h3>
                    <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-xl font-bold text-xl tracking-widest border border-amber-300 inline-block mb-2">{randomWinner.ticket}</div>
                    <p className="text-sm text-slate-500">เบอร์โทร: {randomWinner.customerTel}</p>
                  </div>
                ) : (
                  <div className="text-slate-300 flex flex-col items-center">
                    <Gift size={48} className="mb-2 opacity-50"/>
                    <p className="font-bold">รอการสุ่มรางวัล...</p>
                  </div>
                )}
              </div>
              
              <button 
                onClick={pickRandomWinner}
                disabled={isSpinning || allGoldenTickets.length === 0}
                className={`relative z-10 px-8 py-3 rounded-full font-black text-lg text-white shadow-lg transition-all ${isSpinning ? 'bg-slate-400 cursor-not-allowed scale-95' : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:scale-105 active:scale-95 shadow-orange-500/50'}`}
              >
                {isSpinning ? 'กำลังสุ่ม...' : '🎲 สุ่มผู้โชคดี!'}
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50">
                <h2 className="font-bold text-lg text-slate-800">รายชื่อตั๋วทั้งหมด</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="px-6 py-4 font-bold">หมายเลขตั๋ว</th>
                      <th className="px-6 py-4 font-bold">ชื่อลูกค้า</th>
                      <th className="px-6 py-4 font-bold">เบอร์โทร</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allGoldenTickets.map((t, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-6 py-4 font-black text-amber-600 tracking-wider">{t.ticket}</td>
                        <td className="px-6 py-4 font-medium text-slate-800">{t.customerName}</td>
                        <td className="px-6 py-4 text-slate-600">{t.customerTel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Prize Modal */}
      {isPrizeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Gift className="text-purple-500" /> {editingPrize ? 'แก้ไขรางวัล' : 'เพิ่มรางวัลใหม่'}
              </h2>
              <button onClick={() => setIsPrizeModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2"><X size={20}/></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">ชื่อรางวัล *</label>
                <input type="text" value={prizeForm.name} onChange={e=>setPrizeForm({...prizeForm, name: e.target.value})} className="w-full px-4 py-2 border rounded-xl" placeholder="เช่น 100 Points, ส่วนลด 500.-"/>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">ประเภท</label>
                <select value={prizeForm.type} onChange={e=>setPrizeForm({...prizeForm, type: e.target.value})} className="w-full px-4 py-2 border rounded-xl bg-white">
                  <option value="points">คะแนน (Points)</option>
                  <option value="coupon">คูปองส่วนลด</option>
                  <option value="free_course">คอร์สฟรี</option>
                  <option value="physical">ของรางวัลอื่นๆ (เช่น ทอง)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">มูลค่า / รหัสคูปอง</label>
                <input type="text" value={prizeForm.value} onChange={e=>setPrizeForm({...prizeForm, value: e.target.value})} className="w-full px-4 py-2 border rounded-xl" placeholder="เช่น 100 (สำหรับคะแนน), SUMMER50 (สำหรับคูปอง)"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">โอกาสออก (%) *</label>
                  <input type="number" value={prizeForm.probability} onChange={e=>setPrizeForm({...prizeForm, probability: e.target.value})} className="w-full px-4 py-2 border rounded-xl" min="0" max="100"/>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">จำนวนคงเหลือ (-1=ไม่จำกัด)</label>
                  <input type="number" value={prizeForm.stock} onChange={e=>setPrizeForm({...prizeForm, stock: e.target.value})} className="w-full px-4 py-2 border rounded-xl"/>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsPrizeModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200">ยกเลิก</button>
              <button onClick={handleSavePrize} className="px-6 py-2.5 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700">บันทึก</button>
            </div>
          </div>
        </div>
      )}
      {/* 🎯 เมนูแลกแต้มรับคูปอง — ควบคุมแคตตาล็อกในแอปลูกค้า */}
      <div className="mt-8 bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-black text-slate-800 flex items-center"><Ticket size={20} className="mr-2 text-indigo-500"/> เมนูแลกแต้มรับคูปอง</h2>
          <button onClick={addTier} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all">
            <Plus size={14}/> เพิ่มรายการ
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-4">รายการที่ลูกค้าเห็นในแท็บแลกรางวัล (แลกแต้มรับคูปอง) — แก้แล้วลูกค้าเห็นทันทีไม่ต้องอัพเดทแอป · ปิดใช้งานรายการไหนให้กดสวิตช์</p>
        <div className="space-y-2.5">
          {redeemTiers.length === 0 && <p className="text-xs text-slate-300 text-center py-6">ยังไม่มีรายการ — กด "เพิ่มรายการ"</p>}
          {redeemTiers.map((t, idx) => (
            <div key={t.id || idx} className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl p-3">
              <input type="text" value={t.emoji || ''} onChange={(e) => setTier(idx, 'emoji', e.target.value)} className="w-12 text-center text-xl bg-white border border-slate-200 rounded-xl py-2" title="อีโมจิ"/>
              <input type="number" value={t.points} onChange={(e) => setTier(idx, 'points', e.target.value)} className="w-20 bg-white border border-slate-200 rounded-xl px-2 py-2 text-sm font-bold text-slate-700" title="แต้มที่ใช้แลก"/>
              <span className="text-[10px] font-black text-slate-400">แต้ม</span>
              <input type="text" value={t.name || ''} onChange={(e) => setTier(idx, 'name', e.target.value)} className="flex-1 min-w-[140px] bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700" placeholder="ชื่อรายการ เช่น คูปองส่วนลด ฿100"/>
              <input type="text" value={t.desc || ''} onChange={(e) => setTier(idx, 'desc', e.target.value)} className="flex-1 min-w-[140px] bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500" placeholder="เงื่อนไข เช่น ขั้นต่ำ ฿300"/>
              <button onClick={() => setTier(idx, 'isActive', t.isActive === false)} className={`px-3 py-2 rounded-xl text-[10px] font-black shrink-0 transition-all ${t.isActive === false ? 'bg-gray-200 text-gray-400' : 'bg-emerald-500 text-white shadow-sm'}`}>
                {t.isActive === false ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
              </button>
              <button onClick={() => removeTier(idx)} className="p-2 text-slate-300 hover:text-rose-500 rounded-lg transition-colors shrink-0" title="ลบรายการ"><Trash2 size={16}/></button>
            </div>
          ))}
        </div>
        <button onClick={saveTiers} className="mt-4 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center gap-2 shadow-md active:scale-95 transition-all">
          <Save size={16}/> บันทึกเมนูแลกแต้ม
        </button>
      </div>
    </div>
  );
}
