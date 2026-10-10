import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadString } from 'firebase/storage';
import { getAuth, signInAnonymously } from 'firebase/auth';

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
const storage = getStorage(app);
const auth = getAuth(app);

async function check() {
  try {
    await signInAnonymously(auth);
    const storageRef = ref(storage, 'customer_documents/test/test.txt');
    await uploadString(storageRef, 'hello world');
    console.log('Success upload');
  } catch(e) {
    console.error('Error:', e);
  }
  process.exit(0);
}
check();
