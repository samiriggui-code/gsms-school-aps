import type { TFunction } from 'i18next';
import type { MenuConfig } from '@/config/types';
import { translateMenuTitle } from '@/lib/menu-i18n';

export type MenuSearchEntry = {
  path: string;
  title: string;
  section?: string;
};

/** Pages navigables extraites du menu sidebar (recherche header). */
export function flattenMenuPaths(
  items: MenuConfig,
  t: TFunction,
  sectionTitle?: string,
): MenuSearchEntry[] {
  const out: MenuSearchEntry[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    if (item.separator || item.disabled) continue;

    const title = translateMenuTitle(item, t);
    const section = item.heading ?? sectionTitle;

    if (item.path && !seen.has(item.path)) {
      seen.add(item.path);
      out.push({ path: item.path, title, section });
    }

    if (item.children?.length) {
      out.push(...flattenMenuPaths(item.children, t, title || section));
    }
  }

  return out;
}
