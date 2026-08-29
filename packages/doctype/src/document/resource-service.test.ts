import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DocTypeRegistry,
  ResourceService,
  type DocData,
  type DocTypeDefinition,
  type PersistenceAdapter,
  type PersistenceGetQuery,
  type PersistenceListQuery,
  type PersistenceWriteQuery,
} from '../index';

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
    return (await this.findMany(query)).length;
  }

  async findMany(query: PersistenceListQuery): Promise<DocData[]> {
    let rows = [...this.store(query.delegate).values()];
    const where = query.where ?? {};
    if (where.isTrashed === false) {
      rows = rows.filter((r) => r.isTrashed !== true);
    }
    if (Array.isArray(where.OR)) {
      const q = String((where.OR[0] as { email?: { contains: string } })?.email?.contains ?? '');
      if (q) rows = rows.filter((r) => String(r.email ?? '').includes(q));
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

const roleDef: DocTypeDefinition = {
  name: 'Role',
  module: 'core.iam',
  label: 'Rôle',
  table: 'UserRole',
  schemaVersion: 1,
  fields: [
    { fieldname: 'slug', label: 'Slug', fieldtype: 'Data', required: true, searchable: true },
    { fieldname: 'name', label: 'Nom', fieldtype: 'Data', required: true },
  ],
  permissions: [
    { role: '*', permlevel: 0, read: true, create: true, write: true, delete: true },
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
    softDeleteField: 'isTrashed',
  },
  aliases: ['role'],
};

test('ResourceService CRUD via memory adapter', async () => {
  const registry = new DocTypeRegistry();
  registry.registerDefinition({ definition: roleDef });
  registry.seal();
  const service = new ResourceService({ registry, adapter: new MemoryAdapter() });
  const principal = {
    id: 'u1',
    roleSlug: 'admin',
    permissionSlugs: new Set<string>(),
    isSystemManager: true,
  };

  const created = await service.create('role', { slug: 'formateur', name: 'Formateur' }, principal);
  assert.ok(typeof created.id === 'string');
  assert.equal(created.slug, 'formateur');

  const listed = await service.list('role', principal, { query: 'formateur' });
  assert.equal(listed.pagination.total >= 1, true);

  const updated = await service.update('role', String(created.id), { name: 'Formateur·rice' }, principal);
  assert.equal(updated.name, 'Formateur·rice');

  await service.delete('role', String(created.id), principal);
  const after = await service.get('role', String(created.id), principal);
  assert.equal(after?.isTrashed, true);
});
