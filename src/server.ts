import cors from 'cors';
import express from 'express';
import { PORT } from './config';
import { handleLogin } from './controllers/authController';
import { handleListFuels } from './controllers/fuelController';
import {
  handleCreateOrder,
  handleGetOrderHistory,
  handleGetPendingOrders,
  handlePayOrder,
} from './controllers/orderController';
import { prisma } from './lib/prisma';
import { authMiddleware } from './middlewares/authMiddleware';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  return res.json({ ok: true });
});

app.post('/login', handleLogin);
app.get('/combustiveis', authMiddleware, handleListFuels);
app.post('/bomba/abastecer', authMiddleware, handleCreateOrder);
app.get('/pedidos/pendentes', authMiddleware, handleGetPendingOrders);
app.get('/pedidos/historico', authMiddleware, handleGetOrderHistory);
app.patch('/pedidos/:id/pagar', authMiddleware, handlePayOrder);

app.use((_req, res) => {
  return res.status(404).json({ error: 'Rota nao encontrada.' });
});

const server = app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

const shutdown = async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
};

process.on('SIGINT', () => {
  void shutdown();
});

process.on('SIGTERM', () => {
  void shutdown();
});
