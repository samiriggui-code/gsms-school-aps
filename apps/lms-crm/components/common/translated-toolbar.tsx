'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { useTranslation } from '@/hooks/useTranslation';
import { menuPathToKey, translateMenuTitle } from '@/lib/menu-i18n';

type Props = {
  /** Override auto-detected pathname (e.g. nested layout). */
  path?: string;
  /** Fallback if no description key exists. */
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function TranslatedToolbarHeading({ path, description, actions, className }: Props) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const routePath = path ?? pathname;
  const key = menuPathToKey(routePath);
  const title = translateMenuTitle({ path: routePath, title: '' }, t);
  const desc =
    t(`pages.descriptions.${key}`, { defaultValue: '' }) ||
    description ||
    '';

  return (
    <Toolbar className={className}>
      <ToolbarHeading>
        <ToolbarTitle>{title}</ToolbarTitle>
        {desc ? <ToolbarDescription>{desc}</ToolbarDescription> : null}
      </ToolbarHeading>
      {actions ? <ToolbarActions>{actions}</ToolbarActions> : null}
    </Toolbar>
  );
}

export function usePageToolbarMeta(path?: string) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const routePath = path ?? pathname;
  const key = menuPathToKey(routePath);
  const rawDesc = t(`pages.descriptions.${key}`, {
    defaultValue: '',
    returnObjects: true,
  });
  const description =
    typeof rawDesc === 'string' && rawDesc !== `pages.descriptions.${key}`
      ? rawDesc
      : rawDesc && typeof rawDesc === 'object'
        ? String(
            (rawDesc as { _self?: string; title?: string })._self ||
              (rawDesc as { title?: string }).title ||
              '',
          )
        : '';

  return {
    key,
    title: translateMenuTitle({ path: routePath, title: '' }, t),
    description,
  };
}
