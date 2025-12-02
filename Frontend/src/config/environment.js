// Environment Configuration
// This file handles environment variables properly

// Debug: Log all available environment variables
console.log('🔍 All process.env variables:', process.env);
console.log('🔍 REACT_APP_API_URL from process.env:', process.env.REACT_APP_API_URL);
console.log('🔍 REACT_APP_DOWNLOAD_URL from process.env:', process.env.REACT_APP_DOWNLOAD_URL);
console.log('🔍 REACT_APP_BASE_URL from process.env:', process.env.REACT_APP_BASE_URL);

// Get environment variables with fallbacks
const getEnvVar = (key, defaultValue = '') => {
  const value = process.env[key];
  console.log(`🔍 Checking ${key}:`, value);
  if (value === undefined || value === null || value === '') {
    console.warn(`⚠️ Environment variable ${key} is not defined, using default: ${defaultValue}`);
    return defaultValue;
  }
  return value;
};

// Environment configuration with explicit fallbacks
const config = {
  // API Configuration - Use development URLs as fallbacks
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
  DOWNLOAD_URL: process.env.REACT_APP_DOWNLOAD_URL || 'http://localhost:5001/api/user/download/',
  BASE_URL: process.env.REACT_APP_BASE_URL || 'http://localhost:5001',
  
  // Environment info
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: (process.env.NODE_ENV || 'development') === 'production',
  IS_DEVELOPMENT: (process.env.NODE_ENV || 'development') === 'development',
};

// const config = {
//   API_URL: process.env.REACT_APP_API_URL || 'https://api.nanakfinserv.com/api',
//   DOWNLOAD_URL: process.env.REACT_APP_DOWNLOAD_URL || 'https://api.nanakfinserv.com/api/user/download/',
//   BASE_URL: process.env.REACT_APP_BASE_URL || 'https://api.nanakfinserv.com',
//   NODE_ENV: process.env.NODE_ENV || 'production',
//   IS_PRODUCTION: (process.env.NODE_ENV || 'production') === 'production',
//   IS_DEVELOPMENT: (process.env.NODE_ENV || 'development') === 'development',
// };



// Debug logging
console.log('🔧 Environment Configuration Loaded:');
console.log('API_URL:', config.API_URL);
console.log('DOWNLOAD_URL:', config.DOWNLOAD_URL);
console.log('BASE_URL:', config.BASE_URL);
console.log('NODE_ENV:', config.NODE_ENV);
console.log('IS_PRODUCTION:', config.IS_PRODUCTION);
console.log('IS_DEVELOPMENT:', config.IS_DEVELOPMENT);

// Validate critical environment variables
if (!config.API_URL) {
  console.error('❌ CRITICAL: API_URL is not defined!');
} else {
  console.log('✅ API_URL is properly configured:', config.API_URL);
}

if (!config.DOWNLOAD_URL) {
  console.error('❌ CRITICAL: DOWNLOAD_URL is not defined!');
} else {
  console.log('✅ DOWNLOAD_URL is properly configured:', config.DOWNLOAD_URL);
}

export default config;
