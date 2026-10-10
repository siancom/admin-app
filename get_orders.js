import admin from 'firebase-admin';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function main() {
  const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').limit(20).get();
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`Order: ${data.orderNo}, Type: ${data.itemType}, Total: ${data.itemPrice}, Name: ${data.itemName}, Payment: ${data.paymentMethod}, Status: ${data.status}`);
  });
}
main().catch(console.error);
