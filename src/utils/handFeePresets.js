import { Droplet, Zap, Target } from 'lucide-react';

// 🌟 รายการมาตรฐานที่ได้ค่ามือพนักงาน (DF บริการ) - กดสิว, IPL/เลเซอร์, จี้ไฝ
export const HAND_FEE_PRESETS = [
  { id: 'acne_extraction', name: 'กดสิว', fee: 10, icon: Droplet, desc: 'เคลียร์สิวอุดตัน สิวเสี้ยน (10 บ.)' },
  { id: 'laser_ipl', name: 'IPL / เลเซอร์', isBillCalculated: true, icon: Zap, desc: 'คำนวณตามบิล (10-20%)' },
  { id: 'mole_removal', name: 'จี้ไฝ / กระ / ติ่งเนื้อ', isBillCalculated: true, icon: Target, desc: 'คำนวณตามบิล (10-20%)' }
];

