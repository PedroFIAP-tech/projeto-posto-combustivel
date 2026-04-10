import express from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const app = express();

// Configuração necessária para o Prisma 7
const connectionString = "postgresql://admin:posto123@localhost:5432/posto_combustivel?schema=public";
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter }); // Agora ele não está mais vazio!

app.use(express.json());


const PORT = 3000;

// Rota para buscar todos os combustíveis do banco
app.get('/combustiveis', async (req, res) => {
  try {
    const fuels = await prisma.fuel.findMany();
    res.json(fuels);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar combustíveis" });
  }
});

// Rota para Simular Abastecimento
app.post('/simular', async (req, res) => {
  const { fuel_id, value } = req.body;

  try {
    // 1. Busca o combustível no banco pelo ID
    const fuel = await prisma.fuel.findUnique({
      where: { id: Number(fuel_id) }
    });

    if (!fuel) {
      return res.status(404).json({ error: "Combustível não encontrado" });
    }

    // 2. Faz o cálculo (Valor / Preço do Litro)
    const liters = value / fuel.price_per_liter;

    // 3. Retorna o resultado formatado
    res.json({
      combustivel: fuel.name,
      preco_litro: fuel.price_per_liter,
      valor_pago: value,
      litros_calculados: liters.toFixed(3) // 3 casas decimais como no posto!
    });

  } catch (error) {
    res.status(500).json({ error: "Erro ao processar simulação" });
  }
});

// Rota para Realizar o Abastecimento e SALVAR no banco
app.post('/abastecer', async (req, res) => {
  const { user_id, fuel_id, value } = req.body;

  try {
    // 1. Busca o combustível para saber o preço
    const fuel = await prisma.fuel.findUnique({
      where: { id: Number(fuel_id) }
    });

    if (!fuel) return res.status(404).json({ error: "Combustível inválido" });

    // 2. Calcula os litros
    const liters = value / fuel.price_per_liter;

    // 3. SALVA no banco de dados
    const newOrder = await prisma.order.create({
      data: {
        total_value: value,
        liters_delivered: liters,
        user_id: Number(user_id),
        fuel_id: Number(fuel_id)
      }
    });

    res.json({
      message: "Abastecimento registrado com sucesso!",
      pedido: newOrder
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao registrar abastecimento" });
  }
});

// Mensagem de início do servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});