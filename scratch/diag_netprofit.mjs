import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { firebaseConfig } from '../src/config/firebase.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'iris-care');
const M = process.argv[2] || '2026-10';

const [ordersSnap, eodSnap] = await Promise.all([
  getDocs(collection(db, 'orders')),
  getDocs(collection(db, 'daily_sales')),
]);

const byBranch = {};
const add = (b, k, v) => { byBranch[b] ??= { orders: 0, orderSales: 0, nonIsoOrders: 0, eods: 0, eodSales: 0, eodDeposit: 0, eodManual: 0 }; byBranch[b][k] += v; };

ordersSnap.forEach(d => {
  const o = d.data();
  const c = o.createdAt;
  if (typeof c !== 'string' || !c.includes('T')) { if (String(c || o['วันที่'] || '').includes(M)) add(o.branch || '?', 'nonIsoOrders', 1); return; }
  if (!c.startsWith(M)) return;
  add(o.branch || '?', 'orders', 1);
  add(o.branch || '?', 'orderSales', Number(String(o.price ?? 0).replace(/,/g, '')) || 0);
});

const sample = [];
eodSnap.forEach(d => {
  const e = d.data();
  let iso = '';
  if (e.date && e.date.includes('/')) { let [dd, mm, yy] = e.date.split('/'); yy = +yy > 2500 ? +yy - 543 : yy; iso = `${yy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`; }
  else if (e.createdAt) iso = String(e.createdAt).slice(0, 10);
  if (!iso.startsWith(M)) return;
  add(e.branch || '?', 'eods', 1);
  add(e.branch || '?', 'eodSales', Number(e.totalSales) || 0);
  add(e.branch || '?', 'eodDeposit', Number(e.totalDeposit || e.expectedDeposit) || 0);
  add(e.branch || '?', 'eodManual', Number(e.manualTransfer) || 0);
  if (sample.length < 3) sample.push({ id: d.id, date: e.date, createdAt: e.createdAt, keys: Object.keys(e).join(',') });
});

console.log(JSON.stringify(byBranch, null, 2));
console.log(JSON.stringify(sample, null, 2));
process.exit(0);
