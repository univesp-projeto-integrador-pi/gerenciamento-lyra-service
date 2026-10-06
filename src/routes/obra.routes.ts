import { Router } from "express";
import {
  atualizarObra,
  buscarObra,
  criarObra,
  excluirObra,
  listarObras
} from "../controllers/obra.controller.js";

export const obraRoutes = Router();

obraRoutes.get("/", listarObras);
obraRoutes.get("/:id", buscarObra);
obraRoutes.post("/", criarObra);
obraRoutes.put("/:id", atualizarObra);
obraRoutes.delete("/:id", excluirObra);