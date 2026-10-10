const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

content = content.replace("  }, [bookings]);\n  }, [selectedCustomer]);", "  }, [bookings]);");

fs.writeFileSync('src/App.jsx', content, 'utf8');
