import type { NextFunction, Request, Response } from "express";
import { codigoDoErro } from "../lib/erros-prisma.js";

type ErroComStatus = { status?: unknown; statusCode?: unknown; type?: unknown; message?: unknown };

function statusDoErro(erro: unknown): number | undefined {
    if (typeof erro !== "object" || erro === null) return undefined;
    const { status, statusCode } = erro as ErroComStatus;
    const valor = typeof status === "number" ? status : typeof statusCode === "number" ? statusCode : undefined;
    return valor !== undefined && valor >= 400 && valor < 600 ? valor : undefined;
}

export function tratarErros(erro: unknown, req: Request, res: Response, next: NextFunction) {
    if (res.headersSent) return next(erro);

    const dados = typeof erro === "object" && erro !== null ? (erro as ErroComStatus) : {};
    const codigo = codigoDoErro(erro);
    const status = statusDoErro(erro);
    const mensagem = typeof dados.message === "string" ? dados.message : "";

    if (dados.type === "entity.parse.failed") {
        return res.status(400).json({ message: "JSON inválido." });
    }
    if (dados.type === "entity.too.large") {
        return res.status(413).json({ message: "Corpo da requisição grande demais." });
    }
    if (codigo === "EBADCSRFTOKEN" || (status === 403 && /csrf/i.test(mensagem))) {
        return res.status(403).json({ message: "Token CSRF inválido ou ausente." });
    }
    if (codigo === "P2002") {
        return res.status(409).json({ message: "Já existe um registro com estes dados." });
    }
    if (codigo === "P2025") {
        return res.status(404).json({ message: "Registro não encontrado." });
    }
    if (codigo === "P2003") {
        return res.status(409).json({ message: "A operação conflita com registros relacionados." });
    }

    if (status !== undefined && status < 500) {
        return res.status(status).json({ message: status === 403 ? "Acesso negado." : "Requisição inválida." });
    }

    console.error(`[erro] ${req.method} ${req.path}`, erro);
    return res.status(500).json({ message: "Erro interno." });
}