# API de Funcionários e Obras

## 1. Sobre o projeto

A **API de Funcionários e Obras** é uma API REST desenvolvida para gerenciar funcionários, obras e a alocação de funcionários em diferentes obras.

O projeto foi desenvolvido utilizando:

- Node.js
- TypeScript
- Express.js
- Prisma ORM
- SQLite
- Zod

O sistema foi estruturado pensando em uma futura expansão para um sistema completo de gerenciamento de obras.

---

## 2. Objetivo

O objetivo inicial da aplicação é permitir:

- Cadastro de funcionários;
- Consulta de funcionários;
- Atualização de funcionários;
- Exclusão de funcionários;
- Cadastro de obras;
- Consulta de obras;
- Atualização de obras;
- Exclusão de obras;
- Alocação de funcionários em obras;
- Consulta dos funcionários alocados em uma obra;
- Consulta das obras nas quais um funcionário está alocado;
- Alteração de uma alocação;
- Remoção de uma alocação.

---

## 3. Tecnologias utilizadas

### Node.js

Responsável pelo ambiente de execução JavaScript no servidor.

### TypeScript

Utilizado para adicionar tipagem estática ao projeto e facilitar a manutenção do código.

### Express.js

Framework responsável pela criação da API HTTP e gerenciamento das rotas.

### Prisma

ORM utilizado para comunicação com o banco de dados.

O Prisma também é responsável por:

- Modelagem das entidades;
- Criação das migrations;
- Consultas ao banco;
- Relacionamentos;
- Geração do Prisma Client.

### SQLite

Banco de dados utilizado inicialmente no projeto.

A escolha do SQLite tem como objetivo facilitar o desenvolvimento inicial, evitando a necessidade de configurar um servidor de banco de dados.

Posteriormente, o projeto poderá ser migrado para PostgreSQL.

### Zod

Biblioteca utilizada para validação dos dados recebidos pela API.

---

## 4. Estrutura do projeto

```text
api-funcionarios-obras/
│
├── prisma/
│   └── schema.prisma
│
├── src/
│   │
│   ├── controllers/
│   │   ├── funcionario.controller.ts
│   │   ├── obra.controller.ts
│   │   └── alocacao.controller.ts
│   │
│   ├── lib/
│   │   └── prisma.ts
│   │
│   ├── routes/
│   │   ├── funcionario.routes.ts
│   │   ├── obra.routes.ts
│   │   └── alocacao.routes.ts
│   │
│   ├── schemas/
│   │   ├── funcionario.schema.ts
│   │   └── obra.schema.ts
│   │
│   └── server.ts
│
├── docs/
│   ├── API.md
│   └── ARQUITETURA.md
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 5. Arquitetura

A arquitetura atual é propositalmente simples:

```text
Cliente
   │
   ▼
Express
   │
   ▼
Routes
   │
   ▼
Controllers
   │
   ▼
Prisma
   │
   ▼
SQLite
```

### Routes

Responsáveis por definir:

- método HTTP;
- endpoint;
- controller responsável pela operação.

Exemplo:

```typescript
router.get("/", listarFuncionarios);
```

### Controllers

Responsáveis por:

- receber a requisição;
- obter parâmetros;
- validar os dados;
- executar operações;
- retornar respostas HTTP.

### Schemas

Responsáveis pela validação dos dados recebidos.

Atualmente são utilizados schemas para:

- Funcionários;
- Obras.

A próxima melhoria natural é adicionar também:

```text
alocacao.schema.ts
```

### Prisma

O Prisma é utilizado para realizar a comunicação entre a aplicação e o banco de dados.

Exemplo:

```typescript
const funcionarios = await prisma.funcionario.findMany();
```

---

## 6. Modelo de dados

O banco possui três entidades principais:

```text
┌──────────────────┐
│   Funcionário    │
└────────┬─────────┘
         │
         │ 1:N
         │
         ▼
┌──────────────────┐
│    Alocação      │
└────────┬─────────┘
         │
         │ N:1
         │
         ▼
