/**
 * Matériel pédagogique d'examen — sécurité privée (arrêté 23 oct. 2024 art. 12)
 * et incendie SSIAP (arrêté 2 mai 2005).
 *
 * Distinction :
 * - FIXED / ROOM : installé en salle (PCS, plateau SSI, parcours ronde)
 * - MOBILE / SESSION : réservé sur la session ou l'examen (magnétomètre, fumigènes…)
 */

import type { DispatchRequirement } from '@/lib/equipment-dispatch-guide';

export type ExamPedagogicalRole =
  | 'PCS_CORE'
  | 'SSI_INCENDIE'
  | 'VIDEO_SURVEILLANCE'
  | 'ALARME_INTRUSION'
  | 'RADIO_PTI'
  | 'REGISTRES'
  | 'QCM_TERMINAL'
  | 'RONDE_PARCOURS'
  | 'DETECTION'
  | 'PYROTECHNIE'
  | 'INCENDIE_PRATIQUE'
  | 'SECOURISME_EXAM';

export type ExamEquipmentCatalogEntry = {
  catalogKey: string;
  catalogLabel: string;
  pedagogicDomain: 'securite-privee' | 'incendie' | 'secourisme' | 'transversal';
  examRole: ExamPedagogicalRole;
  regulatoryRef?: string;
};

/** Référentiel catalogue — clés stables pour inventaire + dispatch. */
export const EXAM_EQUIPMENT_CATALOG: ExamEquipmentCatalogEntry[] = [
  {
    catalogKey: 'securite-privee.pcs-pedagogique',
    catalogLabel: 'Poste central de sécurité pédagogique (PCS)',
    pedagogicDomain: 'securite-privee',
    examRole: 'PCS_CORE',
    regulatoryRef: 'Arrêté 23/10/2024 art. 12 — poste central de sécurité',
  },
  {
    catalogKey: 'securite-privee.ssi-pedagogique',
    catalogLabel: 'SSI pédagogique (centrale incendie)',
    pedagogicDomain: 'incendie',
    examRole: 'SSI_INCENDIE',
    regulatoryRef: 'Arrêté 23/10/2024 — SSI au PCS ; SSIAP plateau technique',
  },
  {
    catalogKey: 'securite-privee.videosurveillance-3cam',
    catalogLabel: 'Vidéosurveillance pédagogique (≥ 3 caméras)',
    pedagogicDomain: 'securite-privee',
    examRole: 'VIDEO_SURVEILLANCE',
    regulatoryRef: 'Arrêté 23/10/2024 art. 12',
  },
  {
    catalogKey: 'securite-privee.centrale-alarme-intrusion',
    catalogLabel: 'Centrale alarme intrusion',
    pedagogicDomain: 'securite-privee',
    examRole: 'ALARME_INTRUSION',
  },
  {
    catalogKey: 'securite-privee.radio-er-pti',
    catalogLabel: 'Émetteur-récepteur radio (dont 1 PTI/DATI)',
    pedagogicDomain: 'securite-privee',
    examRole: 'RADIO_PTI',
    regulatoryRef: 'Arrêté 23/10/2024 — 3 ER dont 1 PTI/DATI',
  },
  {
    catalogKey: 'securite-privee.armoire-cles',
    catalogLabel: 'Armoire à clés pédagogique',
    pedagogicDomain: 'securite-privee',
    examRole: 'PCS_CORE',
  },
  {
    catalogKey: 'securite-privee.registres-consignes',
    catalogLabel: 'Registres consignes / clés / badges / visiteurs',
    pedagogicDomain: 'securite-privee',
    examRole: 'REGISTRES',
  },
  {
    catalogKey: 'securite-privee.poste-qcm-examen',
    catalogLabel: 'Poste QCM examen (logiciel QCU)',
    pedagogicDomain: 'securite-privee',
    examRole: 'QCM_TERMINAL',
  },
  {
    catalogKey: 'securite-privee.pc-main-courante',
    catalogLabel: 'PC main courante / rapport anomalies',
    pedagogicDomain: 'securite-privee',
    examRole: 'PCS_CORE',
  },
  {
    catalogKey: 'securite-privee.parcours-ronde-100m',
    catalogLabel: 'Parcours de ronde pédagogique (≥ 100 m, pointeaux)',
    pedagogicDomain: 'securite-privee',
    examRole: 'RONDE_PARCOURS',
    regulatoryRef: 'Arrêté 23/10/2024 — parcours min. 100 m',
  },
  {
    catalogKey: 'securite-privee.magnetometre',
    catalogLabel: 'Magnétomètre (détecteur de métaux)',
    pedagogicDomain: 'securite-privee',
    examRole: 'DETECTION',
  },
  {
    catalogKey: 'securite-privee.fumigene-pedagogique',
    catalogLabel: 'Engin pyrotechnique fumigène (pédagogique)',
    pedagogicDomain: 'securite-privee',
    examRole: 'PYROTECHNIE',
    regulatoryRef: 'Arrêté 23/10/2024 — 2 fumigènes',
  },
  {
    catalogKey: 'incendie.ssi-categorie-a',
    catalogLabel: 'SSI catégorie A opérationnel (plateau SSIAP)',
    pedagogicDomain: 'incendie',
    examRole: 'SSI_INCENDIE',
    regulatoryRef: 'Arrêté 2 mai 2005 — plateau technique SSIAP',
  },
  {
    catalogKey: 'incendie.parcours-anomalies-ssiap',
    catalogLabel: 'Parcours ronde SSIAP (anomalies configurables)',
    pedagogicDomain: 'incendie',
    examRole: 'RONDE_PARCOURS',
  },
  {
    catalogKey: 'incendie.simulateur-feu',
    catalogLabel: 'Aire feu / simulateur sinistre',
    pedagogicDomain: 'incendie',
    examRole: 'INCENDIE_PRATIQUE',
  },
  {
    catalogKey: 'secourisme.gants-palpation',
    catalogLabel: 'Gants palpation de sécurité',
    pedagogicDomain: 'secourisme',
    examRole: 'SECOURISME_EXAM',
  },
];

