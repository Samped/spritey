// API Configuration
// This file contains the API base URL configuration
// For local development: use http://localhost:3000
// For production (Render): change to your Render app URL

const CONFIG = {

    
    // For production deployment on Render, uncomment and update the line below:
     API_BASE_URL: 'https://spritey.onrender.com',
    
    // Environment detection (optional)
    isDevelopment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    isProduction: !(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
};

// Export for use in other files
window.CONFIG = CONFIG;
