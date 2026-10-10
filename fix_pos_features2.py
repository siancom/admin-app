import re

with open("src/components/POSSystem.jsx", "r") as f:
    content = f.read()

# 1. Add Stock Toggle Button
search_marker = '<div className="relative hidden lg:block">'
toggle_btn = """
          {activeTab === 'products' && (
            <button
              onClick={() => setIsStockMode(!isStockMode)}
              className={`hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${isStockMode ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              <Package size={20} /> {isStockMode ? 'ปิดโหมดนับสต๊อก' : 'โหมดนับสต๊อก'}
            </button>
          )}
"""
content = content.replace(search_marker, toggle_btn + "          " + search_marker)

# Also add it for Mobile (next to the back button)
mobile_back_marker = "{onClosePos && (\n              <button onClick={onClosePos}"
mobile_toggle = """
            {activeTab === 'products' && (
              <button
                onClick={() => setIsStockMode(!isStockMode)}
                className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center transition-all ${isStockMode ? 'bg-rose-500 text-white shadow-md' : 'bg-white border border-indigo-100 text-indigo-600 shadow-sm'}`}
              >
                <Package size={20} />
              </button>
            )}
"""
content = content.replace(mobile_back_marker, mobile_toggle + "            " + mobile_back_marker)

# 2. Update Product Card onClick and animation
card_marker = "onClick={() => addToCart(p, 'product')}"
card_replacement = "onClick={() => isStockMode ? setStockInputModal({ isOpen: true, item: p, inputVal: '' }) : addToCart(p, 'product')}"
content = content.replace(card_marker, card_replacement)

# Make unadjusted products pulse in stock mode
card_class_marker = 'className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all active:scale-95 flex flex-col h-full"'
card_class_replacement = 'className={`bg-white rounded-2xl shadow-sm border overflow-hidden cursor-pointer transition-all flex flex-col h-full ${isStockMode ? (stockAdjustments.some(a => a.id === p.id) ? "border-emerald-500 opacity-70" : "border-rose-400 animate-pulse shadow-[0_0_15px_rgba(251,113,133,0.3)]") : "border-slate-100 hover:shadow-md hover:border-indigo-200 active:scale-95"}`}'
content = content.replace(card_class_marker, card_class_replacement)

# 3. Add Green Check to adjusted products
img_marker = '                  <div className="absolute inset-0 bg-emerald-500/20 z-10 flex items-center justify-center backdrop-blur-[1px]">\n                    <CheckCircle size={40} className="text-white drop-shadow-md" />\n                  </div>\n                )}'
img_replacement = img_marker + '\n                {isStockMode && stockAdjustments.some(a => a.id === p.id) && (\n                  <div className="absolute inset-0 bg-emerald-500/20 z-10 flex items-center justify-center backdrop-blur-[1px]">\n                    <CheckCircle size={40} className="text-emerald-600 bg-white rounded-full drop-shadow-md" />\n                  </div>\n                )}'
content = content.replace(img_marker, img_replacement)


# 4. Replace Cart Section with Stock Adjustments when in Stock Mode
cart_start_marker = "        {/* Floating Mobile Cart Button */}"
stock_cart_ui = """
        {isStockMode ? (
          <>
          {/* Mobile: View Stock Adjustments Button */}
          <div className="lg:hidden absolute bottom-4 left-4 right-4 z-40">
            <button 
              onClick={() => setIsMobileCartOpen(true)}
              className="w-full bg-rose-600 text-white rounded-2xl py-4 font-black text-lg shadow-lg shadow-rose-200 flex items-center justify-center gap-3 active:scale-95"
            >
              <Package size={24} /> 
              รายการนับสต๊อก 
              <span className="bg-white text-rose-600 px-2 py-0.5 rounded-lg text-sm">{stockAdjustments.length}</span>
            </button>
          </div>
          </>
        ) : (
          <>
"""
content = content.replace(cart_start_marker, stock_cart_ui + "\n        " + cart_start_marker)

# close the fragment after the cart view button
cart_end_marker = "          </button>\n        </div>"
content = content.replace(cart_end_marker, cart_end_marker + "\n          </>\n        )")

with open("src/components/POSSystem.jsx", "w") as f:
    f.write(content)
print("Updated product cards and mobile cart button")
