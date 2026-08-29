/**
 * Harden DocTypes — bootstrap réel apps/lms-crm (25 DocTypes).
 * Run: pnpm exec tsx --test ./scripts/harden-doctypes.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hasPermission } from '@repo/doctype';
import {
  bootstrapDocTypes,
  getDocTypeBootstrapError,
  getDocTypeBootstrapStatus,
} from '../lib/doctype/bootstrap';

test('harden: bootstrap seals all domain DocTypes without tenantId', () => {
  const registry = bootstrapDocTypes();
  assert.equal(getDocTypeBootstrapStatus(), 'ready', getDocTypeBootstrapError());
  assert.ok(registry.isSealed);

  const defs = registry.listDocTypes();
  assert.ok(defs.length >= 26, `expected ≥26 DocTypes, got ${defs.length}`);

  const modules = new Set(defs.map((d) => d.module.split('.')[0]));
  for (const required of ['crm', 'training', 'funding', 'documents', 'quality', 'audit', 'evidence']) {
    assert.ok(modules.has(required), `missing module ${required}`);
  }

  for (const def of defs) {
    const meta = registry.getMeta(def.name);
    const fieldNames = [...meta.fields, ...meta.systemFields].map((f) => f.fieldname);
    assert.equal(
      fieldNames.includes('tenant_id') || fieldNames.includes('tenantId'),
      false,
      `${def.name} has tenant field`,
    );

    for (const perm of meta.permissions) {
      if (perm.role !== '*') continue;
      const hasRequires =
        (perm.requires?.anyPermissionSlugs?.length ?? 0) > 0 ||
        (perm.requires?.allPermissionSlugs?.length ?? 0) > 0;
      assert.ok(hasRequires, `${def.name}: role '*' without requires.permissionSlugs`);
    }
  }
});

test('harden: PermissionEngine denies without slug (sample per domain)', () => {
  const registry = bootstrapDocTypes();
  const samples: Array<{ name: string; slug: string }> = [
    { name: 'User', slug: 'iam.users.view' },
    { name: 'LeaveRequest', slug: 'crm.ressources.view' },
    { name: 'LmsCourse', slug: 'lms.course.view' },
    { name: 'ComplianceDossierItem', slug: 'crm.ressources.view' },
    { name: 'Lead', slug: 'crm.communication.view' },
    { name: 'Formation', slug: 'crm.academique.view' },
    { name: 'FundingCase', slug: 'crm.finance.view' },
    { name: 'FundingDocument', slug: 'crm.finance.view' },
    { name: 'Evidence', slug: 'governance.conformite.view' },
    { name: 'FileAsset', slug: 'crm.ressources.view' },
    { name: 'QualityIncident', slug: 'crm.support.view' },
    { name: 'SystemLog', slug: 'iam.logs.view' },
  ];

  const empty = {
    id: 'x',
    roleSlug: 'staff',
    permissionSlugs: new Set<string>(),
    isSystemManager: false,
  };

  for (const sample of samples) {
    const meta = registry.getMeta(sample.name);
    assert.equal(
      hasPermission({ meta, principal: empty, action: 'read' }),
      false,
      `${sample.name} should deny without slug`,
    );
    assert.equal(
      hasPermission({
        meta,
        principal: { ...empty, permissionSlugs: new Set([sample.slug]) },
        action: 'read',
      }),
      true,
      `${sample.name} should allow with ${sample.slug}`,
    );
  }
});
