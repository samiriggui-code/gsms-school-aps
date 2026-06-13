import type { FormationCatalogApiRow } from '../types/catalog-api';
import type { FormationCatalogMergedDetail } from '../hooks/use-formation-detail-query';

export type ProgramModuleAccordionRow = { id: string; title: string; details: string[] };

export type PrerequisiteTableRow = { item: string; detail: string; importance: string };

export type CertificationStepRow = {
  title: string;
  description: string;
  badge: string;
  iconKey?: string;
};

export type FundingChannelRow = {
  logo?: string | null;
  iconKey?: string | null;
  name: string;
  details: string;
  isPrimary?: boolean;
};

export type FormationSheetViewModel = {
  programModules: ProgramModuleAccordionRow[];
  prerequisiteRows: PrerequisiteTableRow[];
  certificationSteps: CertificationStepRow[];
  programStrip: { uvCount: string; volume: string; theory: string; practice: string };
  prereqStrip: { age: string; french: string; auth: string; casier: string };
  billingStrip: { price: string; cpfLine: string; qualiopi: string; financements: string };
  fundingBlocks: { label: string; info: string }[];
  fundingChannels: FundingChannelRow[];
  presentation: {
    title: string;
    body: string;
    bullets: string[];
    cpfEligible: boolean;
    rncpUrl: string | null;
  };
  loyalty: {
    logoUrl: string | null;
    shortLabel: string;
    versionLabel: string | null;
    deliveryLabel: string | null;
    audienceTitle: string;
    audienceSubtitle: string;
    audience: string;
    prereqTitle: string;
    prereqSubtitle: string;
    prereq: string;
    certBadge: string;
    certOutcome: string;
    progressAxes: string[];
  };
};

function asRecord(row: unknown): Record<string, unknown> {
  return row != null && typeof row === 'object' && !Array.isArray(row)
    ? (row as Record<string, unknown>)
    : {};
}

function pickStr(...candidates: unknown[]): string | null {
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim();
  }
  return null;
}

function numStr(n: unknown, fallback: string): string {
  if (n == null || n === '') return fallback;
  const v = Number(n);
  return Number.isFinite(v) ? String(v) : fallback;
}

/** UV affichées = max(programme détaillé, scalaire fiche) pour éviter 5 vs 14 modules. */
function resolveUvCount(unitsCount: unknown, programModuleCount: number): string {
  const fromDb = Number(unitsCount);
  const dbVal = Number.isFinite(fromDb) && fromDb > 0 ? fromDb : 0;
  return String(Math.max(programModuleCount, dbVal, 1));
}

export function stringArrayFromJson(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === 'string').map((s) => s.trim());
}

function parseProgramModulesRaw(
  raw: unknown,
  fallbackModuleTitles: string[],
): ProgramModuleAccordionRow[] {
  if (Array.isArray(raw) && raw.length > 0) {
    const out: ProgramModuleAccordionRow[] = [];
    for (let i = 0; i < raw.length; i++) {
      const x = raw[i];
      if (!x || typeof x !== 'object' || Array.isArray(x)) continue;
      const o = x as Record<string, unknown>;
      const title = pickStr(o.title);
      if (!title) continue;
      const id = pickStr(o.id) ?? `M${out.length + 1}`;
      let details = stringArrayFromJson(o.details);
      if (!details.length) {
        details = [`Approfondissement des objectifs du module « ${title} » (référentiel de la formation).`];
      }
      out.push({ id, title, details });
    }
    if (out.length) return out;
  }
  return fallbackModuleTitles.map((title, i) => ({
    id: `M${i + 1}`,
    title,
    details: [`Contenus et objectifs alignés sur le module « ${title} ».`],
  }));
}

function parsePrerequisites(raw: unknown): PrerequisiteTableRow[] {
  if (!Array.isArray(raw)) return [];
  const out: PrerequisiteTableRow[] = [];
  for (const x of raw) {
    if (!x || typeof x !== 'object' || Array.isArray(x)) continue;
    const o = x as Record<string, unknown>;
    const item = pickStr(o.item);
    const detail = pickStr(o.detail) ?? '—';
    const importance = pickStr(o.importance) ?? '—';
    if (item) out.push({ item, detail, importance });
  }
  return out;
}

