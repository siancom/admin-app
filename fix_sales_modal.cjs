const fs = require('fs');

let pos = fs.readFileSync('src/components/POSSystem.jsx', 'utf8');

if (!pos.includes("import SalesHistoryModal")) {
    pos = pos.replace(
        "import BarcodeScannerModal from './BarcodeScannerModal';",
        "import BarcodeScannerModal from './BarcodeScannerModal';\nimport SalesHistoryModal from './SalesHistoryModal';"
    );
}

if (!pos.includes("const [showSalesHistory")) {
    pos = pos.replace(
        "const [showWebOrdersModal, setShowWebOrdersModal] = useState(false);",
        "const [showWebOrdersModal, setShowWebOrdersModal] = useState(false);\n  const [showSalesHistory, setShowSalesHistory] = useState(false);"
    );
}

if (!pos.includes("<SalesHistoryModal")) {
    pos = pos.replace(
        "    </div>\n  );\n}",
        `      <SalesHistoryModal
        isOpen={showSalesHistory}
        onClose={() => setShowSalesHistory(false)}
        showToast={showToast}
        globalBranch={globalBranch}
        appSettings={appSettings}
        currentMonthSales={currentMonthSales}
        todaySales={todaySales}
        todaySalesBreakdown={todaySalesBreakdown}
        setShowEodModal={setShowEodModal}
      />\n    </div>\n  );\n}`
    );
}

fs.writeFileSync('src/components/POSSystem.jsx', pos);
console.log('Fixed SalesHistoryModal usage');
