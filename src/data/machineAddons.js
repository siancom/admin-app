// รายการลงเครื่องรายครั้ง / บริการเสริมพิเศษ (Facial Innovation & Machine Treatments)
// อ้างอิงจากโบรชัวร์คลินิก: เริ่มต้นเพียง 100.- เครื่องแท้ ปลอดภัย มาตรฐานคลินิก
// มีตัวเลือกแพ็กเกจ 1 ครั้ง, 3 ครั้ง, 5 ครั้ง, 10 ครั้ง ราคาพิเศษดึงดูดใจ
export const MACHINE_TREATMENT_ADDONS = [
  {
    id: 'addon-scrubber',
    code: 'MACH-01',
    name: 'สกินสครับเบอร์',
    price: 100,
    desc: 'ผลัดเซลล์ผิวเก่า ขจัดสิวเสี้ยนและสิ่งอุดตัน',
    category: 'ลงเครื่อง',
    tag: 'เริ่มต้น 100.-',
    badge: '100.-',
    packages: { 1: 100, 3: 270, 5: 420, 10: 790 },
    image: 'https://firebasestorage.googleapis.com/v0/b/iris-clinic-app.firebasestorage.app/o/master_courses%2FOTyrloJeB8WU6ooyuJQg_1795319858255.jpg?alt=media&token=d9f9f9c9-913c-4b44-836e-2c020b251d33'
  },
  {
    id: 'addon-ozone',
    code: 'MACH-02',
    name: 'โอโซนร้อน/เย็น',
    price: 150,
    desc: 'เปิด-กระชับรูขุมขน ขับสิ่งสกปรก ดีท็อกซ์ผิว',
    category: 'ลงเครื่อง',
    badge: '150.-',
    packages: { 1: 150, 3: 390, 5: 590, 10: 1090 },
    image: 'https://firebasestorage.googleapis.com/v0/b/iris-clinic-app.firebasestorage.app/o/master_courses%2F1795316049585_%E0%B9%82%E0%B8%AD%E0%B9%82%E0%B8%A7%E0%B8%99%E0%B8%A3%E0%B9%89%E0%B8%AD%E0%B8%99%E0%B9%80%E0%B8%A2%E0%B9%87%E0%B8%99.png?alt=media&token=ddeb4aaf-b05f-4bbe-9703-6f5fb540d02c'
  },
  {
    id: 'addon-acne-suction',
    code: 'MACH-03',
    name: 'ดูดสิวเสี้ยน',
    price: 200,
    desc: 'ดูดสิวเสี้ยนและสิ่งสกปรก อุดตันด้วยระบบสุญญากาศ',
    category: 'ลงเครื่อง',
    badge: '200.-',
    packages: { 1: 200, 3: 500, 5: 790, 10: 1490 },
    image: 'https://firebasestorage.googleapis.com/v0/b/iris-clinic-app.firebasestorage.app/o/master_courses%2FpEQpzJG8x2Sh60wte0XD_1795319821381.jpg?alt=media&token=d81c2d6f-28ad-4321-844f-f39903a243ce'
  },
  {
    id: 'addon-meso-vit',
    code: 'MACH-04',
    name: 'เมโสผลักวิตามิน',
    price: 200,
    desc: 'เติมวิตามินลึกสู่ชั้นผิว รอบดวงตาอย่างอ่อนโยน',
    category: 'ลงเครื่อง',
    badge: '200.-',
    packages: { 1: 200, 3: 500, 5: 790, 10: 1490 },
    image: 'https://firebasestorage.googleapis.com/v0/b/iris-clinic-app.firebasestorage.app/o/master_courses%2FPFfsUFavAcsrRYEeZm3a_1795319866972.jpg?alt=media&token=293f8eb5-8359-4323-9e14-7681f42a959d'
  },
  {
    id: 'addon-phono-vit',
    code: 'MACH-05',
    name: 'โฟโนผลักวิตามิน',
    price: 200,
    desc: 'คลื่นเสียงผลักอาหารผิว ผิวเนียนนุ่ม ชุ่มชื้น',
    category: 'ลงเครื่อง',
    badge: '200.-',
    packages: { 1: 200, 3: 500, 5: 790, 10: 1490 },
    image: 'https://firebasestorage.googleapis.com/v0/b/iris-clinic-app.firebasestorage.app/o/master_courses%2FOjdLX9Tar5X45SXgsQWD_1795319812015.jpg?alt=media&token=85d488f2-cf28-4533-b5fc-a3bc3d4c29a0'
  },
  {
    id: 'addon-rf-lifting',
    code: 'MACH-06',
    name: 'RF ยกกระชับ',
    price: 200,
    desc: 'กระตุ้นคอลลาเจน ยกกระชับกรอบหน้าและแก้ม',
    category: 'ลงเครื่อง',
    badge: '200.-',
    packages: { 1: 200, 3: 500, 5: 790, 10: 1490 },
    image: 'https://firebasestorage.googleapis.com/v0/b/iris-clinic-app.firebasestorage.app/o/master_courses%2Fx4kiVTLcHbqCVBMSUuEP_1795319427371.jpg?alt=media&token=bb2f1758-0c9d-4d6e-916e-975d7914fec8'
  },
  {
    id: 'addon-cryo-spa',
    code: 'MACH-07',
    name: 'ไครโอเย็น (สปาเย็น)',
    price: 200,
    desc: 'ปลอบประโลมผิว ลดรอยแดง กระชับรูขุมขนล้ำลึก',
    category: 'ลงเครื่อง',
    tag: 'ยอดนิยม',
    badge: '200.-',
    packages: { 1: 200, 3: 500, 5: 790, 10: 1490 },
    image: 'https://firebasestorage.googleapis.com/v0/b/iris-clinic-app.firebasestorage.app/o/master_courses%2Fw6UEQnEdXLYpyVljmiJZ_1795319805610.jpg?alt=media&token=6d6d3e6c-b614-4fe5-90d1-190bee4fe3a8'
  },
  {
    id: 'addon-soft-laser',
    code: 'MACH-08',
    name: 'ซอฟเลเซอร์',
    price: 200,
    desc: 'ฟื้นฟูเซลล์ผิว ลดรอยสิวและจุดด่างดำ',
    category: 'ลงเครื่อง',
    badge: '200.-',
    packages: { 1: 200, 3: 500, 5: 790, 10: 1490 },
    image: 'https://firebasestorage.googleapis.com/v0/b/iris-clinic-app.firebasestorage.app/o/master_courses%2FeajiWKjZthmhxiTCqbU8_1795319418601.jpg?alt=media&token=ded59138-9375-4d93-80ab-d1dc47af3078'
  },
  {
    id: 'addon-led-light',
    code: 'MACH-09',
    name: 'แสงบำบัด (LED)',
    price: 200,
    desc: 'แสงบำบัดฟื้นฟูผิว ลดสิวอักเสบและริ้วรอย',
    category: 'ลงเครื่อง',
    badge: '200.-',
    packages: { 1: 200, 3: 500, 5: 790, 10: 1490 },
    image: 'https://firebasestorage.googleapis.com/v0/b/iris-clinic-app.firebasestorage.app/o/master_courses%2FXnsdxLet3CZ2naXDYKSE_1795319405898.jpg?alt=media&token=fb76b548-2fee-4dc7-9481-54c550e5a616'
  },
  {
    id: 'addon-rid-pigment',
    code: 'MACH-11',
    name: 'รีดพิกเม้น',
    price: 250,
    desc: 'สลายเม็ดสี ลดฝ้า กระ จุดด่างดำเฉพาะจุด',
    category: 'ลงเครื่อง',
    badge: '250.-',
    packages: { 1: 250, 3: 650, 5: 990, 10: 1790 },
    image: 'https://firebasestorage.googleapis.com/v0/b/iris-clinic-app.firebasestorage.app/o/master_courses%2FLqxTOoVoZy1LBaV0lBbf_1795320332417.jpg?alt=media&token=07954c57-dbe7-4b11-858b-44b9dbac53e0'
  },
  {
    id: 'addon-nano-white',
    code: 'MACH-12',
    name: 'นาโนไวท์',
    price: 300,
    desc: 'ผลักเซรั่มบำรุงผิวขาวใส คล้าย BB Glow หน้าฉ่ำวาว',
    category: 'ลงเครื่อง',
    tag: 'หน้าฉ่ำวาว',
    badge: '300.-',
    packages: { 1: 300, 3: 790, 5: 1190, 10: 2190 },
    image: 'https://firebasestorage.googleapis.com/v0/b/iris-clinic-app.firebasestorage.app/o/master_courses%2FbmotIdz04aEOKhk4K2UQ_1795320324274.jpg?alt=media&token=13c788f6-6166-47f5-9391-0304e830ca14'
  },
  {
    id: 'addon-acne-clear',
    code: 'MACH-13',
    name: 'กดสิว',
    price: 200,
    desc: 'เคลียร์สิวอุดตันอย่างถูกวิธี ลดการอักเสบ',
    category: 'ลงเครื่อง',
    badge: '200.-',
    packages: { 1: 200, 3: 500, 5: 790, 10: 1490 },
    image: 'https://firebasestorage.googleapis.com/v0/b/iris-clinic-app.firebasestorage.app/o/master_courses%2FSVjAJklApFxkp3HM4fZS_1795320204825.jpg?alt=media&token=b9f4181a-9763-4048-8235-453e47b381ab'
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
