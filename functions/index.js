const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");
admin.initializeApp();

// 📦 17TRACK proxy — แก้ CORS (17TRACK ไม่ส่ง allow-origin ให้เบราว์เซอร์) + ซ่อน token ไว้ฝั่ง server
const TRACK17_TOKEN = 'ECC6D924E26BE074DDDF0B6344EE82BC';
const TRACK17_ACTIONS = ['register', 'gettrackinfo', 'retrack', 'delet'];

exports.track17 = functions.region('asia-southeast1').https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send('');
    return;
  }
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  // path: /register หรือ /gettrackinfo
  const action = String(req.path || '').replace(/^\/+|\/+$/g, '');
  if (!TRACK17_ACTIONS.includes(action)) return res.status(404).json({ error: 'invalid action', action });

  try {
    const r = await fetch(`https://api.17track.net/track/v2.2/${action}`, {
      method: 'POST',
      headers: { '17token': TRACK17_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const text = await r.text();
    res.set('Content-Type', 'application/json');
    res.status(r.status).send(text);
  } catch (e) {
    res.status(502).json({ error: e.toString() });
  }
});

const LINE_ENDPOINTS = {
  push: 'https://api.line.me/v2/bot/message/push',
  multicast: 'https://api.line.me/v2/bot/message/multicast',
  broadcast: 'https://api.line.me/v2/bot/message/broadcast',
  narrowcast: 'https://api.line.me/v2/bot/message/narrowcast',
};

exports.lineProxy = functions.region('asia-southeast1').https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(204).send('');
    return;
  }
  
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    // Allow client to specify endpoint type via _endpoint field or query param
    const endpointKey = req.query.endpoint || req.body?._endpoint || 'push';
    const lineUrl = LINE_ENDPOINTS[endpointKey] || LINE_ENDPOINTS.push;

    // Remove internal _endpoint field before forwarding
    const body = { ...req.body };
    delete body._endpoint;

    const lineRes = await fetch(lineUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization
      },
      body: JSON.stringify(body)
    });
    const text = await lineRes.text();
    res.status(lineRes.status).send(text);
  } catch(e) {
    res.status(500).send(e.toString());
  }
});

exports.wooProxy = functions.region('asia-southeast1').https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    res.status(204).send('');
    return;
  }
  
  try {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('Missing url param');
    
    const headers = { 'Accept': req.headers['accept'] || 'application/json' };
    if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;
    if (req.headers['content-type']) headers['Content-Type'] = req.headers['content-type'];

    const fetchOpts = { method: req.method, headers };
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOpts.body = typeof req.body === 'object' ? JSON.stringify(req.body) : req.body;
    }

    const r = await fetch(targetUrl, fetchOpts);
    const text = await r.text();
    res.set('Content-Type', r.headers.get('content-type') || 'application/json');
    res.status(r.status).send(text);
  } catch (e) {
    res.status(502).json({ error: e.toString() });
  }
});

// 🚚 iShip Open API Proxy — แก้ CORS + รองรับ Auto Refresh Token จาก Firestore (app_settings/shipping) + ดาวน์โหลดใบปะหน้า PDF
const ISHIP_ALLOWED_PATHS = [
  'auth/requestToken',
  'courier_code',
  'create_order',
  'request_courier',
  'query_orders',
  'cancel_order',
  'traces',
  'download/pdf'
];

