import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from 'fs';

// Read firebase config from src/config/firebase.js
const firebaseConfigFile = fs.readFileSync('/Users/ittichai/ZCodeProject/admin-dashboard/src/config/firebase.js', 'utf8');
const configMatch = firebaseConfigFile.match(/const firebaseConfig = ({[\s\S]*?});/);
if (!configMatch) {
  console.log("Could not find firebaseConfig");
  process.exit(1);
}

const firebaseConfig = eval("(" + configMatch[1] + ")");
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const colRef = collection(db, 'master_courses');
  const snap = await getDocs(colRef);
  const types = new Set();
  snap.forEach(doc => {
    const data = doc.data();
    // In master_courses, the "ประเภท" column is usually col_2
    const type = data.col_2 || data['ประเภท'] || '';
    types.add(type.trim());
  });
  console.log("Unique types:", Array.from(types));
  process.exit(0);
}
check();
