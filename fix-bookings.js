import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixBookings() {
    console.log("Fetching bookings...");
    const snap = await getDocs(collection(db, 'bookings'));
    let fixed = 0;
    for (const d of snap.docs) {
        const data = d.data();
        if (data.dateTime && (!data.date || !data.time)) {
            const date = data.dateTime.split('T')[0];
            const time = data.dateTime.split('T')[1];
            await updateDoc(doc(db, 'bookings', d.id), { date, time });
            fixed++;
        }
    }
    console.log(`Fixed ${fixed} bookings`);
    process.exit(0);
}
fixBookings().catch(console.error);
