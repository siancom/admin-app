/**
 * ✍️ Digital Signature Pad component - shared across App.jsx and App_mobile.tsx
 */
import React, { useState, useEffect, useRef } from 'react';

export default function SignaturePad({ label, onSigned, canvasRef: propCanvasRef, height = 110 }) {
  const fallbackRef = useRef(null);
  const canvasRef = propCanvasRef || fallbackRef;
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  }, [canvasRef]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { offsetX: 0, offsetY: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = rect.width ? (canvas.width / rect.width) : 1;
    const scaleY = rect.height ? (canvas.height / rect.height) : 1;
    return { 
      offsetX: (clientX - rect.left) * scaleX, 
      offsetY: (clientY - rect.top) * scaleY 
    };
  };

  const startDrawing = (e) => {
    const { offsetX, offsetY } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    setIsDrawing(true);
    canvas.dataset.isSigned = "true";
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { offsetX, offsetY } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      if (onSigned && canvasRef.current) onSigned(canvasRef.current.toDataURL('image/png'));
    }
  };

  const clear = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    delete canvas.dataset.isSigned;
    if (onSigned) onSigned(null);
  };

  return (
    <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-white shadow-inner touch-none">
      <div className="absolute top-1.5 left-2.5 text-[10px] font-bold text-slate-400 pointer-events-none select-none">{label}</div>
      <canvas
        ref={canvasRef}
        width={500}
        height={height}
        style={{ height: `${height}px` }}
        className="w-full cursor-crosshair touch-none block"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <button
        type="button"
        onClick={clear}
        className="absolute bottom-1.5 right-1.5 text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-bold shadow-2xs transition-colors z-10"
      >
        เซ็นใหม่
      </button>
    </div>
  );
}