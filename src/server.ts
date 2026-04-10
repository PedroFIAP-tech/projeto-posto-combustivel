import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import cors from 'cors';

const app = express();

// Configuração Prisma 7
const connectionString = "postgresql://admin:posto123@localhost:5432/posto_combustivel?schema=public";
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Middlewares (Sempre no topo!)
app.use(cors()); 
app.use(express.json());

const PORT = 3000;
const SECRET = 'SuaChaveSecretaSuperSegura';

// --- MIDDLEWARE DE SEGURANÇA ---
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Token não fornecido" });

  const [, token] = authHeader.split(' ');
  try {
    const decoded = jwt.verify(token, SECRET);
    (req as any).userId = (decoded as any).userId;
    return next(); 
  } catch (err) {
    return res.status(401).json({ error: "Token inválido" });
  }
};

// --- ROTAS DE MONITORAMENTO (PARA O REACT) ---

// 1. Busca pedidos que a bomba enviou mas não foram pagos
app.get('/pedidos/pendentes', async (req, res) => {
  try {
    const pending = await prisma.order.findMany({
      where: { status: "PENDENTE" },
      include: { fuel: true } // Traz os dados do combustível junto
    });
    res.json(pending);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar pendentes" });
  }
});

// 2. Muda o status para PAGO (Libera a bomba no React)
app.patch('/pedidos/:id/pagar', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.order.update({
      where: { id: Number(id) },
      data: { status: "PAGO" }
    });
    res.json({ message: "Pagamento confirmado" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao processar pagamento" });
  }
});

// --- ROTAS EXISTENTES ---

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.password_hash !== password) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '1d' });
    res.json({ token, user: { name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: "Erro no login" });
  }
});

app.post('/bomba/abastecer', async (req, res) => {
  const { bomba_id, fuel_id, value, liters } = req.body;
  try {
    const newOrder = await prisma.order.create({
      data: {
        total_value: Number(value),
        liters_delivered: Number(liters),
        fuel_id: Number(fuel_id),
        user_id: 1, 
        status: "PENDENTE" 
      }
    });
    console.log(`[BOMBA ${bomba_id}] Novo abastecimento pendente.`);
    res.json(newOrder);
  } catch (error) {
    res.status(500).json({ error: "Erro na bomba" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Monitor de Pista rodando em http://localhost:${PORT}`);
});