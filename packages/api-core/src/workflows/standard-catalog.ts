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
  | 'crm.finance.facture.sent'
  | 'crm.finance.payment.recorded'
  | 'crm.finance.funding.branch'
  | 'crm.session.emargement.missing'
  | 'crm.session.absence.unjustified'
  | 'crm.finance.invoice.overdue'
  | 'crm.session.milestone.due'
  | 'crm.satisfaction.cold.followup'
  | 'crm.satisfaction.hot.followup'
  | 'crm.session.convention.reminder'
  | 'crm.candidature.dossier.relance'
  | 'crm.qualiopi.checklist.due'
  | 'crm.automation.ops.weekly'
  | 'crm.automation.finance.monthly'
  | 'crm.support.ticket.created'
  | 'crm.equipment.alert'
  | 'crm.compliance.document.expiring'
  | 'crm.compliance.document.missing'
  | 'crm.compliance.document.requested'
  | 'crm.rh.compliance.due'
  | 'crm.support.backlog.due'
  | 'crm.room.alert'
  | 'crm.marketing.campaign.created'
  | 'crm.marketing.campaign.activated'
  | 'crm.cms.catalog.synced'
  | 'crm.cms.formation.visibility_changed'
  | 'crm.cms.landing.updated'
  | 'crm.cms.team.synced'
  | 'crm.security.user.created'
  | 'crm.security.user.updated'
  | 'crm.security.user.deactivated'
  | 'crm.security.role.created'
  | 'crm.security.role.permissions_changed';

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
  'crm.finance.facture.sent': {
    app: 'crm',
    domain: 'finance',
    action: 'facture_send',
    label: 'Facture envoyée au client',
  },
  'crm.finance.payment.recorded': {
    app: 'crm',
    domain: 'finance',
    action: 'payment_create',
    label: 'Paiement enregistré',
  },
  'crm.finance.funding.branch': {
    app: 'crm',
    domain: 'finance',
    action: 'funding_branch',
    label: 'Circuit financement session',
  },
  'crm.session.emargement.missing': {
    app: 'crm',
    domain: 'vie-scolaire',
    action: 'emargement_missing',
    label: 'Émargement manquant',
  },
  'crm.session.absence.unjustified': {
    app: 'crm',
    domain: 'vie-scolaire',
    action: 'absence_unjustified',
    label: 'Absence non justifiée',
  },
  'crm.finance.invoice.overdue': {
    app: 'crm',
    domain: 'finance',
    action: 'invoice_overdue',
    label: 'Facture impayée',
  },
  'crm.session.milestone.due': {
    app: 'crm',
    domain: 'vie-scolaire',
    action: 'session_milestone',
    label: 'Jalon circuit session',
  },
  'crm.satisfaction.cold.followup': {
    app: 'crm',
    domain: 'vie-scolaire',
    action: 'satisfaction_cold_followup',
    label: 'Satisfaction à froid — envois J+45',
  },
  'crm.satisfaction.hot.followup': {
    app: 'crm',
    domain: 'vie-scolaire',
    action: 'satisfaction_hot_followup',
    label: 'Satisfaction à chaud — sessions finies hier',
  },
  'crm.session.convention.reminder': {
    app: 'crm',
    domain: 'vie-scolaire',
    action: 'convention_reminder',
    label: 'Relance convention non signée',
  },
  'crm.candidature.dossier.relance': {
    app: 'crm',
    domain: 'vie-scolaire',
    action: 'dossier_relance',
    label: 'Relance dossier candidat',
  },
  'crm.qualiopi.checklist.due': {
    app: 'crm',
    domain: 'support',
    action: 'qualiopi_checklist',
    label: 'Checklist Qualiopi',
  },
  'crm.automation.ops.weekly': {
    app: 'crm',
    domain: 'pilotage',
    action: 'ops_weekly_digest',
    label: 'Digest hebdo ops',
  },
  'crm.automation.finance.monthly': {
    app: 'crm',
    domain: 'finance',
    action: 'finance_monthly_digest',
    label: 'Digest mensuel finance',
  },
  'crm.support.ticket.created': {
    app: 'crm',
    domain: 'support',
    action: 'ticket_create',
    label: 'Ticket support créé',
  },
  'crm.equipment.alert': {
    app: 'crm',
    domain: 'gestion-ressources',
    action: 'equipment_alert',
    label: 'Alerte équipement',
  },
  'crm.compliance.document.expiring': {
    app: 'crm',
    domain: 'gouvernance',
    action: 'document_expiring',
    label: 'Document expirant',
  },
  'crm.compliance.document.missing': {
    app: 'crm',
    domain: 'gouvernance',
    action: 'document_missing',
    label: 'Pièce manquante',
  },
  'crm.compliance.document.requested': {
    app: 'crm',
    domain: 'gouvernance',
    action: 'document_requested',
    label: 'Demande de pièce',
  },
  'crm.rh.compliance.due': {
    app: 'crm',
    domain: 'gestion-ressources',
    action: 'rh_compliance_due',
    label: 'Échéances conformité RH',
  },
  'crm.support.backlog.due': {
    app: 'crm',
    domain: 'support',
    action: 'support_backlog',
    label: 'Backlog support',
  },
  'crm.room.alert': {
    app: 'crm',
    domain: 'gestion-ressources',
    action: 'room_alert',
    label: 'Alerte salle',
  },
  'crm.marketing.campaign.created': {
    app: 'crm',
    domain: 'communication',
    action: 'campaign_create',
    label: 'Campagne créée',
  },
  'crm.marketing.campaign.activated': {
    app: 'crm',
    domain: 'communication',
    action: 'campaign_activate',
    label: 'Campagne activée',
  },
  'crm.cms.catalog.synced': {
    app: 'crm',
    domain: 'communication',
    action: 'cms_catalog_sync',
    label: 'Catalogue landing synchronisé',
  },
  'crm.cms.formation.visibility_changed': {
    app: 'crm',
    domain: 'communication',
    action: 'cms_formation_visibility',
    label: 'Visibilité formation catalogue',
  },
  'crm.cms.landing.updated': {
    app: 'crm',
    domain: 'communication',
    action: 'cms_landing_config',
    label: 'Configuration landing',
  },
  'crm.cms.team.synced': {
    app: 'crm',
    domain: 'communication',
    action: 'cms_team_sync',
    label: 'Équipe landing synchronisée',
  },
  'crm.security.user.created': {
    app: 'crm',
    domain: 'securite',
    action: 'iam_user_create',
    label: 'Utilisateur créé',
  },
  'crm.security.user.updated': {
    app: 'crm',
    domain: 'securite',
    action: 'iam_user_update',
    label: 'Utilisateur modifié',
  },
  'crm.security.user.deactivated': {
    app: 'crm',
    domain: 'securite',
    action: 'iam_user_deactivate',
    label: 'Utilisateur désactivé',
  },
  'crm.security.role.created': {
    app: 'crm',
    domain: 'securite',
    action: 'iam_role_create',
    label: 'Rôle créé',
  },
  'crm.security.role.permissions_changed': {
    app: 'crm',
    domain: 'securite',
    action: 'iam_role_permissions',
    label: 'Permissions rôle modifiées',
  },
};

