import re

file_path = "src/components/POSSystem.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Imports
if "FollowUpPromptModal" not in content:
    content = content.replace(
        "import TreatmentJobSlipModal from './TreatmentJobSlipModal';",
        "import TreatmentJobSlipModal from './TreatmentJobSlipModal';\nimport FollowUpPromptModal from './FollowUpPromptModal';\nimport { ref, uploadString, getDownloadURL } from 'firebase/storage';\nimport { storage } from '../config/firebase';"
    )

# 2. States
if "treatmentNotes" not in content:
    state_injection = """  // Checkout Details
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [treatmentNotes, setTreatmentNotes] = useState('');
  const [paymentPhotoUrl, setPaymentPhotoUrl] = useState(null);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpCustomer, setFollowUpCustomer] = useState(null);
  const fileInputRef = useRef(null);"""
    
    content = content.replace("  // Checkout Details\n  const [checkoutStep, setCheckoutStep] = useState(1);", state_injection)

# 3. HandleCheckout
if "treatmentNotes:" not in content:
    history_injection = """        paymentMethod,
        splitPayment: paymentMethod === 'split' ? { 
          transfer: transferAmount, 
          cash: cashAmount,
          creditCard: creditCardAmount
        } : {},
        paymentStaff,
        treatmentNotes,
        paymentPhotoUrl,"""
    content = content.replace("""        paymentMethod,
        splitPayment: paymentMethod === 'split' ? { 
          transfer: transferAmount, 
          cash: cashAmount,
          creditCard: creditCardAmount
        } : {},
        paymentStaff,""", history_injection)

# 4. HandleCheckout Completion
# When successful, if there's a customer, we show followup modal.
# Instead of doing complex string manipulation here, I will just add the followup modal UI.
# In checkout completion, it calls:
#      showToast('ชำระเงินสำเร็จ!', 'success');
#      setCheckoutStep(1);
#      setCart([]);
# Let's replace the success toast in handleCheckout to trigger followup if there is a customer.
success_block = """      showToast('ชำระเงินสำเร็จ!', 'success');
      setCheckoutStep(1);
      setCart([]);"""
success_block_new = """      showToast('ชำระเงินสำเร็จ!', 'success');
      setCheckoutStep(1);
      setCart([]);
      if (selectedCustomer) {
         setFollowUpCustomer(selectedCustomer);
         setShowFollowUpModal(true);
      }"""
if "setFollowUpCustomer" not in content:
    content = content.replace(success_block, success_block_new)

# 5. Add UI in Checkout Step 2
if "treatmentNotes" not in content and "บันทึกการรักษา (Treatment Notes)" not in content:
    ui_injection = """                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-2">พนักงานผู้ให้บริการ <span className="text-red-500">*</span></label>
                    <select value={paymentStaff} onChange={e => setPaymentStaff(e.target.value)} className="w-full border-2 border-slate-200 rounded-xl p-3 outline-none focus:border-pink-400 font-medium">
                      <option value="">-- เลือกพนักงาน --</option>
                      {employees.filter(emp => !globalBranch || emp.branch === globalBranch || emp.branch === 'สำนักงานใหญ่').map(emp => (
                        <option key={emp.id} value={emp.name}>{emp.name} ({emp.branch})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                     <label className="block text-sm font-bold text-slate-600 mb-2">อัปโหลดรูปภาพ Before/After (ถ้ามี)</label>
                     <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative overflow-hidden">
                       <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                              const reader = new FileReader();
                              reader.onload = (e) => setPaymentPhotoUrl(e.target.result);
                              reader.readAsDataURL(file);
                          }
                       }} className="absolute inset-0 opacity-0 cursor-pointer" />
                       
                       {paymentPhotoUrl ? (
                         <div className="text-center text-emerald-600 font-bold flex flex-col items-center">
                           <CheckCircle size={32} className="mb-2" />
                           อัปโหลดรูปภาพเรียบร้อยแล้ว
                         </div>
                       ) : (
                         <div className="text-center text-slate-500 font-medium flex flex-col items-center">
                           <Camera size={32} className="mb-2 text-slate-400" />
                           คลิกเพื่อเลือกไฟล์รูปภาพ
                         </div>
                       )}
                     </div>
                  </div>

                  <div>
                     <label className="block text-sm font-bold text-slate-600 mb-2">บันทึกการรักษา (Treatment Notes)</label>
                     <textarea 
                        value={treatmentNotes}
                        onChange={(e) => setTreatmentNotes(e.target.value)}
                        placeholder="เช่น 500 ช็อต, พลังงาน 2.0, หน้าแดงนิดหน่อย"
                        className="w-full border-2 border-slate-200 rounded-xl p-3 outline-none focus:border-pink-400 font-medium h-24 resize-none"
                     ></textarea>
                  </div>"""
    
    old_staff_block = """                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-2">พนักงานผู้ให้บริการ <span className="text-red-500">*</span></label>
                    <select value={paymentStaff} onChange={e => setPaymentStaff(e.target.value)} className="w-full border-2 border-slate-200 rounded-xl p-3 outline-none focus:border-pink-400 font-medium">
                      <option value="">-- เลือกพนักงาน --</option>
                      {employees.filter(emp => !globalBranch || emp.branch === globalBranch || emp.branch === 'สำนักงานใหญ่').map(emp => (
                        <option key={emp.id} value={emp.name}>{emp.name} ({emp.branch})</option>
                      ))}
                    </select>
                  </div>"""
    content = content.replace(old_staff_block, ui_injection)

# 6. Inject FollowUpPromptModal at the end of component
if "<FollowUpPromptModal" not in content:
    content = content.replace(
        "    </div>\n  );\n}\n",
        """      <FollowUpPromptModal 
        isOpen={showFollowUpModal} 
        onClose={() => setShowFollowUpModal(false)}
        customer={followUpCustomer}
        onComplete={() => setShowFollowUpModal(false)}
        showToast={showToast}
        globalBranch={globalBranch}
      />\n    </div>\n  );\n}\n"""
    )

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("done")
