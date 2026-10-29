import React, { useState, useEffect } from 'react';
import { Package, Truck, X, Loader2, Search, Settings, CheckCircle, KeyRound, AlertCircle } from 'lucide-react';
import { iShipAPI } from '../utils/iShipAPI';
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getFuzzyKey } from '../utils/fuzzy';
import { ThailandAddressTypeahead, ThailandAddressValue } from 'react-thailand-address-typeahead';
import { parseThaiAddress } from '../utils/thaiAddress';

const DEFAULT_COURIERS = [
  { code: 'FlashLive', name: 'Flash Express (Flash Pro OK)' },
  { code: 'FlashExpress', name: 'Flash Express (มาตรฐาน)' },
  { code: 'FlashExpressA', name: 'Flash Thunder' },
  { code: 'FlashExpressVIP', name: 'iShip Exclusive (Flash VIP)' },
  { code: 'JntExpress', name: 'J&T Express' },
  { code: 'KerryExpress', name: 'KEX Express (Kerry)' },
  { code: 'ShopeeExpress', name: 'SPX Express' },
  { code: 'THP_eParcelX', name: 'ไปรษณีย์ไทย (EMS)' },
  { code: 'DHL', name: 'DHL eCommerce' },
  { code: 'BestExpress', name: 'Best Express' },
];

const DEFAULT_SENDER = {
  srcName: 'ศูนย์ความงามไอริส (Iris Natures)',
  srcPhone: '0970643249',
  srcAddress: 'สาขาเฉวง เกาะสมุย',
  srcDistrict: 'บ่อผุด',
  srcAmphure: 'เกาะสมุย',
  srcProvince: 'สุราษฎร์ธานี',
  srcZipcode: '84320',
};

