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
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(204).send('');
    return;
  }
  
  try {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('Missing url param');
    
    const headers = {};
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
