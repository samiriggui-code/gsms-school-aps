import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DocTypeRegistry,
  ResourceService,
  hasPermission,
  type DocData,
  type DocTypeDefinition,
  type PersistenceAdapter,
  type PersistenceGetQuery,
  type PersistenceListQuery,
  type PersistenceWriteQuery,
} from '../index';

const flags = {
  isChild: false,
  isSingle: false,
  isVirtual: false,
  isSubmittable: false,
} as const;

function baseDef(
  partial: Pick<DocTypeDefinition, 'name' | 'module' | 'label' | 'table' | 'fields' | 'permissions' | 'persistence'> &
    Partial<Pick<DocTypeDefinition, 'aliases' | 'list'>>,
): DocTypeDefinition {
  return {
    schemaVersion: 1,
    naming: { strategy: 'UUID_INTERNAL' },
    flags: { ...flags },
    aliases: partial.aliases,
    list: partial.list,
    ...partial,
  };
}

/** Minimal sealed graph covering Vague 2 domains (CRM → Training → Funding → Documents → Quality). */
function vague2Definitions(): DocTypeDefinition[] {
  return [
    baseDef({
      name: 'User',
      module: 'core.iam',
      label: 'User',
      table: 'User',
      fields: [{ fieldname: 'name', label: 'Nom', fieldtype: 'Data', required: true, searchable: true }],
      permissions: [
        { role: '*', permlevel: 0, read: true, requires: { anyPermissionSlugs: ['iam.users.view'] } },
      ],
      persistence: { table: 'User', delegate: 'user', nameField: 'id' },
      aliases: ['user'],
    }),
    baseDef({
      name: 'Lead',
      module: 'crm',
      label: 'Lead',
      table: 'Lead',
      fields: [
        { fieldname: 'email', label: 'E-mail', fieldtype: 'Email', required: true, searchable: true },
        { fieldname: 'lastName', label: 'Nom', fieldtype: 'Data', required: true, searchable: true },
      ],
      permissions: [
        {
          role: '*',
          permlevel: 0,
          read: true,
          requires: { anyPermissionSlugs: ['crm.communication.view'] },
        },
        {
          role: '*',
          permlevel: 0,
          create: true,
          write: true,
          requires: { anyPermissionSlugs: ['crm.communication.edit'] },
        },
      ],
      persistence: {
        table: 'Lead',
        delegate: 'lead',
        nameField: 'id',
        creationField: 'createdAt',
        modifiedField: 'updatedAt',
      },
      aliases: ['lead'],
      list: {
        searchFields: ['email', 'lastName'],
        defaultSort: { fieldname: 'createdAt', direction: 'desc' },
        pageSize: 2,
      },
    }),
    baseDef({
      name: 'Formation',
      module: 'training',
      label: 'Formation',
      table: 'Formation',
      fields: [
        { fieldname: 'slug', label: 'Slug', fieldtype: 'Data', required: true, searchable: true },
        { fieldname: 'name', label: 'Nom', fieldtype: 'Data', required: true, searchable: true },
      ],
      permissions: [
        {
          role: '*',
          permlevel: 0,
          read: true,
          requires: { anyPermissionSlugs: ['crm.academique.view'] },
        },
      ],
      persistence: { table: 'Formation', delegate: 'formation', nameField: 'id' },
      aliases: ['formation'],
    }),
    baseDef({
      name: 'FundingCase',
      module: 'funding',
      label: 'Dossier',
      table: 'FundingCase',
      fields: [
        { fieldname: 'reference', label: 'Réf', fieldtype: 'Data', searchable: true },
        { fieldname: 'status', label: 'Statut', fieldtype: 'Select', required: true },
      ],
      permissions: [
        {
          role: '*',
          permlevel: 0,
          read: true,
          requires: { anyPermissionSlugs: ['crm.finance.view'] },
        },
      ],
      persistence: { table: 'FundingCase', delegate: 'fundingCase', nameField: 'id' },
      aliases: ['fundingCase'],
    }),
    baseDef({
      name: 'FileAsset',
      module: 'documents',
      label: 'Fichier',
      table: 'FileAsset',
      fields: [
        { fieldname: 'originalName', label: 'Nom', fieldtype: 'Data', required: true, searchable: true },
      ],
      permissions: [
        {
          role: '*',
          permlevel: 0,
          read: true,
          requires: { anyPermissionSlugs: ['crm.ressources.view'] },
        },
      ],
      persistence: { table: 'FileAsset', delegate: 'fileAsset', nameField: 'id' },
      aliases: ['fileAsset'],
    }),
    baseDef({
      name: 'QualityIncident',
      module: 'quality',
      label: 'Incident',
      table: 'QualityIncident',
      fields: [
        { fieldname: 'referenceCode', label: 'Réf', fieldtype: 'Data', required: true, searchable: true },
        { fieldname: 'title', label: 'Titre', fieldtype: 'Data', required: true, searchable: true },
      ],
      permissions: [
        {
          role: '*',
          permlevel: 0,
          read: true,
          requires: { anyPermissionSlugs: ['crm.support.view'] },
        },
      ],
      persistence: { table: 'QualityIncident', delegate: 'qualityIncident', nameField: 'id' },
      aliases: ['qualityIncident'],
    }),
  ];
}

