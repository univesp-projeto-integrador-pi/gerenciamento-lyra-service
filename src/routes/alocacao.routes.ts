import { Router } from "express";

import {
  listarAlocacoes,
  buscarAlocacao,
  criarAlocacao,
  atualizarAlocacao,
  excluirAlocacao,
} from "../controllers/alocacao.controller";

export const alocacaoRoutes = Router();

alocacaoRoutes.get("/", listarAlocacoes);

alocacaoRoutes.get("/:id", buscarAlocacao);

alocacaoRoutes.post("/", criarAlocacao);

alocacaoRoutes.put("/:id", atualizarAlocacao);

alocacaoRoutes.delete("/:id", excluirAlocacao);