┌──────────────────┐
│      Obra        │
└──────────────────┘
```

Na prática, o relacionamento entre funcionário e obra é **N:N**.

Isso significa que:

- um funcionário pode trabalhar em várias obras;
- uma obra pode possuir vários funcionários.

A tabela `Alocacao` funciona como tabela intermediária.

---

## 7. Modelo Funcionário

Tabela:

```text
funcionarios
```

Campos:

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | Int | Identificador |
| `nome` | String | Nome do funcionário |
| `email` | String | E-mail |
| `cargo` | String | Cargo |
| `salario` | Float | Salário |
| `criadoEm` | DateTime | Data de criação |
| `atualizadoEm` | DateTime | Data da última atualização |

O campo `email` é único.

Portanto, dois funcionários não podem possuir o mesmo e-mail.

---

## 8. Modelo Obra

Tabela:

```text
obras
```

Campos:

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | Int | Identificador |
| `nome` | String | Nome da obra |
| `endereco` | String | Endereço |
| `status` | String | Situação da obra |
| `dataInicio` | DateTime | Data de início |
| `dataFim` | DateTime | Data de encerramento |
| `criadoEm` | DateTime | Data de criação |
| `atualizadoEm` | DateTime | Data da última atualização |

Os status disponíveis atualmente são:

```text
PLANEJADA
EM_ANDAMENTO
CONCLUIDA
CANCELADA
```

---

## 9. Modelo Alocação

Tabela:

```text
alocacoes
```

Campos:

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | Int | Identificador |
| `funcionarioId` | Int | Funcionário relacionado |
| `obraId` | Int | Obra relacionada |
| `criadoEm` | DateTime | Data da alocação |

A tabela possui uma restrição:

```prisma
@@unique([funcionarioId, obraId])
```

Isso impede que um funcionário seja alocado duas vezes na mesma obra.

Por exemplo, isto é permitido:

```text
João → Obra A
João → Obra B
João → Obra C
```

Mas isto não:

```text
João → Obra A
João → Obra A
```

---

# 10. CRUD de Funcionários

Base:

```text
/api/funcionarios
```

## Listar funcionários

```http
GET /api/funcionarios
```

Retorna todos os funcionários cadastrados.

As alocações também são carregadas juntamente com as obras relacionadas.

---

## Buscar funcionário

```http
GET /api/funcionarios/:id
```

Exemplo:

```http
GET /api/funcionarios/1
```

Retorna o funcionário e suas respectivas alocações.

---

## Criar funcionário

```http
POST /api/funcionarios
```

Exemplo:

```json
{
  "nome": "João da Silva",
  "email": "joao@email.com",
  "cargo": "Pedreiro",
  "salario": 3500
}
```

Resposta esperada:

```json
{
  "id": 1,
  "nome": "João da Silva",
  "email": "joao@email.com",
  "cargo": "Pedreiro",
  "salario": 3500
}
```

Status HTTP:

```text
201 Created
```

---

## Atualizar funcionário

```http
PUT /api/funcionarios/:id
```

Exemplo:

```json
{
  "cargo": "Encarregado",
  "salario": 4500
}
```

Os campos são atualizados parcialmente.

---

## Excluir funcionário

```http
DELETE /api/funcionarios/:id
```

Retorno:

```text
204 No Content
```

As alocações relacionadas também são removidas devido ao relacionamento configurado com `onDelete: Cascade`.

---

# 11. CRUD de Obras

Base:

```text
/api/obras
```

## Listar obras

```http
GET /api/obras
```

Retorna todas as obras e seus funcionários alocados.

---

## Buscar obra

```http
GET /api/obras/:id
```

Exemplo:

```http
GET /api/obras/1
```

Retorna a obra juntamente com suas alocações.

---

## Criar obra

```http
POST /api/obras
```

Exemplo:

```json
{
  "nome": "Residencial Primavera",
  "endereco": "Rua das Flores, 100",
  "status": "EM_ANDAMENTO",
  "dataInicio": "2026-09-01"
}
```

Resposta:

```text
201 Created
```

---

## Atualizar obra

```http
PUT /api/obras/:id
```

Exemplo:

```json
{
  "status": "CONCLUIDA",
  "dataFim": "2027-02-15"
}
```

---

## Excluir obra

```http
DELETE /api/obras/:id
```

Retorno:

```text
204 No Content
```

As alocações relacionadas são removidas automaticamente.

---

# 12. CRUD de Alocações

Base:

```text
/api/alocacoes
```

A alocação é responsável por estabelecer a relação entre um funcionário e uma obra.

---

## Listar alocações

```http
GET /api/alocacoes
```

Retorna todas as alocações.

Os dados do funcionário e da obra são incluídos na resposta.

Exemplo:

```json
[
  {
    "id": 1,
    "funcionarioId": 1,
    "obraId": 1,
    "funcionario": {
      "id": 1,
      "nome": "João da Silva"
    },
    "obra": {
      "id": 1,
      "nome": "Residencial Primavera"
    }
  }
]
```

---

## Buscar alocação

```http
GET /api/alocacoes/:id
```

Exemplo:

```http
GET /api/alocacoes/1
```

---

## Criar alocação

```http
POST /api/alocacoes
```

Body:

```json
{
  "funcionarioId": 1,
  "obraId": 1
}
```

Antes de criar a alocação, a API verifica:

1. Se o funcionário existe;
2. Se a obra existe;
3. Se o funcionário já está alocado naquela obra.

Caso tudo esteja correto, a alocação é criada.

Resposta:

```text
201 Created
```

---

## Exemplo de fluxo

Primeiro:

```text
Funcionário:
ID = 1
Nome = João
```

Depois:

```text
Obra:
ID = 1
Nome = Residencial Primavera
```

Então:

```http
POST /api/alocacoes
```

```json
{
  "funcionarioId": 1,
  "obraId": 1
}
```

Resultado:

```text
João
  │
  └── Residencial Primavera
