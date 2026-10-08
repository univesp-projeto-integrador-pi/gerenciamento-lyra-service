import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { encerrar, logarComo, novoCliente, prisma, unico, type Cliente } from "./helpers.js";

const id = unico();
let admin: Cliente;
let gestor: Cliente;
let func: Cliente;
let faId = 0;
let fbId = 0;
let oxId = 0;
let oyId = 0;
let funcUsuarioId = 0;

beforeAll(async () => {
    const fa = await prisma.funcionario.create({ data: { nome: `FuncA-${id}`, email: `a-${id}@teste.com`, salario: "3500.00" } });
    const fb = await prisma.funcionario.create({ data: { nome: `FuncB-${id}`, email: `b-${id}@teste.com`, salario: "4200.00" } });
    const ox = await prisma.obra.create({ data: { nome: `ObraX-${id}` } });
    const oy = await prisma.obra.create({ data: { nome: `ObraY-${id}` } });
    await prisma.alocacao.createMany({
        data: [
            { funcionarioId: fa.id, obraId: ox.id },
            { funcionarioId: fb.id, obraId: oy.id },
        ],
    });
    [faId, fbId, oxId, oyId] = [fa.id, fb.id, ox.id, oy.id];

    admin = (await logarComo("ADMIN")).cliente;
    gestor = (await logarComo("GESTOR")).cliente;
    const f = await logarComo("FUNCIONARIO", { funcionarioId: faId });
    func = f.cliente;
    funcUsuarioId = f.usuario.id;
});

afterAll(encerrar);

describe("sem login", () => {
    it.each(["/api/funcionarios", "/api/obras", "/api/alocacoes", "/api/usuarios", "/api/auditoria"])(
        "GET %s → 401",
        async (url) => {
            expect((await novoCliente().get(url)).status).toBe(401);
        },
    );

    it.each([
        ["post", "/api/obras"],
        ["put", "/api/obras/1"],
        ["patch", "/api/usuarios/1"],
    ] as const)("%s %s (com token CSRF) → 401", async (metodo, url) => {
        expect((await novoCliente()[metodo](url, {})).status).toBe(401);
    });

    it("DELETE (com token CSRF) → 401", async () => {
        expect((await novoCliente().del("/api/funcionarios/1")).status).toBe(401);
    });
});

describe("ADMIN", () => {
    it("vê o salário dos funcionários", async () => {
        const lista = (await admin.get("/api/funcionarios")).body as Array<{ id: number; salario?: string }>;
        expect(Number(lista.find((f) => f.id === faId)?.salario)).toBe(3500);
    });

    it("vê a equipe das obras, mas sem salário nem e-mail", async () => {
        const resposta = await admin.get("/api/obras");
        expect(JSON.stringify(resposta.body)).toContain(`FuncA-${id}`);
        expect(JSON.stringify(resposta.body)).not.toContain('"salario"');
        expect(JSON.stringify(resposta.body)).not.toContain(`a-${id}@teste.com`);
    });

    it("cria usuário para um funcionário usando o e-mail dele em minúsculas, sem expor o hash", async () => {
        const f = await prisma.funcionario.create({ data: { nome: `Novo-${id}`, email: `Novo-${id}@Teste.COM` } });
        const resposta = await admin.post("/api/usuarios", { funcionarioId: f.id, senhaTemporaria: "provisoria-longa-123" });

        expect(resposta.status).toBe(201);
        expect(resposta.body.email).toBe(`novo-${id}@teste.com`);
        expect(JSON.stringify(resposta.body)).not.toContain("senhaHash");
        expect((await admin.post("/api/usuarios", { funcionarioId: f.id, senhaTemporaria: "provisoria-longa-123" })).status).toBe(409);
    });

    it("não consegue desativar a própria conta", async () => {
        const eu = (await admin.get("/api/auth/me")).body;
        expect((await admin.patch(`/api/usuarios/${eu.id}`, { ativo: false })).status).toBe(400);
    });

    it("a lista de usuários nunca traz o hash da senha", async () => {
        const resposta = await admin.get("/api/usuarios");
        expect(resposta.status).toBe(200);
        expect(JSON.stringify(resposta.body)).not.toMatch(/senhaHash|argon2/);
    });

    it("excluir um funcionário desativa o login dele na hora", async () => {
        const f = await prisma.funcionario.create({ data: { nome: `Saindo-${id}`, email: `saindo-${id}@teste.com` } });
        const entrada = await logarComo("FUNCIONARIO", { funcionarioId: f.id });

        expect((await entrada.cliente.get("/api/auth/me")).status).toBe(200);
        expect((await admin.del(`/api/funcionarios/${f.id}`)).status).toBe(204);
        expect((await entrada.cliente.get("/api/auth/me")).status).toBe(401);
        expect((await prisma.usuario.findUnique({ where: { id: entrada.usuario.id } }))?.ativo).toBe(false);
    });
});

