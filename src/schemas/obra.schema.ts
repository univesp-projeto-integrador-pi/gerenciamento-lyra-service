import { z } from "zod";

const statusObra = z.enum([
  "PLANEJADA",
  "EM_ANDAMENTO",
  "CONCLUIDA",
  "CANCELADA"
]);

export const obraSchema = z.object({
  nome: z.string().min(2),
  endereco: z.string().optional(),
  status: statusObra.optional(),
  dataInicio: z.coerce.date().optional(),
  dataFim: z.coerce.date().optional()
});

export const obraUpdateSchema = obraSchema.partial();