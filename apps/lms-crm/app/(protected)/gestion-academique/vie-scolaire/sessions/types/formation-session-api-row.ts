import type {
  FormationParcoursSpecialite,
  FormationVitrineTrack,
} from '@/app/(protected)/gestion-academique/vie-scolaire/formations/data/formation-vitrine-catalog';

/** Données fiche vitrine (cartes Présentation / Détails) — alignées sur `Formation` en base. */
export type FormationSessionVitrineOverview = {
  logoUrl: string | null;
  presentationTitle: string;
  presentationBody: string;
  bullets: string[];
  cpfEligible: boolean;
  rncpUrl: string | null;
  shortLabel: string;
  contentVersionLabel: string | null;
  deliveryModeLabel: string | null;
  audience: { title: string; subtitle: string; value: string };
  prerequisites: { title: string; subtitle: string; value: string };
  certification: { badgeLabel: string; outcomeLabel: string };
  progressAxes: string[];
};

export type FormationSessionApiRow = {
  id: string;
  formationId: string;
  formationSlug: string;
  formationName: string;
  formationTrack: FormationVitrineTrack;
  formationParcours: FormationParcoursSpecialite;
  formationTag: string;
  formationDuration: string;
  startDate: string | null;
  endDate: string | null;
  registrationClosesAt: string | null;
  examDate: string | null;
  traineesMin: number | null;
  traineesMax: number | null;
  trainerUserId: string | null;
  trainerName: string | null;
  trainerEmail: string | null;
  /** Photo formateur (URL relative ou absolue côté client). */
  trainerAvatar: string | null;
  /** Salle réservée pour la session (réf. `FormationVenueRoom`). */
  venueRoomId: string | null;
  venueRoom: { id: string; name: string; imageUrl: string | null } | null;
  reservedEquipmentIds: string[];
  reservedEquipment: {
    id: string;
    label: string;
    serialNumber: string;
    type: string | null;
    status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
    createdAt: string;
    updatedAt: string;
    assignedSite: { id: string; name: string } | null;
  }[];
  dateDisplayLabel: string;
  location: string;
  sessionKind: 'INITIAL' | 'WITH_EXAM' | 'OTHER';
  sessionSubtitle: string | null;
  venueBrandPrefix: string | null;
  sortOrder: number;
  bookingEnabled: boolean;
  bookingUrl: string | null;
  createdAt: string;
  updatedAt: string;
  participants: { userId: string; name: string | null; email: string; avatar: string | null }[];
  /** Prix affiché catalogue (override offre sinon `Formation.priceFrom`). */
  catalogPriceFrom: number | null;
  catalogPriceCurrency: string;
  /** Taux de réussite fiche référence (pour Statistics1). */
  formationSuccessRate: number | null;

  /** Cartes vue d’ensemble (remplace le bloc démo TFP APS). */
  formationVitrineOverview: FormationSessionVitrineOverview;
  formationProviderName: string | null;
  formationProviderEmail: string | null;
  formationProviderPhone: string | null;
  formationProviderAddress: string | null;
  formationNextSessionLabel: string | null;
};

