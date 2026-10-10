import re

app_file = "src/App.jsx"
with open(app_file, "r", encoding="utf-8") as f:
    app_content = f.read()

# 1. Add import in App.jsx
if "import { sendOrderLineNotification } from './utils/lineUtils';" not in app_content:
    app_content = app_content.replace(
        "import RoomManagementBoard from './components/RoomManagementBoard';",
        "import RoomManagementBoard from './components/RoomManagementBoard';\nimport { sendOrderLineNotification } from './utils/lineUtils';"
    )

# 2. Remove old sendOrderLineNotification in App.jsx
import_regex = re.compile(r'const sendOrderLineNotification = async.*?};', re.DOTALL)
# But it's safer to just replace a specific substring if possible, or I can use the regex, but regex can match too much.
# Let's find the start and end of it.
start_str = "  const sendOrderLineNotification = async (order, newStatus, lineUid) => {"
end_str = "  const updateBookingStatus = async (bookingId, newStatus) => {"

if start_str in app_content:
    before = app_content.split(start_str)[0]
    after = app_content.split(start_str)[1]
    after = end_str + after.split(end_str, 1)[1]
    app_content = before + after

with open(app_file, "w", encoding="utf-8") as f:
    f.write(app_content)


pos_file = "src/components/POSSystem.jsx"
with open(pos_file, "r", encoding="utf-8") as f:
    pos_content = f.read()

# 1. Add import in POSSystem.jsx
if "import { sendOrderLineNotification } from '../utils/lineUtils';" not in pos_content:
    pos_content = pos_content.replace(
        "import RoomManagementBoard from './RoomManagementBoard';",
        "import RoomManagementBoard from './RoomManagementBoard';\nimport { sendOrderLineNotification } from '../utils/lineUtils';\nimport { getFuzzyKey } from '../utils/priceUtils';"
    )

# 2. Update handleCheckout to send notification
old_batch = """      if (activeCustomerAppOrderIds.length > 0) {
        activeCustomerAppOrderIds.forEach(id => {
          const custAppOrderRef = doc(getCol('orders'), id);
          batch.update(custAppOrderRef, { status: "อนุมัติแล้ว", updatedAt: customDateObj.toISOString() });
        });
      }"""

new_batch = """      if (activeCustomerAppOrderIds.length > 0) {
        activeCustomerAppOrderIds.forEach(id => {
          const custAppOrderRef = doc(getCol('orders'), id);
          batch.update(custAppOrderRef, { status: "อนุมัติแล้ว", updatedAt: customDateObj.toISOString() });
          
          // Send LINE Notification
          const relatedOrder = orders.find(o => o.id === id);
          if (relatedOrder && relatedOrder.customerPhone) {
             const targetCustomer = customers.find(c => String(c.computedPhone || getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '').trim() === String(relatedOrder.customerPhone).trim());
             if (targetCustomer && targetCustomer.lineUid) {
                 sendOrderLineNotification(relatedOrder, 'อนุมัติแล้ว', targetCustomer.lineUid);
             }
          }
        });
      }"""

if "sendOrderLineNotification(relatedOrder" not in pos_content:
    pos_content = pos_content.replace(old_batch, new_batch)

with open(pos_file, "w", encoding="utf-8") as f:
    f.write(pos_content)

print("App.jsx and POSSystem.jsx patched successfully")
