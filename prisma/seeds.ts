import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://admin:posto123@localhost:5432/posto_combustivel?schema=public'

const adapter = new PrismaPg({ connectionString: databaseUrl })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Cria os combustiveis iniciais da aplicacao.
  await prisma.fuel.createMany({
    data: [
      { name: 'Gasolina Comum', price_per_liter: 5.89 },
      { name: 'Gasolina Aditivada', price_per_liter: 6.05 },
      { name: 'Etanol', price_per_liter: 3.99 },
      { name: 'Diesel S10', price_per_liter: 6.12 },
    ],
    skipDuplicates: true,
  })

  // Cria um usuario admin inicial para facilitar os testes.
  await prisma.user.upsert({
    where: {
      email: 'admin@posto.com',
    },
    update: {
      name: 'Admin do Posto',
      password_hash: '123456',
      role: 'admin',
    },
    create: {
      name: 'Admin do Posto',
      email: 'admin@posto.com',
      password_hash: '123456',
      role: 'admin',
    },
  })

  console.log('Banco de dados semeado com sucesso!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
