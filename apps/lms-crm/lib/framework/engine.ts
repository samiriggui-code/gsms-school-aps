import { prisma } from '@/lib/prisma';
import {
  buildCreateSchema,
  buildUpdateSchema,
  serializeEntitySchema,
  type EntityDefinition,
  type EntityListContext,
} from './entity';
import { getEntityDefinition } from './registry';

type PrismaDelegate = {
  count: (args: unknown) => Promise<number>;
  findMany: (args: unknown) => Promise<Record<string, unknown>[]>;
  findUnique: (args: unknown) => Promise<Record<string, unknown> | null>;
  create: (args: unknown) => Promise<Record<string, unknown>>;
  update: (args: unknown) => Promise<Record<string, unknown>>;
  delete: (args: unknown) => Promise<Record<string, unknown>>;
};

function getDelegate(def: EntityDefinition): PrismaDelegate {
  const client = prisma as unknown as Record<string, PrismaDelegate | undefined>;
  const delegate = client[def.prismaModel];
  if (!delegate) {
    throw new Error(`Modèle Prisma introuvable: ${def.prismaModel}`);
  }
  return delegate;
}

function requireEntity(name: string): EntityDefinition {
  const def = getEntityDefinition(name);
  if (!def) {
    throw new Error(`Entité inconnue: ${name}`);
  }
  return def;
}

/** Retire les champs non visibles pour le rôle courant. */
export function sanitize(
  def: EntityDefinition,
  record: Record<string, unknown>,
  roleSlug?: string | null,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...record };
  for (const field of def.fields) {
    if (!field.visibleFor?.length) continue;
    if (!roleSlug || !field.visibleFor.includes(roleSlug)) {
      delete out[field.name];
    }
  }
  return out;
}

function buildSearchWhere(
  def: EntityDefinition,
  query: string,
): Record<string, unknown> | undefined {
  if (!query.trim()) return undefined;
  const fields =
    def.list?.searchFields ??
    def.fields.filter((f) => f.search).map((f) => f.name);
  if (!fields.length) return undefined;
  return {
    OR: fields.map((name) => ({
      [name]: { contains: query, mode: 'insensitive' },
    })),
  };
}

function mergeWhere(
  parts: Array<Record<string, unknown> | undefined>,
): Record<string, unknown> {
  const and = parts.filter(Boolean) as Record<string, unknown>[];
  if (!and.length) return {};
  if (and.length === 1) return and[0]!;
  return { AND: and };
}

export type ListEntityResult = {
  data: Record<string, unknown>[];
  pagination: { total: number; page: number; limit: number };
};

export async function listEntity(
  entityName: string,
  ctx: EntityListContext,
  roleSlug?: string | null,
): Promise<ListEntityResult> {
  const def = requireEntity(entityName);
  const delegate = getDelegate(def);

  const page = Math.max(1, parseInt(ctx.searchParams.get('page') || '1', 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(ctx.searchParams.get('limit') || '10', 10) || 10),
  );
  const query = ctx.searchParams.get('query') || '';
  const sortField = ctx.searchParams.get('sort') || def.list?.defaultSort || 'createdAt';
  const sortDirection =
    (ctx.searchParams.get('dir') === 'desc' ? 'desc' : null) ||
    def.list?.defaultDir ||
    'asc';

  const dynamic = def.list?.dynamicWhere?.(ctx);
  const search = buildSearchWhere(def, query);
  const soft =
    def.softDelete && ctx.searchParams.get('trashed') !== '1'
      ? { isTrashed: false }
      : undefined;

  const where = mergeWhere([soft, dynamic, search]);

  const sortFn = def.list?.sortMap?.[sortField];
  const orderBy = sortFn
    ? sortFn(sortDirection)
    : { [sortField]: sortDirection };

  const selectBase = def.list?.extraSelect
    ? { ...def.list.extraSelect }
    : undefined;

  const findArgs: Record<string, unknown> = {
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy,
  };

  if (def.list?.include) {
    findArgs.include = def.list.include;
    if (selectBase) {
      // Prisma: select et include exclusifs — privilégier include + champs via select imbriqué
      // Si extraSelect + include, on utilise include seul (relations) ; sinon select.
      delete findArgs.include;
      findArgs.select = {
        ...selectBase,
        ...Object.fromEntries(
          Object.entries(def.list.include).map(([k, v]) => [k, v]),
        ),
      };
    }
  } else if (selectBase) {
    findArgs.select = selectBase;
  }

  const [total, rows] = await Promise.all([
    delegate.count({ where }),
    delegate.findMany(findArgs),
  ]);

  return {
    data: rows.map((row) => sanitize(def, row, roleSlug)),
    pagination: { total, page, limit },
  };
}

