// API configuration — environment-driven.
//
// Precedence:
//   1. REACT_APP_* build-time env vars (set per environment)
//   2. hostname heuristic (localhost -> dev API, otherwise prod API)
//
// Replaces the previous hardcoded `config = DEVELOPMENT_CONFIG`, which made
// production builds talk to http://localhost:5001.

const PRODUCTION_CONFIG = {
  API_URL: 'https://api.nanakfinserv.com/api',
  DOWNLOAD_URL: 'https://api.nanakfinserv.com/api/user/download/',
  BASE_URL: 'https://api.nanakfinserv.com',
};

const DEVELOPMENT_CONFIG = {
  API_URL: 'http://localhost:5001/api',
  DOWNLOAD_URL: 'http://localhost:5001/api/user/download/',
  BASE_URL: 'http://localhost:5001',
};

const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
const fallback = isLocalhost ? DEVELOPMENT_CONFIG : PRODUCTION_CONFIG;

const config = {
  API_URL: process.env.REACT_APP_API_URL || fallback.API_URL,
  DOWNLOAD_URL: process.env.REACT_APP_DOWNLOAD_URL || fallback.DOWNLOAD_URL,
  BASE_URL: process.env.REACT_APP_BASE_URL || fallback.BASE_URL,
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: (process.env.NODE_ENV || 'development') === 'production',
};

export default config;
