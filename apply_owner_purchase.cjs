const fs = require('fs');

// 1. Update POSSystem.jsx
let content = fs.readFileSync('src/components/POSSystem.jsx', 'utf8');

// Add globalRole to props
content = content.replace(
  '  globalBranch,\n  appSettings = { monthlyTarget: 0 },',
  '  globalBranch,\n  globalRole,\n  appSettings = { monthlyTarget: 0 },'
);

// Update priceUtils import
content = content.replace(
  "import { getVipDiscountRate, computeFinalPrice } from '../utils/priceUtils';",
  "import { getVipDiscountRate, computeFinalPrice, getOwnerDiscountRate, computeOwnerCostPrice } from '../utils/priceUtils';"
);

// Add Owner Purchase Header above the product grid
const headerHTML = `          {isStockMode && globalRole === 'owner' && (
            <div className="mb-6 p-4 sm:p-6 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-teal-500/10 border border-teal-100 rounded-3xl shadow-sm">
              <h3 className="text-sm font-bold text-teal-700 mb-2">เจ้าของร้านซื้อเข้า (Owner Purchase)</h3>
              <div className="text-xs text-teal-600 font-medium space-y-1">
                <p>• ราคาทุนคิดจากราคาสมาชิก - ส่วนลดเจ้าของร้าน</p>
                <p>• ราคาสมาชิกมาจากคอลัมน์ "ราคาสมาชิก"</p>
                <p>• ถ้าราคาสมาชิกไม่มีค่า จะใช้ราคาปลีกเต็ม</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-4 md:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">`;

content = content.replace(
  '<div className="grid grid-cols-4 md:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">',
  headerHTML
);

// Replace the map function variables
const mapVariables = `                } else if (productName) {
                  imageUrl = \`https://crm.irisnatures.com/สินค้า_Images/\${encodeURIComponent(productName)}.jpg\`;
                }

                const isOwnerPurchase = isStockMode && globalRole === 'owner';
                const costPrice = isOwnerPurchase ? computeOwnerCostPrice(p) : 0;
                const discountRate = isOwnerPurchase ? getOwnerDiscountRate(p) : 0;
                const memberPrice = parseNumber(getFuzzyKey(p, ["ราคาสมาชิก", "col_10"]));
                const originalCostBasePrice = memberPrice > 0 ? memberPrice : fullPrice;

                return (
                <div 
                  key={p.id} 
                  onClick={() => isOwnerPurchase ? addToCart(p, 'product') : isStockMode ? setStockInputModal({ isOpen: true, item: p, inputVal: '' }) : addToCart(p, 'product')}
                  className={\`bg-white p-2 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border cursor-pointer transition-all flex flex-col h-full \${isOwnerPurchase ? "border-slate-100 hover:shadow-md hover:border-teal-200 active:scale-95" : isStockMode ? (stockAdjustments.some(a => a.id === p.id) ? "border-emerald-500 opacity-70" : "border-rose-400 animate-pulse shadow-[0_0_15px_rgba(251,113,133,0.3)]") : "border-slate-100 hover:shadow-md hover:border-indigo-200 active:scale-95"}\`}
                >
                  <div className="w-full aspect-[4/3] bg-slate-100 rounded-lg sm:rounded-xl mb-2 sm:mb-3 overflow-hidden relative group">
                    {imageUrl && (
                      <img 
                        src={imageUrl} 
                        alt={productName}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        loading="lazy"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    {!isOwnerPurchase && isStockMode && stockAdjustments.some(a => a.id === p.id) && (
                      <div className="absolute inset-0 bg-emerald-500/20 z-10 flex items-center justify-center backdrop-blur-[1px]">
                        <CheckCircle size={40} className="text-emerald-600 bg-white rounded-full drop-shadow-md" />
                      </div>
                    )}`;

content = content.replace(
  /                \} else if \(productName\) \{[\s\S]*?CheckCircle size=\{40\} className="text-emerald-600 bg-white rounded-full drop-shadow-md" \/>\n                      <\/div>\n                    \)\}/,
  mapVariables
);

// Replace the price rendering in the card
const priceHTML = `                  <div className="mt-2 sm:mt-3 flex flex-col xl:flex-row xl:items-end justify-between gap-1">
                    {isOwnerPurchase ? (
                      <div className="text-teal-600 font-bold text-xs sm:text-sm flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-normal">ปกติ:</span>
                          <del className="text-slate-400 text-[10px] sm:text-xs font-normal">฿{originalCostBasePrice.toLocaleString()}</del>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                          <span>฿{costPrice.toLocaleString()}</span>
                          <span className="bg-teal-50 text-teal-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-teal-100">ต้นทุน (ลด {Math.round(discountRate * 100)}%)</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-indigo-600 font-bold text-sm sm:text-lg flex items-center gap-1">
                        {displayPrice < fullPrice && (
                          <del className="text-gray-400 text-[10px] sm:text-xs">฿{fullPrice.toLocaleString()}</del>
                        )}
                        ฿{displayPrice.toLocaleString()}
                      </div>
                    )}`;

content = content.replace(
  /<div className="mt-2 sm:mt-3 flex flex-col xl:flex-row xl:items-end justify-between gap-1">[\s\S]*?฿\{displayPrice\.toLocaleString\(\)\}\n                    <\/div>/,
  priceHTML
);

// Replace "โหมดนับสต๊อก" with "โหมดเจ้าของร้าน" if owner
// Wait, the user might want "เจ้าของร้านซื้อเข้า" as the button text if globalRole === 'owner'
// Actually, let's just leave the button text as "โหมดนับสต๊อก" because it's shared, or change it dynamically.
content = content.replace(
  "{isStockMode ? 'ปิดโหมดนับสต๊อก' : 'โหมดนับสต๊อก'}",
  "{isStockMode ? (globalRole === 'owner' ? 'ปิดโหมดซื้อเข้า' : 'ปิดโหมดนับสต๊อก') : (globalRole === 'owner' ? 'โหมดเจ้าของร้านซื้อเข้า' : 'โหมดนับสต๊อก')}"
);

fs.writeFileSync('src/components/POSSystem.jsx', content, 'utf8');
console.log("Successfully updated POSSystem.jsx");

