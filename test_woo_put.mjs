// Test WooCommerce PUT product stock update
const WOO_CFG = {
  url: "https://irisnatures.com",
  key: "ck_6ecc49bb94d5c11308fb1c60ce30f220eb6e2302",
  sec: "cs_e0d7c58b3ec8093ba7aa5abc0b87186e7522d502"
};

const authHeader = 'Basic ' + Buffer.from(`${WOO_CFG.key}:${WOO_CFG.sec}`).toString('base64');

// Step 1: Fetch first few products to get an ID and see their structure
async function run() {
  console.log('=== Fetching products to find IDs ===');
  const res = await fetch(`${WOO_CFG.url}/wp-json/wc/v3/products?per_page=5`, {
    headers: { 'Authorization': authHeader, 'Accept': 'application/json' }
  });
  const products = await res.json();
  
  if (!Array.isArray(products)) {
    console.error('Error fetching products:', products);
    return;
  }

  for (const p of products) {
    console.log(`\nProduct: [${p.id}] ${p.name}`);
    console.log(`  SKU: ${p.sku}`);
    console.log(`  Type: ${p.type}`);
    console.log(`  manage_stock: ${p.manage_stock}`);
    console.log(`  stock_quantity: ${p.stock_quantity}`);
    console.log(`  stock_status: ${p.stock_status}`);
  }

  // Step 2: Try PUT on the first product
  const testProduct = products[0];
  if (!testProduct) return;
  
  const currentStock = testProduct.stock_quantity || 0;
  const newStock = currentStock; // Same stock, just test the call
  
  console.log(`\n=== Testing PUT on product [${testProduct.id}] "${testProduct.name}" ===`);
  console.log(`Current stock: ${currentStock}, Setting to: ${newStock} (no change)`);
  
  const putRes = await fetch(`${WOO_CFG.url}/wp-json/wc/v3/products/${testProduct.id}`, {
    method: 'PUT',
    headers: { 
      'Authorization': authHeader, 
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ manage_stock: true, stock_quantity: newStock })
  });
  
  console.log(`PUT response status: ${putRes.status}`);
  const putData = await putRes.json();
  
  if (putData.id) {
    console.log(`✅ PUT success! Updated product: ${putData.name}`);
    console.log(`  manage_stock after: ${putData.manage_stock}`);
    console.log(`  stock_quantity after: ${putData.stock_quantity}`);
  } else {
    console.error('❌ PUT failed:', JSON.stringify(putData, null, 2));
  }
}

run().catch(console.error);
