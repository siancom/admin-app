import sys

file_path = "/Users/ittichai/ZCodeProject/admin-dashboard/src/components/POSSystem.jsx"

with open(file_path, "r") as f:
    lines = f.readlines()

fix = """                     </tbody>
                   </table>
                </div>

                {todaySalesBreakdown.transferDetails?.length > 0 && (
                <div className="mt-8 break-inside-avoid">
                   <h3 className="font-bold text-lg mb-3 bg-slate-100 p-2 border-l-4 border-slate-800">รายการโอนเงิน</h3>
                   <table className="w-full text-sm border-collapse border border-slate-300">
                     <thead className="bg-slate-50">
                       <tr>
"""

# Insert the fix after line 2939 (0-indexed 2938)
lines.insert(2939, fix)

with open(file_path, "w") as f:
    f.writelines(lines)
print("Fixed.")
