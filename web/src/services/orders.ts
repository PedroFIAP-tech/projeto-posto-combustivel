import api from './api';
import { Fuel, Order, OrderMode } from '../types';

export type CreateOrderPayload = {
  pump_number: number;
  nozzle_number: number;
  fuel_id: number;
  liters: number;
  mode: OrderMode;
};

export const getPendentes = async () => {
  const response = await api.get<Order[]>('/pedidos/pendentes');
  return response.data;
};

export const getHistorico = async () => {
  const response = await api.get<Order[]>('/pedidos/historico');
  return response.data;
};

export const getCombustiveis = async () => {
  const response = await api.get<Fuel[]>('/combustiveis');
  return response.data;
};

export const criarAbastecimento = async (payload: CreateOrderPayload) => {
  const response = await api.post<Order>('/bomba/abastecer', payload);
  return response.data;
};

export const pagarPedido = async (id: number) => {
  const response = await api.patch<Order>(`/pedidos/${id}/pagar`);
  return response.data;
};
