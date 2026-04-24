import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';

interface TokenPayload {
  userId: number;
  role: string;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token nao fornecido.' });
  }

  const [, token] = authHeader.split(' ');

  if (!token) {
    return res.status(401).json({ error: 'Formato de token invalido.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

    req.userId = decoded.userId;
    req.userRole = decoded.role;

    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalido ou expirado.' });
  }
};
