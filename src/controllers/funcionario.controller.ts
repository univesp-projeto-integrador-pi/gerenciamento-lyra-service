import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { lerId } from "../lib/params.js";
import { ehViolacaoDeUnicidade } from "../lib/erros-prisma.js";
import { funcionarioSchema, funcionarioUpdateSchema } from "../schemas/funcionario.schema.js";

function selecionar(comSalario: boolean) {
  return {
    id: true,
    nome: true,
    email: true,
    cargo: true,
    salario: comSalario,
    criadoEm: true,
    atualizadoEm: true,
    alocacoes: {
      select: {
        id: true,
        obra: { select: { id: true, nome: true, status: true } },
      },
      orderBy: { id: "asc" },
    },
  } as const;
}

export async function listarFuncionarios(req: Request, res: Response) {
  const comSalario = req.usuario!.papel === "ADMIN";

  const funcionarios = await prisma.funcionario.findMany({
    select: selecionar(comSalario),
    orderBy: { id: "asc" },
  });

  return res.json(funcionarios);
}

export async function buscarFuncionario(req: Request, res: Response) {
  const id = lerId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID inválido." });

  const usuario = req.usuario!;

  if (usuario.papel === "FUNCIONARIO" && usuario.funcionarioId !== id) {
    return res.status(404).json({ message: "Funcionário não encontrado." });
  }

  const comSalario = usuario.papel !== "GESTOR";

  const funcionario = await prisma.funcionario.findUnique({
    where: { id },
    select: selecionar(comSalario),
  });

  if (!funcionario) {
    return res.status(404).json({ message: "Funcionário não encontrado." });
  }

  return res.json(funcionario);
}

export async function criarFuncionario(req: Request, res: Response) {
  const resultado = funcionarioSchema.safeParse(req.body);

  if (!resultado.success) {
    return res.status(400).json({
      message: "Dados inválidos.",
      errors: resultado.error.flatten(),
    });
  }

  try {
    const funcionario = await prisma.funcionario.create({
      data: resultado.data,
      select: selecionar(true),
    });

    return res.status(201).json(funcionario);
  } catch (erro) {
    if (ehViolacaoDeUnicidade(erro)) {
      return res.status(409).json({ message: "Já existe um funcionário com este e-mail." });
    }
    throw erro;
  }
}

export async function atualizarFuncionario(req: Request, res: Response) {
  const id = lerId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID inválido." });

  const resultado = funcionarioUpdateSchema.safeParse(req.body);

  if (!resultado.success) {
    return res.status(400).json({
      message: "Dados inválidos.",
      errors: resultado.error.flatten(),
    });
  }

  const existente = await prisma.funcionario.findUnique({ where: { id }, select: { id: true } });

  if (!existente) {
    return res.status(404).json({ message: "Funcionário não encontrado." });
  }

  try {
    const funcionario = await prisma.funcionario.update({
      where: { id },
      data: resultado.data,
      select: selecionar(true),
    });

    return res.json(funcionario);
  } catch (erro) {
    if (ehViolacaoDeUnicidade(erro)) {
      return res.status(409).json({ message: "Já existe um funcionário com este e-mail." });
    }
    throw erro;
  }
}

export async function excluirFuncionario(req: Request, res: Response) {
  const id = lerId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID inválido." });

  if (req.usuario!.funcionarioId === id) {
    return res.status(400).json({ message: "Você não pode excluir o seu próprio cadastro." });
  }

  const existente = await prisma.funcionario.findUnique({ where: { id }, select: { id: true } });

  if (!existente) {
    return res.status(404).json({ message: "Funcionário não encontrado." });
  }

  await prisma.$transaction([
    prisma.usuario.updateMany({ where: { funcionarioId: id }, data: { ativo: false } }),
    prisma.funcionario.delete({ where: { id } }),
  ]);

  return res.status(204).send();
}