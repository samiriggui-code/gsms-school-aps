import type {
  CatalogProgramOpen,
  FormationVitrineItem,
  FormationVitrineTrack,
} from '../data/formation-vitrine-catalog';

/** Lifecycle catalogue école (`FormationCatalogOffer.catalogStatus`). */
export type FormationLifecycleApiStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

/** Ligne liste catalogue CRM : offre + données fusionnées avec la fiche référence `Formation`. */
export type FormationCatalogApiRow = FormationVitrineItem & {
  /** Identifiant `FormationCatalogOffer`. */
  id: string;
  formationId: string;
  catalogProgramConfig: CatalogProgramOpen;
  /** Statut inclusion catalogue (actif / suspendu…). */
  status: FormationLifecycleApiStatus;
  priceFrom: number | null;
  currency: string;
  /** Effectif affiché (scalaires fusionnés avec inférence durée/filière si nécessaire). */
  traineesMin: number;
  traineesMax: number;
  logoUrl?: string | null;
  providerName?: string | null;
  providerEmail?: string | null;
  providerPhone?: string | null;
  providerAddress?: string | null;
  nextSessionLabel?: string | null;
  /** Données riches fiche (onglets Programme, Prérequis…) — alignées sur `Formation` en base. */
  cpfEligible?: boolean;
  qualiopiCertified?: boolean;
  presentationTitle?: string | null;
  longDescription?: string | null;
  presentationBullets?: unknown;
  programModules?: unknown;
  certificationSteps?: unknown;
  complementaryDetails?: unknown;
  fundingChannels?: unknown;
  unitsCount?: number | null;
  volumeHoursLabel?: string | null;
  theoryPercent?: number | null;
  practicePercent?: number | null;
  minAgeLabel?: string | null;
  frenchLevel?: string | null;
  authorizationSummary?: string | null;
  criminalRecordRequirement?: string | null;
  rncpUrl?: string | null;
  fundingBlocks: unknown;
  prerequisitesTable: unknown;
};

export type FormationCatalogStatsApi = {
  totalFormations: number;
  activeFormations: number;
  draftFormations: number;
  archivedFormations: number;
  featuredFormations: number;
  totalVitrineSessions: number;
  byTrack: Partial<Record<FormationVitrineTrack, number>>;
};

/** Entrée référentiel formations pour ajout manuel au catalogue (inclut celles déjà publiées). */
export type FormationLibraryApiRow = {
  id: string;
  slug: string;
  name: string;
  track: FormationVitrineTrack;
  tag: string;
  duration: string;
  parcoursSpecialite: FormationVitrineItem['parcoursSpecialite'];
  /** Effectif typique par session (fiche métier + inférence CRM si DB vide). */
  traineesMin: number;
  traineesMax: number;
  /** Déjà liée à une offre dans `FormationCatalogOffer` — non sélectionnable pour un nouvel ajout. */
  alreadyInCatalog: boolean;
};
