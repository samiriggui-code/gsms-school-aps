import {
  SYSTEM_FIELDS,
  type DocField,
  type DocMeta,
  type DocTypeDefinition,
  type DocTypeFlags,
} from '../types';

function assertFlags(flags: DocTypeFlags, name: string): void {
  const exclusive = [flags.isChild, flags.isSingle, flags.isVirtual].filter(Boolean).length;
  if (exclusive > 1) {
    throw new Error(`DocType ${name}: isChild/isSingle/isVirtual are mutually exclusive`);
  }
  if (flags.isChild && flags.isSubmittable) {
    throw new Error(`DocType ${name}: child cannot be submittable`);
  }
}

function hashMeta(def: DocTypeDefinition): string {
  const payload = JSON.stringify({
    name: def.name,
    schemaVersion: def.schemaVersion,
    fields: def.fields.map((f) => f.fieldname),
    permissions: def.permissions.length,
    naming: def.naming,
    flags: def.flags,
  });
  let h = 0;
  for (let i = 0; i < payload.length; i++) h = (h * 31 + payload.charCodeAt(i)) | 0;
  return `v${def.schemaVersion}.${(h >>> 0).toString(16)}`;
}

export function compileDocMeta(def: DocTypeDefinition): DocMeta {
  assertFlags(def.flags, def.name);

  if (!def.name || !def.module || !def.label) {
    throw new Error(`DocType incomplete: name/module/label required`);
  }

  const seen = new Set<string>();
  for (const field of def.fields) {
    if (seen.has(field.fieldname)) {
      throw new Error(`DocType ${def.name}: duplicate field ${field.fieldname}`);
    }
    seen.add(field.fieldname);
  }

  const systemNames = new Set(SYSTEM_FIELDS.map((f) => f.fieldname));
  const userFields = def.fields.filter((f) => !systemNames.has(f.fieldname));
  const fields: DocField[] = [...SYSTEM_FIELDS, ...userFields];

  const fieldsByName = new Map(fields.map((f) => [f.fieldname, f]));
  const linkFields = fields.filter((f) => f.fieldtype === 'Link');
  const tableFields = fields.filter((f) => f.fieldtype === 'Table');
  const searchFields =
    def.list?.searchFields ??
    fields.filter((f) => f.searchable).map((f) => f.fieldname);

  return {
    name: def.name,
    module: def.module,
    label: def.label,
    table: def.table,
    schemaVersion: def.schemaVersion,
    metadataVersion: hashMeta(def),
    fields,
    fieldsByName,
    permissions: def.permissions,
    naming: def.naming,
    flags: { ...def.flags },
    commands: def.commands ?? [],
    list: {
      searchFields,
      defaultSort: def.list?.defaultSort,
      pageSize: def.list?.pageSize ?? 25,
      maxPageSize: def.list?.maxPageSize ?? 100,
    },
    controller: def.controller,
    workflow: def.workflow,
    persistence: { ...def.persistence },
    systemFields: SYSTEM_FIELDS,
    linkFields,
    tableFields,
    searchFields: [...searchFields],
    source: def,
    aliases: def.aliases ?? [],
  };
}
