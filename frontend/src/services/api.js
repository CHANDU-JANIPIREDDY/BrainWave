import axios from 'axios';
import { TOKEN_KEY, markSessionExpired } from '../utils/session.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export function authHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function attachAuthHeader(config) {
  const stored = localStorage.getItem(TOKEN_KEY);
  if (!stored) return config;

  const value = `Bearer ${stored}`;
  if (config.headers && typeof config.headers.set === 'function') {
    if (!config.headers.get('Authorization')) {
      config.headers.set('Authorization', value);
    }
    return config;
  }

  config.headers = config.headers || {};
  if (!config.headers.Authorization) {
    config.headers.Authorization = value;
  }
  return config;
}

api.interceptors.request.use((config) => attachAuthHeader(config));

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = String(error?.config?.url || '');
    const status = error?.response?.status;
    const message = String(error?.response?.data?.message || '');
    const isLogin = url.includes('/api/auth/login');
    const sessionEnded = status === 401 && /session expired/i.test(message);
    const authProbeFailed = status === 401 && url.includes('/api/auth/me');

    if (!isLogin && (sessionEnded || authProbeFailed)) {
      markSessionExpired();
      window.dispatchEvent(new CustomEvent('brainwave:unauthorized'));
    }
    return Promise.reject(error);
  },
);
