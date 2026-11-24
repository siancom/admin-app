// 🌟 Iris Clinic Skin AI Intelligence Utility 🌟
// วิเคราะห์ปัญหาผิว จัดลำดับการรักษาตามหลักผิวหนัง (Clinical Priority) และจับคู่คอร์ส/บริการในคลินิก

export const SKIN_ISSUE_PRESETS = [
  { id: 'acne', label: 'สิวอักเสบ/อุดตัน', icon: '🔴', text: 'สิวอักเสบ สิวอุดตัน' },
  { id: 'darkSpots', label: 'ฝ้า/กระ/รอยดำ', icon: '🟤', text: 'ฝ้า กระ จุดด่างดำ' },
  { id: 'dry', label: 'ผิวแห้งขาดน้ำ', icon: '💧', text: 'ผิวแห้ง ขาดน้ำ' },
  { id: 'dull', label: 'ผิวหมองคล้ำ', icon: '✨', text: 'ผิวหมองคล้ำ ไม่สดใส' },
  { id: 'wrinkle', label: 'ริ้วรอย/หย่อนคล้อย', icon: '⚡', text: 'ริ้วรอย ร่องแก้ม' },
  { id: 'pores', label: 'รูขุมขนกว้าง/หน้ามัน', icon: '🕳️', text: 'รูขุมขนกว้าง หน้ามัน' }
];