export function examCatalogByKey(key: string): ExamEquipmentCatalogEntry | undefined {
  return EXAM_EQUIPMENT_CATALOG.find((e) => e.catalogKey === key);
}

/** Installations fixes par type de salle examen. */
export function buildPcsRoomFixedRequirements(): DispatchRequirement[] {
  return [
    req('securite-privee.pcs-pedagogique', 1, 'FIXED', 'ROOM', 'Poste central — cœur examen TFP APS'),
    req('securite-privee.ssi-pedagogique', 1, 'FIXED', 'ROOM', 'SSI au PCS'),
    req('securite-privee.videosurveillance-3cam', 1, 'FIXED', 'ROOM', 'VSS ≥ 3 caméras'),
    req('securite-privee.centrale-alarme-intrusion', 1, 'FIXED', 'ROOM', 'Alarme intrusion'),
    req('securite-privee.radio-er-pti', 3, 'FIXED', 'ROOM', '3 radio dont 1 PTI/DATI'),
    req('securite-privee.armoire-cles', 1, 'FIXED', 'ROOM', 'Armoire à clés'),
    req('securite-privee.registres-consignes', 1, 'FIXED', 'ROOM', 'Registres obligatoires'),
    req('securite-privee.poste-qcm-examen', 1, 'FIXED', 'ROOM', 'Terminal QCU examen'),
    req('securite-privee.pc-main-courante', 1, 'FIXED', 'ROOM', 'Main courante électronique'),
    req('informatique.videoprojecteur', 1, 'FIXED', 'ROOM', 'Consignes jury / briefing'),
  ];
}

export function buildPlateauIncendieRoomFixedRequirements(): DispatchRequirement[] {
  return [
    req('incendie.ssi-categorie-a', 1, 'FIXED', 'ROOM', 'SSI cat. A — épreuve pratique SSIAP'),
    req('incendie.parcours-anomalies-ssiap', 1, 'FIXED', 'ROOM', 'Parcours anomalies SSIAP'),
    req('incendie.simulateur-feu', 1, 'FIXED', 'ROOM', 'Sinistre / feu simulé'),
    req('incendie.extincteur-co2', 2, 'FIXED', 'ROOM', 'Extincteurs permanents plateau'),
    req('incendie.extincteur-eau', 1, 'FIXED', 'ROOM', 'Extincteur eau plateau'),
    req('incendie.ria', 1, 'FIXED', 'ROOM', 'RIA pédagogique fixe'),
    req('secourisme.dae-mural', 1, 'FIXED', 'ROOM', 'DAE secours plateau'),
  ];
}

export function buildParcoursRondeRoomFixedRequirements(): DispatchRequirement[] {
  return [
    req('securite-privee.parcours-ronde-100m', 1, 'FIXED', 'ROOM', 'Parcours ≥ 100 m + pointeaux'),
    req('securite-privee.registres-consignes', 1, 'FIXED', 'ROOM', 'Registre ronde / consignes'),
  ];
}

/** Matériel mobile à réserver pour jour d'examen (session WITH_EXAM). */
export function buildExamDayMobileRequirements(input: {
  track?: string | null;
  traineesMax?: number | null;
}): DispatchRequirement[] {
  const n = Math.max(input.traineesMax ?? 12, 1);
  const track = String(input.track ?? '').toLowerCase();
  const lines: DispatchRequirement[] = [];

  if (track.includes('surete') || track.includes('securite') || track === 'habilitation') {
    lines.push(
      req('securite-privee.magnetometre', 1, 'MOBILE', 'SESSION', 'Contrôle d\'accès — épreuve pratique'),
      req('securite-privee.fumigene-pedagogique', 2, 'MOBILE', 'SESSION', '2 fumigènes — neutralisation'),
      req('secourisme.gants-palpation', Math.max(2, Math.ceil(n / 6)), 'MOBILE', 'SESSION', 'Palpation sécurité'),
      req('epi.lot-pedagogique', Math.max(1, Math.ceil(n / 8)), 'MOBILE', 'SESSION', 'EPI stagiaires examen'),
    );
  }

  if (track.includes('incendie') || track.includes('ssiap')) {
    lines.push(
      req('incendie.extincteur-co2', Math.min(4, Math.max(2, Math.ceil(n / 8))), 'MOBILE', 'SESSION', 'Manipulation extincteurs examen'),
      req('incendie.extincteur-eau', 1, 'MOBILE', 'SESSION', 'Démonstration eau — examen'),
    );
  }

  if (track.includes('sst') || track.includes('secour')) {
    lines.push(
      req('secourisme.defibrillateur-formation', 1, 'MOBILE', 'SESSION', 'UV SST — examen'),
      req('secourisme.mannequin-adulte', Math.max(1, Math.ceil(n / 6)), 'MOBILE', 'SESSION', 'Épreuve secourisme'),
    );
  }

  return lines;
}

function req(
  catalogKey: string,
  quantity: number,
  kind: 'FIXED' | 'MOBILE',
  scope: 'ROOM' | 'SESSION',
  reason: string,
): DispatchRequirement {
  const entry = examCatalogByKey(catalogKey);
  return {
    catalogKey,
    catalogLabel: entry?.catalogLabel ?? catalogKey,
    quantity,
    kind,
    scope,
    reason,
  };
}
