import { prisma } from '@/lib/prisma';
import type {
  DocData,
  PersistenceAdapter,
  PersistenceGetQuery,
  PersistenceListQuery,
  PersistenceWriteQuery,
} from '@repo/doctype';

type PrismaDelegate = {
  count: (args: unknown) => Promise<number>;
  findMany: (args: unknown) => Promise<DocData[]>;
  findUnique: (args: unknown) => Promise<DocData | null>;
  create: (args: unknown) => Promise<DocData>;
  update: (args: unknown) => Promise<DocData>;
  delete: (args: unknown) => Promise<DocData>;
};

function getDelegate(name: string): PrismaDelegate {
  const client = prisma as unknown as Record<string, PrismaDelegate | undefined>;
  const delegate = client[name];
  if (!delegate) {
    throw new Error(`Prisma delegate introuvable: ${name}`);
  }
  return delegate;
}

/** App-owned Prisma persistence for @repo/doctype Document runtime. */
export class PrismaPersistenceAdapter implements PersistenceAdapter {
  async count(query: PersistenceListQuery): Promise<number> {
    const d = getDelegate(query.delegate);
    return d.count({ where: query.where ?? {} });
  }

  async findMany(query: PersistenceListQuery): Promise<DocData[]> {
    const d = getDelegate(query.delegate);
    return d.findMany({
      where: query.where ?? {},
      orderBy: query.orderBy,
      skip: query.skip,
      take: query.take,
    });
  }

  async findUnique(query: PersistenceGetQuery): Promise<DocData | null> {
    const d = getDelegate(query.delegate);
    return d.findUnique({ where: { [query.nameField]: query.name } });
  }

  async create(query: PersistenceWriteQuery): Promise<DocData> {
    const d = getDelegate(query.delegate);
    return d.create({ data: query.data });
  }

  async update(
    query: Required<Pick<PersistenceWriteQuery, 'delegate' | 'nameField' | 'name' | 'data'>>,
  ): Promise<DocData> {
    const d = getDelegate(query.delegate);
    return d.update({
      where: { [query.nameField]: query.name },
      data: query.data,
    });
  }

  async delete(query: PersistenceGetQuery): Promise<void> {
    const d = getDelegate(query.delegate);
    await d.delete({ where: { [query.nameField]: query.name } });
  }
}

let singleton: PrismaPersistenceAdapter | undefined;

export function getPrismaPersistenceAdapter(): PrismaPersistenceAdapter {
  if (!singleton) singleton = new PrismaPersistenceAdapter();
  return singleton;
}
