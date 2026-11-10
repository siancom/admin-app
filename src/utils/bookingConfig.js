export const DEFAULT_BOOKING_CONFIG = {
  serviceDurations: {
    'ทำหน้า': 60,
    'กดสิว': 45,
    'IPLรักแร้': 30,
    'จี้ไฝ': 45,
    'ปรึกษา': 20,
    'ใช้คอส': 60,
    'default': 60
  },
  enableMultiServiceAddition: true,
  guestDurationMode: 'consecutive_buffer', // 'concurrent' (ทำพร้อมกัน) | 'consecutive_buffer' (บวกเวลาต่อท่าน) | 'multiply' (คูณตามจำนวนคน)
  extraMinutesPerGuest: 30,
  maxBookingDuration: 180
};

/**
 * คำนวณระยะเวลารวม (นาที) จากรายการบริการและจำนวนผู้เข้ารับบริการ
 * @param {string} serviceText - ข้อความบริการ เช่น "ทำหน้า, กดสิว"
 * @param {number} guestsCount - จำนวนผู้เข้ารับบริการ (1-3)
 * @param {object} config - การตั้งค่าจาก Firebase config/booking
 * @returns {number} ระยะเวลารวม (นาที)
 */
export function calculateBookingDuration(serviceText, guestsCount = 1, config = DEFAULT_BOOKING_CONFIG) {
  const cfg = config || DEFAULT_BOOKING_CONFIG;
  const durations = { ...DEFAULT_BOOKING_CONFIG.serviceDurations, ...(cfg.serviceDurations || {}) };
  const rawServices = String(serviceText || '').split(',').map(s => s.trim()).filter(Boolean);

  if (rawServices.length === 0) {
    rawServices.push('default');
  }

  const getServiceDuration = (name) => {
    if (durations[name] !== undefined) return Number(durations[name]);
    const lower = name.toLowerCase();
    for (const [key, val] of Object.entries(durations)) {
      if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
        return Number(val);
      }
    }
    return Number(durations['default'] || 60);
  };

  let baseDuration = 0;
  if (cfg.enableMultiServiceAddition !== false) {
    // บวกเวลาของแต่ละบริการรวมกัน
    baseDuration = rawServices.reduce((sum, s) => sum + getServiceDuration(s), 0);
  } else {
    // ใช้เวลาของบริการที่ยาวที่สุด
    baseDuration = Math.max(...rawServices.map(s => getServiceDuration(s)), 30);
  }

  // ปรับตามจำนวนผู้เข้ารับบริการ
  const gCount = Math.min(3, Math.max(1, Number(guestsCount || 1)));
  let totalDuration = baseDuration;

  if (gCount > 1) {
    if (cfg.guestDurationMode === 'multiply') {
      totalDuration = baseDuration * gCount;
    } else if (cfg.guestDurationMode === 'consecutive_buffer') {
      const extraPerGuest = Number(cfg.extraMinutesPerGuest ?? 30);
      totalDuration = baseDuration + ((gCount - 1) * extraPerGuest);
    } else {
      // 'concurrent' - ทำพร้อมกัน เตียงคู่ ใช้เวลาเท่าเดิม
      totalDuration = baseDuration;
    }
  }

  const maxCap = Number(cfg.maxBookingDuration || 180);
  return Math.min(maxCap, Math.max(15, totalDuration));
}

