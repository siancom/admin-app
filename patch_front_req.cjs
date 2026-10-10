const fs = require('fs');

let content = fs.readFileSync('src/components/FrontAttendanceModal.jsx', 'utf8');

// 1. Add requisitions to props
const propOld = `histories, branches, appSettings, orders, serviceLogs }) => {`;
const propNew = `histories, branches, appSettings, orders, serviceLogs, requisitions }) => {`;
if (content.includes(propOld)) {
    content = content.replace(propOld, propNew);
    console.log("Added requisitions prop to FrontAttendanceModal.");
}

// 2. Pass to EmployeePortal
const portalOld = `<EmployeePortal employee={activeEmployeeForPortal}`;
const portalNew = `<EmployeePortal employee={activeEmployeeForPortal} requisitions={requisitions || []}`;
if (content.includes(portalOld)) {
    content = content.replace(portalOld, portalNew);
    console.log("Passed requisitions to EmployeePortal.");
}

fs.writeFileSync('src/components/FrontAttendanceModal.jsx', content, 'utf8');