export async function getEntityById(
  entityName: string,
  id: string,
  roleSlug?: string | null,
): Promise<Record<string, unknown> | null> {
  const def = requireEntity(entityName);
  const delegate = getDelegate(def);

  const args: Record<string, unknown> = { where: { id } };
  if (def.list?.include) {
    args.include = def.list.include;
  }

  const row = await delegate.findUnique(args);
  if (!row) return null;
  return sanitize(def, row, roleSlug);
}

export async function createEntity(
  entityName: string,
  raw: Record<string, unknown>,
  opts: { userId: string; headers: Headers; roleSlug?: string | null },
): Promise<Record<string, unknown>> {
  const def = requireEntity(entityName);
  const delegate = getDelegate(def);
  const parsed = buildCreateSchema(def).safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Validation: ${parsed.error.issues.map((i) => i.message).join(', ')}`);
  }

  let data = { ...parsed.data } as Record<string, unknown>;
  if (def.hooks?.beforeCreate) {
    const next = await def.hooks.beforeCreate({
      userId: opts.userId,
      headers: opts.headers,
      data,
    });
    if (next) data = next;
  }

  const created = await delegate.create({ data });

  if (def.hooks?.afterCreate) {
    await def.hooks.afterCreate({
      userId: opts.userId,
      headers: opts.headers,
      data,
      record: created,
    });
  }

  return sanitize(def, created, opts.roleSlug);
}

export async function updateEntity(
  entityName: string,
  id: string,
  raw: Record<string, unknown>,
  opts: { userId: string; headers: Headers; roleSlug?: string | null },
): Promise<Record<string, unknown>> {
  const def = requireEntity(entityName);
  const delegate = getDelegate(def);
  const existing = await delegate.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Record not found');
  }

  const parsed = buildUpdateSchema(def).safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Validation: ${parsed.error.issues.map((i) => i.message).join(', ')}`);
  }

  let data = { ...parsed.data } as Record<string, unknown>;
  if (def.hooks?.beforeUpdate) {
    const next = await def.hooks.beforeUpdate({
      userId: opts.userId,
      headers: opts.headers,
      data,
      record: existing,
    });
    if (next) data = next;
  }

  const updated = await delegate.update({ where: { id }, data });

  if (def.hooks?.afterUpdate) {
    await def.hooks.afterUpdate({
      userId: opts.userId,
      headers: opts.headers,
      data,
      record: updated,
    });
  }

  return sanitize(def, updated, opts.roleSlug);
}

export async function deleteEntity(
  entityName: string,
  id: string,
  opts: { userId: string; headers: Headers },
): Promise<void> {
  const def = requireEntity(entityName);
  const delegate = getDelegate(def);
  const existing = await delegate.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Record not found');
  }

  if (def.hooks?.beforeDelete) {
    await def.hooks.beforeDelete({
      userId: opts.userId,
      headers: opts.headers,
      data: {},
      record: existing,
    });
  }

  if (def.softDelete) {
    await delegate.update({ where: { id }, data: { isTrashed: true } });
  } else {
    await delegate.delete({ where: { id } });
  }

  if (def.hooks?.afterDelete) {
    await def.hooks.afterDelete({
      userId: opts.userId,
      headers: opts.headers,
      data: {},
      record: existing,
    });
  }
}

export function getPublicSchema(entityName: string) {
  const def = requireEntity(entityName);
  return serializeEntitySchema(def);
}
