import re

with open("src/components/POSSystem.jsx", "r") as f:
    content = f.read()

# 1. Add state variables for stock mode
state_marker = "  const [paymentPhotoUrl, setPaymentPhotoUrl] = useState(null);"
state_injection = """
  // Stock Adjustment Mode
  const [isStockMode, setIsStockMode] = useState(false);
  const [stockAdjustments, setStockAdjustments] = useState([]);
  const [isStockConfirmModalOpen, setIsStockConfirmModalOpen] = useState(false);
  const [stockInputModal, setStockInputModal] = useState({ isOpen: false, item: null, inputVal: '' });
"""
content = content.replace(state_marker, state_marker + state_injection)

# 2. Extract Customer Selection UI
start_idx = content.find('        {/* Customer Selection */}')
end_idx = content.find('                        </div>\n                      ))\n                    ) : (\n                      <div className="px-4 py-3 text-center text-slate-500">ไม่พบลูกค้า</div>\n                    )}\n                  </div>\n                )}\n              </div>\n            )}\n          </div>\n        </div>')
if start_idx != -1 and end_idx != -1:
    end_idx += len('                        </div>\n                      ))\n                    ) : (\n                      <div className="px-4 py-3 text-center text-slate-500">ไม่พบลูกค้า</div>\n                    )}\n                  </div>\n                )}\n              </div>\n            )}\n          </div>\n        </div>')
    customer_block = content[start_idx:end_idx]
    
    # We replace the original block with a reference to the extracted UI
    replacement = """        {/* Customer Selection (Desktop/Cart View) */}
        <div className="hidden lg:block shrink-0 z-[60]">
          {customerSelectionUI}
        </div>"""
    content = content[:start_idx] + replacement + content[end_idx:]
    
    customer_ui = f"""
  const customerSelectionUI = (
    <>
{customer_block}
    </>
  );
"""
    return_idx = content.find("  return (")
    content = content[:return_idx] + customer_ui + "\n" + content[return_idx:]

    # Inject it into Mobile Main area (so it shows on mobile too!)
    main_top_marker = "      <div className=\"flex-1 flex flex-col h-full border-r border-slate-200\">\n        <div className=\"p-4 bg-white border-b border-slate-200 shrink-0\">"
    mobile_injection = """
        {/* Customer Selection (Mobile Main View) */}
        <div className="block lg:hidden z-[60] mb-4 relative">
          {customerSelectionUI}
        </div>
"""
    content = content.replace(main_top_marker, main_top_marker + mobile_injection)

with open("src/components/POSSystem.jsx", "w") as f:
    f.write(content)
print("Extracted customer selection")