```

Posteriormente, o mesmo funcionário pode ser alocado em outra obra:

```json
{
  "funcionarioId": 1,
  "obraId": 2
}
```

Resultado:

```text
João
 ├── Residencial Primavera
 └── Edifício Central
```

---

## Atualizar alocação

```http
PUT /api/alocacoes/:id
```

Exemplo:

```json
{
  "funcionarioId": 1,
  "obraId": 3
}
```

Isso pode ser utilizado, por exemplo, para transferir o funcionário para outra obra.

A API verifica novamente:

- existência do funcionário;
- existência da obra;
- existência de uma alocação duplicada.

---

## Excluir alocação

```http
DELETE /api/alocacoes/:id
```

Exemplo:

```http
DELETE /api/alocacoes/1
```

Remove somente a relação entre o funcionário e a obra.

O funcionário e a obra continuam cadastrados.

---

# 13. Códigos HTTP

A API utiliza os principais códigos HTTP:

| Código | Significado |
|---|---|
| `200` | Operação realizada com sucesso |
| `201` | Recurso criado |
| `204` | Recurso removido sem conteúdo de resposta |
| `400` | Dados inválidos |
| `404` | Recurso não encontrado |
| `409` | Conflito |
| `500` | Erro interno |

Exemplo de `404`:

```json
{
  "message": "Funcionário não encontrado."
}
```

Exemplo de `409`:

```json
{
  "message": "Funcionário já está alocado nesta obra."
}
```

---

# 14. Instalação

## Pré-requisitos

É necessário possuir instalado:

- Node.js;
- npm.

Verificar:

```bash
node --version
```

```bash
npm --version
```

---

## Instalar dependências

Dentro da pasta do projeto:

```bash
npm install
```

---

# 15. Configuração do ambiente

Criar o arquivo:

```text
.env
```

A partir do `.env.example`.

Conteúdo:

```env
DATABASE_URL="file:./dev.db"
PORT=3000
```

---

# 16. Configuração do Prisma

Gerar o Prisma Client:

```bash
npx prisma generate
```

Criar o banco e executar a migration inicial:

```bash
npx prisma migrate dev --name init
```

---

# 17. Executar o projeto

Modo desenvolvimento:

```bash
npm run dev
```

A API ficará disponível em:

```text
http://localhost:3000
```

---

# 18. Health Check

A API possui uma rota para verificar se o servidor está funcionando:

```http
GET /health
```

Resposta:

```json
{
  "status": "ok",
  "message": "API Funcionários e Obras funcionando."
}
```

---

# 19. Scripts disponíveis

No `package.json`:

```bash
npm run dev
```

Executa o projeto em modo desenvolvimento utilizando `tsx`.

```bash
npm run build
```

Compila o TypeScript para JavaScript.

```bash
npm start
```

Executa a versão compilada.

```bash
npm run prisma:generate
```

Gera o Prisma Client.

```bash
npm run prisma:migrate
```

Executa as migrations.

```bash
npm run prisma:studio
```

Abre o Prisma Studio para visualizar e editar os dados.

---

# 20. Fluxo completo do sistema

O fluxo esperado atualmente é:

```text
1. Cadastrar funcionário
          ↓
