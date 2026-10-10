const fs = require('fs');

let content = fs.readFileSync('src/components/FrontAttendanceModal.jsx', 'utf8');

const propRegex = /export default function FrontAttendanceModal\(\{([^}]+)\}\) \{/;

if (content.match(propRegex)) {
    const matchedStr = content.match(propRegex)[1];
    const newProps = matchedStr + ', requisitions = []';
    content = content.replace(propRegex, `export default function FrontAttendanceModal({${newProps}}) {`);
    console.log("Updated FrontAttendanceModal props.");
}

const portalOld = /<EmployeePortal employee=\{activeEmployeeForPortal\}/g;
if (content.match(portalOld)) {
    content = content.replace(portalOld, `<EmployeePortal employee={activeEmployeeForPortal} requisitions={requisitions}`);
    console.log("Updated EmployeePortal props in FrontAttendanceModal.");
}

fs.writeFileSync('src/components/FrontAttendanceModal.jsx', content, 'utf8');
