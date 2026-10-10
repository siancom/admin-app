import re

with open('/Users/ittichai/admin-dashboard/src/components/POSSystem.jsx', 'r') as f:
    content = f.read()

# 1. Update signature
sig_old = """  onViewCustomerProfile,
  posPreselectedCustomer,
  clearPosPreselectedCustomer
}) {"""
sig_new = """  onViewCustomerProfile,
  posPreselectedCustomer,
  clearPosPreselectedCustomer,
  posPreselectedCourse,
  clearPosPreselectedCourse
}) {"""
content = content.replace(sig_old, sig_new)

# 2. Add useEffect for posPreselectedCourse
effect_old = """  }, [posPreselectedCustomer, clearPosPreselectedCustomer]);"""
effect_new = """  }, [posPreselectedCustomer, clearPosPreselectedCustomer]);

  // Set Preselected Course to Cart
  useEffect(() => {
    if (posPreselectedCourse) {
       const maxQty = posPreselectedCourse.computedRemainQty || 1;
       const nameStr = `เบิกใช้: ${String(getFuzzyKey(posPreselectedCourse, ["ชื่อคอส", "col_8"]))} (${String(getFuzzyKey(posPreselectedCourse, ["เลขที่ใบคอส", "col_2"]))})`;
       
       setCart(prev => {
         if (prev.find(i => i.id === posPreselectedCourse.id && i.type === 'usage')) return prev;
         return [...prev, { id: posPreselectedCourse.id, name: nameStr, price: 0, qty: 1, type: 'usage', maxQty, originalItem: posPreselectedCourse }];
       });
       
       setIsMobileCartOpen(true);
       if (clearPosPreselectedCourse) clearPosPreselectedCourse();
    }
  }, [posPreselectedCourse, clearPosPreselectedCourse]);"""
content = content.replace(effect_old, effect_new)

# 3. Fix vipStats
vip_old = """  const vipStats = useMemo(() => {
    if (!selectedCustomer) return { isVip: false, amount: 0 };
    const amt = getCustomerAccumulatedAmount(selectedCustomer);
    return { isVip: amt >= 5000, amount: amt };
  }, [selectedCustomer, histories]);"""
vip_new = """  const vipStats = useMemo(() => {
    if (!selectedCustomer) return { isVip: false, amount: 0 };
    const amt = selectedCustomer.realAccumulatedAmount !== undefined 
                ? selectedCustomer.realAccumulatedAmount 
                : getCustomerAccumulatedAmount(selectedCustomer);
    return { isVip: amt >= 5000, amount: amt };
  }, [selectedCustomer, histories]);"""
content = content.replace(vip_old, vip_new)

# 4. Extract Customer Search block and reuse it
# First, update the computed name logic in the original string
name1_old = """                        {String(getFuzzyKey(selectedCustomer, ["ชื่อ", "col_1"]))}
                        {isVipCustomer && <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-yellow-200">VIP</span>}"""
name1_new = """                        {selectedCustomer.computedName || String(getFuzzyKey(selectedCustomer, ["ชื่อ", "col_1"]))}
                        {isVipCustomer && <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-yellow-200">VIP</span>}"""
content = content.replace(name1_old, name1_new)

phone1_old = """<div className="text-sm text-slate-500 mb-1">{String(getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3"]))}</div>"""
phone1_new = """<div className="text-sm text-slate-500 mb-1">{selectedCustomer.computedPhone || String(getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3"]))}</div>"""
content = content.replace(phone1_old, phone1_new)

name2_old = """                                {String(getFuzzyKey(c, ["ชื่อ", "col_1"]))}
                                {checkCustomerVipStatus(c) && <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-yellow-200">VIP</span>}"""
name2_new = """                                {c.computedName || String(getFuzzyKey(c, ["ชื่อ", "col_1"]))}
                                {(c.isApproved !== undefined ? c.isApproved : checkCustomerVipStatus(c)) && <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-yellow-200">VIP</span>}"""
