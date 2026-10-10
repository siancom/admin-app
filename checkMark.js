import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBS3zKEA6zosmy8tLRTyJ38BPLlUQS30gU",
  authDomain: "iris-clinic-app.firebaseapp.com",
  projectId: "iris-clinic-app",
  storageBucket: "iris-clinic-app.firebasestorage.app",
  messagingSenderId: "372749467528",
  appId: "1:372749467528:web:1e90ecab74274ec965843d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "iris-care");

async function run() {
  const masterCoursesRef = collection(db, 'master_courses');
  const snapshot = await getDocs(masterCoursesRef);
  
  const matches = [];
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const name = data['ชื่อคอส'] || data['col_4'] || '';
    if (name.includes('มาร์ค') || name.includes('มาส์ก')) {
      matches.push(name);
    }
  });
  
  console.log(JSON.stringify(matches, null, 2));
  process.exit(0);
}

run();
