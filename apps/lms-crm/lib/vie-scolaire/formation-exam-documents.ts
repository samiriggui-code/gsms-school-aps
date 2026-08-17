/** Constantes partagées client/serveur — sans import Node ni @repo/api-core. */

export const FORMATION_EXAM_OFFICIAL_DOCUMENTS = [
  {
    type: 'candidats',
    label: 'Liste nominative des candidats',
    description: 'Effectif examen, coordonnées — remise au jury et archivage.',
  },
  {
    type: 'emargement',
    label: 'Feuille d’émargement examen',
    description: 'Signatures présentiel jour J — à déposer signée après l’examen.',
  },
  {
    type: 'convocation',
    label: 'Convocations individuelles',
    description: 'Un PDF multi-pages (1 convocation / stagiaire) avec en-tête Formassi, pièces à apporter et archivage session.',
  },
  {
    type: 'jury',
    label: 'Fiche jury & délibération',
    description: 'Composition jury, grille QCM / pratique, décisions.',
  },
] as const;

export type FormationExamOfficialDocType = (typeof FORMATION_EXAM_OFFICIAL_DOCUMENTS)[number]['type'];
