import { Router } from "express";
import {
  atualizarFuncionario,
  buscarFuncionario,
  criarFuncionario,
  excluirFuncionario,
  listarFuncionarios
} from "../controllers/funcionario.controller.js";

export const funcionarioRoutes = Router();

funcionarioRoutes.get("/", listarFuncionarios);
funcionarioRoutes.get("/:id", buscarFuncionario);
funcionarioRoutes.post("/", criarFuncionario);
funcionarioRoutes.put("/:id", atualizarFuncionario);
funcionarioRoutes.delete("/:id", excluirFuncionario);