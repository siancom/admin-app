import re

filepath = "src/App_mobile.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add imports
if "import { sendOrderLineNotification } from './utils/lineUtils';" not in content:
    content = content.replace(
        "import { getFuzzyKey as getVal } from './utils/fuzzy';",
        "import { getFuzzyKey as getVal } from './utils/fuzzy';\nimport { sendOrderLineNotification } from './utils/lineUtils';"
    )

# 2. Helper function to trigger notification
helper = """
  const triggerLineNotif = (orderId, newStatus, currentOrderData = null) => {
      const order = currentOrderData || dbData.orders.find(o => o.id === orderId);
      if (order && order.customerPhone) {
          const targetCustomer = dbData.customers.find(c => String(c.computedPhone || getVal(c, ["เบอร์โทร", "col_3"]) || '').trim() === String(order.customerPhone).trim());
          if (targetCustomer && targetCustomer.lineUid) {
              sendOrderLineNotification(order, newStatus, targetCustomer.lineUid);
          }
      }
  };
"""
if "const triggerLineNotif =" not in content:
    content = content.replace(
        "const [activeTab, setActiveTab] = useState('more');",
        "const [activeTab, setActiveTab] = useState('more');\n" + helper
    )

# 3. Patch the updates
replacements = [
    (
        "else if (type === 'approve_order') { await updateDoc(doc(db, 'orders', id), { status: 'สำเร็จ (ชำระแล้ว)', updatedAt: new Date().toISOString() }); showToast('อนุมัติสลิปสำเร็จ'); }",
        "else if (type === 'approve_order') { await updateDoc(doc(db, 'orders', id), { status: 'สำเร็จ (ชำระแล้ว)', updatedAt: new Date().toISOString() }); triggerLineNotif(id, 'สำเร็จ (ชำระแล้ว)'); showToast('อนุมัติสลิปสำเร็จ'); }"
    ),
    (
        "else if (type === 'cancel_order') { await updateDoc(doc(db, 'orders', id), { status: 'ยกเลิก', updatedAt: new Date().toISOString() }); showToast('ยกเลิกรายการสำเร็จ'); }",
        "else if (type === 'cancel_order') { await updateDoc(doc(db, 'orders', id), { status: 'ยกเลิก', updatedAt: new Date().toISOString() }); triggerLineNotif(id, 'ยกเลิก'); showToast('ยกเลิกรายการสำเร็จ'); }"
    ),
    (
        "await updateDoc(doc(db, 'orders', id), { itemPrice: price, originalPrice: price, status: 'รอชำระเงิน', updatedAt: new Date().toISOString() });",
        "await updateDoc(doc(db, 'orders', id), { itemPrice: price, originalPrice: price, status: 'รอชำระเงิน', updatedAt: new Date().toISOString() }); triggerLineNotif(id, 'รอชำระเงิน');"
    ),
    (
        "await updateDoc(doc(db, 'orders', id), { itemPrice: amount, status: 'อนุมัติแล้ว', updatedAt: new Date().toISOString() });",
        "await updateDoc(doc(db, 'orders', id), { itemPrice: amount, status: 'อนุมัติแล้ว', updatedAt: new Date().toISOString() }); triggerLineNotif(id, 'อนุมัติแล้ว');"
    ),
    (
        "await updateDoc(doc(db, 'orders', order.id), { trackingNo: finalTracking, status: 'จัดส่งแล้ว', updatedAt: new Date().toISOString() });",
        "await updateDoc(doc(db, 'orders', order.id), { trackingNo: finalTracking, status: 'จัดส่งแล้ว', updatedAt: new Date().toISOString() }); triggerLineNotif(order.id, 'จัดส่งแล้ว', order);"
    ),
    (
        "else if (actionType === 'complete_order') { await updateDoc(doc(db, 'orders', item.id), { status: 'สำเร็จ (รับของแล้ว)', updatedAt: new Date().toISOString() }); showToast('รับออเดอร์สำเร็จ!'); }",
        "else if (actionType === 'complete_order') { await updateDoc(doc(db, 'orders', item.id), { status: 'สำเร็จ (รับของแล้ว)', updatedAt: new Date().toISOString() }); triggerLineNotif(item.id, 'สำเร็จ (รับของแล้ว)', item); showToast('รับออเดอร์สำเร็จ!'); }"
    )
]

for old, new in replacements:
    content = content.replace(old, new)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("App_mobile.tsx patched successfully!")