exports.ishipProxy = functions.region('asia-southeast1').https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    res.status(204).send('');
    return;
  }

  try {
    let subPath = String(req.path || req.query.endpoint || '').replace(/^\/+|\/+$/g, '');
    if (subPath === 'requestToken') subPath = 'auth/requestToken';
    const isAllowed = ISHIP_ALLOWED_PATHS.includes(subPath) || /^get_order\/[A-Za-z0-9_-]+$/.test(subPath);
    if (!isAllowed) {
      return res.status(400).json({ status: false, message: `Unsupported iShip endpoint: ${subPath}` });
    }

    const db = getFirestore('iris-care');
    const shippingDocRef = db.collection('app_settings').doc('shipping');

    // กรณีขอ Token ใหม่ด้วยเบอร์โทร + รหัสผ่าน
    if (subPath === 'auth/requestToken') {
      const authRes = await fetch('https://app.iship.cloud/api/auth/requestToken', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body || {})
      });
      const authText = await authRes.text();
      res.set('Content-Type', 'application/json');
      return res.status(authRes.status).send(authText);
    }

    // ดึง Token จาก Header หรือจาก Firestore app_settings/shipping
    let token = '';
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.replace(/^Bearer\s+/i, '').trim();
    }
    const shippingSnap = await shippingDocRef.get();
    const shippingCfg = shippingSnap.exists ? (shippingSnap.data() || {}) : {};
    if (!token && shippingCfg.ishipToken) {
      token = String(shippingCfg.ishipToken).trim();
    }

    const isPdfDownload = subPath === 'download/pdf';

    const callIShip = async (bearerToken) => {
      const queryStr = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
      const targetUrl = `https://app.iship.cloud/api/${subPath}${queryStr}`;
      const fetchOpts = {
        method: req.method,
        headers: {
          'Accept': isPdfDownload ? 'application/pdf, application/json, */*' : 'application/json',
          ...(req.method !== 'GET' && req.method !== 'HEAD' ? { 'Content-Type': 'application/json' } : {}),
          ...(bearerToken ? { 'Authorization': `Bearer ${bearerToken}` } : {})
        }
      };
      if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
        fetchOpts.body = typeof req.body === 'object' ? JSON.stringify(req.body) : req.body;
      }
      return fetch(targetUrl, fetchOpts);
    };

    const sendPdfIfBinary = async (response) => {
      const respType = String(response.headers.get('content-type') || '').toLowerCase();
      if (respType.includes('pdf') || respType.includes('octet-stream')) {
        const pdfBuf = Buffer.from(await response.arrayBuffer());
        const safeTrack = String(req.query.tracks || 'waybill').replace(/[^a-zA-Z0-9_-]/g, '');
        res.set('Content-Type', 'application/pdf');
        res.set('Content-Disposition', `inline; filename="iship-label-${safeTrack}.pdf"`);
        res.status(response.status).send(pdfBuf);
        return true;
      }
      return false;
    };

    let r = await callIShip(token);
    if (isPdfDownload && r.ok && await sendPdfIfBinary(r)) {
      return;
    }

    let text = await r.text();

    // หาก Token หมดอายุ/ไม่ถูกต้อง และมีเบอร์โทร+รหัสผ่านบันทึกไว้ ให้ขอ Token ใหม่อัตโนมัติแล้วลองซ้ำ 1 ครั้ง
    let parsed = null;
    try { parsed = JSON.parse(text); } catch (e) {}
    const isUnauth = r.status === 401 || parsed?.code === 9999 || parsed?.message === 'Unauthenticated';

    if (isUnauth && shippingCfg.ishipPhone && shippingCfg.ishipPassword) {
      const refreshRes = await fetch('https://app.iship.cloud/api/auth/requestToken', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: shippingCfg.ishipPhone, password: shippingCfg.ishipPassword })
      });
      const refreshData = await refreshRes.json().catch(() => null);
      const newToken = refreshData?.data?.accessToken;
      if (newToken) {
        await shippingDocRef.set({ ishipToken: newToken, tokenUpdatedAt: new Date().toISOString() }, { merge: true });
        r = await callIShip(newToken);
        if (isPdfDownload && r.ok && await sendPdfIfBinary(r)) {
          return;
        }
        text = await r.text();
      }
    }

    res.set('Content-Type', 'application/json');
    return res.status(r.status).send(text);
  } catch (e) {
    console.error('ishipProxy error:', e);
    return res.status(502).json({ status: false, message: e.toString() });
  }
});

