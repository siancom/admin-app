import re

with open("src/App.jsx", "r") as f:
    text = f.read()

# Replace header
old_header = '<header className="h-16 lg:h-20 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-4 sm:px-8 z-30 sticky top-0 shrink-0 shadow-sm">'
new_header = '<header className="hidden lg:flex h-20 bg-white/80 backdrop-blur-md border-b border-gray-200 items-center justify-between px-8 z-30 sticky top-0 shrink-0 shadow-sm">'
text = text.replace(old_header, new_header)

# Replace mobile nav bar
nav_start_idx = text.find('<div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex justify-around items-center h-16')
if nav_start_idx != -1:
    count = 0
    started = False
    nav_end_idx = -1
    for i, c in enumerate(text[nav_start_idx:]):
        if text[nav_start_idx+i:nav_start_idx+i+4] == '<div': count += 1
        elif text[nav_start_idx+i:nav_start_idx+i+5] == '</div': count -= 1
        
        if count > 0: started = True
        if started and count == 0:
            nav_end_idx = nav_start_idx + i + 6
            break
            
    if nav_end_idx != -1:
        new_nav = """<div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex justify-around items-end h-[68px] pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-2">
         <button onClick={() => { setActiveTab('dashboard'); setIsMobileMoreMenuOpen(false); }} className={`flex flex-col items-center justify-center w-full h-full pb-1.5 space-y-1 ${activeTab === 'dashboard' ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600'}`}>
            <Home size={22} className={activeTab === 'dashboard' ? 'stroke-[2.5px]' : ''} />
            <span className="text-[9px] font-bold">หน้าแรก</span>
         </button>
         
         <button onClick={() => { setActiveTab('customers'); setIsMobileMoreMenuOpen(false); }} className={`flex flex-col items-center justify-center w-full h-full pb-1.5 space-y-1 ${activeTab === 'customers' ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600'}`}>
            <Users size={22} className={activeTab === 'customers' ? 'stroke-[2.5px]' : ''} />
            <span className="text-[9px] font-bold">ลูกค้า</span>
         </button>

         {/* Prominent Center POS Button */}
         <div className="relative w-full flex justify-center h-full z-10">
           <button onClick={() => { setActiveTab('pos'); setIsMobileMoreMenuOpen(false); }} className={`absolute -top-6 ${activeTab === 'pos' ? 'bg-teal-600 border-teal-100 shadow-teal-600/50' : 'bg-teal-500 border-white shadow-teal-500/40'} text-white w-[64px] h-[64px] rounded-full flex items-center justify-center shadow-lg border-[4px] transition-all active:scale-95`}>
              <ScanLine size={28} className="stroke-[2.5px]" />
           </button>
           <span className={`text-[10px] font-bold absolute bottom-1.5 ${activeTab === 'pos' ? 'text-teal-600' : 'text-gray-500'}`}>POS</span>
         </div>

         <button onClick={() => setIsMobileMoreMenuOpen(true)} className={`flex flex-col items-center justify-center w-full h-full pb-1.5 space-y-1 ${isMobileMoreMenuOpen ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600'}`}>
            <Menu size={22} className={isMobileMoreMenuOpen ? 'stroke-[2.5px]' : ''} />
            <span className="text-[9px] font-bold">เมนู</span>
         </button>
         
         <button onClick={() => { localStorage.removeItem('selectedBranch'); localStorage.removeItem('userRole'); setGlobalBranch(null); setGlobalRole(null); setLoginStep('role_selection'); setIsMobileMoreMenuOpen(false); }} className="flex flex-col items-center justify-center w-full h-full pb-1.5 space-y-1 text-rose-500 hover:text-rose-600 transition-colors">
            <LogOut size={22} />
            <span className="text-[9px] font-bold">ออกระบบ</span>
         </button>
      </div>"""
        text = text[:nav_start_idx] + new_nav + text[nav_end_idx:]

with open("src/App.jsx", "w") as f:
    f.write(text)
print("Updated successfully")
