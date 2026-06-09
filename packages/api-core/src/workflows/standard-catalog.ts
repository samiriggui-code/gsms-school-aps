import type { CrmEventSeverity, InAppNotificationCategory } from '@repo/database';
import { CRM_MODULE_KEYS, type CrmModuleKey } from '../crm-events';

/** Événements du groupe webhook « standard » — landing + parcours CRM. */
export type StandardWebhookEventType =
  | 'landing.contact.submitted'
  | 'landing.quote.requested'
  | 'landing.preinscription.created'
  | 'crm.candidature.created'
  | 'crm.candidature.status_changed'
  | 'crm.candidature.session.enrolled'
  | 'crm.candidature.exam.recorded'
  | 'crm.candidature.attestation.issued'
  | 'crm.candidature.parcours.completed'
  | 'crm.candidature.parcours.archived'
  | 'crm.lead.converted'
  | 'crm.finance.devis.created'
  | 'crm.finance.devis.sent'
  | 'crm.finance.devis.accepted'
  | 'crm.finance.payment.recorded';

export type StandardWebhookApp = 'landing' | 'crm';

export type StandardWebhookMeta = {
  app: StandardWebhookApp;
  domain: string;
  action: string;
  label: string;
};

export type WorkflowEventDefinition = {
  crmEventType: string;
  moduleKey: CrmModuleKey;
  category: InAppNotificationCategory;
  severity: CrmEventSeverity;
  buildTitle: (payload: Record<string, unknown>) => string;
  buildBody: (payload: Record<string, unknown>) => string;
  buildHref?: (payload: Record<string, unknown>) => string | null;
};

export const STANDARD_WEBHOOK_EVENT_META: Record<StandardWebhookEventType, StandardWebhookMeta> = {
  'landing.contact.submitted': {
    app: 'landing',
    domain: 'acquisition',
    action: 'contact_form',
    label: 'Formulaire contact',
  },
  'landing.quote.requested': {
    app: 'landing',
    domain: 'acquisition',
    action: 'quote_request',
    label: 'Demande de devis',
  },
  'landing.preinscription.created': {
    app: 'landing',
    domain: 'acquisition',
    action: 'preinscription',
    label: 'Préinscription catalogue',
  },
  'crm.candidature.created': {
    app: 'crm',
    domain: 'vie-scolaire',
    action: 'candidature_create',
    label: 'Création dossier candidat',
  },
  'crm.candidature.status_changed': {
    app: 'crm',
    domain: 'vie-scolaire',
    action: 'candidature_status',
    label: 'Changement statut dossier',
  },
  'crm.candidature.session.enrolled': {
    app: 'crm',
    domain: 'vie-scolaire',
    action: 'session_enroll',
    label: 'Inscription session formation',
  },
  'crm.candidature.exam.recorded': {
    app: 'crm',
    domain: 'vie-scolaire',
    action: 'exam_outcome',
    label: 'Résultat examen',
  },
  'crm.candidature.attestation.issued': {
    app: 'crm',
    domain: 'vie-scolaire',
    action: 'attestation_issue',
    label: 'Attestation délivrée',
  },
  'crm.candidature.parcours.completed': {
    app: 'crm',
    domain: 'vie-scolaire',
    action: 'parcours_complete',
    label: 'Parcours candidat terminé',
  },
  'crm.candidature.parcours.archived': {
    app: 'crm',
    domain: 'vie-scolaire',
    action: 'parcours_archive',
    label: 'Dossier archivé',
  },
  'crm.lead.converted': {
    app: 'crm',
    domain: 'marketing',
    action: 'lead_to_candidature',
    label: 'Lead converti en candidature',
  },
  'crm.finance.devis.created': {
    app: 'crm',
    domain: 'finance',
    action: 'devis_create',
    label: 'Devis créé',
  },
  'crm.finance.devis.sent': {
    app: 'crm',
    domain: 'finance',
    action: 'devis_send',
    label: 'Devis envoyé au client',
  },
  'crm.finance.devis.accepted': {
    app: 'crm',
    domain: 'finance',
    action: 'devis_accept',
    label: 'Devis accepté (plaquette publique)',
  },
  'crm.finance.payment.recorded': {
    app: 'crm',
    domain: 'finance',
    action: 'payment_create',
    label: 'Paiement enregistré',
  },
};

function candidatureHref(p: Record<string, unknown>): string | null {
  const id = typeof p.candidatureId === 'string' ? p.candidatureId : null;
  return id ? `/gestion-academique/vie-scolaire/etudiants/${id}` : null;
}

function devisHref(p: Record<string, unknown>): string | null {
  const id = typeof p.devisId === 'string' ? p.devisId : null;
  return id ? `/administration-facturation/finance/devis/${id}` : null;
}

