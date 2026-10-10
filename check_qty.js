import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from 'fs';

const firebaseConfigFile = fs.readFileSync('/Users/ittichai/ZCodeProject/admin-dashboard/src/config/firebase.js', 'utf8');
const configMatch = firebaseConfigFile.match(/const firebaseConfig = ({[\s\S]*?});/);
const firebaseConfig = eval("(" + configMatch[1] + ")");
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "iris-care");

async function check() {
  const colRef = collection(db, 'master_courses');
  const snap = await getDocs(colRef);
  snap.forEach(doc => {
    const data = doc.data();
    const name = data.col_4 || data['ชื่อคอส'] || '';
    const qty = data.col_7 || data['จำนวนครั้ง'] || '';
    const type = data.col_2 || data['ประเภท'] || '';
    if (name.includes('ซัมเมอร์') || name.includes('รักษาสิว1เดือน') || name.includes('นาโนไวท์') || name.includes('เมโส')) {
       console.log(`Name: ${name}, Qty: ${qty}, Type: ${type}`);
    }
  });
  process.exit(0);
}
check();