export function analyzeSkinIssue(text) {
  if (!text || !text.trim()) return null;
  const lower = text.toLowerCase();

  const hasAcne = /สิว|อักเสบ|อุดตัน|หนอง|acne/i.test(lower);
  const hasDarkSpots = /ฝ้า|กระ|รอยดำ|จุดด่างดำ|เม็ดสี|pigment/i.test(lower);
  const hasDry = /แห้ง|ขาดน้ำ|ลอก|แสบ|ขุย|dry|dehydrat/i.test(lower);
  const hasDull = /หมอง|คล้ำ|ไม่สดใส|ดำ|แดด|dull/i.test(lower);
  const hasWrinkle = /ริ้วรอย|เหี่ยวย่น|ตีนกา|ร่องแก้ม|หย่อนคล้อย|wrinkle|aging/i.test(lower);
  const hasPores = /รูขุมขน|กว้าง|มัน|pore|oil/i.test(lower);

  const priorities = [];
  const courses = [];
  let primaryPhase = '';

  // 1. สงบสิว & เคลียร์การอักเสบก่อนอันดับแรก (ห้ามยิงเลเซอร์หรือขัดลอกผิวขณะอักเสบ)
  if (hasAcne) {
    primaryPhase = 'สงบสิว & เคลียร์การอักเสบ';
    priorities.push({
      phase: 'เฟส 1: สงบสิว & ลดการอักเสบ',
      icon: '🎯',
      badge: 'ต้องทำก่อนอันดับแรก',
      tip: 'เคลียร์หัวสิวอุดตันและลดการอักเสบก่อน ห้ามขัดลอกผิวรุนแรงหรือยิงเลเซอร์ทับสิวอักเสบ'
    });
    courses.push({
      code: 'F-C',
      name: '[C] เคลียร์สิวครบขั้นตอน',
      shortName: 'เคลียร์สิว C',
      tag: 'ตรงจุดสิว',
      highlight: 'กดสิว + โอโซน + มาร์คคาเวียร์ + ไครโอ LED',
      searchKey: 'เคลียร์สิว'
    });
    courses.push({
      code: 'DF-ACNE',
      name: 'กดสิวเคลียร์อุดตัน',
      shortName: 'กดสิว 10.-',
      tag: 'ทำทันที',
      highlight: 'เคลียร์หัวสิวทั่วใบหน้า ลดโอกาสสิวอักเสบลุกลาม',
      searchKey: 'กดสิว'
    });
  }

  // 2. เติมน้ำ ปลอบประโลมผิว เสริมเกราะป้องกัน
  if (hasDry) {
    if (!primaryPhase) primaryPhase = 'เสริมเกราะป้องกันผิว & เติมน้ำ';
    priorities.push({
      phase: hasAcne ? 'เฟส 2: เติมน้ำปลอบประโลมผิว' : 'เฟส 1: เสริมเกราะป้องกันผิว (Skin Barrier)',
      icon: '💧',
      badge: 'ฟื้นฟูผิวแข็งแรง',
      tip: 'เติมความชุ่มชื้นลึกด้วยไฮยาลูรอนิก ลดอาการแสบ แดง ลอก เพื่อให้ผิวพร้อมรับสารบำรุง'
    });
    courses.push({
      code: 'F-HYA',
      name: 'ทรีทเม้นท์ไฮยาเติมน้ำ & มาร์คบำรุงลึก',
      shortName: 'ทรีทเม้นท์ไฮยา',
      tag: 'ชุ่มชื้นเร่งด่วน',
      highlight: 'ผลักไฮยาเข้มข้น + ไครโอเย็น ล็อคความชุ่มชื้น',
      searchKey: 'ทรีทเม้นท์'
    });
  }

  // 3. ลดฝ้า กระ จุดด่างดำ
  if (hasDarkSpots) {
    if (!primaryPhase) primaryPhase = 'ลดเลือนฝ้า กระ รอยดำ';
    priorities.push({
      phase: hasAcne ? 'เฟส 2: จัดการเม็ดสี & ฝ้ากระ' : 'เฟส 1: จัดการเม็ดสี & ฝ้ากระ',
      icon: '✨',
      badge: 'ตรงจุดเม็ดสี',
      tip: 'ยับยั้งเม็ดสีเมลานิน แนะนำทำห่างจากการผลัดเซลล์ และทากันแดด SPF50+ เป็นประจำทุกวัน'
    });
    courses.push({
      code: 'IPL-SPOT',
      name: 'IPL กำจัดเม็ดสี & รอยดำ',
      shortName: 'IPL รอยดำ/ฝ้า',
      tag: 'ลดเม็ดสี',
      highlight: 'แสงพลังงานสลายเม็ดสีเข้ม กระตุ้นผิวกระจ่างใส',
      searchKey: 'IPL'
    });
    courses.push({
      code: 'F-J',
      name: '[J] ซุปเปอร์ไวท์ผลักวิตามินหน้าใส',
      shortName: 'ซุปเปอร์ไวท์ J',
      tag: 'บำรุงลึก',
      highlight: 'ผลักวิตามินอนุภาคเล็ก ลดรอยดำ ปรับสีผิวสม่ำเสมอ',
      searchKey: 'ซุปเปอร์ไวท์'
    });
  }

  // 4. ผิวหมองคล้ำ ผลัดเซลล์
  if (hasDull && !hasDarkSpots) {
    if (!primaryPhase) primaryPhase = 'ผลัดเซลล์ & ผิวกระจ่างใส';
    priorities.push({
      phase: 'เฟส 1: ผลัดเซลล์ & ผิวกระจ่างใส',
      icon: '🌿',
      badge: 'หน้าใสกระจ่าง',
      tip: 'ขจัดเซลล์ผิวเก่าที่เสื่อมสภาพอย่างอ่อนโยน ช่วยให้ผิวดูดซับสารบำรุงได้ดียิ่งขึ้น'
    });
    courses.push({
      code: 'F-A',
      name: '[A] นวดหน้าใสครบขั้นตอน',
      shortName: 'นวดหน้าใส A',
      tag: 'ยอดนิยม',
      highlight: 'ปรนนิบัติผิว + ขัดหน้าขาว + ไครโอเย็น + มาร์ค',
      searchKey: 'นวดหน้าใส'
    });
    courses.push({
      code: 'F-F',
      name: '[F] นาโนไวท์ผลักวิตามินหน้าใส',
      shortName: 'นาโนไวท์ F',
      tag: 'ผิวออร่า',
      highlight: 'นาโนไวท์ผลักวิตามินเข้มข้น ผิวเนียนนุ่มทันที',
      searchKey: 'นาโนไวท์'
    });
  }

  // 5. ริ้วรอย ร่องแก้ม รูขุมขน
  if (hasWrinkle || hasPores) {
    if (!primaryPhase) primaryPhase = 'กระตุ้นคอลลาเจน & ยกกระชับ';
    priorities.push({
      phase: 'กระตุ้นคอลลาเจน & ยกกระชับผิว',
      icon: '🔮',
      badge: 'ชะลอวัย & ผิวกระชับ',
      tip: 'กระตุ้นการสร้างคอลลาเจนและอิลาสติน คืนความยืดหยุ่นและกระชับรูขุมขน'
    });
    courses.push({
      code: 'F-D',
      name: '[D] เมโสยกกระชับหน้าใส',
      shortName: 'เมโสยกกระชับ D',
      tag: 'ลดริ้วรอย',
      highlight: 'เมโสผลักวิตามิน + มาร์คโบทิวคลดริ้วรอย',
      searchKey: 'เมโสยกกระชับ'
    });
  }

  // Fallback if generic or other
  if (priorities.length === 0) {
    primaryPhase = 'ปรนนิบัติ & บำรุงผิว';
    priorities.push({
      phase: 'การดูแลและบำรุงผิวหน้าเฉพาะบุคคล',
      icon: '🌸',
      badge: 'ดูแลผิว',
      tip: 'ตรวจเช็คสภาพผิวและเลือกโปรแกรมทรีทเม้นท์ที่เหมาะสมกับความต้องการของลูกค้า'
    });
    courses.push({
      code: 'F-A',
      name: '[A] นวดหน้าใสครบขั้นตอน',
      shortName: 'นวดหน้าใส A',
      tag: 'มาตรฐาน',
      highlight: 'นวดปรนนิบัติ + ผลักวิตามินบำรุงผิวหน้าใส',
      searchKey: 'นวดหน้าใส'
    });
  }

  return {
    primaryPhase,
    priorities,
    courses,
    summaryText: `AI แนะนำ: ${courses.map(c => c.shortName).join(' + ')} (${primaryPhase})`
  };
}