2. Cadastrar obra
          ↓
3. Criar alocação
          ↓
4. Funcionário passa a pertencer à obra
          ↓
5. Consultar funcionário
          ↓
6. Visualizar suas obras
```

Também é possível realizar o caminho inverso:

```text
Obra
 ↓
Alocações
 ↓
Funcionários
```

---

# 21. Exemplo prático

Supondo que existam:

### Funcionários

```text
1 - João
2 - Maria
3 - Carlos
```

### Obras

```text
1 - Residencial Primavera
2 - Edifício Central
```

Podemos criar:

```text
João ────────────┐
                 │
                 ▼
          Residencial Primavera

Maria ───────────┤
                 │
                 ▼
          Residencial Primavera

João ────────────┐
                 │
                 ▼
          Edifício Central

Carlos ──────────┐
                 │
                 ▼
          Edifício Central
```

No banco:

```text
ALOCACOES

id | funcionarioId | obraId
---|----------------|-------
1  | 1              | 1
2  | 2              | 1
3  | 1              | 2
4  | 3              | 2
```

---

# 22. Estado atual do projeto

### Funcionários

```text
[✓] Criar
[✓] Listar
[✓] Buscar
[✓] Atualizar
[✓] Excluir
```

### Obras

```text
[✓] Criar
[✓] Listar
[✓] Buscar
[✓] Atualizar
[✓] Excluir
```

### Alocações

```text
[✓] Criar
[✓] Listar
[✓] Buscar
[✓] Atualizar
[✓] Excluir
```

### Relacionamentos

```text
[✓] Funcionário → Obras
[✓] Obra → Funcionários
[✓] Prevenção de alocação duplicada
[✓] Cascade Delete
```

---

# 23. Melhorias futuras

A estrutura atual é uma base para evoluções posteriores.

Algumas funcionalidades que podem ser adicionadas:

## Autenticação

Implementar:

```text
JWT
Login
Logout
Refresh Token
```

## Usuários e permissões

Criar diferentes perfis:

```text
ADMIN
GESTOR
FUNCIONARIO
```

## Regras de negócio

Exemplos:

- limitar funcionários por obra;
- controlar data de entrada e saída;
- registrar função exercida em cada obra;
- controlar horas trabalhadas;
- controlar equipes;
- controlar custo de mão de obra.

## Filtros

Adicionar:

```text
GET /api/funcionarios?cargo=Pedreiro
GET /api/obras?status=EM_ANDAMENTO
```

## Paginação

Exemplo:

```text
GET /api/funcionarios?page=1&limit=10
```

## Documentação Swagger

Adicionar documentação OpenAPI/Swagger para permitir testar a API através de uma interface gráfica.

## Testes

Adicionar:

```text
Testes unitários
Testes de integração
Testes dos endpoints
```

## Banco de produção

Quando necessário, substituir SQLite por:

```text
PostgreSQL
```

mantendo o Prisma como ORM.

---

# 24. Arquitetura futura

À medida que o sistema crescer, a arquitetura poderá evoluir de:

```text
Route
   ↓
Controller
   ↓
Prisma
```

para:

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

Essa separação permitirá concentrar as regras de negócio nos `Services`, deixando os Controllers responsáveis principalmente pelo tratamento HTTP.

---

# 25. Próximas funcionalidades sugeridas

Uma sequência natural de desenvolvimento seria:

```text
1. [✓] CRUD Funcionários
2. [✓] CRUD Obras
3. [✓] CRUD Alocações
4. [ ] Validação de Alocações com Zod
5. [ ] Service Layer
6. [ ] Tratamento global de erros
7. [ ] Swagger/OpenAPI
8. [ ] Testes automatizados
9. [ ] Autenticação
10. [ ] Sistema de permissões
11. [ ] PostgreSQL
12. [ ] Deploy
13. [ ] Frontend
```

A estrutura atual deve ser considerada uma **primeira versão da API**, priorizando simplicidade, aprendizado e uma base organizada para as próximas funcionalidades.
