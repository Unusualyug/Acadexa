import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 30000,
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url || '';
    const isSessionProbe = url.includes('/auth/me');
    if (error.response?.status === 401 && !isSessionProbe && !window.location.pathname.startsWith('/login')) {
      window.dispatchEvent(new CustomEvent('sd:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export const apiMessage = (error, fallback = 'Something went wrong. Please try again.') =>
  error?.response?.data?.message || fallback;

export const apiDetails = (error) => error?.response?.data?.details || [];
