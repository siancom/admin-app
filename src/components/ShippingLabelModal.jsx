import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Printer, X, Download, FileText, Edit3, Check, QrCode, Loader2, Truck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getFuzzyKey } from '../utils/fuzzy';
import { iShipAPI } from '../utils/iShipAPI';
import Barcode128 from './Barcode128';

const COURIER_LABELS = {
  FlashLive: 'FLASH EXPRESS',
  FlashExpress: 'FLASH EXPRESS',
  FlashExpressA: 'FLASH THUNDER',
  FlashExpressC: 'FLASH EXPRESS',
  FlashExpressD: 'FLASH EXPRESS',
  FlashExpressVIP: 'FLASH EXPRESS VIP',
  FlashLiveBulky: 'FLASH EXPRESS',
  FlashLiveFruit: 'FLASH EXPRESS',
  JntExpress: 'J&T EXPRESS',
  KerryExpress: 'KEX EXPRESS',
  ShopeeExpress: 'SPX EXPRESS',
  THP_eParcelX: 'ไปรษณีย์ไทย (EMS)',
  THP_eParcelZ: 'ไปรษณีย์ไทย (EMS)',
  DHL: 'DHL eCOMMERCE',
  DHLND: 'DHL NEXT DAY',
  BestExpress: 'BEST EXPRESS',
};

function detectCourierLabel(courierCode, trackingNo) {
  if (courierCode && COURIER_LABELS[courierCode]) return COURIER_LABELS[courierCode];
  if (courierCode) return String(courierCode).toUpperCase();
  const trk = String(trackingNo || '').trim().toUpperCase();
  if (trk.startsWith('TH')) return 'FLASH EXPRESS';
  if (/^(82|83|61|62)\d{8,}$/.test(trk)) return 'J&T EXPRESS';
  if (trk.startsWith('KEX') || trk.startsWith('SDOF') || trk.startsWith('KER')) return 'KEX EXPRESS';
  if (trk.startsWith('SPX') || trk.startsWith('TH2')) return 'SPX EXPRESS';
  if (/^[EE|ED|EI|EJ|JB|RP]/i.test(trk) && trk.endsWith('TH')) return 'ไปรษณีย์ไทย (EMS)';
  return 'IRIS EXPRESS';
}

function extractZipcode(text) {
  const m = String(text || '').match(/\b([1-9]\d{4})\b/g);
  return m && m.length > 0 ? m[m.length - 1] : '';
}

function extractOrderItems(order) {
  if (!order) return [];
  if (Array.isArray(order.cartItems) && order.cartItems.length > 0) {
    return order.cartItems.map((it) => ({
      name: String(it.name || it.title || '-'),
      qty: Number(it.qty || it.quantity || 1),
    }));
  }
  if (Array.isArray(order.items) && order.items.length > 0) {
    return order.items.map((it) => ({
      name: String(it.name || it.title || '-'),
      qty: Number(it.qty || it.quantity || 1),
    }));
  }
  const singleName = order.courseName || order.itemName || '';
  if (singleName) {
    // หากชื่อมี " x1" ต่อท้ายอยู่แล้ว ให้แยกออกอย่างสวยงาม
    const m = String(singleName).match(/^(.*?)\s*[xX×]\s*(\d+)\s*$/);
    if (m) {
      return [{ name: m[1].trim(), qty: Number(m[2]) || 1 }];
    }
    return [{ name: String(singleName), qty: Number(order.qty || 1) }];
  }
  return [];
}

