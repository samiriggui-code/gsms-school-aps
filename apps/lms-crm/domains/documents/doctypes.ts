import type { DocTypeDefinition } from '@repo/doctype';
import { CRM_PERMISSION, GOVERNANCE_PERMISSION } from '@/lib/auth/crm-permissions';

/** G6 Documents — fichier stocké (Prisma `FileAsset`). */
export const fileAssetDocType: DocTypeDefinition = {
  name: 'FileAsset',
  module: 'documents',
  label: 'Fichier',
  table: 'FileAsset',
  schemaVersion: 1,
  aliases: ['fileAsset'],
  fields: [
    { fieldname: 'module', label: 'Module', fieldtype: 'Data', required: true, searchable: true },
    { fieldname: 'entityType', label: 'Type entité', fieldtype: 'Data', required: true, searchable: true },
    { fieldname: 'entityId', label: 'ID entité', fieldtype: 'Data' },
    { fieldname: 'category', label: 'Catégorie', fieldtype: 'Data', searchable: true },
    { fieldname: 'originalName', label: 'Nom fichier', fieldtype: 'Data', required: true, searchable: true },
    { fieldname: 'mimeType', label: 'MIME', fieldtype: 'Data', required: true },
    { fieldname: 'size', label: 'Taille', fieldtype: 'Integer', required: true },
    { fieldname: 'storageKey', label: 'Clé storage', fieldtype: 'Data', required: true, unique: true },
    { fieldname: 'url', label: 'URL', fieldtype: 'Data', required: true },
    { fieldname: 'visibility', label: 'Visibilité', fieldtype: 'Select', required: true },
    { fieldname: 'status', label: 'Statut', fieldtype: 'Select', required: true },
    { fieldname: 'documentRef', label: 'Réf. document', fieldtype: 'Data', searchable: true },
    {
      fieldname: 'createdById',
      label: 'Créé par',
      fieldtype: 'Link',
      options: 'User',
      linkDisplayField: 'name',
    },
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
      requires: {
        anyPermissionSlugs: [CRM_PERMISSION.ressourcesEdit, GOVERNANCE_PERMISSION.storageAdmin],
      },
    },
  ],
  naming: { strategy: 'UUID_INTERNAL' },
  flags: { isChild: false, isSingle: false, isVirtual: false, isSubmittable: false },
  list: {
    searchFields: ['originalName', 'documentRef', 'category', 'module'],
    defaultSort: { fieldname: 'createdAt', direction: 'desc' },
    pageSize: 25,
  },
  persistence: {
    table: 'FileAsset',
    delegate: 'fileAsset',
    nameField: 'id',
    creationField: 'createdAt',
    modifiedField: 'updatedAt',
  },
};

/** G6 — modèle de checklist documents (par kind dossier). */
export const documentRequirementTemplateDocType: DocTypeDefinition = {
  name: 'DocumentRequirementTemplate',
  module: 'documents',
  label: 'Modèle exigences docs',
  table: 'DocumentRequirementTemplate',
  schemaVersion: 1,
  aliases: ['documentRequirementTemplate'],
  fields: [
    { fieldname: 'kind', label: 'Kind', fieldtype: 'Select', required: true, unique: true },
    { fieldname: 'label', label: 'Libellé', fieldtype: 'Data', required: true, searchable: true },
    { fieldname: 'description', label: 'Description', fieldtype: 'Text' },
    { fieldname: 'moduleKey', label: 'Module', fieldtype: 'Data', required: true },
    { fieldname: 'isActive', label: 'Actif', fieldtype: 'Boolean' },
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
      requires: { anyPermissionSlugs: [CRM_PERMISSION.securiteEdit] },
    },
  ],
  naming: { strategy: 'UUID_INTERNAL' },
  flags: { isChild: false, isSingle: false, isVirtual: false, isSubmittable: false },
  list: {
    searchFields: ['label', 'moduleKey'],
    defaultSort: { fieldname: 'label', direction: 'asc' },
    pageSize: 25,
  },
  persistence: {
    table: 'DocumentRequirementTemplate',
    delegate: 'documentRequirementTemplate',
    nameField: 'id',
    creationField: 'createdAt',
    modifiedField: 'updatedAt',
  },
};

/** G6 — demande de pièce (relance). */
export const documentRequestDocType: DocTypeDefinition = {
  name: 'DocumentRequest',
  module: 'documents',
  label: 'Demande de document',
  table: 'DocumentRequest',
  schemaVersion: 1,
  aliases: ['documentRequest'],
  fields: [
    { fieldname: 'dossierId', label: 'Dossier', fieldtype: 'Data', required: true },
    { fieldname: 'dossierItemId', label: 'Item dossier', fieldtype: 'Data', required: true },
    { fieldname: 'status', label: 'Statut', fieldtype: 'Select', required: true },
    { fieldname: 'channel', label: 'Canal', fieldtype: 'Select', required: true },
    { fieldname: 'message', label: 'Message', fieldtype: 'Text' },
    { fieldname: 'dueAt', label: 'Échéance', fieldtype: 'Datetime' },
    {
      fieldname: 'requestedById',
      label: 'Demandé par',
      fieldtype: 'Link',
      options: 'User',
      linkDisplayField: 'name',
    },
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
    searchFields: ['status'],
    defaultSort: { fieldname: 'createdAt', direction: 'desc' },
    pageSize: 25,
  },
  persistence: {
    table: 'DocumentRequest',
    delegate: 'documentRequest',
    nameField: 'id',
    creationField: 'createdAt',
    modifiedField: 'updatedAt',
  },
};
