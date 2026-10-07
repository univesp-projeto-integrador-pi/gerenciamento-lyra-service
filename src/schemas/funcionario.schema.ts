import { z } from "zod";

const dinheiro = z
  .string()
  .regex(/^\d{1,10}([.,]\d{1,2})?$/, "Use o formato 3500,00")
  .transform((valor) => valor.replace(",", "."));

export const funcionarioSchema = z.strictObject({
  nome: z.string().min(2, "Nome deve possuir pelo menos 2 caracteres.").max(120),
  email: z.email("E-mail inválido.").max(254),
  cargo: z.string().max(80).optional(),
  salario: dinheiro.optional(),
});

export const funcionarioUpdateSchema = funcionarioSchema.partial();