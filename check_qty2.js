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
  let count1 = 0;
  let countTotal = 0;
  let sample1 = [];
  snap.forEach(doc => {
    const data = doc.data();
    const qty = String(data.col_7 || data['จำนวนครั้ง'] || '').trim();
    if (qty === '1' || qty === '') {
       count1++;
       if(sample1.length < 5) sample1.push(data.col_4 || data['ชื่อคอส'] || '');
    }
    countTotal++;
  });
  console.log(`Total courses: ${countTotal}`);
  console.log(`Courses with Qty 1 or empty: ${count1}`);
  console.log(`Sample:`, sample1);
  process.exit(0);
}
check();
