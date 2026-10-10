const admin = require('firebase-admin');
const serviceAccount = require('/Users/ittichai/ZCodeProject/admin-dashboard/serviceAccountKey.json'); // check if exists or use application default

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function run() {
  console.log("--- Orders ---");
  const orders = await db.collection('orders').orderBy('createdAt', 'desc').limit(2).get();
  orders.forEach(doc => {
    const data = doc.data();
    console.log(doc.id, "Type:", data.transactionType, "Cost:", data.totalCost, "Date:", data.createdAt);
  });
  
  console.log("--- Expenses ---");
  const expenses = await db.collection('expenses').orderBy('createdAt', 'desc').limit(2).get();
  expenses.forEach(doc => {
    console.log(doc.id, doc.data());
  });
}

run().catch(console.error);
