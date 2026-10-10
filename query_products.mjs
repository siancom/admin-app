import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit } from 'firebase/firestore';
import { firebaseConfig } from './src/config/firebase.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "iris-care");

async function check() {
  const snap = await getDocs(collection(db, 'products'));
  let i = 0;
  snap.forEach(doc => {
    if (i < 2) {
       console.log("Product:", doc.id, JSON.stringify(doc.data(), null, 2));
    }
    i++;
  });
  
  process.exit(0);
}

check();
