import { Request, Response } from 'express';
import { loginService } from '../services/authService';

export const handleLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Informe email e senha validos.' });
  }

  try {
    const data = await loginService(email, password);
    return res.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao autenticar.';
    return res.status(401).json({ error: message });
  }
};
