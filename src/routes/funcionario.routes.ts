import { Router } from "express";
import {
  atualizarFuncionario,
  buscarFuncionario,
  criarFuncionario,
  excluirFuncionario,
  listarFuncionarios
} from "../controllers/funcionario.controller.js";
import { exigirPapel } from "../middlewares/auth.middleware.js";

export const funcionarioRoutes = Router();

funcionarioRoutes.get("/", exigirPapel("ADMIN", "GESTOR"), listarFuncionarios);
funcionarioRoutes.get("/:id", buscarFuncionario);
funcionarioRoutes.post("/", exigirPapel("ADMIN"), criarFuncionario);
funcionarioRoutes.put("/:id", exigirPapel("ADMIN"), atualizarFuncionario);
funcionarioRoutes.delete("/:id", exigirPapel("ADMIN"), excluirFuncionario);