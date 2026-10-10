const fs = require('fs');

const files = [
  'src/components/POSSystem.jsx',
  'src/components/SalesHistoryModal.jsx',
  'src/components/InventoryDashboard.jsx',
  'src/components/ShopeeImportModal.jsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace batch.update(productRef, { stock_by_branch... })
    content = content.replace(/batch\.update\(productRef,\s*\{\s*stock_by_branch/g, 'batch.set(productRef, { stock_by_branch');
    content = content.replace(/batch\.set\(productRef,\s*\{\s*stock_by_branch([^}]+)\}\s*\)/g, 'batch.set(productRef, { stock_by_branch$1}, { merge: true })');
    
    // Replace batch.update(pRef, { stock_by_branch... })
    content = content.replace(/batch\.update\(pRef,\s*\{\s*stock_by_branch/g, 'batch.set(pRef, { stock_by_branch');
    content = content.replace(/batch\.set\(pRef,\s*\{\s*stock_by_branch([^}]+)\}\s*\)/g, 'batch.set(pRef, { stock_by_branch$1}, { merge: true })');
    
    // Replace batch.update(prodRef, { stock_by_branch... })
    content = content.replace(/batch\.update\(prodRef,\s*\{\s*stock_by_branch/g, 'batch.set(prodRef, { stock_by_branch');
    content = content.replace(/batch\.set\(prodRef,\s*\{\s*stock_by_branch([^}]+)\}\s*\)/g, 'batch.set(prodRef, { stock_by_branch$1}, { merge: true })');
    
    // Replace batch.update(doc(db, 'products', product.id), { stock_by_branch... })
    content = content.replace(/batch\.update\(doc\(db,\s*'products',\s*product\.id\),\s*\{\s*stock_by_branch/g, 'batch.set(doc(db, \'products\', product.id), { stock_by_branch');
    content = content.replace(/batch\.set\(doc\(db,\s*'products',\s*product\.id\),\s*\{\s*stock_by_branch([^}]+)\}\s*\)/g, 'batch.set(doc(db, \'products\', product.id), { stock_by_branch$1}, { merge: true })');
    
    fs.writeFileSync(file, content, 'utf8');
    console.log("Updated " + file);
  }
});
