import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { encerrar, logarComo, prisma, unico, type Cliente } from "./helpers.js";

const id = unico();
let admin: Cliente;
let funcionarioId = 0;
let obraId = 0;

beforeAll(async () => {
    funcionarioId = (await prisma.funcionario.create({ data: { nome: `Val-${id}`, email: `val-${id}@teste.com` } })).id;
    obraId = (await prisma.obra.create({ data: { nome: `ObraVal-${id}` } })).id;
    admin = (await logarComo("ADMIN")).cliente;
});

afterAll(encerrar);

describe("alocações", () => {
    it.each([
        ["corpo vazio", {}],
        ["ids como texto", { funcionarioId: "1", obraId: 1 }],
        ["id decimal", { funcionarioId: 1.5, obraId: 1 }],
        ["id negativo", { funcionarioId: -1, obraId: 1 }],
        ["id zero", { funcionarioId: 0, obraId: 1 }],
        ["campo extra", { funcionarioId: 1, obraId: 1, extra: true }],
    ])("%s → 400", async (_descricao, corpo) => {
        expect((await admin.post("/api/alocacoes", corpo)).status).toBe(400);
    });

    it("funcionário ou obra inexistentes → 404", async () => {
        expect((await admin.post("/api/alocacoes", { funcionarioId: 999999, obraId })).status).toBe(404);
        expect((await admin.post("/api/alocacoes", { funcionarioId, obraId: 999999 })).status).toBe(404);
    });

    it("a mesma alocação duas vezes → 201 e depois 409", async () => {
        expect((await admin.post("/api/alocacoes", { funcionarioId, obraId })).status).toBe(201);
        expect((await admin.post("/api/alocacoes", { funcionarioId, obraId })).status).toBe(409);
    });
});

describe("obras", () => {
    it.each([
        ["campo extra", { nome: "Teste", extra: 1 }],
        ["status inválido", { nome: "Teste", status: "XYZ" }],
        ["nome curto demais", { nome: "A" }],
        ["data de término antes da de início", { nome: "Teste", dataInicio: "2026-10-10", dataFim: "2026-10-01" }],
    ])("%s → 400", async (_descricao, corpo) => {
        expect((await admin.post("/api/obras", corpo)).status).toBe(400);
    });

    it("obra válida, e atualização parcial", async () => {
        const criada = await admin.post("/api/obras", { nome: `Obra-${id}`, dataInicio: "2026-10-01", dataFim: "2026-12-01" });
        expect(criada.status).toBe(201);

        const atualizada = await admin.put(`/api/obras/${criada.body.id}`, { status: "CONCLUIDA" });
        expect(atualizada.status).toBe(200);
        expect(atualizada.body.status).toBe("CONCLUIDA");
        expect((await admin.put(`/api/obras/${criada.body.id}`, { status: "CONCLUIDA", extra: 1 })).status).toBe(400);
    });
});

describe("funcionários", () => {
    it("campo extra (tentativa de mass assignment) → 400", async () => {
        expect((await admin.post("/api/funcionarios", { nome: "Xx", email: `x-${id}@teste.com`, papel: "ADMIN" })).status).toBe(400);
    });

    it("salário em formato inválido → 400", async () => {
        expect((await admin.post("/api/funcionarios", { nome: "Xx", email: `y-${id}@teste.com`, salario: "abc" })).status).toBe(400);
        expect((await admin.post("/api/funcionarios", { nome: "Xx", email: `z-${id}@teste.com`, salario: 3500 })).status).toBe(400);
    });

    it("nome longo demais → 400", async () => {
        expect((await admin.post("/api/funcionarios", { nome: "a".repeat(150), email: `w-${id}@teste.com` })).status).toBe(400);
    });

    it("e-mail repetido → 409", async () => {
        const corpo = { nome: "Repetido", email: `rep-${id}@teste.com` };
        expect((await admin.post("/api/funcionarios", corpo)).status).toBe(201);
        expect((await admin.post("/api/funcionarios", corpo)).status).toBe(409);
    });
});

describe("ids nas rotas", () => {
    it.each(["/api/funcionarios/abc", "/api/obras/abc", "/api/alocacoes/abc", "/api/funcionarios/-1", "/api/obras/1.5"])(
        "GET %s → 400",
        async (url) => {
            expect((await admin.get(url)).status).toBe(400);
        },
    );
});