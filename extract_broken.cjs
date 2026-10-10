const fs = require('fs');
let text = fs.readFileSync('src/components/POSSystem.jsx', 'utf8');

// Match any sequence of non-whitespace characters that contains the replacement character \ufffd
let regex = /[^\s"'\`(){}\[\]]*\ufffd+[^\s"'\`(){}\[\]]*/g;
let matches = text.match(regex) || [];

let unique = [...new Set(matches)];
console.log("Found " + unique.length + " unique broken words.");

// Let's print them
for(let word of unique) {
    console.log(word);
}
