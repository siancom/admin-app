const fs = require('fs');
const iconv = require('iconv-lite');

let corrupted = '犧巵ｸｴ犧扉ｹもｸｫ犧｡';

// Encode the corrupted string back into Shift-JIS bytes.
// Those bytes SHOULD be the original UTF-8 bytes of the Thai string!
let originalBytes = iconv.encode(corrupted, 'shiftjis');

// Decode those bytes as UTF-8
let restoredThai = originalBytes.toString('utf8');

console.log('Restored:', restoredThai);
