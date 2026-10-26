import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { hashSenha } from "../lib/senha.js";
import { lerId } from "../lib/params.js";
import { ehViolacaoDeUnicidade } from "../lib/erros-prisma.js";
import {
    atualizarUsuarioSchema,
    criarUsuarioSchema,
    redefinirSenhaSchema,
} from "../schemas/usuario.schema.js";

const selectPublico = {
    id: true,
    email: true,
    papel: true,
    ativo: true,
    precisaTrocarSenha: true,
    bloqueadoAte: true,
    criadoEm: true,
    funcionario: { select: { id: true, nome: true } },
} as const;

async function encerrarSessoes(usuarioId: number) {
    await prisma.$executeRaw`
    DELETE FROM "session" WHERE sess->>'usuarioId' = ${String(usuarioId)}
  `;
}

export async function listarUsuarios(_req: Request, res: Response) {
    const usuarios = await prisma.usuario.findMany({
        select: selectPublico,
        orderBy: { id: "asc" },
    });
    return res.json(usuarios);
}

export async function criarUsuario(req: Request, res: Response) {
    const resultado = criarUsuarioSchema.safeParse(req.body);

    if (!resultado.success) {
        return res.status(400).json({
            message: "Dados inválidos.",
            errors: resultado.error.flatten(),
        });
    }

    const { papel, funcionarioId, senhaTemporaria } = resultado.data;
    let email = resultado.data.email;

    if (funcionarioId !== undefined) {
        const funcionario = await prisma.funcionario.findUnique({
            where: { id: funcionarioId },
            select: { email: true, usuario: { select: { id: true } } },
        });

        if (!funcionario) {
            return res.status(404).json({ message: "Funcionário não encontrado." });
        }
        if (funcionario.usuario) {
            return res.status(409).json({ message: "Este funcionário já possui um usuário." });
        }

        email ??= funcionario.email.trim().toLowerCase();
    }

    if (!email) {
        return res.status(400).json({ message: "Informe o e-mail ou o funcionarioId." });
    }

    try {
        const usuario = await prisma.usuario.create({
            data: {
                email,
                senhaHash: await hashSenha(senhaTemporaria),
                papel,
                funcionarioId: funcionarioId ?? null,
                precisaTrocarSenha: true,
            },
            select: selectPublico,
        });

        return res.status(201).json(usuario);
    } catch (erro) {
        if (ehViolacaoDeUnicidade(erro)) {
            return res.status(409).json({ message: "Já existe um usuário com este e-mail." });
        }
        throw erro;
    }
}

export async function atualizarUsuario(req: Request, res: Response) {
    const id = lerId(req.params.id);
    if (!id) return res.status(400).json({ message: "ID inválido." });

    const resultado = atualizarUsuarioSchema.safeParse(req.body);

    if (!resultado.success) {
        return res.status(400).json({
            message: "Dados inválidos.",
            errors: resultado.error.flatten(),
        });
    }

    const alvo = await prisma.usuario.findUnique({ where: { id }, select: { id: true } });
    if (!alvo) return res.status(404).json({ message: "Usuário não encontrado." });

    const { papel, ativo } = resultado.data;
    if (id === req.usuario!.id && (ativo === false || (papel && papel !== req.usuario!.papel))) {
        return res.status(400).json({ message: "Você não pode desativar nem rebaixar a própria conta." });
    }

    const usuario = await prisma.usuario.update({
        where: { id },
        data: resultado.data,
        select: selectPublico,
    });

    if (ativo === false) await encerrarSessoes(id);

    return res.json(usuario);
}

export async function redefinirSenha(req: Request, res: Response) {
    const id = lerId(req.params.id);
    if (!id) return res.status(400).json({ message: "ID inválido." });

    if (id === req.usuario!.id) {
        return res.status(400).json({ message: "Para a própria conta, use a troca de senha." });
    }

    const resultado = redefinirSenhaSchema.safeParse(req.body);

    if (!resultado.success) {
        return res.status(400).json({
            message: "Dados inválidos.",
            errors: resultado.error.flatten(),
        });
    }

    const alvo = await prisma.usuario.findUnique({ where: { id }, select: { id: true } });
    if (!alvo) return res.status(404).json({ message: "Usuário não encontrado." });

    await prisma.usuario.update({
        where: { id },
        data: {
            senhaHash: await hashSenha(resultado.data.senhaTemporaria),
            precisaTrocarSenha: true,
            tentativasFalhas: 0,
            bloqueadoAte: null,
        },
    });

    await encerrarSessoes(id);

    return res.status(204).send();
}