import type { DocTypeDefinition } from '@repo/doctype';
import { CRM_PERMISSION } from '@/lib/auth/crm-permissions';

export const leaveRequestDocType: DocTypeDefinition = {
  name: 'LeaveRequest',
  module: 'rh',
  label: 'Demande d\'absence',
  table: 'RhAbsence',
  schemaVersion: 1,
  aliases: ['leaveRequest'],
  fields: [
    {
      fieldname: 'userId',
      label: 'Collaborateur',
      fieldtype: 'Link',
      options: 'User',
      required: true,
      linkDisplayField: 'name',
    },
    { fieldname: 'startDate', label: 'Début', fieldtype: 'Date', required: true },
    { fieldname: 'endDate', label: 'Fin', fieldtype: 'Date', required: true },
    { fieldname: 'type', label: 'Type', fieldtype: 'Data', required: true },
    { fieldname: 'status', label: 'Statut', fieldtype: 'Data', required: true },
  ],
  permissions: [
    {
      role: '*',
      permlevel: 0,
      read: true,
      requires: { anyPermissionSlugs: [CRM_PERMISSION.ressourcesView] },
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
    table: 'RhAbsence',
    delegate: 'rhAbsence',
    nameField: 'id',
    creationField: 'createdAt',
    modifiedField: 'updatedAt',
  },
};
