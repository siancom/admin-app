const fs = require('fs');
let content = fs.readFileSync('src/components/POSSystem.jsx', 'utf-8');

content = content.replace(/match\(\/(.*?)\/COD:/g, 'match(/$1\\/COD:');
fs.writeFileSync('src/components/POSSystem.jsx', content, 'utf-8');
console.log("Fixed regex.");
