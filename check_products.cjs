const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function check() {
  const snap = await db.collection('products').get();
  console.log(`Products count: ${snap.size}`);
}

check().catch(console.error);
