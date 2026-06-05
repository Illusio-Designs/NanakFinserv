import { axios, API_URL, authHeaders } from './apiBase';
import { errorHandel } from './authStorage';

// Building Manager APIs (extracted from userAPI.js).

export const createBuildingManager = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/user/building-manager/create`, data, authHeaders());
    return response.data;
  } catch (error) {
    errorHandel(error);
    return false;
  }
};

export const assignBuildingManager = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/user/building-manager/assign`, data, authHeaders());
    return response.data;
  } catch (error) {
    errorHandel(error);
    return false;
  }
};

export const getAllBuildingManagers = async () => {
  try {
    const response = await axios.get(`${API_URL}/user/building-manager/list`, authHeaders());
    return response.data;
  } catch (error) {
    errorHandel(error);
    return false;
  }
};

export const getBuildingManagerStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/user/building-manager/stats`, authHeaders());
    return response.data;
  } catch (error) {
    errorHandel(error);
    return false;
  }
};

export const getBuildingManagerDashboardStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/user/building-manager/dashboard-stats`, authHeaders());
    return response.data;
  } catch (error) {
    errorHandel(error);
    return false;
  }
};

export const updateBuildingManager = async (id, data) => {
  try {
    const response = await axios.put(`${API_URL}/user/building-manager/update/${id}`, data, authHeaders());
    return response.data;
  } catch (error) {
    errorHandel(error);
    return false;
  }
};

export const removeBuildingManager = async (id) => {
  try {
    const response = await axios.put(`${API_URL}/user/building-manager/remove/${id}`, {}, authHeaders());
    return response.data;
  } catch (error) {
    errorHandel(error);
    return false;
  }
};
