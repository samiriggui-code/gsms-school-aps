import type {
  DocAction,
  DocMeta,
  DocPermission,
  EffectiveDocPermissions,
  PermissionPrincipal,
} from '../types';

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

export function hasPermission(input: {
  meta: DocMeta;
  principal: PermissionPrincipal;
  action: DocAction;
}): boolean {
  const { meta, principal, action } = input;
  if (principal.isSystemManager) return true;
  if (meta.flags.isChild) {
    // Child inherits parent — caller must check parent. Fail closed if checked alone.
    return false;
  }
  return meta.permissions.some(
    (perm) =>
      matchesRole(perm, principal) &&
      matchesRequires(perm, principal) &&
      actionAllowed(perm, action),
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