content = content.replace(name2_old, name2_new)

phone2_old = """<div className="text-sm text-slate-500">{String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]))}</div>"""
phone2_new = """<div className="text-sm text-slate-500">{c.computedPhone || String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]))}</div>"""
content = content.replace(phone2_old, phone2_new)

view_old = """                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-800 flex items-center gap-2 truncate">
                                {c.computedName || String(getFuzzyKey(c, ["ชื่อ", "col_1"]))}
                                {(c.isApproved !== undefined ? c.isApproved : checkCustomerVipStatus(c)) && <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-yellow-200">VIP</span>}
                            </div>
                            <div className="text-sm text-slate-500">{c.computedPhone || String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]))}</div>
                          </div>
                        </div>"""
view_new = """                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-800 flex items-center gap-2 truncate">
                                {c.computedName || String(getFuzzyKey(c, ["ชื่อ", "col_1"]))}
                                {(c.isApproved !== undefined ? c.isApproved : checkCustomerVipStatus(c)) && <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-yellow-200">VIP</span>}
                            </div>
                            <div className="text-sm text-slate-500">{c.computedPhone || String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]))}</div>
                          </div>
                          {onViewCustomerProfile && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewCustomerProfile(c);
                                setIsMobileCartOpen(false);
                                setIsCustomerDropdownOpen(false);
                                setCustomerSearch('');
                              }}
                              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1 font-bold shrink-0"
                            >
                              <User size={12} /> ดูประวัติ
                            </button>
                          )}
                        </div>"""
content = content.replace(view_old, view_new)


# Now extract the customer block and duplicate it.
block_start_marker = "        {/* Customer Selection */}\n        <div className=\"p-4 border-b border-slate-200 bg-slate-50 shrink-0 z-10\">\n          <div className=\"relative\">\n            {selectedCustomer ? ("

block_end_marker = "                        </div>\n                      ))\n                    ) : (\n                      <div className=\"px-4 py-3 text-center text-slate-500\">ไม่พบลูกค้า</div>\n                    )}\n                  </div>\n                )}\n              </div>\n            )}\n          </div>\n        </div>"

start_idx = content.find(block_start_marker)
end_idx = content.find(block_end_marker) + len(block_end_marker)

if start_idx == -1 or content.find(block_end_marker) == -1:
    print("Could not extract block")
    exit(1)

customer_block = content[start_idx:end_idx]

customer_ui = f"""
  const customerSelectionUI = (
    <>
{customer_block}
    </>
  );
"""

# inject customer_ui before return (
return_idx = content.find("  return (")
content = content[:return_idx] + customer_ui + "\n" + content[return_idx:]

# replace original block with {customerSelectionUI} inside a hidden lg:block wrapper
# Wait, no need for wrapper if I just replace it and add wrappers inside `customerSelectionUI`?
# Let's just put {customerSelectionUI} directly where it was, but wrap it for Desktop only?
# The user wants Customer Search in both places (Main area for mobile, Cart for Desktop).

# Re-find the block and replace it
start_idx = content.find(block_start_marker)
end_idx = content.find(block_end_marker) + len(block_end_marker)

replacement = """        {/* Customer Selection (Desktop/Cart View) */}
        <div className="hidden lg:block shrink-0 z-[60]">
          {customerSelectionUI}
        </div>"""
content = content[:start_idx] + replacement + content[end_idx:]

# Inject into Mobile Main area
main_top_marker = "      <div className=\"flex-1 flex flex-col h-full border-r border-slate-200\">\n        <div className=\"p-4 bg-white border-b border-slate-200\">"

mobile_injection = """
        {/* Customer Selection (Mobile Main View) */}
        <div className="block lg:hidden z-[60]">
          {customerSelectionUI}
        </div>
"""
content = content.replace(main_top_marker, main_top_marker + mobile_injection)

with open('/Users/ittichai/admin-dashboard/src/components/POSSystem.jsx', 'w') as f:
    f.write(content)

print("Patch applied successfully")
