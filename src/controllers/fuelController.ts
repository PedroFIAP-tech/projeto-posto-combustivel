import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const handleListFuels = async (_req: Request, res: Response) => {
  try {
    const fuels = await prisma.fuel.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return res.json(fuels);
  } catch (error) {
    console.error('Erro ao listar combustiveis:', error);
    return res.status(500).json({ error: 'Nao foi possivel listar os combustiveis.' });
  }
};
