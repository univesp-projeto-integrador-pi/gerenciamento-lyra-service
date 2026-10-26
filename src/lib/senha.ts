import * as argon2 from "argon2";


const OPCOES = {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
} as const;

export function hashSenha(senha: string): Promise<string> {
    return argon2.hash(senha, OPCOES);
}

export async function confereSenha(senha: string, hash: string): Promise<boolean> {
    try {
        return await argon2.verify(hash, senha);
    } catch {
        return false;
    }
}

export function precisaAtualizarHash(hash: string): boolean {
    return argon2.needsRehash(hash, OPCOES);
}

let hashFalso: Promise<string> | undefined;
export function obterHashFalso(): Promise<string> {
    return (hashFalso ??= hashSenha("senha-descartavel-sem-uso"));
}