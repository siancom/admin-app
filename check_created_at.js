import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBS3zKEA6zosmy8tLRTyJ38BPLlUQS30gU",
  authDomain: "iris-clinic-app.firebaseapp.com",
  projectId: "iris-clinic-app"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "iris-care");

async function run() {
  const historySnap = await getDocs(query(collection(db, "histories"), limit(10)));
  const histories = historySnap.docs.map(d => ({id: d.id, ...d.data()}));
  
  histories.forEach(h => {
      console.log(`- ID: ${h.id}, createdAt:`, typeof h.createdAt, h.createdAt?.constructor?.name);
  });
  
  process.exit(0);
}

run();
