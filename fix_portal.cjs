const fs = require('fs');

let content = fs.readFileSync('src/components/EmployeePortal.jsx', 'utf8');

const target1 = `  const [scheduleMonth, setScheduleMonth] = useState(new Date().toISOString().substring(0, 7));
  const [calendarSelection, setCalendarSelection] = useState(null);`;

const replace1 = `  const [scheduleMonth, setScheduleMonth] = useState(new Date().toISOString().substring(0, 7));
  const [payrollMonth, setPayrollMonth] = useState(new Date().toISOString().substring(0, 7));
  const [calendarSelection, setCalendarSelection] = useState(null);`;

if (content.includes(target1)) {
    content = content.replace(target1, replace1);
    console.log("Restored payrollMonth.");
}

const optionMatch = `<option value="ลากิจ">ลากิจ</option>
                               <option value="ลาพักร้อน">ลาพักร้อน</option>`;
const optionReplace = `<option value="ลากิจ">ลากิจ</option>
                               <option value="ลาพักร้อน">ลาพักร้อน</option>
                               <option value="สลับวันหยุด">สลับวันหยุด</option>`;

if (content.includes(optionMatch) && !content.includes('<option value="สลับวันหยุด">สลับวันหยุด</option>')) {
    content = content.replace(optionMatch, optionReplace);
    console.log("Added สลับวันหยุด to dropdown.");
}

fs.writeFileSync('src/components/EmployeePortal.jsx', content, 'utf8');