function parseCertificationSteps(raw: unknown): CertificationStepRow[] {
  if (!Array.isArray(raw)) return [];
  const out: CertificationStepRow[] = [];
  for (const x of raw) {
    if (!x || typeof x !== 'object' || Array.isArray(x)) continue;
    const o = x as Record<string, unknown>;
    const title = pickStr(o.title);
    const description = pickStr(o.description) ?? '';
    const badge = pickStr(o.badge) ?? 'Étape';
    const iconKey = pickStr(o.iconKey) ?? undefined;
    if (title) out.push({ title, description, badge, iconKey });
  }
  return out;
}

function parseFundingBlocks(raw: unknown): { label: string; info: string }[] {
  if (!Array.isArray(raw)) return [];
  const out: { label: string; info: string }[] = [];
  for (const x of raw) {
    if (!x || typeof x !== 'object' || Array.isArray(x)) continue;
    const o = x as Record<string, unknown>;
    const label = pickStr(o.label);
    const info = pickStr(o.info) ?? '';
    if (label) out.push({ label, info });
  }
  return out;
}

function parseFundingChannels(raw: unknown): FundingChannelRow[] {
  if (!Array.isArray(raw)) return [];
  const out: FundingChannelRow[] = [];
  for (const x of raw) {
    if (!x || typeof x !== 'object' || Array.isArray(x)) continue;
    const o = x as Record<string, unknown>;
    const name = pickStr(o.name);
    const details = pickStr(o.details) ?? '';
    if (!name) continue;
    out.push({
      logo: typeof o.logo === 'string' ? o.logo : null,
      iconKey: typeof o.iconKey === 'string' ? o.iconKey : null,
      name,
      details,
      isPrimary: Boolean(o.isPrimary),
    });
  }
  return out;
}

function parseComplementary(raw: unknown): Record<string, unknown> {
  const o = asRecord(raw);
  const ta = asRecord(o.targetAudience);
  const ps = asRecord(o.prerequisitesSummary);
  const cs = asRecord(o.certificationSummary);
  return { ...o, targetAudience: ta, prerequisitesSummary: ps, certificationSummary: cs };
}

function formatPrice(priceFrom: unknown, currency: unknown): string {
  const n = Number(priceFrom);
  const cur = typeof currency === 'string' && currency.trim() ? currency.trim() : 'EUR';
  if (!Number.isFinite(n)) return 'Sur devis';
  try {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: cur }).format(n);
  } catch {
    return `${n} ${cur}`;
  }
}

