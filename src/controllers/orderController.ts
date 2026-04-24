import { Request, Response } from 'express';
import { isAdmin, isOperationalRole } from '../constants/roles';
import { prisma } from '../lib/prisma';

const orderDetails = {
  fuel: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
} as const;

const pendingStatus = 'PENDENTE';
const paidStatus = 'PAGO';

const toPositiveNumber = (value: unknown) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
};

export const handleCreateOrder = async (req: Request, res: Response) => {
  const fuelId = toPositiveNumber(req.body.fuelId ?? req.body.fuel_id);
  const litersDelivered = toPositiveNumber(req.body.liters ?? req.body.liters_delivered);

  if (!req.userId) {
    return res.status(401).json({ error: 'Usuario nao autenticado.' });
  }

  if (!isOperationalRole(req.userRole)) {
    return res.status(403).json({ error: 'Acesso negado para registrar abastecimento.' });
  }

  if (!fuelId || !litersDelivered) {
    return res.status(400).json({
      error: 'Informe um combustivel valido e a quantidade de litros maior que zero.',
    });
  }

  try {
    const fuel = await prisma.fuel.findUnique({
      where: {
        id: fuelId,
      },
    });

    if (!fuel) {
      return res.status(404).json({ error: 'Combustivel nao encontrado.' });
    }

    const totalValue = Number((fuel.price_per_liter * litersDelivered).toFixed(2));

    const order = await prisma.order.create({
      data: {
        fuel_id: fuel.id,
        user_id: req.userId,
        liters_delivered: litersDelivered,
        total_value: totalValue,
        status: pendingStatus,
      },
      include: orderDetails,
    });

    return res.status(201).json(order);
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    return res.status(500).json({ error: 'Nao foi possivel registrar o abastecimento.' });
  }
};

export const handleGetPendingOrders = async (req: Request, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Usuario nao autenticado.' });
  }

  const where = {
    status: pendingStatus,
    ...(isOperationalRole(req.userRole) ? {} : { user_id: req.userId }),
  };

  try {
    const orders = await prisma.order.findMany({
      where,
      include: orderDetails,
      orderBy: {
        created_at: 'desc',
      },
    });

    return res.json(orders);
  } catch (error) {
    console.error('Erro ao buscar pedidos pendentes:', error);
    return res.status(500).json({ error: 'Nao foi possivel buscar os pedidos pendentes.' });
  }
};

export const handleGetOrderHistory = async (req: Request, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Usuario nao autenticado.' });
  }

  const statusQuery =
    typeof req.query.status === 'string' ? req.query.status.trim().toUpperCase() : undefined;

  if (statusQuery && statusQuery !== pendingStatus && statusQuery !== paidStatus) {
    return res.status(400).json({ error: 'Status invalido. Use PENDENTE ou PAGO.' });
  }

  const todayRange = getTodayRange();

  try {
    const orders = await prisma.order.findMany({
      where: {
        ...(isOperationalRole(req.userRole) ? {} : { user_id: req.userId }),
        ...(isAdmin(req.userRole)
          ? {}
          : {
              created_at: {
                gte: todayRange.start,
                lt: todayRange.end,
              },
            }),
        ...(statusQuery ? { status: statusQuery } : {}),
      },
      include: orderDetails,
      orderBy: {
        created_at: 'desc',
      },
    });

    return res.json(orders);
  } catch (error) {
    console.error('Erro ao buscar historico:', error);
    return res.status(500).json({ error: 'Nao foi possivel buscar o historico.' });
  }
};

export const handlePayOrder = async (req: Request, res: Response) => {
  const orderId = toPositiveNumber(req.params.id);

  if (!req.userId) {
    return res.status(401).json({ error: 'Usuario nao autenticado.' });
  }

  if (!orderId) {
    return res.status(400).json({ error: 'Informe um identificador de pedido valido.' });
  }

  try {
    const existingOrder = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: orderDetails,
    });

    if (!existingOrder) {
      return res.status(404).json({ error: 'Pedido nao encontrado.' });
    }

    const canPay = isOperationalRole(req.userRole) || existingOrder.user_id === req.userId;

    if (!canPay) {
      return res.status(403).json({ error: 'Voce nao tem permissao para pagar este pedido.' });
    }

    if (existingOrder.status === paidStatus) {
      return res.status(409).json({ error: 'Este pedido ja foi pago.' });
    }

    const order = await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: paidStatus,
      },
      include: orderDetails,
    });

    return res.json(order);
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    return res.status(500).json({ error: 'Nao foi possivel atualizar o pedido.' });
  }
};

export const orderController = {
  create: handleCreateOrder,
  listPending: handleGetPendingOrders,
  listHistory: handleGetOrderHistory,
  listMyOrders: handleGetOrderHistory,
  pay: handlePayOrder,
};
