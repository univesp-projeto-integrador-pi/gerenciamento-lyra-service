export function lerId(valor: unknown): number | null {
    const n = Number(valor);
    return Number.isInteger(n) && n > 0 ? n : null;
}