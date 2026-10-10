import re

with open("src/App.jsx", "r") as f:
    text = f.read()

# 1. Hide bottom nav on POS in App.jsx
old_nav = 'className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex justify-around items-end h-[68px] pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-2"'
new_nav = 'className={`lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 justify-around items-end h-[68px] pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-2 ${activeTab === \\\'pos\\\' ? \\\'hidden\\\' : \\\'flex\\\'}`}'
text = text.replace(old_nav, new_nav)

# 2. Add onClosePos prop in App.jsx
old_pos = '<POSSystem \n              products={products}'
new_pos = '<POSSystem \n              onClosePos={() => setActiveTab(\'dashboard\')}\n              products={products}'
text = text.replace(old_pos, new_pos)

with open("src/App.jsx", "w") as f:
    f.write(text)

with open("src/components/POSSystem.jsx", "r") as f:
    text2 = f.read()

# 3. Add onClosePos to POSSystem props
old_props = 'clearPosPreselectedCourse,\n  productImagesMap = new Map()\n}) {'
new_props = 'clearPosPreselectedCourse,\n  productImagesMap = new Map(),\n  onClosePos\n}) {'
text2 = text2.replace(old_props, new_props)

# 4. Add the back button to mobile layout
old_sales = '<div className="block lg:hidden mb-3 bg-indigo-50 rounded-xl border border-indigo-100 p-2.5 flex items-center justify-between">'
new_sales = """<div className="block lg:hidden mb-3 flex items-center gap-2">
            {onClosePos && (
              <button onClick={onClosePos} className="w-10 h-10 flex-shrink-0 bg-white border border-gray-200 text-gray-600 rounded-xl flex items-center justify-center active:scale-95 shadow-sm">
                <ChevronLeft size={20} />
              </button>
            )}
            <div className="flex-1 bg-indigo-50 rounded-xl border border-indigo-100 p-2.5 flex items-center justify-between">"""
text2 = text2.replace(old_sales, new_sales)

# also fix the div closing for this new layout
old_sales_close = """              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold shadow-sm active:scale-95"
            >
              ดูสรุปยอด
            </button>
          </div>"""
new_sales_close = """              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold shadow-sm active:scale-95"
            >
              ดูสรุปยอด
            </button>
          </div>
          </div>"""
text2 = text2.replace(old_sales_close, new_sales_close)

with open("src/components/POSSystem.jsx", "w") as f:
    f.write(text2)

print("Done updating")
