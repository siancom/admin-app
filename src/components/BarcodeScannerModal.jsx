import React, { useEffect, useState, useRef } from 'react';
import { X, Camera } from 'lucide-react';

export default function BarcodeScannerModal({ isOpen, onClose, onScan, continuous = false }) {
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    import('html5-qrcode').then((module) => {
      if (!isMounted) return;
      const { Html5Qrcode } = module;
      
      const timer = setTimeout(() => {
        try {
          const html5QrCode = new Html5Qrcode("reader");
          scannerRef.current = html5QrCode;

          let lastScanned = null;
          let timeoutId = null;

          html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 150 } },
            (decodedText) => {
              if (continuous) {
                if (lastScanned !== decodedText) {
                  lastScanned = decodedText;
                  onScan(decodedText);
                  if (timeoutId) clearTimeout(timeoutId);
                  timeoutId = setTimeout(() => {
                    lastScanned = null;
                  }, 2000);
                }
              } else {
                // We need to stop it manually before firing onScan
                html5QrCode.stop().then(() => {
                   html5QrCode.clear();
                   onScan(decodedText);
                }).catch(err => {
                   onScan(decodedText);
                });
              }
            },
            () => {
              // Ignore scanning errors (no code found)
            }
          ).catch((err) => {
             console.error("Camera start failed:", err);
             setError("ไม่สามารถเปิดกล้องได้ กรุณาตรวจสอบสิทธิ์การเข้าถึงกล้อง หรืออุปกรณ์นี้อาจไม่มีกล้อง");
          });

        } catch (err) {
          console.error(err);
          setError("ไม่สามารถเปิดกล้องได้ กรุณาตรวจสอบสิทธิ์การเข้าถึงกล้อง");
        }
      }, 100);
    }).catch(err => {
      console.error(err);
      setError("โหลดไลบรารีแสกนเนอร์ไม่สำเร็จ");
    });

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        try {
           scannerRef.current.stop().then(() => {
             scannerRef.current.clear();
           }).catch(() => {});
        } catch (e) {}
        scannerRef.current = null;
      }
    };
  }, [isOpen, onScan]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2 font-bold text-slate-700">
            <Camera size={20} className="text-indigo-500" /> แสกนบาร์โค้ด / คิวอาร์โค้ด
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6">
          {error ? (
            <div className="text-red-500 text-center text-sm font-medium p-4 bg-red-50 rounded-xl">
              {error}
            </div>
          ) : (
            <div id="reader" className="w-full rounded-2xl overflow-hidden border-2 border-slate-100"></div>
          )}
          <p className="text-center text-slate-400 text-xs mt-4">
            หันกล้องไปที่บาร์โค้ดหรือคิวอาร์โค้ด ระบบจะอ่านอัตโนมัติ
          </p>
        </div>
      </div>
    </div>
  );
}
