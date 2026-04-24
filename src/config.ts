import 'dotenv/config';

const DEFAULT_DATABASE_URL =
  'postgresql://admin:posto123@localhost:5432/posto_combustivel?schema=public';

const parsedPort = Number(process.env.PORT ?? 3000);

export const DATABASE_URL = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
export const JWT_SECRET = process.env.JWT_SECRET ?? 'posto-dev-secret';
export const PORT = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 3000;
