const fs = require('fs');

let content = fs.readFileSync('src/components/POSSystem.jsx', 'utf8');

// 1. Fix handleCheckout stock logic properly
// We need to replace the logic inside `if (item.type === 'product') { ... }` inside handleCheckout.
let handleCheckoutLogic = `        if (item.type === 'product') {
          const productRef = doc(db, 'products', item.id);
          const currentLocalStock = getBranchStock(item.originalItem, globalBranch);
          
          // Re-calculate stock based on action type
          let newStockByBranch = { ...(item.originalItem.stock_by_branch || {}) };
          
          if (item.actionType === 'owner_purchase') {
            const chawengStock = parseQty(newStockByBranch['เฉวง'] || 0);
            newStockByBranch['เฉวง'] = chawengStock + item.qty;
          } else if (item.actionType === 'branch_requisition') {
            const chawengStock = parseQty(newStockByBranch['เฉวง'] || 0);
            const myStock = parseQty(newStockByBranch[globalBranch || 'เฉวง'] || 0);
            newStockByBranch['เฉวง'] = Math.max(0, chawengStock - item.qty);
            if (globalBranch && globalBranch !== 'เฉวง') {
               newStockByBranch[globalBranch] = myStock + item.qty;
            }
          } else {
            const myStock = parseQty(newStockByBranch[globalBranch || 'เฉวง'] || 0);
            newStockByBranch[globalBranch || 'เฉวง'] = Math.max(0, myStock - item.qty);
          }

          batch.update(productRef, { stock_by_branch: newStockByBranch });

          // History for product
          const historyRef = doc(getCol('histories'));
          let historyType = "ซื้อสินค้า";
          if (item.actionType === 'owner_purchase') historyType = "สั่งซื้อสินค้าเข้าสต๊อก (PO)";
          else if (item.actionType === 'branch_requisition') historyType = "เบิกสินค้าจากศูนย์ใหญ่";

          batch.set(historyRef, {
            "วันที่": new Date().toLocaleDateString('th-TH'),
            "ชื่อลูกค้า": (item.actionType === 'owner_purchase' || item.actionType === 'branch_requisition') ? 'ศูนย์ใหญ่/พาร์ทเนอร์' : cName,
            "เบอร์โทร": (item.actionType === 'owner_purchase' || item.actionType === 'branch_requisition') ? '' : cPhone,
            "หมายเลขคำสั่งซื้อ": orderNo,
            "ประเภท": historyType,
            "สถานะ": "เรียบร้อย",
            "สินค้า": item.name,
            "จำนวน": String(item.qty),
            "ยอดเงิน": String(item.price * item.qty),
            "สาขา": item.actionType === 'owner_purchase' ? 'เฉวง' : String(globalBranch || "สำนักงานใหญ่"), 
          });
        } 
        else if (item.type === 'usage') {`;

content = content.replace(
  /        if \(item\.type === 'product'\) \{[\s\S]*?\} \n        else if \(item\.type === 'usage'\) \{/,
  handleCheckoutLogic
);

// 2. Fix the generic history log at the bottom of handleCheckout
let genericHistoryLogic = `      const historyRef = doc(getCol('histories'));
      
      let historyType = 'ซื้อสินค้า/บริการ (POS)';
      let isOwnerPurchaseTransaction = cart.some(i => i.actionType === 'owner_purchase');
      let isRequisitionTransaction = cart.some(i => i.actionType === 'branch_requisition');
      
      if (isOwnerPurchaseTransaction) historyType = 'สั่งซื้อสินค้าเข้าสต๊อก (PO)';
      else if (isRequisitionTransaction) historyType = 'ใบเบิกสินค้า';

      batch.set(historyRef, {
        "วันที่": new Date().toLocaleDateString('th-TH'),
        "เวลา": new Date().toLocaleTimeString('th-TH', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        "ชื่อลูกค้า": isOwnerPurchaseTransaction || isRequisitionTransaction ? 'ศูนย์ใหญ่/พาร์ทเนอร์' : cName,
        "เบอร์โทร": isOwnerPurchaseTransaction || isRequisitionTransaction ? '' : cPhone,
        "รายละเอียด": itemsStr.join(', '),
        "ยอดจัดซื้อ": isOwnerPurchaseTransaction || isRequisitionTransaction ? total : 0,
        "ยอดเงิน": isOwnerPurchaseTransaction || isRequisitionTransaction ? 0 : total,
        "สถานะ": splitPayment.cod > 0 ? "ค้างชำระ" : "ชำระเงินแล้ว",
        "วิธีการชำระ": paymentMethodStr,
        "ประเภท": historyType,
        "สาขา": isOwnerPurchaseTransaction ? 'เฉวง' : String(globalBranch || "สำนักงานใหญ่")
      });`;

content = content.replace(
  /      const historyRef = doc\(getCol\('histories'\)\);\n      batch\.set\(historyRef, \{[\s\S]*?"สาขา": String\(globalBranch \|\| "สำนักงานใหญ่"\)\n      \}\);/,
  genericHistoryLogic
);

// 3. Fix the Receipt Title
let receiptTitleLogic = `          <h1 className="font-bold text-xl mb-1">IRIS NATURES</h1>
          <p className="text-xs">{globalBranch || "สำนักงานใหญ่"}</p>
          <p className="text-xs mb-2">
            {receiptData.items.some(i => i.actionType === 'owner_purchase') 
              ? 'ใบสั่งซื้อ (Purchase Order)' 
              : receiptData.items.some(i => i.actionType === 'branch_requisition')
                ? 'ใบเบิกสินค้า (Requisition)'
                : 'ใบเสร็จรับเงิน / Receipt'}
          </p>`;

content = content.replace(
  /          <h1 className="font-bold text-xl mb-1">IRIS NATURES<\/h1>\n          <p className="text-xs">\{globalBranch \|\| "สำนักงานใหญ่"\}<\/p>\n          <p className="text-xs mb-2">ใบเสร็จรับเงิน \/ Receipt<\/p>/,
  receiptTitleLogic
);

fs.writeFileSync('src/components/POSSystem.jsx', content, 'utf8');
console.log("Successfully fixed checkout and receipt logic");
