import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';
import { prisma } from '../lib/prisma';

export const loginService = async (email: string, passwordRaw: string) => {
  if (!email.trim() || !passwordRaw.trim()) {
    throw new Error('Email e senha sao obrigatorios.');
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new Error('Credenciais invalidas.');
  }

  const passwordMatch = await bcrypt.compare(passwordRaw, user.password_hash);

  if (!passwordMatch) {
    throw new Error('Credenciais invalidas.');
  }

  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: '1d',
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};
