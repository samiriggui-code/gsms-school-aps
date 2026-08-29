import type { DocTypeDefinition } from '@repo/doctype';
import { CRM_PERMISSION } from '@/lib/auth/crm-permissions';

/** G3 — dossier candidature / apprenant OF (Prisma `Candidature`, pas de table Learner). */
export const candidatureDocType: DocTypeDefinition = {
  name: 'Candidature',
  module: 'crm',
  label: 'Candidature',
  table: 'Candidature',
  schemaVersion: 1,
  aliases: ['candidature', 'learner'],
  fields: [
    {
      fieldname: 'userId',
      label: 'Utilisateur',
      fieldtype: 'Link',
      options: 'User',
      required: true,
      linkDisplayField: 'name',
    },
    {
      fieldname: 'formationId',
      label: 'Formation',
      fieldtype: 'Link',
      options: 'Formation',
      linkDisplayField: 'name',
    },
    {
      fieldname: 'interestedSessionId',
      label: 'Session visée',
      fieldtype: 'Link',
      options: 'FormationSession',
      linkDisplayField: 'dateDisplayLabel',
    },
    {
      fieldname: 'leadId',
      label: 'Lead',
      fieldtype: 'Link',
      options: 'Lead',
      linkDisplayField: 'email',
    },
    { fieldname: 'source', label: 'Source', fieldtype: 'Select', required: true },
    { fieldname: 'status', label: 'Statut', fieldtype: 'Select', required: true },
    { fieldname: 'cnapsReference', label: 'Réf. CNAPS', fieldtype: 'Data', searchable: true },
    { fieldname: 'notes', label: 'Notes', fieldtype: 'Text' },
  ],
  permissions: [
    {
      role: '*',
      permlevel: 0,
      read: true,
      requires: { anyPermissionSlugs: [CRM_PERMISSION.communicationView] },
    },
    {
      role: '*',
      permlevel: 0,
      create: true,
      write: true,
      delete: true,
      requires: { anyPermissionSlugs: [CRM_PERMISSION.communicationEdit] },
    },
  ],
  naming: { strategy: 'UUID_INTERNAL' },
  flags: { isChild: false, isSingle: false, isVirtual: false, isSubmittable: false },
  list: {
    searchFields: ['cnapsReference'],
    defaultSort: { fieldname: 'createdAt', direction: 'desc' },
    pageSize: 25,
  },
  persistence: {
    table: 'Candidature',
    delegate: 'candidature',
    nameField: 'id',
    creationField: 'createdAt',
    modifiedField: 'updatedAt',
  },
};

/** WF-02 / WF-03 — analyse du besoin + positionnement. */
export const candidatureAssessmentDocType: DocTypeDefinition = {
  name: 'CandidatureAssessment',
  module: 'crm',
  label: 'Assessment candidature',
  table: 'CandidatureAssessment',
  schemaVersion: 1,
  aliases: ['candidatureAssessment'],
  fields: [
    {
      fieldname: 'candidatureId',
      label: 'Candidature',
      fieldtype: 'Link',
      options: 'Candidature',
      required: true,
      linkDisplayField: 'id',
    },
    { fieldname: 'kind', label: 'Type', fieldtype: 'Select', required: true },
    { fieldname: 'status', label: 'Statut', fieldtype: 'Select', required: true },
    { fieldname: 'sentAt', label: 'Envoyé', fieldtype: 'Datetime' },
    { fieldname: 'completedAt', label: 'Complété', fieldtype: 'Datetime' },
    { fieldname: 'level', label: 'Niveau', fieldtype: 'Data' },
    { fieldname: 'prerequisitesStatus', label: 'Prérequis', fieldtype: 'Data' },
    { fieldname: 'adaptationRequired', label: 'Adaptation requise', fieldtype: 'Boolean' },
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
    searchFields: ['kind', 'status'],
    defaultSort: { fieldname: 'createdAt', direction: 'desc' },
    pageSize: 25,
  },
  persistence: {
    table: 'CandidatureAssessment',
    delegate: 'candidatureAssessment',
    nameField: 'id',
    creationField: 'createdAt',
    modifiedField: 'updatedAt',
  },
};
