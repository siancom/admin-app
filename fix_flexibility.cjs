const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

content = content.replace(/if \(diffMins < -1\) {/g, "if (diffMins < -10) {");
content = content.replace(/} else if \(diffMins > 1\) {/g, "} else if (diffMins > 10) {");

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log("Fixed time flexibility");
