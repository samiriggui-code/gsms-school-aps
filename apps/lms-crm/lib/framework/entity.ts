import { z } from 'zod';

/** Types de champs supportés par le générateur (DocType-like). */
export type FieldType =
  | 'string'
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'select'
  | 'relation'
  | 'json'
  | 'file';

export type EntityFieldOption = { value: string; label: string };

export type EntityField = {
  name: string;
  type: FieldType;
  label: string;
  required?: boolean;
  unique?: boolean;
  /** Caché en écriture (id, timestamps…). */
  readOnly?: boolean;
  /** Inclus dans la recherche texte `query`. */
  search?: boolean;
  options?: EntityFieldOption[];
  relation?: { entity: string; displayField: string };
  /**
   * Si défini, le champ n’apparaît dans la réponse que pour ces roleSlug.
   * Non appliqué = visible pour tous les lecteurs autorisés sur l’entité.
   */
  visibleFor?: string[];
};

export type EntityMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export type EntityPermissions = {
  GET: string;
  POST: string;
  PATCH: string;
  DELETE: string;
};

export type EntityListContext = {
  searchParams: URLSearchParams;
  headers: Headers;
};

export type EntityListOptions = {
  searchFields?: string[];
  /** Champs scalaires à sélectionner (en plus des `fields`). */
  extraSelect?: Record<string, boolean>;
  /** Include Prisma (relations dépliées). */
  include?: Record<string, unknown>;
  /** Tri custom — clé = param `sort`, valeur = clause orderBy Prisma. */
  sortMap?: Record<string, (dir: 'asc' | 'desc') => unknown>;
  defaultSort?: string;
  defaultDir?: 'asc' | 'desc';
  /** Filtres dynamiques (headers, query params métier). */
  dynamicWhere?: (ctx: EntityListContext) => Record<string, unknown> | undefined;
};

export type EntityHookContext = {
  userId: string;
  headers: Headers;
  data: Record<string, unknown>;
  record?: Record<string, unknown>;
};

export type EntityHooks = {
  beforeCreate?: (ctx: EntityHookContext) => Promise<Record<string, unknown> | void>;
  afterCreate?: (ctx: EntityHookContext) => Promise<void>;
  beforeUpdate?: (ctx: EntityHookContext) => Promise<Record<string, unknown> | void>;
  afterUpdate?: (ctx: EntityHookContext) => Promise<void>;
  beforeDelete?: (ctx: EntityHookContext) => Promise<void>;
  afterDelete?: (ctx: EntityHookContext) => Promise<void>;
};

export type EntityDefinition = {
  name: string;
  label: string;
  /** Nom du delegate Prisma (`user`, `userRole`, `course`…). */
  prismaModel: string;
  fields: EntityField[];
  permissions: EntityPermissions;
  list?: EntityListOptions;
  hooks?: EntityHooks;
  /** Soft-delete via `isTrashed` si true. */
  softDelete?: boolean;
};

function fieldToZod(field: EntityField): z.ZodTypeAny {
  let schema: z.ZodTypeAny;
  switch (field.type) {
    case 'number':
      schema = z.coerce.number();
      break;
    case 'boolean':
      schema = z.coerce.boolean();
      break;
    case 'date':
      schema = z.coerce.date();
      break;
    case 'json':
      schema = z.unknown();
      break;
    case 'select':
      schema = field.options?.length
        ? z.enum(field.options.map((o) => o.value) as [string, ...string[]])
        : z.string();
      break;
    case 'file':
    case 'relation':
    case 'text':
    case 'string':
    default:
      schema = z.string();
      break;
  }
  if (!field.required) {
    schema = schema.optional().nullable();
  }
  return schema;
}

/** Schema Zod pour create (champs non readOnly). */
export function buildCreateSchema(def: EntityDefinition): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of def.fields) {
    if (field.readOnly || field.name === 'id') continue;
    shape[field.name] = fieldToZod(field);
  }
  return z.object(shape);
}

/** Schema Zod pour update (tous optionnels sauf id). */
export function buildUpdateSchema(def: EntityDefinition): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of def.fields) {
    if (field.readOnly || field.name === 'id') continue;
    shape[field.name] = fieldToZod({ ...field, required: false });
  }
  return z.object(shape).partial();
}

/** Expose une définition sérialisable au frontend (sans hooks). */
export function serializeEntitySchema(def: EntityDefinition) {
  return {
    name: def.name,
    label: def.label,
    softDelete: Boolean(def.softDelete),
    fields: def.fields.map((f) => ({
      name: f.name,
      type: f.type,
      label: f.label,
      required: Boolean(f.required),
      readOnly: Boolean(f.readOnly),
      options: f.options,
      relation: f.relation,
      visibleFor: f.visibleFor,
    })),
  };
}
