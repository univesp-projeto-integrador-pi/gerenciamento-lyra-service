import { afterAll, describe, expect, it } from "vitest";
import { criarUsuario, encerrar, logarComo, novoCliente, ORIGEM } from "./helpers.js";

afterAll(encerrar);

const obra = () => ({ nome: "Obra CSRF" });

describe("CSRF", () => {
    it("GET não exige token", async () => {
        const { cliente } = await logarComo("GESTOR");
        expect((await cliente.get("/api/obras")).status).toBe(200);
    });

    it("mutação sem token é recusada, com mensagem em JSON", async () => {
        const { cliente } = await logarComo("GESTOR");
        const resposta = await cliente.agente.post("/api/obras").send(obra());

        expect(resposta.status).toBe(403);
        expect(resposta.body.message).toMatch(/CSRF/);
    });

    it("token falso é recusado", async () => {
        const { cliente } = await logarComo("GESTOR");
        const resposta = await cliente.agente.post("/api/obras").set("X-CSRF-Token", "token-falso").send(obra());
        expect(resposta.status).toBe(403);
    });

    it("token de OUTRA sessão é recusado", async () => {
        const { cliente } = await logarComo("GESTOR");
        const tokenAlheio = await novoCliente().token();
        const resposta = await cliente.agente.post("/api/obras").set("X-CSRF-Token", tokenAlheio).send(obra());
        expect(resposta.status).toBe(403);
    });

    it("o token anterior ao login deixa de valer", async () => {
        const usuario = await criarUsuario("GESTOR");
        const cliente = novoCliente();
        const antigo = await cliente.token();
        await cliente.login(usuario.email);

        const resposta = await cliente.agente.post("/api/obras").set("X-CSRF-Token", antigo).send(obra());
        expect(resposta.status).toBe(403);
    });

    it("token certo, mas com Origin estranha, é recusado", async () => {
        const { cliente } = await logarComo("GESTOR");
        const csrf = await cliente.token();
        const resposta = await cliente.agente
            .post("/api/obras")
            .set("X-CSRF-Token", csrf)
            .set("Origin", "http://evil.example")
            .send(obra());

        expect(resposta.status).toBe(403);
        expect(resposta.body.message).toBe("Origem não permitida.");
    });

    it("token certo e Origin do frontend passam", async () => {
        const { cliente } = await logarComo("GESTOR");
        const csrf = await cliente.token();
        const resposta = await cliente.agente
            .post("/api/obras")
            .set("X-CSRF-Token", csrf)
            .set("Origin", ORIGEM)
            .send(obra());

        expect(resposta.status).toBe(201);
    });

    it("o login também exige o token", async () => {
        const usuario = await criarUsuario("GESTOR");
        const resposta = await novoCliente().agente
            .post("/api/auth/login")
            .send({ email: usuario.email, senha: "senha-de-teste-123" });
        expect(resposta.status).toBe(403);
    });
});