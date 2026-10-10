import { useState, useEffect, useRef } from 'react';
import { X, Lock, ShieldCheck } from 'lucide-react';

/**
 * PIN Modal สำหรับยืนยันตัวตนก่อนเข้าแดชบอร์ดพนักงาน
 *
 * Props:
 * - isOpen: boolean
 * - title: string (หัวข้อ)
 * - subtitle: string (คำอธิบาย)
 * - error: string (ข้อความ error)
 * - onSubmit: (pin) => void  เรียกเมื่อผู้ใช้กดยืนยัน (ความยาว pin ตามที่ตั้ง)
 * - onClose: () => void
 * - length: number (จำนวนหลัก, default 4)
 */
export default function PinModal({ isOpen = false, title = 'กรุณาใส่รหัส PIN', subtitle = '', error = '', onSubmit, onClose, length = 4 }) {
  const [pin, setPin] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      // focus input เมื่อเปิด
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    // auto-submit เมื่อกรอกครบ
    if (pin.length === length && onSubmit) {
      onSubmit(pin);
      setPin('');
    }
  }, [pin, length, onSubmit]);

  if (!isOpen) return null;

  const handleKey = (val) => {
    if (/^\d$/.test(val) && pin.length < length) {
      setPin(pin + val);
    }
  };

  const handleBackspace = () => setPin(pin.slice(0, -1));

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-xs shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 px-6 py-5 text-white relative">
          {onClose && (
            <button onClick={onClose} className="absolute top-3 right-3 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors">
              <X size={20} />
            </button>
          )}
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-2">
            <Lock size={28} />
          </div>
          <h2 className="text-lg font-black">{title}</h2>
          {subtitle && <p className="text-xs text-white/80 mt-1">{subtitle}</p>}
        </div>

        {/* PIN dots + hidden input */}
        <div className="px-6 py-6">
          <div className="flex justify-center gap-3 mb-4">
            {Array.from({ length }).map((_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full transition-all ${i < pin.length ? 'bg-indigo-600 scale-110' : 'bg-slate-200'}`}
              />
            ))}
          </div>

          {/* hidden input รับแป้นพิมพ์ */}
          <input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            value={pin}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '').slice(0, length);
              setPin(v);
            }}
            className="opacity-0 absolute -z-10 w-1 h-1"
            aria-label="PIN input"
          />

          {error && (
            <p className="text-center text-rose-500 text-xs font-bold mb-3 animate-in shake">{error}</p>
          )}

          {/* Numeric keypad */}
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(n => (
              <button
                key={n}
                onClick={() => handleKey(n)}
                className="py-3 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xl font-black rounded-2xl transition-colors active:scale-95"
              >
                {n}
              </button>
            ))}
            <div />
            <button
              onClick={() => handleKey('0')}
              className="py-3 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xl font-black rounded-2xl transition-colors active:scale-95"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              className="py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl transition-colors active:scale-95 flex items-center justify-center"
              aria-label="ลบ"
            >
              ⌫
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 mt-4 text-slate-400">
            <ShieldCheck size={12} />
            <span className="text-[10px] font-bold">ป้อน PIN ให้ครบ {length} หลักเพื่อยืนยัน</span>
          </div>
        </div>
      </div>
    </div>
  );
}
