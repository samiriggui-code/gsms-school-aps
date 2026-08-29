/** Parcours commercial devis — libellés et étapes pour l’UI. */

export type DevisWorkflowStatus =
  | 'DRAFT'
  | 'SENT'
  | 'VIEWED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED';

export const DEVIS_WORKFLOW_STEPS = [
  { key: 'DRAFT', label: 'Brouillon', hint: 'Compléter client, lignes et montants' },
  { key: 'SENT', label: 'Envoyé', hint: 'En attente d’ouverture / réponse du client' },
  { key: 'VIEWED', label: 'Consulté', hint: 'Plaquette ouverte — relancer ou attendre l’acceptation' },
  { key: 'ACCEPTED', label: 'Accepté', hint: 'Visible dans Factures — émettre PDF et encaissement' },
] as const;

export function devisNextStepLabel(status: string): string {
  switch (status as DevisWorkflowStatus) {
    case 'DRAFT':
      return 'Finaliser puis envoyer (e-mail ou lien client)';
    case 'SENT':
      return 'Client : ouvrir la plaquette — vous : relancer si besoin';
    case 'VIEWED':
      return 'Client : accepter via plaquette — vous : relancer ou marquer accepté';
    case 'ACCEPTED':
      return 'Ouvrir dans Factures → PDF facture + paiement';
    case 'REJECTED':
      return 'Archivé — créer un nouveau devis si besoin';
    case 'EXPIRED':
      return 'Renouveler le devis (validité dépassée)';
    default:
      return '—';
  }
}

export function devisStatusBadgeVariant(
  status: string,
): 'success' | 'warning' | 'info' | 'destructive' | 'secondary' {
  switch (status) {
    case 'ACCEPTED':
      return 'success';
    case 'DRAFT':
      return 'warning';
    case 'SENT':
      return 'info';
    case 'VIEWED':
      return 'info';
    case 'REJECTED':
      return 'destructive';
    case 'EXPIRED':
      return 'secondary';
    default:
      return 'secondary';
  }
}

export function devisWorkflowStepIndex(status: string): number {
  switch (status) {
    case 'DRAFT':
      return 0;
    case 'SENT':
      return 1;
    case 'VIEWED':
      return 2;
    case 'ACCEPTED':
      return 3;
    case 'REJECTED':
    case 'EXPIRED':
      return 1;
    default:
      return 0;
  }
}
