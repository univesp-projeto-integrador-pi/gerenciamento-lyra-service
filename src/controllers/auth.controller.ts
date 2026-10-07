import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { opcoesCookie } from "../lib/session.js";
import {
    confereSenha,
    hashSenha,
    obterHashFalso,
    precisaAtualizarHash,
} from "../lib/senha.js";
import { loginSchema, trocarSenhaSchema } from "../schemas/auth.schema.js";

const LIMITE_FALHAS = 5;
const BLOQUEIO_MS = 15 * 60 * 1000;

function iniciarSessao(req: Request, usuarioId: number): Promise<void> {
    return new Promise((resolve, reject) => {
        req.session.regenerate((erro) => {
            if (erro) return reject(erro);
            req.session.usuarioId = usuarioId;
            req.session.save((erroSave) => (erroSave ? reject(erroSave) : resolve()));
        });
    });
}

export async function login(req: Request, res: Response) {
    const resultado = loginSchema.safeParse(req.body);

    if (!resultado.success) {
        return res.status(400).json({ message: "Dados inválidos." });
    }

    const { email, senha } = resultado.data;
    const usuario = await prisma.usuario.findUnique({ where: { email } });

    const senhaOk = await confereSenha(senha, usuario?.senhaHash ?? (await obterHashFalso()));
    const bloqueado = !!usuario?.bloqueadoAte && usuario.bloqueadoAte > new Date();

    if (!usuario || !usuario.ativo || bloqueado || !senhaOk) {
        if (usuario && usuario.ativo && !bloqueado) {
            const tentativas = usuario.tentativasFalhas + 1;
            await prisma.usuario.update({
                where: { id: usuario.id },
                data:
                    tentativas >= LIMITE_FALHAS
                        ? { tentativasFalhas: 0, bloqueadoAte: new Date(Date.now() + BLOQUEIO_MS) }
                        : { tentativasFalhas: tentativas },
            });
        }
        return res.status(401).json({ message: "Credenciais inválidas." });
    }

    await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
            tentativasFalhas: 0,
            bloqueadoAte: null,
            ...(precisaAtualizarHash(usuario.senhaHash) && { senhaHash: await hashSenha(senha) }),
        },
    });

    await iniciarSessao(req, usuario.id);

    return res.json({
        id: usuario.id,
        email: usuario.email,
        papel: usuario.papel,
        precisaTrocarSenha: usuario.precisaTrocarSenha,
    });
}

export function logout(req: Request, res: Response) {
    req.session.destroy((erro) => {
        if (erro) {
            return res.status(500).json({ message: "Erro interno." });
        }
        res.clearCookie("sid", opcoesCookie);
        return res.status(204).send();
    });
}

export function me(req: Request, res: Response) {
    return res.json(req.usuario);
}

export async function trocarSenha(req: Request, res: Response) {
    const resultado = trocarSenhaSchema.safeParse(req.body);

    if (!resultado.success) {
        return res.status(400).json({
            message: "Dados inválidos.",
            errors: resultado.error.flatten(),
        });
    }

    const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario!.id } });

    if (!usuario || !(await confereSenha(resultado.data.senhaAtual, usuario.senhaHash))) {
        return res.status(400).json({ message: "Senha atual incorreta." });
    }

    await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
            senhaHash: await hashSenha(resultado.data.novaSenha),
            precisaTrocarSenha: false,
        },
    });

    await prisma.$executeRaw`
    DELETE FROM "session"
    WHERE sess->>'usuarioId' = ${String(usuario.id)} AND sid <> ${req.sessionID}`;

    await iniciarSessao(req, usuario.id);

    return res.status(204).send();
}