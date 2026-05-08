import axios from 'axios';

const LOCAL_API_URL = 'http://localhost:8080';
const RENDER_API_URL = 'https://projeto-posto-combustivel.onrender.com';
const API_BASE_URL =
  process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development' ? LOCAL_API_URL : RENDER_API_URL);

let authToken = '';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(config => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  return config;
});

export const setAuthToken = (token: string) => {
  authToken = token;
};

export const clearAuthToken = () => {
  authToken = '';
};

export default api;
