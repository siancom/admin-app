import('./src/config/firebase.js').then(async (firebase) => {
  const { db } = firebase;
  const { collection, addDoc } = await import('firebase/firestore');
  
  const c = {
    code: 'F-AC4',
    name: 'กดสิวอย่างเดียว (1 ครั้ง)',
    price: '299',
    qty: '1',
    duration: '',
    details: 'กดสิวอย่างเดียว'
  };

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
  process.exit(0);
}).catch(console.error);
