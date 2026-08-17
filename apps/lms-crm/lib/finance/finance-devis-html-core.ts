export function decimalNum(d: unknown): number {
  if (d == null) return 0;
  return typeof d === 'object' && d !== null && 'toNumber' in d
    ? (d as { toNumber: () => number }).toNumber()
    : Number(d);
}

export function moneyFr(value: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency || 'EUR' }).format(
    value,
  );
}

/** Montants PDF — Helvetica ne gère pas le séparateur fine fr-FR (U+202F → « / »). */
export function moneyFrPdf(value: number, currency: string): string {
  return moneyFr(value, currency).replace(/[\u202f\u00a0]/g, ' ');
}
