import type { DocTypeDefinition } from '@repo/doctype';
import { CRM_PERMISSION } from '@/lib/auth/crm-permissions';

/** G3 CRM OF — Lead existant (Prisma) enregistré sur @repo/doctype. */
export const leadDocType: DocTypeDefinition = {
  name: 'Lead',
  module: 'crm',
  label: 'Lead',
  table: 'Lead',
  schemaVersion: 1,
  aliases: ['lead'],
  fields: [
    { fieldname: 'firstName', label: 'Prénom', fieldtype: 'Data', required: true, searchable: true },
    { fieldname: 'lastName', label: 'Nom', fieldtype: 'Data', required: true, searchable: true },
    { fieldname: 'email', label: 'E-mail', fieldtype: 'Email', required: true, searchable: true },
    { fieldname: 'phone', label: 'Téléphone', fieldtype: 'Data', searchable: true },
    { fieldname: 'source', label: 'Source', fieldtype: 'Data' },
    { fieldname: 'status', label: 'Statut', fieldtype: 'Select', required: true },
    { fieldname: 'notes', label: 'Notes', fieldtype: 'Text' },
    {
      fieldname: 'courseId',
      label: 'Cours LMS',
      fieldtype: 'Link',
      options: 'LmsCourse',
      linkDisplayField: 'title',
    },
    { fieldname: 'formationId', label: 'Formation catalogue', fieldtype: 'Data' },
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
    searchFields: ['firstName', 'lastName', 'email', 'phone'],
    defaultSort: { fieldname: 'createdAt', direction: 'desc' },
    pageSize: 25,
  },
  persistence: {
    table: 'Lead',
    delegate: 'lead',
    nameField: 'id',
    creationField: 'createdAt',
    modifiedField: 'updatedAt',
  },
};

/** G3 — devis commercial déjà en Prisma (chaîne Lead → devis). */
export const financeDevisDocType: DocTypeDefinition = {
  name: 'FinanceDevis',
  module: 'crm',
  label: 'Devis',
  table: 'FinanceDevis',
  schemaVersion: 1,
  aliases: ['financeDevis', 'quote'],
  fields: [
    { fieldname: 'referenceCode', label: 'Référence', fieldtype: 'Data', required: true, unique: true, searchable: true },
    { fieldname: 'title', label: 'Titre', fieldtype: 'Data', required: true, searchable: true },
    { fieldname: 'status', label: 'Statut', fieldtype: 'Select', required: true },
    {
      fieldname: 'leadId',
      label: 'Lead',
      fieldtype: 'Link',
      options: 'Lead',
      linkDisplayField: 'email',
    },
    { fieldname: 'formationId', label: 'Formation', fieldtype: 'Data' },
    { fieldname: 'candidatureId', label: 'Candidature', fieldtype: 'Data' },
    { fieldname: 'formationSessionId', label: 'Session', fieldtype: 'Data' },
    { fieldname: 'subtotalHt', label: 'HT', fieldtype: 'Currency' },
    { fieldname: 'vatTotal', label: 'TVA', fieldtype: 'Currency' },
    { fieldname: 'totalTtc', label: 'TTC', fieldtype: 'Currency' },
    { fieldname: 'currency', label: 'Devise', fieldtype: 'Data' },
    { fieldname: 'notes', label: 'Notes', fieldtype: 'Text' },
  ],
  permissions: [
    {
      role: '*',
      permlevel: 0,
      read: true,
      requires: { anyPermissionSlugs: [CRM_PERMISSION.financeView] },
    },
    {
      role: '*',
      permlevel: 0,
      create: true,
      write: true,
      delete: true,
      requires: { anyPermissionSlugs: [CRM_PERMISSION.financeEdit] },
    },
  ],
  naming: { strategy: 'UUID_INTERNAL' },
  flags: { isChild: false, isSingle: false, isVirtual: false, isSubmittable: false },
  list: {
    searchFields: ['referenceCode', 'title'],
    defaultSort: { fieldname: 'createdAt', direction: 'desc' },
    pageSize: 25,
  },
  persistence: {
    table: 'FinanceDevis',
    delegate: 'financeDevis',
    nameField: 'id',
    creationField: 'createdAt',
    modifiedField: 'updatedAt',
  },
};
