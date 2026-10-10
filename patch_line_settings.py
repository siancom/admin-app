import re

filepath = "src/App.jsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add Send, MessageSquare, ToggleLeft, ToggleRight to imports
old_import_end = "Bell, List, LayoutGrid, ScanLine, CalendarDays, ChevronLeft, ChevronUp, ChevronDown, BarChart3, Store, UserCheck, Wallet, Loader2, Scissors, Ticket, Gift\n} from 'lucide-react';"
new_import_end = "Bell, List, LayoutGrid, ScanLine, CalendarDays, ChevronLeft, ChevronUp, ChevronDown, BarChart3, Store, UserCheck, Wallet, Loader2, Scissors, Ticket, Gift,\n  Send, MessageSquare, ToggleLeft, ToggleRight, TestTube\n} from 'lucide-react';"
content = content.replace(old_import_end, new_import_end)

# 2. Add LINE Notification Settings state variables
if "const [lineNotifConfig, setLineNotifConfig] = useState" not in content:
    content = content.replace(
        "const [isClearingData, setIsClearingData] = useState(false);",
        "const [isClearingData, setIsClearingData] = useState(false);\n  const [lineNotifConfig, setLineNotifConfig] = useState({ orderNotif: true, bookingNotif: true, queueReminder: true });\n  const [lineTestTarget, setLineTestTarget] = useState('');\n  const [isSendingTest, setIsSendingTest] = useState(false);"
    )

# 3. Load LINE config from Firestore on mount
load_line_config = """
  // Load LINE Notification config
  useEffect(() => {
    const loadLineConfig = async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const snap = await getDoc(doc(db, 'config', 'lineNotifications'));
        if (snap.exists()) {
          setLineNotifConfig(prev => ({ ...prev, ...snap.data() }));
        }
      } catch(e) {}
    };
    loadLineConfig();
  }, []);
"""
if "Load LINE Notification config" not in content:
    content = content.replace(
        "  const triggerToast = (title, message, type = 'info') => {",
        load_line_config + "\n  const triggerToast = (title, message, type = 'info') => {"
    )

# 4. Save LINE config function  
save_line_config = """
  const saveLineNotifConfig = async (newConfig) => {
    try {
      await setDoc(getDocRef('config', 'lineNotifications'), newConfig, { merge: true });
      setLineNotifConfig(newConfig);
      showToast('บันทึกการตั้งค่าแจ้งเตือน LINE สำเร็จ', 'success');
    } catch(e) {
      showToast('เกิดข้อผิดพลาด: ' + e.message, 'error');
    }
  };

  const sendLineTestNotification = async () => {
    if (!lineTestTarget) return showToast('กรุณาเลือกลูกค้าที่ต้องการทดสอบก่อน', 'error');
    const customer = customersRaw.find(c => c.id === lineTestTarget);
    if (!customer || !customer.lineUid) return showToast('ลูกค้านี้ไม่ได้ผูก LINE หรือไม่มี LINE UID', 'error');
    setIsSendingTest(true);
    try {
      const fakeOrder = { 
        orderNo: 'TEST001', id: 'test_order_001',
        courseName: 'ทดสอบการแจ้งเตือน LINE Flex',
        totalPrice: 1990, customerName: customer.computedName || String(getFuzzyKey(customer, ['ชื่อ', 'col_1'])),
        cartItems: []
      };
      await sendOrderLineNotification(fakeOrder, 'อนุมัติแล้ว', customer.lineUid);
      showToast('ส่งข้อความทดสอบสำเร็จ! ✅ ตรวจสอบ LINE ของลูกค้าได้เลย', 'success');
    } catch(e) {
      showToast('ส่งไม่สำเร็จ: ' + e.message, 'error');
    } finally {
      setIsSendingTest(false);
    }
  };
"""
if "saveLineNotifConfig" not in content:
    content = content.replace(
        "  const handleRunMigration = async () => {",
        save_line_config + "\n  const handleRunMigration = async () => {"
    )

