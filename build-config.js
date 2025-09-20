// Build script to inject environment variables into frontend files
require('dotenv').config();
const fs = require('fs');

// Read the current config.js
const configContent = fs.readFileSync('config.js', 'utf8');

// Replace the API_BASE_URL with the environment variable
const updatedConfig = configContent.replace(
    "API_BASE_URL: 'http://localhost:3000'",
    `API_BASE_URL: '${process.env.API_BASE_URL || 'http://localhost:3000'}'`
);

// Write the updated config.js
fs.writeFileSync('config.js', updatedConfig);

// Also update api-integration.js if it exists
const apiIntegrationPath = 'backend/api-integration.js';
if (fs.existsSync(apiIntegrationPath)) {
    const apiContent = fs.readFileSync(apiIntegrationPath, 'utf8');
    const updatedApiContent = apiContent.replace(
        "const API_BASE_URL = `${process.env.API_BASE_URL || 'http://localhost:3000'}/api`;",
        `const API_BASE_URL = '${process.env.API_BASE_URL || 'http://localhost:3000'}/api';`
    );
    fs.writeFileSync(apiIntegrationPath, updatedApiContent);
    console.log('✅ API integration file updated');
}

console.log('✅ Config updated with API_BASE_URL:', process.env.API_BASE_URL || 'http://localhost:3000');
