import type {
  DocAction,
  DocMeta,
  DocPermission,
  EffectiveDocPermissions,
  PermissionPrincipal,
  RecordPermissionCondition,
} from '../types';

function evaluateRecordCondition(
  condition: RecordPermissionCondition,
  document: Record<string, unknown>,
  principal: PermissionPrincipal,
  ownerField?: string,
): boolean {
  switch (condition.type) {
    case 'owner': {
      if (!ownerField) return false;
      const owner = document[ownerField];
      return owner != null && String(owner) === principal.id;
    }
    case 'fieldEqualsPrincipal': {
      const fieldValue = document[condition.fieldname];
      const principalValue =
        condition.principalClaim === 'id' ? principal.id : principal.roleSlug;
      return fieldValue != null && String(fieldValue) === String(principalValue);
    }
    default: {
      const _exhaustive: never = condition;
      return _exhaustive;
    }
  }
}

function matchesRecordScope(
  perm: DocPermission,
  document: Record<string, unknown> | undefined,
  ownerField: string | undefined,
  principal: PermissionPrincipal,
): boolean {
  const hasRecordConstraint = perm.ifOwner === true || perm.condition != null;
  if (!hasRecordConstraint) return true;
  if (!document) return false;

  if (perm.ifOwner && ownerField) {
    const owner = document[ownerField];
    if (owner != null && String(owner) === principal.id) return true;
  }

  if (
    perm.condition &&
    evaluateRecordCondition(perm.condition, document, principal, ownerField)
  ) {
    return true;
  }

  return false;
}

