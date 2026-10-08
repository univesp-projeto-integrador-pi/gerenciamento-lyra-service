import type { Request } from "express";
import { prisma } from "./prisma.js";

type Detalhes = Record<string, string | number | boolean | null | string[]>;

export type EventoAuditoria = {
    acao: string;
    usuarioId?: number | null;
    recurso?: string;
    recursoId?: number | null;
    detalhes?: Detalhes;
};

export async function auditar(req: Request, evento: EventoAuditoria): Promise<void> {
    try {
        await prisma.auditoria.create({
            data: {
                acao: evento.acao,
                usuarioId: evento.usuarioId ?? req.usuario?.id ?? null,
                recurso: evento.recurso ?? null,
                recursoId: evento.recursoId ?? null,
                detalhes: evento.detalhes,
                ip: req.ip ?? null,
            },
        });
    } catch (erro) {
        req.log.error({ err: erro, acao: evento.acao }, "Falha ao gravar a auditoria");
    }
}