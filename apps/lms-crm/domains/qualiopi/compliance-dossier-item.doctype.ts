import type { DocTypeDefinition } from '@repo/doctype';
import { CRM_PERMISSION } from '@/lib/auth/crm-permissions';

/** Checklist Qualiopi — enregistré depuis le domaine, pas importé par le core package. */
export const complianceDossierItemDocType: DocTypeDefinition = {
  name: 'ComplianceDossierItem',
  module: 'qualiopi',
  label: 'Pièce dossier conformité',
  table: 'ComplianceDossierItem',
  schemaVersion: 1,
  aliases: ['complianceDossierItem'],
  fields: [
    { fieldname: 'code', label: 'Code', fieldtype: 'Data', required: true, searchable: true },
    { fieldname: 'label', label: 'Libellé', fieldtype: 'Data', required: true, searchable: true },
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
    table: 'ComplianceDossierItem',
    delegate: 'complianceDossierItem',
    nameField: 'id',
    creationField: 'createdAt',
    modifiedField: 'updatedAt',
  },
};
