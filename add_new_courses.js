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
  // Group 1
  {
    code: "ACNE-SET-A",
    type: "รักษาสิว/ฝ้า",
    name: "คอร์สรักษาสิว/ฝ้า SET.A 5900.-",
    price: "5900",
    prodValue: "3000",
    items: "ผลิตภัณฑ์ 3000 บ., ฟรีลงเครื่อง 15 ครั้ง, ฟรีแอคทีฟสกิน 1 ครั้ง",
    qty: "1"
  },
  {
    code: "ACNE-SET-B",
    type: "รักษาสิว/ฝ้า",
    name: "คอร์สรักษาสิว/ฝ้า SET.B 9500.-",
    price: "9500",
    prodValue: "5000",
    items: "ผลิตภัณฑ์ 5000 บ., ฟรีลงเครื่อง 20 ครั้ง, ฟรีแอคทีฟสกิน 1 ครั้ง, ฟรีนาโนไวท์ 1 ครั้ง, ฟรีบัตรสมาชิก",
    qty: "1"
  },
  {
    code: "ACNE-SET-C",
    type: "รักษาสิว/ฝ้า",
    name: "คอร์สรักษาสิว/ฝ้า SET.C 12900.-",
    price: "12900",
    prodValue: "5000",
    items: "ผลิตภัณฑ์ 5000 บ., ฟรีลงเครื่อง 25 ครั้ง, ฟรีแอคทีฟสกิน 3 ครั้ง, ฟรีนาโนไวท์ 2 ครั้ง, ฟรีบัตรสมาชิก",
    qty: "1"
  },
  // Group 2
  {
    code: "CARE-SET-A",
    type: "บำรุงฟื้นฟู",
    name: "คอร์สบำรุงฟื้นฟูผิว SET.A 2500.-",
    price: "2500",
    prodValue: "1200",
    items: "ผลิตภัณฑ์ 1200 บ., ฟรีแอคทีฟสกิน 1 ครั้ง, ฟรีเมโสครบขั้นตอน 1 ครั้ง",
    qty: "1"
  },
  {
    code: "CARE-SET-B",
    type: "บำรุงฟื้นฟู",
    name: "คอร์สบำรุงฟื้นฟูผิว SET.B 3500.-",
    price: "3500",
    prodValue: "1500",
    items: "ผลิตภัณฑ์ 1500 บ., ฟรีแอคทีฟสกิน 1 ครั้ง, ฟรีนาโนไวท์ 1 ครั้ง, ฟรีเมโสครบขั้นตอน 1 ครั้ง",
    qty: "1"
  },
  {
    code: "CARE-SET-C",
    type: "บำรุงฟื้นฟู",
    name: "คอร์สบำรุงฟื้นฟูผิว SET.C 5000.-",
    price: "5000",
    prodValue: "2500",
    items: "ผลิตภัณฑ์ 2500 บ., ฟรีแอคทีฟสกิน 1 ครั้ง, ฟรีนาโนไวท์ 1 ครั้ง, ฟรีลงเครื่อง 5 ครั้ง",
    qty: "1"
  },
  // Group 3
  {
    code: "MACH-5",
    type: "ลงเครื่อง",
    name: "ลงเครื่องผลักวิตามิน 5 ครั้ง 1299.-",
    price: "1299",
    prodValue: "0",
    items: "ลงเครื่อง 5 ครั้ง",
    qty: "5"
  },
  {
    code: "MACH-10",
    type: "ลงเครื่อง",
    name: "ลงเครื่องผลักวิตามิน 10 ครั้ง 1999.-",
    price: "1999",
    prodValue: "0",
    items: "ลงเครื่อง 10 ครั้ง",
    qty: "10"
  },
  {
    code: "MACH-20",
    type: "ลงเครื่อง",
    name: "ลงเครื่องผลักวิตามิน 20 ครั้ง 2999.-",
    price: "2999",
    prodValue: "0",
    items: "ลงเครื่อง 20 ครั้ง",
    qty: "20"
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
