export function parseEntryStep(
  raw: string | string[] | null | undefined,
): number {
  if (raw === null || raw === undefined) return 0;
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (s === undefined || s === "") return 0;
  const n = Number.parseInt(s, 10);
  if (!Number.isInteger(n) || n < 0 || n > 3) return 0;
  return n;
}
