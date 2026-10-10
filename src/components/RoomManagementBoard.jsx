import React, { useState } from 'react';
import { Bed, User, Clock, CheckCircle, X, Phone, Activity, FileText, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { db } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function RoomManagementBoard({ bookings, orders = [], globalBranch, isOpen, onClose, onRetrieveParkedOrder }) {
  if (!isOpen) return null;

  // สมมติว่าคลินิกมี 4 เตียงหลัก (สามารถปรับเพิ่มลดได้ตามต้องการ)
  const totalBeds = 4;
  
  const [expandedBed, setExpandedBed] = useState(null);
  const [printQrBed, setPrintQrBed] = useState(null);
  
  // กรองเฉพาะคิวของสาขานี้ และวันที่ปัจจุบัน
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  
  const activeBookings = bookings.filter(b => 
    (b.date === today || b.date.replace(/\//g, '-') === today.replace(/\//g, '-')) &&
    (!globalBranch || b.branch === globalBranch || b.branch === 'สำนักงานใหญ่') &&
    b.status === 'กำลังใช้บริการ'
  );

  const parkedOrders = orders
    .filter(o => 
      o.status === 'รอชำระเงิน' && 
      o.source === 'POS_Parked' &&
      (!globalBranch || o.branch === globalBranch || o.branch === 'สำนักงานใหญ่') &&
      (new Date(o.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) === today || 
       new Date(o.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') === today.replace(/\//g, '-'))
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const handleFreeBed = async (bookingId) => {
    try {
      // เปลี่ยนสถานะคิวเป็นรอชำระเงิน หรือ เสร็จสิ้น (เพื่อให้เตียงว่าง)
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status: 'รอชำระเงิน',
        bedNumber: null
      });
      setExpandedBed(null);
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการเคลียร์เตียง');
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
              <Bed size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">ระบบจัดการเตียง (Bed Management)</h2>
              <p className="text-slate-500 text-sm font-medium">ดูสถานะและข้อมูลการใช้เตียงทรีตเมนต์แบบ Real-time</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar flex-1 pb-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: totalBeds }).map((_, index) => {
              const bedNumber = index + 1;
              const occupyingBooking = activeBookings.find(b => String(b.bedNumber) === String(bedNumber));
              const occupyingParkedOrder = parkedOrders.find(o => String(o.bedNumber) === String(bedNumber));
              const isOccupied = !!occupyingBooking || !!occupyingParkedOrder;
              const isExpanded = expandedBed === bedNumber;

              return (
                <div 
                  key={`bed-${bedNumber}`}
                  onClick={() => isOccupied && setExpandedBed(isExpanded ? null : bedNumber)}
                  className={`relative overflow-hidden rounded-2xl border-2 transition-all p-4 flex flex-col ${
                    isOccupied 
                      ? isExpanded ? 'border-rose-500 bg-white shadow-md cursor-pointer' : 'border-rose-400 bg-rose-50 shadow-sm cursor-pointer hover:bg-rose-100'
                      : 'border-emerald-200 bg-emerald-50 h-40'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className={`font-black text-lg ${isOccupied ? 'text-rose-700' : 'text-emerald-700'}`}>
                      เตียง {bedNumber}
                    </div>
                    <div className={`px-2 py-1 rounded-lg text-xs font-bold ${isOccupied ? 'bg-rose-200 text-rose-800' : 'bg-emerald-200 text-emerald-800'}`}>
                      {isOccupied ? '🔴 ไม่ว่าง' : '🟢 ว่าง'}
                    </div>
                  </div>

                  {isOccupied ? (
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center gap-2 text-rose-900 font-bold text-sm mb-2">
                        <User size={16} className="shrink-0 text-rose-500" />
                        <span className="line-clamp-1">{occupyingBooking?.customerName || occupyingParkedOrder?.customerName || 'ลูกค้าทั่วไป'}</span>
                      </div>
                      
                      {isExpanded && (
                        <div className="mt-2 mb-4 space-y-2 pt-2 border-t border-rose-100 text-sm">
                          {(occupyingBooking?.phone || occupyingParkedOrder?.customerPhone) && (
                            <div className="flex items-center gap-2 text-slate-600">
                              <Phone size={14} className="shrink-0 text-slate-400" />
                              <span>{occupyingBooking?.phone || occupyingParkedOrder?.customerPhone}</span>
                            </div>
                          )}
                          {(occupyingBooking?.service || occupyingBooking?.courseName) && (
                            <div className="flex items-start gap-2 text-slate-600">
                              <Activity size={14} className="shrink-0 text-slate-400 mt-0.5" />
                              <span className="line-clamp-2">{occupyingBooking.service || occupyingBooking.courseName}</span>
                            </div>
                          )}
                          {occupyingParkedOrder?.cartItems?.length > 0 && (
                            <div className="flex items-start gap-2 text-slate-600">
                              <Activity size={14} className="shrink-0 text-slate-400 mt-0.5" />
                              <div className="flex flex-col text-xs">
                                <span className="font-bold text-rose-600 mb-1">รายการบิลที่พักไว้:</span>
                                {occupyingParkedOrder.cartItems.map((item, i) => (
                                   <div key={i} className="flex justify-between w-full">
                                     <span className="line-clamp-1 flex-1 pr-2">- {item.name}</span>
                                     <span className="font-bold text-rose-600 whitespace-nowrap">x{item.qty}</span>
                                   </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {occupyingBooking?.notes && (
                            <div className="flex items-start gap-2 text-slate-600">
                              <FileText size={14} className="shrink-0 text-slate-400 mt-0.5" />
                              <span className="line-clamp-2 italic">{occupyingBooking.notes}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-2 mt-auto pt-2">
                        {occupyingBooking && (
                          <div className="flex items-center gap-1 text-rose-600 text-xs font-bold">
                            <Clock size={12} /> เริ่ม {occupyingBooking.time} 
                            {occupyingBooking.serviceStartTime && (
                              <span className="text-rose-400 font-normal ml-1">
                                ({new Date(occupyingBooking.serviceStartTime).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})})
                              </span>
                            )}
                          </div>
                        )}
                        {occupyingParkedOrder && !occupyingBooking && (
                          <div className="flex items-center gap-1 text-rose-600 text-xs font-bold">
                            <Clock size={12} /> พักบิลเมื่อ {new Date(occupyingParkedOrder.createdAt).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        )}
                        {isExpanded && (
                          <div className="flex flex-col gap-2 mt-2">
                            {occupyingBooking && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleFreeBed(occupyingBooking.id); }}
                                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-rose-200"
                              >
                                เคลียร์เตียง
                              </button>
                            )}
                            {occupyingParkedOrder && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); onRetrieveParkedOrder && onRetrieveParkedOrder(occupyingParkedOrder); }}
                                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-indigo-200"
                              >
                                ดึงบิลกลับ POS
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {!isExpanded && (
                        <div className="text-center text-[10px] text-rose-400 mt-3 font-bold">
                          คลิกเพื่อดูรายละเอียด
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-emerald-600/50 relative group">
                      <CheckCircle size={32} />
                      <button 
                        onClick={(e) => { e.stopPropagation(); setPrintQrBed(bedNumber); }}
                        className="absolute bottom-0 right-0 p-2 text-emerald-600 bg-emerald-100 hover:bg-emerald-500 hover:text-white rounded-tl-xl transition-all opacity-0 group-hover:opacity-100"
                        title="พิมพ์ QR Code ประจำเตียง"
                      >
                        <QrCode size={16} />
                      </button>
                    </div>
                  )}
                  {/* Show QR button for occupied beds too */}
                  {isOccupied && isExpanded && (
                     <button 
                       onClick={(e) => { e.stopPropagation(); setPrintQrBed(bedNumber); }}
                       className="w-full py-2.5 mt-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                     >
                       <QrCode size={16} /> ดู QR Code ลูกค้าสแกนสั่งของ
                     </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {printQrBed && (
        <div className="fixed inset-0 z-[130] flex flex-col items-center justify-center bg-slate-900/90 p-4">
           <div className="bg-white p-8 rounded-3xl max-w-md w-full text-center shadow-2xl relative">
              <button onClick={() => setPrintQrBed(null)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500"><X size={24}/></button>
              <h3 className="text-xl font-black text-slate-800 mb-2">QR Code สำหรับเตียง {printQrBed}</h3>
              <p className="text-slate-500 text-sm mb-6">ให้ลูกค้าสแกนเพื่อดูรายการหรือสั่งซื้อเพิ่ม</p>
              
              <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 inline-block mb-6 shadow-sm">
                 <QRCodeSVG 
                    value={`${window.location.origin}/?bed=${printQrBed}&branch=${globalBranch || 'เฉวง'}`} 
                    size={200} 
                    level={"H"}
                    includeMargin={true}
                 />
              </div>
              
              <div className="bg-slate-50 p-3 rounded-xl text-xs font-mono text-slate-600 break-all border border-slate-100 mb-4">
                 {window.location.origin}/?bed={printQrBed}&branch={globalBranch || 'เฉวง'}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
