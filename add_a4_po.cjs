const fs = require('fs');

let content = fs.readFileSync('src/components/POSSystem.jsx', 'utf8');

// 1. Update @page size
content = content.replace(
  "size: ${printMode === 'receipt' ? '80mm auto' : '100mm 150mm'};",
  "size: ${receiptData?.items.some(i => i.actionType === 'owner_purchase' || i.actionType === 'branch_requisition') ? 'A4' : printMode === 'receipt' ? '80mm auto' : '100mm 150mm'};"
);

// 2. Add the A4 Component logic
let a4ComponentHTML = `    {receiptData && (
      <div id="pos-print-area">
        {/* Printable PO (A4 format) */}
        {(receiptData.items.some(i => i.actionType === 'owner_purchase' || i.actionType === 'branch_requisition')) ? (
          <div className="hidden print:block w-[210mm] max-w-[210mm] text-black font-sans bg-white m-0 p-8 text-sm leading-tight mx-auto">
            <div className="text-center mb-8">
              <h1 className="font-bold text-2xl mb-2">IRIS NATURES</h1>
              <h2 className="font-semibold text-xl mb-1">
                {receiptData.items.some(i => i.actionType === 'owner_purchase') 
                  ? 'ใบสั่งซื้อ (Purchase Order)' 
                  : 'ใบเบิกสินค้า (Requisition Form)'}
              </h2>
            </div>
            
            <div className="flex justify-between mb-8 text-sm">
              <div>
                <p className="font-bold mb-1">ส่งถึง (To):</p>
                <p>IRIS NATURES (สำนักงานใหญ่/เจ้าของแฟรนไชส์)</p>
              </div>
              <div className="text-right">
                <p><span className="font-bold">เลขที่เอกสาร:</span> {receiptData.orderNo}</p>
                <p><span className="font-bold">วันที่:</span> {new Date(receiptData.createdAt).toLocaleDateString('th-TH')}</p>
                <p><span className="font-bold">สาขาที่ขอเบิก/สั่งซื้อ:</span> {globalBranch || "สำนักงานใหญ่"}</p>
              </div>
            </div>

            {/* Group items by Brand */}
            {(() => {
              const grouped = {};
              receiptData.items.forEach(item => {
                // Determine brand
                let brand = "ทั่วไป";
                if (item.originalItem) {
                   brand = String(getFuzzyKey(item.originalItem, ["แบรนด์", "หมวดสินค้า", "col_4"]) || "ทั่วไป");
                }
                if (!grouped[brand]) grouped[brand] = [];
                grouped[brand].push(item);
              });
              
              let totalQty = 0;
              let grandTotal = 0;

              return (
                <div className="space-y-6">
                  {Object.keys(grouped).map(brand => {
                    const items = grouped[brand];
                    const brandTotal = items.reduce((sum, i) => sum + (i.price * i.qty), 0);
                    const brandQty = items.reduce((sum, i) => sum + i.qty, 0);
                    totalQty += brandQty;
                    grandTotal += brandTotal;
                    
                    return (
                      <div key={brand} className="mb-4">
                        <h3 className="font-bold text-lg mb-2 border-b-2 border-slate-800 pb-1">แบรนด์: {brand}</h3>
                        <table className="w-full text-sm mb-2 border-collapse">
                          <thead>
                            <tr className="bg-slate-100">
                              <th className="border border-slate-300 px-2 py-1 text-left w-12">ลำดับ</th>
                              <th className="border border-slate-300 px-2 py-1 text-left">รายการสินค้า</th>
                              <th className="border border-slate-300 px-2 py-1 text-right w-24">ราคาต่อชิ้น</th>
                              <th className="border border-slate-300 px-2 py-1 text-center w-24">จำนวน</th>
                              <th className="border border-slate-300 px-2 py-1 text-right w-32">รวม (บาท)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item, idx) => (
                              <tr key={idx}>
                                <td className="border border-slate-300 px-2 py-1 text-center">{idx + 1}</td>
                                <td className="border border-slate-300 px-2 py-1">{item.name.replace(/^\\[.*?\\]\\s*/, '')}</td>
                                <td className="border border-slate-300 px-2 py-1 text-right">{item.price.toLocaleString()}</td>
                                <td className="border border-slate-300 px-2 py-1 text-center">{item.qty}</td>
                                <td className="border border-slate-300 px-2 py-1 text-right">{(item.price * item.qty).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="font-bold bg-slate-50">
                              <td colSpan="3" className="border border-slate-300 px-2 py-1 text-right">รวมแบรนด์ {brand}</td>
                              <td className="border border-slate-300 px-2 py-1 text-center">{brandQty}</td>
                              <td className="border border-slate-300 px-2 py-1 text-right">{brandTotal.toLocaleString()}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    );
                  })}
                  
                  {/* Grand Total */}
                  <div className="flex justify-end mt-8">
                    <table className="w-64 text-sm border-collapse">
                      <tbody>
                        <tr className="font-bold text-base bg-slate-200">
                          <td className="border border-slate-400 px-4 py-2 text-right">ยอดรวมทั้งสิ้น</td>
                          <td className="border border-slate-400 px-4 py-2 text-right text-indigo-700">{grandTotal.toLocaleString()} บาท</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Signatures */}
                  <div className="flex justify-between mt-24 pt-4">
                    <div className="text-center w-48">
                      <div className="border-b border-black mb-2 pb-6"></div>
                      <p>ผู้เบิก / ผู้สั่งซื้อ</p>
                      <p className="text-xs mt-1">(สาขา {globalBranch || "สำนักงานใหญ่"})</p>
                    </div>
                    <div className="text-center w-48">
                      <div className="border-b border-black mb-2 pb-6"></div>
                      <p>ผู้อนุมัติ / ผู้จ่ายของ</p>
                      <p className="text-xs mt-1">(ศูนย์ใหญ่ / เจ้าของแฟรนไชส์)</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : printMode === 'receipt' ? (
          <div className="hidden print:block w-[80mm] max-w-full text-black font-sans bg-white m-0 p-2 text-sm leading-tight mx-auto">`;

content = content.replace(
  /    \{receiptData && \(\n      <div id="pos-print-area">\n        \{\/\* Printable Receipt \(80mm Thermal format\) \*\/\}\n        \{printMode === 'receipt' && \(\n          <div className="hidden print:block w-\[80mm\] max-w-full text-black font-sans bg-white m-0 p-2 text-sm leading-tight mx-auto">/,
  a4ComponentHTML
);

// Close the ternary operator correctly for the receipt div
content = content.replace(
  /        \{\/\* Printable Sticker \*\/\}\n        \{printMode === 'sticker' && \(/,
  `        ) : null}
        {/* Printable Sticker */}
        {printMode === 'sticker' && (`
);

fs.writeFileSync('src/components/POSSystem.jsx', content, 'utf8');
console.log("Successfully added A4 PO format");
