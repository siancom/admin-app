const fs = require('fs');
let content = fs.readFileSync('src/components/POSSystem.jsx', 'utf8');

const oldCode = `  const handleProcessCustomerAppOrder = (orderOrOrders) => {
    const ordersToProcess = Array.isArray(orderOrOrders) ? orderOrOrders : [orderOrOrders];
    if (ordersToProcess.length === 0) return;

    let hasTransfer = false;
    const newCart = [...cart];
    
    ordersToProcess.forEach(order => {
      if (order.paymentMethod === 'transfer') hasTransfer = true;`;

const newCode = `  const handleProcessCustomerAppOrder = (orderOrOrders) => {
    const ordersToProcess = Array.isArray(orderOrOrders) ? orderOrOrders : [orderOrOrders];
    if (ordersToProcess.length === 0) return;

    let hasTransfer = false;
    let totalDiscountAmt = 0;
    const newCart = [...cart];
    
    ordersToProcess.forEach(order => {
      if (order.paymentMethod === 'transfer') hasTransfer = true;
      
      // Accumulate discounts from customer app
      if (order.discount && !isNaN(Number(order.discount))) totalDiscountAmt += Number(order.discount);
      if (order.discountAmt && !isNaN(Number(order.discountAmt))) totalDiscountAmt += Number(order.discountAmt);
      if (order.pointsDiscount && !isNaN(Number(order.pointsDiscount))) totalDiscountAmt += Number(order.pointsDiscount);
      if (order.voucherDiscount && !isNaN(Number(order.voucherDiscount))) totalDiscountAmt += Number(order.voucherDiscount);
      `;

content = content.replace(oldCode, newCode);

const oldSetCode = `    setCart(newCart);
    setActiveCustomerAppOrderIds(prev => [...new Set([...prev, ...ordersToProcess.map(o => o.id)])]);`;

const newSetCode = `    setCart(newCart);
    setActiveCustomerAppOrderIds(prev => [...new Set([...prev, ...ordersToProcess.map(o => o.id)])]);
    
    if (totalDiscountAmt > 0) {
        setDiscountType('amount');
        setDiscountVal(totalDiscountAmt);
    }`;

content = content.replace(oldSetCode, newSetCode);

fs.writeFileSync('src/components/POSSystem.jsx', content, 'utf8');
console.log("Updated handleProcessCustomerAppOrder with discount logic");
