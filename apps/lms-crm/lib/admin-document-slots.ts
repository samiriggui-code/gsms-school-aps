/** Identifiants stables stockés en base (`SystemSetting.administrativeDossier` + `FileAsset.category`). */
export const ADMIN_DOC_MODULE = 'COMPANY_ADMIN_DOCS';
export const ADMIN_DOC_ENTITY_TYPE = 'SystemSetting';

export type AdminDocumentGroupId =
  | 'juridique'
  | 'conformite'
  | 'locaux'
  | 'finances'
  | 'rh'
  | 'divers';

export type AdminDocumentSlot = {
  id: string;
  group: AdminDocumentGroupId;
  title: string;
  description: string;
  /** Indication UX seulement — pas de validation serveur stricte. */
  recommended?: boolean;
};

export const ADMIN_DOCUMENT_GROUPS: Record<
  AdminDocumentGroupId,
  { title: string; description: string }
> = {
  juridique: {
    title: 'Juridique & immatriculation',
    description: 'Statuts, extrait Kbis / RNE, immatriculation et pièces légales.',
  },
  conformite: {
    title: 'Assurances & conformité',
    description: 'Assurances, agréments réglementaires, certifications.',
  },
  locaux: {
    title: 'Locaux',
    description: 'Bail, diagnostics, autorisations liées aux locaux.',
  },
  finances: {
    title: 'Finances',
    description: 'Bilans, liasses fiscales, pièces comptables utiles au pilotage.',
  },
  rh: {
    title: 'Ressources humaines',
    description: 'Accords, élections, registres obligatoires côté employeur.',
  },
  divers: {
    title: 'Autres pièces',
    description: 'Documents transverses ou spécifiques à votre structure.',
  },
};

export const ADMIN_DOCUMENT_SLOTS: AdminDocumentSlot[] = [
  {
    id: 'STATUTS_PV',
    group: 'juridique',
    title: 'Statuts & PV',
    description: 'Statuts à jour, PV d’AG modifiant les statuts si applicable.',
    recommended: true,
  },
  {
    id: 'KBIS_RNE',
    group: 'juridique',
    title: 'Extrait Kbis / RNE',
    description: 'Immatriculation au RCS / RNE de moins de trois mois si demandé par un financeur.',
    recommended: true,
  },
  {
    id: 'ASSURANCE_RC_PRO',
    group: 'conformite',
    title: 'Assurance responsabilité civile pro',
    description: 'Police RC professionnelle couvrant l’activité de formation / prestation.',
    recommended: true,
  },
  {
    id: 'AGREMENT_CNAPS',
    group: 'conformite',
    title: 'Agrément CNAPS / carte professionnelle',
    description: 'Si votre activité est soumise à la réglementation sécurité privée.',
  },
  {
    id: 'CERTIFICATION_QUALIOPI',
    group: 'conformite',
    title: 'Certification Qualiopi',
    description: 'Certificat ou attestation de certification et rapport de certification.',
  },
  {
    id: 'CONVENTION_NDA',
    group: 'conformite',
    title: 'Déclaration d’activité (NDA) & spécialités',
    description: 'Copie de la déclaration auprès du préfet de région (déjà partiellement dans le profil).',
  },
  {
    id: 'BAIL_COMMERCIAL',
    group: 'locaux',
    title: 'Bail ou titre d’occupation',
    description: 'Contrat de location, sous-location autorisée ou convention d’occupation.',
    recommended: true,
  },
  {
    id: 'DIAGNOSTICS_LOCAUX',
    group: 'locaux',
    title: 'Diagnostics & ERP',
    description: 'ERP, accessibilité, amiante ou autres diagnostics réglementaires si requis.',
  },
  {
    id: 'BILAN_COMPTABLE',
    group: 'finances',
    title: 'Bilan & comptes annuels',
    description: 'Derniers bilans déposés ou liasse fiscale selon votre forme juridique.',
  },
  {
    id: 'DECLARATIONS_FISCALES',
    group: 'finances',
    title: 'Déclarations fiscales / TVA',
    description: 'Attestations ou déclarations récentes si demandées par un partenaire.',
  },
  {
    id: 'ACCORDS_COLLECTIFS',
    group: 'rh',
    title: 'Accords d’entreprise & IDCC',
    description: 'Accords collectifs, désignation CSE ou documents équivalents.',
  },
  {
    id: 'REGISTRE_DU_COMMERCE_INTERNE',
    group: 'rh',
    title: 'Registre unique du personnel',
    description: 'Extrait ou attestation de tenue du registre (selon effectif et obligations).',
  },
  {
    id: 'AUTRE_PIECE',
    group: 'divers',
    title: 'Autre document officiel',
    description: 'Toute pièce complémentaire (partenariat, convention, courrier préfecture, etc.).',
  },
];

export const ADMIN_DOCUMENT_SLOT_IDS = new Set(ADMIN_DOCUMENT_SLOTS.map((s) => s.id));

export type AdministrativeDossierHistoryEntry = {
  at: string;
  userId: string;
  action: 'FICHE_UPDATE' | 'FILE_ATTACHED' | 'FILE_DETACHED' | 'FILE_REPLACED';
  summary?: string;
};

export type AdministrativeDossierJson = Record<
  string,
  {
    reference?: string;
    issuedAt?: string | null;
    expiresAt?: string | null;
    notes?: string;
    fileAssetId?: string | null;
    /** Dernière modification (métadonnées ou liaison fichier) — ISO */
    updatedAt?: string | null;
    updatedByUserId?: string | null;
    history?: AdministrativeDossierHistoryEntry[];
  }
>;
