import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://admin:posto123@localhost:5432/posto_combustivel?schema=public'

const adapter = new PrismaPg(databaseUrl)
const prisma = new PrismaClient({ adapter })

async function main() {
  const fuels = [
    { name: 'Gasolina Comum', price_per_liter: 5.89 },
    { name: 'Gasolina Aditivada', price_per_liter: 6.05 },
    { name: 'Etanol', price_per_liter: 3.99 },
    { name: 'Diesel S10', price_per_liter: 6.12 },
  ]

  for (const fuel of fuels) {
    const existingFuel = await prisma.fuel.findFirst({
      where: {
        name: fuel.name,
      },
    })

    if (existingFuel) {
      await prisma.fuel.update({
        where: {
          id: existingFuel.id,
        },
        data: {
          price_per_liter: fuel.price_per_liter,
        },
      })
      continue
    }

    await prisma.fuel.create({
      data: fuel,
    })
  }

  const passwordHash = await bcrypt.hash('123456', 10)

  await prisma.user.upsert({
    where: {
      email: 'admin@posto.com',
    },
    update: {
      name: 'Admin do Posto',
      password_hash: passwordHash,
      role: 'admin',
    },
    create: {
      name: 'Admin do Posto',
      email: 'admin@posto.com',
      password_hash: passwordHash,
      role: 'admin',
    },
  })

  console.log('Banco de dados semeado com sucesso!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async error => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
