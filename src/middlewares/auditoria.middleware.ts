import type { NextFunction, Request, Response } from "express";
import { auditar } from "../lib/auditoria.js";

const METODOS_QUE_ALTERAM = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function auditarRequisicoes(req: Request, res: Response, next: NextFunction) {
    if (req.originalUrl.startsWith("/api/auth")) return next();

    let idCriado: number | null = null;
    const jsonOriginal = res.json.bind(res);
    res.json = ((corpo?: unknown) => {
        if (corpo && typeof corpo === "object" && "id" in corpo && typeof corpo.id === "number") {
            idCriado = corpo.id;
        }
        return jsonOriginal(corpo);
    }) as typeof res.json;

    res.on("finish", () => {
        const caminho = req.originalUrl.split("?")[0] ?? "";
        const molde = caminho.replace(/\/\d+/g, "/:id");
        const recurso = caminho.split("/")[2];
        const idDaUrl = /\/(\d+)(?:\/|$)/.exec(caminho)?.[1];
        const recursoId = idDaUrl ? Number(idDaUrl) : idCriado;

        if (METODOS_QUE_ALTERAM.has(req.method) && res.statusCode < 400) {
            const corpo = req.body as unknown;
            const campos = corpo && typeof corpo === "object" ? Object.keys(corpo) : [];
            void auditar(req, {
                acao: `${req.method} ${molde}`,
                recurso,
                recursoId,
                detalhes: { status: res.statusCode, campos },
            });
        } else if (res.statusCode === 403) {
            void auditar(req, {
                acao: "ACESSO_NEGADO",
                recurso,
                recursoId,
                detalhes: { metodo: req.method, caminho: molde },
            });
        }
    });

    next();
}