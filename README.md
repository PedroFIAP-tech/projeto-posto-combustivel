# Sistema de Gestao de Posto de Combustivel

Este projeto e um sistema full stack para controlar a rotina de um posto de combustivel. Ele permite fazer login, acompanhar abastecimentos, listar pedidos pendentes, finalizar pagamentos e consultar historico.

A parte mais importante do projeto e o backend em Java com Spring Boot. O frontend em React funciona como a tela do usuario: ele mostra as informacoes, envia comandos e consome os dados que o Java entrega pela API.

## Visao geral

Imagine o sistema como uma conversa entre tres partes:

| Parte | O que faz |
| :--- | :--- |
| Frontend React | E a tela que o frentista ou administrador usa. Mostra login, bombas, pedidos e botoes de acao. |
| Backend Java | E o cerebro do sistema. Recebe pedidos do front, valida regras, calcula valores, protege rotas e grava dados. |
| PostgreSQL | E o banco de dados. Guarda usuarios, combustiveis, precos e abastecimentos. |

Fluxo simples:

```txt
Usuario usa a tela
        |
        v
Frontend React chama a API
        |
        v
Backend Java valida e processa
        |
        v
PostgreSQL salva ou busca os dados
        |
        v
Backend Java responde para o frontend
        |
        v
Tela atualiza para o usuario
```

## Tecnologias usadas

| Tecnologia | Onde aparece | Para que serve |
| :--- | :--- | :--- |
| Java 21 | `backend-java/` | Linguagem principal do backend. |
| Spring Boot | `backend-java/` | Framework que sobe a API e organiza controllers, services, seguranca e banco. |
| Spring Web | Backend | Cria os endpoints HTTP, como `/login` e `/pedidos/pendentes`. |
| Spring Security | Backend | Protege rotas e valida o token JWT. |
| Spring Data JPA | Backend | Facilita salvar e buscar dados no PostgreSQL usando repositories. |
| Flyway | Backend | Cria/atualiza as tabelas do banco automaticamente. |
| PostgreSQL | Docker | Banco de dados da aplicacao. |
| React + TypeScript | `web/` | Interface visual usada pelo usuario. |
| Axios | Frontend | Cliente HTTP usado para chamar a API Java. |

## Estrutura do projeto

```txt
PROJETO_vscode/
  backend-java/
    pom.xml
    src/main/java/com/posto/
      PostoApplication.java
      config/
      controller/
      dto/
      entity/
      exception/
      repository/
      security/
      service/
    src/main/resources/
      application.properties
      db/migration/
  web/
    src/
      App.tsx
      pages/
      components/
      services/
      types.ts
  docker-compose.yml
  README.md
```

## O que o Java faz nesta aplicacao

O backend Java e responsavel por toda a regra importante do sistema. Mesmo que o usuario veja apenas a tela, quem decide o que pode ou nao acontecer e o Java.

Ele faz estas tarefas:

- Sobe a API do sistema na porta `3000`.
- Recebe login e devolve um token JWT.
- Protege rotas que precisam de usuario autenticado.
- Busca usuarios no banco.
- Valida senha com BCrypt.
- Lista combustiveis e precos.
- Permite atualizar preco de combustivel.
- Registra abastecimentos.
- Calcula valor total do abastecimento com base em litros e preco por litro.
- Marca pedidos como pendentes ou pagos.
- Lista pedidos pendentes.
- Lista historico de pedidos.
- Aplica regras diferentes para `admin` e `frentista`.
- Cria tabelas do banco com Flyway.
- Insere usuarios e combustiveis iniciais ao iniciar.

Em resumo: o frontend mostra, mas o Java decide, calcula, protege e salva.

## Como o codigo Java esta organizado

### `PostoApplication.java`

Arquivo inicial do backend. Ele contem o `main`, que e o ponto de partida de uma aplicacao Java.

Quando voce roda:

```bash
mvn spring-boot:run
```

o Spring Boot executa essa classe e inicia a API.

### `controller/`

Controllers sao as portas de entrada da API. Eles recebem requisicoes HTTP do frontend.

Exemplos:

| Classe | O que recebe |
| :--- | :--- |
| `AuthController` | Login em `/login`. |
| `FuelController` | Listagem e atualizacao de combustiveis em `/combustiveis`. |
| `OrderController` | Abastecimentos, pendencias, historico e pagamento de pedidos. |
| `HealthController` | Verificacao simples se a API esta online. |

Um controller nao deve concentrar regra pesada. Ele recebe a chamada e passa para um service.

### `service/`

Services guardam as regras de negocio. E aqui que fica a inteligencia principal do sistema.

| Classe | Responsabilidade |
| :--- | :--- |
| `AuthService` | Confere email/senha, valida credenciais e gera token JWT. |
| `FuelService` | Lista combustiveis e altera preco por litro. |
| `OrderService` | Cria pedido, calcula total, lista pendentes, lista historico e finaliza pagamento. |

