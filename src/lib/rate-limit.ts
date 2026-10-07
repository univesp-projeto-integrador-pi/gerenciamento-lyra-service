import { rateLimit } from "express-rate-limit";
import { env } from "../env.js";

const comum = {
    windowMs: 15 * 60 * 1000,
    standardHeaders: "draft-8",
    legacyHeaders: false,
} as const;

export const limitadorGlobal = rateLimit({
    ...comum,
    limit: env.LIMITE_GLOBAL,
    message: { message: "Muitas requisições. Tente novamente em instantes." },
});

export const limitadorLogin = rateLimit({
    ...comum,
    limit: env.LIMITE_LOGIN,
    message: { message: "Muitas tentativas. Aguarde alguns minutos." },
});