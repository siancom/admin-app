const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBS3zKEA6zosmy8tLRTyJ38BPLlUQS30gU",
  authDomain: "iris-clinic-app.firebaseapp.com",
  projectId: "iris-clinic-app"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "iris-care");

async function run() {
  const courses = await getDocs(collection(db, 'courses'));
  let posCount = 0;
  let oldCount = 0;
  
  let posSamples = [];
  let oldSamples = [];
  
  courses.forEach(d => {
      const data = d.data();
      const ref = String(data['เลขที่ใบคอส'] || data.col_2 || '').trim();
      
      // Is it a POS course?
      // IC followed by digits
      if (/^IC\d+/.test(ref) || /^IC\d+/.test(ref)) {
          posCount++;
          if (posSamples.length < 3) posSamples.push(ref);
      } else {
          oldCount++;
          if (oldSamples.length < 3) oldSamples.push(ref);
      }
  });

  console.log(`POS Courses: ${posCount}`);
  console.log('Samples:', posSamples);
  console.log(`Old Courses: ${oldCount}`);
  console.log('Samples:', oldSamples);
}
run();
