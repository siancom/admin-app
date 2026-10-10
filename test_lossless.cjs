const iconv = require('iconv-lite');
const fs = require('fs');

let corrupted = fs.readFileSync('src/components/POSSystem.jsx', 'utf8');

// The file has some parts that were corrupted (they contain Japanese characters)
// But the English parts are ASCII, which is the same in UTF-8 and Shift-JIS.
// Let's try to encode the whole file to shiftjis and decode to utf8.
let restoredBuffer = iconv.encode(corrupted, 'shiftjis');
let restoredText = restoredBuffer.toString('utf8');

fs.writeFileSync('src/components/POSSystem.restored.jsx', restoredText, 'utf8');
console.log("Restored length:", restoredText.length);
