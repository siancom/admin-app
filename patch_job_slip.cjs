const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Add import
const importStr = `import EmployeePortal from './components/EmployeePortal';
import TreatmentJobSlipModal from './components/TreatmentJobSlipModal';`;
content = content.replace("import EmployeePortal from './components/EmployeePortal';", importStr);

// 2. Add state
const stateStr = `  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [printingJobSlipBooking, setPrintingJobSlipBooking] = useState(null);`;
content = content.replace("  const [isSidebarOpen, setSidebarOpen] = useState(false);", stateStr);

// 3. Add Modal at the bottom
const modalStr = `      {showSystemUpdateModal && (
        <SystemUpdateModal 
          isOpen={showSystemUpdateModal} 
          onClose={() => setShowSystemUpdateModal(false)}
        />
      )}
      
      <TreatmentJobSlipModal
          isOpen={!!printingJobSlipBooking}
          onClose={() => setPrintingJobSlipBooking(null)}
          booking={printingJobSlipBooking}
          appSettings={appSettings}
      />
`;
content = content.replace(`      {showSystemUpdateModal && (
        <SystemUpdateModal 
          isOpen={showSystemUpdateModal} 
          onClose={() => setShowSystemUpdateModal(false)}
        />
      )}`, modalStr);

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log("Patched App.jsx for TreatmentJobSlipModal");