Exemplo simples: quando uma bomba registra um abastecimento, o `OrderService` busca o combustivel, pega o preco por litro, multiplica pelos litros e salva o pedido como `PENDENTE`.

### `entity/`

Entities representam tabelas do banco dentro do Java.

| Classe | Representa |
| :--- | :--- |
| `User` | Usuario do sistema, como admin ou frentista. |
| `Fuel` | Combustivel, nome e preco por litro. |
| `Order` | Pedido/abastecimento feito no posto. |
| `Role` | Perfil do usuario, como `ADMIN` ou `FRENTISTA`. |
| `OrderStatus` | Status do pedido, como `PENDENTE` ou `PAGO`. |

Para uma pessoa leiga: entity e o "molde" que o Java usa para entender uma tabela do banco.

### `repository/`

Repositories sao as classes que conversam com o banco de dados.

| Classe | O que acessa |
| :--- | :--- |
| `UserRepository` | Usuarios. |
| `FuelRepository` | Combustiveis. |
| `OrderRepository` | Pedidos. |

Eles evitam escrever SQL manual para coisas comuns. O Spring Data JPA entende metodos como buscar por email, buscar por status ou ordenar por data.

### `dto/`

DTOs sao objetos usados para entrada e saida da API.

Eles ajudam o backend a nao expor a entity inteira para o frontend e deixam a resposta mais controlada.

Exemplos:

| DTO | Uso |
| :--- | :--- |
| `LoginRequest` | Dados que chegam no login: email e senha. |
| `LoginResponse` | Resposta do login: token e usuario. |
| `CreateOrderRequest` | Dados para registrar abastecimento. |
| `OrderResponse` | Resposta com dados de um pedido. |
| `FuelResponse` | Resposta com dados de combustivel. |

### `security/`

Essa pasta cuida da autenticacao.

| Classe | Funcao |
| :--- | :--- |
| `JwtService` | Cria e valida tokens JWT. |
| `JwtAuthenticationFilter` | Le o token enviado no header `Authorization`. |
| `AuthenticatedUser` | Representa o usuario autenticado dentro da aplicacao. |
| `SecuritySupport` | Ajuda services a descobrir quem esta logado e qual permissao possui. |

Depois do login, o frontend guarda o token. Nas proximas chamadas, ele envia esse token para provar que o usuario esta autenticado.

### `config/`

Configuracoes da aplicacao.

| Classe | Funcao |
| :--- | :--- |
| `SecurityConfig` | Define rotas publicas, rotas protegidas, CORS, BCrypt e filtro JWT. |
| `DataInitializer` | Cria usuarios e combustiveis iniciais quando a aplicacao sobe. |

Usuarios criados automaticamente:

| Perfil | Email | Senha |
| :--- | :--- | :--- |
| Admin | `admin@posto.com` | `123456` |
| Frentista | `frentista@posto.com` | `123456` |

Combustiveis iniciais:

- Gasolina Comum
- Gasolina Aditivada
- Etanol
- Diesel S10

### `exception/`

Centraliza erros da API.

Quando alguma coisa da errado, como senha invalida, pedido inexistente ou falta de permissao, o backend responde de forma padronizada em vez de quebrar com erro confuso.

### `resources/application.properties`

Arquivo de configuracao do Spring Boot.

Ele define:

- Porta da API.
- URL do banco.
- Usuario e senha do banco.
- Configuracao do Flyway.
- Segredo e tempo de expiracao do JWT.
- Origens permitidas para o frontend acessar a API.

Exemplo importante:

```properties
server.port=${PORT:3000}
spring.datasource.url=${DATABASE_URL:jdbc:postgresql://localhost:5432/posto_combustivel}
```

Isso significa: se nao existir variavel de ambiente, usa os valores padrao.

### `resources/db/migration/`

Aqui ficam as migrations do Flyway.

A migration `V1__init_schema.sql` cria as tabelas:

- `User`
- `Fuel`
- `Order`

Tambem cria indices para melhorar buscas por status, data, usuario e combustivel.

## Principais regras de negocio

### Login

1. Frontend envia email e senha para `/login`.
2. Java procura o usuario pelo email.
3. Java compara a senha digitada com a senha criptografada.
4. Se estiver correto, Java gera um token JWT.
5. Frontend guarda o token e usa nas proximas chamadas.

### Registro de abastecimento

1. Frontend ou simulacao envia combustivel e litros para `/bomba/abastecer`.
2. Java confere se o usuario tem permissao.
3. Java busca o combustivel no banco.
4. Java calcula:

```txt
valor total = litros abastecidos x preco por litro
```

5. Java salva o pedido com status `PENDENTE`.

### Pagamento de pedido

