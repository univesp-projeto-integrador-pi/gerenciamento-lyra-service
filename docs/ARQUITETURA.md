# Arquitetura

A aplicação usa TypeScript e uma separação inicial por responsabilidade.

## Routes

Responsáveis somente por declarar:

- método HTTP
- endpoint
- controller responsável

## Controllers

Responsáveis por:

- receber a requisição
- validar dados
- executar a operação
- devolver a resposta HTTP

## Schemas

Responsáveis pela validação dos dados recebidos usando Zod.

## Prisma

Responsável pela comunicação com o banco de dados.

## Próxima evolução

Quando as regras de negócio crescerem, os controllers podem ficar mais finos:

```text
Route
  ↓
Controller
  ↓
Service
  ↓
Repository
  ↓
Prisma
  ↓
Database
```
