import type { EmailTemplateId } from './email-template-ids';

export type EmailTemplateDomain =
  | 'landing'
  | 'finance'
  | 'compliance'
  | 'ressources'
  | 'system';

export type EmailTemplateCatalogEntry = {
  id: EmailTemplateId;
  labelFr: string;
  domain: EmailTemplateDomain;
  description: string;
  /** Types d'événements CRM déclencheurs (in-app + e-mail si activé). */
  crmEventTypes?: string[];
  /** Canal automatique actif par défaut. */
  channels: Array<'in_app' | 'email'>;
};

/** Catalogue documenté des templates React Email transactionnels. */
export const EMAIL_TEMPLATE_CATALOG: EmailTemplateCatalogEntry[] = [
  {
    id: 'contact-notification',
    labelFr: 'Contact — notification interne',
    domain: 'landing',
    description: 'Alerte équipe lors d’un message depuis la landing.',
    crmEventTypes: ['landing.contact.submitted'],
    channels: ['email'],
  },
  {
    id: 'contact-confirmation',
    labelFr: 'Contact — accusé visiteur',
    domain: 'landing',
    description: 'Confirmation envoyée au visiteur après formulaire contact.',
    channels: ['email'],
  },
  {
    id: 'quote-request-notification',
    labelFr: 'Devis — notification interne',
    domain: 'landing',
    description: 'Nouvelle demande de devis reçue.',
    channels: ['email'],
  },
  {
    id: 'quote-request-confirmation',
    labelFr: 'Devis — accusé prospect',
    domain: 'landing',
    description: 'Confirmation de prise en charge de la demande de devis.',
    channels: ['email'],
  },
  {
    id: 'preinscription-notification',
    labelFr: 'Préinscription — notification interne',
    domain: 'landing',
    description: 'Nouvelle préinscription catalogue.',
    crmEventTypes: ['landing.preinscription.created'],
    channels: ['email'],
  },
  {
    id: 'preinscription-confirmation',
    labelFr: 'Préinscription — accusé candidat',
    domain: 'landing',
    description: 'Confirmation de réception de préinscription.',
    channels: ['email'],
  },
  {
    id: 'devis-quote',
    labelFr: 'Devis commercial PDF',
    domain: 'finance',
    description: 'Envoi d’un devis au client.',
    channels: ['email'],
  },
  {
    id: 'compliance-document-request',
    labelFr: 'Conformité — demande de pièce',
    domain: 'compliance',
    description: 'Demande documentaire au candidat.',
    crmEventTypes: ['compliance.document.requested'],
    channels: ['in_app', 'email'],
  },
  {
    id: 'compliance-document-request-reminder',
    labelFr: 'Conformité — rappel pièce',
    domain: 'compliance',
    description: 'Relance pièce manquante.',
    channels: ['email'],
  },
  {
    id: 'compliance-document-received',
    labelFr: 'Conformité — pièce reçue',
    domain: 'compliance',
    description: 'Accusé de dépôt au candidat.',
    channels: ['email'],
  },
  {
    id: 'compliance-document-validated',
    labelFr: 'Conformité — pièce validée',
    domain: 'compliance',
    description: 'Validation documentaire.',
    channels: ['email'],
  },
  {
    id: 'compliance-document-rejected',
    labelFr: 'Conformité — pièce refusée',
    domain: 'compliance',
    description: 'Refus avec motif.',
    channels: ['email'],
  },
  {
    id: 'compliance-document-expiring',
    labelFr: 'Conformité — expiration proche',
    domain: 'compliance',
    description: 'Alerte expiration document.',
    crmEventTypes: ['compliance.document.expiring'],
    channels: ['in_app', 'email'],
  },
  {
    id: 'compliance-dossier-complete',
    labelFr: 'Conformité — dossier complet',
    domain: 'compliance',
    description: 'Dossier documentaire complet.',
    crmEventTypes: ['compliance.dossier.complete'],
    channels: ['in_app', 'email'],
  },
  {
    id: 'compliance-dossier-incomplete-admin',
    labelFr: 'Conformité — synthèse admin',
    domain: 'compliance',
    description: 'Synthèse dossiers incomplets pour l’équipe.',
    channels: ['email'],
  },
  {
    id: 'ops-resource-alert',
    labelFr: 'Ressources — alerte opérationnelle',
    domain: 'ressources',
    description:
      'Matériel (réservation, libération, maintenance) et salles (session, réunion staff, libération).',
    crmEventTypes: [
      'equipment.assigned',
      'equipment.released',
      'equipment.batch_released',
      'equipment.maintenance.started',
      'equipment.maintenance.completed',
      'equipment.maintenance.out_of_service',
      'venue.room.reserved',
      'venue.room.released',
      'venue.room.reservation_updated',
      'venue.room.booking_created',
      'venue.room.booking_cancelled',
      'venue.room.deactivated',
      'venue.room.reactivated',
      'venue.room.session_ended',
    ],
    channels: ['in_app', 'email'],
  },
  {
    id: 'pilotage-report-ready',
    labelFr: 'Pilotage — rapport disponible',
    domain: 'system',
    description: 'Notification e-mail lorsqu’un rapport PDF/CSV est généré (manuel ou planifié).',
    crmEventTypes: ['pilotage.report.generated'],
    channels: ['in_app', 'email'],
  },
];

export const CRM_EVENT_EMAIL_TEMPLATE: Partial<Record<string, EmailTemplateId>> = {
  'equipment.assigned': 'ops-resource-alert',
  'equipment.released': 'ops-resource-alert',
  'equipment.batch_released': 'ops-resource-alert',
  'equipment.maintenance.started': 'ops-resource-alert',
  'equipment.maintenance.completed': 'ops-resource-alert',
  'equipment.maintenance.out_of_service': 'ops-resource-alert',
  'venue.room.reserved': 'ops-resource-alert',
  'venue.room.released': 'ops-resource-alert',
  'venue.room.reservation_updated': 'ops-resource-alert',
  'venue.room.booking_created': 'ops-resource-alert',
  'venue.room.booking_cancelled': 'ops-resource-alert',
  'venue.room.deactivated': 'ops-resource-alert',
  'venue.room.reactivated': 'ops-resource-alert',
  'venue.room.session_ended': 'ops-resource-alert',
};

export function getEmailTemplateCatalogEntry(
  id: EmailTemplateId,
): EmailTemplateCatalogEntry | undefined {
  return EMAIL_TEMPLATE_CATALOG.find((row) => row.id === id);
}
