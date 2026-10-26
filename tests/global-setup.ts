import pg from "pg";

export async function setup() {
    const url = process.env.DATABASE_URL;

    if (!url) {
        throw new Error("DATABASE_URL não definida. Crie o .env.test (veja .env.test.example).");
    }

    const banco = decodeURIComponent(new URL(url).pathname.replace(/^\//, ""));
    if (!/_test$/i.test(banco)) {
        throw new Error(`Recusando rodar os testes: o banco "${banco}" não termina em _test.`);
    }

    const cliente = new pg.Client({ connectionString: url });
    await cliente.connect();
    try {
        await cliente.query(
            `TRUNCATE TABLE "alocacoes", "usuarios", "funcionarios", "obras", "auditorias", "session" RESTART IDENTITY CASCADE`,
        );
    } finally {
        await cliente.end();
    }
}