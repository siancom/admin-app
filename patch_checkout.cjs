const fs = require('fs');

let content = fs.readFileSync('src/components/POSSystem.jsx', 'utf8');

// Update addToCart definition
content = content.replace(
  "  const addToCart = (item, type) => {",
  "  const addToCart = (item, type, actionType = null) => {"
);

// Update addToCart logic for product type to handle actionType
let addToCartLogic = `      } else {
        if (type === 'product') {
          let maxQty = parseQty(getFuzzyKey(item, ["จำนวนคงเหลือ", "col_12"]));
          let price = computeFinalPrice(item, isVipCustomer);
          let nameStr = String(getFuzzyKey(item, ["ชื่อสินค้า", "col_2"]));
          const fullPrice = parseNumber(getFuzzyKey(item, ["ราคาขายเต็ม", "col_6"]));

          if (actionType === 'owner_purchase') {
             price = computeOwnerCostPrice(item);
             maxQty = 9999;
             nameStr = \`[ซื้อเข้า-เฉวง] \${nameStr}\`;
          } else if (actionType === 'branch_requisition') {
             price = computeOwnerCostPrice(item);
             // Branch requisitions from Chaweng, so maxQty is Chaweng's stock
             maxQty = parseQty(getBranchStock(item, 'เฉวง'));
             nameStr = \`[เบิกจากเฉวง] \${nameStr}\`;
          }

          return [...prev, { id: item.id, name: nameStr, price, originalPrice: fullPrice, qty: 1, type, actionType, maxQty, originalItem: item, isManualPrice: false }];
        } else if (type === 'course') {`;

content = content.replace(
  /      \} else \{\n        if \(type === 'product'\) \{[\s\S]*?\} else if \(type === 'course'\) \{/,
  addToCartLogic
);

// In the product card onClick, use the actionType
// The current code has: onClick={() => isOwnerPurchase ? addToCart(p, 'product') : isStockMode ? setStockInputModal({ isOpen: true, item: p, inputVal: '' }) : addToCart(p, 'product')}
content = content.replace(
  "onClick={() => isOwnerPurchase ? addToCart(p, 'product') : isStockMode ? setStockInputModal({ isOpen: true, item: p, inputVal: '' }) : addToCart(p, 'product')}",
  "onClick={() => isOwnerPurchase ? addToCart(p, 'product', 'owner_purchase') : isStockMode ? setStockInputModal({ isOpen: true, item: p, inputVal: '' }) : addToCart(p, 'product')}"
);

// Wait, where is the "Branch Requisition" button? 
// The user says "สาขาอื่นเบิกไปอีกทีและจ่ายตามราคาต้นทุน".
// I will add a "เบิกสินค้าจากเฉวง" mode next to "โหมดนับสต๊อก".
// For now, let's just fix the Owner Purchase checkout logic so that it ADDS to Chaweng.

let handleCheckoutLogic = `      for (const item of cart) {
        itemsStr.push(\`\${item.name} x\${item.qty}\`);

        if (item.type === 'product') {
          const productRef = doc(db, 'products', item.id);
          const currentLocalStock = getBranchStock(item.originalItem, globalBranch);

          if (item.actionType === 'owner_purchase') {
            // Adds stock to Chaweng
            const chawengStock = getBranchStock(item.originalItem, 'เฉวง');
            batch.update(productRef, {
              [\`branches_เฉวง\`]: chawengStock + item.qty
            });
          } else if (item.actionType === 'branch_requisition') {
            // Requisition from Chaweng to globalBranch
            const chawengStock = getBranchStock(item.originalItem, 'เฉวง');
            batch.update(productRef, {
              [\`branches_เฉวง\`]: Math.max(0, chawengStock - item.qty),
              [\`branches_\${globalBranch}\`]: currentLocalStock + item.qty
            });
          } else {
            // Normal Sale: Reduce Stock in Firebase
            batch.update(productRef, {
              [\`branches_\${globalBranch}\`]: Math.max(0, currentLocalStock - item.qty)
            });
          }
        } else if (item.type === 'usage') {`;

content = content.replace(
  /      for \(const item of cart\) \{\n        itemsStr\.push\(`\$\{item\.name\} x\$\{item\.qty\}`\);\n\n        if \(item\.type === 'product'\) \{\n          \/\/ Reduce Stock in Firebase\n          const productRef = doc\(db, 'products', item\.id\);\n          const currentLocalStock = getBranchStock\(item\.originalItem, globalBranch\);\n          batch\.update\(productRef, \{\n            \[`branches_\$\{globalBranch\}`\]: Math\.max\(0, currentLocalStock - item\.qty\)\n          \}\);\n        \} else if \(item\.type === 'usage'\) \{/,
  handleCheckoutLogic
);

// We need to write history as well!
// Wait, the history is written further down in handleCheckout:
let historyLogic = `      const historyRef = doc(getCol('histories'));
      
      let historyType = 'ซื้อสินค้า/บริการ (POS)';
      let isOwnerPurchaseTransaction = cart.some(i => i.actionType === 'owner_purchase');
      let isRequisitionTransaction = cart.some(i => i.actionType === 'branch_requisition');
      
      if (isOwnerPurchaseTransaction) historyType = 'สั่งซื้อสินค้าเข้าสต๊อก (ศูนย์ใหญ่)';
      else if (isRequisitionTransaction) historyType = 'เบิกสินค้าจากศูนย์ใหญ่';

      batch.set(historyRef, {
        "วันที่": new Date().toLocaleDateString('th-TH'),
        "เวลา": new Date().toLocaleTimeString('th-TH', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        "ชื่อลูกค้า": isOwnerPurchaseTransaction || isRequisitionTransaction ? 'พนักงาน/สาขา' : cName,
        "เบอร์โทร": isOwnerPurchaseTransaction || isRequisitionTransaction ? '' : cPhone,
        "รายละเอียด": itemsStr.join(', '),
        "ยอดจัดซื้อ": isOwnerPurchaseTransaction || isRequisitionTransaction ? total : 0, // ยอดต้นทุน
        "ยอดเงิน": isOwnerPurchaseTransaction || isRequisitionTransaction ? 0 : total, // ยอดขาย
        "สถานะ": splitPayment.cod > 0 ? "ค้างชำระ" : "ชำระเงินแล้ว",
        "วิธีการชำระ": paymentMethodStr,
        "ประเภท": historyType,
        "สาขา": isOwnerPurchaseTransaction ? 'เฉวง' : String(globalBranch || "สำนักงานใหญ่")
      });`;

content = content.replace(
  /      const historyRef = doc\(getCol\('histories'\)\);\n      batch\.set\(historyRef, \{\n        "วันที่": new Date\(\)\.toLocaleDateString\('th-TH'\),\n        "เวลา": new Date\(\)\.toLocaleTimeString\('th-TH', \{ hour12: false, hour: '2-digit', minute: '2-digit' \}\),\n        "ชื่อลูกค้า": cName,\n        "เบอร์โทร": cPhone,\n        "รายละเอียด": itemsStr\.join\(', '\),\n        "ยอดเงิน": total,\n        "สถานะ": splitPayment\.cod > 0 \? "ค้างชำระ" : "ชำระเงินแล้ว",\n        "วิธีการชำระ": paymentMethodStr,\n        "ประเภท": "ซื้อสินค้า\/บริการ \(POS\)",\n        "สาขา": String\(globalBranch \|\| "สำนักงานใหญ่"\)\n      \}\);/,
  historyLogic
);

fs.writeFileSync('src/components/POSSystem.jsx', content, 'utf8');
console.log("Successfully patched checkout logic");
