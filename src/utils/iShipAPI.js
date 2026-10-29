export const ISHIP_API_URL = 'https://app.iship.cloud/api';
export const ISHIP_PROXY_BASE = 'https://asia-southeast1-iris-clinic-app.cloudfunctions.net/ishipProxy';
export const WOO_PROXY_BASE = 'https://asia-southeast1-iris-clinic-app.cloudfunctions.net/wooProxy';

async function callIShipEndpoint(endpoint, { method = 'POST', body = null, token = '' } = {}) {
  const cleanEndpoint = String(endpoint || '').replace(/^\/+/, '');
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${String(token).replace(/^Bearer\s+/i, '').trim()}`;
  }

  const fetchOpts = { method, headers };
  if (method !== 'GET' && body !== null) {
    fetchOpts.body = JSON.stringify(body);
  }

  // 1) เรียกผ่าน Cloud Function ishipProxy (รองรับ Auto-refresh Token และไม่ติด CORS)
  try {
    const res = await fetch(`${ISHIP_PROXY_BASE}/${cleanEndpoint}`, fetchOpts);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Invalid JSON from iShip (${res.status}): ${text.slice(0, 120)}`);
    }
    if (res.status === 401 || data?.code === 9999 || data?.message === 'Unauthenticated') {
      const authErr = new Error('บัญชี iShip ยังไม่ได้เข้าสู่ระบบ หรือ Token หมดอายุ');
      authErr.isUnauthenticated = true;
      authErr.raw = data;
      throw authErr;
    }
    return data;
  } catch (err) {
    if (err.isUnauthenticated) throw err;
    console.warn('ishipProxy fallback to wooProxy:', err);
  }

  // 2) Fallback ผ่าน wooProxy หาก ishipProxy ยังไม่พร้อม
  const encodedUrl = encodeURIComponent(`${ISHIP_API_URL}/${cleanEndpoint}`);
  const res = await fetch(`${WOO_PROXY_BASE}?url=${encodedUrl}`, fetchOpts);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`เชื่อมต่อ iShip ไม่สำเร็จ (${res.status})`);
  }
  if (res.status === 401 || data?.code === 9999 || data?.message === 'Unauthenticated') {
    const authErr = new Error('บัญชี iShip ยังไม่ได้เข้าสู่ระบบ หรือ Token หมดอายุ');
    authErr.isUnauthenticated = true;
    authErr.raw = data;
    throw authErr;
  }
  return data;
}

export const iShipAPI = {
  requestToken: async (phone, password) => {
    return callIShipEndpoint('auth/requestToken', {
      method: 'POST',
      body: { phone: String(phone || '').replace(/[^0-9]/g, ''), password: String(password || '') }
    });
  },

  getCourierCodes: async (token = '') => {
    return callIShipEndpoint('courier_code', {
      method: 'GET',
      token
    });
  },

  createOrder: async (orderData, token = '') => {
    return callIShipEndpoint('create_order', {
      method: 'POST',
      body: orderData,
      token
    });
  },

  requestCourier: async (pickupData, token = '') => {
    return callIShipEndpoint('request_courier', {
      method: 'POST',
      body: pickupData,
      token
    });
  },

  getOrderDetails: async (trackingNo, token = '') => {
    const safeTrack = encodeURIComponent(String(trackingNo || '').trim());
    return callIShipEndpoint(`get_order/${safeTrack}`, {
      method: 'GET',
      token
    });
  },

  getOfficialLabelPdfUrl: (trackingNo) => {
    const safeTrack = encodeURIComponent(String(trackingNo || '').trim());
    return `${ISHIP_PROXY_BASE}/download/pdf?tracks=${safeTrack}`;
  }
};
