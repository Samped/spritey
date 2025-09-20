// API Configuration
// This file loads the API base URL from environment variables
// The API_BASE_URL is set in the .env file and injected at build time

const CONFIG = {
    // Load API URL from environment variable (injected at build time)
    API_BASE_URL: 'http://localhost:3000',
    
    // Environment detection (optional)
    isDevelopment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    isProduction: !(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
};

// Export for use in other files
window.CONFIG = CONFIG;
