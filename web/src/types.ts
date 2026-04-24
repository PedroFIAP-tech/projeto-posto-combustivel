export type Fuel = {
  id: number;
  name: string;
  price_per_liter: number;
};

export type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export type Order = {
  id: number;
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
};
