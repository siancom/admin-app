import React, { useRef } from 'react';
import { X, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

export default function TreatmentJobSlipModal({ isOpen, onClose, booking, appSettings }) {
  const componentRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    onAfterPrint: onClose
  });

  if (!isOpen || !booking) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm flex flex-col overflow-hidden max-h-[90vh]">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <Printer size={18} className="text-gray-500" />
            ตัวอย่างใบงานทรีตเมนต์
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto bg-gray-100 flex justify-center">
          {/* Slip Container */}
          <div 
            ref={componentRef} 
            className="bg-white w-[58mm] sm:w-[80mm] p-4 text-black"
            style={{ 
              fontFamily: "'Sarabun', 'Prompt', sans-serif",
              color: '#000'
            }}
          >
            {/* Header */}
            <div className="text-center mb-4 border-b border-dashed border-gray-400 pb-3">
              <h1 className="font-bold text-lg leading-tight mb-1">{appSettings?.shopName || 'IRIS CLINIC'}</h1>
              <p className="text-[11px] font-semibold mb-2">ใบสั่งงาน (JOB SLIP)</p>
              <div className="text-[10px] flex justify-between px-1">
                <span>วันที่: {booking.date}</span>
                <span>เวลา: {booking.time}</span>
              </div>
            </div>

            {/* Queue Number */}
            <div className="text-center mb-4">
              <p className="text-[10px] text-gray-600 mb-1">หมายเลขคิว</p>
              <div className="text-3xl font-black">{booking.ticketNo || booking.id?.slice(-4).toUpperCase() || '---'}</div>
            </div>

            {/* Customer Info */}
            <div className="mb-4 border-t border-b border-dashed border-gray-400 py-3">
              <div className="text-[12px] font-bold mb-1">
                ลูกค้า: {booking.customerName || 'ไม่ระบุชื่อ'}
              </div>
              <div className="text-[10px]">
                เบอร์โทร: {booking.phone || '---'}
              </div>
            </div>

            {/* Treatment Items */}
            <div className="mb-5">
              <p className="text-[11px] font-bold border-b border-black pb-1 mb-2">รายการทรีตเมนต์ / คอร์ส</p>
              <div className="text-[12px] font-bold leading-tight pl-2 border-l-2 border-black">
                {booking.courseName || booking.service || 'ไม่ระบุบริการ'}
              </div>
            </div>

            {/* Operational Notes */}
            <div className="mt-4 pt-2 border-t border-black space-y-4">
              <div className="flex items-end gap-2 text-[11px]">
                <div className="font-bold shrink-0">ห้อง / เตียง:</div>
                <div className="border-b border-dotted border-gray-500 flex-1"></div>
              </div>
              <div className="flex items-end gap-2 text-[11px]">
                <div className="font-bold shrink-0">ผู้ให้บริการ:</div>
                <div className="border-b border-dotted border-gray-500 flex-1"></div>
              </div>
              <div className="text-[11px] font-bold mb-1 mt-3">บันทึกเพิ่มเติม / จำนวนช็อต:</div>
              <div className="border-b border-dotted border-gray-500 h-6"></div>
              <div className="border-b border-dotted border-gray-500 h-6"></div>
              <div className="flex items-end gap-2 text-[11px] mt-6 pt-4">
                <div className="font-bold shrink-0">ลายเซ็นแพทย์/จนท.:</div>
                <div className="border-b border-dotted border-gray-500 flex-1"></div>
              </div>
            </div>
            
            <div className="text-center mt-6 text-[9px] text-gray-500">
              -- พิมพ์โดยระบบอัตโนมัติ --
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-white flex justify-end gap-2">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ยกเลิก
          </button>
          <button 
            onClick={() => handlePrint()} 
            className="px-6 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <Printer size={16} /> พิมพ์ใบงาน
          </button>
        </div>
      </div>
    </div>
  );
}
