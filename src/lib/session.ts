import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import { env } from "../env.js";

const PgStore = connectPgSimple(session);

const pool = new pg.Pool({ connectionString: env.DATABASE_URL, max: 5 });
pool.on("error", (erro) => console.error("Erro no pool de sessões:", erro));

export const opcoesCookie = {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 8, // 8 horas
} as const;

export const sessionMiddleware = session({
    name: "sid",
    secret: [env.SESSION_SECRET],
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: new PgStore({ pool, tableName: "session" }),
    cookie: opcoesCookie,
});