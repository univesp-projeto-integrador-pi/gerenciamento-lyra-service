import { csrfSync } from "csrf-sync";

export const { generateToken: gerarToken, csrfSynchronisedProtection } = csrfSync({
    getTokenFromRequest: (req) => {
        const valor = req.headers["x-csrf-token"];
        return typeof valor === "string" ? valor : undefined;
    },
});