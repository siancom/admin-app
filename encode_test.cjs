const fs = require('fs');

let thai = 'ปิดโหมด';
console.log('Original Thai Buffer:', Buffer.from(thai, 'utf8'));
// ป (E0 B8 9B) ิ (E0 B8 B4) ด (E0 B8 94) โ (E0 B9 82) ห (E0 B8 AB) ม (E0 B8 A1) ด (E0 B8 94)
// Total bytes: E0 B8 9B E0 B8 B4 E0 B8 94 E0 B9 82 E0 B8 AB E0 B8 A1 E0 B8 94

let corrupted = '犧巵ｸｴ犧扉ｹもｸｫ犧｡';
console.log('Corrupted Buffer:', Buffer.from(corrupted, 'utf8'));

// Is there a known mapping?
// E0 B8 9B -> 犧 (E7 8A A7)
// E0 B8 B4 -> 巵 (E5 B7 B5)
// E0 B8 94 -> ｸ (EF BD B8) ｴ (EF BD B4)
// E0 B9 82 -> 犧 (E7 8A A7) 扉 (E6 89 89)
// Wait... let's check MacJapanese or Shift-JIS
const iconv = require('iconv-lite');
if (iconv) {
    let originalBuf = Buffer.from(thai, 'utf8');
    // If the tool read the UTF-8 bytes as Shift-JIS and decoded them into Unicode...
    let asShiftJIS = iconv.decode(originalBuf, 'shiftjis');
    console.log('If UTF-8 bytes read as Shift-JIS:', asShiftJIS);
    
    let asEUCJP = iconv.decode(originalBuf, 'eucjp');
    console.log('If UTF-8 bytes read as EUC-JP:', asEUCJP);
}
