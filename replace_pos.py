import re

with open('/Users/ittichai/admin-dashboard/src/components/POSSystem.jsx', 'r') as f:
    content = f.read()

# 1. Extract the Customer Selection block
start_marker = "{/* Customer Selection */}"
end_marker = "{/* Cart Items */}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers")
    exit(1)

customer_block = content[start_idx:end_idx]

# 2. Prepare the new UI variable definition
# Wrap in a React Fragment just in case
ui_def = f"""
  const customerSelectionUI = (
    <>
      {customer_block.strip()}
    </>
  );
"""

# 3. Find the return statement and inject the variable
return_idx = content.find("  return (")
if return_idx == -1:
    print("Could not find return statement")
    exit(1)

content = content[:return_idx] + ui_def + "\n" + content[return_idx:]

# 4. Replace the original block with the variable (hidden on mobile, block on lg)
# Wait, if we use {customerSelectionUI} directly, it will be the same. Let's just put it in a div.
replacement = f"""
        {{/* Customer Selection (Desktop/Cart View) */}}
        <div className="hidden lg:block shrink-0">
          {{customerSelectionUI}}
        </div>
"""
# Re-find since indices changed
start_idx = content.find(start_marker)
end_idx = content.find(end_marker)
content = content[:start_idx] + replacement + "\n        " + content[end_idx:]

# 5. Inject into the mobile view (main content top)
main_top_marker = "{/* Left: Inventory */}\n      <div className=\"flex-1 flex flex-col h-full border-r border-slate-200\">\n        <div className=\"p-4 bg-white border-b border-slate-200\">"

mobile_injection = """
        {/* Customer Selection (Mobile Main View) */}
        <div className="block lg:hidden border-b border-slate-200 bg-slate-50 shrink-0">
          {customerSelectionUI}
        </div>
"""

content = content.replace(main_top_marker, main_top_marker + mobile_injection)

with open('/Users/ittichai/admin-dashboard/src/components/POSSystem.jsx', 'w') as f:
    f.write(content)

print("Done")
