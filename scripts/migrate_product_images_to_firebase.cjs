const { initializeApp } = require('firebase/app');
const { getAuth, signInAnonymously } = require('firebase/auth');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');

const firebaseConfig = {
  apiKey: 'AIzaSyBS3zKEA6zosmy8tLRTyJ38BPLlUQS30gU',
  authDomain: 'iris-clinic-app.firebaseapp.com',
  projectId: 'iris-clinic-app',
  storageBucket: 'iris-clinic-app.firebasestorage.app',
  messagingSenderId: '372749467528',
  appId: '1:372749467528:web:1e90ecab74274ec965843d'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, 'iris-care');
const storage = getStorage(app);

function getSourceImageUrl(p) {
  // If already in Firebase Storage, skip
  const existingFb = p.firebaseImageUrl || p['รูปภาพ'];
  if (existingFb && typeof existingFb === 'string' && existingFb.includes('firebasestorage.googleapis.com')) {
    return { url: null, alreadyMigrated: true };
  }

  // 1. Check 'รูปภาพ' (WordPress / WooCommerce media)
  const rawPicture = p['รูปภาพ'] || p['image'] || p['imageUrl'] || p['img'];
  if (rawPicture && typeof rawPicture === 'string') {
    const first = rawPicture.split(',')[0].trim();
    if (first.startsWith('http://') || first.startsWith('https://')) {
      return { url: first, type: 'web' };
    }
  }

  // 2. Check 'รูปสินค้า' (AppSheet CRM legacy)
  const rawProductImg = p['รูปสินค้า'];
  if (rawProductImg && typeof rawProductImg === 'string' && rawProductImg.trim()) {
    const first = rawProductImg.split(',')[0].trim();
    if (first.startsWith('http://') || first.startsWith('https://')) {
      return { url: first, type: 'crm' };
    }
    let clean = first.replace(/^\/+/, '');
    if (clean.startsWith('สินค้า_Images/')) {
      clean = clean.replace(/^สินค้า_Images\//, '');
    }
    return { url: 'https://crm.irisnatures.com/สินค้า_Images/' + encodeURI(clean), type: 'crm' };
  }

  return { url: null, alreadyMigrated: false };
}

async function runMigration() {
  console.log('--- Starting Product Image Migration to Firebase Storage ---');
  await signInAnonymously(auth);
  console.log('✓ Signed in to Firebase Auth');

  const snap = await getDocs(collection(db, 'products'));
  console.log(`✓ Fetched ${snap.size} products from Firestore`);

  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < snap.docs.length; i++) {
    const docSnap = snap.docs[i];
    const data = docSnap.data();
    const id = docSnap.id;
    const name = data['ชื่อสินค้า'] || data['col_2'] || id;
    const code = (data['รหัส'] || data['col_1'] || id).replace(/[^a-zA-Z0-9_-]/g, '_');

    const { url, alreadyMigrated } = getSourceImageUrl(data);

    if (alreadyMigrated) {
      skippedCount++;
      continue;
    }

    if (!url) {
      skippedCount++;
      continue;
    }

    try {
      console.log(`[${i + 1}/${snap.size}] Downloading image for "${name}" from ${url}...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        console.warn(`  ↳ Failed to download (Status ${res.status}): ${url}`);
        errorCount++;
        continue;
      }

      const contentType = res.headers.get('content-type') || 'image/jpeg';
      const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
      const buffer = Buffer.from(await res.arrayBuffer());

      if (buffer.length < 100) {
        console.warn(`  ↳ File too small (${buffer.length} bytes), skipping`);
        errorCount++;
        continue;
      }

      const fileName = `products/${code}_${Date.now()}.${ext}`;
      const fileRef = ref(storage, fileName);
      await uploadBytes(fileRef, buffer, { contentType });
      const downloadUrl = await getDownloadURL(fileRef);

      // Update Firestore
      await updateDoc(doc(db, 'products', id), {
        firebaseImageUrl: downloadUrl,
        "รูปภาพ": downloadUrl
      });

      console.log(`  ✓ Successfully uploaded & updated: ${downloadUrl}`);
      migratedCount++;
    } catch (err) {
      console.error(`  ✕ Error for "${name}":`, err.message);
      errorCount++;
    }
  }

  console.log('\n=======================================');
  console.log(`Migration Complete!`);
  console.log(`- Successfully Migrated to Firebase: ${migratedCount}`);
  console.log(`- Already on Firebase or No Image:   ${skippedCount}`);
  console.log(`- Errors / Failed Downloads:        ${errorCount}`);
  console.log('=======================================');
}

runMigration().catch(console.error);
