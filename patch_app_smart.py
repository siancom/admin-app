import re

file_path = "src/App.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Imports
if "RoomManagementBoard" not in content:
    content = content.replace(
        "import TreatmentJobSlipModal from './components/TreatmentJobSlipModal';",
        "import TreatmentJobSlipModal from './components/TreatmentJobSlipModal';\nimport RoomManagementBoard from './components/RoomManagementBoard';"
    )

# 2. updateBookingStatus
old_update_status = """              if (newStatus === 'กำลังใช้บริการ' && !targetBooking.serviceStartTime) updates.serviceStartTime = new Date().toISOString();
              if (newStatus === 'เสร็จสิ้น' && !targetBooking.serviceEndTime) updates.serviceEndTime = new Date().toISOString();"""

new_update_status = """              if (newStatus === 'กำลังใช้บริการ' && !targetBooking.serviceStartTime) updates.serviceStartTime = new Date().toISOString();
              if (newStatus === 'กำลังใช้บริการ') {
                  const bedNum = window.prompt("กรุณาระบุหมายเลขเตียง (1-4) หรือชื่อห้อง:", "1");
                  if (bedNum !== null) updates.bedNumber = bedNum;
              }
              if (newStatus === 'เสร็จสิ้น' && !targetBooking.serviceEndTime) updates.serviceEndTime = new Date().toISOString();
              if (newStatus === 'เสร็จสิ้น' || newStatus === 'รอชำระเงิน' || newStatus === 'ยกเลิก') updates.bedNumber = null;"""

if "window.prompt(\"กรุณาระบุหมายเลขเตียง" not in content:
    content = content.replace(old_update_status, new_update_status)

# 3. Add to bookings tab
# search for: {activeTab === 'bookings' && (
# and add <RoomManagementBoard bookings={bookings} globalBranch={globalBranch} /> right after the first div
old_bookings_tab = """          {activeTab === 'bookings' && (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">"""

new_bookings_tab = """          {activeTab === 'bookings' && (
            <div className="space-y-6">
              <RoomManagementBoard bookings={bookings} globalBranch={globalBranch} />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">"""

if "RoomManagementBoard bookings=" not in content:
    content = content.replace(old_bookings_tab, new_bookings_tab)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("App.jsx patched successfully")
