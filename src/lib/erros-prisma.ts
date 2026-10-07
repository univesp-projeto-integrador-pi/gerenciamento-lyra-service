export function ehViolacaoDeUnicidade(erro: unknown): boolean {
    return (
        typeof erro === "object" &&
        erro !== null &&
        "code" in erro &&
        (erro as { code: unknown }).code === "P2002"
    );
}