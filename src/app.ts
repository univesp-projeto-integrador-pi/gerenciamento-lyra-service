import express from "express";
import { sessionMiddleware } from "./lib/session.js";
import { autenticar, exigirSenhaTrocada } from "./middlewares/auth.middleware.js";
import { authRoutes } from "./routes/auth.routes.js";
import { usuarioRoutes } from "./routes/usuario.routes.js";
import { funcionarioRoutes } from "./routes/funcionario.routes.js";
import { obraRoutes } from "./routes/obra.routes.js";
import { alocacaoRoutes } from "./routes/alocacao.routes.js";

export const app = express();

app.use(express.json());
app.use(sessionMiddleware);

app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        message: "API Funcionários e Obras funcionando.",
    });
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