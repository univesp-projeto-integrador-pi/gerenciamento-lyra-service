import { afterAll, describe, expect, it } from "vitest";

process.env.LIMITE_LOGIN = "3";

const { default: request } = await import("supertest");
const { app } = await import("../src/app.js");
const { pool } = await import("../src/lib/session.js");
const { prisma } = await import("../src/lib/prisma.js");

afterAll(async () => {
    await pool.end();
    await prisma.$disconnect();
});

describe("rate limit do login", () => {
    it("as 3 primeiras tentativas passam (401) e a 4ª em diante recebem 429", async () => {
        const agente = request.agent(app);
        const { body } = await agente.get("/api/csrf-token");
        const status: number[] = [];

        for (let i = 0; i < 5; i++) {
            const resposta = await agente
                .post("/api/auth/login")
                .set("X-CSRF-Token", body.token)
                .send({ email: "ninguem@teste.com", senha: "qualquer-coisa-123" });
            status.push(resposta.status);
        }

        expect(status).toEqual([401, 401, 401, 429, 429]);
    });
});