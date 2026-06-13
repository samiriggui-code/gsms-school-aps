import { type LucideIcon } from 'lucide-react';

export interface MenuItem {
  title?: string;
  /** Clé i18n (ex. `menu.byPath…`) — prioritaire sur `title` / `path`. */
  titleKey?: string;
  icon?: LucideIcon;
  path?: string;
  rootPath?: string;
  childrenIndex?: number;
  heading?: string;
  children?: MenuConfig;
  disabled?: boolean;
  collapse?: boolean;
  collapseTitle?: string;
  expandTitle?: string;
  badge?: string;
  separator?: boolean;
  /** Slugs `UserRole.slug` autorisés (ex. formateur, candidat). */
  roleSlugs?: string[];
  /** Slug `UserPermission.slug` requis (ex. in_app_notifications.view). */
  permissionSlug?: string;
}

export type MenuConfig = MenuItem[];

export interface Settings {
  container: 'fixed' | 'fluid';
  layout: string;
  layouts: {
    demo1: {
      sidebarCollapse: boolean;
      sidebarTheme: 'light' | 'dark';
    };
    demo2: {
      headerSticky: boolean;
      headerStickyOffset: number;
    };
    demo5: {
      headerSticky: boolean;
      headerStickyOffset: number;
    };
    demo7: {
      headerSticky: boolean;
      headerStickyOffset: number;
    };
    demo9: {
      headerSticky: boolean;
      headerStickyOffset: number;
    };
  };
}
