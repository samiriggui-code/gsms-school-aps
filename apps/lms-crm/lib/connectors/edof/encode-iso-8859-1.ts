/**
 * Encodage LHEO / EDOF : le XSD et l'exemple officiel déclarent ISO-8859-1.
 * Ne jamais écrire UTF-8 avec une déclaration ISO (mojibake).
 */

export class EdofIso88591EncodingError extends Error {
  readonly offenders: string[];

  constructor(offenders: string[]) {
    super(
      `Caractères non représentables en ISO-8859-1 : ${offenders.slice(0, 12).join(', ')}${offenders.length > 12 ? '…' : ''}`,
    );
    this.name = 'EdofIso88591EncodingError';
    this.offenders = offenders;
  }
}

/** Vérifie que chaque code point est dans 0x00–0xFF, puis encode en Buffer latin1. */
export function encodeLheoXmlIso8859_1(xml: string): Buffer {
  const offenders: string[] = [];
  const seen = new Set<number>();
  for (const ch of xml) {
    const cp = ch.codePointAt(0);
    if (cp === undefined) continue;
    if (cp > 0xff && !seen.has(cp)) {
      seen.add(cp);
      const glyph = cp > 0xffff ? ch : `'${ch}'`;
      offenders.push(`U+${cp.toString(16).toUpperCase().padStart(4, '0')} ${glyph}`);
    }
  }
  if (offenders.length > 0) {
    throw new EdofIso88591EncodingError(offenders);
  }
  return Buffer.from(xml, 'latin1');
}
