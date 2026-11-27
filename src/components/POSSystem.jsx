import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle,
  Scissors, Search, Info, ShoppingCart, Package, Layers, User, Trash2, UserPlus,
  Sparkles, Check, CheckCircle, Plus, Minus, CreditCard, Banknote, Smartphone, X, Clock, DollarSign, ChevronLeft, ChevronRight, Truck, FileText, Calendar, Camera, Award, Printer, Maximize, Minimize, ScanLine, QrCode, Edit, Ticket, ExternalLink, ScanBarcode, ArrowRight,
  Flame, TrendingUp, Tag, Droplet, Zap, Target, Heart, Edit3, AlertCircle, RefreshCw, PenTool, Eye
} from 'lucide-react';
import { db, getCol } from '../config/firebase';
import { addDoc, updateDoc, doc, getDocs, query, where, writeBatch, orderBy, limit, collection, arrayUnion } from 'firebase/firestore';
import { getFuzzyKey } from '../utils/fuzzy';
import imageCompression from 'browser-image-compression';
import { parseNumber, parseQty, getTotalStock, getBranchStock, getLocalYYYYMMDD, normalizeBranchName } from '../utils/parse';
import { splitCourseAndProductPrice } from '../utils/courseUtils';
import { getProfilePicData, handleProfileImgError } from '../utils/imageUtils';
import { getVipDiscountRate, computeFinalPrice, getOwnerDiscountRate, computeOwnerCostPrice } from '../utils/priceUtils';
import { fetchWithProxy, fetch17Track } from '../utils/wooProxy';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';
import generatePayload from 'promptpay-qr';
import TreatmentJobSlipModal from './TreatmentJobSlipModal';
import RoomManagementBoard from './RoomManagementBoard';
import { sendOrderLineNotification, sendPOSCheckoutNotification, sendCourseDeductionNotification } from '../utils/lineUtils';
import FollowUpPromptModal from './FollowUpPromptModal';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import IShipBookingModal from './IShipBookingModal';
import Barcode128 from './Barcode128';

import SignaturePad from './SignaturePad';
import ShopeeImportModal from './ShopeeImportModal';
import SalesHistoryModal from './SalesHistoryModal';
import ClearMonthlyPosSalesModal from './ClearMonthlyPosSalesModal';
import BarcodeScannerModal from './BarcodeScannerModal';
import MoleRemovalSystem from './MoleRemovalSystem';
import { MACHINE_TREATMENT_ADDONS, STANDARD_FACIAL_SERVICES } from '../data/machineAddons';
import { analyzeSkinIssue } from '../utils/skinAiUtils';

// 🌟 รายการมาตรฐานที่ได้ค่ามือพนักงาน (DF บริการ) - นำพอก/นวดหน้าใส/สปาขัดตัวออกตามคำสั่ง
export const HAND_FEE_PRESETS = [
  { id: 'acne_extraction', name: 'กดสิว', fee: 10, icon: Droplet, desc: 'เคลียร์สิวอุดตัน สิวเสี้ยน (10 บ.)' },
  { id: 'laser_ipl', name: 'IPL / เลเซอร์', isBillCalculated: true, icon: Zap, desc: 'คำนวณตามบิล (10-20%)' },
  { id: 'mole_removal', name: 'จี้ไฝ / กระ / ติ่งเนื้อ', isBillCalculated: true, icon: Target, desc: 'คำนวณตามบิล (10-20%)' }
];

// 🌟 ฟังก์ชันจับคู่ของแถมจากคอร์สกับสินค้าจริงในสต็อกอัตโนมัติ (Auto-match Free Gifts to Inventory Products)
export function findAutoMatchedProduct(giftName, productsList) {
  if (!giftName || !Array.isArray(productsList) || productsList.length === 0) return null;
  const rawName = String(giftName).trim();
  const clean = rawName.toLowerCase().replace(/[\s\-_(),.+/]/g, '');

  // 1. ตรวจสอบชื่อของแถมยอดนิยม & สินค้าโปรโมชั่น
  // แป้งรักแร้ขาว / Deo
  if (clean.includes('รักแร้') || clean.includes('deo') || clean.includes('แป้งรักแร้')) {
    const p = productsList.find(x => {
      const pCode = String(getFuzzyKey(x, ["รหัสสินค้า", "col_1"]) || '').toUpperCase();
      const pName = String(getFuzzyKey(x, ["ชื่อสินค้า", "col_2"]) || '').toLowerCase();
      return pCode === 'P801' || pName.includes('รักแร้ขาว') || (pName.includes('deo') && pName.includes('crystal'));
    });
    if (p) return p;
  }

  // ผงพอก (กระปุก RelaxingPowderMask)
  if (clean.includes('ผงพอก') || clean.includes('relaxingpowder')) {
    const p = productsList.find(x => {
      const pCode = String(getFuzzyKey(x, ["รหัสสินค้า", "col_1"]) || '').toUpperCase();
      const pName = String(getFuzzyKey(x, ["ชื่อสินค้า", "col_2"]) || '').toLowerCase();
      return pCode === 'IQ470006' || pName.includes('ผงพอก(กระปุก)') || pName.includes('relaxingpowder');
    });
    if (p) return p;
  }

  // เจลลดอาการ (Revival Clear Gel)
  if (clean.includes('ลดอาการ') || clean.includes('revivalclear')) {
    const p = productsList.find(x => {
      const pCode = String(getFuzzyKey(x, ["รหัสสินค้า", "col_1"]) || '').toUpperCase();
      const pName = String(getFuzzyKey(x, ["ชื่อสินค้า", "col_2"]) || '').toLowerCase();
      return pCode === 'IQ470009' || pName.includes('ลดอาการเจล') || pName.includes('revival clear');
    });
    if (p) return p;
  }

  // สบู่มินิ (MiniHerbalSoap)
  if (clean.includes('สบู่มินิ') || clean.includes('miniherbal')) {
    const p = productsList.find(x => {
      const pCode = String(getFuzzyKey(x, ["รหัสสินค้า", "col_1"]) || '').toUpperCase();
      const pName = String(getFuzzyKey(x, ["ชื่อสินค้า", "col_2"]) || '').toLowerCase();
      return pCode === 'RTC013' || pName.includes('สบู่มินิ');
    });
    if (p) return p;
  }

  // สบู่ลอก (HerbalSoap)
  if (clean.includes('สบู่ลอก')) {
    const p = productsList.find(x => {
      const pCode = String(getFuzzyKey(x, ["รหัสสินค้า", "col_1"]) || '').toUpperCase();
      const pName = String(getFuzzyKey(x, ["ชื่อสินค้า", "col_2"]) || '').toLowerCase();
      return pCode === 'RTC010' || pName.includes('สบู่ลอก');
    });
    if (p) return p;
  }

  // สบู่เดียว (Clarifying Herbal Soap)
  if (clean.includes('สบู่เดียว')) {
    const p = productsList.find(x => {
      const pCode = String(getFuzzyKey(x, ["รหัสสินค้า", "col_1"]) || '').toUpperCase();
      const pName = String(getFuzzyKey(x, ["ชื่อสินค้า", "col_2"]) || '').toLowerCase();
      return pCode === 'IQ470005' || pName.includes('สบู่เดียว');
    });
    if (p) return p;
  }

  // เซรั่มฟื้นฟู / เซรั่มบำรุง (Revival Serum)
  if (clean.includes('เซรั่มฟื้นฟู') || clean.includes('เซรั่มบำรุง') || clean.includes('revivalserum')) {
    const p = productsList.find(x => {
      const pCode = String(getFuzzyKey(x, ["รหัสสินค้า", "col_1"]) || '').toUpperCase();
      const pName = String(getFuzzyKey(x, ["ชื่อสินค้า", "col_2"]) || '').toLowerCase();
      return pCode === 'RTT021' || pName.includes('เซรั่มฟื้นฟู') || pName.includes('revival serum');
    });
    if (p) return p;
  }

  // เซรั่มโกลด์ / โกด์ล (Absolute Serum)
  if (clean.includes('เซรั่มโกล') || clean.includes('เซรั่มโกด์ล') || clean.includes('absoluteserum')) {
    const p = productsList.find(x => {
      const pCode = String(getFuzzyKey(x, ["รหัสสินค้า", "col_1"]) || '').toUpperCase();
      const pName = String(getFuzzyKey(x, ["ชื่อสินค้า", "col_2"]) || '').toLowerCase();
      return pCode === 'RTT007' || pName.includes('เซรั่มโกล') || pName.includes('เซรั่มโกด์ล');
    });
    if (p) return p;
  }

  // เซรั่มวิตซี (VITC)
  if (clean.includes('วิตซี') || clean.includes('vitc')) {
    const p = productsList.find(x => {
      const pCode = String(getFuzzyKey(x, ["รหัสสินค้า", "col_1"]) || '').toUpperCase();
      const pName = String(getFuzzyKey(x, ["ชื่อสินค้า", "col_2"]) || '').toLowerCase();
      return pCode === 'RTT026' || pName.includes('วิตซี');
    });
    if (p) return p;
  }

  // เจลสิว
  if (clean.includes('เจลสิว')) {
    const p = productsList.find(x => {
      const pCode = String(getFuzzyKey(x, ["รหัสสินค้า", "col_1"]) || '').toUpperCase();
      const pName = String(getFuzzyKey(x, ["ชื่อสินค้า", "col_2"]) || '').toLowerCase();
      return pCode === 'IQ470003' || pName.includes('เจลสิว');
    });
    if (p) return p;
  }

  // เจลฝ้า
  if (clean.includes('เจลฝ้า')) {
    const p = productsList.find(x => {
      const pCode = String(getFuzzyKey(x, ["รหัสสินค้า", "col_1"]) || '').toUpperCase();
      const pName = String(getFuzzyKey(x, ["ชื่อสินค้า", "col_2"]) || '').toLowerCase();
      return pCode === 'IQ470002' || pName.includes('เจลฝ้า');
    });
    if (p) return p;
  }

  // 2. ค้นหาจากรหัสสินค้าที่ระบุในข้อความ
  for (const p of productsList) {
    const pCode = String(getFuzzyKey(p, ["รหัสสินค้า", "col_1"]) || '').trim().toLowerCase();
    if (pCode && pCode.length >= 3 && clean.includes(pCode)) {
      return p;
    }
  }

  // 3. ค้นหาจากชื่อสินค้าที่มีความยาวใกล้เคียงหรือซ้อนทับกัน
  for (const p of productsList) {
    const pName = String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2"]) || '').trim().toLowerCase().replace(/[\s\-_(),.+/]/g, '');
    if (pName && (clean === pName || (pName.length >= 4 && clean.includes(pName)) || (clean.length >= 4 && pName.includes(clean)))) {
      return p;
    }
  }

  return null;
}
const CosmeticsIcon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="4" y="3" width="4" height="4" rx="1" />
    <path d="M3 7h6" />
    <path d="M3 7c0 3 1 14 1 14h4c0 0 1-11 1-14" />
    <rect x="13" y="10" width="8" height="3" rx="1" />
    <path d="M14 13v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-6" />
    <path d="M14 17h6" />
  </svg>
);

const WalkingPersonIcon = ({ size = 18, className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const normProductStr = (s) => String(s || '').toLowerCase().replace(/[\s\-_()（）[\]]/g, '');

export const isServiceOrCourseProduct = (p) => {
  if (!p) return false;
  const name = String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2", "ชื่อ", "name"]) || '').trim();
  const lowerName = name.toLowerCase();
  const category = String(getFuzzyKey(p, ["หมวดหมู่", "หมวด", "category", "type", "ประเภท"]) || '').trim().toLowerCase();

  // Explicit type or category
  if (p.type === 'service' || p.type === 'course' || p.isCourse || p.isService) return true;
  if (category === 'service' || category === 'course' || category.includes('บริการ') || category.includes('คอร์ส') || category.includes('ทรีทเม้นท์')) return true;

  // Single session or treatment add-ons (เช่น "ขัดหน้าขาว 1 ครั้ง", "ขัดหน้าขาว (ซื้อเพิ่มโปร) 1 ครั้ง", "กดสิว 1 ครั้ง")
  if (/\b\d+\s*ครั้ง/i.test(name) || /1\s*ครั้ง/i.test(name) || name.includes('1 ครั้ง') || name.includes('ซื้อเพิ่มโปร')) {
    return true;
  }

  // Common service names that mistakenly appear in product inventory
  if (name.startsWith('ขัดหน้า') || name.startsWith('นวดหน้า') || name.startsWith('ดูดสิว') || name.startsWith('กดสิวเสี้ยน')) {
    return true;
  }

  return false;
};

export const SKINCARE_STEPS = [
  { step: 1, id: 'step_cleanse', label: '1. คลีนซิ่ง & ล้างหน้า', shortLabel: 'ล้างหน้า', icon: '🧼' },
  { step: 2, id: 'step_toner', label: '2. โทนเนอร์ & ปรับสภาพผิว', shortLabel: 'โทนเนอร์', icon: '💧' },
  { step: 3, id: 'step_mask', label: '3. ผลัดเซลล์ / มาร์ค / ผงพอก', shortLabel: 'มาร์ค/พอก', icon: '🧖' },
  { step: 4, id: 'step_eye_lip', label: '4. บำรุงรอบดวงตา & ริมฝีปาก', shortLabel: 'ตา & ปาก', icon: '👁️' },
  { step: 5, id: 'step_serum', label: '5. เซรั่ม & เอสเซ้นส์ฟื้นฟู', shortLabel: 'เซรั่ม', icon: '✨' },
  { step: 6, id: 'step_treatment', label: '6. แต้มสิว & ฝ้าเฉพาะจุด', shortLabel: 'แต้มสิว/ฝ้า', icon: '🎯' },
  { step: 7, id: 'step_cream', label: '7. ครีมบำรุง & คอลลาเจน', shortLabel: 'ครีมบำรุง', icon: '🧴' },
  { step: 8, id: 'step_sunscreen', label: '8. ปกป้องแสงแดด (กันแดด)', shortLabel: 'กันแดด', icon: '☀️' },
  { step: 9, id: 'step_others', label: '9. แป้ง / ผิวกาย & อื่นๆ', shortLabel: 'แป้ง/ผิวกาย', icon: '🌸' },
];

export const getProductSkincareStep = (p) => {
  if (!p) return SKINCARE_STEPS[8];
  const name = String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2", "ชื่อ", "name"]) || '').trim();
  const lower = name.toLowerCase();

  // 1. ผลัดเซลล์ / ผงพอก / ผงเร่ง / ผงทุกชนิด / โคลน / สครับ / มาร์ค / พอกสด (Priority check เพื่อไม่ให้โดนคำว่า powder ดึงไป step 9)
  if (
    lower.includes('ผง') || lower.includes('ผลัดเซลล์') || lower.includes('พอก') ||
    lower.includes('โคลน') || lower.includes('มาส์ก') || lower.includes('มาส์ฝ้า') || lower.includes('มาร์ค') ||
    lower.includes('mask') || lower.includes('clay') || lower.includes('cray') ||
    lower.includes('scrub') || lower.includes('สครับ') ||
    lower.includes('aha') || lower.includes('แลคติก') || lower.includes('lactic') ||
    lower.includes('peeling') || lower.includes('exfoliat')
  ) {
    // ยกเว้นถ้าเป็น แป้งพัฟ / แป้งทาหน้า ที่มีคำว่า แป้ง
    if (!lower.includes('แป้ง') && !lower.includes('powder cake') && !lower.includes('powdercake')) {
      return SKINCARE_STEPS[2]; // step 3
    }
  }

  // 2. เส้นผม / ผิวกาย / แป้งแต่งหน้า / อุปกรณ์ (เฉพาะที่ระบุชัดเจน)
  if (
    lower.includes('ผม') || lower.includes('hair') || lower.includes('shampoo') || lower.includes('แชมพู') ||
    lower.includes('อาบน้ำ') || lower.includes('ผิวกาย') || lower.includes('body') || lower.includes('รักแร้') ||
    lower.includes('แป้ง') || lower.includes('powder cake') || lower.includes('powdercake') || lower.includes('loose powder') ||
    lower.includes('บัตรสมาชิก') || lower.includes('ฟองน้ำ') || lower.includes('เข็มกดสิว')
  ) {
    return SKINCARE_STEPS[8]; // step 9
  }

  // 3. กันแดด (Sunscreen) - ต้องเช็คก่อน "ครีม" เพราะมี "ครีมกันแดด"
  if (
    lower.includes('กันแดด') || lower.includes('sunscreen') || lower.includes('spf') || lower.includes('pa+')
  ) {
    return SKINCARE_STEPS[7]; // step 8
  }

  // 4. คลีนซิ่ง & ล้างหน้า
  if (
    lower.includes('คลีนซิ่ง') || lower.includes('cleansing') || lower.includes('cleancing') ||
    lower.includes('สบู่') || lower.includes('soap') ||
    lower.includes('เจลล้างหน้า') || lower.includes('เจลสิว') || lower.includes('เจลฝ้า') ||
    lower.includes('facial cleanser') || lower.includes('มิ้ลโยเกิร์ต') || lower.includes('milky') ||
    lower.includes('น้ำนม')
  ) {
    return SKINCARE_STEPS[0]; // step 1
  }

  // 5. โทนเนอร์ & ปรับสภาพผิว
  if (lower.includes('โทนเนอร์') || lower.includes('toner') || lower.includes('softener lotion')) {
    return SKINCARE_STEPS[1]; // step 2
  }

  // 6. ผลัดเซลล์ / ผงพอก / โคลน / สครับ (เผื่อตกหล่น)
  if (
    lower.includes('ผงพอก') || lower.includes('ผงนวล') || lower.includes('ผงเร่ง') || lower.includes('ผงสิว') ||
    lower.includes('โคลน') || lower.includes('มาส์ก') || lower.includes('มาส์ฝ้า') || lower.includes('มาร์ค') ||
    lower.includes('mask') || lower.includes('clay') || lower.includes('scrub') || lower.includes('สครับ') ||
    lower.includes('aha') || lower.includes('แลคติก') || lower.includes('lactic') || lower.includes('พอกสด')
  ) {
    return SKINCARE_STEPS[2]; // step 3
  }

  // 6. บำรุงรอบดวงตา & ริมฝีปาก
  if (
    lower.includes('อาย') || lower.includes('eye') ||
    lower.includes('ลิป') || lower.includes('lip')
  ) {
    return SKINCARE_STEPS[3]; // step 4
  }

  // 7. เซรั่ม & เอสเซ้นส์ฟื้นฟู
  if (
    lower.includes('เซรั่ม') || lower.includes('ซีรั่ม') || lower.includes('serum') ||
    lower.includes('เอสเซ้น') || lower.includes('essence') ||
    lower.includes('ซุปเปอร์ลิฟ') || lower.includes('ซุปเปอร์ไวท์') ||
    lower.includes('ดีอ๊อกซี่') || lower.includes('snail') || lower.includes('algae') || lower.includes('แองจี้เจล') ||
    lower.includes('ลดอาการ') || lower.includes('เรตินอล') || lower.includes('retinol') ||
    lower.includes('เอ็กตร้าเบอร์3') || lower.includes('extra serum')
  ) {
    return SKINCARE_STEPS[4]; // step 5
  }

  // 8. แต้มสิว & ฝ้าเฉพาะจุด
  if (
    lower.includes('แต้มสิว') || lower.includes('ครีมสิว') || lower.includes('acne skin cream') ||
    lower.includes('แต้มฝ้า') || lower.includes('ครีมฝ้า') || lower.includes('melasma') || lower.includes('purifying cream')
  ) {
    return SKINCARE_STEPS[5]; // step 6
  }

  // 9. ครีมบำรุง & คอลลาเจน
  if (
    lower.includes('คอลลาเจน') || lower.includes('collagen') ||
    lower.includes('เด้ง') || lower.includes('facialtensor') ||
    lower.includes('ไวท์ 28') || lower.includes('white28') || lower.includes('ไวท์เฟิร์มมิ่ง') ||
    lower.includes('ดับเบิ้ลไวท์') || lower.includes('double white') ||
    lower.includes('มูนไลท์') || lower.includes('moonlight') ||
    lower.includes('ครีมถนอมผิว') || lower.includes('แอบโซลูท เดย์') || lower.includes('absolutedaycream') ||
    lower.includes('ไนท์') || lower.includes('night') ||
    lower.includes('ปัมกิ้น') || lower.includes('pumpkin') ||
    lower.includes('ครีม') || lower.includes('cream') || lower.includes('เจล') || lower.includes('gel')
  ) {
    return SKINCARE_STEPS[6]; // step 7
  }

  return SKINCARE_STEPS[8]; // step 9
};

export const getProductCategory = (p) => {
  if (!p) return 'ทั่วไป';
  const raw = String(
    getFuzzyKey(p, ["หมวดสินค้า", "หมวดหมู่", "หมวด", "category", "ประเภท", "col_4"]) || ''
  ).trim();
  if (!raw) return 'ทั่วไป';
  const lower = raw.toLowerCase();
  if (lower === 'iris' || lower.includes('ไอริส')) return 'Iris';
  if (lower === 'jeness' || lower.includes('จีนีส') || lower.includes('เจนเนส')) return 'Jeness';
  if (lower === 'purefresh' || lower.includes('เพียวเฟรช')) return 'PureFresh';
  if (lower === 'ticket' || lower.includes('บัตรสมาชิก')) return 'บัตรสมาชิก / สิทธิ์';
  if (lower === 'อุปกรณ์อื่นๆ' || lower.includes('อุปกรณ์')) return 'อุปกรณ์อื่นๆ';
  if (lower === 'ลงเครื่อง' || lower.includes('เครื่อง')) return 'ลงเครื่อง';
  return raw;
};

export const hasPosProductImage = (p, wooImagesMap) => {
  if (!p) return false;
  const productName = String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2"]) || p.name || '').trim();
  const productCode = String(getFuzzyKey(p, ["รหัส", "col_1"]) || p.code || '').trim();

  if (p.firebaseImageUrl && String(p.firebaseImageUrl).startsWith('http')) return true;
  if (p.imageUrl && String(p.imageUrl).startsWith('http') && !p.imageUrl.includes('crm.irisnatures.com')) return true;
  if (Array.isArray(p.images) && p.images.length > 0) return true;
  if (p.image && typeof p.image === 'object' && (p.image.src || p.image.url)) return true;
  if (p.image && typeof p.image === 'string' && p.image.startsWith('http') && !p.image.includes('crm.irisnatures.com')) return true;

  const rawPicture = getFuzzyKey(p, ["รูปภาพ", "image", "imageUrl", "img", "photo", "picture"]);
  if (rawPicture && typeof rawPicture === 'string' && (rawPicture.startsWith('http://') || rawPicture.startsWith('https://'))) return true;

  const rawProductImg = p["รูปสินค้า"];
  if (rawProductImg && typeof rawProductImg === 'string' && rawProductImg.trim()) return true;

  if (wooImagesMap && wooImagesMap instanceof Map) {
    const nName = normProductStr(productName);
    const nCode = normProductStr(productCode);
    if (productCode && (wooImagesMap.has(productCode.toUpperCase()) || wooImagesMap.has(productCode))) return true;
    if (productName && (wooImagesMap.has(productName.toLowerCase()) || wooImagesMap.has(productName))) return true;
    if (nCode && wooImagesMap.has(nCode)) return true;
    if (nName && wooImagesMap.has(nName)) return true;
    if (nName && nName.length >= 4) {
      for (const [k] of wooImagesMap.entries()) {
        const nk = normProductStr(k);
        if (nk && (nk === nName || nk.includes(nName) || nName.includes(nk))) return true;
      }
    }
  }

  return false;
};

export const getPosProductImageUrl = (p, wooImagesMap) => {
  if (!p) return null;
  const productName = String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2"]) || p.name || '').trim();
  const productCode = String(getFuzzyKey(p, ["รหัส", "col_1"]) || p.code || '').trim();

  // 1. Priority #1: Firebase Storage URL (Primary cloud storage)
  const firebaseImg = p.firebaseImageUrl || p.imageUrl || p.image;
  if (firebaseImg && typeof firebaseImg === 'string' && firebaseImg.includes('firebasestorage.googleapis.com')) {
    const first = firebaseImg.split(',')[0].trim();
    if (first.startsWith('http')) return first;
  }
  const rawPicturePrimary = getFuzzyKey(p, ["รูปภาพ", "image", "imageUrl", "img"]);
  if (rawPicturePrimary && typeof rawPicturePrimary === 'string' && rawPicturePrimary.includes('firebasestorage.googleapis.com')) {
    const first = rawPicturePrimary.split(',')[0].trim();
    if (first.startsWith('http')) return first;
  }

  // 2. Direct web photo in 'รูปภาพ' / 'image' / 'imageUrl' / 'images'
  if (Array.isArray(p.images) && p.images.length > 0) {
    const firstImg = p.images[0];
    const src = typeof firstImg === 'string' ? firstImg : (firstImg?.src || firstImg?.url);
    if (src && typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://'))) {
      return src;
    }
  }
  if (p.image && typeof p.image === 'object') {
    const src = p.image.src || p.image.url;
    if (src && typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://'))) {
      return src;
    }
  }
  const rawPicture = getFuzzyKey(p, ["รูปภาพ", "image", "imageUrl", "img", "photo", "picture"]);
  if (rawPicture && typeof rawPicture === 'string') {
    const first = rawPicture.split(',')[0].trim();
    if (first.startsWith('http://') || first.startsWith('https://')) {
      return first;
    }
  }

  // 3. WooCommerce API map (direct, upper/lower, normalized, and fuzzy substring)
  if (wooImagesMap && wooImagesMap instanceof Map) {
    const nName = normProductStr(productName);
    const nCode = normProductStr(productCode);
    let wooImg = (productCode ? (wooImagesMap.get(productCode.toUpperCase()) || wooImagesMap.get(productCode)) : null) || 
                 (productName ? (wooImagesMap.get(productName.toLowerCase()) || wooImagesMap.get(productName)) : null) ||
                 (nCode ? wooImagesMap.get(nCode) : null) ||
                 (nName ? wooImagesMap.get(nName) : null);

    if (!wooImg && nName && nName.length >= 4) {
      for (const [k, v] of wooImagesMap.entries()) {
        const nk = normProductStr(k);
        if (nk && (nk === nName || (nName.length >= 5 && nk.includes(nName)) || (nk.length >= 5 && nName.includes(nk)))) {
          wooImg = v;
          break;
        }
      }
    }

    if (wooImg && typeof wooImg === 'string' && wooImg.startsWith('http')) {
      const first = wooImg.split(',')[0].trim();
      if (first.startsWith('http')) return first;
    }
  }

  // 4. 'รูปสินค้า' (AppSheet CRM legacy path or full url)
  const rawProductImg = p["รูปสินค้า"];
  if (rawProductImg && typeof rawProductImg === 'string' && rawProductImg.trim()) {
    const first = rawProductImg.split(',')[0].trim();
    if (first.startsWith('http://') || first.startsWith('https://')) {
      return first;
    }
    let clean = first.replace(/^\/+/, '');
    if (clean.startsWith('สินค้า_Images/')) {
      clean = clean.replace(/^สินค้า_Images\//, '');
    }
    try { clean = decodeURIComponent(clean); } catch(e) {}
    return `https://crm.irisnatures.com/สินค้า_Images/${encodeURI(clean)}`;
  }

  // 5. Any other key containing image file extension or '.รูปสินค้า.'
  for (const key of Object.keys(p)) {
    const val = String(p[key] || '').trim();
    if (val.match(/\.(jpeg|jpg|gif|png|webp)$/i) || val.includes('.รูปสินค้า.')) {
      const first = val.split(',')[0].trim();
      if (first.startsWith('http://') || first.startsWith('https://')) return first;
      let clean = first.replace(/^\/+/, '');
      if (clean.startsWith('สินค้า_Images/')) {
        clean = clean.replace(/^สินค้า_Images\//, '');
      }
      try { clean = decodeURIComponent(clean); } catch(e) {}
      return `https://crm.irisnatures.com/สินค้า_Images/${encodeURI(clean)}`;
    }
  }

  // 6. Fallback to product name
  if (productName) {
    return `https://crm.irisnatures.com/สินค้า_Images/${encodeURIComponent(productName)}.jpg`;
  }

  return null;
};

export const getProductFallbackUrl = (p) => {
  if (!p) return null;
  // If primary was crm, try web 'รูปภาพ'
  const rawPicture = getFuzzyKey(p, ["รูปภาพ", "image", "imageUrl", "img", "photo", "picture"]);
  if (rawPicture && typeof rawPicture === 'string') {
    const first = rawPicture.split(',')[0].trim();
    if (first.startsWith('http://') || first.startsWith('https://')) return first;
  }
  // If primary was web, try crm 'รูปสินค้า'
  const rawProductImg = p["รูปสินค้า"];
  if (rawProductImg && typeof rawProductImg === 'string' && rawProductImg.trim()) {
    const first = rawProductImg.split(',')[0].trim();
    let clean = first.replace(/^\/+/, '');
    if (clean.startsWith('สินค้า_Images/')) clean = clean.replace(/^สินค้า_Images\//, '');
    try { clean = decodeURIComponent(clean); } catch(e) {}
    return `https://crm.irisnatures.com/สินค้า_Images/${encodeURI(clean)}`;
  }
  return null;
};

export const getPosCourseImageUrl = (c, wooImagesMap) => {
  if (!c) return null;

  // 1. Direct image fields
  const directKeys = ["image", "รูปภาพ", "col_13", "firebaseImageUrl", "imageUrl", "รูป", "img"];
  for (const k of directKeys) {
    const val = c[k] || getFuzzyKey(c, [k]);
    if (val && typeof val === 'string' && val.trim()) {
      const first = val.split(',')[0].trim();
      if (first.startsWith('http://') || first.startsWith('https://') || first.startsWith('/')) {
        return first;
      }
    }
  }

  // 2. Machine treatment addons
  const cName = String(getFuzzyKey(c, ["ชื่อคอส", "col_4", "ชื่อสินค้า", "col_2"]) || c.name || '').trim();
  const cCode = String(getFuzzyKey(c, ["รหัสคอส", "col_1", "รหัส"]) || c.code || '').trim();
  if (cName || cCode) {
    const addon = (MACHINE_TREATMENT_ADDONS || []).find(m => 
      (m.code && cCode && m.code.toLowerCase() === cCode.toLowerCase()) || 
      (m.name && cName && (cName === m.name || cName.includes(m.name) || m.name.includes(cName)))
    );
    if (addon && addon.image) return addon.image;
  }

  // 3. Treatment poster for F-A through F-J
  if (cCode.startsWith('F-') && !cCode.startsWith('F-M') && !cCode.startsWith('F-S') && !cCode.startsWith('F-IPL')) {
    return '/posters/facial_treatment_poster.jpg';
  }

  // 4. Fallback to product image helper
  return getPosProductImageUrl(c, wooImagesMap);
};

export default function POSSystem({ 
  products = [], 
  branches = [],
  masterCourses = [], 
  promotions = [],
  customers = [],
  courses = [],
  histories = [],
  bookings = [],
  orders = [],
  dailySales = [],
  showToast,
  globalBranch,
  globalRole,
  appSettings = { monthlyTarget: 0 },
  employees = [],
  employeeAttendance = [],
  clockedInEmployees = [],
  wooImagesMap = new Map(),
  wooIdMap = new Map(),
  onViewCustomerProfile = () => {},
  posPreselectedCustomer,
  posParkedOrderToResume,
  onClearParkedOrderToResume,
  clearPosPreselectedCustomer,
  onGoToLogin,
  onChangeBranch,
  onGoBack,
  onAddCustomer,
  onOpenVipForm = () => {},
  autoOpenEod = null, // 🌟 ส่งยอดด่วนจากหน้าล็อกอิน: { employeeId }
  onQuickEodFinished = () => {},
  initialTab = null,
  onClearInitialTab = () => {},
  activeServices = [],
  posPreselectedUsageCourses = [],
  clearPosPreselectedUsageCourses = () => {},
  posPreselectedBeforePhotos = [],
  posPreselectedStaffName = '',
  activeStaff = null,
  posReturnToStaffAfterCheckout = false,
  onReturnToStaffDashboard = () => {},
  posActiveBookingId = null,
  posReturnToAppointmentsAfterCheckout = false,
  onReturnToAppointments = () => {},
  onViewCourseDetails = () => {},
  posPreselectedItems = [],
  clearPosPreselectedItems = () => {}
}) {
  // 🌟 โหมดส่งยอดด่วน — เปิดหน้า EOD ทันที (ไม่เด้ง SOD) และแจ้ง parent เมื่อปิดหน้าต่าง
  const quickEodActiveRef = useRef(!!autoOpenEod);
  const quickEodSubmittedRef = useRef(false);
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'courses' | 'my_courses'
  const [productSortMode, setProductSortMode] = useState('routine'); // 'routine' | 'bestseller' | 'stock' | 'alpha'
  const [selectedSkincareStep, setSelectedSkincareStep] = useState('all');
  const [singleCourseTab, setSingleCourseTab] = useState('machine');
  const [multiCourseTab, setMultiCourseTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMoleRemovalModalOpen, setIsMoleRemovalModalOpen] = useState(false);
  
  // Start of Day (SOD) State
  const [showSodModal, setShowSodModal] = useState(false);
  const [pendingCheckInBooking, setPendingCheckInBooking] = useState(null);
  const [printingJobSlipBooking, setPrintingJobSlipBooking] = useState(null);
  const [hasCheckedSod, setHasCheckedSod] = useState(false);
  const [sodData, setSodData] = useState({ floatCash: '', submittedBy: '' });
  const [isSubmittingSod, setIsSubmittingSod] = useState(false);
  const [activeBookingId, setActiveBookingId] = useState(posActiveBookingId);

  useEffect(() => {
    if (posActiveBookingId) {
      setActiveBookingId(posActiveBookingId);
    }
  }, [posActiveBookingId]);

  // รับรายการประเมินราคามาจากระบบจี้ไฝ หรือจากภายนอก
  useEffect(() => {
    if (posPreselectedItems && posPreselectedItems.length > 0) {
      setCart(prev => {
        const newCart = [...prev];
        posPreselectedItems.forEach(item => {
          const existIdx = newCart.findIndex(c => c.id === item.id && c.name === item.name && c.price === item.price);
          if (existIdx > -1) {
            newCart[existIdx] = { ...newCart[existIdx], qty: newCart[existIdx].qty + (item.qty || 1) };
          } else {
            newCart.push({ ...item });
          }
        });
        return newCart;
      });
      showToast(`เพิ่มรายการประเมินราคา ${posPreselectedItems.length} รายการลงตะกร้าแล้ว`, 'success');
      if (clearPosPreselectedItems) {
        clearPosPreselectedItems();
      }
    }
  }, [posPreselectedItems]);

  // 🎁 State สำหรับการเลือกสินค้าตัดสต็อกของแถม
  const [selectingGiftItem, setSelectingGiftItem] = useState(null);
  const [giftProductSearchQuery, setGiftProductSearchQuery] = useState('');

  const COURSE_TABS = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'promo', label: 'โปรโมชั่น' },
    { id: 'facial', label: 'ผิวหน้า (A-J)' },
    { id: 'acne_clear', label: 'เคลียร์สิว' },
    { id: 'machine', label: 'ลงเครื่อง' },
    { id: 'acne_sets', label: 'รักษาสิว/ฝ้า' },
    { id: 'nourish', label: 'บำรุงฟื้นฟู' },
    { id: 'ipl', label: 'IPL กำจัดขน' },
    { id: 'single_session', label: 'คอร์สรายครั้ง' }
  ];

  const getCourseCategory = (c) => {
    if (!c) return 'other';
    
    // คอร์สเก่าที่มีรหัส course... ให้ถือเป็น old_courses ทั้งหมด
    let code = String(getFuzzyKey(c, ["รหัสคอส", "col_1"]) || c.id || '').trim();
    if (code.startsWith('course') || (c.id && String(c.id).startsWith('course'))) {
      return 'old_courses';
    }

    const type = String(getFuzzyKey(c, ["ประเภท", "col_2"]) || '').trim();
    if (type === 'โปรโมชั่น' || type === 'โปร') return 'promo';
    if (type === 'ผิวหน้า (A-J)') return 'facial';
    if (type === 'เคลียร์สิว') return 'acne_clear';
    if (type === 'ลงเครื่อง') return 'machine';
    if (type === 'รักษาสิว/ฝ้า') return 'acne_sets';
    if (type === 'บำรุงฟื้นฟู') return 'nourish';
    if (type === 'IPL กำจัดขน') return 'ipl';
    if (type === 'วอคอิน' || type === 'คอร์สรายครั้ง' || type === 'รายครั้ง' || type === 'single_session' || type === 'service') return 'single_session';
    
    if (!code) return 'other';
    if (code.startsWith('PROMO-') || code.toLowerCase().startsWith('promo')) return 'promo';
    if (code.startsWith('MACH-') || code.startsWith('MACH')) return 'machine';
    if (code.startsWith('IPL-')) return 'ipl';
    if (code.startsWith('CARE-')) return 'nourish';
    if (code.startsWith('ACNE-') || code.startsWith('ACTIVE-')) return 'acne_sets';
    if (code.toLowerCase() === 'acmm') return 'acne_clear';
    if (!code.startsWith('F-')) return 'old_courses';
    if (code.startsWith('F-MA') || code.startsWith('F-M')) return 'machine';
    if (code.startsWith('F-S')) return 'acne_sets';
    if (code.startsWith('F-N')) return 'nourish';
    if (code.startsWith('F-AC')) return 'acne_clear';
    if (code.startsWith('F-IPL')) return 'ipl';
    if (/^F-[A-J]/.test(code)) return 'facial';
    return 'other';
  };
  
  const [cart, setCart] = useState([]);
  const totalCartQty = useMemo(() => cart.reduce((sum, item) => sum + (Number(item.qty) || 1), 0), [cart]);
  const hasCourseUsage = useMemo(() => cart.some(i => i.type === 'usage'), [cart]);
  const hasCourseClaim = useMemo(() => cart.some(i => i.type === 'claim_item'), [cart]);
  const hasUsageOrClaim = hasCourseUsage || hasCourseClaim;
  const [activeCustomerAppOrderIds, setActiveCustomerAppOrderIds] = useState([]);
  // 🌟 ยอดที่ลูกค้า "จ่ายเครดิตไปแล้วในแอป" ของออเดอร์ที่โหลดเข้าตะกร้า — ใช้กัน POS ตัดเครดิตซ้ำ 2 ครั้ง
  const [appCreditPaidAmount, setAppCreditPaidAmount] = useState(0);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState('');
  const [discountVal, setDiscountVal] = useState(0);
  const [discountType, setDiscountType] = useState('percent'); // 'percent' | 'amount'
  const [showWebOrdersModal, setShowWebOrdersModal] = useState(false);
  const [showCustomerContextModal, setShowCustomerContextModal] = useState(false);
  const [showSalesHistory, setShowSalesHistory] = useState(false);
  const [showClearPosMonthModal, setShowClearPosMonthModal] = useState(false);
  const [showShopeeModal, setShowShopeeModal] = useState(false);
  const [showDiscountSection, setShowDiscountSection] = useState(false);
  const [viewCourseDetails, setViewCourseDetails] = useState(null);
  const [selectedCourseForPromoModal, setSelectedCourseForPromoModal] = useState(null);
  const [selectedGroupedCourse, setSelectedGroupedCourse] = useState(null);
  const [groupedCourseFilterTab, setGroupedCourseFilterTab] = useState('all'); // 'all' | 'regular' | 'promo'
  const [posPromoProgramLetter, setPosPromoProgramLetter] = useState('all');
  const [posPromoGroup, setPosPromoGroup] = useState('all');

  useEffect(() => {
    if (selectedCourseForPromoModal) {
      setPosPromoProgramLetter('all');
      setPosPromoGroup('all');
    }
  }, [selectedCourseForPromoModal]);
  const [selectedCourseForUsage, setSelectedCourseForUsage] = useState(null);
  const [isSyncingWoo, setIsSyncingWoo] = useState(false);
  const [isLoadingCompare, setIsLoadingCompare] = useState(false);
  const [wooSyncDiff, setWooSyncDiff] = useState(null);
  const [selectedBed, setSelectedBed] = useState('');
  const [isOwnerDirectUsage, setIsOwnerDirectUsage] = useState(false);
  
  const [showParkBedModal, setShowParkBedModal] = useState(false);
  const [parkBedNumber, setParkBedNumber] = useState('1');
  const [ishipModal, setIshipModal] = useState({ isOpen: false });
  const [isFullscreen, setIsFullscreen] = useState(() => !!document.fullscreenElement);
  const [editingCoursePrice, setEditingCoursePrice] = useState(null);
  const posRef = useRef(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      // Sync body class immediately in the event handler (not deferred via useEffect)
      // to avoid a 1-frame flash of the sidebar re-appearing
      if (fs) {
        document.body.classList.add('pos-fullscreen-active');
      } else {
        document.body.classList.remove('pos-fullscreen-active');
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.warn(err.message));
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  const [isStockMode, setIsStockMode] = useState(false);
  const [isRequisitionMode, setIsRequisitionMode] = useState(false);
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  const [stockAdjustments, setStockAdjustments] = useState([]);
  const [stockInputModal, setStockInputModal] = useState({ isOpen: false, item: null, inputVal: '' });
  const [isStockConfirmModalOpen, setIsStockConfirmModalOpen] = useState(false);

  // Keep body class in sync with React state as a secondary safety net
  useEffect(() => {
    if (isFullscreen) {
      document.body.classList.add('pos-fullscreen-active');
    } else {
      // Only remove if browser is truly not fullscreen to avoid race condition
      if (!document.fullscreenElement) {
        document.body.classList.remove('pos-fullscreen-active');
      }
    }
  }, [isFullscreen]);

  // Cleanup only removes body class if browser is not fullscreen at unmount time
  useEffect(() => {
    return () => {
      if (!document.fullscreenElement) {
        document.body.classList.remove('pos-fullscreen-active');
      }
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  React.useEffect(() => {
    if (posParkedOrderToResume && posParkedOrderToResume.cartItems) {
      setCart(posParkedOrderToResume.cartItems);
      if (posParkedOrderToResume.discount) {
        setGlobalDiscount(parseNumber(posParkedOrderToResume.discount));
      }
      setActiveCustomerAppOrderIds(prev => [...new Set([...prev, posParkedOrderToResume.id])]);
      
      if (posParkedOrderToResume.customerPhone) {
         const cleanPhone = posParkedOrderToResume.customerPhone.replace(/[^0-9]/g, '');
         const targetCustomer = customers.find(c => {
             const phoneRaw = String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '');
             return phoneRaw.replace(/[^0-9]/g, '') === cleanPhone;
         });
         if (targetCustomer) {
            setSelectedCustomer(targetCustomer);
         }
      }
      onClearParkedOrderToResume();
    }
  }, [posParkedOrderToResume, customers, onClearParkedOrderToResume]);

  // Helper for branch stock
  const [isBedModalOpen, setIsBedModalOpen] = useState(false);
  // Checkout Details
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const handleSelectWalkIn = (initialMemberStatus = false) => {
    const isMember = Boolean(initialMemberStatus);
    // 🌟 ลูกค้าวอคอิน (Walk-in) แต่ละคนต้องมีสถานะเป็นคนละคนในแต่ละบิล ไม่ดึงข้อมูลสะสมของคนอื่นและไม่สะสมยอดต่อกัน
    const walkIn = {
      id: `walkin-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      "ชื่อ": isMember ? "ลูกค้าทั่วไป (สิทธิ์สมาชิก)" : "ลูกค้าทั่วไป (Walk-in)",
      "เบอร์โทร": "-",
      computedName: isMember ? "ลูกค้าทั่วไป (สิทธิ์สมาชิก)" : "ลูกค้าทั่วไป (Walk-in)",
      computedPhone: "-",
      isWalkIn: true,
      isApproved: isMember,
      hasMemberCard: isMember,
      isMemberDiscount: isMember,
      realAccumulatedAmount: 0,
      productAccumulatedAmount: 0,
      totalAccumulated: 0,
      oldAmount: 0,
      historyEarned: 0,
      historySpent: 0,
      productEarned: 0,
      myHistories: []
    };

    setSelectedCustomer(walkIn);
    setCustomerSearch('');
    setIsCustomerDropdownOpen(false);
    showToast(isMember ? 'เลือกลูกค้าวอคอิน (สิทธิ์ส่วนลดบัตรสมาชิก ⭐) เรียบร้อย' : 'เลือกลูกค้าทั่วไป (Walk-in) เรียบร้อยแล้ว', 'info');
  };

  // Walk-in / Quick Customer Edit Modal state
  const [isWalkInEditModalOpen, setIsWalkInEditModalOpen] = useState(false);
  const [walkInFormData, setWalkInFormData] = useState({
    name: '',
    phone: '',
    isMember: false,
    issue: '',
    saveToDb: true
  });

  // Edit Course Owner Info Modal state
  const [courseCustomerModalData, setCourseCustomerModalData] = useState(null);
  const [courseCustomerFormData, setCourseCustomerFormData] = useState({
    name: '',
    phone: '',
    saveToDb: true
  });

  const handleSaveWalkInCustomer = async () => {
    const rawName = (walkInFormData.name || '').trim();
    const rawPhone = (walkInFormData.phone || '').trim();
    const isMember = Boolean(walkInFormData.isMember);
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const finalName = rawName || (isMember ? 'ลูกค้าทั่วไป (สิทธิ์สมาชิก)' : 'ลูกค้าทั่วไป (Walk-in)');
    const finalPhone = rawPhone || '-';

    if (walkInFormData.saveToDb && !rawName && cleanPhone.length < 8) {
      showToast('กรุณาระบุชื่อหรือเบอร์โทรลูกค้าเพื่อบันทึกลงระบบ', 'warning');
      return;
    }

    let savedCustomerId = selectedCustomer?.id || `walkin-${Date.now()}`;
    if (walkInFormData.saveToDb && (cleanPhone.length >= 8 || rawName.length >= 2)) {
      try {
        const customerData = {
          "ชื่อ": finalName,
          "col_1": finalName,
          "เบอร์โทร": finalPhone,
          "col_3": finalPhone,
          "cleanPhone": cleanPhone,
          "ชื่อเล่น": '',
          "เพศ": 'หญิง',
          "สาขา": String(globalBranch || 'เฉวง'),
          "ปัญหาผิว": walkInFormData.issue || '',
          "หมายเลขใบสะสม": `Irismember${Math.floor(1000 + Math.random() * 9000)}`,
          "ยอดสะสม": "0",
          "สถานะสมาชิก": isMember ? "มีสิทธิ์ส่วนลดบัตรสมาชิก" : "ยังไม่สะสมยอด",
          "isApproved": isMember,
          "hasMemberCard": isMember,
          "isWalkIn": false,
          "source": "POS Walk-in Quick Register",
          "createdAt": new Date().toISOString(),
          "updatedAt": new Date().toISOString()
        };

        const existingCust = cleanPhone.length >= 8 
          ? customers.find(c => {
              const p = String(getFuzzyKey(c, ["เบอร์โทร", "col_3", "cleanPhone"]) || '').replace(/\D/g, '');
              return p === cleanPhone;
            })
          : null;

        if (existingCust && existingCust.id) {
          savedCustomerId = existingCust.id;
          await updateDoc(doc(db, 'customers', existingCust.id), {
            "ชื่อ": finalName,
            "col_1": finalName,
            "ปัญหาผิว": walkInFormData.issue || existingCust["ปัญหาผิว"] || '',
            "isApproved": isMember || existingCust.isApproved || false,
            "hasMemberCard": isMember || existingCust.hasMemberCard || false,
            "updatedAt": new Date().toISOString()
          });
        } else {
          const docRef = await addDoc(getCol('customers'), customerData);
          savedCustomerId = docRef.id;
        }
      } catch (err) {
        console.error("Error saving customer from POS:", err);
      }
    }

    setSelectedCustomer(prev => ({
      ...(prev || {}),
      id: savedCustomerId,
      "ชื่อ": finalName,
      "col_1": finalName,
      computedName: finalName,
      "เบอร์โทร": finalPhone,
      "col_3": finalPhone,
      computedPhone: finalPhone,
      cleanPhone: cleanPhone,
      isWalkIn: true,
      hasMemberCard: isMember,
      isApproved: isMember,
      isMemberDiscount: isMember,
      realAccumulatedAmount: 0,
      productAccumulatedAmount: 0,
      totalAccumulated: 0,
      oldAmount: 0,
      historyEarned: 0,
      historySpent: 0,
      productEarned: 0,
      myHistories: [],
      issue: walkInFormData.issue || '',
      computedIssue: walkInFormData.issue || ''
    }));

    setIsWalkInEditModalOpen(false);
    showToast(`อัปเดตข้อมูลลูกค้า ${finalName} เรียบร้อยแล้ว`, 'success');
  };

  const handleSaveCourseCustomer = async () => {
    if (!courseCustomerModalData) return;
    const rawName = (courseCustomerFormData.name || '').trim();
    const rawPhone = (courseCustomerFormData.phone || '').trim();
    if (!rawName) {
      showToast('กรุณาระบุชื่อลูกค้า', 'error');
      return;
    }

    const cleanPhone = rawPhone.replace(/\D/g, '');
    try {
      await updateDoc(doc(db, 'courses', courseCustomerModalData.id), {
        "ผู้ซื้อคอส": rawName,
        "col_9": rawName,
        "เบอร์โทร": rawPhone || '-',
        "col_1": rawPhone || '-',
        "cleanPhone": cleanPhone,
        "isWalkIn": false,
        "updatedFromWalkIn": true,
        "updatedAt": new Date().toISOString()
      });

      if (courseCustomerFormData.saveToDb && cleanPhone.length >= 8) {
        const existingCust = customers.find(c => {
          const p = String(getFuzzyKey(c, ["เบอร์โทร", "col_3", "cleanPhone"]) || '').replace(/\D/g, '');
          return p === cleanPhone;
        });
        if (!existingCust) {
          await addDoc(getCol('customers'), {
            "ชื่อ": rawName,
            "col_1": rawName,
            "เบอร์โทร": rawPhone,
            "col_3": rawPhone,
            "cleanPhone": cleanPhone,
            "เพศ": 'หญิง',
            "สาขา": String(globalBranch || 'เฉวง'),
            "หมายเลขใบสะสม": `Irismember${Math.floor(1000 + Math.random() * 9000)}`,
            "ยอดสะสม": "0",
            "สถานะสมาชิก": "ยังไม่สะสมยอด",
            "source": "Course Owner Update",
            "createdAt": new Date().toISOString()
          });
        }
      }

      setSelectedCourseForUsage(prev => {
        if (!prev || prev.id !== courseCustomerModalData.id) return prev;
        return {
          ...prev,
          "ผู้ซื้อคอส": rawName,
          "col_9": rawName,
          "เบอร์โทร": rawPhone || '-',
          "col_1": rawPhone || '-',
          "cleanPhone": cleanPhone,
          "isWalkIn": false
        };
      });

      if (selectedCustomer && (selectedCustomer.isWalkIn || selectedCustomer.id === 'walkin-default')) {
        setSelectedCustomer(prev => ({
          ...prev,
          "ชื่อ": rawName,
          "col_1": rawName,
          computedName: rawName,
          "เบอร์โทร": rawPhone || '-',
          "col_3": rawPhone || '-',
          computedPhone: rawPhone || '-'
        }));
      }

      setCourseCustomerModalData(null);
      showToast(`อัปเดตข้อมูลเจ้าของคอร์ส ${rawName} สำเร็จ!`, 'success');
    } catch (err) {
      console.error("Error updating course customer:", err);
      showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
    }
  };
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const topCustomerSearchRef = useRef(null);
  const cartCustomerSearchRef = useRef(null);
  const desktopSearchInputRef = useRef(null);
  const mobileSearchInputRef = useRef(null);

  // Close customer dropdown and clear search on outside click
  useEffect(() => {
    const handleCustomerClickOutside = (e) => {
      const inTop = topCustomerSearchRef.current && topCustomerSearchRef.current.contains(e.target);
      const inCart = cartCustomerSearchRef.current && cartCustomerSearchRef.current.contains(e.target);
      if (!inTop && !inCart) {
        if (isCustomerDropdownOpen || customerSearch) {
          setIsCustomerDropdownOpen(false);
          setCustomerSearch('');
        }
      }
    };
    document.addEventListener('mousedown', handleCustomerClickOutside);
    return () => document.removeEventListener('mousedown', handleCustomerClickOutside);
  }, [isCustomerDropdownOpen, customerSearch]);

  // Listen for items from MoleRemovalSystem or Orders tab
  React.useEffect(() => {
    const handleAddItems = (e) => {
        const { items, customer, orderId, order } = e.detail || {};
        if (customer) {
            setSelectedCustomer(customer);
        }
        if (orderId) {
            setActiveCustomerAppOrderIds(prev => [...new Set([...prev, orderId])]);
        }
        if (order) {
            if (order.discount && !isNaN(Number(order.discount))) {
               const d = Number(order.discount);
               setDiscountType('amount');
               setDiscountVal(d);
               setGlobalDiscount(prev => prev + d);
            }
        }
        if (items && items.length > 0) {
            setCart(prev => {
                const newCart = [...prev];
                items.forEach(item => {
                    const existIdx = newCart.findIndex(c => c.id === item.id && c.name === item.name && c.price === item.price);
                    if (existIdx > -1) {
                        newCart[existIdx] = { ...newCart[existIdx], qty: newCart[existIdx].qty + item.qty };
                    } else {
                        newCart.push({ ...item });
                    }
                });
                return newCart;
            });
        }
    };
    window.addEventListener('add-to-pos-cart', handleAddItems);
    return () => window.removeEventListener('add-to-pos-cart', handleAddItems);
  }, [selectedCustomer]);

  // Check for Start of Day (SOD)
  useEffect(() => {
    const checkSod = async () => {
      if (hasCheckedSod) return;
      try {
        const todayStr = new Date().toLocaleDateString('th-TH');
        const branchName = globalBranch || "สำนักงานใหญ่";
        const sodQuery = query(
          getCol('pos_sessions'),
          where('date', '==', todayStr),
          where('branch', '==', branchName)
        );
        const sodDocs = await getDocs(sodQuery);
        if (sodDocs.empty) {
          // Fetch the most recent daily_sales for this branch to get nextDayFloat
          const lastEodQuery = query(
            getCol('daily_sales'),
            where('branch', '==', branchName),
            orderBy('createdAt', 'desc'),
            limit(1)
          );
          const lastEodDocs = await getDocs(lastEodQuery);
          let defaultFloat = '';
          if (!lastEodDocs.empty) {
            const lastEodData = lastEodDocs.docs[0].data();
            if (lastEodData.nextDayFloat !== undefined) {
              defaultFloat = String(lastEodData.nextDayFloat);
            } else if (lastEodData.floatCash !== undefined) {
              defaultFloat = String(lastEodData.floatCash);
            }
          }
          setSodData(prev => ({ ...prev, floatCash: defaultFloat }));
          if (!quickEodActiveRef.current) setShowSodModal(true);
        } else {
          // If already opened, set floatCash to the existing value to auto-fill EOD
          const data = sodDocs.docs[0].data();
          setEodData(prev => ({ ...prev, floatCash: String(data.floatCash || '') }));
        }
      } catch (err) {
        console.error("Error checking SOD:", err);
      } finally {
        setHasCheckedSod(true);
      }
    };
    checkSod();
  }, [globalBranch, hasCheckedSod]);

  const handleSodSubmit = async () => {
    if (!sodData.submittedBy || !sodData.floatCash) {
      showToast('กรุณาระบุข้อมูลให้ครบถ้วน', 'error');
      return;
    }
    setIsSubmittingSod(true);
    try {
      const todayStr = new Date().toLocaleDateString('th-TH');
      const branchName = globalBranch || "สำนักงานใหญ่";
      const sodRef = getCol('pos_sessions');
      await addDoc(sodRef, {
        date: todayStr,
        branch: branchName,
        floatCash: parseNumber(sodData.floatCash),
        openedBy: sodData.submittedBy,
        openedAt: new Date().toISOString()
      });
      // Auto-fill EOD data
      setEodData(prev => ({ ...prev, floatCash: String(sodData.floatCash) }));
      setShowSodModal(false);
      showToast('เปิดกะเรียบร้อยแล้ว');
    } catch (err) {
      console.error(err);
      showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
    } finally {
      setIsSubmittingSod(false);
    }
  };

  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [appliedVoucherId, setAppliedVoucherId] = useState(null);
  const [appliedVoucherCode, setAppliedVoucherCode] = useState(null);
  const [appliedVoucherData, setAppliedVoucherData] = useState(null);
  const [instantVoucherModal, setInstantVoucherModal] = useState(null);
  const [manualVoucherCode, setManualVoucherCode] = useState('');
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [customerSignature, setCustomerSignature] = useState(null);
  const [staffSignature, setStaffSignature] = useState(null);
  const [showServiceProofModal, setShowServiceProofModal] = useState(false);
  const [previewCustomerAvatarModal, setPreviewCustomerAvatarModal] = useState(null);
  const [splitPayment, setSplitPayment] = useState({ cash: 0, transfer: 0, cod: 0, credit: 0, omise_promptpay: 0 });
  const [showOmiseQrModal, setShowOmiseQrModal] = useState(false);
  const [showTransferChoiceModal, setShowTransferChoiceModal] = useState(false);
  const [omiseChargeData, setOmiseChargeData] = useState(null);
  const [isPollingOmise, setIsPollingOmise] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentStaff, setPaymentStaff] = useState('');
  const [selectedHandFees, setSelectedHandFees] = useState([]);
  const [showCustomHandFeeInput, setShowCustomHandFeeInput] = useState(false);
  const [customHandFeeForm, setCustomHandFeeForm] = useState({ name: '', fee: '' });

  const computePresetFee = (preset) => {
    if (!preset.isBillCalculated) return preset.fee;

    // หาว่าในตะกร้ามีคอร์ส/รายการที่ตรงกับประเภทนี้หรือไม่
    let matchedPrice = 0;
    if (preset.id === 'laser_ipl') {
      const iplItem = cart.find(i => {
        const n = String(i.name || '').toLowerCase();
        return n.includes('ipl') || n.includes('laser') || n.includes('เลเซอร์');
      });
      if (iplItem) {
        matchedPrice = (Number(iplItem.price) || 0) * (Number(iplItem.qty) || 1);
      }
    } else if (preset.id === 'mole_removal') {
      const moleItem = cart.find(i => {
        const n = String(i.name || '').toLowerCase();
        return n.includes('จี้') || n.includes('mole') || n.includes('ไฝ') || n.includes('กระ') || n.includes('ติ่งเนื้อ');
      });
      if (moleItem) {
        matchedPrice = (Number(moleItem.price) || 0) * (Number(moleItem.qty) || 1);
      }
    }

    // หากไม่มีรายการเฉพาะเจาะจง ให้คิดตามยอดสุทธิของบิล (total)
    const targetPrice = matchedPrice > 0 ? matchedPrice : (total > 0 ? total : 0);
    if (targetPrice <= 0) return 50; // ขั้นต่ำ
    return targetPrice < 1000 ? Math.round(targetPrice * 0.10) : Math.round(targetPrice * 0.20);
  };

  const toggleHandFee = (preset) => {
    const feeToUse = computePresetFee(preset);
    setSelectedHandFees(prev => {
      const idx = prev.findIndex(item => item.id === preset.id);
      if (idx >= 0) {
        return prev.filter((_, i) => i !== idx);
      } else {
        return [...prev, { 
          id: preset.id, 
          name: preset.name, 
          fee: Number(feeToUse), 
          qty: 1, 
          isBillCalculated: !!preset.isBillCalculated 
        }];
      }
    });
  };

  const updateHandFeeQty = (id, delta) => {
    setSelectedHandFees(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = Math.max(1, (item.qty || 1) + delta);
          return { ...item, qty: newQty };
        }
        return item;
      }).filter(item => item.qty > 0);
    });
  };

  const addCustomHandFee = (e) => {
    e?.preventDefault();
    if (!customHandFeeForm.name.trim() || !customHandFeeForm.fee) return;
    const feeNum = parseNumber(customHandFeeForm.fee);
    if (feeNum <= 0) return;
    const newId = `custom_${Date.now()}`;
    setSelectedHandFees(prev => [
      ...prev,
      { id: newId, name: customHandFeeForm.name.trim(), fee: feeNum, qty: 1, isCustom: true }
    ]);
    setCustomHandFeeForm({ name: '', fee: '' });
    setShowCustomHandFeeInput(false);
  };

  const totalHandFeeFromBill = useMemo(() => {
    return selectedHandFees.reduce((sum, item) => sum + (Number(item.fee || 0) * Number(item.qty || 1)), 0);
  }, [selectedHandFees]);
  const [paymentPhotos, setPaymentPhotos] = useState({
    before: [],
    after: []
  });
  const [usedServices, setUsedServices] = useState([]);
  const [singleCourseTabModal, setSingleCourseTabModal] = useState('machine');
  const [modalServiceSearch, setModalServiceSearch] = useState('');
  const [modalProductSearch, setModalProductSearch] = useState('');
  const [modalCourseSearch, setModalCourseSearch] = useState('');
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [quickPriceModalItem, setQuickPriceModalItem] = useState(null);
  
  const [orderChannel, setOrderChannel] = useState('instore'); // 'instore' | 'chat' | 'web'
  const [shippingAddress, setShippingAddress] = useState('');
  // 📮 เลขพัสดุที่กรอกตอนชำระเงิน (ถ้าจัดส่งแล้ว) → บันทึกลงบิล + ลูกค้าติดตาม 17TRACK ได้ทันที
  const [posTrackingNo, setPosTrackingNo] = useState('');
  const [printMode, setPrintMode] = useState('receipt'); // 'receipt' | 'label'
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  
  // Web Orders Polling
  const [webOrders, setWebOrders] = useState([]);
  const [activeWcOrderId, setActiveWcOrderId] = useState('');
  const [isFetchingWebOrders, setIsFetchingWebOrders] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showCustomerScanner, setShowCustomerScanner] = useState(false);
  const [scannerTarget, setScannerTarget] = useState(null);
  const [courseQRModalData, setCourseQRModalData] = useState(null);
  const [showShippingAddress, setShowShippingAddress] = useState(false);

  // WooCommerce Stock Sync Status
  // [ { name: string, status: 'pending' | 'success' | 'failed', newStock: number } ]
  const [wooSyncStatus, setWooSyncStatus] = useState([]);

  // Stock Comparison Modal
  const [showStockCompare, setShowStockCompare] = useState(false);
  const [stockCompareData, setStockCompareData] = useState([]);
  
  // Signature Refs for usage
  const custSigRef = React.useRef(null);
  const staffSigRef = React.useRef(null);
  const fileInputRef = React.useRef(null);

  // 🕒 Active Course In-Service State (tracks courses that have started service via before photo)
  // { [courseId]: { status: 'กำลังให้บริการ' | 'เรียบร้อย', startTime: timestamp, beforePhoto: url } }
  const [activeServiceCourses, setActiveServiceCourses] = useState(() => {
    try {
      const saved = sessionStorage.getItem('pos_active_services');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [serviceTimerNow, setServiceTimerNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setServiceTimerNow(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const saveActiveServiceCourses = (newMap) => {
    setActiveServiceCourses(newMap);
    try {
      sessionStorage.setItem('pos_active_services', JSON.stringify(newMap));
    } catch {}
  };

  const getServiceElapsedStr = (startTime) => {
    if (!startTime) return '';
    const diffMs = Math.max(0, serviceTimerNow - Number(startTime));
    const mins = Math.floor(diffMs / 60000);
    const startTimeFormatted = new Date(startTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    if (mins === 0) {
      return `${startTimeFormatted} • เริ่ม < 1 นาที`;
    }
    return `${startTimeFormatted} • ${mins} นาที`;
  };

  // Helper to add course into deduction cart (supports multiple courses)
  const addCourseToDeduction = (c, qty = 1) => {
    const maxQty = Number(c.computedRemainQty || 1);
    const cName = String(getFuzzyKey(c, ["ชื่อคอส", "col_8"]) || c.name || '');
    const cNo = String(getFuzzyKey(c, ["เลขที่ใบคอส", "col_2"]) || '');
    const nameStr = `เบิกใช้: ${cName} (${cNo})`;

    setCart(prev => {
      const existing = prev.find(i => i.id === c.id && i.type === 'usage');
      if (existing) {
        return prev.map(i => i.id === c.id && i.type === 'usage' 
          ? { ...i, qty: Math.min(maxQty, i.qty + qty) } 
          : i
        );
      }
      return [
        ...prev,
        {
          id: c.id,
          name: nameStr,
          price: 0,
          qty: Math.min(maxQty, qty),
          type: 'usage',
          actionType: 'usage',
          isUsage: true,
          noCourseCommission: true,
          maxQty,
          originalItem: c
        }
      ];
    });
    showToast(`เพิ่มคอร์ส "${cName}" ในรายการตัดยอดแล้ว`, 'success');
  };

  const toggleCourseDeduction = (c) => {
    const inCart = cart.some(i => i.id === c.id && i.type === 'usage');
    if (inCart) {
      removeFromCart(c.id, 'usage');
      showToast(`นำคอร์สออกจากการตัดยอดแล้ว`, 'info');
    } else {
      addCourseToDeduction(c, 1);
    }
  };

  const handleUploadBeforePhoto = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      const results = await Promise.all(files.map(async file => {
        try {
          const options = { maxSizeMB: 0.2, maxWidthOrHeight: 1024, useWebWorker: true };
          const comp = await imageCompression(file, options);
          return new Promise(res => {
            const reader = new FileReader();
            reader.onload = ev => res(ev.target.result);
            reader.readAsDataURL(comp);
          });
        } catch {
          return new Promise(res => {
            const reader = new FileReader();
            reader.onload = ev => res(ev.target.result);
            reader.readAsDataURL(file);
          });
        }
      }));

      const startTime = Date.now();
      setPaymentPhotos(prev => ({
        ...prev,
        before: [...prev.before, ...results]
      }));

      // Mark all usage courses currently in cart as "กำลังให้บริการ"
      const usageCourses = cart.filter(i => i.type === 'usage');
      const updated = { ...activeServiceCourses };
      usageCourses.forEach(ci => {
        updated[ci.id] = {
          status: 'กำลังให้บริการ',
          startTime: startTime,
          beforePhoto: results[0],
          courseName: ci.name
        };
      });
      saveActiveServiceCourses(updated);
      showToast('📸 ถ่ายรูปแรกสำเร็จ! เริ่มจับเวลาให้บริการและสถานะการ์ดกระพริบแล้ว ✨', 'success');
    } catch (err) {
      console.error('Before photo error:', err);
      showToast('ไม่สามารถอัปโหลดรูปภาพได้', 'error');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleUploadAfterPhoto = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      const results = await Promise.all(files.map(async file => {
        try {
          const options = { maxSizeMB: 0.2, maxWidthOrHeight: 1024, useWebWorker: true };
          const comp = await imageCompression(file, options);
          return new Promise(res => {
            const reader = new FileReader();
            reader.onload = ev => res(ev.target.result);
            reader.readAsDataURL(comp);
          });
        } catch {
          return new Promise(res => {
            const reader = new FileReader();
            reader.onload = ev => res(ev.target.result);
            reader.readAsDataURL(file);
          });
        }
      }));

      setPaymentPhotos(prev => ({
        ...prev,
        after: [...prev.after, ...results]
      }));
      showToast('📸 บันทึกรูปหลังทำ (After) สำเร็จ!', 'success');
    } catch (err) {
      console.error('After photo error:', err);
      showToast('ไม่สามารถอัปโหลดรูปภาพได้', 'error');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Web Orders Fetching Logic
  const fetchWebOrdersManual = async () => {
    if (isFetchingWebOrders) return;
    try {
      setIsFetchingWebOrders(true);
      // Fetch Processing orders from WooCommerce
      const data = await fetchWithProxy('https://irisnatures.com/wp-json/wc/v3/orders?status=processing');
      if (!Array.isArray(data)) return;
      
      // Fetch recent POS orders to filter out already imported ones
      // We fetch last 100 orders to be safe
      const recentOrdersSnap = await getDocs(query(getCol('orders'), where("source", "==", "POS")));
      const importedIds = recentOrdersSnap.docs.map(d => d.data().wcOrderId).filter(Boolean);
      
      const newOrders = data.filter(o => !importedIds.includes(String(o.id)));
      setWebOrders(newOrders);
    } catch(e) {
      console.error('Failed to fetch web orders', e);
    } finally {
      setIsFetchingWebOrders(false);
    }
  };

  useEffect(() => {
    fetchWebOrdersManual();
    const interval = setInterval(fetchWebOrdersManual, 60000);
    return () => clearInterval(interval);
  }, []);

  // Set Preselected Customer
  useEffect(() => {
    if (posPreselectedCustomer) {
      setSelectedCustomer(posPreselectedCustomer);
      setActiveTab('my_courses');
      if (clearPosPreselectedCustomer) clearPosPreselectedCustomer();
    }
  }, [posPreselectedCustomer, clearPosPreselectedCustomer]);

  // Handle Preselected Usage Courses from Staff Dashboard (ตัดคอร์สจากหน้าหลักพนักงาน)
  useEffect(() => {
    if (posPreselectedUsageCourses && posPreselectedUsageCourses.length > 0) {
      posPreselectedUsageCourses.forEach(c => {
        addCourseToDeduction(c, 1);
      });
      if (posPreselectedBeforePhotos && posPreselectedBeforePhotos.length > 0) {
        setPaymentPhotos(prev => ({
          ...prev,
          before: [...new Set([...(prev?.before || []), ...posPreselectedBeforePhotos])]
        }));
      }
      setActiveTab('my_courses');
      setIsMobileCartOpen(true);
      if (clearPosPreselectedUsageCourses) clearPosPreselectedUsageCourses();
    }
  }, [posPreselectedUsageCourses, posPreselectedBeforePhotos, clearPosPreselectedUsageCourses]);

  // Handle Initial Tab (e.g. from Mole banner)
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      if (onClearInitialTab) onClearInitialTab();
    }
  }, [initialTab, onClearInitialTab]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [transactionDate, setTransactionDate] = useState(getLocalYYYYMMDD());
  const [posFilterDate, setPosFilterDate] = useState(getLocalYYYYMMDD());

  const [autoPrint, setAutoPrint] = useState(() => {
    const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) return false;
    const saved = localStorage.getItem('posAutoPrint');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('posAutoPrint', autoPrint);
  }, [autoPrint]);

  useEffect(() => {
    const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (showPreviewModal && autoPrint && !isMobile) {
      // Reduced from 500ms → 50ms: just enough for DOM to render
      const timer = setTimeout(() => {
        window.print();
        if (receiptData?.orderNo === 'DRAFT') setReceiptData(null);
        setShowPreviewModal(false);
        setActiveTab('products');
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [showPreviewModal, autoPrint, receiptData]);

  // Keyboard shortcut: Enter or 'p' while preview is open → print immediately
  useEffect(() => {
    if (!showPreviewModal) return;
    const handleKey = (e) => {
      if (e.key === 'Enter' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        window.print();
        if (receiptData?.orderNo === 'DRAFT') setReceiptData(null);
        setShowPreviewModal(false);
        setActiveTab('products');
      }
      if (e.key === 'Escape') {
        if (receiptData?.orderNo === 'DRAFT') setReceiptData(null);
        setShowPreviewModal(false);
        setActiveTab('products');
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [showPreviewModal, receiptData]);

  const [showEodModal, setShowEodModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(null);
  const [showEodPreviewA4, setShowEodPreviewA4] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [eodTab, setEodTab] = useState('cash');
  const [eodData, setEodData] = useState({ actualCash: '', floatCash: '1000', imageBase64: '', submittedBy: '', clockOut: true });

  const latestFloat = useMemo(() => {
    const sorted = [...dailySales].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const branchRec = sorted.find(d => d.branch === (globalBranch || "สำนักงานใหญ่"));
    if (branchRec && branchRec.nextDayFloat !== undefined) {
      return branchRec.nextDayFloat.toString();
    }
    return '1000'; // Default fallback
  }, [dailySales, globalBranch]);

  const availableStaffList = useMemo(() => {
    const normGb = normalizeBranchName(globalBranch);
    const filterFn = (emp) => {
      if (!emp || emp.status === 'inactive') return false;
      if (!normGb) return true;
      const empBranch = normalizeBranchName(emp.branch || '');
      return !empBranch || empBranch === normGb || empBranch === 'สำนักงานใหญ่';
    };

    let list = (clockedInEmployees || []).filter(filterFn);
    // If no clocked-in employees found for this branch, fall back to all active branch employees
    if (list.length === 0) {
      list = (employees || []).filter(filterFn);
    }
    // If still empty (e.g. branch mismatch), fall back to all active employees
    if (list.length === 0) {
      list = (employees || []).filter(emp => emp && emp.status !== 'inactive');
    }
    // Final fallback to all employees
    if (list.length === 0 && employees && employees.length > 0) {
      list = employees;
    }
    return list;
  }, [clockedInEmployees, employees, globalBranch]);

  // Auto-select staff if none selected yet: prefer posPreselectedStaffName -> activeStaff -> sole available staff
  useEffect(() => {
    if (!paymentStaff) {
      if (posPreselectedStaffName) {
        setPaymentStaff(posPreselectedStaffName);
      } else if (activeStaff?.name) {
        setPaymentStaff(activeStaff.name);
      } else if (availableStaffList.length === 1 && availableStaffList[0]?.name) {
        setPaymentStaff(availableStaffList[0].name);
      }
    }
  }, [availableStaffList, paymentStaff, posPreselectedStaffName, activeStaff]);

  const renderStaffSelection = (isServiceStep = false) => {
    return (
      <div className="mb-3 bg-slate-50 border border-slate-200/80 p-2.5 sm:p-3 rounded-2xl">
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold text-slate-700">
            {isServiceStep ? 'พนักงานผู้ให้บริการ' : 'พนักงานที่ให้บริการ / ขายคอร์ส (เลือกได้หลายคนเพื่อแบ่งคอม)'} <span className="text-red-500">*</span>
          </label>
          {paymentStaff && (
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full border border-indigo-200">
              เลือก: {paymentStaff}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {availableStaffList.length === 0 ? (
            <p className="text-xs text-rose-500 font-medium">ไม่พบรายชื่อพนักงานในระบบ กรุณาตรวจสอบเมนูพนักงาน</p>
          ) : (
            availableStaffList.map(emp => {
              const isSelected = paymentStaff && paymentStaff.split('/').map(s => s.trim()).includes(emp.name);
              return (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => {
                    let currentStaffList = paymentStaff ? paymentStaff.split('/').map(s => s.trim()).filter(Boolean) : [];
                    if (isSelected) {
                      currentStaffList = currentStaffList.filter(s => s !== emp.name);
                    } else {
                      currentStaffList.push(emp.name);
                    }
                    setPaymentStaff(currentStaffList.join(' / '));
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 shadow-2xs active:scale-95 ${
                    isSelected 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-200' 
                      : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  {isSelected ? <CheckCircle size={13} className="text-white" /> : <User size={13} className="text-slate-400" />}
                  {emp.name}
                </button>
              );
            })
          )}
        </div>
        {/* Hand Fee Selection Block - Vibrant Orange Buttons */}
        <div className="mt-2.5 p-2.5 bg-gradient-to-br from-amber-50/70 via-orange-50/60 to-amber-50/70 border border-orange-200/90 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-md bg-orange-500 text-white flex items-center justify-center shadow-xs">
                <Sparkles size={10} />
              </div>
              <label className="text-xs font-black text-slate-800">
                รายการที่ได้ค่ามือ (DF บริการ)
              </label>
              <span className="text-[9px] text-orange-700 bg-orange-100/90 border border-orange-200 px-1.5 py-0.2 rounded-full font-bold">
                แตะเลือกเพื่อคำนวณ
              </span>
            </div>
            {totalHandFeeFromBill > 0 && (
              <span className="text-xs font-black text-orange-700 bg-white px-2 py-0.5 rounded-lg border border-orange-300 shadow-2xs flex items-center gap-1">
                ค่ามือรวม: <strong className="text-orange-600 text-xs">฿{totalHandFeeFromBill.toLocaleString()}</strong>
              </span>
            )}
          </div>

          {/* Quick Selection Orange Buttons */}
          <div className="grid grid-cols-3 gap-1.5">
            {HAND_FEE_PRESETS.map((preset) => {
              const selected = selectedHandFees.find(h => h.id === preset.id);
              const isSelected = !!selected;
              const Icon = preset.icon || Sparkles;
              const currentFee = computePresetFee(preset);

              return (
                <div
                  key={preset.id}
                  onClick={() => toggleHandFee(preset)}
                  className={`p-1.5 sm:p-2 rounded-xl border transition-all flex flex-col justify-between text-left relative active:scale-98 cursor-pointer select-none ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 border-orange-500 text-white shadow-sm ring-1 ring-orange-300'
                      : 'bg-white border-orange-200 text-slate-800 hover:border-orange-400 hover:bg-orange-50/50 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 w-full mb-1">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'
                    }`}>
                      <Icon size={12} />
                    </div>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded whitespace-nowrap shrink-0 ${
                      isSelected ? 'bg-white text-orange-600' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {preset.isBillCalculated ? `+฿${currentFee}` : `+฿${preset.fee}`}
                      {preset.isBillCalculated && <span className="text-[8px] font-normal opacity-85 ml-0.5">(บิล)</span>}
                    </span>
                  </div>

                  <div className="min-w-0 w-full">
                    <p className={`text-[11px] font-bold truncate leading-tight ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                      {preset.name}
                    </p>
                  </div>

                  {isSelected && (
                    <div className="mt-1 pt-1 border-t border-white/20 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[9px] font-bold text-white flex items-center gap-0.5">
                        <Check size={10} strokeWidth={3} /> เลือก
                      </span>
                      <div className="flex items-center gap-0.5 bg-white/25 rounded px-1 py-0.5">
                        <button
                          type="button"
                          onClick={() => updateHandFeeQty(preset.id, -1)}
                          className="w-3.5 h-3.5 rounded flex items-center justify-center text-white hover:bg-white/30 text-[10px] font-bold leading-none"
                          title="ลดจำนวน"
                        >
                          -
                        </button>
                        <span className="text-[10px] font-black text-white px-0.5">
                          {selected.qty || 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateHandFeeQty(preset.id, 1)}
                          className="w-3.5 h-3.5 rounded flex items-center justify-center text-white hover:bg-white/30 text-[10px] font-bold leading-none"
                          title="เพิ่มจำนวน"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Custom Hand Fee Input / Active items pills */}
          <div className="pt-0.5 flex items-center justify-between text-xs">
            {showCustomHandFeeInput ? (
              <form onSubmit={addCustomHandFee} className="w-full flex gap-1.5 items-center bg-white p-2 rounded-xl border border-orange-200">
                <input
                  type="text"
                  placeholder="ชื่อบริการ (เช่น ทรีตเมนต์พิเศษ)"
                  value={customHandFeeForm.name}
                  onChange={(e) => setCustomHandFeeForm({ ...customHandFeeForm, name: e.target.value })}
                  className="flex-1 px-2.5 py-1 text-xs border border-slate-200 rounded-lg outline-none focus:border-orange-500"
                  required
                />
                <input
                  type="number"
                  placeholder="ค่ามือ (฿)"
                  value={customHandFeeForm.fee}
                  onChange={(e) => setCustomHandFeeForm({ ...customHandFeeForm, fee: e.target.value })}
                  className="w-20 px-2.5 py-1 text-xs border border-slate-200 rounded-lg outline-none focus:border-orange-500 font-bold"
                  required
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold text-xs shadow-xs"
                >
                  เพิ่ม
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomHandFeeInput(false)}
                  className="px-2 py-1 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowCustomHandFeeInput(true)}
                className="text-[10px] font-bold text-orange-700 hover:text-orange-900 flex items-center gap-1 bg-white/70 hover:bg-white px-2 py-0.5 rounded-lg border border-orange-200 shadow-2xs"
              >
                <Plus size={11} /> ระบุค่ามือบริการอื่นๆ
              </button>
            )}

            {selectedHandFees.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedHandFees([])}
                className="text-[10px] font-bold text-rose-500 hover:underline ml-auto"
              >
                ล้างค่ามือทั้งหมด
              </button>
            )}
          </div>
        </div>

        {paymentStaff && (() => {
          const staffNames = paymentStaff.split('/').map(s => s.trim()).filter(Boolean);
          const bundleDetails = [];

          const staffIncomes = staffNames.map(staffName => {
             const emp = employees.find(e => e.name === staffName);
             const courseRate = parseFloat(emp?.commissionRate) || 0;
             const prodRate = parseFloat(emp?.productCommissionRate) || 0;
             
             let prodGross = 0;
             let courseGross = 0;

             cart.forEach(item => {
               if (item.type === 'usage' || item.type === 'claim_item' || item.isUsage || item.actionType === 'usage' || item.noCourseCommission) {
                 return;
               }
               if (isServiceStep && (Number(item.price) <= 0 || item.isUsage)) return;

               const split = splitCourseAndProductPrice(item, masterCourses);
               courseGross += split.courseGross;
               prodGross += split.prodGross;

               if (split.hasProductSet && !bundleDetails.some(b => b.cartId === (item.id || item.name))) {
                 bundleDetails.push({
                   cartId: item.id || item.name,
                   name: item.name,
                   qty: Number(item.qty) || 1,
                   coursePortion: split.coursePricePerUnit * (Number(item.qty) || 1),
                   productPortion: split.prodPricePerUnit * (Number(item.qty) || 1),
                   reason: split.splitReason
                 });
               }
             });

             const courseComm = (courseGross * (courseRate / 100)) / staffNames.length;
             const prodComm = (prodGross * (prodRate / 100)) / staffNames.length;
             const totalComm = courseComm + prodComm;
             const staffHandFee = Math.round(totalHandFeeFromBill / staffNames.length);
             const totalStaffIncome = totalComm + staffHandFee;
             return { 
               staffName, 
               courseRate, 
               prodRate, 
               courseGross: courseGross / staffNames.length, 
               prodGross: prodGross / staffNames.length, 
               courseComm, 
               prodComm, 
               totalComm, 
               staffHandFee, 
               totalStaffIncome 
             };
          });

          // 🌟 HIDE completely if no income is earned (0 Baht bill with no DF)!
          const hasAnyIncome = staffIncomes.some(s => s.totalStaffIncome > 0);
          if (!hasAnyIncome) return null;

          return (
            <div className="mt-2.5 p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-indigo-950 font-black flex items-center gap-1.5">
                  <Sparkles size={13} className="text-indigo-600" />
                  ยอดคำนวณสะสมจากบิลนี้ (แยกตามพนักงาน):
                </p>
                <div className="flex items-center gap-1.5">
                  {bundleDetails.length > 0 && (
                    <span className="text-[9px] font-bold text-pink-700 bg-pink-100 px-2 py-0.5 rounded-full border border-pink-200">
                      มีคอร์สเซตแยกค่าคอม
                    </span>
                  )}
                  {totalHandFeeFromBill > 0 && (
                    <span className="text-[9px] font-black text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full border border-orange-200">
                      มีค่ามือบริการรวม ฿{totalHandFeeFromBill.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {bundleDetails.length > 0 && (
                <div className="bg-white/80 p-2 rounded-xl border border-pink-200/70 text-[9.5px] space-y-1">
                  <div className="font-bold text-pink-800 flex items-center gap-1">
                    <span>✨ คอร์สเซตคิดแยกค่าคอม (ยอดคอร์ส / ยอดสินค้า):</span>
                  </div>
                  {bundleDetails.map((b, bIdx) => (
                    <div key={bIdx} className="text-slate-700 flex flex-wrap items-center justify-between gap-1 pl-1">
                      <span className="font-semibold text-slate-800 truncate max-w-[220px]">{b.name}</span>
                      <span className="font-mono text-slate-600">
                        คอร์ส ฿{b.coursePortion.toLocaleString()} + สินค้า ฿{b.productPortion.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-2">
                {staffIncomes.map((item, idx) => (
                  <div key={idx} className="bg-white p-2.5 rounded-xl shadow-2xs border border-indigo-100 space-y-1.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                        <span className="font-black text-slate-800 text-xs">{item.staffName}</span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          (เรทคอร์ส <b className="text-indigo-600 font-bold">{item.courseRate}%</b> | เรทสินค้า <b className="text-pink-600 font-bold">{item.prodRate}%</b>)
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold mr-1">รวมได้</span>
                        <span className="font-black text-emerald-600 text-sm">
                          ฿{item.totalStaffIncome.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                      <div className="bg-indigo-50/60 p-1.5 rounded-lg border border-indigo-100/60">
                        <div className="text-slate-500 text-[9px] font-bold">คอมคอร์ส ({item.courseRate}%)</div>
                        <div className="font-black text-indigo-900 text-xs">
                          ฿{Math.round(item.courseComm).toLocaleString()}
                          <span className="text-[9px] font-normal text-slate-500 ml-1 font-mono">
                            (ยอด ฿{Math.round(item.courseGross).toLocaleString()})
                          </span>
                        </div>
                      </div>
                      <div className="bg-pink-50/60 p-1.5 rounded-lg border border-pink-100/60">
                        <div className="text-slate-500 text-[9px] font-bold">คอมสินค้า ({item.prodRate}%)</div>
                        <div className="font-black text-pink-900 text-xs">
                          ฿{Math.round(item.prodComm).toLocaleString()}
                          <span className="text-[9px] font-normal text-slate-500 ml-1 font-mono">
                            (ยอด ฿{Math.round(item.prodGross).toLocaleString()})
                          </span>
                        </div>
                      </div>
                    </div>

                    {item.staffHandFee > 0 && (
                      <div className="flex items-center justify-between bg-amber-50/80 px-2 py-1 rounded-lg border border-amber-200 text-[10px]">
                        <span className="text-amber-900 font-bold">ค่ามือบริการ (DF):</span>
                        <span className="font-black text-amber-800">฿{item.staffHandFee.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  useEffect(() => {
    setEodData(prev => ({ ...prev, floatCash: latestFloat }));
  }, [latestFloat]);
  const [isSubmittingEod, setIsSubmittingEod] = useState(false);

  // 🌟 ส่งยอดย้อนหลัง: จำวันที่ก่อนเปิด EOD เพื่อคืนค่าตอนปิด
  const eodPrevDateRef = useRef(null);
  useEffect(() => {
    if (showEodModal) {
      if (eodPrevDateRef.current === null) eodPrevDateRef.current = posFilterDate;
    } else if (eodPrevDateRef.current !== null) {
      setPosFilterDate(eodPrevDateRef.current);
      eodPrevDateRef.current = null;
    }
  }, [showEodModal]);

  const isEodBackdated = posFilterDate !== getLocalYYYYMMDD();

  const toThDateStr = (yyyymmdd) => {
    const dObj = new Date();
    const [y, m, d] = yyyymmdd.split('-');
    dObj.setFullYear(y, m - 1, d);
    return dObj.toLocaleDateString('th-TH');
  };

  // รายงานที่ส่งไปแล้วของวันที่เลือก (กันส่งซ้ำ)
  const existingEodForDate = useMemo(() => {
    if (!posFilterDate) return [];
    const target = toThDateStr(posFilterDate);
    return dailySales.filter(d => d.branch === (globalBranch || "สำนักงานใหญ่") && d.date === target);
  }, [dailySales, globalBranch, posFilterDate]);

  const handleEodDateChange = (newDate) => {
    if (!newDate || newDate > getLocalYYYYMMDD()) return;
    setPosFilterDate(newDate);
    // เงินทอนตั้งต้น = ยอดยกไปจากรายงานล่าสุดก่อนวันที่เลือก
    const prev = [...dailySales]
      .filter(d => d.branch === (globalBranch || "สำนักงานใหญ่") && typeof d.createdAt === 'string' && d.createdAt.slice(0, 10) < newDate)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    const isToday = newDate === getLocalYYYYMMDD();
    setEodData(p => ({
      ...p,
      floatCash: isToday ? latestFloat : (prev && prev.nextDayFloat !== undefined ? prev.nextDayFloat.toString() : '1000'),
      actualCash: '',
      manualTransfer: '',
      manualTransferNote: '',
      clockOut: isToday ? p.clockOut : false,
    }));
    setEodTab('cash');
  };

  // 🌟 ส่งยอดด่วน: เปิด EOD modal อัตโนมัติ + เลือกผู้ส่งยอดให้เลย
  useEffect(() => {
    if (!autoOpenEod) return;
    quickEodActiveRef.current = true;
    quickEodSubmittedRef.current = false;
    setEodData(prev => ({ ...prev, submittedBy: autoOpenEod.employeeId || prev.submittedBy, clockOut: true }));
    setShowEodModal(true);
  }, [autoOpenEod]);

  // 🌟 ส่งยอดด่วน: เมื่อปิดหน้าต่าง EOD (ส่งสำเร็จหรือยกเลิก) → แจ้ง parent
  const quickEodShownRef = useRef(false);
  useEffect(() => {
    if (!autoOpenEod || !quickEodActiveRef.current) return;
    if (showEodModal) { quickEodShownRef.current = true; return; }
    if (quickEodShownRef.current) {
      quickEodShownRef.current = false;
      quickEodActiveRef.current = false;
      onQuickEodFinished(quickEodSubmittedRef.current);
    }
  }, [showEodModal]);

  // 🌟 คำนวณสถิติยอดขายสินค้าจาก orders และ histories เพื่อจัดอันดับ "สินค้าขายดี"
  const productSalesMap = useMemo(() => {
    const counts = new Map();

    const addCount = (key, qty) => {
      if (!key) return;
      const k = String(key).trim();
      if (!k) return;
      const q = Number(qty || 1);
      const val = isNaN(q) ? 1 : q;
      counts.set(k, (counts.get(k) || 0) + val);
      const norm = normProductStr(k);
      if (norm && norm !== k) {
        counts.set(norm, (counts.get(norm) || 0) + val);
      }
    };

    // 1. จาก orders
    (orders || []).forEach(o => {
      const status = String(o.status || '').trim();
      if (status === 'ยกเลิก' || status === 'cancelled' || status === 'refunded') return;

      const items = Array.isArray(o.cartItems) ? o.cartItems : 
                    Array.isArray(o.items) ? o.items : 
                    Array.isArray(o.line_items) ? o.line_items : [];

      if (items.length > 0) {
        items.forEach(it => {
          const qty = Number(it.qty || it.quantity || 1);
          if (it.id) addCount(it.id, qty);
          if (it.productId) addCount(it.productId, qty);
          if (it.code) addCount(it.code, qty);
          if (it.sku) addCount(it.sku, qty);
          if (it.name) addCount(it.name, qty);
        });
      } else {
        const pId = o.productId || o.id;
        const pName = o.productName || o.name;
        const qty = Number(o.qty || o.quantity || 1);
        if (pId) addCount(pId, qty);
        if (pName) addCount(pName, qty);
      }
    });

    // 2. จาก histories (ยอดขายหน้าร้าน POS)
    (histories || []).forEach(h => {
      const hStatus = String(getFuzzyKey(h, ["สถานะ", "col_7", "col_8", "col_9"]) || '').trim();
      if (h.isCancelled || hStatus === 'ยกเลิก') return;

      if (Array.isArray(h.cartItems) && h.cartItems.length > 0) {
        h.cartItems.forEach(it => {
          const qty = Number(it.qty || it.quantity || 1);
          if (it.id) addCount(it.id, qty);
          if (it.productId) addCount(it.productId, qty);
          if (it.code) addCount(it.code, qty);
          if (it.name) addCount(it.name, qty);
        });
      } else {
        const name = String(getFuzzyKey(h, ["รายการ", "ชื่อสินค้า", "สินค้า", "item", "col_8", "col_4"]) || '').trim();
        const code = String(getFuzzyKey(h, ["รหัสสินค้า", "รหัส", "code", "col_2"]) || '').trim();
        const qty = Number(getFuzzyKey(h, ["จำนวน", "qty", "col_5"]) || 1);
        if (code) addCount(code, qty);
        if (name) addCount(name, qty);
      }
    });

    return counts;
  }, [orders, histories]);

  const getProductSalesScore = (p) => {
    if (!p) return 0;
    const id = p.id;
    const name = String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2", "ชื่อ", "name"]) || '').trim();
    const code = String(getFuzzyKey(p, ["รหัส", "col_1", "code"]) || '').trim();
    const norm = normProductStr(name);

    let score = 0;
    if (id && productSalesMap.has(id)) score = Math.max(score, productSalesMap.get(id));
    if (code && productSalesMap.has(code)) score = Math.max(score, productSalesMap.get(code));
    if (name && productSalesMap.has(name)) score = Math.max(score, productSalesMap.get(name));
    if (norm && productSalesMap.has(norm)) score = Math.max(score, productSalesMap.get(norm));
    return score;
  };

  const getProductStockNum = (p) => {
    const currentBranch = globalBranch || "สำนักงานใหญ่";
    const stockVal = getBranchStock(p, currentBranch);
    const num = Number(stockVal);
    return isNaN(num) ? 0 : num;
  };

  // Filtered Inventory
  const filteredProducts = useMemo(() => {
    const filtered = products.filter(p => {
      const name = String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2", "ชื่อ", "name"]) || '').trim();
      const status = String(getFuzzyKey(p, ["สถานะ", "status", "การใช้งาน", "state"]) || '').trim();
      if (!name) return false;
      if (status === 'ร่าง' || status === 'draft' || status === 'ปิดใช้งาน' || status === 'ปิด' || status === 'ไม่แสดง' || status === 'ซ่อน') return false;
      // ซ่อนสินค้า Store Use เฉพาะโหมดขายปกติ (ไม่ใช่โหมดเบิกสินค้าและไม่ใช่โหมดนับสต๊อก)
      if (p.isStoreUseOnly && !isStockMode && !isRequisitionMode) return false;
      // กรองบริการ/คอร์ส/ทรีทเม้นท์ ที่หลุดเข้ามาในตารางสินค้า (เช่น ขัดหน้าขาว 1 ครั้ง)
      if (!isStockMode && !isRequisitionMode && isServiceOrCourseProduct(p)) return false;
      const searchStr = `${String(getFuzzyKey(p, ["รหัส", "col_1"]) || '')} ${name}`.toLowerCase();
      if (searchTerm !== '' && !searchStr.includes(searchTerm.toLowerCase())) return false;
      
      // กรองตามขั้นตอนดูแลผิว เมื่อเลือกขั้นตอนเฉพาะ
      if ((productSortMode === 'routine' || productSortMode === 'category') && selectedSkincareStep !== 'all') {
        const stepInfo = getProductSkincareStep(p);
        if (stepInfo.id !== selectedSkincareStep) return false;
      }
      return true;
    });

    return filtered.sort((a, b) => {
      const nameA = String(getFuzzyKey(a, ["ชื่อสินค้า", "col_2"]) || '');
      const nameB = String(getFuzzyKey(b, ["ชื่อสินค้า", "col_2"]) || '');

      // 🌟 เรียงอัจฉริยะตามขั้นตอนดูแลผิว (Cleanse -> Tone -> Mask -> Eye/Lip -> Serum -> Spot -> Cream -> Sunscreen -> Others)
      if (productSortMode === 'routine' || productSortMode === 'category') {
        const stepA = getProductSkincareStep(a).step;
        const stepB = getProductSkincareStep(b).step;
        if (stepA !== stepB) return stepA - stepB;
        return nameA.localeCompare(nameB, 'th');
      }

      if (productSortMode === 'alpha') {
        return nameA.localeCompare(nameB, 'th');
      }

      if (productSortMode === 'stock') {
        const stockA = getProductStockNum(a);
        const stockB = getProductStockNum(b);
        if (stockA !== stockB) return stockB - stockA; // มีสต็อกมาก่อน
        const scoreA = getProductSalesScore(a);
        const scoreB = getProductSalesScore(b);
        if (scoreA !== scoreB) return scoreB - scoreA;
        const imgA = hasPosProductImage(a, wooImagesMap) ? 1 : 0;
        const imgB = hasPosProductImage(b, wooImagesMap) ? 1 : 0;
        if (imgA !== imgB) return imgB - imgA;
        return nameA.localeCompare(nameB, 'th');
      }

      // Default: 'bestseller' (สินค้าขายดีแสดงก่อน)
      const scoreA = getProductSalesScore(a);
      const scoreB = getProductSalesScore(b);
      if (scoreA !== scoreB) return scoreB - scoreA; // 1. ขายดีที่สุดขึ้นก่อน

      const imgA = hasPosProductImage(a, wooImagesMap) ? 1 : 0;
      const imgB = hasPosProductImage(b, wooImagesMap) ? 1 : 0;
      if (imgA !== imgB) return imgB - imgA; // 2. สินค้าที่มีรูปภาพขึ้นก่อน

      const stockA = getProductStockNum(a);
      const stockB = getProductStockNum(b);
      const inStockA = stockA > 0 ? 1 : 0;
      const inStockB = stockB > 0 ? 1 : 0;
      if (inStockA !== inStockB) return inStockB - inStockA; // 3. สินค้ามีสต็อกพร้อมขายขึ้นก่อน
      if (stockA !== stockB) return stockB - stockA;

      return nameA.localeCompare(nameB, 'th');
    });
  }, [products, searchTerm, isStockMode, isRequisitionMode, productSortMode, selectedSkincareStep, productSalesMap, globalBranch, wooImagesMap]);

  // แถบขั้นตอนดูแลผิวและจำนวนสินค้าในแต่ละขั้นตอน
  const skincareStepTabs = useMemo(() => {
    const counts = { all: 0 };
    SKINCARE_STEPS.forEach(s => { counts[s.id] = 0; });

    products.forEach(p => {
      const name = String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2", "ชื่อ", "name"]) || '').trim();
      const status = String(getFuzzyKey(p, ["สถานะ", "status", "การใช้งาน", "state"]) || '').trim();
      if (!name) return;
      if (status === 'ร่าง' || status === 'draft' || status === 'ปิดใช้งาน' || status === 'ปิด' || status === 'ไม่แสดง' || status === 'ซ่อน') return;
      if (p.isStoreUseOnly && !isStockMode && !isRequisitionMode) return;
      if (!isStockMode && !isRequisitionMode && isServiceOrCourseProduct(p)) return;
      const searchStr = `${String(getFuzzyKey(p, ["รหัส", "col_1"]) || '')} ${name}`.toLowerCase();
      if (searchTerm !== '' && !searchStr.includes(searchTerm.toLowerCase())) return;

      counts.all++;
      const stepInfo = getProductSkincareStep(p);
      counts[stepInfo.id] = (counts[stepInfo.id] || 0) + 1;
    });

    return [
      { id: 'all', label: 'ทั้งหมด', count: counts.all, icon: '✨' },
      ...SKINCARE_STEPS.filter(s => counts[s.id] > 0).map(s => ({
        id: s.id,
        label: s.shortLabel,
        fullLabel: s.label,
        count: counts[s.id],
        icon: s.icon
      }))
    ];
  }, [products, searchTerm, isStockMode, isRequisitionMode]);

  // จัดกลุ่มสินค้าตามขั้นตอนดูแลผิว เพื่อแสดงหัวข้อคั่นในโหมดขั้นตอนผิว
  const groupedProductsByStep = useMemo(() => {
    const map = new Map();
    SKINCARE_STEPS.forEach(s => map.set(s.id, { step: s, items: [] }));

    filteredProducts.forEach(p => {
      const s = getProductSkincareStep(p);
      if (!map.has(s.id)) {
        map.set(s.id, { step: s, items: [] });
      }
      map.get(s.id).items.push(p);
    });

    return Array.from(map.values()).filter(g => g.items.length > 0);
  }, [filteredProducts]);

  const getCourseSortTimestamp = (item) => {
    if (item.updatedAt) {
      const t = typeof item.updatedAt === 'object' && item.updatedAt.seconds ? item.updatedAt.seconds * 1000 : new Date(item.updatedAt).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    if (item.createdAt) {
      const t = typeof item.createdAt === 'object' && item.createdAt.seconds ? item.createdAt.seconds * 1000 : new Date(item.createdAt).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    if (Array.isArray(item.promoOptions) && item.promoOptions.length > 0) {
      return new Date('2026-11-21T00:00:00+07:00').getTime();
    }
    return 0;
  };

  const filteredCourses = useMemo(() => {
    return masterCourses.filter(mc => {
      const name = String(getFuzzyKey(mc, ["ชื่อคอส", "col_4"]) || '').trim();
      const status = String(getFuzzyKey(mc, ["สถานะ", "status", "การใช้งาน", "state"]) || '').trim();
      if (!name) return false;
      if (status === 'ร่าง' || status === 'draft' || status === 'ปิดใช้งาน' || status === 'ปิด' || status === 'ไม่แสดง' || status === 'ซ่อน') return false;
      const qty = String(getFuzzyKey(mc, ["จำนวนครั้ง", "col_7"]) || '').trim();
      if (qty === '1') return false;
      if (getCourseCategory(mc) === 'old_courses') return false;
      // Facial treatment courses (F-A to F-J) are handled in unified treatment cards with session options
      if (getCourseCategory(mc) === 'facial') return false;
      const searchStr = `${String(getFuzzyKey(mc, ["รหัสคอส", "col_1"]) || '')} ${name}`.toLowerCase();
      return searchTerm === '' || searchStr.includes(searchTerm.toLowerCase());
    }).sort((a, b) => {
      const tA = getCourseSortTimestamp(a);
      const tB = getCourseSortTimestamp(b);
      if (tA !== tB) return tB - tA;
      return (b.id || '').localeCompare(a.id || '');
    });
  }, [masterCourses, searchTerm]);

  const filteredSingleCourses = useMemo(() => {
    return masterCourses.filter(mc => {
      const name = String(getFuzzyKey(mc, ["ชื่อคอส", "col_4"]) || '').trim();
      const status = String(getFuzzyKey(mc, ["สถานะ", "status", "การใช้งาน", "state"]) || '').trim();
      if (!name) return false;
      if (status === 'ร่าง' || status === 'draft' || status === 'ปิดใช้งาน' || status === 'ปิด' || status === 'ไม่แสดง' || status === 'ซ่อน') return false;
      if (getCourseCategory(mc) === 'old_courses') return false;

      const qty = String(getFuzzyKey(mc, ["จำนวนครั้ง", "col_7", "col_6"]) || '').trim();
      const isFacial = getCourseCategory(mc) === 'facial';
      // For facial treatment courses, allow all session tiers (1, 5, 10 ครั้ง)
      // For other courses, allow qty === '1'
      if (!isFacial && qty !== '1') return false;

      const searchStr = `${String(getFuzzyKey(mc, ["รหัสคอส", "col_1"]) || '')} ${name}`.toLowerCase();
      return searchTerm === '' || searchStr.includes(searchTerm.toLowerCase());
    }).sort((a, b) => {
      const tA = getCourseSortTimestamp(a);
      const tB = getCourseSortTimestamp(b);
      if (tA !== tB) return tB - tA;
      return (b.id || '').localeCompare(a.id || '');
    });
  }, [masterCourses, searchTerm]);

  const groupedSingleCourses = useMemo(() => {
    const groups = {};
    filteredSingleCourses.forEach(c => {
      const rawName = String(getFuzzyKey(c, ["ชื่อคอส", "col_4", "ชื่อสินค้า", "col_2"]) || '').trim();
      let baseName = rawName
        .replace(/\(ซื้อเพิ่มโปร\)/g, '')
        .replace(/\(\s*\d+\s*ครั้ง\s*\)/g, '')
        .replace(/\d+\s*ครั้ง/g, '')
        .trim();
      if (!baseName) baseName = rawName; // fallback
      
      const code = String(getFuzzyKey(c, ["รหัสคอส", "col_1"]) || '');
      const baseCode = code.replace(/\d+$/, '');
      const category = getCourseCategory(c);
      const groupKey = `${category}_${baseCode || baseName}`;
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          baseName,
          category,
          items: [],
          primaryCode: baseCode || code
        };
      }
      groups[groupKey].items.push(c);
    });
    
    // Sort and deduplicate items inside each group (prevent duplicate cards/buttons)
    Object.values(groups).forEach(g => {
       const bestByKey = new Map();

       g.items.forEach(c => {
         const name = String(getFuzzyKey(c, ["ชื่อคอส", "col_4", "ชื่อสินค้า", "col_2"]) || '').trim();
         const cleanName = name
           .replace(/\(ซื้อเพิ่มโปร\)/g, '')
           .replace(/\(\s*\d+\s*ครั้ง\s*\)/g, '')
           .replace(/\d+\s*ครั้ง/g, '')
           .replace(/[\s\-_()（）[\]]/g, '')
           .toLowerCase();
         const price = parseNumber(getFuzzyKey(c, ["ราคา", "ราคาขาย", "col_5"]));
         const isPromo = name.includes('ซื้อเพิ่มโปร');
         const sess = String(getFuzzyKey(c, ["จำนวนครั้ง", "col_7", "col_6"]) || (name.match(/(\d+)\s*ครั้ง/) ? name.match(/(\d+)\s*ครั้ง/)[1] : '1')).trim();
         // Dedup by cleanName + promo status + session count + price
         const dedupKey = `${cleanName}_${isPromo ? 'promo' : sess}_${price}`;

         // Priority: prefer specific numbered code like F-A1 over generic F-A for 1 session
         const code = String(getFuzzyKey(c, ["รหัสคอส", "col_1"]) || '').trim();
         let priority = 0;
         if (/\d+$/.test(code)) priority += 3;
         if (code) priority += 2;
         if (name.includes('(')) priority += 1;

         if (!bestByKey.has(dedupKey)) {
           bestByKey.set(dedupKey, { item: c, priority });
         } else {
           const existing = bestByKey.get(dedupKey);
           if (priority > existing.priority) {
             bestByKey.set(dedupKey, { item: c, priority });
           }
         }
       });

       const uniqueItems = Array.from(bestByKey.values()).map(v => v.item);

       uniqueItems.sort((a, b) => {
          const nameA = String(getFuzzyKey(a, ["ชื่อคอส", "col_4", "ชื่อสินค้า", "col_2"]) || '');
          const nameB = String(getFuzzyKey(b, ["ชื่อคอส", "col_4", "ชื่อสินค้า", "col_2"]) || '');
          const isPromoA = nameA.includes('ซื้อเพิ่มโปร');
          const isPromoB = nameB.includes('ซื้อเพิ่มโปร');
          if (isPromoA !== isPromoB) return isPromoA ? 1 : -1; // regular first, promo second

          const sessA = parseInt(getFuzzyKey(a, ["จำนวนครั้ง", "col_7", "col_6"])) || (nameA.match(/(\d+)\s*ครั้ง/) ? parseInt(nameA.match(/(\d+)\s*ครั้ง/)[1]) : 1);
          const sessB = parseInt(getFuzzyKey(b, ["จำนวนครั้ง", "col_7", "col_6"])) || (nameB.match(/(\d+)\s*ครั้ง/) ? parseInt(nameB.match(/(\d+)\s*ครั้ง/)[1]) : 1);
          if (sessA !== sessB) return sessA - sessB;

          const priceA = parseNumber(getFuzzyKey(a, ["ราคา", "ราคาขาย", "col_5"]));
          const priceB = parseNumber(getFuzzyKey(b, ["ราคา", "ราคาขาย", "col_5"]));
          return priceA - priceB;
       });

       g.items = uniqueItems;
    });
    
    return Object.values(groups);
  }, [filteredSingleCourses]);

  const courseCounts = useMemo(() => {
    const counts = { all: 0 };
    filteredCourses.forEach(c => {
      const cat = getCourseCategory(c);
      if (cat !== 'old_courses') {
        counts.all = (counts.all || 0) + 1;
        counts[cat] = (counts[cat] || 0) + 1;
        const code = String(getFuzzyKey(c, ["รหัสคอส", "col_1"]) || c.id || '');
        const name = String(getFuzzyKey(c, ["ชื่อคอส", "col_4"]) || '');
        if ((code.toLowerCase() === 'acmm' || name.includes('เคลียร์สิว')) && cat !== 'acne_clear') {
          counts.acne_clear = (counts.acne_clear || 0) + 1;
        }
        if ((code.includes('ACNE') || code.includes('ACTIVE') || name.includes('สิว/ฝ้า') || name.includes('แอคทีฟ')) && cat !== 'acne_sets') {
          counts.acne_sets = (counts.acne_sets || 0) + 1;
        }
        if ((code.includes('IPL') || name.includes('IPL')) && cat !== 'ipl') {
          counts.ipl = (counts.ipl || 0) + 1;
        }
        if ((code.includes('MACH') || name.includes('เครื่อง')) && cat !== 'machine') {
          counts.machine = (counts.machine || 0) + 1;
        }
        if (Array.isArray(c.promoOptions) && c.promoOptions.length > 0 && cat !== 'promo') {
          counts.promo = (counts.promo || 0) + 1;
        }
      }
    });
    groupedSingleCourses.forEach(g => {
      if (g.category !== 'old_courses') {
        counts.all = (counts.all || 0) + 1;
        counts[g.category] = (counts[g.category] || 0) + 1;
      }
    });
    // 🌟 รายการหัตถการรายครั้ง (จี้ไฝ / ประเมินราคา)
    counts.single_session = (counts.single_session || 0) + 1;
    counts.all = (counts.all || 0) + 1;
    return counts;
  }, [filteredCourses, groupedSingleCourses]);

  const filteredMyCourses = useMemo(() => {
    if (!selectedCustomer) return [];
    const isWalkIn = Boolean(selectedCustomer.isWalkIn);
    const phone = String(getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3"]) || '').trim();
    const name = String(selectedCustomer.computedName || getFuzzyKey(selectedCustomer, ["ชื่อ", "col_1"]) || '').trim().toLowerCase();
    const cleanPhone = phone.replace(/\D/g, '');

    // 🌟 ลูกค้าวอคอินเป็นคนละคน ไม่ดึงคอร์สของวอคอินคนอื่นมาแสดงทั้งหมด ยกเว้นพิมพ์ค้นหาเลขที่คอร์สเจาะจง
    if (isWalkIn && !searchTerm.trim()) {
      return [];
    }

    return courses.filter(c => {
      if (!c.computedRemainQty || c.computedRemainQty <= 0) return false;
      
      const courseName = String(getFuzzyKey(c, ["ชื่อคอส", "ชื่อคอร์ส", "col_8"]) || '').toLowerCase();
      const isCreditCourse = courseName.includes('วงเงิน') || courseName.includes('เติมเงิน') || courseName.includes('เครดิต') || courseName.includes('voucher') || courseName.includes('บัตรกำนัล') || courseName.includes('ฝากเงิน');
      if (isCreditCourse) return false;

      const cPhone = String(getFuzzyKey(c, ["เบอร์โทร", "col_1"]) || '').trim();
      const cCleanPhone = cPhone.replace(/\D/g, '');
      const cBuyer = String(getFuzzyKey(c, ["ผู้ซื้อคอส", "ชื่อลูกค้า", "col_9", "col_2"]) || '').trim().toLowerCase();
      const courseNo = String(getFuzzyKey(c, ["เลขที่ใบคอส", "col_2"]) || '').toLowerCase();
      const isCourseWalkIn = c.isWalkIn === true || cBuyer.includes('walk-in') || cBuyer.includes('วอคอิน') || cBuyer.includes('ทั่วไป') || cPhone === '-' || !cPhone;

      let isMatch = false;
      if (cleanPhone.length >= 6 && cCleanPhone.length >= 6 && cleanPhone === cCleanPhone) {
        isMatch = true;
      } else if (phone && phone !== '-' && cPhone === phone) {
        isMatch = true;
      } else if (name && !name.includes('ลูกค้าทั่วไป') && cBuyer === name) {
        isMatch = true;
      } else if (isWalkIn) {
        if (searchTerm.trim() !== '') {
          isMatch = isCourseWalkIn && (courseNo.includes(searchTerm.toLowerCase()) || cBuyer.includes(searchTerm.toLowerCase()));
        } else {
          isMatch = false;
        }
      }

      if (!isMatch) return false;

      const searchStr = `${courseNo} ${courseName} ${cBuyer} ${cPhone}`.toLowerCase();
      return searchTerm === '' || searchStr.includes(searchTerm.toLowerCase());
    });
  }, [courses, selectedCustomer, searchTerm]);

  // คอร์สที่เหลืออยู่ของลูกค้า (ที่ไม่รวมคอร์สที่กำลังตัดยอดอยู่ในตะกร้า)
  const otherAvailableCustomerCourses = useMemo(() => {
    const currentUsageIds = new Set(cart.filter(i => i.type === 'usage').map(i => i.id));
    return (filteredMyCourses || []).filter(c => 
      !currentUsageIds.has(c.id) && 
      Number(c.computedRemainQty || 0) > 0 &&
      c.computedStatus !== 'ใช้ครบแล้ว'
    );
  }, [filteredMyCourses, cart]);

  // 🌟 ประวัติคอร์สทั้งหมดของลูกค้า (สำหรับฟังก์ชัน "ต่อคอสเดิม" ในหน้าให้บริการ/ตัดคอร์ส)
  const customerAllCourses = useMemo(() => {
    if (!selectedCustomer || selectedCustomer.isWalkIn) return [];
    const phone = String(selectedCustomer.computedPhone || getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3"]) || '').trim();
    const cleanPhone = phone.replace(/\D/g, '');
    const name = String(selectedCustomer.computedName || getFuzzyKey(selectedCustomer, ["ชื่อ", "col_1"]) || '').trim().toLowerCase();

    return courses.filter(c => {
      const courseName = String(getFuzzyKey(c, ["ชื่อคอส", "ชื่อคอร์ส", "col_8"]) || '').toLowerCase();
      const isCreditCourse = courseName.includes('วงเงิน') || courseName.includes('เติมเงิน') || courseName.includes('เครดิต') || courseName.includes('voucher') || courseName.includes('บัตรกำนัล') || courseName.includes('ฝากเงิน');
      if (isCreditCourse) return false;

      const cPhone = String(getFuzzyKey(c, ["เบอร์โทร", "col_1"]) || '').trim();
      const cCleanPhone = cPhone.replace(/\D/g, '');
      const cBuyer = String(getFuzzyKey(c, ["ผู้ซื้อคอส", "ชื่อลูกค้า", "col_9", "col_2"]) || '').trim().toLowerCase();

      if (cleanPhone.length >= 6 && cCleanPhone.length >= 6 && cleanPhone === cCleanPhone) return true;
      if (phone && phone !== '-' && cPhone === phone) return true;
      if (name && !name.includes('ลูกค้าทั่วไป') && cBuyer === name) return true;
      return false;
    });
  }, [courses, selectedCustomer]);

  // 🌟 รายการคอร์สและสินค้าสำหรับค้นหา/เลือกเพิ่มใน Modal ตัดคอร์ส
  const filteredModalMasterCourses = useMemo(() => {
    if (!masterCourses || !Array.isArray(masterCourses)) return [];
    const search = (modalCourseSearch || modalServiceSearch).trim().toLowerCase();
    return masterCourses.filter(mc => {
      const name = String(getFuzzyKey(mc, ["ชื่อคอส", "col_4"]) || mc.name || '').toLowerCase();
      const code = String(getFuzzyKey(mc, ["รหัสคอส", "col_1", "รหัส"]) || mc.code || '').toLowerCase();
      if (!search) return true;
      return name.includes(search) || code.includes(search);
    });
  }, [masterCourses, modalCourseSearch, modalServiceSearch]);

  const filteredModalProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) return [];
    const search = (modalProductSearch || modalServiceSearch).trim().toLowerCase();
    return products.filter(p => {
      const name = String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2"]) || p.name || '').toLowerCase();
      const code = String(getFuzzyKey(p, ["รหัสสินค้า", "col_1"]) || p.code || '').toLowerCase();
      if (!search) return true;
      return name.includes(search) || code.includes(search);
    });
  }, [products, modalProductSearch, modalServiceSearch]);

  const extraPaidItems = useMemo(() => {
    return cart.filter(i => i.type !== 'usage' && i.type !== 'claim_item' && (Number(i.price) > 0 || i.type === 'service' || i.type === 'product' || i.type === 'course'));
  }, [cart]);

  const extraPaidItemsTotal = useMemo(() => {
    return extraPaidItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 1), 0);
  }, [extraPaidItems]);

  const filteredPendingPayments = useMemo(() => {
    if (!selectedCustomer) return [];
    const phone = String(getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3"]) || '').trim();
    const name = String(getFuzzyKey(selectedCustomer, ["ชื่อ", "col_1"]) || '').trim().toLowerCase();
    
    return courses.filter(c => {
      const cPhone = String(getFuzzyKey(c, ["เบอร์โทร", "col_1"]) || '').trim();
      const cName = String(getFuzzyKey(c, ["ผู้ซื้อคอส", "ชื่อลูกค้า", "col_9", "col_2"]) || '').trim().toLowerCase();
      
      const phoneMatch = phone && cPhone && cPhone === phone;
      const nameMatch = name && cName && cName === name;
      
      if (!phoneMatch && !nameMatch) return false;
      
      const pendingAmt = c.computedPendingAmount || 0;
      if (pendingAmt <= 0) return false;
      return true;
    });
  }, [courses, selectedCustomer]);

  // Auto-add pending payments to cart when customer is selected
  const autoAddedDebtCustomerRef = useRef(null);

  useEffect(() => {
    if (selectedCustomer) {
      if (filteredPendingPayments.length > 0 && autoAddedDebtCustomerRef.current !== selectedCustomer.id) {
        setCart(prev => {
          let newCart = [...prev];
          let addedCount = 0;
          filteredPendingPayments.forEach(c => {
             const debtId = `debt_${c.id}`;
             if (!newCart.some(item => item.id === debtId)) {
                const pendingAmt = c.computedPendingAmount || 0;
                newCart.push({ 
                  id: debtId, 
                  name: `ชำระค้าง: ${String(getFuzzyKey(c, ["เลขที่ใบคอส", "col_2"]))}`, 
                  price: pendingAmt, 
                  qty: 1, 
                  type: 'debt_payment', 
                  maxQty: 1, 
                  originalItem: c, 
                  isManualPrice: true 
                });
                addedCount++;
             }
          });
          if (addedCount > 0) {
             setTimeout(() => showToast(`นำรายการค้างชำระลงตะกร้าอัตโนมัติแล้ว`, 'info'), 300);
          }
          return newCart;
        });
        autoAddedDebtCustomerRef.current = selectedCustomer.id;
      } else if (filteredPendingPayments.length === 0) {
        autoAddedDebtCustomerRef.current = selectedCustomer.id;
      }
    } else {
      autoAddedDebtCustomerRef.current = null;
    }
  }, [selectedCustomer, filteredPendingPayments]);

  const filteredCustomers = useMemo(() => {
    const filterOutWalkIn = (list) => (list || []).filter(c => {
      if (c.isWalkIn) return false;
      const name = String(c.computedName || getFuzzyKey(c, ["ชื่อ", "col_1"]) || '').toLowerCase();
      return !name.includes('walk-in') && !name.includes('วอคอิน') && !name.includes('ลูกค้าทั่วไป');
    });
    if (!customerSearch) return filterOutWalkIn(customers).slice(0, 10);
    return filterOutWalkIn(customers).filter(c => {
      const searchStr = `${String(getFuzzyKey(c, ["ชื่อ", "col_1"]) || '')} ${String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '')}`.toLowerCase();
      return searchStr.includes(customerSearch.toLowerCase());
    }).slice(0, 10);
  }, [customers, customerSearch]);

  const getCustomerAccumulatedAmount = (c) => {
    if (!c || c.isWalkIn) return 0;
    const cName = String(getFuzzyKey(c, ["ชื่อ", "col_1", "computedName"]) || '').trim().toLowerCase();
    if (cName.includes('walk-in') || cName.includes('วอคอิน') || cName.includes('ลูกค้าทั่วไป')) return 0;
    const cPhone = String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '').trim();
    if (!cPhone || cPhone === '-' || cPhone === 'ไม่มี') return 0;
    
    let historyEarned = 0;
    let historySpent = 0;
    
    histories.forEach(h => {
        if (h.isCancelled || String(getFuzzyKey(h, ["สถานะ", "col_7", "col_8", "col_9"]) || '') === 'ยกเลิก') return;
        const hName = String(getFuzzyKey(h, ["ชื่อลูกค้า", "col_2"]) || '').trim().toLowerCase();
        if (hName.includes('walk-in') || hName.includes('วอคอิน') || hName.includes('ลูกค้าทั่วไป')) return;
        const hPhoneNum = String(getFuzzyKey(h, ["เบอร์โทร", "col_3"]) || '').trim();
        if ((cName && hName === cName) || (cPhone && hPhoneNum === cPhone)) {
            const type = String(getFuzzyKey(h, ["ประเภท", "col_4"]) || '');
            const amt = parseNumber(getFuzzyKey(h, ["ยอดเงิน", "ยอดจัดซื้อ", "ยอดสินค้า", "ยอด", "col_19"]));
            if (amt > 0) {
                if (type.includes('เบิก') || type.includes('จ่าย') || type.includes('หัก')) {
                    historySpent += amt;
                } else {
                    historyEarned += amt;
                }
            }
        }
    });

    const oldAmount = parseNumber(getFuzzyKey(c, ["ยอดสะสม", "col_13"]));
    return oldAmount + historyEarned - historySpent;
  };

  const checkCustomerVipStatus = (c) => getCustomerAccumulatedAmount(c) >= 5000;

  const vipStats = useMemo(() => {
    if (!selectedCustomer) return { isVip: false, amount: 0 };
    if (selectedCustomer.isWalkIn) return { isVip: false, amount: 0 };
    const cName = String(selectedCustomer.computedName || getFuzzyKey(selectedCustomer, ["ชื่อ", "col_1"]) || '').toLowerCase();
    if (cName.includes('walk-in') || cName.includes('วอคอิน') || cName.includes('ลูกค้าทั่วไป')) {
      return { isVip: false, amount: 0 };
    }
    // Use the computed amount from App.jsx if available to ensure consistency
    const amt = selectedCustomer.realAccumulatedAmount !== undefined 
                ? selectedCustomer.realAccumulatedAmount 
                : getCustomerAccumulatedAmount(selectedCustomer);
    return { isVip: amt >= 5000, amount: amt };
  }, [selectedCustomer, histories]);

  const isVipCustomer = useMemo(() => {
    if (!selectedCustomer) return orderChannel === 'shopee';
    if (selectedCustomer.isWalkIn) {
      // สำหรับลูกค้า Walk-in สิทธิ์สมาชิกจะเปิดเฉพาะเมื่อพนักงานจงใจกดปุ่ม "สิทธิ์สมาชิก" หรือ toggle เองเท่านั้น ไม่เด้งจากยอดสะสม
      return Boolean(selectedCustomer.hasMemberCard || selectedCustomer.isMemberDiscount);
    }
    return orderChannel === 'shopee' || vipStats.isVip || Boolean(selectedCustomer.isApproved === true || selectedCustomer.hasMemberCard === true || selectedCustomer.isMemberDiscount === true);
  }, [selectedCustomer, orderChannel, vipStats]);

  const customerCreditBalance = useMemo(() => {
    if (!selectedCustomer || selectedCustomer.isWalkIn) return 0;
    const phone = String(getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3"]) || '').trim();
    const cleanPhone = phone.replace(/\D/g, '');
    if (!phone || phone === '-' || phone === 'ไม่มี' || cleanPhone.length < 9) return 0;
    // Find all courses belonging to this customer
    const myCourses = courses.filter(c => {
      if (c.isWalkIn) return false;
      const cPhone = String(getFuzzyKey(c, ["เบอร์โทร", "col_1"]) || '').trim();
      return cPhone && cPhone !== '-' && cPhone === phone;
    });
    // Sum the computedRemainCredit
    return myCourses.reduce((sum, c) => sum + (c.computedRemainCredit || 0), 0);
  }, [selectedCustomer, courses]);

  const customerPendingBalance = useMemo(() => {
    if (!selectedCustomer || selectedCustomer.isWalkIn) return 0;
    return filteredPendingPayments.reduce((sum, c) => sum + (c.computedPendingAmount || 0), 0);
  }, [filteredPendingPayments, selectedCustomer]);

  const todaySales = useMemo(() => {
    const posFilterDateObj = new Date();
    if (posFilterDate) {
      const [y, m, d] = posFilterDate.split('-');
      posFilterDateObj.setFullYear(y, m - 1, d);
    }
    const today = posFilterDateObj.toLocaleDateString('th-TH');
    return histories.reduce((sum, h) => {
      const hDate = String(getFuzzyKey(h, ["วันที่", "col_1"]) || '');
      const hBranch = String(getFuzzyKey(h, ["สาขา", "col_21"]) || '');
      const status = String(getFuzzyKey(h, ["สถานะ", "col_7", "col_8", "col_9"]) || '');
      const type = String(getFuzzyKey(h, ["ประเภท", "col_4"]) || '');
      
      if (hDate === today && !h.isCancelled && status !== 'ยกเลิก' && (!globalBranch || normalizeBranchName(hBranch) === normalizeBranchName(globalBranch))) {
        const amt = parseNumber(getFuzzyKey(h, ["ยอดเงิน", "ยอดจัดซื้อ", "ยอดสินค้า", "ยอด", "col_19"]));
        if ((type.includes('ซื้อสินค้า') || type.includes('ซื้อคอร์ส')) && !type.includes('PO')) {
            return sum + amt;
        }
      }
      return sum;
    }, 0);
  }, [histories, globalBranch, posFilterDate]);

  const todaySalesBreakdown = useMemo(() => {
    const posFilterDateObj = new Date();
    if (posFilterDate) {
      const [y, m, d] = posFilterDate.split('-');
      posFilterDateObj.setFullYear(y, m - 1, d);
    }
    const today = posFilterDateObj.toLocaleDateString('th-TH');
    let cash = 0;
    let transfer = 0;
    let cod = 0;
    let credit = 0;
    let online = 0;
    let productSalesAmt = 0;
    let courseSalesAmt = 0;
    let manualSalesAmt = 0;
    const transferDetails = [];
    const pendingDetails = [];
    const allSalesDetails = [];

    const UNPAID_ORDER_STATUSES = ['รอชำระเงิน', 'รอตรวจสอบ', 'รอตรวจสอบยอดโอน', 'รอดำเนินการ', 'รอประเมินราคา', 'ยกเลิก'];
    const normGlobalBranch = normalizeBranchName(globalBranch);

    orders.forEach(o => {
      const isOldPO = (o.courseName || '').includes('[ซื้อเข้า') || (o.courseName || '').includes('[เบิกจาก');
      const oStatus = String(o.status || '').trim();
      if (
        o.transactionType === 'owner_purchase' ||
        o.transactionType === 'branch_requisition' ||
        isOldPO ||
        o.source === 'POS_Parked' ||
        o.mergedIntoPosOrderNo ||
        UNPAID_ORDER_STATUSES.includes(oStatus)
      ) return;
      if (!o.createdAt) return;
      const oDate = new Date(o.createdAt).toLocaleDateString('th-TH');
      const oBranch = normalizeBranchName(o.branch || '');
      
      if (oDate === today && (!normGlobalBranch || oBranch === normGlobalBranch)) {
         const paymentStr = String(o.paymentMethod || '');
         let tAmt = 0;
         let tItems = [];
         if (o.courseName) {
            tItems = [{name: o.courseName, qty: 1}];
         } else if (o.cartItems && Array.isArray(o.cartItems)) {
            tItems = o.cartItems.map(c => ({ name: c.name, qty: c.qty || 1 }));
         }
         
         if (paymentStr.includes('เงินสด:')) {
            const match = paymentStr.match(/เงินสด:\s*([\d.]+)/);
            if (match) cash += parseFloat(match[1]);
         }
         if (paymentStr.includes('โอนเงิน:')) {
            const match = paymentStr.match(/โอนเงิน:\s*([\d.]+)/);
            if (match) {
              tAmt = parseFloat(match[1]);
              transfer += tAmt;
            }
         }
         let currentCod = 0;
         if (paymentStr.includes('ค้าง\/COD:')) {
            const match = paymentStr.match(/ค้าง\/COD:\s*([\d.]+)/);
            if (match) currentCod += parseFloat(match[1]);
         }
         if (paymentStr === 'เงินสด') cash += parseNumber(o.price);
         if (paymentStr === 'โอนเงิน') {
            tAmt = parseNumber(o.price);
            transfer += tAmt;
         }
         if (paymentStr === 'ค้าง/COD') {
            currentCod += parseNumber(o.price);
         }
         
         if (currentCod > 0) {
             cod += currentCod;
             if (o.orderChannel === 'shopee') {
                 online += currentCod;
             }
             pendingDetails.push({
                 id: o.id || Math.random().toString(),
                 time: new Date(o.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
                 amount: currentCod,
                 customer: o.customerName || getFuzzyKey(o, ["ชื่อลูกค้า", "ลูกค้า", "customer"]) || 'ลูกค้าทั่วไป',
                 items: tItems.length > 0 ? tItems.map(i => `${i.name} x${i.qty || 1}`).join(', ') : 'สินค้า/บริการ',
                 channel: o.orderChannel === 'shopee' ? 'Shopee' : 'COD'
             });
         }
         
         if (tAmt > 0) {
           transferDetails.push({
             id: o.id || Math.random().toString(),
             time: new Date(o.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
             amount: tAmt,
             customer: o.customerName || getFuzzyKey(o, ["ชื่อลูกค้า", "ลูกค้า", "customer"]) || 'ลูกค้าทั่วไป',
             items: tItems.length > 0 ? tItems.map(i => `${i.name} x${i.qty || 1}`).join(', ') : 'สินค้า/บริการ'
           });
         }
         
         let orderTotal = parseNumber(o.price);
         if (o.orderChannel === 'shopee' && o.shopeeNetReceived !== undefined) {
             orderTotal = parseNumber(o.shopeeNetReceived);
         }
         let pSum = 0;
         let cSum = 0;
         let mSum = 0;
         if (o.cartItems && Array.isArray(o.cartItems) && o.cartItems.length > 0) {
             let rawPSum = 0;
             let rawMSum = 0;
             let totalRaw = 0;
             o.cartItems.forEach(item => {
                 const lineTotal = parseNumber(item.price) * parseNumber(item.qty);
                 totalRaw += lineTotal;
                 if (item.type === 'service') rawMSum += lineTotal;
                 else if (item.type !== 'course' && item.type !== 'debt_payment' && item.type !== 'usage') rawPSum += lineTotal;
             });
             if (totalRaw > 0) {
                 pSum = orderTotal * (rawPSum / totalRaw);
                 mSum = orderTotal * (rawMSum / totalRaw);
             } else if (rawPSum > 0) {
                 pSum = orderTotal;
             }
             cSum = Math.max(0, orderTotal - pSum - mSum);
         } else if (o.courseName) {
             cSum = orderTotal;
         } else {
             pSum = orderTotal;
         }
         productSalesAmt += pSum;
         courseSalesAmt += cSum;
         manualSalesAmt += mSum;
         
         allSalesDetails.push({
             id: o.id || Math.random().toString(),
             orderNo: o.orderNo || '-',
             time: new Date(o.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
             customer: o.customerName || getFuzzyKey(o, ["ชื่อลูกค้า", "ลูกค้า", "customer"]) || 'ลูกค้าทั่วไป',
             details: tItems.length > 0 ? tItems : [{ name: 'สินค้า/บริการ', qty: 1 }],
             amount: parseNumber(o.price),
             paymentStr: paymentStr
         });
      }
    });

    histories.forEach(h => {
      const hStatus = String(getFuzzyKey(h, ["สถานะ", "col_7", "col_8", "col_9"]) || '').trim();
      if (h.isCancelled || hStatus === 'ยกเลิก') return;
      const hDate = String(getFuzzyKey(h, ["วันที่", "col_1"]) || '').trim();
      const hBranch = normalizeBranchName(h["สาขา"] || "เฉวง");
      if (hDate === today && (!normGlobalBranch || hBranch === normGlobalBranch)) {
         const type = String(getFuzzyKey(h, ["ประเภท", "col_4"]) || '');
         if (type === "เบิกสินค้า" || type === "เบิกใช้เครดิต") {
            const amt = parseNumber(getFuzzyKey(h, ["ยอดเบิก", "ยอดเงิน", "ยอดจัดซื้อ", "ยอด", "col_19"]));
            credit += amt;
         }
         if (type.includes("ใช้คอร์ส") || type.includes("หักคอร์ส") || type.includes("ตัดคอร์ส")) {
             allSalesDetails.push({
                 id: h.id || Math.random().toString(),
                 orderNo: h.orderNo || '-',
                 time: h.createdAt ? new Date(h.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-',
                 customer: getFuzzyKey(h, ["ชื่อลูกค้า", "ลูกค้า", "col_3"]) || '-',
                 details: [{ name: `ใช้คอร์ส: ${getFuzzyKey(h, ["รายการ", "คอร์ส", "col_8"]) || type}`, qty: 1 }],
                 amount: 0,
                 paymentStr: 'ตัดคอร์ส'
             });
         }
      }
    });

    // Sort allSalesDetails by time
    allSalesDetails.sort((a, b) => a.time.localeCompare(b.time));

    return { cash, transfer, cod, credit, transferDetails, pendingDetails, allSalesDetails, productSalesAmt, courseSalesAmt, manualSalesAmt, online };
  }, [orders, histories, globalBranch, posFilterDate]);

  // 🌟 คำนวณยอดขายรวมจริงวันนี้ และจำนวนบิลสำหรับแถบแสดงยอดขาย
  const totalTodayRevenue = useMemo(() => {
    const fromBreakdown = (todaySalesBreakdown?.cash || 0) + (todaySalesBreakdown?.transfer || 0) + (todaySalesBreakdown?.cod || 0) + (todaySalesBreakdown?.credit || 0);
    return fromBreakdown > 0 ? fromBreakdown : (todaySales || 0);
  }, [todaySalesBreakdown, todaySales]);

  const todayBillCount = todaySalesBreakdown?.allSalesDetails?.length || 0;

  // 🌟 เจ้าของร้าน หรือ "ส่งยอดด่วน" จากหน้าล็อกอิน ใช้ฟีเจอร์ส่งยอดเหมือนกัน (กรอกยอดโอนเอง / ส่งยอด 0 บาท)
  const isOwnerRole = globalRole === 'owner';
  const canOwnerEod = isOwnerRole || !!autoOpenEod;

  // 🌟 เจ้าของร้านส่งยอดได้แม้ไม่มีรายการขาย (เช่น ร้านปิด / ส่งย้อนหลัง)
  const isEodNoSales = !((todaySalesBreakdown?.cash || 0) + (todaySalesBreakdown?.transfer || 0) + (todaySalesBreakdown?.credit || 0) + (todaySalesBreakdown?.cod || 0));
  const isOwnerZeroEod = canOwnerEod && isEodNoSales;

  // 🌟 เจ้าของร้านกรอกยอดโอนเพิ่มเองได้ (รวมกับยอดโอนจากระบบ)
  const manualTransferNum = canOwnerEod ? (parseNumber(eodData.manualTransfer) || 0) : 0;
  const eodBreakdown = useMemo(() => {
    if (!manualTransferNum) return todaySalesBreakdown;
    return {
      ...todaySalesBreakdown,
      transfer: (todaySalesBreakdown.transfer || 0) + manualTransferNum,
      transferDetails: [
        ...(todaySalesBreakdown.transferDetails || []),
        { time: '-', customer: isOwnerRole ? 'เจ้าของร้านกรอกเอง' : 'กรอกเอง (ส่งยอดด่วน)', amount: manualTransferNum, items: eodData.manualTransferNote || 'ยอดโอนที่กรอกเพิ่ม', isManual: true },
      ],
    };
  }, [todaySalesBreakdown, manualTransferNum, eodData.manualTransferNote, isOwnerRole]);

  const currentMonthSales = useMemo(() => {
    const posFilterDateObj = new Date();
    if (posFilterDate) {
      const [y, m, d] = posFilterDate.split('-');
      posFilterDateObj.setFullYear(y, m - 1, d);
    }
    const currentMonth = posFilterDateObj.getMonth();
    const currentYear = posFilterDateObj.getFullYear();
    
    const UNPAID_ORDER_STATUSES = ['รอชำระเงิน', 'รอตรวจสอบ', 'รอตรวจสอบยอดโอน', 'รอดำเนินการ', 'รอประเมินราคา', 'ยกเลิก'];
    const normGlobalBranch = normalizeBranchName(globalBranch);
    return orders.reduce((sum, o) => {
      const isOldPO = (o.courseName || '').includes('[ซื้อเข้า') || (o.courseName || '').includes('[เบิกจาก');
      const oStatus = String(o.status || '').trim();
      if (
        o.transactionType === 'owner_purchase' ||
        o.transactionType === 'branch_requisition' ||
        isOldPO ||
        o.source === 'POS_Parked' ||
        o.mergedIntoPosOrderNo ||
        UNPAID_ORDER_STATUSES.includes(oStatus)
      ) return sum;
      if (!o.createdAt) return sum;
      const oDate = new Date(o.createdAt);
      if (oDate.getMonth() === currentMonth && oDate.getFullYear() === currentYear) {
         if (!normGlobalBranch || normalizeBranchName(o.branch) === normGlobalBranch) {
            return sum + parseNumber(o.price);
         }
      }
      return sum;
    }, 0);
  }, [orders, globalBranch, posFilterDate]);

  useEffect(() => {
    setCart(prev => prev.map(item => {
      if (item.type === 'product' && !item.isManualPrice) {
        return { ...item, price: computeFinalPrice(item.originalItem, isVipCustomer) };
      }
      if ((item.type === 'course' || item.type === 'single_course') && !item.isManualPrice && !item.promoOption) {
        const memPrice = parseNumber(getFuzzyKey(item.originalItem, ["ราคาสมาชิก", "col_10", "memberPrice"]));
        if (memPrice > 0) {
          const regPrice = parseNumber(getFuzzyKey(item.originalItem, ["ราคา", "ราคาขาย", "col_5"])) || item.originalPrice;
          return { ...item, price: isVipCustomer ? memPrice : regPrice };
        }
      }
      return item;
    }));
  }, [isVipCustomer]);

  const handleEditMasterCoursePrice = (e, courseItem) => {
    e.stopPropagation();
    e.preventDefault();
    const oldPrice = parseNumber(getFuzzyKey(courseItem, ["ราคา", "ราคาขาย", "col_5"]));
    setEditingCoursePrice({ ...courseItem, newPriceStr: String(oldPrice) });
  };

  const submitEditMasterCoursePrice = async () => {
    if (!editingCoursePrice) return;
    
    const newPriceStr = editingCoursePrice.newPriceStr;
    if (newPriceStr !== null && newPriceStr.trim() !== '') {
       const newPrice = Number(newPriceStr);
       if (!isNaN(newPrice) && newPrice >= 0) {
           try {
              const updateData = {};
              if (editingCoursePrice["ราคา"] !== undefined) updateData["ราคา"] = String(newPrice);
              if (editingCoursePrice["ราคาขาย"] !== undefined) updateData["ราคาขาย"] = String(newPrice);
              if (editingCoursePrice["ราคาขายเต็ม"] !== undefined) updateData["ราคาขายเต็ม"] = String(newPrice);
              if (editingCoursePrice["col_5"] !== undefined) updateData["col_5"] = String(newPrice);
              if (editingCoursePrice["col_6"] !== undefined) updateData["col_6"] = String(newPrice);
              
              if (Object.keys(updateData).length === 0) updateData["ราคา"] = String(newPrice);
              
              const collectionName = editingCoursePrice.isPOSCourse ? 'products' : 'master_courses';
              
              await updateDoc(doc(db, collectionName, editingCoursePrice.id), updateData);
              showToast('อัปเดตราคาสำเร็จ (อาจต้องรอสักครู่เพื่อรีเฟรชข้อมูล)', 'success');
              setEditingCoursePrice(null);
           } catch (err) {
              showToast('ข้อผิดพลาด: ' + err.message, 'error');
           }
       } else {
           showToast('กรุณาระบุตัวเลขที่ถูกต้อง', 'error');
       }
    } else {
       showToast('กรุณาระบุราคา', 'error');
    }
  };

  const addToCart = (item, type, actionType = null, promoOption = null) => {
    // ล้างข้อความค้นหาเมื่อเจอและเลือกสินค้า/คอร์สลงตะกร้าแล้ว
    if (searchTerm) setSearchTerm('');
    if (modalCourseSearch) setModalCourseSearch('');
    if (modalProductSearch) setModalProductSearch('');

    // If course with promo options is added without choosing an option, prompt modal
    if (type === 'course' && !promoOption && Array.isArray(item.promoOptions) && item.promoOptions.length > 0) {
      setSelectedCourseForPromoModal(item);
      return;
    }

    setCart(prev => {
      const targetCartId = promoOption ? `${item.id}_opt_${promoOption.id || promoOption.name}` : item.id;
      const existing = prev.find(i => i.id === targetCartId && i.type === type);
      if (existing) {
        if (type === 'usage') {
          // ไม่เพิ่มจำนวนการตัดคอร์สซ้ำซ้อนเมื่อกดเข้ามาดู ให้คงไว้ที่ 1 เสมอ
          return prev;
        }
        if (type === 'claim_item' && existing.qty >= existing.maxQty) {
          showToast('เบิกครบโควต้าแล้ว');
          return prev;
        }
        // สำหรับสินค้าทั่วไป (product) หรือคอร์ส ให้เพิ่มจำนวนได้เสมอทุกครั้งที่กด
        return prev.map(i => i.id === targetCartId && i.type === type ? { ...i, qty: (Number(i.qty) || 1) + 1, maxQty: 9999 } : i);
      } else {
        if (type === 'product') {
          let maxQty = 9999;
          let price = computeFinalPrice(item, isVipCustomer);
          let nameStr = String(getFuzzyKey(item, ["ชื่อสินค้า", "col_2"]));
          const fullPrice = parseNumber(getFuzzyKey(item, ["ราคาขายเต็ม", "ราคา", "col_6"]));

          if (actionType === 'owner_purchase') {
             price = computeOwnerCostPrice(item);
             maxQty = 9999;
             nameStr = `[ซื้อเข้า-เฉวง] ${nameStr}`;
          } else if (actionType === 'branch_requisition') {
             price = computeOwnerCostPrice(item);
             // Branch requisitions from Chaweng, allow even if stock is 0
             maxQty = 9999;
             nameStr = `[เบิกจากเฉวง] ${nameStr}`;
          } else {
             // อนุญาตให้ขายได้แม้สต๊อกเป็น 0
             maxQty = 9999;
          }
          
          return [...prev, { id: item.id, name: nameStr, price, originalPrice: fullPrice, qty: 1, type, actionType, maxQty, originalItem: item, isManualPrice: false }];
        } else if (type === 'course' || type === 'single_course') {
          let price = parseNumber(getFuzzyKey(item, ["ราคา", "ราคาขาย", "col_5"]));
          const memberCoursePrice = parseNumber(getFuzzyKey(item, ["ราคาสมาชิก", "col_10", "memberPrice"]));
          if (isVipCustomer && memberCoursePrice > 0) {
            price = memberCoursePrice;
          }
          let nameStr = String(getFuzzyKey(item, ["ชื่อคอส", "col_4"]));
          const nameMatch = nameStr.match(/(\d+)\s*ครั้ง/);
          let sessions = String(
            getFuzzyKey(item, ["จำนวนครั้ง", "col_7", "col_6", "จำนวนครั้งที่ได้"]) || 
            item.sessions || 
            (nameMatch ? nameMatch[1] : '1')
          );
          let itemsDesc = String(getFuzzyKey(item, ["รายการที่ได้รับ", "col_11"]) || '');
          let badgeStr = '';
          let credit = parseNumber(getFuzzyKey(item, ["เครดิตที่ได้รับ", "เครดิต", "col_8", "credit"])) || 0;

          if (promoOption) {
            price = parseNumber(promoOption.price) || price;
            nameStr = (item.isFacialTreatmentMaster || item.programs) ? promoOption.name : `${nameStr} (${promoOption.name})`;
            sessions = String(promoOption.sessions || sessions || '1');
            itemsDesc = promoOption.items || itemsDesc;
            badgeStr = promoOption.badge || '';
            const optCredit = parseNumber(promoOption.credit || promoOption.เครดิตที่ได้รับ || promoOption.วงเงินเครดิต || getFuzzyKey(promoOption, ["เครดิต", "credit", "วงเงิน"]));
            if (optCredit > 0) {
              credit = optCredit;
            }
          }

          return [...prev, { 
            id: targetCartId, 
            courseId: item.id,
            name: nameStr, 
            price, 
            originalPrice: price,
            qty: 1, 
            type: 'course', 
            maxQty: 999, 
            originalItem: item,
            promoOption: promoOption || null,
            sessions: sessions,
            items: itemsDesc,
            badge: badgeStr,
            credit: credit,
            creditReceived: credit,
            freeGift: promoOption?.freeGift || item.freeGift || ''
          }];
        } else if (type === 'debt_payment') {
          const pendingAmt = item.computedPendingAmount || 0;
          return [...prev, { id: `debt_${item.id}`, name: `ชำระค้าง: ${String(getFuzzyKey(item, ["เลขที่ใบคอส", "col_2"]))}`, price: pendingAmt, qty: 1, type, maxQty: 1, originalItem: item, isManualPrice: true }];
      } else if (type === 'service') {
          return [...prev, { id: item.id, name: item.name, price: item.price || 0, qty: 1, type, maxQty: 99, originalItem: item, isManualPrice: true }];
        } else if (type === 'usage') {
          const maxQty = item.computedRemainQty || 1;
          const nameStr = `เบิกใช้: ${String(getFuzzyKey(item, ["ชื่อคอส", "col_8"]))} (${String(getFuzzyKey(item, ["เลขที่ใบคอส", "col_2"]))})`;
          return [...prev, { id: item.id, name: nameStr, price: 0, qty: 1, type, maxQty, originalItem: item }];
        } else if (type === 'claim_item') {
          const autoMatched = item.linkedProduct || findAutoMatchedProduct(item.itemName || item.name, products);
          const pCode = item.linkedProductCode || (autoMatched ? String(getFuzzyKey(autoMatched, ["รหัสสินค้า", "col_1"]) || '') : '');
          const pName = item.linkedProductName || (autoMatched ? String(getFuzzyKey(autoMatched, ["ชื่อสินค้า", "col_2"]) || autoMatched.name || '') : '');

          return [...prev, {
            id: item.id,
            name: item.name || `[เบิกของแถม] ${item.itemName}`,
            price: 0,
            qty: 1,
            type: 'claim_item',
            maxQty: item.maxQty || 1,
            courseId: item.courseId,
            courseName: item.courseName,
            itemName: item.itemName,
            originalCourse: item.originalCourse,
            originalItem: item.originalItem || item.originalCourse,
            linkedProductId: item.linkedProductId || autoMatched?.id || null,
            linkedProduct: autoMatched || null,
            linkedProductCode: pCode,
            linkedProductName: pName,
            skipStockDeduction: item.skipStockDeduction || false
          }];
        }
        return prev;
      }
    });
  };

  const updateCartQty = (id, type, delta) => {
    setCart(prev => {
      return prev.map(i => {
        if (i.id === id && i.type === type) {
          const newQty = (Number(i.qty) || 1) + delta;
          if (newQty < 1) return i;
          if ((type === 'usage' || type === 'claim_item') && newQty > i.maxQty) {
            showToast(type === 'claim_item' ? 'เบิกเกินโควต้าที่เหลือ' : 'จำนวนครั้งคอร์สไม่เพียงพอ');
            return i;
          }
          return { ...i, qty: newQty };
        }
        return i;
      });
    });
  };

  const updateCartPrice = (id, type, newPrice) => {
    setCart(prev => prev.map(i => {
       if (i.id === id && i.type === type) {
          let np = parseNumber(newPrice);
          if (i.type === 'debt_payment' && i.originalItem) {
             const maxPending = i.originalItem.computedPendingAmount || 0;
             if (np > maxPending) np = maxPending;
          }
          return { ...i, price: np, isManualPrice: true };
       }
       return i;
    }));
  };

  const removeFromCart = (id, type) => {
    setCart(prev => prev.filter(i => !(i.id === id && i.type === type)));
  };

  // 🌟 ค้นหาใบคอร์สจากค่าที่สแกน (QR บนใบคอร์ส A4 / เลขที่ใบคอส / courseRefKey / id / URL tec-it / JSON)
  const findCourseByScanRef = (raw) => {
    let t = String(raw || '').trim();
    if (!t) return null;

    // 1. ถ้าสแกนได้ URL (เช่น barcode.tec-it.com หรือเว็บ)
    if (t.includes('http://') || t.includes('https://')) {
      try {
        const urlObj = new URL(t);
        const dataParam = urlObj.searchParams.get('data');
        if (dataParam) t = dataParam;
        else {
          const parts = urlObj.pathname.split('/').filter(Boolean);
          if (parts.length > 0) t = parts[parts.length - 1];
        }
      } catch(e) {}
    }

    // 2. ถ้าสแกนได้ JSON
    if (t.startsWith('{') && t.endsWith('}')) {
      try {
        const parsed = JSON.parse(t);
        t = parsed.courseRef || parsed.courseNo || parsed.courseId || parsed.id || parsed.code || t;
      } catch(e) {}
    }

    const tLower = t.toLowerCase();
    return courses.find(c => {
      const refs = [
        getFuzzyKey(c, ["เลขที่ใบคอส", "col_2"]),
        c.courseRefKey,
        c.id,
        getFuzzyKey(c, ["รหัสคอส", "col_1"])
      ].map(v => String(v || '').trim().toLowerCase()).filter(Boolean);
      return refs.includes(tLower);
    }) || null;
  };

  const handleSearchEnter = (e) => {
    if (e.key === 'Enter' && searchTerm.trim() !== '') {
      const code = searchTerm.trim();
      const product = products.find(p => String(getFuzzyKey(p, ["บาร์โค้ด", "barcode", "รหัส", "col_1"])) === code);
      if (product) {
         e.preventDefault();
         addToCart(product, 'product');
         showToast(`สแกนและเพิ่ม ${getFuzzyKey(product, ["ชื่อสินค้า", "col_2"])} ลงตะกร้าแล้ว!`, 'success');
         setSearchTerm('');
      }
    }
  };

  // Global Barcode Scanner Listener
  useEffect(() => {
    let barcodeBuffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e) => {
      // Ignore if typing in an input, textarea or select
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      
      const currentTime = Date.now();
      
      // If time between keystrokes is too long (> 100ms), it's likely a human typing. Reset buffer.
      if (currentTime - lastKeyTime > 100) {
        barcodeBuffer = '';
      }
      
      if (e.key === 'Enter') {
        if (barcodeBuffer.length >= 3) {
           const code = barcodeBuffer;
           barcodeBuffer = ''; // reset
           
           // Try parsing as JSON (Voucher QR code)
           try {
               const parsed = JSON.parse(code);
               if (parsed && parsed.type === 'voucher' && parsed.code) {
                   handleVoucherScan(parsed.code, parsed.phone);
                   return;
               }
           } catch (err) {
               // Not JSON, continue with normal flow
           }
           
           // Check if it's a phone number (10 digits starting with 0)
           if (/^0\d{9}$/.test(code)) {
               const customer = customers.find(c => {
                  const phone = String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '').replace(/[^0-9]/g, '');
                  return phone === code;
               });
               if (customer) {
                   setSelectedCustomer(customer);
                   showToast(`สแกนพบลูกค้าและเลือกอัตโนมัติ: ${getFuzzyKey(customer, ["ชื่อ", "col_1"])}`, 'success');
                   return;
               }
           }

           // Check if it's a booking ID or Ref
           const booking = bookings.find(b => b.id === code || String(b.ticketNo || '') === code || String(b.bookingRef || '') === code);
           if (booking && booking.customerPhone) {
               const customer = customers.find(c => {
                   const phone = String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '').replace(/[^0-9]/g, '');
                   return phone === String(booking.customerPhone).replace(/[^0-9]/g, '');
               });
               if (customer) {
                   setSelectedCustomer(customer);
                   showToast(`สแกนพบหมายเลขจองและเลือกลูกค้า: ${getFuzzyKey(customer, ["ชื่อ", "col_1"])}`, 'success');
                   return;
               }
           }

           // Check if it's a course invoice number (ใบคอร์ส A4 / QR)
           const course = findCourseByScanRef(code);
           if (course) {
               const coursePhone = String(getFuzzyKey(course, ["เบอร์โทร", "col_1", "phone", "customerPhone"]) || '').replace(/[^0-9]/g, '');
               let customer = null;
               if (coursePhone) {
                   customer = customers.find(c => {
                       const phone = String(getFuzzyKey(c, ["เบอร์โทร", "col_3", "phone"]) || c.computedPhone || '').replace(/[^0-9]/g, '');
                       return phone && phone === coursePhone;
                   });
               }
               if (!customer && (course.customerId || course.customer_id)) {
                   customer = customers.find(c => c.id === (course.customerId || course.customer_id));
               }
               if (!customer) {
                   const custName = String(getFuzzyKey(course, ["ผู้ซื้อคอส", "ชื่อลูกค้า", "ชื่อ", "col_9", "customerName"]) || '').trim().toLowerCase();
                   if (custName) {
                       customer = customers.find(c => {
                           const name = String(getFuzzyKey(c, ["ชื่อ", "col_1", "name"]) || '').trim().toLowerCase();
                           return name && (name === custName || name.includes(custName) || custName.includes(name));
                       });
                   }
               }
               if (customer) {
                   setSelectedCustomer(customer);
                   setActiveTab('my_courses');
                   setSelectedCourseForUsage(course);
                   showToast(`สแกนพบคอร์ส: ${String(getFuzzyKey(course, ["ชื่อคอส", "col_8"]) || '-')}`, `ลูกค้า: ${getFuzzyKey(customer, ["ชื่อ", "col_1"])}`, 'success');
                   return;
               } else {
                   setSelectedCourseForUsage(course);
                   showToast(`สแกนพบคอร์ส: ${String(getFuzzyKey(course, ["ชื่อคอส", "col_8"]) || course.id)}`, 'success');
                   return;
               }
           }

           // Search for product by barcode
           const product = products.find(p => String(getFuzzyKey(p, ["บาร์โค้ด", "barcode", "รหัส", "col_1"])) === code);
           if (product) {
               addToCart(product, 'product');
               showToast(`สแกนและเพิ่ม ${getFuzzyKey(product, ["ชื่อสินค้า", "col_2"])} ลงตะกร้าแล้ว!`, 'success');
           } else {
               showToast(`ไม่พบรหัสสินค้าหรือเบอร์ลูกค้า: ${code}`, 'error');
           }
        }
        return;
      }

      // Add alphanumeric characters and JSON chars to buffer
      if (e.key.length === 1 && /^[a-zA-Z0-9\-\_\{\}\":\,]$/.test(e.key)) {
        barcodeBuffer += e.key;
      }
      
      lastKeyTime = currentTime;
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, customers, bookings, courses]);

  // Auto Check-in logic when a customer is selected
  useEffect(() => {
    if (!selectedCustomer) return;
    
    // Don't auto prompt if we already prompted or it's a draft order
    const cleanPhone = String(getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3"]) || '').replace(/[^0-9]/g, '');
    if (!cleanPhone) return;

    const todayStr = getLocalYYYYMMDD();
    const activeBooking = bookings.find(b => {
       const bPhone = String(b.customerPhone || '').replace(/[^0-9]/g, '');
       const isToday = b.date === todayStr;
       const isPending = b.status === 'รอการยืนยัน' || b.status === 'รอคิว' || b.status === 'กำลังรอ';
       return isToday && isPending && bPhone === cleanPhone && String(b.branch || "สำนักงานใหญ่") === String(globalBranch || "สำนักงานใหญ่");
    });

    if (activeBooking) {
       setPendingCheckInBooking(activeBooking);
    }
  }, [selectedCustomer, bookings, globalBranch]);

  // Calculations
  const originalSubtotal = cart.reduce((sum, item) => sum + ((item.originalPrice || item.price) * item.qty), 0);
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const promoResult = useMemo(() => {
    if (!selectedPromotion) return { discount: 0, reason: null, nextTimeDiscount: null, freeItems: null };
    const activePromo = promotions.find(p => p.id === selectedPromotion);
    if (!activePromo) return { discount: 0, reason: null, nextTimeDiscount: null, freeItems: null };
    
    // 1. Happy Hour Check
    if (activePromo.hasHappyHour && activePromo.happyHourStart && activePromo.happyHourEnd) {
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      
      const [startH, startM] = activePromo.happyHourStart.split(':').map(Number);
      const startMins = startH * 60 + startM;
      
      const [endH, endM] = activePromo.happyHourEnd.split(':').map(Number);
      const endMins = endH * 60 + endM;
      
      if (currentMins < startMins || currentMins > endMins) {
        return { discount: 0, reason: `นอกเวลาโปรโมชั่น (${activePromo.happyHourStart} - ${activePromo.happyHourEnd})`, nextTimeDiscount: null, freeItems: null };
      }
    }
    
    // 2. Applicable items & Total check
    let applicableTotal = 0;
    let applicableItemsInCart = [];
    
    if (activePromo.scope === 'cart_total') {
      applicableTotal = subtotal;
      applicableItemsInCart = cart;
    } else if (activePromo.scope === 'specific_items') {
      const applicableIds = activePromo.applicableItemIds || [];
      cart.forEach(item => {
        if (applicableIds.includes(item.id) || applicableIds.includes(item.originalItem?.id)) {
          applicableTotal += (item.price * item.qty);
          applicableItemsInCart.push(item);
        }
      });
      if (applicableTotal === 0 && activePromo.type !== 'discount_next_time') {
        return { discount: 0, reason: 'ไม่มีสินค้าที่ร่วมรายการในตะกร้า', nextTimeDiscount: null, freeItems: null };
      }
    }

    const minAmt = Number(activePromo.minPurchaseAmount) || 0;
    if (minAmt > 0 && applicableTotal < minAmt) {
      return { discount: 0, reason: `ต้องมียอดขั้นต่ำ ${minAmt} บาท (ขาดอีก ${minAmt - applicableTotal} บาท)`, nextTimeDiscount: null, freeItems: null };
    }

    const val = Number(activePromo.value) || 0;

    // 3. Process by Type
    if (activePromo.type === 'discount_percent') {
      if (val <= 0) return { discount: 0, reason: 'มูลค่าส่วนลดเป็น 0', nextTimeDiscount: null, freeItems: null };
      return { discount: applicableTotal * (val / 100), reason: null, nextTimeDiscount: null, freeItems: null };
      
    } else if (activePromo.type === 'discount_amount') {
      if (val <= 0) return { discount: 0, reason: 'มูลค่าส่วนลดเป็น 0', nextTimeDiscount: null, freeItems: null };
      return { discount: Math.min(val, applicableTotal), reason: null, nextTimeDiscount: null, freeItems: null };
      
    } else if (activePromo.type === 'buy_x_get_y') {
      const buyQty = val || 1;
      const getQty = Number(activePromo.getQty) || 1;
      
      // Calculate total quantity of applicable items
      const totalApplicableQty = applicableItemsInCart.reduce((sum, item) => sum + item.qty, 0);
      if (totalApplicableQty < buyQty) {
        return { discount: 0, reason: `ซื้อไม่ครบ ${buyQty} ชิ้นตามเงื่อนไข (มี ${totalApplicableQty} ชิ้น)`, nextTimeDiscount: null, freeItems: null };
      }
      
      // Calculate sets
      const sets = Math.floor(totalApplicableQty / buyQty);
      const freeQtyToGive = sets * getQty;
      
      // Sort applicable items by price ASCENDING (give cheapest for free)
      let itemsToDiscount = [];
      applicableItemsInCart.forEach(item => {
        for(let i=0; i<item.qty; i++) {
          itemsToDiscount.push(item.price);
        }
      });
      itemsToDiscount.sort((a,b) => a - b);
      
      let discountValue = 0;
      for(let i=0; i<Math.min(freeQtyToGive, itemsToDiscount.length); i++) {
        discountValue += itemsToDiscount[i];
      }
      return { discount: discountValue, reason: null, nextTimeDiscount: null, freeItems: null };
      
    } else if (activePromo.type === 'free_item') {
      const freeItemName = activePromo.freeItemName || 'ของแถม';
      const freeItemQty = Number(activePromo.freeItemQty) || 1;
      return { 
        discount: 0, 
        reason: null, 
        nextTimeDiscount: null, 
        freeItems: { name: freeItemName, qty: freeItemQty } 
      };
      
    } else if (activePromo.type === 'discount_next_time') {
      const nextVal = Number(activePromo.discountNextValue) || 0;
      if (nextVal <= 0) return { discount: 0, reason: 'มูลค่าส่วนลดครั้งถัดไปเป็น 0', nextTimeDiscount: null, freeItems: null };
      
      const typeStr = activePromo.discountNextType === 'percent' ? `${nextVal}%` : `${nextVal} บาท`;
      return { 
        discount: 0, 
        reason: null, 
        nextTimeDiscount: `คูปองส่วนลด ${typeStr}`, 
        freeItems: null 
      };
    }
    
    return { discount: 0, reason: null, nextTimeDiscount: null, freeItems: null };
  }, [selectedPromotion, subtotal, cart, promotions]);

  const promoDiscount = promoResult.discount;
  const total = Math.max(0, subtotal - globalDiscount - promoDiscount);
  const totalSaved = Math.max(0, (originalSubtotal - subtotal) + globalDiscount + promoDiscount);
  const totalPaid = (splitPayment.cash || 0) + (splitPayment.transfer || 0) + (splitPayment.cod || 0) + (splitPayment.credit || 0) + (splitPayment.omise_promptpay || 0);
  // 🌟 ยอดรวมที่ "ครอบคลุมแล้ว" = เก็บหน้าร้าน + จ่ายไปแล้วผ่านแอป (เครดิตถูกหักตอนสั่งในแอปแล้ว)
  const totalCovered = totalPaid + (appCreditPaidAmount || 0);

  const handleRewardRedemptionScan = async (rewardId, customerIdentifier) => {
    try {
      let customer = null;
      if (customerIdentifier) {
        customer = customers.find(c => c.id === customerIdentifier || 
          String(getFuzzyKey(c, ["เบอร์โทร", "col_3", "phone"]) || '').replace(/[^0-9]/g, '') === String(customerIdentifier).replace(/[^0-9]/g, ''));
      }
      
      if (!customer) {
        showToast("สแกนของรางวัลล้มเหลว", "ไม่พบข้อมูลลูกค้าสำหรับของรางวัลนี้", "error");
        return;
      }
      
      const redeemedRewards = customer.redeemedRewards || [];
      const rewardIdx = redeemedRewards.findIndex(r => r.id === rewardId);
      
      if (rewardIdx === -1) {
        showToast("สแกนล้มเหลว", "ไม่พบของรางวัลนี้ในประวัติการแลกของลูกค้า", "error");
        return;
      }
      
      if (redeemedRewards[rewardIdx].isUsed) {
        showToast("สแกนล้มเหลว", `ของรางวัล "${redeemedRewards[rewardIdx].name}" ถูกใช้งานไปก่อนหน้านี้แล้ว`, "warning");
        return;
      }
      
      const updatedRewards = [...redeemedRewards];
      updatedRewards[rewardIdx] = {
        ...updatedRewards[rewardIdx],
        isUsed: true,
        usedAt: new Date().toISOString()
      };
      
      const custRef = doc(db, "customers", customer.id);
      await updateDoc(custRef, { redeemedRewards: updatedRewards });
      
      showToast("แลกของรางวัลสำเร็จ!", `ยืนยันการเคลมของรางวัล "${redeemedRewards[rewardIdx].name}" เรียบร้อยแล้ว`, "success");
    } catch (e) {
      console.error(e);
      showToast("เกิดข้อผิดพลาด", "ไม่สามารถแลกรับของรางวัลได้ในขณะนี้", "error");
    }
  };

  const handleVoucherScan = async (code, scanPhone = null) => {
    try {
      const q = query(getCol('coupons'), where('code', '==', code.toUpperCase()));
      const snap = await getDocs(q);
      if (snap.empty) {
        showToast(`ไม่พบ Voucher รหัส: ${code}`, 'error');
        return;
      }
      const voucherDoc = snap.docs[0];
      const voucher = voucherDoc.data();
      
      if (voucher.validUntil) {
         const expiryDate = new Date(voucher.validUntil);
         expiryDate.setHours(23, 59, 59, 999);
         if (new Date() > expiryDate) {
            showToast(`Voucher ${code} หมดอายุแล้วเมื่อ ${expiryDate.toLocaleDateString('th-TH')}`, 'error');
            return;
         }
      }
      
      if (appliedVoucherCode && appliedVoucherCode.toUpperCase() === String(code).trim().toUpperCase()) {
        showToast(`คูปอง ${code} ถูกเลือกใช้ในบิลนี้อยู่แล้ว`, 'error');
        return;
      }

      if (voucher.isUsed) {
        showToast(`Voucher ${code} ถูกใช้งานไปแล้ว`, 'error');
        return;
      }
      
      if (voucher.isPersonal && selectedCustomer) {
        const phoneRaw = String(getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3", "phone"]) || '');
        const cleanPhone = phoneRaw.replace(/[^0-9]/g, '');
        if (voucher.customerPhone && voucher.customerPhone !== cleanPhone) {
          showToast(`Voucher นี้เป็นของลูกค้าเบอร์ ${voucher.customerPhone}`, 'error');
          return;
        }
      }

      if (voucher.conditionAdvanceDays && voucher.conditionAdvanceDays > 0) {
          let bookedDaysAgo = 0;
          if (selectedCustomer) {
             const cleanPhone = String(getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3", "phone"]) || '').replace(/[^0-9]/g, '');
             const todayStr = getLocalYYYYMMDD();
             const activeBooking = bookings.find(b => {
                 const bPhone = String(b.customerPhone || '').replace(/[^0-9]/g, '');
                 return b.date === todayStr && bPhone === cleanPhone;
             });
             if (activeBooking && activeBooking.createdAt) {
                 const createDate = new Date(activeBooking.createdAt);
                 const serviceDate = new Date(activeBooking.date);
                 createDate.setHours(0,0,0,0);
                 serviceDate.setHours(0,0,0,0);
                 const diffTime = Math.abs(serviceDate - createDate);
                 bookedDaysAgo = Math.floor(diffTime / (1000 * 60 * 60 * 24));
             }
          }
          if (bookedDaysAgo < voucher.conditionAdvanceDays) {
              showToast(`คูปองนี้สำหรับลูกค้าที่จองล่วงหน้าอย่างน้อย ${voucher.conditionAdvanceDays} วัน (พบว่าจองล่วงหน้า ${bookedDaysAgo} วัน)`, 'error');
              return;
          }
      }

      // Instead of applying automatically, show confirmation modal
      setInstantVoucherModal({
         code,
         voucher,
         voucherDocId: voucherDoc.id,
         scanPhone
      });

    } catch(err) {
       console.error("Voucher scan err:", err);
       showToast("เกิดข้อผิดพลาดในการตรวจสอบ Voucher", err.message, 'alert');
    }
  };

  useEffect(() => {
     const handleGlobalScan = (e) => {
         const { code, phone } = e.detail;
         if (code) {
             handleVoucherScan(code, phone);
         }
     };
     window.addEventListener('scanVoucherFromOutside', handleGlobalScan);
     return () => window.removeEventListener('scanVoucherFromOutside', handleGlobalScan);
  }, [customers, bookings, courses, selectedCustomer]);

  const executeVoucherAction = async (actionType) => {
      if (!instantVoucherModal) return;
      const { code, voucher, voucherDocId, scanPhone } = instantVoucherModal;
      setInstantVoucherModal(null);

      try {
          if (actionType === 'instant_use') {
              // Mark as used directly without cart
              const batch = writeBatch(db);
              
              if (voucher.isPersonal || voucher.isBatch) {
                  batch.update(doc(db, 'coupons', voucherDocId), { 
                      isUsed: true, 
                      usedAt: new Date().toISOString() 
                  });
              }

              if (voucher.type === 'gamification_spins' && selectedCustomer?.id) {
                  const addSpins = Math.max(1, Number(voucher.value) || 1);
                  batch.update(doc(db, 'customers', selectedCustomer.id), {
                      spinTickets: (Number(selectedCustomer.spinTickets) || 0) + addSpins
                  });
              }

              // Create history record
              const historyRef = doc(getCol('histories'));
              const itemDesc = voucher.type === 'course_percent'
                  ? `ส่วนลด ${voucher.value}% คอร์ส ${voucher.posItemName || ''}`.trim()
                  : voucher.type === 'course_fixed'
                  ? `ส่วนลด ฿${voucher.value} คอร์ส ${voucher.posItemName || ''}`.trim()
                  : voucher.type === 'pos_item'
                  ? `แลกรับ ${voucher.posItemName || 'สินค้า/บริการ'}`
                  : voucher.type === 'free_item'
                  ? `แลกรับฟรี ${voucher.freeItemName || ''}`.trim()
                  : voucher.type === 'gamification_spins'
                  ? `รับตั๋วหมุนวงล้อ ${voucher.value || 1} สิทธิ์`
                  : (voucher.type === 'percent' ? `ส่วนลด ${voucher.value}%` : `ส่วนลด ฿${voucher.value}`);
              batch.set(historyRef, {
                  "วันที่": new Date().toLocaleDateString('th-TH'),
                  "เวลา": new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
                  "ชื่อลูกค้า": selectedCustomer ? String(getFuzzyKey(selectedCustomer, ["ชื่อ", "col_1"]) || '') : 'ไม่ระบุ',
                  "เบอร์โทร": scanPhone || (selectedCustomer ? String(getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3", "phone"]) || '') : ''),
                  "ประเภท": "ใช้สิทธิ์คูปอง",
                  "สถานะ": "เรียบร้อย",
                  "รายการ": `ใช้คูปอง: ${code} (${itemDesc})`,
                  "สาขา": String(globalBranch || "เฉวง")
              });

              await batch.commit();
              showToast('ใช้สิทธิ์คูปองสำเร็จ (ไม่ต้องชำระเงิน)', 'success');
              
          } else if (actionType === 'apply_cart') {
              // Apply to Cart
              if (voucher.type === 'gamification_spins') {
                  showToast('คูปองตั๋วหมุนวงล้อ กรุณาสแกนใหม่แล้วกด "ใช้สิทธิ์ทันที" เพื่อเพิ่มสิทธิ์ให้ลูกค้า', 'error');
                  return;
              }
              if (voucher.type === 'free_item' || voucher.type === 'pos_item') {
                  const matchedProd = voucher.posItemId ? products.find(p => p.id === voucher.posItemId) : null;
                  const itemLabel = voucher.posItemName || voucher.freeItemName || voucher.description || `แลกรับฟรี`;
                  setCart(prev => [...prev, {
                      id: matchedProd ? matchedProd.id : `free-item-${Date.now()}`,
                      name: `${itemLabel} (Voucher: ${code})`,
                      price: 0,
                      originalPrice: 0,
                      qty: 1,
                      type: voucher.posItemType === 'course' ? 'service' : 'product',
                      originalItem: matchedProd || null,
                      skipStockUpdate: !matchedProd,
                      isManualPrice: true
                  }]);
                  showToast(`เพิ่มสิทธิ์ "${itemLabel}" ลงในบิลแล้ว`, 'success');
              } else if (voucher.type === 'course_percent' || voucher.type === 'course_fixed') {
                  const scope = voucher.scope || (voucher.targetCategory ? 'category' : (voucher.posItemName === 'ทุกคอร์ส' || !voucher.posItemName ? 'all_courses' : 'specific'));
                  const targetPercent = Number(voucher.value) || 0;
                  const isPercent = voucher.type === 'course_percent';

                  if (scope === 'all_courses') {
                      // Applies to all course/service items in cart
                      const courseItems = cart.filter(ci => ci.type === 'course' || ci.type === 'service' || ci.isCourse);
                      const applicableItems = courseItems.length > 0 ? courseItems : cart;
                      if (applicableItems.length === 0) {
                          showToast('กรุณาเลือกรายการคอร์สลงตะกร้าก่อนใช้คูปอง', 'warning');
                          return;
                      }
                      const eligibleSubtotal = applicableItems.reduce((s, ci) => s + (Number(ci.price || 0) * Number(ci.qty || 1)), 0);
                      const actualDiscount = isPercent
                          ? Math.round((eligibleSubtotal * targetPercent) / 100)
                          : Math.min(eligibleSubtotal, Number(voucher.value) || 0);

                      setGlobalDiscount(prev => prev + actualDiscount);
                      showToast('เพิ่มคูปองเป็นส่วนลดทุกคอร์สแล้ว', `ลด ${isPercent ? targetPercent + '%' : '฿' + actualDiscount} ทุกคอร์ส (-฿${actualDiscount.toLocaleString()})`, 'success');
                  } else if (scope === 'category') {
                      const targetCat = voucher.targetCategory;
                      const targetCatLabel = (voucher.targetCategoryLabel || '').toLowerCase();
                      const matchedItems = cart.filter(ci => {
                          const itemCat = getCourseCategory(ci.originalItem || ci);
                          const itemName = String(ci.name || '').toLowerCase();
                          return itemCat === targetCat || (targetCatLabel && (itemName.includes(targetCatLabel) || itemCat.includes(targetCatLabel)));
                      });
                      if (matchedItems.length === 0) {
                          showToast(`คูปองนี้ใช้สำหรับหมวด "${voucher.targetCategoryLabel || targetCat}" กรุณาเลือกคอร์สในหมวดนี้ลงตะกร้าก่อน`, 'warning');
                          return;
                      }
                      const matchedSubtotal = matchedItems.reduce((s, ci) => s + (Number(ci.price || 0) * Number(ci.qty || 1)), 0);
                      const actualDiscount = isPercent
                          ? Math.round((matchedSubtotal * targetPercent) / 100)
                          : Math.min(matchedSubtotal, Number(voucher.value) || 0);

                      setGlobalDiscount(prev => prev + actualDiscount);
                      showToast(`เพิ่มคูปองส่วนลดหมวด ${voucher.targetCategoryLabel || targetCat}`, `ลด ${isPercent ? targetPercent + '%' : '฿' + actualDiscount} (-฿${actualDiscount.toLocaleString()})`, 'success');
                  } else {
                      const targetName = (voucher.posItemName || voucher.courseName || '').toLowerCase().trim();
                      
                      // Check if course is already in cart
                      const cartItem = cart.find(ci => (ci.name || '').toLowerCase().trim().includes(targetName) || targetName.includes((ci.name || '').toLowerCase().trim()));
                      
                      let matchedCourse = null;
                      if (!cartItem) {
                          matchedCourse = masterCourses.find(c => (c['ชื่อคอส'] || c.col_4 || c.name || '').toLowerCase().trim().includes(targetName) || targetName.includes((c['ชื่อคอส'] || c.col_4 || c.name || '').toLowerCase().trim()))
                                       || products.find(p => (p['ชื่อสินค้า'] || p.col_2 || p.name || '').toLowerCase().trim().includes(targetName) || targetName.includes((p['ชื่อสินค้า'] || p.col_2 || p.name || '').toLowerCase().trim()));
                          if (matchedCourse) {
                              const priceStr = matchedCourse['ราคา'] || matchedCourse['ราคาขาย'] || matchedCourse['ราคาขายเต็ม'] || matchedCourse.col_5 || matchedCourse.col_6 || 0;
                              const cPrice = typeof priceStr === 'string' ? parseFloat(priceStr.replace(/,/g, '')) || 0 : Number(priceStr) || 0;
                              setCart(prev => [...prev, {
                                  id: matchedCourse.id,
                                  name: matchedCourse['ชื่อคอส'] || matchedCourse['ชื่อสินค้า'] || matchedCourse.name,
                                  price: cPrice,
                                  originalPrice: cPrice,
                                  qty: 1,
                                  type: 'service',
                                  originalItem: matchedCourse
                              }]);
                          }
                      }

                      const targetPrice = cartItem 
                          ? (Number(cartItem.price) || 0) 
                          : matchedCourse 
                          ? (typeof (matchedCourse['ราคา'] || matchedCourse.col_5) === 'string' ? parseFloat(String(matchedCourse['ราคา'] || matchedCourse.col_5).replace(/,/g, '')) || 0 : Number(matchedCourse['ราคา'] || matchedCourse.col_5) || 0) 
                          : 0;
                      
                      const actualDiscount = isPercent
                          ? Math.round((targetPrice * targetPercent) / 100)
                          : Math.min(targetPrice, Number(voucher.value) || 0);

                      setGlobalDiscount(prev => prev + actualDiscount);
                      showToast('เพิ่มคูปองเป็นส่วนลดคอร์สแล้ว', `ลด ${isPercent ? targetPercent + '%' : '฿' + actualDiscount} สำหรับ ${voucher.posItemName || targetName} (-฿${actualDiscount.toLocaleString()})`, 'success');
                  }
              } else {
                  const discountVal = Number(voucher.value) || 0;
                  let actualDiscount = discountVal;
                  if (voucher.type === 'percent') {
                      actualDiscount = (subtotal * discountVal) / 100;
                  }
                  setGlobalDiscount(prev => prev + actualDiscount);
                  showToast('เพิ่มคูปองเป็นส่วนลดในบิลแล้ว', `หักลบ ฿${actualDiscount.toLocaleString()}`, 'success');
              }
              
              setAppliedVoucherCode(code);
              setAppliedVoucherData(voucher);

              if (voucher.isPersonal || voucher.isBatch) {
                  setAppliedVoucherId(voucherDocId);
              }
              if (voucher.isPersonal && !selectedCustomer && (voucher.customerPhone || scanPhone)) {
                  const phoneToSearch = voucher.customerPhone || scanPhone;
                  const foundCustomer = customers.find(c => {
                      const phoneRaw = String(getFuzzyKey(c, ["เบอร์โทร", "col_3", "phone"]) || '');
                      return phoneRaw.replace(/[^0-9]/g, '') === phoneToSearch;
                  });
                  if (foundCustomer) {
                      setSelectedCustomer(foundCustomer);
                  }
              }
          }
      } catch (err) {
          console.error(err);
          showToast('เกิดข้อผิดพลาดในการใช้คูปอง', err.message, 'error');
      }
  };

  const handleOmisePromptPayCheckout = async (overrideAmount = null) => {
    setIsProcessing(true);
    try {
        const amount = overrideAmount !== null ? overrideAmount : splitPayment.omise_promptpay;
        if (!amount || amount <= 0) return;

        const res = await fetch('https://asia-southeast1-iris-clinic-app.cloudfunctions.net/omiseCharge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token: '',
                sourceType: 'promptpay',
                amount: amount,
                description: `POS Order ${new Date().getTime()}`,
            })
        });
        const data = await res.json();
        if (res.ok && data.status === 'pending') {
            setOmiseChargeData(data);
            setShowOmiseQrModal(true);
            setIsPollingOmise(true);
            setShowPaymentModal(false); // Hide the checkout modal temporarily
        } else {
            showToast('สร้าง QR Code ไม่สำเร็จ: ' + (data.message || data.error), 'error');
        }
    } catch (err) {
        showToast('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ชำระเงินได้', 'error');
    } finally {
        setIsProcessing(false);
    }
  };

  const [triggerCheckout, setTriggerCheckout] = useState(false);
  useEffect(() => {
    if (triggerCheckout) {
      setTriggerCheckout(false);
      handleCheckout();
    }
  }, [triggerCheckout]);

  useEffect(() => {
    let pollInterval;
    if (isPollingOmise && omiseChargeData?.id) {
        pollInterval = setInterval(async () => {
            try {
                const res = await fetch('https://asia-southeast1-iris-clinic-app.cloudfunctions.net/checkOmiseCharge', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chargeId: omiseChargeData.id })
                });
                const data = await res.json();
                if (res.ok && data.status === 'successful') {
                    clearInterval(pollInterval);
                    setIsPollingOmise(false);
                    setShowOmiseQrModal(false);
                    showToast('ลูกค้ายืนยันการชำระเงินเรียบร้อยแล้ว!', 'success');
                    
                    setSplitPayment(prev => ({ 
                        ...prev, 
                        transfer: (prev.transfer || 0) + (prev.omise_promptpay || 0),
                        omise_promptpay: 0
                    }));
                    setTriggerCheckout(true);
                }
            } catch (err) {
                console.error("Polling error", err);
            }
        }, 3000);
    }
    return () => clearInterval(pollInterval);
  }, [isPollingOmise, omiseChargeData]);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      showToast('ไม่มีสินค้าในตะกร้า');
      return;
    }
    const hasCourse = cart.some(i => i.type === 'course' || i.type === 'single_course');
    const hasService = cart.some(i => i.type === 'service' || i.type === 'usage' || i.type === 'claim_item');
    let effectiveStaff = paymentStaff;
    if (hasService && !effectiveStaff) {
      effectiveStaff = posPreselectedStaffName || activeStaff?.name || (availableStaffList.length > 0 ? availableStaffList[0].name : '');
      if (effectiveStaff) {
        setPaymentStaff(effectiveStaff);
      } else {
        showToast('มีรายการตัดคอร์ส/เบิกสินค้าในตะกร้า โปรดเลือกพนักงานผู้ทำรายการ', 'error');
        return;
      }
    }
    if ((hasCourse || cart.some(i => i.type === 'claim_item')) && !selectedCustomer) {
      handleSelectWalkIn();
      if (!isOwnerDirectUsage) {
        showToast('เลือกสิทธิ์ลูกค้าทั่วไป (Walk-in) ให้อัตโนมัติแล้ว กรุณากดยืนยันชำระเงินอีกครั้ง หรือกดระบุชื่อลูกค้า', 'info');
        return;
      }
    }
    // 🌟 กันหักเครดิตซ้ำ 2 ครั้ง: ออเดอร์นี้ลูกค้าจ่ายเครดิตไปแล้วในแอป → ห้ามเลือก "ใช้เครดิต" อีก
    if (appCreditPaidAmount > 0 && (splitPayment.credit || 0) > 0) {
      showToast('⚠️ ออเดอร์นี้ลูกค้าจ่ายเครดิตไปแล้วในแอป ฿' + appCreditPaidAmount.toLocaleString() + ' — ห้ามเลือก "ใช้เครดิต" ซ้ำ (เครดิตจะถูกหักสองครั้ง) กรุณาลดช่องเครดิตเป็น 0', 'error');
      return;
    }
    if (totalCovered !== total && total > 0) {
      if (isOwnerDirectUsage && totalCovered === 0) {
        // สิทธิ์เจ้าของร้าน: ตรวจเช็คเบื้องต้นโดยไม่ได้ระบุยอดเงิน ให้ผ่านเป็นตรวจเช็คฟรี (฿0) ทันที
      } else if (!isOwnerDirectUsage) {
        showToast(`ยอดชำระเงินไม่ตรงกับยอดสุทธิ (ขาดอีก ฿${(total - totalCovered).toLocaleString()})`);
        return;
      }
    }

    if (appliedVoucherData && appliedVoucherData.conditionPaymentMethod && appliedVoucherData.conditionPaymentMethod !== 'all') {
       if (appliedVoucherData.conditionPaymentMethod === 'transfer' && splitPayment.transfer < total) {
           showToast('คูปองนี้ต้องชำระด้วยการโอนเงินเต็มจำนวนเท่านั้น', 'error');
           return;
       }
       if (appliedVoucherData.conditionPaymentMethod === 'cash' && splitPayment.cash < total) {
           showToast('คูปองนี้ต้องชำระด้วยเงินสดเต็มจำนวนเท่านั้น', 'error');
           return;
       }
    }
    
    setIsProcessing(true);
    try {
      const customDateObj = new Date();
      if (transactionDate) {
        const [y, m, d] = transactionDate.split('-');
        customDateObj.setFullYear(y, m - 1, d);
      }
      
      const orderNo = `POS${Date.now().toString().slice(-6)}`;
      
      let paymentMethodsStrArr = [];
      if (appCreditPaidAmount > 0) paymentMethodsStrArr.push(`จ่ายแล้วผ่านแอป(เครดิต): ${appCreditPaidAmount}`);
      if (splitPayment.cash > 0) paymentMethodsStrArr.push(`เงินสด: ${splitPayment.cash}`);
      if (splitPayment.transfer > 0) paymentMethodsStrArr.push(`โอนเงิน: ${splitPayment.transfer}`);
      if (splitPayment.cod > 0) paymentMethodsStrArr.push(`ค้าง/COD: ${splitPayment.cod}`);
      if (splitPayment.credit > 0) paymentMethodsStrArr.push(`ตัดเครดิต: ${splitPayment.credit}`);
      const isOwnerZeroPay = isOwnerDirectUsage && (totalCovered === 0 || total <= 0);
      const isUsageBill = hasCourseUsage || cart.some(i => i.type === 'usage') || isOwnerDirectUsage;
      const isClaimBill = hasCourseClaim || cart.some(i => i.type === 'claim_item');
      const paymentMethodStr = paymentMethodsStrArr.join(', ') || (isOwnerZeroPay ? 'สิทธิ์เจ้าของร้าน (ตรวจเช็คฟรี)' : (isOwnerDirectUsage ? 'ใช้คอส (เช็คเบื้องต้น)' : (isUsageBill ? 'ตัดคอร์ส' : (isClaimBill ? 'เบิกของแถม' : 'ฟรี/ส่วนลดเต็มจำนวน'))));
      const batch = writeBatch(db);
      const delayedHistoryUpdates = [];
      
      const cName = selectedCustomer ? String(selectedCustomer.computedName || getFuzzyKey(selectedCustomer, ["ชื่อ", "ชื่อลูกค้า", "col_1", "col_2"]) || 'ลูกค้าทั่วไป') : 'ลูกค้าทั่วไป (POS)';
      const cPhone = selectedCustomer ? String(selectedCustomer.computedPhone || selectedCustomer.phone || getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3", "phone"]) || '') : '';
      const custCleanPhone = cPhone.replace(/\D/g, '');

      // Handle Credit Deduction
      if (splitPayment.credit > 0 && selectedCustomer) {
        let remainingToDeduct = splitPayment.credit;
        const phone = cPhone.trim();
        const myCourses = courses.filter(c => String(getFuzzyKey(c, ["เบอร์โทร", "col_1"]) || '').trim() === phone && (c.computedRemainCredit || 0) > 0);
        
        for (const c of myCourses) {
          if (remainingToDeduct <= 0) break;
          const available = c.computedRemainCredit;
          const deductAmt = Math.min(available, remainingToDeduct);
          
          const historyRef = doc(getCol('histories'));
          batch.set(historyRef, {
            "วันที่": customDateObj.toLocaleDateString('th-TH'),
            "เวลา": customDateObj.toLocaleTimeString('th-TH', { hour12: false, hour: '2-digit', minute: '2-digit' }),
            "ชื่อลูกค้า": cName,
            "เบอร์โทร": cPhone,
            "cleanPhone": custCleanPhone,
            "เลขที่ใบคอส": c.courseRefKey || String(getFuzzyKey(c, ["เลขที่ใบคอส", "col_3"])),
            "หมายเลขคำสั่งซื้อ": orderNo,
            "อ้างอิง": orderNo,
            "ประเภท": "เบิกใช้เครดิต",
            "สถานะ": "เรียบร้อย",
            "ยอดเงิน": String(deductAmt),
            "รายละเอียด": `ใช้เครดิตชำระสินค้าบิล ${orderNo}`,
            "สาขา": String(globalBranch || "เฉวง")
          });
          
          remainingToDeduct -= deductAmt;
        }
      }
      
      
      let itemsStr = [];
      let courseClaimUpdates = {};
      const pendingProductStockMap = new Map();
      const targetPosBranch = normalizeBranchName(globalBranch || 'เฉวง') || 'เฉวง';

      const getWorkingStockObj = (prod) => {
        if (pendingProductStockMap.has(prod.id)) return pendingProductStockMap.get(prod.id);
        const rawMap = prod.stock_by_branch || {};
        const normalizedMap = {};
        Object.entries(rawMap).forEach(([k, v]) => {
          const nk = normalizeBranchName(k) || k;
          normalizedMap[nk] = (Number(normalizedMap[nk]) || 0) + parseQty(v);
        });
        if (Object.keys(normalizedMap).length === 0) {
          normalizedMap['เฉวง'] = parseQty(getFuzzyKey(prod, ["จำนวนคงเหลือ", "col_12"]));
        }
        const entry = { prod, stock_by_branch: normalizedMap };
        pendingProductStockMap.set(prod.id, entry);
        return entry;
      };

      const usageItemsInCart = cart.filter(ci => ci.type === 'usage');
      const effectiveCart = cart.map(ci => {
        if (ci.type !== 'usage') return { ...ci };
        const maxCourseAvail = Math.max(0, Number(ci.originalItem?.computedRemainQty ?? ci.qty ?? 1));
        const requestedQty = Math.max(1, Number(ci.qty) || 1);
        const finalQty = Math.min(maxCourseAvail, requestedQty);
        return { ...ci, qty: finalQty };
      });

      for (const item of effectiveCart) {
        itemsStr.push(`${item.name} x${item.qty}`);

        if (item.type === 'product') {
          if (!item.skipStockUpdate && !String(item.id || '').startsWith('free-item-')) {
              const matchedProd = item.originalItem || products.find(p => p.id === item.id);
              if (matchedProd) {
                const stateEntry = getWorkingStockObj(matchedProd);
                const newStockByBranch = stateEntry.stock_by_branch;
                
                if (item.actionType === 'owner_purchase') {
                  const chawengStock = parseQty(newStockByBranch['เฉวง'] || 0);
                  newStockByBranch['เฉวง'] = chawengStock + item.qty;
                } else if (item.actionType === 'branch_requisition') {
                  const chawengStock = parseQty(newStockByBranch['เฉวง'] || 0);
                  const myStock = parseQty(newStockByBranch[targetPosBranch] || 0);
                  newStockByBranch['เฉวง'] = Math.max(0, chawengStock - item.qty);
                  if (targetPosBranch !== 'เฉวง') {
                     newStockByBranch[targetPosBranch] = myStock + item.qty;
                  }
                } else {
                  const myStock = parseQty(newStockByBranch[targetPosBranch] || 0);
                  newStockByBranch[targetPosBranch] = Math.max(0, myStock - item.qty);
                }
              }
          }

          // History for product
          const historyRef = doc(getCol('histories'));
          let historyType = "ซื้อสินค้า";
          if (item.actionType === 'owner_purchase') historyType = "สั่งซื้อสินค้าเข้าสต๊อก (PO)";
          else if (item.actionType === 'branch_requisition') historyType = "เบิกสินค้าจากศูนย์ใหญ่";

          batch.set(historyRef, {
            "วันที่": customDateObj.toLocaleDateString('th-TH'),
            "ชื่อลูกค้า": (item.actionType === 'owner_purchase' || item.actionType === 'branch_requisition') ? 'ศูนย์ใหญ่/พาร์ทเนอร์' : cName,
            "เบอร์โทร": (item.actionType === 'owner_purchase' || item.actionType === 'branch_requisition') ? '' : cPhone,
            "cleanPhone": (item.actionType === 'owner_purchase' || item.actionType === 'branch_requisition') ? '' : custCleanPhone,
            "หมายเลขคำสั่งซื้อ": orderNo,
            "ประเภท": historyType,
            "สถานะ": "เรียบร้อย",
            "สินค้า": item.name,
            "จำนวน": String(item.qty),
            "ยอดเงิน": String(item.price * item.qty),
            "สาขา": item.actionType === 'owner_purchase' ? 'เฉวง' : String(globalBranch || "สำนักงานใหญ่"),
            "พนักงาน": paymentStaff
          });
        } 
        else if (item.type === 'service') {
          // Record service history
          const historyRef = doc(getCol('histories'));
          batch.set(historyRef, {
            "วันที่": customDateObj.toLocaleDateString('th-TH'),
            "เวลา": customDateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
            "ชื่อลูกค้า": cName,
            "เบอร์โทร": cPhone,
            "cleanPhone": custCleanPhone,
            "หมายเลขคำสั่งซื้อ": orderNo,
            "ประเภท": "รับบริการ (จี้/หัตถการ)",
            "col_4": "รับบริการ (จี้/หัตถการ)",
            "สถานะ": "เรียบร้อย",
            "รายการ": item.name,
            "สินค้า": item.name,
            "col_18": item.name,
            "จำนวน": String(item.qty),
            "ยอดเงิน": String(item.price * item.qty),
            "col_19": String(item.price * item.qty),
            "สาขา": String(globalBranch || "สำนักงานใหญ่"),
            "พนักงาน": paymentStaff,
            "isService": true,
            "noCourseCommission": true
          });

          // Find employee IDs for service_logs
          const staffList = paymentStaff ? paymentStaff.split('/').map(s => s.trim()).filter(Boolean) : [];
          staffList.forEach(sName => {
             const emp = employees.find(e => e.name === sName);
             if (emp) {
                const serviceLogRef = doc(getCol('service_logs'));
                batch.set(serviceLogRef, {
                  date: getLocalYYYYMMDD(customDateObj),
                  type: item.name,
                  amount: item.price * item.qty,
                  note: `POS: ${orderNo}`,
                  employeeId: emp.id,
                  employeeName: emp.name,
                  branch: String(globalBranch || "เฉวง"),
                  createdAt: customDateObj.toISOString()
                });
             }
          });
        }
        else if (item.type === 'usage') {
          // History for course usage
          const historyRef = doc(getCol('histories'));
          const custSignatureUrl = custSigRef.current?.toDataURL() || customerSignature || null;
          const staffSignatureUrl = staffSigRef.current?.toDataURL() || staffSignature || null;
          const finalQty = item.qty;

          const selectedServicesList = (usedServices && usedServices.length > 0)
            ? usedServices.map(s => String(getFuzzyKey(s, ["ชื่อคอส", "col_4"]) || s.name || s).trim()).filter(Boolean)
            : [];
          const selectedServicesStr = selectedServicesList.join(', ');
          const courseName = String(getFuzzyKey(item.originalItem, ["ชื่อคอส", "col_8"]) || item.name || '').replace(/เบิกใช้:\s*/g, '').replace(/\(.*\)/g, '').trim();
          const finalItemDescription = selectedServicesStr || courseName || "ตัดคอร์สผ่านระบบ POS";

          batch.set(historyRef, {
            "วันที่": customDateObj.toLocaleDateString('th-TH'),
            "เวลา": customDateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
            "ชื่อลูกค้า": cName,
            "เบอร์โทร": cPhone,
            "cleanPhone": custCleanPhone,
            "หมายเลขคำสั่งซื้อ": orderNo,
            "เลขที่ใบคอส": String(getFuzzyKey(item.originalItem, ["เลขที่ใบคอส", "col_2"]) || ''),
            "ประเภท": "รับบริการ",
            "actionType": "usage",
            "isUsage": true,
            "noCourseCommission": true,
            "ยอดเงิน": "0",
            "ราคา": "0",
            "สถานะ": "เรียบร้อย",
            "รายการ": finalItemDescription,
            "จำนวน": String(finalQty),
            "สาขา": String(globalBranch || "สำนักงานใหญ่"),
            "courseId": item.id,
            "courseName": courseName,
            "usedServices": selectedServicesList,
            "พนักงาน": paymentStaff,
            "courseUpdatedDirectly": true
          });

          // Defer heavy image uploads to background so UI is not blocked
          if (paymentPhotos.before.length > 0 || paymentPhotos.after.length > 0 || custSignatureUrl || staffSignatureUrl) {
              delayedHistoryUpdates.push({
                  ref: historyRef,
                  data: {
                      "customerPhoto": paymentPhotos.before[0] || paymentPhotos.after[0] || null,
                      "customerPhotos": paymentPhotos,
                      "customerSignature": custSignatureUrl,
                      "staffSignature": staffSignatureUrl
                  }
              });
          }

          // --- Auto Create Booking & Assign Bed ---
          if (selectedBed) {
             const bookingRef = doc(getCol('bookings'));
             const nowObj = new Date();
             const nowIso = nowObj.toISOString();
             
             // Time components to match timezone correctly
             const localNowStr = new Date(nowObj.getTime() - (nowObj.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
             const dateStr = localNowStr.split('T')[0];
             const timeStr = localNowStr.split('T')[1];

             batch.set(bookingRef, {
                 courseId: item.id || '',
                 courseRef: String(getFuzzyKey(item.originalItem, ["เลขที่ใบคอส", "col_2"]) || ''),
                 courseName: finalItemDescription,
                 customerName: cName,
                 customerPhone: cPhone,
                 customerId: selectedCustomer ? selectedCustomer.id : '',
                 dateTime: localNowStr,
                 date: dateStr,
                 time: timeStr,
                 branch: String(globalBranch || "เฉวง"),
                 status: 'กำลังใช้บริการ',
                 serviceStartTime: nowIso,
                 createdAt: nowIso,
                 bedNumber: String(selectedBed),
                 isWalkIn: true
             });
          }

          // Update course directly to cache the state
          const courseId = item.originalItem.id;
          const courseRef = doc(getCol('courses'), courseId);
          const currentUsed = item.originalItem.computedUsedQty || 0;
          const currentTotal = item.originalItem.computedTotalQty || 1;
          const newUsed = currentUsed + finalQty;
          const newRemain = Math.max(0, currentTotal - newUsed);
          const newStatus = newRemain <= 0 ? "ใช้ครบแล้ว" : "ยังคงเหลือ";

          batch.update(courseRef, {
            "ครั้งที่ใช้": String(newUsed),
            "สถานะ": newStatus
          });
        }
        else if (item.type === 'debt_payment') {
          // Update Course Payment Pending Amount
          const courseId = item.originalItem.id;
          const courseRef = doc(getCol('courses'), courseId);
          
          const currentPending = item.originalItem.computedPendingAmount || 0;
          const currentPaid = parseNumber(getFuzzyKey(item.originalItem, ["ยอดชำระแล้วทั้งหมด", "ยอดชำระแล้ว"]));
          
          const newPending = Math.max(0, currentPending - item.price);
          const newPaid = currentPaid + item.price;
          
          const originalPaymentStr = String(getFuzzyKey(item.originalItem, ["ประเภทการชำระ", "col_7"]) || '');
          const combinedPaymentStr = originalPaymentStr ? (originalPaymentStr.includes(paymentMethodStr) ? originalPaymentStr : `${originalPaymentStr}, ${paymentMethodStr}`) : paymentMethodStr;

          batch.update(courseRef, {
            "ยอดค้างชำระ": String(newPending),
            "ยอดชำระแล้วทั้งหมด": String(newPaid),
            "ประเภทการชำระ": combinedPaymentStr
          });

          // History for debt payment
          const historyRef = doc(getCol('histories'));
          batch.set(historyRef, {
            "วันที่": customDateObj.toLocaleDateString('th-TH'),
            "เวลา": customDateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
            "ชื่อลูกค้า": cName,
            "เบอร์โทร": cPhone,
            "cleanPhone": custCleanPhone,
            "หมายเลขคำสั่งซื้อ": orderNo,
            "ประเภท": "ชำระยอดค้าง",
            "สถานะ": "เรียบร้อย",
            "สินค้า": item.name,
            "ยอดเงิน": String(item.price),
            "สาขา": String(globalBranch || "สำนักงานใหญ่"),
            "อ้างอิง": String(getFuzzyKey(item.originalItem, ["เลขที่ใบคอส", "col_2"]) || '')
          });
        }
        else if (item.type === 'claim_item') {
          // Record the claim update locally to prevent overwriting in batch
          if (!courseClaimUpdates[item.courseId]) {
             courseClaimUpdates[item.courseId] = [...(item.originalCourse?.claimedItems || [])];
          }
          for (let i = 0; i < item.qty; i++) {
             courseClaimUpdates[item.courseId].push(item.itemName || item.name);
          }

          // Try to deduct stock if it's a physical product
          let product = null;
          if (!item.skipStockDeduction) {
            if (item.linkedProductId) {
              product = products.find(p => p.id === item.linkedProductId);
            }
            if (!product && item.linkedProduct) {
              product = item.linkedProduct;
            }
            if (!product) {
              product = findAutoMatchedProduct(item.itemName || item.name, products);
            }
            if (!product) {
              const cleanClaimName = String(item.itemName || item.name || '').trim();
              product = products.find(p => String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2"]) || '').trim() === cleanClaimName) ||
                products.find(p => {
                  const pName = String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2"]) || '').trim();
                  return pName.length >= 3 && cleanClaimName.includes(pName);
                });
            }

            if (product) {
               const stateEntry = getWorkingStockObj(product);
               const myStock = parseQty(stateEntry.stock_by_branch[targetPosBranch] || 0);
               stateEntry.stock_by_branch[targetPosBranch] = Math.max(0, myStock - item.qty);
            }
          }

          const deductedProdCode = product ? String(getFuzzyKey(product, ["รหัสสินค้า", "col_1"]) || '') : (item.linkedProductCode || '');
          const deductedProdName = product ? String(getFuzzyKey(product, ["ชื่อสินค้า", "col_2"]) || product.name || '') : (item.linkedProductName || '');

          // Add History
          const historyRef = doc(getCol('histories'));
          const custSignatureUrl = custSigRef.current?.toDataURL() || customerSignature || null;
          const staffSignatureUrl = staffSigRef.current?.toDataURL() || staffSignature || null;
          const courseRefNo = String(getFuzzyKey(item.originalCourse, ["เลขที่ใบคอส", "col_2", "col_3", "courseNo"]) || '');

          batch.set(historyRef, {
            "วันที่": customDateObj.toLocaleDateString('th-TH'),
            "เวลา": customDateObj.toLocaleTimeString('th-TH', { hour12: false, hour: '2-digit', minute: '2-digit' }),
            "ชื่อลูกค้า": cName,
            "เบอร์โทร": cPhone,
            "cleanPhone": custCleanPhone,
            "หมายเลขคำสั่งซื้อ": orderNo,
            "ประเภท": "เบิกสินค้าจากคอร์ส",
            "actionType": "claim_item",
            "isUsage": true,
            "noCourseCommission": true,
            "ยอดเงิน": "0",
            "ราคา": "0",
            "สถานะ": "เรียบร้อย",
            "รายการ": item.itemName || item.name,
            "สินค้า": deductedProdName || item.itemName || item.name,
            "รหัสสินค้า": deductedProdCode,
            "linkedProductId": product?.id || item.linkedProductId || '',
            "linkedProductName": deductedProdName,
            "linkedProductCode": deductedProdCode,
            "จำนวน": String(item.qty),
            "สาขา": String(globalBranch || "สำนักงานใหญ่"),
            "courseId": item.courseId || '',
            "อ้างอิง": courseRefNo,
            "เลขที่ใบคอส": courseRefNo,
            "พนักงาน": paymentStaff || '',
            "ชื่อเจ้าหน้าที่": paymentStaff || '',
            "ผู้ให้บริการ": paymentStaff || '',
            "courseUpdatedDirectly": true
          });

          if (paymentPhotos.before.length > 0 || paymentPhotos.after.length > 0 || custSignatureUrl || staffSignatureUrl) {
              delayedHistoryUpdates.push({
                  ref: historyRef,
                  data: {
                      "customerPhoto": paymentPhotos.before[0] || paymentPhotos.after[0] || null,
                      "customerPhotos": paymentPhotos,
                      "customerSignature": custSignatureUrl,
                      "staffSignature": staffSignatureUrl
                  }
              });
          }
        }
        else if (item.type === 'course' || item.type === 'single_course') {
          if (isOwnerDirectUsage) {
            // 👑 สิทธิ์เจ้าของร้าน: ชำระเงินเป็นใช้คอส (ตรวจเช็คเบื้องต้น ไม่สร้างใบคอร์ส และไม่ต้องตัดคอร์ส)
            const historyRef = doc(getCol('histories'));
            const custSignatureUrl = custSigRef.current?.toDataURL() || customerSignature || null;
            const staffSignatureUrl = staffSigRef.current?.toDataURL() || staffSignature || null;

            batch.set(historyRef, {
              "วันที่": customDateObj.toLocaleDateString('th-TH'),
              "เวลา": customDateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
              "ชื่อลูกค้า": cName,
              "เบอร์โทร": cPhone,
              "cleanPhone": custCleanPhone,
              "หมายเลขคำสั่งซื้อ": orderNo,
              "ประเภท": "ใช้คอส (เช็คเบื้องต้น)",
              "col_4": "ใช้คอส (เช็คเบื้องต้น)",
              "สถานะ": "เรียบร้อย",
              "รายการ": item.name,
              "สินค้า": item.name,
              "col_18": item.name,
              "จำนวน": String(item.qty),
              "ยอดเงิน": String(isOwnerZeroPay ? 0 : item.price * item.qty),
              "col_19": String(isOwnerZeroPay ? 0 : item.price * item.qty),
              "สาขา": String(globalBranch || "สำนักงานใหญ่"),
              "พนักงาน": paymentStaff || 'เจ้าของร้าน',
              "isService": true,
              "isOwnerDirectUsage": true,
              "customerPhoto": paymentPhotos.before[0] || paymentPhotos.after[0] || null,
              "customerPhotos": paymentPhotos,
              "customerSignature": custSignatureUrl,
              "staffSignature": staffSignatureUrl
            });

            // บันทึกเตียงหากมีการเลือกเตียงสำหรับ Walk-in
            if (selectedBed && globalBranch) {
              const bedBookingRef = doc(getCol('bookings'));
              const nowIso = customDateObj.toISOString();
              const dateStr = getLocalYYYYMMDD(customDateObj);
              const timeStr = customDateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
              batch.set(bedBookingRef, {
                  customerName: cName,
                  phone: cPhone,
                  serviceName: item.name,
                  customerId: selectedCustomer ? selectedCustomer.id : '',
                  dateTime: `${dateStr} ${timeStr}`,
                  date: dateStr,
                  time: timeStr,
                  branch: String(globalBranch || "เฉวง"),
                  status: 'กำลังใช้บริการ',
                  serviceStartTime: nowIso,
                  createdAt: nowIso,
                  bedNumber: String(selectedBed),
                  isWalkIn: true
              });
            }
          } else {
            // Check if course is a bundled product package (แยกยอดคอร์สและยอดสินค้า)
            const courseSplit = splitCourseAndProductPrice(item, masterCourses);

            // Generate Course instances per quantity
            for (let i = 0; i < item.qty; i++) {
            const courseNo = `IC${Date.now().toString().slice(-6)}${i}`;
            const courseRef = doc(getCol('courses'));
            const courseTotalQty = String(
              item.sessions || 
              item.promoOption?.sessions || 
              item.selectedPromoOption?.sessions || 
              getFuzzyKey(item.originalItem, ["จำนวนครั้ง", "col_7"]) || 
              "1"
            );
            let creditReceived = String(
              item.credit || 
              item.creditReceived ||
              item.promoOption?.credit ||
              item.promoOption?.เครดิตที่ได้รับ ||
              item.promoOption?.วงเงินเครดิต ||
              getFuzzyKey(item.promoOption, ["เครดิต", "credit", "วงเงิน"]) ||
              getFuzzyKey(item.originalItem, ["เครดิตที่ได้รับ", "เครดิตที่ได้", "ยอดเครดิต", "เครดิต", "วงเงินคอร์ส", "col_14", "col_8"]) || 
              "0"
            );
            if (parseNumber(creditReceived) === 0 && String(item.name).match(/(เติมเงิน|เครดิต|วงเงิน|ฝากเงิน|voucher)/i)) {
                creditReceived = String(item.price);
            }
            
            let expireDateStr = "";
            const sessCount = parseInt(courseTotalQty) || 1;
            const customExpStr = String(getFuzzyKey(item.originalItem, ["วันหมดอายุ", "col_10", "กำหนดเวลา", "กำหนดระยะเวลา"]) || '').trim();
            if (customExpStr && customExpStr.includes('/') && !customExpStr.startsWith('http') && !customExpStr.includes('firebasestorage')) {
                expireDateStr = customExpStr;
            } else {
                const expDate = new Date(customDateObj);
                if (sessCount === 1 || item.type === 'single_course') {
                    expDate.setDate(expDate.getDate() + 7);
                } else if (sessCount <= 5) {
                    expDate.setMonth(expDate.getMonth() + 3);
                } else {
                    expDate.setMonth(expDate.getMonth() + 6);
                }
                const exY = expDate.getFullYear() + 543;
                expireDateStr = `${String(expDate.getDate()).padStart(2, '0')}/${String(expDate.getMonth() + 1).padStart(2, '0')}/${exY}`;
            }

            const courseReceivedItems = String(
              item.items || 
              item.promoOption?.items || 
              getFuzzyKey(item.originalItem, ["รายการที่ได้รับ", "col_11"]) || 
              ''
            );

            const courseData = {
              "เบอร์โทร": cPhone || '-',
              "col_1": cPhone || '-',
              "cleanPhone": custCleanPhone,
              "เลขที่ใบคอส": courseNo,
              "col_2": courseNo,
              "รหัสคอส": String(getFuzzyKey(item.originalItem, ["รหัสคอส", "col_1", "code"]) || item.id || ''),
              "วันที่ซื้อ": customDateObj.toLocaleDateString('th-TH'),
              "col_3": customDateObj.toLocaleDateString('th-TH'),
              "ผู้ซื้อคอส": cName,
              "col_9": cName,
              "ชื่อคอส": item.name,
              "col_8": item.name,
              "สาขาที่ซื้อ": String(globalBranch || "สำนักงานใหญ่"),
              "ราคา": String(item.price),
              "col_13": String(item.price),
              "เครดิตที่ได้รับ": creditReceived,
              "col_14": creditReceived,
              "จำนวนครั้งที่ได้": courseTotalQty,
              "col_10": courseTotalQty,
              "col_4": courseTotalQty,
              "ยอดค้างชำระ": "0",
              "ยอดชำระแล้วทั้งหมด": String(item.price),
              "ครั้งที่ใช้": "0",
              "col_5": "0",
              "ครั้งที่เหลือดิบ": courseTotalQty,
              "col_33": courseTotalQty,
              "สถานะ": "ยังคงเหลือ",
              "col_6": "ยังคงเหลือ",
              "ประเภทการชำระ": paymentMethodStr,
              "รายการที่ได้รับ": courseReceivedItems,
              "col_11": courseReceivedItems,
              "ฟรีบัตรสมาชิก": String(getFuzzyKey(item.originalItem, ["ฟรีบัตรสมาชิก"]) || 'ไม่'),
              "claimedItems": [],
              "createdAt": customDateObj.toISOString(),
              "promoOption": item.promoOption || null,
              "isWalkIn": Boolean(selectedCustomer?.isWalkIn),
              "hasMemberCard": Boolean(selectedCustomer?.hasMemberCard || selectedCustomer?.isApproved || isVipCustomer),
              "membershipStatus": (selectedCustomer?.hasMemberCard || selectedCustomer?.isApproved || isVipCustomer) ? "บัตรสมาชิก" : "ทั่วไป",
              "hasProductSet": courseSplit.hasProductSet,
              "coursePrice": String(courseSplit.coursePricePerUnit),
              "productPrice": String(courseSplit.prodPricePerUnit)
            };
            if (expireDateStr) courseData["วันหมดอายุ"] = expireDateStr;
            batch.set(courseRef, courseData);

            // History for course
            const historyRef = doc(getCol('histories'));
            batch.set(historyRef, {
              "วันที่": customDateObj.toLocaleDateString('th-TH'),
              "ชื่อลูกค้า": cName,
              "col_2": cName,
              "เบอร์โทร": cPhone || '-',
              "col_3": cPhone || '-',
              "cleanPhone": custCleanPhone,
              "หมายเลขคำสั่งซื้อ": orderNo,
              "ประเภท": "ซื้อคอร์ส",
              "col_4": "ซื้อคอร์ส",
              "สถานะ": "เรียบร้อย",
              "สินค้า": item.name,
              "col_18": item.name,
              "col_8": item.name,
              "ยอดเงิน": String(item.price),
              "col_19": String(item.price),
              "col_13": String(item.price),
              "สาขา": String(globalBranch || "เฉวง"),
              "เลขที่ใบคอส": courseNo,
              "col_14": courseNo,
              "อ้างอิง": courseNo,
              "col_6": courseNo,
              "พนักงาน": paymentStaff,
              "isWalkIn": Boolean(selectedCustomer?.isWalkIn),
              "hasMemberCard": Boolean(selectedCustomer?.hasMemberCard || selectedCustomer?.isApproved || isVipCustomer),
              "hasProductSet": courseSplit.hasProductSet,
              "coursePrice": String(courseSplit.coursePricePerUnit),
              "productPrice": String(courseSplit.prodPricePerUnit),
              "courseCommissionBase": String(courseSplit.coursePricePerUnit),
              "productCommissionBase": String(courseSplit.prodPricePerUnit)
            });
            }
          }
        }
      }

      // Apply accumulated product stock updates (single write per product ID)
      pendingProductStockMap.forEach(({ stock_by_branch }, prodId) => {
        const nextTotal = Object.values(stock_by_branch).reduce((sum, v) => sum + (Number(v) || 0), 0);
        batch.set(doc(db, 'products', prodId), {
          stock_by_branch,
          "จำนวนคงเหลือ": String(nextTotal)
        }, { merge: true });
      });

      // Apply accumulated claim updates for courses
      for (const [cId, updatedItems] of Object.entries(courseClaimUpdates)) {
        batch.update(doc(db, 'courses', cId), {
           claimedItems: updatedItems
        });
      }

      // Master Order Record (signatures stored in history only, not here — reduces batch payload size)
      const orderRef = doc(getCol('orders'));
      // NOTE: Signatures are NOT stored on the order doc to keep batch small & fast
      
      let totalCost = 0;
      let courseCost = 0;
      let productCost = 0;
      for (const item of cart) {
        if (item.type === 'course') {
           const costAmt = (item.price * item.qty) * 0.10;
           courseCost += costAmt;
           totalCost += costAmt;
        } else if (item.originalItem && item.type !== 'debt_payment' && item.type !== 'usage') {
           const costAmt = computeOwnerCostPrice(item.originalItem) * item.qty;
           productCost += costAmt;
           totalCost += costAmt;
        }
      }
      
      let transactionType = 'sale';
      if (cart.some(i => i.actionType === 'owner_purchase')) transactionType = 'owner_purchase';
      else if (cart.some(i => i.actionType === 'branch_requisition')) transactionType = 'branch_requisition';

      batch.set(orderRef, {
        orderNo,
        customerName: cName,
        customerPhone: cPhone || '-',
        cleanPhone: custCleanPhone,
        isWalkIn: Boolean(selectedCustomer?.isWalkIn),
        hasMemberCard: Boolean(selectedCustomer?.hasMemberCard || selectedCustomer?.isApproved || isVipCustomer),
        membershipStatus: (selectedCustomer?.hasMemberCard || selectedCustomer?.isApproved || isVipCustomer) ? "บัตรสมาชิก" : "ทั่วไป",
        courseName: itemsStr.join(', '), // Summarize items
        price: String(isOwnerZeroPay ? 0 : total),
        discount: String(isOwnerZeroPay ? (Number(globalDiscount) + total) : globalDiscount),
        promotionId: selectedPromotion || null,
        promoDiscount: String(promoDiscount),
        qty: String(effectiveCart.reduce((sum, item) => sum + item.qty, 0)),
        branch: String(globalBranch || "เฉวง"),
        status: posTrackingNo.trim() ? "กำลังจัดส่ง" : "สำเร็จ",
        paymentMethod: paymentMethodStr,
        source: "POS",
        orderChannel,
        shippingAddress,
        trackingNo: posTrackingNo.trim(),
        fulfillment: posTrackingNo.trim() ? 'shipped' : '',
        wcOrderId: activeWcOrderId,
        createdAt: customDateObj.toISOString(),
        paymentStaff,
        usedServices: usedServices.map(s => getFuzzyKey(s, ["ชื่อคอส", "col_4"])),
        transactionType,
        totalCost: String(totalCost),
        courseCost: String(courseCost),
        productCost: String(productCost),
        cartItems: effectiveCart.map(i => ({
          id: i.id,
          name: i.name,
          qty: i.qty,
          price: i.price,
          type: i.type,
          itemName: i.itemName || null,
          courseId: i.courseId || null,
          linkedProductId: i.linkedProductId || null,
          linkedProductCode: i.linkedProductCode || '',
          linkedProductName: i.linkedProductName || '',
          skipStockDeduction: Boolean(i.skipStockDeduction)
        }))
      });

      if (activeCustomerAppOrderIds.length > 0) {
        activeCustomerAppOrderIds.forEach(id => {
          const custAppOrderRef = doc(getCol('orders'), id);
          batch.update(custAppOrderRef, {
            status: "ชำระเงินแล้ว",
            mergedIntoPosOrderNo: orderNo,
            updatedAt: customDateObj.toISOString()
          });
          
          // Send LINE Notification
          const relatedOrder = orders.find(o => o.id === id);
          if (relatedOrder && relatedOrder.customerPhone) {
             const targetCustomer = customers.find(c => String(c.computedPhone || getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '').trim() === String(relatedOrder.customerPhone).trim());
             if (targetCustomer && targetCustomer.lineUid) {
                 sendOrderLineNotification(relatedOrder, 'อนุมัติแล้ว', targetCustomer.lineUid);
             }
          }
        });
      }

      // 🌟 บันทึกรายการค่ามือบริการ (DF) ลง service_logs สำหรับพนักงานที่เลือก
      if (selectedHandFees && selectedHandFees.length > 0) {
        const staffList = paymentStaff ? paymentStaff.split('/').map(s => s.trim()).filter(Boolean) : [];
        const targetStaff = staffList.length > 0 
          ? staffList.map(sName => employees.find(e => e.name === sName)).filter(Boolean)
          : (activeStaff ? [activeStaff] : []);

        targetStaff.forEach(emp => {
          selectedHandFees.forEach(srv => {
            const perStaffFee = Math.round((Number(srv.fee) || 0) * (Number(srv.qty) || 1) / (targetStaff.length || 1));
            const srvLogRef = doc(getCol('service_logs'));
            batch.set(srvLogRef, {
              date: getLocalYYYYMMDD(customDateObj),
              type: srv.name,
              amount: perStaffFee,
              quantity: Number(srv.qty) || 1,
              note: `POS: ${orderNo}`,
              employeeId: emp.id,
              employeeName: emp.name,
              branch: String(globalBranch || "เฉวง"),
              createdAt: customDateObj.toISOString()
            });
          });
        });
      }

      await batch.commit();

      // 🌟 ปิดบิล Woo อัตโนมัติ: ออเดอร์แอปที่ถูกสร้างบน irisnatures.com (มี wcOrderId บน OD)
      // → เมื่อ POS เก็บเงินเสร็จ (stamp ชำระเงินแล้ว) ให้ completed บนเว็บด้วย กัน POS ดึงซ้ำ/ค้างสถานะ processing
      if (activeCustomerAppOrderIds.length > 0) {
        (async () => {
          for (const oid of activeCustomerAppOrderIds) {
            try {
              const od = orders.find(o => o.id === oid);
              if (od && od.wcOrderId) {
                await fetchWithProxy(`https://irisnatures.com/wp-json/wc/v3/orders/${od.wcOrderId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'completed' }) }, true);
                console.log(`✅ Woo order #${od.wcOrderId} completed (ออเดอร์แอป ${od.orderNo} ปิดบิลแล้ว)`);
              }
            } catch (e) { console.error(`Failed to complete Woo order for ${oid}:`, e); }
          }
        })();
      }

      // 📮 ถ้ากรอกเลขพัสดุตอนชำระ → ลงทะเบียน 17TRACK + ดึงสถานะเก็บลงบิลทันที (เบื้องหลัง)
      const posTrackingClean = posTrackingNo.trim();
      if (posTrackingClean) {
        (async () => {
          try {
            try { await fetch17Track('https://api.17track.net/track/v2.2/register', [{ number: posTrackingClean }]); } catch (e) {}
            const json = await fetch17Track('https://api.17track.net/track/v2.2/gettrackinfo', [{ number: posTrackingClean }]);
            const acc = json?.data?.accepted?.[0];
            const ti = acc?.track_info || null;
            const allEvents = (ti?.tracking?.providers || []).flatMap(p => p?.events || []);
            const lastEv = ti?.latest_event || allEvents[allEvents.length - 1] || null;
            const normPhase = (s) => { const x = String(s || 'Pending'); return (x.charAt(0).toLowerCase() + x.slice(1)).replace(/_([a-zA-Z])/g, (m, c) => c.toUpperCase()); };
            await updateDoc(orderRef, { trackingInfo: {
              number: posTrackingClean,
              carrier: acc?.carrier ? String(acc.carrier) : '',
              phase: normPhase(ti?.latest_status?.status),
              lastEvent: lastEv ? { time: lastEv.time_iso || '', desc: lastEv.description || '', location: lastEv.location || '' } : null,
              events: allEvents.slice(-8).reverse().map(e => ({ time: e.time_iso || '', desc: e.description || '', location: e.location || '' })),
              fetchedAt: new Date().toISOString()
            }});
            console.log(`✅ 17TRACK พร้อมสำหรับ ${orderNo} (${posTrackingClean})`);
          } catch (e) { console.error('17TRACK at checkout failed:', e); }
        })();
      }

      // --- Background: Upload Heavy Images ---
      if (delayedHistoryUpdates.length > 0) {
        (async () => {
            try {
                const imgBatch = writeBatch(db);
                delayedHistoryUpdates.forEach(update => {
                    imgBatch.update(update.ref, update.data);
                });
                await imgBatch.commit();
            } catch (err) {
                console.error('Failed to upload heavy images in background:', err);
            }
        })();
      }

      // --- Auto-complete Active Queue (non-blocking: runs after commit) ---
      const custPhoneForQueue = cPhone;
      const targetBkId = activeBookingId;
      if (custPhoneForQueue || targetBkId) {
        (async () => {
          try {
            const nowIso = new Date().toISOString();
            const nowTimeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
            
            // Explicit target booking from queue card/check-in
            if (targetBkId) {
              try {
                await updateDoc(doc(db, 'bookings', targetBkId), {
                  status: 'เสร็จสิ้น',
                  completedAt: nowIso,
                  serviceEndTime: nowTimeStr,
                  posReceiptNo: orderNo || null
                });
              } catch (errBk) {
                console.warn('Failed to update explicit booking:', errBk);
              }
            }

            // Customer phone active bookings
            if (custPhoneForQueue) {
              const qBk = query(
                collection(db, 'bookings'),
                where('customerPhone', '==', custPhoneForQueue),
                where('status', '==', 'กำลังใช้บริการ')
              );
              const snapBk = await getDocs(qBk);
              if (!snapBk.empty) {
                const queueBatch = writeBatch(db);
                snapBk.forEach(docSnap => {
                  queueBatch.update(docSnap.ref, { 
                    status: 'เสร็จสิ้น', 
                    completedAt: nowIso,
                    serviceEndTime: nowTimeStr,
                    posReceiptNo: orderNo || null
                  });
                });
                await queueBatch.commit();
              }
            }
          } catch (e) {
            console.error('Error auto-completing queue:', e);
          }
        })();
      }
      
      if (appliedVoucherId) {
        updateDoc(doc(db, 'coupons', appliedVoucherId), { isUsed: true, usedAt: new Date().toISOString() })
          .catch(e => console.error("Failed to mark voucher used", e));
      }

      // 🌟 สิทธิพิเศษ CRM: มอบคูปอง CRM20 & BOOK10 ให้ลูกค้าในระบบอัตโนมัติ เพื่อดึงกลับมาซื้อซ้ำ/จองออนไลน์ 🌟
      if (selectedCustomer?.id && !selectedCustomer.isWalkIn && !selectedCustomer.id.startsWith('walkin-')) {
        updateDoc(doc(db, 'customers', selectedCustomer.id), {
          collectedCoupons: arrayUnion('CRM20', 'BOOK10')
        }).catch(e => console.error("Failed to auto-grant CRM coupons:", e));
      }

      if (isOwnerDirectUsage) {
        showToast('✨ บันทึกการใช้คอส (เช็คเบื้องต้น) เรียบร้อยแล้ว!', 'success');
      } else {
        showToast('ชำระเงินสำเร็จ!', 'success');
      }
      
      // 🌟 อัปเดตสถานะคอร์สที่กำลังให้บริการ ให้เปลี่ยนเป็น "เรียบร้อย" เมื่อจ่ายเงินครบ 🌟
      try {
        const updatedServices = { ...activeServiceCourses };
        usageItemsInCart.forEach(ci => {
          updatedServices[ci.id] = {
            status: 'เรียบร้อย',
            completedAt: Date.now()
          };
        });
        saveActiveServiceCourses(updatedServices);
      } catch (err) {
        console.warn('Error updating completed active service state:', err);
      }

      // 🌟 อัปเดตสถานะคิวใน active_services Firestore ให้เปลี่ยนเป็น "เรียบร้อย" เมื่อตัดยอด/จ่ายเงินสำเร็จ
      (async () => {
        try {
          const snap = await getDocs(query(collection(db, 'active_services'), where('status', 'in', ['รอรับบริการ', 'กำลังให้บริการ'])));
          const b = writeBatch(db);
          let hasAny = false;
          snap.forEach(docSnap => {
            const data = docSnap.data();
            const isMatch = usageItemsInCart.some(ci => 
              data.courseId === ci.id || 
              data.courseDocId === ci.id || 
              (Array.isArray(data.courses) && data.courses.some(sc => sc.id === ci.id)) ||
              (data.customerPhone && ci.originalItem && String(getFuzzyKey(ci.originalItem, ["เบอร์โทร", "col_1"])).trim() === String(data.customerPhone).trim())
            );
            if (isMatch) {
              b.update(docSnap.ref, {
                status: 'เรียบร้อย',
                completedAt: new Date().toISOString()
              });
              hasAny = true;
            }
          });
          if (hasAny) await b.commit();
        } catch (e) {
          console.warn('Error completing active_services from POS:', e);
        }
      })();

      setShowPaymentModal(false);
      setSelectedBed('');

      // Save data for receipt modal instead of clearing everything immediately
      const todayStr = getLocalYYYYMMDD(customDateObj);
      const normCurrentBranch = normalizeBranchName(globalBranch || "เฉวง");
      const todayBranchOrders = orders.filter(o => 
         o.createdAt && getLocalYYYYMMDD(o.createdAt) === todayStr && normalizeBranchName(o.branch || "เฉวง") === normCurrentBranch
      );
      // Include this current order in the count by adding 1
      const queueNo = String(todayBranchOrders.length + 1).padStart(3, '0');

      // Read signatures here (only for receipt display — NOT stored in Firestore batch)
      const custSignatureUrl = custSigRef.current?.toDataURL() || customerSignature || null;
      const staffSignatureUrl = staffSigRef.current?.toDataURL() || staffSignature || null;

      if (custSigRef.current) {
        const ctx = custSigRef.current.getContext('2d');
        ctx?.clearRect(0, 0, custSigRef.current.width, custSigRef.current.height);
        delete custSigRef.current.dataset.isSigned;
      }
      if (staffSigRef.current) {
        const ctx = staffSigRef.current.getContext('2d');
        ctx?.clearRect(0, 0, staffSigRef.current.width, staffSigRef.current.height);
        delete staffSigRef.current.dataset.isSigned;
      }
      setCustomerSignature(null);
      setStaffSignature(null);

      setReceiptData({
        orderNo,
        queueNo,
        customerName: cName,
        customerPhone: cPhone,
        items: effectiveCart,
        subtotal,
        total,
        globalDiscount,
        appliedVoucherCode,
        promotionId: selectedPromotion || null,
        promoDiscount,
        promoFreeItems: selectedPromotion ? promoResult.freeItems : null,
        promoNextTimeDiscount: selectedPromotion ? promoResult.nextTimeDiscount : null,
        totalSaved,
        paymentMethodStr,
        orderChannel,
        shippingAddress,
        trackingNo: posTrackingClean,
        splitPayment: {...splitPayment},
        createdAt: customDateObj,
        customerSignature: custSignatureUrl,
        staffSignature: staffSignatureUrl,
        usedServices: usedServices.map(s => getFuzzyKey(s, ["ชื่อคอส", "col_4"]))
      });
      setCart([]);
      setUsedServices([]);
      setSelectedHandFees([]);
      setShowCustomHandFeeInput(false);
      setCustomHandFeeForm({ name: '', fee: '' });
      setPaymentPhotos({ before: [], after: [] });
      setOmiseChargeData(null);
      setIsPollingOmise(false);
      setShowOmiseQrModal(false);
      setPosTrackingNo('');
      setShippingAddress('');
      setSplitPayment({ cash: 0, transfer: 0, cod: 0, credit: 0, omise_promptpay: 0 });
      setCheckoutStep(1);
      setAppCreditPaidAmount(0);
      setGlobalDiscount(0);
      setAppliedVoucherId(null);
      setAppliedVoucherCode(null);
      setAppliedVoucherData(null);
      setSelectedCustomer(null);
      setActiveWcOrderId(null);
      setActiveCustomerAppOrderIds([]);
      setIsOwnerDirectUsage(false);
      setIsMobileCartOpen(false); // Close cart immediately so receipt shows properly
      setActiveTab('products'); // 🌟 ชำระเงินเสร็จให้กลับมาหน้าขายครีมทุกครั้ง

      // If autoPrint is enabled — open preview immediately so print fires without user action (desktop only, no mobile freezing)
      const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (autoPrint && !isMobile) {
        setPrintMode('receipt');
        setShowPreviewModal(true);
      }
      
      // Send LINE Flex Message Notification for POS Checkout
      if (selectedCustomer && selectedCustomer.lineUid && !isRequisitionMode) {
          const receiptForLine = {
             receiptNo: orderNo,
             items: cart,
             totalAmount: subtotal,
             discount: totalSaved,
             finalAmount: total
          };
          sendPOSCheckoutNotification(receiptForLine, selectedCustomer.lineUid)
              .catch(e => console.warn('POS Line notification failed:', e.message));
      }

    } catch (error) {
      console.error(error);
      showToast(`เกิดข้อผิดพลาด: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // 🌟 เริ่มต้นขายบิลใหม่ทันที (ปุ๊ปปั๊ป ไม่ต้องรอ ล้างข้อมูลเพื่อพร้อมรับลูกค้าคนต่อไปทันที)
  const handleQuickNewSale = () => {
    setReceiptData(null);
    setCart([]);
    setAppCreditPaidAmount(0);
    setActiveCustomerAppOrderIds([]);
    setSelectedCustomer(null);
    setCustomerSearch('');
    setGlobalDiscount(0);
    setSplitPayment({ cash: 0, transfer: 0, cod: 0, credit: 0, omise_promptpay: 0 });
    setShippingAddress('');
    setPosTrackingNo('');
    setOrderChannel('instore');
    setActiveWcOrderId(null);
    setIsMobileCartOpen(false);
    setActiveTab('products');
    if (posReturnToStaffAfterCheckout && onReturnToStaffDashboard) {
      onReturnToStaffDashboard();
    } else if (posReturnToAppointmentsAfterCheckout && onReturnToAppointments) {
      onReturnToAppointments();
    }
  };



  const handleSaveA4AsImage = () => {
    const printArea = document.getElementById('eod-a4-content');
    if (printArea) {
      setIsSavingImage(true);
      html2canvas(printArea, { scale: 2, useCORS: true }).then(canvas => {
        const link = document.createElement('a');
        link.download = `รายงานสรุปยอด_${new Date().toLocaleDateString('th-TH').replace(/\//g, '-')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        setIsSavingImage(false);
      }).catch(err => {
        console.error('Error saving image:', err);
        setIsSavingImage(false);
        showToast('เกิดข้อผิดพลาดในการบันทึกรูปภาพ', 'error');
      });
    }
  };

  const handleEodSubmit = async () => {
    if (!eodData.submittedBy) {
      showToast('กรุณาเลือกผู้ส่งยอด', 'error');
      return;
    }
    if (eodData.actualCash === '' && !isOwnerZeroEod) {
      showToast('กรุณาระบุยอดส่งเงินสด', 'error');
      return;
    }

    setIsSubmittingEod(true);
    try {
      const expectedCash = eodBreakdown.cash + (parseNumber(eodData.floatCash) || 0);
      const nonCashSales = (eodBreakdown.transfer || 0) + (eodBreakdown.credit || 0) + (eodBreakdown.cod || 0);
      
      const expectedTotalSystemBalance = expectedCash + nonCashSales;
      const floatCashNum = parseNumber(eodData.floatCash) || 0;
      const baseFloat = Math.floor(floatCashNum / 100) * 100;
      const expectedTheoreticalDeposit = Math.floor(expectedTotalSystemBalance / 100) * 100 - baseFloat;
      const expectedNextDayFloat = expectedTotalSystemBalance - expectedTheoreticalDeposit;
      const expectedRemitAmount = expectedCash - expectedNextDayFloat;

      const actualRemittedCash = parseNumber(eodData.actualCash);
      const diff = eodData.actualCash ? actualRemittedCash - expectedRemitAmount : 0;
      const actualTotalCash = eodData.actualCash ? actualRemittedCash + expectedNextDayFloat : expectedCash;

      const totalSystemBalance = actualTotalCash + nonCashSales;
      const totalTheoreticalDeposit = Math.floor(totalSystemBalance / 100) * 100 - baseFloat;
      const nextDayFloat = totalSystemBalance - totalTheoreticalDeposit;
      const remitAmount = eodData.actualCash ? actualRemittedCash : expectedRemitAmount;

      const onlineSales = eodBreakdown.online || 0;
      const eodRef = doc(getCol('daily_sales'));
      const batch = writeBatch(db);
      
      const posFilterDateObj = new Date();
      if (posFilterDate) {
        const [y, m, d] = posFilterDate.split('-');
        posFilterDateObj.setFullYear(y, m - 1, d);
      }
      const todayForFilter = posFilterDateObj.toLocaleDateString('th-TH');
      
      batch.set(eodRef, {
        date: todayForFilter,
        branch: globalBranch || "สำนักงานใหญ่",
        totalSales: todaySales + manualTransferNum,
        cashSales: eodBreakdown.cash,
        transferSales: eodBreakdown.transfer,
        codSales: eodBreakdown.cod - eodBreakdown.online,
        creditSales: eodBreakdown.credit,
        onlineSales: eodBreakdown.online,
        courseSales: eodBreakdown.courseSalesAmt,
        productSales: eodBreakdown.productSalesAmt,
        manualSales: eodBreakdown.manualSalesAmt,
        transferDetails: eodBreakdown.transferDetails,
        pendingDetails: eodBreakdown.pendingDetails,
        floatCash: floatCashNum,
        actualCash: actualTotalCash,
        expectedCash: expectedCash,
        difference: diff,
        remitAmount: remitAmount,
        totalDeposit: totalTheoreticalDeposit,
        nextDayFloat: nextDayFloat,
        imageBase64: eodData.imageBase64 || '',
        submittedBy: eodData.submittedBy,
        submittedByName: eodData.submittedBy === 'owner' ? 'เจ้าของร้าน' : (employees.find(e => e.id === eodData.submittedBy)?.name || ''),
        noSales: isEodNoSales && !manualTransferNum,
        manualTransfer: manualTransferNum,
        manualTransferNote: manualTransferNum ? (eodData.manualTransferNote || '') : '',
        status: 'รอตรวจสอบ',
        createdAt: posFilterDate ? `${posFilterDate}T${new Date().toISOString().split('T')[1]}` : new Date().toISOString()
      });

      // Handle Clock Out
      if (eodData.clockOut && !isEodBackdated && eodData.submittedBy !== 'owner') {
         const today = getLocalYYYYMMDD();
         const attRecord = employeeAttendance.find(a => a.employeeId === eodData.submittedBy && a.date === today && !a.clockOut);
         if (attRecord) {
             const attRef = doc(db, 'employee_attendance', attRecord.id);
             batch.update(attRef, { clockOut: new Date().toISOString() });
         }
      }

      await batch.commit();
      
      showToast('ส่งยอดประจำวันเรียบร้อยแล้ว!', 'success');
      quickEodSubmittedRef.current = true;
      setShowEodModal(false);
      setEodData({ actualCash: '', floatCash: '1000', imageBase64: '', submittedBy: '', clockOut: true, manualTransfer: '', manualTransferNote: '' });
    } catch (error) {
      console.error(error);
      showToast(`เกิดข้อผิดพลาด: ${error.message}`, 'error');
    } finally {
      setIsSubmittingEod(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
          setEodData({ ...eodData, imageBase64: compressedDataUrl });
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };


  const handleProcessCustomerAppOrder = (orderOrOrders) => {
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
      
      
      const itemsList = (order.cartItems && Array.isArray(order.cartItems) && order.cartItems.length > 0)
        ? order.cartItems
        : [{
            id: order.courseId || order.id,
            name: order.courseName || order.name || 'สินค้าจากคำสั่งซื้อ',
            price: Number(order.itemPrice ?? order.totalPrice ?? order.price ?? 0),
            qty: Number(order.qty || 1),
            type: (order.courseName || order.courseId || order.type === 'course') ? 'course' : 'product',
            sessions: order.sessions || 1,
            items: order.items || ''
          }];

      itemsList.forEach(item => {
        const isCourse = item.type === 'course' || !!item.sessions || !!item.promoOption || !!item.courseId || (masterCourses && masterCourses.some(c => c.id === item.courseId || c.id === item.id || (item.id && String(item.id).startsWith(c.id))));
        const itemType = item.type || (isCourse ? 'course' : 'product');
        let origItem = null;
        if (itemType === 'product') {
          origItem = (products || []).find(p => p.id === item.id || String(p["ชื่อสินค้า"] || p.name) === String(item.name)) || null;
        } else if (itemType === 'course') {
          origItem = (masterCourses || []).find(c => c.id === item.courseId || c.id === item.id || (item.id && String(item.id).startsWith(c.id)) || String(c["ชื่อคอส"] || c.name) === String(item.name)) || null;
        }
        
        const existingIdx = newCart.findIndex(ci => ci.id === item.id && ci.type === itemType);
        if (existingIdx >= 0) {
           newCart[existingIdx].qty += Number(item.qty || 1);
        } else {
           newCart.push({
            id: item.id,
            originalItem: origItem,
            name: item.name,
            price: Number(item.price || 0),
            qty: Number(item.qty || 1),
            type: itemType,
            sessions: item.sessions || item.promoOption?.sessions || (origItem ? getFuzzyKey(origItem, ["จำนวนครั้ง", "col_7"]) : 1),
            items: item.items || item.promoOption?.items || (origItem ? getFuzzyKey(origItem, ["รายการที่ได้รับ", "col_11"]) : ''),
            promoOption: item.promoOption || null,
            credit: item.credit || (origItem ? getFuzzyKey(origItem, ["เครดิตที่ได้รับ", "วงเงินคอร์ส", "col_14"]) : 0)
          });
        }
      });
    });

    setCart(newCart);
    setActiveCustomerAppOrderIds(prev => [...new Set([...prev, ...ordersToProcess.map(o => o.id)])]);

    // 🌟 ตรวจออเดอร์ที่ลูกค้า "จ่ายเครดิตไปแล้วในแอป" → ปล่อยสินค้าได้เลยโดย POS ต้องไม่ตัดเครดิตซ้ำ
    const creditPaidOrders = ordersToProcess.filter(o =>
      o.paymentMethod === 'credit' || o.paymentMethod === 'balance_pay' || String(o.paymentMethod || '').includes('ตัดเครดิต')
    );
    let appPaidTotal = appCreditPaidAmount;
    if (creditPaidOrders.length > 0) {
      const addedAmt = creditPaidOrders.reduce((s, o) => s + parseNumber(o.itemPrice ?? o.totalPrice ?? o.price ?? 0), 0);
      appPaidTotal += addedAmt;
      setAppCreditPaidAmount(appPaidTotal);
      // ล้างการเลือกเครดิต (ถ้ามี) กันพนักงานเผลอกดชำระด้วยเครดิตซ้ำ
      setSplitPayment(prev => ({ ...prev, credit: 0 }));
    }

    if (totalDiscountAmt > 0) {
      setDiscountType('amount');
      setDiscountVal(totalDiscountAmt);
      setGlobalDiscount(prev => prev + totalDiscountAmt);
    }

    const addedSubtotal = ordersToProcess.reduce((sum, o) => {
      const itemsSum = (o.cartItems || []).reduce((s, it) => s + (Number(it.price || 0) * Number(it.qty || 1)), 0);
      return sum + (itemsSum || parseNumber(o.price ?? o.totalPrice ?? o.itemPrice ?? 0));
    }, 0);
    const remainingToCollect = Math.max(0, addedSubtotal - totalDiscountAmt - (creditPaidOrders.length > 0 ? creditPaidOrders.reduce((s, o) => s + parseNumber(o.itemPrice ?? o.totalPrice ?? o.price ?? 0), 0) : 0));

    if (hasTransfer) {
      setOrderChannel('web');
      if (remainingToCollect > 0) {
        setSplitPayment(prev => ({ ...prev, transfer: (prev.transfer || 0) + remainingToCollect }));
      }
    } else if (creditPaidOrders.length > 0) {
      setOrderChannel('instore');
    } else {
      setOrderChannel('instore');
      if (remainingToCollect > 0) {
        setSplitPayment(prev => ({ ...prev, cash: (prev.cash || 0) + remainingToCollect }));
      }
    }

    showToast(creditPaidOrders.length > 0
      ? `ดึงออเดอร์เข้าตะกร้าสำเร็จ — ⚠️ ลูกค้าจ่ายเครดิตไปแล้วในแอป ฿${appPaidTotal.toLocaleString()} ห้ามเลือก "ใช้เครดิต" ซ้ำ`
      : 'ดึงรายการออเดอร์เข้าตะกร้าสำเร็จ', 'success');
  };

  const renderCustomerContext = () => {
    if (!selectedCustomer) return null;
    const cPhone = String(selectedCustomer.computedPhone || getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3"]) || '').trim();
    if (!cPhone) return null;

    const pendingBookingStatuses = ['รอยืนยัน', 'รอการยืนยัน', 'รอตรวจสอบยอดโอน', 'รอเข้ารับบริการ', 'ยืนยันแล้ว', 'รอคิว'];
    const custBookings = bookings.filter(b => b.customerPhone === cPhone && pendingBookingStatuses.includes(b.status)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const custOrders = orders.filter(o => o.customerPhone === cPhone && (!o.source || o.source !== 'POS') && o.status && String(o.status).includes('รอ') && !activeCustomerAppOrderIds.includes(o.id)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (custBookings.length === 0 && custOrders.length === 0) {
       if (showCustomerContextModal) setShowCustomerContextModal(false);
       return null;
    }

    const totalPending = custBookings.length + custOrders.length;

    return (
      <div className="mt-2 w-full animate-in fade-in slide-in-from-top-2">
        <button 
          onClick={() => setShowCustomerContextModal(true)}
          className="w-full flex items-center justify-between bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl p-3 shadow-sm transition-colors"
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            มีรายการที่ต้องจัดการ
          </div>
          <div className="bg-white text-rose-600 px-2 py-0.5 rounded-full text-xs font-black shadow-sm border border-rose-100">
            {totalPending} รายการ
          </div>
        </button>

        
      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setShowImageModal(null)}>
            <div className="relative max-w-3xl max-h-[90vh] w-full flex flex-col items-center">
                <button onClick={() => setShowImageModal(null)} className="absolute -top-12 right-0 text-white hover:text-pink-300 transition-colors p-2 bg-black/50 rounded-full">
                   <X size={24}/>
                </button>
                <img src={showImageModal} className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" alt="Slip" onClick={(e) => e.stopPropagation()} />
                <a href={showImageModal} target="_blank" rel="noreferrer" className="mt-4 px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-full font-bold shadow-lg transition-colors inline-flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                   เปิดในแท็บใหม่
                </a>
            </div>
        </div>
      )}

        {showCustomerContextModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setShowCustomerContextModal(false)}>
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="bg-rose-100 p-2 rounded-xl text-rose-600">
                    <ShoppingCart size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-base">รายการที่ต้องจัดการ</h3>
                    <p className="text-[11px] text-slate-500 font-medium">คิวจองและออเดอร์ของลูกค้ารายนี้</p>
                  </div>
                </div>
                <button onClick={() => setShowCustomerContextModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors">
                  <X size={16} />
                </button>
              </div>
              
              <div className="p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                {custBookings.length > 0 && (
                  <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-3">
                    <h4 className="text-xs font-bold text-blue-700 mb-2.5 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      คิวจองที่รอรับบริการ ({custBookings.length})
                    </h4>
                    <div className="flex flex-col gap-2">
                      {custBookings.map(b => {
                        const originalSt = b.status;
                        const st = originalSt === 'รอเข้ารับบริการ' ? 'รอการยืนยัน' : originalSt;
                        const isReady = ['ยืนยันแล้ว', 'รอคิว'].includes(st);
                        const theme = isReady 
                            ? { border: 'border-blue-200 shadow-blue-100/50', bar: 'bg-blue-400', badge: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-600', btn: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' }
                            : (st === 'รอยืนยัน' || st === 'รอการยืนยัน') 
                                ? { border: 'border-amber-200 shadow-amber-100/50', bar: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-600', btn: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' }
                                : { border: 'border-gray-200', bar: 'bg-gray-300', badge: 'bg-gray-50 text-gray-500 border-gray-200', text: 'text-gray-600', btn: 'bg-gray-500 hover:bg-gray-600 shadow-gray-200' };
                                
                        return (
                        <div key={b.id} className={`bg-white rounded-2xl border ${theme.border} shadow-sm overflow-hidden flex flex-col relative`}>
                          <div className="flex relative">
                            <div className={`w-2.5 ${theme.bar}`}></div>
                            <div className="p-3.5 flex-1">
                              <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${theme.badge}`}>{st}</span>
                                <span className="font-mono text-[10px] text-gray-400 font-bold">{b.ticketNo || b.id.slice(-6).toUpperCase()}</span>
                              </div>
                              <h4 className={`font-black text-[13px] mb-2 leading-tight ${theme.text}`}>{b.courseName || b.service || 'จองคิว'}</h4>
                              <div className="flex justify-between items-end">
                                <div className="grid grid-cols-2 gap-3 text-xs items-end">
                                    <div className="pb-0.5"><p className="text-gray-400 font-bold text-[9px] uppercase">วันที่</p><p className="font-bold text-gray-800">{b.date}</p></div>
                                    <div><p className="text-gray-400 font-bold text-[9px] uppercase mb-0.5">เวลา</p><p className={`text-lg sm:text-xl font-black tracking-tight leading-none ${theme.text.split(' ')[0]}`}>{b.time}</p></div>
                                </div>
                                <div className="shrink-0 ml-2">
                                    {isReady ? (
                                      <div className="flex gap-1">
                                        <button 
                                          onClick={(e) => { 
                                            e.stopPropagation(); 
                                            setPrintingJobSlipBooking(b);
                                          }}
                                          className={`text-white p-1.5 rounded-lg font-bold transition-all shadow-sm hover:shadow-md ${theme.btn}`}
                                          title="พิมพ์ใบงาน"
                                        >
                                          <Printer size={14} />
                                        </button>
                                        <button 
                                          onClick={(e) => { 
                                            e.stopPropagation(); 
                                            setPendingCheckInBooking(b);
                                            setShowCustomerContextModal(false);
                                          }}
                                          className={`text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-sm hover:shadow-md ${theme.btn}`}
                                        >
                                          เช็คอิน
                                        </button>
                                      </div>
                            ) : (
                              <button 
                                onClick={async (e) => { 
                                  e.stopPropagation(); 
                                  try {
                                    await updateDoc(doc(getCol('bookings'), b.id), { status: 'ยืนยันแล้ว' });
                                  } catch (error) {
                                    alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
                                  }
                                }}
                                className={`text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-sm hover:shadow-md ${theme.btn}`}
                              >
                                ยืนยันคิว
                              </button>
                            )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )})}
                    </div>
                  </div>
                )}
                
                {custOrders.length > 0 && (
                  <div className="bg-pink-50/50 border border-pink-100 rounded-2xl p-3">
                    <div className="flex justify-between items-center mb-2.5">
                      <h4 className="text-xs font-bold text-pink-700 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div>
                        ออเดอร์รอตรวจสอบ/ชำระ ({custOrders.length})
                      </h4>
                      {custOrders.length > 1 && (
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleProcessCustomerAppOrder(custOrders); 
                          }}
                          className="bg-pink-600 text-white px-2 py-1 rounded-md text-[10px] font-bold hover:bg-pink-700 transition-all shadow-sm"
                        >
                          + เพิ่มชำระทั้งหมด
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {custOrders.map(o => (
                        <div key={o.id} className="bg-white rounded-xl p-3 flex flex-col gap-2 shadow-sm border border-pink-50/80">
                          <div className="flex justify-between items-start gap-3">
                            <div className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">{o.itemName || o.courseName || 'รายการสั่งซื้อ'}</div>
                            <span className="text-[11px] font-black text-rose-600 shrink-0 bg-rose-50 px-2 py-0.5 rounded-md">฿{(Number(o.itemPrice || o.price) || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-end mt-1 pt-2 border-t border-slate-50 gap-2">
                            <span className="text-[9px] text-pink-600 bg-pink-100/80 px-2 py-1 rounded-md font-bold line-clamp-1">{o.status}</span>
                            <div className="flex gap-2 shrink-0">
                              {(o.status === 'รอตรวจสอบยอดโอน (รับคอร์สแล้ว)' || o.slipImage || o.paymentSlip || o.slipUrl || o.customOrderImage) && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const slipUrl = o.slipImage || o.paymentSlip || o.slipUrl || o.customOrderImage;
                                    if (slipUrl) {
                                        setShowImageModal(slipUrl);
                                    } else {
                                        showToast('ไม่พบรูปสลิปหรือรูปถูกลบไปแล้ว กรุณาตรวจสอบที่หน้า "คำสั่งซื้อ"', 'error');
                                    }
                                  }}
                                  className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-slate-200 transition-colors"
                                >
                                  ตรวจสลิป
                                </button>
                              )}
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  handleProcessCustomerAppOrder(o); 
                                }}
                                className="bg-pink-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-pink-700 transition-all shadow-sm shadow-pink-200 hover:shadow-md flex items-center gap-1.5"
                              >
                                <ShoppingCart size={11}/> นำเข้าตะกร้า
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                 <button onClick={() => setShowCustomerContextModal(false)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm">
                   ปิดหน้าต่าง
                 </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
    <div ref={posRef} className={`flex flex-col lg:flex-row overflow-hidden bg-slate-50 ${receiptData ? 'print:hidden' : ''} ${isFullscreen ? 'm-0 p-0 w-full h-[calc(100vh-68px)] lg:h-screen' : 'h-[100dvh] lg:h-[calc(100vh-80px)] -m-4 sm:-m-6 lg:-m-8'}`}>
      
      {/* Left: Inventory */}
      <div className="flex-1 flex flex-col h-full border-r border-slate-200">
        <div className="p-2.5 sm:p-4 bg-white border-b border-slate-200">
          
          {/* Top Row: Bed status & Live Sales Bar */}
          <div className="flex items-stretch gap-1.5 sm:gap-3 mb-3">
            <button 
              onClick={() => setIsBedModalOpen(true)} 
              className="shrink-0 sm:flex-1 py-1.5 sm:py-2 px-2 sm:px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl border border-indigo-200 shadow-xs flex items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-[0.99] relative"
              title="ดูสถานะเตียงทรีตเมนต์ (Bed Management)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 shrink-0 sm:w-[18px] sm:h-[18px]"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>
              <span className="text-xs sm:text-sm whitespace-nowrap font-black">
                <span className="sm:hidden">สถานะเตียง</span>
                <span className="hidden sm:inline">ดูสถานะเตียงทรีตเมนต์ (Bed Management)</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5 sm:ml-1 shrink-0" title="ระบบเตียงพร้อมใช้งาน"></span>
            </button>

            {/* แถบแสดงยอดขายสวยๆ ต่อท้ายป้ายเตียง */}
            <div 
              onClick={() => setShowSalesHistory(true)}
              className="flex-1 min-w-0 flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 lg:gap-3 bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-indigo-50/80 hover:from-emerald-100/90 hover:via-teal-100/80 hover:to-indigo-100/90 border border-emerald-200/90 rounded-xl p-1.5 px-2 sm:px-3 lg:px-3.5 shadow-xs hover:shadow-md transition-all cursor-pointer group select-none active:scale-[0.99]"
              title="แตะเพื่อดูรายงานยอดขายและประวัติการขายฉบับเต็ม"
            >
              {/* Icon & Live status */}
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <TrendingUp size={15} strokeWidth={2.5} className="sm:w-4 sm:h-4" />
              </div>

              {/* Total Today Sales */}
              <div className="flex flex-col text-left min-w-0 shrink-0">
                <div className="flex items-center gap-1 leading-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                  <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 tracking-wide truncate max-w-[75px] sm:max-w-none">
                    ยอดวันนี้ {globalBranch ? `(${globalBranch})` : ''}
                  </span>
                </div>
                <div className="text-xs sm:text-base font-black text-emerald-950 tracking-tight leading-tight mt-0.5">
                  ฿{totalTodayRevenue.toLocaleString()}
                </div>
              </div>

              {/* Divider */}
              <div className="h-5 sm:h-6 w-px bg-slate-300/60 mx-0.5 shrink-0"></div>

              {/* Breakdown Pills */}
              <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {/* เงินสด */}
                <div className="bg-white/90 border border-emerald-200/80 text-emerald-800 px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-bold flex items-center gap-0.5 sm:gap-1 shadow-2xs group-hover:bg-white transition-colors shrink-0">
                  <Banknote size={11} className="text-emerald-600 shrink-0 sm:w-3 sm:h-3" />
                  <span className="text-slate-500 text-[8px] sm:text-[9px]">สด</span>
                  <span className="font-extrabold">฿{(todaySalesBreakdown?.cash || 0).toLocaleString()}</span>
                </div>

                {/* โอน */}
                <div className="bg-white/90 border border-blue-200/80 text-blue-800 px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-bold flex items-center gap-0.5 sm:gap-1 shadow-2xs group-hover:bg-white transition-colors shrink-0">
                  <Smartphone size={11} className="text-blue-600 shrink-0 sm:w-3 sm:h-3" />
                  <span className="text-slate-500 text-[8px] sm:text-[9px]">โอน</span>
                  <span className="font-extrabold">฿{(todaySalesBreakdown?.transfer || 0).toLocaleString()}</span>
                </div>

                {/* ปลายทาง/COD/ค้าง (ถ้ามี) */}
                {((todaySalesBreakdown?.cod || 0) + (todaySalesBreakdown?.credit || 0)) > 0 && (
                  <div className="bg-white/90 border border-amber-200/80 text-amber-800 px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-bold flex items-center gap-0.5 sm:gap-1 shadow-2xs group-hover:bg-white transition-colors shrink-0 hidden md:flex">
                    <span className="text-amber-600 text-[8px] sm:text-[9px]">COD/ค้าง</span>
                    <span className="font-extrabold">฿{((todaySalesBreakdown?.cod || 0) + (todaySalesBreakdown?.credit || 0)).toLocaleString()}</span>
                  </div>
                )}

                {/* บิล */}
                <div className="bg-white/90 border border-indigo-200/80 text-indigo-800 px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-bold flex items-center gap-0.5 sm:gap-1 shadow-2xs group-hover:bg-white transition-colors shrink-0">
                  <FileText size={10} className="text-indigo-600 shrink-0 sm:w-[11px] sm:h-[11px]" />
                  <span className="font-extrabold">{todayBillCount}</span>
                  <span className="text-slate-500 text-[8px] sm:text-[9px]">บิล</span>
                </div>
              </div>

              {/* Click arrow */}
              <div className="text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all hidden xl:flex items-center pl-0.5 shrink-0">
                <ChevronRight size={14} />
              </div>
            </div>

            {/* Quick Action: ล้างยอดขาย POS เดือนนี้ */}
            <button 
              type="button"
              onClick={() => setShowClearPosMonthModal(true)}
              className="p-1.5 sm:p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200/80 shadow-xs transition-all active:scale-95 shrink-0 flex items-center justify-center gap-1 cursor-pointer"
              title="ล้างข้อมูลการขาย POS เดือนนี้เพื่อเตรียมใช้งานจริง (ไม่รวมการส่งยอด)"
            >
              <Trash2 size={16} className="text-rose-600" />
              <span className="hidden xl:inline text-xs font-bold text-rose-700">ล้างยอดขาย POS</span>
            </button>
          </div>

          {/* Clocked in Employees Header */}
          <div className="mb-4 flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              {onGoBack && (
                <button 
                  onClick={onGoBack} 
                  className="flex items-center gap-1 px-3 py-1.5 mr-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-indigo-600 active:scale-95 transition-all border border-slate-200 shadow-sm shrink-0"
                  title="กลับหน้าลงเวลา / สลับพนักงาน"
                >
                  <ChevronLeft size={18} strokeWidth={3} />
                  <span className="text-[10px] font-bold hidden sm:inline">สลับพนักงาน</span>
                </button>
              )}
              {clockedInEmployees.length > 0 ? (
                <div className="flex -space-x-2">
                  {clockedInEmployees.slice(0, 3).map((emp, idx) => (
                    emp.profileImage ? (
                      <img key={emp.id} src={emp.profileImage} className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm relative bg-white" style={{ zIndex: 3 - idx }} alt={emp.name} onError={(e) => { e.target.onerror = null; e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'; }} />
                    ) : (
                      <div key={emp.id} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 text-slate-400 flex items-center justify-center shadow-sm relative" style={{ zIndex: 3 - idx }}>
                        <User size={14} />
                      </div>
                    )
                  ))}
                  {clockedInEmployees.length > 3 && (
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold shadow-sm relative z-0">
                      +{clockedInEmployees.length - 3}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shadow-inner border border-indigo-200">
                  <User size={16} />
                </div>
              )}
              <div>
                <h1 className="text-sm sm:text-base font-black text-slate-800 tracking-tight">
                  {globalRole === 'owner' ? '👑 เจ้าของร้าน' : clockedInEmployees.length > 0 ? `พนักงานเข้างาน ${clockedInEmployees.length} คน` : '👨‍💼 พนักงานระบบ'}
                </h1>
                <p className="text-[10px] text-slate-500 leading-tight">
                  {globalBranch ? `สาขา ${globalBranch}` : 'ไม่ได้เลือกสาขา'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeTab === 'products' && (
                <button
                  onClick={() => setIsModeMenuOpen(!isModeMenuOpen)}
                  className={`w-10 h-10 lg:w-12 lg:h-12 flex-shrink-0 rounded-xl flex items-center justify-center transition-all ${isModeMenuOpen || isStockMode || isRequisitionMode ? 'bg-indigo-500 text-white shadow-md' : 'bg-white border border-indigo-100 text-indigo-600 shadow-sm'}`}
                  title="เปิดโหมดจัดการสินค้า"
                >
                  <Package size={20} />
                </button>
              )}
              {!(isModeMenuOpen || isStockMode || isRequisitionMode) && (
                <>
                  <button
                    onClick={() => setShowWebOrdersModal(true)}
                    className="w-10 h-10 lg:w-12 lg:h-12 flex-shrink-0 rounded-xl flex items-center justify-center transition-all bg-sky-500 text-white shadow-md relative hover:bg-sky-600"
                    title="ออเดอร์จากเว็บ (WooCommerce)"
                  >
                    <Truck size={20} />
                    {webOrders.length > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{webOrders.length}</span>
                    )}
                  </button>
                  <button
                    onClick={() => setShowShopeeModal(true)}
                    className="w-10 h-10 lg:w-12 lg:h-12 flex-shrink-0 rounded-xl flex items-center justify-center transition-all bg-orange-500 text-white shadow-md relative hover:bg-orange-600"
                    title="นำเข้าออเดอร์ Shopee"
                  >
                    <span className="font-black text-lg leading-none">S</span>
                  </button>
                  <button
                    onClick={toggleFullscreen}
                    className="hidden lg:flex w-10 h-10 lg:w-12 lg:h-12 flex-shrink-0 rounded-xl items-center justify-center transition-all bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 shadow-sm"
                    title={isFullscreen ? "ย่อหน้าจอ" : "ขยายเต็มจอ"}
                  >
                    {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                  </button>
                </>
              )}
            </div>
          </div>

        {/* Mobile Customer Selection */}
        <div className="block lg:hidden mb-2 relative z-50">
           {selectedCustomer ? (
              <>
              <div className={`p-2.5 sm:p-3 rounded-2xl border-2 transition-all relative overflow-hidden ${
                isVipCustomer 
                  ? 'bg-gradient-to-br from-emerald-50 via-teal-50/50 to-amber-50/70 border-emerald-300 shadow-sm ring-1 ring-emerald-200/50' 
                  : selectedCustomer.isWalkIn 
                    ? 'bg-gradient-to-br from-orange-50 via-amber-50/40 to-white border-orange-200 shadow-2xs' 
                    : 'bg-gradient-to-br from-slate-50 via-indigo-50/30 to-white border-slate-200 shadow-2xs'
              }`}>
                {/* Subtle Glow for VIP */}
                {isVipCustomer && (
                  <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-300/15 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />
                )}

                {/* Line 1: Avatar + Name + Badges + Actions */}
                <div className="flex items-center justify-between gap-2.5 relative z-10">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Avatar with member-themed border (Enlarged & Sharp) */}
                    <div 
                      onClick={() => {
                        const picData = getProfilePicData(selectedCustomer, customers);
                        if (picData && picData.primary) {
                          setPreviewCustomerAvatarModal({
                            url: picData.primary,
                            name: selectedCustomer.computedName || String(getFuzzyKey(selectedCustomer, ["ชื่อ", "col_1"])),
                            phone: selectedCustomer.computedPhone || String(getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3"]))
                          });
                        }
                      }}
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden shrink-0 bg-white flex items-center justify-center shadow-md cursor-pointer transition-transform active:scale-95 group relative ${
                      isVipCustomer 
                        ? 'border-2 border-emerald-400 ring-2 ring-emerald-200/80 shadow-emerald-500/15' 
                        : selectedCustomer.isWalkIn 
                          ? 'border-2 border-orange-300 ring-2 ring-orange-200/80 shadow-orange-500/15' 
                          : 'border-2 border-indigo-200 ring-2 ring-indigo-100 shadow-indigo-500/15'
                    }`}
                      title="แตะเพื่อดูรูปขนาดใหญ่"
                    >
                      {selectedCustomer.isWalkIn ? (
                        <div className={`w-full h-full ${isVipCustomer ? 'bg-gradient-to-r from-amber-500 to-yellow-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'} text-white flex items-center justify-center`}>
                          <WalkingPersonIcon size={26} className="text-white" />
                        </div>
                      ) : (() => {
                        const picData = getProfilePicData(selectedCustomer, customers);
                        if (picData && picData.primary) {
                          return (
                            <>
                              <img 
                                src={picData.primary} 
                                onError={(e) => handleProfileImgError(e, picData.fallback)}
                                alt="Profile"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Maximize size={16} className="text-white drop-shadow" />
                              </div>
                            </>
                          );
                        }
                        return <User size={26} className="text-indigo-600" />;
                      })()}
                    </div>

                    {/* Name, Phone, and Edit button */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-slate-800 text-sm sm:text-base truncate">
                          {selectedCustomer.computedName || String(getFuzzyKey(selectedCustomer, ["ชื่อ", "col_1"]))}
                        </span>

                        {selectedCustomer.isWalkIn ? (
                          <span className="bg-orange-100 text-orange-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-orange-200 shrink-0">
                            Walk-in
                          </span>
                        ) : isVipCustomer ? (
                          <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-2xs shrink-0 flex items-center gap-1 border border-emerald-300/40">
                            <Award size={9} className="text-yellow-300" /> สมาชิก VIP
                          </span>
                        ) : null}

                        {/* Quick Edit Name/Phone icon button */}
                        <button
                          type="button"
                          onClick={() => {
                            setWalkInFormData({
                              name: selectedCustomer.isWalkIn && selectedCustomer.computedName?.includes('ลูกค้าทั่วไป') ? '' : (selectedCustomer.computedName || selectedCustomer["ชื่อ"] || ''),
                              phone: selectedCustomer.computedPhone === '-' ? '' : (selectedCustomer.computedPhone || selectedCustomer["เบอร์โทร"] || ''),
                              isMember: Boolean(isVipCustomer),
                              issue: selectedCustomer.computedIssue || selectedCustomer.issue || '',
                              saveToDb: true
                            });
                            setIsWalkInEditModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                          title="แก้ไขชื่อ-เบอร์ลูกค้า"
                        >
                          <Edit size={11} />
                        </button>
                      </div>

                      <div className="text-[11px] text-slate-500 font-mono -mt-0.5 truncate">
                        {selectedCustomer.computedPhone || String(getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3"]))}
                      </div>
                    </div>
                  </div>

                  {/* Right actions: VIP Form + ดูประวัติ + Clear */}
                  <div className="flex items-center gap-1 shrink-0 relative z-10">
                    {(selectedCustomer.isApproved || vipStats.isVip || isVipCustomer) && (
                      <button 
                        type="button"
                        onClick={() => onOpenVipForm(selectedCustomer)}
                        className="text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg border border-amber-200/80 transition-all cursor-pointer shadow-2xs flex items-center gap-0.5"
                        title="ดู/สร้างใบสมัคร VIP"
                      >
                        <Award size={10} className="text-amber-600" />
                        <span>ใบสมัคร VIP</span>
                      </button>
                    )}

                    {onViewCustomerProfile && !selectedCustomer.isWalkIn && (
                      <button 
                        type="button"
                        onClick={() => {
                          onViewCustomerProfile(selectedCustomer);
                        }}
                        className="text-[10px] bg-white hover:bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg transition-colors flex items-center gap-1 font-bold border border-indigo-200 cursor-pointer shadow-2xs"
                        title="ดูประวัติลูกค้า"
                      >
                        <User size={10} />
                        <span>ดูประวัติ</span>
                      </button>
                    )}

                    <button 
                      type="button"
                      onClick={() => setSelectedCustomer(null)} 
                      className="w-6 h-6 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                      title="เปลี่ยนลูกค้า"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* Line 2: Member Toggle Pill + Credit / Pending Badges */}
                <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between gap-1.5 flex-wrap text-xs relative z-10">
                  {/* Member Toggle Pill (Compact & stylish) */}
                  <div className="inline-flex items-center p-0.5 bg-slate-200/70 rounded-lg shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(prev => ({
                          ...prev,
                          hasMemberCard: false,
                          isApproved: false,
                          isMemberDiscount: false
                        }));
                        showToast('เลือกสถานะ: ลูกค้าทั่วไป (ราคาปกติ)', 'info');
                      }}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        !isVipCustomer
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-2xs font-black'
                          : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      <WalkingPersonIcon size={10} className={!isVipCustomer ? "text-white" : "text-orange-500"} />
                      <span>ทั่วไป</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(prev => ({
                          ...prev,
                          hasMemberCard: true,
                          isApproved: true,
                          isMemberDiscount: true
                        }));
                        showToast('เลือกสถานะ: มีสิทธิ์ส่วนลดบัตรสมาชิก (VIP Price) ⭐', 'success');
                      }}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        isVipCustomer
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-2xs font-black'
                          : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      <Award size={10} className={isVipCustomer ? "text-yellow-200" : "text-emerald-600"} />
                      <span>บัตรสมาชิก ⭐</span>
                    </button>
                  </div>

                  {/* Financial / VIP Badges: เครดิต • ค้างชำระ */}
                  <div className="flex items-center gap-1.5 flex-wrap ml-auto">
                    {customerCreditBalance > 0 && (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-indigo-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-black shadow-2xs">
                        เครดิต ฿{customerCreditBalance.toLocaleString()}
                      </span>
                    )}

                    {customerPendingBalance > 0 && (
                      <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-black shadow-2xs animate-pulse">
                        ค้าง ฿{customerPendingBalance.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* 🌟 Line 3: แถบสถานะการสะสมยอดสวยๆ (VIP Progress Bar) */}
                {!selectedCustomer.isWalkIn && (
                  <div className="mt-2 pt-1.5 border-t border-slate-200/60 relative z-10">
                    <div className="flex items-center justify-between text-[10px] mb-1 font-bold">
                      <span className="flex items-center gap-1">
                        {isVipCustomer ? (
                          <span className="text-emerald-800 flex items-center gap-1 font-black">
                            <Award size={11} className="text-emerald-600" />
                            สมาชิก VIP Iris Clinic (ครบสิทธิ์แล้ว)
                          </span>
                        ) : (
                          <span className="text-slate-600 flex items-center gap-1">
                            <Award size={11} className="text-amber-500" />
                            สะสมยอดสู่สมาชิก VIP (เป้า ฿5,000)
                          </span>
                        )}
                      </span>

                      {isVipCustomer ? (
                        <span className="text-emerald-800 font-black bg-emerald-100/90 px-2 py-0.2 rounded-full border border-emerald-300/80 text-[10px]">
                          ยอดสะสม ฿{vipStats.amount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[10px]">
                          สะสม <strong className="text-indigo-600 font-black">฿{vipStats.amount.toLocaleString()}</strong> • ขาดอีก <strong className="text-amber-600 font-black">฿{Math.max(0, 5000 - vipStats.amount).toLocaleString()}</strong>
                        </span>
                      )}
                    </div>

                    {/* Visual Progress Track */}
                    <div className="w-full bg-slate-200/90 rounded-full h-2 p-0.5 overflow-hidden shadow-inner flex items-center">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 relative shadow-xs ${
                          isVipCustomer 
                            ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 w-full' 
                            : 'bg-gradient-to-r from-amber-400 via-orange-500 to-emerald-500'
                        }`}
                        style={{ width: isVipCustomer ? '100%' : `${Math.min(100, Math.max(5, (vipStats.amount / 5000) * 100))}%` }}
                      >
                        {isVipCustomer && (
                          <div className="absolute inset-0 bg-white/30 animate-pulse rounded-full" />
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Skin Issue hint (if available, compact inline) */}
                {(selectedCustomer.computedIssue || selectedCustomer.issue) && (
                  <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 flex items-center justify-between gap-1 text-[10px] text-slate-600 relative z-10">
                    <div className="min-w-0 flex items-center gap-1 truncate">
                      <Sparkles size={11} className="text-indigo-600 shrink-0" />
                      <span className="truncate">
                        <strong className="text-indigo-900">ปัญหาผิว:</strong> {selectedCustomer.computedIssue || selectedCustomer.issue}
                      </span>
                    </div>
                    {(() => {
                      const ai = analyzeSkinIssue(selectedCustomer.computedIssue || selectedCustomer.issue);
                      if (!ai || !ai.courses.length) return null;
                      const topCourse = ai.courses[0];
                      return (
                        <button 
                          type="button"
                          onClick={() => {
                            setActiveTab('courses');
                            setCourseSearch(topCourse.searchKey || '');
                          }}
                          className="text-[9px] font-black text-indigo-700 hover:text-indigo-900 bg-white px-1.5 py-0.5 rounded border border-indigo-200 shadow-2xs shrink-0 flex items-center gap-0.5"
                        >
                          <span>AI: {topCourse.shortName}</span>
                          <ChevronRight size={10} />
                        </button>
                      );
                    })()}
                  </div>
                )}
              </div>
              {renderCustomerContext()}
              </>
           ) : (
              <div className="flex gap-2">
                 <div className="relative flex-1" ref={topCustomerSearchRef}>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="ค้นหาลูกค้า..." 
                      className="w-full pl-10 pr-4 py-2 h-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                      value={customerSearch}
                      onChange={(e) => { setCustomerSearch(e.target.value); setIsCustomerDropdownOpen(true); }}
                      onFocus={() => setIsCustomerDropdownOpen(true)}
                      onBlur={() => {
                        setTimeout(() => {
                          const inTop = topCustomerSearchRef.current && topCustomerSearchRef.current.contains(document.activeElement);
                          const inCart = cartCustomerSearchRef.current && cartCustomerSearchRef.current.contains(document.activeElement);
                          if (!inTop && !inCart) {
                            setIsCustomerDropdownOpen(false);
                            setCustomerSearch('');
                          }
                        }, 200);
                      }}
                    />
                    <button 
                      onClick={() => setScannerTarget('customerSearch')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="สแกนคิวอาร์โค้ดลูกค้า"
                    >
                      <ScanLine size={18} />
                    </button>
                    {isCustomerDropdownOpen && customerSearch.trim() !== '' && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto z-50">
                        {filteredCustomers.length > 0 ? (
                          filteredCustomers.map(c => {
                            const amt = c.realAccumulatedAmount !== undefined ? c.realAccumulatedAmount : getCustomerAccumulatedAmount(c);
                            const isVip = c.isApproved !== undefined ? c.isApproved : amt >= 5000;
                            return (
                            <div key={c.id} onClick={() => { 
                               setSelectedCustomer(c); 
                               setCustomerSearch(''); 
                               setIsCustomerDropdownOpen(false); 
                               const cPhone = String(c.computedPhone || getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '').trim();
                               const hasCourses = courses.some(course => String(getFuzzyKey(course, ["เบอร์โทร", "col_1"]) || '').trim() === cPhone && course.computedRemainQty > 0);
                               if (hasCourses) {
                                 setActiveTab('my_courses');
                                 showToast('พบคอร์สคงเหลือ สามารถคลิกตัดคอร์สได้ทันที!', 'success');
                               }
                            }} className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0 flex items-center gap-3">
                               <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center border border-slate-200 shadow-2xs">
                                 {(() => {
                                   const picData = getProfilePicData(c, customers);
                                   if (picData && picData.primary) {
                                     return <img src={picData.primary} onError={(e) => handleProfileImgError(e, picData.fallback)} alt="Profile" className="w-full h-full object-cover" />;
                                   }
                                   return <User size={22} className="text-slate-400" />;
                                 })()}
                               </div>
                               <div className="flex-1 min-w-0">
                                   <div className="font-bold text-slate-800 text-sm flex items-center gap-2 truncate">
                                       {c.computedName || String(getFuzzyKey(c, ["ชื่อ", "col_1"]))}
                                       {isVip && <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-yellow-200">VIP</span>}
                                       {(c.isApproved || amt >= 5000) && (
                                         <button 
                                           onClick={(e) => { e.stopPropagation(); onOpenVipForm(c); setCustomerSearch(''); setIsCustomerDropdownOpen(false); }}
                                           className="bg-orange-500 hover:bg-orange-600 transition-colors text-white px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 active:scale-95 shadow-sm ml-auto"
                                           title="ดู/สร้างใบสมัคร VIP"
                                         >
                                           <Award size={10} /> ใบสมัคร VIP
                                         </button>
                                       )}
                                   </div>
                                   <div className="text-xs text-slate-500 mb-1">{c.computedPhone || String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]))}</div>
                                   <div className="text-[10px] text-slate-500 w-full mt-1">
                                       <div className="flex justify-between mb-0.5">
                                           <span>ยอดสะสม: ฿{amt.toLocaleString()}</span>
                                           {!isVip && <span>ขาด ฿{(5000 - amt).toLocaleString()}</span>}
                                       </div>
                                       {!isVip && (
                                           <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                               <div className="bg-yellow-400 h-1.5 rounded-full" style={{ width: `${Math.min(100, (amt / 5000) * 100)}%` }}></div>
                                           </div>
                                       )}
                                   </div>
                               </div>
                            </div>
                            );
                          })
                        ) : (
                          <div className="px-4 py-3 text-center space-y-2">
                            <div className="text-slate-500 text-xs">ไม่พบข้อมูลลูกค้าในระบบ</div>
                            {onAddCustomer && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCustSearch('');
                                  onAddCustomer();
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                              >
                                <UserPlus size={14} />
                                <span>+ ลงทะเบียนลูกค้าใหม่</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
              </div>
              {/* ปุ่มลูกค้าวอคอินทั่วไป (สีส้ม) */}
              <button 
                type="button"
                onClick={() => handleSelectWalkIn(false)}
                className="px-2 sm:px-2.5 py-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white border border-orange-400/80 rounded-xl font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all shadow-sm shadow-orange-500/20 active:scale-95 shrink-0 cursor-pointer"
                title="เลือกลูกค้าทั่วไป / วอคอิน (ราคาปกติ)"
              >
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-xs">
                  <WalkingPersonIcon size={13} className="text-orange-600" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-white tracking-wide">วอคอิน</span>
              </button>

              {/* ปุ่มลูกค้าวอคอินสิทธิ์บัตรสมาชิก (สีเขียว) */}
              <button 
                type="button"
                onClick={() => handleSelectWalkIn(true)}
                className="px-2 sm:px-2.5 py-1.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white border border-emerald-400/80 rounded-xl font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all shadow-sm shadow-emerald-500/20 active:scale-95 shrink-0 cursor-pointer"
                title="เลือกลูกค้าวอคอิน (มีสิทธิ์ส่วนลดบัตรสมาชิก VIP)"
              >
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-xs">
                  <Award size={13} className="text-emerald-600" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-white tracking-wide"><span className="hidden sm:inline">บัตร</span>สมาชิก</span>
              </button>

              {onAddCustomer && (
                   <button 
                     type="button"
                     onClick={onAddCustomer}
                     className="px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold flex items-center justify-center transition-all shadow-sm active:scale-95 shrink-0"
                     title="เพิ่มลูกค้าใหม่"
                   >
                     <UserPlus size={18} className="text-indigo-600" />
                   </button>
                 )}
              </div>
           )}
        </div>

          
          
          {!(isModeMenuOpen || isStockMode || isRequisitionMode) && (
            <div className="flex gap-2 sm:gap-4 mb-2">
              <button 
                onClick={() => setActiveTab('products')}
                className={`flex-1 py-2 px-2 sm:px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'products' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                title="สินค้าทั่วไป"
              >
                <CosmeticsIcon size={24} />
              </button>
              <button 
                onClick={() => setActiveTab('courses')}
                className={`flex-1 py-2 px-2 sm:px-4 rounded-xl font-medium transition-colors flex flex-col items-center justify-center gap-1 relative ${activeTab === 'courses' ? 'bg-pink-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                title="คอร์ส / รายครั้ง"
              >
                <div className="flex items-center gap-1">
                  <Layers size={20} />
                  <span className="text-[10px] font-bold">คอร์ส/รายครั้ง</span>
                </div>
              </button>
              <button 
                onClick={() => setActiveTab('services')}
                className={`flex-1 py-2 px-2 sm:px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'services' ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                title="บริการอื่นๆ"
              >
                <Scissors size={24} />
              </button>
              {selectedCustomer && (
                <button 
                  onClick={() => setActiveTab('my_courses')}
                  className={`flex-1 py-2 px-2 sm:px-4 rounded-xl font-medium transition-colors flex flex-col items-center justify-center gap-1 relative ${activeTab === 'my_courses' ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  title="คอร์สของฉัน"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle size={24} />
                  </div>
                  {customerPendingBalance > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white shadow-sm animate-bounce">
                      ค้างชำระ!
                    </span>
                  )}
                </button>
              )}
              {/* 🌟 ปุ่มจี้ไฝ ไว้ท้ายสุดในแถวเดียวเพื่อง่ายต่อการเลือก 🌟 */}
              <button 
                type="button"
                onClick={() => setActiveTab('mole')}
                className={`flex-1 py-2 px-2 sm:px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 relative cursor-pointer ${
                  activeTab === 'mole'
                    ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/25 ring-2 ring-orange-200'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm shadow-orange-500/20 active:scale-95'
                }`}
                title="จี้ไฝ / กระ / ติ่งเนื้อ (กดเลือกราคาด่วน)"
              >
                <Target size={20} className="text-white shrink-0" />
                <span className="text-xs sm:text-sm font-black text-white tracking-wide whitespace-nowrap">จี้ไฝ</span>
              </button>
            </div>
          )}
          <div className="block lg:hidden mb-2 flex items-center gap-2">
            <div className="flex-1 relative flex items-center gap-2">
              <div className="relative flex-1" ref={mobileSearchInputRef}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder={`ค้นหา${activeTab === 'products' ? 'สินค้า' : 'คอร์ส'}...`}
                  className="w-full pl-10 pr-4 py-2 h-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchEnter}
                  onBlur={() => {
                    setTimeout(() => {
                      const inDesktop = desktopSearchInputRef.current && desktopSearchInputRef.current.contains(document.activeElement);
                      const inMobile = mobileSearchInputRef.current && mobileSearchInputRef.current.contains(document.activeElement);
                      if (!inDesktop && !inMobile) {
                        setSearchTerm('');
                      }
                    }, 200);
                  }}
                />
              </div>
              <button 
                onClick={() => setScannerTarget('productSearch')}
                className="bg-indigo-100 text-indigo-600 w-10 h-10 rounded-xl hover:bg-indigo-200 transition-colors shrink-0 shadow-sm flex items-center justify-center cursor-pointer"
                title="แสกนบาร์โค้ด"
              >
                <ScanBarcode size={20} />
              </button>
            </div>
            <button
              onClick={() => setIsMobileCartOpen(true)}
              className="w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center transition-all bg-indigo-600 text-white shadow-md shadow-indigo-200 relative lg:hidden"
            >
              <ShoppingCart size={18} />
              {totalCartQty > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-black min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center border-2 border-white shadow-md animate-in zoom-in-75 duration-150">
                  {totalCartQty}
                </span>
              )}
            </button>
          </div>

          <div className="relative flex overflow-x-auto pb-2 -mb-2 gap-2 w-full lg:w-auto scrollbar-hide">
          {activeTab === 'products' && (isModeMenuOpen || isStockMode || isRequisitionMode) && (
            <>
            <button
              onClick={() => { setIsStockMode(!isStockMode); setIsRequisitionMode(false); setIsModeMenuOpen(false); }}
              className={`flex whitespace-nowrap items-center gap-2 rounded-xl text-sm font-bold transition-all ${isStockMode ? 'px-4 py-2 bg-rose-500 text-white shadow-lg shadow-rose-200' : 'w-10 h-10 justify-center bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              title={globalRole === 'owner' ? 'โหมดเจ้าของร้านซื้อเข้า' : 'โหมดนับสต๊อก'}
            >
              <Package size={18} /> {isStockMode && (globalRole === 'owner' ? 'ปิดโหมดซื้อเข้า' : 'ปิดโหมดนับสต๊อก')}
            </button>
            <button
              onClick={() => { setIsRequisitionMode(!isRequisitionMode); setIsStockMode(false); setIsModeMenuOpen(false); }}
              className={`flex whitespace-nowrap items-center gap-2 rounded-xl text-sm font-bold transition-all ${isRequisitionMode ? 'px-4 py-2 bg-amber-500 text-white shadow-lg shadow-amber-200' : 'w-10 h-10 justify-center bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              title="โหมดเบิกสินค้าจากศูนย์ใหญ่"
            >
              <Truck size={18} /> {isRequisitionMode && 'ปิดโหมดเบิกสินค้า'}
            </button>
            <button
              onClick={async () => {
                if (!wooIdMap || wooIdMap.size === 0) {
                  showToast('ยังโหลดข้อมูลเว็บไม่เสร็จ กรุณารอสักครู่', 'error');
                  return;
                }
                // Build batch payload
                const batchItems = [];
                for (const p of products) {
                  const productCode = String(getFuzzyKey(p, ['รหัส', 'col_1']) || '');
                  const productName = String(getFuzzyKey(p, ['ชื่อสินค้า', 'col_2']) || '');
                  const wooId = productCode ? wooIdMap.get(productCode.trim().toUpperCase()) : null; // Match by SKU only (case-insensitive)
                  if (!wooId) continue;
                  batchItems.push({ id: wooId, manage_stock: true, stock_quantity: getTotalStock(p, branches) });
                }
                if (batchItems.length === 0) {
                  showToast('ไม่พบสินค้าที่ตรงกับเว็บ ตรวจสอบชื่อ/รหัสสินค้า', 'error');
                  return;
                }
                showToast(`กำลัง Sync ${batchItems.length} สินค้าขึ้นเว็บ (Batch)...`, 'success');
                // Send in chunks of 50 (WooCommerce batch limit)
                const CHUNK = 50;
                let ok = 0, fail = 0;
                for (let i = 0; i < batchItems.length; i += CHUNK) {
                  const chunk = batchItems.slice(i, i + CHUNK);
                  try {
                    const res = await fetchWithProxy(`https://irisnatures.com/wp-json/wc/v3/products/batch`, {
                      method: 'POST',
                      body: JSON.stringify({ update: chunk })
                    }, true);
                    ok += res.update?.length || chunk.length;
                  } catch (e) {
                    fail += chunk.length;
                  }
                }
                showToast(`Sync สต๊อกเสร็จ: ✅ ${ok} สำเร็จ${fail > 0 ? ` ❌ ${fail} ล้มเหลว` : ''}`, 'success');
              }}
              className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all bg-teal-500 text-white shadow-lg shadow-teal-200 hover:bg-teal-600"
            >
              <Truck size={18} /> Sync สต๊อกขึ้นเว็บ
            </button>
            <button
              onClick={async () => {
                setIsLoadingCompare(true);
                setShowStockCompare(true);
                setStockCompareData([]);
                try {
                  let allWoo = [];
                  let page = 1;
                  while (true) {
                    const data = await fetchWithProxy(`https://irisnatures.com/wp-json/wc/v3/products?status=publish&per_page=100&page=${page}`);
                    if (!Array.isArray(data) || data.length === 0) break;
                    allWoo = allWoo.concat(data);
                    if (data.length < 100) break;
                    page++;
                  }
                  const wooSkuMap = new Map();
                  allWoo.forEach(w => { if (w.sku) wooSkuMap.set(w.sku.trim().toUpperCase(), w); });

                  const rows = [];
                  for (const p of products) {
                    const sku = String(getFuzzyKey(p, ['รหัส', 'col_1']) || '').trim().toUpperCase();
                    const name = String(getFuzzyKey(p, ['ชื่อสินค้า', 'col_2']) || '');
                    const posStock = getTotalStock(p, branches);
                    const woo = sku ? wooSkuMap.get(sku) : null;
                    const wooStock = woo ? (woo.manage_stock ? (woo.stock_quantity ?? 0) : null) : undefined;
                    rows.push({ sku, name, posStock, wooName: woo?.name || '-', wooStock, matched: !!woo });
                  }
                  setStockCompareData(rows);
                } catch(e) {
                  showToast('\u0e42\u0e2b\u0e25\u0e14\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e44\u0e21\u0e48\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08', 'error');
                } finally {
                  setIsLoadingCompare(false);
                }
              }}
              className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-all bg-violet-500 text-white shadow-lg shadow-violet-200 hover:bg-violet-600 text-sm"
            >
              \u0e40\u0e1b\u0e23\u0e35\u0e22\u0e1a\u0e2a\u0e15\u0e4a\u0e2d\u0e01 POS vs \u0e40\u0e27\u0e47\u0e1a
            </button>
            </>
          )}
            <div className="hidden lg:flex flex-1 relative items-center gap-2">
              <div className="relative flex-1" ref={desktopSearchInputRef}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text"
                  placeholder={`ค้นหา${activeTab === 'products' ? 'สินค้า' : 'คอร์ส'}...`}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchEnter}
                  onBlur={() => {
                    setTimeout(() => {
                      const inDesktop = desktopSearchInputRef.current && desktopSearchInputRef.current.contains(document.activeElement);
                      const inMobile = mobileSearchInputRef.current && mobileSearchInputRef.current.contains(document.activeElement);
                      if (!inDesktop && !inMobile) {
                        setSearchTerm('');
                      }
                    }, 200);
                  }}
                />
              </div>
              <button 
                onClick={() => setScannerTarget('productSearch')}
                className="bg-indigo-100 text-indigo-600 p-3 rounded-xl hover:bg-indigo-200 transition-colors shrink-0 shadow-sm flex items-center justify-center cursor-pointer"
                title="แสกนบาร์โค้ด"
              >
                <ScanBarcode size={22} />
              </button>
            </div>
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto p-2 sm:p-4 bg-slate-50/50 ${isStockMode ? 'pb-36' : 'pb-28'}`}>
                    {isStockMode && globalRole === 'owner' && (
            <div className="mb-6 p-4 sm:p-6 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-teal-500/10 border border-teal-100 rounded-3xl shadow-sm">
              <h3 className="text-sm font-bold text-teal-700 mb-2">เจ้าของร้านซื้อเข้า (Owner Purchase)</h3>
              <div className="text-xs text-teal-600 font-medium space-y-1">
                <p>• ราคาทุนคิดจากราคาสมาชิก - ส่วนลดเจ้าของร้าน</p>
                <p>• ราคาสมาชิกมาจากคอลัมน์ "ราคาสมาชิก"</p>
                <p>• ถ้าราคาสมาชิกไม่มีค่า จะใช้ราคาปลีกเต็ม</p>
              </div>
            </div>
          )}
          {activeTab === 'products' && (
            <div className="space-y-2 mb-3 px-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-200/70 p-1 rounded-xl overflow-x-auto no-scrollbar max-w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setProductSortMode('bestseller');
                      setSelectedSkincareStep('all');
                    }}
                    className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      productSortMode === 'bestseller'
                        ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <Flame size={14} className={productSortMode === 'bestseller' ? 'text-white' : 'text-amber-500'} />
                    <span><span className="hidden sm:inline">สินค้า</span>ขายดี</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProductSortMode('routine')}
                    className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      productSortMode === 'routine' || productSortMode === 'category'
                        ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                    title="เรียงอัจฉริยะตามขั้นตอนดูแลผิว (ล้างหน้า -> โทนเนอร์ -> พอก/มาร์ค -> ตา/ปาก -> เซรั่ม -> แต้มสิว/ฝ้า -> ครีมบำรุง -> กันแดด)"
                  >
                    <Sparkles size={14} className={productSortMode === 'routine' || productSortMode === 'category' ? 'text-white' : 'text-purple-600'} />
                    <span>ขั้นตอนดูแลผิว</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProductSortMode('stock');
                      setSelectedSkincareStep('all');
                    }}
                    className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      productSortMode === 'stock'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <Package size={14} className={productSortMode === 'stock' ? 'text-white' : 'text-emerald-600'} />
                    <span><span className="hidden sm:inline">มีสต็อก</span>พร้อมขาย</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProductSortMode('alpha');
                      setSelectedSkincareStep('all');
                    }}
                    className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      productSortMode === 'alpha'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <span>🔤 <span className="hidden sm:inline">ชื่อ </span>ก-ฮ</span>
                  </button>
                </div>

                <div className="text-[11px] sm:text-xs text-slate-500 font-medium">
                  พบ {filteredProducts.length} รายการ
                </div>
              </div>

              {/* Skincare Step Quick Filter Pills */}
              {(productSortMode === 'routine' || productSortMode === 'category') && (
                <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-1 no-scrollbar animate-in fade-in slide-in-from-top-1 duration-150">
                  {skincareStepTabs.map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedSkincareStep(tab.id)}
                      className={`px-2.5 sm:px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        selectedSkincareStep === tab.id
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs ring-1 ring-purple-600/30'
                          : 'bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200'
                      }`}
                      title={tab.fullLabel || tab.label}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        selectedSkincareStep === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="grid grid-cols-4 md:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
            {activeTab === 'products' ? (
              (() => {
                const renderCard = (p) => {
                  const productName = String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2"]) || '');
                  const productCode = String(getFuzzyKey(p, ["รหัส", "col_1"]) || '');
                  const productCat = getProductCategory(p);
                  const salesScore = getProductSalesScore(p);
                  
                  const fullPrice = parseNumber(getFuzzyKey(p, ["ราคาขายเต็ม", "ราคา", "col_6"]));
                  const displayPrice = computeFinalPrice(p, isVipCustomer);
                  
                  const imageUrl = getPosProductImageUrl(p, wooImagesMap);

                  const isOwnerPurchase = isStockMode && globalRole === 'owner';
                  const isBranchReq = isRequisitionMode && globalRole !== 'owner';
                  const isSpecialMode = isOwnerPurchase || isBranchReq;
                  
                  const costPrice = isSpecialMode ? computeOwnerCostPrice(p) : 0;
                  const discountRate = isSpecialMode ? getOwnerDiscountRate(p) : 0;
                  const memberPrice = parseNumber(getFuzzyKey(p, ["ราคาสมาชิก", "col_10"]));
                  const originalCostBasePrice = memberPrice > 0 ? memberPrice : fullPrice;
                  const cartItem = cart.find(i => i.id === p.id && i.type === 'product');
                  const cartQty = cartItem ? (Number(cartItem.qty) || 0) : 0;

                  return (
                    <div 
                      key={p.id} 
                      onClick={() => isOwnerPurchase ? addToCart(p, 'product', 'owner_purchase') : isBranchReq ? addToCart(p, 'product', 'branch_requisition') : isStockMode ? setStockInputModal({ isOpen: true, item: p, inputVal: '' }) : addToCart(p, 'product')}
                      className={`bg-white p-2 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border cursor-pointer transition-all flex flex-col h-full ${isSpecialMode ? "border-slate-100 hover:shadow-md hover:border-teal-200 active:scale-95" : isStockMode ? (stockAdjustments.some(a => a.id === p.id) ? "border-emerald-500 opacity-70" : "border-rose-400 animate-pulse shadow-[0_0_15px_rgba(251,113,133,0.3)]") : (cartQty > 0 ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10 shadow-sm" : "border-slate-100 hover:shadow-md hover:border-indigo-200 active:scale-95")}`}
                    >
                      <div className="w-full aspect-[4/3] bg-slate-100 rounded-lg sm:rounded-xl mb-2 sm:mb-3 overflow-hidden relative group flex items-center justify-center">
                        {salesScore > 0 && !isSpecialMode && (
                          <div className="absolute top-1.5 left-1.5 z-10 bg-gradient-to-r from-amber-500 to-rose-500 text-white p-1 rounded-md shadow-md flex items-center justify-center" title={`สินค้าขายดี (${salesScore} ชิ้น)`}>
                            <Flame size={12} className="fill-white text-white" />
                          </div>
                        )}
                        {cartQty > 0 && !isSpecialMode && !isStockMode && (
                          <div className="absolute top-1.5 right-1.5 z-10 bg-indigo-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-md flex items-center gap-1 border border-white animate-in zoom-in-75 duration-150" title={`ในตะกร้า ${cartQty} ชิ้น`}>
                            <ShoppingCart size={11} className="shrink-0" />
                            <span>{cartQty}</span>
                          </div>
                        )}
                        {imageUrl ? (
                          <img 
                            src={imageUrl} 
                            alt={productName}
                            className="absolute inset-0 w-full h-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-110"
                            loading="lazy"
                            onError={(e) => { 
                              const fallback = getProductFallbackUrl(p);
                              if (fallback && e.target.src !== fallback) {
                                e.target.src = fallback;
                                return;
                              }
                              e.target.onerror = null; 
                              e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>';
                              e.target.className = "w-1/2 h-1/2 object-contain m-auto mt-4 opacity-50 transition-transform duration-300 group-hover:scale-110";
                            }}
                          />
                        ) : (
                          <Package size={40} className="text-slate-300" strokeWidth={1.5} />
                        )}
                        {!isSpecialMode && isStockMode && stockAdjustments.some(a => a.id === p.id) && (
                          <div className="absolute inset-0 bg-emerald-500/20 z-10 flex items-center justify-center backdrop-blur-[1px]">
                            <CheckCircle size={40} className="text-emerald-600 bg-white rounded-full drop-shadow-md" />
                          </div>
                        )}
                      </div>
                      
                      {/* Skincare Step & Code badges */}
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        {productCode && <span className="text-[9px] font-mono text-slate-400 font-bold">{productCode}</span>}
                        {(() => {
                          const stepInfo = getProductSkincareStep(p);
                          return (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-purple-50 text-purple-700 border border-purple-200/60 leading-tight flex items-center gap-1">
                              <span>{stepInfo.icon}</span>
                              <span>{stepInfo.shortLabel}</span>
                            </span>
                          );
                        })()}
                      </div>

                      <div className="font-semibold text-slate-800 flex-1 line-clamp-2 text-xs sm:text-base leading-snug">{productName}</div>
                      <div className="mt-2 sm:mt-3 flex items-center justify-between w-full gap-2">
                        {isSpecialMode ? (
                          <div className={`${isOwnerPurchase ? 'text-teal-600' : 'text-amber-600'} font-bold text-[10px] sm:text-xs flex flex-col gap-0.5`}>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] text-slate-400 font-normal">ปกติ:</span>
                              <del className="text-slate-400 text-[9px] sm:text-[10px] font-normal">฿{originalCostBasePrice.toLocaleString()}</del>
                            </div>
                            <div className="flex items-center gap-1 flex-wrap">
                              <span>฿{costPrice.toLocaleString()}</span>
                              <span className={`${isOwnerPurchase ? 'bg-teal-50 text-teal-700 border-teal-100' : 'bg-amber-50 text-amber-700 border-amber-100'} text-[8px] font-bold px-1 py-0.5 rounded border leading-none`}>ลด {Math.round(discountRate * 100)}%</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-indigo-600 font-bold text-sm sm:text-lg flex items-center gap-1 shrink-0">
                            {displayPrice < fullPrice && (
                              <del className="text-gray-400 text-[10px] sm:text-xs">฿{fullPrice.toLocaleString()}</del>
                            )}
                            ฿{displayPrice.toLocaleString()}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1 shrink-0">
                          {(() => {
                               const currentBranch = globalBranch || "สำนักงานใหญ่";
                               const v = getBranchStock(p, currentBranch);
                               const vNum = Number(v);
                               return (
                                 <div className={`flex items-center justify-center min-w-[32px] sm:min-w-[36px] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-black shadow-sm ${vNum <= 0 ? 'bg-rose-500 text-white shadow-rose-200' : 'bg-emerald-500 text-white shadow-emerald-200'}`} title={`สต๊อกคงเหลือสาขา ${currentBranch}`}>
                                    {parseQty(v)}
                                 </div>
                               );
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                };

                if (filteredProducts.length === 0) {
                  return (
                    <div className="col-span-full text-center py-12 text-slate-400">
                      <Package size={48} className="mx-auto mb-2 opacity-30" />
                      <p className="font-bold text-sm">ไม่พบสินค้าในหมวดหมู่นี้</p>
                    </div>
                  );
                }

                if ((productSortMode === 'routine' || productSortMode === 'category') && selectedSkincareStep === 'all') {
                  return groupedProductsByStep.map(g => (
                    <React.Fragment key={g.step.id}>
                      <div className="col-span-full pt-4 pb-1.5 first:pt-0">
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/90 rounded-xl text-purple-900 font-black text-xs sm:text-sm shadow-2xs">
                            <span className="text-sm sm:text-base">{g.step.icon}</span>
                            <span>{g.step.label}</span>
                            <span className="text-[10px] sm:text-xs px-2 py-0.5 bg-purple-600 text-white rounded-full font-bold shadow-xs">
                              {g.items.length}
                            </span>
                          </div>
                          <div className="flex-1 h-[1.5px] bg-gradient-to-r from-purple-200 via-indigo-100 to-transparent"></div>
                        </div>
                      </div>
                      {g.items.map(p => renderCard(p))}
                    </React.Fragment>
                  ));
                }

                return filteredProducts.map(p => renderCard(p));
              })()
            ) : activeTab === 'courses' ? (
              <div className="col-span-full mb-4">
                <div className="flex gap-2 p-1 bg-slate-100/80 backdrop-blur rounded-xl border border-slate-200/60 mb-4 flex-wrap w-full">
                   {COURSE_TABS.map(tab => {
                     const count = courseCounts[tab.id] || 0;
                     return (
                       <button 
                          key={`m_${tab.id}`}
                          onClick={() => setMultiCourseTab(tab.id)}
                          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[11px] sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${multiCourseTab === tab.id ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200/50'}`}
                       >
                         <span>{tab.label}</span>
                         <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${multiCourseTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                           {count}
                         </span>
                       </button>
                     );
                   })}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {filteredCourses
                    .filter(c => {
                      const category = getCourseCategory(c);
                      if (category === 'old_courses') return false;
                      if (multiCourseTab === 'all') return true;
                      if (multiCourseTab === 'promo') {
                        return category === 'promo' || (Array.isArray(c.promoOptions) && c.promoOptions.length > 0) || String(getFuzzyKey(c, ["รหัสคอส", "col_1"])).startsWith('PROMO-');
                      }
                      if (multiCourseTab === 'acne_clear') {
                        return category === 'acne_clear' || c.id === 'acmm' || String(getFuzzyKey(c, ["รหัสคอส", "col_1"])).toLowerCase() === 'acmm' || String(getFuzzyKey(c, ["ชื่อคอส", "col_4"])).includes('เคลียร์สิว');
                      }
                      if (multiCourseTab === 'acne_sets') {
                        return category === 'acne_sets' || c.id === 'PROMO-ACNE-MELASMA' || c.id === 'PROMO-ACTIVESKIN' || String(getFuzzyKey(c, ["รหัสคอส", "col_1"])).includes('ACTIVE') || String(getFuzzyKey(c, ["รหัสคอส", "col_1"])).includes('ACNE') || String(getFuzzyKey(c, ["ชื่อคอส", "col_4"])).includes('สิว/ฝ้า');
                      }
                      if (multiCourseTab === 'ipl') {
                        return category === 'ipl' || c.id === 'PROMO-IPL-HAIR' || c.id === 'PROMO-IPL-ARMPIT' || String(getFuzzyKey(c, ["รหัสคอส", "col_1"])).includes('IPL') || String(getFuzzyKey(c, ["ชื่อคอส", "col_4"])).includes('IPL');
                      }
                      if (multiCourseTab === 'machine') {
                        return category === 'machine' || c.id === 'PROMO-FACIAL-MACHINES' || String(getFuzzyKey(c, ["รหัสคอส", "col_1"])).includes('MACH') || String(getFuzzyKey(c, ["ชื่อคอส", "col_4"])).includes('เครื่อง');
                      }
                      return category === multiCourseTab;
                    })
                    .sort((a, b) => String(getFuzzyKey(a, ["รหัสคอส", "col_1"])).localeCompare(String(getFuzzyKey(b, ["รหัสคอส", "col_1"]))))
                    .map(c => {
                      const code = String(getFuzzyKey(c, ["รหัสคอส", "col_1"]));
                      let letter = code.replace('F-', '').replace(/\d+/g, '');
                      if (letter.length > 3) letter = letter.substring(0, 3);
                      
                      const credit = Number(getFuzzyKey(c, ["เครดิตที่ได้รับ", "เครดิต", "col_8", "credit"]) || 0);
                      const subItems = String(getFuzzyKey(c, ["รายการที่ได้รับ", "col_11"]) || '').trim();
                      const courseName = String(getFuzzyKey(c, ["ชื่อคอส", "col_4"]));
                      
                      const promoOptions = Array.isArray(c.promoOptions) ? c.promoOptions.filter(o => o && (o.name || o.price)) : [];
                      const hasPromoOptions = promoOptions.length > 0;

                      let creditDisplayStr = '';
                      if (hasPromoOptions) {
                        const validCredits = promoOptions
                          .map(o => Number(o.credit || o.เครดิตที่ได้รับ || o.วงเงินเครดิต || getFuzzyKey(o, ["เครดิต", "credit", "วงเงิน"]) || 0))
                          .filter(cr => cr > 0);
                        if (validCredits.length > 0) {
                          const minC = Math.min(...validCredits);
                          const maxC = Math.max(...validCredits);
                          if (minC !== maxC) {
                            creditDisplayStr = `+เครดิต ฿${minC.toLocaleString()} - ฿${maxC.toLocaleString()}`;
                          } else {
                            creditDisplayStr = `+เครดิต ฿${minC.toLocaleString()}`;
                          }
                        }
                      }
                      if (!creditDisplayStr && credit > 0) {
                        creditDisplayStr = `+เครดิต ฿${credit.toLocaleString()}`;
                      }

                      let giftDisplayStr = '';
                      if (hasPromoOptions) {
                        const giftOpt = promoOptions.find(o => o.freeGift);
                        if (giftOpt) {
                          giftDisplayStr = '+ฟรี แป้งรักแร้ขาว ฿140';
                        }
                      }
                      if (!giftDisplayStr && c.freeGiftDisplay) {
                        giftDisplayStr = c.freeGiftDisplay;
                      }

                      let sessionCount = null;
                      const match = courseName.match(/\(?(\d+)\s*ครั้ง\)?/);
                      if (match) {
                        sessionCount = parseInt(match[1]);
                      } else if (courseName.includes('รายครั้ง')) {
                        sessionCount = 1;
                      } else if (hasPromoOptions && promoOptions[0]?.sessions) {
                        sessionCount = parseInt(promoOptions[0].sessions);
                      }
                      
                      const isSingle = sessionCount === 1;
                      
                      let duration = getFuzzyKey(c, ["กำหนดเวลา", "อายุคอส", "กำหนดเวลา (เดือน)"]);
                      if (!duration || String(duration).trim() === '-' || String(duration).trim() === '') {
                          const lowerName = courseName.toLowerCase();
                          if (lowerName.includes('set a') || lowerName.includes('set.a')) duration = 'อายุ 3 เดือน';
                          else if (lowerName.includes('set b') || lowerName.includes('set.b')) duration = 'อายุ 6 เดือน';
                          else if (lowerName.includes('set c') || lowerName.includes('set.c')) duration = 'อายุ 1 ปี';
                          else duration = getCourseCategory(c) === 'old_courses' ? 'คอร์สเก่า' : (getCourseCategory(c) === 'acne_sets' ? 'อายุ 1 ปี' : 'อายุ 3 เดือน');
                      }

                      // Price range or starting price calculation for promo courses
                      let displayPriceStr = `฿${parseNumber(getFuzzyKey(c, ["ราคา", "ราคาขาย", "col_5"])).toLocaleString()}`;
                      if (hasPromoOptions) {
                        const validPrices = promoOptions.map(o => Number(o.price) || 0).filter(p => p > 0);
                        if (validPrices.length > 0) {
                          const minP = Math.min(...validPrices);
                          const maxP = Math.max(...validPrices);
                          if (minP !== maxP) {
                            displayPriceStr = `฿${minP.toLocaleString()} - ฿${maxP.toLocaleString()}`;
                          } else {
                            displayPriceStr = `฿${minP.toLocaleString()}`;
                          }
                        }
                      }
                      
                      const cardStyle = isSingle 
                        ? "bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200 hover:border-indigo-300"
                        : (hasPromoOptions 
                            ? "bg-gradient-to-br from-pink-50 via-rose-50 to-amber-50/40 border-pink-300 hover:border-pink-400 shadow-sm ring-1 ring-pink-400/20"
                            : "bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200 hover:border-pink-300");
                        
                      const priceStyle = isSingle ? "text-indigo-600" : "text-rose-600";
                      const watermarkStyle = isSingle ? "text-indigo-500/10" : "text-pink-500/10";
                      const infoStyle = isSingle ? "hover:bg-indigo-100 text-indigo-500" : "hover:bg-pink-100 text-pink-500";
                      const badgeStyle = isSingle ? "bg-indigo-100 text-indigo-700 border-indigo-200" : "bg-pink-100 text-pink-700 border-pink-200";

                      const courseImage = getPosCourseImageUrl(c, wooImagesMap);

                      return (
                      <div 
                        key={c.id} 
                        onClick={() => hasPromoOptions ? setSelectedCourseForPromoModal(c) : addToCart(c, 'course')}
                        className={`p-2.5 sm:p-3 rounded-2xl shadow-xs hover:shadow-md cursor-pointer transition-all active:scale-[0.98] flex flex-col h-full border relative overflow-hidden bg-white hover:border-pink-300 ${cardStyle}`}
                      >
                        {/* Course Image - 100% visible (object-contain) */}
                        <div className="w-full aspect-[4/3] bg-slate-50/90 rounded-xl mb-2 overflow-hidden relative group/img flex items-center justify-center border border-slate-100/80">
                          {courseImage ? (
                            <img 
                              src={courseImage} 
                              alt={courseName}
                              className="w-full h-full object-contain p-1 transition-transform duration-300 group-hover/img:scale-105"
                              loading="lazy"
                              onError={(e) => { 
                                e.target.style.display = 'none';
                                const fallback = e.target.parentElement?.querySelector('.course-img-fallback');
                                if (fallback) fallback.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`course-img-fallback w-full h-full flex flex-col items-center justify-center text-slate-300 bg-gradient-to-br from-pink-50/50 to-rose-50/50 ${courseImage ? 'hidden' : 'flex'}`}>
                            <Sparkles size={24} className="text-pink-300/70 stroke-[1.5] mb-1" />
                            <span className="text-[9px] font-mono text-slate-400 font-bold opacity-75">{code}</span>
                          </div>
                          
                          {/* Info Button */}
                          <button 
                            onClick={(e) => { e.stopPropagation(); setViewCourseDetails(c); }}
                            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-white/85 hover:bg-white text-slate-400 hover:text-pink-600 shadow-xs backdrop-blur-xs transition-colors z-10"
                            title="ดูรายละเอียดคอร์ส"
                          >
                            <Info size={13} />
                          </button>

                          {/* Sessions / Package Tag floating on image bottom-right */}
                          {hasPromoOptions ? (
                            <span className="absolute bottom-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-white/90 text-rose-700 shadow-2xs border border-rose-200/60 backdrop-blur-xs whitespace-nowrap">
                              {promoOptions.length} แพ็กเกจ
                            </span>
                          ) : sessionCount ? (
                            <span className="absolute bottom-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-white/90 text-slate-700 shadow-2xs border border-slate-200/60 backdrop-blur-xs whitespace-nowrap">
                              {isSingle ? 'รายครั้ง' : `${sessionCount} ครั้ง`}
                            </span>
                          ) : null}
                        </div>

                        {/* Title & Code */}
                        <div className="flex-1 flex flex-col min-w-0">
                          <span className="text-[9px] text-slate-400 font-mono mb-0.5 truncate">{code}</span>
                          <span className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2 leading-snug" title={courseName}>
                            {courseName}
                          </span>
                        </div>
                        
                        {/* Promo Options pill (compact) */}
                        {hasPromoOptions && (
                          <div className="mt-1.5 flex items-center justify-between text-[10px] text-pink-700 bg-pink-50/90 font-bold px-2 py-0.5 rounded-lg border border-pink-200">
                            <span className="flex items-center gap-1 truncate"><Sparkles size={10} className="text-pink-600 fill-pink-400 shrink-0" /> มี {promoOptions.length} โปรย่อย</span>
                            <span className="text-[9px] bg-pink-600 text-white px-1.5 py-0.2 rounded font-extrabold whitespace-nowrap">เลือกโปร</span>
                          </div>
                        )}

                        {/* Price & Credit & Duration Footer (Clean & Not wrapping awkwardly) */}
                        <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-end justify-between gap-1">
                          <div className="min-w-0 flex flex-col">
                            <span className={`text-sm sm:text-base font-black ${priceStyle} whitespace-nowrap leading-none`}>
                              {displayPriceStr}
                            </span>
                            {creditDisplayStr && (
                              <span className="text-[9px] text-emerald-600 font-bold whitespace-nowrap mt-0.5">
                                {creditDisplayStr}
                              </span>
                            )}
                            {giftDisplayStr && (
                              <span className="text-[9px] text-amber-700 font-extrabold whitespace-nowrap mt-0.5 flex items-center gap-0.5">
                                🎁 {giftDisplayStr}
                              </span>
                            )}
                          </div>
                          {!isSingle && duration && String(duration).trim() !== '-' && (
                            <span className="text-[9px] text-slate-500 font-medium bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/80 whitespace-nowrap shrink-0">
                              ⏳ {duration}
                            </span>
                          )}
                        </div>
                      </div>
                      )
                  })}
                </div>

                {groupedSingleCourses.filter(g => {
                      if (multiCourseTab === 'all') return g.category !== 'old_courses';
                      return g.category === multiCourseTab;
                    }).length > 0 && (
                   <div className="mt-6 mb-3 flex items-center gap-3 col-span-full">
                     <div className="h-[2px] bg-gradient-to-r from-transparent to-slate-200 flex-1"></div>
                     <span className="text-[11px] sm:text-xs font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest shadow-inner flex items-center gap-1">
                       <CheckCircle size={12}/> {multiCourseTab === 'facial' ? 'ทรีทเม้นท์ผิวหน้า (Facial Treatments A-J)' : 'คอร์สทรีทเม้นท์ / รายครั้ง'}
                     </span>
                     <div className="h-[2px] bg-gradient-to-l from-transparent to-slate-200 flex-1"></div>
                   </div>
                )}
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 col-span-full mt-2">
                  {groupedSingleCourses
                    .filter(g => {
                      if (multiCourseTab === 'all') return g.category !== 'old_courses';
                      return g.category === multiCourseTab;
                    })
                    .sort((a, b) => a.primaryCode.localeCompare(b.primaryCode))
                    .map(g => {
                      const code = g.primaryCode;
                      let letter = code.replace('F-', '').replace(/\d+/g, '');
                      if (letter.length > 3) letter = letter.substring(0, 3);
                      
                      const primaryItem = g.items[0];
                      const singleCourseImg = getPosCourseImageUrl(primaryItem, wooImagesMap);
                      const subItems = String(getFuzzyKey(primaryItem, ["รายการที่ได้รับ", "col_11"]) || '').trim();
                      const hasPromo = g.items.some(c => String(getFuzzyKey(c, ["ชื่อคอส", "col_4", "ชื่อสินค้า", "col_2"]) || '').includes('ซื้อเพิ่มโปร'));
                      
                      const prices = g.items.map(c => parseNumber(getFuzzyKey(c, ["ราคา", "ราคาขาย", "col_5"]))).filter(p => !isNaN(p) && p >= 0);
                      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
                      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
                      const hasMultipleOptions = g.items.length > 1;

                      return (
                      <div 
                        key={code} 
                        onClick={() => hasMultipleOptions ? setSelectedGroupedCourse(g) : addToCart(primaryItem, 'course')}
                        className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col h-full relative overflow-hidden bg-white border border-slate-200 hover:border-violet-300 cursor-pointer active:scale-[0.98]"
                      >
                        {/* Course Image */}
                        <div className="w-full aspect-[4/3] bg-slate-50/90 rounded-xl mb-2 overflow-hidden relative group/img flex items-center justify-center border border-slate-100/80">
                          {singleCourseImg ? (
                            <img 
                              src={singleCourseImg} 
                              alt={g.baseName}
                              className="w-full h-full object-contain p-1 transition-transform duration-300 group-hover/img:scale-105"
                              loading="lazy"
                              onError={(e) => { 
                                e.target.style.display = 'none';
                                const fallback = e.target.parentElement?.querySelector('.single-course-fallback');
                                if (fallback) fallback.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`single-course-fallback w-full h-full flex flex-col items-center justify-center text-slate-300 bg-gradient-to-br from-violet-50/50 to-fuchsia-50/50 ${singleCourseImg ? 'hidden' : 'flex'}`}>
                            <Sparkles size={24} className="text-violet-300/70 stroke-[1.5] mb-1" />
                            <span className="text-[9px] font-mono text-slate-400 font-bold opacity-75">{code}</span>
                          </div>
                          
                          {/* Info Button */}
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setViewCourseDetails(primaryItem); }}
                            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-white/85 hover:bg-white text-slate-400 hover:text-violet-600 shadow-xs backdrop-blur-xs transition-colors z-10"
                            title="ดูรายละเอียดคอร์ส"
                          >
                            <Info size={13} />
                          </button>

                          {/* Sessions count / Options floating bottom-right */}
                          {hasMultipleOptions ? (
                            <span className="absolute bottom-1.5 right-1.5 text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/95 text-violet-700 shadow-2xs border border-violet-200/80 backdrop-blur-xs whitespace-nowrap flex items-center gap-0.5">
                              <Sparkles size={10} className="text-violet-600 fill-violet-400" /> {g.items.length} โปร/ระดับ
                            </span>
                          ) : (
                            <span className="absolute bottom-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-white/90 text-slate-700 shadow-2xs border border-slate-200/60 backdrop-blur-xs whitespace-nowrap">
                              1 ครั้ง
                            </span>
                          )}
                        </div>

                        {/* Title & Code */}
                        <div className="flex-1 flex flex-col min-w-0 mb-1.5">
                          <span className="text-[9px] text-slate-400 font-mono mb-0.5 truncate">{code}</span>
                          <span className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2 leading-snug" title={g.baseName}>
                            {g.baseName}
                          </span>
                        </div>

                        {/* Price & Action Button Footer (Clean like customer side) */}
                        <div className="mt-auto pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                          <div className="flex items-baseline justify-between gap-1">
                            <div className="flex items-baseline gap-1">
                              {hasMultipleOptions && minPrice < maxPrice && (
                                <span className="text-[10px] text-slate-400 font-bold">เริ่มต้น</span>
                              )}
                              <span className="text-sm sm:text-base font-black text-violet-600 leading-none">
                                ฿{minPrice.toLocaleString()}
                              </span>
                              {hasMultipleOptions && maxPrice > minPrice && (
                                <span className="text-[10px] text-slate-400 font-semibold">
                                  - ฿{maxPrice.toLocaleString()}
                                </span>
                              )}
                            </div>
                            {hasPromo && (
                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                มีโปร
                              </span>
                            )}
                          </div>

                          {hasMultipleOptions ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedGroupedCourse(g);
                              }}
                              className="w-full py-1.5 px-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1 transition-all active:scale-95"
                            >
                              <Sparkles size={12} />
                              <span>เลือกโปร ({g.items.length})</span>
                              <ChevronRight size={13} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(primaryItem, 'course');
                              }}
                              className="w-full py-1.5 px-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1 transition-all active:scale-95"
                            >
                              <Plus size={13} />
                              <span>เพิ่มลงตะกร้า</span>
                            </button>
                          )}
                        </div>
                      </div>
                      )
                  })}

                  {/* Manual Single-Session / Walk-in Items */}
                  {multiCourseTab === 'single_session' && (
                    <div 
                      onClick={() => setIsMoleRemovalModalOpen(true)}
                      className="col-span-full relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 p-3.5 sm:p-4 shadow-lg shadow-purple-500/20 border border-white/20 cursor-pointer group hover:scale-[1.008] transition-all mb-3 text-left"
                    >
                      <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
                      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-400/20 via-transparent to-transparent pointer-events-none"></div>

                      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform text-white">
                            <Sparkles size={24} className="text-amber-300 drop-shadow-sm" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400/25 text-amber-200 tracking-wide border border-amber-300/30">
                                ✨ ระบบจัดการจี้ไฝ
                              </span>
                              <span className="text-[10px] font-bold text-teal-200">
                                Mole Removal
                              </span>
                            </div>
                            <h3 className="text-base font-black text-white leading-tight mt-1 truncate drop-shadow-xs">
                              ระบบจี้ไฝ (Mole Removal)
                            </h3>
                            <p className="text-xs text-indigo-100/90 font-medium truncate mt-0.5">
                              ค้นหาลูกค้าเพื่อตรวจสอบประวัติ หรือประเมินราคาหัตถการส่งกลับมายัง POS
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center justify-center gap-1.5 bg-white text-indigo-800 font-black text-xs px-4 py-2.5 rounded-xl shadow-md transition-all group-hover:bg-amber-50 group-hover:translate-x-0.5">
                          <span>เปิดระบบจี้ไฝ</span>
                          <ArrowRight size={14} className="text-indigo-600" />
                        </div>
                      </div>
                    </div>
                  )}
                  {(multiCourseTab === 'all' || multiCourseTab === 'single_session' || multiCourseTab === 'walkin') && (
                    <div 
                      key="srv_mole_walkin"
                      className="p-3.5 sm:p-4 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full bg-gradient-to-br from-amber-50/80 via-orange-50/70 to-white border-2 border-orange-200/90 relative overflow-hidden group col-span-1 sm:col-span-2"
                    >
                      <div className="absolute -right-2 -bottom-4 text-[70px] font-black text-orange-500/10 rotate-12 pointer-events-none select-none z-0">
                        จี้
                      </div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                            <Scissors size={20} />
                          </div>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                            หัตถการรายครั้ง • ไม่คิดค่าคอมคอร์ส
                          </span>
                        </div>
                        
                        <div className="font-black text-slate-800 text-sm sm:text-base">
                          จี้ไฝ / กระ / ติ่งเนื้อ (รายครั้ง)
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 mb-2.5">
                          เลือกราคาเพิ่มลงตะกร้าทันที (คำนวณค่ามือตามบิล 10-20%):
                        </div>
                      </div>

                      {/* 8 Quick Price Preset Buttons */}
                      <div className="relative z-10 space-y-1.5">
                        <div className="grid grid-cols-4 gap-1.5">
                          {[200, 300, 500, 800, 1000, 1500, 2000, 5000].map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const cartItem = {
                                  id: `srv_mole_${Date.now()}_${p}`,
                                  name: `จี้ไฝ / กระ / ติ่งเนื้อ (฿${p.toLocaleString()})`,
                                  price: p,
                                  originalPrice: p,
                                  qty: 1,
                                  type: 'service',
                                  isService: true,
                                  noCourseCommission: true,
                                  isManualPrice: true
                                };
                                setCart(prev => [...prev, cartItem]);
                                showToast(`เพิ่ม "จี้ไฝ" ฿${p.toLocaleString()} ลงตะกร้าแล้ว`, 'success');
                              }}
                              className="py-1.5 px-1 bg-white hover:bg-orange-500 hover:text-white text-orange-700 border border-orange-200 hover:border-orange-500 rounded-lg font-black text-xs transition-all shadow-2xs active:scale-95 text-center cursor-pointer"
                            >
                              ฿{p.toLocaleString()}
                            </button>
                          ))}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setQuickPriceModalItem({ id: 'srv_mole', name: 'จี้ไฝ / กระ / ติ่งเนื้อ', price: 0, type: 'service' })}
                            className="w-full py-1.5 text-center text-[11px] font-bold text-orange-600 hover:text-orange-700 bg-orange-100/70 hover:bg-orange-100 rounded-lg transition-colors border border-orange-200/80 cursor-pointer"
                          >
                            + ระบุราคาอื่น...
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsMoleRemovalModalOpen(true);
                            }}
                            className="w-full py-1.5 px-2 flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white font-bold text-[11px] shadow-xs active:scale-95 transition-all cursor-pointer"
                          >
                            <Sparkles size={12} className="text-amber-300 shrink-0" />
                            <span>ประเมินในระบบจี้ไฝ &rarr;</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (activeTab === 'services' || activeTab === 'mole') ? (
              <div className="col-span-full">
                {/* 🌟 Banner ลิงก์ไปยังระบบจี้ไฝ (Mole Removal) เพื่อประเมินราคาส่งกลับมายัง POS 🌟 */}
                <div 
                  onClick={() => setIsMoleRemovalModalOpen(true)}
                  className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 p-3.5 sm:p-4 shadow-lg shadow-purple-500/20 border border-white/20 cursor-pointer group hover:scale-[1.008] transition-all mb-4 text-left"
                >
                  {/* Ambient background decoration */}
                  <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
                  <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-400/20 via-transparent to-transparent pointer-events-none"></div>

                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform text-white">
                        <Sparkles size={24} className="text-amber-300 drop-shadow-sm" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400/25 text-amber-200 tracking-wide border border-amber-300/30">
                            ✨ ระบบจัดการจี้ไฝ
                          </span>
                          <span className="text-[10px] font-bold text-teal-200">
                            Mole Removal
                          </span>
                        </div>
                        <h3 className="text-base font-black text-white leading-tight mt-1 truncate drop-shadow-xs">
                          ระบบจี้ไฝ (Mole Removal)
                        </h3>
                        <p className="text-xs text-indigo-100/90 font-medium truncate mt-0.5">
                          ค้นหาลูกค้าเพื่อตรวจสอบประวัติ หรือประเมินราคาหัตถการส่งกลับมายัง POS
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center justify-center gap-1.5 bg-white text-indigo-800 font-black text-xs px-4 py-2.5 rounded-xl shadow-md transition-all group-hover:bg-amber-50 group-hover:translate-x-0.5">
                      <span>เปิดระบบจี้ไฝ</span>
                      <ArrowRight size={14} className="text-indigo-600" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div 
                    className="p-4 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full bg-gradient-to-br from-amber-50/80 via-orange-50/70 to-white border-2 border-orange-200/90 relative overflow-hidden group"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                        <Target size={24} />
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                        หัตถการรายครั้ง • ไม่คิดค่าคอมคอร์ส
                      </span>
                    </div>
                    
                    <div className="font-black text-slate-800 text-base">
                      จี้ไฝ / กระ / ติ่งเนื้อ
                    </div>
                    <div className="text-xs text-slate-500 mt-1 mb-3">
                      เลือกราคาเพิ่มลงตะกร้าทันที (คำนวณค่ามือตามบิล 10-20%):
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 mb-2">
                      {[200, 300, 500, 800, 1000, 1500, 2000, 5000].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            const cartItem = {
                              id: `srv_mole_${Date.now()}_${p}`,
                              name: `จี้ไฝ / กระ / ติ่งเนื้อ (฿${p.toLocaleString()})`,
                              price: p,
                              originalPrice: p,
                              qty: 1,
                              type: 'service',
                              isService: true,
                              noCourseCommission: true,
                              isManualPrice: true
                            };
                            setCart(prev => [...prev, cartItem]);
                            showToast(`เพิ่ม "จี้ไฝ" ฿${p.toLocaleString()} ลงตะกร้าแล้ว`, 'success');
                          }}
                          className="py-2 px-1 bg-white hover:bg-orange-500 hover:text-white text-orange-700 border border-orange-200 hover:border-orange-500 rounded-xl font-black text-xs transition-all shadow-2xs active:scale-95 text-center cursor-pointer"
                        >
                          ฿{p.toLocaleString()}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-1.5 mt-2">
                      <button
                        type="button"
                        onClick={() => setQuickPriceModalItem({ id: 'srv_mole', name: 'จี้ไฝ / กระ / ติ่งเนื้อ', price: 0, type: 'service' })}
                        className="w-full py-2 text-center text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-100/70 hover:bg-orange-100 rounded-xl transition-colors border border-orange-200/80 cursor-pointer"
                      >
                        + ระบุราคาอื่น / กรอกจำนวนเอง...
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMoleRemovalModalOpen(true);
                        }}
                        className="w-full py-2 px-3 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
                      >
                        <Sparkles size={14} className="text-amber-300 shrink-0" />
                        <span>ประเมินราคาในระบบจี้ไฝ (Mole Removal) &rarr;</span>
                      </button>
                    </div>
                  </div>

                  <div 
                    onClick={() => setQuickPriceModalItem({ id: 'srv_consult', name: 'ประเมินราคา / บริการพิเศษ', price: 0, type: 'service' })}
                    className="p-4 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full bg-white border-2 border-slate-200 hover:border-orange-400 cursor-pointer group"
                  >
                    <div>
                      <div className="w-12 h-12 bg-slate-100 text-slate-600 group-hover:bg-orange-100 group-hover:text-orange-600 rounded-2xl flex items-center justify-center mb-3 transition-colors">
                        <Sparkles size={24} />
                      </div>
                      <div className="font-black text-slate-800 text-base">ประเมินราคา / บริการพิเศษ</div>
                      <p className="text-xs text-slate-400 mt-1">คลิกเพื่อกำหนดชื่อและราคาเองตามประเมิน</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-orange-600 font-bold">
                      <span>ระบุราคาเอง</span>
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {filteredPendingPayments.length > 0 && (
                  <div className="col-span-full mb-2 border border-red-100 bg-red-50 p-3 rounded-2xl">
                    <h3 className="font-bold text-red-600 flex items-center gap-2 mb-3">
                      <Banknote size={16} /> รายการมียอดค้างชำระ ({filteredPendingPayments.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                      {filteredPendingPayments.map(c => {
                         const pendingAmt = Number(c.computedPendingAmount ?? parseNumber(getFuzzyKey(c, ["ยอดค้างชำระ", "pending"]))) || 0;
                         if (pendingAmt <= 0) return null;
                         return (
                           <div 
                             key={`pending_${c.id}`} 
                             onClick={() => addToCart(c, 'debt_payment')}
                             className="bg-white p-3 rounded-xl shadow-sm border border-red-200 cursor-pointer transition-all active:scale-95 flex flex-col justify-between"
                           >
                             <div className="text-[10px] font-bold text-red-500 truncate mb-1">ค้าง: {String(getFuzzyKey(c, ["เลขที่ใบคอส", "col_2"]))}</div>
                             <div className="font-semibold text-slate-700 text-xs line-clamp-2">{String(getFuzzyKey(c, ["ชื่อคอส", "col_8"]))}</div>
                             <div className="mt-2 text-red-600 font-black text-sm">฿{pendingAmt.toLocaleString()}</div>
                           </div>
                         );
                      })}
                    </div>
                  </div>
                )}
                
                {filteredMyCourses.length > 0 && (
                  <div className="col-span-full mb-2">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-teal-700 flex items-center gap-1.5">
                        <Scissors size={16} /> รายการคอร์สที่เบิกใช้งานได้ ({filteredMyCourses.length})
                      </h3>
                      {cart.some(i => i.type === 'usage') && (
                        <span className="text-[11px] font-black text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                          เลือกตัดยอดแล้ว {cart.filter(i => i.type === 'usage').length} คอร์ส
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-3">
                      {filteredMyCourses.map(c => {
                        const isDeductSelected = cart.some(i => i.id === c.id && i.type === 'usage');
                        const cartUsageItem = cart.find(i => i.id === c.id && i.type === 'usage');
                        const firestoreActive = (activeServices || []).find(s => (s.courseId === c.id || s.courseDocId === c.id) && s.status !== 'เรียบร้อย');
                        const activeSession = firestoreActive || activeServiceCourses[c.id];
                        const isWaitingService = activeSession && activeSession.status === 'รอรับบริการ';
                        const isInService = activeSession && activeSession.status === 'กำลังให้บริการ';
                        const isCompletedService = activeSession && activeSession.status === 'เรียบร้อย';

                        return (
                        <div 
                          key={c.id} 
                          onClick={() => {
                            if (onViewCourseDetails) {
                              onViewCourseDetails(c);
                            } else {
                              setSelectedCourseForUsage(c);
                            }
                          }}
                          className={`bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md border cursor-pointer transition-all active:scale-[0.99] flex flex-row items-center relative overflow-hidden group ${
                            isInService 
                              ? 'border-purple-400 ring-2 ring-purple-300 shadow-purple-100 bg-purple-50/20' 
                              : isWaitingService
                                ? 'border-amber-400 ring-2 ring-amber-300 shadow-amber-100 bg-amber-50/20'
                                : isDeductSelected 
                                  ? 'border-purple-500 ring-2 ring-purple-400 shadow-purple-100 bg-purple-50/30 animate-pulse' 
                                  : 'border-teal-100 hover:border-teal-300'
                          }`}
                          title="คลิกเพื่อดูรายละเอียดใบคอร์สและประวัติการใช้งาน"
                        >
                          <div className={`absolute top-0 left-0 w-1.5 h-full ${
                            isInService || isDeductSelected ? 'bg-purple-600 animate-pulse' : c.computedStatus === 'ยังคงเหลือ' ? 'bg-teal-400' : 'bg-gray-300'
                          }`}></div>
                          
                          <div className="flex-1 pl-2 pr-3 min-w-0 flex flex-col justify-center">
                            <div className="mb-1.5 flex flex-col items-start gap-0.5">
                               <div className="flex items-center gap-1.5 flex-wrap">
                                 {getFuzzyKey(c, ["รหัสคอส", "col_1"]) && (
                                     <span className="bg-teal-50 text-teal-600 border border-teal-100 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase inline-block">
                                         {String(getFuzzyKey(c, ["รหัสคอส", "col_1"]))}
                                     </span>
                                 )}
                                 {isDeductSelected && (
                                   <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-purple-600 text-white animate-pulse shadow-2xs flex items-center gap-1">
                                     <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
                                     เลือกตัดยอดคอร์สนี้
                                   </span>
                                 )}
                               </div>
                               <p 
                                   className={`font-bold text-sm sm:text-base line-clamp-2 leading-tight hover:underline cursor-pointer ${isDeductSelected ? 'text-purple-950 font-black' : 'text-teal-700 hover:text-teal-900'}`} 
                                   title="คลิกเพื่อดูรายละเอียดใบคอร์ส"
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     if (onViewCourseDetails) onViewCourseDetails(c);
                                   }}
                               >
                                   {String(getFuzzyKey(c, ["ชื่อคอส", "col_8"]) || '-')}
                               </p>
                            </div>
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(String(getFuzzyKey(c, ["ผู้ซื้อคอส", "col_9"]) || selectedCustomer?.computedName || '-'))}&background=f1f5f9&color=64748b&bold=true`} className="w-5 h-5 rounded-full shrink-0" />
                                <span className="text-xs text-gray-600 font-medium truncate">{String(getFuzzyKey(c, ["ผู้ซื้อคอส", "col_9"]) || selectedCustomer?.computedName || '-')}</span>
                                <span className="text-[10px] text-gray-400 font-mono hidden sm:inline">{String(getFuzzyKey(c, ["เบอร์โทร", "col_1"]) || selectedCustomer?.computedPhone || '-')}</span>
                                {(c.isWalkIn || String(getFuzzyKey(c, ["ผู้ซื้อคอส", "col_9"])).includes('Walk-in') || String(getFuzzyKey(c, ["ผู้ซื้อคอส", "col_9"])).includes('ทั่วไป') || String(getFuzzyKey(c, ["เบอร์โทร", "col_1"])) === '-') && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const curName = String(getFuzzyKey(c, ["ผู้ซื้อคอส", "col_9"]) || '');
                                      const curPhone = String(getFuzzyKey(c, ["เบอร์โทร", "col_1"]) || '');
                                      setCourseCustomerFormData({
                                        name: curName.includes('Walk-in') || curName.includes('ลูกค้าทั่วไป') ? '' : curName,
                                        phone: curPhone === '-' ? '' : curPhone,
                                        saveToDb: true
                                      });
                                      setCourseCustomerModalData(c);
                                    }}
                                    className="text-[9px] font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ml-auto shadow-2xs cursor-pointer"
                                    title="ระบุหรือแก้ไขชื่อ-เบอร์ลูกค้า"
                                  >
                                    <Edit size={9} />
                                    <span>ใส่ชื่อ-เบอร์</span>
                                  </button>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                <span className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                  <Calendar size={10}/> ซื้อ: {String(getFuzzyKey(c, ["วันที่ซื้อ", "col_3"]) || '-')}
                                </span>
                                {c.computedExpireDate && c.computedExpireDate !== '-' && (
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${c.daysLeft !== null && c.daysLeft < 0 ? 'text-rose-600 bg-rose-50 border border-rose-100' : c.isExpiringSoon ? 'text-amber-600 bg-amber-50 border border-amber-100' : 'text-gray-500 bg-gray-50 border border-gray-100'}`}>
                                    <Clock size={10}/> หมดอายุ: {c.computedExpireDate}
                                  </span>
                                )}
                                {c.computedDurationMonths && (
                                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md">
                                    อายุ {c.computedDurationMonths} เดือน
                                  </span>
                                )}
                            </div>
                            <div className="flex flex-col gap-1 mt-1.5">
                                {c.computedPendingAmount > 0 && (
                                  <span className="self-start text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded flex items-center">
                                    ค้างชำระ ฿{c.computedPendingAmount.toLocaleString()}
                                  </span>
                                )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end shrink-0 gap-2.5 border-l border-gray-100 pl-3 h-full justify-between">
                            <div className="flex items-center gap-1.5">
                                {isInService ? (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1 shadow-2xs animate-pulse">
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600"></span>
                                    </span>
                                    <span>กำลังให้บริการ ({getServiceElapsedStr(activeSession.startTime)})</span>
                                  </span>
                                ) : isWaitingService ? (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 shadow-2xs animate-pulse">
                                    <Clock size={10} className="text-amber-600" />
                                    <span>ส่งไปรอรับบริการแล้ว</span>
                                  </span>
                                ) : isCompletedService ? (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-2xs">
                                    <CheckCircle size={10} className="text-emerald-600" />
                                    <span>เรียบร้อย</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600">{c.computedStatus || 'ยังคงเหลือ'}</span>
                                )}

                                <button
                                    type="button"
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      if (onViewCourseDetails) onViewCourseDetails(c); 
                                    }}
                                    className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 p-1.5 rounded-lg transition-colors shadow-2xs border border-indigo-100 shrink-0 cursor-pointer"
                                    title="ดูรายละเอียดใบคอร์สและประวัติการใช้"
                                >
                                    <Eye size={14} />
                                </button>

                                <button 
                                    onClick={(e) => { e.stopPropagation(); setCourseQRModalData(c); }}
                                    className="text-teal-600 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 p-1.5 rounded-lg transition-colors shadow-sm border border-teal-100 shrink-0 cursor-pointer"
                                    title="แสดงคิวอาร์โค้ดคอร์ส"
                                >
                                    <QrCode size={14} />
                                </button>
                            </div>

                            <div className="text-right">
                                <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5">ใช้ไป {c.computedUsedQty || 0}/{c.computedTotalQty || 1}</p>
                                <p className={`text-base sm:text-xl font-black leading-none ${isDeductSelected ? 'text-purple-700 animate-pulse' : 'text-teal-600'}`}>เหลือ {c.computedRemainQty}</p>
                            </div>

                            {/* ปุ่มเลือกตัดยอดคอร์สนี้ทันที (รองรับเลือกตัดพร้อมกันหลายคอร์ส) */}
                            <div className="pt-1">
                              {isDeductSelected ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeFromCart(c.id, 'usage');
                                    showToast(`ยกเลิกเลือกตัดคอร์ส "${c.name || ''}" แล้ว`, 'info');
                                  }}
                                  className="px-2 py-1 rounded-lg text-[10px] font-black bg-purple-600 hover:bg-rose-500 text-white flex items-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer group/btn"
                                  title="แตะเพื่อยกเลิกการตัดคอร์สนี้"
                                >
                                  <Check size={11} strokeWidth={3} className="group-hover/btn:hidden" />
                                  <X size={11} className="hidden group-hover/btn:inline" />
                                  <span className="group-hover/btn:hidden">เลือกตัดยอดแล้ว ({cartUsageItem?.qty || 1})</span>
                                  <span className="hidden group-hover/btn:inline">ยกเลิก</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addCourseToDeduction(c, 1);
                                  }}
                                  disabled={c.computedStatus === 'ใช้ครบแล้ว' || Number(c.computedRemainQty || 0) <= 0}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer ${
                                    c.computedStatus === 'ใช้ครบแล้ว' || Number(c.computedRemainQty || 0) <= 0
                                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                      : 'bg-orange-50 hover:bg-orange-500 hover:text-white text-orange-700 border border-orange-200'
                                  }`}
                                >
                                  <Scissors size={11} />
                                  <span>+ ตัดคอร์สนี้</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
            
            {((activeTab === 'products' && filteredProducts.length === 0) || (activeTab === 'courses' && filteredCourses.length === 0) || (activeTab === 'my_courses' && filteredMyCourses.length === 0)) && (
              <div className="col-span-full py-20 text-center text-slate-400 flex flex-col items-center">
                <Search size={48} className="mb-4 opacity-20" />
                <p className="text-lg">ไม่พบข้อมูล</p>
              </div>
            )}
          </div>
        </div>

        {/* Floating Mobile Bottom Action Buttons (Hidden since Cart is in search bar) */}
        {isStockMode && globalRole !== 'owner' && !isMobileCartOpen && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 z-[70] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] pb-safe">
             <button 
                onClick={() => setIsStockConfirmModalOpen(true)}
                disabled={stockAdjustments.length === 0}
                className={`w-full py-4 rounded-2xl font-black text-lg shadow-xl flex items-center justify-between px-6 transition-transform active:scale-95 ${stockAdjustments.length > 0 ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30' : 'bg-slate-300 text-slate-500 shadow-none'}`}
             >
                <div className="flex items-center gap-2"><CheckCircle size={24} /> ยืนยันปรับสต๊อก</div>
                <div className={`${stockAdjustments.length > 0 ? 'bg-white text-rose-600' : 'bg-slate-200 text-slate-400'} px-3 py-1 rounded-xl text-sm`}>{stockAdjustments.length} รายการ</div>
             </button>
          </div>
        )}

        {/* 🌟 Floating Bottom Action Bar สำหรับการตัดยอดหลายคอร์สพร้อมกัน 🌟 */}
        {cart.some(i => i.type === 'usage') && !showPaymentModal && (
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] bg-slate-900/95 text-white backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-4 sm:gap-6 border border-slate-700 animate-in slide-in-from-bottom-5 w-[92vw] max-w-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black shadow-sm shrink-0">
                <Scissors size={20} />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 whitespace-nowrap">
                  <span>เลือกตัดยอด {cart.filter(i => i.type === 'usage').length} คอร์ส</span>
                  <span className="text-[10px] bg-teal-500 text-white font-black px-1.5 py-0.2 rounded-full">
                    รวม {cart.filter(i => i.type === 'usage').reduce((s, i) => s + (Number(i.qty) || 1), 0)} ครั้ง
                  </span>
                </div>
                <div className="text-[10px] text-slate-300 truncate max-w-[180px] sm:max-w-xs whitespace-nowrap">
                  {cart.filter(i => i.type === 'usage').map(i => i.name.replace(/เบิกใช้:\s*/g, '').split('(')[0]).join(', ')}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setCheckoutStep(1);
                setShowPaymentModal(true);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-orange-500/25 shrink-0 whitespace-nowrap"
            >
              <span>ดำเนินการตัดยอด</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Right: Cart & Checkout */}
      <div className={`w-full lg:w-[450px] xl:w-[500px] flex-col h-full bg-white shadow-xl z-[60] lg:z-10 ${isMobileCartOpen ? 'fixed inset-0 flex pt-16 pb-0' : 'hidden lg:flex'}`}>
        
        {/* Mobile Close Button */}
        <div className="lg:hidden p-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 sticky top-0 z-10">
           <button onClick={() => setIsMobileCartOpen(false)} className="flex items-center gap-1 text-indigo-600 font-bold active:scale-95 transition-transform">
              <ChevronLeft size={24} /> <span>กลับ</span>
           </button>
           <h2 className="font-black text-lg text-slate-800 flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
             <ShoppingCart size={20} className="text-indigo-600" /> ตะกร้าสินค้า {totalCartQty > 0 ? `(${totalCartQty})` : ''}
           </h2>
           <div className="w-16"></div> {/* Spacer for centering */}
        </div>
        
        {/* Customer Selection */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 shrink-0 z-10">
          <div className="relative">
            {selectedCustomer ? (
              <>
              <div className={`p-3 rounded-2xl border-2 transition-all relative overflow-hidden ${
                isVipCustomer 
                  ? 'bg-gradient-to-br from-emerald-50 via-teal-50/50 to-amber-50/70 border-emerald-300 shadow-sm ring-1 ring-emerald-200/50' 
                  : selectedCustomer.isWalkIn 
                    ? 'bg-gradient-to-br from-orange-50 via-amber-50/40 to-white border-orange-200 shadow-2xs' 
                    : 'bg-gradient-to-br from-slate-50 via-indigo-50/30 to-white border-slate-200 shadow-2xs'
              }`}>
                {/* Subtle Glow for VIP */}
                {isVipCustomer && (
                  <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-300/15 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />
                )}

                {/* Line 1: Avatar + Name + Badges + Actions */}
                <div className="flex items-center justify-between gap-2.5 relative z-10">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Avatar (Enlarged & Sharp) */}
                    <div 
                      onClick={() => {
                        const picData = getProfilePicData(selectedCustomer, customers);
                        if (picData && picData.primary) {
                          setPreviewCustomerAvatarModal({
                            url: picData.primary,
                            name: selectedCustomer.computedName || String(getFuzzyKey(selectedCustomer, ["ชื่อ", "col_1"])),
                            phone: selectedCustomer.computedPhone || String(getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3"]))
                          });
                        }
                      }}
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden shrink-0 bg-white flex items-center justify-center shadow-md cursor-pointer transition-transform active:scale-95 group relative ${
                      isVipCustomer 
                        ? 'border-2 border-emerald-400 ring-2 ring-emerald-200/80 shadow-emerald-500/15' 
                        : selectedCustomer.isWalkIn 
                          ? 'border-2 border-orange-300 ring-2 ring-orange-200/80 shadow-orange-500/15' 
                          : 'border-2 border-indigo-200 ring-2 ring-indigo-100 shadow-indigo-500/15'
                    }`}
                      title="แตะเพื่อดูรูปขนาดใหญ่"
                    >
                      {selectedCustomer.isWalkIn ? (
                        <div className={`w-full h-full ${isVipCustomer ? 'bg-gradient-to-r from-amber-500 to-yellow-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'} text-white flex items-center justify-center`}>
                          <WalkingPersonIcon size={26} className="text-white" />
                        </div>
                      ) : (() => {
                        const picData = getProfilePicData(selectedCustomer, customers);
                        if (picData && picData.primary) {
                          return (
                            <>
                              <img 
                                src={picData.primary} 
                                onError={(e) => handleProfileImgError(e, picData.fallback)}
                                alt="Profile"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Maximize size={16} className="text-white drop-shadow" />
                              </div>
                            </>
                          );
                        }
                        return <User size={26} className="text-indigo-600" />;
                      })()}
                    </div>

                    {/* Name, Phone, and Edit button */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-slate-800 text-sm sm:text-base truncate">
                          {selectedCustomer.computedName || String(getFuzzyKey(selectedCustomer, ["ชื่อ", "col_1"]))}
                        </span>

                        {selectedCustomer.isWalkIn ? (
                          <span className="bg-orange-100 text-orange-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-orange-200 shrink-0">
                            Walk-in
                          </span>
                        ) : isVipCustomer ? (
                          <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-2xs shrink-0 flex items-center gap-1 border border-emerald-300/40">
                            <Award size={9} className="text-yellow-300" /> สมาชิก VIP
                          </span>
                        ) : null}

                        {/* Quick Edit Name/Phone icon button */}
                        <button
                          type="button"
                          onClick={() => {
                            setWalkInFormData({
                              name: selectedCustomer.isWalkIn && selectedCustomer.computedName?.includes('ลูกค้าทั่วไป') ? '' : (selectedCustomer.computedName || selectedCustomer["ชื่อ"] || ''),
                              phone: selectedCustomer.computedPhone === '-' ? '' : (selectedCustomer.computedPhone || selectedCustomer["เบอร์โทร"] || ''),
                              isMember: Boolean(isVipCustomer),
                              issue: selectedCustomer.computedIssue || selectedCustomer.issue || '',
                              saveToDb: true
                            });
                            setIsWalkInEditModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                          title="แก้ไขชื่อ-เบอร์ลูกค้า"
                        >
                          <Edit size={11} />
                        </button>
                      </div>

                      <div className="text-[11px] text-slate-500 font-mono -mt-0.5 truncate">
                        {selectedCustomer.computedPhone || String(getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3"]))}
                      </div>
                    </div>
                  </div>

                  {/* Right actions: VIP Form + ดูประวัติ + Clear */}
                  <div className="flex items-center gap-1 shrink-0 relative z-10">
                    {(selectedCustomer.isApproved || vipStats.isVip || isVipCustomer) && (
                      <button 
                        type="button"
                        onClick={() => onOpenVipForm(selectedCustomer)}
                        className="text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg border border-amber-200/80 transition-all cursor-pointer shadow-2xs flex items-center gap-0.5"
                        title="ดู/สร้างใบสมัคร VIP"
                      >
                        <Award size={10} className="text-amber-600" />
                        <span>ใบสมัคร VIP</span>
                      </button>
                    )}

                    {onViewCustomerProfile && !selectedCustomer.isWalkIn && (
                      <button 
                        type="button"
                        onClick={() => {
                          onViewCustomerProfile(selectedCustomer);
                          setIsMobileCartOpen(false);
                        }}
                        className="text-[10px] bg-white hover:bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg transition-colors flex items-center gap-1 font-bold border border-indigo-200 cursor-pointer shadow-2xs"
                        title="ดูประวัติลูกค้า"
                      >
                        <User size={10} />
                        <span>ดูประวัติ</span>
                      </button>
                    )}

                    <button 
                      type="button"
                      onClick={() => setSelectedCustomer(null)} 
                      className="w-6 h-6 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                      title="เปลี่ยนลูกค้า"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* Line 2: Member Toggle Pill + Credit / Pending Badges */}
                <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between gap-1.5 flex-wrap text-xs relative z-10">
                  {/* Member Toggle Pill (Compact & stylish) */}
                  <div className="inline-flex items-center p-0.5 bg-slate-200/70 rounded-lg shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(prev => ({
                          ...prev,
                          hasMemberCard: false,
                          isApproved: false,
                          isMemberDiscount: false
                        }));
                        showToast('เลือกสถานะ: ลูกค้าทั่วไป (ราคาปกติ)', 'info');
                      }}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        !isVipCustomer
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-2xs font-black'
                          : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      <WalkingPersonIcon size={10} className={!isVipCustomer ? "text-white" : "text-orange-500"} />
                      <span>ทั่วไป</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(prev => ({
                          ...prev,
                          hasMemberCard: true,
                          isApproved: true,
                          isMemberDiscount: true
                        }));
                        showToast('เลือกสถานะ: มีสิทธิ์ส่วนลดบัตรสมาชิก (VIP Price) ⭐', 'success');
                      }}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        isVipCustomer
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-2xs font-black'
                          : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      <Award size={10} className={isVipCustomer ? "text-yellow-200" : "text-emerald-600"} />
                      <span>บัตรสมาชิก ⭐</span>
                    </button>
                  </div>

                  {/* Financial / VIP Badges: เครดิต • ค้างชำระ */}
                  <div className="flex items-center gap-1.5 flex-wrap ml-auto">
                    {customerCreditBalance > 0 && (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-indigo-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-black shadow-2xs">
                        เครดิต ฿{customerCreditBalance.toLocaleString()}
                      </span>
                    )}

                    {customerPendingBalance > 0 && (
                      <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-black shadow-2xs animate-pulse">
                        ค้าง ฿{customerPendingBalance.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* 🌟 Line 3: แถบสถานะการสะสมยอดสวยๆ (VIP Progress Bar) */}
                {!selectedCustomer.isWalkIn && (
                  <div className="mt-2 pt-1.5 border-t border-slate-200/60 relative z-10">
                    <div className="flex items-center justify-between text-[10px] mb-1 font-bold">
                      <span className="flex items-center gap-1">
                        {isVipCustomer ? (
                          <span className="text-emerald-800 flex items-center gap-1 font-black">
                            <Award size={11} className="text-emerald-600" />
                            สมาชิก VIP Iris Clinic (ครบสิทธิ์แล้ว)
                          </span>
                        ) : (
                          <span className="text-slate-600 flex items-center gap-1">
                            <Award size={11} className="text-amber-500" />
                            สะสมยอดเพื่อรับสิทธิ์สมาชิก VIP (เป้า ฿5,000)
                          </span>
                        )}
                      </span>

                      {isVipCustomer ? (
                        <span className="text-emerald-800 font-black bg-emerald-100/90 px-2 py-0.2 rounded-full border border-emerald-300/80 text-[10px]">
                          ยอดสะสม ฿{vipStats.amount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[10px]">
                          สะสม <strong className="text-indigo-600 font-black">฿{vipStats.amount.toLocaleString()}</strong> • ขาดอีก <strong className="text-amber-600 font-black">฿{Math.max(0, 5000 - vipStats.amount).toLocaleString()}</strong>
                        </span>
                      )}
                    </div>

                    {/* Visual Progress Track */}
                    <div className="w-full bg-slate-200/90 rounded-full h-2 p-0.5 overflow-hidden shadow-inner flex items-center">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 relative shadow-xs ${
                          isVipCustomer 
                            ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 w-full' 
                            : 'bg-gradient-to-r from-amber-400 via-orange-500 to-emerald-500'
                        }`}
                        style={{ width: isVipCustomer ? '100%' : `${Math.min(100, Math.max(5, (vipStats.amount / 5000) * 100))}%` }}
                      >
                        {isVipCustomer && (
                          <div className="absolute inset-0 bg-white/30 animate-pulse rounded-full" />
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Skin Issue hint (if available, compact inline) */}
                {(selectedCustomer.computedIssue || selectedCustomer.issue) && (
                  <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 flex items-center justify-between gap-1 text-[10px] text-slate-600 relative z-10">
                    <div className="min-w-0 flex items-center gap-1 truncate">
                      <Sparkles size={11} className="text-indigo-600 shrink-0" />
                      <span className="truncate">
                        <strong className="text-indigo-900">ปัญหาผิว:</strong> {selectedCustomer.computedIssue || selectedCustomer.issue}
                      </span>
                    </div>
                    {(() => {
                      const ai = analyzeSkinIssue(selectedCustomer.computedIssue || selectedCustomer.issue);
                      if (!ai || !ai.courses.length) return null;
                      const topCourse = ai.courses[0];
                      return (
                        <button 
                          type="button"
                          onClick={() => {
                            setActiveTab('courses');
                            setCourseSearch(topCourse.searchKey || '');
                          }}
                          className="text-[9px] font-black text-indigo-700 hover:text-indigo-900 bg-white px-1.5 py-0.5 rounded border border-indigo-200 shadow-2xs shrink-0 flex items-center gap-0.5"
                        >
                          <span>AI: {topCourse.shortName}</span>
                          <ChevronRight size={10} />
                        </button>
                      );
                    })()}
                  </div>
                )}
              </div>
              {renderCustomerContext()}
              </>
            ) : (
              <div className="flex gap-2">
                <div className="relative flex-1" ref={cartCustomerSearchRef}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text"
                    placeholder="ค้นหาลูกค้า (ชื่อ, เบอร์โทร)..."
                    className="w-full pl-10 pr-10 py-2.5 h-11 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setIsCustomerDropdownOpen(true);
                    }}
                    onFocus={() => setIsCustomerDropdownOpen(true)}
                    onBlur={() => {
                      setTimeout(() => {
                        const inTop = topCustomerSearchRef.current && topCustomerSearchRef.current.contains(document.activeElement);
                        const inCart = cartCustomerSearchRef.current && cartCustomerSearchRef.current.contains(document.activeElement);
                        if (!inTop && !inCart) {
                          setIsCustomerDropdownOpen(false);
                          setCustomerSearch('');
                        }
                      }, 200);
                    }}
                  />
                  <button 
                    onClick={() => setScannerTarget('customerSearch')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="สแกนคิวอาร์โค้ดลูกค้า"
                  >
                    <ScanLine size={18} />
                  </button>
                  
                  {isCustomerDropdownOpen && customerSearch.trim() !== '' && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto z-50">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map(c => {
                          const amt = c.realAccumulatedAmount !== undefined ? c.realAccumulatedAmount : getCustomerAccumulatedAmount(c);
                          const isVip = c.isApproved !== undefined ? c.isApproved : amt >= 5000;
                          return (
                          <div 
                            key={c.id} 
                            onClick={() => {
                              setSelectedCustomer(c);
                              setCustomerSearch('');
                              setIsCustomerDropdownOpen(false);
                              const cPhone = String(c.computedPhone || getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '').trim();
                              const hasCourses = courses.some(course => String(getFuzzyKey(course, ["เบอร์โทร", "col_1"]) || '').trim() === cPhone && course.computedRemainQty > 0);
                              if (hasCourses) {
                                setActiveTab('my_courses');
                                showToast('พบคอร์สคงเหลือ สามารถคลิกตัดคอร์สได้ทันที!', 'success');
                              }
                            }}
                            className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0 flex items-center gap-3"
                          >
                            <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center border border-slate-200 shadow-2xs">
                              {(() => {
                                const picData = getProfilePicData(c, customers);
                                if (picData && picData.primary) {
                                  return (
                                    <img 
                                      src={picData.primary} 
                                      onError={(e) => handleProfileImgError(e, picData.fallback)}
                                      alt="Profile"
                                      className="w-full h-full object-cover"
                                    />
                                  );
                                }
                                return <User size={22} className="text-slate-400" />;
                              })()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-slate-800 flex items-center gap-2 truncate flex-wrap">
                                  {c.computedName || String(getFuzzyKey(c, ["ชื่อ", "col_1"]))}
                                  {isVip && <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-yellow-200">VIP</span>}
                                  {(c.isApproved || amt >= 5000) && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); onOpenVipForm(c); setCustomerSearch(''); setIsCustomerDropdownOpen(false); }}
                                      className="bg-orange-500 hover:bg-orange-600 transition-colors text-white px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 active:scale-95 shadow-sm ml-auto"
                                      title="ดู/สร้างใบสมัคร VIP"
                                    >
                                      <Award size={10} /> ใบสมัคร VIP
                                    </button>
                                  )}
                              </div>
                              <div className="text-sm text-slate-500 mb-1">{c.computedPhone || String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]))}</div>
                              <div className="text-[11px] text-slate-500 w-full mt-1">
                                  <div className="flex justify-between mb-0.5">
                                      <span>ยอดสะสม: ฿{amt.toLocaleString()}</span>
                                      {!isVip && <span>ขาด ฿{(5000 - amt).toLocaleString()}</span>}
                                  </div>
                                  {!isVip && (
                                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                          <div className="bg-yellow-400 h-1.5 rounded-full" style={{ width: `${Math.min(100, (amt / 5000) * 100)}%` }}></div>
                                      </div>
                                  )}
                              </div>
                            </div>
                            {onViewCustomerProfile && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onViewCustomerProfile(c);
                                  setIsMobileCartOpen(false);
                                  setIsCustomerDropdownOpen(false);
                                  setCustomerSearch('');
                                }}
                                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1 font-bold shrink-0"
                              >
                                <User size={12} />
                                ดูประวัติ
                              </button>
                            )}
                          </div>
                        )})
                      ) : (
                        <div className="px-4 py-3 text-center space-y-2">
                          <div className="text-slate-500 text-xs">ไม่พบข้อมูลลูกค้าในระบบ</div>
                          {onAddCustomer && (
                            <button
                              type="button"
                              onClick={() => {
                                setCustSearch('');
                                onAddCustomer();
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                            >
                              <UserPlus size={14} />
                              <span>+ ลงทะเบียนลูกค้าใหม่</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ปุ่มลูกค้าวอคอินทั่วไป (สีส้ม) */}
                <button 
                  type="button"
                  onClick={() => handleSelectWalkIn(false)}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white border border-orange-400/80 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-orange-500/20 active:scale-95 shrink-0 cursor-pointer"
                  title="เลือกลูกค้าทั่วไป / วอคอิน (ราคาปกติ)"
                >
                  <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-xs">
                    <WalkingPersonIcon size={15} className="text-orange-600" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-white tracking-wide">วอคอิน</span>
                </button>

                {/* ปุ่มลูกค้าวอคอินสิทธิ์บัตรสมาชิก (สีเขียว) */}
                <button 
                  type="button"
                  onClick={() => handleSelectWalkIn(true)}
                  className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white border border-emerald-400/80 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-emerald-500/20 active:scale-95 shrink-0 cursor-pointer"
                  title="เลือกลูกค้าวอคอิน (มีสิทธิ์ส่วนลดบัตรสมาชิก VIP)"
                >
                  <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-xs">
                    <Award size={15} className="text-emerald-600" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-white tracking-wide">บัตรสมาชิก ⭐</span>
                </button>

                {onAddCustomer && (
                  <button 
                    type="button"
                    onClick={onAddCustomer}
                    className="px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold flex items-center justify-center transition-all shadow-sm active:scale-95 shrink-0"
                    title="เพิ่มลูกค้าใหม่"
                  >
                    <UserPlus size={18} className="text-indigo-600" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 bg-white">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <ShoppingCart size={64} className="mb-4 text-slate-200" strokeWidth={1.5} />
              <p className="text-lg">ตะกร้าว่างเปล่า</p>
              <p className="text-sm mt-2 text-slate-400">เพิ่มสินค้าจากรายการด้านซ้าย</p>
            </div>
          ) : (
            <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
              {cart.map((item) => {
                let imgUrl = null;
                if (item.type === 'product' && item.originalItem) {
                  imgUrl = getPosProductImageUrl(item.originalItem, wooImagesMap);
                }

                return (
                <div key={`${item.type}-${item.id}`} className="flex items-center justify-between gap-2 p-2 border-b border-slate-100 bg-white hover:bg-slate-50 transition-colors last:border-0">
                  
                  <div className="flex-1 min-w-0 pr-1 flex items-center gap-2">
                    {imgUrl ? (
                      <img 
                        src={imgUrl} 
                        onError={(e) => { 
                          const fallback = getProductFallbackUrl(item.originalItem);
                          if (fallback && e.target.src !== fallback) {
                            e.target.src = fallback;
                            return;
                          }
                          e.target.onerror = null; 
                          e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>'; 
                        }} 
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-50 p-[2px]" 
                      />
                    ) : item.type === 'service' ? (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-orange-100 flex items-center justify-center shrink-0 border border-orange-200">
                        <Scissors size={20} className="text-orange-500" />
                      </div>
                    ) : item.type === 'product' ? (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                        <Package size={20} className="text-slate-400" />
                      </div>
                    ) : item.type === 'claim_item' ? (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-pink-50 flex items-center justify-center shrink-0 border border-pink-200">
                        <Package size={20} className="text-pink-500" />
                      </div>
                    ) : null}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                        {item.type === 'course' && <span className="inline-block px-1 py-[1px] rounded text-[9px] bg-pink-100 text-pink-700 font-bold uppercase shrink-0">Course</span>}
                        {item.type === 'claim_item' && <span className="inline-block px-1.5 py-[1px] rounded text-[9px] bg-pink-100 text-pink-700 font-bold shrink-0">เบิกของแถม</span>}
                        <span className="truncate" title={item.name}>{item.name}</span>
                      </div>
                      {item.type === 'course' && (Number(item.credit) > 0 || Number(item.creditReceived) > 0) && (
                        <div className="text-[10px] text-emerald-600 font-bold mt-[2px] flex items-center gap-1">
                          💳 วงเงินเครดิต ฿{Number(item.credit || item.creditReceived).toLocaleString()}
                        </div>
                      )}
                      {item.type === 'course' && item.freeGift && (
                        <div className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-bold mt-[2px] flex items-center gap-1 w-fit">
                          🎁 แถมฟรี: {item.freeGift}
                        </div>
                      )}
                      {item.type === 'product' && (
                        <div className="text-[10px] text-slate-400 mt-[2px] truncate" title={String(getFuzzyKey(item.originalItem, ["หมวดสินค้า", "col_4"]) || 'ทั่วไป')}>
                          แบรนด์/หมวดหมู่: <span className="font-medium text-slate-500">{String(getFuzzyKey(item.originalItem, ["หมวดสินค้า", "col_4"]) || 'ทั่วไป')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                      {/* Qty Controls */}
                      <div className="flex items-center bg-slate-100 rounded p-[1px] border border-slate-200">
                        <button onClick={() => updateCartQty(item.id, item.type, -1)} className="p-0.5 rounded hover:bg-white text-slate-600"><Minus size={14} strokeWidth={2.5} /></button>
                        <span className="w-6 text-center text-xs font-bold text-slate-800">{item.qty}</span>
                        <button onClick={() => updateCartQty(item.id, item.type, 1)} className="p-0.5 rounded hover:bg-white text-slate-600"><Plus size={14} strokeWidth={2.5} /></button>
                      </div>
                      
                      {/* Price & Total */}
                      <div className="flex flex-col items-end w-16 relative">
                          {item.originalPrice && item.originalPrice > item.price && (
                            <del className="text-gray-400 text-[8px] absolute -top-3 right-0">฿{item.originalPrice.toLocaleString()}</del>
                          )}
                          <input 
                            type="number" 
                            value={item.price}
                            onChange={(e) => updateCartPrice(item.id, item.type, e.target.value)}
                            disabled={globalRole !== 'owner'}
                            className={`w-full text-right text-[11px] font-bold bg-transparent border-b border-dashed px-0 py-0 focus:outline-none ${globalRole === 'owner' ? 'text-slate-700 border-slate-300 focus:border-indigo-500 hover:border-indigo-300 cursor-text' : 'text-slate-500 border-transparent cursor-not-allowed'}`}
                          />
                          <div className="text-[10px] text-indigo-600 font-bold mt-[2px]">
                            ={(item.price * item.qty).toLocaleString()}
                          </div>
                      </div>
                      
                      {/* Delete */}
                      <button onClick={() => removeFromCart(item.id, item.type)} className="text-slate-300 hover:text-red-500 transition-colors p-1 ml-1 shrink-0 bg-slate-50 rounded-md hover:bg-red-50">
                        <Trash2 size={14} />
                      </button>
                  </div>

                </div>
              )})}
            </div>
          )}
        </div>

        {/* Checkout Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)] shrink-0 z-10">
          
          <div className="space-y-3 mb-4 text-slate-600">
            {isRequisitionMode ? (
              <div className="pt-3 border-t border-slate-200 flex justify-between items-end">
                <span className="font-semibold text-slate-800 block">มูลค่าการเบิก (ต้นทุน)</span>
                <span className="text-3xl font-bold text-indigo-600 tracking-tight">฿{total.toLocaleString()}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center text-sm">
                  <span>ยอดรวม (Subtotal)</span>
                  <span className="font-semibold text-slate-800">฿{subtotal.toLocaleString()}</span>
                </div>
                
                <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div 
                    className="flex justify-between items-center cursor-pointer select-none"
                    onClick={() => setShowDiscountSection(!showDiscountSection)}
                  >
                    <span className="font-bold text-sm text-slate-700 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      ส่วนลด / โปรโมชั่น
                    </span>
                    <span className="text-slate-400">
                      {showDiscountSection ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>}
                    </span>
                  </div>

                  {showDiscountSection && (
                    <div className="pt-3 border-t border-slate-200 mt-1 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">โปรโมชั่น (Promotion)</span>
                        <select 
                          value={selectedPromotion}
                          onChange={(e) => setSelectedPromotion(e.target.value)}
                          className="w-48 text-right bg-white border border-slate-200 rounded-lg px-2 py-1 text-indigo-600 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">-- ไม่ใช้โปรโมชั่น --</option>
                          {promotions.filter(p => p.isActive).map(promo => (
                            <option key={promo.id} value={promo.id}>{promo.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      {promoDiscount > 0 && (
                        <div className="flex justify-between items-center text-xs text-indigo-500">
                          <span>ส่วนลดโปรโมชั่น:</span>
                          <span>-฿{promoDiscount.toLocaleString()}</span>
                        </div>
                      )}
                      {selectedPromotion && promoResult.reason && promoDiscount === 0 && (
                        <div className="flex justify-between items-center text-xs text-rose-500">
                          <span>ส่วนลดโปรโมชั่น:</span>
                          <span>{promoResult.reason}</span>
                        </div>
                      )}
                      {selectedPromotion && promoResult.freeItems && (
                        <div className="flex justify-between items-center text-xs text-pink-600 bg-pink-50 px-2 py-1 rounded">
                          <span>โปรโมชั่น (แถมฟรี):</span>
                          <span>{promoResult.freeItems.name} x{promoResult.freeItems.qty}</span>
                        </div>
                      )}
                      {selectedPromotion && promoResult.nextTimeDiscount && (
                        <div className="flex justify-between items-center text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                          <span>โปรโมชั่น (ครั้งถัดไป):</span>
                          <span>{promoResult.nextTimeDiscount}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="text-sm">รหัสคูปอง / E-Voucher</span>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => setScannerTarget('voucher')}
                            className="bg-slate-200 text-slate-600 p-1.5 rounded-lg hover:bg-slate-300 transition-colors"
                            title="สแกน QR Code"
                          >
                            <ScanLine size={16} />
                          </button>
                          <input 
                            type="text"
                            value={manualVoucherCode}
                            onChange={(e) => setManualVoucherCode(e.target.value.toUpperCase())}
                            placeholder="กรอกรหัส..."
                            className="w-24 text-center bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase text-xs"
                            onKeyDown={(e) => {
                              if(e.key === 'Enter' && manualVoucherCode) {
                                handleVoucherScan(manualVoucherCode);
                                setManualVoucherCode('');
                              }
                            }}
                          />
                          <button 
                            onClick={() => {
                              if (manualVoucherCode) {
                                handleVoucherScan(manualVoucherCode);
                                setManualVoucherCode('');
                              }
                            }}
                            className="bg-indigo-600 text-white px-2 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                          >
                            ใช้สิทธิ์
                          </button>
                        </div>
                      </div>

                      {/* 🌟 1-TAP QUICK PROMO CRM / WALK-IN BUTTONS 🌟 */}
                      <div className="bg-indigo-50/70 border border-indigo-150 rounded-xl p-2.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                            <Tag size={13} className="text-indigo-600" />
                            ปุ่มด่วนโปรโมชั่น CRM / Walk-in
                          </span>
                          {(appliedVoucherCode || globalDiscount > 0) && (
                            <button
                              type="button"
                              onClick={() => {
                                setAppliedVoucherCode(null);
                                setAppliedVoucherData(null);
                                setGlobalDiscount(0);
                                showToast('ยกเลิกส่วนลดโปรโมชั่นแล้ว', 'info');
                              }}
                              className="text-[10px] font-bold text-red-600 hover:text-red-700 underline"
                            >
                              ✕ ยกเลิกส่วนลด
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              if (cart.length === 0) {
                                showToast('กรุณาเลือกรายการสินค้า/คอร์สลงตะกร้าก่อน', 'warning');
                                return;
                              }
                              const disc = Math.floor(subtotal * 0.10);
                              setGlobalDiscount(disc);
                              setAppliedVoucherCode('WALKIN10');
                              setAppliedVoucherData({
                                code: 'WALKIN10',
                                name: 'ส่วนลด 10% ลูกค้าใหม่/Walk-in',
                                type: 'percent',
                                value: 10
                              });
                              showToast('ใช้โปร Walk-in ลด 10%', `หักส่วนลด ฿${disc.toLocaleString()}`, 'success');
                            }}
                            className={`p-2 rounded-lg text-left transition-all border ${
                              appliedVoucherCode === 'WALKIN10'
                                ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                                : 'bg-white hover:bg-amber-50 text-slate-800 border-slate-200'
                            }`}
                          >
                            <div className="text-[11px] font-black flex items-center justify-between">
                              <span>🚶‍♂️ Walk-in 10%</span>
                              <span className="text-[10px] bg-black/10 px-1 rounded font-bold">-10%</span>
                            </div>
                            <div className="text-[9px] opacity-80 mt-0.5 truncate">ลูกค้าใหม่/หน้าร้านครั้งแรก</div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (cart.length === 0) {
                                showToast('กรุณาเลือกรายการสินค้า/คอร์สลงตะกร้าก่อน', 'warning');
                                return;
                              }
                              const disc = Math.floor(subtotal * 0.20);
                              setGlobalDiscount(disc);
                              setAppliedVoucherCode('CRM20');
                              setAppliedVoucherData({
                                code: 'CRM20',
                                name: 'ส่วนลด 20% สมาชิก CRM ออนไลน์',
                                type: 'percent',
                                value: 20
                              });
                              showToast('ใช้โปร CRM ลด 20%', `หักส่วนลด ฿${disc.toLocaleString()}`, 'success');
                            }}
                            className={`p-2 rounded-lg text-left transition-all border ${
                              appliedVoucherCode === 'CRM20'
                                ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                                : 'bg-white hover:bg-indigo-50 text-slate-800 border-slate-200'
                            }`}
                          >
                            <div className="text-[11px] font-black flex items-center justify-between">
                              <span>📱 สมาชิก CRM 20%</span>
                              <span className="text-[10px] bg-black/10 px-1 rounded font-bold">-20%</span>
                            </div>
                            <div className="text-[9px] opacity-80 mt-0.5 truncate">สิทธิพิเศษซื้อคอร์สออนไลน์</div>
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm">ส่วนลดเพิ่มเติม (Manual)</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-400">฿</span>
                          <input 
                            type="number"
                            value={globalDiscount || ''}
                            onChange={(e) => setGlobalDiscount(parseNumber(e.target.value))}
                            placeholder="0"
                            disabled={globalRole !== 'owner'}
                            className={`w-24 text-right border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${globalRole === 'owner' ? 'bg-white border-slate-200 text-red-500 font-medium cursor-text' : 'bg-slate-100 border-transparent text-slate-400 cursor-not-allowed'}`}
                          />
                        </div>
                      </div>
                      
                      {subtotal > 0 && (
                        <div className="flex justify-end gap-1">
                          {[10, 20, 25].map(pct => (
                            <button 
                              key={pct}
                              onClick={() => setGlobalDiscount(Math.floor(subtotal * (pct / 100)))}
                              className="px-2 py-1 text-[10px] font-semibold bg-slate-200 text-slate-600 rounded hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                            >
                              {pct}%
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-end">
                  <div>
                    <span className="font-semibold text-slate-800 block">ยอดชำระสุทธิ</span>
                    {totalSaved > 0 && <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mt-1 inline-block">ส่วนลดพิเศษ {appliedVoucherCode ? `(${appliedVoucherCode})` : ''}: ฿{totalSaved.toLocaleString()}</span>}
                  </div>
                  <span className="text-3xl font-bold text-indigo-600 tracking-tight">฿{total.toLocaleString()}</span>
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            {/* 👑 ปุ่มชำระเงินเป็นใช้คอสได้กรณีที่เป็นเจ้าของ */}
            {globalRole === 'owner' && !isRequisitionMode && cart.some(i => i.type === 'course' || i.type === 'single_course') && (
              <button
                type="button"
                onClick={() => {
                  if (cart.length === 0) return;
                  setIsOwnerDirectUsage(true);
                  if (!selectedCustomer) {
                    handleSelectWalkIn();
                  }
                  if (!splitPayment.cash && !splitPayment.transfer && !splitPayment.cod && !splitPayment.credit) {
                    setSplitPayment({ cash: 0, transfer: total, cod: 0, credit: 0 });
                  }
                  setCheckoutStep(1);
                  setShowPaymentModal(true);
                }}
                disabled={cart.length === 0}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-700 hover:from-purple-700 hover:to-indigo-800 text-white rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-200 active:scale-95 cursor-pointer"
                title="ชำระเงินและใช้บริการคอร์สทันที ไม่ต้องสร้างใบคอร์สและไม่ต้องตัดคอร์สซ้ำ"
              >
                <Scissors size={20} className="text-purple-200" />
                <span>ชำระเงินเป็นใช้คอส (เจ้าของร้าน / เช็คเบื้องต้น)</span>
              </button>
            )}

            <div className="flex gap-2">
              {!isRequisitionMode && (
                <>
                  <button 
                    onClick={() => setShowParkBedModal(true)}
                    disabled={cart.length === 0}
                    className="w-1/4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-[12px] flex flex-col items-center justify-center gap-1 transition-all shadow-lg shadow-amber-200 active:scale-95 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    <Clock size={18} /> พักบิล
                  </button>
                  <button 
                    onClick={() => {
                      if (cart.length === 0) {
                        showToast('ไม่มีสินค้าในตะกร้า');
                        return;
                      }
                      if (selectedCustomer) {
                        const addr = selectedCustomer.address || selectedCustomer.addressNo || '';
                        if (addr) setShippingAddress(addr);
                      }
                      setOrderChannel('chat');
                      setCheckoutStep(1);
                      setShowPaymentModal(true);
                      setTimeout(() => {
                        setIshipModal({ isOpen: true });
                      }, 300);
                    }}
                    disabled={cart.length === 0}
                    className={`w-1/4 py-3 rounded-2xl font-bold text-[12px] flex flex-col items-center justify-center gap-1 transition-all shadow-lg active:scale-95 ${cart.length === 0 ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' : 'bg-sky-500 hover:bg-sky-600 text-white shadow-sky-200'}`}
                  >
                    <Package size={18} /> ขนส่ง
                  </button>
                </>
              )}
              <button 
                onClick={() => {
                  if (cart.length === 0) {
                    showToast('ไม่มีสินค้าในตะกร้า');
                    return;
                  }
                  const hasCourse = cart.some(i => i.type === 'course' || i.type === 'single_course');
                  if (hasCourse && !selectedCustomer && !isRequisitionMode) {
                    if (globalRole === 'owner') {
                      setIsOwnerDirectUsage(true);
                      handleSelectWalkIn();
                    } else {
                      showToast('มีรายการคอร์สในตะกร้า โปรดเลือกลูกค้าก่อนชำระเงิน', 'error');
                      return;
                    }
                  } else if (hasCourse && globalRole === 'owner') {
                    // keep current isOwnerDirectUsage setting
                  } else {
                    setIsOwnerDirectUsage(false);
                  }
                  if (!splitPayment.cash && !splitPayment.transfer && !splitPayment.cod && !splitPayment.credit) {
                    setSplitPayment({ cash: 0, transfer: total, cod: 0, credit: 0 });
                  }
                  setCheckoutStep(1);
                  setShowPaymentModal(true);
                }}
                disabled={cart.length === 0}
                className={`flex-1 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${
                  cart.length === 0 
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' 
                    : (isRequisitionMode 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200' 
                        : (total <= 0 
                            ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200' 
                            : 'bg-pink-600 hover:bg-pink-700 text-white shadow-pink-200'))
                }`}
              >
                {isRequisitionMode ? (
                  <><Package size={24} /> สร้างใบเบิกสินค้า (PO)</>
                ) : cart.some(i => i.type === 'usage' || i.type === 'claim_item') ? (
                  <>{total <= 0 ? <Scissors size={24} /> : <CheckCircle size={24} />} {cart.some(i => i.type === 'usage') ? (total <= 0 ? 'ดำเนินการตัดคอส' : 'ดำเนินการตัดคอร์สและชำระเงิน') : 'ดำเนินการเบิกสินค้า'}</>
                ) : (
                  <><CheckCircle size={24} /> ดำเนินการชำระเงิน</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

    {/* Park Bed Modal */}
    {showParkBedModal && (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm print:hidden">
        <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-800">พักบิลเข้าเตียง</h2>
            <button onClick={() => setShowParkBedModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full"><X size={20} /></button>
          </div>
          <div className="mb-6">
            <div className="text-sm font-semibold text-slate-700 mb-2">เลือกเตียงที่ต้องการพักบิล</div>
            <select
              value={parkBedNumber}
              onChange={(e) => setParkBedNumber(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 outline-none"
            >
              {Array.from({ length: 4 }).map((_, i) => (
                 <option key={i + 1} value={String(i + 1)}>เตียง {i + 1}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={async () => {
              setIsProcessing(true);
              try {
                const orderNo = `P${Date.now().toString().slice(-6)}`;
                const orderItems = cart.map(item => ({
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  qty: item.qty,
                  type: item.type
                }));
                
                const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
                const existingParkedOrder = orders.find(o => 
                  o.status === 'รอชำระเงิน' && 
                  o.source === 'POS_Parked' && 
                  String(o.bedNumber) === String(parkBedNumber) &&
                  (!globalBranch || o.branch === globalBranch || o.branch === 'สำนักงานใหญ่') &&
                  (new Date(o.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) === today || 
                   new Date(o.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') === today.replace(/\//g, '-'))
                );
                
                if (existingParkedOrder) {
                  // Merge cart items with existing order
                  const updatedCartItems = [...(existingParkedOrder.cartItems || []), ...orderItems];
                  const updatedPrice = Number(existingParkedOrder.price) + total;
                  const updatedDiscount = (Number(existingParkedOrder.discount) || 0) + (Number(globalDiscount) || 0);
                  const updatedCourseName = updatedCartItems.map(i => `${i.name} x${i.qty}`).join(', ');
                  
                  await updateDoc(doc(db, 'orders', existingParkedOrder.id), {
                    cartItems: updatedCartItems,
                    price: updatedPrice,
                    discount: updatedDiscount,
                    courseName: updatedCourseName,
                    updatedAt: new Date().toISOString()
                  });
                  showToast(`เพิ่มบิลเข้าเตียง ${parkBedNumber} สำเร็จ`, 'success');
                } else {
                  // Create new parked order
                  const orderData = {
                    orderNo,
                    customerName: selectedCustomer ? String(getFuzzyKey(selectedCustomer, ["ชื่อ", "col_1"]) || '') : 'ลูกค้าทั่วไป',
                    customerPhone: selectedCustomer ? String(getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3"]) || '') : '',
                    bedNumber: String(parkBedNumber),
                    branch: globalBranch || 'เฉวง',
                    source: 'POS_Parked',
                    status: 'รอชำระเงิน',
                    price: total,
                    discount: Number(globalDiscount) || 0,
                    totalCost: 0,
                    paymentMethod: 'โอนเงิน',
                    cartItems: orderItems,
                    createdAt: new Date().toISOString(),
                    courseName: orderItems.map(i => `${i.name} x${i.qty}`).join(', ')
                  };
                  
                  await addDoc(getCol('orders'), orderData);
                  showToast(`พักบิลเข้าเตียง ${parkBedNumber} สำเร็จ ให้ลูกค้าสแกน QR Code ประจำเตียงเพื่อจ่ายเงิน`, 'success');
                }
                
                setCart([]);
                setGlobalDiscount(0);
                setAppCreditPaidAmount(0);
                setShowParkBedModal(false);
              } catch (err) {
                console.error(err);
                showToast('เกิดข้อผิดพลาดในการพักบิล', 'error');
              }
              setIsProcessing(false);
            }}
            disabled={isProcessing}
            className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-200"
          >
            {isProcessing ? 'กำลังบันทึก...' : <><CheckCircle size={20} /> ยืนยันพักบิล</>}
          </button>
        </div>
      </div>
    )}

    {/* Payment Modal */}
    {showPaymentModal && (() => {
      const hasCourseUsage = cart.some(i => i.type === 'usage');
      const hasCourseClaim = cart.some(i => i.type === 'claim_item');
      const hasUsageOrClaim = hasCourseUsage || hasCourseClaim;

      return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm print:hidden">
        <div className={`bg-white rounded-3xl p-6 w-full ${checkoutStep === 1 && hasUsageOrClaim ? 'max-w-3xl' : 'max-w-lg'} shadow-2xl flex flex-col max-h-[95vh] overflow-y-auto`}>
          
          {/* Header */}
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800">
                {checkoutStep === 1 ? (
                  isOwnerDirectUsage
                    ? '👑 ชำระเงินเป็นใช้คอส (เช็คเบื้องต้น)'
                    : hasCourseUsage 
                      ? 'ข้อมูลการรับบริการ' 
                      : (hasCourseClaim 
                          ? 'ข้อมูลการเบิกสินค้า / ของแถม' 
                          : (isRequisitionMode ? 'ยืนยันการเบิกสินค้า (PO)' : 'ข้อมูลคำสั่งซื้อ & พนักงาน'))
                ) : (
                  isOwnerDirectUsage ? '👑 ช่องทางชำระเงิน (ใช้คอส/เช็คเบื้องต้น)' : 'ช่องทางการชำระเงิน'
                )}
              </h2>
              {isOwnerDirectUsage && (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                  <Scissors size={12} /> สิทธิ์เจ้าของร้าน
                </span>
              )}
              {!isRequisitionMode && !isOwnerDirectUsage && total > 0 && (
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold bg-pink-50 text-pink-700 border border-pink-200 flex items-center gap-1`}>
                  {hasCourseUsage ? <><Scissors size={12} /> ตัดคอร์ส + ชำระเงิน</> : `ขั้นตอน ${checkoutStep}/2`}
                </span>
              )}
              {!isRequisitionMode && !isOwnerDirectUsage && total <= 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1">
                  <Scissors size={12} /> {hasCourseClaim && !hasCourseUsage ? 'เบิกของแถม' : 'ตัดคอสบริการ'}
                </span>
              )}
            </div>
            <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full transition-colors"><X size={20} /></button>
          </div>

          {/* STEP 1: Order Details, Staff, Service/Claim & Signatures */}
          <div className={`space-y-4 ${checkoutStep === 1 ? '' : 'hidden'}`}>
            {/* 👑 สลับโหมดชำระเงินเป็นใช้คอส (เช็คเบื้องต้น) สำหรับเจ้าของ */}
            {globalRole === 'owner' && cart.some(i => i.type === 'course' || i.type === 'single_course') && (
              <div className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${isOwnerDirectUsage ? 'bg-purple-50/90 border-purple-200 shadow-2xs' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isOwnerDirectUsage ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-xs' : 'bg-slate-200 text-slate-500'}`}>
                    <Scissors size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <span>{isOwnerDirectUsage ? 'โหมดชำระเงินเป็นใช้คอส' : 'โหมดซื้อคอร์สปกติ'}</span>
                      {isOwnerDirectUsage && <span className="bg-purple-200/80 text-purple-900 text-[9px] font-bold px-1.5 py-0.2 rounded-full">เช็คเบื้องต้น</span>}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {isOwnerDirectUsage 
                        ? '✨ เจ้าของร้านเช็คเบื้องต้น: ไม่สร้างใบคอร์ส และไม่ต้องกดตัดคอร์สซ้ำ' 
                        : 'ระบบจะสร้างใบคอร์ส IC... เข้าสู่ระบบตามปกติ'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOwnerDirectUsage(prev => !prev)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isOwnerDirectUsage 
                      ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm' 
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                  }`}
                >
                  {isOwnerDirectUsage ? '✓ เปิดใช้คอส' : 'สลับเป็นใช้คอส'}
                </button>
              </div>
            )}

            {(hasCourseUsage || isOwnerDirectUsage) && (
                <div>
                  <div className="text-sm font-semibold text-slate-700 mb-2">เข้าใช้เตียง (สำหรับ Walk-in)</div>
                  <select
                    value={selectedBed}
                    onChange={(e) => setSelectedBed(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 outline-none"
                  >
                    <option value="">ไม่ระบุเตียง (แค่ตัดคอร์สอย่างเดียว)</option>
                    {Array.from({ length: 4 }).map((_, i) => {
                       const bedNum = String(i + 1);
                       const isOccupied = bookings && bookings.some(b => String(b.bedNumber) === bedNum && b.status === 'กำลังใช้บริการ' && b.branch === (globalBranch || 'เฉวง'));
                       return (
                         <option key={bedNum} value={bedNum} disabled={isOccupied}>
                           เตียง {bedNum} {isOccupied ? '(ไม่ว่าง)' : '(ว่าง)'}
                         </option>
                       );
                    })}
                  </select>
                </div>
              )}

              {globalRole === 'owner' && (
                <div>
                  <div className="text-sm font-semibold text-slate-700 mb-2">วันที่ทำรายการ (ย้อนหลังได้เฉพาะเจ้าของ)</div>
                  <input 
                    type="date"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 outline-none"
                  />
                </div>
              )}

              {!isRequisitionMode && !hasUsageOrClaim && (
                <div>
                  <div className="text-sm font-semibold text-slate-700 mb-2">ช่องทางการสั่งซื้อ</div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setOrderChannel('instore'); setSplitPayment(prev => ({ ...prev, transfer: total - prev.cash - prev.cod - prev.credit })); }} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${orderChannel === 'instore' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>หน้าร้าน</button>
                    <button type="button" onClick={() => { setOrderChannel('shopee'); setSplitPayment({ cash: 0, transfer: 0, cod: total, credit: 0 }); }} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${orderChannel === 'shopee' ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>ช้อปปี้</button>
                    <button type="button" onClick={() => { setOrderChannel('chat'); setSplitPayment({ cash: 0, transfer: 0, cod: total, credit: 0 }); }} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${orderChannel === 'chat' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>ทางแชท</button>
                    <button type="button" onClick={() => { setOrderChannel('web'); setSplitPayment({ cash: 0, transfer: 0, cod: total, credit: 0 }); }} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${orderChannel === 'web' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>ทางเว็บ</button>
                  </div>
                </div>
              )}

              {!isRequisitionMode && !hasUsageOrClaim && orderChannel !== 'instore' && (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-700 mb-2 flex justify-between">
                      <span>หมายเลขคำสั่งซื้อ / รหัสอ้างอิง</span>
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={activeWcOrderId || ''}
                        onChange={(e) => setActiveWcOrderId(e.target.value)}
                        placeholder="เช่น 240822ABCD..." 
                        className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button 
                        type="button"
                        onClick={() => setScannerTarget('wcOrder')}
                        className="bg-indigo-100 text-indigo-600 px-3 py-2 rounded-lg font-bold hover:bg-indigo-200 transition-colors flex items-center justify-center shrink-0"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Shipping & Tracking Section */}
                  <div>
                      <div className="flex gap-2 mb-2">
                        <div className="flex-1">
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">📮 เลขพัสดุ / ข้อมูลจัดส่ง</label>
                          <div className="flex gap-1.5 flex-wrap sm:flex-nowrap">
                            <input
                              type="text"
                              value={posTrackingNo}
                              onChange={(e) => setPosTrackingNo(e.target.value)}
                              placeholder="สแกนหรือพิมพ์เลขพัสดุ"
                              className="flex-1 min-w-0 border border-slate-200 rounded-xl p-2.5 text-sm font-mono font-bold tracking-wide focus:outline-none focus:border-sky-500 w-full"
                            />
                            <div className="flex gap-1.5 shrink-0">
                               <button
                                 type="button"
                                 onClick={() => setScannerTarget('trackingNo')}
                                 title="เปิดกล้องสแกนเลขพัสดุ"
                                 className="px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl flex items-center gap-1.5 font-bold text-xs shadow-sm active:scale-95 transition-all"
                               >
                                 <QrCode size={16}/> สแกน
                               </button>
                               <button
                                 type="button"
                                 onClick={() => setIshipModal({ isOpen: true })}
                                 title="จัดการที่อยู่ / เรียก iShip"
                                 className="px-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl flex items-center gap-1.5 font-bold text-xs shadow-sm active:scale-95 transition-all"
                               >
                                 <Truck size={16}/> iShip
                               </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Address Summary */}
                      {shippingAddress && (
                        <div className="bg-slate-50 rounded-lg p-2 text-[11px] text-slate-600 flex items-center border border-slate-100">
                          <div className="truncate font-medium">
                            <Truck size={12} className="inline mr-1 text-slate-400" /> {shippingAddress.replace(/\n/g, ' ')}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              )}
              
              {/* Staff Selection in Step 1 (for normal checkout) */}
              {!hasUsageOrClaim && renderStaffSelection(false)}

              {/* Claimed Items Summary (For claim_item) */}
              {hasCourseClaim && (
                <div className="p-4 bg-gradient-to-br from-pink-50/90 via-rose-50/60 to-pink-50/90 border border-pink-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-black text-pink-800 flex items-center gap-1.5">
                      <Package size={16} className="text-pink-600" /> รายการสินค้า / ของแถมที่ขอเบิกจากคอร์ส:
                    </div>
                    <span className="text-[10px] text-pink-700 font-bold bg-white/90 px-2 py-0.5 rounded-full border border-pink-200 shadow-xs">
                      แตะเพื่อเลือกหรือเปลี่ยนสินค้าตัดสต็อก
                    </span>
                  </div>
                  <div className="space-y-2">
                    {cart.filter(i => i.type === 'claim_item').map(ci => {
                      const currentBranch = normalizeBranchName(globalBranch || 'เฉวง') || 'เฉวง';
                      const linkedProd = (ci.linkedProductId && products.find(p => p.id === ci.linkedProductId)) ||
                        ci.linkedProduct ||
                        findAutoMatchedProduct(ci.itemName || ci.name, products);
                      const linkedStock = linkedProd ? getBranchStock(linkedProd, currentBranch) : null;
                      const linkedCode = linkedProd ? String(getFuzzyKey(linkedProd, ["รหัสสินค้า", "col_1"]) || '') : '';
                      const linkedName = linkedProd ? String(getFuzzyKey(linkedProd, ["ชื่อสินค้า", "col_2"]) || linkedProd.name || '') : '';

                      return (
                        <div key={ci.id} className="p-3 bg-white rounded-xl border border-pink-200/90 shadow-xs flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-lg shrink-0">🎁</span>
                              <div className="min-w-0">
                                <span className="text-xs sm:text-sm font-black text-slate-800 truncate block">
                                  {ci.itemName || ci.name}
                                </span>
                                <span className="text-[11px] text-pink-600 font-bold">
                                  เบิก {ci.qty} ชิ้น {ci.courseName ? `• จากคอร์ส: ${ci.courseName}` : ''}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectingGiftItem(ci);
                                setGiftProductSearchQuery('');
                              }}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-300 flex items-center gap-1 transition-all active:scale-95 shrink-0 shadow-xs"
                            >
                              <Edit size={12} />
                              <span>{linkedProd ? 'เปลี่ยนสินค้าตัดสต็อก' : 'เลือกสินค้าตัดสต็อก'}</span>
                            </button>
                          </div>

                          {/* Linked Product & Stock Info */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs flex-wrap gap-1.5">
                            {ci.skipStockDeduction ? (
                              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                                🔘 รายการนี้ไม่ตัดสต็อกสินค้า (เป็นสิทธิ์พิเศษ/บริการ)
                              </span>
                            ) : linkedProd ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                                  <Package size={13} className="text-pink-500" /> ตัดสต็อก:
                                </span>
                                <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md text-[11px] border border-slate-200">
                                  {linkedCode ? `[${linkedCode}] ` : ''}{linkedName}
                                </span>
                                {linkedStock !== null && (
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                    linkedStock >= ci.qty 
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                                  }`}>
                                    สต็อกสาขา{currentBranch}: {linkedStock} ชิ้น {linkedStock < ci.qty && '(สต็อกไม่พอ)'}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center justify-between w-full text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200">
                                <span className="flex items-center gap-1 font-bold">
                                  <AlertCircle size={13} className="text-amber-600" /> ยังไม่ได้เลือกสินค้าตัดสต็อก
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectingGiftItem(ci);
                                    setGiftProductSearchQuery('');
                                  }}
                                  className="font-black text-amber-900 underline hover:text-amber-700"
                                >
                                  แตะเลือกสินค้าทันที
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Service Details & Signatures (For usage, claim, or service items) */}
              {(hasUsageOrClaim || cart.some(i => i.type === 'service')) && (
                <div className="space-y-4 pt-2">
                  {/* 📸 หลักฐานการให้บริการ (รูปถ่าย & ลายเซ็น) - แตะเพื่อเปิดโมดัลจัดการรูปและลายเซ็น */}
                  <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 rounded-2xl p-3.5 text-white shadow-md relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 text-white shadow-inner">
                        <Camera size={20} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-black tracking-wide">
                            {paymentPhotos.before.length > 0 ? '🟢 เริ่มให้บริการแล้ว' : '📸 รูปถ่าย & ลายเซ็นรับบริการ'}
                          </span>
                          {paymentPhotos.before.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-400 text-emerald-950 shadow-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-950 animate-ping" />
                              {(() => {
                                const firstUsage = cart.find(i => i.type === 'usage');
                                const cInfo = firstUsage ? activeServiceCourses[firstUsage.id] : null;
                                return cInfo?.startTime ? getServiceElapsedStr(cInfo.startTime) : 'กำลังให้บริการ';
                              })()}
                            </span>
                          )}
                          {(custSigRef.current?.dataset?.isSigned === "true" || !!customerSignature) && (staffSigRef.current?.dataset?.isSigned === "true" || !!staffSignature) ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/30">
                              ✓ เซ็นชื่อครบแล้ว
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-amber-950">
                              ✍️ ยังไม่ได้เซ็น
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-white/80 mt-0.5 leading-snug truncate">
                          Before: {paymentPhotos.before.length} รูป • After: {paymentPhotos.after.length} รูป • แตะปุ่มเพื่อถ่ายรูปและเซ็นชื่อ
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowServiceProofModal(true)}
                      className="px-3.5 py-2 rounded-xl text-xs font-black bg-white text-indigo-700 hover:bg-indigo-50 shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <PenTool size={14} />
                      <span>{paymentPhotos.before.length > 0 || customerSignature ? 'จัดการรูป / ลายเซ็น' : 'แตะถ่ายรูป & เซ็นชื่อ'}</span>
                    </button>
                  </div>

                  {/* Staff Selection & Hand Fee in Step 1 for Course Usage */}
                  {hasUsageOrClaim && renderStaffSelection(true)}

                  {/* Service Selection (Only for usage) */}
                  {cart.some(i => i.type === 'usage') && (() => {
                    const usageCourses = cart.filter(i => i.type === 'usage');
                    const totalDeductingQty = usageCourses.reduce((sum, item) => sum + (Number(item.qty) || 1), 0);

                    const courseSpecificItems = [];
                    usageCourses.forEach(ci => {
                      const rawItems = String(
                        ci.originalItem?.receivedItems ||
                        ci.originalItem?.desc ||
                        ci.originalItem?.["col_11"] ||
                        getFuzzyKey(ci.originalItem, ["รายการที่ได้รับ", "col_11"]) ||
                        ''
                      );
                      if (rawItems) {
                        const cleaned = rawItems.replace(/\b\d+\.\s*/g, '').replace(/คอร์สย่อย\/เสริม:\s*/g, '').replace(/สินค้าที่ได้รับ:\s*/g, '');
                        const parts = cleaned.split(/[\n,–-]+/).map(s => s.trim()).filter(s => s && s.length > 1 && !s.includes('VIP'));
                        parts.forEach(p => {
                          if (!courseSpecificItems.includes(p)) courseSpecificItems.push(p);
                        });
                      }
                      const cName = String(getFuzzyKey(ci.originalItem, ["ชื่อคอส", "col_8"]) || ci.name || '').replace(/เบิกใช้:\s*/g, '').replace(/\(.*\)/g, '').trim();
                      if (cName && !courseSpecificItems.includes(cName) && !cName.includes('Set') && !cName.includes('โปร')) {
                        courseSpecificItems.unshift(cName);
                      }
                    });

                    const isServiceSelected = (name) => {
                      return usedServices.some(s => {
                        const sName = String(getFuzzyKey(s, ["ชื่อคอส", "col_4"]) || s.name || s).trim();
                        return sName === name || sName.includes(name) || name.includes(sName);
                      });
                    };

                    const toggleServiceName = (name, extra = {}) => {
                      const exists = isServiceSelected(name);
                      if (exists) {
                        setUsedServices(prev => prev.filter(s => {
                          const sName = String(getFuzzyKey(s, ["ชื่อคอส", "col_4"]) || s.name || s).trim();
                          return sName !== name && !sName.includes(name) && !name.includes(sName);
                        }));
                      } else {
                        setUsedServices(prev => [
                          ...prev,
                          {
                            id: extra.id || `srv_${name}_${Date.now()}`,
                            name: name,
                            "ชื่อคอส": name,
                            "col_4": name,
                            ...extra
                          }
                        ]);
                      }
                    };

                    return (
                    <div className="space-y-3">
                      <div className="bg-teal-50/70 border border-teal-200/80 rounded-2xl p-3 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-teal-900 flex items-center gap-1.5">
                            <Layers size={14} className="text-teal-600" /> คอร์สที่กำลังตัดยอด:
                          </span>
                          <span className="text-[10px] font-bold text-teal-700 bg-white border border-teal-200 px-2.5 py-0.5 rounded-lg shadow-2xs">
                            ตัดยอดคอร์ส: {totalDeductingQty} ครั้ง (เลือกแล้ว {usedServices.length} บริการ)
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {usageCourses.map(ci => {
                            const remainQty = Number(ci.originalItem?.computedRemainQty ?? ci.maxQty ?? 99);
                            const cName = String(getFuzzyKey(ci.originalItem, ["ชื่อคอส", "col_8"]) || ci.name || '').replace(/เบิกใช้:\s*/g, '');
                            const cNo = String(getFuzzyKey(ci.originalItem, ["เลขที่ใบคอส", "col_2"]) || '');
                            return (
                              <div key={ci.id} className="flex items-center justify-between bg-purple-50/70 px-3.5 py-2.5 rounded-xl border-2 border-purple-400 shadow-sm ring-2 ring-purple-300/80 animate-pulse text-xs relative overflow-hidden transition-all">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-600"></div>
                                <div className="min-w-0 pr-2 pl-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping shrink-0" />
                                    <div className="font-black text-purple-950 text-xs sm:text-sm truncate">{cName}</div>
                                  </div>
                                  <div className="text-[10px] text-purple-700 font-medium mt-0.5">
                                    เลขที่: {cNo || ci.id} • คงเหลือ {remainQty} ครั้ง • <span className="font-bold text-purple-900 bg-purple-100 px-1.5 py-0.2 rounded">เลือกตัดยอดคอร์สนี้</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-xs text-purple-900 font-black">ตัด:</span>
                                  <div className="flex items-center border border-purple-300 rounded-lg bg-white shadow-2xs overflow-hidden">
                                    <button
                                      type="button"
                                      onClick={() => updateCartQty(ci.id, 'usage', -1)}
                                      disabled={ci.qty <= 1}
                                      className="w-7 h-7 flex items-center justify-center text-purple-700 hover:bg-purple-100 disabled:opacity-30 disabled:hover:bg-transparent font-black cursor-pointer"
                                    >
                                      -
                                    </button>
                                    <span className="w-8 text-center font-black text-purple-950 text-xs">
                                      {ci.qty}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => updateCartQty(ci.id, 'usage', 1)}
                                      disabled={ci.qty >= remainQty}
                                      className="w-7 h-7 flex items-center justify-center text-purple-700 hover:bg-purple-100 disabled:opacity-30 disabled:hover:bg-transparent font-black cursor-pointer"
                                    >
                                      +
                                    </button>
                                  </div>
                                  <span className="text-xs font-black text-purple-900 mr-1">ครั้ง</span>
                                  <button
                                    type="button"
                                    onClick={() => removeFromCart(ci.id, 'usage')}
                                    title="นำคอร์สนี้ออกจากการตัดยอด"
                                    className="w-6 h-6 rounded-md bg-white hover:bg-rose-100 text-slate-400 hover:text-rose-600 border border-purple-200 flex items-center justify-center transition-colors cursor-pointer"
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* + เพิ่มคอร์สอื่นของลูกค้านี้เพื่อตัดพร้อมกัน */}
                        {otherAvailableCustomerCourses.length > 0 && (
                          <div className="pt-2 border-t border-teal-200/60">
                            <div className="text-[11px] font-bold text-teal-800 mb-1.5 flex items-center gap-1">
                              <Plus size={13} className="text-teal-600" /> เพิ่มคอร์สอื่นของลูกค้านี้เพื่อตัดพร้อมกัน ({otherAvailableCustomerCourses.length} คอร์สที่เหลือ):
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {otherAvailableCustomerCourses.map(oc => {
                                const ocName = String(getFuzzyKey(oc, ["ชื่อคอส", "col_8"]) || oc.name || '').replace(/เบิกใช้:\s*/g, '');
                                const ocRemain = Number(oc.computedRemainQty || 1);
                                return (
                                  <button
                                    key={oc.id}
                                    type="button"
                                    onClick={() => addCourseToDeduction(oc, 1)}
                                    className="px-2.5 py-1 bg-white hover:bg-teal-100 border border-teal-200 text-teal-800 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer"
                                  >
                                    <span>+ {ocName}</span>
                                    <span className="text-[10px] text-teal-600 bg-teal-50 px-1 py-0.2 rounded border border-teal-200/60 font-black">เหลือ {ocRemain}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-xs font-black text-slate-800">
                            เลือกรายการบริการ / ลงเครื่องที่ทำในครั้งนี้ <span className="text-slate-400 font-normal">(ไม่บังคับ)</span>
                          </label>
                          <p className="text-[10px] text-slate-500">
                            แตะเลือกได้ตามจริง (ครอบคลุมทั้งคอร์สหลักและคอร์สลงเครื่องที่ซื้อเพิ่ม) หรือปล่อยว่างเพื่อบันทึกชื่อคอร์ส
                          </p>
                        </div>
                      </div>

                      {/* Search box */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <input 
                          type="text"
                          placeholder="ค้นหาบริการหรือเครื่อง (เช่น สกินสครับเบอร์, โอโซน, นวดหน้า)..."
                          value={modalServiceSearch}
                          onChange={(e) => setModalServiceSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                        />
                      </div>

                      {/* Selected Services Tags */}
                      {usedServices.length > 0 && (
                        <div className="p-2.5 bg-indigo-50/70 rounded-xl flex flex-wrap gap-1.5 border border-indigo-100">
                          <span className="text-[10px] font-black text-indigo-700 flex items-center gap-1 mr-1">
                            <CheckCircle size={13} /> บริการที่เลือกทำ:
                          </span>
                          {usedServices.map((s, idx) => {
                            const sName = String(getFuzzyKey(s, ["ชื่อคอส", "col_4"]) || s.name || s);
                            return (
                              <span key={s.id || idx} className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-indigo-200 text-xs font-bold text-indigo-800 shadow-2xs">
                                {sName}
                                <X size={12} className="cursor-pointer text-slate-400 hover:text-red-500 ml-0.5" onClick={() => setUsedServices(usedServices.filter((_, i) => i !== idx))} />
                              </span>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() => setUsedServices([])}
                            className="text-[10px] text-red-500 hover:underline font-bold ml-auto px-1"
                          >
                            ล้างทั้งหมด
                          </button>
                        </div>
                      )}

                      {/* 🛒 รายการที่ซื้อเพิ่มในบิลนี้ (สินค้า / คอร์ส / ลงเครื่องเพิ่ม) */}
                      {extraPaidItems.length > 0 && (
                        <div className="p-3 bg-gradient-to-r from-pink-50 via-rose-50 to-pink-50 border border-pink-200/90 rounded-2xl shadow-sm space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-black text-pink-900">
                              <ShoppingCart size={15} className="text-pink-600" />
                              <span>รายการที่ซื้อเพิ่มในบิลนี้ ({extraPaidItems.reduce((s, i) => s + (Number(i.qty) || 1), 0)} ชิ้น):</span>
                            </div>
                            <div className="text-xs font-black text-pink-700 bg-white border border-pink-300 px-2.5 py-0.5 rounded-full shadow-2xs">
                              ยอดเรียกเก็บเพิ่ม: +฿{extraPaidItemsTotal.toLocaleString()}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {extraPaidItems.map(item => {
                              const itemTotal = (Number(item.price) || 0) * (Number(item.qty) || 1);
                              const icon = item.type === 'service' ? '⚡' : item.type === 'product' ? '🛍️' : '🎫';
                              return (
                                <div key={item.id} className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-pink-200 text-xs font-bold text-slate-800 shadow-2xs">
                                  <span className="text-sm">{icon}</span>
                                  <div className="min-w-0 max-w-[170px]">
                                    <div className="truncate text-slate-800 leading-tight">{item.name}</div>
                                    <div className="text-[10px] text-pink-600 font-extrabold">฿{itemTotal.toLocaleString()} {item.qty > 1 ? `(@฿${Number(item.price).toLocaleString()})` : ''}</div>
                                  </div>
                                  <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 ml-1">
                                    <button 
                                      type="button" 
                                      onClick={() => updateCartQty(item.id, item.type, -1)}
                                      className="w-5 h-5 flex items-center justify-center rounded bg-white hover:bg-slate-200 text-slate-700 font-black text-xs"
                                    >
                                      -
                                    </button>
                                    <span className="w-4 text-center text-xs font-black text-slate-800">{item.qty}</span>
                                    <button 
                                      type="button" 
                                      onClick={() => updateCartQty(item.id, item.type, 1)}
                                      className="w-5 h-5 flex items-center justify-center rounded bg-white hover:bg-slate-200 text-slate-700 font-black text-xs"
                                    >
                                      +
                                    </button>
                                  </div>
                                  <button 
                                    type="button" 
                                    onClick={() => removeFromCart(item.id, item.type)}
                                    className="text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 ml-0.5"
                                    title="ลบรายการนี้"
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Category Filter Pills */}
                      <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar text-[11px] font-bold">
                        {courseSpecificItems.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSingleCourseTabModal('course')}
                            className={`px-3 py-1.5 rounded-xl shrink-0 transition-all flex items-center gap-1.5 ${
                              singleCourseTabModal === 'course' 
                                ? 'bg-teal-600 text-white shadow-xs' 
                                : 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200/60'
                            }`}
                          >
                            🎯 ในคอร์สลูกค้า ({courseSpecificItems.length})
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSingleCourseTabModal('machine')}
                          className={`px-3 py-1.5 rounded-xl shrink-0 transition-all flex items-center gap-1.5 ${
                            singleCourseTabModal === 'machine' 
                              ? 'bg-pink-600 text-white shadow-xs' 
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          ⚡ ลงเครื่อง (12 เครื่อง)
                        </button>
                        <button
                          type="button"
                          onClick={() => setSingleCourseTabModal('renew')}
                          className={`px-3 py-1.5 rounded-xl shrink-0 transition-all flex items-center gap-1.5 ${
                            singleCourseTabModal === 'renew' 
                              ? 'bg-amber-500 text-white shadow-xs' 
                              : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
                          }`}
                        >
                          <RefreshCw size={12} /> ต่อคอสเดิม ({customerAllCourses.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSingleCourseTabModal('buy_course')}
                          className={`px-3 py-1.5 rounded-xl shrink-0 transition-all flex items-center gap-1.5 ${
                            singleCourseTabModal === 'buy_course' 
                              ? 'bg-indigo-600 text-white shadow-xs' 
                              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/60'
                          }`}
                        >
                          <Ticket size={12} /> ซื้อคอสเพิ่ม ({masterCourses.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSingleCourseTabModal('products')}
                          className={`px-3 py-1.5 rounded-xl shrink-0 transition-all flex items-center gap-1.5 ${
                            singleCourseTabModal === 'products' 
                              ? 'bg-emerald-600 text-white shadow-xs' 
                              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
                          }`}
                        >
                          <Package size={12} /> ซื้อสินค้า ({products.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSingleCourseTabModal('basic')}
                          className={`px-3 py-1.5 rounded-xl shrink-0 transition-all flex items-center gap-1.5 ${
                            singleCourseTabModal === 'basic' 
                              ? 'bg-cyan-600 text-white shadow-xs' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          💆 บริการพื้นฐาน
                        </button>
                        <button
                          type="button"
                          onClick={() => setSingleCourseTabModal('all')}
                          className={`px-3 py-1.5 rounded-xl shrink-0 transition-all flex items-center gap-1.5 ${
                            singleCourseTabModal === 'all' 
                              ? 'bg-slate-800 text-white shadow-xs' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          📋 ค้นหาทั้งหมด
                        </button>
                      </div>

                      {/* Section Content based on selected tab / search */}
                      {modalServiceSearch.trim() !== '' ? (
                        <div className="space-y-2 max-h-60 overflow-y-auto p-1 border border-slate-100 rounded-2xl">
                          <div className="text-[10px] font-bold text-slate-400 px-1">ผลการค้นหาสำหรับ "{modalServiceSearch}":</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {(() => {
                              const s = modalServiceSearch.toLowerCase().trim();
                              const matchedMachines = MACHINE_TREATMENT_ADDONS.filter(m => m.name.toLowerCase().includes(s));
                              const matchedBasic = STANDARD_FACIAL_SERVICES.filter(m => m.name.toLowerCase().includes(s));
                              const matchedCourses = (masterCourses || []).filter(mc => {
                                const name = String(getFuzzyKey(mc, ["ชื่อคอส", "col_4"]) || mc.name || '').toLowerCase();
                                const code = String(getFuzzyKey(mc, ["รหัสคอส", "col_1", "รหัส"]) || mc.code || '').toLowerCase();
                                return name.includes(s) || code.includes(s);
                              });
                              const matchedProds = (products || []).filter(p => {
                                const name = String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2"]) || p.name || '').toLowerCase();
                                const code = String(getFuzzyKey(p, ["รหัสสินค้า", "col_1"]) || p.code || '').toLowerCase();
                                return name.includes(s) || code.includes(s);
                              });

                              if (matchedMachines.length === 0 && matchedBasic.length === 0 && matchedCourses.length === 0 && matchedProds.length === 0) {
                                return (
                                  <div className="col-span-2 p-6 text-center text-xs text-slate-400">
                                    ไม่พบรายการที่ตรงกับคำค้นหา
                                  </div>
                                );
                              }

                              return (
                                <>
                                  {/* Machines in search */}
                                  {matchedMachines.map(addon => {
                                    const isSelected = isServiceSelected(addon.name);
                                    const cartPaidItem = cart.find(i => (i.id === `addon_${addon.id}` || i.id === addon.id) && i.type === 'service');
                                    const priceNum = Number(addon.price) || 0;
                                    return (
                                      <div key={addon.id} className="p-2 rounded-xl border border-pink-200 bg-white shadow-2xs flex items-center justify-between gap-2">
                                        <div 
                                          className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                                          onClick={() => toggleServiceName(addon.name, addon)}
                                        >
                                          <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 ${isSelected ? 'bg-pink-600 text-white' : 'border border-slate-300'}`}>
                                            {isSelected && <Check size={10} strokeWidth={3} />}
                                          </div>
                                          <div className="truncate">
                                            <div className="text-xs font-bold text-slate-800 truncate">⚡ {addon.name}</div>
                                            <div className="text-[10px] text-slate-400">ลงเครื่อง ฿{priceNum}</div>
                                          </div>
                                        </div>
                                        {cartPaidItem ? (
                                          <span className="text-[10px] font-bold text-pink-700 bg-pink-50 px-2 py-0.5 rounded-md border border-pink-200 shrink-0">
                                            ในบิล x{cartPaidItem.qty}
                                          </span>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              addToCart({ id: `addon_${addon.id}`, name: addon.name, price: priceNum, originalPrice: priceNum }, 'service');
                                              if (!isSelected) toggleServiceName(addon.name, addon);
                                              showToast(`เพิ่ม "${addon.name}" (+฿${priceNum}) ลงในบิลแล้ว`, 'success');
                                            }}
                                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-pink-50 hover:bg-pink-600 hover:text-white text-pink-700 border border-pink-200 shrink-0 shadow-2xs"
                                          >
                                            + ซื้อเพิ่ม ฿{priceNum}
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}

                                  {/* Courses in search */}
                                  {matchedCourses.slice(0, 10).map(mc => {
                                    const mcName = String(getFuzzyKey(mc, ["ชื่อคอส", "col_4"]) || mc.name || '');
                                    const mcPrice = parseNumber(getFuzzyKey(mc, ["ราคา", "col_5", "ราคาขาย"])) || 0;
                                    const hasOptions = Array.isArray(mc.promoOptions) && mc.promoOptions.length > 0;
                                    return (
                                      <div key={mc.id} className="p-2 rounded-xl border border-indigo-200 bg-white shadow-2xs flex items-center justify-between gap-2">
                                        <div className="truncate flex-1 min-w-0">
                                          <div className="text-xs font-bold text-slate-800 truncate">🎫 {mcName}</div>
                                          <div className="text-[10px] text-indigo-700 font-bold">฿{mcPrice.toLocaleString()}</div>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (hasOptions) {
                                              setSelectedCourseForPromoModal(mc);
                                            } else {
                                              addToCart(mc, 'course');
                                              showToast(`เพิ่มคอร์ส "${mcName}" ลงในบิลแล้ว`, 'success');
                                            }
                                          }}
                                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200 shrink-0 shadow-2xs"
                                        >
                                          + ซื้อคอร์ส
                                        </button>
                                      </div>
                                    );
                                  })}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      ) : singleCourseTabModal === 'renew' ? (
                        <div className="p-3 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10 rounded-2xl border border-amber-200 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                              <RefreshCw size={14} className="text-amber-600" /> คอร์สเดิมของลูกค้า ({customerAllCourses.length} รายการ):
                            </span>
                            <span className="text-[10px] text-amber-700 font-medium">
                              กดต่อคอร์สเพื่อเพิ่มลงบิลทันที
                            </span>
                          </div>

                          {customerAllCourses.length === 0 ? (
                            <div className="p-6 text-center bg-white rounded-xl border border-amber-100 text-xs text-slate-500">
                              ยังไม่มีประวัติคอร์สเดิมของลูกค้ารายนี้ในระบบ<br />
                              <span className="text-slate-400 text-[11px]">สามารถเลือกซื้อคอร์สใหม่ได้ที่แท็บ "🎫 ซื้อคอสเพิ่ม"</span>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-0.5">
                              {customerAllCourses.map((c) => {
                                const cName = String(getFuzzyKey(c, ["ชื่อคอส", "ชื่อคอร์ส", "col_8", "col_4"]) || c.name || '').replace(/เบิกใช้:\s*/g, '');
                                const cNo = String(getFuzzyKey(c, ["เลขที่ใบคอส", "col_2"]) || '');
                                const remainQty = Number(c.computedRemainQty ?? 0);
                                const totalQty = Number(getFuzzyKey(c, ["จำนวนครั้ง", "col_7", "col_6"]) || 0);
                                const cPrice = parseNumber(getFuzzyKey(c, ["ราคา", "col_5", "ราคาขาย"])) || 0;
                                
                                const matchedMaster = masterCourses.find(mc => {
                                  const mcName = String(getFuzzyKey(mc, ["ชื่อคอส", "col_4"]) || mc.name || '').trim().toLowerCase();
                                  const cleanCName = cName.trim().toLowerCase();
                                  return mcName && cleanCName && (mcName === cleanCName || mcName.includes(cleanCName) || cleanCName.includes(mcName));
                                });

                                const cartRenewItem = cart.find(i => (i.id === `renew_${c.id}` || i.id === c.id || (matchedMaster && (i.courseId === matchedMaster.id || i.id === matchedMaster.id))) && i.type === 'course');

                                return (
                                  <div key={c.id} className="p-3 bg-white rounded-xl border border-amber-200/80 shadow-2xs flex flex-col justify-between gap-2 hover:border-amber-300 transition-all">
                                    <div>
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="font-bold text-slate-800 text-xs leading-tight">{cName}</div>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                                          remainQty > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
                                        }`}>
                                          {remainQty > 0 ? `เหลือ ${remainQty}/${totalQty} ครั้ง` : 'หมดแล้ว'}
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                                        <span>เลขที่: {cNo || c.id}</span>
                                        <span>฿{cPrice.toLocaleString()}</span>
                                      </div>
                                    </div>
                                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-end">
                                      {cartRenewItem ? (
                                        <div className="flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                                          <Check size={12} className="text-amber-600" /> อยู่ในบิลแล้ว ({cartRenewItem.qty} คอร์ส)
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (matchedMaster && Array.isArray(matchedMaster.promoOptions) && matchedMaster.promoOptions.length > 0) {
                                              setSelectedCourseForPromoModal(matchedMaster);
                                            } else if (matchedMaster) {
                                              addToCart(matchedMaster, 'course');
                                              showToast(`เพิ่มต่อคอร์ส "${cName}" ลงในบิลแล้ว`, 'success');
                                            } else {
                                              addToCart({
                                                id: `renew_${c.id || Date.now()}`,
                                                name: `ต่อคอร์ส: ${cName}`,
                                                "ชื่อคอส": cName,
                                                "col_4": cName,
                                                "ราคา": cPrice,
                                                "col_5": cPrice,
                                                "จำนวนครั้ง": totalQty || 1,
                                                "col_7": totalQty || 1,
                                              }, 'course');
                                              showToast(`เพิ่มต่อคอร์ส "${cName}" ลงในบิลแล้ว`, 'success');
                                            }
                                          }}
                                          className="w-full py-1.5 px-2.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-xs flex items-center justify-center gap-1 active:scale-95 transition-all"
                                        >
                                          <RefreshCw size={12} /> ต่อคอร์สเดิม (฿{cPrice.toLocaleString()})
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : singleCourseTabModal === 'buy_course' ? (
                        <div className="p-3 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl border border-indigo-200 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                              <Ticket size={14} className="text-indigo-600" /> คอร์ส & โปรโมชั่น ({filteredModalMasterCourses.length} รายการ):
                            </span>
                            <span className="text-[10px] text-indigo-700 font-bold bg-white px-2 py-0.5 rounded-full border border-indigo-200 shadow-2xs">
                              แตะรูปโปรเพื่อดูตัวเลือกแพ็กเกจ หรือเพิ่มลงบิล
                            </span>
                          </div>

                          {/* ค้นหาชื่อคอร์ส หรือโปรโมชั่น */}
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500" size={14} />
                            <input 
                              type="text"
                              placeholder="ค้นหาชื่อคอร์ส โปรโมชั่น หรือรหัสคอร์ส..."
                              value={modalCourseSearch}
                              onChange={(e) => setModalCourseSearch(e.target.value)}
                              className="w-full pl-9 pr-8 py-2 text-xs border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-2xs font-medium"
                            />
                            {modalCourseSearch && (
                              <button 
                                type="button"
                                onClick={() => setModalCourseSearch('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>

                          {/* แสดงรูปโปรโมชั่น 4 คอลัมน์ (grid-cols-2 sm:grid-cols-3 md:grid-cols-4) */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-80 overflow-y-auto p-0.5 hide-scrollbar">
                            {filteredModalMasterCourses.map((mc) => {
                              const mcName = String(getFuzzyKey(mc, ["ชื่อคอส", "col_4"]) || mc.name || '');
                              const mcCode = String(getFuzzyKey(mc, ["รหัสคอส", "col_1", "รหัส"]) || mc.code || '');
                              const mcPrice = parseNumber(getFuzzyKey(mc, ["ราคา", "col_5", "ราคาขาย"])) || 0;
                              const mcSessions = getFuzzyKey(mc, ["จำนวนครั้ง", "col_7", "col_6"]) || 1;
                              const mcFreeGift = mc.freeGift || (mc.promoOptions?.find(o => o.freeGift)?.freeGift) || '';
                              const hasOptions = Array.isArray(mc.promoOptions) && mc.promoOptions.length > 0;
                              const courseImage = getPosCourseImageUrl(mc, wooImagesMap);

                              return (
                                <div 
                                  key={mc.id} 
                                  onClick={() => {
                                    if (hasOptions) {
                                      setSelectedCourseForPromoModal(mc);
                                    } else {
                                      addToCart(mc, 'course');
                                      showToast(`เพิ่มคอร์ส "${mcName}" ลงในบิลแล้ว`, 'success');
                                    }
                                  }}
                                  className="p-2 bg-white rounded-2xl border border-indigo-100 hover:border-indigo-400 shadow-2xs hover:shadow-md cursor-pointer transition-all active:scale-[0.98] flex flex-col justify-between group relative overflow-hidden"
                                >
                                  <div>
                                    {/* Promotional Poster Image */}
                                    <div className="w-full aspect-[4/3] bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-xl mb-1.5 overflow-hidden flex items-center justify-center border border-indigo-100/70 relative group/img">
                                      {courseImage ? (
                                        <img 
                                          src={courseImage} 
                                          alt={mcName}
                                          className="w-full h-full object-contain p-1 transition-transform duration-200 group-hover:scale-105"
                                          loading="lazy"
                                          onError={(e) => {
                                            e.target.style.display = 'none';
                                            const fb = e.target.parentElement?.querySelector('.course-fallback-icon');
                                            if (fb) fb.classList.remove('hidden');
                                          }}
                                        />
                                      ) : null}
                                      <div className={`course-fallback-icon w-full h-full flex flex-col items-center justify-center text-indigo-400 ${courseImage ? 'hidden' : 'flex'}`}>
                                        <Ticket size={24} className="opacity-60" />
                                      </div>

                                      {/* Code badge */}
                                      {mcCode && (
                                        <span className="absolute top-1 left-1 text-[8px] font-mono font-bold bg-slate-900/60 text-white px-1.5 py-0.2 rounded backdrop-blur-xs">
                                          {mcCode}
                                        </span>
                                      )}

                                      {/* Free Gift Badge */}
                                      {mcFreeGift && (
                                        <span className="absolute bottom-1 right-1 text-[8px] font-bold bg-pink-500 text-white px-1.5 py-0.2 rounded-md shadow-xs flex items-center gap-0.5">
                                          🎁 ฟรีของแถม
                                        </span>
                                      )}
                                    </div>

                                    {/* Title */}
                                    <div className="font-bold text-slate-800 text-[11px] leading-snug line-clamp-2 min-h-[28px]" title={mcName}>
                                      {mcName}
                                    </div>

                                    <div className="mt-1 flex items-center justify-between text-[10px]">
                                      <span className="text-slate-500">{mcSessions} ครั้ง</span>
                                      {hasOptions ? (
                                        <span className="bg-indigo-50 text-indigo-700 font-extrabold px-1.5 py-0.2 rounded border border-indigo-100">
                                          {mc.promoOptions.length} แพ็กเกจ
                                        </span>
                                      ) : (
                                        <span className="font-black text-indigo-600 text-xs">฿{mcPrice.toLocaleString()}</span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Action / Select Button */}
                                  <div className="pt-1.5 mt-1 border-t border-slate-100">
                                    {hasOptions ? (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedCourseForPromoModal(mc);
                                        }}
                                        className="w-full py-1 px-1.5 rounded-lg text-[10px] font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-2xs flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                                      >
                                        <Sparkles size={11} />
                                        <span>เลือกแพ็กเกจ ({mc.promoOptions.length})</span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          addToCart(mc, 'course');
                                          showToast(`เพิ่มคอร์ส "${mcName}" ลงในบิลแล้ว`, 'success');
                                        }}
                                        className="w-full py-1 px-1.5 rounded-lg text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-600 hover:text-white border border-indigo-200 shadow-2xs flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                                      >
                                        <ShoppingCart size={11} />
                                        <span>ซื้อคอร์สนี้</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : singleCourseTabModal === 'products' ? (
                        <div className="p-3 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-green-500/10 rounded-2xl border border-emerald-200 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                              <Package size={14} className="text-emerald-600" /> สินค้าหน้าร้าน ({filteredModalProducts.length} รายการ):
                            </span>
                            <span className="text-[10px] text-emerald-700 font-bold bg-white px-2 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                              เลือกสินค้า 4 คอลัมน์พร้อมรูปภาพ
                            </span>
                          </div>

                          {/* ค้นหาชื่อสินค้า หรือรหัสสินค้า */}
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600" size={14} />
                            <input 
                              type="text"
                              placeholder="ค้นหาชื่อสินค้า หรือรหัสสินค้า..."
                              value={modalProductSearch}
                              onChange={(e) => setModalProductSearch(e.target.value)}
                              className="w-full pl-9 pr-8 py-2 text-xs border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-2xs font-medium"
                            />
                            {modalProductSearch && (
                              <button 
                                type="button"
                                onClick={() => setModalProductSearch('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>

                          {/* แสดงรูป 4 คอลัมน์ (grid-cols-2 sm:grid-cols-3 md:grid-cols-4) */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-80 overflow-y-auto p-0.5 hide-scrollbar">
                            {filteredModalProducts.map((prod) => {
                              const pName = String(getFuzzyKey(prod, ["ชื่อสินค้า", "col_2"]) || prod.name || '');
                              const pPrice = computeFinalPrice(prod, isVipCustomer);
                              const branchStock = getBranchStock(prod, globalBranch);
                              const cartProd = cart.find(i => i.id === prod.id && i.type === 'product');
                              const prodImg = getPosProductImageUrl(prod, wooImagesMap);

                              return (
                                <div key={prod.id} className="p-2 bg-white rounded-2xl border border-emerald-100 hover:border-emerald-300 shadow-2xs hover:shadow-xs flex flex-col justify-between transition-all group">
                                  <div>
                                    {/* Product Image */}
                                    <div className="w-full aspect-square bg-slate-50/80 rounded-xl mb-1.5 overflow-hidden flex items-center justify-center border border-slate-100 relative group/img">
                                      {prodImg ? (
                                        <img 
                                          src={prodImg} 
                                          alt={pName} 
                                          className="w-full h-full object-contain p-1 transition-transform duration-200 group-hover:scale-105"
                                          loading="lazy"
                                          onError={(e) => {
                                            e.target.style.display = 'none';
                                            const fb = e.target.parentElement?.querySelector('.prod-fallback-icon');
                                            if (fb) fb.classList.remove('hidden');
                                          }}
                                        />
                                      ) : null}
                                      <div className={`prod-fallback-icon w-full h-full flex flex-col items-center justify-center text-emerald-400 bg-emerald-50/40 ${prodImg ? 'hidden' : 'flex'}`}>
                                        <Package size={24} className="opacity-60" />
                                      </div>

                                      {/* Stock Badge Overlay */}
                                      <span className={`absolute top-1 right-1 text-[9px] font-black px-1.5 py-0.2 rounded-md backdrop-blur-xs ${
                                        branchStock > 0 
                                          ? 'bg-slate-900/60 text-white' 
                                          : 'bg-rose-500/80 text-white'
                                      }`}>
                                        {branchStock > 0 ? `เหลือ ${branchStock}` : 'หมด'}
                                      </span>
                                    </div>

                                    {/* Product Details */}
                                    <div className="font-bold text-slate-800 text-[11px] leading-snug line-clamp-2 min-h-[28px]" title={pName}>
                                      {pName}
                                    </div>
                                    <div className="mt-1 flex items-baseline justify-between">
                                      <span className="font-black text-emerald-700 text-xs">฿{pPrice.toLocaleString()}</span>
                                    </div>
                                  </div>

                                  {/* Cart Button */}
                                  <div className="pt-1.5 mt-1 border-t border-slate-100">
                                    {cartProd ? (
                                      <div className="flex items-center justify-between w-full bg-emerald-50 border border-emerald-200 rounded-lg px-1.5 py-0.5">
                                        <button
                                          type="button"
                                          onClick={() => updateCartQty(cartProd.id, 'product', -1)}
                                          className="w-5 h-5 flex items-center justify-center bg-white rounded text-emerald-800 font-black hover:bg-emerald-200 text-xs shadow-2xs cursor-pointer active:scale-90"
                                        >
                                          -
                                        </button>
                                        <span className="text-center font-black text-xs text-emerald-900 px-1">{cartProd.qty}</span>
                                        <button
                                          type="button"
                                          onClick={() => updateCartQty(cartProd.id, 'product', 1)}
                                          className="w-5 h-5 flex items-center justify-center bg-white rounded text-emerald-800 font-black hover:bg-emerald-200 text-xs shadow-2xs cursor-pointer active:scale-90"
                                        >
                                          +
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          addToCart(prod, 'product');
                                          showToast(`เพิ่ม "${pName}" ลงในบิลแล้ว`, 'success');
                                        }}
                                        className="w-full py-1 px-1.5 rounded-lg text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-200 shadow-2xs flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                                      >
                                        <ShoppingCart size={11} />
                                        <span>เพิ่มลงบิล</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : singleCourseTabModal === 'basic' ? (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-800">
                              บริการพื้นฐาน / ทรีตเมนต์ยอดนิยม:
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {STANDARD_FACIAL_SERVICES.map((srv) => {
                              const isSelected = isServiceSelected(srv.name);
                              return (
                                <button
                                  key={srv.id}
                                  type="button"
                                  onClick={() => toggleServiceName(srv.name, srv)}
                                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all border ${
                                    isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  {isSelected ? `✓ ${srv.name}` : `+ ${srv.name}`}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        /* singleCourseTabModal === 'all' */
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                          <div className="text-xs font-black text-slate-800">📋 บริการและคอร์สทั้งหมด:</div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => setSingleCourseTabModal('machine')}
                              className="p-3 bg-white rounded-xl border border-pink-200 hover:border-pink-400 text-left transition-all group"
                            >
                              <div className="text-base mb-1">⚡</div>
                              <div className="text-xs font-bold text-slate-800 group-hover:text-pink-600">ลงเครื่องรายครั้ง</div>
                              <div className="text-[10px] text-slate-400">12 เครื่องยอดนิยม</div>
                            </button>
                            <button
                              type="button"
                              onClick={() => setSingleCourseTabModal('buy_course')}
                              className="p-3 bg-white rounded-xl border border-indigo-200 hover:border-indigo-400 text-left transition-all group"
                            >
                              <div className="text-base mb-1">🎫</div>
                              <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">ซื้อคอสเพิ่ม</div>
                              <div className="text-[10px] text-slate-400">{masterCourses.length} รายการ</div>
                            </button>
                            <button
                              type="button"
                              onClick={() => setSingleCourseTabModal('products')}
                              className="p-3 bg-white rounded-xl border border-emerald-200 hover:border-emerald-400 text-left transition-all group"
                            >
                              <div className="text-base mb-1">🛍️</div>
                              <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-600">ซื้อสินค้า</div>
                              <div className="text-[10px] text-slate-400">{products.length} รายการ</div>
                            </button>
                            <button
                              type="button"
                              onClick={() => setSingleCourseTabModal('renew')}
                              className="p-3 bg-white rounded-xl border border-amber-200 hover:border-amber-400 text-left transition-all group"
                            >
                              <div className="text-base mb-1">🔄</div>
                              <div className="text-xs font-bold text-slate-800 group-hover:text-amber-600">ต่อคอสเดิม</div>
                              <div className="text-[10px] text-slate-400">{customerAllCourses.length} รายการ</div>
                            </button>
                            <button
                              type="button"
                              onClick={() => setSingleCourseTabModal('basic')}
                              className="p-3 bg-white rounded-xl border border-cyan-200 hover:border-cyan-400 text-left transition-all group"
                            >
                              <div className="text-base mb-1">💆</div>
                              <div className="text-xs font-bold text-slate-800 group-hover:text-cyan-600">บริการพื้นฐาน</div>
                              <div className="text-[10px] text-slate-400">ทรีตเมนต์/มาร์คหน้า</div>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    );
                  })()}
                </div>
              )}

              {/* Order items quick summary on Step 1 for regular checkout */}
              {!isRequisitionMode && !hasUsageOrClaim && (
                <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100 flex items-center justify-between">
                  <div className="text-xs text-indigo-900 font-bold">
                    ยอดรวมคำสั่งซื้อ ({cart.reduce((s, i) => s + (Number(i.qty) || 1), 0)} รายการ)
                  </div>
                  <div className="text-lg font-black text-indigo-600">
                    ฿{total.toLocaleString()}
                  </div>
                </div>
              )}
            </div>

          {/* STEP 2: Payment Screen */}
          <div className={`space-y-3 ${checkoutStep === 2 && !isRequisitionMode ? '' : 'hidden'}`}>
              {/* Top Summary Banner */}
              {hasUsageOrClaim && total <= 0 ? (
                <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white p-2.5 sm:p-3 rounded-2xl flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
                      <Scissors size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black">
                          {hasCourseClaim && !hasCourseUsage ? 'ยืนยันเบิกสินค้าจากคอร์ส' : 'ยืนยันการตัดคอสบริการ'}
                        </span>
                        <span className="bg-white/25 px-1.5 py-0.2 rounded-full text-[9px] font-bold">
                          {cart.filter(i => i.type === 'usage' || i.type === 'claim_item').length} รายการ
                        </span>
                      </div>
                      <p className="text-[10px] text-orange-100">
                        {paymentStaff ? `ผู้ให้บริการ: ${paymentStaff}` : 'ไม่มีค่าใช้จ่ายเพิ่มเติม (฿0)'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-orange-200 block font-bold leading-none">ยอดชำระ</span>
                    <span className="text-lg font-black">฿0</span>
                  </div>
                </div>
              ) : (
                <div className={`text-center bg-gradient-to-b ${total <= 0 ? 'from-orange-50/70 via-amber-50/40 to-slate-50 border-orange-200/80' : 'from-pink-50/70 via-rose-50/40 to-slate-50 border-pink-200/80'} p-3 rounded-2xl border`}>
                  <div className="text-[11px] font-semibold text-slate-500 mb-0.5">ยอดสุทธิที่ต้องชำระ</div>
                  <div className={`text-2xl font-extrabold ${total <= 0 ? 'text-orange-600' : 'text-pink-600'} tracking-tight`}>฿{total.toLocaleString()}</div>
                  <div className="mt-1 flex items-center justify-center gap-2 flex-wrap text-xs">
                    <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-full text-slate-600 font-bold text-[10px]">
                      ช่องทาง: {orderChannel === 'instore' ? 'หน้าร้าน' : orderChannel === 'shopee' ? 'Shopee' : orderChannel === 'chat' ? 'ทางแชท' : 'ทางเว็บ'}
                    </span>
                    {paymentStaff && (
                      <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-full text-slate-700 font-bold truncate max-w-[200px] text-[10px]">
                        ผู้ทำรายการ: {paymentStaff}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Order Channel Selector (Shown ONLY when total > 0) */}
              {hasUsageOrClaim && total > 0 && (
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-700 mb-1.5">ช่องทางการสั่งซื้อ</div>
                    <div className="flex gap-1.5">
                      <button type="button" onClick={() => { setOrderChannel('instore'); setSplitPayment(prev => ({ ...prev, transfer: total - prev.cash - prev.cod - prev.credit })); }} className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all ${orderChannel === 'instore' ? (total <= 0 ? 'bg-orange-500 text-white shadow-md' : 'bg-pink-600 text-white shadow-md') : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>หน้าร้าน</button>
                      <button type="button" onClick={() => { setOrderChannel('shopee'); setSplitPayment({ cash: 0, transfer: 0, cod: total, credit: 0 }); }} className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all ${orderChannel === 'shopee' ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>ช้อปปี้</button>
                      <button type="button" onClick={() => { setOrderChannel('chat'); setSplitPayment({ cash: 0, transfer: 0, cod: total, credit: 0 }); }} className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all ${orderChannel === 'chat' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>ทางแชท</button>
                      <button type="button" onClick={() => { setOrderChannel('web'); setSplitPayment({ cash: 0, transfer: 0, cod: total, credit: 0 }); }} className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all ${orderChannel === 'web' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>ทางเว็บ</button>
                    </div>
                  </div>

                  {orderChannel !== 'instore' && (
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs font-semibold text-slate-700 mb-1 flex justify-between">
                          <span>หมายเลขคำสั่งซื้อ / รหัสอ้างอิง</span>
                        </div>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={activeWcOrderId || ''}
                            onChange={(e) => setActiveWcOrderId(e.target.value)}
                            placeholder="เช่น 240822ABCD..." 
                            className="flex-1 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button 
                            type="button"
                            onClick={() => setScannerTarget('wcOrder')}
                            className="bg-indigo-100 text-indigo-600 px-2.5 py-1.5 rounded-lg font-bold hover:bg-indigo-200 transition-colors flex items-center justify-center shrink-0"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                          </button>
                        </div>
                      </div>
                      
                      {/* Shipping & Tracking Section */}
                      <div>
                          <div className="flex gap-2 mb-2">
                            <div className="flex-1">
                              <label className="block text-[11px] font-bold text-slate-500 mb-1">📮 เลขพัสดุ / ข้อมูลจัดส่ง</label>
                              <div className="flex gap-1.5 flex-wrap sm:flex-nowrap">
                                <input
                                  type="text"
                                  value={posTrackingNo}
                                  onChange={(e) => setPosTrackingNo(e.target.value)}
                                  placeholder="สแกนหรือพิมพ์เลขพัสดุ"
                                  className="flex-1 min-w-0 border border-slate-200 rounded-xl p-2 text-xs font-mono font-bold tracking-wide focus:outline-none focus:border-sky-500 w-full"
                                />
                                <div className="flex gap-1.5 shrink-0">
                                   <button
                                     type="button"
                                     onClick={() => setScannerTarget('trackingNo')}
                                     title="เปิดกล้องสแกนเลขพัสดุ"
                                     className="px-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg flex items-center gap-1 font-bold text-xs shadow-sm active:scale-95 transition-all"
                                   >
                                     <QrCode size={14}/> สแกน
                                   </button>
                                   <button
                                     type="button"
                                     onClick={() => setIshipModal({ isOpen: true })}
                                     title="จัดการที่อยู่ / เรียก iShip"
                                     className="px-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-1 font-bold text-xs shadow-sm active:scale-95 transition-all"
                                   >
                                     <Truck size={14}/> iShip
                                   </button>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Address Summary */}
                          {shippingAddress && (
                            <div className="bg-slate-50 rounded-lg p-2 text-[11px] text-slate-600 flex items-center border border-slate-100">
                              <div className="truncate font-medium">
                                <Truck size={12} className="inline mr-1 text-slate-400" /> {shippingAddress.replace(/\n/g, ' ')}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Staff Selection & Hand Fee */}
              {hasUsageOrClaim && renderStaffSelection(true)}

              {total > 0 ? (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span className="text-slate-700">ระบุยอดเงิน:</span>
                    {total - totalCovered > 0 && <span className="text-red-500 text-xs font-bold">ขาด ฿{(total - totalCovered).toLocaleString()}</span>}
                    {totalPaid - (total - appCreditPaidAmount) > 0 && <span className="text-orange-500 text-xs font-bold">เกิน ฿{(totalPaid - (total - appCreditPaidAmount)).toLocaleString()}</span>}
                    {appCreditPaidAmount > 0 && <span className="text-emerald-600 text-xs font-bold">✓ จ่ายแล้วผ่านแอป ฿{appCreditPaidAmount.toLocaleString()}</span>}
                  </div>

                  {/* 👑 ปุ่มตรวจเช็คฟรี 0 บาท สำหรับเจ้าของ */}
                  {isOwnerDirectUsage && total > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setGlobalDiscount(subtotal - promoDiscount);
                        setSplitPayment({ cash: 0, transfer: 0, cod: 0, credit: 0, omise_promptpay: 0 });
                        showToast('ตั้งค่ายอดชำระเป็น ฿0 (ตรวจเช็คฟรี) เรียบร้อย', 'info');
                      }}
                      className="w-full py-2.5 px-3 bg-purple-50 hover:bg-purple-100 border-2 border-dashed border-purple-300 text-purple-700 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer mb-2"
                    >
                      <Scissors size={15} />
                      <span>👑 สิทธิ์เจ้าของ: ตรวจเช็คฟรี / ใช้คอสไม่คิดเงิน (฿0)</span>
                    </button>
                  )}
                  {isOwnerDirectUsage && total <= 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setGlobalDiscount(0);
                        setSplitPayment({ cash: 0, transfer: subtotal, cod: 0, credit: 0, omise_promptpay: 0 });
                        showToast(`สลับเป็นเรียกเก็บเงินตามราคาคอร์ส (฿${subtotal.toLocaleString()}) แล้ว`, 'info');
                      }}
                      className="w-full py-2.5 px-3 bg-amber-50 hover:bg-amber-100 border-2 border-dashed border-amber-300 text-amber-700 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer mb-2"
                    >
                      <span>💰 สลับกลับเป็นเรียกเก็บเงิน (฿{subtotal.toLocaleString()})</span>
                    </button>
                  )}

                  <button 
                    type="button"
                    onClick={() => {
                      // 🌟 ล็อก "สแกน QR ตัดเครดิต" เมื่อลูกค้าจ่ายเครดิตผ่านแอปไปแล้ว
                      if (appCreditPaidAmount > 0) {
                        showToast('ห้ามตัดเครดิตซ้ำ — ออเดอร์นี้ลูกค้าจ่ายเครดิตไปแล้วในแอป', 'error');
                        return;
                      }
                      setScannerTarget('creditPayment');
                      setSplitPayment({ cash: 0, transfer: 0, cod: 0, credit: total });
                    }}
                    className="w-full bg-[#1a1f2c] text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 hover:bg-black active:scale-95 shadow-md mb-2 transition-all"
                  >
                    <QrCode size={18} className="text-[#12B981]" /> สแกน QR Code เพื่อดึงลูกค้า/ตัดเครดิตจ่าย
                  </button>

                  {/* 🌟 แบนเนอร์กันหักเครดิตซ้ำ — ออเดอร์ที่ลูกค้าจ่ายเครดิตไปแล้วในแอป */}
                  {appCreditPaidAmount > 0 && (
                    <div className="bg-amber-50 border-2 border-amber-300 rounded-xl px-3 py-2.5 mb-2 flex items-start gap-2">
                      <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5"/>
                      <div className="flex-1">
                        <p className="text-xs font-black text-amber-800 leading-snug">
                          ออเดอร์นี้ลูกค้าจ่ายเครดิตไปแล้วในแอป ฿{appCreditPaidAmount.toLocaleString()} — ถือว่าชำระเต็มจำนวนแล้ว
                        </p>
                        <p className="text-[10px] font-bold text-amber-600 mt-0.5">🚫 ห้ามเลือก "ใช้เครดิต" ซ้ำ (ระบบบล็อกไว้ — เครดิตจะถูกหักสองครั้ง) กดชำระเงินได้เลย</p>
                      </div>
                    </div>
                  )}

                  {[
                    { key: 'transfer', label: 'โอนเงิน', icon: Smartphone },
                    { key: 'cash', label: 'เงินสด', icon: Banknote },
                    { key: 'cod', label: 'ค้าง/COD', icon: Clock },
                    ...(customerCreditBalance > 0 || splitPayment.credit > 0 ? [{ key: 'credit', label: 'ใช้เครดิต', icon: CreditCard }] : [])
                  ].map((method) => (
                    <div key={method.key} className={`flex items-center gap-2 ${method.key === 'credit' && appCreditPaidAmount > 0 ? 'opacity-40 pointer-events-none' : ''}`}>
                      <button
                        type="button"
                        onClick={() => {
                          // 🌟 ล็อกช่องเครดิตเมื่อลูกค้าจ่ายผ่านแอปแล้ว
                          if (method.key === 'credit' && appCreditPaidAmount > 0) {
                            showToast('ห้ามใช้เครดิตซ้ำ — ออเดอร์นี้ลูกค้าจ่ายเครดิตไปแล้วในแอป', 'error');
                            return;
                          }
                          // ยอดที่ต้องเก็บจริง = ยอดสุทธิ − ที่จ่ายไปแล้วผ่านแอป
                          const effectiveTotal = Math.max(0, total - (appCreditPaidAmount || 0));
                          const currentOthersTotal = totalPaid - (splitPayment[method.key] || 0);
                          if (currentOthersTotal >= effectiveTotal && effectiveTotal > 0) {
                             const newAmt = effectiveTotal;
                             setSplitPayment({ cash: 0, transfer: 0, cod: 0, credit: 0, [method.key]: newAmt });
                          } else {
                             let fillAmt = Math.max(0, effectiveTotal - currentOthersTotal);
                             if (method.key === 'credit' && fillAmt > customerCreditBalance) fillAmt = customerCreditBalance;
                             setSplitPayment(prev => ({ ...prev, [method.key]: fillAmt }));
                          }
                        }}
                        className="flex-1 flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl hover:bg-indigo-50 transition-colors text-slate-600 focus:outline-none"
                        title="คลิกเพื่อเติมยอดที่เหลือ หรือเปลี่ยนช่องทางชำระ"
                      >
                        <method.icon size={18} className="text-indigo-500" />
                        <span className="text-sm font-medium">{method.label}</span>
                        {method.key === 'credit' && <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-md ml-auto">เหลือ ฿{customerCreditBalance.toLocaleString()}</span>}
                      </button>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-slate-400">฿</span>
                        <input 
                          type="number" 
                          value={splitPayment[method.key] || ''}
                          onChange={(e) => {
                            // 🌟 ห้ามกรอกเครดิตเมื่อลูกค้าจ่ายเครดิตผ่านแอปไปแล้ว
                            if (method.key === 'credit' && appCreditPaidAmount > 0) return;
                            let val = parseNumber(e.target.value);
                            if (method.key === 'credit' && val > customerCreditBalance) val = customerCreditBalance;

                            setSplitPayment(prev => {
                               const nextState = { ...prev, [method.key]: val };
                               // ยอดที่ต้องเก็บจริง = ยอดสุทธิ − จ่ายแล้วผ่านแอป
                               const effectiveTotal = Math.max(0, total - (appCreditPaidAmount || 0));
                               let sum = (nextState.cash || 0) + (nextState.transfer || 0) + (nextState.cod || 0) + (nextState.credit || 0) + (nextState.omise_promptpay || 0);

                               if (sum > effectiveTotal) {
                                   let excess = sum - effectiveTotal;
                                   const otherKeys = ['cash', 'transfer', 'cod', 'credit']
                                       .filter(k => k !== method.key)
                                       .sort((a, b) => (nextState[b] || 0) - (nextState[a] || 0));
                                       
                                   for (let key of otherKeys) {
                                       if (excess <= 0) break;
                                       let currentVal = nextState[key] || 0;
                                       if (currentVal > 0) {
                                           let deduct = Math.min(currentVal, excess);
                                           nextState[key] = currentVal - deduct;
                                           excess -= deduct;
                                       }
                                   }
                               }
                               return nextState;
                            });
                          }}
                          placeholder="0"
                          className={`w-28 text-right bg-slate-50 border rounded-xl px-3 py-2 text-base font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${splitPayment[method.key] > 0 ? 'border-indigo-300 text-indigo-700 bg-indigo-50/30' : 'border-slate-200 text-slate-800'}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Service Proof Summary in Step 2 */}
              {(hasUsageOrClaim || cart.some(i => i.type === 'service')) && (
                <div className="p-3 bg-violet-50/70 border border-violet-200 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-violet-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                      <Camera size={14} />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-violet-950 block truncate">หลักฐานรูปถ่ายและลายเซ็น</span>
                      <span className="text-[10px] text-violet-600 font-medium truncate block">
                        Before: {paymentPhotos.before.length} รูป • After: {paymentPhotos.after.length} รูป • {
                          (custSigRef.current?.dataset?.isSigned === "true" || !!customerSignature) && (staffSigRef.current?.dataset?.isSigned === "true" || !!staffSignature)
                            ? 'เซ็นชื่อครบแล้ว'
                            : 'ยังไม่ได้เซ็น'
                        }
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowServiceProofModal(true)}
                    className="text-[11px] font-bold text-violet-700 bg-white hover:bg-violet-50 border border-violet-300 px-2.5 py-1 rounded-lg shadow-2xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <PenTool size={12} />
                    <span>จัดการรูป / ลายเซ็น</span>
                  </button>
                </div>
              )}
            </div>

          {/* Footer Navigation & Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-100 mt-4">
            {checkoutStep === 1 ? (
              <>
                <button 
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="py-3.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-base transition-colors active:scale-95"
                >
                  ยกเลิก
                </button>
                
                {isRequisitionMode ? (
                  <button 
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    className="flex-1 py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg active:scale-95"
                  >
                    {isProcessing ? 'กำลังประมวลผล...' : <><CheckCircle size={20} /> ยืนยันการเบิกสินค้า (PO)</>}
                  </button>
                ) : total <= 0 && hasUsageOrClaim ? (
                  <button 
                    id="btn-confirm-usage-step1"
                    onClick={() => {
                      let staffToUse = paymentStaff;
                      if (!staffToUse) {
                        staffToUse = posPreselectedStaffName || activeStaff?.name || (availableStaffList.length > 0 ? availableStaffList[0].name : '');
                        if (staffToUse) setPaymentStaff(staffToUse);
                      }
                      if (!staffToUse) return showToast('กรุณาเลือกพนักงานผู้ทำรายการ / ให้บริการ', 'error');
                      const isCustSigned = custSigRef.current?.dataset?.isSigned === "true" || !!customerSignature;
                      const isStaffSigned = staffSigRef.current?.dataset?.isSigned === "true" || !!staffSignature;
                      if (!isCustSigned || !isStaffSigned) {
                        setShowServiceProofModal(true);
                        return showToast('กรุณาบันทึกรูปและให้ลูกค้ากับพนักงานเซ็นชื่อก่อนตัดยอด', 'warning');
                      }
                      handleCheckout();
                    }}
                    disabled={isProcessing}
                    className="flex-1 py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200"
                  >
                    {isProcessing ? (
                      <><span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> กำลังประมวลผล...</>
                    ) : (
                      <>
                        <Scissors size={20} />
                        <span>ยืนยันตัดคอร์ส</span>
                        <span className="bg-white/20 px-2 py-0.5 rounded-lg text-sm font-black">฿0</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={() => {
                       // If payment not initialized yet, default to transfer or total
                       const currentCovered = (Number(splitPayment.cash) || 0) + (Number(splitPayment.transfer) || 0) + (Number(splitPayment.cod) || 0) + (Number(splitPayment.credit) || 0);
                       if (total > 0 && currentCovered === 0) {
                           setSplitPayment({ cash: 0, transfer: total, cod: 0, credit: 0 });
                       } else if (total > 0 && currentCovered < total && splitPayment.transfer > 0) {
                           setSplitPayment(prev => ({ ...prev, transfer: Math.max(0, total - (Number(prev.cash) || 0) - (Number(prev.cod) || 0) - (Number(prev.credit) || 0)) }));
                       }
                       setCheckoutStep(2);
                    }}
                    disabled={isProcessing}
                    className={`flex-1 py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${
                      total <= 0
                        ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200'
                        : 'bg-pink-600 hover:bg-pink-700 text-white shadow-pink-200'
                    }`}
                  >
                    <span>{total <= 0 ? 'ถัดไป: ไปหน้าตัดคอส' : 'ถัดไป: ไปหน้าชำระเงิน'}</span>
                    <span className="bg-white/20 px-2 py-0.5 rounded-lg text-sm font-black">฿{total.toLocaleString()}</span>
                    <ChevronRight size={20} />
                  </button>
                )}
              </>
            ) : (
              <>
                <button 
                  type="button"
                  onClick={() => setCheckoutStep(1)}
                  className="py-3.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-base transition-colors flex items-center justify-center gap-1 active:scale-95"
                >
                  <ChevronLeft size={20} /> ย้อนกลับ
                </button>

                <button 
                  id="btn-confirm-checkout"
                  onClick={() => {
                      let staffToUse = paymentStaff;
                      if (!staffToUse) {
                        staffToUse = posPreselectedStaffName || activeStaff?.name || (availableStaffList.length > 0 ? availableStaffList[0].name : '');
                        if (staffToUse) setPaymentStaff(staffToUse);
                      }
                      if (!staffToUse) return showToast('กรุณาเลือกพนักงานผู้ทำรายการ / ให้บริการ', 'error');
                      if (hasUsageOrClaim) {
                          const isCustSigned = custSigRef.current?.dataset?.isSigned === "true" || !!customerSignature;
                          const isStaffSigned = staffSigRef.current?.dataset?.isSigned === "true" || !!staffSignature;
                          if (!isCustSigned || !isStaffSigned) {
                              setShowServiceProofModal(true);
                              return showToast('กรุณาบันทึกรูปและให้ลูกค้ากับพนักงานเซ็นชื่อก่อนตัดยอด', 'warning');
                          }
                      }
                      if (isOwnerDirectUsage && totalCovered === 0 && total > 0) {
                          setGlobalDiscount(subtotal - promoDiscount);
                      }
                      handleCheckout();
                  }}
                  disabled={isProcessing || (!isRequisitionMode && !isOwnerDirectUsage && total > 0 && totalCovered !== total)}
                  className={`flex-1 py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${
                    isProcessing 
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' 
                      : (total <= 0 
                          ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200' 
                          : 'bg-pink-600 hover:bg-pink-700 text-white shadow-pink-200')
                  }`}
                >
                  {isProcessing ? (
                    <><span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> กำลังประมวลผล...</>
                  ) : total <= 0 ? (
                    <>
                      <Scissors size={20} />
                      <span>{isOwnerDirectUsage ? 'ใช้คอส (เช็คเบื้องต้น)' : 'ตัดคอส'}</span>
                      <span className="bg-white/20 px-2 py-0.5 rounded-lg text-sm font-black">฿0</span>
                    </>
                  ) : (
                    <><CheckCircle size={20} /> {isRequisitionMode ? 'ยืนยันการเบิกสินค้า' : (isOwnerDirectUsage ? 'ยืนยันชำระเงินและใช้คอส (เช็คเบื้องต้น)' : (hasCourseUsage ? 'ยืนยันตัดคอร์สและชำระเงิน' : (hasCourseClaim ? 'ยืนยันการเบิกสินค้า' : 'ยืนยันการชำระเงิน')))}</>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      );
    })()}

    {/* 📸 Dedicated Modal: จัดการรูปถ่ายและลายเซ็นรับบริการ (แยกออกมาอีกโมดัล) */}
    <div className={`fixed inset-0 z-[80] items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm print:hidden ${showServiceProofModal ? 'flex' : 'hidden'}`}>
      <div className="bg-white rounded-3xl p-4 sm:p-6 w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Camera size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-800">
                จัดการรูปถ่ายและลายเซ็นรับบริการ
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                บันทึกภาพ Before/After สองฝั่งชัดเจน พร้อมกรอบรีวิวผลการรักษา
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => setShowServiceProofModal(false)}
            className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4">
          {/* Status & Timer Card */}
          <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 rounded-2xl p-3.5 sm:p-4 text-white shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-xl -mr-8 -mt-8 pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-black tracking-wide">
                    {paymentPhotos.before.length > 0 ? '🟢 เริ่มให้บริการแล้ว (กำลังทำทรีตเมนต์)' : '📸 เช็คอินและถ่ายรูปผลลัพธ์การให้บริการ'}
                  </span>
                  {paymentPhotos.before.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-400 text-emerald-950 shadow-xs animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-950 animate-ping" />
                      {(() => {
                        const firstUsage = cart.find(i => i.type === 'usage');
                        const cInfo = firstUsage ? activeServiceCourses[firstUsage.id] : null;
                        return cInfo?.startTime ? getServiceElapsedStr(cInfo.startTime) : 'กำลังให้บริการ';
                      })()}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-white/80 mt-1 leading-snug">
                  ถ่ายรูป Before ก่อนทำ และรูป After หลังทำ เพื่อดูผลลัพธ์และเก็บเป็นกรอบรีวิวผลการรักษา
                </p>
              </div>

              {/* Summary Pill */}
              <div className="shrink-0 flex items-center gap-1.5 text-[10px] font-bold bg-white/15 px-3 py-1.5 rounded-xl border border-white/20">
                <span>Before: {paymentPhotos.before.length}</span>
                <span>•</span>
                <span>After: {paymentPhotos.after.length}</span>
              </div>
            </div>
          </div>

          {/* 🌟 2-COLUMN PHOTO SECTION: จัดรูปสองฝั่งให้ชัดเป็นระเบียบ (Left: Before, Right: After) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* ฝั่งซ้าย: รูปก่อนทำ (BEFORE) */}
            <div className="bg-slate-50/90 border-2 border-indigo-200/90 rounded-2xl p-3.5 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                      B
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-800">รูปก่อนทำ (Before)</div>
                      <div className="text-[10px] text-indigo-700 font-semibold">
                        {paymentPhotos.before.length > 0 ? `บันทึกแล้ว ${paymentPhotos.before.length} รูป` : 'ควรถ่ายก่อนเริ่มทำบริการ'}
                      </div>
                    </div>
                  </div>

                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    multiple 
                    className="hidden" 
                    id="modal-upload-before" 
                    onChange={handleUploadBeforePhoto} 
                  />
                  <label 
                    htmlFor="modal-upload-before" 
                    className="px-2.5 py-1.5 rounded-xl text-[11px] font-black bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 transition-all"
                  >
                    <Camera size={13} />
                    <span>{paymentPhotos.before.length > 0 ? '+ เพิ่มรูป' : 'ถ่ายรูป Before'}</span>
                  </label>
                </div>

                {/* Before Preview Frame */}
                {paymentPhotos.before.length === 0 ? (
                  <label 
                    htmlFor="modal-upload-before" 
                    className="w-full h-40 rounded-xl border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/40 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600 flex items-center justify-center transition-colors">
                      <Camera size={20} />
                    </div>
                    <span className="text-xs font-bold text-indigo-900">แตะเพื่อถ่ายรูป Before</span>
                    <span className="text-[10px] text-slate-400">ถ่ายรูปผิวก่อนเริ่มทำทรีตเมนต์</span>
                  </label>
                ) : (
                  <div className="space-y-2">
                    {/* Main big preview (first image) */}
                    <div className="relative rounded-xl overflow-hidden border-2 border-indigo-300 shadow-xs bg-slate-900 aspect-4/3 group">
                      <img src={paymentPhotos.before[0]} alt="Before" className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-indigo-950/90 backdrop-blur-xs text-[10px] font-black text-white shadow-xs border border-white/20">
                        BEFORE (ก่อนทำ)
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setPaymentPhotos(p => ({ ...p, before: p.before.filter((_, i) => i !== 0) }))}
                        className="absolute top-2 right-2 w-6 h-6 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center text-xs font-black shadow-md cursor-pointer transition-transform active:scale-90"
                        title="ลบรูป"
                      >
                        ×
                      </button>
                    </div>

                    {/* Additional thumbnails if more than 1 */}
                    {paymentPhotos.before.length > 1 && (
                      <div className="flex gap-1.5 overflow-x-auto pb-1">
                        {paymentPhotos.before.slice(1).map((img, idx) => (
                          <div key={`b-sub-${idx}`} className="relative shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-indigo-200 group">
                            <img src={img} alt="Before" className="w-full h-full object-cover" />
                            <button 
                              type="button" 
                              onClick={() => setPaymentPhotos(p => ({ ...p, before: p.before.filter((_, i) => i !== idx + 1) }))}
                              className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-xs cursor-pointer"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ฝั่งขวา: รูปหลังทำ (AFTER) */}
            <div className="bg-slate-50/90 border-2 border-emerald-200/90 rounded-2xl p-3.5 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                      A
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-800">รูปหลังทำ (After)</div>
                      <div className="text-[10px] text-emerald-700 font-semibold">
                        {paymentPhotos.after.length > 0 ? `บันทึกแล้ว ${paymentPhotos.after.length} รูป` : 'ถ่ายเมื่อทำทรีตเมนต์เสร็จ'}
                      </div>
                    </div>
                  </div>

                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    multiple 
                    className="hidden" 
                    id="modal-upload-after" 
                    onChange={handleUploadAfterPhoto} 
                  />
                  <label 
                    htmlFor="modal-upload-after" 
                    className="px-2.5 py-1.5 rounded-xl text-[11px] font-black bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 transition-all"
                  >
                    <Camera size={13} />
                    <span>{paymentPhotos.after.length > 0 ? '+ เพิ่มรูป' : 'ถ่ายรูป After'}</span>
                  </label>
                </div>

                {/* After Preview Frame */}
                {paymentPhotos.after.length === 0 ? (
                  <label 
                    htmlFor="modal-upload-after" 
                    className="w-full h-40 rounded-xl border-2 border-dashed border-emerald-200 hover:border-emerald-400 bg-white hover:bg-emerald-50/40 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-50 group-hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-colors">
                      <Sparkles size={20} />
                    </div>
                    <span className="text-xs font-bold text-emerald-900">แตะเพื่อถ่ายรูป After</span>
                    <span className="text-[10px] text-slate-400">ถ่ายรูปหลังทำเพื่อเปรียบเทียบผลลัพธ์</span>
                  </label>
                ) : (
                  <div className="space-y-2">
                    {/* Main big preview (first image) */}
                    <div className="relative rounded-xl overflow-hidden border-2 border-emerald-300 shadow-xs bg-slate-900 aspect-4/3 group">
                      <img src={paymentPhotos.after[0]} alt="After" className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-950/90 backdrop-blur-xs text-[10px] font-black text-white shadow-xs border border-white/20">
                        AFTER (หลังทำ)
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setPaymentPhotos(p => ({ ...p, after: p.after.filter((_, i) => i !== 0) }))}
                        className="absolute top-2 right-2 w-6 h-6 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center text-xs font-black shadow-md cursor-pointer transition-transform active:scale-90"
                        title="ลบรูป"
                      >
                        ×
                      </button>
                    </div>

                    {/* Additional thumbnails if more than 1 */}
                    {paymentPhotos.after.length > 1 && (
                      <div className="flex gap-1.5 overflow-x-auto pb-1">
                        {paymentPhotos.after.slice(1).map((img, idx) => (
                          <div key={`a-sub-${idx}`} className="relative shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-emerald-200 group">
                            <img src={img} alt="After" className="w-full h-full object-cover" />
                            <button 
                              type="button" 
                              onClick={() => setPaymentPhotos(p => ({ ...p, after: p.after.filter((_, i) => i !== idx + 1) }))}
                              className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-xs cursor-pointer"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 🌟 3. กรอบรีวิวผลการรักษา (Before & After Clinic Review Frame) */}
          {paymentPhotos.before.length > 0 && paymentPhotos.after.length > 0 && (
            <div className="p-3.5 bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 rounded-2xl text-white shadow-lg border border-purple-400/40 relative overflow-hidden animate-in fade-in duration-300">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-300 animate-spin" />
                  <span className="text-xs font-black tracking-wide text-amber-200">
                    กรอบรีวิวเปรียบเทียบผลลัพธ์ (Before & After Review Card)
                  </span>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/10 text-white/90 border border-white/20">
                  Iris Clinic
                </span>
              </div>

              {/* Side-by-side Review Frame */}
              <div className="grid grid-cols-2 gap-2 relative rounded-xl overflow-hidden p-1 bg-black/40 border border-white/10">
                <div className="relative aspect-4/3 rounded-lg overflow-hidden">
                  <img src={paymentPhotos.before[0]} alt="Review Before" className="w-full h-full object-cover" />
                  <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/80 backdrop-blur-xs text-[9px] font-black tracking-wider text-amber-200 border border-amber-300/30">
                    BEFORE
                  </div>
                </div>

                <div className="relative aspect-4/3 rounded-lg overflow-hidden">
                  <img src={paymentPhotos.after[0]} alt="Review After" className="w-full h-full object-cover" />
                  <div className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded bg-emerald-950/85 backdrop-blur-xs text-[9px] font-black tracking-wider text-emerald-200 border border-emerald-300/30">
                    AFTER
                  </div>
                </div>

                {/* Center comparison badge */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white text-slate-900 font-black text-[10px] flex items-center justify-center shadow-lg border-2 border-purple-500">
                  VS
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px] text-white/70">
                <div className="truncate font-medium">
                  {selectedCustomer?.computedName || selectedCustomer?.name || 'ลูกค้าผู้รับบริการ'} • {String(cart.find(i => i.type === 'usage')?.name || 'คอร์สทรีตเมนต์').replace(/เบิกใช้:\s*/g, '')}
                </div>
                <div className="shrink-0 font-mono">
                  {new Date().toLocaleDateString('th-TH')}
                </div>
              </div>
            </div>
          )}

          {/* Signature Pads */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <PenTool size={14} className="text-violet-600" />
                <span>ลายเซ็นยืนยันรับบริการ & ผู้ให้บริการ:</span>
              </span>
              <span className="text-[10px] text-slate-400">กรุณาเซ็นชื่อเพื่อยืนยันการรับบริการ</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5">
                <SignaturePad 
                  canvasRef={custSigRef} 
                  label="✍️ ลายเซ็นลูกค้า (ผู้รับบริการ)" 
                  height={110}
                  onSigned={(dataUrl) => setCustomerSignature(dataUrl)}
                />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5">
                <SignaturePad 
                  canvasRef={staffSigRef} 
                  label={`✍️ ลายเซ็นพนักงาน${paymentStaff ? ` (${paymentStaff})` : ''}`} 
                  height={110}
                  onSigned={(dataUrl) => setStaffSignature(dataUrl)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
          {paymentPhotos.before.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setShowServiceProofModal(false);
                setShowPaymentModal(false);
                showToast('เช็คอินเริ่มบริการเรียบร้อย! การ์ดจะกระพริบจับเวลา สามารถกลับมาตัดยอดและเลือกพนักงานเมื่อทำเสร็จ', 'info');
              }}
              className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 active:scale-95 transition-all cursor-pointer"
            >
              ✓ เริ่มจับเวลาแล้ว ปิดไปทำบริการก่อน
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => setShowServiceProofModal(false)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              ปิด
            </button>

            <button
              type="button"
              onClick={() => {
                setShowServiceProofModal(false);
                showToast('บันทึกรูปและลายเซ็นเรียบร้อย', 'success');
              }}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-black shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle size={15} />
              <span>เสร็จสิ้น / บันทึก</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* 🔍 Lightbox Modal for Customer Avatar Preview (แตะดูรูปใหญ่ชัดๆ) */}
    {previewCustomerAvatarModal && (
      <div 
        className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer print:hidden"
        onClick={() => setPreviewCustomerAvatarModal(null)}
      >
        <div 
          className="relative max-w-sm sm:max-w-md w-full bg-white rounded-3xl p-4 sm:p-5 shadow-2xl overflow-hidden cursor-default border border-slate-200/80 animate-in zoom-in-95 duration-200"
          onClick={e => e.stopPropagation()}
        >
          {/* Close button */}
          <button 
            type="button"
            onClick={() => setPreviewCustomerAvatarModal(null)} 
            className="absolute top-4 right-4 z-20 w-9 h-9 bg-slate-900/60 hover:bg-slate-900 text-white rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg backdrop-blur-xs"
            title="ปิด"
          >
            <X size={18} />
          </button>

          {/* Large Image Container */}
          <div className="w-full aspect-square max-h-[65vh] rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200 shadow-inner relative">
            <img 
              src={previewCustomerAvatarModal.url} 
              alt={previewCustomerAvatarModal.name || "Customer"} 
              className="w-full h-full object-contain"
            />
          </div>

          {/* Customer info below image */}
          <div className="mt-3.5 text-center">
            <h3 className="font-black text-slate-800 text-base sm:text-lg">
              {previewCustomerAvatarModal.name || "ลูกค้า"}
            </h3>
            {previewCustomerAvatarModal.phone && (
              <p className="text-xs sm:text-sm text-slate-500 font-mono mt-0.5">
                {previewCustomerAvatarModal.phone}
              </p>
            )}
          </div>
        </div>
      </div>
    )}

    {/* Transfer Choice Modal */}
    {showTransferChoiceModal && (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:hidden">
        <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-200">
           <h2 className="text-xl font-black text-slate-800 mb-2 text-center">เลือกรูปแบบการรับเงิน</h2>
           <p className="text-sm text-slate-500 mb-6 text-center">ยอดโอน: ฿{splitPayment.transfer.toLocaleString()}</p>
           
           <div className="flex flex-col gap-3 w-full">
              <button 
                 onClick={() => {
                     setShowTransferChoiceModal(false);
                     handleOmisePromptPayCheckout(splitPayment.transfer);
                 }}
                 className="w-full py-4 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl font-bold text-teal-700 transition-colors flex flex-col items-center justify-center shadow-sm"
              >
                 <div className="flex items-center gap-2 mb-1"><QrCode size={20} /> สร้าง QR พร้อมเพย์ออโต้</div>
                 <span className="text-[11px] text-teal-600 font-normal">ระบบเช็คยอดอัตโนมัติ ใช้งานง่ายที่สุด</span>
              </button>
              
              <button 
                 onClick={() => {
                     setShowTransferChoiceModal(false);
                     handleCheckout();
                 }}
                 className="w-full py-4 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl font-bold text-indigo-700 transition-colors flex flex-col items-center justify-center shadow-sm"
              >
                 <div className="flex items-center gap-2 mb-1"><Smartphone size={20} /> โอนเงินธรรมดา</div>
                 <span className="text-[11px] text-indigo-600 font-normal">แอดมินเช็คสลิปและกดยืนยันด้วยตนเอง</span>
              </button>
           </div>
           
           <button 
             onClick={() => {
                 setShowTransferChoiceModal(false);
             }}
             className="mt-4 w-full py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-600 transition-colors"
           >
             ยกเลิก
           </button>
        </div>
      </div>
    )}

    {/* Omise QR Modal */}
    {showOmiseQrModal && omiseChargeData && (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:hidden">
        <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <QrCode size={20} className="text-teal-600" /> สแกนจ่าย (PromptPay)
            </h2>
            <button 
              onClick={() => {
                setShowOmiseQrModal(false);
                setIsPollingOmise(false);
                setShowPaymentModal(true); // Re-open checkout modal
              }} 
              className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="text-3xl font-black text-teal-600 mb-6">
            ฿{(omiseChargeData.amount / 100).toLocaleString()}
          </div>
          
          <div className="p-4 bg-white border-2 border-teal-100 rounded-2xl shadow-sm mb-6">
            {omiseChargeData.source?.scannable_code?.image?.download_uri ? (
              <img 
                src={omiseChargeData.source.scannable_code.image.download_uri} 
                alt="PromptPay QR Code" 
                className="w-48 h-48 object-contain"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center bg-slate-50 text-slate-400">
                ไม่พบรูปภาพ QR
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-slate-600 font-bold mb-4">
            <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            กำลังรอให้ลูกค้าชำระเงิน...
          </div>
          
          <div className="text-xs text-slate-400 text-center px-4">
            เมื่อลูกค้าสแกนจ่ายสำเร็จ ระบบจะทำรายการให้โดยอัตโนมัติ ไม่ต้องกดยืนยัน
          </div>
        </div>
      </div>
    )}

    {/* Receipt & Success Modal */}
    {receiptData && (
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget) handleQuickNewSale();
        }}
        className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden animate-in fade-in duration-150"
      >
        <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center">
          {/* ปุ่มปิด X มุมขวาบน สำหรับกดปิดเพื่อขายต่อทันที */}
          <button 
            type="button"
            onClick={handleQuickNewSale}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            title="ปิด / ขายบิลถัดไปทันที"
          >
            <X size={18} />
          </button>

          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
            <CheckCircle size={32} strokeWidth={2.5} />
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-1">
            {isRequisitionMode ? 'ทำรายการเบิกสินค้าเรียบร้อย!' : 'ชำระเงินเรียบร้อย!'}
          </h2>
          <p className="text-slate-500 text-xs mb-4 font-mono">
            เลขที่บิล: {receiptData.orderNo} • ฿{(receiptData.total || 0).toLocaleString()}
          </p>
          
          {/* WooCommerce Sync Status */}
          {wooSyncStatus.length > 0 && (
            <div className="w-full mb-4 bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">ซิงค์สต๊อกขึ้นเว็บ (WooCommerce)</div>
              {wooSyncStatus.map((s, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-700 truncate flex-1">{s.name}</span>
                  <span className="text-xs text-slate-400 shrink-0">→ {s.newStock} ชิ้น</span>
                  {s.status === 'pending' && (
                    <span className="flex items-center gap-1 text-xs text-amber-500 font-bold shrink-0">
                      <span className="animate-spin inline-block w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full"></span>
                      กำลังส่ง...
                    </span>
                  )}
                  {s.status === 'success' && (
                    <span className="text-xs text-emerald-600 font-bold shrink-0">✅ สำเร็จ</span>
                  )}
                  {s.status === 'failed' && (
                    <span className="text-xs text-rose-500 font-bold shrink-0">❌ ล้มเหลว</span>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <div className="w-full space-y-2.5">
            {/* 🌟 ปุ่มอันดับ 1 ใหญ่สุดเด่นสุด: พร้อมขายบิลใหม่ทันที (ปุ๊ปปั๊ป ไม่ต้องรอ) */}
            <button
               type="button"
               onClick={handleQuickNewSale}
               className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 active:scale-[0.98] text-white rounded-2xl font-black text-base shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
               <Zap size={20} className="text-amber-300" />
               <span>พร้อมขายบิลใหม่ทันที ⚡</span>
            </button>

            <button 
              type="button"
              onClick={() => {
                setPrintMode('receipt');
                // Skip preview — print directly after one frame for portal to render
                requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                    window.print();
                  });
                });
              }}
              className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 active:scale-[0.98] text-indigo-700 border border-indigo-200/80 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              🖨️ {receiptData?.items.some(i => i.actionType === 'owner_purchase')
                ? 'พิมพ์ใบสั่งซื้อ (A4)'
                : receiptData?.items.some(i => i.actionType === 'branch_requisition')
                  ? 'พิมพ์ใบเบิกสินค้า (A4)'
                  : 'พิมพ์ใบเสร็จ (80mm)'}
            </button>
            {receiptData.orderChannel !== 'instore' && (
              <button 
                type="button"
                onClick={() => {
                  setPrintMode('label');
                  setShowPreviewModal(true);
                }}
                className="w-full py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                🏷️ พิมพ์ใบแปะหน้า (4x6 นิ้ว)
              </button>
            )}
            {posReturnToStaffAfterCheckout && (
              <button 
                type="button"
                onClick={handleQuickNewSale}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>กลับสู่หน้าหลักพนักงาน</span>
              </button>
            )}
            {posReturnToAppointmentsAfterCheckout && (
              <button 
                type="button"
                onClick={handleQuickNewSale}
                className="w-full py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>กลับสู่หน้าจองคิว</span>
              </button>
            )}
          </div>
        </div>
      </div>
    )}

    {/* Dynamic Print Style */}
    <style>
      {`
        @media print {
          @page {
            size: ${receiptData?.items.some(i => i.actionType === 'owner_purchase' || i.actionType === 'branch_requisition') ? 'A4' : printMode === 'receipt' ? '80mm auto' : '100mm 150mm'};
            margin: 0;
          }
          body {
            background: white !important;
          }
          #root {
            display: none !important;
          }
          #pos-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            display: block !important;
          }
          #pos-print-area * {
            visibility: visible !important;
          }
        }
      `}
    </style>

    {/* Print Container via Portal */}
    {printMode && receiptData && createPortal(
      <div id="pos-print-area" className={showPreviewModal ? "fixed inset-0 z-[100] bg-slate-500 overflow-y-auto flex flex-col print:block print:bg-white print:static print:z-auto print:overflow-visible" : ""}>
        
        {showPreviewModal && (
          <div className="sticky top-0 z-[110] bg-white border-b border-slate-300 shadow-md p-4 flex justify-between items-center print:hidden">
            <div className="flex items-center gap-3">
               <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg">
                  <FileText size={24} />
               </div>
               <div>
                 <h2 className="text-xl font-bold text-slate-800">พรีวิวเอกสารก่อนพิมพ์</h2>
                 <p className="text-xs text-slate-500">โปรดตรวจสอบความถูกต้องก่อนสั่งปริ้นท์</p>
               </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 mr-4 cursor-pointer bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors">
                <input 
                  type="checkbox" 
                  checked={autoPrint} 
                  onChange={(e) => setAutoPrint(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-sm font-bold text-slate-700">
                  {autoPrint ? '⚡ พิมพ์อัตโนมัติ (เปิด)' : '📋 พิมพ์อัตโนมัติ (ปิด)'}
                </span>
              </label>
              <button 
                onClick={() => {
                   if (receiptData.orderNo === 'DRAFT') setReceiptData(null);
                   setShowPreviewModal(false);
                   setActiveTab('products');
                }} 
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-colors shadow-sm"
              >
                ยกเลิก
              </button>
              <button 
                onClick={() => {
                   window.print();
                   if (receiptData.orderNo === 'DRAFT') setReceiptData(null);
                   setShowPreviewModal(false);
                   setActiveTab('products');
                }}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-md shadow-indigo-200 transition-colors"
              >
                <FileText size={18} /> สั่งพิมพ์ปกติ
              </button>
              <button 
                onClick={() => {
                   let receiptText = "";
                   receiptText += "         IRIS NATURES\n";
                   receiptText += `      ${globalBranch || "สำนักงานใหญ่"}\n`;
                   receiptText += `   ${receiptData.items.some(i => i.actionType === 'owner_purchase') ? 'ใบสั่งซื้อ (Purchase Order)' : receiptData.items.some(i => i.actionType === 'branch_requisition') ? 'ใบเบิกสินค้า (Requisition)' : 'ใบเสร็จรับเงิน / Receipt'}\n`;
                   receiptText += "--------------------------------\n";
                   receiptText += `บิล: ${receiptData.orderNo}\n`;
                   receiptText += `วันที่: ${new Date(receiptData.createdAt).toLocaleString('th-TH')}\n`;
                   receiptText += `ลูกค้า: ${receiptData.customerName}\n`;
                   receiptText += "--------------------------------\n";
                   receiptText += "รายการ          จำนวน       รวม\n";
                   receiptText += "--------------------------------\n";
                   
                   receiptData.items.forEach(item => {
                       let name = item.name.substring(0, 15);
                       receiptText += `${name.padEnd(16)} ${String(item.qty).padStart(3)} ${(item.price * item.qty).toLocaleString().padStart(9)}\n`;
                   });
                   
                   receiptText += "--------------------------------\n";
                   receiptText += `ยอดรวม (Subtotal):      ${receiptData.subtotal.toLocaleString().padStart(8)}\n`;
                   
                   if (receiptData.promoDiscount > 0) {
                       receiptText += `ส่วนลดโปรโมชั่น:      -${receiptData.promoDiscount.toLocaleString().padStart(8)}\n`;
                   }
                   if (receiptData.globalDiscount > 0) {
                       receiptText += `ส่วนลดเพิ่มเติม:      -${receiptData.globalDiscount.toLocaleString().padStart(8)}\n`;
                   }
                   
                   receiptText += `ยอดสุทธิ (Total):       ${receiptData.total.toLocaleString().padStart(8)}\n`;
                   receiptText += "--------------------------------\n";
                   receiptText += "          ขอบคุณที่ใช้บริการ\n";
                   receiptText += "    Thank you for shopping with us!\n\n\n";

                   const encodedText = encodeURIComponent(receiptText);
                   window.location.href = `intent:${encodedText}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
                   
                   if (receiptData.orderNo === 'DRAFT') setReceiptData(null);
                   setShowPreviewModal(false);
                   setActiveTab('products');
                }}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-md shadow-emerald-200 transition-colors"
              >
                <Printer size={18} /> พิมพ์ด่วน (RawBT)
              </button>
            </div>
          </div>
        )}

        <div className={showPreviewModal ? "flex-1 py-8 flex justify-center print:py-0 print:block" : ""}>
          {printMode === 'receipt' && receiptData.items.some(i => i.actionType === 'owner_purchase' || i.actionType === 'branch_requisition') ? (
          <div className={`${showPreviewModal ? 'block shadow-2xl' : 'hidden'} print:shadow-none print:block w-[210mm] max-w-[210mm] text-black font-sans bg-white m-0 p-8 text-sm leading-tight mx-auto`}>
            <div className="text-center mb-8">
              <h1 className="font-bold text-2xl mb-2">IRIS NATURES</h1>
              <h2 className="font-semibold text-xl mb-1">
                {receiptData.items.some(i => i.actionType === 'owner_purchase') 
                  ? 'ใบสั่งซื้อ (Purchase Order)' 
                  : 'ใบเบิกสินค้า (Requisition Form)'}
              </h2>
            </div>
            
            <div className="flex justify-between mb-8 text-sm">
              <div>
                <p className="font-bold mb-1">ส่งถึง (To):</p>
                <p>IRIS NATURES (สาขาหลัก เฉวง)</p>
              </div>
              <div className="text-right">
                <p><span className="font-bold">เลขที่เอกสาร:</span> {receiptData.orderNo}</p>
                <p><span className="font-bold">วันที่:</span> {new Date(receiptData.createdAt).toLocaleDateString('th-TH')}</p>
                <p><span className="font-bold">สาขาที่ขอเบิก/สั่งซื้อ:</span> {globalBranch || "สำนักงานใหญ่"}</p>
              </div>
            </div>

            {(() => {
              const grouped = {};
              receiptData.items.forEach(item => {
                let brand = "ทั่วไป";
                if (item.originalItem) {
                   brand = String(getFuzzyKey(item.originalItem, ["แบรนด์", "หมวดสินค้า", "col_4"]) || "ทั่วไป");
                }
                if (!grouped[brand]) grouped[brand] = [];
                grouped[brand].push(item);
              });
              
              let totalQty = 0;
              let grandTotal = 0;

              return (
                <div className="space-y-6">
                  {Object.keys(grouped).map(brand => {
                    const items = grouped[brand];
                    const brandTotal = items.reduce((sum, i) => sum + (i.price * i.qty), 0);
                    const brandQty = items.reduce((sum, i) => sum + i.qty, 0);
                    totalQty += brandQty;
                    grandTotal += brandTotal;
                    
                    return (
                      <div key={brand} className="mb-4">
                        <h3 className="font-bold text-lg mb-2 border-b-2 border-slate-800 pb-1">แบรนด์: {brand}</h3>
                        <table className="w-full text-sm mb-2 border-collapse">
                          <thead>
                            <tr className="bg-slate-100">
                              <th className="border border-slate-300 px-2 py-1 text-left w-12">ลำดับ</th>
                              <th className="border border-slate-300 px-2 py-1 text-left">รายการสินค้า</th>
                              <th className="border border-slate-300 px-2 py-1 text-right w-24">ราคาต่อชิ้น</th>
                              <th className="border border-slate-300 px-2 py-1 text-center w-24">จำนวน</th>
                              <th className="border border-slate-300 px-2 py-1 text-right w-32">รวม (บาท)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item, idx) => (
                              <tr key={idx}>
                                <td className="border border-slate-300 px-2 py-1 text-center">{idx + 1}</td>
                                <td className="border border-slate-300 px-2 py-1">{item.name.replace(/^\[.*?\]\s*/, '')}</td>
                                <td className="border border-slate-300 px-2 py-1 text-right">{item.price.toLocaleString()}</td>
                                <td className="border border-slate-300 px-2 py-1 text-center">{item.qty}</td>
                                <td className="border border-slate-300 px-2 py-1 text-right">{(item.price * item.qty).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="font-bold bg-slate-50">
                              <td colSpan="3" className="border border-slate-300 px-2 py-1 text-right">รวมแบรนด์ {brand}</td>
                              <td className="border border-slate-300 px-2 py-1 text-center">{brandQty}</td>
                              <td className="border border-slate-300 px-2 py-1 text-right">{brandTotal.toLocaleString()}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    );
                  })}
                  
                  {/* Grand Total */}
                  <div className="flex justify-end mt-8">
                    <table className="w-64 text-sm border-collapse">
                      <tbody>
                        <tr className="font-bold text-base bg-slate-200">
                          <td className="border border-slate-400 px-4 py-2 text-right">ยอดรวมทั้งสิ้น</td>
                          <td className="border border-slate-400 px-4 py-2 text-right text-indigo-700">{grandTotal.toLocaleString()} บาท</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Signatures */}
                  <div className="flex justify-between mt-24 pt-4">
                    <div className="text-center w-48">
                      <div className="border-b border-black mb-2 pb-6"></div>
                      <p>ผู้เบิก / ผู้สั่งซื้อ</p>
                      <p className="text-xs mt-1">(สาขา {globalBranch || "สำนักงานใหญ่"})</p>
                    </div>
                    <div className="text-center w-48">
                      <div className="border-b border-black mb-2 pb-6"></div>
                      <p>ผู้อนุมัติ / ผู้จ่ายของ</p>
                      <p className="text-xs mt-1">(ศูนย์ใหญ่ / เจ้าของแฟรนไชส์)</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : printMode === 'receipt' ? (
          <div className={`${showPreviewModal ? 'block shadow-2xl' : 'hidden'} print:shadow-none print:block w-[80mm] max-w-full text-black font-sans bg-white m-0 p-2 text-sm leading-tight mx-auto`}>
          
          {/* COURSE USAGE OR CLAIM SLIP */}
          {receiptData.paymentMethodStr === 'ตัดคอร์ส' || receiptData.items.some(i => i.type === 'usage' || i.type === 'claim_item' || i.actionType === 'usage' || (typeof i.name === 'string' && (i.name.includes('ใช้คอร์ส') || i.name.includes('เบิกของแถม')))) ? (
            <>
              <div className="text-center mb-4">
                <h1 className="font-bold text-xl mb-1">IRIS NATURES</h1>
                <p className="text-xs">{globalBranch || "สำนักงานใหญ่"}</p>
                <p className="text-sm font-bold mt-2 bg-slate-200 py-1 rounded">
                  {receiptData.items.some(i => i.type === 'claim_item') ? `สลิปเบิกสินค้า/ของแถมจากคอร์ส (คิว ${receiptData.queueNo})` : `สลิปตัดคอร์สบริการ (คิว ${receiptData.queueNo})`}
                </p>
                <div className="text-left text-xs border-b border-dashed border-black pb-2 mt-2">
                  <div>บิล: {receiptData.orderNo}</div>
                  <div>วันที่: {new Date(receiptData.createdAt).toLocaleString('th-TH')}</div>
                  <div className="font-bold text-sm mt-1">ผู้รับบริการ: {receiptData.customerName}</div>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-bold text-sm mb-1 border-b border-dashed border-black pb-1">
                  {receiptData.items.some(i => i.type === 'claim_item') ? 'รายการเบิกสินค้า / ของแถม' : 'รายการตัดคอร์ส'}
                </h3>
                {receiptData.items.map((item, idx) => (
                  <div key={idx} className="flex flex-col text-sm py-1 border-b border-dashed border-slate-300">
                    <div className="flex justify-between items-start">
                      <span className="pr-2 font-semibold">{item.name.replace('ใช้คอร์ส:', '').replace('[เบิกของแถม]', '').trim()}</span>
                      <span className="font-bold shrink-0">{item.type === 'claim_item' ? `เบิก ${item.qty} ชิ้น` : `หัก ${item.qty} ครั้ง`}</span>
                    </div>
                    {(receiptData.usedServices && receiptData.usedServices.length > 0) ? (
                      <div className="mt-1 pl-2 text-xs text-slate-700 space-y-0.5">
                        {receiptData.usedServices.map((srvName, sIdx) => (
                          <div key={sIdx} className="flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-slate-400 shrink-0"></span>
                            <span>{srvName}</span>
                          </div>
                        ))}
                      </div>
                    ) : (item.usedServices && item.usedServices.length > 0) ? (
                      <div className="mt-1 pl-2 text-xs text-slate-700 space-y-0.5">
                        {item.usedServices.map((srvName, sIdx) => (
                          <div key={sIdx} className="flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-slate-400 shrink-0"></span>
                            <span>{srvName}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-center justify-center mt-6 mb-4">
                 <QRCodeSVG value={receiptData.orderNo} size={100} level={"L"} />
                 <span className="text-[10px] mt-1">{receiptData.orderNo}</span>
              </div>

              <div className="mt-8 pt-4 pb-12 flex justify-between px-2">
                 <div className="text-center flex flex-col items-center">
                    {receiptData.staffSignature ? (
                      <img src={receiptData.staffSignature} alt="staff" className="h-10 mb-1 object-contain" />
                    ) : (
                      <div className="border-b border-black w-24 mx-auto mb-2 h-10"></div>
                    )}
                    <p className="text-xs">ผู้ให้บริการ</p>
                 </div>
                 <div className="text-center flex flex-col items-center">
                    {receiptData.customerSignature ? (
                      <img src={receiptData.customerSignature} alt="customer" className="h-10 mb-1 object-contain" />
                    ) : (
                      <div className="border-b border-black w-24 mx-auto mb-2 h-10"></div>
                    )}
                    <p className="text-xs">ผู้รับบริการ (ลูกค้า)</p>
                 </div>
              </div>

              <div className="text-center text-xs pb-4 border-t border-dashed border-black pt-2 mt-2">
                <p>ขอขอบพระคุณที่ไว้วางใจใช้บริการครับ</p>
              </div>
            </>
          ) : (
            /* STANDARD RECEIPT */
            <>
        <div className="text-center mb-4">
          <h1 className="font-bold text-xl mb-1">IRIS NATURES</h1>
          <p className="text-xs">{globalBranch || "สำนักงานใหญ่"}</p>
          <p className="text-xs mb-2">
            {receiptData.items.some(i => i.actionType === 'owner_purchase') 
              ? 'ใบสั่งซื้อ (Purchase Order)' 
              : receiptData.items.some(i => i.actionType === 'branch_requisition')
                ? 'ใบเบิกสินค้า (Requisition)'
                : `ใบเสร็จรับเงิน (คิว ${receiptData.queueNo})`}
          </p>
          <div className="text-left text-xs border-b border-dashed border-black pb-2 mb-2">
            <div>บิล: {receiptData.orderNo}</div>
            <div>วันที่: {new Date(receiptData.createdAt).toLocaleString('th-TH')}</div>
            <div>ลูกค้า: {receiptData.customerName}</div>
          </div>
        </div>

        <table className="w-full text-xs mb-2">
          <thead>
            <tr className="border-b border-dashed border-black">
              <th className="text-left py-1">รายการ</th>
              <th className="text-center py-1">จำนวน</th>
              <th className="text-right py-1">รวม</th>
            </tr>
          </thead>
          <tbody>
            {receiptData.items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-1 align-top pr-1">{item.name}</td>
                <td className="py-1 text-center align-top">{item.qty}</td>
                <td className="py-1 text-right align-top">{(item.price * item.qty).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-dashed border-black pt-2 mb-4 space-y-1 text-xs">
          <div className="flex justify-between">
            <span>ยอดรวม (Subtotal):</span>
            <span>{receiptData.subtotal.toLocaleString()}</span>
          </div>
          {receiptData.promoDiscount > 0 && (
            <div className="flex justify-between">
              <span>ส่วนลดโปรโมชั่น:</span>
              <span>-{receiptData.promoDiscount.toLocaleString()}</span>
            </div>
          )}
          {receiptData.promoFreeItems && (
            <div className="flex justify-between font-bold border border-dashed border-black px-1 mt-1">
              <span>** ฟรี **</span>
              <span>{receiptData.promoFreeItems.name} x{receiptData.promoFreeItems.qty}</span>
            </div>
          )}
          {receiptData.promoNextTimeDiscount && (
            <div className="flex flex-col items-center justify-center font-bold border border-dashed border-black p-1 my-2">
              <span>*** คูปองส่วนลดครั้งถัดไป ***</span>
              <span>{receiptData.promoNextTimeDiscount}</span>
            </div>
          )}
          {receiptData.globalDiscount > 0 && (
            <div className="flex justify-between">
              <span>ส่วนลดเพิ่มเติม (Manual):</span>
              <span>-{receiptData.globalDiscount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm mt-1">
            <span>ยอดสุทธิ (Total):</span>
            <span>{receiptData.total.toLocaleString()}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-black pt-2 mb-4 text-xs space-y-1">
          <div className="font-bold mb-1">การชำระเงิน:</div>
          {receiptData.splitPayment?.cash > 0 && (
            <div className="flex justify-between">
              <span>เงินสด:</span>
              <span>{receiptData.splitPayment.cash.toLocaleString()}</span>
            </div>
          )}
          {receiptData.splitPayment?.transfer > 0 && (
            <div className="flex justify-between">
              <span>โอนเงิน:</span>
              <span>{receiptData.splitPayment.transfer.toLocaleString()}</span>
            </div>
          )}
          {receiptData.splitPayment?.cod > 0 && (
            <div className="flex justify-between">
              <span>ค้าง/COD:</span>
              <span>{receiptData.splitPayment.cod.toLocaleString()}</span>
            </div>
          )}
          {(!receiptData.splitPayment?.cash && !receiptData.splitPayment?.transfer && !receiptData.splitPayment?.cod) && (
            <div className="flex justify-between">
              <span>{receiptData.paymentMethodStr || 'ชำระเงิน'}</span>
              <span>{receiptData.total?.toLocaleString() || '0'}</span>
            </div>
          )}
          {receiptData.totalSaved > 0 && (
            <div className="flex justify-between mt-2 font-bold text-emerald-600">
              <span>ส่วนลดพิเศษ {receiptData.appliedVoucherCode ? `(${receiptData.appliedVoucherCode})` : ''}:</span>
              <span>{receiptData.totalSaved.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center justify-center mt-4 mb-2">
           { (receiptData.splitPayment?.transfer > 0 || receiptData.splitPayment?.cod > 0 || (!receiptData.splitPayment?.cash && !receiptData.splitPayment?.transfer && !receiptData.splitPayment?.cod && receiptData.total > 0)) && (
             <div className="w-full flex flex-col items-center justify-center mb-4 border-2 border-dashed border-slate-300 p-3 rounded-xl print:border-black print:border-solid">
                <div className="font-bold text-[13px] mb-2 text-center">สแกนเพื่อชำระเงิน (PromptPay)</div>
                <QRCodeSVG 
                   value={generatePayload(
                     globalBranch === 'สาขาละไม' ? '0999999999' : '0815093284', 
                     { amount: receiptData.splitPayment?.transfer > 0 ? receiptData.splitPayment.transfer : (receiptData.splitPayment?.cod > 0 ? receiptData.splitPayment.cod : receiptData.total) }
                   )} 
                   size={120} 
                   level={"L"} 
                />
                <div className="text-[10px] font-bold mt-2 text-center leading-tight">
                   {globalBranch === 'สาขาละไม' ? 'บจก. ไอริสแคร์ (สาขาละไม)' : 'นายอิทธิชัย สังคะโห (สาขาเฉวง)'}
                </div>
                <div className="text-sm font-black mt-1">
                   ยอดชำระ: ฿{(receiptData.splitPayment?.transfer > 0 ? receiptData.splitPayment.transfer : (receiptData.splitPayment?.cod > 0 ? receiptData.splitPayment.cod : receiptData.total)).toLocaleString()}
                </div>
             </div>
           )}

           <QRCodeSVG value={receiptData.orderNo} size={100} level={"L"} />
           <span className="text-[10px] mt-1">{receiptData.orderNo}</span>
        </div>

        <div className="text-center text-xs pb-8 border-t border-dashed border-black pt-4">
          <p className="font-bold text-slate-800">🎁 สิทธิพิเศษ CRM: รับคูปองลด 20% ครั้งถัดไป</p>
          <p className="text-[10px] text-slate-500">สำหรับสั่งซื้อคอร์สด้วยตนเองใน LINE LIFF</p>
          <p className="mt-2">ขอบคุณที่ใช้บริการ</p>
          <p>Thank you for shopping with us!</p>
        </div>
        </>
      )}
      </div>
    ) : null}

        {printMode === 'label' && (() => {
          const labelCode = String(receiptData.trackingNo || receiptData.orderNo || 'IRIS0001').trim();
          const codVal = Number(receiptData.splitPayment?.cod || 0);
          return (
          <div className={`${showPreviewModal ? 'flex shadow-2xl flex-col' : 'hidden'} print:shadow-none print:flex print:flex-col w-[100mm] min-h-[150mm] max-w-full text-black font-sans bg-white m-0 p-3 leading-tight mx-auto border-2 border-black box-border justify-between`}>
            <div>
              {/* Top Header */}
              <div className="border-b-2 border-black pb-2 flex justify-between items-start gap-2">
                <div>
                  <span className="bg-black text-white font-black text-xs px-2 py-0.5 uppercase tracking-wide inline-block">
                    {receiptData.trackingNo?.startsWith('TH') ? 'FLASH EXPRESS' : 'IRIS EXPRESS'}
                  </span>
                  <p className="font-bold text-[11px] mt-1">IRIS NATURES • สาขา{globalBranch || 'สำนักงานใหญ่'}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-xl font-black border-2 border-black px-2.5 py-0.5 inline-block leading-none ${codVal > 0 ? 'bg-black text-white' : 'bg-white text-black'}`}>
                    {codVal > 0 ? 'COD' : 'PAID'}
                  </div>
                  {codVal > 0 ? (
                    <div className="text-xs font-black mt-0.5">เก็บเงิน ฿{codVal.toLocaleString()}</div>
                  ) : (
                    <div className="text-[9px] font-bold mt-0.5">ไม่ต้องเก็บเงิน</div>
                  )}
                </div>
              </div>

              {/* Real 1D Code-128 Barcode */}
              <div className="py-2 px-1 border-b-2 border-black bg-white">
                <div className="text-[9px] font-bold uppercase tracking-wider text-center mb-1">
                  {receiptData.trackingNo ? 'TRACKING NO. (เลขพัสดุ)' : 'ORDER REF. (เลขที่ออเดอร์)'}
                </div>
                <Barcode128
                  value={labelCode}
                  height={50}
                  showText={true}
                  textClassName="text-sm font-mono font-black tracking-[0.18em] mt-1 text-black leading-none"
                />
              </div>

              {/* Sender */}
              <div className="py-2 border-b-2 border-black text-[11px] leading-snug">
                <span className="font-black text-xs underline">ผู้ส่ง (FROM):</span>{' '}
                <span className="font-bold">ศูนย์ความงามไอริส (Iris Natures) ({globalBranch || 'สำนักงานใหญ่'})</span>
                <div className="text-[10px]">โทร: 097-064-3249 • อ.เกาะสมุย จ.สุราษฎร์ธานี 84320</div>
              </div>

              {/* Receiver + Real 2D QR Code */}
              <div className="py-2.5 border-b-2 border-black flex items-start justify-between gap-2.5 min-h-[42mm]">
                <div className="flex-1 min-w-0">
                  <div className="font-black text-xs underline mb-1">ผู้รับ (TO):</div>
                  {receiptData.shippingAddress ? (
                    <div className="text-sm whitespace-pre-wrap leading-snug font-black break-words">
                      {receiptData.shippingAddress}
                    </div>
                  ) : (
                    <div className="text-sm whitespace-pre-wrap leading-snug font-black break-words">
                      {receiptData.customerName}{'\n'}
                      โทร: {receiptData.customerPhone}
                    </div>
                  )}
                </div>
                <div className="shrink-0 flex flex-col items-center border-2 border-black p-1.5 bg-white">
                  <QRCodeSVG value={labelCode} size={80} level="M" includeMargin={false} />
                  <span className="text-[8px] font-mono font-black mt-1 max-w-[80px] truncate">{labelCode}</span>
                </div>
              </div>
            </div>

            {/* Items & Footer */}
            <div className="pt-2 flex flex-col justify-between flex-1">
              <div>
                <div className="flex justify-between text-[10px] font-black mb-1">
                  <span>รายการสินค้า ({receiptData.items?.length || 0} รายการ)</span>
                  <span className="font-mono">#{receiptData.orderNo}</span>
                </div>
                <div className="text-[11px] space-y-0.5 font-bold max-h-[24mm] overflow-hidden">
                  {(receiptData.items || []).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-2">
                      <span className="truncate">{idx + 1}. {item.name}</span>
                      <span className="font-mono font-black shrink-0">x{item.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-2 pt-1.5 border-t border-dashed border-black flex items-end justify-between text-[9px] font-semibold">
                <div>วันที่: {new Date(receiptData.createdAt).toLocaleDateString('th-TH')}</div>
                {receiptData.trackingNo && receiptData.orderNo && receiptData.trackingNo !== receiptData.orderNo && (
                  <div className="w-[36mm]">
                    <Barcode128
                      value={receiptData.orderNo}
                      height={20}
                      showText={true}
                      textClassName="text-[8px] font-mono font-bold tracking-wider mt-0.5 text-black leading-none text-center"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          );
        })()}
        </div>
      </div>,
      document.body
    )}

    {/* Start of Day Modal */}
    {showSodModal && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:hidden">
        <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col">
          <div className="text-center mb-6">
            <div className="bg-amber-100 text-amber-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Banknote size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-800">เปิดกะ (Start of Day)</h2>
            <p className="text-slate-500 text-sm mt-1">กรุณาระบุเงินทอนตั้งต้นในลิ้นชักสำหรับวันนี้</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">เงินทอนตั้งต้น (ยอดยกมา)</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-400 font-bold">฿</span>
                <input 
                  type="number" 
                  value={sodData.floatCash}
                  onChange={(e) => setSodData({...sodData, floatCash: e.target.value})}
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-lg font-black focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">พนักงานผู้เปิดกะ</label>
              <select
                value={sodData.submittedBy}
                onChange={(e) => setSodData({...sodData, submittedBy: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">-- เลือกพนักงาน --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-8 flex gap-3">
            <button 
              onClick={() => onGoBack ? onGoBack() : setShowSodModal(false)}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
            >
              ยกเลิก
            </button>
            <button 
              onClick={handleSodSubmit}
              disabled={isSubmittingSod || !sodData.floatCash || !sodData.submittedBy}
              className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${isSubmittingSod || !sodData.floatCash || !sodData.submittedBy ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200'}`}
            >
              {isSubmittingSod ? (
                <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span> รอสักครู่...</>
              ) : (
                <><CheckCircle size={18} /> เปิดลิ้นชัก</>
              )}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* End of Day Modal */}
    {showEodModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm print:hidden">
        <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800">
              สรุปส่งยอดประจำวัน
            </h2>
            <button onClick={() => setShowEodModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>

          {/* 🌟 เลือกวันที่ส่งยอด (ส่งย้อนหลังได้) */}
          <div className={`flex items-center gap-2 mb-3 p-2 rounded-xl border ${isEodBackdated ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
            <span className={`text-xs font-bold shrink-0 ${isEodBackdated ? 'text-amber-700' : 'text-slate-500'}`}>วันที่ส่งยอด</span>
            <input
              id="eod-date-picker"
              type="date"
              value={posFilterDate}
              max={getLocalYYYYMMDD()}
              onChange={(e) => handleEodDateChange(e.target.value)}
              className="flex-1 min-w-0 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {isEodBackdated ? (
              <button onClick={() => handleEodDateChange(getLocalYYYYMMDD())} className="text-xs font-bold text-indigo-600 hover:underline shrink-0">วันนี้</button>
            ) : null}
          </div>
          {isEodBackdated && (
            <div className="mb-2 text-[11px] font-bold text-amber-700">
              ⏪ ส่งยอดย้อนหลังของวันที่ {new Date(posFilterDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          )}
          {existingEodForDate.length > 0 && (
            <div className="mb-3 p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-700">
              ⚠️ {isEodBackdated ? 'วันที่นี้' : 'วันนี้'}สาขานี้ส่งยอดไปแล้ว {existingEodForDate.length} ครั้ง ถ้าส่งอีกจะเป็นรายงานซ้ำ
            </div>
          )}
          
          {/* Tab Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-4 overflow-x-auto hide-scrollbar">
            <button onClick={() => setEodTab('cash')} className={`flex-1 py-2 px-3 text-xs md:text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${eodTab === 'cash' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
              เงินสด {eodData.actualCash ? `(฿${parseNumber(eodData.actualCash).toLocaleString()})` : ''}
            </button>
            <button onClick={() => setEodTab('transfer')} className={`flex-1 py-2 px-3 text-xs md:text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${eodTab === 'transfer' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
              โอน {eodBreakdown.transfer > 0 ? `(฿${eodBreakdown.transfer.toLocaleString()})` : ''}
            </button>
            {eodBreakdown.credit > 0 && <button onClick={() => setEodTab('credit')} className={`flex-1 py-2 px-3 text-xs md:text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${eodTab === 'credit' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
              เครดิต (฿{eodBreakdown.credit.toLocaleString()})
            </button>}
            {eodBreakdown.cod > 0 && <button onClick={() => setEodTab('cod')} className={`flex-1 py-2 px-3 text-xs md:text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${eodTab === 'cod' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
              ค้าง/Shopee (฿{eodBreakdown.cod.toLocaleString()})
            </button>}
            <button onClick={() => setEodTab('confirm')} className={`flex-1 py-2 px-3 text-xs md:text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${eodTab === 'confirm' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>ยืนยัน</button>
          </div>
          
          <div className="mb-2">
            {eodTab === 'cash' && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">เงินทอนตั้งต้นในลิ้นชัก</label>
                  <input 
                    type="number" 
                    value={eodData.floatCash}
                    onChange={(e) => setEodData({...eodData, floatCash: e.target.value})}
                    placeholder="ระบุจำนวนเงินทอน"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">ยอดส่งเงินสดจริง (จำนวนเงินที่หยิบไปฝากธนาคาร)</label>
                  <input 
                    type="number" 
                    value={eodData.actualCash}
                    onChange={(e) => setEodData({...eodData, actualCash: e.target.value})}
                    placeholder="ระบุจำนวนเงินสด"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {(() => {
                  const expectedCash = eodBreakdown.cash + (parseNumber(eodData.floatCash) || 0);
                  const nonCashSales = (eodBreakdown.transfer || 0) + (eodBreakdown.credit || 0) + (eodBreakdown.cod || 0);
                  
                  // Expected calculations based on perfect system balance
                  const expectedTotalSystemBalance = expectedCash + nonCashSales;
                  const floatCashNum = parseNumber(eodData.floatCash) || 0;
                  const baseFloat = Math.floor(floatCashNum / 100) * 100;
                  const expectedTheoreticalDeposit = Math.floor(expectedTotalSystemBalance / 100) * 100 - baseFloat;
                  const expectedNextDayFloat = expectedTotalSystemBalance - expectedTheoreticalDeposit;
                  const expectedRemitAmount = expectedCash - expectedNextDayFloat;
                  
                  // The user inputs remitted cash into eodData.actualCash
                  const actualRemittedCash = parseNumber(eodData.actualCash) || 0;
                  
                  // If they typed something, diff is actualRemitted - expectedRemitted
                  const diff = eodData.actualCash ? actualRemittedCash - expectedRemitAmount : 0;
                  
                  // Reconstruct actual total cash (assuming nextDayFloat stays the same as expected)
                  const actualTotalCash = eodData.actualCash ? actualRemittedCash + expectedNextDayFloat : expectedCash;
                  
                  const totalSystemBalance = actualTotalCash + nonCashSales;
                  const totalTheoreticalDeposit = Math.floor(totalSystemBalance / 100) * 100 - baseFloat;
                  const nextDayFloat = totalSystemBalance - totalTheoreticalDeposit;
                  const remitAmount = eodData.actualCash ? actualRemittedCash : expectedRemitAmount;

                  if (!eodData.floatCash) return null;
                  return (
                    <div className="space-y-3">
                      {eodData.actualCash && (
                        <div className={`p-3 rounded-lg border shadow-sm ${diff > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : diff < 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                          <div className="flex justify-between font-bold text-xs">
                            <span>สถานะเงินสด</span>
                            <span>{diff > 0 ? 'ยอดเกิน' : diff < 0 ? 'ยอดขาด' : 'ยอดพอดี'}</span>
                          </div>
                          <div className="text-xl font-black text-center my-1">
                            {diff > 0 ? '+' : ''}{diff.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-center font-medium opacity-80">
                            ควรมีในลิ้นชัก: ฿{expectedCash.toLocaleString()}
                          </div>
                        </div>
                      )}

                      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-800">
                         <div className="flex justify-between items-center mb-2">
                           <span className="font-bold text-sm">ยอดส่งเงินสดจริง (หักยอดโอนแล้ว)</span>
                           <span className="text-2xl font-black text-rose-600">฿{remitAmount.toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between items-center text-sm mb-1">
                           <span className="font-medium text-indigo-600">ยอดฝากธนาคารรวม (ปัดเศษหลักร้อย)</span>
                           <span className="font-bold text-indigo-700">฿{totalTheoreticalDeposit.toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between items-center text-sm">
                           <span className="font-medium text-indigo-600">เงินทอนยกไปพรุ่งนี้</span>
                           <span className="font-bold text-indigo-700">฿{nextDayFloat.toLocaleString()}</span>
                         </div>
                      </div>
                    </div>
                  )
                })()}
                <button onClick={() => setEodTab('transfer')} className="w-full py-3 bg-indigo-50 text-indigo-700 rounded-xl font-bold hover:bg-indigo-100 transition-colors">ถัดไป: โอนเงิน</button>
              </div>
            )}
            
            {eodTab === 'transfer' && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <div className="flex justify-between text-base mb-2">
                    <span className="text-blue-700 font-bold">ยอดโอนเงินทั้งหมด</span>
                    <span className="font-black text-blue-700 text-lg">฿{eodBreakdown.transfer.toLocaleString()}</span>
                  </div>
                  {eodBreakdown.transferDetails?.length > 0 ? (
                    <div className="max-h-48 overflow-y-auto space-y-1.5 mt-4 pt-4 border-t border-blue-200 custom-scrollbar pr-2">
                      {eodBreakdown.transferDetails.map((t, idx) => (
                        <div key={idx} className="flex flex-col text-[11px] bg-emerald-500 border border-emerald-600 p-2 rounded-md shadow-sm">
                          <div className="flex justify-between font-bold text-white mb-1">
                            <span className="truncate mr-2">{t.time} - {t.customer}</span>
                            <span className="shrink-0">฿{t.amount?.toLocaleString()}</span>
                          </div>
                          <div className="text-[10px] text-emerald-50 leading-tight">{t.items}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-blue-400 text-sm mt-4">ไม่มีรายการโอนเงิน</div>
                  )}
                </div>
                {canOwnerEod && (
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 space-y-2">
                    <label className="block text-sm font-bold text-amber-800">{isOwnerRole ? '👑 เพิ่มยอดโอน (เฉพาะเจ้าของ)' : '➕ เพิ่มยอดโอนที่ไม่ได้คีย์ผ่าน POS'}</label>
                    <input
                      id="eod-manual-transfer"
                      type="number"
                      inputMode="decimal"
                      value={eodData.manualTransfer || ''}
                      onChange={(e) => setEodData({ ...eodData, manualTransfer: e.target.value })}
                      placeholder="ระบุยอดโอนที่ไม่ได้คีย์ผ่าน POS"
                      className="w-full bg-white border border-amber-200 rounded-xl px-4 py-2.5 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <input
                      id="eod-manual-transfer-note"
                      type="text"
                      value={eodData.manualTransferNote || ''}
                      onChange={(e) => setEodData({ ...eodData, manualTransferNote: e.target.value })}
                      placeholder="หมายเหตุ (ไม่บังคับ) เช่น โอนค่าคอร์ส คุณ A"
                      className="w-full bg-white border border-amber-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}
                <button onClick={() => setEodTab(eodBreakdown.credit > 0 ? 'credit' : eodBreakdown.cod > 0 ? 'cod' : 'confirm')} className="w-full py-3 bg-indigo-50 text-indigo-700 rounded-xl font-bold hover:bg-indigo-100 transition-colors">ถัดไป</button>
              </div>
            )}

            {eodTab === 'credit' && eodBreakdown.credit > 0 && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                  <div className="flex justify-between text-base">
                    <span className="text-orange-700 font-bold">ยอดใช้เครดิตทั้งหมด</span>
                    <span className="font-black text-orange-700 text-lg">฿{eodBreakdown.credit.toLocaleString()}</span>
                  </div>
                </div>
                <button onClick={() => setEodTab(eodBreakdown.cod > 0 ? 'cod' : 'confirm')} className="w-full py-3 bg-indigo-50 text-indigo-700 rounded-xl font-bold hover:bg-indigo-100 transition-colors">ถัดไป</button>
              </div>
            )}

            {eodTab === 'cod' && eodBreakdown.cod > 0 && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 flex flex-col">
                  <div className="flex justify-between text-base mb-2">
                    <span className="text-rose-700 font-bold">ยอดค้างชำระรวม</span>
                    <span className="font-black text-rose-700 text-lg">฿{eodBreakdown.cod.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-rose-200/60 pt-2 mt-1 space-y-1 text-sm font-semibold text-rose-600/80">
                    {(eodBreakdown.cod - eodBreakdown.online) > 0 && (
                       <div className="flex justify-between">
                         <span>• COD:</span>
                         <span>฿{(eodBreakdown.cod - eodBreakdown.online).toLocaleString()}</span>
                       </div>
                    )}
                    {eodBreakdown.online > 0 && (
                       <div className="flex justify-between">
                         <span>• ช้อปปี้/ออนไลน์:</span>
                         <span>฿{eodBreakdown.online.toLocaleString()}</span>
                       </div>
                    )}
                  </div>
                  
                  {eodBreakdown.pendingDetails && eodBreakdown.pendingDetails.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-rose-200">
                      <div className="text-[10px] font-bold text-rose-500 mb-2">รายการยอดค้าง:</div>
                      <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                        {eodBreakdown.pendingDetails.map((p, idx) => (
                          <div key={idx} className="flex flex-col text-[11px] bg-orange-500 border border-orange-600 p-2 rounded-md shadow-sm">
                            <div className="flex justify-between font-bold text-white mb-1">
                              <span className="truncate mr-2">{p.time} - {p.customer} ({p.channel})</span>
                              <span className="shrink-0">฿{p.amount?.toLocaleString()}</span>
                            </div>
                            <div className="text-[10px] text-orange-50 leading-tight">{p.items}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={() => setEodTab('confirm')} className="w-full py-3 bg-indigo-50 text-indigo-700 rounded-xl font-bold hover:bg-indigo-100 transition-colors">ถัดไป: ยืนยัน</button>
              </div>
            )}

            {eodTab === 'confirm' && (() => {
              const expectedCash = eodBreakdown.cash + (parseNumber(eodData.floatCash) || 0);
              const nonCashSales = (eodBreakdown.transfer || 0) + (eodBreakdown.credit || 0) + (eodBreakdown.cod || 0);
              const expectedTotalSystemBalance = expectedCash + nonCashSales;
              const floatCashNum = parseNumber(eodData.floatCash) || 0;
              const baseFloat = Math.floor(floatCashNum / 100) * 100;
              const expectedTheoreticalDeposit = Math.floor(expectedTotalSystemBalance / 100) * 100 - baseFloat;
              const expectedNextDayFloat = expectedTotalSystemBalance - expectedTheoreticalDeposit;
              const actualRemittedCash = parseNumber(eodData.actualCash) || 0;
              const expectedRemitAmount = expectedCash - expectedNextDayFloat;
              
              const actualTotalCash = eodData.actualCash ? actualRemittedCash + expectedNextDayFloat : expectedCash;
              const totalSystemBalance = actualTotalCash + nonCashSales;
              const totalTheoreticalDeposit = Math.floor(totalSystemBalance / 100) * 100 - baseFloat;
              
              const displayCashAmount = eodData.actualCash ? actualRemittedCash : expectedRemitAmount;

              return (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                {/* Summary Banner */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-md">
                  <h3 className="font-bold text-sm text-indigo-100 mb-3 flex items-center gap-2"><CheckCircle size={16} /> สรุปยอดเตรียมนำฝาก</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-indigo-100">เงินสด:</span>
                      <span className="font-bold">฿{displayCashAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-indigo-100">เงินโอน:</span>
                      <span className="font-bold">฿{(eodBreakdown.transfer || 0).toLocaleString()}</span>
                    </div>
                    {(eodBreakdown.credit > 0 || eodBreakdown.cod > 0) && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-indigo-100">ยอดค้าง (เครดิต/COD):</span>
                        <span className="font-bold text-orange-200">฿{((eodBreakdown.credit || 0) + (eodBreakdown.cod || 0)).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="pt-2 mt-2 border-t border-indigo-400/50 flex justify-between items-center">
                      <span className="font-bold text-base">ยอดนำฝากรวม:</span>
                      <span className="font-black text-xl">฿{totalTheoreticalDeposit.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">รูปสลิป / สรุปยอด (ไม่บังคับ)</label>
                    <div className="text-xs text-slate-500">แนบรูปถ่ายสลิปหรือใบสรุปยอด</div>
                  </div>
                  {!eodData.imageBase64 ? (
                    <label className="flex items-center gap-2 px-3 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-lg cursor-pointer hover:bg-indigo-50 transition-colors shadow-sm active:scale-95">
                      <Camera size={16} />
                      <span className="text-sm font-bold">แนบรูป</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="relative">
                      <img src={eodData.imageBase64} alt="EOD Slip" className="h-14 w-auto rounded-lg border border-slate-200 object-cover shadow-sm" />
                      <button 
                        onClick={() => setEodData({ ...eodData, imageBase64: '' })}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {isOwnerZeroEod && (
                  <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg text-sky-700 text-xs font-bold text-center">
                    {isOwnerRole ? '👑 ไม่มีรายการขายในวันที่เลือก เจ้าของร้านส่งยอด 0 บาทได้เลย ไม่ต้องกรอกยอดเงินสด' : 'ไม่มีรายการขายในวันที่เลือก ส่งยอด 0 บาทได้เลย ไม่ต้องกรอกยอดเงินสด'}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">ผู้ส่งยอด (พนักงาน)</label>
                  <select
                    value={eodData.submittedBy}
                    onChange={(e) => setEodData({...eodData, submittedBy: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- เลือกพนักงาน --</option>
                    {globalRole === 'owner' && <option value="owner">👑 เจ้าของร้าน</option>}
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                  
                  {eodData.submittedBy && eodData.submittedBy !== 'owner' && !isEodBackdated && (
                     <label className="flex items-center gap-2 mt-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={eodData.clockOut} 
                          onChange={(e) => setEodData({...eodData, clockOut: e.target.checked})} 
                          className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-bold text-slate-700">บันทึกเวลาออกงานของฉันด้วยเลย</span>
                     </label>
                  )}
                </div>

                {((eodData.actualCash === '' && !isOwnerZeroEod) || eodData.floatCash === '') && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs font-bold text-center">
                    * กรุณาระบุยอดเงินสดในแถบ "เงินสด" ให้ครบถ้วนก่อนยืนยัน
                  </div>
                )}

                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowEodPreviewA4(true)}
                    className="flex-1 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 bg-teal-500 hover:bg-teal-600 text-white shadow-teal-200"
                  >
                    <FileText size={24} /> พรีวิวรายงาน (A4)
                  </button>
                  <button 
                    onClick={handleEodSubmit}
                    disabled={isSubmittingEod || (eodData.actualCash === '' && !isOwnerZeroEod) || eodData.floatCash === ''}
                    className={`flex-1 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${(isSubmittingEod || (eodData.actualCash === '' && !isOwnerZeroEod) || eodData.floatCash === '') ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'}`}
                  >
                    {isSubmittingEod ? (
                      <><span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> ส่งยอด...</>
                    ) : (
                      <><CheckCircle size={24} /> ยืนยันส่งยอด</>
                    )}
                  </button>
                </div>
              </div>
              );
            })()}
          </div>
        </div>
      </div>
    )}

    {/* EOD A4 Print Preview via Portal */}
    {showEodPreviewA4 && createPortal(
      <div id="pos-print-area" className="fixed inset-0 z-[100] bg-slate-500 overflow-y-auto flex flex-col print:block print:bg-white print:static print:z-auto print:overflow-visible">
        
        <div className="sticky top-0 z-[110] bg-white border-b border-slate-300 shadow-md p-4 flex justify-between items-center print:hidden">
          <div className="flex items-center gap-3">
             <div className="bg-teal-100 text-teal-600 p-2 rounded-lg">
                <FileText size={24} />
             </div>
             <div>
               <h2 className="text-xl font-bold text-slate-800">พรีวิวรายงานสรุปยอด (A4)</h2>
               <p className="text-xs text-slate-500">ตรวจสอบรายงานก่อนสั่งพิมพ์</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowEodPreviewA4(false)} 
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-colors shadow-sm"
            >
              ปิด
            </button>
            <button 
              onClick={handleSaveA4AsImage}
              disabled={isSavingImage}
              className={`px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-md transition-colors ${isSavingImage ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'}`}
            >
              {isSavingImage ? (
                <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span> กำลังบันทึก...</>
              ) : (
                <><CheckCircle size={18} /> บันทึกเป็นรูป</>
              )}
            </button>
            <button 
              onClick={() => window.print()}
              className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-md shadow-teal-200 transition-colors"
            >
              <FileText size={18} /> สั่งพิมพ์ (A4)
            </button>
          </div>
        </div>

        <div className="flex-1 py-8 flex justify-center print:py-0 print:block">
          <div id="eod-a4-content" className="block shadow-2xl print:shadow-none print:block w-[210mm] min-h-[297mm] max-w-[210mm] text-black font-sans bg-white m-0 p-10 text-sm leading-tight mx-auto">
             <div className="text-center mb-8 border-b-2 border-slate-800 pb-4">
               <h1 className="font-bold text-3xl mb-2">รายงานสรุปยอดประจำวัน</h1>
               <h2 className="font-semibold text-lg text-slate-600">สาขา {globalBranch || 'สำนักงานใหญ่'}</h2>
             </div>
             
             <div className="flex justify-between mb-8 text-base">
               <div>
                 <p><span className="font-bold">วันที่:</span> {(() => {
                   const dObj = new Date();
                   if (posFilterDate) {
                     const [yy, mm, dd] = posFilterDate.split('-');
                     dObj.setFullYear(Number(yy), Number(mm) - 1, Number(dd));
                   }
                   return dObj.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
                 })()}</p>
               </div>
             </div>

             <div className="space-y-6">
                <div>
                   <h3 className="font-bold text-lg mb-3 bg-slate-100 p-2 border-l-4 border-slate-800">สรุปยอดขายแยกตามประเภท</h3>
                   <table className="w-full text-base border-collapse border border-slate-300">
                     <tbody>
                       <tr>
                         <td className="border border-slate-300 p-3 w-2/3">ยอดขายสินค้า</td>
                         <td className="border border-slate-300 p-3 text-right font-bold">฿{eodBreakdown.productSalesAmt.toLocaleString()}</td>
                       </tr>
                       <tr>
                         <td className="border border-slate-300 p-3">ยอดขายคอร์ส/บริการ</td>
                         <td className="border border-slate-300 p-3 text-right font-bold">฿{(eodBreakdown.courseSalesAmt + (eodBreakdown.manualSalesAmt || 0)).toLocaleString()}</td>
                       </tr>
                       <tr>
                         <td className="border border-slate-300 p-3">ยอดใช้เครดิต/ตัดคอร์ส</td>
                         <td className="border border-slate-300 p-3 text-right font-bold">฿{eodBreakdown.credit.toLocaleString()}</td>
                       </tr>
                       <tr>
                         <td className="border border-slate-300 p-3">ยอดค้างชำระ / COD</td>
                         <td className="border border-slate-300 p-3 text-right font-bold text-rose-600">฿{eodBreakdown.cod.toLocaleString()}</td>
                       </tr>
                       <tr className="bg-slate-50 font-bold text-lg">
                         <td className="border border-slate-300 p-3 text-right">รวมยอดขายสุทธิทั้งหมด</td>
                         <td className="border border-slate-300 p-3 text-right text-indigo-700">฿{(eodBreakdown.cash + eodBreakdown.transfer + eodBreakdown.credit + eodBreakdown.cod).toLocaleString()}</td>
                       </tr>
                     </tbody>
                   </table>
                </div>

                <div className="mt-6 break-inside-avoid">
                   <h3 className="font-bold text-lg mb-3 bg-slate-100 p-2 border-l-4 border-slate-800">สรุปกระแสเงินสด (Cash Flow)</h3>
                   <table className="w-full text-base border-collapse border border-slate-300">
                     <tbody>
                       <tr>
                         <td className="border border-slate-300 p-3 w-2/3">เงินทอนตั้งต้น (นับตอนเปิดร้าน)</td>
                         <td className="border border-slate-300 p-3 text-right font-bold text-slate-600">฿{(parseNumber(eodData.floatCash) || 0).toLocaleString()}</td>
                       </tr>
                       <tr>
                         <td className="border border-slate-300 p-3">ยอดรับเงินสด (ในระบบ)</td>
                         <td className="border border-slate-300 p-3 text-right font-bold text-emerald-600">+ ฿{eodBreakdown.cash.toLocaleString()}</td>
                       </tr>
                       <tr className="bg-slate-50 font-bold text-lg">
                         <td className="border border-slate-300 p-3 w-2/3">ยอดรวมเงินสดในลิ้นชัก (รวมเงินทอน)</td>
                         <td className="border border-slate-300 p-3 text-right font-bold text-emerald-600">฿{(() => {
                            const expected = eodBreakdown.cash + (parseNumber(eodData.floatCash) || 0);
                            const nonCashTemp = (eodBreakdown.transfer || 0) + (eodBreakdown.credit || 0) + (eodBreakdown.cod || 0);
                            const baseFloatTemp = Math.floor((parseNumber(eodData.floatCash) || 0) / 100) * 100;
                            const expTotalTemp = expected + nonCashTemp;
                            const expDepTemp = Math.floor(expTotalTemp / 100) * 100 - baseFloatTemp;
                            const expFloatTemp = expTotalTemp - expDepTemp;
                            const actualRemitted = parseNumber(eodData.actualCash);
                            const actual = eodData.actualCash ? actualRemitted + expFloatTemp : expected;
                            return actual.toLocaleString();
                         })()}</td>
                       </tr>
                       <tr>
                         <td className="border border-slate-300 p-3">ยอดขายช่องทางอื่น (โอน/เครดิต/COD)</td>
                         <td className="border border-slate-300 p-3 text-right font-bold text-blue-600">฿{((eodBreakdown.transfer || 0) + (eodBreakdown.credit || 0) + (eodBreakdown.cod || 0)).toLocaleString()}</td>
                       </tr>
                       <tr className="bg-slate-50 font-bold text-lg">
                         <td className="border border-slate-300 p-3 text-right">ยอดรวมสุทธิทั้งระบบ</td>
                         <td className="border border-slate-300 p-3 text-right text-indigo-700">฿{(() => {
                            const expected = eodBreakdown.cash + (parseNumber(eodData.floatCash) || 0);
                            const nonCashTemp = (eodBreakdown.transfer || 0) + (eodBreakdown.credit || 0) + (eodBreakdown.cod || 0);
                            const baseFloatTemp = Math.floor((parseNumber(eodData.floatCash) || 0) / 100) * 100;
                            const expTotalTemp = expected + nonCashTemp;
                            const expDepTemp = Math.floor(expTotalTemp / 100) * 100 - baseFloatTemp;
                            const expFloatTemp = expTotalTemp - expDepTemp;
                            const actualRemitted = parseNumber(eodData.actualCash);
                            const actual = eodData.actualCash ? actualRemitted + expFloatTemp : expected;
                            const nonCash = (eodBreakdown.transfer || 0) + (eodBreakdown.credit || 0) + (eodBreakdown.cod || 0);
                            return (actual + nonCash).toLocaleString();
                         })()}</td>
                       </tr>
                       <tr>
                         <td className="border border-slate-300 p-3">ยอดรวมที่ต้องฝากธนาคารทั้งหมด (ปัดเศษหลักร้อย)</td>
                         <td className="border border-slate-300 p-3 text-right font-bold text-slate-700">฿{(() => {
                            const expected = eodBreakdown.cash + (parseNumber(eodData.floatCash) || 0);
                            const nonCashTemp = (eodBreakdown.transfer || 0) + (eodBreakdown.credit || 0) + (eodBreakdown.cod || 0);
                            const baseFloatTemp = Math.floor((parseNumber(eodData.floatCash) || 0) / 100) * 100;
                            const expTotalTemp = expected + nonCashTemp;
                            const expDepTemp = Math.floor(expTotalTemp / 100) * 100 - baseFloatTemp;
                            const expFloatTemp = expTotalTemp - expDepTemp;
                            const actualRemitted = parseNumber(eodData.actualCash);
                            const actual = eodData.actualCash ? actualRemitted + expFloatTemp : expected;
                            const nonCash = (eodBreakdown.transfer || 0) + (eodBreakdown.credit || 0) + (eodBreakdown.cod || 0);
                            const totalSystemBalance = actual + nonCash;
                            const baseFloat = Math.floor((parseNumber(eodData.floatCash) || 0) / 100) * 100;
                            return (Math.floor(totalSystemBalance / 100) * 100 - baseFloat).toLocaleString();
                         })()}</td>
                       </tr>
                       <tr>
                         <td className="border border-slate-300 p-3 text-rose-600">ยอดส่งเงินสดจริง (หักยอดโอน/เครดิต/COD)</td>
                         <td className="border border-slate-300 p-3 text-right font-bold text-rose-600">- ฿{(() => {
                            const expected = eodBreakdown.cash + (parseNumber(eodData.floatCash) || 0);
                            const nonCashTemp = (eodBreakdown.transfer || 0) + (eodBreakdown.credit || 0) + (eodBreakdown.cod || 0);
                            const baseFloatTemp = Math.floor((parseNumber(eodData.floatCash) || 0) / 100) * 100;
                            const expTotalTemp = expected + nonCashTemp;
                            const expDepTemp = Math.floor(expTotalTemp / 100) * 100 - baseFloatTemp;
                            const expFloatTemp = expTotalTemp - expDepTemp;
                            const actualRemitted = parseNumber(eodData.actualCash);
                            const actual = eodData.actualCash ? actualRemitted + expFloatTemp : expected;
                            const nonCash = (eodBreakdown.transfer || 0) + (eodBreakdown.credit || 0) + (eodBreakdown.cod || 0);
                            const totalSystemBalance = actual + nonCash;
                            const baseFloat = Math.floor((parseNumber(eodData.floatCash) || 0) / 100) * 100;
                            const totalTheoreticalDeposit = Math.floor(totalSystemBalance / 100) * 100 - baseFloat;
                            const nextDayFloat = totalSystemBalance - totalTheoreticalDeposit;
                            return (actual - nextDayFloat).toLocaleString();
                         })()}</td>
                       </tr>
                       <tr className="bg-slate-50 font-bold text-lg">
                         <td className="border border-slate-300 p-3 text-right">ยอดเหลือ / เงินทอนยกไปพรุ่งนี้</td>
                         <td className="border border-slate-300 p-3 text-right text-indigo-700">฿{(() => {
                            const expected = eodBreakdown.cash + (parseNumber(eodData.floatCash) || 0);
                            const nonCashTemp = (eodBreakdown.transfer || 0) + (eodBreakdown.credit || 0) + (eodBreakdown.cod || 0);
                            const baseFloatTemp = Math.floor((parseNumber(eodData.floatCash) || 0) / 100) * 100;
                            const expTotalTemp = expected + nonCashTemp;
                            const expDepTemp = Math.floor(expTotalTemp / 100) * 100 - baseFloatTemp;
                            const expFloatTemp = expTotalTemp - expDepTemp;
                            const actualRemitted = parseNumber(eodData.actualCash);
                            const actual = eodData.actualCash ? actualRemitted + expFloatTemp : expected;
                            const nonCash = (eodBreakdown.transfer || 0) + (eodBreakdown.credit || 0) + (eodBreakdown.cod || 0);
                            const totalSystemBalance = actual + nonCash;
                            const baseFloat = Math.floor((parseNumber(eodData.floatCash) || 0) / 100) * 100;
                            const totalTheoreticalDeposit = Math.floor(totalSystemBalance / 100) * 100 - baseFloat;
                            return (totalSystemBalance - totalTheoreticalDeposit).toLocaleString();
                         })()}</td>
                       </tr>
                     </tbody>
                   </table>
                </div>

                {eodBreakdown.transferDetails?.length > 0 && (
                <div className="mt-8 break-inside-avoid">
                   <h3 className="font-bold text-lg mb-3 bg-slate-100 p-2 border-l-4 border-slate-800">รายการโอนเงิน</h3>
                   <table className="w-full text-sm border-collapse border border-slate-300">
                     <thead className="bg-slate-50">
                       <tr>
                         <th className="border border-slate-300 p-2 text-center w-16">ลำดับ</th>
                         <th className="border border-slate-300 p-2 text-center w-24">เวลา</th>
                         <th className="border border-slate-300 p-2 text-left">ลูกค้า</th>
                         <th className="border border-slate-300 p-2 text-right w-32">จำนวนเงิน</th>
                       </tr>
                     </thead>
                     <tbody>
                       {eodBreakdown.transferDetails.map((t, idx) => (
                         <tr key={idx}>
                           <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                           <td className="border border-slate-300 p-2 text-center">{t.time}</td>
                           <td className="border border-slate-300 p-2">{t.customer}</td>
                           <td className="border border-slate-300 p-2 text-right font-bold">฿{t.amount.toLocaleString()}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                </div>
                )}

                {eodBreakdown.allSalesDetails?.length > 0 && (
                <div className="mt-8 break-inside-avoid">
                   <h3 className="font-bold text-lg mb-3 bg-slate-100 p-2 border-l-4 border-slate-800">รายการขาย / ใช้บริการทั้งหมด</h3>
                   <table className="w-full text-xs border-collapse border border-slate-300">
                     <thead className="bg-slate-50">
                       <tr>
                         <th className="border border-slate-300 p-2 text-center w-12">ลำดับ</th>
                         <th className="border border-slate-300 p-2 text-center w-16">เวลา</th>
                         <th className="border border-slate-300 p-2 text-left w-32">ลูกค้า</th>
                         <th className="border border-slate-300 p-2 text-left">รายการ</th>
                         <th className="border border-slate-300 p-2 text-right w-24">ยอดเงิน</th>
                         <th className="border border-slate-300 p-2 text-center w-24">ช่องทาง</th>
                       </tr>
                     </thead>
                     <tbody>
                       {eodBreakdown.allSalesDetails.map((t, idx) => (
                         <tr key={idx}>
                           <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                           <td className="border border-slate-300 p-2 text-center leading-tight">
                             <div className="font-bold">{t.time}</div>
                             <div className="text-[9px] text-slate-500 mt-0.5">{t.orderNo}</div>
                           </td>
                           <td className="border border-slate-300 p-2">{t.customer}</td>
                           <td className="border border-slate-300 p-2">
                             {Array.isArray(t.details) ? (
                               <ul className="list-disc list-inside space-y-0.5">
                                 {t.details.map((item, i) => (
                                   <li key={i} className="text-xs">
                                     {item.name} <span className="text-slate-500 font-semibold ml-1">x{item.qty}</span>
                                   </li>
                                 ))}
                               </ul>
                             ) : (
                               <div className="text-xs">{t.details}</div>
                             )}
                           </td>
                           <td className="border border-slate-300 p-2 text-right font-bold">{t.amount > 0 ? `฿${t.amount.toLocaleString()}` : '-'}</td>
                           <td className="border border-slate-300 p-2 text-center">
                             <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${t.paymentStr === 'ตัดคอร์ส' ? 'bg-fuchsia-100 text-fuchsia-700' : t.paymentStr?.includes('เงินสด') ? 'bg-emerald-100 text-emerald-700' : t.paymentStr?.includes('โอนเงิน') ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                               {t.paymentStr || '-'}
                             </span>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                </div>
                )}
             </div>

             <div className="mt-20 flex justify-between text-center px-10 break-inside-avoid">
                <div>
                   <div className="border-b border-slate-400 w-48 mx-auto mb-2"></div>
                   <p className="font-bold">(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</p>
                   <p className="mt-1 text-slate-600">ผู้สรุปยอด / พนักงาน</p>
                </div>
                <div>
                   <div className="border-b border-slate-400 w-48 mx-auto mb-2"></div>
                   <p className="font-bold">(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</p>
                   <p className="mt-1 text-slate-600">ผู้ตรวจสอบ / ผู้รับเงิน</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    , document.body)}

    {/* ---- Signature Modal ---- */}
    {isPaymentModalOpen && showSignaturePad && (
        <React.Suspense fallback={<div className="fixed inset-0 z-[60] flex items-center justify-center"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div></div>}>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
                <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-slate-700">ลายเซ็นลูกค้า (จำเป็น)</h3>
                        <button onClick={() => setShowSignaturePad(false)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-xl transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-4 space-y-3">
                        <SignaturePad 
                            label="ลายเซ็นลูกค้า"
                            onSigned={(dataUrl) => {
                                setCustomerSignature(dataUrl);
                            }}
                        />
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setShowSignaturePad(false)}
                                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowSignaturePad(false)}
                                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm transition-colors"
                            >
                                บันทึกลายเซ็น
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </React.Suspense>
    )}

    {/* Stock Input Modal */}
    {stockInputModal.isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 relative zoom-in-95 animate-in">
          <button onClick={() => setStockInputModal({ isOpen: false, item: null, inputVal: '' })} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full p-2 transition-colors">
            <X size={20} />
          </button>
          
          <div className="text-center mb-6 mt-2">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package size={32} className="text-rose-500" />
            </div>
            <h3 className="text-xl font-black text-slate-800 leading-tight">{String(getFuzzyKey(stockInputModal.item, ["ชื่อสินค้า", "col_2"]))}</h3>
            <p className="text-sm text-slate-500 mt-1">รหัส: {String(getFuzzyKey(stockInputModal.item, ["รหัส", "col_1"]))}</p>
          </div>
          
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">นับสต๊อกได้จริง (ชิ้น)</label>
            <input 
              type="number"
              min="0"
              autoFocus
              className="w-full text-center text-4xl font-black py-4 bg-slate-50 border-2 border-slate-200 focus:border-rose-400 rounded-2xl outline-none transition-colors"
              value={stockInputModal.inputVal}
              onChange={(e) => setStockInputModal(prev => ({ ...prev, inputVal: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && stockInputModal.inputVal !== '') {
                  const newStock = Number(stockInputModal.inputVal);
                  const oldStock = parseNumber(getBranchStock(stockInputModal.item, normalizeBranchName(globalBranch || 'เฉวง') || 'เฉวง'));
                  setStockAdjustments(prev => {
                    const existing = prev.filter(a => a.id !== stockInputModal.item.id);
                    return [...existing, { 
                      id: stockInputModal.item.id, 
                      name: String(getFuzzyKey(stockInputModal.item, ["ชื่อสินค้า", "col_2"])),
                      oldStock, 
                      newStock, 
                      diff: newStock - oldStock,
                      originalItem: stockInputModal.item
                    }];
                  });
                  setStockInputModal({ isOpen: false, item: null, inputVal: '' });
                }
              }}
            />
          </div>
          
          <button 
            onClick={() => {
              if (stockInputModal.inputVal === '') return;
              const newStock = Number(stockInputModal.inputVal);
              const oldStock = parseNumber(getBranchStock(stockInputModal.item, normalizeBranchName(globalBranch || 'เฉวง') || 'เฉวง'));
              setStockAdjustments(prev => {
                const existing = prev.filter(a => a.id !== stockInputModal.item.id);
                return [...existing, { 
                  id: stockInputModal.item.id, 
                  name: String(getFuzzyKey(stockInputModal.item, ["ชื่อสินค้า", "col_2"])),
                  oldStock, 
                  newStock, 
                  diff: newStock - oldStock,
                  originalItem: stockInputModal.item
                }];
              });
              setStockInputModal({ isOpen: false, item: null, inputVal: '' });
            }}
            disabled={stockInputModal.inputVal === ''}
            className="w-full py-4 bg-rose-500 hover:bg-rose-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-black text-lg shadow-lg shadow-rose-200 transition-all active:scale-95"
          >
            บันทึก
          </button>
        </div>
      </div>
    )}

    {/* Stock Confirm Modal */}
    {isStockConfirmModalOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl relative flex flex-col max-h-[90vh] zoom-in-95 animate-in">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Package className="text-rose-500" /> ยืนยันการปรับปรุงสต๊อก
            </h3>
            <button onClick={() => setIsStockConfirmModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors bg-slate-50 hover:bg-slate-100">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-5 overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-3 font-bold rounded-tl-xl">รายการสินค้า</th>
                  <th className="p-3 font-bold text-center">สต๊อกเดิม</th>
                  <th className="p-3 font-bold text-center">สต๊อกใหม่</th>
                  <th className="p-3 font-bold text-center rounded-tr-xl">ผลต่าง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockAdjustments.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-sm text-slate-800">{item.name}</td>
                    <td className="p-3 text-center text-slate-600 font-medium">{item.oldStock}</td>
                    <td className="p-3 text-center text-rose-600 font-black">{item.newStock}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${item.diff > 0 ? 'bg-emerald-50 text-emerald-600' : item.diff < 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                        {item.diff > 0 ? '+' : ''}{item.diff}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-5 border-t border-slate-100 shrink-0 flex gap-3 pb-safe">
            <button 
              onClick={() => setIsStockConfirmModalOpen(false)}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-colors"
            >
              ยกเลิก
            </button>
            <button 
              onClick={async () => {
                try {
                  const batch = writeBatch(db);
                  
                  for (const adj of stockAdjustments) {
                    const pRef = doc(db, 'products', adj.id);
                    const targetBranch = normalizeBranchName(globalBranch || 'เฉวง') || 'เฉวง';
                    const rawStockByBranch = adj.originalItem?.stock_by_branch || {};
                    const normalizedMap = {};
                    Object.entries(rawStockByBranch).forEach(([k, v]) => {
                      const nk = normalizeBranchName(k) || k;
                      normalizedMap[nk] = (Number(normalizedMap[nk]) || 0) + parseQty(v);
                    });
                    normalizedMap[targetBranch] = adj.newStock;
                    const nextTotal = Object.values(normalizedMap).reduce((sum, v) => sum + (Number(v) || 0), 0);
                    batch.set(pRef, {
                      stock_by_branch: normalizedMap,
                      "จำนวนคงเหลือ": String(nextTotal)
                    }, { merge: true });
                  }
                  
                  await batch.commit();
                  showToast('อัปเดตสต๊อกเรียบร้อยแล้ว', 'success');
                  setStockAdjustments([]);
                  setIsStockConfirmModalOpen(false);
                  setIsStockMode(false);
                } catch(e) {
                  showToast('เกิดข้อผิดพลาดในการอัปเดตสต๊อก', 'error');
                }
              }}
              className="flex-[2] py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black shadow-lg shadow-rose-200 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle size={20} /> ยืนยันการอัปเดตสต๊อก
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Web Orders Modal */}
    {showWebOrdersModal && (
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:hidden">
        <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-sky-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-500 text-white rounded-xl flex items-center justify-center shadow-md">
                <Package size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 leading-tight">ออเดอร์จากเว็บ (WooCommerce)</h2>
                <p className="text-sm text-slate-500">สถานะ: กำลังดำเนินการ (Processing)</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={fetchWebOrdersManual} 
                disabled={isFetchingWebOrders}
                className="flex items-center gap-2 px-4 py-2 bg-white text-sky-600 hover:bg-sky-50 rounded-xl font-bold transition-colors shadow-sm disabled:opacity-50"
              >
                <Clock size={18} className={isFetchingWebOrders ? "animate-spin" : ""} /> 
                {isFetchingWebOrders ? "กำลังดึง..." : "ดึงออเดอร์ล่าสุด"}
              </button>
              <button onClick={() => setShowWebOrdersModal(false)} className="w-10 h-10 flex items-center justify-center bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors shadow-sm">
                <X size={20} />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
            {isFetchingWebOrders && webOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                 <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full mb-4"></div>
                 <p className="font-semibold">กำลังดึงข้อมูลออเดอร์...</p>
              </div>
            ) : webOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                 <Package size={48} className="mb-4 opacity-20" />
                 <p className="font-bold text-lg text-slate-500">ไม่มีออเดอร์ใหม่</p>
                 <p className="text-sm">ระบบจะดึงข้อมูลอัตโนมัติทุกๆ 1 นาที</p>
              </div>
            ) : (
              <div className="space-y-4">
                {webOrders.map(order => {
                  const s = order.shipping || {};
                  const b = order.billing || {};
                  const addrStr = `${s.first_name || b.first_name || ''} ${s.last_name || b.last_name || ''}\n${s.phone || b.phone || ''}\n${s.address_1 || b.address_1 || ''} ${s.address_2 || b.address_2 || ''} ${s.city || b.city || ''} ${s.state || b.state || ''} ${s.postcode || b.postcode || ''}`.trim();
                  
                  return (
                    <div key={order.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-indigo-100 text-indigo-700 font-bold text-xs px-2 py-1 rounded-md">#{order.id}</span>
                            <span className="text-slate-500 text-sm">{new Date(order.date_created).toLocaleString('th-TH')}</span>
                            <span className="bg-emerald-100 text-emerald-700 font-bold text-xs px-2 py-1 rounded-md">{order.payment_method_title || order.payment_method}</span>
                          </div>
                          <h3 className="font-bold text-lg text-slate-800 mb-1">{b.first_name} {b.last_name}</h3>
                          <p className="text-sm text-slate-600 line-clamp-2">{addrStr.replace(/\n/g, ' ')}</p>
                          
                          <div className="mt-4 space-y-1">
                            {order.line_items.map((item, idx) => (
                              <div key={item.id} className="text-sm flex gap-2">
                                <span className="text-slate-400">{idx+1}.</span>
                                <span className="font-semibold text-slate-700 flex-1">{item.name}</span>
                                <span className="text-slate-500">x{item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex flex-col justify-between items-end min-w-[150px] border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-4">
                          <div className="text-right mb-4">
                            <div className="text-xs text-slate-500 font-semibold">ยอดสุทธิ</div>
                            <div className="text-2xl font-black text-indigo-600">฿{parseFloat(order.total).toLocaleString()}</div>
                          </div>
                          
                          <div className="flex flex-col gap-2 w-full">
                            <button
                              onClick={() => {
                                // Import Logic
                                const newCart = [];
                                let missingItems = [];
                                
                                order.line_items.forEach(wItem => {
                                const wName = wItem.name.toLowerCase();
                                const wSku = (wItem.sku || '').toUpperCase();
                                const posProduct = products.find(p => {
                                   const pName = String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2"])).toLowerCase();
                                   const pSku = String(getFuzzyKey(p, ["รหัส", "col_1"])).toUpperCase();
                                   return (wSku && pSku === wSku) || pName.includes(wName) || wName.includes(pName);
                                });
                                
                                if (posProduct) {
                                  const fullPrice = parseNumber(getFuzzyKey(posProduct, ["ราคาขายเต็ม", "col_6"]));
                                  
                                  newCart.push({
                                    id: posProduct.id,
                                    name: String(getFuzzyKey(posProduct, ["ชื่อสินค้า", "col_2"])),
                                    price: parseFloat(wItem.price) || fullPrice,
                                    originalPrice: fullPrice,
                                    qty: wItem.quantity,
                                    type: 'product',
                                    maxQty: parseQty(getFuzzyKey(posProduct, ["จำนวนคงเหลือ", "col_12"])),
                                    originalItem: posProduct,
                                    isManualPrice: true
                                  });
                                } else {
                                  missingItems.push(wItem.name);
                                }
                              });
                              
                              if (missingItems.length > 0) {
                                showToast(`ไม่พบสินค้าในระบบ: ${missingItems.join(', ')} (กรุณาเพิ่มเอง)`, 'error');
                              }
                              
                              setCart(newCart);
                              setOrderChannel('web');
                              setActiveWcOrderId(String(order.id));
                              setShippingAddress(addrStr);
                              
                              const totalAmt = parseFloat(order.total) || 0;
                              const isCod = String(order.payment_method).toLowerCase() === 'cod';
                              setSplitPayment({
                                cash: 0,
                                transfer: isCod ? 0 : totalAmt,
                                cod: isCod ? totalAmt : 0,
                                credit: 0
                              });
                              
                              setShowWebOrdersModal(false);
                              showToast('นำเข้าออเดอร์สำเร็จ! กรุณาตรวจสอบและชำระเงิน', 'success');
                            }}
                            className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold shadow-md shadow-sky-200 transition-all flex items-center justify-center gap-2"
                          >
                            <ShoppingCart size={16} /> นำเข้าตะกร้า
                          </button>

                          <button
                            onClick={async () => {
                              const trackingNo = prompt(`สแกนหรือพิมพ์เลขพัสดุสำหรับออเดอร์ #${order.id}:`);
                              if (!trackingNo) return;
                              
                              try {
                                setIsFetchingWebOrders(true);
                                await fetchWithProxy(`https://irisnatures.com/wp-json/wc/v3/orders/${order.id}`, {
                                    method: 'PUT',
                                    body: JSON.stringify({
                                        status: 'completed',
                                        meta_data: [{ key: 'tracking_number', value: trackingNo }]
                                    })
                                }, true);
                                
                                await fetchWithProxy(`https://irisnatures.com/wp-json/wc/v3/orders/${order.id}/notes`, {
                                    method: 'POST',
                                    body: JSON.stringify({
                                        note: `ออเดอร์ของคุณถูกจัดส่งแล้ว\nหมายเลขพัสดุ (Tracking Number): ${trackingNo}`,
                                        customer_note: true
                                    })
                                });
                                
                                showToast('อัปเดตสถานะจัดส่งเรียบร้อยแล้ว', 'success');
                                fetchWebOrdersManual();
                              } catch (err) {
                                showToast('เกิดข้อผิดพลาดในการจัดส่ง', 'error');
                                setIsFetchingWebOrders(false);
                              }
                            }}
                            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-md shadow-emerald-200 transition-colors flex items-center justify-center gap-2"
                          >
                            <Truck size={16} /> ระบุเลขพัสดุ (จัดส่ง)
                          </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    {/* Stock Compare Modal */}
    {showStockCompare && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
            <div>
              <h2 className="text-xl font-bold text-slate-800">เปรียบเทียบสต๊อก POS vs เว็บ</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {isLoadingCompare ? 'กำลังโหลด...' : `${stockCompareData.length} สินค้าใน POS · จับคู่ได้ ${stockCompareData.filter(r => r.matched).length} รายการ (เทียบจากรหัส SKU)`}
              </p>
            </div>
            <button onClick={() => setShowStockCompare(false)} className="w-9 h-9 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-xl"><X size={18} className="text-slate-500"/></button>
          </div>

          <div className="overflow-y-auto flex-1">
            {isLoadingCompare ? (
              <div className="flex items-center justify-center py-20">
                <span className="animate-spin w-8 h-8 border-4 border-violet-400 border-t-transparent rounded-full mr-3"></span>
                <span className="text-slate-500 font-medium">กำลังดึงข้อมูลจากเว็บ...</span>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left p-3 font-semibold text-slate-600">รหัส (SKU)</th>
                    <th className="text-left p-3 font-semibold text-slate-600">ชื่อสินค้า (POS)</th>
                    <th className="text-center p-3 font-semibold text-slate-600">สต๊อก POS</th>
                    <th className="text-center p-3 font-semibold text-slate-600">สต๊อกบนเว็บ</th>
                    <th className="text-center p-3 font-semibold text-slate-600">ต่าง</th>
                  </tr>
                </thead>
                <tbody>
                  {stockCompareData.map((row, i) => {
                    const wooNum = typeof row.wooStock === 'number' ? row.wooStock : null;
                    const diff = wooNum !== null ? row.posStock - wooNum : null;
                    const isOk = diff === 0;
                    const notManaged = row.matched && row.wooStock === null;
                    return (
                      <tr key={i} className={`border-b border-slate-100 ${!row.matched ? 'bg-orange-50' : isOk ? '' : 'bg-rose-50'}`}>
                        <td className="p-3 font-mono text-xs text-slate-500">{row.sku || <span className="text-slate-300 italic">ไม่มีรหัส</span>}</td>
                        <td className="p-3 font-semibold text-slate-800">{row.name}</td>
                        <td className="p-3 text-center font-bold text-indigo-600">{row.posStock}</td>
                        <td className="p-3 text-center">
                          {!row.matched ? <span className="text-orange-500 font-semibold">ไม่พบบนเว็บ</span>
                           : notManaged ? <span className="text-slate-400">ไม่ได้จัดการสต๊อก</span>
                           : <span className={`font-bold ${isOk ? 'text-emerald-600' : 'text-rose-600'}`}>{wooNum}</span>}
                        </td>
                        <td className="p-3 text-center font-bold">
                          {diff === null ? '-'
                           : diff === 0 ? <span className="text-emerald-600">✓</span>
                           : <span className="text-rose-600">{diff > 0 ? '+' : ''}{diff}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 shrink-0 flex gap-3 text-xs text-slate-400">
            <span className="w-3 h-3 rounded bg-rose-50 border border-rose-200 inline-block"></span> สต๊อกไม่ตรงกัน
            <span className="w-3 h-3 rounded bg-orange-50 border border-orange-200 inline-block ml-2"></span> ไม่พบสินค้าบนเว็บ
          </div>
        </div>
      </div>
    )}

      <ShopeeImportModal 
        isOpen={showShopeeModal} 
        onClose={() => setShowShopeeModal(false)} 
        products={products}
        globalBranch={globalBranch}
        showToast={showToast}
      />

      <BarcodeScannerModal
        isOpen={!!scannerTarget}
        onClose={() => setScannerTarget(null)}
        onScan={async (text) => {
           try {
             const data = JSON.parse(text);
             if (data.type === 'voucher' && data.code) {
                 await handleVoucherScan(data.code, data.phone || null);
                 setScannerTarget(null);
                 return;
             }
             if (data.type === 'reward' && data.code) {
                 await handleRewardRedemptionScan(data.code, data.customerId || data.phone);
                 setScannerTarget(null);
                 return;
             }
             if (scannerTarget === 'creditPayment' && (data.type === 'credit_pay' || data.phone || data.customerPhone || data.code)) {
                 if (data.type === 'credit_pay' && data.timestamp) {
                     const now = Date.now();
                     const qrTime = new Date(data.timestamp).getTime();
                     if (now - qrTime > 5 * 60 * 1000) {
                         showToast("ข้อผิดพลาด", "QR Code หมดอายุ กรุณาสร้างใหม่จากแอป", "error");
                         setScannerTarget(null);
                         return;
                     }
                 }
                 const phoneToMatch = data.phone || data.customerPhone || data.code;
                 const cleanMatch = phoneToMatch.replace(/[^0-9]/g, '');
                 const foundCustomer = customers.find(c => String(getFuzzyKey(c, ["เบอร์โทร", "col_3", "phone"]) || '').replace(/[^0-9]/g, '') === cleanMatch);
                 if (foundCustomer) {
                     setSelectedCustomer(foundCustomer);
                     const myCourses = courses.filter(c => String(getFuzzyKey(c, ["เบอร์โทร", "col_1"]) || '').trim() === String(foundCustomer.computedPhone).trim());
                     const creditBal = myCourses.reduce((sum, c) => sum + (c.computedRemainCredit || 0), 0);
                     const currentOthersTotal = totalPaid - (splitPayment.credit || 0);
                     let fillAmt = Math.max(0, total - currentOthersTotal);
                     if (fillAmt > creditBal) fillAmt = creditBal;
                     
                     if (fillAmt > 0) {
                       setSplitPayment(prev => ({ ...prev, credit: fillAmt }));
                       showToast("สแกนรับชำระด้วยเครดิตสำเร็จ", `หักเครดิต ${fillAmt.toLocaleString()} บาท`, "success");
                       
                       if (fillAmt + currentOthersTotal >= total) {
                           setTimeout(() => {
                               const btn = document.getElementById('btn-confirm-checkout');
                               if (btn && !btn.disabled) btn.click();
                           }, 500);
                       }
                     } else {
                       showToast("สแกนและดึงข้อมูลลูกค้าสำเร็จ", "เครดิตไม่เพียงพอหรือไม่มียอดต้องชำระ", "success");
                     }
                 } else {
                     showToast("สแกนล้มเหลว", "ไม่พบข้อมูลลูกค้าจาก QR Code", "error");
                 }
                 setScannerTarget(null);
                 return;
             }
          } catch(e) {
             // Not JSON, continue with normal processing
          }

          if (scannerTarget === 'creditPayment') {
              let cleanMatch = text.replace(/[^0-9]/g, '');
              let foundCustomer = null;
              if (cleanMatch && cleanMatch.length >= 10) {
                  foundCustomer = customers.find(c => String(getFuzzyKey(c, ["เบอร์โทร", "col_3", "phone"]) || '').replace(/[^0-9]/g, '') === cleanMatch);
              }
              if (!foundCustomer) {
                  const scannedCourse = findCourseByScanRef(text);
                  const scPhone = scannedCourse ? String(getFuzzyKey(scannedCourse, ["เบอร์โทร", "col_1"]) || '').replace(/[^0-9]/g, '') : '';
                  if (scPhone) foundCustomer = customers.find(c => String(getFuzzyKey(c, ["เบอร์โทร", "col_3", "phone"]) || '').replace(/[^0-9]/g, '') === scPhone) || null;
              }
              if (foundCustomer) {
                  setSelectedCustomer(foundCustomer);
                  const myCourses = courses.filter(c => String(getFuzzyKey(c, ["เบอร์โทร", "col_1"]) || '').trim() === String(foundCustomer.computedPhone || getFuzzyKey(foundCustomer, ["เบอร์โทร", "col_3"])).trim());
                  const creditBal = myCourses.reduce((sum, c) => sum + (c.computedRemainCredit || 0), 0);
                  const currentOthersTotal = totalPaid - (splitPayment.credit || 0);
                  let fillAmt = Math.max(0, total - currentOthersTotal);
                  if (fillAmt > creditBal) fillAmt = creditBal;
                  
                  if (fillAmt > 0) {
                    setSplitPayment(prev => ({ ...prev, credit: fillAmt }));
                    showToast("สแกนรับชำระด้วยเครดิตสำเร็จ", `หักเครดิต ${fillAmt.toLocaleString()} บาท`, "success");
                    
                    if (fillAmt + currentOthersTotal >= total) {
                        setTimeout(() => {
                            const btn = document.getElementById('btn-confirm-checkout');
                            if (btn && !btn.disabled) btn.click();
                        }, 500);
                    }
                  } else {
                    showToast("สแกนและดึงข้อมูลลูกค้าสำเร็จ", "เครดิตไม่เพียงพอหรือไม่มียอดต้องชำระ", "success");
                  }
              } else {
                  await handleVoucherScan(text);
              }
              setScannerTarget(null);
              return;
          }

          if (scannerTarget === 'wcOrder') {
             setActiveWcOrderId(text);
             showToast(`แสกนหมายเลขอ้างอิง: ${text}`, 'success');
          } else if (scannerTarget === 'trackingNo') {
             // 📮 สแกนเลขพัสดุจากใบเสร็จขนส่ง → ใส่ช่องเลขพัสดุตอนชำระเงิน
             setPosTrackingNo(String(text).trim());
             showToast('สแกนเลขพัสดุสำเร็จ', String(text).trim(), 'success');
          } else if (scannerTarget === 'productSearch') {
             setSearchTerm(text);
             showToast(`แสกนค้นหาสินค้า: ${text}`, 'success');
          } else if (scannerTarget === 'voucher') {
              await handleVoucherScan(text);
             setScannerTarget(null);
          } else if (scannerTarget === 'customerSearch') {
             // Check if it's a booking ID or Ref
             const booking = bookings.find(b => b.id === text || String(b.ticketNo || '') === text || String(b.bookingRef || '') === text);
             if (booking && booking.customerPhone) {
                 const customer = customers.find(c => {
                     const phone = String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '').replace(/[^0-9]/g, '');
                     return phone === String(booking.customerPhone).replace(/[^0-9]/g, '');
                 });
                 if (customer) {
                     setSelectedCustomer(customer);
                     showToast(`สแกนพบหมายเลขจองและเลือกลูกค้า: ${getFuzzyKey(customer, ["ชื่อ", "col_1"])}`, 'success');
                     setScannerTarget(null);
                     return;
                 }
             }

             // Check if it's a course invoice number (ใบคอร์ส A4 / QR)
             const course = findCourseByScanRef(text);
             if (course) {
                 const coursePhone = String(getFuzzyKey(course, ["เบอร์โทร", "col_1", "phone", "customerPhone"]) || '').replace(/[^0-9]/g, '');
                 let customer = null;
                 if (coursePhone) {
                     customer = customers.find(c => {
                         const phone = String(getFuzzyKey(c, ["เบอร์โทร", "col_3", "phone"]) || c.computedPhone || '').replace(/[^0-9]/g, '');
                         return phone && phone === coursePhone;
                     });
                 }
                 if (!customer && (course.customerId || course.customer_id)) {
                     customer = customers.find(c => c.id === (course.customerId || course.customer_id));
                 }
                 if (!customer) {
                     const custName = String(getFuzzyKey(course, ["ผู้ซื้อคอส", "ชื่อลูกค้า", "ชื่อ", "col_9", "customerName"]) || '').trim().toLowerCase();
                     if (custName) {
                         customer = customers.find(c => {
                             const name = String(getFuzzyKey(c, ["ชื่อ", "col_1", "name"]) || '').trim().toLowerCase();
                             return name && (name === custName || name.includes(custName) || custName.includes(name));
                         });
                     }
                 }
                 if (customer) {
                     setSelectedCustomer(customer);
                     setActiveTab('my_courses');
                     setSelectedCourseForUsage(course);
                     showToast(`สแกนพบคอร์ส: ${String(getFuzzyKey(course, ["ชื่อคอส", "col_8"]) || '-')}`, `ลูกค้า: ${getFuzzyKey(customer, ["ชื่อ", "col_1"])}`, 'success');
                     setScannerTarget(null);
                     return;
                 } else {
                     setSelectedCourseForUsage(course);
                     showToast(`สแกนพบคอร์ส: ${String(getFuzzyKey(course, ["ชื่อคอส", "col_8"]) || course.id)}`, 'success');
                     setScannerTarget(null);
                     return;
                 }
             }

             // Check if it's phone number exactly
             if (/^0\d{9}$/.test(text)) {
                 const customer = customers.find(c => {
                    const phone = String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '').replace(/[^0-9]/g, '');
                    return phone === text;
                 });
                 if (customer) {
                     setSelectedCustomer(customer);
                     showToast(`สแกนพบลูกค้า: ${getFuzzyKey(customer, ["ชื่อ", "col_1"])}`, 'success');
                     setScannerTarget(null);
                     return;
                 }
             }

             setCustomerSearch(text);
             setIsCustomerDropdownOpen(true);
             showToast(`แสกนข้อมูลลูกค้าสำเร็จ`, 'success');
          }
          setScannerTarget(null);
        }}
      />

      {/* Course QR Modal */}
      {courseQRModalData && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden relative">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-teal-50">
                      <h3 className="font-black text-teal-800 text-lg flex items-center gap-2">
                          <QrCode size={20} className="text-teal-600" /> คิวอาร์โค้ดคอร์ส
                      </h3>
                      <button onClick={() => setCourseQRModalData(null)} className="w-8 h-8 flex items-center justify-center bg-white text-slate-400 hover:text-slate-600 rounded-full shadow-sm">
                          <X size={18} />
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* 🌟 Instant Voucher Confirmation Modal 🌟 */}
      {instantVoucherModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
           <div className="bg-white w-full max-w-md rounded-[32px] p-6 sm:p-8 shadow-2xl text-center">
              <div className="w-16 h-16 bg-teal-50 text-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                <Ticket size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-1">สแกนคูปองสำเร็จ!</h3>
              <p className="text-sm font-bold text-teal-600 mb-4 bg-teal-50 inline-block px-3 py-1 rounded-lg">รหัส: {instantVoucherModal.code}</p>
              
              <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600 mb-6 text-left border border-slate-100">
                  <div className="flex justify-between mb-2">
                     <span className="font-bold">ประเภท:</span> 
                     <span>
                       {instantVoucherModal.voucher.type === 'course_percent'
                         ? `ส่วนลด ${instantVoucherModal.voucher.value}% (${instantVoucherModal.voucher.posItemName || 'คอร์สที่เลือก'})`
                         : instantVoucherModal.voucher.type === 'course_fixed'
                         ? `ส่วนลด ฿${instantVoucherModal.voucher.value} (${instantVoucherModal.voucher.posItemName || 'คอร์สที่เลือก'})`
                         : instantVoucherModal.voucher.type === 'free_item' || instantVoucherModal.voucher.type === 'pos_item'
                         ? `แลกรับฟรี (${instantVoucherModal.voucher.posItemName || 'สินค้า/คอร์ส'})`
                         : instantVoucherModal.voucher.type === 'percent'
                         ? `ส่วนลดทั้งบิล ${instantVoucherModal.voucher.value}%`
                         : `ส่วนลด ฿${instantVoucherModal.voucher.value}`}
                     </span>
                  </div>
                  <div className="flex justify-between">
                     <span className="font-bold">เงื่อนไข:</span> 
                     <span>{instantVoucherModal.voucher.isPersonal ? 'คูปองส่วนตัว' : 'คูปองทั่วไป (Batch)'}</span>
                  </div>
              </div>

              <div className="flex flex-col gap-3">
                 <button onClick={() => executeVoucherAction('instant_use')} className="w-full py-3.5 bg-teal-500 hover:bg-teal-600 text-white font-black rounded-xl shadow-lg shadow-teal-200 transition-all active:scale-95 flex items-center justify-center gap-2">
                    <CheckCircle size={20} /> ใช้สิทธิ์คูปองทันที (ไม่ต้องเปิดบิล POS)
                 </button>
                 <button onClick={() => executeVoucherAction('apply_cart')} className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl transition-colors flex items-center justify-center gap-2">
                    <ShoppingCart size={20} /> นำไปเป็นส่วนลดในบิล POS
                 </button>
                 <button onClick={() => setInstantVoucherModal(null)} className="mt-2 text-sm font-bold text-slate-400 hover:text-slate-600">
                    ยกเลิก
                 </button>
              </div>
           </div>
        </div>
      )}
      
      <SalesHistoryModal
        isOpen={showSalesHistory}
        onClose={() => setShowSalesHistory(false)}
        showToast={showToast}
        globalBranch={globalBranch}
        appSettings={appSettings}
        currentMonthSales={currentMonthSales}
        todaySales={todaySales}
        todaySalesBreakdown={eodBreakdown}
        setShowEodModal={setShowEodModal}
        setShowEodPreviewA4={setShowEodPreviewA4}
        posFilterDate={posFilterDate}
        eodData={eodData}
        setEodData={setEodData}
        setPosFilterDate={setPosFilterDate}
        globalRole={globalRole}
        onPrintReceipt={(order) => {
          const items = order.cartItems || [{ name: order.courseName || 'รายการสั่งซื้อ (ย้อนหลัง)', price: Number(order.price) + Number(order.discount || 0), qty: 1, actionType: order.transactionType }];
          const subtotal = items.reduce((sum, item) => sum + (Number(item.price) * (item.qty || 1)), 0);
          setReceiptData({
            orderNo: order.orderNo,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            items,
            subtotal,
            total: Number(order.price),
            globalDiscount: Number(order.discount || 0),
            totalSaved: 0,
            paymentMethodStr: order.paymentMethod,
            orderChannel: order.orderChannel,
            shippingAddress: order.shippingAddress,
            trackingNo: order.trackingNo || '',
            splitPayment: order.splitPayment || { cash: 0, transfer: 0, cod: 0, credit: 0 },
            createdAt: new Date(order.createdAt)
          });
          setShowPreviewModal(true);
          setPrintMode('receipt');
        }}
      />

      <ClearMonthlyPosSalesModal
        isOpen={showClearPosMonthModal}
        onClose={() => setShowClearPosMonthModal(false)}
        globalBranch={globalBranch}
        branches={branches}
        showToast={showToast}
        onSuccess={() => {
          // Reset cart or reload if needed
        }}
      />
      
      {viewCourseDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setViewCourseDetails(null)}></div>
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-pink-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FileText size={18} className="text-pink-500" /> รายละเอียดคอร์ส
              </h3>
              <button onClick={() => setViewCourseDetails(null)} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-full transition-colors"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {(() => {
                const img = getPosCourseImageUrl(viewCourseDetails, wooImagesMap);
                if (!img) return null;
                return (
                  <div className="w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/80 relative mb-3 flex items-center justify-center p-2 shadow-2xs group">
                    <img 
                      src={img} 
                      alt="Course" 
                      className="w-full max-h-[55vh] object-contain rounded-xl" 
                    />
                    <a
                      href={img}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-3 right-3 p-1.5 px-2.5 rounded-lg bg-black/60 hover:bg-black/80 text-white shadow-md backdrop-blur-xs transition-opacity opacity-0 group-hover:opacity-100 flex items-center gap-1.5 text-xs font-semibold"
                      title="เปิดดูภาพต้นฉบับขนาดเต็ม"
                    >
                      <ExternalLink size={13} />
                      <span>ดูภาพเต็ม</span>
                    </a>
                  </div>
                );
              })()}
              <div>
                <div className="text-[10px] font-mono text-pink-500 font-bold mb-1">{String(getFuzzyKey(viewCourseDetails, ["รหัสคอส", "col_1"]) || '-')}</div>
                <h4 className="text-lg font-black text-slate-900">{String(getFuzzyKey(viewCourseDetails, ["ชื่อคอส", "col_4"]) || '-')}</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-500 font-bold mb-1">ราคาขาย</div>
                  <div className="font-bold text-slate-800">฿{parseNumber(getFuzzyKey(viewCourseDetails, ["ราคา", "ราคาขาย", "col_5"])).toLocaleString()}</div>
                </div>
                <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                  <div className="text-[10px] text-orange-600 font-bold mb-1">เครดิต / วงเงิน</div>
                  <div className="font-bold text-orange-700">฿{parseNumber(getFuzzyKey(viewCourseDetails, ["เครดิตที่ได้รับ", "เครดิต", "col_8", "วงเงิน"])).toLocaleString()}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-bold bg-pink-100 text-pink-700 px-2 py-1 rounded-lg">หมวดหมู่: {String(getFuzzyKey(viewCourseDetails, ["ประเภท", "col_2"]) || '-')}</span>
                {getFuzzyKey(viewCourseDetails, ["กำหนดเวลา"]) && (
                  <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded-lg">⏳ อายุ {getFuzzyKey(viewCourseDetails, ["กำหนดเวลา"])}</span>
                )}
                {getFuzzyKey(viewCourseDetails, ["ฟรีบัตรสมาชิก"]) === 'ใช่' && (
                  <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded-lg">💳 แถม VIP Card</span>
                )}
              </div>

              {/* If multiple session tiers exist (1 ครั้ง, 5 ครั้ง, 10 ครั้ง), allow direct selection */}
              {(() => {
                const rawName = String(getFuzzyKey(viewCourseDetails, ["ชื่อคอส", "col_4"]) || '');
                const baseName = rawName
                  .replace(/\(ซื้อเพิ่มโปร\)/g, '')
                  .replace(/\(\s*\d+\s*ครั้ง\s*\)/g, '')
                  .replace(/\d+\s*ครั้ง/g, '')
                  .trim();
                const relatedTiers = masterCourses.filter(mc => {
                  const mName = String(getFuzzyKey(mc, ["ชื่อคอส", "col_4"]) || '').trim();
                  return mName.startsWith(baseName) && (getCourseCategory(mc) === getCourseCategory(viewCourseDetails));
                }).sort((a, b) => {
                  const sA = parseInt(getFuzzyKey(a, ["จำนวนครั้ง", "col_7", "col_6", "จำนวนครั้งที่ได้"])) || 1;
                  const sB = parseInt(getFuzzyKey(b, ["จำนวนครั้ง", "col_7", "col_6", "จำนวนครั้งที่ได้"])) || 1;
                  return sA - sB;
                });

                if (relatedTiers.length > 1) {
                  return (
                    <div className="bg-violet-50/60 border border-violet-200/80 rounded-2xl p-3.5">
                      <div className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><Sparkles size={14} className="text-violet-600"/> เลือกระดับจำนวนครั้ง:</span>
                        <span className="text-[10px] text-violet-600 font-semibold">แตะเพื่อใส่ตะกร้า</span>
                      </div>
                      <div className={`grid ${relatedTiers.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
                        {relatedTiers.map(tier => {
                          const tPrice = parseNumber(getFuzzyKey(tier, ["ราคา", "ราคาขาย", "col_5"]));
                          const tSess = String(getFuzzyKey(tier, ["จำนวนครั้ง", "col_7", "col_6", "จำนวนครั้งที่ได้"]) || (String(getFuzzyKey(tier, ["ชื่อคอส", "col_4"])).match(/(\d+)\s*ครั้ง/) ? String(getFuzzyKey(tier, ["ชื่อคอส", "col_4"])).match(/(\d+)\s*ครั้ง/)[1] : '1'));
                          const isCurrent = tier.id === viewCourseDetails.id;
                          return (
                            <button
                              key={tier.id}
                              onClick={() => {
                                addToCart(tier, 'course');
                                setViewCourseDetails(null);
                                showToast(`เพิ่ม "${baseName} (${tSess} ครั้ง)" ลงในตะกร้าแล้ว`, 'success');
                              }}
                              className={`p-2.5 rounded-xl border-2 transition-all flex flex-col items-center justify-center shadow-xs cursor-pointer active:scale-95 ${isCurrent ? 'bg-violet-600 text-white border-violet-600 shadow-violet-200' : 'bg-white hover:border-violet-500 hover:bg-violet-50 border-violet-100 text-slate-700'}`}
                            >
                              <span className={`text-xs font-bold ${isCurrent ? 'text-violet-100' : 'text-violet-700'}`}>{tSess} ครั้ง</span>
                              <span className={`text-sm font-black ${isCurrent ? 'text-white' : 'text-slate-900'}`}>฿{tPrice.toLocaleString()}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {getFuzzyKey(viewCourseDetails, ["รายการที่ได้รับ", "col_11"]) && (
                <div>
                  <div className="text-xs font-bold text-slate-700 mb-2">รายการที่ได้รับในคอร์ส:</div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                    {String(getFuzzyKey(viewCourseDetails, ["รายการที่ได้รับ", "col_11"]))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <button 
                onClick={() => { 
                  if (Array.isArray(viewCourseDetails.promoOptions) && viewCourseDetails.promoOptions.length > 0) {
                    setSelectedCourseForPromoModal(viewCourseDetails);
                    setViewCourseDetails(null);
                  } else {
                    addToCart(viewCourseDetails, 'course'); 
                    setViewCourseDetails(null); 
                  }
                }} 
                className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-2.5 rounded-xl transition-all shadow-sm shadow-pink-500/20"
              >
                {Array.isArray(viewCourseDetails.promoOptions) && viewCourseDetails.promoOptions.length > 0 ? 'เลือกโปรโมชั่นย่อย' : 'เพิ่มลงตะกร้า'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 Modal เลือกตัวเลือกโปรโมชั่นย่อยสำหรับ POS (Promo Options Picker) 🌟 */}
      {selectedCourseForPromoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
            onClick={() => setSelectedCourseForPromoModal(null)}
          ></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200 border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-pink-100 flex justify-between items-start bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white">
              <div className="pr-4 flex items-start gap-3.5">
                {(() => {
                  const pImg = getPosCourseImageUrl(selectedCourseForPromoModal, wooImagesMap);
                  if (!pImg) return null;
                  return (
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/60 shrink-0 shadow-md bg-white flex items-center justify-center p-0.5">
                      <img src={pImg} alt="Promo" className="w-full h-full object-contain rounded-xl" />
                    </div>
                  );
                })()}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full inline-block text-pink-100">
                      {String(getFuzzyKey(selectedCourseForPromoModal, ["รหัสคอส", "col_1"]) || 'PROMO')}
                    </span>
                    <span className="text-[11px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles size={11} /> {selectedCourseForPromoModal.promoOptions?.length || 0} ตัวเลือกโปร
                    </span>
                  </div>
                  <h3 className="font-extrabold text-lg text-white leading-tight">
                    {String(getFuzzyKey(selectedCourseForPromoModal, ["ชื่อคอส", "col_4"]) || selectedCourseForPromoModal.name)}
                  </h3>
                  <p className="text-xs text-pink-100 mt-1">แตะเลือกแพ็กเกจโปรโมชั่นที่ลูกค้าต้องการซื้อเพื่อใส่ลงตะกร้า</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCourseForPromoModal(null)} 
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Options List */}
            <div className="p-5 space-y-3 overflow-y-auto flex-1">
              {(() => {
                const pImg = getPosCourseImageUrl(selectedCourseForPromoModal, wooImagesMap);
                if (!pImg) return null;
                return (
                  <div className="w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/80 mb-2 flex items-center justify-center p-2 shadow-2xs group relative">
                    <img 
                      src={pImg} 
                      alt="Promo Poster" 
                      className="w-full max-h-[35vh] object-contain rounded-xl" 
                    />
                    <a
                      href={pImg}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-3 right-3 p-1.5 px-2.5 rounded-lg bg-black/60 hover:bg-black/80 text-white shadow-md backdrop-blur-xs transition-opacity opacity-0 group-hover:opacity-100 flex items-center gap-1.5 text-xs font-semibold"
                      title="เปิดดูภาพต้นฉบับขนาดเต็ม"
                    >
                      <ExternalLink size={13} />
                      <span>ดูภาพเต็ม</span>
                    </a>
                  </div>
                );
              })()}
              {/* 🌟 ตัวกรองหมวดหมู่กลุ่มแพ็กเกจ (เช่น รักษาสิว-ฝ้า / ฟื้นฟูหลุมสิว / ลงเครื่องเพิ่ม) 🌟 */}
              {Array.isArray(selectedCourseForPromoModal.groups) && selectedCourseForPromoModal.groups.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-black text-slate-700 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1"><Sparkles size={13} className="text-pink-600 fill-pink-400" /> หมวดหมู่แพ็กเกจ:</span>
                    <span className="text-[10px] text-pink-600 font-bold bg-pink-50 px-2 py-0.5 rounded-full border border-pink-100">
                      {posPromoGroup === 'all' 
                        ? `แสดงทั้งหมด (${selectedCourseForPromoModal.promoOptions?.length || 0} รายการ)` 
                        : (selectedCourseForPromoModal.groups.find(g => g.id === posPromoGroup)?.label || posPromoGroup)}
                    </span>
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
                    {selectedCourseForPromoModal.groups.map(grp => {
                      const isActive = (posPromoGroup || 'all') === grp.id;
                      return (
                        <button
                          key={grp.id}
                          type="button"
                          onClick={() => setPosPromoGroup(grp.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                            isActive 
                              ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white border-pink-600 shadow-xs' 
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {grp.icon && <span>{grp.icon}</span>}
                          <span>{grp.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 🌟 ตัวกรองโปรแกรม A ถึง J (สำหรับคอร์สรวมทรีทเม้นท์ผิวหน้า) 🌟 */}
              {Array.isArray(selectedCourseForPromoModal.programs) && selectedCourseForPromoModal.programs.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-black text-slate-700 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1"><Sparkles size={13} className="text-pink-600 fill-pink-400" /> เลือกโปรแกรมทรีทเม้นท์ (A - J):</span>
                    <span className="text-[10px] text-pink-600 font-bold bg-pink-50 px-2 py-0.5 rounded-full border border-pink-100">
                      {posPromoProgramLetter === 'all' ? 'แสดงทั้งหมด 10 โปรแกรม' : `โปรแกรม ${posPromoProgramLetter}`}
                    </span>
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
                    <button
                      type="button"
                      onClick={() => setPosPromoProgramLetter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                        posPromoProgramLetter === 'all' 
                          ? 'bg-pink-600 text-white border-pink-600 shadow-xs' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      ทั้งหมด (A-J)
                    </button>
                    {selectedCourseForPromoModal.programs.map(prog => (
                      <button
                        key={prog.letter}
                        type="button"
                        onClick={() => setPosPromoProgramLetter(prog.letter)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                          posPromoProgramLetter === prog.letter 
                            ? 'bg-pink-600 text-white border-pink-600 shadow-xs' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center ${
                          posPromoProgramLetter === prog.letter ? 'bg-white/20 text-white' : 'bg-pink-50 text-pink-600'
                        }`}>
                          {prog.letter}
                        </span>
                        <span>{prog.baseName.replace(/^[A-J]\.\s*/, '')}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(selectedCourseForPromoModal.promoOptions || [])
                .filter(opt => {
                  if (posPromoGroup && posPromoGroup !== 'all') {
                    if (opt.groupId && opt.groupId !== posPromoGroup) return false;
                  }
                  if (posPromoProgramLetter && posPromoProgramLetter !== 'all') {
                    return opt.programLetter === posPromoProgramLetter || opt.code?.startsWith(`F-${posPromoProgramLetter}`);
                  }
                  return true;
                })
                .map((opt, idx) => {
                const optPrice = parseNumber(opt.price);
                const optSessions = opt.sessions || 1;
                return (
                  <div 
                    key={opt.id || idx}
                    onClick={() => {
                      addToCart(selectedCourseForPromoModal, 'course', null, opt);
                      setSelectedCourseForPromoModal(null);
                      showToast(`เพิ่ม "${opt.name}" ลงในตะกร้าแล้ว`, 'success');
                    }}
                    className="p-4 rounded-2xl border-2 border-pink-100 hover:border-pink-500 hover:bg-pink-50/40 bg-white transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col gap-2.5 group relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        {opt.groupLabel && (
                          <div className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 w-fit mb-1">
                            {opt.groupLabel}
                          </div>
                        )}
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-extrabold text-slate-800 text-sm sm:text-base group-hover:text-pink-600 transition-colors">
                            {opt.name}
                          </span>
                          {opt.badge && (
                            <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                              <Sparkles size={9} /> {opt.badge}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <div className="inline-block text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded-md">
                            ✨ จำนวน {optSessions} ครั้ง
                          </div>
                          {opt.credit && Number(opt.credit) > 0 && (
                            <div className="inline-block text-[11px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md shadow-2xs">
                              💳 วงเงินเครดิต ฿{Number(opt.credit).toLocaleString()} (ใช้เบิกผลิตภัณฑ์)
                            </div>
                          )}
                          {opt.freeMemberCard && (
                            <div className="inline-block text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                              💳 ฟรีบัตรสมาชิก (เมื่อชำระเต็ม)
                            </div>
                          )}
                          {opt.freeGift && (
                            <div className="inline-block text-[11px] font-black text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-md shadow-xs">
                              🎁 แถมฟรี! {opt.freeGift}
                            </div>
                          )}
                        </div>

                        {opt.items && (
                          <div className="text-xs text-slate-500 mt-1 whitespace-pre-line leading-relaxed bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                            {opt.items}
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        {opt.originalPrice && Number(opt.originalPrice) > optPrice && (
                          <div className="text-[10px] text-slate-400 line-through">
                            ปกติ ฿{Number(opt.originalPrice).toLocaleString()}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 font-bold">จ่ายเพียง</div>
                        <div className="font-black text-xl text-pink-600">
                          ฿{optPrice.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-dashed border-pink-100 flex items-center justify-between text-xs font-bold text-pink-600 group-hover:text-pink-700">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Check size={14} className="text-pink-600" /> แตะเพื่อเลือกโปรนี้
                      </span>
                      <span className="bg-pink-100 group-hover:bg-pink-600 group-hover:text-white text-pink-700 px-3.5 py-1 rounded-xl text-xs font-bold transition-colors shadow-2xs">
                        เลือกใส่ตะกร้า
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 🌟 Modal เลือกตัวเลือก/ระดับราคาคอร์สกลุ่ม (เช่น ไครโอเย็น สปาเย็น) เหมือนฝั่งลูกค้า 🌟 */}
      {selectedGroupedCourse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
            onClick={() => { setSelectedGroupedCourse(null); setGroupedCourseFilterTab('all'); }}
          ></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200 border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-violet-100 flex justify-between items-start bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white">
              <div className="pr-4 flex items-start gap-3">
                {(() => {
                  const pImg = getPosCourseImageUrl(selectedGroupedCourse.items[0], wooImagesMap);
                  if (!pImg) return null;
                  return (
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-white/60 shrink-0 shadow-md bg-white flex items-center justify-center p-0.5">
                      <img src={pImg} alt="Course" className="w-full h-full object-contain rounded-xl" />
                    </div>
                  );
                })()}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full inline-block text-violet-100">
                      {selectedGroupedCourse.primaryCode || 'COURSE'}
                    </span>
                    <span className="text-[11px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles size={11} /> {selectedGroupedCourse.items.length} ตัวเลือก
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base sm:text-lg text-white leading-tight line-clamp-1">
                    {selectedGroupedCourse.baseName}
                  </h3>
                  <p className="text-xs text-violet-100 mt-0.5">แตะเลือกโปรโมชั่นหรือระดับราคาที่ต้องการเพื่อใส่ลงตะกร้า</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => { setSelectedGroupedCourse(null); setGroupedCourseFilterTab('all'); }} 
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Filter Tabs & Options */}
            {(() => {
              const regularItems = selectedGroupedCourse.items.filter(c => !String(getFuzzyKey(c, ["ชื่อคอส", "col_4", "ชื่อสินค้า", "col_2"]) || '').includes('ซื้อเพิ่มโปร'));
              const promoItems = selectedGroupedCourse.items.filter(c => String(getFuzzyKey(c, ["ชื่อคอส", "col_4", "ชื่อสินค้า", "col_2"]) || '').includes('ซื้อเพิ่มโปร'));
              const showTabs = regularItems.length > 0 && promoItems.length > 0;
              
              return (
                <>
                  {showTabs && (
                    <div className="px-4 sm:px-5 pt-3 pb-1 border-b border-slate-100 flex gap-2 overflow-x-auto bg-slate-50/70">
                      <button
                        type="button"
                        onClick={() => setGroupedCourseFilterTab('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                          groupedCourseFilterTab === 'all'
                            ? 'bg-violet-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-200/60'
                        }`}
                      >
                        ทั้งหมด ({selectedGroupedCourse.items.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setGroupedCourseFilterTab('regular')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                          groupedCourseFilterTab === 'regular'
                            ? 'bg-violet-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-200/60'
                        }`}
                      >
                        รายครั้งปกติ ({regularItems.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setGroupedCourseFilterTab('promo')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                          groupedCourseFilterTab === 'promo'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200/60'
                        }`}
                      >
                        ซื้อเพิ่มโปร ({promoItems.length})
                      </button>
                    </div>
                  )}

                  {/* List of Options */}
                  <div className="p-4 sm:p-5 space-y-2.5 overflow-y-auto flex-1">
                    {selectedGroupedCourse.items
                      .filter(c => {
                        const isPromo = String(getFuzzyKey(c, ["ชื่อคอส", "col_4", "ชื่อสินค้า", "col_2"]) || '').includes('ซื้อเพิ่มโปร');
                        if (groupedCourseFilterTab === 'regular') return !isPromo;
                        if (groupedCourseFilterTab === 'promo') return isPromo;
                        return true;
                      })
                      .map((c, idx) => {
                        const nameStr = String(getFuzzyKey(c, ["ชื่อคอส", "col_4", "ชื่อสินค้า", "col_2"]) || '');
                        const isPromo = nameStr.includes('ซื้อเพิ่มโปร');
                        const price = parseNumber(getFuzzyKey(c, ["ราคา", "ราคาขาย", "col_5"]));
                        const sessVal = String(getFuzzyKey(c, ["จำนวนครั้ง", "col_7", "col_6", "จำนวนครั้งที่ได้"]) || (nameStr.match(/(\d+)\s*ครั้ง/) ? nameStr.match(/(\d+)\s*ครั้ง/)[1] : '1'));
                        const sessLabel = isPromo ? 'ซื้อเพิ่มโปร' : `${sessVal} ครั้ง`;
                        const code = String(getFuzzyKey(c, ["รหัสคอส", "col_1"]) || '');
                        const displayName = nameStr
                          .replace(/\(\s*\d+\s*ครั้ง\s*\)/g, '')
                          .replace(/\(ซื้อเพิ่มโปร\)/g, '')
                          .trim() || nameStr;

                        return (
                          <div
                            key={c.id || idx}
                            onClick={() => {
                              addToCart(c, 'course');
                              setSelectedGroupedCourse(null);
                              setGroupedCourseFilterTab('all');
                              showToast(`เพิ่ม "${nameStr}" ลงในตะกร้าแล้ว`, 'success');
                            }}
                            className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer shadow-xs hover:shadow-md flex items-center justify-between gap-3 group relative overflow-hidden ${
                              isPromo
                                ? 'border-emerald-100 hover:border-emerald-500 hover:bg-emerald-50/40 bg-white'
                                : 'border-violet-100 hover:border-violet-500 hover:bg-violet-50/40 bg-white'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  isPromo ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-violet-100 text-violet-800 border border-violet-200'
                                }`}>
                                  {sessLabel}
                                </span>
                                {code && <span className="text-[10px] text-slate-400 font-mono">{code}</span>}
                              </div>
                              <h4 className="font-bold text-slate-800 text-sm group-hover:text-violet-700 transition-colors line-clamp-1">
                                {displayName}
                              </h4>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right">
                                <div className={`font-black text-lg sm:text-xl leading-none ${isPromo ? 'text-emerald-600' : 'text-violet-600'}`}>
                                  ฿{price.toLocaleString()}
                                </div>
                              </div>

                              <div className={`p-2 rounded-xl text-white transition-all group-hover:scale-105 shadow-2xs ${
                                isPromo ? 'bg-emerald-600' : 'bg-violet-600'
                              }`}>
                                <Plus size={16} strokeWidth={2.5} />
                              </div>

                              {globalRole === 'owner' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditMasterCoursePrice(e, c);
                                  }}
                                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-violet-100 text-slate-400 hover:text-violet-600 flex items-center justify-center transition-colors"
                                  title="แก้ไขราคาคอร์ส"
                                >
                                  <Edit size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {selectedCourseForUsage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedCourseForUsage(null)}></div>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-teal-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Layers size={18} className="text-teal-600" /> จัดการคอร์ส
              </h3>
              <button onClick={() => setSelectedCourseForUsage(null)} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-full transition-colors"><X size={18} /></button>
            </div>
            
            <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Course Info */}
              <div>
                <div className="text-[10px] font-mono text-teal-600 font-bold mb-1">{String(getFuzzyKey(selectedCourseForUsage, ["รหัสคอส", "col_1"]) || '-')}</div>
                <h4 className="text-lg font-black text-slate-900 leading-tight">{String(getFuzzyKey(selectedCourseForUsage, ["ชื่อคอส", "col_8"]) || '-')}</h4>
              </div>

              {/* Course Owner Info (With quick edit) */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold text-slate-500">เจ้าของคอร์ส</div>
                  <div className="text-xs font-black text-slate-800 truncate flex items-center gap-1.5">
                    <span>{String(getFuzzyKey(selectedCourseForUsage, ["ผู้ซื้อคอส", "col_9"]) || '-')}</span>
                    {(selectedCourseForUsage.isWalkIn || String(getFuzzyKey(selectedCourseForUsage, ["ผู้ซื้อคอส", "col_9"])).includes('Walk-in') || String(getFuzzyKey(selectedCourseForUsage, ["ผู้ซื้อคอส", "col_9"])).includes('ทั่วไป') || String(getFuzzyKey(selectedCourseForUsage, ["เบอร์โทร", "col_1"])) === '-') && (
                      <span className="bg-orange-100 text-orange-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-orange-200 shrink-0">
                        วอคอิน
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {String(getFuzzyKey(selectedCourseForUsage, ["เบอร์โทร", "col_1"]) || '-')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const c = selectedCourseForUsage;
                    const curName = String(getFuzzyKey(c, ["ผู้ซื้อคอส", "col_9"]) || '');
                    const curPhone = String(getFuzzyKey(c, ["เบอร์โทร", "col_1"]) || '');
                    setCourseCustomerFormData({
                      name: curName.includes('Walk-in') || curName.includes('ลูกค้าทั่วไป') ? '' : curName,
                      phone: curPhone === '-' ? '' : curPhone,
                      saveToDb: true
                    });
                    setCourseCustomerModalData(c);
                  }}
                  className="py-1 px-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer"
                >
                  <Edit size={12} className="text-slate-500" />
                  <span>แก้ไขชื่อ-เบอร์</span>
                </button>
              </div>

              {/* Action 1: Use Session */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                 <div className="flex justify-between items-center mb-3">
                    <div>
                       <div className="font-bold text-slate-800">ตัดคอร์ส / รับบริการ</div>
                       <div className="text-xs text-slate-500">ใช้จำนวนครั้งการทำหน้า</div>
                    </div>
                    <div className="text-right">
                       <div className="text-xs text-slate-500">คงเหลือ</div>
                       <div className="font-black text-teal-600">{selectedCourseForUsage.computedStatus === 'ใช้ครบแล้ว' ? 0 : (selectedCourseForUsage.computedTotalQty > 0 ? selectedCourseForUsage.computedTotalQty - selectedCourseForUsage.computedUsedQty : 'ไม่จำกัด')}</div>
                    </div>
                 </div>
                 <div className="flex gap-2">
                   <button 
                     onClick={() => {
                        addCourseToDeduction(selectedCourseForUsage, 1);
                        setCheckoutStep(1);
                        setShowPaymentModal(true);
                        setSelectedCourseForUsage(null);
                     }}
                     disabled={selectedCourseForUsage.computedStatus === 'ใช้ครบแล้ว'}
                     className={`flex-1 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${selectedCourseForUsage.computedStatus === 'ใช้ครบแล้ว' ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-200 active:scale-95'}`}
                   >
                     <Scissors size={18} /> ตัดคอร์สนี้ทันที
                   </button>
                   <button 
                     type="button"
                     onClick={() => {
                        addCourseToDeduction(selectedCourseForUsage, 1);
                        setSelectedCourseForUsage(null);
                     }}
                     disabled={selectedCourseForUsage.computedStatus === 'ใช้ครบแล้ว'}
                     className={`px-3 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border transition-all cursor-pointer ${selectedCourseForUsage.computedStatus === 'ใช้ครบแล้ว' ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed' : 'bg-white hover:bg-teal-50 text-teal-700 border-teal-300 shadow-2xs active:scale-95'}`}
                     title="เพิ่มคอร์สนี้ลงในรายการตัดยอด แล้วเลือกคอร์สอื่นต่อ"
                   >
                     <Plus size={16} /> + เลือกเพิ่ม
                   </button>
                 </div>
              </div>

              {/* Action 2: Claim Items */}
              {(() => {
                 const courseName = String(getFuzzyKey(selectedCourseForUsage, ["ชื่อคอส", "col_8"]) || '');
                 const originalMaster = masterCourses.find(m => String(getFuzzyKey(m, ["ชื่อคอส", "col_4"])) === courseName) || products.find(p => String(getFuzzyKey(p, ["ชื่อสินค้า", "col_4"])) === courseName);

                 let includedItemsRaw = String(getFuzzyKey(selectedCourseForUsage, ["รายการที่ได้รับ", "col_11"]) || '');
                 let hasVip = String(getFuzzyKey(selectedCourseForUsage, ["ฟรีบัตรสมาชิก"]) || '') === 'ใช่';
                 
                 if (!includedItemsRaw && originalMaster) {
                    includedItemsRaw = String(getFuzzyKey(originalMaster, ["รายการที่ได้รับ", "col_11"]) || '');
                 }
                 if (!hasVip && originalMaster) {
                    hasVip = String(getFuzzyKey(originalMaster, ["ฟรีบัตรสมาชิก"]) || '') === 'ใช่';
                 }
                 
                 let items = [];
                 if (includedItemsRaw) {
                    let cleanStr = includedItemsRaw
                        .replace(/สินค้าที่ได้รับ:\s*/g, '')
                        .replace(/คอร์สย่อย\/เสริม:\s*/g, '');

                    let chunks = cleanStr.split('-').map(s => s.trim()).filter(s => s);

                    items = chunks.map(chunk => {
                       let name = chunk;
                       let qty = 1;
                       const match = name.match(/(.*?)\s*(?:\((\d+)\s*(?:ชิ้น|ครั้ง)\)|x\s*(\d+))$/);
                       if (match) {
                          name = match[1].trim();
                          qty = parseInt(match[2] || match[3], 10);
                       }
                       return { original: chunk, name, qty };
                    });
                 }
                 if (hasVip) items.push({ original: 'บัตรสมาชิก VIP', name: 'บัตรสมาชิก VIP', qty: 1 });

                 if (items.length === 0) return null;

                 return (
                    <div>
                       <div className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                          <Package size={18} className="text-pink-500"/> เบิกสินค้า / ของแถม
                       </div>
                       <div className="space-y-2">
                          {items.map((item, idx) => {
                             const cleanItemName = item.name.replace(/\s+/g, '').toLowerCase();
                             const courseHistories = (selectedCourseForUsage.myHistories || (histories || []).filter(h => {
                                const hCourseId = h.courseId;
                                const hCourseRef = String(getFuzzyKey(h, ["เลขที่ใบคอส", "รหัสใบคอส", "อ้างอิง", "col_6"]) || '').trim();
                                const targetNo = String(getFuzzyKey(selectedCourseForUsage, ["เลขที่ใบคอส", "col_2", "col_3", "courseNo"]) || selectedCourseForUsage.id || '').trim();
                                return (hCourseId && hCourseId === selectedCourseForUsage.id) || (targetNo && hCourseRef && hCourseRef === targetNo);
                             }));

                             const cancelledClaimCount = courseHistories.filter(h => {
                                const isCanc = h.isCancelled || String(getFuzzyKey(h, ["สถานะ", "col_7", "col_8", "col_9"]) || '').trim() === 'ยกเลิก';
                                if (!isCanc) return false;
                                const hType = String(getFuzzyKey(h, ["ประเภท", "col_4"]) || '');
                                if (!hType.includes('เบิก')) return false;
                                const hItem = String(getFuzzyKey(h, ["รายการ", "สินค้า", "col_23", "col_18"]) || '').replace(/\s+/g, '').toLowerCase();
                                return hItem.includes(cleanItemName) || cleanItemName.includes(hItem);
                             }).reduce((sum, h) => sum + Math.max(1, parseQty(getFuzzyKey(h, ["จำนวน", "จำนวนที่ใช้", "จำนวนเบิก"])) || 1), 0);

                             const rawClaimedCount = (selectedCourseForUsage.claimedItems || []).filter(c => {
                                const cleanC = String(c || '').replace(/\s+/g, '').toLowerCase();
                                return cleanC.includes(cleanItemName) || cleanItemName.includes(cleanC);
                             }).length;

                             const claimedCount = Math.max(0, rawClaimedCount - cancelledClaimCount);
                             const isClaimed = claimedCount >= item.qty;
                             const autoMatched = findAutoMatchedProduct(item.name, products);
                             const pCode = autoMatched ? String(getFuzzyKey(autoMatched, ["รหัสสินค้า", "col_1"]) || '') : '';
                             const pName = autoMatched ? String(getFuzzyKey(autoMatched, ["ชื่อสินค้า", "col_2"]) || autoMatched.name || '') : '';
                             const currentBranch = normalizeBranchName(globalBranch || 'เฉวง') || 'เฉวง';
                             const bStock = autoMatched ? getBranchStock(autoMatched, currentBranch) : null;

                             return (
                                <div key={idx} className={`flex justify-between items-center p-3 rounded-lg border gap-2 ${isClaimed ? 'bg-slate-50 border-slate-200' : 'bg-white border-pink-100 shadow-sm'}`}>
                                   <div className="min-w-0 flex-1">
                                      <div className={`text-sm ${isClaimed ? 'text-slate-400 line-through' : 'font-semibold text-slate-700'}`}>
                                         {item.name} <span className="text-xs ml-1 text-slate-400 font-normal">(เหลือ {item.qty - claimedCount}/{item.qty})</span>
                                      </div>
                                      {autoMatched && !isClaimed && (
                                         <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5 flex-wrap">
                                            <Package size={11} className="text-emerald-500 shrink-0" />
                                            <span>ตัดสต็อก: {pCode ? `[${pCode}] ` : ''}{pName}</span>
                                            {bStock !== null && (
                                               <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${bStock > 0 ? 'text-slate-600 bg-slate-100' : 'text-rose-600 bg-rose-50'}`}>
                                                  • สาขา{currentBranch}: {bStock} ชิ้น
                                               </span>
                                            )}
                                         </div>
                                      )}
                                   </div>
                                   <button 
                                      onClick={() => {
                                         if (!selectedCustomer && selectedCourseForUsage) {
                                            const cPhone = String(getFuzzyKey(selectedCourseForUsage, ["เบอร์โทร", "col_1", "phone", "customerPhone"]) || '').replace(/[^0-9]/g, '');
                                            if (cPhone) {
                                               const cust = customers.find(c => String(getFuzzyKey(c, ["เบอร์โทร", "col_3", "phone"]) || c.computedPhone || '').replace(/[^0-9]/g, '') === cPhone);
                                               if (cust) setSelectedCustomer(cust);
                                            }
                                         }
                                          // 🌟 ล้างตะกร้าเดิมออก สำหรับการเบิกของแถม เพื่อไม่ให้มีรายการซื้อเดิมหลงเหลือ
                                          setCart([{
                                             id: `claim_${selectedCourseForUsage.id}_${item.name}`,
                                             courseId: selectedCourseForUsage.id,
                                             courseName: String(getFuzzyKey(selectedCourseForUsage, ["ชื่อคอส", "col_8"]) || ''),
                                             originalCourse: selectedCourseForUsage,
                                             name: `[เบิกของแถม] ${item.name}`,
                                             price: 0,
                                             qty: 1,
                                             type: 'claim_item',
                                             actionType: 'claim_item',
                                             isUsage: true,
                                             noCourseCommission: true,
                                             maxQty: item.qty - claimedCount,
                                             itemName: item.name,
                                             linkedProductId: autoMatched?.id || null,
                                             linkedProduct: autoMatched || null,
                                             linkedProductCode: pCode,
                                             linkedProductName: pName
                                          }]);
                                         setCheckoutStep(1);
                                         setShowPaymentModal(true);
                                         setSelectedCourseForUsage(null);
                                      }}
                                      disabled={isClaimed}
                                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${isClaimed ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-pink-100 text-pink-600 hover:bg-pink-200 hover:text-pink-700'}`}
                                   >
                                      {isClaimed ? <><CheckCircle size={14}/> รับครบแล้ว</> : 'เบิก 1 ชิ้น'}
                                   </button>
                                </div>
                             )
                          })}
                       </div>
                    </div>
                 );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>

    {/* 🎁 Modal เลือกสินค้าตัดสต็อกสำหรับของแถม (Gift Product Selector Modal) */}
    {selectingGiftItem && (
      <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
        <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
                <Package size={22} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-800">
                  เลือกสินค้าตัดสต็อกของแถม
                </h3>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                  <span>🎁 ของแถม: <strong className="text-pink-600">{selectingGiftItem.itemName || selectingGiftItem.name}</strong></span>
                  <span>•</span>
                  <span>สาขา: <strong className="text-indigo-600">{normalizeBranchName(globalBranch || 'เฉวง') || 'เฉวง'}</strong></span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectingGiftItem(null)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search Box */}
          <div className="my-3 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={giftProductSearchQuery}
              onChange={(e) => setGiftProductSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อสินค้า หรือรหัสสินค้า (เช่น P801, แป้ง, ผงพอก)..."
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white"
            />
            {giftProductSearchQuery && (
              <button
                type="button"
                onClick={() => setGiftProductSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Option: Do not deduct stock */}
          <div className="mb-2">
            <button
              type="button"
              onClick={() => {
                setCart(prev => prev.map(ci => {
                  if (ci.id === selectingGiftItem.id) {
                    return {
                      ...ci,
                      linkedProductId: null,
                      linkedProduct: null,
                      linkedProductCode: '',
                      linkedProductName: '',
                      skipStockDeduction: true
                    };
                  }
                  return ci;
                }));
                showToast('ตั้งค่าไม่ตัดสต็อกสินค้าสำหรับรายการนี้แล้ว', 'info');
                setSelectingGiftItem(null);
              }}
              className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-between transition-colors border border-dashed border-slate-300"
            >
              <span className="flex items-center gap-1.5">
                <span>🔘</span> ไม่ต้องการตัดสต็อก (เป็นบริการพิเศษ / บัตร VIP / ไม่ใช่วัตถุดิบจริง)
              </span>
              <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                เลือก
              </span>
            </button>
          </div>

          {/* Product List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
            {(() => {
              const currentBranch = normalizeBranchName(globalBranch || 'เฉวง') || 'เฉวง';
              const queryStr = giftProductSearchQuery.trim().toLowerCase();
              const autoBest = findAutoMatchedProduct(selectingGiftItem.itemName || selectingGiftItem.name, products);

              // Filter physical products (exclude courses/services)
              const physicalProducts = products.filter(p => !isServiceOrCourseProduct(p));

              // Filter by query
              let filtered = physicalProducts.filter(p => {
                if (!queryStr) return true;
                const pCode = String(getFuzzyKey(p, ["รหัสสินค้า", "col_1"]) || '').toLowerCase();
                const pName = String(getFuzzyKey(p, ["ชื่อสินค้า", "col_2"]) || p.name || '').toLowerCase();
                return pCode.includes(queryStr) || pName.includes(queryStr);
              });

              // Sort: Put best matching product and products with stock in current branch first
              filtered.sort((a, b) => {
                const aIsBest = autoBest && a.id === autoBest.id ? 1 : 0;
                const bIsBest = autoBest && b.id === autoBest.id ? 1 : 0;
                if (aIsBest !== bIsBest) return bIsBest - aIsBest;

                const aStock = getBranchStock(a, currentBranch);
                const bStock = getBranchStock(b, currentBranch);
                if ((aStock > 0) !== (bStock > 0)) return bStock > 0 ? 1 : -1;
                return bStock - aStock;
              });

              if (filtered.length === 0) {
                return (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    ไม่พบสินค้าที่ตรงกับคำค้นหา
                  </div>
                );
              }

              return filtered.map(prod => {
                const pCode = String(getFuzzyKey(prod, ["รหัสสินค้า", "col_1"]) || '');
                const pName = String(getFuzzyKey(prod, ["ชื่อสินค้า", "col_2"]) || prod.name || '');
                const price = parseNumber(getFuzzyKey(prod, ["ราคาขาย", "ราคา", "col_3"]));
                const bStock = getBranchStock(prod, currentBranch);
                const isSelected = selectingGiftItem.linkedProductId === prod.id || (!selectingGiftItem.linkedProductId && autoBest?.id === prod.id && !selectingGiftItem.skipStockDeduction);
                const isBestMatch = autoBest?.id === prod.id;

                return (
                  <div
                    key={prod.id}
                    onClick={() => {
                      setCart(prev => prev.map(ci => {
                        if (ci.id === selectingGiftItem.id) {
                          return {
                            ...ci,
                            linkedProductId: prod.id,
                            linkedProduct: prod,
                            linkedProductCode: pCode,
                            linkedProductName: pName,
                            skipStockDeduction: false
                          };
                        }
                        return ci;
                      }));
                      showToast(`เลือกตัดสต็อก [${pCode}] ${pName}`, 'success');
                      setSelectingGiftItem(null);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-98 ${
                      isSelected
                        ? 'bg-pink-50/70 border-pink-500 ring-2 ring-pink-200'
                        : 'bg-white border-slate-200 hover:border-pink-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {pCode && (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {pCode}
                          </span>
                        )}
                        <span className="text-xs sm:text-sm font-bold text-slate-800">
                          {pName}
                        </span>
                        {isBestMatch && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 border border-pink-200 flex items-center gap-0.5">
                            <Sparkles size={10} /> แนะนำตรงกับของแถม
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3">
                        <span>ราคา: ฿{price.toLocaleString()}</span>
                        <span className={`font-bold px-2 py-0.5 rounded-md text-[10px] ${
                          bStock >= selectingGiftItem.qty
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : bStock > 0
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          สต็อกสาขา{currentBranch}: {bStock} ชิ้น {bStock < selectingGiftItem.qty && '(ไม่พอ)'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                        isSelected
                          ? 'bg-pink-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-pink-100 hover:text-pink-700'
                      }`}
                    >
                      {isSelected ? 'เลือกแล้ว ✓' : 'เลือกสินค้านี้'}
                    </button>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
    )}
    {pendingCheckInBooking && (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <Calendar size={32} strokeWidth={2.5} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2 text-center">
            พบการจองคิววันนี้
          </h2>
          <p className="text-slate-600 text-sm mb-6 text-center leading-relaxed">
            ลูกค้า <span className="font-bold text-indigo-600">{pendingCheckInBooking.customerName}</span><br />
            มีคิวรับบริการเวลา <span className="font-bold text-slate-800">{pendingCheckInBooking.time}</span><br />
            ต้องการเช็คอินลูกค้าและเปลี่ยนสถานะเป็น <span className="font-bold text-blue-600">กำลังใช้บริการ</span> เลยหรือไม่?
          </p>
          
          <div className="flex w-full gap-3">
            <button 
              onClick={() => setPendingCheckInBooking(null)}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
            >
              ไว้ทีหลัง
            </button>
            <button 
              onClick={async () => {
                 try {
                    const bedNum = window.prompt("ระบุหมายเลขเตียง (1-4) หรือชื่อห้อง:", "1");
                    if (bedNum === null) return; // User cancelled

                    const nowIso = new Date().toISOString();
                    await updateDoc(doc(getCol('bookings'), pendingCheckInBooking.id), {
                       status: 'กำลังใช้บริการ',
                       bedNumber: bedNum,
                       serviceStartTime: nowIso,
                       updatedAt: nowIso
                    });
                    showToast('เช็คอินคิวสำเร็จ!', 'success');
                    setPendingCheckInBooking(null);
                 } catch (e) {
                    console.error("Check-in error:", e);
                    showToast('เกิดข้อผิดพลาดในการเช็คอิน', 'error');
                 }
              }}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-md shadow-blue-200"
            >
              เช็คอินเลย
            </button>
          </div>
        </div>
      </div>
    )}

    <RoomManagementBoard 
        bookings={bookings} 
        orders={orders}
        globalBranch={globalBranch} 
        isOpen={isBedModalOpen} 
        onClose={() => setIsBedModalOpen(false)} 
        onRetrieveParkedOrder={(order) => {
           if (order && order.cartItems) {
               setCart(order.cartItems);
               if (order.discount) {
                  setGlobalDiscount(parseNumber(order.discount));
               }
               setActiveCustomerAppOrderIds(prev => [...new Set([...prev, order.id])]);
               if (order.customerPhone) {
                  const cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');
                  const targetCustomer = customers.find(c => {
                      const phoneRaw = String(getFuzzyKey(c, ["เบอร์โทร", "col_3"]) || '');
                      return phoneRaw.replace(/[^0-9]/g, '') === cleanPhone;
                  });
                  if (targetCustomer) {
                     setSelectedCustomer(targetCustomer);
                  }
               }
           }
           setIsBedModalOpen(false);
        }}
    />
    <TreatmentJobSlipModal
        isOpen={!!printingJobSlipBooking}
        onClose={() => setPrintingJobSlipBooking(null)}
        booking={printingJobSlipBooking}
        appSettings={{}} // POSSystem doesn't have appSettings directly, but we can pass an empty object or retrieve it. Wait, appSettings is not loaded in POSSystem? Yes it is not in the scope directly, but it falls back to 'IRIS CLINIC'
    />
    {/* Quick Custom Price Service Modal (บริการอื่นๆ / จี้ไฝ / ประเมินราคา) */}
    {quickPriceModalItem && (
      <div className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-black text-slate-800">ระบุราคาบริการ</h2>
            <button onClick={() => setQuickPriceModalItem(null)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full"><X size={18} /></button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">ชื่อรายการ / รายละเอียด</label>
              <input
                type="text"
                value={quickPriceModalItem.customName !== undefined ? quickPriceModalItem.customName : (quickPriceModalItem.name || '')}
                onChange={(e) => setQuickPriceModalItem(prev => ({ ...prev, customName: e.target.value }))}
                placeholder="เช่น จี้ไฝ 3 จุด, ประเมินราคา..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                เลือกราคาด่วน (200 - 5,000 บาท):
              </label>
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {[200, 300, 500, 800, 1000, 1500, 2000, 5000].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setQuickPriceModalItem(prev => ({ ...prev, priceInput: String(p) }));
                    }}
                    className={`py-2 px-1 rounded-xl font-black text-xs transition-all border text-center cursor-pointer ${
                      Number(quickPriceModalItem.priceInput) === p
                        ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/25 ring-2 ring-orange-200'
                        : 'bg-orange-50/70 hover:bg-orange-100 text-orange-700 border-orange-200'
                    }`}
                  >
                    ฿{p.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1">ราคา (บาท) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400 font-bold">฿</span>
                  <input
                    type="number"
                    min="0"
                    autoFocus
                    value={quickPriceModalItem.priceInput !== undefined ? quickPriceModalItem.priceInput : ''}
                    onChange={(e) => setQuickPriceModalItem(prev => ({ ...prev, priceInput: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 text-lg font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const finalName = String(quickPriceModalItem.customName ?? quickPriceModalItem.name ?? 'บริการทั่วไป').trim() || 'บริการทั่วไป';
                        const finalPrice = Math.max(0, Number(quickPriceModalItem.priceInput) || 0);
                        const finalQty = Math.max(1, Number(quickPriceModalItem.qtyInput) || 1);
                        setCart(prev => [...prev, {
                          id: `${quickPriceModalItem.id || 'srv'}_${Date.now()}`,
                          name: finalName,
                          price: finalPrice,
                          originalPrice: finalPrice,
                          qty: finalQty,
                          type: quickPriceModalItem.type || 'service',
                          isService: true,
                          noCourseCommission: true,
                          isManualPrice: true
                        }]);
                        showToast(`เพิ่ม "${finalName}" (฿${finalPrice.toLocaleString()}) ลงตะกร้าแล้ว`, 'success');
                        setQuickPriceModalItem(null);
                      }
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">จำนวน</label>
                <input
                  type="number"
                  min="1"
                  value={quickPriceModalItem.qtyInput !== undefined ? quickPriceModalItem.qtyInput : 1}
                  onChange={(e) => setQuickPriceModalItem(prev => ({ ...prev, qtyInput: Math.max(1, parseInt(e.target.value) || 1) }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-lg font-black text-center text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            {quickPriceModalItem.id === 'srv_mole' && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setQuickPriceModalItem(null);
                    setIsMoleRemovalModalOpen(true);
                  }}
                  className="w-full py-2.5 px-3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Sparkles size={15} className="text-amber-300" />
                  <span>เปิดประเมินราคาตามจุด/ขนาด ในระบบจี้ไฝ &rarr;</span>
                </button>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setQuickPriceModalItem(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  const finalName = String(quickPriceModalItem.customName ?? quickPriceModalItem.name ?? 'บริการทั่วไป').trim() || 'บริการทั่วไป';
                  const finalPrice = Math.max(0, Number(quickPriceModalItem.priceInput) || 0);
                  const finalQty = Math.max(1, Number(quickPriceModalItem.qtyInput) || 1);
                  setCart(prev => [...prev, {
                    id: `${quickPriceModalItem.id || 'srv'}_${Date.now()}`,
                    name: finalName,
                    price: finalPrice,
                    originalPrice: finalPrice,
                    qty: finalQty,
                    type: quickPriceModalItem.type || 'service',
                    isService: true,
                    noCourseCommission: true,
                    isManualPrice: true
                  }]);
                  showToast(`เพิ่ม "${finalName}" (฿${finalPrice.toLocaleString()}) ลงตะกร้าแล้ว`, 'success');
                  setQuickPriceModalItem(null);
                }}
                className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-md shadow-orange-200 transition-colors"
              >
                เพิ่มลงตะกร้า
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* 🌟 Mole Removal System Modal from POS 🌟 */}
    {isMoleRemovalModalOpen && (
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
        <div className="relative w-full max-w-5xl h-[92vh] max-h-[850px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/20">
          <MoleRemovalSystem
            customersRaw={customers}
            histories={histories}
            globalBranch={globalBranch}
            triggerToast={showToast}
            initialCustomer={selectedCustomer}
            initialTab={selectedCustomer ? 'evaluate' : 'history'}
            isModal={true}
            onClose={() => setIsMoleRemovalModalOpen(false)}
            onNavigateToPos={(data) => {
              if (data?.customer) {
                setSelectedCustomer(data.customer);
              }
              if (data?.items && data.items.length > 0) {
                setCart(prev => {
                  const newCart = [...prev];
                  data.items.forEach(item => {
                    const existIdx = newCart.findIndex(c => c.id === item.id && c.name === item.name && c.price === item.price);
                    if (existIdx > -1) {
                      newCart[existIdx] = { ...newCart[existIdx], qty: newCart[existIdx].qty + (item.qty || 1) };
                    } else {
                      newCart.push({ ...item });
                    }
                  });
                  return newCart;
                });
                showToast(`เพิ่มรายการประเมินราคา ${data.items.length} รายการลงตะกร้าแล้ว`, 'success');
              }
              setIsMoleRemovalModalOpen(false);
            }}
            onAddCustomer={onAddCustomer}
          />
        </div>
      </div>
    )}

    {/* Edit Course Price Modal */}
    {editingCoursePrice && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800">แก้ไขราคาคอร์ส</h2>
            <button onClick={() => setEditingCoursePrice(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>
          
          <div className="mb-4">
            <p className="text-sm font-medium text-slate-500 mb-2 truncate">
              {editingCoursePrice.name || getFuzzyKey(editingCoursePrice, ["ชื่อคอส", "col_4"])}
            </p>
            <div className="relative">
              <span className="absolute left-3 top-3 text-slate-400 font-bold">฿</span>
              <input 
                type="number"
                value={editingCoursePrice.newPriceStr}
                onChange={(e) => setEditingCoursePrice(prev => ({ ...prev, newPriceStr: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-violet-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitEditMasterCoursePrice();
                }}
              />
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button 
              onClick={() => setEditingCoursePrice(null)}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
            >
              ยกเลิก
            </button>
            <button 
              onClick={submitEditMasterCoursePrice}
              className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold shadow-md shadow-violet-200 transition-colors"
            >
              บันทึกราคา
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Walk-in Customer Quick Register / Edit Info Modal */}
    {isWalkInEditModalOpen && (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
                <WalkingPersonIcon size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">ระบุ / แก้ไขข้อมูลลูกค้า (Walk-in)</h3>
                <p className="text-xs text-slate-500">ให้บริการด่วน และสามารถกลับมาใส่ชื่อ-เบอร์ได้ตลอดเวลา</p>
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => setIsWalkInEditModalOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ชื่อ-นามสกุล หรือชื่อเล่น <span className="text-slate-400 font-normal">(เว้นว่างไว้จะเป็น "ลูกค้าทั่วไป")</span>
              </label>
              <input
                type="text"
                placeholder="เช่น คุณสมหญิง, คุณแอน"
                value={walkInFormData.name}
                onChange={(e) => setWalkInFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                เบอร์โทรศัพท์ <span className="text-slate-400 font-normal">(ใช้ค้นหาคอร์สหรือสะสมยอด)</span>
              </label>
              <input
                type="tel"
                placeholder="08X-XXX-XXXX"
                value={walkInFormData.phone}
                onChange={(e) => setWalkInFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                สิทธิ์ส่วนลดราคา
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setWalkInFormData(prev => ({ ...prev, isMember: false }))}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    !walkInFormData.isMember
                      ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <User size={14} />
                  <span>ลูกค้าทั่วไป (ปกติ)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWalkInFormData(prev => ({ ...prev, isMember: true }))}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    walkInFormData.isMember
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20 font-black'
                      : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <Award size={14} />
                  <span>สิทธิ์ส่วนลดบัตรสมาชิก ⭐</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ปัญหาผิว / ความกังวล / บริการที่ต้องการ <span className="text-slate-400 font-normal">(ถ้ามี)</span>
              </label>
              <input
                type="text"
                placeholder="เช่น สิวอักเสบ, ฝ้ากระ, จี้ไฝ, กดสิว"
                value={walkInFormData.issue}
                onChange={(e) => setWalkInFormData(prev => ({ ...prev, issue: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              />
            </div>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-orange-50/70 border border-orange-100 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={walkInFormData.saveToDb}
                onChange={(e) => setWalkInFormData(prev => ({ ...prev, saveToDb: e.target.checked }))}
                className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
              />
              <span className="text-xs text-slate-700 font-medium">
                บันทึกเป็นประวัติลูกค้าในระบบด้วย (เพื่อให้ค้นหาประวัติและสะสมยอดได้)
              </span>
            </label>
          </div>

          <div className="flex gap-2.5 mt-5">
            <button
              type="button"
              onClick={() => setIsWalkInEditModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSaveWalkInCustomer}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check size={14} />
              <span>บันทึกข้อมูลลูกค้า</span>
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Edit Course Owner Info Modal (For walk-in courses updated later) */}
    {courseCustomerModalData && (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-teal-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
                <Layers size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">ระบุ / อัปเดตเจ้าของคอร์ส</h3>
                <p className="text-xs text-slate-500">เลขที่: {String(getFuzzyKey(courseCustomerModalData, ["เลขที่ใบคอส", "col_2"]) || '-')}</p>
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => setCourseCustomerModalData(null)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-100">
              <div className="text-xs text-teal-700 font-bold">คอร์ส:</div>
              <div className="text-sm font-black text-slate-800">{String(getFuzzyKey(courseCustomerModalData, ["ชื่อคอส", "col_8"]) || '-')}</div>
              <div className="text-xs text-slate-500 mt-1">
                ผู้ซื้อเดิม: <span className="font-semibold text-slate-700">{String(getFuzzyKey(courseCustomerModalData, ["ผู้ซื้อคอส", "col_9"]) || '-')}</span> ({String(getFuzzyKey(courseCustomerModalData, ["เบอร์โทร", "col_1"]) || '-')})
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ชื่อ-นามสกุล ลูกค้าใหม่ *
              </label>
              <input
                type="text"
                placeholder="ระบุชื่อจริง หรือชื่อเล่นลูกค้า"
                value={courseCustomerFormData.name}
                onChange={(e) => setCourseCustomerFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                เบอร์โทรศัพท์ลูกค้า
              </label>
              <input
                type="tel"
                placeholder="08X-XXX-XXXX"
                value={courseCustomerFormData.phone}
                onChange={(e) => setCourseCustomerFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
              />
            </div>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={courseCustomerFormData.saveToDb}
                onChange={(e) => setCourseCustomerFormData(prev => ({ ...prev, saveToDb: e.target.checked }))}
                className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
              />
              <span className="text-xs text-slate-700 font-medium">
                บันทึกเป็นประวัติลูกค้าในระบบด้วย (เพื่อให้ค้นหาจากเบอร์โทรได้ง่ายขึ้น)
              </span>
            </label>
          </div>

          <div className="flex gap-2.5 mt-5">
            <button
              type="button"
              onClick={() => setCourseCustomerModalData(null)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSaveCourseCustomer}
              className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-500/20 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check size={14} />
              <span>บันทึกข้อมูลเจ้าของคอร์ส</span>
            </button>
          </div>
        </div>
      </div>
    )}
    
    <IShipBookingModal 
      isOpen={ishipModal.isOpen} 
      order={{
        orderNo: activeWcOrderId || 'DRAFT',
        customerName: selectedCustomer ? String(getFuzzyKey(selectedCustomer, ["ชื่อ", "col_1"]) || '') : 'ลูกค้าทั่วไป',
        customerPhone: selectedCustomer ? String(getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3"]) || '') : '',
        codAmount: splitPayment.cod > 0 ? splitPayment.cod : 0,
        shippingAddress
      }} 
      onClose={() => setIshipModal({isOpen: false})} 
      onPrintLabel={(address) => {
         const tempReceipt = {
           orderNo: activeWcOrderId || 'DRAFT',
           trackingNo: posTrackingNo || '',
           customerName: selectedCustomer ? String(getFuzzyKey(selectedCustomer, ["ชื่อ", "col_1"]) || '') : 'ลูกค้าทั่วไป',
           customerPhone: selectedCustomer ? String(getFuzzyKey(selectedCustomer, ["เบอร์โทร", "col_3"]) || '') : '',
           createdAt: new Date(),
           splitPayment: { cod: splitPayment.cod > 0 ? splitPayment.cod : 0, cash: 0, transfer: 0, credit: 0 },
           shippingAddress: address || shippingAddress,
           items: [...cart],
         };
         setReceiptData(tempReceipt);
         setPrintMode('label');
         setShowPreviewModal(true);
      }}
      onSubmit={async (data) => {
         if (data && data.trackingNumber) {
            setPosTrackingNo(data.trackingNumber);
            if (data.dstAddress) {
                setShippingAddress(data.dstAddress);
            }
            showToast(`สร้างเลขพัสดุสำเร็จ: ${data.trackingNumber}${data.pickupNote || ''}`, 'success');
         }
         setIshipModal({ isOpen: false });
      }} 
    />
  </>
  );
}
