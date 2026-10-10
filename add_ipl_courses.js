import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = {
  apiKey: "AIzaSyBS3zKEA6zosmy8tLRTyJ38BPLlUQS30gU",
  authDomain: "iris-clinic-app.firebaseapp.com",
  projectId: "iris-clinic-app",
  storageBucket: "iris-clinic-app.firebasestorage.app",
  messagingSenderId: "372749467528",
  appId: "1:372749467528:web:1e90ecab74274ec965843d",
  measurementId: "G-BQW1W46XSH"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "iris-care");
const masterCoursesRef = collection(db, "master_courses");

const newCourses = [
  {
    code: "IPL-HAIR-1",
    type: "IPL กำจัดขน",
    name: "IPL กำจัดขน ครบขั้นตอน 1 ครั้ง 599.-",
    price: "599",
    prodValue: "0",
    items: "IPL กำจัดขน 1 ครั้ง",
    qty: "1"
  },
  {
    code: "IPL-HAIR-5",
    type: "IPL กำจัดขน",
    name: "IPL กำจัดขน ครบขั้นตอน 5 ครั้ง 2750.-",
    price: "2750",
    prodValue: "0",
    items: "IPL กำจัดขน 5 ครั้ง",
    qty: "5"
  },
  {
    code: "IPL-HAIR-10",
    type: "IPL กำจัดขน",
    name: "IPL กำจัดขน ครบขั้นตอน 10 ครั้ง 4999.-",
    price: "4999",
    prodValue: "140",
    items: "IPL กำจัดขน 10 ครั้ง, ฟรีแป้งรักแร้ขาว มูลค่า 140 บ.",
    qty: "10"
  }
];

const today = new Date().toLocaleDateString('th-TH');

async function insertCourses() {
  for (const c of newCourses) {
    const docData = {
      'รหัสคอส': c.code,
      'ประเภท': c.type,
      'ชื่อคอส': c.name,
      'ราคา': c.price,
      'จำนวนครั้งที่ได้': c.qty,
      'เครดิตที่ได้รับ': '0',
      'รายการที่ได้รับ': c.items,
      'มูลค่าผลิตภัณฑ์': c.prodValue,
      'วันที่เริ่มโปร': today,
      'วันที่สิ้นสุด': '',
      'รูปโปรโมชั่น': '',
      'ผลิตภัณฑ์ที่ได้รับ': '',
      'กำหนดระยะเวลา': '',
      col_1: c.code,
      col_2: c.type,
      col_4: c.name,
      col_5: c.price,
      col_13: c.qty,
      col_6: '0',
      col_12: c.items,
      col_8: c.prodValue,
      col_9: today,
      col_10: '',
      col_3: '',
      col_11: '',
      col_7: ''
    };
    
    try {
      await addDoc(masterCoursesRef, docData);
      console.log(`Added: ${c.name}`);
    } catch (e) {
      console.error(`Error adding ${c.name}:`, e);
    }
  }
}

insertCourses().then(() => process.exit(0));
