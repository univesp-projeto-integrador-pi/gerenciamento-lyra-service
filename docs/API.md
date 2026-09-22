# Documentação rápida da API

Base URL:

```text
http://localhost:3000/api
```

## Funcionários

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/funcionarios` | Lista funcionários |
| GET | `/funcionarios/:id` | Busca funcionário |
| POST | `/funcionarios` | Cria funcionário |
| PUT | `/funcionarios/:id` | Atualiza funcionário |
| DELETE | `/funcionarios/:id` | Remove funcionário |

## Obras

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/obras` | Lista obras |
| GET | `/obras/:id` | Busca obra |
| POST | `/obras` | Cria obra |
| PUT | `/obras/:id` | Atualiza obra |
| DELETE | `/obras/:id` | Remove obra |

## Relacionamento

O relacionamento é N:N:

```text
Funcionário
    │
    │ 1:N
    ▼
Alocação
    ▲
    │ N:1
    │
Obra
```

Um funcionário pode participar de várias obras e uma obra pode possuir vários funcionários.

A tabela intermediária é:

```text
alocacoes
- id
- funcionarioId
- obraId
- criadoEm
```

Ainda não existem endpoints para manipular `alocacoes` nesta versão.
