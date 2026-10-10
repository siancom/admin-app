import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from '/Users/ittichai/ZCodeProject/admin-dashboard/service-account.json' assert { type: "json" };

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function fixHistories() {
  const snapshot = await db.collection('siancom_histories').get();
  const batch = db.batch();
  let count = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    if (data['เบอร์โทร'] && !data.cleanPhone) {
      const cleanPhone = String(data['เบอร์โทร']).replace(/[^0-9]/g, '');
      if (cleanPhone) {
        batch.update(doc.ref, { cleanPhone });
        count++;
      }
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`Updated ${count} histories with cleanPhone`);
  } else {
    console.log('No histories needed updating');
  }
}

fixHistories().catch(console.error);
