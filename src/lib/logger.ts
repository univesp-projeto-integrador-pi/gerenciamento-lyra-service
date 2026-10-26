import pino from "pino";
import { env } from "../env.js";

export const logger = pino({
    level: env.LOG_LEVEL,
    redact: {
        paths: [
            "*.senha",
            "*.senhaAtual",
            "*.novaSenha",
            "*.senhaTemporaria",
            "*.senhaHash",
            'req.headers.cookie',
            'req.headers.authorization',
            'req.headers["x-csrf-token"]',
        ],
        censor: "[REDACTED]",
    },
    transport: env.NODE_ENV === "development" ? { target: "pino-pretty" } : undefined,
});