
----

# ⛽ Sistema de Gestão de Posto de Combustível

Este é um projeto Full Stack desenvolvido para gerenciar o fluxo de abastecimento de um posto de combustível. O sistema permite calcular litros com base no valor pago, registrar vendas e gerenciar o estoque de preços de forma dinâmica.

## 🚀 Tecnologias Utilizadas

- **Node.js** & **TypeScript**: Base do servidor e tipagem de dados.
- **Express**: Framework para construção da API.
- **Prisma ORM**: Manipulação do banco de dados com segurança.
- **PostgreSQL**: Banco de dados relacional.
- **Docker**: Containerização do banco de dados para fácil ambiente de desenvolvimento.

## 🛠️ Como rodar o projeto localmente

### Pré-requisitos
- Docker instalado.
- Node.js instalado (v18 ou superior).

### Passo a passo
1. Clone o repositório:
   ```bash
   git clone https://github.com/PedroFIAP-tech/projeto-posto-combustivel.git
````

2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Suba o banco de dados com Docker:
    ```bash
    docker compose up -d
    ```
4.  Configure as tabelas (Migrations):
    ```bash
    npx prisma migrate dev
    ```
5.  Popule o banco com dados iniciais (Seed):
    ```bash
    npx prisma db seed
    ```
6.  Inicie o servidor:
    ```bash
    npm run dev
    ```

## 🔌 Rotas da API (Endpoints)

  - `GET /combustiveis`: Retorna a lista de combustíveis e preços atuais.
  - `POST /simular`: Recebe `fuel_id` e `value` para calcular a litragem.
  - `POST /abastecer`: Registra uma venda no banco de dados.

-----

Desenvolvido por **Seu Nome** - [Seu LinkedIn](https://www.google.com/search?q=https://linkedin.com/in/seu-perfil)

````

---

### Passo 3: Salvar e subir para o GitHub
Depois de salvar o arquivo, rode estes comandos no terminal para atualizar o seu GitHub:

```bash
git add README.md
git commit -m "docs: adiciona readme profissional"
git push
````

-----

### Por que isso é importante?

Um README bem estruturado mostra que você domina o **ciclo de vida do software** (instalação, configuração, execução e documentação de rotas).

**Dica Extra:** Se você quiser ser muito "pro", tire um print do seu **Beekeeper** mostrando as tabelas ou do **Thunder Client** mostrando o cálculo funcionando, e anexe no README depois. Isso prova que o sistema realmente roda\!

**Agora que a vitrine está pronta, como está o seu Kanban?** Mova o card de "Documentação" para **Done** e vamos escolher o próximo desafio técnico\! O que manda a sua lista?