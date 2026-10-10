import re

file_path = "src/App.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. State for Bed Modal
if "const [isBedModalOpen, setIsBedModalOpen]" not in content:
    content = content.replace(
        "const [activeTab, setActiveTab] = useState('dashboard');",
        "const [activeTab, setActiveTab] = useState('dashboard');\n  const [isBedModalOpen, setIsBedModalOpen] = useState(false);"
    )

# 2. Add Bed Modal in App.jsx (bottom of component, near other modals)
if "<RoomManagementBoard bookings={bookings}" not in content and "isOpen={isBedModalOpen}" not in content:
    content = content.replace(
        "{/* Add new modles above here */}",
        "{/* Add new modles above here */}\n      <RoomManagementBoard \n        bookings={bookings} \n        globalBranch={globalBranch} \n        isOpen={isBedModalOpen} \n        onClose={() => setIsBedModalOpen(false)} \n      />"
    )

# 3. Replace the inline RoomManagementBoard in bookings tab with a Button
old_inline_board = "<RoomManagementBoard bookings={bookings} globalBranch={globalBranch} />"
new_button = """<button onClick={() => setIsBedModalOpen(true)} className="w-full mb-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl border border-indigo-200 shadow-sm flex items-center justify-center gap-2 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>
                ดูสถานะเตียงทรีตเมนต์ (Bed Management)
              </button>"""

content = content.replace(old_inline_board, new_button)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("App.jsx patched successfully")
