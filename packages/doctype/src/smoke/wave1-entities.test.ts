import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DocTypeRegistry,
  hasPermission,
  type DocTypeDefinition,
} from '../index';

/** Mirrors apps/lms-crm/domains registrations — aliases + Link graph for G1-D seal smoke. */
function wave1Definitions(): DocTypeDefinition[] {
  const baseFlags = {
    isChild: false,
    isSingle: false,
    isVirtual: false,
    isSubmittable: false,
  } as const;

  return [
    {
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
        },
      ],
      permissions: [{ role: '*', permlevel: 0, read: true, requires: { anyPermissionSlugs: ['iam.users.view'] } }],
      naming: { strategy: 'UUID_INTERNAL' },
      flags: { ...baseFlags },
      persistence: { table: 'User', delegate: 'user', nameField: 'id' },
    },
    {
      name: 'Role',
      module: 'core.iam',
      label: 'Rôle',
      table: 'UserRole',
      schemaVersion: 1,
      aliases: ['role'],
      fields: [
        { fieldname: 'slug', label: 'Slug', fieldtype: 'Data', required: true, searchable: true },
        { fieldname: 'name', label: 'Nom', fieldtype: 'Data', required: true, searchable: true },
      ],
      permissions: [{ role: '*', permlevel: 0, read: true, requires: { anyPermissionSlugs: ['iam.roles.view'] } }],
      naming: { strategy: 'UUID_INTERNAL' },
      flags: { ...baseFlags, softDelete: true },
      persistence: {
        table: 'UserRole',
        delegate: 'userRole',
        nameField: 'id',
        softDeleteField: 'isTrashed',
      },
    },
    {
      name: 'LeaveRequest',
      module: 'rh',
      label: 'Absence',
      table: 'RhAbsence',
      schemaVersion: 1,
      aliases: ['leaveRequest'],
      fields: [
        { fieldname: 'userId', label: 'User', fieldtype: 'Link', options: 'User', required: true },
        { fieldname: 'status', label: 'Statut', fieldtype: 'Data', required: true },
      ],
      permissions: [{ role: '*', permlevel: 0, read: true }],
      naming: { strategy: 'UUID_INTERNAL' },
      flags: { ...baseFlags },
      persistence: { table: 'RhAbsence', delegate: 'rhAbsence', nameField: 'id' },
    },
    {
      name: 'LmsCourse',
      module: 'lms',
      label: 'Cours',
      table: 'Course',
      schemaVersion: 1,
      aliases: ['course'],
      fields: [{ fieldname: 'title', label: 'Titre', fieldtype: 'Data', required: true, searchable: true }],
      permissions: [{ role: '*', permlevel: 0, read: true }],
      naming: { strategy: 'UUID_INTERNAL' },
      flags: { ...baseFlags },
      persistence: { table: 'Course', delegate: 'course', nameField: 'id' },
    },
    {
      name: 'LmsLesson',
      module: 'lms',
      label: 'Leçon',
      table: 'Chapter',
      schemaVersion: 1,
      aliases: ['lesson'],
      fields: [
        { fieldname: 'title', label: 'Titre', fieldtype: 'Data', required: true },
        { fieldname: 'courseId', label: 'Cours', fieldtype: 'Link', options: 'LmsCourse', required: true },
      ],
      permissions: [{ role: '*', permlevel: 0, read: true }],
      naming: { strategy: 'UUID_INTERNAL' },
      flags: { ...baseFlags },
      persistence: { table: 'Chapter', delegate: 'chapter', nameField: 'id' },
    },
    {
      name: 'LmsEnrollment',
      module: 'lms',
      label: 'Inscription',
      table: 'Enrollment',
      schemaVersion: 1,
      aliases: ['enrollment'],
      fields: [
        { fieldname: 'userId', label: 'User', fieldtype: 'Link', options: 'User', required: true },
        { fieldname: 'courseId', label: 'Cours', fieldtype: 'Link', options: 'LmsCourse', required: true },
      ],
      permissions: [{ role: '*', permlevel: 0, read: true }],
      naming: { strategy: 'UUID_INTERNAL' },
      flags: { ...baseFlags },
      persistence: { table: 'Enrollment', delegate: 'enrollment', nameField: 'id' },
    },
    {
      name: 'ComplianceDossierItem',
      module: 'qualiopi',
      label: 'Pièce conformité',
      table: 'ComplianceDossierItem',
      schemaVersion: 1,
      aliases: ['complianceDossierItem'],
      fields: [
        { fieldname: 'code', label: 'Code', fieldtype: 'Data', required: true, searchable: true },
        { fieldname: 'label', label: 'Libellé', fieldtype: 'Data', required: true },
      ],
      permissions: [{ role: '*', permlevel: 0, read: true }],
      naming: { strategy: 'UUID_INTERNAL' },
      flags: { ...baseFlags },
      persistence: {
        table: 'ComplianceDossierItem',
        delegate: 'complianceDossierItem',
        nameField: 'id',
      },
    },
  ];
}

test('G1-D: wave1 registry seals with 7 entities and legacy aliases', () => {
  const registry = new DocTypeRegistry();
  for (const definition of wave1Definitions()) {
    registry.registerDefinition({ definition });
  }
  registry.assertValid();
  registry.seal();

  const aliases = [
    ['user', 'User'],
    ['role', 'Role'],
    ['leaveRequest', 'LeaveRequest'],
    ['course', 'LmsCourse'],
    ['lesson', 'LmsLesson'],
    ['enrollment', 'LmsEnrollment'],
    ['complianceDossierItem', 'ComplianceDossierItem'],
  ] as const;

  for (const [alias, canonical] of aliases) {
    assert.equal(registry.resolveName(alias), canonical);
    assert.ok(registry.getMeta(alias).metadataVersion);
  }

  assert.equal(registry.listDocTypes().length, 7);

  const meta = registry.getMeta('User');
  assert.equal(
    hasPermission({
      meta,
      principal: {
        id: '1',
        roleSlug: 'admin',
        permissionSlugs: new Set(['iam.users.view']),
        isSystemManager: false,
      },
      action: 'read',
    }),
    true,
  );
  assert.equal(
    meta.systemFields.some((f) => f.fieldname === 'tenant_id' || f.fieldname === 'tenantId'),
    false,
  );
});