class MemoryAdapter implements PersistenceAdapter {
  private readonly stores = new Map<string, Map<string, DocData>>();

  private store(delegate: string) {
    let s = this.stores.get(delegate);
    if (!s) {
      s = new Map();
      this.stores.set(delegate, s);
    }
    return s;
  }

  async count(query: PersistenceListQuery): Promise<number> {
    return (await this.findMany({ ...query, skip: 0, take: 10_000 })).length;
  }

  async findMany(query: PersistenceListQuery): Promise<DocData[]> {
    let rows = [...this.store(query.delegate).values()];
    const where = query.where ?? {};

    const clauses: Record<string, unknown>[] = Array.isArray(where.AND)
      ? (where.AND as Record<string, unknown>[])
      : [where];

    for (const clause of clauses) {
      if (clause.isTrashed === false) {
        rows = rows.filter((r) => r.isTrashed !== true);
      }
      if (Array.isArray(clause.OR)) {
        rows = rows.filter((row) =>
          (clause.OR as Array<Record<string, { contains?: string }>>).some((orClause) =>
            Object.entries(orClause).some(([field, cond]) =>
              String(row[field] ?? '')
                .toLowerCase()
                .includes(String(cond?.contains ?? '').toLowerCase()),
            ),
          ),
        );
      }
    }

    if (query.orderBy && typeof query.orderBy === 'object') {
      const [[field, dir]] = Object.entries(query.orderBy as Record<string, string>);
      rows.sort((a, b) => {
        const av = String(a[field] ?? '');
        const bv = String(b[field] ?? '');
        return dir === 'desc' ? bv.localeCompare(av) : av.localeCompare(bv);
      });
    }
    const skip = query.skip ?? 0;
    const take = query.take ?? rows.length;
    return rows.slice(skip, skip + take);
  }

  async findUnique(query: PersistenceGetQuery): Promise<DocData | null> {
    return this.store(query.delegate).get(query.name) ?? null;
  }

  async create(query: PersistenceWriteQuery): Promise<DocData> {
    const name = query.name ?? String(query.data[query.nameField]);
    const row = { ...query.data, [query.nameField]: name };
    this.store(query.delegate).set(name, row);
    return row;
  }

  async update(
    query: Required<Pick<PersistenceWriteQuery, 'delegate' | 'nameField' | 'name' | 'data'>>,
  ): Promise<DocData> {
    const prev = this.store(query.delegate).get(query.name);
    if (!prev) throw new Error('Record not found');
    const row = { ...prev, ...query.data, [query.nameField]: query.name };
    this.store(query.delegate).set(query.name, row);
    return row;
  }

  async delete(query: PersistenceGetQuery): Promise<void> {
    this.store(query.delegate).delete(query.name);
  }
}

