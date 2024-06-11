import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL='http://localhost:8087'

const login = async (mobileNumber) => {
  try {
    const response = await axios.post(`${API_URL}/user/login`, { mobileNumber });

    if (!response.data) {
      throw new Error('Invalid credentials');
    }

    const token = response.data.token;
    setToken(token);
    setUser(response.data.user);
    return true; // Login successful
  } catch (error) {
    console.error('Login failed:', error);
    return false; // Login failed
  }
};

const setToken = (token) => {
  // Set token in cookies
  Cookies.set('token', token, { expires: 7 }); // token expires in 7 days
};

const setUser = (user) => {
    // Set token in cookies
    Cookies.set('user', JSON.stringify(user), { expires: 7 }); // token expires in 7 days
  };

const getToken = () => {
  // Get token from cookies
  return Cookies.get('token');
};

const logout = () => {
  // Clear token from cookies
  Cookies.remove('token');
  Cookies.remove('user');
};

export { login, getToken, logout };
