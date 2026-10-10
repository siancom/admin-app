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
  const historySnap = await getDocs(query(collection(db, "histories"), orderBy("วันที่", "desc"), limit(50)));
  const histories = historySnap.docs.map(d => ({id: d.id, ...d.data()}));
  
  console.log(`\nRECENT HISTORIES (${histories.length}):`);
  histories.forEach(h => {
      console.log(`- Date: ${h["วันที่"] || h.date}, Type: ${h["ประเภท"]}, Staff: ${h["พนักงาน"] || h["ชื่อพนักงาน"] || h["ผู้ให้บริการ"] || 'N/A'}, Price: ${h["ยอดเงิน"] || h["ราคา"] || h["จำนวนเงิน"]}`);
  });
  
  process.exit(0);
}

run();
