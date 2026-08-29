import type { DocTypeDefinition } from '@repo/doctype';
import { IAM_PERMISSION } from '@/lib/auth/crm-permissions';

export const userDocType: DocTypeDefinition = {
  name: 'User',
  module: 'core.iam',
  label: 'Utilisateur',
  table: 'User',
  schemaVersion: 1,
  aliases: ['user'],
  fields: [
    { fieldname: 'email', label: 'E-mail', fieldtype: 'Email', required: true, searchable: true },
    { fieldname: 'name', label: 'Nom', fieldtype: 'Data', required: true, searchable: true },
    {
      fieldname: 'roleId',
      label: 'Rôle',
      fieldtype: 'Link',
      options: 'Role',
      required: true,
      linkDisplayField: 'name',
    },
  ],
  permissions: [
    {
      role: '*',
      permlevel: 0,
      read: true,
      requires: { anyPermissionSlugs: [IAM_PERMISSION.usersView] },
    },
    {
      role: '*',
      permlevel: 0,
      create: true,
      requires: { anyPermissionSlugs: [IAM_PERMISSION.usersCreate] },
    },
    {
      role: '*',
      permlevel: 0,
      write: true,
      requires: { anyPermissionSlugs: [IAM_PERMISSION.usersEdit] },
    },
    {
      role: '*',
      permlevel: 0,
      delete: true,
      requires: { anyPermissionSlugs: [IAM_PERMISSION.usersDelete] },
    },
  ],
  naming: { strategy: 'UUID_INTERNAL' },
  flags: { isChild: false, isSingle: false, isVirtual: false, isSubmittable: false },
  persistence: {
    table: 'User',
    delegate: 'user',
    nameField: 'id',
    creationField: 'createdAt',
    modifiedField: 'updatedAt',
  },
};

export const roleDocType: DocTypeDefinition = {
  name: 'Role',
  module: 'core.iam',
  label: 'Rôle',
  table: 'UserRole',
  schemaVersion: 1,
  aliases: ['role'],
  fields: [
    { fieldname: 'slug', label: 'Slug', fieldtype: 'Data', required: true, unique: true, searchable: true },
    { fieldname: 'name', label: 'Nom', fieldtype: 'Data', required: true, searchable: true },
  ],
  permissions: [
    {
      role: '*',
      permlevel: 0,
      read: true,
      requires: { anyPermissionSlugs: [IAM_PERMISSION.rolesView] },
    },
    {
      role: '*',
      permlevel: 0,
      create: true,
      write: true,
      delete: true,
      requires: { anyPermissionSlugs: [IAM_PERMISSION.rolesEdit] },
    },
  ],
  naming: { strategy: 'UUID_INTERNAL' },
  flags: {
    isChild: false,
    isSingle: false,
    isVirtual: false,
    isSubmittable: false,
    softDelete: true,
  },
  persistence: {
    table: 'UserRole',
    delegate: 'userRole',
    nameField: 'id',
    creationField: 'createdAt',
    modifiedField: 'updatedAt',
    softDeleteField: 'isTrashed',
  },
};
