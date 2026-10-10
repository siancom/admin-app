const fs = require('fs');
const filePath = '/Users/ittichai/ZCodeProject/admin-dashboard/src/components/POSSystem.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const regex = /อายุ 7 วัน/g;

// I will only replace the ones after line 3000 (which is in the single course mapping)
const lines = content.split('\n');
for (let i = 3000; i < lines.length; i++) {
  if (lines[i].includes('อายุ 7 วัน')) {
    console.log(`Found 'อายุ 7 วัน' on line ${i + 1}`);
    lines[i] = lines[i].replace('อายุ 7 วัน', `
                                 {(() => {
                                   const lowerName = (g.baseName || '').toLowerCase();
                                   if (lowerName.includes('set a') || lowerName.includes('set.a')) return 'อายุ 3 เดือน';
                                   if (lowerName.includes('set b') || lowerName.includes('set.b')) return 'อายุ 6 เดือน';
                                   if (lowerName.includes('set c') || lowerName.includes('set.c')) return 'อายุ 1 ปี';
                                   return 'อายุ 7 วัน';
                                 })()}`);
    break;
  }
}

content = lines.join('\n');
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated the label with regex-like replacement');
