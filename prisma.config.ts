import { defineConfig } from '@prisma/config';

export default defineConfig({
  migrations: {
    seed: 'node -r ts-node/register prisma/seeds.ts',
  },
  datasource: {
    // Usamos uma string pura aqui apenas para destravar o migrate agora
    url: "postgresql://admin:posto123@localhost:5432/posto_combustivel?schema=public",
  },
});
