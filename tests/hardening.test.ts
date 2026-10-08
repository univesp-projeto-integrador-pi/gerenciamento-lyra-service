import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { app, encerrar, ORIGEM } from "./helpers.js";

afterAll(encerrar);

describe("cabeçalhos e CORS", () => {
    it("Helmet: nosniff e HSTS presentes, X-Powered-By removido", async () => {
        const { headers } = await request(app).get("/health");
        expect(headers["x-content-type-options"]).toBe("nosniff");
        expect(headers["strict-transport-security"]).toBeDefined();
        expect(headers["x-powered-by"]).toBeUndefined();
    });

    it("respostas de /api não ficam em cache", async () => {
        const { headers } = await request(app).get("/api/auth/me");
        expect(headers["cache-control"]).toContain("no-store");
    });

    it("CORS libera só a origem do frontend, com credenciais", async () => {
        const { headers } = await request(app).get("/health").set("Origin", ORIGEM);
        expect(headers["access-control-allow-origin"]).toBe(ORIGEM);
        expect(headers["access-control-allow-credentials"]).toBe("true");
    });

    it("CORS não reflete uma origem estranha", async () => {
        const { headers } = await request(app).get("/health").set("Origin", "http://evil.example");
        expect(headers["access-control-allow-origin"]).not.toBe("http://evil.example");
    });

    it("o preflight responde 204 sem exigir login e libera PATCH e o token CSRF", async () => {
        const resposta = await request(app)
            .options("/api/usuarios/1")
            .set("Origin", ORIGEM)
            .set("Access-Control-Request-Method", "PATCH")
            .set("Access-Control-Request-Headers", "content-type,x-csrf-token");

        expect(resposta.status).toBe(204);
        expect(resposta.headers["access-control-allow-methods"]).toContain("PATCH");
        expect(String(resposta.headers["access-control-allow-headers"]).toLowerCase()).toContain("x-csrf-token");
    });
});

describe("entrada e erros", () => {
    it("corpo grande demais: 413 em JSON", async () => {
        const resposta = await request(app)
            .post("/api/auth/login")
            .set("Content-Type", "application/json")
            .send(JSON.stringify({ email: "a@a.com", senha: "a".repeat(20000) }));

        expect(resposta.status).toBe(413);
        expect(resposta.body.message).toBeDefined();
    });

    it("JSON malformado: 400 em JSON, sem stack trace", async () => {
        const resposta = await request(app).post("/api/auth/login").set("Content-Type", "application/json").send('{"email":');

        expect(resposta.status).toBe(400);
        expect(resposta.body.message).toBe("JSON inválido.");
        expect(resposta.text).not.toContain("node_modules");
    });

    it("rota inexistente sem login dá 401 (não revela quais rotas existem)", async () => {
        expect((await request(app).get("/api/qualquer-coisa")).status).toBe(401);
    });
});