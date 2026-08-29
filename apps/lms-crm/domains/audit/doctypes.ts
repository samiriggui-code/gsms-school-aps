import type { DocTypeDefinition } from '@repo/doctype';
import { IAM_PERMISSION } from '@/lib/auth/crm-permissions';

/** G10 Audit — journal système existant (Prisma `SystemLog`). */
export const systemLogDocType: DocTypeDefinition = {
  name: 'SystemLog',
  module: 'audit',
  label: 'Journal système',
  table: 'SystemLog',
  schemaVersion: 1,
  aliases: ['systemLog'],
  fields: [
    {
      fieldname: 'userId',
      label: 'Utilisateur',
      fieldtype: 'Link',
      options: 'User',
      required: true,
      linkDisplayField: 'name',
    },
    { fieldname: 'entityType', label: 'Type entité', fieldtype: 'Data', searchable: true },
    { fieldname: 'entityId', label: 'ID entité', fieldtype: 'Data', searchable: true },
    { fieldname: 'event', label: 'Événement', fieldtype: 'Data', searchable: true },
    { fieldname: 'description', label: 'Description', fieldtype: 'Text' },
    { fieldname: 'ipAddress', label: 'IP', fieldtype: 'Data' },
  ],
  permissions: [
    {
      role: '*',
      permlevel: 0,
      read: true,
      requires: { anyPermissionSlugs: [IAM_PERMISSION.logsView] },
    },
    {
      role: '*',
      permlevel: 0,
      create: true,
      write: true,
      delete: true,
      requires: { anyPermissionSlugs: [IAM_PERMISSION.logsView] },
    },
  ],
  naming: { strategy: 'UUID_INTERNAL' },
  flags: { isChild: false, isSingle: false, isVirtual: false, isSubmittable: false },
  list: {
    searchFields: ['event', 'entityType', 'entityId', 'description'],
    defaultSort: { fieldname: 'createdAt', direction: 'desc' },
    pageSize: 50,
  },
  persistence: {
    table: 'SystemLog',
    delegate: 'systemLog',
    nameField: 'id',
    creationField: 'createdAt',
    modifiedField: undefined,
  },
};
