import { pinoHttp } from "pino-http";
import { logger } from "../lib/logger.js";

export const logHttp = pinoHttp({
    logger,
    autoLogging: { ignore: (req) => req.url === "/health" },

    customLogLevel: (_req, res, erro) => {
        if (erro || res.statusCode >= 500) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
    },

    serializers: {
        req: (req) => ({ id: req.id, method: req.method, url: String(req.url).split("?")[0] }),
        res: (res) => ({ statusCode: res.statusCode }),
    },

    customProps: (req) => ({ usuarioId: (req as { usuario?: { id: number } }).usuario?.id }),
});