'use client';

import { usePathname } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { translateMenuTitle } from '@/lib/menu-i18n';

/** Titre traduit depuis le menu latéral (path explicite ou pathname courant). */
export function useMenuPageTitle(explicitPath?: string) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const path = explicitPath ?? pathname;
  return translateMenuTitle({ path, title: '' }, t);
}
