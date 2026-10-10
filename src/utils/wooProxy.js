/**
 * 🌐 WooCommerce & 17Track API proxy helpers - used by App_mobile.tsx
 */

export const WOO_CFG = {
  url: "https://irisnatures.com",
  key: "ck_6ecc49bb94d5c11308fb1c60ce30f220eb6e2302",
  sec: "cs_e0d7c58b3ec8093ba7aa5abc0b87186e7522d502"
};

const TRACK_API_KEY = "ECC6D924E26BE074DDDF0B6344EE82BC";

/**
 * Fetch WooCommerce API through multiple proxy strategies
 */
export async function fetchWithProxy(url, options = {}, isPut = false) {
  const urlObj = new URL(url);
  urlObj.searchParams.append('consumer_key', WOO_CFG.key);
  urlObj.searchParams.append('consumer_secret', WOO_CFG.sec);
  const urlWithParams = urlObj.toString();
  const encodedUrl = encodeURIComponent(urlWithParams);
  const authHeader = 'Basic ' + btoa(`${WOO_CFG.key}:${WOO_CFG.sec}`);
  
  const isWrite = isPut || (options.method && options.method !== 'GET');

  const directOpts = { 
    ...options, 
    headers: { 
      ...options.headers, 
      'Authorization': authHeader, 
      'Accept': 'application/json',
      ...(isWrite ? { 'Content-Type': 'application/json' } : {})
    } 
  };
  const proxyOpts = { 
    ...options, 
    headers: { 
      ...options.headers, 
      'Authorization': authHeader,
      'Accept': 'application/json', 
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    } 
  };

  const tryFetch = async (fetchUrl, fetchOptions) => {
    const res = await fetch(fetchUrl, fetchOptions);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return JSON.parse(await res.text());
  };

  // Try our dedicated Firebase Function Proxy first
  try {
    const cloudProxyOpts = {
      method: isWrite ? (options.method || 'POST') : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    if (isWrite && options.body) cloudProxyOpts.body = options.body;
    
    return await tryFetch(`https://asia-southeast1-iris-clinic-app.cloudfunctions.net/wooProxy?url=${encodedUrl}`, cloudProxyOpts);
  } catch (e) {
    console.warn("Cloud function proxy failed, falling back to direct...", e);
  }

  // Always try direct first
  try { return await tryFetch(urlWithParams, directOpts); } catch (e) {}
  
  // For GET requests, try public proxies without auth
  if (!isWrite) {
    try {
      const res = await fetch(`https://api.allorigins.win/get?url=${encodedUrl}`);
      if (res.ok) { const data = await res.json(); if (data.contents) return JSON.parse(data.contents); }
    } catch (e) {}
  }
  
  // Try corsproxy.io with auth header (works for both GET and PUT/POST)
  try { return await tryFetch(`https://corsproxy.io/?${encodedUrl}`, proxyOpts); } catch (e) {}
  try { return await tryFetch(`https://api.codetabs.com/v1/proxy?quest=${urlWithParams}`, proxyOpts); } catch (e) {}
  throw new Error("Network request failed (CORS Error)");
}

/**
 * Fetch 17Track API — ทางผ่านหลักคือ Firebase Function ของเราเอง (แก้ CORS + ซ่อน token ฝั่ง server)
 */
export async function fetch17Track(url, body) {
  // 🌟 Proxy ผ่าน Cloud Function track17 (แกนหลัก — 17TRACK ไม่อนุญาตเรียกตรงจากเบราว์เซอร์)
  try {
    const action = String(url).split('/').pop();
    const res = await fetch(`https://asia-southeast1-iris-clinic-app.cloudfunctions.net/track17/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (res.ok) return JSON.parse(await res.text());
  } catch (e) {}

  // Fallback เดิม (direct + proxies สาธารณะ — อาจใช้ไม่ได้แล้ว เก็บไว้กันพลาด)
  const options = {
    method: 'POST',
    headers: { '17token': TRACK_API_KEY, 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(body)
  };
  const encodedUrl = encodeURIComponent(url);

  const tryFetch = async (fetchUrl) => {
    const res = await fetch(fetchUrl, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return JSON.parse(await res.text());
  };

  try { return await tryFetch(url); } catch (e) {}
  try { return await tryFetch(`https://corsproxy.io/?${encodedUrl}`); } catch (e) {}
  try { return await tryFetch(`https://api.codetabs.com/v1/proxy?quest=${url}`); } catch (e) {}

  throw new Error("Network request failed for 17track (CORS Error)");
}