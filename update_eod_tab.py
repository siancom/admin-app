import sys

file_path = "/Users/ittichai/ZCodeProject/admin-dashboard/src/components/POSSystem.jsx"

with open(file_path, "r") as f:
    content = f.read()

old_code = """                  if (!eodData.actualCash || !eodData.floatCash) return null;
                  return (
                    <div className="space-y-3">
                      <div className={`p-4 rounded-xl border shadow-sm ${diff > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : diff < 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                        <div className="flex justify-between font-bold text-sm">
                          <span>สถานะเงินสด</span>
                          <span>{diff > 0 ? 'ยอดเกิน' : diff < 0 ? 'ยอดขาด' : 'ยอดพอดี'}</span>
                        </div>
                        <div className="text-3xl font-black text-center my-2">
                          {diff > 0 ? '+' : ''}{diff.toLocaleString()}
                        </div>
                        <div className="text-xs text-center font-medium opacity-80">
                          ควรมีในลิ้นชัก: ฿{expectedCash.toLocaleString()}
                        </div>
                      </div>"""

new_code = """                  if (!eodData.floatCash) return null;
                  return (
                    <div className="space-y-3">
                      {eodData.actualCash && (
                        <div className={`p-4 rounded-xl border shadow-sm ${diff > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : diff < 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                          <div className="flex justify-between font-bold text-sm">
                            <span>สถานะเงินสด</span>
                            <span>{diff > 0 ? 'ยอดเกิน' : diff < 0 ? 'ยอดขาด' : 'ยอดพอดี'}</span>
                          </div>
                          <div className="text-3xl font-black text-center my-2">
                            {diff > 0 ? '+' : ''}{diff.toLocaleString()}
                          </div>
                          <div className="text-xs text-center font-medium opacity-80">
                            ควรมีในลิ้นชัก: ฿{expectedCash.toLocaleString()}
                          </div>
                        </div>
                      )}"""

content = content.replace(old_code, new_code)

with open(file_path, "w") as f:
    f.write(content)
print("Updated POSSystem.jsx")
