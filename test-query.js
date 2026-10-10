const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, limit } = require('firebase/firestore');

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
  const snapshot = await getDocs(collection(db, 'histories'));
  let count = 0;
  snapshot.forEach(doc => {
    const data = doc.data();
    const str = JSON.stringify(data);
    if (str.includes('จี้')) {
      console.log(data);
      count++;
    }
  });
  console.log('Total:', count);
}
run();
