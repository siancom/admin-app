import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle, Flame, Sparkles } from 'lucide-react';

export function getBookingDateObject(b) {
  if (!b) return null;

  // 1. Check if b.dateTime exists
  if (b.dateTime && typeof b.dateTime === 'string' && b.dateTime.includes('T')) {
    const d = new Date(b.dateTime);
    if (!isNaN(d.getTime())) return d;
  }

  // 2. Parse from date and time strings
  const dateVal = b.date || b["วันที่"] || b.bookingDate;
  const timeVal = b.time || b["เวลา"] || b.bookingTime;

  if (dateVal) {
    let dateStr = String(dateVal).trim();
    const parts = dateStr.split(/[-/]/);
    if (parts.length === 3) {
      let y = parseInt(parts[0], 10);
      let m = parseInt(parts[1], 10);
      let d = parseInt(parts[2], 10);

      // Check if format is DD/MM/YYYY
      if (parts[2].length === 4) {
        d = parseInt(parts[0], 10);
        m = parseInt(parts[1], 10);
        y = parseInt(parts[2], 10);
      }

      // Convert Buddhist year to Gregorian
      if (y > 2400) y -= 543;
      else if (y < 100) y = y >= 55 ? y + 2500 - 543 : y + 2000;

      dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }

    let hh = 10;
    let mm = 0;
    if (timeVal) {
      const normalizedTime = String(timeVal).trim().replace(/\./g, ':');
      const timeMatch = normalizedTime.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        hh = Math.min(23, parseInt(timeMatch[1], 10) || 0);
        mm = Math.min(59, parseInt(timeMatch[2], 10) || 0);
      }
    }

    const dObj = new Date(`${dateStr}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`);
    if (!isNaN(dObj.getTime())) return dObj;
  }

  return null;
}

export default function BookingCountdown({ booking, compact = false, className = '' }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // Tick every 1 second for live countdown
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!booking) return null;

  const st = String(booking.status || '').trim();

  // Completed
  if (st === 'เสร็จสิ้น' || st === 'ให้บริการเสร็จสิ้น') {
    return (
      <span className={`inline-flex items-center gap-1 font-bold text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 ${className}`}>
        <CheckCircle size={11} className="text-emerald-600" /> เสร็จสิ้น
      </span>
    );
  }

  // Cancelled
  if (st.includes('ยกเลิก')) {
    return (
      <span className={`inline-flex items-center gap-1 font-bold text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200 ${className}`}>
        ✕ {st}
      </span>
    );
  }

  // In service
  if (st === 'กำลังใช้บริการ' || st === 'กำลังให้บริการ') {
    let elapsedText = 'กำลังรับบริการ';
    if (booking.serviceStartTime) {
      const start = new Date(booking.serviceStartTime).getTime();
      const diffMs = Math.max(0, now.getTime() - start);
      const mins = Math.floor(diffMs / 60000);
      const secs = Math.floor((diffMs % 60000) / 1000);
      elapsedText = `รับบริการแล้ว ${mins}:${String(secs).padStart(2, '0')} น.`;
    }
    return (
      <span className={`inline-flex items-center gap-1 font-black text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 animate-pulse ${className}`}>
        <Flame size={11} className="text-purple-600" /> {elapsedText}
      </span>
    );
  }

  // Upcoming appointment countdown
  const targetDate = getBookingDateObject(booking);
  if (!targetDate) return null;

  const diffMs = targetDate.getTime() - now.getTime();

  // More than 2 days away
  if (diffMs > 86400000 * 2) {
    const days = Math.floor(diffMs / 86400000);
    return (
      <span className={`inline-flex items-center gap-1 font-bold text-[10px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 ${className}`}>
        <Clock size={11} className="text-slate-400" /> อีก {days} วัน
      </span>
    );
  }

  // 1 to 2 days away
  if (diffMs > 86400000) {
    const days = Math.floor(diffMs / 86400000);
    const hours = Math.floor((diffMs % 86400000) / 3600000);
    return (
      <span className={`inline-flex items-center gap-1 font-bold text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 ${className}`}>
        <Clock size={11} className="text-indigo-500" /> อีก {days} วัน {hours} ชม.
      </span>
    );
  }

  // 1 to 24 hours away (today or tomorrow)
  if (diffMs > 3600000) {
    const hours = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    return (
      <span className={`inline-flex items-center gap-1 font-extrabold text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 shadow-sm ${className}`}>
        <Clock size={11} className="text-blue-500" /> อีก {hours} ชม. {mins} นาที
      </span>
    );
  }

  // Less than 60 minutes away (Live ticking countdown!)
  if (diffMs > 60000) {
    const mins = Math.floor(diffMs / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    return (
      <span className={`inline-flex items-center gap-1 font-black text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-300 shadow-sm animate-pulse ${className}`}>
        <Clock size={11} className="text-amber-600" /> อีก {mins} นาที {String(secs).padStart(2, '0')} วิ
      </span>
    );
  }

  // Right now (-3 mins to +1 min)
  if (diffMs >= -180000) {
    return (
      <span className={`inline-flex items-center gap-1 font-black text-[10px] text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-300 shadow-md animate-bounce ${className}`}>
        <Sparkles size={11} className="text-emerald-700" /> ถึงเวลานัดแล้ว!
      </span>
    );
  }

  // Overdue / Late
  const overdueMins = Math.floor(Math.abs(diffMs) / 60000);
  return (
    <span className={`inline-flex items-center gap-1 font-bold text-[10px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 shadow-sm ${className}`}>
      <AlertCircle size={11} className="text-rose-500" /> เลยเวลานัด {overdueMins} นาที
    </span>
  );
}
