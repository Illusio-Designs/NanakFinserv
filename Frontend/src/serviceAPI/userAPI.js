import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import {
  setToken,
  setUser,
  setCategory,
  getToken,
  logout,
  manualLogout,
  errorHandel,
} from './authStorage';
import { API_URL, DOWNLOAD_URL, BASE_URL, authHeaders } from './apiBase';

// API base (constants + 401 interceptor) now lives in ./apiBase; the
// building-manager calls in ./buildingManagerApi. Re-exported here so existing
// imports from '../serviceAPI/userAPI' keep working.
export { API_URL, DOWNLOAD_URL, BASE_URL };
export * from './buildingManagerApi';


const login = async (mobileNumber, accessToken) => {
  try {
    // accessToken is the MSG91 widget access-token from a successful OTP.
    // The backend verifies it server-side before issuing the app JWT.
    const response = await axios.post(
      `${API_URL}/user/login`,
      { mobileNumber, accessToken },
      { withCredentials: true }
    );
    console.log('🔍 [LOGIN] Response received:', response);
    
    if (!response.data) {
      throw new Error('Invalid credentials');
    }

    if (!response.data) {
      toast.error('error')
      throw new Error('Invalid credentials');
      // return false;

    } else {
      console.log(response.data, 'sds')
      if (response.data) {
        const token = response.data.token;
        console.log(token);
        setToken(token);
        setUser(response.data.user);
        setCategory(response.data.user?.category);
        return true;
      } else {
        return false;
      }
    }
  } catch (error) {
    console.error('🔍 [LOGIN] Login failed:', error);
    console.error('🔍 [LOGIN] Error response:', error.response?.data);
    console.error('🔍 [LOGIN] Error status:', error.response?.status);
    console.error('🔍 [LOGIN] Error message:', error.message);
    
    // Show specific error message based on backend response
    if (error.response?.data?.error === 'User Not found.') {
      console.error('🔍 [LOGIN] User not found in database');
    }
    
    errorHandel(error)
    return false; // Login failed
  }
};

