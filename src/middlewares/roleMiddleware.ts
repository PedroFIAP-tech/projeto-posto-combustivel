import { NextFunction, Request, Response } from 'express';
import { Role } from '../constants/roles';

export const authorize = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.userRole;

    if (!userRole || !allowedRoles.includes(userRole as Role)) {
      return res.status(403).json({
        error: 'Acesso negado. Voce nao tem permissao para realizar esta acao.',
      });
    }

    return next();
  };
};
