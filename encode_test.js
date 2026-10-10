const fs = require('fs');
let thai = 'ปิดโหมด';
console.log('Original Thai Buffer:', Buffer.from(thai, 'utf8'));

let corrupted = '犧巵ｸｴ犧扉ｹもｸｫ犧｡';
console.log('Corrupted Buffer:', Buffer.from(corrupted, 'utf8'));

// Test encoding misinterpretations
let encodings = ['utf8', 'utf16le', 'latin1', 'base64', 'hex', 'ascii'];
for (let fromEnc of encodings) {
  for (let toEnc of encodings) {
    if (fromEnc === toEnc) continue;
    // ...
  }
}
