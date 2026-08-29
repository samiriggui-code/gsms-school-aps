import { FundingCaseStatus } from '@repo/database';

/**
 * Checklist OPCO hors-apprentissage — scope vérifié **AFDAS + ATLAS** seulement
 * (`OPCO_HORS_APPRENTISSAGE` dans connector-capabilities.json).
 * « Fait » via FundingDocument codes OPCO_* (pas de nouveau Prisma).
 */

export type OpcoDossierStepState = 'upcoming' | 'due' | 'done';

export type OpcoDossierStepDef = {
  code: string;
  label: string;
  portalHint: string;
  dueFrom: FundingCaseStatus[];
};

export const OPCO_DOSSIER_STEPS: OpcoDossierStepDef[] = [
  {
    code: 'OPCO_DEMANDE_PRISE_EN_CHARGE',
    label: 'Déposer la demande de prise en charge (extranet OPCO)',
    portalHint: 'MyA (AFDAS) / myAtlas — saisie manuelle de la demande.',
    dueFrom: [
      FundingCaseStatus.READY_TO_SUBMIT,
      FundingCaseStatus.SUBMITTED,
      FundingCaseStatus.PENDING,
      FundingCaseStatus.APPROVED,
      FundingCaseStatus.PARTIALLY_APPROVED,
      FundingCaseStatus.SERVICE_IN_PROGRESS,
      FundingCaseStatus.SERVICE_COMPLETED,
      FundingCaseStatus.JUSTIFICATION_REQUIRED,
      FundingCaseStatus.READY_TO_INVOICE,
      FundingCaseStatus.INVOICED,
      FundingCaseStatus.PAYMENT_PENDING,
      FundingCaseStatus.PAID,
    ],
  },
  {
    code: 'OPCO_CERTIFICATION_ASSIDUITE',
    label: 'Certifier l’assiduité / réalisation',
    portalHint: 'Après fin de formation — certification d’assiduité sur le portail OPCO.',
    dueFrom: [
      FundingCaseStatus.SERVICE_COMPLETED,
      FundingCaseStatus.JUSTIFICATION_REQUIRED,
      FundingCaseStatus.READY_TO_INVOICE,
      FundingCaseStatus.INVOICED,
      FundingCaseStatus.PAYMENT_PENDING,
      FundingCaseStatus.PAID,
    ],
  },
  {
    code: 'OPCO_FACTURE',
    label: 'Déposer / rattacher la facture sur le portail OPCO',
    portalHint: 'Facture côté extranet OPCO (pas Factur-X interne GSMS pour ce flux).',
    dueFrom: [
      FundingCaseStatus.READY_TO_INVOICE,
      FundingCaseStatus.INVOICED,
      FundingCaseStatus.PAYMENT_PENDING,
      FundingCaseStatus.PAID,
    ],
  },
];

const DONE_DOC_STATUSES = new Set(['VALIDATED', 'UPLOADED']);

/** Codes / libellés éligibles — AFDAS & ATLAS uniquement (scope vérifié). */
export function isOpcoChecklistEligibleProvider(provider: {
  code: string;
  label: string;
}): boolean {
  const code = provider.code.toUpperCase();
  const label = provider.label.toUpperCase();
  if (code === 'AFDAS' || code === 'ATLAS') return true;
  if (code.includes('AFDAS') || code.includes('ATLAS')) return true;
  if (label.includes('AFDAS') || label.includes('ATLAS')) return true;
  // Sync matrice actuelle : un seul FundingProvider `OPCO_HORS_APPRENTISSAGE`
  // (notes JSON : vérifié AFDAS+ATLAS seulement — pas les 9 autres).
  if (code === 'OPCO_HORS_APPRENTISSAGE') return true;
  return false;
}

export type OpcoDossierStepView = OpcoDossierStepDef & {
  state: OpcoDossierStepState;
  documentId: string | null;
  documentStatus: string | null;
};

export function buildOpcoDossierChecklist(input: {
  caseStatus: FundingCaseStatus;
  documents: Array<{ id: string; code: string; status: string }>;
}): OpcoDossierStepView[] {
  const byCode = new Map(input.documents.map((d) => [d.code, d]));

  return OPCO_DOSSIER_STEPS.map((step) => {
    const doc = byCode.get(step.code);
    const done = doc ? DONE_DOC_STATUSES.has(doc.status) : false;
    let state: OpcoDossierStepState = 'upcoming';
    if (done) state = 'done';
    else if (step.dueFrom.includes(input.caseStatus)) state = 'due';

    return {
      ...step,
      state,
      documentId: doc?.id ?? null,
      documentStatus: doc?.status ?? null,
    };
  });
}
