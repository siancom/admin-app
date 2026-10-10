import sys

file_path = "/Users/ittichai/ZCodeProject/admin-dashboard/src/components/POSSystem.jsx"

with open(file_path, "r") as f:
    content = f.read()

# For courses: return NOT qty == 1
target_filteredCourses = """  const filteredCourses = useMemo(() => {
    return masterCourses.filter(mc => {
      const type = String(getFuzzyKey(mc, ["ประเภท", "col_2"]) || '').trim();
      if (type === 'รายครั้ง' || type === 'ครั้งเดียว') return false;
      const searchStr = `${String(getFuzzyKey(mc, ["รหัสคอส", "col_1"]) || '')} ${String(getFuzzyKey(mc, ["ชื่อคอส", "col_4"]) || '')}`.toLowerCase();
      return searchTerm === '' || searchStr.includes(searchTerm.toLowerCase());
    });
  }, [masterCourses, searchTerm]);"""

replacement_filteredCourses = """  const filteredCourses = useMemo(() => {
    return masterCourses.filter(mc => {
      const qty = String(getFuzzyKey(mc, ["จำนวนครั้ง", "col_7"]) || '').trim();
      if (qty === '1') return false;
      const searchStr = `${String(getFuzzyKey(mc, ["รหัสคอส", "col_1"]) || '')} ${String(getFuzzyKey(mc, ["ชื่อคอส", "col_4"]) || '')}`.toLowerCase();
      return searchTerm === '' || searchStr.includes(searchTerm.toLowerCase());
    });
  }, [masterCourses, searchTerm]);"""

content = content.replace(target_filteredCourses, replacement_filteredCourses)

# For single_courses: return qty == 1
target_filteredSingleCourses = """  const filteredSingleCourses = useMemo(() => {
    return masterCourses.filter(mc => {
      const type = String(getFuzzyKey(mc, ["ประเภท", "col_2"]) || '').trim();
      if (type !== 'รายครั้ง' && type !== 'ครั้งเดียว') return false;
      const searchStr = `${String(getFuzzyKey(mc, ["รหัสคอส", "col_1"]) || '')} ${String(getFuzzyKey(mc, ["ชื่อคอส", "col_4"]) || '')}`.toLowerCase();
      return searchTerm === '' || searchStr.includes(searchTerm.toLowerCase());
    });
  }, [masterCourses, searchTerm]);"""

replacement_filteredSingleCourses = """  const filteredSingleCourses = useMemo(() => {
    return masterCourses.filter(mc => {
      const qty = String(getFuzzyKey(mc, ["จำนวนครั้ง", "col_7"]) || '').trim();
      if (qty !== '1') return false;
      const searchStr = `${String(getFuzzyKey(mc, ["รหัสคอส", "col_1"]) || '')} ${String(getFuzzyKey(mc, ["ชื่อคอส", "col_4"]) || '')}`.toLowerCase();
      return searchTerm === '' || searchStr.includes(searchTerm.toLowerCase());
    });
  }, [masterCourses, searchTerm]);"""

content = content.replace(target_filteredSingleCourses, replacement_filteredSingleCourses)

# For checkout: 
target_checkout = """const hasCourse = cart.some(i => {
      if (i.type !== 'course') return false;
      const type = String(getFuzzyKey(i.originalItem, ["ประเภท", "col_2"]) || '').trim();
      return type !== 'รายครั้ง' && type !== 'ครั้งเดียว';
    });"""

replacement_checkout = """const hasCourse = cart.some(i => {
      if (i.type !== 'course') return false;
      const qty = String(getFuzzyKey(i.originalItem, ["จำนวนครั้ง", "col_7"]) || '').trim();
      return qty !== '1';
    });"""

content = content.replace(target_checkout, replacement_checkout)

with open(file_path, "w") as f:
    f.write(content)
print("Updated qty check")
