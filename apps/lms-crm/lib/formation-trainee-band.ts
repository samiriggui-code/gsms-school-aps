/**
 * Déduit une fourchette d'effectif par session lorsque les champs `Formation.traineesMin/Max`
 * sont absents en base (anciennes données, import partiel…) — même logique que
 * `packages/database/prisma/data/formations-seed.js` (`parseHours` + `traineesIntervalForCatalog`).
 */

/** Retourne un ordre de grandeur d'heures min à partir du libellé durée vitrine (équivalent seed). */
export function parseFormationDurationMinHours(duration: unknown): number | null {
  if (duration == null || typeof duration !== 'string') return null;
  const d = duration.replace(/\u00a0/g, ' ').trim();
  let m = d.match(/(\d+)\s*h\s*[àa]\s*(\d+)/i);
  if (m) return Number(m[1]);
  m = d.match(/(\d+)\s*h\s*(?:\(|minimum|$)/i);
  if (m) return Number(m[1]);
  m = d.match(/\((\d+)\s*h/i);
  if (m) return Number(m[1]);
  m = d.match(/(\d+)\s*h\s*\/\s*24\s*mois/i);
  if (m) return Number(m[1]);
  m = d.match(/(\d+)\s*a\s*(\d+)\s*semaines/i);
  if (m) return Number(m[1]) * 35;
  m = d.match(/(\d+(?:[.,]\d+)?)\s*a\s*(\d+(?:[.,]\d+)?)\s*jours/i);
  if (m) {
    const a = Number(String(m[1]).replace(',', '.'));
    return Math.round(a * 7);
  }
  m = d.match(/^(\d+)\s*jour(?:s)?\b/i);
  if (m) return Number(m[1]) * 7;
  m = d.match(/(\d+)\s*h\s*30\b/i);
  if (m) return Number(m[1]) + 0.5;
  return null;
}

function traineesIntervalFromHoursAndTrack(hMin: number | null, track: string): { min: number; max: number } {
  if (hMin != null && hMin >= 70) return { min: 4, max: 12 };
  if (hMin != null && hMin >= 14) return { min: 4, max: 12 };
  if (hMin != null && hMin >= 7) return { min: 6, max: 15 };
  if (hMin != null && hMin >= 3) return { min: 8, max: 18 };
  if (hMin != null) return { min: 10, max: 20 };
  if (track === 'entreprise') return { min: 10, max: 24 };
  if (track === 'habilitation' || track === 'sst') return { min: 6, max: 14 };
  return { min: 6, max: 14 };
}

function readScalarInt(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = Number(value as number | string);
  return Number.isFinite(n) ? n : null;
}

/** Min / max effectifs utilisables dans l’API CRM (liste, détail, bibliothèque). */
export function effectiveTraineesBandForFormationScalars(input: {
  traineesMin?: unknown;
  traineesMax?: unknown;
  duration?: unknown;
  track?: unknown;
}): { traineesMin: number; traineesMax: number } {
  const a = readScalarInt(input.traineesMin);
  const b = readScalarInt(input.traineesMax);
  if (a != null && b != null && a >= 1 && b >= 1) {
    return { traineesMin: Math.min(a, b), traineesMax: Math.max(a, b) };
  }
  const dur = parseFormationDurationMinHours(input.duration);
  const track =
    typeof input.track === 'string' && input.track.trim()
      ? input.track.trim().toLowerCase()
      : 'autres';
  const { min, max } = traineesIntervalFromHoursAndTrack(dur, track);
  return { traineesMin: min, traineesMax: max };
}
