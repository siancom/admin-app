with open("src/App.jsx", "r") as f:
    text = f.read()

start_str = "          {activeTab === 'products' && ("
start_idx = text.find(start_str)

# Find the closing brace of the JSX expression
count = 0
started = False
end_idx = -1
for i, c in enumerate(text[start_idx:]):
    if c == '{': 
        count += 1
        started = True
    elif c == '}': 
        count -= 1
    if started and count == 0:
        end_idx = start_idx + i
        break

if end_idx != -1:
    replaced = text[start_idx:end_idx+1]
    print(f"Start index: {start_idx}, End index: {end_idx}")
    print("Ends with:", replaced[-50:])
    
    new_content = text[:start_idx] + """          {activeTab === 'products' && (
            <InventoryDashboard
              products={products}
              branches={branches}
              globalBranch={globalBranch}
              globalRole={globalRole}
              user={user}
              inventoryLogs={inventoryLogs}
              triggerToast={triggerToast}
              setActionConfirmModal={setActionConfirmModal}
            />
          )}""" + text[end_idx+1:]
          
    with open("src/App.jsx", "w") as f:
        f.write(new_content)
    print("Replaced!")
else:
    print("Could not find end")
