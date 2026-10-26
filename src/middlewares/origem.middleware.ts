import type { NextFunction, Request, Response } from "express";
import { env } from "../env.js";

const METODOS_SEGUROS = new Set(["GET", "HEAD", "OPTIONS"]);

export function verificarOrigem(req: Request, res: Response, next: NextFunction) {
    const origem = req.headers.origin;

    if (!METODOS_SEGUROS.has(req.method) && origem && origem !== env.FRONTEND_ORIGIN) {
        return res.status(403).json({ message: "Origem não permitida." });
    }

    next();
}