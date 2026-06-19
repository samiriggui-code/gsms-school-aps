import type { OfficialDocumentAuthor } from '@/lib/reports/official-document-types';

export type OfficialExportTemplateKey =
  | 'rh.fiche-collaborateur'
  | 'rh.fiche-formateur'
  | 'rh.contrat-travail'
  | 'academic.fiche-etudiant';

export type OfficialExportJob = {
  templateKey: OfficialExportTemplateKey;
  userId: string;
  generatedAt: string;
  author: OfficialDocumentAuthor | null;
  options?: {
    signatureDate?: string;
    parcoursAnnex?: {
      formationVisee?: string | null;
      dossierCatalogueStatut?: string | null;
      autorisationPrefalable?: string | null;
    };
  };
};

export const OFFICIAL_EXPORT_CACHE_PREFIX = 'official-export:';
export const OFFICIAL_EXPORT_TTL_SECONDS = 300;

export type OfficialExportPreviewRequest = {
  templateKey: OfficialExportTemplateKey;
  userId: string;
  options?: OfficialExportJob['options'];
  /** `0` = aperçu sans impression auto */
  print?: boolean;
};
