import express from "express";
import { funcionarioRoutes } from "./routes/funcionario.routes";
import { obraRoutes } from "./routes/obra.routes";
import { alocacaoRoutes } from "./routes/alocacao.routes";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "API Funcionários e Obras funcionando.",
  });
});

app.use("/api/funcionarios", funcionarioRoutes);
app.use("/api/obras", obraRoutes);
app.use("/api/alocacoes", alocacaoRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Rota não encontrada." });
});

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});
