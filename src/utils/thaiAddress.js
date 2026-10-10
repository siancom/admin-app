export const parseThaiAddress = async (fullAddressText) => {
  try {
    // Check if we already have it cached
    if (!window.__THAI_ADDRESS_DB__) {
      const response = await fetch('https://raw.githubusercontent.com/earthchie/jquery.Thailand.js/master/jquery.Thailand.js/database/raw_database/raw_database.json');
      const data = await response.json();
      window.__THAI_ADDRESS_DB__ = data;
    }
    
    const db = window.__THAI_ADDRESS_DB__;
    
    // Find zipcode
    const zipMatch = fullAddressText.match(/(\d{5})$/) || fullAddressText.match(/\s(\d{5})\s/);
    let zipcode = zipMatch ? zipMatch[1] : null;
    
    let province = '';
    let amphure = '';
    let district = '';

    if (zipcode) {
      // Find all entries with this zipcode
      const matches = db.filter(item => String(item.zipcode) === zipcode);
      if (matches.length > 0) {
        // If we have text, try to find matching amphoe or district
        const foundExact = matches.find(item => fullAddressText.includes(item.district) || fullAddressText.includes(item.amphoe));
        
        if (foundExact) {
          province = foundExact.province;
          amphure = foundExact.amphoe;
          district = foundExact.district;
        } else {
          // fallback to first match for this zipcode
          province = matches[0].province;
          amphure = matches[0].amphoe;
          district = matches[0].district;
        }
      }
    } else {
      // If no zipcode, try to find province and amphoe by string matching
      // (Simplified approach, can be expanded)
      const pMatch = fullAddressText.match(/(จ\.|จังหวัด)\s*([ก-๙]+)/);
      if (pMatch) province = pMatch[2];
      
      const aMatch = fullAddressText.match(/(อ\.|อำเภอ|เขต)\s*([ก-๙]+)/);
      if (aMatch) amphure = aMatch[2];
      
      const dMatch = fullAddressText.match(/(ต\.|ตำบล|แขวง)\s*([ก-๙]+)/);
      if (dMatch) district = dMatch[2];
    }
    
    return {
      province,
      amphure,
      district,
      zipcode
    };
    
  } catch (error) {
    console.error('Error parsing thai address:', error);
    // Fallback to basic regex
    let zipcode = '';
    let province = '';
    let amphure = '';
    let district = '';
    
    const zipMatch = fullAddressText.match(/(\d{5})$/);
    if (zipMatch) zipcode = zipMatch[1];
    
    const pMatch = fullAddressText.match(/(จ\.|จังหวัด)\s*([ก-๙]+)/);
    if (pMatch) province = pMatch[2];
    
    const aMatch = fullAddressText.match(/(อ\.|อำเภอ|เขต)\s*([ก-๙]+)/);
    if (aMatch) amphure = aMatch[2];
    
    const dMatch = fullAddressText.match(/(ต\.|ตำบล|แขวง)\s*([ก-๙]+)/);
    if (dMatch) district = dMatch[2];
    
    return { province, amphure, district, zipcode };
  }
};
