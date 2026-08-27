/** Contenu certificat de réalisation — safe client/serveur. */

/**
 * Le certificat de réalisation (distinct de l'attestation de fin de formation) est une obligation
 * réglementaire (arrêté du 6 juin 2019, art. D.6353-1) : il atteste la réalisation effective d'une
 * action de formation, indépendamment de tout résultat d'évaluation ou d'examen.
 */
export const CERTIFICATE_LEGAL_MENTION =
  "Certificat de réalisation établi conformément à l'arrêté du 6 juin 2019 fixant le modèle-type " +
  "du certificat de réalisation mentionné à l'article D.6353-1 du Code du travail.";

export function buildCertificateStatement(input: {
  participantName: string;
  formationName: string;
  dateRangeLabel: string;
  hoursLabel: string | null;
}): string {
  const hoursPart = input.hoursLabel ? ` d'une durée de ${input.hoursLabel}` : '';
  return (
    `Nous attestons que ${input.participantName} a suivi l'action de formation « ${input.formationName} »` +
    `${hoursPart}, ${input.dateRangeLabel.toLowerCase()}.`
  );
}

export const SESSION_PDF_CERTIFICATE_CATEGORY = 'session-pdf-certificate';
