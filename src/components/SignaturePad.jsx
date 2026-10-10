/**
 * ✍️ Digital Signature Pad component - shared across App.jsx and App_mobile.tsx
 */
import React, { useState, useEffect, useRef } from 'react';

export default function SignaturePad({ label, onSigned, canvasRef: propCanvasRef }) {
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
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { offsetX: clientX - rect.left, offsetY: clientY - rect.top };
  };

  const startDrawing = (e) => {
    const { offsetX, offsetY } = getCoordinates(e);
    const canvas = canvasRef.current;
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
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      if (onSigned) onSigned(canvasRef.current.toDataURL('image/png'));
    }
  };

  const clear = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    delete canvas.dataset.isSigned;
    if (onSigned) onSigned(null);
  };

  return (
    <div className="relative border-2 border-gray-200 rounded-xl overflow-hidden bg-white shadow-inner touch-none">
      <div className="absolute top-2 left-3 text-[10px] font-bold text-gray-300 pointer-events-none">{label}</div>
      <canvas
        ref={canvasRef}
        width={500}
        height={150}
        className="w-full h-[150px] cursor-crosshair touch-none"
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
        className="absolute bottom-2 right-2 text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded-lg font-bold shadow-sm transition-colors z-10"
      >
        เซ็นใหม่
      </button>
    </div>
  );
}