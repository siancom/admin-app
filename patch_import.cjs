const fs = require('fs');
let content = fs.readFileSync('src/components/EmployeePortal.jsx', 'utf8');
if (content.includes("import { addDoc, updateDoc, doc } from 'firebase/firestore';")) {
    content = content.replace("import { addDoc, updateDoc, doc } from 'firebase/firestore';", "import { addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';");
    fs.writeFileSync('src/components/EmployeePortal.jsx', content, 'utf8');
    console.log("Added deleteDoc to imports.");
} else {
    console.log("Could not find the import line to replace.");
}
