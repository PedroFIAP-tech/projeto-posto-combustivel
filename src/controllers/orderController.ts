import { Request, Response } from 'express';
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

export const handleCreateOrder = async (req: Request, res: Response) => {
  const fuelId = toPositiveNumber(req.body.fuelId);
  const litersDelivered = toPositiveNumber(req.body.liters);

  if (!req.userId) {
    return res.status(401).json({ error: 'Usuario nao autenticado.' });
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
  const where =
    req.userRole === 'admin'
      ? {
          status: pendingStatus,
        }
      : {
          status: pendingStatus,
          user_id: req.userId,
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
  const statusQuery =
    typeof req.query.status === 'string' ? req.query.status.trim().toUpperCase() : undefined;

  if (statusQuery && statusQuery !== pendingStatus && statusQuery !== paidStatus) {
    return res.status(400).json({ error: 'Status invalido. Use PENDENTE ou PAGO.' });
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        ...(req.userRole === 'admin' ? {} : { user_id: req.userId }),
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
