import axios from 'axios';
import Cookies from 'js-cookie';
import config from '../config/apiConfig';
import { logout } from './authStorage';

// Shared API base for all serviceAPI modules.
export const API_URL = config.API_URL;
export const DOWNLOAD_URL = config.DOWNLOAD_URL;
export const BASE_URL = config.BASE_URL;

// Global 401 handling: an unauthenticated response logs the user out — except
// for the auth endpoints themselves (login/verify/logout handle their own
// errors; bouncing on those caused redirect loops). The failing URL is logged
// so an unexpected 401 is diagnosable in the console.
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      console.error('[auth] 401 from', url);
      const isAuthEndpoint = /\/user\/(login|verfiy|logout)\b/.test(url);
      if (!isAuthEndpoint) {
        logout(false); // errorHandel shows the message
      }
    }
    return Promise.reject(error);
  }
);

// Standard auth header for requests (token from cookie).
export const authHeaders = () => ({ headers: { token: Cookies.get('token') } });

export { axios };
