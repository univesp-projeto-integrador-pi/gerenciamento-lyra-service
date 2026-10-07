import { Router } from "express";
import {
  atualizarObra,
  buscarObra,
  criarObra,
  excluirObra,
  listarObras
} from "../controllers/obra.controller.js";
import { exigirPapel } from "../middlewares/auth.middleware.js";

export const obraRoutes = Router();

obraRoutes.get("/", listarObras);
obraRoutes.get("/:id", buscarObra);
obraRoutes.post("/", exigirPapel("ADMIN", "GESTOR"), criarObra);
obraRoutes.put("/:id", exigirPapel("ADMIN", "GESTOR"), atualizarObra);
obraRoutes.delete("/:id", exigirPapel("ADMIN", "GESTOR"), excluirObra);