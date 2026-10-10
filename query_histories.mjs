import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query, where } from 'firebase/firestore';
import { firebaseConfig } from './src/config/firebase.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "iris-care");

async function check() {
  const snap = await getDocs(query(collection(db, 'histories'), where("อ้างอิง", "==", "IC9150840")));
  snap.forEach(doc => {
     console.log("History:", doc.id, JSON.stringify(doc.data(), null, 2));
  });
  
  process.exit(0);
}

check();
