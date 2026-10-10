import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import fs from "fs";

const configPath = "/Users/ittichai/ZCodeProject/admin-dashboard/src/config/firebase.js";
const configContent = fs.readFileSync(configPath, 'utf8');

// We'll just hardcode the config for the script to run locally
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

async function checkDoc(col, id) {
  const d = await getDoc(doc(db, col, id));
  console.log(`Checking ${col}/${id}: exists = ${d.exists()}`);
  if(d.exists()) {
    console.log(d.data());
  }
}

const id = "txsfx6EShn82wOwpEbE1";
Promise.all([
  checkDoc("master_courses", id),
  checkDoc("courses", id),
  checkDoc("products", id),
]).then(() => process.exit(0));