1. Frontend chama `/pedidos/{id}/pagar`.
2. Java busca o pedido.
3. Java verifica permissao.
4. Java confere se o pedido ja nao foi pago.
5. Java altera o status para `PAGO`.

### Historico

Admin consegue ver o historico geral.

Frentista ve uma visao mais limitada, voltada aos pedidos do dia e ao proprio fluxo operacional.

## Endpoints da API

| Metodo | Rota | Precisa login? | O que faz |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Nao | Verifica se a API esta online. |
| `POST` | `/login` | Nao | Autentica usuario e retorna token JWT. |
| `GET` | `/combustiveis` | Sim | Lista combustiveis e precos. |
| `PUT` | `/combustiveis/{id}` | Sim | Atualiza preco de um combustivel. |
| `POST` | `/bomba/abastecer` | Sim | Registra um abastecimento. |
| `GET` | `/pedidos/pendentes` | Sim | Lista pedidos aguardando pagamento. |
| `GET` | `/pedidos/historico` | Sim | Lista historico de pedidos. |
| `PATCH` | `/pedidos/{id}/pagar` | Sim | Marca pedido como pago. |

## O que o frontend entrega

O frontend fica na pasta `web/` e e feito com React + TypeScript.

Ele entrega:

- Tela de login.
- Armazenamento do token no navegador.
- Envio automatico do token nas chamadas para a API.
- Tela de rotina do posto.
- Cards com resumo de bombas, pendentes e finalizados.
- Lista de abastecimentos aguardando pagamento.
- Botao para finalizar pagamento.
- Historico do dia.
- Menu diferente para admin e frentista.
- Atualizacao automatica da rotina a cada 3 segundos.

O arquivo `web/src/services/api.ts` configura o Axios. Ele define a URL da API e coloca o token JWT nas requisicoes.

O arquivo `web/src/pages/RotinaPosto.tsx` e a tela principal depois do login. Ele busca os pedidos pendentes e o historico, mostra os dados e chama a API quando o usuario paga um pedido.

De forma simples: o front e a vitrine e o painel de controle; o Java e quem faz a operacao de verdade.

## Banco de dados

O projeto usa PostgreSQL via Docker.

Configuracao padrao:

```txt
host: localhost
porta: 5432
banco: posto_combustivel
usuario: admin
senha: posto123
```

Para subir o banco:

```bash
docker compose up -d
```

O Java acessa o banco usando:

```txt
jdbc:postgresql://localhost:5432/posto_combustivel
```

## Como rodar o projeto

### 1. Subir o banco

Na raiz do projeto:

```bash
docker compose up -d
```

### 2. Rodar o backend Java

```bash
cd backend-java
mvn spring-boot:run
```

A API fica em:

```txt
http://localhost:3000
```

### 3. Rodar o frontend

Em outro terminal:

```bash
cd web
npm install
npm start
```

Como a API usa a porta `3000`, o React normalmente sugere abrir em outra porta, como:

```txt
http://localhost:3001
```

## Variaveis de ambiente

O backend aceita estas variaveis:

| Variavel | Para que serve | Padrao |
| :--- | :--- | :--- |
| `PORT` | Porta da API Java. | `3000` |
| `DATABASE_URL` | URL JDBC do PostgreSQL. | `jdbc:postgresql://localhost:5432/posto_combustivel` |
| `DATABASE_USERNAME` | Usuario do banco. | `admin` |
| `DATABASE_PASSWORD` | Senha do banco. | `posto123` |
| `JWT_SECRET` | Segredo usado para assinar tokens. | Valor dev no `application.properties` |
| `JWT_EXPIRATION_MS` | Tempo de validade do token. | `86400000` |
| `CORS_ALLOWED_ORIGINS` | URLs do frontend permitidas. | `http://localhost:3001,http://localhost:3000,http://localhost:5173` |

O frontend pode usar:

| Variavel | Para que serve | Padrao |
| :--- | :--- | :--- |
| `REACT_APP_API_URL` | URL da API Java. | `http://localhost:3000` |

## Como testar

Backend:

```bash
cd backend-java
mvn test
```

Observacao: atualmente nao existem testes automatizados Java em `src/test`. Mesmo assim, o comando valida a compilacao e o ciclo Maven.

Frontend:

```bash
npm --prefix web run test:ci
```

## Resumo para leigos

Se voce nunca programou, pense assim:

- O React e a tela bonita onde a pessoa clica.
- O Java e o gerente invisivel que confere tudo antes de aceitar.
- O banco e o caderno onde tudo fica registrado.
- O token JWT e uma pulseira de identificacao: depois do login, o sistema sabe quem e voce.
- O Flyway e o responsavel por montar as tabelas do banco do jeito certo.
- O Spring Boot e o motor que liga o backend e deixa ele pronto para receber chamadas.

Este projeto mostra um fluxo real de sistema: login, permissao, cadastro de dados, calculo de valor, status de pagamento, historico e integracao entre frontend e backend.
