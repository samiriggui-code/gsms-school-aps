/** Contenu convention de formation professionnelle — safe client/serveur. */

export const FUNDING_MODE_LABELS: Record<string, string> = {
  CPF: 'Compte Personnel de Formation (CPF)',
  FRANCE_TRAVAIL: 'France Travail',
  OPCO: "Opérateur de Compétences (OPCO)",
  ENTREPRISE: "Prise en charge employeur",
  PARTICULIER: 'Financement personnel',
};

export function fundingModeLabel(fundingMode: string | null): string {
  if (!fundingMode) return 'Financement personnel';
  return FUNDING_MODE_LABELS[fundingMode.toUpperCase()] ?? fundingMode;
}

export const CONVENTION_STANDARD_CLAUSES = [
  "Le stagiaire s'engage à suivre l'intégralité du programme de formation et à émarger à chaque " +
    'demi-journée de présence, conformément aux exigences de traçabilité Qualiopi.',
  "En cas d'absence, l'organisme doit être informé dans les meilleurs délais ; les absences non " +
    'justifiées peuvent faire obstacle à la délivrance du certificat de réalisation ou à la présentation ' +
    "à l'examen final le cas échéant.",
  "Le prix de la formation, les modalités de règlement et le calendrier de facturation sont précisés " +
    "dans le devis ou la facture associée à la présente convention, qui en fait partie intégrante.",
  "Toute annulation ou report est régi par les conditions générales de vente de l'organisme, " +
    'disponibles sur demande ou consultables sur son site internet.',
  "Conformément à la réglementation, l'organisme délivre à l'issue de la formation un certificat de " +
    'réalisation mentionnant les objectifs, la nature, la durée et les résultats de l\'action suivie.',
] as const;

export const SESSION_PDF_CONVENTION_CATEGORY = 'session-pdf-convention';
