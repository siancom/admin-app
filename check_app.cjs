const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes("title={String(b.courseName"));
if (idx > -1) {
    console.log(lines.slice(idx - 5, idx + 5).join('\n'));
} else {
    console.log("NOT FOUND");
}
