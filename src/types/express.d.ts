import "express-session";

declare module "express-session" {
    interface SessionData {
        usuarioId: number;
    }
}

declare global {
    namespace Express {
        interface Request {
            usuario?: {
                id: number;
                email: string;
                papel: "ADMIN" | "GESTOR" | "FUNCIONARIO";
                funcionarioId: number | null;
                precisaTrocarSenha: boolean;
            };
        }
    }
}