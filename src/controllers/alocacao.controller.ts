import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

import { lerId } from "../lib/params.js";

const selectAlocacao = {
  id: true,
  funcionarioId: true,
  obraId: true,
  criadoEm: true,
  funcionario: { select: { id: true, nome: true, cargo: true } },
  obra: { select: { id: true, nome: true, status: true } },
} as const;

type UsuarioLogado = NonNullable<Request["usuario"]>;

function escopo(usuario: UsuarioLogado) {
  return usuario.papel === "FUNCIONARIO" ? { funcionarioId: usuario.funcionarioId ?? -1 } : {};
}

export async function listarAlocacoes(req: Request, res: Response) {
  const alocacoes = await prisma.alocacao.findMany({
    where: escopo(req.usuario!),
    select: selectAlocacao,
    orderBy: { id: "asc" },
  });

  return res.json(alocacoes);
}

export async function buscarAlocacao(req: Request, res: Response) {
  const id = lerId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID inválido." });

  const alocacao = await prisma.alocacao.findFirst({
    where: { id, ...escopo(req.usuario!) },
    select: selectAlocacao,
  });

  if (!alocacao) {
    return res.status(404).json({ message: "Alocação não encontrada." });
  }

  return res.json(alocacao);
}

export async function criarAlocacao(req: Request, res: Response) {
  const { funcionarioId, obraId } = req.body;

  if (!funcionarioId || !obraId) {
    return res.status(400).json({
      message: "funcionarioId e obraId são obrigatórios.",
    });
  }

  const funcionario = await prisma.funcionario.findUnique({
    where: {
      id: funcionarioId,
    },
  });

  if (!funcionario) {
    return res.status(404).json({
      message: "Funcionário não encontrado.",
    });
  }

  const obra = await prisma.obra.findUnique({
    where: {
      id: obraId,
    },
  });

  if (!obra) {
    return res.status(404).json({
      message: "Obra não encontrada.",
    });
  }

  const alocacaoExistente = await prisma.alocacao.findUnique({
    where: {
      funcionarioId_obraId: {
        funcionarioId,
        obraId,
      },
    },
  });

  if (alocacaoExistente) {
    return res.status(409).json({
      message: "Funcionário já está alocado nesta obra.",
    });
  }

  const alocacao = await prisma.alocacao.create({
    data: {
      funcionarioId,
      obraId,
    },
    include: {
      funcionario: true,
      obra: true,
    },
  });

  return res.status(201).json(alocacao);
}

export async function atualizarAlocacao(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { funcionarioId, obraId } = req.body;

  const alocacao = await prisma.alocacao.findUnique({
    where: { id },
  });

  if (!alocacao) {
    return res.status(404).json({
      message: "Alocação não encontrada.",
    });
  }

  if (!funcionarioId || !obraId) {
    return res.status(400).json({
      message: "funcionarioId e obraId são obrigatórios.",
    });
  }

  const funcionario = await prisma.funcionario.findUnique({
    where: { id: funcionarioId },
  });

  if (!funcionario) {
    return res.status(404).json({
      message: "Funcionário não encontrado.",
    });
  }

  const obra = await prisma.obra.findUnique({
    where: { id: obraId },
  });

  if (!obra) {
    return res.status(404).json({
      message: "Obra não encontrada.",
    });
  }

  const duplicada = await prisma.alocacao.findFirst({
    where: {
      funcionarioId,
      obraId,
      NOT: {
        id,
      },
    },
  });

  if (duplicada) {
    return res.status(409).json({
      message: "Funcionário já está alocado nesta obra.",
    });
  }

  const alocacaoAtualizada = await prisma.alocacao.update({
    where: { id },
    data: {
      funcionarioId,
      obraId,
    },
    include: {
      funcionario: true,
      obra: true,
    },
  });

  return res.json(alocacaoAtualizada);
}

export async function excluirAlocacao(req: Request, res: Response) {
  const id = Number(req.params.id);

  const alocacao = await prisma.alocacao.findUnique({
    where: { id },
  });

  if (!alocacao) {
    return res.status(404).json({
      message: "Alocação não encontrada.",
    });
  }

  await prisma.alocacao.delete({
    where: { id },
  });

  return res.status(204).send();
}
