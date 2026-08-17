import type { FormationSheetViewModel } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/utils/formation-catalog-sheet-view-model';

export type PlaquetteClientNeedRow = { label: string; value: string };

export type PlaquetteTimelineEvent = {
  id: string;
  kind: 'milestone' | 'exchange';
  title: string;
  atIso: string;
  body: string | null;
  highlight?: boolean;
};

export type PlaquetteIssuer = {
  name: string;
  logoUrl: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
};

export type PlaquetteMessageRow = {
  id: string;
  authorKind: string;
  body: string;
  authorLabel: string | null;
  createdAt: string;
};

export type PlaquetteDevisLine = {
  label: string;
  quantity: number;
  unitPriceHt: number;
  vatRate: number;
};

export type PlaquettePayload = {
  devis: {
    id: string;
    referenceCode: string;
    title: string;
    status: string;
    statusLabel: string;
    currency: string;
    validUntil: string | null;
    createdAt: string;
    updatedAt: string;
    subtotalHt: number;
    vatTotal: number;
    totalTtc: number;
    lines: PlaquetteDevisLine[];
  };
  lead: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    notes: string | null;
    source: string | null;
  } | null;
  formationSession: { dateDisplayLabel: string; location: string } | null;
  formation: { id: string; name: string; slug: string };
  issuer: PlaquetteIssuer;
  /** Sans offre catalogue : false. */
  hasCatalogOffer: boolean;
  viewModel: FormationSheetViewModel;
  clientNeeds: PlaquetteClientNeedRow[];
  timeline: PlaquetteTimelineEvent[];
  plaquetteMessages: PlaquetteMessageRow[];
};