describe("GESTOR", () => {
    it("lista funcionários, mas sem o salário", async () => {
        const resposta = await gestor.get("/api/funcionarios");
        expect(resposta.status).toBe(200);
        expect(JSON.stringify(resposta.body)).not.toContain('"salario"');
    });

    it("vê um funcionário sem o salário", async () => {
        const resposta = await gestor.get(`/api/funcionarios/${faId}`);
        expect(resposta.status).toBe(200);
        expect(resposta.body).not.toHaveProperty("salario");
    });

    it("não cria, edita nem exclui funcionários", async () => {
        expect((await gestor.post("/api/funcionarios", { nome: "Xx", email: `x-${id}@teste.com` })).status).toBe(403);
        expect((await gestor.put(`/api/funcionarios/${fbId}`, { cargo: "Chefe" })).status).toBe(403);
        expect((await gestor.del(`/api/funcionarios/${fbId}`)).status).toBe(403);
    });

    it("cria obras e alocações", async () => {
        const obra = await gestor.post("/api/obras", { nome: `ObraG-${id}` });
        expect(obra.status).toBe(201);

        expect((await gestor.post("/api/alocacoes", { funcionarioId: fbId, obraId: obra.body.id })).status).toBe(201);
    });

    it("não acessa a gestão de usuários nem a auditoria", async () => {
        expect((await gestor.get("/api/usuarios")).status).toBe(403);
        expect((await gestor.get("/api/auditoria")).status).toBe(403);
    });
});

describe("FUNCIONARIO", () => {
    it("não lista funcionários", async () => {
        expect((await func.get("/api/funcionarios")).status).toBe(403);
    });

    it("vê o próprio cadastro, com o próprio salário", async () => {
        const resposta = await func.get(`/api/funcionarios/${faId}`);
        expect(resposta.status).toBe(200);
        expect(Number(resposta.body.salario)).toBe(3500);
    });

    it("o cadastro de outro funcionário 'não existe' (404, não 403)", async () => {
        expect((await func.get(`/api/funcionarios/${fbId}`)).status).toBe(404);
    });

    it("só vê as obras em que está alocado, sem a equipe", async () => {
        const lista = (await func.get("/api/obras")).body as Array<{ nome: string; alocacoes?: unknown }>;
        const nomes = lista.map((o) => o.nome);

        expect(nomes).toContain(`ObraX-${id}`);
        expect(nomes).not.toContain(`ObraY-${id}`);
        expect(lista.every((o) => o.alocacoes === undefined)).toBe(true);
    });

    it("a obra de outro é 404, a própria é 200", async () => {
        expect((await func.get(`/api/obras/${oyId}`)).status).toBe(404);
        expect((await func.get(`/api/obras/${oxId}`)).status).toBe(200);
    });

    it("só vê as próprias alocações", async () => {
        const lista = (await func.get("/api/alocacoes")).body as Array<{ funcionarioId: number }>;
        expect(lista.length).toBeGreaterThan(0);
        expect(lista.every((a) => a.funcionarioId === faId)).toBe(true);
    });

    it("não altera nada: obras, alocações, usuários, auditoria", async () => {
        expect((await func.post("/api/obras", { nome: "Invasão" })).status).toBe(403);
        expect((await func.post("/api/alocacoes", { funcionarioId: faId, obraId: oyId })).status).toBe(403);
        expect((await func.del(`/api/obras/${oxId}`)).status).toBe(403);
        expect((await func.get("/api/usuarios")).status).toBe(403);
        expect((await func.get("/api/auditoria")).status).toBe(403);
        expect(funcUsuarioId).toBeGreaterThan(0);
    });
});