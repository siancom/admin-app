import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { firebaseConfig } from '../src/config/firebase.js';
const db = getFirestore(initializeApp(firebaseConfig), 'iris-care');
const s = await getDocs(collection(db, 'daily_sales'));
let extra = 0;
s.forEach(d => { const e = d.data(); if (e.branch !== 'เฉวง' || !/\/10\/2569$/.test(e.date || '') || e.manualTransfer === undefined) return; extra += (Number(e.manualTransfer)||0) + (Number(e.difference)||0); });
console.log('extra sales', extra, 'net', extra - 72522);
process.exit(0);
