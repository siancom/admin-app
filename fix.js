const fs = require('fs');
let content = fs.readFileSync('src/components/POSSystem.jsx', 'utf-8');

// The corrupted block starts around line 1071 with "text-t                const isOwnerPurchase"
// We need to replace the whole corrupted block from:
// <h3 className="text-sm font-bold text-t                const isOwnerPurchase = ...
// down to
// )}คาปลีกเต็ม</p>

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
        
        let originalText = content.substring(startIndex, endIndex);
        content = content.substring(0, startIndex) + goodBlock + content.substring(endIndex);
        
        // Also need to fix the `filteredProducts.map` missing closure?
        // Wait, where did the map start?
        // Actually, let's just let the script output the file and we can check.
        fs.writeFileSync('src/components/POSSystem.jsx', content, 'utf-8');
        console.log("Replaced corrupted block.");
    } else {
        console.log("End index not found.");
    }
} else {
    console.log("Start index not found.");
}
