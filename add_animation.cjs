const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// Add animate-pulse to the select dropdown badge for In Progress
content = content.replace(/'bg-purple-50 text-purple-600 border-purple-300'/g, "'bg-purple-50 text-purple-600 border-purple-300 animate-pulse'");

// Add animate-pulse to the left border color bar for In Progress
content = content.replace(/st === 'กำลังใช้บริการ' \? 'bg-purple-500'/g, "st === 'กำลังใช้บริการ' ? 'bg-purple-500 animate-pulse'");

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log("Added animation!");
