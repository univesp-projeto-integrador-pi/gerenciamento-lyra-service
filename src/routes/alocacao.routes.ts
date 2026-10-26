import { Router } from "express";
import {
  atualizarAlocacao,
  buscarAlocacao,
  criarAlocacao,
  excluirAlocacao,
  listarAlocacoes
} from "../controllers/alocacao.controller.js";
import { exigirPapel } from "../middlewares/auth.middleware.js";

export const alocacaoRoutes = Router();

alocacaoRoutes.get("/", listarAlocacoes);
alocacaoRoutes.get("/:id", buscarAlocacao);
alocacaoRoutes.post("/", exigirPapel("ADMIN", "GESTOR"), criarAlocacao);
alocacaoRoutes.put("/:id", exigirPapel("ADMIN", "GESTOR"), atualizarAlocacao);
alocacaoRoutes.delete("/:id", exigirPapel("ADMIN", "GESTOR"), excluirAlocacao);
