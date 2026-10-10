const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

if (!content.includes('import ErrorBoundary from')) {
  content = content.replace(
    "import MasterCoursesSettings from './components/MasterCoursesSettings';",
    "import MasterCoursesSettings from './components/MasterCoursesSettings';\nimport ErrorBoundary from './components/ErrorBoundary';"
  );
}

const target = `{activeTab === 'pos' && (
            <POSSystem 
              products={products}
              branches={branches}
              masterCourses={masterCourses}
              customers={customers}
              courses={processedCourses}
              histories={histories}
              orders={orders}
              showToast={triggerToast}
              globalBranch={globalBranch}
              appSettings={appSettings}
              employees={employees}
              employeeAttendance={employeeAttendance}
              posPreselectedCustomer={posPreselectedCustomer}
              clearPosPreselectedCustomer={() => setPosPreselectedCustomer(null)}
            />
          )}`;

const replacement = `{activeTab === 'pos' && (
            <ErrorBoundary>
              <POSSystem 
                products={products}
                branches={branches}
                masterCourses={masterCourses}
                customers={customers}
                courses={processedCourses}
                histories={histories}
                orders={orders}
                showToast={triggerToast}
                globalBranch={globalBranch}
                appSettings={appSettings}
                employees={employees}
                employeeAttendance={employeeAttendance}
                posPreselectedCustomer={posPreselectedCustomer}
                clearPosPreselectedCustomer={() => setPosPreselectedCustomer(null)}
              />
            </ErrorBoundary>
          )}`;

content = content.replace(target, replacement);
fs.writeFileSync('src/App.jsx', content);
console.log('Replaced successfully');
