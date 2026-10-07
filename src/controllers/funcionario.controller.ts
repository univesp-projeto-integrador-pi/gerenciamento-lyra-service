import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { funcionarioSchema, funcionarioUpdateSchema } from "../schemas/funcionario.schema.js";

export async function listarFuncionarios(_req: Request, res: Response) {
  const funcionarios = await prisma.funcionario.findMany({
    include: {
      alocacoes: {
        include: {
          obra: true
        }
      }
    },
    orderBy: { id: "asc" }
  });

  return res.json(funcionarios);
}

export async function buscarFuncionario(req: Request, res: Response) {
  const id = Number(req.params.id);

  const funcionario = await prisma.funcionario.findUnique({
    where: { id },
    include: {
      alocacoes: {
        include: {
          obra: true
        }
      }
    }
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
      errors: resultado.error.flatten()
    });
  }

  try {
    const funcionario = await prisma.funcionario.create({
      data: resultado.data
    });

    return res.status(201).json(funcionario);
  } catch {
    return res.status(409).json({
      message: "Não foi possível criar o funcionário. O e-mail pode já estar cadastrado."
    });
  }
}

export async function atualizarFuncionario(req: Request, res: Response) {
  const id = Number(req.params.id);
  const resultado = funcionarioUpdateSchema.safeParse(req.body);

  if (!resultado.success) {
    return res.status(400).json({
      message: "Dados inválidos.",
      errors: resultado.error.flatten()
    });
  }

  const existente = await prisma.funcionario.findUnique({ where: { id } });

  if (!existente) {
    return res.status(404).json({ message: "Funcionário não encontrado." });
  }

  try {
    const funcionario = await prisma.funcionario.update({
      where: { id },
      data: resultado.data
    });

    return res.json(funcionario);
  } catch {
    return res.status(409).json({
      message: "Não foi possível atualizar o funcionário. O e-mail pode já estar cadastrado."
    });
  }
}

export async function excluirFuncionario(req: Request, res: Response) {
  const id = Number(req.params.id);

  const existente = await prisma.funcionario.findUnique({ where: { id } });

  if (!existente) {
    return res.status(404).json({ message: "Funcionário não encontrado." });
  }

  await prisma.funcionario.delete({ where: { id } });

  return res.status(204).send();
}