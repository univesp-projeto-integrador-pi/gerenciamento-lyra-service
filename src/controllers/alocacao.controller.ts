import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { lerId } from "../lib/params.js";
import { ehViolacaoDeUnicidade } from "../lib/erros-prisma.js";
import { alocacaoSchema } from "../schemas/alocacao.schema.js";

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
  const resultado = alocacaoSchema.safeParse(req.body);

  if (!resultado.success) {
    return res.status(400).json({
      message: "Dados inválidos.",
      errors: resultado.error.flatten(),
    });
  }

  const { funcionarioId, obraId } = resultado.data;

  const funcionario = await prisma.funcionario.findUnique({
    where: { id: funcionarioId },
    select: { id: true },
  });
  if (!funcionario) {
    return res.status(404).json({ message: "Funcionário não encontrado." });
  }

  const obra = await prisma.obra.findUnique({ where: { id: obraId }, select: { id: true } });
  if (!obra) {
    return res.status(404).json({ message: "Obra não encontrada." });
  }

  try {
    const alocacao = await prisma.alocacao.create({
      data: { funcionarioId, obraId },
      select: selectAlocacao,
    });

    return res.status(201).json(alocacao);
  } catch (erro) {
    if (ehViolacaoDeUnicidade(erro)) {
      return res.status(409).json({ message: "Funcionário já está alocado nesta obra." });
    }
    throw erro;
  }
}

export async function atualizarAlocacao(req: Request, res: Response) {
  const id = lerId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID inválido." });

  const resultado = alocacaoSchema.safeParse(req.body);

  if (!resultado.success) {
    return res.status(400).json({
      message: "Dados inválidos.",
      errors: resultado.error.flatten(),
    });
  }

  const { funcionarioId, obraId } = resultado.data;

  const existente = await prisma.alocacao.findUnique({ where: { id }, select: { id: true } });
  if (!existente) {
    return res.status(404).json({ message: "Alocação não encontrada." });
  }

  const funcionario = await prisma.funcionario.findUnique({
    where: { id: funcionarioId },
    select: { id: true },
  });
  if (!funcionario) {
    return res.status(404).json({ message: "Funcionário não encontrado." });
  }

  const obra = await prisma.obra.findUnique({ where: { id: obraId }, select: { id: true } });
  if (!obra) {
    return res.status(404).json({ message: "Obra não encontrada." });
  }

  try {
    const alocacao = await prisma.alocacao.update({
      where: { id },
      data: { funcionarioId, obraId },
      select: selectAlocacao,
    });

    return res.json(alocacao);
  } catch (erro) {
    if (ehViolacaoDeUnicidade(erro)) {
      return res.status(409).json({ message: "Funcionário já está alocado nesta obra." });
    }
    throw erro;
  }
}

export async function excluirAlocacao(req: Request, res: Response) {
  const id = lerId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID inválido." });

  const existente = await prisma.alocacao.findUnique({ where: { id }, select: { id: true } });
  if (!existente) {
    return res.status(404).json({ message: "Alocação não encontrada." });
  }

  await prisma.alocacao.delete({ where: { id } });

  return res.status(204).send();
}