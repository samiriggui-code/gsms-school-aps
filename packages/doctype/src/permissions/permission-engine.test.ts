import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compileDocMeta, hasPermission, hasListPermission, buildRecordScopeWhere, type DocTypeDefinition } from '../index';

const formationSessionLike: DocTypeDefinition = {
  name: 'FormationSession',
  module: 'training',
  label: 'Session',
  table: 'FormationSession',
  schemaVersion: 1,
  fields: [
    {
      fieldname: 'trainerUserId',
      label: 'Formateur',
      fieldtype: 'Link',
      options: 'User',
    },
  ],
  permissions: [
    {
      role: 'formateur',
      permlevel: 0,
      read: true,
      condition: {
        type: 'fieldEqualsPrincipal',
        fieldname: 'trainerUserId',
        principalClaim: 'id',
      },
    },
    {
      role: '*',
      permlevel: 0,
      read: true,
      requires: { anyPermissionSlugs: ['crm.academique.view'] },
    },
  ],
  naming: { strategy: 'UUID_INTERNAL' },
  flags: { isChild: false, isSingle: false, isVirtual: false, isSubmittable: false },
  persistence: { table: 'FormationSession', delegate: 'formationSession', nameField: 'id' },
};

test('NAF-14: record condition grants formateur read on own session only', () => {
  const meta = compileDocMeta(formationSessionLike);
  const ownSession = { id: 's1', trainerUserId: 'trainer-1' };
  const otherSession = { id: 's2', trainerUserId: 'trainer-2' };

  const trainer = {
    id: 'trainer-1',
    roleSlug: 'formateur',
    permissionSlugs: new Set<string>(),
    isSystemManager: false,
  };

  assert.equal(
    hasPermission({ meta, principal: trainer, action: 'read', document: ownSession }),
    true,
  );
  assert.equal(
    hasPermission({ meta, principal: trainer, action: 'read', document: otherSession }),
    false,
  );
  assert.equal(hasPermission({ meta, principal: trainer, action: 'read' }), false);
});

test('NAF-14: staff with academique.view reads any session without document', () => {
  const meta = compileDocMeta(formationSessionLike);
  const staff = {
    id: 'staff-1',
    roleSlug: 'staff',
    permissionSlugs: new Set(['crm.academique.view']),
    isSystemManager: false,
  };

  assert.equal(hasPermission({ meta, principal: staff, action: 'read' }), true);
  assert.equal(hasListPermission({ meta, principal: staff, action: 'read' }), true);
  assert.equal(buildRecordScopeWhere({ meta, principal: staff, action: 'read' }), undefined);
});

test('NAF-14 list: formateur list scoped to trainerUserId', () => {
  const meta = compileDocMeta(formationSessionLike);
  const trainer = {
    id: 'trainer-1',
    roleSlug: 'formateur',
    permissionSlugs: new Set<string>(),
    isSystemManager: false,
  };

  assert.equal(hasListPermission({ meta, principal: trainer, action: 'read' }), true);
  assert.deepEqual(buildRecordScopeWhere({ meta, principal: trainer, action: 'read' }), {
    trainerUserId: 'trainer-1',
  });
});