export default function IShipBookingModal({ isOpen, onClose, order, onSubmit, onPrintLabel }) {
  const [weight, setWeight] = useState('1'); // kg
  const [width, setWidth] = useState('14'); // cm
  const [length, setLength] = useState('20'); // cm
  const [height, setHeight] = useState('6'); // cm
  const [courier, setCourier] = useState('FlashLive');
  const [courierOptions, setCourierOptions] = useState(DEFAULT_COURIERS);

  // Destination Info
  const [dstName, setDstName] = useState('');
  const [dstPhone, setDstPhone] = useState('');
  const [dstAddress, setDstAddress] = useState('');
  const [dstDistrict, setDstDistrict] = useState('');
  const [dstAmphure, setDstAmphure] = useState('');
  const [dstProvince, setDstProvince] = useState('');
  const [dstZipcode, setDstZipcode] = useState('');
  const [addrVal, setAddrVal] = useState(ThailandAddressValue.empty());

  // Sender & Auth Settings (stored in Firestore app_settings/shipping)
  const [showSettings, setShowSettings] = useState(false);
  const [ishipToken, setIshipToken] = useState('');
  const [ishipPhone, setIshipPhone] = useState('');
  const [ishipPassword, setIshipPassword] = useState('');
  const [sender, setSender] = useState(DEFAULT_SENDER);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isLoggingInIShip, setIsLoggingInIShip] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCallingPickupOnly, setIsCallingPickupOnly] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [codAmount, setCodAmount] = useState('0');
  const [autoCallPickup, setAutoCallPickup] = useState(true);
  const [errorBanner, setErrorBanner] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  // Load shipping settings from Firestore when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setErrorBanner('');
    setSuccessBanner('');
    let active = true;

    const loadSettings = async () => {
      try {
        const snap = await getDoc(doc(db, 'app_settings', 'shipping'));
        if (!active) return;
        if (snap.exists()) {
          const data = snap.data() || {};
          if (data.ishipToken) setIshipToken(data.ishipToken);
          if (data.ishipPhone) setIshipPhone(data.ishipPhone);
          if (data.ishipPassword) setIshipPassword(data.ishipPassword);
          if (data.defaultCourier) setCourier(data.defaultCourier);
          setSender({
            srcName: data.srcName || DEFAULT_SENDER.srcName,
            srcPhone: data.srcPhone || DEFAULT_SENDER.srcPhone,
            srcAddress: data.srcAddress || DEFAULT_SENDER.srcAddress,
            srcDistrict: data.srcDistrict || DEFAULT_SENDER.srcDistrict,
            srcAmphure: data.srcAmphure || DEFAULT_SENDER.srcAmphure,
            srcProvince: data.srcProvince || DEFAULT_SENDER.srcProvince,
            srcZipcode: data.srcZipcode || DEFAULT_SENDER.srcZipcode,
          });

          if (data.ishipToken) {
            iShipAPI.getCourierCodes(data.ishipToken)
              .then((res) => {
                if (!active) return;
                if (res?.status && Array.isArray(res.data) && res.data.length > 0) {
                  setCourierOptions(res.data.map(c => ({ code: c.code, name: `${c.name} (${c.code})` })));
                }
              })
              .catch(() => {});
          } else {
            setShowSettings(true);
          }
        } else {
          setShowSettings(true);
        }
      } catch (e) {
        console.warn('Failed to load iShip settings:', e);
      }
    };

    loadSettings();
    return () => { active = false; };
  }, [isOpen]);

  // Sync order details into destination inputs when modal opens
  useEffect(() => {
    if (!isOpen || !order) return;
    const initialName = order.customerName && order.customerName !== 'ลูกค้าทั่วไป' ? order.customerName : '';
    const rawAddr = String(order.shippingAddress || '');
    const phoneMatch = rawAddr.match(/0\d{8,9}/);
    const initialPhone = order.customerPhone || order.phone || (phoneMatch ? phoneMatch[0] : '');

    setDstName(initialName);
    setDstPhone(initialPhone);
    setDstAddress(rawAddr);
    setCodAmount(String(order.codAmount ?? order.splitPayment?.cod ?? 0));

    if (rawAddr && rawAddr.length > 8) {
      parseThaiAddress(rawAddr)
        .then((parsed) => {
          if (parsed.zipcode) setDstZipcode(parsed.zipcode);
          if (parsed.province) setDstProvince(parsed.province);
          if (parsed.amphure) setDstAmphure(parsed.amphure);
          if (parsed.district) setDstDistrict(parsed.district);
          if (parsed.zipcode || parsed.province || parsed.amphure || parsed.district) {
            setAddrVal({
              subdistrict: parsed.district || '',
              district: parsed.amphure || '',
              province: parsed.province || '',
              postalCode: parsed.zipcode || '',
            });
          }
        })
        .catch(() => {});
    }
  }, [isOpen, order?.orderNo, order?.customerName, order?.customerPhone, order?.shippingAddress]);

  if (!isOpen || !order) return null;

  const handleIShipLogin = async () => {
    if (!ishipPhone || !ishipPassword) {
      setErrorBanner('กรุณากรอกเบอร์โทรศัพท์และรหัสผ่านบัญชี iShip');
      return;
    }
    setIsLoggingInIShip(true);
    setErrorBanner('');
    setSuccessBanner('');
    try {
      const res = await iShipAPI.requestToken(ishipPhone, ishipPassword);
      const newToken = res?.data?.accessToken;
      if (!newToken) {
        throw new Error(res?.message || res?.msg || 'เบอร์โทรศัพท์หรือรหัสผ่าน iShip ไม่ถูกต้อง');
      }
      setIshipToken(newToken);
      await setDoc(doc(db, 'app_settings', 'shipping'), {
        ishipToken: newToken,
        ishipPhone: String(ishipPhone).replace(/[^0-9]/g, ''),
        ishipPassword,
        ...sender,
        defaultCourier: courier,
        tokenUpdatedAt: new Date().toISOString(),
      }, { merge: true });

      setSuccessBanner('เชื่อมต่อบัญชี iShip และบันทึกข้อมูลผู้ส่งสำเร็จ! สามารถกดจองขนส่งได้เลยครับ');
      setShowSettings(false);

      // Load active couriers for this account
      iShipAPI.getCourierCodes(newToken)
        .then((cRes) => {
          if (cRes?.status && Array.isArray(cRes.data) && cRes.data.length > 0) {
            setCourierOptions(cRes.data.map(c => ({ code: c.code, name: `${c.name} (${c.code})` })));
          }
        })
        .catch(() => {});
    } catch (err) {
      setErrorBanner('เข้าสู่ระบบ iShip ไม่สำเร็จ: ' + (err.message || 'กรุณาตรวจสอบเบอร์โทรและรหัสผ่าน'));
    } finally {
      setIsLoggingInIShip(false);
    }
  };

  const handleSaveSettingsOnly = async () => {
    setIsSavingSettings(true);
    setErrorBanner('');
    setSuccessBanner('');
    try {
      await setDoc(doc(db, 'app_settings', 'shipping'), {
        ishipToken: String(ishipToken || '').trim(),
        ishipPhone: String(ishipPhone || '').replace(/[^0-9]/g, ''),
        ...(ishipPassword ? { ishipPassword } : {}),
        ...sender,
        defaultCourier: courier,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      setSuccessBanner('บันทึกการตั้งค่าผู้ส่งและ Token สำเร็จ');
      if (ishipToken) setShowSettings(false);
    } catch (err) {
      setErrorBanner('บันทึกการตั้งค่าไม่สำเร็จ: ' + err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const searchAddressByPhone = async () => {
    const cleanPhone = String(dstPhone || '').replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      alert('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง');
      return;
    }
    setIsSearching(true);
    try {
      const q = query(collection(db, 'customers'), where('เบอร์โทร', '==', cleanPhone));
      const q2 = query(collection(db, 'customers'), where('col_3', '==', cleanPhone));

      let snap = await getDocs(q);
      if (snap.empty) {
        snap = await getDocs(q2);
      }

      if (!snap.empty) {
        const customer = snap.docs[0].data();
        const name = String(getFuzzyKey(customer, ['ชื่อ', 'ชื่อลูกค้า', 'col_1']) || '');
        const phone = String(getFuzzyKey(customer, ['เบอร์โทร', 'เบอร์โทรลูกค้า', 'col_3']) || cleanPhone);
        const addr = String(getFuzzyKey(customer, ['ที่อยู่', 'col_4', 'address']) || '');

        if (name) setDstName(name);
        if (phone) setDstPhone(phone);

        const fullAddressText = addr || `${name} ${phone}`.trim();
        if (fullAddressText.length > 5) {
          const parsedAddress = await parseThaiAddress(fullAddressText);
          if (parsedAddress.zipcode) setDstZipcode(parsedAddress.zipcode);
          if (parsedAddress.province) setDstProvince(parsedAddress.province);
          if (parsedAddress.amphure) setDstAmphure(parsedAddress.amphure);
          if (parsedAddress.district) setDstDistrict(parsedAddress.district);

          setDstAddress(addr || fullAddressText);
          setAddrVal({
            subdistrict: parsedAddress.district || '',
            district: parsedAddress.amphure || '',
            province: parsedAddress.province || '',
            postalCode: parsedAddress.zipcode || '',
          });
          setSuccessBanner('ดึงข้อมูลที่อยู่ลูกค้าสำเร็จ กรุณาตรวจสอบความถูกต้อง');
        } else {
          setErrorBanner('พบข้อมูลลูกค้าแต่ยังไม่มีที่อยู่ในระบบ');
        }
      } else {
        setErrorBanner('ไม่พบประวัติลูกค้าจากเบอร์โทรศัพท์นี้');
      }
    } catch (e) {
      console.error(e);
      setErrorBanner('เกิดข้อผิดพลาดในการค้นหาข้อมูลลูกค้า');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCallPickupOnly = async () => {
    setErrorBanner('');
    setSuccessBanner('');
    if (!ishipToken) {
      setShowSettings(true);
      setErrorBanner('กรุณาเข้าสู่ระบบบัญชี iShip ด้านบนก่อนกดเรียกรถเข้ารับพัสดุครับ');
      return;
    }
    setIsCallingPickupOnly(true);
    try {
      const pickupAddress = `${sender.srcAddress} ต.${sender.srcDistrict} อ.${sender.srcAmphure} จ.${sender.srcProvince} ${sender.srcZipcode}`.trim();
      const pickupRes = await iShipAPI.requestCourier({
        courier_code: courier,
        pickup_address: pickupAddress,
        name: sender.srcName || 'Iris Natures',
        phone: String(sender.srcPhone || '').replace(/[^0-9]/g, ''),
        parcel: 1,
        remark: 'รับพัสดุหน้าร้านคลินิก',
        flash_staff_info: '',
      }, ishipToken);

      if (pickupRes && pickupRes.status === false) {
        throw new Error(pickupRes.msg || pickupRes.message || JSON.stringify(pickupRes));
      }
      setSuccessBanner(pickupRes?.msg || pickupRes?.message || 'เรียกรถขนส่งเข้ารับพัสดุสำเร็จ!');
    } catch (err) {
      if (err.isUnauthenticated) {
        setShowSettings(true);
        setErrorBanner('กรุณาเข้าสู่ระบบบัญชี iShip (เบอร์โทร + รหัสผ่าน) เพื่อรับ Token ใหม่ก่อนเรียกรถครับ');
      } else {
        setErrorBanner('เรียกรถไม่สำเร็จ: ' + (err.message || 'กรุณาตรวจสอบข้อมูลผู้ส่งหรือขนส่งที่เลือก'));
      }
    } finally {
      setIsCallingPickupOnly(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorBanner('');
    setSuccessBanner('');

    if (!ishipToken) {
      setShowSettings(true);
      setErrorBanner('กรุณาเข้าสู่ระบบบัญชี iShip (เบอร์โทร + รหัสผ่าน) ครั้งแรกก่อนกดจองขนส่งครับ');
      return;
    }

    if (!dstDistrict || !dstAmphure || !dstProvince || !dstZipcode) {
      setErrorBanner('กรุณาระบุ ตำบล/แขวง, อำเภอ/เขต, จังหวัด และรหัสไปรษณีย์ปลายทางให้ครบถ้วน');
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanDstPhone = String(dstPhone || '').replace(/[^0-9]/g, '');
      const cleanSrcPhone = String(sender.srcPhone || '0970643249').replace(/[^0-9]/g, '');
      const codVal = parseFloat(codAmount || 0) || 0;

      const payload = {
        platform_name: 'IRIS_ADMIN',
        courier_code: courier,
        custom_order_id: order.orderNo && order.orderNo !== 'DRAFT' ? String(order.orderNo) : null,
        src_name: sender.srcName || DEFAULT_SENDER.srcName,
        src_phone: cleanSrcPhone,
        src_address: sender.srcAddress || DEFAULT_SENDER.srcAddress,
        src_district: sender.srcDistrict || DEFAULT_SENDER.srcDistrict,
        src_amphure: sender.srcAmphure || DEFAULT_SENDER.srcAmphure,
        src_province: sender.srcProvince || DEFAULT_SENDER.srcProvince,
        src_zipcode: String(sender.srcZipcode || DEFAULT_SENDER.srcZipcode).trim(),
        dst_name: dstName || order.customerName || 'ลูกค้า',
        dst_phone: cleanDstPhone,
        dst_address: dstAddress || '-',
        dst_district: dstDistrict,
        dst_amphure: dstAmphure,
        dst_province: dstProvince,
        dst_zipcode: String(dstZipcode).trim(),
        weight: parseFloat(weight) || 1,
        width: parseFloat(width) || 14,
        length: parseFloat(length) || 20,
        height: parseFloat(height) || 6,
        cod_amount: codVal,
        category_id: 3,
        remark: 'ระวังแตก',
      };

      if (codVal > 0) {
        payload.products = [
          {
            product_name: 'ผลิตภัณฑ์ดูแลผิว IrisCare',
            product_length: String(length || '20'),
            product_width: String(width || '14'),
            product_height: String(height || '6'),
            product_weight: parseFloat(weight) || 0.5,
            product_qty: 1,
            product_color: '-',
            product_price: codVal,
          },
        ];
      }

      const apiResult = await iShipAPI.createOrder(payload, ishipToken);

      if (!apiResult || apiResult.status === false) {
        throw new Error(apiResult?.message || apiResult?.msg || JSON.stringify(apiResult));
      }

      const trackingNumber = apiResult?.data?.tracking_number || apiResult?.data?.track_no || '';
      if (!trackingNumber) {
        throw new Error('ระบบ iShip ไม่ได้ส่งเลขพัสดุกลับมา: ' + JSON.stringify(apiResult));
      }

      // หากเลือกเรียกรถเข้ารับทันที ให้สั่ง request_courier ต่อเลย
      let pickupNote = '';
      if (autoCallPickup) {
        try {
          const pickupAddress = `${payload.src_address} ต.${payload.src_district} อ.${payload.src_amphure} จ.${payload.src_province} ${payload.src_zipcode}`.trim();
          const pickupRes = await iShipAPI.requestCourier({
            courier_code: courier,
            pickup_address: pickupAddress,
            name: payload.src_name,
            phone: cleanSrcPhone,
            parcel: 1,
            remark: `เลขพัสดุ ${trackingNumber}`,
            flash_staff_info: '',
          }, ishipToken);
          if (pickupRes?.status) {
            pickupNote = ' (เรียกรถเข้ารับสำเร็จ)';
          } else if (pickupRes?.msg || pickupRes?.message) {
            pickupNote = ` (หมายเหตุเรียกรถ: ${pickupRes.msg || pickupRes.message})`;
          }
        } catch (pickupErr) {
          console.warn('Auto pickup warning:', pickupErr);
        }
      }

      await onSubmit({
        weight: parseFloat(weight),
        width: parseFloat(width),
        length: parseFloat(length),
        height: parseFloat(height),
        courier,
        codAmount: codVal,
        trackingNumber,
        pickupNote,
        rawApiResult: apiResult,
        dstAddress: dstAddress ? `${dstName ? dstName + ' ' : ''}${cleanDstPhone ? cleanDstPhone + '\n' : ''}${dstAddress}\nต.${dstDistrict} อ.${dstAmphure} จ.${dstProvince} ${dstZipcode}` : '',
      });
    } catch (apiErr) {
      console.error('iShip API Error:', apiErr);
      if (apiErr.isUnauthenticated) {
        setShowSettings(true);
        setErrorBanner('บัญชี iShip ยังไม่ได้เข้าสู่ระบบ หรือ Token หมดอายุ — กรุณากรอกเบอร์โทรและรหัสผ่านบัญชี iShip ด้านบนเพื่อเชื่อมต่อใหม่ครับ');
      } else {
        setErrorBanner('iShip แจ้งเตือน: ' + (apiErr.message || 'ไม่สามารถสร้างรายการจัดส่งได้ กรุณาตรวจสอบข้อมูลและยอดเงินใน iShip'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg max-h-[92vh] rounded-[28px] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-5 py-4 text-white relative shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shrink-0">
                <Package size={22} className="text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-lg leading-tight">เรียกขนส่ง (iShip)</h3>
                <p className="text-xs font-medium opacity-90 flex items-center gap-1.5 mt-0.5">
                  {ishipToken ? (
                    <span className="inline-flex items-center gap-1 bg-emerald-400/25 border border-white/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      <CheckCircle size={11} /> เชื่อมต่อ Token แล้ว
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-amber-400/30 border border-white/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      <AlertCircle size={11} /> ยังไม่ได้ผูกบัญชี iShip
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowSettings(s => !s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors ${showSettings ? 'bg-white text-blue-600 shadow-sm' : 'bg-white/20 hover:bg-white/30 text-white'}`}
              >
                <Settings size={14} /> ตั้งค่า
              </button>
              <button type="button" onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4">
          {errorBanner && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
              <span>{errorBanner}</span>
            </div>
          )}

          {successBanner && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-start gap-2">
              <CheckCircle size={16} className="shrink-0 mt-0.5 text-emerald-500" />
              <span>{successBanner}</span>
            </div>
          )}

          {/* Collapsible iShip Account & Sender Settings */}
          {showSettings && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                  <KeyRound size={15} className="text-blue-600" /> เชื่อมต่อบัญชี iShip (app.iship.cloud)
                </div>
                <button type="button" onClick={() => setShowSettings(false)} className="text-[11px] font-bold text-blue-600 hover:underline">
                  ซ่อนหน้าต่างนี้
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">เบอร์โทรบัญชี iShip</label>
                  <input
                    type="tel"
                    value={ishipPhone}
                    onChange={e => setIshipPhone(e.target.value)}
                    placeholder="08X-XXX-XXXX"
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs font-bold outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">รหัสผ่านบัญชี iShip</label>
                  <input
                    type="password"
                    value={ishipPassword}
                    onChange={e => setIshipPassword(e.target.value)}
                    placeholder="รหัสผ่านเข้าเว็บ iShip"
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs font-bold outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleIShipLogin}
                disabled={isLoggingInIShip}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                {isLoggingInIShip ? <><Loader2 size={14} className="animate-spin" /> กำลังเชื่อมต่อ iShip...</> : 'เข้าสู่ระบบ iShip & รับ Token อัตโนมัติ'}
              </button>

              <div className="border-t border-blue-200/70 pt-3 space-y-2.5">
                <div className="text-[11px] font-black text-slate-700">ข้อมูลผู้ส่งต้นทาง (จุดให้รถเข้ารับพัสดุ)</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">ชื่อผู้ส่ง/ร้านค้า</label>
                    <input type="text" value={sender.srcName} onChange={e => setSender({ ...sender, srcName: e.target.value })} className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">เบอร์โทรผู้ส่ง</label>
                    <input type="tel" value={sender.srcPhone} onChange={e => setSender({ ...sender, srcPhone: e.target.value })} className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">บ้านเลขที่ / ถนน / สาขา</label>
                  <input type="text" value={sender.srcAddress} onChange={e => setSender({ ...sender, srcAddress: e.target.value })} className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">ตำบล/แขวง</label>
                    <input type="text" value={sender.srcDistrict} onChange={e => setSender({ ...sender, srcDistrict: e.target.value })} className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">อำเภอ/เขต</label>
                    <input type="text" value={sender.srcAmphure} onChange={e => setSender({ ...sender, srcAmphure: e.target.value })} className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">จังหวัด</label>
                    <input type="text" value={sender.srcProvince} onChange={e => setSender({ ...sender, srcProvince: e.target.value })} className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">รหัสไปรษณีย์</label>
                    <input type="text" value={sender.srcZipcode} onChange={e => setSender({ ...sender, srcZipcode: e.target.value })} className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">หรือวาง Bearer Token โดยตรง (ถ้ามี)</label>
                  <input type="text" value={ishipToken} onChange={e => setIshipToken(e.target.value)} placeholder="Bearer Token จาก iShip" className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-mono" />
                </div>
                <button
                  type="button"
                  onClick={handleSaveSettingsOnly}
                  disabled={isSavingSettings}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  {isSavingSettings ? 'กำลังบันทึก...' : 'บันทึกที่อยู่ผู้ส่ง & Token'}
                </button>
              </div>
            </div>
          )}

          {/* Destination Info */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <p className="text-sm font-black text-gray-800 mb-3">ข้อมูลผู้รับ (ปลายทาง)</p>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">ชื่อผู้รับ <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={dstName}
                    onChange={(e) => setDstName(e.target.value)}
                    required
                    placeholder="ชื่อ-นามสกุลผู้รับ"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm font-bold text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={dstPhone}
                      onChange={(e) => setDstPhone(e.target.value)}
                      required
                      placeholder="08X-XXX-XXXX"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm font-bold"
                    />
                    <button
                      type="button"
                      onClick={searchAddressByPhone}
                      disabled={isSearching}
                      title="ค้นหาที่อยู่จากเบอร์โทร"
                      className="px-3 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 rounded-lg font-bold flex items-center justify-center transition-colors shrink-0 disabled:opacity-50 shadow-sm"
                    >
                      {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">ที่อยู่ (บ้านเลขที่, ซอย, ถนน) <span className="text-red-500">*</span></label>
                <textarea
                  value={dstAddress}
                  onChange={(e) => setDstAddress(e.target.value)}
                  required
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm font-medium text-gray-800"
                />
                {order.shippingAddress && (
                  <p className="text-[10px] text-gray-500 mt-1">ที่อยู่เดิม: {order.shippingAddress}</p>
                )}
              </div>

              <ThailandAddressTypeahead
                value={addrVal}
                onValueChange={(val) => {
                  setAddrVal(val);
                  setDstDistrict(val.subdistrict);
                  setDstAmphure(val.district);
                  setDstProvince(val.province);
                  setDstZipcode(val.postalCode);
                }}
              >
                <div className="grid grid-cols-2 gap-3 relative">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">ตำบล/แขวง <span className="text-red-500">*</span></label>
                    <ThailandAddressTypeahead.SubdistrictInput className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm font-bold" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">อำเภอ/เขต <span className="text-red-500">*</span></label>
                    <ThailandAddressTypeahead.DistrictInput className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm font-bold" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">จังหวัด <span className="text-red-500">*</span></label>
                    <ThailandAddressTypeahead.ProvinceInput className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm font-bold" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">รหัสไปรษณีย์ <span className="text-red-500">*</span></label>
                    <ThailandAddressTypeahead.PostalCodeInput className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm font-bold tracking-widest" />
                  </div>
                </div>
                <ThailandAddressTypeahead.Suggestion
                  containerProps={{ className: 'absolute z-[250] bg-white w-full border border-gray-200 shadow-xl rounded-lg mt-1 max-h-48 overflow-y-auto text-sm' }}
                  optionItemProps={{ className: 'px-4 py-2 hover:bg-indigo-50 cursor-pointer text-gray-700 border-b border-gray-50 last:border-0' }}
                />
              </ThailandAddressTypeahead>
            </div>
          </div>

          {/* Courier & Parcel Info */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">บริษัทขนส่ง</label>
              <select
                value={courier}
                onChange={(e) => setCourier(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-800"
              >
                {courierOptions.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white p-4 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">ยอดเก็บเงินปลายทาง (COD)</label>
                <input
                  type="number"
                  min="0"
                  value={codAmount}
                  onChange={(e) => setCodAmount(e.target.value)}
                  placeholder="0 = ไม่เก็บเงินปลายทาง"
                  className="w-full px-4 py-2 bg-rose-50 border border-rose-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 font-bold text-rose-700"
                />
                <p className="text-[10px] text-gray-500 mt-1">ใส่ 0 หากเป็นพัสดุชำระเงินแล้ว</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">เลือกขนาดมาตรฐาน ({width}x{length}x{height} ซม. • {weight} กก.)</label>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => { setWidth('14'); setLength('20'); setHeight('6'); }} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border ${width === '14' && length === '20' ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-100'}`}>กล่อง A (14x20x6)</button>
                  <button type="button" onClick={() => { setWidth('17'); setLength('25'); setHeight('9'); }} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border ${width === '17' && length === '25' ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-100'}`}>กล่อง B (17x25x9)</button>
                  <button type="button" onClick={() => { setWidth('20'); setLength('30'); setHeight('11'); }} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border ${width === '20' && length === '30' ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-100'}`}>กล่อง C (20x30x11)</button>
                  <button type="button" onClick={() => { setWidth('11'); setLength('17'); setHeight('6'); }} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border ${width === '11' && length === '17' ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-100'}`}>กล่อง 00 (11x17x6)</button>
                  <button type="button" onClick={() => { setWidth('16'); setLength('23'); setHeight('2'); }} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border ${width === '16' && length === '23' ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-100'}`}>ซองเอกสาร/กันกระแทก</button>
                </div>
              </div>

              <label className="flex items-center gap-2.5 pt-2 border-t border-gray-100 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoCallPickup}
                  onChange={(e) => setAutoCallPickup(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-bold text-slate-700">เรียกรถขนส่งเข้ารับพัสดุที่สาขาทันทีหลังออกเลขพัสดุ</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  const fullAddress = dstAddress ? `${dstName ? dstName + ' ' : ''}${dstPhone ? dstPhone + '\n' : ''}${dstAddress}\nต.${dstDistrict} อ.${dstAmphure} จ.${dstProvince} ${dstZipcode}`.replace(/\nต. อ. จ. |\nต.- อ.- จ.- /g, '') : '';
                  if (onPrintLabel) onPrintLabel(fullAddress);
                }}
                className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-sm sm:text-base transition-colors flex items-center justify-center shadow-lg shadow-orange-500/25 gap-2"
              >
                <Package size={18} /> พิมพ์ใบแปะหน้า
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-xl font-black text-sm sm:text-base transition-colors flex items-center justify-center shadow-lg shadow-blue-500/25 gap-2"
              >
                {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> กำลังจอง...</> : <><Truck size={18} /> ยืนยันจองขนส่ง</>}
              </button>
            </div>

            <button
              type="button"
              onClick={handleCallPickupOnly}
              disabled={isCallingPickupOnly}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              {isCallingPickupOnly ? <><Loader2 size={14} className="animate-spin" /> กำลังแจ้งรถเข้ารับ...</> : <><Truck size={14} className="text-blue-600" /> เรียกรถเข้ารับพัสดุอย่างเดียว (กรณีออกเลขพัสดุแล้ว)</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
