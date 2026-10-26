import { z } from "zod";
import { emailSchema } from "./auth.schema.js";
import { senhaSchema } from "./senha.schema.js";

const papelSchema = z.enum(["ADMIN", "GESTOR", "FUNCIONARIO"]);

export const criarUsuarioSchema = z
    .strictObject({
        email: emailSchema.optional(),
        papel: papelSchema.default("FUNCIONARIO"),
        funcionarioId: z.number().int().positive().optional(),
        senhaTemporaria: senhaSchema,
    })
    .refine((d) => d.email !== undefined || d.funcionarioId !== undefined, {
        message: "Informe o e-mail ou o funcionarioId.",
        path: ["email"],
    });

export const atualizarUsuarioSchema = z
    .strictObject({
        papel: papelSchema.optional(),
        ativo: z.boolean().optional(),
    })
    .refine((d) => Object.keys(d).length > 0, { message: "Informe ao menos um campo." });

export const redefinirSenhaSchema = z.strictObject({
    senhaTemporaria: senhaSchema,
});