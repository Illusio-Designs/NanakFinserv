import axios from 'axios';
import Cookies from 'js-cookie';
import config from '../config/apiConfig';
import { logout } from './authStorage';

// Shared API base for all serviceAPI modules.
export const API_URL = config.API_URL;
export const DOWNLOAD_URL = config.DOWNLOAD_URL;
export const BASE_URL = config.BASE_URL;

// Global 401 handling: any unauthenticated response logs the user out.
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      logout(false); // errorHandel shows the message
    }
    return Promise.reject(error);
  }
);

// Standard auth header for requests (token from cookie).
export const authHeaders = () => ({ headers: { token: Cookies.get('token') } });

export { axios };
