import type { DocData, DocMeta, PermissionPrincipal } from '../types';
import { checkPermission } from '../permissions/permission-engine';
import type { DocTypeRegistry } from '../registry/doc-type-registry';
import type { PersistenceAdapter, PersistenceOrderBy } from '../persistence/adapter';
import { Document, type DocControllerHooks } from './document';

export type ResourceListParams = {
  page?: number;
  limit?: number;
  query?: string;
  sort?: string;
  dir?: 'asc' | 'desc';
  trashed?: boolean;
  /** Equality filters for declared DocFields (and common extras). */
  filters?: Record<string, string>;
  searchParams?: URLSearchParams;
  headers?: Headers;
};

export type ResourceListResult = {
  data: DocData[];
  pagination: { total: number; page: number; limit: number };
};

export type ResourceServiceOptions = {
  registry: DocTypeRegistry;
  adapter: PersistenceAdapter;
};

function mergeWhere(parts: Array<Record<string, unknown> | undefined>): Record<string, unknown> {
  const and = parts.filter(Boolean) as Record<string, unknown>[];
  if (!and.length) return {};
  if (and.length === 1) return and[0]!;
  return { AND: and };
}

function buildSearchWhere(meta: DocMeta, query: string): Record<string, unknown> | undefined {
  if (!query.trim()) return undefined;
  const fields = meta.searchFields.length
    ? meta.searchFields
    : meta.fields.filter((f) => f.searchable).map((f) => f.fieldname);
  if (!fields.length) return undefined;
  return {
    OR: fields.map((name) => ({
      [name]: { contains: query, mode: 'insensitive' },
    })),
  };
}

export class ResourceService {
  private readonly registry: DocTypeRegistry;
  private readonly adapter: PersistenceAdapter;

  constructor(options: ResourceServiceOptions) {
    this.registry = options.registry;
    this.adapter = options.adapter;
  }

  private controller(doctype: string): DocControllerHooks | undefined {
    return this.registry.resolveController(doctype) as DocControllerHooks | undefined;
  }

  async list(
    doctype: string,
    principal: PermissionPrincipal,
    params: ResourceListParams = {},
  ): Promise<ResourceListResult> {
    const meta = this.registry.getMeta(doctype);
    checkPermission({ meta, principal, action: 'read' });

    const page = Math.max(1, params.page ?? 1);
    const maxPage = meta.list.maxPageSize ?? 100;
    const defaultPage = meta.list.pageSize ?? 25;
    const limit = Math.min(maxPage, Math.max(1, params.limit ?? defaultPage));

    const softField = meta.persistence.softDeleteField;
    const soft =
      softField && !params.trashed
        ? { [softField]: false }
        : undefined;

    const filterWhere: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(params.filters ?? {})) {
      if (!value || value === 'all') continue;
      if (meta.fieldsByName.has(key) || key.endsWith('Id')) {
        filterWhere[key] = value;
      }
    }

    const searchParams = params.searchParams ?? new URLSearchParams();
    const listOverride = await this.controller(doctype)?.buildListQuery?.({
      meta,
      principal,
      searchParams,
      headers: params.headers,
    });

    const where = mergeWhere([
      soft,
      buildSearchWhere(meta, params.query ?? ''),
      filterWhere,
      listOverride?.where,
    ]);

    const sortField =
      params.sort ||
      meta.list.defaultSort?.fieldname ||
      meta.persistence.creationField ||
      meta.persistence.nameField;
    const sortDir = params.dir || meta.list.defaultSort?.direction || 'asc';
    const orderBy = (listOverride?.orderBy as PersistenceOrderBy | undefined) ?? {
      [sortField]: sortDir,
    };

    const baseQuery = {
      delegate: meta.persistence.delegate,
      where,
      orderBy,
      include: listOverride?.include,
      select: listOverride?.select,
    };

    const [total, data] = await Promise.all([
      this.adapter.count({
        delegate: baseQuery.delegate,
        where: baseQuery.where,
      }),
      this.adapter.findMany({
        ...baseQuery,
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { data, pagination: { total, page, limit } };
  }

  async get(
    doctype: string,
    name: string,
    principal: PermissionPrincipal,
  ): Promise<DocData | null> {
    const meta = this.registry.getMeta(doctype);
    checkPermission({ meta, principal, action: 'read' });
    return this.adapter.findUnique({
      delegate: meta.persistence.delegate,
      nameField: meta.persistence.nameField,
      name,
    });
  }

  async create(
    doctype: string,
    data: DocData,
    principal: PermissionPrincipal,
  ): Promise<DocData> {
    const meta = this.registry.getMeta(doctype);
    const doc = new Document({
      meta,
      adapter: this.adapter,
      principal,
      controller: this.controller(doctype),
      data,
    });
    return doc.insert();
  }

  async update(
    doctype: string,
    name: string,
    data: DocData,
    principal: PermissionPrincipal,
  ): Promise<DocData> {
    const meta = this.registry.getMeta(doctype);
    const existing = await this.adapter.findUnique({
      delegate: meta.persistence.delegate,
      nameField: meta.persistence.nameField,
      name,
    });
    if (!existing) throw new Error('Record not found');

    const doc = new Document({
      meta,
      adapter: this.adapter,
      principal,
      controller: this.controller(doctype),
      data: { ...existing, ...data, [meta.persistence.nameField]: name },
    });
    return doc.save();
  }

  async delete(doctype: string, name: string, principal: PermissionPrincipal): Promise<void> {
    const meta = this.registry.getMeta(doctype);
    const existing = await this.adapter.findUnique({
      delegate: meta.persistence.delegate,
      nameField: meta.persistence.nameField,
      name,
    });
    if (!existing) throw new Error('Record not found');

    const doc = new Document({
      meta,
      adapter: this.adapter,
      principal,
      controller: this.controller(doctype),
      data: existing,
    });
    await doc.delete();
  }
}
