const fs = require('fs');

const filePath = '/Users/ittichai/ZCodeProject/admin-dashboard/src/App.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add sendOrderLineNotification function right after sendBookingLineNotification
const orderNotificationCode = `

  const sendOrderLineNotification = async (order, newStatus, lineUid) => {
      if (!lineUid) return;
      const LINE_TOKEN = 'ZETupyqjlJyWxas+yaTBSDuGIkZKAwd8B6bWsZhmqfC+A00I/9LfZm8fSu31l8buhDOZbJhCivLyWiTVsxCZvOmAB0wmAYf4Q+t2jad/G1ZIzmnfo66k79bG6W9QQJIZcJxWuPEj9K5QAQKlVlXSbgdB04t89/1O/w1cDnyilFU=';
      
      const statusColors = {
          'รออนุมัติ': '#f59e0b',
          'อนุมัติแล้ว': '#10b981',
          'ยกเลิก': '#ef4444'
      };
      const statusIcons = {
          'รออนุมัติ': '⏳',
          'อนุมัติแล้ว': '✅',
          'ยกเลิก': '❌'
      };
      
      const color = statusColors[newStatus] || '#000000';
      const icon = statusIcons[newStatus] || '';
      
      const flexMessage = {
        to: lineUid,
        messages: [
          {
            type: "flex",
            altText: \`อัปเดตคำสั่งซื้อของคุณ: \${newStatus}\`,
            contents: {
              type: "bubble",
              size: "mega",
              header: {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: "อัปเดตคำสั่งซื้อ",
                    color: "#ffffff",
                    weight: "bold",
                    size: "md"
                  }
                ],
                backgroundColor: color,
                paddingAll: "12px"
              },
              body: {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: order.courseName || "บริการ/สินค้า",
                    weight: "bold",
                    size: "xl",
                    wrap: true,
                    margin: "md"
                  },
                  {
                    type: "image",
                    url: \`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=\${order.orderNo || order.id}\`,
                    size: "xl",
                    aspectRatio: "1:1",
                    margin: "md"
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    margin: "lg",
                    spacing: "sm",
                    contents: [
                      {
                        type: "box",
                        layout: "baseline",
                        spacing: "sm",
                        contents: [
                          { type: "text", text: "สถานะ", color: "#aaaaaa", size: "sm", flex: 2 },
                          { type: "text", text: \`\${icon} \${newStatus}\`, wrap: true, color: color, size: "sm", flex: 5, weight: "bold" }
                        ]
                      },
                      {
                        type: "box",
                        layout: "baseline",
                        spacing: "sm",
                        contents: [
                          { type: "text", text: "รหัสคำสั่งซื้อ", color: "#aaaaaa", size: "sm", flex: 2 },
                          { type: "text", text: String(order.orderNo || '-'), wrap: true, color: "#666666", size: "sm", flex: 5 }
                        ]
                      },
                      {
                        type: "box",
                        layout: "baseline",
                        spacing: "sm",
                        contents: [
                          { type: "text", text: "ราคา", color: "#aaaaaa", size: "sm", flex: 2 },
                          { type: "text", text: \`฿\${order.price || '0'}\`, wrap: true, color: "#666666", size: "sm", flex: 5 }
                        ]
                      }
                    ]
                  }
                ]
              }
            }
          }
        ]
      };

      try {
          await fetch('https://asia-southeast1-iris-clinic-app.cloudfunctions.net/lineProxy', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${LINE_TOKEN}\` },
              body: JSON.stringify(flexMessage)
          });
      } catch (error) {
          console.error("Failed to send LINE notification", error);
      }
  };
`;

const targetIndex = content.indexOf('  const updateBookingStatus = async (bookingId, newStatus) => {');
if (targetIndex !== -1) {
  content = content.slice(0, targetIndex) + orderNotificationCode + '\n' + content.slice(targetIndex);
}

// 2. Add to executeApproveOrder
content = content.replace(
  "await updateDoc(getDocRef('orders', order.id), { status: 'อนุมัติแล้ว' });\n        showToast('อนุมัติคำสั่งซื้อ สร้างคอร์ส และเพิ่มยอดสะสมสำเร็จ!');",
  "await updateDoc(getDocRef('orders', order.id), { status: 'อนุมัติแล้ว' });\n        showToast('อนุมัติคำสั่งซื้อ สร้างคอร์ส และเพิ่มยอดสะสมสำเร็จ!');\n        const targetCustomer = customersRaw.find(c => String(getFuzzyKey(c, [\"เบอร์โทร\", \"col_3\"]) || '') === String(order.customerPhone || ''));\n        if (targetCustomer && targetCustomer.lineUid) sendOrderLineNotification(order, 'อนุมัติแล้ว', targetCustomer.lineUid);"
);

// 3. Add to handleOrderStatusChange
content = content.replace(
  "else { try { await updateDoc(getDocRef('orders', order.id), { status: newStatus }); showToast(`เปลี่ยนสถานะเป็น \"${newStatus}\"`); } catch (err) { showToast('ข้อผิดพลาด: ' + err.message); } }",
  "else { try { await updateDoc(getDocRef('orders', order.id), { status: newStatus }); showToast(`เปลี่ยนสถานะเป็น \"${newStatus}\"`); const targetCustomer = customersRaw.find(c => String(getFuzzyKey(c, [\"เบอร์โทร\", \"col_3\"]) || '') === String(order.customerPhone || '')); if (targetCustomer && targetCustomer.lineUid) sendOrderLineNotification(order, newStatus, targetCustomer.lineUid); } catch (err) { showToast('ข้อผิดพลาด: ' + err.message); } }"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patched order notifications!');
