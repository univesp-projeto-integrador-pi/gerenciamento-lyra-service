import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { pool } from "../src/lib/session.js";
import { hashSenha } from "../src/lib/senha.js";

export { app, prisma };

export const ORIGEM = process.env.FRONTEND_ORIGIN as string;
export const SENHA = "senha-de-teste-123";

let contador = 0;
export const unico = () => `${Date.now().toString(36)}${(++contador).toString(36)}`;

export type Papel = "ADMIN" | "GESTOR" | "FUNCIONARIO";
type Opcoes = { funcionarioId?: number; precisaTrocarSenha?: boolean; ativo?: boolean };

export function criarUsuario(papel: Papel, opcoes: Opcoes = {}) {
    return hashSenha(SENHA).then((senhaHash) =>
        prisma.usuario.create({
            data: {
                email: `${papel.toLowerCase()}-${unico()}@teste.com`,
                senhaHash,
                papel,
                ativo: opcoes.ativo ?? true,
                precisaTrocarSenha: opcoes.precisaTrocarSenha ?? false,
                funcionarioId: opcoes.funcionarioId ?? null,
            },
        }),
    );
}

export function novoCliente() {
    const agente = request.agent(app);

    const token = async (): Promise<string> => (await agente.get("/api/csrf-token")).body.token;

    const enviar = async (metodo: "post" | "put" | "patch" | "delete", url: string, corpo?: object) => {
        const csrf = await token();
        const req = agente[metodo](url).set("X-CSRF-Token", csrf);
        return corpo ? req.send(corpo) : req;
    };

    return {
        agente,
        token,
        get: (url: string) => agente.get(url),
        post: (url: string, corpo?: object) => enviar("post", url, corpo),
        put: (url: string, corpo?: object) => enviar("put", url, corpo),
        patch: (url: string, corpo?: object) => enviar("patch", url, corpo),
        del: (url: string) => enviar("delete", url),
        login: (email: string, senha = SENHA) => enviar("post", "/api/auth/login", { email, senha }),
    };
}

export type Cliente = ReturnType<typeof novoCliente>;

export async function logarComo(papel: Papel, opcoes: Opcoes = {}) {
    const usuario = await criarUsuario(papel, opcoes);
    const cliente = novoCliente();
    const resposta = await cliente.login(usuario.email);

    if (resposta.status !== 200) {
        throw new Error(`Falha ao entrar como ${papel} (${resposta.status}): ${JSON.stringify(resposta.body)}`);
    }

    return { cliente, usuario };
}

export function linhaDoCookie(resposta: request.Response): string {
    const lista = (resposta.headers["set-cookie"] as unknown as string[] | undefined) ?? [];
    return lista.find((c) => c.startsWith("sid=")) ?? "";
}

export const valorDoSid = (resposta: request.Response) => linhaDoCookie(resposta).split(";")[0] ?? "";

export async function esperar<T>(buscar: () => Promise<T | null | undefined | false>, ms = 3000): Promise<T> {
    const limite = Date.now() + ms;
    for (; ;) {
        const valor = await buscar();
        if (valor) return valor;
        if (Date.now() > limite) throw new Error("Tempo esgotado esperando o resultado.");
        await new Promise((resolver) => setTimeout(resolver, 50));
    }
}

export async function encerrar() {
    await pool.end();
    await prisma.$disconnect();
}