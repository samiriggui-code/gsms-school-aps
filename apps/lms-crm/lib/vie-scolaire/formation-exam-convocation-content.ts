/** Contenu convocation examen — safe client/serveur. */

export const EXAM_CONVOCATION_COMMON_ITEMS = [
  'Pièce d\'identité officielle en cours de validité (originale)',
  'Présentation de la présente convocation (impression ou version numérique)',
  'Tenue professionnelle conforme au métier de la sécurité privée ou de l\'incendie',
  'Stylo bille bleu ou noir (épreuve écrite / QCM)',
  'Carte vitale ou attestation de droits (si demandé par l\'organisme)',
] as const;

export function getExamConvocationRequiredItems(formationName: string): string[] {
  const items: string[] = [...EXAM_CONVOCATION_COMMON_ITEMS];
  const lower = formationName.toLowerCase();

  if (lower.includes('ssiap')) {
    items.push(
      'Tenue SSIAP et chaussures de sécurité pour l\'épreuve pratique plateau technique',
      'Carnet de stage ou livret de formation si délivré en amont',
    );
  }
  if (lower.includes('tfp') || lower.includes('aps') || lower.includes('agent de prévention')) {
    items.push(
      'Tenue sombre professionnelle pour l\'épreuve au poste central de sécurité (PCS)',
      'Carte professionnelle CNAPS ou récépissé de demande en cours de validité',
    );
  }
  if (lower.includes('sst') || lower.includes('secour')) {
    items.push('Tenue souple adaptée aux gestes de secourisme');
  }

  items.push(
    'Arriver 15 minutes avant l\'heure convoquée pour l\'accueil et la vérification d\'identité',
    'Téléphone portable en mode silencieux pendant toute la durée de l\'examen',
  );

  return items;
}

export const EXAM_PDF_CATEGORY_BY_TYPE = {
  candidats: 'exam-pdf-candidats',
  emargement: 'exam-pdf-emargement',
  convocation: 'exam-pdf-convocation',
  jury: 'exam-pdf-jury',
} as const;

export const EXAM_PDF_CATEGORY_LABELS: Record<string, string> = {
  'exam-pdf-candidats': 'Examen — liste nominative candidats',
  'exam-pdf-emargement': 'Examen — feuille d\'émargement',
  'exam-pdf-convocation': 'Examen — convocations individuelles',
  'exam-pdf-jury': 'Examen — fiche jury & délibération',
};
