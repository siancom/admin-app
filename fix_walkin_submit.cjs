const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

const newSubmit = `
  const submitGeneralBooking = async (e) => { 
      e.preventDefault(); if (isSlotTaken(generalBookingForm.dateTime)) return showToast('เวลานี้มีลูกค้าจองคิวไว้แล้ว (คิวเต็ม) กรุณาเลือกเวลาอื่นครับ');
      try { 
          const isWalkIn = generalBookingForm.isWalkIn;
          const nowIso = new Date().toISOString();
          await addDoc(getCol('bookings'), { 
              courseId: '', 
              courseRef: '', 
              courseName: String(generalBookingForm.service || 'บริการทั่วไป'), 
              customerName: String(generalBookingForm.name), 
              customerPhone: String(generalBookingForm.phone), 
              dateTime: String(generalBookingForm.dateTime), 
              date: String(generalBookingForm.dateTime).split('T')[0] || '', 
              time: String(generalBookingForm.dateTime).split('T')[1] || '', 
              branch: String(generalBookingForm.branch), 
              status: isWalkIn ? 'กำลังใช้บริการ' : 'รอการยืนยัน', 
              serviceStartTime: isWalkIn ? nowIso : null,
              createdAt: nowIso 
          }); 
          setIsGeneralBookingOpen(false); 
          setGeneralBookingForm({ name: '', phone: '', service: '', dateTime: '', branch: globalBranch || 'เฉวง' }); 
          showToast(isWalkIn ? 'เพิ่มคิว Walk-in เข้าใช้บริการสำเร็จ' : 'เพิ่มคิวนัดหมายใหม่สำเร็จ'); 
      } catch (err) { showToast('ข้อผิดพลาด: ' + err.message); } 
  };
`;

content = content.replace(/const submitGeneralBooking = async \(e\) => {[\s\S]*?showToast\('ข้อผิดพลาด: ' \+ err\.message\); } \n  };/, newSubmit.trim());

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log("Updated submitGeneralBooking for Walk-in");
