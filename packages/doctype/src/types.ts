/** @repo/doctype — GSMS DocType Framework V2 (Vague 1).
 * Domain-agnostic. No apps/, no Prisma client, no tenant_id, no LMS/Qualiopi imports.
 */

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { readonly [key: string]: JsonValue };
export type DocData = Record<string, unknown>;

export type DocStatus = 'DRAFT' | 'SUBMITTED' | 'CANCELLED';

export type DocAction =
  | 'read'
  | 'create'
  | 'write'
  | 'delete'
  | 'submit'
  | 'cancel'
  | 'amend'
  | 'report'
  | 'export'
  | 'import'
  | 'print'
  | 'email'
  | 'share';

export type DocFieldType =
  | 'Data'
  | 'Text'
  | 'Long Text'
  | 'Integer'
  | 'Decimal'
  | 'Boolean'
  | 'Date'
  | 'Datetime'
  | 'Time'
  | 'Select'
  | 'Link'
  | 'Table'
  | 'JSON'
  | 'File'
  | 'Image'
  | 'Currency'
  | 'Percent'
  | 'Email'
  | 'Phone';

export type DocFieldOption = { value: string; label: string; disabled?: boolean };

export type DocField = {
  fieldname: string;
  label: string;
  fieldtype: DocFieldType;
  required?: boolean;
  default?: JsonValue;
  options?: string | readonly DocFieldOption[];
  readOnly?: boolean;
  hidden?: boolean;
  unique?: boolean;
  searchable?: boolean;
  index?: boolean;
  permlevel?: 0 | 1 | 2;
  dependsOn?: string;
  description?: string;
  maxLength?: number;
  allowOnSubmit?: boolean;
  linkDisplayField?: string;
  parentfield?: string;
};

export type NamingStrategy = 'UUID_INTERNAL' | 'SERIES' | 'FIELD' | 'MANUAL';

export type Naming =
  | { strategy: 'UUID_INTERNAL' }
  | { strategy: 'SERIES'; pattern: string; counterKey?: string }
  | { strategy: 'FIELD'; fieldname: string }
  | { strategy: 'MANUAL' };

export type DocTypeFlags = {
  isChild: boolean;
  isSingle: boolean;
  isVirtual: boolean;
  isSubmittable: boolean;
  trackChanges?: boolean;
  softDelete?: boolean;
};

export type PermissionRequirement = {
  anyPermissionSlugs?: readonly string[];
  allPermissionSlugs?: readonly string[];
};

export type RecordPermissionCondition =
  | { type: 'owner' }
  | { type: 'fieldEqualsPrincipal'; fieldname: string; principalClaim: 'id' | 'roleSlug' };

export type DocPermission = {
  role: string | '*';
  permlevel: 0 | 1 | 2;
  ifOwner?: boolean;
  read?: boolean;
  write?: boolean;
  create?: boolean;
  delete?: boolean;
  submit?: boolean;
  cancel?: boolean;
  amend?: boolean;
  report?: boolean;
  export?: boolean;
  import?: boolean;
  print?: boolean;
  email?: boolean;
  share?: boolean;
  requires?: PermissionRequirement;
  condition?: RecordPermissionCondition;
};

export type PermissionPrincipal = {
  id: string;
  roleSlug: string | null;
  permissionSlugs: ReadonlySet<string>;
  isSystemManager: boolean;
};

export type DocCommandDefinition = {
  name: string;
  label: string;
  permission: DocAction;
  allowedDocstatus?: readonly DocStatus[];
};

export type DocListConfiguration = {
  searchFields?: readonly string[];
  defaultSort?: { fieldname: string; direction: 'asc' | 'desc' };
  pageSize?: number;
  maxPageSize?: number;
};

/** Maps DocType to existing Prisma table without importing Prisma. */
export type PersistenceBinding = {
  table: string;
  delegate: string;
  nameField: string;
  ownerField?: string;
  creationField?: string;
  modifiedField?: string;
  modifiedByField?: string;
  docstatusField?: string;
  softDeleteField?: string;
};

export type DocTypeDefinition = {
  name: string;
  module: string;
  label: string;
  table: string;
  schemaVersion: number;
  fields: readonly DocField[];
  permissions: readonly DocPermission[];
  naming: Naming;
  flags: DocTypeFlags;
  controller?: string;
  workflow?: string;
  commands?: readonly DocCommandDefinition[];
  list?: DocListConfiguration;
  persistence: PersistenceBinding;
  /** Legacy /api/entities aliases during cutover. */
  aliases?: readonly string[];
};

export type DocMeta = {
  name: string;
  module: string;
  label: string;
  table: string;
  schemaVersion: number;
  metadataVersion: string;
  fields: readonly DocField[];
  fieldsByName: ReadonlyMap<string, DocField>;
  permissions: readonly DocPermission[];
  naming: Naming;
  flags: Readonly<DocTypeFlags>;
  commands: readonly DocCommandDefinition[];
  list: Readonly<DocListConfiguration>;
  controller?: string;
  workflow?: string;
  persistence: Readonly<PersistenceBinding>;
  systemFields: readonly DocField[];
  linkFields: readonly DocField[];
  tableFields: readonly DocField[];
  searchFields: readonly string[];
  source: DocTypeDefinition;
  aliases: readonly string[];
};

export type EffectiveDocPermissions = {
  read: boolean;
  create: boolean;
  write: boolean;
  delete: boolean;
  submit: boolean;
  cancel: boolean;
  maxReadPermlevel: 0 | 1 | 2 | null;
  maxWritePermlevel: 0 | 1 | 2 | null;
};

export type DocMetaResponse = {
  name: string;
  module: string;
  label: string;
  schemaVersion: number;
  metadataVersion: string;
  fields: readonly DocField[];
  permissions: EffectiveDocPermissions;
  naming: Naming;
  flags: DocTypeFlags;
  workflow?: string;
  actions: readonly DocCommandDefinition[];
  searchFields: readonly string[];
  aliases: readonly string[];
};

export const SYSTEM_FIELDS: readonly DocField[] = [
  { fieldname: 'name', label: 'Name', fieldtype: 'Data', readOnly: true, required: true },
  { fieldname: 'owner', label: 'Owner', fieldtype: 'Data', readOnly: true },
  { fieldname: 'creation', label: 'Creation', fieldtype: 'Datetime', readOnly: true },
  { fieldname: 'modified', label: 'Modified', fieldtype: 'Datetime', readOnly: true },
  { fieldname: 'modified_by', label: 'Modified By', fieldtype: 'Data', readOnly: true },
  { fieldname: 'docstatus', label: 'DocStatus', fieldtype: 'Select', readOnly: true },
] as const;
