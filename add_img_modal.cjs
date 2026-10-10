const fs = require('fs');
let content = fs.readFileSync('src/components/POSSystem.jsx', 'utf8');

// 1. Add state for showImageModal
const stateRegex = /const \[showEodModal, setShowEodModal\] = useState\(false\);/;
content = content.replace(stateRegex, 'const [showEodModal, setShowEodModal] = useState(false);\n  const [showImageModal, setShowImageModal] = useState(null);');

// 2. Change the button to use setShowImageModal
const oldBtn = `const slipUrl = o.slipImage || o.paymentSlip || o.slipUrl || o.customOrderImage;
                                  if (slipUrl) {
                                      window.open(slipUrl, '_blank');
                                  }`;
const newBtn = `const slipUrl = o.slipImage || o.paymentSlip || o.slipUrl || o.customOrderImage;
                                  if (slipUrl) {
                                      setShowImageModal(slipUrl);
                                  }`;
content = content.replace(oldBtn, newBtn);

// 3. Add the modal JSX at the very end before the last closing div/Fragment
const modalJsx = `
      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setShowImageModal(null)}>
            <div className="relative max-w-3xl max-h-[90vh] w-full flex flex-col items-center">
                <button onClick={() => setShowImageModal(null)} className="absolute -top-12 right-0 text-white hover:text-pink-300 transition-colors p-2 bg-black/50 rounded-full">
                   <X size={24}/>
                </button>
                <img src={showImageModal} className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" alt="Slip" onClick={(e) => e.stopPropagation()} />
                <a href={showImageModal} target="_blank" rel="noreferrer" className="mt-4 px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-full font-bold shadow-lg transition-colors inline-flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                   เปิดในแท็บใหม่
                </a>
            </div>
        </div>
      )}
`;

content = content.replace(/\{showCustomerContextModal && \(/, modalJsx + '\n        {showCustomerContextModal && (');

fs.writeFileSync('src/components/POSSystem.jsx', content, 'utf8');
console.log("Added Image Modal");
