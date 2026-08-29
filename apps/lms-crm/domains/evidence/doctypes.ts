import type { DocTypeDefinition } from '@repo/doctype';
import { CRM_PERMISSION, GOVERNANCE_PERMISSION } from '@/lib/auth/crm-permissions';

/** G8 — preuve Qualiopi (Evidence Engine). */
export const evidenceDocType: DocTypeDefinition = {
  name: 'Evidence',
  module: 'evidence',
  label: 'Preuve',
  table: 'Evidence',
  schemaVersion: 1,
  aliases: ['evidence'],
  fields: [
    { fieldname: 'category', label: 'Catégorie', fieldtype: 'Data', required: true, searchable: true },
    { fieldname: 'sourceType', label: 'Type source', fieldtype: 'Select', required: true },
    { fieldname: 'sourceId', label: 'Source id', fieldtype: 'Data', required: true },
    { fieldname: 'status', label: 'Statut', fieldtype: 'Select', required: true },
    { fieldname: 'eventName', label: 'Événement SD-06', fieldtype: 'Data', searchable: true },
    {
      fieldname: 'sessionId',
      label: 'Session',
      fieldtype: 'Link',
      options: 'FormationSession',
      linkDisplayField: 'dateDisplayLabel',
    },
    {
      fieldname: 'formationId',
      label: 'Formation',
      fieldtype: 'Link',
      options: 'Formation',
      linkDisplayField: 'name',
    },
  ],
  permissions: [
    {
      role: '*',
      permlevel: 0,
      read: true,
      requires: {
        anyPermissionSlugs: [GOVERNANCE_PERMISSION.conformiteView, CRM_PERMISSION.ressourcesView],
      },
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
    searchFields: ['category', 'eventName'],
    defaultSort: { fieldname: 'createdAt', direction: 'desc' },
    pageSize: 25,
  },
  persistence: {
    table: 'Evidence',
    delegate: 'evidence',
    nameField: 'id',
    creationField: 'createdAt',
    modifiedField: 'updatedAt',
  },
};

export const evidenceIndicatorLinkDocType: DocTypeDefinition = {
  name: 'EvidenceIndicatorLink',
  module: 'evidence',
  label: 'Lien preuve↔indicateur',
  table: 'EvidenceIndicatorLink',
  schemaVersion: 1,
  aliases: ['evidenceIndicatorLink'],
  fields: [
    {
      fieldname: 'evidenceId',
      label: 'Preuve',
      fieldtype: 'Link',
      options: 'Evidence',
      required: true,
      linkDisplayField: 'category',
    },
    { fieldname: 'indicatorCode', label: 'Indicateur', fieldtype: 'Data', required: true, searchable: true },
  ],
  permissions: [
    {
      role: '*',
      permlevel: 0,
      read: true,
      requires: {
        anyPermissionSlugs: [GOVERNANCE_PERMISSION.conformiteView, CRM_PERMISSION.ressourcesView],
      },
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
  persistence: {
    table: 'EvidenceIndicatorLink',
    delegate: 'evidenceIndicatorLink',
    nameField: 'id',
    creationField: 'createdAt',
  },
};
