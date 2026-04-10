import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000', // Endereço do seu Back-end Node
});

// Isso aqui prepara o terreno para enviarmos o Token automaticamente depois
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@PostoApp:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;