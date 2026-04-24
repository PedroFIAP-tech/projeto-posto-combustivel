export const ROLES = {
  ADMIN: 'admin',
  FRENTISTA: 'frentista',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const isAdmin = (role: string | undefined) => role === ROLES.ADMIN;

export const isFrentista = (role: string | undefined) => role === ROLES.FRENTISTA;

export const isOperationalRole = (role: string | undefined) => isAdmin(role) || isFrentista(role);