exports.omiseCharge = functions.region('asia-southeast1').https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(204).send('');
    return;
  }
  
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const { token, amount, description, returnUri, sourceType, installmentTerm } = req.body;
    if ((!token && !sourceType) || !amount) {
      return res.status(400).json({ error: 'Missing token, sourceType or amount' });
    }

    // Get secret key from Firestore 'iris-care' database
    const db = getFirestore('iris-care');
    const docSnap = await db.collection('app_settings').doc('payment').get();
    const omiseSecretKey = docSnap.exists ? docSnap.data().omiseSecretKey : null;

    if (!omiseSecretKey) {
      return res.status(500).json({ error: 'Omise Secret Key is not configured in backend' });
    }

    // Amount must be in subunits (THB -> satang)
    const amountInSatang = Math.round(Number(amount) * 100);

    // Call Omise API
    const authHeader = 'Basic ' + Buffer.from(omiseSecretKey + ':').toString('base64');
    
    const params = new URLSearchParams();
    params.append('amount', amountInSatang.toString());
    params.append('currency', 'THB');
    if (sourceType) {
      params.append('source[type]', sourceType);
      if (installmentTerm) params.append('source[installment_term]', installmentTerm.toString());
      params.append('return_uri', returnUri || 'https://iris-clinic-app.web.app/');
    } else if (token && token.startsWith('src_')) {
      params.append('source', token);
      params.append('return_uri', returnUri || 'https://iris-clinic-app.web.app/');
    } else if (token) {
      params.append('card', token);
    }
    if (description) params.append('description', description);

    const chargeRes = await fetch('https://api.omise.co/charges', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const chargeData = await chargeRes.json();
    
    if (!chargeRes.ok) {
      return res.status(chargeRes.status).json(chargeData);
    }
    
    // Return success
    res.status(200).json(chargeData);
  } catch (e) {
    console.error('omiseCharge error:', e);
    res.status(500).json({ error: e.toString() });
  }
});

exports.omiseWebhook = functions.region('asia-southeast1').https.onRequest(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  try {
    const event = req.body;
    
    // We only care about charge.complete
    if (event.key === 'charge.complete' && event.data) {
      const charge = event.data;
      if (charge.status === 'successful') {
        const chargeId = charge.id;
        const db = getFirestore('iris-care');
        
        // Update histories
        const historiesRef = db.collection('histories');
        const historiesSnapshot = await historiesRef.where('chargeId', '==', chargeId).get();
        const batch = db.batch();
        
        if (!historiesSnapshot.empty) {
          historiesSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const statusCol = (data['สถานะ'] !== undefined) ? 'สถานะ' : 'col_22';
            const currentStatus = data[statusCol];
            if (currentStatus === 'รอชำระเงิน' || currentStatus === 'รอตรวจสอบ' || currentStatus === 'รอดำเนินการ') {
               batch.update(doc.ref, { [statusCol]: 'สำเร็จ', updatedAt: new Date().toISOString() });
            }
          });
        }

        // Update orders
        const ordersRef = db.collection('orders');
        const ordersSnapshot = await ordersRef.where('chargeId', '==', chargeId).get();
        if (!ordersSnapshot.empty) {
          ordersSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const currentStatus = data.status;
            if (currentStatus === 'รอชำระเงิน' || currentStatus === 'รอตรวจสอบ' || currentStatus === 'รอดำเนินการ') {
               batch.update(doc.ref, { status: 'สำเร็จ', updatedAt: new Date().toISOString() });
            }
          });
        }
        
        await batch.commit();
      }
    }
    res.status(200).send('Webhook processed');
  } catch(e) {
    console.error('Webhook error:', e);
    res.status(500).send(e.toString());
  }
});

