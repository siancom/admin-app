// Batch enable manage_stock for all WooCommerce products
// This will turn on stock management for all 54 products that have it disabled
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

// Use WooCommerce batch update API (max 100 at a time)
async function batchUpdate(updates) {
  const chunkSize = 50;
  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize);
    console.log(`  Sending batch chunk ${Math.floor(i/chunkSize)+1} (${chunk.length} items)...`);
    const result = await wooFetch('products/batch', 'POST', { update: chunk });
    
    if (result.update) {
      const success = result.update.filter(p => p.id).length;
      console.log(`  ✅ Updated ${success}/${chunk.length} products`);
    } else {
      console.log(`  ❌ Batch error:`, JSON.stringify(result).slice(0, 200));
    }
    // Rate limit
    await new Promise(r => setTimeout(r, 500));
  }
}

async function run() {
  console.log('=== Step 1: Fetch all WooCommerce products ===');
  const wooProducts = await getAllWooProducts();
  console.log(`Total: ${wooProducts.length} products`);
  
  const noManage = wooProducts.filter(p => !p.manage_stock);
  console.log(`Products without manage_stock: ${noManage.length}`);
  
  if (noManage.length === 0) {
    console.log('✅ All products already have manage_stock enabled!');
    return;
  }
  
  console.log('\n=== Step 2: Enable manage_stock for all (with stock_quantity = 0 initially) ===');
  console.log('Products to update:');
  noManage.forEach(p => console.log(`  [${p.id}] ${p.name}`));
  
  const updates = noManage.map(p => ({
    id: p.id,
    manage_stock: true,
    stock_quantity: p.stock_quantity || 0  // Keep current or set to 0
  }));
  
  await batchUpdate(updates);
  
  console.log('\n=== Done! ===');
  console.log('All products now have manage_stock enabled.');
  console.log('POS will now be able to update their stock quantities after each sale!');
}

run().catch(console.error);
