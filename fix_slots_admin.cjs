const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

content = content.replace(/getBookingStatus\(b\) !== 'ยกเลิก'/g, "getBookingStatus(b) !== 'ยกเลิก' && getBookingStatus(b) !== 'เสร็จสิ้น'");

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log("Fixed slots in admin-dashboard");
