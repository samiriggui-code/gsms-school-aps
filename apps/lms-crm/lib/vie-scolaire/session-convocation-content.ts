/** Contenu convocation session (hors examen) — safe client/serveur. */

export const SESSION_CONVOCATION_COMMON_ITEMS = [
  "Pièce d'identité officielle en cours de validité",
  "Présentation de la présente convocation (impression ou version numérique)",
  'Tenue vestimentaire adaptée au métier préparé',
  'Matériel de prise de notes',
] as const;

export function getSessionConvocationRequiredItems(formationName: string): string[] {
  const items: string[] = [...SESSION_CONVOCATION_COMMON_ITEMS];
  const lower = formationName.toLowerCase();

  if (lower.includes('ssiap')) {
    items.push('Tenue SSIAP et chaussures de sécurité si des exercices pratiques sont prévus');
  }
  if (lower.includes('tfp') || lower.includes('aps') || lower.includes('agent de prévention')) {
    items.push('Carte professionnelle CNAPS ou récépissé de demande en cours de validité, si déjà délivré');
  }
  if (lower.includes('sst') || lower.includes('secour')) {
    items.push('Tenue souple adaptée aux mises en situation de secourisme');
  }

  items.push(
    "Arriver 15 minutes avant l'heure indiquée pour l'accueil et l'émargement",
    "Téléphone portable en mode silencieux pendant les temps de formation",
  );

  return items;
}

export const SESSION_PDF_CATEGORY = {
  convocation: 'session-pdf-convocation',
} as const;

export const SESSION_PDF_CATEGORY_LABELS: Record<string, string> = {
  'session-pdf-convocation': 'Session — convocations individuelles',
};
