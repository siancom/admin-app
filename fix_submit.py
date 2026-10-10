import sys

file_path = "/Users/ittichai/ZCodeProject/admin-dashboard/src/components/POSSystem.jsx"

with open(file_path, "r") as f:
    content = f.read()

target = """      const expectedCash = todaySalesBreakdown.cash + (parseNumber(eodData.floatCash) || 0);
      const actual = parseNumber(eodData.actualCash) || 0;
      const diff = actual - expectedCash;
      
      const onlineSales = todaySalesBreakdown.online || 0;
      const eodRef = doc(getCol('daily_sales'));
      const batch = writeBatch(db);
      
      const posFilterDateObj = new Date();
      if (posFilterDate) {
        const [y, m, d] = posFilterDate.split('-');
        posFilterDateObj.setFullYear(y, m - 1, d);
      }
      const todayForFilter = posFilterDateObj.toLocaleDateString('th-TH');
      
      const floatCashNum = parseNumber(eodData.floatCash) || 0;
      const nonCashSales = (todaySalesBreakdown.transfer || 0) + (todaySalesBreakdown.credit || 0) + (todaySalesBreakdown.cod || 0);
      const totalSystemBalance = actual + nonCashSales;
      const baseFloat = Math.floor(floatCashNum / 100) * 100;
      const totalTheoreticalDeposit = Math.floor(totalSystemBalance / 100) * 100 - baseFloat;
      const nextDayFloat = totalSystemBalance - totalTheoreticalDeposit;
      const remitAmount = actual - nextDayFloat;"""

replacement = """      const expectedCash = todaySalesBreakdown.cash + (parseNumber(eodData.floatCash) || 0);
      const nonCashSales = (todaySalesBreakdown.transfer || 0) + (todaySalesBreakdown.credit || 0) + (todaySalesBreakdown.cod || 0);
      
      const expectedTotalSystemBalance = expectedCash + nonCashSales;
      const floatCashNum = parseNumber(eodData.floatCash) || 0;
      const baseFloat = Math.floor(floatCashNum / 100) * 100;
      const expectedTheoreticalDeposit = Math.floor(expectedTotalSystemBalance / 100) * 100 - baseFloat;
      const expectedNextDayFloat = expectedTotalSystemBalance - expectedTheoreticalDeposit;
      const expectedRemitAmount = expectedCash - expectedNextDayFloat;

      const actualRemittedCash = parseNumber(eodData.actualCash);
      const diff = eodData.actualCash ? actualRemittedCash - expectedRemitAmount : 0;
      const actualTotalCash = eodData.actualCash ? actualRemittedCash + expectedNextDayFloat : expectedCash;

      const totalSystemBalance = actualTotalCash + nonCashSales;
      const totalTheoreticalDeposit = Math.floor(totalSystemBalance / 100) * 100 - baseFloat;
      const nextDayFloat = totalSystemBalance - totalTheoreticalDeposit;
      const remitAmount = eodData.actualCash ? actualRemittedCash : expectedRemitAmount;

      const onlineSales = todaySalesBreakdown.online || 0;
      const eodRef = doc(getCol('daily_sales'));
      const batch = writeBatch(db);
      
      const posFilterDateObj = new Date();
      if (posFilterDate) {
        const [y, m, d] = posFilterDate.split('-');
        posFilterDateObj.setFullYear(y, m - 1, d);
      }
      const todayForFilter = posFilterDateObj.toLocaleDateString('th-TH');"""

content = content.replace(target, replacement)

# We also need to fix `batch.set` where it sets `actualCash: actual`.
target2 = """        floatCash: floatCashNum,
        actualCash: actual,
        expectedCash: expectedCash,"""

replacement2 = """        floatCash: floatCashNum,
        actualCash: actualTotalCash,
        expectedCash: expectedCash,"""

content = content.replace(target2, replacement2)

with open(file_path, "w") as f:
    f.write(content)
print("Updated POSSystem.jsx handleEodSubmit")
