import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit } from 'firebase/firestore';
import { firebaseConfig } from './src/config/firebase.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "iris-care");

async function check() {
  const snap = await getDocs(collection(db, 'master_courses'));
  let i = 0;
  snap.forEach(doc => {
    if (i < 5) {
       console.log("Master course:", doc.id, JSON.stringify(doc.data(), null, 2));
    }
    i++;
  });
  
  process.exit(0);
}

check();
