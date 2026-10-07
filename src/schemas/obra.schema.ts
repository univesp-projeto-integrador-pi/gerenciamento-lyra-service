import { z } from "zod";

const statusObra = z.enum(["PLANEJADA", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"]);

const obraBase = z.strictObject({
  nome: z.string().min(2).max(120),
  endereco: z.string().max(200).optional(),
  status: statusObra.optional(),
  dataInicio: z.coerce.date().optional(),
  dataFim: z.coerce.date().optional(),
});

const datasCoerentes = (d: { dataInicio?: Date; dataFim?: Date }) =>
  !d.dataInicio || !d.dataFim || d.dataFim >= d.dataInicio;

const erroDatas = {
  message: "A data de término não pode ser anterior à de início.",
  path: ["dataFim"],
};

export const obraSchema = obraBase.refine(datasCoerentes, erroDatas);
export const obraUpdateSchema = obraBase.partial().refine(datasCoerentes, erroDatas);