// Direct API Configuration
// This file provides a direct way to configure API URLs without relying on environment variables

// PRODUCTION CONFIGURATION
const PRODUCTION_CONFIG = {
  API_URL: 'https://api.nanakfinserv.com/api',
  DOWNLOAD_URL: 'https://api.nanakfinserv.com/api/user/download/',
  BASE_URL: 'https://api.nanakfinserv.com',
  NODE_ENV: 'production'
};

// DEVELOPMENT CONFIGURATION
const DEVELOPMENT_CONFIG = {
  API_URL: 'http://localhost:5001/api',
  DOWNLOAD_URL: 'http://localhost:5001/api/user/download/',
  BASE_URL: 'http://localhost:5001',
  NODE_ENV: 'development'
};

// Determine which configuration to use
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Force development URLs for local development (uncomment the line below to force production)
const config = DEVELOPMENT_CONFIG;

// Use this line instead if you want to auto-detect based on hostname
// const config = isDevelopment ? DEVELOPMENT_CONFIG : PRODUCTION_CONFIG;

console.log('🔧 API Configuration (Direct):');
console.log('Using config for:', isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION');
console.log('API_URL:', config.API_URL);
console.log('DOWNLOAD_URL:', config.DOWNLOAD_URL);
console.log('BASE_URL:', config.BASE_URL);

export default config;
