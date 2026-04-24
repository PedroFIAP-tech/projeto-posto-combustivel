import api from './api';
import { Order } from '../types';

export const getPendentes = async () => {
  const response = await api.get<Order[]>('/pedidos/pendentes');
  return response.data;
};

export const getHistorico = async () => {
  const response = await api.get<Order[]>('/pedidos/historico');
  return response.data;
};

export const pagarPedido = async (id: number) => {
  await api.patch(`/pedidos/${id}/pagar`);
};
