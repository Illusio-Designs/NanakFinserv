import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import config from '../config/apiConfig';

// Auth/session storage helpers (extracted from userAPI.js).
//
// Cookie options: HTTPS-only + SameSite to reduce token theft / CSRF surface.
// (Truly httpOnly cookies must be set by the backend; js-cookie cannot.)
const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const COOKIE_OPTS = { expires: 7, sameSite: 'strict', secure: !isLocalhost };

export const setToken = (token) => {
  Cookies.set('token', token, COOKIE_OPTS);
};

export const setUser = (user) => {
  Cookies.set('user', JSON.stringify(user), COOKIE_OPTS);
};

export const setCategory = (category) => {
  if (category && category.length) {
    const categoryData = category.map((item) => item['category.category_id']);
    Cookies.set('category', categoryData, COOKIE_OPTS);
  } else {
    Cookies.set('category', [], COOKIE_OPTS);
  }
};

export const getToken = () => Cookies.get('token');

export const errorHandel = (error) => {
  const errorMessage = error?.response?.data?.message || 'Something went wrong';
  toast.error(errorMessage, {
    duration: 3000,
    style: { background: '#333', color: '#fff' },
  });
  // 401 is handled globally by the axios interceptor.
};

export const logout = (showMessage = true) => {
  // Best-effort: clear the server-set httpOnly cookie too (no-op if unsupported).
  try {
    fetch(`${config.API_URL}/user/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});
  } catch (_) {
    /* ignore */
  }

  Cookies.remove('token');
  Cookies.remove('user');
  Cookies.remove('category');

  if (showMessage) {
    toast.success('Session expired. Please login again.', {
      duration: 3000,
      style: { background: '#333', color: '#fff' },
    });
  }

  window.location.href = '/login';
};

// Manual logout for logout buttons.
export const manualLogout = () => logout(true);
