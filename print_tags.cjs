const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');
const lines = content.split('\n');
for (let i = 3130; i < 3170; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
