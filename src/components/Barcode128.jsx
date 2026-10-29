import React from 'react';

// Official ISO/IEC 15417 Code 128 module width table (values 0..106)
// Values 0..105: 6 widths (bar, space, bar, space, bar, space) = 11 modules
// Value 106 (STOP): 7 widths (bar, space, bar, space, bar, space, bar) = 13 modules
const CODE128_WIDTHS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112'
];

export function encodeCode128B(rawValue) {
  const clean = String(rawValue || '').replace(/[^\x20-\x7E]/g, '').trim();
  if (!clean) return null;

  const codes = [104]; // Start Code B
  let checksum = 104;

  for (let i = 0; i < clean.length; i++) {
    const val = clean.charCodeAt(i) - 32;
    codes.push(val);
    checksum += val * (i + 1);
  }

  codes.push(checksum % 103);
  codes.push(106); // Stop Code

  const bars = [];
  let cursor = 10; // Left quiet zone = 10 modules
  for (const code of codes) {
    const pattern = CODE128_WIDTHS[code];
    for (let j = 0; j < pattern.length; j++) {
      const w = Number(pattern[j]);
      if (j % 2 === 0) {
        bars.push({ x: cursor, w });
      }
      cursor += w;
    }
  }
  const totalModules = cursor + 10; // Right quiet zone = 10 modules
  return { clean, bars, totalModules };
}

export default function Barcode128({
  value,
  height = 54,
  showText = true,
  className = '',
  textClassName = 'text-xs font-mono font-black tracking-widest mt-1 text-black'
}) {
  const encoded = encodeCode128B(value);
  if (!encoded) return null;

  return (
    <div className={`flex flex-col items-center w-full ${className}`}>
      <svg
        viewBox={`0 0 ${encoded.totalModules} ${height}`}
        className="w-full max-w-full block"
        style={{ height: `${height}px` }}
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
      >
        <rect x="0" y="0" width={encoded.totalModules} height={height} fill="#ffffff" />
        {encoded.bars.map((b, idx) => (
          <rect key={idx} x={b.x} y="0" width={b.w} height={height} fill="#000000" />
        ))}
      </svg>
      {showText && (
        <div className={textClassName}>{encoded.clean}</div>
      )}
    </div>
  );
}

