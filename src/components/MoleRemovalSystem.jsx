import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, Users, History, AlertTriangle, ShieldCheck, 
  ShieldAlert, Camera, Sparkles, CheckCircle, Clock,
  ArrowRight, Plus
} from 'lucide-react';
import { getFuzzyKey } from '../utils/fuzzy';
import { getProfilePicData, handleProfileImgError } from '../utils/imageUtils';
import MoleConsultationForm from './MoleConsultationForm';
import { FileText } from 'lucide-react';

export default function MoleRemovalSystem({ 
  customersRaw, 
  histories, 
  globalBranch, 
  triggerToast,
  onNavigateToPos,
  onAddCustomer 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [viewTab, setViewTab] = useState('history'); // 'history' | 'evaluate' | 'consult'
  
  // Evaluation state
  const [evalItems, setEvalItems] = useState([]);
  const [moleCount, setMoleCount] = useState(1);
  const [moleSize, setMoleSize] = useState('small'); // 'small', 'medium', 'large', 'unlimited'
  const [customPrice, setCustomPrice] = useState('');
  const [evalNote, setEvalNote] = useState('');
  const [photoUrl, setPhotoUrl] = useState(null);
  
  const fileInputRef = useRef(null);

  const allMoleCustomers = useMemo(() => {
     const moleLatestDate = new Map(); // store phone/name -> max timestamp
     
     const parseD = (dtStr) => {
         if (!dtStr) return 0;
         const parts = dtStr.split(' ')[0].split('/');
         if (parts.length !== 3) return 0;
         let year = parseInt(parts[2]);
         if (year > 2500) year -= 543;
         return new Date(year, parts[1]-1, parts[0]).getTime();
     };
     
     histories.forEach(h => {
         const type = String(getFuzzyKey(h, ["ประเภท", "col_4"]) || '').trim();
         const item = String(getFuzzyKey(h, ["สินค้า", "รายการ", "col_18", "col_23"]) || '').trim();
         if (type.includes('จี้ไฝ') || item.includes('จี้ไฝ')) {
             const hPhone = String(getFuzzyKey(h, ["เบอร์โทร", "col_3"]) || '').trim();
             const hName = String(getFuzzyKey(h, ["ชื่อ", "ชื่อลูกค้า", "col_2"]) || '').trim();
             const ts = parseD(getFuzzyKey(h, ["วันที่", "col_1"]));
             
             if (hPhone) moleLatestDate.set(hPhone, Math.max(ts, moleLatestDate.get(hPhone) || 0));
             if (hName) moleLatestDate.set(hName, Math.max(ts, moleLatestDate.get(hName) || 0));
         }
     });
     
     return customersRaw.filter(c => {
         const phone = String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '').trim();
         const name = String(getFuzzyKey(c, ["ชื่อ", "col_1"]) || '').trim();
         return (phone && moleLatestDate.has(phone)) || (name && moleLatestDate.has(name));
     }).sort((a, b) => {
         const phoneA = String(getFuzzyKey(a, ["เบอร์โทร", "col_3"]) || '').trim();
         const nameA = String(getFuzzyKey(a, ["ชื่อ", "col_1"]) || '').trim();
         const tsA = Math.max(moleLatestDate.get(phoneA) || 0, moleLatestDate.get(nameA) || 0);
         
         const phoneB = String(getFuzzyKey(b, ["เบอร์โทร", "col_3"]) || '').trim();
         const nameB = String(getFuzzyKey(b, ["ชื่อ", "col_1"]) || '').trim();
         const tsB = Math.max(moleLatestDate.get(phoneB) || 0, moleLatestDate.get(nameB) || 0);
         
         return tsB - tsA;
     });
  }, [customersRaw, histories]);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return customersRaw.filter(c => {
      const name = String(getFuzzyKey(c, ["ชื่อ", "col_1"]) || '').toLowerCase();
      const phone = String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '').toLowerCase();
      return name.includes(term) || phone.includes(term);
    }).slice(0, 5);
  }, [customersRaw, searchTerm]);

  const customerMoles = useMemo(() => {
    if (!selectedCustomer) return [];
    const phone = String(getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3"]) || '').trim();
    const name = String(getFuzzyKey(selectedCustomer, ["ชื่อ", "col_1"]) || '').trim();
    return histories.filter(h => {
        const hPhone = String(getFuzzyKey(h, ["เบอร์โทร", "col_3"]) || '').trim();
        const hName = String(getFuzzyKey(h, ["ชื่อ", "ชื่อลูกค้า", "col_2"]) || '').trim();
        const type = String(getFuzzyKey(h, ["ประเภท", "col_4"]) || '').trim();
        const item = String(getFuzzyKey(h, ["สินค้า", "รายการ", "col_18", "col_23"]) || '').trim();
        
        const matchPhone = phone && hPhone === phone;
        const matchName = name && hName === name;
        
        return (matchPhone || matchName) && (type.includes('จี้ไฝ') || item.includes('จี้ไฝ') || item.includes('จี้กระ'));
    }).sort((a, b) => {
        const parseD = (dtStr) => {
            if (!dtStr) return 0;
            const parts = dtStr.split(' ')[0].split('/');
            return parts.length === 3 ? new Date(parts[2], parts[1]-1, parts[0]).getTime() : 0;
        };
        return parseD(getFuzzyKey(b, ["วันที่", "col_1"])) - parseD(getFuzzyKey(a, ["วันที่", "col_1"]));
    });
  }, [selectedCustomer, histories]);

  const checkWarranty = (dateStr) => {
      if (!dateStr) return null;
      const parts = dateStr.split(' ')[0].split('/');
      if (parts.length !== 3) return null;
      
      let year = parseInt(parts[2]);
      if (year > 2500) year -= 543; // Convert Buddhist Era to AD
      
      const d = new Date(year, parts[1] - 1, parts[0]);
      const now = new Date();
      const diffTime = Math.abs(now - d);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
          isCovered: diffDays <= 30,
          daysLeft: Math.max(0, 30 - diffDays),
          daysPassed: diffDays
      };
  };

  const calculateSuggestedPrice = () => {
      if (moleSize === 'unlimited') return 2999;
      let base = 300;
      if (moleSize === 'medium') base = 500;
      if (moleSize === 'large') base = 1000;
      return base * moleCount;
  };

  const handlePhotoUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => setPhotoUrl(ev.target.result);
          reader.readAsDataURL(file);
      }
  };

  const handleAddItem = () => {
      const price = customPrice !== '' ? parseNumber(customPrice) : calculateSuggestedPrice();
      setEvalItems(prev => [...prev, {
          id: Date.now(),
          size: moleSize,
          count: moleSize === 'unlimited' ? 1 : moleCount,
          price: price,
          note: evalNote,
          name: `จี้ไฝ (${moleSize === 'unlimited' ? 'เหมาทั่วหน้า' : moleSize === 'small' ? 'จุดเล็ก' : moleSize === 'medium' ? 'จุดกลาง' : 'จุดใหญ่'} ${moleSize !== 'unlimited' ? moleCount + ' จุด' : ''})`
      }]);
      // Reset form
      setCustomPrice('');
      setEvalNote('');
      setMoleCount(1);
      setMoleSize('small');
      triggerToast('เพิ่มรายการประเมินแล้ว', '', 'success');
  };

  const handleRemoveItem = (id) => {
      setEvalItems(prev => prev.filter(item => item.id !== id));
  };

  const parseNumber = (val) => {
      if (!val) return 0;
      const num = Number(String(val).replace(/,/g, ''));
      return isNaN(num) ? 0 : num;
  };

  const totalEvalPrice = evalItems.reduce((sum, item) => sum + item.price, 0);

  const handleSendToPos = () => {
      if (!selectedCustomer) {
          triggerToast('กรุณาเลือกลูกค้าก่อนครับ', '', 'alert');
          return;
      }
      
      if (evalItems.length === 0) {
          // If they didn't add it to the list, just add the current one
          const price = customPrice !== '' ? parseNumber(customPrice) : calculateSuggestedPrice();
          const singleItem = {
              id: 'srv_mole',
              name: `จี้ไฝ (${moleSize === 'unlimited' ? 'เหมาทั่วหน้า' : moleCount + ' จุด'})`,
              price: price,
              qty: 1,
              type: 'service'
          };
          window.dispatchEvent(new CustomEvent('add-to-pos-cart', { detail: { items: [singleItem], customer: selectedCustomer } }));
          triggerToast(`ส่งประเมินราคา ฿${price} ไปยัง POS แล้ว!`, '', 'success');
      } else {
          // Send all eval items
          const posItems = evalItems.map(item => ({
              id: 'srv_mole_' + item.id,
              name: item.name,
              price: item.price,
              qty: 1,
              type: 'service'
          }));
          window.dispatchEvent(new CustomEvent('add-to-pos-cart', { detail: { items: posItems, customer: selectedCustomer } }));
          triggerToast(`ส่งประเมินราคา ${posItems.length} รายการ (รวม ฿${totalEvalPrice}) ไปยัง POS แล้ว!`, '', 'success');
      }
      
      if (onNavigateToPos) {
          onNavigateToPos();
      }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 animate-fade-in pb-20 lg:pb-0">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 sm:p-8 shrink-0 relative shadow-xl rounded-b-3xl z-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-b-3xl">
            <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4">
                <Sparkles size={120} className="text-white" />
            </div>
        </div>
        
        <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center mb-6 relative z-10">
          <div className="bg-white/20 p-2 sm:p-3 rounded-2xl mr-3 sm:mr-4 backdrop-blur-md border border-white/10 shadow-inner">
            <Sparkles size={28} className="text-pink-300 drop-shadow-md" />
          </div>
          ระบบจี้ไฝ (Mole Removal)
        </h2>

        {!selectedCustomer ? (
            <div className="relative z-10 max-w-xl">
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-slate-300">ค้นหาลูกค้าเพื่อตรวจสอบประวัติหรือประเมินราคา</label>
                    {onAddCustomer && (
                        <button onClick={onAddCustomer} className="text-xs bg-pink-500/20 text-pink-300 hover:text-white hover:bg-pink-500 font-bold px-3 py-1 rounded-lg flex items-center transition-colors">
                            <Plus size={12} className="mr-1"/> ลูกค้าใหม่
                        </button>
                    )}
                </div>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="พิมพ์ชื่อ หรือ เบอร์โทรลูกค้า..." 
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:bg-white/20 transition-all shadow-inner backdrop-blur-sm text-sm"
                    />
                </div>
                {searchTerm && filteredCustomers.length > 0 && (
                    <div className="absolute w-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                        {filteredCustomers.map(c => (
                            <div 
                                key={String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]))}
                                onClick={() => {
                                    setSelectedCustomer(c);
                                    setSearchTerm('');
                                }}
                                className="p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-pink-100 group-hover:text-pink-600 transition-colors">
                                        <Users size={18} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">{String(getFuzzyKey(c, ["ชื่อ", "col_1"]))}</p>
                                        <p className="text-xs text-slate-500 font-mono">{String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]))}</p>
                                    </div>
                                </div>
                                <ArrowRight size={16} className="text-slate-300 group-hover:text-pink-500 transform group-hover:translate-x-1 transition-all" />
                            </div>
                        ))}
                    </div>
                )}
                {searchTerm && filteredCustomers.length === 0 && (
                    <div className="absolute w-full mt-2 bg-white rounded-2xl shadow-xl p-6 text-center text-slate-500 z-50 border border-slate-100">
                        ไม่พบลูกค้าที่ค้นหา
                    </div>
                )}
            </div>
        ) : (
            <div className="bg-white/10 rounded-2xl p-4 flex items-center justify-between backdrop-blur-md border border-white/20 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-pink-600 shadow-lg">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-white font-black text-lg">{String(getFuzzyKey(selectedCustomer, ["ชื่อ", "col_1"]))}</p>
                        <p className="text-slate-300 text-sm font-mono">{String(getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3"]))}</p>
                    </div>
                </div>
                <button 
                    onClick={() => {
                        setEvalItems([]);
                        setSelectedCustomer(null);
                        setPhotoUrl(null);
                        setEvalNote('');
                        setCustomPrice('');
                    }} 
                    className="text-xs font-bold text-white/70 hover:text-white bg-black/20 px-3 py-2 rounded-xl transition-colors"
                >
                    เปลี่ยนลูกค้า
                </button>
            </div>
        )}
      </div>

      {selectedCustomer && (
          <div className="flex-1 overflow-hidden flex flex-col pt-4">
              <div className="px-4 sm:px-8 shrink-0">
                  <div className="flex gap-2 p-1 bg-slate-200/50 rounded-2xl w-full sm:w-fit">
                      <button 
                          onClick={() => setViewTab('history')}
                          className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${viewTab === 'history' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                          <History size={16} /> ประวัติและประกัน
                      </button>
                      <button 
                          onClick={() => setViewTab('evaluate')}
                          className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${viewTab === 'evaluate' ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                      >
                          <Plus size={16} /> ประเมินราคาทำจี้ไฝ
                      </button>
                      <button 
                          onClick={() => setViewTab('consult')}
                          className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${viewTab === 'consult' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                      >
                          <FileText size={16} /> ใบ Consult
                      </button>
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-8">
                  
                  {viewTab === 'history' && (
                      <div className="space-y-4">
                          {customerMoles.length === 0 ? (
                              <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                      <History size={32} />
                                  </div>
                                  <h3 className="font-bold text-slate-700 mb-1">ยังไม่มีประวัติการจี้ไฝ</h3>
                                  <p className="text-sm text-slate-500">ลูกค้ารายนี้ยังไม่เคยใช้บริการจี้ไฝกับทางคลินิก</p>
                              </div>
                          ) : (
                              customerMoles.map((m, i) => {
                                  const dateStr = String(getFuzzyKey(m, ["วันที่", "col_1"]));
                                  const w = checkWarranty(dateStr);
                                  const isCovered = w && w.isCovered;
                                  
                                  const price = getFuzzyKey(m, ["ยอดจี้ไฝ", "ยอดโอน", "ยอดเงินสด", "ยอดสินค้า", "col_28", "col_31"]);
                                  
                                  const parseImgUrl = (raw) => {
                                      if (!raw || typeof raw !== 'string') return null;
                                      if (raw.startsWith('http')) return raw;
                                      return `https://crm.irisnatures.com/${raw.replace(/\\/g, '/')}`;
                                  };
                                  
                                  const beforeImgRaw = getFuzzyKey(m, ["รูปก่อนจี้"]);
                                  const afterImgRaw = getFuzzyKey(m, ["รูปหลังจี้"]);
                                  
                                  const beforeImg = parseImgUrl(beforeImgRaw);
                                  const afterImg = parseImgUrl(afterImgRaw);
                                  
                                  return (
                                      <div key={i} className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
                                          <div className="flex-1">
                                              <div className="flex items-center justify-between mb-2">
                                                  <h4 className="font-bold text-slate-800 text-base">
                                                      {String(getFuzzyKey(m, ["รายการ", "สินค้า", "col_23", "col_18"]) || 'บริการจี้ไฝ')}
                                                  </h4>
                                                  {price && price !== '0' && (
                                                      <span className="font-bold text-pink-600 bg-pink-50 px-3 py-1 rounded-full text-sm">
                                                          ฿{Number(price).toLocaleString()}
                                                      </span>
                                                  )}
                                              </div>
                                              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mb-4">
                                                  <span className="flex items-center gap-1.5"><Clock size={12} /> ทำเมื่อ: {dateStr} {m.เวลา||''}</span>
                                                  <span className="flex items-center gap-1.5">สาขา: {String(getFuzzyKey(m, ["สาขา", "col_19"]) || '-')}</span>
                                              </div>
                                              
                                              {(beforeImg || afterImg) && (
                                                  <div className="flex items-center gap-3 mt-3">
                                                      {beforeImg && (
                                                          <div className="flex flex-col gap-1">
                                                              <span className="text-[10px] text-slate-400 font-bold">ก่อนทำ</span>
                                                              <img src={beforeImg} alt="ก่อนจี้" className="w-16 h-16 object-cover rounded-xl border border-slate-100 shadow-sm cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.open(beforeImg, '_blank')} />
                                                          </div>
                                                      )}
                                                      {afterImg && (
                                                          <div className="flex flex-col gap-1">
                                                              <span className="text-[10px] text-slate-400 font-bold">หลังทำ</span>
                                                              <img src={afterImg} alt="หลังจี้" className="w-16 h-16 object-cover rounded-xl border border-slate-100 shadow-sm cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.open(afterImg, '_blank')} />
                                                          </div>
                                                      )}
                                                  </div>
                                              )}
                                          </div>
                                          
                                          {w && (
                                              <div className={`self-start sm:self-center px-4 py-3 rounded-2xl flex items-center gap-3 shrink-0 ${isCovered ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50 border border-slate-100'}`}>
                                                  {isCovered ? (
                                                      <ShieldCheck size={24} className="text-emerald-500" />
                                                  ) : (
                                                      <ShieldAlert size={24} className="text-slate-400" />
                                                  )}
                                                  <div>
                                                      <p className={`text-xs font-black ${isCovered ? 'text-emerald-700' : 'text-slate-500'}`}>
                                                          {isCovered ? 'อยู่ในระยะประกัน' : 'หมดประกันแล้ว'}
                                                      </p>
                                                      <p className={`text-[10px] font-bold ${isCovered ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                          {isCovered ? `สามารถจี้ซ้ำได้ (เหลือ ${w.daysLeft} วัน)` : `เลยระยะเวลา 30 วันมาแล้ว (${w.daysPassed} วัน)`}
                                                      </p>
                                                  </div>
                                              </div>
                                          )}
                                      </div>
                                  );
                              })
                          )}
                      </div>
                  )}

                  {viewTab === 'evaluate' && (
                      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                          <div className="p-6 sm:p-8 space-y-8">
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                  {/* Left: Size & Count */}
                                  <div className="space-y-6">
                                      <div>
                                          <label className="block text-sm font-bold text-slate-700 mb-3">ขนาด / ประเภท</label>
                                          <div className="grid grid-cols-2 gap-2">
                                              {[
                                                  {id: 'small', label: 'จุดเล็ก / ตื้น'},
                                                  {id: 'medium', label: 'จุดกลาง'},
                                                  {id: 'large', label: 'จุดใหญ่ / รากลึก'},
                                                  {id: 'unlimited', label: 'เหมาทั่วหน้า'}
                                              ].map(sz => (
                                                  <button
                                                      key={sz.id}
                                                      onClick={() => setMoleSize(sz.id)}
                                                      className={`px-4 py-3 rounded-xl text-sm font-bold transition-all border-2 ${moleSize === sz.id ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-slate-100 text-slate-500 hover:border-pink-200'}`}
                                                  >
                                                      {sz.label}
                                                  </button>
                                              ))}
                                          </div>
                                      </div>

                                      {moleSize !== 'unlimited' && (
                                          <div>
                                              <label className="block text-sm font-bold text-slate-700 mb-3">จำนวน (จุด)</label>
                                              <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-xl w-fit border border-slate-100">
                                                  <button 
                                                      onClick={() => setMoleCount(Math.max(1, moleCount - 1))}
                                                      className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-600 hover:text-pink-600 font-bold text-lg active:scale-95 transition-all"
                                                  >
                                                      -
                                                  </button>
                                                  <span className="w-10 text-center font-black text-lg text-slate-800">{moleCount}</span>
                                                  <button 
                                                      onClick={() => setMoleCount(moleCount + 1)}
                                                      className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-600 hover:text-pink-600 font-bold text-lg active:scale-95 transition-all"
                                                  >
                                                      +
                                                  </button>
                                              </div>
                                          </div>
                                      )}
                                  </div>

                                  {/* Right: Photo */}
                                  <div>
                                      <label className="block text-sm font-bold text-slate-700 mb-3">รูปภาพประกอบการประเมิน (ถ้ามี)</label>
                                      <input type="file" accept="image/*" className="hidden" id="moleEvalPhoto" onChange={handlePhotoUpload} />
                                      <label htmlFor="moleEvalPhoto" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-all relative overflow-hidden group">
                                          {photoUrl ? (
                                              <>
                                                  <img src={photoUrl} className="absolute inset-0 w-full h-full object-cover opacity-80" alt="Preview" />
                                                  <div className="z-10 flex flex-col items-center p-3 bg-white/90 rounded-xl shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                                      <Camera size={20} className="text-pink-600 mb-1" />
                                                      <span className="text-xs font-bold text-pink-700">เปลี่ยนรูปภาพ</span>
                                                  </div>
                                              </>
                                          ) : (
                                              <>
                                                  <div className="w-14 h-14 bg-white text-slate-400 rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 group-hover:text-pink-500 transition-all">
                                                      <Camera size={28} />
                                                  </div>
                                                  <span className="text-sm font-bold text-slate-500">แตะเพื่ออัปโหลดรูปภาพ</span>
                                              </>
                                          )}
                                      </label>
                                  </div>
                              </div>

                              <div className="pt-6 border-t border-slate-100">
                                  <label className="block text-sm font-bold text-slate-700 mb-3">หมายเหตุเพิ่มเติม</label>
                                  <textarea 
                                      value={evalNote}
                                      onChange={e => setEvalNote(e.target.value)}
                                      placeholder="เช่น ตำแหน่งของไฝ, ลักษณะของราก, การประเมินความเสี่ยง..."
                                      className="w-full h-24 p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100 resize-none text-sm transition-all"
                                  ></textarea>
                              </div>

                          </div>
                          
                          <div className="bg-slate-50 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-slate-100">
                              <div>
                                  <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">ราคาประเมินเบื้องต้น (รายการนี้)</p>
                                  <div className="flex items-center gap-2">
                                      <span className="text-xl font-black text-slate-800">฿</span>
                                      <input 
                                          type="number"
                                          value={customPrice !== '' ? customPrice : calculateSuggestedPrice()}
                                          onChange={e => setCustomPrice(e.target.value)}
                                          className="text-2xl font-black text-pink-600 bg-transparent w-32 focus:outline-none border-b-2 border-transparent focus:border-pink-300"
                                      />
                                  </div>
                              </div>
                              <button 
                                  onClick={handleAddItem}
                                  className="w-full sm:w-auto bg-white border-2 border-pink-500 text-pink-600 hover:bg-pink-50 font-bold text-sm px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 transform active:scale-95 transition-all"
                              >
                                  <Plus size={16} />
                                  เพิ่มเข้ารายการประเมิน
                              </button>
                          </div>
                          
                          {/* List of evaluated items */}
                          {evalItems.length > 0 && (
                              <div className="p-6 sm:p-8 border-t-4 border-slate-100 bg-white space-y-4">
                                  <h3 className="font-black text-slate-800 text-sm flex items-center gap-2 mb-4">
                                      <CheckCircle className="text-emerald-500" size={16} /> รายการที่ประเมินแล้ว ({evalItems.length} รายการ)
                                  </h3>
                                  <div className="space-y-3">
                                      {evalItems.map(item => (
                                          <div key={item.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                                              <div>
                                                  <p className="font-bold text-sm text-slate-800">{item.name}</p>
                                                  {item.note && <p className="text-[10px] text-slate-500 mt-1">{item.note}</p>}
                                              </div>
                                              <div className="flex items-center gap-4">
                                                  <span className="font-black text-sm text-pink-600">฿{item.price.toLocaleString()}</span>
                                                  <button onClick={() => handleRemoveItem(item.id)} className="text-slate-400 hover:text-red-500 font-bold text-xs bg-white px-2 py-1 rounded-lg border border-slate-200">ลบ</button>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                                  <div className="mt-6 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
                                      <div>
                                          <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">ราคารวมทั้งหมด</p>
                                          <p className="text-xl font-black text-pink-600">฿{totalEvalPrice.toLocaleString()}</p>
                                      </div>
                                      <button 
                                          onClick={handleSendToPos}
                                          className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2 transform active:scale-95 transition-all"
                                      >
                                          <Sparkles size={16} />
                                          นำ {evalItems.length} รายการ ไปชำระเงินใน POS
                                      </button>
                                  </div>
                              </div>
                          )}
                          
                          {evalItems.length === 0 && (
                              <div className="p-6 sm:p-8 border-t border-slate-100 bg-slate-50 flex justify-end">
                                  <button 
                                      onClick={handleSendToPos}
                                      className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2 transform active:scale-95 transition-all"
                                  >
                                      <Sparkles size={16} />
                                      นำไปชำระเงินใน POS
                                  </button>
                              </div>
                          )}
                      </div>
                  )}

                  {viewTab === 'consult' && (
                      <MoleConsultationForm 
                          selectedCustomer={selectedCustomer}
                          globalBranch={globalBranch}
                          showToast={triggerToast}
                      />
                  )}
              </div>
          </div>
      )}

      {!selectedCustomer && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-8">
              <div className="max-w-4xl mx-auto">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600">
                          <History size={20} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800">ลูกค้าจี้ไฝทั้งหมด ({allMoleCustomers.length} ท่าน)</h3>
                  </div>
                  
                  {allMoleCustomers.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {allMoleCustomers.map(c => {
                              const picData = getProfilePicData(c, customersRaw);
                              return (
                                  <div 
                                      key={String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]))}
                                      onClick={() => setSelectedCustomer(c)}
                                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-pink-300 cursor-pointer transition-all flex items-center gap-4 group"
                                  >
                                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-pink-100 group-hover:text-pink-600 transition-colors shrink-0 overflow-hidden border-2 border-white shadow-sm">
                                          {picData ? (
                                              <img src={picData.primary} onError={(e) => handleProfileImgError(e, picData.fallback)} alt="profile" className="w-full h-full object-cover" />
                                          ) : (
                                              <Users size={24} />
                                          )}
                                      </div>
                                      <div className="overflow-hidden">
                                      <p className="font-bold text-slate-800 truncate">{String(getFuzzyKey(c, ["ชื่อ", "col_1"]))}</p>
                                      <p className="text-sm text-slate-500 font-mono">{String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]))}</p>
                                  </div>
                                  <ArrowRight size={18} className="text-slate-200 group-hover:text-pink-500 ml-auto transform group-hover:translate-x-1 transition-all" />
                              </div>
                              );
                          })}
                      </div>
                  ) : (
                      <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
                          <p className="text-slate-500">ยังไม่มีประวัติลูกค้าจี้ไฝในระบบ</p>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
}
