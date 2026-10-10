const fs = require('fs');
const iconv = require('iconv-lite');

let text = fs.readFileSync('src/components/POSSystem.jsx', 'utf8');

// Match any sequence of non-ASCII characters
let regex = /[^\x00-\x7F]+/g;
let matches = text.match(regex) || [];
let unique = [...new Set(matches)];

console.log("Found " + unique.length + " unique non-ASCII strings.");

let map = {};
for (let str of unique) {
    // Some strings might be valid Thai (if the user typed them recently)
    // Let's check if it's already Thai
    if (/[\u0E00-\u0E7F]/.test(str)) {
        continue; // Skip valid Thai
    }
    
    // It's Mojibake. Let's recover the prefix.
    let bytes = iconv.encode(str, 'shiftjis');
    // The last byte(s) might be 0x3F (replacement char). We strip them.
    while (bytes.length > 0 && bytes[bytes.length - 1] === 0x3F) {
        bytes = bytes.slice(0, bytes.length - 1);
    }
    
    // Now decode the valid UTF-8 prefix
    // Some trailing bytes might form an incomplete UTF-8 sequence, causing replacement chars.
    // We can just use standard toString() which will insert \uFFFD for incomplete sequences.
    let prefix = bytes.toString('utf8');
    
    map[str] = prefix;
}

// Print the map in a format easy to read
let i = 1;
for (let [moji, prefix] of Object.entries(map)) {
    console.log(`${i}. ${prefix} (...)`);
    i++;
}
