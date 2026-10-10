// --- FIREBASE CONFIG ---
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, doc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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
const auth = getAuth(app);
const db = getFirestore(app, "iris-care");
const storage = getStorage(app);

const getCol = (colName) => collection(db, colName);
const getDocRef = (colName, id) => doc(db, colName, id);

export { app, auth, db, storage, getCol, getDocRef, firebaseConfig };