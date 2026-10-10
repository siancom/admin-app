const fs = require('fs');
let content = fs.readFileSync('src/components/POSSystem.jsx', 'utf8');

const targetStr = `      await batch.commit();
      
      if (appliedVoucherId) {`;

const insertStr = `      // --- Auto-complete Active Queue ---
      if (selectedCustomer && selectedCustomer.phone) {
        try {
          const { query: fbQuery, collection, where, getDocs } = require('firebase/firestore'); // ensure available or use the ones imported
          // Check if getDocs, query, where are available in scope. 
          // Wait, they are imported at the top of POSSystem.jsx!
          const qBk = fbQuery(collection(db, 'bookings'), where('phone', '==', selectedCustomer.phone), where('status', '==', 'กำลังใช้บริการ'));
          const snapBk = await getDocs(qBk);
          snapBk.forEach(docSnap => {
            batch.update(docSnap.ref, { status: 'เสร็จสิ้น', completedAt: new Date().toISOString() });
          });
        } catch (e) {
          console.error("Error auto-completing queue:", e);
        }
      }
      
      await batch.commit();
      
      if (appliedVoucherId) {`;

// Replace `fbQuery` with `query` since it's already imported
const insertStrFinal = insertStr.replace(/fbQuery/g, 'query');

content = content.replace(targetStr, insertStrFinal);

fs.writeFileSync('src/components/POSSystem.jsx', content, 'utf8');
console.log("Patched POSSystem.jsx for auto-completing queue");
