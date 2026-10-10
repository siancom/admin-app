import re

file_path = "src/components/POSSystem.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. State for Bed Modal
if "const [isBedModalOpen, setIsBedModalOpen]" not in content:
    content = content.replace(
        "  // Checkout Details",
        "  const [isBedModalOpen, setIsBedModalOpen] = useState(false);\n  // Checkout Details"
    )

# 2. Replace the inline RoomManagementBoard in POSSystem.jsx with a Button
old_inline_board = """      <div className="flex-1 flex flex-col h-full border-r border-slate-200">
        <div className="p-4 bg-slate-50 border-b border-slate-200 overflow-y-auto max-h-48 custom-scrollbar">
          <RoomManagementBoard bookings={bookings} globalBranch={globalBranch} />
        </div>
        <div className="p-4 bg-white border-b border-slate-200">
          
          {/* Clocked in Employees Header */}"""

new_button = """      <div className="flex-1 flex flex-col h-full border-r border-slate-200">
        <div className="p-4 bg-white border-b border-slate-200">
          
          <button onClick={() => setIsBedModalOpen(true)} className="w-full mb-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg border border-indigo-200 shadow-sm flex items-center justify-center gap-2 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>
            ดูสถานะเตียงทรีตเมนต์ (Bed Management)
          </button>

          {/* Clocked in Employees Header */}"""

content = content.replace(old_inline_board, new_button)

# 3. Add Bed Modal at the end of POSSystem.jsx
if "<RoomManagementBoard bookings={bookings}" not in content and "isOpen={isBedModalOpen}" not in content:
    content = content.replace(
        "      <FollowUpPromptModal ",
        "      <RoomManagementBoard \n        bookings={bookings} \n        globalBranch={globalBranch} \n        isOpen={isBedModalOpen} \n        onClose={() => setIsBedModalOpen(false)} \n      />\n      <FollowUpPromptModal "
    )

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("POSSystem.jsx patched successfully")
