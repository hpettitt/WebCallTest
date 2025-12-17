// Sample config loader for customer-specific overrides
// Place this in a shared location (e.g., server/ or dashboard/)

const path = require('path');
const fs = require('fs');

function loadCustomerConfig(customerName) {
    // Try to load customer-specific config
    const customerConfigPath = path.join(__dirname, '../customers', customerName, 'config.js');
    if (fs.existsSync(customerConfigPath)) {
        return require(customerConfigPath);
    }
    // Fallback to default config
    return require('../dashboard/config.js');
}

// Usage example:
// const config = loadCustomerConfig(process.env.CUSTOMER || 'default');
// console.log('Loaded config:', config);

module.exports = { loadCustomerConfig };
