import sys

file_path = "/Users/ittichai/ZCodeProject/admin-dashboard/src/components/POSSystem.jsx"

with open(file_path, "r") as f:
    content = f.read()

# 1. Update the label of the input
target_label = """                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">ยอดเงินสดที่นับได้จริง (รวมเงินทอน)</label>
                  <input 
                    type="number" 
                    value={eodData.actualCash}"""

replacement_label = """                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">ยอดส่งเงินสดจริง (จำนวนเงินที่หยิบไปฝากธนาคาร)</label>
                  <input 
                    type="number" 
                    value={eodData.actualCash}"""

content = content.replace(target_label, replacement_label)


# 2. Update the logic inside eodTab === 'cash' calculation block
target_logic = """                  const expectedCash = todaySalesBreakdown.cash + (parseNumber(eodData.floatCash) || 0);
                  const actual = parseNumber(eodData.actualCash) || 0;
                  const diff = actual - expectedCash;
                  
                  const floatCashNum = parseNumber(eodData.floatCash) || 0;
                  const effectiveActual = eodData.actualCash ? actual : expectedCash;
                  const nonCashSales = (todaySalesBreakdown.transfer || 0) + (todaySalesBreakdown.credit || 0) + (todaySalesBreakdown.cod || 0);
                  const totalSystemBalance = effectiveActual + nonCashSales;
                  const baseFloat = Math.floor(floatCashNum / 100) * 100;
                  const totalTheoreticalDeposit = Math.floor(totalSystemBalance / 100) * 100 - baseFloat;
                  const nextDayFloat = totalSystemBalance - totalTheoreticalDeposit;
                  const remitAmount = effectiveActual - nextDayFloat;"""

replacement_logic = """                  const expectedCash = todaySalesBreakdown.cash + (parseNumber(eodData.floatCash) || 0);
                  const nonCashSales = (todaySalesBreakdown.transfer || 0) + (todaySalesBreakdown.credit || 0) + (todaySalesBreakdown.cod || 0);
                  
                  // Expected calculations based on perfect system balance
                  const expectedTotalSystemBalance = expectedCash + nonCashSales;
                  const floatCashNum = parseNumber(eodData.floatCash) || 0;
                  const baseFloat = Math.floor(floatCashNum / 100) * 100;
                  const expectedTheoreticalDeposit = Math.floor(expectedTotalSystemBalance / 100) * 100 - baseFloat;
                  const expectedNextDayFloat = expectedTotalSystemBalance - expectedTheoreticalDeposit;
                  const expectedRemitAmount = expectedCash - expectedNextDayFloat;
                  
                  // The user inputs remitted cash into eodData.actualCash
                  const actualRemittedCash = parseNumber(eodData.actualCash) || 0;
                  
                  // If they typed something, diff is actualRemitted - expectedRemitted
                  const diff = eodData.actualCash ? actualRemittedCash - expectedRemitAmount : 0;
                  
                  // Reconstruct actual total cash (assuming nextDayFloat stays the same as expected)
                  const actualTotalCash = eodData.actualCash ? actualRemittedCash + expectedNextDayFloat : expectedCash;
                  
                  const totalSystemBalance = actualTotalCash + nonCashSales;
                  const totalTheoreticalDeposit = Math.floor(totalSystemBalance / 100) * 100 - baseFloat;
                  const nextDayFloat = totalSystemBalance - totalTheoreticalDeposit;
                  const remitAmount = eodData.actualCash ? actualRemittedCash : expectedRemitAmount;"""

content = content.replace(target_logic, replacement_logic)


# 3. Update the handleEodSubmit logic
target_submit_logic = """      const expectedCash = todaySalesBreakdown.cash + (parseNumber(eodData.floatCash) || 0);
      const actual = parseNumber(eodData.actualCash) || expectedCash;
      const diff = eodData.actualCash ? actual - expectedCash : 0;
      
      const floatCashNum = parseNumber(eodData.floatCash) || 0;
      const nonCashSales = (todaySalesBreakdown.transfer || 0) + (todaySalesBreakdown.credit || 0) + (todaySalesBreakdown.cod || 0);
      const totalSystemBalance = actual + nonCashSales;
      const baseFloat = Math.floor(floatCashNum / 100) * 100;
      const totalTheoreticalDeposit = Math.floor(totalSystemBalance / 100) * 100 - baseFloat;
      const nextDayFloat = totalSystemBalance - totalTheoreticalDeposit;
      const remitAmount = actual - nextDayFloat;"""

replacement_submit_logic = """      const expectedCash = todaySalesBreakdown.cash + (parseNumber(eodData.floatCash) || 0);
      const nonCashSales = (todaySalesBreakdown.transfer || 0) + (todaySalesBreakdown.credit || 0) + (todaySalesBreakdown.cod || 0);
      
      const expectedTotalSystemBalance = expectedCash + nonCashSales;
      const floatCashNum = parseNumber(eodData.floatCash) || 0;
      const baseFloat = Math.floor(floatCashNum / 100) * 100;
      const expectedTheoreticalDeposit = Math.floor(expectedTotalSystemBalance / 100) * 100 - baseFloat;
      const expectedNextDayFloat = expectedTotalSystemBalance - expectedTheoreticalDeposit;
      const expectedRemitAmount = expectedCash - expectedNextDayFloat;

      const actualRemittedCash = parseNumber(eodData.actualCash);
      const diff = eodData.actualCash ? actualRemittedCash - expectedRemitAmount : 0;
      const actual = eodData.actualCash ? actualRemittedCash + expectedNextDayFloat : expectedCash;

      const totalSystemBalance = actual + nonCashSales;
      const totalTheoreticalDeposit = Math.floor(totalSystemBalance / 100) * 100 - baseFloat;
      const nextDayFloat = totalSystemBalance - totalTheoreticalDeposit;
      const remitAmount = eodData.actualCash ? actualRemittedCash : expectedRemitAmount;"""

content = content.replace(target_submit_logic, replacement_submit_logic)

# 4. Update the A4 preview logic to reconstruct actual correctly
target_a4_logic_actual = """                            const actual = eodData.actualCash ? parseNumber(eodData.actualCash) : expected;"""

replacement_a4_logic_actual = """                            const nonCashTemp = (todaySalesBreakdown.transfer || 0) + (todaySalesBreakdown.credit || 0) + (todaySalesBreakdown.cod || 0);
                            const baseFloatTemp = Math.floor((parseNumber(eodData.floatCash) || 0) / 100) * 100;
                            const expTotalTemp = expected + nonCashTemp;
                            const expDepTemp = Math.floor(expTotalTemp / 100) * 100 - baseFloatTemp;
                            const expFloatTemp = expTotalTemp - expDepTemp;
                            const actualRemitted = parseNumber(eodData.actualCash);
                            const actual = eodData.actualCash ? actualRemitted + expFloatTemp : expected;"""

content = content.replace(target_a4_logic_actual, replacement_a4_logic_actual)


with open(file_path, "w") as f:
    f.write(content)
print("Updated POSSystem.jsx")
