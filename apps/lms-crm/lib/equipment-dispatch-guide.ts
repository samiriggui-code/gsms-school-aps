/**
 * Aide au dispatch équipement — recommandations par profil salle / filière session / type de réservation.
 * Inventaire global = pool ; affectation salle ou réservation session = action explicite admin.
 */

export type DispatchScope = 'ROOM' | 'SESSION' | 'BOOKING';
export type DispatchKind = 'FIXED' | 'MOBILE';
export type DispatchLineStatus = 'complete' | 'partial' | 'missing' | 'insufficient_stock';

export type DispatchRequirement = {
  catalogKey: string;
  catalogLabel: string;
  quantity: number;
  kind: DispatchKind;
  scope: DispatchScope;
  reason: string;
};

export type DispatchGuideLine = DispatchRequirement & {
  quantityAssigned: number;
  quantityAvailableGlobal: number;
  status: DispatchLineStatus;
};

export type RoomProfile =
  | 'STANDARD'
  | 'AMPHI'
  | 'ATELIER'
  | 'STUDIO'
  | 'SECOURISME'
  | 'PCS'
  | 'PLATEAU_INCENDIE'
  | 'PARCOURS_RONDE';

export function inferRoomProfile(room: {
  shortCode?: string | null;
  capacity?: number | null;
  name?: string;
}): RoomProfile {
  const code = String(room.shortCode ?? '').toUpperCase();
  if (code === 'ORION' || code === 'PCS') return 'PCS';
  if (code === 'PHOENIX' || code === 'PLATEAU') return 'PLATEAU_INCENDIE';
  if (code === 'ATLAS' || code === 'RONDE') return 'PARCOURS_RONDE';
  if (code === 'MERCURE' || (room.capacity ?? 0) >= 28) return 'AMPHI';
  if (code === 'NEBULA') return 'ATELIER';
  if (code === 'VOLTA') return 'STUDIO';
  if (code === 'HELIOS') return 'SECOURISME';
  return 'STANDARD';
}

const PROFILE_LABELS: Record<RoomProfile, string> = {
  STANDARD: 'Salle polyvalente',
  AMPHI: 'Amphithéâtre',
  ATELIER: 'Atelier pratique / EPI',
  STUDIO: 'Studio visio / petite salle',
  SECOURISME: 'Salle secourisme / théorie',
  PCS: 'Poste central de sécurité pédagogique',
  PLATEAU_INCENDIE: 'Plateau technique incendie / SSIAP',
  PARCOURS_RONDE: 'Parcours de ronde pédagogique',
};

export function roomProfileLabel(profile: RoomProfile): string {
  return PROFILE_LABELS[profile];
}

import {
  buildExamDayMobileRequirements,
  buildParcoursRondeRoomFixedRequirements,
  buildPcsRoomFixedRequirements,
  buildPlateauIncendieRoomFixedRequirements,
} from '@/lib/exam-pedagogical-equipment-catalog';

