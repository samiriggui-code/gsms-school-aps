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
