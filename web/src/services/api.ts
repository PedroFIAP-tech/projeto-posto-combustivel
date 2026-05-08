import axios from 'axios';

const TOKEN_KEY = '@PostoApp:token';
const LOCAL_API_URL = 'http://localhost:8080';
const RENDER_API_URL = 'https://projeto-posto-combustivel.onrender.com';
const API_BASE_URL =
  process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development' ? LOCAL_API_URL : RENDER_API_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
