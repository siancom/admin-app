const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

content = content.replace("'รอการยืนยัน': '#f59e0b',", "'เตือนคิว (อีก 1 ชม.)': '#3b82f6',\n          'เตือนคิว (อีก 20 นาที)': '#ef4444',\n          'รอการยืนยัน': '#f59e0b',");
content = content.replace("'รอการยืนยัน': '●',", "'เตือนคิว (อีก 1 ชม.)': '⏰',\n          'เตือนคิว (อีก 20 นาที)': '⏰',\n          'รอการยืนยัน': '●',");

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log("Updated sendBookingLineNotification");
