const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

if (!content.includes('import ErrorBoundary from')) {
  content = content.replace(
    "import MasterCoursesSettings from './components/MasterCoursesSettings';",
    "import MasterCoursesSettings from './components/MasterCoursesSettings';\nimport ErrorBoundary from './components/ErrorBoundary';"
  );
}

// Replace the opening tag
content = content.replace(
  "{activeTab === 'pos' && (\n            <POSSystem ",
  "{activeTab === 'pos' && (\n            <ErrorBoundary>\n            <POSSystem "
);

// Replace the closing tag. Find where POSSystem closes.
// We can use a regex.
content = content.replace(
  /(\s*clearPosPreselectedCustomer=\{.*?\}\n\s*\/>)\n\s*\)}/,
  "$1\n            </ErrorBoundary>\n          )}"
);

fs.writeFileSync('src/App.jsx', content);
console.log('Replaced successfully');