exports.checkOmiseCharge = functions.region('asia-southeast1').https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(204).send('');
    return;
  }
  
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const { chargeId } = req.body;
    if (!chargeId) {
      return res.status(400).json({ error: 'Missing chargeId' });
    }

    const db = getFirestore('iris-care');
    const docSnap = await db.collection('app_settings').doc('payment').get();
    const omiseSecretKey = docSnap.exists ? docSnap.data().omiseSecretKey : null;

    if (!omiseSecretKey) {
      return res.status(500).json({ error: 'Omise Secret Key is not configured' });
    }

    const authHeader = 'Basic ' + Buffer.from(omiseSecretKey + ':').toString('base64');
    
    const chargeRes = await fetch(`https://api.omise.co/charges/${chargeId}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader
      }
    });

    const chargeData = await chargeRes.json();
    
    if (!chargeRes.ok) {
      return res.status(chargeRes.status).json(chargeData);
    }
    
    res.status(200).json(chargeData);
  } catch (e) {
    console.error('checkOmiseCharge error:', e);
    res.status(500).json({ error: e.toString() });
  }
});

// 📦 17TRACK Webhook (Push API)
exports.track17Webhook = functions.region('asia-southeast1').https.onRequest(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  try {
    const payload = req.body;
    // 17TRACK webhook usually wraps the event in an object.
    // The structure might be { event: "...", data: { number: "...", track_info: {...} } }
    
    // Some 17TRACK payloads are sent as an array of events
    const events = Array.isArray(payload) ? payload : [payload];
    
    const db = getFirestore('iris-care');
    const batch = db.batch();
    let updatedCount = 0;
    
    const normTrackPhase = (s) => {
        const x = String(s || 'Pending');
        const camel = x.charAt(0).toLowerCase() + x.slice(1);
        return camel.replace(/_([a-zA-Z])/g, (m, c) => c.toUpperCase());
    };
    
    for (const ev of events) {
      const data = ev.data || ev; // Handle different potential payload structures
      const num = data.number || data.tracking_number;
      
      if (!num || !data.track_info) continue;
      
      const ti = data.track_info;
      const allEvents = (ti.tracking?.providers || []).flatMap(p => p?.events || []);
      const lastEv = ti.latest_event || allEvents[allEvents.length - 1] || null;
      
      const info = {
        number: String(num),
        carrier: data.carrier ? String(data.carrier) : '',
        phase: normTrackPhase(ti.latest_status?.status),
        lastEvent: lastEv ? { time: lastEv.time_iso || '', desc: lastEv.description || '', location: lastEv.location || '' } : null,
        events: allEvents.slice(-8).reverse().map(e => ({ time: e.time_iso || '', desc: e.description || '', location: e.location || '' })),
        fetchedAt: new Date().toISOString(),
        isWebhook: true
      };
      
      // Find the order in Firestore with this tracking number
      const ordersRef = db.collection('orders');
      const q = ordersRef.where('trackingNo', '==', String(num));
      const snapshot = await q.get();
      
      if (!snapshot.empty) {
        snapshot.docs.forEach(doc => {
          batch.update(doc.ref, { 
            trackingInfo: info,
            updatedAt: new Date().toISOString()
          });
          updatedCount++;
        });
      }
    }
    
    if (updatedCount > 0) {
      await batch.commit();
      console.log(`Updated ${updatedCount} orders from 17TRACK webhook.`);
    }
    
    // Always return 200 so 17TRACK knows we received it
    res.status(200).send({ success: true, updated: updatedCount });
  } catch (e) {
    console.error('track17Webhook error:', e);
    // Return 500 on internal errors so 17TRACK might retry
    res.status(500).send(e.toString());
  }
});

// 🌸 AI Skin & Mole Analysis Endpoint (Iris AI) — Server-side Vertex AI / Gemini (No App Check required)
exports.aiSkinAnalysis = functions.region('asia-southeast1').runWith({
  timeoutSeconds: 120,
  memory: '512MB'
}).https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    res.status(204).send('');
    return;
  }
  
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', service: 'Iris AI Skin Analysis', time: new Date().toISOString() });
  }

  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const { imageBase64, mimeType = 'image/jpeg', scanMode = 'skin', shopCatalog = [], customPrompt } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ status: false, error: 'กรุณาแนบรูปภาพสำหรับวิเคราะห์ (Missing imageBase64)' });
    }

    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const cleanMime = (imageBase64.includes('data:') && imageBase64.includes(';'))
      ? imageBase64.split(';')[0].replace('data:', '')
      : (mimeType || 'image/jpeg');

    const shopCatalogJson = Array.isArray(shopCatalog) ? JSON.stringify(shopCatalog) : (typeof shopCatalog === 'string' ? shopCatalog : '[]');

    let prompt = customPrompt;
    if (!prompt) {
      if (scanMode === 'skin') {
        prompt = `คุณคือผู้เชี่ยวชาญด้านผิวพรรณประจำ Iris Clinic (ไอริส คลินิก) ที่มีความรอบรู้ สุภาพ อบอุ่น เป็นกันเอง ใส่ใจลูกค้า
จงวิเคราะห์ภาพใบหน้านี้อย่างละเอียดในด้านหลักต่อไปนี้ (คะแนน 1-10 โดย 10 คือสมบูรณ์แบบ):
หากพบว่าภาพเบลอ มืดไป สว่างไป หรือมีการใช้ฟิลเตอร์/แต่งหน้า ให้แจ้งเตือนในฟิลด์ warning และลดคะแนนลง
1. สิวและรอยแดง (acne)
2. ริ้วรอยและความกระชับ (wrinkles)
3. ความสว่างกระจ่างใส (brightness)
4. รูขุมขนและความเรียบเนียน (pores)
5. ฝ้า กระ จุดด่างดำ (darkSpots)
6. ความชุ่มชื้นและสมดุลความมัน (moisture)
7. ความหมองคล้ำรอบดวงตา (darkCircles)
8. หลุมสิวและความขรุขระ (acneScars)
9. คะแนนสุขภาพผิวโดยรวม (overall)
10. ระดับความพร้อมผลัดเซลล์ผิว (cellTurnover) — อิงจากการสะสมของเซลล์ผิวเก่า ความหมองคล้ำ ผิวหน้าตึง/หนา และความขรุขระ หากคะแนนสูงแปลว่ามีเซลล์เก่าสะสมมาก ผิวพร้อมถูกผลัด/ลอกออก

*สำคัญมาก: จำแนก "สถานะการผลัดเซลล์" ของผิวในภาพนี้ตอนนี้ (status ใน cellTurnoverInfo) โดยดูจากลักษณะที่เห็นจริง:
- "ready" = ผิวสะสมเซลล์เก่า หนา/หมองคล้ำ/ขุนขระ/รูขุมขนอุดตัน แต่ไม่มีขุยลอก → แนะนำให้เริ่มผลัดเซลล์
- "peeling_now" = ผิวกำลังผลัดเซลล์อยู่ขณะนี้ เห็นขุยแห้ง ผิวลอกเป็นแผ่นๆ กำลังหลุดลอกชัดเจน → ต้องงดผลัดซ้ำ เน้นบำรุงความชุ่มชื้น
- "recovering" = เพิ่งผลัดเซลล์/ทำทรีตเมนต์เสร็จใหม่ๆ ผิวใหม่บาง อ่อนไหว อาจมีรอยแดงอ่อนๆ ผิวดูเรียบเนียนผิดปกติ → ต้องรอฟื้น 1-2 สัปดาห์ก่อนผลัดครั้งถัดไป
- "normal" = ผิวปกติ ผลัดเซลล์ตามรอบธรรมชาติ ยังไม่จำเป็นต้องเร่ง
พร้อมระบุหลักฐานที่สังเกตเห็นจากภาพสั้นๆ ใน statusEvidence เช่น "เห็นขุยแห้งบริเวณแก้ม" หรือ "ผิวหนาหมองมีสิ่งอุดตันตรงทีโซน"
หาก status เป็น peeling_now หรือ recovering ต้องระวังเป็นพิเศษ: ใน herbalRecommendation ให้แนะนำ "ผงพอกสมุนไพรไอริส" (พอกบำรุงปลอบผิว ไม่ใช่ผงเร่ง) ร่วมกับการบำรุงความชุ่มชื้นเท่านั้น และห้ามแนะนำครีมกลุ่มผลัดเซลล์ (AHA/BHA/Retinol) ผงเร่ง/โคลนเร่ง หรือการผลัดเซลล์ซ้ำเด็ดขาด
ขั้นตอนที่ควรแนะนำเป็นลำดับ: (1) ใช้คลีนซิ่งน้ำนมนวดขัดเบาๆ ก่อนล้างหน้าเพื่อขจัดเซลล์ที่หลุดอยู่ให้ลอยออกอย่างอ่อนโยน (2) ล้างหน้าแล้วพอกบำรุงด้วยผงพอกสมุนไพรไอริส (3) ปิดท้ายด้วยการทาครีมกันแดดทุกครั้ง เพราะผิวใหม่ไวแสงแดดมาก และขั้นท้ายสุด (4) สามารถเอาผงพอกสมุนไพรไอริสผสมน้ำแล้วแต้มเป็นจุดๆ ที่รอย สิว หรือจุดที่มีปัญหา เพื่อบำรุงเข้มข้นเฉพาะจุดได้

*ข้อสำคัญ: จงวิเคราะห์แยกระหว่าง "ผิวแห้ง (Dry Skin - ขาดน้ำมัน)" และ "ผิวขาดน้ำ (Dehydrated Skin - ขาดน้ำ)" อย่างชัดเจน โดยพิจารณาจากรูขุมขน ความมันวาว ความแห้งกร้าน ขุย และริ้วรอย ให้ระบุใน hydrationAnalysis*

พร้อมประเมินอายุผิวหน้าจากสภาพผิวที่มองเห็น (estimatedSkinAge ตัวเลขจำนวนเต็ม เช่น 25, 32)
และระบุข้อความสถานะอายุผิวแบบชมเชยหรือนุ่มนวล (skinAgeStatus)

คุณมีรายการคอร์สและสินค้าดังนี้:
${shopCatalogJson}
จงเลือกแนะนำคอร์สหรือสินค้าที่เหมาะสมที่สุดกับสภาพผิวของลูกค้าจากรายการด้านบน (แนะนำ 1-3 รายการ) โดยคืนค่าเป็น id ของสินค้าหรือคอร์สนั้นๆ พร้อมระบุเหตุผลสั้นๆ

ส่งผลลัพธ์กลับมาเป็น JSON เท่านั้น โครงสร้างดังนี้:
{
    "mode": "skin",
    "greeting": "สวัสดีค่ะคุณลูกค้าสุดน่ารัก อบอุ่นสั้นๆ จาก Iris Clinic",
    "estimatedSkinAge": 28,
    "skinAgeStatus": "ผิวดูกระชับสดใส แลดูอ่อนเยาว์กว่าอายุจริงค่ะ ✨",
    "scores": {
        "acne": 8, "wrinkles": 7, "brightness": 6, "pores": 7, "darkSpots": 6, "moisture": 8, "darkCircles": 5, "acneScars": 7, "cellTurnover": 6, "overall": 7
    },
    "hydrationAnalysis": {
        "isDry": true,
        "isDehydrated": true,
        "description": "ผิวขาดทั้งน้ำและน้ำมัน มีลักษณะแห้งกร้านและเห็นริ้วรอยขาดน้ำชัดเจน",
        "recommendation": "ควรดื่มน้ำให้เพียงพอและทำทรีตเมนต์เติมน้ำให้ผิวชั้นลึก"
    },
    "cellTurnoverInfo": {
        "status": "ready",
        "statusEvidence": "หลักฐานที่เห็นจากภาพ เช่น เห็นขุยแห้งหลุดเป็นแผ่นบริเวณแก้ม หรือ ผิวหนาหมองมีสิ่งอุดตันตรงทีโซน",
        "level": "พร้อมผลัดเซลล์ ระดับปานกลาง",
        "description": "สภาพผิวมีเซลล์เก่าสะสมอยู่บ้าง ผิวหมองเล็กน้อย สามารถเริ่มผลัดเซลล์ได้แล้ว",
        "herbalRecommendation": "แนะนำให้ผลัดเซลล์ผิวด้วยสมุนไพรธรรมชาติของทางร้าน เพื่อขจัดเซลล์เก่าอย่างอ่อนโยน ผิวเรียบเนียน กระจ่างใสขึ้น"
    },
    "summary": "ข้อความสรุปสภาพผิวที่พบด้วยภาษาเป็นกันเอง ห่วงใย และอ่านง่าย",
    "recommendation": "คำแนะนำการดูแลผิวประจำวันสั้นๆ นุ่มนวล",
    "recommendedCourses": [
        { "id": "รหัส id ของคอร์ส/สินค้าที่เลือกจากรายการ", "reason": "เหตุผลสั้นๆ" }
    ],
    "confidenceScore": 85,
    "warning": "ถ้าภาพเบลอ มืด แต่งหน้า หรือใช้ฟิลเตอร์ ให้ใส่คำเตือนสั้นๆ ที่นี่ ถ้าภาพชัดเจนดีให้ใส่ค่าว่าง (\"\")"
}`;
      } else {
        prompt = `คุณคือแพทย์และผู้เชี่ยวชาญการจี้ไฝ ติ่งเนื้อ กระเนื้อ สิวหิน ประจำ Iris Clinic (ไอริส คลินิก)
หากพบว่าภาพเบลอ มืดไป หรือมองเห็นไม่ชัดเจน ให้แจ้งเตือนในฟิลด์ warning
จงสแกนภาพใบหน้าหรือลำคอนี้อย่างละเอียด นับจำนวนจุดที่พบ และระบุพิกัดตำแหน่ง 2D Bounding Box ของแต่ละจุดที่พบอย่างแม่นยำที่สุด
ใช้สเกล 0 ถึง 1000 ในรูปแบบ [ymin, xmin, ymax, xmax]

พร้อมประเมินอายุผิวหน้าเบื้องต้น (estimatedSkinAge) และระบุข้อความสถานะอายุผิว (skinAgeStatus)

จำแนกประเภทดังนี้:
- type: "mole" (ไฝ/ขี้แมลงวัน)
- type: "freckle" (กระเนื้อ/กระแดด)
- type: "skinTag" (ติ่งเนื้อ/สิวหิน)

คำนวณราคาประเมินค่าบริการจี้เบื้องต้น (หน่วยบาท):
- จุดละ 100 - 150 บาท (หาก 1-3 จุด)
- 4-10 จุด เหมาแพ็กเกจ 500 - 900 บาท
- มากกว่า 10 จุด เหมาทั่วหน้า/ลำคอ 1,200 - 1,800 บาท

ส่งผลลัพธ์กลับมาเป็น JSON เท่านั้น โครงสร้างดังนี้:
{
    "mode": "mole",
    "greeting": "สวัสดีค่ะคุณลูกค้า สรุปผลการตรวจนับจุดไฝและติ่งเนื้อสำหรับเตรียมจี้ออกนะคะ",
    "estimatedSkinAge": 30,
    "skinAgeStatus": "สภาพผิวโดยรวมแข็งแรงดี พร้อมบริการจี้ลบจุดอย่างปลอดภัยค่ะ",
    "counts": {
        "moles": 2, "freckles": 4, "skinTags": 1, "total": 7
    },
    "markers": [
        { "box2d": [420, 380, 450, 410], "type": "mole", "label": "ไฝ / ขี้แมลงวัน" },
        { "box2d": [500, 600, 530, 630], "type": "freckle", "label": "กระเนื้อ" },
        { "box2d": [780, 480, 810, 510], "type": "skinTag", "label": "ติ่งเนื้อ" }
    ],
    "locations": ["โหนกแก้มซ้าย", "ข้างมุมปาก", "ลำคอ"],
    "estimatedPriceMin": 500,
    "estimatedPriceMax": 900,
    "summary": "พบไฝเล็กน้อย และมีกระเนื้อบริเวณโหนกแก้มร่วมกับติ่งเนื้อที่ลำคอ สามารถจี้ออกได้เรียบเนียนในการทำครั้งเดียว",
    "cauterizeAdvice": "หลังจี้ห้ามโดนน้ำ 3-5 วัน และแต้มผงสมุนไพรลดอักเสบตามที่คลินิกจัดให้ มีประกันดูแลซ้ำ 1 เดือนค่ะ",
    "confidenceScore": 90,
    "warning": "ถ้าภาพเบลอ มืด หรือใช้ฟิลเตอร์ จนมองไม่เห็นไฝ ให้ใส่คำเตือนสั้นๆ ที่นี่ ถ้าภาพชัดเจนดีให้ใส่ค่าว่าง (\"\")"
}`;
      }
    }

    // Initialize AI (Google GenAI)
    const db = getFirestore('iris-care');
    const aiSnap = await db.collection('app_settings').doc('ai').get().catch(() => null);
    const aiData = aiSnap && aiSnap.exists ? aiSnap.data() : {};
    const apiKey = aiData.geminiApiKey || process.env.GEMINI_API_KEY || 'AIzaSyB6EonLuXnb5btsKrJiM-eQ7BiIJASUeHs';

    const { GoogleGenAI } = require('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const contents = [
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: cleanMime,
              data: cleanBase64
            }
          }
        ]
      }
    ];

    let rawResult = null;
    try {
      rawResult = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          responseMimeType: 'application/json'
        }
      });
    } catch (primaryErr) {
      console.warn('gemini-3.8-flash attempt failed, trying gemini-3.5-flash:', primaryErr.message);
      try {
        rawResult = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents,
          config: {
            responseMimeType: 'application/json'
          }
        });
      } catch (secErr) {
        console.warn('gemini-3.5-flash attempt failed, trying gemini-3.5-flash-lite:', secErr.message);
        rawResult = await ai.models.generateContent({
          model: 'gemini-3.5-flash-lite',
          contents,
          config: {
            responseMimeType: 'application/json'
          }
        });
      }
    }

    const responseText = rawResult.text || '';
    let jsonString = responseText.trim();
    if (jsonString.includes('```json')) {
      jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
    } else if (jsonString.includes('```')) {
      jsonString = jsonString.replace(/```/g, '').trim();
    }

    const parsedData = JSON.parse(jsonString);

    // Convert Bounding Box [ymin, xmin, ymax, xmax] (0-1000) to Center Coordinates (x%, y%)
    if (parsedData.markers && Array.isArray(parsedData.markers)) {
      parsedData.markers = parsedData.markers.map(m => {
        if (m.box2d && Array.isArray(m.box2d) && m.box2d.length === 4) {
          const [ymin, xmin, ymax, xmax] = m.box2d;
          const centerX = ((xmin + xmax) / 2) / 10;
          const centerY = ((ymin + ymax) / 2) / 10;
          return { ...m, x: Math.max(5, Math.min(95, centerX)), y: Math.max(5, Math.min(95, centerY)) };
        } else if (typeof m.x === 'number' && typeof m.y === 'number') {
          return m;
        }
        return null;
      }).filter(Boolean);
    }

    res.status(200).json(parsedData);
  } catch (err) {
    console.error('aiSkinAnalysis error:', err);
    res.status(500).json({ status: false, error: err.message || 'AI processing failed' });
  }
});
