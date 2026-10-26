import { afterAll, describe, expect, it } from "vitest";
import { encerrar, esperar, logarComo, novoCliente, prisma, unico } from "./helpers.js";

afterAll(encerrar);

describe("auditoria", () => {
    it("registra a alteração de salário só com o NOME do campo, nunca com os valores", async () => {
        const { cliente } = await logarComo("ADMIN");
        const id = unico();

        const criado = await cliente.post("/api/funcionarios", { nome: `Aud-${id}`, email: `aud-${id}@teste.com`, salario: "7777.77" });
        expect(criado.status).toBe(201);
        const funcionarioId = criado.body.id as number;
        expect((await cliente.put(`/api/funcionarios/${funcionarioId}`, { salario: "8888.88" })).status).toBe(200);

        const registros = await esperar(async () => {
            const lista = await prisma.auditoria.findMany({ where: { recurso: "funcionarios", recursoId: funcionarioId } });
            return lista.length >= 2 ? lista : null;
        });

        const alteracao = registros.find((r) => r.acao === "PUT /api/funcionarios/:id");
        expect(registros.map((r) => r.acao)).toContain("POST /api/funcionarios");
        expect(alteracao?.detalhes).toMatchObject({ campos: ["salario"] });
        expect(JSON.stringify(registros)).not.toContain("7777.77");
        expect(JSON.stringify(registros)).not.toContain("8888.88");
    });

    it("registra o login falho com o motivo, mas sem o e-mail digitado", async () => {
        const fantasma = `fantasma-${unico()}@teste.com`;
        const antes = await prisma.auditoria.count({ where: { acao: "LOGIN_FALHA" } });

        expect((await novoCliente().login(fantasma, "qualquer-coisa-123")).status).toBe(401);
        await esperar(async () => (await prisma.auditoria.count({ where: { acao: "LOGIN_FALHA" } })) > antes);

        const registros = await prisma.auditoria.findMany({ where: { acao: "LOGIN_FALHA" } });
        expect(JSON.stringify(registros)).toContain("usuario_inexistente");
        expect(JSON.stringify(registros)).not.toContain(fantasma);
    });

    it("registra o login com sucesso e o logout", async () => {
        const { cliente, usuario } = await logarComo("GESTOR");
        await cliente.post("/api/auth/logout");

        const registros = await esperar(async () => {
            const lista = await prisma.auditoria.findMany({ where: { usuarioId: usuario.id } });
            const acoes = lista.map((r) => r.acao);
            return acoes.includes("LOGIN_SUCESSO") && acoes.includes("LOGOUT") ? lista : null;
        });
        expect(registros.length).toBeGreaterThanOrEqual(2);
    });

    it("registra o acesso negado de quem tem login mas não tem permissão", async () => {
        const { cliente, usuario } = await logarComo("FUNCIONARIO");
        expect((await cliente.get("/api/funcionarios")).status).toBe(403);

        const registro = await esperar(() => prisma.auditoria.findFirst({ where: { usuarioId: usuario.id, acao: "ACESSO_NEGADO" } }));
        expect(registro.recurso).toBe("funcionarios");
    });

    it("não registra a tentativa de quem nem tem login (401)", async () => {
        const antes = await prisma.auditoria.count({ where: { acao: "ACESSO_NEGADO" } });
        expect((await novoCliente().get("/api/funcionarios")).status).toBe(401);
        await new Promise((resolver) => setTimeout(resolver, 300));
        expect(await prisma.auditoria.count({ where: { acao: "ACESSO_NEGADO" } })).toBe(antes);
    });

    it("só o ADMIN consulta, e os parâmetros são validados", async () => {
        const { cliente: admin } = await logarComo("ADMIN");
        const { cliente: gestor } = await logarComo("GESTOR");

        expect((await gestor.get("/api/auditoria")).status).toBe(403);
        expect((await admin.get("/api/auditoria?limite=5")).status).toBe(200);
        expect((await admin.get("/api/auditoria?foo=1")).status).toBe(400);
        expect((await admin.get("/api/auditoria?limite=999")).status).toBe(400);
    });
});