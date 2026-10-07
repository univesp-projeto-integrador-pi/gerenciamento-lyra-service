import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { obraSchema, obraUpdateSchema } from "../schemas/obra.schema.js";

export async function listarObras(_req: Request, res: Response) {
  const obras = await prisma.obra.findMany({
    include: {
      alocacoes: {
        include: {
          funcionario: true
        }
      }
    },
    orderBy: { id: "asc" }
  });

  return res.json(obras);
}

export async function buscarObra(req: Request, res: Response) {
  const id = Number(req.params.id);

  const obra = await prisma.obra.findUnique({
    where: { id },
    include: {
      alocacoes: {
        include: {
          funcionario: true
        }
      }
    }
  });

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
      errors: resultado.error.flatten()
    });
  }

  const obra = await prisma.obra.create({
    data: resultado.data
  });

  return res.status(201).json(obra);
}

export async function atualizarObra(req: Request, res: Response) {
  const id = Number(req.params.id);
  const resultado = obraUpdateSchema.safeParse(req.body);

  if (!resultado.success) {
    return res.status(400).json({
      message: "Dados inválidos.",
      errors: resultado.error.flatten()
    });
  }

  const existente = await prisma.obra.findUnique({ where: { id } });

  if (!existente) {
    return res.status(404).json({ message: "Obra não encontrada." });
  }

  const obra = await prisma.obra.update({
    where: { id },
    data: resultado.data
  });

  return res.json(obra);
}

export async function excluirObra(req: Request, res: Response) {
  const id = Number(req.params.id);

  const existente = await prisma.obra.findUnique({ where: { id } });

  if (!existente) {
    return res.status(404).json({ message: "Obra não encontrada." });
  }

  await prisma.obra.delete({ where: { id } });

  return res.status(204).send();
}