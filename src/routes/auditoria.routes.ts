import { Router } from "express";
import { listarAuditoria } from "../controllers/auditoria.controller.js";
import { exigirPapel } from "../middlewares/auth.middleware.js";

export const auditoriaRoutes = Router();

auditoriaRoutes.get("/", exigirPapel("ADMIN"), listarAuditoria);