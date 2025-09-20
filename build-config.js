// Build script to inject environment variables into frontend files
require('dotenv').config();
const fs = require('fs');

// Read the current config.js
const configContent = fs.readFileSync('config.js', 'utf8');

// Replace the API_BASE_URL with the environment variable
const updatedConfig = configContent.replace(
    "API_BASE_URL: 'https://spriteyy.onrender.com'",
    `API_BASE_URL: '${process.env.API_BASE_URL || 'http://localhost:3000'}'`
);

// Write the updated config.js
fs.writeFileSync('config.js', updatedConfig);

console.log('✅ Config updated with API_BASE_URL:', process.env.API_BASE_URL || 'http://localhost:3000');
