import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { lerId } from "../lib/params.js";
import { obraSchema, obraUpdateSchema } from "../schemas/obra.schema.js";

const base = {
  id: true,
  nome: true,
  endereco: true,
  status: true,
  dataInicio: true,
  dataFim: true,
  criadoEm: true,
  atualizadoEm: true,
} as const;

const comEquipe = {
  ...base,
  alocacoes: {
    select: {
      id: true,
      funcionario: { select: { id: true, nome: true, cargo: true } },
    },
    orderBy: { id: "asc" },
  },
} as const;

type UsuarioLogado = NonNullable<Request["usuario"]>;

function escopo(usuario: UsuarioLogado) {
  if (usuario.papel !== "FUNCIONARIO") return {};
  return { alocacoes: { some: { funcionarioId: usuario.funcionarioId ?? -1 } } };
}

export async function listarObras(req: Request, res: Response) {
  const usuario = req.usuario!;
  const where = escopo(usuario);

  const obras =
    usuario.papel === "FUNCIONARIO"
      ? await prisma.obra.findMany({ where, select: base, orderBy: { id: "asc" } })
      : await prisma.obra.findMany({ where, select: comEquipe, orderBy: { id: "asc" } });

  return res.json(obras);
}

export async function buscarObra(req: Request, res: Response) {
  const id = lerId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID inválido." });

  const usuario = req.usuario!;
  const where = { id, ...escopo(usuario) };

  const obra =
    usuario.papel === "FUNCIONARIO"
      ? await prisma.obra.findFirst({ where, select: base })
      : await prisma.obra.findFirst({ where, select: comEquipe });

  if (!obra) {
    return res.status(404).json({ message: "Obra não encontrada." });
  }

  return res.json(obra);
}

export async function criarObra(req: Request, res: Response) {
  const resultado = obraSchema.safeParse(req.body);

  if (!resultado.success) {
    return res.status(400).json({
      message: "Dados inválidos.",
      errors: resultado.error.flatten(),
    });
  }

  const obra = await prisma.obra.create({ data: resultado.data, select: base });

  return res.status(201).json(obra);
}

export async function atualizarObra(req: Request, res: Response) {
  const id = lerId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID inválido." });

  const resultado = obraUpdateSchema.safeParse(req.body);

  if (!resultado.success) {
    return res.status(400).json({
      message: "Dados inválidos.",
      errors: resultado.error.flatten(),
    });
  }

  const existente = await prisma.obra.findUnique({ where: { id }, select: { id: true } });

  if (!existente) {
    return res.status(404).json({ message: "Obra não encontrada." });
  }

  const obra = await prisma.obra.update({ where: { id }, data: resultado.data, select: base });

  return res.json(obra);
}

export async function excluirObra(req: Request, res: Response) {
  const id = lerId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID inválido." });

  const existente = await prisma.obra.findUnique({ where: { id }, select: { id: true } });

  if (!existente) {
    return res.status(404).json({ message: "Obra não encontrada." });
  }

  await prisma.obra.delete({ where: { id } });

  return res.status(204).send();
}