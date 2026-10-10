// Sync current POS stock to WooCommerce for all matched products
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD9BQ_TSNQbAJk5gT6vmBHPhiWMl-MAdec",
  authDomain: "iris-crm-9f56c.firebaseapp.com",
  projectId: "iris-crm-9f56c",
  storageBucket: "iris-crm-9f56c.firebasestorage.app",
  messagingSenderId: "1065046516284",
  appId: "1:1065046516284:web:eeeda9afbe54f5a2bb9e56"
};

const WOO_CFG = {
  url: "https://irisnatures.com",
  key: "ck_6ecc49bb94d5c11308fb1c60ce30f220eb6e2302",
  sec: "cs_e0d7c58b3ec8093ba7aa5abc0b87186e7522d502"
};

const authHeader = 'Basic ' + Buffer.from(`${WOO_CFG.key}:${WOO_CFG.sec}`).toString('base64');

async function wooFetch(path, method = 'GET', body = null) {
  const res = await fetch(`${WOO_CFG.url}/wp-json/wc/v3/${path}`, {
    method,
    headers: { 
      'Authorization': authHeader, 
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  return res.json();
}

async function getAllWooProducts() {
  let all = [];
  let page = 1;
  while (true) {
    const data = await wooFetch(`products?per_page=100&page=${page}`);
    if (!Array.isArray(data) || data.length === 0) break;
    all = all.concat(data);
    if (data.length < 100) break;
    page++;
  }
  return all;
}

function parseQty(val) {
  if (!val) return 0;
  return Math.floor(parseFloat(String(val).replace(/,/g, '').replace(/[^\d.-]/g, '').trim()) || 0);
}

function getTotalStock(product) {
  // Sum up all branch stocks if available
  let total = 0;
  const keys = Object.keys(product);
  const branchKeys = keys.filter(k => k.startsWith('จำนวนคงเหลือ_'));
  
  if (branchKeys.length > 0) {
    for (const bk of branchKeys) {
      total += parseQty(product[bk]);
    }
    // Also add main stock
    total += parseQty(product['จำนวนคงเหลือ'] || product['col_12']);
  } else {
    total = parseQty(product['จำนวนคงเหลือ'] || product['col_12']);
  }
  return total;
}

function getFuzzy(obj, keys) {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
  }
  return '';
}

async function run() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  console.log('=== Fetching POS products from Firestore ===');
  const snap = await getDocs(collection(db, 'products'));
  const posProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`POS products: ${posProducts.length}`);
  
  console.log('\n=== Fetching all WooCommerce products ===');
  const wooProducts = await getAllWooProducts();
  console.log(`Woo products: ${wooProducts.length}`);
  
  // Build Woo lookup by name and SKU
  const wooByName = new Map();
  const wooBySku = new Map();
  wooProducts.forEach(wp => {
    wooByName.set(wp.name.toLowerCase().trim(), wp);
    if (wp.sku) wooBySku.set(wp.sku.trim(), wp);
  });
  
  console.log('\n=== Matching and preparing updates ===');
  const updates = [];
  const unmatched = [];
  
  for (const pos of posProducts) {
    const posName = String(getFuzzy(pos, ['ชื่อสินค้า', 'col_2']) || '').toLowerCase().trim();
    const posSku = String(getFuzzy(pos, ['รหัส', 'col_1']) || '').trim();
    const totalStock = getTotalStock(pos);
    
    const woo = wooBySku.get(posSku) || wooByName.get(posName);
    
    if (woo) {
      updates.push({
        wooId: woo.id,
        wooName: woo.name,
        posName,
        oldStock: woo.stock_quantity,
        newStock: totalStock
      });
    } else {
      unmatched.push({ posName, posSku });
    }
  }
  
  console.log(`\nMatched: ${updates.length} products`);
  console.log(`Unmatched: ${unmatched.length} products`);
  
  if (updates.length === 0) {
    console.log('\n❌ No matches found. Check name/SKU alignment between POS and Woo.');
    console.log('Sample POS names:', posProducts.slice(0, 5).map(p => getFuzzy(p, ['ชื่อสินค้า', 'col_2'])));
    return;
  }
  
  console.log('\n=== Stock updates to apply ===');
  updates.forEach(u => {
    console.log(`  [${u.wooId}] ${u.wooName}: ${u.oldStock ?? 'null'} → ${u.newStock}`);
  });
  
  console.log('\n=== Sending batch update to WooCommerce ===');
  const batchPayload = updates.map(u => ({
    id: u.wooId,
    manage_stock: true,
    stock_quantity: u.newStock
  }));
  
  const chunkSize = 50;
  for (let i = 0; i < batchPayload.length; i += chunkSize) {
    const chunk = batchPayload.slice(i, i + chunkSize);
    const result = await wooFetch('products/batch', 'POST', { update: chunk });
    if (result.update) {
      console.log(`  ✅ Chunk ${Math.floor(i/chunkSize)+1}: Updated ${result.update.filter(p => p.id).length} products`);
    } else {
      console.log(`  ❌ Chunk error:`, JSON.stringify(result).slice(0, 200));
    }
    await new Promise(r => setTimeout(r, 500));
  }
  
  if (unmatched.length > 0) {
    console.log('\n⚠️  Unmatched POS products (no Woo counterpart):');
    unmatched.forEach(u => console.log(`  "${u.posName}" (SKU: "${u.posSku}")`));
  }
  
  console.log('\n✅ Done! Stock sync complete.');
}

run().catch(console.error);
