import { z } from "zod";

const schema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().min(1),
    FRONTEND_ORIGIN: z
        .url()
        .refine((v) => new URL(v).origin === v, "Informe só a origem, sem barra no final."),
    SESSION_SECRET: z.string().min(32, "Mínimo de 32 caracteres."),
    TRUST_PROXY: z.coerce.number().int().min(0).default(0),// não deveria criar uma variavel para isso no env?
    LIMITE_GLOBAL: z.coerce.number().int().positive().default(300),
    LIMITE_LOGIN: z.coerce.number().int().positive().default(10),
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
});

const resultado = schema.safeParse(process.env);

if (!resultado.success) {
    console.error("Variáveis de ambiente inválidas:");
    for (const erro of resultado.error.issues) {
        console.error(`- ${erro.path.join(".")}: ${erro.message}`);
    }
    process.exit(1);
}

export const env = resultado.data;