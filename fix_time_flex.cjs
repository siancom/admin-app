const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// Replace diffMins < -1 and diffMins > 1 with 10 for both timeline and cards
content = content.replace(/diffMins < -1/g, 'diffMins < -10');
content = content.replace(/diffMins > 1/g, 'diffMins > 10');

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log("Updated time flexibility to +/- 10 mins");