/** Mobilier & install fixes recommandés selon capacité et profil (à lier dans la fiche salle). */
export function buildRoomFixedRequirements(
  profile: RoomProfile,
  capacity: number,
): DispatchRequirement[] {
  if (profile === 'PCS') return buildPcsRoomFixedRequirements();
  if (profile === 'PLATEAU_INCENDIE') return buildPlateauIncendieRoomFixedRequirements();
  if (profile === 'PARCOURS_RONDE') return buildParcoursRondeRoomFixedRequirements();

  const cap = Math.max(capacity || 1, 1);
  const chairs = cap;
  const tableKey =
    profile === 'AMPHI' ? 'mobilier.table-amphitheatre' : 'mobilier.table-pedagogique';
  const tableLabel =
    profile === 'AMPHI' ? 'Table amphithéâtre' : 'Table pédagogique 120×80';
  const tables =
    profile === 'AMPHI'
      ? Math.max(Math.ceil(cap / 2), 1)
      : profile === 'STUDIO'
        ? Math.max(Math.ceil(cap / 5), 1)
        : Math.max(Math.ceil(cap / 4), 1);

  const lines: DispatchRequirement[] = [
    {
      catalogKey: 'mobilier.chaise-empilable',
      catalogLabel: 'Chaise empilable',
      quantity: chairs,
      kind: 'FIXED',
      scope: 'ROOM',
      reason: '1 chaise par place (capacité salle)',
    },
    {
      catalogKey: tableKey,
      catalogLabel: tableLabel,
      quantity: tables,
      kind: 'FIXED',
      scope: 'ROOM',
      reason: profile === 'AMPHI' ? 'Tables amphithéâtre' : 'Tables pédagogiques',
    },
    {
      catalogKey: 'informatique.videoprojecteur',
      catalogLabel: 'Vidéoprojecteur',
      quantity: 1,
      kind: 'FIXED',
      scope: 'ROOM',
      reason: 'Projection supports de cours',
    },
    {
      catalogKey: 'informatique.ecran-projection',
      catalogLabel: 'Écran de projection motorisé',
      quantity: 1,
      kind: 'FIXED',
      scope: 'ROOM',
      reason: 'Écran fixe ou motorisé',
    },
  ];

  if (profile === 'AMPHI') {
    lines.push({
      catalogKey: 'informatique.sonorisation',
      catalogLabel: 'Sonorisation / micros HF',
      quantity: 1,
      kind: 'FIXED',
      scope: 'ROOM',
      reason: 'Amphithéâtre — sonorisation',
    });
  }

  if (profile === 'STUDIO' || profile === 'STANDARD' || profile === 'SECOURISME') {
    lines.push({
      catalogKey: 'informatique.pc-formateur',
      catalogLabel: 'PC formateur',
      quantity: 1,
      kind: 'FIXED',
      scope: 'ROOM',
      reason: 'Poste formateur',
    });
  }

  if (profile === 'STUDIO') {
    lines.push({
      catalogKey: 'informatique.ecran-interactif',
      catalogLabel: 'Écran interactif',
      quantity: 1,
      kind: 'FIXED',
      scope: 'ROOM',
      reason: 'Visio / présentation interactive',
    });
    lines.push({
      catalogKey: 'mobilier.table-modulaire',
      catalogLabel: 'Table modulaire',
      quantity: 1,
      kind: 'FIXED',
      scope: 'ROOM',
      reason: 'Configuration U / modulaire',
    });
  }

  if (profile === 'ATELIER') {
    lines.push({
      catalogKey: 'mobilier.etabli-pliant',
      catalogLabel: 'Établi pliant atelier',
      quantity: Math.max(Math.ceil(cap / 2), 2),
      kind: 'FIXED',
      scope: 'ROOM',
      reason: 'Postes pratique atelier',
    });
    lines.push({
      catalogKey: 'mobilier.armoire-epi',
      catalogLabel: 'Armoire EPI & consommables',
      quantity: 1,
      kind: 'FIXED',
      scope: 'ROOM',
      reason: 'Stockage EPI en salle',
    });
  }

  if (profile === 'SECOURISME') {
    lines.push({
      catalogKey: 'secourisme.dae-mural',
      catalogLabel: 'DAE mural',
      quantity: 1,
      kind: 'FIXED',
      scope: 'ROOM',
      reason: 'Défibrillateur de secours en salle',
    });
  }

  return lines;
}

/** Matériel mobile à réserver sur la session (dates début/fin) — hors mobilier fixe de la salle. */
export function buildSessionMobileRequirements(input: {
  track?: string | null;
  traineesMax?: number | null;
  sessionKind?: string | null;
  hasVenueRoom: boolean;
}): DispatchRequirement[] {
  const n = Math.max(input.traineesMax ?? 12, 1);
  const track = String(input.track ?? '').toLowerCase();
  const lines: DispatchRequirement[] = [];

  if (track.includes('incendie') || track === 'habilitation') {
    lines.push(
      {
        catalogKey: 'incendie.extincteur-co2',
        catalogLabel: 'Extincteur CO2 5kg',
        quantity: Math.min(4, Math.max(2, Math.ceil(n / 8))),
        kind: 'MOBILE',
        scope: 'SESSION',
        reason: 'Manipulation extincteurs — pratique incendie',
      },
      {
        catalogKey: 'incendie.extincteur-eau',
        catalogLabel: 'Extincteur eau pulvérisée 6L',
        quantity: Math.min(2, Math.max(1, Math.ceil(n / 12))),
        kind: 'MOBILE',
        scope: 'SESSION',
        reason: 'Démonstration eau pulvérisée',
      },
      {
        catalogKey: 'incendie.ria',
        catalogLabel: 'Module RIA pédagogique',
        quantity: 1,
        kind: 'MOBILE',
        scope: 'SESSION',
        reason: 'RIA — module incendie',
      },
    );
  }

  if (track.includes('sst') || track.includes('secour') || track === 'sst') {
    lines.push(
      {
        catalogKey: 'secourisme.mannequin-adulte',
        catalogLabel: 'Mannequin RCP adulte',
        quantity: Math.max(1, Math.ceil(n / 6)),
        kind: 'MOBILE',
        scope: 'SESSION',
        reason: '1 mannequin / 6 stagiaires',
      },
      {
        catalogKey: 'secourisme.mannequin-enfant',
        catalogLabel: 'Mannequin RCP enfant',
        quantity: 1,
        kind: 'MOBILE',
        scope: 'SESSION',
        reason: 'Pédiatrie — secourisme',
      },
      {
        catalogKey: 'secourisme.defibrillateur-formation',
        catalogLabel: 'Défibrillateur de formation AED',
        quantity: 1,
        kind: 'MOBILE',
        scope: 'SESSION',
        reason: 'Formation DAE',
      },
      {
        catalogKey: 'secourisme.mallette-ps',
        catalogLabel: 'Mallette premiers secours',
        quantity: Math.max(1, Math.ceil(n / 10)),
        kind: 'MOBILE',
        scope: 'SESSION',
        reason: 'Matériel PSC1 / SST',
      },
    );
  }

  if (track.includes('surete') || track.includes('securite')) {
    lines.push({
      catalogKey: 'securite-privee.drone-demo',
      catalogLabel: 'Drone surveillance démo',
      quantity: 1,
      kind: 'MOBILE',
      scope: 'SESSION',
      reason: 'Démo sécurité privée (si module drone)',
    });
    lines.push({
      catalogKey: 'epi.lot-pedagogique',
      catalogLabel: 'Lot EPI pédagogique',
      quantity: Math.max(1, Math.ceil(n / 8)),
      kind: 'MOBILE',
      scope: 'SESSION',
      reason: 'EPI par binôme / petit groupe',
    });
  }

  if (lines.length === 0) {
    lines.push({
      catalogKey: 'secourisme.mallette-ps',
      catalogLabel: 'Mallette premiers secours',
      quantity: 1,
      kind: 'MOBILE',
      scope: 'SESSION',
      reason: 'Kit secours standard session',
    });
  }

  if (input.hasVenueRoom) {
    return lines.map((l) => ({
      ...l,
      reason: `${l.reason} — mobilier salle couvert par la salle assignée`,
    }));
  }

  return lines;
}