/** Liste + sheet (pas de page /etudiants/[id]). */
function candidatureHref(p: Record<string, unknown>): string | null {
  const userId = typeof p.userId === 'string' ? p.userId : null;
  const candidatureId = typeof p.candidatureId === 'string' ? p.candidatureId : null;
  if (!userId && !candidatureId) return null;
  const sp = new URLSearchParams();
  if (userId) sp.set('userId', userId);
  if (candidatureId) sp.set('candidatureId', candidatureId);
  return `/gestion-academique/vie-scolaire/etudiants?${sp.toString()}`;
}

function devisHref(p: Record<string, unknown>): string | null {
  const id = typeof p.devisId === 'string' ? p.devisId : null;
  // Liste + sheet (?devisId=) — pas de page /devis/[id] hors plaquette.
  return id
    ? `/administration-facturation/finance/devis?devisId=${encodeURIComponent(id)}`
    : null;
}

function factureHref(p: Record<string, unknown>): string | null {
  const id = typeof p.factureId === 'string' ? p.factureId : null;
  return id
    ? `/administration-facturation/finance/factures?factureId=${encodeURIComponent(id)}`
    : null;
}

function leadQuoteHref(p: Record<string, unknown>): string | null {
  const leadId = typeof p.leadId === 'string' ? p.leadId : null;
  const base = '/communication-contenu/marketing/formulaires-leads';
  return leadId ? `${base}?leadId=${encodeURIComponent(leadId)}` : base;
}

