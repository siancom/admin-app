import React, { useRef } from 'react';
import { Printer, X, FileText } from 'lucide-react';

export default function EmploymentContractModal({ employee, onClose }) {
  if (!employee) return null;

  const handlePrint = () => {
    document.body.classList.add('printing-modal');
    setTimeout(() => {
      window.print();
      document.body.classList.remove('printing-modal');
    }, 100);
  };

  // Convert date format
  const getThaiDate = (dateString) => {
    if (!dateString) return { day: '____', month: '______________', year: '_______' };
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return { day: '____', month: '______________', year: '_______' };
    
    const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    return {
      day: date.getDate(),
      month: months[date.getMonth()],
      year: date.getFullYear() + 543
    };
  };

  const today = getThaiDate(new Date().toISOString());
  const startDate = getThaiDate(employee.employmentStartDate || (employee.createdAt && typeof employee.createdAt === 'string' ? employee.createdAt : null));

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-sans">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 print-section print:max-h-none print:overflow-visible print:shadow-none print:rounded-none print:block">
        
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-5 flex justify-between items-center text-white shrink-0 no-print">
          <div className="flex items-center gap-3">
            <FileText size={24} className="text-indigo-200" />
            <div>
              <h2 className="text-xl font-black">หนังสือสัญญาจ้างงาน</h2>
              <p className="text-indigo-200 text-sm font-medium">{employee.name} - สาขา{employee.branch}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-sm">
              <Printer size={18} /> พิมพ์สัญญา
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Contract Content */}
        <div className="p-8 sm:p-12 overflow-y-auto bg-white text-slate-800 text-sm sm:text-base leading-relaxed print:p-0 print:text-black print:overflow-visible print:block">
          <div className="max-w-3xl mx-auto space-y-6 a4-paper-content print:space-y-4">
            
            <div className="text-center space-y-2 mb-8">
              <h1 className="text-2xl font-bold">หนังสือสัญญาจ้างงาน / ข้อตกลงการจ้างงาน</h1>
              <h2 className="text-xl font-bold">ศูนย์ความงามไอริส (Iris Natures) สาขาเกาะสมุย</h2>
            </div>

            <div className="flex justify-between items-end mb-6">
              <div>ทำที่: <span className="font-medium">ศูนย์ความงามไอริส สาขาเกาะสมุย</span></div>
              <div>
                วันที่: <span className="inline-block w-8 text-center border-b border-black font-medium">{today.day}</span> 
                เดือน <span className="inline-block w-24 text-center border-b border-black font-medium">{today.month}</span> 
                พ.ศ. <span className="inline-block w-16 text-center border-b border-black font-medium">{today.year}</span>
              </div>
            </div>

            <p className="indent-8 text-justify">
              สัญญาฉบับนี้ทำขึ้นระหว่าง <strong>นายอิทธิชัย สังขโห</strong> ผู้บริหาร/เจ้าของศูนย์ความงามไอริส ซึ่งต่อไปในสัญญานี้เรียกว่า <strong>"นายจ้าง"</strong> ฝ่ายหนึ่ง กับ 
              นาย/นาง/นางสาว <span className="border-b border-black font-bold px-2">{employee.name || '_________________________'}</span> 
              เลขที่บัตรประชาชน <span className="border-b border-black px-2">{employee.idCard || '__________________________'}</span> 
              ที่อยู่ <span className="border-b border-black px-2">{employee.address || '__________________________________________________'}</span> 
              ซึ่งต่อไปในสัญญานี้เรียกว่า <strong>"ลูกจ้าง"</strong> อีกฝ่ายหนึ่ง
            </p>

            <p>ทั้งสองฝ่ายตกลงทำสัญญาจ้างงานโดยมีเงื่อนไขดังต่อไปนี้:</p>

            <div className="space-y-4">
              <div className="break-inside-avoid">
                <h3 className="font-bold mb-2">ข้อ 1. ตำแหน่งและระยะเวลาทดลองงาน</h3>
                <div className="pl-4 space-y-2">
                  <p>1.1 นายจ้างตกลงจ้างลูกจ้างเข้าทำงานในตำแหน่ง <strong>{employee.position || 'พนักงานทรีทเม้นท์ผิวหน้า (Facial Therapist)'}</strong> ประจำสาขา<strong>{employee.branch || 'เกาะสมุย'}</strong></p>
                  <p>
                    1.2 วันเริ่มงาน: วันที่ <span className="inline-block w-8 text-center border-b border-black font-medium">{startDate.day}</span> 
                    เดือน <span className="inline-block w-24 text-center border-b border-black font-medium">{startDate.month}</span> 
                    พ.ศ. <span className="inline-block w-16 text-center border-b border-black font-medium">{startDate.year}</span>
                  </p>
                  <p>1.3 ระยะเวลาทดลองงาน: กำหนด <strong>{employee.probationDays || 90}</strong> วัน หากลูกจ้างมีผลการประเมินผ่านเกณฑ์ นายจ้างจะบรรจุเป็นพนักงานประจำ และปรับสวัสดิการตามที่ตกลงไว้ในข้อ 3.2</p>
                </div>
              </div>

              <div className="break-inside-avoid">
                <h3 className="font-bold mb-2">ข้อ 2. เวลาทำงานและวันหยุด</h3>
                <div className="pl-4 space-y-2">
                  <p>2.1 เวลาทำงานปกติ: <strong>10.00</strong> น. ถึง <strong>20.00</strong> น.</p>
                  <p>2.2 วันหยุดประจำสัปดาห์: ลูกจ้างได้รับสิทธิ์วันหยุด <strong>4</strong> วัน ต่อเดือน โดยมีเงื่อนไขดังนี้:</p>
                  <ul className="list-disc pl-8 space-y-1">
                    <li>ต้องแจ้งคิววันหยุดล่วงหน้าภายในวันที่ 25 ของเดือนก่อนหน้า</li>
                    <li>สามารถสะสมวันหยุดติดกันเพื่อเดินทางกลับบ้าน หรือต่างจังหวัดได้ (ต้องขออนุมัติล่วงหน้าเป็นกรณีพิเศษ ตามเงื่อนไขคลินิก)</li>
                    <li>ไม่อนุญาตให้หยุดตรงกับวันเสาร์-อาทิตย์ หรือหยุดพร้อมกันกับพนักงานท่านอื่น (เว้นแต่ได้รับอนุญาตเป็นกรณีพิเศษ)</li>
                  </ul>
                </div>
              </div>

              <div className="break-inside-avoid">
                <h3 className="font-bold mb-2">ข้อ 3. โครงสร้างรายได้ สวัสดิการ และโบนัส</h3>
                <div className="pl-4 space-y-4">
                  <div>
                    <h4 className="font-bold mb-1">3.1 รายรับพื้นฐานและค่ามือ (ทำมากได้มาก)</h4>
                    <ul className="list-disc pl-8 space-y-1">
                      <li>ฐานเงินเดือน: <span className="border-b border-black font-bold px-2">{employee.baseSalary ? employee.baseSalary.toLocaleString() : '12,000 - 15,000'}</span> บาท/เดือน (พิจารณาตามประสบการณ์)</li>
                      <li>ค่ามือ นวดหน้า / ทรีทเม้นท์ Active Skin / เลเซอร์ IPL รักแร้: <strong>50 บาท/เคส</strong></li>
                      <li>ค่ามือ กดสิว: <strong>20 บาท/เคส</strong></li>
                      <li>ค่ามือ สปาขัดตัว: <strong>100 บาท/เคส</strong></li>
                      <li>ค่ามือ จี้ไฝ/กระ/ติ่งเนื้อ (ยอดบิลไม่เกิน 1,000 บาท): รับค่ามือ <strong>10%</strong> ของยอดบิล</li>
                      <li>ค่ามือ จี้ไฝ/กระ/ติ่งเนื้อ (ยอดบิล 1,000 บาท ขึ้นไป): รับค่ามือ <strong>20%</strong> ของยอดบิล (ยิ่งเชียร์จี้เยอะ ยิ่งได้เยอะ!)</li>
                    </ul>
                  </div>
                  <div className="break-inside-avoid">
                    <h4 className="font-bold mb-1">3.2 ค่าคอมมิชชันและสวัสดิการประจำวัน</h4>
                    <ul className="list-disc pl-8 space-y-1">
                      <li><strong>ค่าคอมมิชชันยอดขาย:</strong> รับส่วนแบ่ง <span className="border-b border-black font-bold px-2">{employee.commissionRate || '___'}%</span> จากยอดขายคอร์สและสินค้าตามที่ตกลง</li>
                      <li><strong>ค่าอาหาร:</strong> <strong>{employee.foodAllowanceRate !== undefined ? employee.foodAllowanceRate : 50} บาท/วัน</strong> (จ่ายตามจำนวนวันที่มาทำงานจริง)</li>
                    </ul>
                  </div>
                  <div className="break-inside-avoid">
                    <h4 className="font-bold mb-1">3.3 สวัสดิการพนักงาน (เพราะคุณคือคนสำคัญของเรา)</h4>
                    <ul className="list-disc pl-8 space-y-1">
                      <li><strong>เบี้ยขยัน:</strong> <strong>{employee.diligenceAllowance !== undefined ? employee.diligenceAllowance : 500} บาท/เดือน</strong> สำหรับพนักงานที่ทำงานครบ ไม่ขาด ไม่ลา ไม่สาย</li>
                      <li><strong>สวัสดิการช่วงทดลองงาน (1-3 เดือน):</strong> ทำหน้าฟรี 1 ครั้ง/เดือน, ส่วนลดซื้อผลิตภัณฑ์ 15%</li>
                      <li><strong>💎 สวัสดิการ V.I.P หลังผ่านโปร (บรรจุเป็นพนักงานประจำ):</strong>
                        <ul className="list-circle pl-6 mt-1 space-y-1 text-slate-700">
                          <li>พิจารณาปรับฐานเงินเดือนขึ้น</li>
                          <li>อัปเกรดสิทธิ์ทำหน้าพรีเมียมฟรี 1-2 ครั้ง/เดือน (พนักงานเราต้องผิวสวยเป๊ะ!), วงเงินซื้อผลิตภัณฑ์ <strong>{employee.vipProductLimit !== undefined ? employee.vipProductLimit : 2000} บาท/ปี</strong></li>
                          <li>รับส่วนลดซื้อผลิตภัณฑ์ <strong>{employee.vipProductDiscountRate !== undefined ? employee.vipProductDiscountRate : 30}%</strong></li>
                          <li>รับค่าชุดยูนิฟอร์มคลินิก <strong>{employee.vipUniformAllowance !== undefined ? employee.vipUniformAllowance : 1500} บาท/ปี</strong></li>
                          <li>สิทธิ์วันหยุดพักร้อนประจำปี <strong>{employee.vipAnnualLeaveDays !== undefined ? employee.vipAnnualLeaveDays : 10} วัน/ปี</strong></li>
                          <li>โบนัสวันเกิดเป็นเงินสด <strong>{employee.vipBirthdayBonus !== undefined ? employee.vipBirthdayBonus : 1000} บาท/ปี</strong></li>
                        </ul>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="break-inside-avoid">
                <h3 className="font-bold mb-2">ข้อ 4. กฎระเบียบและข้อบังคับ</h3>
                <div className="pl-4 space-y-2">
                  <p>4.1 ลูกจ้างต้องแต่งกายด้วยชุดยูนิฟอร์มที่นายจ้างกำหนดให้เรียบร้อย และรักษาความสะอาดของร่างกายอยู่เสมอ</p>
                  <p>4.2 ลูกจ้างต้องให้บริการลูกค้าด้วยความสุภาพ ยิ้มแย้ม และไม่ใช้คำพูดที่ไม่เหมาะสมกับลูกค้า</p>
                  <p>4.3 การรักษาความลับ: ลูกจ้างต้องไม่นำข้อมูลลูกค้า สูตรการทำทรีทเม้นท์ หรือข้อมูลทางธุรกิจของศูนย์ความงามไอริส ไปเผยแพร่หรือใช้เพื่อประโยชน์ส่วนตัวโดยเด็ดขาด</p>
                </div>
              </div>

              <div className="break-inside-avoid">
                <h3 className="font-bold mb-2">ข้อ 5. การสิ้นสุดสัญญาจ้างและการลาออก</h3>
                <div className="pl-4 space-y-2">
                  <p>5.1 หากลูกจ้างต้องการลาออก ต้องแจ้งให้นายจ้างทราบล่วงหน้าเป็นลายลักษณ์อักษรไม่น้อยกว่า 30 วัน</p>
                  <p>5.2 นายจ้างมีสิทธิ์เลิกจ้างได้ทันทีโดยไม่ต้องจ่ายค่าชดเชย หากลูกจ้างกระทำความผิดร้ายแรง เช่น ทุจริตต่อหน้าที่, ทะเลาะวิวาทในสถานที่ทำงาน, จงใจทำให้ร้านเสื่อมเสียชื่อเสียง, หรือขาดงานติดต่อกันเกิน 3 วันโดยไม่มีเหตุอันควร</p>
                </div>
              </div>
            </div>

            <p className="pt-4">
              สัญญาฉบับนี้ทำขึ้นสองฉบับมีข้อความถูกต้องตรงกัน ทั้งสองฝ่ายได้อ่านและเข้าใจข้อความในสัญญาโดยตลอดแล้ว จึงได้ลงลายมือชื่อไว้เป็นสำคัญต่อหน้าพยาน
            </p>

            <div className="grid grid-cols-2 gap-y-12 gap-x-8 pt-12 break-inside-avoid">
              <div className="text-center space-y-2">
                <div>ลงชื่อ .............................................................. นายจ้าง</div>
                <div>( <strong>นายอิทธิชัย สังขโห</strong> )</div>
                <div>วันที่: ......../......../........</div>
              </div>
              <div className="text-center space-y-2">
                <div>ลงชื่อ .............................................................. ลูกจ้าง</div>
                <div>( <strong className="px-4">{employee.name}</strong> )</div>
                <div>วันที่: ......../......../........</div>
              </div>
              <div className="text-center space-y-2 col-span-2 mt-8">
                <div>ลงชื่อ .............................................................. พยาน</div>
                <div>( ....................................................... )</div>
                <div>วันที่: ......../......../........</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
