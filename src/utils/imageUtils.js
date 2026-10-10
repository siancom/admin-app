/**
 * 🖼️ Image utility functions shared across App.jsx and App_mobile.tsx
 */

import { getFuzzyKey } from './fuzzy';

/**
 * Handle image load error - switch to fallback URL
 */
export function handleProfileImgError(e, fallbackUrl) {
  if (fallbackUrl && !e.target.dataset.fallbackTried) {
    e.target.dataset.fallbackTried = 'true';
    e.target.src = fallbackUrl;
  } else {
    e.target.style.display = 'none';
    if (e.target.nextSibling) {
      e.target.nextSibling.classList.remove('hidden');
      e.target.nextSibling.style.display = '';
    }
  }
}

/**
 * Parse raw image path from legacy system into real URL
 */
export function parseImageUrl(rawPath) {
  if (!rawPath || typeof rawPath !== 'string') return null;
  if (rawPath.startsWith('http')) return rawPath;

  if (rawPath.match(/\.(jpeg|jpg|gif|png|webp)$/i) || rawPath.includes('_Images') || rawPath.includes('.รูปลูกค้า.')) {
    const filename = rawPath.split(/[/\\]/).pop();
    return `https://crm.irisnatures.com/uploads/customer_photos/${filename}`;
  }
  return null;
}

/**
 * Get profile picture data (primary URL + fallback URL)
 * @param {Object} b - The booking/course/customer object
 * @param {Array} customersList - Optional customers list for fallback lookup
 */
export function getProfilePicData(b, customersList) {
  const extract = (obj) => {
    if (!obj) return null;
    let lineUrl = null, hostUrl = null;

    // 1. Get Line profile picture
    const lineVal = getFuzzyKey(obj, ["linePictureUrl", "linePicture", "lineProfilePic", "pictureUrl", "profileUrl", "รูปจากไลน์", "line_pic", "รูปลูกค้าในไลน์", "รูปโปรไฟล์ไลน์", "line"]);
    if (lineVal && typeof lineVal === 'string' && lineVal.startsWith('http')) lineUrl = lineVal;

    // 2. Get uploaded host photo
    const hostVal = getFuzzyKey(obj, ["รูปลูกค้า", "รูปโปรไฟล์", "customerPhoto", "photo"]);
    const parsedHost = parseImageUrl(hostVal);
    if (parsedHost) {
      if (parsedHost.includes('crm.irisnatures.com')) hostUrl = parsedHost;
      else if (parsedHost.startsWith('http') && !lineUrl) lineUrl = parsedHost;
    }

    if (!hostUrl && !lineUrl) return null;

    return {
      primary: lineUrl || hostUrl, // Prioritize LINE picture because it is high quality
      fallback: (hostUrl && lineUrl) ? hostUrl : null
    };
  };

  let picData = extract(b);
  if (picData) return picData;

  // Fallback: search customers list by phone
  if (b.customerPhone && customersList) {
    const cust = customersList.find(c => String(getFuzzyKey(c, ["เบอร์โทร", "col_3"])) === String(b.customerPhone));
    if (cust) return extract(cust);
  }
  return null;
}