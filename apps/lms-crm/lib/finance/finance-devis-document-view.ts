import type { FinanceDevisPdfRow } from './finance-devis-types';

export type FinanceDocumentClientField = { label: string; value: string };

const SNAPSHOT_LABELS: Record<string, string> = {
  company: 'Raison sociale',
  companySiret: 'SIRET',
  companySiren: 'SIREN',
  siret: 'SIRET',
  siren: 'SIREN',
  deliveryMode: 'Mode de prestation',
  preferredDates: 'Période souhaitée',
  fundingHint: 'Financement envisagé',
  traineesExpected: 'Stagiaires prévus',
  address: 'Adresse',
  postalCode: 'Code postal',
  city: 'Ville',
  country: 'Pays',
  vatNumber: 'N° TVA intracommunautaire',
  email: 'E-mail',
  phone: 'Téléphone',
  contactName: 'Contact',
  contactFirstName: 'Prénom du contact',
  contactLastName: 'Nom du contact',
  billingAddress: 'Adresse de facturation',
  shippingAddress: 'Adresse de livraison',
};

/** Clés techniques / CRM — jamais affichées sur un document client. */
const HIDDEN_SNAPSHOT_KEYS = new Set([
  'isviewedCaptured',
  'isViewedCaptured',
  'viewedAt',
  'crmSlug',
  'leadId',
  'source',
  'deliveryDate',
  'internalNotes',
  'deliveryMode',
  'preferredDates',
  'fundingHint',
  'traineesExpected',
  'contactFirstName',
  'contactLastName',
  'contactName',
  'billingAddress',
  'shippingAddress',
  'companySiren',
  'siren',
  'country',
]);

const INTERNAL_NOTE_PATTERNS = [
  /^envoy[eé]\s+au\s+client/i,
  /\(voir\)/i,
  /\(test\)/i,
  /^test\b/i,
  /\binterne\b/i,
  /^brouillon\b/i,
];

function labelForKey(key: string): string {
  return SNAPSHOT_LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim();
}

function isDisplayableValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'object') return false;
  const s = String(value).trim();
  if (!s) return false;
  if (s === 'None' || s === 'null' || s === 'undefined' || s === '0') return false;
  return true;
}

export function snapshotFieldsForDocument(raw: unknown): FinanceDocumentClientField[] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
  const snap = raw as Record<string, unknown>;
  const out: FinanceDocumentClientField[] = [];
  const seen = new Set<string>();

  for (const [key, value] of Object.entries(snap)) {
    if (HIDDEN_SNAPSHOT_KEYS.has(key)) continue;
    if (!isDisplayableValue(value)) continue;
    const label = labelForKey(key);
    const norm = label.toLowerCase();
    if (seen.has(norm)) continue;
    seen.add(norm);
    out.push({ label, value: String(value).trim() });
  }

  return out;
}

/** Notes visibles sur un document client — exclut les mentions CRM internes. */
export function clientVisibleDocumentNotes(notes?: string | null): string | null {
  const trimmed = notes?.trim();
  if (!trimmed) return null;
  if (INTERNAL_NOTE_PATTERNS.some((re) => re.test(trimmed))) return null;
  return trimmed;
}

function clientSnapshot(row: FinanceDevisPdfRow): Record<string, unknown> {
  if (!row.clientSnapshot || typeof row.clientSnapshot !== 'object' || Array.isArray(row.clientSnapshot)) {
    return {};
  }
  return row.clientSnapshot as Record<string, unknown>;
}

function clientCompanyName(row: FinanceDevisPdfRow, snap: Record<string, unknown>): string {
  const fromSnap = typeof snap.company === 'string' ? snap.company.trim() : '';
  if (fromSnap) return fromSnap;
  if (row.lead) return `${row.lead.firstName} ${row.lead.lastName}`.trim();
  return 'Client';
}

function clientAddressBlock(snap: Record<string, unknown>): string[] {
  const lines: string[] = [];
  const street = typeof snap.address === 'string' ? snap.address.trim() : '';
  const postal = typeof snap.postalCode === 'string' ? snap.postalCode.trim() : '';
  const city = typeof snap.city === 'string' ? snap.city.trim() : '';
  const locality = [postal, city].filter(Boolean).join(' ');
  if (street) lines.push(street);
  if (locality) lines.push(locality);
  return lines;
}

/** Bloc destinataire facturation — raison sociale, contact, adresse postale uniquement. */
export function buildDocumentClientBlock(row: FinanceDevisPdfRow): {
  title: string;
  lines: string[];
} {
  const snap = clientSnapshot(row);
  const title = clientCompanyName(row, snap);
  const lines: string[] = [];

  if (row.lead) {
    const person = `${row.lead.firstName} ${row.lead.lastName}`.trim();
    if (person && person.toLowerCase() !== title.toLowerCase()) lines.push(person);
  }

  for (const addr of clientAddressBlock(snap)) lines.push(addr);

  return { title, lines: lines.slice(0, 3) };
}

export function formatDocumentDate(iso: string | Date | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(iso));
  } catch {
    return '—';
  }
}
