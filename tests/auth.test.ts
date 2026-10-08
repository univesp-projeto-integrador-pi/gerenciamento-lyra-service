import { afterAll, describe, expect, it } from "vitest";
import { criarUsuario, encerrar, linhaDoCookie, novoCliente, prisma, SENHA, valorDoSid } from "./helpers.js";

afterAll(encerrar);

describe("autenticação", () => {
    it("sem login, /me responde 401", async () => {
        expect((await novoCliente().get("/api/auth/me")).status).toBe(401);
    });

    it("login correto devolve o usuário e um cookie HttpOnly com SameSite=Lax", async () => {
        const usuario = await criarUsuario("GESTOR");
        const resposta = await novoCliente().login(usuario.email);

        expect(resposta.status).toBe(200);
        expect(resposta.body).toMatchObject({ id: usuario.id, papel: "GESTOR" });
        expect(JSON.stringify(resposta.body)).not.toMatch(/senhaHash|argon2/);

        const cookie = linhaDoCookie(resposta);
        expect(cookie).toMatch(/HttpOnly/i);
        expect(cookie).toMatch(/SameSite=Lax/i);
    });

    it("e-mail inexistente e senha errada recebem a mesma resposta (sem enumeração)", async () => {
        const usuario = await criarUsuario("GESTOR");
        const senhaErrada = await novoCliente().login(usuario.email, "senha-errada-123");
        const inexistente = await novoCliente().login("ninguem-aqui@teste.com", SENHA);

        expect(senhaErrada.status).toBe(401);
        expect(inexistente.status).toBe(401);
        expect(senhaErrada.body).toEqual(inexistente.body);
    });

    it("troca o ID da sessão no login (anti session fixation)", async () => {
        const usuario = await criarUsuario("GESTOR");
        const cliente = novoCliente();
        const antes = valorDoSid(await cliente.agente.get("/api/csrf-token"));
        const depois = valorDoSid(await cliente.login(usuario.email));

        expect(antes).not.toBe("");
        expect(depois).not.toBe("");
        expect(depois).not.toBe(antes);
    });

    it("conta inativa não entra", async () => {
        const usuario = await criarUsuario("GESTOR", { ativo: false });
        expect((await novoCliente().login(usuario.email)).status).toBe(401);
    });

    it("bloqueia a conta depois de 5 senhas erradas, mesmo com a senha certa", async () => {
        const usuario = await criarUsuario("GESTOR");
        const cliente = novoCliente();

        for (let i = 0; i < 5; i++) {
            expect((await cliente.login(usuario.email, "senha-errada-123")).status).toBe(401);
        }

        expect((await cliente.login(usuario.email, SENHA)).status).toBe(401);
        const atualizado = await prisma.usuario.findUnique({ where: { id: usuario.id } });
        expect(atualizado?.bloqueadoAte).not.toBeNull();
    });

    it("logout encerra a sessão", async () => {
        const usuario = await criarUsuario("GESTOR");
        const cliente = novoCliente();
        await cliente.login(usuario.email);

        expect((await cliente.get("/api/auth/me")).status).toBe(200);
        expect((await cliente.post("/api/auth/logout")).status).toBe(204);
        expect((await cliente.get("/api/auth/me")).status).toBe(401);
    });

    it("desativar a conta derruba a sessão na hora", async () => {
        const usuario = await criarUsuario("GESTOR");
        const cliente = novoCliente();
        await cliente.login(usuario.email);
        expect((await cliente.get("/api/auth/me")).status).toBe(200);

        await prisma.usuario.update({ where: { id: usuario.id }, data: { ativo: false } });
        expect((await cliente.get("/api/auth/me")).status).toBe(401);
    });

    it("senha provisória bloqueia as rotas até ser trocada", async () => {
        const usuario = await criarUsuario("GESTOR", { precisaTrocarSenha: true });
        const cliente = novoCliente();
        const login = await cliente.login(usuario.email);
        expect(login.body.precisaTrocarSenha).toBe(true);

        expect((await cliente.get("/api/obras")).status).toBe(403);
        expect((await cliente.post("/api/auth/trocar-senha", { senhaAtual: "errada-errada-1", novaSenha: "nova-senha-longa-456" })).status).toBe(400);
        expect((await cliente.post("/api/auth/trocar-senha", { senhaAtual: SENHA, novaSenha: "nova-senha-longa-456" })).status).toBe(204);
        expect((await cliente.get("/api/obras")).status).toBe(200);
    });

    it("a nova senha precisa ser diferente e ter 10+ caracteres", async () => {
        const usuario = await criarUsuario("GESTOR");
        const cliente = novoCliente();
        await cliente.login(usuario.email);

        expect((await cliente.post("/api/auth/trocar-senha", { senhaAtual: SENHA, novaSenha: SENHA })).status).toBe(400);
        expect((await cliente.post("/api/auth/trocar-senha", { senhaAtual: SENHA, novaSenha: "curta" })).status).toBe(400);
    });
});