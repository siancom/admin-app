const fs = require('fs');
let content = fs.readFileSync('/Users/ittichai/.gemini/antigravity-ide/brain/fec2a87b-dd3f-4224-b98e-aec23403315f/artifacts/walkthrough.md', 'utf8');

const newText = `
## 22. แก้ไขปัญหาหน้านัดหมายอัปเดตไม่พร้อมกันกับ POS (อัปเดตล่าสุด)
ได้ตรวจสอบและแก้ไขสาเหตุที่ทำให้คิวในหน้านัดหมายไม่ถูกอัปเดตเป็น "เสร็จสิ้น" เมื่อชำระเงินเรียบร้อยแล้วครับ:
- เกิดจากมี Error ซ่อนอยู่ในกระบวนการอัปเดตคิวอัตโนมัติ ทำให้ระบบชำระเงินผ่าน แต่ข้ามขั้นตอนการปิดคิวไป
- ผมได้ทำการลบจุดที่แจ้ง Error ออกและเชื่อมต่อคำสั่งฐานข้อมูลให้ถูกต้องแล้วครับ
- ตอนนี้เมื่อกด **"ยืนยันชำระเงิน"** ที่หน้า POS สถานะคิวในหน้านัดหมายจะถูกปรับเป็น **"เสร็จสิ้น"** และซิงค์ข้อมูลตรงกันในทันทีแบบเรียลไทม์ครับ
`;

content += newText;
fs.writeFileSync('/Users/ittichai/.gemini/antigravity-ide/brain/fec2a87b-dd3f-4224-b98e-aec23403315f/artifacts/walkthrough.md', content, 'utf8');
