import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "iris-clinic-admin", // Let's check the real project id. The previous output said Project Console: https://console.firebase.google.com/project/iris-clinic-app/overview
};
// Actually we don't have the API key here easily.
