const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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
  try {
    const snap = await getDocs(collection(db, 'customers'));
    console.log("Customers count:", snap.size);
    const keys = new Set();
    const statuses = new Set();
    const samples = [];
    
    snap.forEach(doc => {
      const data = doc.data();
      Object.keys(data).forEach(k => keys.add(k));
      if (data["สถานะสมาชิก"]) statuses.add(data["สถานะสมาชิก"]);
      if (data["col_7"]) statuses.add(data["col_7"]);
      
      // Look for fields containing "ชั่วคราว" or "ลด" or similar
      for (const k of Object.keys(data)) {
        if (k.includes('ชั่วคราว') || k.includes('สิทธิ์') || k.includes('ลด') || k.includes('vip') || k.includes('VIP')) {
          samples.push({ id: doc.id, key: k, value: data[k] });
        }
      }
    });
    
    console.log("Unique keys in customer docs:", Array.from(keys));
    console.log("Statuses in customer docs:", Array.from(statuses));
    console.log("Samples of interest:", samples.slice(0, 20));
  } catch (e) {
    console.error("Error:", e);
  }
}

check();
