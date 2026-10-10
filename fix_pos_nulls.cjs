const fs = require('fs');
let content = fs.readFileSync('src/components/POSSystem.jsx', 'utf8');

content = content.replace(/item\.originalItem\.stock_by_branch/g, 'item.originalItem?.stock_by_branch');
content = content.replace(/adj\.originalItem\.stock_by_branch/g, 'adj.originalItem?.stock_by_branch');

fs.writeFileSync('src/components/POSSystem.jsx', content, 'utf8');
console.log("Updated POSSystem to use optional chaining on originalItem");
