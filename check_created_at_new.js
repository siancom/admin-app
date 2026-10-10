import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBS3zKEA6zosmy8tLRTyJ38BPLlUQS30gU",
  authDomain: "iris-clinic-app.firebaseapp.com",
  projectId: "iris-clinic-app"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "iris-care");

async function run() {
  const historySnap = await getDocs(query(collection(db, "histories"), orderBy("วันที่", "desc"), limit(20)));
  const histories = historySnap.docs.map(d => ({id: d.id, ...d.data()}));
  
  histories.forEach(h => {
      console.log(`- ID: ${h.id}, Date: ${h["วันที่"]}, createdAt:`, typeof h.createdAt, h.createdAt?.constructor?.name, h.createdAt);
  });
  
  process.exit(0);
}

run();
