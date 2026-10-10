import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "siancom-dashboard"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const q = query(collection(db, 'products'), limit(1));
  const snap = await getDocs(q);
  console.log(snap.docs[0].data());
  process.exit(0);
}
run();
