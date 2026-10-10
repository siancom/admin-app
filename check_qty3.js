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
  let countStrict1 = 0;
  let countEmpty = 0;
  let sample1 = [];
  let sampleEmpty = [];
  snap.forEach(doc => {
    const data = doc.data();
    const name = data.col_4 || data['ชื่อคอส'] || '';
    const qty = String(data.col_7 || data['จำนวนครั้ง'] || '').trim();
    if (qty === '1') {
       countStrict1++;
       if(sample1.length < 5) sample1.push(name);
    } else if (qty === '') {
       countEmpty++;
       if(sampleEmpty.length < 5) sampleEmpty.push(name);
    }
  });
  console.log(`Courses with Qty strictly '1': ${countStrict1}`);
  console.log(`Sample strictly 1:`, sample1);
  console.log(`Courses with Qty empty: ${countEmpty}`);
  console.log(`Sample empty:`, sampleEmpty);
  process.exit(0);
}
check();
