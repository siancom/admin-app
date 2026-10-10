const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

const firebaseConfig = {
  projectId: "iris-clinic-app",
  // Need to provide auth if we are just using the client sdk... wait, we can just use firebase-admin
};
