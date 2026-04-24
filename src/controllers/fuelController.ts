import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const toPositiveNumber = (value: unknown) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

export const handleListFuels = async (_req: Request, res: Response) => {
  try {
    const fuels = await prisma.fuel.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return res.json(fuels);
  } catch (error) {
    console.error('Erro ao buscar combustiveis:', error);
    return res.status(500).json({ error: 'Nao foi possivel buscar os combustiveis.' });
  }
};

export const handleUpdateFuelPrice = async (req: Request, res: Response) => {
  const fuelId = toPositiveNumber(req.params.id);
  const pricePerLiter = toPositiveNumber(req.body.price_per_liter ?? req.body.price);

  if (!fuelId || !pricePerLiter) {
    return res.status(400).json({
      error: 'Informe um combustivel e um preco por litro validos.',
    });
  }

  try {
    const existingFuel = await prisma.fuel.findUnique({
      where: {
        id: fuelId,
      },
    });

    if (!existingFuel) {
      return res.status(404).json({ error: 'Combustivel nao encontrado.' });
    }

    const updatedFuel = await prisma.fuel.update({
      where: {
        id: fuelId,
      },
      data: {
        price_per_liter: pricePerLiter,
      },
    });

    return res.json(updatedFuel);
  } catch (error) {
    console.error('Erro ao atualizar preco do combustivel:', error);
    return res.status(500).json({ error: 'Nao foi possivel atualizar o preco.' });
  }
};

export const fuelController = {
  list: handleListFuels,
  updatePrice: handleUpdateFuelPrice,
};
