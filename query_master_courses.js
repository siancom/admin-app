import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, limit } from "firebase/firestore";
import fs from "fs";

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
  const snapshot = await getDocs(query(collection(db, "master_courses"), limit(2)));
  snapshot.forEach(doc => {
    console.log(doc.id, "=>", doc.data());
  });
}

check().then(() => process.exit(0));
