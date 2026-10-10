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
    const snap = await getDocs(collection(db, 'products'));
    console.log("Products count in iris-care:", snap.size);
    if (snap.size > 0) {
      console.log("Sample product:", snap.docs[0].data());
    }
  } catch (e) {
    console.error("Error:", e);
  }
}

check();
