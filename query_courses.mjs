import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query, where } from 'firebase/firestore';
import { firebaseConfig } from './src/config/firebase.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "iris-care");

async function check() {
  const snap = await getDocs(query(collection(db, 'courses')));
  let count = 0;
  snap.forEach(doc => {
     const data = doc.data();
     if (data["ยอดค้างชำระ"] && data["ยอดค้างชำระ"] !== "0" && data["ยอดค้างชำระ"] !== "") {
         if (count < 2) {
             console.log("Course:", doc.id, JSON.stringify(data, null, 2));
         }
         count++;
     }
  });
  
  process.exit(0);
}

check();
