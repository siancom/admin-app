const fs = require('fs');

let epContent = fs.readFileSync('src/components/EmployeePortal.jsx', 'utf8');

const targetStr = `  // Calculate Branch Target Progress
  const branchTargetStats = useMemo(() => {
     const currentMonth = new Date().toISOString().substring(0, 7);
     let branchSales = 0;
     orders.forEach(o => {
       const isSameMonth = o.createdAt && o.createdAt.startsWith(currentMonth);
       const isSameBranch = o.branch === employee.branch;
       if (isSameMonth && isSameBranch && (!o.status || o.status === 'อนุมัติแล้ว')) {
         const isPO = o.transactionType === 'owner_purchase' || (o.courseName || '').includes('[ซื้อเข้า');
         const isReq = o.transactionType === 'branch_requisition' || (o.courseName || '').includes('[เบิกจาก');
         if (!isPO && !isReq) {
           branchSales += parseNumber(o.price);
         }
       }
     });
     
     const target = parseNumber(appSettings?.branchTargets?.[employee.branch] || 0);
     const percent = target > 0 ? Math.min(100, (branchSales / target) * 100) : 0;
     
     return { branchSales, target, percent };
  }, [orders, appSettings, employee.branch]);`;

const newStr = `  // Calculate Branch Target Progress
  const branchTargetStats = useMemo(() => {
     const currentMonth = new Date().toISOString().substring(0, 7);
     
     // Handle branch name mismatch (e.g. "เฉวง" vs "สาขาเฉวง")
     const empBranch = employee.branch || '';
     const altBranch = empBranch.startsWith('สาขา') ? empBranch.replace('สาขา', '').trim() : 'สาขา' + empBranch;
     
     let branchSales = 0;
     orders.forEach(o => {
       const isSameMonth = o.createdAt && o.createdAt.startsWith(currentMonth);
       const isSameBranch = o.branch === empBranch || o.branch === altBranch;
       if (isSameMonth && isSameBranch && (!o.status || o.status === 'อนุมัติแล้ว')) {
         const isPO = o.transactionType === 'owner_purchase' || (o.courseName || '').includes('[ซื้อเข้า');
         const isReq = o.transactionType === 'branch_requisition' || (o.courseName || '').includes('[เบิกจาก');
         if (!isPO && !isReq) {
           branchSales += parseNumber(o.price);
         }
       }
     });
     
     let target = parseNumber(appSettings?.branchTargets?.[empBranch] || 0);
     if (!target) {
        target = parseNumber(appSettings?.branchTargets?.[altBranch] || 0);
     }
     
     const percent = target > 0 ? Math.min(100, (branchSales / target) * 100) : 0;
     
     return { branchSales, target, percent };
  }, [orders, appSettings, employee.branch]);`;

if (epContent.includes(targetStr)) {
    epContent = epContent.replace(targetStr, newStr);
    fs.writeFileSync('src/components/EmployeePortal.jsx', epContent, 'utf8');
    console.log("Branch target stats updated successfully.");
} else {
    console.log("Could not find the target string.");
}
