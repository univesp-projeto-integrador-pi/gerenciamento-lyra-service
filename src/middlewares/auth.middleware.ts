import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { opcoesCookie } from "../lib/session.js";

export async function autenticar(req: Request, res: Response, next: NextFunction) {
    const id = req.session.usuarioId;

    if (!id) {
        return res.status(401).json({ message: "Não autenticado." });
    }

    const usuario = await prisma.usuario.findUnique({
        where: { id },
        select: {
            id: true,
            email: true,
            papel: true,
            ativo: true,
            funcionarioId: true,
            precisaTrocarSenha: true,
        },
    });

    if (!usuario || !usuario.ativo) {
        req.session.destroy(() => {
            res.clearCookie("sid", opcoesCookie);
            res.status(401).json({ message: "Não autenticado." });
        });
        return;
    }

    req.usuario = {
        id: usuario.id,
        email: usuario.email,
        papel: usuario.papel,
        funcionarioId: usuario.funcionarioId,
        precisaTrocarSenha: usuario.precisaTrocarSenha,
    };

    next();
}

export function exigirSenhaTrocada(req: Request, res: Response, next: NextFunction) {
    if (req.usuario?.precisaTrocarSenha) {
        return res.status(403).json({ message: "Troque a senha provisória antes de continuar." });
    }
    next();
}

export function exigirPapel(...papeis: Array<"ADMIN" | "GESTOR" | "FUNCIONARIO">) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.usuario || !papeis.includes(req.usuario.papel)) {
            return res.status(403).json({ message: "Acesso negado." });
        }
        next();
    };
}