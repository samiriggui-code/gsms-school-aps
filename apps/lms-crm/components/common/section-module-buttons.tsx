'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { translateMenuTitleOrFallback } from '@/lib/menu-i18n';

export type SectionModuleButtonItem = {
  path: string;
  icon?: LucideIcon;
};

/** Boutons cliquables vers les modules d'une section — utilisé en `footerExtra` de `SectionWelcomeCallout`. */
export function SectionModuleButtons({ modules }: { modules: SectionModuleButtonItem[] }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {modules.map(({ path, icon: Icon }) => (
        <Button key={path} variant="outline" size="sm" asChild>
          <Link href={path}>
            {Icon ? <Icon className="size-3.5 me-1.5" /> : null}
            {translateMenuTitleOrFallback(path, t)}
          </Link>
        </Button>
      ))}
    </div>
  );
}
