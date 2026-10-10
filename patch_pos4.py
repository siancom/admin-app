import re

with open('/Users/ittichai/admin-dashboard/src/components/POSSystem.jsx', 'r') as f:
    content = f.read()

# 1. Modify the Unselected Customer block
old_unselected = """            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="ค้นหาลูกค้า (ชื่อ, เบอร์โทร)..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setIsCustomerDropdownOpen(true);
                  }}
                  onFocus={() => setIsCustomerDropdownOpen(true)}
                />"""

new_unselected = """            ) : (
              <div className="flex gap-2 relative">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text"
                    placeholder="ค้นหาลูกค้า (ชื่อ, เบอร์โทร)..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setIsCustomerDropdownOpen(true);
                    }}
                    onFocus={() => setIsCustomerDropdownOpen(true)}
                  />
                </div>
                <button 
                  onClick={() => setIsMobileCartOpen(true)} 
                  className="lg:hidden flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl font-bold shadow-sm transition-colors active:scale-95 shrink-0"
                >
                  <ShoppingCart size={18} />
                  <span>{cart.length > 0 ? cart.length : ''}</span>
                </button>"""
content = content.replace(old_unselected, new_unselected)

# 2. Modify the Selected Customer block
old_selected_close = """                    )}
                  </div>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                  <X size={20} />
                </button>
              </div>"""

new_selected_close = """                    )}
                  </div>
                </div>
                
                <div className="flex flex-col justify-between items-end gap-2 shrink-0 ml-2 border-l border-indigo-100 pl-3">
                  <button onClick={() => setSelectedCustomer(null)} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                    <X size={20} />
                  </button>
                  <button 
                    onClick={() => setIsMobileCartOpen(true)} 
                    className="lg:hidden flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-bold shadow-sm transition-colors active:scale-95"
                  >
                    <ShoppingCart size={14} />
                    <span className="text-xs">{cart.length > 0 ? cart.length : ''}</span>
                  </button>
                </div>
              </div>"""
content = content.replace(old_selected_close, new_selected_close)


# 3. Remove the Floating Mobile Cart Button block at the bottom
# We need to find this exact string and remove it
bottom_button_marker = """        {/* Floating Mobile Cart Button */}
        <div className="lg:hidden p-4 bg-white border-t border-slate-200 shrink-0">
           <button onClick={() => setIsMobileCartOpen(true)} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/30 flex items-center justify-between px-6 transition-transform active:scale-95">
              <div className="flex items-center gap-2"><ShoppingCart size={24} /> ตะกร้าสินค้า</div>
              <div className="bg-white text-indigo-600 px-3 py-1 rounded-xl text-sm">{cart.length} รายการ</div>
           </button>
        </div>"""
content = content.replace(bottom_button_marker, "")

with open('/Users/ittichai/admin-dashboard/src/components/POSSystem.jsx', 'w') as f:
    f.write(content)

print("Patch 4 applied")