function collaborateurHref(p: Record<string, unknown>): string | null {
  const userId =
    typeof p.userId === 'string'
      ? p.userId
      : typeof p.collaborateurId === 'string'
        ? p.collaborateurId
        : null;
  const base = '/gestion-ressources/rh/collaborateurs';
  return userId ? `${base}?userId=${encodeURIComponent(userId)}` : base;
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
    buildHref: leadQuoteHref,
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
  'crm.finance.facture.sent': {
    crmEventType: 'crm.finance.facture.sent',
    moduleKey: CRM_MODULE_KEYS.FINANCE,
    category: 'FINANCE',
    severity: 'INFO',
    buildTitle: (p) => {
      const ref = typeof p.referenceCode === 'string' ? p.referenceCode : 'Facture';
      return `Facture ${ref} envoyée`;
    },
    buildBody: (p) => {
      const email = typeof p.recipientEmail === 'string' ? p.recipientEmail : '';
      return email ? `Envoyée à ${email}` : 'Envoi client effectué';
    },
    buildHref: factureHref,
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
  'crm.finance.funding.branch': {
    crmEventType: 'crm.finance.funding.branch',
    moduleKey: CRM_MODULE_KEYS.FINANCE,
    category: 'FINANCE',
    severity: 'INFO',
    buildTitle: (p) => {
      const mode = typeof p.fundingMode === 'string' ? p.fundingMode : 'Financeur';
      return `Circuit financement : ${mode}`;
    },
    buildBody: (p) => {
      const name = typeof p.candidateName === 'string' ? p.candidateName : 'Participant';
      const session = typeof p.sessionLabel === 'string' ? p.sessionLabel : 'Session';
      return `${name} — ${session}`;
    },
    buildHref: candidatureHref,
  },
  'crm.session.emargement.missing': {
    crmEventType: 'crm.session.emargement.missing',
    moduleKey: CRM_MODULE_KEYS.VIE_SCOLAIRE,
    category: 'ACADEMIC',
    severity: 'WARNING',
    buildTitle: (p) => {
      const session = typeof p.sessionLabel === 'string' ? p.sessionLabel : 'Session';
      return `Émargements manquants : ${session}`;
    },
    buildBody: (p) => {
      const n = typeof p.unsignedCount === 'number' ? p.unsignedCount : 0;
      return `${n} émargement(s) non signé(s)`;
    },
    buildHref: (p) => {
      const id = typeof p.sessionId === 'string' ? p.sessionId : null;
      return id ? `/gestion-academique/vie-scolaire/sessions?sessionId=${id}` : '/gestion-academique/vie-scolaire/suivi-formations';
    },
  },
  'crm.session.absence.unjustified': {
    crmEventType: 'crm.session.absence.unjustified',
    moduleKey: CRM_MODULE_KEYS.VIE_SCOLAIRE,
    category: 'ACADEMIC',
    severity: 'WARNING',
    buildTitle: (p) => {
      const name = typeof p.candidateName === 'string' ? p.candidateName : 'Stagiaire';
      return `Absence non justifiée : ${name}`;
    },
    buildBody: (p) => {
      const session = typeof p.sessionLabel === 'string' ? p.sessionLabel : 'Session';
      const day = typeof p.dayDate === 'string' ? p.dayDate : '';
      return day ? `${session} — ${day}` : session;
    },
    buildHref: (p) => {
      const id = typeof p.sessionId === 'string' ? p.sessionId : null;
      return id ? `/gestion-academique/vie-scolaire/suivi-formations` : '/gestion-academique/vie-scolaire/suivi-formations';
    },
  },
  'crm.finance.invoice.overdue': {
    crmEventType: 'crm.finance.invoice.overdue',
    moduleKey: CRM_MODULE_KEYS.FINANCE,
    category: 'FINANCE',
    severity: 'WARNING',
    buildTitle: (p) => {
      const ref = typeof p.referenceCode === 'string' ? p.referenceCode : 'Devis';
      return `Impayé : ${ref}`;
    },
    buildBody: (p) => {
      const amount = typeof p.amountDue === 'number' ? p.amountDue : null;
      const currency = typeof p.currency === 'string' ? p.currency : 'EUR';
      return amount != null ? `Reste dû : ${amount} ${currency}` : 'Relance finance requise';
    },
    buildHref: devisHref,
  },
  'crm.session.milestone.due': {
    crmEventType: 'crm.session.milestone.due',
    moduleKey: CRM_MODULE_KEYS.VIE_SCOLAIRE,
    category: 'ACADEMIC',
    severity: 'INFO',
    buildTitle: (p) => {
      const label = typeof p.milestoneLabel === 'string' ? p.milestoneLabel : 'Jalon session';
      return `Circuit session : ${label}`;
    },
    buildBody: (p) => {
      const session = typeof p.sessionLabel === 'string' ? p.sessionLabel : 'Session';
      return session;
    },
    buildHref: candidatureHref,
  },
  'crm.satisfaction.cold.followup': {
    crmEventType: 'crm.satisfaction.cold.followup',
    moduleKey: CRM_MODULE_KEYS.VIE_SCOLAIRE,
    category: 'ACADEMIC',
    severity: 'INFO',
    buildTitle: () => 'Satisfaction à froid (J+45)',
    buildBody: (p) => {
      const sent = typeof p.invitesSent === 'number' ? p.invitesSent : 0;
      const candidates = typeof p.candidates === 'number' ? p.candidates : 0;
      return typeof p.summary === 'string'
        ? p.summary
        : `${sent} invitation(s) envoyée(s) sur ${candidates} candidate(s)`;
    },
    buildHref: () => '/gestion-academique/suivi-formations/satisfaction',
  },
  'crm.satisfaction.hot.followup': {
    crmEventType: 'crm.satisfaction.hot.followup',
    moduleKey: CRM_MODULE_KEYS.VIE_SCOLAIRE,
    category: 'ACADEMIC',
    severity: 'INFO',
    buildTitle: () => 'Satisfaction à chaud (fin session)',
    buildBody: (p) => {
      const sent = typeof p.invitesSent === 'number' ? p.invitesSent : 0;
      const sessions = typeof p.sessionsConsidered === 'number' ? p.sessionsConsidered : 0;
      return typeof p.summary === 'string'
        ? p.summary
        : `${sent} invitation(s) HOT — ${sessions} session(s) clôturée(s) hier`;
    },
    buildHref: () => '/gestion-academique/suivi-formations/satisfaction',
  },
  'crm.session.convention.reminder': {
    crmEventType: 'crm.session.convention.reminder',
    moduleKey: CRM_MODULE_KEYS.VIE_SCOLAIRE,
    category: 'ACADEMIC',
    severity: 'WARNING',
    buildTitle: () => 'Relances convention',
    buildBody: (p) => {
      const j2 = typeof p.remindedJ2 === 'number' ? p.remindedJ2 : 0;
      const j5 = typeof p.remindedJ5 === 'number' ? p.remindedJ5 : 0;
      return typeof p.summary === 'string'
        ? p.summary
        : `J+2 : ${j2} · J+5 : ${j5}`;
    },
    buildHref: () => '/gestion-academique/vie-scolaire/sessions',
  },
  'crm.candidature.dossier.relance': {
    crmEventType: 'crm.candidature.dossier.relance',
    moduleKey: CRM_MODULE_KEYS.VIE_SCOLAIRE,
    category: 'ACADEMIC',
    severity: 'WARNING',
    buildTitle: () => 'Relance dossier incomplet',
    buildBody: (p) => {
      const name = typeof p.candidateName === 'string' ? p.candidateName : 'Candidat';
      return `${name} — pièces manquantes`;
    },
    buildHref: candidatureHref,
  },
  'crm.qualiopi.checklist.due': {
    crmEventType: 'crm.qualiopi.checklist.due',
    moduleKey: CRM_MODULE_KEYS.SUPPORT,
    category: 'TICKET',
    severity: 'INFO',
    buildTitle: () => 'Checklist Qualiopi trimestrielle',
    buildBody: (p) =>
      typeof p.summary === 'string' ? p.summary : 'Revue des indicateurs Qualiopi à planifier',
    buildHref: () => '/support-qualite/qualite/indicateurs',
  },
  'crm.automation.ops.weekly': {
    crmEventType: 'crm.automation.ops.weekly',
    moduleKey: CRM_MODULE_KEYS.GESTION_ACADEMIQUE,
    category: 'ACADEMIC',
    severity: 'INFO',
    buildTitle: () => 'Rapport hebdomadaire ops',
    buildBody: (p) => (typeof p.summary === 'string' ? p.summary : 'Synthèse ops disponible'),
    buildHref: () => '/accueil',
  },
  'crm.automation.finance.monthly': {
    crmEventType: 'crm.automation.finance.monthly',
    moduleKey: CRM_MODULE_KEYS.FINANCE,
    category: 'FINANCE',
    severity: 'INFO',
    buildTitle: () => 'Rapport mensuel finance',
    buildBody: (p) => (typeof p.summary === 'string' ? p.summary : 'Synthèse finance disponible'),
    buildHref: () => '/administration-facturation/finance/rapports',
  },
  'crm.support.ticket.created': {
    crmEventType: 'crm.support.ticket.created',
    moduleKey: CRM_MODULE_KEYS.SUPPORT,
    category: 'TICKET',
    severity: 'WARNING',
    buildTitle: (p) => {
      const ref = typeof p.referenceCode === 'string' ? p.referenceCode : 'Ticket';
      return `Nouveau ticket : ${ref}`;
    },
    buildBody: (p) => {
      const subject = typeof p.subject === 'string' ? p.subject : 'Demande support';
      const name = typeof p.requesterName === 'string' ? p.requesterName : '';
      return name ? `${subject} — ${name}` : subject;
    },
    buildHref: () => '/support-qualite/support/tickets',
  },
  'crm.equipment.alert': {
    crmEventType: 'crm.equipment.alert',
    moduleKey: CRM_MODULE_KEYS.EQUIPEMENTS,
    category: 'ACADEMIC',
    severity: 'WARNING',
    buildTitle: (p) => (typeof p.title === 'string' ? p.title : 'Alerte équipement'),
    buildBody: (p) => (typeof p.body === 'string' ? p.body : 'Intervention ou matériel à traiter'),
    buildHref: (p) =>
      typeof p.href === 'string' ? p.href : '/gestion-ressources/equipements/inventaire',
  },
  'crm.compliance.document.expiring': {
    crmEventType: 'crm.compliance.document.expiring',
    moduleKey: CRM_MODULE_KEYS.GOUVERNANCE,
    category: 'ACADEMIC',
    severity: 'WARNING',
    buildTitle: () => 'Document expirant',
    buildBody: (p) =>
      typeof p.summary === 'string' ? p.summary : 'Échéance documentaire à anticiper',
    buildHref: () => '/securite-configuration/gouvernance-donnees/conformite',
  },
  'crm.compliance.document.missing': {
    crmEventType: 'crm.compliance.document.missing',
    moduleKey: CRM_MODULE_KEYS.GOUVERNANCE,
    category: 'ACADEMIC',
    severity: 'WARNING',
    buildTitle: () => 'Pièce manquante',
    buildBody: (p) =>
      typeof p.summary === 'string' ? p.summary : 'Dossier incomplet — relance requise',
    buildHref: () => '/securite-configuration/gouvernance-donnees/demandes-documents',
  },
  'crm.compliance.document.requested': {
    crmEventType: 'crm.compliance.document.requested',
    moduleKey: CRM_MODULE_KEYS.GOUVERNANCE,
    category: 'ACADEMIC',
    severity: 'INFO',
    buildTitle: () => 'Demande de pièce',
    buildBody: (p) =>
      typeof p.summary === 'string' ? p.summary : 'Nouvelle demande documentaire',
    buildHref: () => '/securite-configuration/gouvernance-donnees/demandes-documents',
  },
  'crm.rh.compliance.due': {
    crmEventType: 'crm.rh.compliance.due',
    moduleKey: CRM_MODULE_KEYS.RH,
    category: 'TEAM',
    severity: 'WARNING',
    buildTitle: () => 'Échéances conformité RH',
    buildBody: (p) =>
      typeof p.summary === 'string' ? p.summary : 'Cartes pro ou titres de séjour à renouveler',
    buildHref: collaborateurHref,
  },
  'crm.support.backlog.due': {
    crmEventType: 'crm.support.backlog.due',
    moduleKey: CRM_MODULE_KEYS.SUPPORT,
    category: 'TICKET',
    severity: 'WARNING',
    buildTitle: () => 'Backlog support',
    buildBody: (p) =>
      typeof p.summary === 'string' ? p.summary : 'Tickets ouverts ou urgents à traiter',
    buildHref: () => '/support-qualite/support/tickets',
  },
  'crm.room.alert': {
    crmEventType: 'crm.room.alert',
    moduleKey: CRM_MODULE_KEYS.EQUIPEMENTS,
    category: 'ACADEMIC',
    severity: 'INFO',
    buildTitle: (p) => (typeof p.title === 'string' ? p.title : 'Alerte salle'),
    buildBody: (p) => (typeof p.body === 'string' ? p.body : 'Réservation ou disponibilité salle'),
    buildHref: (p) =>
      typeof p.href === 'string' ? p.href : '/gestion-ressources/equipements/salles',
  },
  'crm.marketing.campaign.created': {
    crmEventType: 'crm.marketing.campaign.created',
    moduleKey: 'communication-contenu.marketing',
    category: 'ACADEMIC',
    severity: 'INFO',
    buildTitle: (p) => {
      const name = typeof p.name === 'string' ? p.name : 'Campagne';
      return `Campagne créée : ${name}`;
    },
    buildBody: (p) => {
      const channel = typeof p.channel === 'string' ? p.channel : 'landing';
      return `Canal ${channel} — brouillon ou planification`;
    },
    buildHref: () => '/communication-contenu/marketing/campagnes',
  },
  'crm.marketing.campaign.activated': {
    crmEventType: 'crm.marketing.campaign.activated',
    moduleKey: 'communication-contenu.marketing',
    category: 'ACADEMIC',
    severity: 'INFO',
    buildTitle: (p) => {
      const name = typeof p.name === 'string' ? p.name : 'Campagne';
      return `Campagne active : ${name}`;
    },
    buildBody: (p) => {
      const utm = typeof p.utmCampaign === 'string' ? p.utmCampaign : null;
      return utm ? `UTM ${utm} — suivi leads activé` : 'Campagne marketing en cours de diffusion';
    },
    buildHref: () => '/communication-contenu/marketing/campagnes',
  },
  'crm.cms.catalog.synced': {
    crmEventType: 'crm.cms.catalog.synced',
    moduleKey: 'communication-contenu.cms',
    category: 'ACADEMIC',
    severity: 'INFO',
    buildTitle: () => 'Catalogue landing synchronisé',
    buildBody: (p) => {
      const n = typeof p.publishedCount === 'number' ? p.publishedCount : 0;
      return `${n} formation(s) publiée(s) — cache public invalidé`;
    },
    buildHref: () => '/communication-contenu/cms/contenus',
  },
  'crm.cms.formation.visibility_changed': {
    crmEventType: 'crm.cms.formation.visibility_changed',
    moduleKey: 'communication-contenu.cms',
    category: 'ACADEMIC',
    severity: 'INFO',
    buildTitle: (p) => {
      const label = typeof p.formationName === 'string' ? p.formationName : 'Formation';
      const active = p.active === true;
      return active ? `Publiée : ${label}` : `Retirée : ${label}`;
    },
    buildBody: (p) => {
      const slug = typeof p.formationSlug === 'string' ? p.formationSlug : '';
      return slug ? `Fiche catalogue ${slug}` : 'Visibilité catalogue modifiée';
    },
    buildHref: () => '/communication-contenu/cms/contenus',
  },
  'crm.cms.landing.updated': {
    crmEventType: 'crm.cms.landing.updated',
    moduleKey: 'communication-contenu.cms',
    category: 'ACADEMIC',
    severity: 'INFO',
    buildTitle: () => 'Configuration landing mise à jour',
    buildBody: (p) => {
      const enabled = p.enabled === true ? 'activée' : 'désactivée';
      return `Landing ${enabled}`;
    },
    buildHref: () => '/communication-contenu/cms/pages-landing',
  },
  'crm.cms.team.synced': {
    crmEventType: 'crm.cms.team.synced',
    moduleKey: 'communication-contenu.cms',
    category: 'ACADEMIC',
    severity: 'INFO',
    buildTitle: () => 'Équipe landing synchronisée',
    buildBody: (p) => {
      const n = typeof p.memberCount === 'number' ? p.memberCount : 0;
      return `${n} membre(s) depuis les équipes RH`;
    },
    buildHref: () => '/communication-contenu/cms/equipe-landing',
  },
  'crm.security.user.created': {
    crmEventType: 'crm.security.user.created',
    moduleKey: 'securite-configuration.acces',
    category: 'TEAM',
    severity: 'INFO',
    buildTitle: (p) => {
      const name = typeof p.name === 'string' ? p.name : 'Utilisateur';
      return `Compte créé : ${name}`;
    },
    buildBody: (p) => {
      const email = typeof p.email === 'string' ? p.email : '';
      const role = typeof p.roleName === 'string' ? p.roleName : '';
      return [email, role].filter(Boolean).join(' — ');
    },
    buildHref: () => '/securite-configuration/acces/users',
  },
  'crm.security.user.updated': {
    crmEventType: 'crm.security.user.updated',
    moduleKey: 'securite-configuration.acces',
    category: 'TEAM',
    severity: 'WARNING',
    buildTitle: (p) => {
      const name = typeof p.name === 'string' ? p.name : 'Utilisateur';
      return `Compte modifié : ${name}`;
    },
    buildBody: (p) => {
      const changes = typeof p.changesSummary === 'string' ? p.changesSummary : 'Profil IAM';
      return changes;
    },
    buildHref: (p) =>
      typeof p.userId === 'string'
        ? `/securite-configuration/acces/users/${p.userId}`
        : '/securite-configuration/acces/users',
  },
  'crm.security.user.deactivated': {
    crmEventType: 'crm.security.user.deactivated',
    moduleKey: 'securite-configuration.acces',
    category: 'TEAM',
    severity: 'WARNING',
    buildTitle: (p) => {
      const name = typeof p.name === 'string' ? p.name : 'Utilisateur';
      return `Compte désactivé : ${name}`;
    },
    buildBody: (p) => (typeof p.email === 'string' ? p.email : 'Compte mis en corbeille'),
    buildHref: () => '/securite-configuration/acces/users',
  },
  'crm.security.role.created': {
    crmEventType: 'crm.security.role.created',
    moduleKey: 'securite-configuration.acces',
    category: 'TEAM',
    severity: 'INFO',
    buildTitle: (p) => {
      const name = typeof p.roleName === 'string' ? p.roleName : 'Rôle';
      return `Rôle créé : ${name}`;
    },
    buildBody: (p) => {
      const slug = typeof p.roleSlug === 'string' ? p.roleSlug : '';
      return slug ? `Slug ${slug}` : 'Nouveau profil IAM';
    },
    buildHref: () => '/securite-configuration/acces/roles',
  },
  'crm.security.role.permissions_changed': {
    crmEventType: 'crm.security.role.permissions_changed',
    moduleKey: 'securite-configuration.acces',
    category: 'TEAM',
    severity: 'WARNING',
    buildTitle: (p) => {
      const name = typeof p.roleName === 'string' ? p.roleName : 'Rôle';
      return `Permissions : ${name}`;
    },
    buildBody: (p) => {
      const action = p.assigned === true ? 'ajoutée' : p.assigned === false ? 'retirée' : 'matrice mise à jour';
      const perm = typeof p.permissionSlug === 'string' ? p.permissionSlug : '';
      return perm ? `${perm} ${action}` : `Matrice IAM ${action}`;
    },
    buildHref: () => '/securite-configuration/acces/roles',
  },
};

/** Alias historique — même catalogue que le webhook standard. */
export type WorkflowEventType = StandardWebhookEventType;
export const WORKFLOW_EVENT_CATALOG = STANDARD_WEBHOOK_CRM;
