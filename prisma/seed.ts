import { z } from "zod";
import { prisma } from "../src/lib/prisma.js";
import { hashSenha } from "../src/lib/senha.js";
import { senhaSchema } from "../src/schemas/senha.schema.js";

const entradaSchema = z.object({
    ADMIN_EMAIL: z.email("ADMIN_EMAIL inválido."),
    ADMIN_SENHA: senhaSchema,
});

async function main() {
    const entrada = entradaSchema.safeParse(process.env);

    if (!entrada.success) {
        console.error("Configuração do seed inválida:");
        for (const erro of entrada.error.issues) {
            console.error(`- ${erro.path.join(".")}: ${erro.message}`);
        }
        process.exit(1);
    }

    const email = entrada.data.ADMIN_EMAIL.trim().toLowerCase();

    const existente = await prisma.usuario.findUnique({ where: { email } });
    if (existente) {
        console.log("O ADMIN já existe. Nada a fazer.");
        return;
    }

    await prisma.usuario.create({
        data: {
            email,
            senhaHash: await hashSenha(entrada.data.ADMIN_SENHA),
            papel: "ADMIN",
            precisaTrocarSenha: true,
        },
    });

    console.log(`ADMIN criado: ${email}`);
}

main()
    .catch((erro) => {
        console.error(erro);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());