function actionAllowed(perm: DocPermission, action: DocAction): boolean {
  switch (action) {
    case 'read':
      return !!perm.read;
    case 'create':
      return !!perm.create;
    case 'write':
      return !!perm.write;
    case 'delete':
      return !!perm.delete;
    case 'submit':
      return !!perm.submit;
    case 'cancel':
      return !!perm.cancel;
    case 'amend':
      return !!perm.amend;
    case 'report':
      return !!perm.report;
    case 'export':
      return !!perm.export;
    case 'import':
      return !!perm.import;
    case 'print':
      return !!perm.print;
    case 'email':
      return !!perm.email;
    case 'share':
      return !!perm.share;
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

function matchesRole(perm: DocPermission, principal: PermissionPrincipal): boolean {
  if (perm.role === '*') return true;
  return perm.role === principal.roleSlug;
}

function matchesRequires(perm: DocPermission, principal: PermissionPrincipal): boolean {
  const req = perm.requires;
  if (!req) return true;
  if (req.anyPermissionSlugs?.length) {
    if (!req.anyPermissionSlugs.some((s) => principal.permissionSlugs.has(s))) return false;
  }
  if (req.allPermissionSlugs?.length) {
    if (!req.allPermissionSlugs.every((s) => principal.permissionSlugs.has(s))) return false;
  }
  return true;
}

function permissionMatches(
  perm: DocPermission,
  principal: PermissionPrincipal,
  action: DocAction,
  document: Record<string, unknown> | undefined,
  ownerField: string | undefined,
): boolean {
  return (
    matchesRole(perm, principal) &&
    matchesRequires(perm, principal) &&
    actionAllowed(perm, action) &&
    matchesRecordScope(perm, document, ownerField, principal)
  );
}

function hasRecordConstraint(perm: DocPermission): boolean {
  return perm.ifOwner === true || perm.condition != null;
}

function permissionMatchesForList(
  perm: DocPermission,
  principal: PermissionPrincipal,
  action: DocAction,
): boolean {
  return (
    matchesRole(perm, principal) &&
    matchesRequires(perm, principal) &&
    actionAllowed(perm, action)
  );
}

function conditionToWhere(
  perm: DocPermission,
  principal: PermissionPrincipal,
  ownerField: string | undefined,
): Record<string, unknown> | undefined {
  const parts: Record<string, unknown>[] = [];

  if (perm.ifOwner && ownerField) {
    parts.push({ [ownerField]: principal.id });
  }

  if (perm.condition?.type === 'owner' && ownerField) {
    parts.push({ [ownerField]: principal.id });
  }

  if (perm.condition?.type === 'fieldEqualsPrincipal') {
    const value =
      perm.condition.principalClaim === 'id' ? principal.id : principal.roleSlug;
    parts.push({ [perm.condition.fieldname]: value });
  }

  if (!parts.length) return undefined;
  if (parts.length === 1) return parts[0]!;
  return { OR: parts };
}

/** List gate — role/requires/action only (record scope applied separately in SQL). */
export function hasListPermission(input: {
  meta: DocMeta;
  principal: PermissionPrincipal;
  action: DocAction;
}): boolean {
  const { meta, principal, action } = input;
  if (principal.isSystemManager) return true;
  if (meta.flags.isChild) return false;
  return meta.permissions.some((perm) =>
    permissionMatchesForList(perm, principal, action),
  );
}

/** OR-filters for record-scoped read rules; undefined when user sees all rows. */
export function buildRecordScopeWhere(input: {
  meta: DocMeta;
  principal: PermissionPrincipal;
  action: DocAction;
}): Record<string, unknown> | undefined {
  const { meta, principal, action } = input;
  if (principal.isSystemManager) return undefined;

  const ownerField = meta.persistence?.ownerField;
  const matching = meta.permissions.filter((perm) =>
    permissionMatchesForList(perm, principal, action),
  );
  if (!matching.length) return undefined;

  if (matching.some((perm) => !hasRecordConstraint(perm))) return undefined;

  const orParts: Record<string, unknown>[] = [];
  for (const perm of matching) {
    const clause = conditionToWhere(perm, principal, ownerField);
    if (clause) orParts.push(clause);
  }

  if (!orParts.length) return { id: '__none__' };
  if (orParts.length === 1) return orParts[0]!;
  return { OR: orParts };
}

export function checkListPermission(input: {
  meta: DocMeta;
  principal: PermissionPrincipal;
  action: DocAction;
}): void {
  if (!hasListPermission(input)) {
    throw new Error(`Permission denied: ${input.action} on ${input.meta.name}`);
  }
}

export function hasPermission(input: {
  meta: DocMeta;
  principal: PermissionPrincipal;
  action: DocAction;
  /** When set, record-scoped rules (`ifOwner`, `condition`) are evaluated. */
  document?: Record<string, unknown>;
}): boolean {
  const { meta, principal, action, document } = input;
  if (principal.isSystemManager) return true;
  if (meta.flags.isChild) {
    // Child inherits parent — caller must check parent. Fail closed if checked alone.
    return false;
  }
  const ownerField = meta.persistence?.ownerField;
  return meta.permissions.some((perm) =>
    permissionMatches(perm, principal, action, document, ownerField),
  );
}

export function checkPermission(input: {
  meta: DocMeta;
  principal: PermissionPrincipal;
  action: DocAction;
}): void {
  if (!hasPermission(input)) {
    throw new Error(`Permission denied: ${input.action} on ${input.meta.name}`);
  }
}

export function effectivePermissions(
  meta: DocMeta,
  principal: PermissionPrincipal,
): EffectiveDocPermissions {
  const maxLevel = (action: 'read' | 'write'): 0 | 1 | 2 | null => {
    if (principal.isSystemManager) return 2;
    let max: 0 | 1 | 2 | null = null;
    for (const perm of meta.permissions) {
      if (!matchesRole(perm, principal) || !matchesRequires(perm, principal)) continue;
      if (!actionAllowed(perm, action)) continue;
      const level = perm.permlevel;
      if (max === null || level > max) max = level;
    }
    return max;
  };

  return {
    read: hasPermission({ meta, principal, action: 'read' }),
    create: hasPermission({ meta, principal, action: 'create' }),
    write: hasPermission({ meta, principal, action: 'write' }),
    delete: hasPermission({ meta, principal, action: 'delete' }),
    submit: hasPermission({ meta, principal, action: 'submit' }),
    cancel: hasPermission({ meta, principal, action: 'cancel' }),
    maxReadPermlevel: maxLevel('read'),
    maxWritePermlevel: maxLevel('write'),
  };
}

export function buildMetaResponse(meta: DocMeta, principal: PermissionPrincipal) {
  const maxRead = effectivePermissions(meta, principal).maxReadPermlevel;
  const fields =
    maxRead === null && !principal.isSystemManager
      ? []
      : meta.fields.filter((f) => (f.permlevel ?? 0) <= (maxRead ?? 0) || principal.isSystemManager);

  return {
    name: meta.name,
    module: meta.module,
    label: meta.label,
    schemaVersion: meta.schemaVersion,
    metadataVersion: meta.metadataVersion,
    fields,
    permissions: effectivePermissions(meta, principal),
    naming: meta.naming,
    flags: { ...meta.flags },
    workflow: meta.workflow,
    actions: meta.commands,
    searchFields: meta.searchFields,
    aliases: meta.aliases,
  };
}
