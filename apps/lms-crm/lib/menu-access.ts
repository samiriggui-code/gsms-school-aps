import type { MenuItem } from '@/config/types';
import { NOTIFICATIONS_VIEW_PERMISSION } from '@/lib/notifications-scope';
import { isSuperAdminRole } from '@/lib/auth/crm-permissions';

export type MenuAccessContext = {
  roleSlug?: string | null;
  permissionSlugs?: ReadonlySet<string>;
};

/** Visibilité item menu latéral (rôle + permission optionnelle). */
export function isMenuItemVisible(
  item: MenuItem,
  ctx: MenuAccessContext,
): boolean {
  if (isSuperAdminRole(ctx.roleSlug)) return true;

  if (item.roleSlugs?.length) {
    const slug = ctx.roleSlug ?? '';
    if (!item.roleSlugs.includes(slug)) return false;
  }

  if (item.permissionSlug) {
    const perms = ctx.permissionSlugs;
    if (!perms?.size) return false;
    if (!perms.has(item.permissionSlug)) return false;
  }

  if (
    item.permissionSlug === NOTIFICATIONS_VIEW_PERMISSION &&
    !ctx.permissionSlugs?.size &&
    !item.roleSlugs?.length
  ) {
    return false;
  }

  return true;
}

function filterMenuItem(item: MenuItem, ctx: MenuAccessContext): MenuItem | null {
  if (item.heading) return item;

  if (!isMenuItemVisible(item, ctx)) return null;

  if (item.children?.length) {
    const children = item.children
      .map((child) => filterMenuItem(child, ctx))
      .filter((child): child is MenuItem => child !== null);

    if (children.length === 0 && !item.path) return null;

    return { ...item, children };
  }

  return item;
}

export function filterMenuConfig(
  items: MenuItem[],
  ctx: MenuAccessContext,
): MenuItem[] {
  const out: MenuItem[] = [];
  let pendingHeading: MenuItem | null = null;

  for (const item of items) {
    if (item.heading) {
      pendingHeading = item;
      continue;
    }

    const filtered = filterMenuItem(item, ctx);
    if (!filtered) continue;

    if (pendingHeading) {
      out.push(pendingHeading);
      pendingHeading = null;
    }
    out.push(filtered);
  }

  return out;
}
