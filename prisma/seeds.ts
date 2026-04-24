import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Iniciando sincronizacao de dados base...');

  const hash = await bcrypt.hash('123456', 10);

  const users = [
    {
      email: 'admin@posto.com',
      name: 'Administrador',
      role: 'admin',
    },
    {
      email: 'frentista@posto.com',
      name: 'Frentista',
      role: 'frentista',
    },
  ];

  await Promise.all(
    users.map((user) =>
      prisma.user.upsert({
        where: { email: user.email },
        update: {
          name: user.name,
          password_hash: hash,
          role: user.role,
        },
        create: {
          email: user.email,
          name: user.name,
          password_hash: hash,
          role: user.role,
        },
      })
    )
  );

  const fuels = [
    { name: 'Gasolina Comum', price: 5.89 },
    { name: 'Gasolina Aditivada', price: 6.09 },
    { name: 'Etanol', price: 3.99 },
    { name: 'Diesel S10', price: 5.95 },
  ];

  await Promise.all(
    fuels.map(async (fuel) => {
      const existing = await prisma.fuel.findFirst({ where: { name: fuel.name } });

      if (existing) {
        return prisma.fuel.update({
          where: { id: existing.id },
          data: { price_per_liter: fuel.price },
        });
      }

      return prisma.fuel.create({
        data: { name: fuel.name, price_per_liter: fuel.price },
      });
    })
  );

  console.log('Base de dados atualizada com admin, frentista e combustiveis.');
}

main()
  .catch((error) => {
    console.error('Erro no seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
