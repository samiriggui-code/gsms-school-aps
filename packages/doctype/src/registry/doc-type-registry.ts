import { compileDocMeta } from '../meta/compile-doc-meta';
import type { DocControllerHooks } from '../document/document';
import type {
  DocMeta,
  DocTypeDefinition,
  Naming,
  PermissionPrincipal,
} from '../types';

/** @deprecated Prefer DocControllerHooks — kept as alias for registrations. */
export type DocController = DocControllerHooks;

export type DocTypeRegistration = {
  definition: DocTypeDefinition;
  controller?: DocControllerHooks;
};

export type DocTypeRegistryOptions = {
  /** DEV only: allow re-register with a different definition (HMR). */
  allowHotReload?: boolean;
};

export class DocTypeRegistry {
  private readonly byName = new Map<string, DocTypeRegistration>();
  private readonly aliasToName = new Map<string, string>();
  private readonly metaCache = new Map<string, DocMeta>();
  private sealed = false;
  private readonly allowHotReload: boolean;

  constructor(options: DocTypeRegistryOptions = {}) {
    this.allowHotReload = options.allowHotReload ?? false;
  }

  registerDefinition(registration: DocTypeRegistration): void {
    const { definition } = registration;
    const key = definition.name;

    if (this.sealed && !this.allowHotReload) {
      throw new Error(`DocTypeRegistry sealed — cannot register ${key}`);
    }

    const existing = this.byName.get(key);
    if (existing) {
      const same =
        JSON.stringify(existing.definition) === JSON.stringify(definition);
      if (same) return;
      if (!this.allowHotReload) {
        throw new Error(`DocType ${key} already registered with different definition`);
      }
      this.metaCache.delete(key);
    }

    this.byName.set(key, registration);
    this.aliasToName.set(key.toLowerCase(), key);
    for (const alias of definition.aliases ?? []) {
      const prev = this.aliasToName.get(alias.toLowerCase());
      if (prev && prev !== key) {
        throw new Error(`Alias ${alias} already maps to ${prev}`);
      }
      this.aliasToName.set(alias.toLowerCase(), key);
    }
  }

  resolveName(nameOrAlias: string): string {
    const resolved = this.aliasToName.get(nameOrAlias.toLowerCase());
    if (!resolved) throw new Error(`Unknown DocType: ${nameOrAlias}`);
    return resolved;
  }

  hasDocType(nameOrAlias: string): boolean {
    return this.aliasToName.has(nameOrAlias.toLowerCase());
  }

  getDefinition(nameOrAlias: string): DocTypeDefinition {
    const name = this.resolveName(nameOrAlias);
    const reg = this.byName.get(name);
    if (!reg) throw new Error(`Unknown DocType: ${nameOrAlias}`);
    return reg.definition;
  }

  getMeta(nameOrAlias: string): DocMeta {
    const name = this.resolveName(nameOrAlias);
    const cached = this.metaCache.get(name);
    if (cached) return cached;
    const meta = compileDocMeta(this.getDefinition(name));
    this.metaCache.set(name, meta);
    return meta;
  }

  listDocTypes(): readonly DocTypeDefinition[] {
    return [...this.byName.values()].map((r) => r.definition);
  }

  resolveController(nameOrAlias: string): DocController | undefined {
    return this.byName.get(this.resolveName(nameOrAlias))?.controller;
  }

  resolveNaming(nameOrAlias: string): Naming {
    return this.getMeta(nameOrAlias).naming;
  }

  assertValid(): void {
    for (const def of this.listDocTypes()) {
      const meta = this.getMeta(def.name);
      for (const field of meta.linkFields) {
        const target = typeof field.options === 'string' ? field.options : null;
        if (!target) {
          throw new Error(`${def.name}.${field.fieldname}: Link requires options DocType name`);
        }
        if (!this.hasDocType(target)) {
          throw new Error(`${def.name}.${field.fieldname}: Link target ${target} not registered`);
        }
      }
      for (const field of meta.tableFields) {
        const child = typeof field.options === 'string' ? field.options : null;
        if (!child || !this.hasDocType(child)) {
          throw new Error(`${def.name}.${field.fieldname}: Table child ${child} missing`);
        }
        if (!this.getMeta(child).flags.isChild) {
          throw new Error(`${def.name}.${field.fieldname}: ${child} must be isChild`);
        }
      }
      if (meta.flags.isChild && meta.permissions.length > 0) {
        throw new Error(`${def.name}: child DocType must not define independent permissions`);
      }
    }
  }

  seal(): void {
    this.assertValid();
    this.sealed = true;
  }

  get isSealed(): boolean {
    return this.sealed;
  }

  /** Clear meta cache for HMR when definition changed. */
  invalidateMeta(doctype?: string): void {
    if (doctype) this.metaCache.delete(this.resolveName(doctype));
    else this.metaCache.clear();
  }
}

export type { PermissionPrincipal };
