# API de Funcionários e Obras

API REST para gerenciar **funcionários**, **obras** e a **alocação** de funcionários em obras, desenvolvida como projeto de faculdade para atender uma pequena empresa de obras, alvenaria e construção.

O foco do projeto é uma base **organizada e segura**: autenticação por sessão, controle de acesso por papéis, proteção contra CSRF, auditoria das alterações e uma suíte de testes automatizados de segurança.

---

## Sumário

1. [Tecnologias](#1-tecnologias)
2. [Estado atual do projeto](#2-estado-atual-do-projeto)
3. [Arquitetura](#3-arquitetura)
4. [Estrutura de pastas](#4-estrutura-de-pastas)
5. [Modelo de dados](#5-modelo-de-dados)
6. [Segurança](#6-segurança)
7. [Papéis e permissões](#7-papéis-e-permissões)
8. [Endpoints](#8-endpoints)
9. [Formato das respostas e códigos HTTP](#9-formato-das-respostas-e-códigos-http)
10. [Instalação e execução](#10-instalação-e-execução)
11. [Variáveis de ambiente](#11-variáveis-de-ambiente)
12. [Primeiro acesso](#12-primeiro-acesso)
13. [Como consumir a API (frontend)](#13-como-consumir-a-api-frontend)
14. [Scripts disponíveis](#14-scripts-disponíveis)
15. [Testes](#15-testes)
16. [Deploy](#16-deploy)
17. [Decisões e limitações conhecidas](#17-decisões-e-limitações-conhecidas)
18. [Próximos passos](#18-próximos-passos)

---

## 1. Tecnologias

| Área | Tecnologia |
|---|---|
| Runtime | Node.js 24 |
| Linguagem | TypeScript 5.9 (ESM, `module: NodeNext`) |
| Framework HTTP | Express 5 |
| ORM | Prisma 7 (gerador `prisma-client`, adapter `@prisma/adapter-pg`) |
| Banco de dados | PostgreSQL 17 (via Docker) |
| Validação | Zod 4 |
| Sessão | `express-session` com armazenamento no Postgres (`connect-pg-simple`) |
| Senhas | Argon2id (`argon2`) |
| CSRF | `csrf-sync` (token sincronizado na sessão) + verificação de `Origin` |
| Cabeçalhos e CORS | `helmet` e `cors` |
| Limite de requisições | `express-rate-limit` |
| Logs | `pino` e `pino-http` (`pino-pretty` em desenvolvimento) |
| Testes | Vitest 4 e Supertest |

Observação: o projeto usa ESM. Os imports relativos levam a extensão `.js` (por exemplo, `import { prisma } from "../lib/prisma.js"`), mesmo nos arquivos `.ts`.

---

## 2. Estado atual do projeto

### Implementado

- [x] CRUD de funcionários, obras e alocações
- [x] Migração de SQLite para PostgreSQL
- [x] Validação do ambiente na inicialização (o app não sobe com configuração inválida)
- [x] Autenticação por sessão: login, logout, `/me` e troca de senha
- [x] Hash de senha com Argon2id e atualização automática do custo no login
- [x] Bloqueio da conta após 5 senhas erradas (15 minutos)
- [x] Gestão de usuários pelo ADMIN (criar, alterar papel, ativar/desativar, redefinir senha)
- [x] Controle de acesso por papéis (RBAC) e escopo por dono do dado
- [x] Helmet, CORS restrito, limite de requisições e limite do corpo
- [x] Proteção contra CSRF (token + verificação de `Origin`)
- [x] Tratador global de erros (sempre em JSON, sem vazar detalhes internos)
- [x] Validação estrita com Zod (campos desconhecidos são rejeitados)
- [x] Logs estruturados e trilha de auditoria
- [x] Suíte de testes automatizados de segurança (82 testes)

### Pendente

- [ ] **Exclusão lógica (soft delete):** o campo `excluidoEm` já existe em `Funcionario` e `Obra`, mas **o código ainda não o usa**. Hoje o `DELETE` apaga o registro de verdade (e as alocações junto, por cascade). Planejado: marcar `excluidoEm`, filtrar registros excluídos de forma central, criar rotas de restauração e desativar o login de quem é excluído
- [ ] **Limpeza agendada:** apagar de vez registros excluídos há mais de um prazo de retenção, a ser definido pela equipe (e, opcionalmente, auditorias antigas)
- [ ] Deploy
- [ ] Frontend
- [ ] Documentação OpenAPI/Swagger

---

## 3. Arquitetura

```text
Cliente (frontend)
   │
   ▼
Express
   │
   ├─ 1. Log da requisição (pino-http)
   ├─ 2. Helmet (cabeçalhos de segurança)
   ├─ 3. CORS (somente a origem do frontend, com credenciais)
   ├─ 4. Limite global de requisições
   ├─ 5. Leitura do JSON (limite de 10 KB)
   ├─ 6. Sessão (cookie "sid" + tabela "session" no Postgres)
   ├─ 7. Verificação de Origin e token CSRF
   ├─ 8. Auditoria das mutações e dos acessos negados
   │
   ├─ Rotas públicas: /health, /api/csrf-token, /api/auth/*
   │
   ├─ PORTÃO: autenticar + exigirSenhaTrocada
   │
   ├─ Rotas protegidas: /api/usuarios, /api/funcionarios,
   │                    /api/obras, /api/alocacoes, /api/auditoria
   │        │
   │        ▼
   │   exigirPapel (RBAC) ──► Controllers ──► Prisma ──► PostgreSQL
   │
   └─ 404 e tratador global de erros (sempre por último)
```

A ordem dos middlewares em `src/app.ts` faz parte da segurança. Em especial:

- O CORS vem antes do portão de login para que o *preflight* (`OPTIONS`) do navegador seja respondido sem exigir autenticação.
- O limite de requisições vem antes da leitura do JSON.
- **Qualquer rota montada acima do portão fica pública.**
- O tratador de erros é sempre o último.

---

## 4. Estrutura de pastas

```text
api-funcionarios-obras/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts                      # cria o primeiro ADMIN
├── prisma.config.ts
├── src/
│   ├── app.ts                       # monta o Express (middlewares e rotas)
│   ├── server.ts                    # só chama listen()
│   ├── env.ts                       # valida o ambiente com Zod
│   ├── controllers/
│   │   ├── alocacao.controller.ts
│   │   ├── auditoria.controller.ts
│   │   ├── auth.controller.ts
│   │   ├── funcionario.controller.ts
│   │   ├── obra.controller.ts
│   │   └── usuario.controller.ts
│   ├── generated/prisma/            # gerado pelo Prisma (fora do Git)
│   ├── lib/
│   │   ├── auditoria.ts             # grava eventos na tabela de auditoria
│   │   ├── csrf.ts                  # configuração do csrf-sync
│   │   ├── erros-prisma.ts          # leitura dos códigos de erro do Prisma
│   │   ├── logger.ts                # pino
│   │   ├── params.ts                # validação de IDs de rota
│   │   ├── prisma.ts                # cliente Prisma com adapter do Postgres
│   │   ├── rate-limit.ts            # limitadores
│   │   ├── senha.ts                 # Argon2id
│   │   └── session.ts               # express-session + connect-pg-simple
│   ├── middlewares/
│   │   ├── auditoria.middleware.ts
│   │   ├── auth.middleware.ts       # autenticar, exigirSenhaTrocada, exigirPapel
│   │   ├── erro.middleware.ts
│   │   ├── log-http.middleware.ts
│   │   └── origem.middleware.ts
│   ├── routes/
│   │   ├── alocacao.routes.ts
│   │   ├── auditoria.routes.ts
│   │   ├── auth.routes.ts
│   │   ├── funcionario.routes.ts
│   │   ├── obra.routes.ts
│   │   └── usuario.routes.ts
│   ├── schemas/                     # Zod
│   │   ├── alocacao.schema.ts
│   │   ├── auth.schema.ts
│   │   ├── funcionario.schema.ts
│   │   ├── obra.schema.ts
│   │   ├── senha.schema.ts
│   │   └── usuario.schema.ts
│   └── types/
│       └── express.d.ts             # tipos de req.session e req.usuario
├── tests/
│   ├── global-setup.ts              # trava de segurança + limpeza do banco de teste
│   ├── helpers.ts                   # cliente HTTP com cookies e token CSRF automático
│   ├── auth.test.ts
│   ├── csrf.test.ts
│   ├── hardening.test.ts
│   ├── ratelimit.test.ts
│   ├── rbac.test.ts
│   ├── validacao.test.ts
│   └── auditoria.test.ts
├── docker-compose.yml               # PostgreSQL 17
├── vitest.config.ts
├── tsconfig.json
├── tsconfig.test.json
├── .env.example
├── .env.test.example
├── .gitignore
├── package.json
└── README.md
```

---

## 5. Modelo de dados

```text
┌─────────────┐ 1     N ┌───────────┐ N     1 ┌────────┐
│ Funcionario │─────────│ Alocacao  │─────────│  Obra  │
└──────┬──────┘         └───────────┘         └────────┘
       │ 1
       │ 0..1
┌──────┴──────┐
│   Usuario   │   (login de quem acessa o sistema)
└─────────────┘

Sessao (tabela "session")  e  Auditoria  não têm relação com as demais.
```

A relação entre funcionário e obra é N:N, com a tabela `Alocacao` no meio. A restrição `@@unique([funcionarioId, obraId])` impede alocar o mesmo funcionário duas vezes na mesma obra.

### Funcionario (`funcionarios`)

| Campo | Tipo | Observação |
|---|---|---|
| `id` | Int | Identificador |
| `nome` | String | 2 a 120 caracteres |
| `email` | String | Único |
| `cargo` | String? | Até 80 caracteres |
| `salario` | Decimal(12,2)? | Veja a seção 8 sobre o formato |
| `criadoEm`, `atualizadoEm` | DateTime | Mantidos pelo Prisma |
| `excluidoEm` | DateTime? | Reservado para o soft delete (ainda sem uso no código) |

### Obra (`obras`)

| Campo | Tipo | Observação |
|---|---|---|
| `id` | Int | Identificador |
| `nome` | String | 2 a 120 caracteres |
| `endereco` | String? | Até 200 caracteres |
| `status` | String | `PLANEJADA` (padrão), `EM_ANDAMENTO`, `CONCLUIDA` ou `CANCELADA` (validado pelo Zod) |
| `dataInicio`, `dataFim` | DateTime? | A data de término não pode ser anterior à de início |
| `criadoEm`, `atualizadoEm` | DateTime | Mantidos pelo Prisma |
| `excluidoEm` | DateTime? | Reservado para o soft delete |

### Alocacao (`alocacoes`)

| Campo | Tipo |
|---|---|
| `id` | Int |
| `funcionarioId` | Int (cascade) |
| `obraId` | Int (cascade) |
| `criadoEm` | DateTime |

### Usuario (`usuarios`)

| Campo | Tipo | Observação |
|---|---|---|
| `id` | Int | Identificador |
| `email` | String | Único, sempre em minúsculas |
| `senhaHash` | String | Argon2id. Nunca é devolvido pela API |
| `papel` | enum `Papel` | `ADMIN`, `GESTOR` ou `FUNCIONARIO` |
| `ativo` | Boolean | Conta desativada não entra e perde a sessão na hora |
| `precisaTrocarSenha` | Boolean | `true` enquanto a senha for provisória |
| `tentativasFalhas`, `bloqueadoAte` | Int, DateTime? | Bloqueio por tentativas |
| `funcionarioId` | Int? (único) | Vínculo opcional com um funcionário |

### Sessao (`session`)

Tabela usada pelo `connect-pg-simple` (`sid`, `sess`, `expire`). Os nomes e tipos das colunas precisam bater com os do pacote.

### Auditoria (`auditorias`)

| Campo | Observação |
|---|---|
| `usuarioId` | Sem chave estrangeira de propósito: o registro sobrevive à exclusão do usuário |
| `acao` | Por exemplo `PUT /api/funcionarios/:id`, `LOGIN_FALHA`, `ACESSO_NEGADO` |
| `recurso`, `recursoId` | O que foi afetado |
| `detalhes` | JSON com **nomes** de campos e metadados. Nunca guarda valores sensíveis |
| `ip`, `criadoEm` | Origem e momento |

---

## 6. Segurança

### Autenticação

- Sessão em cookie `sid`: `HttpOnly`, `SameSite=Lax` e `Secure` em produção. Duração de 8 horas, renovada a cada uso.
- As sessões ficam no PostgreSQL, então sobrevivem a reinicializações do servidor.
- O ID da sessão é **trocado** no login e na troca de senha (proteção contra *session fixation*).
- O usuário é recarregado do banco a cada requisição: desativar uma conta ou mudar o papel vale **na hora**.
- Senha: Argon2id (19 MiB de memória, 2 iterações, paralelismo 1), de 10 a 128 caracteres. Se o custo do hash subir no futuro, ele é refeito no próximo login.
- O login responde igual para e-mail inexistente, senha errada, conta inativa e conta bloqueada (sem enumeração de usuários) e gasta o mesmo tempo nos dois primeiros casos.
- 5 senhas erradas bloqueiam a conta por 15 minutos.
- A senha criada pelo ADMIN é **provisória**: até ser trocada, a API só aceita as rotas de autenticação.
- Não existe cadastro público. Só o ADMIN cria usuários.

### Proteção da API

- **Helmet:** cabeçalhos de segurança, sem `X-Powered-By`.
- **CORS:** uma única origem (`FRONTEND_ORIGIN`), com credenciais. Nunca `*`.
- **CSRF:** toda requisição que altera dados (inclusive o login) exige o cabeçalho `X-CSRF-Token`. O token vive na sessão e é invalidado quando a sessão é regenerada. Também é verificado o cabeçalho `Origin`.
- **Limite de requisições:** global (padrão de 300 a cada 15 minutos por IP) e específico para login e troca de senha (padrão de 10). O token CSRF anônimo também tem um limite próprio, porque cada visitante sem sessão cria uma linha na tabela de sessões.
- **Corpo da requisição:** no máximo 10 KB.
- **Cache:** respostas de `/api` saem com `Cache-Control: no-store`.

### Dados

- Validação com Zod em todas as rotas, com schemas **estritos** (campo desconhecido gera `400`, o que impede *mass assignment*).
- IDs de rota são validados (`/api/obras/abc` gera `400`).
- Os controllers usam `select` explícito: o `senhaHash` nunca sai, e o **salário só aparece para quem pode vê-lo**.
- Quando um funcionário pede algo que não é dele, a resposta é `404` (e não `403`), para não revelar que o registro existe.
- Excluir um funcionário **desativa o login** vinculado a ele na mesma transação.

### Erros e logs

- Todo erro sai em JSON. Detalhes internos e *stack traces* ficam só no log do servidor.
- Os logs registram método, caminho (sem query string), status e o `usuarioId`. **Nunca** registram cookies, tokens, cabeçalhos, corpos de requisição nem senhas.
- Respostas 4xx saem como `warn` e 5xx como `error`. O `/health` não é registrado.

### Auditoria

- Toda requisição que **altera dados** e termina com sucesso é registrada automaticamente, junto com os acessos negados (`403`).
- Eventos de autenticação são gravados pelo controller: `LOGIN_SUCESSO`, `LOGIN_FALHA` (com o motivo, sem o e-mail digitado), `CONTA_BLOQUEADA`, `LOGOUT` e `SENHA_TROCADA`.
- Só os **nomes** dos campos alterados são guardados (por exemplo `["salario"]`), nunca os valores.
- Tentativas sem login (`401`) vão para o log, não para a tabela, para ninguém sem conta conseguir encher o banco.
- A auditoria é "melhor esforço": se a gravação falhar, o erro vai para o log e a requisição continua.

---

## 7. Papéis e permissões

| Recurso | ADMIN | GESTOR | FUNCIONARIO |
|---|---|---|---|
| Listar funcionários | Sim, com salário | Sim, sem salário | Não (`403`) |
| Ver um funcionário | Sim, com salário | Sim, sem salário | Só o próprio, com o próprio salário (os outros dão `404`) |
| Criar, editar e excluir funcionário | Sim | Não | Não |
| Ler obras | Todas, com a equipe | Todas, com a equipe | Só as obras em que está alocado, sem a equipe |
| Criar, editar e excluir obra | Sim | Sim | Não |
| Ler alocações | Todas | Todas | Só as próprias |
| Criar, editar e excluir alocação | Sim | Sim | Não |
| Gerenciar usuários | Sim | Não | Não |
| Consultar a auditoria | Sim | Não | Não |

A equipe de uma obra aparece apenas com `id`, `nome` e `cargo`: nunca com e-mail nem salário.

---

## 8. Endpoints

Todas as rotas abaixo de `/api` (exceto as de **Autenticação** e `/api/csrf-token`) exigem login e senha já trocada. As requisições `POST`, `PUT`, `PATCH` e `DELETE` exigem o cabeçalho `X-CSRF-Token`.

### Públicas

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Verifica se a API está no ar |
| GET | `/api/csrf-token` | Devolve `{ "token": "..." }` para o cabeçalho `X-CSRF-Token` |

### Autenticação (`/api/auth`)

| Método | Rota | Login | Descrição |
|---|---|---|---|
| POST | `/api/auth/login` | Não | `{ "email", "senha" }` |
| POST | `/api/auth/logout` | Não | Encerra a sessão (`204`) |
| GET | `/api/auth/me` | Sim | Dados do usuário logado |
| POST | `/api/auth/trocar-senha` | Sim | `{ "senhaAtual", "novaSenha" }` (`204`) |

### Funcionários (`/api/funcionarios`)

| Método | Rota | Papéis |
|---|---|---|
| GET | `/api/funcionarios` | ADMIN, GESTOR |
| GET | `/api/funcionarios/:id` | Todos (FUNCIONARIO só o próprio) |
| POST | `/api/funcionarios` | ADMIN |
| PUT | `/api/funcionarios/:id` | ADMIN (atualização parcial) |
| DELETE | `/api/funcionarios/:id` | ADMIN |

Corpo de criação:

```json
{
  "nome": "João da Silva",
  "email": "joao@email.com",
  "cargo": "Pedreiro",
  "salario": "3500.00"
}
```

O `salario` é enviado **como texto**, no formato `3500.00` (até 10 dígitos inteiros e 2 decimais, com ponto). A API devolve o valor como texto também (por exemplo `"3500"`), e quem formata para `R$ 3.500,00` é o frontend. Enviar o salário como número gera `400`.

### Obras (`/api/obras`)

| Método | Rota | Papéis |
|---|---|---|
| GET | `/api/obras` | Todos (FUNCIONARIO só as suas) |
| GET | `/api/obras/:id` | Todos (FUNCIONARIO só as suas) |
| POST | `/api/obras` | ADMIN, GESTOR |
| PUT | `/api/obras/:id` | ADMIN, GESTOR (atualização parcial) |
| DELETE | `/api/obras/:id` | ADMIN, GESTOR |

```json
{
  "nome": "Residencial Primavera",
  "endereco": "Rua das Flores, 100",
  "status": "EM_ANDAMENTO",
  "dataInicio": "2026-09-01",
  "dataFim": "2027-02-15"
}
```

### Alocações (`/api/alocacoes`)

| Método | Rota | Papéis |
|---|---|---|
| GET | `/api/alocacoes` | Todos (FUNCIONARIO só as suas) |
| GET | `/api/alocacoes/:id` | Todos (FUNCIONARIO só as suas) |
| POST | `/api/alocacoes` | ADMIN, GESTOR |
| PUT | `/api/alocacoes/:id` | ADMIN, GESTOR |
| DELETE | `/api/alocacoes/:id` | ADMIN, GESTOR |

```json
{ "funcionarioId": 1, "obraId": 1 }
```

Os dois campos precisam ser números inteiros positivos. A API confere se o funcionário e a obra existem e responde `409` se a alocação já existir.

### Usuários (`/api/usuarios`, somente ADMIN)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/usuarios` | Lista os usuários (nunca com o hash) |
| POST | `/api/usuarios` | Cria um usuário |
| PATCH | `/api/usuarios/:id` | Altera `papel` e/ou `ativo` |
| POST | `/api/usuarios/:id/redefinir-senha` | Define uma nova senha provisória e desbloqueia a conta |

```json
{
  "funcionarioId": 1,
  "papel": "FUNCIONARIO",
  "senhaTemporaria": "provisoria-longa-123"
}
```

Se o `email` for omitido e houver `funcionarioId`, é usado o e-mail do funcionário. O ADMIN não pode desativar nem rebaixar a própria conta, nem redefinir a própria senha por essa rota.

### Auditoria (`/api/auditoria`, somente ADMIN)

`GET /api/auditoria` aceita os parâmetros `limite` (1 a 200, padrão 50), `acao`, `recurso`, `recursoId` e `usuarioId`. Parâmetros desconhecidos geram `400`. Os registros vêm do mais recente para o mais antigo.

---

## 9. Formato das respostas e códigos HTTP

Os erros sempre têm um campo `message`:

```json
{ "message": "Funcionário não encontrado." }
```

Erros de validação trazem também os detalhes por campo:

```json
{
  "message": "Dados inválidos.",
  "errors": { "formErrors": [], "fieldErrors": { "salario": ["Use o formato 3500.00"] } }
}
```

| Código | Significado |
|---|---|
| `200` | Sucesso |
| `201` | Recurso criado |
| `204` | Sucesso sem conteúdo (exclusões, logout, troca de senha) |
| `400` | Dados inválidos, ID inválido, JSON malformado |
| `401` | Não autenticado, ou credenciais inválidas no login |
| `403` | Sem permissão, token CSRF inválido, `Origin` não permitida ou senha provisória ainda não trocada |
| `404` | Recurso não encontrado (ou fora do escopo de quem pediu) |
| `409` | Conflito (e-mail repetido, alocação duplicada) |
| `413` | Corpo da requisição grande demais |
| `429` | Muitas requisições |
| `500` | Erro interno (sem detalhes na resposta) |

---

## 10. Instalação e execução

### Pré-requisitos

- Node.js 24 e npm
- Docker (para o PostgreSQL)
- `openssl` (para gerar segredos)

### Passo a passo

```bash
# 1. Dependências
npm install
# Se o npm avisar sobre scripts de instalação pendentes (o argon2 tem um),
# confira com "npm install-scripts ls" e aprove o pacote.

# 2. Banco de dados
docker compose up -d

# 3. Variáveis de ambiente
cp .env.example .env
# edite o .env (veja a seção 11)

# 4. Cliente do Prisma e tabelas
npm run prisma:generate
npm run prisma:migrate

# 5. Primeiro ADMIN
npm run prisma:seed

# 6. Servidor
npm run dev
```

A API fica em `http://localhost:3000`. Teste com `curl localhost:3000/health`.

No Prisma 7, o cliente **não é gerado automaticamente**: rode `npm run prisma:generate` depois de instalar e sempre que alterar o `schema.prisma`.

---

## 11. Variáveis de ambiente

O arquivo `.env` é validado na inicialização (`src/env.ts`). Se algo estiver faltando ou inválido, o servidor se recusa a subir e lista o que corrigir.

| Variável | Obrigatória | Padrão | Descrição |
|---|---|---|---|
| `DATABASE_URL` | Sim | | String de conexão do PostgreSQL |
| `SESSION_SECRET` | Sim | | Segredo da sessão, com no mínimo 32 caracteres. Gere com `openssl rand -hex 48` |
| `FRONTEND_ORIGIN` | Sim | | Origem do frontend (por exemplo `http://localhost:5173`), **sem barra no final** |
| `NODE_ENV` | Não | `development` | `development`, `test` ou `production` |
| `PORT` | Não | `3000` | Porta da API |
| `TRUST_PROXY` | Não | `0` | Número de proxies na frente da API (use `1` atrás de um proxy reverso) |
| `LIMITE_GLOBAL` | Não | `300` | Requisições por IP a cada 15 minutos |
| `LIMITE_LOGIN` | Não | `10` | Tentativas de login por IP a cada 15 minutos |
| `LOG_LEVEL` | Não | `info` | `fatal`, `error`, `warn`, `info`, `debug`, `trace` ou `silent` |

Usadas **apenas pelo seed** (não pelo servidor):

| Variável | Descrição |
|---|---|
| `ADMIN_EMAIL` | E-mail do primeiro ADMIN |
| `ADMIN_SENHA` | Senha provisória dele (10 a 128 caracteres). Remova do `.env` depois do primeiro login |

Em desenvolvimento, vale aumentar os limites no `.env` (por exemplo `LIMITE_GLOBAL=5000` e `LIMITE_LOGIN=100`) para não esbarrar neles ao testar.

Nunca faça commit do `.env`. O `.env.example` traz as mesmas chaves sem valores reais.

---

## 12. Primeiro acesso

1. O seed cria um ADMIN com a senha provisória do `.env` e `precisaTrocarSenha = true`.
2. Faça login. Enquanto a senha não for trocada, a API só aceita as rotas de `/api/auth`.
3. Troque a senha em `POST /api/auth/trocar-senha`.
4. Remova a variável `ADMIN_SENHA` do `.env`.
5. Cadastre os funcionários e, para quem precisar de acesso, crie o usuário em `POST /api/usuarios` com uma senha provisória. A pessoa troca a senha no primeiro login.
6. Se alguém esquecer a senha, o ADMIN redefine em `POST /api/usuarios/:id/redefinir-senha`.

---

## 13. Como consumir a API (frontend)

A API usa cookie de sessão, então o frontend precisa:

1. Chamar **todas** as rotas com `credentials: "include"`.
2. Ao carregar, buscar o token em `GET /api/csrf-token` e guardá-lo **em memória**.
3. Enviar `X-CSRF-Token: <token>` em todo `POST`, `PUT`, `PATCH` e `DELETE`, **inclusive no login**.
4. **Buscar um token novo** depois de login, logout e troca de senha (a sessão é regenerada e o token anterior deixa de valer) e quando receber `403` por token inválido.
5. Tratar `401` (voltar ao login), `403`, `429` (esperar) e `5xx`.
6. Tratar o `salario` como texto e formatá-lo na tela.
7. Guardar nada de autenticação em `localStorage`: o cookie é `HttpOnly` e o navegador cuida dele.

Esconder botões conforme o papel é só conveniência de interface: quem garante o acesso é a API.

```ts
const API = import.meta.env.VITE_API_URL;
let csrf: string | null = null;

export async function renovarCsrf() {
  const r = await fetch(`${API}/api/csrf-token`, { credentials: "include" });
  csrf = (await r.json()).token;
}

export async function api(path: string, init: RequestInit = {}) {
  const metodo = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);

  if (metodo !== "GET") {
    if (!csrf) await renovarCsrf();
    headers.set("X-CSRF-Token", csrf!);
    headers.set("Content-Type", "application/json");
  }

  const r = await fetch(`${API}${path}`, { ...init, headers, credentials: "include" });
  if (r.status === 401) window.location.href = "/login";
  return r;
}
// Depois do login e do logout, chame renovarCsrf().
```

### Exemplo com `curl`

```bash
JAR=$(mktemp)
token() { curl -s -b "$JAR" -c "$JAR" localhost:3000/api/csrf-token | sed -E 's/.*"token":"([^"]+)".*/\1/'; }

# login (o token é pedido antes)
curl -b "$JAR" -c "$JAR" -X POST localhost:3000/api/auth/login \
  -H "Content-Type: application/json" -H "X-CSRF-Token: $(token)" \
  -d '{"email":"admin@exemplo.com","senha":"sua-senha"}'

# depois do login a sessão mudou: o token é pedido de novo
curl -b "$JAR" -c "$JAR" -X POST localhost:3000/api/funcionarios \
  -H "Content-Type: application/json" -H "X-CSRF-Token: $(token)" \
  -d '{"nome":"João da Silva","email":"joao@email.com","cargo":"Pedreiro","salario":"3500.00"}'

curl -b "$JAR" localhost:3000/api/funcionarios
```

---

## 14. Scripts disponíveis

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor em modo desenvolvimento (`tsx watch`, lendo o `.env`) |
| `npm run build` | `prisma generate` e compila o TypeScript para `dist/` |
| `npm start` | Executa a versão compilada (as variáveis vêm do ambiente) |
| `npm test` | Roda a suíte de testes (uma vez) |
| `npm run test:watch` | Testes em modo observação |
| `npm run typecheck:test` | Confere os tipos dos arquivos de teste |
| `npm run test:db:migrar` | Aplica as migrations no banco de teste (`.env.test`) |
| `npm run audit:prod` | `npm audit` só das dependências de produção |
| `npm run prisma:generate` | Gera o cliente do Prisma |
| `npm run prisma:migrate` | `prisma migrate dev` (cria e aplica migrations em desenvolvimento) |
| `npm run prisma:deploy` | `prisma migrate deploy` (aplica migrations em produção) |
| `npm run prisma:studio` | Abre o Prisma Studio |
| `npm run prisma:seed` | Cria o primeiro ADMIN |

---

## 15. Testes

A suíte usa Vitest e Supertest e roda **sem servidor no ar**, contra um banco de teste separado. Hoje são **82 testes** em 7 arquivos:

| Arquivo | O que cobre |
|---|---|
| `auth.test.ts` | Login, cookie, sessão, bloqueio de conta, troca de senha, logout |
| `csrf.test.ts` | Token, `Origin`, invalidação do token ao regenerar a sessão |
| `hardening.test.ts` | Helmet, CORS, preflight, cache, corpo grande, JSON malformado |
| `ratelimit.test.ts` | `429` no login |
| `rbac.test.ts` | Papéis, escopo por dono, salário, exclusão de funcionário |
| `validacao.test.ts` | Zod estrito, IDs, alocações, obras, conflitos |
| `auditoria.test.ts` | O que é registrado e o que **não** pode ser |

### Preparação (uma vez)

Os testes **apagam dados**, então precisam de um banco próprio, cujo nome termine em `_test`:

```bash
# 1. Cria o banco de teste (ajuste o usuário e o nome do container)
docker exec <container-do-postgres> psql -U <usuario> -d postgres -c 'CREATE DATABASE obras_test;'

# 2. Cria o .env.test a partir do .env.test.example
#    (mesma DATABASE_URL, trocando só o nome do banco para obras_test,
#     e um SESSION_SECRET diferente do de desenvolvimento)

# 3. Cria as tabelas no banco de teste
npm run test:db:migrar
```

### Execução

```bash
npm test
npm run typecheck:test
```

### Segurança dos próprios testes

- Os testes leem **somente** o `.env.test`, nunca o `.env`.
- Antes de rodar, o `tests/global-setup.ts` **recusa** continuar se o nome do banco não terminar em `_test`.
- O banco de teste é limpo no início de cada execução.
- Os logs ficam desligados nos testes (`LOG_LEVEL=silent`). Para conferir que o log não vaza dados sensíveis, suba o servidor com `NODE_ENV=test npm run dev 2>&1 | tee /tmp/api.log`, gere tráfego e procure por `cookie`, `x-csrf`, `authorization` e `senha` no arquivo.

---

## 16. Deploy

Ainda não realizado. Pontos que precisam ser atendidos:

- **HTTPS** obrigatório (o cookie de sessão é `Secure` em produção).
- `NODE_ENV=production`.
- `TRUST_PROXY` com o número correto de proxies na frente da API. Um valor errado quebra o `Secure` do cookie e o limite de requisições.
- **Frontend e API no mesmo *site*** (por exemplo `app.empresa.com.br` e `api.empresa.com.br`): o cookie usa `SameSite=Lax` e não é enviado entre sites diferentes.
- `FRONTEND_ORIGIN` igual à origem real do frontend.
- Segredos configurados no painel da hospedagem, nunca no Git (e diferentes dos de desenvolvimento).
- Migrations com `npm run prisma:deploy` (nunca `migrate dev`).
- Instalar as dependências com `npm ci --omit=dev` no ambiente que roda a API. O CLI do Prisma só é necessário na etapa de build e de migrations.
- Banco com persistência, backup automático e um teste de restauração.
- Usuário do banco com o mínimo de permissões.
- Remover `ADMIN_SENHA` do ambiente depois do primeiro login.
- Rotina de limpeza dos registros excluídos (veja a seção 18), por causa da LGPD.

---

## 17. Decisões e limitações conhecidas

- **Sessão em cookie** (e não JWT): permite revogar o acesso na hora. Exige cuidado com CSRF, tratado na seção 6.
- **RBAC com três papéis fixos**, mais a checagem de dono. Permissões configuráveis por usuário ficaram de fora.
- **Dinheiro como `Decimal` e texto no JSON**, para evitar erros de ponto flutuante.
- **Rate limit em memória:** os contadores reiniciam a cada deploy e não são compartilhados entre instâncias. Serve para uma instância só. Com várias, será preciso um armazenamento compartilhado.
- **Auditoria "melhor esforço":** se o banco falhar na hora de gravar, o evento pode se perder (o erro vai para o log).
- **Exclusão física por enquanto:** `DELETE` ainda apaga de verdade. O soft delete está planejado (seção 18).
- **Dependências do CLI do Prisma:** o `npm audit` aponta vulnerabilidades em pacotes transitivos do `prisma` (devDependency), como `deepmerge-ts` e `mysql2`. Esses pacotes não fazem parte do que roda em produção nem são usados pelo projeto (o banco é PostgreSQL). Vale reavaliar a cada atualização do Prisma.
- **Prisma 7 e TypeScript 5.9:** o Prisma 8 ainda está em *release candidate* e o TypeScript 7 é um salto grande de versão. Ambos ficam para depois.
- **E-mail dos usuários:** é sempre guardado em minúsculas, e o login também normaliza o que é digitado. O e-mail dos funcionários, por enquanto, é guardado como foi informado.

---

## 18. Próximos passos

1. **Soft delete:** `DELETE` passa a marcar `excluidoEm`; um filtro central no cliente Prisma esconde os registros excluídos; rotas para listar os excluídos e restaurá-los (somente ADMIN); a restauração **não** reativa o login do funcionário automaticamente.
2. **Limpeza agendada:** script (executado por um agendador externo) que apaga de vez registros excluídos há mais de `RETENCAO_DIAS` (prazo a definir com a equipe), com modo de simulação e registro na auditoria. Pode incluir também auditorias antigas, com prazo próprio.
3. **Deploy**, seguindo a seção 16.
4. **Frontend.**
5. **Documentação OpenAPI/Swagger.**