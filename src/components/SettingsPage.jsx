import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, addDoc, deleteDoc, updateDoc, collection } from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  Settings, Database, MapPin, Store, CheckCircle, AlertTriangle,
  ToggleLeft, ToggleRight, Sparkles, Truck, ShoppingBag, Wallet, Gift,
  Bell, Loader2, Send, X, Ticket, Star, TestTube, ExternalLink,
  Trash2, List, ChevronUp, ChevronDown, MessageSquare,
  FileText, Users, History as HistoryIcon, Calendar, ShoppingCart,
  Package, Layers, Plus, ShieldAlert
} from 'lucide-react';
import { ADMIN_FEATURE_GROUPS } from '../App';

// ─────────────────────────────────────────────
// SettingsPage — หน้าตั้งค่าระบบ (แยกจาก App.jsx)
// ─────────────────────────────────────────────

export default function SettingsPage({
  // Feature flags
  adminNotifConfig, setAdminNotifConfig,
  featureFlags, toggleFeatureFlag,
  // LINE notification
  lineNotifConfig, saveLineNotifConfig,
  lineTestTarget, setLineTestTarget,
  isSendingTest, sendLineTestNotification,
  // Broadcast
  broadcastMsg, setBroadcastMsg,
  broadcastCoupon, setBroadcastCoupon,
  couponsForBroadcast,
  isBroadcasting, sendLineBroadcast,
  broadcastResult,
  // System / DB
  isDbConnected, dbInfo,
  branches,
  setMapPinTarget, setIsMapPinModalOpen,
  handleRunMigration,
  // Data / Danger zone
  executeResetAllStock,
  setActionConfirmModal,
  deleteButtons,
  setConfirmDeleteModal,
  setIsClearDataModalOpen,
  setIsMonthCleanupOpen, setCleanupPreview, setCleanupInput,
  // Data management table
  settingsSelectedCollection, setSettingsSelectedCollection,
  selectedItems, setSelectedItems,
  getCurrentCollectionData,
  getItemDisplayName, getItemSubInfo, getItemDate, getItemStatus,
  // Collections (for dropdown counts)
  courses, customersRaw, histories, bookings, orders, products, masterCourses,
  // AI Survey
  aiSurveys,
  // Helpers
  showToast, getFuzzyKey,
}) {

  // ─── Local state ───
  const [settingsSection, setSettingsSection] = useState('features');
  const [isDangerZoneExpanded, setIsDangerZoneExpanded] = useState(true);
  const [isDataMgmtExpanded, setIsDataMgmtExpanded] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [isAddingBranch, setIsAddingBranch] = useState(false);

  const handleAddBranch = async () => {
    if (!newBranchName.trim()) return;
    setIsAddingBranch(true);
    try {
      let bName = newBranchName.trim();
      if (!bName.startsWith('สาขา')) {
        bName = 'สาขา' + bName;
      }
      await addDoc(collection(db, 'branches'), {
        name: bName,
        lat: null,
        lng: null,
        passcode: '',
        isMaintenance: false
      });
      setNewBranchName('');
      showToast('เพิ่มสาขาใหม่เรียบร้อยแล้ว', 'success');
    } catch (e) {
      showToast('เกิดข้อผิดพลาด: ' + e.message, 'error');
    } finally {
      setIsAddingBranch(false);
    }
  };

  const handleDeleteBranch = async (branch) => {
    if (branches.length <= 1) {
      showToast('ไม่สามารถลบสาขาสุดท้ายได้', 'error');
      return;
    }
    setActionConfirmModal({
      isOpen: true,
      title: 'ยืนยันการลบสาขา',
      message: `คุณกำลังจะลบ "${branch.name}" แน่ใจหรือไม่? (ลบเฉพาะรายชื่อสาขา ข้อมูลต่างๆ จะยังคงอยู่)`,
      confirmText: 'ลบสาขานี้',
      confirmColor: 'bg-red-600 hover:bg-red-700',
      action: async () => {
        try {
          await deleteDoc(doc(db, 'branches', branch.id));
          showToast('ลบสาขาเรียบร้อยแล้ว', 'success');
        } catch (e) {
          showToast('เกิดข้อผิดพลาด: ' + e.message, 'error');
        }
      }
    });
  };

  const handleToggleMaintenance = async (branch) => {
    const newVal = !branch.isMaintenance;
    try {
      await updateDoc(doc(db, 'branches', branch.id), {
        isMaintenance: newVal
      });
      showToast(`เปลี่ยนสถานะ "${branch.name}" เป็น ${newVal ? 'ปิดปรับปรุง' : 'เปิดปกติ'} แล้ว`, 'success');
    } catch (e) {
      showToast('เกิดข้อผิดพลาด: ' + e.message, 'error');
    }
  };
  const [omiseConfig, setOmiseConfig] = useState({
    enabled: false, publicKey: '', secretKey: '', installmentMinAmount: 2000,
    enable_promptpay: true, enable_cash: true, enable_credit: true,
    enable_omise_promptpay: true, enable_omise_mobile: true, enable_omise_creditcard: true, enable_omise_installment: true, enable_omise_shopeepay: true
  });
  const [isSavingOmise, setIsSavingOmise] = useState(false);

  useEffect(() => {
    if (settingsSection === 'payment') {
      const fetchOmise = async () => {
        try {
          const pubSnap = await getDoc(doc(db, 'config', 'payment'));
          const secSnap = await getDoc(doc(db, 'app_settings', 'payment'));
          const pubData = pubSnap.data() || {};
          const secData = secSnap.data() || {};
          setOmiseConfig({
            enabled: pubData.omiseEnabled || false,
            publicKey: pubData.omisePublicKey || '',
            secretKey: secData.omiseSecretKey || '',
            installmentMinAmount: pubData.omiseInstallmentMinAmount || 2000,
            enable_promptpay: pubData.enable_promptpay !== false,
            enable_cash: pubData.enable_cash !== false,
            enable_credit: pubData.enable_credit !== false,
            enable_omise_promptpay: pubData.enable_omise_promptpay !== false,
            enable_omise_mobile: pubData.enable_omise_mobile !== false,
            enable_omise_creditcard: pubData.enable_omise_creditcard !== false,
            enable_omise_installment: pubData.enable_omise_installment !== false,
            enable_omise_shopeepay: pubData.enable_omise_shopeepay !== false,
          });
        } catch (e) {
          console.error("Error fetching Omise config", e);
        }
      };
      fetchOmise();
    }
  }, [settingsSection]);

  const saveOmiseConfig = async () => {
    setIsSavingOmise(true);
    try {
      await setDoc(doc(db, 'config', 'payment'), {
        omiseEnabled: omiseConfig.enabled,
        omisePublicKey: omiseConfig.publicKey,
        omiseInstallmentMinAmount: Number(omiseConfig.installmentMinAmount) || 2000,
        enable_promptpay: omiseConfig.enable_promptpay,
        enable_cash: omiseConfig.enable_cash,
        enable_credit: omiseConfig.enable_credit,
        enable_omise_promptpay: omiseConfig.enable_omise_promptpay,
        enable_omise_mobile: omiseConfig.enable_omise_mobile,
        enable_omise_creditcard: omiseConfig.enable_omise_creditcard,
        enable_omise_installment: omiseConfig.enable_omise_installment,
        enable_omise_shopeepay: omiseConfig.enable_omise_shopeepay,
      }, { merge: true });
      await setDoc(doc(db, 'app_settings', 'payment'), {
        omiseSecretKey: omiseConfig.secretKey
      }, { merge: true });
      alert('บันทึกการตั้งค่า Omise สำเร็จ');
    } catch (e) {
      console.error(e);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
    setIsSavingOmise(false);
  };

  // ─── Tab definitions ───
  const TABS = [
    { k: 'features', l: '🎛️ ฟีเจอร์แอปลูกค้า' },
    { k: 'line',     l: '💬 LINE & แจ้งเตือน' },
    { k: 'system',   l: '🏪 ระบบ & สาขา' },
    { k: 'payment',  l: '💳 การชำระเงิน' },
    { k: 'survey',   l: '📋 แบบประเมิน AI' },
    { k: 'data',     l: '⚠️ ข้อมูล & ความปลอดภัย' },
  ];

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════
  return (
    <div className="flex flex-col h-full space-y-6 max-w-6xl mx-auto pb-10">

      {/* ─── Tab Navigation ─── */}
      <div className="flex gap-2 flex-wrap pb-1">
        {TABS.map(t => (
          <button key={t.k} onClick={() => setSettingsSection(t.k)}
            className={`shrink-0 px-4 py-2.5 rounded-2xl font-black text-xs transition-all ${
              settingsSection === t.k
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                : 'bg-white border border-gray-200 text-gray-500 hover:border-indigo-200 hover:text-indigo-600'
            }`}>
            {t.l}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════
          🎛️ TAB: ฟีเจอร์แอปลูกค้า
          ═══════════════════════════════════════════ */}
      {settingsSection === 'features' && (
        <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-sm border border-gray-100">
          <h3 className="text-xl font-black text-gray-800 mb-2 flex items-center">
            <Settings className="mr-3 text-indigo-500"/>
            สวิตช์เปิด/ปิดฟีเจอร์
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            เปิด/ปิดฟีเจอร์ใน<b>แอปลูกค้าแบบเรียลไทม์</b> — ลูกค้าเห็นการเปลี่ยนทันที ไม่ต้องอัพเดทแอป (เหมาะกับปิดปรับปรุงชั่วคราว)
          </p>

          {ADMIN_FEATURE_GROUPS.map(({ group, icon, color, bg, features }) => {
            const GroupIcon = { Sparkles, Truck, ShoppingBag, Wallet, Gift }[icon] || Settings;
            const onCount = features.filter(f => {
              if (featureFlags[f.key] !== undefined) return featureFlags[f.key];
              return (f.key !== 'sourceOldCourses' && f.key !== 'sourceFirestore');
            }).length;
            const allOn = onCount === features.length;
            const allOff = onCount === 0;
            return (
              <div key={group} className="mb-5 last:mb-0">
                {/* หัวกลุ่ม */}
                <div className={`flex items-center justify-between px-4 py-2.5 rounded-2xl ${bg} mb-2.5`}>
                  <div className="flex items-center gap-2">
                    <GroupIcon size={18} className={color} />
                    <span className="font-black text-sm text-gray-800">{group}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${allOff ? 'bg-gray-200 text-gray-500' : 'bg-white/80 text-gray-600'}`}>
                      {onCount}/{features.length} เปิด
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => features.forEach(f => toggleFeatureFlag(f.key, true))} disabled={allOn}
                      className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-white text-green-600 border border-green-200 hover:bg-green-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      เปิดทั้งหมด
                    </button>
                    <button onClick={() => features.forEach(f => toggleFeatureFlag(f.key, false))} disabled={allOff}
                      className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      ปิดทั้งหมด
                    </button>
                  </div>
                </div>
                {/* สวิตช์ในกลุ่ม */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {features.map(f => {
                    let isOn;
                    if (featureFlags[f.key] !== undefined) {
                      isOn = featureFlags[f.key];
                    } else {
                      isOn = (f.key !== 'sourceOldCourses' && f.key !== 'sourceFirestore');
                    }
                    return (
                      <div key={f.key} className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${isOn ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex-1 mr-3 min-w-0">
                          <div className={`font-bold text-sm ${isOn ? 'text-gray-900' : 'text-gray-400'}`}>{f.label}</div>
                          <div className="text-[11px] text-gray-400 mt-0.5 leading-tight">{f.desc}</div>
                        </div>
                        <button
                          onClick={() => toggleFeatureFlag(f.key, !isOn)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all shrink-0 ${isOn ? 'bg-green-500 text-white shadow-md shadow-green-200' : 'bg-gray-200 text-gray-500'}`}
                        >
                          {isOn ? <ToggleRight size={18}/> : <ToggleLeft size={18}/>}
                          {isOn ? 'เปิด' : 'ปิด'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════
          💬 TAB: LINE & แจ้งเตือน
          ═══════════════════════════════════════════ */}
      {settingsSection === 'line' && (
        <div className="space-y-6">
          {/* 🌟 การแจ้งเตือนแอป (แอดมิน) 🌟 */}
          <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-sm border border-gray-100">
            <h3 className="text-xl font-black text-gray-800 mb-2 flex items-center">
              <Bell className="mr-3 text-rose-500"/>
              ตั้งค่าการแจ้งเตือนแอป (สำหรับแอดมิน)
            </h3>
            <p className="text-sm text-gray-500 mb-6">ตั้งค่าการแสดงผลแจ้งเตือนและเสียงเตือน บนหน้าจอของแอดมิน</p>
            <div className="space-y-3">
                {[
                  { key: 'soundAlert', label: 'เสียงแจ้งเตือน (Sound Alert)', desc: 'เล่นเสียงเมื่อมีรายการรอตรวจสอบเพิ่มขึ้น' },
                  { key: 'bookingNew', label: 'คิวนัดหมายใหม่', desc: 'แจ้งเตือนเมื่อมีลูกค้าจองคิวใหม่เข้ามา' },
                  { key: 'bookingToday', label: 'คิวของวันนี้', desc: 'แจ้งเตือนคิวนัดหมายที่จะถึงในวันนี้' },
                  { key: 'orderPending', label: 'คำสั่งซื้อรออนุมัติ', desc: 'แจ้งเตือนเมื่อมีออเดอร์ใหม่รอตรวจสอบ' },
                  { key: 'outOfStock', label: 'สินค้าหมดสต็อก', desc: 'แจ้งเตือนเมื่อสินค้าในคลังเหลือ 0' },
                  { key: 'lowStock', label: 'สินค้าเหลือน้อย', desc: 'แจ้งเตือนเมื่อสินค้าใกล้หมดตามที่กำหนด' },
                  { key: 'courseExpiring', label: 'คอร์สใกล้หมดอายุ', desc: 'แจ้งเตือนเมื่อมีคอร์สใกล้หมดอายุใน 30 วัน' },
                  { key: 'requisitionPending', label: 'ใบเบิกสินค้ารออนุมัติ', desc: 'แจ้งเตือนเมื่อพนักงานขอเบิกสินค้า' },
                  { key: 'leaveRequest', label: 'คำขอลาหยุดรออนุมัติ', desc: 'แจ้งเตือนเมื่อพนักงานขอลาหยุด' }
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-100 transition-colors hover:bg-gray-100">
                     <div className="mr-3">
                        <p className="text-sm font-bold text-gray-800">{label}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 leading-tight">{desc}</p>
                     </div>
                     <button
                        onClick={() => setAdminNotifConfig(prev => ({ ...prev, [key]: !prev[key] }))}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shrink-0 ${adminNotifConfig[key] !== false ? 'bg-rose-500 text-white shadow-md shadow-rose-200' : 'bg-gray-200 text-gray-500'}`}
                     >
                        {adminNotifConfig[key] !== false ? <ToggleRight size={16}/> : <ToggleLeft size={16}/>} {adminNotifConfig[key] !== false ? 'เปิด' : 'ปิด'}
                     </button>
                  </div>
                ))}

                {adminNotifConfig.lowStock !== false && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 mt-3 flex items-center justify-between">
                     <label className="text-xs font-bold text-rose-700">แจ้งเตือนสินค้าเหลือน้อยเมื่อจำนวนต่ำกว่าหรือเท่ากับ:</label>
                     <input
                        type="number"
                        min="1"
                        value={adminNotifConfig.lowStockThreshold || 5}
                        onChange={(e) => setAdminNotifConfig(prev => ({ ...prev, lowStockThreshold: parseInt(e.target.value) || 5 }))}
                        className="w-20 border-2 border-rose-200 rounded-xl p-2 text-sm font-black text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white text-center shadow-inner"
                     />
                  </div>
                )}
            </div>
          </div>

          {/* 🌟 การแจ้งเตือน LINE (ลูกค้า) 🌟 */}
          <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-sm border border-gray-100">
            <h3 className="text-xl font-black text-gray-800 mb-2 flex items-center">
              <MessageSquare className="mr-3 text-green-500"/>
              ตั้งค่าการแจ้งเตือน LINE (สำหรับลูกค้า)
            </h3>
            <p className="text-sm text-gray-500 mb-6">ตั้งค่าการส่งข้อความอัตโนมัติ (Flex Message) เข้า LINE ของลูกค้า</p>
            {/* Toggle switches */}
            <div className="space-y-4 mb-8">
          {[
            { key: 'orderNotif', label: 'แจ้งเตือนสถานะคำสั่งซื้อ', desc: 'ส่ง Flex เมื่อสถานะออเดอร์เปลี่ยน เช่น อนุมัติแล้ว, จัดส่งแล้ว, ยกเลิก ฯลฯ', color: 'text-indigo-500' },
            { key: 'bookingNotif', label: 'แจ้งเตือนสถานะการจองคิว', desc: 'ส่ง Flex เมื่อสถานะคิวเปลี่ยน เช่น ยืนยันแล้ว, เสร็จสิ้น, ยกเลิก ฯลฯ', color: 'text-teal-500' },
            { key: 'queueReminder', label: 'เตือนก่อนถึงเวลานัดหมาย', desc: 'ส่ง Flex เตือนลูกค้าอัตโนมัติก่อนเข้าบริการ 1 ชั่วโมง และ 20 นาที', color: 'text-orange-500' }
          ].map(({ key, label, desc }) => {
            const isOn = lineNotifConfig[key] !== false;
            return (
              <div key={key} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isOn ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex-1 mr-4">
                  <div className={`font-bold text-sm ${isOn ? 'text-gray-900' : 'text-gray-400'}`}>{label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
                </div>
                <button
                  onClick={() => {
                    const newConfig = { ...lineNotifConfig, [key]: !isOn };
                    saveLineNotifConfig(newConfig);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all shrink-0 ${isOn ? 'bg-green-500 text-white shadow-md shadow-green-200' : 'bg-gray-200 text-gray-500'}`}
                >
                  {isOn ? <ToggleRight size={18}/> : <ToggleLeft size={18}/>}
                  {isOn ? 'เปิด' : 'ปิด'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Test Send */}
        <div className="border-t border-gray-100 pt-6">
          <h4 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
            <TestTube size={16} className="text-purple-500"/>ทดสอบส่ง Flex Message
          </h4>
          <p className="text-xs text-gray-400 mb-4">เลือกลูกค้าที่ผูก LINE UID แล้วกดปุ่มทดสอบแต่ละประเภทเพื่อรับ Flex Message จริงในไลน์</p>

          {/* Customer Selector */}
          <div className="mb-4">
            <select
              value={lineTestTarget}
              onChange={(e) => setLineTestTarget(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              <option value="">-- เลือกลูกค้าที่มี LINE UID --</option>
              {customersRaw.filter(c => c.lineUid).map(c => (
                <option key={c.id} value={c.id}>
                  {c.computedName || String(getFuzzyKey(c, ['ชื่อ', 'col_1']) || '')} · {String(getFuzzyKey(c, ['เบอร์โทร', 'col_3']) || '')}
                </option>
              ))}
            </select>
            {lineTestTarget && customersRaw.find(c => c.id === lineTestTarget)?.lineUid && (
              <div className="mt-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-xs text-green-700 font-mono">
                LINE UID: {customersRaw.find(c => c.id === lineTestTarget)?.lineUid}
              </div>
            )}
          </div>

          {/* 3 Test Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { type: 'order', label: 'แจ้งสถานะคำสั่งซื้อ', desc: 'ส่ง Flex "อนุมัติแล้ว"', color: 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-200', icon: '📦' },
              { type: 'booking', label: 'แจ้งสถานะคิว', desc: 'ส่ง Flex "ยืนยันแล้ว"', color: 'bg-teal-500 hover:bg-teal-600 shadow-teal-200', icon: '📅' },
              { type: 'reminder', label: 'เตือนก่อนนัดหมาย', desc: 'ส่ง Flex "อีก 20 นาที"', color: 'bg-orange-500 hover:bg-orange-600 shadow-orange-200', icon: '⏰' },
            ].map(({ type, label, desc, color, icon }) => {
              const isThis = isSendingTest === type;
              const isBusy = !!isSendingTest;
              return (
                <button
                  key={type}
                  onClick={() => sendLineTestNotification(type)}
                  disabled={!lineTestTarget || isBusy}
                  className={`flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl font-bold text-sm transition-all active:scale-95 ${
                    !lineTestTarget || isBusy
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : `${color} text-white shadow-md`
                  }`}
                >
                  {isThis ? (
                    <Loader2 size={22} className="animate-spin"/>
                  ) : (
                    <span className="text-2xl">{icon}</span>
                  )}
                  <span>{isThis ? 'กำลังส่ง...' : label}</span>
                  <span className={`text-[10px] font-normal ${!lineTestTarget || isBusy ? 'text-gray-400' : 'text-white/75'}`}>{desc}</span>
                </button>
              );
            })}
          </div>

          {!customersRaw.some(c => c.lineUid) && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 flex items-center gap-2">
              ยังไม่มีลูกค้าที่ผูก LINE UID ในระบบ — ลูกค้าต้องเชื่อมต่อ LINE ผ่าน LIFF ก่อน
            </div>
          )}
        </div>
      </div>

      {/* 🌟 LINE Broadcast / โปรโมชั่น 🌟 */}

      {/* 🌟 LINE Broadcast / โปรโมชั่น 🌟 */}
      <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-sm border border-gray-100">
        <h3 className="text-xl font-black text-gray-800 mb-2 flex items-center">
          <Send className="mr-3 text-green-500"/>
          ส่ง LINE โปรโมชั่น / ข้อความถึงลูกค้า
        </h3>
        <p className="text-sm text-gray-500 mb-6">ส่ง Flex Message โปรโมชั่นหรือข่าวสารถึงลูกค้าผ่าน LINE — เลือกส่งเฉพาะคนที่ผูกบัญชีแล้ว หรือ Broadcast ถึง Follower ทั้งหมด</p>

        {/* Target Type */}
        <div className="flex gap-3 mb-6">
          {[
            { val: 'multicast', label: `เฉพาะลูกค้าที่ผูก LINE`, count: customersRaw.filter(c => c.lineUid).length, icon: '👥', color: 'border-teal-400 bg-teal-50 text-teal-700' },
            { val: 'broadcast', label: 'Follower ทั้งหมดของ LINE OA', count: null, icon: '📢', color: 'border-indigo-400 bg-indigo-50 text-indigo-700' },
          ].map(({ val, label, count, icon, color }) => (
            <button
              key={val}
              onClick={() => setBroadcastMsg(prev => ({ ...prev, targetType: val }))}
              className={`flex-1 p-4 rounded-2xl border-2 text-left transition-all ${broadcastMsg.targetType === val ? color + ' shadow-sm' : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'}`}
            >
              <div className="text-xl mb-1">{icon}</div>
              <div className="font-bold text-sm">{label}</div>
              {count !== null && <div className="text-xs mt-0.5 opacity-70">{count} คน</div>}
            </button>
          ))}
        </div>

        {/* Color Picker */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">สีหัวข้อ</label>
          <div className="flex gap-2 flex-wrap">
            {['#10b981','#6366f1','#f59e0b','#ef4444','#8b5cf6','#ec4899','#0ea5e9','#1d4ed8'].map(c => (
              <button key={c} onClick={() => setBroadcastMsg(prev => ({...prev, color: c}))}
                className={`w-8 h-8 rounded-full border-4 transition-transform active:scale-90 ${broadcastMsg.color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }}/>
            ))}
            <input type="color" value={broadcastMsg.color}
              onChange={e => setBroadcastMsg(prev => ({...prev, color: e.target.value}))}
              className="w-8 h-8 rounded-full border-2 border-gray-200 cursor-pointer overflow-hidden"
              title="เลือกสีเอง"/>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-3 mb-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">หัวเรื่อง *</label>
            <input
              type="text" maxLength={60}
              placeholder="เช่น 🎉 โปรโมชั่นพิเศษเดือนนี้!"
              value={broadcastMsg.title}
              onChange={e => setBroadcastMsg(prev => ({...prev, title: e.target.value}))}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">เนื้อหา *</label>
            <textarea
              rows={4} maxLength={500}
              placeholder="เช่น ลด 30% ทุกคอร์สยกกระชับผิว เฉพาะลูกค้า IRIS เดือนนี้เท่านั้น ด่วน! จำนวนจำกัด"
              value={broadcastMsg.body}
              onChange={e => setBroadcastMsg(prev => ({...prev, body: e.target.value}))}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
            />
            <div className="text-right text-xs text-gray-400 mt-1">{broadcastMsg.body.length}/500</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">ข้อความปุ่ม (ไม่บังคับ)</label>
              <input
                type="text" maxLength={20}
                placeholder="เช่น ดูโปรโมชั่น"
                value={broadcastMsg.ctaText}
                onChange={e => setBroadcastMsg(prev => ({...prev, ctaText: e.target.value}))}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">URL ปุ่ม</label>
              <input
                type="url"
                placeholder="https://..."
                value={broadcastMsg.ctaUrl}
                onChange={e => setBroadcastMsg(prev => ({...prev, ctaUrl: e.target.value}))}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
          </div>
        </div>

        {/* 🎟️ Coupon Selector */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-1.5">
            <Ticket size={13}/> แนบคูปอง (ไม่บังคับ)
          </label>
          {broadcastCoupon ? (
            <div className="flex items-center gap-3 p-3 bg-rose-50 border-2 border-rose-300 rounded-2xl">
              <div className="flex-1 min-w-0">
                <div className="font-black text-rose-600 text-sm uppercase tracking-wide">{broadcastCoupon.code}</div>
                <div className="text-xs text-gray-500 mt-0.5 truncate">{broadcastCoupon.desc || '-'}</div>
                <div className="text-xs font-bold text-rose-500 mt-0.5">
                  {broadcastCoupon.type === 'percent' ? `ลด ${broadcastCoupon.value}%`
                    : broadcastCoupon.type === 'free_item' ? 'แลกฟรี'
                    : broadcastCoupon.type === 'pos_item' ? `ฟรี: ${broadcastCoupon.value}`
                    : `ลด ${Number(broadcastCoupon.value).toLocaleString()} ฿`}
                </div>
              </div>
              <button
                onClick={() => setBroadcastCoupon(null)}
                className="p-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-500 transition-colors shrink-0"
                title="ยกเลิกคูปอง"
              >
                <X size={16}/>
              </button>
            </div>
          ) : (
            <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
              {couponsForBroadcast.filter(c => !c.isBatch && !(c.isUsed)).length === 0 ? (
                <div className="text-xs text-gray-400 py-4 text-center bg-gray-50 rounded-xl">
                  ยังไม่มีคูปองในระบบ — ไปสร้างที่แท็บ "จัดการคูปอง"
                </div>
              ) : (
                couponsForBroadcast
                  .filter(c => !c.isBatch && !(c.isUsed))
                  .map(c => (
                    <button
                      key={c.id}
                      onClick={() => setBroadcastCoupon(c)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-gray-100 bg-white hover:border-rose-300 hover:bg-rose-50 transition-all text-left group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-rose-50 group-hover:bg-rose-100 flex items-center justify-center shrink-0 transition-colors">
                        <Ticket size={18} className="text-rose-500"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-black text-rose-600 text-xs uppercase tracking-wide">{c.code}</div>
                        <div className="text-xs text-gray-500 truncate">{c.desc || '-'}</div>
                      </div>
                      <div className="text-xs font-bold text-rose-500 shrink-0">
                        {c.type === 'percent' ? `ลด ${c.value}%`
                          : c.type === 'free_item' ? 'แลกฟรี'
                          : c.type === 'pos_item' ? 'ฟรีสินค้า'
                          : `ลด ${Number(c.value).toLocaleString()}฿`}
                      </div>
                    </button>
                  ))
              )}
            </div>
          )}
        </div>

        {/* Preview Card */}
        {broadcastMsg.title && (
          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">ตัวอย่าง Flex Card</label>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {/* Main promo bubble */}
              <div className="max-w-[200px] min-w-[180px] rounded-2xl overflow-hidden shadow-md border border-gray-100 shrink-0">
                <div className="px-4 py-3" style={{ backgroundColor: broadcastMsg.color }}>
                  <p className="text-white font-bold text-sm">{broadcastMsg.title || 'หัวเรื่อง'}</p>
                </div>
                <div className="bg-white px-4 py-3">
                  <p className="text-gray-600 text-xs whitespace-pre-wrap">{broadcastMsg.body || 'เนื้อหา...'}</p>
                  {broadcastMsg.ctaText && (
                    <div className="mt-3 rounded-xl py-2 text-center text-white text-xs font-bold" style={{ backgroundColor: broadcastMsg.color }}>
                      {broadcastMsg.ctaText}
                    </div>
                  )}
                </div>
                <div className="bg-gray-50 px-4 py-2">
                  <p className="text-gray-400 text-[10px] text-center">IRIS Clinic — ขอบคุณที่ไว้วางใจเรา 💚</p>
                </div>
              </div>
              {/* Coupon bubble preview */}
              {broadcastCoupon && (
                <div className="max-w-[200px] min-w-[180px] rounded-2xl overflow-hidden shadow-md border border-rose-100 shrink-0">
                  <div className="px-4 py-3 bg-rose-600">
                    <p className="text-white font-bold text-sm">🎟️ คูปองพิเศษสำหรับคุณ</p>
                  </div>
                  <div className="bg-white px-4 py-4 flex flex-col items-center gap-2">
                    <div className="bg-rose-50 border-2 border-dashed border-rose-200 rounded-xl px-3 py-2 w-full text-center">
                      <p className="font-black text-rose-600 text-base tracking-widest">{broadcastCoupon.code}</p>
                      <p className="text-gray-500 text-[10px] mt-0.5">{broadcastCoupon.desc}</p>
                    </div>
                    <p className="font-bold text-rose-500 text-xs">
                      {broadcastCoupon.type === 'percent' ? `ลด ${broadcastCoupon.value}%`
                        : broadcastCoupon.type === 'free_item' ? 'แลกฟรี'
                        : broadcastCoupon.type === 'pos_item' ? `ฟรี: ${broadcastCoupon.value}`
                        : `มูลค่า ${Number(broadcastCoupon.value).toLocaleString()} บาท`}
                    </p>
                    {broadcastCoupon.validUntil && (
                      <p className="text-[10px] text-gray-400">หมดอายุ {new Date(broadcastCoupon.validUntil).toLocaleDateString('th-TH')}</p>
                    )}
                  </div>
                  <div className="bg-gray-50 px-4 py-2">
                    <p className="text-gray-400 text-[10px] text-center">แสดงโค้ดที่หน้าร้าน</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Result */}
        {broadcastResult && (
          broadcastResult.success ? (
            <div className="mb-4 p-4 rounded-2xl text-sm font-medium flex items-center gap-2 bg-green-50 border border-green-200 text-green-700">
              <CheckCircle size={16}/>
              {broadcastResult.type === 'multicast'
                ? `ส่งสำเร็จ! ถึงลูกค้า ${broadcastResult.sent} คน`
                : 'Broadcast สำเร็จ! ส่งถึง Follower ทั้งหมดแล้ว'}
            </div>
          ) : broadcastResult.error?.includes('Monthly Limit') || broadcastResult.error?.includes('monthly limit') ? (
            <div className="mb-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800">
              <div className="flex items-center gap-2 font-bold text-sm mb-2">
                <AlertTriangle size={16} className="text-amber-500 shrink-0"/>
                โควต้า LINE OA เดือนนี้หมดแล้ว (429 Monthly Limit)
              </div>
              <p className="text-xs text-amber-700 mb-3">LINE Free Plan จำกัดการส่ง Broadcast 500 ข้อความ/เดือน หากมี Follower เยอะหรือเคยส่งในเดือนนี้แล้ว จะไม่สามารถส่งเพิ่มได้จนกว่าจะรอบเดือนใหม่</p>
              <div className="flex flex-col sm:flex-row gap-2 text-xs">
                <a href="https://manager.line.biz" target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 transition-colors">
                  <ExternalLink size={12}/> Upgrade LINE OA Plan
                </a>
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-100 text-amber-700 font-medium">
                  💡 หรือรอต้นเดือนหน้า โควต้าจะรีเซ็ตอัตโนมัติ
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-4 p-4 rounded-2xl text-sm font-medium flex items-center gap-2 bg-red-50 border border-red-200 text-red-700">
              <AlertTriangle size={16}/> {broadcastResult.error}
            </div>
          )
        )}

        {/* Send Button */}
        <button
          onClick={sendLineBroadcast}
          disabled={isBroadcasting || !broadcastMsg.title.trim() || !broadcastMsg.body.trim()}
          className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
            isBroadcasting || !broadcastMsg.title.trim() || !broadcastMsg.body.trim()
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-200'
          }`}
        >
          {isBroadcasting ? (
            <><Loader2 size={20} className="animate-spin"/> กำลังส่ง LINE Flex...</>
          ) : (
            <><Send size={20}/>
            {broadcastMsg.targetType === 'multicast'
              ? `ส่งถึงลูกค้าที่ผูก LINE (${customersRaw.filter(c => c.lineUid).length} คน)`
              : 'Broadcast ถึง Follower ทั้งหมด'}
            </>
          )}
        </button>
      </div>
      </div>
      )}

      {/* ═══════════════════════════════════════════
          🏪 TAB: ระบบ & สาขา (รวม 2 บล็อกเดิมเข้าด้วยกัน)
          ═══════════════════════════════════════════ */}
      {settingsSection === 'system' && (<>
        {/* ข้อมูลระบบฐานข้อมูล (Firebase) */}
        <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-sm border border-gray-100">
          <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center">
            <Database className="mr-3 text-indigo-500"/> ข้อมูลระบบฐานข้อมูล (Firebase)
          </h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8 bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 shadow-inner ${isDbConnected ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
              {isDbConnected ? <CheckCircle size={28} /> : <AlertTriangle size={28} />}
            </div>
            <div>
              <p className="font-black text-gray-800 text-lg">{isDbConnected ? 'เชื่อมต่อ Cloud สำเร็จ' : 'ขาดการเชื่อมต่อ'}</p>
              <p className="text-sm text-gray-500">ข้อมูลทั้งหมดของคุณถูกบันทึกและซิงค์เรียลไทม์บนระบบ Firestore</p>
            </div>
          </div>

          <h4 className="font-bold text-gray-800 mb-4">สถิติข้อมูลในระบบ</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {dbInfo.map((info, idx) => {
              const Icon = info.icon;
              return (
                <div key={idx} className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm text-center">
                  <Icon size={24} className={`mx-auto mb-2 ${info.color}`} />
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{info.label}</p>
                  <p className="text-xl font-black text-gray-800">{info.len}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* จัดการสาขาและพิกัด GPS */}
        <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-sm border border-gray-100">
          <h3 className="text-xl font-black text-gray-800 mb-4 flex items-center">
            <MapPin className="mr-3 text-blue-500"/> ตั้งค่าสาขา & พิกัด GPS
          </h3>
          <p className="text-sm text-gray-500 mb-6">จัดการรายชื่อสาขาและกำหนดพิกัด GPS เพื่อใช้สำหรับการลงเวลาเข้า-ออกงานของพนักงาน</p>
          
          <div className={`flex items-center justify-between p-4 mb-6 rounded-2xl border transition-all ${featureFlags.requireGpsForAttendance !== false ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex-1 mr-4">
              <div className={`font-bold text-sm ${featureFlags.requireGpsForAttendance !== false ? 'text-gray-900' : 'text-gray-400'}`}>ตรวจสอบพิกัด GPS ก่อนลงเวลาเข้างาน</div>
              <div className="text-xs text-gray-400 mt-0.5">พนักงานต้องอยู่ในพื้นที่สาขา (ระยะ 100 เมตร) จึงจะสามารถลงเวลาเข้างานได้</div>
            </div>
            <button
              onClick={() => toggleFeatureFlag('requireGpsForAttendance', featureFlags.requireGpsForAttendance === false ? true : false)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all shrink-0 ${featureFlags.requireGpsForAttendance !== false ? 'bg-green-500 text-white shadow-md shadow-green-200' : 'bg-gray-200 text-gray-500'}`}
            >
              {featureFlags.requireGpsForAttendance !== false ? <ToggleRight size={18}/> : <ToggleLeft size={18}/>}
              {featureFlags.requireGpsForAttendance !== false ? 'เปิด' : 'ปิด'}
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {branches.map(b => (
              <div key={b.id} className={`border rounded-2xl p-4 flex flex-col justify-between bg-gray-50/50 hover:bg-gray-50 transition-colors ${b.isMaintenance ? 'border-orange-300' : 'border-gray-200'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                      <Store size={18} className="text-indigo-500" /> {b.name}
                      {b.isMaintenance && (
                        <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-lg flex items-center font-bold">
                          <ShieldAlert size={12} className="mr-1"/> ปิดปรับปรุง
                        </span>
                      )}
                    </h4>
                    {b.lat && b.lng ? (
                      <p className="text-[10px] text-gray-500 font-mono mt-1">
                        Lat: {Number(b.lat).toFixed(6)}, Lng: {Number(b.lng).toFixed(6)}
                      </p>
                    ) : (
                      <p className="text-[10px] text-red-500 font-bold mt-1 bg-red-50 inline-block px-2 py-0.5 rounded-full">
                        ยังไม่ได้ตั้งพิกัด GPS
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleMaintenance(b)}
                      className={`p-2 bg-white border rounded-xl transition-all shadow-sm active:scale-95 ${b.isMaintenance ? 'border-orange-300 text-orange-600 hover:bg-orange-50' : 'border-gray-200 text-gray-500 hover:text-orange-500'}`}
                      title={b.isMaintenance ? 'เปิดใช้งานสาขา' : 'ตั้งเป็นปิดปรับปรุง'}
                    >
                      <ShieldAlert size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setMapPinTarget({ type: 'edit', id: b.id, lat: b.lat, lng: b.lng });
                        setIsMapPinModalOpen(true);
                      }}
                      className="p-2 bg-white border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-300 rounded-xl transition-all shadow-sm active:scale-95"
                      title="ตั้งค่าพิกัด GPS"
                    >
                      <MapPin size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteBranch(b)}
                      className="p-2 bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-300 rounded-xl transition-all shadow-sm active:scale-95"
                      title="ลบสาขา"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 border border-gray-200 rounded-2xl bg-white flex items-center gap-3">
             <div className="flex-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">เพิ่มสาขาใหม่</label>
                <input
                  type="text"
                  placeholder="เช่น สาขาบ่อผุด"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddBranch()}
                  className="w-full border-2 border-gray-100 rounded-xl p-2.5 text-sm font-medium focus:border-indigo-400 focus:outline-none"
                />
             </div>
             <button
                onClick={handleAddBranch}
                disabled={isAddingBranch || !newBranchName.trim()}
                className={`mt-4 px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
                  !newBranchName.trim() || isAddingBranch
                    ? 'bg-gray-100 text-gray-400'
                    : 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-md'
                }`}
             >
                {isAddingBranch ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                เพิ่มสาขา
             </button>
          </div>
        </div>

        {/* รัน Migration ฐานข้อมูลคอร์ส */}
        <div className="bg-indigo-50 p-6 sm:p-8 rounded-[32px] shadow-sm border border-indigo-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-xl font-black text-indigo-700 mb-2 flex items-center">
              <Database className="mr-3"/> ปรับปรุงข้อมูลคอร์สย้อนหลัง (Migration)
            </h3>
            <p className="text-sm text-indigo-500">
              ระบบจะทำการคำนวณประวัติการใช้คอร์สย้อนหลังทั้งหมด และฝังตัวเลข <strong>"ครั้งที่ใช้"</strong> ลงในฐานข้อมูลคอร์ส เพื่อลดความหน่วงของหน้าจอ
              <strong className="block mt-1">แนะนำให้กด 1 ครั้งเพื่อเคลียร์ข้อมูลเก่า</strong>
            </p>
          </div>
          <button
            onClick={handleRunMigration}
            className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold transition-colors flex items-center shadow-sm"
          >
            <Settings size={20} className="mr-2"/> รัน Migration
          </button>
        </div>
      </>)}

      {/* ═══════════════════════════════════════════
          💳 TAB: การชำระเงิน (Omise)
          ═══════════════════════════════════════════ */}
      {settingsSection === 'payment' && (
        <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-sm border border-gray-100">
          <h3 className="text-xl font-black text-gray-800 mb-2 flex items-center">
            <Wallet className="mr-3 text-blue-500"/>
            การชำระเงิน (Omise)
          </h3>
          <p className="text-sm text-gray-500 mb-6">ตั้งค่า Public Key และ Secret Key ของ Omise สำหรับรับชำระเงินผ่านบัตรเครดิต</p>
          
          <div className="space-y-4 max-w-2xl">
            <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${omiseConfig.enabled ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex-1 mr-4">
                <div className={`font-bold text-sm ${omiseConfig.enabled ? 'text-gray-900' : 'text-gray-400'}`}>เปิดใช้งาน Omise</div>
                <div className="text-xs text-gray-400 mt-0.5">อนุญาตให้ลูกค้าชำระเงินด้วยบัตรเครดิตผ่าน Omise ได้ในแอปลูกค้า</div>
              </div>
              <button
                onClick={() => setOmiseConfig(p => ({ ...p, enabled: !p.enabled }))}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all shrink-0 ${omiseConfig.enabled ? 'bg-green-500 text-white shadow-md shadow-green-200' : 'bg-gray-200 text-gray-500'}`}
              >
                {omiseConfig.enabled ? <ToggleRight size={18}/> : <ToggleLeft size={18}/>}
                {omiseConfig.enabled ? 'เปิด' : 'ปิด'}
              </button>
            </div>

            <div className="border-t border-gray-100 pt-4 mt-2">
              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                เปิด/ปิด ช่องทางชำระเงินมาตรฐาน
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'enable_promptpay', label: 'โอนเงิน (แนบสลิป)' },
                  { key: 'enable_cash', label: 'จ่ายหน้าคลินิก' },
                  { key: 'enable_credit', label: 'หักวงเงินเครดิต' }
                ].map(({ key, label }) => {
                  const isOn = omiseConfig[key];
                  return (
                    <div key={key} className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${isOn ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="font-bold text-sm text-gray-900">{label}</div>
                      <button onClick={() => setOmiseConfig(p => ({ ...p, [key]: !isOn }))} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${isOn ? 'bg-green-500 text-white shadow-sm' : 'bg-gray-200 text-gray-500'}`}>
                        {isOn ? <ToggleRight size={16}/> : <ToggleLeft size={16}/>} {isOn ? 'เปิด' : 'ปิด'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {omiseConfig.enabled && (
            <div className="border-t border-gray-100 pt-4 mt-2">
              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                เปิด/ปิด ช่องทางชำระเงิน Omise
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'enable_omise_promptpay', label: 'PromptPay' },
                  { key: 'enable_omise_mobile', label: 'แอปธนาคาร (Mobile Banking)' },
                  { key: 'enable_omise_creditcard', label: 'บัตรเครดิต' },
                  { key: 'enable_omise_installment', label: 'ผ่อนชำระ' },
                  { key: 'enable_omise_shopeepay', label: 'ShopeePay' }
                ].map(({ key, label }) => {
                  const isOn = omiseConfig[key];
                  return (
                    <div key={key} className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${isOn ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="font-bold text-sm text-gray-900">{label}</div>
                      <button onClick={() => setOmiseConfig(p => ({ ...p, [key]: !isOn }))} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${isOn ? 'bg-green-500 text-white shadow-sm' : 'bg-gray-200 text-gray-500'}`}>
                        {isOn ? <ToggleRight size={16}/> : <ToggleLeft size={16}/>} {isOn ? 'เปิด' : 'ปิด'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            )}
            
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Public Key (แสดงที่ฝั่งลูกค้า)</label>
              <input
                type="text"
                placeholder="pkey_test_..."
                value={omiseConfig.publicKey}
                onChange={e => setOmiseConfig(p => ({ ...p, publicKey: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Secret Key (เก็บเป็นความลับ)</label>
              <input
                type="password"
                placeholder="skey_test_..."
                value={omiseConfig.secretKey}
                onChange={e => setOmiseConfig(p => ({ ...p, secretKey: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">ยอดขั้นต่ำสำหรับการผ่อนชำระ (บาท)</label>
              <input
                type="number"
                min="0"
                placeholder="เช่น 2000"
                value={omiseConfig.installmentMinAmount}
                onChange={e => setOmiseConfig(p => ({ ...p, installmentMinAmount: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <p className="text-[10px] text-gray-400 mt-1">ยอดขั้นต่ำในการเปิดให้ลูกค้าเลือกผ่อนชำระได้ (ค่าเริ่มต้น 2,000 บาท)</p>
            </div>
            
            <button
              onClick={saveOmiseConfig}
              disabled={isSavingOmise}
              className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-sm flex items-center gap-2"
            >
              {isSavingOmise ? <Loader2 size={18} className="animate-spin" /> : <Settings size={18} />}
              บันทึกการตั้งค่า
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          📋 TAB: แบบประเมิน AI
          ═══════════════════════════════════════════ */}
      {settingsSection === 'survey' && (
        <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-sm border border-gray-100">
          <h3 className="text-xl font-black text-gray-800 mb-2 flex items-center">
            <Star className="mr-3 text-amber-500"/>
            แบบประเมินความพอใจ AI (ช่วงทดสอบ)
          </h3>
          {(() => {
            const n = aiSurveys.length;
            const avg = n ? (aiSurveys.reduce((s2, x) => s2 + (Number(x.rating) || 0), 0) / n) : 0;
            const acc = aiSurveys.filter(x => x.accuracy === 'very').length;
            const rec = aiSurveys.filter(x => x.recommend === 'yes').length;
            return (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
                  <div className="bg-amber-50 border border-amber-100 p-3 rounded-2xl text-center"><p className="text-[10px] font-black text-amber-500 uppercase">ทำแล้ว</p><p className="text-2xl font-black text-gray-800">{n}</p><p className="text-[9px] text-gray-400">คน</p></div>
                  <div className="bg-amber-50 border border-amber-100 p-3 rounded-2xl text-center"><p className="text-[10px] font-black text-amber-500 uppercase">ความพอใจเฉลี่ย</p><p className="text-2xl font-black text-gray-800">{n ? avg.toFixed(1) : '-'}</p><p className="text-[9px] text-gray-400">/5 คะแนน</p></div>
                  <div className="bg-teal-50 border border-teal-100 p-3 rounded-2xl text-center"><p className="text-[10px] font-black text-teal-500 uppercase">บอกว่า "ตรงมาก"</p><p className="text-2xl font-black text-gray-800">{n ? Math.round(acc / n * 100) : 0}%</p><p className="text-[9px] text-gray-400">{acc}/{n} คน</p></div>
                  <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl text-center"><p className="text-[10px] font-black text-emerald-500 uppercase">จะแนะนำเพื่อน</p><p className="text-2xl font-black text-gray-800">{n ? Math.round(rec / n * 100) : 0}%</p><p className="text-[9px] text-gray-400">{rec}/{n} คน</p></div>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {n === 0 && <p className="text-xs text-gray-400 text-center py-6">ยังไม่มีผลแบบประเมิน — เชิญลูกค้ากดปุ่ม "ทำแบบประเมินรับส่วนลด" หลังสแกนผิวในแอป</p>}
                  {aiSurveys.slice(0, 20).map(sv => (
                    <div key={sv.id} className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-start gap-2.5">
                      <div className="shrink-0 text-center">
                        <div className="flex">{[1,2,3,4,5].map(i => <Star key={i} size={10} className={i <= (sv.rating||0) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}/>)}</div>
                        <p className="text-[8px] text-gray-400 font-bold mt-0.5">{sv.phone?.slice(-4) ? `xxx-x${sv.phone.slice(-4)}` : '-'}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-gray-600">
                          {sv.accuracy === 'very' ? '✅ ตรงมาก' : sv.accuracy === 'some' ? '🟡 ค่อนข้างตรง' : sv.accuracy === 'no' ? '❌ ยังไม่ตรง' : '-'}{' '}
                          {sv.recommend === 'yes' ? '· 💚 แนะนำ' : sv.recommend === 'maybe' ? '· 🤔 อาจแนะนำ' : ''}
                        </p>
                        {sv.feedback && <p className="text-[10px] text-gray-700 leading-snug mt-0.5">💬 {sv.feedback}</p>}
                        <p className="text-[8px] text-gray-300 mt-0.5">{new Date(sv.createdAt).toLocaleString('th-TH')} · โค้ด {sv.rewardCode}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ═══════════════════════════════════════════
          ⚠️ TAB: ข้อมูล & ความปลอดภัย
          ═══════════════════════════════════════════ */}
      {settingsSection === 'data' && (<>
        {/* รีเซ็ตสต๊อกสินค้าทั้งหมด */}
        <div className="bg-red-50 p-6 sm:p-8 rounded-[32px] shadow-sm border border-red-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-xl font-black text-red-700 mb-2 flex items-center">
              <AlertTriangle className="mr-3"/> รีเซ็ตสต๊อกสินค้าทั้งหมด
            </h3>
            <p className="text-sm text-red-500">
              ระบบจะทำการล้างยอดสต๊อกของสินค้าทุกชิ้นในทุกสาขาให้กลับเป็น 0 ทั้งหมด
              <strong className="block mt-1">การกระทำนี้ไม่สามารถย้อนกลับได้!</strong>
            </p>
          </div>
          <button
            onClick={() => setActionConfirmModal({
              isOpen: true,
              title: 'ยืนยันการล้างสต๊อกทั้งหมด',
              message: 'คุณกำลังจะรีเซ็ตสต๊อกสินค้าของทุกสาขากลับเป็น 0 ทั้งหมด แน่ใจหรือไม่?',
              action: executeResetAllStock,
              confirmText: 'ล้างสต๊อกทั้งหมด',
              confirmColor: 'bg-red-600 hover:bg-red-700'
            })}
            className="shrink-0 bg-white border border-red-200 text-red-600 hover:bg-red-600 hover:text-white px-6 py-3 rounded-2xl font-bold transition-colors flex items-center shadow-sm"
          >
            <Trash2 size={20} className="mr-2"/> ล้างสต๊อกให้เป็น 0
          </button>
        </div>

        {/* ล้างข้อมูลทดสอบเฉพาะเดือนปัจจุบัน (Scoped Cleanup) */}
        <div className="bg-orange-500 p-6 sm:p-8 rounded-[32px] shadow-lg border border-orange-600 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-xl"></div>
          <div className="relative z-10">
            <h3 className="text-xl font-black mb-2 flex items-center"><Sparkles className="mr-3 text-yellow-200"/> ล้างข้อมูลทดสอบเฉพาะเดือนนี้</h3>
            <p className="text-sm text-orange-100 max-w-lg">
              ลบเฉพาะรายการ <strong>ตั้งแต่วันแรกของเดือนปัจจุบัน</strong> เท่านั้น — เลือกได้ว่าจะลบคำสั่งซื้อ / การจอง / ประวัติ / สแกนผิว และกรองตามเบอร์ลูกค้าได้ (เช่น เบอร์ที่ใช้ทดสอบ) พร้อมพรีวิวก่อนลบ
            </p>
          </div>
          <button
            onClick={() => { setIsMonthCleanupOpen(true); setCleanupPreview(null); setCleanupInput(''); }}
            className="shrink-0 bg-white text-orange-600 hover:bg-orange-50 px-6 py-4 rounded-2xl font-black transition-colors flex items-center shadow-lg active:scale-95 relative z-10"
          >
            <Trash2 size={24} className="mr-3"/> ล้างข้อมูลทดสอบเดือนนี้
          </button>
        </div>

        {/* ล้างข้อมูลทดสอบทั้งหมด (Clear Test Data Go-Live) */}
        <div className="bg-red-600 p-6 sm:p-8 rounded-[32px] shadow-lg border border-red-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-xl"></div>
          <div className="relative z-10">
            <h3 className="text-xl font-black mb-2 flex items-center"><Sparkles className="mr-3 text-yellow-300"/> ล้างข้อมูลทดสอบทั้งหมด</h3>
            <p className="text-sm text-red-100 max-w-lg">
              ล้างประวัติการขาย การจอง และข้อมูลทดสอบทั้งหมด <strong>เพื่อเตรียมความพร้อมสำหรับเปิดร้านจริง (Go-Live)</strong> โดยจะเก็บข้อมูลลูกค้า พนักงาน และการตั้งค่าไว้
            </p>
          </div>
          <button
            onClick={() => setIsClearDataModalOpen(true)}
            className="shrink-0 bg-white text-red-600 hover:bg-red-50 px-6 py-4 rounded-2xl font-black transition-colors flex items-center shadow-lg active:scale-95 relative z-10"
          >
            <Trash2 size={24} className="mr-3 animate-pulse"/> ล้างข้อมูลเตรียมเปิดร้าน
          </button>
        </div>

        {/* โซนอันตราย (Danger Zone) */}
        <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-sm border border-red-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-red-500"></div>
          <button
            onClick={() => setIsDangerZoneExpanded(!isDangerZoneExpanded)}
            className="w-full text-left flex items-center justify-between group"
          >
            <h3 className="text-xl font-black text-red-600 flex items-center">
              <AlertTriangle className="mr-3"/> โซนอันตราย (Danger Zone)
            </h3>
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-red-100 transition-colors">
              {isDangerZoneExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </button>

          {isDangerZoneExpanded && (
            <div className="mt-6 animate-in slide-in-from-top-4 duration-200">
              <p className="text-sm text-gray-600 mb-6 font-medium">
                ระมัดระวัง! การกดลบข้อมูลด้านล่างนี้จะเป็นการ <span className="text-red-500 font-bold underline">ลบออกจากฐานข้อมูล Cloud อย่างถาวร</span> และไม่สามารถกู้คืนได้
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
                {deleteButtons.map((btn, idx) => (
                  <button key={idx} onClick={() => setConfirmDeleteModal({ isOpen: true, type: btn.type, data: btn.data })} disabled={btn.data.length === 0}
                    className="bg-red-50 hover:bg-red-100 disabled:bg-gray-50 disabled:text-gray-300 text-red-600 border border-red-100 disabled:border-gray-200 p-4 rounded-2xl text-sm font-bold flex items-center justify-between transition-colors group shadow-sm active:scale-95">
                    <span className="flex items-center"><Trash2 size={18} className="mr-2"/> {btn.label}</span>
                    <span className="bg-white group-disabled:bg-gray-100 px-2.5 py-1 rounded-lg text-[10px] border border-red-100 group-disabled:border-gray-200">{btn.data.length} รายการ</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ตารางจัดการข้อมูล (Data Management Table) */}
        <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-sm border border-gray-100">
          <button
            onClick={() => setIsDataMgmtExpanded(!isDataMgmtExpanded)}
            className="w-full text-left flex items-center justify-between group"
          >
            <h3 className="text-xl font-black text-gray-800 flex items-center">
              <List className="mr-3 text-indigo-500"/> จัดการข้อมูลระบบแบบละเอียด
            </h3>
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 group-hover:bg-gray-100 transition-colors">
              {isDataMgmtExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </button>

          {isDataMgmtExpanded && (
            <div className="mt-6 animate-in slide-in-from-top-4 duration-200">
              <p className="text-sm text-gray-500 mb-6">เลือกข้อมูลที่ต้องการลบออกจากฐานข้อมูล คุณสามารถเลือกทีละรายการหรือเลือกทั้งหมดได้</p>

              {/* เลือก Collection */}
              <div className="mb-6">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">เลือกประเภทข้อมูล</label>
                <select
                  value={settingsSelectedCollection}
                  onChange={(e) => { setSettingsSelectedCollection(e.target.value); setSelectedItems(new Set()); }}
                  className="w-full sm:w-64 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-indigo-400"
                >
                  <option value="courses">ใบคอร์ส ({courses.length} รายการ)</option>
                  <option value="customers">ลูกค้า ({customersRaw.length} รายการ)</option>
                  <option value="histories">ประวัติ ({histories.length} รายการ)</option>
                  <option value="bookings">การจองคิว ({bookings.length} รายการ)</option>
                  <option value="orders">คำสั่งซื้อ ({orders.length} รายการ)</option>
                  <option value="products">สินค้า ({products.length} รายการ)</option>
                  <option value="master_courses">คอร์สตั้งต้น ({masterCourses.length} รายการ)</option>
                </select>
              </div>

              {/* ตารางข้อมูล */}
              <div className="overflow-x-auto rounded-2xl border border-gray-200">
                <table className="w-full text-sm text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="py-3 px-4 w-12">
                        <input
                          type="checkbox"
                          checked={getCurrentCollectionData().length > 0 && selectedItems.size === getCurrentCollectionData().length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems(new Set(getCurrentCollectionData().map(item => item.id)));
                            } else {
                              setSelectedItems(new Set());
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </th>
                      <th className="py-3 px-4 font-black text-gray-500 text-[10px] uppercase tracking-wider">ข้อมูล</th>
                      <th className="py-3 px-4 font-black text-gray-500 text-[10px] uppercase tracking-wider w-32">วันที่</th>
                      <th className="py-3 px-4 font-black text-gray-500 text-[10px] uppercase tracking-wider w-24">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {getCurrentCollectionData().slice(0, 50).map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedItems);
                              if (e.target.checked) {
                                newSelected.add(item.id);
                              } else {
                                newSelected.delete(item.id);
                              }
                              setSelectedItems(newSelected);
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-800 text-sm">{getItemDisplayName(item, settingsSelectedCollection)}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{getItemSubInfo(item, settingsSelectedCollection)}</div>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-500">
                          {getItemDate(item)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                            {getItemStatus(item, settingsSelectedCollection)}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {getCurrentCollectionData().length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-400 font-bold">ไม่มีข้อมูลในหมวดหมู่นี้</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {getCurrentCollectionData().length > 50 && (
                <p className="text-xs text-gray-400 text-center mt-2">แสดง 50 จาก {getCurrentCollectionData().length} รายการ</p>
              )}

              {/* ปุ่มดำเนินการ */}
              <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    if (selectedItems.size === 0) return showToast('กรุณาเลือกรายการที่ต้องการลบ');
                    const itemsToDelete = getCurrentCollectionData().filter(item => selectedItems.has(item.id));
                    setConfirmDeleteModal({ isOpen: true, type: settingsSelectedCollection, data: itemsToDelete });
                  }}
                  disabled={selectedItems.size === 0}
                  className="bg-red-500 hover:bg-red-600 disabled:bg-gray-200 disabled:text-gray-400 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center transition-colors active:scale-95"
                >
                  <Trash2 size={16} className="mr-2" />
                  ลบที่เลือก ({selectedItems.size} รายการ)
                </button>
                <button
                  onClick={() => {
                    setSelectedItems(new Set(getCurrentCollectionData().map(item => item.id)));
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center transition-colors active:scale-95"
                >
                  เลือกทั้งหมด
                </button>
                <button
                  onClick={() => setSelectedItems(new Set())}
                  className="bg-gray-50 hover:bg-gray-100 text-gray-500 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center transition-colors active:scale-95"
                >
                  ยกเลิกการเลือก
                </button>
              </div>
            </div>
          )}
        </div>
      </>)}

    </div>
  );
}
