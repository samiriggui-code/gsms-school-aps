import { FundingCaseStatus } from '@repo/database';

/**
 * Assistant checklist EDOF_DOSSIER (MANUAL_PORTAL) — pas d'API.
 * État « fait » stocké via FundingDocument existant (code EDOF_*).
 */

export type EdofDossierStepState = 'upcoming' | 'due' | 'done';

export type EdofDossierStepDef = {
  code: string;
  label: string;
  portalHint: string;
  /** Statuts où l’étape devient « à faire » (due). */
  dueFrom: FundingCaseStatus[];
};

export const EDOF_DOSSIER_STEPS: EdofDossierStepDef[] = [
  {
    code: 'EDOF_SAISIE_DOSSIER',
    label: 'Saisir / compléter le dossier sur le portail EDOF',
    portalHint:
      'Ouvrir le dossier CPF sur EDOF et reporter les infos GSMS (référence externe si connue).',
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
    code: 'EDOF_ENTREE_FORMATION',
    label: 'Déclarer l’entrée en formation sur EDOF',
    portalHint: 'Une fois le stagiaire entré en session — saisie manuelle portail EDOF.',
    dueFrom: [
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
    code: 'EDOF_SERVICE_FAIT',
    label: 'Déclarer le service fait (DSF) sur EDOF',
    portalHint: 'Après fin de prestation — déclaration de service fait sur le portail.',
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
    code: 'EDOF_APPEL_REGLEMENT',
    label: 'Lancer l’appel à règlement sur EDOF',
    portalHint:
      'Appel à règlement côté EDOF (hors Factur-X/PDP interne — doctrine CDC).',
    dueFrom: [
      FundingCaseStatus.READY_TO_INVOICE,
      FundingCaseStatus.INVOICED,
      FundingCaseStatus.PAYMENT_PENDING,
      FundingCaseStatus.PAID,
    ],
  },
];

const DONE_DOC_STATUSES = new Set(['VALIDATED', 'UPLOADED']);

export type EdofDossierStepView = EdofDossierStepDef & {
  state: EdofDossierStepState;
  documentId: string | null;
  documentStatus: string | null;
};

export function buildEdofDossierChecklist(input: {
  caseStatus: FundingCaseStatus;
  documents: Array<{ id: string; code: string; status: string }>;
}): EdofDossierStepView[] {
  const byCode = new Map(input.documents.map((d) => [d.code, d]));

  return EDOF_DOSSIER_STEPS.map((step) => {
    const doc = byCode.get(step.code);
    const done = doc ? DONE_DOC_STATUSES.has(doc.status) : false;
    let state: EdofDossierStepState = 'upcoming';
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
