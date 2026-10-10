const fs = require('fs');

function main() {
    let content = fs.readFileSync('src/components/POSSystem.jsx', 'utf8');

    // 2. Extract Customer Selection UI
    const start_marker = '        {/* Customer Selection */}';
    const end_marker = '                        </div>\n                      ))\n                    ) : (\n                      <div className="px-4 py-3 text-center text-slate-500">ไม่พบลูกค้า</div>\n                    )}\n                  </div>\n                )}\n              </div>\n            )}\n          </div>\n        </div>';
    
    let start_idx = content.indexOf(start_marker);
    let end_idx = content.indexOf(end_marker);
    if (start_idx !== -1 && end_idx !== -1) {
        end_idx += end_marker.length;
        const customer_block = content.substring(start_idx, end_idx);
        
        const replacement = `        {/* Customer Selection (Desktop/Cart View) */}
        <div className="hidden lg:block shrink-0 z-[60]">
          {customerSelectionUI}
        </div>`;
        content = content.substring(0, start_idx) + replacement + content.substring(end_idx);
        
        const customer_ui = `
  const customerSelectionUI = (
    <>
\${customer_block}
    </>
  );
`;
        // Find the return block
        const return_idx = content.indexOf("  return (\n    <>\n      <div className=\"flex flex-col h-full bg-slate-50 relative overflow-hidden\">");
        if (return_idx !== -1) {
            content = content.substring(0, return_idx) + customer_ui.replace('${customer_block}', customer_block) + "\n" + content.substring(return_idx);
        }

        // Inject into mobile main view
        const main_top_marker = "      <div className=\"flex-1 flex flex-col h-full border-r border-slate-200\">\n        <div className=\"p-4 bg-white border-b border-slate-200 shrink-0\">";
        const mobile_injection = `
        {/* Customer Selection (Mobile Main View) */}
        <div className="block lg:hidden z-[60] mb-4 relative">
          {customerSelectionUI}
        </div>
`;
        content = content.replace(main_top_marker, main_top_marker + mobile_injection);
    }

    fs.writeFileSync('src/components/POSSystem.jsx', content);
}

main();
