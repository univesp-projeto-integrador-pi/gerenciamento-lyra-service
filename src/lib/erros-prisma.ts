export function codigoDoErro(erro: unknown): string | undefined {
    if (typeof erro !== "object" || erro === null || !("code" in erro)) return undefined;
    const { code } = erro as { code: unknown };
    return typeof code === "string" ? code : undefined;
}

export function ehViolacaoDeUnicidade(erro: unknown): boolean {
    return codigoDoErro(erro) === "P2002";
}