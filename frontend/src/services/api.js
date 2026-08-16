import axios from 'axios';
import { API_BASE } from '../utils/constants';
import { TOKEN_KEY } from '../context/AuthContext';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.message || err.message || 'Something went wrong';
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/login')) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('skillswap_user');
    }
    return Promise.reject(new Error(message));
  }
);

export const unwrap = async (promise) => {
  const res = await promise;
  return res.data;
};

export default api;
