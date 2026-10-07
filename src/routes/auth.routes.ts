import { Router } from "express";
import { login, logout, me, trocarSenha } from "../controllers/auth.controller.js";
import { autenticar } from "../middlewares/auth.middleware.js";

export const authRoutes = Router();

authRoutes.post("/login", login);
authRoutes.post("/logout", logout);
authRoutes.get("/me", autenticar, me);
authRoutes.post("/trocar-senha", autenticar, trocarSenha);