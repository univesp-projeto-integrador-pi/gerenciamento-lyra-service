import { z } from "zod";

export const funcionarioSchema = z.object({
  nome: z.string().min(2, "Nome deve possuir pelo menos 2 caracteres."),
  email: z.email("E-mail inválido."),
  cargo: z.string().optional(),
  salario: z.number().nonnegative().optional()
});

export const funcionarioUpdateSchema = funcionarioSchema.partial();