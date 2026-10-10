const fs = require('fs');

let content = fs.readFileSync('src/components/POSSystem.jsx', 'utf8');

// 1. Fix todaySales
content = content.replace(
  "if (type.includes('ซื้อสินค้า') || type.includes('ซื้อคอร์ส')) {",
  "if ((type.includes('ซื้อสินค้า') || type.includes('ซื้อคอร์ส')) && !type.includes('PO')) {"
);

// 2. Fix todaySalesBreakdown
content = content.replace(
  "    orders.forEach(o => {",
  "    orders.forEach(o => {\n      if (o.transactionType === 'owner_purchase' || o.transactionType === 'branch_requisition') return;"
);

// 3. Fix currentMonthSales
content = content.replace(
  "    return orders.reduce((sum, o) => {",
  "    return orders.reduce((sum, o) => {\n      if (o.transactionType === 'owner_purchase' || o.transactionType === 'branch_requisition') return sum;"
);

// 4. Update handleCheckout to save transactionType to order document
let orderDocStr = `      let transactionType = 'sale';
      if (cart.some(i => i.actionType === 'owner_purchase')) transactionType = 'owner_purchase';
      else if (cart.some(i => i.actionType === 'branch_requisition')) transactionType = 'branch_requisition';

      batch.set(orderRef, {
        orderNo,
        customerName: cName,
        customerPhone: cPhone,
        courseName: itemsStr.join(', '), // Summarize items
        price: String(total),
        discount: String(globalDiscount),
        qty: String(cart.reduce((sum, item) => sum + item.qty, 0)),
        branch: String(globalBranch || "สำนักงานใหญ่"),
        status: "อนุมัติแล้ว",
        paymentMethod: paymentMethodStr,
        source: "POS",
        orderChannel,
        shippingAddress,
        wcOrderId: activeWcOrderId,
        createdAt: new Date().toISOString(),
        paymentStaff,
        customerPhoto: paymentPhotoUrl,
        customerSignature: custSignatureUrl,
        staffSignature: staffSignatureUrl,
        transactionType
      });`;

content = content.replace(
  /      batch\.set\(orderRef, \{\n        orderNo,\n        customerName: cName,\n        customerPhone: cPhone,\n        courseName: itemsStr\.join\(', '\), \/\/ Summarize items\n        price: String\(total\),\n        discount: String\(globalDiscount\),\n        qty: String\(cart\.reduce\(\(sum, item\) => sum \+ item\.qty, 0\)\),\n        branch: String\(globalBranch \|\| "สำนักงานใหญ่"\),\n        สถานะ: "อนุมัติแล้ว",\n        paymentMethod: paymentMethodStr,\n        source: "POS",\n        orderChannel,\n        shippingAddress,\n        wcOrderId: activeWcOrderId,\n        createdAt: new Date\(\)\.toISOString\(\),\n        paymentStaff,\n        customerPhoto: paymentPhotoUrl,\n        customerSignature: custSignatureUrl,\n        staffSignature: staffSignatureUrl\n      \}\);/,
  orderDocStr
);
// The above regex might fail if the original format is slightly different.
// Let's do a more robust replacement using just `orderNo` and `staffSignature` boundaries.
content = content.replace(
  /      batch\.set\(orderRef, \{[\s\S]*?staffSignature: staffSignatureUrl\n      \}\);/,
  orderDocStr
);


fs.writeFileSync('src/components/POSSystem.jsx', content, 'utf8');
console.log("Successfully patched metrics logic");
