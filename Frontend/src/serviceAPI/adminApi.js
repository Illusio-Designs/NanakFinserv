import { axios, API_URL, authHeaders } from './apiBase';
import { errorHandel } from './authStorage';

// Admin settings + data-wipe APIs (super admin).

export const getVerticalSettings = async () => {
  try {
    const res = await axios.get(`${API_URL}/admin/settings/verticals`, authHeaders());
    return res.data; // { verticals, status }
  } catch (error) {
    errorHandel(error);
    return false;
  }
};

export const updateVerticalSettings = async (data) => {
  try {
    const res = await axios.put(`${API_URL}/admin/settings/verticals`, data, authHeaders());
    return res.data;
  } catch (error) {
    errorHandel(error);
    return false;
  }
};

export const wipeData = async () => {
  try {
    const res = await axios.post(`${API_URL}/admin/data/wipe`, { confirm: 'WIPE' }, authHeaders());
    return res.data;
  } catch (error) {
    errorHandel(error);
    return false;
  }
};
