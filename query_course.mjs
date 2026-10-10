import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query, where } from 'firebase/firestore';
import { firebaseConfig } from './src/config/firebase.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "iris-care");

async function check() {
  const snap = await getDocs(query(collection(db, 'courses'), where("เลขที่ใบคอส", "==", "IC3795920")));
  snap.forEach(doc => {
     console.log("Course:", doc.id, JSON.stringify(doc.data(), null, 2));
  });
  
  process.exit(0);
}

check();
