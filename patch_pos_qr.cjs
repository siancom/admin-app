const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'components', 'POSSystem.jsx');
let content = fs.readFileSync(file, 'utf8');

const target = `             if (scannerTarget === 'creditPayment' && (data.type === 'credit_pay' || data.phone || data.customerPhone || data.code)) {
                 const phoneToMatch = data.phone || data.customerPhone || data.code;`;

const replacement = `             if (scannerTarget === 'creditPayment' && (data.type === 'credit_pay' || data.phone || data.customerPhone || data.code)) {
                 if (data.type === 'credit_pay' && data.timestamp) {
                     const now = Date.now();
                     const qrTime = new Date(data.timestamp).getTime();
                     if (now - qrTime > 5 * 60 * 1000) {
                         showToast("ข้อผิดพลาด", "QR Code หมดอายุ กรุณาสร้างใหม่จากแอป", "error");
                         setScannerTarget(null);
                         return;
                     }
                 }
                 const phoneToMatch = data.phone || data.customerPhone || data.code;`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(file, content);
    console.log('Patched POSSystem.jsx for QR expiry');
} else {
    console.log('Target not found in POSSystem.jsx');
}
