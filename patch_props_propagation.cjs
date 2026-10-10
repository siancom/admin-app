const fs = require('fs');

// 1. Update App.jsx
let appContent = fs.readFileSync('src/App.jsx', 'utf8');

const dashMatch = `<EmployeeDashboard employees={employees} attendance={employeeAttendance} histories={histories} branches={branches} leaves={employeeLeaves} advancePayments={advancePayments} dailySales={dailySales} />`;
const dashReplace = `<EmployeeDashboard employees={employees} attendance={employeeAttendance} histories={histories} branches={branches} leaves={employeeLeaves} advancePayments={advancePayments} dailySales={dailySales} appSettings={appSettings} orders={orders} serviceLogs={serviceLogs} />`;
if (appContent.includes(dashMatch)) {
    appContent = appContent.replace(dashMatch, dashReplace);
} else {
    console.log("Could not find EmployeeDashboard in App.jsx");
}

const modalMatch = `<FrontAttendanceModal
          employees={employees}
          attendance={employeeAttendance}
          branches={branches}
          leaves={employeeLeaves}
          advancePayments={advancePayments}
          histories={histories}
          dailySales={dailySales}`;
const modalReplace = `<FrontAttendanceModal
          employees={employees}
          attendance={employeeAttendance}
          branches={branches}
          leaves={employeeLeaves}
          advancePayments={advancePayments}
          histories={histories}
          dailySales={dailySales}
          appSettings={appSettings}
          orders={orders}
          serviceLogs={serviceLogs}`;
if (appContent.includes(modalMatch)) {
    appContent = appContent.replace(modalMatch, modalReplace);
} else {
    console.log("Could not find FrontAttendanceModal in App.jsx");
}

fs.writeFileSync('src/App.jsx', appContent, 'utf8');

// 2. Update EmployeeDashboard.jsx
let empDashContent = fs.readFileSync('src/components/EmployeeDashboard.jsx', 'utf8');

const empDashSigMatch = `export default function EmployeeDashboard({ employees = [], attendance = [], histories = [], branches = [], leaves = [], advancePayments = [], dailySales = [], onGoToPOS }) {`;
const empDashSigReplace = `export default function EmployeeDashboard({ employees = [], attendance = [], histories = [], branches = [], leaves = [], advancePayments = [], dailySales = [], onGoToPOS, appSettings = {}, orders = [], serviceLogs = [] }) {`;
if (empDashContent.includes(empDashSigMatch)) {
    empDashContent = empDashContent.replace(empDashSigMatch, empDashSigReplace);
} else {
    console.log("Could not find EmployeeDashboard signature");
}

const empDashPortalMatch = `<EmployeePortal 
           employee={selectedEmployeeForPortal}
           attendance={attendance}
           leaves={leaves}
           advancePayments={advancePayments}
           histories={histories}
           branches={branches}
           dailySales={dailySales}`;
const empDashPortalReplace = `<EmployeePortal 
           employee={selectedEmployeeForPortal}
           attendance={attendance}
           leaves={leaves}
           advancePayments={advancePayments}
           histories={histories}
           branches={branches}
           dailySales={dailySales}
           appSettings={appSettings}
           orders={orders}
           serviceLogs={serviceLogs}`;
if (empDashContent.includes(empDashPortalMatch)) {
    empDashContent = empDashContent.replace(empDashPortalMatch, empDashPortalReplace);
} else {
    console.log("Could not find EmployeePortal in EmployeeDashboard");
}

fs.writeFileSync('src/components/EmployeeDashboard.jsx', empDashContent, 'utf8');

// 3. Update FrontAttendanceModal.jsx
let modalContent = fs.readFileSync('src/components/FrontAttendanceModal.jsx', 'utf8');

const modalSigMatch = `export default function FrontAttendanceModal({ employees = [], attendance = [], branches = [], leaves = [], advancePayments = [], histories = [], dailySales = [], onClose, onGoToPOS }) {`;
const modalSigReplace = `export default function FrontAttendanceModal({ employees = [], attendance = [], branches = [], leaves = [], advancePayments = [], histories = [], dailySales = [], onClose, onGoToPOS, appSettings = {}, orders = [], serviceLogs = [] }) {`;
if (modalContent.includes(modalSigMatch)) {
    modalContent = modalContent.replace(modalSigMatch, modalSigReplace);
} else {
    console.log("Could not find FrontAttendanceModal signature");
}

const modalPortalMatch = `<EmployeePortal
           employee={selectedEmployeeForPortal}
           attendance={attendance}
           leaves={leaves}
           advancePayments={advancePayments}
           histories={histories}
           branches={branches}
           dailySales={dailySales}`;
const modalPortalReplace = `<EmployeePortal
           employee={selectedEmployeeForPortal}
           attendance={attendance}
           leaves={leaves}
           advancePayments={advancePayments}
           histories={histories}
           branches={branches}
           dailySales={dailySales}
           appSettings={appSettings}
           orders={orders}
           serviceLogs={serviceLogs}`;
if (modalContent.includes(modalPortalMatch)) {
    modalContent = modalContent.replace(modalPortalMatch, modalPortalReplace);
} else {
    console.log("Could not find EmployeePortal in FrontAttendanceModal");
}

fs.writeFileSync('src/components/FrontAttendanceModal.jsx', modalContent, 'utf8');

console.log("All files successfully patched with props propagation!");
