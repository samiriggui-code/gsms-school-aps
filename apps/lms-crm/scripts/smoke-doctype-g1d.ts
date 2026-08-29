/**
 * G1-D smoke — Prisma list User via ResourceService (no Next.js).
 * From repo root: pnpm smoke:doctype
 */
import { createPrismaClient } from '@repo/database';
import {
  DocTypeRegistry,
  ResourceService,
  type DocData,
  type DocTypeDefinition,
  type PersistenceAdapter,
  type PersistenceGetQuery,
  type PersistenceListQuery,
  type PersistenceWriteQuery,
} from '@repo/doctype';

const userDef: DocTypeDefinition = {
  name: 'User',
  module: 'core.iam',
  label: 'Utilisateur',
  table: 'User',
  schemaVersion: 1,
  aliases: ['user'],
  fields: [
    { fieldname: 'email', label: 'E-mail', fieldtype: 'Email', required: true, searchable: true },
    { fieldname: 'name', label: 'Nom', fieldtype: 'Data', required: true, searchable: true },
  ],
  permissions: [{ role: '*', permlevel: 0, read: true, create: true, write: true, delete: true }],
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

type PrismaLike = {
  $disconnect: () => Promise<void>;
  [key: string]: unknown;
};

type Delegate = {
  count: (a: unknown) => Promise<number>;
  findMany: (a: unknown) => Promise<DocData[]>;
  findUnique: (a: unknown) => Promise<DocData | null>;
  create: (a: unknown) => Promise<DocData>;
  update: (a: unknown) => Promise<DocData>;
  delete: (a: unknown) => Promise<DocData>;
};

class PrismaAdapter implements PersistenceAdapter {
  prisma: PrismaLike;
  constructor(prisma: PrismaLike) {
    this.prisma = prisma;
  }

  delegate(name: string): Delegate {
    const d = this.prisma[name] as Delegate | undefined;
    if (!d) throw new Error(`delegate missing: ${name}`);
    return d;
  }

  count(q: PersistenceListQuery) {
    return this.delegate(q.delegate).count({ where: q.where ?? {} });
  }
  findMany(q: PersistenceListQuery) {
    return this.delegate(q.delegate).findMany({
      where: q.where ?? {},
      orderBy: q.orderBy,
      skip: q.skip,
      take: q.take,
    });
  }
  findUnique(q: PersistenceGetQuery) {
    return this.delegate(q.delegate).findUnique({ where: { [q.nameField]: q.name } });
  }
  create(q: PersistenceWriteQuery) {
    return this.delegate(q.delegate).create({ data: q.data });
  }
  update(q: Required<Pick<PersistenceWriteQuery, 'delegate' | 'nameField' | 'name' | 'data'>>) {
    return this.delegate(q.delegate).update({
      where: { [q.nameField]: q.name },
      data: q.data,
    });
  }
  async delete(q: PersistenceGetQuery) {
    await this.delegate(q.delegate).delete({ where: { [q.nameField]: q.name } });
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL missing — load .env');
  }

  const prisma = createPrismaClient('doctype-g1d-smoke') as unknown as PrismaLike;
  const registry = new DocTypeRegistry();
  registry.registerDefinition({ definition: userDef });
  registry.seal();

  const service = new ResourceService({
    registry,
    adapter: new PrismaAdapter(prisma),
  });

  const principal = {
    id: 'smoke',
    roleSlug: 'superadmin',
    permissionSlugs: new Set<string>(),
    isSystemManager: true,
  };

  const listed = await service.list('user', principal, { page: 1, limit: 5 });
  console.log(
    JSON.stringify(
      {
        ok: true,
        doctype: 'User',
        total: listed.pagination.total,
        sample: listed.data.slice(0, 2).map((r) => ({
          id: r.id,
          email: r.email,
          name: r.name,
        })),
      },
      null,
      2,
    ),
  );

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('[smoke-doctype-g1d] FAILED', err);
  process.exit(1);
});
