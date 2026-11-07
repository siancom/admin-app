import React, { useRef, useEffect } from 'react';
import { Printer, X, ShieldCheck, QrCode, FileText } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import { getFuzzyKey } from '../utils/fuzzy';
import { parseNumber, parseQty } from '../utils/parse';
import {
  isUsageType,
  isAddType,
  isFreeUsageApp as isFreeUsage,
  extractHistoryQty,
  isMoleHistoryRecord,
  getHistorySortTime
} from '../utils/courseUtils';

const parseSignatureUrl = (sig) => {
  if (!sig) return null;
  const str = String(sig).trim();
  if (!str) return null;
  if (str.startsWith('http') || str.startsWith('data:image')) return str;
  if (str.includes('ประวัติการใช้บริการ_Images') || str.includes('_Images')) {
    return `https://crm.irisnatures.com/ประวัติการใช้บริการ_Images/${str.split(/[/\\]/).pop()}`;
  }
  if (str.match(/\.(jpeg|jpg|gif|png|webp)$/i) || str.includes('.รูปลูกค้า.') || str.includes('signature')) {
    return `https://crm.irisnatures.com/uploads/customer_photos/${str.split(/[/\\]/).pop()}`;
  }
  return str;
};

const isImageSignature = (s) => Boolean(s && (s.startsWith('http') || s.startsWith('data:image')));

export function getCourseQrValue(course) {
  if (!course) return '';
  const explicitRef = String(
    getFuzzyKey(course, ['เลขที่ใบคอส', 'col_2']) ||
    course.courseRefKey ||
    course.id ||
    ''
  ).trim();
  return explicitRef;
}