# 5. Insert LINE settings panel into settings tab - find a good insertion point
LINE_SETTINGS_PANEL = """
              {/* 🌟 LINE Flex Notification Settings 🌟 */}
              <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-sm border border-gray-100">
                <h3 className="text-xl font-black text-gray-800 mb-2 flex items-center">
                  <MessageSquare className="mr-3 text-green-500"/>
                  ตั้งค่าการแจ้งเตือน LINE Flex
                </h3>
                <p className="text-sm text-gray-500 mb-6">เปิด/ปิดการส่ง Flex Message อัตโนมัติไปยังลูกค้าผ่าน LINE และทดสอบระบบ</p>

                {/* Toggle switches */}
                <div className="space-y-4 mb-8">
                  {[
                    { key: 'orderNotif', label: 'แจ้งเตือนสถานะคำสั่งซื้อ', desc: 'ส่ง Flex เมื่อสถานะออเดอร์เปลี่ยน เช่น อนุมัติแล้ว, จัดส่งแล้ว, ยกเลิก ฯลฯ', color: 'text-indigo-500' },
                    { key: 'bookingNotif', label: 'แจ้งเตือนสถานะการจองคิว', desc: 'ส่ง Flex เมื่อสถานะคิวเปลี่ยน เช่น ยืนยันแล้ว, เสร็จสิ้น, ยกเลิก ฯลฯ', color: 'text-teal-500' },
                    { key: 'queueReminder', label: 'เตือนก่อนถึงเวลานัดหมาย', desc: 'ส่ง Flex เตือนลูกค้าอัตโนมัติก่อนเข้าบริการ 1 ชั่วโมง และ 20 นาที', color: 'text-orange-500' }
                  ].map(({ key, label, desc, color }) => {
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
                  <h4 className="font-bold text-gray-800 mb-1 flex items-center gap-2"><TestTube size={16} className="text-purple-500"/>ทดสอบส่ง Flex Message</h4>
                  <p className="text-xs text-gray-400 mb-4">เลือกลูกค้าที่ผูก LINE UID แล้วส่ง Flex ทดสอบหาลูกค้าคนนั้น (ส่งสถานะ "อนุมัติแล้ว" จากออเดอร์ตัวอย่าง)</p>
                  <div className="flex gap-3">
                    <select
                      value={lineTestTarget}
                      onChange={(e) => setLineTestTarget(e.target.value)}
                      className="flex-1 border border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400"
                    >
                      <option value="">-- เลือกลูกค้าที่มี LINE UID --</option>
                      {customersRaw.filter(c => c.lineUid).map(c => (
                        <option key={c.id} value={c.id}>
                          {c.computedName || String(getFuzzyKey(c, ['ชื่อ', 'col_1']) || '')} · {String(getFuzzyKey(c, ['เบอร์โทร', 'col_3']) || '')}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={sendLineTestNotification}
                      disabled={!lineTestTarget || isSendingTest}
                      className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shrink-0 ${!lineTestTarget || isSendingTest ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white shadow-md shadow-green-200 active:scale-95'}`}
                    >
                      {isSendingTest ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}
                      {isSendingTest ? 'กำลังส่ง...' : 'ส่งทดสอบ'}
                    </button>
                  </div>
                  {lineTestTarget && customersRaw.find(c => c.id === lineTestTarget)?.lineUid && (
                    <div className="mt-3 bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-xs text-green-700 font-mono">
                      LINE UID: {customersRaw.find(c => c.id === lineTestTarget)?.lineUid}
                    </div>
                  )}
                </div>
              </div>
"""

if "ตั้งค่าการแจ้งเตือน LINE Flex" not in content:
    # Insert before the GPS settings section
    content = content.replace(
        "{/* 🌟 จัดการสาขาและพิกัด GPS 🌟 */}",
        LINE_SETTINGS_PANEL + "\n              {/* 🌟 จัดการสาขาและพิกัด GPS 🌟 */}"
    )

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("LINE Notification Settings panel added successfully!")
