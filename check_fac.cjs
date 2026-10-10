const firebase = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

const firebaseConfig = {
    // We can just use the config from src/config/firebase.js
};
// I'll import from the project instead
import('./src/config/firebase.js').then(async (firebase) => {
  const { db } = firebase;
  const { collection, getDocs, query, where } = await import('firebase/firestore');
  
  const q = query(collection(db, 'master_courses'), where('col_1', '>=', 'F-AC'), where('col_1', '<', 'F-AD'));
  const snap = await getDocs(q);
  snap.docs.forEach(d => console.log(d.data().col_1, d.data().col_4));
  process.exit(0);
}).catch(console.error);
