export type DevisLineInput = {
  label: string;
  quantity: number;
  unitPriceHt: number;
  vatRate: number;
};

export function totalsFromLines(lines: DevisLineInput[]): {
  subtotalHt: number;
  vatTotal: number;
  totalTtc: number;
} {
  let sub = 0;
  let vat = 0;
  for (const l of lines) {
    const q = Math.max(0, Number(l.quantity) || 0);
    const unit = Math.max(0, Number(l.unitPriceHt) || 0);
    const rate = Math.max(0, Number(l.vatRate) || 0);
    const ht = q * unit;
    sub += ht;
    vat += ht * (rate / 100);
  }
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const subR = round2(sub);
  const vatR = round2(vat);
  return { subtotalHt: subR, vatTotal: vatR, totalTtc: round2(subR + vatR) };
}

export function parseLinesJson(raw: unknown): DevisLineInput[] | null {
  if (!Array.isArray(raw)) return null;
  const out: DevisLineInput[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') return null;
    const o = item as Record<string, unknown>;
    out.push({
      label: typeof o.label === 'string' ? o.label : 'Ligne',
      quantity: Number(o.quantity ?? 1) || 0,
      unitPriceHt: Number(o.unitPriceHt ?? 0) || 0,
      vatRate: Number(o.vatRate ?? 0) || 0,
    });
  }
  return out;
}
