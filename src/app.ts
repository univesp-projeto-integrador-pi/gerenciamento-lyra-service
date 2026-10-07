import express from "express";
import { funcionarioRoutes } from "./routes/funcionario.routes.js";
import { obraRoutes } from "./routes/obra.routes.js";
import { sessionMiddleware } from "./lib/session.js";
import { authRoutes } from "./routes/auth.routes.js";
import { alocacaoRoutes } from "./routes/alocacao.routes.js";
import { usuarioRoutes } from "./routes/usuario.routes.js";

export const app = express();

app.use(express.json());
app.use(sessionMiddleware);

app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        message: "API Funcionários e Obras funcionando.",
    });
});

app.use("/api/funcionarios", funcionarioRoutes);
app.use("/api/obras", obraRoutes);
app.use("/api/alocacoes", alocacaoRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuarioRoutes);

app.use((_req, res) => {
    res.status(404).json({ message: "Rota não encontrada." });
});