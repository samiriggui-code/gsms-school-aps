import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compileDocMeta, DocTypeRegistry, hasPermission, type DocTypeDefinition } from '../index';

const baseUser: DocTypeDefinition = {
  name: 'User',
  module: 'core.iam',
  label: 'Utilisateur',
  table: 'User',
  schemaVersion: 1,
  fields: [
    { fieldname: 'email', label: 'Email', fieldtype: 'Email', required: true, searchable: true },
  ],
  permissions: [
    {
      role: '*',
      permlevel: 0,
      read: true,
      requires: { anyPermissionSlugs: ['iam.users.view'] },
    },
  ],
  naming: { strategy: 'UUID_INTERNAL' },
  flags: { isChild: false, isSingle: false, isVirtual: false, isSubmittable: false },
  persistence: { table: 'User', delegate: 'user', nameField: 'id', creationField: 'createdAt', modifiedField: 'updatedAt' },
  aliases: ['user'],
};

test('compileDocMeta adds system fields and metadataVersion', () => {
  const meta = compileDocMeta(baseUser);
  assert.ok(meta.fieldsByName.has('name'));
  assert.ok(meta.fieldsByName.has('email'));
  assert.ok(meta.metadataVersion.startsWith('v1.'));
  assert.equal(meta.aliases[0], 'user');
});

test('registry resolves aliases and seals', () => {
  const registry = new DocTypeRegistry();
  registry.registerDefinition({ definition: baseUser });
  assert.equal(registry.resolveName('user'), 'User');
  registry.seal();
  assert.throws(() =>
    registry.registerDefinition({
      definition: { ...baseUser, label: 'Other' },
    }),
  );
});

test('permission engine fail-closed without slug', () => {
  const meta = compileDocMeta(baseUser);
  const denied = hasPermission({
    meta,
    principal: {
      id: '1',
      roleSlug: 'collaborateur',
      permissionSlugs: new Set(),
      isSystemManager: false,
    },
    action: 'read',
  });
  assert.equal(denied, false);
  const allowed = hasPermission({
    meta,
    principal: {
      id: '1',
      roleSlug: 'admin',
      permissionSlugs: new Set(['iam.users.view']),
      isSystemManager: false,
    },
    action: 'read',
  });
  assert.equal(allowed, true);
});

test('no tenant_id in system fields', () => {
  const meta = compileDocMeta(baseUser);
  assert.equal(
    meta.systemFields.some((f) => f.fieldname === 'tenant_id' || f.fieldname === 'tenantId'),
    false,
  );
});
