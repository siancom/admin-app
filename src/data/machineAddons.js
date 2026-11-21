// รายการลงเครื่องรายครั้ง / บริการเสริมพิเศษ (Facial Innovation & Machine Treatments)
// อ้างอิงจากโบรชัวร์คลินิก: เริ่มต้นเพียง 100.- เครื่องแท้ ปลอดภัย มาตรฐานคลินิก
export const MACHINE_TREATMENT_ADDONS = [
  {
    id: 'addon-scrubber',
    name: 'สกินสครับเบอร์',
    price: 100,
    desc: 'ผลัดเซลล์ผิวเก่า ขจัดสิวเสี้ยนและสิ่งอุดตัน',
    category: 'ลงเครื่อง',
    tag: 'เริ่มต้น 100.-'
  },
  {
    id: 'addon-ozone',
    name: 'โอโซนร้อน/เย็น',
    price: 150,
    desc: 'เปิด-กระชับรูขุมขน ขับสิ่งสกปรก ดีท็อกซ์ผิว',
    category: 'ลงเครื่อง'
  },
  {
    id: 'addon-acne-suction',
    name: 'ดูดสิวเสี้ยน',
    price: 200,
    desc: 'ดูดสิวเสี้ยนและสิ่งสกปรก อุดตันด้วยระบบสุญญากาศ',
    category: 'ลงเครื่อง'
  },
  {
    id: 'addon-meso-vit',
    name: 'เมโสผลักวิตามิน',
    price: 200,
    desc: 'เติมวิตามินลึกสู่ชั้นผิว รอบดวงตาอย่างอ่อนโยน',
    category: 'ลงเครื่อง'
  },
  {
    id: 'addon-phono-vit',
    name: 'โฟโนผลักวิตามิน',
    price: 200,
    desc: 'คลื่นเสียงผลักอาหารผิว ผิวเนียนนุ่ม ชุ่มชื้น',
    category: 'ลงเครื่อง'
  },
  {
    id: 'addon-rf-lifting',
    name: 'RF ยกกระชับ',
    price: 200,
    desc: 'กระตุ้นคอลลาเจน ยกกระชับกรอบหน้าและแก้ม',
    category: 'ลงเครื่อง'
  },
  {
    id: 'addon-cryo-spa',
    name: 'ไครโอเย็น (สปาเย็น)',
    price: 200,
    desc: 'ปลอบประโลมผิว ลดรอยแดง กระชับรูขุมขนล้ำลึก',
    category: 'ลงเครื่อง',
    tag: 'ยอดนิยม'
  },
  {
    id: 'addon-soft-laser',
    name: 'ซอฟเลเซอร์',
    price: 200,
    desc: 'ฟื้นฟูเซลล์ผิว ลดรอยสิวและจุดด่างดำ',
    category: 'ลงเครื่อง'
  },
  {
    id: 'addon-led-light',
    name: 'แสงบำบัด (LED)',
    price: 200,
    desc: 'แสงบำบัดฟื้นฟูผิว ลดสิวอักเสบและริ้วรอย',
    category: 'ลงเครื่อง'
  },
  {
    id: 'addon-rid-pigment',
    name: 'รีดพิกเม้น',
    price: 250,
    desc: 'สลายเม็ดสี ลดฝ้า กระ จุดด่างดำเฉพาะจุด',
    category: 'ลงเครื่อง'
  },
  {
    id: 'addon-nano-white',
    name: 'นาโนไวท์',
    price: 300,
    desc: 'ผลักเซรั่มบำรุงผิวขาวใส คล้าย BB Glow หน้าฉ่ำวาว',
    category: 'ลงเครื่อง',
    tag: 'หน้าฉ่ำวาว'
  },
  {
    id: 'addon-acne-clear',
    name: 'กดสิว',
    price: 200,
    desc: 'เคลียร์สิวอุดตันอย่างถูกวิธี ลดการอักเสบ',
    category: 'ลงเครื่อง'
  }
];

export const STANDARD_FACIAL_SERVICES = [
  { id: 'std-acne-free', name: 'กดสิวฟรี', category: 'พื้นฐาน' },
  { id: 'std-acne-clear', name: 'กดสิว', category: 'พื้นฐาน' },
  { id: 'std-massage', name: 'นวดหน้าใส', category: 'พื้นฐาน' },
  { id: 'std-scrub-white', name: 'ขัดหน้าขาว', category: 'พื้นฐาน' },
  { id: 'std-disinfect', name: 'พอกฆ่าเชื้อสิว', category: 'พื้นฐาน' },
  { id: 'std-mask-white', name: 'มาร์คหน้าขาว', category: 'พื้นฐาน' },
  { id: 'std-mask-redness', name: 'มาร์คลดรอยแดง', category: 'พื้นฐาน' },
  { id: 'std-body-scrub', name: 'สครับตัว', category: 'พื้นฐาน' }
];