export const loginVerfiy = async (mobileNumber) => {
  try {
    const response = await axios.post(`${API_URL}/user/verfiy`, { mobileNumber });
    console.log(response);

    if (!response.data) {
      toast.error('error')
      throw new Error('Invalid credentials');
      // return false;

    } else {
      if (response.data && response.data?.status) {
        return true;
      } else {
        return false;
      }
    }
    // return response; // Login successful
  } catch (error) {
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

export const getRoles = async () => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.get(`${API_URL}/user/role/list`, headers);

    if (!response.data) {
      toast.error('error')
      throw new Error('Invalid credentials');
      // return false;

    } else {
      if (response.data && response.data?.status) {
        return response.data;
      } else {
        return [];
      }
    }

    // return re; // Login successful
  } catch (error) {
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

export const getAllUnitCatergory = async () => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.get(`${API_URL}/user/data/unitCategory`, headers);

    if (!response.data) {
      toast.error('error')
      throw new Error('Invalid credentials');
      // return false;

    } else {
      if (response.data && response.data?.status) {
        return response.data;
      } else {
        return [];
      }
    }

    // return re; // Login successful
  } catch (error) {
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

export const getAllConsumers = async () => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    console.log(headers, 'headers')
    const response = await axios.get(`${API_URL}/user/list/consumer`, headers);

    if (!response.data) {
      toast.error('error')
      throw new Error('Invalid credentials');
      // return false;

    } else {
      if (response.data && response.data?.status) {
        return response.data;
      } else {
        return [];
      }
    }

    // return re; // Login successful
  } catch (error) {
    console.log(error.response?.status)
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

export const getAllVerticle = async () => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {

    const response = await axios.get(`${API_URL}/user/list/verticle`, headers);

    if (!response.data) {
      toast.error('error')
      throw new Error('Invalid credentials');
      // return false;

    } else {
      if (response.data && response.data?.status) {
        return response.data;
      } else {
        return [];
      }
    }

    // return re; // Login successful
  } catch (error) {
    console.log(error.response?.status)
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

export const getAllCodes = async () => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {

    const response = await axios.get(`${API_URL}/user/data/code`, headers);

    if (!response.data) {
      toast.error('error')
      throw new Error('Invalid credentials');
      // return false;

    } else {
      if (response.data && response.data?.status) {
        return response.data;
      } else {
        return [];
      }
    }

    // return re; // Login successful
  } catch (error) {
    console.log(error.response?.status)
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

export const getAllInquieries = async () => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {

    const response = await axios.get(`${API_URL}/user/data/inquiery`, headers);

    if (!response.data) {
      toast.error('error')
      throw new Error('Invalid credentials');
      // return false;

    } else {
      if (response.data && response.data?.status) {
        return response.data;
      } else {
        return [];
      }
    }

    // return re; // Login successful
  } catch (error) {
    console.log(error.response?.status)
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

export const getAllVerticleUser = async (data) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {

    const response = await axios.post(`${API_URL}/user/list/verticleUser`, data, headers);

    if (!response.data) {
      toast.error('error')
      throw new Error('Invalid credentials');
      // return false;

    } else {
      if (response.data && response.data?.status) {
        return response.data;
      } else {
        return [];
      }
    }

    // return re; // Login successful
  } catch (error) {
    console.log(error.response?.status)
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

export const addRoleUser = async (data, addToast) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.post(`${API_URL}/user/data/role/add`, data, headers);
    console.log(response);

    if (!response.data) {
      toast.error('error')
      toast.error(response?.message || 'Something went wrong', {
        duration: 3000, // 5 seconds
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      throw new Error('Invalid credentials');
      // return false;

    } else {
      // addToast('Role user add successfully', 'success')
      toast.success('Role user add successfully', {
        duration: 3000, // 5 seconds
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      return response.data;
    }
    // return response; // Login successful
  } catch (error) {
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

export const addInquieryUser = async (data, addToast) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.post(`${API_URL}/user/data/inquiery`, data, headers);
    console.log(response);

    if (!response.data) {
      // toast.error('error')
      // addToast('something went wrong', 'error')
      toast.error('Something went wrong', {
        duration: 3000, // 5 seconds
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      throw new Error('Invalid credentials');
      // return false;

    } else {
      // addToast('user form submit successfully', 'success')
      toast.success('user form submit successfully', {
        duration: 3000, // 5 seconds
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      return response.data;
    }
    // return response; // Login successful
  } catch (error) {
    console.error('failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

export const addBuilderUser = async (data, addToast) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.post(`${API_URL}/user/data/add/builder`, data, headers);

    if (!response.data) {
      // toast.error('error')
      // addToast('something went wrong', 'error')
      toast.error('Something went wrong', {
        duration: 3000, // 5 seconds
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      throw new Error('Invalid credentials');
      // return false;

    } else {
      // addToast('Builder add successfully', 'success')
      toast.success('Builder add successfully', {
        duration: 3000, // 5 seconds
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      return response.data;
    }
    // return response; // Login successful
  } catch (error) {
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

export const addConsumerUser = async (data) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.post(`${API_URL}/user/data/add/consumer`, data, headers);

    if (!response.data) {
      toast.error('error')
      // addToast('something went wrong', 'error')
      toast.error('Something went wrong', {
        duration: 3000, // 5 seconds
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      throw new Error('Invalid credentials');
      // return false;

    } else {
      // addToast('Consumer add successfully', 'success')
      toast.success('Consumer add successfully', {
        duration: 3000, // 5 seconds
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      return response.data;
    }
    // return response; // Login successful
  } catch (error) {
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

export const addNewCode = async (data) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.post(`${API_URL}/user/data/code`, data, headers);

    if (!response.data) {
      toast.error('error')
      // addToast('something went wrong', 'error')
      toast.error('Something went wrong', {
        duration: 3000, // 5 seconds
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      throw new Error('Invalid credentials');
      // return false;

    } else {
      // addToast('Consumer add successfully', 'success')
      toast.success('Consumer add successfully', {
        duration: 3000, // 5 seconds
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      return response.data;
    }
    // return response; // Login successful
  } catch (error) {
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

export const addConsumerUnit = async (data, addToast) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.post(`${API_URL}/user/data/consumer/add`, data, headers);

    if (!response.data) {
      toast.error('error')
      // addToast('something went wrong', 'error')
      toast.error('Something went wrong', {
        duration: 3000, // 5 seconds
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      throw new Error('Invalid credentials');
      // return false;

    } else {
      // addToast('Consumer add successfully', 'success')
      toast.success('Consumer add successfully', {
        duration: 3000, // 5 seconds
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      return response.data;
    }
    // return response; // Login successful
  } catch (error) {
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

export const addUnitByBuilder = async (data, addToast) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.post(`${API_URL}/user/data/add/builderUnit`, data, headers);

    if (!response.data) {
      toast.error('error')
      // addToast('something went wrong', 'error')
      toast.error('Something went wrong', {
        duration: 3000, // 5 seconds
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      throw new Error('Invalid credentials');
      // return false;

    } else {
      // addToast('Unit builder add successfully', 'success')
      toast.success('Unit builder add successfully', {
        duration: 3000, // 5 seconds
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      return response.data;
    }
    // return response; // Login successful
  } catch (error) {
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

export const updateRoleUser = async (data, addToast) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.put(`${API_URL}/user/data/role/update`, data, headers);
    console.log(response);

    if (!response.data) {
      toast.error('error')
      // addToast('something went wrong', 'error')
      toast.error('Something went wrong', {
        duration: 3000, // 5 seconds
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      throw new Error('Invalid credentials');
      // return false;

    } else {
      // addToast('Role user update successfully', 'success')
      toast.success('Role user update successfully', {
        duration: 3000, // 5 seconds
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      return response.data;
    }
    // return response; // Login successful
  } catch (error) {
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

export const updateUnitByBuilder = async (data, addToast) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.put(`${API_URL}/user/data/update/builderUnit`, data, headers);

    if (!response.data) {
      toast.error('error')
      // addToast('something went wrong', 'error')
      toast.error('Something went wrong', {
        duration: 3000, // 5 seconds
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      throw new Error('Invalid credentials');
      // return false;

    } else {
      // addToast('Unit category builder update successfully', 'success')
      toast.success('Unit category builder update successfully', {
        duration: 3000, // 5 seconds
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      return response.data;
    }
    // return response; // Login successful
  } catch (error) {
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

export const getConsumerByUnit = async (data, addToast) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.post(`${API_URL}/user/data/builder/getunitwithconsumer`, data, headers);

    if (!response.data) {
      toast.error('error')
      // addToast('something went wrong', 'error')
      toast.error('Something went wrong', {
        duration: 3000, // 5 seconds
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      throw new Error('Invalid credentials');
      // return false;

    } else {
      // addToast('Unit consumer get successfully', 'success')
      return response.data;
    }
    // return response; // Login successful
  } catch (error) {
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

export const updateBuilderUser = async (data, addToast) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.post(`${API_URL}/user/data/update/builder`, data, headers);
    console.log(response);

    if (!response.data) {
      toast.error('error')
      // addToast('something went wrong', 'error')
      toast.error('Something went wrong', {
        duration: 3000, // 5 seconds
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      throw new Error('Invalid credentials');
      // return false;

    } else {
      // addToast('Builder update successfully', 'success')
      toast.success('Builder update successfully', {
        duration: 3000, // 5 seconds
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      return response.data;
    }
    // return response; // Login successful
  } catch (error) {
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

export const updateMediclaimCompany = async (data, addToast) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.put(`${API_URL}/user/mediclaim/company/update`, data, headers);
    console.log(response);

    if (!response.data) {
      toast.error('error')
      // addToast('something went wrong', 'error')
      toast.error('Something went wrong', {
        duration: 3000, // 5 seconds
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      throw new Error('Invalid credentials');
      // return false;

    } else {
      // addToast('Company update successfully', 'success')
      toast.success('Company update successfully', {
        duration: 3000, // 5 seconds
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      return response.data;
    }
    // return response; // Login successful
  } catch (error) {
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};
export const addMediclaimCompany = async (data, addToast) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.post(`${API_URL}/user/mediclaim/company/add`, data, headers);
    console.log(response);

    if (!response.data) {
      toast.error('error')
      // addToast('something went wrong', 'error')
      toast.error('Something went wrong', {
        duration: 3000, // 5 seconds
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      throw new Error('Invalid credentials');
      // return false;

    } else {
      // addToast('Company update successfully', 'success')
      toast.success('Company update successfully', {
        duration: 3000, // 5 seconds
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      return response.data;
    }
    // return response; // Login successful
  } catch (error) {
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

export const updateMediclaimProduct = async (data, addToast) => {
  try {
    const response = await axios.put(
      `${API_URL}/user/mediclaim/product/update/${data.get('mediclaim_company_id')}`,
      data, // FormData object containing text data and files
      {
        headers: {
          'token': Cookies.get('token'),
        }
      }
    );

    console.log(response);

    if (!response.data) {
      // addToast('Something went wrong', 'error');
      toast.error('Something went wrong', {
        duration: 3000, // 5 seconds
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      throw new Error('Invalid credentials');
    } else {
      // addToast('Company updated successfully', 'success');
      toast.success('data update successfully', {
        duration: 3000, // 5 seconds
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      return response.data;
    }
  } catch (error) {
    console.error('Update failed:', error);
    errorHandel(error);
    return false; // Update failed
  }
};

export const addMediclaimProduct = async (data, addToast) => {
  try {
    const response = await axios.post(
      `${API_URL}/user/mediclaim/product/add/${data.get('mediclaim_company_id')}`,
      data, // FormData object containing text data and files
      {
        headers: {
          'token': Cookies.get('token'),
        }
      }
    );

    console.log(response);

    if (!response.data) {
      // addToast('Something went wrong', 'error');
      toast.error('Something went wrong', {
        duration: 3000, // 5 seconds
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      throw new Error('Invalid credentials');
    } else {
      // addToast('Company added successfully', 'success');
      toast.success('Data added successfully', {
        duration: 3000, // 5 seconds
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      return response.data;
    }
  } catch (error) {
    console.error('Addition failed:', error);
    toast.error('Something went wrong', {
      duration: 3000, // 5 seconds
      style: {
        background: '#333',
        color: '#fff',
      },
    });
    errorHandel(error);
    return false; // Addition failed
  }
};

export const updateConsumerUser = async (data, addToast) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.put(`${API_URL}/user/data/update/consumer`, data, headers);


    if (!response.data) {
      toast.error('error')
      // addToast('something went wrong', 'error')
      toast.error('Something went wrong', {
        duration: 3000, // 5 seconds
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      throw new Error('Invalid credentials');
      // return false;

    } else {
      // addToast('Consumer update successfully', 'success')
      toast.success('Consumer update successfully', {
        duration: 3000, // 5 seconds
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      return response.data;
    }
    // return response; // Login successful
  } catch (error) {
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

export const updateLoanConsumerUser = async (data, addToast) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.put(`${API_URL}/user/data/add/consumer/loan`, data, headers);


    if (!response.data) {
      toast.error('error')
      // addToast('something went wrong', 'error')
      toast.error('Something went wrong', {
        duration: 3000, // 5 seconds
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      throw new Error('Invalid credentials');
      // return false;

    } else {
      // addToast('Consumer update successfully', 'success')
      toast.success('Consumer update successfully', {
        duration: 3000, // 5 seconds
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      return response.data;
    }
    // return response; // Login successful
  } catch (error) {
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

export const updateConsumerUnit = async (data, addToast) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.put(`${API_URL}/user/data/consumer/update/${data?.builderConsumerId}`, data, headers);


    if (!response.data) {
      toast.error('error')
      // addToast('something went wrong', 'error')
      toast.error('Something went wrong', {
        duration: 3000, // 5 seconds
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      throw new Error('Invalid credentials');
      // return false;

    } else {
      // addToast('Consumer update successfully', 'success')
      toast.success('Consumer update successfully', {
        duration: 3000, // 5 seconds
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      return response.data;
    }
    // return response; // Login successful
  } catch (error) {
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

export const addMediclaimUser = async (data, addToast) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.post(`${API_URL}/user/mediclaim/user/add`, data, headers);

    if (!response.data) {
      // toast.error('error')
      // addToast('something went wrong', 'error')
      toast.error('Something went wrong', {
        duration: 3000, // 5 seconds
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      throw new Error('Invalid credentials');
      // return false;

    } else {
      addToast('mediclaim add successfully', 'success')
      return response.data;
    }
    // return response; // Login successful
  } catch (error) {
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

export const updateMediclaimUser = async (data, id, addToast) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.put(`${API_URL}/user/mediclaim/user/update/${id}`, data, headers);


    if (!response.data) {
      // toast.error('error')
      // addToast('something went wrong', 'error')
      toast.error('Something went wrong', {
        duration: 3000, // 5 seconds
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      throw new Error('Invalid credentials');
      // return false;

    } else {
      if (addToast && typeof addToast === 'function') {
        addToast('mediclaim update successfully', 'success')
      }
      return response.data;
    }
    // return response; // Login successful
  } catch (error) {
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};
export const getRoleUserList = async () => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.get(`${API_URL}/user/list/roleWise`, headers);
    console.log(response);

    if (!response.data) {
      toast.error('error')
      throw new Error('Invalid credentials');
      // return false;

    } else {
      return response.data;
    }
    // return response; // Login successful
  } catch (error) {
    console.log(error.message)
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

export const getUserCountList = async () => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.get(`${API_URL}/user/data/counts`, headers);
    // console.log(response);

    if (!response.data) {
      toast.error('error')
      throw new Error('Invalid credentials');
      // return false;

    } else {
      return response.data;
    }
    // return response; // Login successful
  } catch (error) {
    console.log(error.message)
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};


export const getLoanAmounFilterDate = async (data) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.post(`${API_URL}/user/data/filter/amount`, data, headers);
    console.log(response);

    if (!response.data) {
      toast.error('error')
      throw new Error('Invalid credentials');
      // return false;

    } else {
      return response.data;
    }
    // return response; // Login successful
  } catch (error) {
    console.log(error.message)
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

export const getUnitsByBuilder = async (id) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.get(`${API_URL}/user/data/builder/unit`, headers);
    console.log(response);

    if (!response.data) {
      toast.error('error')
      throw new Error('Invalid credentials');
      // return false;

    } else {
      return response.data;
    }
    // return response; // Login successful
  } catch (error) {
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

export const getUnitsByBuilderCategory = async (unitId) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.get(`${API_URL}/user/data/builder/unitCategory/${unitId}`, headers);
    console.log(response);

    if (!response.data) {
      toast.error('error')
      throw new Error('Invalid credentials');
      // return false;

    } else {
      return response.data;
    }
    // return response; // Login successful
  } catch (error) {
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

export const getCategoryById = async (user_id) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.post(`${API_URL}/user/list/categoriesById`, { user_id }, headers);
    console.log(response);

    if (!response.data) {
      toast.error('error')
      throw new Error('Invalid credentials');
      // return false;

    } else {
      return response.data;
    }
    // return response; // Login successful
  } catch (error) {
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};
export const getAllBuildersList = async () => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {

    const response = await axios.get(`${API_URL}/user/list/builder/list`, headers);

    if (!response.data) {
      toast.error('error')
      throw new Error('Invalid credentials');
      // return false;

    } else {
      if (response.data && response.data?.status) {
        return response.data;
      } else {
        return [];
      }
    }

    // return re; // Login successful
  } catch (error) {
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};
export const getAllBuilders = async () => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {

    const response = await axios.get(`${API_URL}/user/list/builder`, headers);

    if (!response.data) {
      toast.error('error')
      throw new Error('Invalid credentials');
      // return false;

    } else {
      if (response.data && response.data?.status) {
        return response.data;
      } else {
        return [];
      }
    }

    // return re; // Login successful
  } catch (error) {
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};


export const getAllLoanConsumerDetail = async (data) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {

    const response = await axios.post(`${API_URL}/user/list/loan/detail`, data, headers);

    if (!response.data) {
      toast.error('error')
      throw new Error('Invalid credentials');
      // return false;

    } else {
      if (response.data && response.data?.status) {
        return response.data;
      } else {
        return [];
      }
    }

    // return re; // Login successful
  } catch (error) {
    console.log(error.response?.status)
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};
export const getAllLoanConsumer = async () => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {

    const response = await axios.get(`${API_URL}/user/list/loan?t=${Date.now()}`, headers);

    if (!response.data) {
      toast.error('error')
      throw new Error('Invalid credentials');
      // return false;

    } else {
      if (response.data && response.data?.status) {
        return response.data;
      } else {
        return [];
      }
    }

    // return re; // Login successful
  } catch (error) {
    console.log(error.response?.status)
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

export const getAllLoanInterestedConsumer = async (obj) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {

    const response = await axios.post(`${API_URL}/user/list/loanInterested`, obj, headers);

    if (!response.data) {
      toast.error('error')
      throw new Error('Invalid credentials');
      // return false;

    } else {
      if (response.data && response.data?.status) {
        return response.data;
      } else {
        return [];
      }
    }

    // return re; // Login successful
  } catch (error) {
    console.log(error.response?.status)
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

export const getAllMediclaimCompany = async () => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    console.log('🔍 API: Calling mediclaim company endpoint...');
    const response = await axios.get(`${API_URL}/user/mediclaim/company`, headers);
    console.log('🔍 API: Raw response:', response);

    if (!response.data) {
      console.error('🔍 API: No response data');
      throw new Error('Invalid credentials');
    } else {
      console.log('🔍 API: Response data:', response.data);
      if (response.data && response.data?.status) {
        console.log('🔍 API: Returning response data');
        return response.data;
      } else {
        console.log('🔍 API: Status false, returning empty array');
        return { data: [] };
      }
    }
  } catch (error) {
    console.log('🔍 API: Error status:', error.response?.status);
    console.error('🔍 API: Error in getAllMediclaimCompany:', error);
    errorHandel(error);
    return { data: [] }; // Return empty data instead of false
  }
};

export const getAllCompanyTypes = async () => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.get(`${API_URL}/user/data/company-type`, headers);
    if (response.data && response.data?.status) {
      return response.data;
    }
    return { data: [] };
  } catch (error) {
    console.error('Error fetching company types:', error);
    errorHandel(error);
    return { data: [] };
  }
};

export const addCompanyType = async (data) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.post(`${API_URL}/user/data/company-type`, data, headers);
    if (response.data && response.data?.status) {
      return response.data;
    }
    return { data: [] };
  } catch (error) {
    console.error('Error adding company type:', error);
    errorHandel(error);
    return { data: [] };
  }
};

export const getAllMediclaimProduct = async (data) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {

    const response = await axios.get(`${API_URL}/user/mediclaim/product/${data.mediclaim_company_id}`, headers);

    if (!response.data) {
      toast.error('error')
      throw new Error('Invalid credentials');
      // return false;

    } else {
      if (response.data && response.data?.status) {
        return response.data;
      } else {
        return [];
      }
    }

    // return re; // Login successful
  } catch (error) {
    console.log(error.response?.status)
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

export const getAllLoanNotInterestedConsumer = async () => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {

    const response = await axios.get(`${API_URL}/user/list/loanNotInterested`, headers);

    if (!response.data) {
      toast.error('error')
      throw new Error('Invalid credentials');
      // return false;

    } else {
      if (response.data && response.data?.status) {
        return response.data;
      } else {
        return [];
      }
    }

    // return re; // Login successful
  } catch (error) {
    console.log(error.response?.status)
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

export const getAllConfiguration = async (obj) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {

    const response = await axios.get(`${API_URL}/user/data/loan/configuration`, headers);

    if (!response.data) {
      toast.error('error')
      throw new Error('Invalid credentials');
      // return false;

    } else {
      if (response.data && response.data?.status) {
        return response.data;
      } else {
        return [];
      }
    }

    // return re; // Login successful
  } catch (error) {
    console.log(error.response?.status)
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};
export const getAllLoanDisburseConsumer = async (obj) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {

    const response = await axios.post(`${API_URL}/user/list/loanNotDisburse`, obj, headers);

    if (!response.data) {
      toast.error('error')
      throw new Error('Invalid credentials');
      // return false;

    } else {
      if (response.data && response.data?.status) {
        return response.data;
      } else {
        return [];
      }
    }

    // return re; // Login successful
  } catch (error) {
    console.log(error.response?.status)
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

export const updateLoanStatus = async (data) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.put(`${API_URL}/user/list/loanUpdateStatus`, data, headers);
    console.log(response);

    if (!response.data) {
      throw new Error('Invalid response');
    }
    return response.data;
    // return response; // Login successful
  } catch (error) {
    errorHandel(error);
    throw error;
  }
};

export const updateLoanWorkingStatus = async (data, addToast) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.put(`${API_URL}/user/list/loanUpdateWorkingStatus`, data, headers);
    console.log(response);

    if (!response.data) {
      toast.error('error')
      addToast('something went wrong', 'error')
      throw new Error('Invalid credentials');
      // return false;

    } else {
      addToast('Loan working status update successfully', 'success')
      return response.data;
    }
    // return response; // Login successful
  } catch (error) {
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

export const getAllMedicalimConsumer = async () => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {

    const response = await axios.get(`${API_URL}/user/list/mediclaim?t=${Date.now()}`, headers);

    if (!response.data) {
      toast.error('error')
      throw new Error('Invalid credentials');
      // return false;

    } else {
      if (response.data && response.data?.status) {
        return response.data;
      } else {
        return [];
      }
    }

    // return re; // Login successful
  } catch (error) {
    console.log(error.response?.status)
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

export const getAllMedicalimConsumerData = async () => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {

    const response = await axios.get(`${API_URL}/user/mediclaim/user/list?t=${Date.now()}`, headers);

    if (!response.data) {
      toast.error('error')
      throw new Error('Invalid credentials');
      // return false;

    } else {
      if (response.data && response.data?.status) {
        return response.data;
      } else {
        return [];
      }
    }

    // return re; // Login successful
  } catch (error) {
    console.log(error.response?.status)
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

export const getAllMedicalimConsumerRenewalData = async (data) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {

    const response = await axios.post(`${API_URL}/user/mediclaim/user/renewal/list`,data, headers);

    if (!response.data) {
      toast.error('error')
      throw new Error('Invalid credentials');
      // return false;

    } else {
      if (response.data && response.data?.status) {
        return response.data;
      } else {
        return [];
      }
    }

    // return re; // Login successful
  } catch (error) {
    console.log(error.response?.status)
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

export const getAllLifeInsConsumer = async () => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {

    const response = await axios.get(`${API_URL}/user/list/lifeIns?t=${Date.now()}`, headers);

    if (!response.data) {
      toast.error('error')
      throw new Error('Invalid credentials');
      // return false;

    } else {
      if (response.data && response.data?.status) {
        return response.data;
      } else {
        return [];
      }
    }

    // return re; // Login successful
  } catch (error) {
    console.log(error.response?.status)
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

export const getAllVehicleInsConsumer = async (status = null) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    let url = `${API_URL}/user/list/vehicleIns?t=${Date.now()}`;
    if (status) {
      url += `&status=${status}`;
    }
    const response = await axios.get(url, headers);

    if (!response.data) {
      toast.error('error')
      throw new Error('Invalid credentials');
    } else {
      if (response.data && response.data?.status) {
        return response.data.data || [];
      } else {
        return [];
      }
    }
  } catch (error) {
    console.log(error.response?.status)
    console.error('Login failed:', error);
    errorHandel(error)
    return [];
  }
};

// Renew vehicle policy: move running policy to previous
export const renewVehiclePolicy = async (vehicle_user_id) => {
  const headers = { headers: { 'token': Cookies.get('token') } };
  try {
    const response = await axios.post(`${API_URL}/user/renewVehiclePolicy`, { vehicle_user_id }, headers);
    if (response && response.data) return response.data;
    return { status: false, message: 'No response from server' };
  } catch (error) {
    console.error('Error calling renewVehiclePolicy:', error);
    errorHandel(error);
    return { status: false, message: error.response?.data?.message || error.message };
  }
};

export const addUpdateLoanConfiguration = async (data, addToast) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.post(`${API_URL}/user/loan/configuration/add`, data, headers);
    console.log(response);

    if (!response.data) {
      toast.error('error')
      addToast('something went wrong', 'error')
      throw new Error('Invalid credentials');
      // return false;

    } else {
      addToast('Loan disburse pdf added successfully', 'success')
      return response.data;
    }
    // return response; // Login successful
  } catch (error) {
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};
export const addUpdateLoanDisburse = async (data, addToast) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.post(`${API_URL}/user/loan/disburse/add`, data, headers);
    console.log(response);

    if (!response.data) {
      toast.error('error')
      addToast('something went wrong', 'error')
      throw new Error('Invalid credentials');
      // return false;

    } else {
      addToast('Loan disburse pdf added successfully', 'success')
      return response.data;
    }
    // return response; // Login successful
  } catch (error) {
    console.error('Login failed:', error);
    errorHandel(error)
    return false; // Login failed
  }
};

// Blog APIs
export const getAllBlogs = async () => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.get(`${API_URL}/user/blog/list`, headers);
    return response.data;
  } catch (error) {
    console.error('Error fetching blogs:', error);
    throw error;
  }
};

export const getBlogById = async (id) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.get(`${API_URL}/user/blog/${id}`, headers);
    return response.data;
  } catch (error) {
    console.error('Error fetching blog:', error);
    throw error;
  }
};

// Public Blog APIs
export const getAllBlogsPublic = async () => {
  try {
    const response = await axios.get(`${API_URL}/public/blog/list`);
    return response.data;
  } catch (error) {
    console.error('Error fetching public blogs:', error);
    throw error;
  }
};

export const getBlogByIdPublic = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/public/blog/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching public blog:', error);
    throw error;
  }
};

export const addBlog = async (formData) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
      'Content-Type': 'multipart/form-data',
    }
  }
  try {
    console.log('🔍 addBlog API - URL:', `${API_URL}/user/blog/add`);
    console.log('🔍 addBlog API - Headers:', headers);
    console.log('🔍 addBlog API - FormData contents:');
    for (let [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value);
    }
    
    const response = await axios.post(`${API_URL}/user/blog/add`, formData, { headers });
    console.log('🔍 addBlog API - Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error adding blog:', error);
    if (error.response) {
      console.error('Backend error response:', error.response.data);
    }
    throw error;
  }
};

export const updateBlog = async (id, formData) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
      'Content-Type': 'multipart/form-data',
    }
  }
  try {
    const response = await axios.put(`${API_URL}/user/blog/update/${id}`, formData, { headers });
    return response.data;
  } catch (error) {
    console.error('Error updating blog:', error);
    throw error;
  }
};

export const deleteBlog = async (id) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.delete(`${API_URL}/user/blog/delete/${id}`, headers);
    return response.data;
  } catch (error) {
    console.error('Error deleting blog:', error);
    throw error;
  }
};

// Vehicle related API handlers
export const addVehicleUserData = async (data, addToast) => {
  try {
    console.log('--- [addVehicleUserData] ---');
    console.log('URL:', `${API_URL}/user/vehicle/user/add`);
    console.log('Payload:', data);
    
    // Check if there are any files to upload
    const hasFiles = data.documentFiles && Object.values(data.documentFiles).some(file => file instanceof File);
    
    let requestData;
    let headers;
    
    if (hasFiles) {
      // Convert data to FormData to handle file uploads
      const formData = new FormData();
      headers = {
      'token': Cookies.get('token'),
      // Don't set Content-Type for FormData, let browser set it with boundary
      };
      
      // Add all form fields
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          if (key === 'documentFiles' && data[key]) {
            // Handle document files
            Object.keys(data[key]).forEach(fileKey => {
              if (data[key][fileKey]) {
                formData.append(fileKey, data[key][fileKey]);
              }
            });
          } else if (key === 'customDocuments' && data[key]) {
            // Handle custom documents
            data[key].forEach((doc, index) => {
              if (doc.file) {
                formData.append(`custom_${doc.category_id}`, doc.file);
              }
            });
          } else if (typeof data[key] === 'object' && data[key] !== null) {
            // Handle nested objects
            formData.append(key, JSON.stringify(data[key]));
          } else {
            formData.append(key, data[key]);
          }
        }
      });
      
      requestData = formData;
      
      // Debug: Log FormData contents
      console.log('FormData contents:');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }
    } else {
      // Send as JSON for regular data
      headers = {
          'token': Cookies.get('token'),
          'Content-Type': 'application/json',
      };
      requestData = { data };
    }
    
    console.log('Headers:', headers);
    console.log('Token from cookies:', Cookies.get('token'));
    const response = await axios.post(`${API_URL}/user/vehicle/user/add`, requestData, { headers });
    console.log('Response:', response.data);
    
    if (response.data && response.data?.status) {
      toast.success('Vehicle user added successfully', {
        duration: 3000,
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      return response.data;
    }
    // Show specific error message from backend
    const errorMessage = response.data?.message || 'Something went wrong';
    toast.error(errorMessage, {
      duration: 3000,
      style: {
        background: '#333',
        color: '#fff',
      },
    });
    return false;
  } catch (error) {
    console.error('Vehicle user add failed:', error);
    if (error.response) {
      console.error('Backend error response:', error.response.data);
    }
    errorHandel(error);
    return false;
  }
};

export const updateVehicleUserData = async (data, vehicleUserId, addToast) => {
  try {
    console.log('🔧 updateVehicleUserData called with:', { data, vehicleUserId });
    console.log('🔧 API URL:', `${API_URL}/user/vehicle/user/update/${vehicleUserId}`);
    
    // Check if there are any files to upload
    const hasFiles = data.documentFiles && Object.values(data.documentFiles).some(file => file instanceof File);
    
    let requestData;
    let headers;
    
    if (hasFiles) {
      // Convert data to FormData to handle file uploads
      const formData = new FormData();
      headers = {
      'token': Cookies.get('token'),
      // Don't set Content-Type for FormData, let browser set it with boundary
      };
      
      // Add all form fields
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          if (key === 'documentFiles' && data[key]) {
            // Handle document files
            Object.keys(data[key]).forEach(fileKey => {
              if (data[key][fileKey]) {
                formData.append(fileKey, data[key][fileKey]);
              }
            });
          } else if (key === 'customDocuments' && data[key]) {
            // Handle custom documents
            data[key].forEach((doc, index) => {
              if (doc.file) {
                formData.append(`custom_${doc.category_id}`, doc.file);
              }
            });
          } else if (typeof data[key] === 'object' && data[key] !== null) {
            // Handle nested objects
            formData.append(key, JSON.stringify(data[key]));
          } else {
            formData.append(key, data[key]);
          }
        }
      });
      
      requestData = formData;
      
      // Debug: Log FormData contents
      console.log('FormData contents:');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }
    } else {
      // Send as JSON for regular data
      headers = {
          'token': Cookies.get('token'),
          'Content-Type': 'application/json',
      };
      requestData = { data };
    }
    
    console.log('🔧 Token from cookies:', Cookies.get('token'));
    console.log("🚗 vehicleUserId sending:", vehicleUserId);
    const response = await axios.put(`${API_URL}/user/vehicle/user/update/${vehicleUserId}`, requestData, { headers });
    console.log('🔧 API Response:', response.data);

    if (!response.data) {
      toast.error('Something went wrong', {
        duration: 3000,
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      throw new Error('Invalid credentials');

    } else if (response.data && response.data?.status) {
      toast.success('Vehicle user update successfully', {
        duration: 3000,
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      return response.data;
    } else {
      // Show specific error message from backend
      const errorMessage = response.data?.message || 'Something went wrong';
      toast.error(errorMessage, {
        duration: 3000,
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      return false;
    }
  } catch (error) {
    console.error('❌ Vehicle user update failed:', error);
    console.error('❌ Error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data
      }
    });
    console.error('❌ Full error response data:', JSON.stringify(error.response?.data, null, 2));
    console.error('❌ Request payload that was sent:', JSON.stringify(error.config?.data, null, 2));
    errorHandel(error)
    return false;
  }
};

export const updateVehicleUserRemarkData = async (data, vehicleUserId, addToast) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    console.log('🔧 updateVehicleUserRemarkData called with:', { data, vehicleUserId });
    console.log('🔧 API URL:', `${API_URL}/user/vehicle/user/update/remark/${vehicleUserId}`);
    
    const response = await axios.put(`${API_URL}/user/vehicle/user/update/remark/${vehicleUserId}`, data, headers);
    console.log('🔧 Remark Update API Response:', response.data);
    
    if (response.data && response.data?.status) {
      toast.success('Vehicle remark updated successfully', {
        duration: 3000,
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      return response.data;
    }
    toast.error('Something went wrong', {
      duration: 3000,
      style: {
        background: '#333',
        color: '#fff',
      },
    });
    return false;
  } catch (error) {
    console.error('❌ Vehicle remark update failed:', error);
    console.error('❌ Error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data
      }
    });
    errorHandel(error);
    return false;
  }
};

export const getVehicleUserData = async () => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.post(`${API_URL}/user/vehicle/user/list`, {}, headers);
    if (response.data && response.data?.status) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error('Vehicle user data fetch failed:', error);
    errorHandel(error);
    return [];
  }
};

// export const getVehicleUserRenewalData = async (data) => {
//     const headers = {
//         headers: {
//             'token': Cookies.get('token'),
//         }
//     }
//     try {
//         // console.log("API CALL: Sending to /user/vehicle/user/renewal/list with data:", data);
//         const response = await axios.post(`${API_URL}/user/vehicle/user/renewal/list`, data, headers);
//         // console.log("API CALL: Received response:", response);

//         if (response.data && response.data.success) {
//             // console.log("API CALL: Success. Returning data:", response.data);
//             return response.data;
//         } else {
//             console.warn("API CALL: Call was not successful. Response:", response.data);
//             return [];
//         }
//     } catch (error) {
//         console.error('API CALL: Error in getVehicleUserRenewalData:', error);
//         errorHandel(error)
//         return [];
//     }
// };




export const getVehicleUserRenewalData = async (data) => {
    const headers = {
        headers: {
            'token': Cookies.get('token'),
        },
    };

    try {
        const response = await axios.post(`${API_URL}/user/vehicle/user/renewal/list`, data, headers);

        // ✅ Backend returns { status: true, data: [...] }
        if (response.data && response.data.status) {
            console.log("✅ API CALL: Success. Returning data:", response.data);
            return response.data;
        } else {
            console.warn("⚠️ API CALL: Call was not successful. Response:", response.data);
            return [];
        }
    } catch (error) {
        console.error("❌ API CALL: Error in getVehicleUserRenewalData:", error);
        errorHandel(error);
        return [];
    }
};

export const addVehicleDetails = async (data, addToast) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.post(`${API_URL}/user/data/vehicle`, data, headers);
    if (response.data && response.data?.status) {
      toast.success('Vehicle details added successfully', {
        duration: 3000,
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      return response.data;
    }
    toast.error('Something went wrong', {
      duration: 3000,
      style: {
        background: '#333',
        color: '#fff',
      },
    });
    return false;
  } catch (error) {
    console.error('Vehicle details add failed:', error);
    errorHandel(error);
    return false;
  }
};

export const getAllVehicles = async () => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.get(`${API_URL}/user/data/vehicle`, headers);
    if (response.data && response.data?.status) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error('Vehicles fetch failed:', error);
    errorHandel(error);
    return [];
  }
};

// Policy related API handlers
export const addPolicyplanDetails = async (data) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  const res = await axios.post(`${API_URL}/user/add/policyplan/details`, data, headers);
  return res.data;
};

export const getAllPolicyPlans = async () => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.get(`${API_URL}/user/data/policyplan`, headers);
    if (response.data && response.data?.status) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error('Policy plans fetch failed:', error);
    errorHandel(error);
    return [];
  }
};

export const getAllReferences = async () => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  const res = await axios.get(`${API_URL}/user/get/reference/list`, headers);
  return res.data;
};

export const addReference = async (data) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  const res = await axios.post(`${API_URL}/user/add/reference/details`, data, headers);
  return res.data;
};

export const updateVehicleRenewalData = async (data) => {
    try {
        const res = await axios.post(`${API_URL}/user/vehicle/user/renewal/update`, data, {
            headers: {
                'token': Cookies.get('token'),
            }
        });
        console.log("API CALL: Received response:", res);

        if (res.data && res.data.success) {
            console.log("API CALL: Success. Returning data:", res.data);
            return res.data;
        } else {
            console.warn("API CALL: Call was not successful. Response:", res.data);
            return [];
        }
    } catch (error) {
        console.error('API CALL: Error in updateVehicleRenewalData:', error);
        console.log("error", error);
        return error;
    }
};

export const getAllPolicyTypes = async () => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  const response = await axios.get(`${API_URL}/user/data/policytype`, headers);
  return response.data;
};

// Auth/session helpers now live in ./authStorage; re-export for compatibility
// with existing imports from this module.
export { getToken, logout, manualLogout };
export { login };

export const getVehicleUserById = async (vehicleUserId) => {
  console.log('🔍 [API] getVehicleUserById called with vehicleUserId:', vehicleUserId);
  console.log('🔍 [API] API_URL:', API_URL);
  console.log('🔍 [API] Full URL:', `${API_URL}/user/vehicle/user/${vehicleUserId}`);
  
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  
  console.log('🔍 [API] Headers:', headers);
  console.log('🔍 [API] Token:', Cookies.get('token'));
  
  try {
    console.log('🔍 [API] Making axios request...');
    const response = await axios.get(`${API_URL}/user/vehicle/user/${vehicleUserId}`, headers);
    
    console.log('🔍 [API] Response received:', response);
    console.log('🔍 [API] Response status:', response.status);
    console.log('🔍 [API] Response data:', response.data);
    
    if (response.data && response.data.status) {
      console.log('🔍 [API] Returning data:', response.data.data);
      return response.data.data;
    }
    
    console.log('🔍 [API] No valid data in response, returning null');
    return null;
  } catch (error) {
    console.error('🔍 [API] Failed to fetch vehicle user by ID:', error);
    console.error('🔍 [API] Error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    return null;
  }
};

export const addPublicInquiry = async (data, addToast) => {
  try {
    const response = await axios.post(`${API_URL}/public/inquiry`, data);
    if (!response.data) {
      toast.error('Something went wrong', {
        duration: 3000,
        style: { background: '#333', color: '#fff' },
      });
      throw new Error('Invalid credentials');
    } else {
      toast.success('Inquiry submitted successfully', {
        duration: 3000,
        style: { background: '#333', color: '#fff' },
      });
      return response.data;
    }
  } catch (error) {
    console.error('failed:', error);
    errorHandel(error)
    return false;
  }
};

// ==================== LIFE INSURANCE API FUNCTIONS ====================

// Create Life Insurance Policy
export const createLifeInsurance = async (data, addToast) => {
  // Debug: Log the data being sent
  console.log('Data being sent to API:', data);
  
  // Check if there are any file fields in the data
  const hasFiles = data.policy_document || data.identity_document || data.address_proof || data.medical_certificate || (data.other_documents && data.other_documents.length > 0);
  
  let requestData;
  let headers;
  
  if (hasFiles) {
    // Convert data to FormData to handle file uploads
    const formData = new FormData();
    headers = {
      headers: {
        'token': Cookies.get('token'),
        'Content-Type': 'multipart/form-data',
      }
    };
    
    // Add all form fields
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        if (key === 'proposer_mobile_numbers' || key === 'life_assured_mobile_numbers' || key === 'nominee_mobile_numbers') {
          // Handle arrays
          if (Array.isArray(data[key])) {
            data[key].forEach((item, index) => {
              formData.append(`${key}[${index}]`, item);
            });
          }
        } else if (key === 'other_documents' && Array.isArray(data[key])) {
          // Handle multiple files
          data[key].forEach((file, index) => {
            formData.append(`${key}`, file);
          });
        } else if (key === 'policy_document' || key === 'identity_document' || key === 'address_proof' || key === 'medical_certificate') {
          // Handle single files
          if (data[key]) {
            formData.append(key, data[key]);
          }
        } else {
          // Handle regular fields
          formData.append(key, data[key]);
        }
      }
    });
    
    requestData = formData;
    
    // Debug: Log FormData contents
    console.log('FormData contents:');
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }
  } else {
    // Send as JSON for regular data
    headers = {
      headers: {
        'token': Cookies.get('token'),
        'Content-Type': 'application/json',
      }
    };
    requestData = data;
    console.log('Sending JSON data:', requestData);
  }
  
  try {
    const response = await axios.post(`${API_URL}/user/life-insurance/create`, requestData, headers);
    if (response.data && response.data?.status) {
      toast.success('Life insurance policy created successfully', {
        duration: 3000,
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      return response.data;
    }
    const errorMessage = response.data?.message || 'Something went wrong';
    toast.error(errorMessage, {
      duration: 3000,
      style: {
        background: '#333',
        color: '#fff',
      },
    });
    return false;
  } catch (error) {
    console.error('Life insurance creation failed:', error);
    errorHandel(error);
    return false;
  }
};

// Get All Life Insurance Policies
export const getAllLifeInsurance = async () => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.get(`${API_URL}/user/life-insurance/list?t=${Date.now()}`, headers);
    if (response.data && response.data?.status) {
      return response.data;
    }
    return { data: [] };
  } catch (error) {
    console.error('Life insurance fetch failed:', error);
    errorHandel(error);
    return { data: [] };
  }
};

// Get Life Insurance Policy by ID
export const getLifeInsuranceById = async (id) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.get(`${API_URL}/user/life-insurance/${id}`, headers);
    if (response.data && response.data?.status) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('Life insurance fetch by ID failed:', error);
    errorHandel(error);
    return null;
  }
};

// Get Life Insurance Documents
export const getLifeInsuranceDocuments = async (lifeInsuranceId) => {
  try {
    const response = await axios.get(`${API_URL}/user/life-insurance/${lifeInsuranceId}/documents`, {
      headers: {
        'token': Cookies.get('token')
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching life insurance documents:', error);
    throw error;
  }
};

// Update Life Insurance Policy
export const updateLifeInsurance = async (id, data, addToast) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.put(`${API_URL}/user/life-insurance/update/${id}`, data, headers);
    if (response.data && response.data?.status) {
      toast.success('Life insurance policy updated successfully', {
        duration: 3000,
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      return response.data;
    }
    const errorMessage = response.data?.message || 'Something went wrong';
    toast.error(errorMessage, {
      duration: 3000,
      style: {
        background: '#333',
        color: '#fff',
      },
    });
    return false;
  } catch (error) {
    console.error('Life insurance update failed:', error);
    errorHandel(error);
    return false;
  }
};

// Delete Life Insurance Policy
export const deleteLifeInsurance = async (id, addToast) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.delete(`${API_URL}/user/life-insurance/delete/${id}`, headers);
    if (response.data && response.data?.status) {
      toast.success('Life insurance policy deleted successfully', {
        duration: 3000,
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      return response.data;
    }
    const errorMessage = response.data?.message || 'Something went wrong';
    toast.error(errorMessage, {
      duration: 3000,
      style: {
        background: '#333',
        color: '#fff',
      },
    });
    return false;
  } catch (error) {
    console.error('Life insurance deletion failed:', error);
    errorHandel(error);
    return false;
  }
};

// Update Life Insurance Status
export const updateLifeInsuranceStatus = async (id, status, addToast) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.put(`${API_URL}/user/life-insurance/status/${id}`, { status }, headers);
    if (response.data && response.data?.status) {
      toast.success('Life insurance status updated successfully', {
        duration: 3000,
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      return response.data;
    }
    const errorMessage = response.data?.message || 'Something went wrong';
    toast.error(errorMessage, {
      duration: 3000,
      style: {
        background: '#333',
        color: '#fff',
      },
    });
    return false;
  } catch (error) {
    console.error('Life insurance status update failed:', error);
    errorHandel(error);
    return false;
  }
};

// Upload Life Insurance Document
export const uploadLifeInsuranceDocument = async (lifeInsuranceId, formData, addToast) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
      'Content-Type': 'multipart/form-data',
    }
  }
  try {
    const response = await axios.post(`${API_URL}/user/life-insurance/${lifeInsuranceId}/documents/upload`, formData, { headers });
    if (response.data && response.data?.status) {
      toast.success('Document uploaded successfully', {
        duration: 3000,
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      return response.data;
    }
    const errorMessage = response.data?.message || 'Something went wrong';
    toast.error(errorMessage, {
      duration: 3000,
      style: {
        background: '#333',
        color: '#fff',
      },
    });
    return false;
  } catch (error) {
    console.error('Document upload failed:', error);
    errorHandel(error);
    return false;
  }
};


// Delete Life Insurance Document
export const deleteLifeInsuranceDocument = async (documentId, addToast) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.delete(`${API_URL}/user/life-insurance/documents/${documentId}`, headers);
    if (response.data && response.data?.status) {
      toast.success('Document deleted successfully', {
        duration: 3000,
        style: {
          background: '#333',
          color: '#fff',
        },
      });
      return response.data;
    }
    const errorMessage = response.data?.message || 'Something went wrong';
    toast.error(errorMessage, {
      duration: 3000,
      style: {
        background: '#333',
        color: '#fff',
      },
    });
    return false;
  } catch (error) {
    console.error('Document deletion failed:', error);
    errorHandel(error);
    return false;
  }
};

// Get Life Insurance by Consumer
export const getLifeInsuranceByConsumer = async (consumerId) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.get(`${API_URL}/user/life-insurance/consumer/${consumerId}`, headers);
    if (response.data && response.data?.status) {
      return response.data;
    }
    return { data: [] };
  } catch (error) {
    console.error('Life insurance by consumer fetch failed:', error);
    errorHandel(error);
    return { data: [] };
  }
};

// Get Life Insurance Renewal Data
export const getLifeInsuranceRenewalData = async (startDate, endDate) => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    const response = await axios.get(`${API_URL}/user/life-insurance/renewal/data`, {
      ...headers,
      params: {
        startDate,
        endDate
      }
    });
    if (response.data && response.data?.status) {
      return response.data;
    }
    return { data: [] };
  } catch (error) {
    console.error('Life insurance renewal data fetch failed:', error);
    errorHandel(error);
    return { data: [] };
  }
};

// Get All Policy Records (Running + Previous)
export const getAllPolicyRecords = async () => {
  try {
    const response = await axios.get(`${API_URL}/user/all-policy-records`, {
      headers: {
        'token': Cookies.get('token')
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching all policy records:', error);
    errorHandel(error);
    return { data: [] };
  }
};

// Get Consumer Dashboard Data (vehicles, mediclaim, loans)
export const getConsumerDashboardData = async () => {
  const headers = {
    headers: {
      'token': Cookies.get('token'),
    }
  }
  try {
    console.log('🔍 [CONSUMER DASHBOARD] Fetching consumer dashboard data...');
    const response = await axios.get(`${API_URL}/user/consumer/dashboard`, headers);

    if (!response.data) {
      throw new Error('Invalid response');
    } else {
      if (response.data && response.data?.status) {
        console.log('🔍 [CONSUMER DASHBOARD] Data received:', response.data);
        return response.data;
      } else {
        return { data: null, status: false };
      }
    }
  } catch (error) {
    console.error('🔍 [CONSUMER DASHBOARD] Error fetching dashboard data:', error);
    errorHandel(error);
    return { data: null, status: false };
  }
};



// ── Household / family members ────────────────────────────────────────────
/** Add a family member (a full user linked to the household head). */
export const addFamilyMember = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/user/data/consumer/family/add`, data, authHeaders());
    return response.data;
  } catch (error) {
    errorHandel(error);
    return { status: false };
  }
};

/** Resolve a household (head + members + their policies) by any member's mobile. */
export const getHousehold = async (mobile) => {
  try {
    const response = await axios.get(`${API_URL}/user/household/${mobile}`, authHeaders());
    return response.data;
  } catch (error) {
    errorHandel(error);
    return { data: null, status: false };
  }
};

// ── Consumer-level documents (KYC stored once, reused) ────────────────────
/** Get a consumer's stored KYC documents (Aadhar/PAN/GST...). */
export const getConsumerDocuments = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/user/consumer/documents/${userId}`, authHeaders());
    return response.data; // { data: [{ categoryId, file, document:{doc_name} }], status }
  } catch (error) {
    errorHandel(error);
    return { data: [], status: false };
  }
};

/** Upload/replace a single consumer KYC document. fields: file, user_id, categoryId. */
export const uploadConsumerDocument = async ({ file, user_id, categoryId }) => {
  try {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('user_id', user_id);
    fd.append('categoryId', categoryId);
    const response = await axios.post(`${API_URL}/user/consumer/documents/upload`, fd, {
      headers: { token: Cookies.get('token') },
    });
    return response.data;
  } catch (error) {
    errorHandel(error);
    return { status: false };
  }
};

/** Get a consumer's stored KYC documents resolved by mobile (policy forms). */
export const getConsumerDocumentsByMobile = async (mobile) => {
  try {
    const response = await axios.get(`${API_URL}/user/consumer/documents/by-mobile/${mobile}`, authHeaders());
    return response.data; // { data:[{categoryId,file,...}], user_id, status }
  } catch (error) {
    errorHandel(error);
    return { data: [], status: false };
  }
};
