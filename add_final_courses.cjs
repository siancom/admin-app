const coursesData = [
  // Acne Clearing (โปรแกรมเคลียร์สิว)
  { code: 'F-AC1', name: 'กดสิวฆ่าเชื้อ', price: '349', qty: '1', duration: '', details: '1.กดสิว\n2.โอโซนร้อน\n3.พอกฆ่าเชื้อ' },
  { code: 'F-AC2', name: 'เคลียร์สิว', price: '499', qty: '1', duration: '', details: '1.กดสิว\n2.โอโซนร้อน\n3.พอกฆ่าเชื้อ\n4.ไครโอเย็น\n5.มาร์คลดรอยแดง' },
  { code: 'F-AC3', name: 'เคลียร์สิว+ดูดสิวเสี้ยน', price: '599', qty: '1', duration: '', details: '1.กดสิว\n2.โอโซนร้อน\n3.ดูดสิวเสี้ยน\n4.พอกฆ่าเชื้อ\n5.ไครโอเย็น\n6.มาร์คลดรอยแดง' },

  // IPL Hair Removal (IPL กำจัดขน)
  { code: 'F-IPL01', name: 'IPL กำจัดขน ครบขั้นตอน (1 ครั้ง)', price: '599', qty: '1', duration: '', details: 'IPL กำจัดขนกึ่งถาวร (ปกติ 899)' },
  { code: 'F-IPL05', name: 'IPL กำจัดขน ครบขั้นตอน (5 ครั้ง)', price: '2750', qty: '5', duration: 'ไม่จำกัด', details: 'IPL กำจัดขนกึ่งถาวร (ปกติ 4495)' },
  { code: 'F-IPL10', name: 'IPL กำจัดขน ครบขั้นตอน (10 ครั้ง)', price: '4999', qty: '10', duration: 'ไม่จำกัด', details: 'IPL กำจัดขนกึ่งถาวร (ปกติ 8890)\nแถมฟรี แป้งรักแร้ขาวมูลค่า 140฿' }
];

import('./src/config/firebase.js').then(async (firebase) => {
  const { db } = firebase;
  const { collection, addDoc } = await import('firebase/firestore');
  
  for (const c of coursesData) {
    const docData = {
      'วันที่เริ่มโปร': '',
      'วันที่สิ้นสุด': '',
      'ประเภท': 'คอร์สทรีทเม้นท์',
      'QRCODE': '',
      'มูลค่าผลิตภัณฑ์': '0',
      'ผลิตภัณฑ์ที่ได้รับ': '',
      'จำนวนครั้งที่ได้': c.qty,
      'รหัสคอส': c.code,
      'ชื่อคอส': c.name,
      'รายการที่ได้รับ': c.details,
      'ราคา': c.price,
      'กำหนดระยะเวลา': c.duration,
      'เครดิตที่ได้รับ': '0',
      'รูปโปรโมชั่น': '',
      col_1: c.code,
      col_2: 'คอร์สทรีทเม้นท์',
      col_3: '',
      col_4: c.name,
      col_5: c.price,
      col_6: '0',
      col_7: c.duration,
      col_8: '0',
      col_9: '',
      col_10: '',
      col_11: c.details,
      col_12: '',
      col_13: c.qty,
      col_14: ''
    };
    
    await addDoc(collection(db, 'master_courses'), docData);
    console.log('Added:', c.name);
  }
  
  console.log('Done!');
  process.exit(0);
}).catch(console.error);
