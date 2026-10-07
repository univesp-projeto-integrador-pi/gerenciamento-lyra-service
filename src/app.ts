import express from "express";
import helmet from "helmet";
import cors from "cors";
import { env } from "./env.js";
import { gerarToken, csrfSynchronisedProtection } from "./lib/csrf.js";
import { limitadorGlobal, limitadorToken } from "./lib/rate-limit.js";
import { sessionMiddleware } from "./lib/session.js";
import { autenticar, exigirSenhaTrocada } from "./middlewares/auth.middleware.js";
import { verificarOrigem } from "./middlewares/origem.middleware.js";
import { authRoutes } from "./routes/auth.routes.js";
import { usuarioRoutes } from "./routes/usuario.routes.js";
import { funcionarioRoutes } from "./routes/funcionario.routes.js";
import { obraRoutes } from "./routes/obra.routes.js";
import { alocacaoRoutes } from "./routes/alocacao.routes.js";

export const app = express();

app.disable("x-powered-by");
app.set("trust proxy", env.TRUST_PROXY > 0 ? env.TRUST_PROXY : false);

app.use(helmet());

app.use(
    cors({
        origin: env.FRONTEND_ORIGIN,
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "X-CSRF-Token"],
        maxAge: 600,
    }),
);

app.use(limitadorGlobal);
app.use(express.json({ limit: "10kb" }));
app.use(sessionMiddleware);
app.use(verificarOrigem);
app.use(csrfSynchronisedProtection);

app.use("/api", (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        message: "API Funcionários e Obras funcionando.",
    });
});

app.get("/api/csrf-token", limitadorToken, (req, res) => {
    res.json({ token: gerarToken(req) });
});

app.use("/api/auth", authRoutes);
app.use("/api", autenticar, exigirSenhaTrocada);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/funcionarios", funcionarioRoutes);
app.use("/api/obras", obraRoutes);
app.use("/api/alocacoes", alocacaoRoutes);

app.use((_req, res) => {
    res.status(404).json({ message: "Rota não encontrada." });
});