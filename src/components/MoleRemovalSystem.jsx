import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, Users, History, AlertTriangle, ShieldCheck, 
  ShieldAlert, Camera, Sparkles, CheckCircle, Clock,
  ArrowRight, Plus, X, FileText, Loader2, Bot, AlertCircle, RefreshCw
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getFuzzyKey } from '../utils/fuzzy';
import { parseThaiDate, parseNumber } from '../utils/parse';
import { getProfilePicData, handleProfileImgError } from '../utils/imageUtils';
import MoleConsultationForm from './MoleConsultationForm';

export default function MoleRemovalSystem({ 
  customersRaw = [], 
  histories = [], 
  globalBranch, 
  triggerToast,
  onNavigateToPos,
  onAddCustomer,
  initialCustomer = null,
  initialTab = null,
  isModal = false,
  onClose = null
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(initialCustomer);
  const [viewTab, setViewTab] = useState(initialTab || (initialCustomer ? 'evaluate' : 'history'));
  const custSearchRef = useRef(null);

  useEffect(() => {
    if (initialCustomer) {
      setSelectedCustomer(initialCustomer);
    }
  }, [initialCustomer]);

  useEffect(() => {
    if (initialTab) {
      setViewTab(initialTab);
    }
  }, [initialTab]);

  // Close search suggestions and clear query on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (custSearchRef.current && !custSearchRef.current.contains(e.target)) {
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Evaluation state
  const [evalItems, setEvalItems] = useState([]);
  const [moleCount, setMoleCount] = useState(1);
  const [moleSize, setMoleSize] = useState('small'); // 'small', 'medium', 'large', 'unlimited'
  const [customPrice, setCustomPrice] = useState('');
  const [evalNote, setEvalNote] = useState('');
  const [photoUrl, setPhotoUrl] = useState(null);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const parseRecordTimestamp = (record) => {
    const rawDate = getFuzzyKey(record, ["วันที่", "date", "col_1"]);
    const parsed = parseThaiDate(rawDate);
    if (parsed) return parsed.getTime();
    if (record?.createdAt) {
      const fallback = parseThaiDate(record.createdAt) || new Date(record.createdAt);
      if (fallback && !isNaN(fallback.getTime())) return fallback.getTime();
    }
    return 0;
  };

  const allMoleCustomers = useMemo(() => {
     const moleLatestDate = new Map(); // store phone/name -> max timestamp
     
     histories.forEach(h => {
         const type = String(getFuzzyKey(h, ["ประเภท", "col_4"]) || '').trim();
         const item = String(getFuzzyKey(h, ["สินค้า", "รายการ", "col_18", "col_23"]) || '').trim();
         if (type.includes('จี้ไฝ') || item.includes('จี้ไฝ')) {
             const hPhone = String(getFuzzyKey(h, ["เบอร์โทร", "col_3"]) || '').trim();
             const hName = String(getFuzzyKey(h, ["ชื่อ", "ชื่อลูกค้า", "col_2"]) || '').trim();
             const ts = parseRecordTimestamp(h);
             
             if (hPhone) moleLatestDate.set(hPhone, Math.max(ts, moleLatestDate.get(hPhone) || 0));
             if (hName) moleLatestDate.set(hName, Math.max(ts, moleLatestDate.get(hName) || 0));
         }
     });
     
     return customersRaw.filter(c => {
         const phone = String(c?.computedPhone || getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '').trim();
         const name = String(c?.computedName || getFuzzyKey(c, ["ชื่อ", "col_1"]) || '').trim();
         return (phone && moleLatestDate.has(phone)) || (name && moleLatestDate.has(name));
     }).sort((a, b) => {
         const phoneA = String(a?.computedPhone || getFuzzyKey(a, ["เบอร์โทร", "col_3"]) || '').trim();
         const nameA = String(a?.computedName || getFuzzyKey(a, ["ชื่อ", "col_1"]) || '').trim();
         const tsA = Math.max(moleLatestDate.get(phoneA) || 0, moleLatestDate.get(nameA) || 0);
         
         const phoneB = String(b?.computedPhone || getFuzzyKey(b, ["เบอร์โทร", "col_3"]) || '').trim();
         const nameB = String(b?.computedName || getFuzzyKey(b, ["ชื่อ", "col_1"]) || '').trim();
         const tsB = Math.max(moleLatestDate.get(phoneB) || 0, moleLatestDate.get(nameB) || 0);
         
         return tsB - tsA;
     });
  }, [customersRaw, histories]);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return customersRaw.filter(c => {
      const name = String(c?.computedName || getFuzzyKey(c, ["ชื่อ", "col_1"]) || '').toLowerCase();
      const phone = String(c?.computedPhone || getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '').toLowerCase();
      return name.includes(term) || phone.includes(term);
    }).slice(0, 5);
  }, [customersRaw, searchTerm]);

  const customerMoles = useMemo(() => {
    if (!selectedCustomer) return [];
    const phone = String(selectedCustomer?.computedPhone || getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3"]) || '').trim();
    const name = String(selectedCustomer?.computedName || getFuzzyKey(selectedCustomer, ["ชื่อ", "col_1"]) || '').trim();
    return histories.filter(h => {
        const hPhone = String(getFuzzyKey(h, ["เบอร์โทร", "col_3"]) || '').trim();
        const hName = String(getFuzzyKey(h, ["ชื่อ", "ชื่อลูกค้า", "col_2"]) || '').trim();
        const type = String(getFuzzyKey(h, ["ประเภท", "col_4"]) || '').trim();
        const item = String(getFuzzyKey(h, ["สินค้า", "รายการ", "col_18", "col_23"]) || '').trim();
        
        const matchPhone = phone && hPhone === phone;
        const matchName = name && hName === name;
        
        return (matchPhone || matchName) && (type.includes('จี้ไฝ') || item.includes('จี้ไฝ') || item.includes('จี้กระ'));
    }).sort((a, b) => parseRecordTimestamp(b) - parseRecordTimestamp(a));
  }, [selectedCustomer, histories]);

  const checkWarranty = (dateStr) => {
      const d = parseThaiDate(dateStr);
      if (!d) return null;

      const procDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((today.getTime() - procDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
          return {
              isCovered: false,
              daysLeft: 0,
              daysPassed: diffDays,
              isFuture: true
          };
      }
      return {
          isCovered: diffDays <= 30,
          daysLeft: Math.max(0, 30 - diffDays),
          daysPassed: diffDays,
          isFuture: false
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
          reader.onload = (ev) => {
              setPhotoUrl(ev.target.result);
              setAiResult(null);
          };
          reader.readAsDataURL(file);
      }
  };

  // 🤖 AI Mole & Spot Assessment (Gemini Cloud Function + Direct Fallback)
  const handleAiMoleAssessment = async () => {
    if (!photoUrl) {
      triggerToast('กรุณาอัปโหลดรูปภาพที่เห็นจุดไฝ/กระก่อนให้ AI ประเมินค่ะ', '', 'warning');
      return;
    }

    try {
      setIsAnalyzingAi(true);
      triggerToast('กำลังส่งภาพถ่ายให้ Iris AI ประเมินจุดไฝ/กระ...', '', 'info');

      let resultData = null;
      // 1. ลองเรียก Cloud Function ก่อน
      try {
        const res = await fetch('https://asia-southeast1-iris-clinic-app.cloudfunctions.net/aiSkinAnalysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: photoUrl,
            mimeType: 'image/jpeg',
            scanMode: 'mole'
          })
        });
        if (res.ok) {
          resultData = await res.json();
        }
      } catch (cfErr) {
        console.warn("Cloud function aiSkinAnalysis failed, falling back to direct Gemini:", cfErr);
      }

      // 2. ถ้า Cloud Function ล้มเหลว หรือไม่มีข้อมูล counts ให้ลองเรียก Gemini API ตรง
      if (!resultData || !resultData.counts) {
        let apiKey = (localStorage.getItem('gemini_api_key') || '').trim();
        if (!apiKey) {
          try {
            const snap = await getDoc(doc(db, 'app_settings', 'ai'));
            if (snap.exists() && snap.data().geminiApiKey) {
              apiKey = snap.data().geminiApiKey.trim();
            }
          } catch (e) {
            console.warn("Failed to get Gemini key from firestore:", e);
          }
        }

        if (apiKey) {
          const cleanBase64 = photoUrl.includes(',') ? photoUrl.split(',')[1] : photoUrl;
          const molePrompt = `คุณคือแพทย์และผู้เชี่ยวชาญการจี้ไฝ ติ่งเนื้อ กระเนื้อ สิวหิน ประจำ Iris Clinic (ไอริส คลินิก)
จงวิเคราะห์ภาพถ่ายนี้อย่างละเอียด:
1. ตรวจนับจำนวนจุดที่พบทั้งหมด (ไฝ, กระเนื้อ, ติ่งเนื้อ)
2. จำแนกขนาด/ประเภท (จุดเล็ก/ตื้น, จุดกลาง, จุดใหญ่/รากลึก, หรือมีมากควรเหมาทั่วหน้า)
3. ระบุตำแหน่งบนใบหน้า/ลำคอที่พบจุดสำคัญ
4. แนะนำราคาประเมินเบื้องต้น (จุดเล็ก 200-300 บาท, จุดกลาง 500 บาท, จุดใหญ่ 800-1000 บาท, มากกว่า 8-10 จุด เหมาทั่วหน้า 2,999 บาท)
5. สรุปคำแนะนำการดูแลหลังจี้

ส่งผลลัพธ์เป็น JSON เท่านั้น โครงสร้าง:
{
  "mode": "mole",
  "counts": { "moles": 2, "freckles": 1, "skinTags": 0, "total": 3 },
  "suggestedSize": "small",
  "suggestedPrice": 600,
  "locations": ["โหนกแก้มซ้าย", "ข้างมุมปาก"],
  "summary": "ข้อความสรุปสั้นๆ สภาพจุดที่พบและคำแนะนำ",
  "cauterizeAdvice": "หลังจี้ห้ามโดนน้ำ 3 วัน และแต้มผงสมุนไพรไอริสตามคำแนะนำ"
}`;
          const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: molePrompt },
                  { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } }
                ]
              }],
              generationConfig: { responseMimeType: "application/json" }
            })
          });

          if (geminiRes.ok) {
            const geminiJson = await geminiRes.json();
            const textResp = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textResp) {
              resultData = JSON.parse(textResp);
            }
          }
        }
      }

      if (!resultData) {
        throw new Error('ไม่สามารถประเมินภาพได้ กรุณาตรวจสอบรูปภาพหรือการเชื่อมต่ออินเทอร์เน็ต');
      }

      setAiResult(resultData);

      const totalCount = Number(resultData.counts?.total || (resultData.counts?.moles || 0) + (resultData.counts?.freckles || 0) + (resultData.counts?.skinTags || 0)) || 1;
      
      let detectedSize = resultData.suggestedSize || 'small';
      if (!resultData.suggestedSize) {
        if (totalCount >= 10) detectedSize = 'unlimited';
        else if (totalCount >= 4) detectedSize = 'medium';
        else detectedSize = 'small';
      }
      setMoleSize(detectedSize);
      setMoleCount(detectedSize === 'unlimited' ? 1 : totalCount);

      let calculatedPrice = resultData.suggestedPrice || resultData.estimatedPriceMin || 0;
      if (!calculatedPrice || calculatedPrice === 0) {
        if (detectedSize === 'unlimited') calculatedPrice = 2999;
        else if (detectedSize === 'large') calculatedPrice = 1000 * totalCount;
        else if (detectedSize === 'medium') calculatedPrice = 500 * totalCount;
        else calculatedPrice = Math.max(300, 300 * totalCount);
      }
      setCustomPrice(calculatedPrice);

      const details = [];
      if (resultData.summary) details.push(resultData.summary);
      if (resultData.locations && resultData.locations.length > 0) {
        details.push(`ตำแหน่งที่พบ: ${resultData.locations.join(', ')}`);
      }
      if (resultData.counts) {
        const parts = [];
        if (resultData.counts.moles) parts.push(`ไฝ ${resultData.counts.moles} จุด`);
        if (resultData.counts.freckles) parts.push(`กระ ${resultData.counts.freckles} จุด`);
        if (resultData.counts.skinTags) parts.push(`ติ่งเนื้อ ${resultData.counts.skinTags} จุด`);
        if (parts.length > 0) details.push(`(${parts.join(', ')})`);
      }
      if (resultData.cauterizeAdvice) details.push(`คำแนะนำ: ${resultData.cauterizeAdvice}`);
      setEvalNote(details.join('\n'));

      triggerToast(`Iris AI ประเมินเรียบร้อย: ตรวจพบ ${totalCount} จุด (฿${calculatedPrice.toLocaleString()})`, '', 'success');

    } catch (err) {
      console.error("AI Mole Assessment error:", err);
      triggerToast('AI ประเมินไม่สำเร็จ: ' + err.message, '', 'error');
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  // 🛡️ ส่งจี้ซ้ำฟรีในระยะประกันไปยัง POS ทันที
  const handleSendWarrantyFreeToPos = (historyRecord, warrantyInfo) => {
      const rawItemName = String(getFuzzyKey(historyRecord, ["รายการ", "สินค้า", "col_23", "col_18"]) || '').trim();
      const itemName = (rawItemName && rawItemName !== '0' && rawItemName !== 'null') ? rawItemName : 'บริการจี้ไฝ';
      const dateStr = String(getFuzzyKey(historyRecord, ["วันที่", "col_1"]) || '');

      const freeItem = {
          id: 'srv_mole_warranty_' + Date.now(),
          name: `${itemName} (เคลมจี้ซ้ำฟรีในประกัน 30 วัน)`,
          price: 0,
          originalPrice: 0,
          qty: 1,
          type: 'service',
          isService: true,
          noCourseCommission: true,
          isManualPrice: true,
          isWarrantyClaim: true,
          note: `สิทธิ์จี้ซ้ำฟรีในประกัน 30 วัน (ประวัติเดิม: ${dateStr} เหลือประกัน ${warrantyInfo?.daysLeft || 0} วัน)`,
          evalNote: `สิทธิ์จี้ซ้ำฟรีในประกัน 30 วัน (ประวัติเดิม: ${dateStr})`,
          photoUrl: null
      };

      const payload = {
          items: [freeItem],
          customer: selectedCustomer || null,
          photoUrl: null,
          evalNote: `เคลมจี้ซ้ำฟรีในประกัน 30 วัน`
      };

      window.dispatchEvent(new CustomEvent('add-to-pos-cart', { detail: payload }));
      if (onNavigateToPos) onNavigateToPos(payload);
      triggerToast('ส่งรายการจี้ซ้ำฟรี (ในประกัน ฿0) ไปยัง POS เรียบร้อยแล้ว!', '', 'success');
  };

  // 🛡️ จี้ฟรี + สลับไปหน้าประเมินเพื่อเพิ่มจุดใหม่
  const handleAddWarrantyAndEvaluateMore = (historyRecord, warrantyInfo) => {
      const rawItemName = String(getFuzzyKey(historyRecord, ["รายการ", "สินค้า", "col_23", "col_18"]) || '').trim();
      const itemName = (rawItemName && rawItemName !== '0' && rawItemName !== 'null') ? rawItemName : 'บริการจี้ไฝ';
      const dateStr = String(getFuzzyKey(historyRecord, ["วันที่", "col_1"]) || '');

      const freeItem = {
          id: 'warranty_' + Date.now(),
          size: 'warranty',
          count: 1,
          price: 0,
          isWarrantyClaim: true,
          note: `สิทธิ์จี้ซ้ำฟรีในประกัน 30 วัน (ทำเมื่อ: ${dateStr})`,
          evalNote: `สิทธิ์จี้ซ้ำฟรีในประกัน 30 วัน`,
          name: `${itemName} (เคลมจี้ซ้ำฟรีในประกัน 30 วัน)`
      };

      setEvalItems(prev => {
          const exists = prev.some(i => i.isWarrantyClaim);
          if (exists) return prev;
          return [freeItem, ...prev];
      });

      setViewTab('evaluate');
      triggerToast('เพิ่มรายการจี้ฟรี (฿0) แล้ว สามารถเลือกประเมินจุดใหม่เพิ่มได้เลยค่ะ', '', 'info');
  };

  const handleAddItem = () => {
      const price = customPrice !== '' ? parseNumber(customPrice) : calculateSuggestedPrice();
      setEvalItems(prev => [...prev, {
          id: Date.now(),
          size: moleSize,
          count: moleSize === 'unlimited' ? 1 : moleCount,
          price: price,
          note: evalNote,
          evalNote: evalNote,
          photoUrl: photoUrl || null,
          isWarrantyClaim: false,
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

  const totalEvalPrice = evalItems.reduce((sum, item) => sum + item.price, 0);

  const handleSendToPos = () => {
      let payload = null;

      if (evalItems.length === 0) {
          // If they didn't add it to the list, just add the current one
          const price = customPrice !== '' ? parseNumber(customPrice) : calculateSuggestedPrice();
          const singleItem = {
              id: 'srv_mole_' + Date.now(),
              name: `จี้ไฝ (${moleSize === 'unlimited' ? 'เหมาทั่วหน้า' : moleCount + ' จุด'})`,
              price: price,
              originalPrice: price,
              qty: 1,
              type: 'service',
              isService: true,
              noCourseCommission: true,
              isManualPrice: true,
              note: evalNote || '',
              evalNote: evalNote || '',
              photoUrl: photoUrl || null
          };
          payload = {
              items: [singleItem],
              customer: selectedCustomer || null,
              photoUrl: photoUrl || null,
              evalNote: evalNote || ''
          };
          triggerToast(`ส่งประเมินราคา ฿${price.toLocaleString()} ไปยัง POS แล้ว!`, '', 'success');
      } else {
          // Send all eval items
          const combinedNotes = [
              ...evalItems.map(i => i.evalNote || i.note).filter(Boolean),
              evalNote
          ].filter(Boolean).join('; ');
          const resolvedPhoto = photoUrl || evalItems.find(i => i.photoUrl)?.photoUrl || null;
          const posItems = evalItems.map(item => ({
              id: 'srv_mole_' + item.id,
              name: item.name,
              price: item.price,
              originalPrice: item.price,
              qty: 1,
              type: 'service',
              isService: true,
              noCourseCommission: true,
              isManualPrice: true,
              isWarrantyClaim: item.isWarrantyClaim || false,
              note: item.note || '',
              evalNote: item.evalNote || item.note || '',
              photoUrl: item.photoUrl || photoUrl || null
          }));
          payload = {
              items: posItems,
              customer: selectedCustomer || null,
              photoUrl: resolvedPhoto,
              evalNote: combinedNotes
          };
          triggerToast(`ส่งประเมินราคา ${posItems.length} รายการ (รวม ฿${totalEvalPrice.toLocaleString()}) ไปยัง POS แล้ว!`, '', 'success');
      }
      
      window.dispatchEvent(new CustomEvent('add-to-pos-cart', {
          detail: payload
      }));

      if (onNavigateToPos) {
          onNavigateToPos(payload);
      }
  };

  return (
    <div className={`h-full flex flex-col bg-slate-50 animate-fade-in ${isModal ? 'pb-4 overflow-y-auto' : 'pb-20 lg:pb-0'}`}>
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 sm:p-7 shrink-0 relative shadow-xl rounded-b-3xl z-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-b-3xl">
            <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4">
                <Sparkles size={120} className="text-white" />
            </div>
        </div>
        
        <div className="flex items-center justify-between mb-5 relative z-10">
          <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center">
            <div className="bg-white/20 p-2 sm:p-2.5 rounded-2xl mr-3 sm:mr-4 backdrop-blur-md border border-white/10 shadow-inner">
              <Sparkles size={26} className="text-pink-300 drop-shadow-md" />
            </div>
            ระบบจี้ไฝ (Mole Removal)
          </h2>
          {onClose && (
            <button 
              type="button"
              onClick={onClose} 
              className="bg-white/15 hover:bg-white/30 text-white px-3 py-2 rounded-xl backdrop-blur-md border border-white/20 shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              title="ปิดหน้าต่าง"
            >
              <X size={18} />
              <span className="text-xs font-bold">ปิด</span>
            </button>
          )}
        </div>

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
                <div className="relative" ref={custSearchRef}>
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        onBlur={() => {
                            setTimeout(() => {
                                if (custSearchRef.current && !custSearchRef.current.contains(document.activeElement)) {
                                    setSearchTerm('');
                                }
                            }, 200);
                        }}
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
                                  
                                  const rawItemName = String(getFuzzyKey(m, ["รายการ", "สินค้า", "col_23", "col_18"]) || '').trim();
                                  const itemName = (rawItemName && rawItemName !== '0' && rawItemName !== 'null') ? rawItemName : 'บริการจี้ไฝ';
                                  
                                  const parseImgUrl = (raw) => {
                                      if (!raw || typeof raw !== 'string') return null;
                                      const trimmed = raw.trim();
                                      if (!trimmed || trimmed === '0' || trimmed === 'null' || trimmed === 'undefined') return null;
                                      if (trimmed.startsWith('http') || trimmed.startsWith('data:')) return trimmed;
                                      return `https://crm.irisnatures.com/${trimmed.replace(/\\/g, '/')}`;
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
                                                      {itemName}
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
                                                              <img 
                                                                  src={beforeImg} 
                                                                  alt="ก่อนจี้" 
                                                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                                  className="w-16 h-16 object-cover rounded-xl border border-slate-100 shadow-sm cursor-pointer hover:opacity-80 transition-opacity" 
                                                                  onClick={() => window.open(beforeImg, '_blank')} 
                                                              />
                                                          </div>
                                                      )}
                                                      {afterImg && (
                                                          <div className="flex flex-col gap-1">
                                                              <span className="text-[10px] text-slate-400 font-bold">หลังทำ</span>
                                                              <img 
                                                                  src={afterImg} 
                                                                  alt="หลังจี้" 
                                                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                                  className="w-16 h-16 object-cover rounded-xl border border-slate-100 shadow-sm cursor-pointer hover:opacity-80 transition-opacity" 
                                                                  onClick={() => window.open(afterImg, '_blank')} 
                                                              />
                                                          </div>
                                                      )}
                                                  </div>
                                              )}
                                          </div>
                                          
                                          {w && (
                                              <div className={`self-start sm:self-center px-4 py-3.5 rounded-2xl flex flex-col gap-2 shrink-0 ${isCovered ? 'bg-emerald-50/90 border border-emerald-200 shadow-xs' : 'bg-slate-50 border border-slate-100'}`}>
                                                  <div className="flex items-center gap-3">
                                                      {isCovered ? (
                                                          <ShieldCheck size={26} className="text-emerald-500 shrink-0" />
                                                      ) : (
                                                          <ShieldAlert size={26} className="text-slate-400 shrink-0" />
                                                      )}
                                                      <div>
                                                          <p className={`text-xs font-black ${isCovered ? 'text-emerald-700' : 'text-slate-500'}`}>
                                                              {isCovered ? 'อยู่ในระยะประกัน' : w.isFuture ? 'ไม่อยู่ในระยะประกัน' : 'หมดประกันแล้ว'}
                                                          </p>
                                                          <p className={`text-[10px] font-bold ${isCovered ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                              {isCovered ? `สามารถจี้ซ้ำได้ (เหลือ ${w.daysLeft} วัน)` : w.isFuture ? 'วันที่ทำรายการอยู่ในอนาคต' : `เลยระยะเวลา 30 วันมาแล้ว (${w.daysPassed} วัน)`}
                                                          </p>
                                                      </div>
                                                  </div>

                                                  {isCovered && (
                                                      <div className="pt-2 border-t border-emerald-200 flex flex-col gap-1.5 mt-1">
                                                          <button
                                                              type="button"
                                                              onClick={() => handleSendWarrantyFreeToPos(m, w)}
                                                              className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                                          >
                                                              <ShieldCheck size={14} />
                                                              <span>ส่งจี้ฟรี (ในประกัน) ไปยัง POS</span>
                                                          </button>
                                                          <button
                                                              type="button"
                                                              onClick={() => handleAddWarrantyAndEvaluateMore(m, w)}
                                                              className="px-3.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                                          >
                                                              <Plus size={14} />
                                                              <span>จี้ฟรี + มีจี้จุดใหม่เพิ่ม</span>
                                                          </button>
                                                      </div>
                                                  )}
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

                                      {photoUrl && (
                                          <button 
                                              type="button"
                                              onClick={handleAiMoleAssessment}
                                              disabled={isAnalyzingAi}
                                              className="w-full mt-3 py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 hover:from-purple-700 hover:to-rose-600 text-white font-black text-xs shadow-md shadow-pink-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                          >
                                              {isAnalyzingAi ? (
                                                  <>
                                                      <Loader2 size={16} className="animate-spin text-white" />
                                                      <span>Iris AI กำลังสแกนตรวจนับและประเมินราคา...</span>
                                                  </>
                                              ) : (
                                                  <>
                                                      <Sparkles size={16} className="text-pink-200" />
                                                      <span>✨ ให้ Iris AI สแกนตรวจนับและประเมินราคาอัตโนมัติ</span>
                                                  </>
                                              )}
                                          </button>
                                      )}

                                      {aiResult && (
                                          <div className="mt-3 p-4 bg-gradient-to-br from-purple-50/90 via-pink-50/80 to-rose-50/90 border-2 border-purple-200 rounded-2xl space-y-2 animate-in fade-in">
                                              <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-2 text-xs font-black text-purple-900">
                                                      <Sparkles size={16} className="text-purple-600" />
                                                      <span>ผลการวิเคราะห์โดย Iris AI</span>
                                                  </div>
                                                  <span className="text-[11px] font-bold text-purple-700 bg-white/90 px-2.5 py-0.5 rounded-full border border-purple-200 shadow-xs">
                                                      ตรวจพบ {aiResult.counts?.total || moleCount} จุด
                                                  </span>
                                              </div>
                                              {aiResult.summary && (
                                                  <p className="text-xs text-purple-950 font-medium leading-relaxed">
                                                      {aiResult.summary}
                                                  </p>
                                              )}
                                              {aiResult.locations && aiResult.locations.length > 0 && (
                                                  <div className="text-[11px] text-purple-800 flex items-center flex-wrap gap-1">
                                                      <span className="font-bold">ตำแหน่ง:</span>
                                                      {aiResult.locations.map((loc, idx) => (
                                                          <span key={idx} className="bg-white/90 px-2 py-0.5 rounded-md border border-purple-100 font-bold text-purple-900 shadow-xs">
                                                              {loc}
                                                          </span>
                                                      ))}
                                                  </div>
                                              )}
                                              <div className="pt-2 border-t border-purple-200/80 flex items-center justify-between text-xs">
                                                  <span className="text-purple-800 font-bold">
                                                      ราคาประเมิน: <span className="text-pink-600 font-black text-sm">฿{(customPrice !== "" ? parseNumber(customPrice) : calculateSuggestedPrice()).toLocaleString()}</span>
                                                  </span>
                                                  <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                                                      <CheckCircle size={13} /> ปรับค่าลงฟอร์มอัตโนมัติแล้ว
                                                  </span>
                                              </div>
                                          </div>
                                      )}
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
                                          <div key={item.id} className={`flex items-center justify-between p-3 rounded-xl border ${item.isWarrantyClaim ? "bg-emerald-50/80 border-emerald-200" : "bg-slate-50 border-slate-100"}`}>
                                              <div>
                                                  <div className="flex items-center gap-2">
                                                      {item.isWarrantyClaim && (
                                                          <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                                                              <ShieldCheck size={11} /> ในประกัน (ฟรี)
                                                          </span>
                                                      )}
                                                      <p className="font-bold text-sm text-slate-800">{item.name}</p>
                                                  </div>
                                                  {item.note && <p className="text-[10px] text-slate-500 mt-1">{item.note}</p>}
                                              </div>
                                              <div className="flex items-center gap-4">
                                                  <span className={`font-black text-sm ${item.price === 0 ? "text-emerald-600" : "text-pink-600"}`}>
                                                      {item.price === 0 ? "ฟรี (฿0)" : `฿${item.price.toLocaleString()}`}
                                                  </span>
                                                  <button onClick={() => handleRemoveItem(item.id)} className="text-slate-400 hover:text-red-500 font-bold text-xs bg-white px-2 py-1 rounded-lg border border-slate-200 cursor-pointer">ลบ</button>
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
