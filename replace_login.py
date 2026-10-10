import re

with open("src/App.jsx", "r") as f:
    content = f.read()

# We need to replace the entire if (!globalBranch) { ... } block up to the return ( ... ); } right before return ( <div className="flex h-screen...

start_str = "  if (!globalBranch) {"
end_str = "    );\n  }"

# Find the indices
start_idx = content.find(start_str)
if start_idx == -1:
    print("Could not find start string")
    exit(1)

# Find the matching closing bracket for the if block.
# Actually, the block ends with:
#       </div>
#     );
#   }
# 
#   return (

end_idx = content.find("  return (", start_idx)
if end_idx == -1:
    print("Could not find end string")
    exit(1)

# Ensure we're leaving the "  return (" intact
block_to_replace = content[start_idx:end_idx]

new_login_block = """  if (!globalRole || !globalBranch) {
    const handleRoleSelect = (role) => {
      setLoginStep(role === 'owner' ? 'owner_passcode' : 'staff_branch_selection');
      if (role === 'owner') {
         setBranchPasscodeModal({ isOpen: true, branch: { name: 'Owner' }, passcode: '' });
      }
    };

    const handleBranchClick = (branch) => {
      if (branch.passcode) {
         setLoginStep('staff_passcode');
         setBranchPasscodeModal({ isOpen: true, branch, passcode: '' });
      } else {
        localStorage.setItem('selectedBranch', branch.name);
        localStorage.setItem('userRole', 'staff');
        setGlobalBranch(branch.name);
        setGlobalRole('staff');
      }
    };

    const handlePasscodeSubmit = (e) => {
      e.preventDefault();
      if (loginStep === 'owner_passcode') {
        const masterPasscode = appSettings?.masterPasscode || '999999';
        if (branchPasscodeModal.passcode === masterPasscode) {
          localStorage.setItem('userRole', 'owner');
          localStorage.setItem('selectedBranch', 'เฉวง'); // Default owner branch
          setGlobalRole('owner');
          setGlobalBranch('เฉวง');
          setBranchPasscodeModal({ isOpen: false, branch: null, passcode: '' });
        } else {
          showToast('รหัสผ่านหลักไม่ถูกต้อง');
        }
      } else {
        if (branchPasscodeModal.passcode === branchPasscodeModal.branch.passcode) {
          localStorage.setItem('selectedBranch', branchPasscodeModal.branch.name);
          localStorage.setItem('userRole', 'staff');
          setGlobalBranch(branchPasscodeModal.branch.name);
          setGlobalRole('staff');
          setBranchPasscodeModal({ isOpen: false, branch: null, passcode: '' });
        } else {
          showToast('รหัสผ่านไม่ถูกต้อง');
        }
      }
    };

    const handleBack = () => {
      setLoginStep('role_selection');
      setBranchPasscodeModal({ isOpen: false, branch: null, passcode: '' });
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100 p-4 relative">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl text-center border border-indigo-50 z-10">
          <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Store size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-2">เข้าสู่ระบบ</h1>
          
          {loginStep === 'role_selection' && (
            <>
              <p className="text-slate-500 mb-8 font-medium">กรุณาเลือกสถานะการเข้าใช้งาน</p>
              <div className="space-y-4">
                <button 
                  onClick={() => handleRoleSelect('owner')}
                  className="w-full py-4 px-6 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-bold text-lg transition-all flex items-center justify-between shadow-sm active:scale-95"
                >
                  <div className="flex items-center gap-3">
                    <Settings size={24} /> เข้าสู่ระบบเจ้าของร้าน
                  </div>
                  <ShieldCheck size={18} className="text-slate-400" />
                </button>
                <button 
                  onClick={() => handleRoleSelect('staff')}
                  className="w-full py-4 px-6 bg-white border-2 border-indigo-100 hover:border-indigo-500 hover:bg-indigo-50 text-indigo-700 rounded-2xl font-bold text-lg transition-all flex items-center justify-between shadow-sm active:scale-95"
                >
                  <div className="flex items-center gap-3">
                    <Users size={24} /> เข้าสู่ระบบพนักงาน
                  </div>
                  <MapPin size={18} className="text-indigo-400" />
                </button>
              </div>
            </>
          )}

          {loginStep === 'staff_branch_selection' && (
            <>
              <p className="text-slate-500 mb-8 font-medium">กรุณาเลือกสาขาที่คุณต้องการใช้งาน</p>
              <div className="space-y-4 mb-4">
                {branches.map((b, idx) => (
                  <button 
                    key={b.id || idx}
                    onClick={() => handleBranchClick(b)}
                    className="w-full py-4 px-6 bg-white border-2 border-indigo-100 hover:border-indigo-500 hover:bg-indigo-50 text-indigo-700 rounded-2xl font-bold text-lg transition-all flex items-center justify-between shadow-sm active:scale-95"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin size={24} /> {b.name}
                    </div>
                    {b.passcode && <ShieldCheck size={18} className="text-indigo-400" />}
                  </button>
                ))}
              </div>
              <button onClick={handleBack} className="text-slate-500 font-bold hover:text-slate-800 text-sm py-2">
                ← กลับไปเลือกสถานะ
              </button>
            </>
          )}

          <div className="mt-8 pt-6 border-t border-indigo-100">
            <button 
              onClick={() => setShowFrontAttendance(true)}
              className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95"
            >
              <Clock size={24} />
              ระบบลงเวลาพนักงาน
            </button>
            <p className="text-xs text-slate-400 mt-3 font-medium">บันทึกเวลาเข้า-ออกงานโดยไม่ต้องเข้าระบบ</p>
          </div>
        </div>

        {/* Passcode Modal */}
        {branchPasscodeModal.isOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert size={32} />
                </div>
                <h3 className="text-2xl font-black text-gray-800">
                  {loginStep === 'owner_passcode' ? 'รหัสผ่านเจ้าของร้าน' : branchPasscodeModal.branch?.name}
                </h3>
                <p className="text-gray-500 mt-2 text-sm">กรุณาใส่รหัสผ่าน {loginStep === 'owner_passcode' ? 'หลัก 6 หลัก' : 'สาขา 4-6 หลัก'}</p>
              </div>
              <form onSubmit={handlePasscodeSubmit}>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={branchPasscodeModal.passcode}
                  onChange={(e) => setBranchPasscodeModal({...branchPasscodeModal, passcode: e.target.value})}
                  className="w-full text-center text-3xl font-mono tracking-[0.5em] p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none mb-6 transition-all"
                  placeholder="****"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button type="button" onClick={handleBack} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors">ยกเลิก</button>
                  <button type="submit" className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors">ยืนยัน</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Front Attendance Modal */}
        {showFrontAttendance && (
          <FrontAttendanceModal 
            employees={employees}
            attendance={employeeAttendance}
            branches={branches}
            dailySales={dailySales}
            leaves={employeeLeaves}
            advancePayments={advancePayments}
            histories={histories}
            onClose={() => setShowFrontAttendance(false)}
          />
        )}
      </div>
    );
  }

"""

new_content = content[:start_idx] + new_login_block + content[end_idx:]

with open("src/App.jsx", "w") as f:
    f.write(new_content)

print("Replacement successful")