/** Sous-ensemble avec notification CRM (cloche + outbox worker). */
export const STANDARD_WEBHOOK_CRM: Record<StandardWebhookEventType, WorkflowEventDefinition> = {
  'landing.contact.submitted': {
    crmEventType: 'landing.contact.submitted',
    moduleKey: CRM_MODULE_KEYS.SUPPORT,
    category: 'TICKET',
    severity: 'WARNING',
    buildTitle: (p) => {
      const subject = typeof p.subject === 'string' ? p.subject : 'Sans objet';
      return `Contact landing : ${subject}`;
    },
    buildBody: (p) => {
      const name = typeof p.name === 'string' ? p.name : 'Visiteur';
      const email = typeof p.email === 'string' ? p.email : '';
      return `${name}${email ? ` (${email})` : ''}`;
    },
    buildHref: () => '/support-qualite/support/tickets',
  },
  'landing.quote.requested': {
    crmEventType: 'landing.quote.requested',
    moduleKey: CRM_MODULE_KEYS.VIE_SCOLAIRE,
    category: 'ACADEMIC',
    severity: 'INFO',
    buildTitle: (p) => {
      const formation =
        typeof p.formationLabel === 'string'
          ? p.formationLabel
          : typeof p.formationSlug === 'string'
            ? p.formationSlug
            : 'Formation';
      return `Devis landing : ${formation}`;
    },
    buildBody: (p) => {
      const first = typeof p.firstName === 'string' ? p.firstName : '';
      const last = typeof p.lastName === 'string' ? p.lastName : '';
      const email = typeof p.email === 'string' ? p.email : '';
      return [first, last].filter(Boolean).join(' ') + (email ? ` — ${email}` : '');
    },
    buildHref: () => '/gestion-academique/vie-scolaire/quote-leads',
  },
  'landing.preinscription.created': {
    crmEventType: 'landing.preinscription.created',
    moduleKey: CRM_MODULE_KEYS.VIE_SCOLAIRE,
    category: 'ACADEMIC',
    severity: 'INFO',
    buildTitle: (p) => {
      const formation =
        typeof p.formationLabel === 'string'
          ? p.formationLabel
          : typeof p.formationSlug === 'string'
            ? p.formationSlug
            : 'Formation';
      return `Préinscription : ${formation}`;
    },
    buildBody: (p) => {
      const first = typeof p.firstName === 'string' ? p.firstName : '';
      const last = typeof p.lastName === 'string' ? p.lastName : '';
      const email = typeof p.email === 'string' ? p.email : '';
      return [first, last].filter(Boolean).join(' ') + (email ? ` — ${email}` : '');
    },
    buildHref: candidatureHref,
  },
  'crm.candidature.created': {
    crmEventType: 'crm.candidature.created',
    moduleKey: CRM_MODULE_KEYS.VIE_SCOLAIRE,
    category: 'ACADEMIC',
    severity: 'INFO',
    buildTitle: () => 'Nouveau dossier candidat',
    buildBody: (p) => {
      const name = typeof p.candidateName === 'string' ? p.candidateName : 'Candidat';
      const source = typeof p.source === 'string' ? p.source : '';
      return source ? `${name} — source ${source}` : name;
    },
    buildHref: candidatureHref,
  },
  'crm.candidature.status_changed': {
    crmEventType: 'crm.candidature.status_changed',
    moduleKey: CRM_MODULE_KEYS.VIE_SCOLAIRE,
    category: 'ACADEMIC',
    severity: 'INFO',
    buildTitle: () => 'Dossier candidat mis à jour',
    buildBody: (p) => {
      const label =
        typeof p.statusLabel === 'string'
          ? p.statusLabel
          : typeof p.nextStatus === 'string'
            ? p.nextStatus
            : 'Statut modifié';
      const name =
        typeof p.candidateName === 'string' && p.candidateName.trim()
          ? p.candidateName.trim()
          : null;
      return name ? `${name} — ${label}` : label;
    },
    buildHref: candidatureHref,
  },
  'crm.candidature.session.enrolled': {
    crmEventType: 'crm.candidature.session.enrolled',
    moduleKey: CRM_MODULE_KEYS.VIE_SCOLAIRE,
    category: 'ACADEMIC',
    severity: 'INFO',
    buildTitle: (p) => {
      const session =
        typeof p.sessionLabel === 'string' ? p.sessionLabel : 'Session formation';
      return `Inscription session : ${session}`;
    },
    buildBody: (p) => {
      const name = typeof p.candidateName === 'string' ? p.candidateName : 'Participant';
      return name;
    },
    buildHref: candidatureHref,
  },
  'crm.candidature.exam.recorded': {
    crmEventType: 'crm.candidature.exam.recorded',
    moduleKey: CRM_MODULE_KEYS.VIE_SCOLAIRE,
    category: 'ACADEMIC',
    severity: 'INFO',
    buildTitle: (p) => {
      const outcome = typeof p.examOutcome === 'string' ? p.examOutcome : 'Résultat';
      return `Examen : ${outcome}`;
    },
    buildBody: (p) => {
      const name = typeof p.candidateName === 'string' ? p.candidateName : 'Participant';
      return name;
    },
    buildHref: candidatureHref,
  },
  'crm.candidature.attestation.issued': {
    crmEventType: 'crm.candidature.attestation.issued',
    moduleKey: CRM_MODULE_KEYS.VIE_SCOLAIRE,
    category: 'ACADEMIC',
    severity: 'INFO',
    buildTitle: (p) => {
      const title = typeof p.attestationTitle === 'string' ? p.attestationTitle : 'Attestation';
      return `Attestation : ${title}`;
    },
    buildBody: (p) => {
      const name = typeof p.candidateName === 'string' ? p.candidateName : 'Élève';
      return name;
    },
    buildHref: candidatureHref,
  },
  'crm.candidature.parcours.completed': {
    crmEventType: 'crm.candidature.parcours.completed',
    moduleKey: CRM_MODULE_KEYS.VIE_SCOLAIRE,
    category: 'ACADEMIC',
    severity: 'INFO',
    buildTitle: () => 'Parcours candidat terminé',
    buildBody: (p) => {
      const name = typeof p.candidateName === 'string' ? p.candidateName : 'Élève';
      return `${name} — dossier clôturé avec succès`;
    },
    buildHref: candidatureHref,
  },
  'crm.candidature.parcours.archived': {
    crmEventType: 'crm.candidature.parcours.archived',
    moduleKey: CRM_MODULE_KEYS.VIE_SCOLAIRE,
    category: 'ACADEMIC',
    severity: 'INFO',
    buildTitle: () => 'Dossier archivé',
    buildBody: (p) => {
      const name = typeof p.candidateName === 'string' ? p.candidateName : 'Dossier';
      return name;
    },
    buildHref: candidatureHref,
  },
  'crm.lead.converted': {
    crmEventType: 'crm.lead.converted',
    moduleKey: CRM_MODULE_KEYS.GESTION_ACADEMIQUE,
    category: 'ACADEMIC',
    severity: 'INFO',
    buildTitle: () => 'Lead converti en candidature',
    buildBody: (p) => {
      const email = typeof p.email === 'string' ? p.email : '';
      return email || 'Conversion lead → dossier';
    },
    buildHref: candidatureHref,
  },
  'crm.finance.devis.created': {
    crmEventType: 'crm.finance.devis.created',
    moduleKey: CRM_MODULE_KEYS.FINANCE,
    category: 'FINANCE',
    severity: 'INFO',
    buildTitle: (p) => {
      const ref = typeof p.referenceCode === 'string' ? p.referenceCode : 'Devis';
      return `Devis ${ref} créé`;
    },
    buildBody: (p) => (typeof p.title === 'string' ? p.title : 'Nouveau devis'),
    buildHref: devisHref,
  },
  'crm.finance.devis.sent': {
    crmEventType: 'crm.finance.devis.sent',
    moduleKey: CRM_MODULE_KEYS.FINANCE,
    category: 'FINANCE',
    severity: 'INFO',
    buildTitle: (p) => {
      const ref = typeof p.referenceCode === 'string' ? p.referenceCode : 'Devis';
      return `Devis ${ref} envoyé`;
    },
    buildBody: (p) => {
      const email = typeof p.leadEmail === 'string' ? p.leadEmail : '';
      return email ? `Envoyé à ${email}` : 'Envoi client effectué';
    },
    buildHref: devisHref,
  },
  'crm.finance.devis.accepted': {
    crmEventType: 'crm.finance.devis.accepted',
    moduleKey: CRM_MODULE_KEYS.FINANCE,
    category: 'FINANCE',
    severity: 'WARNING',
    buildTitle: (p) => {
      const ref = typeof p.referenceCode === 'string' ? p.referenceCode : 'Devis';
      return `Devis ${ref} accepté`;
    },
    buildBody: () => 'Acceptation via plaquette publique',
    buildHref: devisHref,
  },
  'crm.finance.payment.recorded': {
    crmEventType: 'crm.finance.payment.recorded',
    moduleKey: CRM_MODULE_KEYS.FINANCE,
    category: 'FINANCE',
    severity: 'INFO',
    buildTitle: (p) => {
      const ref = typeof p.referenceCode === 'string' ? p.referenceCode : 'Paiement';
      return `Paiement ${ref}`;
    },
    buildBody: (p) => {
      const amount = typeof p.amount === 'number' ? p.amount : null;
      const currency = typeof p.currency === 'string' ? p.currency : 'EUR';
      return amount != null ? `${amount} ${currency}` : 'Nouveau paiement enregistré';
    },
    buildHref: () => '/administration-facturation/finance/paiements',
  },
};

/** Alias historique — même catalogue que le webhook standard. */
export type WorkflowEventType = StandardWebhookEventType;
export const WORKFLOW_EVENT_CATALOG = STANDARD_WEBHOOK_CRM;
