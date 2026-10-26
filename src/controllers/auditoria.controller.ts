import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const consultaSchema = z.strictObject({
    limite: z.coerce.number().int().min(1).max(200).default(50),
    acao: z.string().max(100).optional(),
    recurso: z.string().max(50).optional(),
    recursoId: z.coerce.number().int().positive().optional(),
    usuarioId: z.coerce.number().int().positive().optional(),
});

export async function listarAuditoria(req: Request, res: Response) {
    const resultado = consultaSchema.safeParse(req.query);

    if (!resultado.success) {
        return res.status(400).json({
            message: "Parâmetros inválidos.",
            errors: resultado.error.flatten(),
        });
    }

    const { limite, ...filtros } = resultado.data;

    const registros = await prisma.auditoria.findMany({
        where: filtros,
        orderBy: { id: "desc" },
        take: limite,
    });

    return res.json(registros);
}