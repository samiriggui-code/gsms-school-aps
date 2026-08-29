import type { DocTypeDefinition } from '@repo/doctype';
import { CRM_PERMISSION, GOVERNANCE_PERMISSION } from '@/lib/auth/crm-permissions';

/** WF-39 — fiche qualification sous-traitant. */
export const subcontractorRecordDocType: DocTypeDefinition = {
  name: 'SubcontractorRecord',
  module: 'organisation',
  label: 'Sous-traitant (qualification)',
  table: 'SubcontractorRecord',
  schemaVersion: 1,
  aliases: ['subcontractorRecord'],
  fields: [
    { fieldname: 'label', label: 'Libellé', fieldtype: 'Data', required: true, searchable: true },
    { fieldname: 'siret', label: 'SIRET', fieldtype: 'Data', searchable: true },
    { fieldname: 'status', label: 'Statut', fieldtype: 'Select', required: true },
    {
      fieldname: 'companyId',
      label: 'Société CRM',
      fieldtype: 'Link',
      options: 'Company',
      linkDisplayField: 'name',
    },
    { fieldname: 'notes', label: 'Notes', fieldtype: 'Text' },
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
      delete: true,
      requires: { anyPermissionSlugs: [CRM_PERMISSION.ressourcesEdit] },
    },
    // Transitions de qualification (validation) — Qualité / conformité (P4-A2).
    {
      role: '*',
      permlevel: 0,
      write: true,
      requires: { anyPermissionSlugs: [GOVERNANCE_PERMISSION.conformiteEdit] },
    },
  ],
  naming: { strategy: 'UUID_INTERNAL' },
  flags: { isChild: false, isSingle: false, isVirtual: false, isSubmittable: false },
  persistence: {
    table: 'SubcontractorRecord',
    delegate: 'subcontractorRecord',
    nameField: 'id',
    creationField: 'createdAt',
    modifiedField: 'updatedAt',
  },
};
