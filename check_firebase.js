import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBS3zKEA6zosmy8tLRTyJ38BPLlUQS30gU",
  authDomain: "iris-clinic-app.firebaseapp.com",
  projectId: "iris-clinic-app"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "iris-care");

async function run() {
  const empSnap = await getDocs(collection(db, "employees"));
  const employees = empSnap.docs.map(d => ({id: d.id, ...d.data()}));
  
  console.log("EMPLOYEES:");
  employees.forEach(emp => {
      console.log(`- ${emp.name} | Base: ${emp.baseSalary} | Comm: ${emp.commissionRate} | ProdComm: ${emp.productCommissionRate}`);
  });
  
  const historySnap = await getDocs(collection(db, "histories"));
  const histories = historySnap.docs.map(d => ({id: d.id, ...d.data()}));
  
  const recentHistories = histories.filter(h => {
     const dStr1 = String(h.date || '');
     const dStr2 = String(h.วันที่ || '');
     return dStr1.startsWith('2026-09') || dStr2.startsWith('2026-09') || dStr2.includes('/9/') || dStr2.includes('/09/');
  });
  
  console.log(`\nRECENT HISTORIES (${recentHistories.length}):`);
  recentHistories.slice(0, 10).forEach(h => {
      console.log(`- Type: ${h["ประเภท"]}, Staff: ${h["พนักงาน"] || h["ชื่อพนักงาน"] || h["ผู้ให้บริการ"] || 'N/A'}, Price: ${h["ยอดเงิน"] || h["ราคา"] || h["จำนวนเงิน"]}, Date: ${h["วันที่"] || h.date}`);
  });
  
  process.exit(0);
}

run();
