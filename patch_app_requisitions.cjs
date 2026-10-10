const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Add state for employeeRequisitions
const stateRegex = /  const \[employeeLeaves, setEmployeeLeaves\] = useState\(\[\]\);/;
const newState = `  const [employeeLeaves, setEmployeeLeaves] = useState([]);
  const [employeeRequisitions, setEmployeeRequisitions] = useState([]);`;

if (content.match(stateRegex)) {
    content = content.replace(stateRegex, newState);
    console.log("Added state for employeeRequisitions.");
}

// 2. Add onSnapshot for employee_requisitions
const snapshotRegex = /const unsub13 = onSnapshot\(getCol\('employee_leaves'\), \(s\) => \{ setEmployeeLeaves\(s\.docs\.map\(d => \(\{ id: d\.id, \.\.\.d\.data\(\) \}\)\)\); \}, errHandler\);/;

const newSnapshot = `const unsub13 = onSnapshot(getCol('employee_leaves'), (s) => { setEmployeeLeaves(s.docs.map(d => ({ id: d.id, ...d.data() }))); }, errHandler);
    const unsubReqs = onSnapshot(getCol('employee_requisitions'), (s) => { setEmployeeRequisitions(s.docs.map(d => ({ id: d.id, ...d.data() }))); }, errHandler);`;

if (content.match(snapshotRegex)) {
    content = content.replace(snapshotRegex, newSnapshot);
    console.log("Added onSnapshot for employee_requisitions.");
}

// 3. Add to return cleanup array
const cleanupRegex = /return \(\) => \{\s*unsub1\(\);\s*unsub2\(\);[\s\S]*?unsub13\(\);\s*\};/;
if (content.match(cleanupRegex)) {
    const matched = content.match(cleanupRegex)[0];
    const newCleanup = matched.replace('unsub13();', 'unsub13(); unsubReqs();');
    content = content.replace(cleanupRegex, newCleanup);
    console.log("Added unsubReqs to cleanup.");
}

// 4. Pass requisitions to EmployeeDashboard and FrontAttendanceModal and any other place
// First, EmployeeDashboard
const dashRegex = /<EmployeeDashboard employees=\{employees\}/;
const newDash = `<EmployeeDashboard employees={employees} requisitions={employeeRequisitions}`;
if (content.match(dashRegex)) {
    content = content.replace(dashRegex, newDash);
    console.log("Passed requisitions to EmployeeDashboard.");
}

// Then FrontAttendanceModal
const frontRegex = /<FrontAttendanceModal\s*isOpen=\{isFrontAttendanceModalOpen\}/;
const newFront = `<FrontAttendanceModal isOpen={isFrontAttendanceModalOpen} requisitions={employeeRequisitions}`;
if (content.match(frontRegex)) {
    content = content.replace(frontRegex, newFront);
    console.log("Passed requisitions to FrontAttendanceModal.");
}

fs.writeFileSync('src/App.jsx', content, 'utf8');
