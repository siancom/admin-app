import re

with open('/Users/ittichai/ZCodeProject/admin-dashboard/src/App.jsx', 'r') as f:
    content = f.read()

pattern1 = r'<div className="text-\[10px\] font-bold text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md flex items-center gap-1">\s*<Calendar size=\{10\} className="text-gray-400"\/>\s*ซื้อ: \{String\(getFuzzyKey\(course, \["วันที่ซื้อ", "col_3"\]\) \|\| \'-\'\)\}\s*<\/div>'

replacement1 = """<div className="flex items-center gap-1">
                                    <span className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[10px] font-bold border border-indigo-100">
                                        อายุ {course.durationText || '1 ปี'}
                                    </span>
                                    <div className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                        <Calendar size={10} className="text-gray-400"/>
                                        ซื้อ: {String(getFuzzyKey(course, ["วันที่ซื้อ", "col_3"]) || '-')}
                                    </div>
                                </div>"""

pattern2 = r'<span className="text-\[9px\] font-bold text-gray-400 bg-gray-50 border border-gray-100 px-1\.5 py-0\.5 rounded-md flex items-center gap-0\.5">\s*<Calendar size=\{9\}\/>\s*ซื้อ: \{String\(getFuzzyKey\(c, \["วันที่ซื้อ", "col_3"\]\) \|\| \'-\'\)\}\s*<\/span>'

replacement2 = """<span className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md text-[9px] font-bold border border-indigo-100 mr-0.5">
                                                        อายุ {c.durationText || '1 ปี'}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-gray-400 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                                        <Calendar size={9}/>
                                                        ซื้อ: {String(getFuzzyKey(c, ["วันที่ซื้อ", "col_3"]) || '-')}
                                                    </span>"""

new_content = re.sub(pattern1, replacement1, content)
new_content = re.sub(pattern2, replacement2, new_content)

with open('/Users/ittichai/ZCodeProject/admin-dashboard/src/App.jsx', 'w') as f:
    f.write(new_content)
