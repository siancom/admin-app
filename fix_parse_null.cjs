const fs = require('fs');
let content = fs.readFileSync('src/utils/parse.js', 'utf8');

content = content.replace(/export function getBranchStock\(product, branch\) \{/, 'export function getBranchStock(product, branch) {\n  if (!product) return 0;');
content = content.replace(/export function getTotalStock\(product, validBranches = null\) \{\n  let total = 0;/, 'export function getTotalStock(product, validBranches = null) {\n  if (!product) return 0;\n  let total = 0;');

fs.writeFileSync('src/utils/parse.js', content, 'utf8');
console.log("Updated parse.js to prevent null errors");
