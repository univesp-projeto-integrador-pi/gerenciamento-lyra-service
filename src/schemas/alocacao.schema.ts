import { z } from "zod";

export const alocacaoSchema = z.strictObject({
    funcionarioId: z.number().int().positive(),
    obraId: z.number().int().positive(),
});