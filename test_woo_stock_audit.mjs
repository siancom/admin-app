// Batch enable manage_stock for all WooCommerce products that match POS products
// and set initial stock from Firestore
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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
    console.log(`  Fetched page ${page - 1}, total so far: ${all.length}`);
  }
  return all;
}

async function run() {
  console.log('=== Fetching all WooCommerce products ===');
  const wooProducts = await getAllWooProducts();
  console.log(`Total Woo products: ${wooProducts.length}`);
  
  const noManageStock = wooProducts.filter(p => !p.manage_stock);
  const hasManageStock = wooProducts.filter(p => p.manage_stock);
  
  console.log(`\n📦 With manage_stock ON: ${hasManageStock.length}`);
  console.log(`📭 With manage_stock OFF: ${noManageStock.length}`);
  
  console.log('\n=== Sample products ===');
  wooProducts.slice(0, 10).forEach(p => {
    console.log(`  [${p.id}] ${p.name} | SKU: "${p.sku}" | manage_stock: ${p.manage_stock} | stock: ${p.stock_quantity}`);
  });
}

run().catch(console.error);
