import sys

file_path = "/Users/ittichai/ZCodeProject/admin-dashboard/src/components/POSSystem.jsx"

with open(file_path, "r") as f:
    content = f.read()

# 1. Update activeTab initial states? No, it's fine.

# 2. Add filteredSingleCourses and update filteredCourses
target_filteredCourses = """  const filteredCourses = useMemo(() => {
    return masterCourses.filter(mc => {
      const searchStr = `${String(getFuzzyKey(mc, ["รหัสคอส", "col_1"]) || '')} ${String(getFuzzyKey(mc, ["ชื่อคอส", "col_4"]) || '')}`.toLowerCase();
      return searchTerm === '' || searchStr.includes(searchTerm.toLowerCase());
    });
  }, [masterCourses, searchTerm]);"""

replacement_filteredCourses = """  const filteredCourses = useMemo(() => {
    return masterCourses.filter(mc => {
      const type = String(getFuzzyKey(mc, ["ประเภท", "col_2"]) || '').trim();
      if (type === 'คอร์สครั้งเดียว' || type === 'ครั้งเดียว') return false;
      const searchStr = `${String(getFuzzyKey(mc, ["รหัสคอส", "col_1"]) || '')} ${String(getFuzzyKey(mc, ["ชื่อคอส", "col_4"]) || '')}`.toLowerCase();
      return searchTerm === '' || searchStr.includes(searchTerm.toLowerCase());
    });
  }, [masterCourses, searchTerm]);

  const filteredSingleCourses = useMemo(() => {
    return masterCourses.filter(mc => {
      const type = String(getFuzzyKey(mc, ["ประเภท", "col_2"]) || '').trim();
      if (type !== 'คอร์สครั้งเดียว' && type !== 'ครั้งเดียว') return false;
      const searchStr = `${String(getFuzzyKey(mc, ["รหัสคอส", "col_1"]) || '')} ${String(getFuzzyKey(mc, ["ชื่อคอส", "col_4"]) || '')}`.toLowerCase();
      return searchTerm === '' || searchStr.includes(searchTerm.toLowerCase());
    });
  }, [masterCourses, searchTerm]);"""

content = content.replace(target_filteredCourses, replacement_filteredCourses)

# 3. Update checkout customer check
target_checkout = "const hasCourse = cart.some(i => i.type === 'course');"
replacement_checkout = """const hasCourse = cart.some(i => {
      if (i.type !== 'course') return false;
      const type = String(getFuzzyKey(i.originalItem, ["ประเภท", "col_2"]) || '').trim();
      return type !== 'คอร์สครั้งเดียว' && type !== 'ครั้งเดียว';
    });"""

content = content.replace(target_checkout, replacement_checkout)

# 4. Add the tab button
target_tab_btn = """              <button 
                onClick={() => setActiveTab('courses')}
                className={`flex-1 py-2 px-2 sm:px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'courses' ? 'bg-pink-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                <Layers size={18} />
                <span className="hidden sm:inline">คอร์ส</span>
              </button>"""

replacement_tab_btn = """              <button 
                onClick={() => setActiveTab('courses')}
                className={`flex-1 py-2 px-2 sm:px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'courses' ? 'bg-pink-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                <Layers size={18} />
                <span className="hidden sm:inline">คอร์ส</span>
              </button>
              <button 
                onClick={() => setActiveTab('single_courses')}
                className={`flex-1 py-2 px-2 sm:px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'single_courses' ? 'bg-violet-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                <CheckCircle size={18} />
                <span className="hidden sm:inline text-[11px] sm:text-[14px]">ครั้งเดียว</span>
              </button>"""

content = content.replace(target_tab_btn, replacement_tab_btn)

# 5. Render the list for single_courses
target_list_render = """            ) : activeTab === 'courses' ? (
              <>
                {filteredCourses.map(mc => (
                  <div 
                    key={mc.id} 
                    onClick={() => addToCart(mc, 'course')}
                    className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md border border-pink-100 cursor-pointer transition-all active:scale-95 flex flex-col h-full group relative"
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-pink-400"></div>
                    <div className="pl-2">
                      <p className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-2 mb-2 min-h-[32px] sm:min-h-[40px] group-hover:text-pink-600 transition-colors">
                        {String(getFuzzyKey(mc, ["ชื่อคอส", "col_4"]) || '-')}
                      </p>
                      <div className="flex justify-between items-end mt-auto">
                        <p className="text-sm sm:text-base font-black text-pink-600">฿{parseNumber(getFuzzyKey(mc, ["ราคา", "col_5"])).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) :"""

replacement_list_render = """            ) : activeTab === 'courses' ? (
              <>
                {filteredCourses.map(mc => (
                  <div 
                    key={mc.id} 
                    onClick={() => addToCart(mc, 'course')}
                    className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md border border-pink-100 cursor-pointer transition-all active:scale-95 flex flex-col h-full group relative"
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-pink-400"></div>
                    <div className="pl-2">
                      <p className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-2 mb-2 min-h-[32px] sm:min-h-[40px] group-hover:text-pink-600 transition-colors">
                        {String(getFuzzyKey(mc, ["ชื่อคอส", "col_4"]) || '-')}
                      </p>
                      <div className="flex justify-between items-end mt-auto">
                        <p className="text-sm sm:text-base font-black text-pink-600">฿{parseNumber(getFuzzyKey(mc, ["ราคา", "col_5"])).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : activeTab === 'single_courses' ? (
              <>
                {filteredSingleCourses.map(mc => (
                  <div 
                    key={mc.id} 
                    onClick={() => addToCart(mc, 'course')}
                    className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md border border-violet-100 cursor-pointer transition-all active:scale-95 flex flex-col h-full group relative"
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-violet-400"></div>
                    <div className="pl-2">
                      <p className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-2 mb-2 min-h-[32px] sm:min-h-[40px] group-hover:text-violet-600 transition-colors">
                        {String(getFuzzyKey(mc, ["ชื่อคอส", "col_4"]) || '-')}
                      </p>
                      <div className="flex justify-between items-end mt-auto">
                        <p className="text-sm sm:text-base font-black text-violet-600">฿{parseNumber(getFuzzyKey(mc, ["ราคา", "col_5"])).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) :"""

content = content.replace(target_list_render, replacement_list_render)

# 6. Update the empty state check
target_empty = "{((activeTab === 'products' && filteredProducts.length === 0) || (activeTab === 'courses' && filteredCourses.length === 0) || (activeTab === 'my_courses' && filteredMyCourses.length === 0)) && ("
replacement_empty = "{((activeTab === 'products' && filteredProducts.length === 0) || (activeTab === 'courses' && filteredCourses.length === 0) || (activeTab === 'single_courses' && filteredSingleCourses.length === 0) || (activeTab === 'my_courses' && filteredMyCourses.length === 0)) && ("

content = content.replace(target_empty, replacement_empty)

with open(file_path, "w") as f:
    f.write(content)
print("Updated single courses tab")
