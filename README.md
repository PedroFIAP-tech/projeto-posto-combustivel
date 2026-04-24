
-----

# ⛽ Sistema de Gestão de Posto de Combustível (Full Stack)

Este projeto é um sistema de automação e monitoramento de pista para postos de combustível. Ele simula o recebimento de dados das bombas em tempo real, permitindo que o frentista gerencie abastecimentos, realize cobranças e monitore o status de cada bico de combustível.

## 📂 Estrutura do Projeto

O repositório está dividido em duas partes principais:

  - **Raiz (`/`)**: Servidor Back-end (Node.js + Prisma + PostgreSQL).
  - **`/web`**: Interface Front-end (React.js + TypeScript).

-----

## 🛠️ Como rodar o Back-end (Servidor)

### 1\. Instale as dependências

Na pasta raiz do projeto, execute:

```bash
npm install
```

### 2\. Suba o Banco de Dados (Docker)

Certifique-se de que o Docker Desktop está aberto e rode:

```bash
docker compose up -d
```

### 3\. Configure o Prisma e o Banco

Execute as migrações para criar as tabelas e popule os dados iniciais (usuários e combustíveis):

```bash
npx prisma migrate dev
npx prisma db seed
```

### 4\. Inicie o Servidor

```bash
npm run dev
```

O servidor rodará em `http://localhost:3000`.

-----

## 💻 Como rodar o Front-end (Web)

### 1\. Acesse a pasta web

```bash
cd web
```

### 2\. Instale as dependências

```bash
npm install
```

### 3\. Inicie a aplicação

```bash
npm start
```

O Dashboard abrirá em `http://localhost:3001`.

-----

## 🔌 Principais Endpoints da API

| Rota | Método | Descrição |
| :--- | :--- | :--- |
| `/login` | `POST` | Autentica usuário e retorna Token JWT. |
| `/combustiveis` | `GET` | Lista todos os combustíveis e preços. |
| `/bomba/abastecer` | `POST` | **Simula a Bomba:** Envia dados de abastecimento para o monitor. |
| `/pedidos/pendentes` | `GET` | Busca abastecimentos aguardando pagamento. |
| `/pedidos/:id/pagar` | `PATCH` | Finaliza a venda e libera a bomba. |

-----

## 👤 Usuários de Teste

| Perfil | E-mail | Senha | Permissões |
| :--- | :--- | :--- | :--- |
| Admin | `admin@posto.com` | `123456` | Visualiza todos os pedidos e altera preços dos combustíveis. |
| Frentista | `frentista@posto.com` | `123456` | Registra abastecimentos, vê seus próprios pedidos e finaliza pagamentos próprios. |

-----

## ✅ Funcionalidades Implementadas (Status)

  - [x] **Task \#1**: Configuração de ambiente e Docker.
  - [x] **Task \#2**: Modelagem de Banco de Dados (Prisma).
  - [x] **Task \#3**: Sistema de Autenticação JWT.
  - [x] **Task \#4**: Simulação de recebimento de dados da Bomba.
  - [x] **Task \#5**: Dashboard de Monitoramento de Pista (Real-time Polling).
  - [x] **Task \#6**: Histórico de Vendas no painel e na API.
  - [ ] **Task \#7**: Relatórios gerenciais com filtros e exportação.

-----

## Próxima Task: Relatórios Gerenciais

**Objetivo:** permitir que o gerente consulte vendas por período, combustível e status, com resumo de faturamento e volume vendido.

**Critérios de aceite:**

  - Criar filtros por data inicial, data final, combustível e status.
  - Exibir totais de vendas, litros vendidos e ticket médio.
  - Permitir exportar o relatório em CSV.
  - Proteger a rota para uso de usuários `admin`.

-----

Desenvolvido por **Pedro Silva** - [LinkedIn](https://www.google.com/search?q=https://linkedin.com/in/seu-perfil)

-----
