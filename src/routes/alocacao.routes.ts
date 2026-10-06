import { Router } from "express";
import {
  atualizarAlocacao,
  buscarAlocacao,
  criarAlocacao,
  excluirAlocacao,
  listarAlocacoes
} from "../controllers/alocacao.controller.js";

export const alocacaoRoutes = Router();

alocacaoRoutes.get("/", listarAlocacoes);

alocacaoRoutes.get("/:id", buscarAlocacao);

alocacaoRoutes.post("/", criarAlocacao);

alocacaoRoutes.put("/:id", atualizarAlocacao);

alocacaoRoutes.delete("/:id", excluirAlocacao);
