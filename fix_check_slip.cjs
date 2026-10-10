const fs = require('fs');
let content = fs.readFileSync('src/components/POSSystem.jsx', 'utf8');

const oldBtnCode = `                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showToast('กรุณาตรวจสอบสลิปและอนุมัติที่หน้า "จัดการออเดอร์ออนไลน์"', 'info');
                                }}
                                className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-slate-200 transition-colors"
                              >
                                ตรวจสลิป
                              </button>`;

const newBtnCode = `                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const slipUrl = o.slipImage || o.paymentSlip || o.slipUrl || o.customOrderImage;
                                  if (slipUrl) {
                                      window.open(slipUrl, '_blank');
                                  } else {
                                      showToast('ไม่พบรูปสลิปหรือรูปถูกลบไปแล้ว กรุณาตรวจสอบที่หน้า "คำสั่งซื้อ"', 'error');
                                  }
                                }}
                                className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-slate-200 transition-colors"
                              >
                                ตรวจสลิป
                              </button>`;

content = content.replace(oldBtnCode, newBtnCode);

fs.writeFileSync('src/components/POSSystem.jsx', content, 'utf8');
console.log("Updated check slip button");
