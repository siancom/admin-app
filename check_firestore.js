import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBS3zKEA6zosmy8tLRTyJ38BPLlUQS30gU",
  authDomain: "iris-clinic-app.firebaseapp.com",
  projectId: "iris-clinic-app",
  storageBucket: "iris-clinic-app.firebasestorage.app",
  messagingSenderId: "372749467528",
  appId: "1:372749467528:web:1e90ecab74274ec965843d",
  measurementId: "G-BQW1W46XSH"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "iris-care");

async function check() {
  const snap = await getDocs(query(collection(db, 'customer_documents')));
  console.log(`Found ${snap.size} documents in customer_documents`);
  snap.docs.forEach(d => {
    console.log(d.id, d.data().title, d.data().customerId);
  });
  process.exit(0);
}
check();
