import { z } from "zod";
import { senhaSchema } from "./senha.schema.js";

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email("E-mail inválido."));

export const loginSchema = z.strictObject({
    email: emailSchema,
    senha: z.string().min(1).max(128),
});

export const trocarSenhaSchema = z
    .strictObject({
        senhaAtual: z.string().min(1).max(128),
        novaSenha: senhaSchema,
    })
    .refine((d) => d.senhaAtual !== d.novaSenha, {
        message: "A nova senha deve ser diferente da atual.",
        path: ["novaSenha"],
    });