export function CoursePrintSheet({
  course,
  masterCourses = [],
  shopName = 'IrisCare Clinic',
  pageBreakAfter = false
}) {
  if (!course) return null;

  const courseRef = getCourseQrValue(course);
  const displayRef = String(
    getFuzzyKey(course, ['เลขที่ใบคอส', 'col_2']) ||
    course.courseRefKey ||
    course.id ||
    '-'
  ).trim();

  const courseCode = String(getFuzzyKey(course, ['รหัสคอส', 'col_1']) || '').trim();
  const courseName = String(getFuzzyKey(course, ['ชื่อคอส', 'ชื่อคอร์ส', 'col_8']) || '-').trim();
  const customerName = String(getFuzzyKey(course, ['ผู้ซื้อคอส', 'ชื่อลูกค้า', 'ชื่อ', 'col_9']) || '-').trim();
  const customerPhone = String(getFuzzyKey(course, ['เบอร์โทร', 'col_1']) || '-').trim();
  const purchaseDate = String(getFuzzyKey(course, ['วันที่ซื้อ', 'col_3']) || '-').trim();
  const purchaseBranch = String(getFuzzyKey(course, ['สาขาที่ซื้อ', 'สาขา', 'branch']) || '-').trim();
  const expireDate = String(course.computedExpireDate || getFuzzyKey(course, ['วันหมดอายุ', 'expireDate']) || '-').trim();
  const durationText = String(course.durationText || '').trim();
  const statusText = String(course.computedStatus || getFuzzyKey(course, ['สถานะ']) || 'ยังคงเหลือ').trim();
  const pendingAmount = Number(course.computedPendingAmount ?? parseNumber(getFuzzyKey(course, ['ยอดค้างชำระ', 'pending']))) || 0;

  const totalSessions = Math.max(
    1,
    Number(course.computedTotalQty ?? parseQty(getFuzzyKey(course, ['จำนวนครั้งที่ได้', 'จำนวนรวม', 'col_10']))) || 1
  );
  const usedSessions = Math.min(
    totalSessions,
    Math.max(0, Number(course.computedUsedQty ?? parseQty(getFuzzyKey(course, ['ครั้งที่ใช้', 'รวมใช้งานแล้ว', 'col_5'])) ?? 0))
  );
  const remainSessions = Math.max(
    0,
    Number(course.computedRemainQty ?? (totalSessions - usedSessions))
  );

  const totalCredit = Number(course.computedTotalCredit || 0);
  const usedCredit = Number(course.computedUsedCredit || 0);
  const remainCredit = Number(course.computedRemainCredit || 0);

  let includedItemsRaw = String(getFuzzyKey(course, ['รายการที่ได้รับ', 'col_11']) || '').trim();
  if (!includedItemsRaw && Array.isArray(masterCourses) && masterCourses.length > 0) {
    const matchedMaster = masterCourses.find(
      (m) => String(getFuzzyKey(m, ['ชื่อคอส', 'col_4']) || '').trim() === courseName
    );
    if (matchedMaster) {
      includedItemsRaw = String(getFuzzyKey(matchedMaster, ['รายการที่ได้รับ', 'col_11']) || '').trim();
    }
  }
  const cleanIncludedItems = includedItemsRaw
    ? includedItemsRaw.replace(/\\n/g, ' • ').replace(/\s*\n+\s*/g, ' • ').trim()
    : '';

  // Sort histories chronologically (oldest -> newest) so Visit #1 is first
  const validHistories = (course.myHistories || [])
    .filter((h) => {
      if (!h) return false;
      if (h.isCancelled) return false;
      const st = String(getFuzzyKey(h, ['สถานะ', 'col_7', 'col_8', 'col_9']) || '').trim();
      if (st === 'ยกเลิก') return false;
      if (isMoleHistoryRecord(h)) return false;
      return true;
    })
    .slice()
    .sort((a, b) => getHistorySortTime(a) - getHistorySortTime(b));

  const sessionHistories = [];
  const creditHistories = [];
  const extraNoteHistories = [];

  validHistories.forEach((h) => {
    const type = String(getFuzzyKey(h, ['ประเภท', 'col_4']) || '').trim();
    const itemDesc = String(getFuzzyKey(h, ['รายการ', 'สินค้า', 'col_23', 'col_18']) || '').trim();
    const deductVal = parseNumber(getFuzzyKey(h, ['ยอดสินค้า', 'ยอดจัดซื้อ', 'ยอดเงิน', 'ยอดเบิก', 'ยอดหัก', 'ยอดหักเครดิต', 'col_19']));
    const rawQty = getFuzzyKey(h, ['จำนวน', 'จำนวนที่ใช้', 'ตัดคอร์ส', 'col_15']);

    if (isAddType(type)) {
      extraNoteHistories.push({ h, kind: 'add' });
      return;
    }

    if (isFreeUsage(h)) {
      extraNoteHistories.push({ h, kind: 'free' });
      return;
    }

    if (isUsageType(type)) {
      const isPureCreditRecord =
        (deductVal > 0 && (rawQty === undefined || rawQty === '' || String(rawQty).trim() === '0')) ||
        type.includes('เบิกสินค้า') ||
        type.includes('เบิกใช้เครดิต') ||
        itemDesc.startsWith('โอนเครดิต') ||
        itemDesc.startsWith('หักลดเครดิต');

      if (isPureCreditRecord) {
        creditHistories.push(h);
      } else {
        sessionHistories.push(h);
      }
    }
  });

  // Build numbered session rows (1 .. totalSessions)
  const sessionRows = [];
  const loggedSessionSum = sessionHistories.reduce((sum, h) => sum + Math.max(1, extractHistoryQty(h)), 0);
  const priorUnloggedUsed = Math.max(0, usedSessions - loggedSessionSum);

  let currentSlot = 0;

  if (priorUnloggedUsed > 0) {
    if (priorUnloggedUsed <= 5) {
      for (let k = 0; k < priorUnloggedUsed; k++) {
        currentSlot += 1;
        sessionRows.push({
          rowType: 'legacy_used',
          slotLabel: String(currentSlot)
        });
      }
    } else {
      const startSlot = currentSlot + 1;
      const endSlot = currentSlot + priorUnloggedUsed;
      currentSlot = endSlot;
      sessionRows.push({
        rowType: 'legacy_used_summary',
        slotLabel: `${startSlot}–${endSlot}`,
        qty: priorUnloggedUsed
      });
    }
  }

  sessionHistories.forEach((h) => {
    const qty = Math.max(1, extractHistoryQty(h));
    const startSlot = currentSlot + 1;
    const endSlot = currentSlot + qty;
    currentSlot = endSlot;
    sessionRows.push({
      rowType: 'online_used',
      slotLabel: qty === 1 ? String(startSlot) : `${startSlot}–${endSlot}`,
      qty,
      history: h
    });
  });

  // Fill blank write-in rows up to totalSessions (capped safely at +100 rows)
  const blankStart = Math.max(currentSlot, usedSessions) + 1;
  const maxSafeTotal = Math.min(totalSessions, blankStart + 99);
  for (let slot = blankStart; slot <= maxSafeTotal; slot++) {
    sessionRows.push({
      rowType: 'blank',
      slotLabel: String(slot)
    });
  }

  // Adaptive row height so 1–12 sessions comfortably fit on 1 single A4 page
  const isCompactTable = sessionRows.length > 10 || totalCredit > 0;
  const rowHeightClass = sessionRows.length <= 8
    ? 'h-[13.5mm]'
    : isCompactTable
      ? 'h-[10.5mm]'
      : 'h-[12mm]';

  const renderSignatureCell = (rawSig, fallbackStaffName = '') => {
    const parsed = parseSignatureUrl(rawSig);
    if (parsed && isImageSignature(parsed)) {
      return (
        <div className="flex items-center justify-center w-full h-full px-1">
          <img
            src={parsed}
            alt="Signature"
            className="max-h-[8.5mm] max-w-full object-contain mix-blend-multiply"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.nextElementSibling) {
                e.currentTarget.nextElementSibling.style.display = 'inline-flex';
              }
            }}
          />
          <span className="hidden items-center gap-0.5 text-[9px] font-bold text-emerald-700">
            <ShieldCheck size={11} className="text-emerald-600" /> Verified
          </span>
        </div>
      );
    }
    if (parsed || fallbackStaffName) {
      return (
        <div className="flex flex-col items-center justify-center leading-tight">
          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700">
            <ShieldCheck size={11} className="text-emerald-600" />
            {fallbackStaffName && fallbackStaffName !== 'ระบบ' ? fallbackStaffName : 'Verified'}
          </span>
        </div>
      );
    }
    return <span className="text-[9px] text-slate-400">บันทึกออนไลน์</span>;
  };

  return (
    <div
      style={{
        pageBreakAfter: pageBreakAfter ? 'always' : 'auto',
        breakAfter: pageBreakAfter ? 'page' : 'auto',
        fontFamily: "'Sarabun', 'Prompt', -apple-system, BlinkMacSystemFont, sans-serif"
      }}
      className="course-a4-sheet w-[210mm] min-h-[297mm] mx-auto bg-white text-slate-900 box-border px-[10mm] py-[9mm] shadow-xl mb-6 print:shadow-none print:mb-0 print:w-[210mm] print:min-h-[297mm] flex flex-col justify-between border border-slate-200 print:border-0"
    >
      <div>
        {/* 1. Header with Clinic Title & QR Code */}
        <div className="flex items-start justify-between gap-4 pb-2.5 border-b-2 border-slate-800">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] font-extrabold tracking-[0.18em] text-teal-700 uppercase">
                {shopName}
              </span>
              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                เอกสารใช้ได้ทั้งออนไลน์ & กระดาษ
              </span>
            </div>
            <h1 className="text-[20px] font-black text-slate-900 leading-tight">
              ใบคอร์สรับบริการ (Course Service Card)
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[10.5px] text-slate-700">
              <span>
                เลขที่ใบคอร์ส: <strong className="font-mono text-slate-950">{displayRef}</strong>
              </span>
              {courseCode && courseCode !== displayRef && (
                <span>
                  รหัสคอร์ส: <strong className="font-mono">{courseCode}</strong>
                </span>
              )}
              <span>
                สาขา: <strong>{purchaseBranch}</strong>
              </span>
              <span>
                วันที่ซื้อ: <strong>{purchaseDate}</strong>
              </span>
              <span>
                วันหมดอายุ: <strong>{expireDate}</strong>
                {durationText ? ` (${durationText})` : ''}
              </span>
            </div>
          </div>

          {courseRef && (
            <div className="shrink-0 flex items-center gap-2.5 border-2 border-slate-800 rounded-xl px-2.5 py-1.5 bg-white">
              <QRCodeSVG value={courseRef} size={66} level="M" />
              <div className="flex flex-col justify-center max-w-[96px]">
                <span className="text-[8.5px] font-black text-teal-700 uppercase tracking-wider leading-tight flex items-center gap-0.5">
                  <QrCode size={10} /> สแกนใช้คอร์ส
                </span>
                <span className="text-[8px] text-slate-500 leading-tight mt-0.5">
                  ยื่นสแกนที่จุดบริการ POS หรือตัดคอร์สออนไลน์
                </span>
                <span className="text-[9px] font-mono font-black text-slate-900 mt-1 truncate" title={courseRef}>
                  {courseRef}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 2. Customer Info & Session/Credit Summary */}
        <div className="grid grid-cols-12 gap-2.5 my-2.5">
          <div className="col-span-7 border border-slate-300 rounded-xl px-3 py-2 bg-slate-50/60 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">ชื่อคอร์ส / โปรแกรม</p>
                  <p className="text-[13.5px] font-black text-teal-900 leading-snug break-words">{courseName}</p>
                </div>
                <span
                  className={`shrink-0 px-2 py-0.5 rounded text-[9.5px] font-extrabold border ${
                    pendingAmount > 0
                      ? 'bg-red-50 text-red-700 border-red-300'
                      : statusText === 'ยังคงเหลือ'
                        ? 'bg-teal-50 text-teal-800 border-teal-300'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  {pendingAmount > 0 ? `ค้างชำระ ฿${pendingAmount.toLocaleString()}` : statusText}
                </span>
              </div>
              {cleanIncludedItems && (
                <p className="text-[9px] text-slate-600 mt-1 line-clamp-2 leading-snug">
                  <strong>รายการที่ได้รับ:</strong> {cleanIncludedItems}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2 pt-1.5 border-t border-slate-200 text-[11px]">
              <div className="truncate">
                <span className="text-slate-500 font-semibold mr-1">ชื่อลูกค้า:</span>
                <strong className="text-slate-900 font-extrabold">{customerName}</strong>
              </div>
              <div className="truncate">
                <span className="text-slate-500 font-semibold mr-1">เบอร์โทร:</span>
                <strong className="font-mono text-slate-900 font-extrabold">{customerPhone}</strong>
              </div>
            </div>
          </div>

          <div className="col-span-5 flex flex-col gap-1.5 justify-center">
            <div className="grid grid-cols-3 border-2 border-slate-800 rounded-xl overflow-hidden text-center bg-white flex-1 items-center py-1.5">
              <div className="px-1">
                <p className="text-[8.5px] font-bold text-slate-500 uppercase">ครั้งที่ได้รับ</p>
                <p className="text-[18px] font-black text-slate-900 leading-tight">{totalSessions}</p>
              </div>
              <div className="px-1 border-x border-slate-200">
                <p className="text-[8.5px] font-bold text-slate-500 uppercase">ใช้ไปแล้ว</p>
                <p className="text-[18px] font-black text-slate-700 leading-tight">{usedSessions}</p>
              </div>
              <div className="px-1 bg-teal-50/70 h-full flex flex-col justify-center">
                <p className="text-[8.5px] font-extrabold text-teal-800 uppercase">คงเหลือ</p>
                <p className="text-[20px] font-black text-teal-700 leading-tight">{remainSessions}</p>
              </div>
            </div>

            {totalCredit > 0 && (
              <div className="grid grid-cols-3 border border-orange-300 rounded-lg px-2 py-1 text-center bg-orange-50/60 text-[9.5px]">
                <div>
                  <span className="text-orange-700 font-semibold">วงเงิน: </span>
                  <strong className="text-orange-900">฿{totalCredit.toLocaleString()}</strong>
                </div>
                <div className="border-x border-orange-200">
                  <span className="text-orange-700 font-semibold">ใช้ไป: </span>
                  <strong className="text-orange-900">฿{usedCredit.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-orange-700 font-bold">เหลือ: </span>
                  <strong className="text-orange-700 font-black">฿{remainCredit.toLocaleString()}</strong>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Session Usage & Paper Sign-off Table */}
        <div className="mt-1">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
              <FileText size={13} className="text-teal-700" />
              ตารางบันทึกการรับบริการ (ครบตามจำนวน {totalSessions} ครั้ง — รองรับทั้งออนไลน์และเซ็นบนกระดาษ)
            </h2>
            <span className="text-[9px] text-slate-500 font-semibold">
              ช่องว่างคงเหลือ {Math.max(0, maxSafeTotal - blankStart + 1)} ช่อง
            </span>
          </div>

          <table className="w-full border-collapse border border-slate-400 text-[10.5px] table-fixed">
            <thead className="bg-slate-100 text-slate-800" style={{ display: 'table-header-group' }}>
              <tr>
                <th className="border border-slate-400 py-1.5 px-1 text-center font-extrabold w-[12mm]">ครั้งที่</th>
                <th className="border border-slate-400 py-1.5 px-1.5 text-center font-extrabold w-[26mm]">วันที่ / เวลา</th>
                <th className="border border-slate-400 py-1.5 px-2 text-left font-extrabold">รายการบริการที่ใช้ / หมายเหตุ</th>
                <th className="border border-slate-400 py-1.5 px-1 text-center font-extrabold w-[34mm]">ลายเซ็นลูกค้า</th>
                <th className="border border-slate-400 py-1.5 px-1 text-center font-extrabold w-[34mm]">ลายเซ็นพนักงาน</th>
              </tr>
            </thead>
            <tbody>
              {sessionRows.map((row, idx) => {
                if (row.rowType === 'online_used') {
                  const h = row.history;
                  const dateStr = String(getFuzzyKey(h, ['วันที่', 'col_1']) || '-').trim();
                  const timeStr = String(getFuzzyKey(h, ['เวลา', 'col_2']) || '').trim();
                  const itemStr = String(
                    getFuzzyKey(h, ['รายการ', 'สินค้า', 'col_23', 'col_18']) || 'รับบริการตามคอร์ส'
                  ).trim();
                  const staffName = String(
                    getFuzzyKey(h, ['ชื่อเจ้าหน้าที่', 'พนักงาน', 'ผู้ให้บริการ']) || ''
                  ).trim();
                  const notes = String(h.treatmentNotes || getFuzzyKey(h, ['หมายเหตุ']) || '').trim();
                  const cSig = getFuzzyKey(h, [
                    'ลายเซนต์ลูกค้า',
                    'ลายเซ็นลูกค้า',
                    'ลายเซ็นต์ลูกค้า',
                    'customerSignature',
                    'ลายมือชื่อลูกค้า'
                  ]);
                  const sSig = getFuzzyKey(h, [
                    'ลายเซนต์เจ้าหน้าที่',
                    'ลายเซ็นเจ้าหน้าที่',
                    'ลายเซ็นต์เจ้าหน้าที่',
                    'ลายเซนต์พนักงาน',
                    'ลายเซ็นพนักงาน',
                    'staffSignature'
                  ]);

                  return (
                    <tr
                      key={`used_${idx}`}
                      style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                      className={`${rowHeightClass} bg-slate-50/40`}
                    >
                      <td className="border border-slate-400 px-1 text-center font-black text-slate-900 align-middle">
                        {row.slotLabel}
                      </td>
                      <td className="border border-slate-400 px-1.5 text-center font-mono text-[9.5px] text-slate-800 align-middle leading-tight">
                        <div className="font-bold">{dateStr}</div>
                        {timeStr && /^\d{1,2}:\d{2}/.test(timeStr) && (
                          <div className="text-[8.5px] text-slate-500">{timeStr} น.</div>
                        )}
                      </td>
                      <td className="border border-slate-400 px-2 py-1 align-middle leading-snug">
                        <div className="font-bold text-slate-900 line-clamp-2">{itemStr}</div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[8.5px] text-slate-600">
                          <span className="px-1.5 py-0 rounded bg-teal-50 text-teal-800 border border-teal-200 font-bold">
                            ออนไลน์ • หัก {row.qty} ครั้ง
                          </span>
                          {staffName && <span>ผู้ให้บริการ: {staffName}</span>}
                          {notes && <span className="text-slate-500">({notes})</span>}
                        </div>
                      </td>
                      <td className="border border-slate-400 px-1 py-0.5 text-center align-middle">
                        {renderSignatureCell(cSig)}
                      </td>
                      <td className="border border-slate-400 px-1 py-0.5 text-center align-middle">
                        {renderSignatureCell(sSig, staffName)}
                      </td>
                    </tr>
                  );
                }

                if (row.rowType === 'legacy_used' || row.rowType === 'legacy_used_summary') {
                  return (
                    <tr
                      key={`legacy_${idx}`}
                      style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                      className={`${rowHeightClass} bg-slate-50/40`}
                    >
                      <td className="border border-slate-400 px-1 text-center font-black text-slate-800 align-middle">
                        {row.slotLabel}
                      </td>
                      <td className="border border-slate-400 px-1.5 text-center text-[9.5px] text-slate-500 align-middle">
                        -
                      </td>
                      <td className="border border-slate-400 px-2 align-middle text-[10px] text-slate-700 font-semibold">
                        {row.rowType === 'legacy_used_summary'
                          ? `ใช้บริการแล้วในระบบ (${row.qty} ครั้ง)`
                          : 'ใช้บริการแล้ว (บันทึกยอดสะสมในระบบ)'}
                      </td>
                      <td className="border border-slate-400 px-1 text-center align-middle text-[9px] text-slate-500 font-semibold">
                        บันทึกในระบบ
                      </td>
                      <td className="border border-slate-400 px-1 text-center align-middle text-[9px] text-slate-500 font-semibold">
                        บันทึกในระบบ
                      </td>
                    </tr>
                  );
                }

                // Blank write-in row for paper usage
                return (
                  <tr
                    key={`blank_${idx}`}
                    style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                    className={rowHeightClass}
                  >
                    <td className="border border-slate-400 px-1 text-center font-bold text-slate-700 align-middle">
                      {row.slotLabel}
                    </td>
                    <td className="border border-slate-400 px-1.5 text-center align-bottom pb-1.5 text-[9px] text-slate-300 font-mono select-none">
                      ....../....../......
                    </td>
                    <td className="border border-slate-400 px-2 align-bottom pb-1.5">
                      <div className="w-full border-b border-dotted border-slate-300 h-4"></div>
                    </td>
                    <td className="border border-slate-400 px-2 align-bottom pb-1.5">
                      <div className="w-full border-b border-dotted border-slate-300 h-4"></div>
                    </td>
                    <td className="border border-slate-400 px-2 align-bottom pb-1.5">
                      <div className="w-full border-b border-dotted border-slate-300 h-4"></div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Optional Free/Bonus or Add-on Footnotes */}
        {extraNoteHistories.length > 0 && (
          <div className="mt-2 border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50/50 text-[9.5px]" style={{ breakInside: 'avoid' }}>
            <span className="font-bold text-slate-700 mr-2">รายการเสริม / อัปคอร์ส / ไม่หักยอด:</span>
            {extraNoteHistories.map(({ h, kind }, idx) => (
              <span key={idx} className="inline-block mr-3 text-slate-600">
                • {String(getFuzzyKey(h, ['วันที่', 'col_1']) || '-')} —{' '}
                {String(getFuzzyKey(h, ['รายการ', 'สินค้า', 'col_23', 'col_18']) || (kind === 'add' ? 'อัปคอร์ส' : 'บริการฟรี'))}{' '}
                <strong>({kind === 'add' ? `+${extractHistoryQty(h)} ครั้ง` : 'ไม่หักยอด'})</strong>
              </span>
            ))}
          </div>
        )}

        {/* Optional Credit / Product Withdrawal Sub-table */}
        {(creditHistories.length > 0 || totalCredit > 0) && (
          <div className="mt-2.5" style={{ breakInside: 'avoid' }}>
            <h3 className="text-[10px] font-black text-orange-800 mb-1">
              ประวัติการเบิกสินค้า / ใช้วงเงินเครดิต (คงเหลือ ฿{remainCredit.toLocaleString()})
            </h3>
            <table className="w-full border-collapse border border-slate-400 text-[9.5px] table-fixed">
              <thead className="bg-orange-50/70 text-slate-800">
                <tr>
                  <th className="border border-slate-400 py-1 px-1.5 text-center w-[24mm]">วันที่</th>
                  <th className="border border-slate-400 py-1 px-2 text-left">รายการที่เบิก / หักวงเงิน</th>
                  <th className="border border-slate-400 py-1 px-1.5 text-right w-[24mm]">ยอดเบิก (฿)</th>
                  <th className="border border-slate-400 py-1 px-1 text-center w-[32mm]">ลายเซ็นลูกค้า</th>
                  <th className="border border-slate-400 py-1 px-1 text-center w-[32mm]">ลายเซ็นพนักงาน</th>
                </tr>
              </thead>
              <tbody>
                {creditHistories.map((h, i) => {
                  const amt = parseNumber(
                    getFuzzyKey(h, ['ยอดสินค้า', 'ยอดจัดซื้อ', 'ยอดเงิน', 'ยอดเบิก', 'ยอดหัก', 'ยอดหักเครดิต', 'col_19'])
                  );
                  const cSig = getFuzzyKey(h, ['ลายเซนต์ลูกค้า', 'ลายเซ็นลูกค้า', 'customerSignature']);
                  const sSig = getFuzzyKey(h, ['ลายเซนต์เจ้าหน้าที่', 'ลายเซ็นพนักงาน', 'staffSignature']);
                  return (
                    <tr key={`cred_${i}`} className="h-[9.5mm]" style={{ breakInside: 'avoid' }}>
                      <td className="border border-slate-400 px-1.5 text-center font-mono">
                        {String(getFuzzyKey(h, ['วันที่', 'col_1']) || '-')}
                      </td>
                      <td className="border border-slate-400 px-2 truncate font-semibold">
                        {String(getFuzzyKey(h, ['รายการ', 'สินค้า', 'col_23', 'col_18']) || 'เบิกใช้เครดิต')}
                      </td>
                      <td className="border border-slate-400 px-1.5 text-right font-bold text-orange-800">
                        {amt > 0 ? `฿${amt.toLocaleString()}` : '-'}
                      </td>
                      <td className="border border-slate-400 px-1 text-center">{renderSignatureCell(cSig)}</td>
                      <td className="border border-slate-400 px-1 text-center">{renderSignatureCell(sSig)}</td>
                    </tr>
                  );
                })}
                {remainCredit > 0 &&
                  [1, 2].map((blankIdx) => (
                    <tr key={`cred_blank_${blankIdx}`} className="h-[9.5mm]" style={{ breakInside: 'avoid' }}>
                      <td className="border border-slate-400 px-1.5 text-center align-bottom pb-1 text-slate-300 font-mono">
                        ....../....../......
                      </td>
                      <td className="border border-slate-400 px-2 align-bottom pb-1">
                        <div className="w-full border-b border-dotted border-slate-300"></div>
                      </td>
                      <td className="border border-slate-400 px-1.5 text-right align-bottom pb-1 text-slate-300">฿............</td>
                      <td className="border border-slate-400 px-2 align-bottom pb-1">
                        <div className="w-full border-b border-dotted border-slate-300"></div>
                      </td>
                      <td className="border border-slate-400 px-2 align-bottom pb-1">
                        <div className="w-full border-b border-dotted border-slate-300"></div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Footer */}
      <div
        className="pt-2 mt-2 border-t border-slate-300 flex items-center justify-between text-[9px] text-slate-500"
        style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
      >
        <div>
          * กรุณานำใบคอร์สนี้มาแสดงหรือสแกน QR Code ทุกครั้งที่เข้ารับบริการ • กรณีใช้เอกสารกระดาษต้องมีลายเซ็นลูกค้าและพนักงานครบถ้วนทุกครั้ง
        </div>
        <div className="font-mono shrink-0 ml-3">พิมพ์เมื่อ: {new Date().toLocaleString('th-TH')}</div>
      </div>
    </div>
  );
}

export default function CoursePrintModal({
  isOpen,
  courses = [],
  masterCourses = [],
  shopName = 'IrisCare Clinic',
  autoPrint = false,
  onClose,
  onBack
}) {
  const printContainerRef = useRef(null);

  const firstRef = courses[0] ? getCourseQrValue(courses[0]) : 'Course';
  const docTitle = courses.length > 1
    ? `IrisCare-Courses-${courses.length}`
    : `IrisCare-Course-${firstRef}`;

  const handlePrint = useReactToPrint({
    contentRef: printContainerRef,
    documentTitle: docTitle,
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 0mm;
      }
      @media print {
        html, body {
          width: 210mm;
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .course-a4-sheet {
          box-shadow: none !important;
          margin: 0 !important;
          border: none !important;
        }
      }
    `
  });

  useEffect(() => {
    if (isOpen && autoPrint && courses.length > 0) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoPrint, courses.length]);

  if (!isOpen || !courses || courses.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-slate-900/75 backdrop-blur-sm flex flex-col overflow-hidden print:static print:bg-white">
      {/* Top Toolbar */}
      <div className="print:hidden bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors"
            >
              กลับ
            </button>
          )}
          <div>
            <h3 className="font-black text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <Printer size={18} className="text-teal-600" />
              ตัวอย่างใบคอร์สขนาด A4 ({courses.length} ใบ)
            </h3>
            <p className="text-xs text-slate-500 hidden sm:block">
              พร้อม QR Code สแกนตัดคอร์สออนไลน์ และตารางช่องว่างครบตามจำนวนครั้งสำหรับเซ็นบนกระดาษ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => handlePrint()}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-black text-sm flex items-center gap-2 shadow-md shadow-teal-600/20 active:scale-95 transition-all"
          >
            <Printer size={17} />
            สั่งพิมพ์ขนาด A4 {courses.length > 1 ? `(${courses.length} ใบ)` : ''}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
            title="ปิดหน้าต่าง"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Scrollable A4 Preview Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/80 print:p-0 print:bg-white print:overflow-visible">
        <div ref={printContainerRef} className="mx-auto w-fit print:w-full">
          {courses.map((c, idx) => (
            <CoursePrintSheet
              key={c.id || idx}
              course={c}
              masterCourses={masterCourses}
              shopName={shopName}
              pageBreakAfter={idx < courses.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

