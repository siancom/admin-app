const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'iris-clinic-app' });
const db = admin.firestore();
async function run() {
  const snapshot = await db.collection('products').where('รหัส', '==', 'F-M01').get();
  snapshot.forEach(doc => console.log(doc.id, '=>', doc.data()));
}
run();