test('Vague 2 harden: seal CRM/Training/Funding/Documents/Quality — no tenantId', () => {
  const registry = new DocTypeRegistry();
  for (const definition of vague2Definitions()) {
    registry.registerDefinition({ definition });
  }
  registry.assertValid();
  registry.seal();

  assert.equal(registry.listDocTypes().length, 6);
  for (const def of registry.listDocTypes()) {
    const meta = registry.getMeta(def.name);
    assert.equal(
      meta.fields.some((f) => f.fieldname === 'tenant_id' || f.fieldname === 'tenantId'),
      false,
      `${def.name} must not declare tenant fields`,
    );
    assert.equal(
      meta.systemFields.some((f) => f.fieldname === 'tenant_id' || f.fieldname === 'tenantId'),
      false,
    );
    for (const perm of meta.permissions) {
      if (perm.role === '*') {
        assert.ok(
          perm.requires?.anyPermissionSlugs?.length || perm.requires?.allPermissionSlugs?.length,
          `${def.name}: role '*' must declare requires.permissionSlugs`,
        );
      }
    }
  }

  const leadMeta = registry.getMeta('Lead');
  assert.equal(
    hasPermission({
      meta: leadMeta,
      principal: {
        id: '1',
        roleSlug: 'staff',
        permissionSlugs: new Set(),
        isSystemManager: false,
      },
      action: 'read',
    }),
    false,
  );
  assert.equal(
    hasPermission({
      meta: leadMeta,
      principal: {
        id: '1',
        roleSlug: 'staff',
        permissionSlugs: new Set(['crm.communication.view']),
        isSystemManager: false,
      },
      action: 'read',
    }),
    true,
  );
});

test('Vague 2 harden: ResourceService search + pagination on Lead', async () => {
  const registry = new DocTypeRegistry();
  for (const definition of vague2Definitions()) {
    registry.registerDefinition({ definition });
  }
  registry.seal();
  const service = new ResourceService({ registry, adapter: new MemoryAdapter() });
  const principal = {
    id: 'u1',
    roleSlug: 'admin',
    permissionSlugs: new Set(['crm.communication.view', 'crm.communication.edit']),
    isSystemManager: false,
  };

  await service.create('Lead', { email: 'a@ex.com', lastName: 'Alpha', createdAt: '2026-01-01' }, principal);
  await service.create('Lead', { email: 'b@ex.com', lastName: 'Beta', createdAt: '2026-02-01' }, principal);
  await service.create('Lead', { email: 'c@ex.com', lastName: 'Gamma', createdAt: '2026-03-01' }, principal);

  const page1 = await service.list('Lead', principal, { page: 1, limit: 2 });
  assert.equal(page1.data.length, 2);
  assert.equal(page1.pagination.total, 3);
  assert.equal(page1.pagination.limit, 2);

  const searched = await service.list('Lead', principal, { query: 'Beta' });
  assert.equal(searched.pagination.total, 1);
  assert.equal(searched.data[0]?.lastName, 'Beta');
});

test('Vague 2 harden: ResourceService soft-delete hides rows from default list', async () => {
  const softRole: DocTypeDefinition = {
    name: 'SoftRole',
    module: 'core.iam',
    label: 'Soft role',
    table: 'UserRole',
    schemaVersion: 1,
    fields: [
      { fieldname: 'slug', label: 'Slug', fieldtype: 'Data', required: true, searchable: true },
      { fieldname: 'name', label: 'Nom', fieldtype: 'Data', required: true },
    ],
    permissions: [
      {
        role: '*',
        permlevel: 0,
        read: true,
        create: true,
        write: true,
        delete: true,
        requires: { anyPermissionSlugs: ['iam.roles.edit'] },
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
      delegate: 'softRole',
      nameField: 'id',
      softDeleteField: 'isTrashed',
    },
  };

  const registry = new DocTypeRegistry();
  registry.registerDefinition({ definition: softRole });
  registry.seal();
  const service = new ResourceService({ registry, adapter: new MemoryAdapter() });
  const principal = {
    id: 'u1',
    roleSlug: 'admin',
    permissionSlugs: new Set(['iam.roles.edit']),
    isSystemManager: false,
  };

  const created = await service.create('SoftRole', { slug: 'tmp', name: 'Tmp' }, principal);
  assert.equal((await service.list('SoftRole', principal)).pagination.total, 1);

  await service.delete('SoftRole', String(created.id), principal);
  assert.equal((await service.list('SoftRole', principal)).pagination.total, 0);
  assert.equal((await service.list('SoftRole', principal, { trashed: true })).pagination.total, 1);
  assert.equal((await service.get('SoftRole', String(created.id), principal))?.isTrashed, true);
});
