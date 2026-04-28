# Backend Java - Posto

Backend em Java/Spring Boot equivalente ao servidor Node atual.

## Stack

- Java 21+
- Spring Boot
- Spring Web
- Spring Security
- Spring Data JPA
- PostgreSQL
- Flyway
- JWT

## Endpoints mantidos

```txt
GET    /health
POST   /login
GET    /combustiveis
PUT    /combustiveis/{id}
POST   /bomba/abastecer
GET    /pedidos/pendentes
GET    /pedidos/historico
PATCH  /pedidos/{id}/pagar
```

## Banco

Por padrao usa o mesmo PostgreSQL do projeto atual:

```txt
jdbc:postgresql://localhost:5432/posto_combustivel
usuario: admin
senha: posto123
```

Variaveis aceitas:

```txt
PORT
DATABASE_URL
DATABASE_USERNAME
DATABASE_PASSWORD
JWT_SECRET
JWT_EXPIRATION_MS
CORS_ALLOWED_ORIGINS
```

## Rodar

Instale Maven ou adicione Maven Wrapper, depois execute:

```bash
mvn spring-boot:run
```

Usuarios iniciais:

```txt
admin@posto.com / 123456
frentista@posto.com / 123456
```
