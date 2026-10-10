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
  const types = new Set();
  snap.forEach(doc => {
    const data = doc.data();
    const type = data.col_2 || data['ประเภท'] || '';
    types.add(type.trim());
  });
  console.log("Unique types:", Array.from(types));
  process.exit(0);
}
check();
