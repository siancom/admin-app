const fs = require('fs');
let content = fs.readFileSync('src/components/POSSystem.jsx', 'utf-8');

let startIndex = content.indexOf('<h3 className="text-sm font-bold text-t');
if (startIndex !== -1) {
    let endIndex = content.indexOf('          <div className="grid grid-cols-4 md:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">', startIndex);
    
    if (endIndex !== -1) {
        let goodBlock = `              <h3 className="text-sm font-bold text-teal-700 mb-2">เจ้าของร้านซื้อเข้า (Owner Purchase)</h3>
              <div className="text-xs text-teal-600 font-medium space-y-1">
                <p>• ราคาทุนคิดจากราคาสมาชิก - ส่วนลดเจ้าของร้าน</p>
                <p>• ราคาสมาชิกมาจากคอลัมน์ "ราคาสมาชิก"</p>
                <p>• ถ้าราคาสมาชิกไม่มีค่า จะใช้ราคาปลีกเต็ม</p>
              </div>
            </div>
          )}
`;
        content = content.substring(0, startIndex) + goodBlock + content.substring(endIndex);
        fs.writeFileSync('src/components/POSSystem.jsx', content, 'utf-8');
        console.log("Replaced corrupted block.");
    } else {
        console.log("End index not found.");
    }
} else {
    console.log("Start index not found.");
}
