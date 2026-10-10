export const LINE_TOKEN = 'ZETupyqjlJyWxas+yaTBSDuGIkZKAwd8B6bWsZhmqfC+A00I/9LfZm8fSu31l8buhDOZbJhCivLyWiTVsxCZvOmAB0wmAYf4Q+t2jad/G1ZIzmnfo66k79bG6W9QQJIZcJxWuPEj9K5QAQKlVlXSbgdB04t89/1O/w1cDnyilFU=';

const sendToProxy = async (flexMessage) => {
    try {
        await fetch('https://asia-southeast1-iris-clinic-app.cloudfunctions.net/lineProxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${LINE_TOKEN}` },
            body: JSON.stringify(flexMessage)
        });
    } catch (error) {
        console.error("Failed to send LINE notification", error);
    }
};

// 1. Order / POS Notification (Legacy & Standard)
export const sendOrderLineNotification = async (order, newStatus, lineUid) => {
    if (!lineUid) return;
    
    const statusColors = {
        'รอชำระเงิน': '#64748b', 'รอตรวจสอบ': '#f59e0b', 'รอดำเนินการ': '#f59e0b', 'รอประเมินราคา': '#f59e0b',
        'ชำระเงินแล้ว': '#10b981', 'ยกเลิก': '#ef4444', 'อนุมัติแล้ว': '#10b981', 'สำเร็จ (ชำระแล้ว)': '#10b981'
    };

    const statusIcons = {
        'รอชำระเงิน': '💳', 'รอตรวจสอบ': '⏳', 'รอดำเนินการ': '⏳', 'รอประเมินราคา': '💰',
        'ชำระเงินแล้ว': '✅', 'ยกเลิก': '❌', 'อนุมัติแล้ว': '✅', 'สำเร็จ (ชำระแล้ว)': '✅'
    };
    
    const color = statusColors[newStatus] || '#000000';
    const icon = statusIcons[newStatus] || '🔔';
    
    let itemBoxes = [];
    if (order.cartItems && order.cartItems.length > 0) {
        itemBoxes = order.cartItems.map((item, idx) => ({
           type: "box", layout: "horizontal", margin: idx === 0 ? "none" : "md", spacing: "md",
           contents: [
              ...(item.image || item.imageUrl || (item.originalItem && item.originalItem.imageUrl) ? [{
                 type: "image", url: item.image || item.imageUrl || (item.originalItem && item.originalItem.imageUrl),
                 size: "xs", aspectRatio: "1:1", flex: 1, gravity: "center"
              }] : [{ type: "box", layout: "vertical", flex: 1, contents: [{ type: "filler" }] }]),
              {
                 type: "box", layout: "vertical", flex: 4, justifyContent: "center",
                 contents: [
                    { type: "text", text: String(item.name || 'สินค้า'), size: "sm", weight: "bold", wrap: true, color: "#333333" },
                    { type: "text", text: `จำนวน: ${item.qty || 1}`, size: "xs", color: "#888888" }
                 ]
              }
           ]
        }));
    } else if (order.courseName || order.itemName) {
        itemBoxes = [{
           type: "box", layout: "horizontal", margin: "none",
           contents: [{
                 type: "box", layout: "vertical", justifyContent: "center",
                 contents: [{ type: "text", text: String(order.courseName || order.itemName), size: "sm", weight: "bold", wrap: true, color: "#333333" }]
           }]
        }];
    } else {
        itemBoxes = [{ type: "text", text: "บริการ/สินค้า", size: "sm", color: "#666666" }];
    }

     const flexMessage = {
       to: lineUid,
       messages: [{
           type: "flex", altText: `อัปเดตคำสั่งซื้อของคุณ: ${newStatus}`,
           contents: {
             type: "bubble", size: "mega",
             header: { type: "box", layout: "vertical", contents: [{ type: "text", text: `อัปเดตคำสั่งซื้อ ${icon}`, color: "#ffffff", weight: "bold", size: "md" }], backgroundColor: color, paddingAll: "12px" },
             body: {
               type: "box", layout: "vertical",
               contents: [
                 { type: "text", text: order.courseName || order.itemName ? (order.courseName || order.itemName) : "รายละเอียดคำสั่งซื้อ", weight: "bold", size: "xl", wrap: true, margin: "md" },
                 { type: "image", url: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${order.orderNo || order.id}`, size: "xl", aspectRatio: "1:1", margin: "md" },
                 { type: "box", layout: "vertical", margin: "lg", spacing: "sm",
                   contents: [
                     { type: "box", layout: "baseline", spacing: "sm", contents: [{ type: "text", text: "รหัสออเดอร์", color: "#aaaaaa", size: "sm", flex: 2 }, { type: "text", text: String(order.orderNo || order.id).substring(0, 8).toUpperCase(), wrap: true, color: "#666666", size: "sm", flex: 5 }] },
                     { type: "box", layout: "baseline", spacing: "sm", contents: [{ type: "text", text: "สถานะ", color: "#aaaaaa", size: "sm", flex: 2 }, { type: "text", text: newStatus, wrap: true, color: color, weight: "bold", size: "sm", flex: 5 }] },
                     { type: "box", layout: "baseline", spacing: "sm", contents: [{ type: "text", text: "ยอดสุทธิ", color: "#aaaaaa", size: "sm", flex: 2 }, { type: "text", text: `฿${(Number(order.totalPrice || order.price || order.itemPrice || 0)).toLocaleString()}`, wrap: true, color: "#666666", size: "sm", flex: 5 }] }
                   ]
                 },
                 { type: "separator", margin: "xl" },
                 { type: "box", layout: "vertical", margin: "md", spacing: "sm", contents: itemBoxes }
               ]
             }
           }
         }
       ]
     };
     await sendToProxy(flexMessage);
};

// 2. Booking Notification
export const sendBookingLineNotification = async (booking, status, lineUid) => {
    if (!lineUid) return;

    const colors = { 'รอการยืนยัน': '#f59e0b', 'ยืนยันแล้ว': '#10b981', 'ยกเลิก': '#ef4444', 'เสร็จสิ้น': '#3b82f6' };
    const icons = { 'รอการยืนยัน': '📅', 'ยืนยันแล้ว': '✅', 'ยกเลิก': '❌', 'เสร็จสิ้น': '🌟' };
    const color = colors[status] || '#64748b';
    const icon = icons[status] || '🔔';
    const branchName = booking.branch?.replace(/^สาขา/, '').trim() || 'สำนักงานใหญ่';
    const dateTimeStr = booking.dateTime ? new Date(booking.dateTime).toLocaleString('th-TH') : `${booking.date} ${booking.time} น.`;

    const flexMessage = {
       to: lineUid,
       messages: [{
           type: "flex", altText: `แจ้งเตือนการจองคิว: ${status}`,
           contents: {
             type: "bubble", size: "mega",
             header: { type: "box", layout: "vertical", contents: [{ type: "text", text: `อัปเดตการจองคิว ${icon}`, color: "#ffffff", weight: "bold", size: "md" }], backgroundColor: color, paddingAll: "12px" },
             body: {
               type: "box", layout: "vertical",
               contents: [
                 { type: "text", text: String(booking.courseName || booking.serviceName || 'บริการทั่วไป'), weight: "bold", size: "xl", wrap: true, margin: "md" },
                 { type: "box", layout: "vertical", margin: "lg", spacing: "sm",
                   contents: [
                     { type: "box", layout: "baseline", spacing: "sm", contents: [{ type: "text", text: "วัน-เวลา", color: "#aaaaaa", size: "sm", flex: 2 }, { type: "text", text: dateTimeStr, wrap: true, color: "#666666", weight: "bold", size: "sm", flex: 5 }] },
                     { type: "box", layout: "baseline", spacing: "sm", contents: [{ type: "text", text: "สาขา", color: "#aaaaaa", size: "sm", flex: 2 }, { type: "text", text: branchName, wrap: true, color: "#666666", size: "sm", flex: 5 }] },
                     { type: "box", layout: "baseline", spacing: "sm", contents: [{ type: "text", text: "สถานะ", color: "#aaaaaa", size: "sm", flex: 2 }, { type: "text", text: status, wrap: true, color: color, weight: "bold", size: "sm", flex: 5 }] }
                   ]
                 }
               ]
             }
           }
       }]
    };
    await sendToProxy(flexMessage);
};

// 3. POS Checkout / E-Receipt Notification
export const sendPOSCheckoutNotification = async (receipt, lineUid) => {
    if (!lineUid) return;

    let itemBoxes = [];
    if (receipt.items && receipt.items.length > 0) {
        itemBoxes = receipt.items.map((item, idx) => ({
           type: "box", layout: "horizontal", margin: idx === 0 ? "none" : "md",
           contents: [
              { type: "text", text: String(item.name || item.itemName), size: "sm", color: "#333333", flex: 3, wrap: true },
              { type: "text", text: `x${item.qty || 1}`, size: "sm", color: "#888888", flex: 1, align: "center" },
              { type: "text", text: `฿${Number(item.price || item.totalPrice || 0).toLocaleString()}`, size: "sm", color: "#333333", flex: 2, align: "end" }
           ]
        }));
    }

    const flexMessage = {
       to: lineUid,
       messages: [{
           type: "flex", altText: `ขอบคุณที่ใช้บริการ ใบเสร็จรับเงิน ${receipt.receiptNo || 'ใหม่'}`,
           contents: {
             type: "bubble", size: "mega",
             header: { type: "box", layout: "vertical", contents: [{ type: "text", text: `ชำระเงินสำเร็จ ✅`, color: "#ffffff", weight: "bold", size: "md" }], backgroundColor: "#10b981", paddingAll: "12px" },
             body: {
               type: "box", layout: "vertical",
               contents: [
                 { type: "text", text: "IRIS Clinic", weight: "bold", size: "xl", margin: "sm", align: "center", color: "#0d9488" },
                 { type: "text", text: "E-Receipt", size: "xs", align: "center", color: "#aaaaaa" },
                 { type: "separator", margin: "md" },
                 { type: "box", layout: "vertical", margin: "md", spacing: "sm",
                   contents: [
                     { type: "box", layout: "horizontal", contents: [{ type: "text", text: "เลขที่", size: "xs", color: "#aaaaaa" }, { type: "text", text: String(receipt.receiptNo || receipt.id || ''), size: "xs", align: "end", color: "#666666" }] },
                     { type: "box", layout: "horizontal", contents: [{ type: "text", text: "วันที่", size: "xs", color: "#aaaaaa" }, { type: "text", text: new Date().toLocaleString('th-TH'), size: "xs", align: "end", color: "#666666" }] }
                   ]
                 },
                 { type: "separator", margin: "md" },
                 { type: "box", layout: "vertical", margin: "md", spacing: "sm", contents: itemBoxes },
                 { type: "separator", margin: "md" },
                 { type: "box", layout: "vertical", margin: "md", spacing: "sm",
                   contents: [
                     { type: "box", layout: "horizontal", contents: [{ type: "text", text: "ยอดรวม", size: "sm", color: "#666666" }, { type: "text", text: `฿${Number(receipt.totalAmount || 0).toLocaleString()}`, size: "sm", align: "end", color: "#666666" }] },
                     { type: "box", layout: "horizontal", contents: [{ type: "text", text: "ส่วนลด", size: "sm", color: "#ef4444" }, { type: "text", text: `-฿${Number(receipt.discount || 0).toLocaleString()}`, size: "sm", align: "end", color: "#ef4444" }] },
                     { type: "box", layout: "horizontal", margin: "md", contents: [{ type: "text", text: "ยอดสุทธิ", size: "md", weight: "bold", color: "#10b981" }, { type: "text", text: `฿${Number(receipt.finalAmount || 0).toLocaleString()}`, size: "md", weight: "bold", align: "end", color: "#10b981" }] }
                   ]
                 }
               ]
             }
           }
       }]
    };
    await sendToProxy(flexMessage);
};

// 4. Course Deduction Notification
export const sendCourseDeductionNotification = async (courseName, timesUsed, remaining, lineUid) => {
    if (!lineUid) return;

    const remainingText = remaining > 0 ? `เหลืออีก ${remaining} ครั้ง` : 'ใช้ครบแล้ว';
    const remainingColor = remaining > 0 ? '#10b981' : '#ef4444';

    const flexMessage = {
       to: lineUid,
       messages: [{
           type: "flex", altText: `อัปเดตการใช้คอร์ส: ${courseName}`,
           contents: {
             type: "bubble", size: "mega",
             header: { type: "box", layout: "vertical", contents: [{ type: "text", text: `ตัดคอร์สบริการ ✂️`, color: "#ffffff", weight: "bold", size: "md" }], backgroundColor: "#8b5cf6", paddingAll: "12px" },
             body: {
               type: "box", layout: "vertical",
               contents: [
                 { type: "text", text: String(courseName), weight: "bold", size: "lg", wrap: true, margin: "md", color: "#333333" },
                 { type: "box", layout: "vertical", margin: "lg", spacing: "sm",
                   contents: [
                     { type: "box", layout: "baseline", spacing: "sm", contents: [{ type: "text", text: "ใช้ไป", color: "#aaaaaa", size: "sm", flex: 2 }, { type: "text", text: `${timesUsed} ครั้ง`, color: "#666666", size: "sm", flex: 5 }] },
                     { type: "box", layout: "baseline", spacing: "sm", contents: [{ type: "text", text: "คงเหลือ", color: "#aaaaaa", size: "sm", flex: 2 }, { type: "text", text: remainingText, weight: "bold", color: remainingColor, size: "sm", flex: 5 }] }
                   ]
                 },
                 { type: "text", text: "ขอบคุณที่ไว้วางใจให้เราดูแลความสวยค่ะ 💖", size: "xs", color: "#aaaaaa", wrap: true, margin: "xl", align: "center" }
               ]
             }
           }
       }]
    };
    await sendToProxy(flexMessage);
};

// 5. Reward / Gamification Notification
export const sendRewardLineNotification = async (rewardName, pointsUsed, type, lineUid) => {
    if (!lineUid) return;

    const title = type === 'gamification' ? 'รับรางวัลพิเศษ 🎁' : 'แลกของรางวัลสำเร็จ 🎯';
    const bgColor = type === 'gamification' ? '#f59e0b' : '#ec4899';
    const pointsText = pointsUsed > 0 ? `ใช้ ${pointsUsed} แต้ม` : 'กิจกรรมหมุนวงล้อ';

    const flexMessage = {
       to: lineUid,
       messages: [{
           type: "flex", altText: `แจ้งเตือนรางวัล: ${rewardName}`,
           contents: {
             type: "bubble", size: "mega",
             header: { type: "box", layout: "vertical", contents: [{ type: "text", text: title, color: "#ffffff", weight: "bold", size: "md" }], backgroundColor: bgColor, paddingAll: "12px" },
             body: {
               type: "box", layout: "vertical",
               contents: [
                 { type: "text", text: "ยินดีด้วย!", weight: "bold", size: "xl", color: bgColor, align: "center", margin: "md" },
                 { type: "text", text: "คุณได้รับ", size: "sm", color: "#aaaaaa", align: "center" },
                 { type: "text", text: String(rewardName), weight: "bold", size: "lg", wrap: true, margin: "md", align: "center", color: "#333333" },
                 { type: "separator", margin: "lg" },
                 { type: "box", layout: "vertical", margin: "md", spacing: "sm",
                   contents: [
                     { type: "box", layout: "baseline", spacing: "sm", contents: [{ type: "text", text: "ประเภท", color: "#aaaaaa", size: "sm", flex: 2 }, { type: "text", text: pointsText, color: "#666666", size: "sm", flex: 5 }] }
                   ]
                 },
                 { type: "text", text: "กรุณาแสดงหน้าจอให้พนักงานที่สาขาเพื่อรับสิทธิ์ค่ะ", size: "xs", color: "#aaaaaa", wrap: true, margin: "xl", align: "center" }
               ]
             }
           }
       }]
    };
    await sendToProxy(flexMessage);
};
