const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

const walkInBtnCode = `                      <button onClick={async () => {
                          const now = new Date();
                          const nowIso = now.toISOString();
                          const nowStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                          try {
                              showToast('กำลังล็อคคิวด่วน...');
                              await addDoc(getCol('bookings'), {
                                  courseId: '',
                                  courseRef: '',
                                  courseName: 'ลูกค้า Walk-in (ด่วน)',
                                  customerName: 'ลูกค้า Walk-in',
                                  customerPhone: '-',
                                  dateTime: nowStr,
                                  date: nowStr.split('T')[0],
                                  time: nowStr.split('T')[1],
                                  branch: filterBookingBranch !== 'all' ? filterBookingBranch : 'เฉวง',
                                  status: 'กำลังใช้บริการ',
                                  serviceStartTime: nowIso,
                                  createdAt: nowIso
                              });
                              showToast('ล็อคคิวด่วน Walk-in สำเร็จ!');
                          } catch(err) {
                              showToast('ข้อผิดพลาด: ' + err.message);
                          }
                      }} className="bg-purple-600 hover:bg-purple-700 transition-colors text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center shadow-md active:scale-95 shrink-0"><UserPlus size={16} className="mr-1"/> Walk-in</button>`;

content = content.replace(/<button onClick=\{\(\) => {[\s\S]*?className="bg-purple-600 hover:bg-purple-700 transition-colors text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center shadow-md active:scale-95 shrink-0"><UserPlus size={16} className="mr-1"\/> Walk-in<\/button>/, walkInBtnCode);

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log("Updated Walk-in button to be quick/instant");
