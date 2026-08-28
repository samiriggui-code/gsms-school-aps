import type { TFunction } from 'i18next';
import type { MenuItem } from '@/config/types';

export function menuPathToKey(path: string): string {
  return path.replace(/^\//, '').replace(/\//g, '.');
}

export function translateMenuTitle(item: MenuItem, t: TFunction): string {
  if (item.titleKey) return t(item.titleKey);
  if (item.path) {
    const key = menuPathToKey(item.path);
    const translated = t(`menu.byPath.${key}`, {
      defaultValue: '',
      returnObjects: true,
    });
    if (translated && typeof translated === 'string' && translated !== `menu.byPath.${key}`) {
      return translated;
    }
    // Hub imbriqué (ex. docs-circuits) : clé objet avec titre `_self` / `title`
    if (translated && typeof translated === 'object') {
      const obj = translated as Record<string, unknown>;
      const nested =
        (typeof obj._self === 'string' && obj._self) ||
        (typeof obj.title === 'string' && obj.title) ||
        '';
      if (nested) return nested;
    }
  }
  if (item.heading) {
    const translated = t(`menu.headings.${item.heading}`, { defaultValue: '' });
    if (translated) return translated;
  }
  return item.title ?? item.heading ?? '';
}

export function translateMenuItems(items: MenuItem[], t: TFunction): MenuItem[] {
  return items.map((item) => ({
    ...item,
    title: translateMenuTitle(item, t),
    heading: item.heading
      ? t(`menu.headings.${item.heading}`, { defaultValue: item.heading })
      : item.heading,
    children: item.children ? translateMenuItems(item.children, t) : undefined,
  }));
}
