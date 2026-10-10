import re

with open('/Users/ittichai/admin-dashboard/src/components/POSSystem.jsx', 'r') as f:
    content = f.read()

# 1. Extract Customer Selection (Mobile Main View)
start_marker = "        {/* Customer Selection (Mobile Main View) */}\n        <div className=\"block lg:hidden z-[60] mb-4\">\n          {customerSelectionUI}\n        </div>"
content = content.replace(start_marker, "")

# 2. Insert Customer Selection AFTER Daily Sales Dashboard Cards
sales_end_marker = "            </div>\n          </div>"

if sales_end_marker in content:
    # We want to put it right after the daily sales dashboard cards end.
    # Let's find the exact block.
    # The Daily Sales Dashboard Cards end with:
    #             </div>
    #           </div>
    # 
    #           {/* Main POS Content */}
    # Wait, let's just insert it before the Tabs section.
    tabs_marker = "          {/* Tabs (Products, Courses, My Courses) */}"
    
    replacement = """        {/* Customer Selection (Mobile Main View) - Moved below Sales */}
        <div className="block lg:hidden z-[60] mb-4">
          {customerSelectionUI}
        </div>

""" + tabs_marker

    content = content.replace(tabs_marker, replacement)

with open('/Users/ittichai/admin-dashboard/src/components/POSSystem.jsx', 'w') as f:
    f.write(content)

print("Patch 3 applied")
