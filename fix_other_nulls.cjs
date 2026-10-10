const fs = require('fs');

const files = [
  'src/components/SalesHistoryModal.jsx',
  'src/components/InventoryDashboard.jsx',
  'src/components/ShopeeImportModal.jsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/\.stock_by_branch/g, '?.stock_by_branch');
    // Also remove double optional chaining if it accidentally happened:
    content = content.replace(/\?\.\?\./g, '?.');
    fs.writeFileSync(file, content, 'utf8');
    console.log("Updated " + file);
  }
});