/** Matériel mobile examen fin de session (QCM pratique, magnétomètre, fumigènes…). */
export function buildExamSessionRequirements(input: {
  track?: string | null;
  traineesMax?: number | null;
  sessionKind?: string | null;
  hasExamDate?: boolean;
}): DispatchRequirement[] {
  const withExam =
    input.sessionKind === 'WITH_EXAM' || input.hasExamDate === true;
  if (!withExam) return [];
  return buildExamDayMobileRequirements({
    track: input.track,
    traineesMax: input.traineesMax,
  });
}

/** Session + examen : fusion sans doublons catalogKey. */
export function buildSessionAndExamMobileRequirements(input: {
  track?: string | null;
  traineesMax?: number | null;
  sessionKind?: string | null;
  hasVenueRoom: boolean;
  hasExamDate?: boolean;
}): DispatchRequirement[] {
  const sessionLines = buildSessionMobileRequirements(input);
  const examLines = buildExamSessionRequirements(input);
  const merged = new Map<string, DispatchRequirement>();

  for (const line of [...sessionLines, ...examLines]) {
    const prev = merged.get(line.catalogKey);
    if (!prev || line.quantity > prev.quantity) {
      merged.set(line.catalogKey, line);
    } else if (prev && line.quantity === prev.quantity) {
      merged.set(line.catalogKey, {
        ...prev,
        reason: `${prev.reason} · ${line.reason}`,
      });
    }
  }

  return Array.from(merged.values());
}

/** Réunion / examen / événement ponctuel (VenueRoomBooking) — besoins légers. */
export function buildBookingMobileRequirements(kind: string): DispatchRequirement[] {
  if (kind === 'INFO_MEETING') {
    return [
      {
        catalogKey: 'informatique.videoprojecteur',
        catalogLabel: 'Vidéoprojecteur',
        quantity: 1,
        kind: 'MOBILE',
        scope: 'BOOKING',
        reason: 'Réunion info — si salle non équipée',
      },
    ];
  }
  if (kind === 'STAFF_MEETING') {
    return [
      {
        catalogKey: 'informatique.pc-formateur',
        catalogLabel: 'PC formateur',
        quantity: 1,
        kind: 'MOBILE',
        scope: 'BOOKING',
        reason: 'Réunion staff — prêt ponctuel',
      },
    ];
  }
  return [
    {
      catalogKey: 'informatique.videoprojecteur',
      catalogLabel: 'Vidéoprojecteur',
      quantity: 1,
      kind: 'MOBILE',
      scope: 'BOOKING',
      reason: 'Événement ponctuel',
    },
  ];
}

export function evaluateDispatchLines(
  requirements: DispatchRequirement[],
  assignedByCatalogKey: Map<string, number>,
  availableGlobalByCatalogKey: Map<string, number>,
): DispatchGuideLine[] {
  return requirements.map((req) => {
    const assigned = assignedByCatalogKey.get(req.catalogKey) ?? 0;
    const available = availableGlobalByCatalogKey.get(req.catalogKey) ?? 0;
    const stillNeeded = Math.max(req.quantity - assigned, 0);

    let status: DispatchLineStatus = 'complete';
    if (assigned >= req.quantity) {
      status = 'complete';
    } else if (assigned > 0) {
      status = stillNeeded > available ? 'insufficient_stock' : 'partial';
    } else if (available < req.quantity) {
      status = 'insufficient_stock';
    } else {
      status = 'missing';
    }

    return {
      ...req,
      quantityAssigned: assigned,
      quantityAvailableGlobal: available,
      status,
    };
  });
}

export function dispatchGuideSummary(lines: DispatchGuideLine[]) {
  const total = lines.length;
  const complete = lines.filter((l) => l.status === 'complete').length;
  const insufficient = lines.filter((l) => l.status === 'insufficient_stock').length;
  return { total, complete, insufficient, percent: total ? Math.round((complete / total) * 100) : 100 };
}
