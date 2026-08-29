import type { DocData, DocMeta, PermissionPrincipal } from '../types';
import { checkPermission } from '../permissions/permission-engine';
import type { PersistenceAdapter } from '../persistence/adapter';
import { allocateName, pickWritableFields, validateRequired } from '../naming/naming-engine';

export type DocLifecycleContext = {
  meta: DocMeta;
  principal: PermissionPrincipal;
  data: DocData;
  record?: DocData | null;
};

export type DocListQueryContext = {
  meta: DocMeta;
  principal: PermissionPrincipal;
  searchParams: URLSearchParams;
  headers?: Headers;
};

export type DocListQueryOverride = {
  where?: Record<string, unknown>;
  include?: Record<string, unknown>;
  select?: Record<string, unknown>;
  orderBy?: Record<string, unknown>;
};

export type DocControllerHooks = {
  beforeInsert?: (ctx: DocLifecycleContext) => Promise<DocData | void>;
  afterInsert?: (ctx: DocLifecycleContext) => Promise<void>;
  beforeSave?: (ctx: DocLifecycleContext) => Promise<DocData | void>;
  afterSave?: (ctx: DocLifecycleContext) => Promise<void>;
  beforeDelete?: (ctx: DocLifecycleContext) => Promise<void>;
  afterDelete?: (ctx: DocLifecycleContext) => Promise<void>;
  /** Optional list shaping (filters / include) — domain-owned. */
  buildListQuery?: (
    ctx: DocListQueryContext,
  ) => DocListQueryOverride | void | Promise<DocListQueryOverride | void>;
};

export type DocumentOptions = {
  meta: DocMeta;
  adapter: PersistenceAdapter;
  principal: PermissionPrincipal;
  controller?: DocControllerHooks;
  data?: DocData;
};

/**
 * Frappe-like document runtime — no tenant_id, no Prisma import.
 */
export class Document {
  readonly meta: DocMeta;
  private readonly adapter: PersistenceAdapter;
  private readonly principal: PermissionPrincipal;
  private readonly controller?: DocControllerHooks;
  data: DocData;

  constructor(options: DocumentOptions) {
    this.meta = options.meta;
    this.adapter = options.adapter;
    this.principal = options.principal;
    this.controller = options.controller;
    this.data = { ...(options.data ?? {}) };
  }

  get name(): string | undefined {
    const field = this.meta.persistence.nameField;
    const v = this.data[field] ?? this.data.name;
    return typeof v === 'string' ? v : undefined;
  }

  async insert(): Promise<DocData> {
    checkPermission({ meta: this.meta, principal: this.principal, action: 'create' });
    let payload = pickWritableFields(this.meta, this.data, 'create');
    validateRequired(this.meta, { ...this.data, ...payload }, 'create');

    const name = allocateName(this.meta.naming, { ...this.data, ...payload }, this.meta.persistence.nameField);
    payload = { ...payload, [this.meta.persistence.nameField]: name };

    if (this.meta.persistence.ownerField && this.principal.id) {
      payload[this.meta.persistence.ownerField] = this.principal.id;
    }

    if (this.controller?.beforeInsert) {
      const next = await this.controller.beforeInsert({
        meta: this.meta,
        principal: this.principal,
        data: payload,
      });
      if (next) payload = next;
    }

    const created = await this.adapter.create({
      delegate: this.meta.persistence.delegate,
      nameField: this.meta.persistence.nameField,
      name,
      data: payload,
    });
    this.data = created;

    if (this.controller?.afterInsert) {
      await this.controller.afterInsert({
        meta: this.meta,
        principal: this.principal,
        data: payload,
        record: created,
      });
    }
    return created;
  }

  async save(): Promise<DocData> {
    checkPermission({ meta: this.meta, principal: this.principal, action: 'write' });
    const name = this.name;
    if (!name) throw new Error('Cannot save Document without name');

    let payload = pickWritableFields(this.meta, this.data, 'update');
    if (this.controller?.beforeSave) {
      const next = await this.controller.beforeSave({
        meta: this.meta,
        principal: this.principal,
        data: payload,
        record: this.data,
      });
      if (next) payload = next;
    }

    const updated = await this.adapter.update({
      delegate: this.meta.persistence.delegate,
      nameField: this.meta.persistence.nameField,
      name,
      data: payload,
    });
    this.data = updated;

    if (this.controller?.afterSave) {
      await this.controller.afterSave({
        meta: this.meta,
        principal: this.principal,
        data: payload,
        record: updated,
      });
    }
    return updated;
  }

  async delete(): Promise<void> {
    checkPermission({ meta: this.meta, principal: this.principal, action: 'delete' });
    const name = this.name;
    if (!name) throw new Error('Cannot delete Document without name');

    if (this.controller?.beforeDelete) {
      await this.controller.beforeDelete({
        meta: this.meta,
        principal: this.principal,
        data: {},
        record: this.data,
      });
    }

    const soft = this.meta.persistence.softDeleteField;
    if (soft || this.meta.flags.softDelete) {
      const field = soft ?? 'isTrashed';
      await this.adapter.update({
        delegate: this.meta.persistence.delegate,
        nameField: this.meta.persistence.nameField,
        name,
        data: { [field]: true },
      });
    } else {
      await this.adapter.delete({
        delegate: this.meta.persistence.delegate,
        nameField: this.meta.persistence.nameField,
        name,
      });
    }

    if (this.controller?.afterDelete) {
      await this.controller.afterDelete({
        meta: this.meta,
        principal: this.principal,
        data: {},
        record: this.data,
      });
    }
  }

  async reload(): Promise<DocData> {
    const name = this.name;
    if (!name) throw new Error('Cannot reload Document without name');
    const row = await this.adapter.findUnique({
      delegate: this.meta.persistence.delegate,
      nameField: this.meta.persistence.nameField,
      name,
    });
    if (!row) throw new Error('Record not found');
    this.data = row;
    return row;
  }
}
