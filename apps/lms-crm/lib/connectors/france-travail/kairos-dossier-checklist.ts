import { FundingCaseStatus } from '@repo/database';

/**
 * Checklist FRANCE_TRAVAIL_KAIROS_PORTAIL (MANUAL_PORTAL, verified).
 * « Fait » via FundingDocument codes FT_* — pas de nouveau Prisma.
 */

export type FtDossierStepState = 'upcoming' | 'due' | 'done';

export type FtDossierStepDef = {
  code: string;
  label: string;
  portalHint: string;
  dueFrom: FundingCaseStatus[];
};

export const FT_KAIROS_DOSSIER_STEPS: FtDossierStepDef[] = [
  {
    code: 'FT_DEVIS_AIF_POEI',
    label: 'Saisir le devis AIF / POEI sur Kairos',
    portalHint:
      'Portail Kairos — saisie devis conditionnée à l’affichage de la certification Qualiopi côté France Travail.',
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
    code: 'FT_AIS_INSCRIPTION',
    label: 'Attestation d’inscription / AIS (après validation conseiller)',
    portalHint: 'Une fois le conseiller FT a validé — AIS / inscription sur Kairos.',
    dueFrom: [
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
    code: 'FT_ASSIDUITE_BILAN',
    label: 'Saisir assiduité + bilan sur Kairos',
    portalHint: 'Fin de prestation — assiduité et bilan de formation.',
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
    code: 'FT_FACTURATION',
    label: 'Facturation sur Kairos',
    portalHint: 'Appel / facturation côté portail France Travail Kairos.',
    dueFrom: [
      FundingCaseStatus.READY_TO_INVOICE,
      FundingCaseStatus.INVOICED,
      FundingCaseStatus.PAYMENT_PENDING,
      FundingCaseStatus.PAID,
    ],
  },
];

const DONE_DOC_STATUSES = new Set(['VALIDATED', 'UPLOADED']);

export type FtDossierStepView = FtDossierStepDef & {
  state: FtDossierStepState;
  documentId: string | null;
  documentStatus: string | null;
};

export function buildFtKairosDossierChecklist(input: {
  caseStatus: FundingCaseStatus;
  documents: Array<{ id: string; code: string; status: string }>;
}): FtDossierStepView[] {
  const byCode = new Map(input.documents.map((d) => [d.code, d]));

  return FT_KAIROS_DOSSIER_STEPS.map((step) => {
    const doc = byCode.get(step.code);
    const done = doc ? DONE_DOC_STATUSES.has(doc.status) : false;
    let state: FtDossierStepState = 'upcoming';
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