/** Fusionne liste catalogue + détail GET (le détail l’emporte). */
export function buildFormationSheetViewModel(
  detail: FormationCatalogMergedDetail | undefined,
  listRow: FormationCatalogApiRow | null,
): FormationSheetViewModel {
  const d = asRecord(detail);
  const l = asRecord(listRow);
  const src: Record<string, unknown> = { ...l, ...d };

  const fallbackModules = stringArrayFromJson(l.modules ?? d.modules);
  const programModules = parseProgramModulesRaw(src.programModules, fallbackModules);

  let prerequisiteRows = parsePrerequisites(src.prerequisitesTable);
  if (!prerequisiteRows.length) {
    prerequisiteRows = [
      { item: '—', detail: "Prérequis : consultez le bulletin d'inscription ou contactez l'organisme.", importance: '—' },
    ];
  }

  const name = pickStr(src.name) ?? 'Formation';
  let certificationSteps = parseCertificationSteps(src.certificationSteps);
  if (!certificationSteps.length) {
    certificationSteps = [
      {
        title: 'Mises en situation',
        description: `Exercices pratiques adaptés au référentiel « ${name} ».`,
        badge: 'Pratique',
        iconKey: 'clipboard-check',
      },
      {
        title: 'Évaluation des acquis',
        description: 'Contrôles formatifs ou certificatifs selon le référentiel du parcours.',
        badge: 'Validation',
        iconKey: 'check-circle',
      },
      {
        title: 'Attestation ou certification',
        description: `Attestation ou certification selon les objectifs de « ${name} ».`,
        badge: 'Certification',
        iconKey: 'graduation-cap',
      },
    ];
  }

  const uvCount = resolveUvCount(src.unitsCount, programModules.length);
  const volume =
    pickStr(src.volumeHoursLabel) ??
    pickStr(src.duration) ??
    pickStr(l.duration) ??
    pickStr(d.duration) ??
    '—';
  const theory = numStr(src.theoryPercent, '—');
  const practice = numStr(src.practicePercent, '—');
  const theoryLabel = theory !== '—' ? `${theory}%` : '—';
  const practiceLabel = practice !== '—' ? `${practice}%` : '—';

  const prereqStrip = {
    age: pickStr(src.minAgeLabel) ?? '—',
    french: pickStr(src.frenchLevel) ?? '—',
    auth: pickStr(src.authorizationSummary) ?? pickStr(src.tag) ?? '—',
    casier: pickStr(src.criminalRecordRequirement) ?? '—',
  };

  const cpfEligible = Boolean(src.cpfEligible);
  const qualiopi = Boolean(src.qualiopiCertified);
  const billingStrip = {
    price: formatPrice(src.priceFrom, src.currency),
    cpfLine: cpfEligible ? 'Éligible CPF' : 'Selon référentiel',
    qualiopi: qualiopi ? 'Certification Qualité' : 'Organisme',
    financements: 'Plusieurs options possibles',
  };

  let fundingBlocks = parseFundingBlocks(src.fundingBlocks);
  if (!fundingBlocks.length) {
    fundingBlocks = [
      { label: 'Organisme', info: 'Renseignez-vous auprès du service formation pour les modalités de financement.' },
    ];
  }

  let fundingChannels = parseFundingChannels(src.fundingChannels);
  if (!fundingChannels.length) {
    fundingChannels = [
      { logo: '/media/formations/2600x1600/compte-formation.jpg', name: 'Mon Compte Formation (CPF)', details: 'Selon éligibilité', isPrimary: true },
    ];
  }

  const cd = parseComplementary(src.complementaryDetails);
  const ta = asRecord(cd.targetAudience);
  const ps = asRecord(cd.prerequisitesSummary);
  const cs = asRecord(cd.certificationSummary);

  const presentationBody =
    pickStr(src.longDescription) ?? pickStr(src.description) ?? '';
  let bullets = stringArrayFromJson(src.presentationBullets).map((s) =>
    s.startsWith('-') ? s : `- ${s}`,
  );
  if (!bullets.length && fallbackModules.length) {
    bullets = fallbackModules.slice(0, 8).map((m) => `- ${m}`);
  }

  const presentation = {
    title: pickStr(src.presentationTitle) ?? name,
    body: presentationBody,
    bullets,
    cpfEligible,
    rncpUrl: pickStr(src.rncpUrl),
  };

  const rawVersion = pickStr(cd.contentVersion);
  const versionLabel = rawVersion
    ? /^version\s/i.test(rawVersion)
      ? rawVersion
      : `Version ${rawVersion}`
    : null;

  const progressAxes = stringArrayFromJson(cd.progressAxisLabels);
  const sliderLabels =
    progressAxes.length >= 2
      ? progressAxes
      : ['Objectif 1', 'Objectif 2', 'Objectif 3', 'Objectif 4', 'Objectif 5'];

  const loyalty = {
    logoUrl: pickStr(src.logoUrl),
    shortLabel: pickStr(cd.commercialShortName) ?? name,
    versionLabel,
    deliveryLabel: pickStr(cd.deliveryModeLabel),
    audienceTitle: pickStr(ta.title) ?? 'Public concerné',
    audienceSubtitle: pickStr(ta.subtitle) ?? 'Bénéficiaires',
    audience: pickStr(ta.value) ?? (presentationBody ? presentationBody.slice(0, 220) : '—'),
    prereqTitle: pickStr(ps.title) ?? 'Prérequis',
    prereqSubtitle: pickStr(ps.subtitle) ?? "Conditions d'accès",
    prereq: pickStr(ps.value) ?? "Voir l'onglet Prérequis.",
    certBadge: pickStr(cs.badgeLabel) ?? pickStr(src.tag) ?? 'Référentiel',
    certOutcome: pickStr(cs.outcomeLabel) ?? name,
    progressAxes: sliderLabels.slice(0, 5),
  };

  return {
    programModules,
    prerequisiteRows,
    certificationSteps,
    programStrip: { uvCount, volume, theory: theoryLabel, practice: practiceLabel },
    prereqStrip,
    billingStrip,
    fundingBlocks,
    fundingChannels,
    presentation,
    loyalty,
  };
}
