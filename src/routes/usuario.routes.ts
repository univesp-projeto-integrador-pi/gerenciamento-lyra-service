import { Router } from "express";
import {
    atualizarUsuario,
    criarUsuario,
    listarUsuarios,
    redefinirSenha,
} from "../controllers/usuario.controller.js";
import { autenticar, exigirPapel, exigirSenhaTrocada } from "../middlewares/auth.middleware.js";

export const usuarioRoutes = Router();

usuarioRoutes.use(autenticar, exigirSenhaTrocada, exigirPapel("ADMIN"));

usuarioRoutes.get("/", listarUsuarios);
usuarioRoutes.post("/", criarUsuario);
usuarioRoutes.patch("/:id", atualizarUsuario);
usuarioRoutes.post("/:id/redefinir-senha", redefinirSenha);