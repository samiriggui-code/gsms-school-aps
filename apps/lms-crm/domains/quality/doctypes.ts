import type { DocTypeDefinition } from '@repo/doctype';
import { CRM_PERMISSION, GOVERNANCE_PERMISSION } from '@/lib/auth/crm-permissions';

/** G7 Quality — dossier conformité (enveloppe ; items = Qualiopi DocType). */
export const complianceDossierDocType: DocTypeDefinition = {
  name: 'ComplianceDossier',
  module: 'quality',
  label: 'Dossier conformité',
  table: 'ComplianceDossier',
  schemaVersion: 1,
  aliases: ['complianceDossier'],
  fields: [
    { fieldname: 'kind', label: 'Kind', fieldtype: 'Select', required: true },
    { fieldname: 'subjectType', label: 'Type sujet', fieldtype: 'Select', required: true },
    { fieldname: 'subjectId', label: 'ID sujet', fieldtype: 'Data', required: true, searchable: true },
    {
      fieldname: 'userId',
      label: 'Utilisateur',
      fieldtype: 'Link',
      options: 'User',
      linkDisplayField: 'name',
    },
    {
      fieldname: 'candidatureId',
      label: 'Candidature',
      fieldtype: 'Link',
      options: 'Candidature',
      linkDisplayField: 'id',
    },
    { fieldname: 'status', label: 'Statut', fieldtype: 'Select', required: true },
    { fieldname: 'completenessPct', label: 'Complétude %', fieldtype: 'Integer' },
    { fieldname: 'dueAt', label: 'Échéance', fieldtype: 'Datetime' },
  ],
  permissions: [
    {
      role: '*',
      permlevel: 0,
      read: true,
      requires: { anyPermissionSlugs: [GOVERNANCE_PERMISSION.conformiteView] },
    },
    {
      role: '*',
      permlevel: 0,
      create: true,
      write: true,
      delete: true,
      requires: { anyPermissionSlugs: [CRM_PERMISSION.ressourcesEdit] },
    },
  ],
  naming: { strategy: 'UUID_INTERNAL' },
  flags: { isChild: false, isSingle: false, isVirtual: false, isSubmittable: false },
  list: {
    searchFields: ['subjectId'],
    defaultSort: { fieldname: 'updatedAt', direction: 'desc' },
    pageSize: 25,
  },
  persistence: {
    table: 'ComplianceDossier',
    delegate: 'complianceDossier',
    nameField: 'id',
    creationField: 'createdAt',
    modifiedField: 'updatedAt',
  },
};

/** G7 — enquête satisfaction session. */
export const satisfactionSurveyDocType: DocTypeDefinition = {
  name: 'SatisfactionSurvey',
  module: 'quality',
  label: 'Enquête satisfaction',
  table: 'SatisfactionSurvey',
  schemaVersion: 1,
  aliases: ['satisfactionSurvey'],
  fields: [
    {
      fieldname: 'sessionId',
      label: 'Session',
      fieldtype: 'Link',
      options: 'FormationSession',
      required: true,
      linkDisplayField: 'dateDisplayLabel',
    },
    {
      fieldname: 'participantId',
      label: 'Participant',
      fieldtype: 'Link',
      options: 'FormationSessionParticipant',
      required: true,
      linkDisplayField: 'id',
    },
    { fieldname: 'timing', label: 'Moment', fieldtype: 'Select', required: true },
    { fieldname: 'status', label: 'Statut', fieldtype: 'Select', required: true },
    { fieldname: 'sentAt', label: 'Envoyée', fieldtype: 'Datetime' },
    { fieldname: 'respondedAt', label: 'Répondue', fieldtype: 'Datetime' },
  ],
  permissions: [
    {
      role: '*',
      permlevel: 0,
      read: true,
      requires: { anyPermissionSlugs: [CRM_PERMISSION.academiqueView] },
    },
    {
      role: '*',
      permlevel: 0,
      create: true,
      write: true,
      delete: true,
      requires: { anyPermissionSlugs: [CRM_PERMISSION.academiqueEdit] },
    },
  ],
  naming: { strategy: 'UUID_INTERNAL' },
  flags: { isChild: false, isSingle: false, isVirtual: false, isSubmittable: false },
  list: {
    searchFields: ['status'],
    defaultSort: { fieldname: 'createdAt', direction: 'desc' },
    pageSize: 25,
  },
  persistence: {
    table: 'SatisfactionSurvey',
    delegate: 'satisfactionSurvey',
    nameField: 'id',
    creationField: 'createdAt',
    modifiedField: 'updatedAt',
  },
};

/** G7 — incident qualité. */
export const qualityIncidentDocType: DocTypeDefinition = {
  name: 'QualityIncident',
  module: 'quality',
  label: 'Incident qualité',
  table: 'QualityIncident',
  schemaVersion: 1,
  aliases: ['qualityIncident'],
  fields: [
    { fieldname: 'referenceCode', label: 'Référence', fieldtype: 'Data', required: true, unique: true, searchable: true },
    { fieldname: 'title', label: 'Titre', fieldtype: 'Data', required: true, searchable: true },
    { fieldname: 'description', label: 'Description', fieldtype: 'Text', required: true },
    { fieldname: 'severity', label: 'Sévérité', fieldtype: 'Select', required: true },
    { fieldname: 'status', label: 'Statut', fieldtype: 'Select', required: true },
    { fieldname: 'category', label: 'Catégorie', fieldtype: 'Data' },
    {
      fieldname: 'assignedToId',
      label: 'Assigné à',
      fieldtype: 'Link',
      options: 'User',
      linkDisplayField: 'name',
    },
    {
      fieldname: 'reportedById',
      label: 'Signalé par',
      fieldtype: 'Link',
      options: 'User',
      linkDisplayField: 'name',
    },
    { fieldname: 'rootCause', label: 'Cause', fieldtype: 'Text' },
    { fieldname: 'correctiveAction', label: 'Action corrective', fieldtype: 'Text' },
  ],
  permissions: [
    {
      role: '*',
      permlevel: 0,
      read: true,
      requires: { anyPermissionSlugs: [CRM_PERMISSION.supportView, GOVERNANCE_PERMISSION.conformiteView] },
    },
    {
      role: '*',
      permlevel: 0,
      create: true,
      write: true,
      delete: true,
      requires: { anyPermissionSlugs: [CRM_PERMISSION.supportEdit] },
    },
  ],
  naming: { strategy: 'UUID_INTERNAL' },
  flags: { isChild: false, isSingle: false, isVirtual: false, isSubmittable: false },
  list: {
    searchFields: ['referenceCode', 'title', 'category'],
    defaultSort: { fieldname: 'createdAt', direction: 'desc' },
    pageSize: 25,
  },
  persistence: {
    table: 'QualityIncident',
    delegate: 'qualityIncident',
    nameField: 'id',
    creationField: 'createdAt',
    modifiedField: 'updatedAt',
  },
};
