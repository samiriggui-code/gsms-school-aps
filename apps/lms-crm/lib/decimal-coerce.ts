/** Coerce Prisma Decimal / string / number → number | null (usage catalogue & sessions). */
export function numDecimal(value: unknown): number | null {
  if (value == null || value === '') return null;
  if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    const n = (value as { toNumber: () => number }).toNumber();
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(value as number | string);
  return Number.isFinite(n) ? n : null;
}
