export type Fuel = {
  id: number;
  name: string;
  price_per_liter: number;
  updated_at?: string;
};

export type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export type OrderMode = 'AUTOMATICO' | 'MANUAL';

export type Order = {
  id: number;
  pump_number: number;
  nozzle_number: number;
  mode: OrderMode;
  total_value: number;
  liters_delivered: number;
  status: string;
  created_at: string;
  fuel: Fuel;
  user: User;
};

export type LoginResponse = {
  token: string;
  user: User;
};

export type PumpOrder = Order & {
  pumpNumber: string;
  nozzleNumber: string;
};
