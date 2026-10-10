import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

// Using the same config as the app
const firebaseConfig = {
  // We can just read it from src/config/firebase.js
};