export default function ShippingLabelModal({ isOpen, onClose, order, globalBranch = 'เฉวง' }) {
  const labelRef = useRef(null);

  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isDownloadingImg, setIsDownloadingImg] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [qrMode, setQrMode] = useState('tracking'); // 'tracking' | 'url'

  // Editable label state
  const [trackingNo, setTrackingNo] = useState('');
  const [orderNo, setOrderNo] = useState('');
  const [courierTitle, setCourierTitle] = useState('IRIS EXPRESS');
  const [sortCode, setSortCode] = useState('');
  const [dstStoreName, setDstStoreName] = useState('');
  const [codAmount, setCodAmount] = useState(0);

  const [senderName, setSenderName] = useState('ศูนย์ความงามไอริส (Iris Natures)');
  const [senderPhone, setSenderPhone] = useState('0970643249');
  const [senderAddress, setSenderAddress] = useState(`สาขา${globalBranch || 'เฉวง'} ต.บ่อผุด อ.เกาะสมุย จ.สุราษฎร์ธานี`);
  const [senderZip, setSenderZip] = useState('84320');

  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [receiverZip, setReceiverZip] = useState('');

  const items = useMemo(() => extractOrderItems(order), [order]);
  const totalQty = useMemo(() => items.reduce((sum, it) => sum + (Number(it.qty) || 1), 0), [items]);

  useEffect(() => {
    if (!isOpen || !order) return;
    let active = true;
    setIsEditing(false);

    const initTrack = String(order.trackingNo || '').trim();
    const initOrderNo = String(order.orderNo || order.id || '').trim();
    const initCod = Number(order.codAmount ?? order.splitPayment?.cod ?? 0) || 0;
    const initSort = String(order.ishipSortCode || order.ishipSortingLineCode || '').trim();
    const initStore = String(order.ishipDstStoreName || '').trim();

    setTrackingNo(initTrack);
    setOrderNo(initOrderNo);
    setCourierTitle(detectCourierLabel(order.ishipCourier, initTrack));
    setSortCode(initSort);
    setDstStoreName(initStore);
    setCodAmount(initCod);

    const rawAddr = String(order.shippingAddress || '').trim();
    const phoneInAddr = rawAddr.match(/0\d{8,9}/)?.[0] || '';
    const initPhone = String(order.customerPhone || order.phone || phoneInAddr || '').trim();
    const initName = String(order.customerName || 'ลูกค้า').trim();
    const initZip = extractZipcode(rawAddr);

    setReceiverName(initName);
    setReceiverPhone(initPhone);
    setReceiverAddress(rawAddr);
    setReceiverZip(initZip);

    const enrichData = async () => {
      setIsLoadingDetails(true);
      try {
        // 1) ดึงข้อมูลผู้ส่งมาตรฐานจาก Firestore app_settings/shipping
        let savedToken = '';
        try {
          const shipSnap = await getDoc(doc(db, 'app_settings', 'shipping'));
          if (active && shipSnap.exists()) {
            const s = shipSnap.data() || {};
            savedToken = s.ishipToken || '';
            if (s.srcName) setSenderName(s.srcName);
            if (s.srcPhone) setSenderPhone(s.srcPhone);
            const fullSrc = [
              s.srcAddress,
              s.srcDistrict ? `ต.${s.srcDistrict}` : '',
              s.srcAmphure ? `อ.${s.srcAmphure}` : '',
              s.srcProvince ? `จ.${s.srcProvince}` : '',
            ].filter(Boolean).join(' ');
            if (fullSrc) setSenderAddress(fullSrc);
            if (s.srcZipcode) setSenderZip(String(s.srcZipcode));
          }
        } catch (e) {
          console.warn('Load sender settings failed:', e);
        }

        // 2) หากมีเลขพัสดุ iShip ให้ดึงข้อมูลต้นทาง-ปลายทาง-ขนส่งจริงจาก iShip API (เผื่อออเดอร์เก่าที่ยังไม่ได้บันทึกที่อยู่ลงการ์ด)
        let gotIShipAddr = false;
        if (initTrack) {
          try {
            const res = await iShipAPI.getOrderDetails(initTrack, savedToken);
            if (active && res?.status && res?.data) {
              const d = res.data;
              if (d.courier_code) {
                setCourierTitle(detectCourierLabel(d.courier_code, initTrack));
              }
              if (d.cod_amount !== undefined && d.cod_amount !== null) {
                setCodAmount(Number(d.cod_amount) || 0);
              }
              if (d.sort_code || d.sortCode) {
                setSortCode(String(d.sort_code || d.sortCode));
              }
              if (d.dst_name) setReceiverName(String(d.dst_name).trim());
              if (d.dst_phone) setReceiverPhone(String(d.dst_phone).trim());
              const dstFull = [
                d.dst_address ? String(d.dst_address).trim() : '',
                d.dst_district ? `ต.${d.dst_district}` : '',
                (d.dst_area || d.dst_amphure) ? `อ.${d.dst_area || d.dst_amphure}` : '',
                d.dst_province ? `จ.${d.dst_province}` : '',
              ].filter(Boolean).join(' ');
              if (dstFull) {
                setReceiverAddress(dstFull);
                gotIShipAddr = true;
              }
              if (d.dst_zipcode) {
                setReceiverZip(String(d.dst_zipcode).trim());
              }
              if (d.src_name) setSenderName(String(d.src_name).trim());
              if (d.src_phone) setSenderPhone(String(d.src_phone).trim());
              const srcFull = [
                d.src_address ? String(d.src_address).trim() : '',
                d.src_district ? `ต.${d.src_district}` : '',
                (d.src_area || d.src_amphure) ? `อ.${d.src_area || d.src_amphure}` : '',
                d.src_province ? `จ.${d.src_province}` : '',
              ].filter(Boolean).join(' ');
              if (srcFull) setSenderAddress(srcFull);
              if (d.src_zipcode) setSenderZip(String(d.src_zipcode).trim());
            }
          } catch (e) {
            console.warn('Enrich from iShip get_order skipped:', e);
          }
        }

        // 3) หากยังไม่มีที่อยู่ผู้รับ ให้ค้นหาจากฐานข้อมูลลูกค้าอัตโนมัติ
        if (!rawAddr && !gotIShipAddr && initPhone) {
          try {
            const cleanPhone = initPhone.replace(/[^0-9]/g, '');
            if (cleanPhone.length >= 9) {
              let cSnap = await getDocs(query(collection(db, 'customers'), where('เบอร์โทร', '==', cleanPhone)));
              if (cSnap.empty) {
                cSnap = await getDocs(query(collection(db, 'customers'), where('col_3', '==', cleanPhone)));
              }
              if (active && !cSnap.empty) {
                const cData = cSnap.docs[0].data();
                const addr = String(getFuzzyKey(cData, ['ที่อยู่', 'col_4', 'address']) || '').trim();
                const name = String(getFuzzyKey(cData, ['ชื่อ', 'ชื่อลูกค้า', 'col_1']) || '').trim();
                if (name && (!initName || initName === 'ลูกค้า')) setReceiverName(name);
                if (addr) {
                  setReceiverAddress(addr);
                  const z = extractZipcode(addr);
                  if (z) setReceiverZip(z);
                }
              }
            }
          } catch (e) {
            console.warn('Customer address lookup skipped:', e);
          }
        }
      } finally {
        if (active) setIsLoadingDetails(false);
      }
    };

    enrichData();
    return () => { active = false; };
  }, [isOpen, order, globalBranch]);

  if (!isOpen || !order) return null;

  const primaryCode = String(trackingNo || orderNo || 'IRIS0001').trim();
  const qrValue = qrMode === 'url' && trackingNo
    ? `https://t.17track.net/th#nums=${encodeURIComponent(trackingNo.trim())}`
    : primaryCode;

  const orderDateStr = order.createdAt
    ? new Date(order.createdAt).toLocaleString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const handlePrint = () => {
    if (!labelRef.current) return;
    const htmlContent = labelRef.current.outerHTML;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const docWin = iframe.contentWindow;
    const docDom = docWin.document;

    // คัดลอก stylesheet ปัจจุบันเพื่อให้ Tailwind classes ทำงานครบถ้วนคมชัด 100%
    const styleLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((el) => el.outerHTML)
      .join('\n');

    docDom.open();
    docDom.write(`<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <title>Shipping Label - ${primaryCode}</title>
  ${styleLinks}
  <style>
    @page {
      size: 100mm 150mm;
      margin: 0;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100mm !important;
      height: 150mm !important;
      background: #ffffff !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      overflow: hidden !important;
    }
    #iris-thermal-label {
      width: 100mm !important;
      height: 150mm !important;
      max-width: 100mm !important;
      box-sizing: border-box !important;
      margin: 0 !important;
      box-shadow: none !important;
      page-break-inside: avoid !important;
    }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`);
    docDom.close();

    const triggerPrint = () => {
      try {
        docWin.focus();
        docWin.print();
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        }, 1500);
      }
    };

    // รอให้ CSS โหลดเสร็จสั้นๆ แล้วเปิดหน้าต่างพิมพ์ทันที
    setTimeout(triggerPrint, 300);
  };

  const handleDownloadImage = async () => {
    if (!labelRef.current) return;
    setIsDownloadingImg(true);
    try {
      const canvas = await html2canvas(labelRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `label-${primaryCode}.png`;
      a.click();
    } catch (e) {
      alert('ไม่สามารถบันทึกรูปใบแปะหน้าได้: ' + e.message);
    } finally {
      setIsDownloadingImg(false);
    }
  };

  const handleOpenOfficialPdf = () => {
    if (!trackingNo) return;
    window.open(iShipAPI.getOfficialLabelPdfUrl(trackingNo), '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="fixed inset-0 z-[230] flex items-center justify-center p-2 sm:p-4 bg-slate-900/75 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-slate-100 w-full max-w-2xl rounded-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Printer size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-sm sm:text-base leading-tight truncate">
                พิมพ์ใบแปะหน้าพัสดุ (100×150 มม. / A6)
              </h3>
              <p className="text-[11px] text-slate-300 flex items-center gap-2">
                <span>พร้อมบาร์โค้ด Code-128 และ QR Code สแกนได้จริง</span>
                {isLoadingDetails && (
                  <span className="inline-flex items-center gap-1 text-sky-300 font-bold">
                    <Loader2 size={11} className="animate-spin" /> กำลังดึงข้อมูลขนส่ง...
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsEditing((v) => !v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors ${
                isEditing ? 'bg-amber-400 text-slate-900' : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              {isEditing ? <><Check size={14} /> เสร็จสิ้น</> : <><Edit3 size={14} /> แก้ไขข้อความ</>}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* Quick QR Mode & Edit Panel */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-white px-3.5 py-2.5 rounded-2xl border border-slate-200 shadow-sm text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <QrCode size={15} className="text-indigo-600" />
              <span>ข้อมูลใน QR Code:</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setQrMode('tracking')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  qrMode === 'tracking' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                เลขพัสดุ (ยิงสแกนขนส่ง)
              </button>
              <button
                type="button"
                onClick={() => setQrMode('url')}
                disabled={!trackingNo}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors disabled:opacity-40 ${
                  qrMode === 'url' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ลิงก์เช็คพัสดุ (ลูกค้าสแกน)
              </button>
            </div>
          </div>

          {isEditing && (
            <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3.5 space-y-2.5 text-xs">
              <div className="font-black text-amber-900">แก้ไขข้อมูลบนใบแปะหน้าก่อนพิมพ์</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">บริษัทขนส่ง</label>
                  <input value={courierTitle} onChange={(e) => setCourierTitle(e.target.value)} className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">เลขพัสดุ (Tracking)</label>
                  <input value={trackingNo} onChange={(e) => setTrackingNo(e.target.value)} placeholder="เช่น TH0147..." className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg font-mono font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">ยอดเก็บปลายทาง COD (บาท)</label>
                  <input type="number" min="0" value={codAmount} onChange={(e) => setCodAmount(Number(e.target.value) || 0)} className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg font-bold" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">ชื่อผู้รับ</label>
                  <input value={receiverName} onChange={(e) => setReceiverName(e.target.value)} className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">เบอร์โทรผู้รับ</label>
                  <input value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">รหัสไปรษณีย์ปลายทาง</label>
                  <input value={receiverZip} onChange={(e) => setReceiverZip(e.target.value)} className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg font-bold tracking-widest" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">ที่อยู่ผู้รับ</label>
                <textarea rows={2} value={receiverAddress} onChange={(e) => setReceiverAddress(e.target.value)} className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg font-medium" />
              </div>
            </div>
          )}

          {/* Thermal Label Preview Area (Exact 100mm x 150mm proportion) */}
          <div className="flex justify-center overflow-x-auto py-1">
            <div
              id="iris-thermal-label"
              ref={labelRef}
              className="w-[100mm] min-h-[150mm] bg-white text-black border-2 border-black p-3 flex flex-col justify-between box-border shadow-xl font-sans select-text"
              style={{ width: '100mm', minHeight: '150mm' }}
            >
              {/* 1. Top Header: Courier + Sort Code + COD/PAID Badge */}
              <div>
                <div className="flex items-stretch justify-between border-b-2 border-black pb-2 gap-2">
                  <div className="flex flex-col justify-between min-w-0">
                    <div className="inline-flex items-center gap-1.5">
                      <span className="bg-black text-white font-black text-xs px-2 py-0.5 tracking-wide uppercase">
                        {courierTitle}
                      </span>
                      {sortCode && (
                        <span className="border-2 border-black font-mono font-black text-xs px-1.5 py-0.5">
                          {sortCode}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-bold mt-1 text-black leading-tight">
                      IRIS NATURES • สาขา{order.branch || globalBranch || 'เฉวง'}
                      {dstStoreName ? ` • [${dstStoreName}]` : ''}
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end justify-center">
                    <div className={`font-black text-xl leading-none px-2.5 py-1 border-2 border-black ${codAmount > 0 ? 'bg-black text-white' : 'bg-white text-black'}`}>
                      {codAmount > 0 ? 'COD' : 'PAID'}
                    </div>
                    {codAmount > 0 ? (
                      <div className="text-xs font-black mt-0.5">
                        เก็บเงิน ฿{Number(codAmount).toLocaleString()}
                      </div>
                    ) : (
                      <div className="text-[9px] font-bold mt-0.5">ไม่ต้องเก็บเงิน</div>
                    )}
                  </div>
                </div>

                {/* 2. Primary 1D Code-128 Barcode (Tracking Number or Order No) */}
                <div className="py-2.5 px-1 border-b-2 border-black bg-white">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-center mb-1">
                    {trackingNo ? 'TRACKING NO. (เลขพัสดุ)' : 'ORDER REF. (เลขอ้างอิงคำสั่งซื้อ)'}
                  </div>
                  <Barcode128
                    value={primaryCode}
                    height={54}
                    showText={true}
                    textClassName="text-sm font-mono font-black tracking-[0.18em] mt-1 text-black leading-none"
                  />
                </div>

                {/* 3. Sender Section (ผู้ส่ง) */}
                <div className="py-2 border-b-2 border-black text-[11px] leading-snug">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-black text-xs underline">ผู้ส่ง (FROM):</span>
                    <span className="font-mono font-black text-xs">{senderZip}</span>
                  </div>
                  <div className="font-bold mt-0.5">
                    {senderName} {senderPhone && <span className="font-mono">({senderPhone})</span>}
                  </div>
                  <div className="text-[10px] font-medium leading-tight mt-0.5">
                    {senderAddress} {senderZip}
                  </div>
                </div>

                {/* 4. Receiver Section (ผู้รับ) + Real 2D QR Code */}
                <div className="py-2.5 border-b-2 border-black flex items-start justify-between gap-2.5 min-h-[42mm]">
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                    <div>
                      <div className="font-black text-xs underline mb-1">ผู้รับ (TO):</div>
                      <div className="font-black text-base leading-tight break-words">
                        {receiverName || 'ไม่ระบุชื่อผู้รับ'}
                      </div>
                      {receiverPhone && (
                        <div className="font-mono font-black text-sm mt-0.5">
                          โทร: {receiverPhone}
                        </div>
                      )}
                      <div className="text-xs font-bold leading-snug mt-1.5 whitespace-pre-wrap break-words">
                        {receiverAddress || <span className="italic font-normal text-gray-500">(ยังไม่ได้ระบุที่อยู่จัดส่ง — กดปุ่ม &quot;แก้ไขข้อความ&quot; ด้านบนเพื่อกรอกเพิ่มเติม)</span>}
                      </div>
                    </div>

                    {receiverZip && (
                      <div className="mt-2 inline-flex items-center gap-1.5">
                        <span className="text-[10px] font-bold">รหัสไปรษณีย์:</span>
                        <span className="border-2 border-black px-2 py-0.5 font-mono font-black text-base tracking-[0.2em] leading-none">
                          {receiverZip}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Real Scannable 2D QR Code */}
                  <div className="shrink-0 flex flex-col items-center border-2 border-black p-1.5 bg-white">
                    <QRCodeSVG
                      value={qrValue}
                      size={84}
                      level="M"
                      includeMargin={false}
                    />
                    <span className="text-[8px] font-mono font-black mt-1 tracking-tight text-center max-w-[84px] truncate">
                      {qrMode === 'url' && trackingNo ? 'SCAN TRACKING' : primaryCode}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. Items List & Footer Order Barcode */}
              <div className="pt-2 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center justify-between text-[10px] font-black mb-1">
                    <span>รายการสินค้า ({items.length} รายการ / รวม {totalQty} ชิ้น)</span>
                    <span className="font-mono">#{orderNo || '-'}</span>
                  </div>
                  <div className="space-y-0.5 text-[11px] font-bold leading-tight max-h-[24mm] overflow-hidden">
                    {items.length > 0 ? (
                      items.map((it, idx) => (
                        <div key={idx} className="flex justify-between gap-2">
                          <span className="truncate">{idx + 1}. {it.name}</span>
                          <span className="font-mono font-black shrink-0">x{it.qty}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-[10px] text-gray-600">ผลิตภัณฑ์ดูแลผิว IrisCare</div>
                    )}
                  </div>
                </div>

                {/* Secondary Order Reference Barcode + Timestamp Footer */}
                <div className="mt-2 pt-1.5 border-t border-dashed border-black flex items-end justify-between gap-2">
                  <div className="text-[9px] font-semibold leading-tight">
                    <div>วันที่: {orderDateStr}</div>
                    <div>กรุณาถ่ายวิดีโอขณะเปิดกล่องพัสดุ</div>
                  </div>
                  {trackingNo && orderNo && trackingNo !== orderNo && (
                    <div className="w-[38mm] shrink-0">
                      <Barcode128
                        value={orderNo}
                        height={22}
                        showText={true}
                        textClassName="text-[8px] font-mono font-bold tracking-wider mt-0.5 text-black leading-none text-center"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="bg-white border-t border-slate-200 px-4 sm:px-5 py-3.5 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {trackingNo && (
              <button
                type="button"
                onClick={handleOpenOfficialPdf}
                className="px-3.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <FileText size={15} /> เปิด PDF ขนส่งจริง (iShip)
              </button>
            )}
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isDownloadingImg}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              {isDownloadingImg ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              บันทึกรูป (.PNG)
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-colors"
            >
              ปิด
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-colors"
            >
              <Printer size={17} /> สั่งพิมพ์ใบแปะหน้า
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

