import { z } from "zod";

export const senhaSchema = z
    .string()
    .min(10, "A senha deve ter pelo menos 10 caracteres.")
    .max(128, "A senha deve ter no máximo 128 caracteres.");