const fs = require('fs');
const filePath = '/Users/ittichai/ZCodeProject/admin-dashboard/src/components/POSSystem.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update the tabs buttons
const oldTabsSection = `              <button 
                onClick={() => setActiveTab('courses')}
                className={\`flex-1 py-2 px-2 sm:px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 \${activeTab === 'courses' ? 'bg-pink-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}\`}
                title="ขายคอร์สใหม่"
              >
                <Layers size={24} />
              </button>
              <button 
                onClick={() => setActiveTab('single_courses')}
                className={\`flex-1 py-2 px-2 sm:px-4 rounded-xl font-medium transition-colors flex flex-col items-center justify-center gap-1 relative \${activeTab === 'single_courses' ? 'bg-violet-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}\`}
                title="คอร์สครั้งเดียว"
              >
                <div className="flex items-center gap-1">
                  <CheckCircle size={20} />
                  <span className="text-[10px] font-bold">ครั้งเดียว</span>
                </div>
              </button>`;

const newTabsSection = `              <button 
                onClick={() => setActiveTab('courses')}
                className={\`flex-1 py-2 px-2 sm:px-4 rounded-xl font-medium transition-colors flex flex-col items-center justify-center gap-1 relative \${activeTab === 'courses' ? 'bg-pink-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}\`}
                title="คอร์ส / รายครั้ง"
              >
                <div className="flex items-center gap-1">
                  <Layers size={20} />
                  <span className="text-[10px] font-bold">คอร์ส/รายครั้ง</span>
                </div>
              </button>`;

if (content.includes(oldTabsSection)) {
    content = content.replace(oldTabsSection, newTabsSection);
    console.log("Successfully replaced tabs buttons.");
} else {
    console.log("Could not find old tabs section.");
}

// 2. We need to move the single_courses grid logic into the courses tab.
// Currently it looks like:
//                   })}
//                 </div>
//               </div>
//             ) : activeTab === 'single_courses' ? (
//               <div className="col-span-full mb-4">
//                 <div className="flex gap-2 p-1 bg-slate-100/80 ...

const searchString = `                  })}
                </div>
              </div>
            ) : activeTab === 'single_courses' ? (
              <div className="col-span-full mb-4">
                <div className="flex gap-2 p-1 bg-slate-100/80 backdrop-blur rounded-xl border border-slate-200/60 mb-4 flex-wrap w-full">
                   {COURSE_TABS.map(tab => (
                     <button 
                        key={\`s_\${tab.id}\`}
                        onClick={() => setSingleCourseTab(tab.id)}
                        className={\`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[11px] sm:text-sm font-bold transition-all whitespace-nowrap \${singleCourseTab === tab.id ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200/50'}\`}
                     >{tab.label}</button>
                   ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {groupedSingleCourses
                    .filter(g => {
                      if (singleCourseTab === 'all') return g.category !== 'old_courses';
                      return g.category === singleCourseTab;
                    })`;

const replaceString = `                  })}
                </div>

                {groupedSingleCourses.filter(g => {
                      if (multiCourseTab === 'all') return g.category !== 'old_courses';
                      return g.category === multiCourseTab;
                    }).length > 0 && (
                   <div className="mt-6 mb-3 flex items-center gap-3 col-span-full">
                     <div className="h-[2px] bg-gradient-to-r from-transparent to-slate-200 flex-1"></div>
                     <span className="text-[11px] sm:text-xs font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest shadow-inner flex items-center gap-1"><CheckCircle size={12}/> แบบรายครั้ง (Single Course)</span>
                     <div className="h-[2px] bg-gradient-to-l from-transparent to-slate-200 flex-1"></div>
                   </div>
                )}
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 col-span-full mt-2">
                  {groupedSingleCourses
                    .filter(g => {
                      if (multiCourseTab === 'all') return g.category !== 'old_courses';
                      return g.category === multiCourseTab;
                    })`;

if (content.includes(searchString)) {
    content = content.replace(searchString, replaceString);
    console.log("Successfully merged the two course lists.");
} else {
    console.log("Could not find the boundary between courses and single_courses.");
}

// 3. Fix the closing of the single_courses block.
// It ends with:
//                   )}
//                 </div>
//               </div>
//             ) : activeTab === 'services' ? (

const closeSearchString = `                  )}
                </div>
              </div>
            ) : activeTab === 'services' ? (`;

const closeReplaceString = `                  )}
                </div>
              </div>
            ) : activeTab === 'services' ? (`;

// Actually the close string is the same, but because we removed the `) : activeTab === 'single_courses' ? (` part, 
// the `) : activeTab === 'services' ? (` is now closing the `activeTab === 'courses' ? (` block!
// So it naturally closes correctly without modification!
// Wait! I need to double check if the single_courses manual walkin logic also uses singleCourseTab.

const walkinSearchString = `                  {/* Manual Walk-in Items */}
                  {(singleCourseTab === 'all' || singleCourseTab === 'walkin') && (`;

const walkinReplaceString = `                  {/* Manual Walk-in Items */}
                  {(multiCourseTab === 'all' || multiCourseTab === 'walkin') && (`;

if (content.includes(walkinSearchString)) {
    content = content.replace(walkinSearchString, walkinReplaceString);
    console.log("Successfully replaced singleCourseTab for walkin items.");
} else {
    console.log("Could not find walkin section.");
}

// 4. In line 3391, the empty state check:
// (activeTab === 'single_courses' && filteredSingleCourses.length === 0)
// We can just leave it or remove it. But let's remove it so it's cleaner.

const emptySearchString = `(activeTab === 'single_courses' && filteredSingleCourses.length === 0) || `;
if (content.includes(emptySearchString)) {
    content = content.replace(emptySearchString, "");
    console.log("Successfully cleaned up empty state check.");
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("File saved.");
